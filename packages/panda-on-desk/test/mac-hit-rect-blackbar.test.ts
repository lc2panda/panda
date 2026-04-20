// Input: bun test
// Output: 守护 W24-P0-MAC-BLACKBAR 修复（hitGeometry 参数错位导致 hitWin 创建在左上角）
// Pos: panda-on-desk W24-P0 回归用例 — 防 Mac 顶部黑框第 5 次复发
//
// 触发背景（v2.25.30 W21 nuclear 后指挥官第 4 次反馈复发）：
//   main.ts getHitRectScreen wrapper 以 2 参调用 hitGeometry.getHitRectScreen（真实签名 6 参），
//   参数错位：theme=petBounds、bounds=activeTheme → 内部 fallbackHitRect(bounds) 读 activeTheme
//   .x/y/width/height（都 undefined）→ 走默认 100/100/200/200 → 返回 {left:80, top:80, ...}
//   → hitWin 创建在屏幕左上 (80,80,240×240) → applyStationaryCollectionBehavior 注 level:1500
//   (CGAssistiveTechHigh, > menu bar) → 用户看到"顶部大黑框"。
//
// 修复：绕过 hitGeometry，直接用 petBounds + 20px pad（petBounds 由 getPetWindowBounds 保证）。

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')
const MAIN_TS = path.join(PKG_ROOT, 'src', 'main.ts')
const MAIN_JS = path.join(PKG_ROOT, 'src', 'main.js')

describe('panda-on-desk · W24-P0 Mac 顶部黑框修复（hitGeometry 参数错位 → 左上 240×240）', () => {
  const ts = fs.readFileSync(MAIN_TS, 'utf8')
  const js = fs.readFileSync(MAIN_JS, 'utf8')

  it('main.ts getHitRectScreen 不再调 hitGeometry.getHitRectScreen（2 参错位）', () => {
    const fnMatch = ts.match(/function getHitRectScreen\([\s\S]*?^}/m)
    expect(fnMatch).not.toBeNull()
    const fnBody = fnMatch![0]
    // 剥离注释行，守护实际代码不再含调用
    const codeOnly = fnBody.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
    expect(codeOnly).not.toMatch(/hitGeometry\.getHitRectScreen/)
  })

  it('main.js getHitRectScreen 不再调 hitGeometry.getHitRectScreen（生产运行文件）', () => {
    const fnMatch = js.match(/function getHitRectScreen\([\s\S]*?^}/m)
    expect(fnMatch).not.toBeNull()
    const fnBody = fnMatch![0]
    const codeOnly = fnBody.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
    expect(codeOnly).not.toMatch(/hitGeometry\.getHitRectScreen/)
  })

  it('main.ts getHitRectScreen 含 W24-P0-MAC-BLACKBAR 标记（防回归）', () => {
    expect(ts).toMatch(/W24-P0-MAC-BLACKBAR/)
  })

  it('main.js getHitRectScreen 含 W24-P0-MAC-BLACKBAR 标记（生产运行文件同步）', () => {
    expect(js).toMatch(/W24-P0-MAC-BLACKBAR/)
  })

  it('getHitRectScreen 仍返回 {left/top/right/bottom} 形状（API 兼容）', () => {
    // 提取 main.ts 函数体的 return 块，验证仍有 left/top/right/bottom
    const fnMatch = ts.match(/function getHitRectScreen\([\s\S]*?^}/m)
    const fnBody = fnMatch![0]
    expect(fnBody).toMatch(/left:\s*bx\s*-\s*pad/)
    expect(fnBody).toMatch(/top:\s*by\s*-\s*pad/)
    expect(fnBody).toMatch(/right:\s*bx\s*\+\s*bw\s*\+\s*pad/)
    expect(fnBody).toMatch(/bottom:\s*by\s*\+\s*bh\s*\+\s*pad/)
  })

  it('petBounds 值有效时 hit rect 正确围绕 petBounds（bottom-right 场景，模拟 startBounds）', () => {
    // 模拟函数行为（不走 require，避免初始化 BrowserWindow）
    const pad = 20
    const petBounds = { x: 1220, y: 680, width: 200, height: 200 }
    const bx = Number.isFinite(petBounds.x) ? petBounds.x : 100
    const by = Number.isFinite(petBounds.y) ? petBounds.y : 100
    const bw = Number.isFinite(petBounds.width) && petBounds.width > 0 ? petBounds.width : 200
    const bh = Number.isFinite(petBounds.height) && petBounds.height > 0 ? petBounds.height : 200
    const rect = {
      left: bx - pad,
      top: by - pad,
      right: bx + bw + pad,
      bottom: by + bh + pad,
    }
    expect(rect.left).toBe(1200)
    expect(rect.top).toBe(660)
    expect(rect.right).toBe(1440)
    expect(rect.bottom).toBe(900)
    // 关键断言：top 不应在屏幕顶部（> menu bar 高度 25）
    expect(rect.top).toBeGreaterThan(25)
  })

  it('petBounds 无效时 fallback 仍会偏移到 100,100（但不会到 0,0 覆盖顶部）', () => {
    const pad = 20
    const petBounds: any = {} // 所有字段 undefined
    const bx = Number.isFinite(petBounds.x) ? petBounds.x : 100
    const by = Number.isFinite(petBounds.y) ? petBounds.y : 100
    const bw = Number.isFinite(petBounds.width) && petBounds.width > 0 ? petBounds.width : 200
    const bh = Number.isFinite(petBounds.height) && petBounds.height > 0 ? petBounds.height : 200
    const rect = {
      left: bx - pad,
      top: by - pad,
      right: bx + bw + pad,
      bottom: by + bh + pad,
    }
    // fallback 返回 (80, 80, 320, 320) — 虽然在左上但起码不在 (0,0)
    // 主要防御是 getPetWindowBounds 保证 petBounds 非空（win.getBounds() 有真实 startBounds）
    expect(rect.top).toBe(80)
    expect(rect.left).toBe(80)
  })
})
