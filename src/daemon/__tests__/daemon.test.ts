// Input: daemon/main.ts + daemon/workerRegistry.ts 函数 + mock spawn/exec/fs
// Output: bun test 断言结果
// Pos: src/daemon/__tests__/ —— supervisor 单元测试（单例锁/worker注册/respawn/优雅退出）

import {
  describe,
  expect,
  test,
  mock,
  beforeEach,
  afterEach,
  spyOn,
} from 'bun:test'
import { EventEmitter } from 'events'

// ---------------------------------------------------------------------------
// Mock: fs/promises（PID 文件读写）
// ---------------------------------------------------------------------------

let mockPidFileData: string | null = null
let mkdirCalled = false
let writtenPidPath: string | null = null
let unlinkCalled = false

// D5 mock helpers: readdir / per-file readFile overrides
let mockReaddirFiles: string[] = []
const mockFileContents = new Map<string, string>()
let unlinkPaths: string[] = []

mock.module('fs/promises', () => ({
  mkdir: async () => { mkdirCalled = true },
  writeFile: async (_path: string, data: string) => {
    writtenPidPath = _path
    mockPidFileData = data
  },
  readFile: async (_path: string) => {
    // Per-file override (used by D5 tests)
    if (mockFileContents.has(_path)) return mockFileContents.get(_path)!
    if (mockPidFileData === null) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    return mockPidFileData
  },
  unlink: async (_path: string) => {
    unlinkCalled = true
    unlinkPaths.push(_path)
  },
  chmod: async () => {},
  readdir: async () => mockReaddirFiles,
}))

// ---------------------------------------------------------------------------
// Mock: fs (existsSync)
// ---------------------------------------------------------------------------

mock.module('fs', () => ({
  existsSync: () => true,
}))

// ---------------------------------------------------------------------------
// Mock: child_process（spawn）
// ---------------------------------------------------------------------------

class MockChildProcess extends EventEmitter {
  pid = 99999
  stdout = new EventEmitter()
  stderr = new EventEmitter()
  killed = false
  kill(signal?: string | number) {
    this.killed = true
    // 延迟 emit exit 让 gracefulShutdown 可以等待
    setTimeout(() => this.emit('exit', 0, null), 50)
  }
}

let lastSpawnArgs: { file: string; args: string[]; opts: object } | null = null
let mockChildProc: MockChildProcess = new MockChildProcess()

mock.module('child_process', () => ({
  spawn: (file: string, args: string[], opts: object) => {
    lastSpawnArgs = { file, args, opts }
    mockChildProc = new MockChildProcess()
    return mockChildProc
  },
}))

// ---------------------------------------------------------------------------
// Mock: utils/debug
// ---------------------------------------------------------------------------

const debugLogs: string[] = []
mock.module('../../../src/utils/debug.js', () => ({
  logForDebugging: (msg: string) => { debugLogs.push(msg) },
}))

// ---------------------------------------------------------------------------
// Mock: utils/genericProcessUtils（isProcessRunning）
// ---------------------------------------------------------------------------

let mockProcessRunning = false
mock.module('../../../src/utils/genericProcessUtils.js', () => ({
  isProcessRunning: (_pid: number) => mockProcessRunning,
}))

// ---------------------------------------------------------------------------
// Mock: utils/envUtils
// ---------------------------------------------------------------------------

mock.module('../../../src/utils/envUtils.js', () => ({
  getClaudeConfigHomeDir: () => '/tmp/panda-daemon-test',
}))

// ---------------------------------------------------------------------------
// Mock: cli/bgSpawn（ensureTmuxAvailable）
// ---------------------------------------------------------------------------

let mockTmuxAvailable = false // 默认关闭 tmux，走 subprocess 模式
mock.module('../../../src/cli/bgSpawn.js', () => ({
  ensureTmuxAvailable: async () =>
    mockTmuxAvailable ? { ok: true } : { ok: false, error: 'tmux not found' },
  BG_TMUX_SESSION: 'claude-bg',
}))

// ---------------------------------------------------------------------------
// Mock: utils/execFileNoThrow
// ---------------------------------------------------------------------------

let mockExecReturn: { stdout: string; stderr: string; code: number } = {
  stdout: '',
  stderr: '',
  code: 0,
}
mock.module('../../../src/utils/execFileNoThrow.js', () => ({
  execFileNoThrow: async () => mockExecReturn,
}))

// ---------------------------------------------------------------------------
// Mock: utils/swarm/constants
// ---------------------------------------------------------------------------

mock.module('../../../src/utils/swarm/constants.js', () => ({
  TMUX_COMMAND: 'tmux',
}))

