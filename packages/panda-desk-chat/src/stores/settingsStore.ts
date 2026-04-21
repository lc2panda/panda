// Input: User preference changes (theme, locale, model, font size, layout toggles)
// Output: Persistent settings state for the entire application
// Pos: State layer — consumed by theme provider, i18n, model selector, layout components

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark' | 'system';
export type PermissionMode = 'default' | 'plan' | 'auto' | 'bypassPermissions';
export type Locale = 'zh' | 'en' | 'ko';

export interface SettingsStore {
  theme: Theme;
  locale: Locale;
  permissionMode: PermissionMode;
  model: string;
  fontSize: number;
  sidebarExpanded: boolean;
  inspectorVisible: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setPermissionMode: (mode: PermissionMode) => void;
  setModel: (modelId: string) => void;
  setFontSize: (size: number) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsStore>()((set) => ({
  theme: 'system',
  locale: 'zh',
  permissionMode: 'default',
  model: 'claude-sonnet-4-20250514',
  fontSize: 14,
  sidebarExpanded: true,
  inspectorVisible: false,

  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  setPermissionMode: (permissionMode) => set({ permissionMode }),
  setModel: (model) => set({ model }),
  setFontSize: (fontSize) => set({ fontSize }),
  toggleSidebar: () =>
    set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
  toggleInspector: () =>
    set((state) => ({ inspectorVisible: !state.inspectorVisible })),
}));
