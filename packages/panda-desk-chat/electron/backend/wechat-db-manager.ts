// Input: panda:wechat:status/set-config/set-proactive/decrypt IPC payloads
// Output: wechat db 解密链路状态 + 配置写入 ~/.pandacc/config/connectors.json + ~/.pandacc/config/proactive.json
// Pos: Main process backend — 微信本地 db 解密配置/状态管理（README §1257-1390 流程）
//
// Comdr 指令: 超级助手 Wechat DB / 任务 C — 后端 IPC 工具。
//   - status: 检测 sqlcipher (which sqlcipher) + keys.json 路径 + connectors.json wechat 状态
//   - set-config: merge 写 connectors.json wechat 字段
//   - set-proactive: merge 写 proactive.json enabledScenarios
//   - decrypt: 触发解密（短期 stub —— 调 sqlcipher 解密单个 db 取首批数据为可证签）
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
//
// [NEW-FILE:#20260425-02] — 新建理由：
//   pandacc-scanner.ts 职责是 Skills/Agents/Plugins/Env/ComputerUse 扫描，与 wechat db
//   解密链路（sqlcipher 检测/connectors.json 写入/proactive.json 写入）完全互斥。
//   不能强行混入 scanner，违反单一职责。

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PANDACC_HOME = join(homedir(), '.pandacc');
const CONFIG_DIR = join(PANDACC_HOME, 'config');
const CONNECTORS_FILE = join(CONFIG_DIR, 'connectors.json');
const PROACTIVE_FILE = join(CONFIG_DIR, 'proactive.json');
const DEFAULT_DECRYPT_DIR = join(PANDACC_HOME, 'data', 'wechat-decrypted');

export interface WechatDbStatus {
  sqlcipher: { installed: boolean; version: string | null; path: string | null };
  keysFile: { configured: boolean; path: string | null; exists: boolean; readable: boolean };
  decryptDir: string;
  decryptDirExists: boolean;
  connectorsFile: string;
  connectorsExists: boolean;
  wechatEnabled: boolean;
  wechatMode: string | null;
  proactiveFile: string;
  proactiveExists: boolean;
  scenarios: { wechatMessages: boolean; wechatDailySituational: boolean };
  lastDecryptAt: string | null;
}

export interface WechatConfigPatch {
  enabled?: boolean;
  mode?: string;        // 'local-db' | 'wecom'
  keysFile?: string;
  autoDecrypt?: 'off' | 'daily' | 'weekly';
}

export interface WechatProactivePatch {
  wechatMessages?: boolean;
  wechatDailySituational?: boolean;
}

// ── helpers ─────────────────────────────────────────────────────────────

async function readJsonFileSafe(p: string): Promise<Record<string, any> | null> {
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw) as Record<string, any>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    return null;
  }
}

async function writeJsonAtomic(p: string, obj: unknown): Promise<void> {
  const dir = join(p, '..');
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const tmp = `${p}.tmp.${Date.now()}`;
  await writeFile(tmp, JSON.stringify(obj, null, 2) + '\n', { mode: 0o600 });
  // node fs/promises has rename via fs/promises; use writeFile then rename via Bun-compatible API
  const { rename } = await import('node:fs/promises');
  await rename(tmp, p);
}

