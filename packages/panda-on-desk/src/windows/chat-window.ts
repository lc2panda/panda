// Input: main 进程调用 — createChatWindow / toggleChatWindow / getChatWindow / destroyChatWindow
// Output: chat BrowserWindow 实例（1200x800, contextIsolation, sandbox）
// Pos: panda-on-desk 第 5 类 BrowserWindow（pet / hit / settings / update-bubble / chat）
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { BrowserWindow, shell } from 'electron'
import * as path from 'node:path'
import * as fs from 'node:fs'

let chatWin: BrowserWindow | null = null

const IS_DEV = !!(process.env.ELECTRON_IS_DEV || process.env.NODE_ENV === 'development')

/**
 * 创建 chat BrowserWindow（单例 — 已存在则复用）。
 * 返回 BrowserWindow 实例。
 */
export function createChatWindow(): BrowserWindow {
  if (chatWin && !chatWin.isDestroyed()) {
    chatWin.show()
    chatWin.focus()
    return chatWin
  }

  chatWin = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: true,
    transparent: false,
    resizable: true,
    minimizable: true,
    maximizable: true,
    skipTaskbar: false,
    alwaysOnTop: false,
    title: 'Panda Chat',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'chat.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      allowRunningInsecureContent: false,
    },
  })

  // ready-to-show 后再显示，避免白屏闪烁
  chatWin.once('ready-to-show', () => {
    if (chatWin && !chatWin.isDestroyed()) {
      chatWin.show()
      chatWin.focus()
    }
  })

  // close 事件：隐藏而非销毁（保持会话状态）
  chatWin.on('close', (event) => {
    if (chatWin && !chatWin.isDestroyed()) {
      event.preventDefault()
      chatWin.hide()
    }
  })

  // 外部链接 → 系统默认浏览器
  chatWin.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url).catch(() => {})
    }
    return { action: 'deny' }
  })

  // 加载内容：开发模式 → Vite dev server；生产模式 → 打包 HTML
  if (IS_DEV) {
    chatWin.loadURL('http://localhost:5173').catch((err) => {
      console.warn('[chat-window] dev server load failed, falling back to file:', err?.message)
      _loadProductionHtml()
    })
  } else {
    _loadProductionHtml()
  }

  chatWin.on('closed', () => {
    chatWin = null
  })

  return chatWin
}

function _loadProductionHtml(): void {
  if (!chatWin || chatWin.isDestroyed()) return
  const candidates = [
    path.join(__dirname, '..', 'renderer', 'chat.html'),
    path.join(__dirname, '..', '..', 'renderer', 'chat.html'),
    path.join(__dirname, '..', '..', 'src', 'renderer', 'chat.html'),
  ]
  const htmlPath = candidates.find((p) => fs.existsSync(p))
  if (htmlPath) {
    chatWin.loadFile(htmlPath)
  } else {
    chatWin.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          '<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem">' +
            '<h1>Panda Chat</h1><p>chat.html not found. Build the renderer first.</p>' +
            '</body></html>'
        )
    )
  }
}

/**
 * 切换 chat 窗口显隐。不存在则创建。
 */
export function toggleChatWindow(): void {
  if (!chatWin || chatWin.isDestroyed()) {
    createChatWindow()
    return
  }
  if (chatWin.isVisible()) {
    chatWin.hide()
  } else {
    chatWin.show()
    chatWin.focus()
  }
}

/**
 * 获取当前 chat BrowserWindow 实例（可能为 null）。
 */
export function getChatWindow(): BrowserWindow | null {
  if (chatWin && !chatWin.isDestroyed()) return chatWin
  return null
}

/**
 * 销毁 chat 窗口（app quit 时调用）。
 */
export function destroyChatWindow(): void {
  if (chatWin && !chatWin.isDestroyed()) {
    // 移除 close preventDefault，允许真正销毁
    chatWin.removeAllListeners('close')
    chatWin.destroy()
  }
  chatWin = null
}
