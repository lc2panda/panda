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

/**
 * Wire all IPC bridge listeners and sync initial state.
 * Call once at app startup (main.tsx).
 */
export function setupAllBridges(): void {
  setupBridgeListeners();
  setupSessionBridge();
  setupSettingsBridge();
  setupProviderBridge();
}
