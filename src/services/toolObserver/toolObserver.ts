// Input: 工具执行的 name, input, output, duration
// Output: JSONL 格式观察日志文件（追加写入）
// Pos: toolExecution PostToolUse 管线末端，fire-and-forget
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { appendFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getOriginalCwd } from '../../bootstrap/state.js'
import { getProjectDir } from '../../utils/sessionStorage.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolObservation {
  ts: string                  // ISO 8601
  tool: string                // 工具名
  inputSummary: string        // 输入摘要 ≤100 字符
  outputSummary: string       // 输出摘要 ≤200 字符
  exitCode?: number           // 仅 Bash
  durationMs: number
  hadError: boolean
}

// ---------------------------------------------------------------------------
// Which tools to observe (side-effect-producing only)
// ---------------------------------------------------------------------------

export const OBSERVABLE_TOOLS = new Set([
  'Bash',
  'FileEditTool',
  'FileWriteTool',
  'NotebookEditTool',
])

// ---------------------------------------------------------------------------
// Dedup / rate limit: same tool + same input within 5s → skip
// ---------------------------------------------------------------------------

const recentKeys = new Map<string, number>()  // key → timestamp ms
const DEDUP_WINDOW_MS = 5000

function isDuplicate(tool: string, inputSummary: string): boolean {
  const key = `${tool}:${inputSummary}`
  const now = Date.now()
  const last = recentKeys.get(key)
  if (last && now - last < DEDUP_WINDOW_MS) {
    return true
  }
  recentKeys.set(key, now)

  // Prune old entries to avoid unbounded growth
  if (recentKeys.size > 200) {
    for (const [k, t] of recentKeys) {
      if (now - t > DEDUP_WINDOW_MS) recentKeys.delete(k)
    }
  }
  return false
}

// ---------------------------------------------------------------------------
// File path resolution
// ---------------------------------------------------------------------------

let dirEnsured = false

function getObservationDir(): string {
  const projectDir = getProjectDir(getOriginalCwd())
  return join(projectDir, 'memory', 'working')
}

function getObservationPath(): string {
  const dir = getObservationDir()
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return join(dir, `observations-${date}.jsonl`)
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Record a tool observation to JSONL file. Fire-and-forget — caller should
 * `void recordToolObservation(...).catch(() => {})`.
 */
export async function recordToolObservation(
  observation: ToolObservation,
): Promise<void> {
  // Rate-limit dedup
  if (isDuplicate(observation.tool, observation.inputSummary)) return

  const filePath = getObservationPath()

  // Ensure directory exists (once per session)
  if (!dirEnsured) {
    await mkdir(getObservationDir(), { recursive: true })
    dirEnsured = true
  }

  const line = JSON.stringify(observation) + '\n'
  await appendFile(filePath, line, 'utf-8')
}

// ---------------------------------------------------------------------------
// Summarizers
// ---------------------------------------------------------------------------

/**
 * Summarize tool input to ≤100 characters for observation log.
 */
export function summarizeInput(
  toolName: string,
  input: Record<string, any>,
): string {
  switch (toolName) {
    case 'Bash': {
      const cmd = String(input.command || '').trim()
      return cmd.length > 100 ? cmd.slice(0, 97) + '...' : cmd
    }
    case 'FileEditTool': {
      const fp = String(input.file_path || '')
      return `Edit ${fp}`.slice(0, 100)
    }
    case 'FileWriteTool': {
      const fp = String(input.file_path || '')
      const size = String(input.content || '').length
      return `Write ${fp} (${size} chars)`.slice(0, 100)
    }
    case 'NotebookEditTool': {
      const fp = String(input.notebook_path || '')
      return `NotebookEdit ${fp}`.slice(0, 100)
    }
    default:
      return `${toolName} call`.slice(0, 100)
  }
}

/**
 * Summarize tool output to ≤200 characters for observation log.
 */
export function summarizeOutput(
  toolName: string,
  output: string,
): string {
  if (!output) return '(empty)'

  switch (toolName) {
    case 'Bash': {
      const trimmed = output.trim()
      return trimmed.length > 200 ? trimmed.slice(0, 197) + '...' : trimmed
    }
    case 'FileEditTool': {
      // Attempt to extract edit summary
      if (output.includes('Applied')) {
        const match = output.match(/Applied \d+ edit/)
        if (match) return match[0]
      }
      return output.slice(0, 200)
    }
    case 'FileWriteTool': {
      const match = output.match(/(\d+) bytes/)
      if (match) return `Written ${match[1]} bytes`
      return output.slice(0, 200)
    }
    default:
      return output.slice(0, 200)
  }
}
