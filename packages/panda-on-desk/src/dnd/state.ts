// Input:  DndEvent（enabled + reason + endsAt）/ setDnd / getDndState 主动查询
// Output: 内存状态机 + 落盘 ~/.pandacc/dnd-state.json + endsAt 到期自动 enabled=false
// Pos:    panda-on-desk DND 全局开关；A3 §5 Focus / 时段静音
//         dispatcher 入口 gate 调用 isInDnd() 决定是否抑制 forward
//
// [NEW-FILE:#20260419-P2-03] 原 P2-T1 占位 → P2-T5 实装（agent-ε-P2-dnd-retry）
// 2026-04-19 +08:00 P2-T5 实装 — 状态机 + 持久化 + 自动恢复
// 2026-04-19 +08:00 兼容旧 export：dispatchDnd / isDndActive 保留语义不变

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import type { DndEvent } from '../bridge/types.js'

/** DND 触发原因 — 'manual' 用户手动 / 'schedule' 时段触发 / 'focus-mode' 专注模式 */
export type DndReason = 'manual' | 'schedule' | 'focus-mode'

export interface DndState {
  enabled: boolean
  reason?: DndReason
  /** 自动恢复时刻 epoch ms；不传则常驻直到再次手动关闭 */
  endsAt?: number
  /** 最近一次状态变更时刻 */
  changedAt: number
}

/** setDnd 入参 — 与 DndEvent 字段一致但不带 type/ts，便于程序内调用 */
export interface SetDndOptions {
  enabled: boolean
  reason?: DndReason
  endsAt?: number
}

const DND_FILE_NAME = 'dnd-state.json'

function getConfigHomeDir(): string {
  const fromEnv = process.env.PANDA_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR
  return (fromEnv ?? join(homedir(), '.pandacc')).normalize('NFC')
}

function getDndFilePath(): string {
  return join(getConfigHomeDir(), DND_FILE_NAME)
}

// ─────────────────────────────────────────────────────────────────────────────
// 内存状态
// ─────────────────────────────────────────────────────────────────────────────

let currentState: DndState = { enabled: false, changedAt: 0 }
let persistenceEnabled = true

// ─────────────────────────────────────────────────────────────────────────────
// 持久化
// ─────────────────────────────────────────────────────────────────────────────

function ensureConfigDir(): void {
  const dir = dirname(getDndFilePath())
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function persistState(): void {
  if (!persistenceEnabled) return
  try {
    ensureConfigDir()
    const path = getDndFilePath()
    // why: 原子写入避免半截 JSON
    const tmp = `${path}.tmp`
    writeFileSync(tmp, JSON.stringify(currentState, null, 2), { encoding: 'utf-8' })
    renameSync(tmp, path)
  } catch {
    // why: 持久化失败不应阻断 setDnd 内存态生效（磁盘满 / 权限问题）
  }
}

/**
 * 启动时调用 — 从 ~/.pandacc/dnd-state.json 恢复 DND 状态。
 * 文件不存在 / 解析失败 → 沿用默认 disabled。
 * endsAt 已过期 → 视为 disabled。
 */
export function hydrateDndFromDisk(): boolean {
  const path = getDndFilePath()
  if (!existsSync(path)) return false
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<DndState>
    if (!parsed || typeof parsed !== 'object') return false
    if (typeof parsed.enabled !== 'boolean') return false
    // endsAt 已过期 → 不恢复
    if (
      parsed.enabled &&
      typeof parsed.endsAt === 'number' &&
      Date.now() >= parsed.endsAt
    ) {
      currentState = { enabled: false, changedAt: Date.now() }
      persistState()
      return true
    }
    currentState = {
      enabled: parsed.enabled,
      reason: parsed.reason,
      endsAt: parsed.endsAt,
      changedAt: typeof parsed.changedAt === 'number' ? parsed.changedAt : Date.now(),
    }
    return true
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 自动恢复定时器（endsAt 到期自动 enabled=false）
// ─────────────────────────────────────────────────────────────────────────────

let recoveryTimer: ReturnType<typeof setTimeout> | null = null

function clearRecoveryTimer(): void {
  if (recoveryTimer !== null) {
    clearTimeout(recoveryTimer)
    recoveryTimer = null
  }
}

function scheduleRecovery(endsAt: number): void {
  clearRecoveryTimer()
  const ms = endsAt - Date.now()
  if (ms <= 0) {
    // 已过期 — 立即解除
    currentState = { enabled: false, changedAt: Date.now() }
    persistState()
    return
  }
  recoveryTimer = setTimeout(() => {
    recoveryTimer = null
    // 二次校验：可能已被 setDnd 覆盖
    if (currentState.enabled && currentState.endsAt && Date.now() >= currentState.endsAt) {
      currentState = { enabled: false, changedAt: Date.now() }
      persistState()
    }
  }, ms)
  // 不阻塞 Node.js event loop 退出（测试环境友好）
  if (typeof recoveryTimer === 'object' && recoveryTimer !== null) {
    const t = recoveryTimer as { unref?: () => void }
    if (typeof t.unref === 'function') t.unref()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 设置 DND 状态。
 * - enabled=true + endsAt → 到期自动恢复
 * - enabled=false → 立即解除并清掉定时器
 */
export function setDnd(opts: SetDndOptions): void {
  currentState = {
    enabled: opts.enabled,
    reason: opts.reason,
    endsAt: opts.enabled ? opts.endsAt : undefined,
    changedAt: Date.now(),
  }
  if (opts.enabled && typeof opts.endsAt === 'number') {
    scheduleRecovery(opts.endsAt)
  } else {
    clearRecoveryTimer()
  }
  persistState()
}

/** 当前 DND 状态查询 — 返回不可变快照 */
export function getDndState(): Readonly<DndState> {
  return currentState
}

/**
 * 是否处于 DND 中（合并 endsAt 过期判定）。
 * - enabled=false → false
 * - endsAt 已过 → false（顺便修正内存态）
 * - 其余 → true
 */
export function isInDnd(): boolean {
  if (!currentState.enabled) return false
  if (currentState.endsAt && Date.now() >= currentState.endsAt) {
    // why: 惰性恢复 — 即便定时器异常未触发，查询时也修正
    currentState = { enabled: false, changedAt: Date.now() }
    clearRecoveryTimer()
    persistState()
    return false
  }
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// 兼容旧 stub export — bridge/server.ts 仍调 dispatchDnd
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 兼容入口 — bridge/server.ts dispatchEvent('dnd', ...) 直 forward 到这里。
 * 内部委派 setDnd，确保单一状态源。
 */
export function dispatchDnd(event: DndEvent): void {
  setDnd({
    enabled: event.enabled,
    reason: event.reason,
    endsAt: event.endsAt,
  })
}

/** 兼容旧名 — dispatcher.test.ts / 其他模块仍用 isDndActive */
export function isDndActive(): boolean {
  return isInDnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试辅助
// ─────────────────────────────────────────────────────────────────────────────

export function __getDndStateForTesting(): Readonly<DndState> {
  return currentState
}

export function __resetDndStateForTesting(): void {
  currentState = { enabled: false, changedAt: 0 }
  clearRecoveryTimer()
}

export function __setDndPersistenceForTesting(enabled: boolean): void {
  persistenceEnabled = enabled
}

export function __getDndFilePathForTesting(): string {
  return getDndFilePath()
}
