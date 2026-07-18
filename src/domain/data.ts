import type {
  BusbarMaterial,
  BusbarProfile,
  ClearanceRuleSet,
  CoolingPreset,
  DatasetMetadata,
} from './types';
import {mergeCustomDatasets} from './customDatasets';

const exampleMetadata = (datasetId: string, title: string, sourceRef: string): DatasetMetadata => ({
  datasetId,
  title,
  sourceType: 'example-only',
  sourceRef,
  revision: '0.1.0',
  reviewStatus: 'draft',
  notes: ['Development dataset. Replace with approved DIN/vendor/project data before final design release.'],
});

export const calculationEngineVersion = '0.1.0';

export const phaseColors: Record<string, string> = {
  L1: '#ef4444',
  L2: '#f59e0b',
  L3: '#1689f2',
  N: '#cbd5e1',
  PE: '#22c55e',
  'DC+': '#ef4444',
  'DC-': '#1689f2',
};

export const materials: BusbarMaterial[] = [
  {
    id: 'cu-etp-example',
    label: 'Copper ETP',
    family: 'copper',
    resistivity20_ohm_m: 1.724e-8,
    conductivityPercentIACS: 100,
    temperatureCoefficient_1_per_K: 0.00393,
    density_kg_m3: 8900,
    heatCapacity_J_kgK: 385,
    emissivity: {
      default: 0.5,
      oxidized: 0.7,
      tinned: 0.25,
      painted: 0.9,
    },
    allowableContinuousTemp_C: 105,
    allowableStress_MPa: 120,
    shortCircuit: {
      k_A_sqrt_s_per_mm2: 143,
      initialTemp_C: 30,
      finalTemp_C: 250,
      sourceRef: 'Example-only k value; verify with project standard.',
    },
    metadata: exampleMetadata('materials-example-v0', 'Development material constants', 'Engineering example values'),
  },
  {
    id: 'al-6101-example',
    label: 'Aluminium 6101',
    family: 'aluminium',
    resistivity20_ohm_m: 2.95e-8,
    conductivityPercentIACS: 58,
    temperatureCoefficient_1_per_K: 0.00403,
    density_kg_m3: 2700,
    heatCapacity_J_kgK: 900,
    emissivity: {
      default: 0.45,
      oxidized: 0.65,
      painted: 0.88,
    },
    allowableContinuousTemp_C: 95,
    allowableStress_MPa: 70,
    shortCircuit: {
      k_A_sqrt_s_per_mm2: 94,
      initialTemp_C: 30,
      finalTemp_C: 200,
      sourceRef: 'Example-only k value; verify with project standard.',
    },
    metadata: exampleMetadata('materials-example-v0', 'Development material constants', 'Engineering example values'),
  },
  {
    id: 'cu-of-example',
    label: 'Copper Cu-OF',
    family: 'copper',
    resistivity20_ohm_m: 1.707e-8,
    conductivityPercentIACS: 101,
    temperatureCoefficient_1_per_K: 0.00393,
    density_kg_m3: 8940,
    heatCapacity_J_kgK: 385,
    emissivity: {
      default: 0.5,
      oxidized: 0.7,
      tinned: 0.25,
      painted: 0.9,
    },
    allowableContinuousTemp_C: 105,
    allowableStress_MPa: 120,
    shortCircuit: {
      k_A_sqrt_s_per_mm2: 143,
      initialTemp_C: 30,
      finalTemp_C: 250,
      sourceRef: 'Example-only k value; verify with project standard.',
    },
    metadata: exampleMetadata('materials-example-v0', 'Development material constants', 'Engineering example values'),
  },
  {
    id: 'al-1350-example',
    label: 'Aluminium 1350',
    family: 'aluminium',
    resistivity20_ohm_m: 2.83e-8,
    conductivityPercentIACS: 61,
    temperatureCoefficient_1_per_K: 0.00403,
    density_kg_m3: 2705,
    heatCapacity_J_kgK: 900,
    emissivity: {
      default: 0.45,
      oxidized: 0.65,
      painted: 0.88,
    },
    allowableContinuousTemp_C: 95,
    allowableStress_MPa: 55,
    shortCircuit: {
      k_A_sqrt_s_per_mm2: 92,
      initialTemp_C: 30,
      finalTemp_C: 200,
      sourceRef: 'Example-only k value; verify with project standard.',
    },
    metadata: exampleMetadata('materials-example-v0', 'Development material constants', 'Engineering example values'),
  },
];

