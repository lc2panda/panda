// Input: task CRUD via IPC, CLIManager.sendMessage() for execution
// Output: on-disk scheduled_tasks.json + setTimeout-driven fires + task run logs
// Pos: electron/backend — native cron scheduler, zero external deps
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types — kept identical shape to src/ipc/types.ts ScheduledTask for IPC reuse
// ---------------------------------------------------------------------------

export type TaskStatus = 'active' | 'disabled';
export type RunStatus = 'completed' | 'failed' | 'running';

export interface ScheduledTaskRunLog {
  id: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  cron: string;
  prompt: string;
  cwd: string;
  status: TaskStatus;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  logs: ScheduledTaskRunLog[];
}

export interface CreateTaskInput {
  name: string;
  description?: string;
  cron: string;
  prompt: string;
  cwd?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TASKS_FILE = path.join(os.homedir(), '.pandacc', 'scheduled_tasks.json');
const JITTER_MS = 30_000;
const AUTO_DISABLE_AFTER_MS = 60 * 24 * 60 * 60 * 1000;
const LOG_RING_SIZE = 20;
const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// 5-field cron parser — minute hour dayOfMonth month dayOfWeek
// ---------------------------------------------------------------------------

interface CronFields {
  minute: Set<number>;
  hour: Set<number>;
  dayOfMonth: Set<number>;
  month: Set<number>;
  dayOfWeek: Set<number>;
  dayOfMonthWild: boolean;
  dayOfWeekWild: boolean;
}

const FIELD_BOUNDS: Array<[number, number]> = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 6],
];

function expandField(raw: string, min: number, max: number): Set<number> | null {
  const out = new Set<number>();
  for (const part of raw.split(',')) {
    const step = part.match(/^\*(?:\/(\d+))?$/);
    if (step) {
      const s = step[1] ? parseInt(step[1], 10) : 1;
      if (!Number.isFinite(s) || s < 1) return null;
      for (let i = min; i <= max; i += s) out.add(i);
      continue;
    }
    const range = part.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
    if (range) {
      const lo = parseInt(range[1]!, 10);
      const hi = parseInt(range[2]!, 10);
      const s = range[3] ? parseInt(range[3], 10) : 1;
      const isDow = min === 0 && max === 6;
      const effMax = isDow ? 7 : max;
      if (lo > hi || s < 1 || lo < min || hi > effMax) return null;
      for (let i = lo; i <= hi; i += s) out.add(isDow && i === 7 ? 0 : i);
      continue;
    }
    const plain = part.match(/^\d+$/);
    if (plain) {
      let n = parseInt(part, 10);
      if (min === 0 && max === 6 && n === 7) n = 0;
      if (n < min || n > max) return null;
      out.add(n);
      continue;
    }
    return null;
  }
  return out.size > 0 ? out : null;
}

export function parseCron(expr: string): CronFields | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const expanded: Array<Set<number>> = [];
  for (let i = 0; i < 5; i++) {
    const field = expandField(parts[i]!, FIELD_BOUNDS[i]![0], FIELD_BOUNDS[i]![1]);
    if (!field) return null;
    expanded.push(field);
  }
  return {
    minute: expanded[0]!,
    hour: expanded[1]!,
    dayOfMonth: expanded[2]!,
    month: expanded[3]!,
    dayOfWeek: expanded[4]!,
    dayOfMonthWild: parts[2] === '*',
    dayOfWeekWild: parts[4] === '*',
  };
}

export function isValidCron(expr: string): boolean {
  return parseCron(expr) !== null;
}

export function nextCronRunMs(expr: string, fromMs: number): number | null {
  const f = parseCron(expr);
  if (!f) return null;
  const t = new Date(fromMs);
  t.setSeconds(0, 0);
  t.setMinutes(t.getMinutes() + 1);
  const maxIter = 366 * 24 * 60;
  for (let i = 0; i < maxIter; i++) {
    if (!f.month.has(t.getMonth() + 1)) {
      t.setMonth(t.getMonth() + 1, 1);
      t.setHours(0, 0, 0, 0);
      continue;
    }
    const dom = t.getDate();
    const dow = t.getDay();
    const dayOk =
      f.dayOfMonthWild && f.dayOfWeekWild
        ? true
        : f.dayOfMonthWild
          ? f.dayOfWeek.has(dow)
          : f.dayOfWeekWild
            ? f.dayOfMonth.has(dom)
            : f.dayOfMonth.has(dom) || f.dayOfWeek.has(dow);
    if (!dayOk) {
      t.setDate(t.getDate() + 1);
      t.setHours(0, 0, 0, 0);
      continue;
    }
    if (!f.hour.has(t.getHours())) {
      t.setHours(t.getHours() + 1, 0, 0, 0);
      continue;
    }
    if (!f.minute.has(t.getMinutes())) {
      t.setMinutes(t.getMinutes() + 1);
      continue;
    }
    return t.getTime();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

interface FileFormat {
  version: 1;
  tasks: ScheduledTask[];
}

async function ensureTasksFile(): Promise<void> {
  await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true });
  try {
    await fs.access(TASKS_FILE);
  } catch {
    const empty: FileFormat = { version: 1, tasks: [] };
    await fs.writeFile(TASKS_FILE, JSON.stringify(empty, null, 2) + '\n', 'utf-8');
  }
}

