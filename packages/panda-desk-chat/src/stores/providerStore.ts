// Input: Provider/model configuration synced from CLI backend
// Output: Available providers and models for model selector UI
// Pos: State layer — consumed by model selector dropdown, provider settings panel

import { create } from 'zustand';

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
}

export interface Provider {
  id: string;
  name: string;
  type: 'anthropic' | 'openai' | 'bedrock' | 'vertex' | 'azure' | 'openrouter';
  isActive: boolean;
  models: ModelInfo[];
}

export interface ProviderStore {
  providers: Provider[];
  activeProviderId: string | null;

  // Actions
  setProviders: (providers: Provider[]) => void;
  setActiveProvider: (providerId: string) => void;
  getActiveProvider: () => Provider | null;
  getAvailableModels: () => ModelInfo[];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useProviderStore = create<ProviderStore>()((set, get) => ({
  providers: [],
  activeProviderId: null,

  setProviders: (providers) => set({ providers }),

  setActiveProvider: (providerId) => set({ activeProviderId: providerId }),

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
}));
