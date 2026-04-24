// Input: Session metadata from CLI bridge (list, create, delete events) + IPC bridge sync + disk sessions
// Output: Session list with metadata for sidebar rendering
// Pos: State layer — drives sidebar session list, session switching

import { create } from 'zustand';
import { storage } from '../lib/storage';
import * as bridge from '../ipc/bridge';
import { t } from '../i18n';
import type { DiskSessionMeta } from '../ipc/types';

// ---------------------------------------------------------------------------
// Types
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
  sessions: SessionMeta[];
  activeId: string | null;
  isLoading: boolean;
  error: string | null;
  projectFilter: string | null; // null = all projects

  // Actions
  setSessions: (sessions: SessionMeta[]) => void;
  addSession: (session: SessionMeta) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<SessionMeta>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Session management
  setActive: (sessionId: string) => void;
  createSession: (name?: string) => Promise<SessionMeta>;
  duplicateSession: (sessionId: string) => Promise<SessionMeta | null>;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => void;
  togglePin: (sessionId: string) => void;
  archiveSession: (sessionId: string) => void;
  setProjectFilter: (project: string | null) => void;

  // Persistence
  loadSessions: () => void;
  saveSessions: () => void;
  /** Load sessions from .pandacc disk via IPC, merge with localStorage list. */
  loadSessionsFromDisk: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSIONS_KEY = 'sessions';
