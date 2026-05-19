# Patch Snippets

These snippets are intended as starting points. Adjust imports, formatting and dependency versions to match the repository state at implementation time.

## 1. Route file

Create:

```text
src/pages/utilities/busbar-calculator.tsx
```

```tsx
import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';

export default createUtilityPage('busbar-calculator');
```

## 2. `utilities.ts` entry

```ts
{
  id: 'busbar-calculator',
  name: 'Busbar Calculator',
  description:
    'Size rectangular busbar assemblies, forecast heating, check clearances, and export PDF reports.',
  tech: 'React + SVG + PDF',
  standards: 'DIN 43670/43671 · IEC 61439 · IEC 60664',
  features: ['Thermal forecast', 'Phase layout preview', 'Short-circuit checks'],
  href: '/utilities/busbar-calculator/',
  thumbnail: '/img/utilities/busbar-calculator.png',
},
```

## 3. `utilityShellPages.tsx` slug union

```ts
export type UtilityPageSlug =
  | 'pipe-cutter'
  // existing slugs...
  | 'busbar-calculator';
```

## 4. `utilityShellPages.tsx` config

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
},
```

## 5. Docs page

Create:

```text
docs/utilities/busbar-calculator.mdx
```

```mdx
---
sidebar_position: 8
title: Busbar Calculator
---

import Head from '@docusaurus/Head';

<Head>
  <link rel="canonical" href="https://cadautoscript.com/docs/utilities/busbar-calculator/" />
</Head>

# Busbar Calculator

The Busbar Calculator helps configure rectangular copper or aluminium busbar assemblies, forecast heating, review voltage clearances, and export PDF reports.

[Open the utility](/utilities/busbar-calculator/)

## Main capabilities

- AC/DC busbar sizing.
- Horizontal and vertical phase arrangements.
- Flatwise and edgewise bar orientation.
- Ambient temperature and ventilation assumptions.
- Temperature rise forecast chart.
- Minimum air gap and channel envelope estimate.
- Preliminary short-circuit thermal and mechanical checks.
- Local PDF report export.

## Engineering note

This utility is an engineering aid. Final design release must be validated against licensed standards, manufacturer data, project specifications, and qualified engineering review.
```

## 6. Sidebar entry

Add to `sidebars.ts` under Utilities:

```ts
'utilities/busbar-calculator',
```

## 7. Root scripts

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

## 8. Vite app config

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

## 9. Rename script

Create:

```text
apps/busbar-calculator/scripts/rename-html.mjs
```

```js
import {renameSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

const outDir = resolve(process.cwd(), '../../static/utility-apps/busbar-calculator');
const indexPath = resolve(outDir, 'index.html');
const appPath = resolve(outDir, 'app.html');

if (!existsSync(indexPath)) {
  throw new Error(`Expected Vite output not found: ${indexPath}`);
}

renameSync(indexPath, appPath);
console.log(`Renamed ${indexPath} -> ${appPath}`);
```

## 10. Manifest script

```js
import {writeFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const outDir = resolve(process.cwd(), '../../static/utility-apps/busbar-calculator');
const assetsDir = resolve(outDir, 'assets');
const assets = readdirSync(assetsDir).map((name) => `assets/${name}`);

writeFileSync(
  resolve(outDir, 'manifest.json'),
  JSON.stringify(
    {
      name: 'busbar-calculator',
      version: process.env.npm_package_version ?? '0.1.0',
      buildTime: new Date().toISOString(),
      entry: 'app.html',
      assets,
    },
    null,
    2,
  ),
);
```

## 11. Minimal domain function example

```ts
export function calculateCurrentDensity(input: {
  current_A: number;
  width_mm: number;
  thickness_mm: number;
  barsPerPhase: number;
}) {
  const area_mm2 = input.width_mm * input.thickness_mm * input.barsPerPhase;
  if (area_mm2 <= 0) {
    throw new Error('Busbar area must be greater than zero.');
  }

  return {
    area_mm2,
    currentDensity_A_per_mm2: input.current_A / area_mm2,
  };
}
```

## 12. Minimal warning type

```ts
export type CalculationWarning = {
  code: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  recommendedAction?: string;
};
```
