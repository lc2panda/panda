// Input: McpToolHook 配置 + 模拟 MCP server client + hookInput JSON
// Output: Bun test assertions on execMcpToolHook + 模板替换辅助
// Pos: Hooks v2 增强字段补齐 — mcp_tool handler 单元测试
import { describe, expect, test } from 'bun:test'
import {
  execMcpToolHook,
  substituteArguments,
  substituteTemplate,
} from './execMcpToolHook.js'
import type { ToolUseContext } from '../../Tool.js'
import type { AppState } from '../../state/AppState.js'

describe('substituteTemplate — whole-string placeholder preserves type', () => {
  test('whole ${path} resolves to original value (object)', () => {
    const out = substituteTemplate('${tool_input}', {
      tool_input: { file: 'a.txt', n: 3 },
    })
    expect(out).toEqual({ file: 'a.txt', n: 3 })
  })

  test('whole ${path} resolves to original value (number)', () => {
    const out = substituteTemplate('${count}', { count: 42 })
    expect(out).toBe(42)
  })

  test('whole ${path} on missing key returns undefined', () => {
    const out = substituteTemplate('${nope}', {})
    expect(out).toBeUndefined()
  })

  test('embedded ${path} stringifies into surrounding text', () => {
    const out = substituteTemplate(
      'hello ${tool_input.name}',
      { tool_input: { name: 'world' } },
    )
    expect(out).toBe('hello world')
  })

  test('embedded ${path} on missing key replaced with empty string', () => {
    const out = substituteTemplate('val=${missing}', {})
    expect(out).toBe('val=')
  })

  test('dotted path traverses nested objects', () => {
    const out = substituteTemplate('${a.b.c}', { a: { b: { c: 'deep' } } })
    expect(out).toBe('deep')
  })
})

describe('substituteArguments — recursive substitution', () => {
  test('recurses into nested objects/arrays', () => {
    const args = {
      simple: '${name}',
      nested: { key: '${id}' },
      list: ['${name}', 'static', '${id}'],
      passthrough: 7,
    }
    const out = substituteArguments(args, { name: 'panda', id: 42 })
    expect(out).toEqual({
      simple: 'panda',
      nested: { key: 42 },
      list: ['panda', 'static', 42],
      passthrough: 7,
    })
  })

  test('returns empty object for empty args', () => {
    expect(substituteArguments({}, { x: 1 })).toEqual({})
  })
})

// ---------- execMcpToolHook integration with mocked client ----------

function makeContext(clients: Array<{
  name: string
  type: 'connected' | 'failed' | 'pending' | 'needs-auth' | 'disabled'
  client?: { callTool: (...args: unknown[]) => Promise<unknown> }
}>): ToolUseContext {
  const appState = {
    mcp: { clients },
    toolPermissionContext: { mode: 'default' as const },
  } as unknown as AppState
  return {
    getAppState: () => appState,
    setAppState: () => {},
    abortController: new AbortController(),
    options: { tools: [] },
    setResponseLength: () => {},
    setStreamMode: () => {},
    setInProgressToolUseIDs: () => {},
    messages: [],
    requireCanUseTool: false,
    preserveToolUseResults: false,
  } as unknown as ToolUseContext
}

test('execMcpToolHook: success returns hook_success attachment with stdout', async () => {
  const calls: Array<{ name: string; arguments: unknown }> = []
  const ctx = makeContext([
    {
      name: 'demo',
      type: 'connected',
      client: {
        callTool: async req => {
          calls.push(req as { name: string; arguments: unknown })
          return {
            content: [{ type: 'text', text: 'hello world' }],
            isError: false,
          }
        },
      },
    },
  ])
  const hookInput = {
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'echo hi' },
    tool_response: { stdout: 'hi' },
    duration_ms: 12,
  }
  const result = await execMcpToolHook(
    {
      type: 'mcp_tool',
      mcpServer: 'demo',
      tool: 'echo',
      arguments: {
        message: 'cmd=${tool_input.command}',
        passthrough_input: '${tool_input}',
      },
    },
    'PostToolUse:Bash',
    'PostToolUse',
    JSON.stringify(hookInput),
    new AbortController().signal,
    ctx,
    'tool-use-1',
  )

  // Assert MCP client got correctly-substituted arguments
  expect(calls.length).toBe(1)
  expect(calls[0]!.name).toBe('echo')
  expect(calls[0]!.arguments).toEqual({
    message: 'cmd=echo hi',
    passthrough_input: { command: 'echo hi' },
  })

  // Assert hook outcome wrapped correctly
  expect(result.outcome).toBe('success')
  expect(result.message?.type).toBe('attachment')
  if (result.message?.type === 'attachment') {
    expect(result.message.attachment.type).toBe('hook_success')
    if (result.message.attachment.type === 'hook_success') {
      expect(result.message.attachment.stdout).toContain('hello world')
    }
  }
})

