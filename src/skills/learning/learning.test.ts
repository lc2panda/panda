// Input: bun:test scenarios for four-stage loop
// Output: asserts scoring, diff extraction, patch cache persistence
// Pos: src/skills/learning/learning.test.ts — unit tests for self-learning module

import { test, expect, beforeEach } from 'bun:test'
import {
  scoreOutcome,
  extractDiffs,
  runLearningCycle,
  clearPatches,
  getPatchesForSkill,
} from './index.js'

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

test('runLearningCycle — low-score execution stores patch', () => {
  runLearningCycle(
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

test('runLearningCycle — high-score execution skips', () => {
  runLearningCycle(
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

test('patchCache — clearPatches resets state', () => {
  runLearningCycle(
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
