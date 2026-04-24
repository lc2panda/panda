// Input: IPC bridge schedule:* channels (list/create/delete/toggle/run-now/update events)
// Output: Zustand store for scheduled task CRUD + live sync with main process
// Pos: State layer — drives ScheduledPage rendering

import { create } from 'zustand';
import * as bridge from '../ipc/bridge';
import type {
  ScheduledTask,
  CreateScheduledTaskInput,
  UpdateScheduledTaskInput,
  ValidateCronResult,
} from '../ipc/types';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface ScheduleStore {
  tasks: ScheduledTask[];
  loading: boolean;
  error: string | null;

  loadTasks: () => Promise<void>;
  createTask: (input: CreateScheduledTaskInput) => Promise<ScheduledTask | null>;
  updateTask: (input: UpdateScheduledTaskInput) => Promise<ScheduledTask | null>;
  deleteTask: (id: string) => Promise<boolean>;
  runTaskNow: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  validateCron: (expr: string) => Promise<ValidateCronResult>;

  // Internal: setter invoked by the IPC bridge listener
  _setTasks: (tasks: ScheduledTask[]) => void;
  _setError: (error: string | null) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useScheduleStore = create<ScheduleStore>()((set) => ({
  tasks: [],
  loading: false,
  error: null,

  loadTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await bridge.listScheduledTasks();
      set({ tasks: Array.isArray(tasks) ? tasks : [], loading: false });
    } catch (err) {
      console.error('[scheduleStore] loadTasks failed:', err);
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load tasks',
      });
    }
  },

  createTask: async (input) => {
    set({ error: null });
    try {
      const created = await bridge.createScheduledTask(input);
      if (created) {
        set((state) => ({
          tasks: mergeTask(state.tasks, created),
        }));
      }
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      console.error('[scheduleStore] createTask failed:', err);
      set({ error: msg });
      return null;
    }
  },

  updateTask: async (input) => {
    try {
      const updated = await bridge.updateScheduledTask(input);
      if (updated) {
        set((state) => ({
          tasks: mergeTask(state.tasks, updated),
        }));
      }
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      console.error('[scheduleStore] updateTask failed:', err);
      set({ error: msg });
      return null;
    }
  },

  deleteTask: async (id) => {
    try {
      const ok = await bridge.deleteScheduledTask(id);
      if (ok) {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      }
      return ok;
    } catch (err) {
      console.error('[scheduleStore] deleteTask failed:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to delete task',
      });
      return false;
    }
  },

  runTaskNow: async (id) => {
    try {
      await bridge.runScheduledTaskNow(id);
      // tasks:updated event will broadcast the new run log; no local mutation needed.
    } catch (err) {
      console.error('[scheduleStore] runTaskNow failed:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to run task',
      });
    }
  },

  toggleTask: async (id) => {
    try {
      const updated = await bridge.toggleScheduledTask(id);
      if (updated) {
        set((state) => ({
          tasks: mergeTask(state.tasks, updated),
        }));
      }
    } catch (err) {
      console.error('[scheduleStore] toggleTask failed:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to toggle task',
      });
    }
  },

  validateCron: async (expr) => {
    try {
      return await bridge.validateCron(expr);
    } catch {
      return { valid: false };
    }
  },

  _setTasks: (tasks) => set({ tasks: Array.isArray(tasks) ? tasks : [] }),
  _setError: (error) => set({ error }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mergeTask(list: ScheduledTask[], task: ScheduledTask): ScheduledTask[] {
  const idx = list.findIndex((t) => t.id === task.id);
  if (idx === -1) return [...list, task];
  const copy = [...list];
  copy[idx] = task;
  return copy;
}

// ---------------------------------------------------------------------------
// Bridge event wiring — connect IPC schedule:update push events to store
// ---------------------------------------------------------------------------

let scheduleBridgeInitialized = false;

export function setupScheduleBridge(): void {
  if (scheduleBridgeInitialized) return;
  scheduleBridgeInitialized = true;

  bridge.onScheduledTasksUpdated((payload) => {
    const tasks = payload?.tasks;
    if (Array.isArray(tasks)) {
      useScheduleStore.getState()._setTasks(tasks);
    }
  });

  // Initial fetch (only in Electron).
  if (!bridge.isDevMode() && bridge.hasPandaAPI()) {
    void useScheduleStore.getState().loadTasks();
  }
}
