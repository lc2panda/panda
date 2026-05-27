// Input: { cwd? } — target working directory
// Output: assertion on platform-specific execFile args + cwd sanitisation + injection defence
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — guards v2.27.1 Bug F G5 fix.
// 一旦本测试或所属目录结构发生变化，请更新此头部注释，并同步上层 README。

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoist mocks so they are defined before vi.mock factories execute ─────────
const { mockExecFileImpl } = vi.hoisted(() => {
  const mockExecFileImpl = vi.fn();
  return { mockExecFileImpl };
});

// ─── mock child_process ───────────────────────────────────────────────────────
vi.mock('node:child_process', () => ({
  execFile: mockExecFileImpl,
}));

// ─── mock node:util — make promisify(execFile) return a promise wrapper ───────
vi.mock('node:util', async () => {
  const actual = await vi.importActual<typeof import('node:util')>('node:util');
  return {
    ...actual,
    promisify:
      (fn: unknown) =>
      (...args: unknown[]) =>
        new Promise<void>((resolve, reject) => {
          (fn as (...a: unknown[]) => void)(
            ...args,
            (err: Error | null) => (err ? reject(err) : resolve()),
          );
        }),
  };
});

import { openSystemTerminal, sanitizeCwdForScript } from '../shell-launcher';

// ─── Helper: args of most recent execFile call ───────────────────────────────
const lastCall = () =>
  mockExecFileImpl.mock.calls[mockExecFileImpl.mock.calls.length - 1] as [
    string,
    string[],
    unknown,
    (e: Error | null) => void,
  ];

// ─── sanitizeCwdForScript ────────────────────────────────────────────────────
describe('sanitizeCwdForScript', () => {
  it("escapes single quotes via '\\\\'' sequence", () => {
    expect(sanitizeCwdForScript("/path/with'quote")).toBe("/path/with'\\''quote");
  });

  it('leaves normal paths unchanged', () => {
    expect(sanitizeCwdForScript('/Users/panda/Downloads/my-project')).toBe(
      '/Users/panda/Downloads/my-project',
    );
  });
});

// ─── openSystemTerminal platform dispatch ────────────────────────────────────
describe('openSystemTerminal', () => {
  const origPlatform = process.platform;

  beforeEach(() => {
    mockExecFileImpl.mockClear();
    Object.defineProperty(process, 'platform', {
      value: origPlatform,
      configurable: true,
    });
  });

  const succeed = (
    _cmd: string,
    _args: string[],
    _opts: unknown,
    cb: (e: null) => void,
  ) => cb(null);

  const fail = (msg: string) =>
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      cb: (e: Error) => void,
    ) =>
      cb(new Error(msg));

  it('macOS: calls osascript with do script containing cwd', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecFileImpl.mockImplementation(succeed);

    const result = await openSystemTerminal({ cwd: '/Users/panda/project' });
    expect(result.ok).toBe(true);

    const [cmd, args] = lastCall();
    expect(cmd).toBe('osascript');
    expect(args[0]).toBe('-e');
    expect(args[1]).toContain('do script');
    expect(args[1]).toContain('/Users/panda/project');
  });

  it('macOS: single-quote in cwd is escaped (injection defence)', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecFileImpl.mockImplementation(succeed);

    await openSystemTerminal({ cwd: "/path/with'quote" });
    const [_cmd, args] = lastCall();
    // raw unescaped single-quote must not appear inside the script string
    expect(args[1]).not.toMatch(/cd '\/path\/with'quote'/);
    expect(args[1]).toContain("'\\''");
  });

  it('Linux: calls x-terminal-emulator with --working-directory', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    mockExecFileImpl.mockImplementation(succeed);

    const result = await openSystemTerminal({ cwd: '/home/user/project' });
    expect(result.ok).toBe(true);

    const [cmd, args] = lastCall();
    expect(cmd).toBe('x-terminal-emulator');
    expect(args[0]).toContain('--working-directory=/home/user/project');
  });

  it('Linux: falls back to gnome-terminal when x-terminal-emulator fails', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

    let callCount = 0;
    mockExecFileImpl.mockImplementation(
      (_cmd: string, _args: string[], _opts: unknown, cb: (e: Error | null) => void) => {
        if (++callCount === 1) cb(new Error('not found'));
        else cb(null);
      },
    );

    const result = await openSystemTerminal({ cwd: '/home/user' });
    expect(result.ok).toBe(true);
    expect(mockExecFileImpl.mock.calls[mockExecFileImpl.mock.calls.length - 1][0]).toBe(
      'gnome-terminal',
    );
  });

  it('Windows: calls cmd.exe /c start cmd.exe /k', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    mockExecFileImpl.mockImplementation(succeed);

    const result = await openSystemTerminal({ cwd: 'C:\\Users\\panda\\project' });
    expect(result.ok).toBe(true);

    const [cmd, args] = lastCall();
    expect(cmd).toBe('cmd.exe');
    expect(args).toContain('/c');
    expect(args).toContain('start');
    expect(args).toContain('cmd.exe');
    expect(args).toContain('/k');
  });

  it('unsupported platform: returns ok=false + error=unsupported-platform', async () => {
    Object.defineProperty(process, 'platform', { value: 'freebsd', configurable: true });

    const result = await openSystemTerminal({ cwd: '/home/user' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('unsupported-platform');
  });

  it('propagates execFile error as ok=false + error message', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecFileImpl.mockImplementation(fail('osascript not available'));

    const result = await openSystemTerminal({ cwd: '/some/path' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('osascript not available');
  });

  it('uses HOME env as cwd fallback when no cwd provided', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    mockExecFileImpl.mockImplementation(succeed);
    const origHome = process.env.HOME;
    process.env.HOME = '/Users/testuser';

    await openSystemTerminal({});
    const [_cmd, args] = lastCall();
    expect(args[1]).toContain('/Users/testuser');

    process.env.HOME = origHome;
  });
});
