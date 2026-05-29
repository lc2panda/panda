// Input: CLI args 数组（来自 "panda daemon [start|stop|status|restart]"）
// Output: supervisor 进程模型——单例锁、worker 启动/监控/respawn、优雅退出
// Pos: src/daemon/ —— DAEMON feature gate 路由入口；复用 bgSpawn/PID registry/tmux/bridge

import { spawn, type ChildProcess } from 'child_process'
import { mkdir, writeFile, readFile, unlink, chmod } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

import { logForDebugging } from '../utils/debug.js'
import { isProcessRunning } from '../utils/genericProcessUtils.js'
import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
import {
  ensureTmuxAvailable,
  BG_TMUX_SESSION,
} from '../cli/bgSpawn.js'
import { execFileNoThrow } from '../utils/execFileNoThrow.js'
import { TMUX_COMMAND } from '../utils/swarm/constants.js'

// ---------------------------------------------------------------------------
// 常量 / 路径
// ---------------------------------------------------------------------------

/** daemon 进程 PID 文件路径（单例锁） */
function getDaemonPidPath(): string {
  return join(getClaudeConfigHomeDir(), 'daemon.pid')
}

/** daemon sessions 目录（含 worker PID 文件） */
function getDaemonDir(): string {
  return join(getClaudeConfigHomeDir(), 'daemon')
}

/** daemon tmux session 名称 */
export const DAEMON_TMUX_SESSION = 'panda-daemon'

/** 默认 worker 规格（可被 --workers 扩展） */
const DEFAULT_WORKERS: WorkerSpec[] = [
  { kind: 'generic', id: crypto.randomUUID() },
]

/** worker 最大 respawn 次数（防止 rapid crash loop） */
const MAX_RESPAWN = 5

/** respawn 间隔（毫秒），指数退避乘数 */
const RESPAWN_BASE_DELAY_MS = 1000

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export interface WorkerSpec {
  kind: string
  id: string
}

interface WorkerState {
  spec: WorkerSpec
  proc: ChildProcess | null
  respawnCount: number
  lastRespawnAt: number
  exited: boolean
}

interface DaemonPidFile {
  pid: number
  startedAt: number
  version: string
  workers: WorkerSpec[]
}

// ---------------------------------------------------------------------------
// supervisor 内部状态
// ---------------------------------------------------------------------------

let shuttingDown = false
const workers = new Map<string, WorkerState>()

// ---------------------------------------------------------------------------
// PID 文件（单例锁）
// ---------------------------------------------------------------------------

async function readDaemonPidFile(): Promise<DaemonPidFile | null> {
  try {
    const raw = await readFile(getDaemonPidPath(), 'utf8')
    return JSON.parse(raw) as DaemonPidFile
  } catch {
    return null
  }
}

async function writeDaemonPidFile(
  workers: WorkerSpec[],
): Promise<void> {
  const dir = getClaudeConfigHomeDir()
  await mkdir(dir, { recursive: true, mode: 0o700 })
  await chmod(dir, 0o700)
  await writeFile(
    getDaemonPidPath(),
    JSON.stringify(
      {
        pid: process.pid,
        startedAt: Date.now(),
        version: process.env.npm_package_version ?? 'unknown',
        workers,
      } satisfies DaemonPidFile,
      null,
      2,
    ),
    { mode: 0o600 },
  )
}

async function removeDaemonPidFile(): Promise<void> {
  try {
    await unlink(getDaemonPidPath())
  } catch {
    // ENOENT is fine
  }
}

/**
 * 单例锁：检查是否已有存活的 daemon 进程。
 * 返回已存活进程的 PID，或 null 表示可以安全启动。
 */
async function checkSingletonLock(): Promise<number | null> {
  const existing = await readDaemonPidFile()
  if (!existing) return null

  if (isProcessRunning(existing.pid)) {
    return existing.pid
  }

  // PID 文件存在但进程已死 → stale lock，清除
  logForDebugging(
    `[daemon] stale lock detected (pid=${existing.pid}), clearing`,
  )
  await removeDaemonPidFile()
  return null
}

// ---------------------------------------------------------------------------
// Worker 生命周期
// ---------------------------------------------------------------------------

/**
 * 生成 worker tmux window 名称。
 */
