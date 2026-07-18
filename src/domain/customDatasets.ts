import type {BusbarMaterial, BusbarProfile} from './types';

export const DATASET_FILE_TYPE = 'cadautoscript.busbar-datasets';
const STORAGE_KEY = 'busbar-calculator-datasets';

export type CustomDatasetFile = {
  fileType: typeof DATASET_FILE_TYPE;
  schemaVersion?: string;
  materials?: BusbarMaterial[];
  profiles?: BusbarProfile[];
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateMaterial(item: unknown, index: number): asserts item is BusbarMaterial {
  const m = item as Partial<BusbarMaterial>;
  const where = `materials[${index}]`;
  if (!m || typeof m.id !== 'string' || !m.id) throw new Error(`${where}: missing "id"`);
  if (typeof m.label !== 'string' || !m.label) throw new Error(`${where}: missing "label"`);
  if (!isFiniteNumber(m.resistivity20_ohm_m) || m.resistivity20_ohm_m <= 0)
    throw new Error(`${where}: "resistivity20_ohm_m" must be a positive number`);
  if (!isFiniteNumber(m.temperatureCoefficient_1_per_K)) throw new Error(`${where}: missing "temperatureCoefficient_1_per_K"`);
  if (!isFiniteNumber(m.density_kg_m3) || m.density_kg_m3 <= 0) throw new Error(`${where}: "density_kg_m3" must be positive`);
  if (!isFiniteNumber(m.heatCapacity_J_kgK) || m.heatCapacity_J_kgK <= 0) throw new Error(`${where}: "heatCapacity_J_kgK" must be positive`);
  if (!m.emissivity || !isFiniteNumber(m.emissivity.default)) throw new Error(`${where}: missing "emissivity.default"`);
  if (!isFiniteNumber(m.allowableContinuousTemp_C)) throw new Error(`${where}: missing "allowableContinuousTemp_C"`);
  if (!m.metadata || typeof m.metadata.datasetId !== 'string' || typeof m.metadata.sourceType !== 'string')
    throw new Error(`${where}: missing dataset "metadata" (datasetId, sourceType, sourceRef...)`);
}

function validateProfile(item: unknown, index: number): asserts item is BusbarProfile {
  const p = item as Partial<BusbarProfile>;
  const where = `profiles[${index}]`;
  if (!p || typeof p.profileId !== 'string' || !p.profileId) throw new Error(`${where}: missing "profileId"`);
  if (typeof p.materialId !== 'string' || !p.materialId) throw new Error(`${where}: missing "materialId"`);
  if (!p.dimensions || !isFiniteNumber(p.dimensions.width_mm) || !isFiniteNumber(p.dimensions.thickness_mm))
    throw new Error(`${where}: missing "dimensions.width_mm/thickness_mm"`);
  if (!p.properties || !isFiniteNumber(p.properties.crossSectionArea_mm2) || p.properties.crossSectionArea_mm2 <= 0)
    throw new Error(`${where}: missing "properties.crossSectionArea_mm2"`);
  if (!isFiniteNumber(p.properties.massPerMeter_kg_m)) throw new Error(`${where}: missing "properties.massPerMeter_kg_m"`);
  if (!p.metadata || typeof p.metadata.datasetId !== 'string') throw new Error(`${where}: missing dataset "metadata"`);
}

/** Validate a parsed dataset file. Throws with a field-level message on first error. */
export function validateCustomDatasets(parsed: unknown): CustomDatasetFile {
  const file = parsed as Partial<CustomDatasetFile>;
  if (!file || file.fileType !== DATASET_FILE_TYPE) {
    throw new Error(`fileType must be "${DATASET_FILE_TYPE}"`);
  }
  if (!Array.isArray(file.materials) && !Array.isArray(file.profiles)) {
    throw new Error('Dataset file must contain a "materials" and/or "profiles" array');
  }
  (file.materials ?? []).forEach(validateMaterial);
  (file.profiles ?? []).forEach(validateProfile);
  const materialIds = new Set([...(file.materials ?? []).map((m) => m.id)]);
  (file.profiles ?? []).forEach((profile, index) => {
    if (!materialIds.has(profile.materialId)) {
      // Allowed: profile can reference a bundled material; the reference is
      // checked again after merge in loadCustomDatasets.
      void index;
    }
  });
  return file as CustomDatasetFile;
}

export function saveCustomDatasets(file: CustomDatasetFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
}

export function clearCustomDatasets(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Read and validate stored custom datasets; returns null when absent or invalid. */
export function loadCustomDatasets(): CustomDatasetFile | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return validateCustomDatasets(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Merge custom datasets into the bundled arrays (id/profileId wins over bundled). */
export function mergeCustomDatasets(
  bundledMaterials: BusbarMaterial[],
  bundledProfiles: BusbarProfile[],
): void {
  const custom = loadCustomDatasets();
  if (!custom) return;
  for (const material of custom.materials ?? []) {
    const existing = bundledMaterials.findIndex((item) => item.id === material.id);
    if (existing >= 0) bundledMaterials.splice(existing, 1, material);
    else bundledMaterials.push(material);
  }
  const materialIds = new Set(bundledMaterials.map((item) => item.id));
  for (const profile of custom.profiles ?? []) {
    if (!materialIds.has(profile.materialId)) continue;
    const existing = bundledProfiles.findIndex((item) => item.profileId === profile.profileId);
    if (existing >= 0) bundledProfiles.splice(existing, 1, profile);
    else bundledProfiles.push(profile);
  }
}
