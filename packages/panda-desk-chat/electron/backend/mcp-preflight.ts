// Input: McpServerConfig (stdio | sse | http) + optional cwd/env/url
// Output: PreflightResult { ok; checks[] } — structured pass/fail report per check
// Pos: Backend service — called by IPC handler mcp:preflight before any server is added
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';

function execFileAsync(
  command: string,
  args: string[],
  opts: { timeout: number },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(command, args, opts, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout: stdout as string, stderr: stderr as string });
    });
  });
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface StdioMcpConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface SseMcpConfig {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
}

export interface HttpMcpConfig {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

export type McpServerConfig = StdioMcpConfig | SseMcpConfig | HttpMcpConfig;

export interface PreflightCheck {
  name: string;
  ok: boolean;
  detail?: string;
  level: 'error' | 'warning';
}

export interface PreflightResult {
  ok: boolean;
  checks: PreflightCheck[];
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const WHICH_TIMEOUT_MS = 5_000;
const URL_REACH_TIMEOUT_MS = 5_000;

async function checkCommandInPath(
  command: string,
): Promise<PreflightCheck> {
  // Windows uses `where`, macOS/Linux use `which`
  const finder = process.platform === 'win32' ? 'where' : 'which';
  try {
    const { stdout } = await execFileAsync(finder, [command], {
      timeout: WHICH_TIMEOUT_MS,
    });
    return {
      name: 'command_in_path',
      ok: true,
      detail: stdout.trim(),
      level: 'error',
    };
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : String(err);
    return {
      name: 'command_in_path',
      ok: false,
      detail: `命令 "${command}" 未在 PATH 中找到: ${detail}`,
      level: 'error',
    };
  }
}

async function checkCwd(cwd: string): Promise<PreflightCheck> {
  try {
    const info = await stat(cwd);
    if (!info.isDirectory()) {
      return {
        name: 'cwd_valid',
        ok: false,
        detail: `路径 "${cwd}" 存在但不是目录`,
        level: 'error',
      };
    }
    return { name: 'cwd_valid', ok: true, detail: cwd, level: 'error' };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      name: 'cwd_valid',
      ok: false,
      detail: `工作目录 "${cwd}" 不存在或无法访问: ${detail}`,
      level: 'error',
    };
  }
}

function checkEnvVars(env: Record<string, string>): PreflightCheck[] {
  const empty = Object.entries(env)
    .filter(([, v]) => !v || v.trim() === '')
    .map(([k]) => k);
  if (empty.length === 0) {
    return [{ name: 'env_vars', ok: true, level: 'error' }];
  }
  return [
    {
      name: 'env_vars',
      ok: false,
      detail: `以下环境变量值为空: ${empty.join(', ')}`,
      level: 'error',
    },
  ];
}

function checkUrlFormat(url: string): PreflightCheck {
  try {
    new URL(url);
    return { name: 'url_format', ok: true, detail: url, level: 'error' };
  } catch {
    return {
      name: 'url_format',
      ok: false,
      detail: `URL 格式不合法: "${url}"`,
      level: 'error',
    };
  }
}

async function checkUrlReachable(
  url: string,
  headers?: Record<string, string>,
): Promise<PreflightCheck> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), URL_REACH_TIMEOUT_MS);
  try {
    await fetch(url, {
      method: 'HEAD',
      headers: headers ?? {},
      signal: controller.signal,
    });
    return { name: 'url_reachable', ok: true, detail: url, level: 'warning' };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      name: 'url_reachable',
      ok: true, // warning 级：不可达不阻塞
      detail: `可达性检测失败 (warning): ${detail}`,
      level: 'warning',
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function preflightMcpServer(
  config: McpServerConfig,
): Promise<PreflightResult> {
  const checks: PreflightCheck[] = [];

  if (config.type === 'stdio') {
    // 1. command in PATH
    checks.push(await checkCommandInPath(config.command));

    // 2. cwd 校验（仅当显式传入）
    if (config.cwd) {
      checks.push(await checkCwd(config.cwd));
    }

    // 3. env 关键变量校验（仅当显式传入）
    if (config.env && Object.keys(config.env).length > 0) {
      checks.push(...checkEnvVars(config.env));
    }
  } else {
    // sse / http
    // 1. URL 格式
    const urlCheck = checkUrlFormat(config.url);
    checks.push(urlCheck);

    // 2. 可达性（只在格式合法时才尝试）
    if (urlCheck.ok) {
      checks.push(await checkUrlReachable(config.url, config.headers));
    } else {
      checks.push({
        name: 'url_reachable',
        ok: true,
        detail: 'URL 格式不合法，跳过可达性检测',
        level: 'warning',
      });
    }
  }

  const ok = checks
    .filter((c) => c.level === 'error')
    .every((c) => c.ok);

  return { ok, checks };
}
