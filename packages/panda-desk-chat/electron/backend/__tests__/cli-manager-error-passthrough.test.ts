// Input: 无（纯契约测试）
// Output: 验证 friendifyCliError 映射逻辑与 lastStreamResult 缓存契约
// Pos: v2.27.5 方案 C — cli-manager 错误真透传
//
// 设计原则：仅测 friendifyCliError 纯函数逻辑 + SDKResultMessage 类型扩展契约，
// 不 mock cli-manager 的完整 spawn/exit 路径（依赖 IPC/fs，留集成测试）。
import { describe, it, expect } from 'vitest';
import { friendifyCliError } from '../cli-manager';
import type { SDKResultMessage } from '../types';

describe('friendifyCliError — 错误文本中文友好化', () => {
  it('2000×2000 限制错误 → 中文提示', () => {
    const raw = 'Image dimensions exceed the 2000x2000px limit';
    const result = friendifyCliError(raw);
    expect(result).toContain('2000×2000');
    expect(result).toContain('缩小图片');
  });

  it('包含 2000x2000 关键字的变体 → 中文提示', () => {
    const raw = 'Image exceeds the 2000x2000px maximum size';
    expect(friendifyCliError(raw)).toContain('2000×2000');
  });

  it('未匹配的错误文本原样透传', () => {
    const raw = 'Some unknown internal error';
    expect(friendifyCliError(raw)).toBe(raw);
  });

  it('空字符串 → 原样返回', () => {
    expect(friendifyCliError('')).toBe('');
  });

  it('文件过大错误 → 包含原始信息的中文前缀', () => {
    const raw = 'File size exceeds the 5MB limit';
    const result = friendifyCliError(raw);
    expect(result).toContain('图片文件过大');
    expect(result).toContain(raw);
  });
});

describe('SDKResultMessage 类型契约 — subtype + errors 字段', () => {
  it('error_during_execution 子类型可构造', () => {
    const msg: SDKResultMessage = {
      type: 'result',
      subtype: 'error_during_execution',
      is_error: true,
      errors: ['Image dimensions exceed the 2000x2000px limit'],
    };
    expect(msg.subtype).toBe('error_during_execution');
    expect(msg.errors?.[0]).toContain('2000x2000');
  });

  it('success 子类型可构造（不带 errors）', () => {
    const msg: SDKResultMessage = {
      type: 'result',
      subtype: 'success',
      is_error: false,
      result: 'pong',
    };
    expect(msg.subtype).toBe('success');
    expect(msg.errors).toBeUndefined();
  });

  it('无 subtype 的旧格式兼容（optional 字段）', () => {
    const msg: SDKResultMessage = {
      type: 'result',
      result: 'legacy',
    };
    expect(msg.subtype).toBeUndefined();
    expect(msg.errors).toBeUndefined();
  });
});
