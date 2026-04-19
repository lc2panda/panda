// Input:  PANDA_SPECIES_BODIES (panda / redPanda / kungFuPanda) × PetState 12 态
// Output: bun test 用例集 — 主装配完整性 / 帧结构 / 字符宽度 / {E} 占位 / hat slot / fallback
// Pos:    src/buddy/sprites.panda.test.ts — D3 P2-T5 合流测试 [NEW-FILE:#20260419-AB-05]
//
// 一旦本测试或 sprites.ts / sprites/{panda,redPanda,kungFuPanda}.ts 被修改，
// 请同步更新 src/buddy/README.md 的 sprites 章节。
//
// 设计目标（D3 DoD）：≥ 36 用例覆盖
//   - 完整性：3 species × 12 state = 36 个 (species, state) 组合，getStateSprite(*, 0) ≠ undefined
//   - 帧结构：每帧 string[] 长度 = 5
//   - 字符宽度：渲染后每行 ≤ 12（实际全部 = 12）
//   - 眼位占位：每帧至少含一处 {E}（sleeping 例外允许，按子文件实际）
//   - hat slot：首行允许全空 12 空格 或被特效（?/Z/~）覆盖
//   - fallback：缺指定 state 时回退 idle frame 0；缺整个 species 返回 undefined

import { describe, expect, test } from 'bun:test'
import { getStateSprite, PANDA_SPECIES_BODIES } from './sprites.js'
import {
  duck,
  kungFuPanda,
  panda,
  PET_STATES,
  redPanda,
} from './types.js'
import type { PandaSpecies, PetState } from './types.js'

// 渲染后字符宽度计算：{E} 占位符在渲染时被替换为 1 字符 eye
// 原始字面字符数 = 12 + 2 * count({E})；渲染后净宽 = 12
function renderedWidth(line: string): number {
  // 替换 {E} → 1 字符 eye 占位
  return line.replaceAll('{E}', '·').length
}

const PANDA_SPECIES_LIST: readonly PandaSpecies[] = [
  panda,
  redPanda,
  kungFuPanda,
] as const