const buildProfile = (
  material: BusbarMaterial,
  width_mm: number,
  thickness_mm: number,
  standard: 'DIN_43670' | 'DIN_43671',
  currentAc_A: number,
  idPrefix?: string,
): BusbarProfile => {
  const area = width_mm * thickness_mm;
  return {
    profileId: `${idPrefix ?? (material.family === 'copper' ? 'cu' : 'al')}_${width_mm}_${thickness_mm}_example`,
    materialId: material.id,
    standard,
    dimensions: {width_mm, thickness_mm},
    properties: {
      crossSectionArea_mm2: area,
      perimeter_mm: 2 * (width_mm + thickness_mm),
      massPerMeter_kg_m: (area * 1e-6) * material.density_kg_m3,
    },
    ratings: {
      currentAc_A,
      currentDc_A: Math.round(currentAc_A * 1.06),
      referenceAmbient_C: 35,
      referenceTempRise_K: 50,
      referenceArrangement: 'single_bar_free_air_example',
    },
    metadata: exampleMetadata(
      'profiles-example-v0',
      `${material.family === 'copper' ? 'Copper' : 'Aluminium'} development busbar profiles`,
      'Initial specification seed; verify before production use',
    ),
  };
};

const copper = materials[0];
const aluminium = materials[1];
const copperOf = materials[2];
const aluminium1350 = materials[3];

// [width_mm, thickness_mm, table AC rating for the reference material]
const copperDimensions: Array<[number, number, number]> = [
  [20, 5, 275], [25, 5, 330], [30, 5, 390], [40, 5, 500], [50, 5, 605], [60, 5, 705],
  [30, 6.3, 470], [40, 6.3, 595], [50, 6.3, 720], [60, 6.3, 840], [80, 6.3, 1070], [100, 6.3, 1290],
  [30, 10, 710], [40, 10, 850], [50, 10, 1040], [60, 10, 1220], [80, 10, 1550], [100, 10, 1850],
  [120, 10, 2150], [160, 10, 2700], [200, 10, 3200],
  [60, 12, 1390], [80, 12, 1700], [100, 12, 2050], [120, 12, 2350], [160, 12, 2950], [200, 12, 3500],
];
const aluminiumDimensions: Array<[number, number, number]> = [
  [30, 5, 280], [40, 5, 365], [50, 5, 445], [60, 5, 520],
  [40, 6.3, 440], [50, 6.3, 540], [60, 6.3, 630], [80, 6.3, 800], [100, 6.3, 960],
  [40, 10, 610], [50, 10, 760], [60, 10, 900], [80, 10, 1160], [100, 10, 1390],
  [120, 10, 1600], [160, 10, 2010], [200, 10, 2380],
  [80, 12, 1280], [100, 12, 1540], [120, 12, 1800], [160, 12, 2280], [200, 12, 2700],
];

export const profiles: BusbarProfile[] = [
  ...copperDimensions.map(([w, t, amps]) => buildProfile(copper, w, t, 'DIN_43671', amps)),
  // Cu-OF: marginally better conductivity than ETP; same table ratings apply.
  ...copperDimensions.map(([w, t, amps]) => buildProfile(copperOf, w, t, 'DIN_43671', amps, 'cuof')),
  ...aluminiumDimensions.map(([w, t, amps]) => buildProfile(aluminium, w, t, 'DIN_43670', amps)),
  // Al 1350: 61 vs 58 %IACS gives ~2% higher table rating than 6101.
  ...aluminiumDimensions.map(([w, t, amps]) => buildProfile(aluminium1350, w, t, 'DIN_43670', Math.round(amps * 1.02), 'al1350')),
];

