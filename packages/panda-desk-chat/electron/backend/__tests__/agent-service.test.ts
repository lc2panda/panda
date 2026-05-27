// Input: mocked node:fs/promises — listAgents / getAgent / createAgent / updateAgent / deleteAgent
// Output: vitest 用例覆盖 agent-service.ts 全 CRUD 路径
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — v2.27.1 agentService 单测

import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';

// ─── mock node:fs/promises ────────────────────────────────────────────────────
const mockReaddir = vi.fn();
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();
const mockAccess = vi.fn();
const mockUnlink = vi.fn();

vi.mock('node:fs/promises', () => ({
  default: {
    readdir: (...args: unknown[]) => mockReaddir(...args),
    readFile: (...args: unknown[]) => mockReadFile(...args),
    writeFile: (...args: unknown[]) => mockWriteFile(...args),
    mkdir: (...args: unknown[]) => mockMkdir(...args),
    access: (...args: unknown[]) => mockAccess(...args),
    unlink: (...args: unknown[]) => mockUnlink(...args),
  },
}));

import {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
} from '../agent-service';

const MOCK_DIR = '/tmp/test-agents';

const SAMPLE_MD = `---
name: my-agent
description: "Test agent"
model: fast
tools:
  - Read
  - Write
maxTurns: 5
---

You are a test agent.
`;

function makeDirent(name: string, isFile = true) {
  return { name, isFile: () => isFile, isDirectory: () => !isFile } as import('node:fs').Dirent;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMkdir.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
  mockUnlink.mockResolvedValue(undefined);
});

// ─── listAgents ───────────────────────────────────────────────────────────────
describe('agent-service.listAgents', () => {
  it('returns empty array when dir does not exist', async () => {
    mockReaddir.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await listAgents(MOCK_DIR);
    expect(result).toEqual([]);
  });

  it('parses .md files and returns AgentRecord[]', async () => {
    mockReaddir.mockResolvedValueOnce([makeDirent('my-agent.md')]);
    mockReadFile.mockResolvedValueOnce(SAMPLE_MD);
    const result = await listAgents(MOCK_DIR);
    expect(result).toHaveLength(1);
    const rec = result[0]!;
    expect(rec.id).toBe('my-agent');
    expect(rec.name).toBe('my-agent');
    expect(rec.description).toBe('Test agent');
    expect(rec.model).toBe('fast');
    expect(rec.tools).toEqual(['Read', 'Write']);
    expect(rec.maxTurns).toBe(5);
    expect(rec.systemPrompt).toBe('You are a test agent.');
  });

  it('skips non .md/.yaml/.yml files', async () => {
    mockReaddir.mockResolvedValueOnce([
      makeDirent('notes.txt'),
      makeDirent('agent.md'),
    ]);
    mockReadFile.mockResolvedValueOnce(SAMPLE_MD);
    const result = await listAgents(MOCK_DIR);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('agent');
  });

  it('skips unreadable files gracefully', async () => {
    mockReaddir.mockResolvedValueOnce([
      makeDirent('bad.md'),
      makeDirent('good.md'),
    ]);
    mockReadFile
      .mockRejectedValueOnce(new Error('EPERM'))
      .mockResolvedValueOnce(SAMPLE_MD);
    const result = await listAgents(MOCK_DIR);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('good');
  });

  it('accepts .yaml extension', async () => {
    const yamlContent = `---\nname: yaml-agent\ndescription: yaml\nmodel: balanced\n---\n\nHello.\n`;
    mockReaddir.mockResolvedValueOnce([makeDirent('yaml-agent.yaml')]);
    mockReadFile.mockResolvedValueOnce(yamlContent);
    const result = await listAgents(MOCK_DIR);
    expect(result[0]!.id).toBe('yaml-agent');
    expect(result[0]!.model).toBe('balanced');
  });
});

// ─── getAgent ─────────────────────────────────────────────────────────────────
describe('agent-service.getAgent', () => {
  it('returns null when not found in any ext', async () => {
    mockAccess.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await getAgent('missing', MOCK_DIR);
    expect(result).toBeNull();
  });

  it('reads .md file by id stem', async () => {
    // .md IS the first extension tried and should be found
    mockReadFile.mockResolvedValueOnce(SAMPLE_MD);
    const result = await getAgent('my-agent', MOCK_DIR);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('my-agent');
    expect(result!.name).toBe('my-agent');
  });

  it('falls back to .yaml when .md missing', async () => {
    const yamlContent = `---\nname: yaml-agent\n---\n\nHello.\n`;
    mockReadFile
      .mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })) // .md missing
      .mockResolvedValueOnce(yamlContent); // .yaml found
    const result = await getAgent('yaml-agent', MOCK_DIR);
    expect(result!.id).toBe('yaml-agent');
  });
});

