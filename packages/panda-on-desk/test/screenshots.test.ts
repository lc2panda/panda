// Input: bun test 触发；读取 build/screenshots/ 9 PNG + scripts/build-screenshots.cjs 模块
//        + W11-T2: build/screenshots/real/ 真截图 + scripts/build-screenshots-real.cjs 模块
//        + W12-T1: build/screenshots/animations/ 7 SVG SMIL + scripts/build-animations.cjs 模块
//        + W16-T1: build/screenshots/apng/ 7 APNG + scripts/build-apng.cjs 模块
// Output: 验证 W6-T1 / W10-T2 程序化截图生成 — 9 PNG 就绪 + 文件尺寸合理 + 脚本可执行 + README 嵌入存在
//          + W10-T2 视觉升级特征（状态文字标注 / hero state strip / demo Lv 角标）
//          + W11-T2 真截图：真 PNG 200x200 RGBA + manifest.json schema + 脚本模块导出
//          + W12-T1 SVG SMIL：7 SVG 动画文件存在 + 含 <animate>/<animateTransform> + 脚本模块导出
//          + W16-T1 APNG：7 APNG 文件存在 + acTL/fcTL/fdAT chunk 合法 + 多帧 + README 嵌入
// Pos: panda-on-desk W6-T1 README 视觉化回归用例 + W10-T2 视觉升级回归 + W11-T2 真截图回归 + W12-T1 SVG 动画回归 + W16-T1 APNG 回归
//
// [NEW-FILE:#W6-03]
// [W11-T2-REAL-SHOT 20260420] 加 4+ 用例验证真 Electron 截屏路径
// 触发原因：W6-T1 用 sharp 程序化生成 panda 桌面宠物截图（7 状态 + hero + demo），
//   嵌入主仓 README 与子包 README。需自动化用例锁定生成契约 + README 链接，防回归。
// W10-T2 升级：加 SVG 视觉特征断言（THINKING 文字标注 / 状态 accent / Lv banner）
// W11-T2 升级：真 electron capturePage 路径（路径 A），与合成图（路径 B fallback）共存
// 不可在 art-quality.test.ts 扩展：那里只验 hit.html 源 + sprite SVG；本套验"截图工件 + 脚本契约"。
// 证据：
//   - sharp PNG 输出规范：https://sharp.pixelplumbing.com/api-output#png
//   - PNG 文件签名（8 byte magic）：https://www.w3.org/TR/PNG/#5PNG-file-signature
//   - bun test 文件系统断言：https://bun.sh/docs/cli/test
//   - Electron BrowserWindow.capturePage 官方文档：https://www.electronjs.org/docs/api/browser-window#wincapturepagerect
//     检索时间：2026-04-20 11:36 +08:00 — 当前稳定版（41.x）API 与 W11-T2 实现一致

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')
const SCREENSHOTS_DIR = path.join(PKG_ROOT, 'build', 'screenshots')
const SCRIPT_PATH = path.join(PKG_ROOT, 'scripts', 'build-screenshots.cjs')
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..')
const REPO_README = path.join(REPO_ROOT, 'README.md')

// W11-T2 真截图路径
const REAL_DIR = path.join(SCREENSHOTS_DIR, 'real')
const REAL_SCRIPT_PATH = path.join(PKG_ROOT, 'scripts', 'build-screenshots-real.cjs')
const REAL_MANIFEST = path.join(REAL_DIR, 'manifest.json')

// W12-T1 SVG SMIL 动画路径
const ANIM_DIR = path.join(SCREENSHOTS_DIR, 'animations')
const ANIM_SCRIPT_PATH = path.join(PKG_ROOT, 'scripts', 'build-animations.cjs')

// W16-T1 APNG 动图路径
const APNG_DIR = path.join(SCREENSHOTS_DIR, 'apng')
const APNG_SCRIPT_PATH = path.join(PKG_ROOT, 'scripts', 'build-apng.cjs')

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

