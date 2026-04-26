// Input: panda:adapter:start/stop/status IPC payloads { platform: 'feishu' | 'telegram' | 'wechat' }
// Output: child process lifecycle (spawn/kill) for IM adapter runtimes (panda lc2panda-plugins/wechat 或 adapters/* runtime)
// Pos: Main process backend — IM adapter runtime manager (cc-haha 风格 spawn child_process，Map<platform, ChildProcess>)
//
// Comdr 指令: IM Wechat / 任务 B — 启停 IM Adapter child process。
//   wechat: ~/.pandacc/plugins/cache/lc2panda-plugins/wechat/<ver>/channels/wechat/server.ts
//     用 bun 启 stdio MCP server。最高版本自动选择。
//   feishu/telegram: 当前 panda 项目 monorepo 内无 adapters/ runtime → 返回 NOT_INSTALLED。
//     未来若 panda 落 adapters/ 目录则按 cc-haha 形态启 bun adapters/<platform>/index.ts。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
//
// [NEW-FILE:#20260425-01] — 新建理由：
//   panda 现有 cli-manager 仅管 panda CLI 子进程，职责互斥；feishu/telegram/wechat
//   adapter 是独立 IM 接入 runtime（不同生命周期、不同 stdio 协议、不同 spawn 命令）。
//   把它放进 cli-manager 会破坏单一职责，且日后 cc-haha 已成熟模式即"adapters 独立目录"。

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { resolveBunPath } from './binPath';

export type AdapterPlatform = 'feishu' | 'telegram' | 'wechat';

export interface AdapterStartResult {
  ok: boolean;
  pid?: number;
  error?: string;
  errorCode?: 'ALREADY_RUNNING' | 'NOT_INSTALLED' | 'SPAWN_FAILED' | 'INVALID_PLATFORM';
}

export interface AdapterStatus {
  platform: AdapterPlatform;
  running: boolean;
  pid: number | null;
  installed: boolean;
  installedPath?: string;
  startedAt?: number;
  lastError?: string;
  lastExitCode?: number | null;
}

interface AdapterEntry {
  platform: AdapterPlatform;
  proc: ChildProcess;
  pid: number;
  startedAt: number;
}

const PANDACC_HOME = join(homedir(), '.pandacc');
const PLUGINS_CACHE_DIR = join(PANDACC_HOME, 'plugins', 'cache', 'lc2panda-plugins');

