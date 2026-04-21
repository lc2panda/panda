// Input: Individual store modules
// Output: Unified re-exports for all Zustand stores
// Pos: State layer barrel — single import point for consumers

export { useChatStore, setupBridgeListeners } from './chatStore';
export { useSessionStore } from './sessionStore';
export { useTabStore } from './tabStore';
export { useSettingsStore } from './settingsStore';
export { useUIStore } from './uiStore';
export { useProviderStore } from './providerStore';

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
export type { Theme, PermissionMode, Locale } from './settingsStore';
export type { ModalType, Toast } from './uiStore';
export type { Provider, ModelInfo } from './providerStore';
