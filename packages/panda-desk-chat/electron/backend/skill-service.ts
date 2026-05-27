// Input: ~/.pandacc/skills/<name>/SKILL.md + _meta.json (panda CLI skill 注册表)
// Output: SkillServiceItem[] 列表 / 单个 SkillServiceDetail 详情（含 SKILL.md 内容）
// Pos: electron main — skill-service IPC 后端 read-only；write 路径留 v2.27.2+
//
// 本波只读（list / get）：skill 的增删改由 panda-cli 工具链管理，
// Desk Chat 展示当前注册状态，不直接写文件系统。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// ─── 路径 ─────────────────────────────────────────────────────────────────────

function pandaccRoot(): string {
  return process.env.PANDA_CONFIG_DIR && process.env.PANDA_CONFIG_DIR.trim()
    ? process.env.PANDA_CONFIG_DIR
    : path.join(os.homedir(), '.pandacc');
}

const SKILLS_DIR = () => path.join(pandaccRoot(), 'skills');

// ─── 极简 frontmatter 解析（不依赖 yaml 库）────────────────────────────────────

interface SkillFrontmatter {
  name?: string;
  description?: string;
  version?: string;
  'user-invocable'?: boolean;
  [key: string]: unknown;
}

function parseSkillFrontmatter(content: string): { data: SkillFrontmatter; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m.exec(content);
  if (!match) return { data: {}, body: content };
  const yamlBlock = match[1] ?? '';
  const body = match[2] ?? '';
  const data: SkillFrontmatter = {};
  for (const line of yamlBlock.split('\n')) {
    const m = /^([\w-]+):\s*"?([^"]*)"?\s*$/.exec(line.trim());
    if (!m) continue;
    const [, key, val] = m;
    if (key === 'user-invocable') {
      data[key] = val === 'true';
    } else if (key) {
      data[key] = val ?? '';
    }
  }
  return { data, body };
}

// ─── 公共类型 ─────────────────────────────────────────────────────────────────

export interface SkillServiceItem {
  name: string;
  displayName?: string;
  description: string;
  path: string;
  version?: string;
  hasSkillMd: boolean;
  userInvocable?: boolean;
}

export interface SkillServiceDetail extends SkillServiceItem {
  /** SKILL.md 原始内容（含 frontmatter） */
  rawContent: string;
  /** SKILL.md body（去掉 frontmatter 后） */
  body: string;
  /** _meta.json 内容（若存在） */
  meta?: Record<string, unknown>;
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 列出所有已注册 skill。
 * 扫描 ~/.pandacc/skills/ 子目录，解析 SKILL.md frontmatter。
 */
export async function listSkills(): Promise<SkillServiceItem[]> {
  const dir = SKILLS_DIR();
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const out: SkillServiceItem[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    // 兼容 symlink 目录
    let isDirLike = entry.isDirectory();
    if (!isDirLike && entry.isSymbolicLink()) {
      try {
        const st = await fs.stat(path.join(dir, entry.name));
        isDirLike = st.isDirectory();
      } catch {
        continue;
      }
    }
    if (!isDirLike) continue;

    const skillDir = path.join(dir, entry.name);
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    let description = '';
    let displayName: string | undefined;
    let version: string | undefined;
    let userInvocable: boolean | undefined;
    let hasSkillMd = false;

    try {
      const rawContent = await fs.readFile(skillMdPath, 'utf8');
      hasSkillMd = true;
      const { data } = parseSkillFrontmatter(rawContent);
      if (typeof data.description === 'string') description = data.description.trim();
      if (typeof data.name === 'string') displayName = data.name;
      if (typeof data.version === 'string') version = data.version;
      if (typeof data['user-invocable'] === 'boolean') userInvocable = data['user-invocable'];
    } catch {
      // 没 SKILL.md — 仅目录名占位
    }

    out.push({
      name: entry.name,
      displayName,
      description,
      path: skillDir,
      version,
      hasSkillMd,
      userInvocable,
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * 获取单个 skill 详情（含 SKILL.md 内容 + _meta.json）。
 * name 为目录名（slug）。返回 null 表示未找到。
 */
export async function getSkill(name: string): Promise<SkillServiceDetail | null> {
  const dir = SKILLS_DIR();
  const skillDir = path.join(dir, name);

  // 验证目录存在
  try {
    const st = await fs.stat(skillDir);
    if (!st.isDirectory()) return null;
  } catch {
    return null;
  }

  const skillMdPath = path.join(skillDir, 'SKILL.md');
  const metaPath = path.join(skillDir, '_meta.json');

  let rawContent = '';
  let body = '';
  let displayName: string | undefined;
  let description = '';
  let version: string | undefined;
  let userInvocable: boolean | undefined;
  let hasSkillMd = false;

  try {
    rawContent = await fs.readFile(skillMdPath, 'utf8');
    hasSkillMd = true;
    const { data, body: b } = parseSkillFrontmatter(rawContent);
    body = b;
    if (typeof data.description === 'string') description = data.description.trim();
    if (typeof data.name === 'string') displayName = data.name;
    if (typeof data.version === 'string') version = data.version;
    if (typeof data['user-invocable'] === 'boolean') userInvocable = data['user-invocable'];
  } catch {
    // 没有 SKILL.md
  }

  let meta: Record<string, unknown> | undefined;
  try {
    const metaRaw = await fs.readFile(metaPath, 'utf8');
    const parsed: unknown = JSON.parse(metaRaw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      meta = parsed as Record<string, unknown>;
    }
  } catch {
    // _meta.json 不存在或解析失败
  }

  return {
    name,
    displayName,
    description,
    path: skillDir,
    version,
    hasSkillMd,
    userInvocable,
    rawContent,
    body,
    meta,
  };
}
