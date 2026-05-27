// Input:  ApprovalRequest + optional ~/.pandacc/computer-use-policy.json fixture
// Output: vitest 用例覆盖 allow/deny/prompt/timeout/missing-policy
// Pos:    packages/panda-desk-chat/electron/backend/__tests__ — v2.27.1 computerUseApprovalService 单测

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { computerUseApprovalService, type ApprovalRequest } from '../computer-use-approval-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOW_CLICK: ApprovalRequest = {
  action: 'click',
  payload: { x: 100, y: 200 },
  risk: 'low',
};

const HIGH_EXECUTE: ApprovalRequest = {
  action: 'execute',
  payload: { command: 'rm -rf /' },
  risk: 'high',
};

// ---------------------------------------------------------------------------
// Test: policy = 'allow' → auto-allow
// ---------------------------------------------------------------------------

describe('requestApproval — policy=allow', () => {
  beforeEach(() => {
    vi.spyOn(computerUseApprovalService as unknown as { getPolicy(): unknown }, 'getPolicy').mockResolvedValue({
      defaultAction: 'allow',
      perActionRules: {},
      sessionWhitelist: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns approved=true reason=auto-allow for any action', async () => {
    const result = await computerUseApprovalService.requestApproval(LOW_CLICK);
    expect(result.approved).toBe(true);
    expect(result.reason).toBe('auto-allow');
  });

  it('execute action also auto-allowed when policy=allow', async () => {
    const result = await computerUseApprovalService.requestApproval(HIGH_EXECUTE);
    expect(result.approved).toBe(true);
    expect(result.reason).toBe('auto-allow');
  });
});

// ---------------------------------------------------------------------------
// Test: policy = 'deny' → auto-deny
// ---------------------------------------------------------------------------

describe('requestApproval — policy=deny', () => {
  beforeEach(() => {
    vi.spyOn(computerUseApprovalService as unknown as { getPolicy(): unknown }, 'getPolicy').mockResolvedValue({
      defaultAction: 'deny',
      perActionRules: {},
      sessionWhitelist: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns approved=false reason=auto-deny', async () => {
    const result = await computerUseApprovalService.requestApproval(LOW_CLICK);
    expect(result.approved).toBe(false);
    expect(result.reason).toBe('auto-deny');
  });

  it('high-risk execute also auto-denied', async () => {
    const result = await computerUseApprovalService.requestApproval(HIGH_EXECUTE);
    expect(result.approved).toBe(false);
    expect(result.reason).toBe('auto-deny');
  });
});

// ---------------------------------------------------------------------------
// Test: policy = 'prompt', user responds within 30s → user-approved/user-denied
// ---------------------------------------------------------------------------

describe('requestApproval — policy=prompt, user responds', () => {
  beforeEach(() => {
    vi.spyOn(computerUseApprovalService as unknown as { getPolicy(): unknown }, 'getPolicy').mockResolvedValue({
      defaultAction: 'prompt',
      perActionRules: {},
      sessionWhitelist: [],
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('user approves → approved=true reason=user-approved', async () => {
    const pending = computerUseApprovalService.requestApproval(LOW_CLICK);

    // Simulate emitted 'approval-requested' → respond immediately
    const emitted = await new Promise<{ requestId: string }>((resolve) => {
      computerUseApprovalService.once('approval-requested', (ev) => resolve(ev as { requestId: string }));
      // flush microtasks so the emit fires
      void Promise.resolve();
    });

    computerUseApprovalService.respondToApproval(emitted.requestId, true);
    const result = await pending;

    expect(result.approved).toBe(true);
    expect(result.reason).toBe('user-approved');
  });

  it('user denies → approved=false reason=user-denied', async () => {
    const pending = computerUseApprovalService.requestApproval(LOW_CLICK);

    const emitted = await new Promise<{ requestId: string }>((resolve) => {
      computerUseApprovalService.once('approval-requested', (ev) => resolve(ev as { requestId: string }));
      void Promise.resolve();
    });

    computerUseApprovalService.respondToApproval(emitted.requestId, false);
    const result = await pending;

    expect(result.approved).toBe(false);
    expect(result.reason).toBe('user-denied');
  });
});

// ---------------------------------------------------------------------------
// Test: policy = 'prompt', 30s timeout → approved=false reason=timeout
// ---------------------------------------------------------------------------

describe('requestApproval — policy=prompt, timeout', () => {
  beforeEach(() => {
    vi.spyOn(computerUseApprovalService as unknown as { getPolicy(): unknown }, 'getPolicy').mockResolvedValue({
      defaultAction: 'prompt',
      perActionRules: {},
      sessionWhitelist: [],
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('no response within 30s → approved=false reason=timeout', async () => {
    const pending = computerUseApprovalService.requestApproval(LOW_CLICK);

    // Flush the microtask that registers the pending entry before advancing time
    await Promise.resolve();
    // No respondToApproval call — advance past timeout
    vi.advanceTimersByTime(30_001);
    // Allow the setTimeout callback to run
    await Promise.resolve();

    const result = await pending;
    expect(result.approved).toBe(false);
    expect(result.reason).toBe('timeout');
  });
});

// ---------------------------------------------------------------------------
// Test: missing policy file → deny-by-default
// ---------------------------------------------------------------------------

describe('getPolicy — file not found → deny-by-default', () => {
  beforeEach(() => {
    // Force fs.existsSync to return false for policy path
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns defaultAction=deny when file is absent', async () => {
    const policy = await computerUseApprovalService.getPolicy();
    expect(policy.defaultAction).toBe('deny');
    expect(policy.sessionWhitelist).toEqual([]);
    expect(policy.perActionRules).toEqual({});
  });

  it('requestApproval auto-denies when policy file absent', async () => {
    const result = await computerUseApprovalService.requestApproval(HIGH_EXECUTE);
    expect(result.approved).toBe(false);
    expect(result.reason).toBe('auto-deny');
  });
});

// ---------------------------------------------------------------------------
// Test: sessionWhitelist → auto-allow regardless of defaultAction=deny
// ---------------------------------------------------------------------------

describe('requestApproval — sessionWhitelist', () => {
  const SESSION_ID = 'whitelisted-session-001';

  beforeEach(() => {
    vi.spyOn(computerUseApprovalService as unknown as { getPolicy(): unknown }, 'getPolicy').mockResolvedValue({
      defaultAction: 'deny',
      perActionRules: {},
      sessionWhitelist: [SESSION_ID],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('whitelisted sessionId → auto-allow even if defaultAction=deny', async () => {
    const result = await computerUseApprovalService.requestApproval({
      ...HIGH_EXECUTE,
      sessionId: SESSION_ID,
    });
    expect(result.approved).toBe(true);
    expect(result.reason).toBe('auto-allow');
  });

  it('non-whitelisted sessionId → auto-deny', async () => {
    const result = await computerUseApprovalService.requestApproval({
      ...HIGH_EXECUTE,
      sessionId: 'other-session',
    });
    expect(result.approved).toBe(false);
    expect(result.reason).toBe('auto-deny');
  });
});
