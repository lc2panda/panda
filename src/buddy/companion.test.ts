// Input:  src/buddy/companion.ts 公共 API roll / rollWithSeed / companionUserId / getCompanion
// Output: 8 测试用例 — PRNG 决定性 / cache / userId 优先级 / forced species / soul 合并
// Pos:    W10-T1 covers 0% module — 养成系统 PRNG 装配核心
//         严守 anthropic byte-equal — 仅 node 内置 + 自家模块
//
// [NEW-FILE:#20260420-W10-T1-01]

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { saveGlobalConfig } from '../utils/config.js'
import {
  companionUserId,
  getCompanion,
  roll,
  rollWithSeed,
} from './companion.js'
import {
  EYES,
  HATS,
  RARITIES,
  SPECIES,
  STAT_NAMES,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 夹具 — 保存/恢复 globalConfig 关键字段，避免污染相邻测试
// ─────────────────────────────────────────────────────────────────────────────

let savedOauth: unknown
let savedUserId: string | undefined
let savedThirdParty: unknown
let savedCompanion: unknown
let savedForcedSpecies: unknown

beforeEach(() => {
  // why: TEST_GLOBAL_CONFIG_FOR_TESTING 在 NODE_ENV=test 下被 saveGlobalConfig 覆盖
  //   — 我们读快照前先存当前态，afterEach 恢复
  saveGlobalConfig(c => {
    savedOauth = (c as Record<string, unknown>).oauthAccount
    savedUserId = (c as Record<string, unknown>).userID as string | undefined
    savedThirdParty = (c as Record<string, unknown>).thirdPartyProvider
    savedCompanion = (c as Record<string, unknown>).companion
    savedForcedSpecies = (c as Record<string, unknown>).companionForcedSpecies
    return {
      ...c,
      oauthAccount: undefined,
      userID: undefined,
      thirdPartyProvider: undefined,
      companion: undefined,
      companionForcedSpecies: undefined,
    } as typeof c
  })
})

afterEach(() => {
  saveGlobalConfig(
    c =>
      ({
        ...c,
        oauthAccount: savedOauth,
        userID: savedUserId,
        thirdPartyProvider: savedThirdParty,
        companion: savedCompanion,
        companionForcedSpecies: savedForcedSpecies,
      }) as typeof c,
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 1：roll 决定性 — 同 userId 多次调返回 byte-equal 结果（cache + PRNG 双重保证）
// ─────────────────────────────────────────────────────────────────────────────

describe('roll · 决定性 PRNG', () => {
  test('同 userId 两次 roll → byte-equal（cache 命中）', () => {
    const a = roll('test-user-deterministic-001')
    const b = roll('test-user-deterministic-001')
    // why: cache 内部直接 return value，同一引用
    expect(a).toBe(b)
    expect(a.bones.species).toBe(b.bones.species)
    expect(a.bones.rarity).toBe(b.bones.rarity)
    expect(a.bones.eye).toBe(b.bones.eye)
    expect(a.bones.hat).toBe(b.bones.hat)
    expect(a.bones.shiny).toBe(b.bones.shiny)
    expect(a.inspirationSeed).toBe(b.inspirationSeed)
  })

  test('不同 userId → 不同 inspirationSeed（PRNG 派生）', () => {
    const a = roll('user-a-distinct')
    const b = roll('user-b-distinct')
    // why: 两个不同 hash 输入派生的 PRNG 不可能产生相同 seed（碰撞概率 ~1/4G）
    expect(a.inspirationSeed).not.toBe(b.inspirationSeed)
  })

  test('roll 输出字段 schema 完整 — bones.{rarity,species,eye,hat,shiny,stats}', () => {
    const r = roll('schema-check-user')
    expect(RARITIES).toContain(r.bones.rarity)
    expect(SPECIES).toContain(r.bones.species)
    expect(EYES).toContain(r.bones.eye)
    expect(HATS).toContain(r.bones.hat)
    expect(typeof r.bones.shiny).toBe('boolean')
    expect(typeof r.inspirationSeed).toBe('number')
    // stats 必须含 5 维 + 各值 ∈ [1,100]
    for (const stat of STAT_NAMES) {
      expect(typeof r.bones.stats[stat]).toBe('number')
      expect(r.bones.stats[stat]).toBeGreaterThanOrEqual(1)
      expect(r.bones.stats[stat]).toBeLessThanOrEqual(100)
    }
  })

  test('rarity=common → hat 必然为 none（业务规则）', () => {
    // why: companion.ts:101 hat = rarity === 'common' ? 'none' : pick(...)
    //   遍历足够多 userId 找到 common 验证规则
    let foundCommon = false
    for (let i = 0; i < 100 && !foundCommon; i++) {
      const r = rollWithSeed(`hat-rule-test-seed-${i}`)
      if (r.bones.rarity === 'common') {
        expect(r.bones.hat).toBe('none')
        foundCommon = true
      }
    }
    expect(foundCommon).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 2：rollWithSeed 决定性 — 同 seed 两次 roll byte-equal（不走 cache）
// ─────────────────────────────────────────────────────────────────────────────

describe('rollWithSeed · 跳过 cache 的决定性', () => {
  test('同 seed 两次 rollWithSeed → byte-equal（绕过 cache，纯 PRNG）', () => {
    const s = 'fixed-seed-for-snapshot-test'
    const a = rollWithSeed(s)
    const b = rollWithSeed(s)
    // why: rollWithSeed 不进 cache，每次重新走 mulberry32(hashString(s))
    //   PRNG 决定性必须保证 byte-equal
    expect(a.bones).toEqual(b.bones)
    expect(a.inspirationSeed).toBe(b.inspirationSeed)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 3：companionUserId — oauthAccount.accountUuid 优先
// ─────────────────────────────────────────────────────────────────────────────

describe('companionUserId · 三级回退优先级', () => {
  test('oauthAccount.accountUuid 存在 → 用 oauth uuid', () => {
    saveGlobalConfig(
      c =>
        ({
          ...c,
          oauthAccount: { accountUuid: 'oauth-uuid-priority-test' },
          userID: 'fallback-uid-should-be-ignored',
          thirdPartyProvider: { apiKey: 'sk-ignored' },
        }) as typeof c,
    )
    expect(companionUserId()).toBe('oauth-uuid-priority-test')
  })

  test('无 oauth 但 userID 存在 → 用 userID', () => {
    saveGlobalConfig(
      c =>
        ({
          ...c,
          oauthAccount: undefined,
          userID: 'plain-user-id-1234',
          thirdPartyProvider: { apiKey: 'sk-ignored' },
        }) as typeof c,
    )
    expect(companionUserId()).toBe('plain-user-id-1234')
  })

  test('仅 thirdPartyProvider.apiKey → 派生 tp- 前缀 hash', () => {
    saveGlobalConfig(
      c =>
        ({
          ...c,
          oauthAccount: undefined,
          userID: undefined,
          thirdPartyProvider: { apiKey: 'sk-test-third-party-key' },
        }) as typeof c,
    )
    const id = companionUserId()
    expect(id.startsWith('tp-')).toBe(true)
    expect(id.length).toBeGreaterThan(3)
    // 决定性：同 apiKey 两次调用应返回相同 id
    expect(companionUserId()).toBe(id)
  })

  test('全空 → anon', () => {
    // beforeEach 已清空所有字段
    expect(companionUserId()).toBe('anon')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 4：getCompanion — 无 stored → undefined；存在 → 合并 bones+soul；
//   companionForcedSpecies → 覆盖 species
// ─────────────────────────────────────────────────────────────────────────────

describe('getCompanion · bones+soul 合并 + forced species 覆盖', () => {
  test('无 config.companion → undefined', () => {
    expect(getCompanion()).toBeUndefined()
  })

  test('config.companion 存在 → 合并 bones（PRNG）+ soul（stored）', () => {
    saveGlobalConfig(
      c =>
        ({
          ...c,
          userID: 'merge-test-user',
          companion: {
            name: 'TestyMcTestface',
            personality: 'curious and snarky',
            hatchedAt: 1700000000000,
          },
        }) as typeof c,
    )
    const comp = getCompanion()
    expect(comp).toBeDefined()
    // soul 字段保留
    expect(comp?.name).toBe('TestyMcTestface')
    expect(comp?.personality).toBe('curious and snarky')
    expect(comp?.hatchedAt).toBe(1700000000000)
    // bones 字段被 PRNG 覆盖（来自 roll('merge-test-user' + SALT)）
    expect(comp?.species).toBeDefined()
    expect(SPECIES).toContain(comp!.species)
    expect(RARITIES).toContain(comp!.rarity)
  })

  test('companionForcedSpecies 设置 → 覆盖 PRNG 派生的 species', () => {
    saveGlobalConfig(
      c =>
        ({
          ...c,
          userID: 'forced-species-test-user',
          companion: {
            name: 'ForcedTest',
            personality: 'overridden',
            hatchedAt: 1700000000000,
          },
          companionForcedSpecies: 'dragon',
        }) as typeof c,
    )
    const comp = getCompanion()
    expect(comp).toBeDefined()
    expect(comp?.species).toBe('dragon')
    // 其他 bones 字段保留
    expect(RARITIES).toContain(comp!.rarity)
    expect(EYES).toContain(comp!.eye)
  })
})
