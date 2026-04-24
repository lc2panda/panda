// Input: Electron app lifecycle events, CLI backend process management, WindowManager
// Output: Multi-window BrowserWindows with preload-injected pandaAPI
// Pos: Electron main process entry — creates windows via WindowManager, manages lifecycle
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { app, BrowserWindow, Menu, nativeImage, nativeTheme, session, shell, Tray } from 'electron';
import { join } from 'node:path';
import { registerIpcHandlers, setupMainWindow } from './ipc/handlers';
import { cliManager } from './backend/cli-manager';
import { appUpdater } from './updater';
import { windowManager } from './window-manager';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const isDev = !app.isPackaged;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Window management
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createMainWindow(): BrowserWindow {
  const win = windowManager.createWindow({
    windowOptions: {
      minWidth: 800,
      minHeight: 600,
      title: 'Panda Code',
      backgroundColor: '#0a0a0a',
      trafficLightPosition: { x: 16, y: 16 },
    },
  });

  // Dev tools in dev mode
  if (isDev && VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  // Open external links in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Minimize to tray on close instead of quitting (primary window only)
  win.on('close', (e) => {
    if (!isQuitting && win.id === mainWindow?.id) {
      e.preventDefault();
      win.hide();
    }
  });

  // Cleanup reference when window is destroyed
  win.on('closed', () => {
    mainWindow = null;
  });

  return win;
}

// ---------------------------------------------------------------------------
// System tray
// ---------------------------------------------------------------------------

/** 16x16 monochrome panda icon encoded as a PNG data-URL (template image). */
const TRAY_ICON_DATA_URL =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA' +
  'lElEQVQ4y2NgGAUMDAwMjEQq/s/AwMBMjAFMDFQCowYMOAP+' +
  'k2oAE6kGMJPbBMxkxgKaG8BMbhMwk2IAMzlpgJkUA5jJTQPM' +
  '5KYBMAMY/xMwgIXcJmAmtwmYyY0FZnJjgZncWGAmNxaYyY0F' +
  'ZnJjgZncWGAmNxaYyY0FZnJjgZncWGAmNxaYyY0FMIMxAACa' +
  'jBY1yEypzAAAAABJRU5ErkJggg==';

function createTray(): void {
  const icon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL);
  // Mark as template so macOS adapts to menubar light/dark mode
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('Panda Code');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        const win = mainWindow ?? windowManager.getActiveWindow();
        if (win && !win.isDestroyed()) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: 'New Chat',
      click: () => {
        const win = mainWindow ?? windowManager.getActiveWindow();
        if (win && !win.isDestroyed()) {
          win.show();
          win.focus();
          win.webContents.send('panda:new-chat');
        }
      },
    },
    {
      label: 'New Window',
      click: () => {
        const newWin = windowManager.createWindow();
        setupMainWindow(newWin);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Left-click on tray icon shows/focuses window
  tray.on('click', () => {
    const win = mainWindow ?? windowManager.getActiveWindow();
    if (win && !win.isDestroyed()) {
      win.show();
      win.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// Application menu (macOS standard Edit/View/Window + app menu)
// ---------------------------------------------------------------------------

const menuTemplate: Electron.MenuItemConstructorOptions[] = [
  {
    label: app.name,
    submenu: [
      { role: 'about' },
      {
        label: 'Check for Updates...',
        click: () => appUpdater.checkForUpdates(),
      },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    label: 'Window',
    submenu: [
      {
        label: 'New Window',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          const newWin = windowManager.createWindow();
          setupMainWindow(newWin);
        },
      },
      { type: 'separator' },
      { role: 'minimize' },
      { role: 'zoom' },
      { role: 'close' },
    ],
  },
];

const appMenu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(appMenu);

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  // Register IPC handlers before creating window
  registerIpcHandlers();

  // Session-level CSP header (sole CSP source — meta tag removed from index.html)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' http://127.0.0.1:1455 http://127.0.0.1:1456 http://127.0.0.1:1457 http://127.0.0.1:1458 http://127.0.0.1:1459 http://127.0.0.1:1460 ws://localhost:5173 http://localhost:5173; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
        ],
      },
    });
  });

  mainWindow = createMainWindow();
  setupMainWindow(mainWindow);

  // System tray (minimize-to-tray support)
  createTray();

  // Auto-updater
  appUpdater.init();
  if (app.isPackaged) {
    setTimeout(() => appUpdater.checkForUpdates(), 5000);
  }

  // Listen for system theme changes and notify renderer
  nativeTheme.on('updated', () => {
    const isDark = nativeTheme.shouldUseDarkColors;
    windowManager.broadcast('panda:theme:changed', isDark);
  });

  // macOS: re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    } else {
      // Show an existing window
      const win = mainWindow ?? windowManager.getActiveWindow();
      if (win && !win.isDestroyed()) {
        win.show();
        win.focus();
      }
    }
  });
});

// Cleanup CLI processes before quit
app.on('before-quit', () => {
  isQuitting = true;
  cliManager.destroyAll();
});

// Quit when all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event) => {
    event.preventDefault();
  });
});

// ---------------------------------------------------------------------------
// Export for IPC handlers to send events to renderer
// ---------------------------------------------------------------------------

export function getMainWindow(): BrowserWindow | null {
  return mainWindow ?? windowManager.getActiveWindow();
}

export { windowManager };
