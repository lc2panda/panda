// Input: bun test 触发
// Output: 验证 v2.25.20 W14-P0 窗口可见性架构 — mainWin 永久 hidden / hitWin 唯一可见 panda
// Pos: panda-on-desk W14-P0 hotfix 回归用例（防止 v2.24.3 双 panda 重蹈）
//
// [NEW-FILE:#W14-P0-01] 20260420
// 触发原因：v2.25.19 现场报告 mac 桌面同时出现 3 个问题：
//   ① 顶部黑色横条块（settings/bubble 启动时默认可见且渲染异常）
//   ② 左上 panda（mainWin 加载 hit.html 显示）
//   ③ 右下 panda（hitWin 加载 hit.html 显示）→ panda 重复 2 个
// 根因：v2.24.3 hotfix 误把 mainWin loadFile 改为 hit.html，又未加 show:false。
//   架构正解：mainWin = 隐藏逻辑容器 / hitWin = 透明可见 panda 主体。
// 不可在 pet-visible.test.ts 扩展：彼用例只验 hit.html DOM 结构，
//   与本用例的 BrowserWindow 配置语义正交。
// 证据（≥3 来源）：
//   - clawd-on-desk 上游 main.js L2411-2519：mainWin 创建后 showInactive，hitWin 同样
//     （但 mainWin loadFile index.html，非 hit.html — 视觉源不同，无重复）
//   - Electron BrowserWindow show 选项：https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions
//   - macOS panel-type transparent window 可见性：https://github.com/electron/electron/issues/10078

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')
const MAIN_TS = path.join(PKG_ROOT, 'src', 'main.ts')
const HIT_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'hit.html')

describe('panda-on-desk · W14-P0 窗口可见性 hotfix（防双 panda + 顶部黑条）', () => {
  const src = fs.readFileSync(MAIN_TS, 'utf8')

  it('mainWin (win) BrowserWindow opts 含 show: false（永久隐藏，避免双 panda）', () => {
    // 截取 win = new BrowserWindow({...}) 块（窗 ① pet 透明 overlay）
    const winOptsMatch = src.match(/win = new BrowserWindow\(\{[\s\S]*?\}\)/)
    expect(winOptsMatch).not.toBeNull()
    const winOpts = winOptsMatch![0]
    expect(winOpts).toMatch(/show:\s*false/)
  })

  it('settingsWindow opts 含 show: false（默认隐藏，防顶部黑条）', () => {
    // openSettingsWindow 内部 opts: any = { ... show: false ... }
    const settingsBlock = src.match(/function openSettingsWindow\(\)[\s\S]*?settingsWindow = new BrowserWindow\(opts\)/)
    expect(settingsBlock).not.toBeNull()
    expect(settingsBlock![0]).toMatch(/show:\s*false/)
  })

  it('mainWin 创建后无 win.showInactive() 调用（仅 hitWin 可见）', () => {
    // 创建 win 块（含 hit.html load）后到 hitWin 创建前不应有任何 win.showInactive()
    // 仅允许 win.showInactive 出现在 togglePetVisibility / second-instance / activate 已被 W14 重写
    const offendingPattern = /\n\s+win\.showInactive\(\)/g
    const matches = src.match(offendingPattern) || []
    // 期待 0 次（comment line 不算 — 注释里的 "win.showInactive()" 前面是 //）
    const realCallCount = matches.filter(m => !/\/\//.test(m)).length
    expect(realCallCount).toBe(0)
  })

  it('hitWin 创建后调 showInactive() —— 唯一可见 panda', () => {
    // hitWin = new BrowserWindow(...) 后必须有 hitWin.showInactive()
    const hitBlock = src.match(/hitWin = new BrowserWindow\(\{[\s\S]*?hitWin\.showInactive\(\)/)
    expect(hitBlock).not.toBeNull()
  })

  it('togglePetVisibility 不再依赖 win.isVisible() / win.show*()（已切换到 hitWin）', () => {
    const togBlock = src.match(/function togglePetVisibility\(\)[\s\S]*?\n\}/)
    expect(togBlock).not.toBeNull()
    const body = togBlock![0]
    expect(body).not.toMatch(/win\.showInactive\(\)/)
    expect(body).not.toMatch(/win\.isVisible\(\)/)
    // 必须用 hitWin 判定 + 切换
    expect(body).toMatch(/hitWin\.isVisible\(\)/)
    expect(body).toMatch(/hitWin\.showInactive\(\)/)
  })

  it('hit.html 仍含可见 panda SVG（hitWin 是唯一 panda 视觉源）', () => {
    expect(fs.existsSync(HIT_HTML)).toBe(true)
    const html = fs.readFileSync(HIT_HTML, 'utf8')
    expect(html).toContain('class="panda-face"')
    expect(html).toContain('<svg')
    expect(html).toContain('viewBox="0 0 200 200"')
  })

  it('second-instance / activate 处理器不再 win.showInactive (mainWin 永久 hidden)', () => {
    // second-instance handler
    const secondInstance = src.match(/app\.on\('second-instance'[\s\S]*?\}\)/)
    expect(secondInstance).not.toBeNull()
    expect(secondInstance![0]).not.toMatch(/win\.showInactive\(\)/)

    // activate handler
    const activate = src.match(/app\.on\('activate'[\s\S]*?\n\s\s\}\)/)
    expect(activate).not.toBeNull()
    expect(activate![0]).not.toMatch(/win\.showInactive\(\)/)
    // 必须改为 hitWin.showInactive 兜底
    expect(activate![0]).toMatch(/hitWin\.showInactive\(\)/)
  })

  it('W14-P0 标记注释存在（可追溯性）', () => {
    expect(src).toContain('[W14-P0-FIX 20260420]')
    // 至少 4 处（win opts / win 不 showInactive / togglePetVisibility / second-instance / activate / linux close）
    const tagCount = (src.match(/\[W14-P0-FIX 20260420\]/g) || []).length
    expect(tagCount).toBeGreaterThanOrEqual(4)
  })
})
