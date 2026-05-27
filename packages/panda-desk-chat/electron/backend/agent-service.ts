// Input: fs read/write on ~/.pandacc/agents/*.yaml|.md (yaml frontmatter + markdown body)
// Output: AgentRecord[] CRUD — list / get / create / update / delete
// Pos: electron main backend — agentService CRUD, consumed by IPC handlers agent:*
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// ─── 目录 ─────────────────────────────────────────────────────────────────────

/** pandacc 根目录（与 pandacc-scanner.ts 行为一致）。 */
function pandaccRoot(): string {
  return process.env['PANDA_CONFIG_DIR'] ?? path.join(os.homedir(), '.pandacc');
}

const AGENTS_DIR = () => path.join(pandaccRoot(), 'agents');

// ─── 类型 ─────────────────────────────────────────────────────────────────────

export interface AgentRecord {
  /** 唯一 id：文件 stem（无扩展名）。 */
  id: string;
  /** 绝对路径。 */
  path: string;
  /** frontmatter.name，缺省为 id。 */
  name: string;
  description: string;
  /** frontmatter.model（字符串别名，如 "fast"/"balanced"）。 */
  model: string;
  tools: string[];
  maxTurns: number | null;
  /** markdown body 作为 system prompt。 */
  systemPrompt: string;
  /** 原始 frontmatter 字段（透传，供扩展）。 */
  meta: Record<string, unknown>;
}

export interface AgentCreateInput {
  /** 文件名 stem（不含扩展名）；缺省自动生成 uuid。 */
  id?: string;
  name: string;
  description?: string;
  model?: string;
  tools?: string[];
  maxTurns?: number;
  systemPrompt?: string;
  meta?: Record<string, unknown>;
}

export type AgentUpdateInput = Partial<AgentCreateInput>;

// ─── 内部：frontmatter 序列化 / 反序列化 ──────────────────────────────────────

interface ParsedFM {
  data: Record<string, unknown>;
  body: string;
}

/** 极简 frontmatter 解析：与 pandacc-scanner.ts parseFrontmatter 逻辑对齐。 */
function parseFM(content: string): ParsedFM {
  const trimmed = content.replace(/^\uFEFF/, '');
  if (!trimmed.startsWith('---')) return { data: {}, body: trimmed };
  const end = trimmed.indexOf('\n---', 3);
  if (end < 0) return { data: {}, body: trimmed };
  const fm = trimmed.slice(3, end).replace(/^\n/, '');
  const body = trimmed.slice(end + 4).replace(/^\n/, '');

  const data: Record<string, unknown> = {};
  const lines = fm.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    const colon = line.indexOf(':');
    if (colon < 0) { i++; continue; }
    const key = line.slice(0, colon).trim();
    let raw = line.slice(colon + 1).trim();
    // 数组形式
    if (raw === '') {
      const list: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s+-/.test(lines[j] ?? '')) {
        list.push((lines[j] ?? '').replace(/^\s+-\s+/, '').trim().replace(/^["'](.+)["']$/, '$1'));
        j++;
      }
      if (list.length > 0) { data[key] = list; i = j; continue; }
      // nested object — skip
      let j2 = i + 1;
      while (j2 < lines.length && /^\s+\S/.test(lines[j2] ?? '')) j2++;
      i = j2; continue;
    }
    // 数字
    if (/^\d+$/.test(raw)) { data[key] = Number(raw); i++; continue; }
    // boolean
    if (raw === 'true') { data[key] = true; i++; continue; }
    if (raw === 'false') { data[key] = false; i++; continue; }
    // null
    if (raw === 'null' || raw === '~') { data[key] = null; i++; continue; }
    // 去掉引号
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1);
    }
    data[key] = raw;
    i++;
  }
  return { data, body };
}

