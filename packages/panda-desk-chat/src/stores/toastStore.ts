// Input: toast 事件（add/dismiss/clearAll）
// Output: toasts 数组供 PdToastContainer 渲染
// Pos: stores/ — 全局 toast 通知状态管理

import { create } from 'zustand';
import type { Toast, ToastType } from '@/components/containers/PdToast';

// Re-export for consumer convenience
export type { Toast, ToastType };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToastStore {
  toasts: Toast[];

  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

// ---------------------------------------------------------------------------
// Auto-dismiss timers (keyed by toast id)
// ---------------------------------------------------------------------------

const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleDismiss(id: string, duration: number, dismiss: (id: string) => void): void {
  clearDismissTimer(id);
  const timer = setTimeout(() => {
    dismissTimers.delete(id);
    dismiss(id);
  }, duration);
  dismissTimers.set(id, timer);
}

function clearDismissTimer(id: string): void {
  const existing = dismissTimers.get(id);
  if (existing !== undefined) {
    clearTimeout(existing);
    dismissTimers.delete(id);
  }
}

function clearAllDismissTimers(): void {
  for (const timer of dismissTimers.values()) {
    clearTimeout(timer);
  }
  dismissTimers.clear();
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const DEFAULT_DURATION = 5000;

export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? DEFAULT_DURATION;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration }],
    }));

    // Schedule auto-dismiss if duration > 0
    if (duration > 0) {
      scheduleDismiss(id, duration, get().dismissToast);
    }
  },

  dismissToast: (id) => {
    clearDismissTimer(id);
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    clearAllDismissTimers();
    set({ toasts: [] });
  },
}));
