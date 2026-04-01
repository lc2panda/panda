import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'

const PUSH_NOTIFICATION_TOOL_NAME = 'PushNotification'

const inputSchema = lazySchema(() =>
  z.strictObject({
    title: z.string().describe('Notification title (short).'),
    body: z.string().describe('Notification body text.'),
    priority: z
      .enum(['low', 'normal', 'high'])
      .optional()
      .describe('Notification priority (default: normal).'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  sent: boolean
  message: string
}

export const PushNotificationTool = buildTool({
  name: PUSH_NOTIFICATION_TOOL_NAME,
  searchHint: 'push notify alert user',
  maxResultSizeChars: 10_000,
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
    return `notify: ${input.title}`
  },

  async description() {
    return 'Send a push notification to the user.'
  },

  async prompt() {
    return `Send a push notification to the user's device. Use this when the user is away and you need to alert them of something important — task completion, errors, or other time-sensitive events.

Do not spam notifications. Only send when:
- A long-running task completes or fails
- A blocking issue requires user attention
- The user explicitly asked to be notified`
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
    const { title, body } = input

    if (context.sendOSNotification) {
      context.sendOSNotification({
        message: `${title}: ${body}`,
        notificationType: 'push_notification',
      })
    }

    return {
      data: {
        sent: true,
        message: `Push notification sent: "${title}"`,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
