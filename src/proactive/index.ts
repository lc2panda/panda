// Input: Called by REPL.tsx and main.tsx when PROACTIVE or KAIROS feature flags are enabled.
// Output: State-managed proactive mode — activate/deactivate/pause/resume with subscriber notification.
// Pos: Gate module for proactive/loop-mode tick system; consumed by screens/REPL.tsx and main.tsx.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { registerTask } from './taskRegistry.js'
import { BUILTIN_TASKS } from './builtinTasks.js'
import { getNextNightTickAt } from './nightMode.js'

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
  for (const task of BUILTIN_TASKS) {
    registerTask(task)
  }
  _notifySubscribers()
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
  return getNextNightTickAt()
}
