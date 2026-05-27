// Input: configDir (默认 ~/.pandacc) — 扫描 sessions/*.json PID registry 文件
// Output: { cleared: string[] } — 已删除的过期锁文件路径列表
// Pos: electron/backend — cli-manager ensureSession 顶部调用，清理 panic crash 遗留的死 PID 文件
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
//
// 设计原则：
//   - 只删除 PID 已死的文件（process.kill(pid, 0) 抛 ESRCH）
//   - EPERM 视为进程存活（无权 signal），不删
//   - JSON 解析失败/字段缺失 → console.warn 跳过，不抛错
//   - 任何 fs 操作失败 → console.warn 跳过，不阻塞 ensureSession
//   - 不删 pid-registry 以外的文件（扫描范围仅限 sessions/*.json）

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function defaultConfigDir(): string {
  const override = process.env.PANDA_CONFIG_DIR;
  return override ? override : path.join(os.homedir(), '.pandacc');
}

function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM: 进程存在但无权 signal — 视为存活，不删
    if ((err as NodeJS.ErrnoException)?.code === 'EPERM') return true;
    // ESRCH: 进程已不存在
    return false;
  }
}

/**
 * 扫描 configDir/sessions/*.json，删除其中 PID 已死的文件。
 *
 * 用于清理 panda-cli panic crash 后遗留的僵尸 PID registry 条目，
 * 避免下次启动时 findOccupyingInteractiveSession 误判 SESSION_OCCUPIED。
 *
 * @param configDir - 可选，默认 ~/.pandacc（或 PANDA_CONFIG_DIR env）
 * @returns { cleared } — 被删除文件的完整路径列表
 */
export async function clearStaleLocks(configDir?: string): Promise<{ cleared: string[] }> {
  const base = configDir ?? defaultConfigDir();
  const sessionsDir = path.join(base, 'sessions');
  const cleared: string[] = [];

  // 目录不存在时直接返回（首次安装、测试环境）
  if (!fs.existsSync(sessionsDir)) {
    return { cleared };
  }

  let entries: string[];
  try {
    entries = fs.readdirSync(sessionsDir);
  } catch (err) {
    console.warn(`[clearStaleLocks] readdirSync(${sessionsDir}) failed:`, err);
    return { cleared };
  }

  for (const filename of entries) {
    // 只处理 <number>.json 格式（pid-registry 约定）
    if (!/^\d+\.json$/.test(filename)) continue;

    const filePath = path.join(sessionsDir, filename);
    let record: unknown;

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      record = JSON.parse(raw);
    } catch (err) {
      console.warn(`[clearStaleLocks] skipping malformed file ${filePath}:`, err);
      continue;
    }

    const pid = (record as Record<string, unknown>)?.pid;
    if (!Number.isInteger(pid) || (pid as number) <= 0) {
      console.warn(`[clearStaleLocks] skipping file with invalid pid field: ${filePath}`);
      continue;
    }

    if (isPidAlive(pid as number)) {
      // 进程存活，保留文件
      continue;
    }

    // PID 已死 → 删除过期锁文件
    try {
      fs.unlinkSync(filePath);
      cleared.push(filePath);
      console.log(`[clearStaleLocks] removed stale lock: ${filePath} (pid=${pid})`);
    } catch (err) {
      console.warn(`[clearStaleLocks] failed to remove ${filePath}:`, err);
    }
  }

  return { cleared };
}
