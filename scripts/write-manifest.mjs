import {existsSync, readdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const outDir = resolve(process.cwd(), 'static/utility-apps/busbar-calculator');
const assetsDir = resolve(outDir, 'assets');
const assets = existsSync(assetsDir)
  ? readdirSync(assetsDir).map((name) => `assets/${name}`)
  : [];

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

console.log(`Wrote manifest with ${assets.length} assets`);
