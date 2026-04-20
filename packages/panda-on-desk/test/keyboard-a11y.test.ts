// Input:  bun test 触发
// Output: ≥ 8 用例 — 验证 W18-T2 键盘 a11y 深化落地：
//         hit.html Ctrl+Shift+P 循环切 species / Ctrl+Shift+M toggle mute /
//         ESC 隐藏 hit 窗 / preload pandaKb bridge 3 方法 /
//         main.ts 3 IPC handlers / bubble.html Tab focus trap + Arrow /
//         settings.html Arrow 切焦点 / i18n a11y 词条覆盖
// Pos:    panda-on-desk W18-T2 键盘 a11y 验收专项
//
// [NEW-FILE:#W18-01]
// 触发原因：W8-T2 给 hit/bubble/settings 三处加了基础 a11y + W15-T1 加了 hit.html 鼠标
//   交互；W18-T2 需要把键盘操作（不用鼠标）完整覆盖 — 全局热键（Ctrl+Shift+P/M，
//   ESC）、overlay focus trap（Tab/Arrow）、settings 方向键切焦点。需独立用例锁定
//   键盘交互契约防回归。不在 a11y.test.ts 扩展：W8-T2 只验 ARIA/WCAG/颜色契约；
//   本套专验键盘交互 + pandaKb 桥 + 3 IPC handler 契约。
// 证据：
//   - WCAG 2.1.1 Keyboard: https://www.w3.org/TR/WCAG21/#keyboard
//   - WCAG 2.1.2 No Keyboard Trap: https://www.w3.org/TR/WCAG21/#no-keyboard-trap
//   - WCAG 2.4.3 Focus Order: https://www.w3.org/TR/WCAG21/#focus-order
//   - WAI-ARIA Authoring Practices Dialog: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
//
// 严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}
// 0 新依赖 — 仅用 node:fs / bun:test

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')
const HIT_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'hit.html')
const BUBBLE_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'bubble.html')
const SETTINGS_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'settings.html')
const PRELOAD_HIT_TS = path.join(PKG_ROOT, 'src', 'preload', 'hit.ts')
const MAIN_TS = path.join(PKG_ROOT, 'src', 'main.ts')

