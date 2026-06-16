// Input:  wouldExceedSubagentDepth(parentDepth) / MAX_SUBAGENT_DEPTH
// Output: Bun test assertions — 验证 S2 子代理嵌套 5 层硬上限边界
// Pos:    src/tools/AgentTool/constants.test.ts — unit tests for S2 嵌套深度上限
import { describe, expect, test } from 'bun:test'
import { MAX_SUBAGENT_DEPTH, wouldExceedSubagentDepth } from './constants.js'

describe('子代理嵌套深度硬上限 (S2)', () => {
  test('MAX_SUBAGENT_DEPTH 为 5', () => {
    expect(MAX_SUBAGENT_DEPTH).toBe(5)
  })

  // 新子代理深度 = (parentDepth ?? -1) + 1
  // 根上下文 depth=undefined → 第 1 层子代理 depth=0
  test('根上下文（undefined）可派生第 1 层', () => {
    expect(wouldExceedSubagentDepth(undefined)).toBe(false)
  })

  test('depth=-1（根 sentinel）可派生第 1 层', () => {
    expect(wouldExceedSubagentDepth(-1)).toBe(false)
  })

  test('第 1 层（depth=0）可派生第 2 层', () => {
    expect(wouldExceedSubagentDepth(0)).toBe(false)
  })

  test('第 4 层（depth=3）可派生第 5 层', () => {
    // child = 3 + 1 = 4 < 5 → 允许（这是第 5 层）
    expect(wouldExceedSubagentDepth(3)).toBe(false)
  })

  test('第 5 层（depth=4）派生第 6 层被拒', () => {
    // child = 4 + 1 = 5 >= 5 → 拒绝（第 6 层）
    expect(wouldExceedSubagentDepth(4)).toBe(true)
  })

  test('第 6 层（depth=5）及更深一律被拒', () => {
    expect(wouldExceedSubagentDepth(5)).toBe(true)
    expect(wouldExceedSubagentDepth(6)).toBe(true)
    expect(wouldExceedSubagentDepth(99)).toBe(true)
  })

  test('完整 5 层链：每层逐级判定', () => {
    // depth 序列：root(-1)→L1(0)→L2(1)→L3(2)→L4(3)→L5(4)
    const allowed = [-1, 0, 1, 2, 3].map((d) => wouldExceedSubagentDepth(d))
    expect(allowed).toEqual([false, false, false, false, false]) // 派生出 L1..L5
    expect(wouldExceedSubagentDepth(4)).toBe(true) // L5 想派 L6 → 拒
  })
})
