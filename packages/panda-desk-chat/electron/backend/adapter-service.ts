// Input: ~/.pandacc/adapters/*.json (panda CLI IM 桥接器配置，若目录存在)
// Output: AdapterServiceItem[] 列表 / 单个 AdapterServiceItem 详情
// Pos: electron main — adapter-service IPC 后端 read-only；write 路径留 v2.27.2+
//
// 本波只读（list / get）：
//   - 扫 ~/.pandacc/adapters/*.json，每文件为一个 adapter 配置快照
//   - 若目录不存在，返回空列表（adapterStore 仍可走 localStorage 降级）
//   - adapter write/delete 操作留下一波实现
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

const ADAPTERS_DIR = () => path.join(pandaccRoot(), 'adapters');

// ─── 公共类型 ─────────────────────────────────────────────────────────────────

/** 单个 adapter 配置文件的标准化快照 */
export interface AdapterServiceItem {
  /** 文件 basename（不含 .json），如 "telegram" / "feishu" / "wechat" */
  id: string;
  /** 完整文件路径 */
  filePath: string;
  /** 原始 JSON 内容（透传给 renderer，由 adapterStore 做字段映射） */
  data: Record<string, unknown>;
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 列出所有 adapter 配置文件。
 * 若 ~/.pandacc/adapters/ 不存在，返回空数组（不抛出）。
 */
export async function listAdapters(): Promise<AdapterServiceItem[]> {
  const dir = ADAPTERS_DIR();
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const out: AdapterServiceItem[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.json')) continue;
    const id = entry.name.replace(/\.json$/, '');
    const filePath = path.join(dir, entry.name);
    let data: Record<string, unknown> = {};
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      }
    } catch {
      // 解析失败：跳过该文件，保留空 data 占位
    }
    out.push({ id, filePath, data });
  }

  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

/**
 * 获取单个 adapter 配置（按 id 匹配）。
 * 返回 null 表示未找到。
 */
export async function getAdapter(id: string): Promise<AdapterServiceItem | null> {
  const filePath = path.join(ADAPTERS_DIR(), `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    const data =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    return { id, filePath, data };
  } catch {
    return null;
  }
}
