// Input: bun test 触发；读取 build/screenshots/ 9 PNG + scripts/build-screenshots.cjs 模块
// Output: 验证 W6-T1 / W10-T2 程序化截图生成 — 9 PNG 就绪 + 文件尺寸合理 + 脚本可执行 + README 嵌入存在
//          + W10-T2 视觉升级特征（状态文字标注 / hero state strip / demo Lv 角标）
// Pos: panda-on-desk W6-T1 README 视觉化回归用例 + W10-T2 视觉升级回归
//
// [NEW-FILE:#W6-03]
// 触发原因：W6-T1 用 sharp 程序化生成 panda 桌面宠物截图（7 状态 + hero + demo），
//   嵌入主仓 README 与子包 README。需自动化用例锁定生成契约 + README 链接，防回归。
// W10-T2 升级：加 SVG 视觉特征断言（THINKING 文字标注 / 状态 accent / Lv banner）
// 不可在 art-quality.test.ts 扩展：那里只验 hit.html 源 + sprite SVG；本套验"截图工件 + 脚本契约"。
// 证据：
//   - sharp PNG 输出规范：https://sharp.pixelplumbing.com/api-output#png
//   - PNG 文件签名（8 byte magic）：https://www.w3.org/TR/PNG/#5PNG-file-signature
//   - bun test 文件系统断言：https://bun.sh/docs/cli/test

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')
const SCREENSHOTS_DIR = path.join(PKG_ROOT, 'build', 'screenshots')
const SCRIPT_PATH = path.join(PKG_ROOT, 'scripts', 'build-screenshots.cjs')
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..')
const REPO_README = path.join(REPO_ROOT, 'README.md')

// 7 状态截图 + hero + demo = 9 PNG
const STATES_7 = [
  'idle',
  'thinking',
  'working',
  'sleeping',
  'error',
  'attention',
  'notification',
] as const

const EXPECTED_FILES = [
  ...STATES_7.map((s) => `panda-200x200-${s}.png`),
  'panda-hero-1200x600.png',
  'panda-demo-600x400.png',
]

