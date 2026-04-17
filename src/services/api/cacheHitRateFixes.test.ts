// Input:  三条 P0 缓存命中率修复的 TDD 回归
// Output: 验证修复在非 firstParty / firstParty 下行为分别正确（byte-equal 守护）
// Pos:    v2.21.21 P0 cache hit rate fixes (session 056f8651 36% → 85%)
//
// 覆盖：
// 1. skipCacheWrite + messages.length=1 短 fork 场景：非 firstParty 至少 ≥1 marker (cache_read 父 prefix)
// 2. attribution header cc_workload 在 non-firstParty 剥离，firstParty 保留 (byte-equal)
// 3. isDeferredToolsDeltaEnabled 非 firstParty 默认 true，firstParty 默认 false

import { describe, expect, test, beforeEach, afterEach } from 'bun:test'

// MACRO polyfill — normally injected by Bun bundler at build time.
// bun:test doesn't run the bundler, so we stub here (same pattern as cli.tsx).
if (typeof (globalThis as any).MACRO === 'undefined') {
  ;(globalThis as any).MACRO = {
    VERSION: '2.21.21-test',
    BUILD_TIME: new Date().toISOString(),
    FEEDBACK_CHANNEL: '',
    ISSUES_EXPLAINER: '',
    NATIVE_PACKAGE_URL: '@lc2panda/panda-code',
    PACKAGE_URL: '@lc2panda/panda-code',
    VERSION_CHANGELOG: '',
  }
}

import { addCacheBreakpoints } from './claude.js'
import { createUserMessage } from '../../utils/messages.js'
import type { UserMessage } from '../../types/message.js'
import { getAttributionHeader } from '../../constants/system.js'
import { runWithWorkload } from '../../utils/workloadContext.js'
import { isDeferredToolsDeltaEnabled } from '../../utils/toolSearch.js'

function mkMsgs(n: number): UserMessage[] {
  return Array.from({ length: n }, (_, i) =>
    createUserMessage({ content: `msg-${i}` }),
  ) as UserMessage[]
}

function countMarkers(result: readonly { content: unknown }[]): number {
  let count = 0
  for (const msg of result) {
    if (!Array.isArray(msg.content)) continue
    for (const block of msg.content) {
      if (block && typeof block === 'object' && 'cache_control' in block) {
        count += 1
      }
    }
  }
  return count
}

// Env helpers — restore after each test to avoid leaking provider state.
const ENV_KEYS = [
  'ANTHROPIC_BASE_URL',
  'CLAUDE_CODE_USE_BEDROCK',
  'CLAUDE_CODE_USE_VERTEX',
  'CLAUDE_CODE_USE_FOUNDRY',
  'PANDA_PROVIDER',
  'USER_TYPE',
  'PANDA_FORCE_CACHE_STRATEGY',
] as const

describe('P0 修复 1 — skipCacheWrite 短 fork 零 marker 洞', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k]
  })
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  test('非 firstParty (Bedrock) + skipCacheWrite=true + messages.length=1 → ≥1 marker (cache_read 父 prefix)', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    const messages = mkMsgs(1)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      true, // skipCacheWrite
      0,
    )
    // Red 基线：当前代码 primaryIdx = 1 - 2 = -1 + secondaryIdx = -1 → 0 marker
    // Green 目标：primaryIdx = max(-1, 0) = 0 → 1 marker
    expect(countMarkers(result)).toBeGreaterThanOrEqual(1)
  })

  test('非 firstParty + skipCacheWrite=true + messages.length=2 → 至少 primary marker (length=2 短 fork)', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    const messages = mkMsgs(2)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      true,
      0,
    )
    // Red 基线：primaryIdx=0, secondaryIdx=-1 (length<4) → 1 marker
    // Green 目标：至少 1 marker（primary 存活）
    expect(countMarkers(result)).toBeGreaterThanOrEqual(1)
  })

  test('非 firstParty + skipCacheWrite=true + messages.length=3 → 允许 secondary 启用（语义：让短 fork 命中父 prefix）', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    const messages = mkMsgs(3)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      true, // skipCacheWrite
      0,
    )
    // Red 基线：length=3 不满足 length>=4，仅 primary @ index 1 → 1 marker
    // Green 目标 (skipCacheWrite + length≥2)：primary @ 1 + secondary @ 0 = 2 markers
    expect(countMarkers(result)).toBeGreaterThanOrEqual(2)
  })

  test('非 firstParty + skipCacheWrite=false (正常非短 fork) + messages.length=5 → 现有双 marker 行为保留', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    const messages = mkMsgs(5)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      false, // skipCacheWrite = false
      0,
    )
    // baseline-protect: 非短 fork 路径行为不变
    expect(countMarkers(result)).toBe(2)
  })

  test('byte-equal 守护：firstParty + skipCacheWrite=true + messages.length=1 行为不回归（保持 0 marker 的老行为）', () => {
    // 默认 firstParty: 不设置 BEDROCK/VERTEX/FOUNDRY/OPENAI
    delete process.env.CLAUDE_CODE_USE_BEDROCK
    delete process.env.CLAUDE_CODE_USE_VERTEX
    delete process.env.CLAUDE_CODE_USE_FOUNDRY
    delete process.env.PANDA_PROVIDER
    // Anthropic 直连 — 不设 BASE_URL 默认是直连
    delete process.env.ANTHROPIC_BASE_URL

    const messages = mkMsgs(1)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      true,
      0,
    )
    // firstParty + Anthropic 直连：保持旧行为不破坏 byte-equal — 0 marker
    expect(countMarkers(result)).toBe(0)
  })
})

