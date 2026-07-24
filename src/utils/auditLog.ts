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

/** 风险等级排序：数值越高越危险。复合命令取最高风险（fail-safe）。 */
const RISK_RANK: Record<ToolRiskLevel, number> = {
  'read-only': 0,
  'low-write': 1,
  'high-write': 2,
  destructive: 3,
}

function higherRisk(a: ToolRiskLevel, b: ToolRiskLevel): ToolRiskLevel {
  return RISK_RANK[a] >= RISK_RANK[b] ? a : b
}

/**
 * 破坏性模式：命中即 destructive。
 * 与历史 destructivePattern 对齐，并覆盖 sudo rm / 磁盘工具等。
 */
const DESTRUCTIVE_RE =
  /\b(rm\s+-rf|git\s+reset\s+--hard|git\s+push\s+--force|sudo\s+rm|drop\s+table|drop\s+database|truncate|dd\s+if=|mkfs|fdisk)\b/i

/**
 * 写重定向：`>` / `>>` 写文件。
 * 排除 fd 复制（`2>&1` / `>&2`），那些不是落盘写。
 */
function hasWriteRedirect(segment: string): boolean {
  const withoutFdDup = segment.replace(/\d*>&\d+/g, '').replace(/>&\d+/g, '')
  return />>?/.test(withoutFdDup)
}

/**
 * 段级只读前缀。注意：
 * - 不含 tee（tee 会写文件）
 * - 不含会改状态的 git/npm 子命令
 * - 必须整段评估，禁止“前缀只读即整串只读”
 */
const READ_ONLY_CMD_RE =
  /^\s*(ls|cat|head|tail|grep|find|git\s+(status|log|diff|show|branch|tag)|npm\s+(list|ls|view|info|search)|echo|pwd|whoami|date|which|type|help|man|less|more|wc|env|printenv|set|history|hostname|uptime|df|du\s+-sh?|free|top\s+-bn1|ps\s+aux|netstat|curl\s+(-[sL]+\s+)?https?|wget\s+(-[qO-]+\s+)?https?|jq|yq|sort|uniq|awk|sed\s+-n|tr|cut|basename|dirname|realpath|stat|file|xxd|hexdump|tree|bat)\b/i

/** find 的写/执行动作，不能因 find 前缀降为 read-only */
const FIND_MUTATING_RE = /\s-(delete|exec|execdir|fprint|fprintf|fls)\b/i

/**
 * 已知写/变更类动词（非 destructive 时至少 high-write）。
 * 不确定时宁可高估，禁止 silent under-classify。
 */
const HIGH_WRITE_VERB_RE =
  /\b(rm|mv|chmod|chown|chgrp|mkdir|touch|cp|install|kill|pkill|killall|sudo|tee|dd|npm\s+i(nstall)?|git\s+(commit|push|add|checkout|merge|rebase|clean|reset|stash)|sed\s+-i)\b/i

/**
 * 按 shell 复合算子拆段：`;` `&&` `||` `|` 换行。
 * 审计分级用启发式拆分；无法安全证明只读时由段级逻辑抬高风险。
 */
function splitBashSegments(cmd: string): string[] {
  return cmd
    .split(/(?:&&|\|\||;|\n|\|)/)
    .map(s => s.trim())
    .filter(Boolean)
}

function classifyBashSegment(segment: string): ToolRiskLevel {
  const s = segment.trim()
  if (!s) return 'read-only'

  // 1) 破坏性优先
  if (DESTRUCTIVE_RE.test(s)) return 'destructive'

  // 2) 写重定向 / tee 等落盘写 → 至少 high-write
  if (hasWriteRedirect(s) || /\btee\b/i.test(s)) return 'high-write'

  // 3) 已知写动词
  if (HIGH_WRITE_VERB_RE.test(s)) return 'high-write'

  // 4) 仅当段本身是只读命令且无写副作用时才降为 read-only
  if (READ_ONLY_CMD_RE.test(s)) {
    if (/\bfind\b/i.test(s) && FIND_MUTATING_RE.test(s)) {
      return 'high-write'
    }
    return 'read-only'
  }

  // 5) 不确定 → high-write（Bash 默认，fail-safe）
  return 'high-write'
}

function classifyBashCommand(cmd: string): ToolRiskLevel {
  const trimmed = cmd.trim()
  if (!trimmed) return 'high-write'

  // 整串先扫破坏性（覆盖拆段边界上的漏检）
  if (DESTRUCTIVE_RE.test(trimmed)) return 'destructive'

  const segments = splitBashSegments(trimmed)
  if (segments.length === 0) return 'high-write'

  let max: ToolRiskLevel = 'read-only'
  for (const seg of segments) {
    max = higherRisk(max, classifyBashSegment(seg))
    if (max === 'destructive') return 'destructive'
  }
  return max
}

export function inferRiskLevel(toolName: string, args?: unknown): ToolRiskLevel {
  const baseLevel = RISK_BY_TOOL[toolName] || 'low-write'

  // Bash 风险细化：复合命令拆段取最高风险；禁止前缀只读短路
  if (toolName === 'Bash' && typeof args === 'object' && args !== null) {
    const cmd = (args as { command?: string }).command || ''
    if (!cmd.trim()) return baseLevel
    return classifyBashCommand(cmd)
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
