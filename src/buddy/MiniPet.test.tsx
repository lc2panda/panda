// Input:  MINI_FACES 字符表 + shouldRenderMiniPetFor() 隐藏判定
// Output: bun test 用例集 — 12 态字符完整性 / 长度恒等 / 隐藏条件 / 物种 gate
// Pos:    panda 形象宠物 D3 P4-T3 — MiniPet 单元测试 [NEW-FILE:#20260419-AB-06]
//
// 一旦本测试或 src/buddy/MiniPet.tsx 被修改，请同步更新 src/buddy/README.md 的 mini-pet 章节。
//
// 设计目标（D3 DoD）：
//   - 12 态字符表完整且非空
//   - 每个 face 长度恒等 = 5（StatusLine 单行布局稳定）
//   - companionMuted=true / companionMiniPet=false / 非 panda 物种 / 无 companion → 不渲染
//
// 注意：feature('BUDDY') 在 bun test 下默认 false，组件本体永远 null；
//   测试主要走纯函数 shouldRenderMiniPetFor + getMiniFace + MINI_FACES，
//   绕开 React 渲染管线（项目其他测试如 sprites.panda.test.ts 同此风格）。

import { describe, expect, test } from 'bun:test'
import {
  getMiniFace,
  MINI_FACE_LENGTH,
  MINI_FACES,
  MINI_PET_COLORS,
  shouldRenderMiniPetFor,
} from './MiniPet.js'
import {
  duck,
  goose,
  kungFuPanda,
  panda,
  PANDA_SPECIES,
  PET_STATES,
  redPanda,
  type Species,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 1. MINI_FACES 字符表完整性 + 长度恒等（核心 DoD）
// ─────────────────────────────────────────────────────────────────────────────

describe('MINI_FACES 字符表', () => {
  test('12 态全部就位（与 PET_STATES 同步）', () => {
    for (const state of PET_STATES) {
      expect(typeof MINI_FACES[state]).toBe('string')
    }
    expect(Object.keys(MINI_FACES)).toHaveLength(12)
  })

  test('每个 face 非空字符串', () => {
    for (const state of PET_STATES) {
      expect(MINI_FACES[state].length).toBeGreaterThan(0)
    }
  })

  for (const state of PET_STATES) {
    test(`face[${state}] 长度恒等 = ${MINI_FACE_LENGTH}`, () => {
      expect(MINI_FACES[state]).toHaveLength(MINI_FACE_LENGTH)
    })
  }

  test('所有 12 face 长度全部 = 5（汇总自验）', () => {
    const lens = PET_STATES.map(s => MINI_FACES[s].length)
    const unique = new Set(lens)
    expect(unique.size).toBe(1)
    expect([...unique][0]).toBe(MINI_FACE_LENGTH)
  })

  test('所有 face 以 ( 开头并以 ) 结尾（视觉锚点）', () => {
    for (const state of PET_STATES) {
      expect(MINI_FACES[state].startsWith('(')).toBe(true)
      expect(MINI_FACES[state].endsWith(')')).toBe(true)
    }
  })

  test('MINI_FACES key 集合 = PET_STATES（无遗漏 / 无多余）', () => {
    const faceKeys = Object.keys(MINI_FACES).sort()
    const stateKeys = [...PET_STATES].sort()
    expect(faceKeys).toEqual(stateKeys)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. getMiniFace 纯函数 — 与 MINI_FACES 等价
// ─────────────────────────────────────────────────────────────────────────────

describe('getMiniFace', () => {
  for (const state of PET_STATES) {
    test(`getMiniFace(${state}) === MINI_FACES[${state}]`, () => {
      expect(getMiniFace(state)).toBe(MINI_FACES[state])
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. MINI_PET_COLORS — panda 系 3 物种映射
// ─────────────────────────────────────────────────────────────────────────────

describe('MINI_PET_COLORS', () => {
  test('panda → white', () => {
    expect(MINI_PET_COLORS[panda]).toBe('white')
  })
  test('redPanda → red', () => {
    expect(MINI_PET_COLORS[redPanda]).toBe('red')
  })
  test('kungFuPanda → yellow', () => {
    expect(MINI_PET_COLORS[kungFuPanda]).toBe('yellow')
  })
  test('PANDA_SPECIES 3 个全部覆盖', () => {
    for (const s of PANDA_SPECIES) {
      expect(MINI_PET_COLORS[s]).toBeDefined()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. shouldRenderMiniPetFor — 隐藏条件全集（注入版纯函数，无 fs 副作用）
// ─────────────────────────────────────────────────────────────────────────────

const PANDA_COMPANION = { species: panda } as { species: Species }
const RED_PANDA_COMPANION = { species: redPanda } as { species: Species }
const KUNG_FU_COMPANION = { species: kungFuPanda } as { species: Species }
const DUCK_COMPANION = { species: duck } as { species: Species }
const GOOSE_COMPANION = { species: goose } as { species: Species }

describe('shouldRenderMiniPetFor — 隐藏条件', () => {
  test('无 companion → 不渲染', () => {
    expect(shouldRenderMiniPetFor(undefined, {})).toBe(false)
    expect(
      shouldRenderMiniPetFor(undefined, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(false)
  })

  test('companionMuted=true → 不渲染（即便 panda companion 存在）', () => {
    expect(
      shouldRenderMiniPetFor(PANDA_COMPANION, {
        companionMuted: true,
        companionMiniPet: true,
      }),
    ).toBe(false)
  })

  test('companionMiniPet=false → 不渲染（子 flag 回滚通道）', () => {
    expect(
      shouldRenderMiniPetFor(PANDA_COMPANION, {
        companionMuted: false,
        companionMiniPet: false,
      }),
    ).toBe(false)
  })

  test('companionMiniPet=undefined（默认）→ 视作 true，不被短路', () => {
    expect(
      shouldRenderMiniPetFor(PANDA_COMPANION, {
        companionMuted: false,
        // companionMiniPet 未设置
      }),
    ).toBe(true)
  })

  test('panda companion + 全开 → 渲染', () => {
    expect(
      shouldRenderMiniPetFor(PANDA_COMPANION, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(true)
  })

  test('redPanda companion + 全开 → 渲染', () => {
    expect(
      shouldRenderMiniPetFor(RED_PANDA_COMPANION, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(true)
  })

  test('kungFuPanda companion + 全开 → 渲染', () => {
    expect(
      shouldRenderMiniPetFor(KUNG_FU_COMPANION, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(true)
  })

  test('非 panda 物种（duck）→ 不渲染（即便全开）', () => {
    expect(
      shouldRenderMiniPetFor(DUCK_COMPANION, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(false)
  })

  test('非 panda 物种（goose）→ 不渲染', () => {
    expect(
      shouldRenderMiniPetFor(GOOSE_COMPANION, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(false)
  })

  test('全空 config → panda 系仍渲染（默认值兜底）', () => {
    expect(shouldRenderMiniPetFor(PANDA_COMPANION, {})).toBe(true)
  })
})
