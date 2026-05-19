import {
  allDatasetMetadata,
  calculationEngineVersion,
  clearanceRuleSet,
  coolingPresets,
  materials,
  phaseColors,
  profiles,
} from './data';
import type {
  BarOrientation,
  BusbarCalculationResult,
  BusbarInput,
  BusbarMaterial,
  BusbarProfile,
  CalculationTraceItem,
  CalculationWarning,
  ChannelEnvelopeResult,
  ClearanceRule,
  CoolingPreset,
  PhaseMode,
  ProfileCandidate,
  ResultStatus,
  TemperatureForecastPoint,
} from './types';

const sigma = 5.670374419e-8;
const mu0 = 4 * Math.PI * 1e-7;

const warn = (
  code: string,
  severity: CalculationWarning['severity'],
  title: string,
  message: string,
  recommendedAction?: string,
): CalculationWarning => ({code, severity, title, message, recommendedAction});

export function getPhases(input: Pick<BusbarInput, 'systemType' | 'phaseMode'>): string[] {
  if (input.systemType === 'DC' || input.phaseMode === 'dc-pair') {
    return ['DC+', 'DC-'];
  }

  if (input.phaseMode === '1P') {
    return ['L', 'N'];
  }

  if (input.phaseMode === '3P+N') {
    return ['L1', 'L2', 'L3', 'N'];
  }

  return ['L1', 'L2', 'L3'];
}

export function getMaterial(materialId: string): BusbarMaterial {
  return materials.find((item) => item.id === materialId) ?? materials[0];
}

export function getProfile(profileId: string, materialId: string): BusbarProfile {
  return (
    profiles.find((item) => item.profileId === profileId) ??
    profiles.find((item) => item.materialId === materialId) ??
    profiles[0]
  );
}

export function getCoolingPreset(coolingPresetId: string): CoolingPreset {
  return coolingPresets.find((item) => item.id === coolingPresetId) ?? coolingPresets[0];
}

export function getProfileIdForDimensions(materialId: string, width_mm: number, thickness_mm: number): string {
  return (
    profiles.find(
      (item) =>
        item.materialId === materialId &&
        item.dimensions.width_mm === width_mm &&
        item.dimensions.thickness_mm === thickness_mm,
    )?.profileId ?? getProfile('', materialId).profileId
  );
}

export function visibleBarDimensions(width_mm: number, thickness_mm: number, orientation: BarOrientation) {
  return orientation === 'flatwise'
    ? {visibleWidth_mm: width_mm, visibleHeight_mm: thickness_mm}
    : {visibleWidth_mm: thickness_mm, visibleHeight_mm: width_mm};
}

function groupDimensions(input: Pick<BusbarInput, 'width_mm' | 'thickness_mm' | 'barsPerPhase' | 'orientation' | 'barGap_mm'>) {
  const {visibleWidth_mm, visibleHeight_mm} = visibleBarDimensions(input.width_mm, input.thickness_mm, input.orientation);
  if (input.orientation === 'flatwise') {
    return {
      groupWidth_mm: visibleWidth_mm,
      groupHeight_mm: input.barsPerPhase * visibleHeight_mm + (input.barsPerPhase - 1) * input.barGap_mm,
    };
  }

  return {
    groupWidth_mm: input.barsPerPhase * visibleWidth_mm + (input.barsPerPhase - 1) * input.barGap_mm,
    groupHeight_mm: visibleHeight_mm,
  };
}

