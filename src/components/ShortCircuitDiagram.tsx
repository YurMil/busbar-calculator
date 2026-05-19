import type {BusbarCalculationResult, BusbarInput} from '../domain/types';
import {formatNumber} from '../utils/format';
import {Panel, StatusBadge} from './ui';

type ShortCircuitDiagramProps = {
  input: BusbarInput;
  result: BusbarCalculationResult;
};

export function ShortCircuitDiagram({input, result}: ShortCircuitDiagramProps) {
  const phases = Array.from(new Set(result.envelope.conductorBoxes.map((box) => box.phaseId)));
  const force_kN_m = result.shortCircuit.force_N_per_m ? result.shortCircuit.force_N_per_m / 1000 : undefined;

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
      <svg viewBox="0 0 420 260" className="force-svg" role="img" aria-label="Short-circuit force and support spacing diagram">
        <defs>
          <marker id="forceArrow" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L9,4.5 L0,9 z" fill="currentColor" />
          </marker>
        </defs>
        <text x="20" y="42" className="formula">
          F = mu0 Ipk^2 / 2 pi d
        </text>
        <text x="20" y="80" className="svg-muted">
          Ipk {formatNumber(input.peakShortCircuit_kA, 1)} kA
        </text>
        <text x="20" y="102" className="svg-muted">
          Force {formatNumber(force_kN_m, 2)} kN/m
        </text>
        <text x="20" y="124" className="svg-muted">
          Stress {formatNumber(result.shortCircuit.bendingStress_MPa, 1)} MPa
        </text>

        {phases.map((phase, index) => {
          const x = 180 + index * 46;
          const box = result.envelope.conductorBoxes.find((item) => item.phaseId === phase);
          return (
            <g key={phase}>
              <rect x={x} y="42" width="16" height="120" rx="2" fill={box?.color ?? '#38bdf8'} className="force-bar" />
              <text x={x + 8} y="188" textAnchor="middle" className="phase-label-small">
                {phase}
              </text>
              {index < phases.length - 1 ? (
                <line x1={x + 21} y1="96" x2={x + 38} y2="96" className="force-arrow" markerEnd="url(#forceArrow)" />
              ) : null}
            </g>
          );
        })}

        <line x1="178" y1="216" x2="376" y2="216" className="support-line" />
        <path d="M196 216 l-14 24 h28 z" className="support" />
        <path d="M358 216 l-14 24 h28 z" className="support" />
        <line x1="196" y1="206" x2="358" y2="206" className="dimension-line" markerStart="url(#forceArrow)" markerEnd="url(#forceArrow)" />
        <text x="277" y="198" textAnchor="middle" className="dimension-label">
          L {formatNumber(input.supportSpacing_mm, 0)} mm
        </text>
      </svg>
      <div className="metric-strip">
        <span>
          Thermal I2t <strong>{result.shortCircuit.thermalUtilization ? formatNumber(result.shortCircuit.thermalUtilization * 100, 1) : 'not eval'}%</strong>
        </span>
        <span>
          Mechanical <strong>{result.shortCircuit.mechanicalUtilization ? formatNumber(result.shortCircuit.mechanicalUtilization * 100, 1) : 'not eval'}%</strong>
        </span>
      </div>
    </Panel>
  );
}
