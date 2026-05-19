# Data Model and Standards Strategy

## 1. Why data modelling matters

Busbar calculations depend heavily on material properties, tabulated profile ratings, arrangement factors, voltage-clearance tables and short-circuit constants. These values must be auditable and replaceable.

The app should avoid hidden constants in React components. Every engineering dataset must have metadata.

## 2. Dataset metadata

```ts
export type DatasetSourceType =
  | 'licensed-standard-table'
  | 'vendor-catalog'
  | 'project-rule'
  | 'engineering-default'
  | 'example-only';

export type DatasetReviewStatus =
  | 'draft'
  | 'reviewed'
  | 'approved'
  | 'deprecated';

export type DatasetMetadata = {
  datasetId: string;
  title: string;
  sourceType: DatasetSourceType;
  sourceRef: string;
  revision: string;
  validFrom?: string;
  validUntil?: string;
  reviewStatus: DatasetReviewStatus;
  reviewedBy?: string;
  notes: string[];
};
```

## 3. Material model

```ts
export type BusbarMaterial = {
  id: string;
  label: string;
  family: 'copper' | 'aluminium' | 'custom';
  standardName?: string;
  resistivity20_ohm_m: number;
  conductivityPercentIACS?: number;
  temperatureCoefficient_1_per_K: number;
  density_kg_m3: number;
  heatCapacity_J_kgK: number;
  emissivity: {
    default: number;
    oxidized?: number;
    tinned?: number;
    painted?: number;
  };
  allowableContinuousTemp_C?: number;
  allowableStress_MPa?: number;
  shortCircuit?: {
    k_A_sqrt_s_per_mm2?: number;
    initialTemp_C?: number;
    finalTemp_C?: number;
    sourceRef?: string;
  };
  metadata: DatasetMetadata;
};
```

## 4. Profile model

```ts
export type BusbarProfile = {
  profileId: string;
  materialId: string;
  standard?: 'DIN_43670' | 'DIN_43671' | 'CUSTOM' | string;
  dimensions: {
    width_mm: number;
    thickness_mm: number;
  };
  properties: {
    crossSectionArea_mm2: number;
    perimeter_mm: number;
    massPerMeter_kg_m: number;
  };
  ratings?: {
    currentAc_A?: number;
    currentDc_A?: number;
    referenceAmbient_C?: number;
    referenceTempRise_K?: number;
    referenceArrangement?: string;
  };
  metadata: DatasetMetadata;
};
```

## 5. Arrangement model

```ts
export type ArrangementId =
  | 'horizontal-flatwise'
  | 'horizontal-edgewise'
  | 'vertical-flatwise'
  | 'vertical-edgewise'
  | 'custom';

export type ArrangementPreset = {
  id: ArrangementId;
  label: string;
  phaseDirection: 'horizontal' | 'vertical' | 'custom';
  barOrientation: 'flatwise' | 'edgewise';
  defaultPhaseGap_mm: number;
  defaultBarGap_mm: number;
  defaultSideClearance_mm: number;
  coolingMultiplier: number;
  acProximityMultiplier: number;
  notes: string[];
  metadata: DatasetMetadata;
};
```

## 6. Clearance rule model

```ts
export type ClearanceRuleSet = {
  id: string;
  label: string;
  basis: 'IEC_60664_1' | 'IEC_61439_PROJECT_RULE' | 'VENDOR_RULE' | 'CUSTOM';
  metadata: DatasetMetadata;
  rules: ClearanceRule[];
};

export type ClearanceRule = {
  id: string;
  systemType: 'AC' | 'DC' | 'either';
  voltageMin_V: number;
  voltageMax_V: number;
  pollutionDegree?: 1 | 2 | 3 | 4;
  overvoltageCategory?: 'I' | 'II' | 'III' | 'IV';
  altitudeMax_m?: number;
  minimumAirClearance_mm: number;
  minimumCreepage_mm?: number;
  manufacturingMargin_mm?: number;
  note?: string;
};
```

## 7. Cooling preset model

```ts
export type CoolingPreset = {
  id: string;
  label: string;
  description: string;
  convectiveCoefficient_W_m2K: number;
  enclosureDeratingFactor: number;
  radiationEnabled: boolean;
  defaultAirVelocity_m_s?: number;
  validationStatus: 'estimate' | 'vendor-validated' | 'project-approved';
  warnings: string[];
  metadata: DatasetMetadata;
};
```

## 8. Short-circuit model

```ts
export type ShortCircuitInput = {
  rmsCurrent_kA?: number;
  duration_s?: number;
  peakCurrent_kA?: number;
  xOverR?: number;
  protectiveDeviceLetThrough_A2s?: number;
  supportSpacing_mm?: number;
  supportRating_kN?: number;
  conductorAllowableStress_MPa?: number;
};
```

