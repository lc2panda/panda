// Input: CLI args 数组 + 工作目录
// Output: 启动 tmux-detached bg REPL 进程，注入 CLAUDE_CODE_SESSION_KIND=bg
// Pos: src/cli/ —— bg/daemon spawner 共享模块，D2 daemon 后续复用

import { spawn } from 'child_process'
import { execFileNoThrow } from '../utils/execFileNoThrow.js'
import { isTmuxAvailable } from '../utils/swarm/backends/detection.js'
import { TMUX_COMMAND } from '../utils/swarm/constants.js'

/** 产生新 tmux window 名称：bg-<date>-<suffix> */
function makeTmuxWindowName(sessionId: string): string {
  const suffix = sessionId.slice(0, 8)
  return `bg-${suffix}`
}

export type BgSpawnOptions = {
  /** 工作目录，默认 process.cwd() */
  cwd?: string
  /** 要透传给 CLI 进程的额外 env */
  env?: NodeJS.ProcessEnv
  /** 已命名 tmux session，默认 'claude-bg' */
  tmuxSession?: string
}

export type BgSpawnResult = {
  ok: boolean
  /** 若 ok，子进程 PID（tmux 启动时 = tmux 本身的 PID，不是 REPL 进程 PID） */
  pid?: number
  /** 若 !ok，错误描述 */
  error?: string
}

/** tmux session name 用于 bg sessions */
export const BG_TMUX_SESSION = 'claude-bg'

/**
 * 检测 tmux 是否可用（封装 detection.ts，供 bg.ts/daemon.ts 复用）。
 */
export async function ensureTmuxAvailable(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (process.env.PANDA_TEST_TMUX_AVAILABLE === '1') return { ok: true }
  if (process.env.PANDA_TEST_TMUX_AVAILABLE === '0') {
    return {
      ok: false,
      error:
        'tmux is required for --bg sessions but was not found in PATH.\n' +
        'Install tmux (e.g. `brew install tmux` or `apt install tmux`) then retry.',
    }
  }
  const avail = await isTmuxAvailable()
  if (!avail) {
    return {
      ok: false,
      error:
        'tmux is required for --bg sessions but was not found in PATH.\n' +
        'Install tmux (e.g. `brew install tmux` or `apt install tmux`) then retry.',
    }
  }
  return { ok: true }
}

/**
 * 确保 tmux session 存在（已存在时跳过创建）。
 */
async function ensureTmuxSession(
  sessionName: string,
): Promise<{ ok: boolean; error?: string }> {
  if (process.env.PANDA_TEST_CAPTURE_BG_SPAWN === '1') return { ok: true }
  // 检测是否已存在
  const check = await execFileNoThrow(
    TMUX_COMMAND,
    ['has-session', '-t', sessionName],
    { timeout: 5000, useCwd: false },
  )
  if (check.code === 0) return { ok: true }

  // 不存在则创建 detached session（-d 表示 detached，-s 是 session 名）
  // -x 200 -y 50 给一个合理的 pty 尺寸
  const create = await execFileNoThrow(
    TMUX_COMMAND,
    ['new-session', '-d', '-s', sessionName, '-x', '200', '-y', '50'],
    { timeout: 10000, useCwd: false },
  )
  if (create.code !== 0) {
    return {
      ok: false,
      error: `Failed to create tmux session '${sessionName}': ${create.stderr.trim()}`,
    }
  }
  return { ok: true }
}

/**
 * 在已有 tmux session 里开一个新 window 并执行命令。
 * window 名用 bg-<sessionId 前 8 位> 方便 attach 时识别。
 */
async function openTmuxWindow(
  sessionName: string,
  windowName: string,
  command: string,
): Promise<{ ok: boolean; error?: string }> {
  if (process.env.PANDA_TEST_CAPTURE_BG_SPAWN === '1') {
    const calls = (globalThis as typeof globalThis & {
      __pandaBgSpawnCalls?: Array<[string, string[], unknown]>
    }).__pandaBgSpawnCalls
    calls?.push([
      TMUX_COMMAND,
      ['new-window', '-t', sessionName, '-n', windowName, command],
      { timeout: 10000, useCwd: false },
    ])
    return { ok: true }
  }
  const result = await execFileNoThrow(
    TMUX_COMMAND,
    ['new-window', '-t', sessionName, '-n', windowName, command],
    { timeout: 10000, useCwd: false },
  )
  if (result.code !== 0) {
    return {
      ok: false,
      error: `Failed to open tmux window '${windowName}': ${result.stderr.trim()}`,
    }
  }
  return { ok: true }
}

