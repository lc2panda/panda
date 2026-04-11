// Input: isSensitiveClipboardContent 导出与 clipboard-poll 任务的脱敏逻辑
// Output: bun:test 断言结果（敏感过滤 + 正常文本 + 边界）
// Pos: Wave 3 Agent M — clipboard-poll 任务的单元验证

import { test, expect } from 'bun:test'
import { isSensitiveClipboardContent } from '../memdir/memdir.js'

test('isSensitiveClipboardContent — OpenAI/Anthropic key 应被命中', () => {
  expect(isSensitiveClipboardContent('sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890')).toBe(true)
  expect(isSensitiveClipboardContent('my key is sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe(true)
})

test('isSensitiveClipboardContent — GitHub token 应被命中', () => {
  expect(isSensitiveClipboardContent('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef')).toBe(true)
})

test('isSensitiveClipboardContent — password/token key=value 应被命中', () => {
  expect(isSensitiveClipboardContent('password: mySecret12345')).toBe(true)
  expect(isSensitiveClipboardContent('api_key=abcdef123456789')).toBe(true)
  expect(isSensitiveClipboardContent('SECRET = veryLongSecretValue')).toBe(true)
})

test('isSensitiveClipboardContent — 信用卡号应被命中', () => {
  expect(isSensitiveClipboardContent('4532 1488 0343 6467')).toBe(true)
  expect(isSensitiveClipboardContent('card 4532-1488-0343-6467 expires')).toBe(true)
})

test('isSensitiveClipboardContent — 普通文本应保留', () => {
  expect(isSensitiveClipboardContent('这是一段普通的笔记内容')).toBe(false)
  expect(isSensitiveClipboardContent('const foo = bar()')).toBe(false)
  expect(isSensitiveClipboardContent('https://example.com/docs')).toBe(false)
})

test('isSensitiveClipboardContent — 空字符串应返回 false', () => {
  expect(isSensitiveClipboardContent('')).toBe(false)
})

test('clipboard-poll 任务已注册到 BUILTIN_TASKS', async () => {
  const { BUILTIN_TASKS } = await import('./builtinTasks.js')
  const poll = BUILTIN_TASKS.find(t => t.id === 'clipboard-poll')
  expect(poll).toBeDefined()
  expect(poll!.cron).toBe('*/2 * * * *')
  expect(poll!.enabled).toBe(true)
})
