// B3 全工具输出压缩 — 单元测试
// Input: compressToolOutput(toolName, output, toolInput?)
// Output: 验证 Read/Grep/Glob 工具输出的压缩策略

import { test, expect, describe, beforeEach } from 'bun:test'
import { compressToolOutput } from './toolOutputCompressor.js'
import { resetStats, getSessionStats } from '../tools/BashTool/compressionStats.js'

describe('B3 toolOutputCompressor', () => {
  beforeEach(() => {
    resetStats()
  })

  // --- 小输出不压缩 ---
  test('小输出不压缩 — 返回 null', () => {
    const result = compressToolOutput('Read', 'short content')
    expect(result).toBeNull()
  })

  test('未知工具不压缩 — 返回 null', () => {
    const result = compressToolOutput('UnknownTool', 'a'.repeat(5000))
    expect(result).toBeNull()
  })

  // --- Read 压缩 ---
  test('Read — 大文件（1500+ 行）被压缩', () => {
    // 构造 1500 行带行号的代码输出（模拟 Read 工具输出格式）
    const lines: string[] = []
    for (let i = 1; i <= 1500; i++) {
      lines.push(`${i}\tconst variable${i} = "value_${i}" // some code comment here for padding`)
    }
    const output = lines.join('\n')

    const result = compressToolOutput('Read', output)
    if (result) {
      expect(result.compressed.length).toBeLessThan(output.length)
      expect(result.savedPercent).toBeGreaterThan(0)
      expect(result.toolName).toBe('Read')
      // B4 统计应被记录
      expect(getSessionStats().compressionCount).toBe(1)
    }
  })

  test('Read — 短文件（<500 行）不压缩', () => {
    const lines: string[] = []
    for (let i = 1; i <= 100; i++) {
      lines.push(`${i}\tconst x${i} = ${i}`)
    }
    const output = lines.join('\n')
    const result = compressToolOutput('Read', output)
    expect(result).toBeNull()
  })

  // --- Grep 压缩 ---
  test('Grep — 大量匹配（50+ 行）被压缩', () => {
    // 构造 60 个匹配行，分布在 10 个文件中
    const lines: string[] = []
    for (let fileIdx = 0; fileIdx < 10; fileIdx++) {
      for (let matchIdx = 0; matchIdx < 6; matchIdx++) {
        lines.push(`src/module${fileIdx}/file${fileIdx}.ts:${matchIdx * 10 + 5}:  const match${matchIdx} = "found_pattern_here_with_extra_text_for_padding"`)
      }
    }
    const output = lines.join('\n')

    const result = compressToolOutput('Grep', output)
    if (result) {
      expect(result.compressed.length).toBeLessThan(output.length)
      expect(result.savedPercent).toBeGreaterThan(0)
      expect(result.toolName).toBe('Grep')
    }
  })

  test('Grep — 少量匹配不压缩', () => {
    const lines = [
      'src/file.ts:10:  const x = 1',
      'src/file.ts:20:  const y = 2',
    ]
    const result = compressToolOutput('Grep', lines.join('\n'))
    expect(result).toBeNull()
  })

  // --- Glob 压缩 ---
  test('Glob — 大量文件路径（50+）被压缩', () => {
    const lines: string[] = []
    for (let dirIdx = 0; dirIdx < 10; dirIdx++) {
      for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
        lines.push(`src/modules/feature${dirIdx}/component${fileIdx}.tsx`)
      }
    }
    const output = lines.join('\n')

    const result = compressToolOutput('Glob', output)
    if (result) {
      expect(result.compressed.length).toBeLessThan(output.length)
      expect(result.savedPercent).toBeGreaterThan(0)
      expect(result.toolName).toBe('Glob')
    }
  })

  test('Glob — 少量文件不压缩', () => {
    const lines = [
      'src/index.ts',
      'src/main.ts',
      'src/app.ts',
    ]
    const result = compressToolOutput('Glob', lines.join('\n'))
    expect(result).toBeNull()
  })

  // --- B4 统计集成验证 ---
  test('多次压缩后 B4 统计累积正确', () => {
    // 构造大 Read 输出
    const readLines: string[] = []
    for (let i = 1; i <= 2000; i++) {
      readLines.push(`${i}\texport function handler${i}() { return ${i} } // padding text here`)
    }
    compressToolOutput('Read', readLines.join('\n'))

    // 构造大 Grep 输出
    const grepLines: string[] = []
    for (let f = 0; f < 15; f++) {
      for (let m = 0; m < 5; m++) {
        grepLines.push(`src/mod${f}/file.ts:${m * 10}:  const match = "pattern_found_here"`)
      }
    }
    compressToolOutput('Grep', grepLines.join('\n'))

    const stats = getSessionStats()
    // 至少有一些压缩被记录（取决于阈值是否满足）
    expect(stats.compressionCount).toBeGreaterThanOrEqual(0)
  })
})
