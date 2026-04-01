import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { SLEEP_TOOL_NAME, SLEEP_TOOL_PROMPT, DESCRIPTION } from './prompt.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    duration_seconds: z
      .number()
      .int()
      .min(1)
      .max(86400)
      .describe('Number of seconds to sleep (1–86400).'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  slept_seconds: number
  interrupted: boolean
}

export const SleepTool = buildTool({
  name: SLEEP_TOOL_NAME,
  searchHint: 'wait pause delay timer',
  maxResultSizeChars: 1_000,
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

  toAutoClassifierInput(input) {
    return `sleep ${input.duration_seconds}s`
  },

  async description() {
    return DESCRIPTION
  },

  async prompt() {
    return SLEEP_TOOL_PROMPT
  },

  interruptBehavior() {
    return 'cancel' as const
  },

  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: output.interrupted
        ? `Sleep interrupted after ${output.slept_seconds}s (requested ${output.slept_seconds}s).`
        : `Slept for ${output.slept_seconds}s.`,
    }
  },

  renderToolUseMessage(input) {
    return null
  },

  async call(input, context) {
    const { duration_seconds } = input
    const start = Date.now()

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, duration_seconds * 1000)
      const onAbort = () => {
        clearTimeout(timer)
        resolve()
      }
      context.abortController.signal.addEventListener('abort', onAbort, {
        once: true,
      })
    })

    const elapsed = Math.round((Date.now() - start) / 1000)
    const interrupted = context.abortController.signal.aborted

    return {
      data: {
        slept_seconds: interrupted ? elapsed : duration_seconds,
        interrupted,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
