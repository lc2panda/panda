// Input: ConversationStartupError 与 buildStartupError 工厂
// Output: vitest 用例覆盖 code/retryable/instanceof/序列化
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — v2.27.0 P0-1 阶段 1 单测
import { describe, it, expect } from 'vitest';
import {
  PandaConversationStartupError,
  buildStartupError,
  isPandaConversationStartupError,
  type ConversationStartupErrorCode,
  type ConversationStartupReason,
} from '../conversation-startup-error';

describe('PandaConversationStartupError', () => {
  it('instanceof Error 且 instanceof PandaConversationStartupError', () => {
    const err = new PandaConversationStartupError(
      'PANDA_CLI_START_FAILED',
      'boom',
    );
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PandaConversationStartupError);
    expect(err.name).toBe('PandaConversationStartupError');
    expect(err.code).toBe('PANDA_CLI_START_FAILED');
    expect(err.message).toBe('boom');
    // 默认 retryable=false
    expect(err.retryable).toBe(false);
  });

  it('retryable=true 透传 + cause/context 保留', () => {
    const cause = new Error('underlying');
    const ctx = { sessionId: 'abc', exitCode: 1 };
    const err = new PandaConversationStartupError(
      'PANDA_CLI_SPAWN_FAILED',
      'spawn failed',
      { retryable: true, cause, context: ctx },
    );
    expect(err.retryable).toBe(true);
    expect(err.cause).toBe(cause);
    expect(err.context).toEqual(ctx);
  });

  it('toJSON 保留 code/retryable/message/name/context', () => {
    const err = new PandaConversationStartupError(
      'PANDA_CLI_AUTH_REQUIRED',
      'login first',
      { retryable: false, context: { sessionId: 's1' } },
    );
    const payload = err.toJSON();
    expect(payload).toEqual({
      name: 'PandaConversationStartupError',
      code: 'PANDA_CLI_AUTH_REQUIRED',
      message: 'login first',
      retryable: false,
      context: { sessionId: 's1' },
    });
    // JSON 往返不丢字段
    const roundTrip = JSON.parse(JSON.stringify(err));
    expect(roundTrip.code).toBe('PANDA_CLI_AUTH_REQUIRED');
    expect(roundTrip.retryable).toBe(false);
    expect(roundTrip.name).toBe('PandaConversationStartupError');
  });

  it('toJSON 在无 context 时省略 context 字段', () => {
    const err = new PandaConversationStartupError(
      'PANDA_CLI_START_FAILED',
      'plain',
    );
    const payload = err.toJSON();
    expect(payload).toEqual({
      name: 'PandaConversationStartupError',
      code: 'PANDA_CLI_START_FAILED',
      message: 'plain',
      retryable: false,
    });
    expect('context' in payload).toBe(false);
  });
});

describe('isPandaConversationStartupError', () => {
  it('类实例返回 true', () => {
    const err = new PandaConversationStartupError(
      'PANDA_CLI_START_FAILED',
      'x',
    );
    expect(isPandaConversationStartupError(err)).toBe(true);
  });

  it('IPC 序列化后的纯对象（同 shape）返回 true', () => {
    const plain = {
      name: 'PandaConversationStartupError',
      code: 'PANDA_CLI_AUTH_REQUIRED',
      message: '未登录',
      retryable: false,
    };
    expect(isPandaConversationStartupError(plain)).toBe(true);
  });

  it('普通 Error / null / 错误 shape 返回 false', () => {
    expect(isPandaConversationStartupError(new Error('x'))).toBe(false);
    expect(isPandaConversationStartupError(null)).toBe(false);
    expect(isPandaConversationStartupError(undefined)).toBe(false);
    expect(isPandaConversationStartupError({ name: 'Other', code: 'x', message: 'y' })).toBe(false);
    expect(isPandaConversationStartupError({ name: 'PandaConversationStartupError', code: 123, message: 'y' })).toBe(false);
  });
});

describe('buildStartupError', () => {
  type Expected = {
    code: ConversationStartupErrorCode;
    retryable: boolean;
    messageIncludes: string[];
  };

  const cases: Record<ConversationStartupReason, Expected> = {
    'auth-required': {
      code: 'PANDA_CLI_AUTH_REQUIRED',
      retryable: false,
      messageIncludes: ['未登录'],
    },
    'session-conflict': {
      code: 'PANDA_CLI_SESSION_CONFLICT',
      retryable: true,
      messageIncludes: ['已被', '占用'],
    },
    'spawn-failed': {
      code: 'PANDA_CLI_SPAWN_FAILED',
      retryable: true,
      messageIncludes: ['启动失败'],
    },
    'workdir-not-found': {
      code: 'PANDA_WORKDIR_NOT_FOUND',
      retryable: false,
      messageIncludes: ['工作目录', '未找到'],
    },
    'workdir-invalid': {
      code: 'PANDA_WORKDIR_INVALID',
      retryable: false,
      messageIncludes: ['工作目录', '不存在或不是有效目录'],
    },
    'start-failed': {
      code: 'PANDA_CLI_START_FAILED',
      retryable: true,
      messageIncludes: ['异常退出'],
    },
  };

  for (const [reason, expected] of Object.entries(cases) as [
    ConversationStartupReason,
    Expected,
  ][]) {
    it(`reason=${reason} → code=${expected.code} retryable=${expected.retryable}`, () => {
      const err = buildStartupError(reason);
      expect(err.code).toBe(expected.code);
      expect(err.retryable).toBe(expected.retryable);
      for (const needle of expected.messageIncludes) {
        expect(err.message).toContain(needle);
      }
      expect(err).toBeInstanceOf(PandaConversationStartupError);
      expect(err).toBeInstanceOf(Error);
    });
  }

  it('session-conflict 注入 sessionId 进入 message', () => {
    const err = buildStartupError('session-conflict', {
      sessionId: 'abc-123',
    });
    expect(err.message).toContain('abc-123');
    expect(err.context?.sessionId).toBe('abc-123');
  });

  it('workdir-invalid 注入 workDir 进入 message', () => {
    const err = buildStartupError('workdir-invalid', {
      workDir: '/tmp/does-not-exist',
    });
    expect(err.message).toContain('/tmp/does-not-exist');
    expect(err.context?.workDir).toBe('/tmp/does-not-exist');
  });

  it('start-failed 注入 exitCode 与 stderrTail', () => {
    const err = buildStartupError('start-failed', {
      exitCode: 137,
      stderrTail: 'OOM killed',
    });
    expect(err.message).toContain('137');
    expect(err.message).toContain('OOM killed');
    expect(err.context?.exitCode).toBe(137);
  });

  it('spawn-failed 注入 bunPath/cliPath hint', () => {
    const err = buildStartupError('spawn-failed', {
      bunPath: '/usr/local/bin/bun',
      cliPath: '/Applications/Panda.app/.../cli.js',
      detail: 'ENOENT',
    });
    expect(err.message).toContain('/usr/local/bin/bun');
    expect(err.message).toContain('ENOENT');
  });

  it('cause 通过工厂传递到实例', () => {
    const underlying = new Error('disk read failed');
    const err = buildStartupError('workdir-not-found', {
      cause: underlying,
      sessionId: 'sid',
    });
    expect(err.cause).toBe(underlying);
  });

  it('toJSON 在工厂产物上工作', () => {
    const err = buildStartupError('auth-required');
    const payload = err.toJSON();
    expect(payload.code).toBe('PANDA_CLI_AUTH_REQUIRED');
    expect(payload.retryable).toBe(false);
    expect(payload.name).toBe('PandaConversationStartupError');
  });
});
