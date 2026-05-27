// Input: mocked fs + findSessionFile → session-rewind-service functions
// Output: assertions covering preview/execute/boundary/restore paths
// Pos: electron backend tests — guards v2.27.1 sessionRewindService

import { describe, expect, test, vi, beforeEach } from 'vitest';
import path from 'node:path';
import os from 'node:os';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// We mock disk-session-scanner to control findSessionFile behaviour.
vi.mock('../disk-session-scanner', async () => {
  const actual = await vi.importActual<typeof import('../disk-session-scanner')>(
    '../disk-session-scanner',
  );
  return {
    ...actual,
    findSessionFile: vi.fn(),
  };
});

// We mock node:fs/promises so we can intercept readFile / writeFile / copyFile / readdir / stat / mkdir.
vi.mock('node:fs/promises', async () => {
  return {
    default: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      copyFile: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn(),
      mkdir: vi.fn(),
    },
  };
});

import {
  previewSessionRewind,
  executeSessionRewind,
} from '../session-rewind-service';

import { findSessionFile } from '../disk-session-scanner';
import fsPromises from 'node:fs/promises';

const mockFindSession = findSessionFile as ReturnType<typeof vi.fn>;
const mockFs = fsPromises as unknown as Record<string, ReturnType<typeof vi.fn>>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SESSION_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const JSONL_PATH = `/Users/test/.pandacc/projects/-test/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jsonl`;

/**
 * Build a fake jsonl with `userCount` user turns each followed by one assistant
 * turn.  The assistant turns at indices > `fileOpTurnIndex` contain a
 * FileEditTool tool_use with a file_path.
 */
function buildFakeJsonl(
  userCount: number,
  fileOpTurnIndex = 1,
): string {
  const lines: string[] = [];
  for (let i = 0; i < userCount; i++) {
    // user turn
    lines.push(
      JSON.stringify({
        type: 'user',
        uuid: `user-${i}`,
        message: { role: 'user', content: [{ type: 'text', text: `message ${i}` }] },
        timestamp: new Date().toISOString(),
      }),
    );
    // assistant turn — add file tool_use after fileOpTurnIndex
    const toolBlock =
      i >= fileOpTurnIndex
        ? [
            {
              type: 'tool_use',
              name: 'Edit',
              input: { file_path: `/tmp/file_${i}.ts` },
            },
          ]
        : [];
    lines.push(
      JSON.stringify({
        type: 'assistant',
        uuid: `assistant-${i}`,
        message: { role: 'assistant', content: [...toolBlock, { type: 'text', text: 'ok' }] },
        timestamp: new Date().toISOString(),
      }),
    );
  }
  return lines.join('\n') + '\n';
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('previewSessionRewind', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('session not found → canRollback=false', async () => {
    mockFindSession.mockResolvedValue(null);
    const result = await previewSessionRewind(SESSION_ID, 2);
    expect(result.canRollback).toBe(false);
    expect(result.reason).toMatch(/未找到/);
  });

  test('preview userTurnIndex=2 → messagesAfter > 0, filesAffected non-empty', async () => {
    // 5 user turns, file ops start at turn 1 (indices 1,2,3,4)
    const jsonl = buildFakeJsonl(5, 1);
    mockFindSession.mockResolvedValue({ filePath: JSONL_PATH, projectDir: '-test' });
    mockFs.readFile.mockResolvedValue(jsonl);

    const result = await previewSessionRewind(SESSION_ID, 2);

    expect(result.canRollback).toBe(true);
    expect(result.targetTurn).toBe(2);
    // After turn 2 (inclusive): turns 3 and 4 → 4 entries (2 user + 2 assistant)
    expect(result.messagesAfter).toBeGreaterThan(0);
    // file ops at turns 2,3,4 but we keep up to turn 2 — turns 3 and 4 are after
    expect(result.filesAffected.length).toBeGreaterThan(0);
  });

  test('userTurnIndex out of bounds → canRollback=false', async () => {
    const jsonl = buildFakeJsonl(3); // 3 user turns → valid range 0-1 (last is 2, but 2 triggers "already last")
    mockFindSession.mockResolvedValue({ filePath: JSONL_PATH, projectDir: '-test' });
    mockFs.readFile.mockResolvedValue(jsonl);

    const result = await previewSessionRewind(SESSION_ID, 99);
    expect(result.canRollback).toBe(false);
    expect(result.reason).toMatch(/越界/);
  });

  test('userTurnIndex = last turn → canRollback=false with "最后" reason', async () => {
    const jsonl = buildFakeJsonl(3);
    mockFindSession.mockResolvedValue({ filePath: JSONL_PATH, projectDir: '-test' });
    mockFs.readFile.mockResolvedValue(jsonl);

    // Last user turn index is 2 (0-indexed, 3 total)
    const result = await previewSessionRewind(SESSION_ID, 2);
    expect(result.canRollback).toBe(false);
    expect(result.reason).toMatch(/最后/);
  });

  test('userTurnIndex=0 → canRollback=true, covers all subsequent entries', async () => {
    const jsonl = buildFakeJsonl(4, 0);
    mockFindSession.mockResolvedValue({ filePath: JSONL_PATH, projectDir: '-test' });
    mockFs.readFile.mockResolvedValue(jsonl);

    const result = await previewSessionRewind(SESSION_ID, 0);
    expect(result.canRollback).toBe(true);
    // After turn 0: 3 user turns + 4 assistant turns = 7 entries
    expect(result.messagesAfter).toBe(7);
  });
});

