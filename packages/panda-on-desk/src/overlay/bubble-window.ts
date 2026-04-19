// Input:  NotificationEvent（kind='overlay'，由 dispatcher 路由进入）
// Output: 独立 BrowserWindow 浮卡（透明 + frame:false + alwaysOnTop + focusable）
//         显示 title/body/actions[] + ttlMs 自动关闭 + 多 overlay 栈布局
// Pos:    panda-on-desk overlay 浮卡入口；P2-T3 实装（替换 P2-T1 占位）
//         hit 窗 / pet 窗之外的第 5 类 BrowserWindow（短生命周期）
//
// Forked from clawd-on-desk@4b07658:src/permission.js (MIT License) — 抽出
// showPermissionBubble 的 BrowserWindow 创建段，去掉 permission 专属逻辑、
// 改为通用 NotificationEvent 渲染。permission 特化逻辑落在 permission-bubble.ts。
//
// [NEW-FILE:#20260419-P2-11]
// 2026-04-19 +08:00 agent-γ-P2-overlay · P2-T3 实装

import path from 'node:path'

import type { NotificationEvent } from '../bridge/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 平台常量（与 main.ts / permission.js 对齐）
// ─────────────────────────────────────────────────────────────────────────────

const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
const isWin = process.platform === 'win32'
const WIN_TOPMOST_LEVEL = 'pop-up-menu' as const
const LINUX_WINDOW_TYPE = 'toolbar' as const

const DEFAULT_TTL_MS = 5000
const ERROR_TTL_MS = 10000
const BUBBLE_WIDTH = 340
const BUBBLE_DEFAULT_HEIGHT = 160
const STACK_GAP = 8
const STACK_MARGIN = 16

// ─────────────────────────────────────────────────────────────────────────────
// BrowserWindow 工厂（可注入 — 测试不依赖真 electron）
// ─────────────────────────────────────────────────────────────────────────────

/** electron BrowserWindow 最小子集 — 仅 overlay 实际用到的方法 */
export interface OverlayBrowserWindow {
  loadFile: (file: string) => void
  setBounds: (b: { x: number; y: number; width: number; height: number }) => void
  setAlwaysOnTop: (flag: boolean, level?: string) => void
  setIgnoreMouseEvents?: (ignore: boolean) => void
  show: () => void
  hide: () => void
  close: () => void
  isDestroyed: () => boolean
  on: (event: string, listener: (...args: unknown[]) => void) => void
  webContents: {
    send: (channel: string, ...args: unknown[]) => void
    on: (event: string, listener: (...args: unknown[]) => void) => void
    once: (event: string, listener: (...args: unknown[]) => void) => void
  }
}

/** BrowserWindow 构造选项（透传给 electron / mock） */
export interface OverlayWindowOptions {
  width: number
  height: number
  x: number
  y: number
  frame: false
  transparent: true
  alwaysOnTop: true
  focusable: boolean
  resizable: false
  skipTaskbar: true
  hasShadow: false
  show?: boolean
  type?: string
  webPreferences: {
    preload: string
    nodeIntegration: false
    contextIsolation: true
  }
}

export type OverlayBrowserWindowFactory = (opts: OverlayWindowOptions) => OverlayBrowserWindow

let bubbleWindowFactory: OverlayBrowserWindowFactory | null = null

/**
 * 注入 BrowserWindow 工厂。
 * 生产路径：main.ts 启动后调 `setBubbleWindowFactory((opts) => new BrowserWindow(opts))`。
 * 测试路径：用 mock 工厂避免拉起真窗。未注入时 showOverlayBubble 直接 noop（不抛错）。
 */
export function setBubbleWindowFactory(fn: OverlayBrowserWindowFactory | null): void {
  bubbleWindowFactory = fn
}

// ─────────────────────────────────────────────────────────────────────────────
// 工作区解析（main 注入；测试可 stub）
// ─────────────────────────────────────────────────────────────────────────────

interface WorkArea {
  x: number
  y: number
  width: number
  height: number
}