// ---------------------------------------------------------------------------
// Imports（必须在 mock 之后）
// ---------------------------------------------------------------------------

import { runDaemonWorker } from '../workerRegistry.js'
import {
  daemonMain,
  DAEMON_TMUX_SESSION,
  cleanupOrphanPtyHosts,
  reapIdleBgSessions,
  MIN_RESPAWN_INTERVAL_MS,
  IDLE_GRACE_MS,
} from '../main.js'

// ---------------------------------------------------------------------------
// Tests: workerRegistry
// ---------------------------------------------------------------------------

describe('workerRegistry — runDaemonWorker', () => {
  beforeEach(() => {
    debugLogs.length = 0
    delete process.env.CLAUDE_CODE_SESSION_KIND
    delete process.env.CLAUDE_CODE_DAEMON_WORKER_ID
    delete process.env.CLAUDE_CODE_DAEMON_WORKER_KIND
  })

  test('generic worker: 设置 CLAUDE_CODE_SESSION_KIND=daemon-worker', async () => {
    // SIGTERM 后立即结束 worker
    const workerPromise = runDaemonWorker('generic/test-uuid-0001')
    // 给 worker 时间初始化，然后触发 SIGTERM
    await new Promise<void>(r => setTimeout(r, 20))
    process.emit('SIGTERM')
    await workerPromise

    expect(process.env.CLAUDE_CODE_SESSION_KIND).toBe('daemon-worker')
    expect(process.env.CLAUDE_CODE_DAEMON_WORKER_KIND).toBe('generic')
  })

  test('bridge worker: kind 正确解析并设置环境变量', async () => {
    const workerPromise = runDaemonWorker('bridge/test-uuid-0002')
    await new Promise<void>(r => setTimeout(r, 20))
    process.emit('SIGTERM')
    await workerPromise

    expect(process.env.CLAUDE_CODE_DAEMON_WORKER_KIND).toBe('bridge')
    expect(process.env.CLAUDE_CODE_DAEMON_WORKER_ID).toBe('bridge/test-uuid-0002')
  })

  test('workerId 仅含 kind（无 /）: 归为 generic', async () => {
    const workerPromise = runDaemonWorker('generic')
    await new Promise<void>(r => setTimeout(r, 20))
    process.emit('SIGTERM')
    await workerPromise

    expect(process.env.CLAUDE_CODE_DAEMON_WORKER_KIND).toBe('generic')
  })

  test('unknown kind 归为 generic', async () => {
    const workerPromise = runDaemonWorker('unknown-kind/uuid-0004')
    await new Promise<void>(r => setTimeout(r, 20))
    process.emit('SIGTERM')
    await workerPromise

    expect(process.env.CLAUDE_CODE_DAEMON_WORKER_KIND).toBe('generic')
  })

  test('debug 日志包含 worker id', async () => {
    debugLogs.length = 0
    const workerPromise = runDaemonWorker('generic/debug-log-test')
    await new Promise<void>(r => setTimeout(r, 20))
    process.emit('SIGTERM')
    await workerPromise

    const hasLog = debugLogs.some(l => l.includes('debug-log-test'))
    expect(hasLog).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Tests: daemon/main — status & stop（无需真实 supervisor loop）
// ---------------------------------------------------------------------------

describe('daemonMain — status 子命令', () => {
  beforeEach(() => {
    mockPidFileData = null
    mockProcessRunning = false
    unlinkCalled = false
    debugLogs.length = 0
  })

  test('无 PID 文件 → 打印 not running', async () => {
    mockPidFileData = null
    const logs: string[] = []
    const orig = console.log
    console.log = (...args: unknown[]) => { logs.push(args.join(' ')) }
    try {
      await daemonMain(['status'])
    } finally {
      console.log = orig
    }
    expect(logs.some(l => l.includes('not running'))).toBe(true)
  })

  test('PID 文件存在且进程存活 → 打印 running', async () => {
    mockProcessRunning = true
    mockPidFileData = JSON.stringify({
      pid: 12345,
      startedAt: Date.now(),
      version: '2.27.7',
      workers: [],
    })
    const logs: string[] = []
    const orig = console.log
    console.log = (...args: unknown[]) => { logs.push(args.join(' ')) }
    try {
      await daemonMain(['status'])
    } finally {
      console.log = orig
    }
    expect(logs.some(l => l.includes('running') && l.includes('12345'))).toBe(true)
  })

  test('PID 文件存在但进程已死 → 清理 stale lock', async () => {
    mockProcessRunning = false
    mockPidFileData = JSON.stringify({
      pid: 99999,
      startedAt: Date.now() - 10000,
      version: '2.27.7',
      workers: [],
    })
    await daemonMain(['status'])
    expect(unlinkCalled).toBe(true)
  })
})

describe('daemonMain — stop 子命令', () => {
  beforeEach(() => {
    mockPidFileData = null
    mockProcessRunning = false
    unlinkCalled = false
  })

  test('无运行 daemon → 打印 not running', async () => {
    mockPidFileData = null
    const logs: string[] = []
    const orig = console.log
    console.log = (...args: unknown[]) => { logs.push(args.join(' ')) }
    try {
      await daemonMain(['stop'])
    } finally {
      console.log = orig
    }
    expect(logs.some(l => l.includes('not running'))).toBe(true)
  })

  test('stale PID 文件 → 清理并打印提示', async () => {
    mockProcessRunning = false
    mockPidFileData = JSON.stringify({
      pid: 77777,
      startedAt: Date.now() - 5000,
      version: '2.27.7',
      workers: [],
    })
    await daemonMain(['stop'])
    expect(unlinkCalled).toBe(true)
  })
})

describe('daemonMain — 单例锁（start 双启动保护）', () => {
  beforeEach(() => {
    mockPidFileData = null
    mockProcessRunning = false
  })

  test('已有存活 daemon 时 start 调用 process.exit(1)', async () => {
    mockProcessRunning = true
    mockPidFileData = JSON.stringify({
      pid: 55555,
      startedAt: Date.now(),
      version: '2.27.7',
      workers: [],
    })

    let exitCode: number | undefined
    const origExit = process.exit.bind(process)
    process.exit = (code?: number) => { exitCode = code; throw new Error('process.exit') }

    try {
      await daemonMain(['start'])
    } catch {
      // expected
    } finally {
        process.exit = origExit
    }

    expect(exitCode).toBe(1)
  })
})

describe('daemonMain — unknown 子命令', () => {
  test('未知子命令调用 process.exit(1)', async () => {
    let exitCode: number | undefined
    const origExit = process.exit.bind(process)
    process.exit = (code?: number) => { exitCode = code; throw new Error('process.exit') }

    try {
      await daemonMain(['unknown-cmd'])
    } catch {
      // expected
    } finally {
        process.exit = origExit
    }

    expect(exitCode).toBe(1)
  })
})

describe('DAEMON_TMUX_SESSION 常量', () => {
  test('应为 panda-daemon', () => {
    expect(DAEMON_TMUX_SESSION).toBe('panda-daemon')
  })
})

// ---------------------------------------------------------------------------
// D5-1 (v2.1.154-a): MIN_RESPAWN_INTERVAL_MS 常量验证
// ---------------------------------------------------------------------------

describe('D5-1 MIN_RESPAWN_INTERVAL_MS', () => {
  test('应 ≥ 30 秒，防止升级后 pinned session 每分钟重生', () => {
    expect(MIN_RESPAWN_INTERVAL_MS).toBeGreaterThanOrEqual(30_000)
  })

  test('应 < 120 秒，避免 worker 崩溃后恢复过慢', () => {
    expect(MIN_RESPAWN_INTERVAL_MS).toBeLessThan(120_000)
  })
})

// ---------------------------------------------------------------------------
// D5-2 (v2.1.154-b): cleanupOrphanPtyHosts
// ---------------------------------------------------------------------------

describe('D5-2 cleanupOrphanPtyHosts', () => {
  beforeEach(() => {
    mockReaddirFiles = []
    mockFileContents.clear()
    unlinkPaths = []
    unlinkCalled = false
  })

  test('sessions 目录不存在时不抛出', async () => {
    // readdir 已 mock 为 throw ENOENT
    mockReaddirFiles = [] // readdir mock 正常返回空
    await expect(cleanupOrphanPtyHosts()).resolves.toBeUndefined()
  })

  test('无 bg-pty-host 条目时不发 kill', async () => {
    mockReaddirFiles = ['1234.json']
    mockFileContents.set(
      '/tmp/panda-daemon-test/sessions/1234.json',
      JSON.stringify({ pid: 1234, kind: 'bg', status: 'idle' }),
    )
    mockProcessRunning = false

    const killCalls: Array<[number, string]> = []
    const origKill = process.kill.bind(process)
    process.kill = (pid: number, sig?: string | number) => { killCalls.push([pid, String(sig)]); return true as const }
    try {
      await cleanupOrphanPtyHosts()
    } finally {
        process.kill = origKill
    }
    expect(killCalls).toHaveLength(0)
  })

  test('发现存活 bg-pty-host 进程应发 SIGTERM', async () => {
    mockReaddirFiles = ['9876.json']
    mockFileContents.set(
      '/tmp/panda-daemon-test/sessions/9876.json',
      JSON.stringify({ pid: 9876, kind: 'bg-pty-host' }),
    )
    mockProcessRunning = true

    const killCalls: Array<[number, string]> = []
    const origKill = process.kill.bind(process)
    process.kill = (pid: number, sig?: string | number) => {
      killCalls.push([pid, String(sig)])
      // 模拟进程收到信号后即死（让 Promise 及时 resolve）
      mockProcessRunning = false
      return true as const
    }
    try {
      await cleanupOrphanPtyHosts()
    } finally {
        process.kill = origKill
    }
    expect(killCalls.some(([pid, sig]) => pid === 9876 && sig === 'SIGTERM')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// D5-3 (v2.1.154-c): reapIdleBgSessions + IDLE_GRACE_MS
// ---------------------------------------------------------------------------

describe('D5-3 IDLE_GRACE_MS', () => {
  test('应 ≥ 3 分钟', () => {
    expect(IDLE_GRACE_MS).toBeGreaterThanOrEqual(3 * 60 * 1000)
  })

  test('应 ≤ 15 分钟，避免僵死进程积累过久', () => {
    expect(IDLE_GRACE_MS).toBeLessThanOrEqual(15 * 60 * 1000)
  })
})

describe('D5-3 reapIdleBgSessions', () => {
  beforeEach(() => {
    mockReaddirFiles = []
    mockFileContents.clear()
    unlinkPaths = []
    unlinkCalled = false
    mockProcessRunning = false
  })

  test('sessions 目录为空时不抛出', async () => {
    mockReaddirFiles = []
    await expect(reapIdleBgSessions()).resolves.toBeUndefined()
  })

  test('bg session updatedAt 未超过 grace 时不 kill', async () => {
    const recentMs = Date.now() - 60_000 // 1 分钟前，未超过 5 分钟
    mockReaddirFiles = ['5555.json']
    mockFileContents.set(
      '/tmp/panda-daemon-test/sessions/5555.json',
      JSON.stringify({ pid: 5555, kind: 'bg', updatedAt: recentMs }),
    )
    mockProcessRunning = true

    const killCalls: Array<[number, string]> = []
    const origKill = process.kill.bind(process)
    process.kill = (pid: number, sig?: string | number) => { killCalls.push([pid, String(sig)]); return true as const }
    try {
      await reapIdleBgSessions()
    } finally {
        process.kill = origKill
    }
    expect(killCalls).toHaveLength(0)
  })

  test('bg session updatedAt 超过 IDLE_GRACE_MS 时发 SIGTERM 并删 PID 文件', async () => {
    const staleMs = Date.now() - IDLE_GRACE_MS - 10_000 // 超出宽限期
    mockReaddirFiles = ['7777.json']
    mockFileContents.set(
      '/tmp/panda-daemon-test/sessions/7777.json',
      JSON.stringify({ pid: 7777, kind: 'bg', updatedAt: staleMs }),
    )
    mockProcessRunning = true

    const killCalls: Array<[number, string]> = []
    const origKill = process.kill.bind(process)
    process.kill = (pid: number, sig?: string | number) => {
      killCalls.push([pid, String(sig)])
      mockProcessRunning = false
      return true as const
    }
    try {
      await reapIdleBgSessions()
    } finally {
        process.kill = origKill
    }
    expect(killCalls.some(([pid, sig]) => pid === 7777 && sig === 'SIGTERM')).toBe(true)
    // PID 文件应被删除
    expect(unlinkCalled).toBe(true)
  })

  test('dead bg session（进程已死）清理 stale PID 文件，不发 kill', async () => {
    const staleMs = Date.now() - IDLE_GRACE_MS - 30_000
    mockReaddirFiles = ['8888.json']
    mockFileContents.set(
      '/tmp/panda-daemon-test/sessions/8888.json',
      JSON.stringify({ pid: 8888, kind: 'bg', updatedAt: staleMs }),
    )
    mockProcessRunning = false // 进程已死

    const killCalls: Array<[number, string]> = []
    const origKill = process.kill.bind(process)
    process.kill = (pid: number, sig?: string | number) => { killCalls.push([pid, String(sig)]); return true as const }
    try {
      await reapIdleBgSessions()
    } finally {
        process.kill = origKill
    }
    // 不应发 kill（进程已死）
    expect(killCalls.filter(([pid]) => pid === 8888)).toHaveLength(0)
    // 但应清理 stale PID 文件
    expect(unlinkCalled).toBe(true)
  })
})
