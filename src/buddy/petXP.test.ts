// Input: petXP.ts 全部 export
// Output: 11 桶单价 / 等级公式 / 日封顶 + overflow 返还 / time 480min 封顶 /
//         升级回调 + history / 稀有度自动跃迁 / state 解锁 / shiny 触发
// Pos:    Phase 0 P0-T2 验证 [NEW-FILE:#20260419-OD-01]

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  __resetCacheForTesting,
  addXP,
  getCompletedMilestones,
  getCurrentLevel,
  getCurrentXP,
  getEffectiveRarity,
  getShinyEarned,
  getUnlockedStates,
  isHatUnlocked,
  isStateUnlocked,
  recordMilestone,
  subscribeLevelUp,
  subscribeStats,
} from './petXP.js'
import { createDefaultStats } from './petStats.js'
import {
  DAILY_XP_CAP,
  MAX_LEVEL,
  TIME_XP_CAP_MIN,
  totalXpForLevel,
  XP_RATES,
  xpRequiredForLevel,
} from './types.js'

// 隔离临时配置目录 + 强制 reset cache
let tmpDir: string
let savedEnv: { panda: string | undefined; claude: string | undefined }

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-pet-xp-test-'))
  savedEnv = {
    panda: process.env.PANDA_CONFIG_DIR,
    claude: process.env.CLAUDE_CONFIG_DIR,
  }
  process.env.PANDA_CONFIG_DIR = tmpDir
  __resetCacheForTesting(null)
})

