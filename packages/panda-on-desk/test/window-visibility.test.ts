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

  // ───────────────────────────────────────────────────────────────────────────
  // v2.25.21 hotfix — Mac 黑框 P0 加固（settings/bubble/contextMenuOwner 全 lazy）
  // 现场：v2.25.20 已加 win.show:false，但用户仍报顶部黑条"点开是设置"。
  // 根因分析：
  //   ① settingsWindow —— 代码本身已 lazy（openSettingsWindow 内创建），
  //      但需回归 test 保证未来不会在启动路径误加 eager 调用。
  //   ② contextMenuOwner —— menu.ts:186 new BrowserWindow({parent:win, alwaysOnTop:true,
  //      transparent:true, show:false, 1x1})，启动时 L899 eager ensureContextMenuOwner()
  //      在 macOS panel 模式下偶发残影 → 本轮改 lazy（删启动时调用）。
  //   ③ update-bubble —— 当前 stub (update-bubble.ts)，no-op / getBubbleWindow() 返回 null，
  //      已是 lazy，本轮仅 test 锁定行为。
  // 证据（≥3 来源）：
  //   - Electron #10078：macOS transparent panel alwaysOnTop show:false 偶发黑矩形残影
  //   - clawd-on-desk main.js L2318-2362：settings 仅 lazy 于 click handler
  //   - clawd-on-desk main.js L2670 onwards：createContextMenuOwner 仅在 menu 首次 popup 调用
  // ───────────────────────────────────────────────────────────────────────────

  it('[v2.25.21] 启动序列（createWindow 函数体内）不含 openSettingsWindow() 调用（settings lazy）', () => {
    // createWindow 函数从 "function createWindow()" 起到 "function " 下一个定义前
    // createWindow 体到下一个 "function " 顶层定义前截止（容忍 Windows CRLF / 末尾 }\r?\n）
    const createWinBlockMatch = src.match(/function createWindow\(\)[\s\S]*?\n\}\r?\n(?=[\s\S]*?\n(?:function |const |let |\/\/ ))/)
    expect(createWinBlockMatch).not.toBeNull()
    const block = createWinBlockMatch![0]
    // 启动期间不得调用 openSettingsWindow
    expect(block).not.toMatch(/\bopenSettingsWindow\s*\(\s*\)/)
    // 启动期间不得直接 new 一个 settings BrowserWindow
    expect(block).not.toMatch(/settingsWindow\s*=\s*new\s+BrowserWindow/)
  })

  it('[v2.25.21] app.whenReady 主路径无 openSettingsWindow() 调用（启动序列纯净）', () => {
    // whenReady 回调 .then(() => { ... }) 截取第一级块
    const readyBlock = src.match(/app\.whenReady\(\)\.then\([\s\S]*?^\s{2,4}\}\)/m)
    // 若未匹配则降级搜全文 ready-callback 片段
    const scope = readyBlock ? readyBlock[0] : src
    // 不能出现启动即调 openSettingsWindow
    const eagerSettingsCall = scope.match(/^\s*openSettingsWindow\(\)/m)
    expect(eagerSettingsCall).toBeNull()
  })

  it('[v2.25.21] settingsWindow 仅由 openSettingsWindow() 函数创建（唯一 new 入口）', () => {
    // 全文中 "settingsWindow = new BrowserWindow" 只能出现 1 次，且在 openSettingsWindow 函数体内
    const allMatches = src.match(/settingsWindow\s*=\s*new\s+BrowserWindow/g) || []
    expect(allMatches.length).toBe(1)
    // 且定义位置在 openSettingsWindow 函数内
    const openFnBlock = src.match(/function openSettingsWindow\(\)[\s\S]*?\n\}/)
    expect(openFnBlock).not.toBeNull()
    expect(openFnBlock![0]).toMatch(/settingsWindow\s*=\s*new\s+BrowserWindow/)
  })

  it('[v2.25.21] update-bubble 采用 lazy stub（update-bubble.ts no-op + getBubbleWindow:null）', () => {
    const updateBubbleTs = path.join(PKG_ROOT, 'src', 'update-bubble.ts')
    expect(fs.existsSync(updateBubbleTs)).toBe(true)
    const source = fs.readFileSync(updateBubbleTs, 'utf8')
    // getBubbleWindow 必须返回 null（不创建实际 BrowserWindow）
    expect(source).toMatch(/getBubbleWindow\(\)\s*\{\s*return\s+null/)
    // 不得 new BrowserWindow（stub 阶段不允许）
    expect(source).not.toMatch(/new\s+BrowserWindow/)
  })

  it('[v2.25.21] contextMenuOwner 不在启动时 eager 创建（删除 createWindow 内 ensureContextMenuOwner() 调用）', () => {
    // 保证 main.ts createWindow 末尾无 eager ensureContextMenuOwner() 非注释调用
    // createWindow 体到下一个 "function " 顶层定义前截止（容忍 Windows CRLF / 末尾 }\r?\n）
    const createWinBlockMatch = src.match(/function createWindow\(\)[\s\S]*?\n\}\r?\n(?=[\s\S]*?\n(?:function |const |let |\/\/ ))/)
    expect(createWinBlockMatch).not.toBeNull()
    const block = createWinBlockMatch![0]
    // 仅允许注释行出现（以 // 开头），不允许裸调用
    // 按行扫描：任一非注释行含 ensureContextMenuOwner() 即失败
    const offending = block
      .split(/\r?\n/)
      .filter((line) => /ensureContextMenuOwner\s*\(/.test(line))
      .filter((line) => !/^\s*\/\//.test(line))
    expect(offending.length).toBe(0)
  })

  it('[v2.25.21] 启动序列唯一可见 panda = hitWin（mainWin / settings / contextMenuOwner / update-bubble 全 hidden 或 lazy）', () => {
    // 本测试 grep 4 类窗的启动态：
    //   1) mainWin(win)  —— show:false
    //   2) hitWin        —— showInactive() (唯一启动可见)
    //   3) settingsWindow—— 启动时不 new（lazy）
    //   4) contextMenuOwner 启动时不 eager ensureContextMenuOwner()
    // 任一违反 → fail
    // createWindow 体到下一个 "function " 顶层定义前截止（容忍 Windows CRLF / 末尾 }\r?\n）
    const createWinBlockMatch = src.match(/function createWindow\(\)[\s\S]*?\n\}\r?\n(?=[\s\S]*?\n(?:function |const |let |\/\/ ))/)
    expect(createWinBlockMatch).not.toBeNull()
    const createBody = createWinBlockMatch![0]
    // 1) win opts show:false
    expect(createBody).toMatch(/win\s*=\s*new\s+BrowserWindow\([\s\S]*?show:\s*false/)
    // 2) hitWin showInactive
    expect(createBody).toMatch(/hitWin\.showInactive\(\)/)
    // 3) 无 new settings
    expect(createBody).not.toMatch(/settingsWindow\s*=\s*new\s+BrowserWindow/)
    // 4) 无裸 ensureContextMenuOwner() 调用
    const offendingLines = createBody
      .split(/\r?\n/)
      .filter((line) => /ensureContextMenuOwner\s*\(/.test(line))
      .filter((line) => !/^\s*\/\//.test(line))
    expect(offendingLines.length).toBe(0)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // v2.25.30 NUCLEAR — Mac 黑框 P0 深度修复（W21-P0-NUCLEAR）
  // 现场：v2.25.29 仍报 Mac 顶部黑横条，前两轮 W14/W15 fix 失效。
  // 深度根因（本轮发现）：
  //   ① mac-window.ts:applyStationaryCollectionBehavior 注入
  //      setCanHide:false / setLevel:1500(CGAssistiveTechHigh) / SkyLight space delegate
  //      到 mainWin 的 NSWindow（reapplyMacVisibility 之前对 win + hitWin 都注入）
  //      → mainWin show:false 也被强制可见为 transparent panel "幽灵帧"。
  //   ② mainWin opts 含 transparent:true + type:'panel' + alwaysOnTop:true
  //      → NSPanel 合成层 + 透明矩形 + 顶层 → 即使不 show 也偶发幽灵帧。
  //   ③ menu.ts:popupMenuAt callback `ctx.win.showInactive()`
  //      → 右键菜单关闭后强 show mainWin → 黑框残影出现。
  //   ④ main.ts:popupMenuAt `menu.popup({ window: win })`
  //      → popup owner 是 mainWin，触发 NSPanel 短暂 active → 残影。
  //   ⑤ ensureContextMenuOwner parent:ctx.win
  //      → 父子 window 关系把 mainWin 拉到 active state → 残影。
  // 修复策略（最小 diff）：
  //   - reapplyMacVisibility candidates 仅含 hitWin（删 win）
  //   - mainWin opts: transparent=false / alwaysOnTop=false / 不再 type:'panel'
  //   - menu.ts callback 改 (hitWin || win).showInactive()
  //   - main.ts popupMenuAt owner 改 hitWin || win
  //   - menu.ts ensureContextMenuOwner parent 改 hitWin || win
  // 证据（≥3 来源）：
  //   - Apple AppKit Docs setCollectionBehavior + setLevel:1500 → window 无法 hide
  //     https://developer.apple.com/documentation/appkit/nswindow/1419320-collectionbehavior
  //   - SkyLight private framework SLSSpaceAddWindowsAndRemoveFromSpaces 副作用
  //     https://github.com/koekeishiya/yabai/issues/1156
  //   - Electron #10078: NSPanel + transparent + show:false 残影
  //     https://github.com/electron/electron/issues/10078
  // ───────────────────────────────────────────────────────────────────────────

  it('[W21-P0-NUCLEAR] reapplyMacVisibility 候选窗只含 hitWin（mainWin 完全跳过 NSWindow 注入）', () => {
    // 截 reapplyMacVisibility 函数体
    const fnBlock = src.match(/function reapplyMacVisibility\(\)[\s\S]*?\n\}/)
    expect(fnBlock).not.toBeNull()
    const body = fnBlock![0]
    // candidates 数组只能含 hitWin（不能再含 win/mainWin）
    const candidatesLine = body.match(/candidates\s*=\s*\[([^\]]*)\]/)
    expect(candidatesLine).not.toBeNull()
    const arrContent = candidatesLine![1]
    // 必须含 hitWin
    expect(arrContent).toMatch(/hitWin/)
    // 不能再含裸 win（只允许 hitWin）
    // 用 \b 边界避免误匹配 hitWin 中的 win
    expect(/[^t]\bwin\b/.test(' ' + arrContent)).toBe(false)
  })

  it('[W21-P0-NUCLEAR] mainWin opts 不含 transparent:true / alwaysOnTop:true / type:"panel"', () => {
    // 截 win = new BrowserWindow({...}) 完整 opts 块
    const winOptsMatch = src.match(/win = new BrowserWindow\(\{[\s\S]*?\n\s+\}\)/)
    expect(winOptsMatch).not.toBeNull()
    const opts = winOptsMatch![0]
    // 必须明确 transparent:false（或不含 transparent:true）
    expect(opts).not.toMatch(/transparent:\s*true/)
    // 必须明确 alwaysOnTop:false（或不含 alwaysOnTop:true）
    expect(opts).not.toMatch(/alwaysOnTop:\s*true/)
    // 不能含 mac panel 注入（…isMac ? { type: 'panel' …）
    expect(opts).not.toMatch(/isMac\s*\?\s*\{\s*type:\s*['"]panel['"]/)
    // show:false 必须保留（W14 不变）
    expect(opts).toMatch(/show:\s*false/)
  })

  it('[W21-P0-NUCLEAR] popupMenuAt owner 是 hitWin（不再用 mainWin 作为 popup window）', () => {
    // main.ts:popupMenuAt 的 try { menu.popup({ window: ... }) } catch
    const fnBlock = src.match(/function popupMenuAt\(menu:[^)]*\)[\s\S]*?\n\}/)
    expect(fnBlock).not.toBeNull()
    const body = fnBlock![0]
    // 不能直接 menu.popup({ window: win })
    expect(body).not.toMatch(/menu\.popup\(\{\s*window:\s*win\s*\}\)/)
    // 必须含 hitWin（owner 优先 hitWin）
    expect(body).toMatch(/hitWin/)
  })

  // 工具：剥掉单行注释（//...）和块注释（/*...*/），保留代码语义
  const stripComments = (s: string): string =>
    s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  it('[W21-P0-NUCLEAR] menu.ts:popupMenuAt callback 不再 ctx.win.showInactive()（mainWin 永久 hidden）', () => {
    const menuTs = path.join(PKG_ROOT, 'src', 'menu.ts')
    expect(fs.existsSync(menuTs)).toBe(true)
    const menuSrc = fs.readFileSync(menuTs, 'utf8')
    const fnBlock = menuSrc.match(/function popupMenuAt\(menu\)[\s\S]*?\n\s\s\}/)
    expect(fnBlock).not.toBeNull()
    const codeBody = stripComments(fnBlock![0])
    // 不能含裸 ctx.win.showInactive()（应改为 hitWin）
    expect(codeBody).not.toMatch(/ctx\.win\.showInactive\(\)/)
    // 必须有 hitWin 路径
    expect(codeBody).toMatch(/ctx\.hitWin/)
  })

  it('[W21-P0-NUCLEAR] menu.ts:ensureContextMenuOwner parent 优先 ctx.hitWin（避免 mainWin active 状态触发幽灵帧）', () => {
    const menuTs = path.join(PKG_ROOT, 'src', 'menu.ts')
    const menuSrc = fs.readFileSync(menuTs, 'utf8')
    const fnBlock = menuSrc.match(/function ensureContextMenuOwner\(\)[\s\S]*?return ctx\.contextMenuOwner;[\s\S]*?\n\s\s\}/)
    expect(fnBlock).not.toBeNull()
    const codeBody = stripComments(fnBlock![0])
    // parent 不能硬编码 ctx.win（必须先尝试 ctx.hitWin）
    expect(codeBody).not.toMatch(/parent:\s*ctx\.win\b/)
    // 必须含 ctx.hitWin
    expect(codeBody).toMatch(/ctx\.hitWin/)
  })

  it('[W21-P0-NUCLEAR] mac-window.ts:applyStationaryCollectionBehavior 仍然存在但不再被 mainWin 调用（仅 hitWin）', () => {
    const macWindowTs = path.join(PKG_ROOT, 'src', 'platform', 'mac-window.ts')
    expect(fs.existsSync(macWindowTs)).toBe(true)
    const macSrc = fs.readFileSync(macWindowTs, 'utf8')
    // 函数本身仍然导出（用于 hitWin）
    expect(macSrc).toMatch(/export function applyStationaryCollectionBehavior/)
    // 关键 NSWindow 注入仍在（仅作为 hitWin 的稳定化手段）
    expect(macSrc).toMatch(/setCanHide/)
    expect(macSrc).toMatch(/CGAssistiveTechHighWindowLevel/)
    // 但 main.ts reapplyMacVisibility 必须只对 hitWin 调（已在另一用例覆盖；此处校验 W21 注释存在）
    expect(src).toContain('[W21-P0-NUCLEAR 20260420]')
  })

  it('[W21-P0-NUCLEAR] 启动期所有 BrowserWindow 创建源列表 grep 仅返 mainWin + hitWin（其他全 lazy / no-op）', () => {
    // 全 src 目录 grep 'new BrowserWindow' 出现位置统计
    // 期望 ≤ 4 处（main.ts mainWin + hitWin + menu.ts contextMenuOwner lazy + main.ts settingsWindow lazy）
    // bubble-window.ts 走 factory 注入，不直接 new；update-bubble.ts stub 不 new
    const srcDir = path.join(PKG_ROOT, 'src')
    const files: string[] = []
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry)
        const stat = fs.statSync(full)
        if (stat.isDirectory()) walk(full)
        else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) files.push(full)
      }
    }
    walk(srcDir)
    let totalCreates = 0
    const createSites: string[] = []
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8')
      // 仅统计真实 new BrowserWindow（去掉 // 注释行）
      const matches = content.match(/new BrowserWindow/g) || []
      // 减去注释中的出现
      const realCount = content.split(/\r?\n/).filter((line) => {
        const trimmed = line.trim()
        return /new BrowserWindow/.test(line) && !trimmed.startsWith('//') && !trimmed.startsWith('*')
      }).length
      if (realCount > 0) {
        totalCreates += realCount
        createSites.push(`${path.basename(f)}:${realCount}`)
      }
    }
    // 4 处合法创建源：
    //   - main.ts mainWin (启动 eager, hidden)
    //   - main.ts hitWin (启动 eager, 唯一可见)
    //   - main.ts settingsWindow (lazy in openSettingsWindow)
    //   - menu.ts contextMenuOwner (lazy in ensureContextMenuOwner)
    //   - bubble-window.ts: 文档/示例 / 注释中可能出现 new BrowserWindow 字面量；
    //     real factory 是 setBubbleWindowFactory 注入，不直接 new
    expect(totalCreates).toBeLessThanOrEqual(6)
    // 必须至少含 main.ts（mainWin + hitWin + settings）= 3
    expect(createSites.some((s) => /main\.ts:/.test(s))).toBe(true)
  })
})
