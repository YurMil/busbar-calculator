import {AirVent, FileText, Layers3, Shapes, Sliders, Zap} from 'lucide-react';
import {coolingPresets, materials, profiles} from '../domain/data';
import type {
  ArrangementDirection,
  BarOrientation,
  BusbarCalculationResult,
  BusbarInput,
  PhaseMode,
  SurfaceFinish,
  SystemType,
} from '../domain/types';
import {useBusbarStore} from '../state/useBusbarStore';
import {tabAttention} from '../utils/warningNav';
import {NumberField, Panel, SegmentedButton, SelectField, TextField} from './ui';
import {InputTabs, type InputTab} from './InputTabs';
import {ArrangementCards, OrientationCards} from './ArrangementCards';

type InputPanelProps = {
  input: BusbarInput;
  result: BusbarCalculationResult;
  onInput: (patch: Partial<BusbarInput>) => void;
  onProject: (patch: Partial<BusbarInput['project']>) => void;
};

const finishOptions: Array<{value: SurfaceFinish; label: string}> = [
  {value: 'bare', label: 'Bare'},
  {value: 'oxidized', label: 'Oxidized'},
  {value: 'tinned', label: 'Tinned'},
  {value: 'painted', label: 'Painted'},
];

const TABS: InputTab[] = [
  {id: 'project', label: 'Project', icon: FileText},
  {id: 'system', label: 'System', icon: Zap},
  {id: 'busbars', label: 'Busbars', icon: Layers3},
  {id: 'layout', label: 'Layout', icon: Shapes},
  {id: 'environment', label: 'Cooling', icon: AirVent},
  {id: 'short-circuit', label: 'Faults', icon: Sliders},
];

