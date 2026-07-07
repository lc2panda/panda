// Input: bg.ts handler 函数 + mock PID 注册表 + mock bgSpawn
// Output: bun test 断言结果
// Pos: src/cli/__tests__/ —— bg.ts 5 个 handler 单元测试

import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test'
import { join } from 'path'
import { tmpdir } from 'os'

// ─── 建立隔离的配置目录（避免读取真实 ~/.pandacc） ───────────────────────────

const TEST_CONFIG_DIR = join(tmpdir(), `panda-bg-test-${Date.now()}`)

// mock envUtils 返回测试专用目录
mock.module('../../utils/envUtils.js', () => ({
  getClaudeConfigHomeDir: () => TEST_CONFIG_DIR,
}))

// mock genericProcessUtils.isProcessRunning：总返回 true（测试场景假设进程存活）
mock.module('../../utils/genericProcessUtils.js', () => ({
  isProcessRunning: (pid: number) => pid > 0,
}))

// mock bgSpawn：各函数按需覆盖
let mockSpawnResult = { ok: true }
let mockEnsureTmuxResult: { ok: true } | { ok: false; error: string } = {
  ok: true,
}
let mockAttachResult = { ok: true, code: 0 }
let mockListWindows: string[] = ['0:bg-11111111', '1:bg-22222222']

mock.module('../bgSpawn.js', () => ({
  spawnBgSession: async () => mockSpawnResult,
  ensureTmuxAvailable: async () => mockEnsureTmuxResult,
  attachToTmuxSession: async () => mockAttachResult,
  listBgTmuxWindows: async () => mockListWindows,
  BG_TMUX_SESSION: 'claude-bg',
}))

// mock execFileNoThrow
mock.module('../../utils/execFileNoThrow.js', () => ({
  execFileNoThrow: async () => ({ stdout: '', stderr: '', code: 0 }),
}))

// mock swarm/constants
mock.module('../../utils/swarm/constants.js', () => ({
  TMUX_COMMAND: 'tmux',
}))

// mock slowOperations（jsonParse 用于读取 PID 文件）
mock.module('../../utils/slowOperations.js', () => ({
  jsonParse: (s: string) => JSON.parse(s),
  jsonStringify: (v: unknown) => JSON.stringify(v),
}))

// mock debug
mock.module('../../utils/debug.js', () => ({
  logForDebugging: () => {},
}))

// mock errors
mock.module('../../utils/errors.js', () => ({
  errorMessage: (e: unknown) =>
    e instanceof Error ? e.message : String(e),
  isFsInaccessible: () => false,
}))

// ─── 写入 mock PID 文件 ───────────────────────────────────────────────────────

import { mkdir, writeFile, rm } from 'fs/promises'

const SESSIONS_DIR = join(TEST_CONFIG_DIR, 'sessions')

type PidEntry = {
  pid: number
  sessionId: string
  cwd: string
  startedAt: number
  kind: string
  status?: string
}

const MOCK_BG_ENTRIES: PidEntry[] = [
  {
    pid: 12345,
    sessionId: '11111111-2222-3333-4444-555555555555',
    cwd: '/Users/test/project',
    startedAt: Date.now() - 60000,
    kind: 'bg',
    status: 'idle',
  },
  {
    pid: 23456,
    sessionId: '22222222-3333-4444-5555-666666666666',
    cwd: '/Users/test/another',
    startedAt: Date.now() - 120000,
    kind: 'bg',
    status: 'idle',
  },
]

// non-bg 条目（应被 psHandler 过滤）
const MOCK_INTERACTIVE_ENTRY: PidEntry = {
  pid: 99999,
  sessionId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  cwd: '/Users/test/interactive',
  startedAt: Date.now() - 30000,
  kind: 'interactive',
}

async function setupMockPidFiles(): Promise<void> {
  await mkdir(SESSIONS_DIR, { recursive: true })
  for (const e of [...MOCK_BG_ENTRIES, MOCK_INTERACTIVE_ENTRY]) {
    await writeFile(
      join(SESSIONS_DIR, `${e.pid}.json`),
      JSON.stringify(e),
      'utf8',
    )
  }
}

async function cleanupMockPidFiles(): Promise<void> {
  await rm(TEST_CONFIG_DIR, { recursive: true, force: true })
}

// ─── 捕获 console 输出 ────────────────────────────────────────────────────────

