// Input: bun:test scenarios for four-stage loop
// Output: asserts scoring, diff extraction, patch cache persistence
// Pos: src/skills/learning/learning.test.ts — unit tests for self-learning module

import { test, expect, beforeEach, beforeAll, afterAll } from 'bun:test'
import {
  scoreOutcome,
  extractDiffs,
  runLearningCycle,
  clearPatches,
  getPatchesForSkill,
  appendPatch,
  retrievePatchesForPrompt,
  pruneCache,
} from './index.js'

// bun test does not honour --feature=HERMES_SKILL_LEARNING, so we enable
// the learning cycle through the test-only env bypass. The default suite
// runs with it on; the dedicated feature-gate test toggles it off.
beforeAll(() => {
  process.env.PANDA_SKILL_LEARNING_TEST = '1'
})
afterAll(() => {
  delete process.env.PANDA_SKILL_LEARNING_TEST
})

beforeEach(() => clearPatches())

test('scoreOutcome — success without followup → high score', () => {
  const score = scoreOutcome(
    { skillName: 'test', invokedAt: Date.now(), args: {}, result: 'success' },
    [],
  )
  expect(score.score).toBeGreaterThan(0.7)
  expect(score.signals).toContain('execution-succeeded')
})

test('scoreOutcome — user rejected → low score', () => {
  const score = scoreOutcome(
    { skillName: 'test', invokedAt: Date.now(), args: {}, result: 'success' },
    [{ role: 'user', content: 'no, that is wrong' }],
  )
  expect(score.score).toBeLessThan(0.5)
  expect(score.signals).toContain('user-rejected')
})

test('scoreOutcome — failure result → very low score', () => {
  const score = scoreOutcome(
    { skillName: 'test', invokedAt: Date.now(), args: {}, result: 'failure' },
    [],
  )
  expect(score.score).toBeLessThan(0.4)
  expect(score.signals).toContain('execution-failed')
})

test('extractDiffs — captures rejection signal', () => {
  const exec = {
    skillName: 'test',
    invokedAt: Date.now(),
    args: {},
    result: 'success' as const,
  }
  const outcome = scoreOutcome(exec, [{ role: 'user', content: '不对' }])
  const diffs = extractDiffs(exec, outcome, [
    { role: 'user', content: '不对' },
  ])
  expect(diffs.length).toBeGreaterThan(0)
  expect(diffs.some(d => d.diffType === 'step-revision')).toBe(true)
})

test('runLearningCycle — low-score execution stores patch', async () => {
  await runLearningCycle(
    {
      skillName: 'test-skill',
      invokedAt: Date.now(),
      args: {},
      result: 'success',
    },
    [{ role: 'user', content: 'wrong' }],
  )
  const patches = getPatchesForSkill('test-skill')
  expect(patches.length).toBeGreaterThan(0)
  expect(patches[0]!.skillName).toBe('test-skill')
})

test('runLearningCycle — high-score execution skips', async () => {
  await runLearningCycle(
    {
      skillName: 'high-score-skill',
      invokedAt: Date.now(),
      args: {},
      result: 'success',
    },
    [],
  )
  const patches = getPatchesForSkill('high-score-skill')
  expect(patches.length).toBe(0)
})

test('patchCache — clearPatches resets state', async () => {
  await runLearningCycle(
    {
      skillName: 'clearme',
      invokedAt: Date.now(),
      args: {},
      result: 'failure',
    },
    [{ role: 'user', content: 'no' }],
  )
  expect(getPatchesForSkill('clearme').length).toBeGreaterThan(0)
  clearPatches()
  expect(getPatchesForSkill('clearme').length).toBe(0)
})

// ---------- Stage 3/4 additions: retrieve + decay + dedup + prune + E2E ----------

test('retrievePatchesForPrompt — empty cache returns empty string', () => {
  expect(retrievePatchesForPrompt('nonexistent')).toBe('')
})

test('retrievePatchesForPrompt — returns formatted hint block', () => {
  appendPatch({
    skillName: 'pdf',
    patchOp: 'append',
    content: 'step-revision: add explicit page range hint',
    appliedAt: Date.now(),
  })
  const hint = retrievePatchesForPrompt('pdf')
  expect(hint).toContain('历史改进信号')
  expect(hint).toContain('step-revision: add explicit page range hint')
})

