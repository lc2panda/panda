// B4 压缩统计 — 单元测试
// Input: compressionStats 模块的公开 API
// Output: 验证统计记录、汇总、格式化、重置功能

import { test, expect, describe, beforeEach } from 'bun:test'
import {
  recordCompression,
  getSessionStats,
  formatStatsForDisplay,
  resetStats,
} from './compressionStats.js'

describe('B4 compressionStats', () => {
  beforeEach(() => {
    resetStats()
  })

  test('初始状态 — compressionCount 为 0', () => {
    const stats = getSessionStats()
    expect(stats.compressionCount).toBe(0)
    expect(stats.totalOriginal).toBe(0)
    expect(stats.totalCompressed).toBe(0)
    expect(stats.totalSaved).toBe(0)
    expect(stats.avgSavedPercent).toBe(0)
    expect(stats.topSavers).toEqual([])
  })

  test('recordCompression + getSessionStats — 记录 3 次后统计正确', () => {
    recordCompression({
      command: 'git log',
      originalChars: 10000,
      compressedChars: 3000,
      savedChars: 7000,
      savedPercent: 0.7,
      strategy: 'git-log',
    })
    recordCompression({
      command: 'git status',
      originalChars: 5000,
      compressedChars: 2000,
      savedChars: 3000,
      savedPercent: 0.6,
      strategy: 'git-status',
    })
    recordCompression({
      command: 'npm install',
      originalChars: 8000,
      compressedChars: 4000,
      savedChars: 4000,
      savedPercent: 0.5,
      strategy: 'install',
    })

    const stats = getSessionStats()
    expect(stats.compressionCount).toBe(3)
    expect(stats.totalOriginal).toBe(23000)
    expect(stats.totalCompressed).toBe(9000)
    expect(stats.totalSaved).toBe(14000)
    // avgSavedPercent = totalSaved / totalOriginal = 14000/23000 ≈ 0.6087
    expect(stats.avgSavedPercent).toBeCloseTo(14000 / 23000, 4)
    // topSavers 按 savedChars 降序，top 3
    expect(stats.topSavers.length).toBe(3)
    expect(stats.topSavers[0].command).toBe('git log')
    expect(stats.topSavers[0].savedChars).toBe(7000)
  })

  test('formatStatsForDisplay — 无记录时返回空字符串', () => {
    expect(formatStatsForDisplay()).toBe('')
  })

  test('formatStatsForDisplay — 有记录时返回含 💾 的统计行', () => {
    recordCompression({
      command: 'git diff',
      originalChars: 6000,
      compressedChars: 2000,
      savedChars: 4000,
      savedPercent: 0.67,
      strategy: 'git-diff',
    })

    const display = formatStatsForDisplay()
    expect(display).toContain('💾')
    expect(display).toContain('1 次')
    expect(display).toContain('4.0K')
  })

  test('resetStats — 重置后统计归零', () => {
    recordCompression({
      command: 'ls -la',
      originalChars: 2000,
      compressedChars: 500,
      savedChars: 1500,
      savedPercent: 0.75,
      strategy: 'ls',
    })
    expect(getSessionStats().compressionCount).toBe(1)

    resetStats()
    expect(getSessionStats().compressionCount).toBe(0)
    expect(formatStatsForDisplay()).toBe('')
  })
})
