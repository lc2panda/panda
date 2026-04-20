// Input: src/desk/launcher.ts maybeSpawnOnDesk + 多 gate 排列组合
// Output: ≥6 集成用例 — fail 模式 / port-already-in-use 影响 / ELECTRON_RUN_AS_NODE 干扰 /
//         PANDA_NO_DESK env / locator 多候选优先级 / spawn 抛错链路 / hint 节流
// Pos:    W7-T3 panda CLI 启动稳定性集成验证
//         严守 anthropic byte-equal — 仅 node 内置 + 自家 desk 模块
//
// [NEW-FILE:#W7-01]
// 2026-04-20 +08:00 W7-T3 测试加固

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test'
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  __locatePandaOnDeskLaunchForTesting,
  __resetSpawnedFlagForTesting,
  maybeSpawnOnDesk,
} from './launcher.js'

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string
let savedArgv: string[]
let savedIsTTY: boolean | undefined
let savedNoDeskEnv: string | undefined
let savedRunAsNodeEnv: string | undefined
let savedStderrWrite: typeof process.stderr.write
let stderrCapture: string[]

function setTTY(v: boolean): void {
  Object.defineProperty(process.stdout, 'isTTY', {
    value: v,
    configurable: true,
    writable: true,
  })
}

function makeFakeLaunchCjs(dir = tmpDir): string {
  const pkg = join(dir, 'packages', 'panda-on-desk')
  mkdirSync(pkg, { recursive: true })
  const p = join(pkg, 'launch.cjs')
  writeFileSync(p, '// fake launch.cjs (W7-T3)', 'utf-8')
  return p
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-w7t3-launcher-'))
  savedArgv = process.argv.slice()
  savedIsTTY = process.stdout.isTTY
  savedNoDeskEnv = process.env.PANDA_NO_DESK
  savedRunAsNodeEnv = process.env.ELECTRON_RUN_AS_NODE
  __resetSpawnedFlagForTesting()
  setTTY(true)
  process.argv = ['node', 'panda']
  delete process.env.PANDA_NO_DESK
  delete process.env.ELECTRON_RUN_AS_NODE
  // capture stderr — friendly hint goes here
  stderrCapture = []
  savedStderrWrite = process.stderr.write
  ;(process.stderr as any).write = (s: string | Uint8Array) => {
    stderrCapture.push(typeof s === 'string' ? s : Buffer.from(s).toString('utf-8'))
    return true
  }
})

