# Implementation Ticket Template

## Title

`feat(busbar): ...`

## Goal

Describe the engineering/user outcome.

## Scope

Included:

- ...

Excluded:

- ...

## Files likely touched

- `apps/busbar-calculator/src/...`
- `static/utility-apps/busbar-calculator/...`
- `src/data/utilities.ts`
- `src/data/utilityShellPages.tsx`
- `docs/utilities/busbar-calculator.mdx`

## Acceptance criteria

- [ ] UI behavior works.
- [ ] Domain functions are tested.
- [ ] Warnings are returned for incomplete/approximate data.
- [ ] PDF/report impact considered.
- [ ] Golden cases updated if calculation-impacting.
- [ ] Docusaurus build still passes.

## Calculation impact

- [ ] No calculation impact.
- [ ] Formula changed.
- [ ] Dataset changed.
- [ ] Candidate ranking changed.
- [ ] Report output changed.

## Test plan

```bash
pnpm typecheck:busbar
pnpm test:busbar
pnpm build:busbar
pnpm typecheck
pnpm build
```

## Engineering review

Reviewer:
Date:
Notes:
