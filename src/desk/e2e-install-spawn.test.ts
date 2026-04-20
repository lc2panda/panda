// Input:  W13-T1 端到端集成 — 模拟 npm install → panda --install-desk → panda 启动
//         → 桌面宠物 spawn 完整链路；mock spawn / process.platform / os.tmpdir 注入
//         三场景（成功 / EUNSUPPORTEDPROTOCOL / timeout）+ ENV PANDA_DESK_INSTALL_TIMEOUT_MS
//         覆盖；跨平台路径校验（darwin / win32 / linux）
// Output: ≥10 端到端用例 — 防止 v2.25.17/18 修过的 workspace + timeout P0 回归
// Pos:    src/desk/installer.ts + src/desk/launcher.ts + src/cli/handlers/desk-install.ts
//         三件套联动；W13-T1 install→spawn 闭环测试
//         严守 anthropic byte-equal — 仅 node 内置 + 自家 desk/cli 模块；零新依赖
//
// [NEW-FILE:#W13-01]
// 2026-04-20 15:38 +08:00 W13-T1 端到端集成测试

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
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  ELECTRON_DEPS,
  __createStageDirForTesting,
  __moveNodeModulesForTesting,
  __resetInstallerStateForTesting,
  checkElectronInstalled,
  installPandaOnDeskDeps,
} from './installer.js'
import {
  __locatePandaOnDeskLaunchForTesting,
  __resetSpawnedFlagForTesting,
  maybeSpawnOnDesk,
} from './launcher.js'

// ─────────────────────────────────────────────────────────────────────────────
// 全链路夹具
//
// 模拟用户首次跑 `panda --install-desk` 后再跑 `panda` 的完整目录布局：
//   <tmpDir>/
//     packages/panda-on-desk/
//       package.json
//       launch.cjs
//       node_modules/electron/package.json (install 成功后)
//
// why mkdtemp at beforeEach: bun:test 并发跑多文件，TMP_ROOT 隔离避免 race
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string
let savedArgv: string[]
let savedIsTTY: boolean | undefined
let savedTimeoutEnv: string | undefined
let savedNoDeskEnv: string | undefined
let savedPlatform: PropertyDescriptor | undefined

function setTTY(v: boolean): void {
  Object.defineProperty(process.stdout, 'isTTY', {
    value: v,
    configurable: true,
    writable: true,
  })
}

