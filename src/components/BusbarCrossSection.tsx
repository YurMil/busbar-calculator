import type {BusbarCalculationResult, BusbarInput} from '../domain/types';
import {formatNumber} from '../utils/format';
import {Panel, StatusBadge} from './ui';

type BusbarCrossSectionProps = {
  input: BusbarInput;
  result: BusbarCalculationResult;
};

export function BusbarCrossSection({input, result}: BusbarCrossSectionProps) {
  const {envelope} = result;
  const margin = Math.max(32, Math.min(70, Math.max(envelope.width_mm, envelope.height_mm) * 0.12));
  const width = envelope.width_mm + margin * 2;
  const height = envelope.height_mm + margin * 2;
  const phaseIds = Array.from(new Set(envelope.conductorBoxes.map((box) => box.phaseId)));
  const phaseBounds = phaseIds.map((phaseId) => {
    const boxes = envelope.conductorBoxes.filter((box) => box.phaseId === phaseId);
    return {
      phaseId,
      minX: Math.min(...boxes.map((box) => box.x_mm)),
      maxX: Math.max(...boxes.map((box) => box.x_mm + box.w_mm)),
      minY: Math.min(...boxes.map((box) => box.y_mm)),
      maxY: Math.max(...boxes.map((box) => box.y_mm + box.h_mm)),
    };
  });
  const first = phaseBounds[0];
  const second = phaseBounds[1];
  const clearGap = first && second ? (input.arrangement === 'horizontal' ? second.minX - first.maxX : second.minY - first.maxY) : 0;

  return (
    <Panel
      title="Busbar Cross-section"
      className="visual-panel"
      actions={
        <div className="panel-actions">
          <span>{input.arrangement}</span>
          <span>{input.orientation}</span>
          <StatusBadge status={result.clearance.status} />
        </div>
      }
    >
      <svg
        className="cross-section"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Busbar envelope ${formatNumber(envelope.width_mm, 1)} by ${formatNumber(envelope.height_mm, 1)} millimeters`}
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
          </marker>
          <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000" floodOpacity="0.32" />
          </filter>
        </defs>

        <rect
          x={margin}
          y={margin}
          width={envelope.width_mm}
          height={envelope.height_mm}
          rx="4"
          className="envelope-box"
        />

        {envelope.conductorBoxes.map((box) => (
          <g key={box.id} transform={`translate(${margin + box.x_mm} ${margin + box.y_mm})`}>
            <rect
              width={box.w_mm}
              height={box.h_mm}
              rx="1.5"
              fill={box.color}
              className="busbar-rect"
              filter="url(#barShadow)"
            />
            <rect width={box.w_mm} height={box.h_mm} rx="1.5" fill="none" className="busbar-highlight" />
          </g>
        ))}

        {envelope.phaseCenters.map((center) => (
          <g key={center.phaseId}>
            <line
              x1={margin + center.x_mm}
              y1={margin}
              x2={margin + center.x_mm}
              y2={margin + envelope.height_mm}
              className="centerline"
            />
            <line
              x1={margin}
              y1={margin + center.y_mm}
              x2={margin + envelope.width_mm}
              y2={margin + center.y_mm}
              className="centerline"
            />
            <circle cx={margin + center.x_mm} cy={margin + center.y_mm} r="4" className="center-point" />
            <text x={margin + center.x_mm} y={margin + center.y_mm - 14} textAnchor="middle" className="phase-label">
              {center.phaseId}
            </text>
          </g>
        ))}

        <line
          x1={margin}
          y1={margin - 18}
          x2={margin + envelope.width_mm}
          y2={margin - 18}
          className="dimension-line"
          markerStart="url(#arrow)"
          markerEnd="url(#arrow)"
        />
        <text x={margin + envelope.width_mm / 2} y={margin - 26} textAnchor="middle" className="dimension-label">
          {formatNumber(envelope.width_mm, 1)} mm
        </text>

        <line
          x1={margin - 18}
          y1={margin}
          x2={margin - 18}
          y2={margin + envelope.height_mm}
          className="dimension-line"
          markerStart="url(#arrow)"
          markerEnd="url(#arrow)"
        />
        <text
          x={margin - 28}
          y={margin + envelope.height_mm / 2}
          textAnchor="middle"
          className="dimension-label rotated"
          transform={`rotate(-90 ${margin - 28} ${margin + envelope.height_mm / 2})`}
        >
          {formatNumber(envelope.height_mm, 1)} mm
        </text>

        {first && second ? (
          input.arrangement === 'horizontal' ? (
            <g>
              <line
                x1={margin + first.maxX}
                y1={margin + first.maxY + 18}
                x2={margin + second.minX}
                y2={margin + first.maxY + 18}
                className="gap-line"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />
              <text
                x={margin + first.maxX + clearGap / 2}
                y={margin + first.maxY + 34}
                textAnchor="middle"
                className="dimension-label"
              >
                gap {formatNumber(clearGap, 1)} mm
              </text>
            </g>
          ) : (
            <g>
              <line
                x1={margin + first.maxX + 18}
                y1={margin + first.maxY}
                x2={margin + first.maxX + 18}
                y2={margin + second.minY}
                className="gap-line"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />
              <text
                x={margin + first.maxX + 34}
                y={margin + first.maxY + clearGap / 2}
                textAnchor="middle"
                className="dimension-label"
              >
                gap {formatNumber(clearGap, 1)} mm
              </text>
            </g>
          )
        ) : null}
      </svg>

      <div className="legend-row">
        {Array.from(new Set(envelope.conductorBoxes.map((box) => box.phaseId))).map((phase) => {
          const box = envelope.conductorBoxes.find((item) => item.phaseId === phase);
          return (
            <span key={phase}>
              <i style={{background: box?.color}} />
              {phase}
            </span>
          );
        })}
        <strong>
          Envelope: {formatNumber(envelope.width_mm, 1)} x {formatNumber(envelope.height_mm, 1)} mm
        </strong>
      </div>
    </Panel>
  );
}
