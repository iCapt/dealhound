// DealHound R2 — build entry. Copies app/ and screenshots/ into the
// output directory and writes dossier.json via the competition kit's
// vendor/makefun-frontend.ts (which this file does not modify).
//
// Usage:  MAKEFUN_OUTPUT_DIR=out node main.ts
// Output: <out>/app/  <out>/screenshots/  <out>/dossier.json
//
// Node 22 stdlib only. Run twice and the output is byte-identical:
// files are copied in sorted order and the dossier is deterministic.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

const root = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

function copyTree(src: string, dst: string): void {
  if (!existsSync(src)) throw new Error(`missing: ${src}`);
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst, { recursive: true, dereference: false });
}

function main(): void {
  const appSrc = join(root, 'app');
  const shotsSrc = join(root, 'screenshots');
  if (!existsSync(appSrc)) throw new Error('app/ is missing');
  if (!existsSync(shotsSrc)) throw new Error('screenshots/ is missing');

  // Fresh output directory, so a stale file can never ship.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  copyTree(appSrc, join(outDir, 'app'));
  copyTree(shotsSrc, join(outDir, 'screenshots'));

  const dossier = buildDossier(root, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  const appFiles = readdirSync(join(outDir, 'app')).sort();
  const shotFiles = readdirSync(join(outDir, 'screenshots')).sort();
  console.log(`DealHound R2 build OK`);
  console.log(`  output: ${outDir}`);
  console.log(`  app: ${appFiles.join(', ')}`);
  console.log(`  screenshots: ${shotFiles.join(', ')}`);
  console.log(`  dossier.json: ${dossier.length} bytes`);
}

main();
