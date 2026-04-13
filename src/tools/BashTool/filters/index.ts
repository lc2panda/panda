// Input: command + stdout, 规则配置 (JSON 声明式)
// Output: 过滤后的输出 (string | null)
// Pos: outputCompressor 的可扩展规则层，硬编码策略之前执行
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterRule {
  match: string          // 正则表达式字符串
  action: 'remove' | 'keep' | 'group' | 'truncate' | 'dedup'
  params?: {
    maxLines?: number    // truncate 用
    groupBy?: string     // group 用（正则捕获组）
    keepFirst?: number   // dedup 用
  }
}

export interface CommandFilter {
  command: string | string[]    // 命令名/别名
  description: string           // 规则说明
  minOutputLines?: number       // 最少多少行才应用（默认 10）
  rules: FilterRule[]           // 顺序执行的规则列表
}

// ---------------------------------------------------------------------------
// Built-in rules (imported at build time, zero runtime IO)
// ---------------------------------------------------------------------------

import gitRules from './rules/git.json'
import pkgRules from './rules/package-managers.json'
import buildRules from './rules/build.json'
import testRules from './rules/test-runners.json'
import systemRules from './rules/system.json'

const BUILTIN_RULES: CommandFilter[] = [
  ...(gitRules as CommandFilter[]),
  ...(pkgRules as CommandFilter[]),
  ...(buildRules as CommandFilter[]),
  ...(testRules as CommandFilter[]),
  ...(systemRules as CommandFilter[]),
]

// ---------------------------------------------------------------------------
// User rules loader (runtime IO, project-level .pandacc/filters/*.json)
// ---------------------------------------------------------------------------

let userRulesCache: CommandFilter[] | null = null

function loadUserRules(): CommandFilter[] {
  if (userRulesCache !== null) return userRulesCache

  const userDir = resolve(process.cwd(), '.pandacc', 'filters')
  if (!existsSync(userDir)) {
    userRulesCache = []
    return userRulesCache
  }

  const rules: CommandFilter[] = []
  try {
    const files = readdirSync(userDir).filter(f => f.endsWith('.json'))
    for (const file of files) {
      try {
        const content = readFileSync(join(userDir, file), 'utf-8')
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          rules.push(...(parsed as CommandFilter[]))
        }
      } catch {
        // Skip malformed rule files silently
      }
    }
  } catch {
    // Directory read error — no user rules
  }

  userRulesCache = rules
  return userRulesCache
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load all filter rules: user rules (higher priority) + built-in rules.
 * Built-in rules are inlined at build time. User rules are read from
 * `.pandacc/filters/*.json` at runtime (cached after first load).
 */
export function loadFilters(): CommandFilter[] {
  const userRules = loadUserRules()
  // User rules first → higher priority (matched first)
  return [...userRules, ...BUILTIN_RULES]
}

/**
 * Invalidate the user rules cache. Useful if CWD changes or rules files
 * are edited mid-session.
 */
export function invalidateFilterCache(): void {
  userRulesCache = null
}

/**
 * Apply declarative filter rules to command output.
 *
 * Returns the filtered string if rules matched and produced output,
 * or null if no rules matched (caller should fall back to hardcoded strategies).
 */
export function applyFilters(
  command: string,
  output: string,
  filters: CommandFilter[],
): string | null {
  const outputLines = output.split('\n')

  // Find first matching filter
  const filter = findMatchingFilter(command, filters)
  if (!filter) return null

  // Check minOutputLines threshold
  const minLines = filter.minOutputLines ?? 10
  if (outputLines.length < minLines) return null

  // Execute rules with two-pass semantics:
  // Pass 1: collect 'keep'-marked lines (always preserved)
  // Pass 2: apply remove/group/truncate/dedup on remaining lines
  // Final: merge keep-marked + surviving lines (preserving original order)
  const keepIndices = new Set<number>()
  const keepRules = filter.rules.filter(r => r.action === 'keep')
  const otherRules = filter.rules.filter(r => r.action !== 'keep')

  // Mark lines that match any 'keep' rule — these always survive
  for (const rule of keepRules) {
    const regex = compileRegex(rule.match)
    if (!regex) continue
    for (let i = 0; i < outputLines.length; i++) {
      if (regex.test(outputLines[i])) {
        keepIndices.add(i)
      }
    }
  }

  // Apply non-keep rules sequentially on all lines
  let resultLines = [...outputLines]
  for (const rule of otherRules) {
    resultLines = executeRule(rule, resultLines)
  }

  // Re-inject any keep-marked lines that were accidentally removed
  const resultSet = new Set(resultLines)
  for (const idx of keepIndices) {
    const line = outputLines[idx]
    if (!resultSet.has(line)) {
      resultLines.push(line)
    }
  }

  // Safety net: if rules produced empty output, return null (fall through to next layer)
  const trimmed = resultLines.join('\n').trim()
  if (!trimmed) return null

  return resultLines.join('\n')
}

// ---------------------------------------------------------------------------
// Command matching
// ---------------------------------------------------------------------------

