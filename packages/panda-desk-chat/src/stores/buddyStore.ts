// Input: tool calls, messages, session events from chatStore bridge listeners
// Output: buddy state (level, xp, milestones, achievements, events log)
// Pos: stores layer — drives PdBuddyEventCard and Inspector buddyLog tab
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type BuddyEventType =
  | 'milestone'
  | 'species_unlock'
  | 'holiday'
  | 'upgrade'
  | 'achievement';

export interface BuddyEvent {
  id: string;
  type: BuddyEventType;
  title: string;
  description: string;
  emoji: string;
  timestamp: number;
}

export interface BuddyMilestone {
  id: string;
  name: string;
  description: string;
  threshold: number;
  current: number;
  achieved: boolean;
  achievedAt?: number;
}

export interface BuddyStats {
  totalMessages: number;
  totalToolCalls: number;
  totalCodeLines: number;
  consecutiveDays: number;
  lastActiveDate: string; // YYYY-MM-DD for streak tracking
  firstToolUse: Record<string, boolean>; // toolName -> used
}

interface BuddyState {
  // Level system
  level: number;
  xp: number;
  xpToNextLevel: number;

  // Milestones
  milestones: BuddyMilestone[];

  // Achievements
  achievements: string[];

  // Event log
  events: BuddyEvent[];

  // Stats
  stats: BuddyStats;

  // Actions
  addXP: (amount: number, reason: string) => void;
  checkMilestones: () => void;
  recordToolUse: (toolName: string) => void;
  recordMessage: () => void;
  recordCodeLines: (lines: number) => void;
  getEventsForDisplay: () => BuddyEvent[];
  /** Returns events newer than the given timestamp */
  getEventsSince: (since: number) => BuddyEvent[];
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = 'panda-buddy-state';
const MAX_EVENTS = 100;

/** XP needed for next level: floor(100 * 1.5^(level-1)) */
function calcXPToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/* -------------------------------------------------------------------------- */
/*  Milestone definitions                                                     */
/* -------------------------------------------------------------------------- */

interface MilestoneDef {
  id: string;
  name: string;
  description: string;
  threshold: number;
  xpReward: number;
  /** Given stats, return current progress toward threshold */
  progress: (stats: BuddyStats) => number;
}

const MILESTONE_DEFS: MilestoneDef[] = [
  {
    id: 'first_message',
    name: '初次对话',
    description: '发送第一条消息',
    threshold: 1,
    xpReward: 10,
    progress: (s) => s.totalMessages,
  },
  {
    id: 'messages_10',
    name: '活跃交流者',
    description: '发送 10 条消息',
    threshold: 10,
    xpReward: 25,
    progress: (s) => s.totalMessages,
  },
  {
    id: 'messages_100',
    name: '深度对话者',
    description: '发送 100 条消息',
    threshold: 100,
    xpReward: 50,
    progress: (s) => s.totalMessages,
  },
  {
    id: 'first_tool',
    name: '工具初体验',
    description: '首次使用任意工具',
    threshold: 1,
    xpReward: 15,
    progress: (s) => s.totalToolCalls > 0 ? 1 : 0,
  },
  {
    id: 'tool_master',
    name: '工具大师',
    description: '使用 5 种不同工具',
    threshold: 5,
    xpReward: 50,
    progress: (s) => Object.keys(s.firstToolUse).length,
  },
  {
    id: 'code_100',
    name: '代码编写者',
    description: '编写 100 行代码',
    threshold: 100,
    xpReward: 30,
    progress: (s) => s.totalCodeLines,
  },
  {
    id: 'streak_3',
    name: '三日连续',
    description: '连续 3 天使用',
    threshold: 3,
    xpReward: 40,
    progress: (s) => s.consecutiveDays,
  },
  {
    id: 'streak_7',
    name: '周常用户',
    description: '连续 7 天使用',
    threshold: 7,
    xpReward: 80,
    progress: (s) => s.consecutiveDays,
  },
];

/* -------------------------------------------------------------------------- */
/*  localStorage persistence                                                  */
/* -------------------------------------------------------------------------- */

interface PersistedBuddyState {
  level: number;
  xp: number;
  xpToNextLevel: number;
  milestones: BuddyMilestone[];
  achievements: string[];
  events: BuddyEvent[];
  stats: BuddyStats;
}

function loadPersistedState(): Partial<PersistedBuddyState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedBuddyState;
  } catch {
    return null;
  }
}

