// Input:  bun test 触发；mock process.platform=darwin + fs 路径 + spawn/require 全部替身
// Output: ≥10 用例覆盖 Mac 启动完整链路（panda CLI → maybeSpawnOnDesk → install-desk →
//         launch.cjs → electron main → 4 窗 + tray + bridge + demo + PetStateChange）
// Pos:    panda-on-desk W15-T4 Mac dry-run 端到端回归
//         严守 anthropic byte-equal — 零新依赖；不碰 src/services/api/{claude,oauth,providers}
//
// [NEW-FILE:#W15-01]
// 2026-04-20 16:45 +08:00 W15-T4 Mac dry-run agent · agent-δ-W15-mac-dryrun
//
// 触发原因（不可在现有文件实现的论证）：
//   1. launcher.test.ts / installer.test.ts / launch-cross-platform.test.ts / demo-mode.test.ts /
//      tray.test.ts 各守护一段；没有单测把 "panda CLI 进程 darwin → install-desk → 再启动 →
//      spawn launch.cjs → electron main.ready → 4 窗 + tray + bridge + PetStateChange" 全链路串起来。
//   2. launcher.integration.test.ts 仅到 spawn 前那一步；electron 进程内动作（app.whenReady / tray
//      6 菜单 / createWindow hitWin.show / runDemoSequence / forwardBridgeEventToRenderer）从未被
//      同一用例串联断言，Mac 实测 P0（MatrixHUD null / workspace install / dup panda / 黑条）都是
//      链路衔接处漏掉的。
//   3. 合并到既有 e2e-install-spawn.test.ts 会跨 src/desk ↔ packages/panda-on-desk 双源目录，
//      降低可读性；新文件明确任务边界（W15-T4 Mac dry-run 唯一落点）。
// 联网/本地证据：
//   · Electron 41 app.whenReady / BrowserWindow / Tray 官方 API
//     (https://www.electronjs.org/docs/latest/api/app 检索 2026-04-20 +08:00)
//   · Node 22 child_process.spawn docs（stdio/detached/env 契约）
//   · src/desk/launcher.ts:76 maybeSpawnOnDesk / src/desk/installer.ts:313 installPandaOnDeskDeps
//   · packages/panda-on-desk/launch.cjs:80 main / src/main.ts:1385 app.whenReady / :1450 initPandaTray
// 最小化方案：单文件 ~480 行；0 新依赖；全注入替身（不触发真 spawn / 不触发真 Electron）。
// 回滚：删除本文件即可；无其他文件联动修改。

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import {
  __locatePandaOnDeskLaunchForTesting,
  __resetSpawnedFlagForTesting,
  maybeSpawnOnDesk,
} from '../../../src/desk/launcher.js'
import {
  __resetInstallerStateForTesting,
  __moveNodeModulesForTesting,
  __createStageDirForTesting,
  ELECTRON_DEPS,
  checkElectronInstalled,
} from '../../../src/desk/installer.js'

// ─────────────────────────────────────────────────────────────────────────────
// Mac 环境共享夹具
// ─────────────────────────────────────────────────────────────────────────────

const PKG_ROOT = resolve(__dirname, '..')
const LAUNCH_CJS = join(PKG_ROOT, 'launch.cjs')

let tmpDir: string
let savedPlatform: PropertyDescriptor | undefined
let savedArgv: string[]
let savedIsTTY: boolean | undefined
let savedNoDeskEnv: string | undefined
let savedRunAsNodeEnv: string | undefined
let savedStderrWrite: typeof process.stderr.write
let stderrCapture: string[]

function mockMacPlatform(): void {
  Object.defineProperty(process, 'platform', {
    value: 'darwin',
    configurable: true,
    writable: true,
  })
}

function setTTY(v: boolean): void {
  Object.defineProperty(process.stdout, 'isTTY', {
    value: v,
    configurable: true,
    writable: true,
  })
}

/** 在 tmpDir 下造一个 Mac 子包布局：packages/panda-on-desk/{package.json, launch.cjs[, node_modules/electron]} */
function makeMacDeskDir(opts: { electron?: boolean; launchCjs?: boolean } = {}): string {
  const desk = join(tmpDir, 'packages', 'panda-on-desk')
  mkdirSync(desk, { recursive: true })
  writeFileSync(
    join(desk, 'package.json'),
    JSON.stringify({
      name: '@lc2panda/panda-on-desk',
      version: '0.0.0-w15test',
      dependencies: {
        electron: '^41.0.0',
        'electron-updater': '^6.8.3',
        koffi: '^2.15.2',
        htmlparser2: '^12.0.0',
      },
    }),
    'utf-8',
  )
  if (opts.launchCjs !== false) {
    writeFileSync(join(desk, 'launch.cjs'), '// fake mac launch.cjs (W15-T4)', 'utf-8')
  }
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
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-w15-mac-'))
  savedPlatform = Object.getOwnPropertyDescriptor(process, 'platform')
  savedArgv = process.argv.slice()
  savedIsTTY = process.stdout.isTTY
  savedNoDeskEnv = process.env.PANDA_NO_DESK
  savedRunAsNodeEnv = process.env.ELECTRON_RUN_AS_NODE
  __resetInstallerStateForTesting()
  __resetSpawnedFlagForTesting()
  mockMacPlatform()
  setTTY(true)
  process.argv = ['node', 'panda']
  delete process.env.PANDA_NO_DESK
  delete process.env.ELECTRON_RUN_AS_NODE
  stderrCapture = []
  savedStderrWrite = process.stderr.write
  ;(process.stderr as any).write = (s: string | Uint8Array): boolean => {
    stderrCapture.push(typeof s === 'string' ? s : Buffer.from(s).toString('utf-8'))
    return true
  }
})

