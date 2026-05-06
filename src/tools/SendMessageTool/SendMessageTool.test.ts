// Input: SendMessageTool.validateInput 多种 input 形态
// Output: Bun test assertions —— 验证 W23A 修复（summary 缺失自动 fallback，不再硬拒绝）
// Pos: src/tools/SendMessageTool/ — Anthropic OAuth 偶发 "summary is required" hotfix 回归测
import { test, expect } from 'bun:test'
import type { ToolUseContext } from '../../Tool.js'
import { SendMessageTool } from './SendMessageTool.js'

// validateInput 的 _context 标了下划线，方法体不读它 —— 安全用 cast 占位
const stubContext = {} as unknown as ToolUseContext

test('summary 缺失 + message 是 string → 不再拒绝，自动从 message 截取 fallback', async () => {
  const input = {
    to: 'researcher',
    message: 'start working on task #42 right away please',
  } as Parameters<NonNullable<typeof SendMessageTool.validateInput>>[0]

  const result = await SendMessageTool.validateInput!(input, stubContext)

  expect(result.result).toBe(true)
  // input.summary 应当被回填为 message 截断版（≤50 列、首行）
  expect((input as { summary?: string }).summary).toBe(
    'start working on task #42 right away please',
  )
})

test('summary 是空字符串 + message 是 string → 同样 fallback 回填', async () => {
  const input = {
    to: 'researcher',
    summary: '',
    message: 'hello world',
  } as Parameters<NonNullable<typeof SendMessageTool.validateInput>>[0]

  const result = await SendMessageTool.validateInput!(input, stubContext)

  expect(result.result).toBe(true)
  expect((input as { summary?: string }).summary).toBe('hello world')
})

test('summary 是空白 (whitespace) + message 是 string → fallback 回填', async () => {
  const input = {
    to: 'researcher',
    summary: '   ',
    message: 'multi\nline\nmessage',
  } as Parameters<NonNullable<typeof SendMessageTool.validateInput>>[0]

  const result = await SendMessageTool.validateInput!(input, stubContext)

  expect(result.result).toBe(true)
  // truncate(_, 50, true=singleLine) 在首个换行处截断并加 …
  expect((input as { summary?: string }).summary).toBe('multi…')
})

test('summary 已正常提供 → 保持原值不动', async () => {
  const input = {
    to: 'researcher',
    summary: 'kick off task 1',
    message: 'start working on task #1 right away',
  } as Parameters<NonNullable<typeof SendMessageTool.validateInput>>[0]

  const result = await SendMessageTool.validateInput!(input, stubContext)

  expect(result.result).toBe(true)
  expect((input as { summary?: string }).summary).toBe('kick off task 1')
})

test('message 超长 → fallback 截断到 ≤50 列', async () => {
  const longMsg = 'a'.repeat(200)
  const input = {
    to: 'researcher',
    message: longMsg,
  } as Parameters<NonNullable<typeof SendMessageTool.validateInput>>[0]

  const result = await SendMessageTool.validateInput!(input, stubContext)

  expect(result.result).toBe(true)
  const fallback = (input as { summary?: string }).summary
  expect(fallback).toBeDefined()
  // truncate 在 50 列内（含 ellipsis），允许 ASCII 单字节 ≤ 50
  expect(fallback!.length).toBeLessThanOrEqual(50)
  expect(fallback).toContain('a')
})

test('to 为空 → 仍然返回 to must not be empty（其他校验未受影响）', async () => {
  const input = {
    to: '',
    message: 'hi',
  } as Parameters<NonNullable<typeof SendMessageTool.validateInput>>[0]

  const result = await SendMessageTool.validateInput!(input, stubContext)

  expect(result.result).toBe(false)
  if (!result.result) {
    expect(result.message).toBe('to must not be empty')
  }
})

test('to 含 @ → 仍然返回相应错误（其他校验未受影响）', async () => {
  const input = {
    to: 'foo@bar',
    message: 'hi',
  } as Parameters<NonNullable<typeof SendMessageTool.validateInput>>[0]

  const result = await SendMessageTool.validateInput!(input, stubContext)

  expect(result.result).toBe(false)
  if (!result.result) {
    expect(result.message).toContain('bare teammate name')
  }
})

test('结构化 message (shutdown_response) 非 TEAM_LEAD → 拒绝（确认无回归）', async () => {
  const input = {
    to: 'researcher', // 不是 team-lead
    message: {
      type: 'shutdown_response' as const,
      request_id: 'req-1',
      approve: true,
    },
  } as Parameters<NonNullable<typeof SendMessageTool.validateInput>>[0]

  const result = await SendMessageTool.validateInput!(input, stubContext)

  expect(result.result).toBe(false)
  if (!result.result) {
    expect(result.message).toContain('shutdown_response must be sent to')
  }
})
