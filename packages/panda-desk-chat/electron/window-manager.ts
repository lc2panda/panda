// Input: Electron BrowserWindow creation requests, session-to-window mapping
// Output: Multi-window lifecycle management — create, track, route IPC by session
// Pos: Electron main process — central window registry replacing single mainWindow pattern
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { BrowserWindow, screen, app } from 'electron';
import { join, dirname } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// WindowManager — tracks multiple BrowserWindows & session routing
// ---------------------------------------------------------------------------

class WindowManager {
  private windows: Map<number, BrowserWindow> = new Map();
  private windowToSession: Map<number, string> = new Map(); // windowId → sessionId
  private windowKeyMap: Map<number, string> = new Map(); // windowId → persist key
  private windowCounter = 0;
  private stateFilePath: string | null = null;

  // ── Window state persistence ───────────────────────────────────────

  private getStateFilePath(): string {
    if (!this.stateFilePath) {
      this.stateFilePath = join(app.getPath('userData'), 'window-state.json');
    }
    return this.stateFilePath;
  }

  private readAllState(): Record<string, Electron.Rectangle> {
    try {
      const raw = readFileSync(this.getStateFilePath(), 'utf-8');
      return JSON.parse(raw) as Record<string, Electron.Rectangle>;
    } catch {
      return {};
    }
  }

  private writeAllState(state: Record<string, Electron.Rectangle>): void {
    try {
      const dir = dirname(this.getStateFilePath());
      mkdirSync(dir, { recursive: true });
      writeFileSync(this.getStateFilePath(), JSON.stringify(state, null, 2), 'utf-8');
    } catch {
      // Non-critical — silently ignore write failures
    }
  }

  private saveBounds(key: string, bounds: Electron.Rectangle): void {
    const state = this.readAllState();
    state[key] = bounds;
    this.writeAllState(state);
  }

  private loadBounds(key: string): Electron.Rectangle | undefined {
    const state = this.readAllState();
    const b = state[key];
    if (b && typeof b.x === 'number' && typeof b.y === 'number' &&
        typeof b.width === 'number' && typeof b.height === 'number') {
      return b;
    }
    return undefined;
  }

  // ── Window creation ────────────────────────────────────────────────

  createWindow(options?: {
    sessionId?: string;
    bounds?: Partial<Electron.Rectangle>;
    windowOptions?: Partial<Electron.BrowserWindowConstructorOptions>;
  }): BrowserWindow {
    const { width: screenW, height: screenH } =
      screen.getPrimaryDisplay().workAreaSize;
    const offset = this.windows.size * 30; // Cascade new windows

    // Assign a persist key: first window is 'main', subsequent are 'window-N'
    const persistKey = this.windowCounter === 0 ? 'main' : `window-${this.windowCounter}`;
    this.windowCounter++;

    // Restore persisted bounds if available (explicit bounds override persisted)
    const saved = this.loadBounds(persistKey);

    const win = new BrowserWindow({
      width: options?.bounds?.width ?? saved?.width ?? 1280,
      height: options?.bounds?.height ?? saved?.height ?? 820,
      x: options?.bounds?.x ?? saved?.x ?? Math.min(100 + offset, screenW - 1280),
      y: options?.bounds?.y ?? saved?.y ?? Math.min(100 + offset, screenH - 820),
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
    this.windowKeyMap.set(win.id, persistKey);

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

    // Notify renderer of its windowId + sessionId once content is ready
    win.webContents.on('did-finish-load', () => {
      if (!win.isDestroyed()) {
        win.webContents.send('panda:window:init', {
          windowId: win.id,
          sessionId: options?.sessionId ?? undefined,
        });
      }
    });

    // Persist window bounds before closing
    win.on('close', () => {
      if (!win.isDestroyed()) {
        const key = this.windowKeyMap.get(win.id);
        if (key) {
          this.saveBounds(key, win.getBounds());
        }
      }
    });

    win.on('closed', () => {
      this.windows.delete(win.id);
      this.windowToSession.delete(win.id);
      this.windowKeyMap.delete(win.id);
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
