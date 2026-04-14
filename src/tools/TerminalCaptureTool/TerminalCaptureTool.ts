import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'

export const TERMINAL_CAPTURE_TOOL_NAME = 'TerminalCapture'

const inputSchema = lazySchema(() =>
  z.strictObject({
    lines: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe(
        'Number of terminal lines to capture from the bottom of the scrollback (default: 50).',
      ),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  content: string
  lines_captured: number
}

export const TerminalCaptureTool = buildTool({
  name: TERMINAL_CAPTURE_TOOL_NAME,
  searchHint: 'screenshot terminal scrollback capture visible',
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
    return 'Capture recent terminal output from the scrollback buffer.'
  },

  async prompt() {
    return `Capture the recent terminal output. Returns the last N lines from the terminal scrollback buffer.

Use this when you need to see what the user is looking at in their terminal, or to capture output from a command they ran outside of Panda.

Default: last 50 lines. Max: 500 lines.`
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

  async call(input) {
    const _lines = input.lines ?? 50

    return {
      data: {
        content:
          '[Terminal capture not available in this build — TERMINAL_PANEL feature flag is required]',
        lines_captured: 0,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
