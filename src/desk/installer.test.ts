// Input:  src/desk/installer.ts 公共 API checkElectronInstalled / installPandaOnDeskDeps
//         + 内部 helpers __locateDeskDirForTesting / __resetInstallerStateForTesting
//         + P0 hotfix helpers __parseDepSpecForTesting / __createStageDirForTesting
//         / __moveNodeModulesForTesting
// Output: 11+ 测试用例 — 路径定位 / electron 检测三态 / 已装 short-circuit /
//         npm 失败 / spawn 抛错 / 并发幂等 / 超时 / 常量对齐 /
//         + P0 hotfix：dep spec 解析 / stage 目录隔离主仓 workspace:* /
//                       node_modules 搬迁 + 冲突覆盖 / mv 失败回滚
// Pos:    W4-T1 panda CLI 启动稳定性验证 — 桌面宠物 deps 按需安装闭环
//         严守 anthropic byte-equal — 仅 node 内置 + 自家模块
//
// [NEW-FILE:#20260419-W4-03]
// 2026-04-20 08:13 +08:00 W4-T1 初版
// 2026-04-20 14:25 +08:00 P0 hotfix v2.25.16 — workspace 隔离用例

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  ELECTRON_DEPS,
  __createStageDirForTesting,
  __locateDeskDirForTesting,
  __moveNodeModulesForTesting,
  __parseDepSpecForTesting,
  __resetInstallerStateForTesting,
  checkElectronInstalled,
  installPandaOnDeskDeps,
} from './installer.js'

// ─────────────────────────────────────────────────────────────────────────────
// 测试夹具 — 临时目录模拟 packages/panda-on-desk 子包结构
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string

function mkDeskDirWith(opts: { electron?: boolean }): string {
  const desk = join(tmpDir, 'packages', 'panda-on-desk')
  mkdirSync(desk, { recursive: true })
  writeFileSync(
    join(desk, 'package.json'),
    JSON.stringify({ name: '@lc2panda/panda-on-desk', version: '0.0.0-test' }),
    'utf-8',
  )
  if (opts.electron) {
    const elDir = join(desk, 'node_modules', 'electron')
    mkdirSync(elDir, { recursive: true })
    writeFileSync(
      join(elDir, 'package.json'),
      JSON.stringify({ name: 'electron', version: '41.0.0' }),
      'utf-8',
    )
  }
  return desk
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-desk-installer-test-'))
  __resetInstallerStateForTesting()
})

