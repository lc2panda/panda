// Input:  --fallback-model 逐次取值 + getNextFallback 链式回退
// Output: 解析器产出有序≤3去重列表；getNextFallback 按用户列表顺序逐级推进
// Pos:    波次1 项3（上游 166+178）— --fallback-model 收多值（≤3 有序）单元测试

import { describe, expect, test } from 'bun:test'
import {
  collectFallbackModels,
  MAX_FALLBACK_MODELS,
} from './fallbackModels.js'
import { getNextFallback } from '../../routing/routeResolver.js'

describe('collectFallbackModels — --fallback-model 多值解析（上游 166+178）', () => {
  test('上限常量为 3', () => {
    expect(MAX_FALLBACK_MODELS).toBe(3)
  })

  test('单值（向后兼容）→ 单元素数组', () => {
    expect(collectFallbackModels('sonnet', undefined)).toEqual(['sonnet'])
  })

  test('逗号分隔一次传入 → 按序数组', () => {
    expect(collectFallbackModels('sonnet,haiku,opus', undefined)).toEqual([
      'sonnet',
      'haiku',
      'opus',
    ])
  })

  test('重复传 flag（Commander 累积）→ 按序追加', () => {
    let acc = collectFallbackModels('sonnet', undefined)
    acc = collectFallbackModels('haiku', acc)
    acc = collectFallbackModels('opus', acc)
    expect(acc).toEqual(['sonnet', 'haiku', 'opus'])
  })

  test('保持给定顺序（不排序）', () => {
    expect(collectFallbackModels('opus,sonnet,haiku', undefined)).toEqual([
      'opus',
      'sonnet',
      'haiku',
    ])
  })

  test('去重（同名只保留首次出现位置）', () => {
    expect(
      collectFallbackModels('sonnet,haiku,sonnet,opus', undefined),
    ).toEqual(['sonnet', 'haiku', 'opus'])
  })

  test('超过 3 个被截断（保留前 3 个有序）', () => {
    expect(
      collectFallbackModels('a,b,c,d,e', undefined),
    ).toEqual(['a', 'b', 'c'])
  })

  test('混合逗号与重复 flag，整体仍≤3 去重有序', () => {
    let acc = collectFallbackModels('a,b', undefined)
    acc = collectFallbackModels('c,d', acc)
    expect(acc).toEqual(['a', 'b', 'c'])
  })

  test('空白与空段被过滤', () => {
    expect(collectFallbackModels(' sonnet , , haiku ', undefined)).toEqual([
      'sonnet',
      'haiku',
    ])
  })

  test('首元素即主回退（向后兼容单值语义）', () => {
    const list = collectFallbackModels('sonnet,haiku,opus', undefined)
    expect(list[0]).toBe('sonnet')
  })
})

describe('getNextFallback — 按用户有序列表逐级推进（项3 回退链）', () => {
  const chain = ['F1', 'F2', 'F3']

  test('主模型（不在链中）→ 返回链首 F1', () => {
    expect(getNextFallback('M', chain)).toBe('F1')
  })

  test('F1 过载 → 推进到 F2', () => {
    expect(getNextFallback('F1', chain)).toBe('F2')
  })

  test('F2 过载 → 推进到 F3', () => {
    expect(getNextFallback('F2', chain)).toBe('F3')
  })

  test('链尾 F3 过载 → 无下一项（null）', () => {
    expect(getNextFallback('F3', chain)).toBeNull()
  })

  test('完整有序遍历模拟：M → F1 → F2 → F3 → 终止', () => {
    const visited: string[] = []
    let current = 'M'
    // 起始主模型，最多走 chain.length 次
    for (let i = 0; i <= chain.length; i++) {
      const next = getNextFallback(current, chain)
      if (next === null) break
      visited.push(next)
      current = next
    }
    expect(visited).toEqual(['F1', 'F2', 'F3'])
  })

  test('单值列表：F1 过载后无后续（退化为旧单值行为）', () => {
    const single = ['F1']
    expect(getNextFallback('M', single)).toBe('F1')
    expect(getNextFallback('F1', single)).toBeNull()
  })
})
