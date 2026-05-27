// Input: real temp directory with mock jsonl files
// Output: assertion that cleanupPlaceholderSessions deletes only transcript=0 + mtime>24h files
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — guards v2.27.1 P3 fix.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

import { cleanupPlaceholderSessions } from '../disk-session-scanner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UUID_PLACEHOLDER_OLD = '11111111-0000-0000-0000-000000000001';
const UUID_PLACEHOLDER_FRESH = '22222222-0000-0000-0000-000000000002';
const UUID_WITH_TURNS = '33333333-0000-0000-0000-000000000003';

async function mkTmpProjectsDir(): Promise<string> {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'panda-cleanup-test-'));
  const projDir = path.join(base, '-Users-panda-Downloads-proj-a');
  await fs.mkdir(projDir);
  return base;
}

async function backdate(filePath: string, msAgo: number): Promise<void> {
  const t = new Date(Date.now() - msAgo);
  await fs.utimes(filePath, t, t);
}

const JSONL_WITH_TURNS =
  JSON.stringify({ type: 'user', message: { role: 'user', content: 'hi' } }) +
  '\n' +
  JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: 'hello' } }) +
  '\n';

// ─── Test state ───────────────────────────────────────────────────────────────

let projectsDir = '';

beforeEach(async () => {
  projectsDir = await mkTmpProjectsDir();
  const projA = path.join(projectsDir, '-Users-panda-Downloads-proj-a');

  // FILE 1: transcript=0, mtime=48h ago → placeholder, should be removed
  const f1 = path.join(projA, `${UUID_PLACEHOLDER_OLD}.jsonl`);
  await fs.writeFile(f1, '');
  await backdate(f1, 48 * 60 * 60 * 1000);

  // FILE 2: transcript=0, mtime=1h ago → fresh, should be kept
  const f2 = path.join(projA, `${UUID_PLACEHOLDER_FRESH}.jsonl`);
  await fs.writeFile(f2, '');
  // mtime is effectively now; no backdate needed

  // FILE 3: transcript>0, mtime=48h ago → has content, should be kept
  const f3 = path.join(projA, `${UUID_WITH_TURNS}.jsonl`);
  await fs.writeFile(f3, JSONL_WITH_TURNS);
  await backdate(f3, 48 * 60 * 60 * 1000);
});

afterEach(async () => {
  await fs.rm(projectsDir, { recursive: true, force: true });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('cleanupPlaceholderSessions', () => {
  it('① removes transcript=0 + mtime>24h (placeholder)', async () => {
    const { removed } = await cleanupPlaceholderSessions(projectsDir);
    expect(removed.some((p) => p.includes(UUID_PLACEHOLDER_OLD))).toBe(true);
  });

  it('② kept list does NOT include the removed placeholder', async () => {
    const { removed, kept } = await cleanupPlaceholderSessions(projectsDir);
    expect(kept.some((p) => p.includes(UUID_PLACEHOLDER_OLD))).toBe(false);
    expect(removed.length).toBeGreaterThan(0);
  });

  it('③ keeps transcript=0 + mtime<24h (recently created, may be in use)', async () => {
    const { removed, kept } = await cleanupPlaceholderSessions(projectsDir);
    expect(removed.some((p) => p.includes(UUID_PLACEHOLDER_FRESH))).toBe(false);
    expect(kept.some((p) => p.includes(UUID_PLACEHOLDER_FRESH))).toBe(true);
  });

  it('④ keeps transcript>0 regardless of mtime', async () => {
    const { removed, kept } = await cleanupPlaceholderSessions(projectsDir);
    expect(removed.some((p) => p.includes(UUID_WITH_TURNS))).toBe(false);
    expect(kept.some((p) => p.includes(UUID_WITH_TURNS))).toBe(true);
  });

  it('⑤ dryRun mode: reports would-remove but file still exists on disk', async () => {
    const projA = path.join(projectsDir, '-Users-panda-Downloads-proj-a');
    const f1 = path.join(projA, `${UUID_PLACEHOLDER_OLD}.jsonl`);

    const { removed } = await cleanupPlaceholderSessions(projectsDir, { dryRun: true });
    expect(removed.some((p) => p.includes(UUID_PLACEHOLDER_OLD))).toBe(true);

    // File must still exist (dryRun → no deletion)
    await expect(fs.access(f1)).resolves.toBeUndefined();
  });

  it('⑥ returns empty arrays when projectsDir does not exist', async () => {
    const result = await cleanupPlaceholderSessions('/nonexistent-dir-12345');
    expect(result.removed).toEqual([]);
    expect(result.kept).toEqual([]);
  });
});
