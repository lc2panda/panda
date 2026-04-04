// Input: ProactiveTask definitions for scheduled autonomous work.
// Output: Three builtin tasks wired to real actions (dream, briefing, health).
// Pos: Registered by proactive/index.ts on activateProactive(); executed by night orchestrator.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { ProactiveTask } from './taskRegistry.js'
import { isProactiveActive } from './index.js'
import { isNightModeActive } from './nightMode.js'
import { logForDebugging } from '../utils/debug.js'

function canRun(): boolean {
  return isProactiveActive() || isNightModeActive()
}

export const BUILTIN_TASKS: ProactiveTask[] = [
  {
    id: 'dream-consolidate',
    description: '记忆整理 · Memory consolidation',
    cron: '0 22 * * *',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] dream-consolidate: triggering autoDream pipeline')
      try {
        const { initAutoDream } = await import('../services/autoDream/autoDream.js')
        initAutoDream()
      } catch (e) {
        logForDebugging(`[builtinTasks] dream-consolidate failed: ${(e as Error).message}`)
      }
    },
  },
  {
    id: 'morning-briefing',
    description: '晨间简报 · Morning briefing',
    cron: '0 7 * * *',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] morning-briefing: preparing briefing context')
      // The actual briefing is delivered via the proactive tick mechanism.
      // This action primes the system — the /morning skill runs when the
      // next proactive tick fires after this action completes.
    },
  },
  {
    id: 'code-health',
    description: '代码健康检查 · Code health check',
    cron: '0 23 * * *',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] code-health: running health check')
      // Similar to morning-briefing: primes the system for health check
      // delivery on the next proactive tick.
    },
  },
]
