// Input: Called by REPL.tsx and main.tsx when PROACTIVE or KAIROS feature flags are enabled.
// Output: State-managed proactive mode — activate/deactivate/pause/resume with subscriber notification.
// Pos: Gate module for proactive/loop-mode tick system; consumed by screens/REPL.tsx and main.tsx.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { registerTask, getEnabledTasks } from './taskRegistry.js'
import { BUILTIN_TASKS } from './builtinTasks.js'
import { getNextNightTickAt } from './nightMode.js'
import { parseCronExpression, computeNextCronRun } from '../utils/cron.js'

let _active = false
let _paused = false
let _contextBlocked = false
const _subscribers = new Set<() => void>()

function _notifySubscribers(): void {
  for (const cb of _subscribers) {
    try { cb() } catch {}
  }
}

export function isProactiveActive(): boolean {
  return _active
}

export function isProactivePaused(): boolean {
  return _paused
}

export function activateProactive(_source?: string): void {
  if (_active) return
  _active = true
  // 首次激活时确保所有 ~/.pandacc/ 子目录存在
  try {
    const { ensurePandaccDirs } = require('./platform.js') as typeof import('./platform.js')
    ensurePandaccDirs()
  } catch {}
  for (const task of BUILTIN_TASKS) {
    registerTask(task)
  }
  _notifySubscribers()
  // P1-2 启动补跑：扫描 task-exec-history，对今天该跑但未跑的"安全清单"task
  // 立即补跑一次。fire-and-forget，不 await，不影响 activateProactive 同步签名。
  try {
    void import('./catchupRunner.js')
      .then(({ runCatchup }) => runCatchup(BUILTIN_TASKS).catch(() => {}))
      .catch(() => {})
  } catch {}
}

export function deactivateProactive(): void {
  if (!_active) return
  _active = false
  _paused = false
  _notifySubscribers()
}

export function pauseProactive(): void {
  if (_paused) return
  _paused = true
  _notifySubscribers()
}

export function resumeProactive(): void {
  if (!_paused) return
  _paused = false
  _notifySubscribers()
}

export function setContextBlocked(blocked: boolean): void {
  _contextBlocked = blocked
}

export function isContextBlocked(): boolean {
  return _contextBlocked
}

export function subscribeToProactiveChanges(cb: () => void): () => void {
  _subscribers.add(cb)
  return () => { _subscribers.delete(cb) }
}

export function getNextTickAt(): number | null {
  if (!_active) return null

  // Gather candidate next-fire times from multiple sources
  const candidates: number[] = []

  // Night mode scheduler
  const nightTick = getNextNightTickAt()
  if (nightTick !== null) candidates.push(nightTick)

  // Enabled tasks with cron expressions — compute their next fire time
  const now = new Date()
  for (const task of getEnabledTasks()) {
    if (!task.cron) continue
    const fields = parseCronExpression(task.cron)
    if (!fields) continue
    const next = computeNextCronRun(fields, now)
    if (next) candidates.push(next.getTime())
  }

  // Return earliest candidate, or null if none
  return candidates.length > 0 ? Math.min(...candidates) : null
}
