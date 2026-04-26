// Input: cc-haha desktop/src/stores/teamStore.ts (1:1 形态) — IPC 降级 stub
// Output: Zustand store — TeamSummary list + active TeamDetail + member 会话操作（TeamStatusBar / AgentTeams 使用）
// Pos: State layer — drives components/teams/* + AgentTeams 页面
//
// Source: cc-haha desktop/src/stores/teamStore.ts L1-345 (345 行)
//   panda IPC 降级清单：
//     - cc-haha teamsApi.list / get / getMemberTranscript / sendMemberMessage 全部缺失
//       → 全部降级为空列表 + console.warn TODO；
//     - cc-haha mapHistoryMessagesToUiMessages / chatStore.sessions 状态同步：
//       panda chatStore 暂不接 team-member 会话（per-member sessionId 形态不同），
//       openMemberSession 仅切 tab；
//     - cc-haha startMemberPolling / stopMemberPolling: 保留接口，IPC 缺时 noop。
//   面向 UI 调用方维持完整方法签名，避免 NewTaskModal/TeamStatusBar/AgentTeams 编译错误。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import { useTabStore } from './tabStore';
import type { TeamDetail, TeamMember, TeamSummary, AgentColor } from '../types/team';
import { AGENT_COLORS } from '../types/team';

const memberSessionId = (agentId: string) => `team-member:${agentId}`;

let memberPollTimer: ReturnType<typeof setInterval> | null = null;
let polledMemberSessionId: string | null = null;

type TeamStore = {
  teams: TeamSummary[];
  activeTeam: TeamDetail | null;
  memberColors: Map<string, AgentColor>;
  error: string | null;

  fetchTeams: () => Promise<void>;
  fetchTeamDetail: (name: string) => Promise<void>;
  getMemberBySessionId: (sessionId: string) => TeamMember | null;
  refreshMemberSession: (sessionId: string) => Promise<void>;
  openMemberSession: (member: TeamMember) => void;
  sendMessageToMember: (sessionId: string, content: string) => Promise<void>;
  startMemberPolling: (sessionId: string, force?: boolean) => void;
  stopMemberPolling: () => void;
  clearTeam: () => void;

  handleTeamCreated: (teamName: string) => void;
  handleTeamUpdate: (teamName: string, members: Array<{
    agentId: string;
    role: string;
    status: string;
    currentTask?: string;
  }>) => void;
  handleTeamDeleted: (teamName: string) => void;
};

function normalizeMemberStatus(status: string | undefined): TeamMember['status'] {
  if (status === 'running' || status === 'idle' || status === 'completed') return status;
  return status === 'failed' ? 'error' : 'idle';
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  teams: [],
  activeTeam: null,
  memberColors: new Map(),
  error: null,

  // TODO(IPC): panda 缺 teamsApi.list;返回空数组。
  fetchTeams: async () => {
    set({ error: null, teams: [] });
  },

  // TODO(IPC): panda 缺 teamsApi.get;返回空详情。
  fetchTeamDetail: async (_name) => {
    set({ error: null });
    // No-op until panda exposes team IPC channels.
  },

  getMemberBySessionId: (sessionId: string) => {
    const team = get().activeTeam;
    if (!team) return null;
    return (
      team.members.find(
        (m) => m.sessionId === sessionId || memberSessionId(m.agentId) === sessionId,
      ) ?? null
    );
  },

  // TODO(IPC): panda 缺 teamsApi.getMemberTranscript;noop。
  refreshMemberSession: async (_sessionId) => {
    // panda chatStore 暂不接 team-member 会话状态注入。
  },

  openMemberSession: (member: TeamMember) => {
    const team = get().activeTeam;
    if (!team) return;
    get().stopMemberPolling();
    const tabId = memberSessionId(member.agentId);
    useTabStore.getState().openTab(tabId, member.role, 'session');
    void get().refreshMemberSession(tabId);
    get().startMemberPolling(tabId);
  },

  // TODO(IPC): panda 缺 teamsApi.sendMemberMessage;noop。
  sendMessageToMember: async (_sessionId, _content) => {
    console.warn('[teamStore] sendMessageToMember: IPC not implemented');
  },

  startMemberPolling: (sessionId, force = false) => {
    const member = get().getMemberBySessionId(sessionId);
    if (!member) return;
    if (!force && polledMemberSessionId === sessionId && memberPollTimer) return;
    if (member.status !== 'running') {
      get().stopMemberPolling();
      return;
    }
    get().stopMemberPolling();
    polledMemberSessionId = sessionId;
    memberPollTimer = setInterval(() => {
      const currentTabId = useTabStore.getState().activeTabId;
      if (currentTabId !== sessionId) {
        get().stopMemberPolling();
        return;
      }
      void get().refreshMemberSession(sessionId);
    }, 1500);
  },

  stopMemberPolling: () => {
    if (memberPollTimer) {
      clearInterval(memberPollTimer);
      memberPollTimer = null;
    }
    polledMemberSessionId = null;
  },

  clearTeam: () => {
    get().stopMemberPolling();
    set({ activeTeam: null, memberColors: new Map() });
  },

  handleTeamCreated: (teamName: string) => {
    set((s) => ({
      teams: [...s.teams, { name: teamName, memberCount: 0 }],
    }));
    void get().fetchTeamDetail(teamName);
  },

  handleTeamUpdate: (teamName: string, members) => {
    const team = get().activeTeam;
    if (!team || team.name !== teamName) return;
    if (members.length === 0) return;

    const colors = get().memberColors;
    const existingMap = new Map(team.members.map((m) => [m.agentId, m]));
    const incomingIds = new Set(members.map((m) => m.agentId));
    const kept = team.members.filter((m) => !incomingIds.has(m.agentId));
    const updatedMembers: TeamMember[] = [
      ...kept,
      ...members.map((m, i) => {
        const existing = existingMap.get(m.agentId);
        return {
          ...(existing ?? {}),
          name: existing?.name,
          agentId: m.agentId,
          role: m.role,
          status: normalizeMemberStatus(m.status),
          currentTask: m.currentTask,
          color: colors.get(m.agentId) ?? AGENT_COLORS[i % AGENT_COLORS.length]!,
          sessionId: existing?.sessionId,
        };
      }),
    ];
    set({ activeTeam: { ...team, members: updatedMembers } });
  },

  handleTeamDeleted: (teamName: string) => {
    get().stopMemberPolling();
    set((s) => ({
      teams: s.teams.filter((t) => t.name !== teamName),
      activeTeam: s.activeTeam?.name === teamName ? null : s.activeTeam,
    }));
  },
}));
