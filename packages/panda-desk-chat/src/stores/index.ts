// Input: Individual store modules
// Output: Unified re-exports for all Zustand stores + bridge initialization
// Pos: State layer barrel — single import point for consumers

export { useChatStore, setupBridgeListeners } from './chatStore';
export { useSessionStore, setupSessionBridge } from './sessionStore';
export { useTabStore } from './tabStore';
export { useSettingsStore, setupSettingsBridge } from './settingsStore';
export { useUIStore } from './uiStore';
export { useToastStore } from './toastStore';
export { useProviderStore, setupProviderBridge } from './providerStore';
export { useBuddyStore } from './buddyStore';
export { useWindowStore } from './windowStore';
export { useScheduleStore, setupScheduleBridge } from './scheduleStore';

// Re-export commonly used types
export type {
  UIMessage,
  UIToolCall,
  TokenUsage,
  ChatState,
  ConnectionState,
  PendingPermission,
  PerSessionState,
} from './chatStore';

export type { SessionMeta } from './sessionStore';
export type { Tab } from './tabStore';
export type { Theme, PermissionMode, Locale, EffortLevel } from './settingsStore';
export type { ModalType } from './uiStore';
export type { Toast, ToastType } from './toastStore';
export type { Provider, ModelInfo } from './providerStore';
export type { BuddyEvent, BuddyMilestone, BuddyStats, BuddyEventType } from './buddyStore';
export type { WindowState } from './windowStore';

// ---------------------------------------------------------------------------
// Unified bridge initialization
// ---------------------------------------------------------------------------

import { setupBridgeListeners } from './chatStore';
import { setupSessionBridge } from './sessionStore';
import { setupSettingsBridge } from './settingsStore';
import { setupProviderBridge } from './providerStore';
import { setupScheduleBridge } from './scheduleStore';

/**
 * Wire all IPC bridge listeners and sync initial state.
 * Call once at app startup (main.tsx).
 */
export function setupAllBridges(): void {
  setupBridgeListeners();
  setupSessionBridge();
  setupSettingsBridge();
  setupProviderBridge();
  setupScheduleBridge();

  // Dev-only: expose stores on window for CDP / DevTools introspection.
  if (typeof window !== 'undefined' && import.meta.env?.DEV) {
    const w = window as unknown as Record<string, unknown>;
    void import('./chatStore').then((m) => { w.useChatStore = m.useChatStore; });
    void import('./sessionStore').then((m) => { w.useSessionStore = m.useSessionStore; });
    void import('./tabStore').then((m) => { w.useTabStore = m.useTabStore; });
    void import('./settingsStore').then((m) => { w.useSettingsStore = m.useSettingsStore; });
    void import('./uiStore').then((m) => { w.useUIStore = m.useUIStore; });
    void import('./providerStore').then((m) => { w.useProviderStore = m.useProviderStore; });
    void import('./buddyStore').then((m) => { w.useBuddyStore = m.useBuddyStore; });
    void import('./scheduleStore').then((m) => { w.useScheduleStore = m.useScheduleStore; });
  }
}
