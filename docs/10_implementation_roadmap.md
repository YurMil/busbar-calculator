# Implementation Roadmap

## 1. Recommended roadmap strategy

Deliver the utility in small PRs. Do not combine dataset validation, short-circuit physics, PDF design and CAD export in a single release.

## 2. Phase 0: Documentation and decision lock

Deliverables:

- this documentation package reviewed;
- product scope approved;
- first calculation assumptions accepted;
- data governance rules accepted;
- route and slug confirmed: `busbar-calculator`.

Exit criteria:

- team agrees whether initial app is standalone Vite app inside the existing repo;
- team identifies required standards/vendor data sources;
- one engineer owns calculation validation.

## 3. Phase 1: Repository skeleton

Tasks:

- create `apps/busbar-calculator`;
- configure Vite + React + TypeScript;
- add local CSS variables;
- create placeholder app layout;
- configure build to `static/utility-apps/busbar-calculator`;
- emit `app.html` and `manifest.json`;
- add route wrapper under `src/pages/utilities`;
- add entries to `utilities.ts` and `utilityShellPages.tsx`;
- add placeholder docs page;
- add root scripts.

Deliverables:

- utility loads in shell;
- no calculation yet;
- CI build passes.

Suggested PR name:

```text
feat(busbar): add standalone utility skeleton
```

## 4. Phase 2: Domain model and basic sizing

Tasks:

- implement TypeScript domain types;
- add example material dataset;
- add example profile dataset;
- implement profile geometry;
- implement current density;
- implement DC resistance;
- implement basic profile candidate table;
- add unit tests;
- add warnings for example-only data.

Deliverables:

- user can enter current and choose profile;
- app shows area, current density, mass per meter and losses;
- golden cases for basic geometry.

Suggested PR name:

```text
feat(busbar): add profile and current-density calculation engine
```

## 5. Phase 3: Visual arrangement and channel envelope

Tasks:

- implement layout selector;
- implement flatwise/edgewise transformations;
- implement horizontal/vertical phase positioning;
- implement SVG cross-section visualizer;
- implement channel envelope calculation;
- implement dimension callouts;
- add layout tests.

Deliverables:

- user sees live busbar/channel preview;
- channel width/height updates with phase gaps and orientation;
- preview can be captured for PDF later.

Suggested PR name:

```text
feat(busbar): add phase arrangement visualizer and channel envelope
```

## 6. Phase 4: Thermal model and forecast charts

Tasks:

- implement material temperature coefficient;
- implement power loss at operating temperature;
- implement cooling presets;
- implement steady-state thermal solver;
- implement transient forecast model;
- implement temperature chart;
- add warnings for approximate model;
- add thermal tests.

Deliverables:

- app forecasts busbar temperature over time;
- chart updates with ambient/cooling/profile changes;
- report-ready data structure exists.

Suggested PR name:

```text
feat(busbar): add temperature rise forecast
```

## 7. Phase 5: Voltage clearance and spacing rules

Tasks:

- implement clearance rule model;
- add example/project-rule clearance dataset;
- implement rule lookup;
- connect rated voltage to required gap;
- warn on missing approved dataset;
- show required vs actual spacing in visualizer;
- add tests for clearance pass/fail.

Deliverables:

- user sees minimum air gap for entered voltage/rule set;
- actual gaps validated in UI and report data.

Suggested PR name:

```text
feat(busbar): add voltage clearance rule checks
```

## 8. Phase 6: Short-circuit checks

Tasks:

- add short-circuit input panel;
- implement adiabatic thermal withstand check;
- implement simplified electrodynamic force check;
- implement support-spacing stress check;
- add mechanical diagram;
- add short-circuit result panel;
- add warnings for missing Ipk/support/allowable stress;
- add golden cases.

Deliverables:

- user can evaluate thermal and mechanical short-circuit status;
- fail/warn cases are visible and traceable.

Suggested PR name:

```text
feat(busbar): add short-circuit withstand checks
```

## 9. Phase 7: PDF report export

Tasks:

- define report object;
- implement report preview data aggregation;
- implement jsPDF report generator;
- embed layout diagram;
- embed temperature chart;
- include warnings/disclaimer;
- include calculation trace;
- add PDF smoke test;
- add UI export review modal.

Deliverables:

- user downloads PDF report;
- report includes all major sections;
- no server required.

Suggested PR name:

```text
feat(busbar): add PDF engineering report export
```

## 10. Phase 8: Data validation and engineering review

Tasks:

- replace example profile data with approved dataset;
- add licensed standard/vendor metadata;
- review thermal correction factors;
- validate clearance tables;
- validate short-circuit formulas;
- create engineering sign-off checklist;
- update docs and disclaimers.

Deliverables:

- production-mode datasets approved;
- example-only warning removed only for approved data;
- calculation release notes published.

Suggested PR name:

```text
chore(busbar): add approved engineering datasets
```

## 11. Phase 9: CAD/API extensions

Tasks:

- export JSON geometry payload;
- export SVG/DXF cross-section;
- add copy-to-clipboard CAD payload;
- prototype SolidWorks/Inventor macro consumer;
- evaluate browser STEP export;
- evaluate optional Supabase project saving.

Deliverables:

- geometry can be reused outside the UI;
- CAD automation path established.

Suggested PR name:

```text
feat(busbar): add CAD geometry export payload
```

## 12. Suggested milestone order

| Milestone | Approx. content | Risk level |
|---|---|---|
| M1 | Shell + app skeleton | low |
| M2 | Profile/current/loss calculations | medium |
| M3 | Layout visualizer + channel envelope | medium |
| M4 | Thermal forecast | high |
| M5 | Clearance checks | high because of standards data |
| M6 | Short-circuit checks | high |
| M7 | PDF report | medium |
| M8 | Validated datasets | high and requires engineering review |
| M9 | CAD/API export | medium/high |

## 13. First sprint backlog

1. Create app skeleton.
2. Add utility catalog entry.
3. Add route wrapper.
4. Add placeholder docs page.
5. Add material/profile example data.
6. Implement geometry helpers.
7. Implement state store defaults.
8. Implement basic input panels.
9. Implement result summary shell.
10. Add unit tests for geometry.

## 14. Definition of done for first public beta

- app loads through site route;
- user can configure current, voltage, material, profile, bars, layout and environment;
- app generates candidate results;
- app displays layout and temperature chart;
- app performs preliminary clearance and short-circuit checks;
- app exports PDF;
- all unapproved engineering data is clearly marked;
- docs page explains limitations;
- golden tests exist.
