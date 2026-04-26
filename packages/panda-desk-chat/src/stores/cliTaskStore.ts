// Input: cc-haha desktop/src/stores/cliTaskStore.ts (1:1 形态) — IPC 降级 stub
// Output: Zustand store — CLI session 内的 TodoWrite 任务跟踪（PdSessionTaskBar 使用）
// Pos: State layer — drives session-scope task list (TodoWrite v1)
//
// Source: cc-haha desktop/src/stores/cliTaskStore.ts L1-191 (191 行) — 形态 1:1
//   panda IPC 降级清单：
//     - cc-haha cliTasksApi.getTasksForList / resetTaskList 全部缺失
//       → fetchSessionTasks/refreshTasks 仅清空 + 等待 setTasksFromTodos
//         由 chatStore tool_use 流式更新；
//     - 其它字段（sessionId / completedAndDismissed / dismissedCompletionKey / expanded）
//       逻辑保留 1:1，避免依赖方调用面变更。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import type { CLITask, TaskStatus } from '../types/cliTask';

type TodoItem = {
  content: string;
  status: string;
  activeForm?: string;
};

type CLITaskStore = {
  sessionId: string | null;
  tasks: CLITask[];
  resetting: boolean;
  expanded: boolean;
  completedAndDismissed: boolean;
  dismissedCompletionKey: string | null;

  fetchSessionTasks: (sessionId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  setTasksFromTodos: (todos: TodoItem[]) => void;
  markCompletedAndDismissed: () => void;
  resetCompletedTasks: () => Promise<void>;
  clearTasks: () => void;
  toggleExpanded: () => void;
};

function buildCompletedTaskKey(tasks: CLITask[]): string | null {
  if (tasks.length === 0 || tasks.some((task) => task.status !== 'completed')) return null;

  return tasks
    .map((task) =>
      [task.taskListId, task.id, task.subject, task.status, task.activeForm ?? '', task.owner ?? ''].join('::'),
    )
    .join('|');
}

function resolveDismissState(tasks: CLITask[], dismissedCompletionKey: string | null) {
  const completionKey = buildCompletedTaskKey(tasks);
  const keepDismissed = completionKey !== null && completionKey === dismissedCompletionKey;
  return {
    completedAndDismissed: keepDismissed,
    dismissedCompletionKey: keepDismissed ? completionKey : null,
  };
}

function mapTodosToTasks(todos: TodoItem[], sessionId: string | null): CLITask[] {
  return todos.map((todo, index) => ({
    id: String(index + 1),
    subject: todo.content,
    description: '',
    activeForm: todo.activeForm,
    status: (['pending', 'in_progress', 'completed'].includes(todo.status)
      ? todo.status
      : 'pending') as TaskStatus,
    blocks: [],
    blockedBy: [],
    taskListId: sessionId || '',
  }));
}

export const useCLITaskStore = create<CLITaskStore>((set, get) => ({
  sessionId: null,
  tasks: [],
  resetting: false,
  expanded: false,
  completedAndDismissed: false,
  dismissedCompletionKey: null,

  // TODO(IPC): panda 缺 cliTasksApi.getTasksForList;切换 sessionId + 清空。
  fetchSessionTasks: async (sessionId) => {
    if (get().sessionId !== sessionId) {
      set({
        sessionId,
        tasks: [],
        resetting: false,
        completedAndDismissed: false,
        dismissedCompletionKey: null,
        expanded: false,
      });
    }
  },

  // TODO(IPC): panda 缺 cliTasksApi.getTasksForList;noop。
  refreshTasks: async () => {
    // No-op stub — chatStore.setTasksFromTodos drives task updates instead.
  },

  setTasksFromTodos: (todos) => {
    const tasks = mapTodosToTasks(todos, get().sessionId);
    set((state) => ({
      tasks,
      ...resolveDismissState(tasks, state.dismissedCompletionKey),
    }));
  },

  markCompletedAndDismissed: () => {
    const completionKey = buildCompletedTaskKey(get().tasks);
    if (!completionKey) return;
    set({
      completedAndDismissed: true,
      dismissedCompletionKey: completionKey,
      expanded: false,
    });
  },

  // TODO(IPC): panda 缺 cliTasksApi.resetTaskList;仅本地清空。
  resetCompletedTasks: async () => {
    const { sessionId, tasks } = get();
    const completionKey = buildCompletedTaskKey(tasks);
    if (!sessionId || !completionKey) return;

    set({
      tasks: [],
      resetting: true,
      completedAndDismissed: false,
      dismissedCompletionKey: null,
      expanded: false,
    });
    // No remote reset until panda IPC catches up.
    set({ resetting: false });
  },

  clearTasks: () => {
    set({
      sessionId: null,
      tasks: [],
      resetting: false,
      completedAndDismissed: false,
      dismissedCompletionKey: null,
      expanded: false,
    });
  },

  toggleExpanded: () => {
    set((s) => ({ expanded: !s.expanded }));
  },
}));