test('E2E — appendPatch then retrievePatchesForPrompt roundtrip', async () => {
  await runLearningCycle(
    {
      skillName: 'e2e-skill',
      invokedAt: Date.now(),
      args: { foo: 'bar' },
      result: 'failure',
    },
    [{ role: 'user', content: 'no stop that is wrong' }],
  )
  const hint = retrievePatchesForPrompt('e2e-skill')
  expect(hint.length).toBeGreaterThan(0)
  expect(hint).toContain('历史改进信号')
  // the patch content should mention one of the diff types from the extractor
  expect(/step-revision|arg-correction|output-rewrite/.test(hint)).toBe(true)
})

test('feature gate — disabling HERMES_SKILL_LEARNING stops runLearningCycle', async () => {
  delete process.env.PANDA_SKILL_LEARNING_TEST
  try {
    await runLearningCycle(
      {
        skillName: 'gated-skill',
        invokedAt: Date.now(),
        args: {},
        result: 'failure',
      },
      [{ role: 'user', content: 'nope wrong again' }],
    )
    expect(getPatchesForSkill('gated-skill').length).toBe(0)
  } finally {
    // Restore for subsequent tests (afterAll will still clean up)
    process.env.PANDA_SKILL_LEARNING_TEST = '1'
  }
})

test('appendPatch — decay drops patches older than 30 days', () => {
  const old: any = {
    skillName: 'decay',
    patchOp: 'append',
    content: 'ancient',
    appliedAt: Date.now() - 31 * 86400000,
  }
  // bypass dedup by going through appendPatch once — it will keep the
  // fresh one and drop nothing yet because the cache starts empty and the
  // decay pass only runs on append. Seed by appending the old one first:
  appendPatch(old)
  // Old alone survives because decay runs only on the NEXT append:
  expect(getPatchesForSkill('decay').length).toBe(1)
  // Append a fresh one — decay pass should prune the ancient entry.
  appendPatch({
    skillName: 'decay',
    patchOp: 'append',
    content: 'fresh',
    appliedAt: Date.now(),
  })
  const patches = getPatchesForSkill('decay')
  expect(patches.length).toBe(1)
  expect(patches[0]!.content).toBe('fresh')
})

test('appendPatch — dedup ignores identical content', () => {
  const patch = {
    skillName: 'dedup',
    patchOp: 'append' as const,
    content: 'same-content',
    appliedAt: Date.now(),
  }
  appendPatch(patch)
  appendPatch(patch)
  appendPatch({ ...patch, appliedAt: Date.now() + 1 })
  expect(getPatchesForSkill('dedup').length).toBe(1)
})

test('pruneCache — trims hot skills to 10 most recent', () => {
  const now = Date.now()
  for (let i = 0; i < 30; i++) {
    appendPatch({
      skillName: 'hot',
      patchOp: 'append',
      content: `patch-${i}`,
      appliedAt: now + i,
    })
  }
  expect(getPatchesForSkill('hot').length).toBe(30)
  const { pruned } = pruneCache()
  expect(pruned).toBe(20)
  const remaining = getPatchesForSkill('hot')
  expect(remaining.length).toBe(10)
  // Should have kept the newest ones
  expect(remaining.some(p => p.content === 'patch-29')).toBe(true)
  expect(remaining.some(p => p.content === 'patch-0')).toBe(false)
})

test('retrievePatchesForPrompt — deduplicates by content', () => {
  appendPatch({
    skillName: 'rdup',
    patchOp: 'append',
    content: 'only-one',
    appliedAt: Date.now(),
  })
  // Second appendPatch with same content is silently ignored
  appendPatch({
    skillName: 'rdup',
    patchOp: 'append',
    content: 'only-one',
    appliedAt: Date.now() + 1,
  })
  const hint = retrievePatchesForPrompt('rdup', 5)
  const occurrences = hint.split('only-one').length - 1
  expect(occurrences).toBe(1)
})