export function calculateEnvelope(input: BusbarInput, requiredClearance_mm: number): ChannelEnvelopeResult {
  const phases = getPhases(input);
  const {visibleWidth_mm, visibleHeight_mm} = visibleBarDimensions(input.width_mm, input.thickness_mm, input.orientation);
  const {groupWidth_mm, groupHeight_mm} = groupDimensions(input);
  const phaseGap = Math.max(input.phaseGap_mm, requiredClearance_mm);
  const sideClearance = Math.max(input.sideClearance_mm, requiredClearance_mm);
  const topBottomClearance = Math.max(input.topBottomClearance_mm, requiredClearance_mm);

  const width_mm =
    input.arrangement === 'horizontal'
      ? phases.length * groupWidth_mm + (phases.length - 1) * phaseGap + sideClearance * 2
      : groupWidth_mm + sideClearance * 2;
  const height_mm =
    input.arrangement === 'horizontal'
      ? groupHeight_mm + topBottomClearance * 2
      : phases.length * groupHeight_mm + (phases.length - 1) * phaseGap + topBottomClearance * 2;

  const conductorBoxes: ChannelEnvelopeResult['conductorBoxes'] = [];
  const phaseCenters: ChannelEnvelopeResult['phaseCenters'] = [];

  phases.forEach((phaseId, phaseIndex) => {
    const phaseX =
      input.arrangement === 'horizontal'
        ? sideClearance + phaseIndex * (groupWidth_mm + phaseGap)
        : sideClearance;
    const phaseY =
      input.arrangement === 'horizontal'
        ? topBottomClearance
        : topBottomClearance + phaseIndex * (groupHeight_mm + phaseGap);

    phaseCenters.push({
      phaseId,
      x_mm: phaseX + groupWidth_mm / 2,
      y_mm: phaseY + groupHeight_mm / 2,
    });

    for (let barIndex = 0; barIndex < input.barsPerPhase; barIndex += 1) {
      const offsetX =
        input.orientation === 'edgewise' ? barIndex * (visibleWidth_mm + input.barGap_mm) : 0;
      const offsetY =
        input.orientation === 'flatwise' ? barIndex * (visibleHeight_mm + input.barGap_mm) : 0;

      conductorBoxes.push({
        id: `${phaseId}-${barIndex + 1}`,
        phaseId,
        x_mm: phaseX + offsetX,
        y_mm: phaseY + offsetY,
        w_mm: visibleWidth_mm,
        h_mm: visibleHeight_mm,
        color: phaseColors[phaseId] ?? '#38bdf8',
      });
    }
  });

  const warnings: CalculationWarning[] = [];
  if (input.phaseGap_mm < requiredClearance_mm) {
    warnings.push(
      warn(
        'PHASE_GAP_AUTORAISED',
        'warning',
        'Phase gap below required clearance',
        `Envelope uses ${requiredClearance_mm.toFixed(1)} mm because the entered phase gap is smaller.`,
        'Increase the phase gap before final design release.',
      ),
    );
  }

  return {
    width_mm,
    height_mm,
    phaseCenters,
    conductorBoxes,
    requiredClearance_mm,
    sideClearance_mm: sideClearance,
    warnings,
  };
}

export function calculateResistance20(material: BusbarMaterial, areaPerPhase_mm2: number) {
  return material.resistivity20_ohm_m / (areaPerPhase_mm2 * 1e-6);
}

function acMultiplierFor(input: BusbarInput): number {
  if (input.systemType === 'DC') {
    return 1;
  }

  const frequencyFactor = Math.max(1, input.frequency_Hz / 50);
  const barFactor = 1 + Math.max(0, input.barsPerPhase - 1) * 0.035;
  const orientationFactor = input.orientation === 'edgewise' ? 1.015 : 1.03;
  const arrangementFactor = input.arrangement === 'vertical' ? 1.015 : 1.025;
  return frequencyFactor * barFactor * orientationFactor * arrangementFactor;
}

function exposedSurfaceAreaPerMeter(input: BusbarInput): number {
  const perimeterPerBar_m = (2 * (input.width_mm + input.thickness_mm)) / 1000;
  const proximitySurfaceFactor = Math.max(0.58, 1 - (input.barsPerPhase - 1) * 0.12);
  const orientationFactor = input.orientation === 'edgewise' ? 1.07 : 1;
  return perimeterPerBar_m * input.barsPerPhase * proximitySurfaceFactor * orientationFactor;
}

function heatRejection_W_per_m(temp_C: number, ambient_C: number, input: BusbarInput, material: BusbarMaterial, cooling: CoolingPreset) {
  const area_m2_per_m = exposedSurfaceAreaPerMeter(input);
  const h = cooling.convectiveCoefficient_W_m2K * cooling.enclosureDeratingFactor * input.enclosureMultiplier;
  const convection = h * area_m2_per_m * Math.max(0, temp_C - ambient_C);
  const radiation = cooling.radiationEnabled
    ? material.emissivity.default *
      sigma *
      area_m2_per_m *
      (Math.pow(temp_C + 273.15, 4) - Math.pow(ambient_C + 273.15, 4))
    : 0;

  return Math.max(0, convection + radiation);
}

