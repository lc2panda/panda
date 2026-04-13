// Input: 工具名 + 工具输出文本 + 可选工具输入参数
// Output: 压缩后的输出结果（或 null 不压缩）
// Pos: 工具结果返回管线，在 processToolResultBlock 中对 Read/Grep/Glob 工具输出压缩
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { recordCompression } from '../tools/BashTool/compressionStats.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolCompressionResult {
  compressed: string
  originalSize: number
  compressedSize: number
  savedPercent: number
  toolName: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAVING_THRESHOLD = 0.15  // Only apply if saving > 15%

// Read tool thresholds (line count based)
const READ_NO_COMPRESS_LINES = 500
const READ_MEDIUM_LINES = 2000
const READ_MEDIUM_HEAD = 100
const READ_MEDIUM_TAIL = 50
const READ_LARGE_HEAD = 80
const READ_LARGE_TAIL = 30

// Grep tool thresholds (match count based)
const GREP_NO_COMPRESS_MATCHES = 20
const GREP_MEDIUM_MATCHES = 100
const GREP_MEDIUM_KEEP_PER_FILE = 3
const GREP_LARGE_DETAIL_FILES = 5

// Glob tool thresholds (file count based)
const GLOB_NO_COMPRESS_FILES = 30
const GLOB_MEDIUM_FILES = 100

// ---------------------------------------------------------------------------
// Structure detection for Read tool
// ---------------------------------------------------------------------------

const STRUCTURE_PATTERNS = [
  /^export\s+(default\s+)?(function|class|interface|type|const|let|var|enum|abstract)\s/,
  /^(export\s+)?function\s+\w/,
  /^(export\s+)?class\s+\w/,
  /^(export\s+)?interface\s+\w/,
  /^(export\s+)?type\s+\w/,
  /^(export\s+)?const\s+\w/,
  /^(export\s+)?enum\s+\w/,
  /^(export\s+)?abstract\s+class\s+\w/,
  /^def\s+\w/,             // Python
  /^class\s+\w/,           // Python/Ruby
  /^func\s+\w/,            // Go
  /^pub\s+(fn|struct|enum|trait|impl)\s/,  // Rust
]

function extractStructureSignatures(lines: string[]): string[] {
  const signatures: string[] = []
  for (const line of lines) {
    const trimmed = line.replace(/^\s*\d+\t/, '').trim()  // strip line numbers
    if (STRUCTURE_PATTERNS.some(p => p.test(trimmed))) {
      // Keep first 120 chars of the signature
      signatures.push(trimmed.slice(0, 120))
    }
  }
  return signatures
}

// ---------------------------------------------------------------------------
// Read tool compression
// ---------------------------------------------------------------------------

function compressReadOutput(output: string): ToolCompressionResult | null {
  const lines = output.split('\n')
  const lineCount = lines.length

  if (lineCount < READ_NO_COMPRESS_LINES) return null

  let compressed: string

  if (lineCount <= READ_MEDIUM_LINES) {
    // Medium: head + tail + fold
    const head = lines.slice(0, READ_MEDIUM_HEAD)
    const tail = lines.slice(-READ_MEDIUM_TAIL)
    const omitted = lineCount - READ_MEDIUM_HEAD - READ_MEDIUM_TAIL
    compressed = [
      ...head,
      `\n... (${omitted} lines omitted, use offset/limit to read specific sections)\n`,
      ...tail,
    ].join('\n')
  } else {
    // Large: head + tail + structure summary
    const head = lines.slice(0, READ_LARGE_HEAD)
    const tail = lines.slice(-READ_LARGE_TAIL)
    const omitted = lineCount - READ_LARGE_HEAD - READ_LARGE_TAIL
    const signatures = extractStructureSignatures(lines)

    const parts = [...head]
    parts.push(`\n... (${omitted} lines omitted, use offset/limit to read specific sections)`)

    if (signatures.length > 0) {
      parts.push('')
      parts.push(`[Structure index: ${signatures.length} definitions found]`)
      // Show up to 30 signatures
      const shown = signatures.slice(0, 30)
      for (const sig of shown) {
        parts.push(`  ${sig}`)
      }
      if (signatures.length > 30) {
        parts.push(`  ... (${signatures.length - 30} more definitions)`)
      }
      parts.push('')
    }

    parts.push(...tail)
    compressed = parts.join('\n')
  }

  return buildResult(compressed, output, 'Read')
}