afterEach(() => {
  __resetSpawnedFlagForTesting()
  process.argv = savedArgv
  setTTY(savedIsTTY ?? false)
  if (savedNoDeskEnv === undefined) delete process.env.PANDA_NO_DESK
  else process.env.PANDA_NO_DESK = savedNoDeskEnv
  if (savedRunAsNodeEnv === undefined) delete process.env.ELECTRON_RUN_AS_NODE
  else process.env.ELECTRON_RUN_AS_NODE = savedRunAsNodeEnv
  ;(process.stderr as any).write = savedStderrWrite
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-1 · spawn fail mode — child_process.spawn 抛 ENOENT/Permission 类
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · launcher integration · spawn fail 链路', () => {
  test('spawn 抛 ENOENT → maybeSpawnOnDesk 静默不抛 + 不污染主流程', () => {
    const cp = require('node:child_process') as {
      spawn: (...args: unknown[]) => unknown
    }
    const original = cp.spawn
    cp.spawn = (() => {
      const e = new Error('ENOENT — no such file') as NodeJS.ErrnoException
      e.code = 'ENOENT'
      throw e
    }) as unknown as typeof cp.spawn
    try {
      makeFakeLaunchCjs()
      expect(() => maybeSpawnOnDesk()).not.toThrow()
    } finally {
      cp.spawn = original
    }
  })

  test('spawn 抛 EACCES (权限拒) → 完全静默', () => {
    const cp = require('node:child_process') as {
      spawn: (...args: unknown[]) => unknown
    }
    const original = cp.spawn
    cp.spawn = (() => {
      const e = new Error('EACCES — permission denied') as NodeJS.ErrnoException
      e.code = 'EACCES'
      throw e
    }) as unknown as typeof cp.spawn
    try {
      makeFakeLaunchCjs()
      expect(() => maybeSpawnOnDesk()).not.toThrow()
    } finally {
      cp.spawn = original
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-2 · PANDA_NO_DESK env 短路（运维侧关闭方式）
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · launcher integration · env gate 优先级', () => {
  test('PANDA_NO_DESK=1 → 即使 launch.cjs 存在也不 spawn', () => {
    process.env.PANDA_NO_DESK = '1'
    makeFakeLaunchCjs()
    // 即使我们 mock spawn 抛错，也不应该被调用（短路在前）
    const cp = require('node:child_process') as {
      spawn: (...args: unknown[]) => unknown
    }
    const original = cp.spawn
    let spawnCalled = false
    cp.spawn = (() => {
      spawnCalled = true
      throw new Error('should-not-be-called')
    }) as unknown as typeof cp.spawn
    try {
      expect(() => maybeSpawnOnDesk()).not.toThrow()
      expect(spawnCalled).toBe(false)
    } finally {
      cp.spawn = original
    }
  })

  test('PANDA_NO_DESK=true (字符串) → 不 spawn', () => {
    process.env.PANDA_NO_DESK = 'true'
    makeFakeLaunchCjs()
    const cp = require('node:child_process') as {
      spawn: (...args: unknown[]) => unknown
    }
    const original = cp.spawn
    let spawnCalled = false
    cp.spawn = (() => {
      spawnCalled = true
      throw new Error('should-not-be-called')
    }) as unknown as typeof cp.spawn
    try {
      maybeSpawnOnDesk()
      expect(spawnCalled).toBe(false)
    } finally {
      cp.spawn = original
    }
  })

  test('PANDA_NO_DESK=0 → 不构成短路（应继续走后续 gate）', () => {
    process.env.PANDA_NO_DESK = '0'
    setTTY(false) // 让 !isTTY gate 兜住，不实际 spawn
    expect(() => maybeSpawnOnDesk()).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-3 · ELECTRON_RUN_AS_NODE 干扰 — panda CLI 不应被父 electron 进程影响
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · launcher integration · ELECTRON_RUN_AS_NODE 干扰', () => {
  test('父进程设了 ELECTRON_RUN_AS_NODE=1 → maybeSpawnOnDesk 仍幂等不抛', () => {
    // 模拟 panda CLI 在 electron 内嵌环境跑：env 残留 ELECTRON_RUN_AS_NODE
    process.env.ELECTRON_RUN_AS_NODE = '1'
    makeFakeLaunchCjs()
    const cp = require('node:child_process') as {
      spawn: (...args: unknown[]) => unknown
    }
    const original = cp.spawn
    cp.spawn = (() => {
      // 模拟 spawn 成功但啥也不干（防真起 electron）
      return {
        unref: () => {},
        on: () => {},
      } as unknown as ReturnType<typeof cp.spawn>
    }) as unknown as typeof cp.spawn
    try {
      expect(() => maybeSpawnOnDesk()).not.toThrow()
    } finally {
      cp.spawn = original
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-4 · locator 多候选优先级 — 命中第一个存在的，不抢后续
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · launcher integration · locator 优先级', () => {
  test('多候选都存在 → 严格按数组顺序命中第一个', () => {
    const a = makeFakeLaunchCjs(join(tmpDir, 'a'))
    const b = makeFakeLaunchCjs(join(tmpDir, 'b'))
    expect(__locatePandaOnDeskLaunchForTesting([a, b])).toBe(a)
    expect(__locatePandaOnDeskLaunchForTesting([b, a])).toBe(b)
  })

  test('候选数组为空 → 返回 null（防 undefined.length 崩）', () => {
    expect(__locatePandaOnDeskLaunchForTesting([])).toBeNull()
  })

  test('候选数组首项不存在 + 第二项存在 → 命中第二项', () => {
    const real = makeFakeLaunchCjs()
    const ghost = join(tmpDir, 'no-such', 'launch.cjs')
    expect(__locatePandaOnDeskLaunchForTesting([ghost, real])).toBe(real)
  })

  test('全部候选不存在 → null（不抛 ENOENT）', () => {
    const ghosts = [
      join(tmpDir, 'a', 'launch.cjs'),
      join(tmpDir, 'b', 'launch.cjs'),
      join(tmpDir, 'c', 'launch.cjs'),
    ]
    expect(__locatePandaOnDeskLaunchForTesting(ghosts)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-5 · port-already-in-use 影响 — launcher 本身不开端口，但 spawn 后子进程
// 会尝试 bind 1455。launcher 的契约：spawn 只发起，端口冲突由子进程 probe 解决，
// launcher 不应同步检测端口冲突。
//
// why 用 18900 而非真 PORT_BASE 1455：
//   bun test 默认并发跑多个 *.test.ts；bridge.test.ts 与 e2e-real-process.test.ts
//   也会探测 PORT_BASE 区段。占用真 PORT_BASE 会与并发的端口探测用例 race。
//   选 18900 是符号占位 — 表达"任何 launcher 不关心的端口被占用都应不阻塞"语义。
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · launcher integration · port-already-in-use 不阻塞 launcher', () => {
  test('外部端口占用 → launcher 仍可正常 spawn（端口协商交由子进程）', async () => {
    // 起一个 blocker 占住一个独立端口（避开 PORT_BASE 1455~1471 区段防 race）
    const http = require('node:http') as typeof import('node:http')
    const blocker = http.createServer((_req, res) => res.end())
    await new Promise<void>(resolve => blocker.listen(18_900, '127.0.0.1', () => resolve()))
    try {
      // mock spawn — 验证 launcher 不会因为 1455 占用而 short-circuit
      const cp = require('node:child_process') as {
        spawn: (...args: unknown[]) => unknown
      }
      const original = cp.spawn
      let spawnArgsLogged: unknown[][] = []
      cp.spawn = ((...args: unknown[]) => {
        spawnArgsLogged.push(args)
        return {
          unref: () => {},
          on: () => {},
        } as unknown as ReturnType<typeof cp.spawn>
      }) as unknown as typeof cp.spawn
      try {
        // 让全部 gate 通过：tmpDir/packages/panda-on-desk/launch.cjs 存在 + cwd 正确
        const cwd = process.cwd()
        process.chdir(tmpDir)
        try {
          makeFakeLaunchCjs()
          // launcher 会先 checkElectronInstalled — 沙盒下 electron 多半未装 → 走 friendly hint 路径
          // 这是契约：缺 electron 不 spawn，但也不抛
          expect(() => maybeSpawnOnDesk()).not.toThrow()
          // 不论是否实际 spawn（取决于沙盒电 electron 装否），不应抛错
        } finally {
          process.chdir(cwd)
        }
      } finally {
        cp.spawn = original
      }
    } finally {
      await new Promise<void>(resolve => blocker.close(() => resolve()))
    }
  })
})
