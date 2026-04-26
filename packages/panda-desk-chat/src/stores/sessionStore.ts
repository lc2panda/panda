// Input: 会话事件（CLI bridge / IPC / 磁盘扫描）+ 用户操作（创建/删除/重命名）
// Output: 会话列表 + 活跃 id + 项目过滤 + 加载状态 — 驱动 PdSidebar / TabBar
// Pos: State layer — drives sidebar session list, session switching
//
// Source 1:1: cc-haha desktop/src/stores/sessionStore.ts (105 行)
//   字段名 / action 名 / action 顺序与 cc-haha 完全一致；
//   panda IPC bridge 替换 cc-haha sessionsApi；
//   panda 扩展（projectFilter / loadSessionsFromDisk / saveSessions / pin/archive / setupSessionBridge）保留。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import { storage } from '../lib/storage';
import * as bridge from '../ipc/bridge';
import { t } from '../i18n';
import type { DiskSessionMeta } from '../ipc/types';
import type { SessionListItem } from '../types/session';

// ---------------------------------------------------------------------------
// Types — cc-haha 用 SessionListItem (L4)。panda 内部仍存 SessionMeta 形态
// （title↔name / modifiedAt↔lastActive 同构变换），保持下游兼容。
// ---------------------------------------------------------------------------

export interface SessionMeta {
  id: string;
  name: string;
  cwd: string;
  createdAt: string; // ISO 8601
  lastActive: string; // ISO 8601
  messageCount: number;
  isPinned?: boolean;
  archived?: boolean;
  /** Indicates session was loaded from .pandacc disk storage (not just localStorage). */
  isDiskSession?: boolean;
}

export interface SessionStore {
  // ── cc-haha L6-L21 字段 ─────────────────────────────────────────────────
  sessions: SessionMeta[];
  /** cc-haha activeSessionId（panda alias activeId 通过 getter 暴露）。 */
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  selectedProjects: string[];
  availableProjects: string[];

  /** panda 扩展：单选项目过滤（cc-haha 仅 selectedProjects 多选）。 */
  projectFilter: string | null;

  /** panda alias getter — activeId === activeSessionId（保留下游兼容）。 */
  readonly activeId: string | null;

  // ── cc-haha actions（顺序与 cc-haha 一致）───────────────────────────────
  // cc-haha L31-L49
  fetchSessions: (project?: string) => Promise<void>;
  // cc-haha L51-L74
  createSession: (workDirOrName?: string) => Promise<SessionMeta>;
  // cc-haha L76-L83
  deleteSession: (id: string) => Promise<void>;
  // cc-haha L85-L92
  renameSession: (id: string, title: string) => Promise<void>;
  // cc-haha L94-L100
  updateSessionTitle: (id: string, title: string) => void;
  // cc-haha L102
  setActiveSession: (id: string | null) => void;
  // cc-haha L103
  setSelectedProjects: (projects: string[]) => void;

