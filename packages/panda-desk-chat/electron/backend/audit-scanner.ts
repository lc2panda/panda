// Input: 无（隐式读 ~/.pandacc/audit.jsonl）/ filter { sessionId?, toolName?, since?, limit? }
// Output: AuditEntry[] / AuditStats — panda CLI auditLog 落盘数据扫描器
// Pos: electron main — panda CLI src/utils/auditLog.ts 写入的 audit.jsonl 反向读取
//
// 数据来源（panda CLI src/utils/auditLog.ts）：
//   ~/.pandacc/audit.jsonl — append-only JSONL 单行 AuditEntry：
//     { timestamp, session_id, tool_name, args_hash, risk_level,
//       permission_decision, outcome, duration_ms?, error_brief? }
//   保留期 30 天（CLI 端 trimAuditLog 控制），单行 ≤ 4096 字节。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// ─── Constants ───────────────────────────────────────────────────────────────

const AUDIT_PATH = path.join(os.homedir(), '.pandacc', 'audit.jsonl');

/** 默认拉最近 N 条。renderer 默认 100 条够看。 */
const DEFAULT_LIMIT = 100;

/** 防御：不允许超过 1000 条（避免 IPC payload 过大）。 */
const MAX_LIMIT = 1000;

/** 每行最大字节（防御）— panda CLI 写入端已截断到 4096。 */
const MAX_LINE_BYTES = 8192;

// ─── Types（renderer 同名 mirror）────────────────────────────────────────────

export type ToolRiskLevel = 'read-only' | 'low-write' | 'high-write' | 'destructive';

export type PermissionDecision =
  | 'auto-allowed'
  | 'user-allowed'
  | 'user-denied'
  | 'auto-denied'
  | 'unknown';

export type ToolOutcome = 'success' | 'failure' | 'cancelled' | 'unknown';

/** 单条 audit entry — 与 panda CLI src/utils/auditLog.ts 形态完全一致。 */
export interface AuditEntry {
  timestamp: string;
  session_id: string;
  tool_name: string;
  args_hash: string;
  risk_level: ToolRiskLevel;
  permission_decision: PermissionDecision;
  outcome: ToolOutcome;
  duration_ms?: number;
  error_brief?: string;
}

export interface AuditFilter {
  sessionId?: string;
  toolName?: string;
  /** ISO timestamp lower bound（含）。 */
  since?: string;
  /** 默认 100，封顶 MAX_LIMIT。 */
  limit?: number;
}

