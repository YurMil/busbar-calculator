# Repository Integration Plan

## 1. Current repository pattern

The CAD AutoScript repository is a Docusaurus-based engineering portal with React and TypeScript. Interactive utilities are listed in `src/data/utilities.ts`, configured in `src/data/utilityShellPages.tsx`, routed from `src/pages/utilities/*`, and often loaded from `static/utility-apps/<slug>/app.html` through the common `UtilityShellPage` iframe shell.

The Busbar Calculator should follow that pattern.

## 2. Recommended integration model

Use a source app under `apps/` and publish its static build into `static/utility-apps/`:

```text
cadautoscript.com/
  apps/
    busbar-calculator/
      index.html
      package.json
      tsconfig.json
      vite.config.ts
      src/
        main.tsx
        App.tsx
        components/
        domain/
        data/
        export/
        charts/
        state/
        workers/
        styles/
  static/
    utility-apps/
      busbar-calculator/
        app.html
        assets/
        manifest.json
  src/
    pages/
      utilities/
        busbar-calculator.tsx
    data/
      utilities.ts
      utilityShellPages.tsx
  docs/
    utilities/
      busbar-calculator.mdx
```

## 3. Why standalone app instead of direct component

A standalone app is preferred because:

- it keeps calculation complexity away from the Docusaurus bundle;
- it can use its own local CSS and chart setup;
- it can later be moved into a separate repository if needed;
- it can be built and tested independently;
- it matches existing static utility app deployment practices;
- heavy charting or future CAD/WASM features can be code-split and worker-based.

## 4. Host-site responsibilities

The Docusaurus host should own:

- public route `/utilities/busbar-calculator/`;
- SEO metadata;
- utility catalog card;
- shell layout;
- authentication/access gate if enabled;
- reactions/comments;
- fullscreen shell controls;
- docs page in the utility catalog.

## 5. Busbar app responsibilities

The Vite utility app should own:

- calculation input forms;
- calculation state;
- engineering formula modules;
- profile/material datasets;
- charts;
- SVG/canvas visualizations;
- PDF export;
- local report persistence/import/export;
- app-level keyboard and layout behavior.

## 6. Files to modify in the host repo

### 6.1 `src/data/utilities.ts`

Add the catalog card:

```ts
{
  id: 'busbar-calculator',
  name: 'Busbar Calculator',
  description:
    'Size rectangular busbar assemblies, forecast heating, check clearances and export PDF reports.',
  tech: 'React + SVG + PDF',
  standards: 'DIN 43670/43671 · IEC 61439 · IEC 60664',
  features: ['Thermal forecast', 'Phase layout preview', 'Short-circuit checks'],
  href: '/utilities/busbar-calculator/',
  thumbnail: '/img/utilities/busbar-calculator.png',
}
```

### 6.2 `src/data/utilityShellPages.tsx`

Extend the `UtilityPageSlug` union:

```ts
| 'busbar-calculator'
```

Add the page config:

```tsx
'busbar-calculator': {
  slug: 'busbar-calculator',
  title: 'Busbar Calculator',
  subtitle: 'Web utility - Busbar sizing, heating forecast, and PDF reports',
  description:
    'Configure copper or aluminium busbar assemblies, evaluate clearances and short-circuit withstand, and export engineering reports.',
  about:
    'Select current, voltage, material, phase layout, cooling conditions, and short-circuit data. The utility visualizes the busbar channel, forecasts temperature rise, and produces a traceable PDF report.',
  tags: ['Busbars', 'Switchgear', 'Temperature rise', 'PDF reports'],
  note:
    'Runs locally in the browser. Validate final designs against licensed standards, manufacturer test data, and project requirements.',
  features: [
    'Copper/aluminium profile selection',
    'Horizontal/vertical/flatwise/edgewise arrangement preview',
    'Temperature forecast charts',
    'Voltage clearance and channel envelope checks',
    'Short-circuit thermal and mechanical checks',
    'PDF engineering report export',
  ],
  scriptType: 'module',
  appPath: '/utility-apps/busbar-calculator/app.html',
}
```

### 6.3 `src/pages/utilities/busbar-calculator.tsx`

Create route wrapper:

```tsx
import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';

export default createUtilityPage('busbar-calculator');
```

### 6.4 `docs/utilities/busbar-calculator.mdx`

Create a Docusaurus docs page with user-facing explanation, assumptions and link to the utility.

### 6.5 `sidebars.ts`

Add the docs page to the Utilities category:

```ts
'utilities/busbar-calculator',
```

### 6.6 Static thumbnail

Add:

```text
static/img/utilities/busbar-calculator.png
```

The first placeholder can be a generated SVG/PNG cross-section with L1/L2/L3 colored busbars and a temperature chart line.

## 7. Source app package

Suggested `apps/busbar-calculator/package.json`:

```json
{
  "name": "@cadautoscript/busbar-calculator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build && node scripts/rename-html.mjs && node scripts/write-manifest.mjs",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "~5.6.2",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "zustand": "^5.0.9",
    "jspdf": "^4.0.0",
    "lucide-react": "^0.561.0"
  },
  "devDependencies": {
    "vitest": "latest",
    "@types/react": "^19.2.13",
    "@types/react-dom": "^19.2.3"
  }
}
```

## 8. Vite build target

`vite.config.ts` should emit relative assets:

```ts
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../../static/utility-apps/busbar-calculator',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
```

A postbuild script should rename `index.html` to `app.html`.

## 9. Root scripts

Add root scripts:

```json
{
  "scripts": {
    "dev:busbar": "pnpm --dir apps/busbar-calculator dev",
    "build:busbar": "pnpm --dir apps/busbar-calculator build",
    "test:busbar": "pnpm --dir apps/busbar-calculator test",
    "typecheck:busbar": "pnpm --dir apps/busbar-calculator typecheck"
  }
}
```

## 10. Build pipeline

Recommended CI sequence:

```bash
pnpm install --frozen-lockfile
pnpm typecheck:busbar
pnpm test:busbar
pnpm build:busbar
pnpm typecheck
pnpm build
```

The site build should fail if:

- `static/utility-apps/busbar-calculator/app.html` is missing;
- the utility route fails to compile;
- `utilities.ts` references a missing thumbnail;
- unit tests fail;
- report generation smoke test fails.

## 11. Local development workflow

```bash
# Develop utility only
pnpm dev:busbar

# Build utility and inspect through host shell
pnpm build:busbar
pnpm start
# open /utilities/busbar-calculator/
```

## 12. Production deployment

Because the existing site builds as a static Docusaurus site, the utility should be checked into `static/utility-apps/busbar-calculator/` after build or generated during CI before the Docusaurus build step.

Do not rely on absolute asset paths. The app must work under:

```text
https://cadautoscript.com/utility-apps/busbar-calculator/app.html
```

and inside:

```text
https://cadautoscript.com/utilities/busbar-calculator/
```