// Comdr 指令: IM Wechat — wechat plugin 路径解析（读最高版本号）
function resolveWechatPluginEntry(): { entry: string; version: string } | null {
  const wechatRoot = join(PLUGINS_CACHE_DIR, 'wechat');
  if (!existsSync(wechatRoot)) return null;

  let versions: string[];
  try {
    versions = readdirSync(wechatRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((n) => /^\d+\.\d+\.\d+/.test(n))
      .sort((a, b) => compareSemver(b, a)); // 降序，最高版本在前
  } catch {
    return null;
  }

  for (const ver of versions) {
    const entry = join(wechatRoot, ver, 'channels', 'wechat', 'server.ts');
    if (existsSync(entry)) {
      return { entry, version: ver };
    }
  }
  return null;
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((s) => parseInt(s, 10) || 0);
  const pb = b.split('.').map((s) => parseInt(s, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

// Comdr 指令: IM Wechat — 检测 plugin 是否安装（PdAdapterSettings 也通过 IPC 调用）
export function isPlatformInstalled(platform: AdapterPlatform): { installed: boolean; path?: string } {
  if (platform === 'wechat') {
    const r = resolveWechatPluginEntry();
    return r ? { installed: true, path: r.entry } : { installed: false };
  }
  // feishu / telegram: 检测 panda 项目根目录下 adapters/<platform>/
  // 当前 panda 没有 adapters/ runtime（cc-haha 设计但 panda 未 port），返回未安装
  return { installed: false };
}

class AdapterManager {
  private running = new Map<AdapterPlatform, AdapterEntry>();
  private lastErrors = new Map<AdapterPlatform, string>();
  private lastExitCodes = new Map<AdapterPlatform, number | null>();

  start(platform: AdapterPlatform): AdapterStartResult {
    if (!['feishu', 'telegram', 'wechat'].includes(platform)) {
      return { ok: false, error: `unknown platform: ${platform}`, errorCode: 'INVALID_PLATFORM' };
    }

    const existing = this.running.get(platform);
    if (existing && !existing.proc.killed && existing.proc.exitCode === null) {
      return { ok: true, pid: existing.pid };
    }

    if (platform === 'wechat') {
      const r = resolveWechatPluginEntry();
      if (!r) {
        return {
          ok: false,
          error: 'panda lc2panda-plugins/wechat not installed in ~/.pandacc/plugins/cache/',
          errorCode: 'NOT_INSTALLED',
        };
      }
      try {
        const proc = spawn(resolveBunPath(), [r.entry], {
          cwd: join(r.entry, '..', '..', '..'), // .../wechat/<ver>/
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env },
        });
        if (!proc.pid) {
          return { ok: false, error: 'spawn returned no pid', errorCode: 'SPAWN_FAILED' };
        }
        this.attachListeners(platform, proc);
        this.running.set(platform, {
          platform,
          proc,
          pid: proc.pid,
          startedAt: Date.now(),
        });
        this.lastErrors.delete(platform);
        return { ok: true, pid: proc.pid };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.lastErrors.set(platform, msg);
        return { ok: false, error: msg, errorCode: 'SPAWN_FAILED' };
      }
    }

    // feishu / telegram: 当前 panda 没有 runtime
    return {
      ok: false,
      error: `${platform} runtime not installed (panda has no adapters/${platform}/ yet)`,
      errorCode: 'NOT_INSTALLED',
    };
  }

  stop(platform: AdapterPlatform): { ok: boolean; error?: string } {
    const entry = this.running.get(platform);
    if (!entry) return { ok: true };
    try {
      entry.proc.kill('SIGTERM');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
    // 给 2s 优雅退出窗口，超时强制 kill
    setTimeout(() => {
      const still = this.running.get(platform);
      if (still && !still.proc.killed && still.proc.exitCode === null) {
        try { still.proc.kill('SIGKILL'); } catch { /* noop */ }
      }
    }, 2000);
    return { ok: true };
  }

  status(platform: AdapterPlatform): AdapterStatus {
    const installed = isPlatformInstalled(platform);
    const entry = this.running.get(platform);
    const isRunning =
      !!entry && !entry.proc.killed && entry.proc.exitCode === null;
    return {
      platform,
      running: isRunning,
      pid: isRunning ? entry!.pid : null,
      installed: installed.installed,
      installedPath: installed.path,
      startedAt: entry?.startedAt,
      lastError: this.lastErrors.get(platform),
      lastExitCode: this.lastExitCodes.get(platform) ?? null,
    };
  }

  destroyAll(): void {
    for (const platform of Array.from(this.running.keys())) {
      this.stop(platform);
    }
  }

  private attachListeners(platform: AdapterPlatform, proc: ChildProcess): void {
    proc.stderr?.on('data', (chunk: Buffer) => {
      const txt = chunk.toString('utf8').trim();
      // 仅记录最近一条，避免噪音；renderer 通过 status 拿
      if (txt) this.lastErrors.set(platform, txt.slice(0, 500));
    });
    proc.on('error', (err) => {
      this.lastErrors.set(platform, err.message);
    });
    proc.on('exit', (code) => {
      this.lastExitCodes.set(platform, code);
      const entry = this.running.get(platform);
      if (entry && entry.proc === proc) {
        this.running.delete(platform);
      }
    });
  }
}

export const adapterManager = new AdapterManager();
