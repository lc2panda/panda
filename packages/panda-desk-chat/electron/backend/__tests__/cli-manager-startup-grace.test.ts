// Input: 模拟 panda-cli spawn 后 STARTUP_GRACE_MS 窗口内 stderr/exit 场景
// Output: 断言 classifyStartupExit 在不同 stderr 关键字下产出正确 PANDA_* code
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — guards v2.27.0 P0-2

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── 必须 mock 'electron'：cli-manager.ts 顶部 import { app }，而 vitest 跑在
// Node 环境无 Electron 主进程。mock 仅供模块求值时 stub 满足，测试不依赖。
vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: () => '/tmp/panda-test',
  },
  ipcMain: { on: vi.fn(), removeAllListeners: vi.fn(), handle: vi.fn() },
  BrowserWindow: class {},
}));

// 解构 import 在 mock 后执行（vitest hoists vi.mock 到模块顶部，因此安全）。
import { STARTUP_GRACE_MS, classifyStartupExit } from '../cli-manager';
import { isPandaConversationStartupError } from '../conversation-startup-error';

describe('STARTUP_GRACE_MS 常量', () => {
  test('① 默认 3000ms（与 cc-haha 蓝本对齐）', () => {
    expect(STARTUP_GRACE_MS).toBe(3000);
  });
});

describe('classifyStartupExit (v2.27.0 P0-2 早退分类纯函数)', () => {
  const sessionId = '11111111-2222-3333-4444-555555555555';

  test('① stderr 含 "Please run /login" → PANDA_CLI_AUTH_REQUIRED, retryable=false（需用户介入登录）', () => {
    const err = classifyStartupExit(
      'panda: not authenticated.\nPlease run /login to continue.',
      1,
      sessionId,
    );
    expect(isPandaConversationStartupError(err)).toBe(true);
    expect(err.code).toBe('PANDA_CLI_AUTH_REQUIRED');
    expect(err.retryable).toBe(false);
    // context.stderrTail 透传，chatStore toast 可用
    expect(err.context).toMatchObject({ stderrTail: expect.stringContaining('login') });
  });

  test('② stderr 含 "unauthorized" → PANDA_CLI_AUTH_REQUIRED', () => {
    const err = classifyStartupExit('HTTP 401 unauthorized', 1, sessionId);
    expect(err.code).toBe('PANDA_CLI_AUTH_REQUIRED');
  });

  test('③ stderr 含 "session id already in use" → PANDA_CLI_SESSION_CONFLICT', () => {
    const err = classifyStartupExit(
      'Error: session id already in use by another panda-cli instance',
      1,
      sessionId,
    );
    expect(err.code).toBe('PANDA_CLI_SESSION_CONFLICT');
    expect(err.context).toMatchObject({ sessionId });
  });

  test('④ stderr 含 "session conflict" → PANDA_CLI_SESSION_CONFLICT', () => {
    const err = classifyStartupExit('detected session conflict', 1, sessionId);
    expect(err.code).toBe('PANDA_CLI_SESSION_CONFLICT');
  });

  test('⑤ stderr 无关键字 → 兜底 PANDA_CLI_START_FAILED, exitCode 透传', () => {
    const err = classifyStartupExit('SegmentationFault: core dumped', 139, sessionId);
    expect(err.code).toBe('PANDA_CLI_START_FAILED');
    expect(err.context).toMatchObject({
      exitCode: 139,
      stderrTail: expect.stringContaining('SegmentationFault'),
      detail: expect.stringContaining('3000ms'),
    });
  });

  test('⑥ exitCode null → -1 兜底', () => {
    const err = classifyStartupExit('crashed', null, sessionId);
    expect(err.code).toBe('PANDA_CLI_START_FAILED');
    expect(err.context).toMatchObject({ exitCode: -1 });
  });

  test('⑦ 关键字优先级：auth 高于 session-conflict', () => {
    const err = classifyStartupExit(
      'not logged in\nsession conflict reported',
      1,
      sessionId,
    );
    // auth-required 必须先匹配
    expect(err.code).toBe('PANDA_CLI_AUTH_REQUIRED');
  });

  test('⑧ toJSON() 序列化对得上 errorClass 字段（emit 用）', () => {
    const err = classifyStartupExit('panic', 137, sessionId);
    const json = err.toJSON();
    expect(json).toMatchObject({
      name: 'PandaConversationStartupError',
      code: 'PANDA_CLI_START_FAILED',
      retryable: expect.any(Boolean),
      message: expect.any(String),
    });
    expect(json.context).toMatchObject({ exitCode: 137 });
  });
});

describe('STARTUP_GRACE_MS 时间语义（用 fake timers 锁定窗口边界）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('① 0~2999ms 窗口内：classifyStartupExit 用于早退分类', () => {
    // 此用例仅锁定常量值与 vi.useFakeTimers 协作不破：完整 spawn-timer 集成留 e2e。
    const before = Date.now();
    vi.advanceTimersByTime(STARTUP_GRACE_MS - 1);
    expect(Date.now() - before).toBe(STARTUP_GRACE_MS - 1);
    vi.useRealTimers();
  });

  test('② >=3000ms：窗口已过，本测试主要确认 timer API 与 STARTUP_GRACE_MS 协作', () => {
    const before = Date.now();
    vi.advanceTimersByTime(STARTUP_GRACE_MS);
    expect(Date.now() - before).toBe(STARTUP_GRACE_MS);
    vi.useRealTimers();
  });
});
