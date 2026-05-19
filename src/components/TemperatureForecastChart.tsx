import {useMemo, useRef, useState} from 'react';
import type {BusbarCalculationResult, BusbarMaterial} from '../domain/types';
import {formatNumber} from '../utils/format';
import {Panel, StatusBadge} from './ui';

type TemperatureForecastChartProps = {
  result: BusbarCalculationResult;
  material: BusbarMaterial;
};

function niceTicks(min: number, max: number, count: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [min];
  const span = max - min;
  const rawStep = span / (count - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / pow;
  const niceStep = (normalized >= 7.5 ? 10 : normalized >= 3.5 ? 5 : normalized >= 1.5 ? 2 : 1) * pow;
  const start = Math.ceil(min / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = start; v <= max + niceStep * 0.001; v += niceStep) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

export function TemperatureForecastChart({result, material}: TemperatureForecastChartProps) {
  const points = result.thermal.forecast;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const width = 460;
    const height = 280;
    const pad = {left: 52, right: 22, top: 22, bottom: 42};
    const maxTemp = Math.max(material.allowableContinuousTemp_C + 12, ...points.map((point) => point.temperature_C)) + 6;
    const minTemp = Math.min(result.thermal.ambientTemp_C - 4, ...points.map((point) => point.temperature_C));
    const duration_s = Math.max(...points.map((point) => point.time_s), 1);
    const x = (time_s: number) => pad.left + (time_s / duration_s) * (width - pad.left - pad.right);
    const y = (temp_C: number) =>
      pad.top + ((maxTemp - temp_C) / (maxTemp - minTemp)) * (height - pad.top - pad.bottom);
    const tempTicks = niceTicks(minTemp, maxTemp, 5);
    const timeTicksMin = niceTicks(0, duration_s / 60, 6);
    return {
      width,
      height,
      pad,
      duration_s,
      path: points.map((point) => `${x(point.time_s)},${y(point.temperature_C)}`).join(' '),
      ambientY: y(result.thermal.ambientTemp_C),
      limitY: y(material.allowableContinuousTemp_C),
      x,
      y,
      minTemp,
      maxTemp,
      tempTicks,
      timeTicksMin,
    };
  }, [material.allowableContinuousTemp_C, points, result.thermal.ambientTemp_C]);

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredX = hovered ? chart.x(hovered.time_s) : null;

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * chart.width;
    const time_s = ((mouseX - chart.pad.left) / (chart.width - chart.pad.left - chart.pad.right)) * chart.duration_s;
    let nearest = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      const dist = Math.abs(points[i].time_s - time_s);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = i;
      }
    }
    setHoverIndex(nearest);
  };

  return (
    <Panel
      title="Temperature Forecast"
      className="chart-panel"
      actions={
        <div className="panel-actions">
          <StatusBadge status={result.thermal.status} />
          <span>{formatNumber(result.thermal.steadyStateTemp_C, 1)} °C</span>
        </div>
      }
    >
      <svg
        ref={svgRef}
        className="chart-svg"
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        role="img"
        aria-labelledby="chart-title chart-desc"
        data-export-id="temperature-forecast"
      >
        <title id="chart-title">Temperature forecast</title>
        <desc id="chart-desc">
          {`Busbar temperature curve from ambient ${formatNumber(result.thermal.ambientTemp_C, 0)} °C to steady-state ${formatNumber(result.thermal.steadyStateTemp_C, 1)} °C ` +
            `over ${formatNumber(chart.duration_s / 60, 0)} minutes. Material limit ${formatNumber(material.allowableContinuousTemp_C, 0)} °C.`}
        </desc>
        {chart.tempTicks.map((tick) => {
          const yy = chart.y(tick);
          return (
            <g key={`yt-${tick}`}>
              <line x1={chart.pad.left} y1={yy} x2={chart.width - chart.pad.right} y2={yy} className="chart-grid" />
              <text x={chart.pad.left - 6} y={yy + 3} textAnchor="end" className="chart-tick">
                {formatNumber(tick, 0)}
              </text>
            </g>
          );
        })}
        {chart.timeTicksMin.map((tickMin) => {
          const xx = chart.x(tickMin * 60);
          return (
            <g key={`xt-${tickMin}`}>
              <line x1={xx} y1={chart.pad.top} x2={xx} y2={chart.height - chart.pad.bottom} className="chart-grid" />
              <text x={xx} y={chart.height - chart.pad.bottom + 14} textAnchor="middle" className="chart-tick">
                {formatNumber(tickMin, 0)}
              </text>
            </g>
          );
        })}

        <line x1={chart.pad.left} y1={chart.pad.top} x2={chart.pad.left} y2={chart.height - chart.pad.bottom} className="chart-axis" />
        <line x1={chart.pad.left} y1={chart.height - chart.pad.bottom} x2={chart.width - chart.pad.right} y2={chart.height - chart.pad.bottom} className="chart-axis" />

        <line x1={chart.pad.left} y1={chart.ambientY} x2={chart.width - chart.pad.right} y2={chart.ambientY} className="chart-ambient" />
        <line x1={chart.pad.left} y1={chart.limitY} x2={chart.width - chart.pad.right} y2={chart.limitY} className="chart-limit" />

        <polyline points={chart.path} className="chart-line" />

        <text x={12} y={16} className="chart-label">°C</text>
        <text x={chart.width - chart.pad.right} y={chart.height - 6} textAnchor="end" className="chart-label">min</text>
        <text x={chart.width - chart.pad.right - 6} y={chart.ambientY - 5} textAnchor="end" className="chart-label chart-label--ambient">
          Ambient {formatNumber(result.thermal.ambientTemp_C, 0)}
        </text>
        <text x={chart.width - chart.pad.right - 6} y={chart.limitY - 5} textAnchor="end" className="chart-label chart-label--limit">
          Limit {formatNumber(material.allowableContinuousTemp_C, 0)}
        </text>

        {hoveredX !== null && hovered ? (
          <g pointerEvents="none">
            <line x1={hoveredX} y1={chart.pad.top} x2={hoveredX} y2={chart.height - chart.pad.bottom} className="chart-hover-line" />
            <circle cx={hoveredX} cy={chart.y(hovered.temperature_C)} r="4.5" className="chart-dot" />
          </g>
        ) : null}

        <rect
          x={chart.pad.left}
          y={chart.pad.top}
          width={chart.width - chart.pad.left - chart.pad.right}
          height={chart.height - chart.pad.top - chart.pad.bottom}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>
      {hovered ? (
        <div className="chart-readout">
          <span>{formatNumber(hovered.time_s / 60, 0)} min</span>
          <strong>{formatNumber(hovered.temperature_C, 1)} °C</strong>
          <span>{formatNumber(hovered.losses_W_per_m, 1)} W/m loss</span>
          <span>{formatNumber(hovered.cooling_W_per_m, 1)} W/m cooling</span>
        </div>
      ) : (
        <div className="chart-readout chart-readout--hint">
          <span>Hover the chart to inspect any point</span>
        </div>
      )}
      <table className="visually-hidden">
        <caption>Temperature forecast sample points</caption>
        <thead>
          <tr>
            <th>Time (min)</th>
            <th>Temperature (°C)</th>
            <th>Losses (W/m)</th>
            <th>Cooling (W/m)</th>
          </tr>
        </thead>
        <tbody>
          {points
            .filter((_, index) => index % 12 === 0 || index === points.length - 1)
            .map((point) => (
              <tr key={point.time_s}>
                <td>{formatNumber(point.time_s / 60, 0)}</td>
                <td>{formatNumber(point.temperature_C, 1)}</td>
                <td>{formatNumber(point.losses_W_per_m, 1)}</td>
                <td>{formatNumber(point.cooling_W_per_m, 1)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </Panel>
  );
}
