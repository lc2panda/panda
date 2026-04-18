/**
 * 作战线 N 单元测试 — pickDefaultCodexModel + pickNextCodexFallback
 *
 * Input:  chatgpt_plan_type 字符串（free/plus/pro/team/enterprise/null）
 * Output: 断言按 plan 返回候选列表首项 + fallback 链顺序
 * Pos:    src/services/api/openaiAdapter.ts — Codex 模型自动发现逻辑单测
 *
 * NEW-FILE:#20260417-04
 */

import { test, expect, afterEach } from 'bun:test'
import {
  pickDefaultCodexModel,
  pickNextCodexFallback,
  CODEX_MODEL_CANDIDATES_FOR_FREE,
  CODEX_MODEL_CANDIDATES_FOR_PAID,
} from './openaiAdapter.js'

const ORIGINAL_ENV_DEFAULT = process.env.PANDA_CODEX_DEFAULT_MODEL

afterEach(() => {
  if (ORIGINAL_ENV_DEFAULT === undefined) {
    delete process.env.PANDA_CODEX_DEFAULT_MODEL
  } else {
    process.env.PANDA_CODEX_DEFAULT_MODEL = ORIGINAL_ENV_DEFAULT
  }
})

// ─── pickDefaultCodexModel ───────────────────────────────────────────────────

test('pickDefaultCodexModel: free 走 FREE 候选列表首项', () => {
  delete process.env.PANDA_CODEX_DEFAULT_MODEL
  expect(pickDefaultCodexModel('free')).toBe(CODEX_MODEL_CANDIDATES_FOR_FREE[0])
})

test('pickDefaultCodexModel: plus/pro/team/enterprise/business 走 PAID 首项', () => {
  delete process.env.PANDA_CODEX_DEFAULT_MODEL
  for (const pt of ['plus', 'pro', 'team', 'enterprise', 'business', 'PLUS', 'Pro']) {
    expect(pickDefaultCodexModel(pt)).toBe(CODEX_MODEL_CANDIDATES_FOR_PAID[0])
  }
})

test('pickDefaultCodexModel: null / undefined / 未知 plan 走 FREE（保守）', () => {
  delete process.env.PANDA_CODEX_DEFAULT_MODEL
  expect(pickDefaultCodexModel(null)).toBe(CODEX_MODEL_CANDIDATES_FOR_FREE[0])
  expect(pickDefaultCodexModel(undefined)).toBe(CODEX_MODEL_CANDIDATES_FOR_FREE[0])
  expect(pickDefaultCodexModel('mystery')).toBe(CODEX_MODEL_CANDIDATES_FOR_FREE[0])
})

test('pickDefaultCodexModel: PANDA_CODEX_DEFAULT_MODEL env 覆盖一切', () => {
  process.env.PANDA_CODEX_DEFAULT_MODEL = 'gpt-9000-orion'
  expect(pickDefaultCodexModel('free')).toBe('gpt-9000-orion')
  expect(pickDefaultCodexModel('plus')).toBe('gpt-9000-orion')
})

// ─── pickNextCodexFallback ───────────────────────────────────────────────────

test('pickNextCodexFallback: free 链按序降级', () => {
  const free = CODEX_MODEL_CANDIDATES_FOR_FREE
  expect(pickNextCodexFallback(free[0]!, 'free')).toBe(free[1])
  expect(pickNextCodexFallback(free[free.length - 2]!, 'free')).toBe(
    free[free.length - 1],
  )
})

test('pickNextCodexFallback: paid 链按序降级', () => {
  const paid = CODEX_MODEL_CANDIDATES_FOR_PAID
  expect(pickNextCodexFallback(paid[0]!, 'pro')).toBe(paid[1])
})

test('pickNextCodexFallback: 已是链尾返回 null', () => {
  const free = CODEX_MODEL_CANDIDATES_FOR_FREE
  expect(pickNextCodexFallback(free[free.length - 1]!, 'free')).toBeNull()
  const paid = CODEX_MODEL_CANDIDATES_FOR_PAID
  expect(pickNextCodexFallback(paid[paid.length - 1]!, 'plus')).toBeNull()
})

test('pickNextCodexFallback: 未知 model 返回候选首项（通用降级）', () => {
  expect(pickNextCodexFallback('gpt-unknown-9000', 'free')).toBe(
    CODEX_MODEL_CANDIDATES_FOR_FREE[0],
  )
  expect(pickNextCodexFallback('gpt-unknown-9000', 'plus')).toBe(
    CODEX_MODEL_CANDIDATES_FOR_PAID[0],
  )
})
