import {profiles} from '../domain/data';
import type {BusbarInput} from '../domain/types';

const defaultProfile = profiles.find((profile) => profile.profileId === 'cu_80_10_example') ?? profiles[0];

export const defaultBusbarInput: BusbarInput = {
  project: {
    projectName: 'Main LV Switchboard',
    panelName: 'MCC-101',
    tag: 'MSB-01',
    revision: 'A',
    engineer: 'Alice Johnson',
    date: new Date().toISOString().slice(0, 10),
  },
  systemType: 'AC',
  ratedVoltage_V: 400,
  ratedCurrent_A: 1600,
  frequency_Hz: 50,
  phaseMode: '3P+N',
  materialId: defaultProfile.materialId,
  profileId: defaultProfile.profileId,
  width_mm: defaultProfile.dimensions.width_mm,
  thickness_mm: defaultProfile.dimensions.thickness_mm,
  barsPerPhase: 2,
  arrangement: 'horizontal',
  orientation: 'flatwise',
  phaseGap_mm: 40,
  barGap_mm: 10,
  sideClearance_mm: 30,
  topBottomClearance_mm: 30,
  ambientTemp_C: 35,
  coolingPresetId: 'natural_enclosed',
  enclosureMultiplier: 0.85,
  forecastHours: 4,
  rmsShortCircuit_kA: 50,
  shortCircuitDuration_s: 1,
  peakShortCircuit_kA: 105,
  supportSpacing_mm: 300,
  supportRating_kN: 12,
};
