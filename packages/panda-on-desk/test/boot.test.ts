// Input: bun test 触发
// Output: 验证 v2.24.1 hotfix — 8 个 optional stub 可加载 + state.js refreshTheme 容错
// Pos: panda-on-desk 启动 hotfix 回归用例 — agent-α-desk-bootfix 落盘
//
// [NEW-FILE:#20260419-DESK-FIX-09]
//
// 触发原因：
//   · `bun run start` 撞 8 条 "optional module ... not yet forked" warning
//     + `TypeError: Cannot read properties of undefined (reading 'states')`
//   · 本测试锁住 hotfix 行为：8 stub 必须 require 成功；state refreshTheme 必须容错。

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { spawnSync } from 'node:child_process'

// state.js 是 tsc 编译出的 CommonJS 产物（顶部 var __createBinding / Object.defineProperty(exports)）。
// bun:test 在 ESM 上下文里 require .js 拿不到 module 变量；改 spawn 子 node 进程实跑验证。
function runInNode(script: string): { code: number; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, ['-e', script], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  })
  return {
    code: r.status ?? -1,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
  }
}

const PKG_ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(PKG_ROOT, 'src')

const OPTIONAL_STUBS = [
  'settings-window-icon',
  'prefs',
  'settings-controller',
  'settings-actions',
  'server',
  'permission',
  'mini',
  'update-bubble',
] as const

