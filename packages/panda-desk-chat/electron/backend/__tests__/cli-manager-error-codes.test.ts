// Input: 无（纯契约测试）
// Output: vitest 断言 ConversationStartupError.toJSON() 序列化结构匹配 CLIStreamErrorPayload.errorClass
// Pos: v2.27.0 P0-1 阶段 2 — typed Error 工厂与 IPC payload 字段的契约保证
//
// 一旦本测试或所属目录结构发生变化，请更新此头部注释，并同步上层 README。
//
// 设计原则：不 mock cli-manager 真实 spawn / fs / IPC，只验证 buildStartupError(...)
// 返回的 ConversationStartupError 实例 toJSON() 与 isPandaConversationStartupError
// 守卫行为，确保 emitStreamError 注入 payload.errorClass 时字段名 / 类型 / retryable
// 取值与 types.ts CLIStreamErrorPayload 声明一致，向后兼容旧 code 字符串。
import { describe, it, expect } from 'vitest';
import {
  buildStartupError,
  isPandaConversationStartupError,
} from '../conversation-startup-error';
import type { CLIStreamErrorPayload } from '../types';

describe('CLIStreamErrorPayload errorClass 契约', () => {
  it('PANDA_WORKDIR_NOT_FOUND 序列化字段齐备', () => {
    const err = buildStartupError('workdir-not-found', { sessionId: 'sid-1' });
    const json = err.toJSON();

    expect(json.name).toBe('PandaConversationStartupError');
    expect(json.code).toBe('PANDA_WORKDIR_NOT_FOUND');
    expect(json.retryable).toBe(false);
    expect(typeof json.message).toBe('string');
    expect(json.message.length).toBeGreaterThan(0);

    const ctx = json.context as { sessionId?: string } | undefined;
    expect(ctx?.sessionId).toBe('sid-1');

    // 模拟 emitStreamError 注入 payload — 字段名 / 形状必须与 types.ts 一致
    const payload: CLIStreamErrorPayload = {
      sessionId: 'sid-1',
      messageId: 'mid-1',
      error: err.message,
      reason: 'cli-error',
      code: err.code,
      errorClass: json,
    };
    expect(payload.code).toBe('PANDA_WORKDIR_NOT_FOUND');
    expect(payload.errorClass?.code).toBe('PANDA_WORKDIR_NOT_FOUND');
    expect(payload.errorClass?.name).toBe('PandaConversationStartupError');
  });

  it('PANDA_CLI_SESSION_CONFLICT 带 sessionId 与 retryable=true', () => {
    // ConversationStartupErrorContext 当前仅持有 sessionId / workDir / exitCode /
    // signal / stderrTail / cliPath / bunPath / detail / cause 字段，没有
    // occupiedByPid（前任 worker 草稿写了 occupiedByPid，但实际 c6adeef 的 context
    // 定义不含此字段；占用 pid 信息可走 detail 字符串透传）。
    const err = buildStartupError('session-conflict', {
      sessionId: 'sid-2',
      detail: 'occupied by pid 12345',
    });
    const json = err.toJSON();

    expect(json.code).toBe('PANDA_CLI_SESSION_CONFLICT');
    expect(json.retryable).toBe(true);

    const ctx = json.context as { detail?: string; sessionId?: string };
    expect(ctx.detail).toBe('occupied by pid 12345');
    expect(ctx.sessionId).toBe('sid-2');
  });

  it('PANDA_CLI_AUTH_REQUIRED 实际 retryable=false（认证缺失需用户介入）', () => {
    const err = buildStartupError('auth-required', {
      stderrTail: 'Please run /login',
    });
    const json = err.toJSON();

    // 现实约束：认证缺失不可自动重试，需要 Comdr 手动 /login。
    // 与前任 worker spec 草稿中 retryable=true 的注释不同——以 c6adeef 实现为准。
    expect(json.retryable).toBe(false);
    expect(json.code).toBe('PANDA_CLI_AUTH_REQUIRED');

    const ctx = json.context as { stderrTail?: string };
    expect(ctx.stderrTail).toBe('Please run /login');
  });

  it('PANDA_CLI_SPAWN_FAILED context.detail/bunPath/cliPath 透传', () => {
    const err = buildStartupError('spawn-failed', {
      bunPath: '/usr/local/bin/bun',
      cliPath: '/x/cli.js',
      detail: 'ENOENT',
    });
    const json = err.toJSON();

    expect(json.code).toBe('PANDA_CLI_SPAWN_FAILED');
    expect(json.retryable).toBe(true);

    const ctx = json.context as {
      bunPath?: string;
      cliPath?: string;
      detail?: string;
    };
    expect(ctx.detail).toBe('ENOENT');
    expect(ctx.bunPath).toBe('/usr/local/bin/bun');
    expect(ctx.cliPath).toBe('/x/cli.js');
  });

  it('PANDA_CLI_START_FAILED context.exitCode/stderrTail 透传', () => {
    const err = buildStartupError('start-failed', {
      exitCode: 1,
      stderrTail: 'err output',
      detail: 'early exit',
    });
    const json = err.toJSON();

    expect(json.code).toBe('PANDA_CLI_START_FAILED');
    expect(json.retryable).toBe(true);

    const ctx = json.context as {
      exitCode?: number;
      stderrTail?: string;
      detail?: string;
    };
    expect(ctx.exitCode).toBe(1);
    expect(ctx.stderrTail).toBe('err output');
    expect(ctx.detail).toBe('early exit');
  });

  it('isPandaConversationStartupError 类型守卫拒绝普通 Error', () => {
    const err = buildStartupError('workdir-invalid', {
      sessionId: 'sid-x',
      workDir: '/',
    });
    expect(isPandaConversationStartupError(err)).toBe(true);
    expect(isPandaConversationStartupError(new Error('plain'))).toBe(false);
    expect(isPandaConversationStartupError(null)).toBe(false);
    expect(isPandaConversationStartupError(undefined)).toBe(false);
    expect(isPandaConversationStartupError({ code: 'PANDA_WORKDIR_INVALID' })).toBe(false);
  });

  it('向后兼容：payload.code（旧）与 payload.errorClass（新）并存', () => {
    // emitStreamError 会同时设置 code 字符串（向后兼容 b7d9239 之前 renderer）
    // 与 errorClass 结构（新 chatStore toast 映射使用）。
    const err = buildStartupError('workdir-not-found', { sessionId: 'sid-3' });
    const json = err.toJSON();
    const payload: CLIStreamErrorPayload = {
      sessionId: 'sid-3',
      messageId: 'mid-3',
      error: err.message,
      reason: 'cli-error',
      code: err.code, // 向后兼容
      errorClass: json, // 新字段
    };

    // 旧 renderer 只读 code 仍能工作
    expect(payload.code).toBeTruthy();
    expect(typeof payload.code).toBe('string');

    // 新 renderer 读 errorClass 拿到 retryable / context
    expect(payload.errorClass?.retryable).toBeDefined();
    expect(typeof payload.errorClass?.retryable).toBe('boolean');
    expect(payload.errorClass?.context).toBeDefined();
  });
});
