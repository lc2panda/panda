// Input: 无（隐式遍历 ~/.pandacc/projects/<slug>/memory/）/ projectSlug? layer?
// Output: MemdirProjectMeta[] / MemdirEntry[] / { content }
// Pos: electron main — panda CLI src/memdir/paths.ts getAutoMemPath() 落盘数据扫描
//
// 数据来源（panda CLI src/memdir/paths.ts）：
//   getAutoMemPath() = ~/.pandacc/projects/<sanitize-cwd>/memory/
//     ├── MEMORY.md            (entrypoint)
//     ├── patterns/            (成功模式记忆 — empty when no patterns extracted)
//     ├── scars/               (失败教训 — empty when no scars extracted)
//     ├── episodes/            (情节记忆 — 时间戳化对话快照)
//     ├── semantic/            (语义记忆 — briefing/profile-logs 子目录)
//     ├── procedural/          (程序记忆 — habits-log 等)
//     ├── working/             (工作记忆 — daily session-summary / observations.jsonl)
//     └── dreams/              (前瞻 / DeepDream 周期 — YYYY-MM-DD.md)
//
// 项目枚举：与 disk-session-scanner 共享 PANDACC_ROOT（~/.pandacc/projects）。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import {
  PANDACC_ROOT,
  desanitizeProjectPath,
} from './disk-session-scanner.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** 5 层 memdir layer + patterns + scars。 */
export type MemdirLayer =
  | 'working'
  | 'episodic'
  | 'semantic'
  | 'procedural'
  | 'prospective'
  | 'patterns'
  | 'scars';

/** Layer → 实际目录名映射。
 *  episodic → episodes/ ; prospective → dreams/prospective/ 或 dreams/。
 *  panda CLI 会把 prospective 写到 dreams/ 下；我们扫整个 dreams/ 目录。 */
const LAYER_DIR_MAP: Record<MemdirLayer, string> = {
  working: 'working',
  episodic: 'episodes',
  semantic: 'semantic',
  procedural: 'procedural',
  prospective: 'dreams',
  patterns: 'patterns',
  scars: 'scars',
};

/** 单个文件 preview 截断长度。 */
const PREVIEW_LEN = 240;

/** 单层最多返回条目（防 IPC payload 失控）。 */
const MAX_ENTRIES_PER_LAYER = 500;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MemdirProjectMeta {
  /** 项目目录名（cc-haha sanitized 形态）。 */
  projectSlug: string;
  /** 还原的项目原始 cwd。 */
  projectCwd: string;
  /** memory/ 目录是否存在。 */
  hasMemory: boolean;
  /** 各 layer 是否存在并有内容。 */
  layerSummary: Partial<Record<MemdirLayer, number>>;
  /** memory/MEMORY.md 是否存在。 */
  hasEntrypoint: boolean;
  /** memory/ 目录最近修改时间（ISO）— null 表示目录不存在。 */
  lastModified: string | null;
}

export interface MemdirEntry {
  layer: MemdirLayer;
  projectSlug: string;
  projectCwd: string;
  filename: string;
  /** 绝对路径。 */
  path: string;
  /** 相对 memory/<layer>/ 的相对路径（含子目录）。 */
  relativePath: string;
  modifiedAt: string;
  size: number;
  preview?: string;
}

