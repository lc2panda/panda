// Input: fs read/write on ~/.pandacc/teams/<name>/ directories + config.json
// Output: TeamRecord[] CRUD — list / get / create / update / delete
// Pos: electron main backend — teamService CRUD, consumed by IPC handlers team:*
//
// 团队目录结构：
//   ~/.pandacc/teams/<name>/
//     config.json       (必须：team 配置，含 members / coordinator / settings)
//     inboxes/          (可选：agent mailbox files，由 CLI swarm 管理)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// ─── 目录 ─────────────────────────────────────────────────────────────────────

function pandaccRoot(): string {
  return process.env['PANDA_CONFIG_DIR'] ?? path.join(os.homedir(), '.pandacc');
}

const TEAMS_DIR = () => path.join(pandaccRoot(), 'teams');

// ─── 类型 ─────────────────────────────────────────────────────────────────────

export interface TeamRecord {
  /** 团队目录名（slug / UUID）。 */
  id: string;
  /** 绝对路径 ~/.pandacc/teams/<id>/。 */
  path: string;
  /** 人类可读名称（config.json.displayName，缺省等同 id）。 */
  displayName: string;
  /** 描述。 */
  description: string;
  /** 成员 agentId 列表（对应 ~/.pandacc/agents/<agentId>.md）。 */
  members: string[];
  /** 协调者 agentId（可选）。 */
  coordinator: string | null;
  /** 额外设置 key-value。 */
  settings: Record<string, unknown>;
  /** config.json 是否存在。 */
  hasConfig: boolean;
}

export interface TeamCreateInput {
  /** 目录 slug；缺省自动生成 UUID。 */
  id?: string;
  displayName: string;
  description?: string;
  members?: string[];
  coordinator?: string;
  settings?: Record<string, unknown>;
}

export type TeamUpdateInput = Partial<TeamCreateInput>;

// ─── config.json schema ───────────────────────────────────────────────────────

interface TeamConfig {
  displayName: string;
  description: string;
  members: string[];
  coordinator: string | null;
  settings: Record<string, unknown>;
}

function defaultConfig(input: TeamCreateInput): TeamConfig {
  return {
    displayName: input.displayName,
    description: input.description ?? '',
    members: input.members ?? [],
    coordinator: input.coordinator ?? null,
    settings: input.settings ?? {},
  };
}

function configPath(teamDir: string): string {
  return path.join(teamDir, 'config.json');
}

/** 安全 slug：不允许路径穿越。 */
function isSafeSegment(name: string): boolean {
  if (!name) return false;
  if (name.startsWith('.')) return false;
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return false;
  return true;
}

// ─── CRUD 函数 ─────────────────────────────────────────────────────────────────

/**
 * 列出 ~/.pandacc/teams/ 下所有子目录。
 * 每个目录解析为 TeamRecord；config.json 缺失时以目录名作为 displayName。
 */
export async function listTeams(dir?: string): Promise<TeamRecord[]> {
  const teamsDir = dir ?? TEAMS_DIR();
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(teamsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: TeamRecord[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!isSafeSegment(entry.name)) continue;
    const teamDir = path.join(teamsDir, entry.name);
    const rec = await readTeamRecord(entry.name, teamDir);
    out.push(rec);
  }
  out.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return out;
}

/**
 * 读取单个团队。
 * 目录不存在时返回 null。
 */
export async function getTeam(id: string, dir?: string): Promise<TeamRecord | null> {
  if (!isSafeSegment(id)) throw new Error(`Invalid team id: "${id}"`);
  const teamsDir = dir ?? TEAMS_DIR();
  const teamDir = path.join(teamsDir, id);
  try {
    const stat = await fs.stat(teamDir);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }
  return readTeamRecord(id, teamDir);
}

/**
 * 创建新团队目录 + config.json。
 * input.id 缺省生成 UUID。
 * 已有同名目录时抛出 Error。
 */
export async function createTeam(input: TeamCreateInput, dir?: string): Promise<TeamRecord> {
  const teamsDir = dir ?? TEAMS_DIR();
  const id = input.id ?? crypto.randomUUID();
  if (!isSafeSegment(id)) throw new Error(`Invalid team id: "${id}"`);

  const teamDir = path.join(teamsDir, id);
  try {
    await fs.access(teamDir);
    throw new Error(`Team "${id}" already exists`);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }

  await fs.mkdir(teamDir, { recursive: true });
  await fs.mkdir(path.join(teamDir, 'inboxes'), { recursive: true });

  const config = defaultConfig(input);
  await fs.writeFile(configPath(teamDir), JSON.stringify(config, null, 2) + '\n', 'utf8');

  return {
    id,
    path: teamDir,
    displayName: config.displayName,
    description: config.description,
    members: config.members,
    coordinator: config.coordinator,
    settings: config.settings,
    hasConfig: true,
  };
}

/**
 * 部分更新团队 config.json。
 * 不存在时抛出 Error。
 */
export async function updateTeam(id: string, partial: TeamUpdateInput, dir?: string): Promise<TeamRecord> {
  const teamsDir = dir ?? TEAMS_DIR();
  if (!isSafeSegment(id)) throw new Error(`Invalid team id: "${id}"`);

  const existing = await getTeam(id, teamsDir);
  if (!existing) throw new Error(`Team "${id}" not found`);

  const merged: TeamConfig = {
    displayName: partial.displayName ?? existing.displayName,
    description: partial.description ?? existing.description,
    members: partial.members ?? existing.members,
    coordinator: partial.coordinator !== undefined ? (partial.coordinator ?? null) : existing.coordinator,
    settings: partial.settings !== undefined ? partial.settings : existing.settings,
  };

  await fs.writeFile(configPath(existing.path), JSON.stringify(merged, null, 2) + '\n', 'utf8');

  return {
    id: existing.id,
    path: existing.path,
    ...merged,
    hasConfig: true,
  };
}

/**
 * 删除团队目录（含 config.json + inboxes）。
 * 不存在时返回 { ok: false }，不抛出。
 */
export async function deleteTeam(id: string, dir?: string): Promise<{ ok: boolean }> {
  const teamsDir = dir ?? TEAMS_DIR();
  if (!isSafeSegment(id)) throw new Error(`Invalid team id: "${id}"`);

  const teamDir = path.join(teamsDir, id);
  try {
    await fs.rm(teamDir, { recursive: true, force: true });
    return { ok: true };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { ok: false };
    throw e;
  }
}

// ─── 内部辅助 ─────────────────────────────────────────────────────────────────

async function readTeamRecord(id: string, teamDir: string): Promise<TeamRecord> {
  const cfgPath = configPath(teamDir);
  let hasConfig = false;
  let config: TeamConfig = {
    displayName: id,
    description: '',
    members: [],
    coordinator: null,
    settings: {},
  };
  try {
    const raw = await fs.readFile(cfgPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<TeamConfig>;
    config = {
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : id,
      description: typeof parsed.description === 'string' ? parsed.description : '',
      members: Array.isArray(parsed.members) ? parsed.members : [],
      coordinator: typeof parsed.coordinator === 'string' ? parsed.coordinator : null,
      settings: parsed.settings && typeof parsed.settings === 'object' && !Array.isArray(parsed.settings)
        ? parsed.settings as Record<string, unknown>
        : {},
    };
    hasConfig = true;
  } catch {
    // config.json 缺失或解析失败，用默认值
  }
  return { id, path: teamDir, ...config, hasConfig };
}
