// Input: SkillExecution + OutcomeScore + followup messages
// Output: SkillDiff[] — candidate improvements derived from signals
// Pos: src/skills/learning/diffExtractor.ts — stage 3 of Hermes four-stage loop

import type { SkillExecution, OutcomeScore, SkillDiff } from './types.js'

/**
 * From execution + outcome, extract potential improvement diffs.
 * MVP: only looks at obvious signals — no LLM call.
 */
export function extractDiffs(
  exec: SkillExecution,
  outcome: OutcomeScore,
  followupMessages: ReadonlyArray<{ role: string; content: string }>,
): SkillDiff[] {
  const diffs: SkillDiff[] = []

  // Signal 1: explicit user rejection → step-revision candidate
  if (outcome.signals.includes('user-rejected')) {
    diffs.push({
      skillName: exec.skillName,
      diffType: 'step-revision',
      description:
        'User rejected the skill output. Skill prompt may need clarification.',
    })
  }

  // Signal 2: user immediately re-invokes the same skill → arg-correction
  const followupText = followupMessages.map(m => m.content).join(' ')
  if (
    followupText.includes(`/${exec.skillName}`) ||
    followupText.includes(exec.skillName)
  ) {
    diffs.push({
      skillName: exec.skillName,
      diffType: 'arg-correction',
      description: 'User re-invoked the same skill with different args.',
    })
  }

  return diffs
}
