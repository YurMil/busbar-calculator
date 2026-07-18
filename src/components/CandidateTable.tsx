import {useMemo, useState} from 'react';
import {Check, FilterX} from 'lucide-react';
import {profiles} from '../domain/data';
import type {ProfileCandidate, ResultStatus} from '../domain/types';
import {formatNumber} from '../utils/format';
import {Panel, StatusBadge} from './ui';

type CandidateTableProps = {
  candidates: ProfileCandidate[];
  selectedProfileId: string;
  selectedBars: number;
  onSelect: (candidate: ProfileCandidate) => void;
};

type MaterialFilter = 'all' | 'copper' | 'aluminium';
type BarsFilter = 'all' | 1 | 2 | 3 | 4;
type ThicknessFilter = 'all' | number;
type StatusFilter = 'all' | 'pass' | 'pass-warn';

const PAGE_SIZE = 12;

function matchesMaterial(candidate: ProfileCandidate, filter: MaterialFilter): boolean {
  if (filter === 'all') return true;
  return candidate.materialLabel.toLowerCase().includes(filter);
}

function matchesStatus(status: ResultStatus, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'pass') return status === 'pass';
  return status === 'pass' || status === 'warn';
}

export function CandidateTable({candidates, selectedProfileId, selectedBars, onSelect}: CandidateTableProps) {
  const [material, setMaterial] = useState<MaterialFilter>('all');
  const [bars, setBars] = useState<BarsFilter>('all');
  const [thickness, setThickness] = useState<ThicknessFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const thicknessOptions = useMemo(() => {
    const values = new Set<number>();
    candidates.forEach((c) => values.add(c.thickness_mm));
    return Array.from(values).sort((a, b) => a - b);
  }, [candidates]);

  const filtered = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          matchesMaterial(candidate, material) &&
          (bars === 'all' || candidate.barsPerPhase === bars) &&
          (thickness === 'all' || candidate.thickness_mm === thickness) &&
          matchesStatus(candidate.status, status),
      ),
    [candidates, material, bars, thickness, status],
  );

  const visible = filtered.slice(0, PAGE_SIZE);
  const hiddenCount = Math.max(0, filtered.length - PAGE_SIZE);
  const filtersActive = material !== 'all' || bars !== 'all' || thickness !== 'all' || status !== 'all';

  const reset = () => {
    setMaterial('all');
    setBars('all');
    setThickness('all');
    setStatus('all');
  };

  return (
    <Panel
      title="Candidate Comparison"
      className="table-panel"
      actions={
        <span className="panel-actions">
          {filtered.length} of {candidates.length}
        </span>
      }
    >
      <div className="candidate-filters" role="group" aria-label="Candidate filters">
        <label className="candidate-filter">
          <span>Material</span>
          <select value={material} onChange={(event) => setMaterial(event.target.value as MaterialFilter)}>
            <option value="all">All</option>
            <option value="copper">Copper</option>
            <option value="aluminium">Aluminium</option>
          </select>
        </label>
        <label className="candidate-filter">
          <span>Bars</span>
          <select
            value={String(bars)}
            onChange={(event) => setBars(event.target.value === 'all' ? 'all' : (Number(event.target.value) as BarsFilter))}
          >
            <option value="all">Any</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <label className="candidate-filter">
          <span>Thickness</span>
          <select
            value={String(thickness)}
            onChange={(event) => setThickness(event.target.value === 'all' ? 'all' : Number(event.target.value))}
          >
            <option value="all">Any</option>
            {thicknessOptions.map((value) => (
              <option key={value} value={value}>
                {value} mm
              </option>
            ))}
          </select>
        </label>
        <label className="candidate-filter">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            <option value="all">All</option>
            <option value="pass-warn">Pass + Warn</option>
            <option value="pass">Pass only</option>
          </select>
        </label>
        <button
          type="button"
          className="candidate-filter__reset"
          onClick={reset}
          disabled={!filtersActive}
          title="Reset filters"
        >
          <FilterX size={14} aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th aria-label="Selected marker" className="row-marker"></th>
              <th className="num">#</th>
              <th className="col-priority-low">Material</th>
              <th>Profile</th>
              <th className="num">Bars</th>
              <th className="num col-priority-low">Area</th>
              <th className="num col-priority-low">Mass</th>
              <th className="num" title="Current density, A/mm²">J</th>
              <th className="num col-priority-med">Losses</th>
              <th className="num">Temp</th>
              <th className="col-priority-low">Envelope</th>
              <th>Status</th>
              <th aria-label="Select"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={13} className="candidate-empty">
                  No candidates match the current filters.
                </td>
              </tr>
            ) : (
              visible.map((candidate) => {
                const isSelected = candidate.profileId === selectedProfileId && candidate.barsPerPhase === selectedBars;
                const profileExists = profiles.some((profile) => profile.profileId === candidate.profileId);
                return (
                  <tr
                    key={`${candidate.profileId}-${candidate.barsPerPhase}`}
                    className={isSelected ? 'is-selected' : ''}
                    aria-selected={isSelected || undefined}
                  >
                    <td aria-hidden="true" className="row-marker">{isSelected ? '▸' : ''}</td>
                    <td className="num">{candidate.rank}</td>
                    <td className="col-priority-low">{candidate.materialLabel}</td>
                    <td>
                      {candidate.width_mm} × {candidate.thickness_mm}
                    </td>
                    <td className="num">{candidate.barsPerPhase}</td>
                    <td className="num col-priority-low">{formatNumber(candidate.areaPerPhase_mm2, 0)} mm²</td>
                    <td className="num col-priority-low">{formatNumber(candidate.massPerMeterPerPhase_kg_m, 2)} kg/m</td>
                    <td className="num">{formatNumber(candidate.currentDensity_A_per_mm2, 2)}</td>
                    <td className="num col-priority-med">{formatNumber(candidate.losses_W_per_m, 1)}</td>
                    <td className="num">{formatNumber(candidate.steadyStateTemp_C, 1)}</td>
                    <td className="col-priority-low">
                      {formatNumber(candidate.channelWidth_mm, 0)} × {formatNumber(candidate.channelHeight_mm, 0)}
                    </td>
                    <td>
                      <StatusBadge status={candidate.status} />
                    </td>
                    <td>
                      <button type="button" className="select-row" disabled={!profileExists} onClick={() => onSelect(candidate)}>
                        <Check size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {hiddenCount > 0 ? (
        <p className="candidate-more">+{hiddenCount} more candidates hidden — refine filters to see them.</p>
      ) : null}
    </Panel>
  );
}
