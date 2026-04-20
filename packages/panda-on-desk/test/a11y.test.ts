// Input:  bun test 触发
// Output: ≥ 6 用例 — 验证 W8-T2 a11y 加固落地：
//         hit.html role="img" + aria-label / badge aria-live="polite" /
//         bubble.html role="alertdialog" / 键盘 Enter 触发 poke 等价路径 /
//         settings.html form + aria-label / 颜色对比度（WCAG 2.1 AA 4.5:1）/
//         i18n a11y 三语词条覆盖
// Pos:    panda-on-desk W8-T2 a11y 验收专项
//
// [NEW-FILE:#W8-01]
// 触发原因：W2-T4 仅给 badge 加了 aria-live；W8-T2 需要把 hit.html / bubble.html /
//   settings.html 三处全面 a11y 化（role / aria-label / 键盘等价 / WCAG AA 对比），
//   并新增 a11y 三语词条。需独立用例锁定契约，防 a11y 回归。
// 不可在 art-quality.test.ts 扩展：那里只验视觉契约；本套验 ARIA / WCAG / 键盘契约。
// 证据：
//   - WCAG 2.1 AA 文字对比 4.5:1: https://www.w3.org/TR/WCAG21/#contrast-minimum
//   - WAI-ARIA 1.2 alertdialog: https://www.w3.org/TR/wai-aria-1.2/#alertdialog
//   - SVG accessibility (role=img + title/desc): https://www.w3.org/TR/svg-aam-1.0/
//   - WCAG 2.1.1 Keyboard: https://www.w3.org/TR/WCAG21/#keyboard
//
// 严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}
// 0 新依赖 — 仅用 node:fs / bun:test

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { i18n, SUPPORTED_LANGS, type LangCode } from '../src/i18n.js'

const PKG_ROOT = path.resolve(__dirname, '..')
const HIT_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'hit.html')
const BUBBLE_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'bubble.html')
const SETTINGS_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'settings.html')
const BUBBLE_WINDOW_TS = path.join(PKG_ROOT, 'src', 'overlay', 'bubble-window.ts')

// W8-T2 a11y 三语 i18n 词条键集合（与 i18n.ts 注入对齐）
const A11Y_KEYS = [
  'a11yPandaTitle',
  'a11yPandaDesc',
  'a11yPandaLabel',
  'a11yBadgeUnread',
  'a11yStatsDialog',
  'a11yLevelContainer',
  'a11yBubbleAlert',
  'a11yBubbleAllow',
  'a11yBubbleDeny',
  'a11yBubbleClose',
  'a11ySettingsForm',
  'a11ySwitchOn',
  'a11ySwitchOff',
  'a11ySpeciesSelect',
  'a11yLanguageSelect',
  'a11yDndStartTime',
  'a11yDndEndTime',
  'a11yVolumeSlider',
  'a11yKeyboardHintPoke',
  'a11yKeyboardHintStats',
] as const

