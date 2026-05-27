// Input: McpServerConfig (stdio | sse | http) with mock execFile + fs
// Output: vitest assertions covering all 6 preflight scenarios
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — v2.27.1 mcpHostPreflight

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  stat: vi.fn(),
}));

import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { preflightMcpServer } from '../mcp-preflight';

const mockExecFile = execFile as unknown as ReturnType<typeof vi.fn>;
const mockStat     = stat     as unknown as ReturnType<typeof vi.fn>;

// ─── Test suites ─────────────────────────────────────────────────────────────

describe('preflightMcpServer — stdio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('command in PATH → ok=true, check name=command_in_path', async () => {
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
        cb(null, '/usr/local/bin/uvx', '');
      },
    );

    const result = await preflightMcpServer({ type: 'stdio', command: 'uvx' });

    expect(result.ok).toBe(true);
    const check = result.checks.find((c) => c.name === 'command_in_path');
    expect(check).toBeDefined();
    expect(check!.ok).toBe(true);
    expect(check!.level).toBe('error');
  });

  it('command not found (ENOENT) → ok=false + detail', async () => {
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
        const err = Object.assign(new Error('which: no missing-cmd in PATH'), { code: 'ENOENT' });
        cb(err, '', '');
      },
    );

    const result = await preflightMcpServer({ type: 'stdio', command: 'missing-cmd' });

    expect(result.ok).toBe(false);
    const check = result.checks.find((c) => c.name === 'command_in_path');
    expect(check!.ok).toBe(false);
    expect(check!.detail).toContain('missing-cmd');
  });

  it('cwd 不存在 → ok=false, check name=cwd_valid', async () => {
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
        cb(null, '/usr/bin/node', '');
      },
    );
    mockStat.mockRejectedValue(
      Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
    );

    const result = await preflightMcpServer({
      type: 'stdio',
      command: 'node',
      cwd: '/nonexistent/path',
    });

    expect(result.ok).toBe(false);
    const cwdCheck = result.checks.find((c) => c.name === 'cwd_valid');
    expect(cwdCheck!.ok).toBe(false);
    expect(cwdCheck!.level).toBe('error');
  });

  it('env 值为空字符串 → ok=false, check name=env_vars', async () => {
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
        cb(null, '/usr/bin/node', '');
      },
    );

    const result = await preflightMcpServer({
      type: 'stdio',
      command: 'node',
      env: { API_KEY: '', SECRET: 'ok' },
    });

    expect(result.ok).toBe(false);
    const envCheck = result.checks.find((c) => c.name === 'env_vars');
    expect(envCheck!.ok).toBe(false);
    expect(envCheck!.detail).toContain('API_KEY');
  });
});

describe('preflightMcpServer — sse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock if any
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  it('合法 url → url_format ok=true', async () => {
    const result = await preflightMcpServer({
      type: 'sse',
      url: 'http://localhost:3000/sse',
    });

    const urlCheck = result.checks.find((c) => c.name === 'url_format');
    expect(urlCheck!.ok).toBe(true);
    expect(urlCheck!.level).toBe('error');
  });

  it('非法 url → ok=false', async () => {
    const result = await preflightMcpServer({
      type: 'sse',
      url: 'not-a-url',
    });

    expect(result.ok).toBe(false);
    const urlCheck = result.checks.find((c) => c.name === 'url_format');
    expect(urlCheck!.ok).toBe(false);
  });
});

describe('preflightMcpServer — http', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('http 不可达 → ok=true (warning 级，不阻塞)', async () => {
    // fetch 抛出网络错误
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    );

    const result = await preflightMcpServer({
      type: 'http',
      url: 'http://localhost:9999/unreachable',
    });

    // url_format ok, url_reachable warning but ok=true → overall ok
    expect(result.ok).toBe(true);
    const reachCheck = result.checks.find((c) => c.name === 'url_reachable');
    expect(reachCheck!.ok).toBe(true);      // warning 级不阻塞
    expect(reachCheck!.level).toBe('warning');
    expect(reachCheck!.detail).toContain('warning');
  });
});