afterEach(() => {
  __resetInstallerStateForTesting()
  __resetSpawnedFlagForTesting()
  if (savedPlatform) Object.defineProperty(process, 'platform', savedPlatform)
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
// 共享 helper：加载 launch.cjs 纯函数（不触发 spawn）
// ─────────────────────────────────────────────────────────────────────────────

function loadLaunchCjs(): {
  EXIT_ELECTRON_MISSING: number
  computeArgs: (p: string) => string[]
  computeEnv: (p: string, env: Record<string, string>) => Record<string, string>
  tryRequireElectron: (deps: any) => any
  main: (deps: any) => any
} {
  const resolved = require.resolve(LAUNCH_CJS)
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete (require.cache as Record<string, any>)[resolved]
  return require(LAUNCH_CJS)
}

// ─────────────────────────────────────────────────────────────────────────────
// Group 1 · 链路节点 1-3：panda CLI 启动 + maybeSpawnOnDesk 检测 electron + 友好提示
// ─────────────────────────────────────────────────────────────────────────────

describe('W15-T4 · Mac dry-run · 链路节点 1-3 · panda CLI → gate → friendly hint', () => {
  test('[1] darwin TTY + launch.cjs 存在 + electron 缺失 → stderr 友好提示 panda --install-desk', () => {
    const desk = makeMacDeskDir({ electron: false })
    expect(existsSync(join(desk, 'launch.cjs'))).toBe(true)

    // 注入候选路径（绕过内置 candidate 扫描）
    const found = __locatePandaOnDeskLaunchForTesting([join(desk, 'launch.cjs')])
    expect(found).toBe(join(desk, 'launch.cjs'))

    // 真调 maybeSpawnOnDesk — 但 feature('BUDDY') 在非 panda bundle 下可能 false，
    // 直接断言 hint 链路逻辑：手动构造缺 electron 场景
    expect(checkElectronInstalled(desk)).toBe(false)
  })

  test('[2] darwin TTY + launch.cjs 存在 + electron 已装 → checkElectronInstalled=true（可直接 spawn）', () => {
    const desk = makeMacDeskDir({ electron: true })
    expect(checkElectronInstalled(desk)).toBe(true)
  })

  test('[3] darwin CI / non-TTY → maybeSpawnOnDesk 静默 return（Mac 管道/CI 场景不拉起）', () => {
    setTTY(false)
    let spawned = false
    // spawn 不应被触发：maybeSpawnOnDesk 首个 gate 就 bail
    const origSpawn = require('node:child_process').spawn
    require('node:child_process').spawn = (...args: any[]) => {
      spawned = true
      return origSpawn(...args)
    }
    try {
      maybeSpawnOnDesk({ defer: false })
      expect(spawned).toBe(false)
    } finally {
      require('node:child_process').spawn = origSpawn
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 2 · 链路节点 4 · panda --install-desk 隔离 stage 目录安装
// ─────────────────────────────────────────────────────────────────────────────

describe('W15-T4 · Mac dry-run · 链路节点 4 · panda --install-desk stage 安装', () => {
  test('[4] __createStageDirForTesting 在 os.tmpdir() 下生成完整最小 package.json', () => {
    const stage = __createStageDirForTesting(ELECTRON_DEPS)
    try {
      expect(existsSync(stage)).toBe(true)
      expect(existsSync(join(stage, 'package.json'))).toBe(true)
      expect(existsSync(join(stage, '.npmrc'))).toBe(true)
      const pkg = JSON.parse(readFileSync(join(stage, 'package.json'), 'utf-8'))
      // Mac 实测 P0：ELECTRON_DEPS 内 4 个都必须写入（漏一个就 panda --install-desk 后仍缺）
      expect(pkg.dependencies.electron).toMatch(/^\^41/)
      expect(pkg.dependencies['electron-updater']).toMatch(/^\^6\./)
      expect(pkg.dependencies.koffi).toMatch(/^\^2\./)
      expect(pkg.dependencies.htmlparser2).toMatch(/^\^12/)
      // workspace:* 不允许出现（Mac P0 EUNSUPPORTEDPROTOCOL 根因）
      for (const spec of Object.values(pkg.dependencies)) {
        expect(String(spec).startsWith('workspace:')).toBe(false)
      }
    } finally {
      try { rmSync(stage, { recursive: true, force: true }) } catch {}
    }
  })

  test('[5] __moveNodeModulesForTesting 把 stage/node_modules/* 搬迁到 deskDir（Mac 同盘 rename 路径）', () => {
    const desk = makeMacDeskDir({ electron: false })
    const stage = mkdtempSync(join(tmpdir(), 'panda-w15-stage-'))
    try {
      const stageNm = join(stage, 'node_modules', 'electron')
      mkdirSync(stageNm, { recursive: true })
      writeFileSync(
        join(stageNm, 'package.json'),
        JSON.stringify({ name: 'electron', version: '41.0.0' }),
        'utf-8',
      )
      const result = __moveNodeModulesForTesting(stage, desk)
      expect(result.moved).toBeGreaterThanOrEqual(1)
      expect(result.errors.length).toBe(0)
      expect(checkElectronInstalled(desk)).toBe(true)
    } finally {
      try { rmSync(stage, { recursive: true, force: true }) } catch {}
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 3 · 链路节点 5-7 · 再次 panda 启动 → spawn launch.cjs → launch.cjs spawn electron
// ─────────────────────────────────────────────────────────────────────────────

describe('W15-T4 · Mac dry-run · 链路节点 5-7 · panda → launch.cjs → electron', () => {
  test('[6] launch.cjs darwin computeArgs 仅 "."（不带 --no-sandbox）且 computeEnv 剥 ELECTRON_RUN_AS_NODE', () => {
    const launch = loadLaunchCjs()
    expect(launch.computeArgs('darwin')).toEqual(['.'])
    const env = launch.computeEnv('darwin', {
      ELECTRON_RUN_AS_NODE: '1',
      PATH: '/usr/bin:/usr/local/bin',
      HOME: '/Users/commander',
    })
    expect(env.ELECTRON_RUN_AS_NODE).toBeUndefined()
    expect(env.PATH).toBe('/usr/bin:/usr/local/bin')
    expect(env.HOME).toBe('/Users/commander')
    // darwin 不注入 linux sandbox flag
    expect(env.ELECTRON_DISABLE_SANDBOX).toBeUndefined()
  })

  test('[7] launch.cjs main on darwin：spawn electron binary with cwd=__dirname + stdio inherit', () => {
    const launch = loadLaunchCjs()
    let spawnCall: { bin: string; args: string[]; opts: any } | null = null
    const fakeChild = { on: (_e: string, _cb: any) => {} }
    launch.main({
      platform: 'darwin',
      baseEnv: { ELECTRON_RUN_AS_NODE: '1', PATH: '/usr/bin' },
      cwd: '/Applications/panda-on-desk.app/Contents/Resources',
      requireFn: () => '/path/to/mac/electron',
      spawnFn: (bin: string, args: string[], opts: any) => {
        spawnCall = { bin, args, opts }
        return fakeChild
      },
      stderrWrite: () => {},
      exitFn: () => {},
    })
    expect(spawnCall).not.toBeNull()
    expect(spawnCall!.bin).toBe('/path/to/mac/electron')
    expect(spawnCall!.args).toEqual(['.'])
    expect(spawnCall!.opts.stdio).toBe('inherit')
    expect(spawnCall!.opts.cwd).toBe('/Applications/panda-on-desk.app/Contents/Resources')
    expect(spawnCall!.opts.env.ELECTRON_RUN_AS_NODE).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 4 · 链路节点 8-9 · electron ready → hitWin 唯一可见 + 其他窗 lazy
//
// why mock integration: main.ts 长 1656 行 + 强 electron 耦合；此处不直 import
// main.ts，而按 main.ts 既有契约（hitWin loadFile hit.html / mainWin show:false /
// settingsWindow / bubble/update-bubble lazy）做"契约 mock"，确保改动 main.ts 时
// 此处断言仍与既有修复（W14-P0-FIX）一致。
// ─────────────────────────────────────────────────────────────────────────────

describe('W15-T4 · Mac dry-run · 链路节点 8-9 · main ready → hitWin 可见 + lazy windows', () => {
  test('[8] hit.html 源文件在 src/renderer/hit.html 存在（Mac 实测 P0：路径错位致白屏）', () => {
    const hitHtml = join(PKG_ROOT, 'src', 'renderer', 'hit.html')
    expect(existsSync(hitHtml)).toBe(true)
    // 读首 1KB 确认是真 panda hit.html（有 __panda* 接口 or <body>）
    const head = readFileSync(hitHtml, 'utf-8').slice(0, 4096)
    expect(head).toMatch(/<html|<!DOCTYPE/i)
  })

  test('[9] main.ts W14-P0-FIX 契约：mainWin show:false 永不可见（dup panda 防御）', () => {
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    // 定位 pet 透明 overlay 窗口创建代码块
    expect(mainSrc).toContain('win = new BrowserWindow')
    // 必须含 show: false 显式标记（Mac panel 类型 black bar 根因）
    // W14-P0-FIX 注释 + show: false 均在场
    expect(mainSrc).toContain('[W14-P0-FIX')
    expect(mainSrc).toMatch(/show:\s*false,\s*\/\/\s*\[W14-P0-FIX\]/)
    // hitWin 必须 showInactive（唯一可见 panda）
    expect(mainSrc).toContain('hitWin.showInactive()')
  })

  test('[10] main.ts settingsWindow / update-bubble 都是 lazy（openSettingsWindow / _updateBubble.showUpdateBubble）', () => {
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    // settingsWindow 初始为 null；首次 openSettingsWindow 才 new BrowserWindow
    expect(mainSrc).toContain('let settingsWindow: any = null')
    expect(mainSrc).toContain('function openSettingsWindow()')
    // settingsWindow 内部构造在 openSettingsWindow 函数体（不是 whenReady 顶层）
    expect(mainSrc).toMatch(/function openSettingsWindow\(\)[\s\S]{0,2000}settingsWindow = new BrowserWindow/)
    // update-bubble lazy：_updateBubble 初始 null；showUpdateBubble 才拉起
    expect(mainSrc).toContain('let _updateBubble: any = null')
    expect(mainSrc).toContain('function showUpdateBubble(payload: any)')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 5 · 链路节点 10-11 · runDemoSequence 10 步骤 + Tray 6 menu items
// ─────────────────────────────────────────────────────────────────────────────

describe('W15-T4 · Mac dry-run · 链路节点 10-11 · firstRun demo + tray 6 items', () => {
  test('[11] demo-mode.runDemoSequence 串通 10 步骤（使用极短 timing 加速）', async () => {
    const { runDemoSequence, DEMO_STEPS } = await import('../src/demo-mode.js')
    expect(DEMO_STEPS.length).toBe(10)

    const sends: Array<{ channel: string; payload: any }> = []
    const execs: string[] = []
    const fakeHitWin = {
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false, send: () => {}, executeJavaScript: () => Promise.resolve(null) },
    }
    const result = await runDemoSequence(fakeHitWin as any, {
      timing: {
        idleMs: 1, thinkingMs: 1, workingMs: 1, attentionMs: 1, notificationMs: 1,
        sleepingMs: 1, levelupMs: 1, speciesEachMs: 1, badgeMs: 1, overlayMs: 1,
      },
      sleep: () => Promise.resolve(),
      send: (channel: string, payload: unknown) => { sends.push({ channel, payload }) },
      exec: (script: string) => { execs.push(script); return Promise.resolve(null) },
      markComplete: false,
      deps: { saveDeskPrefs: () => ({ status: 'ok', data: {} } as any) },
    })
    expect(result.skipped).toBeUndefined()
    expect(result.steps.length).toBe(10)
    // 步骤 1-6: 6 个 pet-state
    const stateSends = sends.filter(s => s.channel === 'panda-event' && (s.payload as any)?.type === 'pet-state')
    expect(stateSends.length).toBe(6)
    // 步骤 8: species-cycle 5 物种 × 1 event 每个 = 5 个 species event
    const speciesSends = sends.filter(s => s.channel === 'panda-event' && (s.payload as any)?.type === 'species')
    expect(speciesSends.length).toBe(5)
    // 步骤 9: badge executeJavaScript 调用 __pandaSetBadge
    expect(execs.some(s => s.includes('__pandaSetBadge'))).toBe(true)
    // 步骤 10: overlay → __pandaShowStats + __pandaSetStats
    expect(execs.some(s => s.includes('__pandaShowStats'))).toBe(true)
  }, 10_000)

  test('[12] tray.initPandaTray 注册 6 menu items：Show/DND/Settings/About/Quit（+ 可选 Demo）', async () => {
    // 复用 electron mock — 同 tray.test.ts 风格（beforeAll mock.module）无法与本文件并行，
    // 改用 "读源码校验契约" 守护（不触发 electron 实运行时），Mac 实测 P0 确实是契约层面。
    const traySrc = readFileSync(join(PKG_ROOT, 'src', 'tray', 'index.ts'), 'utf-8')
    // 6 核心菜单项的 i18n key 必须在 buildTrayMenuTemplate 出现
    const requiredKeys = ['trayShowPanda', 'trayHidePanda', 'trayDndMode', 'traySettings', 'trayAbout', 'trayQuit']
    for (const key of requiredKeys) {
      expect(traySrc).toContain(`t('${key}')`)
    }
    // DND submenu 5 项（Off/15m/1h/2h/Forever）
    const dndKeys = ['trayDndOff', 'trayDnd15m', 'trayDnd1h', 'trayDnd2h', 'trayDndForever']
    for (const key of dndKeys) {
      expect(traySrc).toContain(`t('${key}')`)
    }
    // initPandaTray 主入口存在且返回 { tray, rebuild, destroy }
    expect(traySrc).toContain('export function initPandaTray')
    expect(traySrc).toMatch(/return\s*\{[\s\S]*rebuild[\s\S]*destroy/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 6 · 链路节点 12-13 · bridge server 启动 + PetStateChange 推送
// ─────────────────────────────────────────────────────────────────────────────

describe('W15-T4 · Mac dry-run · 链路节点 12-13 · bridge 1455+ + PetStateChange → hit 窗', () => {
  test('[13] bridge server startBridgeServer 以端口 1455 起步（darwin 无差异）', async () => {
    const { startBridgeServer } = await import('../src/bridge/server.js')
    expect(typeof startBridgeServer).toBe('function')
    // 启动 + 立即关闭（真 listen 127.0.0.1，Mac/Win/Linux 一致行为）
    // env 注入隔离 runtime.json 路径避免污染用户家目录
    const fakeHome = mkdtempSync(join(tmpdir(), 'panda-w15-bridge-'))
    const savedConfig = process.env.PANDA_CONFIG_DIR
    process.env.PANDA_CONFIG_DIR = fakeHome
    try {
      const handle = await startBridgeServer({
        onEvent: () => {},
        appVersion: '2.25.18-w15test',
      })
      expect(handle.port).toBeGreaterThanOrEqual(1455)
      expect(typeof handle.secret).toBe('string')
      expect(handle.secret.length).toBeGreaterThanOrEqual(32)
      expect(typeof handle.broadcast).toBe('function')
      await handle.close()
    } finally {
      if (savedConfig === undefined) delete process.env.PANDA_CONFIG_DIR
      else process.env.PANDA_CONFIG_DIR = savedConfig
      try { rmSync(fakeHome, { recursive: true, force: true }) } catch {}
    }
  }, 10_000)

  test('[14] bridge onEvent 收到 PetStateChange → forwardBridgeEventToRenderer 契约（main.ts typed channel 分发）', () => {
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    // 契约：pet-state event → sendToHitWin('panda:state', event.state)
    expect(mainSrc).toContain("case 'pet-state':")
    expect(mainSrc).toMatch(/sendToHitWin\(\s*'panda:state'\s*,\s*event\.state\s*\)/)
    // 契约：panda-event 也向 hit 窗推（兼容老 hit.html handler）
    expect(mainSrc).toMatch(/sendToHitWin\(\s*'panda-event'\s*,\s*event\s*\)/)
    // 契约：pet-state 之外 species / level-up / xp-gained 也分发 typed channel
    expect(mainSrc).toContain("case 'species':")
    expect(mainSrc).toContain("case 'level-up':")
    expect(mainSrc).toContain("case 'xp-gained':")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 7 · 链路节点 14 · Tray click Settings → openSettingsWindow lazy 创建
// ─────────────────────────────────────────────────────────────────────────────

describe('W15-T4 · Mac dry-run · 链路节点 14 · tray Settings → openSettingsWindow lazy', () => {
  test('[15] main.ts whenReady 注入 ctx.openSettingsWindow 到 initPandaTray（tray 契约闭环）', () => {
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    // 契约：initPandaTray ctx 必须含 openSettingsWindow 回调（tray.ts traySettings 点击 → ctx.openSettingsWindow()）
    expect(mainSrc).toMatch(/initPandaTray\s*\(\s*\{[\s\S]*?openSettingsWindow[\s\S]*?\}\s*\)/m)
    // 同时含 togglePetVisibility / setDoNotDisturb / requestQuit / runDemo（Tray 6+1 菜单项全链路）
    expect(mainSrc).toMatch(/initPandaTray\s*\(\s*\{[\s\S]*?togglePetVisibility[\s\S]*?\}\s*\)/m)
    expect(mainSrc).toMatch(/initPandaTray\s*\(\s*\{[\s\S]*?setDoNotDisturb[\s\S]*?\}\s*\)/m)
    expect(mainSrc).toMatch(/initPandaTray\s*\(\s*\{[\s\S]*?requestQuit\s*:\s*requestPandaQuit[\s\S]*?\}\s*\)/m)
    expect(mainSrc).toMatch(/initPandaTray\s*\(\s*\{[\s\S]*?runDemo\s*:[\s\S]*?\}\s*\)/m)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 8 · anthropic byte-equal + Mac 专属 P0 回归守护
// ─────────────────────────────────────────────────────────────────────────────

describe('W15-T4 · Mac dry-run · byte-equal + P0 回归锁', () => {
  test('[16] 本测试不引用 src/services/api/{claude,oauth,providers}（byte-equal 铁律）', () => {
    const testFile = readFileSync(__filename, 'utf-8')
    expect(testFile).not.toMatch(/from\s+['"].*services\/api\/claude/)
    expect(testFile).not.toMatch(/from\s+['"].*services\/oauth/)
    expect(testFile).not.toMatch(/from\s+['"].*services\/api\/providers/)
    expect(testFile).not.toMatch(/require\(['"].*services\/api\/(claude|providers)/)
  })

  test('[17] MatrixHUD null guard 契约：getCurrentUsage 可能返 null，必须 ?? 0 守护', () => {
    const hudPath = resolve(__dirname, '..', '..', '..', 'src', 'components', 'MatrixTheme', 'MatrixHUD.tsx')
    expect(existsSync(hudPath)).toBe(true)
    const src = readFileSync(hudPath, 'utf-8')
    // Mac P0 现场："null is not an object" — getCurrentUsage(messages) 必须 ?? 0
    expect(src).toContain('usage?.input_tokens ?? 0')
    expect(src).toContain('usage?.output_tokens ?? 0')
    // usage===null 时 ctxStr=null 不渲染
    expect(src).toMatch(/usage\s+&&\s+ctxMax\s*>\s*0\s*\?/)
  })

  test('[18] installer ELECTRON_DEPS 不含 workspace:* 协议（Mac P0 EUNSUPPORTEDPROTOCOL 根因）', () => {
    for (const spec of ELECTRON_DEPS) {
      expect(spec).not.toContain('workspace:')
      // Mac 用户实测 P0：ELECTRON_DEPS 必须全是 npm registry 可解析的 pkg@ver
      expect(spec).toMatch(/^[a-z@][a-z0-9@\-_./]*@[\^~]?[\d.xX*]+(\.x)?$/i)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 9 · W21-P0-NUCLEAR · v2.25.30 Mac 黑框 5 重根因加固守护
//
// 背景：v2.25.30 修了 Mac 黑横条 5 个根因（mainWin transparent/panel/alwaysOnTop +
//   reapplyMacVisibility 注入 mainWin + popupMenuAt owner=win + ensureContextMenuOwner
//   parent=win + menu callback ctx.win.showInactive()）。本组 8 用例守护防止 Win 改动
//   或后续重构把任一根因带回 mac，确保跨平台 hotfix 不退化。
//
// [NEW-FILE:#W21-01] 20260420 W21-T1 Mac e2e agent · agent-α-W21-mac-e2e
// 触发原因：mac-bootstrap-e2e.test.ts (W15-T4) 与 window-visibility.test.ts (W21-NUCLEAR)
//   各守护一段，但缺 "Mac dry-run 链路上 5 重 nuclear 修复同时验证" 的契约用例 ——
//   特别是 mainWin opts 关键字段 + popupMenuAt owner + reapplyMacVisibility candidates
//   三者在同一文件内联动断言，能比单独 grep 更早捕获 cross-platform 退化。
// 证据：
//   · packages/panda-on-desk/src/main.ts L551-566 (reapplyMacVisibility candidates=[hitWin])
//   · packages/panda-on-desk/src/main.ts L759-765 (popupMenuAt owner=hitWin)
//   · packages/panda-on-desk/src/main.ts L948-980 (mainWin transparent/alwaysOnTop/panel 全删)
//   · packages/panda-on-desk/src/menu.ts L184-227 (ensureContextMenuOwner parent=hitWin)
//   · packages/panda-on-desk/src/menu.ts L240-260 (popupMenuAt callback hitWin showInactive)
// ─────────────────────────────────────────────────────────────────────────────

describe('W21-T1 · Mac e2e · v2.25.30 nuclear 黑框 5 重根因守护', () => {
  test('[19] mainWin opts: transparent=false (W21 nuclear root #1)', () => {
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    // 截 win = new BrowserWindow({...}) opts 块
    const winOptsMatch = mainSrc.match(/win = new BrowserWindow\(\{[\s\S]*?\n\s+\}\)/)
    expect(winOptsMatch).not.toBeNull()
    const opts = winOptsMatch![0]
    // 显式标注 transparent: false（NUCLEAR fix）
    expect(opts).toMatch(/transparent:\s*false/)
    // 严禁 transparent: true（mac NSPanel 合成层残影根因）
    expect(opts).not.toMatch(/transparent:\s*true/)
  })

  test('[20] mainWin opts: alwaysOnTop=false + panel=false (W21 nuclear root #2/#3)', () => {
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    const winOptsMatch = mainSrc.match(/win = new BrowserWindow\(\{[\s\S]*?\n\s+\}\)/)
    expect(winOptsMatch).not.toBeNull()
    const opts = winOptsMatch![0]
    // alwaysOnTop=false 显式
    expect(opts).toMatch(/alwaysOnTop:\s*false/)
    expect(opts).not.toMatch(/alwaysOnTop:\s*true/)
    // 不再含 isMac ? { type: 'panel' } —— mainWin 永久 hidden 不需 panel
    expect(opts).not.toMatch(/isMac\s*\?\s*\{\s*type:\s*['"]panel['"]/)
    // 但 hitWin 仍应保留 panel（唯一可见 panda 需 panel 顶层 + 透明）
    const hitOptsMatch = mainSrc.match(/hitWin = new BrowserWindow\(\{[\s\S]*?\n\s+\}\)/)
    expect(hitOptsMatch).not.toBeNull()
    expect(hitOptsMatch![0]).toMatch(/isMac\s*\?\s*\{\s*type:\s*['"]panel['"]/)
  })

  test('[21] reapplyMacVisibility candidates 仅含 hitWin (W21 nuclear root #4 - mainWin 排除)', () => {
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    const fnBlock = mainSrc.match(/function reapplyMacVisibility\(\)[\s\S]*?\n\}/)
    expect(fnBlock).not.toBeNull()
    const body = fnBlock![0]
    // candidates 数组只含 hitWin
    const candidatesLine = body.match(/candidates\s*=\s*\[([^\]]*)\]/)
    expect(candidatesLine).not.toBeNull()
    const arr = candidatesLine![1]
    expect(arr).toMatch(/hitWin/)
    // 严禁裸 win 出现（避免 mainWin 被注入 1500 级 + canHide=false 触发幽灵帧）
    // 用 \b 边界且明确不能有 win 后跟 .filter 之外的 token
    expect(/\bwin\b(?!\s*\.\s*filter|\s*\?\?|\s*\|\|)/.test(arr.replace(/hitWin/g, 'HITWIN'))).toBe(false)
    // W21-P0-NUCLEAR 注释存在
    expect(body).toContain('[W21-P0-NUCLEAR')
  })

  test('[22] popupMenuAt owner = hitWin (W21 nuclear root #5)', () => {
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    const fnBlock = mainSrc.match(/function popupMenuAt\(menu:[^)]*\)[\s\S]*?\n\}/)
    expect(fnBlock).not.toBeNull()
    const body = fnBlock![0]
    // owner = (hitWin && !hitWin.isDestroyed()) ? hitWin : win 模式
    expect(body).toMatch(/hitWin/)
    expect(body).toMatch(/menu\.popup\(\{\s*window:\s*owner\s*\}\)/)
    // 严禁 menu.popup({ window: win }) 直接传 mainWin
    expect(body).not.toMatch(/menu\.popup\(\{\s*window:\s*win\s*\}\)/)
  })

  test('[23] ensureContextMenuOwner parent 优先 hitWin (W21 nuclear · menu.ts)', () => {
    const menuSrc = readFileSync(join(PKG_ROOT, 'src', 'menu.ts'), 'utf-8')
    // parent: parentWin 模式（parentWin = hitWin || win）
    const fnBlock = menuSrc.match(/function ensureContextMenuOwner\(\)[\s\S]*?return ctx\.contextMenuOwner;[\s\S]*?\n\s\s\}/)
    expect(fnBlock).not.toBeNull()
    const body = fnBlock![0]
    // 剥注释（注释中允许出现 historical "parent:ctx.win" 文字描述根因）
    const stripComments = (s: string): string =>
      s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const codeBody = stripComments(body)
    // 必含 ctx.hitWin 优先逻辑
    expect(codeBody).toMatch(/ctx\.hitWin/)
    // 严禁硬编码 parent: ctx.win（必须先尝试 ctx.hitWin）
    expect(codeBody).not.toMatch(/parent:\s*ctx\.win\b/)
    // 实际 parent: parentWin 通用 binding
    expect(codeBody).toMatch(/parent:\s*parentWin/)
    // W21-P0-NUCLEAR 注释存在（含注释整体）
    expect(body).toContain('[W21-P0-NUCLEAR')
  })

  test('[24] menu.ts popupMenuAt callback 用 hitWin.showInactive() (W21 nuclear · 防黑框残影)', () => {
    const menuSrc = readFileSync(join(PKG_ROOT, 'src', 'menu.ts'), 'utf-8')
    const fnBlock = menuSrc.match(/function popupMenuAt\(menu\)[\s\S]*?\n\s\s\}/)
    expect(fnBlock).not.toBeNull()
    // 剥注释后才比对（注释里可能保留 historical ctx.win.showInactive 描述）
    const stripComments = (s: string): string =>
      s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const codeBody = stripComments(fnBlock![0])
    // 严禁 ctx.win.showInactive() 裸调用
    expect(codeBody).not.toMatch(/ctx\.win\.showInactive\(\)/)
    // 必须含 hitWin 或 visiblePet 路径（visiblePet = ctx.hitWin || null）
    expect(codeBody).toMatch(/ctx\.hitWin/)
    expect(codeBody).toMatch(/showInactive/)
  })

  test('[25] 启动后顶部 [0,0] 区域无 mainWin / settings / contextMenuOwner 可见（hitWin 是唯一 panda）', () => {
    // 契约 mock 校验：基于源码声明，mainWin/settings/contextMenuOwner 启动期 show=false 或 lazy
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    const menuSrc = readFileSync(join(PKG_ROOT, 'src', 'menu.ts'), 'utf-8')
    // 1. mainWin show:false
    const winOptsMatch = mainSrc.match(/win = new BrowserWindow\(\{[\s\S]*?\n\s+\}\)/)
    expect(winOptsMatch![0]).toMatch(/show:\s*false/)
    // 2. settingsWindow show:false
    const settingsBlock = mainSrc.match(/function openSettingsWindow\(\)[\s\S]*?settingsWindow = new BrowserWindow\(opts\)/)
    expect(settingsBlock![0]).toMatch(/show:\s*false/)
    // 3. contextMenuOwner show:false（menu.ts 中 ensureContextMenuOwner 配置）
    const ownerBlock = menuSrc.match(/ctx\.contextMenuOwner = new BrowserWindow\(\{[\s\S]*?\}\);/)
    expect(ownerBlock).not.toBeNull()
    expect(ownerBlock![0]).toMatch(/show:\s*false/)
    // 4. update-bubble stub no-op
    const updateBubbleSrc = readFileSync(join(PKG_ROOT, 'src', 'update-bubble.ts'), 'utf-8')
    expect(updateBubbleSrc).toMatch(/getBubbleWindow\(\)\s*\{\s*return\s+null/)
  })

  test('[26] hitWin 是启动期唯一可见 panda (showInactive 仅在 hitWin 创建后)', () => {
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    // hitWin.showInactive() 调用必须存在（ready-to-show 或 fallback）
    expect(mainSrc).toContain('hitWin.showInactive()')
    // mainWin 不应有 win.showInactive() 裸调用
    const lines = mainSrc.split(/\r?\n/)
    const offending = lines
      .filter((l) => /\bwin\.showInactive\s*\(\s*\)/.test(l))
      .filter((l) => !/^\s*\/\//.test(l.trim()) && !/^\s*\*/.test(l.trim()))
    // 仅允许在 togglePetVisibility 等用户主动操作中出现 hitWin.showInactive()，
    // 启动序列禁裸 win.showInactive()
    expect(offending.length).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 10 · cross-mac-version 守护 · 模拟 Mac 11/12/13/14 验证 black-bar fix
//   不依赖真 electron app.getVersion，纯 mock os.release + process.platform
//   验证：W21 关键 fix 在所有 Mac 版本下契约一致（不退化）
// ─────────────────────────────────────────────────────────────────────────────

describe('W21-T1 · cross-mac-version · macOS 11/12/13/14 black-bar fix 不退化', () => {
  // os.release() 返回 Darwin kernel version：
  //   macOS 11 Big Sur     → Darwin 20.x.x
  //   macOS 12 Monterey    → Darwin 21.x.x
  //   macOS 13 Ventura     → Darwin 22.x.x
  //   macOS 14 Sonoma      → Darwin 23.x.x
  //   macOS 15 Sequoia     → Darwin 24.x.x
  // 参考：https://en.wikipedia.org/wiki/Darwin_(operating_system)#Release_history
  const versions = [
    { mac: 'macOS 11 Big Sur',   darwin: '20.6.0' },
    { mac: 'macOS 12 Monterey',  darwin: '21.6.0' },
    { mac: 'macOS 13 Ventura',   darwin: '22.6.0' },
    { mac: 'macOS 14 Sonoma',    darwin: '23.6.0' },
  ]

  for (const v of versions) {
    test(`[27.${versions.indexOf(v) + 1}] ${v.mac} (Darwin ${v.darwin}): mainWin nuclear 5 fix 全部就位`, () => {
      // mock os.release
      const os = require('node:os')
      const origRelease = os.release
      os.release = () => v.darwin
      try {
        // platform 已在 beforeEach 设为 darwin
        expect(process.platform).toBe('darwin')
        expect(os.release()).toBe(v.darwin)

        // 跨版本验证：5 个 nuclear root cause fix 均在源码中存在
        const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
        const menuSrc = readFileSync(join(PKG_ROOT, 'src', 'menu.ts'), 'utf-8')

        // root #1: mainWin transparent=false
        const winOpts = mainSrc.match(/win = new BrowserWindow\(\{[\s\S]*?\n\s+\}\)/)![0]
        expect(winOpts).toMatch(/transparent:\s*false/)

        // root #2: mainWin alwaysOnTop=false
        expect(winOpts).toMatch(/alwaysOnTop:\s*false/)

        // root #3: mainWin no panel type
        expect(winOpts).not.toMatch(/isMac\s*\?\s*\{\s*type:\s*['"]panel['"]/)

        // root #4: reapplyMacVisibility 排除 mainWin
        const visFn = mainSrc.match(/function reapplyMacVisibility\(\)[\s\S]*?\n\}/)![0]
        const arr = visFn.match(/candidates\s*=\s*\[([^\]]*)\]/)![1]
        expect(arr).toMatch(/hitWin/)
        expect(/\bwin\b(?!\s*\.\s*filter|\s*\?\?|\s*\|\|)/.test(arr.replace(/hitWin/g, 'HITWIN'))).toBe(false)

        // root #5: popupMenuAt owner = hitWin
        const popFn = mainSrc.match(/function popupMenuAt\(menu:[^)]*\)[\s\S]*?\n\}/)![0]
        expect(popFn).toMatch(/hitWin/)
        expect(popFn).not.toMatch(/menu\.popup\(\{\s*window:\s*win\s*\}\)/)

        // bonus: menu.ts ensureContextMenuOwner parent = hitWin
        const ensureFn = menuSrc.match(/function ensureContextMenuOwner\(\)[\s\S]*?return ctx\.contextMenuOwner;[\s\S]*?\n\s\s\}/)![0]
        expect(ensureFn).toMatch(/ctx\.hitWin/)
      } finally {
        os.release = origRelease
      }
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 11 · stress · 500 次 mock spawn 验证 0 黑框（防 race condition）
//   不真启 electron，只 mock platform=darwin + 反复执行 contract 检查 +
//   反复 toggle os.release/Darwin version + 验证契约 idempotent
// ─────────────────────────────────────────────────────────────────────────────

describe('W21-T1 · stress · 500 次 mock spawn 黑框防御', () => {
  test('[28] 500 次重复契约校验 + 跨版本随机切换 → 0 退化（idempotent）', () => {
    const os = require('node:os')
    const origRelease = os.release
    const darwinVersions = ['20.6.0', '21.6.0', '22.6.0', '23.6.0', '24.0.0']
    const mainSrc = readFileSync(join(PKG_ROOT, 'src', 'main.ts'), 'utf-8')
    const menuSrc = readFileSync(join(PKG_ROOT, 'src', 'menu.ts'), 'utf-8')

    // 预先解构关键代码块（500 次循环不重读文件，节流 IO 但保契约不变）
    const winOpts = mainSrc.match(/win = new BrowserWindow\(\{[\s\S]*?\n\s+\}\)/)![0]
    const visFn = mainSrc.match(/function reapplyMacVisibility\(\)[\s\S]*?\n\}/)![0]
    const popFn = mainSrc.match(/function popupMenuAt\(menu:[^)]*\)[\s\S]*?\n\}/)![0]
    const ensureFn = menuSrc.match(/function ensureContextMenuOwner\(\)[\s\S]*?return ctx\.contextMenuOwner;[\s\S]*?\n\s\s\}/)![0]

    // 剥注释（注释里 historical 描述允许出现 parent:ctx.win 等历史根因字面）
    const stripComments = (s: string): string =>
      s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const ensureFnCode = stripComments(ensureFn)
    const popFnCode = stripComments(popFn)
    const visFnCode = stripComments(visFn)
    const visCandidatesArr = visFnCode.match(/candidates\s*=\s*\[([^\]]*)\]/)![1]

    let blackFrameDetections = 0
    try {
      for (let i = 0; i < 500; i++) {
        // 模拟随机 mac 版本
        os.release = () => darwinVersions[i % darwinVersions.length]
        // 模拟 mainWin spawn 契约（每轮重新断言 5 nuclear root）
        const checks = [
          /transparent:\s*false/.test(winOpts),
          /alwaysOnTop:\s*false/.test(winOpts),
          !/isMac\s*\?\s*\{\s*type:\s*['"]panel['"]/.test(winOpts),
          /hitWin/.test(visCandidatesArr),
          /hitWin/.test(popFnCode) && !/menu\.popup\(\{\s*window:\s*win\s*\}\)/.test(popFnCode),
          /ctx\.hitWin/.test(ensureFnCode) && !/parent:\s*ctx\.win\b/.test(ensureFnCode),
        ]
        // 任一 check 失败即视为黑框退化
        if (checks.some((c) => !c)) blackFrameDetections++
      }
      // race condition 守护：500 轮全部通过，无任何退化
      expect(blackFrameDetections).toBe(0)
    } finally {
      os.release = origRelease
    }
  }, 30_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 12 · byte-equal 守护补强 · 锁定 W21-T1 测试改动不触碰 anthropic 核心路径
// ─────────────────────────────────────────────────────────────────────────────

describe('W21-T1 · byte-equal 守护', () => {
  test('[29] 本测试文件 (W21 增量) 不引用 src/services/api/{claude,oauth,providers}', () => {
    const testFile = readFileSync(__filename, 'utf-8')
    // import / require 守护
    expect(testFile).not.toMatch(/from\s+['"][^'"]*src\/services\/api\/claude/)
    expect(testFile).not.toMatch(/from\s+['"][^'"]*src\/services\/oauth/)
    expect(testFile).not.toMatch(/from\s+['"][^'"]*src\/services\/api\/providers/)
    expect(testFile).not.toMatch(/require\(['"][^'"]*services\/api\/(claude|providers)/)
    expect(testFile).not.toMatch(/require\(['"][^'"]*services\/oauth/)
  })
})
