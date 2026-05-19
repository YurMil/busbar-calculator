# Testing, Validation and QA Plan

## 1. Testing philosophy

The calculator should be tested like an engineering tool, not just a UI app. Most tests should target pure domain functions.

## 2. Test layers

| Layer | Tool | Purpose |
|---|---|---|
| Unit tests | Vitest | Formulas, selectors, validation, warnings. |
| Golden cases | JSON fixtures | Regression for known engineering cases. |
| Component tests | React test utilities | Input panels and result displays. |
| PDF smoke tests | Node/browser smoke | Ensure report generation does not fail. |
| Integration tests | Docusaurus build | Ensure utility shell route works. |
| Manual engineering review | Checklist | Validate against standards/vendor examples. |

## 3. Unit test targets

### 3.1 Geometry

- rectangular area;
- perimeter;
- mass per meter;
- flatwise vs edgewise visible dimensions;
- horizontal envelope;
- vertical envelope;
- multi-bar group dimensions;
- clear gap calculations.

### 3.2 Electrical

- resistance at 20 degC;
- resistance at elevated temperature;
- current density;
- losses per meter;
- AC multiplier application;
- DC mode disables AC factors.

### 3.3 Thermal

- heat rejection increases with temperature;
- solver converges;
- higher ambient increases final temperature;
- forced cooling lowers final temperature;
- larger profile lowers losses and temperature;
- transient forecast approaches steady state.

### 3.4 Clearance

- correct rule selected by voltage range;
- missing dataset creates warning;
- user gap below required gap fails;
- manufacturing margin applied;
- DC fallback warning.

### 3.5 Short-circuit

- `I2t` calculation;
- required area calculation;
- pass/fail thresholds;
- force per meter increases with `Ipk^2`;
- force decreases with spacing;
- bending stress increases with support spacing squared;
- missing Ipk marks mechanical result as not evaluated.

## 4. Golden cases

Create fixtures under:

```text
apps/busbar-calculator/src/tests/goldenCases/
```

Example structure:

```json
{
  "caseId": "copper-3phase-1600a-natural-v1",
  "description": "Copper 3-phase 1600 A natural cooling example",
  "input": {},
  "expected": {
    "status": "warn",
    "selectedProfile": {
      "materialId": "cu-etp"
    },
    "thermal": {
      "steadyStateTemp_C": {
        "value": 82.1,
        "tolerance": 1.0
      }
    }
  }
}
```

Golden cases should include tolerances because floating point and solver refinements may change small decimals.

## 5. Engineering validation matrix

| Scenario | Purpose |
|---|---|
| Copper single bar low current | Basic sanity check. |
| Copper multi-bar high current | Parallel bar and cooling correction. |
| Aluminium profile | Material model validation. |
| High ambient | Derating/warnings. |
| Forced ventilation | Cooling preset effect. |
| AC 50 Hz | AC multiplier path. |
| DC system | DC spacing and no AC factor. |
| Clearance fail | Voltage gap validation. |
| Short-circuit thermal fail | `I2t` warning/fail. |
| Short-circuit mechanical fail | Support spacing warning/fail. |
| Missing short-circuit data | Not evaluated status. |
| Example-only dataset | Report warning. |

## 6. Manual validation sources

Before production use, compare outputs against:

- licensed DIN 43670/43671 tables;
- IEC 60664-1 clearance values from licensed/project-approved tables;
- IEC 60865-based short-circuit examples;
- manufacturer busbar/switchgear catalog examples;
- internal engineering calculations;
- existing spreadsheets currently used by the team.

## 7. UI QA checklist

- app loads inside `/utilities/busbar-calculator/`;
- app also loads directly at `/utility-apps/busbar-calculator/app.html`;
- all inputs have visible units;
- invalid fields show clear messages;
- changing AC/DC updates available fields;
- layout selector updates preview;
- phase labels are readable;
- channel envelope dimensions update;
- chart redraws without jitter;
- PDF export works after changing inputs;
- keyboard navigation works;
- fullscreen shell mode remains usable.

## 8. PDF QA checklist

- generated PDF includes all selected inputs;
- generated PDF includes result status;
- warnings are printed;
- diagrams fit page bounds;
- temperature chart has axis labels;
- calculation engine version appears;
- dataset revisions appear;
- disclaimer appears;
- file name is safe;
- blank fields show `not provided` or `not evaluated`;
- PDF export does not require internet.

## 9. Regression policy

A change is considered calculation-impacting if it modifies:

- formulas;
- material constants;
- profile data;
- clearance data;
- cooling presets;
- arrangement factors;
- short-circuit constants;
- candidate ranking.

For calculation-impacting changes:

1. increment engine or dataset version;
2. update changelog;
3. run golden tests;
4. review PDF output;
5. include before/after result summary in PR.

## 10. Accuracy policy

The calculator should avoid misleading precision.

Display recommendations:

| Quantity | Recommended display |
|---|---|
| Current | nearest 1 A or 0.1 kA |
| Voltage | nearest 1 V |
| Gap | nearest 0.1 mm |
| Temperature | nearest 0.1 degC for chart, 1 degC for report summary |
| Losses | nearest 0.1 W/m or 1 W/m depending size |
| Force | nearest 0.01 kN/m or 0.1 kN/m |
| Stress | nearest 1 MPa |

## 11. Acceptance gates

### Gate A: App skeleton

- standalone app builds;
- route wrapper works;
- placeholder visualizer loads.

### Gate B: Calculation MVP

- material/profile inputs;
- current density;
- losses;
- thermal forecast;
- unit tests.

### Gate C: Layout and clearance

- arrangement visualizer;
- clearance rule lookup;
- channel envelope;
- layout golden tests.

### Gate D: Short-circuit

- thermal withstand;
- mechanical force/stress;
- warnings;
- golden tests.

### Gate E: PDF report

- report generated;
- charts/visuals embedded;
- warnings/disclaimer included;
- smoke tests.

### Gate F: Production hardening

- approved datasets;
- engineering review;
- docs page;
- release notes.
