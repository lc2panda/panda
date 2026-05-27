// Input: mocked bridge.previewRewind / executeRewind
// Output: state assertions for sessionRewindStore lifecycle
// Pos: test layer — guards v2.27.1 sessionRewindStore logic

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock bridge ─────────────────────────────────────────────────────────────

vi.mock('@/ipc/bridge', () => ({
  previewRewind: vi.fn(),
  executeRewind: vi.fn(),
}));

import * as bridge from '@/ipc/bridge';
import { useSessionRewindStore } from '@/stores/sessionRewindStore';
import type { RewindPreview, RewindResult } from '@/ipc/types';

const mockPreviewRewind = bridge.previewRewind as ReturnType<typeof vi.fn>;
const mockExecuteRewind = bridge.executeRewind as ReturnType<typeof vi.fn>;

const SID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function resetStore(): void {
  useSessionRewindStore.setState({
    preview: null,
    isLoading: false,
    error: null,
    lastBackupPath: null,
    lastRestoredFiles: [],
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('sessionRewindStore.previewRewind', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('successful preview sets preview state', async () => {
    const preview: RewindPreview = {
      targetTurn: 2,
      messagesAfter: 4,
      filesAffected: ['/tmp/foo.ts'],
      canRollback: true,
    };
    mockPreviewRewind.mockResolvedValue(preview);

    await useSessionRewindStore.getState().previewRewind(SID, 2);

    const state = useSessionRewindStore.getState();
    expect(state.preview).toEqual(preview);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('failed preview (bridge throws) sets error state', async () => {
    mockPreviewRewind.mockRejectedValue(new Error('network error'));

    await useSessionRewindStore.getState().previewRewind(SID, 2);

    const state = useSessionRewindStore.getState();
    expect(state.preview).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toMatch(/network error/);
  });

  it('sets isLoading=true during operation', async () => {
    let resolvePromise!: (v: RewindPreview) => void;
    const pending = new Promise<RewindPreview>((res) => { resolvePromise = res; });
    mockPreviewRewind.mockReturnValue(pending);

    const opPromise = useSessionRewindStore.getState().previewRewind(SID, 1);
    expect(useSessionRewindStore.getState().isLoading).toBe(true);

    resolvePromise({ targetTurn: 1, messagesAfter: 2, filesAffected: [], canRollback: true });
    await opPromise;
    expect(useSessionRewindStore.getState().isLoading).toBe(false);
  });
});

describe('sessionRewindStore.executeRewind', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('successful execute sets lastBackupPath and clears preview', async () => {
    const result: RewindResult = {
      ok: true,
      backupPath: '/tmp/test.bak.12345',
      restoredFiles: ['/tmp/foo.ts'],
    };
    mockExecuteRewind.mockResolvedValue(result);

    const returnedResult = await useSessionRewindStore.getState().executeRewind(SID, 2);

    expect(returnedResult.ok).toBe(true);
    const state = useSessionRewindStore.getState();
    expect(state.lastBackupPath).toBe('/tmp/test.bak.12345');
    expect(state.lastRestoredFiles).toEqual(['/tmp/foo.ts']);
    expect(state.preview).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('failed execute (ok=false) sets error from result', async () => {
    const result: RewindResult = {
      ok: false,
      backupPath: '',
      restoredFiles: [],
      error: '写入 jsonl 失败',
    };
    mockExecuteRewind.mockResolvedValue(result);

    const returnedResult = await useSessionRewindStore.getState().executeRewind(SID, 2);

    expect(returnedResult.ok).toBe(false);
    const state = useSessionRewindStore.getState();
    expect(state.error).toMatch(/写入 jsonl 失败/);
    expect(state.isLoading).toBe(false);
  });

  it('bridge throws → returns error result and sets error state', async () => {
    mockExecuteRewind.mockRejectedValue(new Error('IPC crash'));

    const returnedResult = await useSessionRewindStore.getState().executeRewind(SID, 1);

    expect(returnedResult.ok).toBe(false);
    expect(returnedResult.error).toMatch(/IPC crash/);
    const state = useSessionRewindStore.getState();
    expect(state.error).toMatch(/IPC crash/);
    expect(state.isLoading).toBe(false);
  });
});

describe('sessionRewindStore.clearError / reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('clearError removes error', () => {
    useSessionRewindStore.setState({ error: 'some error' });
    useSessionRewindStore.getState().clearError();
    expect(useSessionRewindStore.getState().error).toBeNull();
  });

  it('reset returns to initial state', () => {
    useSessionRewindStore.setState({
      preview: { targetTurn: 1, messagesAfter: 2, filesAffected: [], canRollback: true },
      error: 'err',
      lastBackupPath: '/tmp/bak',
      lastRestoredFiles: ['/tmp/x'],
    });
    useSessionRewindStore.getState().reset();
    const state = useSessionRewindStore.getState();
    expect(state.preview).toBeNull();
    expect(state.error).toBeNull();
    expect(state.lastBackupPath).toBeNull();
    expect(state.lastRestoredFiles).toEqual([]);
  });
});
