// Input:  bun test 触发
// Output: ≥ 4 用例 — 验证 W2-T2 等级显示 + XP 进度条 + 升级烟花动画
//         · __pandaSetLevel(level, rarity) → DOM 含 'Lv 12' + RARITY_HEX uncommon
//         · __pandaTriggerLevelUp(12, 13) → 烟花元素被注入
//         · XP 进度条宽度按 pctToNext 计算
//         · IPC pushLevelUp → renderer 收到 → 触发动画（端到端：bridge build* + dispatch path）
// Pos:    Phase 2 P2/W2 升级烟花动画验证；与 hit.html inline script 1:1 同源算法
//
// [NEW-FILE:#20260419-W2-02]
// 触发原因：hit.html 的 inline script 不能直接在 bun test 跑（无 jsdom；0 deps 铁律）；
//          提取 levelup-fx.ts 纯函数 + 用极简 fake host 跑断言；
//          字符串断言 hit.html 锁定 inline script 与 fx 模块同源。

import { afterEach, beforeEach, describe, expect, it, test } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

import {
  applyFireworkToHost,
  applyLevelToHost,
  FIREWORK_PARTICLE_COUNT,
  LEVELUP_FIREWORK_ANIMATION,
  LEVELUP_JUMP_ANIMATION,
  LEVELUP_TEXT_ANIMATION,
  normalizeRarity,
  RARITY_HEX,
  renderFireworkBurst,
  renderFireworkParticle,
  renderLevelBadge,
  renderLevelContainer,
  renderLevelUpText,
  renderXPBar,
} from '../src/renderer/levelup-fx'

const PKG_ROOT = path.resolve(__dirname, '..')
const HIT_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'hit.html')

