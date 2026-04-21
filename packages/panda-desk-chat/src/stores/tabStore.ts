// Input: User tab interactions (open, close, reorder, pin/unpin)
// Output: Ordered tab list with active/pinned state
// Pos: State layer — drives tab bar component

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tab {
  id: string;
  sessionId: string;
  title: string;
  isActive: boolean;
  isPinned: boolean;
  order: number;
}

export interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;

  // Actions
  addTab: (sessionId: string, title: string) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  renameTab: (tabId: string, title: string) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  getTabBySessionId: (sessionId: string) => Tab | undefined;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTabStore = create<TabStore>()((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (sessionId, title) =>
    set((state) => {
      // Deactivate all existing tabs
      const deactivated = state.tabs.map((t) => ({ ...t, isActive: false }));
      const newTab: Tab = {
        id: crypto.randomUUID(),
        sessionId,
        title,
        isActive: true,
        isPinned: false,
        order: deactivated.length,
      };
      return {
        tabs: [...deactivated, newTab],
        activeTabId: newTab.id,
      };
    }),

  removeTab: (tabId) =>
    set((state) => {
      const filtered = state.tabs.filter((t) => t.id !== tabId);
      // Re-index order
      const reordered = filtered.map((t, i) => ({ ...t, order: i }));

      let nextActiveId = state.activeTabId;
      if (state.activeTabId === tabId) {
        // Activate the last tab, or null
        const last = reordered[reordered.length - 1];
        nextActiveId = last?.id ?? null;
        if (last) {
          const idx = reordered.indexOf(last);
          reordered[idx] = { ...last, isActive: true };
        }
      }
      return { tabs: reordered, activeTabId: nextActiveId };
    }),

  setActiveTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) => ({
        ...t,
        isActive: t.id === tabId,
      })),
      activeTabId: tabId,
    })),

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.tabs.length ||
        toIndex >= state.tabs.length
      ) {
        return state;
      }
      const sorted = [...state.tabs].sort((a, b) => a.order - b.order);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return {
        tabs: sorted.map((t, i) => ({ ...t, order: i })),
      };
    }),

  renameTab: (tabId, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, title } : t)),
    })),

  pinTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isPinned: true } : t,
      ),
    })),

  unpinTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isPinned: false } : t,
      ),
    })),

  getTabBySessionId: (sessionId) => {
    return get().tabs.find((t) => t.sessionId === sessionId);
  },
}));