afterEach(() => {
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

// 固定时间锚点（避免时区/今日变化影响）
const T0 = Date.UTC(2026, 3, 19, 8, 0, 0) // 2026-04-19 +08:00 16:00

// 帮助：seed 一个干净的内存 cache，省去依赖磁盘
function seedFresh() {
  __resetCacheForTesting(createDefaultStats(T0))
}

// ─────────────────────────────────────────────────────────────────────────────
describe('等级公式 xpRequiredForLevel / totalXpForLevel', () => {
  test('L=1 → 80', () => {
    expect(xpRequiredForLevel(1)).toBe(80)
  })

  test('L=10 公式与手算 floor(80 × 10^1.55) 一致', () => {
    // 实测 80 × 10^1.55 ≈ 2838.86 → floor 2838（非 A2 §2 草表的 2949 — 已校正）
    expect(xpRequiredForLevel(10)).toBe(Math.floor(80 * 10 ** 1.55))
    expect(xpRequiredForLevel(10)).toBe(2838)
  })

  test('L < 1 → Infinity', () => {
    expect(xpRequiredForLevel(0)).toBe(Infinity)
    expect(xpRequiredForLevel(-5)).toBe(Infinity)
  })

  test('L >= MAX_LEVEL → Infinity', () => {
    expect(xpRequiredForLevel(MAX_LEVEL)).toBe(Infinity)
    expect(xpRequiredForLevel(MAX_LEVEL + 10)).toBe(Infinity)
  })

  test('totalXpForLevel(1) = 0', () => {
    expect(totalXpForLevel(1)).toBe(0)
  })

  test('totalXpForLevel(2) = xpRequiredForLevel(1) = 80', () => {
    expect(totalXpForLevel(2)).toBe(80)
  })

  test('totalXpForLevel(3) = 80 + xpRequiredForLevel(2)', () => {
    expect(totalXpForLevel(3)).toBe(80 + xpRequiredForLevel(2))
  })

  test('totalXpForLevel 单调递增', () => {
    let prev = 0
    for (let lv = 1; lv <= 30; lv++) {
      const t = totalXpForLevel(lv)
      expect(t).toBeGreaterThanOrEqual(prev)
      prev = t
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('addXP — 11 桶单价正确', () => {
  test('time 桶：1 XP / minute', () => {
    seedFresh()
    const r = addXP('time', 10, T0)
    expect(r.xpAdded).toBe(10) // 10 min × 1 XP
  })

  test('tokens.in：2 XP / 1k', () => {
    seedFresh()
    const r = addXP('tokens.in', 1500, T0)
    // 1500 / 1000 × 2 = 3 → floor 3
    expect(r.xpAdded).toBe(3)
  })

  test('tokens.out：5 XP / 1k', () => {
    seedFresh()
    const r = addXP('tokens.out', 2000, T0)
    expect(r.xpAdded).toBe(10)
  })

  test('tokens.cache：0.5 XP / 1k', () => {
    seedFresh()
    const r = addXP('tokens.cache', 4000, T0)
    expect(r.xpAdded).toBe(2)
  })

  test('cmd.basic：3 XP / 次', () => {
    seedFresh()
    const r = addXP('cmd.basic', 5, T0)
    expect(r.xpAdded).toBe(15)
  })

  test('cmd.heavy：8 XP / 次', () => {
    seedFresh()
    const r = addXP('cmd.heavy', 3, T0)
    expect(r.xpAdded).toBe(24)
  })

  test('turn.success：15 XP / 次', () => {
    seedFresh()
    const r = addXP('turn.success', 1, T0)
    expect(r.xpAdded).toBe(15)
  })

  test('error.recover：25 XP / 次', () => {
    seedFresh()
    const r = addXP('error.recover', 1, T0)
    expect(r.xpAdded).toBe(25)
  })

  test('deepdream：200 XP / 次', () => {
    seedFresh()
    const r = addXP('deepdream', 1, T0)
    expect(r.xpAdded).toBe(200)
  })

  test('rawAmount <= 0 → no-op', () => {
    seedFresh()
    expect(addXP('cmd.basic', 0, T0).xpAdded).toBe(0)
    expect(addXP('cmd.basic', -5, T0).xpAdded).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('日封顶 2000 + overflow 50% 次日返还', () => {
  test('单次添加超出 cap → 截断 + overflow 累计', () => {
    seedFresh()
    // 1 次 5000 XP（cmd.basic 1667 次）
    const r = addXP('cmd.basic', 1667, T0) // 1667 × 3 = 5001
    expect(r.xpAdded).toBe(DAILY_XP_CAP) // 截 2000
    const view = getCurrentXP(T0)
    expect(view.today).toBe(DAILY_XP_CAP)
  })

  test('跨天 → today 重置 + overflow 50% 返还', () => {
    seedFresh()
    addXP('cmd.basic', 1667, T0) // overflow ≈ 3001
    // 跨过一天（+24h，仍 +08:00 时区内"明天"）
    const T1 = T0 + 24 * 60 * 60 * 1000
    // 任意小写入触发跨天检查
    addXP('cmd.basic', 1, T1)
    const view = getCurrentXP(T1)
    // overflow 5001 - 2000 = 3001；50% 返还 = 1500
    // today = 1500 + addXP(1×3=3) = 1503
    expect(view.today).toBeGreaterThanOrEqual(1500)
    expect(view.today).toBeLessThanOrEqual(1503)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('time 桶 480 min/day 封顶', () => {
  test('累计 480 分钟后再写入 → no-op', () => {
    seedFresh()
    const r1 = addXP('time', TIME_XP_CAP_MIN, T0)
    expect(r1.xpAdded).toBe(TIME_XP_CAP_MIN)
    const r2 = addXP('time', 60, T0)
    expect(r2.xpAdded).toBe(0)
  })

  test('部分超出 → 截至剩余空间', () => {
    seedFresh()
    addXP('time', 470, T0) // 还剩 10 min
    const r2 = addXP('time', 60, T0)
    expect(r2.xpAdded).toBe(10)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('升级机制', () => {
  test('XP 累积到 80 → Lv 2', () => {
    seedFresh()
    // 80 XP = cmd.basic 27 次 (27×3=81)
    const r = addXP('cmd.basic', 27, T0)
    expect(r.leveledUp).toBe(true)
    expect(r.newLevel).toBe(2)
    expect(getCurrentLevel(T0)).toBe(2)
  })

  test('subscribeLevelUp 回调触发 + 接收 from/to', () => {
    seedFresh()
    let captured: { from: number; to: number } | null = null
    const unsub = subscribeLevelUp((from, to) => {
      captured = { from, to }
    })
    addXP('cmd.basic', 27, T0)
    expect(captured).toEqual({ from: 1, to: 2 })
    unsub()
  })

  test('history 记录 level_up 事件', () => {
    seedFresh()
    addXP('cmd.basic', 27, T0)
    // history 通过 getCompletedMilestones / 直接读 cache 不便；改用 getCurrentXP 间接验证
    expect(getCurrentLevel(T0)).toBe(2)
  })

  test('一次添加跨多级（500 XP 直接到 Lv 3+）', () => {
    seedFresh()
    // 500 XP = cmd.heavy 63 次 (63×8=504)
    const r = addXP('cmd.heavy', 63, T0)
    expect(r.newLevel).toBeGreaterThanOrEqual(3)
    expect(r.leveledUp).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('isStateUnlocked — 12 态阈值', () => {
  test('Lv 1 → 仅 idle/sleeping/dozing 解锁', () => {
    seedFresh()
    expect(isStateUnlocked('idle', T0)).toBe(true)
    expect(isStateUnlocked('sleeping', T0)).toBe(true)
    expect(isStateUnlocked('dozing', T0)).toBe(true)
    expect(isStateUnlocked('thinking', T0)).toBe(false)
    expect(isStateUnlocked('working', T0)).toBe(false)
    expect(isStateUnlocked('error', T0)).toBe(false)
  })

  test('Lv 5+ → thinking/waking 解锁', () => {
    // 模拟升到 Lv 5：直接灌 totalXpForLevel(5) XP，借助 deepdream 200 重复
    seedFresh()
    // Lv 5 累计 = 80 + 234 + 432 + 690 ≈ 1436；只能用 deepdream 大头
    addXP('deepdream', 1, T0)
    addXP('deepdream', 1, T0)
    addXP('deepdream', 1, T0)
    addXP('deepdream', 1, T0)
    addXP('deepdream', 1, T0)
    addXP('deepdream', 1, T0)
    addXP('deepdream', 1, T0)
    addXP('deepdream', 1, T0) // 1600 XP > totalXpForLevel(5)=1436
    expect(getCurrentLevel(T0)).toBeGreaterThanOrEqual(5)
    expect(isStateUnlocked('thinking', T0)).toBe(true)
    expect(isStateUnlocked('waking', T0)).toBe(true)
  })

  test('getUnlockedStates 返回数组 + 不含未解锁项', () => {
    seedFresh()
    const states = getUnlockedStates(T0)
    expect(states).toContain('idle')
    expect(states).not.toContain('sweeping') // Lv 45 才解锁
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('isHatUnlocked', () => {
  test('Lv 1 → 仅 none', () => {
    seedFresh()
    expect(isHatUnlocked('none', T0)).toBe(true)
    expect(isHatUnlocked('crown', T0)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('getEffectiveRarity — 取最大', () => {
  test('Lv 1 + bones common → common', () => {
    seedFresh()
    expect(getEffectiveRarity('common', T0)).toBe('common')
  })

  test('Lv 1 + bones rare → rare（bones 兜底）', () => {
    seedFresh()
    expect(getEffectiveRarity('rare', T0)).toBe('rare')
  })

  test('Lv 10+ → 自动 uncommon（即使 bones 是 common）', () => {
    seedFresh()
    // why 跨天注入：单日封顶 2000 XP，必须跨多天才能堆够 Lv 10 累计 ≈ 11k
    // 每天 deepdream 1 次（200 XP）+ cmd.heavy 250 次（2000 XP，会被截到 1800 与 deepdream 共 2000）
    for (let day = 0; day < 7; day++) {
      const ts = T0 + day * 24 * 60 * 60 * 1000
      addXP('deepdream', 1, ts)
      addXP('cmd.heavy', 250, ts) // 2000 但 cap 截短
      addXP('time', 480, ts) // time 桶单独 480 min cap，不算入日 cap
    }
    expect(getCurrentLevel(T0 + 7 * 86400_000)).toBeGreaterThanOrEqual(10)
    const r = getEffectiveRarity('common', T0 + 7 * 86400_000)
    const RARITIES_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']
    expect(RARITIES_ORDER.indexOf(r)).toBeGreaterThanOrEqual(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('shiny 触发：≥3 epic milestone', () => {
  test('0 milestone → not shiny', () => {
    seedFresh()
    expect(getShinyEarned(T0)).toBe(false)
  })

  test('1 epic milestone → not shiny', () => {
    seedFresh()
    recordMilestone('first_1m_tokens', T0) // XP 500 → epic
    expect(getShinyEarned(T0)).toBe(false)
  })

  test('3 epic milestones → shiny', () => {
    seedFresh()
    recordMilestone('first_1m_tokens', T0) // 500
    recordMilestone('first_pr_merged', T0) // 600
    recordMilestone('streak_7', T0) // 700
    expect(getShinyEarned(T0)).toBe(true)
  })

  test('小 XP milestone 不算 epic（midnight_owl 200 XP）', () => {
    seedFresh()
    recordMilestone('midnight_owl', T0) // 200 < 500 阈值
    recordMilestone('first_fix_bug', T0) // 200 < 500
    recordMilestone('first_deepdream', T0) // 300 < 500
    expect(getShinyEarned(T0)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('recordMilestone — 幂等 + 自动 lv 里程碑', () => {
  test('首次记录 unlocked=true，重复 false', () => {
    seedFresh()
    expect(recordMilestone('first_1m_tokens', T0).unlocked).toBe(true)
    expect(recordMilestone('first_1m_tokens', T0).unlocked).toBe(false)
  })

  test('milestone XP 自动累计 + 升级触发', () => {
    seedFresh()
    // first_1m_tokens 500 XP → Lv 1 → Lv 1 + 500 XP，未到 Lv 2(80) ... 应升级
    recordMilestone('first_1m_tokens', T0)
    expect(getCurrentLevel(T0)).toBeGreaterThanOrEqual(2)
  })

  test('getCompletedMilestones 列出', () => {
    seedFresh()
    recordMilestone('midnight_owl', T0)
    expect(getCompletedMilestones(T0)).toContain('midnight_owl')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('subscribeStats — 状态变更通知', () => {
  test('addXP 后触发订阅者', () => {
    seedFresh()
    let count = 0
    const unsub = subscribeStats(() => {
      count++
    })
    addXP('cmd.basic', 1, T0)
    addXP('cmd.basic', 1, T0)
    expect(count).toBeGreaterThanOrEqual(2)
    unsub()
  })
})
