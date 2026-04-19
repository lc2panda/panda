// Input:  PetStateInput 派生信号（isLoading/hasError/...）
// Output: PetState 12 态枚举之一
// Pos:    panda 形象宠物 D1 P1-T3 纯函数测试 [NEW-FILE:#20260419-AB-01]
import { describe, expect, test } from 'bun:test'
import {
  getCurrentPetState,
  ONE_SHOT_STATES,
  PET_STATE_PRIORITY,
  PET_STATES,
} from './petState.js'
import type { PetStateInput } from './petState.js'

// 基线输入：所有信号为 false / 0；nowMs 与 lastInputAtMs 同步代表"刚刚有输入"
function baseInput(overrides: Partial<PetStateInput> = {}): PetStateInput {
  return {
    isLoading: false,
    hasError: false,
    hasNotification: false,
    toolUseCount: 0,
    lastInputAtMs: 1_000_000,
    nowMs: 1_000_000,
    subAgentCount: 0,
    isCompacting: false,
    ...overrides,
  }
}

describe('PetState 枚举与优先级表', () => {
  test('PET_STATES 含 12 个状态', () => {
    expect(PET_STATES).toHaveLength(12)
  })

  test('PET_STATE_PRIORITY 12 个数值互不相同', () => {
    const values = PET_STATES.map(s => PET_STATE_PRIORITY[s])
    expect(new Set(values).size).toBe(12)
  })

  test('PET_STATE_PRIORITY 覆盖所有 PetState', () => {
    for (const state of PET_STATES) {
      expect(typeof PET_STATE_PRIORITY[state]).toBe('number')
    }
  })

  test('ONE_SHOT_STATES ⊂ PET_STATES', () => {
    for (const state of ONE_SHOT_STATES) {
      expect(PET_STATES.includes(state)).toBe(true)
    }
  })

  test('ONE_SHOT_STATES 至少包含 error / notification / attention', () => {
    expect(ONE_SHOT_STATES.has('error')).toBe(true)
    expect(ONE_SHOT_STATES.has('notification')).toBe(true)
    expect(ONE_SHOT_STATES.has('attention')).toBe(true)
  })

  test('error 优先级最高（数值最大）', () => {
    const errorPriority = PET_STATE_PRIORITY.error
    for (const state of PET_STATES) {
      if (state === 'error') continue
      expect(errorPriority).toBeGreaterThan(PET_STATE_PRIORITY[state])
    }
  })

  test('sleeping 优先级最低（数值最小）', () => {
    const sleepingPriority = PET_STATE_PRIORITY.sleeping
    for (const state of PET_STATES) {
      if (state === 'sleeping') continue
      expect(sleepingPriority).toBeLessThan(PET_STATE_PRIORITY[state])
    }
  })
})

