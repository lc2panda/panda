import { test, expect } from 'bun:test'
import { localDateStr, localDateTimeFileStr, localDateTimeStr } from './date.js'

test('localDateStr — 返回 YYYY-MM-DD 格式', () => {
  const s = localDateStr()
  expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})

test('localDateStr — 特定 Date 对象返回系统时区字段', () => {
  // 使用本地时区字段构造 Date（不是 UTC）。月份 0-indexed，3 = April。
  const d = new Date(2026, 3, 12, 15, 0, 0)
  expect(localDateStr(d)).toBe('2026-04-12')
})

test('localDateStr — 月 / 日补零', () => {
  const d = new Date(2026, 0, 5, 10, 0, 0)
  expect(localDateStr(d)).toBe('2026-01-05')
})

test('localDateTimeFileStr — YYYY-MM-DD_HH-mm', () => {
  const d = new Date(2026, 3, 12, 7, 4, 0)
  expect(localDateTimeFileStr(d)).toBe('2026-04-12_07-04')
})

test('localDateTimeStr — 人类可读 YYYY-MM-DD HH:mm:ss', () => {
  const d = new Date(2026, 3, 12, 7, 4, 48)
  expect(localDateTimeStr(d)).toBe('2026-04-12 07:04:48')
})

test('区分 UTC — localDateStr 使用系统时区而非 UTC', () => {
  // UTC 2026-04-11 23:04:48 这个瞬间：
  //   在 +08 时区读 → 2026-04-12 07:04:48（正确：属于今天）
  //   用 toISOString().split('T')[0] → 2026-04-11（错误：属于昨天）
  const utcInstant = new Date('2026-04-11T23:04:48.000Z')
  const local = localDateStr(utcInstant)
  expect(local).toMatch(/^\d{4}-\d{2}-\d{2}$/)

  // 只有系统 TZ 是 +08~+14 的机器才能断言结果是 2026-04-12；
  // 这里做软断言：新 helper 与 .getDate 保持一致（永远不跨天漂移）。
  const expectedDay = String(utcInstant.getDate()).padStart(2, '0')
  const expectedMonth = String(utcInstant.getMonth() + 1).padStart(2, '0')
  const expectedYear = utcInstant.getFullYear()
  expect(local).toBe(`${expectedYear}-${expectedMonth}-${expectedDay}`)
})

test('localDateStr — 无参调用不受过期 Date 实例影响', () => {
  const a = localDateStr()
  const b = localDateStr()
  expect(a).toBe(b)
  expect(a).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})
