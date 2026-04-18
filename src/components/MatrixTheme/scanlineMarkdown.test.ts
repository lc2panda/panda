// Input: 无（bun test）
// Output: tokenizeScanline 关键词高亮 + parity base/neon 切换的纯函数测试
// Pos: v3 P5 / P10 验证
//
// [NEW-FILE:#20260418-26]

import { test, expect } from 'bun:test'
import { tokenizeScanline } from './scanlineMarkdown.js'

test('空文本返回空数组', () => {
  expect(tokenizeScanline('', 0)).toEqual([])
})

test('纯文本无关键词 — 整段标 base（parity=0）', () => {
  const tokens = tokenizeScanline('hello world here', 0)
  expect(tokens.length).toBe(1)
  expect(tokens[0]?.color).toBe('base')
  expect(tokens[0]?.text).toBe('hello world here')
})

test('parity=1 → neon', () => {
  const tokens = tokenizeScanline('plain line', 1)
  expect(tokens[0]?.color).toBe('neon')
})

test('inline `code` 高亮为 bright', () => {
  const tokens = tokenizeScanline('use `foo` here', 0)
  const codeTok = tokens.find(t => t.text === '`foo`')
  expect(codeTok?.color).toBe('bright')
})

test('数字高亮为 bright', () => {
  const tokens = tokenizeScanline('count is 42 items', 0)
  const num = tokens.find(t => t.text === '42')
  expect(num?.color).toBe('bright')
})

test('文件扩展名高亮为 bright', () => {
  const tokens = tokenizeScanline('open foo.tsx now', 0)
  const file = tokens.find(t => t.text === 'foo.tsx')
  expect(file?.color).toBe('bright')
})

test('URL 高亮为 bright', () => {
  const tokens = tokenizeScanline('see https://example.com next', 0)
  const url = tokens.find(t => t.text === 'https://example.com')
  expect(url?.color).toBe('bright')
})

test('CamelCase 高亮为 bright', () => {
  const tokens = tokenizeScanline('call MyClassName here', 0)
  const cc = tokens.find(t => t.text === 'MyClassName')
  expect(cc?.color).toBe('bright')
})

test('多关键词混合 — 普通段落保留 base 色', () => {
  const tokens = tokenizeScanline('open `foo.tsx` line 12', 0)
  const colors = tokens.map(t => t.color)
  // 至少一段 base 一段 bright
  expect(colors).toContain('base')
  expect(colors).toContain('bright')
})
