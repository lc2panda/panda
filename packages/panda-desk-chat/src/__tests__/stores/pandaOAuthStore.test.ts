// Input: mocked bridge.getOAuthStatus responses
// Output: state assertions for usePandaOAuthStore.refreshStatus
// Pos: test layer — validates pandaOAuthStore IPC-backed refresh logic

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { OAuthStatus } from '@/ipc/types';

const mockGetOAuthStatus = vi.fn<() => Promise<OAuthStatus>>();

vi.mock('@/ipc/bridge', () => ({
  getOAuthStatus: mockGetOAuthStatus,
  isDevMode: () => false,
}));

import { usePandaOAuthStore } from '@/stores/pandaOAuthStore';

const AUTHENTICATED: OAuthStatus = {
  authenticated: true,
  source: 'config',
  email: 'user@example.com',
  displayName: 'Test User',
  organizationName: 'Test Org',
  accountUuid: 'uuid-abc',
};

const UNAUTHENTICATED: OAuthStatus = {
  authenticated: false,
  source: 'none',
  reason: 'no-config',
};

describe('usePandaOAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state between tests
    usePandaOAuthStore.setState({ status: null, isLoading: false, error: null });
  });

  it('starts with null status and isLoading=false', () => {
    const state = usePandaOAuthStore.getState();
    expect(state.status).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('refreshStatus sets status to authenticated result on success', async () => {
    mockGetOAuthStatus.mockResolvedValueOnce(AUTHENTICATED);

    await usePandaOAuthStore.getState().refreshStatus();

    const state = usePandaOAuthStore.getState();
    expect(state.status).toEqual(AUTHENTICATED);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('refreshStatus sets status to unauthenticated result on no-config', async () => {
    mockGetOAuthStatus.mockResolvedValueOnce(UNAUTHENTICATED);

    await usePandaOAuthStore.getState().refreshStatus();

    const state = usePandaOAuthStore.getState();
    expect(state.status).toEqual(UNAUTHENTICATED);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('refreshStatus sets error and fallback unauthenticated status on bridge throw', async () => {
    mockGetOAuthStatus.mockRejectedValueOnce(new Error('IPC unavailable'));

    await usePandaOAuthStore.getState().refreshStatus();

    const state = usePandaOAuthStore.getState();
    expect(state.status).toEqual({ authenticated: false, source: 'none', reason: 'parse-error' });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('IPC unavailable');
  });

  it('passes optional configDir through to getOAuthStatus', async () => {
    mockGetOAuthStatus.mockResolvedValueOnce(UNAUTHENTICATED);

    await usePandaOAuthStore.getState().refreshStatus('/custom/config');

    expect(mockGetOAuthStatus).toHaveBeenCalledWith('/custom/config');
  });
});
