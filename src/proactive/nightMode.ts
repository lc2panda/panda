// Input: System clock + GlobalConfig nightMode settings + task registry.
// Output: Night-time detection, configuration, and task orchestration.
// Pos: Consumed by night-mode command, proactive engine, and builtinTasks for time-aware behavior.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { getGlobalConfig } from '../utils/config.js'
import { getEnabledTasks } from './taskRegistry.js'
import { safeExecute } from './safeExecutor.js'
import { logForDebugging } from '../utils/debug.js'
import { matchesCronNow } from '../utils/cron.js'

export interface NightModeConfig {
  enabled: boolean
  dreamTime?: string
  cleanupTime?: string
  briefingTime?: string
}

const DEFAULT_NIGHT_MODE: NightModeConfig = {
  enabled: false,
  dreamTime: '0 22 * * *',
  briefingTime: '0 6 * * *',
}

const NIGHT_START_HOUR = 22
const NIGHT_END_HOUR = 6
const TASK_INTERVAL_MS = 5 * 60 * 1000 // 5 min between tasks

let _lastOrchestratorRun = 0
// 记录每个任务的最后执行时间，避免同一 cron 窗口内重复执行
const _taskLastExecMap = new Map<string, number>()
const EXEC_MAP_MAX = 256
const _tasksExecuting = new Set<string>()

function _pruneExecMap(): void {
  if (_taskLastExecMap.size <= EXEC_MAP_MAX) return
  // 清理最旧的条目到 80% 容量
  const sorted = [..._taskLastExecMap.entries()].sort((a, b) => a[1] - b[1])
  while (sorted.length > EXEC_MAP_MAX * 0.8) {
    const oldest = sorted.shift()
    if (oldest) _taskLastExecMap.delete(oldest[0])
  }
}

export function isNightTime(): boolean {
  const hour = new Date().getHours()
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR
}

export function getNightModeConfig(): NightModeConfig {
  const config = getGlobalConfig()
  return config.nightMode ?? DEFAULT_NIGHT_MODE
}

export function isNightModeEnabled(): boolean {
  return getNightModeConfig().enabled
}

export function isNightModeActive(): boolean {
  return isNightModeEnabled() && isNightTime()
}

/**
 * Run all enabled tasks whose condition passes, sequentially with error
 * isolation. Each task failure is logged but does not block subsequent tasks.
 */
export async function runNightTasks(): Promise<void> {
  _pruneExecMap()
  const now = Date.now()
  if (now - _lastOrchestratorRun < TASK_INTERVAL_MS) {
    logForDebugging('[nightMode] orchestrator throttled — too soon since last run')
    return
  }
  _lastOrchestratorRun = now

  const tasks = getEnabledTasks()
  if (tasks.length === 0) {
    logForDebugging('[nightMode] no enabled tasks to run')
    return
  }

  logForDebugging(`[nightMode] orchestrator starting — ${tasks.length} enabled task(s)`)

  for (const task of tasks) {
    // 防止并发执行同一任务
    if (_tasksExecuting.has(task.id)) continue

    // cron 时间匹配：只执行 cron 表达式匹配当前时间窗口的任务
    if (task.cron) {
      if (!matchesCronNow(task.cron, 6)) {
        continue // cron 不匹配，静默跳过
      }
      // 去重：同一任务在同一 cron 窗口内不重复执行
      const lastExec = _taskLastExecMap.get(task.id) || 0
      if (now - lastExec < 5 * 60 * 1000) {
        continue // 5 分钟内已执行过
      }
    }

    if (task.condition && !task.condition()) {
      logForDebugging(`[proactive] skipping ${task.id} — condition not met`)
      continue
    }

    _tasksExecuting.add(task.id)
    logForDebugging(`[proactive] executing ${task.id}: ${task.description}`)
    const result = await safeExecute(
      task.id,
      async () => {
        await task.action()
        return `Task ${task.id} completed`
      },
      'execute',
    )

    _tasksExecuting.delete(task.id)
    if (result.success) {
      _taskLastExecMap.set(task.id, now)
      logForDebugging(`[proactive] ${task.id} succeeded: ${result.output}`)
    } else if (result.output?.includes('__SKIPPED__')) {
      logForDebugging(`[proactive] ${task.id} skipped (skipIf)`)
    } else {
      logForDebugging(`[proactive] ${task.id} failed: ${result.output}`)
    }
  }

  logForDebugging('[proactive] orchestrator complete')
}

/**
 * Compute the next time a night task should fire.
 * - If night mode is disabled: null
 * - If currently night time: next tick is TASK_INTERVAL_MS from last run
 * - If daytime: next tick at NIGHT_START_HOUR:00 today or tomorrow
 */
export function getNextNightTickAt(): number | null {
  if (!isNightModeEnabled()) return null

  const now = new Date()

  if (isNightTime()) {
    return _lastOrchestratorRun > 0
      ? _lastOrchestratorRun + TASK_INTERVAL_MS
      : now.getTime()
  }

  // Daytime: compute next 22:00
  const next = new Date(now)
  next.setHours(NIGHT_START_HOUR, 0, 0, 0)
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1)
  }
  return next.getTime()
}
