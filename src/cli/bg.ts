// Input: CLI 参数（来自 cli.tsx BG_SESSIONS 路由分支）
// Output: ps / logs / attach / kill / --bg 子命令的终端 I/O
// Pos: src/cli/ —— --bg 后台 session CLI 前端，接线到 PID registry + tmux + sessionEnumerator

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
import { errorMessage, isFsInaccessible } from '../utils/errors.js'
import { isProcessRunning } from '../utils/genericProcessUtils.js'
import { jsonParse } from '../utils/slowOperations.js'
import { logForDebugging } from '../utils/debug.js'
import {
  attachToTmuxSession,
  BG_TMUX_SESSION,
  ensureTmuxAvailable,
  listBgTmuxWindows,
  spawnBgSession,
} from './bgSpawn.js'
import { execFileNoThrow } from '../utils/execFileNoThrow.js'
import { TMUX_COMMAND } from '../utils/swarm/constants.js'

// ─── 内部类型 ────────────────────────────────────────────────────────────────

type PidEntry = {
  pid: number
  sessionId: string
  cwd: string
  startedAt: number
  kind?: string
  name?: string
  status?: string
}

// ─── 内部工具 ────────────────────────────────────────────────────────────────

function getConfigHomeDir(): string {
  return process.env.PANDA_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR ?? getClaudeConfigHomeDir()
}

function getSessionsDir(): string {
  return join(getConfigHomeDir(), 'sessions')
}

/** 读取所有 live PID 文件，过滤 bg kind，dead 进程跳过 */
async function readBgPidFiles(): Promise<PidEntry[]> {
  const dir = getSessionsDir()
  let files: string[]
  try {
    files = await readdir(dir)
  } catch (e) {
    if (!isFsInaccessible(e)) {
      logForDebugging(`[bg] readdir failed: ${errorMessage(e)}`)
    }
    return []
  }

  const result: PidEntry[] = []
  for (const file of files) {
    if (!/^\d+\.json$/.test(file)) continue
    const pid = parseInt(file.slice(0, -5), 10)
    if (!isProcessRunning(pid)) continue
    try {
      const raw = await readFile(join(dir, file), 'utf8')
      const data = jsonParse(raw) as PidEntry
      if (data && typeof data.pid === 'number' && data.kind === 'bg') {
        result.push(data)
      }
    } catch (e) {
      logForDebugging(`[bg] read ${file} failed: ${errorMessage(e)}`)
    }
  }
  return result
}

