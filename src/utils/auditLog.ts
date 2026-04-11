// Input: tool invocation events from permission/tool dispatch system
// Output: append-only JSONL audit trail at ~/.pandacc/audit.jsonl
// Pos: defensive layer for compliance and forensic traceability

import { homedir } from 'os'
import { join } from 'path'
import { mkdirSync, appendFileSync, existsSync, readFileSync, writeFileSync, statSync } from 'fs'
import { createHash } from 'crypto'

const AUDIT_PATH = join(homedir(), '.pandacc', 'audit.jsonl')
const RETENTION_DAYS = 30
const MAX_LINE_LENGTH = 4096  // 单行 audit 条目最大字节数，防止失控

export type ToolRiskLevel = 'read-only' | 'low-write' | 'high-write' | 'destructive'

export type PermissionDecision = 'auto-allowed' | 'user-allowed' | 'user-denied' | 'auto-denied' | 'unknown'

export type ToolOutcome = 'success' | 'failure' | 'cancelled' | 'unknown'

export interface AuditEntry {
  timestamp: string
  session_id: string
  tool_name: string
  args_hash: string
  risk_level: ToolRiskLevel
  permission_decision: PermissionDecision
  outcome: ToolOutcome
  duration_ms?: number
  error_brief?: string
}

/**
 * 写一条审计记录。append-only，无锁，crash-safe（appendFileSync 单行原子）。
 */
export function writeAuditEntry(entry: Omit<AuditEntry, 'timestamp'>): void {
  try {
    const fullEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    }

    const line = JSON.stringify(fullEntry)
    if (line.length > MAX_LINE_LENGTH) {
      // 截断 error_brief 避免单行失控
      const truncated = { ...fullEntry, error_brief: (fullEntry.error_brief || '').slice(0, 200) }
      const truncatedLine = JSON.stringify(truncated)
      writeAuditLine(truncatedLine)
    } else {
      writeAuditLine(line)
    }
  } catch {
    // 审计日志失败不能影响主流程
  }
}

function writeAuditLine(line: string): void {
  try {
    mkdirSync(join(homedir(), '.pandacc'), { recursive: true })
    appendFileSync(AUDIT_PATH, line + '\n', 'utf-8')
  } catch {}
}

/**
 * 计算参数哈希（隐私友好，不存原始参数内容）。
 */
export function hashArgs(args: unknown): string {
  try {
    const str = typeof args === 'string' ? args : JSON.stringify(args)
    return createHash('sha256').update(str).digest('hex').slice(0, 16)
  } catch {
    return 'unknown'
  }
}

/**
 * 工具风险等级映射（按 tool name 推断）。
 */
const RISK_BY_TOOL: Record<string, ToolRiskLevel> = {
  Read: 'read-only',
  Glob: 'read-only',
  Grep: 'read-only',
  ToolSearch: 'read-only',
  WebFetch: 'read-only',
  WebSearch: 'read-only',
  TaskList: 'read-only',
  TaskGet: 'read-only',
  Write: 'low-write',
  Edit: 'low-write',
  NotebookEdit: 'low-write',
  TaskCreate: 'low-write',
  TaskUpdate: 'low-write',
  Bash: 'high-write',  // 默认 high-write，destructive 命令需用 detectDestructive 升级
  Skill: 'high-write',
  Agent: 'high-write',
  RemoteTrigger: 'high-write',
  TeamCreate: 'high-write',
  TeamDelete: 'destructive',
  CronCreate: 'low-write',
  CronDelete: 'destructive',
}

export function inferRiskLevel(toolName: string, args?: unknown): ToolRiskLevel {
  const baseLevel = RISK_BY_TOOL[toolName] || 'low-write'

  // Bash 升级检测：destructive 命令模式
  if (toolName === 'Bash' && typeof args === 'object' && args !== null) {
    const cmd = (args as { command?: string }).command || ''
    if (/\b(rm\s+-rf|git\s+reset\s+--hard|git\s+push\s+--force|sudo\s+rm|drop\s+table|drop\s+database|truncate|dd\s+if=|mkfs|fdisk)\b/i.test(cmd)) {
      return 'destructive'
    }
  }

  return baseLevel
}

/**
 * 30 天滚动清理：把超过 30 天的 audit.jsonl 行删除。
 * 在每次启动时调一次（幂等），或者由后台 cron 调。
 */
export function rotateAuditLog(): { keptLines: number; removedLines: number } {
  try {
    if (!existsSync(AUDIT_PATH)) return { keptLines: 0, removedLines: 0 }

    const stat = statSync(AUDIT_PATH)
    // 文件 < 1KB 时跳过 rotation 节省 IO
    if (stat.size < 1024) return { keptLines: 0, removedLines: 0 }

    const cutoff = Date.now() - RETENTION_DAYS * 86400000
    const content = readFileSync(AUDIT_PATH, 'utf-8')
    const lines = content.split('\n').filter(l => l.length > 0)

    const kept: string[] = []
    let removed = 0
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as AuditEntry
        if (new Date(entry.timestamp).getTime() > cutoff) {
          kept.push(line)
        } else {
          removed++
        }
      } catch {
        // 损坏行：丢弃
        removed++
      }
    }

    if (removed > 0) {
      writeFileSync(AUDIT_PATH, kept.join('\n') + (kept.length > 0 ? '\n' : ''), 'utf-8')
    }

    return { keptLines: kept.length, removedLines: removed }
  } catch {
    return { keptLines: 0, removedLines: 0 }
  }
}

/**
 * 读最近 N 条审计记录（调试用）。
 */
export function getRecentAuditEntries(n: number = 50): AuditEntry[] {
  try {
    if (!existsSync(AUDIT_PATH)) return []
    const content = readFileSync(AUDIT_PATH, 'utf-8')
    const lines = content.split('\n').filter(l => l.length > 0)
    const recent = lines.slice(-n)
    return recent.map(l => {
      try { return JSON.parse(l) as AuditEntry } catch { return null }
    }).filter((x): x is AuditEntry => x !== null)
  } catch {
    return []
  }
}
