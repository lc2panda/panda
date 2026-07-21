/**
 * P0: stripUnavailableToolReferencesFromAssistantMessage
 * P2: stripIllegalToolUseInLastTurn
 *
 * 验证：
 * - 合法 tool_use 保留
 * - 非法 tool_use 转 text 提示（含 "tool no longer available" / "Do not retry"）
 * - 不破坏 user 侧现有 strip 行为
 * - stripIllegalToolUseInLastTurn 仅动最近一轮 assistant，并清理 orphan tool_result
 */
import { describe, expect, test } from 'bun:test'
import type { Tool } from '../Tool.js'
import type { AssistantMessage, Message, UserMessage } from '../types/message.js'
import {
  normalizeMessagesForAPI,
  stripIllegalToolUseInLastTurn,
  stripUnavailableToolReferencesFromAssistantMessage,
} from './messages.js'

function makeTool(name: string): Tool {
  return {
    name,
    inputSchema: {} as Tool['inputSchema'],
    description: async () => name,
    prompt: async () => name,
    call: async () => ({ data: '' }),
    isEnabled: () => true,
    isConcurrencySafe: () => true,
    isReadOnly: () => true,
    userFacingName: () => name,
  } as unknown as Tool
}

function makeAssistantWithToolUses(
  toolUses: Array<{ id: string; name: string; input?: Record<string, unknown> }>,
): AssistantMessage {
  return {
    type: 'assistant',
    uuid: 'asst-uuid-1',
    timestamp: new Date().toISOString(),
    requestId: undefined,
    message: {
      id: 'msg_asst_1',
      type: 'message',
      role: 'assistant',
      model: 'test-model',
      content: toolUses.map(tu => ({
        type: 'tool_use' as const,
        id: tu.id,
        name: tu.name,
        input: tu.input ?? {},
      })),
      stop_reason: 'tool_use',
      stop_sequence: null,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    },
  } as unknown as AssistantMessage
}

function makeUserWithToolReference(toolName: string): UserMessage {
  return {
    type: 'user',
    uuid: 'user-uuid-1',
    timestamp: new Date().toISOString(),
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tr_1',
          content: [
            {
              type: 'tool_reference' as const,
              tool_name: toolName,
            } as unknown as { type: 'text'; text: string },
          ],
        },
      ],
    },
  } as unknown as UserMessage
}

describe('stripUnavailableToolReferencesFromAssistantMessage (P0)', () => {
  test('保留可用工具的 tool_use', () => {
    const available = new Set(['Bash', 'Read', 'Edit'])
    const msg = makeAssistantWithToolUses([
      { id: 'tu_1', name: 'Bash', input: { command: 'ls' } },
      { id: 'tu_2', name: 'Read', input: { file_path: '/tmp/a' } },
    ])

    const result = stripUnavailableToolReferencesFromAssistantMessage(
      msg,
      available,
    )

    expect(result).toBe(msg) // 无非法时返回原引用
    expect(result.message.content).toHaveLength(2)
    expect(
      (result.message.content as Array<{ type: string; name: string }>).map(
        b => b.name,
      ),
    ).toEqual(['Bash', 'Read'])
  })

  test('非法 tool_use 转 text 提示（含 Do not retry）', () => {
    const available = new Set(['Bash', 'Read'])
    const msg = makeAssistantWithToolUses([
      { id: 'tu_ok', name: 'Bash', input: { command: 'echo hi' } },
      { id: 'tu_bad', name: 'AskUserQuestion', input: { question: 'ok?' } },
    ])

    const result = stripUnavailableToolReferencesFromAssistantMessage(
      msg,
      available,
    )

    expect(result).not.toBe(msg) // immutable：产生新对象
    const content = result.message.content as Array<{
      type: string
      name?: string
      text?: string
      id?: string
    }>
    expect(content).toHaveLength(2)

    // 合法 Bash 保留
    expect(content[0]!.type).toBe('tool_use')
    expect(content[0]!.name).toBe('Bash')
    expect(content[0]!.id).toBe('tu_ok')

    // 非法 AskUserQuestion → text 提示
    expect(content[1]!.type).toBe('text')
    expect(content[1]!.text).toContain('tool no longer available')
    expect(content[1]!.text).toContain('Do not retry this tool call')
    expect(content[1]!.text).toContain('AskUserQuestion')
    expect(content[1]!.text).toContain('tu_bad')
  })

  test('全部非法时 content 不为空（text 占位）', () => {
    const available = new Set(['Bash'])
    const msg = makeAssistantWithToolUses([
      { id: 'tu_x', name: 'WorkerTool', input: {} },
      { id: 'tu_y', name: 'GhostTool', input: {} },
    ])

    const result = stripUnavailableToolReferencesFromAssistantMessage(
      msg,
      available,
    )
    const content = result.message.content as Array<{ type: string; text?: string }>
    expect(content.length).toBeGreaterThan(0)
    expect(content.every(b => b.type === 'text')).toBe(true)
    expect(content[0]!.text).toContain('tool no longer available')
  })

  test('不破坏 user 侧现有行为（经 normalizeMessagesForAPI 间接验证）', () => {
    // user 侧 strip 是 messages.ts 内部函数；通过 normalizeMessagesForAPI 间接验证：
    // 含可用/不可用 tool_reference 的 user 消息都能正常归一化且不抛错
    const tools = [makeTool('Bash'), makeTool('Read')]
    const userOk = makeUserWithToolReference('Bash')
    const userBad = makeUserWithToolReference('AskUserQuestion')
    const normalized = normalizeMessagesForAPI([userOk, userBad], tools)
    expect(Array.isArray(normalized)).toBe(true)
    // 不可用 tool_reference 应被滤掉，序列化后不含 AskUserQuestion
    const serialized = JSON.stringify(normalized)
    expect(serialized).not.toContain('AskUserQuestion')
  })

  test('normalizeMessagesForAPI 路径真正调用 strip（P0 调度）', () => {
    const tools = [makeTool('Bash'), makeTool('Read')]
    const msg = makeAssistantWithToolUses([
      { id: 'tu_ok', name: 'Bash', input: { command: 'pwd' } },
      { id: 'tu_bad', name: 'AskUserQuestion', input: { q: 'x' } },
    ])

    const normalized = normalizeMessagesForAPI([msg], tools)
    const asst = normalized.find(m => m.type === 'assistant') as AssistantMessage
    expect(asst).toBeDefined()
    const content = asst.message.content as Array<{
      type: string
      name?: string
      text?: string
    }>
    // Bash 保留
    expect(content.some(b => b.type === 'tool_use' && b.name === 'Bash')).toBe(
      true,
    )
    // AskUserQuestion 不再以 tool_use 出现
    expect(
      content.some(b => b.type === 'tool_use' && b.name === 'AskUserQuestion'),
    ).toBe(false)
    // 出现 text 提示
    expect(
      content.some(
        b =>
          b.type === 'text' &&
          typeof b.text === 'string' &&
          b.text.includes('tool no longer available'),
      ),
    ).toBe(true)
  })
})

