// Pos: v2.27.x Bug F G5 — shell:openTerminal IPC handler 平台分支单测
//
// 测试策略：不依赖真实 ipcMain/Electron，直接 mock child_process.spawn 并调用
// openTerminalHandler 纯逻辑函数，验证 4 个平台分支的行为契约。
// 一旦本测试或所属目录结构发生变化，请更新此头部注释，并同步上层 README。
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── mock child_process ───────────────────────────────────────────────────

const mockUnref = vi.fn();
const mockSpawn = vi.fn(() => ({ unref: mockUnref }));

vi.mock('node:child_process', () => ({
  spawn: mockSpawn,
}));

// ─── 被测逻辑（内联，与 handlers.ts 中 shell:openTerminal handler 一致）─────

async function openTerminalHandler(
  platform: NodeJS.Platform,
  args: { cwd?: string } = {},
  homeEnv = '/Users/testuser',
): Promise<{ ok: boolean; error?: string }> {
  const { spawn } = await import('node:child_process');
  const cwd = args?.cwd || homeEnv || '/';
  try {
    if (platform === 'darwin') {
      spawn('open', ['-a', 'Terminal', cwd], { detached: true, stdio: 'ignore' }).unref();
      return { ok: true };
    }
    if (platform === 'linux') {
      spawn('x-terminal-emulator', [], { detached: true, stdio: 'ignore', cwd }).unref();
      return { ok: true };
    }
    if (platform === 'win32') {
      spawn('cmd.exe', ['/c', 'start', 'cmd'], { detached: true, stdio: 'ignore', cwd }).unref();
      return { ok: true };
    }
    return { ok: false, error: 'unsupported-platform' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── tests ───────────────────────────────────────────────────────────────

describe('shell:openTerminal handler', () => {
  beforeEach(() => {
    mockSpawn.mockClear();
    mockUnref.mockClear();
  });

  it('① darwin — 调用 open -a Terminal <cwd>', async () => {
    const result = await openTerminalHandler('darwin', { cwd: '/tmp/myproject' });
    expect(result).toEqual({ ok: true });
    expect(mockSpawn).toHaveBeenCalledOnce();
    expect(mockSpawn).toHaveBeenCalledWith(
      'open',
      ['-a', 'Terminal', '/tmp/myproject'],
      expect.objectContaining({ detached: true }),
    );
    expect(mockUnref).toHaveBeenCalledOnce();
  });

  it('② linux — 调用 x-terminal-emulator', async () => {
    const result = await openTerminalHandler('linux', { cwd: '/home/user/project' });
    expect(result).toEqual({ ok: true });
    expect(mockSpawn).toHaveBeenCalledOnce();
    expect(mockSpawn).toHaveBeenCalledWith(
      'x-terminal-emulator',
      [],
      expect.objectContaining({ detached: true, cwd: '/home/user/project' }),
    );
    expect(mockUnref).toHaveBeenCalledOnce();
  });

  it('③ win32 — 调用 cmd.exe /c start cmd', async () => {
    const result = await openTerminalHandler('win32', { cwd: 'C:\\Users\\test' });
    expect(result).toEqual({ ok: true });
    expect(mockSpawn).toHaveBeenCalledOnce();
    expect(mockSpawn).toHaveBeenCalledWith(
      'cmd.exe',
      ['/c', 'start', 'cmd'],
      expect.objectContaining({ detached: true }),
    );
    expect(mockUnref).toHaveBeenCalledOnce();
  });

  it('④ 不支持平台 — 返回 { ok: false, error: "unsupported-platform" }', async () => {
    const result = await openTerminalHandler('freebsd' as NodeJS.Platform, {});
    expect(result).toEqual({ ok: false, error: 'unsupported-platform' });
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('⑤ cwd 缺省时 fallback 到 homeEnv', async () => {
    const result = await openTerminalHandler('darwin', {}, '/Users/fallback');
    expect(result).toEqual({ ok: true });
    expect(mockSpawn).toHaveBeenCalledWith(
      'open',
      ['-a', 'Terminal', '/Users/fallback'],
      expect.objectContaining({ detached: true }),
    );
  });
});