function lossesAtTemp_W_per_m(temp_C: number, input: BusbarInput, material: BusbarMaterial, areaPerPhase_mm2: number) {
  const r20 = calculateResistance20(material, areaPerPhase_mm2);
  const rTheta = r20 * (1 + material.temperatureCoefficient_1_per_K * (temp_C - 20));
  return {
    resistance_ohm_per_m: rTheta * acMultiplierFor(input),
    losses_W_per_m: Math.pow(input.ratedCurrent_A, 2) * rTheta * acMultiplierFor(input),
  };
}

function solveSteadyState(input: BusbarInput, material: BusbarMaterial, cooling: CoolingPreset, areaPerPhase_mm2: number) {
  const ambient = input.ambientTemp_C;
  let low = ambient;
  let high = Math.max(ambient + 20, material.allowableContinuousTemp_C + 180);
  const balance = (temp_C: number) =>
    lossesAtTemp_W_per_m(temp_C, input, material, areaPerPhase_mm2).losses_W_per_m -
    heatRejection_W_per_m(temp_C, ambient, input, material, cooling);

  while (balance(high) > 0 && high < 450) {
    high += 50;
  }

  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    if (balance(mid) > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const steadyStateTemp_C = (low + high) / 2;
  const loss = lossesAtTemp_W_per_m(steadyStateTemp_C, input, material, areaPerPhase_mm2);

  return {
    steadyStateTemp_C,
    tempRise_K: steadyStateTemp_C - ambient,
    losses_W_per_m: loss.losses_W_per_m,
    resistance_ohm_per_m: loss.resistance_ohm_per_m,
    cooling_W_per_m: heatRejection_W_per_m(steadyStateTemp_C, ambient, input, material, cooling),
  };
}

function buildForecast(
  input: BusbarInput,
  material: BusbarMaterial,
  cooling: CoolingPreset,
  areaPerPhase_mm2: number,
): TemperatureForecastPoint[] {
  const duration_s = Math.max(600, input.forecastHours * 3600);
  const steps = 72;
  const dt = duration_s / steps;
  const massPerMeter_kg = areaPerPhase_mm2 * 1e-6 * material.density_kg_m3;
  const heatCapacity_J_per_mK = Math.max(1, massPerMeter_kg * material.heatCapacity_J_kgK);
  const points: TemperatureForecastPoint[] = [];
  let temp_C = input.ambientTemp_C;

  for (let i = 0; i <= steps; i += 1) {
    const loss = lossesAtTemp_W_per_m(temp_C, input, material, areaPerPhase_mm2).losses_W_per_m;
    const coolingPower = heatRejection_W_per_m(temp_C, input.ambientTemp_C, input, material, cooling);
    points.push({time_s: i * dt, temperature_C: temp_C, losses_W_per_m: loss, cooling_W_per_m: coolingPower});
    const dT = ((loss - coolingPower) / heatCapacity_J_per_mK) * dt;
    temp_C += Math.max(-10, Math.min(10, dT));
  }

  return points;
}

function findClearanceRule(input: BusbarInput): ClearanceRule | undefined {
  const direct = clearanceRuleSet.rules.find(
    (rule) =>
      (rule.systemType === input.systemType || rule.systemType === 'either') &&
      input.ratedVoltage_V >= rule.voltageMin_V &&
      input.ratedVoltage_V <= rule.voltageMax_V,
  );

  if (direct) {
    return direct;
  }

  return clearanceRuleSet.rules.find(
    (rule) => input.ratedVoltage_V >= rule.voltageMin_V && input.ratedVoltage_V <= rule.voltageMax_V,
  );
}

function calculateClearance(input: BusbarInput) {
  const rule = findClearanceRule(input);
  if (!rule) {
    return {
      requiredAirClearance_mm: 0,
      requiredCreepage_mm: undefined,
      sourceRef: clearanceRuleSet.metadata.sourceRef,
      status: 'incomplete' as ResultStatus,
      warnings: [
        warn(
          'CLEARANCE_RULE_MISSING',
          'error',
          'No clearance rule matched',
          'The entered rated voltage is outside the loaded example clearance data.',
          'Load a project-approved clearance table for this voltage range.',
        ),
      ],
    };
  }

  const requiredAirClearance_mm = rule.minimumAirClearance_mm + (rule.manufacturingMargin_mm ?? 0);
  const status: ResultStatus =
    input.phaseGap_mm >= requiredAirClearance_mm ? 'warn' : input.phaseGap_mm > 0 ? 'fail' : 'incomplete';
  const warnings = [
    warn(
      'CLEARANCE_TABLE_NOT_APPROVED',
      'warning',
      'Example-only clearance data',
      'The active clearance rule set is not project-approved or licensed standard data.',
      'Replace with approved IEC/vendor/project table data before final design release.',
    ),
  ];

  if (status === 'fail') {
    warnings.push(
      warn(
        'PHASE_GAP_BELOW_CLEARANCE',
        'error',
        'Actual phase gap is below required clearance',
        `Entered gap ${input.phaseGap_mm.toFixed(1)} mm is below required ${requiredAirClearance_mm.toFixed(1)} mm.`,
        'Increase phase gap or choose an approved insulation strategy.',
      ),
    );
  }

  return {
    requiredAirClearance_mm,
    requiredCreepage_mm: rule.minimumCreepage_mm,
    sourceRef: `${clearanceRuleSet.label} / ${rule.id}`,
    status,
    warnings,
  };
}

function calculateShortCircuit(input: BusbarInput, material: BusbarMaterial, areaPerPhase_mm2: number, envelope: ChannelEnvelopeResult) {
  const warnings: CalculationWarning[] = [];
  const duration_s = input.shortCircuitDuration_s;
  const rms_A = input.rmsShortCircuit_kA ? input.rmsShortCircuit_kA * 1000 : undefined;
  const peak_A = input.peakShortCircuit_kA ? input.peakShortCircuit_kA * 1000 : undefined;
  const supportSpacing_m = input.supportSpacing_mm ? input.supportSpacing_mm / 1000 : undefined;
  const k = material.shortCircuit?.k_A_sqrt_s_per_mm2;

  let thermalStatus: ResultStatus = 'not-evaluated';
  let mechanicalStatus: ResultStatus = 'not-evaluated';
  let i2t_A2s: number | undefined;
  let allowableI2t_A2s: number | undefined;
  let requiredArea_mm2: number | undefined;
  let thermalUtilization: number | undefined;
  let force_N_per_m: number | undefined;
  let bendingStress_MPa: number | undefined;
  let mechanicalUtilization: number | undefined;

  if (!rms_A || !duration_s || !k) {
    warnings.push(
      warn(
        'SHORT_CIRCUIT_THERMAL_INCOMPLETE',
        'warning',
        'Thermal short-circuit check not complete',
        'RMS current, duration, and material k value are required.',
        'Enter Ik and duration from a network/protective-device study.',
      ),
    );
  } else {
    i2t_A2s = Math.pow(rms_A, 2) * duration_s;
    allowableI2t_A2s = Math.pow(k * areaPerPhase_mm2, 2);
    requiredArea_mm2 = (rms_A * Math.sqrt(duration_s)) / k;
    thermalUtilization = i2t_A2s / allowableI2t_A2s;
    thermalStatus = utilizationToStatus(thermalUtilization);
  }

  if (!peak_A || !supportSpacing_m || envelope.phaseCenters.length < 2) {
    warnings.push(
      warn(
        'SHORT_CIRCUIT_MECHANICAL_INCOMPLETE',
        'warning',
        'Mechanical short-circuit check not complete',
        'Peak current, support spacing, and adjacent phase centers are required.',
        'Enter Ipk and the busbar support spacing.',
      ),
    );
  } else {
    const d_m = Math.max(0.001, distance(envelope.phaseCenters[0], envelope.phaseCenters[1]) / 1000);
    force_N_per_m = (mu0 / (2 * Math.PI)) * Math.pow(peak_A, 2) / d_m;
    const {visibleWidth_mm, visibleHeight_mm} = visibleBarDimensions(input.width_mm, input.thickness_mm, input.orientation);
    const b_m = (input.orientation === 'edgewise' ? visibleWidth_mm : input.width_mm) / 1000;
    const h_m = Math.max(visibleHeight_mm / 1000, input.thickness_mm / 1000);
    const sectionModulus_m3 = Math.max(1e-10, (b_m * Math.pow(h_m, 2) * input.barsPerPhase) / 6);
    const maxMoment_Nm = (force_N_per_m * Math.pow(supportSpacing_m, 2)) / 8;
    bendingStress_MPa = maxMoment_Nm / sectionModulus_m3 / 1e6;
    const allowable = material.allowableStress_MPa ?? 1;
    mechanicalUtilization = bendingStress_MPa / allowable;
    mechanicalStatus = utilizationToStatus(mechanicalUtilization);
  }

  if (material.metadata.sourceType === 'example-only') {
    warnings.push(
      warn(
        'SHORT_CIRCUIT_K_EXAMPLE_ONLY',
        'warning',
        'Example-only short-circuit material constants',
        'The material k value and stress limit are development data.',
        'Verify against project standards and manufacturer data.',
      ),
    );
  }

  return {
    thermalStatus,
    mechanicalStatus,
    i2t_A2s,
    allowableI2t_A2s,
    requiredArea_mm2,
    thermalUtilization,
    force_N_per_m,
    bendingStress_MPa,
    mechanicalUtilization,
    warnings,
  };
}

function distance(a: {x_mm: number; y_mm: number}, b: {x_mm: number; y_mm: number}) {
  return Math.hypot(a.x_mm - b.x_mm, a.y_mm - b.y_mm);
}

function utilizationToStatus(utilization: number): ResultStatus {
  if (!Number.isFinite(utilization)) return 'not-evaluated';
  if (utilization > 1) return 'fail';
  if (utilization > 0.8) return 'warn';
  return 'pass';
}

function temperatureToStatus(temp_C: number, allowable_C: number): ResultStatus {
  if (temp_C > allowable_C) return 'fail';
  if (temp_C > allowable_C - 12) return 'warn';
  return 'pass';
}

function currentDensityWarning(currentDensity: number, material: BusbarMaterial): CalculationWarning | null {
  const warnLimit = material.family === 'copper' ? 1.8 : 1.25;
  const failLimit = material.family === 'copper' ? 2.4 : 1.75;
  if (currentDensity >= failLimit) {
    return warn(
      'CURRENT_DENSITY_HIGH',
      'error',
      'Current density is high',
      `${currentDensity.toFixed(2)} A/mm² exceeds the screening limit for the selected material.`,
      'Choose a larger profile or more bars per phase.',
    );
  }
  if (currentDensity >= warnLimit) {
    return warn(
      'CURRENT_DENSITY_REVIEW',
      'warning',
      'Current density needs review',
      `${currentDensity.toFixed(2)} A/mm² is near the screening limit.`,
      'Check temperature rise and validated rating tables.',
    );
  }
  return null;
}

function aggregateStatus(statuses: ResultStatus[], warnings: CalculationWarning[]): ResultStatus {
  if (statuses.includes('incomplete')) return 'incomplete';
  if (statuses.includes('fail') || warnings.some((item) => item.severity === 'error')) return 'fail';
  if (
    statuses.includes('warn') ||
    statuses.includes('not-evaluated') ||
    warnings.some((item) => item.severity === 'warning')
  ) {
    return 'warn';
  }
  return 'pass';
}

function inputHash(input: BusbarInput) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(input)))).slice(0, 12);
}