const ACTIVE_ID_KEY = 'sessions:activeId';

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSessionStore = create<SessionStore>()((set, get) => ({
  sessions: [],
  activeId: null,
  isLoading: false,
  error: null,
  projectFilter: null,

  setSessions: (sessions) => {
    set({ sessions: Array.isArray(sessions) ? sessions : [], isLoading: false, error: null });
    get().saveSessions();
  },

  addSession: (session) => {
    set((state) => ({ sessions: [...(Array.isArray(state.sessions) ? state.sessions : []), session] }));
    get().saveSessions();
  },

  removeSession: (sessionId) => {
    set((state) => {
      const list = Array.isArray(state.sessions) ? state.sessions : [];
      return {
        sessions: list.filter((s) => s.id !== sessionId),
        activeId: state.activeId === sessionId ? (list[0]?.id ?? null) : state.activeId,
      };
    });
    get().saveSessions();
  },

  updateSession: (sessionId, updates) => {
    set((state) => ({
      sessions: (Array.isArray(state.sessions) ? state.sessions : []).map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s,
      ),
    }));
    get().saveSessions();
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setActive: (sessionId) => {
    set({ activeId: sessionId });
    storage.set(ACTIVE_ID_KEY, sessionId);
    bridge.focusSession(sessionId).catch((err: unknown) => {
      console.error('[sessionStore] bridge.focusSession failed:', err);
    });
  },

  createSession: async (name?: string) => {
    const now = new Date().toISOString();
    const displayName = name ?? t('session.defaultName');

    // Create session in backend first to get the authoritative UUID
    const response = await bridge.createSession('', displayName);

    const session: SessionMeta = {
      id: response.id,
      name: displayName,
      cwd: '',
      createdAt: now,
      lastActive: now,
      messageCount: 0,
    };
    set((state) => ({
      sessions: [session, ...(Array.isArray(state.sessions) ? state.sessions : [])],
      activeId: session.id,
    }));
    get().saveSessions();
    return session;
  },

  duplicateSession: async (sessionId) => {
    const { sessions } = get();
    const list = Array.isArray(sessions) ? sessions : [];
    const source = list.find((s) => s.id === sessionId);
    if (!source) return null;
    const duplicated = await get().createSession(`${source.name} (copy)`);
    return duplicated;
  },

  deleteSession: (sessionId) => {
    const { sessions, activeId } = get();
    const list = Array.isArray(sessions) ? sessions : [];
    const remaining = list.filter((s) => s.id !== sessionId);
    const newActiveId =
      activeId === sessionId
        ? (remaining[0]?.id ?? null)
        : activeId;
    set({ sessions: remaining, activeId: newActiveId });
    // Sync to backend via IPC bridge
    bridge.deleteSession(sessionId).catch((err: unknown) => {
      console.error('[sessionStore] bridge.deleteSession failed:', err);
    });
    get().saveSessions();
  },

  renameSession: (sessionId, name) => {
    set((state) => ({
      sessions: (Array.isArray(state.sessions) ? state.sessions : []).map((s) =>
        s.id === sessionId ? { ...s, name } : s,
      ),
    }));
    // Sync to backend via IPC bridge
    bridge.renameSession(sessionId, name).catch((err: unknown) => {
      console.error('[sessionStore] bridge.renameSession failed:', err);
    });
    get().saveSessions();
  },

  togglePin: (sessionId) => {
    set((state) => ({
      sessions: (Array.isArray(state.sessions) ? state.sessions : []).map((s) =>
        s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s,
      ),
    }));
    get().saveSessions();
  },

  archiveSession: (sessionId) => {
    set((state) => ({
      sessions: (Array.isArray(state.sessions) ? state.sessions : []).map((s) =>
        s.id === sessionId ? { ...s, archived: !s.archived } : s,
      ),
    }));
    get().saveSessions();
  },

  setProjectFilter: (project) => {
    set({ projectFilter: project });
  },

  loadSessions: () => {
    const saved = storage.get<SessionMeta[]>(SESSIONS_KEY, []);
    const list = Array.isArray(saved) ? saved : [];
    const activeId = storage.get<string | null>(ACTIVE_ID_KEY, null);
    set({
      sessions: list,
      activeId: activeId && list.some((s) => s.id === activeId) ? activeId : (list[0]?.id ?? null),
      isLoading: false,
    });
  },

  saveSessions: () => {
    const { sessions, activeId } = get();
    storage.set(SESSIONS_KEY, sessions);
    storage.set(ACTIVE_ID_KEY, activeId);
  },

  loadSessionsFromDisk: async () => {
    try {
      const diskSessions: DiskSessionMeta[] = await bridge.listAllSessions();
      if (!diskSessions.length) return;

      // Convert DiskSessionMeta → SessionMeta
      const converted: SessionMeta[] = diskSessions.map((ds) => ({
        id: ds.id,
        name: ds.title,
        cwd: ds.workDir ?? ds.projectPath,
        createdAt: ds.lastModified, // disk doesn't track creation separately
        lastActive: ds.lastModified,
        messageCount: ds.messageCount,
        isDiskSession: true,
      }));

      const { sessions: existing } = get();
      // Merge: disk sessions take priority (by id), then append any local-only sessions
      const diskIds = new Set(converted.map((s) => s.id));
      const localOnly = existing.filter((s) => !diskIds.has(s.id));
      const merged = [...converted, ...localOnly].sort(
        (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
      );

      set({ sessions: merged });
      // Persist the merged list to localStorage as well
      get().saveSessions();
    } catch (err) {
      console.error('[sessionStore] Failed to load sessions from disk:', err);
    }
  },
}));

// ---------------------------------------------------------------------------
// Bridge event wiring — connects IPC session events to store
// ---------------------------------------------------------------------------

let sessionBridgeInitialized = false;

/**
 * Setup IPC bridge listeners for session management.
 * Call once at app initialization (after setupBridgeListeners).
 */
export function setupSessionBridge(): void {
  if (sessionBridgeInitialized) return;
  sessionBridgeInitialized = true;

  // Listen for session-list updates pushed from main process
  bridge.onSessionUpdated((payload) => {
    const { sessions } = payload as { sessions: SessionMeta[] };
    useSessionStore.getState().setSessions(sessions);
  });

  // In production, fetch initial session list from backend
  if (!bridge.isDevMode()) {
    bridge.listSessions()
      .then((list) => {
        if (list.length > 0) {
          useSessionStore.getState().setSessions(list as unknown as SessionMeta[]);
        } else {
          // Backend has no sessions (fresh restart) but frontend may have
          // persisted sessions from a previous run.  Focus the active one so
          // the backend's ensureSession() re-materialises it.
          const { activeId } = useSessionStore.getState();
          if (activeId) {
            console.log('[sessionStore] Backend empty, re-materialising active session:', activeId);
            bridge.focusSession(activeId).catch((err: unknown) =>
              console.warn('[sessionStore] Failed to re-materialise session:', err),
            );
          }
        }
      })
      .catch((err: unknown) => console.error('[sessionStore] listSessions failed:', err));
  }
}

// Auto-load on module init
useSessionStore.getState().loadSessions();
