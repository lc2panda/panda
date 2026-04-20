// Input:  bun test 触发
// Output: ≥ 6 用例 — 验证 W16-T3 settings 面板真读写 desk-prefs.json：
//         · settings.html 5 + 1 控件静态渲染（checkbox × 2 / select × 2 / time × 2 / range）
//         · preload/settings.ts 暴露 window.pandaSettings.{load, save}（W16-T3 短别名）
//         · prefs.ts loadDeskPrefs / saveDeskPrefs round-trip（临时 prefsPath 隔离）
//         · saveDeskPrefs species 白名单校验（非法物种 fallback default）
//         · saveDeskPrefs dnd 时段校验（非法时间字符串 fallback 22:00/08:00）
//         · main.ts 同时注册 settings:load / settings:save + 现有 panda:desk-prefs:get/save
//         · main.ts 保存 species 时分发 hitWin 'panda:species' typed channel（__pandaSetSpecies 联动）
//         · settings.html ESC 关闭 + link-repo 点击委派 api.closeWindow / openExternal
// Pos:    panda-on-desk W16-T3 settings 面板验收专项
//
// [NEW-FILE:#W16-02]
// 触发原因：W3-T1 + v2.25.21 已在 settings.html 真渲染 5 选项，但 preload API 只有 getDeskPrefs/saveDeskPrefs；
//   W16-T3 需新增 load/save 短别名（window.pandaSettings.{load,save} + settings:load/save IPC），
//   并保证保存 species 时 broadcast hitWin（panda:species），改 DND 时接入 dnd/state（复用现有 dispatchDnd）。
//   现有 prefs.test.ts / a11y.test.ts 均不覆盖这些新契约 — 语义正交，必须新文件。
// 证据：
//   1. Electron 41 contextBridge / ipcMain.handle — https://www.electronjs.org/docs/latest/api/ipc-main
//   2. WCAG 2.1.2 No keyboard trap（ESC 关闭对话框） — https://www.w3.org/TR/WCAG21/#no-keyboard-trap
//   3. Bun test runner — https://bun.sh/docs/cli/test
//
// 严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}
// 0 新依赖 — 仅用 node:fs / node:os / node:path / bun:test

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import * as path from 'node:path'

import {
  DEFAULT_DESK_PREFS,
  loadDeskPrefs,
  PANDA_SPECIES_WHITELIST,
  saveDeskPrefs,
  validateDeskPrefs,
} from '../src/prefs.js'

const PKG_ROOT = path.resolve(__dirname, '..')
const SETTINGS_HTML = path.join(PKG_ROOT, 'src', 'renderer', 'settings.html')
const PRELOAD_SETTINGS_TS = path.join(PKG_ROOT, 'src', 'preload', 'settings.ts')
const MAIN_TS = path.join(PKG_ROOT, 'src', 'main.ts')

let tmpDir: string
let tmpPrefsPath: string

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), 'panda-settings-panel-test-'))
  tmpPrefsPath = path.join(tmpDir, 'desk-prefs.json')
})

afterEach(() => {
  try { rmSync(tmpDir, { recursive: true, force: true }) } catch {}
})

