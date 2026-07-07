// Input:  goalStore subscription (via useSyncExternalStore) + ticking timer
// Output: <Box> overlay rendering "◎ /goal active — <preview> · turns/elapsed/tokens"
//         or null when no goal is active.
// Pos:    src/components/GoalIndicator.tsx — mounted from REPL.tsx near the
//         PromptInput so users always see the active condition. Read-only —
//         interaction (set/clear/status) happens via the /goal slash command.
//
// NEW-FILE:#20260515-05 — implements upstream Claude Code v2.1.139 `/goal`.
//
// 一旦我被修改，请更新所属文件夹的 README.md（如有）。

import * as React from 'react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Box, Text } from '../ink.js'
import {
  getGoal,
  getGoalConditionPreview,
  getGoalElapsedDisplay,
  subscribeGoal,
  type GoalState,
} from '../state/goalStore.js'

function getSnapshot(): GoalState | null {
  return getGoal()
}

/**
 * Live overlay for the active /goal. Subscribes to goalStore changes for
 * structural updates (set/clear/turn-record) and ticks once a second to keep
 * elapsed time accurate without churning the entire AppState.
 */
export function GoalIndicator(): React.ReactNode {
  const goal = useSyncExternalStore(subscribeGoal, getSnapshot, getSnapshot)
  // Ticking timer: only schedules when a goal is active to avoid background
  // wakeups on idle sessions. Re-runs whenever goal.setAtMs changes (so we
  // pick up the new baseline after a clear→set cycle).
  const [, setTick] = useState(0)
  useEffect(() => {
    if (goal === null) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [goal === null ? null : goal.setAtMs])

  if (goal === null) return null

  const preview = getGoalConditionPreview(60)
  const elapsed = getGoalElapsedDisplay()
  const meta = `turns ${goal.turns} · ${elapsed}`

  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Box>
        <Text dimColor>◎ </Text>
        <Text bold>/goal</Text>
        <Text dimColor> active — </Text>
        <Text>{preview}</Text>
      </Box>
      <Box>
        <Text dimColor>   {meta}</Text>
        {goal.lastReason ? (
          <Text dimColor>
            {' · last: '}
            {oneline(goal.lastReason, 70)}
          </Text>
        ) : null}
      </Box>
    </Box>
  )
}

function oneline(s: string, maxLen: number): string {
  const flat = s.replace(/\s+/g, ' ').trim()
  return flat.length <= maxLen ? flat : flat.slice(0, Math.max(1, maxLen - 1)) + '…'
}
