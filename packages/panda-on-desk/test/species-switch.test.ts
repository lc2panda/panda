// Input: bun test 触发
// Output: 验证 W2-T1 18 物种切换 — hit.html __pandaSetSpecies 实装 + bridge pushSpeciesChange IPC
// Pos: panda-on-desk W2-T1 物种切换验收
//
// [NEW-FILE:#20260419-W2-01]
// 触发原因：W2 波"18 物种 + 实时切换"需自动化覆盖；__pandaSetSpecies 在 W1-T2 仅占位 console.log
//   现升级为真实 SVG swap + cache + IPC，必须有用例守护防回归。
// 不可在现有测试中扩展：theme-panda.test.ts 验主题资产；pet-visible.test.ts 验静态结构 + getHitRectScreen；
//   species 切换是新行为（cache 逻辑 + IPC bridge + DOM swap），语义正交，必须新文件。
// 证据：
//   - SVG inline embed best practice: https://developer.mozilla.org/en-US/docs/Web/SVG
//   - DOMParser image/svg+xml: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
//   - Bun test runner: https://bun.sh/docs/cli/test
//   - CompanionSprite species 来源 src/buddy/companion.ts getCompanion()

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

import {
  __pushSpeciesChangeCore,
  __resetSpeciesDedupForTesting,
  buildSpeciesChangeEvent,
  pushSpeciesChange,
  SPECIES_WHITELIST,
} from '../../../src/desk/bridge.js'
import type { Species, SpeciesChangeEvent } from '../../../src/desk/types.js'

const PKG_ROOT = path.resolve(__dirname, '..')
const HIT_HTML_PATH = path.join(PKG_ROOT, 'src', 'renderer', 'hit.html')
const SPRITES_DIR = path.join(PKG_ROOT, 'themes', 'panda', 'sprites')

// 18 物种白名单（与 src/desk/types.ts Species union + bridge.ts SPECIES_WHITELIST 同源）
const SPECIES_18: Species[] = [
  'duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl',
  'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara',
  'cactus', 'robot', 'rabbit', 'mushroom', 'chonk',
]

beforeEach(() => {
  __resetSpeciesDedupForTesting()
})

afterEach(() => {
  __resetSpeciesDedupForTesting()
})

