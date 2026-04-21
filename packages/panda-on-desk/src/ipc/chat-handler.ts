// Input: main 进程 app.whenReady() 后调用 registerChatIpcHandlers()
// Output: 24 个 chat IPC 通道的 stub handler（ipcMain.handle 注册）
// Pos: panda-on-desk chat IPC handler 层 — 连接 preload/chat.ts ↔ main 进程
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { ipcMain } from 'electron'
import { CHAT_IPC_CHANNELS, INVOKE_CHANNELS } from './chat-channels'

/**
 * 注册 24 个 chat IPC 通道的 stub handler。
 * 每个 handler 仅 console.log + return mock 数据，待后续 M1 阶段接入真实实现。
 *
 * 调用时机：app.whenReady() 内、createChatWindow() 之前。
 * 幂等：重复调用不会重复注册（Electron ipcMain.handle 同名重复会抛错，此处用 try/catch 兜底）。
 */
export function registerChatIpcHandlers(): void {
  const C = CHAT_IPC_CHANNELS

  // ── 16 个 invoke 通道（renderer → main 请求/响应） ──────────────────────────

  // Chat messaging
  _handle(C.CHAT_SEND, async (_event, payload) => {
    console.log('[chat-ipc] chat:send', typeof payload === 'object' ? JSON.stringify(payload).slice(0, 120) : payload)
    return { ok: true, messageId: `msg-stub-${Date.now()}` }
  })

  _handle(C.CHAT_STOP, async (_event, payload) => {
    console.log('[chat-ipc] chat:stop', payload)
    return { ok: true }
  })

  // Session management
  _handle(C.SESSION_LIST, async () => {
    console.log('[chat-ipc] session:list')
    return []
  })

  _handle(C.SESSION_CREATE, async (_event, payload) => {
    console.log('[chat-ipc] session:create', payload)
    return { id: `session-stub-${Date.now()}`, title: 'New Chat', createdAt: Date.now() }
  })

  _handle(C.SESSION_RENAME, async (_event, payload) => {
    console.log('[chat-ipc] session:rename', payload)
    return { ok: true }
  })

  _handle(C.SESSION_DELETE, async (_event, payload) => {
    console.log('[chat-ipc] session:delete', payload)
    return { ok: true }
  })

  _handle(C.SESSION_FOCUS, async (_event, payload) => {
    console.log('[chat-ipc] session:focus', payload)
    return { ok: true }
  })

  // Tool permissions
  _handle(C.TOOL_PERM_RESPONSE, async (_event, payload) => {
    console.log('[chat-ipc] tool:permission:response', payload)
    return { ok: true }
  })

  // File system
  _handle(C.FS_SEARCH, async (_event, payload) => {
    console.log('[chat-ipc] fs:search', payload)
    return { results: [] }
  })

  _handle(C.FS_LIST, async (_event, payload) => {
    console.log('[chat-ipc] fs:list', payload)
    return { entries: [] }
  })

  // Config & misc
  _handle(C.WINDOW_POSITION, async (_event, payload) => {
    console.log('[chat-ipc] window:position', payload)
    return { ok: true }
  })

  _handle(C.SLASH_COMMANDS, async () => {
    console.log('[chat-ipc] slash-commands')
    return []
  })

  _handle(C.MODEL_LIST, async () => {
    console.log('[chat-ipc] model:list')
    return [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', default: true },
    ]
  })

  _handle(C.MODEL_SET, async (_event, payload) => {
    console.log('[chat-ipc] model:set', payload)
    return { ok: true }
  })

  _handle(C.PERMISSION_MODE_SET, async (_event, payload) => {
    console.log('[chat-ipc] permission-mode:set', payload)
    return { ok: true }
  })

  _handle(C.CLIPBOARD_PASTE_IMG, async (_event, payload) => {
    console.log('[chat-ipc] clipboard:paste-image', typeof payload === 'object' ? '(binary data)' : payload)
    return { ok: true, url: null }
  })

  // ── 8 个 event 通道（main → renderer 推送） ─────────────────────────────────
  // 这些通道由 main 主动 webContents.send() 推送，无需在此注册 handler。
  // 列出以便审计完整性：
  //   CHAT_STREAM_START, CHAT_STREAM_DELTA, CHAT_STREAM_END,
  //   CHAT_WINDOW_TOGGLE, SESSION_UPDATED,
  //   TOOL_USE_START, TOOL_USE_END, TOOL_PERM_REQUEST

  console.log(`[chat-ipc] registered ${INVOKE_CHANNELS.length} chat IPC stub handlers`)
}

// ── Internal helper ────────────────────────────────────────────────────────

function _handle(channel: string, handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<any>): void {
  try {
    ipcMain.handle(channel, handler)
  } catch (err) {
    // 重复注册（幂等兜底 — Electron 同名 handle 二次注册会抛 Error）
    console.warn(`[chat-ipc] handler already registered for ${channel}:`, (err as Error)?.message)
  }
}
