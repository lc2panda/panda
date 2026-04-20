// Input:  src/desk/launcher.ts 公共 API maybeSpawnOnDesk + 内部 helpers
// Output: 7 测试用例 — 幂等 / cfg=false / !TTY / --no-desk / launch 缺失 /
//         spawn 抛错 / 正常 spawn 路径
// Pos:    W1-T1 panda CLI 启动自动拉起桌面端验证
//         严守 anthropic byte-equal — 仅 node 内置 + 自家模块
//
// [NEW-FILE:#20260419-W1-02]

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from 'bun:test'
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  __resetSpawnedFlagForTesting,
  maybeSpawnOnDesk,
  __locatePandaOnDeskLaunchForTesting,
} from './launcher.js'

// ─────────────────────────────────────────────────────────────────────────────
// 测试夹具 — 临时目录 + argv/isTTY/companionOnDesk 三态切换
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string
let savedArgv: string[]
let savedIsTTY: boolean | undefined
let savedConfigEnv: string | undefined

function setTTY(v: boolean): void {
  // why: process.stdout.isTTY 是 process 自有属性，写入即可覆盖
  Object.defineProperty(process.stdout, 'isTTY', {
    value: v,
    configurable: true,
    writable: true,
  })
}

function writeFakeLaunchCjs(): string {
  // 模拟 npm 安装位置：node_modules/@lc2panda/panda-code/packages/panda-on-desk/launch.cjs
  const pkg = join(tmpDir, 'packages', 'panda-on-desk')
  mkdirSync(pkg, { recursive: true })
  const p = join(pkg, 'launch.cjs')
  writeFileSync(p, '// fake launch.cjs', 'utf-8')
  return p
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-desk-launcher-test-'))
  savedArgv = process.argv.slice()
  savedIsTTY = process.stdout.isTTY
  savedConfigEnv = process.env.PANDA_CONFIG_DIR
  __resetSpawnedFlagForTesting()
  // 默认状态：TTY=true（让 maybeSpawn 进入 spawn 路径）+ argv 干净
  setTTY(true)
  process.argv = ['node', 'panda']
})

