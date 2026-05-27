// Input: CliTaskService public API (createTask / listTasks / getTask / updateTaskStatus / cancelTask / deleteTask)
// Output: vitest 用例 — 使用真实 tmpdir 避免 vi.mock hoist 复杂度
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — v2.27.1 CLI Task V2 单测

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

// ─── Override CLI_TASKS_DIR before importing service ──────────────────────────
// We can't easily override the constant, so we spy on the service's path
// resolution by mocking os.homedir to point to a tmpdir.
const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'panda-cli-task-test-'));

vi.mock('node:os', async (importOriginal) => {
  const orig = await importOriginal<typeof os>();
  return { ...orig, homedir: () => tmpBase };
});

import {
  cliTaskService,
  type CliBackendTask,
} from '../cli-task-service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearTaskDir() {
  const dir = path.join(tmpBase, '.pandacc', 'cli-tasks');
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      fs.unlinkSync(path.join(dir, f));
    }
  }
}

// ─── createTask ───────────────────────────────────────────────────────────────

describe('CliTaskService.createTask', () => {
  beforeEach(() => clearTaskDir());
  afterEach(() => clearTaskDir());

  it('新建任务 → 状态为 pending，返回有效 UUID', async () => {
    const task = await cliTaskService.createTask({ title: '测试任务 1' });
    expect(task.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(task.title).toBe('测试任务 1');
    expect(task.status).toBe('pending');
    expect(typeof task.createdAt).toBe('string');
    expect(typeof task.updatedAt).toBe('string');
  });

  it('新建任务 → 落盘到 tmpdir/.pandacc/cli-tasks/<id>.json', async () => {
    const task = await cliTaskService.createTask({ title: '落盘任务', sessionId: 's-1' });
    const dir = path.join(tmpBase, '.pandacc', 'cli-tasks');
    const file = path.join(dir, `${task.id}.json`);
    expect(fs.existsSync(file)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as CliBackendTask;
    expect(parsed.sessionId).toBe('s-1');
  });

  it('新建任务 → emit task:created 事件', async () => {
    const spy = vi.fn();
    cliTaskService.on('task:created', spy);
    const task = await cliTaskService.createTask({ title: '事件任务' });
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0] as [CliBackendTask])[0].id).toBe(task.id);
    cliTaskService.off('task:created', spy);
  });
});

// ─── listTasks ────────────────────────────────────────────────────────────────

describe('CliTaskService.listTasks', () => {
  beforeEach(() => clearTaskDir());
  afterEach(() => clearTaskDir());

  it('无任务 → 返回空数组', async () => {
    const list = await cliTaskService.listTasks();
    expect(list).toEqual([]);
  });

  it('多个任务 → 全部返回', async () => {
    const t1 = await cliTaskService.createTask({ title: '任务 A' });
    const t2 = await cliTaskService.createTask({ title: '任务 B' });
    const list = await cliTaskService.listTasks();
    expect(list.length).toBe(2);
    const ids = list.map((t) => t.id);
    expect(ids).toContain(t1.id);
    expect(ids).toContain(t2.id);
  });

  it('filter.status → 只返回匹配状态', async () => {
    const t1 = await cliTaskService.createTask({ title: '待处理' });
    const t2 = await cliTaskService.createTask({ title: '运行中' });
    await cliTaskService.updateTaskStatus(t2.id, 'running');
    const pendingList = await cliTaskService.listTasks({ status: 'pending' });
    expect(pendingList.some((t) => t.id === t1.id)).toBe(true);
    expect(pendingList.some((t) => t.id === t2.id)).toBe(false);
  });

  it('filter.sessionId → 只返回匹配 sessionId', async () => {
    await cliTaskService.createTask({ title: '会话 A 任务', sessionId: 'sess-A' });
    await cliTaskService.createTask({ title: '会话 B 任务', sessionId: 'sess-B' });
    const listA = await cliTaskService.listTasks({ sessionId: 'sess-A' });
    expect(listA.length).toBe(1);
    expect(listA[0].sessionId).toBe('sess-A');
  });
});

// ─── getTask ──────────────────────────────────────────────────────────────────

