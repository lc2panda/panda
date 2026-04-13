// Input: 测试运行器命令 + stdout/stderr 输出
// Output: 结构化解析结果 (ParsedOutput)
// Pos: BashTool/parsers/ 测试运行器输出解析器（Jest/Vitest/Pytest/Go test）
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { ParsedOutput } from './index.js'

// ---------------------------------------------------------------------------
// Jest / Vitest (共享格式)
// ---------------------------------------------------------------------------

function parseJestVitest(stdout: string, stderr: string): ParsedOutput | null {
  const combined = stdout + '\n' + stderr
  const lines = combined.split('\n')

  let pass = 0, fail = 0, skip = 0, total = 0
  let suites = 0, suiteFail = 0
  const failDetails: string[] = []
  const errors: string[] = []
  const warnings: string[] = []
  let inFailBlock = false

  for (const line of lines) {
    // Test Suites: 1 failed, 5 passed, 6 total
    const suiteMatch = line.match(/Test Suites?:\s*(.*?)(\d+)\s+total/)
    if (suiteMatch) {
      suites = parseInt(suiteMatch[2], 10)
      const failMatch = line.match(/(\d+)\s+failed/)
      if (failMatch) suiteFail = parseInt(failMatch[1], 10)
      continue
    }
    // Tests: 2 failed, 8 passed, 1 skipped, 11 total
    const testMatch = line.match(/Tests?:\s*(.*?)(\d+)\s+total/)
    if (testMatch) {
      total = parseInt(testMatch[2], 10)
      const pMatch = line.match(/(\d+)\s+passed/)
      const fMatch = line.match(/(\d+)\s+failed/)
      const sMatch = line.match(/(\d+)\s+(skipped|pending|todo)/)
      if (pMatch) pass = parseInt(pMatch[1], 10)
      if (fMatch) fail = parseInt(fMatch[1], 10)
      if (sMatch) skip = parseInt(sMatch[1], 10)
      continue
    }
    // FAIL src/foo.test.ts
    if (/^FAIL\s/.test(line.trim())) {
      inFailBlock = true
      failDetails.push(line.trim())
      continue
    }
    // Error lines in failure context
    if (inFailBlock) {
      if (line.trim() === '' || /^PASS\s/.test(line.trim())) {
        inFailBlock = false
      } else {
        failDetails.push(line)
      }
    }
    // Warning lines
    if (/\bwarn(ing)?\b/i.test(line)) {
      warnings.push(line.trim())
    }
  }

  if (total === 0 && pass === 0 && fail === 0) return null

  const status = fail > 0 ? '✗ FAIL' : '✓ PASS'
  const summary = `${status}: ${pass} passed, ${fail} failed, ${skip} skipped (${total} total)`

  return {
    summary,
    details: fail > 0 ? failDetails.slice(0, 30) : [],
    errors: fail > 0 ? failDetails.slice(0, 10) : [],
    warnings: warnings.slice(0, 5),
    stats: { pass, fail, skip, total, suites, suiteFail },
  }
}

// ---------------------------------------------------------------------------
// Pytest
// ---------------------------------------------------------------------------

function parsePytest(stdout: string, stderr: string): ParsedOutput | null {
  const combined = stdout + '\n' + stderr
  const lines = combined.split('\n')

  let passed = 0, failed = 0, error = 0, skipped = 0
  const failDetails: string[] = []
  const errors: string[] = []
  let inFailSection = false

  for (const line of lines) {
    // === 5 passed, 2 failed, 1 error in 3.21s ===
    const summaryMatch = line.match(/=+\s*(.*?)\s+in\s+[\d.]+s?\s*=+/)
    if (summaryMatch) {
      const pMatch = summaryMatch[1].match(/(\d+)\s+passed/)
      const fMatch = summaryMatch[1].match(/(\d+)\s+failed/)
      const eMatch = summaryMatch[1].match(/(\d+)\s+error/)
      const sMatch = summaryMatch[1].match(/(\d+)\s+skipped/)
      if (pMatch) passed = parseInt(pMatch[1], 10)
      if (fMatch) failed = parseInt(fMatch[1], 10)
      if (eMatch) error = parseInt(eMatch[1], 10)
      if (sMatch) skipped = parseInt(sMatch[1], 10)
      continue
    }
    // FAILED test_foo.py::test_bar
    if (/^FAILED\s/.test(line.trim())) {
      failDetails.push(line.trim())
    }
    // __ FAILURES __
    if (/_{3,}\s*FAILURES\s*_{3,}/.test(line)) {
      inFailSection = true
      continue
    }
    if (inFailSection) {
      if (/^={3,}/.test(line.trim())) {
        inFailSection = false
      } else {
        errors.push(line)
      }
    }
  }

  const total = passed + failed + error + skipped
  if (total === 0) return null

  const status = (failed + error) > 0 ? '✗ FAIL' : '✓ PASS'
  const summary = `${status}: ${passed} passed, ${failed} failed, ${error} errors, ${skipped} skipped`

  return {
    summary,
    details: failDetails.slice(0, 20),
    errors: errors.slice(0, 20),
    warnings: [],
    stats: { passed, failed, error, skipped, total },
  }
}

// ---------------------------------------------------------------------------
// Go test
// ---------------------------------------------------------------------------

function parseGoTest(stdout: string): ParsedOutput | null {
  const lines = stdout.split('\n')
  let okCount = 0, failCount = 0
  const failDetails: string[] = []

  for (const line of lines) {
    if (/^ok\s+/.test(line.trim())) {
      okCount++
    } else if (/^FAIL\s+/.test(line.trim())) {
      failCount++
      failDetails.push(line.trim())
    } else if (/^---\s+FAIL:/.test(line.trim())) {
      failDetails.push(line.trim())
    }
  }

  if (okCount === 0 && failCount === 0) return null

  const status = failCount > 0 ? '✗ FAIL' : '✓ PASS'
  const summary = `${status}: ${okCount} ok, ${failCount} failed packages`

  return {
    summary,
    details: failDetails.slice(0, 20),
    errors: failDetails.slice(0, 10),
    warnings: [],
    stats: { ok: okCount, fail: failCount },
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function parseTestOutput(
  command: string,
  stdout: string,
  stderr: string,
): ParsedOutput | null {
  const cmd = command.toLowerCase()

  if (/\b(jest|vitest|bun\s+test)\b/.test(cmd)) {
    return parseJestVitest(stdout, stderr)
  }
  if (/\bpytest\b/.test(cmd)) {
    return parsePytest(stdout, stderr)
  }
  if (/\bgo\s+test\b/.test(cmd)) {
    return parseGoTest(stdout)
  }

  // Generic: try Jest/Vitest format (most common in JS ecosystem)
  const result = parseJestVitest(stdout, stderr)
  if (result) return result

  // Try Pytest format
  return parsePytest(stdout, stderr)
}