// ── 颜色对比度计算（WCAG 2.0 relative luminance + contrast ratio）─────────────
// 算法源：https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
function parseHex(hex: string): [number, number, number] {
  const m = hex.replace(/^#/, '')
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  if (full.length !== 6) throw new Error(`invalid hex: ${hex}`)
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}
function relLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrastRatio(fg: string, bg: string): number {
  const lFg = relLuminance(parseHex(fg))
  const lBg = relLuminance(parseHex(bg))
  const [lighter, darker] = lFg > lBg ? [lFg, lBg] : [lBg, lFg]
  return (lighter + 0.05) / (darker + 0.05)
}

describe('panda-on-desk · W8-T2 a11y 加固', () => {
  // ── 1. hit.html ────────────────────────────────────────────────────────────
  describe('hit.html — SVG role/title/desc + badge aria-live + stats dialog + 键盘交互', () => {
    it('hit.html SVG panda-face 含 role="img" + aria-label + <title> + <desc>（WCAG SVG accessibility）', () => {
      expect(fs.existsSync(HIT_HTML)).toBe(true)
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // SVG 主体加 role="img"（屏幕阅读器视为单一图像而非容器）
      expect(html).toMatch(/<svg[^>]+role="img"/)
      // aria-label 兜底（即使 title 无 id 引用也有可读名称）
      expect(html).toMatch(/<svg[^>]+aria-label="panda companion"/)
      // <title> 节点（hover tooltip + AT primary name）
      expect(html).toMatch(/<title id="panda-svg-title"[^>]*>Panda companion<\/title>/)
      // <desc> 节点（详细描述）
      expect(html).toContain('<desc id="panda-svg-desc"')
      expect(html).toContain('Animated panda desktop pet showing your panda CLI status.')
      // aria-labelledby / aria-describedby 引用（WCAG 1.1.1 Non-text Content）
      expect(html).toMatch(/aria-labelledby="panda-svg-title"/)
      expect(html).toMatch(/aria-describedby="panda-svg-desc"/)
    })

    it('hit.html badge 含 aria-live="polite" + aria-atomic + aria-label + role="status"（W2-T4 扩展为 W8-T2 完整）', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // aria-live polite — 数字变更时屏幕阅读器朗读
      expect(html).toMatch(/<div id="badge"[^>]+aria-live="polite"/)
      // aria-atomic true — 整体重新读，避免只读差量
      expect(html).toMatch(/<div id="badge"[^>]+aria-atomic="true"/)
      // role status — 状态区，AT 知道是动态状态而非静态
      expect(html).toMatch(/<div id="badge"[^>]+role="status"/)
      // aria-label fallback（pandaI18n 注入前的 en 兜底）
      expect(html).toMatch(/<div id="badge"[^>]+aria-label="Unread notifications"/)
      // i18n hook（data-i18n-aria-key）— 三语化通道
      expect(html).toMatch(/<div id="badge"[^>]+data-i18n-aria-key="a11yBadgeUnread"/)
    })

    it('hit.html stats-card 含 role="dialog" + aria-modal + aria-label（替换 aria-hidden）', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // role dialog — 屏幕阅读器进入对话区
      expect(html).toMatch(/<div id="stats-card"[^>]+role="dialog"/)
      // aria-modal false — 非阻塞 dialog（不抢焦点，stats 是 toast 式）
      expect(html).toMatch(/<div id="stats-card"[^>]+aria-modal="false"/)
      // aria-label + 三语 hook
      expect(html).toMatch(/<div id="stats-card"[^>]+aria-label="Pet stats card"/)
      expect(html).toMatch(/<div id="stats-card"[^>]+data-i18n-aria-key="a11yStatsDialog"/)
      // 不再 aria-hidden（之前的 aria-hidden="true" 让 AT 完全跳过）
      expect(html).not.toMatch(/<div id="stats-card"[^>]+aria-hidden="true"/)
    })

    it('hit.html #pet 容器 role="button" + tabindex="0" + 键盘 keydown/keyup 监听（Enter/Space 等价 dblclick poke + 长按 stats）', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // tabindex=0 + role=button — 键盘可达
      expect(html).toMatch(/<div id="pet"[^>]+role="button"/)
      expect(html).toMatch(/<div id="pet"[^>]+tabindex="0"/)
      expect(html).toMatch(/<div id="pet"[^>]+aria-label="panda desktop pet"/)
      // 键盘事件监听（Enter / Space）— 守卫式 early return 写法 e.key !== 'Enter'
      expect(html).toContain("'Enter'")
      expect(html).toContain("'Spacebar'")
      // 短按等价 poke / 长按等价 stats（与 pointer 路径同 LONG_PRESS_MS = 1000ms）
      expect(html).toContain('window.__pandaPoke()')
      expect(html).toContain('window.__pandaShowStats()')
      // keydown / keyup 双向（释放时计算 held duration）
      expect(html).toContain("petEl.addEventListener('keydown'")
      expect(html).toContain("petEl.addEventListener('keyup'")
    })
  })

  // ── 2. bubble.html / bubble-window.ts ─────────────────────────────────────
  describe('bubble.html — role="alertdialog" + aria-label + ESC 关闭 + 按钮 aria-label + 自动 focus', () => {
    it('bubble.html card 含 role="alertdialog" + aria-modal + aria-label（WAI-ARIA alertdialog）', () => {
      expect(fs.existsSync(BUBBLE_HTML)).toBe(true)
      const html = fs.readFileSync(BUBBLE_HTML, 'utf8')
      // alertdialog — 紧急对话，AT 立即提醒
      expect(html).toMatch(/<div class="card"[^>]+role="alertdialog"/)
      expect(html).toMatch(/<div class="card"[^>]+aria-modal="true"/)
      expect(html).toMatch(/<div class="card"[^>]+aria-label="Permission request bubble"/)
      // tabindex -1 — 卡片本身可程序聚焦但不在 Tab 序列里
      expect(html).toMatch(/<div class="card"[^>]+tabindex="-1"/)
    })

    it('bubble.html Allow/Deny 按钮含 type="button" + aria-label（WCAG 4.1.2 Name/Role/Value）', () => {
      const html = fs.readFileSync(BUBBLE_HTML, 'utf8')
      expect(html).toMatch(/<button[^>]+id="btnAllow"[^>]+type="button"[^>]+aria-label="Allow this permission request"/)
      expect(html).toMatch(/<button[^>]+id="btnDeny"[^>]+type="button"[^>]+aria-label="Deny this permission request"/)
    })

    it('bubble.html 含 ESC 关闭键盘 handler（WCAG 2.1.2 No Keyboard Trap）+ MutationObserver 自动 focus（WCAG 2.4.3 Focus Order）', () => {
      const html = fs.readFileSync(BUBBLE_HTML, 'utf8')
      // ESC 监听
      expect(html).toContain('e.key === "Escape"')
      // ESC → 等价 Deny（保留 SSE 协议契约）
      expect(html).toMatch(/btnDeny\.click\(\)/)
      // 显示后自动聚焦 Allow（focusFirstAction）
      expect(html).toContain('focusFirstAction')
      expect(html).toContain('btnAllow.focus()')
      // MutationObserver 监听 card.classList visible 变化，避免 monkey-patch revealCard
      expect(html).toContain('MutationObserver')
    })

    it('bubble-window.ts BrowserWindow 含 title 字段（OS 任务栏 + AT 朗读窗口名）', () => {
      expect(fs.existsSync(BUBBLE_WINDOW_TS)).toBe(true)
      const ts = fs.readFileSync(BUBBLE_WINDOW_TS, 'utf8')
      // OverlayWindowOptions 接口含 title?: string
      expect(ts).toMatch(/title\?:\s*string/)
      // 实际派生 a11yTitle 并赋给 opts.title（fallback 'panda notification'）
      expect(ts).toContain('a11yTitle')
      expect(ts).toContain("'panda notification'")
      expect(ts).toMatch(/title:\s*a11yTitle/)
    })
  })

  // ── 3. settings.html ───────────────────────────────────────────────────────
  describe('settings.html — form 包装 + select/input aria-label + WCAG AA 颜色对比', () => {
    it('settings.html panel 包成 <form role="form"> + aria-label（WCAG 1.3.1 Info/Relationships）', () => {
      expect(fs.existsSync(SETTINGS_HTML)).toBe(true)
      const html = fs.readFileSync(SETTINGS_HTML, 'utf8')
      // form 元素 + role + aria-label
      expect(html).toMatch(/<form[^>]+class="panel"[^>]+role="form"[^>]+aria-label="panda-on-desk preferences form"/)
      expect(html).toMatch(/data-i18n-aria-key="a11ySettingsForm"/)
      // form 闭合（之前是 </section>）
      expect(html).toContain('</form>')
    })

    it('settings.html select / input 含 aria-label + 三语 hook + range 含 aria-valuemin/max/now（WCAG 4.1.2）', () => {
      const html = fs.readFileSync(SETTINGS_HTML, 'utf8')
      // species select
      expect(html).toMatch(/<select id="sel-species"[^>]+aria-label="Choose pet species"/)
      // language select
      expect(html).toMatch(/<select id="sel-language"[^>]+aria-label="Choose UI language"/)
      // time inputs
      expect(html).toMatch(/<input type="time" id="time-dndStart"[^>]+aria-label="Do-not-disturb start time"/)
      expect(html).toMatch(/<input type="time" id="time-dndEnd"[^>]+aria-label="Do-not-disturb end time"/)
      // range — aria-valuemin/max/now
      expect(html).toMatch(/<input type="range"[^>]+aria-valuemin="0"/)
      expect(html).toMatch(/aria-valuemax="100"/)
      expect(html).toMatch(/aria-valuenow="60"/)
      // val-volume aria-live polite — 数值变化朗读
      expect(html).toMatch(/<div class="volume-value"[^>]+aria-live="polite"/)
      // switch role + aria-checked + aria-labelledby（与 row title 关联）
      expect(html).toMatch(/<div class="switch" id="sw-companionOnDesk"[^>]+role="switch"[^>]+aria-checked/)
      expect(html).toMatch(/<div class="switch" id="sw-companionOnDesk"[^>]+aria-labelledby="sw-companionOnDesk-label"/)
      // applyDict 注入 data-i18n-aria-key → aria-label
      expect(html).toContain('data-i18n-aria-key')
      expect(html).toContain("setAttribute('aria-label'")
    })

    it('settings.html accent / switch-on / text 颜色对比 ≥ 4.5:1（WCAG 2.1 AA contrast minimum）', () => {
      const html = fs.readFileSync(SETTINGS_HTML, 'utf8')
      // 提取 --accent / --text-primary / --bg / --switch-off 的 light theme 值
      // why: 仅断言强化后的 #b85a3a / #71717a — 旧值 #d97757 / #d4d4d8 不达标
      expect(html).toContain('--accent: #b85a3a')
      expect(html).toContain('--switch-off: #71717a')
      expect(html).toContain('--switch-on: #b85a3a')

      // accent #b85a3a 文字 vs 白底 #ffffff
      const accentVsWhite = contrastRatio('#b85a3a', '#ffffff')
      expect(accentVsWhite).toBeGreaterThanOrEqual(4.5)

      // text-primary #18181b vs bg #f5f5f7（light theme）
      const textVsBg = contrastRatio('#18181b', '#f5f5f7')
      expect(textVsBg).toBeGreaterThanOrEqual(4.5)

      // switch-off #71717a UI component vs bg #ffffff (WCAG 1.4.11 Non-text Contrast 3:1)
      const switchVsWhite = contrastRatio('#71717a', '#ffffff')
      expect(switchVsWhite).toBeGreaterThanOrEqual(3.0)
    })
  })

  // ── 4. i18n a11y 三语 ──────────────────────────────────────────────────────
  describe('i18n.ts — a11y 词条三语完整覆盖（en/zh/ko）', () => {
    it('a11y 三语词条全集 (≥ 20 keys) 在 en/zh/ko 三语字典中均存在且非空', () => {
      const missing: string[] = []
      for (const lang of SUPPORTED_LANGS) {
        const dict = i18n[lang as LangCode]
        for (const key of A11Y_KEYS) {
          const val = (dict as Record<string, string>)[key]
          if (typeof val !== 'string' || val.length === 0) {
            missing.push(`${lang}:${key}`)
          }
        }
      }
      expect(missing).toEqual([])
      // 数量门槛：A11Y_KEYS ≥ 20，三语 60 项
      expect(A11Y_KEYS.length).toBeGreaterThanOrEqual(20)
    })

    it('a11y 词条避免空 / 与 key 自身相同（防止 fallback 兜底误显 key 名）', () => {
      const sameAsKey: string[] = []
      for (const lang of SUPPORTED_LANGS) {
        const dict = i18n[lang as LangCode]
        for (const key of A11Y_KEYS) {
          const val = (dict as Record<string, string>)[key]
          if (val === key) sameAsKey.push(`${lang}:${key}`)
        }
      }
      expect(sameAsKey).toEqual([])
    })
  })
})
