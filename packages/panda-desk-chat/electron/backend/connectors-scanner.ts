// Input: 无（隐式读 ~/.pandacc/config/connectors.json）/ patch { platform, enabled, mode? }
// Output: ConnectorsConfigSnapshot — panda CLI src/connectors/config.ts 落盘配置反向读
// Pos: electron main — panda CLI 6 platform connectors 配置同步
//
// 数据来源（panda CLI src/connectors/config.ts）：
//   ~/.pandacc/config/connectors.json — JSON 单文件，结构示例：
//     { "version": "1.0.0",
//       "feishu":  { enabled, mode: 'mcp'|'api', appId, ... },
//       "dingtalk":{ enabled, mode, ... },
//       "slack":   { enabled, mode, token, ... },
//       "telegram":{ enabled, mode, botToken, ... },
//       "wechat":  { enabled, mode: 'local-db', extra.keysFile, ... },
//       "teams":   { enabled, mode: 'api', extra.tenantId, ... },
//       "aggregator": { ... } }
//
// panda CLI src/connectors/registry.ts ConnectorPlatform 6 个内置：
//   feishu / dingtalk / slack / telegram / wechat / teams
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// ─── Constants ───────────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(os.homedir(), '.pandacc', 'config', 'connectors.json');

/** panda CLI 内置 6 platform — 与 src/connectors/registry.ts ConnectorPlatform 对齐。 */
export const CONNECTOR_PLATFORMS = [
  'feishu',
  'dingtalk',
  'slack',
  'telegram',
  'wechat',
  'teams',
] as const;

export type ConnectorPlatform = (typeof CONNECTOR_PLATFORMS)[number];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConnectorEntry {
  platform: ConnectorPlatform;
  enabled: boolean;
  /** 'mcp' / 'api' / 'local-db'（panda CLI ConnectorMode）。 */
  mode?: string;
  /** 是否在本地配置中显式存在（未配置时返回默认 false 项）。 */
  configured: boolean;
  /** 是否含 keychain: 引用（敏感字段做可视化提示）。 */
  hasKeychainRef: boolean;
  /** 透出 permissions / rateLimit / cacheTtl 摘要（不返回 secret 字段）。 */
  permissions?: string[];
  rateLimitPerMinute?: number;
  cacheTtlSeconds?: number;
}

