// Input: mocked bridge.listCliTasks / bridge.deleteCliTask responses
// Output: state assertions for cliTaskStore.fetchSessionTasks / resetCompletedTasks
// Pos: test layer — validates cliTaskStore bridge升级后的 V2 IPC 调用路径 (v2.27.1)

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Hoist mock fns ───────────────────────────────────────────────────────────
const { mockListCliTasks, mockDeleteCliTask } = vi.hoisted(() => ({
  mockListCliTasks: vi.fn(),
  mockDeleteCliTask: vi.fn(),
}));

// ─── Mock bridge ─────────────────────────────────────────────────────────────
vi.mock('@/ipc/bridge', () => ({
  listCliTasks: mockListCliTasks,
  deleteCliTask: mockDeleteCliTask,
}));

import { useCLITaskStore } from '@/stores/cliTaskStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resetStore() {
  useCLITaskStore.setState({
    sessionId: null,
    tasks: [],
    resetting: false,
    completedAndDismissed: false,
    dismissedCompletionKey: null,
    expanded: false,
  });
}

// ─── fetchSessionTasks ────────────────────────────────────────────────────────

describe('cliTaskStore.fetchSessionTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockListCliTasks.mockResolvedValue([]);
  });

  it('切换 sessionId → 清空 tasks + 重置完成状态', async () => {
    useCLITaskStore.setState({
      sessionId: 'old-session',
      tasks: [{ id: 't1' } as never],
      completedAndDismissed: true,
    });
    await useCLITaskStore.getState().fetchSessionTasks('new-session');
    const state = useCLITaskStore.getState();
    expect(state.sessionId).toBe('new-session');
    expect(state.tasks).toEqual([]);
    expect(state.completedAndDismissed).toBe(false);
  });

  it('同一 sessionId → 不重置 tasks（仅刷新）', async () => {
    useCLITaskStore.setState({
      sessionId: 'same-session',
      tasks: [{ id: 't1' } as never],
    });
    await useCLITaskStore.getState().fetchSessionTasks('same-session');
    const state = useCLITaskStore.getState();
    expect(state.tasks).toHaveLength(1);
  });

  it('调用 bridge.listCliTasks 传递 sessionId', async () => {
    await useCLITaskStore.getState().fetchSessionTasks('sess-xyz');
    expect(mockListCliTasks).toHaveBeenCalledWith({ sessionId: 'sess-xyz' });
  });

  it('bridge.listCliTasks 抛出异常 → 不影响 store 状态（非致命）', async () => {
    mockListCliTasks.mockRejectedValueOnce(new Error('network error'));
    await useCLITaskStore.getState().fetchSessionTasks('err-session');
    const state = useCLITaskStore.getState();
    expect(state.sessionId).toBe('err-session');
    // No uncaught error propagation
  });
});

// ─── refreshTasks ─────────────────────────────────────────────────────────────

describe('cliTaskStore.refreshTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockListCliTasks.mockResolvedValue([]);
  });

  it('sessionId 为 null → noop，不调用 bridge', async () => {
    await useCLITaskStore.getState().refreshTasks();
    expect(mockListCliTasks).not.toHaveBeenCalled();
  });

  it('有 sessionId → 调用 bridge.listCliTasks', async () => {
    useCLITaskStore.setState({ sessionId: 'sess-abc' });
    await useCLITaskStore.getState().refreshTasks();
    expect(mockListCliTasks).toHaveBeenCalledWith({ sessionId: 'sess-abc' });
  });
});

// ─── resetCompletedTasks ──────────────────────────────────────────────────────

describe('cliTaskStore.resetCompletedTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockListCliTasks.mockResolvedValue([]);
    mockDeleteCliTask.mockResolvedValue({ ok: true });
  });

  it('无 sessionId → noop', async () => {
    await useCLITaskStore.getState().resetCompletedTasks();
    expect(mockListCliTasks).not.toHaveBeenCalled();
    expect(mockDeleteCliTask).not.toHaveBeenCalled();
  });

  it('有完成任务 + sessionId → 本地清空 + 调用 bridge.deleteCliTask', async () => {
    const completedTask = { id: 'task-done-1', status: 'completed' };
    mockListCliTasks.mockResolvedValueOnce([completedTask]);

    useCLITaskStore.setState({
      sessionId: 'sess-reset',
      tasks: [
        {
          id: '1',
          subject: 'done',
          status: 'completed',
          description: '',
          blocks: [],
          blockedBy: [],
          taskListId: 'l1',
        },
      ],
    });

    await useCLITaskStore.getState().resetCompletedTasks();

    const state = useCLITaskStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.completedAndDismissed).toBe(false);
    expect(mockDeleteCliTask).toHaveBeenCalledWith('task-done-1');
  });

  it('bridge.deleteCliTask 失败 → 本地状态仍清空（非致命）', async () => {
    mockListCliTasks.mockResolvedValueOnce([{ id: 'bad-task', status: 'completed' }]);
    mockDeleteCliTask.mockRejectedValueOnce(new Error('delete failed'));

    useCLITaskStore.setState({
      sessionId: 'sess-fail',
      tasks: [
        {
          id: '1',
          subject: 'done',
          status: 'completed',
          description: '',
          blocks: [],
          blockedBy: [],
          taskListId: 'l1',
        },
      ],
    });

    await useCLITaskStore.getState().resetCompletedTasks();
    const state = useCLITaskStore.getState();
    expect(state.resetting).toBe(false);
  });
});
