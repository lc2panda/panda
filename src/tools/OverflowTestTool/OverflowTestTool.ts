import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'

export const OVERFLOW_TEST_TOOL_NAME = 'OverflowTest'

const inputSchema = lazySchema(() =>
  z.strictObject({
    size_kb: z
      .number()
      .int()
      .min(1)
      .max(10240)
      .describe('Size of the generated output in kilobytes.'),
    pattern: z
      .enum(['random', 'sequential', 'repeated'])
      .optional()
      .describe('Pattern of the generated content (default: sequential).'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  generated_bytes: number
  content: string
}

export const OverflowTestTool = buildTool({
  name: OVERFLOW_TEST_TOOL_NAME,
  searchHint: 'overflow test large output stress',
  maxResultSizeChars: 10_000_000,
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
    return `overflow_test ${input.size_kb}kb`
  },

  async description() {
    return 'Generate large output for testing context overflow handling.'
  },

  async prompt() {
    return `Generate a large amount of text output for testing how the system handles context overflow and large tool results. This is an internal testing tool.

Specify the desired output size in kilobytes. The system will generate content of approximately that size.`
  },

  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: `Generated ${output.generated_bytes} bytes of test content.\n${output.content}`,
    }
  },

  renderToolUseMessage() {
    return null
  },

  async call(input) {
    const { size_kb, pattern = 'sequential' } = input
    const targetBytes = size_kb * 1024

    let content: string
    switch (pattern) {
      case 'random': {
        const chars =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const parts: string[] = []
        let len = 0
        while (len < targetBytes) {
          const line =
            Array.from(
              { length: 80 },
              () => chars[Math.floor(Math.random() * chars.length)],
            ).join('') + '\n'
          parts.push(line)
          len += line.length
        }
        content = parts.join('')
        break
      }
      case 'repeated': {
        const line = 'OVERFLOW_TEST_LINE '.repeat(4) + '\n'
        const repeats = Math.ceil(targetBytes / line.length)
        content = line.repeat(repeats)
        break
      }
      case 'sequential':
      default: {
        const parts: string[] = []
        let len = 0
        let lineNum = 1
        while (len < targetBytes) {
          const line = `Line ${String(lineNum).padStart(8, '0')}: ${'x'.repeat(60)}\n`
          parts.push(line)
          len += line.length
          lineNum++
        }
        content = parts.join('')
        break
      }
    }

    content = content.slice(0, targetBytes)

    return {
      data: {
        generated_bytes: content.length,
        content,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
