// Input: 隐式遍历 ~/.pandacc/teams/<team>/inboxes/<agent>.json + ~/.pandacc/settings.json env
// Output: TeamMeta[] / TeamDetail / boolean (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS)
// Pos: electron main — panda CLI Agent Teams 落盘数据扫描器（teams + inboxes）
//
// 数据来源（panda CLI src/utils/swarm/teamHelpers.ts + utils/teammateMailbox.ts）：
//   团队根目录          →  ~/.pandacc/teams/<team-name>/
//   邮箱目录            →  ~/.pandacc/teams/<team-name>/inboxes/
//   Agent inbox         →  ~/.pandacc/teams/<team-name>/inboxes/<agent>.json
//   团队配置            →  ~/.pandacc/teams/<team-name>/config.json (可选)
//   启用开关            →  ~/.pandacc/settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
//
// inbox JSON 结构兼容两种：
//   1) 直接数组：[{ from, text, timestamp, summary?, read?, color? }, ...]
//   2) 包装对象：{ messages: [...] } 或 { entries: [...] }
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

// ─── 路径约定 ────────────────────────────────────────────────────────────────

/** pandacc 根目录 — 默认 ~/.pandacc，可通过 PANDA_CONFIG_DIR 覆盖（与 pandacc-scanner 一致）。 */
function pandaccRoot(): string {
  return process.env.PANDA_CONFIG_DIR && process.env.PANDA_CONFIG_DIR.trim()
    ? process.env.PANDA_CONFIG_DIR
    : path.join(os.homedir(), '.pandacc');
}

const TEAMS_ROOT = () => path.join(pandaccRoot(), 'teams');
const SETTINGS_JSON = () => path.join(pandaccRoot(), 'settings.json');

/** 活跃判定窗口：5 分钟内有 inbox 修改 = active。 */
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

// ─── 公共类型 ────────────────────────────────────────────────────────────────

/** 团队列表项（不含 inbox 内容）。 */
export interface TeamMeta {
  /** 团队目录名（slug，可能是 UUID）。 */
  name: string;
  /** 完整路径 ~/.pandacc/teams/<name>/。 */
  path: string;
  /** inboxes/*.json 文件数。 */
  memberCount: number;
  /** 每个 agent 名（去 .json 后缀）。 */
  members: string[];
  /** 最近 ACTIVE_WINDOW_MS 内有 mailbox 修改的 agent 数。 */
  activeMembers: number;
  /** 最近 mailbox 修改时间 ISO；没有 inbox 时返回团队目录 mtime。 */
  lastActiveAt: string;
  /** inboxes 目录是否存在。 */
  hasInbox: boolean;
}

/** 单个 agent 邮箱内容。 */
export interface AgentInbox {
  /** agent 名（文件名去 .json）。 */
  name: string;
  /** 完整文件路径。 */
  path: string;
  /** 文件 mtime ISO。 */
  mtime: string;
  /** 文件 size (bytes)。 */
  size: number;
  /** raw JSON parse 结果（数组 / 对象 / null）；解析失败返回 null。 */
  content: unknown;
  /** 解析出的消息条数（直接数组/messages/entries 兼容），无法判定时 undefined。 */
  messageCount?: number;
}

/** 团队详情（含每个 inbox 内容）。 */
export interface TeamDetail extends TeamMeta {
  inboxes: AgentInbox[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** 阻路径穿越的 team/agent 名校验：不允许 `/`、`\`、`..`、空、起首点。 */
function isSafeSegment(name: string): boolean {
  if (!name) return false;
  if (name.startsWith('.')) return false;
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return false;
  return true;
}

/** 从 raw JSON 推断消息条数：兼容三种 schema。 */
function detectMessageCount(content: unknown): number | undefined {
  if (Array.isArray(content)) return content.length;
  if (content && typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    if (Array.isArray(obj.messages)) return obj.messages.length;
    if (Array.isArray(obj.entries)) return obj.entries.length;
    if (Array.isArray(obj.inbox)) return obj.inbox.length;
  }
  return undefined;
}

/** 读取并解析单个 inbox JSON 文件；解析失败时 content=null（保留 mtime/size）。 */
async function readInboxFile(filePath: string): Promise<AgentInbox | null> {
  let stat: Awaited<ReturnType<typeof fs.stat>>;
  let raw: string;
  try {
    stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[team-scanner] read inbox failed: ${filePath}`, err);
    }
    return null;
  }

  const fileName = path.basename(filePath);
  const agentName = fileName.endsWith('.json')
    ? fileName.slice(0, -'.json'.length)
    : fileName;

  let content: unknown = null;
  try {
    content = JSON.parse(raw);
  } catch (err) {
    console.warn(`[team-scanner] inbox JSON parse failed: ${filePath}`, err);
    content = null;
  }

  const messageCount = detectMessageCount(content);

  return {
    name: agentName,
    path: filePath,
    mtime: stat.mtime.toISOString(),
    size: stat.size,
    content,
    ...(typeof messageCount === 'number' ? { messageCount } : {}),
  };
}