mergeCustomDatasets(materials, profiles);

export const coolingPresets: CoolingPreset[] = [
  {
    id: 'natural_open_air',
    label: 'Natural open air',
    description: 'Free convection with visible busbars.',
    convectiveCoefficient_W_m2K: 8,
    enclosureDeratingFactor: 1,
    radiationEnabled: true,
    validationStatus: 'estimate',
    warnings: ['Lumped estimate only. Validate against project or vendor data.'],
    metadata: exampleMetadata('cooling-example-v0', 'Development cooling presets', 'Engineering defaults'),
  },
  {
    id: 'natural_enclosed',
    label: 'Natural enclosed',
    description: 'Conservative enclosed channel estimate.',
    convectiveCoefficient_W_m2K: 4.5,
    enclosureDeratingFactor: 0.85,
    radiationEnabled: true,
    validationStatus: 'estimate',
    warnings: ['Actual enclosure ventilation and wall temperature are not modelled.'],
    metadata: exampleMetadata('cooling-example-v0', 'Development cooling presets', 'Engineering defaults'),
  },
  {
    id: 'forced_low',
    label: 'Forced low airflow',
    description: 'Low forced ventilation assumption.',
    convectiveCoefficient_W_m2K: 18,
    enclosureDeratingFactor: 1.08,
    radiationEnabled: true,
    validationStatus: 'estimate',
    warnings: ['Requires an airflow assumption and validation.'],
    metadata: exampleMetadata('cooling-example-v0', 'Development cooling presets', 'Engineering defaults'),
  },
];

export const clearanceRuleSet: ClearanceRuleSet = {
  id: 'iec60664-project-example',
  label: 'IEC 60664 project example',
  basis: 'IEC_61439_PROJECT_RULE',
  metadata: exampleMetadata(
    'clearance-example-v0',
    'Example project clearance rules',
    'Project-rule seed; replace with licensed/project-approved values',
  ),
  rules: [
    {
      id: 'lv-250',
      systemType: 'either',
      voltageMin_V: 0,
      voltageMax_V: 250,
      pollutionDegree: 2,
      overvoltageCategory: 'III',
      minimumAirClearance_mm: 12,
      minimumCreepage_mm: 16,
      manufacturingMargin_mm: 3,
    },
    {
      id: 'lv-500',
      systemType: 'either',
      voltageMin_V: 251,
      voltageMax_V: 500,
      pollutionDegree: 2,
      overvoltageCategory: 'III',
      minimumAirClearance_mm: 20,
      minimumCreepage_mm: 25,
      manufacturingMargin_mm: 5,
    },
    {
      id: 'lv-1000',
      systemType: 'either',
      voltageMin_V: 501,
      voltageMax_V: 1000,
      pollutionDegree: 2,
      overvoltageCategory: 'III',
      minimumAirClearance_mm: 30,
      minimumCreepage_mm: 40,
      manufacturingMargin_mm: 6,
    },
    {
      id: 'dc-1500',
      systemType: 'DC',
      voltageMin_V: 1001,
      voltageMax_V: 1500,
      pollutionDegree: 2,
      overvoltageCategory: 'III',
      minimumAirClearance_mm: 45,
      minimumCreepage_mm: 60,
      manufacturingMargin_mm: 8,
      note: 'Development-only DC extension.',
    },
  ],
};

export const allDatasetMetadata = [
  ...new Map(
    [
      ...materials.map((item) => item.metadata),
      ...profiles.map((item) => item.metadata),
      ...coolingPresets.map((item) => item.metadata),
      clearanceRuleSet.metadata,
    ].map((metadata) => [metadata.datasetId, metadata]),
  ).values(),
];
