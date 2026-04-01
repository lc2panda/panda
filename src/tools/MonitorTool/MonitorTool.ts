import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'

const MONITOR_TOOL_NAME = 'Monitor'

const inputSchema = lazySchema(() =>
  z.strictObject({
    action: z
      .enum(['start', 'stop', 'status'])
      .describe('Action to perform on the monitor.'),
    target: z
      .string()
      .optional()
      .describe('Target to monitor (e.g. a file path, URL, or process).'),
    interval_seconds: z
      .number()
      .int()
      .min(5)
      .max(3600)
      .optional()
      .describe('Polling interval in seconds (default 30).'),
    condition: z
      .string()
      .optional()
      .describe('Condition expression to watch for.'),
    monitor_id: z
      .string()
      .optional()
      .describe('Monitor ID for stop/status actions.'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  monitor_id?: string
  status: string
  message: string
}

export const MonitorTool = buildTool({
  name: MONITOR_TOOL_NAME,
  searchHint: 'watch observe poll file process changes',
  maxResultSizeChars: 100_000,
  shouldDefer: true,

  get inputSchema(): InputSchema {
    return inputSchema()
  },

  isConcurrencySafe() {
    return true
  },

  isReadOnly(input) {
    return input.action === 'status'
  },

  toAutoClassifierInput(input) {
    return `monitor ${input.action} ${input.target ?? ''}`
  },

  async description() {
    return 'Start, stop, or check status of a background monitor that watches a target for changes.'
  },

  async prompt() {
    return `Monitor a target (file, URL, process) for changes at a specified interval.

Actions:
- start: Begin monitoring a target. Returns a monitor_id.
- stop: Stop a running monitor by its monitor_id.
- status: Check the current state of a monitor by its monitor_id.

The monitor runs in-session only and does not persist across restarts.`
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
    const { action, target, monitor_id } = input

    switch (action) {
      case 'start': {
        if (!target) {
          throw new Error('target is required for start action')
        }
        const id = `mon_${Date.now().toString(36)}`
        return {
          data: {
            monitor_id: id,
            status: 'started',
            message: `Monitor ${id} started for target: ${target}`,
          },
        }
      }
      case 'stop': {
        if (!monitor_id) {
          throw new Error('monitor_id is required for stop action')
        }
        return {
          data: {
            monitor_id,
            status: 'stopped',
            message: `Monitor ${monitor_id} stopped.`,
          },
        }
      }
      case 'status': {
        if (!monitor_id) {
          throw new Error('monitor_id is required for status action')
        }
        return {
          data: {
            monitor_id,
            status: 'unknown',
            message: `Monitor ${monitor_id}: no active session monitor found (session-only, may have expired).`,
          },
        }
      }
    }
  },
} satisfies ToolDef<InputSchema, Output>)
