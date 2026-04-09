import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'
import { exec } from 'node:child_process'

const MONITOR_TOOL_NAME = 'Monitor'
const MAX_HISTORY = 5

type CheckResult = {
  timestamp: string
  success: boolean
  output: string
}

type ActiveMonitor = {
  id: string
  target: string
  condition: string | undefined
  intervalMs: number
  timer: ReturnType<typeof setInterval>
  history: CheckResult[]
  status: 'running' | 'stopped'
}

const activeMonitors = new Map<string, ActiveMonitor>()

function runCheck(target: string, condition: string | undefined): Promise<CheckResult> {
  return new Promise((resolve) => {
    const cmd = condition ? `${condition}` : `test -e "${target}" && echo "exists" || echo "not found"`
    exec(cmd, { timeout: 30_000 }, (error, stdout, stderr) => {
      resolve({
        timestamp: new Date().toISOString(),
        success: !error,
        output: (stdout || stderr || (error ? error.message : '')).trim().slice(0, 2000),
      })
    })
  })
}

function startMonitorInterval(monitor: ActiveMonitor): void {
  const tick = async () => {
    const result = await runCheck(monitor.target, monitor.condition)
    monitor.history.push(result)
    if (monitor.history.length > MAX_HISTORY) {
      monitor.history.shift()
    }
  }
  // Run first check immediately
  tick()
  monitor.timer = setInterval(tick, monitor.intervalMs)
}

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
    const { action, target, interval_seconds, condition, monitor_id } = input

    switch (action) {
      case 'start': {
        if (!target) {
          throw new Error('target is required for start action')
        }
        const id = `mon_${Date.now().toString(36)}`
        const intervalMs = (interval_seconds ?? 30) * 1000
        const monitor: ActiveMonitor = {
          id,
          target,
          condition,
          intervalMs,
          timer: null as unknown as ReturnType<typeof setInterval>,
          history: [],
          status: 'running',
        }
        activeMonitors.set(id, monitor)
        startMonitorInterval(monitor)
        return {
          data: {
            monitor_id: id,
            status: 'started',
            message: `Monitor ${id} started for target: ${target} (interval: ${interval_seconds ?? 30}s)`,
          },
        }
      }
      case 'stop': {
        if (!monitor_id) {
          throw new Error('monitor_id is required for stop action')
        }
        const monitor = activeMonitors.get(monitor_id)
        if (!monitor) {
          return {
            data: {
              monitor_id,
              status: 'not_found',
              message: `Monitor ${monitor_id} not found.`,
            },
          }
        }
        clearInterval(monitor.timer)
        monitor.status = 'stopped'
        activeMonitors.delete(monitor_id)
        return {
          data: {
            monitor_id,
            status: 'stopped',
            message: `Monitor ${monitor_id} stopped. Last ${monitor.history.length} check(s) recorded.`,
          },
        }
      }
      case 'status': {
        if (!monitor_id) {
          throw new Error('monitor_id is required for status action')
        }
        const monitor = activeMonitors.get(monitor_id)
        if (!monitor) {
          return {
            data: {
              monitor_id,
              status: 'not_found',
              message: `Monitor ${monitor_id} not found. It may have been stopped or never started.`,
            },
          }
        }
        const lastCheck = monitor.history.length > 0
          ? monitor.history[monitor.history.length - 1]
          : null
        return {
          data: {
            monitor_id,
            status: monitor.status,
            message: lastCheck
              ? `Monitor ${monitor_id} is ${monitor.status}. Last check at ${lastCheck.timestamp}: ${lastCheck.success ? 'OK' : 'FAIL'} — ${lastCheck.output}`
              : `Monitor ${monitor_id} is ${monitor.status}. No checks completed yet.`,
          },
        }
      }
    }
  },
} satisfies ToolDef<InputSchema, Output>)
