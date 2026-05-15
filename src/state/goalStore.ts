// Input:  setGoal()/clearGoal()/getGoal() calls + per-turn snapshot updates
// Output: in-memory module-level Goal record (condition, turns, tokens, etc.)
//         + subscriber notification for React UI overlay re-render
// Pos:    src/state/goalStore.ts — session-scoped singleton for /goal command,
//         consumed by stopHooks goal-eval, GoalIndicator UI, and resume hydration.
//
// NEW-FILE:#20260515-01 — implements upstream Claude Code v2.1.139 `/goal`.
// Rationale: AppState already has many module-level singletons for cross-
// component coordination (bootstrap/state.ts, services/awaySummary.ts via
// generateAwaySummary); /goal needs the same shape (read from React + read
// from stopHooks AsyncGenerator + read from REPL bottom panel) and adding a
// dedicated module avoids threading mutable goal state through AppStateStore
// reducers/onChange — which would force every goal turn-count update to flow
// through the entire AppState diff machinery. A small store keeps the React
// notification narrow (only GoalIndicator subscribes) and lets non-React code
// (stopHooks) read/write directly.
//
// 一旦我被修改，请更新所属文件夹的 README.md（如有）。

export const GOAL_CONDITION_MAX_LENGTH = 4000

/**
 * Default safety bound: clear an active goal after this many turns even if the
 * evaluator never returns met=true. Prevents the runaway-loop failure mode where
 * an under-specified condition keeps Claude generating forever.
 */
export const GOAL_MAX_TURNS_DEFAULT = 50

export type GoalState = {
  /** User-supplied condition string (≤ 4000 chars) */
  condition: string
  /** Epoch ms when /goal was set or restored */
  setAtMs: number
  /** Turns elapsed since set/restore. Incremented by stopHooks after eval. */
  turns: number
  /**
   * Most recent evaluator output. Updated each turn even when met=false so the
   * status display always reflects the last assessment.
   */
  lastReason: string | null
  lastMet: boolean | null
  /** Cumulative output tokens consumed across turns under this goal */
  tokens: number
  /** Soft cap; once turns ≥ maxTurns the goal is force-cleared with a warning */
  maxTurns: number
}

let current: GoalState | null = null
const listeners = new Set<() => void>()

function notify(): void {
  for (const l of listeners) {
    try {
      l()
    } catch {
      /* listener throws must not corrupt the iteration */
    }
  }
}

export function getGoal(): GoalState | null {
  return current
}

export function isGoalActive(): boolean {
  return current !== null
}

export function setGoal(
  condition: string,
  opts?: { maxTurns?: number },
): GoalState {
  const trimmed = condition.trim()
  if (trimmed.length === 0) {
    throw new Error('Goal condition cannot be empty')
  }
  if (trimmed.length > GOAL_CONDITION_MAX_LENGTH) {
    throw new Error(
      `Goal condition too long (${trimmed.length} chars, max ${GOAL_CONDITION_MAX_LENGTH})`,
    )
  }
  current = {
    condition: trimmed,
    setAtMs: Date.now(),
    turns: 0,
    lastReason: null,
    lastMet: null,
    tokens: 0,
    maxTurns: opts?.maxTurns ?? GOAL_MAX_TURNS_DEFAULT,
  }
  notify()
  return current
}

export function clearGoal(): GoalState | null {
  const prev = current
  if (current !== null) {
    current = null
    notify()
  }
  return prev
}

/**
 * Record the result of one evaluator pass. Always increments turn count and
 * tokens; updates lastReason/lastMet for the status display. No-op when there
 * is no active goal (race: clearGoal() while evaluator was in-flight).
 */
export function recordGoalTurn(args: {
  met: boolean
  reason: string
  tokensThisTurn?: number
}): GoalState | null {
  if (current === null) return null
  current = {
    ...current,
    turns: current.turns + 1,
    lastMet: args.met,
    lastReason: args.reason,
    tokens: current.tokens + (args.tokensThisTurn ?? 0),
  }
  notify()
  return current
}

export function subscribeGoal(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Test/reset hook — clears state AND listeners. Production code must use
 * clearGoal() instead, which preserves subscribers across goal cycles.
 */
export function __resetGoalStoreForTests(): void {
  current = null
  listeners.clear()
}

/**
 * Formats elapsed time since the goal was set as a compact display string.
 * Mirrors the format used by other panda timers (e.g. spinner). Returns "0s"
 * when no goal is active.
 */
export function getGoalElapsedDisplay(now: number = Date.now()): string {
  if (current === null) return '0s'
  const elapsedMs = Math.max(0, now - current.setAtMs)
  const totalSec = Math.floor(elapsedMs / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min < 60) return `${min}m${sec}s`
  const hr = Math.floor(min / 60)
  const restMin = min % 60
  return `${hr}h${restMin}m`
}

/**
 * Truncate condition for compact display in the UI overlay (≈60 chars).
 */
export function getGoalConditionPreview(maxLen = 60): string {
  if (current === null) return ''
  const cond = current.condition
  if (cond.length <= maxLen) return cond
  return cond.slice(0, Math.max(1, maxLen - 1)) + '…'
}
