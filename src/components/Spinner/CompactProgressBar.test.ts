// Input: renderBar / renderPercent / renderPhaseLabel / buildSecondaryLine / createInitialCompactProgress
// Output: 验证进度条 ASCII / 百分比 / 阶段标签 / 副行渲染、边界与降级
// Pos: Worker S v2.26.2 — CompactProgressBar 纯函数单元测试

import { describe, expect, test, beforeAll } from 'bun:test'

// 锁定测试 i18n 为英文，避免 isZh 走 LANG 系统语言影响断言。
// getLang() 在 config 未初始化时回退到 process.env.LANG。
beforeAll(() => {
  process.env.LANG = 'en'
})

import {
  buildSecondaryLine,
  createInitialCompactProgress,
  renderBar,
  renderPercent,
  renderPhaseLabel,
  type CompactProgressState,
} from './CompactProgressBar.js'
import {
  COMPACT_PROGRESS_WEIGHTS,
  mapSummarizePercent,
} from '../../services/compact/compact.js'

const BAR_WIDTH = 16
const FILLED = '\u2588'
const EMPTY = '\u2591'

describe('renderBar', () => {
  test('null percent → 全空 16 字符', () => {
    expect(renderBar(null)).toBe(EMPTY.repeat(BAR_WIDTH))
  })

  test('0% → 全空 16 字符', () => {
    expect(renderBar(0)).toBe(EMPTY.repeat(BAR_WIDTH))
  })

  test('50% → 8 填充 + 8 空', () => {
    expect(renderBar(50)).toBe(FILLED.repeat(8) + EMPTY.repeat(8))
  })

  test('100% → 全填充 16 字符', () => {
    expect(renderBar(100)).toBe(FILLED.repeat(BAR_WIDTH))
  })

  test('超出 100 → 钳位到 100 (全填充)', () => {
    expect(renderBar(250)).toBe(FILLED.repeat(BAR_WIDTH))
  })

  test('负数 → 钳位到 0 (全空)', () => {
    expect(renderBar(-30)).toBe(EMPTY.repeat(BAR_WIDTH))
  })

  test('NaN → 全空 (优雅降级)', () => {
    expect(renderBar(Number.NaN)).toBe(EMPTY.repeat(BAR_WIDTH))
  })

  test('100% / 0% 对称且总长恒等 16', () => {
    for (let p = 0; p <= 100; p += 5) {
      expect(renderBar(p).length).toBe(BAR_WIDTH)
    }
  })
})

describe('renderPercent', () => {
  test('null → "  --%" (3 字宽对齐)', () => {
    expect(renderPercent(null)).toBe('  --%')
  })

  test('0% → "  0%"', () => {
    expect(renderPercent(0)).toBe('  0%')
  })

  test('53% → " 53%"', () => {
    expect(renderPercent(53)).toBe(' 53%')
  })

  test('100% → "100%"', () => {
    expect(renderPercent(100)).toBe('100%')
  })

  test('小数 → 四舍五入', () => {
    expect(renderPercent(49.6)).toBe(' 50%')
  })

  test('NaN → "  --%"', () => {
    expect(renderPercent(Number.NaN)).toBe('  --%')
  })
})

describe('renderPhaseLabel', () => {
  test('null → 空字符串', () => {
    expect(renderPhaseLabel(null)).toBe('')
  })

  test('Summarizing → "Generating summary" (英文)', () => {
    expect(renderPhaseLabel('Summarizing')).toBe('Generating summary')
  })

  test('Pre-hooks → "Running PreCompact hooks"', () => {
    expect(renderPhaseLabel('Pre-hooks')).toBe('Running PreCompact hooks')
  })

  test('Restoring files → "Restoring files"', () => {
    expect(renderPhaseLabel('Restoring files')).toBe('Restoring files')
  })

  test('Post-hooks → "Running PostCompact hooks"', () => {
    expect(renderPhaseLabel('Post-hooks')).toBe('Running PostCompact hooks')
  })
})