/** 列出某团队 inboxes 目录下的 *.json 文件名（无扩展名）；目录不存在返回空。 */
async function listInboxFileNames(
  teamPath: string,
): Promise<Array<{ fullPath: string; agent: string }>> {
  const inboxDir = path.join(teamPath, 'inboxes');
  let entries: string[];
  try {
    entries = await fs.readdir(inboxDir);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT' && code !== 'ENOTDIR') {
      console.warn(`[team-scanner] readdir inboxes failed: ${inboxDir}`, err);
    }
    return [];
  }

  const out: Array<{ fullPath: string; agent: string }> = [];
  for (const file of entries) {
    if (!file.endsWith('.json')) continue;
    if (file.startsWith('.')) continue;
    const agent = file.slice(0, -'.json'.length);
    if (!isSafeSegment(agent)) continue;
    out.push({ fullPath: path.join(inboxDir, file), agent });
  }
  return out;
}

/** 取多个 inbox 的 mtime 并计算最大值 + 活跃数。 */
async function computeActivity(
  inboxFiles: Array<{ fullPath: string; agent: string }>,
  fallbackMs: number,
): Promise<{ lastActiveMs: number; activeMembers: number }> {
  const now = Date.now();
  let lastActiveMs = fallbackMs;
  let activeMembers = 0;

  for (const { fullPath } of inboxFiles) {
    try {
      const st = await fs.stat(fullPath);
      const ms = st.mtime.getTime();
      if (ms > lastActiveMs) lastActiveMs = ms;
      if (now - ms <= ACTIVE_WINDOW_MS) activeMembers += 1;
    } catch {
      /* skip stat failures */
    }
  }

  return { lastActiveMs, activeMembers };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * 扫所有 `~/.pandacc/teams/<team>/`，返回 TeamMeta 列表。
 * 排序：lastActiveAt DESC。读取失败的子目录跳过，不阻塞。
 */
export async function listTeams(): Promise<TeamMeta[]> {
  const root = TEAMS_ROOT();
  let entries: string[];
  try {
    entries = await fs.readdir(root);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[team-scanner] readdir teams failed: ${root}`, err);
    }
    return [];
  }

  const out: TeamMeta[] = [];

  for (const slug of entries) {
    if (!isSafeSegment(slug)) continue;
    const teamPath = path.join(root, slug);

    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(teamPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    const inboxFiles = await listInboxFileNames(teamPath);
    const hasInbox = inboxFiles.length > 0;

    // 没有 inbox 时活跃时间 fallback 到团队目录 mtime
    const { lastActiveMs, activeMembers } = await computeActivity(
      inboxFiles,
      stat.mtime.getTime(),
    );

    out.push({
      name: slug,
      path: teamPath,
      memberCount: inboxFiles.length,
      members: inboxFiles.map((f) => f.agent),
      activeMembers,
      lastActiveAt: new Date(lastActiveMs).toISOString(),
      hasInbox,
    });
  }

  out.sort(
    (a, b) =>
      new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime(),
  );

  return out;
}

/**
 * 读取单个团队详情（含每个 inbox 的解析后内容）。
 * 团队不存在或无 inboxes 目录时仍返回 TeamDetail（inboxes=[]）。
 * name 校验失败 / 团队目录不存在 → 返回 null。
 */
export async function getTeamDetail(name: string): Promise<TeamDetail | null> {
  if (!isSafeSegment(name)) return null;

  const teamPath = path.join(TEAMS_ROOT(), name);
  let teamStat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    teamStat = await fs.stat(teamPath);
    if (!teamStat.isDirectory()) return null;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[team-scanner] stat team failed: ${teamPath}`, err);
    }
    return null;
  }

  const inboxFiles = await listInboxFileNames(teamPath);
  const inboxes: AgentInbox[] = [];
  for (const { fullPath } of inboxFiles) {
    const inbox = await readInboxFile(fullPath);
    if (inbox) inboxes.push(inbox);
  }

  // mtime DESC — 最近活跃排前
  inboxes.sort(
    (a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime(),
  );

  const { lastActiveMs, activeMembers } = await computeActivity(
    inboxFiles,
    teamStat.mtime.getTime(),
  );

  return {
    name,
    path: teamPath,
    memberCount: inboxFiles.length,
    members: inboxFiles.map((f) => f.agent),
    activeMembers,
    lastActiveAt: new Date(lastActiveMs).toISOString(),
    hasInbox: inboxFiles.length > 0,
    inboxes,
  };
}

/**
 * 读 ~/.pandacc/settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS。
 * 兼容字符串 "1"/"true"/"yes"（大小写不敏感）。
 * 文件不存在 / 解析失败 → 默认 false（CLI 默认未启用）。
 */
export async function isAgentTeamsEnabled(): Promise<boolean> {
  let raw: string;
  try {
    raw = await fs.readFile(SETTINGS_JSON(), 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[team-scanner] read settings failed: ${SETTINGS_JSON()}`, err);
    }
    return false;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn(`[team-scanner] settings.json parse failed`, err);
    return false;
  }

  if (!parsed || typeof parsed !== 'object') return false;
  const env = (parsed as Record<string, unknown>).env;
  if (!env || typeof env !== 'object') return false;

  const val = (env as Record<string, unknown>).CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val !== 'string') return false;

  const normalized = val.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}