function workerTmuxWindowName(spec: WorkerSpec): string {
  return `worker-${spec.kind}-${spec.id.slice(0, 8)}`
}

/**
 * 启动单个 worker 子进程。
 * 复用 bgSpawn.ts 的 tmux session，在 daemon session 内新开 window。
 * fallback：tmux 不可用时直接 spawn（subprocess 模式）。
 */
async function spawnWorker(
  state: WorkerState,
  useTmux: boolean,
): Promise<void> {
  const { spec } = state
  const workerId = `${spec.kind}/${spec.id}`

  // 计算 respawn 退避延迟
  if (state.respawnCount > 0) {
    const delay =
      RESPAWN_BASE_DELAY_MS *
      Math.min(Math.pow(2, state.respawnCount - 1), 32)
    logForDebugging(
      `[daemon] worker ${workerId} respawn #${state.respawnCount}, backoff ${delay}ms`,
    )
    await sleep(delay)
  }

  const execPath = process.execPath // bun binary
  const selfPath = process.argv[1]  // dist/cli.js

  const workerArgs = ['--daemon-worker', workerId]

  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    CLAUDE_CODE_SESSION_KIND: 'daemon-worker',
    CLAUDE_CODE_DAEMON_WORKER_ID: workerId,
    CLAUDE_CODE_DAEMON_WORKER_KIND: spec.kind,
  }

  state.lastRespawnAt = Date.now()
  state.exited = false

  if (useTmux) {
    // tmux window 模式：在 DAEMON_TMUX_SESSION 内开新 window 运行 worker
    const winName = workerTmuxWindowName(spec)
    const cmd = [execPath, selfPath, ...workerArgs]
      .map(shellQuote)
      .join(' ')

    const result = await execFileNoThrow(
      TMUX_COMMAND,
      [
        'new-window',
        '-t',
        DAEMON_TMUX_SESSION,
        '-n',
        winName,
        '-d',           // detached（不切换焦点）
        cmd,
      ],
      { timeout: 10_000, useCwd: false },
    )

    if (result.code !== 0) {
      logForDebugging(
        `[daemon] tmux new-window failed for ${workerId}: ${result.stderr.trim()}`,
      )
      // fallback to subprocess
      spawnWorkerSubprocess(state, execPath, selfPath, workerArgs, childEnv)
    } else {
      logForDebugging(
        `[daemon] spawned worker ${workerId} in tmux window ${winName}`,
      )
      // tmux 模式下无法直接获取 child ChildProcess，state.proc = null
      state.proc = null
    }
  } else {
    spawnWorkerSubprocess(state, execPath, selfPath, workerArgs, childEnv)
  }
}

/**
 * 直接 subprocess 模式（无 tmux 时的 fallback）。
 */
function spawnWorkerSubprocess(
  state: WorkerState,
  execPath: string,
  selfPath: string,
  workerArgs: string[],
  env: NodeJS.ProcessEnv,
): void {
  const { spec } = state
  const workerId = `${spec.kind}/${spec.id}`

  const proc = spawn(execPath, [selfPath, ...workerArgs], {
    stdio: 'pipe',
    detached: false,
    env,
  })

  state.proc = proc

  proc.stdout?.on('data', (chunk: Buffer) => {
    logForDebugging(`[worker:${workerId}] stdout: ${chunk.toString().trim()}`)
  })
  proc.stderr?.on('data', (chunk: Buffer) => {
    logForDebugging(`[worker:${workerId}] stderr: ${chunk.toString().trim()}`)
  })

  proc.on('error', (err: Error) => {
    logForDebugging(`[worker:${workerId}] spawn error: ${err.message}`)
    state.exited = true
    state.proc = null
    scheduleRespawn(state)
  })

  proc.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
    logForDebugging(
      `[worker:${workerId}] exited code=${code} signal=${signal}`,
    )
    state.exited = true
    state.proc = null
    scheduleRespawn(state)
  })

  logForDebugging(
    `[daemon] spawned worker ${workerId} as subprocess pid=${proc.pid}`,
  )
}

/**
 * 调度 worker respawn（仅在 supervisor 未关闭且未超过上限时）。
 */