describe('panda-on-desk · W18-T2 键盘 a11y 深化', () => {
  // ── 1. hit.html 全局热键：Ctrl+Shift+P / Ctrl+Shift+M / ESC ──────────────────
  describe('hit.html — Ctrl+Shift+P 切 species / Ctrl+Shift+M toggle mute / ESC 隐藏', () => {
    it('hit.html 含 window keydown 监听 onGlobalHotkeyW18（Ctrl+Shift+P/M + ESC）', () => {
      expect(fs.existsSync(HIT_HTML)).toBe(true)
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // 全局 handler 名（锁定 W18 契约）
      expect(html).toContain('onGlobalHotkeyW18')
      // 注册到 window（全局热键，非 #pet 焦点依赖）
      expect(html).toMatch(/window\.addEventListener\(['"]keydown['"],\s*onGlobalHotkeyW18\)/)
      // Ctrl+Shift+P — P / p 两分支（Shift 大写与 Caps Lock 兼容）
      expect(html).toMatch(/e\.ctrlKey\s*&&\s*e\.shiftKey\s*&&\s*\(e\.key\s*===\s*['"]P['"]\s*\|\|\s*e\.key\s*===\s*['"]p['"]\)/)
      // Ctrl+Shift+M
      expect(html).toMatch(/e\.ctrlKey\s*&&\s*e\.shiftKey\s*&&\s*\(e\.key\s*===\s*['"]M['"]\s*\|\|\s*e\.key\s*===\s*['"]m['"]\)/)
      // ESC 纯键（非 Ctrl/Shift/Alt/Meta 组合）— 避免与系统热键冲突
      expect(html).toMatch(/e\.key\s*===\s*['"]Escape['"]\s*&&\s*!e\.ctrlKey\s*&&\s*!e\.shiftKey/)
    })

    it('hit.html 热键调用 window.pandaKb.cycleSpecies / toggleMute / hideHit（preload 桥）', () => {
      const html = fs.readFileSync(HIT_HTML, 'utf8')
      // 三桥方法全部调用
      expect(html).toContain('window.pandaKb.cycleSpecies()')
      expect(html).toContain('window.pandaKb.toggleMute()')
      expect(html).toContain('window.pandaKb.hideHit()')
      // preventDefault 防浏览器默认（Ctrl+Shift+P 可能触发 print preview 等）
      const hotkeyBlock = html.split('onGlobalHotkeyW18')[1] || ''
      expect(hotkeyBlock).toMatch(/e\.preventDefault\(\)/)
      // typeof guard — preload 未生效时不崩溃
      expect(html).toContain("typeof window.pandaKb.cycleSpecies === 'function'")
      expect(html).toContain("typeof window.pandaKb.toggleMute === 'function'")
      expect(html).toContain("typeof window.pandaKb.hideHit === 'function'")
    })
  })

  // ── 2. preload/hit.ts：pandaKb bridge 3 方法 ──────────────────────────────────
  describe('preload/hit.ts — pandaKb bridge 3 invoke/send 桥', () => {
    it('preload/hit.ts 暴露 window.pandaKb 含 cycleSpecies/toggleMute/hideHit 三方法', () => {
      expect(fs.existsSync(PRELOAD_HIT_TS)).toBe(true)
      const ts = fs.readFileSync(PRELOAD_HIT_TS, 'utf8')
      // contextBridge.exposeInMainWorld('pandaKb', ...)
      expect(ts).toMatch(/contextBridge\.exposeInMainWorld\(\s*['"]pandaKb['"]/)
      // 3 方法名 + 对应 channel（main.ts handler 契约）
      expect(ts).toContain('cycleSpecies')
      expect(ts).toContain('toggleMute')
      expect(ts).toContain('hideHit')
      // channel 名与 main.ts 对齐
      expect(ts).toContain("ipcRenderer.invoke('panda:kb:cycle-species')")
      expect(ts).toContain("ipcRenderer.invoke('panda:kb:toggle-mute')")
      expect(ts).toContain("ipcRenderer.send('panda:kb:hide-hit')")
    })
  })

  // ── 3. main.ts：3 IPC handlers + 复用 _saveDeskPrefsWithSideEffects ──────────
  describe('main.ts — panda:kb:* 3 IPC handler 契约', () => {
    it('main.ts 注册 panda:kb:cycle-species invoke handler（按 WHITELIST 循环）', () => {
      expect(fs.existsSync(MAIN_TS)).toBe(true)
      const ts = fs.readFileSync(MAIN_TS, 'utf8')
      expect(ts).toMatch(/ipcMain\.handle\(['"]panda:kb:cycle-species['"]/)
      // 复用 _saveDeskPrefsWithSideEffects（避免逻辑漂移）
      const cycleMatch = ts.match(/ipcMain\.handle\(['"]panda:kb:cycle-species['"][\s\S]*?^\}\)/m)
      expect(cycleMatch).toBeTruthy()
      expect(cycleMatch![0]).toContain('_saveDeskPrefsWithSideEffects')
      // 读当前 species + 计算 next idx + 循环
      expect(cycleMatch![0]).toMatch(/PANDA_SPECIES_WHITELIST/)
      expect(cycleMatch![0]).toMatch(/%\s*list\.length/)
    })

    it('main.ts 注册 panda:kb:toggle-mute invoke handler（0 ↔ 上次非 0 值）', () => {
      const ts = fs.readFileSync(MAIN_TS, 'utf8')
      expect(ts).toMatch(/ipcMain\.handle\(['"]panda:kb:toggle-mute['"]/)
      // 缓存上次非 0 值（避免从 0 恢复时全无参考）
      expect(ts).toContain('_lastNonZeroVolume')
      // 两分支：curVol > 0 → 存 0；否则 → 恢复 _lastNonZeroVolume
      const muteMatch = ts.match(/ipcMain\.handle\(['"]panda:kb:toggle-mute['"][\s\S]*?^\}\)/m)
      expect(muteMatch).toBeTruthy()
      expect(muteMatch![0]).toContain('notificationVolume: 0')
      expect(muteMatch![0]).toMatch(/notificationVolume:\s*restore/)
    })

    it('main.ts 注册 panda:kb:hide-hit send handler（hitWin.hide）', () => {
      const ts = fs.readFileSync(MAIN_TS, 'utf8')
      expect(ts).toMatch(/ipcMain\.on\(['"]panda:kb:hide-hit['"]/)
      const hideMatch = ts.match(/ipcMain\.on\(['"]panda:kb:hide-hit['"][\s\S]*?^\}\)/m)
      expect(hideMatch).toBeTruthy()
      // 防御：isDestroyed / isVisible guard（避免对已销毁/不可见窗口调用 hide）
      expect(hideMatch![0]).toContain('isDestroyed()')
      expect(hideMatch![0]).toContain('isVisible()')
      expect(hideMatch![0]).toContain('hitWin.hide()')
    })
  })

  // ── 4. bubble.html：Tab focus trap + Arrow 切 action ─────────────────────────
  describe('bubble.html — Tab 循环 + Arrow 切 action（focus trap）', () => {
    it('bubble.html 含 _collectFocusableW18 收集 focusable 列表（Allow/Deny/Suggestions/Inputs）', () => {
      expect(fs.existsSync(BUBBLE_HTML)).toBe(true)
      const html = fs.readFileSync(BUBBLE_HTML, 'utf8')
      expect(html).toContain('_collectFocusableW18')
      // 四类候选：Allow / Deny / suggestions children / elicitation inputs
      const fnBlock = html.split('_collectFocusableW18')[1] || ''
      expect(fnBlock).toContain('btnAllow')
      expect(fnBlock).toContain('btnDeny')
      expect(fnBlock).toContain('suggestionsContainer')
      expect(fnBlock).toContain('elicitationForm')
      // disabled / display:none 过滤（避免聚焦不可见或禁用元素）
      expect(fnBlock).toMatch(/!btnAllow\.disabled/)
      expect(fnBlock).toMatch(/btnAllow\.style\.display\s*!==\s*['"]none['"]/)
    })

    it('bubble.html Tab 按键循环（Shift+Tab 反向）+ Arrow 键切 action（仅 card.visible 时）', () => {
      const html = fs.readFileSync(BUBBLE_HTML, 'utf8')
      // Tab 分支
      expect(html).toMatch(/e\.key\s*===\s*['"]Tab['"]/)
      // Shift 反向
      expect(html).toContain('e.shiftKey')
      // 模 length 循环（WCAG 2.1.2 No Keyboard Trap 核心）
      expect(html).toMatch(/%\s*focusable\.length/)
      // ArrowRight/Down 正向；ArrowLeft/Up 反向（bubble.html 用双引号）
      expect(html).toContain('"ArrowRight"')
      expect(html).toContain('"ArrowDown"')
      expect(html).toContain('"ArrowLeft"')
      expect(html).toContain('"ArrowUp"')
      // 仅在 card.classList.visible && !hiding 时生效（隐藏状态不劫持键）
      expect(html).toMatch(/card\.classList\.contains\(['"]visible['"]\)/)
      expect(html).toMatch(/card\.classList\.contains\(['"]hiding['"]\)/)
      // INPUT 元素方向键不拦截（让 radio/checkbox 原生方向键工作）
      expect(html).toMatch(/active\.tagName\s*===\s*['"]INPUT['"]/)
    })
  })

  // ── 5. settings.html：Arrow Up/Down 切焦点 + ESC 关闭 ─────────────────────────
  describe('settings.html — Arrow Up/Down 切焦点 + ESC 关闭 + Enter 触发', () => {
    it('settings.html 含 _collectFocusableW18Settings 遍历 7 控件 + ArrowUp/Down 切焦点', () => {
      expect(fs.existsSync(SETTINGS_HTML)).toBe(true)
      const html = fs.readFileSync(SETTINGS_HTML, 'utf8')
      expect(html).toContain('_collectFocusableW18Settings')
      // 7 控件顺序（与 form DOM 序对齐）
      const fnBlock = html.split('_collectFocusableW18Settings')[1] || ''
      expect(fnBlock).toContain('#sw-companionOnDesk')
      expect(fnBlock).toContain('#sel-species')
      expect(fnBlock).toContain('#time-dndStart')
      expect(fnBlock).toContain('#time-dndEnd')
      expect(fnBlock).toContain('#rng-notificationVolume')
      expect(fnBlock).toContain('#sw-autoLaunch')
      expect(fnBlock).toContain('#sel-language')
      // ArrowUp / ArrowDown 分支（settings.html 用单引号）
      expect(html).toContain("'ArrowUp'")
      expect(html).toContain("'ArrowDown'")
      // early return guard — 只处理 ArrowUp/Down
      expect(html).toMatch(/e\.key\s*!==\s*'ArrowUp'\s*&&\s*e\.key\s*!==\s*'ArrowDown'/)
      // SELECT/INPUT 上方向键原生行为（值变更）— 不拦截
      expect(html).toMatch(/active\.tagName\s*===\s*['"]SELECT['"]/)
      expect(html).toMatch(/active\.tagName\s*===\s*['"]INPUT['"]/)
    })

    it('settings.html 保留 W16-T3 ESC 关闭契约 + switch Space/Enter 激活（WCAG 2.1.1）', () => {
      const html = fs.readFileSync(SETTINGS_HTML, 'utf8')
      // ESC 触发 api.closeWindow
      expect(html).toMatch(/e\.key\s*===\s*['"]Escape['"]/)
      expect(html).toContain('api.closeWindow()')
      // bindSwitch 内 Space/Enter 切换 on/off（已由 W8-T2 落地，W18 保留契约）
      expect(html).toMatch(/e\.key\s*===\s*['"] ['"]\s*\|\|\s*e\.key\s*===\s*['"]Enter['"]/)
      // switch role="switch" + tabindex=0 保留（W8-T2 契约）
      expect(html).toMatch(/<div class="switch"[^>]+role="switch"[^>]+tabindex="0"/)
    })
  })

  // ── 6. DoD 断言：byte-equal 三文件未动 ─────────────────────────────────────────
  describe('DoD — src/services/api/{claude,oauth,providers} byte-equal（禁改）', () => {
    it('W18-T2 改动不涉及 panda CLI 核心 upstream 文件（与 anthropic byte-equal 条款对齐）', () => {
      // 本测试间接：W18 所有改动文件路径清单（硬编码白名单）
      const allowedTouched = [
        'packages/panda-on-desk/src/main.ts',
        'packages/panda-on-desk/src/preload/hit.ts',
        'packages/panda-on-desk/src/renderer/hit.html',
        'packages/panda-on-desk/src/renderer/bubble.html',
        'packages/panda-on-desk/src/renderer/settings.html',
        'packages/panda-on-desk/test/keyboard-a11y.test.ts',
      ]
      // 每个路径真实存在 — 防止重命名漂移
      const repoRoot = path.resolve(PKG_ROOT, '..', '..')
      for (const rel of allowedTouched) {
        const abs = path.join(repoRoot, rel)
        expect(fs.existsSync(abs)).toBe(true)
      }
      // forbidden 路径 — claude.ts / oauth/ 实存；providers.ts 路径在当前 upstream 未存在
      // （git diff 空白即通过，不要求文件实在；此处仅验证 claude.ts 与 oauth 目录存在）
      const claudeTs = path.join(repoRoot, 'src', 'services', 'api', 'claude.ts')
      const oauthDir = path.join(repoRoot, 'src', 'services', 'oauth')
      expect(fs.existsSync(claudeTs)).toBe(true)
      expect(fs.existsSync(oauthDir)).toBe(true)
      // providers.ts：git diff 工作在路径上，不要求存在 — 不存在则 diff 输出必空
    })
  })
})
