import { test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test'
import {
  loadUnseenNotifications,
  markNotificationsSeen,
  getCatchupMessage,
  getOutboxStats,
} from './notificationCatchup.js'
import { join } from 'path'
import { homedir } from 'os'
import { writeFileSync, unlinkSync, existsSync, mkdirSync, readFileSync, renameSync } from 'fs'

const OUTBOX_DIR = join(homedir(), '.pandacc', 'channels', 'outbox')
const OUTBOX = join(OUTBOX_DIR, 'notifications.jsonl')
const SEEN = join(OUTBOX_DIR, 'seen.json')
// 真实 outbox 备份路径，防止测试破坏用户生产数据
const OUTBOX_BAK = join(OUTBOX_DIR, 'notifications.jsonl.testbak')
const SEEN_BAK = join(OUTBOX_DIR, 'seen.json.testbak')

beforeAll(() => {
  try {
    mkdirSync(OUTBOX_DIR, { recursive: true })
    if (existsSync(OUTBOX)) renameSync(OUTBOX, OUTBOX_BAK)
    if (existsSync(SEEN)) renameSync(SEEN, SEEN_BAK)
  } catch {}
})

afterAll(() => {
  try {
    if (existsSync(OUTBOX)) unlinkSync(OUTBOX)
    if (existsSync(SEEN)) unlinkSync(SEEN)
    if (existsSync(OUTBOX_BAK)) renameSync(OUTBOX_BAK, OUTBOX)
    if (existsSync(SEEN_BAK)) renameSync(SEEN_BAK, SEEN)
  } catch {}
})

beforeEach(() => {
  try {
    if (existsSync(OUTBOX)) unlinkSync(OUTBOX)
    if (existsSync(SEEN)) unlinkSync(SEEN)
  } catch {}
})

afterEach(() => {
  try {
    if (existsSync(OUTBOX)) unlinkSync(OUTBOX)
    if (existsSync(SEEN)) unlinkSync(SEEN)
  } catch {}
})

test('loadUnseenNotifications — 空 outbox 返回空数组', () => {
  const result = loadUnseenNotifications()
  expect(result).toEqual([])
})

test('loadUnseenNotifications — 2 条未读', () => {
  const line1 = JSON.stringify({ type: 'action', title: 'test1', body: 'body1', timestamp: new Date().toISOString() })
  const line2 = JSON.stringify({ type: 'action', title: 'test2', body: 'body2', timestamp: new Date().toISOString() })
  writeFileSync(OUTBOX, line1 + '\n' + line2 + '\n', 'utf-8')

  const result = loadUnseenNotifications()
  expect(result.length).toBe(2)
})

test('markNotificationsSeen — 标记后不再返回', () => {
  const now = new Date().toISOString()
  const line = JSON.stringify({ type: 'action', title: 'test', body: 'body', timestamp: now })
  writeFileSync(OUTBOX, line + '\n', 'utf-8')

  markNotificationsSeen([{ timestamp: now, title: 'test', type: 'action' }])
  const result = loadUnseenNotifications()
  expect(result.length).toBe(0)
})

test('loadUnseenNotifications — 24h 前的通知被过滤', () => {
  const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  const line = JSON.stringify({ type: 'action', title: 'old', body: 'old body', timestamp: old })
  writeFileSync(OUTBOX, line + '\n', 'utf-8')

  const result = loadUnseenNotifications()
  expect(result.length).toBe(0)
})

test('getCatchupMessage — 格式化输出', () => {
  const now = new Date().toISOString()
  const line = JSON.stringify({ type: 'action', title: '📋 早报', body: '今日工作', timestamp: now })
  writeFileSync(OUTBOX, line + '\n', 'utf-8')

  const msg = getCatchupMessage()
  expect(msg).toContain('1 条通知')
  expect(msg).toContain('📋 早报')
})

test('getCatchupMessage — 空则返回 null', () => {
  const result = getCatchupMessage()
  expect(result).toBeNull()
})

test('getCatchupMessage — 调用后标记为已读', () => {
  const now = new Date().toISOString()
  const line = JSON.stringify({ type: 'action', title: 'test', body: 'body', timestamp: now })
  writeFileSync(OUTBOX, line + '\n', 'utf-8')

  expect(getCatchupMessage()).not.toBeNull()
  // 第二次调用应该返回 null（已标记）
  expect(getCatchupMessage()).toBeNull()
})

test('getOutboxStats — 总数 + 未读数', () => {
  const now = new Date().toISOString()
  const line = JSON.stringify({ type: 'action', title: 'test', body: 'body', timestamp: now })
  writeFileSync(OUTBOX, line + '\n', 'utf-8')

  const stats = getOutboxStats()
  expect(stats.total).toBe(1)
  expect(stats.unseen).toBe(1)
})
