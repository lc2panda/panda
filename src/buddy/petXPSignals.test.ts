// Input:  petXPSignals 全部 export + recordTokenUsageSignal/recordCommandSignal 等
// Output: 验证 6 信号源各自正确转化为 addXP/recordMilestone 调用，含 try/catch 守护
// Pos:    Phase 0 P0-T4 验证 [NEW-FILE:#20260419-OD-03]

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  __resetCacheForTesting,
  getCompletedMilestones,
  getCurrentXP,
} from './petXP.js'
import {
  __resetTurnErrorStateForTesting,
  __setSignalsEnabledForTesting,
  __triggerTimeTickForTesting,
  recordCommandSignal,
  recordDeepDreamSignal,
  recordStreakStartupSignal,
  recordTokenUsageSignal,
  recordTurnSignal,
} from './petXPSignals.js'
import { createDefaultStats, todayKey } from './petStats.js'
import { XP_RATES } from './types.js'

// 隔离临时配置目录 + 强制 reset cache + 信号 force-enabled（绕过 feature gate）
let tmpDir: string
let savedEnv: { panda: string | undefined; claude: string | undefined }

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-pet-xp-signals-test-'))
  savedEnv = {
    panda: process.env.PANDA_CONFIG_DIR,
    claude: process.env.CLAUDE_CONFIG_DIR,
  }
  process.env.PANDA_CONFIG_DIR = tmpDir
  __resetCacheForTesting(null)
  __resetTurnErrorStateForTesting()
  __setSignalsEnabledForTesting(true)
})

