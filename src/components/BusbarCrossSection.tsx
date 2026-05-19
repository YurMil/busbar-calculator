import type {BusbarCalculationResult, BusbarInput, ResultStatus} from '../domain/types';
import {formatNumber} from '../utils/format';
import {Panel, StatusBadge} from './ui';

type BusbarCrossSectionProps = {
  input: BusbarInput;
  result: BusbarCalculationResult;
};

const envelopeClassByStatus: Record<ResultStatus, string> = {
  pass: 'envelope-box envelope-box--pass',
  warn: 'envelope-box envelope-box--warn',
  fail: 'envelope-box envelope-box--fail',
  incomplete: 'envelope-box envelope-box--incomplete',
  'not-evaluated': 'envelope-box envelope-box--incomplete',
};

export function BusbarCrossSection({input, result}: BusbarCrossSectionProps) {
  const {envelope} = result;
  const margin = Math.max(48, Math.min(86, Math.max(envelope.width_mm, envelope.height_mm) * 0.14));
  const width = envelope.width_mm + margin * 2;
  const height = envelope.height_mm + margin * 2;

  const minDisplay = Math.max(envelope.width_mm, envelope.height_mm) * 0.012;
  const displayBoxes = envelope.conductorBoxes.map((box) => {
    const dispW = Math.max(box.w_mm, minDisplay);
    const dispH = Math.max(box.h_mm, minDisplay);
    return {
      ...box,
      dispW,
      dispH,
      dispX: box.x_mm + (box.w_mm - dispW) / 2,
      dispY: box.y_mm + (box.h_mm - dispH) / 2,
    };
  });

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

  const totalMinX = Math.min(...envelope.conductorBoxes.map((box) => box.x_mm));
  const totalMaxX = Math.max(...envelope.conductorBoxes.map((box) => box.x_mm + box.w_mm));
  const totalMinY = Math.min(...envelope.conductorBoxes.map((box) => box.y_mm));
  const totalMaxY = Math.max(...envelope.conductorBoxes.map((box) => box.y_mm + box.h_mm));
  const wallLeft = totalMinX;
  const wallRight = envelope.width_mm - totalMaxX;
  const wallTop = totalMinY;
  const wallBottom = envelope.height_mm - totalMaxY;

  const envelopeClass = envelopeClassByStatus[result.status] ?? 'envelope-box';

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
        aria-labelledby="cross-section-title cross-section-desc"
        data-export-id="cross-section"
      >
        <title id="cross-section-title">Busbar cross-section</title>
        <desc id="cross-section-desc">
          {`Envelope ${formatNumber(envelope.width_mm, 1)} by ${formatNumber(envelope.height_mm, 1)} mm, ` +
            `${phaseIds.length} phases (${phaseIds.join(', ')}), arrangement ${input.arrangement}, orientation ${input.orientation}. ` +
            (first && second ? `Phase gap ${formatNumber(clearGap, 1)} mm. ` : '') +
            `Wall clearances left ${formatNumber(wallLeft, 1)}, right ${formatNumber(wallRight, 1)}, top ${formatNumber(wallTop, 1)}, bottom ${formatNumber(wallBottom, 1)} mm.`}
        </desc>
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
          className={envelopeClass}
        />

        {displayBoxes.map((box) => (
          <g key={box.id} transform={`translate(${margin + box.dispX} ${margin + box.dispY})`}>
            <rect
              width={box.dispW}
              height={box.dispH}
              rx="1.5"
              fill={box.color}
              className="busbar-rect"
              filter="url(#barShadow)"
            />
            <rect width={box.dispW} height={box.dispH} rx="1.5" fill="none" className="busbar-highlight" />
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

        {/* Envelope width — top */}
        {(() => {
          const lineY = margin - 24;
          return (
            <g>
              <line x1={margin} y1={lineY} x2={margin + envelope.width_mm} y2={lineY} className="dimension-line" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text
                x={margin + envelope.width_mm / 2}
                y={lineY - 6}
                textAnchor="middle"
                dominantBaseline="auto"
                className="dimension-label"
              >
                {formatNumber(envelope.width_mm, 1)} mm
              </text>
            </g>
          );
        })()}

        {/* Envelope height — left, rotated via group wrapper */}
        {(() => {
          const lineX = margin - 24;
          const midY = margin + envelope.height_mm / 2;
          const labelX = lineX - 6;
          return (
            <g>
              <line x1={lineX} y1={margin} x2={lineX} y2={margin + envelope.height_mm} className="dimension-line" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <g transform={`rotate(-90 ${labelX} ${midY})`}>
                <text
                  x={labelX}
                  y={midY}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  className="dimension-label"
                >
                  {formatNumber(envelope.height_mm, 1)} mm
                </text>
              </g>
            </g>
          );
        })()}

        {/* Wall clearances */}
        {wallLeft > 0
          ? (() => {
              const lineY = margin + totalMinY + (totalMaxY - totalMinY) / 2;
              return (
                <g>
                  <line x1={margin} y1={lineY} x2={margin + totalMinX} y2={lineY} className="wall-line" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                  <text x={margin + wallLeft / 2} y={lineY - 4} textAnchor="middle" dominantBaseline="auto" className="dimension-label dimension-label--muted">
                    {formatNumber(wallLeft, 1)}
                  </text>
                </g>
              );
            })()
          : null}

        {wallRight > 0
          ? (() => {
              const lineY = margin + totalMinY + (totalMaxY - totalMinY) / 2;
              return (
                <g>
                  <line x1={margin + totalMaxX} y1={lineY} x2={margin + envelope.width_mm} y2={lineY} className="wall-line" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                  <text x={margin + totalMaxX + wallRight / 2} y={lineY - 4} textAnchor="middle" dominantBaseline="auto" className="dimension-label dimension-label--muted">
                    {formatNumber(wallRight, 1)}
                  </text>
                </g>
              );
            })()
          : null}

        {wallTop > 0
          ? (() => {
              const lineX = margin + totalMinX + (totalMaxX - totalMinX) / 2;
              const midY = margin + wallTop / 2;
              const labelX = lineX + 6;
              return (
                <g>
                  <line x1={lineX} y1={margin} x2={lineX} y2={margin + totalMinY} className="wall-line" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                  <g transform={`rotate(-90 ${labelX} ${midY})`}>
                    <text x={labelX} y={midY} textAnchor="middle" dominantBaseline="auto" className="dimension-label dimension-label--muted">
                      {formatNumber(wallTop, 1)}
                    </text>
                  </g>
                </g>
              );
            })()
          : null}

        {wallBottom > 0
          ? (() => {
              const lineX = margin + totalMinX + (totalMaxX - totalMinX) / 2;
              const midY = margin + totalMaxY + wallBottom / 2;
              const labelX = lineX + 6;
              return (
                <g>
                  <line x1={lineX} y1={margin + totalMaxY} x2={lineX} y2={margin + envelope.height_mm} className="wall-line" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                  <g transform={`rotate(-90 ${labelX} ${midY})`}>
                    <text x={labelX} y={midY} textAnchor="middle" dominantBaseline="auto" className="dimension-label dimension-label--muted">
                      {formatNumber(wallBottom, 1)}
                    </text>
                  </g>
                </g>
              );
            })()
          : null}

        {first && second
          ? input.arrangement === 'horizontal'
            ? (() => {
                const lineY = margin + first.maxY + 24;
                const midX = margin + first.maxX + clearGap / 2;
                return (
                  <g>
                    <line x1={margin + first.maxX} y1={lineY} x2={margin + second.minX} y2={lineY} className="gap-line" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                    <text x={midX} y={lineY + 14} textAnchor="middle" dominantBaseline="auto" className="dimension-label">
                      gap {formatNumber(clearGap, 1)} mm
                    </text>
                  </g>
                );
              })()
            : (() => {
                const lineX = margin + first.maxX + 24;
                const midY = margin + first.maxY + clearGap / 2;
                const labelX = lineX + 14;
                return (
                  <g>
                    <line x1={lineX} y1={margin + first.maxY} x2={lineX} y2={margin + second.minY} className="gap-line" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                    <g transform={`rotate(-90 ${labelX} ${midY})`}>
                      <text x={labelX} y={midY} textAnchor="middle" dominantBaseline="auto" className="dimension-label">
                        gap {formatNumber(clearGap, 1)} mm
                      </text>
                    </g>
                  </g>
                );
              })()
          : null}
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
          Envelope: {formatNumber(envelope.width_mm, 1)} × {formatNumber(envelope.height_mm, 1)} mm
        </strong>
      </div>

      <table className="visually-hidden">
        <caption>Cross-section geometry, all values in millimeters</caption>
        <thead>
          <tr>
            <th>Phase</th>
            <th>Width</th>
            <th>Thickness</th>
            <th>Center X</th>
            <th>Center Y</th>
          </tr>
        </thead>
        <tbody>
          {envelope.phaseCenters.map((center) => {
            const box = envelope.conductorBoxes.find((item) => item.phaseId === center.phaseId);
            return (
              <tr key={center.phaseId}>
                <th scope="row">{center.phaseId}</th>
                <td>{formatNumber(box?.w_mm ?? 0, 1)}</td>
                <td>{formatNumber(box?.h_mm ?? 0, 1)}</td>
                <td>{formatNumber(center.x_mm, 1)}</td>
                <td>{formatNumber(center.y_mm, 1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}
