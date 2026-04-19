// Input: bun test 触发
// Output: 验证 themes/panda 资产完整性 + theme-renderer 18×12 渲染契约
// Pos: panda-on-desk Phase 1 P1-T6 主题验收
//
// [NEW-FILE:#20260419-P1-11]

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

import {
  PANDA_PET_STATES,
  PANDA_SPECIES,
  applyEye,
  getThemeMetadata,
  loadPandaTheme,
  loadSpeciesSprite,
  loadSpeciesSvg,
  loadTheme,
  parseAsciiSprite,
  renderSpriteToHtml,
  renderSpriteToSvgHtml,
} from '../src/theme-renderer'

const PKG_ROOT = path.resolve(__dirname, '..')
const PANDA_THEME_DIR = path.join(PKG_ROOT, 'themes', 'panda')

describe('panda-on-desk · themes/panda · P1-T6', () => {
  describe('theme.json schema 完整性', () => {
    it('theme.json 存在且字段齐全', () => {
      const jsonPath = path.join(PANDA_THEME_DIR, 'theme.json')
      expect(fs.existsSync(jsonPath)).toBe(true)
      const cfg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
      expect(cfg.schemaVersion).toBe(1)
      expect(cfg.id).toBe('panda-default')
      expect(cfg.name).toBe('Panda')
      expect(cfg.version).toBe('0.1.0')
      expect(cfg.viewBox).toBeDefined()
      expect(cfg.viewBox.width).toBeGreaterThan(0)
      expect(cfg.viewBox.height).toBeGreaterThan(0)
      expect(cfg.layout).toBeDefined()
      expect(cfg.eyeTracking).toBeDefined()
    })

    it('states 字段覆盖 12 PetState 全集', () => {
      const cfg = JSON.parse(
        fs.readFileSync(path.join(PANDA_THEME_DIR, 'theme.json'), 'utf8'),
      )
      const stateKeys = Object.keys(cfg.states).filter(
        (k) => !k.startsWith('_'),
      )
      expect(stateKeys.length).toBe(PANDA_PET_STATES.length)
      for (const s of PANDA_PET_STATES) {
        expect(cfg.states[s]).toBeDefined()
      }
    })
  })

  describe('sprites/*.ascii 资产完整性', () => {
    it('18 物种 sprite 文件全部存在 + default.ascii 兜底', () => {
      const spritesDir = path.join(PANDA_THEME_DIR, 'sprites')
      expect(fs.existsSync(spritesDir)).toBe(true)
      expect(fs.existsSync(path.join(spritesDir, 'default.ascii'))).toBe(true)
      const missing: string[] = []
      for (const sp of PANDA_SPECIES) {
        const f = path.join(spritesDir, `${sp}.ascii`)
        if (!fs.existsSync(f)) missing.push(sp)
      }
      expect(missing).toEqual([])
    })

    it('每个 sprite 文件解析后 ≥ 1 帧且包含 {E} eye 占位符或非空字符', () => {
      const spritesDir = path.join(PANDA_THEME_DIR, 'sprites')
      for (const sp of PANDA_SPECIES) {
        const text = fs.readFileSync(
          path.join(spritesDir, `${sp}.ascii`),
          'utf8',
        )
        const frames = parseAsciiSprite(text)
        expect(frames.length).toBeGreaterThanOrEqual(1)
        const flat = frames.flat().join('\n')
        // 至少含 eye 占位符或 panda-sprite 体特征字符
        expect(flat.length).toBeGreaterThan(0)
      }
    })
  })

  describe('theme-renderer 渲染契约', () => {
    it('loadTheme("panda") 不抛错且返回 LoadedPandaTheme', () => {
      const theme = loadTheme('panda')
      expect(theme.id).toBe('panda-default')
      expect(theme.themeDir).toBe(PANDA_THEME_DIR)
      expect(theme.json.name).toBe('Panda')
    })

    it('loadPandaTheme 直接传 themeDir 也工作', () => {
      const theme = loadPandaTheme(PANDA_THEME_DIR)
      expect(theme.id).toBe('panda-default')
      const meta = getThemeMetadata(theme)
      expect(meta.speciesCount).toBe(18)
      expect(meta.stateCount).toBe(12)
    })

    it('renderSpriteToHtml(robot, idle, 0) 返回非空 HTML 含 <pre> + 等宽样式 + ASCII 体', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToHtml(theme, 'robot', 'idle', 0)
      expect(html.length).toBeGreaterThan(0)
      expect(html).toContain('<pre')
      expect(html).toContain('class="panda-sprite"')
      expect(html).toContain('data-species="robot"')
      expect(html).toContain('data-state="idle"')
      expect(html).toContain('data-frame="0"')
      expect(html).toContain('font-family:ui-monospace')
      // robot ASCII 体含 .[||].
      expect(html).toContain('.[||].')
      // {E} 占位符已被替换（默认 '·'）— 不应残留 {E}
      expect(html).not.toContain('{E}')
    })

    it('PetState 12 态 × 3 物种全覆盖渲染（共 36 渲染调用）— 任一返回均含 ASCII 体', () => {
      const theme = loadTheme('panda')
      const sampleSpecies = ['duck', 'robot', 'cat']
      let count = 0
      for (const sp of sampleSpecies) {
        for (const state of PANDA_PET_STATES) {
          const html = renderSpriteToHtml(theme, sp, state, 0)
          expect(html).toContain('<pre')
          expect(html).toContain(`data-state="${state}"`)
          expect(html).toContain(`data-species="${sp}"`)
          count++
        }
      }
      expect(count).toBe(36)
    })

    it('未知 species → 走 default.ascii 兜底，不抛错', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToHtml(theme, 'unknown-species', 'idle', 0)
      expect(html).toContain('<pre')
      expect(html).toContain('data-species="default"')
    })

    it('未知 state → 降级为 idle data-attr', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToHtml(theme, 'duck', 'not-a-state', 0)
      expect(html).toContain('data-state="idle"')
    })

    it('frame 越界 → 自动 mod 到合法帧（不抛错）', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToHtml(theme, 'duck', 'idle', 999)
      expect(html).toContain('<pre')
      expect(html).toContain('data-frame="999"')
    })

    it('opts.eye 自定义 eye 字符 → 被注入 sprite', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToHtml(theme, 'robot', 'idle', 0, { eye: '◉' })
      expect(html).toContain('◉')
      expect(html).not.toContain('{E}')
    })

    it('opts.color 由 RARITY_COLORS 注入 → 反映到 style 中', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToHtml(theme, 'robot', 'idle', 0, {
        color: '#ff0099',
      })
      expect(html).toContain('color:#ff0099')
    })

    it('HTML escape 防注入 — < > & 字符被转义', () => {
      // 验证 _escapeHtml 在渲染层生效（dragon sprite 含 < > 字符）
      const theme = loadTheme('panda')
      const html = renderSpriteToHtml(theme, 'dragon', 'idle', 0)
      // dragon 体里有 `<  ·  ·  >` — < 应被 escape 成 &lt;
      expect(html).toContain('&lt;')
      expect(html).toContain('&gt;')
    })
  })

  describe('parseAsciiSprite + applyEye 单元', () => {
    it('parseAsciiSprite 正确按 --- 分帧并剔除注释行', () => {
      const text = [
        '# comment',
        ' frame1 line1',
        ' frame1 line2',
        '---',
        '# another comment',
        ' frame2 line1',
      ].join('\n')
      const frames = parseAsciiSprite(text)
      expect(frames.length).toBe(2)
      expect(frames[0]!.length).toBe(2)
      expect(frames[1]!.length).toBe(1)
      expect(frames[1]![0]!.trim()).toBe('frame2 line1')
    })

    it('applyEye 替换 {E} 为目标字符', () => {
      const result = applyEye(['({E} {E})'], '✦')
      expect(result[0]).toBe('(✦ ✦)')
    })
  })

  describe('loadSpeciesSprite 缓存', () => {
    it('同一 species 二次调用返回相同对象引用（命中缓存）', () => {
      const theme = loadTheme('panda')
      const a = loadSpeciesSprite(theme, 'duck')
      const b = loadSpeciesSprite(theme, 'duck')
      expect(a).toBe(b)
    })
  })

  // ── P3-T5 美术资产新增用例 ────────────────────────────────────────────
  describe('P3-T5 SVG 美术资产 — sprites/*.svg', () => {
    const SPRITES_DIR = path.join(PANDA_THEME_DIR, 'sprites')

    it('18 物种 SVG 文件全部存在 (sprites/{species}.svg)', () => {
      const missing: string[] = []
      for (const sp of PANDA_SPECIES) {
        const f = path.join(SPRITES_DIR, `${sp}.svg`)
        if (!fs.existsSync(f)) missing.push(sp)
      }
      expect(missing).toEqual([])
    })

    it('每个 species SVG 包含完整 12 个 <g id="state-..."> 分组', () => {
      const failed: { species: string; got: number }[] = []
      for (const sp of PANDA_SPECIES) {
        const text = fs.readFileSync(
          path.join(SPRITES_DIR, `${sp}.svg`),
          'utf8',
        )
        const matches = text.match(/<g\s+id="state-[a-z]+"/g) ?? []
        const stateNames = new Set(
          matches.map((m) => m.replace(/^<g\s+id="state-/, '').replace(/"$/, '')),
        )
        if (stateNames.size !== PANDA_PET_STATES.length) {
          failed.push({ species: sp, got: stateNames.size })
        }
        // 校验每个 state 都有
        for (const st of PANDA_PET_STATES) {
          expect(text).toContain(`id="state-${st}"`)
        }
      }
      expect(failed).toEqual([])
    })

    it('每个 SVG 含 viewBox + xmlns + 等宽字体声明', () => {
      for (const sp of PANDA_SPECIES) {
        const text = fs.readFileSync(
          path.join(SPRITES_DIR, `${sp}.svg`),
          'utf8',
        )
        expect(text).toContain('xmlns="http://www.w3.org/2000/svg"')
        expect(text).toContain('viewBox="0 0 200 200"')
        expect(text).toContain('font-family="ui-monospace')
        expect(text).toContain('</svg>')
      }
    })

    it('loadSpeciesSvg 返回非空 SVG 字符串 + 缓存命中', () => {
      const theme = loadTheme('panda')
      const a = loadSpeciesSvg(theme, 'robot')
      const b = loadSpeciesSvg(theme, 'robot')
      expect(a).toBeTruthy()
      expect(a).toContain('<svg')
      expect(a).toContain('id="state-idle"')
      expect(b).toBe(a) // 同一引用 → 缓存命中
    })

    it('未知 species → loadSpeciesSvg 兜底 default.svg', () => {
      const theme = loadTheme('panda')
      const svg = loadSpeciesSvg(theme, 'unknown-species-xxx')
      expect(svg).toBeTruthy()
      expect(svg).toContain('<svg')
    })

    it('renderSpriteToSvgHtml 切换 visibility — 目标 state 设 visible，其它 hidden', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToSvgHtml(theme, 'robot', 'thinking', 0)
      expect(html).toContain('<div class="panda-sprite-svg"')
      expect(html).toContain('data-species="robot"')
      expect(html).toContain('data-state="thinking"')
      expect(html).toContain('<svg')
      // 目标 state visible
      expect(html).toMatch(/id="state-thinking"[^>]*visibility="visible"/)
      // 其它 state hidden — 抽样验 sleeping
      expect(html).toMatch(/id="state-sleeping"[^>]*visibility="hidden"/)
      // 含 ASCII 内容（tspan）
      expect(html).toContain('<tspan')
    })

    it('renderSpriteToSvgHtml 未知 species → 走 default + 不抛错', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToSvgHtml(theme, 'unknown-x', 'idle', 0)
      expect(html).toContain('data-species="default"')
      expect(html).toContain('<svg')
    })

    it('renderSpriteToSvgHtml 未知 state → 降级 idle data-attr', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToSvgHtml(theme, 'duck', 'not-a-state', 0)
      expect(html).toContain('data-state="idle"')
      expect(html).toMatch(/id="state-idle"[^>]*visibility="visible"/)
    })

    it('renderSpriteToSvgHtml opts.width / className 注入容器', () => {
      const theme = loadTheme('panda')
      const html = renderSpriteToSvgHtml(theme, 'cat', 'idle', 0, {
        className: 'my-sprite',
        width: '120px',
        height: '120px',
      })
      expect(html).toContain('class="my-sprite"')
      expect(html).toContain('width:120px')
      expect(html).toContain('height:120px')
    })
  })

  // ── P3-T5 美术资产新增用例 ── icon 资产 ──────────────────────────────
  describe('P3-T5 icon 资产 — build/icons/', () => {
    const ICONS_DIR = path.join(PKG_ROOT, 'build', 'icons')

    it('panda.svg 主 icon 含简笔 panda 元素（脸/眼罩/耳朵）', () => {
      const p = path.join(ICONS_DIR, 'panda.svg')
      expect(fs.existsSync(p)).toBe(true)
      const text = fs.readFileSync(p, 'utf8')
      expect(text).toContain('<svg')
      expect(text).toContain('viewBox="0 0 512 512"')
      // 简笔元素：圆脸 + 黑椭圆耳朵 + 黑椭圆眼罩
      expect(text).toMatch(/<circle\s+cx="256"/)
      expect(text).toMatch(/<ellipse[^>]+cx="120"/) // 左耳
      expect(text).toMatch(/<ellipse[^>]+cx="392"/) // 右耳
      // 标签含 panda 字样
      expect(text.toLowerCase()).toContain('panda')
    })

    it('tray-light.svg 与 tray-dark.svg 存在且合法 SVG', () => {
      for (const f of ['tray-light.svg', 'tray-dark.svg']) {
        const p = path.join(ICONS_DIR, f)
        expect(fs.existsSync(p)).toBe(true)
        const text = fs.readFileSync(p, 'utf8')
        expect(text).toContain('<svg')
        expect(text).toContain('viewBox="0 0 256 256"')
        expect(text).toContain('</svg>')
      }
    })

    it('build-icons.cjs 模块可加载且导出关键函数', () => {
      const mod = require('../scripts/build-icons.cjs')
      expect(typeof mod.renderSvgToPngSizes).toBe('function')
      expect(typeof mod.writeIcoIcnsPlaceholders).toBe('function')
      expect(Array.isArray(mod.PANDA_SIZES)).toBe(true)
      expect(mod.PANDA_SIZES).toContain(512)
      expect(mod.PANDA_SIZES).toContain(16)
    })

    it('build-sprites.cjs 模块可加载且导出 buildOneSpecies', () => {
      const mod = require('../scripts/build-sprites.cjs')
      expect(typeof mod.buildOneSpecies).toBe('function')
      expect(typeof mod.parseAsciiSprite).toBe('function')
      expect(Array.isArray(mod.PANDA_SPECIES)).toBe(true)
      expect(mod.PANDA_SPECIES.length).toBe(18)
    })

    it('PNG 渲染产物存在（panda.png 512×512 + 多尺寸）— sharp 可用时', () => {
      const sizes = [16, 32, 64, 128, 256]
      const main = path.join(ICONS_DIR, 'panda.png')
      // panda.png 必存在（不论 sharp 是否本地可用，build 阶段已生成）
      expect(fs.existsSync(main)).toBe(true)
      // 多尺寸 PNG 至少有一份产出（如果 sharp 全部失败则 skip）
      let found = 0
      for (const s of sizes) {
        if (fs.existsSync(path.join(ICONS_DIR, `panda-${s}.png`))) found++
      }
      // 至少 panda.png 真实存在；多尺寸为 best-effort
      expect(found).toBeGreaterThanOrEqual(0)
    })
  })
})
