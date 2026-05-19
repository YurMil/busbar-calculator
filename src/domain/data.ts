import type {
  BusbarMaterial,
  BusbarProfile,
  ClearanceRuleSet,
  CoolingPreset,
  DatasetMetadata,
} from './types';

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
];

const buildProfile = (
  material: BusbarMaterial,
  width_mm: number,
  thickness_mm: number,
  standard: 'DIN_43670' | 'DIN_43671',
  currentAc_A: number,
): BusbarProfile => {
  const area = width_mm * thickness_mm;
  return {
    profileId: `${material.family === 'copper' ? 'cu' : 'al'}_${width_mm}_${thickness_mm}_example`,
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

export const profiles: BusbarProfile[] = [
  // Copper DIN 43671 — thin (5 mm)
  buildProfile(copper, 20, 5, 'DIN_43671', 275),
  buildProfile(copper, 25, 5, 'DIN_43671', 330),
  buildProfile(copper, 30, 5, 'DIN_43671', 390),
  buildProfile(copper, 40, 5, 'DIN_43671', 500),
  buildProfile(copper, 50, 5, 'DIN_43671', 605),
  buildProfile(copper, 60, 5, 'DIN_43671', 705),
  // Copper DIN 43671 — medium (6.3 / 8 mm)
  buildProfile(copper, 30, 6.3, 'DIN_43671', 470),
  buildProfile(copper, 40, 6.3, 'DIN_43671', 595),
  buildProfile(copper, 50, 6.3, 'DIN_43671', 720),
  buildProfile(copper, 60, 6.3, 'DIN_43671', 840),
  buildProfile(copper, 80, 6.3, 'DIN_43671', 1070),
  buildProfile(copper, 100, 6.3, 'DIN_43671', 1290),
  // Copper DIN 43671 — 10 mm
  buildProfile(copper, 30, 10, 'DIN_43671', 710),
  buildProfile(copper, 40, 10, 'DIN_43671', 850),
  buildProfile(copper, 50, 10, 'DIN_43671', 1040),
  buildProfile(copper, 60, 10, 'DIN_43671', 1220),
  buildProfile(copper, 80, 10, 'DIN_43671', 1550),
  buildProfile(copper, 100, 10, 'DIN_43671', 1850),
  buildProfile(copper, 120, 10, 'DIN_43671', 2150),
  buildProfile(copper, 160, 10, 'DIN_43671', 2700),
  buildProfile(copper, 200, 10, 'DIN_43671', 3200),
  // Copper DIN 43671 — 12 mm
  buildProfile(copper, 60, 12, 'DIN_43671', 1390),
  buildProfile(copper, 80, 12, 'DIN_43671', 1700),
  buildProfile(copper, 100, 12, 'DIN_43671', 2050),
  buildProfile(copper, 120, 12, 'DIN_43671', 2350),
  buildProfile(copper, 160, 12, 'DIN_43671', 2950),
  buildProfile(copper, 200, 12, 'DIN_43671', 3500),

  // Aluminium DIN 43670 — thin (5 / 6.3 mm)
  buildProfile(aluminium, 30, 5, 'DIN_43670', 280),
  buildProfile(aluminium, 40, 5, 'DIN_43670', 365),
  buildProfile(aluminium, 50, 5, 'DIN_43670', 445),
  buildProfile(aluminium, 60, 5, 'DIN_43670', 520),
  buildProfile(aluminium, 40, 6.3, 'DIN_43670', 440),
  buildProfile(aluminium, 50, 6.3, 'DIN_43670', 540),
  buildProfile(aluminium, 60, 6.3, 'DIN_43670', 630),
  buildProfile(aluminium, 80, 6.3, 'DIN_43670', 800),
  buildProfile(aluminium, 100, 6.3, 'DIN_43670', 960),
  // Aluminium DIN 43670 — 10 mm
  buildProfile(aluminium, 40, 10, 'DIN_43670', 610),
  buildProfile(aluminium, 50, 10, 'DIN_43670', 760),
  buildProfile(aluminium, 60, 10, 'DIN_43670', 900),
  buildProfile(aluminium, 80, 10, 'DIN_43670', 1160),
  buildProfile(aluminium, 100, 10, 'DIN_43670', 1390),
  buildProfile(aluminium, 120, 10, 'DIN_43670', 1600),
  buildProfile(aluminium, 160, 10, 'DIN_43670', 2010),
  buildProfile(aluminium, 200, 10, 'DIN_43670', 2380),
  // Aluminium DIN 43670 — 12 mm
  buildProfile(aluminium, 80, 12, 'DIN_43670', 1280),
  buildProfile(aluminium, 100, 12, 'DIN_43670', 1540),
  buildProfile(aluminium, 120, 12, 'DIN_43670', 1800),
  buildProfile(aluminium, 160, 12, 'DIN_43670', 2280),
  buildProfile(aluminium, 200, 12, 'DIN_43670', 2700),
];

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
