// Input: ~/.pandacc/plugins/installed_plugins.json (panda CLI 插件注册表)
// Output: PluginServiceItem[] 列表 / 单个 PluginServiceItem 详情
// Pos: electron main — plugin-service IPC 后端 read-only；write 路径留 v2.27.2+
//
// 本波只读（list / get）：插件的 enable/disable/update/uninstall 由 panda-cli 工具链管理，
// Desk Chat 展示当前安装状态，不直接修改 installed_plugins.json。
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

const PLUGINS_INSTALLED_JSON = () =>
  path.join(pandaccRoot(), 'plugins', 'installed_plugins.json');

// ─── 公共类型 ─────────────────────────────────────────────────────────────────

export interface PluginServiceItem {
  /** "name@marketplace" 格式的唯一 ID */
  id: string;
  name: string;
  marketplace: string;
  version: string;
  scope: 'user' | 'project' | 'managed' | 'builtin';
  installPath: string;
  installedAt?: string;
  lastUpdated?: string;
  enabled: boolean;
  /** 本地安装路径是否真实存在 */
  pathExists: boolean;
}

// ─── 内部帮助函数 ─────────────────────────────────────────────────────────────

interface InstalledPluginEntry {
  scope?: string;
  installPath?: string;
  version?: string;
  installedAt?: string;
  lastUpdated?: string;
  gitCommitSha?: string;
  enabled?: boolean;
}

interface InstalledPluginsFile {
  version?: number;
  plugins?: Record<string, InstalledPluginEntry[]>;
  disabled?: string[];
}

async function readInstalledPlugins(): Promise<InstalledPluginsFile> {
  try {
    const raw = await fs.readFile(PLUGINS_INSTALLED_JSON(), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as InstalledPluginsFile;
    }
    return {};
  } catch {
    return {};
  }
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 列出所有已安装插件。
 * 从 ~/.pandacc/plugins/installed_plugins.json 读取，不含实际运行状态。
 */
export async function listPlugins(): Promise<PluginServiceItem[]> {
  const parsed = await readInstalledPlugins();
  const disabled = new Set<string>(Array.isArray(parsed.disabled) ? parsed.disabled : []);
  const map = parsed.plugins ?? {};
  const out: PluginServiceItem[] = [];

  for (const [id, instances] of Object.entries(map)) {
    if (!Array.isArray(instances) || instances.length === 0) continue;
    const first = instances[0]!;
    const [name, marketplace] = id.split('@');
    const scope = (
      first.scope === 'project' || first.scope === 'managed' || first.scope === 'builtin'
        ? first.scope
        : 'user'
    ) as PluginServiceItem['scope'];
    const installPath = first.installPath ?? '';

    let pathExists = false;
    if (installPath) {
      try {
        await fs.access(installPath);
        pathExists = true;
      } catch {
        pathExists = false;
      }
    }

    out.push({
      id,
      name: name ?? id,
      marketplace: marketplace ?? '',
      version: first.version ?? 'unknown',
      scope,
      installPath,
      installedAt: first.installedAt,
      lastUpdated: first.lastUpdated,
      enabled: !disabled.has(id),
      pathExists,
    });
  }

  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

/**
 * 获取单个插件详情（按 id 匹配）。
 * 返回 null 表示未找到。
 */
export async function getPlugin(id: string): Promise<PluginServiceItem | null> {
  const list = await listPlugins();
  return list.find((p) => p.id === id) ?? null;
}