// ---------------------------------------------------------------------------
// Grep tool compression
// ---------------------------------------------------------------------------

interface GrepFileGroup {
  file: string
  matches: string[]
}

function parseGrepContentOutput(output: string): GrepFileGroup[] | null {
  const lines = output.split('\n')
  const groups: GrepFileGroup[] = []
  let current: GrepFileGroup | null = null

  for (const line of lines) {
    // ripgrep content mode: "filepath:linenum:content" or "filepath-linenum-content"
    const match = line.match(/^(.+?)[:|-](\d+)[:|-]/)
    if (match) {
      const file = match[1]
      if (!current || current.file !== file) {
        current = { file, matches: [] }
        groups.push(current)
      }
      current.matches.push(line)
    } else if (line.startsWith('--') || line.trim() === '') {
      // separator or blank line — skip
    } else if (current) {
      // Context line without file prefix (continuation)
      current.matches.push(line)
    }
  }

  return groups.length > 0 ? groups : null
}

function compressGrepOutput(output: string): ToolCompressionResult | null {
  // Count total matches (rough: non-empty, non-separator lines)
  const allLines = output.split('\n').filter(l => l.trim() && l !== '--')
  const totalMatches = allLines.length

  if (totalMatches < GREP_NO_COMPRESS_MATCHES) return null

  const groups = parseGrepContentOutput(output)
  if (!groups) return null

  const totalFiles = groups.length
  const parts: string[] = []

  parts.push(`[${totalMatches} matches across ${totalFiles} files]`)
  parts.push('')

  if (totalMatches <= GREP_MEDIUM_MATCHES) {
    // Medium: per-file grouping, keep first N matches per file
    for (const group of groups) {
      const kept = group.matches.slice(0, GREP_MEDIUM_KEEP_PER_FILE)
      parts.push(...kept)
      if (group.matches.length > GREP_MEDIUM_KEEP_PER_FILE) {
        parts.push(`  ... (${group.matches.length - GREP_MEDIUM_KEEP_PER_FILE} more matches in ${group.file})`)
      }
    }
  } else {
    // Large: detailed for first N files, summary for rest
    const detailed = groups.slice(0, GREP_LARGE_DETAIL_FILES)
    const summary = groups.slice(GREP_LARGE_DETAIL_FILES)

    for (const group of detailed) {
      const kept = group.matches.slice(0, GREP_MEDIUM_KEEP_PER_FILE)
      parts.push(...kept)
      if (group.matches.length > GREP_MEDIUM_KEEP_PER_FILE) {
        parts.push(`  ... (${group.matches.length - GREP_MEDIUM_KEEP_PER_FILE} more matches in ${group.file})`)
      }
    }

    if (summary.length > 0) {
      parts.push('')
      parts.push(`[${summary.length} more files with matches:]`)
      for (const group of summary) {
        parts.push(`  ${group.file}: ${group.matches.length} matches`)
      }
    }
  }

  return buildResult(parts.join('\n'), output, 'Grep')
}

// ---------------------------------------------------------------------------
// Glob tool compression
// ---------------------------------------------------------------------------

