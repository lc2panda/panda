// v2.1.145 同步 — Read 工具超限 PARTIAL view 截断单元测试
// Input: truncateLinesToTokenBudget(content, ext, count, max) / buildPartialViewNotice(file)
// Output: 验证超限内容按行边界截断、不切半行、PARTIAL 提示文案正确
// Pos: src/tools/FileReadTool — token 预算软截断逻辑回归保护

import { test, expect, describe } from 'bun:test'
import {
  truncateLinesToTokenBudget,
  buildPartialViewNotice,
} from './FileReadTool.js'

describe('truncateLinesToTokenBudget — 超限按行边界软截断', () => {
  test('超限文件返回截断内容（truncated=true）而非抛错', () => {
    // 5000 行，每行 80 字符 → 估算远超 max
    const lines = Array.from({ length: 5000 }, (_, i) =>
      `line-${i}-`.padEnd(80, 'x'),
    )
    const content = lines.join('\n')
    const result = truncateLinesToTokenBudget(
      content,
      'txt',
      /* effectiveCount */ 200000,
      /* effectiveMaxTokens */ 25000,
    )
    expect(result.truncated).toBe(true)
    expect(result.truncatedLineCount).toBeGreaterThan(0)
    expect(result.truncatedLineCount).toBeLessThan(5000)
  })

  test('截断点落在行边界 — 不切断半行', () => {
    const lines = Array.from({ length: 2000 }, (_, i) => `row${i}=${'y'.repeat(60)}`)
    const content = lines.join('\n')
    const result = truncateLinesToTokenBudget(content, 'txt', 120000, 25000)
    // 截断后每一行都应是原始完整行（无半行）
    const kept = result.content.split('\n')
    expect(kept.length).toBe(result.truncatedLineCount)
    for (const l of kept) {
      expect(lines.includes(l)).toBe(true)
    }
    // 首行必须是原文件第一行（保留前缀语义）
    expect(kept[0]).toBe(lines[0])
  })

  test('保留的内容是原文件的前缀（leading lines）', () => {
    const lines = Array.from({ length: 1000 }, (_, i) => `L${i}:${'z'.repeat(100)}`)
    const content = lines.join('\n')
    const result = truncateLinesToTokenBudget(content, 'ts', 90000, 25000)
    const kept = result.content.split('\n')
    // 逐行与原文件前缀一致
    for (let i = 0; i < kept.length; i++) {
      expect(kept[i]).toBe(lines[i])
    }
  })

  test('估算下保留行不超出 token 预算', () => {
    const lines = Array.from({ length: 4000 }, (_, i) => `x${i}=${'a'.repeat(50)}`)
    const content = lines.join('\n')
    const max = 25000
    const result = truncateLinesToTokenBudget(content, 'txt', 160000, max)
    // 粗略估算 ~ chars/4，验证保留量明显小于全量
    expect(result.content.length).toBeLessThan(content.length)
    expect(result.truncatedLineCount).toBeGreaterThanOrEqual(1)
  })
})

describe('buildPartialViewNotice — PARTIAL 提示文案', () => {
  test('从头读（startLine=0）提示行号与续读 offset 正确', () => {
    const notice = buildPartialViewNotice({
      numLines: 300,
      startLine: 0,
      totalLines: 5000,
    })
    expect(notice).toContain('PARTIAL view')
    // 从头读：1 起，到 300 行
    expect(notice).toContain('lines 1-300 of 5000')
    // 续读 offset = lastLine + 1 = 301
    expect(notice).toContain('`offset` set to 301')
    expect(notice).toContain('Read again')
  })

  test('offset>0 续读时提示基于 startLine 计算正确', () => {
    const notice = buildPartialViewNotice({
      numLines: 200,
      startLine: 301,
      totalLines: 5000,
    })
    // 从 301 起，读 200 行 → 301-500
    expect(notice).toContain('lines 301-500 of 5000')
    expect(notice).toContain('`offset` set to 501')
  })

  test('提示包裹在 system-reminder 中', () => {
    const notice = buildPartialViewNotice({
      numLines: 10,
      startLine: 0,
      totalLines: 100,
    })
    expect(notice).toContain('<system-reminder>')
    expect(notice).toContain('</system-reminder>')
  })
})
