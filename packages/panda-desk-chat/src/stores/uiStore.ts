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

/** Which main view the center column renders (Sidebar-controlled) */
export type ActiveView = 'chat' | 'scheduled' | 'settings';

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

  /** Center-column main view (chat = default, scheduled = Sidebar "Scheduled" nav) */
  activeView: ActiveView;

  // Inspector cross-component linkage (sidebar → App → PdInspector)
  inspectorTab: number;
  inspectorVisible: boolean;
  inspectorHighlightFile: string | null;

  // Actions
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setSidebarHovered: (hovered: boolean) => void;
  setComposerFocused: (focused: boolean) => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: ActiveView) => void;
  setInspectorTab: (tab: number) => void;
  setInspectorVisible: (visible: boolean) => void;
  openInspectorFile: (filePath: string) => void;
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
  activeView: 'chat',
  inspectorTab: 0,
  inspectorVisible: false,
  inspectorHighlightFile: null,

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
  setActiveView: (activeView) => set({ activeView }),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setInspectorVisible: (inspectorVisible) => set({ inspectorVisible }),
  openInspectorFile: (filePath) =>
    set({ inspectorTab: 1, inspectorVisible: true, inspectorHighlightFile: filePath }),
}));