describe('stripIllegalToolUseInLastTurn (P2)', () => {
  test('剥离最近一轮 assistant 中的非法 tool_use', () => {
    const available = new Set(['Bash'])
    const asst = makeAssistantWithToolUses([
      { id: 'tu_ok', name: 'Bash', input: { command: 'ls' } },
      { id: 'tu_bad', name: 'AskUserQuestion', input: {} },
    ])
    const messages: Message[] = [asst]

    const changed = stripIllegalToolUseInLastTurn(messages, available)
    expect(changed).toBe(true)

    const content = (messages[0] as AssistantMessage).message.content as Array<{
      type: string
      name?: string
      text?: string
    }>
    expect(content.some(b => b.type === 'tool_use' && b.name === 'Bash')).toBe(
      true,
    )
    expect(
      content.some(b => b.type === 'tool_use' && b.name === 'AskUserQuestion'),
    ).toBe(false)
    expect(
      content.some(
        b =>
          b.type === 'text' &&
          typeof b.text === 'string' &&
          b.text.includes('Do not retry'),
      ),
    ).toBe(true)
  })

  test('清理紧随其后的 orphan tool_result', () => {
    const available = new Set(['Bash'])
    const asst = makeAssistantWithToolUses([
      { id: 'tu_bad', name: 'AskUserQuestion', input: {} },
    ])
    const user = {
      type: 'user',
      uuid: 'u2',
      timestamp: new Date().toISOString(),
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result' as const,
            tool_use_id: 'tu_bad',
            content: 'previous result',
          },
          {
            type: 'tool_result' as const,
            tool_use_id: 'tu_other',
            content: 'keep me',
          },
        ],
      },
    } as unknown as UserMessage
    const messages: Message[] = [asst, user]

    const changed = stripIllegalToolUseInLastTurn(messages, available)
    expect(changed).toBe(true)

    const userContent = (messages[1] as UserMessage).message.content as Array<{
      type: string
      tool_use_id?: string
    }>
    expect(userContent.some(b => b.tool_use_id === 'tu_bad')).toBe(false)
    expect(userContent.some(b => b.tool_use_id === 'tu_other')).toBe(true)
  })

  test('无可剥离时返回 false', () => {
    const available = new Set(['Bash', 'AskUserQuestion'])
    const asst = makeAssistantWithToolUses([
      { id: 'tu_1', name: 'Bash', input: {} },
    ])
    const messages: Message[] = [asst]
    expect(stripIllegalToolUseInLastTurn(messages, available)).toBe(false)
  })
})