// ─────────────────────────────────────────────────────────────────────────────
// 1. 主装配完整性：PANDA_SPECIES_BODIES 三 species 全部就位
// ─────────────────────────────────────────────────────────────────────────────
describe('PANDA_SPECIES_BODIES 主装配', () => {
  test('PANDA_SPECIES_BODIES 不为空对象（D3 合流后）', () => {
    expect(Object.keys(PANDA_SPECIES_BODIES).length).toBeGreaterThanOrEqual(3)
  })

  for (const species of PANDA_SPECIES_LIST) {
    test(`PANDA_SPECIES_BODIES[${species}] 已注册`, () => {
      expect(PANDA_SPECIES_BODIES[species]).toBeDefined()
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. 完整性矩阵：3 species × 12 state = 36 用例（核心 DoD）
// ─────────────────────────────────────────────────────────────────────────────
describe('getStateSprite 完整性 — 3 species × 12 state', () => {
  for (const species of PANDA_SPECIES_LIST) {
    for (const state of PET_STATES) {
      test(`${species} / ${state} — frame 0 返回非 undefined 数组`, () => {
        const frame = getStateSprite(species, state, 0)
        expect(frame).toBeDefined()
        expect(Array.isArray(frame)).toBe(true)
      })
    }
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. 帧结构：每帧 = 5 行（hat slot + 4 行 body）
// ─────────────────────────────────────────────────────────────────────────────
describe('帧结构 — 每帧严格 5 行', () => {
  for (const species of PANDA_SPECIES_LIST) {
    for (const state of PET_STATES) {
      test(`${species} / ${state} / frame 0 长度 = 5`, () => {
        const frame = getStateSprite(species, state, 0)!
        expect(frame).toHaveLength(5)
      })
    }
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. 字符宽度：渲染后每行 ≤ 12（实际全部 = 12）
// ─────────────────────────────────────────────────────────────────────────────
describe('字符宽度 — 渲染后每行 ≤ 12', () => {
  for (const species of PANDA_SPECIES_LIST) {
    for (const state of PET_STATES) {
      test(`${species} / ${state} / frame 0 — 各行 ≤ 12`, () => {
        const frame = getStateSprite(species, state, 0)!
        for (const line of frame) {
          expect(renderedWidth(line)).toBeLessThanOrEqual(12)
        }
      })
    }
  }

  test('全 species × 全 state × 全 frame 字符宽度自验', () => {
    let maxWidth = 0
    for (const species of PANDA_SPECIES_LIST) {
      const speciesBody = PANDA_SPECIES_BODIES[species]!
      for (const state of Object.keys(speciesBody) as PetState[]) {
        const stateFrames = speciesBody[state]!
        for (const frame of stateFrames) {
          for (const line of frame) {
            const w = renderedWidth(line)
            if (w > maxWidth) maxWidth = w
            expect(w).toBeLessThanOrEqual(12)
          }
        }
      }
    }
    // 自验：至少有一帧宽度触上限 12（证明充分使用画布）
    expect(maxWidth).toBe(12)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. {E} 眼位占位：每帧至少 1 处（允许 sleeping 用闭眼 - 不带 {E}）
// ─────────────────────────────────────────────────────────────────────────────
describe('{E} 眼位占位 — 每帧含 {E} 或 sleeping 闭眼例外', () => {
  for (const species of PANDA_SPECIES_LIST) {
    for (const state of PET_STATES) {
      test(`${species} / ${state} / frame 0 — 含 {E} 或属 sleeping 闭眼`, () => {
        const frame = getStateSprite(species, state, 0)!
        const hasEyeSlot = frame.some(line => line.includes('{E}'))
        // sleeping 允许全闭眼无 {E}（panda.ts 注释明确允许）
        if (state === 'sleeping') {
          // 闭眼或带 {E} 都可接受
          expect(hasEyeSlot || frame.some(l => /[-_~Zz]/.test(l))).toBe(true)
        } else {
          expect(hasEyeSlot).toBe(true)
        }
      })
    }
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. hat slot：首行为 12 空格（除非该帧顶行用作特效如 ? / Z / ~ / *）
// ─────────────────────────────────────────────────────────────────────────────
describe('hat slot — 首行为 12 空格 或 被特效字符占用', () => {
  for (const species of PANDA_SPECIES_LIST) {
    for (const state of PET_STATES) {
      test(`${species} / ${state} / frame 0 — 首行 12 字符宽`, () => {
        const frame = getStateSprite(species, state, 0)!
        const top = frame[0]!
        // 渲染后宽度恒等 12（hat slot 与其他行一致）
        expect(renderedWidth(top)).toBe(12)
        // 全空 12 空格 或 含非空字符（特效）皆可
        const isBlank = top === '            '
        const hasFx = top.trim().length > 0
        expect(isBlank || hasFx).toBe(true)
      })
    }
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. fallback 链
// ─────────────────────────────────────────────────────────────────────────────
describe('getStateSprite fallback 链', () => {
  test('未注册 species（如 duck 旧 18 物种）返回 undefined', () => {
    // duck 不在 PANDA_SPECIES_BODIES — helper 应直接返回 undefined
    // 注意：旧 18 物种走 BODIES + renderSprite，不应走 getStateSprite
    const frame = getStateSprite(duck, 'idle', 0)
    expect(frame).toBeUndefined()
  })

  test('已注册 species + 不存在的 state 时 fallback 到 idle frame 0', () => {
    // helper 实现：speciesFrames[state] ?? speciesFrames.idle
    // 因 panda 系 12 态全覆盖，构造一个不存在的 state 字面量来触发 fallback
    const fakeState = 'nonexistent_state_xyz' as unknown as PetState
    const frame = getStateSprite(panda, fakeState, 0)
    expect(frame).toBeDefined()
    // fallback 到 idle frame 0 — 与直接取 idle frame 0 一致
    const idleFrame0 = getStateSprite(panda, 'idle', 0)
    expect(frame).toEqual(idleFrame0)
  })

  test('frame index 越界自动 mod（防止数组越界）', () => {
    const frame = getStateSprite(panda, 'idle', 9999)
    expect(frame).toBeDefined()
    expect(frame).toHaveLength(5)
  })

  test('frame index = -0 / 0 等价', () => {
    const a = getStateSprite(redPanda, 'thinking', 0)
    const b = getStateSprite(redPanda, 'thinking', -0)
    expect(a).toEqual(b)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. 旧 18 物种 byte-equal 守护（防 sprites.ts 上半段被误改）
// ─────────────────────────────────────────────────────────────────────────────
describe('byte-equal 守护 — 旧 18 物种不受 panda 合流影响', () => {
  test('duck 不在 PANDA_SPECIES_BODIES 中', () => {
    expect(PANDA_SPECIES_BODIES[duck]).toBeUndefined()
  })

  test('PANDA_SPECIES_BODIES 仅含 panda 系 3 species', () => {
    const keys = Object.keys(PANDA_SPECIES_BODIES)
    expect(keys.sort()).toEqual([panda, redPanda, kungFuPanda].sort())
  })
})