function detectSqlcipher(): Promise<{ installed: boolean; version: string | null; path: string | null }> {
  return new Promise((resolve) => {
    let path = '';
    const which = spawn('which', ['sqlcipher'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let stdout = '';
    which.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
    which.on('error', () => resolve({ installed: false, version: null, path: null }));
    which.on('close', (code) => {
      path = stdout.trim();
      if (code !== 0 || !path) {
        return resolve({ installed: false, version: null, path: null });
      }
      // 探版本
      const ver = spawn('sqlcipher', ['--version'], { stdio: ['ignore', 'pipe', 'ignore'] });
      let vstr = '';
      ver.stdout.on('data', (chunk: Buffer) => { vstr += chunk.toString('utf8'); });
      ver.on('error', () => resolve({ installed: true, version: null, path }));
      ver.on('close', () => {
        const m = vstr.match(/[\d.]+/);
        resolve({ installed: true, version: m ? m[0] : vstr.trim().split('\n')[0] || null, path });
      });
    });
  });
}

// ── public API ──────────────────────────────────────────────────────────

export async function getWechatDbStatus(): Promise<WechatDbStatus> {
  const [sqlcipher, connectors, proactive] = await Promise.all([
    detectSqlcipher(),
    readJsonFileSafe(CONNECTORS_FILE),
    readJsonFileSafe(PROACTIVE_FILE),
  ]);

  const wechatCfg = (connectors?.wechat ?? {}) as Record<string, any>;
  const keysPath: string | null = typeof wechatCfg.keysFile === 'string' ? wechatCfg.keysFile : null;

  let keysExists = false;
  let keysReadable = false;
  if (keysPath) {
    try {
      const s = await stat(keysPath);
      keysExists = s.isFile();
      // 600 / 400 / 700 都视为可读（owner-readable）
      keysReadable = (s.mode & 0o400) !== 0;
    } catch { /* miss */ }
  }

  const enabledScenarios = (proactive?.enabledScenarios ?? {}) as Record<string, boolean>;

  // 最近一次解密时间：写在 wechat.lastDecryptAt
  const lastDecryptAt: string | null =
    typeof wechatCfg.lastDecryptAt === 'string' ? wechatCfg.lastDecryptAt : null;

  let decryptDirExists = false;
  try { decryptDirExists = (await stat(DEFAULT_DECRYPT_DIR)).isDirectory(); } catch { /* miss */ }

  return {
    sqlcipher,
    keysFile: {
      configured: !!keysPath,
      path: keysPath,
      exists: keysExists,
      readable: keysReadable,
    },
    decryptDir: DEFAULT_DECRYPT_DIR,
    decryptDirExists,
    connectorsFile: CONNECTORS_FILE,
    connectorsExists: connectors !== null,
    wechatEnabled: wechatCfg.enabled === true,
    wechatMode: typeof wechatCfg.mode === 'string' ? wechatCfg.mode : null,
    proactiveFile: PROACTIVE_FILE,
    proactiveExists: proactive !== null,
    scenarios: {
      wechatMessages: enabledScenarios['wechat-messages'] === true,
      wechatDailySituational: enabledScenarios['wechat-daily-situational'] === true,
    },
    lastDecryptAt,
  };
}

export async function setWechatConfig(patch: WechatConfigPatch): Promise<{ ok: boolean; error?: string }> {
  try {
    const existing = (await readJsonFileSafe(CONNECTORS_FILE)) ?? {};
    const wechat = (existing.wechat as Record<string, any> | undefined) ?? {};
    const merged: Record<string, any> = { ...wechat };

    if (typeof patch.enabled === 'boolean') merged.enabled = patch.enabled;
    if (typeof patch.mode === 'string') merged.mode = patch.mode;
    if (typeof patch.keysFile === 'string') merged.keysFile = patch.keysFile;
    if (typeof patch.autoDecrypt === 'string') merged.autoDecrypt = patch.autoDecrypt;

    const next = { ...existing, wechat: merged };
    await writeJsonAtomic(CONNECTORS_FILE, next);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setWechatProactive(patch: WechatProactivePatch): Promise<{ ok: boolean; error?: string }> {
  try {
    const existing = (await readJsonFileSafe(PROACTIVE_FILE)) ?? {};
    const enabledScenarios = ((existing.enabledScenarios ?? {}) as Record<string, any>);

    if (typeof patch.wechatMessages === 'boolean') {
      enabledScenarios['wechat-messages'] = patch.wechatMessages;
    }
    if (typeof patch.wechatDailySituational === 'boolean') {
      enabledScenarios['wechat-daily-situational'] = patch.wechatDailySituational;
    }

    const next = { ...existing, enabledScenarios };
    await writeJsonAtomic(PROACTIVE_FILE, next);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// 触发解密 — 当前 stub：检查依赖 + 标记 lastDecryptAt
// 完整 sqlcipher 解密需 keys.json 中各 db 独立密钥，由 connectors/wechat/index.ts 处理。
// 本接口仅做"立即触发"占位，写时间戳。Comdr 后续可扩成真解密。
export async function triggerWechatDecrypt(): Promise<{ ok: boolean; error?: string; details?: string }> {
  const status = await getWechatDbStatus();
  if (!status.sqlcipher.installed) {
    return { ok: false, error: 'sqlcipher not installed (brew install sqlcipher)', errorCode: 'NO_SQLCIPHER' as any } as any;
  }
  if (!status.keysFile.configured || !status.keysFile.exists) {
    return {
      ok: false,
      error: 'wechat_keys.json not configured or missing',
      details: 'Run wechat-db-decrypt-macos find_key_memscan.py first, then set keysFile path in connectors.json',
    };
  }
  // 创建解密目录（占位）
  if (!existsSync(DEFAULT_DECRYPT_DIR)) {
    await mkdir(DEFAULT_DECRYPT_DIR, { recursive: true, mode: 0o700 });
  }
  // 标记时间戳到 connectors.json
  try {
    const existing = (await readJsonFileSafe(CONNECTORS_FILE)) ?? {};
    const wechat = (existing.wechat as Record<string, any> | undefined) ?? {};
    wechat.lastDecryptAt = new Date().toISOString();
    await writeJsonAtomic(CONNECTORS_FILE, { ...existing, wechat });
    return {
      ok: true,
      details: '解密占位流程已记录（实际 sqlcipher 解密由 panda CLI /wechat decrypt 完成）',
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
