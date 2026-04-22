// Input: electron-updater autoUpdater events, WindowManager broadcast
// Output: Update status events broadcast to all renderer windows via IPC ('panda:update:status')
// Pos: Electron main process — auto-update lifecycle manager
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { autoUpdater } from 'electron-updater';
import type { UpdateInfo, ProgressInfo } from 'electron-updater';
import type { BrowserWindow } from 'electron';
import { windowManager } from './window-manager';

// ---------------------------------------------------------------------------
// Update status channel (must match preload/chat.ts & IPC handlers)
// ---------------------------------------------------------------------------

export const UPDATE_STATUS_CHANNEL = 'panda:update:status';

// ---------------------------------------------------------------------------
// AppUpdater — singleton that wraps electron-updater for IPC integration
// ---------------------------------------------------------------------------

class AppUpdater {
  /**
   * Initialise the updater.
   * Call once after window creation in app.whenReady().
   */
  init(_win?: BrowserWindow): void {

    // --- Configuration ---
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // --- Events ---
    autoUpdater.on('checking-for-update', () => {
      this.sendStatus('checking');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.sendStatus('available', {
        version: info.version,
        releaseNotes: info.releaseNotes,
      });
    });

    autoUpdater.on('update-not-available', () => {
      this.sendStatus('up-to-date');
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.sendStatus('downloading', {
        percent: Math.round(progress.percent),
      });
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.sendStatus('downloaded', { version: info.version });
    });

    autoUpdater.on('error', (err: Error) => {
      this.sendStatus('error', { message: err.message });
    });
  }

  /** Trigger an update check. */
  async checkForUpdates(): Promise<void> {
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      this.sendStatus('error', { message: (e as Error).message });
    }
  }

  /** Download the available update. */
  async downloadUpdate(): Promise<void> {
    await autoUpdater.downloadUpdate();
  }

  /** Quit and install the downloaded update. */
  quitAndInstall(): void {
    autoUpdater.quitAndInstall();
  }

  /** Send an update status event to all renderer windows. */
  private sendStatus(status: string, data?: Record<string, unknown>): void {
    // Broadcast to all windows — every renderer needs update status
    windowManager.broadcast(UPDATE_STATUS_CHANNEL, { status, ...data });
  }
}

export const appUpdater = new AppUpdater();
