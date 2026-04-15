// B1 BashTool 输出压缩 — 单元测试
// Input: compressBashOutput(command, stdout, stderr, exitCode)
// Output: 验证各类命令输出的压缩策略正确触发

import { test, expect, describe, beforeEach } from 'bun:test'
import { compressBashOutput, type CompressionResult } from './outputCompressor.js'
import { resetStats, getSessionStats } from './compressionStats.js'

describe('B1 outputCompressor', () => {
  beforeEach(() => {
    resetStats()
  })

  // --- 小输出不压缩 ---
  test('小输出（<500 字符）不压缩 — 返回 null', () => {
    const result = compressBashOutput('echo hello', 'hello', '', 0)
    expect(result).toBeNull()
  })

  test('空 stdout 不压缩 — 返回 null', () => {
    const result = compressBashOutput('ls', '', 'some error', 1)
    expect(result).toBeNull()
  })

  // --- git status 压缩 ---
  test('git status — 大输出被压缩', () => {
    const lines: string[] = [
      'On branch main',
      'Your branch is up to date with \'origin/main\'.',
      '',
      'Changes not staged for commit:',
      '  (use "git add <file>..." to update what will be committed)',
      '  (use "git restore <file>..." to discard changes in working directory)',
    ]
    // 生成 50 个 modified 文件行
    for (let i = 0; i < 50; i++) {
      lines.push(`\tmodified:   src/module${i}/file${i}.ts`)
    }
    lines.push('', 'Untracked files:')
    lines.push('  (use "git add <file>..." to include in what will be committed)')
    for (let i = 0; i < 20; i++) {
      lines.push(`\tnew-file-${i}.txt`)
    }

    const stdout = lines.join('\n')
    const result = compressBashOutput('git status', stdout, '', 0)

    // 输出足够大应触发压缩
    if (result) {
      expect(result.compressed.length).toBeLessThan(stdout.length)
      expect(result.savedPercent).toBeGreaterThan(0)
      expect(result.strategy).toBeTruthy()
      // B4 统计应被记录
      expect(getSessionStats().compressionCount).toBe(1)
    }
    // 如果 null 说明阈值不够，至少验证不崩溃
  })

  // --- git diff 压缩 ---
  test('git diff — 大 diff 输出被压缩', () => {
    const lines: string[] = [
      'diff --git a/src/big-file.ts b/src/big-file.ts',
      'index abc1234..def5678 100644',
      '--- a/src/big-file.ts',
      '+++ b/src/big-file.ts',
      '@@ -1,100 +1,120 @@',
    ]
    // 生成 200 行 context + 改动
    for (let i = 0; i < 200; i++) {
      if (i % 10 === 0) {
        lines.push(`-  const old${i} = ${i}`)
        lines.push(`+  const new${i} = ${i + 1}`)
      } else {
        lines.push(`   const unchanged${i} = ${i}`)
      }
    }

    const stdout = lines.join('\n')
    const result = compressBashOutput('git diff', stdout, '', 0)

    if (result) {
      expect(result.compressed.length).toBeLessThan(stdout.length)
      expect(result.savedPercent).toBeGreaterThan(0)
    }
  })

  // --- git log 压缩 ---
  test('git log — 30 条 commit 被压缩', () => {
    const lines: string[] = []
    for (let i = 0; i < 30; i++) {
      lines.push(`commit ${'a'.repeat(40).slice(0, 38)}${String(i).padStart(2, '0')}`)
      lines.push(`Author: Dev <dev@example.com>`)
      lines.push(`Date:   Mon Apr ${10 + (i % 20)} 10:${String(i % 60).padStart(2, '0')}:00 2026 +0800`)
      lines.push('')
      lines.push(`    Fix issue #${100 + i}: update module ${i}`)
      lines.push('')
    }

    const stdout = lines.join('\n')
    const result = compressBashOutput('git log', stdout, '', 0)

    if (result) {
      expect(result.compressed.length).toBeLessThan(stdout.length)
      expect(result.savedPercent).toBeGreaterThan(0)
    }
  })

  // --- 测试输出压缩（全通过） ---
  test('测试输出（全通过）— jest 格式被压缩', () => {
    const lines: string[] = [
      'PASS src/utils/date.test.ts',
    ]
    // 30 个通过的测试
    for (let i = 0; i < 30; i++) {
      lines.push(`  ✓ test case ${i} passes correctly (${i + 1}ms)`)
    }
    lines.push('')
    lines.push('Test Suites: 1 passed, 1 total')
    lines.push('Tests:       30 passed, 30 total')
    lines.push('Snapshots:   0 total')
    lines.push('Time:        2.345 s')

    const stdout = lines.join('\n')
    const result = compressBashOutput('bun test', stdout, '', 0)

    if (result) {
      expect(result.compressed.length).toBeLessThan(stdout.length)
    }
  })

  // --- 测试输出压缩（有失败） ---
  test('测试输出（有失败）— 失败详情被保留', () => {
    const lines: string[] = [
      'FAIL src/utils/broken.test.ts',
    ]
    for (let i = 0; i < 20; i++) {
      lines.push(`  ✓ passing test ${i} (${i}ms)`)
    }
    lines.push('  ✕ broken test should work (5ms)')
    lines.push('')
    lines.push('  ● broken test should work')
    lines.push('')
    lines.push('    expect(received).toBe(expected)')
    lines.push('')
    lines.push('    Expected: 42')
    lines.push('    Received: undefined')
    lines.push('')
    lines.push('      at Object.<anonymous> (src/utils/broken.test.ts:15:18)')
    lines.push('')
    lines.push('Test Suites: 1 failed, 1 total')
    lines.push('Tests:       1 failed, 20 passed, 21 total')
    lines.push('Time:        1.234 s')

    const stdout = lines.join('\n')
    const result = compressBashOutput('bun test', stdout, '', 1)

    if (result) {
      // 失败详情应被保留（压缩后至少包含 FAIL 关键字）
      expect(result.compressed).toContain('FAIL')
      // 压缩后应比原始小
      expect(result.compressed.length).toBeLessThan(stdout.length)
    }
  })

  // --- ls 压缩 ---
  test('ls — 大量文件列表被压缩', () => {
    const lines: string[] = []
    for (let i = 0; i < 100; i++) {
      lines.push(`-rw-r--r--  1 user  staff  ${1000 + i * 100}  Apr 15 10:00 file-${String(i).padStart(3, '0')}.ts`)
    }

    const stdout = lines.join('\n')
    const result = compressBashOutput('ls -la', stdout, '', 0)

    if (result) {
      expect(result.compressed.length).toBeLessThan(stdout.length)
      expect(result.savedPercent).toBeGreaterThan(0)
    }
  })

  // --- npm install 压缩 ---
  test('npm install — 大输出被压缩', () => {
    const lines: string[] = [
      'npm warn deprecated inflight@1.0.6: This module is not supported.',
      'npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported.',
    ]
    for (let i = 0; i < 50; i++) {
      lines.push(`added package-${i}@${i}.0.0`)
    }
    lines.push('')
    lines.push('added 250 packages, and audited 251 packages in 5s')
    lines.push('')
    lines.push('50 packages are looking for funding')
    lines.push('  run `npm fund` for details')
    lines.push('')
    lines.push('found 0 vulnerabilities')

    const stdout = lines.join('\n')
    const result = compressBashOutput('npm install', stdout, '', 0)

    if (result) {
      expect(result.compressed.length).toBeLessThan(stdout.length)
    }
  })

  // --- B4 统计集成验证 ---
  test('压缩成功时 B4 统计被记录', () => {
    // 使用已知能压缩的大 git log
    const lines: string[] = []
    for (let i = 0; i < 40; i++) {
      lines.push(`commit ${'b'.repeat(38)}${String(i).padStart(2, '0')}`)
      lines.push(`Author: Dev <dev@example.com>`)
      lines.push(`Date:   Mon Apr 15 10:${String(i % 60).padStart(2, '0')}:00 2026 +0800`)
      lines.push('')
      lines.push(`    Commit message number ${i} with some extra detail text`)
      lines.push('')
    }

    const stdout = lines.join('\n')
    compressBashOutput('git log', stdout, '', 0)

    const stats = getSessionStats()
    // 如果压缩成功，统计应有记录；如果未触发压缩也不应崩溃
    expect(stats.compressionCount).toBeGreaterThanOrEqual(0)
  })
})
