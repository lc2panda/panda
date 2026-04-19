// Input:  DragTargetEvent（enable + acceptKinds + scenarioId）
// Output: 内存栈 + IPC `dragtarget:state` 通知 hit 窗注册/移除 dragover/drop listener
// Pos:    panda-on-desk 拖拽接收开关；A3 §3 #6 file-organizer / screenshot-snippet
//         栈式覆盖：多 scenario 同时启用时以最新一个为活动顶
//
// [NEW-FILE:#20260419-P2-03] 原 P2-T1 占位
// 2026-04-19 +08:00 agent-δ-P2-vfx · P2-T4 实装：栈式启停 + drop 回推 panda CLI

import type { DragTargetEvent } from '../bridge/types.js'

interface DragTargetEntry {
  scenarioId: string
  kinds: string[]
  enabledAt: number
}

/**
 * 栈式存储 — 后入先出。
 * 多场景并发启用时（如 file-organizer + screenshot-snippet）最新进入的位于栈顶，
 * hit 窗显示其 acceptKinds；该场景 disable 后回退到次新的活动场景。
 */
const stack: DragTargetEntry[] = []

/** IPC 通道名 — main → hit renderer */
export const DRAG_TARGET_CHANNEL = 'dragtarget:state' as const
/** IPC 通道名 — hit renderer → main（drop 后转发文件/文本到 panda CLI） */
export const DRAG_TARGET_DROP_CHANNEL = 'dragtarget:drop' as const

/** 推送给 renderer 的 state 负载 */
export interface DragTargetStatePayload {
  /** true → renderer 添加 dragover/drop listener + 高亮；false → 取消 */
  active: boolean
  /** 当前栈顶场景（active=true 必填） */
  scenarioId?: string
  /** 接受的拖拽类别 */
  kinds: string[]
  ts: number
}

/** drop 回执负载 — renderer 给 main，main 通过 SSE 转发 panda CLI */
export interface DragTargetDropPayload {
  scenarioId: string
  kind: 'file' | 'text' | 'image' | string
  /** kind=file → 绝对路径列表；kind=text → 文本；kind=image → dataURL 或路径 */
  data: string | string[]
  ts: number
}

// ─────────────────────────────────────────────────────────────────────────────
// 渲染回调注入（main.ts 启动时注入 sendToHitWin）
// ─────────────────────────────────────────────────────────────────────────────

type NotifyFn = (channel: string, payload: DragTargetStatePayload) => void
type ForwardFn = (payload: DragTargetDropPayload) => void

let notifyHitWin: NotifyFn | null = null
let forwardDrop: ForwardFn | null = null

export function setDragTargetRendererNotifier(fn: NotifyFn | null): void {
  notifyHitWin = fn
}

/** main.ts 注入：drop 后通过 SSE / HTTP 推回 panda CLI 的 transport */
export function setDragTargetDropForwarder(fn: ForwardFn | null): void {
  forwardDrop = fn
}

function publishCurrent(): void {
  if (!notifyHitWin) return
  const top = stack.length > 0 ? stack[stack.length - 1] : null
  const payload: DragTargetStatePayload = top
    ? { active: true, scenarioId: top.scenarioId, kinds: top.kinds, ts: Date.now() }
    : { active: false, kinds: [], ts: Date.now() }
  try {
    notifyHitWin(DRAG_TARGET_CHANNEL, payload)
  } catch {
    // ignore — 渲染端可能未 ready
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 启用拖拽接收。
 * 同 scenarioId 重复 enable → 视为更新 kinds 并重新上浮到栈顶。
 */
export function enableDragTarget(scenarioId: string, kinds: string[]): void {
  // 移除已有同 id entry，再 push 到栈顶
  const idx = stack.findIndex(e => e.scenarioId === scenarioId)
  if (idx >= 0) stack.splice(idx, 1)
  stack.push({ scenarioId, kinds: [...kinds], enabledAt: Date.now() })
  publishCurrent()
}

/**
 * 关闭拖拽接收。
 * 若关的是栈顶 → 回退到次新；否则仅从栈中删除该 entry，栈顶不变。
 */
export function disableDragTarget(scenarioId: string): void {
  const idx = stack.findIndex(e => e.scenarioId === scenarioId)
  if (idx < 0) return
  stack.splice(idx, 1)
  publishCurrent()
}

/** 当前栈顶场景（无激活返回 null） */
export function getActiveDragTarget(): { scenarioId: string; kinds: string[] } | null {
  if (stack.length === 0) return null
  const top = stack[stack.length - 1]
  return { scenarioId: top.scenarioId, kinds: [...top.kinds] }
}

/**
 * renderer 端 drop 完成后调此入口（main.ts ipcMain.on(DRAG_TARGET_DROP_CHANNEL, ...) 转发到此）。
 * 内部走 forwardDrop transport 推回 panda CLI；若 transport 未注入则吞掉。
 */
export function handleDrop(payload: DragTargetDropPayload): void {
  if (!forwardDrop) return
  try {
    forwardDrop(payload)
  } catch {
    // ignore — transport 异常不影响 renderer
  }
}

/**
 * 兼容 P2-T1 入口 — bridge/server.ts dispatchEvent 仍调 dispatchDragTarget。
 */
export function dispatchDragTarget(event: DragTargetEvent): void {
  if (event.enable) {
    enableDragTarget(event.scenarioId, event.acceptKinds)
  } else {
    disableDragTarget(event.scenarioId)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试辅助
// ─────────────────────────────────────────────────────────────────────────────

/** 测试辅助 — 查询某场景是否在栈中（不必栈顶） */
export function __isDragTargetActiveForTesting(scenarioId: string): boolean {
  return stack.some(e => e.scenarioId === scenarioId)
}

/** 测试隔离 — 清空全部激活态 + 解绑 notifier/forwarder */
export function __resetDragTargetsForTesting(): void {
  stack.length = 0
  notifyHitWin = null
  forwardDrop = null
}

/** 测试辅助 — 完整栈快照 */
export function __getStackForTesting(): ReadonlyArray<Readonly<DragTargetEntry>> {
  return stack.map(e => ({ ...e, kinds: [...e.kinds] }))
}
