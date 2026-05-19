# TypeScript Result Types

```ts
export type ResultStatus = 'pass' | 'warn' | 'fail' | 'incomplete' | 'not-evaluated';

export type CalculationWarning = {
  code: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  affectedResultIds?: string[];
  recommendedAction?: string;
};

export type BusbarCalculationResult = {
  inputHash: string;
  engineVersion: string;
  status: ResultStatus;
  selectedProfile: {
    profileId?: string;
    materialId: string;
    width_mm: number;
    thickness_mm: number;
    barsPerPhase: number;
    areaPerPhase_mm2: number;
    massPerMeterPerPhase_kg_m?: number;
  };
  electrical: {
    current_A: number;
    voltage_V: number;
    systemType: 'AC' | 'DC';
    frequency_Hz?: number;
    currentDensity_A_per_mm2: number;
    resistance_ohm_per_m: number;
    losses_W_per_m: number;
  };
  thermal: {
    ambientTemp_C: number;
    steadyStateTemp_C?: number;
    tempRise_K?: number;
    forecast?: Array<{
      time_s: number;
      temperature_C: number;
    }>;
    status: ResultStatus;
  };
  clearance: {
    requiredAirClearance_mm?: number;
    actualPhaseGap_mm?: number;
    requiredCreepage_mm?: number;
    status: ResultStatus;
  };
  envelope: {
    width_mm: number;
    height_mm: number;
    conductorBoxes: Array<{
      id: string;
      phaseId: string;
      x_mm: number;
      y_mm: number;
      w_mm: number;
      h_mm: number;
    }>;
  };
  shortCircuit?: {
    thermalStatus: ResultStatus;
    mechanicalStatus: ResultStatus;
    i2t_A2s?: number;
    force_N_per_m?: number;
    bendingStress_MPa?: number;
  };
  warnings: CalculationWarning[];
};
```
