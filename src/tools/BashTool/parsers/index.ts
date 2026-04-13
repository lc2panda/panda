// Input: shell 命令 + stdout/stderr 输出
// Output: 结构化解析结果 (ParsedOutput | null)
// Pos: BashTool/parsers/ 命令输出智能解析器注册表
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { parseGitOutput } from './git.js'
import { parseTestOutput } from './test.js'
import { parseBuildOutput } from './build.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedOutput {
  summary: string                // 一行摘要
  details: string[]              // 关键细节行
  errors: string[]               // 错误行
  warnings: string[]             // 警告行
  stats: Record<string, number>  // 统计键值对
}

// ---------------------------------------------------------------------------
// Parser registry
// ---------------------------------------------------------------------------

interface ParserEntry {
  match: RegExp
  parse: (command: string, stdout: string, stderr: string) => ParsedOutput | null
}

const parsers: ParserEntry[] = [
  {
    match: /\bgit\b/,
    parse: parseGitOutput,
  },
  {
    match: /\b(jest|vitest|pytest|bun\s+test|go\s+test|mocha|ava|cargo\s+test)\b/i,
    parse: parseTestOutput,
  },
  {
    match: /\b(tsc|webpack|vite|esbuild|rollup|parcel|turbopack|build|compile)\b/i,
    parse: parseBuildOutput,
  },
]

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse command output into a structured result.
 *
 * Returns ParsedOutput if a parser recognized the command and could
 * extract structured information, or null if no parser matched / parsing
 * was not possible.
 *
 * Used by outputCompressor.ts as an enhancement layer — when available,
 * the structured summary replaces generic compression.
 */
export function parseCommandOutput(
  command: string,
  stdout: string,
  stderr: string,
): ParsedOutput | null {
  for (const parser of parsers) {
    if (parser.match.test(command)) {
      const result = parser.parse(command, stdout, stderr)
      if (result) return result
    }
  }
  return null
}

/**
 * Format a ParsedOutput into a compressed text representation
 * suitable for LLM consumption.
 */
export function formatParsedOutput(parsed: ParsedOutput): string {
  const parts: string[] = []

  // Summary line
  parts.push(`[${parsed.summary}]`)

  // Stats
  if (Object.keys(parsed.stats).length > 0) {
    const statsStr = Object.entries(parsed.stats)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    parts.push(`Stats: ${statsStr}`)
  }

  // Errors (high priority)
  if (parsed.errors.length > 0) {
    parts.push('')
    parts.push(`Errors (${parsed.errors.length}):`)
    for (const err of parsed.errors.slice(0, 15)) {
      parts.push(err)
    }
    if (parsed.errors.length > 15) {
      parts.push(`... (${parsed.errors.length - 15} more errors)`)
    }
  }

  // Warnings
  if (parsed.warnings.length > 0) {
    parts.push('')
    parts.push(`Warnings (${parsed.warnings.length}):`)
    for (const w of parsed.warnings.slice(0, 5)) {
      parts.push(w)
    }
    if (parsed.warnings.length > 5) {
      parts.push(`... (${parsed.warnings.length - 5} more warnings)`)
    }
  }

  // Details (when no errors/warnings)
  if (parsed.errors.length === 0 && parsed.details.length > 0) {
    parts.push('')
    for (const d of parsed.details.slice(0, 20)) {
      parts.push(d)
    }
    if (parsed.details.length > 20) {
      parts.push(`... (${parsed.details.length - 20} more details)`)
    }
  }

  return parts.join('\n')
}