  // ── panda 扩展 actions（保留向下兼容）────────────────────────────────────
  /** panda alias for setActiveSession。 */
  setActive: (id: string | null) => void;
  setSessions: (sessions: SessionMeta[]) => void;
  addSession: (session: SessionMeta) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<SessionMeta>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  duplicateSession: (sessionId: string) => Promise<SessionMeta | null>;
  togglePin: (sessionId: string) => void;
  archiveSession: (sessionId: string) => void;
  setProjectFilter: (project: string | null) => void;
  loadSessions: () => void;
  saveSessions: () => void;
  /** panda：从 .pandacc 磁盘读取并合并。 */
  loadSessionsFromDisk: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSIONS_KEY = 'sessions';
const ACTIVE_ID_KEY = 'sessions:activeId';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** cc-haha sessionsApi.list({ project?, limit }) → panda bridge.listAllSessions()。
 *
 *  关键：panda 有两套 session list IPC：
 *    - bridge.listSessions()    → cliManager 内存中的 active session（仅运行中的，通常 1 个）
 *    - bridge.listAllSessions() → disk-session-scanner 扫 ~/.pandacc/projects/**\/*.jsonl（全量历史）
 *  Sidebar 应该展示**全量磁盘会话**（cc-haha 默认行为），所以走 listAllSessions。
 *
 *  字段映射：DiskSessionMeta → SessionListItem
 *    DiskSessionMeta.lastModified → SessionListItem.modifiedAt (and createdAt fallback)
 *    DiskSessionMeta.workDir? → SessionListItem.workDir (fallback to projectPath)
 *    SessionListItem.workDirExists 默认 true（panda 暂无文件系统校验）。 */
async function ipcListSessions(): Promise<SessionListItem[]> {
  try {
    const disk = await bridge.listAllSessions();
    return disk.map((d): SessionListItem => ({
      id: d.id,
      title: d.title,
      createdAt: d.lastModified,
      modifiedAt: d.lastModified,
      messageCount: d.messageCount,
      projectPath: d.projectPath,
      workDir: d.workDir ?? d.projectPath ?? null,
      workDirExists: true,
    }));
  } catch (err) {
    // listAllSessions 失败时降级到 listSessions（cliManager 内存）
    console.warn('[sessionStore] listAllSessions failed, falling back to listSessions:', err);
    const res = await bridge.listSessions();
    const arr = Array.isArray(res)
      ? (res as unknown as SessionListItem[])
      : ((res as unknown as { sessions?: SessionListItem[] }).sessions ?? []);
    return arr;
  }
}

/** cc-haha SessionListItem → panda SessionMeta。 */
function toMeta(item: SessionListItem): SessionMeta {
  return {
    id: item.id,
    name: item.title || t('session.defaultName'),
    cwd: item.workDir ?? item.projectPath ?? '',
    createdAt: item.createdAt,
    lastActive: item.modifiedAt,
    messageCount: item.messageCount,
  };
}

function deriveProjects(list: SessionMeta[]): string[] {
  const set = new Set<string>();
  for (const s of list) {
    if (s.cwd) set.add(s.cwd);
  }
  return Array.from(set).sort();
}

// ---------------------------------------------------------------------------
// Store — cc-haha L23-L104（活字 1:1 + panda 扩展层叠加）
// ---------------------------------------------------------------------------

export const useSessionStore = create<SessionStore>()((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  error: null,
  selectedProjects: [],
  availableProjects: [],
  projectFilter: null,

  // panda alias — activeId === activeSessionId
  get activeId() {
    return get().activeSessionId;
  },

  // cc-haha L31-L49: fetchSessions
  fetchSessions: async (project?: string) => {
    set({ isLoading: true, error: null });
    try {
      const raw = await ipcListSessions();
      // Deduplicate by session ID — keep the most recently modified entry
      const byId = new Map<string, SessionListItem>();
      for (const s of raw) {
        const existing = byId.get(s.id);
        if (
          !existing ||
          new Date(s.modifiedAt) > new Date(existing.modifiedAt)
        ) {
          byId.set(s.id, s);
        }
      }
      let listItems = [...byId.values()];
      if (project) {
        listItems = listItems.filter((s) => s.projectPath === project);
      }
      const sessions = listItems.map(toMeta);
      const availableProjects = [
        ...new Set(listItems.map((s) => s.projectPath).filter(Boolean)),
      ].sort();
      set({ sessions, availableProjects, isLoading: false });
      get().saveSessions();
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  // cc-haha L51-L74: createSession(workDir?) — panda 兼容签名也接 name
  createSession: async (workDirOrName?: string) => {
    // panda 签名兼容：路径作 workDir，否则作 name；
    // panda IPC bridge.createSession(cwd, name) 双参；
    // 兼容现有 PdSidebar.handleNew()（无参）+ 测试 createSession('Test Session')。
    const arg = workDirOrName ?? '';
    const looksLikePath = arg.startsWith('/') || arg.startsWith('~');
    const workDir = looksLikePath ? arg : '';
    const displayName = looksLikePath
      ? t('session.defaultName')
      : arg || t('session.defaultName');

    const response = await bridge.createSession(workDir, displayName);
    const id = response.id;
    const now = new Date().toISOString();

    const optimistic: SessionMeta = {
      id,
      name: displayName,
      cwd: workDir,
      createdAt: now,
      lastActive: now,
      messageCount: 0,
    };

    set((state) => ({
      sessions: state.sessions.some((s) => s.id === id)
        ? state.sessions
        : [optimistic, ...state.sessions],
      activeSessionId: id,
    }));
    get().saveSessions();

    // cc-haha L72: void get().fetchSessions()
    void get().fetchSessions();
    return optimistic;
  },

  // cc-haha L76-L83: deleteSession（async）
  deleteSession: async (id: string) => {
    try {
      await bridge.deleteSession(id);
    } catch (err) {
      console.error('[sessionStore] bridge.deleteSession failed:', err);
    }
    set((s) => ({
      sessions: s.sessions.filter((session) => session.id !== id),
      activeSessionId:
        s.activeSessionId === id ? null : s.activeSessionId,
    }));
    get().saveSessions();
  },

  // cc-haha L85-L92: renameSession（async）
  renameSession: async (id: string, title: string) => {
    try {
      await bridge.renameSession(id, title);
    } catch (err) {
      console.error('[sessionStore] bridge.renameSession failed:', err);
    }
    set((s) => ({
      sessions: s.sessions.map((session) =>
        session.id === id ? { ...session, name: title } : session,
      ),
    }));
    get().saveSessions();
  },

  // cc-haha L94-L100: updateSessionTitle（仅本地）
  updateSessionTitle: (id, title) => {
    set((s) => ({
      sessions: s.sessions.map((session) =>
        session.id === id ? { ...session, name: title } : session,
      ),
    }));
    get().saveSessions();
  },

  // cc-haha L102: setActiveSession
  setActiveSession: (id) => {
    set({ activeSessionId: id });
    storage.set(ACTIVE_ID_KEY, id);
    if (id) {
      bridge.focusSession(id).catch((err: unknown) => {
        console.error('[sessionStore] bridge.focusSession failed:', err);
      });
    }
  },

  // cc-haha L103: setSelectedProjects
  setSelectedProjects: (projects) =>
    set({ selectedProjects: Array.isArray(projects) ? projects : [] }),

  // ── panda 扩展 actions ──────────────────────────────────────────────────
  setActive: (id) => {
    get().setActiveSession(id);
  },

  setSessions: (sessions) => {
    const list = Array.isArray(sessions) ? sessions : [];
    set({
      sessions: list,
      isLoading: false,
      error: null,
      availableProjects: deriveProjects(list),
    });
    get().saveSessions();
  },

  addSession: (session) => {
    set((state) => {
      const list = [
        ...(Array.isArray(state.sessions) ? state.sessions : []),
        session,
      ];
      return { sessions: list, availableProjects: deriveProjects(list) };
    });
    get().saveSessions();
  },

  removeSession: (sessionId) => {
    set((state) => {
      const list = Array.isArray(state.sessions) ? state.sessions : [];
      const next = list.filter((s) => s.id !== sessionId);
      return {
        sessions: next,
        activeSessionId:
          state.activeSessionId === sessionId
            ? next[0]?.id ?? null
            : state.activeSessionId,
        availableProjects: deriveProjects(next),
      };
    });
    get().saveSessions();
  },

  updateSession: (sessionId, updates) => {
    set((state) => ({
      sessions: (Array.isArray(state.sessions) ? state.sessions : []).map(
        (s) => (s.id === sessionId ? { ...s, ...updates } : s),
      ),
    }));
    get().saveSessions();
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  duplicateSession: async (sessionId) => {
    const list = Array.isArray(get().sessions) ? get().sessions : [];
    const source = list.find((s) => s.id === sessionId);
    if (!source) return null;
    return get().createSession(`${source.name} (copy)`);
  },

  togglePin: (sessionId) => {
    set((state) => ({
      sessions: (Array.isArray(state.sessions) ? state.sessions : []).map(
        (s) => (s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s),
      ),
    }));
    get().saveSessions();
  },

  archiveSession: (sessionId) => {
    set((state) => ({
      sessions: (Array.isArray(state.sessions) ? state.sessions : []).map(
        (s) => (s.id === sessionId ? { ...s, archived: !s.archived } : s),
      ),
    }));
    get().saveSessions();
  },

  setProjectFilter: (project) => set({ projectFilter: project }),

  loadSessions: () => {
    const saved = storage.get<SessionMeta[]>(SESSIONS_KEY, []);
    const list = Array.isArray(saved) ? saved : [];
    const persisted = storage.get<string | null>(ACTIVE_ID_KEY, null);
    set({
      sessions: list,
      activeSessionId:
        persisted && list.some((s) => s.id === persisted)
          ? persisted
          : list[0]?.id ?? null,
      isLoading: false,
      availableProjects: deriveProjects(list),
    });
  },

  saveSessions: () => {
    const { sessions, activeSessionId } = get();
    storage.set(SESSIONS_KEY, sessions);
    storage.set(ACTIVE_ID_KEY, activeSessionId);
  },

  loadSessionsFromDisk: async () => {
    try {
      const diskSessions: DiskSessionMeta[] = await bridge.listAllSessions();
      if (!diskSessions.length) return;

      const converted: SessionMeta[] = diskSessions.map((ds) => ({
        id: ds.id,
        name: ds.title,
        cwd: ds.workDir ?? ds.projectPath,
        createdAt: ds.lastModified,
        lastActive: ds.lastModified,
        messageCount: ds.messageCount,
        isDiskSession: true,
      }));

      const { sessions: existing } = get();
      const diskIds = new Set(converted.map((s) => s.id));
      const localOnly = existing.filter((s) => !diskIds.has(s.id));
      const merged = [...converted, ...localOnly].sort(
        (a, b) =>
          new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
      );

      set({
        sessions: merged,
        availableProjects: deriveProjects(merged),
      });
      get().saveSessions();
    } catch (err) {
      console.error(
        '[sessionStore] Failed to load sessions from disk:',
        err,
      );
    }
  },
}));

// ---------------------------------------------------------------------------
// Bridge event wiring — IPC session events → store
// ---------------------------------------------------------------------------

let sessionBridgeInitialized = false;

export function setupSessionBridge(): void {
  if (sessionBridgeInitialized) return;
  sessionBridgeInitialized = true;

  bridge.onSessionUpdated((payload) => {
    const { sessions: cliSessions } = (payload ?? {}) as {
      sessions?: SessionMeta[];
    };
    if (!Array.isArray(cliSessions)) return;
    const store = useSessionStore.getState();
    const existing = Array.isArray(store.sessions) ? store.sessions : [];
    const cliIds = new Set(cliSessions.map((s) => s.id));
    const merged = [
      ...cliSessions,
      ...existing.filter((s) => !cliIds.has(s.id)),
    ].sort(
      (a, b) =>
        new Date(b.lastActive ?? 0).getTime() -
        new Date(a.lastActive ?? 0).getTime(),
    );
    store.setSessions(merged);
  });

  if (!bridge.isDevMode()) {
    bridge
      .listSessions()
      .then((res) => {
        const list = Array.isArray(res)
          ? (res as unknown as SessionMeta[])
          : ((res as unknown as { sessions?: SessionMeta[] }).sessions ?? []);
        if (list.length > 0) {
          const store = useSessionStore.getState();
          const existing = Array.isArray(store.sessions) ? store.sessions : [];
          const cliIds = new Set(list.map((s) => s.id));
          const merged = [
            ...list,
            ...existing.filter((s) => !cliIds.has(s.id)),
          ].sort(
            (a, b) =>
              new Date(b.lastActive ?? 0).getTime() -
              new Date(a.lastActive ?? 0).getTime(),
          );
          store.setSessions(merged);
        } else {
          const { activeSessionId } = useSessionStore.getState();
          if (activeSessionId) {
            console.log(
              '[sessionStore] Backend empty, re-materialising active session:',
              activeSessionId,
            );
            bridge.focusSession(activeSessionId).catch((err: unknown) =>
              console.warn(
                '[sessionStore] Failed to re-materialise session:',
                err,
              ),
            );
          }
        }
      })
      .catch((err: unknown) =>
        console.error('[sessionStore] listSessions failed:', err),
      );
  }
}

// Auto-load on module init
useSessionStore.getState().loadSessions();

// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
