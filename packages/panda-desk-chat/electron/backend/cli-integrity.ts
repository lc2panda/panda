// Input: resourcesPath — packaged Resources dir (process.resourcesPath at runtime)
// Output: VerifyResult { ok, mismatches[], missingManifest, missingFiles[] }
// Pos: cli-manager.ts ensureSession 启动 panda-cli 之前调用，校验 panda-cli/dist/*.js 完整性

import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

export interface CliManifest {
  version: string;
  generatedAt: string;
  files: Record<string, string>;
}

export interface VerifyResult {
  ok: boolean;
  /** Manifest not found on disk (dev mode or older install) — caller should treat as non-fatal warning. */
  missingManifest: boolean;
  /** Files listed in manifest but missing on disk. */
  missingFiles: string[];
  /** Files whose sha256 differs from manifest. */
  mismatches: string[];
  /** Manifest version (when readable). */
  manifestVersion?: string;
  /** Manifest generation timestamp (when readable). */
  manifestGeneratedAt?: string;
}

async function sha256OfFile(absPath: string): Promise<string> {
  const buf = await readFile(absPath);
  return createHash('sha256').update(buf).digest('hex');
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify integrity of `<resourcesPath>/panda-cli/*` against cli-manifest.json.
 *
 * Behavior:
 * - No manifest: returns `{ ok: true, missingManifest: true }` — caller should warn but not block (dev mode).
 * - All hashes match: `{ ok: true, missingManifest: false }`.
 * - Any mismatch / missing file: `{ ok: false, ... }` with details.
 */
export async function verifyCliIntegrity(resourcesPath: string): Promise<VerifyResult> {
  const pandaCliDir = join(resourcesPath, 'panda-cli');
  const manifestPath = join(pandaCliDir, 'cli-manifest.json');

  if (!(await exists(manifestPath))) {
    return {
      ok: true,
      missingManifest: true,
      missingFiles: [],
      mismatches: [],
    };
  }

  let manifest: CliManifest;
  try {
    const raw = await readFile(manifestPath, 'utf8');
    manifest = JSON.parse(raw) as CliManifest;
  } catch (err) {
    // Corrupt manifest — treat as integrity failure (not dev-mode missing)
    return {
      ok: false,
      missingManifest: false,
      missingFiles: [],
      mismatches: [`<manifest-parse-error>: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  if (!manifest || typeof manifest.files !== 'object' || manifest.files === null) {
    return {
      ok: false,
      missingManifest: false,
      missingFiles: [],
      mismatches: ['<manifest-shape-error>: missing files map'],
      manifestVersion: manifest?.version,
      manifestGeneratedAt: manifest?.generatedAt,
    };
  }

  const missingFiles: string[] = [];
  const mismatches: string[] = [];

  for (const [relPath, expectedSha] of Object.entries(manifest.files)) {
    const abs = join(pandaCliDir, relPath);
    if (!(await exists(abs))) {
      missingFiles.push(relPath);
      continue;
    }
    let actual: string;
    try {
      actual = await sha256OfFile(abs);
    } catch (err) {
      mismatches.push(`${relPath} <read-error: ${err instanceof Error ? err.message : String(err)}>`);
      continue;
    }
    if (actual !== expectedSha) {
      mismatches.push(relPath);
    }
  }

  return {
    ok: missingFiles.length === 0 && mismatches.length === 0,
    missingManifest: false,
    missingFiles,
    mismatches,
    manifestVersion: manifest.version,
    manifestGeneratedAt: manifest.generatedAt,
  };
}

/**
 * Convenience: format a VerifyResult into a human-readable diagnostic line.
 * Used by cli-manager when emitting CLI_INTEGRITY_FAILED errors.
 */
export function formatVerifyResult(result: VerifyResult): string {
  if (result.ok) {
    if (result.missingManifest) return 'CLI integrity: manifest missing (dev mode, skipped)';
    return `CLI integrity: ok (version=${result.manifestVersion ?? 'unknown'})`;
  }
  const parts: string[] = [];
  if (result.missingFiles.length > 0) {
    parts.push(`missing=${result.missingFiles.join(',')}`);
  }
  if (result.mismatches.length > 0) {
    parts.push(`sha256-mismatch=${result.mismatches.join(',')}`);
  }
  return `CLI integrity FAILED (version=${result.manifestVersion ?? 'unknown'}): ${parts.join(' ')}`;
}
