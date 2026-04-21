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
  tags?: string[];
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