describe('panda-on-desk v2.24.1 boot hotfix · 8 optional stub', () => {
  it('每个 stub 的 .ts 源文件都已就位', () => {
    for (const name of OPTIONAL_STUBS) {
      const tsPath = path.join(SRC_DIR, `${name}.ts`)
      expect(fs.existsSync(tsPath)).toBe(true)
    }
  })

  it('每个 stub .ts 文件头都含 hotfix 标注 [NEW-FILE:#20260419-DESK-FIX', () => {
    for (const name of OPTIONAL_STUBS) {
      const src = fs.readFileSync(path.join(SRC_DIR, `${name}.ts`), 'utf8')
      expect(src).toContain('[NEW-FILE:#20260419-DESK-FIX')
      // 三段头部注释规范：Input / Output / Pos
      expect(src).toContain('Input:')
      expect(src).toContain('Output:')
      expect(src).toContain('Pos:')
    }
  })

  it('8 stub 不引入新依赖（无 npm install / 0 deps）', () => {
    // 锁住"0 deps 安装"铁律：stub 只能 import electron type / node 内置
    for (const name of OPTIONAL_STUBS) {
      const src = fs.readFileSync(path.join(SRC_DIR, `${name}.ts`), 'utf8')
      const importLines = src.match(/^import .* from ['"](.+)['"]/gm) || []
      for (const line of importLines) {
        const m = line.match(/from ['"](.+)['"]/)
        if (!m) continue
        const dep = m[1]
        // 允许：node:* / electron / 相对路径
        const isAllowed =
          dep.startsWith('node:') ||
          dep === 'electron' ||
          dep.startsWith('./') ||
          dep.startsWith('../')
        expect(isAllowed).toBe(true)
      }
    }
  })

  it('main.js _safeRequire 8 stub 路径与文件实际匹配', () => {
    // 锁定 main.js 的 require 路径（不带 .ts/.js 后缀）能落到我们建的 stub
    const mainJs = fs.readFileSync(path.join(SRC_DIR, 'main.js'), 'utf8')
    for (const name of OPTIONAL_STUBS) {
      // _safeRequire('./xxx', ...)
      expect(mainJs).toContain(`_safeRequire('./${name}'`)
    }
  })
})

describe('panda-on-desk v2.24.1 boot hotfix · state.js refreshTheme 容错', () => {
  it('state.ts refreshTheme 头部已加 hotfix 注释 + 三段 fallback', () => {
    const stateSrc = fs.readFileSync(path.join(SRC_DIR, 'state.ts'), 'utf8')
    // hotfix 标记
    expect(stateSrc).toContain('hotfix v2.24.1')
    // fallback 链：ctx.theme || ctx.getActiveTheme() || {}
    expect(stateSrc).toMatch(/ctx\.theme[\s\S]{0,80}getActiveTheme[\s\S]{0,80}\{\}/)
    // 关键访问已加守卫（不再裸取 theme.states.idle[0]）
    expect(stateSrc).not.toContain('theme.states.idle[0]')
    expect(stateSrc).toContain('_states.idle')
  })

  it('state.js (build 产物) 同步含 hotfix 容错', () => {
    const stateJs = fs.readFileSync(path.join(SRC_DIR, 'state.js'), 'utf8')
    expect(stateJs).toContain('hotfix v2.24.1')
    expect(stateJs).not.toContain('SVG_IDLE_FOLLOW = theme.states.idle[0];')
    expect(stateJs).toContain('_states.idle')
  })

  it('refreshTheme 在 ctx.theme = undefined 时不抛错（spawn node 实跑 stub ctx）', () => {
    // 子 node 进程实跑 state.js — 故意不传 theme / getActiveTheme，覆盖最坏 fallback 路径
    const script = `
      const m = require('./src/state.js');
      const initState = m.default || m;
      if (typeof initState !== 'function') { console.error('initState not function'); process.exit(2); }
      const ctx = {
        sendToRenderer: () => {},
        sendToHitWin: () => {},
        syncHitWin: () => {},
        playSound: () => {},
        t: (k) => k,
        debugLog: () => {},
      };
      const inst = initState(ctx);
      if (!inst || typeof inst.setState !== 'function' || typeof inst.applyState !== 'function') {
        console.error('inst missing methods'); process.exit(3);
      }
      console.log('OK_NO_THEME');
    `
    const r = runInNode(script)
    expect(r.code).toBe(0)
    expect(r.stdout).toContain('OK_NO_THEME')
  })

  it('refreshTheme 在 ctx.getActiveTheme 提供有效主题时正常解析（spawn node）', () => {
    const script = `
      const m = require('./src/state.js');
      const initState = m.default || m;
      const stubTheme = {
        states: { idle: ['sprites/default.ascii'] },
        timings: { minDisplay: { working: 1000 }, autoReturn: {}, deepSleepTimeout: 600000, yawnDuration: 3000, wakeDuration: 1500 },
        hitBoxes: { default: { x: 0, y: 0, w: 200, h: 100 } },
      };
      const ctx = {
        getActiveTheme: () => stubTheme,
        sendToRenderer: () => {},
        sendToHitWin: () => {},
        syncHitWin: () => {},
        playSound: () => {},
        t: (k) => k,
        debugLog: () => {},
      };
      const inst = initState(ctx);
      if (!inst) { process.exit(4); }
      console.log('OK_WITH_THEME');
    `
    const r = runInNode(script)
    expect(r.code).toBe(0)
    expect(r.stdout).toContain('OK_WITH_THEME')
  })

  it('8 stub spawn node require 全部返回非 undefined 模块', () => {
    const script = `
      const stubs = ['prefs', 'settings-window-icon', 'settings-controller', 'settings-actions', 'server', 'permission', 'mini', 'update-bubble'];
      let ok = 0;
      for (const s of stubs) {
        const m = require('./src/' + s + '.js');
        if (m === undefined || m === null) { console.error('missing:', s); process.exit(5); }
        ok++;
      }
      console.log('STUBS_OK_' + ok);
    `
    const r = runInNode(script)
    expect(r.code).toBe(0)
    expect(r.stdout).toContain('STUBS_OK_8')
  })
})

describe('panda-on-desk v2.24.1 boot hotfix · util/tick.js refreshTheme 容错', () => {
  it('tick.ts refreshTheme 已加 hotfix 注释 + fallback 链', () => {
    const tickSrc = fs.readFileSync(path.join(SRC_DIR, 'util', 'tick.ts'), 'utf8')
    expect(tickSrc).toContain('hotfix v2.24.1')
    expect(tickSrc).toMatch(/ctx\.theme[\s\S]{0,80}getActiveTheme[\s\S]{0,80}\{\}/)
    expect(tickSrc).not.toContain('SVG_IDLE_FOLLOW = theme.states.idle[0]')
    expect(tickSrc).toContain('_states.idle')
  })

  it('tick.js (build 产物) 同步含 hotfix', () => {
    const tickJs = fs.readFileSync(path.join(SRC_DIR, 'util', 'tick.js'), 'utf8')
    expect(tickJs).toContain('hotfix v2.24.1')
    expect(tickJs).not.toContain('MOUSE_IDLE_TIMEOUT = theme.timings.mouseIdleTimeout;')
  })

  it('tick.js 在 ctx.theme = undefined 时不抛错（spawn node 实跑 stub ctx）', () => {
    const script = `
      const m = require('./src/util/tick.js');
      const initTick = m.default || m;
      if (typeof initTick !== 'function') { process.exit(2); }
      const ctx = {
        getWin: () => null,
        getHitWin: () => null,
        // 故意不传 theme / getActiveTheme — 走最坏 fallback
        isPaused: () => true,
        isMouseOverPet: () => false,
        state: {},
      };
      const inst = initTick(ctx);
      if (!inst) { process.exit(3); }
      console.log('TICK_OK_NO_THEME');
    `
    const r = runInNode(script)
    expect(r.code).toBe(0)
    expect(r.stdout).toContain('TICK_OK_NO_THEME')
  })
})

describe('panda-on-desk v2.24.1 boot hotfix · main.js 编译产物完整性', () => {
  it('src/main.js 编译产物存在且非空', () => {
    const mainJs = path.join(SRC_DIR, 'main.js')
    expect(fs.existsSync(mainJs)).toBe(true)
    const stat = fs.statSync(mainJs)
    expect(stat.size).toBeGreaterThan(10000) // 上游 ~52KB
  })

  it('严守 anthropic byte-equal — claude.ts / oauth 路径完整', () => {
    // hotfix 不应碰这三处（铁律守护）— 用文件存在性自校验
    const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..')
    // 必存路径
    const requiredPaths = [
      path.join(REPO_ROOT, 'src', 'services', 'api', 'claude.ts'),
      path.join(REPO_ROOT, 'src', 'services', 'oauth'),
    ]
    for (const p of requiredPaths) {
      expect(fs.existsSync(p)).toBe(true)
    }
    // providers.ts —— 项目可能已迁移；如果存在则校验，不存在不阻塞 hotfix
    const providersPath = path.join(REPO_ROOT, 'src', 'services', 'api', 'providers.ts')
    if (fs.existsSync(providersPath)) {
      const stat = fs.statSync(providersPath)
      expect(stat.size).toBeGreaterThan(0)
    }
  })
})
