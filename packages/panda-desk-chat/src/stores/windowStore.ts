// Input:  windowId from Electron main process via IPC bridge
// Output: current window identity state for renderer-side queries
// Pos:    stores layer — provides window-level identity to all renderer components
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WindowState {
  /** BrowserWindow.id from Electron main, -1 = unknown / dev mode */
  windowId: number;
  /** Whether this is the primary (first) application window */
  isPrimary: boolean;
}

interface WindowActions {
  setWindowId: (id: number) => void;
  setIsPrimary: (primary: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWindowStore = create<WindowState & WindowActions>((set) => ({
  windowId: -1,
  isPrimary: true,

  setWindowId: (id) => set({ windowId: id }),
  setIsPrimary: (primary) => set({ isPrimary: primary }),
}));
