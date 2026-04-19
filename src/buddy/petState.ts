// Input:  PetStateInput 派生信号（loading/error/notification/工具调用/子 agent/compacting/idle 时长）
// Output: 当前 PetState（12 态之一），用于驱动 panda sprite 帧选择
// Pos:    panda 形象宠物 D1 P1-T3/T4 — 纯函数 getCurrentPetState + hook useCurrentPetState
//         严守 anthropic byte-equal — 仅 src/buddy 与 src/state 读侧；不触碰 services/api 或 oauth
// [NEW-FILE:#20260419-AB-01]

import { useEffect, useRef, useState } from 'react'
import { feature } from 'bun:bundle'
import { useAppState } from '../state/AppState.js'
import {
  PET_STATE_PRIORITY,
  PET_STATES,
  type PetState,
} from './types.js'

// 时序阈值（ms）— 与 CompanionSprite 的 500ms TICK 对齐，避免 hook 与渲染层节拍漂移
export const DOZING_THRESHOLD_MS = 30_000
export const SLEEPING_THRESHOLD_MS = 60_000
// waking 触发窗口：sleeping → 用户输入后 N ms 内显示 waking 态
export const WAKING_WINDOW_MS = 1_500
// working / thinking 区分阈值：< 3s 思考；3-30s 持续工作；≥ 30s attention
export const WORKING_THRESHOLD_MS = 3_000

// 纯函数输入：所有派生信号（避免 hook 内闭包 stale）
// 注意：subAgentCount/isCompacting/isLoading/hasError/hasNotification/toolUseCount
// 当前 AppState 未直接暴露这些字段（see TODO in useCurrentPetState），由 hook 收集
export type PetStateInput = {
  isLoading: boolean
  hasError: boolean
  hasNotification: boolean
  toolUseCount: number
  lastInputAtMs: number
  nowMs: number
  subAgentCount: number
  isCompacting: boolean
  // 由 hook 维护：上一帧是否处于 sleeping，用于触发 waking 过渡态
  wasSleeping?: boolean
}

// 内部辅助：根据待机时长返回 idle 梯度（idle / dozing / sleeping）
// why: 待机梯度独立成函数，方便测试和未来调阈值
function idleGradient(idleMs: number): 'idle' | 'dozing' | 'sleeping' {
  if (idleMs >= SLEEPING_THRESHOLD_MS) return 'sleeping'
  if (idleMs >= DOZING_THRESHOLD_MS) return 'dozing'
  return 'idle'
}

// 收集当前帧所有"被点亮"的 PetState 候选，最后取优先级最高者
// why: 候选模式比 if/else 链更易扩展（未来加 streaming/celebrating 只需 push）
function collectCandidates(input: PetStateInput): PetState[] {
  const candidates: PetState[] = []
  const idleMs = Math.max(0, input.nowMs - input.lastInputAtMs)
  const gradient = idleGradient(idleMs)

  // 异常/通知 — 一次性最高优先级
  if (input.hasError) candidates.push('error')
  if (input.hasNotification) candidates.push('notification')

  // 系统操作 — compacting 持续期间锁死 sweeping，盖过工作信号
  if (input.isCompacting) candidates.push('sweeping')

  // attention：模型在 loading 但用户长时间未交互（"喂喂在不在"）
  // 必须 isLoading=true 才触发，否则走 dozing 待机分支
  if (input.isLoading && idleMs >= DOZING_THRESHOLD_MS) {
    candidates.push('attention')
  }

  // 并发多任务
  if (input.subAgentCount > 0) candidates.push('juggling')
  if (input.toolUseCount > 0 && input.subAgentCount === 0) {
    candidates.push('carrying')
  }

  // working：纯 loading 持续 ≥ 3s（无工具/子 agent，"埋头干活"段）
  // why: carrying.priority > working — 调用工具时由 carrying 接管；working 留给纯持续 loading
  if (
    input.isLoading &&
    input.toolUseCount === 0 &&
    input.subAgentCount === 0 &&
    idleMs >= WORKING_THRESHOLD_MS &&
    idleMs < DOZING_THRESHOLD_MS
  ) {
    candidates.push('working')
  }

  // thinking：纯 loading 短时（< 3s）— 才开始想问题
  if (
    input.isLoading &&
    input.toolUseCount === 0 &&
    input.subAgentCount === 0 &&
    idleMs < WORKING_THRESHOLD_MS
  ) {
    candidates.push('thinking')
  }

  // waking：上一帧 sleeping，本帧用户刚输入（idleMs < WAKING_WINDOW_MS）
  if (input.wasSleeping && idleMs < WAKING_WINDOW_MS) {
    candidates.push('waking')
  }

  // 待机梯度 — 永远是底层兜底候选，由优先级表决定是否被高阶信号盖过
  candidates.push(gradient)

  return candidates
}