export interface ConnectorsConfigSnapshot {
  /** ~/.pandacc/config/connectors.json 是否存在。 */
  configExists: boolean;
  /** 文件路径（绝对，便于 UI 显示）。 */
  configPath: string;
  /** 6 个 platform — 始终返回完整 6 项（缺失项 enabled=false）。 */
  entries: ConnectorEntry[];
  /** Aggregator 块的关键字段（去敏感）。 */
  aggregator?: {
    deduplication?: boolean;
    cacheGlobalTtlSeconds?: number;
    maxMessagesPerQuery?: number;
  };
  /** 顶层 version（如有）。 */
  version?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface RawPlatformConfig {
  enabled?: boolean;
  mode?: string;
  permissions?: string[];
  rateLimitPerMinute?: number;
  cacheTtlSeconds?: number;
  [k: string]: unknown;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 探测某 platformConfig 是否含 keychain: 引用（不暴露具体值）。 */
function detectKeychainRef(cfg: RawPlatformConfig | undefined): boolean {
  if (!cfg) return false;
  for (const v of Object.values(cfg)) {
    if (typeof v === 'string' && v.startsWith('keychain:')) return true;
    if (isRecord(v)) {
      for (const inner of Object.values(v)) {
        if (typeof inner === 'string' && inner.startsWith('keychain:')) return true;
      }
    }
  }
  return false;
}

async function safeReadJson(p: string): Promise<unknown | null> {
  try {
    const text = await fs.readFile(p, 'utf-8');
    return JSON.parse(text);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn('[connectors-scanner] safeReadJson failed:', p, err);
    }
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * 拉一份 connectors.json 快照。文件不存在时返回 6 个 platform 的占位项
 * （enabled=false，configured=false）。
 *
 * 不返回任何 secret 字段（appSecret / token / botToken / corpId / agentId 等
 * 一律忽略）— UI 仅做开关 + 状态展示。
 */
export async function getConnectorsConfig(): Promise<ConnectorsConfigSnapshot> {
  const raw = await safeReadJson(CONFIG_PATH);
  const exists = raw !== null;
  const root = isRecord(raw) ? raw : {};

  const entries: ConnectorEntry[] = CONNECTOR_PLATFORMS.map((platform) => {
    const cfg = isRecord(root[platform]) ? (root[platform] as RawPlatformConfig) : undefined;
    if (!cfg || !('enabled' in cfg)) {
      return {
        platform,
        enabled: false,
        configured: false,
        hasKeychainRef: false,
      };
    }
    return {
      platform,
      enabled: cfg.enabled === true,
      mode: typeof cfg.mode === 'string' ? cfg.mode : undefined,
      configured: true,
      hasKeychainRef: detectKeychainRef(cfg),
      permissions: Array.isArray(cfg.permissions)
        ? (cfg.permissions.filter((p): p is string => typeof p === 'string') as string[])
        : undefined,
      rateLimitPerMinute:
        typeof cfg.rateLimitPerMinute === 'number' ? cfg.rateLimitPerMinute : undefined,
      cacheTtlSeconds:
        typeof cfg.cacheTtlSeconds === 'number' ? cfg.cacheTtlSeconds : undefined,
    };
  });

  const aggregator = isRecord(root.aggregator) ? (root.aggregator as Record<string, unknown>) : undefined;
  const version = typeof root.version === 'string' ? (root.version as string) : undefined;

  return {
    configExists: exists,
    configPath: CONFIG_PATH,
    entries,
    aggregator: aggregator
      ? {
          deduplication:
            typeof aggregator.deduplication === 'boolean'
              ? (aggregator.deduplication as boolean)
              : undefined,
          cacheGlobalTtlSeconds:
            typeof aggregator.cacheGlobalTtlSeconds === 'number'
              ? (aggregator.cacheGlobalTtlSeconds as number)
              : undefined,
          maxMessagesPerQuery:
            typeof aggregator.maxMessagesPerQuery === 'number'
              ? (aggregator.maxMessagesPerQuery as number)
              : undefined,
        }
      : undefined,
    version,
  };
}

/**
 * 切换某 platform 的 enabled 字段（其他字段保持不变）。
 *
 * 不存在 connectors.json 时：自动创建 + 写入最小骨架（version=1.0.0）。
 * 不存在某 platform 块时：写入 { enabled, mode='api'|'mcp'|'local-db' 默认值 }。
 *
 * 注意：本函数仅切换开关位。完整配置（appId / token / extra.keysFile 等）
 * 仍需用户手动编辑 ~/.pandacc/config/connectors.json，因为这些字段含
 * keychain 引用与外部凭证，不在 UI 直接编辑安全范围内。
 */
export async function toggleConnector(
  platform: ConnectorPlatform,
  enabled: boolean,
): Promise<{ ok: true; entry: ConnectorEntry } | { ok: false; error: string }> {
  if (!CONNECTOR_PLATFORMS.includes(platform)) {
    return { ok: false, error: `unknown platform: ${platform}` };
  }
  const dir = path.dirname(CONFIG_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    return { ok: false, error: `mkdir failed: ${(err as Error).message}` };
  }

  const raw = await safeReadJson(CONFIG_PATH);
  const root: Record<string, unknown> = isRecord(raw) ? { ...raw } : { version: '1.0.0' };

  const existing = isRecord(root[platform]) ? (root[platform] as Record<string, unknown>) : {};
  // mode 默认值 — 与 panda CLI ConnectorMode 默认对齐
  const defaultMode =
    platform === 'wechat' ? 'local-db' : platform === 'feishu' || platform === 'dingtalk' ? 'mcp' : 'api';
  const merged: Record<string, unknown> = {
    ...existing,
    enabled,
    mode: typeof existing.mode === 'string' ? existing.mode : defaultMode,
  };
  root[platform] = merged;

  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(root, null, 2) + '\n', 'utf-8');
  } catch (err) {
    return { ok: false, error: `writeFile failed: ${(err as Error).message}` };
  }

  // 重读快照，定位到刚刚改动的 entry
  const snapshot = await getConnectorsConfig();
  const entry = snapshot.entries.find((e) => e.platform === platform);
  if (!entry) {
    return { ok: false, error: `entry not found after write: ${platform}` };
  }
  return { ok: true, entry };
}