function evaluateFixedProfile(input: BusbarInput, material: BusbarMaterial, profile: BusbarProfile, barsPerPhase: number) {
  const localInput: BusbarInput = {
    ...input,
    materialId: material.id,
    profileId: profile.profileId,
    width_mm: profile.dimensions.width_mm,
    thickness_mm: profile.dimensions.thickness_mm,
    barsPerPhase,
  };
  const cooling = getCoolingPreset(localInput.coolingPresetId);
  const areaPerPhase_mm2 = profile.properties.crossSectionArea_mm2 * barsPerPhase;
  const clearance = calculateClearance(localInput);
  const envelope = calculateEnvelope(localInput, clearance.requiredAirClearance_mm);
  const steady = solveSteadyState(localInput, material, cooling, areaPerPhase_mm2);
  const currentDensity_A_per_mm2 = localInput.ratedCurrent_A / areaPerPhase_mm2;
  const shortCircuit = calculateShortCircuit(localInput, material, areaPerPhase_mm2, envelope);
  const densityWarning = currentDensityWarning(currentDensity_A_per_mm2, material);
  const warnings = [...clearance.warnings, ...envelope.warnings, ...shortCircuit.warnings];
  if (densityWarning) warnings.push(densityWarning);

  if (localInput.systemType === 'AC') {
    warnings.push(
      warn(
        'AC_PROXIMITY_FACTOR_APPROXIMATED',
        'warning',
        'AC correction is approximate',
        'Skin and proximity correction factors are simplified for this MVP engine.',
        'Validate AC resistance against approved data for final designs.',
      ),
    );
  }

  const thermalStatus = temperatureToStatus(steady.steadyStateTemp_C, material.allowableContinuousTemp_C);
  const status = aggregateStatus(
    [thermalStatus, clearance.status, shortCircuit.thermalStatus, shortCircuit.mechanicalStatus],
    warnings,
  );

  return {
    localInput,
    cooling,
    areaPerPhase_mm2,
    envelope,
    steady,
    currentDensity_A_per_mm2,
    shortCircuit,
    warnings,
    thermalStatus,
    status,
  };
}

