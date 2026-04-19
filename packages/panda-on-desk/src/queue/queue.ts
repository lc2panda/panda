// Input:  NotificationEvent（来自 dispatcher 在离线判定下转入队列）
// Output: 内存 FIFO 队列；溢出时丢最旧；可选 jsonl 持久化（防 panda-on-desk 重启丢消息）
// Pos:    P2-T6 队列管理核心 — orchestrator 在 lock-screen/suspend 期间灌入，
//         resume/unlock 时一次性 flush 给 overlay 聚合层
//         严守 anthropic byte-equal — 仅本地 jsonl + Map，无 anthropic 通道引用
//
// [NEW-FILE:#20260419-P2-21]
// 2026-04-19 +08:00 agent-ζ-P2-queue · 通知队列 + 离线累积

import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import type { NotificationEvent } from '../bridge/types.js'

/** 队列上限 — 防离线累积撑爆内存；溢出 = 丢最旧（FIFO） */
export const QUEUE_MAX = 100

/** 持久化 jsonl 路径（与 panda CLI ~/.pandacc 同源） */
const QUEUE_FILE_NAME = 'notification-queue.jsonl'

function getConfigHomeDir(): string {
  const fromEnv = process.env.PANDA_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR
  return (fromEnv ?? join(homedir(), '.pandacc')).normalize('NFC')
}

function getQueueFilePath(): string {
  return join(getConfigHomeDir(), QUEUE_FILE_NAME)
}

// ─────────────────────────────────────────────────────────────────────────────
// 内存 FIFO 队列
// ─────────────────────────────────────────────────────────────────────────────

let pending: NotificationEvent[] = []

/** 是否启用持久化（默认开启；测试可临时关） */
let persistenceEnabled = true

/**
 * 入队 — 离线状态下 dispatcher 调用。
 * - 超过 QUEUE_MAX 时按 FIFO 丢最旧
 * - 同步写入 jsonl（append 半行原子；进程崩溃最多丢半行）
 */
export function enqueue(event: NotificationEvent): void {
  pending.push(event)
  if (pending.length > QUEUE_MAX) {
    // why: 丢最旧 — 离线累积期最关心最近的紧急通知；最早的失效率高
    pending.splice(0, pending.length - QUEUE_MAX)
  }
  if (persistenceEnabled) {
    appendToJsonl(event)
  }
}

/**
 * 一次性取出全部 pending 事件并清空。
 * - 顺序：FIFO（最早进队的先出）
 * - 同时清空 jsonl 文件（写后清，避免重复 hydrate）
 */
export function flush(): NotificationEvent[] {
  if (pending.length === 0) {
    if (persistenceEnabled) clearJsonl()
    return []
  }
  const out = pending
  pending = []
  if (persistenceEnabled) clearJsonl()
  return out
}

/** 只读快照 — 给 orchestrator 监控当前堆积量；不允许外部 mutate */
export function getPending(): readonly NotificationEvent[] {
  return pending
}

// ─────────────────────────────────────────────────────────────────────────────
// 持久化 — jsonl append + 启动 hydrate
// ─────────────────────────────────────────────────────────────────────────────

function ensureConfigDir(): void {
  const dir = dirname(getQueueFilePath())
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function appendToJsonl(event: NotificationEvent): void {
  try {
    ensureConfigDir()
    appendFileSync(getQueueFilePath(), `${JSON.stringify(event)}\n`, { encoding: 'utf-8' })
  } catch {
    // why: jsonl 写失败不应阻断内存入队（磁盘满 / 权限问题），仅丢失重启恢复能力
  }
}

function clearJsonl(): void {
  try {
    if (existsSync(getQueueFilePath())) {
      rmSync(getQueueFilePath(), { force: true })
    }
  } catch {
    // ignore — 下次 flush 仍会再尝试
  }
}

/**
 * 启动时调用 — 从 jsonl 恢复未消费的离线通知到内存队列。
 * - 文件不存在 → no-op
 * - 单行 JSON 解析失败 → 跳过该行，继续下一行
 * - 恢复后 jsonl 不清，等待下次 flush
 */
export function hydrateFromDisk(): number {
  const path = getQueueFilePath()
  if (!existsSync(path)) return 0
  let count = 0
  try {
    const raw = readFileSync(path, 'utf-8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const parsed = JSON.parse(trimmed) as NotificationEvent
        if (parsed && typeof parsed === 'object' && parsed.type === 'notification') {
          pending.push(parsed)
          count += 1
        }
      } catch {
        // 跳过坏行
      }
    }
    // 防 hydrate 后超限
    if (pending.length > QUEUE_MAX) {
      pending.splice(0, pending.length - QUEUE_MAX)
    }
  } catch {
    // ignore — 当作没有持久化数据
  }
  return count
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试 / 诊断辅助
// ─────────────────────────────────────────────────────────────────────────────

/** 测试隔离 — 清空内存队列 + jsonl 文件 */
export function __resetQueueForTesting(): void {
  pending = []
  clearJsonl()
}

/** 测试辅助 — 临时关持久化（避免污染真实 ~/.pandacc） */
export function __setPersistenceForTesting(enabled: boolean): void {
  persistenceEnabled = enabled
}

/** 测试辅助 — 暴露当前 jsonl 文件路径 */
export function __getQueueFilePathForTesting(): string {
  return getQueueFilePath()
}
