// Input: CliTaskCreateInput (id, title, sessionId?, payload?), taskId strings
// Output: CliTask objects persisted to ~/.pandacc/cli-tasks/<id>.json + EventEmitter events
// Pos: Backend singleton — Task V2 async task tracking for Desk Chat IPC layer
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { randomUUID } from 'node:crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CliBackendTaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface CliBackendTask {
  id: string;
  title: string;
  status: CliBackendTaskStatus;
  createdAt: string;
  updatedAt: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface CliTaskCreateInput {
  title: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
}

export interface CliTaskUpdateInput {
  status?: CliBackendTaskStatus;
  result?: unknown;
  error?: string;
  payload?: Record<string, unknown>;
}

export interface CliTaskFilter {
  status?: CliBackendTaskStatus;
  sessionId?: string;
}

// ─── CliTaskService ───────────────────────────────────────────────────────────

class CliTaskService extends EventEmitter {
  private static _instance: CliTaskService | null = null;

  static getInstance(): CliTaskService {
    if (!CliTaskService._instance) {
      CliTaskService._instance = new CliTaskService();
    }
    return CliTaskService._instance;
  }

  private constructor() {
    super();
    this._ensureDir();
  }

  // ── Private helpers ──

  private get _tasksDir(): string {
    return path.join(os.homedir(), '.pandacc', 'cli-tasks');
  }

  private _ensureDir(): void {
    try {
      if (!fs.existsSync(this._tasksDir)) {
        fs.mkdirSync(this._tasksDir, { recursive: true });
      }
    } catch {
      // Non-fatal
    }
  }

  private _taskPath(taskId: string): string {
    return path.join(this._tasksDir, `${taskId}.json`);
  }

  private _writeTask(task: CliBackendTask): void {
    this._ensureDir();
    fs.writeFileSync(this._taskPath(task.id), JSON.stringify(task, null, 2), 'utf8');
  }

  private _readTask(taskId: string): CliBackendTask | null {
    const filePath = this._taskPath(taskId);
    try {
      if (!fs.existsSync(filePath)) return null;
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as CliBackendTask;
    } catch {
      return null;
    }
  }

  private _deleteTaskFile(taskId: string): void {
    const filePath = this._taskPath(taskId);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Non-fatal
    }
  }

  // ── Public API ──

  async createTask(input: CliTaskCreateInput): Promise<CliBackendTask> {
    const now = new Date().toISOString();
    const task: CliBackendTask = {
      id: randomUUID(),
      title: input.title,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      ...(input.sessionId !== undefined && { sessionId: input.sessionId }),
      ...(input.payload !== undefined && { payload: input.payload }),
    };
    this._writeTask(task);
    this.emit('task:created', task);
    return task;
  }

  async listTasks(filter?: CliTaskFilter): Promise<CliBackendTask[]> {
    this._ensureDir();
    let files: string[];
    try {
      files = fs.readdirSync(this._tasksDir).filter((f) => f.endsWith('.json'));
    } catch {
      return [];
    }

    const tasks: CliBackendTask[] = [];
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(this._tasksDir, file), 'utf8');
        const task = JSON.parse(raw) as CliBackendTask;
        if (filter?.status && task.status !== filter.status) continue;
        if (filter?.sessionId && task.sessionId !== filter.sessionId) continue;
        tasks.push(task);
      } catch {
        // Skip corrupted files
      }
    }

    tasks.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return tasks;
  }

  async getTask(taskId: string): Promise<CliBackendTask | null> {
    if (!taskId || typeof taskId !== 'string') return null;
    return this._readTask(taskId);
  }

  async updateTaskStatus(
    taskId: string,
    status: CliBackendTaskStatus,
    partial?: Omit<CliTaskUpdateInput, 'status'>,
  ): Promise<CliBackendTask> {
    const task = this._readTask(taskId);
    if (!task) {
      throw new Error(`CliTask not found: ${taskId}`);
    }

    const updated: CliBackendTask = {
      ...task,
      status,
      updatedAt: new Date().toISOString(),
      ...(partial?.result !== undefined && { result: partial.result }),
      ...(partial?.error !== undefined && { error: partial.error }),
      ...(partial?.payload !== undefined && { payload: { ...task.payload, ...partial.payload } }),
    };

    this._writeTask(updated);
    this.emit('task:updated', updated);
    return updated;
  }

  async cancelTask(taskId: string): Promise<{ ok: boolean }> {
    const task = this._readTask(taskId);
    if (!task) return { ok: false };

    if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      return { ok: false };
    }

    const updated: CliBackendTask = {
      ...task,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };

    this._writeTask(updated);
    this.emit('task:cancelled', updated);
    return { ok: true };
  }

  async deleteTask(taskId: string): Promise<{ ok: boolean }> {
    const task = this._readTask(taskId);
    if (!task) return { ok: false };

    this._deleteTaskFile(taskId);
    this.emit('task:deleted', taskId);
    return { ok: true };
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const cliTaskService = CliTaskService.getInstance();
