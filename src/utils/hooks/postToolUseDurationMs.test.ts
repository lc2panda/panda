// Input: PostToolUseHookInputSchema + PostToolUseFailureHookInputSchema 校验
// Output: Bun test assertions on duration_ms 字段在 hook 输入中的可选性与传递
// Pos: Hooks v2 增强字段补齐 — duration_ms 字段单元测试
import { describe, expect, test } from 'bun:test'
import {
  PostToolUseHookInputSchema,
  PostToolUseFailureHookInputSchema,
} from '../../entrypoints/sdk/coreSchemas.js'

describe('PostToolUseHookInputSchema — duration_ms 字段', () => {
  const baseInput = {
    session_id: 'sess-1',
    transcript_path: '/tmp/t',
    cwd: '/home',
    hook_event_name: 'PostToolUse' as const,
    tool_name: 'Bash',
    tool_input: { command: 'ls' },
    tool_response: { stdout: 'ok' },
    tool_use_id: 'use-1',
  }

  test('duration_ms 缺失时仍能解析（向后兼容）', () => {
    const parsed = PostToolUseHookInputSchema().safeParse(baseInput)
    expect(parsed.success).toBe(true)
  })

  test('duration_ms 为非负数字时通过', () => {
    const parsed = PostToolUseHookInputSchema().safeParse({
      ...baseInput,
      duration_ms: 12345,
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      // and.<inner> 类型，断言形态
      expect((parsed.data as { duration_ms?: number }).duration_ms).toBe(12345)
    }
  })

  test('duration_ms 为字符串时拒绝', () => {
    const parsed = PostToolUseHookInputSchema().safeParse({
      ...baseInput,
      duration_ms: 'fast',
    })
    expect(parsed.success).toBe(false)
  })

  test('duration_ms 为 0（极短工具）时通过', () => {
    const parsed = PostToolUseHookInputSchema().safeParse({
      ...baseInput,
      duration_ms: 0,
    })
    expect(parsed.success).toBe(true)
  })
})

describe('PostToolUseFailureHookInputSchema — duration_ms 字段', () => {
  const baseFailure = {
    session_id: 'sess-1',
    transcript_path: '/tmp/t',
    cwd: '/home',
    hook_event_name: 'PostToolUseFailure' as const,
    tool_name: 'Bash',
    tool_input: { command: 'false' },
    tool_use_id: 'use-2',
    error: 'exit 1',
  }

  test('duration_ms 缺失时通过（兼容）', () => {
    const parsed = PostToolUseFailureHookInputSchema().safeParse(baseFailure)
    expect(parsed.success).toBe(true)
  })

  test('user interrupt 路径：is_interrupt + duration_ms 同时存在', () => {
    const parsed = PostToolUseFailureHookInputSchema().safeParse({
      ...baseFailure,
      is_interrupt: true,
      duration_ms: 850,
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect((parsed.data as { duration_ms?: number }).duration_ms).toBe(850)
      expect((parsed.data as { is_interrupt?: boolean }).is_interrupt).toBe(
        true,
      )
    }
  })

  test('duration_ms NaN 被 schema 拒绝（zod v4 默认排除 NaN）', () => {
    // 双保险：schema 直接拒绝 NaN，且 executePostToolUseFailureHooks 的
    // Number.isFinite 守卫也不会注入。任意一层失败都不会让 NaN 触达 hook。
    const parsed = PostToolUseFailureHookInputSchema().safeParse({
      ...baseFailure,
      duration_ms: Number.NaN,
    })
    expect(parsed.success).toBe(false)
  })
})

// Sanity test: confirm the inline-spread guard pattern used by
// executePostToolHooks omits duration_ms entirely when undefined.
describe('inline-spread guard pattern', () => {
  function buildInput(
    durationMs?: number,
  ): Record<string, unknown> {
    return {
      base: 'x',
      ...(typeof durationMs === 'number' &&
        Number.isFinite(durationMs) && { duration_ms: durationMs }),
    }
  }

  test('undefined 时不出现 duration_ms key', () => {
    const out = buildInput(undefined)
    expect('duration_ms' in out).toBe(false)
  })

  test('数字时 key 存在', () => {
    const out = buildInput(7)
    expect(out.duration_ms).toBe(7)
  })

  test('NaN 被 isFinite 守卫过滤', () => {
    const out = buildInput(Number.NaN)
    expect('duration_ms' in out).toBe(false)
  })

  test('Infinity 被守卫过滤', () => {
    const out = buildInput(Infinity)
    expect('duration_ms' in out).toBe(false)
  })

  test('0 是有效值（key 存在）', () => {
    const out = buildInput(0)
    expect(out.duration_ms).toBe(0)
  })
})
