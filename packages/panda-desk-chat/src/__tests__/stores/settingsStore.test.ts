// Input: settingsStore actions (setTheme, setLocale, toggleSidebar, etc.)
// Output: state assertions validating settings mutations and persistence
// Pos: test layer — validates settingsStore logic

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock bridge module — settingsStore calls bridge.setPermissionMode on init
vi.mock('@/ipc/bridge', () => ({
  isDevMode: () => true,
  setPermissionMode: vi.fn().mockResolvedValue(undefined),
}));

// Mock localStorage for storage module
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import { useSettingsStore } from '@/stores/settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to defaults
    useSettingsStore.getState().loadSettings();
  });

  it('has correct default values', () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe('system');
    expect(state.locale).toBe('zh');
    expect(state.fontSize).toBe(14);
    expect(state.sidebarExpanded).toBe(true);
  });

  it('setTheme updates theme', () => {
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');

    useSettingsStore.getState().setTheme('system');
    expect(useSettingsStore.getState().theme).toBe('system');
  });

  it('setLocale updates locale', () => {
    useSettingsStore.getState().setLocale('en');
    expect(useSettingsStore.getState().locale).toBe('en');

    useSettingsStore.getState().setLocale('ko');
    expect(useSettingsStore.getState().locale).toBe('ko');
  });

  it('toggleSidebar flips sidebarExpanded', () => {
    const initial = useSettingsStore.getState().sidebarExpanded;
    useSettingsStore.getState().toggleSidebar();
    expect(useSettingsStore.getState().sidebarExpanded).toBe(!initial);

    useSettingsStore.getState().toggleSidebar();
    expect(useSettingsStore.getState().sidebarExpanded).toBe(initial);
  });

  it('setFontSize updates fontSize', () => {
    useSettingsStore.getState().setFontSize(18);
    expect(useSettingsStore.getState().fontSize).toBe(18);
  });
});
