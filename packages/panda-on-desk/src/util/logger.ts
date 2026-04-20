// Input:  log.{debug,info,warn,error}(msg, ...args) 调用 + ENV PANDA_DESK_LOG_LEVEL
// Output: 4 级别带时间戳/级别的格式化输出 → console + ~/.pandacc/panda-on-desk.log
//         (debug 默认静默；ENV PANDA_DESK_LOG_LEVEL=debug 才打开)
// Pos:    panda-on-desk 主进程错误监控 — main.ts / bridge/server.ts / 关键 try/catch 替换 silent 吞错
//         严守 anthropic byte-equal — 仅 node 内置 fs/console；继承 log-rotate.ts 轮转
//
// [NEW-FILE:#W8-02]
// 2026-04-20 +08:00 W8-T3 错误监控 + 用户可见诊断日志（agent-γ-W8-error-monitor）
//
// 设计：
//   · 4 级别 LogLevel: debug(0) < info(1) < warn(2) < error(3)
//   · ENV PANDA_DESK_LOG_LEVEL (debug|info|warn|error) 控制最低输出阈值；默认 info
//   · format: '[YYYY-MM-DDTHH:mm:ss.sssZ] [LEVEL] msg ...args'（一行 JSON.stringify args）
//   · sink: console 走 native console.{debug/log/warn/error}；
//          file 走 rotatedAppend(LOG_PATH, line, MAX_BYTES)
//   · LOG_PATH: ~/.pandacc/panda-on-desk.log（与 runtime.json 同目录便于排查）
//   · 失败兜底：写文件抛错时只 console.warn 一次，不再二次抛
//   · 0 新依赖 — 纯 fs / console / os.homedir / path.join
//
// 用法：
//   import { log } from './util/logger.js'
//   log.info('bridge IPC server listening on 127.0.0.1:%d', port)
//   try { ... } catch (err) { log.error('startBridgeServer failed', err) }

import { homedir } from 'node:os'
import { join } from 'node:path'

import { rotatedAppend, DEFAULT_MAX_BYTES } from './log-rotate.js'

// ─────────────────────────────────────────────────────────────────────────────
// 级别定义
// ─────────────────────────────────────────────────────────────────────────────

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// ─────────────────────────────────────────────────────────────────────────────
// 配置目录解析（与 bridge/server.ts getConfigHomeDir 1:1 对齐）
// ─────────────────────────────────────────────────────────────────────────────

function getConfigHomeDir(): string {
  const fromEnv = process.env.PANDA_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR
  return (fromEnv ?? join(homedir(), '.pandacc')).normalize('NFC')
}

export const LOG_FILE_NAME = 'panda-on-desk.log'

export function getLogPath(configDir = getConfigHomeDir()): string {
  return join(configDir, LOG_FILE_NAME)
}

// ─────────────────────────────────────────────────────────────────────────────
// 当前最小级别 — 由 ENV 控制；测试可重置
// ─────────────────────────────────────────────────────────────────────────────

function readLevelFromEnv(): LogLevel {
  const raw = (process.env.PANDA_DESK_LOG_LEVEL ?? '').toLowerCase().trim()
  if ((LOG_LEVELS as readonly string[]).includes(raw)) return raw as LogLevel
  return 'info'
}

let _minLevel: LogLevel = readLevelFromEnv()

/** 测试用 — 强制刷新 ENV 读取（mock ENV 后调用） */
export function refreshLogLevel(): LogLevel {
  _minLevel = readLevelFromEnv()
  return _minLevel
}

/** 当前生效的最小级别（debug 仅在 ENV=debug 时输出） */
export function getLogLevel(): LogLevel {
  return _minLevel
}

/** 测试用 — 直接覆盖（避免改 process.env） */
export function setLogLevel(level: LogLevel): void {
  _minLevel = level
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[_minLevel]
}

// ─────────────────────────────────────────────────────────────────────────────
// 格式化
// ─────────────────────────────────────────────────────────────────────────────