describe('getCurrentPetState — 单信号映射（12 用例覆盖每个 PetState）', () => {
  test('全 false 输入 → idle（边界用例）', () => {
    expect(getCurrentPetState(baseInput())).toBe('idle')
  })

  test('hasError → error', () => {
    expect(getCurrentPetState(baseInput({ hasError: true }))).toBe('error')
  })

  test('hasNotification → notification', () => {
    expect(getCurrentPetState(baseInput({ hasNotification: true }))).toBe(
      'notification',
    )
  })

  test('isCompacting → sweeping', () => {
    expect(getCurrentPetState(baseInput({ isCompacting: true }))).toBe(
      'sweeping',
    )
  })

  test('subAgentCount > 0 → juggling', () => {
    expect(getCurrentPetState(baseInput({ subAgentCount: 2 }))).toBe('juggling')
  })

  test('toolUseCount > 0（无 subAgent）→ carrying', () => {
    expect(getCurrentPetState(baseInput({ toolUseCount: 1 }))).toBe('carrying')
  })

  test('isLoading 短时（< 3s，无工具/子 agent）→ thinking', () => {
    // baseInput 默认 nowMs === lastInputAtMs，idleMs = 0 < WORKING_THRESHOLD_MS
    expect(getCurrentPetState(baseInput({ isLoading: true }))).toBe('thinking')
  })

  test('idle 30s+ 但 < 60s + 无 isLoading → dozing', () => {
    // 注意：若同时 isLoading=true 会触发 attention（priority 90 > dozing 20）
    const input = baseInput({
      isLoading: false,
      lastInputAtMs: 1_000_000,
      nowMs: 1_000_000 + 31_000,
    })
    expect(getCurrentPetState(input)).toBe('dozing')
  })

  test('idle 60s+ + 无 isLoading → sleeping', () => {
    const input = baseInput({
      isLoading: false,
      lastInputAtMs: 1_000_000,
      nowMs: 1_000_000 + 61_000,
    })
    expect(getCurrentPetState(input)).toBe('sleeping')
  })

  test('working：纯 isLoading 持续 ≥ 3s（无工具/子 agent）→ working', () => {
    // working 触发条件：isLoading + 持续 3s+ + 无工具 + 无 subAgent + 未到 attention 阈值
    const input = baseInput({
      isLoading: true,
      lastInputAtMs: 1_000_000,
      nowMs: 1_000_000 + 5_000, // 5s 持续 loading
    })
    expect(getCurrentPetState(input)).toBe('working')
  })

  test('attention 信号（isLoading + 无工具 + 长待机）→ attention', () => {
    // attention 触发：用户长时间未输入但模型仍在 loading（"喂喂在不在"）
    const input = baseInput({
      isLoading: true,
      lastInputAtMs: 1_000_000,
      nowMs: 1_000_000 + 31_000, // > 30s 但未到 sleeping
    })
    expect(getCurrentPetState(input)).toBe('attention')
  })

  test('waking：刚从 sleeping 醒来（lastInputAtMs 刚刷新 + 无 loading）→ waking', () => {
    // waking 触发：上一帧在 sleeping，本帧用户刚输入（nowMs - lastInputAtMs < 阈值）
    // 此处用 wasSleeping 显式标记（hook 会维护，纯函数接受可选 wasSleeping 输入）
    const input = baseInput({
      lastInputAtMs: 1_000_000,
      nowMs: 1_000_500,
      wasSleeping: true,
    })
    expect(getCurrentPetState(input)).toBe('waking')
  })
})

describe('getCurrentPetState — 优先级聚合（同时多信号）', () => {
  test('error + notification + isLoading + toolUseCount + isCompacting → error 最高', () => {
    const input = baseInput({
      hasError: true,
      hasNotification: true,
      isLoading: true,
      toolUseCount: 5,
      isCompacting: true,
      subAgentCount: 3,
    })
    expect(getCurrentPetState(input)).toBe('error')
  })

  test('notification + 其他低优先级 → notification', () => {
    const input = baseInput({
      hasNotification: true,
      isLoading: true,
      toolUseCount: 2,
    })
    expect(getCurrentPetState(input)).toBe('notification')
  })

  test('isCompacting + subAgent + toolUse → sweeping（compacting 高于 juggling/carrying）', () => {
    const input = baseInput({
      isCompacting: true,
      subAgentCount: 3,
      toolUseCount: 5,
    })
    expect(getCurrentPetState(input)).toBe('sweeping')
  })

  test('subAgent + toolUse + isLoading → juggling（juggling 高于 carrying/working）', () => {
    const input = baseInput({
      subAgentCount: 2,
      toolUseCount: 3,
      isLoading: true,
    })
    expect(getCurrentPetState(input)).toBe('juggling')
  })

  test('toolUse + isLoading → carrying（按规格 carrying > working）', () => {
    // 规格：error > notification > sweeping > attention > juggling > carrying > working > thinking
    // toolUseCount > 0 触发 carrying（70）；isLoading + toolUseCount 也触发 working（60）
    // carrying 优先级更高（"具象的搬运动作"压过"抽象的工作态"）
    const input = baseInput({ toolUseCount: 2, isLoading: true })
    expect(getCurrentPetState(input)).toBe('carrying')
  })
})
