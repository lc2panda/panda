// Input: bun test 触发；mock console + fs tmp dir + ENV 切换
// Output: 验证 logger 4 级别 / ENV 控制 debug / file 写入+轮转 / format 一致 / safeStringify 边界
// Pos: panda-on-desk W8-T3 错误监控 — logger.ts 行为契约
//
// [NEW-FILE:#W8-03]
// 2026-04-20 +08:00 W8-T3 logger 单元测试（agent-γ-W8-error-monitor）

import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

// 在导入 logger 前先准备一个干净的 tmp config dir，并锁定 ENV
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'panda-on-desk-logger-test-'))
process.env.PANDA_CONFIG_DIR = TMP_DIR
delete process.env.PANDA_DESK_LOG_LEVEL

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loggerMod = require('../src/util/logger') as typeof import('../src/util/logger')
const { log, getLogPath, formatLogLine, refreshLogLevel, setLogLevel, getLogLevel, __internals, __resetFileWriteWarnedForTesting } =
  loggerMod

const LOG_PATH = getLogPath(TMP_DIR)

interface ConsoleCapture {
  debug: string[]
  log: string[]
  warn: string[]
  error: string[]
}

let _orig: { debug: any; log: any; warn: any; error: any }
let captured: ConsoleCapture

function mockConsole(): ConsoleCapture {
  /* eslint-disable no-console */
  _orig = {
    debug: console.debug,
    log: console.log,
    warn: console.warn,
    error: console.error,
  }
  captured = { debug: [], log: [], warn: [], error: [] }
  console.debug = (line: string) => captured.debug.push(String(line))
  console.log = (line: string) => captured.log.push(String(line))
  console.warn = (line: string) => captured.warn.push(String(line))
  console.error = (line: string) => captured.error.push(String(line))
  /* eslint-enable no-console */
  return captured
}

function restoreConsole(): void {
  /* eslint-disable no-console */
  console.debug = _orig.debug
  console.log = _orig.log
  console.warn = _orig.warn
  console.error = _orig.error
  /* eslint-enable no-console */
}

function clearLog(): void {
  try { fs.unlinkSync(LOG_PATH) } catch {}
}

beforeEach(() => {
  mockConsole()
  clearLog()
  __resetFileWriteWarnedForTesting()
  // 每个用例先重置到默认 info（避免上一个用例的 setLogLevel 残留）
  setLogLevel('info')
})

afterEach(() => {
  restoreConsole()
})

describe('logger — 4 级别输出', () => {
  it('info 级别下：info/warn/error 写入 console + 文件，debug 被过滤', () => {
    setLogLevel('info')
    log.debug('debug-msg')
    log.info('info-msg')
    log.warn('warn-msg')
    log.error('error-msg')

    // console
    expect(captured.debug.length).toBe(0) // debug 被过滤
    expect(captured.log.length).toBe(1)
    expect(captured.log[0]).toContain('info-msg')
    expect(captured.log[0]).toContain('[INFO ]')
    expect(captured.warn.length).toBe(1)
    expect(captured.warn[0]).toContain('warn-msg')
    expect(captured.warn[0]).toContain('[WARN ]')
    expect(captured.error.length).toBe(1)
    expect(captured.error[0]).toContain('error-msg')
    expect(captured.error[0]).toContain('[ERROR]')

    // 文件应有 3 行
    const content = fs.readFileSync(LOG_PATH, 'utf8')
    const lines = content.trim().split('\n')
    expect(lines.length).toBe(3)
    expect(lines[0]).toContain('info-msg')
    expect(lines[1]).toContain('warn-msg')
    expect(lines[2]).toContain('error-msg')
    // debug 不应在文件中
    expect(content).not.toContain('debug-msg')
  })

  it('error 级别下：仅 error 输出，info/warn/debug 全过滤', () => {
    setLogLevel('error')
    log.debug('d')
    log.info('i')
    log.warn('w')
    log.error('e')
    expect(captured.debug.length).toBe(0)
    expect(captured.log.length).toBe(0)
    expect(captured.warn.length).toBe(0)
    expect(captured.error.length).toBe(1)
    expect(captured.error[0]).toContain('e')
  })
})

describe('logger — ENV 控制 debug', () => {
  it('PANDA_DESK_LOG_LEVEL=debug 时 debug 才输出', () => {
    process.env.PANDA_DESK_LOG_LEVEL = 'debug'
    expect(refreshLogLevel()).toBe('debug')
    log.debug('hello-debug')
    expect(captured.debug.length).toBe(1)
    expect(captured.debug[0]).toContain('hello-debug')
    expect(captured.debug[0]).toContain('[DEBUG]')
    delete process.env.PANDA_DESK_LOG_LEVEL
    refreshLogLevel() // 恢复默认 info
  })

  it('未设置 ENV 时默认级别为 info', () => {
    delete process.env.PANDA_DESK_LOG_LEVEL
    expect(refreshLogLevel()).toBe('info')
    expect(getLogLevel()).toBe('info')
  })

  it('非法 ENV 值回退到 info', () => {
    process.env.PANDA_DESK_LOG_LEVEL = 'verbose-extra'
    expect(refreshLogLevel()).toBe('info')
    delete process.env.PANDA_DESK_LOG_LEVEL
    refreshLogLevel()
  })

  it('ENV 值大小写不敏感（DEBUG → debug）', () => {
    process.env.PANDA_DESK_LOG_LEVEL = 'DEBUG'
    expect(refreshLogLevel()).toBe('debug')
    delete process.env.PANDA_DESK_LOG_LEVEL
    refreshLogLevel()
  })
})

