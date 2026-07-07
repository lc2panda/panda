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

/**
 * Subtype literal stamped on the SystemMessage marker dropped into the
 * transcript every time /goal sets/replaces a condition. Used by
 * restoreFromMarker() to find the latest still-relevant marker on --resume.
 */
export const GOAL_MARKER_SUBTYPE = 'goal_marker'

/**
 * Shape of the marker SystemMessage's `goalMarker` field. Kept narrow so the
 * transcript reader can rely on `condition` always being a non-empty string.
 */
export type GoalMarkerPayload = {
  condition: string
  /** When the original /goal was issued. Restore resets turn/token baseline
   *  but we keep this in the payload for diagnostics + future "elapsed since
   *  original set" display modes. */
  setAtMs: number
}

/**
 * Scan a transcript (oldest → newest) for the most recent goal marker that is
 * still in effect, i.e. has not been overridden by a clear marker or a newer
 * set marker. Returns the marker payload to restore, or null if no active
 * goal is recorded.
 *
 * The scan respects two marker subtypes:
 *   - `goal_marker` with `goalMarker.action === 'set'` → newest wins
 *   - `goal_marker` with `goalMarker.action === 'clear'` → cancels prior set
 *
 * We walk backwards so we can short-circuit on the first 'set' or 'clear'.
 */
export function findActiveGoalMarker(
  messages: ReadonlyArray<{ type?: unknown; [key: string]: unknown }>,
): GoalMarkerPayload | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (!m || m.type !== 'system') continue
    if ((m as { subtype?: unknown }).subtype !== GOAL_MARKER_SUBTYPE) continue
    const action = (m as { goalMarker?: { action?: unknown } }).goalMarker
      ?.action
    if (action === 'clear') {
      // A clear marker shadows any prior set: no active goal.
      return null
    }
    if (action === 'set') {
      const payload = (m as { goalMarker?: { payload?: unknown } }).goalMarker
        ?.payload
      if (
        typeof payload === 'object' &&
        payload !== null &&
        typeof (payload as { condition?: unknown }).condition === 'string' &&
        ((payload as { condition: string }).condition as string).trim().length >
          0
      ) {
        const p = payload as Partial<GoalMarkerPayload>
        return {
          condition: (p.condition as string).trim(),
          setAtMs: typeof p.setAtMs === 'number' ? p.setAtMs : Date.now(),
        }
      }
    }
  }
  return null
}

/**
 * --resume / --continue entry point. Scans the loaded transcript for the most
 * recent active goal marker and rehydrates `current` from it. Returns the
 * restored GoalState (or null if nothing to restore).
 *
 * IMPORTANT: caller (sessionRestore / REPL resume) must invoke this AFTER the
 * transcript has been deserialized but BEFORE the goal evaluator runs in the
 * resumed session, so the first post-resume turn sees the restored goal.
 *
 * Turn count, token count, lastReason, lastMet are intentionally reset — we
 * don't carry stale per-turn telemetry across a resume boundary. setAtMs is
 * also reset to `now()` so the elapsed timer starts fresh (matches user
 * mental model: "I /resume'd; the clock should reflect this session").
 */
export function restoreFromMarker(
  messages: ReadonlyArray<{ type?: unknown; [key: string]: unknown }>,
): GoalState | null {
  const payload = findActiveGoalMarker(messages)
  if (payload === null) return null
  current = {
    condition: payload.condition,
    setAtMs: Date.now(),
    turns: 0,
    lastReason: null,
    lastMet: null,
    tokens: 0,
  }
  notify()
  return current
}
