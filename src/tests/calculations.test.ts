import {describe, expect, it} from 'vitest';
import {
  altitudeClearanceFactor,
  calculateBusbar,
  calculateEnvelope,
  calculateResistance20,
  dinTableRating_A,
  emissivityFor,
  getMaterial,
  getProfile,
  visibleBarDimensions,
} from '../domain/calculations';
import {buildPdfReport} from '../export/report';
import {defaultBusbarInput} from '../state/defaults';

describe('busbar calculation engine', () => {
  it('calculates rectangular visible dimensions for flatwise and edgewise orientation', () => {
    expect(visibleBarDimensions(80, 10, 'flatwise')).toEqual({visibleWidth_mm: 80, visibleHeight_mm: 10});
    expect(visibleBarDimensions(80, 10, 'edgewise')).toEqual({visibleWidth_mm: 10, visibleHeight_mm: 80});
  });

  it('calculates horizontal envelope geometry with phase gaps and wall clearances', () => {
    const result = calculateEnvelope(defaultBusbarInput, 25);
    expect(result.width_mm).toBeCloseTo(500);
    expect(result.height_mm).toBeCloseTo(90);
    expect(result.conductorBoxes).toHaveLength(8);
  });

  it('uses material resistivity and selected area for resistance at 20 degC', () => {
    const material = getMaterial(defaultBusbarInput.materialId);
    const profile = getProfile(defaultBusbarInput.profileId, material.id);
    const resistance = calculateResistance20(material, profile.properties.crossSectionArea_mm2 * defaultBusbarInput.barsPerPhase);
    expect(resistance).toBeGreaterThan(0);
    expect(resistance).toBeLessThan(0.00002);
  });

  it('returns thermal forecast points and candidate alternatives', () => {
    const result = calculateBusbar(defaultBusbarInput);
    expect(result.thermal.forecast.length).toBeGreaterThan(20);
    expect(result.candidates.length).toBeGreaterThan(5);
    expect(result.selectedProfile.areaPerPhase_mm2).toBe(1600);
  });

  it('marks clearance as fail when the actual phase gap is too small', () => {
    const result = calculateBusbar({...defaultBusbarInput, phaseGap_mm: 5});
    expect(result.clearance.status).toBe('fail');
    expect(result.warnings.some((warning) => warning.code === 'PHASE_GAP_BELOW_CLEARANCE')).toBe(true);
  });

  it('fails thermal short-circuit check when area is too small for entered Ik and duration', () => {
    const result = calculateBusbar({
      ...defaultBusbarInput,
      profileId: 'cu_30_10_example',
      barsPerPhase: 1,
      rmsShortCircuit_kA: 85,
      shortCircuitDuration_s: 1,
    });
    expect(result.shortCircuit.thermalStatus).toBe('fail');
  });

  it('increases force utilization with peak current and support spacing', () => {
    const baseline = calculateBusbar(defaultBusbarInput);
    const stressed = calculateBusbar({...defaultBusbarInput, peakShortCircuit_kA: 180, supportSpacing_mm: 1000});
    expect(stressed.shortCircuit.force_N_per_m ?? 0).toBeGreaterThan(baseline.shortCircuit.force_N_per_m ?? 0);
    expect(stressed.shortCircuit.mechanicalUtilization ?? 0).toBeGreaterThan(baseline.shortCircuit.mechanicalUtilization ?? 0);
  });

  it('marks clearance as pass when the actual phase gap meets the requirement', () => {
    const result = calculateBusbar(defaultBusbarInput);
    expect(result.clearance.status).toBe('pass');
  });

  it('evaluates creepage against the required minimum', () => {
    const notEntered = calculateBusbar(defaultBusbarInput);
    expect(notEntered.clearance.creepageStatus).toBe('not-evaluated');
    expect(notEntered.warnings.some((warning) => warning.code === 'CREEPAGE_NOT_EVALUATED')).toBe(true);

    const failing = calculateBusbar({...defaultBusbarInput, actualCreepage_mm: 10});
    expect(failing.clearance.creepageStatus).toBe('fail');
    expect(failing.warnings.some((warning) => warning.code === 'CREEPAGE_BELOW_REQUIRED')).toBe(true);

    const passing = calculateBusbar({...defaultBusbarInput, actualCreepage_mm: 40});
    expect(passing.clearance.creepageStatus).toBe('pass');
  });

  it('raises the required air clearance with altitude per IEC 60664-1', () => {
    expect(altitudeClearanceFactor(undefined)).toBe(1);
    expect(altitudeClearanceFactor(2000)).toBe(1);
    expect(altitudeClearanceFactor(3000)).toBeCloseTo(1.14);
    expect(altitudeClearanceFactor(4500)).toBeCloseTo(1.385);
    const sealevel = calculateBusbar(defaultBusbarInput);
    const highAltitude = calculateBusbar({...defaultBusbarInput, altitude_m: 4000});
    expect(highAltitude.clearance.requiredAirClearance_mm).toBeCloseTo(
      sealevel.clearance.requiredAirClearance_mm * 1.29,
    );
  });

  it('applies the IEC 60865 middle-phase factor for three-phase systems only', () => {
    const threePhase = calculateBusbar(defaultBusbarInput);
    expect(threePhase.shortCircuit.phaseFactor).toBeCloseTo(0.93);
    const dc = calculateBusbar({...defaultBusbarInput, systemType: 'DC', phaseMode: 'dc-pair'});
    expect(dc.shortCircuit.phaseFactor).toBe(1);
  });

  it('checks the support reaction against the entered insulator rating', () => {
    const result = calculateBusbar(defaultBusbarInput);
    expect(result.shortCircuit.supportForce_kN).toBeGreaterThan(0);
    expect(result.shortCircuit.supportUtilization).toBeGreaterThan(0);
    expect(result.shortCircuit.supportStatus).not.toBe('not-evaluated');

    const weakSupports = calculateBusbar({...defaultBusbarInput, supportRating_kN: 0.05});
    expect(weakSupports.shortCircuit.supportStatus).toBe('fail');
    expect(weakSupports.warnings.some((warning) => warning.code === 'SUPPORT_LOAD_EXCEEDED')).toBe(true);

    const noRating = calculateBusbar({...defaultBusbarInput, supportRating_kN: undefined});
    expect(noRating.warnings.some((warning) => warning.code === 'SUPPORT_RATING_MISSING')).toBe(true);
  });

  it('derives a corrected DIN table rating and exposes it on candidates', () => {
    const material = getMaterial(defaultBusbarInput.materialId);
    const profile = getProfile(defaultBusbarInput.profileId, material.id);
    const acRating = dinTableRating_A(profile, material, {systemType: 'AC', ambientTemp_C: 35}, 1);
    // Reference conditions (35 °C ambient, 50 K rise to 85 °C) with the 105 °C
    // material limit give sqrt(70/50) ≈ 1.18 on the single-bar table value.
    expect(acRating).toBeCloseTo((profile.ratings?.currentAc_A ?? 0) * Math.sqrt(70 / 50), 0);
    const dcRating = dinTableRating_A(profile, material, {systemType: 'DC', ambientTemp_C: 35}, 1);
    expect(dcRating).toBeGreaterThan(acRating ?? 0);

    const result = calculateBusbar(defaultBusbarInput);
    expect(result.electrical.tableRating_A).toBeGreaterThan(0);
    expect(result.candidates.some((candidate) => candidate.tableRating_A !== null)).toBe(true);
  });

  it('uses the surface finish emissivity in the thermal model', () => {
    const material = getMaterial(defaultBusbarInput.materialId);
    expect(emissivityFor(material, 'painted')).toBeGreaterThan(emissivityFor(material, 'tinned'));
    const bare = calculateBusbar({...defaultBusbarInput, surfaceFinish: 'bare'});
    const painted = calculateBusbar({...defaultBusbarInput, surfaceFinish: 'painted'});
    expect(painted.thermal.steadyStateTemp_C).toBeLessThan(bare.thermal.steadyStateTemp_C);
  });

  it('generates a local PDF report blob', async () => {
    const result = calculateBusbar(defaultBusbarInput);
    const blob = await buildPdfReport(defaultBusbarInput, result);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(2_000);
  });
});