/**
 * 纯函数：根据派生信号计算当前 PetState（12 态之一）。
 * 优先级聚合：取所有触发候选中 PET_STATE_PRIORITY 最高者。
 * 边界：全 false 输入 → idle；feature gate 由调用方（hook + 渲染层）负责。
 *
 * why pure: bun test 不走 build → feature() 默认 false，纯函数走 feature gate
 *           会让所有用例返回 idle；feature 守护应在 hook/渲染层短路调用。
 */
export function getCurrentPetState(input: PetStateInput): PetState {
  const candidates = collectCandidates(input)
  // 取优先级最高者（数值越大越高）
  let best: PetState = 'idle'
  let bestPriority = -1
  for (const cand of candidates) {
    const p = PET_STATE_PRIORITY[cand]
    if (p > bestPriority) {
      bestPriority = p
      best = cand
    }
  }
  return best
}

// 兜底守护：导出 PET_STATES 给测试用（同时确保 tree-shake 不误删）
export { PET_STATES, PET_STATE_PRIORITY, type PetState } from './types.js'
export { ONE_SHOT_STATES } from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// React hook（P1-T4）— 订阅 AppState 派生信号 + 500ms tick 推进 nowMs
// 初版只实现 getCurrentPetState 的纯计算驱动；one-shot 自动回退 + idle timer
// 的"前后帧记忆"留 P3 阶段加（占位 TODO 见下）
// ─────────────────────────────────────────────────────────────────────────────

const HOOK_TICK_MS = 500

/**
 * 订阅 AppState 派生 PetState；500ms tick 推进 nowMs。
 *
 * 当前订阅 5+ 字段（见函数体），但 AppState 没有原生 isLoading/hasError 等字段，
 * 通过派生信号近似（companionReaction / notifications / tasks / 等）。
 * TODO(P3): subAgentCount + isCompacting fallback 0/false，待 AppState 补齐字段后接入
 * TODO(P3): one-shot 自动回退（attention/error/notification 5 tick 后强制 idle）
 * TODO(P3): wasSleeping 跨帧记忆（useRef 维护上一帧 PetState）
 */
export function useCurrentPetState(): PetState {
  // why feature gate: BUDDY 关闭时直接返 idle 短路；feature() 限制只能在 if/三元中直接用
  // grep 守护锚点：feature('BUDDY')
  // 派生信号 1：companionReaction 存在视作"刚有动作"信号 — 间接表示 hasNotification
  const reaction = useAppState(s => s.companionReaction)
  // 派生信号 2：notifications.current 真有 toast → hasNotification
  const notification = useAppState(s => s.notifications.current)
  // 派生信号 3：tasks 数 — subAgentCount fallback（AppState.tasks 是 Record<id, TaskState>）
  // why: 计划 P1-T4 要求"subAgentCount 若 AppState 没有就 fallback 0"，但 tasks 现成可用，先接入
  const tasksRecord = useAppState(s => s.tasks)
  const subAgentCount = tasksRecord ? Object.keys(tasksRecord).length : 0
  // 派生信号 4：companionPetAt — 用户刚 /buddy pet 视作 lastInputAtMs 刷新
  const petAt = useAppState(s => s.companionPetAt)

  // TODO(P3): 以下字段 AppState 当前未暴露，先 fallback；接入 owner（REPL.tsx）后接 prop 传入
  const isLoading = false // TODO(P3): isLoading 由 REPL.tsx 维护，需通过 AppState 字段或 context 暴露
  const hasError = false // TODO(P3): 需接 query 错误信号
  const isCompacting = false // TODO(P3): 接 compaction 状态
  const toolUseCount = 0 // TODO(P3): 接当前 turn 的工具调用计数

  // tick 状态：500ms 推进 nowMs；同时收集 lastInputAtMs（reaction/petAt 变化即刷新）
  const [now, setNow] = useState(() => Date.now())
  const lastInputAtRef = useRef(Date.now())

  // 任意"用户活动"信号变化 → 刷新 lastInputAt
  useEffect(() => {
    lastInputAtRef.current = Date.now()
  }, [reaction, petAt, notification])

  // 500ms tick 推进 now（不依赖任何外部信号，独立时钟）
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), HOOK_TICK_MS)
    return () => clearInterval(timer)
  }, [])

  // why: feature('BUDDY') 守护必须直接在 if 中（bun:bundle 限制）
  if (!feature('BUDDY')) return 'idle'

  return getCurrentPetState({
    isLoading,
    hasError,
    hasNotification: notification != null || reaction != null,
    toolUseCount,
    lastInputAtMs: lastInputAtRef.current,
    nowMs: now,
    subAgentCount,
    isCompacting,
    // wasSleeping 在初版未跨帧追踪 — TODO(P3) 加 useRef<PetState>
    wasSleeping: false,
  })
}