/**
 * 核心 spawner：用 tmux 在后台启动一个 panda REPL 进程。
 *
 * 注入 CLAUDE_CODE_SESSION_KIND=bg，registerSession() 将自动以 kind='bg' 写入
 * PID registry。REPL.tsx:3792 的 isBgSession() 检测亦依赖此 env。
 *
 * 可在 D2 daemon 模块中以 kind='daemon' 复用，只需传不同 env。
 *
 * @param extraArgs   传给 REPL 的额外参数（如 --resume <id>）
 * @param sessionId   用于生成 window 名的 UUID；若未提供则用随机 8 位 hex
 * @param opts        详见 BgSpawnOptions
 */
export async function spawnBgSession(
  extraArgs: string[] = [],
  sessionId: string = crypto.randomUUID(),
  opts: BgSpawnOptions = {},
): Promise<BgSpawnResult> {
  const tmuxAvail = await ensureTmuxAvailable()
  if (!tmuxAvail.ok) return { ok: false, error: tmuxAvail.error }

  const tmuxSession = opts.tmuxSession ?? BG_TMUX_SESSION
  const cwd = opts.cwd ?? process.cwd()

  // 确保 tmux session 存在
  const sessionResult = await ensureTmuxSession(tmuxSession)
  if (!sessionResult.ok) return { ok: false, error: sessionResult.error }

  // 构造子进程 env：继承 process.env，注入 CLAUDE_CODE_SESSION_KIND
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ...opts.env,
    CLAUDE_CODE_SESSION_KIND: 'bg',
    // cwd 亦通过 CALLER_DIR/PWD 注入，供 CLI 内部 getOriginalCwd() 识别
    CALLER_DIR: cwd,
    PWD: cwd,
  }

  // 把 env 转成 shell 赋值前缀，传给 tmux new-window 的 shell 命令
  // 只透传关键 env（避免命令行过长）
  const envKeys: (keyof typeof childEnv)[] = [
    'CLAUDE_CODE_SESSION_KIND',
    'CALLER_DIR',
    'PWD',
    'ANTHROPIC_API_KEY',
    'CLAUDE_CODE_OAUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
    'CLAUDE_CONFIG_DIR',
    'PANDA_CONFIG_DIR',
    'HOME',
    'PATH',
    'BUN_INSTALL',
  ]
  const envPrefix = envKeys
    .filter(k => childEnv[k] != null)
    .map(k => `${k}=${shellQuote(childEnv[k]!)}`)
    .join(' ')

  const cliPath = process.execPath // bun 或 node
  const mainScript = process.argv[1] ?? '' // dist/cli.js 或 src/entrypoints/cli.tsx

  // 构造完整命令：cd <cwd> && env ... bun cli.js [extraArgs]
  const cdPart = `cd ${shellQuote(cwd)}`
  const execPart = [envPrefix, shellQuote(cliPath), shellQuote(mainScript), ...extraArgs.map(shellQuote)].join(' ')
  const fullCmd = `${cdPart} && ${execPart}`

  const windowName = makeTmuxWindowName(sessionId)
  const winResult = await openTmuxWindow(tmuxSession, windowName, fullCmd)
  if (!winResult.ok) return { ok: false, error: winResult.error }

  return { ok: true }
}

/**
 * 列出当前 claude-bg tmux session 下的所有 window（用于 attach 时显示选择）。
 */
export async function listBgTmuxWindows(
  tmuxSession: string = BG_TMUX_SESSION,
): Promise<string[]> {
  const result = await execFileNoThrow(
    TMUX_COMMAND,
    ['list-windows', '-t', tmuxSession, '-F', '#{window_index}:#{window_name}'],
    { timeout: 5000, useCwd: false },
  )
  if (result.code !== 0) return []
  return result.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
}

/**
 * 把当前终端 attach 到指定 tmux session（阻塞直到用户 detach）。
 * 使用 child_process.spawn + inherit stdio 模式，attach 会接管终端 I/O。
 */
export async function attachToTmuxSession(
  target: string,
): Promise<{ ok: boolean; code: number; error?: string }> {
  return new Promise(resolve => {
    const p = spawn(TMUX_COMMAND, ['attach-session', '-t', target], {
      stdio: 'inherit',
    })
    p.on('error', err => {
      resolve({ ok: false, code: 1, error: err.message })
    })
    p.on('close', code => {
      resolve({ ok: code === 0, code: code ?? 1 })
    })
  })
}

/**
 * 简单 shell 引号转义：将单引号内容转义为 '\''。
 */
function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`
}
