// Pure (non-React) kill helpers for LocalShellTask.
// Extracted so runAgent.ts can kill agent-scoped bash tasks without pulling
// React/Ink into its module graph (same rationale as guards.ts).

import type { AppState } from '../../state/AppState.js'
import type { AgentId } from '../../types/ids.js'
import { logForDebugging } from '../../utils/debug.js'
import { logError } from '../../utils/log.js'
import { dequeueAllMatching } from '../../utils/messageQueueManager.js'
import { evictTaskOutput } from '../../utils/task/diskOutput.js'
import { updateTaskState } from '../../utils/task/framework.js'
import { isLocalShellTask } from './guards.js'

type SetAppStateFn = (updater: (prev: AppState) => AppState) => void

export function killTask(taskId: string, setAppState: SetAppStateFn): void {
  updateTaskState(taskId, setAppState, task => {
    if ((task as any).status !== 'running' || !isLocalShellTask(task)) {
      return task
    }

    try {
      logForDebugging(`LocalShellTask ${taskId} kill requested`)
      task.shellCommand?.kill()
      task.shellCommand?.cleanup()
    } catch (error) {
      logError(error)
    }

    task.unregisterCleanup?.()
    if (task.cleanupTimeoutId) {
      clearTimeout(task.cleanupTimeoutId)
    }

    return {
      ...task,
      status: 'killed',
      notified: true,
      shellCommand: null,
      unregisterCleanup: undefined,
      cleanupTimeoutId: undefined,
      endTime: Date.now(),
    }
  })
  void evictTaskOutput(taskId)
}

/**
 * Kill all running bash tasks spawned by a given agent.
 * Called from runAgent.ts finally block so background processes don't outlive
 * the agent that started them (prevents 10-day fake-logs.sh zombies).
 */
export function killShellTasksForAgent(
  agentId: AgentId,
  getAppState: () => AppState,
  setAppState: SetAppStateFn,
): void {
  const tasks = getAppState().tasks ?? {}
  for (const [taskId, task] of Object.entries(tasks)) {
    if (
      isLocalShellTask(task) &&
      task.agentId === agentId &&
      task.status === 'running'
    ) {
      logForDebugging(
        `killShellTasksForAgent: killing orphaned shell task ${taskId} (agent ${agentId} exiting)`,
      )
      killTask(taskId, setAppState)
    }
  }
  // Purge any queued notifications addressed to this agent — its query loop
  // has exited and won't drain them. killTask fires 'killed' notifications
  // asynchronously; drop the ones already queued and any that land later sit
  // harmlessly (no consumer matches a dead agentId).
  dequeueAllMatching(cmd => cmd.agentId === agentId)
}

/**
 * v2.29.4: Reap idle background shell tasks under memory pressure.
 * Called by memory pressure handlers when RSS exceeds the warn threshold.
 * Kills background shell tasks that have been idle for > idleMs.
 */
const IDLE_SHELL_THRESHOLD_MS = 5 * 60_000 // 5 minutes

export function reapIdleShellTasks(
  getAppState: () => AppState,
  setAppState: SetAppStateFn,
): number {
  const tasks = getAppState().tasks ?? {}
  const now = Date.now()
  let reaped = 0

  for (const [taskId, task] of Object.entries(tasks)) {
    if (
      isLocalShellTask(task) &&
      task.status === 'running' &&
      task.isBackgrounded &&
      task.startTime != null &&
      now - task.startTime > IDLE_SHELL_THRESHOLD_MS
    ) {
      logForDebugging(
        `reapIdleShellTasks: killing idle backgrounded shell ${taskId} ` +
          `(age ${Math.round((now - task.startTime) / 1000)}s, memory pressure)`,
      )
      killTask(taskId, setAppState)
      reaped++
    }
  }

  if (reaped > 0) {
    logForDebugging(
      `reapIdleShellTasks: reaped ${reaped} idle backgrounded shell(s)`,
    )
  }

  return reaped
}
