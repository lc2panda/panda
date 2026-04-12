// Input: outbox notifications.jsonl 记录
// Output: 去重后的"未显示"记录列表 + 标记为已显示的 API
// Pos: 通知可见性中枢，被 _checkPendingNotifications + 启动 catchup 共用
// 一旦我被修改，请更新所属文件夹的 README

import { join } from 'path'
import { homedir } from 'os'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

const OUTBOX_PATH = join(homedir(), '.pandacc', 'channels', 'outbox', 'notifications.jsonl')
const SEEN_PATH = join(homedir(), '.pandacc', 'channels', 'outbox', 'seen.json')
const MAX_SEEN = 500
const LOOKBACK_MS = 24 * 60 * 60 * 1000 // 24h

export interface OutboxNotification {
  type?: string
  title?: string
  body?: string
  timestamp?: string
}

interface SeenState {
  seen: string[] // timestamp strings
  updatedAt: number
}

function loadSeen(): SeenState {
  try {
    if (!existsSync(SEEN_PATH)) return { seen: [], updatedAt: 0 }
    const content = readFileSync(SEEN_PATH, 'utf-8')
    if (!content.trim()) return { seen: [], updatedAt: 0 }
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed?.seen)) return parsed as SeenState
    return { seen: [], updatedAt: 0 }
  } catch {
    return { seen: [], updatedAt: 0 }
  }
}

function saveSeen(state: SeenState): void {
  try {
    mkdirSync(join(homedir(), '.pandacc', 'channels', 'outbox'), { recursive: true })
    // cap 大小
    const seen = state.seen.slice(-MAX_SEEN)
    writeFileSync(SEEN_PATH, JSON.stringify({ seen, updatedAt: Date.now() }), 'utf-8')
  } catch {}
}

/**
 * 读取 outbox 所有 24h 内未显示的通知。
 */
export function loadUnseenNotifications(): OutboxNotification[] {
  try {
    if (!existsSync(OUTBOX_PATH)) return []
    const content = readFileSync(OUTBOX_PATH, 'utf-8')
    if (!content.trim()) return []

    const lines = content.split('\n').filter(l => l.trim().length > 0)
    const state = loadSeen()
    const seenSet = new Set(state.seen)
    const cutoff = Date.now() - LOOKBACK_MS

    const unseen: OutboxNotification[] = []
    for (const line of lines) {
      try {
        const notif = JSON.parse(line) as OutboxNotification
        if (!notif.timestamp) continue
        const ts = new Date(notif.timestamp).getTime()
        if (isNaN(ts) || ts < cutoff) continue
        if (seenSet.has(notif.timestamp)) continue
        unseen.push(notif)
      } catch {}
    }
    return unseen
  } catch {
    return []
  }
}

/**
 * 标记一批通知为"已显示"。
 */
export function markNotificationsSeen(notifs: OutboxNotification[]): void {
  if (notifs.length === 0) return
  try {
    const state = loadSeen()
    const seenSet = new Set(state.seen)
    for (const n of notifs) {
      if (n.timestamp) seenSet.add(n.timestamp)
    }
    state.seen = Array.from(seenSet)
    saveSeen(state)
  } catch {}
}

/**
 * 启动 catchup：在 panda 进程启动时调用，返回需要主动 inject 的通知文本。
 * 如果有 N 条未读，返回 "⏰ 你错过了 N 条通知：[...]" 格式的字符串供主流程用。
 * 调用方应该把它写入 first system message 或 injected prompt。
 */
export function getCatchupMessage(): string | null {
  const unseen = loadUnseenNotifications()
  if (unseen.length === 0) return null

  const lines = ['\u23F0 你错过了 ' + unseen.length + ' 条通知：']
  for (const n of unseen) {
    const ts = n.timestamp ? new Date(n.timestamp) : null
    const timeStr = ts ? formatRelativeTime(ts) : ''
    const title = n.title || n.type || '通知'
    const body = (n.body || '').split('\n')[0].slice(0, 100)
    lines.push(`  · [${timeStr}] ${title}${body ? ' — ' + body : ''}`)
  }

  // 标记为已显示
  markNotificationsSeen(unseen)

  return lines.join('\n')
}

function formatRelativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.round(hours / 24)
  return `${days} 天前`
}

/**
 * 获取 outbox 统计（调试 + status 面板用）
 */
export function getOutboxStats(): { total: number; unseen: number; seenCount: number } {
  try {
    if (!existsSync(OUTBOX_PATH)) return { total: 0, unseen: 0, seenCount: 0 }
    const content = readFileSync(OUTBOX_PATH, 'utf-8')
    const total = content.split('\n').filter(l => l.trim().length > 0).length
    const unseen = loadUnseenNotifications().length
    const state = loadSeen()
    return { total, unseen, seenCount: state.seen.length }
  } catch {
    return { total: 0, unseen: 0, seenCount: 0 }
  }
}
