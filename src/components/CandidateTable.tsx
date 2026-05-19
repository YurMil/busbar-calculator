import {Check} from 'lucide-react';
import {profiles} from '../domain/data';
import type {ProfileCandidate} from '../domain/types';
import {formatNumber} from '../utils/format';
import {Panel, StatusBadge} from './ui';

type CandidateTableProps = {
  candidates: ProfileCandidate[];
  selectedProfileId: string;
  selectedBars: number;
  onSelect: (candidate: ProfileCandidate) => void;
};

export function CandidateTable({candidates, selectedProfileId, selectedBars, onSelect}: CandidateTableProps) {
  return (
    <Panel title="Candidate Comparison" className="table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Material</th>
              <th>Profile</th>
              <th>Bars</th>
              <th>Area</th>
              <th>Mass</th>
              <th>J</th>
              <th>Losses</th>
              <th>Temp</th>
              <th>Envelope</th>
              <th>Status</th>
              <th>Select</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => {
              const isSelected = candidate.profileId === selectedProfileId && candidate.barsPerPhase === selectedBars;
              const profileExists = profiles.some((profile) => profile.profileId === candidate.profileId);
              return (
                <tr key={`${candidate.profileId}-${candidate.barsPerPhase}`} className={isSelected ? 'is-selected' : ''}>
                  <td>{candidate.rank}</td>
                  <td>{candidate.materialLabel}</td>
                  <td>
                    {candidate.width_mm} x {candidate.thickness_mm}
                  </td>
                  <td>{candidate.barsPerPhase}</td>
                  <td>{formatNumber(candidate.areaPerPhase_mm2, 0)} mm2</td>
                  <td>{formatNumber(candidate.massPerMeterPerPhase_kg_m, 2)} kg/m</td>
                  <td>{formatNumber(candidate.currentDensity_A_per_mm2, 2)}</td>
                  <td>{formatNumber(candidate.losses_W_per_m, 1)}</td>
                  <td>{formatNumber(candidate.steadyStateTemp_C, 1)}</td>
                  <td>
                    {formatNumber(candidate.channelWidth_mm, 0)} x {formatNumber(candidate.channelHeight_mm, 0)}
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
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