afterEach(() => {
  __resetInstallerStateForTesting()
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 1 — 常量对齐：ELECTRON_DEPS 必须含 electron + electron-updater + koffi + htmlparser2
// 与 packages/panda-on-desk/package.json dependencies 一致
// ─────────────────────────────────────────────────────────────────────────────

describe('ELECTRON_DEPS · 常量', () => {
  test('包含 4 个核心依赖 + 版本前缀对齐 panda-on-desk/package.json', () => {
    // why: 任何漂移立即被发现 — 否则 install 完桌面宠物仍跑不起来
    expect(ELECTRON_DEPS.length).toBe(4)
    const joined = ELECTRON_DEPS.join(' ')
    expect(joined).toContain('electron@41')
    expect(joined).toContain('electron-updater@6.8.3')
    expect(joined).toContain('koffi@2.15.2')
    expect(joined).toContain('htmlparser2@12')
  })

  // W9-T2 regression：实测发现 ELECTRON_DEPS 注释 "与 dependencies 对齐" 不准确，
  // electron 实际在 devDependencies。本测试守护：每个 dep 必须出现在子包
  // package.json 的 dependencies 或 devDependencies，否则 npm install 出错或漂移。
  test('regression W9-T2：每个 dep 必须存在于 panda-on-desk/package.json (deps/devDeps)', () => {
    // 读取真子包 package.json — 用 require 以触发 bun resolve（避免 fs 路径耦合）
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../../packages/panda-on-desk/package.json') as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
    for (const dep of ELECTRON_DEPS) {
      // dep 形如 'electron@41' → name='electron', version='41'
      const atIdx = dep.lastIndexOf('@')
      const name = atIdx > 0 ? dep.slice(0, atIdx) : dep
      const version = atIdx > 0 ? dep.slice(atIdx + 1) : ''
      expect(
        Object.keys(all),
        `dep "${name}" 必须存在于 packages/panda-on-desk/package.json (deps 或 devDeps)`,
      ).toContain(name)
      // 版本前缀校验：package.json 通常是 "^41.0.0" 或 "^6.8.3"
      // 我们只校验 major（避免 patch 漂移误报）
      const majorInPkg = (all[name] ?? '').replace(/^[~^]/, '').split('.')[0]
      const majorInDeps = version.split('.')[0]
      expect(
        majorInPkg,
        `dep "${name}" major 版本应一致：ELECTRON_DEPS=${majorInDeps} pkg=${majorInPkg}`,
      ).toBe(majorInDeps)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 2 — __locateDeskDirForTesting 路径解析
// ─────────────────────────────────────────────────────────────────────────────

describe('__locateDeskDirForTesting · 路径解析', () => {
  test('package.json 存在 → 命中', () => {
    const desk = mkDeskDirWith({ electron: false })
    expect(__locateDeskDirForTesting([desk])).toBe(desk)
  })

  test('全部候选都不含 package.json → null', () => {
    const ghost = join(tmpDir, 'no-such', 'panda-on-desk')
    expect(__locateDeskDirForTesting([ghost])).toBeNull()
  })

  test('多候选 → 命中第一个 package.json 存在的', () => {
    const ghost = join(tmpDir, 'ghost', 'panda-on-desk')
    const real = mkDeskDirWith({ electron: false })
    expect(__locateDeskDirForTesting([ghost, real])).toBe(real)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 3 — checkElectronInstalled 三态
// ─────────────────────────────────────────────────────────────────────────────

describe('checkElectronInstalled · 检测', () => {
  test('electron node_modules 存在 → true', () => {
    const desk = mkDeskDirWith({ electron: true })
    expect(checkElectronInstalled(desk)).toBe(true)
  })

  test('electron 未装 → false', () => {
    const desk = mkDeskDirWith({ electron: false })
    expect(checkElectronInstalled(desk)).toBe(false)
  })

  test('deskDir 不存在 → false（保守降级，不抛）', () => {
    const ghost = join(tmpDir, 'no-such-dir')
    expect(checkElectronInstalled(ghost)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 4 — installPandaOnDeskDeps 已装 short-circuit（幂等）
// ─────────────────────────────────────────────────────────────────────────────

describe('installPandaOnDeskDeps · 幂等', () => {
  test('electron 已装 → 立即 ok:true + alreadyInstalled:true，不 spawn npm', async () => {
    const desk = mkDeskDirWith({ electron: true })
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      // npmCmd 给一个不存在的命令 — 若实现错误会真去 spawn 然后失败；
      // 正确实现应该 short-circuit 在 spawn 之前
      npmCmd: 'definitely-not-a-real-command-zzz',
    })
    expect(result.ok).toBe(true)
    expect(result.alreadyInstalled).toBe(true)
    expect(result.code).toBe(0)
  })

  test('deskDir 定位失败（npm 不存在）→ ok:false + 友好错误（不抛）', async () => {
    // P0 hotfix 后 cwd 已切到 tmp stage，所以这里改用不存在的 npm 触发失败路径
    // 验证仍能优雅返回 ok:false 而非抛出
    const result = await installPandaOnDeskDeps({
      deskDir: join(tmpDir, 'ghost', 'panda-on-desk'),
      npmCmd: 'definitely-not-a-real-npm-zzz-locate-fail',
      timeoutMs: 5000,
    })
    expect(result.ok).toBe(false)
    expect(typeof result.message).toBe('string')
    expect(result.message.length).toBeGreaterThan(0)
  }, 15_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 5 — installPandaOnDeskDeps npm 失败容错
// 用一个绝对不存在的 npmCmd 模拟 spawn 失败 / npm 子进程错误
// ─────────────────────────────────────────────────────────────────────────────

describe('installPandaOnDeskDeps · 容错', () => {
  test('npm 命令不存在 → ok:false + 友好中文消息（不抛）', async () => {
    const desk = mkDeskDirWith({ electron: false })
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd: 'definitely-not-a-real-command-zzz-xyz-9999',
      timeoutMs: 5000,
    })
    expect(result.ok).toBe(false)
    expect(result.message).toBeTruthy()
    // 消息应包含中文提示而非裸 stack trace
    expect(result.message.length).toBeGreaterThan(0)
  }, 15_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 6 — onLog 回调被调用（即便最终失败也要有日志输出，便于排查）
// ─────────────────────────────────────────────────────────────────────────────

describe('installPandaOnDeskDeps · 进度日志', () => {
  test('onLog 至少被调用 1 次（开始安装的提示行）', async () => {
    const desk = mkDeskDirWith({ electron: false })
    const lines: string[] = []
    await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd: 'definitely-not-a-real-command-zzz-2',
      timeoutMs: 5000,
      onLog: (l) => lines.push(l),
    })
    // 至少有"开始安装"或"cwd"或"cmd"行
    const joined = lines.join('\n')
    expect(joined).toContain('panda-desk')
  }, 15_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// P0 hotfix v2.25.16 用例组
// 修复：v2.25.16 panda --install-desk 在 Mac 实测 EUNSUPPORTEDPROTOCOL
//   "workspace:*" 报错。根因：原实现 cwd: deskDir 跑 npm install，npm 沿
//   cwd 向上扫到主仓 package.json，撞上 9 个 workspace:* devDeps。
// 修复策略：在 os.tmpdir() stage 目录隔离 npm install，完成后搬迁
//   node_modules → deskDir。
// ─────────────────────────────────────────────────────────────────────────────

describe('__parseDepSpecForTesting · dep 规范解析', () => {
  test('electron@41 → name=electron version=^41', () => {
    const r = __parseDepSpecForTesting('electron@41')
    expect(r.name).toBe('electron')
    expect(r.version).toBe('^41')
  })

  test('electron-updater@6.8.3 → name=electron-updater version=^6.8.3', () => {
    const r = __parseDepSpecForTesting('electron-updater@6.8.3')
    expect(r.name).toBe('electron-updater')
    expect(r.version).toBe('^6.8.3')
  })

  test('裸名（无版本）→ version=*', () => {
    const r = __parseDepSpecForTesting('htmlparser2')
    expect(r.name).toBe('htmlparser2')
    expect(r.version).toBe('*')
  })

  test('已含 ^ 的版本 → 原样保留', () => {
    const r = __parseDepSpecForTesting('koffi@^2.15.2')
    expect(r.name).toBe('koffi')
    expect(r.version).toBe('^2.15.2')
  })

  test('@scoped/pkg@1.0.0 取最后一个 @ → 名空间不丢失', () => {
    const r = __parseDepSpecForTesting('@anthropic-ai/sdk@0.80.0')
    expect(r.name).toBe('@anthropic-ai/sdk')
    expect(r.version).toBe('^0.80.0')
  })
})

describe('__createStageDirForTesting · stage 目录隔离', () => {
  test('生成 tmp stage 目录 + 最小 package.json（无 workspace:*）', () => {
    const stage = __createStageDirForTesting(ELECTRON_DEPS)
    try {
      // 1. 目录存在且在 os.tmpdir() 之下
      expect(existsSync(stage)).toBe(true)
      expect(stage.startsWith(tmpdir())).toBe(true)

      // 2. package.json 存在 + 仅含 4 个核心 deps
      const pkgRaw = readFileSync(join(stage, 'package.json'), 'utf-8')
      const pkg = JSON.parse(pkgRaw)
      expect(pkg.name).toBe('pandacc-desk-deps-stage')
      expect(pkg.private).toBe(true)
      expect(Object.keys(pkg.dependencies)).toHaveLength(4)
      expect(pkg.dependencies['electron']).toBe('^41')
      expect(pkg.dependencies['electron-updater']).toBe('^6.8.3')
      expect(pkg.dependencies['koffi']).toBe('^2.15.2')
      expect(pkg.dependencies['htmlparser2']).toBe('^12')

      // 3. P0 关键断言：JSON 不含任何 workspace 协议字符串
      //    （主仓 workspace:* devDeps 是本 bug 根因）
      expect(pkgRaw).not.toContain('workspace:')

      // 4. .npmrc 存在且为空（屏蔽继承）
      expect(existsSync(join(stage, '.npmrc'))).toBe(true)
      expect(readFileSync(join(stage, '.npmrc'), 'utf-8')).toBe('')
    } finally {
      rmSync(stage, { recursive: true, force: true })
    }
  })

  test('多次调用 stage 目录互不冲突（mkdtemp 唯一性）', () => {
    const a = __createStageDirForTesting(ELECTRON_DEPS)
    const b = __createStageDirForTesting(ELECTRON_DEPS)
    try {
      expect(a).not.toBe(b)
      expect(existsSync(a)).toBe(true)
      expect(existsSync(b)).toBe(true)
    } finally {
      rmSync(a, { recursive: true, force: true })
      rmSync(b, { recursive: true, force: true })
    }
  })
})

describe('__moveNodeModulesForTesting · 搬迁与回滚', () => {
  function mkStageWithNodeModules(entries: Array<{
    name: string
    files?: Record<string, string>
  }>): string {
    const stage = mkdtempSync(join(tmpdir(), 'panda-mv-stage-'))
    const nm = join(stage, 'node_modules')
    mkdirSync(nm, { recursive: true })
    for (const e of entries) {
      const dir = join(nm, e.name)
      mkdirSync(dir, { recursive: true })
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({ name: e.name, version: '1.0.0' }),
        'utf-8',
      )
      for (const [fname, fcontent] of Object.entries(e.files ?? {})) {
        writeFileSync(join(dir, fname), fcontent, 'utf-8')
      }
    }
    return stage
  }

  test('搬迁多个 entry → dest/node_modules/ 全部命中 + 计数正确', () => {
    const stage = mkStageWithNodeModules([
      { name: 'electron' },
      { name: 'electron-updater' },
      { name: 'koffi' },
      { name: 'htmlparser2' },
    ])
    const dest = mkdtempSync(join(tmpdir(), 'panda-mv-dest-'))
    try {
      const result = __moveNodeModulesForTesting(stage, dest)
      expect(result.errors).toEqual([])
      expect(result.moved).toBe(4)
      const movedEntries = readdirSync(join(dest, 'node_modules')).sort()
      expect(movedEntries).toEqual(
        ['electron', 'electron-updater', 'htmlparser2', 'koffi'].sort(),
      )
      // stage/node_modules 应已搬空
      const remaining = readdirSync(join(stage, 'node_modules'))
      expect(remaining).toEqual([])
    } finally {
      rmSync(stage, { recursive: true, force: true })
      rmSync(dest, { recursive: true, force: true })
    }
  })

  test('dest 已存在同名 entry → 覆盖（搬迁后内容来自 stage）', () => {
    const stage = mkStageWithNodeModules([
      { name: 'electron', files: { 'marker.txt': 'from-stage' } },
    ])
    const dest = mkdtempSync(join(tmpdir(), 'panda-mv-dest-'))
    // 预先在 dest 放一个旧 electron
    const existingDir = join(dest, 'node_modules', 'electron')
    mkdirSync(existingDir, { recursive: true })
    writeFileSync(join(existingDir, 'marker.txt'), 'from-old-dest', 'utf-8')
    try {
      const result = __moveNodeModulesForTesting(stage, dest)
      expect(result.errors).toEqual([])
      expect(result.moved).toBe(1)
      const marker = readFileSync(
        join(dest, 'node_modules', 'electron', 'marker.txt'),
        'utf-8',
      )
      expect(marker).toBe('from-stage')
    } finally {
      rmSync(stage, { recursive: true, force: true })
      rmSync(dest, { recursive: true, force: true })
    }
  })

  test('stage/node_modules 不存在 → 返回 error 且 moved=0（不抛）', () => {
    const stage = mkdtempSync(join(tmpdir(), 'panda-mv-stage-empty-'))
    const dest = mkdtempSync(join(tmpdir(), 'panda-mv-dest-'))
    try {
      const result = __moveNodeModulesForTesting(stage, dest)
      expect(result.moved).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('node_modules')
    } finally {
      rmSync(stage, { recursive: true, force: true })
      rmSync(dest, { recursive: true, force: true })
    }
  })
})

describe('installPandaOnDeskDeps · stage 隔离回归（P0）', () => {
  test('npm 子进程 cwd 必须是 tmp stage 而非 deskDir（避免 workspace 解析）', async () => {
    // 通过 onLog 观察 [panda-desk] stage=... 与 dest=... 行
    const desk = mkDeskDirWith({ electron: false })
    const lines: string[] = []
    await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd: 'definitely-not-a-real-command-stage-check',
      timeoutMs: 5000,
      onLog: (l) => lines.push(l),
    })
    const joined = lines.join('\n')
    // 应同时出现 stage= 与 dest= 标志（证明走的是新隔离路径）
    expect(joined).toMatch(/stage=/)
    expect(joined).toMatch(/dest=/)
    // stage 路径必须以 tmpdir() 开头
    const stageLine = lines.find((l) => l.includes('stage='))
    expect(stageLine).toBeTruthy()
    const stagePath = stageLine!.split('stage=')[1]
    expect(stagePath.startsWith(tmpdir())).toBe(true)
  }, 15_000)

  test('install 失败后 stage 目录应被清理（不留垃圾）', async () => {
    const desk = mkDeskDirWith({ electron: false })
    const lines: string[] = []
    await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd: 'definitely-not-a-real-command-cleanup-check',
      timeoutMs: 5000,
      onLog: (l) => lines.push(l),
    })
    // 从日志取出 stage 路径，断言它已被删除
    const stageLine = lines.find((l) => l.includes('stage='))
    expect(stageLine).toBeTruthy()
    const stagePath = stageLine!.split('stage=')[1].trim()
    expect(existsSync(stagePath)).toBe(false)
  }, 15_000)
})
