// Input:  useComputerUseStore actions — loadPolicy/updatePolicy/pending approval CRUD
// Output: state assertions + bridge mock 验证
// Pos:    test layer — v2.27.1 computerUseStore 单测

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ComputerUsePolicy, ApprovalRequest } from '@/ipc/types';

// ---------------------------------------------------------------------------
// Mock bridge — factory form (no top-level variable references)
// ---------------------------------------------------------------------------

vi.mock('@/ipc/bridge', () => ({
  getComputerUsePolicy: vi.fn().mockResolvedValue({
    defaultAction: 'deny' as const,
    perActionRules: {},
    sessionWhitelist: [],
  }),
  updateComputerUsePolicy: vi.fn().mockResolvedValue({ ok: true }),
}));

// ---------------------------------------------------------------------------
// Import store AFTER mocks
// ---------------------------------------------------------------------------

import { useComputerUseStore } from '@/stores/computerUseStore';
import * as bridge from '@/ipc/bridge';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const mockPolicy: ComputerUsePolicy = {
  defaultAction: 'deny',
  perActionRules: {},
  sessionWhitelist: [],
};

const SAMPLE_REQUEST: ApprovalRequest = {
  action: 'click',
  payload: { x: 10, y: 20 },
  risk: 'low',
};

const SAMPLE_POLICY: ComputerUsePolicy = {
  defaultAction: 'allow',
  perActionRules: { execute: 'deny' },
  sessionWhitelist: ['session-abc'],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useComputerUseStore', () => {
  beforeEach(() => {
    useComputerUseStore.setState({
      policy: null,
      pendingApprovals: [],
      isLoading: false,
      error: null,
    });
    vi.mocked(bridge.getComputerUsePolicy).mockClear();
    vi.mocked(bridge.updateComputerUsePolicy).mockClear();
    vi.mocked(bridge.getComputerUsePolicy).mockResolvedValue(mockPolicy);
    vi.mocked(bridge.updateComputerUsePolicy).mockResolvedValue({ ok: true });
  });

  // ── loadPolicy ──────────────────────────────────────────────────────────

  it('loadPolicy → sets policy from bridge', async () => {
    await useComputerUseStore.getState().loadPolicy();
    const { policy, isLoading, error } = useComputerUseStore.getState();
    expect(policy).toEqual(mockPolicy);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
    expect(bridge.getComputerUsePolicy).toHaveBeenCalledOnce();
  });

  it('loadPolicy failure → sets error, isLoading=false', async () => {
    vi.mocked(bridge.getComputerUsePolicy).mockRejectedValueOnce(new Error('network error'));
    await useComputerUseStore.getState().loadPolicy();
    const { policy, isLoading, error } = useComputerUseStore.getState();
    expect(policy).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBe('network error');
  });

  // ── updatePolicy ─────────────────────────────────────────────────────────

  it('updatePolicy → updates state and returns { ok: true }', async () => {
    const result = await useComputerUseStore.getState().updatePolicy(SAMPLE_POLICY);
    const { policy, isLoading, error } = useComputerUseStore.getState();
    expect(result.ok).toBe(true);
    expect(policy).toEqual(SAMPLE_POLICY);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
    expect(bridge.updateComputerUsePolicy).toHaveBeenCalledWith(SAMPLE_POLICY);
  });

  it('updatePolicy failure → sets error, returns { ok: false }', async () => {
    vi.mocked(bridge.updateComputerUsePolicy).mockRejectedValueOnce(new Error('write failed'));
    const result = await useComputerUseStore.getState().updatePolicy(SAMPLE_POLICY);
    expect(result.ok).toBe(false);
    const { error, isLoading } = useComputerUseStore.getState();
    expect(error).toBe('write failed');
    expect(isLoading).toBe(false);
  });

  it('updatePolicy backend returns ok=false → sets error string', async () => {
    vi.mocked(bridge.updateComputerUsePolicy).mockResolvedValueOnce({ ok: false });
    const result = await useComputerUseStore.getState().updatePolicy(SAMPLE_POLICY);
    expect(result.ok).toBe(false);
    const { error } = useComputerUseStore.getState();
    expect(error).toBe('Policy update failed');
  });

  // ── addPendingApproval ───────────────────────────────────────────────────

  it('addPendingApproval → appends to pendingApprovals', () => {
    useComputerUseStore.getState().addPendingApproval(SAMPLE_REQUEST);
    const { pendingApprovals } = useComputerUseStore.getState();
    expect(pendingApprovals).toHaveLength(1);
    expect(pendingApprovals[0]).toEqual(SAMPLE_REQUEST);
  });

  it('addPendingApproval multiple → preserves order', () => {
    const req2: ApprovalRequest = { ...SAMPLE_REQUEST, action: 'screenshot', risk: 'medium' };
    useComputerUseStore.getState().addPendingApproval(SAMPLE_REQUEST);
    useComputerUseStore.getState().addPendingApproval(req2);
    const { pendingApprovals } = useComputerUseStore.getState();
    expect(pendingApprovals).toHaveLength(2);
    expect(pendingApprovals[0]?.action).toBe('click');
    expect(pendingApprovals[1]?.action).toBe('screenshot');
  });

  // ── approveRequest / denyRequest ─────────────────────────────────────────

  it('approveRequest removes item at index', () => {
    const req2: ApprovalRequest = { ...SAMPLE_REQUEST, action: 'screenshot', risk: 'medium' };
    useComputerUseStore.setState({ pendingApprovals: [SAMPLE_REQUEST, req2] });
    useComputerUseStore.getState().approveRequest(0);
    const { pendingApprovals } = useComputerUseStore.getState();
    expect(pendingApprovals).toHaveLength(1);
    expect(pendingApprovals[0]?.action).toBe('screenshot');
  });

  it('denyRequest removes item at index', () => {
    const req2: ApprovalRequest = { ...SAMPLE_REQUEST, action: 'keystroke', risk: 'low' };
    useComputerUseStore.setState({ pendingApprovals: [SAMPLE_REQUEST, req2] });
    useComputerUseStore.getState().denyRequest(1);
    const { pendingApprovals } = useComputerUseStore.getState();
    expect(pendingApprovals).toHaveLength(1);
    expect(pendingApprovals[0]?.action).toBe('click');
  });

  // ── dismissAll ───────────────────────────────────────────────────────────

  it('dismissAll clears all pending approvals', () => {
    useComputerUseStore.setState({ pendingApprovals: [SAMPLE_REQUEST, SAMPLE_REQUEST] });
    useComputerUseStore.getState().dismissAll();
    expect(useComputerUseStore.getState().pendingApprovals).toHaveLength(0);
  });

  // ── clearError ───────────────────────────────────────────────────────────

  it('clearError resets error to null', () => {
    useComputerUseStore.setState({ error: 'something went wrong' });
    useComputerUseStore.getState().clearError();
    expect(useComputerUseStore.getState().error).toBeNull();
  });
});