describe('executeSessionRewind', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('execute → jsonl truncated, backup created', async () => {
    const jsonl = buildFakeJsonl(5, 1);
    mockFindSession.mockResolvedValue({ filePath: JSONL_PATH, projectDir: '-test' });
    mockFs.readFile.mockResolvedValue(jsonl);
    mockFs.copyFile.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);

    const result = await executeSessionRewind(SESSION_ID, 2);

    expect(result.ok).toBe(true);
    expect(result.backupPath).toMatch(/\.bak\.\d+$/);
    // copyFile should have been called for backup
    expect(mockFs.copyFile).toHaveBeenCalledWith(JSONL_PATH, result.backupPath);
    // writeFile should have been called with truncated content
    expect(mockFs.writeFile).toHaveBeenCalled();
    const [writtenPath, writtenContent] = mockFs.writeFile.mock.calls[0] as [string, string];
    expect(writtenPath).toBe(JSONL_PATH);
    // Content should end with newline and only contain entries up to the cut
    const writtenLines = (writtenContent as string).trim().split('\n').filter(Boolean);
    // turns 0..2 inclusive: user-0, assistant-0, user-1, assistant-1, user-2 = 5 entries
    expect(writtenLines.length).toBe(5);
  });

  test('execute restoreFiles=true but no snapshot exists → ok=true, restoredFiles=[]', async () => {
    const jsonl = buildFakeJsonl(4, 1);
    mockFindSession.mockResolvedValue({ filePath: JSONL_PATH, projectDir: '-test' });
    mockFs.readFile.mockResolvedValue(jsonl);
    mockFs.copyFile.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    // readdir returns empty → no backup files found
    mockFs.readdir.mockResolvedValue([]);

    const result = await executeSessionRewind(SESSION_ID, 1, { restoreFiles: true });

    expect(result.ok).toBe(true);
    expect(result.restoredFiles).toEqual([]);
  });

  test('execute when canRollback=false → returns error without writing', async () => {
    mockFindSession.mockResolvedValue(null);

    const result = await executeSessionRewind(SESSION_ID, 0);

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  test('writeFile failure triggers backup restore attempt', async () => {
    const jsonl = buildFakeJsonl(3, 0);
    mockFindSession.mockResolvedValue({ filePath: JSONL_PATH, projectDir: '-test' });
    mockFs.readFile.mockResolvedValue(jsonl);
    mockFs.copyFile.mockResolvedValue(undefined);
    mockFs.writeFile.mockRejectedValue(new Error('disk full'));
    mockFs.readdir.mockResolvedValue([]);

    const result = await executeSessionRewind(SESSION_ID, 0);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/disk full/);
    // Should have attempted to restore backup (copyFile called twice: once for backup, once for restore)
    expect(mockFs.copyFile).toHaveBeenCalledTimes(2);
  });
});
