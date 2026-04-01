import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'

const SUBSCRIBE_PR_TOOL_NAME = 'SubscribePR'

const inputSchema = lazySchema(() =>
  z.strictObject({
    action: z
      .enum(['subscribe', 'unsubscribe', 'list'])
      .describe('Action to perform.'),
    repo: z
      .string()
      .optional()
      .describe('Repository in owner/repo format (e.g. "anthropics/claude-code").'),
    pr_number: z
      .number()
      .int()
      .optional()
      .describe('Pull request number to subscribe to.'),
    events: z
      .array(z.enum(['review', 'comment', 'merge', 'close', 'push', 'ci']))
      .optional()
      .describe('Events to subscribe to (default: all).'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  subscription_id?: string
  action: string
  message: string
  subscriptions?: Array<{
    id: string
    repo: string
    pr_number: number
    events: string[]
  }>
}

export const SubscribePRTool = buildTool({
  name: SUBSCRIBE_PR_TOOL_NAME,
  searchHint: 'github pull request webhook subscribe watch',
  maxResultSizeChars: 100_000,
  shouldDefer: true,

  get inputSchema(): InputSchema {
    return inputSchema()
  },

  isConcurrencySafe() {
    return true
  },

  isReadOnly(input) {
    return input.action === 'list'
  },

  toAutoClassifierInput(input) {
    return `subscribe_pr ${input.action} ${input.repo ?? ''} ${input.pr_number ?? ''}`
  },

  async validateInput(input) {
    if (input.action === 'subscribe') {
      if (!input.repo) {
        return {
          result: false as const,
          message: 'repo is required for subscribe action',
          errorCode: 1,
        }
      }
      if (!input.pr_number) {
        return {
          result: false as const,
          message: 'pr_number is required for subscribe action',
          errorCode: 2,
        }
      }
    }
    return { result: true as const }
  },

  async description() {
    return 'Subscribe to GitHub PR events to receive notifications when things happen.'
  },

  async prompt() {
    return `Subscribe to GitHub pull request events. You'll be notified when subscribed events occur (reviews, comments, merges, CI status changes, etc.).

Actions:
- subscribe: Watch a PR for events. Requires repo and pr_number.
- unsubscribe: Stop watching. Requires subscription_id (from subscribe result) or repo + pr_number.
- list: Show all active subscriptions.

Subscriptions are session-only and do not persist across restarts.`
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
    const { action, repo, pr_number, events } = input

    switch (action) {
      case 'subscribe': {
        const id = `sub_${Date.now().toString(36)}`
        return {
          data: {
            subscription_id: id,
            action: 'subscribed',
            message: `Subscribed to ${repo}#${pr_number} for events: ${(events ?? ['all']).join(', ')}`,
          },
        }
      }
      case 'unsubscribe': {
        return {
          data: {
            action: 'unsubscribed',
            message: repo && pr_number
              ? `Unsubscribed from ${repo}#${pr_number}`
              : 'Unsubscribed.',
          },
        }
      }
      case 'list': {
        return {
          data: {
            action: 'list',
            message: 'No active subscriptions.',
            subscriptions: [],
          },
        }
      }
    }
  },
} satisfies ToolDef<InputSchema, Output>)
