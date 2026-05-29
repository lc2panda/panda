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

mock.module('fs/promises', () => ({
  mkdir: async () => { mkdirCalled = true },
  writeFile: async (_path: string, data: string) => {
    writtenPidPath = _path
    mockPidFileData = data
  },
  readFile: async (_path: string) => {
    if (mockPidFileData === null) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    return mockPidFileData
  },
  unlink: async () => { unlinkCalled = true },
  chmod: async () => {},
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
import { daemonMain, DAEMON_TMUX_SESSION } from '../main.js'

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
    // @ts-ignore — override for test
    process.exit = (code?: number) => { exitCode = code; throw new Error('process.exit') }

    try {
      await daemonMain(['start'])
    } catch {
      // expected
    } finally {
      // @ts-ignore
      process.exit = origExit
    }

    expect(exitCode).toBe(1)
  })
})

describe('daemonMain — unknown 子命令', () => {
  test('未知子命令调用 process.exit(1)', async () => {
    let exitCode: number | undefined
    const origExit = process.exit.bind(process)
    // @ts-ignore
    process.exit = (code?: number) => { exitCode = code; throw new Error('process.exit') }

    try {
      await daemonMain(['unknown-cmd'])
    } catch {
      // expected
    } finally {
      // @ts-ignore
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