/** 格式化 startedAt 为可读字符串 */
function fmtAge(startedAt: number): string {
  const diffMs = Date.now() - startedAt
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h${diffMin % 60}m`
}

/** 缩短路径，用 ~ 替代 HOME */
function shortenPath(p: string): string {
  const home = process.env.HOME ?? ''
  if (home && p.startsWith(home)) return '~' + p.slice(home.length)
  return p
}

// ─── Exported handlers ───────────────────────────────────────────────────────

/**
 * `claude ps` — 列出所有 live bg sessions（PID, sessionId, cwd, age, status）。
 */
export const psHandler: (args: string[]) => Promise<void> = async (
  _args: string[],
) => {
  const entries = await readBgPidFiles()
  if (entries.length === 0) {
    console.log('No background sessions running.')
    return
  }
  // Header
  console.log(
    ['PID'.padEnd(8), 'SESSION-ID'.padEnd(38), 'STATUS'.padEnd(10), 'AGE'.padEnd(8), 'CWD']
      .join(' '),
  )
  console.log('─'.repeat(90))
  for (const e of entries) {
    const pid = String(e.pid).padEnd(8)
    const sid = (e.sessionId ?? '?').padEnd(38)
    const status = (e.status ?? 'idle').padEnd(10)
    const age = fmtAge(e.startedAt).padEnd(8)
    const cwd = shortenPath(e.cwd ?? '')
    console.log([pid, sid, status, age, cwd].join(' '))
  }
}

/**
 * `claude logs [sessionId]` — tail 指定 bg session 的 transcript jsonl（最近 20 条）。
 * 若未指定 sessionId，则选列表中第一个 bg session。
 */
export const logsHandler: (
  sessionId: string | undefined,
) => Promise<void> = async (sessionId: string | undefined) => {
  const entries = await readBgPidFiles()
  if (entries.length === 0) {
    console.error('No background sessions running.')
    process.exit(1)
  }

  let target: PidEntry | undefined
  if (sessionId) {
    // 前缀匹配（允许只输入前 8 字符）
    target = entries.find(
      e => e.sessionId === sessionId || e.sessionId.startsWith(sessionId),
    )
    if (!target) {
      console.error(`No bg session found matching: ${sessionId}`)
      console.error('Running sessions:')
      for (const e of entries) {
        console.error(`  ${e.sessionId}  (pid ${e.pid})`)
      }
      process.exit(1)
    }
  } else {
    target = entries[0]
    console.log(`Using session: ${target.sessionId}`)
  }

  // 定位 transcript 文件：~/.pandacc/projects/<sanitized-cwd>/<sessionId>.jsonl
  const configDir = getConfigHomeDir()
  const sanitizedCwd = target.cwd.replace(/\//g, '-')
  const projectDir = join(configDir, 'projects', sanitizedCwd)
  const transcriptPath = join(projectDir, `${target.sessionId}.jsonl`)

  let raw: string
  try {
    raw = await readFile(transcriptPath, 'utf8')
  } catch (e) {
    // 也尝试备用路径：~/.pandacc/projects/-Users-...-cwd/<sid>.jsonl
    const sanitizedCwd2 = target.cwd
      .replace(/^\//, '')
      .replace(/\//g, '-')
    const transcriptPath2 = join(
      configDir,
      'projects',
      `-${sanitizedCwd2}`,
      `${target.sessionId}.jsonl`,
    )
    try {
      raw = await readFile(transcriptPath2, 'utf8')
    } catch {
      console.error(
        `Cannot read transcript for ${target.sessionId}.\n` +
          `Tried:\n  ${transcriptPath}\n  ${transcriptPath2}\n` +
          `Error: ${errorMessage(e)}`,
      )
      process.exit(1)
    }
  }

  // 取最后 20 行非空 JSONL 条目，提取 type/role/text
  const lines = raw.trim().split('\n').filter(Boolean)
  const tail = lines.slice(-20)

  console.log(`\n── Transcript tail (${target.sessionId.slice(0, 8)}…) ──`)
  for (const line of tail) {
    try {
      const entry = jsonParse(line) as Record<string, unknown>
      const type = entry.type as string | undefined
      const role = (entry as { message?: { role?: string } }).message?.role
      const ts = entry.timestamp
        ? new Date(entry.timestamp as number).toLocaleTimeString()
        : ''

      if (type === 'user' && role === 'user') {
        const content = (entry as { message?: { content?: unknown } }).message
          ?.content
        const text =
          typeof content === 'string'
            ? content
            : Array.isArray(content)
              ? content
                  .filter((b): b is { type: 'text'; text: string } => b?.type === 'text')
                  .map(b => b.text)
                  .join('')
              : ''
        if (text.trim()) {
          console.log(`[${ts}] user: ${text.slice(0, 120)}`)
        }
      } else if (type === 'assistant') {
        const content = (entry as { message?: { content?: unknown } }).message
          ?.content
        const text = Array.isArray(content)
          ? content
              .filter((b): b is { type: 'text'; text: string } => b?.type === 'text')
              .map(b => b.text)
              .join('')
          : ''
        if (text.trim()) {
          console.log(`[${ts}] assistant: ${text.slice(0, 120)}`)
        }
      }
    } catch {
      // 跳过无法解析的行
    }
  }
  console.log('── end ──\n')
}

/**
 * `claude attach [sessionId]` — attach 到指定 bg session 的 tmux window。
 * 若未指定，则 attach 到 claude-bg session（用户可在其中切换 window）。
 */
export const attachHandler: (
  sessionId: string | undefined,
) => Promise<void> = async (sessionId: string | undefined) => {
  const tmuxCheck = await ensureTmuxAvailable()
  if (!tmuxCheck.ok) {
    console.error(tmuxCheck.error)
    process.exit(1)
  }

  if (!sessionId) {
    // 直接 attach 到整个 claude-bg tmux session
    console.log(`Attaching to tmux session '${BG_TMUX_SESSION}'...`)
    console.log('(Use Ctrl-b d to detach, Ctrl-b n/p to switch windows)\n')
    const result = await attachToTmuxSession(BG_TMUX_SESSION)
    if (!result.ok) {
      console.error(`attach failed: ${result.error ?? `exit code ${result.code}`}`)
      process.exit(result.code)
    }
    return
  }

  // 有 sessionId 时：在 claude-bg 下找对应 window（window 名为 bg-<sid[:8]>）
  const entries = await readBgPidFiles()
  const target = entries.find(
    e => e.sessionId === sessionId || e.sessionId.startsWith(sessionId),
  )
  if (!target) {
    console.error(`No bg session found matching: ${sessionId}`)
    process.exit(1)
  }

  const windowName = `bg-${target.sessionId.slice(0, 8)}`
  const tmuxTarget = `${BG_TMUX_SESSION}:${windowName}`
  console.log(`Attaching to ${tmuxTarget}...`)
  const result = await attachToTmuxSession(tmuxTarget)
  if (!result.ok) {
    // window 名匹配失败时 fallback 到 session-level attach
    console.log(
      `Window '${windowName}' not found in session; attaching to session level instead.`,
    )
    const fallback = await attachToTmuxSession(BG_TMUX_SESSION)
    if (!fallback.ok) {
      console.error(
        `attach failed: ${fallback.error ?? `exit code ${fallback.code}`}`,
      )
      process.exit(fallback.code)
    }
  }
}

/**
 * `claude kill [sessionId]` — 终止指定 bg session 进程（SIGTERM → SIGKILL 5s 后）。
 * 若未指定，则终止所有 bg sessions（需确认）。
 */
export const killHandler: (
  sessionId: string | undefined,
) => Promise<void> = async (sessionId: string | undefined) => {
  const entries = await readBgPidFiles()
  if (entries.length === 0) {
    console.log('No background sessions running.')
    return
  }

  let targets: PidEntry[]
  if (sessionId) {
    const target = entries.find(
      e => e.sessionId === sessionId || e.sessionId.startsWith(sessionId),
    )
    if (!target) {
      console.error(`No bg session found matching: ${sessionId}`)
      process.exit(1)
    }
    targets = [target]
  } else {
    // kill all — 先打印列表再执行
    targets = entries
    console.log(`Will kill ${targets.length} bg session(s):`)
    for (const e of targets) {
      console.log(`  pid ${e.pid}  ${e.sessionId}`)
    }
  }

  for (const e of targets) {
    try {
      process.kill(e.pid, 'SIGTERM')
      console.log(`Sent SIGTERM to pid ${e.pid} (${e.sessionId.slice(0, 8)}…)`)

      // 等待最多 5 秒再 SIGKILL
      let waited = 0
      while (waited < 5000 && isProcessRunning(e.pid)) {
        await new Promise(r => setTimeout(r, 200))
        waited += 200
      }
      if (isProcessRunning(e.pid)) {
        process.kill(e.pid, 'SIGKILL')
        console.log(`Sent SIGKILL to pid ${e.pid} (did not exit within 5s)`)
      } else {
        console.log(`pid ${e.pid} exited cleanly.`)
      }
    } catch (err) {
      const msg = errorMessage(err)
      // ESRCH = no such process（可能已退出），视为正常
      if (!msg.includes('ESRCH')) {
        console.error(`Failed to kill pid ${e.pid}: ${msg}`)
      } else {
        console.log(`pid ${e.pid} already exited.`)
      }
    }
  }
}

/**
 * `claude --bg [passthrough args]` — 在 tmux 后台启动一个新的 panda REPL session。
 *
 * 过滤掉 --bg / --background flag 本身，其余参数透传给 REPL（如 --resume <id>、
 * --model <model>、--dangerously-skip-permissions 等）。
 *
 * 流程：
 *   1. 检测 tmux 可用性
 *   2. 确保 claude-bg tmux session 存在
 *   3. 在其中开新 window，注入 CLAUDE_CODE_SESSION_KIND=bg
 *   4. 打印 attach 提示
 */
export const handleBgFlag: (args: string[]) => Promise<void> = async (
  args: string[],
) => {
  const tmuxCheck = await ensureTmuxAvailable()
  if (!tmuxCheck.ok) {
    console.error(tmuxCheck.error)
    process.exit(1)
  }

  // 过滤 --bg / --background flag
  const passthroughArgs = args.filter(a => a !== '--bg' && a !== '--background')

  // 生成一个 sessionId 用于 window 命名（spawn 内 REPL 会产生自己的 sessionId，
  // 这里只是一个占位符供 window 名使用）
  const windowId = crypto.randomUUID()

  const cwd = process.cwd()
  console.log(`Starting bg session in tmux session '${BG_TMUX_SESSION}'...`)

  const result = await spawnBgSession(passthroughArgs, windowId, { cwd })
  if (!result.ok) {
    console.error(`Failed to start bg session: ${result.error}`)
    process.exit(1)
  }

  // 等一下让 window 出现，再列出 windows
  await new Promise(r => setTimeout(r, 300))
  const windows = await listBgTmuxWindows()

  console.log(`\nBackground session started. Windows in '${BG_TMUX_SESSION}':`)
  for (const w of windows) {
    console.log(`  ${w}`)
  }
  console.log(`\nTo attach:   panda attach`)
  console.log(`To list:     panda ps`)
  console.log(`To kill:     panda kill`)
}