describe('buildSecondaryLine', () => {
  function mk(overrides: Partial<CompactProgressState>): CompactProgressState {
    return {
      ...createInitialCompactProgress(Date.now() - 8000), // 8s elapsed
      ...overrides,
    }
  }

  test('全空 state → 只有 elapsed', () => {
    const line = buildSecondaryLine(mk({}))
    expect(line).toContain('elapsed:')
  })

  test('tokens processed + total → "tokens: X / Y"', () => {
    const line = buildSecondaryLine(
      mk({ tokensProcessed: 12_300, tokensTotal: 23_100 }),
    )
    expect(line).toContain('tokens:')
    // formatNumber 通常加千位分隔；至少要包含数字
    expect(line).toMatch(/12[,.]?\d/)
    expect(line).toMatch(/23[,.]?\d/)
  })

  test('attempt 1/3 → "attempt 1/3"', () => {
    const line = buildSecondaryLine(mk({ attempt: 1, maxAttempts: 3 }))
    expect(line).toContain('attempt 1/3')
  })

  test('note → 追加在末尾', () => {
    const line = buildSecondaryLine(mk({ note: 'retrying after PTL' }))
    expect(line).toContain('retrying after PTL')
  })

  test('只 tokensProcessed 没 total → 不显示分母', () => {
    const line = buildSecondaryLine(mk({ tokensProcessed: 5000 }))
    expect(line).toContain('5')
    expect(line).not.toContain('/')
  })

  test('用 " · " 作为分隔符 (middot)', () => {
    const line = buildSecondaryLine(
      mk({ tokensProcessed: 1000, tokensTotal: 5000, attempt: 1, maxAttempts: 2 }),
    )
    expect(line).toContain(' \u00B7 ')
  })
})

describe('createInitialCompactProgress', () => {
  test('返回全 null + startedAt = now (默认)', () => {
    const before = Date.now()
    const state = createInitialCompactProgress()
    const after = Date.now()
    expect(state.phase).toBeNull()
    expect(state.percent).toBeNull()
    expect(state.tokensProcessed).toBeNull()
    expect(state.tokensTotal).toBeNull()
    expect(state.attempt).toBeNull()
    expect(state.maxAttempts).toBeNull()
    expect(state.note).toBeNull()
    expect(state.startedAt).toBeGreaterThanOrEqual(before)
    expect(state.startedAt).toBeLessThanOrEqual(after)
  })

  test('显式 startedAt 透传', () => {
    const state = createInitialCompactProgress(1_000_000)
    expect(state.startedAt).toBe(1_000_000)
  })
})

describe('mapSummarizePercent (compact.ts helper)', () => {
  test('fraction=0 → summarizeStart (8)', () => {
    expect(mapSummarizePercent(0)).toBe(COMPACT_PROGRESS_WEIGHTS.summarizeStart)
  })

  test('fraction=1 → summarizeEnd (80)', () => {
    expect(mapSummarizePercent(1)).toBe(COMPACT_PROGRESS_WEIGHTS.summarizeEnd)
  })

  test('fraction=0.5 → 中点 (44)', () => {
    const mid =
      (COMPACT_PROGRESS_WEIGHTS.summarizeStart +
        COMPACT_PROGRESS_WEIGHTS.summarizeEnd) /
      2
    expect(mapSummarizePercent(0.5)).toBe(mid)
  })

  test('超出 1 → 钳位到 summarizeEnd (80)', () => {
    expect(mapSummarizePercent(2.5)).toBe(COMPACT_PROGRESS_WEIGHTS.summarizeEnd)
  })

  test('负数 → 钳位到 summarizeStart (8)', () => {
    expect(mapSummarizePercent(-0.1)).toBe(
      COMPACT_PROGRESS_WEIGHTS.summarizeStart,
    )
  })

  test('NaN → summarizeStart 默认 (优雅降级)', () => {
    expect(mapSummarizePercent(Number.NaN)).toBe(
      COMPACT_PROGRESS_WEIGHTS.summarizeStart,
    )
  })

  test('阶段权重单调递增', () => {
    expect(COMPACT_PROGRESS_WEIGHTS.preHookStart).toBeLessThan(
      COMPACT_PROGRESS_WEIGHTS.preHookEnd,
    )
    expect(COMPACT_PROGRESS_WEIGHTS.preHookEnd).toBeLessThanOrEqual(
      COMPACT_PROGRESS_WEIGHTS.summarizeStart,
    )
    expect(COMPACT_PROGRESS_WEIGHTS.summarizeStart).toBeLessThan(
      COMPACT_PROGRESS_WEIGHTS.summarizeEnd,
    )
    expect(COMPACT_PROGRESS_WEIGHTS.summarizeEnd).toBeLessThanOrEqual(
      COMPACT_PROGRESS_WEIGHTS.restoreStart,
    )
    expect(COMPACT_PROGRESS_WEIGHTS.restoreStart).toBeLessThan(
      COMPACT_PROGRESS_WEIGHTS.restoreEnd,
    )
    expect(COMPACT_PROGRESS_WEIGHTS.restoreEnd).toBeLessThanOrEqual(
      COMPACT_PROGRESS_WEIGHTS.postHookStart,
    )
    expect(COMPACT_PROGRESS_WEIGHTS.postHookStart).toBeLessThan(
      COMPACT_PROGRESS_WEIGHTS.postHookEnd,
    )
    expect(COMPACT_PROGRESS_WEIGHTS.postHookEnd).toBe(100)
  })
})
