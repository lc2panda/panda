// Input: boundedMemory 模块的导出函数
// Output: bun:test 断言结果（6 组）
// Pos: Wave 2 Bounded Memory 吸收任务的单元验证

import { test, expect } from 'bun:test'
import {
  checkBounded,
  compressBoundedContent,
  enforceBounded,
} from './boundedMemory.js'

test('checkBounded — within limit', () => {
  const result = checkBounded('MEMORY.md', 'short content')
  expect(result.withinLimit).toBe(true)
  expect(result.maxChars).toBe(2200)
})

test('checkBounded — exceeds limit', () => {
  const longContent = 'x'.repeat(2500)
  const result = checkBounded('MEMORY.md', longContent)
  expect(result.withinLimit).toBe(false)
  expect(result.excessChars).toBe(300)
})

test('checkBounded — unknown filename passes through', () => {
  const result = checkBounded('random.md', 'x'.repeat(10000))
  expect(result.withinLimit).toBe(true)
  expect(result.maxChars).toBe(Infinity)
})

test('compressBoundedContent — preserves under limit', () => {
  const content = 'short'
  const result = compressBoundedContent('MEMORY.md', content, 2200)
  expect(result).toBe(content)
})

test('compressBoundedContent — truncates over limit', () => {
  const lines = ['# Title', '## Section', 'header3', 'header4', 'header5']
  for (let i = 0; i < 200; i++) lines.push(`line ${i} ${'x'.repeat(50)}`)
  const content = lines.join('\n')
  const result = compressBoundedContent('MEMORY.md', content, 2200)
  expect(result.length).toBeLessThanOrEqual(2200)
  expect(result).toContain('# Title')
  expect(result).toContain('已 bounded 压缩')
})

test('checkBounded — profile.md uses 1375 limit', () => {
  const result = checkBounded('profile.md', 'x'.repeat(1500))
  expect(result.withinLimit).toBe(false)
  expect(result.maxChars).toBe(1375)
})

test('enforceBounded — compresses MEMORY.md over limit', () => {
  const lines = ['# Idx', '## A', 'h3', 'h4', 'h5']
  for (let i = 0; i < 300; i++) lines.push(`- item ${i} ${'y'.repeat(30)}`)
  const content = lines.join('\n')
  const result = enforceBounded('/some/path/MEMORY.md', content)
  expect(result.compressed).toBe(true)
  expect(result.content.length).toBeLessThanOrEqual(2200)
  expect(result.check.currentChars).toBe(content.length)
})

test('enforceBounded — passthrough for unknown file', () => {
  const result = enforceBounded('/tmp/random.log', 'x'.repeat(5000))
  expect(result.compressed).toBe(false)
  expect(result.content.length).toBe(5000)
})

test('checkBounded — basename extracted from full path', () => {
  const result = checkBounded('/home/user/.pandacc/memory/MEMORY.md', 'x'.repeat(2500))
  expect(result.withinLimit).toBe(false)
  expect(result.maxChars).toBe(2200)
})
