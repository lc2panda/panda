// Input:  /goal slash command invocation with optional args
//         (empty → status; clear/stop/off/reset/none/cancel → clear; other → set)
// Output: onDone() user-visible message describing the action taken
// Pos:    src/commands/goal/goal.ts — actual `call` implementation lazy-loaded
//         from index.ts via dynamic import (mirroring /recap pattern at
//         src/commands/recap/recap.ts). Does NOT perform evaluation —
//         evaluation happens turn-by-turn in src/query/stopHooks.ts.
//
// NEW-FILE:#20260515-03 — implements upstream Claude Code v2.1.139 `/goal`.
//
// 一旦我被修改，请更新所属文件夹的 README.md（如有）。

import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
import { logForDebugging } from '../../utils/debug.js'
import {
  clearGoal,
  getGoal,
  getGoalConditionPreview,
  getGoalElapsedDisplay,
  GOAL_CONDITION_MAX_LENGTH,
  setGoal,
} from '../../state/goalStore.js'

const CLEAR_ALIASES = new Set([
  'clear',
  'stop',
  'off',
  'reset',
  'none',
  'cancel',
])

function buildStatusMessage(): string {
  const g = getGoal()
  if (g === null) {
    return 'No active goal. Use `/goal <condition>` to set one (e.g. `/goal all tests pass`).'
  }
  const elapsed = getGoalElapsedDisplay()
  const lines: string[] = []
  lines.push(`◎ /goal active — ${getGoalConditionPreview(80)}`)
  lines.push(
    `   turns=${g.turns} · tokens=${g.tokens} · elapsed=${elapsed} · max-turns=${g.maxTurns}`,
  )
  if (g.lastReason) {
    const verdict = g.lastMet ? 'met' : 'not met'
    lines.push(`   last check (${verdict}): ${g.lastReason}`)
  } else {
    lines.push('   last check: pending — evaluator runs at turn end.')
  }
  return lines.join('\n')
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  _context: LocalJSXCommandContext,
  args?: string,
): Promise<null> {
  logForDebugging(`[goal] call() args=${JSON.stringify(args)}`)
  const raw = (args ?? '').trim()

  // Empty → status
  if (raw.length === 0) {
    onDone(buildStatusMessage(), { display: 'system' })
    return null
  }

  // Clear aliases
  const lower = raw.toLowerCase()
  if (CLEAR_ALIASES.has(lower)) {
    const prev = clearGoal()
    if (prev === null) {
      onDone('No active goal to clear.', { display: 'system' })
    } else {
      onDone(
        `Goal cleared (was: "${getOnelinePreview(prev.condition, 60)}", ${prev.turns} turns).`,
        { display: 'system' },
      )
    }
    return null
  }

  // Length check
  if (raw.length > GOAL_CONDITION_MAX_LENGTH) {
    onDone(
      `Goal condition too long: ${raw.length} chars (max ${GOAL_CONDITION_MAX_LENGTH}). Shorten and retry.`,
      { display: 'system' },
    )
    return null
  }

  // Set/replace
  try {
    const prev = getGoal()
    const next = setGoal(raw)
    const preview = getOnelinePreview(next.condition, 80)
    const verb = prev ? 'Replaced goal' : 'Goal set'
    onDone(
      `${verb}: "${preview}" — Claude will continue working until the evaluator agrees this is met (or ${next.maxTurns} turns elapse).`,
      { display: 'system' },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    onDone(`Failed to set goal: ${msg}`, { display: 'system' })
  }
  return null
}

function getOnelinePreview(s: string, maxLen: number): string {
  const oneline = s.replace(/\s+/g, ' ').trim()
  if (oneline.length <= maxLen) return oneline
  return oneline.slice(0, Math.max(1, maxLen - 1)) + '…'
}