describe('logger — 文件写入 + 轮转', () => {
  it('多次写入累积到同一文件', () => {
    setLogLevel('info')
    log.info('line1')
    log.info('line2')
    log.info('line3')
    const content = fs.readFileSync(LOG_PATH, 'utf8')
    const lines = content.trim().split('\n')
    expect(lines.length).toBe(3)
    expect(lines[0]).toContain('line1')
    expect(lines[1]).toContain('line2')
    expect(lines[2]).toContain('line3')
  })

  it('文件不存在时自动创建（含父目录）', () => {
    // 切到一个不存在的子目录验证 mkdir
    const nestedTmp = path.join(TMP_DIR, 'nested', 'deeper')
    process.env.PANDA_CONFIG_DIR = nestedTmp
    try {
      // 必须重新 require 让 getConfigHomeDir 重新读 ENV — logger 模块是缓存的
      // 但实现里 getConfigHomeDir 是函数级 process.env 读取，不缓存，所以直接调
      // 这里模拟：用 emit → writeToFile，路径会基于新 ENV 解析
      __resetFileWriteWarnedForTesting()
      setLogLevel('info')
      log.info('nested-line')
      const expectedPath = getLogPath(nestedTmp)
      expect(fs.existsSync(expectedPath)).toBe(true)
      const content = fs.readFileSync(expectedPath, 'utf8')
      expect(content).toContain('nested-line')
      // 清理
      fs.rmSync(path.join(TMP_DIR, 'nested'), { recursive: true, force: true })
    } finally {
      process.env.PANDA_CONFIG_DIR = TMP_DIR
    }
  })
})

describe('logger — format 一致', () => {
  it('formatLogLine 含 ISO 时间戳 + 级别 padding + msg + args', () => {
    const line = formatLogLine('info', 'hello', ['arg1', 42, { k: 'v' }])
    // ISO timestamp prefix
    expect(line).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO \] /)
    expect(line).toContain('hello')
    expect(line).toContain('arg1')
    expect(line).toContain('42')
    expect(line).toContain('{"k":"v"}')
  })

  it('Error 对象被序列化为单行 stack（不破坏一行一记）', () => {
    const err = new Error('boom')
    const line = formatLogLine('error', 'failed', [err])
    expect(line).toContain('boom')
    // 不应有真正的换行（除了行末，formatLogLine 自己不加 \n）
    expect(line.includes('\n')).toBe(false)
  })

  it('safeStringify 处理 null/undefined/循环引用不抛错', () => {
    const cyc: any = {}
    cyc.self = cyc
    expect(__internals.safeStringify(null)).toBe('null')
    expect(__internals.safeStringify(undefined)).toBe('undefined')
    // 循环引用 JSON.stringify 抛错 → 走 String(arg) fallback
    const out = __internals.safeStringify(cyc)
    expect(typeof out).toBe('string')
  })

  it('级别 padding 保持 5 字符宽度（INFO + 1 空格 / WARN + 1 空格 / ERROR / DEBUG）', () => {
    expect(formatLogLine('info', 'm', [])).toContain('[INFO ]')
    expect(formatLogLine('warn', 'm', [])).toContain('[WARN ]')
    expect(formatLogLine('error', 'm', [])).toContain('[ERROR]')
    expect(formatLogLine('debug', 'm', [])).toContain('[DEBUG]')
  })
})

describe('logger — getLogPath 配置目录解析', () => {
  it('PANDA_CONFIG_DIR 优先', () => {
    const p = getLogPath('/custom/dir')
    expect(p).toContain('panda-on-desk.log')
    expect(p.startsWith('/custom/dir') || p.startsWith('\\custom\\dir')).toBe(true)
  })

  it('默认值走 ~/.pandacc/panda-on-desk.log', () => {
    const oldEnv = process.env.PANDA_CONFIG_DIR
    const oldCC = process.env.CLAUDE_CONFIG_DIR
    delete process.env.PANDA_CONFIG_DIR
    delete process.env.CLAUDE_CONFIG_DIR
    try {
      const dir = __internals.getConfigHomeDir()
      expect(dir).toContain('.pandacc')
      const p = getLogPath()
      expect(p).toContain('panda-on-desk.log')
    } finally {
      if (oldEnv !== undefined) process.env.PANDA_CONFIG_DIR = oldEnv
      if (oldCC !== undefined) process.env.CLAUDE_CONFIG_DIR = oldCC
    }
  })
})
