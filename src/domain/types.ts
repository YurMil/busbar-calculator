export type ResultStatus = 'pass' | 'warn' | 'fail' | 'incomplete' | 'not-evaluated';
export type Severity = 'info' | 'warning' | 'error';
export type DatasetSourceType =
  | 'licensed-standard-table'
  | 'vendor-catalog'
  | 'project-rule'
  | 'engineering-default'
  | 'example-only';
export type DatasetReviewStatus = 'draft' | 'reviewed' | 'approved' | 'deprecated';

export type DatasetMetadata = {
  datasetId: string;
  title: string;
  sourceType: DatasetSourceType;
  sourceRef: string;
  revision: string;
  reviewStatus: DatasetReviewStatus;
  notes: string[];
};

export type CalculationWarning = {
  code: string;
  severity: Severity;
  title: string;
  message: string;
  affectedResultIds?: string[];
  recommendedAction?: string;
};

export type SystemType = 'AC' | 'DC';
export type PhaseMode = 'dc-pair' | '1P' | '3P' | '3P+N';
export type MaterialFamily = 'copper' | 'aluminium' | 'custom';
export type ArrangementDirection = 'horizontal' | 'vertical';
export type BarOrientation = 'flatwise' | 'edgewise';
export type SurfaceFinish = 'bare' | 'oxidized' | 'tinned' | 'painted';

export type BusbarMaterial = {
  id: string;
  label: string;
  family: MaterialFamily;
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
  allowableContinuousTemp_C: number;
  allowableStress_MPa?: number;
  shortCircuit?: {
    k_A_sqrt_s_per_mm2?: number;
    initialTemp_C?: number;
    finalTemp_C?: number;
    sourceRef?: string;
  };
  metadata: DatasetMetadata;
};

export type BusbarProfile = {
  profileId: string;
  materialId: string;
  standard: 'DIN_43670' | 'DIN_43671' | 'CUSTOM' | string;
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

export type CoolingPreset = {
  id: string;
  label: string;
  description: string;
  convectiveCoefficient_W_m2K: number;
  enclosureDeratingFactor: number;
  radiationEnabled: boolean;
  validationStatus: 'estimate' | 'vendor-validated' | 'project-approved';
  warnings: string[];
  metadata: DatasetMetadata;
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

export type ClearanceRuleSet = {
  id: string;
  label: string;
  basis: 'IEC_60664_1' | 'IEC_61439_PROJECT_RULE' | 'VENDOR_RULE' | 'CUSTOM';
  metadata: DatasetMetadata;
  rules: ClearanceRule[];
};

export type ProjectMetadata = {
  projectName: string;
  panelName: string;
  tag: string;
  revision: string;
  engineer: string;
  date: string;
};

export type BusbarInput = {
  project: ProjectMetadata;
  systemType: SystemType;
  ratedVoltage_V: number;
  ratedCurrent_A: number;
  frequency_Hz: number;
  phaseMode: PhaseMode;
  materialId: string;
  profileId: string;
  width_mm: number;
  thickness_mm: number;
  barsPerPhase: number;
  arrangement: ArrangementDirection;
  orientation: BarOrientation;
  phaseGap_mm: number;
  barGap_mm: number;
  sideClearance_mm: number;
  topBottomClearance_mm: number;
  actualCreepage_mm?: number;
  altitude_m?: number;
  surfaceFinish?: SurfaceFinish;
  ambientTemp_C: number;
  coolingPresetId: string;
  enclosureMultiplier: number;
  forecastHours: number;
  rmsShortCircuit_kA?: number;
  shortCircuitDuration_s?: number;
  peakShortCircuit_kA?: number;
  supportSpacing_mm?: number;
  supportRating_kN?: number;
};

export type ConductorBox = {
  id: string;
  phaseId: string;
  x_mm: number;
  y_mm: number;
  w_mm: number;
  h_mm: number;
  color: string;
};

export type PhaseCenter = {
  phaseId: string;
  x_mm: number;
  y_mm: number;
};

export type ChannelEnvelopeResult = {
  width_mm: number;
  height_mm: number;
  phaseCenters: PhaseCenter[];
  conductorBoxes: ConductorBox[];
  requiredClearance_mm: number;
  sideClearance_mm: number;
  warnings: CalculationWarning[];
};

export type TemperatureForecastPoint = {
  time_s: number;
  temperature_C: number;
  losses_W_per_m: number;
  cooling_W_per_m: number;
};

export type ProfileCandidate = {
  rank: number;
  profileId: string;
  materialId: string;
  materialLabel: string;
  width_mm: number;
  thickness_mm: number;
  barsPerPhase: number;
  areaPerPhase_mm2: number;
  massPerMeterPerPhase_kg_m: number;
  currentDensity_A_per_mm2: number;
  losses_W_per_m: number;
  steadyStateTemp_C: number;
  channelWidth_mm: number;
  channelHeight_mm: number;
  tableRating_A: number | null;
  shortCircuitMargin: number | null;
  status: ResultStatus;
  score: number;
};

export type CalculationTraceItem = {
  id: string;
  label: string;
  equation?: string;
  inputs: Record<string, number | string>;
  output: number | string;
  unit?: string;
  method: string;
  sourceRef?: string;
};

export type BusbarCalculationResult = {
  inputHash: string;
  engineVersion: string;
  status: ResultStatus;
  selectedProfile: {
    profileId: string;
    materialId: string;
    materialLabel: string;
    width_mm: number;
    thickness_mm: number;
    barsPerPhase: number;
    areaPerPhase_mm2: number;
    massPerMeterPerPhase_kg_m: number;
  };
  electrical: {
    current_A: number;
    voltage_V: number;
    systemType: SystemType;
    frequency_Hz?: number;
    currentDensity_A_per_mm2: number;
    resistance_ohm_per_m: number;
    losses_W_per_m: number;
    acMultiplier: number;
    tableRating_A?: number;
    tableUtilization?: number;
  };
  thermal: {
    ambientTemp_C: number;
    steadyStateTemp_C: number;
    tempRise_K: number;
    cooling_W_per_m: number;
    forecast: TemperatureForecastPoint[];
    status: ResultStatus;
  };
  clearance: {
    requiredAirClearance_mm: number;
    actualPhaseGap_mm: number;
    requiredCreepage_mm?: number;
    actualCreepage_mm?: number;
    creepageStatus: ResultStatus;
    altitudeFactor: number;
    ruleSetId: string;
    sourceRef: string;
    status: ResultStatus;
  };
  envelope: ChannelEnvelopeResult;
  shortCircuit: {
    thermalStatus: ResultStatus;
    mechanicalStatus: ResultStatus;
    supportStatus: ResultStatus;
    i2t_A2s?: number;
    allowableI2t_A2s?: number;
    requiredArea_mm2?: number;
    thermalUtilization?: number;
    force_N_per_m?: number;
    phaseFactor?: number;
    bendingStress_MPa?: number;
    mechanicalUtilization?: number;
    supportForce_kN?: number;
    supportUtilization?: number;
  };
  candidates: ProfileCandidate[];
  warnings: CalculationWarning[];
  trace: CalculationTraceItem[];
  datasets: DatasetMetadata[];
};
