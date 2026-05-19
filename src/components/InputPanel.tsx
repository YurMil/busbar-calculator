import {coolingPresets, materials, profiles} from '../domain/data';
import type {ArrangementDirection, BarOrientation, BusbarInput, PhaseMode, SystemType} from '../domain/types';
import {NumberField, Panel, SegmentedButton, SelectField, TextField} from './ui';

type InputPanelProps = {
  input: BusbarInput;
  onInput: (patch: Partial<BusbarInput>) => void;
  onProject: (patch: Partial<BusbarInput['project']>) => void;
};

export function InputPanel({input, onInput, onProject}: InputPanelProps) {
  const materialProfiles = profiles.filter((profile) => profile.materialId === input.materialId);

  return (
    <aside className="input-rail" aria-label="Calculator inputs">
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

      <Panel title="Project">
        <div className="field-grid">
          <TextField label="Project" value={input.project.projectName} onChange={(projectName) => onProject({projectName})} />
          <TextField label="Panel" value={input.project.panelName} onChange={(panelName) => onProject({panelName})} />
          <TextField label="Tag" value={input.project.tag} onChange={(tag) => onProject({tag})} />
          <TextField label="Revision" value={input.project.revision} onChange={(revision) => onProject({revision})} />
          <TextField label="Engineer" value={input.project.engineer} onChange={(engineer) => onProject({engineer})} />
          <TextField label="Date" type="date" value={input.project.date} onChange={(date) => onProject({date})} />
        </div>
      </Panel>

      <Panel title="System">
        <div className="field-grid">
          <NumberField label="Voltage L-L" unit="V" value={input.ratedVoltage_V} min={1} onChange={(ratedVoltage_V) => onInput({ratedVoltage_V: ratedVoltage_V ?? 0})} />
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
          <NumberField label="Design current" unit="A" value={input.ratedCurrent_A} min={1} onChange={(ratedCurrent_A) => onInput({ratedCurrent_A: ratedCurrent_A ?? 0})} />
        </div>
      </Panel>

      <Panel title="Busbar Configuration">
        <div className="field-grid">
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
          <SelectField label="Arrangement" value={input.arrangement} onChange={(arrangement) => onInput({arrangement: arrangement as ArrangementDirection})}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </SelectField>
          <SelectField label="Orientation" value={input.orientation} onChange={(orientation) => onInput({orientation: orientation as BarOrientation})}>
            <option value="flatwise">Flatwise</option>
            <option value="edgewise">Edgewise</option>
          </SelectField>
          <NumberField label="Phase gap" unit="mm" value={input.phaseGap_mm} min={0} step={0.5} onChange={(phaseGap_mm) => onInput({phaseGap_mm: phaseGap_mm ?? 0})} />
          <NumberField label="Bar gap" unit="mm" value={input.barGap_mm} min={0} step={0.5} onChange={(barGap_mm) => onInput({barGap_mm: barGap_mm ?? 0})} />
          <NumberField label="Wall clearance" unit="mm" value={input.sideClearance_mm} min={0} step={0.5} onChange={(sideClearance_mm) => onInput({sideClearance_mm: sideClearance_mm ?? 0})} />
        </div>
      </Panel>

      <Panel title="Environment">
        <div className="field-grid">
          <NumberField label="Ambient temp" unit="degC" value={input.ambientTemp_C} min={-20} max={80} onChange={(ambientTemp_C) => onInput({ambientTemp_C: ambientTemp_C ?? 35})} />
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
          <NumberField label="Enclosure factor" value={input.enclosureMultiplier} min={0.25} max={2} step={0.01} onChange={(enclosureMultiplier) => onInput({enclosureMultiplier: enclosureMultiplier ?? 1})} />
          <NumberField label="Forecast" unit="h" value={input.forecastHours} min={0.2} max={24} step={0.5} onChange={(forecastHours) => onInput({forecastHours: forecastHours ?? 4})} />
        </div>
      </Panel>

      <Panel title="Short-circuit">
        <div className="field-grid">
          <NumberField label="Ik rms" unit="kA" value={input.rmsShortCircuit_kA} min={0} step={0.1} onChange={(rmsShortCircuit_kA) => onInput({rmsShortCircuit_kA})} />
          <NumberField label="Ipk" unit="kA" value={input.peakShortCircuit_kA} min={0} step={0.1} onChange={(peakShortCircuit_kA) => onInput({peakShortCircuit_kA})} />
          <NumberField label="Duration" unit="s" value={input.shortCircuitDuration_s} min={0} step={0.05} onChange={(shortCircuitDuration_s) => onInput({shortCircuitDuration_s})} />
          <NumberField label="Support spacing" unit="mm" value={input.supportSpacing_mm} min={1} step={10} onChange={(supportSpacing_mm) => onInput({supportSpacing_mm})} />
          <NumberField label="Support rating" unit="kN" value={input.supportRating_kN} min={0} step={0.5} onChange={(supportRating_kN) => onInput({supportRating_kN})} />
        </div>
      </Panel>
    </aside>
  );
}
