// Input: Provider/model configuration synced from CLI backend
// Output: Available providers and models for model selector UI
// Pos: State layer — consumed by model selector dropdown, provider settings panel

import { create } from 'zustand';
import { storage } from '../lib/storage';
import * as bridge from '../ipc/bridge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsThinking: boolean;
  tags?: string[];
}

export interface Provider {
  id: string;
  name: string;
  type: 'anthropic' | 'openai' | 'bedrock' | 'vertex' | 'azure' | 'openrouter';
  isActive: boolean;
  models: ModelInfo[];
  apiKey?: string;
  baseUrl?: string;
  endpoint?: string;
}

const PROVIDERS_STORAGE_KEY = 'providers';

type PersistedProviderState = {
  providers: Provider[];
  activeProviderId: string | null;
};

export interface ProviderStore {
  providers: Provider[];
  activeProviderId: string | null;

  // Actions
  setProviders: (providers: Provider[]) => void;
  setActiveProvider: (providerId: string) => void;
  updateProvider: (providerId: string, patch: Partial<Provider>) => void;
  addProvider: (provider: Provider) => void;
  removeProvider: (providerId: string) => void;
  getActiveProvider: () => Provider | null;
  getAvailableModels: () => ModelInfo[];
  loadProviders: () => void;
  saveProviders: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Default seed data (used when no backend sync has occurred yet)
// ---------------------------------------------------------------------------

const defaultModels: ModelInfo[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    maxTokens: 64_000,
    supportsVision: true,
    supportsThinking: true,
    tags: ['fast', 'balanced'],
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    maxTokens: 32_000,
    supportsVision: true,
    supportsThinking: true,
    tags: ['smart', 'thorough'],
  },
  {
    id: 'claude-haiku-3-20250307',
    name: 'Claude Haiku 3',
    provider: 'anthropic',
    maxTokens: 16_000,
    supportsVision: true,
    supportsThinking: false,
    tags: ['fastest', 'lightweight'],
  },
];

const defaultProvider: Provider = {
  id: 'anthropic',
  name: 'Anthropic',
  type: 'anthropic',
  isActive: true,
  models: defaultModels,
};

export const useProviderStore = create<ProviderStore>()((set, get) => ({
  providers: [defaultProvider],
  activeProviderId: 'anthropic',

  setProviders: (providers) => {
    set({ providers });
    get().saveProviders();
  },

  setActiveProvider: (providerId) => {
    set({ activeProviderId: providerId });
    get().saveProviders();
  },

  updateProvider: (providerId, patch) => {
    set((state) => ({
      providers: state.providers.map((p) => (p.id === providerId ? { ...p, ...patch } : p)),
    }));
    get().saveProviders();
  },

  addProvider: (provider) => {
    set((state) => ({ providers: [...state.providers, provider] }));
    get().saveProviders();
  },

  removeProvider: (providerId) => {
    set((state) => {
      const providers = state.providers.filter((p) => p.id !== providerId);
      const activeProviderId =
        state.activeProviderId === providerId ? providers[0]?.id ?? null : state.activeProviderId;
      return { providers, activeProviderId };
    });
    get().saveProviders();
  },

  getActiveProvider: () => {
    const { providers, activeProviderId } = get();
    if (!activeProviderId) return null;
    return providers.find((p) => p.id === activeProviderId) ?? null;
  },

  getAvailableModels: () => {
    const { providers } = get();
    return providers
      .filter((p) => p.isActive)
      .flatMap((p) => p.models);
  },

  loadProviders: () => {
    const saved = storage.get<Partial<PersistedProviderState>>(PROVIDERS_STORAGE_KEY, {});
    if (saved.providers && saved.providers.length > 0) {
      set({
        providers: saved.providers,
        activeProviderId: saved.activeProviderId ?? saved.providers[0]?.id ?? null,
      });
    }
  },

  saveProviders: () => {
    const { providers, activeProviderId } = get();
    storage.set(PROVIDERS_STORAGE_KEY, { providers, activeProviderId });
  },
}));

useProviderStore.getState().loadProviders();

// ---------------------------------------------------------------------------
// Bridge event wiring — loads models from backend at startup
// ---------------------------------------------------------------------------

let providerBridgeInitialized = false;

/**
 * Setup IPC bridge sync for providers/models.
 * Call once at app initialization (after setupBridgeListeners).
 */
export function setupProviderBridge(): void {
  if (providerBridgeInitialized) return;
  providerBridgeInitialized = true;

  // In production, fetch model list from backend
  if (!bridge.isDevMode()) {
    bridge.getModels()
      .then((models) => {
        if (models.length > 0) {
          const store = useProviderStore.getState();
          const byProvider = new Map<string, typeof models>();
          for (const m of models) {
            const list = byProvider.get(m.provider) || [];
            list.push(m);
            byProvider.set(m.provider, list);
          }
          const providers = store.providers.map((p) => {
            const bm = byProvider.get(p.id);
            return bm
              ? {
                  ...p,
                  models: bm.map((m) => ({
                    id: m.id,
                    name: m.name,
                    provider: m.provider,
                    maxTokens: m.maxTokens,
                    supportsVision: true,
                    supportsThinking: true,
                  })),
                }
              : p;
          });
          store.setProviders(providers);
        }
      })
      .catch((err: unknown) => console.error('[providerStore] getModels failed:', err));
  }
}
