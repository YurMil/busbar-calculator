# Calculation Engine Specification

## 1. Purpose

This document defines the calculation approach for the Busbar Calculator. The goal is to create a transparent engineering aid that can be tested and later aligned with licensed standard tables and manufacturer validation data.

The formulas below are implementation-level guidance, not a certification claim. The production calculator must expose assumptions and validation status.

## 2. Calculation inputs

```ts
export type BusbarCalculationInput = {
  system: ElectricalSystemInput;
  material: MaterialSelection;
  profile: ProfileSelection;
  layout: LayoutInput;
  environment: EnvironmentInput;
  shortCircuit?: ShortCircuitInput;
  report?: ProjectMetadata;
};
```

## 3. Unit conventions

Use SI internally.

| Quantity | UI unit | Internal unit |
|---|---:|---:|
| Current | A / kA | A |
| Voltage | V / kV | V |
| Length | mm / m | m |
| Area | mm2 | m2 |
| Temperature | degC | degC/K as needed |
| Resistance | microohm/m | ohm/m |
| Force | N/m or kN/m | N/m |
| Stress | MPa | Pa |
| Time | s / min / h | s |

All domain functions should accept normalized units or explicitly state expected units in type names.

## 4. Profile geometry

For a rectangular bar:

```text
width_mm = w
thickness_mm = t
area_mm2 = w * t
perimeter_mm = 2 * (w + t)
surface_area_per_m_m2 = perimeter_mm / 1000 * 1 m
```

For `n` bars per phase:

```text
total_area_mm2 = n * w * t
effective_surface_area_per_m = exposedSurfaceModel(layout, n, w, t, gaps)
```

The exposed surface area must account for whether bars are separated, stacked, touching, edgewise, flatwise, or partially hidden inside an enclosure. For MVP, use conservative arrangement multipliers and label them as approximate.

## 5. Material properties

Required material properties:

```ts
export type ElectricalMaterial = {
  id: string;
  name: string;
  resistivity20_ohm_m: number;
  temperatureCoefficient_1_per_K: number;
  density_kg_m3: number;
  heatCapacity_J_kgK: number;
  emissivityDefault: number;
  allowableContinuousTemp_C?: number;
  shortCircuitK?: {
    adiabatic_A_sqrt_s_per_mm2: number;
    initialTemp_C: number;
    finalTemp_C: number;
    note: string;
  };
};
```

Typical values must be stored in datasets with source and review metadata. Do not hide constants in formula functions.

## 6. Resistance

### 6.1 DC resistance per meter

```text
R20_per_m = rho20 / A
```

where:

```text
rho20 = resistivity at 20 degC, ohm*m
A = conducting cross-section, m2
```

### 6.2 Temperature-adjusted resistance

```text
Rtheta = R20 * (1 + alpha * (theta_C - 20))
```

where:

```text
alpha = material temperature coefficient, 1/K
```

### 6.3 AC resistance multiplier

For AC systems:

```text
Rac = Rtheta * k_skin * k_proximity * k_harmonic
```

MVP default:

```text
k_skin = 1.00 for thin low-voltage bars below configurable threshold
k_proximity = layout-specific approximate factor
k_harmonic = 1.00 unless user specifies harmonic current factor
```

The app must warn when AC correction factors are approximate.

## 7. Current density

```text
J = I / A_total
```

where:

```text
J = current density, A/mm2
I = continuous current, A
A_total = n * w * t, mm2
```

Current density is a screening result, not the final ampacity decision. Temperature rise and validated profile ratings are more important.

## 8. Power loss per meter

```text
P_loss_per_m = I^2 * R_effective_per_m
```

For multi-bar-per-phase configurations, the ideal model assumes equal current sharing. The calculator should warn if:

- bars are not symmetrical;
- connection geometry is unknown;
- AC proximity correction is not validated;
- parallel bars are touching or very close.

## 9. Continuous current profile selection

Profile selection should use a two-stage method.

### Stage 1: Table-guided candidate filtering

If approved standard/vendor profile rating data is available:

```text
candidate passes if rating_current >= required_current * safety_margin / derating_factor
```

### Stage 2: Physics-guided temperature check

For each candidate:

```text
P_loss -> thermal model -> steady-state temperature -> pass/warn/fail
```

### Candidate scoring

Suggested score:

```text
score = weight_area * normalized_area
      + weight_temperature * normalized_temperature_margin
      + weight_channel * normalized_channel_size
      + weight_short_circuit * short_circuit_margin
      + weight_cost * normalized_material_mass
```

Default sort should prioritize safety and smallest acceptable channel envelope, not only smallest copper mass.

## 10. Ambient and cooling corrections

Cooling presets should be configurable:

```ts
export type CoolingPreset = {
  id: string;
  label: string;
  convectiveCoefficient_W_m2K: number;
  enclosureMultiplier: number;
  radiationEnabled: boolean;
  notes: string[];
};
```

Example presets:

