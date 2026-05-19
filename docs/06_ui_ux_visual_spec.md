# UI and Visual Specification

## 1. Design goal

The Busbar Calculator should feel like a professional engineering cockpit: visual, fast, dark-theme friendly, and report-oriented.

The user should see the assembly, not only a table of numbers.

## 2. Main layout

Desktop layout:

```text
+--------------------------------------------------------------------------------+
| Header: Busbar Calculator | Project selector | Export PDF | Import/Save        |
+------------------------------+-------------------------------+-----------------+
| Input panels                 | Visual busbar preview          | Result summary  |
| - Electrical                 | - phase arrangement            | - status        |
| - Material/profile           | - clearances                   | - selected bar  |
| - Layout                     | - channel envelope             | - temperature   |
| - Environment                | - support spacing              | - warnings      |
| - Short circuit              |                               |                 |
+------------------------------+-------------------------------+-----------------+
| Candidate table | Temperature chart | Short-circuit chart | Calculation trace |
+--------------------------------------------------------------------------------+
```

Tablet layout:

```text
Header
Visual preview
Result summary
Input accordion
Charts
Candidate table
Report actions
```

## 3. Navigation model

Use tab or accordion groups:

1. **System**: voltage, current, AC/DC, phases.
2. **Busbars**: material, profile, bars per phase.
3. **Layout**: vertical/horizontal, flatwise/edgewise, spacing.
4. **Environment**: ambient, cooling, enclosure.
5. **Short-circuit**: Ik, Ipk, duration, supports.
6. **Report**: project metadata, export settings.

## 4. Input UX rules

- Always show units next to fields.
- Allow direct numeric typing and quick presets.
- Use sliders only as secondary controls; engineering values need precise input.
- Keep derived fields read-only but copyable.
- Display validation errors near fields.
- Display global warnings in a dedicated panel.
- Keep last used units and preferences locally.

## 5. Arrangement selector

Represent arrangement as clickable visual cards.

### 5.1 Horizontal phases

```text
[L1]   gap   [L2]   gap   [L3]
```

Best for wide channels and easy phase separation.

### 5.2 Vertical phases

```text
[L1]
 gap
[L2]
 gap
[L3]
```

Best when width is limited, but height increases.

### 5.3 Flatwise bars

Bars lie with their wide face horizontal in the preview:

```text
+--------------------+
|                    |
+--------------------+
```

Usually lower profile height, larger top/bottom surface exposure depending on layout.

### 5.4 Edgewise bars

Bars stand on edge:

```text
+--+
|  |
|  |
|  |
+--+
```

Can improve natural convection in many practical arrangements but requires careful mechanical support.

## 6. Visualizer requirements

### 6.1 SVG cross-section

The cross-section visualizer should render:

- bars per phase;
- phase labels;
- neutral and PE if enabled;
- air gaps;
- channel bounding box;
- dimensions with arrows;
- phase-to-phase clearance callouts;
- wall clearance callouts;
- support centerline if mechanical check enabled;
- pass/warn/fail color border.

### 6.2 Scale behavior

The visualizer must be dimensionally proportional but readable. Use automatic scaling:

```text
scale = min(availableWidth / envelopeWidth, availableHeight / envelopeHeight)
```

Minimum visible thickness should be clamped for readability, but dimension labels must show true values.

### 6.3 Export behavior

The same SVG should be usable in PDF report generation. Keep it independent from browser-only layout CSS.

## 7. Result cards

Top result cards:

| Card | Content |
|---|---|
| Overall status | Pass / warning / fail / incomplete. |
| Selected busbar | Material, width x thickness, bars per phase. |
| Current density | A/mm2 with status band. |
| Temperature | ambient, rise, steady-state. |
| Clearance | required vs actual gap. |
| Channel envelope | minimum width x height. |
| Short-circuit | thermal and mechanical status. |

## 8. Candidate table

Columns:

- rank;
- material;
- profile;
- bars per phase;
- area;
- mass per meter;
- current density;
- losses W/m;
- estimated temperature;
- minimum channel size;
- short-circuit margin;
- status;
- select button.

Candidate comparison should make trade-offs obvious: smallest profile may not be best if temperature or short-circuit margins are poor.

## 9. Temperature forecast chart

Chart axes:

```text
X: time
Y: busbar temperature, degC
```

Series:

- busbar temperature;
- ambient temperature;
- allowable continuous temperature;
- optional forecast for alternative profiles.

Tooltip:

- time;
- temperature;
- losses W/m;
- cooling W/m;
- margin to limit.

## 10. Short-circuit visual panel

The short-circuit panel should show:

- phase spacing diagram;
- force arrows between conductors;
- support spacing `L`;
- calculated force per meter;
- bending stress utilization;
- thermal `I2t` utilization;
- missing inputs.

## 11. Warning UX

Warnings should be grouped:

| Severity | UI style | Meaning |
|---|---|---|
| Info | blue/neutral | Assumption or trace note. |
| Warning | amber | Result usable but needs review. |
| Error | red | Configuration fails or required input is missing. |

Examples:

- `Rated voltage exceeds selected clearance dataset range.`
- `AC proximity factor is approximate for this multi-bar layout.`
- `Short-circuit peak current missing; mechanical check not evaluated.`
- `Estimated steady-state temperature exceeds material limit.`

## 12. PDF export UX

Export toolbar actions:

- **Export PDF report**;
- **Export project JSON**;
- **Import project JSON**;
- **Copy result summary**;
- **Copy CAD geometry payload**.

Before PDF export, show a small review modal:

- report title;
- project metadata completeness;
- warning count;
- calculation status;
- dataset validation status;
- export button.

## 13. Dark/light theme

The utility should not depend on Docusaurus CSS but should visually fit the current dark engineering portal.

Use CSS variables:

```css
:root {
  --bb-bg: #0b1020;
  --bb-panel: #111827;
  --bb-border: rgba(255, 255, 255, 0.12);
  --bb-text: #e5e7eb;
  --bb-muted: #9ca3af;
  --bb-accent: #38bdf8;
  --bb-warn: #f59e0b;
  --bb-danger: #ef4444;
  --bb-pass: #22c55e;
}
```

## 14. Accessibility

- All inputs need labels.
- SVG callouts need text alternatives or a result table equivalent.
- Status should not rely only on color.
- Keyboard users must be able to reach all controls.
- PDF export and import buttons must be standard buttons.
- Tooltips should not hide essential information.

## 15. Empty states

If not enough input exists:

- show a simple busbar placeholder;
- show required next steps;
- keep export disabled;
- show `incomplete` status, not `fail`.

## 16. Microcopy examples

- `Use project-approved clearance data before final design release.`
- `This temperature forecast is a lumped thermal estimate, not a type-test result.`
- `Selected support spacing is above the recommended limit for the entered peak current.`
- `Increase phase gap, add supports, choose more bars per phase, or reduce short-circuit exposure time.`
