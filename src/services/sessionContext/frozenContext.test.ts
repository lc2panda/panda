// Input: frozen snapshot API exercises
// Output: unit test coverage for Hermes P0-4 byte-stable context layer
// Pos: guards the prefix-cache-hit invariant (multi-read must be byte-identical)

import { beforeEach, expect, test } from 'bun:test'
import { sep } from 'path'
import {
  freezeFile,
  getFrozenStats,
  isSessionFrozen,
  markSessionFrozen,
  readFrozen,
  unfreezeSession,
} from './frozenContext.js'

beforeEach(() => {
  unfreezeSession()
})

test('readFrozen — 未冻结时返回 null', () => {
  expect(readFrozen('/foo')).toBeNull()
})

test('freezeFile + readFrozen — 冻结后能读', () => {
  freezeFile('/foo', 'content here')
  expect(readFrozen('/foo')).toBe('content here')
})

test('markSessionFrozen — 设置 frozen 状态', () => {
  expect(isSessionFrozen()).toBe(false)
  markSessionFrozen()
  expect(isSessionFrozen()).toBe(true)
})

test('unfreezeSession — 重置', () => {
  freezeFile('/foo', 'content')
  markSessionFrozen()
  unfreezeSession()
  expect(isSessionFrozen()).toBe(false)
  expect(readFrozen('/foo')).toBeNull()
})

test('getFrozenStats — 统计', () => {
  freezeFile('/a', 'aaa')
  freezeFile('/b', 'bbbb')
  const stats = getFrozenStats()
  expect(stats.count).toBe(2)
  expect(stats.totalBytes).toBe(7)
  // Stats normalizes paths via resolve() — uses platform-native separator (sep)
  // so on Windows the suffix becomes '\a', on POSIX it stays '/a'.
  expect(stats.files.some(f => f.endsWith(`${sep}a`))).toBe(true)
  expect(stats.files.some(f => f.endsWith(`${sep}b`))).toBe(true)
})

test('byte stability — 多次 readFrozen 字节完全一致', () => {
  const content = '# Test\n\n## Section\nContent here'
  freezeFile('/test.md', content)

  const r1 = readFrozen('/test.md')
  const r2 = readFrozen('/test.md')
  const r3 = readFrozen('/test.md')

  expect(r1).toBe(content)
  expect(r2).toBe(content)
  expect(r3).toBe(content)
  // Same string reference (Map stores one entry)
  expect(r1 === r2).toBe(true)
  expect(r2 === r3).toBe(true)
})

test('path normalization — 相对与绝对路径命中同一条目', () => {
  freezeFile('/tmp/foo/bar.md', 'abc')
  // Absolute path hits
  expect(readFrozen('/tmp/foo/bar.md')).toBe('abc')
  // Double-slash hits (normalized)
  expect(readFrozen('/tmp//foo/bar.md')).toBe('abc')
  // Path with trailing dot segment hits
  expect(readFrozen('/tmp/foo/./bar.md')).toBe('abc')
})

test('re-freeze — 同路径覆盖旧内容', () => {
  freezeFile('/x', 'first')
  expect(readFrozen('/x')).toBe('first')
  freezeFile('/x', 'second')
  expect(readFrozen('/x')).toBe('second')
  expect(getFrozenStats().count).toBe(1)
})

test('empty string — 空内容也是有效的冻结态（非 null）', () => {
  freezeFile('/empty', '')
  expect(readFrozen('/empty')).toBe('')
  // Distinct from "not frozen"
  expect(readFrozen('/nope')).toBeNull()
})

test('unfreezeSession — 清空后新冻结能正常工作', () => {
  freezeFile('/a', '1')
  markSessionFrozen()
  unfreezeSession()
  expect(isSessionFrozen()).toBe(false)
  freezeFile('/b', '2')
  expect(readFrozen('/a')).toBeNull()
  expect(readFrozen('/b')).toBe('2')
})
