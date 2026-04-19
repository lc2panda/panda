// Input:  MINI_FACES 字符表 + shouldRenderMiniPetFor() 隐藏判定
// Output: bun test 用例集 — 12 态字符完整性 / 长度恒等 / 隐藏条件 / 18 物种通用渲染
// Pos:    A+B 项目精华 — MiniPet 单元测试 [NEW-FILE:#20260419-AB-06]
//         v2.21.30 方向 A：物种 gate 移除（18 物种均可渲染），保留隐藏条件 3 项
//
// 一旦本测试或 src/buddy/MiniPet.tsx 被修改，请同步更新 src/buddy/README.md 的 mini-pet 章节。
//
// 设计目标（D3 DoD）：
//   - 12 态字符表完整且非空
//   - 每个 face 长度恒等 = 5（StatusLine 单行布局稳定）
//   - companionMuted=true / companionMiniPet=false / 无 companion → 不渲染
//   - 18 物种全部走渲染路径（v2.21.30 方向 A：panda 系实装退役后无物种 gate）
//
// 注意：feature('BUDDY') 在 bun test 下默认 false，组件本体永远 null；
//   测试主要走纯函数 shouldRenderMiniPetFor + getMiniFace + MINI_FACES，
//   绕开 React 渲染管线。

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
  PET_STATES,
  SPECIES,
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
// 3. MINI_PET_COLORS — 18 物种全集映射（v2.21.30 方向 A）
// ─────────────────────────────────────────────────────────────────────────────

describe('MINI_PET_COLORS — 18 物种全集', () => {
  test('SPECIES 18 物种全部就位', () => {
    expect(SPECIES.length).toBe(18)
    for (const s of SPECIES) {
      expect(MINI_PET_COLORS[s]).toBeDefined()
      expect(typeof MINI_PET_COLORS[s]).toBe('string')
    }
  })

  test('MINI_PET_COLORS key 数 = 18（无遗漏 / 无多余）', () => {
    expect(Object.keys(MINI_PET_COLORS)).toHaveLength(18)
  })

  // 抽样验证几个代表物种保证常量稳定
  test('duck → yellow', () => {
    expect(MINI_PET_COLORS[duck]).toBe('yellow')
  })
  test('robot → cyan', () => {
    expect(MINI_PET_COLORS.robot).toBe('cyan')
  })
  test('chonk → white', () => {
    expect(MINI_PET_COLORS.chonk).toBe('white')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. shouldRenderMiniPetFor — 隐藏条件全集（注入版纯函数，无 fs 副作用）
// ─────────────────────────────────────────────────────────────────────────────

const DUCK_COMPANION = { species: duck } as { species: Species }
const GOOSE_COMPANION = { species: goose } as { species: Species }
const ROBOT_COMPANION = { species: 'robot' as Species } as { species: Species }
const CHONK_COMPANION = { species: 'chonk' as Species } as { species: Species }

describe('shouldRenderMiniPetFor — 隐藏条件（v2.21.30 方向 A）', () => {
  test('无 companion → 不渲染', () => {
    expect(shouldRenderMiniPetFor(undefined, {})).toBe(false)
    expect(
      shouldRenderMiniPetFor(undefined, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(false)
  })

  test('companionMuted=true → 不渲染（即便 companion 存在）', () => {
    expect(
      shouldRenderMiniPetFor(DUCK_COMPANION, {
        companionMuted: true,
        companionMiniPet: true,
      }),
    ).toBe(false)
  })

  test('companionMiniPet=false → 不渲染（子 flag 回滚通道）', () => {
    expect(
      shouldRenderMiniPetFor(DUCK_COMPANION, {
        companionMuted: false,
        companionMiniPet: false,
      }),
    ).toBe(false)
  })

  test('companionMiniPet=undefined（默认）→ 视作 true，不被短路', () => {
    expect(
      shouldRenderMiniPetFor(DUCK_COMPANION, {
        companionMuted: false,
        // companionMiniPet 未设置
      }),
    ).toBe(true)
  })

  // v2.21.30 方向 A：18 物种均渲染（旧"非 panda 系→不渲染"行为已退役）
  test('duck companion + 全开 → 渲染', () => {
    expect(
      shouldRenderMiniPetFor(DUCK_COMPANION, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(true)
  })

  test('goose companion + 全开 → 渲染（v2.21.30 方向 A：物种 gate 移除）', () => {
    expect(
      shouldRenderMiniPetFor(GOOSE_COMPANION, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(true)
  })

  test('robot companion + 全开 → 渲染', () => {
    expect(
      shouldRenderMiniPetFor(ROBOT_COMPANION, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(true)
  })

  test('chonk companion + 全开 → 渲染', () => {
    expect(
      shouldRenderMiniPetFor(CHONK_COMPANION, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(true)
  })

  test('全空 config → 任意物种仍渲染（默认值兜底）', () => {
    expect(shouldRenderMiniPetFor(DUCK_COMPANION, {})).toBe(true)
    expect(shouldRenderMiniPetFor(ROBOT_COMPANION, {})).toBe(true)
  })

  // 18 物种全集守护：循环验证全部渲染
  test('18 物种 + 全开 → 全部渲染（无任何物种 gate）', () => {
    for (const s of SPECIES) {
      const companion = { species: s } as { species: Species }
      expect(
        shouldRenderMiniPetFor(companion, {
          companionMuted: false,
          companionMiniPet: true,
        }),
      ).toBe(true)
    }
  })
})
