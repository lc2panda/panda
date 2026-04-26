// Input: cc-haha desktop/src/stores/taskStore.ts (1:1 形态) + panda scheduleStore IPC bridge 桥接
// Output: Zustand store — CronTask CRUD + TaskRun fetch（NewTaskModal / TaskRow / TaskRunsPanel 使用）
// Pos: State layer — drives ScheduledTasks page + components/tasks/*
//
// Source: cc-haha desktop/src/stores/taskStore.ts L1-69 (69 行) — 字段名 / action 名 1:1 一致
//   panda 适配映射：
//     - cc-haha tasksApi.list/create/update/delete → panda bridge.listScheduledTasks 等同名接口
//     - cc-haha CronTask （createdAt: number / cron / enabled / ...）→ panda ScheduledTask
//       （createdAt: ISO string / cron / status / ...）转换函数 toCronTask / fromCreateInput
//     - cc-haha TaskRun → panda ScheduledTaskRunLog 转换函数 toTaskRun
//     - cc-haha tasksApi.runTask → panda bridge.runScheduledTaskNow
//     - cc-haha getRecentRuns / getTaskRuns（IPC 暂无）→ 从 task.logs 派生
//     - 任何 IPC 失败：set error + 降级空列表（无未捕获异常）
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import * as bridge from '../ipc/bridge';
import type {
  ScheduledTask,
  ScheduledTaskRunLog,
  CreateScheduledTaskInput,
  UpdateScheduledTaskInput,
} from '../ipc/types';
import type { CronTask, CreateTaskInput, TaskRun } from '../types/task';

// ─── Conversion helpers ─────────────────────────────────────────────────────

function toCronTask(t: ScheduledTask): CronTask {
  return {
    id: t.id,
    name: t.name,
    description: t.description || undefined,
    cron: t.cron,
    prompt: t.prompt,
    enabled: t.status === 'active',
    recurring: true,
    createdAt: new Date(t.createdAt).getTime(),
    lastFiredAt: t.lastRunAt,
    lastRunAt: t.lastRunAt ? new Date(t.lastRunAt).getTime() : undefined,
    nextRunAt: t.nextRunAt ? new Date(t.nextRunAt).getTime() : undefined,
    folderPath: t.cwd || undefined,
  };
}

function fromCreateInput(input: CreateTaskInput): CreateScheduledTaskInput {
  return {
    name: input.name,
    description: input.description,
    cron: input.cron,
    prompt: input.prompt,
    cwd: input.folderPath,
  };
}

function fromUpdate(id: string, updates: Partial<CronTask>): UpdateScheduledTaskInput {
  const u: UpdateScheduledTaskInput['updates'] = {};
  if (typeof updates.name === 'string') u.name = updates.name;
  if (typeof updates.description === 'string') u.description = updates.description;
  if (typeof updates.cron === 'string') u.cron = updates.cron;
  if (typeof updates.prompt === 'string') u.prompt = updates.prompt;
  if (typeof updates.folderPath === 'string') u.cwd = updates.folderPath;
  if (typeof updates.enabled === 'boolean') u.status = updates.enabled ? 'active' : 'disabled';
  return { id, updates: u };
}

function toTaskRun(taskId: string, taskName: string, log: ScheduledTaskRunLog, prompt = ''): TaskRun {
  let status: TaskRun['status'];
  if (log.status === 'completed') status = 'completed';
  else if (log.status === 'failed') status = 'failed';
  else status = 'running';
  return {
    id: log.id,
    taskId,
    taskName,
    startedAt: log.startedAt,
    completedAt: log.finishedAt,
    status,
    prompt,
    error: log.error,
    durationMs: log.durationMs,
  };
}

// ─── Store ──────────────────────────────────────────────────────────────────

type TaskStore = {
  tasks: CronTask[];
  recentRuns: TaskRun[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, updates: Partial<CronTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  runTask: (taskId: string) => Promise<void>;
  fetchRecentRuns: () => Promise<void>;
  fetchTaskRuns: (taskId: string) => Promise<TaskRun[]>;

  // Internal: setter for IPC bridge listener
  _setRawTasks: (tasks: ScheduledTask[]) => void;
};

// Cache raw IPC tasks alongside the converted CronTask list so we can derive
// runs without hitting the bridge twice.
let rawTaskCache: ScheduledTask[] = [];

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  recentRuns: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await bridge.listScheduledTasks();
      rawTaskCache = Array.isArray(raw) ? raw : [];
      set({ tasks: rawTaskCache.map(toCronTask), isLoading: false });
    } catch (err) {
      console.error('[taskStore] fetchTasks failed:', err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load tasks',
      });
    }
  },

  createTask: async (input) => {
    try {
      const created = await bridge.createScheduledTask(fromCreateInput(input));
      if (created) {
        rawTaskCache = [...rawTaskCache.filter((t) => t.id !== created.id), created];
        set((s) => ({ tasks: [...s.tasks, toCronTask(created)] }));
      }
    } catch (err) {
      console.error('[taskStore] createTask failed:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to create task' });
      throw err;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const updated = await bridge.updateScheduledTask(fromUpdate(id, updates));
      if (updated) {
        rawTaskCache = rawTaskCache.map((t) => (t.id === id ? updated : t));
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? toCronTask(updated) : t)),
        }));
      }
    } catch (err) {
      console.error('[taskStore] updateTask failed:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to update task' });
    }
  },

  deleteTask: async (id) => {
    try {
      await bridge.deleteScheduledTask(id);
      rawTaskCache = rawTaskCache.filter((t) => t.id !== id);
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    } catch (err) {
      console.error('[taskStore] deleteTask failed:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to delete task' });
    }
  },

  runTask: async (taskId) => {
    try {
      await bridge.runScheduledTaskNow(taskId);
    } catch (err) {
      console.error('[taskStore] runTask failed:', err);
      throw err;
    }
  },

  fetchRecentRuns: async () => {
    // Derive from cached tasks' logs (sorted by startedAt desc, limit 50).
    try {
      const flat: TaskRun[] = [];
      for (const raw of rawTaskCache) {
        for (const log of raw.logs ?? []) {
          flat.push(toTaskRun(raw.id, raw.name, log, raw.prompt));
        }
      }
      flat.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      set({ recentRuns: flat.slice(0, 50) });
    } catch {
      set({ recentRuns: [] });
    }
  },

  fetchTaskRuns: async (taskId) => {
    // Refresh from bridge to ensure logs are up-to-date.
    try {
      const raw = await bridge.listScheduledTasks();
      rawTaskCache = Array.isArray(raw) ? raw : [];
      set({ tasks: rawTaskCache.map(toCronTask) });
    } catch {
      // Use stale cache
    }
    const found = rawTaskCache.find((t) => t.id === taskId);
    if (!found) return [];
    return (found.logs ?? []).map((l) => toTaskRun(found.id, found.name, l, found.prompt));
  },

  _setRawTasks: (tasks) => {
    rawTaskCache = Array.isArray(tasks) ? tasks : [];
    set({ tasks: rawTaskCache.map(toCronTask) });
  },
}));

// ─── Bridge event wiring — IPC schedule:update push events ─────────────────

let taskBridgeInitialized = false;

export function setupTaskBridge(): void {
  if (taskBridgeInitialized) return;
  taskBridgeInitialized = true;

  bridge.onScheduledTasksUpdated((payload) => {
    const tasks = payload?.tasks;
    if (Array.isArray(tasks)) {
      useTaskStore.getState()._setRawTasks(tasks);
    }
  });
}
