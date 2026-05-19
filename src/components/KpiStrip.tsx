import {Activity, Gauge, Ruler, ShieldAlert, Thermometer, Zap, type LucideIcon} from 'lucide-react';
import type {BusbarCalculationResult, ResultStatus} from '../domain/types';
import {formatNumber, statusLabel} from '../utils/format';

type KpiCard = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  status?: ResultStatus;
  icon: LucideIcon;
};

function worstShortCircuitStatus(a: ResultStatus, b: ResultStatus): ResultStatus {
  const order: ResultStatus[] = ['fail', 'warn', 'incomplete', 'not-evaluated', 'pass'];
  return order.find((status) => status === a || status === b) ?? 'pass';
}

export function KpiStrip({result}: {result: BusbarCalculationResult}) {
  const selected = result.selectedProfile;
  const shortCircuitStatus = worstShortCircuitStatus(result.shortCircuit.thermalStatus, result.shortCircuit.mechanicalStatus);

  const cards: KpiCard[] = [
    {
      id: 'overall',
      label: 'Overall status',
      value: statusLabel(result.status),
      hint: `Engine v${result.engineVersion}`,
      status: result.status,
      icon: Activity,
    },
    {
      id: 'selected',
      label: 'Selected busbar',
      value: `${selected.width_mm} × ${selected.thickness_mm} mm`,
      hint: `${selected.materialLabel} · ${selected.barsPerPhase}/phase`,
      icon: Gauge,
    },
    {
      id: 'density',
      label: 'Current density',
      value: formatNumber(result.electrical.currentDensity_A_per_mm2, 2),
      unit: 'A/mm²',
      hint: `${formatNumber(result.electrical.losses_W_per_m, 1)} W/m losses`,
      icon: Zap,
    },
    {
      id: 'temperature',
      label: 'Steady-state temp',
      value: formatNumber(result.thermal.steadyStateTemp_C, 1),
      unit: '°C',
      hint: `Δ ${formatNumber(result.thermal.tempRise_K, 1)} K · amb ${formatNumber(result.thermal.ambientTemp_C, 0)} °C`,
      status: result.thermal.status,
      icon: Thermometer,
    },
    {
      id: 'clearance',
      label: 'Clearance',
      value: `${formatNumber(result.clearance.actualPhaseGap_mm, 1)} / ${formatNumber(result.clearance.requiredAirClearance_mm, 1)}`,
      unit: 'mm',
      hint: 'actual / required',
      status: result.clearance.status,
      icon: Ruler,
    },
    {
      id: 'envelope',
      label: 'Channel envelope',
      value: `${formatNumber(result.envelope.width_mm, 0)} × ${formatNumber(result.envelope.height_mm, 0)}`,
      unit: 'mm',
      hint: 'minimum W × H',
      icon: Gauge,
    },
    {
      id: 'short-circuit',
      label: 'Short-circuit',
      value: statusLabel(shortCircuitStatus),
      hint: `I²t ${result.shortCircuit.thermalUtilization ? formatNumber(result.shortCircuit.thermalUtilization * 100, 0) + '%' : 'n/a'} · Mech ${result.shortCircuit.mechanicalUtilization ? formatNumber(result.shortCircuit.mechanicalUtilization * 100, 0) + '%' : 'n/a'}`,
      status: shortCircuitStatus,
      icon: ShieldAlert,
    },
  ];

  return (
    <section className="kpi-strip" aria-label="Key result indicators">
      {cards.map((card) => {
        const Icon = card.icon;
        const statusClass = card.status ? ` kpi-card--${card.status}` : '';
        return (
          <article key={card.id} className={`kpi-card${statusClass}`}>
            <header className="kpi-card__header">
              <Icon size={14} aria-hidden="true" />
              <span>{card.label}</span>
            </header>
            <div className="kpi-card__value">
              <strong>{card.value}</strong>
              {card.unit ? <span className="kpi-card__unit">{card.unit}</span> : null}
            </div>
            {card.hint ? <div className="kpi-card__hint">{card.hint}</div> : null}
          </article>
        );
      })}
    </section>
  );
}