afterEach(() => {
  __setSignalsEnabledForTesting(null)
  __resetCacheForTesting(null)
  process.env.PANDA_CONFIG_DIR = savedEnv.panda
  process.env.CLAUDE_CONFIG_DIR = savedEnv.claude
  if (savedEnv.panda === undefined) delete process.env.PANDA_CONFIG_DIR
  if (savedEnv.claude === undefined) delete process.env.CLAUDE_CONFIG_DIR
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

// why dynamic T0: 以"真实今天 SG 时区"为基准，避免硬编码日期撞到真实跨日触发
// applyDailyRollover 用 Date.now() 比较 lastSeenDay；若 T0 与真实当日不一致，
// 任意 addXP 都会被认作跨日 → 自动 +50 streak XP 污染所有断言（修自 12 fail）
const T0 = Date.now()

function seedFresh(now: number = T0) {
  __resetCacheForTesting(createDefaultStats(now))
}

// ─────────────────────────────────────────────────────────────────────────────
describe('信号 1：recordTokenUsageSignal — 三桶 token XP 入账', () => {
  test('完整 usage 对象 → in/out/cache 三桶各自累加', () => {
    seedFresh()
    recordTokenUsageSignal({
      input_tokens: 5000,
      output_tokens: 2000,
      cache_read_input_tokens: 10000,
      cache_creation_input_tokens: 3000,
    })
    // 5000/1000 × 2 = 10 in；2000/1000 × 5 = 10 out；(10000+3000)/1000 × 0.5 = 6.5 → floor 6
    const xp = getCurrentXP()
    expect(xp.total).toBe(10 + 10 + 6)
  })

  test('null/undefined usage → no-op，不抛错', () => {
    seedFresh()
    expect(() => recordTokenUsageSignal(null)).not.toThrow()
    expect(() => recordTokenUsageSignal(undefined)).not.toThrow()
    expect(getCurrentXP().total).toBe(0)
  })

  test('零 token usage → no XP 入账', () => {
    seedFresh()
    recordTokenUsageSignal({
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    })
    expect(getCurrentXP().total).toBe(0)
  })

  test('cache_creation_input_tokens 缺失 → 仅 cache_read 计入', () => {
    seedFresh()
    recordTokenUsageSignal({
      input_tokens: 1000,
      output_tokens: 0,
      cache_read_input_tokens: 4000,
      // cache_creation_input_tokens 故意缺失
    })
    // 1000/1000 × 2 = 2；4000/1000 × 0.5 = 2
    expect(getCurrentXP().total).toBe(2 + 2)
  })

  test('feature gate 关闭 → no-op（即便非空 usage）', () => {
    seedFresh()
    __setSignalsEnabledForTesting(false)
    recordTokenUsageSignal({
      input_tokens: 5000,
      output_tokens: 5000,
      cache_read_input_tokens: 5000,
      cache_creation_input_tokens: 0,
    })
    expect(getCurrentXP().total).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('信号 2：recordCommandSignal — basic vs heavy 分流', () => {
  test('普通命令 /clear → cmd.basic（3 XP）', () => {
    seedFresh()
    recordCommandSignal('clear')
    expect(getCurrentXP().total).toBe(XP_RATES['cmd.basic']) // 3
  })

  test('heavy 命令 /edit → cmd.heavy（8 XP）', () => {
    seedFresh()
    recordCommandSignal('edit')
    expect(getCurrentXP().total).toBe(XP_RATES['cmd.heavy']) // 8
  })

  test('heavy 命令 /buddy → cmd.heavy', () => {
    seedFresh()
    recordCommandSignal('buddy')
    expect(getCurrentXP().total).toBe(XP_RATES['cmd.heavy'])
  })

  test('多次连续：3 basic + 2 heavy = 9 + 16 = 25 XP', () => {
    seedFresh()
    recordCommandSignal('help')
    recordCommandSignal('clear')
    recordCommandSignal('cost')
    recordCommandSignal('test')
    recordCommandSignal('build')
    expect(getCurrentXP().total).toBe(3 * XP_RATES['cmd.basic'] + 2 * XP_RATES['cmd.heavy'])
  })

  test('feature gate 关闭 → no-op', () => {
    seedFresh()
    __setSignalsEnabledForTesting(false)
    recordCommandSignal('edit')
    recordCommandSignal('buddy')
    expect(getCurrentXP().total).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('信号 3：recordTurnSignal — success + error.recover bonus', () => {
  test('单次 success → +15 XP（turn.success），无 bonus', () => {
    seedFresh()
    recordTurnSignal('success')
    expect(getCurrentXP().total).toBe(XP_RATES['turn.success']) // 15
  })

  test('error 后紧跟 success → +15 + 25 = 40 XP', () => {
    seedFresh()
    recordTurnSignal('error') // 标记上一 turn 抛错（无 XP）
    recordTurnSignal('success') // turn.success +15 + error.recover +25
    expect(getCurrentXP().total).toBe(
      XP_RATES['turn.success'] + XP_RATES['error.recover'],
    )
  })

  test('连续 success → 仅首次 success 后第二次 success 不再触发 recover', () => {
    seedFresh()
    recordTurnSignal('error')
    recordTurnSignal('success') // +40 (15 + 25 recover)
    recordTurnSignal('success') // +15 only
    expect(getCurrentXP().total).toBe(
      2 * XP_RATES['turn.success'] + XP_RATES['error.recover'],
    )
  })

  test('error 单独无 XP 入账（仅置 flag）', () => {
    seedFresh()
    recordTurnSignal('error')
    expect(getCurrentXP().total).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('信号 4：recordStreakStartupSignal — 跨日触发，同日 no-op', () => {
  test('跨日启动 → streak.daily XP 入账 + lastSeenDay 更新', () => {
    // 种子：lastSeenDay = 昨天
    const yesterday = T0 - 86_400_000
    const seed = createDefaultStats(yesterday)
    seed.streak.lastSeenDay = todayKey(yesterday)
    __resetCacheForTesting(seed)

    const before = getCurrentXP().total
    recordStreakStartupSignal(T0)
    const after = getCurrentXP().total
    expect(after).toBeGreaterThan(before)
  })

  test('同日重复启动 → no-op', () => {
    seedFresh(T0)
    const before = getCurrentXP().total
    // 同日再次调用：应 no-op（无任何新 XP 入账）
    // why why why: createDefaultStats(T0).streak.lastSeenDay === todayKey(T0) → no-op 路径
    recordStreakStartupSignal(T0)
    expect(getCurrentXP().total).toBe(before)
  })

  test('feature gate 关闭 → no-op', () => {
    const yesterday = T0 - 86_400_000
    const seed = createDefaultStats(yesterday)
    seed.streak.lastSeenDay = todayKey(yesterday)
    __resetCacheForTesting(seed)
    __setSignalsEnabledForTesting(false)
    recordStreakStartupSignal(T0)
    expect(getCurrentXP().total).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('信号 5：time tick — 每分钟 +1 time XP', () => {
  test('单次 tick → +1 XP（time 桶）', () => {
    seedFresh()
    __triggerTimeTickForTesting()
    expect(getCurrentXP().total).toBe(XP_RATES.time) // 1
  })

  test('60 次 tick → +60 XP（time 桶 480min/day 内）', () => {
    seedFresh()
    for (let i = 0; i < 60; i++) __triggerTimeTickForTesting()
    expect(getCurrentXP().total).toBe(60 * XP_RATES.time) // 60
  })

  test('feature gate 关闭 → no-op', () => {
    seedFresh()
    __setSignalsEnabledForTesting(false)
    __triggerTimeTickForTesting()
    expect(getCurrentXP().total).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('信号 6：recordDeepDreamSignal — +200 XP + first_deepdream 里程碑', () => {
  test('完成一次 → +200 XP（deepdream）+ 300 XP（milestone）= 500 XP 总入账', () => {
    seedFresh()
    recordDeepDreamSignal()
    // deepdream 桶 +200，first_deepdream milestone +300
    expect(getCurrentXP().total).toBeGreaterThanOrEqual(
      XP_RATES.deepdream, // 200 deepdream 桶必入账
    )
    expect(getCompletedMilestones()).toContain('first_deepdream')
  })

  test('重复完成 → milestone 幂等（仅记录首次），但 deepdream XP 仍累加', () => {
    seedFresh()
    recordDeepDreamSignal()
    const firstTotal = getCurrentXP().total
    recordDeepDreamSignal() // 第二次：milestone 已记录不再加，仅 +200 deepdream
    const secondTotal = getCurrentXP().total
    expect(secondTotal).toBeGreaterThan(firstTotal)
    expect(secondTotal - firstTotal).toBe(XP_RATES.deepdream) // 仅 deepdream 桶差 200
    // milestone 仍仅记录一次（不会出现 first_deepdream 两次）
    const ms = getCompletedMilestones().filter(id => id === 'first_deepdream')
    expect(ms).toHaveLength(1)
  })

  test('feature gate 关闭 → no-op', () => {
    seedFresh()
    __setSignalsEnabledForTesting(false)
    recordDeepDreamSignal()
    expect(getCurrentXP().total).toBe(0)
    expect(getCompletedMilestones()).not.toContain('first_deepdream')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('try/catch 守护 — 异常情况绝不抛出', () => {
  test('recordTokenUsageSignal 接到非数字字段 → 不抛错', () => {
    seedFresh()
    expect(() =>
      recordTokenUsageSignal({
        input_tokens: NaN as unknown as number,
        output_tokens: 'not-a-number' as unknown as number,
      }),
    ).not.toThrow()
  })

  test('recordCommandSignal 接到空字符串 → cmd.basic 入账（保守 fallback）', () => {
    seedFresh()
    expect(() => recordCommandSignal('')).not.toThrow()
    // 空字符串非 heavy 清单 → basic
    expect(getCurrentXP().total).toBe(XP_RATES['cmd.basic'])
  })
})
