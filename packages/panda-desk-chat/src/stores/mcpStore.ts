// Input: MCP server records + scope filter + status events
// Output: MCP server list + selected server + CRUD/toggle/reconnect actions for PdMcpSettings
// Pos: State layer — drives PdMcpSettings list/edit/details/create flows
//
// Source 1:1: cc-haha desktop/src/stores/mcpStore.ts (~210 行)
//   字段名 / action 名 / 形态与 cc-haha 一致；
//   panda IPC 缺 mcpApi 全部端点 → 全降级到 localStorage stub + TODO 标记；
//   不破坏 panda 现有 store 风格。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import { storage } from '../lib/storage';
import type { McpServerRecord, McpUpsertPayload } from '../types/mcp';

const STORAGE_KEY = 'mcp-servers';

interface PersistedMcpState {
  servers: McpServerRecord[];
}

export interface McpStore {
  servers: McpServerRecord[];
  selectedServer: McpServerRecord | null;
  isLoading: boolean;
  error: string | null;

  fetchServers: (scope?: string, cwd?: string) => Promise<void>;
  createServer: (
    name: string,
    payload: McpUpsertPayload,
    cwd?: string,
  ) => Promise<McpServerRecord>;
  updateServer: (
    server: McpServerRecord,
    payload: McpUpsertPayload,
    cwd?: string,
  ) => Promise<McpServerRecord>;
  deleteServer: (server: McpServerRecord, cwd?: string) => Promise<void>;
  toggleServer: (
    server: McpServerRecord,
    cwd?: string,
  ) => Promise<McpServerRecord>;
  reconnectServer: (
    server: McpServerRecord,
    cwd?: string,
  ) => Promise<McpServerRecord>;
  refreshServerStatus: (
    server: McpServerRecord,
    cwd?: string,
  ) => Promise<McpServerRecord>;
  selectServer: (server: McpServerRecord | null) => void;
}

function loadPersisted(): McpServerRecord[] {
  return storage.get<PersistedMcpState>(STORAGE_KEY, { servers: [] }).servers;
}

function savePersisted(servers: McpServerRecord[]) {
  storage.set<PersistedMcpState>(STORAGE_KEY, { servers });
}

function deriveDefaults(name: string, payload: McpUpsertPayload): McpServerRecord {
  const transport = payload.config.type;
  return {
    name,
    scope: payload.scope,
    transport,
    config: payload.config,
    status: 'disabled',
    statusLabel: 'disabled',
    statusDetail: undefined,
    summary: transport === 'stdio'
      ? `${(payload.config as { command: string }).command ?? ''}`
      : (payload.config as { url: string }).url ?? '',
    enabled: false,
    canToggle: true,
    canEdit: true,
    canRemove: true,
    canReconnect: false,
    configLocation: '~/.panda/mcp.json (TODO: panda IPC pending)',
    projectPath: undefined,
  };
}

export const useMcpStore = create<McpStore>()((set, get) => ({
  servers: loadPersisted(),
  selectedServer: null,
  isLoading: false,
  error: null,

  // TODO(IPC): panda 缺 mcpApi.list；目前仅返回 localStorage 缓存。
  fetchServers: async (_scope, _cwd) => {
    set({ isLoading: true, error: null });
    try {
      set({ servers: loadPersisted(), isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load MCP servers',
      });
    }
  },

  // TODO(IPC): panda 缺 mcpApi.create；本地直接写入。
  createServer: async (name, payload, _cwd) => {
    const record = deriveDefaults(name, payload);
    const next = [...get().servers, record];
    set({ servers: next });
    savePersisted(next);
    return record;
  },

  // TODO(IPC): panda 缺 mcpApi.update；按 name+scope 匹配本地替换。
  updateServer: async (server, payload, _cwd) => {
    const updated: McpServerRecord = {
      ...server,
      transport: payload.config.type,
      config: payload.config,
    };
    const next = get().servers.map((s) =>
      s.name === server.name && s.scope === server.scope ? updated : s,
    );
    set({ servers: next });
    savePersisted(next);
    return updated;
  },

  // TODO(IPC): panda 缺 mcpApi.delete；本地按 name+scope 移除。
  deleteServer: async (server, _cwd) => {
    const next = get().servers.filter(
      (s) => !(s.name === server.name && s.scope === server.scope),
    );
    set({ servers: next });
    savePersisted(next);
  },

  // TODO(IPC): panda 缺 mcpApi.toggle；本地切换 enabled。
  toggleServer: async (server, _cwd) => {
    const updated: McpServerRecord = {
      ...server,
      enabled: !server.enabled,
      status: !server.enabled ? 'connected' : 'disabled',
      statusLabel: !server.enabled ? 'connected' : 'disabled',
    };
    const next = get().servers.map((s) =>
      s.name === server.name && s.scope === server.scope ? updated : s,
    );
    set({ servers: next });
    savePersisted(next);
    return updated;
  },

  // TODO(IPC): panda 缺 mcpApi.reconnect；本地直接置 connected。
  reconnectServer: async (server, _cwd) => {
    const updated: McpServerRecord = {
      ...server,
      status: 'connected',
      statusLabel: 'connected',
      statusDetail: undefined,
    };
    const next = get().servers.map((s) =>
      s.name === server.name && s.scope === server.scope ? updated : s,
    );
    set({ servers: next });
    savePersisted(next);
    return updated;
  },

  // TODO(IPC): panda 缺 mcpApi.refreshStatus；保持原状态返回。
  refreshServerStatus: async (server) => server,

  selectServer: (selectedServer) => set({ selectedServer }),
}));