describe('CliTaskService.getTask', () => {
  beforeEach(() => clearTaskDir());
  afterEach(() => clearTaskDir());

  it('存在的 ID → 返回任务', async () => {
    const task = await cliTaskService.createTask({ title: '查询任务' });
    const found = await cliTaskService.getTask(task.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(task.id);
  });

  it('不存在的 ID → 返回 null', async () => {
    const found = await cliTaskService.getTask('00000000-0000-0000-0000-999999999999');
    expect(found).toBeNull();
  });

  it('空字符串 ID → 返回 null（边界保护）', async () => {
    const found = await cliTaskService.getTask('');
    expect(found).toBeNull();
  });
});

// ─── updateTaskStatus ─────────────────────────────────────────────────────────

describe('CliTaskService.updateTaskStatus', () => {
  beforeEach(() => clearTaskDir());
  afterEach(() => clearTaskDir());

  it('pending → running 状态变更成功', async () => {
    const task = await cliTaskService.createTask({ title: '状态变更测试' });
    const updated = await cliTaskService.updateTaskStatus(task.id, 'running');
    expect(updated.status).toBe('running');
  });

  it('running → completed 且附带 result', async () => {
    const task = await cliTaskService.createTask({ title: '完成测试' });
    await cliTaskService.updateTaskStatus(task.id, 'running');
    const completed = await cliTaskService.updateTaskStatus(task.id, 'completed', {
      result: { output: '完成了' },
    });
    expect(completed.status).toBe('completed');
    expect((completed.result as { output: string }).output).toBe('完成了');
  });

  it('emit task:updated 事件', async () => {
    const task = await cliTaskService.createTask({ title: '事件测试' });
    const spy = vi.fn();
    cliTaskService.on('task:updated', spy);
    await cliTaskService.updateTaskStatus(task.id, 'running');
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0] as [CliBackendTask])[0].status).toBe('running');
    cliTaskService.off('task:updated', spy);
  });

  it('不存在的 ID → 抛出错误', async () => {
    await expect(
      cliTaskService.updateTaskStatus('00000000-0000-0000-0000-000000000000', 'running'),
    ).rejects.toThrow('CliTask not found');
  });
});

// ─── cancelTask ───────────────────────────────────────────────────────────────

describe('CliTaskService.cancelTask', () => {
  beforeEach(() => clearTaskDir());
  afterEach(() => clearTaskDir());

  it('pending 任务 → 取消成功 ok:true，状态变 cancelled', async () => {
    const task = await cliTaskService.createTask({ title: '取消测试' });
    const result = await cliTaskService.cancelTask(task.id);
    expect(result.ok).toBe(true);
    const updated = await cliTaskService.getTask(task.id);
    expect(updated?.status).toBe('cancelled');
  });

  it('已完成任务 → 取消失败 ok:false', async () => {
    const task = await cliTaskService.createTask({ title: '已完成取消测试' });
    await cliTaskService.updateTaskStatus(task.id, 'completed');
    const result = await cliTaskService.cancelTask(task.id);
    expect(result.ok).toBe(false);
  });

  it('emit task:cancelled 事件', async () => {
    const task = await cliTaskService.createTask({ title: '取消事件' });
    const spy = vi.fn();
    cliTaskService.on('task:cancelled', spy);
    await cliTaskService.cancelTask(task.id);
    expect(spy).toHaveBeenCalledOnce();
    cliTaskService.off('task:cancelled', spy);
  });
});

// ─── deleteTask ───────────────────────────────────────────────────────────────

describe('CliTaskService.deleteTask', () => {
  beforeEach(() => clearTaskDir());
  afterEach(() => clearTaskDir());

  it('存在的任务 → 删除成功 ok:true，之后 getTask 返回 null', async () => {
    const task = await cliTaskService.createTask({ title: '删除测试' });
    const result = await cliTaskService.deleteTask(task.id);
    expect(result.ok).toBe(true);
    const found = await cliTaskService.getTask(task.id);
    expect(found).toBeNull();
  });

  it('不存在的任务 → ok:false', async () => {
    const result = await cliTaskService.deleteTask('00000000-0000-0000-0000-000000000001');
    expect(result.ok).toBe(false);
  });

  it('emit task:deleted 事件', async () => {
    const task = await cliTaskService.createTask({ title: '删除事件' });
    const spy = vi.fn();
    cliTaskService.on('task:deleted', spy);
    await cliTaskService.deleteTask(task.id);
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0] as [string])[0]).toBe(task.id);
    cliTaskService.off('task:deleted', spy);
  });
});