function buildCandidates(input: BusbarInput): ProfileCandidate[] {
  const material = getMaterial(input.materialId);
  const materialProfiles = profiles.filter((item) => item.materialId === material.id);
  const candidates = materialProfiles.flatMap((profile) =>
    [1, 2, 3, 4].map((barsPerPhase) => {
      const evaluated = evaluateFixedProfile(input, material, profile, barsPerPhase);
      const shortCircuitMargin =
        evaluated.shortCircuit.thermalUtilization && evaluated.shortCircuit.thermalUtilization > 0
          ? 1 / evaluated.shortCircuit.thermalUtilization
          : null;
      const statusPenalty =
        evaluated.status === 'pass' ? 0 : evaluated.status === 'warn' ? 180 : evaluated.status === 'fail' ? 1000 : 500;
      const tempPenalty = Math.max(0, evaluated.steady.steadyStateTemp_C - material.allowableContinuousTemp_C + 12) * 6;
      const score =
        evaluated.areaPerPhase_mm2 * 0.35 +
        evaluated.envelope.width_mm * evaluated.envelope.height_mm * 0.005 +
        tempPenalty +
        statusPenalty;

      return {
        rank: 0,
        profileId: profile.profileId,
        materialId: material.id,
        materialLabel: material.label,
        width_mm: profile.dimensions.width_mm,
        thickness_mm: profile.dimensions.thickness_mm,
        barsPerPhase,
        areaPerPhase_mm2: evaluated.areaPerPhase_mm2,
        massPerMeterPerPhase_kg_m: profile.properties.massPerMeter_kg_m * barsPerPhase,
        currentDensity_A_per_mm2: evaluated.currentDensity_A_per_mm2,
        losses_W_per_m: evaluated.steady.losses_W_per_m,
        steadyStateTemp_C: evaluated.steady.steadyStateTemp_C,
        channelWidth_mm: evaluated.envelope.width_mm,
        channelHeight_mm: evaluated.envelope.height_mm,
        shortCircuitMargin,
        status: evaluated.status,
        score,
      };
    }),
  );

  return candidates
    .sort((a, b) => a.score - b.score)
    .map((candidate, index) => ({...candidate, rank: index + 1}))
    .slice(0, 80);
}

