// Input: ~/.pandacc/settings.json (panda CLI 全局配置文件)
// Output: PandaSettings 读取 / 写入 / setModel / setEffort 供 Settings IPC 后端使用
// Pos: electron main — settings-service IPC 后端；由 handlers.ts 注册并暴露给 renderer
//
// 设计原则：
//   - settings.json 整体 JSON 读写（与 panda-cli 行为一致，不做字段级 patch）
//   - 所有写入先读取 → merge → 原子写（write to tmp + rename）
//   - 不依赖其他 backend 模块，pure fs
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

const SETTINGS_JSON = () => path.join(pandaccRoot(), 'settings.json');

// ─── 公共类型 ─────────────────────────────────────────────────────────────────

/** settings.json 的可序列化快照（部分字段，只保留 Desk Chat 关心的） */
export interface PandaSettings {
  /** env block — CLI 环境变量覆盖 */
  env: Record<string, string>;
  /** 当前默认模型 (ANTHROPIC_MODEL env 的友好别名) */
  model?: string;
  /** 思维力度 (PANDA_THINKING_EFFORT env 的友好别名) */
  effort?: string;
  /** 原始文件中的其他字段透传 */
  [key: string]: unknown;
}

/** updateSettings 允许的 patch 字段 */
export type PandaSettingsPatch = Partial<Pick<PandaSettings, 'env' | 'model' | 'effort'>>;

// ─── 内部读写帮助函数 ─────────────────────────────────────────────────────────

async function readSettingsRaw(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(SETTINGS_JSON(), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

async function writeSettingsRaw(data: Record<string, unknown>): Promise<void> {
  const filePath = SETTINGS_JSON();
  // 确保目录存在
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const content = JSON.stringify(data, null, 2);
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, filePath);
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 读取 ~/.pandacc/settings.json，返回 PandaSettings 快照。
 * 若文件不存在，返回空默认值（不抛出）。
 */
export async function getSettings(): Promise<PandaSettings> {
  const raw = await readSettingsRaw();
  const env: Record<string, string> = {};
  if (raw.env && typeof raw.env === 'object' && !Array.isArray(raw.env)) {
    for (const [k, v] of Object.entries(raw.env as Record<string, unknown>)) {
      if (typeof v === 'string') env[k] = v;
      else if (typeof v === 'number' || typeof v === 'boolean') env[k] = String(v);
    }
  }
  const model =
    typeof raw.model === 'string'
      ? raw.model
      : typeof env['ANTHROPIC_MODEL'] === 'string'
        ? env['ANTHROPIC_MODEL']
        : undefined;
  const effort =
    typeof raw.effort === 'string'
      ? raw.effort
      : typeof env['PANDA_THINKING_EFFORT'] === 'string'
        ? env['PANDA_THINKING_EFFORT']
        : undefined;
  return { ...raw, env, model, effort };
}

/**
 * 合并 patch 到 settings.json 并写回。
 * - patch.env 做 shallow merge（不清除其他 env key）
 * - patch.model / patch.effort 更新 env 里对应 key（同时写 root level model/effort 字段）
 */
export async function updateSettings(patch: PandaSettingsPatch): Promise<PandaSettings> {
  const raw = await readSettingsRaw();

  // env 合并
  const existingEnv =
    raw.env && typeof raw.env === 'object' && !Array.isArray(raw.env)
      ? (raw.env as Record<string, unknown>)
      : {};
  if (patch.env) {
    raw.env = { ...existingEnv, ...patch.env };
  }

  // model
  if (patch.model !== undefined) {
    raw.model = patch.model;
    // 同步写入 env.ANTHROPIC_MODEL
    raw.env = {
      ...(raw.env as Record<string, unknown> ?? {}),
      ANTHROPIC_MODEL: patch.model,
    };
  }

  // effort
  if (patch.effort !== undefined) {
    raw.effort = patch.effort;
    // 同步写入 env.PANDA_THINKING_EFFORT
    raw.env = {
      ...(raw.env as Record<string, unknown> ?? {}),
      PANDA_THINKING_EFFORT: patch.effort,
    };
  }

  await writeSettingsRaw(raw);
  return getSettings();
}

/**
 * 设置全局默认模型（写入 settings.json env.ANTHROPIC_MODEL + root model 字段）。
 */
export async function setModel(modelId: string): Promise<void> {
  await updateSettings({ model: modelId });
}

/**
 * 设置思维力度（写入 settings.json env.PANDA_THINKING_EFFORT + root effort 字段）。
 * level: 'low' | 'medium' | 'high'
 */
export async function setEffort(level: string): Promise<void> {
  await updateSettings({ effort: level });
}
