// Input: User preference changes (theme, locale, model, font size, layout toggles, notifications)
// Output: Persistent settings state for the entire application
// Pos: State layer — consumed by theme provider, i18n, model selector, layout components, notification manager

import { create } from 'zustand';
import { storage } from '../lib/storage';
import * as bridge from '../ipc/bridge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark' | 'system';
export type PermissionMode = 'default' | 'plan' | 'auto' | 'bypassPermissions';
export type Locale = 'zh' | 'en' | 'ja' | 'ko';
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
  workingDirectory: string;
  notificationsEnabled: boolean;
}

export interface SettingsStore extends PersistedSettings {
  // Actions
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setPermissionMode: (mode: PermissionMode) => void;
  setModel: (modelId: string) => void;
  setFontSize: (size: number) => void;
  setEffortLevel: (level: EffortLevel) => void;
  setWorkingDirectory: (dir: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  loadSettings: () => void;
  saveSettings: () => void;
  resetSettings: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaults: PersistedSettings = {
  // Default to light theme to match Claude's desktop aesthetic (cream bg + warm
  // brown text). system-dark defaults produced a nearly-black UI that reads as
  // broken; users can still opt into dark via /settings.
  theme: 'light',
  locale: 'zh',
  permissionMode: 'default',
  model: 'claude-opus-4-7',
  fontSize: 14,
  sidebarExpanded: true,
  inspectorVisible: false,
  effortLevel: 'auto',
  workingDirectory: '',
  notificationsEnabled: true,
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
    workingDirectory: state.workingDirectory,
    notificationsEnabled: state.notificationsEnabled,
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
  setWorkingDirectory: (workingDirectory) => {
    set({ workingDirectory });
    get().saveSettings();
  },
  setNotificationsEnabled: (enabled) => {
    set({ notificationsEnabled: enabled });
    get().saveSettings();
    bridge.setNotificationEnabled(enabled).catch((err: unknown) => {
      console.error('[settingsStore] setNotificationEnabled failed:', err);
    });
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
    // One-shot migration: users who accepted the old 'system' default saw a
    // near-black UI on macOS dark mode. Force them onto 'light' once so the
    // Claude-style cream theme is the first impression. User-selected
    // 'dark'/'light' are preserved.
    const migratedTheme: Theme | undefined =
      saved.theme === 'system' ? 'light' : saved.theme;
    const merged: PersistedSettings = {
      ...defaults,
      ...saved,
      ...(migratedTheme ? { theme: migratedTheme } : {}),
    };
    set(merged);
    if (saved.theme === 'system') {
      storage.set(STORAGE_KEY, pickPersisted(merged));
    }
  },

  saveSettings: () => {
    storage.set(STORAGE_KEY, pickPersisted(get()));
  },

  resetSettings: () => {
    storage.set(STORAGE_KEY, pickPersisted(defaults));
    set({ ...defaults });
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
    const { permissionMode, notificationsEnabled } = useSettingsStore.getState();
    bridge.setPermissionMode(permissionMode).catch((err: unknown) => {
      console.error('[settingsStore] initial setPermissionMode failed:', err);
    });
    bridge.setNotificationEnabled(notificationsEnabled).catch((err: unknown) => {
      console.error('[settingsStore] initial setNotificationEnabled failed:', err);
    });
  }
}

// Auto-load on module init
useSettingsStore.getState().loadSettings();
