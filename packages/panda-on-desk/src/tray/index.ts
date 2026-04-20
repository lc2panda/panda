// Input: { app, nativeTheme } + ctx.{getWin, getHitWin, openSettingsWindow, togglePetVisibility, getDoNotDisturb, setDoNotDisturb, requestQuit}
// Output: 系统托盘 Tray 实例（Show / Hide / DND / Settings / About / Quit 6 项菜单 + 主题感知图标）
// Pos: panda-on-desk W3 收尾交付 — 真正的 panda 单 provider Tray（替代上游 menu.js 中走错路径的 createTray）
//
// [NEW-FILE:#20260419-W3-01]
// 触发原因：上游 menu.ts createTray 引用 ../assets/tray-icon.png（不存在）+ 走 multi-agent ctx；
//           panda 单 provider 需要独立、最小、6 项菜单的 panda-only Tray。
// 证据：
//   1. Electron Tray 官方 API — https://www.electronjs.org/docs/latest/api/tray (检索 2026-04-20 +08:00)
//   2. clawd-on-desk@4b07658:src/menu.js#createTray 上游参考（路径 + 模板图机制）
//   3. nativeTheme.shouldUseDarkColors — Electron 41 LTS 文档
// 最小化方案：单文件 ~140 行；零新依赖；失败容错（图标缺失静默降级）。
// 回滚：删除 tray/index.ts + main.ts 中 _initPandaTray() 调用 + import 即可。

import { app, Menu, Tray, nativeImage, nativeTheme, dialog, shell } from 'electron'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { createTranslator, type LangCode } from '../i18n.js'

const isMac = process.platform === 'darwin'

export type TrayCtx = {
  getWin: () => any
  getHitWin: () => any
  openSettingsWindow: () => void
  togglePetVisibility: () => void
  getDoNotDisturb: () => boolean
  setDoNotDisturb: (enabled: boolean) => void
  requestQuit: () => void
  appVersion?: string
  /** W5-T3 三语：getLang 回调由 main 注入；缺失则 fallback 'en' */
  getLang?: () => LangCode | string
}

export type TrayHandle = {
  tray: Tray | null
  rebuild: () => void
  destroy: () => void
}

/**
 * 解析托盘图标路径 — 优先 PNG（Electron 推荐），fallback SVG。
 * mac 走 template image（系统自适应黑/白）；非 mac 按 nativeTheme 选 light/dark。
 */
function resolveTrayIconPath(appDir: string, isPackaged: boolean): { iconPath: string | null; isTemplate: boolean } {
  // 解析 build/icons 真实位置：
  //   - 开发：__dirname = packages/panda-on-desk/src/tray → ../../build/icons
  //   - 打包：app.asar.unpacked / extraResources（electron-builder buildResources: build）
  const candidates = isPackaged
    ? [
        path.join(process.resourcesPath || '', 'build', 'icons'),
        path.join(appDir, 'build', 'icons'),
      ]
    : [
        path.join(appDir, 'build', 'icons'),
        path.join(__dirname, '..', '..', 'build', 'icons'),
      ]

  // 选 light/dark：mac 走 template（系统反色），其他平台按 nativeTheme.shouldUseDarkColors。
  // 注意：这里"dark icon for dark menu bar"在 Win/Linux 反直觉 —— dark menubar 需要 light icon。
  const isDarkMenubar = nativeTheme && typeof nativeTheme.shouldUseDarkColors === 'boolean'
    ? nativeTheme.shouldUseDarkColors
    : false
  const variant = isDarkMenubar ? 'tray-light' : 'tray-dark'

  for (const dir of candidates) {
    const png = path.join(dir, `${variant}.png`)
    if (fs.existsSync(png)) return { iconPath: png, isTemplate: isMac }
    const svg = path.join(dir, `${variant}.svg`)
    if (fs.existsSync(svg)) return { iconPath: svg, isTemplate: isMac }
  }
  return { iconPath: null, isTemplate: false }
}

