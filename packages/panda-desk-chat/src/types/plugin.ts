// Input: cc-haha desktop/src/types/plugin.ts shape
// Output: plugin / marketplace / capability / reload summary types
// Pos: Type layer — consumed by pluginStore + PdPluginSettings

export type PluginScope = 'user' | 'project' | 'managed' | 'builtin';

export type PluginCapabilityKey = 'lspServers';

export type PluginCapabilities = Partial<Record<PluginCapabilityKey, unknown[]>>;

export type PluginSummary = {
  id: string;
  name: string;
  displayName?: string;
  version?: string;
  enabled: boolean;
  hasErrors: boolean;
  scope: PluginScope;
  description?: string;
};

export type PluginDetail = PluginSummary & {
  capabilities: PluginCapabilities;
  errors?: string[];
  marketplace?: string;
  installedAt?: string;
};

export type Marketplace = {
  name: string;
  url?: string;
  autoUpdate?: boolean;
};

export type PluginReloadSummary = {
  enabled: number;
  skills: number;
  errors: number;
};

export type GlobalPluginSummary = {
  total: number;
  enabled: number;
  marketplaceCount: number;
};