function safeStringify(arg: unknown): string {
  if (arg === undefined) return 'undefined'
  if (arg === null) return 'null'
  if (typeof arg === 'string') return arg
  if (typeof arg === 'number' || typeof arg === 'boolean' || typeof arg === 'bigint') {
    return String(arg)
  }
  if (arg instanceof Error) {
    // 同时保留 stack 便于排查；单行化（替换 \n 为 ' | '）防破坏日志一行一记
    const stack = arg.stack ?? `${arg.name}: ${arg.message}`
    return stack.replace(/\r?\n\s*/g, ' | ')
  }
  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

/**
 * 格式化一条日志（不含尾部换行）
 * 示例：[2026-04-20T08:30:00.123Z] [INFO ] bridge listening port=1455
 */
export function formatLogLine(level: LogLevel, msg: string, args: unknown[]): string {
  const ts = new Date().toISOString()
  const lvl = level.toUpperCase().padEnd(5, ' ')
  const tail = args.length === 0 ? '' : ' ' + args.map(safeStringify).join(' ')
  return `[${ts}] [${lvl}] ${msg}${tail}`
}

// ─────────────────────────────────────────────────────────────────────────────
// File sink — 失败容错，仅 warn 一次，不再二次抛
// ─────────────────────────────────────────────────────────────────────────────

let _fileWriteWarned = false
const MAX_BYTES = DEFAULT_MAX_BYTES // 1MB；继承 log-rotate

function writeToFile(line: string): void {
  try {
    // ensure parent dir exists（与 bridge/server.ts writeRuntimeJson 同模式）
    const path = getLogPath()
    const dir = path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')))
    if (dir) {
      // 懒加载 fs.mkdirSync 仅在首次需要时调；rotatedAppend 内部用 appendFileSync
      // why: 不在模块顶部 mkdir — 测试可控制 PANDA_CONFIG_DIR 后再触发首条日志
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('node:fs') as typeof import('node:fs')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    }
    rotatedAppend(path, line + '\n', MAX_BYTES)
  } catch (err) {
    if (!_fileWriteWarned) {
      _fileWriteWarned = true
      // 直接走 native console.warn — 避免递归走 logger
      // eslint-disable-next-line no-console
      console.warn('[panda-on-desk:logger] file sink disabled:', (err as Error)?.message)
    }
  }
}

/** 测试用 — 重置「文件写入失败已 warn」节流标志 */
export function __resetFileWriteWarnedForTesting(): void {
  _fileWriteWarned = false
}

// ─────────────────────────────────────────────────────────────────────────────
// Console sink — 按级别选择 native console 方法
// ─────────────────────────────────────────────────────────────────────────────

function writeToConsole(level: LogLevel, line: string): void {
  // why: 4 个 console 方法分级 — 让 stderr/stdout 分流（warn/error → stderr）
  /* eslint-disable no-console */
  switch (level) {
    case 'debug':
      console.debug(line)
      return
    case 'info':
      console.log(line)
      return
    case 'warn':
      console.warn(line)
      return
    case 'error':
      console.error(line)
      return
  }
  /* eslint-enable no-console */
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — log.{debug,info,warn,error}
// ─────────────────────────────────────────────────────────────────────────────

function emit(level: LogLevel, msg: string, args: unknown[]): void {
  if (!shouldLog(level)) return
  const line = formatLogLine(level, msg, args)
  writeToConsole(level, line)
  writeToFile(line)
}

export const log = {
  debug: (msg: string, ...args: unknown[]) => emit('debug', msg, args),
  info: (msg: string, ...args: unknown[]) => emit('info', msg, args),
  warn: (msg: string, ...args: unknown[]) => emit('warn', msg, args),
  error: (msg: string, ...args: unknown[]) => emit('error', msg, args),
}

// 测试 / 诊断辅助 export
export const __internals = {
  formatLogLine,
  safeStringify,
  shouldLog,
  readLevelFromEnv,
  getConfigHomeDir,
}