// PNG 文件签名（前 8 字节）
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe('panda-on-desk · W6-T1 截图工件 screenshots', () => {
  describe('build-screenshots.cjs 脚本契约', () => {
    it('脚本文件存在 + 可作为 CommonJS 模块加载', () => {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true)
      // 模块加载（不触发 main()，仅校验导出）
      const mod = require(SCRIPT_PATH)
      expect(mod).toBeDefined()
      expect(typeof mod.buildStateSvg).toBe('function')
      expect(typeof mod.buildHeroSvg).toBe('function')
      expect(typeof mod.buildDemoSvg).toBe('function')
      expect(typeof mod.renderSvgToPng).toBe('function')
      expect(Array.isArray(mod.STATES)).toBe(true)
      expect(mod.STATES.length).toBe(7)
      // 7 状态白名单一致
      for (const st of STATES_7) {
        expect(mod.STATES).toContain(st)
      }
    })

    it('buildStateSvg(state) 返回合法 SVG 字符串（含 <svg> + 200×200 + 状态标签）', () => {
      const mod = require(SCRIPT_PATH)
      for (const st of STATES_7) {
        const svg = mod.buildStateSvg(st)
        expect(typeof svg).toBe('string')
        expect(svg).toContain('<svg')
        expect(svg).toContain('width="200"')
        expect(svg).toContain('height="200"')
        // 状态标签 — 用于人工识别与脚本输出对齐
        expect(svg).toContain(st)
      }
    })

    it('buildHeroSvg() 返回 1200×600 SVG；buildDemoSvg() 返回 600×400 SVG', () => {
      const mod = require(SCRIPT_PATH)
      const hero = mod.buildHeroSvg()
      expect(hero).toContain('width="1200"')
      expect(hero).toContain('height="600"')
      expect(hero).toContain('panda-on-desk')
      const demo = mod.buildDemoSvg()
      expect(demo).toContain('width="600"')
      expect(demo).toContain('height="400"')
      // watermark
      expect(demo).toContain('github.com/lc2panda/panda-code')
    })

    // W10-T2 视觉升级专项：状态文字标注 + Lv banner + state strip
    it('W10-T2 视觉升级：每状态 SVG 含大写状态名标注（如 THINKING / WORKING）', () => {
      const mod = require(SCRIPT_PATH)
      // STATE_DECO 表导出的 display 字段必须出现在对应 SVG 中
      for (const st of STATES_7) {
        const svg = mod.buildStateSvg(st)
        const display = (mod.STATE_DECO[st] && mod.STATE_DECO[st].display) || st.toUpperCase()
        expect(svg).toContain(display)
      }
    })

    it('W10-T2 视觉升级：hero SVG 含 7 状态条带 + Lv banner + 双窗口', () => {
      const mod = require(SCRIPT_PATH)
      const hero = mod.buildHeroSvg()
      // 状态条带：所有 7 状态 display 名都出现
      for (const st of STATES_7) {
        const display = (mod.STATE_DECO[st] && mod.STATE_DECO[st].display) || st.toUpperCase()
        expect(hero).toContain(display)
      }
      // Lv 12 等级 banner（与终端文本同步）
      expect(hero).toContain('Lv 12')
      // 双窗口：终端 (zsh) + editor (auth.ts)
      expect(hero).toContain('zsh')
      expect(hero).toContain('auth.ts')
      // 桌面背景层（点阵 pattern）
      expect(hero).toContain('bgDots')
    })

    it('W10-T2 视觉升级：demo SVG 含 panda + 状态 badge (THINKING) + Lv 角标', () => {
      const mod = require(SCRIPT_PATH)
      const demo = mod.buildDemoSvg()
      // panda 形象 fragment（白头核心圆）
      expect(demo).toContain('cx="100" cy="105"')
      // 状态 badge 文字
      expect(demo).toContain('THINKING')
      // Lv 12 角标
      expect(demo).toContain('Lv 12')
    })
  })

  describe('9 PNG 工件就绪 + PNG 签名合法 + 尺寸合理', () => {
    it('build/screenshots/ 目录存在', () => {
      expect(fs.existsSync(SCREENSHOTS_DIR)).toBe(true)
      expect(fs.statSync(SCREENSHOTS_DIR).isDirectory()).toBe(true)
    })

    it('9 个 PNG 文件全部就绪 + PNG signature 合法', () => {
      const missing: string[] = []
      const badSig: string[] = []
      for (const name of EXPECTED_FILES) {
        const p = path.join(SCREENSHOTS_DIR, name)
        if (!fs.existsSync(p)) {
          missing.push(name)
          continue
        }
        const buf = fs.readFileSync(p)
        if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
          badSig.push(name)
        }
      }
      expect(missing).toEqual([])
      expect(badSig).toEqual([])
    })

    it('7 状态 PNG 单张 5–50 KB；hero ≤ 160 KB；demo ≤ 80 KB（避免空文件 / 仓库膨胀）', () => {
      const oversized: string[] = []
      const undersized: string[] = []
      // 7 状态 sprite — 严格 5–50 KB
      for (const st of STATES_7) {
        const p = path.join(SCREENSHOTS_DIR, `panda-200x200-${st}.png`)
        const sz = fs.statSync(p).size
        if (sz < 5 * 1024) undersized.push(`${st}: ${sz}B`)
        if (sz > 50 * 1024) oversized.push(`${st}: ${sz}B`)
      }
      // W10-T2 视觉升级后：hero 1200×600 含双窗口 / 状态条带 / 语法高亮，扩到 160 KB
      const heroPath = path.join(SCREENSHOTS_DIR, 'panda-hero-1200x600.png')
      const heroSz = fs.statSync(heroPath).size
      if (heroSz < 5 * 1024) undersized.push(`hero: ${heroSz}B`)
      if (heroSz > 160 * 1024) oversized.push(`hero: ${heroSz}B`)
      // demo 600×400 含 panda + Lv 角标 + state badge，扩到 80 KB
      const demoPath = path.join(SCREENSHOTS_DIR, 'panda-demo-600x400.png')
      const demoSz = fs.statSync(demoPath).size
      if (demoSz < 5 * 1024) undersized.push(`demo: ${demoSz}B`)
      if (demoSz > 80 * 1024) oversized.push(`demo: ${demoSz}B`)
      expect(undersized).toEqual([])
      expect(oversized).toEqual([])
    })
  })

  describe('README 嵌入 — 主仓 README 引用 hero / 状态网格', () => {
    it('主仓 README.md 引用 panda-hero-1200x600.png', () => {
      expect(fs.existsSync(REPO_README)).toBe(true)
      const md = fs.readFileSync(REPO_README, 'utf8')
      expect(md).toContain('packages/panda-on-desk/build/screenshots/panda-hero-1200x600.png')
    })

    it('主仓 README.md 引用 7 状态 PNG（至少 idle / thinking / working）', () => {
      const md = fs.readFileSync(REPO_README, 'utf8')
      expect(md).toContain('panda-200x200-idle.png')
      expect(md).toContain('panda-200x200-thinking.png')
      expect(md).toContain('panda-200x200-working.png')
    })
  })
})