export interface AuditStats {
  /** 当前统计窗内总条目数（受 filter 限制）。 */
  total: number;
  /** 今日（本地时区，按 ISO YYYY-MM-DD 比较）调用数。 */
  today: number;
  /** 失败 / 拒绝 比例（0-1）。 */
  errorRate: number;
  /** Top 5 工具调用次数。 */
  topTools: Array<{ tool: string; count: number }>;
  /** 最近一条 timestamp（无则 null）。 */
  lastTimestamp: string | null;
  /** audit.jsonl 是否存在。 */
  exists: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clampLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

/** 解析单行；失败返回 null。 */
function parseLine(line: string): AuditEntry | null {
  if (!line || line.length > MAX_LINE_BYTES) return null;
  try {
    const obj = JSON.parse(line) as Record<string, unknown>;
    if (
      typeof obj.timestamp !== 'string' ||
      typeof obj.session_id !== 'string' ||
      typeof obj.tool_name !== 'string'
    ) {
      return null;
    }
    return {
      timestamp: obj.timestamp,
      session_id: obj.session_id,
      tool_name: obj.tool_name,
      args_hash: typeof obj.args_hash === 'string' ? obj.args_hash : '',
      risk_level:
        typeof obj.risk_level === 'string'
          ? (obj.risk_level as ToolRiskLevel)
          : 'read-only',
      permission_decision:
        typeof obj.permission_decision === 'string'
          ? (obj.permission_decision as PermissionDecision)
          : 'unknown',
      outcome:
        typeof obj.outcome === 'string'
          ? (obj.outcome as ToolOutcome)
          : 'unknown',
      duration_ms:
        typeof obj.duration_ms === 'number' ? obj.duration_ms : undefined,
      error_brief:
        typeof obj.error_brief === 'string' ? obj.error_brief : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * 全量读取 audit.jsonl 并解析（按行 split，过滤空行）。
 *
 * 性能：当前实现是「全量加载 + 内存倒序」。3.9MB / 16k 行场景下耗时
 * < 50ms。后续若文件 > 50MB，可改 stream tail 按行回退（但渲染端 UI
 * 默认只看最近 100 条，已够用）。
 */
async function readAllEntries(): Promise<AuditEntry[]> {
  let content: string;
  try {
    content = await fs.readFile(AUDIT_PATH, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    console.warn('[audit-scanner] readAllEntries failed:', err);
    return [];
  }
  const entries: AuditEntry[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parsed = parseLine(trimmed);
    if (parsed) entries.push(parsed);
  }
  return entries;
}

function applyFilter(entries: AuditEntry[], filter: AuditFilter): AuditEntry[] {
  let result = entries;
  if (filter.sessionId) {
    result = result.filter((e) => e.session_id === filter.sessionId);
  }
  if (filter.toolName) {
    result = result.filter((e) => e.tool_name === filter.toolName);
  }
  if (filter.since) {
    const sinceMs = Date.parse(filter.since);
    if (Number.isFinite(sinceMs)) {
      result = result.filter((e) => Date.parse(e.timestamp) >= sinceMs);
    }
  }
  return result;
}

function computeStats(allEntries: AuditEntry[]): AuditStats {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let todayCount = 0;
  let errorCount = 0;
  const toolCounts = new Map<string, number>();
  for (const e of allEntries) {
    if (e.timestamp.startsWith(todayStr)) todayCount += 1;
    if (
      e.outcome === 'failure' ||
      e.outcome === 'cancelled' ||
      e.permission_decision === 'user-denied' ||
      e.permission_decision === 'auto-denied'
    ) {
      errorCount += 1;
    }
    toolCounts.set(e.tool_name, (toolCounts.get(e.tool_name) ?? 0) + 1);
  }
  const total = allEntries.length;
  const topTools = [...toolCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tool, count]) => ({ tool, count }));
  const last = allEntries[allEntries.length - 1];
  return {
    total,
    today: todayCount,
    errorRate: total > 0 ? errorCount / total : 0,
    topTools,
    lastTimestamp: last?.timestamp ?? null,
    exists: total > 0 || allEntries.length > 0,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * 检查 audit.jsonl 是否存在。
 */
export async function auditExists(): Promise<boolean> {
  try {
    const stat = await fs.stat(AUDIT_PATH);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * 拉最近 N 条（按 timestamp 倒序）。
 */
export async function listRecentAudit(limit?: number): Promise<AuditEntry[]> {
  const all = await readAllEntries();
  const sorted = all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return sorted.slice(0, clampLimit(limit));
}

/**
 * 按 filter 拉条目（按 timestamp 倒序，可选 limit）。
 */
export async function filterAudit(filter: AuditFilter): Promise<AuditEntry[]> {
  const all = await readAllEntries();
  const filtered = applyFilter(all, filter ?? {});
  const sorted = filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return sorted.slice(0, clampLimit(filter?.limit));
}

/**
 * 全量统计（不分页）。
 *
 * 注意：每次调用都会全量加载 audit.jsonl。renderer 应在挂载时拉一次，
 * 不要在动画/输入回调里重复请求。
 */
export async function getAuditStats(): Promise<AuditStats> {
  const exists = await auditExists();
  if (!exists) {
    return {
      total: 0,
      today: 0,
      errorRate: 0,
      topTools: [],
      lastTimestamp: null,
      exists: false,
    };
  }
  const all = await readAllEntries();
  return computeStats(all);
}
