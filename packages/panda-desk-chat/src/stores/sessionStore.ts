// Input: Session metadata from CLI bridge (list, create, delete events)
// Output: Session list with metadata for sidebar rendering
// Pos: State layer — drives sidebar session list, session switching

import { create } from 'zustand';

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
  isLoading: boolean;
  error: string | null;

  // Actions
  setSessions: (sessions: SessionMeta[]) => void;
  addSession: (session: SessionMeta) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<SessionMeta>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSessionStore = create<SessionStore>()((set) => ({
  sessions: [],
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions, isLoading: false, error: null }),

  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),

  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
    })),

  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s,
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
