// Input: mocked bridge.createAgentService / updateAgentService / deleteAgentService / listAgentsPandacc
// Output: vitest 用例覆盖 agentStore.createAgent / updateAgent / deleteAgent 透传 bridge
// Pos: packages/panda-desk-chat/src/__tests__/stores — v2.27.1 agentStore CRUD 单测

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── mock bridge ──────────────────────────────────────────────────────────────
const mockListAgentsPandacc = vi.fn();
const mockCreateAgentService = vi.fn();
const mockUpdateAgentService = vi.fn();
const mockDeleteAgentService = vi.fn();

vi.mock('@/ipc/bridge', () => ({
  listAgentsPandacc: (...args: unknown[]) => mockListAgentsPandacc(...args),
  createAgentService: (...args: unknown[]) => mockCreateAgentService(...args),
  updateAgentService: (...args: unknown[]) => mockUpdateAgentService(...args),
  deleteAgentService: (...args: unknown[]) => mockDeleteAgentService(...args),
}));

import { useAgentStore } from '../../stores/agentStore';

const SAMPLE_REC = {
  id: 'agent-x',
  path: '/home/.pandacc/agents/agent-x.md',
  name: 'Agent X',
  description: 'Test',
  model: 'fast',
  tools: ['Read'],
  maxTurns: 3,
  systemPrompt: 'Hello',
  meta: {},
};

function makeAgentDefinition(name: string) {
  return {
    agentType: name,
    source: 'userSettings' as const,
    description: 'Test',
    modelDisplay: 'fast',
    isActive: true,
    tools: ['Read'],
    baseDir: '/home/.pandacc/agents/',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useAgentStore.setState({
    allAgents: [],
    activeAgents: [],
    selectedAgent: null,
    selectedAgentReturnTab: null,
    isLoading: false,
    error: null,
  });
});

// ─── fetchAgents ──────────────────────────────────────────────────────────────
describe('agentStore.fetchAgents', () => {
  it('calls listAgentsPandacc and populates allAgents', async () => {
    const pandaccItem = { name: 'Agent X', description: 'Test', model: 'fast', tools: ['Read'], path: '/home/.pandacc/agents/' };
    mockListAgentsPandacc.mockResolvedValueOnce([pandaccItem]);
    await useAgentStore.getState().fetchAgents();
    const state = useAgentStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.allAgents).toHaveLength(1);
    expect(state.allAgents[0]!.agentType).toBe('Agent X');
  });

  it('sets error on failure', async () => {
    mockListAgentsPandacc.mockRejectedValueOnce(new Error('network error'));
    await useAgentStore.getState().fetchAgents();
    const state = useAgentStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('network error');
  });
});

// ─── createAgent ──────────────────────────────────────────────────────────────
describe('agentStore.createAgent', () => {
  it('calls createAgentService then fetchAgents', async () => {
    mockCreateAgentService.mockResolvedValueOnce(SAMPLE_REC);
    mockListAgentsPandacc.mockResolvedValueOnce([]);
    await useAgentStore.getState().createAgent({ name: 'Agent X' });
    expect(mockCreateAgentService).toHaveBeenCalledWith({ name: 'Agent X' });
    expect(mockListAgentsPandacc).toHaveBeenCalledOnce();
  });

  it('sets error and re-throws on failure', async () => {
    mockCreateAgentService.mockRejectedValueOnce(new Error('create failed'));
    mockListAgentsPandacc.mockResolvedValue([]);
    await expect(useAgentStore.getState().createAgent({ name: 'Bad' })).rejects.toThrow('create failed');
    expect(useAgentStore.getState().error).toBe('create failed');
  });
});

// ─── updateAgent ──────────────────────────────────────────────────────────────
describe('agentStore.updateAgent', () => {
  it('calls updateAgentService with id and partial', async () => {
    mockUpdateAgentService.mockResolvedValueOnce(SAMPLE_REC);
    mockListAgentsPandacc.mockResolvedValueOnce([]);
    await useAgentStore.getState().updateAgent('agent-x', { description: 'Updated' });
    expect(mockUpdateAgentService).toHaveBeenCalledWith('agent-x', { description: 'Updated' });
    expect(mockListAgentsPandacc).toHaveBeenCalledOnce();
  });

  it('sets error and re-throws on failure', async () => {
    mockUpdateAgentService.mockRejectedValueOnce(new Error('update failed'));
    mockListAgentsPandacc.mockResolvedValue([]);
    await expect(useAgentStore.getState().updateAgent('agent-x', {})).rejects.toThrow('update failed');
    expect(useAgentStore.getState().error).toBe('update failed');
  });
});

// ─── deleteAgent ──────────────────────────────────────────────────────────────
describe('agentStore.deleteAgent', () => {
  it('calls deleteAgentService and refetches', async () => {
    mockDeleteAgentService.mockResolvedValueOnce({ ok: true });
    mockListAgentsPandacc.mockResolvedValueOnce([]);
    useAgentStore.setState({ allAgents: [makeAgentDefinition('Agent X')], activeAgents: [makeAgentDefinition('Agent X')] });
    await useAgentStore.getState().deleteAgent('agent-x');
    expect(mockDeleteAgentService).toHaveBeenCalledWith('agent-x');
    expect(mockListAgentsPandacc).toHaveBeenCalledOnce();
  });

  it('sets error and re-throws on failure', async () => {
    mockDeleteAgentService.mockRejectedValueOnce(new Error('delete failed'));
    mockListAgentsPandacc.mockResolvedValue([]);
    await expect(useAgentStore.getState().deleteAgent('agent-x')).rejects.toThrow('delete failed');
    expect(useAgentStore.getState().error).toBe('delete failed');
  });
});

// ─── selectAgent ──────────────────────────────────────────────────────────────
describe('agentStore.selectAgent', () => {
  it('sets selectedAgent and returnTab', () => {
    const ag = makeAgentDefinition('Agent X');
    useAgentStore.getState().selectAgent(ag, 'settings');
    expect(useAgentStore.getState().selectedAgent).toEqual(ag);
    expect(useAgentStore.getState().selectedAgentReturnTab).toBe('settings');
  });

  it('clears selection when called with null', () => {
    useAgentStore.setState({ selectedAgent: makeAgentDefinition('Agent X') });
    useAgentStore.getState().selectAgent(null);
    expect(useAgentStore.getState().selectedAgent).toBeNull();
  });
});