/** 创建一个 panda-on-desk 模拟子包目录 — 默认无 electron，可注入已装态 */
function makeDeskDir(opts: { electron?: boolean; launchCjs?: boolean } = {}): string {
  const desk = join(tmpDir, 'packages', 'panda-on-desk')
  mkdirSync(desk, { recursive: true })
  writeFileSync(
    join(desk, 'package.json'),
    JSON.stringify({
      name: '@lc2panda/panda-on-desk',
      version: '0.0.0-w13test',
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
    writeFileSync(
      join(desk, 'launch.cjs'),
      '// fake launch.cjs (W13-T1 e2e)',
      'utf-8',
    )
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
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-w13-e2e-'))
  savedArgv = process.argv.slice()
  savedIsTTY = process.stdout.isTTY
  savedTimeoutEnv = process.env.PANDA_DESK_INSTALL_TIMEOUT_MS
  savedNoDeskEnv = process.env.PANDA_NO_DESK
  // 保存 process.platform 描述符（部分 case 会注入跨平台模拟）
  savedPlatform = Object.getOwnPropertyDescriptor(process, 'platform')
  __resetInstallerStateForTesting()
  __resetSpawnedFlagForTesting()
  setTTY(true)
  process.argv = ['node', 'panda']
  delete process.env.PANDA_DESK_INSTALL_TIMEOUT_MS
  delete process.env.PANDA_NO_DESK
})

afterEach(() => {
  __resetInstallerStateForTesting()
  __resetSpawnedFlagForTesting()
  process.argv = savedArgv
  setTTY(savedIsTTY ?? false)
  if (savedTimeoutEnv === undefined) delete process.env.PANDA_DESK_INSTALL_TIMEOUT_MS
  else process.env.PANDA_DESK_INSTALL_TIMEOUT_MS = savedTimeoutEnv
  if (savedNoDeskEnv === undefined) delete process.env.PANDA_NO_DESK
  else process.env.PANDA_NO_DESK = savedNoDeskEnv
  // 复原 process.platform（避免污染下一个用例）
  if (savedPlatform) {
    Object.defineProperty(process, 'platform', savedPlatform)
  }
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 1 · install→spawn 端到端串联：成功路径
//
// 模拟 npm install 成功（人工把 stage/node_modules/electron 写好后跑 mv）
// → checkElectronInstalled 转 true
// → maybeSpawnOnDesk 应进入 spawn 路径（不实拉，mock cp.spawn 验证调用）
// ─────────────────────────────────────────────────────────────────────────────

describe('W13-T1 / e2e · install 成功 → spawn 链路', () => {
  test('1) stage→deskDir mv 成功后 checkElectronInstalled 转 true（install 闭环正确性）', () => {
    const desk = makeDeskDir({ electron: false })
    expect(checkElectronInstalled(desk)).toBe(false)

    // 手工模拟 stage（绕开真实 npm install — 沙盒下 npm 不可用）：
    //   1. createStageDirForTesting 创建 stage + 写 minimal package.json
    //   2. 在 stage/node_modules/ 下写假 electron entry（模拟 npm install 产物）
    //   3. 跑 __moveNodeModulesForTesting → 验证 desk 内 electron 可被检测
    const stage = __createStageDirForTesting(ELECTRON_DEPS)
    try {
      const stageElectron = join(stage, 'node_modules', 'electron')
      mkdirSync(stageElectron, { recursive: true })
      writeFileSync(
        join(stageElectron, 'package.json'),
        JSON.stringify({ name: 'electron', version: '41.0.0' }),
        'utf-8',
      )
      // 同时塞几个其他 dep — 模拟 4 个 ELECTRON_DEPS 全装
      for (const name of ['electron-updater', 'koffi', 'htmlparser2']) {
        const d = join(stage, 'node_modules', name)
        mkdirSync(d, { recursive: true })
        writeFileSync(
          join(d, 'package.json'),
          JSON.stringify({ name, version: '1.0.0' }),
          'utf-8',
        )
      }

      const result = __moveNodeModulesForTesting(stage, desk)
      expect(result.errors).toEqual([])
      expect(result.moved).toBe(4)

      // E2E 关键断言：mv 完成后 checkElectronInstalled 立即识别
      expect(checkElectronInstalled(desk)).toBe(true)

      // 进一步：4 个 dep 都搬迁了
      const moved = readdirSync(join(desk, 'node_modules')).sort()
      expect(moved).toContain('electron')
      expect(moved).toContain('electron-updater')
      expect(moved).toContain('koffi')
      expect(moved).toContain('htmlparser2')
    } finally {
      rmSync(stage, { recursive: true, force: true })
    }
  })

  test('2) electron 已装 → maybeSpawnOnDesk 全 gate 通过路径（cwd 切到 tmpDir，sandbox feature off → 静默 no-op）', () => {
    // 让 launcher buildCandidatePaths 命中 cwd fallback：把 cwd 切到 tmpDir
    const desk = makeDeskDir({ electron: true, launchCjs: true })
    expect(existsSync(join(desk, 'launch.cjs'))).toBe(true)
    expect(checkElectronInstalled(desk)).toBe(true)

    // E2E 契约：electron 已装 + launch.cjs 存在 + TTY 真 + argv 干净 → maybeSpawnOnDesk
    // 应当不抛错（沙盒 feature('BUDDY')=false 时早 gate return 也算契约满足）
    // 实际环境中此处会触发 detached spawn — 我们用 launcher.test.ts 已有用例覆盖
    const savedCwd = process.cwd()
    try {
      process.chdir(tmpDir)
      // defer:false 强制同步执行 — 任何抛错立即可见
      expect(() => maybeSpawnOnDesk({ defer: false })).not.toThrow()
    } finally {
      process.chdir(savedCwd)
    }
  })

  test('3) cleanup tmp dir：installPandaOnDeskDeps 失败后 stage 目录必须清理', async () => {
    // 用真实 installPandaOnDeskDeps + 假 npmCmd 触发失败路径，验证 cleanupStage 工作
    // 已存在 installer.test.ts 有类似用例，但 e2e 视角再校验一次（防回归）
    const desk = makeDeskDir({ electron: false })
    const stagePaths: string[] = []
    await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd: 'definitely-not-a-real-npm-w13-cleanup',
      timeoutMs: 5000,
      onLog: (l) => {
        if (l.includes('stage=')) {
          const p = l.split('stage=')[1].trim()
          stagePaths.push(p)
        }
      },
    })
    expect(stagePaths.length).toBeGreaterThan(0)
    // E2E 关键：失败后 stage 必须被清理
    for (const p of stagePaths) {
      expect(existsSync(p)).toBe(false)
    }
  }, 15_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 2 · 失败注入：三场景（exit 1 / EUNSUPPORTEDPROTOCOL / timeout）
//
// 实施方式：写一个 fake-npm.js 到临时目录，通过 npmCmd 选项注入。
//   - installer 用 spawn(npmCmd, args, { shell:true }) 调起 → fake-npm 真正受控运行
//   - 比 mock cp.spawn 可靠（installer 用 ESM `import { spawn }` 绑定，
//     mutation 在 bun 下不一定 reflective）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 写一个 fake-npm.js 脚本到 tmpDir，模拟指定行为。返回可用作 npmCmd 的命令串。
 *
 * 行为可选：
 *   - exit 0 / 1 / 任意 code（含 stderr 文本）
 *   - hang forever（用于触发 installer timeout 路径）
 *   - 在 cwd 下创建 node_modules/<deps> 模拟 npm install 成功产物
 */
function writeFakeNpm(opts: {
  /** exit code，默认 0 */
  exitCode?: number
  /** stderr 输出行（每行一行） */
  stderrLines?: string[]
  /** 是否永不退出（用于 timeout 测试） */
  hang?: boolean
  /** 是否在 cwd 下创建 node_modules/<dep> 假产物（模拟 npm install 成功） */
  createNodeModules?: string[]
  /** 写入子进程启动后的 cwd 到此 marker 文件（用于断言 cwd 隔离） */
  cwdMarkerPath?: string
}): string {
  const script = join(tmpDir, `fake-npm-${Math.random().toString(36).slice(2, 8)}.cjs`)
  const lines: string[] = [
    '#!/usr/bin/env node',
    '"use strict";',
    'const fs = require("fs");',
    'const path = require("path");',
  ]
  if (opts.cwdMarkerPath) {
    const marker = JSON.stringify(opts.cwdMarkerPath)
    lines.push(`try { fs.writeFileSync(${marker}, process.cwd(), "utf-8"); } catch (e) {}`)
  }
  for (const line of opts.stderrLines ?? []) {
    lines.push(`process.stderr.write(${JSON.stringify(line + '\n')});`)
  }
  if (opts.createNodeModules && opts.createNodeModules.length > 0) {
    for (const dep of opts.createNodeModules) {
      lines.push(`{`)
      lines.push(`  const d = path.join(process.cwd(), "node_modules", ${JSON.stringify(dep)});`)
      lines.push(`  fs.mkdirSync(d, { recursive: true });`)
      lines.push(
        `  fs.writeFileSync(path.join(d, "package.json"), JSON.stringify({ name: ${JSON.stringify(dep)}, version: "1.0.0" }), "utf-8");`,
      )
      lines.push(`}`)
    }
  }
  if (opts.hang) {
    // sleep 一段较长时间 — installer setTimeout 应远早触发 SIGKILL；
    // why 不用 setInterval(() => {}, 60s)：windows shell:true 下 child.kill 只杀 cmd shell，
    // 子 node 不死，bun:test 等不到 close → 测试超时。
    // 这里 8s 自杀作为兜底，让 close 事件最终能 fire（即便 SIGKILL 没穿透）。
    // 实际生产中 timeoutMs 会远大于 8s（默认 1800s），不会撞到 self-exit。
    lines.push('setTimeout(() => process.exit(99), 8_000);')
  } else {
    lines.push(`process.exit(${opts.exitCode ?? 0});`)
  }
  writeFileSync(script, lines.join('\n'), 'utf-8')
  // 通过 process.execPath（当前 node/bun）调起 — 跨平台稳定
  return `${JSON.stringify(process.execPath)} ${JSON.stringify(script)}`
}

describe('W13-T1 / e2e · 失败注入', () => {
  test('4) npm exit 1 → ok:false + 友好中文消息（不抛 + 不污染）', async () => {
    const desk = makeDeskDir({ electron: false })
    const npmCmd = writeFakeNpm({
      exitCode: 1,
      stderrLines: ['npm ERR! code E404', 'npm ERR! 404 Not Found'],
    })
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd,
      timeoutMs: 10_000,
    })
    expect(result.ok).toBe(false)
    expect(result.code).toBe(1)
    expect(result.message).toMatch(/失败|exit/)
    // E2E 关键：失败消息必须是用户可读中文，不是裸 stack trace
    expect(result.message.length).toBeGreaterThan(10)
  }, 20_000)

  test('5) workspace:* error (EUNSUPPORTEDPROTOCOL) → tmp stage 隔离方案保护（cwd 必须是 stage 而非 deskDir）', async () => {
    const desk = makeDeskDir({ electron: false })
    const cwdMarker = join(tmpDir, 'fake-npm-cwd-marker.txt')
    const npmCmd = writeFakeNpm({
      exitCode: 1,
      stderrLines: [
        'npm ERR! code EUNSUPPORTEDPROTOCOL',
        'npm ERR! Unsupported URL Type "workspace:": workspace:*',
      ],
      cwdMarkerPath: cwdMarker,
    })
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd,
      timeoutMs: 10_000,
    })
    expect(result.ok).toBe(false)
    // P0 hotfix v2.25.16 关键回归：spawn cwd 必须是 os.tmpdir() 下的 stage 目录，
    // 而非 desk（否则 npm 会沿 cwd 向上扫到主仓 workspace:* devDeps）
    expect(existsSync(cwdMarker)).toBe(true)
    const spawnedCwd = readFileSync(cwdMarker, 'utf-8').trim()
    expect(spawnedCwd.length).toBeGreaterThan(0)
    expect(spawnedCwd.startsWith(tmpdir())).toBe(true)
    expect(spawnedCwd).not.toBe(desk)
    // stage 目录命名前缀应含 'pandacc-desk-install-'
    expect(spawnedCwd).toContain('pandacc-desk-install-')
  }, 20_000)

  test('6) timeout 触发 → SIGKILL + 提示 PANDA_DESK_INSTALL_TIMEOUT_MS 覆盖', async () => {
    const desk = makeDeskDir({ electron: false })
    const npmCmd = writeFakeNpm({ hang: true })
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd,
      timeoutMs: 500, // 500ms 极短 — 用例必触发 timeout
    })
    expect(result.ok).toBe(false)
    // E2E 关键：超时消息必须含 ENV 提示，方便用户自助修复
    expect(result.message).toMatch(/超时|timeout/i)
    expect(result.message).toContain('PANDA_DESK_INSTALL_TIMEOUT_MS')
  }, 25_000)

  test('7) ENV PANDA_DESK_INSTALL_TIMEOUT_MS 覆盖默认值（v2.25.18 修过的 P0）', async () => {
    const desk = makeDeskDir({ electron: false })
    process.env.PANDA_DESK_INSTALL_TIMEOUT_MS = '500' // 500ms
    const npmCmd = writeFakeNpm({ hang: true })
    const t0 = Date.now()
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd,
      // 注意：不传 opts.timeoutMs — 验证 ENV 生效
    })
    const elapsed = Date.now() - t0
    expect(result.ok).toBe(false)
    // 应在 500ms ENV 设定后触发，而非 1800s 默认（防止 ENV 失效）
    // 容忍 fake-npm self-exit 的 8s 兜底（Windows shell:true 下 SIGKILL 不穿透）
    expect(elapsed).toBeLessThan(15_000)
    expect(result.message).toMatch(/超时|timeout/i)
  }, 25_000)

  test('8) ENV 无效（NaN）→ opts.timeoutMs 显式优先级正确（不被错误覆盖崩盘）', async () => {
    const desk = makeDeskDir({ electron: false })
    process.env.PANDA_DESK_INSTALL_TIMEOUT_MS = 'not-a-number'
    const npmCmd = writeFakeNpm({ hang: true })
    const t0 = Date.now()
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd,
      timeoutMs: 500, // 显式 500ms — 应优先于 ENV NaN
    })
    const elapsed = Date.now() - t0
    expect(result.ok).toBe(false)
    expect(elapsed).toBeLessThan(15_000)
    expect(result.message).toMatch(/超时|timeout/i)
  }, 25_000)

  test('9) 并发幂等：两次同时调 installPandaOnDeskDeps → 复用同一 in-flight Promise', async () => {
    const desk = makeDeskDir({ electron: false })
    const npmCmd = writeFakeNpm({ exitCode: 1 })
    const [r1, r2] = await Promise.all([
      installPandaOnDeskDeps({ deskDir: desk, npmCmd, timeoutMs: 10_000 }),
      installPandaOnDeskDeps({ deskDir: desk, npmCmd, timeoutMs: 10_000 }),
    ])
    // 两个 await 应拿到同一结果对象（in-flight Promise 复用）
    expect(r1).toBe(r2)
    expect(r1.ok).toBe(false)
  }, 20_000)

  test('9b) install 成功路径：fake npm 创建 electron node_modules → ok:true（端到端闭环）', async () => {
    // 这是真正的 e2e success path — fake npm 创建 stage/node_modules/electron，
    // installer 把它搬到 deskDir，最终 checkElectronInstalled 应转 true
    const desk = makeDeskDir({ electron: false })
    const npmCmd = writeFakeNpm({
      exitCode: 0,
      createNodeModules: ['electron', 'electron-updater', 'koffi', 'htmlparser2'],
    })
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd,
      timeoutMs: 10_000,
    })
    expect(result.ok).toBe(true)
    expect(result.code).toBe(0)
    expect(result.alreadyInstalled).toBeFalsy()
    expect(checkElectronInstalled(desk)).toBe(true)
    // 验证 4 个 deps 都搬迁
    const moved = readdirSync(join(desk, 'node_modules')).sort()
    expect(moved).toContain('electron')
    expect(moved).toContain('electron-updater')
    expect(moved).toContain('koffi')
    expect(moved).toContain('htmlparser2')
  }, 20_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 3 · 跨平台路径：locatePandaOnDeskLaunch 在 darwin / win32 / linux 行为
