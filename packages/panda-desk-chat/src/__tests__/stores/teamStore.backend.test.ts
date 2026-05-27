// Input: mocked bridge.createTeamService / updateTeamService / deleteTeamService
// Output: vitest 用例覆盖 teamStore.createTeam / updateTeam / deleteTeam 透传 bridge
// Pos: packages/panda-desk-chat/src/__tests__/stores — v2.27.1 teamStore CRUD 单测

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── mock bridge ──────────────────────────────────────────────────────────────
const mockCreateTeamService = vi.fn();
const mockUpdateTeamService = vi.fn();
const mockDeleteTeamService = vi.fn();

vi.mock('@/ipc/bridge', () => ({
  createTeamService: (...args: unknown[]) => mockCreateTeamService(...args),
  updateTeamService: (...args: unknown[]) => mockUpdateTeamService(...args),
  deleteTeamService: (...args: unknown[]) => mockDeleteTeamService(...args),
  // 其他 bridge 函数（teamStore 未使用的）
  listAgentsPandacc: vi.fn().mockResolvedValue([]),
  createAgentService: vi.fn(),
  updateAgentService: vi.fn(),
  deleteAgentService: vi.fn(),
  listTeamsService: vi.fn().mockResolvedValue([]),
  getTeamService: vi.fn().mockResolvedValue(null),
}));

// mock tabStore（openMemberSession 依赖）
vi.mock('@/stores/tabStore', () => ({
  useTabStore: {
    getState: () => ({
      openTab: vi.fn(),
      activeTabId: null,
    }),
  },
}));

import { useTeamStore } from '../../stores/teamStore';

const SAMPLE_TEAM_REC = {
  id: 'team-x',
  path: '/home/.pandacc/teams/team-x',
  displayName: 'Team X',
  description: 'Test',
  members: ['agent-a'],
  coordinator: 'agent-a',
  settings: {},
  hasConfig: true,
};

function makeSummary(name: string) {
  return {
    name,
    path: `/home/.pandacc/teams/${name}`,
    memberCount: 0,
    members: [],
    activeMembers: 0,
    lastActivityAt: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useTeamStore.setState({
    teams: [],
    activeTeam: null,
    memberColors: new Map(),
    error: null,
  });
  // fetchTeams is a noop stub — no additional mock needed
});

// ─── createTeam ───────────────────────────────────────────────────────────────
describe('teamStore.createTeam', () => {
  it('calls createTeamService and appends to teams', async () => {
    mockCreateTeamService.mockResolvedValueOnce(SAMPLE_TEAM_REC);
    await useTeamStore.getState().createTeam({ displayName: 'Team X', members: ['agent-a'] });
    expect(mockCreateTeamService).toHaveBeenCalledWith({ displayName: 'Team X', members: ['agent-a'] });
    const state = useTeamStore.getState();
    expect(state.teams).toHaveLength(1);
    expect(state.teams[0]!.name).toBe('team-x');
  });

  it('propagates error from bridge', async () => {
    mockCreateTeamService.mockRejectedValueOnce(new Error('create failed'));
    await expect(useTeamStore.getState().createTeam({ displayName: 'Bad' })).rejects.toThrow('create failed');
  });

  it('does not append duplicate when called twice', async () => {
    mockCreateTeamService
      .mockResolvedValueOnce(SAMPLE_TEAM_REC)
      .mockResolvedValueOnce({ ...SAMPLE_TEAM_REC, id: 'team-y', displayName: 'Team Y' });
    await useTeamStore.getState().createTeam({ displayName: 'Team X' });
    await useTeamStore.getState().createTeam({ displayName: 'Team Y' });
    expect(useTeamStore.getState().teams).toHaveLength(2);
  });
});

// ─── updateTeam ───────────────────────────────────────────────────────────────
describe('teamStore.updateTeam', () => {
  it('calls updateTeamService with id and partial', async () => {
    mockUpdateTeamService.mockResolvedValueOnce({ ...SAMPLE_TEAM_REC, description: 'Updated' });
    await useTeamStore.getState().updateTeam('team-x', { description: 'Updated' });
    expect(mockUpdateTeamService).toHaveBeenCalledWith('team-x', { description: 'Updated' });
    // fetchTeams is noop — teams stay empty (no regression)
  });

  it('propagates error from bridge', async () => {
    mockUpdateTeamService.mockRejectedValueOnce(new Error('update failed'));
    await expect(useTeamStore.getState().updateTeam('team-x', {})).rejects.toThrow('update failed');
  });
});

// ─── deleteTeam ───────────────────────────────────────────────────────────────
describe('teamStore.deleteTeam', () => {
  it('calls deleteTeamService and removes from teams', async () => {
    useTeamStore.setState({ teams: [makeSummary('team-x') as unknown as ReturnType<typeof makeSummary>] as never[] });
    mockDeleteTeamService.mockResolvedValueOnce({ ok: true });
    await useTeamStore.getState().deleteTeam('team-x');
    expect(mockDeleteTeamService).toHaveBeenCalledWith('team-x');
    expect(useTeamStore.getState().teams).toHaveLength(0);
  });

  it('does not remove when ok:false', async () => {
    useTeamStore.setState({ teams: [makeSummary('team-x') as unknown as ReturnType<typeof makeSummary>] as never[] });
    mockDeleteTeamService.mockResolvedValueOnce({ ok: false });
    await useTeamStore.getState().deleteTeam('team-x');
    expect(useTeamStore.getState().teams).toHaveLength(1);
  });

  it('propagates error from bridge', async () => {
    mockDeleteTeamService.mockRejectedValueOnce(new Error('delete failed'));
    await expect(useTeamStore.getState().deleteTeam('team-x')).rejects.toThrow('delete failed');
  });

  it('clears activeTeam if it matches deleted id', async () => {
    // handleTeamDeleted checks s.activeTeam?.name === teamName
    // TeamDetail.name is the team directory slug (same as id)
    useTeamStore.setState({
      teams: [makeSummary('team-x') as unknown as ReturnType<typeof makeSummary>] as never[],
      activeTeam: { ...SAMPLE_TEAM_REC, name: 'team-x', members: [] } as unknown as never,
    });
    mockDeleteTeamService.mockResolvedValueOnce({ ok: true });
    await useTeamStore.getState().deleteTeam('team-x');
    expect(useTeamStore.getState().activeTeam).toBeNull();
  });
});

// ─── handleTeamDeleted ────────────────────────────────────────────────────────
describe('teamStore.handleTeamDeleted', () => {
  it('removes team from list', () => {
    useTeamStore.setState({
      teams: [makeSummary('a'), makeSummary('b')] as unknown[] as never[],
    });
    useTeamStore.getState().handleTeamDeleted('a');
    expect(useTeamStore.getState().teams).toHaveLength(1);
    expect(useTeamStore.getState().teams[0]!.name).toBe('b');
  });
});
