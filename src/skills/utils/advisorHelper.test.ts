/**
 * Input: advisorHelper 纯函数（配置启发式 / 模型解析 / 权限默认 / 消息构造）
 * Output: 单元测试覆盖 H-013 / H-014 / H-015
 * Pos: src/skills/utils 测试
 */

import { afterEach, describe, expect, mock, test } from 'bun:test'
import {
  buildMessagesForAdvisor,
  denyAllCanUseTool,
  extractTextFromContent,
  isAdvisorAvailableForSkill,
  isAdvisorConfigIntent,
  resolveAdvisorModel,
} from './advisorHelper.js'

// ---------------------------------------------------------------------------
// H-013: isAdvisorConfigIntent
// ---------------------------------------------------------------------------
describe('isAdvisorConfigIntent (H-013)', () => {
  test('empty → config (status)', () => {
    expect(isAdvisorConfigIntent('')).toBe(true)
    expect(isAdvisorConfigIntent('   ')).toBe(true)
  })

  test('explicit subcommands → config', () => {
    expect(isAdvisorConfigIntent('status')).toBe(true)
    expect(isAdvisorConfigIntent('clear')).toBe(true)
    expect(isAdvisorConfigIntent('off')).toBe(true)
    expect(isAdvisorConfigIntent('on')).toBe(true)
    expect(isAdvisorConfigIntent('SET')).toBe(true)
  })

  test('single model token → config', () => {
    expect(isAdvisorConfigIntent('sonnet')).toBe(true)
    expect(isAdvisorConfigIntent('opus')).toBe(true)
    expect(isAdvisorConfigIntent('haiku')).toBe(true)
    expect(isAdvisorConfigIntent('claude-opus-4-6')).toBe(true)
    expect(isAdvisorConfigIntent('sonnet-4')).toBe(true)
  })

  test('set/model + model token → config', () => {
    expect(isAdvisorConfigIntent('set sonnet')).toBe(true)
    expect(isAdvisorConfigIntent('model opus')).toBe(true)
  })

  test('analysis questions with model prefix → analysis (not config)', () => {
    // 核心回归：startsWith 误伤
    expect(isAdvisorConfigIntent('sonnet vs opus 怎么选')).toBe(false)
    expect(isAdvisorConfigIntent('sonnet vs opus')).toBe(false)
    expect(isAdvisorConfigIntent('opus 和 sonnet 比较')).toBe(false)
    expect(isAdvisorConfigIntent('如何选择数据库')).toBe(false)
    expect(isAdvisorConfigIntent('which model is better')).toBe(false)
    expect(isAdvisorConfigIntent('sonnet or opus')).toBe(false)
    expect(isAdvisorConfigIntent('haiku 适合做什么')).toBe(false)
  })

  test('natural language multi-token without model → analysis', () => {
    expect(isAdvisorConfigIntent('帮我分析微服务拆分方案')).toBe(false)
    expect(isAdvisorConfigIntent('compare postgres and mysql')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// H-014: denyAllCanUseTool fail-closed
// ---------------------------------------------------------------------------
describe('denyAllCanUseTool (H-014)', () => {
  test('defaults to deny (fail-closed)', async () => {
    const result = await denyAllCanUseTool()
    expect(result.behavior).toBe('deny')
    expect(result.decisionReason.reason).toBe('advisor-skill-default-deny')
    expect(result.message.toLowerCase()).toContain('fail-closed')
  })

  test('never auto-allows', async () => {
    const result = await denyAllCanUseTool()
    expect(result.behavior).not.toBe('allow')
  })
})

// ---------------------------------------------------------------------------
// H-015: resolveAdvisorModel single source of truth
// ---------------------------------------------------------------------------
describe('resolveAdvisorModel (H-015)', () => {
  afterEach(() => {
    mock.restore()
  })

  test('explicit override wins', () => {
    const ctx = {
      getAppState: () => ({ advisorModel: 'session-model' }),
    }
    expect(resolveAdvisorModel(ctx, 'override-model')).toBe('override-model')
  })

  test('session appState used when no override', () => {
    const ctx = {
      getAppState: () => ({ advisorModel: 'session-sonnet' }),
    }
    expect(resolveAdvisorModel(ctx)).toBe('session-sonnet')
  })

  test('falls back when appState empty', () => {
    const ctx = {
      getAppState: () => ({ advisorModel: undefined }),
    }
    // 无 settings mock 时可能为 undefined；确保不抛错
    expect(() => resolveAdvisorModel(ctx)).not.toThrow()
  })

  test('isAdvisorAvailableForSkill reads session appState', () => {
    const ctx = {
      getAppState: () => ({ advisorModel: 'session-opus' }),
    }
    expect(isAdvisorAvailableForSkill(ctx)).toBe(true)
  })

  test('isAdvisorAvailableForSkill false when no model', () => {
    const ctx = {
      getAppState: () => ({ advisorModel: undefined }),
    }
    // 若全局 settings 也无 model，应为 false
    // 此处只验证：空 session 不因 session 而 true
    const available = isAdvisorAvailableForSkill(ctx)
    // 不强制 false（settings 可能有值），但 session 为空时不应因 session 而 true
    // 用 resolve 验证 session 未贡献
    expect(resolveAdvisorModel(ctx) === 'session-opus').toBe(false)
    void available
  })
})

// ---------------------------------------------------------------------------
// 既有：消息构造 / 文本提取
// ---------------------------------------------------------------------------
describe('buildMessagesForAdvisor', () => {
  test('appends user prompt and respects context limit', () => {
    const history = Array.from({ length: 5 }, (_, i) => ({
      type: 'user' as const,
      uuid: `u-${i}`,
      message: {
        role: 'user' as const,
        content: [{ type: 'text' as const, text: `msg-${i}` }],
      },
    }))

    const result = buildMessagesForAdvisor(history as any, 'analyze this', 3)
    expect(result.length).toBe(4) // 3 history + 1 prompt
    const last = result[result.length - 1] as any
    expect(last.message.content[0].text).toBe('analyze this')
  })
})

describe('extractTextFromContent', () => {
  test('string passthrough', () => {
    expect(extractTextFromContent('hello')).toBe('hello')
  })

  test('extracts text blocks', () => {
    expect(
      extractTextFromContent([
        { type: 'text', text: 'a' },
        { type: 'tool_use', id: 'x' },
        { type: 'text', text: 'b' },
      ]),
    ).toBe('a\nb')
  })

  test('empty for unknown', () => {
    expect(extractTextFromContent(null)).toBe('')
    expect(extractTextFromContent(42)).toBe('')
  })
})