function buildTrace(
  input: BusbarInput,
  material: BusbarMaterial,
  profile: BusbarProfile,
  result: ReturnType<typeof evaluateFixedProfile>,
  clearanceSource: string,
): CalculationTraceItem[] {
  return [
    {
      id: 'area',
      label: 'Conductor area',
      equation: 'S = w * t * n',
      inputs: {w_mm: input.width_mm, t_mm: input.thickness_mm, n: input.barsPerPhase},
      output: result.areaPerPhase_mm2.toFixed(1),
      unit: 'mm²',
      method: 'rectangular-profile-geometry-v1',
      sourceRef: profile.metadata.sourceRef,
    },
    {
      id: 'current-density',
      label: 'Current density',
      equation: 'J = I / S',
      inputs: {I_A: input.ratedCurrent_A, S_mm2: result.areaPerPhase_mm2},
      output: result.currentDensity_A_per_mm2.toFixed(3),
      unit: 'A/mm²',
      method: 'current-density-v1',
    },
    {
      id: 'resistance',
      label: 'Resistance at steady-state temperature',
      equation: 'R = rho / S * (1 + alpha * (T - 20)) * k_ac',
      inputs: {
        rho_ohm_m: material.resistivity20_ohm_m.toExponential(3),
        T_C: result.steady.steadyStateTemp_C.toFixed(1),
        k_ac: acMultiplierFor(input).toFixed(3),
      },
      output: result.steady.resistance_ohm_per_m.toExponential(4),
      unit: 'ohm/m',
      method: 'temperature-adjusted-resistance-v1',
    },
    {
      id: 'losses',
      label: 'Power loss',
      equation: 'P = I^2 * R',
      inputs: {I_A: input.ratedCurrent_A, R_ohm_m: result.steady.resistance_ohm_per_m.toExponential(4)},
      output: result.steady.losses_W_per_m.toFixed(1),
      unit: 'W/m',
      method: 'i2r-loss-v1',
    },
    {
      id: 'thermal',
      label: 'Steady-state temperature',
      equation: 'P_loss = Q_convection + Q_radiation',
      inputs: {ambient_C: input.ambientTemp_C, cooling: result.cooling.label},
      output: result.steady.steadyStateTemp_C.toFixed(1),
      unit: '°C',
      method: 'lumped-steady-state-v1',
    },
    {
      id: 'clearance',
      label: 'Required air clearance',
      equation: 'gap_required = table_value + manufacturing_margin',
      inputs: {voltage_V: input.ratedVoltage_V, actual_gap_mm: input.phaseGap_mm},
      output: result.envelope.requiredClearance_mm.toFixed(1),
      unit: 'mm',
      method: 'clearance-rule-lookup-v1',
      sourceRef: clearanceSource,
    },
    {
      id: 'envelope',
      label: 'Channel envelope',
      equation: 'arrangement geometry + clearances',
      inputs: {arrangement: input.arrangement, orientation: input.orientation},
      output: `${result.envelope.width_mm.toFixed(1)} x ${result.envelope.height_mm.toFixed(1)}`,
      unit: 'mm',
      method: 'channel-envelope-v1',
    },
    {
      id: 'short-circuit-thermal',
      label: 'Short-circuit thermal utilization',
      equation: 'I²t / (kS)²',
      inputs: {Ik_kA: input.rmsShortCircuit_kA ?? 'not entered', t_s: input.shortCircuitDuration_s ?? 'not entered'},
      output: result.shortCircuit.thermalUtilization
        ? `${(result.shortCircuit.thermalUtilization * 100).toFixed(1)}`
        : 'not evaluated',
      unit: '%',
      method: 'adiabatic-i2t-v1',
      sourceRef: material.shortCircuit?.sourceRef,
    },
    {
      id: 'short-circuit-mechanical',
      label: 'Electrodynamic stress utilization',
      equation: 'F = mu0 Ipk^2 / (2 pi d), sigma = FL^2 / 8W',
      inputs: {Ipk_kA: input.peakShortCircuit_kA ?? 'not entered', L_mm: input.supportSpacing_mm ?? 'not entered'},
      output: result.shortCircuit.mechanicalUtilization
        ? `${(result.shortCircuit.mechanicalUtilization * 100).toFixed(1)}`
        : 'not evaluated',
      unit: '%',
      method: 'parallel-conductor-force-simple-beam-v1',
    },
  ];
}