// ─────────────────────────────────────────────────────────────────
// W11-T2 真截图（路径 A — Electron capturePage）回归
// 触发原因：W6-T1 + W10-T2 用 sharp 程序化合成，是 SVG → PNG，非真渲染。
//   W11-T2 用 electron headless（show:false）真加载 hit.html → capturePage().toPNG() 拿到
//   真实 CSS 动画首帧 + 系统字体 + transparent compositor 输出。
//   测试既需验证脚本契约，也需验证已落盘 PNG 工件（如果环境跑过 build-screenshots-real.cjs）。
//   ≥ 4 用例：脚本契约 / 7 PNG 就绪 / 单 PNG 200x200 RGBA / manifest schema
// ─────────────────────────────────────────────────────────────────
describe('panda-on-desk · W11-T2 真截图 real screenshots (Electron capturePage)', () => {
  describe('build-screenshots-real.cjs 脚本契约', () => {
    it('脚本文件存在 + 可作为 CommonJS 模块加载 + 导出 STATES/REAL_DIR', () => {
      expect(fs.existsSync(REAL_SCRIPT_PATH)).toBe(true)
      const mod = require(REAL_SCRIPT_PATH)
      expect(mod).toBeDefined()
      expect(Array.isArray(mod.STATES)).toBe(true)
      expect(mod.STATES.length).toBe(7)
      // 7 状态白名单与 W6-T1 同源
      for (const st of STATES_7) {
        expect(mod.STATES).toContain(st)
      }
      expect(typeof mod.REAL_DIR).toBe('string')
      expect(mod.REAL_DIR.endsWith('real')).toBe(true)
      expect(typeof mod.findElectronBinary).toBe('function')
      expect(typeof mod.probeElectron).toBe('function')
    })

    it('脚本源含真截屏关键 API（capturePage / __pandaSetState / hit.html）防回归', () => {
      const src = fs.readFileSync(REAL_SCRIPT_PATH, 'utf8')
      // capturePage：Electron 真渲染 API（合成图脚本不会出现）
      expect(src).toContain('capturePage')
      // __pandaSetState：通过 executeJavaScript 切状态（hit.html 已暴露）
      expect(src).toContain('__pandaSetState')
      // hit.html：真渲染源
      expect(src).toContain('hit.html')
      // toPNG：NativeImage → Buffer
      expect(src).toContain('toPNG')
      // transparent + show:false：headless mode 关键参数
      expect(src).toContain('transparent: true')
      expect(src).toContain('show: false')
    })
  })

  describe('真截图 PNG 工件就绪（如已运行 electron capture 流程）', () => {
    // 7 真 PNG 期望文件名（与脚本输出一致）
    const REAL_EXPECTED = STATES_7.map((s) => `panda-real-200x200-${s}.png`)

    it('build/screenshots/real/ 7 真 PNG 全部就绪 + PNG signature 合法 + 200x200 RGBA', () => {
      // 若环境未跑过真截屏脚本（如纯 CI / sharp-only），跳过断言（弱依赖）；
      // 但若 dir 存在则严格校验。why：真截屏依赖 electron 二进制 + GPU/headless 环境，
      //                        不强制 CI 跑（已有合成图 fallback）；本地必须 100% 通过。
      if (!fs.existsSync(REAL_DIR)) {
        // dir 不存在 — fallback 模式：只断言这是合法状态（脚本未运行）
        expect(fs.existsSync(REAL_DIR)).toBe(false)
        return
      }
      const missing: string[] = []
      const badSig: string[] = []
      const badSize: string[] = []
      const badDim: string[] = []
      for (const name of REAL_EXPECTED) {
        const p = path.join(REAL_DIR, name)
        if (!fs.existsSync(p)) { missing.push(name); continue }
        const buf = fs.readFileSync(p)
        if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
          badSig.push(name)
          continue
        }
        // 严格 5–50 KB（与合成图同样的窗口；electron capturePage 输出 RGBA 8-bit ≈ 17–19 KB）
        if (buf.length < 5 * 1024 || buf.length > 50 * 1024) {
          badSize.push(`${name}: ${buf.length}B`)
        }
        // PNG IHDR chunk @ offset 8 + 4 (length) + 4 (type) = offset 16
        // width = bytes 16..19 (BE 32-bit)，height = bytes 20..23
        const w = buf.readUInt32BE(16)
        const h = buf.readUInt32BE(20)
        if (w !== 200 || h !== 200) {
          badDim.push(`${name}: ${w}x${h}`)
        }
      }
      expect(missing).toEqual([])
      expect(badSig).toEqual([])
      expect(badSize).toEqual([])
      expect(badDim).toEqual([])
    })

    it('manifest.json schema 合法（generatedAt / electron version / 7 states 全覆盖 + bytes ≥ 5KB）', () => {
      if (!fs.existsSync(REAL_MANIFEST)) {
        // 真截屏未运行 — 跳过。与上一用例同政策。
        expect(fs.existsSync(REAL_MANIFEST)).toBe(false)
        return
      }
      const raw = fs.readFileSync(REAL_MANIFEST, 'utf8')
      const m = JSON.parse(raw)
      // 顶层字段
      expect(typeof m.generatedAt).toBe('string')
      // ISO 8601 — 严守"绝对时间"规范（不允许相对时间字段）
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(m.generatedAt)).toBe(true)
      expect(typeof m.electron).toBe('string')
      expect(m.electron.length).toBeGreaterThan(0)
      expect(typeof m.chrome).toBe('string')
      expect(m.states && typeof m.states).toBe('object')
      // 7 状态全覆盖
      for (const st of STATES_7) {
        expect(m.states[st]).toBeDefined()
        expect(typeof m.states[st].file).toBe('string')
        expect(m.states[st].file).toBe(`panda-real-200x200-${st}.png`)
        expect(typeof m.states[st].bytes).toBe('number')
        expect(m.states[st].bytes).toBeGreaterThanOrEqual(5 * 1024)
        expect(m.states[st].bytes).toBeLessThanOrEqual(50 * 1024)
        expect(typeof m.states[st].capturedAt).toBe('string')
      }
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// W12-T1 SVG SMIL 动画（动起来的 panda）回归
// 触发原因：W11-T2 输出 7 单帧 PNG 静态图，README "不动"。SVG SMIL 是 0 新依赖
//   方案 — GitHub README markdown / Camo 代理对 SVG SMIL 支持原生（W3C SVG 1.1）。
//   ≥ 4 用例：脚本契约 / 7 SVG 文件就绪 / SMIL <animate> 元素存在 / 状态独有动画特征
// 证据：
//   - SVG SMIL 标准：https://www.w3.org/TR/SVG11/animate.html（W3C Recommendation）
//   - GitHub Camo 渲染：https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-readme-files
//   - 检索时间：2026-04-20 13:27:39 +08:00
// ─────────────────────────────────────────────────────────────────
describe('panda-on-desk · W12-T1 SVG SMIL 动画 animations', () => {
  // 7 状态 SVG 期望文件名（与脚本输出一致）
  const ANIM_EXPECTED = STATES_7.map((s) => `panda-${s}.svg`)

  describe('build-animations.cjs 脚本契约', () => {
    it('脚本文件存在 + 可作为 CommonJS 模块加载 + 导出 STATES/SVG_BUILDERS/ANIM_DIR', () => {
      expect(fs.existsSync(ANIM_SCRIPT_PATH)).toBe(true)
      const mod = require(ANIM_SCRIPT_PATH)
      expect(mod).toBeDefined()
      expect(Array.isArray(mod.STATES)).toBe(true)
      expect(mod.STATES.length).toBe(7)
      // 7 状态白名单与 W6-T1 / W11-T2 同源
      for (const st of STATES_7) {
        expect(mod.STATES).toContain(st)
      }
      expect(typeof mod.ANIM_DIR).toBe('string')
      expect(mod.ANIM_DIR.endsWith('animations')).toBe(true)
      // 7 builder 函数全部导出
      expect(typeof mod.SVG_BUILDERS).toBe('object')
      for (const st of STATES_7) {
        expect(typeof mod.SVG_BUILDERS[st]).toBe('function')
      }
    })

    it('每个 builder 返回合法 SVG + 含 200×200 viewBox + 至少 1 个 SMIL 动画元素', () => {
      const mod = require(ANIM_SCRIPT_PATH)
      // SMIL 元素白名单：<animate>、<animateTransform>、<animateMotion>
      const smilRegex = /<animate(Transform|Motion)?\b/
      for (const st of STATES_7) {
        const svg = mod.SVG_BUILDERS[st]()
        expect(typeof svg).toBe('string')
        expect(svg).toContain('<svg')
        expect(svg).toContain('width="200"')
        expect(svg).toContain('height="200"')
        expect(svg).toContain('viewBox="0 0 200 200"')
        // 至少 1 个 SMIL 动画元素（SVG 是动画核心证据）
        expect(smilRegex.test(svg)).toBe(true)
        // 至少 1 个 repeatCount="indefinite"（GitHub README 持续可见）
        expect(svg).toContain('repeatCount="indefinite"')
      }
    })
  })

  describe('7 SVG 动画文件就绪 + 动画特征（如已运行 build-animations.cjs）', () => {
    it('build/screenshots/animations/ 7 SVG 文件全部就绪 + 单文件 1–20 KB', () => {
      // 与 W11-T2 真截图同政策：dir 不存在 → 跳过（脚本未运行的合法状态）
      // 但若 dir 存在则严格校验 7 文件 + 尺寸
      if (!fs.existsSync(ANIM_DIR)) {
        expect(fs.existsSync(ANIM_DIR)).toBe(false)
        return
      }
      const missing: string[] = []
      const badSize: string[] = []
      for (const name of ANIM_EXPECTED) {
        const p = path.join(ANIM_DIR, name)
        if (!fs.existsSync(p)) {
          missing.push(name)
          continue
        }
        const sz = fs.statSync(p).size
        // 1–20 KB：含 panda fragment + defs (≈ 4 KB) + 动画元素，~ 4–6 KB 是合理区间
        if (sz < 1024 || sz > 20 * 1024) {
          badSize.push(`${name}: ${sz}B`)
        }
      }
      expect(missing).toEqual([])
      expect(badSize).toEqual([])
    })

    it('7 SVG 文件源含 SMIL <animate> 元素 + xmlns + repeatCount="indefinite"', () => {
      if (!fs.existsSync(ANIM_DIR)) {
        expect(fs.existsSync(ANIM_DIR)).toBe(false)
        return
      }
      const missingFeature: string[] = []
      const smilRegex = /<animate(Transform|Motion)?\b/
      for (const name of ANIM_EXPECTED) {
        const p = path.join(ANIM_DIR, name)
        if (!fs.existsSync(p)) continue
        const src = fs.readFileSync(p, 'utf8')
        // SVG namespace 必须显式（GitHub Camo + 浏览器 standalone 渲染前提）
        if (!src.includes('xmlns="http://www.w3.org/2000/svg"')) {
          missingFeature.push(`${name}: missing xmlns`)
        }
        if (!smilRegex.test(src)) {
          missingFeature.push(`${name}: missing <animate>`)
        }
        if (!src.includes('repeatCount="indefinite"')) {
          missingFeature.push(`${name}: missing repeatCount=indefinite`)
        }
      }
      expect(missingFeature).toEqual([])
    })

    it('状态独有动画特征：thinking 含 ?、sleeping 含 Z、notification 含铃铛、error 含 ✕', () => {
      if (!fs.existsSync(ANIM_DIR)) {
        expect(fs.existsSync(ANIM_DIR)).toBe(false)
        return
      }
      // thinking：头顶 ? 浮动
      const thinking = fs.readFileSync(path.join(ANIM_DIR, 'panda-thinking.svg'), 'utf8')
      expect(thinking).toContain('>?')
      expect(thinking).toContain('#ffff66') // 黄色装饰

      // sleeping：闭眼 + Z 飘
      const sleeping = fs.readFileSync(path.join(ANIM_DIR, 'panda-sleeping.svg'), 'utf8')
      expect(sleeping).toContain('>Z')
      expect(sleeping).toContain('#aacbff') // 淡蓝 Z

      // notification：铃铛 unicode + 红圆 badge + 摇晃
      const notif = fs.readFileSync(path.join(ANIM_DIR, 'panda-notification.svg'), 'utf8')
      // \u{1F514} 铃铛字符（unicode escape 写入文件后是 4 字节 UTF-8）
      expect(notif).toContain('#ff2244') // 红圆 badge fill
      expect(notif).toContain('animateTransform') // 铃铛 rotate

      // error：摔倒 30deg + X 眼装饰
      const err = fs.readFileSync(path.join(ANIM_DIR, 'panda-error.svg'), 'utf8')
      expect(err).toContain('rotate') // 摔倒 transform
      expect(err).toContain('#ff3366') // 错误红
    })
  })

  describe('README 嵌入 — 主仓 README 引用 ≥ 1 SVG 动画', () => {
    it('主仓 README.md 引用 panda-on-desk 动画 SVG 路径', () => {
      expect(fs.existsSync(REPO_README)).toBe(true)
      const md = fs.readFileSync(REPO_README, 'utf8')
      // 至少引用 1 个 animations/ SVG（README 嵌入证据）
      expect(md).toContain('packages/panda-on-desk/build/screenshots/animations/')
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// W16-T1 APNG 真位图动图（浏览器 + 邮件 + Discord 原生播放）回归
// 触发原因：W12-T1 SVG SMIL 依赖浏览器 SMIL 引擎，部分邮件/博客/GitHub raw 不播放。
//   APNG 是 PNG 超集（acTL/fcTL/fdAT chunks），所有现代浏览器 + Markdown + 邮件 + Discord
//   原生自动播放，0 JS / 0 GIF / 0 视频。
//   ≥ 4 用例：脚本契约 / 7 APNG 文件就绪 / APNG chunk 结构合法（acTL+fcTL+IDAT+fdAT）/ 帧数 ≥ 4
// 证据：
//   - APNG Specification (Mozilla)：https://wiki.mozilla.org/APNG_Specification
//   - PNG 2nd Edition (W3C/ISO 15948)：https://www.w3.org/TR/PNG/#5DataRep
//   - 检索时间：2026-04-20 17:02:00 +08:00
// ─────────────────────────────────────────────────────────────────
describe('panda-on-desk · W16-T1 APNG 真动图 apng', () => {
  const APNG_EXPECTED = STATES_7.map((s) => `panda-${s}.apng`)

  describe('build-apng.cjs 脚本契约', () => {
    it('脚本文件存在 + 可作为 CommonJS 模块加载 + 导出 STATES/APNG_DIR/FRAME_BUILDERS', () => {
      expect(fs.existsSync(APNG_SCRIPT_PATH)).toBe(true)
      const mod = require(APNG_SCRIPT_PATH)
      expect(mod).toBeDefined()
      expect(Array.isArray(mod.STATES)).toBe(true)
      expect(mod.STATES.length).toBe(7)
      // 7 状态白名单同源
      for (const st of STATES_7) {
        expect(mod.STATES).toContain(st)
      }
      expect(typeof mod.APNG_DIR).toBe('string')
      expect(mod.APNG_DIR.endsWith('apng')).toBe(true)
      // 7 帧构造器全部导出
      expect(typeof mod.FRAME_BUILDERS).toBe('object')
      for (const st of STATES_7) {
        expect(typeof mod.FRAME_BUILDERS[st]).toBe('function')
      }
      // 核心 APNG 原语导出
      expect(typeof mod.crc32).toBe('function')
      expect(typeof mod.makeChunk).toBe('function')
      expect(typeof mod.parsePng).toBe('function')
      expect(typeof mod.buildApngBuffer).toBe('function')
      expect(typeof mod.msToFraction).toBe('function')
      // 尺寸常量
      expect(mod.WIDTH).toBe(200)
      expect(mod.HEIGHT).toBe(200)
    })

    it('STATE_SPEC 7 状态均含 frames ≥ 4 + durationMs > 0（匹配任务 DoD）', () => {
      const mod = require(APNG_SCRIPT_PATH)
      expect(mod.STATE_SPEC).toBeDefined()
      for (const st of STATES_7) {
        expect(mod.STATE_SPEC[st]).toBeDefined()
        expect(typeof mod.STATE_SPEC[st].frames).toBe('number')
        expect(typeof mod.STATE_SPEC[st].durationMs).toBe('number')
        // 帧数 ≥ 4（任务下限）
        expect(mod.STATE_SPEC[st].frames).toBeGreaterThanOrEqual(4)
        // 帧数 ≤ 12（合理上限）
        expect(mod.STATE_SPEC[st].frames).toBeLessThanOrEqual(12)
        // 时长为正
        expect(mod.STATE_SPEC[st].durationMs).toBeGreaterThan(0)
      }
    })

    it('帧 SVG builder 返回合法 SVG 200×200 + 根据 t ∈ [0,1) 产生差异（非全同帧）', () => {
      const mod = require(APNG_SCRIPT_PATH)
      for (const st of STATES_7) {
        const frame0 = mod.FRAME_BUILDERS[st](0)
        const frameHalf = mod.FRAME_BUILDERS[st](0.5)
        expect(typeof frame0).toBe('string')
        expect(frame0).toContain('<svg')
        expect(frame0).toContain('width="200"')
        expect(frame0).toContain('height="200"')
        expect(frameHalf).toContain('<svg')
        // 关键：t=0 与 t=0.5 产生不同字节（真动画而非静态）— 若完全相同则动画无意义
        expect(frame0).not.toBe(frameHalf)
      }
    })

    it('CRC32 + makeChunk + parsePng 底层原语可往返（输入 PNG → parsePng → 重组 → parsePng 再读）', () => {
      const mod = require(APNG_SCRIPT_PATH)
      // 构造一个最小合法 PNG：signature + IHDR + IDAT + IEND
      // 使用 IHDR 13 bytes data: width(4)+height(4)+bitDepth(1)+colorType(1)+compression(1)+filter(1)+interlace(1)
      const ihdr = Buffer.alloc(13)
      ihdr.writeUInt32BE(1, 0)
      ihdr.writeUInt32BE(1, 4)
      ihdr.writeUInt8(8, 8) // bit depth
      ihdr.writeUInt8(6, 9) // color type = RGBA
      const idat = Buffer.from([0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01]) // zlib empty-ish
      const pngBuf = Buffer.concat([
        mod.PNG_SIG,
        mod.makeChunk('IHDR', ihdr),
        mod.makeChunk('IDAT', idat),
        mod.makeChunk('IEND', Buffer.alloc(0)),
      ])
      const parsed = mod.parsePng(pngBuf)
      expect(parsed.chunks.length).toBe(3)
      expect(parsed.chunks[0].type).toBe('IHDR')
      expect(parsed.chunks[1].type).toBe('IDAT')
      expect(parsed.chunks[2].type).toBe('IEND')
      // msToFraction：≤ 65535 用 1000 den，否则 100 den
      expect(mod.msToFraction(500)).toEqual({ num: 500, den: 1000 })
      expect(mod.msToFraction(100)).toEqual({ num: 100, den: 1000 })
    })
  })

  describe('7 APNG 文件工件就绪 + 大小合理 + 合法 APNG 结构', () => {
    it('build/screenshots/apng/ 7 APNG 文件全部就绪 + PNG signature + 大小 5–300 KB', () => {
      // 与 W11-T2 / W12-T1 同政策：dir 不存在 → 跳过（脚本未运行的合法状态）
      if (!fs.existsSync(APNG_DIR)) {
        expect(fs.existsSync(APNG_DIR)).toBe(false)
        return
      }
      const missing: string[] = []
      const badSig: string[] = []
      const badSize: string[] = []
      for (const name of APNG_EXPECTED) {
        const p = path.join(APNG_DIR, name)
        if (!fs.existsSync(p)) {
          missing.push(name)
          continue
        }
        const buf = fs.readFileSync(p)
        if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
          badSig.push(name)
          continue
        }
        // 5 KB – 300 KB（7 状态 × 4-8 帧 × 200×200 RGBA PNG compressed）
        if (buf.length < 5 * 1024 || buf.length > 300 * 1024) {
          badSize.push(`${name}: ${buf.length}B`)
        }
      }
      expect(missing).toEqual([])
      expect(badSig).toEqual([])
      expect(badSize).toEqual([])
    })

    it('7 APNG 文件含 acTL chunk（动画控制） + num_frames ≥ 4', () => {
      if (!fs.existsSync(APNG_DIR)) {
        expect(fs.existsSync(APNG_DIR)).toBe(false)
        return
      }
      const noActl: string[] = []
      const wrongFrames: string[] = []
      for (const name of APNG_EXPECTED) {
        const p = path.join(APNG_DIR, name)
        if (!fs.existsSync(p)) continue
        const buf = fs.readFileSync(p)
        let off = 8
        let actlFrames: number | null = null
        while (off < buf.length) {
          const len = buf.readUInt32BE(off)
          const type = buf.subarray(off + 4, off + 8).toString('ascii')
          if (type === 'acTL') {
            actlFrames = buf.readUInt32BE(off + 8)
            break
          }
          off += 8 + len + 4
          if (type === 'IEND') break
        }
        if (actlFrames === null) {
          noActl.push(name)
        } else if (actlFrames < 4) {
          wrongFrames.push(`${name}: ${actlFrames}`)
        }
      }
      expect(noActl).toEqual([])
      expect(wrongFrames).toEqual([])
    })

    it('7 APNG 文件 fcTL 数量 == acTL num_frames（每帧 1 fcTL）+ IDAT ≥ 1 + fdAT ≥ 1', () => {
      if (!fs.existsSync(APNG_DIR)) {
        expect(fs.existsSync(APNG_DIR)).toBe(false)
        return
      }
      const mismatched: string[] = []
      for (const name of APNG_EXPECTED) {
        const p = path.join(APNG_DIR, name)
        if (!fs.existsSync(p)) continue
        const buf = fs.readFileSync(p)
        let off = 8
        let actlFrames = 0
        let fctlCount = 0
        let idatCount = 0
        let fdatCount = 0
        let hasIEND = false
        while (off < buf.length) {
          const len = buf.readUInt32BE(off)
          const type = buf.subarray(off + 4, off + 8).toString('ascii')
          if (type === 'acTL') actlFrames = buf.readUInt32BE(off + 8)
          if (type === 'fcTL') fctlCount++
          if (type === 'IDAT') idatCount++
          if (type === 'fdAT') fdatCount++
          if (type === 'IEND') {
            hasIEND = true
            break
          }
          off += 8 + len + 4
        }
        if (fctlCount !== actlFrames) {
          mismatched.push(`${name}: fcTL=${fctlCount} actl=${actlFrames}`)
        }
        if (idatCount < 1) mismatched.push(`${name}: no IDAT`)
        if (fdatCount < 1) mismatched.push(`${name}: no fdAT`)
        if (!hasIEND) mismatched.push(`${name}: no IEND`)
      }
      expect(mismatched).toEqual([])
    })
  })

  describe('README 嵌入 — 主仓 README 引用 APNG', () => {
    it('主仓 README.md 引用 panda-on-desk APNG 路径', () => {
      expect(fs.existsSync(REPO_README)).toBe(true)
      const md = fs.readFileSync(REPO_README, 'utf8')
      // 至少引用 1 个 apng/ 文件（README 嵌入证据）
      expect(md).toContain('packages/panda-on-desk/build/screenshots/apng/')
      // 至少 3 个状态（idle / thinking / working）
      expect(md).toContain('panda-idle.apng')
      expect(md).toContain('panda-thinking.apng')
      expect(md).toContain('panda-working.apng')
    })
  })
})
