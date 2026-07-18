import {AlertTriangle, Gauge, Ruler, Thermometer, Zap} from 'lucide-react';
import type {BusbarCalculationResult} from '../domain/types';
import {formatNumber} from '../utils/format';
import {Panel, StatusBadge} from './ui';

type ResultSummaryProps = {
  result: BusbarCalculationResult;
};

export function ResultSummary({result}: ResultSummaryProps) {
  return (
    <aside className="summary-rail">
      <Panel title="Result Summary" actions={<StatusBadge status={result.status} />}>
        <div className="summary-list">
          <SummaryRow label="Selected busbar" value={`${result.selectedProfile.materialLabel} ${result.selectedProfile.width_mm} x ${result.selectedProfile.thickness_mm} mm`} icon={<Gauge size={16} />} />
          <SummaryRow label="Bars per phase" value={String(result.selectedProfile.barsPerPhase)} />
          <SummaryRow label="Current density" value={`${formatNumber(result.electrical.currentDensity_A_per_mm2, 2)} A/mm²`} icon={<Zap size={16} />} />
          <SummaryRow label="Losses" value={`${formatNumber(result.electrical.losses_W_per_m, 1)} W/m`} />
          <SummaryRow label="Steady temp" value={`${formatNumber(result.thermal.steadyStateTemp_C, 1)} °C`} icon={<Thermometer size={16} />} />
          <SummaryRow label="Temp rise" value={`${formatNumber(result.thermal.tempRise_K, 1)} K`} />
          <SummaryRow label="Clearance required" value={`${formatNumber(result.clearance.requiredAirClearance_mm, 1)} mm`} icon={<Ruler size={16} />} />
          <SummaryRow label="Clearance actual" value={`${formatNumber(result.clearance.actualPhaseGap_mm, 1)} mm`} />
          <SummaryRow label="Channel envelope" value={`${formatNumber(result.envelope.width_mm, 1)} x ${formatNumber(result.envelope.height_mm, 1)} mm`} />
        </div>
      </Panel>

      <Panel title="Short-circuit Checks">
        <div className="status-stack">
          <div>
            <span>Thermal I²t</span>
            <StatusBadge status={result.shortCircuit.thermalStatus} />
          </div>
          <div>
            <span>Electrodynamic force</span>
            <StatusBadge status={result.shortCircuit.mechanicalStatus} />
          </div>
        </div>
      </Panel>

      <Panel title="Warnings" actions={<span className="panel-actions">{result.warnings.length} total</span>}>
        <div className="warnings-list">
          {result.warnings.length === 0 ? (
            <p className="warnings-empty">No warnings — configuration looks clean.</p>
          ) : (
            <>
              {result.warnings.slice(0, 6).map((warning) => (
                <article key={`${warning.code}-${warning.message}`} className={`warning warning--${warning.severity}`}>
                  <AlertTriangle size={15} />
                  <div>
                    <strong>{warning.title}</strong>
                    <p>{warning.message}</p>
                  </div>
                </article>
              ))}
              {result.warnings.length > 6 ? (
                <p className="warnings-more">+{result.warnings.length - 6} more — see calculation trace</p>
              ) : null}
            </>
          )}
        </div>
      </Panel>
    </aside>
  );
}

function SummaryRow({label, value, icon}: {label: string; value: string; icon?: React.ReactNode}) {
  return (
    <div className="summary-row">
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}
