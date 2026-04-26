// Input: agent definitions from cc-haha userSettings/projectSettings/localSettings/policySettings/plugin/flagSettings/built-in
//        Comdr 指令: 实接 ~/.pandacc/agents/*.md (frontmatter parser) → AgentDefinition[]
// Output: agent groups + selected agent detail for PdAgentsSettings
// Pos: State layer — drives PdAgentsSettings list/detail
//
// Source 1:1: cc-haha desktop/src/stores/agentStore.ts shape
//   panda IPC: bridge.listAgentsPandacc() 走 main 进程读 ~/.pandacc/agents/*.md，解析 frontmatter，
//   全部映射为 source='userSettings' 的 AgentDefinition（panda 当前只支持用户级 agents）。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import type { AgentDefinition } from '../api/agents';
import { listAgentsPandacc } from '../ipc/bridge';

export interface AgentStore {
  activeAgents: AgentDefinition[];
  allAgents: AgentDefinition[];
  selectedAgent: AgentDefinition | null;
  selectedAgentReturnTab: string | null;
  isLoading: boolean;
  error: string | null;

  fetchAgents: (cwd?: string) => Promise<void>;
  selectAgent: (agent: AgentDefinition | null, returnTab?: string) => void;
}

export const useAgentStore = create<AgentStore>()((set) => ({
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
}));