| Preset | Intended use | Notes |
|---|---|---|
| `natural_open_air` | Open busbars with free convection | Estimate only. |
| `natural_enclosed` | Enclosed busbar channel | Conservative lower cooling. |
| `forced_low` | Low forced ventilation | Requires airflow assumption. |
| `forced_custom` | User-defined coefficient | Requires engineering validation. |

## 11. Steady-state thermal model

A simple first release model solves:

```text
P_loss = Q_convection + Q_radiation
```

where:

```text
Q_convection = h * A_surface * (T - T_ambient)
Q_radiation = epsilon * sigma * A_surface * ((T_K)^4 - (T_ambient_K)^4)
```

Definitions:

```text
h = convection coefficient, W/m2*K
A_surface = exposed surface per meter, m2/m
epsilon = surface emissivity
sigma = Stefan-Boltzmann constant
T_K = T_C + 273.15
```

The solver should iterate because resistance increases with temperature:

```text
1. Start theta = ambient + 30 C.
2. Calculate R(theta).
3. Calculate P_loss(theta).
4. Calculate heat rejection.
5. Solve next theta.
6. Stop when abs(delta) < 0.05 C or max iterations reached.
```

Return:

```ts
export type ThermalSteadyStateResult = {
  steadyStateTemp_C: number;
  tempRise_K: number;
  losses_W_per_m: number;
  resistance_ohm_per_m: number;
  cooling: {
    convection_W_per_m: number;
    radiation_W_per_m: number;
    h_W_m2K: number;
    emissivity: number;
  };
  method: 'lumped-steady-state-v1';
  warnings: CalculationWarning[];
};
```

## 12. Transient temperature forecast

Use a lumped thermal-capacitance model:

```text
C_th * dT/dt = P_loss(T) - Q_cooling(T, Tamb)
```

where:

```text
C_th_per_m = mass_per_m * heat_capacity
mass_per_m = density * area_total_m2
```

Implement with a stable numerical method:

- Euler for MVP with small time steps;
- RK4 later if needed.

Output points:

```ts
export type TemperatureForecastPoint = {
  time_s: number;
  temperature_C: number;
  losses_W_per_m: number;
  cooling_W_per_m: number;
};
```

Default forecast durations:

- 10 minutes;
- 1 hour;
- 4 hours;
- custom.

Charts should show:

- ambient temperature line;
- busbar temperature curve;
- continuous allowable temperature line;
- warning/fail region.

## 13. AC/DC mode differences

### DC mode

- no frequency input;
- no skin-effect correction;
- polarity labels DC+ and DC-;
- spacing rules may differ depending on project rule dataset;
- neutral/PE disabled unless user creates custom conductors.

### AC mode

- frequency input required;
- phase labels L1/L2/L3/N/PE;
- optional neutral sizing ratio;
- skin/proximity correction enabled;
- peak short-circuit current may be derived or entered.

## 14. Voltage clearance model

The app should distinguish:

- **air clearance**: shortest distance through air;
- **creepage distance**: shortest path along insulation surface;
- **mechanical gap**: actual physical gap selected by user;
- **manufacturing allowance**: additional tolerance margin.

### 14.1 Required input fields

```ts
export type ClearanceInput = {
  systemType: 'AC' | 'DC';
  ratedVoltage_V: number;
  overvoltageCategory?: 'I' | 'II' | 'III' | 'IV';
  pollutionDegree?: 1 | 2 | 3 | 4;
  altitude_m?: number;
  materialGroup?: 'I' | 'II' | 'IIIa' | 'IIIb';
  ruleSetId: string;
};
```

### 14.2 Rule lookup

Do not hard-code table values in formulas. Use a rule table:

```ts
export type ClearanceRule = {
  id: string;
  ruleSetId: string;
  voltageMin_V: number;
  voltageMax_V: number;
  systemType: 'AC' | 'DC' | 'either';
  pollutionDegree?: number;
  overvoltageCategory?: string;
  minimumAirClearance_mm: number;
  minimumCreepage_mm?: number;
  sourceRef: string;
  validationStatus: 'example' | 'project-approved' | 'licensed-table';
};
```

The app should compute:

```text
required_gap = max(minimumAirClearance, projectMinimumGap, manufacturingAllowanceAdjustedGap)
```

### 14.3 UI warnings

Warn when:

- no approved clearance table is loaded;
- rated voltage exceeds dataset scope;
- user gap is below required gap;
- altitude correction is not applied;
- pollution degree is not specified;
- DC clearance data is using AC fallback.

## 15. Busbar channel envelope

Minimum envelope calculation depends on arrangement.

### 15.1 Definitions

```text
phaseGap = clear air gap between adjacent phase conductor envelopes
barGap = gap between parallel bars in the same phase
sideClearance = clearance to channel wall or insulating barrier
topBottomClearance = clearance to channel wall or insulating barrier
```

### 15.2 Horizontal phase arrangement

