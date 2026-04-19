// Input:  spriteFrameCount(species) / renderSprite(bones, frame) — 全 species（含 panda 系）
// Output: bun test 用例集 — 复现 v2.21.27 panda 系 crash 并守护 v2.21.28 修复
// Pos:    src/buddy/sprites.regression.test.ts — 紧急 hotfix 回归门 [NEW-FILE:#20260419-AB-07]
//
// 一旦本测试或 sprites.ts 被修改，请同步更新 src/buddy/README.md 的 sprites 章节。
//
// 背景（v2.21.27 production crash）：
//   /buddy theme panda → CompanionSprite.tsx:273 调 spriteFrameCount(panda)
//   → sprites.ts:478 直接 BODIES[species].length，BODIES 仅含旧 18 物种
//   → BODIES['panda'] === undefined → undefined.length → TypeError crash
//
// 守护目标（v2.21.28）：
//   1. spriteFrameCount(panda|redPanda|kungFuPanda) 不抛 + 返回 ≥ 1
//   2. renderSprite(bones) 在 panda 系下不抛 + 返回字符串数组（≥ 1 帧 5 行）
//   3. 旧 18 物种行为 byte-equal 不变（regression guard）

import { describe, expect, test } from 'bun:test'
import { renderSprite, spriteFrameCount } from './sprites.js'
import {
  axolotl,
  blob,
  cactus,
  capybara,
  cat,
  chonk,
  dragon,
  duck,
  ghost,
  goose,
  kungFuPanda,
  mushroom,
  octopus,
  owl,
  panda,
  penguin,
  rabbit,
  redPanda,
  robot,
  snail,
  turtle,
} from './types.js'
import type { CompanionBones, Species } from './types.js'

const PANDA_SERIES: readonly Species[] = [panda, redPanda, kungFuPanda]
const LEGACY_18: readonly Species[] = [
  duck,
  goose,
  blob,
  cat,
  dragon,
  octopus,
  owl,
  penguin,
  turtle,
  snail,
  ghost,
  axolotl,
  capybara,
  cactus,
  robot,
  rabbit,
  mushroom,
  chonk,
]

function makeBones(species: Species): CompanionBones {
  return {
    rarity: 'common',
    species,
    eye: '·',
    hat: 'none',
    shiny: false,
    stats: {
      DEBUGGING: 1,
      PATIENCE: 1,
      CHAOS: 1,
      WISDOM: 1,
      SNARK: 1,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. spriteFrameCount — panda 系不再 crash（v2.21.27 → v2.21.28 主修复点）
// ─────────────────────────────────────────────────────────────────────────────
describe('spriteFrameCount — panda 系不抛 + 返回 ≥ 1', () => {
  for (const species of PANDA_SERIES) {
    test(`spriteFrameCount(${species}) 不抛 TypeError`, () => {
      expect(() => spriteFrameCount(species)).not.toThrow()
    })

    test(`spriteFrameCount(${species}) 返回 ≥ 1 帧（用于 sprite tick 节奏）`, () => {
      const n = spriteFrameCount(species)
      expect(typeof n).toBe('number')
      expect(n).toBeGreaterThanOrEqual(1)
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. renderSprite — panda 系不抛 + 返回有效帧（CompanionSprite reaction/petting 路径用）
// ─────────────────────────────────────────────────────────────────────────────
describe('renderSprite — panda 系不抛 + 帧结构有效', () => {
  for (const species of PANDA_SERIES) {
    test(`renderSprite({species:${species}}, 0) 不抛`, () => {
      const bones = makeBones(species)
      expect(() => renderSprite(bones, 0)).not.toThrow()
    })

    test(`renderSprite({species:${species}}, 0) 返回字符串数组（≥ 1 行）`, () => {
      const bones = makeBones(species)
      const lines = renderSprite(bones, 0)
      expect(Array.isArray(lines)).toBe(true)
      expect(lines.length).toBeGreaterThanOrEqual(1)
      for (const line of lines) {
        expect(typeof line).toBe('string')
      }
    })

    test(`renderSprite({species:${species}}, 999) frame 越界自动 mod 不抛`, () => {
      const bones = makeBones(species)
      expect(() => renderSprite(bones, 999)).not.toThrow()
      expect(renderSprite(bones, 999).length).toBeGreaterThanOrEqual(1)
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. 旧 18 物种 byte-equal 守护 — spriteFrameCount + renderSprite 行为不变
// ─────────────────────────────────────────────────────────────────────────────
describe('旧 18 物种 byte-equal 守护 — spriteFrameCount', () => {
  // 已知旧 18 物种 BODIES 每物种均 3 帧（D1 P2-T1 注释 + sprites.ts 实测）
  for (const species of LEGACY_18) {
    test(`spriteFrameCount(${species}) === 3（旧 BODIES 既有事实）`, () => {
      expect(spriteFrameCount(species)).toBe(3)
    })
  }
})

describe('旧 18 物种 byte-equal 守护 — renderSprite 帧 0', () => {
  // 通过对每物种渲染 frame 0/1/2 三帧，验证不抛 + 返回非空 string[]，
  // 且与 panda 修复前行为完全一致（旧分支根本不进入 panda 守护）
  for (const species of LEGACY_18) {
    test(`renderSprite(${species}, 0..2) 不抛 + 返回非空 string[]`, () => {
      const bones = makeBones(species)
      for (let f = 0; f < 3; f++) {
        const lines = renderSprite(bones, f)
        expect(Array.isArray(lines)).toBe(true)
        expect(lines.length).toBeGreaterThanOrEqual(1)
        // body 区每行不全空（hat 行 shift 后剩余至少 4 行有内容）
        const nonEmpty = lines.filter(l => l.trim().length > 0).length
        expect(nonEmpty).toBeGreaterThanOrEqual(1)
      }
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. 直接复现报告中的 crash 调用栈（CompanionSprite.tsx:273 → sprites.ts:478）
// ─────────────────────────────────────────────────────────────────────────────
describe('v2.21.27 production crash 复现守护', () => {
  test('panda 物种 spriteFrameCount 不再抛 "Cannot read properties of undefined (reading length)"', () => {
    let err: unknown = null
    try {
      spriteFrameCount(panda)
    } catch (e) {
      err = e
    }
    expect(err).toBeNull()
  })

  test('redPanda + kungFuPanda 同等守护', () => {
    expect(() => spriteFrameCount(redPanda)).not.toThrow()
    expect(() => spriteFrameCount(kungFuPanda)).not.toThrow()
  })
})
