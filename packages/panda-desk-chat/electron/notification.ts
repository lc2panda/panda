// Input: notify() calls with title/body, enable/disable toggles, unread count mutations
// Output: System notifications (OS-level) + macOS dock badge management
// Pos: electron/notification — centralized notification manager for main process

import { Notification, app } from 'electron';
import { windowManager } from './window-manager';

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
   * Show a system notification when no window is focused.
   * Clicking the notification focuses the session's window (or the best available).
   */
  notify(title: string, body: string, onClick?: () => void, sessionId?: string): void {
    if (!this.enabled) return;
    if (!Notification.isSupported()) return;

    // Skip notification if any window is focused
    if (windowManager.isAnyWindowFocused()) return;

    const notification = new Notification({ title, body });

    notification.on('click', () => {
      // Resolve the best window to focus: session-specific → focused → active
      const targetWin =
        (sessionId ? windowManager.getWindowForSession(sessionId) : undefined) ??
        windowManager.getFocusedWindow() ??
        windowManager.getActiveWindow();

      if (targetWin && !targetWin.isDestroyed()) {
        if (targetWin.isMinimized()) targetWin.restore();
        targetWin.show();
        targetWin.focus();
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
