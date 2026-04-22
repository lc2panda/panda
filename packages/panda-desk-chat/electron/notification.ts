// Input: notify() calls with title/body, enable/disable toggles, unread count mutations
// Output: System notifications (OS-level) + macOS dock badge management
// Pos: electron/notification — centralized notification manager for main process

import { Notification, app, BrowserWindow } from 'electron';

// ---------------------------------------------------------------------------
// NotificationManager — singleton for system notifications + dock badge
// ---------------------------------------------------------------------------

class NotificationManager {
  private enabled = true;
  private unreadCount = 0;

  /** Enable or disable system notifications. */
  setEnabled(val: boolean): void {
    this.enabled = val;
  }

  /**
   * Show a system notification when the main window is unfocused.
   * Clicking the notification focuses the main window.
   */
  notify(title: string, body: string, onClick?: () => void): void {
    if (!this.enabled) return;
    if (!Notification.isSupported()) return;

    // Only notify when window is not focused
    const wins = BrowserWindow.getAllWindows();
    const mainWin = wins[0];
    if (mainWin && mainWin.isFocused()) return;

    const notification = new Notification({ title, body });

    notification.on('click', () => {
      if (mainWin && !mainWin.isDestroyed()) {
        if (mainWin.isMinimized()) mainWin.restore();
        mainWin.show();
        mainWin.focus();
      }
      onClick?.();
    });

    notification.show();
  }

  /** Increment unread count and update macOS dock badge. */
  incrementUnread(): void {
    this.unreadCount++;
    if (process.platform === 'darwin') {
      app.dock?.setBadge(String(this.unreadCount));
    }
  }

  /** Clear unread count and remove macOS dock badge. */
  clearUnread(): void {
    this.unreadCount = 0;
    if (process.platform === 'darwin') {
      app.dock?.setBadge('');
    }
  }
}

export const notificationManager = new NotificationManager();