// ─── createAgent ──────────────────────────────────────────────────────────────
describe('agent-service.createAgent', () => {
  beforeEach(() => {
    // ENOENT for conflict detection (no existing file)
    mockAccess.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
  });

  it('creates .md file with frontmatter', async () => {
    const result = await createAgent(
      { id: 'new-agent', name: 'New Agent', description: 'desc', model: 'fast', tools: ['Read'], maxTurns: 3 },
      MOCK_DIR,
    );
    expect(result.id).toBe('new-agent');
    expect(result.name).toBe('New Agent');
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [, content] = mockWriteFile.mock.calls[0]! as [string, string, string];
    expect(content).toContain('name: "New Agent"');
    expect(content).toContain('model: fast');
    expect(content).toContain('- Read');
    expect(content).toContain('maxTurns: 3');
  });

  it('auto-generates UUID id when not provided', async () => {
    const result = await createAgent({ name: 'Auto', description: '' }, MOCK_DIR);
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('throws when agent id already exists', async () => {
    // access resolves (file exists)
    mockAccess.mockResolvedValueOnce(undefined);
    await expect(createAgent({ id: 'dup', name: 'Dup' }, MOCK_DIR)).rejects.toThrow('already exists');
  });
});

// ─── updateAgent ──────────────────────────────────────────────────────────────
describe('agent-service.updateAgent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('merges partial fields and writes', async () => {
    // getAgent tries .md first — mock that read to succeed
    mockReadFile.mockResolvedValueOnce(SAMPLE_MD);
    const result = await updateAgent('my-agent', { description: 'Updated', tools: ['Bash'] }, MOCK_DIR);
    expect(result.description).toBe('Updated');
    expect(result.tools).toEqual(['Bash']);
    expect(result.name).toBe('my-agent'); // unchanged
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it('throws when agent not found', async () => {
    // All three extensions missing
    mockReadFile
      .mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
      .mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
      .mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    await expect(updateAgent('missing', { name: 'X' }, MOCK_DIR)).rejects.toThrow('not found');
  });
});

// ─── deleteAgent ──────────────────────────────────────────────────────────────
describe('agent-service.deleteAgent', () => {
  it('returns ok:true after deleting .md file', async () => {
    mockUnlink.mockResolvedValueOnce(undefined); // .md deleted
    const result = await deleteAgent('my-agent', MOCK_DIR);
    expect(result.ok).toBe(true);
  });

  it('returns ok:false when file not found', async () => {
    mockUnlink.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    const result = await deleteAgent('missing', MOCK_DIR);
    expect(result.ok).toBe(false);
  });

  it('re-throws unexpected errors', async () => {
    mockUnlink.mockRejectedValueOnce(Object.assign(new Error('EPERM'), { code: 'EPERM' }));
    await expect(deleteAgent('locked', MOCK_DIR)).rejects.toThrow('EPERM');
  });
});

// ─── parseFM edge cases (via listAgents) ─────────────────────────────────────
describe('agent-service frontmatter edge cases', () => {
  it('handles file with no frontmatter', async () => {
    mockReaddir.mockResolvedValueOnce([makeDirent('bare.md')]);
    mockReadFile.mockResolvedValueOnce('Just plain text, no frontmatter.');
    const result = await listAgents(MOCK_DIR);
    expect(result[0]!.id).toBe('bare');
    expect(result[0]!.name).toBe('bare'); // falls back to stem
    expect(result[0]!.systemPrompt).toBe('Just plain text, no frontmatter.');
  });

  it('handles empty tools list', async () => {
    const noTools = `---\nname: no-tools\nmodel: fast\n---\n\nHello.\n`;
    mockReaddir.mockResolvedValueOnce([makeDirent('no-tools.md')]);
    mockReadFile.mockResolvedValueOnce(noTools);
    const result = await listAgents(MOCK_DIR);
    expect(result[0]!.tools).toEqual([]);
  });

  it('returns sorted by name', async () => {
    const md1 = `---\nname: Zebra\n---\n\n`;
    const md2 = `---\nname: Alpha\n---\n\n`;
    mockReaddir.mockResolvedValueOnce([makeDirent('zebra.md'), makeDirent('alpha.md')]);
    mockReadFile
      .mockResolvedValueOnce(md1)
      .mockResolvedValueOnce(md2);
    const result = await listAgents(MOCK_DIR);
    expect(result[0]!.name).toBe('Alpha');
    expect(result[1]!.name).toBe('Zebra');
  });

  it('resolves path using provided dir', async () => {
    mockReaddir.mockResolvedValueOnce([makeDirent('agent.md')]);
    mockReadFile.mockResolvedValueOnce(SAMPLE_MD);
    const result = await listAgents('/custom/dir');
    expect(result[0]!.path).toBe(path.join('/custom/dir', 'agent.md'));
  });
});
