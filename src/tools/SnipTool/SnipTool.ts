import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'

export const SNIP_TOOL_NAME = 'Snip'

const inputSchema = lazySchema(() =>
  z.strictObject({
    start_message_index: z
      .number()
      .int()
      .min(0)
      .describe('Start index of the message range to snip (inclusive).'),
    end_message_index: z
      .number()
      .int()
      .min(0)
      .describe('End index of the message range to snip (inclusive).'),
    summary: z
      .string()
      .describe(
        'A short summary of the snipped content to retain as context.',
      ),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  snipped_count: number
  summary: string
  message: string
}

export const SnipTool = buildTool({
  name: SNIP_TOOL_NAME,
  searchHint: 'trim prune compact conversation history snip',
  maxResultSizeChars: 10_000,
  shouldDefer: true,

  get inputSchema(): InputSchema {
    return inputSchema()
  },

  isConcurrencySafe() {
    return false
  },

  isReadOnly() {
    return false
  },

  toAutoClassifierInput() {
    return ''
  },

  async validateInput(input) {
    if (input.start_message_index > input.end_message_index) {
      return {
        result: false as const,
        message: 'start_message_index must be <= end_message_index',
        errorCode: 1,
      }
    }
    if (!input.summary || input.summary.trim().length === 0) {
      return {
        result: false as const,
        message: 'summary is required and must not be empty',
        errorCode: 2,
      }
    }
    return { result: true as const }
  },

  async description() {
    return 'Remove a range of messages from conversation history, replacing them with a summary.'
  },

  async prompt() {
    return `Snip (remove) a range of messages from the conversation history and replace them with a concise summary. This reduces context window usage while preserving essential information.

Use this when:
- The conversation is getting long and earlier messages are no longer relevant
- You want to free up context for new work
- Redundant tool call sequences can be summarized

The summary should capture any facts, decisions, or outcomes from the snipped range that might be needed later. Err on the side of including more context in the summary.

Message indices are 0-based. Both start and end are inclusive.`
  },

  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: output.message,
    }
  },

  renderToolUseMessage() {
    return null
  },

  async call(input, context) {
    const { start_message_index, end_message_index, summary } = input
    const messages = context.messages

    if (end_message_index >= messages.length) {
      throw new Error(
        `end_message_index ${end_message_index} is out of range (${messages.length} messages).`,
      )
    }

    const snippedCount = end_message_index - start_message_index + 1

    return {
      data: {
        snipped_count: snippedCount,
        summary,
        message: `Snipped ${snippedCount} messages (indices ${start_message_index}–${end_message_index}). Summary preserved: "${summary}"`,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