export function InputPanel({input, result, onInput, onProject}: InputPanelProps) {
  const activeTab = useBusbarStore((state) => state.activeInputTab);
  const setActiveTab = useBusbarStore((state) => state.setActiveInputTab);
  const materialProfiles = profiles.filter((profile) => profile.materialId === input.materialId);
  const attention = tabAttention(result.warnings);
  const material = materials.find((item) => item.id === input.materialId);
  const requiredClearance = result.clearance.requiredAirClearance_mm;

  return (
    <aside className="input-rail" aria-label="Calculator inputs">
      <InputTabs tabs={TABS} active={activeTab} onChange={setActiveTab} attention={attention}>
        {activeTab === 'project' && (
          <Panel title="Project">
            <div className="field-grid" role="tabpanel" id="input-panel-project" aria-labelledby="input-tab-project">
              <TextField label="Project" value={input.project.projectName} onChange={(projectName) => onProject({projectName})} />
              <TextField label="Panel" value={input.project.panelName} onChange={(panelName) => onProject({panelName})} />
              <TextField label="Tag" value={input.project.tag} onChange={(tag) => onProject({tag})} />
              <TextField label="Revision" value={input.project.revision} onChange={(revision) => onProject({revision})} />
              <TextField label="Engineer" value={input.project.engineer} onChange={(engineer) => onProject({engineer})} />
              <TextField label="Date" type="date" value={input.project.date} onChange={(date) => onProject({date})} />
            </div>
          </Panel>
        )}

        {activeTab === 'system' && (
          <Panel title="System">
            <div className="field-grid" role="tabpanel" id="input-panel-system" aria-labelledby="input-tab-system">
              <div className="field-grid__full">
                <SegmentedButton<SystemType>
                  label="System type"
                  value={input.systemType}
                  options={[
                    {value: 'AC', label: 'AC'},
                    {value: 'DC', label: 'DC'},
                  ]}
                  onChange={(systemType) =>
                    onInput({
                      systemType,
                      phaseMode: systemType === 'DC' ? 'dc-pair' : input.phaseMode === 'dc-pair' ? '3P+N' : input.phaseMode,
                    })
                  }
                />
              </div>
              <NumberField label="Voltage L-L" unit="V" required value={input.ratedVoltage_V} min={1} onChange={(ratedVoltage_V) => onInput({ratedVoltage_V: ratedVoltage_V ?? 0})} />
              {input.systemType === 'AC' ? (
                <NumberField label="Frequency" unit="Hz" value={input.frequency_Hz} min={1} onChange={(frequency_Hz) => onInput({frequency_Hz: frequency_Hz ?? 50})} />
              ) : null}
              <SelectField label="Phases" value={input.phaseMode} onChange={(phaseMode) => onInput({phaseMode: phaseMode as PhaseMode})}>
                {input.systemType === 'DC' ? (
                  <option value="dc-pair">DC pair</option>
                ) : (
                  <>
                    <option value="1P">1P + N</option>
                    <option value="3P">3P</option>
                    <option value="3P+N">3P + N</option>
                  </>
                )}
              </SelectField>
              <NumberField label="Design current" unit="A" required value={input.ratedCurrent_A} min={1} onChange={(ratedCurrent_A) => onInput({ratedCurrent_A: ratedCurrent_A ?? 0})} />
            </div>
          </Panel>
        )}

        {activeTab === 'busbars' && (
          <Panel title="Busbar Configuration">
            <div className="field-grid" role="tabpanel" id="input-panel-busbars" aria-labelledby="input-tab-busbars">
              <SelectField label="Material" value={input.materialId} onChange={(materialId) => onInput({materialId})}>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.label}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Profile W x T" value={input.profileId} onChange={(profileId) => onInput({profileId})}>
                {materialProfiles.map((profile) => (
                  <option key={profile.profileId} value={profile.profileId}>
                    {profile.dimensions.width_mm} x {profile.dimensions.thickness_mm} mm
                  </option>
                ))}
              </SelectField>
              <NumberField label="Bars per phase" unit="pcs" value={input.barsPerPhase} min={1} max={4} onChange={(barsPerPhase) => onInput({barsPerPhase: barsPerPhase ?? 1})} />
              <NumberField label="Bar gap" unit="mm" value={input.barGap_mm} min={0} step={0.5} onChange={(barGap_mm) => onInput({barGap_mm: barGap_mm ?? 0})} />
              <SelectField
                label="Surface finish"
                value={input.surfaceFinish ?? 'bare'}
                onChange={(surfaceFinish) => onInput({surfaceFinish: surfaceFinish as SurfaceFinish})}
              >
                {finishOptions.map((option) => {
                  const available = option.value === 'bare' || material?.emissivity[option.value] !== undefined;
                  return (
                    <option key={option.value} value={option.value} disabled={!available}>
                      {option.label}
                    </option>
                  );
                })}
              </SelectField>
            </div>
          </Panel>
        )}

        {activeTab === 'layout' && (
          <Panel title="Layout">
            <div className="field-grid" role="tabpanel" id="input-panel-layout" aria-labelledby="input-tab-layout">
              <div className="field-grid__full">
                <ArrangementCards
                  value={input.arrangement}
                  onChange={(arrangement: ArrangementDirection) => onInput({arrangement})}
                />
              </div>
              <div className="field-grid__full">
                <OrientationCards
                  value={input.orientation}
                  onChange={(orientation: BarOrientation) => onInput({orientation})}
                />
              </div>
              <NumberField label="Phase gap" unit="mm" value={input.phaseGap_mm} min={0} step={0.5} onChange={(phaseGap_mm) => onInput({phaseGap_mm: phaseGap_mm ?? 0})} />
              <NumberField label="Wall clearance" unit="mm" value={input.sideClearance_mm} min={0} step={0.5} onChange={(sideClearance_mm) => onInput({sideClearance_mm: sideClearance_mm ?? 0})} />
              {requiredClearance > 0 && input.phaseGap_mm < requiredClearance ? (
                <div className="field-grid__full">
                  <button
                    type="button"
                    className="field-inline-action"
                    onClick={() => onInput({phaseGap_mm: Math.ceil(requiredClearance * 2) / 2})}
                  >
                    Apply required clearance ({requiredClearance.toFixed(1)} mm)
                  </button>
                </div>
              ) : null}
              <NumberField label="Creepage actual" unit="mm" value={input.actualCreepage_mm} min={0} step={0.5} onChange={(actualCreepage_mm) => onInput({actualCreepage_mm})} />
              <NumberField label="Altitude" unit="m" value={input.altitude_m} min={0} max={6000} step={100} onChange={(altitude_m) => onInput({altitude_m})} />
            </div>
          </Panel>
        )}

        {activeTab === 'environment' && (
          <Panel title="Environment">
            <div className="field-grid" role="tabpanel" id="input-panel-environment" aria-labelledby="input-tab-environment">
              <NumberField label="Ambient temp" unit="°C" value={input.ambientTemp_C} min={-20} max={80} onChange={(ambientTemp_C) => onInput({ambientTemp_C: ambientTemp_C ?? 35})} />
              <SelectField
                label="Cooling"
                value={input.coolingPresetId}
                onChange={(coolingPresetId) => {
                  const preset = coolingPresets.find((item) => item.id === coolingPresetId);
                  onInput({coolingPresetId, enclosureMultiplier: preset?.enclosureDeratingFactor ?? input.enclosureMultiplier});
                }}
              >
                {coolingPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </SelectField>
              {(() => {
                const preset = coolingPresets.find((item) => item.id === input.coolingPresetId);
                return preset ? (
                  <div className="field-grid__full">
                    <p className="field-note">
                      {preset.description} · derating ×{preset.enclosureDeratingFactor.toFixed(2)}
                    </p>
                  </div>
                ) : null;
              })()}
              <NumberField label="Enclosure factor" value={input.enclosureMultiplier} min={0.25} max={2} step={0.01} onChange={(enclosureMultiplier) => onInput({enclosureMultiplier: enclosureMultiplier ?? 1})} />
              <NumberField label="Forecast" unit="h" value={input.forecastHours} min={0.2} max={24} step={0.5} onChange={(forecastHours) => onInput({forecastHours: forecastHours ?? 4})} />
            </div>
          </Panel>
        )}

        {activeTab === 'short-circuit' && (
          <Panel title="Short-circuit">
            <div className="field-grid" role="tabpanel" id="input-panel-short-circuit" aria-labelledby="input-tab-short-circuit">
              <NumberField label="Ik rms" unit="kA" value={input.rmsShortCircuit_kA} min={0} step={0.1} onChange={(rmsShortCircuit_kA) => onInput({rmsShortCircuit_kA})} />
              <NumberField label="Ipk" unit="kA" value={input.peakShortCircuit_kA} min={0} step={0.1} onChange={(peakShortCircuit_kA) => onInput({peakShortCircuit_kA})} />
              <NumberField label="Duration" unit="s" value={input.shortCircuitDuration_s} min={0} step={0.05} onChange={(shortCircuitDuration_s) => onInput({shortCircuitDuration_s})} />
              <NumberField label="Support spacing" unit="mm" value={input.supportSpacing_mm} min={1} step={10} onChange={(supportSpacing_mm) => onInput({supportSpacing_mm})} />
              <NumberField label="Support rating" unit="kN" value={input.supportRating_kN} min={0} step={0.5} onChange={(supportRating_kN) => onInput({supportRating_kN})} />
            </div>
          </Panel>
        )}
      </InputTabs>
    </aside>
  );
}
