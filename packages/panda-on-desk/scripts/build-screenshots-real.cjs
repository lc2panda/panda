#!/usr/bin/env node
// Input: src/renderer/hit.html (真渲染源) + 7 状态序列 (idle/thinking/working/sleeping/error/attention/notification)
// Output: build/screenshots/real/ 下 7 PNG —— 通过 Electron headless（offscreen / 不可见窗）capturePage().toPNG() 截屏
// Pos: panda-on-desk W11-T2 真截图 (路径 A) — 替代 W6-T1/W10-T2 sharp 程序化合成的最高保真度替代源
//
// [NEW-FILE:#W11-02] [W11-T2-REAL-SHOT 20260420]
// 触发原因：W6-T1 + W10-T2 用 sharp 程序化生成 9 PNG 是合成图（SVG → PNG）。
//          真 Electron 渲染 hit.html → capturePage 才能拿到真实 CSS 动画一帧 + 系统字体 + transparent compositor。
// 无法仅修改现有 build-screenshots.cjs：
//   - 该脚本基于 sharp 同步 SVG → PNG，与 Electron 异步窗渲染范式根本不兼容
//   - 既有脚本仍需保留作为 fallback（无 electron 环境/CI 仅 sharp 时降级）
//   - 拆分独立脚本符合"职责单一"——本脚本只做 real shot
// 证据：
//   - Electron BrowserWindow.capturePage() 官方 API：https://electronjs.org/docs/api/browser-window#wincapturepagerect
//     （返回 NativeImage，toPNG() 转 Buffer）
//   - offscreen rendering 不需要显示器：webPreferences.offscreen=true
//     https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering
//   - transparent + show:false + paint event 触发首屏 ready：标准模式
//
// 用法：
//   # 真截屏（推荐：直接用 electron 二进制运行 — 避免 spawn 子进程在 Windows 下的 stdio 阻塞）
//   cd packages/panda-on-desk && ./node_modules/electron/dist/electron.exe scripts/build-screenshots-real.cjs
//
//   # node 驱动模式（spawn electron 子进程，stdio piped）
//   cd packages/panda-on-desk && node scripts/build-screenshots-real.cjs
//
//   cd packages/panda-on-desk && node scripts/build-screenshots-real.cjs --check   # 干跑
//   cd packages/panda-on-desk && node scripts/build-screenshots-real.cjs --probe   # 探活
//
// 输出布局：
//   build/screenshots/real/panda-real-200x200-{state}.png   （7 PNG）
//   build/screenshots/real/manifest.json                    （时间戳 + 哈希 + 状态 → 路径映射）
//
// 严守：
//   - 0 新依赖（仅用 electron 已有 + node:fs/path/child_process）
//   - 不动任何 anthropic byte-equal（不触 src/services/api/claude.ts、oauth、providers.ts）
//   - 不动其他 W11 task（独立脚本 + 独立输出目录 build/screenshots/real/）

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')

const PKG_ROOT = path.resolve(__dirname, '..')
const REAL_DIR = path.join(PKG_ROOT, 'build', 'screenshots', 'real')
const HIT_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'hit.html')

const STATES = [
  'idle',
  'thinking',
  'working',
  'sleeping',
  'error',
  'attention',
  'notification',
]

const args = process.argv.slice(2)
const DRY = args.includes('--check') || args.includes('--dry-run')
const PROBE = args.includes('--probe')
// 当前进程是否是 electron runtime（process.versions.electron 存在）
// 直接用 electron 二进制运行时为 true；用 node 运行时为 false
const IS_ELECTRON_RUNTIME = !!(process.versions && process.versions.electron)
const ELECTRON_INNER = args.includes('--electron-inner') || IS_ELECTRON_RUNTIME

