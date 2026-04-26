// Input: cc-haha desktop/src/types/team.ts — 1:1 复刻 + panda 历史 AgentTeam/AgentMember 扩展
// Output: AgentTeam / AgentMember / TeamSummary / TeamDetail / TeamMember / AgentColor / AGENT_LIFECYCLE_TYPES
// Pos: Type foundation — teamStore / TeamStatusBar / AgentTeams 页面使用
//
// Source: cc-haha desktop/src/types/team.ts (39 行) — TeamSummary/TeamDetail/TeamMember/AgentColor
//   panda 历史 AgentTeam/AgentMember 字段保留以兼容老组件；
//   cc-haha AGENT_LIFECYCLE_TYPES 是 Set<string>，panda 此前用 readonly tuple — 保留 panda 形态。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

export const AGENT_LIFECYCLE_TYPES = [
  'launch_agent',
  'exit_agent',
  'agent_lifecycle',
] as const;

export type AgentLifecycleType = (typeof AGENT_LIFECYCLE_TYPES)[number];

// ─── cc-haha team types (1:1) ────────────────────────────────────────────────

export type AgentColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan';

export const AGENT_COLORS: AgentColor[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'cyan',
];

export type TeamSummary = {
  name: string;
  memberCount: number;
  createdAt?: string;
};

export type TeamMember = {
  agentId: string;
  name?: string;
  role: string;
  status: 'running' | 'idle' | 'completed' | 'error';
  currentTask?: string;
  color?: AgentColor;
  sessionId?: string;
};

export type TeamDetail = {
  name: string;
  leadAgentId?: string;
  leadSessionId?: string;
  members: TeamMember[];
  createdAt?: string;
};

// ─── panda 历史类型（保留以兼容老组件）─────────────────────────────────────

export type AgentMember = {
  agentId: string;
  role: string;
  sessionId?: string;
  status: 'running' | 'idle' | 'completed' | 'error';
  currentTask?: string;
};

export type AgentTeam = {
  name: string;
  leadSessionId?: string;
  members: AgentMember[];
  createdAt: string;
};
