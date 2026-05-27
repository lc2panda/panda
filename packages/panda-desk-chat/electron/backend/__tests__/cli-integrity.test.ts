// Input: synthetic Resources/panda-cli tree in os.tmpdir() with real fs
// Output: assertion that verifyCliIntegrity matches manifest, detects mismatch & missing files
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — guards v2.27.0 P1 contract.

import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { formatVerifyResult, verifyCliIntegrity } from '../cli-integrity';

function sha256(buf: Buffer | string): string {
  return createHash('sha256').update(buf).digest('hex');
}

describe('verifyCliIntegrity (v2.27.0 P1)', () => {
  let resourcesPath: string;
  let pandaCliDir: string;
  let distDir: string;

  beforeEach(() => {
    resourcesPath = mkdtempSync(join(tmpdir(), 'panda-cli-integrity-'));
    pandaCliDir = join(resourcesPath, 'panda-cli');
    distDir = join(pandaCliDir, 'dist');
    mkdirSync(distDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(resourcesPath, { recursive: true, force: true });
  });

  test('① missing manifest → ok=true, missingManifest=true (dev mode)', async () => {
    const result = await verifyCliIntegrity(resourcesPath);
    expect(result.ok).toBe(true);
    expect(result.missingManifest).toBe(true);
    expect(result.mismatches).toEqual([]);
    expect(result.missingFiles).toEqual([]);
    expect(formatVerifyResult(result)).toContain('manifest missing');
  });

  test('② matching sha256 → ok=true, missingManifest=false', async () => {
    const cliBody = 'console.log("panda-cli")';
    const chunkBody = 'export const x = 1;';
    writeFileSync(join(distDir, 'cli.js'), cliBody);
    writeFileSync(join(distDir, 'chunk-abc.js'), chunkBody);
    const manifest = {
      version: '2.27.0',
      generatedAt: '2026-05-27T09:36:32+08:00',
      files: {
        'dist/cli.js': sha256(cliBody),
        'dist/chunk-abc.js': sha256(chunkBody),
      },
    };
    writeFileSync(join(pandaCliDir, 'cli-manifest.json'), JSON.stringify(manifest));

    const result = await verifyCliIntegrity(resourcesPath);
    expect(result.ok).toBe(true);
    expect(result.missingManifest).toBe(false);
    expect(result.mismatches).toEqual([]);
    expect(result.missingFiles).toEqual([]);
    expect(result.manifestVersion).toBe('2.27.0');
    expect(formatVerifyResult(result)).toContain('ok');
  });

  test('③ sha256 mismatch → ok=false with mismatches[]', async () => {
    writeFileSync(join(distDir, 'cli.js'), 'console.log("tampered")');
    const manifest = {
      version: '2.27.0',
      generatedAt: '2026-05-27T09:36:32+08:00',
      files: {
        'dist/cli.js': sha256('console.log("original")'),
      },
    };
    writeFileSync(join(pandaCliDir, 'cli-manifest.json'), JSON.stringify(manifest));

    const result = await verifyCliIntegrity(resourcesPath);
    expect(result.ok).toBe(false);
    expect(result.missingManifest).toBe(false);
    expect(result.mismatches).toContain('dist/cli.js');
    expect(result.missingFiles).toEqual([]);
    expect(formatVerifyResult(result)).toContain('FAILED');
    expect(formatVerifyResult(result)).toContain('sha256-mismatch=dist/cli.js');
  });

  test('④ manifest lists file not on disk → ok=false with missingFiles[]', async () => {
    writeFileSync(join(distDir, 'cli.js'), 'console.log("ok")');
    const manifest = {
      version: '2.27.0',
      generatedAt: '2026-05-27T09:36:32+08:00',
      files: {
        'dist/cli.js': sha256('console.log("ok")'),
        'dist/missing-chunk.js': sha256('nope'),
      },
    };
    writeFileSync(join(pandaCliDir, 'cli-manifest.json'), JSON.stringify(manifest));

    const result = await verifyCliIntegrity(resourcesPath);
    expect(result.ok).toBe(false);
    expect(result.missingManifest).toBe(false);
    expect(result.missingFiles).toContain('dist/missing-chunk.js');
    expect(result.mismatches).toEqual([]);
    expect(formatVerifyResult(result)).toContain('missing=dist/missing-chunk.js');
  });

  test('⑤ corrupt manifest JSON → ok=false, parse-error in mismatches', async () => {
    writeFileSync(join(distDir, 'cli.js'), 'console.log("ok")');
    writeFileSync(join(pandaCliDir, 'cli-manifest.json'), '{ this is not valid json');

    const result = await verifyCliIntegrity(resourcesPath);
    expect(result.ok).toBe(false);
    expect(result.missingManifest).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
    expect(result.mismatches[0]).toContain('manifest-parse-error');
  });

  test('⑥ manifest missing files map → ok=false, shape-error', async () => {
    writeFileSync(
      join(pandaCliDir, 'cli-manifest.json'),
      JSON.stringify({ version: '2.27.0', generatedAt: 'x' }),
    );

    const result = await verifyCliIntegrity(resourcesPath);
    expect(result.ok).toBe(false);
    expect(result.missingManifest).toBe(false);
    expect(result.mismatches[0]).toContain('manifest-shape-error');
  });

  test('⑦ multiple mismatches reported together', async () => {
    writeFileSync(join(distDir, 'cli.js'), 'tampered-1');
    writeFileSync(join(distDir, 'chunk-a.js'), 'tampered-2');
    const manifest = {
      version: '2.27.0',
      generatedAt: '2026-05-27T09:36:32+08:00',
      files: {
        'dist/cli.js': sha256('orig-1'),
        'dist/chunk-a.js': sha256('orig-2'),
      },
    };
    writeFileSync(join(pandaCliDir, 'cli-manifest.json'), JSON.stringify(manifest));

    const result = await verifyCliIntegrity(resourcesPath);
    expect(result.ok).toBe(false);
    expect(result.mismatches).toEqual(
      expect.arrayContaining(['dist/cli.js', 'dist/chunk-a.js']),
    );
    expect(result.mismatches.length).toBe(2);
  });
});