describe('P0 修复 2 — attribution header cc_workload 剥离（non-firstParty）守 firstParty byte-equal', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k]
    // 保证 attribution header 启用
    delete process.env.CLAUDE_CODE_ATTRIBUTION_HEADER
    process.env.CLAUDE_CODE_ENTRYPOINT = 'cli'
  })
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  test('firstParty (Anthropic 直连)：cc_workload=cron 存在于 header (byte-equal 守护)', () => {
    delete process.env.CLAUDE_CODE_USE_BEDROCK
    delete process.env.CLAUDE_CODE_USE_VERTEX
    delete process.env.CLAUDE_CODE_USE_FOUNDRY
    delete process.env.PANDA_PROVIDER
    delete process.env.ANTHROPIC_BASE_URL

    const h = runWithWorkload('cron', () => getAttributionHeader('abc123'))
    expect(h).toContain('cc_workload=cron')
  })

  test('firstParty + workload=undefined：cc_workload 本就不出现 (basline)', () => {
    delete process.env.CLAUDE_CODE_USE_BEDROCK
    delete process.env.CLAUDE_CODE_USE_VERTEX
    delete process.env.CLAUDE_CODE_USE_FOUNDRY
    delete process.env.PANDA_PROVIDER
    delete process.env.ANTHROPIC_BASE_URL

    const h = runWithWorkload(undefined, () => getAttributionHeader('abc123'))
    expect(h).not.toContain('cc_workload')
  })

  test('非 firstParty (Bedrock) + workload=cron：cc_workload 从 header 剥离（system prompt 字节稳定）', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    // Red 基线：当前代码无 gate，所有 provider 都输出 cc_workload=cron → 包含
    // Green 目标：非 firstParty 剥离 cc_workload
    const h = runWithWorkload('cron', () => getAttributionHeader('abc123'))
    expect(h).not.toContain('cc_workload')
  })

  test('非 firstParty：相邻两次调用（workload 不同）header byte-identical', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    const h1 = runWithWorkload('cron', () => getAttributionHeader('same_fp'))
    const h2 = runWithWorkload(undefined, () => getAttributionHeader('same_fp'))
    const h3 = runWithWorkload('interactive', () =>
      getAttributionHeader('same_fp'),
    )
    // 非 firstParty：三次 workload 不同 → header 应字节一致（system prefix 稳定）
    expect(h1).toBe(h2)
    expect(h1).toBe(h3)
  })

  test('非 firstParty (Vertex)：cc_workload 剥离', () => {
    process.env.CLAUDE_CODE_USE_VERTEX = '1'
    const h = runWithWorkload('cron', () => getAttributionHeader('abc123'))
    expect(h).not.toContain('cc_workload')
  })

  test('byte-equal 守护：firstParty 相邻两次 (workload=cron → workload=undefined) 字节会变（证明修复没动 firstParty 路径）', () => {
    delete process.env.CLAUDE_CODE_USE_BEDROCK
    delete process.env.CLAUDE_CODE_USE_VERTEX
    delete process.env.CLAUDE_CODE_USE_FOUNDRY
    delete process.env.PANDA_PROVIDER
    delete process.env.ANTHROPIC_BASE_URL
    const h1 = runWithWorkload('cron', () => getAttributionHeader('same_fp'))
    const h2 = runWithWorkload(undefined, () =>
      getAttributionHeader('same_fp'),
    )
    // firstParty 保持上游原生行为 — header 会变（这是上游 Claude Code 的既有行为）
    expect(h1).not.toBe(h2)
  })
})

describe('P0 修复 3 — isDeferredToolsDeltaEnabled 默认翻转 (non-firstParty)', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k]
    // 清除 USER_TYPE 以便测试 provider-gated 默认值
    delete process.env.USER_TYPE
  })
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  test('非 firstParty (Bedrock)：默认启用 delta (tools 前缀稳定)', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    // Red 基线：默认 false，只有 ant 或 GrowthBook 才启用
    // Green 目标：非 firstParty 默认 true
    expect(isDeferredToolsDeltaEnabled()).toBe(true)
  })

  test('非 firstParty (Vertex)：默认启用 delta', () => {
    process.env.CLAUDE_CODE_USE_VERTEX = '1'
    expect(isDeferredToolsDeltaEnabled()).toBe(true)
  })

  test('非 firstParty (OpenAI)：默认启用 delta', () => {
    process.env.PANDA_PROVIDER = 'openai'
    expect(isDeferredToolsDeltaEnabled()).toBe(true)
  })

  test('byte-equal 守护：firstParty (Anthropic 直连)：默认不启用 delta（保守守 byte-equal）', () => {
    delete process.env.CLAUDE_CODE_USE_BEDROCK
    delete process.env.CLAUDE_CODE_USE_VERTEX
    delete process.env.CLAUDE_CODE_USE_FOUNDRY
    delete process.env.PANDA_PROVIDER
    delete process.env.ANTHROPIC_BASE_URL
    // firstParty 非 ant：保持默认 false
    expect(isDeferredToolsDeltaEnabled()).toBe(false)
  })

  test('ant user：仍然启用 (沿袭上游)', () => {
    delete process.env.CLAUDE_CODE_USE_BEDROCK
    delete process.env.CLAUDE_CODE_USE_VERTEX
    process.env.USER_TYPE = 'ant'
    expect(isDeferredToolsDeltaEnabled()).toBe(true)
  })
})
