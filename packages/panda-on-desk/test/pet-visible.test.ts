// Input: bun test 触发
// Output: 验证 panda 宠物显示 hotfix（hit.html SVG + CSS drag + getHitRectScreen null fallback）
// Pos: panda-on-desk Phase 3 hotfix 回归用例
//
// [NEW-FILE:#20260419-DESK-FIX-10]
// 触发原因：v2.24.1 现场报告：bun run start 撞 main.js:785 'Cannot read properties of null (reading left)'
//   且窗内未渲染 panda、不可拖动。修复后必须有自动化用例覆盖以防回归。
// 不可在现有测试中扩展：smoke.test.ts 只验 fork 标注与文件存在；与本用例语义正交。
// 证据：
//   - Electron transparent window drag region: https://www.electronjs.org/docs/latest/api/frameless-window#draggable-region
//   - SVG inline embed best practice: https://developer.mozilla.org/en-US/docs/Web/SVG
//   - 现场报告：报告档 monitor/20260419-desk-pet-visible.md

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { getHitRectScreen } from '../src/geometry/hit-geometry'

const PKG_ROOT = path.resolve(__dirname, '..')
const HIT_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'hit.html')

describe('panda-on-desk · pet 显示 + 拖拽 hotfix', () => {
  it('hit.html 含 .panda-face SVG + 4 个黑色 ellipse（耳/眼罩）', () => {
    expect(fs.existsSync(HIT_HTML)).toBe(true)
    const html = fs.readFileSync(HIT_HTML, 'utf8')

    // 含简笔 panda SVG
    expect(html).toContain('class="panda-face"')
    expect(html).toContain('<svg')
    expect(html).toContain('viewBox="0 0 200 200"')

    // 至少 4 个深色 ellipse —— 两耳 + 两眼罩
    // [W1-T2-ART 20260419] 升级后改用 linearGradient 填充（fill="url(#gradEar)" / url(#gradMask)），
    // 故同时计数 url(#grad*) 与旧 #1a1a1a 兜底；语义不变。
    const blackEllipseCount = (html.match(/<ellipse[^>]*fill="(?:#1a1a1a|url\(#grad(?:Ear|Mask)\))"/g) || []).length
    expect(blackEllipseCount).toBeGreaterThanOrEqual(4)

    // 不再依赖未编译的外部 renderer 脚本（<script src=... 形式）
    expect(html).not.toMatch(/<script\s+src=/i)
  })

  it('hit.html 含 -webkit-app-region: drag CSS（Electron 标准拖拽）', () => {
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    expect(html).toContain('-webkit-app-region: drag')
    // body 与 #pet 都应声明 drag 区
    const dragCount = (html.match(/-webkit-app-region:\s*drag/g) || []).length
    expect(dragCount).toBeGreaterThanOrEqual(2)
  })

  it('getHitRectScreen 在 null/缺参时返非 null fallback（防 main.js:785 撞空指针）', () => {
    // 全 null —— 保底默认矩形
    const rNull = getHitRectScreen(null, null, null, '', null) as any
    expect(rNull).not.toBeNull()
    expect(Number.isFinite(rNull.left)).toBe(true)
    expect(rNull.right - rNull.left).toBeGreaterThan(0)
    expect(rNull.bottom - rNull.top).toBeGreaterThan(0)

    // 仅 bounds 有值 —— 应基于 bounds 外扩
    const bounds = { x: 500, y: 300, width: 240, height: 240 }
    const rBounds = getHitRectScreen(null, bounds, null, '', null) as any
    expect(rBounds).not.toBeNull()
    expect(rBounds.left).toBeLessThanOrEqual(bounds.x)
    expect(rBounds.top).toBeLessThanOrEqual(bounds.y)
    expect(rBounds.right).toBeGreaterThanOrEqual(bounds.x + bounds.width)
    expect(rBounds.bottom).toBeGreaterThanOrEqual(bounds.y + bounds.height)

    // theme 提供但 hitBox 缺失 —— 仍然返非 null（fallback 路径）
    const themeStub = { viewBox: { x: 0, y: 0, width: 200, height: 200 } } as any
    const rNoHit = getHitRectScreen(themeStub, bounds, null, 'idle.svg', null) as any
    expect(rNoHit).not.toBeNull()
    expect(Number.isFinite(rNoHit.left)).toBe(true)
  })
})
