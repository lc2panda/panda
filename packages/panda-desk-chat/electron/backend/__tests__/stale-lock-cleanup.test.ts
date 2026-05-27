// Input: 无（纯单元测试）
// Output: vitest 断言 clearStaleLocks() 正确删除死 PID 文件、保留活 PID 文件、跳过损坏 JSON
// Pos: v2.27.1 stale-lock-cleanup — PID 探活与文件删除的契约保证
//
// 一旦本测试或所属目录结构发生变化，请更新此头部注释，并同步上层 README。

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock node:fs ──────────────────────────────────────────────────────────
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

// ─── Mock node:os ──────────────────────────────────────────────────────────
vi.mock('node:os', () => ({
  homedir: () => '/home/testuser',
}));

import * as fs from 'node:fs';
import { clearStaleLocks } from '../stale-lock-cleanup';

// Convenience typed mocks
const mockExistsSync = vi.mocked(fs.existsSync);
const mockReaddirSync = vi.mocked(fs.readdirSync);
const mockReadFileSync = vi.mocked(fs.readFileSync);
const mockUnlinkSync = vi.mocked(fs.unlinkSync);

// Capture original process.kill, then restore after each test
const originalKill = process.kill.bind(process);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: sessions dir exists
  mockExistsSync.mockReturnValue(true);
  mockUnlinkSync.mockImplementation(() => undefined);
  // Restore env override
  delete process.env.PANDA_CONFIG_DIR;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('clearStaleLocks — 目录不存在', () => {
  it('sessions 目录不存在时返回空 cleared 列表，不抛错', async () => {
    mockExistsSync.mockReturnValue(false);
    const result = await clearStaleLocks('/tmp/fake-config');
    expect(result.cleared).toEqual([]);
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });
});

describe('clearStaleLocks — 死 PID 文件删除', () => {
  it('PID 已死时删除对应 .json 文件并返回路径', async () => {
    mockReaddirSync.mockReturnValue(['1234.json'] as unknown as ReturnType<typeof fs.readdirSync>);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ pid: 1234, sessionId: 'aaa', kind: 'interactive' }),
    );
    // 模拟 process.kill(1234, 0) 抛 ESRCH（进程不存在）
    vi.spyOn(process, 'kill').mockImplementation((pid) => {
      if (pid === 1234) {
        const err: NodeJS.ErrnoException = new Error('ESRCH');
        err.code = 'ESRCH';
        throw err;
      }
      return true;
    });

    const result = await clearStaleLocks('/tmp/config');
    expect(result.cleared).toHaveLength(1);
    expect(result.cleared[0]).toMatch(/1234\.json$/);
    expect(mockUnlinkSync).toHaveBeenCalledOnce();
  });
});

describe('clearStaleLocks — 活 PID 文件保留', () => {
  it('PID 存活时不删除文件', async () => {
    mockReaddirSync.mockReturnValue(['5678.json'] as unknown as ReturnType<typeof fs.readdirSync>);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ pid: 5678, sessionId: 'bbb', kind: 'interactive' }),
    );
    // 模拟 process.kill(5678, 0) 正常返回（进程存活）
    vi.spyOn(process, 'kill').mockImplementation(() => true);

    const result = await clearStaleLocks('/tmp/config');
    expect(result.cleared).toEqual([]);
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });

  it('EPERM 视为进程存活，不删除文件', async () => {
    mockReaddirSync.mockReturnValue(['9999.json'] as unknown as ReturnType<typeof fs.readdirSync>);
    mockReadFileSync.mockReturnValue(JSON.stringify({ pid: 9999, sessionId: 'ccc', kind: 'bg' }));
    vi.spyOn(process, 'kill').mockImplementation(() => {
      const err: NodeJS.ErrnoException = new Error('EPERM');
      err.code = 'EPERM';
      throw err;
    });

    const result = await clearStaleLocks('/tmp/config');
    expect(result.cleared).toEqual([]);
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });
});

describe('clearStaleLocks — 损坏 JSON 跳过', () => {
  it('JSON 解析失败时跳过该文件，不抛错', async () => {
    mockReaddirSync.mockReturnValue(['bad.json'] as unknown as ReturnType<typeof fs.readdirSync>);
    mockReadFileSync.mockReturnValue('{ not valid json !!');

    const result = await clearStaleLocks('/tmp/config');
    expect(result.cleared).toEqual([]);
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });

  it('pid 字段缺失时跳过该文件', async () => {
    mockReaddirSync.mockReturnValue(['nopid.json'] as unknown as ReturnType<typeof fs.readdirSync>);
    mockReadFileSync.mockReturnValue(JSON.stringify({ sessionId: 'xyz', kind: 'interactive' }));

    const result = await clearStaleLocks('/tmp/config');
    expect(result.cleared).toEqual([]);
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });
});

describe('clearStaleLocks — 非 .json 文件被忽略', () => {
  it('非 <number>.json 文件名被跳过', async () => {
    mockReaddirSync.mockReturnValue([
      'README.md',
      'meta.json',
      '.gitkeep',
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const result = await clearStaleLocks('/tmp/config');
    expect(result.cleared).toEqual([]);
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });
});

describe('clearStaleLocks — PANDA_CONFIG_DIR env 覆盖', () => {
  it('优先使用 PANDA_CONFIG_DIR 作为 base', async () => {
    process.env.PANDA_CONFIG_DIR = '/custom/panda-config';
    // 目录不存在时快速返回，只验证路径包含自定义前缀（existsSync 被调用时 path 以该目录开头）
    mockExistsSync.mockImplementation((p) => {
      expect(String(p)).toContain('/custom/panda-config');
      return false;
    });

    const result = await clearStaleLocks();
    expect(result.cleared).toEqual([]);
  });
});
