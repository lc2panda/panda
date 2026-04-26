// Input: cc-haha desktop/src/types/cliTask.ts — 1:1 复刻
// Output: CLITask / TaskStatus / TaskListSummary 类型
// Pos: Type foundation — cliTaskStore / SessionTaskBar 使用
//
// Source: cc-haha desktop/src/types/cliTask.ts L1-25 (25 行)
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type CLITask = {
  id: string;
  subject: string;
  description: string;
  activeForm?: string;
  owner?: string;
  status: TaskStatus;
  blocks: string[];
  blockedBy: string[];
  metadata?: Record<string, unknown>;
  taskListId: string;
};

export type TaskListSummary = {
  id: string;
  taskCount: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
};
