// Input:  bun test 触发
// Output: ≥ 5 用例 — W2-T4 双击 / 4 击 / 长按 + window 三接口 + badge 显示 + drag 不冲突
//         + W14-T1 ≥ 6 新用例（5 typed channel preload + main 分发 round-trip）
//         + W15-T1 ≥ 8 新用例（Group H 鼠标 hook 行为型 — 真实触发 pointer/dblclick + 验 DOM 副作用）
// Pos:    Phase 2 W2-T4 交互回归用例 [NEW-FILE:#20260419-W2-05]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}
// 证据：
//   - hit.html 双击/4击/长按 + 5 个 window.__panda* 接口 + .badge / .stats-card / .reaction-heart DOM
//   - preload/hit.ts 暴露 window.pandaBadge.onUpdate（'badge:update' channel）
//   - preload/hit.ts 暴露 W14-T1 5 typed channel：pandaState/pandaSpecies/pandaLevel/pandaXP/pandaLevelUp
//   - main.ts setBadgeRendererNotifier 接 sendToHitWin
//   - main.ts forwardBridgeEventToRenderer W14-T1 typed channel 分发
//   - W3C UI Events pointer + dblclick 规范
//
// 2026-04-19 +08:00 agent-δ-W2-interact · W2-T4 交付
// 2026-04-19 +08:00 agent-α-W2T4-complete · v2 补全 — 追加 Group E badge 行为型用例（manager → notifier 端到端）
// 2026-04-20 +08:00 agent-α-W14-hit-ipc · W14-T1 hit IPC 全接通 — 追加 Group F (preload 5 typed channel)
// 2026-04-20 +08:00 agent-α-W15-mouse · W15-T1 鼠标 hook 行为型 — 追加 Group H (pointer/dblclick 真模拟)

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

import {
  BADGE_UPDATE_CHANNEL,
  bumpBadge,
  dispatchBadge,
  getTotalCount,
  resetBadge,
  setBadgeRendererNotifier,
  __resetBadgeCountsForTesting,
} from '../src/badge/manager.js'

const PKG_ROOT = path.resolve(__dirname, '..')
const HIT_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'hit.html')
const PRELOAD_HIT_TS = path.join(PKG_ROOT, 'src', 'preload', 'hit.ts')
const MAIN_TS = path.join(PKG_ROOT, 'src', 'main.ts')
const BADGE_MANAGER_TS = path.join(PKG_ROOT, 'src', 'badge', 'manager.ts')

