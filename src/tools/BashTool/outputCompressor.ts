// Input: command + stdout/stderr/exitCode from BashTool execution
// Output: compressed output for LLM consumption (original preserved for user/debug)
// Pos: Post-processing layer in BashTool output pipeline
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { splitCommand_DEPRECATED } from '../../utils/bash/commands.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompressionResult {
  compressed: string       // 压缩后的输出（发送给 LLM）
  originalSize: number     // 原始字符数
  compressedSize: number   // 压缩后字符数
  savedPercent: number     // 节省百分比
  strategy: string         // 使用的策略名称
}

// ---------------------------------------------------------------------------
// Command extraction (reuses pattern from commandSemantics.ts)
// ---------------------------------------------------------------------------

function extractBaseCommand(command: string): string {
  return command.trim().split(/\s+/)[0] || ''
}

function heuristicallyExtractBaseCommand(command: string): string {
  const segments = splitCommand_DEPRECATED(command)
  const lastCommand = segments[segments.length - 1] || command
  return extractBaseCommand(lastCommand)
}

/** Extract all command names in a pipeline for matching purposes. */
function extractAllCommands(command: string): string[] {
  const segments = splitCommand_DEPRECATED(command)
  return segments.map(s => extractBaseCommand(s)).filter(Boolean)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MIN_COMPRESS_SIZE = 500
const SAVING_THRESHOLD = 0.20  // only apply if saving > 20%

function lines(s: string): string[] {
  return s.split('\n')
}

function buildResult(
  compressed: string,
  original: string,
  strategy: string,
): CompressionResult | null {
  const originalSize = original.length
  const compressedSize = compressed.length
  const savedPercent = originalSize > 0
    ? (originalSize - compressedSize) / originalSize
    : 0
  if (savedPercent < SAVING_THRESHOLD) return null
  return { compressed, originalSize, compressedSize, savedPercent, strategy }
}

// ---------------------------------------------------------------------------
// Strategy: git status
// ---------------------------------------------------------------------------

function compressGitStatus(stdout: string): string {
  const ls = lines(stdout)
  const kept: string[] = []

  for (const line of ls) {
    const trimmed = line.trim()
    // Keep branch info
    if (trimmed.startsWith('On branch ') || trimmed.startsWith('HEAD detached')) {
      kept.push(trimmed)
      continue
    }
    // Keep section headers (but skip help text)
    if (
      trimmed.startsWith('Changes to be committed:') ||
      trimmed.startsWith('Changes not staged') ||
      trimmed.startsWith('Untracked files:') ||
      trimmed.startsWith('Unmerged paths:') ||
      trimmed.startsWith('nothing to commit') ||
      trimmed.startsWith('no changes added') ||
      trimmed.startsWith('Your branch is')
    ) {
      kept.push(trimmed)
      continue
    }
    // Keep file entries (lines starting with tab or leading whitespace + status indicator)
    if (/^\s+(modified|new file|deleted|renamed|copied|both modified|typechange|unmerged):/.test(line)) {
      kept.push(line.trim())
      continue
    }
    // Keep untracked file entries (indented bare filenames under "Untracked files:")
    if (/^\t\S/.test(line)) {
      kept.push(line.trim())
      continue
    }
    // Skip help text like "use git restore..." / "use git add..."
  }
  return kept.join('\n')
}

// ---------------------------------------------------------------------------
// Strategy: git diff
// ---------------------------------------------------------------------------

function compressGitDiff(command: string, stdout: string): string {
  // If it's --stat, already compact
  if (/--stat/.test(command)) return stdout

  const LARGE_DIFF = 5000

  if (stdout.length > LARGE_DIFF) {
    return compressLargeDiff(stdout)
  }
  return compressDiffHunks(stdout)
}

function compressDiffHunks(stdout: string): string {
  const ls = lines(stdout)
  const out: string[] = []
  let unchangedRun = 0

  for (const line of ls) {
    // Always keep diff headers, hunk headers, +/- lines
    if (
      line.startsWith('diff ') ||
      line.startsWith('index ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ') ||
      line.startsWith('@@')
    ) {
      if (unchangedRun > 3) {
        out.push(`... (${unchangedRun} lines unchanged)`)
      }
      unchangedRun = 0
      out.push(line)
      continue
    }
    if (line.startsWith('+') || line.startsWith('-')) {
      if (unchangedRun > 3) {
        out.push(`... (${unchangedRun} lines unchanged)`)
      }
      unchangedRun = 0
      out.push(line)
      continue
    }
    // Context line (starts with space or is empty within a hunk)
    unchangedRun++
    if (unchangedRun <= 3) {
      out.push(line)
    }
  }
  if (unchangedRun > 3) {
    out.push(`... (${unchangedRun} lines unchanged)`)
  }
  return out.join('\n')
}

function compressLargeDiff(stdout: string): string {
  // Split into per-file diffs
  const fileDiffs: { header: string; body: string }[] = []
  const parts = stdout.split(/^(?=diff --)/m)

  for (const part of parts) {
    if (!part.trim()) continue
    const firstNewline = part.indexOf('\n')
    fileDiffs.push({
      header: part.slice(0, firstNewline),
      body: part,
    })
  }

  // Build a stat-like summary
  const statLines = fileDiffs.map(fd => {
    const plus = (fd.body.match(/^\+[^+]/gm) || []).length
    const minus = (fd.body.match(/^-[^-]/gm) || []).length
    const file = fd.header.replace('diff --git ', '').replace(/ b\/.*/, '').replace('a/', '')
    return `  ${file}: +${plus} -${minus}`
  })

  const summary = [`Diff summary (${fileDiffs.length} files):`]
  summary.push(...statLines)
  summary.push('')

  // Include detailed diff for first 3 files
  const detailed = fileDiffs.slice(0, 3).map(fd => compressDiffHunks(fd.body))
  if (fileDiffs.length > 3) {
    detailed.push(`\n... (${fileDiffs.length - 3} more files, see full output)`)
  }

  return [...summary, ...detailed].join('\n')
}

// ---------------------------------------------------------------------------
// Strategy: git log
// ---------------------------------------------------------------------------

function compressGitLog(stdout: string): string {
  // Parse commit entries
  const commitRegex = /^commit\s+([0-9a-f]+)/gm
  const commits: { hash: string; block: string }[] = []

  const parts = stdout.split(/^(?=commit [0-9a-f])/m)
  for (const part of parts) {
    if (!part.trim()) continue
    const match = part.match(/^commit\s+([0-9a-f]+)/)
    if (!match) continue
    commits.push({ hash: match[1], block: part })
  }

  if (commits.length <= 20) {
    // Compact each entry: keep hash(7) + first Author + Date + first message line
    return commits.map(c => compactLogEntry(c.block)).join('\n')
  }

  // Truncate: first 10 + gap + last 5
  const first = commits.slice(0, 10).map(c => compactLogEntry(c.block))
  const last = commits.slice(-5).map(c => compactLogEntry(c.block))
  return [
    ...first,
    `\n... (${commits.length - 15} more commits)\n`,
    ...last,
  ].join('\n')
}

function compactLogEntry(block: string): string {
  const ls = lines(block)
  const hashLine = ls[0] || ''
  const hash = hashLine.replace('commit ', '').slice(0, 7)

  let author = ''
  let date = ''
  let message = ''

  for (let i = 1; i < ls.length; i++) {
    const l = ls[i]
    if (l.startsWith('Author:') && !author) {
      author = l.replace('Author:', '').trim()
    } else if (l.startsWith('Date:') && !date) {
      date = l.replace('Date:', '').trim()
    } else if (l.trim() && !message && !l.startsWith('Merge:') && !l.startsWith('GPG') && !l.startsWith('gpg')) {
      message = l.trim()
    }
  }
  return `${hash} ${author} ${date} ${message}`
}

// ---------------------------------------------------------------------------
// Strategy: test runners
// ---------------------------------------------------------------------------

const TEST_PATTERNS = [
  /\btest\b/i, /\bjest\b/i, /\bvitest\b/i, /\bpytest\b/i,
  /\bcargo\s+test\b/i, /\bgo\s+test\b/i, /\bbun\s+test\b/i,
  /\bmocha\b/i, /\bava\b/i,
]

function isTestCommand(command: string): boolean {
  return TEST_PATTERNS.some(p => p.test(command))
}

function compressTestOutput(stdout: string): string {
  const ls = lines(stdout)

  // Detect pass/fail summary lines
  const summaryPatterns = [
    /Tests?:\s+\d+/i,
    /\d+\s+pass/i,
    /\d+\s+fail/i,
    /test result:/i,
    /Test Suites?:/i,
    /^(PASS|FAIL)\s/,
    /^ok\s+\d+/,          // TAP
    /passed|failed/i,
    /✓|✗|✘|×/,
  ]

  const failPatterns = [
    /FAIL/i,
    /\bfail(ed|ure|ing)?\b/i,
    /\berror\b/i,
    /✗|✘|×/,
    /AssertionError/i,
    /Expected.*Received/i,
    /●\s/,  // jest failure marker
  ]

  const hasFailed = ls.some(l => failPatterns.some(p => p.test(l)))

  if (!hasFailed) {
    // All passed — ultra compact
    const summaryLines = ls.filter(l => summaryPatterns.some(p => p.test(l)))
    if (summaryLines.length > 0) {
      return `✓ All tests passed\n${summaryLines.join('\n')}`
    }
    // Fallback: count test lines
    const testLines = ls.filter(l => /✓|pass|ok\s+\d+/i.test(l))
    return `✓ All ${testLines.length || '?'} tests passed`
  }

  // Has failures: keep failure details + summary, drop passing tests
  const kept: string[] = []
  let inFailBlock = false

  for (const line of ls) {
    // Summary lines always kept
    if (summaryPatterns.some(p => p.test(line))) {
      kept.push(line)
      continue
    }
    // Fail lines + context
    if (failPatterns.some(p => p.test(line))) {
      inFailBlock = true
      kept.push(line)
      continue
    }
    if (inFailBlock) {
      // Keep lines in failure context until empty line or next test
      if (line.trim() === '' || /^(PASS|✓)\s/.test(line)) {
        inFailBlock = false
        continue
      }
      kept.push(line)
      continue
    }
    // Skip passing test lines
  }

  // Extract coverage summary if present
  const covIdx = stdout.indexOf('---------|')
  if (covIdx >= 0) {
    const covLines = lines(stdout.slice(covIdx))
    // Keep header + "All files" row
    const allFiles = covLines.find(l => /All files/i.test(l))
    if (allFiles) {
      kept.push(`Coverage: ${allFiles.trim()}`)
    }
  }

  return kept.join('\n')
}

// ---------------------------------------------------------------------------
// Strategy: ls / find / tree
// ---------------------------------------------------------------------------

function compressLs(stdout: string): string {
  const ls = lines(stdout).filter(l => l.trim())
  if (ls.length <= 50) return stdout

  // Group by extension
  const extMap = new Map<string, number>()
  for (const line of ls) {
    const name = line.trim().split(/\s+/).pop() || ''
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '(no ext)'
    extMap.set(ext, (extMap.get(ext) || 0) + 1)
  }

  const groups = [...extMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([ext, count]) => `  ${ext}: ${count} files`)

  return [`${ls.length} files total:`, ...groups].join('\n')
}

function compressFind(stdout: string): string {
  const ls = lines(stdout).filter(l => l.trim())
  if (ls.length <= 30) return stdout

  // Group by parent directory
  const dirMap = new Map<string, number>()
  for (const line of ls) {
    const path = line.trim()
    const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '.'
    dirMap.set(dir, (dirMap.get(dir) || 0) + 1)
  }

  const groups = [...dirMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([dir, count]) => `  ${dir}: ${count} files`)

  const shown = groups.reduce((sum, g) => {
    const m = g.match(/(\d+) files/)
    return sum + (m ? parseInt(m[1]) : 0)
  }, 0)

  const result = [`${ls.length} files found:`]
  result.push(...groups)
  if (shown < ls.length) {
    result.push(`  ... and ${ls.length - shown} more in other directories`)
  }
  return result.join('\n')
}

function compressTree(stdout: string): string {
  const ls = lines(stdout)
  if (ls.length <= 30) return stdout

  // Keep first 2 depth levels + stats line at end
  const kept: string[] = []
  for (const line of ls) {
    // Depth is roughly indent / 4 (tree uses │ ├ └ etc.)
    const indent = line.search(/\S/)
    const depth = Math.floor(indent / 4)
    if (depth <= 2) {
      kept.push(line)
    }
  }
  // Last line is usually the summary "N directories, M files"
  const lastLine = ls[ls.length - 1]
  if (lastLine && /\d+\s+(director|file)/i.test(lastLine) && !kept.includes(lastLine)) {
    kept.push(lastLine)
  }

  if (kept.length < ls.length) {
    kept.push(`... (${ls.length - kept.length} deeper entries omitted)`)
  }
  return kept.join('\n')
}

// ---------------------------------------------------------------------------
// Strategy: npm/bun install
// ---------------------------------------------------------------------------

function compressInstall(stdout: string): string {
  const ls = lines(stdout)
  const kept: string[] = []

  // Keep summary lines
  for (const line of ls) {
    const trimmed = line.trim()
    if (
      /^(added|removed|updated|changed)\s+\d+/i.test(trimmed) ||
      /^(bun\s+install|bun\s+add)/i.test(trimmed) ||
      /packages?\s+installed/i.test(trimmed) ||
      /^(up to date|audited)/i.test(trimmed) ||
      /^\d+\s+packages?\s+are\s+looking/i.test(trimmed) ||
      /^(found|resolved)\s+\d+/i.test(trimmed) ||
      /^Done\b/i.test(trimmed) ||
      /\b(warn|error|ERR!)\b/i.test(trimmed) ||
      /vuln/i.test(trimmed)
    ) {
      kept.push(trimmed)
    }
  }

  if (kept.length === 0) {
    // Fallback: last non-empty line
    for (let i = ls.length - 1; i >= 0; i--) {
      if (ls[i].trim()) {
        kept.push(ls[i].trim())
        break
      }
    }
  }

  return kept.join('\n')
}

// ---------------------------------------------------------------------------
// Strategy: tsc / build
// ---------------------------------------------------------------------------

function compressTscBuild(stdout: string, exitCode: number): string {
  if (exitCode === 0 && stdout.length < 200) {
    return stdout.trim() || '✓ Build succeeded'
  }

  const ls = lines(stdout)
  const errors: string[] = []
  const warnings: string[] = []
  const other: string[] = []

  for (const line of ls) {
    if (/\berror\b\s*(TS\d+)?:/i.test(line)) {
      errors.push(line)
    } else if (/\bwarning\b\s*(TS\d+)?:/i.test(line)) {
      warnings.push(line)
    } else if (/^\s*Found\s+\d+\s+error/i.test(line) || /^✓|^✗|^Build/i.test(line)) {
      other.push(line)
    }
  }

  const kept: string[] = []
  kept.push(...errors)
  if (warnings.length > 3) {
    kept.push(...warnings.slice(0, 3))
    kept.push(`... (${warnings.length - 3} more warnings)`)
  } else {
    kept.push(...warnings)
  }
  kept.push(...other)

  if (kept.length === 0) return stdout // couldn't parse, return as-is
  return kept.join('\n')
}

// ---------------------------------------------------------------------------
// Strategy: generic script run (npm run / bun run)
// ---------------------------------------------------------------------------

function compressScriptRun(stdout: string): string {
  const ls = lines(stdout)
  // Identify important lines
  const important: string[] = []
  const rest: string[] = []

  for (const line of ls) {
    if (/\b(error|warn(ing)?|fail(ed|ure)?|exception|critical)\b/i.test(line)) {
      important.push(line)
    } else {
      rest.push(line)
    }
  }

  if (important.length > 0) {
    const kept = [...important]
    // Add first and last few lines of rest for context
    if (rest.length > 10) {
      kept.unshift(...rest.slice(0, 5))
      kept.push(`... (${rest.length - 8} lines omitted)`)
      kept.push(...rest.slice(-3))
    } else {
      kept.push(...rest)
    }
    return kept.join('\n')
  }

  // No important lines — use head/tail truncation
  return truncateHeadTail(stdout, 800, 400)
}

// ---------------------------------------------------------------------------
// Strategy: cat / head / tail (large file output)
// ---------------------------------------------------------------------------

function compressCatOutput(stdout: string): string {
  const ls = lines(stdout)
  if (ls.length <= 200) return stdout

  const head = ls.slice(0, 50)
  const tail = ls.slice(-20)
  return [
    ...head,
    `\n... (${ls.length - 70} lines omitted)\n`,
    ...tail,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Strategy: curl / wget
// ---------------------------------------------------------------------------

function compressCurlWget(stdout: string): string {
  const ls = lines(stdout)
  const kept: string[] = []

  for (const line of ls) {
    // Skip progress bars / download percentage lines
    if (/^\s*\d+\s+\d+\s+\d+\s+\d+/.test(line)) continue      // curl progress table
    if (/^\s*%\s+Total/.test(line)) continue                     // curl header
    if (/^\s*\d+%\s/.test(line)) continue                        // wget percentage
    if (/^#+\s*$/.test(line)) continue                            // progress bar
    if (/Dload|Upload|Speed/.test(line)) continue                 // curl speed table
    kept.push(line)
  }

  return kept.join('\n')
}

// ---------------------------------------------------------------------------
// Generic truncation helpers
// ---------------------------------------------------------------------------

function truncateHeadTail(text: string, headChars: number, tailChars: number): string {
  if (text.length <= headChars + tailChars + 100) return text
  const head = text.slice(0, headChars)
  const tail = text.slice(-tailChars)
  const omittedLines = lines(text.slice(headChars, -tailChars)).length
  return `${head}\n... (${omittedLines} lines omitted, full output saved)\n${tail}`
}

function lightCompress(text: string): string {
  // Remove consecutive blank lines (keep at most 1)
  let result = text.replace(/\n{3,}/g, '\n\n')
  // Compress consecutive whitespace within lines (tabs/spaces > 4 → 2 spaces)
  result = result.replace(/ {4,}/g, '  ')
  return result
}

// ---------------------------------------------------------------------------
// Strategy dispatcher
// ---------------------------------------------------------------------------

type StrategyFn = (
  command: string,
  stdout: string,
  stderr: string,
  exitCode: number,
) => { text: string; name: string } | null

const strategies: StrategyFn[] = [
  // 1. git status
  (cmd, stdout) => {
    if (/\bgit\b/.test(cmd) && /\bstatus\b/.test(cmd)) {
      return { text: compressGitStatus(stdout), name: 'git-status' }
    }
    return null
  },

  // 2. git diff
  (cmd, stdout) => {
    if (/\bgit\b/.test(cmd) && /\bdiff\b/.test(cmd)) {
      return { text: compressGitDiff(cmd, stdout), name: 'git-diff' }
    }
    return null
  },

  // 3. git log
  (cmd, stdout) => {
    if (/\bgit\b/.test(cmd) && /\blog\b/.test(cmd)) {
      return { text: compressGitLog(stdout), name: 'git-log' }
    }
    return null
  },

  // 4. test runners
  (cmd, stdout) => {
    if (isTestCommand(cmd)) {
      return { text: compressTestOutput(stdout), name: 'test-runner' }
    }
    return null
  },

  // 5. ls / find / tree
  (cmd, stdout) => {
    const base = heuristicallyExtractBaseCommand(cmd)
    if (base === 'ls' || base === 'dir') {
      return { text: compressLs(stdout), name: 'ls' }
    }
    if (base === 'find') {
      return { text: compressFind(stdout), name: 'find' }
    }
    if (base === 'tree') {
      return { text: compressTree(stdout), name: 'tree' }
    }
    return null
  },

  // 6. npm/bun install
  (cmd, stdout) => {
    if (/\b(npm|bun|yarn|pnpm)\s+(install|add|i|ci)\b/i.test(cmd)) {
      return { text: compressInstall(stdout), name: 'package-install' }
    }
    return null
  },

  // 7. tsc / build
  (cmd, stdout, _stderr, exitCode) => {
    const base = heuristicallyExtractBaseCommand(cmd)
    if (base === 'tsc' || /\b(build|compile)\b/.test(cmd)) {
      return { text: compressTscBuild(stdout, exitCode), name: 'tsc-build' }
    }
    return null
  },

  // 8. npm/bun run (generic script)
  (cmd, stdout) => {
    if (/\b(npm|bun|yarn|pnpm)\s+run\b/i.test(cmd)) {
      return { text: compressScriptRun(stdout), name: 'script-run' }
    }
    return null
  },

  // 9. cat / head / tail
  (cmd, stdout) => {
    const cmds = extractAllCommands(cmd)
    if (cmds.some(c => ['cat', 'head', 'tail'].includes(c))) {
      return { text: compressCatOutput(stdout), name: 'cat-head-tail' }
    }
    return null
  },

  // 10. curl / wget
  (cmd, stdout) => {
    const cmds = extractAllCommands(cmd)
    if (cmds.some(c => ['curl', 'wget'].includes(c))) {
      return { text: compressCurlWget(stdout), name: 'curl-wget' }
    }
    return null
  },
]

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Compress BashTool output for LLM consumption.
 *
 * Returns a CompressionResult if compression is worthwhile (>20% saving),
 * or null if the output should be sent as-is.
 *
 * This is a pure function with no side effects.
 */
export function compressBashOutput(
  command: string,
  stdout: string,
  stderr: string,
  exitCode: number,
): CompressionResult | null {
  // Don't compress small outputs
  if (stdout.length < MIN_COMPRESS_SIZE) return null

  // Don't compress empty stdout (stderr-only outputs are already small)
  if (!stdout.trim()) return null

  // Try command-specific strategies
  for (const strategy of strategies) {
    const result = strategy(command, stdout, stderr, exitCode)
    if (result) {
      // Append stderr if present (compressed strategies may lose it)
      let compressed = result.text
      if (stderr && stderr.trim()) {
        compressed += `\n[stderr]: ${stderr.trim()}`
      }
      const cr = buildResult(compressed, stdout, result.name)
      if (cr) return cr
      // Strategy matched but saving < threshold — fall through to generic
      break
    }
  }

  // Generic fallback
  if (stdout.length < 2000) {
    const compressed = lightCompress(stdout)
    return buildResult(compressed, stdout, 'light-compress')
  }

  // Heavy truncation for large output
  const compressed = truncateHeadTail(stdout, 800, 400)
  return buildResult(compressed, stdout, 'head-tail-truncate')
}
