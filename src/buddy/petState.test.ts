// Input:  PetStateInput 派生信号（isLoading/hasError/...）
// Output: PetState 12 态枚举之一
// Pos:    panda 形象宠物 D1 P1-T3 纯函数测试 + D3 P3-T3/T4 one-shot/idle timer 追加 [NEW-FILE:#20260419-AB-01]
import { describe, expect, test } from 'bun:test'
import {
  applyOneShotFallback,
  getCurrentPetState,
  ONE_SHOT_STATES,
  ONE_SHOT_TTL_MS,
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

// ─────────────────────────────────────────────────────────────────────────────
// P3-T3：applyOneShotFallback — attention/error/notification 5 tick (~2.5s) 后回退 idle
// ─────────────────────────────────────────────────────────────────────────────
describe('applyOneShotFallback — one-shot 自动回退（P3-T3）', () => {
  test('error 持续 < TTL → 保持 error', () => {
    const enteredAt = 1_000_000
    const now = enteredAt + ONE_SHOT_TTL_MS - 1
    expect(applyOneShotFallback('error', enteredAt, now)).toBe('error')
  })

  test('error 持续 ≥ TTL → 回退 idle', () => {
    const enteredAt = 1_000_000
    const now = enteredAt + ONE_SHOT_TTL_MS
    expect(applyOneShotFallback('error', enteredAt, now)).toBe('idle')
  })

  test('attention 持续 ≥ TTL → 回退 idle', () => {
    const enteredAt = 2_000_000
    const now = enteredAt + ONE_SHOT_TTL_MS + 100
    expect(applyOneShotFallback('attention', enteredAt, now)).toBe('idle')
  })

  test('notification 持续 ≥ TTL → 回退 idle', () => {
    const enteredAt = 3_000_000
    const now = enteredAt + ONE_SHOT_TTL_MS + 500
    expect(applyOneShotFallback('notification', enteredAt, now)).toBe('idle')
  })

  test('非 one-shot 状态（working）不受 TTL 影响', () => {
    // working 不在 ONE_SHOT_STATES，无论持续多久都返回原值
    expect(applyOneShotFallback('working', 1_000_000, 1_000_000 + 60_000)).toBe(
      'working',
    )
  })

  test('oneShotEnteredAtMs = null 时返回 raw（hook 首次进入未记录锚点）', () => {
    // 防御：刚进入 one-shot 第一帧，锚点尚未写入 → 不应误回退
    expect(applyOneShotFallback('error', null, 1_000_000)).toBe('error')
  })

  test('TTL 边界值 = ONE_SHOT_TTL_MS (2500ms)', () => {
    // 守护：TTL 与渲染层 TICK_MS=500 × 5 tick 对齐
    expect(ONE_SHOT_TTL_MS).toBe(2_500)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// P3-T4：idle timer 梯度 — 30s → dozing / 60s → sleeping / recover
// （纯函数 getCurrentPetState 已支持；本节验证阈值边界与恢复路径）
// ─────────────────────────────────────────────────────────────────────────────
describe('idle timer 梯度（P3-T4）', () => {
  const T0 = 1_000_000

  test('idle 29.9s（< 30s）→ idle', () => {
    expect(
      getCurrentPetState(
        baseInput({ lastInputAtMs: T0, nowMs: T0 + 29_900 }),
      ),
    ).toBe('idle')
  })

  test('idle 30s 整 → dozing（边界值已含）', () => {
    expect(
      getCurrentPetState(
        baseInput({ lastInputAtMs: T0, nowMs: T0 + 30_000 }),
      ),
    ).toBe('dozing')
  })

  test('idle 60s 整 → sleeping（边界值已含）', () => {
    expect(
      getCurrentPetState(
        baseInput({ lastInputAtMs: T0, nowMs: T0 + 60_000 }),
      ),
    ).toBe('sleeping')
  })

  test('从 sleeping 恢复（lastInputAtMs 推进到 nowMs 附近）→ idle', () => {
    // 用户输入后 lastInputAtMs 刷新；idleMs 重新归零 → idle
    const nowMs = T0 + 90_000
    expect(
      getCurrentPetState(
        baseInput({ lastInputAtMs: nowMs, nowMs }),
      ),
    ).toBe('idle')
  })

  test('waking：wasSleeping=true 且 idleMs < WAKING_WINDOW_MS → waking', () => {
    // P3-T4 触发条件：上一帧 sleeping + 本帧用户刚输入
    const nowMs = T0 + 90_000
    expect(
      getCurrentPetState(
        baseInput({
          lastInputAtMs: nowMs - 500, // 0.5s 前刚输入，仍在 1.5s 窗口内
          nowMs,
          wasSleeping: true,
        }),
      ),
    ).toBe('waking')
  })

  test('waking 窗口超时（idleMs ≥ WAKING_WINDOW_MS）→ 回 idle', () => {
    const nowMs = T0 + 90_000
    expect(
      getCurrentPetState(
        baseInput({
          lastInputAtMs: nowMs - 2_000, // 2s 前输入，超出 1.5s waking 窗口
          nowMs,
          wasSleeping: true,
        }),
      ),
    ).toBe('idle')
  })
})