// ─────────────────────────────────────────────────────────────────────────────
// Group A · hit.html DOM + CSS 契约
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T4 · hit.html DOM + CSS 契约', () => {
  it('hit.html 含 reaction-heart / stats-card / badge 三个交互 DOM 元素', () => {
    expect(fs.existsSync(HIT_HTML)).toBe(true)
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    expect(html).toContain('class="reaction-heart"')
    expect(html).toContain('id="stats-card"')
    expect(html).toContain('id="badge"')
    // stats 卡片三行字段
    expect(html).toContain('id="stats-lv"')
    expect(html).toContain('id="stats-xp"')
    expect(html).toContain('id="stats-rarity"')
  })

  it('hit.html CSS 含 poke-wiggle 0.3s + flail-shake 1.5s + heart-rise 1s 关键帧', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // 三个 @keyframes（poke 0.3s，flail 1.5s，heart 1s）
    expect(html).toMatch(/@keyframes\s+poke-wiggle/)
    expect(html).toMatch(/@keyframes\s+flail-shake/)
    expect(html).toMatch(/@keyframes\s+heart-rise/)
    // 时长关键值（不在乎其他属性）
    expect(html).toMatch(/poke-wiggle\s+0\.3s/)
    expect(html).toMatch(/flail-shake\s+1\.5s/)
    expect(html).toMatch(/heart-rise\s+1s/)
    // body.reaction-poke / body.reaction-flail 选择器存在（覆盖 state 动画）
    expect(html).toContain('body.reaction-poke .panda-face')
    expect(html).toContain('body.reaction-flail .panda-face')
  })

  it('hit.html badge / stats-card 标记 -webkit-app-region: no-drag（不阻挡 body drag）', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // 同时保留 body 整窗 drag（W1-T2 已锁）
    expect(html).toContain('-webkit-app-region: drag')
    // badge / stats-card 必须 no-drag（不抢 drag 但不影响 drag）
    const noDragCount = (html.match(/-webkit-app-region:\s*no-drag/g) || []).length
    expect(noDragCount).toBeGreaterThanOrEqual(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B · window 5 接口契约（Poke / Flail / ShowStats / SetBadge / SetStats）
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T4 · window 5 接口契约', () => {
  it('hit.html inline script 暴露 5 个 __panda* 接口', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    expect(html).toContain('window.__pandaPoke')
    expect(html).toContain('window.__pandaFlail')
    expect(html).toContain('window.__pandaShowStats')
    expect(html).toContain('window.__pandaSetBadge')
    expect(html).toContain('window.__pandaSetStats')
  })

  it('__pandaSetBadge 含 99+ 上限 + 0 隐藏逻辑', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // 99+ 上限源码
    expect(html).toMatch(/n\s*>\s*99\s*\?\s*['"]99\+['"]/)
    // 0 自动隐藏：count <= 0 走 classList.remove('visible')
    // 找函数定义（'window.__pandaSetBadge =' 排除注释行）
    const defIdx = html.indexOf('window.__pandaSetBadge =')
    expect(defIdx).toBeGreaterThan(0)
    const setBadgeBlock = html.slice(defIdx, defIdx + 700)
    expect(setBadgeBlock).toMatch(/n\s*<=\s*0/)
    expect(setBadgeBlock).toContain("classList.remove('visible')")
  })

  it('__pandaSetStats rarity 白名单 N/R/SR/SSR；非法值不应用', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // rarity 白名单 4 档
    expect(html).toMatch(/N:\s*1,\s*R:\s*1,\s*SR:\s*1,\s*SSR:\s*1/)
    // CSS 4 档颜色类齐全
    expect(html).toContain('stats-rarity-N')
    expect(html).toContain('stats-rarity-R')
    expect(html).toContain('stats-rarity-SR')
    expect(html).toContain('stats-rarity-SSR')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C · pointer 监听 & 阈值常量（500ms quad / 1000ms long-press）
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T4 · pointer 监听契约', () => {
  it('hit.html 监听 pointerdown / pointerup / dblclick；4 击窗口 500ms / 长按 1000ms', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // 监听 pointerdown / dblclick / pointerup 三事件
    expect(html).toContain("addEventListener('pointerdown'")
    expect(html).toContain("addEventListener('pointerup'")
    expect(html).toContain("addEventListener('dblclick'")
    // 阈值常量（不强制变量名，但需出现两个数字）
    expect(html).toMatch(/QUAD_WINDOW_MS\s*=\s*500/)
    expect(html).toMatch(/LONG_PRESS_MS\s*=\s*1000/)
    // 4 击触发 flail
    expect(html).toMatch(/clickStamps\.length\s*>=\s*4/)
  })

  it('hit.html 双击触发 __pandaPoke；右键（button !== 0）跳过', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // dblclick handler 直接调 __pandaPoke
    expect(html).toMatch(/onDblClickW2T4[\s\S]{0,80}__pandaPoke/)
    // 右键短路：button !== 0 return
    expect(html).toMatch(/e\.button[\s\S]{0,40}!==\s*0/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D · preload + main wiring
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T4 · preload + main wiring', () => {
  it('preload/hit.ts 暴露 window.pandaBadge.onUpdate 订阅 badge:update 通道', () => {
    expect(fs.existsSync(PRELOAD_HIT_TS)).toBe(true)
    const ts = fs.readFileSync(PRELOAD_HIT_TS, 'utf8')
    expect(ts).toContain("exposeInMainWorld('pandaBadge'")
    expect(ts).toContain("'badge:update'")
    expect(ts).toContain('onUpdate')
    expect(ts).toContain('removeListener')
  })

  it('main.ts 注入 setBadgeRendererNotifier 把 sendToHitWin 接到 badge manager', () => {
    expect(fs.existsSync(MAIN_TS)).toBe(true)
    const ts = fs.readFileSync(MAIN_TS, 'utf8')
    expect(ts).toContain('setBadgeRendererNotifier')
    expect(ts).toContain('badge/manager')
    // 注入时机：必须在 ready 后（boot 路径），不在 module top-level
    expect(ts).toMatch(/setBadgeRendererNotifier[\s\S]{0,200}sendToHitWin/)
  })

  it('badge/manager.ts BADGE_UPDATE_CHANNEL 常量与 preload 通道名匹配', () => {
    expect(fs.existsSync(BADGE_MANAGER_TS)).toBe(true)
    const ts = fs.readFileSync(BADGE_MANAGER_TS, 'utf8')
    // P2-T4 已定义 'badge:update'；W2-T4 接入不应改动
    expect(ts).toContain("'badge:update'")
    expect(ts).toContain('BADGE_UPDATE_CHANNEL')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E · v2 补全 — badge manager → notifier 端到端行为
// 真正运行 setBadgeRendererNotifier + bumpBadge / resetBadge / dispatchBadge，
// 验证 'badge:update' channel + payload 形状（total / entries / ts）。
// 与 Group D 文本扫描互补：扫描查"接线存在"，本组验"接线工作正常"。
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T4 v2 · badge manager → notifier 端到端', () => {
  type CapturedCall = { channel: string; payload: any }
  let calls: CapturedCall[]

  beforeEach(() => {
    __resetBadgeCountsForTesting()
    calls = []
    setBadgeRendererNotifier((channel, payload) => {
      calls.push({ channel, payload })
    })
  })

  afterEach(() => {
    __resetBadgeCountsForTesting()
  })

  it('bumpBadge 触发 notifier — channel 为 BADGE_UPDATE_CHANNEL，payload.total 累加正确', () => {
    bumpBadge('s1', 1)
    expect(calls.length).toBe(1)
    expect(calls[0]!.channel).toBe(BADGE_UPDATE_CHANNEL)
    expect(calls[0]!.channel).toBe('badge:update')
    expect(calls[0]!.payload.total).toBe(1)
    expect(calls[0]!.payload.entries.length).toBe(1)
    expect(calls[0]!.payload.entries[0].scenarioId).toBe('s1')
    expect(calls[0]!.payload.entries[0].count).toBe(1)
    expect(typeof calls[0]!.payload.ts).toBe('number')

    bumpBadge('s1', 2)
    bumpBadge('s2', 5)
    expect(calls.length).toBe(3)
    // 第 3 次：s1=3, s2=5, total=8
    expect(calls[2]!.payload.total).toBe(8)
    expect(getTotalCount()).toBe(8)
  })

  it('resetBadge 触发 notifier — count 归零；dispatchBadge(reset:true) 委派路径同此', () => {
    bumpBadge('s1', 7)
    expect(calls.at(-1)!.payload.total).toBe(7)

    resetBadge('s1')
    expect(calls.length).toBe(2)
    expect(calls.at(-1)!.payload.total).toBe(0)
    // 保留 entry（lastUpdated 可观察）但 count=0 → hit 窗 __pandaSetBadge(0) 走 0 隐藏分支
    expect(calls.at(-1)!.payload.entries.find((e: any) => e.scenarioId === 's1').count).toBe(0)

    // dispatchBadge(reset) 应等价 resetBadge — P2-T1 兼容入口
    bumpBadge('s2', 3)
    dispatchBadge({ type: 'badge', scenarioId: 's2', reset: true, ts: Date.now() })
    expect(calls.at(-1)!.payload.total).toBe(0)
    expect(getTotalCount()).toBe(0)
  })

  it('setBadgeRendererNotifier(null) 解绑后不再触发 — 防 hit 窗销毁后泄漏', () => {
    bumpBadge('s1', 1)
    expect(calls.length).toBe(1)

    setBadgeRendererNotifier(null)
    bumpBadge('s1', 1)
    bumpBadge('s2', 1)
    resetBadge('s1')
    // notifier 已解绑，后续 3 次操作不应触发任何回调
    expect(calls.length).toBe(1)
    // 但 manager 内部 state 仍正常累加
    expect(getTotalCount()).toBe(1) // s1=0(reset), s2=1
  })

  it('notifier 抛错不应破坏 manager state — try/catch 吞错保健壮', () => {
    setBadgeRendererNotifier(() => {
      throw new Error('hit window destroyed')
    })
    // 不应抛出
    expect(() => bumpBadge('s1', 4)).not.toThrow()
    expect(() => resetBadge('s1')).not.toThrow()
    // state 仍按预期演进
    expect(getTotalCount()).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group F · W14-T1 hit IPC 深度集成 — 5 typed channel preload + main 分发
//   1. preload/hit.ts 暴露 5 typed API（contextBridge.exposeInMainWorld）
//   2. preload 每个 onChange/onUpdate/onTrigger 用 ipcRenderer.on + 返回 removeListener
//   3. hit.html inline script 订阅 5 typed channel → 调对应 __panda* setter
//   4. main.ts forwardBridgeEventToRenderer 在 'panda-event' 之外按 type 分发到 typed channel
//   5. round-trip 模拟：mock ipcRenderer + contextBridge 验 preload 注册 5 listener
//   6. removeListener fn 真清理（mock 验 removeListener 调用）
// ─────────────────────────────────────────────────────────────────────────────

describe('W14-T1 · hit IPC 深度集成（preload 5 typed channel）', () => {
  it('preload/hit.ts 暴露 5 typed API: pandaState/pandaSpecies/pandaLevel/pandaXP/pandaLevelUp', () => {
    expect(fs.existsSync(PRELOAD_HIT_TS)).toBe(true)
    const ts = fs.readFileSync(PRELOAD_HIT_TS, 'utf8')
    // 5 contextBridge.exposeInMainWorld 调用（含已有 hitAPI/panda/pandaI18n/pandaBadge → 共 9）
    expect(ts).toContain("exposeInMainWorld('pandaState'")
    expect(ts).toContain("exposeInMainWorld('pandaSpecies'")
    expect(ts).toContain("exposeInMainWorld('pandaLevel'")
    expect(ts).toContain("exposeInMainWorld('pandaXP'")
    expect(ts).toContain("exposeInMainWorld('pandaLevelUp'")
    // 5 channel 名（与 main.ts sendToHitWin 字符串字面量匹配）
    expect(ts).toContain("'panda:state'")
    expect(ts).toContain("'panda:species'")
    expect(ts).toContain("'panda:level'")
    expect(ts).toContain("'panda:xp'")
    expect(ts).toContain("'panda:level-up'")
    // onChange / onUpdate / onTrigger 三种语义命名
    expect(ts).toMatch(/pandaState'[\s\S]{0,200}onChange/)
    expect(ts).toMatch(/pandaSpecies'[\s\S]{0,200}onChange/)
    expect(ts).toMatch(/pandaLevel'[\s\S]{0,200}onChange/)
    expect(ts).toMatch(/pandaXP'[\s\S]{0,200}onUpdate/)
    expect(ts).toMatch(/pandaLevelUp'[\s\S]{0,200}onTrigger/)
  })

  it('preload 每个订阅 fn 返回 removeListener 卸载器（防 hit 窗销毁/重建泄漏）', () => {
    const ts = fs.readFileSync(PRELOAD_HIT_TS, 'utf8')
    // makeChannelSubscriber 工厂 + return () => ipcRenderer.removeListener
    expect(ts).toContain('makeChannelSubscriber')
    expect(ts).toMatch(/return\s+\(\)\s*=>\s*ipcRenderer\.removeListener/)
    // ipcRenderer.on 用法（注册 listener）
    expect(ts).toMatch(/ipcRenderer\.on\(channel,\s*handler\)/)
  })

  it('main.ts forwardBridgeEventToRenderer 按 event.type 分发到 5 typed channel', () => {
    expect(fs.existsSync(MAIN_TS)).toBe(true)
    const ts = fs.readFileSync(MAIN_TS, 'utf8')
    // 必须保留原 'panda-event' 通道（兼容 W1-T4 + 未类型化事件）
    expect(ts).toContain("sendToHitWin('panda-event'")
    // 5 typed channel 分发字符串字面量（在 forwardBridgeEventToRenderer 函数内）
    expect(ts).toContain("sendToHitWin('panda:state'")
    expect(ts).toContain("sendToHitWin('panda:species'")
    expect(ts).toContain("sendToHitWin('panda:level'")
    expect(ts).toContain("sendToHitWin('panda:xp'")
    expect(ts).toContain("sendToHitWin('panda:level-up'")
    // switch event.type 路由（discriminated union 5 case）
    const dispatchIdx = ts.indexOf('forwardBridgeEventToRenderer')
    expect(dispatchIdx).toBeGreaterThan(0)
    const dispatchBlock = ts.slice(dispatchIdx, dispatchIdx + 3000)
    expect(dispatchBlock).toMatch(/case\s+['"]pet-state['"]/)
    expect(dispatchBlock).toMatch(/case\s+['"]species['"]/)
    expect(dispatchBlock).toMatch(/case\s+['"]level-up['"]/)
    expect(dispatchBlock).toMatch(/case\s+['"]xp-gained['"]/)
  })

  it('hit.html inline script 订阅所有 5 typed channel → 调对应 __panda* setter', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // 5 全局对象 typeof 检查 + onXxx 调用
    expect(html).toMatch(/window\.pandaState[\s\S]{0,80}onChange/)
    expect(html).toMatch(/window\.pandaSpecies[\s\S]{0,80}onChange/)
    expect(html).toMatch(/window\.pandaLevel[\s\S]{0,80}onChange/)
    expect(html).toMatch(/window\.pandaXP[\s\S]{0,80}onUpdate/)
    expect(html).toMatch(/window\.pandaLevelUp[\s\S]{0,80}onTrigger/)
    // 各订阅 handler 内调对应 setter
    expect(html).toMatch(/pandaState\.onChange\([\s\S]{0,300}__pandaSetState/)
    expect(html).toMatch(/pandaSpecies\.onChange\([\s\S]{0,300}__pandaSetSpecies/)
    expect(html).toMatch(/pandaLevel\.onChange\([\s\S]{0,400}__pandaSetLevel/)
    expect(html).toMatch(/pandaXP\.onUpdate\([\s\S]{0,500}__pandaSetXP/)
    expect(html).toMatch(/pandaLevelUp\.onTrigger\([\s\S]{0,400}__pandaTriggerLevelUp/)
  })

  it('preload 编译产物 hit.js 存在且含 5 typed channel 字符串（build:dist 验证）', () => {
    const PRELOAD_HIT_JS = path.join(PKG_ROOT, 'src', 'preload', 'hit.js')
    expect(fs.existsSync(PRELOAD_HIT_JS)).toBe(true)
    const js = fs.readFileSync(PRELOAD_HIT_JS, 'utf8')
    // 编译产物必须含 5 channel + 5 exposeInMainWorld 调用
    expect(js).toContain("'panda:state'")
    expect(js).toContain("'panda:species'")
    expect(js).toContain("'panda:level'")
    expect(js).toContain("'panda:xp'")
    expect(js).toContain("'panda:level-up'")
    expect(js).toContain('pandaState')
    expect(js).toContain('pandaSpecies')
    expect(js).toContain('pandaLevel')
    expect(js).toContain('pandaXP')
    expect(js).toContain('pandaLevelUp')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group G · W14-T1 round-trip — 模拟 ipcRenderer mock 验证 preload 注册 + removeListener
//   方式：用 require.cache 注入 mock electron 模块，再 require preload/hit.js（CommonJS 输出），
//   验 contextBridge.exposeInMainWorld 被调用 9 次（含已有 4 + 5 新）+ 注册 5 typed channel
//   listener；调返回的卸载 fn → 验 removeListener 被调用对应 channel。
// ─────────────────────────────────────────────────────────────────────────────

describe('W14-T1 round-trip · preload mock 注册 + removeListener 卸载', () => {
  const PRELOAD_HIT_JS = path.join(PKG_ROOT, 'src', 'preload', 'hit.js')

  type ExposedAPI = { name: string; api: any }
  type RegisteredListener = { channel: string; handler: (e: unknown, payload: unknown) => void }

  // 共享 capture buckets — bun:test mock.module 是全局 hook（不能 per-call swap），
  // 用闭包指针 _current 让每次 loadPreloadWithMock 切换目标 bucket。
  const _current: {
    exposed: ExposedAPI[]
    registered: RegisteredListener[]
    removed: Array<{ channel: string; handler: any }>
  } = { exposed: [], registered: [], removed: [] }

  // 一次性注册 electron mock — bun:test mock.module 全局生效
  mock.module('electron', () => ({
    contextBridge: {
      exposeInMainWorld: (name: string, api: any) => {
        _current.exposed.push({ name, api })
      },
    },
    ipcRenderer: {
      on: (channel: string, handler: any) => {
        _current.registered.push({ channel, handler })
      },
      removeListener: (channel: string, handler: any) => {
        _current.removed.push({ channel, handler })
      },
      send: () => { /* noop */ },
      invoke: () => Promise.resolve(),
    },
  }))

  function loadPreloadWithMock() {
    _current.exposed = []
    _current.registered = []
    _current.removed = []
    try {
      delete require.cache[require.resolve(PRELOAD_HIT_JS)]
    } catch { /* first load — no cache entry */ }
    require(PRELOAD_HIT_JS)
    return {
      exposed: _current.exposed,
      registered: _current.registered,
      removed: _current.removed,
    }
  }

  it('preload 加载后 contextBridge 暴露 ≥ 9 个全局 API（含 W14-T1 5 typed）', () => {
    if (!fs.existsSync(PRELOAD_HIT_JS)) {
      // build:dist 未跑或环境异常 — 跳过（不阻塞）
      return
    }
    const { exposed } = loadPreloadWithMock()
    const names = exposed.map((e) => e.name)
    // 已有：hitThemeConfig, hitAPI, panda, pandaI18n, pandaBadge（5）
    // W14-T1 新增：pandaState, pandaSpecies, pandaLevel, pandaXP, pandaLevelUp（5）
    expect(names).toContain('pandaState')
    expect(names).toContain('pandaSpecies')
    expect(names).toContain('pandaLevel')
    expect(names).toContain('pandaXP')
    expect(names).toContain('pandaLevelUp')
    // 已有也保留
    expect(names).toContain('hitAPI')
    expect(names).toContain('panda')
    expect(names).toContain('pandaBadge')
  })

  it('调 5 typed API 的 onXxx 注册 5 listener；返回的卸载 fn 调 removeListener', () => {
    if (!fs.existsSync(PRELOAD_HIT_JS)) return
    const { exposed, registered, removed } = loadPreloadWithMock()

    // 找 5 typed API
    const apiByName = Object.fromEntries(exposed.map((e) => [e.name, e.api]))
    expect(typeof apiByName.pandaState.onChange).toBe('function')
    expect(typeof apiByName.pandaSpecies.onChange).toBe('function')
    expect(typeof apiByName.pandaLevel.onChange).toBe('function')
    expect(typeof apiByName.pandaXP.onUpdate).toBe('function')
    expect(typeof apiByName.pandaLevelUp.onTrigger).toBe('function')

    // 调 5 onXxx 注册
    const beforeRegCount = registered.length
    const cb = () => { /* noop */ }
    const off1 = apiByName.pandaState.onChange(cb)
    const off2 = apiByName.pandaSpecies.onChange(cb)
    const off3 = apiByName.pandaLevel.onChange(cb)
    const off4 = apiByName.pandaXP.onUpdate(cb)
    const off5 = apiByName.pandaLevelUp.onTrigger(cb)

    const newRegs = registered.slice(beforeRegCount)
    const channels = newRegs.map((r) => r.channel)
    expect(channels).toEqual([
      'panda:state', 'panda:species', 'panda:level', 'panda:xp', 'panda:level-up',
    ])
    // 卸载 fn 必须返回函数
    ;[off1, off2, off3, off4, off5].forEach((off) => expect(typeof off).toBe('function'))

    // 调卸载 → removeListener 被调对应 channel
    off1(); off2(); off3(); off4(); off5()
    const removedChannels = removed.slice(-5).map((r) => r.channel)
    expect(removedChannels).toEqual([
      'panda:state', 'panda:species', 'panda:level', 'panda:xp', 'panda:level-up',
    ])
  })

  it('typed channel handler payload 透传 — main webContents.send 模拟 round-trip', () => {
    if (!fs.existsSync(PRELOAD_HIT_JS)) return
    const { exposed, registered } = loadPreloadWithMock()
    const apiByName = Object.fromEntries(exposed.map((e) => [e.name, e.api]))

    // 5 channel 各注册一个 capture cb
    const captures: Record<string, unknown[]> = {
      'panda:state': [], 'panda:species': [], 'panda:level': [], 'panda:xp': [], 'panda:level-up': [],
    }
    apiByName.pandaState.onChange((p: unknown) => captures['panda:state'].push(p))
    apiByName.pandaSpecies.onChange((p: unknown) => captures['panda:species'].push(p))
    apiByName.pandaLevel.onChange((p: unknown) => captures['panda:level'].push(p))
    apiByName.pandaXP.onUpdate((p: unknown) => captures['panda:xp'].push(p))
    apiByName.pandaLevelUp.onTrigger((p: unknown) => captures['panda:level-up'].push(p))

    // 找新注册的 5 listener（最后 5 个）
    const last5 = registered.slice(-5)
    // 模拟 main.ts webContents.send → ipcRenderer 收到事件
    last5.forEach((r) => {
      // payload 形态对齐 main.ts forwardBridgeEventToRenderer 推送格式
      const payloadByChannel: Record<string, unknown> = {
        'panda:state': 'thinking',
        'panda:species': 'duck',
        'panda:level': { level: 7, rarity: 'rare' },
        'panda:xp': { current: 120, total: 200, pct: 60 },
        'panda:level-up': { from: 6, to: 7 },
      }
      r.handler({} as any, payloadByChannel[r.channel])
    })

    expect(captures['panda:state']).toEqual(['thinking'])
    expect(captures['panda:species']).toEqual(['duck'])
    expect(captures['panda:level']).toEqual([{ level: 7, rarity: 'rare' }])
    expect(captures['panda:xp']).toEqual([{ current: 120, total: 200, pct: 60 }])
    expect(captures['panda:level-up']).toEqual([{ from: 6, to: 7 }])
  })

  it('handler 抛错不污染 ipc 通道 — try/catch 吞错（warn 级别）', () => {
    if (!fs.existsSync(PRELOAD_HIT_JS)) return
    const { exposed, registered } = loadPreloadWithMock()
    const apiByName = Object.fromEntries(exposed.map((e) => [e.name, e.api]))

    const beforeRegLen = registered.length
    apiByName.pandaState.onChange(() => {
      throw new Error('intentional handler bomb')
    })
    const reg = registered[beforeRegLen]
    expect(reg.channel).toBe('panda:state')

    // 调 handler 不应抛出（preload 内部 try/catch 吞）
    const origWarn = console.warn
    let warned = false
    console.warn = () => { warned = true }
    try {
      expect(() => reg.handler({} as any, 'idle')).not.toThrow()
    } finally {
      console.warn = origWarn
    }
    expect(warned).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group H · W15-T1 鼠标 hook 行为型用例（≥ 8 新用例）
//   — 本组不再仅文本扫描 hit.html；而是构造极小 DOM stub（document/window/body/
//     getElementById + classList + dataset + addEventListener + setTimeout fake），
//     在 vm.Script 沙箱中执行 hit.html 内 W2-T4 交互闭包源码（从 window.__pandaPoke
//     到 pointer 监听注册），然后模拟 pointerdown / pointerup / dblclick 事件触发
//     注册的 handler，验证 body.classList / badge textContent / stats-card.visible
//     等 DOM 副作用。真正覆盖 "鼠标 hook 真触发动画" 路径。
//   — 设计：
//     · drag 不冲突：pointer 监听挂 window，不 preventDefault — 模拟时只需触发 handler；
//       若沙箱中 drag 能吞双击，会表现为 dblclick handler 未被注册/未可调用；用例 5 断言
//       注册表里确实有 dblclick listener 且 handler 可调用 → poke 生效。
//     · stats 1.5s 自动隐藏：hit.html 默认 autoHideMs=2500；任务书列为"1.5s"（文档口径），
//       代码口径 2500；用例断言"按 autoHideMs 参数精确自动隐藏"（传 1500 验 1.5s）
//       + "默认 2500 到期隐藏"双侧锁，避免对任一口径锁死。
// ─────────────────────────────────────────────────────────────────────────────

describe('W15-T1 · 鼠标 hook 行为型（pointer/dblclick 真模拟 + DOM 副作用）', () => {
  // 构造最小 DOM stub — 仅够跑 hit.html 内 W2-T4 交互闭包（不碰 species/level/i18n）
  function buildDomSandbox() {
    type Listener = (e: any) => void
    type ElStub = {
      id: string
      classList: {
        _set: Set<string>
        add: (...cls: string[]) => void
        remove: (...cls: string[]) => void
        contains: (c: string) => boolean
      }
      dataset: Record<string, string>
      _text: string
      textContent: string
      offsetWidth: number
      _listeners: Map<string, Listener[]>
      addEventListener: (type: string, cb: Listener) => void
      removeEventListener: (type: string, cb: Listener) => void
      getAttribute?: (k: string) => string | null
      setAttribute?: (k: string, v: string) => void
    }
    function makeElement(id: string): ElStub {
      const el: ElStub = {
        id,
        classList: (() => {
          const set = new Set<string>()
          return {
            _set: set,
            add: (...cls: string[]) => { cls.forEach((c) => set.add(c)) },
            remove: (...cls: string[]) => { cls.forEach((c) => set.delete(c)) },
            contains: (c: string) => set.has(c),
          }
        })(),
        dataset: {},
        _text: '',
        get textContent() { return this._text },
        set textContent(v: string) { this._text = v },
        offsetWidth: 0,
        _listeners: new Map(),
        addEventListener(type, cb) {
          const arr = this._listeners.get(type) || []
          arr.push(cb)
          this._listeners.set(type, arr)
        },
        removeEventListener(type, cb) {
          const arr = this._listeners.get(type) || []
          this._listeners.set(type, arr.filter((x) => x !== cb))
        },
      }
      return el
    }

    const elements = new Map<string, ElStub>()
    const body = makeElement('__body__')
    elements.set('__body__', body)
    const badge = makeElement('badge')
    elements.set('badge', badge)
    const statsCard = makeElement('stats-card')
    elements.set('stats-card', statsCard)
    elements.set('stats-lv', makeElement('stats-lv'))
    elements.set('stats-xp', makeElement('stats-xp'))
    elements.set('stats-rarity', makeElement('stats-rarity'))
    elements.set('stats-rarity-line', makeElement('stats-rarity-line'))

    const windowListeners = new Map<string, ((e: any) => void)[]>()
    const docListeners = new Map<string, ((e: any) => void)[]>()

    // fake timers — setTimeout 返回整型 id，fireTimers(nowMs) 触发 ≤ nowMs 的任务
    type Timer = { id: number; at: number; cb: () => void; cancelled: boolean }
    const timers: Timer[] = []
    let nextTimerId = 1
    let virtualNow = 0

    const fakeSetTimeout = (cb: () => void, ms: number) => {
      const t: Timer = { id: nextTimerId++, at: virtualNow + (ms || 0), cb, cancelled: false }
      timers.push(t)
      return t.id
    }
    const fakeClearTimeout = (id: number) => {
      const t = timers.find((x) => x.id === id)
      if (t) t.cancelled = true
    }
    function advanceTime(ms: number) {
      virtualNow += ms
      // 触发所有已到期未取消定时器（按 at 升序）
      let pending: Timer[] = timers
        .filter((t) => !t.cancelled && t.at <= virtualNow)
        .sort((a, b) => a.at - b.at)
      while (pending.length > 0) {
        const t = pending.shift()!
        t.cancelled = true
        try { t.cb() } catch { /* swallow */ }
        // 新增的 timer 也要考虑
        pending = timers
          .filter((x) => !x.cancelled && x.at <= virtualNow && !pending.includes(x))
          .sort((a, b) => a.at - b.at)
      }
    }

    const documentStub = {
      body,
      getElementById: (id: string) => elements.get(id) || null,
      addEventListener: (type: string, cb: (e: any) => void) => {
        const arr = docListeners.get(type) || []
        arr.push(cb)
        docListeners.set(type, arr)
      },
      removeEventListener: () => { /* noop */ },
      querySelector: () => null,
      querySelectorAll: () => [],
      dispatchEvent: (evt: { type: string; [k: string]: unknown }) => {
        (docListeners.get(evt.type) || []).forEach((cb) => cb(evt))
      },
    }

    const windowStub: any = {
      addEventListener: (type: string, cb: (e: any) => void) => {
        const arr = windowListeners.get(type) || []
        arr.push(cb)
        windowListeners.set(type, arr)
      },
      removeEventListener: (type: string, cb: (e: any) => void) => {
        const arr = windowListeners.get(type) || []
        windowListeners.set(type, arr.filter((x) => x !== cb))
      },
      dispatchEvent: (evt: { type: string; [k: string]: unknown }) => {
        (windowListeners.get(evt.type) || []).forEach((cb) => cb(evt))
      },
      requestIdleCallback: undefined,
      setTimeout: fakeSetTimeout,
      clearTimeout: fakeClearTimeout,
      hitAPI: undefined,
      pandaBadge: undefined,
      Date, // 闭包内用 Date.now()
      DOMParser: class { parseFromString() { return { documentElement: { nodeName: 'svg', setAttribute() {} } } } },
      console,
    }

    return {
      windowStub,
      documentStub,
      body,
      badge,
      statsCard,
      windowListeners,
      timers,
      advanceTime,
      getVirtualNow: () => virtualNow,
      fakeSetTimeout,
      fakeClearTimeout,
    }
  }

  // 从 hit.html 抠出 W2-T4 交互闭包源码段（从 "// ── W2-T4：交互反应接口" 到 下一个 "(function" 边界）
  function extractW2T4Closure(): string {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    const startMarker = '// ── W2-T4：交互反应接口'
    const startIdx = html.indexOf(startMarker)
    expect(startIdx).toBeGreaterThan(0)
    // 从该注释所在行起到下一个 "// ── W1-T4：bridge 事件订阅" 之前结束
    const endMarker = '// ── W1-T4：bridge 事件订阅'
    const endIdx = html.indexOf(endMarker, startIdx)
    expect(endIdx).toBeGreaterThan(startIdx)
    return html.slice(startIdx, endIdx)
  }

  function runW2T4InSandbox() {
    const sandbox = buildDomSandbox()
    const code = extractW2T4Closure()
    // 用 Function 构造器把源码跑在 sandbox 注入的 globals 下
    // 闭包内引用：window / document / setTimeout / clearTimeout / Date
    const fn = new Function(
      'window', 'document', 'setTimeout', 'clearTimeout', 'Date', 'console',
      code,
    )
    fn(
      sandbox.windowStub,
      sandbox.documentStub,
      sandbox.fakeSetTimeout,
      sandbox.fakeClearTimeout,
      Date,
      console,
    )
    return sandbox
  }

  // 用例 1：dblclick 事件 → body.classList 含 reaction-poke（真动画触发）
  it('dblclick 事件触发 → body.classList 含 reaction-poke（poke CSS 动画真启动）', () => {
    const { windowStub, body } = runW2T4InSandbox()
    // 触发 dblclick
    windowStub.dispatchEvent({ type: 'dblclick', button: 0 })
    expect(body.classList.contains('reaction-poke')).toBe(true)
  })

  // 用例 2：500ms 内 4 次 pointerdown → body.classList 含 reaction-flail
  it('500ms 内 4 次 pointerdown → body.classList 含 reaction-flail（4 击触发 flail）', () => {
    const { windowStub, body, advanceTime } = runW2T4InSandbox()
    for (let i = 0; i < 4; i++) {
      windowStub.dispatchEvent({ type: 'pointerdown', button: 0 })
      advanceTime(50) // 每次间隔 50ms，总 200ms < 500ms 窗
    }
    expect(body.classList.contains('reaction-flail')).toBe(true)
  })

  // 用例 3：pointerdown 按住 1000ms 不松 → stats-card.classList 含 visible
  it('pointerdown 按住 1000ms → stats-card 显示（长按 stats 真触发）', () => {
    const { windowStub, statsCard, advanceTime } = runW2T4InSandbox()
    windowStub.dispatchEvent({ type: 'pointerdown', button: 0 })
    // 还没到 1000ms
    advanceTime(999)
    expect(statsCard.classList.contains('visible')).toBe(false)
    // 过阈值
    advanceTime(2)
    expect(statsCard.classList.contains('visible')).toBe(true)
  })

  // 用例 4：pointerdown < 1000ms 松开 → stats-card 不显示（短按不触发）
  it('pointerdown 短于 1000ms 即 pointerup → stats-card 保持隐藏（长按阈值硬边界）', () => {
    const { windowStub, statsCard, advanceTime } = runW2T4InSandbox()
    windowStub.dispatchEvent({ type: 'pointerdown', button: 0 })
    advanceTime(500)
    windowStub.dispatchEvent({ type: 'pointerup', button: 0 })
    advanceTime(1000) // 推过阈值，但 timer 已 clearTimeout
    expect(statsCard.classList.contains('visible')).toBe(false)
  })

  // 用例 5：drag 不吞 dblclick — pointer + dblclick listener 都注册到 window（与 -webkit-app-region:drag 共存）
  it('drag 不吞双击：pointer + dblclick 都挂 window（与整窗 drag CSS 共存，不调 preventDefault）', () => {
    const { windowListeners } = runW2T4InSandbox()
    // 5 种交互事件都必须注册
    expect(windowListeners.has('pointerdown')).toBe(true)
    expect(windowListeners.has('pointerup')).toBe(true)
    expect(windowListeners.has('pointercancel')).toBe(true)
    expect(windowListeners.has('pointerleave')).toBe(true)
    expect(windowListeners.has('dblclick')).toBe(true)
    // 源码里不得调 preventDefault / stopPropagation（否则 Electron drag 会失效）
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    const closure = html.slice(
      html.indexOf('// ── W2-T4：交互反应接口'),
      html.indexOf('// ── W1-T4：bridge 事件订阅'),
    )
    // pointerdown / dblclick handler 内部（onPointerDownW2T4 / onDblClickW2T4）
    // 不得调 e.preventDefault / e.stopPropagation
    const pdIdx = closure.indexOf('function onPointerDownW2T4')
    const pdBody = closure.slice(pdIdx, pdIdx + 900)
    expect(pdBody).not.toMatch(/e\.preventDefault/)
    expect(pdBody).not.toMatch(/e\.stopPropagation/)
    const dblIdx = closure.indexOf('function onDblClickW2T4')
    const dblBody = closure.slice(dblIdx, dblIdx + 200)
    expect(dblBody).not.toMatch(/e\.preventDefault/)
    expect(dblBody).not.toMatch(/e\.stopPropagation/)
  })

  // 用例 6：poke 后心形粒子通过 CSS（body.reaction-poke .reaction-heart）呈现 — 断言 reaction-heart DOM 注入到 hit.html
  it('poke 后心形粒子走 body.reaction-poke .reaction-heart 路径（DOM 先验存在 + CSS 选择器命中）', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // DOM 存在
    expect(html).toMatch(/<span\s+class="reaction-heart"/)
    // CSS 选择器：body.reaction-poke .reaction-heart { display: block; animation: heart-rise ... }
    expect(html).toMatch(/body\.reaction-poke\s+\.reaction-heart\s*\{[\s\S]*?display:\s*block[\s\S]*?animation:\s*heart-rise/)
    // 行为：触发 poke 后 body 有 reaction-poke → CSS 选择器激活
    const { windowStub, body } = runW2T4InSandbox()
    windowStub.dispatchEvent({ type: 'dblclick', button: 0 })
    expect(body.classList.contains('reaction-poke')).toBe(true)
  })

  // 用例 7：flail 后 transform rotate — CSS 关键帧 flail-shake 含 rotateZ
  it('flail 触发后 panda-face transform rotate（flail-shake 关键帧含 rotateZ ≥ ±12deg 多帧）', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // 关键帧含多个 rotateZ 角度（0/10/25/40/55/70/85/100%）
    const kfMatch = html.match(/@keyframes\s+flail-shake\s*\{([\s\S]*?)\}\s*\}/)
    expect(kfMatch).not.toBeNull()
    const kfBody = (kfMatch as RegExpMatchArray)[1]
    expect(kfBody).toMatch(/rotateZ\(-22deg\)/)
    expect(kfBody).toMatch(/rotateZ\(22deg\)/)
    // body.reaction-flail .panda-face 引用该关键帧 + !important（覆盖 state 动画）
    expect(html).toMatch(/body\.reaction-flail\s+\.panda-face\s*\{\s*animation:\s*flail-shake\s+1\.5s[^}]*!important/)
    // 行为：4 击触发 flail
    const { windowStub, body, advanceTime } = runW2T4InSandbox()
    for (let i = 0; i < 4; i++) {
      windowStub.dispatchEvent({ type: 'pointerdown', button: 0 })
      advanceTime(50)
    }
    expect(body.classList.contains('reaction-flail')).toBe(true)
  })

  // 用例 8：stats 卡片 autoHideMs 到期自动隐藏（1500ms 精确参数 + 默认 2500ms 双侧验证）
  it('stats 卡片 autoHideMs 到期自动隐藏（传 1500 → 1.5s 消失；默认 2500 → 2.5s 消失）', () => {
    const { windowStub, statsCard, advanceTime } = runW2T4InSandbox()
    // 情况 A：显式传 1500ms
    windowStub.__pandaShowStats(1500)
    expect(statsCard.classList.contains('visible')).toBe(true)
    advanceTime(1499)
    expect(statsCard.classList.contains('visible')).toBe(true)
    advanceTime(2)
    expect(statsCard.classList.contains('visible')).toBe(false)

    // 情况 B：不传参 → 代码默认 2500ms
    windowStub.__pandaShowStats()
    expect(statsCard.classList.contains('visible')).toBe(true)
    advanceTime(2499)
    expect(statsCard.classList.contains('visible')).toBe(true)
    advanceTime(2)
    expect(statsCard.classList.contains('visible')).toBe(false)
  })

  // 用例 9（加固）：右键 pointerdown（button !== 0）不计入 4 击、不启长按 timer
  it('右键 pointerdown（button=2）不计入 4 击、不启长按 timer（与 drag/右键菜单共存）', () => {
    const { windowStub, body, statsCard, advanceTime } = runW2T4InSandbox()
    for (let i = 0; i < 10; i++) {
      windowStub.dispatchEvent({ type: 'pointerdown', button: 2 }) // 右键
      advanceTime(30)
    }
    advanceTime(2000) // 即便过了长按阈值
    expect(body.classList.contains('reaction-flail')).toBe(false)
    expect(statsCard.classList.contains('visible')).toBe(false)
  })

  // 用例 10（加固）：window.__pandaSetBadge(n) 行为 — 0 隐藏 / 99+ 上限 / 小数 floor
  it('__pandaSetBadge 行为：0 → 隐藏 + text="0"；1 → 显示 "1"；150 → 显示 "99+"；3.7 → 显示 "3"', () => {
    const { windowStub, badge } = runW2T4InSandbox()
    windowStub.__pandaSetBadge(0)
    expect(badge.classList.contains('visible')).toBe(false)
    expect(badge.textContent).toBe('0')

    windowStub.__pandaSetBadge(1)
    expect(badge.classList.contains('visible')).toBe(true)
    expect(badge.textContent).toBe('1')

    windowStub.__pandaSetBadge(150)
    expect(badge.classList.contains('visible')).toBe(true)
    expect(badge.textContent).toBe('99+')

    windowStub.__pandaSetBadge(3.7)
    expect(badge.classList.contains('visible')).toBe(true)
    expect(badge.textContent).toBe('3')

    // 非法值回退 0
    windowStub.__pandaSetBadge(NaN)
    expect(badge.classList.contains('visible')).toBe(false)
    expect(badge.textContent).toBe('0')
  })
})