function persistState(state: BuddyState): void {
  try {
    const data: PersistedBuddyState = {
      level: state.level,
      xp: state.xp,
      xpToNextLevel: state.xpToNextLevel,
      milestones: state.milestones,
      achievements: state.achievements,
      events: state.events.slice(-MAX_EVENTS),
      stats: state.stats,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/* -------------------------------------------------------------------------- */
/*  Streak calculation                                                        */
/* -------------------------------------------------------------------------- */

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function updateStreak(stats: BuddyStats): BuddyStats {
  const today = todayStr();
  if (stats.lastActiveDate === today) return stats;

  // Check if yesterday was the last active date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const consecutive = stats.lastActiveDate === yesterdayStr
    ? stats.consecutiveDays + 1
    : 1; // streak broken

  return { ...stats, consecutiveDays: consecutive, lastActiveDate: today };
}

/* -------------------------------------------------------------------------- */
/*  Initial milestones                                                        */
/* -------------------------------------------------------------------------- */

function buildInitialMilestones(persisted: BuddyMilestone[] | undefined): BuddyMilestone[] {
  const existing = new Map((persisted ?? []).map((m) => [m.id, m]));
  return MILESTONE_DEFS.map((def) => {
    const prev = existing.get(def.id);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      threshold: def.threshold,
      current: prev?.current ?? 0,
      achieved: prev?.achieved ?? false,
      achievedAt: prev?.achievedAt,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                     */
/* -------------------------------------------------------------------------- */

const persisted = loadPersistedState();

const defaultStats: BuddyStats = {
  totalMessages: 0,
  totalToolCalls: 0,
  totalCodeLines: 0,
  consecutiveDays: 0,
  lastActiveDate: '',
  firstToolUse: {},
};

export const useBuddyStore = create<BuddyState>((set, get) => ({
  level: persisted?.level ?? 1,
  xp: persisted?.xp ?? 0,
  xpToNextLevel: persisted?.xpToNextLevel ?? calcXPToNextLevel(1),
  milestones: buildInitialMilestones(persisted?.milestones),
  achievements: persisted?.achievements ?? [],
  events: persisted?.events ?? [],
  stats: persisted?.stats ? { ...defaultStats, ...persisted.stats } : { ...defaultStats },

  addXP: (amount, reason) => {
    set((state) => {
      let { xp, level, xpToNextLevel } = state;
      const events = [...state.events];

      xp += amount;

      // Level up loop (can gain multiple levels at once)
      while (xp >= xpToNextLevel) {
        xp -= xpToNextLevel;
        level += 1;
        xpToNextLevel = calcXPToNextLevel(level);

        // Emit level-up event
        events.push({
          id: crypto.randomUUID(),
          type: 'upgrade',
          title: `升级到 Lv.${level}!`,
          description: `${reason} — 经验值溢出升级`,
          emoji: '🎉',
          timestamp: Date.now(),
        });
      }

      // Trim events
      const trimmed = events.slice(-MAX_EVENTS);

      const next = { ...state, xp, level, xpToNextLevel, events: trimmed };
      persistState(next as BuddyState);
      return next;
    });
  },

  checkMilestones: () => {
    set((state) => {
      const { stats, milestones, events, achievements } = state;
      let changed = false;
      const updatedMilestones = milestones.map((m) => {
        const def = MILESTONE_DEFS.find((d) => d.id === m.id);
        if (!def || m.achieved) return m;

        const current = def.progress(stats);
        if (current !== m.current) changed = true;

        if (current >= m.threshold && !m.achieved) {
          changed = true;
          return { ...m, current, achieved: true, achievedAt: Date.now() };
        }
        return { ...m, current };
      });

      if (!changed) return state;

      // Collect newly achieved milestones
      const newlyAchieved = updatedMilestones.filter(
        (m) => m.achieved && !milestones.find((old) => old.id === m.id && old.achieved),
      );

      const newEvents = [...events];
      const newAchievements = [...achievements];
      let xpGain = 0;

      for (const m of newlyAchieved) {
        const def = MILESTONE_DEFS.find((d) => d.id === m.id);
        if (!def) continue;

        xpGain += def.xpReward;
        newAchievements.push(m.id);
        newEvents.push({
          id: crypto.randomUUID(),
          type: 'milestone',
          title: m.name,
          description: `${m.description} (+${def.xpReward} XP)`,
          emoji: '🏆',
          timestamp: Date.now(),
        });
      }

      const trimmed = newEvents.slice(-MAX_EVENTS);

      const next: Partial<BuddyState> = {
        milestones: updatedMilestones,
        events: trimmed,
        achievements: newAchievements,
      };
      persistState({ ...state, ...next } as BuddyState);

      // Apply XP gain after state update (to allow level-ups)
      if (xpGain > 0) {
        // We need to set milestones first, then add XP
        // Do a two-phase update: set milestones now, addXP will be called after
        setTimeout(() => get().addXP(xpGain, '里程碑奖励'), 0);
      }

      return next;
    });
  },

  recordToolUse: (toolName) => {
    set((state) => {
      const stats = {
        ...state.stats,
        totalToolCalls: state.stats.totalToolCalls + 1,
        firstToolUse: {
          ...state.stats.firstToolUse,
          [toolName]: true,
        },
      };
      const updated = updateStreak(stats);
      const next = { ...state, stats: updated };
      persistState(next as BuddyState);
      return { stats: updated };
    });
    // Check milestones after stats update
    setTimeout(() => get().checkMilestones(), 0);
  },

  recordMessage: () => {
    set((state) => {
      const stats = {
        ...state.stats,
        totalMessages: state.stats.totalMessages + 1,
      };
      const updated = updateStreak(stats);
      const next = { ...state, stats: updated };
      persistState(next as BuddyState);
      return { stats: updated };
    });
    // Check milestones after stats update
    setTimeout(() => get().checkMilestones(), 0);
  },

  recordCodeLines: (lines) => {
    set((state) => {
      const stats = {
        ...state.stats,
        totalCodeLines: state.stats.totalCodeLines + lines,
      };
      const next = { ...state, stats };
      persistState(next as BuddyState);
      return { stats };
    });
    setTimeout(() => get().checkMilestones(), 0);
  },

  getEventsForDisplay: () => {
    return get().events;
  },

  getEventsSince: (since) => {
    return get().events.filter((e) => e.timestamp > since);
  },
}));

/* -------------------------------------------------------------------------- */
/*  Subscribe safety-net: persist on every state change                       */
/* -------------------------------------------------------------------------- */

useBuddyStore.subscribe((state) => {
  persistState(state);
});
