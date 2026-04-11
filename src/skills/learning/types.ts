// Input: skill execution / outcome / diff / patch domain types
// Output: shared TS interfaces used by the four-stage learning loop
// Pos: src/skills/learning/types.ts — foundation types for Hermes-style self-learning

export interface SkillExecution {
  skillName: string
  invokedAt: number
  args: Record<string, unknown>
  result: 'success' | 'failure' | 'cancelled'
}

export interface OutcomeScore {
  skillName: string
  executionId: string
  score: number // 0-1, 1 = perfect
  signals: string[] // e.g. ['user-accepted', 'no-followup-correction']
  evaluatedAt: number
}

export interface SkillDiff {
  skillName: string
  diffType: 'arg-correction' | 'step-revision' | 'output-rewrite'
  description: string
  beforeSnippet?: string
  afterSnippet?: string
}

export interface SkillPatch {
  skillName: string
  patchOp: 'append' | 'replace' | 'amend-prompt'
  content: string
  appliedAt: number
}