For 3 phases, one rectangular group per phase:

```text
channelWidth = sum(phaseGroupWidths) + 2 * sideClearance + (phaseCount - 1) * phaseGap
channelHeight = max(phaseGroupHeights) + 2 * topBottomClearance
```

### 15.3 Vertical phase arrangement

```text
channelWidth = max(phaseGroupWidths) + 2 * sideClearance
channelHeight = sum(phaseGroupHeights) + 2 * topBottomClearance + (phaseCount - 1) * phaseGap
```

### 15.4 Flatwise vs edgewise

If bar orientation changes, swap visible width/height dimensions in the cross-section model:

```text
flatwise:  visibleWidth = width,     visibleHeight = thickness
edgewise:  visibleWidth = thickness, visibleHeight = width
```

### 15.5 Output

```ts
export type ChannelEnvelopeResult = {
  width_mm: number;
  height_mm: number;
  phaseCenters: Array<{phaseId: string; x_mm: number; y_mm: number}>;
  conductorBoxes: Array<{id: string; x_mm: number; y_mm: number; w_mm: number; h_mm: number}>;
  requiredClearance_mm: number;
  sideClearance_mm: number;
  warnings: CalculationWarning[];
};
```

## 16. Short-circuit thermal withstand

The common screening check is based on adiabatic withstand:

```text
I^2 * t <= k^2 * S^2
```

or:

```text
S_required = I * sqrt(t) / k
```

where:

```text
I = RMS short-circuit current, A
S = conductor cross-section, mm2
k = material/system coefficient, A*sqrt(s)/mm2
t = duration, s
```

Return:

```ts
export type ShortCircuitThermalResult = {
  i2t_A2s: number;
  allowableI2t_A2s: number;
  requiredArea_mm2: number;
  actualArea_mm2: number;
  utilization: number;
  status: 'pass' | 'warn' | 'fail' | 'not-evaluated';
  method: 'adiabatic-i2t-v1';
  warnings: CalculationWarning[];
};
```

Warn when:

- duration is missing;
- initial/final temperatures are not known;
- k value is default/example only;
- protective-device let-through energy should be used instead of prospective current.

## 17. Short-circuit electrodynamic force

For a simplified force per unit length between two parallel conductors:

```text
F_per_m = mu0 / (2 * pi) * Ipk^2 / d
```

where:

```text
mu0 = 4*pi*1e-7 H/m
Ipk = peak short-circuit current, A
d = distance between conductor centerlines, m
```

This is a simplified screening model. Real assemblies require geometry factors, multi-conductor effects, support stiffness, busbar holders, enclosure constraints and standard-specific verification.

## 18. Support spacing and bending stress

For a conservative simply-supported beam approximation under distributed load:

```text
M_max = F_per_m * L_support^2 / 8
sigma = M_max / W
```

where:

```text
L_support = support spacing, m
W = section modulus, m3
```

Rectangular section modulus depends on bending axis:

```text
W = b * h^2 / 6
```

where `h` is the dimension in bending direction.

Output:

```ts
export type ShortCircuitMechanicalResult = {
  force_N_per_m: number;
  supportSpacing_m: number;
  maxMoment_Nm: number;
  sectionModulus_m3: number;
  bendingStress_Pa: number;
  allowableStress_Pa?: number;
  utilization?: number;
  status: 'pass' | 'warn' | 'fail' | 'not-evaluated';
  method: 'parallel-conductor-force-simple-beam-v1';
  warnings: CalculationWarning[];
};
```

Warn when:

- centerline distance is too small;
- Ipk missing;
- support spacing missing;
- allowable material stress missing;
- insulator/support rating not entered;
- multi-bar force distribution is approximate.

## 19. Result aggregation

The app should combine results into one object:

```ts
export type BusbarCalculationResult = {
  inputHash: string;
  engineVersion: string;
  selectedProfile: ProfileResult;
  candidates: ProfileCandidate[];
  electrical: ElectricalResult;
  thermal: ThermalResult;
  clearance: ClearanceResult;
  envelope: ChannelEnvelopeResult;
  shortCircuit?: ShortCircuitResult;
  warnings: CalculationWarning[];
  status: 'pass' | 'warn' | 'fail' | 'incomplete';
};
```

Severity rule:

```text
fail if any required safety check fails
warn if any required safety check is approximate, missing or out of scope
pass only when all required checks are complete and within approved data scope
incomplete if essential inputs are missing
```

## 20. Calculation report trace

For PDF and debug panels, include a calculation trace:

```ts
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
```

## 21. Golden case strategy

Create golden cases for:

- small copper DC pair;
- 3-phase copper 1600 A natural cooling;
- 3-phase aluminium 2500 A forced cooling;
- high ambient derating;
- clearance fail scenario;
- short-circuit thermal fail;
- support spacing mechanical fail;
- AC proximity warning scenario;
- multi-bar per phase comparison.

Each golden case should save input and expected outputs with tolerances.
