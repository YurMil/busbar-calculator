# API and CAD Integration Plan

## 1. MVP approach

The MVP does not require a backend. All calculations, visualizations and reports can run in the browser. This is aligned with the local-first CAD AutoScript utility pattern.

However, the app should expose clean data structures so future CAD/API automation is easy.

## 2. Geometry payload

The calculator should be able to produce a geometry payload independent of UI rendering.

```ts
export type BusbarGeometryPayload = {
  schemaVersion: '1.0';
  units: 'mm';
  arrangementId: string;
  channelEnvelope: {
    width_mm: number;
    height_mm: number;
    depthBasis_mm?: number;
  };
  conductors: Array<{
    id: string;
    phaseId: 'L1' | 'L2' | 'L3' | 'N' | 'PE' | 'DC+' | 'DC-';
    materialId: string;
    width_mm: number;
    thickness_mm: number;
    length_mm?: number;
    x_mm: number;
    y_mm: number;
    orientation: 'flatwise' | 'edgewise';
    barsInParallel: number;
  }>;
  clearances: Array<{
    fromId: string;
    toId: string;
    required_mm: number;
    actual_mm: number;
    status: 'pass' | 'warn' | 'fail';
  }>;
  supports?: Array<{
    id: string;
    spacing_mm: number;
    type?: string;
  }>;
};
```

## 3. CAD use cases

### 3.1 SolidWorks or Inventor macro

A macro can consume the geometry payload to generate:

- busbar solids;
- phase labels;
- support markers;
- clearance envelope sketch;
- channel bounding box;
- BOM rows.

### 3.2 STEP export

A future browser-based STEP export could use ReplicAD/OpenCascade, already present in the wider CAD AutoScript stack. This should be a later phase because STEP generation adds complexity and bundle size.

### 3.3 DXF/SVG cross-section export

The first CAD export should be simpler:

- SVG cross-section;
- DXF 2D outline;
- JSON geometry payload.

## 4. Optional API endpoints

If a backend is introduced, keep it versioned:

```text
GET  /api/v1/busbar/materials
GET  /api/v1/busbar/profiles?material=copper&standard=DIN_43671
GET  /api/v1/busbar/clearance-rule-sets
POST /api/v1/busbar/calculate
POST /api/v1/busbar/report/pdf
POST /api/v1/busbar/cad/geometry
POST /api/v1/busbar/projects
GET  /api/v1/busbar/projects/:id
```

## 5. API request example

```json
{
  "schemaVersion": "1.0",
  "system": {
    "type": "AC",
    "phases": "3P",
    "ratedVoltage_V": 400,
    "ratedCurrent_A": 1600,
    "frequency_Hz": 50
  },
  "material": {
    "materialId": "cu-etp"
  },
  "profile": {
    "width_mm": 80,
    "thickness_mm": 10,
    "barsPerPhase": 2
  },
  "layout": {
    "arrangementId": "horizontal-edgewise",
    "phaseGap_mm": 25,
    "barGap_mm": 10,
    "sideClearance_mm": 20
  },
  "environment": {
    "ambientTemp_C": 35,
    "coolingPresetId": "natural_enclosed"
  },
  "shortCircuit": {
    "rmsCurrent_kA": 50,
    "duration_s": 1,
    "peakCurrent_kA": 105,
    "supportSpacing_mm": 500
  }
}
```

## 6. API response example

```json
{
  "schemaVersion": "1.0",
  "engineVersion": "0.1.0",
  "status": "warn",
  "selectedProfile": {
    "materialId": "cu-etp",
    "width_mm": 80,
    "thickness_mm": 10,
    "barsPerPhase": 2,
    "areaPerPhase_mm2": 1600
  },
  "thermal": {
    "losses_W_per_m": 142.4,
    "steadyStateTemp_C": 82.1,
    "tempRise_K": 47.1
  },
  "clearance": {
    "requiredAirClearance_mm": 20,
    "actualPhaseGap_mm": 25,
    "status": "pass"
  },
  "shortCircuit": {
    "thermalStatus": "pass",
    "mechanicalStatus": "warn"
  },
  "warnings": [
    {
      "code": "AC_PROXIMITY_FACTOR_APPROXIMATED",
      "severity": "warning",
      "message": "AC proximity factor is approximate for this arrangement."
    }
  ]
}
```

## 7. Authentication and Supabase

If saved projects are introduced, use the existing site authentication approach rather than creating a separate auth system.

Potential Supabase tables:

```text
busbar_projects
  id uuid primary key
  user_id uuid
  title text
  revision text
  project_json jsonb
  created_at timestamptz
  updated_at timestamptz

busbar_reports
  id uuid primary key
  project_id uuid
  report_metadata jsonb
  pdf_storage_path text
  created_at timestamptz
```

Keep local-only mode available even if cloud saving is added.

## 8. CAD macro integration contract

A desktop CAD macro should not scrape UI. It should consume one of:

- exported JSON geometry payload;
- downloaded DXF/SVG;
- future authenticated API response;
- copied clipboard payload.

Suggested clipboard payload header:

```json
{
  "kind": "cadautoscript.busbar-geometry",
  "schemaVersion": "1.0"
}
```

## 9. Future worker/CAD architecture

```text
cad/
  geometry/
    buildCrossSectionPayload.ts
    buildBusbarSolids.ts
    buildSupportMarkers.ts
  export/
    exportSvg.ts
    exportDxf.ts
    exportStep.ts
  workers/
    cadWorker.ts
    cadWorkerClient.ts
```

STEP export must be lazy-loaded and worker-based to protect initial load time.

## 10. API quality requirements

- all API endpoints versioned;
- schema validation on request;
- calculation engine version returned;
- dataset revisions returned;
- warnings returned, not only numeric results;
- no silent fallback from approved data to example data;
- deterministic response for same input/dataset version.