let getWorkAreaFn: () => WorkArea = () => ({ x: 0, y: 0, width: 1920, height: 1080 })

/** main.ts 注入 screen.getPrimaryDisplay().workArea；未注入则用 1920x1080 兜底（仅测试） */
export function setOverlayWorkAreaProvider(fn: () => WorkArea): void {
  getWorkAreaFn = fn
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部栈管理 — 最新的在最上（视觉上即 y 最小）
// ─────────────────────────────────────────────────────────────────────────────

interface OverlayEntry {
  id: string
  win: OverlayBrowserWindow
  event: NotificationEvent
  ttlTimer: ReturnType<typeof setTimeout> | null
  /** 创建时的浮卡高度（用于栈重排；实际 renderer 上报 height 后会更新） */
  height: number
  createdAt: number
}

const stack: OverlayEntry[] = []

let nextOverlayId = 1
function makeOverlayId(): string {
  // why: 不依赖 randomUUID（bun 测试环境兼容）；自增足够区分单进程内 overlay
  // eslint-disable-next-line no-plusplus
  return `overlay-${Date.now()}-${nextOverlayId++}`
}

function resolveTtlMs(event: NotificationEvent): number {
  if (typeof event.ttlMs === 'number' && event.ttlMs > 0) return event.ttlMs
  if (event.level === 'error') return ERROR_TTL_MS
  // critical 在协议层无独立 level；error 即最高（NotificationLevel: info/warning/error/success）
  return DEFAULT_TTL_MS
}

/**
 * 重排栈 — 最新（栈尾）紧贴右下角，向上堆叠 8px gap。
 * 调用时机：push / pop / 高度上报。
 */
function relayoutStack(): void {
  if (stack.length === 0) return
  const wa = getWorkAreaFn()
  const x = wa.x + wa.width - BUBBLE_WIDTH - STACK_MARGIN
  // 从栈尾（最新）开始，紧贴底部往上堆
  let yBottom = wa.y + wa.height - STACK_MARGIN
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const entry = stack[i]
    const y = yBottom - entry.height
    if (entry.win && !entry.win.isDestroyed()) {
      try {
        entry.win.setBounds({ x, y, width: BUBBLE_WIDTH, height: entry.height })
      } catch {
        // 窗口可能正在销毁；吞错保栈状态机健壮
      }
    }
    yBottom = y - STACK_GAP
  }
}

function dropEntry(id: string): void {
  const idx = stack.findIndex(e => e.id === id)
  if (idx === -1) return
  const [entry] = stack.splice(idx, 1)
  if (entry.ttlTimer) {
    clearTimeout(entry.ttlTimer)
    entry.ttlTimer = null
  }
  if (entry.win && !entry.win.isDestroyed()) {
    try {
      entry.win.close()
    } catch {
      // ignore — 窗口可能已被外部销毁
    }
  }
  relayoutStack()
}

function scheduleTtlClose(entry: OverlayEntry, ttlMs: number): void {
  entry.ttlTimer = setTimeout(() => {
    dropEntry(entry.id)
  }, ttlMs)
}

// ─────────────────────────────────────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────────────────────────────────────

/** 单个 overlay 的内部句柄（permission-bubble 复用时拿回 entry 注入按钮回调） */
export interface OverlayHandle {
  id: string
  win: OverlayBrowserWindow
  event: NotificationEvent
  /** 主动关闭（按钮点击后用于提前清掉 ttl） */
  close: () => void
}

/**
 * 创建一个 overlay 浮卡 + 推入栈 + 启 ttl 定时器。
 *
 * 工厂未注入时 → 静默 noop（main.ts 启动前 / 纯单测环境）。
 * 主用入口；permission-bubble 也复用此函数拿到 OverlayHandle 后追加按钮回调。
 */
