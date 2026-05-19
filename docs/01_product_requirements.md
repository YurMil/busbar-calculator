# Product Requirements Document

## 1. Overview

The Busbar Calculator is a browser-based engineering utility for busbar sizing, layout visualization, heating forecast, voltage-clearance checks, and report export.

The product should be built as an interactive calculator with professional visual feedback. The user should not only see final numbers, but also understand why a configuration passes or fails.

## 2. User journey

1. User opens `/utilities/busbar-calculator/`.
2. User enters project metadata: project, panel, tag, revision, engineer, date.
3. User selects system type: DC or AC.
4. User enters operating voltage, current, frequency for AC, number of phases, and installation assumptions.
5. User chooses material: copper, aluminium, or custom.
6. User selects target layout: horizontal, vertical, flatwise, edgewise, custom spacing.
7. App proposes profile/bar-count candidates.
8. User selects or locks a candidate.
9. App displays live busbar channel geometry and minimum envelope.
10. App computes current density, losses, temperature rise and forecast chart.
11. User enters short-circuit values: `Ik`, `Icw`, duration, `Ipk`, support spacing.
12. App evaluates short-circuit thermal and mechanical status.
13. User exports a PDF report.

## 3. MVP functional requirements

### 3.1 Inputs

| Group | Input | Type | Required | Notes |
|---|---|---:|---:|---|
| Electrical | System type | enum `AC/DC` | yes | AC enables frequency, skin/proximity warnings. |
| Electrical | Rated voltage | number | yes | Used for minimum clearance rules. |
| Electrical | Rated current | number | yes | Main sizing target. |
| Electrical | Frequency | number | AC only | Default 50 Hz, editable. |
| Electrical | Number of phases | enum | yes | DC, 1-phase, 3-phase, 3P+N. |
| Material | Busbar material | enum | yes | Copper, aluminium, custom. |
| Profile | Width | number | yes | mm. |
| Profile | Thickness | number | yes | mm. |
| Profile | Bars per phase | number | yes | 1 to 4 initially. |
| Layout | Phase arrangement | enum | yes | horizontal, vertical, custom. |
| Layout | Bar orientation | enum | yes | flatwise or edgewise. |
| Layout | Phase-to-phase clear gap | number | optional | App may auto-fill minimum. |
| Layout | Bar-to-bar gap in same phase | number | optional | Used for cooling/proximity. |
| Environment | Ambient temperature | number | yes | degC. |
| Environment | Cooling condition | enum | yes | natural open air, enclosed, forced ventilation. |
| Environment | Enclosure multiplier | number | optional | Conservative derating. |
| Short-circuit | RMS short-circuit current | number | optional | kA. |
| Short-circuit | Short-circuit duration | number | optional | seconds. |
| Short-circuit | Peak short-circuit current | number | optional | kA peak. |
| Mechanics | Support spacing | number | optional | mm. |
| Report | Project metadata | object | optional | Report header. |

### 3.2 Outputs

| Output | Description |
|---|---|
| Selected profile | Width, thickness, material, bar count, area. |
| Current density | Total current divided by effective conducting area. |
| Resistance per meter | DC and AC-adjusted resistance. |
| Power loss per meter | `I^2 * R` after multipliers. |
| Temperature forecast | Time curve from ambient to steady-state estimate. |
| Steady-state temperature | Estimated busbar final temperature. |
| Voltage clearance | Required minimum air clearance and active rule source. |
| Busbar channel envelope | Minimum width, height and depth basis for CAD. |
| Thermal short-circuit status | Pass/warn/fail for `I^2t` / adiabatic heating. |
| Mechanical short-circuit status | Pass/warn/fail for force, stress and support spacing. |
| Warnings | Human-readable list of assumptions and limits. |
| PDF report | Downloadable report with all above outputs. |

## 4. Visual requirements

The UI should be visual-first:

- live busbar cross-section preview;
- color-coded phase labels L1/L2/L3/N/PE or DC+/DC-;
- orientation toggle with icon cards;
- clearance callouts drawn on the preview;
- minimum channel bounding box overlay;
- temperature graph with operating limit line;
- short-circuit force diagram with supports;
- pass/warn/fail badges.

## 5. Engineering requirements

### 5.1 Determinism

Given the same input and same calculation-engine version, results must be repeatable.

### 5.2 Traceability

Every result must expose:

- method name;
- input values;
- correction factors;
- source dataset id;
- warnings;
- calculation engine version.

### 5.3 Separation of concerns

React components must not contain formulas. Engineering formulas belong under `domain/` modules.

### 5.4 Warnings before false precision

Where a result depends on a licensed standard table, vendor test data, enclosure details, or real ventilation, the app must clearly mark the result as an estimate until validated.

## 6. Non-functional requirements

| Category | Requirement |
|---|---|
| Performance | Normal recalculation under 150 ms for one configuration. Forecast graph under 500 ms. |
| Responsiveness | Usable from 1366 px desktop down to tablet width. Mobile should remain readable. |
| Offline/local | No data upload required for MVP. PDF generated locally. |
| Accessibility | Keyboard navigable inputs, semantic labels, sufficient contrast. |
| Maintainability | TypeScript strict types for calculation inputs/outputs. |
| Testability | Pure functions for formulas and data selection. |
| Security | Sanitize report metadata; no remote scripts inside app bundle. |
| Internationalization | Calculation engine unit-safe; UI can later support EN/RU. |

## 7. Feature phasing

### Phase 1: Engineering MVP

- static profile dataset;
- copper profile selection;
- DC/AC toggle;
- layout visualization;
- simple temperature steady-state and forecast model;
- manual clearance rule table;
- PDF export;
- unit tests.

### Phase 2: Expanded materials and arrangement physics

- aluminium profiles;
- multi-bar correction factors;
- AC proximity/skin effect multipliers;
- ventilation presets;
- configurable standard datasets;
- comparison table of candidates.

### Phase 3: Short-circuit engineering

- adiabatic thermal withstand;
- electrodynamic force model;
- support spacing recommendation;
- failure mode explanation;
- short-circuit section in PDF.

### Phase 4: CAD and project integration

- geometry export payload;
- DXF/SVG cross-section export;
- optional STEP or CAD macro integration;
- Supabase saved presets if authentication is enabled;
- optional API endpoints.

### Phase 5: Validation and production hardening

- verified datasets;
- regression test matrix;
- engineering sign-off workflow;
- report versioning;
- release notes per calculation engine version.

## 8. Acceptance criteria

The first useful release is accepted when:

- the app loads inside the CAD AutoScript utility shell;
- changing current, material, arrangement, cooling or voltage updates all related outputs;
- the preview displays phase positions and minimum channel envelope;
- the report PDF includes project data, inputs, selected busbar, graphs, warnings and calculation trace;
- all domain tests pass;
- at least 10 manually reviewed golden cases exist;
- datasets are marked with their source and validation status.
