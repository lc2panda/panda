// Input: Electron BrowserWindow creation requests, session-to-window mapping
// Output: Multi-window lifecycle management — create, track, route IPC by session
// Pos: Electron main process — central window registry replacing single mainWindow pattern
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { BrowserWindow, screen } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// WindowManager — tracks multiple BrowserWindows & session routing
// ---------------------------------------------------------------------------

class WindowManager {
  private windows: Map<number, BrowserWindow> = new Map();
  private windowToSession: Map<number, string> = new Map(); // windowId → sessionId

  // ── Window creation ────────────────────────────────────────────────

  createWindow(options?: {
    sessionId?: string;
    bounds?: Partial<Electron.Rectangle>;
    windowOptions?: Partial<Electron.BrowserWindowConstructorOptions>;
  }): BrowserWindow {
    const { width: screenW, height: screenH } =
      screen.getPrimaryDisplay().workAreaSize;
    const offset = this.windows.size * 30; // Cascade new windows

    const win = new BrowserWindow({
      width: options?.bounds?.width ?? 1280,
      height: options?.bounds?.height ?? 820,
      x: options?.bounds?.x ?? Math.min(100 + offset, screenW - 1280),
      y: options?.bounds?.y ?? Math.min(100 + offset, screenH - 820),
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        preload: join(__dirname, 'preload/chat.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
      ...options?.windowOptions,
    });

    this.windows.set(win.id, win);

    if (options?.sessionId) {
      this.windowToSession.set(win.id, options.sessionId);
    }

    // Load renderer — dev server or production build
    const devURL = process.env.VITE_DEV_SERVER_URL;
    const sessionParam = options?.sessionId
      ? `?session=${encodeURIComponent(options.sessionId)}`
      : '';

    if (devURL) {
      win.loadURL(`${devURL}${sessionParam}`);
    } else {
      // For file:// protocol, use hash params to pass session
      const htmlPath = join(__dirname, '../dist/index.html');
      if (options?.sessionId) {
        win.loadURL(`file://${htmlPath}?session=${encodeURIComponent(options.sessionId)}`);
      } else {
        win.loadFile(htmlPath);
      }
    }

    win.on('closed', () => {
      this.windows.delete(win.id);
      this.windowToSession.delete(win.id);
    });

    return win;
  }

  // ── Window queries ─────────────────────────────────────────────────

  getWindow(id: number): BrowserWindow | undefined {
    return this.windows.get(id);
  }

  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  getWindowForSession(sessionId: string): BrowserWindow | undefined {
    for (const [winId, sid] of this.windowToSession) {
      if (sid === sessionId) {
        const win = this.windows.get(winId);
        if (win && !win.isDestroyed()) return win;
      }
    }
    return undefined;
  }

  setWindowSession(windowId: number, sessionId: string): void {
    this.windowToSession.set(windowId, sessionId);
  }

  getFocusedWindow(): BrowserWindow | undefined {
    for (const win of this.windows.values()) {
      if (!win.isDestroyed() && win.isFocused()) return win;
    }
    return undefined;
  }

  /** Returns the focused window, or the first available window, or null. */
  getActiveWindow(): BrowserWindow | null {
    return this.getFocusedWindow() ?? this.getAllWindows()[0] ?? null;
  }

  // ── IPC routing ────────────────────────────────────────────────────

  /** Send to a specific window by id. */
  sendToWindow(windowId: number, channel: string, ...args: unknown[]): void {
    const win = this.windows.get(windowId);
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  }

  /** Broadcast to ALL windows. */
  broadcast(channel: string, ...args: unknown[]): void {
    for (const win of this.windows.values()) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, ...args);
      }
    }
  }

  /** Send to the window currently showing a specific session. */
  sendToSession(sessionId: string, channel: string, ...args: unknown[]): void {
    const win = this.getWindowForSession(sessionId);
    if (win) {
      win.webContents.send(channel, ...args);
    } else {
      // Fallback: broadcast to all windows (renderer filters by sessionId in payload)
      this.broadcast(channel, ...args);
    }
  }

  /** Returns true if any window is focused. */
  isAnyWindowFocused(): boolean {
    for (const win of this.windows.values()) {
      if (!win.isDestroyed() && win.isFocused()) return true;
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const windowManager = new WindowManager();
