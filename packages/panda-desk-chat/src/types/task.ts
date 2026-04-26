// Input: cc-haha desktop/src/types/task.ts — 1:1 复刻
// Output: CronTask / CreateTaskInput / TaskRun / TaskNotificationConfig 类型
// Pos: Type foundation — taskStore / NewTaskModal / TaskRow / TaskRunsPanel 使用
//
// Source: cc-haha desktop/src/types/task.ts L1-57 (57 行)
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

export type TaskNotificationConfig = {
  enabled: boolean;
  channels: ('telegram' | 'feishu')[];
};

export type CronTask = {
  id: string;
  name: string;
  description?: string;
  cron: string;
  prompt: string;
  enabled: boolean;
  recurring?: boolean;
  permanent?: boolean;
  createdAt: number;
  lastRunAt?: number;
  lastFiredAt?: string;
  nextRunAt?: number;
  permissionMode?: string;
  model?: string;
  folderPath?: string;
  useWorktree?: boolean;
  notification?: TaskNotificationConfig;
};

export type CreateTaskInput = {
  name: string;
  description?: string;
  cron: string;
  prompt: string;
  enabled?: boolean;
  recurring?: boolean;
  permanent?: boolean;
  permissionMode?: string;
  model?: string;
  folderPath?: string;
  useWorktree?: boolean;
  notification?: TaskNotificationConfig;
};

export type TaskRun = {
  id: string;
  taskId: string;
  taskName: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  prompt: string;
  output?: string;
  error?: string;
  exitCode?: number;
  durationMs?: number;
  sessionId?: string;
};
