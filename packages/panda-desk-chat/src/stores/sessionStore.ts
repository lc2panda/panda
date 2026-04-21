// Input: Session metadata from CLI bridge (list, create, delete events) + IPC bridge sync
// Output: Session list with metadata for sidebar rendering
// Pos: State layer — drives sidebar session list, session switching

import { create } from 'zustand';
import { storage } from '../lib/storage';
import * as bridge from '../ipc/bridge';

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
}

export interface SessionStore {
  sessions: SessionMeta[];
  activeId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSessions: (sessions: SessionMeta[]) => void;
  addSession: (session: SessionMeta) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<SessionMeta>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Session management
  setActive: (sessionId: string) => void;
  createSession: (name?: string) => SessionMeta;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => void;

  // Persistence
  loadSessions: () => void;
  saveSessions: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSIONS_KEY = 'sessions';
const ACTIVE_ID_KEY = 'sessions:activeId';

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let _nextId = 1;
function generateSessionId(): string {
  return `session-${Date.now()}-${_nextId++}`;
}

export const useSessionStore = create<SessionStore>()((set, get) => ({
  sessions: [],
  activeId: null,
  isLoading: false,
  error: null,

  setSessions: (sessions) => {
    set({ sessions, isLoading: false, error: null });
    get().saveSessions();
  },

  addSession: (session) => {
    set((state) => ({ sessions: [...state.sessions, session] }));
    get().saveSessions();
  },

  removeSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeId: state.activeId === sessionId ? (state.sessions[0]?.id ?? null) : state.activeId,
    }));
    get().saveSessions();
  },

  updateSession: (sessionId, updates) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
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

  createSession: (name?: string) => {
    const now = new Date().toISOString();
    const session: SessionMeta = {
      id: generateSessionId(),
      name: name ?? `New Chat`,
      cwd: '',
      createdAt: now,
      lastActive: now,
      messageCount: 0,
    };
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeId: session.id,
    }));
    get().saveSessions();
    // Sync to backend via IPC bridge
    bridge.createSession(session.cwd || '', session.name).catch((err: unknown) => {
      console.error('[sessionStore] bridge.createSession failed:', err);
    });
    return session;
  },

  deleteSession: (sessionId) => {
    const { sessions, activeId } = get();
    const remaining = sessions.filter((s) => s.id !== sessionId);
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
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, name } : s,
      ),
    }));
    // Sync to backend via IPC bridge
    bridge.renameSession(sessionId, name).catch((err: unknown) => {
      console.error('[sessionStore] bridge.renameSession failed:', err);
    });
    get().saveSessions();
  },

  loadSessions: () => {
    const saved = storage.get<SessionMeta[]>(SESSIONS_KEY, []);
    const activeId = storage.get<string | null>(ACTIVE_ID_KEY, null);
    set({
      sessions: saved,
      activeId: activeId && saved.some((s) => s.id === activeId) ? activeId : (saved[0]?.id ?? null),
      isLoading: false,
    });
  },

  saveSessions: () => {
    const { sessions, activeId } = get();
    storage.set(SESSIONS_KEY, sessions);
    storage.set(ACTIVE_ID_KEY, activeId);
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
        }
      })
      .catch((err: unknown) => console.error('[sessionStore] listSessions failed:', err));
  }
}

// Auto-load on module init
useSessionStore.getState().loadSessions();
