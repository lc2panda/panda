// Input: agent definitions from cc-haha userSettings/projectSettings/localSettings/policySettings/plugin/flagSettings/built-in
//        Comdr 指令: 实接 ~/.pandacc/agents/*.md (frontmatter parser) → AgentDefinition[]
//        v2.27.1: 完整 CRUD via bridge.agents.* IPC
// Output: agent groups + selected agent detail + create/update/delete actions
// Pos: State layer — drives PdAgentsSettings list/detail/editor
//
// Source 1:1: cc-haha desktop/src/stores/agentStore.ts shape
//   panda IPC: bridge.listAgentsPandacc() 走 main 进程读 ~/.pandacc/agents/*.md，解析 frontmatter，
//   全部映射为 source='userSettings' 的 AgentDefinition（panda 当前只支持用户级 agents）。
//   v2.27.1: create/update/delete 改走 bridge.agents CRUD。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import type { AgentDefinition } from '../api/agents';
import {
  listAgentsPandacc,
  createAgentService,
  updateAgentService,
  deleteAgentService,
} from '../ipc/bridge';
import type { AgentServiceCreateInput, AgentServiceUpdateInput } from '../ipc/types';

export interface AgentStore {
  activeAgents: AgentDefinition[];
  allAgents: AgentDefinition[];
  selectedAgent: AgentDefinition | null;
  selectedAgentReturnTab: string | null;
  isLoading: boolean;
  error: string | null;

  fetchAgents: (cwd?: string) => Promise<void>;
  selectAgent: (agent: AgentDefinition | null, returnTab?: string) => void;
  createAgent: (input: AgentServiceCreateInput) => Promise<void>;
  updateAgent: (id: string, partial: AgentServiceUpdateInput) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentStore>()((set, _get) => ({
  activeAgents: [],
  allAgents: [],
  selectedAgent: null,
  selectedAgentReturnTab: null,
  isLoading: false,
  error: null,

  // Comdr 指令: 走 bridge.listAgentsPandacc() 真实读 ~/.pandacc/agents/*.md frontmatter。
  fetchAgents: async (_cwd) => {
    set({ isLoading: true, error: null });
    try {
      const items = await listAgentsPandacc();
      const allAgents: AgentDefinition[] = items.map((it) => ({
        agentType: it.name,
        source: 'userSettings',
        description: it.description,
        modelDisplay: it.model,
        isActive: true,
        tools: it.tools,
        baseDir: it.path,
      }));
      set({
        allAgents,
        activeAgents: allAgents.filter((a) => a.isActive),
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load agents',
      });
    }
  },

  selectAgent: (selectedAgent, returnTab) =>
    set({
      selectedAgent,
      selectedAgentReturnTab: returnTab ?? null,
    }),

  createAgent: async (input) => {
    set({ isLoading: true, error: null });
    try {
      await createAgentService(input);
      await useAgentStore.getState().fetchAgents();
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to create agent' });
      throw err;
    }
  },

  updateAgent: async (id, partial) => {
    set({ isLoading: true, error: null });
    try {
      await updateAgentService(id, partial);
      await useAgentStore.getState().fetchAgents();
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to update agent' });
      throw err;
    }
  },

  deleteAgent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteAgentService(id);
      await useAgentStore.getState().fetchAgents();
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to delete agent' });
      throw err;
    }
  },
}));