async function readTasksFromDisk(): Promise<ScheduledTask[]> {
  try {
    await ensureTasksFile();
    const raw = await fs.readFile(TASKS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<FileFormat>;
    if (!parsed || !Array.isArray(parsed.tasks)) return [];
    return parsed.tasks.filter(
      (t): t is ScheduledTask =>
        !!t &&
        typeof t.id === 'string' &&
        typeof t.cron === 'string' &&
        typeof t.prompt === 'string' &&
        typeof t.name === 'string' &&
        isValidCron(t.cron),
    );
  } catch (err) {
    console.error('[cron-scheduler] readTasksFromDisk failed:', err);
    return [];
  }
}

async function writeTasksToDisk(tasks: ScheduledTask[]): Promise<void> {
  await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true });
  const body: FileFormat = { version: 1, tasks };
  await fs.writeFile(TASKS_FILE, JSON.stringify(body, null, 2) + '\n', 'utf-8');
}

// ---------------------------------------------------------------------------
// CronScheduler — ticks tasks, emits events, persists state
// ---------------------------------------------------------------------------

export interface CronSchedulerEvents {
  'tasks:updated': (tasks: ScheduledTask[]) => void;
  'task:fire': (task: ScheduledTask) => void;
  'task:log': (taskId: string, log: ScheduledTaskRunLog) => void;
}

type TaskExecutor = (task: ScheduledTask) => Promise<{ ok: boolean; error?: string }>;

function jitterDelta(taskId: string): number {
  // Deterministic [-JITTER_MS, +JITTER_MS] jitter from taskId hex prefix.
  const hexPart = taskId.replace(/-/g, '').slice(0, 8);
  const n = parseInt(hexPart || '0', 16);
  if (!Number.isFinite(n)) return 0;
  const frac = (n / 0xffffffff) * 2 - 1;
  return Math.round(frac * JITTER_MS);
}

export class CronScheduler extends EventEmitter {
  private tasks = new Map<string, ScheduledTask>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private executor: TaskExecutor | null = null;
  private loaded = false;

  async init(): Promise<void> {
    if (this.loaded) return;
    const list = await readTasksFromDisk();
    for (const t of list) {
      this.tasks.set(t.id, this.normalize(t));
    }
    this.loaded = true;
    this.rescheduleAll();
    this.emit('tasks:updated', this.list());
  }

  setExecutor(fn: TaskExecutor): void {
    this.executor = fn;
  }

  list(): ScheduledTask[] {
    return Array.from(this.tasks.values()).map((t) => ({ ...t, logs: [...t.logs] }));
  }

  get(id: string): ScheduledTask | undefined {
    const t = this.tasks.get(id);
    return t ? { ...t, logs: [...t.logs] } : undefined;
  }

  async create(input: CreateTaskInput): Promise<ScheduledTask> {
    if (!isValidCron(input.cron)) {
      throw new Error(`Invalid cron expression: ${input.cron}`);
    }
    const now = new Date();
    const id = randomUUID();
    const task: ScheduledTask = {
      id,
      name: input.name.trim() || 'Untitled Task',
      description: (input.description ?? '').trim(),
      cron: input.cron.trim(),
      prompt: input.prompt,
      cwd: input.cwd ?? process.cwd(),
      status: 'active',
      createdAt: now.toISOString(),
      runCount: 0,
      logs: [],
    };
    const nextMs = nextCronRunMs(task.cron, now.getTime());
    task.nextRunAt = nextMs ? new Date(nextMs).toISOString() : undefined;
    this.tasks.set(id, task);
    await this.persist();
    this.schedule(task);
    this.emit('tasks:updated', this.list());
    return { ...task, logs: [...task.logs] };
  }

  async update(id: string, updates: Partial<Pick<ScheduledTask, 'name' | 'description' | 'cron' | 'prompt' | 'cwd' | 'status'>>): Promise<ScheduledTask | null> {
    const task = this.tasks.get(id);
    if (!task) return null;
    if (updates.cron && !isValidCron(updates.cron)) {
      throw new Error(`Invalid cron expression: ${updates.cron}`);
    }
    Object.assign(task, updates);
    const nextMs = nextCronRunMs(task.cron, Date.now());
    task.nextRunAt = nextMs && task.status === 'active' ? new Date(nextMs).toISOString() : undefined;
    await this.persist();
    this.schedule(task);
    this.emit('tasks:updated', this.list());
    return { ...task, logs: [...task.logs] };
  }