export interface MemdirReadResult {
  path: string;
  content: string;
  modifiedAt: string;
  size: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function safeStat(p: string): Promise<{ mtimeMs: number; isDir: boolean; size: number } | null> {
  try {
    const s = await fs.stat(p);
    return { mtimeMs: s.mtimeMs, isDir: s.isDirectory(), size: s.size };
  } catch {
    return null;
  }
}

async function safeReadDir(p: string): Promise<string[]> {
  try {
    return await fs.readdir(p);
  } catch {
    return [];
  }
}

async function listProjectSlugs(): Promise<string[]> {
  return safeReadDir(PANDACC_ROOT);
}

function memoryDir(projectSlug: string): string {
  return path.join(PANDACC_ROOT, projectSlug, 'memory');
}

function layerDir(projectSlug: string, layer: MemdirLayer): string {
  return path.join(memoryDir(projectSlug), LAYER_DIR_MAP[layer]);
}

/** 递归收集某 layer 目录下所有文件（深度 ≤ 4，过滤 .DS_Store / dotfiles）。 */
async function collectLayerFiles(
  rootDir: string,
  baseDir: string = rootDir,
  depth: number = 0,
): Promise<Array<{ path: string; relative: string; mtimeMs: number; size: number }>> {
  if (depth > 4) return [];
  const stat = await safeStat(rootDir);
  if (!stat || !stat.isDir) return [];
  const entries = await safeReadDir(rootDir);
  const collected: Array<{ path: string; relative: string; mtimeMs: number; size: number }> = [];
  for (const name of entries) {
    if (name.startsWith('.')) continue;
    const full = path.join(rootDir, name);
    const st = await safeStat(full);
    if (!st) continue;
    if (st.isDir) {
      const sub = await collectLayerFiles(full, baseDir, depth + 1);
      for (const s of sub) collected.push(s);
    } else {
      collected.push({
        path: full,
        relative: path.relative(baseDir, full),
        mtimeMs: st.mtimeMs,
        size: st.size,
      });
    }
    if (collected.length > MAX_ENTRIES_PER_LAYER * 2) break;
  }
  return collected;
}

async function readPreview(filePath: string, sizeBytes: number): Promise<string | undefined> {
  if (sizeBytes <= 0) return undefined;
  // 预览仅对 ≤ 64KB 文件生效（更大的避免阻塞）
  if (sizeBytes > 64 * 1024) return undefined;
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stripped = content.replace(/\s+/g, ' ').trim();
    return stripped.length > PREVIEW_LEN
      ? stripped.slice(0, PREVIEW_LEN) + '...'
      : stripped;
  } catch {
    return undefined;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * 列出所有项目（仅含 memory/ 目录的）。
 */
export async function listMemdirProjects(): Promise<MemdirProjectMeta[]> {
  const slugs = await listProjectSlugs();
  const result: MemdirProjectMeta[] = [];
  for (const slug of slugs) {
    if (slug.startsWith('.')) continue;
    const memDir = memoryDir(slug);
    const memStat = await safeStat(memDir);
    if (!memStat || !memStat.isDir) continue;

    const summary: Partial<Record<MemdirLayer, number>> = {};
    let lastMtime = memStat.mtimeMs;
    for (const layer of Object.keys(LAYER_DIR_MAP) as MemdirLayer[]) {
      const dir = layerDir(slug, layer);
      const ds = await safeStat(dir);
      if (!ds || !ds.isDir) continue;
      const entries = await safeReadDir(dir);
      // 浅层文件计数（不递归）
      let count = 0;
      for (const e of entries) {
        if (e.startsWith('.')) continue;
        const sub = await safeStat(path.join(dir, e));
        if (!sub) continue;
        if (sub.isDir) count += 1; // 把子目录也算一项（语义/程序记忆有 briefing/habits-log 子目录）
        else count += 1;
        if (sub.mtimeMs > lastMtime) lastMtime = sub.mtimeMs;
      }
      summary[layer] = count;
    }

    const entrypointStat = await safeStat(path.join(memDir, 'MEMORY.md'));
    result.push({
      projectSlug: slug,
      projectCwd: desanitizeProjectPath(slug),
      hasMemory: true,
      layerSummary: summary,
      hasEntrypoint: !!entrypointStat && !entrypointStat.isDir,
      lastModified: new Date(lastMtime).toISOString(),
    });
  }
  // 最近修改优先
  return result.sort((a, b) => {
    const ta = a.lastModified ?? '';
    const tb = b.lastModified ?? '';
    return tb.localeCompare(ta);
  });
}

/**
 * 列某项目某 layer 的所有条目。
 */
export async function listLayerEntries(
  projectSlug: string,
  layer: MemdirLayer,
): Promise<MemdirEntry[]> {
  if (!projectSlug || projectSlug.startsWith('.') || projectSlug.includes('..')) return [];
  if (!Object.prototype.hasOwnProperty.call(LAYER_DIR_MAP, layer)) return [];
  const dir = layerDir(projectSlug, layer);
  const files = await collectLayerFiles(dir);
  if (files.length === 0) return [];
  // 倒序（最近优先）
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const sliced = files.slice(0, MAX_ENTRIES_PER_LAYER);
  const result: MemdirEntry[] = [];
  for (const f of sliced) {
    const preview = await readPreview(f.path, f.size);
    result.push({
      layer,
      projectSlug,
      projectCwd: desanitizeProjectPath(projectSlug),
      filename: path.basename(f.path),
      path: f.path,
      relativePath: f.relative,
      modifiedAt: new Date(f.mtimeMs).toISOString(),
      size: f.size,
      preview,
    });
  }
  return result;
}

/**
 * 读取某文件全文（路径必须落在 ~/.pandacc/projects/<slug>/memory/ 下）。
 */
export async function readMemdirFile(filePath: string): Promise<MemdirReadResult | null> {
  if (typeof filePath !== 'string' || !filePath) return null;
  // 安全性：要求 path 必须以 PANDACC_ROOT 开头并含 '/memory/' 段
  if (!filePath.startsWith(PANDACC_ROOT)) return null;
  if (!filePath.includes(`${path.sep}memory${path.sep}`)) return null;
  // 防止 .. 跳出
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(PANDACC_ROOT)) return null;

  const st = await safeStat(resolved);
  if (!st || st.isDir) return null;
  // 单文件 read 上限 4MB（防失控）
  if (st.size > 4 * 1024 * 1024) {
    return {
      path: resolved,
      content: `[文件过大：${st.size} 字节，超过 4MB 单文件上限]`,
      modifiedAt: new Date(st.mtimeMs).toISOString(),
      size: st.size,
    };
  }
  try {
    const content = await fs.readFile(resolved, 'utf-8');
    return {
      path: resolved,
      content,
      modifiedAt: new Date(st.mtimeMs).toISOString(),
      size: st.size,
    };
  } catch (err) {
    console.warn('[memdir-scanner] readMemdirFile failed:', resolved, err);
    return null;
  }
}
