// Input: UI interaction events (modal open/close, toast push, sidebar hover, composer focus)
// Output: Transient UI state flags and toast queue
// Pos: State layer — consumed by modal controller, toast renderer, layout components

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModalType =
  | 'command-palette'
  | 'settings'
  | 'confirm-delete'
  | 'model-selector'
  | 'mcp-add'
  | null;

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number; // default 5000ms
}

export interface UIStore {
  activeModal: ModalType;
  toasts: Toast[];
  isSidebarHovered: boolean;
  composerFocused: boolean;
  searchQuery: string;

  // Actions
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setSidebarHovered: (hovered: boolean) => void;
  setComposerFocused: (focused: boolean) => void;
  setSearchQuery: (query: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUIStore = create<UIStore>()((set) => ({
  activeModal: null,
  toasts: [],
  isSidebarHovered: false,
  composerFocused: false,
  searchQuery: '',

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: crypto.randomUUID() },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setSidebarHovered: (isSidebarHovered) => set({ isSidebarHovered }),
  setComposerFocused: (composerFocused) => set({ composerFocused }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