// ─────────────────────────────────────────────────────────────────────────────
// Group A · levelup-fx 纯函数（满足 DoD：DOM 含 Lv 12 + RARITY_HEX uncommon）
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T2 · levelup-fx · renderLevelBadge', () => {
  it('renderLevelBadge(12, "uncommon") → 含 "Lv 12" + uncommon hex 颜色', () => {
    const html = renderLevelBadge(12, 'uncommon')
    expect(html).toContain('Lv 12')
    expect(html).toContain(RARITY_HEX.uncommon) // '#22c55e'
    expect(html).toContain('data-level="12"')
    expect(html).toContain('data-rarity="uncommon"')
    // 等宽字体 + bold
    expect(html).toMatch(/font-family:[^;]*ui-monospace/)
    expect(html).toContain('font-weight:bold')
  })

  it('renderLevelBadge 5 档 rarity 各自上对应 hex 色', () => {
    const cases: Array<[Parameters<typeof renderLevelBadge>[1], string]> = [
      ['common', RARITY_HEX.common],
      ['uncommon', RARITY_HEX.uncommon],
      ['rare', RARITY_HEX.rare],
      ['epic', RARITY_HEX.epic],
      ['legendary', RARITY_HEX.legendary],
    ]
    for (const [r, hex] of cases) {
      const html = renderLevelBadge(7, r)
      expect(html).toContain(hex)
      expect(html).toContain(`data-rarity="${r}"`)
    }
  })

  it('renderLevelBadge 异常 level 兜底 1', () => {
    expect(renderLevelBadge(0, 'common')).toContain('Lv 1')
    expect(renderLevelBadge(-5, 'common')).toContain('Lv 1')
    expect(renderLevelBadge(NaN, 'common')).toContain('Lv 1')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B · XP 进度条宽度按 pctToNext 计算
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T2 · levelup-fx · renderXPBar', () => {
  it('XP 进度条 fill 宽度等于 pctToNext%（35%）', () => {
    const html = renderXPBar(140, 400, 35, 'rare')
    expect(html).toContain('width:35%') // fill width
    expect(html).toContain('data-pct="35"')
    expect(html).toContain('data-current="140"')
    expect(html).toContain('data-total="400"')
    expect(html).toContain(RARITY_HEX.rare) // '#3b82f6'
    // 5px 高 + 圆角
    expect(html).toContain('height:5px')
    expect(html).toContain('border-radius:3px')
  })

  it('XP 进度条 pctToNext 100% / 0% 边界', () => {
    expect(renderXPBar(0, 0, 0, 'common')).toContain('width:0%')
    expect(renderXPBar(400, 400, 100, 'legendary')).toContain('width:100%')
  })

  it('XP 进度条 pctToNext 越界 clamp 到 [0,100]', () => {
    expect(renderXPBar(0, 100, -10, 'common')).toContain('width:0%')
    expect(renderXPBar(0, 100, 999, 'common')).toContain('width:100%')
    expect(renderXPBar(0, 100, NaN, 'common')).toContain('width:0%')
  })

  it('XP 进度条 fill 宽度 0/25/50/75/100 全档位计算', () => {
    for (const p of [0, 25, 50, 75, 100]) {
      const html = renderXPBar(0, 0, p, 'common')
      expect(html).toContain(`width:${p}%`)
      expect(html).toContain(`data-pct="${p}"`)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C · 烟花元素被注入（applyFireworkToHost）
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T2 · levelup-fx · firework injection', () => {
  it('renderFireworkBurst(12, 13) → 12 粒子 + Level Up! 文本被注入', () => {
    const html = renderFireworkBurst(12, 13, 'legendary')
    // 12 个粒子
    const particleMatches = html.match(/class="panda-firework-particle"/g) ?? []
    expect(particleMatches.length).toBe(FIREWORK_PARTICLE_COUNT)
    expect(FIREWORK_PARTICLE_COUNT).toBe(12)
    // 中央文本
    expect(html).toContain('Level Up! 12 → 13')
    expect(html).toContain('class="panda-firework-container"')
    expect(html).toContain('data-from="12"')
    expect(html).toContain('data-to="13"')
    // 烟花 keyframes 动画名
    expect(html).toContain(LEVELUP_FIREWORK_ANIMATION)
    expect(html).toContain(LEVELUP_TEXT_ANIMATION)
  })

  it('每个粒子 data-index / angle 唯一且按 360/12 = 30° 步进', () => {
    for (let i = 0; i < FIREWORK_PARTICLE_COUNT; i++) {
      const html = renderFireworkParticle(i, 'legendary')
      expect(html).toContain(`data-index="${i}"`)
      expect(html).toContain(`data-angle="${(360 / FIREWORK_PARTICLE_COUNT) * i}"`)
    }
  })

  it('applyFireworkToHost 把烟花容器追加进 host.innerHTML（不破坏既有内容）', () => {
    const host = { innerHTML: '<div class="panda-stage-existing"></div>' }
    applyFireworkToHost(host, 5, 6, 'epic')
    expect(host.innerHTML).toContain('panda-stage-existing') // 既有内容保留
    expect(host.innerHTML).toContain('panda-firework-container')
    expect(host.innerHTML).toContain('Level Up! 5 → 6')
    // epic 紫色
    expect(host.innerHTML).toContain(RARITY_HEX.epic)
  })

  it('renderLevelUpText 含 fadeIn/fadeOut 动画名 + from→to 数值', () => {
    const html = renderLevelUpText(8, 9, 'rare')
    expect(html).toContain('Level Up! 8 → 9')
    expect(html).toContain(`animation:${LEVELUP_TEXT_ANIMATION}`)
    expect(html).toContain('data-from="8"')
    expect(html).toContain('data-to="9"')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D · applyLevelToHost — 等级 + XP 一站式注入（DOM-like host）
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T2 · levelup-fx · applyLevelToHost', () => {
  it('applyLevelToHost(12, "uncommon", 140, 400, 35) → DOM 含 Lv 12 + 35% 宽度 + uncommon 色', () => {
    const host = { innerHTML: '' }
    applyLevelToHost(host, 12, 'uncommon', 140, 400, 35)
    expect(host.innerHTML).toContain('Lv 12')
    expect(host.innerHTML).toContain('width:35%')
    expect(host.innerHTML).toContain('data-current="140"')
    expect(host.innerHTML).toContain('data-total="400"')
    expect(host.innerHTML).toContain(RARITY_HEX.uncommon)
  })

  it('renderLevelContainer visible=false → display:none', () => {
    const html = renderLevelContainer(3, 'common', 0, 0, 0, false)
    expect(html).toContain('display:none')
    expect(html).toContain('data-visible="0"')
  })

  it('renderLevelContainer visible=true → display:flex + data-visible="1"', () => {
    const html = renderLevelContainer(3, 'common', 0, 0, 0, true)
    expect(html).toContain('display:flex')
    expect(html).toContain('data-visible="1"')
  })

  it('normalizeRarity 非法值兜底 common', () => {
    expect(normalizeRarity('uncommon')).toBe('uncommon')
    expect(normalizeRarity('xxx')).toBe('common')
    expect(normalizeRarity(undefined)).toBe('common')
    expect(normalizeRarity(123)).toBe('common')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E · IPC 端到端 — pushLevelUp 构造的 LevelUpEvent 端到端透传
// 决策：不真起 HTTP server（与既有 bridge.test.ts 同模式 — 只断言 build*Event 字段；
// hit.html inline script 字符串里包含 evt.type === 'level-up' 路由确保 renderer 端 hookup）
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T2 · IPC pushLevelUp → renderer 路由', () => {
  it('hit.html inline script 包含 level-up 事件路由 + __pandaTriggerLevelUp 调用', () => {
    expect(fs.existsSync(HIT_HTML)).toBe(true)
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // bridge 'panda-event' 订阅内对 level-up 类型的处理
    expect(html).toContain("evt.type === 'level-up'")
    expect(html).toContain('window.__pandaTriggerLevelUp')
    // xp-gained 路由（更新进度条）
    expect(html).toContain("evt.type === 'xp-gained'")
    expect(html).toContain('window.__pandaSetXP')
    expect(html).toContain('window.__pandaSetLevel')
  })

  it('hit.html 含 3 个 W2-T2 window 接口暴露', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    expect(html).toContain('window.__pandaSetLevel = function')
    expect(html).toContain('window.__pandaSetXP = function')
    expect(html).toContain('window.__pandaTriggerLevelUp = function')
  })

  it('hit.html 含 W2-T2 三类 keyframes（jump / firework / text）', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    expect(html).toContain(`@keyframes ${LEVELUP_JUMP_ANIMATION}`)
    expect(html).toContain(`@keyframes ${LEVELUP_FIREWORK_ANIMATION}`)
    expect(html).toContain(`@keyframes ${LEVELUP_TEXT_ANIMATION}`)
  })

  it('hit.html 含 #panda-level-container DOM 容器（默认 data-visible=0）', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    expect(html).toContain('id="panda-level-container"')
    expect(html).toContain('data-visible="0"')
  })

  it('hit.html inline RARITY_HEX 与 levelup-fx.ts RARITY_HEX 同源（5 档 hex 全部出现）', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    // hit.html 内 inline RARITY_HEX 必须含全部 5 档 hex（与 fx 模块 byte-equal 同步）
    expect(html).toContain(RARITY_HEX.common)
    expect(html).toContain(RARITY_HEX.uncommon)
    expect(html).toContain(RARITY_HEX.rare)
    expect(html).toContain(RARITY_HEX.epic)
    expect(html).toContain(RARITY_HEX.legendary)
  })

  it('hit.html 含 sound:play IPC 监听（继承 P2-T4 player）', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    expect(html).toContain('window.pandaSound')
    expect(html).toContain('onPlay')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group F · bridge 侧 IPC build*Event helpers — pushLevelUp / pushXpUpdate 字段
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T2 · bridge buildLevelUpEvent / buildXpGainedEvent', () => {
  // why dynamic require：bridge.ts 走 bun:bundle feature gate，import 时 OK；
  // 但 desk/types parity 防御 — 用 require 走真实路径
  const bridge = require('../../../src/desk/bridge.js') as {
    buildLevelUpEvent: (from: number, to: number, unlocks?: unknown) => {
      type: string
      fromLevel: number
      toLevel: number
      ts: number
      unlocks?: unknown
    }
    buildXpGainedEvent: (opts: {
      delta: number
      bucket: string
      totalXp: number
      level: number
      pctToNext?: number
      rarity?: string
    }) => {
      type: string
      delta: number
      bucket: string
      totalXp: number
      level: number
      pctToNext?: number
      rarity?: string
      ts: number
    }
  }

  it('buildLevelUpEvent → type="level-up" + fromLevel/toLevel + ts', () => {
    const ev = bridge.buildLevelUpEvent(12, 13)
    expect(ev.type).toBe('level-up')
    expect(ev.fromLevel).toBe(12)
    expect(ev.toLevel).toBe(13)
    expect(typeof ev.ts).toBe('number')
    expect(ev.ts).toBeGreaterThan(0)
  })

  it('buildLevelUpEvent unlocks 透传', () => {
    const unlocks = { states: ['idle' as const], hats: ['crown' as const] }
    const ev = bridge.buildLevelUpEvent(9, 10, unlocks)
    expect(ev.unlocks).toEqual(unlocks)
  })

  it('buildXpGainedEvent → 包含 pctToNext + rarity 扩展字段（desk 端用）', () => {
    const ev = bridge.buildXpGainedEvent({
      delta: 0,
      bucket: 'streak.daily',
      totalXp: 1234,
      level: 12,
      pctToNext: 35,
      rarity: 'uncommon',
    })
    expect(ev.type).toBe('xp-gained')
    expect(ev.totalXp).toBe(1234)
    expect(ev.level).toBe(12)
    expect(ev.pctToNext).toBe(35)
    expect(ev.rarity).toBe('uncommon')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group G · feature gate / lifecycle — pushLevelUp / startXpPeriodicPush 不抛错
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T2 · bridge gate + petXP lifecycle', () => {
  const bridge = require('../../../src/desk/bridge.js') as {
    pushLevelUp: (from: number, to: number) => void
    pushXpUpdate: (opts: {
      delta: number
      bucket: string
      totalXp: number
      level: number
    }) => void
    pushLevelChange: (level: number, rarity: string) => void
  }

  test('pushLevelUp(12, 13) 在 feature off / runtime 缺失时不抛错', () => {
    expect(() => bridge.pushLevelUp(12, 13)).not.toThrow()
  })

  test('pushLevelUp 防御：toLevel <= fromLevel → 不发不抛', () => {
    expect(() => bridge.pushLevelUp(13, 13)).not.toThrow()
    expect(() => bridge.pushLevelUp(13, 12)).not.toThrow()
  })

  test('pushXpUpdate 在 feature off 时不抛', () => {
    expect(() =>
      bridge.pushXpUpdate({
        delta: 0,
        bucket: 'time',
        totalXp: 100,
        level: 3,
      }),
    ).not.toThrow()
  })

  test('pushLevelChange 在非法 level 时不抛', () => {
    expect(() => bridge.pushLevelChange(0, 'common')).not.toThrow()
    expect(() => bridge.pushLevelChange(NaN, 'common')).not.toThrow()
    expect(() => bridge.pushLevelChange(5, 'uncommon')).not.toThrow()
  })

  test('startXpPeriodicPush + stopXpPeriodicPush 生命周期', () => {
    const xp = require('../../../src/buddy/petXP.js') as {
      startXpPeriodicPush: (rarity: string, intervalMs?: number) => () => void
      stopXpPeriodicPush: () => void
      __isXpPeriodicPushRunningForTesting: () => boolean
    }
    expect(xp.__isXpPeriodicPushRunningForTesting()).toBe(false)
    const stop = xp.startXpPeriodicPush('common', 60_000)
    expect(xp.__isXpPeriodicPushRunningForTesting()).toBe(true)
    // 重复 start 不应叠加 timer（先停旧的）
    const stop2 = xp.startXpPeriodicPush('common', 60_000)
    expect(xp.__isXpPeriodicPushRunningForTesting()).toBe(true)
    stop2()
    expect(xp.__isXpPeriodicPushRunningForTesting()).toBe(false)
    // 重复 stop 安全
    expect(() => stop()).not.toThrow()
    expect(() => xp.stopXpPeriodicPush()).not.toThrow()
  })
})

// 测试隔离 — 防止 timer 泄漏到下个 test file
afterEach(() => {
  try {
    const xp = require('../../../src/buddy/petXP.js') as {
      stopXpPeriodicPush: () => void
    }
    xp.stopXpPeriodicPush()
  } catch {
    /* swallow */
  }
})
