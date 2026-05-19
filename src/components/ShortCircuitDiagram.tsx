import type {BusbarCalculationResult, BusbarInput} from '../domain/types';
import {formatNumber} from '../utils/format';
import {Panel, StatusBadge} from './ui';

type ShortCircuitDiagramProps = {
  input: BusbarInput;
  result: BusbarCalculationResult;
};

/**
 * Engineering-style insulator (epoxy/porcelain post insulator) rendered with
 * base flange, finned body and top cap. Origin = top-center of cap.
 */
function PostInsulator({x, y, height = 70}: {x: number; y: number; height?: number}) {
  const bodyWidth = 14;
  const capWidth = 18;
  const baseWidth = 24;
  const capHeight = 4;
  const baseHeight = 4;
  const bodyHeight = height - capHeight - baseHeight;
  const ribCount = 4;
  const ribStep = bodyHeight / (ribCount + 1);
  return (
    <g transform={`translate(${x} ${y})`} className="insulator">
      {/* top cap */}
      <rect x={-capWidth / 2} y={0} width={capWidth} height={capHeight} className="insulator-metal" />
      {/* body */}
      <rect x={-bodyWidth / 2} y={capHeight} width={bodyWidth} height={bodyHeight} className="insulator-body" />
      {/* ribs / sheds */}
      {Array.from({length: ribCount}).map((_, index) => {
        const ribY = capHeight + ribStep * (index + 1);
        return (
          <ellipse
            key={index}
            cx={0}
            cy={ribY}
            rx={bodyWidth / 2 + 3}
            ry={1.6}
            className="insulator-rib"
          />
        );
      })}
      {/* base flange */}
      <rect
        x={-baseWidth / 2}
        y={capHeight + bodyHeight}
        width={baseWidth}
        height={baseHeight}
        className="insulator-metal"
      />
    </g>
  );
}

/** Hatched ground / mounting rail */
function GroundHatch({x, y, width}: {x: number; y: number; width: number}) {
  const step = 6;
  const count = Math.floor(width / step);
  return (
    <g className="ground-hatch">
      <line x1={x} y1={y} x2={x + width} y2={y} className="ground-rail" />
      {Array.from({length: count}).map((_, index) => {
        const startX = x + index * step;
        return <line key={index} x1={startX} y1={y} x2={startX - 5} y2={y + 7} className="ground-stroke" />;
      })}
    </g>
  );
}