  async remove(id: string): Promise<boolean> {
    const existed = this.tasks.delete(id);
    this.clearTimer(id);
    if (existed) {
      await this.persist();
      this.emit('tasks:updated', this.list());
    }
    return existed;
  }

  async toggle(id: string): Promise<ScheduledTask | null> {
    const task = this.tasks.get(id);
    if (!task) return null;
    task.status = task.status === 'active' ? 'disabled' : 'active';
    if (task.status === 'active') {
      const nextMs = nextCronRunMs(task.cron, Date.now());
      task.nextRunAt = nextMs ? new Date(nextMs).toISOString() : undefined;
      this.schedule(task);
    } else {
      task.nextRunAt = undefined;
      this.clearTimer(id);
    }
    await this.persist();
    this.emit('tasks:updated', this.list());
    return { ...task, logs: [...task.logs] };
  }

  async runNow(id: string): Promise<ScheduledTaskRunLog | null> {
    const task = this.tasks.get(id);
    if (!task) return null;
    return this.fire(task, true);
  }

  stopAll(): void {
    for (const id of this.timers.keys()) {
      this.clearTimer(id);
    }
  }

  // ── Internal ───────────────────────────────────────────────────────

  private normalize(t: ScheduledTask): ScheduledTask {
    return {
      ...t,
      description: t.description ?? '',
      runCount: t.runCount ?? 0,
      logs: Array.isArray(t.logs) ? t.logs.slice(-LOG_RING_SIZE) : [],
      status: t.status === 'disabled' ? 'disabled' : 'active',
    };
  }

  private async persist(): Promise<void> {
    try {
      await writeTasksToDisk(Array.from(this.tasks.values()));
    } catch (err) {
      console.error('[cron-scheduler] persist failed:', err);
    }
  }

  private rescheduleAll(): void {
    const now = Date.now();
    for (const task of this.tasks.values()) {
      if (task.lastRunAt) {
        const last = new Date(task.lastRunAt).getTime();
        if (Number.isFinite(last) && now - last >= AUTO_DISABLE_AFTER_MS && task.status === 'active') {
          task.status = 'disabled';
          task.nextRunAt = undefined;
          continue;
        }
      }
      if (task.status === 'active') this.schedule(task);
    }
    void this.persist();
  }

  private schedule(task: ScheduledTask): void {
    this.clearTimer(task.id);
    if (task.status !== 'active') return;
    const now = Date.now();
    const nextMs = nextCronRunMs(task.cron, now);
    if (nextMs === null) return;
    const jittered = Math.max(now + 1000, nextMs + jitterDelta(task.id));
    task.nextRunAt = new Date(jittered).toISOString();
    const delay = Math.min(jittered - now, MAX_TIMEOUT_MS);
    const timer = setTimeout(() => {
      this.timers.delete(task.id);
      if (delay < jittered - now) {
        this.schedule(task);
        return;
      }
      void this.fire(task, false);
    }, delay);
    if (typeof (timer as { unref?: () => void }).unref === 'function') {
      (timer as { unref: () => void }).unref();
    }
    this.timers.set(task.id, timer);
  }

  private clearTimer(id: string): void {
    const t = this.timers.get(id);
    if (t) {
      clearTimeout(t);
      this.timers.delete(id);
    }
  }

  private async fire(task: ScheduledTask, manual: boolean): Promise<ScheduledTaskRunLog> {
    const startedAt = new Date();
    const log: ScheduledTaskRunLog = {
      id: randomUUID(),
      status: 'running',
      startedAt: startedAt.toISOString(),
    };
    this.pushLog(task, log);
    this.emit('task:fire', { ...task, logs: [...task.logs] });
    this.emit('task:log', task.id, { ...log });

    let outcome: { ok: boolean; error?: string } = { ok: false, error: 'no executor registered' };
    try {
      if (this.executor) {
        outcome = await this.executor(task);
      }
    } catch (err) {
      outcome = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }

    const finishedAt = new Date();
    log.finishedAt = finishedAt.toISOString();
    log.durationMs = finishedAt.getTime() - startedAt.getTime();
    log.status = outcome.ok ? 'completed' : 'failed';
    if (outcome.error) log.error = outcome.error;

    task.lastRunAt = finishedAt.toISOString();
    task.runCount += 1;
    if (!manual && task.status === 'active') this.schedule(task);
    await this.persist();
    this.emit('task:log', task.id, { ...log });
    this.emit('tasks:updated', this.list());
    return { ...log };
  }

  private pushLog(task: ScheduledTask, log: ScheduledTaskRunLog): void {
    task.logs.push(log);
    if (task.logs.length > LOG_RING_SIZE) {
      task.logs.splice(0, task.logs.length - LOG_RING_SIZE);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const cronScheduler = new CronScheduler();
