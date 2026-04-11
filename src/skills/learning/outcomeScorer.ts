// Input: SkillExecution + followup user/assistant messages
// Output: OutcomeScore — 0..1 quality rating plus detected signals
// Pos: src/skills/learning/outcomeScorer.ts — stage 2 of Hermes four-stage loop

import type { SkillExecution, OutcomeScore } from './types.js'

const REJECTION_PATTERN =
  /^(no|not\s+right|wrong|stop|cancel|undo|redo|不对|不是|错了|重做|撤销)/i

export function scoreOutcome(
  exec: SkillExecution,
  followupMessages: ReadonlyArray<{ role: string; content: string }>,
): OutcomeScore {
  const signals: string[] = []
  let score = 0.5

  if (exec.result === 'success') {
    signals.push('execution-succeeded')
    score = 0.7
  } else if (exec.result === 'failure') {
    signals.push('execution-failed')
    score = 0.1
  } else {
    signals.push('execution-cancelled')
    score = 0.3
  }

  const afterText = followupMessages
    .map(m => m.content)
    .join(' ')
    .toLowerCase()
    .trim()

  if (REJECTION_PATTERN.test(afterText)) {
    signals.push('user-rejected')
    score = Math.max(0, score - 0.4)
  } else if (followupMessages.length === 0 || followupMessages.length === 1) {
    signals.push('no-followup-correction')
    score = Math.min(1, score + 0.2)
  }

  return {
    skillName: exec.skillName,
    executionId: `${exec.skillName}-${exec.invokedAt}`,
    score: Math.round(score * 100) / 100,
    signals,
    evaluatedAt: Date.now(),
  }
}
