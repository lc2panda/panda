// Input: SkillExecution + followup messages
// Output: runLearningCycle drives the four-stage Hermes loop end-to-end
// Pos: src/skills/learning/index.ts — public entrypoint for skill self-learning

export * from './types.js'
export { scoreOutcome } from './outcomeScorer.js'
export { extractDiffs } from './diffExtractor.js'
export {
  appendPatch,
  getPatchesForSkill,
  clearPatches,
} from './patchCache.js'

import type { SkillExecution } from './types.js'
import { scoreOutcome } from './outcomeScorer.js'
import { extractDiffs } from './diffExtractor.js'
import { appendPatch } from './patchCache.js'

/**
 * Full four-stage closed loop entrypoint.
 * Safe to call per turn from stopHooks — swallows all errors.
 */
export function runLearningCycle(
  exec: SkillExecution,
  followupMessages: ReadonlyArray<{ role: string; content: string }>,
): void {
  try {
    const outcome = scoreOutcome(exec, followupMessages)
    if (outcome.score >= 0.8) return // high score — nothing to learn

    const diffs = extractDiffs(exec, outcome, followupMessages)
    for (const diff of diffs) {
      appendPatch({
        skillName: diff.skillName,
        patchOp: 'append',
        content: `[${outcome.evaluatedAt}] ${diff.diffType}: ${diff.description}`,
        appliedAt: Date.now(),
      })
    }
  } catch {
    // best-effort; never break the host loop
  }
}
