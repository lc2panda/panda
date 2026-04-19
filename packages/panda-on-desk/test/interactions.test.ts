// Input:  bun test 触发
// Output: ≥ 5 用例 — W2-T4 双击 / 4 击 / 长按 + window 三接口 + badge 显示 + drag 不冲突
// Pos:    Phase 2 W2-T4 交互回归用例 [NEW-FILE:#20260419-W2-05]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}
// 证据：
//   - hit.html 双击/4击/长按 + 5 个 window.__panda* 接口 + .badge / .stats-card / .reaction-heart DOM
//   - preload/hit.ts 暴露 window.pandaBadge.onUpdate（'badge:update' channel）
//   - main.ts setBadgeRendererNotifier 接 sendToHitWin
//   - W3C UI Events pointer + dblclick 规范
//
// 2026-04-19 +08:00 agent-δ-W2-interact · W2-T4 交付

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

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