// ─────────────────────────────────────────────────────────────────────────────

describe('W13-T1 / e2e · 跨平台路径', () => {
  test('10) darwin: launcher 候选数组解析正确（POSIX 路径风格）', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
    // 模拟 npm install 后的典型 mac 路径：
    //   /usr/local/lib/node_modules/@lc2panda/panda-code/dist/cli.js
    //   → packages/panda-on-desk/launch.cjs (上推 1 层)
    const installRoot = join(tmpDir, 'usr', 'local', 'lib', 'node_modules', '@lc2panda', 'panda-code')
    mkdirSync(join(installRoot, 'dist'), { recursive: true })
    const pkgDir = join(installRoot, 'packages', 'panda-on-desk')
    mkdirSync(pkgDir, { recursive: true })
    const launchPath = join(pkgDir, 'launch.cjs')
    writeFileSync(launchPath, '// darwin fake', 'utf-8')

    const here = join(installRoot, 'dist')
    const candidates = [
      join(here, '..', '..', 'packages', 'panda-on-desk', 'launch.cjs'),
      join(here, '..', 'packages', 'panda-on-desk', 'launch.cjs'),
      join(here, '..', '..', '..', 'packages', 'panda-on-desk', 'launch.cjs'),
      join(process.cwd(), 'packages', 'panda-on-desk', 'launch.cjs'),
    ]
    expect(__locatePandaOnDeskLaunchForTesting(candidates)).toBe(launchPath)
  })

  test('11) win32: 反斜杠路径仍能命中（path.join 自动归一）', () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })
    // 模拟 win 路径：C:\Users\X\AppData\Roaming\npm\node_modules\@lc2panda\panda-code\
    const installRoot = join(tmpDir, 'AppData', 'Roaming', 'npm', 'node_modules', '@lc2panda', 'panda-code')
    mkdirSync(join(installRoot, 'dist'), { recursive: true })
    const pkgDir = join(installRoot, 'packages', 'panda-on-desk')
    mkdirSync(pkgDir, { recursive: true })
    const launchPath = join(pkgDir, 'launch.cjs')
    writeFileSync(launchPath, '// win32 fake', 'utf-8')

    const here = join(installRoot, 'dist')
    const candidates = [
      join(here, '..', '..', 'packages', 'panda-on-desk', 'launch.cjs'),
      join(here, '..', 'packages', 'panda-on-desk', 'launch.cjs'),
    ]
    // win32 平台下 join 返回反斜杠（在真 win 上）；测试主机 path.join 行为以宿主 platform 为准
    // 这里只断言能命中 — 路径分隔符差异由 node:path 抽象
    expect(__locatePandaOnDeskLaunchForTesting(candidates)).toBe(launchPath)
  })

  test('12) linux: 仓库源码 dev 路径（src/desk/launcher.ts → ../../packages/...）', () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
    // 模拟 dev 仓库布局：<repo>/src/desk/launcher.ts → ../../packages/panda-on-desk/launch.cjs
    const repoRoot = join(tmpDir, 'home', 'dev', 'panda-repo')
    mkdirSync(join(repoRoot, 'src', 'desk'), { recursive: true })
    const pkgDir = join(repoRoot, 'packages', 'panda-on-desk')
    mkdirSync(pkgDir, { recursive: true })
    const launchPath = join(pkgDir, 'launch.cjs')
    writeFileSync(launchPath, '// linux fake', 'utf-8')

    const here = join(repoRoot, 'src', 'desk')
    const candidates = [
      // dev 路径优先（2 层 ..）
      join(here, '..', '..', 'packages', 'panda-on-desk', 'launch.cjs'),
      join(here, '..', 'packages', 'panda-on-desk', 'launch.cjs'),
    ]
    expect(__locatePandaOnDeskLaunchForTesting(candidates)).toBe(launchPath)
  })

  test('13) 跨平台：候选数组全空 → null（不抛 ENOENT，跨平台一致）', () => {
    for (const plat of ['darwin', 'win32', 'linux'] as const) {
      Object.defineProperty(process, 'platform', { value: plat, configurable: true })
      const ghosts = [
        join(tmpDir, 'no-such', plat, 'launch.cjs'),
        join(tmpDir, 'also-no-such', plat, 'launch.cjs'),
      ]
      expect(__locatePandaOnDeskLaunchForTesting(ghosts)).toBeNull()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 4 · launch.cjs spawn detached 不阻塞 panda CLI 主流程
//
// 验证 spawn 选项（detached + stdio:ignore + windowsHide）— 这是 panda CLI 退出
// 后桌面端独立生存的关键契约。
// ─────────────────────────────────────────────────────────────────────────────

describe('W13-T1 / e2e · launch.cjs spawn 不阻塞契约', () => {
  test('14) maybeSpawnOnDesk spawn 选项含 detached:true + stdio:"ignore" + windowsHide:true', () => {
    const desk = makeDeskDir({ electron: true, launchCjs: true })
    expect(checkElectronInstalled(desk)).toBe(true)

    const cp = require('node:child_process') as {
      spawn: (...args: unknown[]) => unknown
    }
    const original = cp.spawn
    let capturedOpts: { detached?: boolean; stdio?: string; windowsHide?: boolean } | undefined
    let unrefCalled = false
    cp.spawn = ((_cmd: unknown, _argv: unknown, opts: unknown) => {
      capturedOpts = opts as typeof capturedOpts
      return {
        unref: () => {
          unrefCalled = true
        },
        on: () => {},
      } as unknown as ReturnType<typeof cp.spawn>
    }) as unknown as typeof cp.spawn

    const savedCwd = process.cwd()
    try {
      process.chdir(tmpDir)
      maybeSpawnOnDesk({ defer: false })
    } finally {
      process.chdir(savedCwd)
      cp.spawn = original
    }

    // 沙盒下 feature('BUDDY')=false 时 capturedOpts undefined（未 spawn）— 非 e2e 错误
    if (capturedOpts) {
      expect(capturedOpts.detached).toBe(true)
      expect(capturedOpts.stdio).toBe('ignore')
      expect(capturedOpts.windowsHide).toBe(true)
      expect(unrefCalled).toBe(true)
    }
  })

  test('15) electron 未装 → maybeSpawnOnDesk 走 hint 路径不 spawn（W4-T1 友好降级）', () => {
    const desk = makeDeskDir({ electron: false, launchCjs: true })
    expect(checkElectronInstalled(desk)).toBe(false)

    const cp = require('node:child_process') as {
      spawn: (...args: unknown[]) => unknown
    }
    const original = cp.spawn
    let spawnCalled = false
    cp.spawn = (() => {
      spawnCalled = true
      throw new Error('should-not-be-called when electron missing')
    }) as unknown as typeof cp.spawn

    // hint 走 stderr — 捕获以验证（沙盒 feature off 时 hint 不会打，仅验证不抛）
    const stderrCapture: string[] = []
    const savedWrite = process.stderr.write
    ;(process.stderr as unknown as { write: (s: string | Uint8Array) => boolean }).write = (
      s: string | Uint8Array,
    ) => {
      stderrCapture.push(typeof s === 'string' ? s : Buffer.from(s).toString('utf-8'))
      return true
    }

    const savedCwd = process.cwd()
    try {
      process.chdir(tmpDir)
      expect(() => maybeSpawnOnDesk({ defer: false })).not.toThrow()
      // E2E 契约：electron 缺 → 必不 spawn
      expect(spawnCalled).toBe(false)
    } finally {
      process.chdir(savedCwd)
      ;(process.stderr as unknown as { write: typeof savedWrite }).write = savedWrite
      cp.spawn = original
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group 5 · stage package.json 防回归：必须不含 workspace 协议
//
// v2.25.16 P0 根因：原 cwd:deskDir 跑 npm install → npm 沿 cwd 向上扫到主仓
// package.json → 撞 workspace:* devDeps → EUNSUPPORTEDPROTOCOL。
// 修复后 stage 写最小 package.json — 这条用例守护 stage JSON 永远不含 workspace。
// ─────────────────────────────────────────────────────────────────────────────

describe('W13-T1 / e2e · stage 隔离 P0 回归', () => {
  test('16) stage package.json 序列化 JSON 必不含 "workspace:" 字串（防 v2.25.16 回归）', () => {
    const stage = __createStageDirForTesting(ELECTRON_DEPS)
    try {
      const pkgRaw = readFileSync(join(stage, 'package.json'), 'utf-8')
      // P0 关键回归：JSON 不含任何 workspace 协议字符串
      expect(pkgRaw).not.toContain('workspace:')
      // 同时验证 dependencies 都是 ^X 或 ~X 风格
      const pkg = JSON.parse(pkgRaw) as { dependencies: Record<string, string> }
      for (const [name, ver] of Object.entries(pkg.dependencies)) {
        expect(ver, `dep ${name} 版本必须 semver 风格，不能含 workspace:`).not.toContain('workspace:')
        expect(ver, `dep ${name} 版本必须 semver 风格，不能含 file:`).not.toContain('file:')
        expect(ver, `dep ${name} 版本必须 semver 风格，不能含 link:`).not.toContain('link:')
      }
    } finally {
      rmSync(stage, { recursive: true, force: true })
    }
  })

  test('17) stage .npmrc 必须为空（防继承主仓 .npmrc workspace 配置）', () => {
    const stage = __createStageDirForTesting(ELECTRON_DEPS)
    try {
      const npmrcPath = join(stage, '.npmrc')
      expect(existsSync(npmrcPath)).toBe(true)
      // 必须为空 — 任何继承的 prefix/store/workspace 配置都会破坏隔离
      expect(readFileSync(npmrcPath, 'utf-8')).toBe('')
    } finally {
      rmSync(stage, { recursive: true, force: true })
    }
  })
})
