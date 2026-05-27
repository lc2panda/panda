// Input: sessionId (UUID); reads ~/.pandacc/sessions/{pid}.json registry written by panda-cli concurrentSessions.registerSession()
// Output: 当 sessionId 已被某个 alive interactive REPL PID 持有时，返回该 occupation 记录
// Pos: electron main — Desk Chat ensureSession 前置 PID 占用检测（v2.27.0 Bug C）
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
//
// 背景：
//   panda-cli 终端 REPL 启动时（src/utils/concurrentSessions.ts:registerSession）会在
//   ~/.pandacc/sessions/{pid}.json 写入 { pid, sessionId, kind, cwd, startedAt }。
//   若用户在终端 `panda --resume <sessionId>` 已经持有某 sessionId 的 REPL，
//   Desk Chat 在同一 sessionId 上再启子进程会与磁盘 jsonl 文件 + control 协议状态
//   冲突，造成消息错乱或 REPL 崩溃。本模块提供只读检测，禁止删除文件以免误删
//   其他 panda 进程的注册。

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export type SessionKind = 'interactive' | 'bg' | 'daemon' | 'daemon-worker';

export interface PidRegistryEntry {
  pid: number;
  sessionId: string;
  kind: SessionKind;
  cwd?: string;
  startedAt?: number;
}

function defaultSessionsDir(): string {
  const override = process.env.PANDA_CONFIG_DIR;
  const base = override ? override : path.join(os.homedir(), '.pandacc');
  return path.join(base, 'sessions');
}

/** 判定 PID 是否仍存活；signal 0 不发送信号、仅检查权限/存在性。 */
export function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM 表示进程存在但无权 signal — 仍视为活
    if ((err as NodeJS.ErrnoException)?.code === 'EPERM') return true;
    return false;
  }
}

/**
 * 扫描 panda-cli PID registry，返回当前 sessionsDir 下持有指定 sessionId
 * 且 PID 仍活着的注册项（按 startedAt 升序，最早占位优先）。
 *
 * 仅供 Desk Chat backend 只读检测，绝不修改/删除 registry 文件。
 *
 * @param sessionId 目标 sessionId（UUID 字符串）
 * @param sessionsDir 默认 ~/.pandacc/sessions/；测试用例可注入临时目录
 */
export function findOccupyingSessions(
  sessionId: string,
  sessionsDir: string = defaultSessionsDir(),
): PidRegistryEntry[] {
  if (!sessionId || typeof sessionId !== 'string') return [];
  if (!fs.existsSync(sessionsDir)) return [];

  let files: string[];
  try {
    files = fs.readdirSync(sessionsDir);
  } catch {
    return [];
  }

  const matches: PidRegistryEntry[] = [];
  for (const file of files) {
    // Strict filename guard: only `<pid>.json` 是 panda-cli 注册项；
    // 防止匹配到其他文件污染。
    if (!/^\d+\.json$/.test(file)) continue;
    const fullPath = path.join(sessionsDir, file);
    let raw: string;
    try {
      raw = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== 'object') continue;
    const entry = parsed as Partial<PidRegistryEntry>;
    if (typeof entry.pid !== 'number') continue;
    if (entry.sessionId !== sessionId) continue;
    if (!isPidAlive(entry.pid)) continue;
    matches.push({
      pid: entry.pid,
      sessionId: entry.sessionId,
      kind: (entry.kind as SessionKind) ?? 'interactive',
      cwd: typeof entry.cwd === 'string' ? entry.cwd : undefined,
      startedAt: typeof entry.startedAt === 'number' ? entry.startedAt : undefined,
    });
  }

  matches.sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0));
  return matches;
}

/**
 * 仅检测 interactive REPL 类型占用（Desk Chat 真正需要避让的场景）。
 * bg/daemon 类型不在 Desk Chat 冲突范围内，忽略。
 */
export function findOccupyingInteractiveSession(
  sessionId: string,
  sessionsDir?: string,
): PidRegistryEntry | null {
  const all = findOccupyingSessions(sessionId, sessionsDir);
  return all.find((e) => e.kind === 'interactive') ?? null;
}

export function getDefaultSessionsDir(): string {
  return defaultSessionsDir();
}
