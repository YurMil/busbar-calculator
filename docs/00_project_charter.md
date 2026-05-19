# Project Charter: Busbar Calculator

## 1. Product name

**Busbar Calculator**

Suggested route:

```text
/utilities/busbar-calculator/
```

Suggested utility id:

```text
busbar-calculator
```

## 2. Mission

Create a visually strong engineering utility for configuring rectangular busbar assemblies and producing transparent calculation reports for electrical design review.

The utility must help engineers answer:

- Which busbar profile and number of bars per phase are suitable for the required current?
- How does ambient temperature, ventilation and phase arrangement affect temperature rise?
- What is the expected heating curve over time?
- What minimum phase spacing and busbar-channel envelope are required?
- Does the selected assembly pass thermal and mechanical short-circuit checks?
- What information should be exported into a PDF report for project documentation?

## 3. Target users

| User | Needs |
|---|---|
| Electrical design engineer | Rapid busbar sizing, voltage spacing, short-circuit checks, printable report. |
| Panel/switchboard designer | Visual channel envelope, support spacing, arrangement options. |
| CAD automation engineer | Structured geometry data for downstream model or drawing generation. |
| QA/documentation specialist | Traceable PDF report with assumptions, warnings and revision data. |
| Product owner | A utility that fits the existing CAD AutoScript catalog and can grow by phases. |

## 4. Target platform

The target platform is the existing CAD AutoScript web portal. The implementation should follow the standalone utility-app pattern used by other tools:

```text
Docusaurus route -> UtilityShellPage -> iframe -> static utility app
```

The first production implementation should be browser-only. Calculations, visualization and PDF export can run locally through React, TypeScript, Zustand, SVG/canvas, and jsPDF. A backend can be introduced later if catalog management, user presets, versioned calculations, or CAD automation require it.

## 5. Engineering philosophy

The calculator must be transparent rather than magical.

Every calculated result should include:

- input values;
- selected standard/profile data;
- formulas or method labels;
- correction factors;
- warnings and assumptions;
- pass/warn/fail status;
- report revision and calculation engine version.

## 6. Primary functional scope

### Included in the first full product plan

- rectangular copper and aluminium busbar profiles;
- one to four bars per phase;
- DC and AC operation modes;
- frequency input for AC mode;
- phase arrangement selector:
  - horizontal phases;
  - vertical phases;
  - flatwise bars;
  - edgewise bars;
  - custom spacing;
- ambient temperature input;
- ventilation/cooling condition input;
- enclosure derating multiplier;
- current density and power loss outputs;
- steady-state temperature estimate;
- time-based temperature forecast chart;
- minimum air clearance lookup layer;
- busbar channel envelope dimensions;
- short-circuit thermal withstand check;
- short-circuit electrodynamic-force and support-spacing check;
- PDF report export.

### Out of scope for MVP

- certified IEC 61439 type-test replacement;
- complete manufacturer catalog selection;
- high-voltage insulation coordination beyond low-voltage switchgear use cases;
- finite-element thermal simulation;
- CFD ventilation modelling;
- automatic selection of protective devices;
- legal compliance certification.

## 7. Standards strategy

The application should support standards-guided calculations, but it must not hard-code copyrighted table values unless the project owns or licenses them. The recommended approach is:

1. Keep formulas and table interfaces in the codebase.
2. Store standards-derived tabular data in versioned JSON files with source metadata.
3. Mark each dataset as one of:
   - `licensed-standard-table`;
   - `vendor-catalog`;
   - `project-rule`;
   - `engineering-default`;
   - `example-only`.
4. Require engineering review before enabling production mode.

Standards to consider:

- DIN 43671 for copper busbar reference profiles/current carrying data;
- DIN 43670 for aluminium busbar reference profiles/current carrying data;
- IEC 61439 series for low-voltage assemblies and busbar trunking systems;
- IEC 60664-1 for insulation coordination, air clearances and creepage logic;
- IEC 60909 for source short-circuit current calculation input basis;
- IEC 60865 for short-circuit current effects and electrodynamic withstand;
- IEC 60204-1 where the assembly is part of machinery electrical equipment;
- applicable local electrical code and manufacturer test data.

## 8. Safety and disclaimer posture

The tool should display a clear notice:

> This calculator is an engineering aid. It does not replace licensed standards, manufacturer test certificates, design verification under IEC 61439, local electrical regulations, or review by a qualified electrical engineer.

The PDF report should repeat the same statement.

## 9. Success criteria

The first released version is successful when:

- users can configure a three-phase busbar arrangement visually;
- the app proposes standard profiles and bar counts for a target current;
- heating forecast charts update within one second for normal input changes;
- minimum air gaps and channel dimensions are displayed with warnings;
- short-circuit thermal and mechanical checks are visible and traceable;
- a multi-page PDF report exports locally in the browser;
- the app can be embedded by the current CAD AutoScript utility shell;
- calculation modules have unit tests and golden cases.
