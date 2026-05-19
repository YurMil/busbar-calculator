import {useMemo, useState} from 'react';
import type {BusbarCalculationResult, BusbarMaterial} from '../domain/types';
import {formatNumber} from '../utils/format';
import {Panel, StatusBadge} from './ui';

type TemperatureForecastChartProps = {
  result: BusbarCalculationResult;
  material: BusbarMaterial;
};

export function TemperatureForecastChart({result, material}: TemperatureForecastChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const points = result.thermal.forecast;
  const hovered = hoverIndex === null ? points[Math.floor(points.length * 0.75)] : points[hoverIndex];
  const chart = useMemo(() => {
    const width = 420;
    const height = 260;
    const pad = {left: 46, right: 18, top: 22, bottom: 38};
    const maxTemp = Math.max(material.allowableContinuousTemp_C + 12, ...points.map((point) => point.temperature_C)) + 6;
    const minTemp = Math.min(result.thermal.ambientTemp_C - 4, ...points.map((point) => point.temperature_C));
    const duration = Math.max(...points.map((point) => point.time_s), 1);
    const x = (time_s: number) => pad.left + (time_s / duration) * (width - pad.left - pad.right);
    const y = (temp_C: number) =>
      pad.top + ((maxTemp - temp_C) / (maxTemp - minTemp)) * (height - pad.top - pad.bottom);
    return {
      width,
      height,
      path: points.map((point) => `${x(point.time_s)},${y(point.temperature_C)}`).join(' '),
      ambientY: y(result.thermal.ambientTemp_C),
      limitY: y(material.allowableContinuousTemp_C),
      x,
      y,
      minTemp,
      maxTemp,
    };
  }, [material.allowableContinuousTemp_C, points, result.thermal.ambientTemp_C]);

  return (
    <Panel
      title="Temperature Forecast"
      className="chart-panel"
      actions={
        <div className="panel-actions">
          <StatusBadge status={result.thermal.status} />
          <span>{formatNumber(result.thermal.steadyStateTemp_C, 1)} degC</span>
        </div>
      }
    >
      <svg className="chart-svg" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Temperature forecast chart">
        {[0, 1, 2, 3, 4].map((index) => {
          const y = 24 + index * 42;
          return <line key={index} x1="46" y1={y} x2={chart.width - 18} y2={y} className="chart-grid" />;
        })}
        <line x1="46" y1="22" x2="46" y2={chart.height - 38} className="chart-axis" />
        <line x1="46" y1={chart.height - 38} x2={chart.width - 18} y2={chart.height - 38} className="chart-axis" />
        <line x1="46" y1={chart.ambientY} x2={chart.width - 18} y2={chart.ambientY} className="chart-ambient" />
        <line x1="46" y1={chart.limitY} x2={chart.width - 18} y2={chart.limitY} className="chart-limit" />
        <polyline points={chart.path} className="chart-line" />
        {points.map((point, index) => {
          if (index % 12 !== 0 && index !== points.length - 1) return null;
          return (
            <circle
              key={point.time_s}
              cx={chart.x(point.time_s)}
              cy={chart.y(point.temperature_C)}
              r="3.5"
              className="chart-dot"
              onMouseEnter={() => setHoverIndex(index)}
              onFocus={() => setHoverIndex(index)}
              tabIndex={0}
            />
          );
        })}
        <text x="12" y="18" className="chart-label">
          degC
        </text>
        <text x={chart.width - 90} y={chart.height - 12} className="chart-label">
          time
        </text>
        <text x={chart.width - 134} y={chart.ambientY - 5} className="chart-label chart-label--ambient">
          Ambient {formatNumber(result.thermal.ambientTemp_C, 0)}
        </text>
        <text x={chart.width - 122} y={chart.limitY - 5} className="chart-label chart-label--limit">
          Limit {formatNumber(material.allowableContinuousTemp_C, 0)}
        </text>
      </svg>
      {hovered ? (
        <div className="chart-readout">
          <span>{formatNumber(hovered.time_s / 60, 0)} min</span>
          <strong>{formatNumber(hovered.temperature_C, 1)} degC</strong>
          <span>{formatNumber(hovered.losses_W_per_m, 1)} W/m loss</span>
          <span>{formatNumber(hovered.cooling_W_per_m, 1)} W/m cooling</span>
        </div>
      ) : null}
    </Panel>
  );
}
