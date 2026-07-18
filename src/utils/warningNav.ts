import type {CalculationWarning, Severity} from '../domain/types';
import type {InputTabId} from '../components/InputTabs';

const codeToTab: Record<string, InputTabId> = {
  PHASE_GAP_AUTORAISED: 'layout',
  PHASE_GAP_BELOW_CLEARANCE: 'layout',
  CLEARANCE_RULE_MISSING: 'system',
  CREEPAGE_NOT_EVALUATED: 'layout',
  CREEPAGE_BELOW_REQUIRED: 'layout',
  CREEPAGE_MARGIN_LOW: 'layout',
  ALTITUDE_OUT_OF_RANGE: 'layout',
  CURRENT_DENSITY_HIGH: 'busbars',
  CURRENT_DENSITY_REVIEW: 'busbars',
  TEMPERATURE_LIMIT_EXCEEDED: 'environment',
  MODEL_ABOVE_TABLE_RATING: 'busbars',
  MODEL_BELOW_TABLE_RATING: 'environment',
  TABLE_RATING_EXCEEDED: 'busbars',
  SHORT_CIRCUIT_THERMAL_INCOMPLETE: 'short-circuit',
  SHORT_CIRCUIT_MECHANICAL_INCOMPLETE: 'short-circuit',
  SUPPORT_LOAD_EXCEEDED: 'short-circuit',
  SUPPORT_RATING_MISSING: 'short-circuit',
};

/** Input tab that most directly resolves the warning, if any. */
export function warningTargetTab(code: string): InputTabId | undefined {
  return codeToTab[code];
}

/** Highest warning severity mapped onto each input tab, for tab badges. */
export function tabAttention(warnings: CalculationWarning[]): Partial<Record<InputTabId, Severity>> {
  const result: Partial<Record<InputTabId, Severity>> = {};
  for (const warning of warnings) {
    const tab = codeToTab[warning.code];
    if (!tab || warning.severity === 'info') continue;
    if (result[tab] !== 'error') {
      result[tab] = warning.severity;
    }
  }
  return result;
}
