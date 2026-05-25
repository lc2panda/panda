// Input: sessionStore actions (createSession, deleteSession, renameSession, setActive)
// Output: state assertions validating session lifecycle
// Pos: test layer — validates sessionStore logic

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as bridge from '@/ipc/bridge';

// Mock bridge module — sessionStore calls bridge methods on init
let _mockIdCounter = 0;
vi.mock('@/ipc/bridge', () => ({
  isDevMode: () => true,
  createSession: vi.fn().mockImplementation(() =>
    Promise.resolve({ id: `00000000-0000-4000-8000-${String(++_mockIdCounter).padStart(12, '0')}` }),
  ),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  renameSession: vi.fn().mockResolvedValue(undefined),
  onSessionUpdated: vi.fn().mockReturnValue(() => {}),
  listSessions: vi.fn().mockResolvedValue([]),
  listAllSessions: vi.fn().mockImplementation(() => new Promise(() => {})),
  focusSession: vi.fn().mockResolvedValue(undefined),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import { useSessionStore } from '@/stores/sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    _mockIdCounter = 0;
    localStorageMock.clear();
    useSessionStore.setState({ sessions: [], activeSessionId: null, isLoading: false, error: null });
    vi.mocked(bridge.focusSession).mockClear();
  });

  it('starts with empty sessions', () => {
    const { sessions, activeSessionId } = useSessionStore.getState();
    expect(sessions).toEqual([]);
    expect(activeSessionId).toBeNull();
  });

  it('createSession adds a session and sets it active', async () => {
    const session = await useSessionStore.getState().createSession('Test Session');

    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].name).toBe('Test Session');
    expect(state.sessions[0].id).toBe('00000000-0000-4000-8000-000000000001');
    expect(state.activeSessionId).toBe(session.id);
  });

  it('deleteSession removes the session', async () => {
    const s1 = await useSessionStore.getState().createSession('S1');
    await useSessionStore.getState().createSession('S2');
    expect(useSessionStore.getState().sessions).toHaveLength(2);

    await useSessionStore.getState().deleteSession(s1.id);

    const remaining = useSessionStore.getState().sessions;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('S2');
  });

  it('renameSession updates the session name', async () => {
    const session = await useSessionStore.getState().createSession('Original');
    await useSessionStore.getState().renameSession(session.id, 'Renamed');

    const updated = useSessionStore.getState().sessions.find(s => s.id === session.id);
    expect(updated?.name).toBe('Renamed');
  });

  it('setActive switches the active session', async () => {
    const s1 = await useSessionStore.getState().createSession('S1');
    const s2 = await useSessionStore.getState().createSession('S2');

    // After creating s2, activeId should be s2
    expect(useSessionStore.getState().activeSessionId).toBe(s2.id);

    useSessionStore.getState().setActive(s1.id);
    expect(useSessionStore.getState().activeSessionId).toBe(s1.id);
  });

  it('does not focus CLI for non-UUID historical sessions', () => {
    useSessionStore.setState({
      sessions: [{
        id: 'desk-debug-local',
        name: 'Historical',
        cwd: '/tmp',
        createdAt: '2026-05-25T08:55:25.000Z',
        lastActive: '2026-05-25T08:55:25.000Z',
        messageCount: 1,
      }],
      activeSessionId: null,
    });

    useSessionStore.getState().setActiveSession('desk-debug-local');

    expect(useSessionStore.getState().activeSessionId).toBe('desk-debug-local');
    expect(bridge.focusSession).not.toHaveBeenCalled();
  });
});