// ─────────────────────────────────────────────────────────────────
// 父进程逻辑：spawn electron 子进程跑本脚本（带 --electron-inner 标志）
// 子进程在 electron runtime 内 require('electron') 拿到 BrowserWindow / app
// ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function findElectronBinary() {
  const candidates = [
    path.resolve(PKG_ROOT, 'node_modules', 'electron', 'dist', 'electron.exe'),
    path.resolve(PKG_ROOT, '..', '..', 'node_modules', 'electron', 'dist', 'electron.exe'),
    // Linux/macOS fallback (虽然 W11-T2 主战场是 Windows，但保留跨平台能力)
    path.resolve(PKG_ROOT, 'node_modules', 'electron', 'dist', 'electron'),
    path.resolve(PKG_ROOT, '..', '..', 'node_modules', 'electron', 'dist', 'electron'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

function probeElectron() {
  const bin = findElectronBinary()
  if (!bin) {
    console.error('[probe] electron binary not found in node_modules/electron/dist/')
    return false
  }
  console.log(`[probe] electron binary: ${bin}`)
  // 不实际启动 — 仅校验文件存在 + 可执行。Windows 下 .exe 默认可执行
  try {
    const stat = fs.statSync(bin)
    if (!stat.isFile()) return false
    console.log(`[probe] electron size: ${(stat.size / 1024 / 1024).toFixed(1)} MB`)
    return true
  } catch (e) {
    console.error(`[probe] stat failed: ${e.message}`)
    return false
  }
}

async function spawnElectronChild() {
  const bin = findElectronBinary()
  if (!bin) {
    throw new Error('electron binary not found — install electron in panda-on-desk/node_modules')
  }
  // electron 接受脚本路径作为入口；--electron-inner 让本脚本进入子进程分支
  const scriptPath = __filename
  return new Promise((resolve, reject) => {
    // why pipe（不是 inherit）：Windows + Git-Bash + 'inherit' 模式下 electron 子进程的 stdio
    // 偶现卡死握手（child 永不退出）。pipe + 主动 fwd 更稳健，且能让父进程 await child 自然结束。
    const child = spawn(bin, [scriptPath, '--electron-inner'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: PKG_ROOT,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SANDBOX: '1',
        ELECTRON_NO_ATTACH_CONSOLE: '1',
      },
      windowsHide: true,
    })
    if (child.stdout) child.stdout.on('data', (d) => process.stdout.write(d))
    if (child.stderr) child.stderr.on('data', (d) => process.stderr.write(d))
    let settled = false
    child.on('error', (e) => { if (!settled) { settled = true; reject(e) } })
    child.on('exit', (code) => {
      clearTimeout(killTimer)
      if (settled) return
      settled = true
      if (code === 0) resolve()
      else reject(new Error(`electron child exited with code ${code}`))
    })
    // 90s 超时（7 状态各 ~600-800ms 等待 + capture，留足余量）
    const killTimer = setTimeout(() => {
      try { child.kill() } catch {}
      if (!settled) { settled = true; reject(new Error('electron child timed out (90s)')) }
    }, 90000)
  })
}

// ─────────────────────────────────────────────────────────────────
// 子进程逻辑（仅 ELECTRON_INNER 时执行）：
// 1) app.whenReady()
// 2) 创建 transparent BrowserWindow (200×200, show:false)
// 3) loadFile(hit.html)
// 4) 等 did-finish-load
// 5) 对每个 state：
//    a) executeJavaScript('window.__pandaSetState("xxx")')
//    b) 等 1 RAF + 200ms（CSS 动画起始帧 + paint）
//    c) capturePage() → toPNG() → 写盘
// 6) 写 manifest.json
// 7) app.quit()
// ─────────────────────────────────────────────────────────────────

async function runElectronInner() {
  // 在 electron runtime 内才能 require('electron')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require('electron')
  const { app, BrowserWindow } = electron

  // why 文件日志：electron Windows 下 detach console，process.stdout.write 不会出现在调用方终端，
  //              用文件 trace 调试 + 给父进程读
  ensureDir(REAL_DIR)
  const traceLog = path.join(REAL_DIR, '_trace.log')
  function trace(msg) {
    try {
      fs.appendFileSync(traceLog, `[${new Date().toISOString()}] ${msg}\n`)
    } catch {}
    try { console.log(msg) } catch {}
  }
  // 清旧 trace
  try { if (fs.existsSync(traceLog)) fs.unlinkSync(traceLog) } catch {}
  trace(`runElectronInner starting · electron=${process.versions.electron} chrome=${process.versions.chrome}`)

  // GPU 在某些 Windows headless 场景会卡 — 禁用更稳
  try { app.disableHardwareAcceleration() } catch {}
  try { app.commandLine.appendSwitch('disable-gpu') } catch {}
  try { app.commandLine.appendSwitch('disable-gpu-compositing') } catch {}
  try { app.commandLine.appendSwitch('no-sandbox') } catch {}

  trace('awaiting app.whenReady()...')
  await app.whenReady()
  trace('app ready')

  const manifest = {
    generatedAt: new Date().toISOString(),
    pid: process.pid,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    states: {},
  }

  trace('creating BrowserWindow...')
  const win = new BrowserWindow({
    width: 200,
    height: 200,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    skipTaskbar: true,
    webPreferences: {
      offscreen: false, // offscreen 在某些 GPU 路径不稳；show:false 已足够 headless
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  trace('window created, loading hit.html...')
  // 等 hit.html 加载完成
  await new Promise((resolve, reject) => {
    win.webContents.once('did-finish-load', () => { trace('did-finish-load'); resolve() })
    win.webContents.once('did-fail-load', (_e, code, desc) =>
      reject(new Error(`did-fail-load ${code} ${desc}`)),
    )
    win.loadFile(HIT_HTML).catch(reject)
  })

  // 给首帧 paint 留时间（W1-T2 panda 形象 + 默认 idle 呼吸动画起始）
  trace('first paint settle 600ms...')
  await new Promise((r) => setTimeout(r, 600))

  for (const state of STATES) {
    try {
      trace(`state=${state} setState...`)
      // 切状态（hit.html 已暴露 window.__pandaSetState）
      await win.webContents.executeJavaScript(
        `window.__pandaSetState && window.__pandaSetState(${JSON.stringify(state)});`,
      )
      // 给 CSS 动画起始帧充分时间（多数 ≤ 0.5s 进入"代表性帧"）
      // 不同状态选不同等待：thinking 问号上浮 0.5s 内出现；sleeping Z 上升 1s 周期
      const waitMs =
        state === 'sleeping' ? 800 :
        state === 'error' ? 700 :       // 摔倒动画 0.6s forwards
        state === 'attention' ? 250 :   // 跳跃 0.5s 周期，250ms 抓最高点
        state === 'notification' ? 200 : // 铃铛摇晃 0.4s 周期
        state === 'thinking' ? 500 :     // 问号上浮 1s 周期，0.5s 抓最高点
        state === 'working' ? 400 :      // 摇头 0.8s 周期，0.4s 抓最大角度
        500                              // idle 呼吸 3s 周期
      await new Promise((r) => setTimeout(r, waitMs))

      trace(`state=${state} capturing...`)
      const img = await win.webContents.capturePage()
      const png = img.toPNG()
      const outName = `panda-real-200x200-${state}.png`
      const outPath = path.join(REAL_DIR, outName)
      fs.writeFileSync(outPath, png)
      const stat = fs.statSync(outPath)
      manifest.states[state] = {
        file: outName,
        bytes: stat.size,
        capturedAt: new Date().toISOString(),
      }
      trace(`  -> ${outName} (${(stat.size / 1024).toFixed(1)} KB)`)
    } catch (err) {
      trace(`[err] capture ${state}: ${err && err.message}`)
      manifest.states[state] = { file: null, error: String(err && err.message) }
    }
  }

  fs.writeFileSync(
    path.join(REAL_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  )
  trace(`real screenshots written to ${REAL_DIR}`)
  trace(`manifest.json: ${Object.keys(manifest.states).length} state(s)`)

  // 干净退出
  win.destroy()
  app.quit()
}

// ─────────────────────────────────────────────────────────────────
// 入口
// ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `[panda-on-desk · W11-T2] real screenshots${DRY ? ' (DRY RUN)' : ''}${PROBE ? ' (PROBE)' : ''}${IS_ELECTRON_RUNTIME ? ' (ELECTRON RUNTIME)' : ' (NODE RUNTIME)'}`,
  )

  // 在 electron runtime 下：直接执行截屏逻辑，不走父子进程
  if (ELECTRON_INNER) {
    await runElectronInner()
    return
  }

  // 以下分支只在 node runtime 下生效
  if (PROBE) {
    const ok = probeElectron()
    process.exit(ok ? 0 : 1)
    return
  }

  if (DRY) {
    const bin = findElectronBinary()
    console.log(`[dry] electron binary: ${bin || '<not found>'}`)
    console.log(`[dry] hit.html: ${HIT_HTML} (exists=${fs.existsSync(HIT_HTML)})`)
    console.log(`[dry] output dir: ${REAL_DIR}`)
    console.log(`[dry] would capture ${STATES.length} states: ${STATES.join(', ')}`)
    return
  }

  // node 父进程：spawn electron 子进程
  await spawnElectronChild()
  // 验收：检查输出
  const expected = STATES.map((s) => `panda-real-200x200-${s}.png`)
  const missing = expected.filter((f) => !fs.existsSync(path.join(REAL_DIR, f)))
  if (missing.length > 0) {
    console.error(`[fail] missing real screenshots: ${missing.join(', ')}`)
    process.exit(2)
  }
  console.log(`[ok] all ${expected.length} real screenshots ready`)
}

// why 不用 require.main === module：electron runtime 下 require.main 总指向 'electron' 内部模块，
//                                    不等于本脚本 module。改为更宽松的判定：
//                                    1) 是 electron runtime（自动入口）
//                                    2) 或 node runtime 下 __filename 是入口脚本（process.argv[1]）
const isEntry =
  IS_ELECTRON_RUNTIME ||
  (process.argv[1] && path.resolve(process.argv[1]) === __filename)
if (isEntry) {
  main().catch((err) => {
    try {
      // 写 fatal 到 trace 文件（即使父进程看不到 stderr）
      ensureDir(REAL_DIR)
      fs.appendFileSync(
        path.join(REAL_DIR, '_trace.log'),
        `[FATAL ${new Date().toISOString()}] ${err && (err.stack || err.message || err)}\n`,
      )
    } catch {}
    try { console.error('[fatal]', err && (err.stack || err.message || err)) } catch {}
    process.exit(1)
  })
}

module.exports = {
  STATES,
  REAL_DIR,
  findElectronBinary,
  probeElectron,
}
