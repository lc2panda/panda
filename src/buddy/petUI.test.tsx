// Input:  /buddy stats / milestones / info 子命令输出 + CompanionSprite + MiniPet 渲染纯函数
// Output: bun test 用例集 — Phase 0 P0-T5 UI 改动 6 项验收
// Pos:    src/buddy/petUI.test.tsx — Phase 0 agent-γ UI 验证
//         严守 anthropic byte-equal — 仅校 buddy 域；不动 services/api 或 oauth
// [NEW-FILE:#20260419-OD-04]
//
// 设计目标（Phase 0 P0-T5 DoD）：
//   1) /buddy stats 输出含 Level / XP / Rarity / Milestones 字段
//   2) /buddy milestones 输出 13 行（每个 milestone 一行）
//   3) CompanionSprite.tsx 源码含 Lv 字符串引用（usePetProgression + Lv 角标）
//   4) MiniPet Lv ≥ 10 显示数字 / Lv < 10 不显示（miniPetLevelBadge 纯函数）
//   5) /buddy info 兼容 — 旧 3 行存在 + 新增 Level 行
//   6) 升级触发 PetState='notification' — 通过 subscribeLevelUp + globalConfig.companionForcedState

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { miniPetLevelBadge, MINI_LEVEL_THRESHOLD } from './MiniPet.js'
import {
  __resetCacheForTesting,
  addXP,
  subscribeLevelUp,
} from './petXP.js'
import { createDefaultStats } from './petStats.js'
import { MILESTONES, totalXpForLevel } from './types.js'

// ─── 共享：临时配置目录 + globalConfig mock ───────────────────────────────────

let tmpDir: string
let savedEnv: { panda: string | undefined; claude: string | undefined }
let configState: Record<string, unknown> = {}
let savedDisplay: string | undefined
let savedResult: string | undefined

function resetState() {
  configState = {}
  savedDisplay = undefined
  savedResult = undefined
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-pet-ui-test-'))
  savedEnv = {
    panda: process.env.PANDA_CONFIG_DIR,
    claude: process.env.CLAUDE_CONFIG_DIR,
  }
  process.env.PANDA_CONFIG_DIR = tmpDir
  __resetCacheForTesting(null)
  resetState()
  // why mock bun:bundle: bun test 默认 feature() = false，会短路 /buddy stats / milestones / info 的进度路径
  //   mock 让 feature('BUDDY') 在测试中返回 true，命令完整跑通
  mock.module('bun:bundle', () => ({
    feature: (name: string) => name === 'BUDDY',
  }))
  // why mock.module: /buddy 命令体 await import('../utils/config.js') —
  //   mock 路径以"被测文件视角"为准（src/commands/buddy/index.ts → ../../utils/config.js）
  mock.module('../utils/config.js', () => ({
    getGlobalConfig: () => configState,
    saveGlobalConfig: (
      updater: (prev: Record<string, unknown>) => Record<string, unknown>,
    ) => {
      configState = updater(configState)
    },
  }))
  mock.module('../../utils/config.js', () => ({
    getGlobalConfig: () => configState,
    saveGlobalConfig: (
      updater: (prev: Record<string, unknown>) => Record<string, unknown>,
    ) => {
      configState = updater(configState)
    },
  }))
  mock.module('../../services/analytics/index.js', () => ({
    logEvent: () => {
      /* noop */
    },
  }))
  mock.module('../../buddy/companion.js', () => ({
    roll: (_userId: string) => ({
      bones: {
        species: 'duck',
        rarity: 'common',
        stats: {},
        eye: '·',
        hat: 'none',
        shiny: false,
      },
      inspirationSeed: 1,
    }),
    companionUserId: () => 'test-user',
  }))
})

afterEach(() => {
  __resetCacheForTesting(null)
  resetState()
  process.env.PANDA_CONFIG_DIR = savedEnv.panda
  process.env.CLAUDE_CONFIG_DIR = savedEnv.claude
  if (savedEnv.panda === undefined) delete process.env.PANDA_CONFIG_DIR
  if (savedEnv.claude === undefined) delete process.env.CLAUDE_CONFIG_DIR
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
  mock.restore()
})

