// Input: resourcesPath (Resources dir inside packaged .app) — scans panda-cli/dist/*.js
// Output: writes Resources/panda-cli/cli-manifest.json with sha256 of every .js file
// Pos: invoked by electron-builder afterPack hook (scripts/afterPack.cjs)

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export interface CliManifest {
  version: string;
  generatedAt: string;
  files: Record<string, string>;
}

/**
 * Recursively collect all *.js files under root.
 */
function collectJsFiles(root: string, base: string = root): string[] {
  const out: string[] = [];
  if (!existsSync(root)) return out;
  const entries = readdirSync(root);
  for (const entry of entries) {
    const full = join(root, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectJsFiles(full, base));
    } else if (st.isFile() && entry.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function sha256File(filePath: string): string {
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

function nowIsoSGT(): string {
  // ISO 8601 with +08:00 offset (Asia/Singapore — project standard)
  const d = new Date();
  const offsetMs = 8 * 60 * 60 * 1000;
  const local = new Date(d.getTime() + offsetMs);
  const iso = local.toISOString().replace('Z', '+08:00');
  return iso;
}

/**
 * Build manifest for `<resourcesPath>/panda-cli/dist/*.js`.
 * Returns manifest object (caller writes to disk).
 */
export function buildCliManifest(resourcesPath: string, version: string): CliManifest {
  const pandaCliDir = join(resourcesPath, 'panda-cli');
  const distDir = join(pandaCliDir, 'dist');
  if (!existsSync(distDir)) {
    throw new Error(
      `[generate-cli-manifest] panda-cli/dist not found at ${distDir}. ` +
        `Hook must run AFTER extraResources copy.`,
    );
  }
  const jsFiles = collectJsFiles(distDir);
  if (jsFiles.length === 0) {
    throw new Error(`[generate-cli-manifest] no .js files under ${distDir}`);
  }
  const files: Record<string, string> = {};
  for (const abs of jsFiles) {
    // Key relative to panda-cli/ (e.g. "dist/cli.js")
    const rel = relative(pandaCliDir, abs).split(sep).join('/');
    files[rel] = sha256File(abs);
  }
  return {
    version,
    generatedAt: nowIsoSGT(),
    files,
  };
}

/**
 * Generate manifest and write to `<resourcesPath>/panda-cli/cli-manifest.json`.
 */
export function generateCliManifest(resourcesPath: string, version: string): string {
  const manifest = buildCliManifest(resourcesPath, version);
  const outPath = join(resourcesPath, 'panda-cli', 'cli-manifest.json');
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return outPath;
}

// CLI entry: `bun scripts/generate-cli-manifest.ts <resourcesPath> <version>`
const isMain = (() => {
  try {
    const argv1 = process.argv[1] ?? '';
    return argv1.endsWith('generate-cli-manifest.ts') || argv1.endsWith('generate-cli-manifest.js');
  } catch {
    return false;
  }
})();
if (isMain) {
  const [, , resourcesPath, version] = process.argv;
  if (!resourcesPath || !version) {
    console.error('Usage: bun scripts/generate-cli-manifest.ts <resourcesPath> <version>');
    process.exit(2);
  }
  const out = generateCliManifest(resourcesPath, version);
  const fileCount = Object.keys(buildCliManifest(resourcesPath, version).files).length;
  console.log(`[generate-cli-manifest] wrote ${out} (${fileCount} .js files)`);
}
