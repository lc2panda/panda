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
      logForDebugging('[builtinTasks] dream-consolidate: executing autoDream pipeline')
      try {
        const { executeAutoDreamStandalone } = await import('../services/autoDream/autoDream.js')
        await executeAutoDreamStandalone()
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
      logForDebugging('[builtinTasks] morning-briefing: setting pending flag in working memory')
      try {
        const { setWorkingMemory } = await import('../assistant/workingMemory.js')
        setWorkingMemory('morning-briefing-pending', new Date().toISOString())
      } catch (e) {
        logForDebugging(`[builtinTasks] morning-briefing flag set failed: ${(e as Error).message}`)
      }
    },
  },
  {
    id: 'code-health',
    description: '代码健康检查 · Code health check',
    cron: '0 23 * * *',
    enabled: true,
    condition: canRun,
    action: async () => {
      logForDebugging('[builtinTasks] code-health: setting pending flag in working memory')
      try {
        const { setWorkingMemory } = await import('../assistant/workingMemory.js')
        setWorkingMemory('code-health-pending', new Date().toISOString())
      } catch (e) {
        logForDebugging(`[builtinTasks] code-health flag set failed: ${(e as Error).message}`)
      }
    },
  },
]