export function ShortCircuitDiagram({input, result}: ShortCircuitDiagramProps) {
  const phases = Array.from(new Set(result.envelope.conductorBoxes.map((box) => box.phaseId)));
  const force_kN_m =
    result.shortCircuit.force_N_per_m ? result.shortCircuit.force_N_per_m / 1000 : undefined;

  // --- side view geometry ---
  const sideTop = 180;
  const railY = 286;
  const insulatorHeight = 70;
  const insulatorTopY = railY - insulatorHeight;
  const supportLeftX = 230;
  const supportRightX = 430;
  const barTopY = insulatorTopY - 8;
  const barHeight = 10;

  return (
    <Panel
      title="Short-circuit Force"
      className="force-panel"
      actions={
        <div className="panel-actions">
          <StatusBadge status={result.shortCircuit.thermalStatus} />
          <StatusBadge status={result.shortCircuit.mechanicalStatus} />
        </div>
      }
    >
      <svg
        viewBox="0 0 460 340"
        className="force-svg"
        role="img"
        aria-labelledby="sc-title sc-desc"
        data-export-id="short-circuit"
      >
        <title id="sc-title">Short-circuit force diagram</title>
        <desc id="sc-desc">
          {`Peak current ${formatNumber(input.peakShortCircuit_kA, 1)} kA, ` +
            `force ${formatNumber(force_kN_m, 2)} kN per meter, ` +
            `bending stress ${formatNumber(result.shortCircuit.bendingStress_MPa, 1)} MPa, ` +
            `support spacing ${formatNumber(input.supportSpacing_mm, 0)} mm. ` +
            'Side view shows the busbar resting on two post insulators.'}
        </desc>
        <defs>
          <marker id="forceArrow" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L9,4.5 L0,9 z" fill="currentColor" />
          </marker>
          <marker id="dimArrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,1 L9,5 L0,9 z" fill="currentColor" />
          </marker>
        </defs>

        {/* --- Annotation column --- */}
        <text x={16} y={28} className="formula">F = μ₀·Iₚₖ² / 2π·d</text>
        <text x={16} y={64} className="svg-muted">Iₚₖ <tspan className="svg-strong">{formatNumber(input.peakShortCircuit_kA, 1)}</tspan> kA</text>
        <text x={16} y={86} className="svg-muted">F<tspan dy="2" fontSize="9">m</tspan><tspan dy="-2"> </tspan><tspan className="svg-strong">{formatNumber(force_kN_m, 2)}</tspan> kN/m</text>
        <text x={16} y={108} className="svg-muted">σ <tspan className="svg-strong">{formatNumber(result.shortCircuit.bendingStress_MPa, 1)}</tspan> MPa</text>
        <text x={16} y={130} className="svg-muted">L <tspan className="svg-strong">{formatNumber(input.supportSpacing_mm, 0)}</tspan> mm</text>

        {/* --- Top right: phase cross-section with force arrows --- */}
        {phases.map((phase, index) => {
          const cx = 220 + index * 60;
          const box = result.envelope.conductorBoxes.find((item) => item.phaseId === phase);
          return (
            <g key={phase}>
              <rect x={cx - 9} y={26} width={18} height={108} rx={2} fill={box?.color ?? '#38bdf8'} className="force-bar" />
              <text x={cx} y={154} textAnchor="middle" className="phase-label-small">{phase}</text>
              {index < phases.length - 1 ? (
                <g className="force-arrow">
                  <line x1={cx + 11} y1={80} x2={cx + 49} y2={80} markerEnd="url(#forceArrow)" />
                  <line x1={cx + 49} y1={80} x2={cx + 11} y2={80} markerEnd="url(#forceArrow)" />
                </g>
              ) : null}
            </g>
          );
        })}

        {/* --- Bottom right: side view (one bar on two insulators) --- */}
        <text x={170} y={sideTop - 8} className="svg-muted svg-small">Side view — bar on post insulators</text>

        {/* Bar resting on insulators */}
        <rect
          x={supportLeftX - 30}
          y={barTopY}
          width={(supportRightX - supportLeftX) + 60}
          height={barHeight}
          rx={1.5}
          className="side-bar"
        />
        {/* Distributed load arrows on bar */}
        {Array.from({length: 9}).map((_, index) => {
          const fraction = (index + 1) / 10;
          const lx = supportLeftX + fraction * (supportRightX - supportLeftX);
          return (
            <line
              key={index}
              x1={lx}
              y1={barTopY - 14}
              x2={lx}
              y2={barTopY - 2}
              className="load-arrow"
              markerEnd="url(#forceArrow)"
            />
          );
        })}

        {/* Insulators */}
        <PostInsulator x={supportLeftX} y={insulatorTopY} height={insulatorHeight} />
        <PostInsulator x={supportRightX} y={insulatorTopY} height={insulatorHeight} />

        {/* Mounting rail with ground hatching */}
        <GroundHatch x={supportLeftX - 60} y={railY} width={(supportRightX - supportLeftX) + 120} />

        {/* Dimension line with extension lines */}
        {(() => {
          const dimY = railY + 22;
          return (
            <g className="dimension-group">
              <line x1={supportLeftX} y1={railY + 6} x2={supportLeftX} y2={dimY + 4} className="extension-line" />
              <line x1={supportRightX} y1={railY + 6} x2={supportRightX} y2={dimY + 4} className="extension-line" />
              <line
                x1={supportLeftX}
                y1={dimY}
                x2={supportRightX}
                y2={dimY}
                className="dimension-line"
                markerStart="url(#dimArrow)"
                markerEnd="url(#dimArrow)"
              />
              <text x={(supportLeftX + supportRightX) / 2} y={dimY - 4} textAnchor="middle" className="dimension-label">
                L = {formatNumber(input.supportSpacing_mm, 0)} mm
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="metric-strip">
        <span>
          Thermal I²t{' '}
          <strong>
            {result.shortCircuit.thermalUtilization
              ? formatNumber(result.shortCircuit.thermalUtilization * 100, 1)
              : 'not eval'}
            %
          </strong>
        </span>
        <span>
          Mechanical{' '}
          <strong>
            {result.shortCircuit.mechanicalUtilization
              ? formatNumber(result.shortCircuit.mechanicalUtilization * 100, 1)
              : 'not eval'}
            %
          </strong>
        </span>
      </div>
    </Panel>
  );
}
