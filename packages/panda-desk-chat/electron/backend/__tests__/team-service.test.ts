// Input: mocked node:fs/promises — listTeams / getTeam / createTeam / updateTeam / deleteTeam
// Output: vitest 用例覆盖 team-service.ts 全 CRUD 路径
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — v2.27.1 teamService 单测

import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';

// ─── mock node:fs/promises ────────────────────────────────────────────────────
const mockReaddir = vi.fn();
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();
const mockAccess = vi.fn();
const mockStat = vi.fn();
const mockRm = vi.fn();

vi.mock('node:fs/promises', () => ({
  default: {
    readdir: (...args: unknown[]) => mockReaddir(...args),
    readFile: (...args: unknown[]) => mockReadFile(...args),
    writeFile: (...args: unknown[]) => mockWriteFile(...args),
    mkdir: (...args: unknown[]) => mockMkdir(...args),
    access: (...args: unknown[]) => mockAccess(...args),
    stat: (...args: unknown[]) => mockStat(...args),
    rm: (...args: unknown[]) => mockRm(...args),
  },
}));

import {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../team-service';

const MOCK_DIR = '/tmp/test-teams';

const SAMPLE_CONFIG = JSON.stringify({
  displayName: 'My Team',
  description: 'Test team',
  members: ['agent-a', 'agent-b'],
  coordinator: 'agent-a',
  settings: { parallel: true },
});

function makeDirent(name: string, isDir = true) {
  return { name, isFile: () => !isDir, isDirectory: () => isDir } as import('node:fs').Dirent;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMkdir.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
  mockRm.mockResolvedValue(undefined);
});

// ─── listTeams ────────────────────────────────────────────────────────────────
describe('team-service.listTeams', () => {
  it('returns empty array when dir does not exist', async () => {
    mockReaddir.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await listTeams(MOCK_DIR);
    expect(result).toEqual([]);
  });

  it('lists directories and parses config.json', async () => {
    mockReaddir.mockResolvedValueOnce([
      makeDirent('my-team'),
    ]);
    mockReadFile.mockResolvedValueOnce(SAMPLE_CONFIG);
    const result = await listTeams(MOCK_DIR);
    expect(result).toHaveLength(1);
    const rec = result[0]!;
    expect(rec.id).toBe('my-team');
    expect(rec.displayName).toBe('My Team');
    expect(rec.members).toEqual(['agent-a', 'agent-b']);
    expect(rec.coordinator).toBe('agent-a');
    expect(rec.settings).toEqual({ parallel: true });
    expect(rec.hasConfig).toBe(true);
  });

  it('uses id as displayName when config.json missing', async () => {
    mockReaddir.mockResolvedValueOnce([makeDirent('no-config-team')]);
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await listTeams(MOCK_DIR);
    expect(result[0]!.id).toBe('no-config-team');
    expect(result[0]!.displayName).toBe('no-config-team');
    expect(result[0]!.hasConfig).toBe(false);
  });

  it('skips non-directory entries', async () => {
    mockReaddir.mockResolvedValueOnce([
      { name: 'file.json', isFile: () => true, isDirectory: () => false } as import('node:fs').Dirent,
      makeDirent('real-team'),
    ]);
    mockReadFile.mockResolvedValueOnce(SAMPLE_CONFIG);
    const result = await listTeams(MOCK_DIR);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('real-team');
  });

  it('skips dot-prefixed directories', async () => {
    mockReaddir.mockResolvedValueOnce([
      makeDirent('.hidden-team'),
      makeDirent('visible-team'),
    ]);
    mockReadFile.mockResolvedValueOnce(SAMPLE_CONFIG);
    const result = await listTeams(MOCK_DIR);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('visible-team');
  });

  it('returns sorted by displayName', async () => {
    mockReaddir.mockResolvedValueOnce([
      makeDirent('z-team'),
      makeDirent('a-team'),
    ]);
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify({ displayName: 'Z Team', description: '', members: [], coordinator: null, settings: {} }))
      .mockResolvedValueOnce(JSON.stringify({ displayName: 'A Team', description: '', members: [], coordinator: null, settings: {} }));
    const result = await listTeams(MOCK_DIR);
    expect(result[0]!.displayName).toBe('A Team');
    expect(result[1]!.displayName).toBe('Z Team');
  });
});

// ─── getTeam ──────────────────────────────────────────────────────────────────
describe('team-service.getTeam', () => {
  it('returns null when dir not found', async () => {
    mockStat.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await getTeam('missing', MOCK_DIR);
    expect(result).toBeNull();
  });

  it('returns null when path is not a directory', async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => false });
    const result = await getTeam('file', MOCK_DIR);
    expect(result).toBeNull();
  });

  it('returns TeamRecord with config', async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => true });
    mockReadFile.mockResolvedValueOnce(SAMPLE_CONFIG);
    const result = await getTeam('my-team', MOCK_DIR);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('my-team');
    expect(result!.path).toBe(path.join(MOCK_DIR, 'my-team'));
  });

  it('throws for unsafe id (path traversal)', async () => {
    await expect(getTeam('../escape', MOCK_DIR)).rejects.toThrow('Invalid team id');
  });
});

