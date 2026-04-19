// Input: bun test 触发
// Output: 验证 W1-T2 美工升级落地 — hit.html 多状态 + 渐变 + 阴影 + window.__pandaSetState 接口；
//          5 物种 SVG sprite 含 linearGradient + filter；panda.svg icon 含 #FFD700 + drop-shadow
// Pos: panda-on-desk W1-T2 美工升级回归用例
//
// [NEW-FILE:#20260419-W1-03]
// 触发原因：W1-T2 把 hit.html 从简笔升级到精美 panda（7 状态动画 + 渐变 + 多层阴影 + 高光），
//   并升级 5 个核心物种 sprite + panda.svg 主 icon。需自动化用例锁定升级契约，防回归。
// 不可在 pet-visible.test.ts 扩展：那里只验"含简笔元素"；本套验"美工升级"专项契约。
// 证据：
//   - SVG linearGradient 规范：https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient
//   - SVG filter drop-shadow 规范：https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter
//   - Electron transparent window CSS animation 兼容：https://www.electronjs.org/docs/latest/tutorial/window-customization

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')
const HIT_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'hit.html')
const ICON_PANDA = path.join(PKG_ROOT, 'build', 'icons', 'panda.svg')
const SPRITES_DIR = path.join(PKG_ROOT, 'themes', 'panda', 'sprites')

// W1-T2 美工 7 状态白名单 — 与 PetState 12 态高频子集对齐
const PET_STATES_7 = [
  'idle',
  'thinking',
  'working',
  'sleeping',
  'error',
  'attention',
  'notification',
] as const

// 5 个核心物种（panda 物种 sprite 不存在 — 主 icon 走 build/icons/panda.svg；
// sprite 层 5 核心 = robot/owl/chonk/duck/default 兜底）
const CORE_SPECIES = ['robot', 'owl', 'chonk', 'duck', 'default'] as const