export function calculateBusbar(input: BusbarInput): BusbarCalculationResult {
  const material = getMaterial(input.materialId);
  const profile = getProfile(input.profileId, material.id);
  const normalizedInput = {
    ...input,
    materialId: material.id,
    profileId: profile.profileId,
    width_mm: profile.dimensions.width_mm,
    thickness_mm: profile.dimensions.thickness_mm,
    barsPerPhase: Math.max(1, Math.min(4, Math.round(input.barsPerPhase))),
    phaseGap_mm: Math.max(0, input.phaseGap_mm),
    barGap_mm: Math.max(0, input.barGap_mm),
  };
  const fixed = evaluateFixedProfile(normalizedInput, material, profile, normalizedInput.barsPerPhase);
  const clearance = calculateClearance(normalizedInput);
  const forecast = buildForecast(normalizedInput, material, fixed.cooling, fixed.areaPerPhase_mm2);
  const candidates = buildCandidates(normalizedInput);
  const warnings = [...fixed.warnings];

  if (material.metadata.sourceType === 'example-only' || profile.metadata.sourceType === 'example-only') {
    warnings.push(
      warn(
        'EXAMPLE_DATASET_ACTIVE',
        'warning',
        'Example-only engineering data',
        'Materials, profile ratings, clearances, and cooling presets are development data.',
        'Replace datasets with reviewed project/vendor/standard data before production use.',
      ),
    );
  }

  if (fixed.steady.steadyStateTemp_C > material.allowableContinuousTemp_C) {
    warnings.push(
      warn(
        'TEMPERATURE_LIMIT_EXCEEDED',
        'error',
        'Estimated temperature exceeds material limit',
        `${fixed.steady.steadyStateTemp_C.toFixed(1)} °C is above the ${material.allowableContinuousTemp_C.toFixed(0)} °C limit.`,
        'Choose a larger profile, more bars per phase, or improved cooling.',
      ),
    );
  }

  const status = aggregateStatus(
    [fixed.thermalStatus, clearance.status, fixed.shortCircuit.thermalStatus, fixed.shortCircuit.mechanicalStatus],
    warnings,
  );

  return {
    inputHash: inputHash(normalizedInput),
    engineVersion: calculationEngineVersion,
    status,
    selectedProfile: {
      profileId: profile.profileId,
      materialId: material.id,
      materialLabel: material.label,
      width_mm: profile.dimensions.width_mm,
      thickness_mm: profile.dimensions.thickness_mm,
      barsPerPhase: normalizedInput.barsPerPhase,
      areaPerPhase_mm2: fixed.areaPerPhase_mm2,
      massPerMeterPerPhase_kg_m: profile.properties.massPerMeter_kg_m * normalizedInput.barsPerPhase,
    },
    electrical: {
      current_A: normalizedInput.ratedCurrent_A,
      voltage_V: normalizedInput.ratedVoltage_V,
      systemType: normalizedInput.systemType,
      frequency_Hz: normalizedInput.systemType === 'AC' ? normalizedInput.frequency_Hz : undefined,
      currentDensity_A_per_mm2: fixed.currentDensity_A_per_mm2,
      resistance_ohm_per_m: fixed.steady.resistance_ohm_per_m,
      losses_W_per_m: fixed.steady.losses_W_per_m,
      acMultiplier: acMultiplierFor(normalizedInput),
    },
    thermal: {
      ambientTemp_C: normalizedInput.ambientTemp_C,
      steadyStateTemp_C: fixed.steady.steadyStateTemp_C,
      tempRise_K: fixed.steady.tempRise_K,
      cooling_W_per_m: fixed.steady.cooling_W_per_m,
      forecast,
      status: fixed.thermalStatus,
    },
    clearance: {
      requiredAirClearance_mm: clearance.requiredAirClearance_mm,
      actualPhaseGap_mm: normalizedInput.phaseGap_mm,
      requiredCreepage_mm: clearance.requiredCreepage_mm,
      ruleSetId: clearanceRuleSet.id,
      sourceRef: clearance.sourceRef,
      status: clearance.status,
    },
    envelope: fixed.envelope,
    shortCircuit: {
      thermalStatus: fixed.shortCircuit.thermalStatus,
      mechanicalStatus: fixed.shortCircuit.mechanicalStatus,
      i2t_A2s: fixed.shortCircuit.i2t_A2s,
      allowableI2t_A2s: fixed.shortCircuit.allowableI2t_A2s,
      requiredArea_mm2: fixed.shortCircuit.requiredArea_mm2,
      thermalUtilization: fixed.shortCircuit.thermalUtilization,
      force_N_per_m: fixed.shortCircuit.force_N_per_m,
      bendingStress_MPa: fixed.shortCircuit.bendingStress_MPa,
      mechanicalUtilization: fixed.shortCircuit.mechanicalUtilization,
    },
    candidates,
    warnings,
    trace: buildTrace(normalizedInput, material, profile, fixed, clearance.sourceRef),
    datasets: allDatasetMetadata,
  };
}