// ─── createTeam ───────────────────────────────────────────────────────────────
describe('team-service.createTeam', () => {
  beforeEach(() => {
    // directory does not exist yet → access throws ENOENT
    mockAccess.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
  });

  it('creates directory + config.json + inboxes/', async () => {
    const result = await createTeam(
      { id: 'new-team', displayName: 'New Team', members: ['agent-x'], coordinator: 'agent-x' },
      MOCK_DIR,
    );
    expect(result.id).toBe('new-team');
    expect(result.displayName).toBe('New Team');
    expect(result.members).toEqual(['agent-x']);
    expect(result.coordinator).toBe('agent-x');
    expect(result.hasConfig).toBe(true);
    expect(mockMkdir).toHaveBeenCalledTimes(2); // teamDir + inboxes
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [, content] = mockWriteFile.mock.calls[0]! as [string, string, string];
    const parsed = JSON.parse(content);
    expect(parsed.displayName).toBe('New Team');
    expect(parsed.members).toEqual(['agent-x']);
  });

  it('auto-generates UUID id when not provided', async () => {
    const result = await createTeam({ displayName: 'Auto Team' }, MOCK_DIR);
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('throws when team already exists', async () => {
    mockAccess.mockResolvedValueOnce(undefined); // dir exists
    await expect(createTeam({ id: 'dup-team', displayName: 'Dup' }, MOCK_DIR)).rejects.toThrow('already exists');
  });

  it('throws for unsafe id', async () => {
    await expect(createTeam({ id: '../escape', displayName: 'X' }, MOCK_DIR)).rejects.toThrow('Invalid team id');
  });
});

// ─── updateTeam ───────────────────────────────────────────────────────────────
describe('team-service.updateTeam', () => {
  it('merges partial and writes config.json', async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => true });
    mockReadFile.mockResolvedValueOnce(SAMPLE_CONFIG);
    const result = await updateTeam('my-team', { description: 'Updated', members: ['agent-c'] }, MOCK_DIR);
    expect(result.description).toBe('Updated');
    expect(result.members).toEqual(['agent-c']);
    expect(result.displayName).toBe('My Team'); // unchanged
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [, content] = mockWriteFile.mock.calls[0]! as [string, string, string];
    const parsed = JSON.parse(content);
    expect(parsed.description).toBe('Updated');
  });

  it('throws when team not found', async () => {
    mockStat.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    await expect(updateTeam('missing', { displayName: 'X' }, MOCK_DIR)).rejects.toThrow('not found');
  });

  it('throws for unsafe id', async () => {
    await expect(updateTeam('../escape', { displayName: 'X' }, MOCK_DIR)).rejects.toThrow('Invalid team id');
  });
});

// ─── deleteTeam ───────────────────────────────────────────────────────────────
describe('team-service.deleteTeam', () => {
  it('returns ok:true after removing directory', async () => {
    const result = await deleteTeam('my-team', MOCK_DIR);
    expect(result.ok).toBe(true);
    expect(mockRm).toHaveBeenCalledWith(
      path.join(MOCK_DIR, 'my-team'),
      { recursive: true, force: true },
    );
  });

  it('returns ok:false when directory not found', async () => {
    mockRm.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await deleteTeam('missing', MOCK_DIR);
    expect(result.ok).toBe(false);
  });

  it('re-throws unexpected errors', async () => {
    mockRm.mockRejectedValueOnce(Object.assign(new Error('EPERM'), { code: 'EPERM' }));
    await expect(deleteTeam('locked', MOCK_DIR)).rejects.toThrow('EPERM');
  });

  it('throws for unsafe id', async () => {
    await expect(deleteTeam('../escape', MOCK_DIR)).rejects.toThrow('Invalid team id');
  });
});

// ─── settings field ───────────────────────────────────────────────────────────
describe('team-service config.json settings field', () => {
  it('defaults settings to empty object when config.json has no settings', async () => {
    const noSettings = JSON.stringify({ displayName: 'No Settings', description: '', members: [], coordinator: null });
    mockReaddir.mockResolvedValueOnce([makeDirent('no-settings')]);
    mockReadFile.mockResolvedValueOnce(noSettings);
    const result = await listTeams(MOCK_DIR);
    expect(result[0]!.settings).toEqual({});
  });

  it('preserves arbitrary settings keys', async () => {
    const withSettings = JSON.stringify({
      displayName: 'With Settings', description: '', members: [],
      coordinator: null, settings: { maxConcurrent: 3, debug: true },
    });
    mockReaddir.mockResolvedValueOnce([makeDirent('with-settings')]);
    mockReadFile.mockResolvedValueOnce(withSettings);
    const result = await listTeams(MOCK_DIR);
    expect(result[0]!.settings).toEqual({ maxConcurrent: 3, debug: true });
  });
});
