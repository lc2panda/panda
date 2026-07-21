// Input: Tool fixture + messages + tools list
// Output: Verify composeSchemaHint returns the correct branch message
// Pos: P1 修复（toolExecution.ts）单元测试 — 隔离验证 deferred / 非 deferred 双路径
//
// 策略：直接测试 `composeSchemaHint` 纯函数（不依赖运行时 feature flag）。
// `buildSchemaNotSentHint` 是它的薄包装（含 env gate），单元测试通过专
// 注于纯逻辑分支，避免 mock 整个 prompt.ts 模块导致的连带副作用。
import { describe, expect, test } from 'bun:test'
import { composeSchemaHint } from './toolExecution.js'

interface FakeTool {
  name: string
  isMcp?: boolean
  alwaysLoad?: boolean
  description?: string
}

describe('P1: composeSchemaHint 双路径分支', () => {
  test('测试 1：deferred tool 且未被发现 → 保留 "Load the tool first" 消息', () => {
    // 非 MCP、非 alwaysLoad → isDeferredTool 走默认分支（MCP 为 true 视为 deferred）
    // 这里用 isMcp=true 强制 deferred
    const tool: FakeTool = { name: 'Bash', isMcp: true }
    const messages: unknown[] = [] // 空消息 → discovered 为空集
    const tools: FakeTool[] = [{ name: 'Bash' }]

    const result = composeSchemaHint(
      tool as unknown as Parameters<typeof composeSchemaHint>[0],
      messages as never,
      tools,
    )

    expect(result).not.toBeNull()
    expect(result).toContain('Load the tool first')
    expect(result).toContain('ToolSearch')
    expect(result).toContain('select:Bash')
    expect(result).toContain('retry')
  })

  test('测试 2：非 deferred tool 且不在 tools 列表 → 返回永久性错误', () => {
    // alwaysLoad=true → 走非 deferred 分支（即便 tool 本身可视为可加载）
    const tool: FakeTool = { name: 'RemovedTool', alwaysLoad: true }
    const messages: unknown[] = []
    const tools: FakeTool[] = [{ name: 'Read' }, { name: 'Write' }]

    const result = composeSchemaHint(
      tool as unknown as Parameters<typeof composeSchemaHint>[0],
      messages as never,
      tools,
    )

    expect(result).not.toBeNull()
    expect(result).toContain('RemovedTool')
    expect(result).toContain('no longer available')
  })

  test('测试 3：永久性错误消息不含 "retry" 字样', () => {
    const tool: FakeTool = { name: 'GhostTool', alwaysLoad: true }
    const messages: unknown[] = []
    const tools: FakeTool[] = [{ name: 'Read' }]

    const result = composeSchemaHint(
      tool as unknown as Parameters<typeof composeSchemaHint>[0],
      messages as never,
      tools,
    )

    expect(result).not.toBeNull()
    // 永久性错误必须显式禁止重试（"Do not retry this tool call"）。
    // 不应再出现引导模型继续调用的"then retry this call"措辞。
    expect(result).toContain('Do not retry this tool call')
    expect(result).not.toMatch(/then retry this call/i)
  })

  test('附加：非 deferred tool 但仍在 tools 列表 → 返回 null', () => {
    const tool: FakeTool = { name: 'Read', alwaysLoad: true }
    const messages: unknown[] = []
    const tools: FakeTool[] = [{ name: 'Read' }, { name: 'Write' }]

    const result = composeSchemaHint(
      tool as unknown as Parameters<typeof composeSchemaHint>[0],
      messages as never,
      tools,
    )

    expect(result).toBeNull()
  })

  test('附加：deferred tool 但已被发现 → 返回 null', () => {
    const tool: FakeTool = { name: 'Bash', isMcp: true }
    // 真实发现机制：tool_reference 必须嵌套在 tool_result.content 中
    // （即 ToolSearchTool 的返回值）。详见 extractDiscoveredToolNames 实现。
    const messages = [
      {
        type: 'user',
        message: {
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'tool_use_1',
              is_error: false,
              content: [
                {
                  type: 'tool_reference',
                  tool_name: 'Bash',
                },
              ],
            },
          ],
        },
      },
    ]
    const tools: FakeTool[] = [{ name: 'Bash' }]

    const result = composeSchemaHint(
      tool as unknown as Parameters<typeof composeSchemaHint>[0],
      messages as never,
      tools,
    )

    expect(result).toBeNull()
  })
})

describe('P2: unknown tool 永久错误文案', () => {
  test('No such tool available 含 Do not retry this tool call', async () => {
    const { runToolUse } = await import('./toolExecution.js')
    const assistantMessage = {
      type: 'assistant',
      uuid: '00000000-0000-4000-8000-000000000001',
      message: { id: 'msg_unknown_tool', content: [] },
      requestId: undefined,
    }
    const toolUse = {
      type: 'tool_use',
      id: 'toolu_unknown_1',
      name: 'TotallyFakeToolXYZ',
      input: {},
    }
    const toolUseContext = {
      options: {
        tools: [],
        mcpClients: [],
      },
      queryTracking: undefined,
      abortController: new AbortController(),
    }

    const updates: Array<{
      message?: {
        toolUseResult?: string
        message?: {
          content?: Array<{ type: string; content?: string; is_error?: boolean }>
        }
      }
    }> = []
    for await (const update of runToolUse(
      toolUse as never,
      assistantMessage as never,
      (async () => ({ behavior: 'allow' as const })) as never,
      toolUseContext as never,
    )) {
      updates.push(update as never)
    }

    expect(updates.length).toBe(1)
    const msg = updates[0]!.message!
    expect(msg.toolUseResult).toContain(
      'No such tool available: TotallyFakeToolXYZ',
    )
    expect(msg.toolUseResult).toContain('Do not retry this tool call')
    const block = msg.message?.content?.find(b => b.type === 'tool_result')
    expect(block?.is_error).toBe(true)
    expect(String(block?.content)).toContain('Do not retry this tool call')
  })
})