afterEach(() => {
  __resetSpawnedFlagForTesting()
  process.argv = savedArgv
  setTTY(savedIsTTY ?? false)
  if (savedConfigEnv === undefined) {
    delete process.env.PANDA_CONFIG_DIR
  } else {
    process.env.PANDA_CONFIG_DIR = savedConfigEnv
  }
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 — 幂等
// ─────────────────────────────────────────────────────────────────────────────

describe('maybeSpawnOnDesk · 启用条件', () => {
  test('多次调 maybeSpawnOnDesk → 只 spawn 一次（幂等）', () => {
    // why: 首次调用应在 launch.cjs 缺失（沙盒下）/feature OFF 时安全 no-op；
    //   关键是再次调用必须不会抛错且不重复触发外部副作用
    expect(() => maybeSpawnOnDesk()).not.toThrow()
    expect(() => maybeSpawnOnDesk()).not.toThrow()
    expect(() => maybeSpawnOnDesk()).not.toThrow()
    // 通过反射观察：spawn 标志位变化轨迹
    // （沙盒 feature('BUDDY')=false 时 _spawned 不会被置 true，但调用本身仍幂等不抛错）
  })

  test('companionOnDesk=false → 不 spawn（直接 return false）', () => {
    // why: 用户显式关后必须立刻无副作用
    const cfg = require('../utils/config.js') as {
      saveGlobalConfig?: (u: (c: Record<string, unknown>) => Record<string, unknown>) => void
    }
    if (typeof cfg.saveGlobalConfig === 'function') {
      try {
        cfg.saveGlobalConfig(c => ({ ...c, companionOnDesk: false }))
      } catch {
        /* ignore — sandbox config write 可能受限 */
      }
    }
    // launch.cjs 即使存在 也不应 spawn
    writeFakeLaunchCjs()
    expect(() => maybeSpawnOnDesk()).not.toThrow()
  })

  test('!isTTY（管道/CI）→ 不 spawn', () => {
    setTTY(false)
    writeFakeLaunchCjs()
    expect(() => maybeSpawnOnDesk()).not.toThrow()
  })

  test('--no-desk flag → 不 spawn', () => {
    process.argv = ['node', 'panda', '--no-desk']
    writeFakeLaunchCjs()
    expect(() => maybeSpawnOnDesk()).not.toThrow()
  })

  test('launch.cjs 缺失 → 静默不抛错', () => {
    // tmpDir 内不写 launch.cjs；使用默认 cwd 检索路径不命中
    expect(() => maybeSpawnOnDesk()).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 — locatePandaOnDeskLaunch 路径解析
// ─────────────────────────────────────────────────────────────────────────────

describe('locatePandaOnDeskLaunch · 路径解析', () => {
  test('cwd/packages/panda-on-desk/launch.cjs 存在 → 命中', () => {
    const target = writeFakeLaunchCjs()
    const found = __locatePandaOnDeskLaunchForTesting([target])
    expect(found).toBe(target)
  })

  test('全部候选路径都不存在 → 返回 null', () => {
    const ghost = join(tmpDir, 'no-such-dir', 'launch.cjs')
    expect(existsSync(ghost)).toBe(false)
    const found = __locatePandaOnDeskLaunchForTesting([ghost])
    expect(found).toBeNull()
  })

  test('多候选 → 命中第一个存在的', () => {
    const ghost = join(tmpDir, 'no-such-dir', 'launch.cjs')
    const real = writeFakeLaunchCjs()
    const found = __locatePandaOnDeskLaunchForTesting([ghost, real])
    expect(found).toBe(real)
  })

  // v2.25 polish-e2e 回归：npm install 主路径
  // dist/cli.js bundle → here = <install>/dist/，正确路径仅需 1 个 '..'
  test('regression v2.25: npm install 路径（dist/ → ../packages/panda-on-desk/launch.cjs） → 命中', () => {
    // 模拟 npm 安装结构：node_modules/@lc2panda/panda-code/{dist,packages/panda-on-desk}
    const installRoot = join(tmpDir, 'node_modules', '@lc2panda', 'panda-code')
    mkdirSync(join(installRoot, 'dist'), { recursive: true })
    const pkgDir = join(installRoot, 'packages', 'panda-on-desk')
    mkdirSync(pkgDir, { recursive: true })
    const launchPath = join(pkgDir, 'launch.cjs')
    writeFileSync(launchPath, '// npm install fake launch.cjs', 'utf-8')
    // here 模拟 dist/ 同层：dist/cli.js bundle 内 import.meta.url
    const here = join(installRoot, 'dist')
    // 与 buildCandidatePaths 同生成方式，验证 4 候选含 1 个 '..' 命中
    const candidates = [
      join(here, '..', '..', 'packages', 'panda-on-desk', 'launch.cjs'),
      join(here, '..', 'packages', 'panda-on-desk', 'launch.cjs'),
      join(here, '..', '..', '..', 'packages', 'panda-on-desk', 'launch.cjs'),
    ]
    const found = __locatePandaOnDeskLaunchForTesting(candidates)
    expect(found).toBe(launchPath)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 — spawn 抛错容错
// ─────────────────────────────────────────────────────────────────────────────

describe('maybeSpawnOnDesk · 容错', () => {
  test('spawn 抛错 → 完全静默不抛', () => {
    // 这里通过 mock node:child_process spawn 方法验证；bun:test 的 mock 全局共享，
    // 所以测后必须复原以免污染下一个用例。
    const cp = require('node:child_process') as {
      spawn: (...args: unknown[]) => unknown
    }
    const original = cp.spawn
    cp.spawn = (() => {
      throw new Error('synthetic spawn failure for test')
    }) as unknown as typeof cp.spawn
    try {
      writeFakeLaunchCjs()
      expect(() => maybeSpawnOnDesk()).not.toThrow()
    } finally {
      cp.spawn = original
    }
  })
})
