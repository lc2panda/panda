// Input: cwd 参数 ('', '/nonexistent/path', file-path, valid-dir)
// Output: createSession 空 cwd fallback HOME + WORKDIR_NOT_FOUND/WORKDIR_INVALID 抛错
// Pos: v2.27.3 Bug I — cli-manager.createSession 空 cwd ENOENT 修复单测

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ---------- mock electron before any import that touches it ----------
vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => {
      if (name === 'home') return '/mock/home';
      if (name === 'logs') return '/mock/logs';
      return '/mock/' + name;
    },
    isPackaged: false,
    getName: () => 'Panda',
    getVersion: () => '0.3.2',
    on: vi.fn(),
    once: vi.fn(),
  },
  BrowserWindow: { getAllWindows: () => [] },
}));

import { CLIManager } from '../cli-manager';

// ---------- helper: real temp dir ----------
function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'panda-create-session-cwd-'));
}

describe('CLIManager.createSession — cwd guard (Bug I v2.27.3)', () => {
  let manager: CLIManager;
  let tmpDir: string;
  // Capture the cwd actually passed to createSessionWithId
  let capturedCwd: string | undefined;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    manager = new CLIManager();

    capturedCwd = undefined;

    // Stub the heavy createSessionWithId on the prototype so we never spawn
    ;(CLIManager.prototype as any).__orig_createSessionWithId =
      (CLIManager.prototype as any).createSessionWithId;
    ;(manager as any).createSessionWithId = async (
      id: string,
      cwd: string,
      name?: string,
    ) => {
      capturedCwd = cwd;
      return { id, cwd, name: name ?? null, status: 'idle' };
    };

    // Silence console.log output from the guard branch
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    vi.restoreAllMocks();
  });

  // ① 空 cwd → fallback HOME，不抛错，createSessionWithId 收到 HOME 路径
  test('① empty cwd "" → fallback to HOME, no throw', async () => {
    const result = await (manager as any).createSession('', 'new-tab');
    const expectedHome = process.env.HOME ?? '/mock/home';
    expect(capturedCwd).toBe(expectedHome);
    expect(result.cwd).toBe(expectedHome);
  });

  // ② 不存在路径 → 抛 WORKDIR_NOT_FOUND
  test('② non-existent path → throws WORKDIR_NOT_FOUND', async () => {
    const badPath = path.join(tmpDir, 'does-not-exist', 'sub');
    await expect(
      (manager as any).createSession(badPath, 'new-tab'),
    ).rejects.toMatchObject({ code: 'WORKDIR_NOT_FOUND' });
  });

  // ③ 路径是文件（非目录）→ 抛 WORKDIR_INVALID
  test('③ file path (not a directory) → throws WORKDIR_INVALID', async () => {
    const filePath = path.join(tmpDir, 'regular-file.txt');
    fs.writeFileSync(filePath, 'hello');
    await expect(
      (manager as any).createSession(filePath, 'new-tab'),
    ).rejects.toMatchObject({ code: 'WORKDIR_INVALID' });
  });

  // ④ 合法目录 → 正常透传，无修改
  test('④ valid directory → passes through unchanged', async () => {
    const result = await (manager as any).createSession(tmpDir, 'new-tab');
    expect(capturedCwd).toBe(tmpDir);
    expect(result.cwd).toBe(tmpDir);
  });
});
