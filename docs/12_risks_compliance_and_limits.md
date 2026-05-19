# Risks, Compliance and Limits

## 1. Main risk statement

A busbar calculator can influence high-energy electrical designs. Incorrect results can cause overheating, insulation failure, arc flash risk, equipment damage, fire or injury. The application must be positioned and implemented as an engineering aid unless and until all datasets, methods and outputs are formally validated.

## 2. Engineering risks

| Risk | Impact | Mitigation |
|---|---|---|
| Incomplete standard tables | Wrong current rating or clearance | Use metadata, warnings, approved datasets only. |
| Over-simplified thermal model | Underestimated temperature | Conservative defaults, validation, warning labels. |
| AC proximity/skin effect ignored | Underestimated losses | AC multipliers, warnings, validated factors. |
| Poor ventilation assumption | Temperature error | Cooling presets with clear assumptions and project approval. |
| Incorrect short-circuit data | False pass/fail | Require Ik/Ipk/source fields and mark missing checks. |
| Mechanical support oversimplified | Busbar movement under fault | Treat as screening, require support manufacturer data. |
| Equal current sharing assumption | Overheated parallel bar | Warn for asymmetry and require connection details. |
| Clearance only through air | Missing creepage/surface path risk | Model air and creepage separately where data exists. |
| User enters wrong units | Dangerous result | Strong unit labels, range validation, input sanity checks. |

## 3. Legal and standards risks

The calculator should not reproduce copyrighted standard tables unless the project has the right to use them.

Mitigation:

- keep table values in separate datasets;
- track source metadata;
- use placeholder/example data only during development;
- require engineering/data owner sign-off;
- avoid claiming certification;
- include disclaimers in UI and PDF.

## 4. Product wording to avoid

Avoid:

- `certified design`;
- `IEC compliant by calculation`;
- `guaranteed safe`;
- `type-tested result`;
- `final approved busbar`.

Prefer:

- `preliminary calculation`;
- `engineering aid`;
- `standards-guided`;
- `requires validation`;
- `screening check`;
- `estimated temperature rise`.

## 5. Data validation statuses

Use visible status labels:

| Status | Meaning |
|---|---|
| Example only | Development seed. Not for final design. |
| Draft | Entered but not checked. |
| Reviewed | Checked by engineer but not formally approved. |
| Approved | Approved for project/team use. |
| Deprecated | Kept for old reports only. |

## 6. Safety classification in UI

The final aggregated status should be strict:

```text
fail > warning > incomplete > pass
```

`pass` is allowed only when all required checks are complete and datasets are approved or explicitly accepted by the user/project.

## 7. Privacy and data handling

MVP:

- calculations local in browser;
- PDF local in browser;
- imported files local in browser;
- no server upload;
- no hidden telemetry.

If cloud saving is added:

- require authentication;
- show save destination;
- allow deletion/export;
- do not save files without explicit user action.

## 8. Cybersecurity

- validate imported JSON;
- sanitize project metadata before PDF output;
- do not execute imported formulas;
- do not load arbitrary scripts;
- avoid remote CDN dependencies;
- avoid `dangerouslySetInnerHTML`;
- keep PDF export local.

## 9. Maintenance risks

| Risk | Mitigation |
|---|---|
| Formula drift | Engine versioning and golden tests. |
| Dataset drift | Dataset revisions and changelog. |
| UI hides warnings | Central warning aggregator. |
| Report differs from UI | Report generated from same result object. |
| App breaks under iframe | Integration test through UtilityShellPage. |
| Bundle grows too large | Lazy-load report/CAD modules. |

## 10. Required disclaimer locations

- initial app info panel;
- warning panel when example data is used;
- PDF report footer or final page;
- docs page;
- first-run modal if desired.

## 11. Recommended default disclaimer

> This tool provides preliminary engineering calculations for busbar configuration and documentation. It does not replace licensed standards, manufacturer test data, design verification, local regulations, or approval by a qualified electrical engineer. Results based on example, draft or estimated data must not be used for final design release.

## 12. Release readiness checklist

- no hidden example data in production mode;
- all tables have metadata;
- standards references reviewed;
- warnings appear in UI and PDF;
- final design disclaimer visible;
- golden tests pass;
- PDF report reviewed;
- qualified engineer has reviewed calculation method;
- issue tracker has known limitations documented.
