// Input: SkillExecution + followup messages
// Output: runLearningCycle drives the four-stage Hermes loop end-to-end
// Pos: src/skills/learning/index.ts — public entrypoint for skill self-learning

import { feature } from 'bun:bundle'

export * from './types.js'
export { scoreOutcome } from './outcomeScorer.js'
export { extractDiffs, extractDiffsLLM } from './diffExtractor.js'
export {
  appendPatch,
  getPatchesForSkill,
  clearPatches,
  retrievePatchesForPrompt,
  pruneCache,
} from './patchCache.js'

import type { SkillExecution } from './types.js'
import { scoreOutcome } from './outcomeScorer.js'
import { extractDiffs, extractDiffsLLM } from './diffExtractor.js'
import { appendPatch } from './patchCache.js'

/**
 * Full four-stage closed loop entrypoint.
 * Safe to call per turn from stopHooks — swallows all errors.
 * Gated on `HERMES_SKILL_LEARNING` feature flag.
 */
export async function runLearningCycle(
  exec: SkillExecution,
  followupMessages: ReadonlyArray<{ role: string; content: string }>,
): Promise<void> {
  // Feature gate. Tests may set PANDA_SKILL_LEARNING_TEST=1 to bypass
  // the compile-time flag (bun test does not honour --feature).
  if (
    !feature('HERMES_SKILL_LEARNING') &&
    process.env.PANDA_SKILL_LEARNING_TEST !== '1'
  ) {
    return
  }

  try {
    const outcome = scoreOutcome(exec, followupMessages)
    if (outcome.score >= 0.8) {
      emitTengu('tengu_skill_learning_cycle', {
        skillName: exec.skillName,
        score: outcome.score,
        diffsCount: 0,
        skipped: true,
      })
      return // high score — nothing to learn
    }

    let diffs
    try {
      diffs = await extractDiffsLLM(exec, outcome, followupMessages)
    } catch {
      diffs = extractDiffs(exec, outcome, followupMessages)
    }

    for (const diff of diffs) {
      appendPatch({
        skillName: diff.skillName,
        patchOp: 'append',
        content: `[${outcome.evaluatedAt}] ${diff.diffType}: ${diff.description}`,
        appliedAt: Date.now(),
      })
    }

    emitTengu('tengu_skill_learning_cycle', {
      skillName: exec.skillName,
      score: outcome.score,
      diffsCount: diffs.length,
      skipped: false,
    })
  } catch {
    // best-effort; never break the host loop
  }
}

/**
 * Fire a learning-related analytics event. Swallows all errors because the
 * learning loop must never break the host turn when analytics are offline.
 */
function emitTengu(
  eventName: 'tengu_skill_learning_cycle' | 'tengu_skill_patch_applied',
  payload: {
    skillName: string
    score?: number
    diffsCount?: number
    patchesCount?: number
    skipped?: boolean
  },
): void {
  try {
    // Dynamic require to avoid analytics import cycles. The analytics module
    // loads eagerly from many sites already, so this just hits the cache.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const analytics = require('../../services/analytics/index.js') as {
      logEvent: (name: string, metadata: Record<string, unknown>) => void
    }
    analytics.logEvent(eventName, {
      skill_name: payload.skillName,
      score: payload.score,
      diffs_count: payload.diffsCount,
      patches_count: payload.patchesCount,
      skipped: payload.skipped,
    })
  } catch {
    // best-effort
  }
}

/**
 * Emit the patch-applied telemetry. Called from the SkillTool injection site
 * when we inject historical patches into the next skill invocation prompt.
 */
export function emitPatchApplied(
  skillName: string,
  patchesCount: number,
): void {
  emitTengu('tengu_skill_patch_applied', { skillName, patchesCount })
}