function scheduleRespawn(state: WorkerState): void {
  if (shuttingDown) return

  const workerId = `${state.spec.kind}/${state.spec.id}`

  if (state.respawnCount >= MAX_RESPAWN) {
    logForDebugging(
      `[daemon] worker ${workerId} exceeded max respawn (${MAX_RESPAWN}), giving up`,
    )
    workers.delete(workerId)
    // 如果所有 worker 都放弃，检查是否应该退出
    if (workers.size === 0) {
      logForDebugging('[daemon] all workers exhausted, supervisor will exit')
      process.exit(1)
    }
    return
  }

  state.respawnCount++

  // 异步 respawn，不阻塞当前 exit 回调
  void (async () => {
    // 当前 useTmux 状态在重入 spawnWorker 时通过 env 判断
    const useTmux = process.env.CLAUDE_CODE_DAEMON_USE_TMUX === '1'
    await spawnWorker(state, useTmux)
  })()
}

// ---------------------------------------------------------------------------
// 优雅退出
// ---------------------------------------------------------------------------

async function gracefulShutdown(signal: string): Promise<never> {
  logForDebugging(`[daemon] received ${signal}, shutting down`)
  shuttingDown = true

  // 向所有 subprocess worker 发送 SIGTERM
  const killPromises: Promise<void>[] = []
  for (const [id, state] of workers) {
    if (state.proc && !state.exited) {
      logForDebugging(`[daemon] terminating worker ${id} pid=${state.proc.pid}`)
      try {
        state.proc.kill('SIGTERM')
      } catch {
        // already dead
      }

      // 等待最多 5s，超时则 SIGKILL
      const deadline = Date.now() + 5000
      killPromises.push(
        new Promise<void>(resolve => {
          const check = setInterval(() => {
            if (state.exited || Date.now() > deadline) {
              clearInterval(check)
              if (!state.exited && state.proc?.pid) {
                try {
                  state.proc.kill('SIGKILL')
                } catch {
                  // ignore
                }
              }
              resolve()
            }
          }, 200)
        }),
      )
    }
  }

  await Promise.all(killPromises)
  await removeDaemonPidFile()
  logForDebugging('[daemon] shutdown complete')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// supervisor 主循环
// ---------------------------------------------------------------------------

async function runSupervisor(workerSpecs: WorkerSpec[]): Promise<void> {
  // 检测 tmux 是否可用
  const tmuxResult = await ensureTmuxAvailable()
  const useTmux = tmuxResult.ok

  if (useTmux) {
    // 确保 daemon tmux session 存在
    const checkResult = await execFileNoThrow(
      TMUX_COMMAND,
      ['has-session', '-t', DAEMON_TMUX_SESSION],
      { timeout: 5000, useCwd: false },
    )
    if (checkResult.code !== 0) {
      const createResult = await execFileNoThrow(
        TMUX_COMMAND,
        [
          'new-session', '-d', '-s', DAEMON_TMUX_SESSION,
          '-x', '200', '-y', '50',
        ],
        { timeout: 10_000, useCwd: false },
      )
      if (createResult.code !== 0) {
        logForDebugging(
          `[daemon] failed to create tmux session: ${createResult.stderr.trim()}`,
        )
      }
    }
    process.env.CLAUDE_CODE_DAEMON_USE_TMUX = '1'
  }

  // 写 PID 文件（单例锁）
  await writeDaemonPidFile(workerSpecs)

  // 注册信号处理
  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'))
  process.on('SIGHUP', () => void gracefulShutdown('SIGHUP'))

  // 启动所有 workers
  for (const spec of workerSpecs) {
    const workerId = `${spec.kind}/${spec.id}`
    const state: WorkerState = {
      spec,
      proc: null,
      respawnCount: 0,
      lastRespawnAt: 0,
      exited: false,
    }
    workers.set(workerId, state)
    await spawnWorker(state, useTmux)
  }

  logForDebugging(
    `[daemon] supervisor running pid=${process.pid} workers=${workerSpecs.length} tmux=${useTmux}`,
  )

  // 保活主循环：定期输出心跳，直到 shuttingDown
  return new Promise<void>(resolve => {
    const heartbeat = setInterval(() => {
      if (shuttingDown) {
        clearInterval(heartbeat)
        resolve()
        return
      }
      logForDebugging(
        `[daemon] heartbeat workers=${workers.size} pid=${process.pid}`,
      )
    }, 30_000)

    // unref 以防止 heartbeat 阻止 Node/Bun 自然退出
    heartbeat.unref()
  })
}

// ---------------------------------------------------------------------------
// daemon 子命令路由
// ---------------------------------------------------------------------------

async function statusDaemon(): Promise<void> {
  const pidFile = await readDaemonPidFile()
  if (!pidFile) {
    console.log('Daemon: not running (no PID file)')
    return
  }
  if (isProcessRunning(pidFile.pid)) {
    console.log(
      `Daemon: running (pid=${pidFile.pid}, started=${new Date(pidFile.startedAt).toISOString()}, workers=${pidFile.workers.length})`,
    )
  } else {
    console.log(
      `Daemon: stale PID file (pid=${pidFile.pid} not running), run "panda daemon start"`,
    )
    await removeDaemonPidFile()
  }
}

async function stopDaemon(): Promise<void> {
  const pidFile = await readDaemonPidFile()
  if (!pidFile) {
    console.log('Daemon: not running')
    return
  }
  if (!isProcessRunning(pidFile.pid)) {
    console.log(`Daemon: stale lock (pid=${pidFile.pid} not running), cleaning up`)
    await removeDaemonPidFile()
    return
  }

  console.log(`Stopping daemon pid=${pidFile.pid}...`)
  try {
    process.kill(pidFile.pid, 'SIGTERM')
  } catch (e) {
    console.error(`Failed to send SIGTERM to pid=${pidFile.pid}: ${String(e)}`)
    return
  }

  // Poll until dead or timeout (10s)
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    await sleep(300)
    if (!isProcessRunning(pidFile.pid)) {
      console.log('Daemon stopped.')
      return
    }
  }

  // Force kill
  try {
    process.kill(pidFile.pid, 'SIGKILL')
    console.log('Daemon force-killed (SIGKILL).')
  } catch {
    console.log('Daemon may have already stopped.')
  }
}