function captureConsole(): {
  logs: string[]
  errors: string[]
  restore: () => void
} {
  const logs: string[] = []
  const errors: string[] = []
  const origLog = console.log
  const origError = console.error
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '))
  console.error = (...args: unknown[]) =>
    errors.push(args.map(String).join(' '))
  return {
    logs,
    errors,
    restore: () => {
      console.log = origLog
      console.error = origError
    },
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('bg.ts — psHandler', () => {
  beforeEach(async () => {
    process.env.PANDA_CONFIG_DIR = TEST_CONFIG_DIR
    await setupMockPidFiles()
  })

  test('列出 bg sessions，过滤 interactive', async () => {
    const { psHandler } = await import('../bg.js')
    const cap = captureConsole()
    try {
      await psHandler([])
    } finally {
      cap.restore()
    }
    // 应包含两个 bg session 的 sessionId 片段
    const allOutput = cap.logs.join('\n')
    expect(allOutput).toContain('11111111')
    expect(allOutput).toContain('22222222')
    // 不应包含 interactive session
    expect(allOutput).not.toContain('aaaaaaaa')
  })

  test('无 bg sessions 时输出提示', async () => {
    // 清除所有 pid 文件
    await rm(SESSIONS_DIR, { recursive: true, force: true })
    await mkdir(SESSIONS_DIR, { recursive: true })

    const { psHandler } = await import('../bg.js')
    const cap = captureConsole()
    try {
      await psHandler([])
    } finally {
      cap.restore()
    }
    expect(cap.logs.join('\n')).toContain('No background sessions')
  })

  // 确保 cleanup
  afterEach(async () => {
    await cleanupMockPidFiles()
  })
})

describe('bg.ts — killHandler', () => {
  beforeEach(async () => {
    process.env.PANDA_CONFIG_DIR = TEST_CONFIG_DIR
    await setupMockPidFiles()
  })

  test('kill 指定 sessionId 前缀能找到 target', async () => {
    const killed: number[] = []
    const origKill = process.kill.bind(process)
    process.kill = (pid: number, _sig?: string | number) => {
      killed.push(pid)
      return true as const
    }

    // isProcessRunning: 收到 SIGTERM 后立即返回 false（进程"已退出"）
    mock.module('../../utils/genericProcessUtils.js', () => ({
      isProcessRunning: (pid: number) => !killed.includes(pid),
    }))

    const { killHandler } = await import('../bg.js')
    const cap = captureConsole()
    try {
      // 11111111 是 MOCK_BG_ENTRIES[0] 的 sessionId 前缀
      await killHandler('11111111')
    } finally {
      cap.restore()
      process.kill = origKill
    }
    expect(killed).toContain(12345)
    expect(killed).not.toContain(23456)
  })

  test('kill 不存在的 sessionId 打印错误并 exit 1', async () => {
    const { killHandler } = await import('../bg.js')
    const cap = captureConsole()
    let exitCode: number | undefined
    const origExit = process.exit.bind(process)
    process.exit = (code: number) => {
      exitCode = code
      throw new Error(`process.exit(${code})`)
    }
    try {
      await killHandler('nonexistent-id')
    } catch {
      // expected throw from mocked process.exit
    } finally {
      cap.restore()
      process.exit = origExit
    }
    expect(exitCode).toBe(1)
    expect(cap.errors.join('\n')).toContain('No bg session found')
  })

  afterEach(async () => {
    await cleanupMockPidFiles()
  })
})

describe('bg.ts — attachHandler', () => {
  beforeEach(async () => {
    await setupMockPidFiles()
    mockEnsureTmuxResult = { ok: true }
    mockAttachResult = { ok: true, code: 0 }
  })

  test('无 sessionId 时 attach 到整个 claude-bg session', async () => {
    const attachCalls: string[] = []
    mock.module('../bgSpawn.js', () => ({
      ensureTmuxAvailable: async () => ({ ok: true }),
      attachToTmuxSession: async (target: string) => {
        attachCalls.push(target)
        return { ok: true, code: 0 }
      },
      listBgTmuxWindows: async () => [],
      BG_TMUX_SESSION: 'claude-bg',
      spawnBgSession: async () => ({ ok: true }),
    }))

    const { attachHandler } = await import('../bg.js')
    const cap = captureConsole()
    try {
      await attachHandler(undefined)
    } finally {
      cap.restore()
    }
    expect(attachCalls.some(t => t === 'claude-bg')).toBe(true)
  })

  test('tmux 不可用时打印错误并 exit 1', async () => {
    mock.module('../bgSpawn.js', () => ({
      ensureTmuxAvailable: async () => ({
        ok: false,
        error: 'tmux not found',
      }),
      attachToTmuxSession: async () => ({ ok: true, code: 0 }),
      listBgTmuxWindows: async () => [],
      BG_TMUX_SESSION: 'claude-bg',
      spawnBgSession: async () => ({ ok: true }),
    }))

    let exitCode: number | undefined
    const origExit = process.exit.bind(process)
    process.exit = (code: number) => {
      exitCode = code
      throw new Error(`process.exit(${code})`)
    }

    const { attachHandler } = await import('../bg.js')
    const cap = captureConsole()
    try {
      await attachHandler(undefined)
    } catch {
      // expected
    } finally {
      cap.restore()
      process.exit = origExit
    }
    expect(exitCode).toBe(1)
    expect(cap.errors.join('\n')).toContain('tmux')
  })

  afterEach(async () => {
    await cleanupMockPidFiles()
  })
})

describe('bg.ts — handleBgFlag', () => {
  beforeEach(async () => {
    process.env.PANDA_CONFIG_DIR = TEST_CONFIG_DIR
    await setupMockPidFiles()
  })

  test('tmux 不可用时 exit 1', async () => {
    mock.module('../bgSpawn.js', () => ({
      ensureTmuxAvailable: async () => ({
        ok: false,
        error: 'tmux is required',
      }),
      spawnBgSession: async () => ({ ok: true }),
      listBgTmuxWindows: async () => [],
      BG_TMUX_SESSION: 'claude-bg',
      attachToTmuxSession: async () => ({ ok: true, code: 0 }),
    }))

    let exitCode: number | undefined
    const origExit = process.exit.bind(process)
    process.exit = (code: number) => {
      exitCode = code
      throw new Error(`exit(${code})`)
    }

    const { handleBgFlag } = await import('../bg.js')
    const cap = captureConsole()
    try {
      await handleBgFlag(['--bg'])
    } catch {
      // expected
    } finally {
      cap.restore()
      process.exit = origExit
    }
    expect(exitCode).toBe(1)
  })

  test('spawn 失败时 exit 1', async () => {
    mock.module('../bgSpawn.js', () => ({
      ensureTmuxAvailable: async () => ({ ok: true }),
      spawnBgSession: async () => ({
        ok: false,
        error: 'tmux spawn failed',
      }),
      listBgTmuxWindows: async () => [],
      BG_TMUX_SESSION: 'claude-bg',
      attachToTmuxSession: async () => ({ ok: true, code: 0 }),
    }))

    let exitCode: number | undefined
    const origExit = process.exit.bind(process)
    process.exit = (code: number) => {
      exitCode = code
      throw new Error(`exit(${code})`)
    }

    const { handleBgFlag } = await import('../bg.js')
    const cap = captureConsole()
    try {
      await handleBgFlag(['--bg'])
    } catch {
      // expected
    } finally {
      cap.restore()
      process.exit = origExit
    }
    expect(exitCode).toBe(1)
    expect(cap.errors.join('\n')).toContain('Failed to start bg session')
  })

  test('--bg / --background 参数被过滤，不传给 REPL', async () => {
    const spawnCalls: string[][] = []
    mock.module('../bgSpawn.js', () => ({
      ensureTmuxAvailable: async () => ({ ok: true }),
      spawnBgSession: async (extraArgs: string[]) => {
        spawnCalls.push(extraArgs)
        return { ok: true }
      },
      listBgTmuxWindows: async () => [],
      BG_TMUX_SESSION: 'claude-bg',
      attachToTmuxSession: async () => ({ ok: true, code: 0 }),
    }))

    const { handleBgFlag } = await import('../bg.js')
    const cap = captureConsole()
    try {
      await handleBgFlag(['--bg', '--model', 'claude-opus-4-7'])
    } finally {
      cap.restore()
    }

    expect(spawnCalls.length).toBeGreaterThan(0)
    const args = spawnCalls[0]
    expect(args).not.toContain('--bg')
    expect(args).not.toContain('--background')
    expect(args).toContain('--model')
    expect(args).toContain('claude-opus-4-7')
  })

  afterEach(async () => {
    await cleanupMockPidFiles()
  })
})