If `peakCurrent_kA` is not provided, the app may optionally estimate it from RMS current and a configurable peak factor, but the report must say that the value is estimated.

## 9. Report model

```ts
export type BusbarReport = {
  reportId: string;
  generatedAt: string;
  appVersion: string;
  engineVersion: string;
  project: ProjectMetadata;
  input: BusbarCalculationInput;
  result: BusbarCalculationResult;
  datasets: DatasetMetadata[];
  warnings: CalculationWarning[];
  signatures?: ReportSignature[];
};
```

## 10. Example profile seed

Use only a small example seed until licensed or approved tables are available:

```json
{
  "profileId": "cu_30_10_example",
  "materialId": "cu-etp-example",
  "standard": "DIN_43671",
  "dimensions": {
    "width_mm": 30,
    "thickness_mm": 10
  },
  "properties": {
    "crossSectionArea_mm2": 300,
    "perimeter_mm": 80,
    "massPerMeter_kg_m": 2.67
  },
  "ratings": {
    "currentAc_A": 710,
    "currentDc_A": 750,
    "referenceAmbient_C": 35,
    "referenceTempRise_K": 50,
    "referenceArrangement": "single_bar_free_air_example"
  },
  "metadata": {
    "datasetId": "example-user-spec-seed",
    "title": "Example profile seed for development",
    "sourceType": "example-only",
    "sourceRef": "Project specification seed; verify before production use",
    "revision": "0.1.0",
    "reviewStatus": "draft",
    "notes": [
      "This is not a complete standard table.",
      "Replace with approved DIN/vendor data before production use."
    ]
  }
}
```

## 11. Standards registry

```ts
export type StandardRegistryEntry = {
  id: string;
  title: string;
  role: 'profile-rating' | 'assembly-verification' | 'clearance' | 'short-circuit' | 'safety' | 'reference';
  implementationStatus: 'not-started' | 'interface-ready' | 'example-data' | 'approved-data';
  notes: string[];
};
```

Suggested registry entries:

```ts
export const standardRegistry: StandardRegistryEntry[] = [
  {
    id: 'DIN_43671',
    title: 'Copper busbars; dimensions and current ratings',
    role: 'profile-rating',
    implementationStatus: 'interface-ready',
    notes: ['Requires licensed/approved tabular data.'],
  },
  {
    id: 'DIN_43670',
    title: 'Aluminium busbars; dimensions and current ratings',
    role: 'profile-rating',
    implementationStatus: 'interface-ready',
    notes: ['Requires licensed/approved tabular data.'],
  },
  {
    id: 'IEC_60664_1',
    title: 'Insulation coordination for equipment within low-voltage systems',
    role: 'clearance',
    implementationStatus: 'interface-ready',
    notes: ['Use licensed table data for clearance/creepage rules.'],
  },
  {
    id: 'IEC_61439',
    title: 'Low-voltage switchgear and controlgear assemblies',
    role: 'assembly-verification',
    implementationStatus: 'interface-ready',
    notes: ['Tool does not replace design verification or type tests.'],
  },
  {
    id: 'IEC_60865',
    title: 'Short-circuit currents - calculation of effects',
    role: 'short-circuit',
    implementationStatus: 'interface-ready',
    notes: ['Use for electrodynamic force methodology.'],
  },
  {
    id: 'IEC_60909',
    title: 'Short-circuit currents in three-phase AC systems',
    role: 'short-circuit',
    implementationStatus: 'interface-ready',
    notes: ['Use calculated Ik/Ipk inputs from network study or protective-device data.'],
  },
];
```

## 12. Data governance rules

1. No unreviewed dataset can be marked as production-approved.
2. Every table value must have a source reference.
3. Changes to approved datasets require a changelog entry.
4. Golden tests must be updated whenever dataset values change.
5. PDF reports must include dataset revision ids.
6. Engineering defaults must show warnings in UI and report.
7. User-imported custom datasets must be marked `custom` and not silently treated as approved.

## 13. Import/export format

Use JSON for project import/export:

```ts
export type BusbarProjectFile = {
  fileType: 'cadautoscript.busbar-project';
  schemaVersion: '1.0';
  createdAt: string;
  appVersion: string;
  project: ProjectMetadata;
  input: BusbarCalculationInput;
  resultSnapshot?: BusbarCalculationResult;
};
```

## 14. Backward compatibility

When schema changes:

- increment `schemaVersion`;
- write a migration function;
- never silently discard unknown input fields;
- report unsupported fields to user during import.