function buildTrayMenuTemplate(ctx: TrayCtx): Electron.MenuItemConstructorOptions[] {
  const win = ctx.getWin()
  const isVisible = !!(win && !win.isDestroyed() && win.isVisible())
  const dnd = !!ctx.getDoNotDisturb()
  // W5-T3：动态语言 — 每次 buildMenu 都问 ctx.getLang()，运行时切换语言下次 rebuild 即生效
  const t = createTranslator(() => ctx.getLang?.() || 'en')

  return [
    {
      label: isVisible ? t('trayHidePanda') : t('trayShowPanda'),
      click: () => ctx.togglePetVisibility(),
    },
    { type: 'separator' },
    {
      label: t('trayDndMode'),
      type: 'checkbox',
      checked: dnd,
      click: (menuItem) => ctx.setDoNotDisturb(menuItem.checked),
    },
    { type: 'separator' },
    {
      label: t('traySettings'),
      click: () => ctx.openSettingsWindow(),
    },
    {
      label: t('trayAbout'),
      click: () => {
        const ver = ctx.appVersion || (() => {
          try { return app.getVersion() } catch { return '0.0.0' }
        })()
        dialog.showMessageBox({
          type: 'info',
          title: t('trayAboutTitle'),
          message: `panda-on-desk v${ver}`,
          detail: t('trayAboutDetail'),
          buttons: [t('trayAboutOk'), t('trayAboutOpenRepo')],
          defaultId: 0,
          cancelId: 0,
        }).then(res => {
          if (res.response === 1) {
            try { shell.openExternal('https://github.com/lc2panda/panda') } catch {}
          }
        }).catch(() => {})
      },
    },
    { type: 'separator' },
    {
      label: t('trayQuit'),
      click: () => ctx.requestQuit(),
    },
  ]
}

export function initPandaTray(ctx: TrayCtx): TrayHandle {
  let tray: Tray | null = null

  function rebuild(): void {
    if (!tray || tray.isDestroyed?.()) return
    try {
      tray.setContextMenu(Menu.buildFromTemplate(buildTrayMenuTemplate(ctx)))
    } catch (err) {
      console.warn('[panda-on-desk:tray] rebuild failed:', (err as Error)?.message)
    }
  }

  try {
    const { iconPath, isTemplate } = resolveTrayIconPath(
      path.join(__dirname, '..', '..'),
      app.isPackaged,
    )
    let image: Electron.NativeImage
    if (iconPath) {
      image = nativeImage.createFromPath(iconPath)
      if (!isMac && !image.isEmpty()) {
        // Win/Linux 标准托盘图标 ~16/22 px；按需缩放避免高分屏放大模糊
        try { image = image.resize({ width: 22, height: 22 }) } catch {}
      }
      if (isTemplate) image.setTemplateImage(true)
    } else {
      // fallback：空白 1x1 占位 — Electron 要求 nativeImage 必须可创建
      image = nativeImage.createEmpty()
      console.warn('[panda-on-desk:tray] tray icon not found, using empty fallback')
    }

    tray = new Tray(image)
    tray.setToolTip('panda-on-desk')
    rebuild()

    // 主题切换 → 重新加载图标
    try {
      nativeTheme.on('updated', () => {
        if (!tray || tray.isDestroyed?.()) return
        const next = resolveTrayIconPath(path.join(__dirname, '..', '..'), app.isPackaged)
        if (next.iconPath) {
          let img = nativeImage.createFromPath(next.iconPath)
          if (!isMac && !img.isEmpty()) {
            try { img = img.resize({ width: 22, height: 22 }) } catch {}
          }
          if (next.isTemplate) img.setTemplateImage(true)
          try { tray.setImage(img) } catch {}
        }
      })
    } catch {}

    // 左键单击：mac 默认弹菜单；win/linux 默认是显示菜单 + 触发 click，
    // 这里统一为"切换 panda 显隐"以便快速操作（菜单仍可右键访问）。
    tray.on('click', () => {
      if (!isMac) ctx.togglePetVisibility()
    })
  } catch (err) {
    console.warn('[panda-on-desk:tray] initPandaTray failed:', (err as Error)?.message)
    tray = null
  }

  return {
    get tray() { return tray },
    rebuild,
    destroy() {
      if (tray && !tray.isDestroyed?.()) {
        try { tray.destroy() } catch {}
      }
      tray = null
    },
  }
}