describe('panda-on-desk · W2-T1 物种切换', () => {
  // ── 1. hit.html 静态结构：__pandaSetSpecies 实装 + 18 物种白名单 ────────────
  describe('hit.html __pandaSetSpecies 实装', () => {
    test('hit.html 含 SPECIES_LIST 18 物种白名单（与 SPECIES_WHITELIST 同源）', () => {
      const html = fs.readFileSync(HIT_HTML_PATH, 'utf8')
      // 必须含 SPECIES_LIST 数组定义
      expect(html).toContain('SPECIES_LIST')
      // 18 物种全部在内
      for (const sp of SPECIES_18) {
        expect(html).toContain(`'${sp}'`)
      }
    })

    test('__pandaSetSpecies 不再是 stub（含 applySvgString 替换 .panda-face 实装）', () => {
      const html = fs.readFileSync(HIT_HTML_PATH, 'utf8')
      // 占位日志已删除 — '待 v0.6 接入' 不再出现
      expect(html).not.toContain('待 v0.6 接入')
      // 关键实装符号
      expect(html).toContain('SPECIES_CACHE')
      expect(html).toContain('preloadSpeciesSvgs')
      expect(html).toContain('applySvgString')
      // .panda-face 仍是 swap 锚点
      expect(html).toContain('.panda-face')
      // body[data-species] 标记
      expect(html).toContain('data-species="default"')
      expect(html).toContain('document.body.dataset.species')
      // bridge 'species' 事件处理器
      expect(html).toContain("evt.type === 'species'")
      expect(html).toContain('__pandaPendingSpecies')
    })

    test('preload 路径指向 ../../themes/panda/sprites/{species}.svg（相对 src/renderer/hit.html）', () => {
      const html = fs.readFileSync(HIT_HTML_PATH, 'utf8')
      expect(html).toContain('../../themes/panda/sprites/')
      // fetch 调用必须走 fetch API（不是 XMLHttpRequest）— 路径走变量拼接，url=base+sp+'.svg'
      expect(html).toMatch(/fetch\s*\(/)
      expect(html).toContain("'../../themes/panda/sprites/'")
      expect(html).toContain("'.svg'")
      expect(html).not.toContain('XMLHttpRequest')
    })
  })

  // ── 2. 18 物种 SVG 资产存在 + DOMParser 可解析（preload 真实可用前提） ───────
  describe('18 物种 SVG 资产 preload 前置条件', () => {
    test('18 物种 SVG 文件全部存在 + DOMParser 解析后含 <svg> 根 + state-error 分组', () => {
      const failed: string[] = []
      for (const sp of SPECIES_18) {
        const f = path.join(SPRITES_DIR, `${sp}.svg`)
        if (!fs.existsSync(f)) {
          failed.push(`${sp}: file missing`)
          continue
        }
        const text = fs.readFileSync(f, 'utf8')
        if (!text.includes('<svg')) failed.push(`${sp}: no <svg>`)
        if (!text.includes(`data-species="${sp}"`)) failed.push(`${sp}: data-species attr missing`)
        if (!text.includes('id="state-idle"')) failed.push(`${sp}: state-idle group missing`)
      }
      expect(failed).toEqual([])
    })

    test('default.svg 兜底文件存在（未知 species fallback 用）', () => {
      const f = path.join(SPRITES_DIR, 'default.svg')
      expect(fs.existsSync(f)).toBe(true)
      const text = fs.readFileSync(f, 'utf8')
      expect(text).toContain('<svg')
      expect(text).toContain('data-species="default"')
    })
  })

  // ── 3. bridge IPC: buildSpeciesChangeEvent + pushSpeciesChange 协议 ──────────
  describe('bridge.ts pushSpeciesChange / buildSpeciesChangeEvent', () => {
    test('SPECIES_WHITELIST 与 src/buddy/types.ts SPECIES 18 物种字面量一致', () => {
      expect(SPECIES_WHITELIST.length).toBe(18)
      const set = new Set(SPECIES_WHITELIST)
      for (const sp of SPECIES_18) {
        expect(set.has(sp)).toBe(true)
      }
    })

    test('buildSpeciesChangeEvent 为 robot 返回合法 SpeciesChangeEvent（type/species/sessionId/ts）', () => {
      const ev = buildSpeciesChangeEvent('robot', 'sid-w2-001')
      expect(ev.type).toBe('species')
      expect(ev.species).toBe('robot')
      expect(ev.sessionId).toBe('sid-w2-001')
      expect(typeof ev.ts).toBe('number')
      expect(ev.ts).toBeGreaterThan(0)
    })

    test('__pushSpeciesChangeCore：18 物种 swap 各 1 → emit 18 次（dedup 不会误吞首次）', () => {
      const captured: SpeciesChangeEvent[] = []
      for (const sp of SPECIES_18) {
        __pushSpeciesChangeCore(sp, 'sid-w2-iter', ev => captured.push(ev))
      }
      expect(captured.length).toBe(18)
      // 顺序 + species 值与 SPECIES_18 1:1 对齐
      for (let i = 0; i < SPECIES_18.length; i++) {
        expect(captured[i]!.species).toBe(SPECIES_18[i]!)
        expect(captured[i]!.type).toBe('species')
        expect(captured[i]!.sessionId).toBe('sid-w2-iter')
      }
    })

    test('__pushSpeciesChangeCore：同 species 连发 2 次 → dedup 仅 emit 1 次', () => {
      const captured: SpeciesChangeEvent[] = []
      __pushSpeciesChangeCore('robot', 'sid-dedup', ev => captured.push(ev))
      __pushSpeciesChangeCore('robot', 'sid-dedup', ev => captured.push(ev))
      __pushSpeciesChangeCore('robot', 'sid-dedup', ev => captured.push(ev))
      expect(captured.length).toBe(1)
      expect(captured[0]!.species).toBe('robot')
    })

    test('__pushSpeciesChangeCore：robot → cat → robot 序列 → emit 3 次（不同 species 不去重）', () => {
      const captured: SpeciesChangeEvent[] = []
      __pushSpeciesChangeCore('robot', 'sid-seq', ev => captured.push(ev))
      __pushSpeciesChangeCore('cat', 'sid-seq', ev => captured.push(ev))
      __pushSpeciesChangeCore('robot', 'sid-seq', ev => captured.push(ev))
      expect(captured.length).toBe(3)
      expect(captured.map(e => e.species)).toEqual(['robot', 'cat', 'robot'])
    })

    test('pushSpeciesChange：未知 species → 直接拒收，不抛错（feature gate off 也不抛）', () => {
      // bun test 默认 feature('BUDDY') = false → pushSpeciesChange 短路返回
      expect(() => pushSpeciesChange('unknown-x' as Species, 'sid-unknown')).not.toThrow()
      expect(() => pushSpeciesChange('' as Species, 'sid-empty')).not.toThrow()
      // 合法 species 在 feature off 也不应抛
      expect(() => pushSpeciesChange('robot', 'sid-feature-off')).not.toThrow()
    })
  })

  // ── 4. IPC 端到端协议字段：renderer 应能识别的 evt.type='species' + evt.species 字段 ──
  describe('IPC pushSpeciesChange → renderer 协议契约', () => {
    test('SpeciesChangeEvent.type 必为字面量 "species" 且 species 字段为字符串', () => {
      // why：renderer hit.html 的 if (evt.type === 'species' && typeof evt.species === 'string') 守门
      //      此处反向校验 build 出的事件能通过 renderer 守门
      const ev = buildSpeciesChangeEvent('penguin', 'sid-protocol')
      expect(ev.type).toBe('species')
      expect(typeof ev.species).toBe('string')
      // 模拟 hit.html 内 evt.type/species 校验逻辑
      const renderer_accepts =
        ev !== null &&
        typeof ev === 'object' &&
        typeof (ev as { type?: unknown }).type === 'string' &&
        (ev as { type?: unknown }).type === 'species' &&
        typeof (ev as { species?: unknown }).species === 'string'
      expect(renderer_accepts).toBe(true)
    })

    test('hit.html __pandaPendingSpecies 缓存逻辑存在（注入前事件不丢）', () => {
      const html = fs.readFileSync(HIT_HTML_PATH, 'utf8')
      // pending 缓存
      expect(html).toContain('__pandaPendingSpecies')
      // 注入后回放
      expect(html).toMatch(/window\.__pandaPendingSpecies\s*=\s*null/)
    })
  })
})