test('execMcpToolHook: missing server returns non_blocking_error', async () => {
  const ctx = makeContext([])
  const result = await execMcpToolHook(
    {
      type: 'mcp_tool',
      mcpServer: 'nonexistent',
      tool: 'foo',
    },
    'PostToolUse:X',
    'PostToolUse',
    '{}',
    new AbortController().signal,
    ctx,
    undefined,
  )
  expect(result.outcome).toBe('non_blocking_error')
  if (
    result.message?.type === 'attachment' &&
    result.message.attachment.type === 'hook_non_blocking_error'
  ) {
    expect(result.message.attachment.stderr).toContain('not registered')
  }
})

test('execMcpToolHook: server in needs-auth state returns non_blocking_error', async () => {
  const ctx = makeContext([{ name: 'demo', type: 'needs-auth' }])
  const result = await execMcpToolHook(
    {
      type: 'mcp_tool',
      mcpServer: 'demo',
      tool: 'foo',
    },
    'PostToolUse:X',
    'PostToolUse',
    '{}',
    new AbortController().signal,
    ctx,
    undefined,
  )
  expect(result.outcome).toBe('non_blocking_error')
  if (
    result.message?.type === 'attachment' &&
    result.message.attachment.type === 'hook_non_blocking_error'
  ) {
    expect(result.message.attachment.stderr).toContain('not connected')
  }
})

test('execMcpToolHook: tool-side isError surfaces as non_blocking_error', async () => {
  const ctx = makeContext([
    {
      name: 'demo',
      type: 'connected',
      client: {
        callTool: async () => ({
          isError: true,
          content: [{ type: 'text', text: 'tool failed' }],
        }),
      },
    },
  ])
  const result = await execMcpToolHook(
    {
      type: 'mcp_tool',
      mcpServer: 'demo',
      tool: 'broken',
    },
    'PostToolUse:X',
    'PostToolUse',
    '{}',
    new AbortController().signal,
    ctx,
    undefined,
  )
  expect(result.outcome).toBe('non_blocking_error')
})

test('execMcpToolHook: thrown error → non_blocking_error (not crash)', async () => {
  const ctx = makeContext([
    {
      name: 'demo',
      type: 'connected',
      client: {
        callTool: async () => {
          throw new Error('network down')
        },
      },
    },
  ])
  const result = await execMcpToolHook(
    {
      type: 'mcp_tool',
      mcpServer: 'demo',
      tool: 'failing',
    },
    'PostToolUse:X',
    'PostToolUse',
    '{}',
    new AbortController().signal,
    ctx,
    undefined,
  )
  expect(result.outcome).toBe('non_blocking_error')
  if (
    result.message?.type === 'attachment' &&
    result.message.attachment.type === 'hook_non_blocking_error'
  ) {
    expect(result.message.attachment.stderr).toContain('network down')
  }
})

test('execMcpToolHook: pre-aborted signal → cancelled', async () => {
  // To trigger the cancelled path we rely on the inner client throwing while
  // the combined signal is already aborted.
  const ctrl = new AbortController()
  ctrl.abort()
  const ctx = makeContext([
    {
      name: 'demo',
      type: 'connected',
      client: {
        callTool: async () => {
          // Simulate the SDK respecting the AbortSignal
          throw new Error('aborted')
        },
      },
    },
  ])
  const result = await execMcpToolHook(
    {
      type: 'mcp_tool',
      mcpServer: 'demo',
      tool: 'whatever',
    },
    'PostToolUse:X',
    'PostToolUse',
    '{}',
    ctrl.signal,
    ctx,
    undefined,
  )
  expect(result.outcome).toBe('cancelled')
})
