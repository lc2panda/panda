// Input: bun test
// Output: 守护 W25-P0-MAC-BLACKBAR-TRAY 修复（Mac tray icon 256×256 未 resize → menu bar 黑色大圆）
// Pos: panda-on-desk W25-P0 回归用例 — 防 Mac 黑块第 7 次复发
//
// 触发背景（W24 W21 W20 W19 均失败后，指挥官贴截图显示 menu bar 中间黑色椭圆）：
//   resolveTrayIconPath 返回 256×256 的 tray-{dark,light}.png + isTemplate:isMac=true；
//   之前仅 !isMac 路径走 image.resize({22,22})，Mac 保留 256×256 + setTemplateImage(true)；
//   macOS template image 机制把所有非透明像素渲染为 menu bar 前景色 → 256×256 panda 剪影
//   被按 menu bar 高度压缩 → 显示一个巨大黑色圆形块占据 menu bar 中央。
//
// 修复：Mac 也 resize 到 22×22（Mac 标准 tray 尺寸，Retina 自动 @2x = 44×44）。

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')
const TRAY_TS = path.join(PKG_ROOT, 'src', 'tray', 'index.ts')
const TRAY_JS = path.join(PKG_ROOT, 'src', 'tray', 'index.js')

describe('panda-on-desk · W25-P0 Mac tray icon 黑块修复（resize 也对 Mac 生效）', () => {
  const ts = fs.readFileSync(TRAY_TS, 'utf8')
  const js = fs.readFileSync(TRAY_JS, 'utf8')

  it('tray/index.ts 初始化路径：resize 对 Mac 也生效（不再用 !isMac 门）', () => {
    // 提取 initPandaTray 里 createFromPath → resize 那块（创建路径，非主题切换路径）
    // 简化做法：整个文件搜索，确保没有 `if (!isMac && !image.isEmpty())` 的 resize gate
    const offendingPattern = /if\s*\(\s*!isMac\s*&&\s*!image\.isEmpty\(\)\s*\)/
    expect(ts).not.toMatch(offendingPattern)
  })

  it('tray/index.ts 主题切换路径：resize 对 Mac 也生效（不再用 !isMac 门）', () => {
    // 主题切换里用的是 `img`（小写），与初始化路径 `image` 不同
    const offendingPattern = /if\s*\(\s*!isMac\s*&&\s*!img\.isEmpty\(\)\s*\)/
    expect(ts).not.toMatch(offendingPattern)
  })

  it('tray/index.js（生产运行文件）：resize 对 Mac 也生效', () => {
    expect(js).not.toMatch(/if\s*\(\s*!isMac\s*&&\s*!image\.isEmpty\(\)\s*\)/)
    expect(js).not.toMatch(/if\s*\(\s*!isMac\s*&&\s*!img\.isEmpty\(\)\s*\)/)
  })

  it('tray/index.ts 含 W25-P0-MAC-BLACKBAR-TRAY 标记（防回归）', () => {
    expect(ts).toMatch(/W25-P0-MAC-BLACKBAR-TRAY/)
  })

  it('tray/index.js 含 W25-P0-MAC-BLACKBAR-TRAY 标记（生产文件同步）', () => {
    expect(js).toMatch(/W25-P0-MAC-BLACKBAR-TRAY/)
  })

  it('tray/index.ts 保留 setTemplateImage(true)（Mac 规范，仅 resize 后启用）', () => {
    // 验证 isTemplate 门依然存在，但 resize 不再被门控
    expect(ts).toMatch(/if\s*\(\s*isTemplate\s*\)\s*image\.setTemplateImage\(true\)/)
    expect(ts).toMatch(/if\s*\(\s*next\.isTemplate\s*\)\s*img\.setTemplateImage\(true\)/)
  })

  it('tray-light.png 存在且 ≥ 16×16（Mac 会 resize 到 22×22，需源图足够大）', () => {
    const p = path.join(PKG_ROOT, 'build', 'icons', 'tray-light.png')
    expect(fs.existsSync(p)).toBe(true)
    // PNG IHDR 从 offset 16 起，4 字节 big-endian width + 4 字节 height
    const buf = fs.readFileSync(p)
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    expect(width).toBeGreaterThanOrEqual(16)
    expect(height).toBeGreaterThanOrEqual(16)
  })

  it('tray-dark.png 存在且 ≥ 16×16', () => {
    const p = path.join(PKG_ROOT, 'build', 'icons', 'tray-dark.png')
    expect(fs.existsSync(p)).toBe(true)
    const buf = fs.readFileSync(p)
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    expect(width).toBeGreaterThanOrEqual(16)
    expect(height).toBeGreaterThanOrEqual(16)
  })
})
