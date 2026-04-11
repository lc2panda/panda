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

// ───────────────────────────────────────────────
// P0-1 Wave 5A：compressBoundedContent 超限时自动落盘 overflow
// ───────────────────────────────────────────────
test('compressBoundedContent — 超限时自动写 overflow（fire-and-forget）', async () => {
  // 使用独立 topic 避免污染真实 MEMORY.md
  const TOPIC = 'TEST_BOUNDED_OVERFLOW.md'
  // 先清理
  const { rmSync, existsSync: existsSync2 } = await import('fs')
  const { join: join2 } = await import('path')
  const { homedir: homedir2 } = await import('os')
  const dir = join2(homedir2(), '.pandacc', 'memory', 'overflow', TOPIC)
  try {
    if (existsSync2(dir)) rmSync(dir, { recursive: true, force: true })
  } catch {}

  // 构造一个 basename 命中自定义 topic 的场景：直接用 compressBoundedContent 强制 maxChars
  const lines = ['# Title', '## Section', 'header3', 'header4', 'header5']
  for (let i = 0; i < 200; i++) lines.push(`line ${i} ${'x'.repeat(50)}`)
  const content = lines.join('\n')

  const compressed = compressBoundedContent(`/tmp/${TOPIC}`, content, 2200)
  expect(compressed.length).toBeLessThanOrEqual(2200)
  expect(compressed).toContain('overflow')

  // 等异步 saveOverflow 完成
  await new Promise(r => setTimeout(r, 200))

  const { listOverflow } = await import('./overflowPool.js')
  const list = listOverflow(TOPIC)
  expect(list.length).toBeGreaterThan(0)
  // 内容应包含中段被丢弃的 line
  const joined = list.map(e => e.content).join('\n')
  expect(joined).toContain('line ')
})

test('compressBoundedContent — skipOverflow 选项禁用落盘', async () => {
  const TOPIC = 'TEST_SKIP_OVERFLOW.md'
  const { rmSync, existsSync: existsSync2 } = await import('fs')
  const { join: join2 } = await import('path')
  const { homedir: homedir2 } = await import('os')
  const dir = join2(homedir2(), '.pandacc', 'memory', 'overflow', TOPIC)
  try {
    if (existsSync2(dir)) rmSync(dir, { recursive: true, force: true })
  } catch {}

  const lines = ['# T', '## S', 'h3', 'h4', 'h5']
  for (let i = 0; i < 200; i++) lines.push(`line ${i} ${'y'.repeat(50)}`)
  const content = lines.join('\n')

  compressBoundedContent(`/tmp/${TOPIC}`, content, 2200, { skipOverflow: true })
  await new Promise(r => setTimeout(r, 150))

  const { listOverflow } = await import('./overflowPool.js')
  const list = listOverflow(TOPIC)
  expect(list.length).toBe(0)
})

test('enforceBounded — 返回值包含 overflowSaved 标记', () => {
  const lines = ['# Idx', '## A', 'h3', 'h4', 'h5']
  for (let i = 0; i < 300; i++) lines.push(`- item ${i} ${'y'.repeat(30)}`)
  const content = lines.join('\n')
  const result = enforceBounded('/some/path/MEMORY.md', content)
  expect(result.compressed).toBe(true)
  expect(result.overflowSaved).toBe(true)
})

test('enforceBounded — 未触发压缩时 overflowSaved=false', () => {
  const result = enforceBounded('/some/path/MEMORY.md', 'short')
  expect(result.compressed).toBe(false)
  expect(result.overflowSaved).toBe(false)
})
