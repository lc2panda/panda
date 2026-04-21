// Input: User preference changes (theme, locale, model, font size, layout toggles)
// Output: Persistent settings state for the entire application
// Pos: State layer — consumed by theme provider, i18n, model selector, layout components

import { create } from 'zustand';
import { storage } from '../lib/storage';
import * as bridge from '../ipc/bridge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark' | 'system';
export type PermissionMode = 'default' | 'plan' | 'auto' | 'bypassPermissions';
export type Locale = 'zh' | 'en' | 'ko';
export type EffortLevel = 'auto' | 'low' | 'medium' | 'high';

const STORAGE_KEY = 'settings';

interface PersistedSettings {
  theme: Theme;
  locale: Locale;
  permissionMode: PermissionMode;
  model: string;
  fontSize: number;
  sidebarExpanded: boolean;
  inspectorVisible: boolean;
  effortLevel: EffortLevel;
}

export interface SettingsStore extends PersistedSettings {
  // Actions
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setPermissionMode: (mode: PermissionMode) => void;
  setModel: (modelId: string) => void;
  setFontSize: (size: number) => void;
  setEffortLevel: (level: EffortLevel) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  loadSettings: () => void;
  saveSettings: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaults: PersistedSettings = {
  theme: 'system',
  locale: 'zh',
  permissionMode: 'default',
  model: 'claude-sonnet-4-20250514',
  fontSize: 14,
  sidebarExpanded: true,
  inspectorVisible: false,
  effortLevel: 'auto',
};

function pickPersisted(state: PersistedSettings): PersistedSettings {
  return {
    theme: state.theme,
    locale: state.locale,
    permissionMode: state.permissionMode,
    model: state.model,
    fontSize: state.fontSize,
    sidebarExpanded: state.sidebarExpanded,
    inspectorVisible: state.inspectorVisible,
    effortLevel: state.effortLevel,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  ...defaults,

  setTheme: (theme) => {
    set({ theme });
    get().saveSettings();
  },
  setLocale: (locale) => {
    set({ locale });
    get().saveSettings();
  },
  setPermissionMode: (permissionMode) => {
    set({ permissionMode });
    get().saveSettings();
    bridge.setPermissionMode(permissionMode).catch((err: unknown) => {
      console.error('[settingsStore] setPermissionMode failed:', err);
    });
  },
  setModel: (model) => {
    set({ model });
    get().saveSettings();
  },
  setFontSize: (fontSize) => {
    set({ fontSize });
    get().saveSettings();
  },
  setEffortLevel: (effortLevel) => {
    set({ effortLevel });
    get().saveSettings();
  },
  toggleSidebar: () => {
    set((state) => ({ sidebarExpanded: !state.sidebarExpanded }));
    get().saveSettings();
  },
  toggleInspector: () => {
    set((state) => ({ inspectorVisible: !state.inspectorVisible }));
    get().saveSettings();
  },

  loadSettings: () => {
    const saved = storage.get<Partial<PersistedSettings>>(STORAGE_KEY, {});
    set({ ...defaults, ...saved });
  },

  saveSettings: () => {
    storage.set(STORAGE_KEY, pickPersisted(get()));
  },
}));

// ---------------------------------------------------------------------------
// Bridge event wiring — pushes permission mode to backend on startup
// ---------------------------------------------------------------------------

let settingsBridgeInitialized = false;

/**
 * Setup IPC bridge sync for settings.
 * Call once at app initialization (after setupBridgeListeners).
 */
export function setupSettingsBridge(): void {
  if (settingsBridgeInitialized) return;
  settingsBridgeInitialized = true;

  // In production, push initial permission mode to backend
  if (!bridge.isDevMode()) {
    const { permissionMode } = useSettingsStore.getState();
    bridge.setPermissionMode(permissionMode).catch((err: unknown) => {
      console.error('[settingsStore] initial setPermissionMode failed:', err);
    });
  }
}

// Auto-load on module init
useSettingsStore.getState().loadSettings();
