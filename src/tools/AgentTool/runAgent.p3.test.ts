/**
 * P3: 连续同工具失败熔断 — 纯函数单测
 * 覆盖：累计/重置/阈值=3 触发 broken
 */
import { describe, expect, test } from 'bun:test'
import { updateSameToolFailureCircuit } from './runAgent.js'

describe('updateSameToolFailureCircuit (P3)', () => {
  test('连续同工具失败累计到阈值触发 broken', () => {
    let state = { toolName: null as string | null, failCount: 0 }

    let r = updateSameToolFailureCircuit(state, 'AskUserQuestion', true, 3)
    expect(r).toEqual({ toolName: 'AskUserQuestion', failCount: 1, broken: false })
    state = { toolName: r.toolName, failCount: r.failCount }

    r = updateSameToolFailureCircuit(state, 'AskUserQuestion', true, 3)
    expect(r.failCount).toBe(2)
    expect(r.broken).toBe(false)
    state = { toolName: r.toolName, failCount: r.failCount }

    r = updateSameToolFailureCircuit(state, 'AskUserQuestion', true, 3)
    expect(r.failCount).toBe(3)
    expect(r.broken).toBe(true)
  })

  test('成功后重置连续失败计数', () => {
    let state = { toolName: 'Bash' as string | null, failCount: 2 }
    const r = updateSameToolFailureCircuit(state, 'Bash', false, 3)
    expect(r).toEqual({ toolName: null, failCount: 0, broken: false })
  })

  test('切换工具名重新计数', () => {
    let state = { toolName: 'Bash' as string | null, failCount: 2 }
    const r = updateSameToolFailureCircuit(state, 'AskUserQuestion', true, 3)
    expect(r).toEqual({ toolName: 'AskUserQuestion', failCount: 1, broken: false })
  })
})