/** 将 AgentRecord 序列化为 yaml frontmatter + markdown body。 */
function serializeFM(rec: Omit<AgentRecord, 'id' | 'path'>): string {
  const lines: string[] = ['---'];
  lines.push(`name: "${rec.name.replace(/"/g, '\\"')}"`);
  if (rec.description) lines.push(`description: "${rec.description.replace(/"/g, '\\"')}"`);
  if (rec.model) lines.push(`model: ${rec.model}`);
  if (rec.tools.length > 0) {
    lines.push('tools:');
    for (const t of rec.tools) lines.push(`  - ${t}`);
  }
  if (rec.maxTurns !== null && rec.maxTurns !== undefined) {
    lines.push(`maxTurns: ${rec.maxTurns}`);
  }
  // 透传 meta（跳过已处理的 key）
  const handled = new Set(['name', 'description', 'model', 'tools', 'maxTurns']);
  for (const [k, v] of Object.entries(rec.meta ?? {})) {
    if (handled.has(k)) continue;
    if (typeof v === 'string') lines.push(`${k}: "${v.replace(/"/g, '\\"')}"`);
    else if (typeof v === 'number' || typeof v === 'boolean') lines.push(`${k}: ${v}`);
    else if (Array.isArray(v)) {
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - ${String(item)}`);
    }
  }
  lines.push('---');
  if (rec.systemPrompt) lines.push('', rec.systemPrompt);
  return lines.join('\n') + '\n';
}

/** 解析磁盘文件为 AgentRecord。 */
function parseRecord(filePath: string, content: string): AgentRecord {
  const stem = path.basename(filePath).replace(/\.(md|yaml|yml)$/i, '');
  const { data, body } = parseFM(content);
  return {
    id: stem,
    path: filePath,
    name: typeof data['name'] === 'string' ? data['name'] : stem,
    description: typeof data['description'] === 'string' ? data['description'] : '',
    model: typeof data['model'] === 'string' ? data['model'] : '',
    tools: Array.isArray(data['tools']) ? (data['tools'] as string[]) : [],
    maxTurns: typeof data['maxTurns'] === 'number' ? data['maxTurns'] : null,
    systemPrompt: body.trim(),
    meta: data,
  };
}

// ─── CRUD 函数 ─────────────────────────────────────────────────────────────────

/**
 * 扫描 ~/.pandacc/agents/ 下所有 .md / .yaml / .yml 文件，返回 AgentRecord[]。
 * 目录不存在时返回空数组。
 */
export async function listAgents(dir?: string): Promise<AgentRecord[]> {
  const agentsDir = dir ?? AGENTS_DIR();
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(agentsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: AgentRecord[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/\.(md|yaml|yml)$/i.test(entry.name)) continue;
    const filePath = path.join(agentsDir, entry.name);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      out.push(parseRecord(filePath, content));
    } catch {
      // skip unreadable
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * 读取单个 agent。
 * id 为文件 stem（无扩展名）；先尝试 .md，后 .yaml，后 .yml。
 * 不存在返回 null。
 */
export async function getAgent(id: string, dir?: string): Promise<AgentRecord | null> {
  const agentsDir = dir ?? AGENTS_DIR();
  for (const ext of ['.md', '.yaml', '.yml']) {
    const filePath = path.join(agentsDir, `${id}${ext}`);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return parseRecord(filePath, content);
    } catch {
      // try next ext
    }
  }
  return null;
}

/**
 * 创建新 agent 文件。
 * input.id 如未提供，使用 UUID。文件写为 .md（yaml frontmatter + markdown body）。
 * 已有同名文件时抛出 Error。
 */
export async function createAgent(input: AgentCreateInput, dir?: string): Promise<AgentRecord> {
  const agentsDir = dir ?? AGENTS_DIR();
  await fs.mkdir(agentsDir, { recursive: true });

  const id = input.id ?? crypto.randomUUID();
  const filePath = path.join(agentsDir, `${id}.md`);

  // 冲突检测
  for (const ext of ['.md', '.yaml', '.yml']) {
    try {
      await fs.access(path.join(agentsDir, `${id}${ext}`));
      throw new Error(`Agent "${id}" already exists`);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }

  const rec: AgentRecord = {
    id,
    path: filePath,
    name: input.name,
    description: input.description ?? '',
    model: input.model ?? '',
    tools: input.tools ?? [],
    maxTurns: input.maxTurns ?? null,
    systemPrompt: input.systemPrompt ?? '',
    meta: {
      name: input.name,
      description: input.description ?? '',
      model: input.model ?? '',
      tools: input.tools ?? [],
      ...(input.maxTurns !== undefined ? { maxTurns: input.maxTurns } : {}),
      ...(input.meta ?? {}),
    },
  };

  await fs.writeFile(filePath, serializeFM(rec), 'utf8');
  return rec;
}

/**
 * 部分更新 agent。
 * 读取现有文件，合并 partial，重写。
 * 不存在时抛出 Error。
 */
export async function updateAgent(id: string, partial: AgentUpdateInput, dir?: string): Promise<AgentRecord> {
  const agentsDir = dir ?? AGENTS_DIR();
  const existing = await getAgent(id, agentsDir);
  if (!existing) throw new Error(`Agent "${id}" not found`);

  const merged: AgentRecord = {
    ...existing,
    name: partial.name ?? existing.name,
    description: partial.description ?? existing.description,
    model: partial.model ?? existing.model,
    tools: partial.tools ?? existing.tools,
    maxTurns: partial.maxTurns !== undefined ? (partial.maxTurns ?? null) : existing.maxTurns,
    systemPrompt: partial.systemPrompt !== undefined ? partial.systemPrompt : existing.systemPrompt,
    meta: {
      ...existing.meta,
      ...(partial.meta ?? {}),
      name: partial.name ?? existing.name,
      description: partial.description ?? existing.description,
      model: partial.model ?? existing.model,
      tools: partial.tools ?? existing.tools,
      ...(partial.maxTurns !== undefined ? { maxTurns: partial.maxTurns } : {}),
    },
  };

  await fs.writeFile(existing.path, serializeFM(merged), 'utf8');
  return { ...merged, path: existing.path };
}

/**
 * 删除 agent 文件。
 * 不存在时返回 { ok: false }，不抛出。
 */
export async function deleteAgent(id: string, dir?: string): Promise<{ ok: boolean }> {
  const agentsDir = dir ?? AGENTS_DIR();
  let deleted = false;
  for (const ext of ['.md', '.yaml', '.yml']) {
    const filePath = path.join(agentsDir, `${id}${ext}`);
    try {
      await fs.unlink(filePath);
      deleted = true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }
  return { ok: deleted };
}
