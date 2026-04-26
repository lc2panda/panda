/**
 * Input:  mock messages + mock signal
 * Output: 断言 generateAwaySummary 在三种边界条件下的行为（用于 /recap 复用前提）
 * Pos:    src/services/awaySummary.test.ts — /recap 命令依赖此函数
 *         作为纯函数的语义保证；测试是 /recap 实施的前置回归网。
 *
 * NEW-FILE:#20260426-01（与 src/commands/recap/index.ts 同批审批）
 */

import { test, expect, mock, afterEach, describe } from 'bun:test'
import type { Message } from '../types/message.js'
import { createUserMessage } from '../utils/messages.js'

afterEach(() => {
  mock.restore()
})

describe('generateAwaySummary — /recap 复用前提', () => {
  test('空 messages 返回 null，不发起 API 调用', async () => {
    const mod = await import('./awaySummary.js?empty=1')
    const ctrl = new AbortController()
    const result = await mod.generateAwaySummary([], ctrl.signal)
    expect(result).toBeNull()
  })

  test('已 abort 的信号路径返回 null（中止后不返回内容）', async () => {
    // 通过先 mock queryModelWithoutStreaming 抛 APIUserAbortError，
    // 模拟"调用前 / 调用中信号已 abort"的真实路径。
    mock.module('./api/claude.js', () => ({
      queryModelWithoutStreaming: async () => {
        // 模拟 SDK 在 signal 已 abort 时抛出的错误
        const { APIUserAbortError } = await import('@anthropic-ai/sdk')
        throw new APIUserAbortError({ message: 'aborted' } as any)
      },
    }))
    mock.module('./SessionMemory/sessionMemoryUtils.js', () => ({
      getSessionMemoryContent: async () => null,
    }))
    const mod = await import('./awaySummary.js?abort=1')
    const ctrl = new AbortController()
    ctrl.abort()
    const messages: Message[] = [
      createUserMessage({ content: 'hello' }),
    ] as Message[]
    const result = await mod.generateAwaySummary(messages, ctrl.signal)
    expect(result).toBeNull()
  })

  test('正常路径：mock 30 条消息 + 假 API → 返回非空字符串', async () => {
    mock.module('./api/claude.js', () => ({
      queryModelWithoutStreaming: async () => ({
        type: 'assistant',
        isApiErrorMessage: false,
        message: {
          id: 'mock_msg',
          type: 'message',
          role: 'assistant',
          model: 'mock-haiku',
          content: [
            {
              type: 'text',
              text: 'You were debugging the auth race. Next step: add cleanup.',
            },
          ],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: 10,
            output_tokens: 10,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            server_tool_use: null,
            service_tier: null,
          },
        },
        costUSD: 0,
        durationMs: 1,
        uuid: 'mock-uuid',
        timestamp: new Date().toISOString(),
      }),
    }))
    mock.module('./SessionMemory/sessionMemoryUtils.js', () => ({
      getSessionMemoryContent: async () => 'memory-block',
    }))
    mock.module('../utils/messages.js', () => ({
      createUserMessage: (input: { content: string }) =>
        ({
          type: 'user',
          message: {
            id: 'u',
            role: 'user',
            content: [{ type: 'text', text: input.content }],
          },
          uuid: 'u',
          timestamp: '0',
          isMeta: false,
        }) as any,
      getAssistantMessageText: (m: any) => {
        // 直接返回 mock content 中的 text
        return m?.message?.content?.[0]?.text ?? ''
      },
    }))
    mock.module('../utils/model/model.js', () => ({
      getSmallFastModel: () => 'mock-haiku',
    }))
    mock.module('../Tool.js', () => ({
      getEmptyToolPermissionContext: () => ({}),
    }))
    mock.module('../utils/systemPromptType.js', () => ({
      asSystemPrompt: (x: any) => x,
    }))

    const mod = await import('./awaySummary.js?normal=1')
    const messages: Message[] = Array.from({ length: 30 }, (_, i) => ({
      type: 'user',
      message: {
        id: `u${i}`,
        role: 'user',
        content: [{ type: 'text', text: `msg ${i}` }],
      },
      uuid: `u${i}`,
      timestamp: '0',
      isMeta: false,
    })) as unknown as Message[]
    const ctrl = new AbortController()
    const result = await mod.generateAwaySummary(messages, ctrl.signal)
    expect(typeof result).toBe('string')
    expect(result?.length).toBeGreaterThan(0)
  })
})
