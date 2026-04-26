// Input: plugin manifests + marketplace metadata + reload summaries
//        Comdr 指令: 实接 ~/.pandacc/plugins/installed_plugins.json → PluginSummary[]
// Output: plugins list + selected plugin detail + reload action results for PdPluginSettings
// Pos: State layer — drives PdPluginSettings list/detail/reload flow
//
// Source 1:1: cc-haha desktop/src/stores/pluginStore.ts shape
//   panda IPC: bridge.listPluginsPandacc() 走 main 进程读真实 installed_plugins.json。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import type {
  PluginSummary,
  PluginDetail,
  Marketplace,
  PluginReloadSummary,
  GlobalPluginSummary,
} from '../types/plugin';
import { listPluginsPandacc } from '../ipc/bridge';

export interface PluginStore {
  plugins: PluginSummary[];
  marketplaces: Marketplace[];
  summary: GlobalPluginSummary | null;
  lastReloadSummary: PluginReloadSummary | null;
  selectedPlugin: PluginDetail | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  isApplying: boolean;
  error: string | null;

  fetchPlugins: (cwd?: string) => Promise<void>;
  fetchPluginDetail: (id: string, cwd?: string) => Promise<void>;
  reloadPlugins: (cwd?: string) => Promise<PluginReloadSummary>;
  enablePlugin: (id: string) => Promise<string>;
  disablePlugin: (id: string) => Promise<string>;
  updatePlugin: (id: string) => Promise<string>;
  uninstallPlugin: (id: string) => Promise<string>;
  clearSelection: () => void;
}

const EMPTY_RELOAD: PluginReloadSummary = { enabled: 0, skills: 0, errors: 0 };

export const usePluginStore = create<PluginStore>()((set) => ({
  plugins: [],
  marketplaces: [],
  summary: null,
  lastReloadSummary: null,
  selectedPlugin: null,
  isLoading: false,
  isDetailLoading: false,
  isApplying: false,
  error: null,

  // Comdr 指令: 走 bridge.listPluginsPandacc() 读 ~/.pandacc/plugins/installed_plugins.json
  fetchPlugins: async (_cwd) => {
    set({ isLoading: true, error: null });
    try {
      const items = await listPluginsPandacc();
      const plugins: PluginSummary[] = items.map((p) => ({
        id: p.id,
        name: p.name,
        version: p.version,
        enabled: p.enabled,
        hasErrors: false,
        scope: p.scope,
        description: p.marketplace ? `${p.marketplace} · ${p.installPath}` : p.installPath,
      }));
      // 从插件 id 中提取唯一的 marketplace 集合
      const marketplaceSet = new Set(items.map((p) => p.marketplace).filter(Boolean));
      const marketplaces: Marketplace[] = [...marketplaceSet].map((name) => ({ name }));
      const enabledCount = plugins.filter((p) => p.enabled).length;
      set({
        plugins,
        marketplaces,
        summary: {
          total: plugins.length,
          enabled: enabledCount,
          marketplaceCount: marketplaces.length,
        },
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load plugins',
      });
    }
  },

  // TODO(IPC): panda 缺 pluginsApi.detail；保持空。
  fetchPluginDetail: async (_id, _cwd) => {
    set({ selectedPlugin: null });
  },

  // TODO(IPC): panda 缺 pluginsApi.reload；返回 0。
  reloadPlugins: async (_cwd) => {
    set({ isApplying: true });
    try {
      const summary = EMPTY_RELOAD;
      set({ lastReloadSummary: summary, isApplying: false });
      return summary;
    } catch (err) {
      set({ isApplying: false });
      throw err;
    }
  },

  // TODO(IPC): 各操作均未连通后端；返回占位消息。
  enablePlugin: async (_id) => 'Plugin enable: not implemented',
  disablePlugin: async (_id) => 'Plugin disable: not implemented',
  updatePlugin: async (_id) => 'Plugin update: not implemented',
  uninstallPlugin: async (_id) => 'Plugin uninstall: not implemented',

  clearSelection: () => set({ selectedPlugin: null }),
}));