function normalizeCommand(cmd: string): string {
  return cmd.trim().toLowerCase()
}

function findMatchingFilter(
  command: string,
  filters: CommandFilter[],
): CommandFilter | null {
  const normCmd = normalizeCommand(command)

  for (const filter of filters) {
    const patterns = Array.isArray(filter.command)
      ? filter.command
      : [filter.command]

    for (const pattern of patterns) {
      const normPattern = normalizeCommand(pattern)
      // Match if the command starts with the pattern, or contains it
      // e.g. "git status --short" matches "git status"
      // e.g. "npm install --save lodash" matches "npm install"
      if (normCmd.startsWith(normPattern) || normCmd.includes(normPattern)) {
        return filter
      }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Rule execution
// ---------------------------------------------------------------------------

function compileRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern)
  } catch {
    return null
  }
}

function executeRule(rule: FilterRule, inputLines: string[]): string[] {
  const regex = compileRegex(rule.match)
  if (!regex) return inputLines // Invalid regex → skip rule

  switch (rule.action) {
    case 'remove':
      return executeRemove(regex, inputLines)
    case 'keep':
      return executeKeep(regex, inputLines)
    case 'group':
      return executeGroup(regex, rule.params, inputLines)
    case 'truncate':
      return executeTruncate(regex, rule.params, inputLines)
    case 'dedup':
      return executeDedup(regex, rule.params, inputLines)
    default:
      return inputLines
  }
}

/**
 * Remove: delete all lines matching the regex.
 */
function executeRemove(regex: RegExp, inputLines: string[]): string[] {
  return inputLines.filter(line => !regex.test(line))
}

/**
 * Keep: retain only lines matching the regex.
 * Non-matching lines are dropped.
 */
function executeKeep(regex: RegExp, inputLines: string[]): string[] {
  return inputLines.filter(line => regex.test(line))
}

/**
 * Group: group matching lines by a capture group, outputting
 * "{groupValue}: {count} lines" for each group. Non-matching lines
 * are passed through unchanged.
 */
function executeGroup(
  regex: RegExp,
  params: FilterRule['params'],
  inputLines: string[],
): string[] {
  const groupByRegex = params?.groupBy ? compileRegex(params.groupBy) : null
  const groupKey = groupByRegex || regex

  const result: string[] = []
  const groups = new Map<string, number>()
  let inGroup = false

  for (const line of inputLines) {
    if (regex.test(line)) {
      const keyMatch = line.match(groupKey)
      const key = keyMatch?.[1] || keyMatch?.[0] || 'other'
      groups.set(key, (groups.get(key) || 0) + 1)
      inGroup = true
    } else {
      if (inGroup && groups.size > 0) {
        // Flush accumulated groups
        for (const [key, count] of groups) {
          result.push(`${key}: ${count} lines`)
        }
        groups.clear()
        inGroup = false
      }
      result.push(line)
    }
  }

  // Flush remaining groups
  if (groups.size > 0) {
    for (const [key, count] of groups) {
      result.push(`${key}: ${count} lines`)
    }
  }

  return result
}

/**
 * Truncate: once the first matching line is found, keep at most
 * `maxLines` total lines from that point. Non-matching prefix lines
 * are kept. If the matching section exceeds maxLines, append a
 * truncation notice.
 */
function executeTruncate(
  regex: RegExp,
  params: FilterRule['params'],
  inputLines: string[],
): string[] {
  const maxLines = params?.maxLines ?? 20
  const result: string[] = []
  let matchCount = 0
  let truncated = 0
  let inMatchZone = false

  for (const line of inputLines) {
    if (regex.test(line)) {
      inMatchZone = true
    }

    if (inMatchZone) {
      matchCount++
      if (matchCount <= maxLines) {
        result.push(line)
      } else {
        truncated++
      }
    } else {
      result.push(line)
    }
  }

  if (truncated > 0) {
    result.push(`... (${truncated} more lines truncated)`)
  }

  return result
}

/**
 * Dedup: collapse adjacent lines that match the regex AND have
 * identical content. Keep the first `keepFirst` (default 1) occurrence,
 * then replace the rest with a count summary.
 */
function executeDedup(
  regex: RegExp,
  params: FilterRule['params'],
  inputLines: string[],
): string[] {
  const keepFirst = params?.keepFirst ?? 1
  const result: string[] = []
  let prevLine: string | null = null
  let dupCount = 0
  let keptCount = 0

  for (const line of inputLines) {
    if (regex.test(line) && line === prevLine) {
      dupCount++
      keptCount++
      if (keptCount <= keepFirst) {
        result.push(line)
      }
    } else {
      if (dupCount > keepFirst) {
        result.push(`... (${dupCount - keepFirst} duplicate lines removed)`)
      }
      result.push(line)
      prevLine = regex.test(line) ? line : null
      dupCount = regex.test(line) ? 1 : 0
      keptCount = regex.test(line) ? 1 : 0
    }
  }

  if (dupCount > keepFirst) {
    result.push(`... (${dupCount - keepFirst} duplicate lines removed)`)
  }

  return result
}