describe('panda-on-desk · W16-T3 settings 面板真读写', () => {
  // ── 1. settings.html 5 + 1 控件静态渲染契约 ────────────────────────────────
  describe('settings.html 控件渲染', () => {
    test('5 + 1 控件全部存在（companionOnDesk / species / dndStart / dndEnd / volume / autoLaunch / language）', () => {
      const html = readFileSync(SETTINGS_HTML, 'utf8')
      // 1) companionOnDesk switch
      expect(html).toContain('id="sw-companionOnDesk"')
      expect(html).toContain('data-key="companionOnDesk"')
      expect(html).toContain('role="switch"')
      // 2) species select
      expect(html).toContain('id="sel-species"')
      // 3) DND 时段 — start + end 两个 time input
      expect(html).toContain('id="time-dndStart"')
      expect(html).toContain('id="time-dndEnd"')
      expect(html).toContain('type="time"')
      // 4) 通知音量 slider
      expect(html).toContain('id="rng-notificationVolume"')
      expect(html).toContain('type="range"')
      expect(html).toContain('min="0"')
      expect(html).toContain('max="100"')
      // 5) autoLaunch switch
      expect(html).toContain('id="sw-autoLaunch"')
      expect(html).toContain('data-key="autoLaunch"')
      // 6) language select（W5-T3）
      expect(html).toContain('id="sel-language"')
      // 7) display select（W22-T1 多屏）
      expect(html).toContain('id="sel-display"')
    })

    test('settings.html 精简到 < 700 行（上游 1259 行的 < 56%；W22-T1 加 Display 行后阈值上调）', () => {
      const html = readFileSync(SETTINGS_HTML, 'utf8')
      const lineCount = html.split('\n').length
      expect(lineCount).toBeLessThan(700)
    })

    test('ESC 键盘关闭委派 api.closeWindow（WCAG 2.1.2 无键盘陷阱）', () => {
      const html = readFileSync(SETTINGS_HTML, 'utf8')
      expect(html).toContain("e.key === 'Escape'")
      expect(html).toContain('api.closeWindow')
    })
  })

  // ── 2. preload 暴露 pandaSettings.{load, save}（W16-T3 新短别名） ──────────
  describe('preload/settings.ts 暴露 pandaSettings API', () => {
    test('contextBridge 暴露 load / save 短别名 + 走 settings:load / settings:save IPC', () => {
      const ts = readFileSync(PRELOAD_SETTINGS_TS, 'utf8')
      expect(ts).toContain("contextBridge.exposeInMainWorld('pandaSettings'")
      // W16-T3 短别名
      expect(ts).toContain('load:')
      expect(ts).toContain("ipcRenderer.invoke('settings:load')")
      expect(ts).toContain('save:')
      expect(ts).toContain("ipcRenderer.invoke('settings:save'")
      // 保留向后兼容的 getDeskPrefs / saveDeskPrefs
      expect(ts).toContain('getDeskPrefs')
      expect(ts).toContain('saveDeskPrefs')
      // closeWindow（ESC / 关闭按钮用）
      expect(ts).toContain('closeWindow')
    })
  })

  // ── 3. main.ts ipcMain.handle 注册 settings:load / settings:save ─────────
  describe('main.ts ipcMain.handle 注册', () => {
    test('main.ts 同时注册 settings:load / settings:save + 保留 panda:desk-prefs:* 通道', () => {
      const ts = readFileSync(MAIN_TS, 'utf8')
      // W16-T3 新通道
      expect(ts).toContain("ipcMain.handle('settings:load'")
      expect(ts).toContain("ipcMain.handle('settings:save'")
      // 原有通道保留（向后兼容）
      expect(ts).toContain("ipcMain.handle('panda:desk-prefs:get'")
      expect(ts).toContain("ipcMain.handle('panda:desk-prefs:save'")
    })

    test('save 路径 broadcast hitWin panda:species（物种变 → __pandaSetSpecies）', () => {
      const ts = readFileSync(MAIN_TS, 'utf8')
      // W16-T3：共享 _saveDeskPrefsWithSideEffects 函数
      expect(ts).toContain('_saveDeskPrefsWithSideEffects')
      // species broadcast 走 sendToHitWin('panda:species', ...)
      expect(ts).toMatch(/sendToHitWin\(['"]panda:species['"]/)
      // DND 接 dnd/state.ts — 现有 dispatcher 中 isDndActive / setDnd 等引用必须存在
      // （证明 settings DND 时段写入 desk-prefs 后能被 dnd/state 的 dispatchDnd / isInDnd 消费；
      //  dnd/schedule.ts 持有独立 dnd-schedule.json，saveDeskPrefs 的 dndStart/dndEnd
      //  走 prefs.ts 持久化，与 dnd/state.ts 的单一状态源并存，不会互相污染。）
      expect(ts).toMatch(/from ['"]\.\/dnd\/state['"]|require\(['"]\.\/dnd\/state['"]\)|dnd\/state/)
    })
  })

  // ── 4. prefs.ts loadDeskPrefs / saveDeskPrefs round-trip ─────────────────
  describe('prefs.ts load/save round-trip（临时 prefsPath 隔离）', () => {
    test('saveDeskPrefs + loadDeskPrefs 来回 — 5 选项完整回灌', () => {
      expect(existsSync(tmpPrefsPath)).toBe(false)
      const savedRes = saveDeskPrefs({
        companionOnDesk: false,
        species: 'duck',
        dndStart: '23:30',
        dndEnd: '07:15',
        notificationVolume: 85,
        autoLaunch: true,
      }, tmpPrefsPath)
      expect(savedRes.status).toBe('ok')
      if (savedRes.status === 'ok') {
        expect(savedRes.data.companionOnDesk).toBe(false)
        expect(savedRes.data.species).toBe('duck')
        expect(savedRes.data.dndStart).toBe('23:30')
        expect(savedRes.data.dndEnd).toBe('07:15')
        expect(savedRes.data.notificationVolume).toBe(85)
        expect(savedRes.data.autoLaunch).toBe(true)
      }
      // 文件存在 + 能再加载回来
      expect(existsSync(tmpPrefsPath)).toBe(true)
      const reload = loadDeskPrefs(tmpPrefsPath)
      expect(reload.companionOnDesk).toBe(false)
      expect(reload.species).toBe('duck')
      expect(reload.dndStart).toBe('23:30')
      expect(reload.dndEnd).toBe('07:15')
      expect(reload.notificationVolume).toBe(85)
      expect(reload.autoLaunch).toBe(true)
    })

    test('validateDeskPrefs — species 非法值 → fallback default；dndStart 非法 → fallback 22:00', () => {
      const bad = validateDeskPrefs({
        species: 'not-a-real-species',
        dndStart: '99:99',
        dndEnd: 'invalid',
        notificationVolume: 9999,
        companionOnDesk: 'yes-please', // 非 boolean
        autoLaunch: 1, // 非 boolean
      })
      expect(bad.species).toBe(DEFAULT_DESK_PREFS.species)
      expect(bad.dndStart).toBe(DEFAULT_DESK_PREFS.dndStart)
      expect(bad.dndEnd).toBe(DEFAULT_DESK_PREFS.dndEnd)
      expect(bad.notificationVolume).toBe(DEFAULT_DESK_PREFS.notificationVolume)
      expect(bad.companionOnDesk).toBe(DEFAULT_DESK_PREFS.companionOnDesk)
      expect(bad.autoLaunch).toBe(DEFAULT_DESK_PREFS.autoLaunch)
    })

    test('loadDeskPrefs — 文件不存在 / 损坏 JSON → fallback DEFAULT_DESK_PREFS（不抛）', () => {
      // 1) 文件不存在
      const missing = loadDeskPrefs(tmpPrefsPath)
      expect(missing).toEqual({ ...DEFAULT_DESK_PREFS })
      // 2) 损坏 JSON
      writeFileSync(tmpPrefsPath, '{ broken json ][[', 'utf8')
      const broken = loadDeskPrefs(tmpPrefsPath)
      expect(broken).toEqual({ ...DEFAULT_DESK_PREFS })
    })

    test('18 物种全部能经 saveDeskPrefs round-trip（verify PANDA_SPECIES_WHITELIST 1:1）', () => {
      expect(PANDA_SPECIES_WHITELIST.length).toBe(19) // default + 18 = 19
      for (const sp of PANDA_SPECIES_WHITELIST) {
        const res = saveDeskPrefs({ species: sp }, tmpPrefsPath)
        expect(res.status).toBe('ok')
        if (res.status === 'ok') {
          expect(res.data.species).toBe(sp)
        }
      }
    })
  })

  // ── 5. settings.html inline script 关键绑定契约 ────────────────────────────
  describe('settings.html persist/init 关键绑定', () => {
    test('persist() 优先用 api.save；回落 api.saveDeskPrefs（W16-T3 双轨兼容）', () => {
      const html = readFileSync(SETTINGS_HTML, 'utf8')
      expect(html).toContain('api.save')
      expect(html).toContain('api.saveDeskPrefs')
      // init() 加载阶段：优先 api.load；回落 api.getDeskPrefs
      expect(html).toContain('api.load')
      expect(html).toContain('api.getDeskPrefs')
    })

    test('5 控件事件绑定（click / change / input）— 均走 persist({key: value})', () => {
      const html = readFileSync(SETTINGS_HTML, 'utf8')
      // 1) switch: bindSwitch(id, key) → persist({[key]: next})
      expect(html).toContain("bindSwitch('sw-companionOnDesk', 'companionOnDesk')")
      expect(html).toContain("bindSwitch('sw-autoLaunch', 'autoLaunch')")
      // 2) select species: persist({species: sel.value})
      expect(html).toMatch(/persist\(\{\s*species:\s*sel\.value\s*\}\)/)
      // 3) time inputs: persist({dndStart, dndEnd}) with debounce
      expect(html).toContain('dndStart')
      expect(html).toContain('dndEnd')
      // 4) volume slider: persist({notificationVolume: Number(rng.value)})
      expect(html).toContain('notificationVolume')
      expect(html).toContain('rng.value')
    })
  })
})
