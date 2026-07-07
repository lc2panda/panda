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

import { randomUUID } from 'crypto'
import type { Message, SystemInformationalMessage } from '../../types/message.js'
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
import { logForDebugging } from '../../utils/debug.js'
import { getSettingsForSource } from '../../utils/settings/settings.js'
import {
  clearGoal,
  getGoal,
  getGoalConditionPreview,
  getGoalElapsedDisplay,
  GOAL_CONDITION_MAX_LENGTH,
  GOAL_MARKER_SUBTYPE,
  setGoal,
  type GoalMarkerPayload,
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
    `   turns=${g.turns} · tokens=${g.tokens} · elapsed=${elapsed}`,
  )
  if (g.lastReason) {
    const verdict = g.lastMet ? 'met' : 'not met'
    lines.push(`   last check (${verdict}): ${g.lastReason}`)
  } else {
    lines.push('   last check: pending — evaluator runs at turn end.')
  }
  return lines.join('\n')
}

/**
 * Build the marker SystemMessage that we splice into the transcript every
 * time /goal sets/replaces/clears a goal. On --resume, goalStore.restoreFromMarker
 * scans for the most recent active marker to rehydrate the condition.
 *
 * `isMeta: true` keeps the marker out of the rendered conversation (it's
 * bookkeeping, not user-facing) while still flowing through the transcript
 * persistence path so it survives a save/reload cycle. `goalMarker` is the
 * payload field consumed by findActiveGoalMarker().
 */
function buildGoalMarkerMessage(
  action: 'set' | 'clear',
  payload: GoalMarkerPayload | null,
): SystemInformationalMessage {
  return {
    type: 'system',
    subtype: GOAL_MARKER_SUBTYPE,
    content:
      action === 'set'
        ? `[goal] set: ${payload?.condition.slice(0, 80) ?? ''}`
        : '[goal] cleared',
    goalMarker: { action, payload },
    isMeta: true,
    timestamp: new Date().toISOString(),
    uuid: randomUUID(),
    level: 'info',
  } as unknown as SystemInformationalMessage
}

/**
 * Enterprise off-switch: returns a user-facing reason string when /goal is
 * blocked by admin policy, or null when the command is allowed to run.
 * Three layers are checked, in priority order:
 *
 * 1. `policySettings.goalCommandEnabled === false` — explicit kill switch
 *    set by IT in managed-settings.json. Highest authority.
 * 2. `policySettings.disableAllHooks === true` — when admins fully disable
 *    the hook infrastructure, /goal's evaluator (which behaves like a
 *    background hook from the operator POV) also goes dark.
 * 3. `policySettings.allowManagedHooksOnly === true` — managed-hooks-only
 *    mode means user-initiated background work surfaces (incl. /goal eval)
 *    are not allowed. We surface a clear error rather than silently letting
 *    /goal run with a no-op evaluator.
 *
 * Non-policy (user/project/local) flags do NOT block /goal — only the
 * managed-settings layer can disable it. This mirrors how disableAllHooks
 * itself is treated as managed-only for the "fully off" semantics
 * (hooksConfigSnapshot.shouldDisableAllHooksIncludingManaged).
 */
function checkGoalAdminPolicy(): string | null {
  const policy = getSettingsForSource('policySettings')
  if (policy?.goalCommandEnabled === false) {
    return 'Goal command disabled by admin policy (settings.goalCommandEnabled = false).'
  }
  // disableAllHooks (managed) — full shutdown of background-evaluator surfaces.
  if (policy?.disableAllHooks === true) {
    return 'Goal command disabled by admin policy (disableAllHooks).'
  }
  // allowManagedHooksOnly — only managed-defined background work permitted.
  if (policy?.allowManagedHooksOnly === true) {
    return 'Goal command disabled by admin policy (allowManagedHooksOnly).'
  }
  return null
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  context: LocalJSXCommandContext,
  args?: string,
): Promise<null> {
  logForDebugging(`[goal] call() args=${JSON.stringify(args)}`)

  // Enterprise gate — admins can disable /goal via managed settings.
  const denied = checkGoalAdminPolicy()
  if (denied !== null) {
    onDone(denied, { display: 'system' })
    return null
  }

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
      // Splice a clear marker so --resume sees the goal as cleared.
      const marker = buildGoalMarkerMessage('clear', null)
      context.setMessages?.(prevMsgs => [...prevMsgs, marker as Message])
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
    // Splice a set marker so --resume can rehydrate this condition next session.
    const marker = buildGoalMarkerMessage('set', {
      condition: next.condition,
      setAtMs: next.setAtMs,
    })
    context.setMessages?.(prevMsgs => [...prevMsgs, marker as Message])
    // shouldQuery: true triggers the first agent turn immediately after `/goal`
    // set, otherwise the user has to send another (no-op) message to start
    // working toward the goal. processSlashCommand reads `options.shouldQuery`
    // (defaults false), so without this flag handlePromptSubmit's onQuery
    // receives shouldQuery=false and skips the dispatch. The metaMessages
    // payload gives the model an explicit kickoff prompt — mirrors /brief and
    // /thinkback's pattern of injecting a model-visible <system-reminder>.
    onDone(
      `${verb}: "${preview}" — Panda will continue working until the evaluator agrees this is met or you clear the goal.`,
      {
        display: 'system',
        shouldQuery: true,
        metaMessages: [
          `<system-reminder>\nA session goal has been set: "${next.condition}"\n\nStart working toward this goal now. The evaluator will check progress after each turn and end the session when the goal is met.\n</system-reminder>`,
        ],
      },
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
