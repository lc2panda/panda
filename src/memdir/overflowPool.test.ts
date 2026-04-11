// Input: overflowPool 模块的导出函数
// Output: bun:test 断言结果（5 组）
// Pos: P0-1 MEMORY.md 溢出池单元验证（Wave 5A Agent P）

import { test, expect, beforeEach } from 'bun:test'
import {
  saveOverflow,
  listOverflow,
  searchOverflow,
  getOverflowStats,
} from './overflowPool.js'
import { rmSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const OVERFLOW_BASE = join(homedir(), '.pandacc', 'memory', 'overflow')
const TEST_TOPIC = 'TEST_MEMORY.md'

beforeEach(() => {
  try {
    const testDir = join(OVERFLOW_BASE, TEST_TOPIC)
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true })
  } catch {}
})

test('saveOverflow — 保存条目', () => {
  const result = saveOverflow(TEST_TOPIC, 'overflow content here', 21)
  expect(result).not.toBeNull()
  expect(result?.basename).toBe(TEST_TOPIC)
  expect(result?.excessChars).toBe(21)
  expect(existsSync(result!.filePath)).toBe(true)
})

test('listOverflow — 列出 topic 下的条目（按时间倒序）', () => {
  saveOverflow(TEST_TOPIC, 'first entry', 11)
  const start = Date.now()
  while (Date.now() - start < 5) {}
  saveOverflow(TEST_TOPIC, 'second entry', 12)

  const list = listOverflow(TEST_TOPIC)
  expect(list.length).toBeGreaterThanOrEqual(2)
  expect(list[0].savedAt).toBeGreaterThanOrEqual(list[1].savedAt)
})

test('searchOverflow — 关键字子串匹配', () => {
  saveOverflow(TEST_TOPIC, 'apple banana cherry', 19)
  saveOverflow(TEST_TOPIC, 'date elderberry fig', 19)

  const results = searchOverflow('banana', TEST_TOPIC)
  expect(results.length).toBeGreaterThanOrEqual(1)
  expect(results[0].content).toContain('banana')
})

test('searchOverflow — case insensitive', () => {
  saveOverflow(TEST_TOPIC, 'Apple Banana', 12)
  const results = searchOverflow('BANANA', TEST_TOPIC)
  expect(results.length).toBeGreaterThanOrEqual(1)
})

test('getOverflowStats — 统计', () => {
  saveOverflow(TEST_TOPIC, 'stats test', 10)
  const stats = getOverflowStats()
  expect(stats.totalFiles).toBeGreaterThan(0)
  expect(stats.topics).toBeGreaterThan(0)
})

test('listOverflow — 不存在的 topic 返回空', () => {
  const list = listOverflow('NON_EXISTENT_TOPIC_XYZ.md')
  expect(list).toEqual([])
})

test('searchOverflow — 无匹配时返回空', () => {
  saveOverflow(TEST_TOPIC, 'hello world', 11)
  const results = searchOverflow('xyz-nothing-matches', TEST_TOPIC)
  expect(results).toEqual([])
})
