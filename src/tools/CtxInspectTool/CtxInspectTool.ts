import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'

const CTX_INSPECT_TOOL_NAME = 'CtxInspect'

const inputSchema = lazySchema(() =>
  z.strictObject({
    section: z
      .enum(['messages', 'tools', 'system', 'all'])
      .optional()
      .describe('Which section of the context to inspect (default: all).'),
    include_token_counts: z
      .boolean()
      .optional()
      .describe('Whether to include token count estimates (default: false).'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  message_count: number
  tool_count: number
  summary: string
}

export const CtxInspectTool = buildTool({
  name: CTX_INSPECT_TOOL_NAME,
  searchHint: 'context window inspect debug tokens messages',
  maxResultSizeChars: 100_000,
  shouldDefer: true,

  get inputSchema(): InputSchema {
    return inputSchema()
  },

  isConcurrencySafe() {
    return true
  },

  isReadOnly() {
    return true
  },

  toAutoClassifierInput() {
    return ''
  },

  async description() {
    return 'Inspect the current conversation context — message counts, tool list, and estimated token usage.'
  },

  async prompt() {
    return `Inspect the current context window. Shows:
- Number of messages in conversation
- Available tools
- Estimated token usage per section

Use this to understand how much context has been consumed and what is available.`
  },

  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: jsonStringify(output),
    }
  },

  renderToolUseMessage() {
    return null
  },

  async call(input, context) {
    const messages = context.messages
    const tools = context.options.tools

    const messageCount = messages.length
    const toolCount = tools.length

    const messageSummary = messages.reduce(
      (acc, msg) => {
        const role = msg.type
        acc[role] = (acc[role] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const summary = [
      `Messages: ${messageCount} (${Object.entries(messageSummary).map(([k, v]) => `${k}: ${v}`).join(', ')})`,
      `Tools: ${toolCount}`,
      `Model: ${context.options.mainLoopModel}`,
    ].join('\n')

    return {
      data: {
        message_count: messageCount,
        tool_count: toolCount,
        summary,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
