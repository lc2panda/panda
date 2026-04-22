// Input: Electron app lifecycle events, CLI backend process management
// Output: BrowserWindow with preload-injected pandaAPI
// Pos: Electron main process entry — creates window, manages lifecycle
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { app, BrowserWindow, Menu, nativeImage, nativeTheme, shell, Tray } from 'electron';
import { join } from 'node:path';
import { registerIpcHandlers, setupMainWindow } from './ipc/handlers';
import { cliManager } from './backend/cli-manager';

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
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: 'Panda Code',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: join(__dirname, 'preload/chat.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for preload contextBridge
    },
  });

  // Load content
  if (isDev && VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Open external links in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Minimize to tray on close instead of quitting
  win.on('close', (e) => {
    if (!isQuitting) {
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
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'New Chat',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.webContents.send('panda:new-chat');
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
    mainWindow?.show();
    mainWindow?.focus();
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

  mainWindow = createMainWindow();
  setupMainWindow(mainWindow);

  // System tray (minimize-to-tray support)
  createTray();

  // Listen for system theme changes and notify renderer
  nativeTheme.on('updated', () => {
    const isDark = nativeTheme.shouldUseDarkColors;
    mainWindow?.webContents.send('panda:theme:changed', isDark);
  });

  // macOS: re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
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
  return mainWindow;
}
