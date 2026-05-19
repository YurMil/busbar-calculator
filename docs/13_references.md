# References and Source Notes

## 1. Repository technology references

The implementation plan is aligned with the CAD AutoScript repository pattern:

- Docusaurus documentation portal;
- React and TypeScript app stack;
- standalone utilities under `static/utility-apps/*`;
- common utility shell route wrapper;
- local browser-based PDF and engineering utilities.

## 2. Standards to consider

The following standards should be treated as required engineering references, but licensed copies or project-approved data should be used before production release.

| Standard | Role in calculator |
|---|---|
| DIN 43671 | Copper busbar profile/current reference data. |
| DIN 43670 | Aluminium busbar profile/current reference data. |
| IEC 61439 series | Low-voltage switchgear/controlgear assemblies and busbar trunking design verification context. |
| IEC 60664-1 | Insulation coordination, clearances and creepage strategy. |
| IEC 60909 | Short-circuit current calculation input basis for AC systems. |
| IEC 60865 | Calculation of short-circuit current effects and electrodynamic forces. |
| IEC 60204-1 | Electrical equipment of machines when busbar assembly is part of machinery. |
| Local electrical code | Final installation compliance. |
| Manufacturer catalogs | Validated current ratings, busbar supports, holders, and enclosure data. |

## 3. Implementation references

| Topic | Recommended project dependency/pattern |
|---|---|
| UI | React + TypeScript. |
| State | Zustand. |
| PDF | jsPDF. |
| 2D layout preview | SVG. |
| Static utility app | Vite build to `static/utility-apps/<slug>/app.html`. |
| Host shell | `createUtilityPage` and `UtilityShellPage`. |
| Future CAD | ReplicAD/OpenCascade or JSON/DXF/SVG export first. |
| Persistence | Local storage/IndexedDB for MVP; Supabase only if cloud saving is needed. |

## 4. Required validation sources before production mode

- approved copper busbar table data;
- approved aluminium busbar table data;
- approved material constants;
- approved clearance rule dataset;
- approved short-circuit coefficients;
- vendor support/insulator mechanical ratings;
- internal engineering spreadsheet comparisons;
- sample calculations reviewed by a qualified engineer.

## 5. Notes about public documentation

Public docs should avoid publishing proprietary table values unless allowed. It is safe to document:

- architecture;
- formulas that are generally known;
- data schema;
- validation workflow;
- report structure;
- limitations;
- how to load project-approved datasets.

## 6. Recommended project files for future traceability

```text
docs/utilities/busbar-calculator.mdx
apps/busbar-calculator/CHANGELOG.md
apps/busbar-calculator/docs/calculation-method.md
apps/busbar-calculator/src/data/README.md
apps/busbar-calculator/src/tests/goldenCases/README.md
```

## 7. Engineering review record template

```text
Review date:
Reviewer:
Dataset revisions:
Calculation engine version:
Cases reviewed:
Known deviations:
Approved for:
Restrictions:
Next review date:
```