describe('panda-on-desk · W1-T2 美工升级 art-quality', () => {
  describe('hit.html — 7 状态动画 + 渐变 + 阴影 + 高光 + 接口', () => {
    it('hit.html 含 7 个 PetState data attribute selector（idle/thinking/working/sleeping/error/attention/notification）', () => {
      expect(fs.existsSync(HIT_HTML)).toBe(true)
      const html = fs.readFileSync(HIT_HTML, 'utf8')

      const missing: string[] = []
      for (const st of PET_STATES_7) {
        // CSS 选择器形式：[data-pet-state="thinking"]
        const sel = `[data-pet-state="${st}"]`
        if (!html.includes(sel)) missing.push(st)
      }
      expect(missing).toEqual([])
    })

    it('hit.html 含 linearGradient（耳/眼罩立体感）+ radialGradient（脸球面感）', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // 至少 2 个 linearGradient（gradEar / gradMask）
      const lgCount = (html.match(/<linearGradient[\s>]/g) || []).length
      expect(lgCount).toBeGreaterThanOrEqual(2)
      // radialGradient 用于脸 + 鼻
      expect(html).toMatch(/<radialGradient/)
      // 引用渐变（fill="url(#...)"）
      expect(html).toMatch(/fill="url\(#grad/)
    })

    it('hit.html 含 filter（drop-shadow / feGaussianBlur）多层阴影', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // CSS filter: drop-shadow（容器 #pet 多层阴影）
      expect(html).toMatch(/filter:\s*[\s\S]*?drop-shadow/)
      // 至少 3 层 drop-shadow（近 / 中 / 远）
      const dropShadowCount = (html.match(/drop-shadow\(/g) || []).length
      expect(dropShadowCount).toBeGreaterThanOrEqual(3)
      // SVG filter 节点（feGaussianBlur）
      expect(html).toContain('<filter')
      expect(html).toContain('feGaussianBlur')
    })

    it('hit.html 含顶部高光（白色椭圆 fill-opacity 模拟 3D 球面）', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // 至少 1 个白色椭圆 + fill-opacity（顶部高光层）
      expect(html).toMatch(/<ellipse[^>]+fill="#ffffff"[^>]+fill-opacity="0\.[46]"/)
    })

    it('hit.html 暴露 window.__pandaSetState 函数 + 7 状态白名单 + window.__pandaSetSpecies 占位', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // 接口暴露
      expect(html).toContain('window.__pandaSetState')
      expect(html).toContain('window.__pandaSetSpecies')
      // 7 状态白名单数组（防止接口悄悄缩减）
      for (const st of PET_STATES_7) {
        expect(html).toContain(`'${st}'`)
      }
      // 接口必须先于 bridge 实际订阅调用声明（保证 W1-T4 pet-state 事件可立即调用）
      // 用赋值锚点（= function）避免被 CSS 注释里的字符串干扰
      const setStateIdx = html.indexOf('window.__pandaSetState = function')
      const onEventCallIdx = html.indexOf('window.panda.onEvent(function')
      expect(setStateIdx).toBeGreaterThan(0)
      expect(onEventCallIdx).toBeGreaterThan(setStateIdx)
    })

    it('hit.html 含 7 状态 CSS @keyframes 动画', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // 至少 7 个 @keyframes 命名（每态一个动画 — 实际更多，含 idle-breath/blink/question-float/work-shake/sleep-breath/zzz-rise/fall-shake/jump-attn/bell-shake）
      const kfCount = (html.match(/@keyframes\s+[\w-]+/g) || []).length
      expect(kfCount).toBeGreaterThanOrEqual(7)
    })

    it('hit.html 保留 -webkit-app-region: drag（与 W1-T4 / pet-visible 兼容）', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      const dragCount = (html.match(/-webkit-app-region:\s*drag/g) || []).length
      expect(dragCount).toBeGreaterThanOrEqual(2)
      // bridge 订阅链路（W1-T4）保留
      expect(html).toContain('window.panda.onEvent')
      expect(html).toContain("evt.type === 'pet-state'")
    })
  })

  describe('panda.svg icon — 金色 #FFD700 + drop-shadow + 渐变', () => {
    it('panda.svg 含金色 #FFD700 边框 + drop-shadow filter', () => {
      expect(fs.existsSync(ICON_PANDA)).toBe(true)
      const text = fs.readFileSync(ICON_PANDA, 'utf8')

      // 金色 #FFD700 必须出现（边框 / 渐变 stop / 标签文字）
      expect(text).toContain('#FFD700')
      // SVG filter（drop-shadow / feGaussianBlur）
      expect(text).toContain('<filter')
      expect(text).toContain('feGaussianBlur')
      expect(text).toMatch(/feMerge/)
      // 至少一个金色描边的 rect（边框）
      expect(text).toMatch(/<rect[^>]+stroke="(?:url\(#goldGrad\)|#FFD700)"/i)
      // 引用 dropShadow filter
      expect(text).toMatch(/filter="url\(#dropShadow\)"/)
    })

    it('panda.svg 含 linearGradient + radialGradient（金色/脸/耳渐变）', () => {
      const text = fs.readFileSync(ICON_PANDA, 'utf8')
      // 金色渐变 + 黑耳渐变 + 眼罩渐变 — 至少 3 个 linearGradient
      const lgCount = (text.match(/<linearGradient[\s>]/g) || []).length
      expect(lgCount).toBeGreaterThanOrEqual(2)
      // 脸 / 鼻 用 radialGradient
      const rgCount = (text.match(/<radialGradient[\s>]/g) || []).length
      expect(rgCount).toBeGreaterThanOrEqual(2)
    })

    it('panda.svg 保留简笔元素契约（圆脸 + 黑耳 + 黑眼罩 + viewBox 512）', () => {
      const text = fs.readFileSync(ICON_PANDA, 'utf8')
      // 与 theme-panda.test.ts 兼容（不破坏既有断言）
      expect(text).toContain('viewBox="0 0 512 512"')
      expect(text).toMatch(/<circle\s+cx="256"/)
      expect(text).toMatch(/<ellipse[^>]+cx="120"/)
      expect(text).toMatch(/<ellipse[^>]+cx="392"/)
      expect(text.toLowerCase()).toContain('panda')
    })
  })

  describe('5 个核心物种 sprite — 渐变 + drop-shadow filter', () => {
    it('robot/owl/chonk/duck/default 5 个核心 sprite 含 linearGradient + filter (drop-shadow)', () => {
      const failed: string[] = []
      for (const sp of CORE_SPECIES) {
        const p = path.join(SPRITES_DIR, `${sp}.svg`)
        if (!fs.existsSync(p)) {
          failed.push(`${sp}: file missing`)
          continue
        }
        const text = fs.readFileSync(p, 'utf8')
        const checks: Array<[string, boolean]> = [
          ['linearGradient', text.includes('<linearGradient')],
          ['filter id=spriteShadow', text.includes('id="spriteShadow"')],
          ['feGaussianBlur', text.includes('feGaussianBlur')],
          ['filter url ref', /filter="url\(#spriteShadow\)"/.test(text)],
        ]
        for (const [name, ok] of checks) {
          if (!ok) failed.push(`${sp}: missing ${name}`)
        }
      }
      expect(failed).toEqual([])
    })

    it('5 个核心 sprite 保留 12 PetState 分组 + ASCII 兼容（与 theme-panda.test.ts 契约一致）', () => {
      for (const sp of CORE_SPECIES) {
        const text = fs.readFileSync(path.join(SPRITES_DIR, `${sp}.svg`), 'utf8')
        // 12 状态 group 仍存在（不破坏旧契约）
        const stateGroups = text.match(/<g\s+id="state-[a-z]+"/g) || []
        expect(stateGroups.length).toBe(12)
        // 等宽字体 + viewBox 200×200 不变
        expect(text).toContain('viewBox="0 0 200 200"')
        expect(text).toContain('font-family="ui-monospace')
      }
    })
  })
})