async function restartDaemon(workerSpecs: WorkerSpec[]): Promise<void> {
  await stopDaemon()
  await sleep(500)
  // start 会在同一进程里再次运行 supervisor
  await startDaemon(workerSpecs)
}

async function startDaemon(workerSpecs: WorkerSpec[]): Promise<void> {
  // 单例锁检查
  const existingPid = await checkSingletonLock()
  if (existingPid !== null) {
    console.error(
      `Daemon already running (pid=${existingPid}). Use "panda daemon stop" first.`,
    )
    process.exit(1)
  }

  // 确保 daemon 工作目录存在
  await mkdir(getDaemonDir(), { recursive: true, mode: 0o700 })

  // 设置进程标题
  process.title = 'panda-daemon'
  process.env.CLAUDE_CODE_SESSION_KIND = 'daemon'

  await runSupervisor(workerSpecs)
}

// ---------------------------------------------------------------------------
// 公开入口
// ---------------------------------------------------------------------------

/**
 * daemonMain — cli.tsx:383 调用入口。
 * args = process.argv slice 之后的 daemon 子命令参数，e.g. ["start"], ["stop"], ["status"]
 */
export async function daemonMain(args: string[]): Promise<void> {
  const subcommand = args[0] ?? 'start'

  // 解析 --workers=<kind>:<uuid>,... 可选参数
  const workersFlag = args.find(a => a.startsWith('--workers='))
  let workerSpecs: WorkerSpec[] = DEFAULT_WORKERS

  if (workersFlag) {
    const raw = workersFlag.slice('--workers='.length)
    workerSpecs = raw.split(',').map(entry => {
      const colon = entry.indexOf(':')
      const kind = colon >= 0 ? entry.slice(0, colon) : entry
      const id = colon >= 0 ? entry.slice(colon + 1) : crypto.randomUUID()
      return { kind, id }
    })
  }

  try {
    switch (subcommand) {
      case 'start':
        await startDaemon(workerSpecs)
        break

      case 'stop':
        await stopDaemon()
        break

      case 'status':
        await statusDaemon()
        break

      case 'restart':
        await restartDaemon(workerSpecs)
        break

      default:
        console.error(
          `Unknown daemon subcommand: "${subcommand}". ` +
            'Available: start | stop | status | restart',
        )
        process.exit(1)
    }
  } catch (err) {
    logForDebugging(`[daemon] daemonMain error: ${String(err)}`)
    console.error(`Daemon error: ${String(err)}`)
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`
}
