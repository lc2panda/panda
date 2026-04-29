// Input: Key 模拟 + rawInput + promptLength + sticky
// Output: bool — 是否应跳到底部
// Pos: PromptInput jump-to-bottom 决策纯函数单测（Comdr #3 修复 2026-04-26）

import { describe, expect, test } from 'bun:test'
import type { Key } from '../../ink.js'
import { shouldJumpToBottom } from './utils.js'

function k(partial: Partial<Key> = {}): Pick<
  Key,
  'ctrl' | 'meta' | 'shift' | 'return' | 'downArrow'
> {
  return {
    ctrl: false,
    meta: false,
    shift: false,
    return: false,
    downArrow: false,
    ...partial,
  }
}

describe('shouldJumpToBottom — Comdr #3 jump-to-bottom 三键支持', () => {
  // Sticky=true：所有路径返回 false（已经在底部，不需要跳）
  test('sticky=true：空格也不跳', () => {
    expect(shouldJumpToBottom(' ', k(), 0, true)).toBe(false)
  })
  test('sticky=true：Enter 也不跳', () => {
    expect(shouldJumpToBottom('\r', k({ return: true }), 0, true)).toBe(false)
  })
  test('sticky=true：ArrowDown 也不跳', () => {
    expect(shouldJumpToBottom('', k({ downArrow: true }), 0, true)).toBe(false)
  })

  // 修饰键：屏蔽
  test('Ctrl+Space：不跳', () => {
    expect(shouldJumpToBottom(' ', k({ ctrl: true }), 0, false)).toBe(false)
  })
  test('Meta+Enter：不跳（newline 修饰）', () => {
    expect(
      shouldJumpToBottom('\r', k({ return: true, meta: true }), 0, false),
    ).toBe(false)
  })
  test('Shift+ArrowDown：不跳（选中扩展）', () => {
    expect(
      shouldJumpToBottom('', k({ downArrow: true, shift: true }), 0, false),
    ).toBe(false)
  })

  // 空格 — 任意输入长度
  test('Space + sticky=false + 空 prompt：跳', () => {
    expect(shouldJumpToBottom(' ', k(), 0, false)).toBe(true)
  })
  test('Space + sticky=false + 已输入 5 字符：仍跳', () => {
    expect(shouldJumpToBottom(' ', k(), 5, false)).toBe(true)
  })

  // Enter — 仅空 prompt
  test('Enter + sticky=false + 空 prompt：跳', () => {
    expect(shouldJumpToBottom('\r', k({ return: true }), 0, false)).toBe(true)
  })
  test('Enter + sticky=false + 已输入 1 字符：不跳（保护 submit）', () => {
    expect(shouldJumpToBottom('\r', k({ return: true }), 1, false)).toBe(false)
  })
  test('Enter + sticky=false + 已输入 100 字符：不跳（保护 submit）', () => {
    expect(shouldJumpToBottom('\r', k({ return: true }), 100, false)).toBe(false)
  })

  // ArrowDown — 仅空 prompt
  test('ArrowDown + sticky=false + 空 prompt：跳', () => {
    expect(shouldJumpToBottom('', k({ downArrow: true }), 0, false)).toBe(true)
  })
  test('ArrowDown + sticky=false + 已输入 1 字符：不跳（保护历史/光标 down）', () => {
    expect(shouldJumpToBottom('', k({ downArrow: true }), 1, false)).toBe(false)
  })

  // 其他键不跳
  test('字母 a：不跳', () => {
    expect(shouldJumpToBottom('a', k(), 0, false)).toBe(false)
  })
  test('Tab：不跳（无 return/downArrow flag）', () => {
    expect(shouldJumpToBottom('\t', k(), 0, false)).toBe(false)
  })
  test('ArrowUp：不跳（不在三键白名单）', () => {
    // upArrow 不属于任何 jump 触发键，模拟对应 key 但 downArrow=false
    expect(shouldJumpToBottom('', k(), 0, false)).toBe(false)
  })
})