export function showOverlayBubble(event: NotificationEvent): OverlayHandle | null {
  if (!bubbleWindowFactory) return null

  const id = makeOverlayId()
  const wa = getWorkAreaFn()
  // 临时位置（栈重排后会刷新）
  const initialX = wa.x + wa.width - BUBBLE_WIDTH - STACK_MARGIN
  const initialY = wa.y + wa.height - BUBBLE_DEFAULT_HEIGHT - STACK_MARGIN

  const opts: OverlayWindowOptions = {
    width: BUBBLE_WIDTH,
    height: BUBBLE_DEFAULT_HEIGHT,
    x: initialX,
    y: initialY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    // why: 通知卡片需可点击（按钮回调），focusable=true；permission 气泡同
    focusable: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false, // 防失焦闪烁；renderer ready 后再 show
    ...(isLinux ? { type: LINUX_WINDOW_TYPE } : {}),
    ...(isMac ? { type: 'panel' } : {}),
    webPreferences: {
      // why: 复用 P1-T7 已 fork 的 preload/bubble.js，与 bubble.html 的 window.bubbleAPI 对齐
      preload: path.join(__dirname, '..', 'preload', 'bubble.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  }

  const win = bubbleWindowFactory(opts)
  if (isWin && typeof win.setAlwaysOnTop === 'function') {
    try {
      win.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)
    } catch {
      // ignore — mock 窗口可能不实现 level 参数
    }
  }

  const entry: OverlayEntry = {
    id,
    win,
    event,
    ttlTimer: null,
    height: BUBBLE_DEFAULT_HEIGHT,
    createdAt: Date.now(),
  }
  stack.push(entry)

  // 加载 bubble.html + 推送 event payload；mock 工厂中 loadFile 是 noop
  try {
    win.loadFile(path.join(__dirname, '..', 'renderer', 'bubble.html'))
  } catch {
    // mock 或 renderer 文件缺失时不阻塞测试
  }

  // renderer ready 后推送 payload（mock 中不会触发 — 测试直接验栈状态即可）
  win.webContents.once('did-finish-load', () => {
    try {
      win.webContents.send('overlay:show', {
        id,
        title: event.title,
        body: event.body ?? '',
        level: event.level,
        scenarioId: event.scenarioId,
        actions: event.actions ?? [],
      })
      win.show()
    } catch {
      // 渲染端未就绪时容错
    }
  })

  // renderer 上报真实高度后回写栈
  win.webContents.on('overlay:height', (...args: unknown[]) => {
    const h = Number(args[0])
    if (Number.isFinite(h) && h > 0) {
      entry.height = h
      relayoutStack()
    }
  })

  // 窗口被外部 close 时同步出栈
  win.on('closed', () => {
    const idx = stack.findIndex(e => e.id === id)
    if (idx !== -1) {
      stack.splice(idx, 1)
      relayoutStack()
    }
  })

  // ttl 自动消失（critical 也用 ERROR_TTL_MS — 若需常驻另议）
  scheduleTtlClose(entry, resolveTtlMs(event))

  // 入栈后立即布局一次
  relayoutStack()

  return {
    id,
    win,
    event,
    close: () => dropEntry(id),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试辅助
// ─────────────────────────────────────────────────────────────────────────────

export function __getOverlayStackSizeForTesting(): number {
  return stack.length
}

export function __getOverlayStackForTesting(): ReadonlyArray<{ id: string; height: number }> {
  return stack.map(e => ({ id: e.id, height: e.height }))
}

export function __resetOverlayStackForTesting(): void {
  for (const entry of stack.slice()) {
    if (entry.ttlTimer) clearTimeout(entry.ttlTimer)
    if (entry.win && !entry.win.isDestroyed()) {
      try {
        entry.win.close()
      } catch {
        // ignore
      }
    }
  }
  stack.length = 0
  bubbleWindowFactory = null
  getWorkAreaFn = () => ({ x: 0, y: 0, width: 1920, height: 1080 })
}

/** 测试辅助 — 找到 entry（permission-bubble 测试需要） */
export function __findOverlayEntryForTesting(id: string):
  | { id: string; win: OverlayBrowserWindow; event: NotificationEvent }
  | undefined {
  const e = stack.find(x => x.id === id)
  if (!e) return undefined
  return { id: e.id, win: e.win, event: e.event }
}
