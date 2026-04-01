import { stat } from 'fs/promises'
import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'

const SEND_USER_FILE_TOOL_NAME = 'SendUserFile'

const inputSchema = lazySchema(() =>
  z.strictObject({
    file_path: z
      .string()
      .describe('Absolute path to the file to send to the user.'),
    description: z
      .string()
      .optional()
      .describe('Short description of the file being sent.'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  file_path: string
  size_bytes: number
  sent: boolean
  message: string
}

export const SendUserFileTool = buildTool({
  name: SEND_USER_FILE_TOOL_NAME,
  searchHint: 'send deliver file to user download',
  maxResultSizeChars: 10_000,
  shouldDefer: true,

  get inputSchema(): InputSchema {
    return inputSchema()
  },

  isReadOnly() {
    return true
  },

  isConcurrencySafe() {
    return true
  },

  toAutoClassifierInput(input) {
    return `send file ${input.file_path}`
  },

  async validateInput(input) {
    try {
      const s = await stat(input.file_path)
      if (!s.isFile()) {
        return {
          result: false as const,
          message: `${input.file_path} is not a regular file.`,
          errorCode: 1,
        }
      }
    } catch {
      return {
        result: false as const,
        message: `File not found: ${input.file_path}`,
        errorCode: 2,
      }
    }
    return { result: true as const }
  },

  async description() {
    return 'Send a file to the user for download or viewing.'
  },

  async prompt() {
    return `Send a file to the user. The file must exist on the local filesystem.
Use this when the user asks you to produce an artifact (image, PDF, archive, etc.) and deliver it.
The file path must be absolute.`
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
    const { file_path, description } = input
    const s = await stat(file_path)

    if (context.sendOSNotification) {
      context.sendOSNotification({
        message: description
          ? `File ready: ${description}`
          : `File ready: ${file_path}`,
        notificationType: 'file_sent',
      })
    }

    return {
      data: {
        file_path,
        size_bytes: s.size,
        sent: true,
        message: description
          ? `Sent file: ${description} (${file_path}, ${s.size} bytes)`
          : `Sent file: ${file_path} (${s.size} bytes)`,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