const T0 = Date.UTC(2026, 3, 19, 8, 0, 0)

function seedFresh() {
  __resetCacheForTesting(createDefaultStats(T0))
}

async function runBuddy(args: string): Promise<{
  result: string | undefined
  display: string | undefined
}> {
  // why ?case= rotate: bun test 模块缓存绕开
  const mod = await import(
    `../commands/buddy/index.js?case=${Date.now()}-${Math.random()}`
  )
  const cmd = mod.default
  const onDone = (
    result?: string,
    options?: { display?: string },
  ) => {
    savedResult = result
    savedDisplay = options?.display
  }
  const context = {
    setAppState: (
      updater: (prev: Record<string, unknown>) => Record<string, unknown>,
    ) => {
      Object.assign({}, updater({}))
    },
    getAppState: () => ({}),
  } as never
  const loaded = await cmd.load()
  await loaded.call(onDone, context, args)
  return { result: savedResult, display: savedDisplay }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. /buddy stats — 输出含 Level / XP / Rarity / Milestones 字段
// ─────────────────────────────────────────────────────────────────────────────

describe('/buddy stats — Phase 0 P0-T5 新增', () => {
  test('输出含 Level / XP / Rarity / Milestones 关键字段', async () => {
    seedFresh()
    configState.companion = {
      name: 'Quack',
      species: 'duck',
      rarity: 'common',
      hatchedAt: T0,
    }
    const { result, display } = await runBuddy('stats')
    expect(display).toBe('system')
    expect(result).toBeDefined()
    const text = result ?? ''
    // 关键字段守护
    expect(text).toContain('Companion Progression')
    expect(text).toContain('Level:')
    expect(text).toContain('XP:')
    expect(text).toContain('Total XP:')
    expect(text).toContain('Today:')
    expect(text).toContain('Rarity:')
    expect(text).toContain('Shiny:')
    expect(text).toContain('Unlocked:')
    expect(text).toContain('Milestones')
    // 进度条字符
    expect(text).toMatch(/[▓░]/)
  })

  test('输出含全部 13 个 milestone 行（含完成标记 ✓ / □）', async () => {
    seedFresh()
    const { result } = await runBuddy('stats')
    const text = result ?? ''
    for (const id of MILESTONES) {
      expect(text).toContain(id)
    }
    // □ 必出现（pending）
    expect(text).toContain('□')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. /buddy milestones — 13 行详细清单（每个 milestone 一行）
// ─────────────────────────────────────────────────────────────────────────────

describe('/buddy milestones — Phase 0 P0-T5 新增', () => {
  test('输出 13 个 milestone 一一对应（每个 ID 独占一行）', async () => {
    seedFresh()
    const { result, display } = await runBuddy('milestones')
    expect(display).toBe('system')
    const text = result ?? ''
    // 每个 milestone ID 各占一行
    for (const id of MILESTONES) {
      expect(text).toContain(id)
    }
    // header + 13 milestone 行 = 14 行（split('\n')）
    const lines = text.split('\n')
    expect(lines.length).toBeGreaterThanOrEqual(MILESTONES.length + 1)
    // 每行带 hint（— 分隔）
    const milestoneLines = lines.filter(l => l.includes('  □') || l.includes('  ✓'))
    expect(milestoneLines.length).toBe(MILESTONES.length)
    for (const line of milestoneLines) {
      expect(line).toContain('—')
      expect(line).toContain('XP')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. CompanionSprite.tsx 源码守护 — Lv 字符串渲染 + usePetProgression 接入
// ─────────────────────────────────────────────────────────────────────────────

describe('CompanionSprite.tsx — Lv 角标接入守护', () => {
  test('源码 import { usePetProgression } from petXP.js', () => {
    const src = readFileSync(
      join(import.meta.dir, 'CompanionSprite.tsx'),
      'utf-8',
    )
    expect(src).toContain('usePetProgression')
    expect(src).toContain("from './petXP.js'")
  })

  test('源码含 `Lv ${progression.level}` 字符串模板', () => {
    const src = readFileSync(
      join(import.meta.dir, 'CompanionSprite.tsx'),
      'utf-8',
    )
    // 全屏分支 spriteColumn + 窄分支 narrow 都应有 Lv 字符串
    expect(src).toMatch(/Lv \$\{progression\.level\}/)
  })

  test('源码含 companionShowLevel 子开关读取', () => {
    const src = readFileSync(
      join(import.meta.dir, 'CompanionSprite.tsx'),
      'utf-8',
    )
    expect(src).toContain('companionShowLevel')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. MiniPet — Lv ≥ 10 显示数字 / Lv < 10 不显示（miniPetLevelBadge 纯函数）
// ─────────────────────────────────────────────────────────────────────────────

describe('miniPetLevelBadge — Lv 数字角标阈值', () => {
  test('阈值常量 = 10', () => {
    expect(MINI_LEVEL_THRESHOLD).toBe(10)
  })

  test('Lv < 10 → 空字符串（不显示数字）', () => {
    for (let lv = 1; lv < 10; lv++) {
      expect(miniPetLevelBadge(lv)).toBe('')
    }
  })

  test('Lv = 10 → "10"（首次显示）', () => {
    expect(miniPetLevelBadge(10)).toBe('10')
  })

  test('Lv ≥ 10 各档位 → 字符串数字', () => {
    expect(miniPetLevelBadge(12)).toBe('12')
    expect(miniPetLevelBadge(25)).toBe('25')
    expect(miniPetLevelBadge(60)).toBe('60')
  })

  test('非法/非有限 → 空字符串（防御）', () => {
    expect(miniPetLevelBadge(0)).toBe('')
    expect(miniPetLevelBadge(-5)).toBe('')
    expect(miniPetLevelBadge(NaN)).toBe('')
    expect(miniPetLevelBadge(Infinity)).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. /buddy info — 兼容性：旧 3 行 byte-equal + 新增 Level 行
// ─────────────────────────────────────────────────────────────────────────────

describe('/buddy info — 兼容旧 3 行 + 新增 Level/XP/Unlocks', () => {
  test('旧 3 行（Species/Name/Rarity）byte-equal 存在 + 新增 Level 行', async () => {
    seedFresh()
    configState.companion = {
      name: 'Bamboo',
      species: 'duck',
      rarity: 'rare',
      hatchedAt: T0,
    }
    const { result, display } = await runBuddy('info')
    expect(display).toBe('system')
    const text = result ?? ''
    // 旧 3 行 byte-equal 守护（与 buddy.test.ts 一致）
    expect(text).toMatch(/^Your companion:\n {2}Species: duck/)
    expect(text).toContain('Name: Bamboo')
    expect(text).toContain('Rarity: rare')
    // 新增 Level/XP/Unlocks 行
    expect(text).toContain('Level:')
    expect(text).toContain('XP:')
    expect(text).toContain('Unlocks:')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. 升级反馈 — subscribeLevelUp 触发 + 可观察 from→to 数值
// ─────────────────────────────────────────────────────────────────────────────

describe('升级反馈 — subscribeLevelUp 触发', () => {
  test('addXP 触发升级 → subscribeLevelUp 回调 from=1 to≥2', () => {
    seedFresh()
    let captured: { from: number; to: number } | null = null
    const unsub = subscribeLevelUp((from, to) => {
      captured = { from, to }
    })
    try {
      // L=1 需 80 XP 升 L=2 — 100 XP（cmd.heavy 13 次）触发
      addXP('cmd.heavy', 13, T0) // 13 × 8 = 104 XP > 80
      expect(captured).not.toBeNull()
      expect(captured!.from).toBe(1)
      expect(captured!.to).toBeGreaterThanOrEqual(2)
    } finally {
      unsub()
    }
  })

  test('CompanionSprite.tsx 源码含 subscribeLevelUp + companionForcedState=notification', () => {
    const src = readFileSync(
      join(import.meta.dir, 'CompanionSprite.tsx'),
      'utf-8',
    )
    expect(src).toContain('subscribeLevelUp')
    expect(src).toContain("companionForcedState: 'notification'")
    // 1.5s TTL 守护（注释或常量）
    expect(src).toContain('1_500')
  })
})

// noop 守护避免 unused 报错
void totalXpForLevel
