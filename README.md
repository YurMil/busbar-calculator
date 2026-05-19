# Busbar Calculator

This repository now contains a standalone React + TypeScript implementation of the Busbar Calculator described in the documentation package.

## Local development

```bash
npm install
npm run dev
```

The Vite app runs at `http://localhost:5173/` by default. If another project is already bound to `localhost:5173`, open `http://127.0.0.1:5173/` or start with another port:

```bash
npm run dev -- --port 5174
```

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

The production build emits an embeddable static utility at:

```text
static/utility-apps/busbar-calculator/app.html
```

The generated visual concept used for the implementation is kept at:

```text
design/busbar-calculator-concept.png
```

## Implementation scope

Implemented:

- AC/DC rectangular busbar inputs with project metadata.
- Copper and aluminium example datasets with source metadata.
- Profile selection, multi-bar-per-phase candidates, current density and I2R losses.
- SVG busbar cross-section with phase labels, clearance callouts and channel envelope.
- Lumped steady-state thermal model and transient forecast chart.
- Example clearance rule lookup and actual-vs-required spacing status.
- Short-circuit thermal I2t and simplified electrodynamic/support stress checks.
- Candidate comparison table with selectable alternatives.
- Local PDF report export, JSON import/export, result summary copy and CAD geometry payload copy.
- Vitest coverage for geometry, resistance, thermal forecast, clearance and short-circuit behavior.

Important limitation: all bundled engineering datasets are marked `example-only`. The app is an engineering aid and must not be used for final design release until project-approved or licensed standard/vendor data replaces those example values.

---

# Documentation Package

Generated for the CAD AutoScript repository on 2026-05-19.

This package defines a full documentation and implementation plan for a new **Busbar Calculator** utility for `cadautoscript.com`. The utility is intended to calculate and visually configure rectangular busbar assemblies, generate temperature forecasts, evaluate phase arrangement and voltage clearances, check short-circuit withstand constraints, and export engineering PDF reports.

The package is written in English and is structured so it can be copied into the repository as a planning folder or split into live Docusaurus docs later.

## Scope

The planned utility covers:

- copper and aluminium rectangular busbar selection;
- AC/DC operation mode;
- continuous current sizing;
- ambient temperature and ventilation/cooling derating;
- live visual phase arrangement: horizontal, vertical, flatwise, edgewise;
- minimum air clearance and channel envelope estimation;
- temperature-rise and transient heating forecast charts;
- multi-bar-per-phase layouts;
- short-circuit thermal withstand and electrodynamic-force checks;
- PDF engineering report generation;
- future CAD/API integration.

## Repository fit

The current CAD AutoScript repository is best suited for this utility as a standalone Vite-style micro-application embedded by the existing Docusaurus utility shell:

```text
apps/busbar-calculator/                    # source app
static/utility-apps/busbar-calculator/     # built app.html + assets
src/pages/utilities/busbar-calculator.tsx  # Docusaurus route wrapper
docs/utilities/busbar-calculator.mdx       # public documentation page
```

The calculator should initially run entirely in the browser. A backend/API layer is optional for later phases, mainly for shared catalogs, authenticated project presets, CAD automation, or team reporting.

## Document map

| File | Purpose |
|---|---|
| `docs/00_project_charter.md` | Product mission, users, assumptions, boundaries, safety notices. |
| `docs/01_product_requirements.md` | Functional requirements, inputs, outputs, MVP and later phases. |
| `docs/02_repo_integration_plan.md` | How to integrate into the existing CAD AutoScript repository. |
| `docs/03_technical_architecture.md` | App architecture, modules, workers, state, build and deployment. |
| `docs/04_calculation_engine_spec.md` | Thermal, voltage-clearance, arrangement, and short-circuit calculation model. |
| `docs/05_data_model_and_standards.md` | TypeScript/JSON models and standard data strategy. |
| `docs/06_ui_ux_visual_spec.md` | Visual layout, controls, charts, SVG/canvas preview and responsive behavior. |
| `docs/07_pdf_report_spec.md` | PDF report structure, generated pages, audit data, charts and disclaimers. |
| `docs/08_api_and_cad_integration.md` | Optional API, CAD macro and future STEP/DXF integration. |
| `docs/09_testing_validation_qa.md` | Unit tests, golden cases, engineering validation, QA checklist. |
| `docs/10_implementation_roadmap.md` | Phased PR roadmap with deliverables and acceptance gates. |
| `docs/11_patch_snippets.md` | Ready-to-adapt code/config snippets for repository integration. |
| `docs/12_risks_compliance_and_limits.md` | Engineering, legal, safety, data and compliance risks. |
| `docs/13_references.md` | Standards, implementation references, and required licensed data. |
| `docs/templates/*` | Reusable Markdown templates for specs, reports and tickets. |
| `docs/snippets/*` | Copy-ready example data and TypeScript snippets. |
| `docs/diagrams/*` | Mermaid diagrams for architecture and calculation pipeline. |

## Recommended first decision

Start with a **client-side engineering assistant**, not a certifying product. Use transparent formulas, conservative warnings, and clearly mark where licensed standard tables or manufacturer validation data must be supplied before production use.

## Definition of done for documentation phase

This documentation package is complete when the team can:

1. Create a first `apps/busbar-calculator` skeleton.
2. Register the calculator in the existing utility catalog.
3. Implement deterministic calculation modules without mixing formulas into React components.
4. Generate the first PDF report from calculated data.
5. Compare results against vendor/standard examples before allowing engineering use.
