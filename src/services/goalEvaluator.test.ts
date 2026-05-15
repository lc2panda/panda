// Input:  vitest test cases exercising parseEvaluatorJson tolerance
// Output: green test suite verifying parser handles plain JSON, code-fenced
//         JSON, leading prose, malformed payloads, missing fields.
// Pos:    src/services/goalEvaluator.test.ts — companion to goalEvaluator.ts.
//         Pure parser tests only — actual model call is integration-tested
//         via manual `/goal` invocation (see commands/goal/README.md).
//
// NEW-FILE:#20260515-07 — implements upstream Claude Code v2.1.139 `/goal`.
//
// 一旦我被修改，请更新所属文件夹的 README.md（如有）。

import { describe, it, expect } from 'bun:test'
import { parseEvaluatorJson } from './goalEvaluator.js'

describe('parseEvaluatorJson', () => {
  it('parses plain JSON', () => {
    const r = parseEvaluatorJson('{"met": true, "reason": "all tests pass"}')
    expect(r).toEqual({ met: true, reason: 'all tests pass' })
  })

  it('parses met=false', () => {
    const r = parseEvaluatorJson('{"met": false, "reason": "still 3 failures"}')
    expect(r).toEqual({ met: false, reason: 'still 3 failures' })
  })

  it('handles ```json code fence wrap', () => {
    const r = parseEvaluatorJson('```json\n{"met": true, "reason": "done"}\n```')
    expect(r).toEqual({ met: true, reason: 'done' })
  })

  it('handles plain ``` fence', () => {
    const r = parseEvaluatorJson('```\n{"met": false, "reason": "x"}\n```')
    expect(r).toEqual({ met: false, reason: 'x' })
  })

  it('tolerates leading prose by scanning to first {', () => {
    const r = parseEvaluatorJson('Here is my answer: {"met": true, "reason": "ok"}')
    expect(r).toEqual({ met: true, reason: 'ok' })
  })

  it('caps reason at 200 chars', () => {
    const long = 'r'.repeat(500)
    const r = parseEvaluatorJson(`{"met": true, "reason": "${long}"}`)
    expect(r?.reason.length).toBe(200)
  })

  it('returns null when no braces', () => {
    expect(parseEvaluatorJson('I think yes')).toBeNull()
  })

  it('returns null when met field is missing', () => {
    expect(parseEvaluatorJson('{"reason": "no met field"}')).toBeNull()
  })

  it('returns null when met is non-boolean', () => {
    expect(parseEvaluatorJson('{"met": "yes", "reason": "no"}')).toBeNull()
  })

  it('returns null on malformed JSON', () => {
    expect(parseEvaluatorJson('{"met": true, "reason":')).toBeNull()
  })

  it('synthesizes reason when missing but met=true', () => {
    const r = parseEvaluatorJson('{"met": true}')
    expect(r?.met).toBe(true)
    expect(typeof r?.reason).toBe('string')
    expect(r?.reason.length).toBeGreaterThan(0)
  })

  it('synthesizes reason when missing but met=false', () => {
    const r = parseEvaluatorJson('{"met": false}')
    expect(r?.met).toBe(false)
    expect(typeof r?.reason).toBe('string')
  })
})