function compressGlobOutput(output: string): ToolCompressionResult | null {
  const lines = output.split('\n').filter(l => l.trim())

  // Check if it starts with "Found N files" — files_with_matches mode
  // or is a raw list of files
  const fileLines = lines.filter(l =>
    !l.startsWith('Found ') &&
    !l.startsWith('(Results are truncated')
  )

  if (fileLines.length < GLOB_NO_COMPRESS_FILES) return null

  // Group by directory
  const dirMap = new Map<string, { count: number; exts: Map<string, number> }>()

  for (const line of fileLines) {
    const filePath = line.trim()
    const lastSlash = filePath.lastIndexOf('/')
    const dir = lastSlash >= 0 ? filePath.slice(0, lastSlash) : '.'
    const ext = filePath.includes('.') ? filePath.slice(filePath.lastIndexOf('.')) : '(no ext)'

    if (!dirMap.has(dir)) {
      dirMap.set(dir, { count: 0, exts: new Map() })
    }
    const entry = dirMap.get(dir)!
    entry.count++
    entry.exts.set(ext, (entry.exts.get(ext) || 0) + 1)
  }

  const parts: string[] = []
  // Preserve the header line if present
  const headerLine = lines.find(l => l.startsWith('Found '))
  if (headerLine) parts.push(headerLine)
  else parts.push(`${fileLines.length} files found`)

  parts.push('')

  if (fileLines.length <= GLOB_MEDIUM_FILES) {
    // Medium: group by directory with extension breakdown
    const sortedDirs = [...dirMap.entries()].sort((a, b) => b[1].count - a[1].count)

    for (const [dir, info] of sortedDirs) {
      const extBreakdown = [...info.exts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([ext, count]) => `${ext}: ${count}`)
        .join(', ')
      parts.push(`  ${dir}/: ${info.count} files (${extBreakdown})`)
    }
  } else {
    // Large: top-level directory grouping only
    const topDirMap = new Map<string, number>()
    for (const [dir, info] of dirMap) {
      const topDir = dir.split('/').slice(0, 2).join('/')
      topDirMap.set(topDir, (topDirMap.get(topDir) || 0) + info.count)
    }

    const sortedTopDirs = [...topDirMap.entries()].sort((a, b) => b[1] - a[1])
    for (const [dir, count] of sortedTopDirs) {
      parts.push(`  ${dir}/: ${count} files`)
    }
  }

  // Preserve truncation notice if present
  const truncNotice = lines.find(l => l.startsWith('(Results are truncated'))
  if (truncNotice) {
    parts.push('')
    parts.push(truncNotice)
  }

  return buildResult(parts.join('\n'), output, 'Glob')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildResult(
  compressed: string,
  original: string,
  toolName: string,
): ToolCompressionResult | null {
  const originalSize = original.length
  const compressedSize = compressed.length
  const savedPercent = originalSize > 0
    ? (originalSize - compressedSize) / originalSize
    : 0

  if (savedPercent < SAVING_THRESHOLD) return null

  return { compressed, originalSize, compressedSize, savedPercent, toolName }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Compress tool output for LLM consumption.
 *
 * Handles Read, Grep, and Glob tool outputs with tool-specific strategies.
 * Returns a ToolCompressionResult if compression is worthwhile (>15% saving),
 * or null if the output should be sent as-is.
 *
 * Records compression stats via B4's recordCompression.
 */
export function compressToolOutput(
  toolName: string,
  output: string,
  _toolInput?: Record<string, unknown>,
): ToolCompressionResult | null {
  let result: ToolCompressionResult | null = null

  switch (toolName) {
    case 'Read':
      result = compressReadOutput(output)
      break
    case 'Grep':
      result = compressGrepOutput(output)
      break
    case 'Glob':
      result = compressGlobOutput(output)
      break
    default:
      return null
  }

  // B4: Record compression stats
  if (result) {
    recordCompression({
      command: `[${toolName}]`,
      originalChars: result.originalSize,
      compressedChars: result.compressedSize,
      savedChars: result.originalSize - result.compressedSize,
      savedPercent: result.savedPercent,
      strategy: `tool-${toolName.toLowerCase()}`,
    })
  }

  return result
}
