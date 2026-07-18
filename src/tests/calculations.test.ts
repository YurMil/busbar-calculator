import {describe, expect, it} from 'vitest';
import {calculateBusbar, calculateEnvelope, calculateResistance20, getMaterial, getProfile, visibleBarDimensions} from '../domain/calculations';
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

  it('generates a local PDF report blob', async () => {
    const result = calculateBusbar(defaultBusbarInput);
    const blob = await buildPdfReport(defaultBusbarInput, result);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(2_000);
  });
});
