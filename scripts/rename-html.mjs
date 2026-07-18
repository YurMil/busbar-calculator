import {copyFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

const outDir = resolve(process.cwd(), 'static/utility-apps/busbar-calculator');
const indexPath = resolve(outDir, 'index.html');
const appPath = resolve(outDir, 'app.html');

if (!existsSync(indexPath)) {
  throw new Error(`Expected Vite output not found: ${indexPath}`);
}

copyFileSync(indexPath, appPath);
console.log(`Copied ${indexPath} -> ${appPath}`);
