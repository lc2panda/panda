// Input: useScheduleStore() — 真实 ScheduledTask[] (loadTasks on mount) + i18n
// Output: 嵌入式列表组件 — 3 张 stat 卡（活跃/暂停/最近运行）+ 任务表格（真数据）
// Pos: Pages — PdScheduledTasks 容器在 tasks.length>0 时调度
//
// 历史：S9 之前为 cc-haha pixel-perfect prototype，全屏壳 + mockScheduledTasks/mockStatusBar；
// S10 改造：删 mock + 删全屏壳 + 删 footer 装饰条，改用 useScheduleStore 真实数据。
//   stats 由 tasks 现场计算（active = status==='active'，disabled = status==='disabled'，
//   最近运行数 = 累计 task.runCount）。空 tasks 由容器 PdScheduledTasks 切到 PdScheduledTasksEmpty，
//   本组件不做 0 任务自渲染。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useMemo } from 'react';
import { useScheduleStore } from '../stores/scheduleStore';
import { describeCron } from '../lib/cronDescribe';
import { t } from '../i18n';
import type { ScheduledTask } from '../ipc/types';

function formatNextRun(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function lastRunStatus(task: ScheduledTask): 'success' | 'failed' | 'never' {
  const last = task.logs[task.logs.length - 1];
  if (!last) return 'never';
  if (last.status === 'failed') return 'failed';
  if (last.status === 'completed') return 'success';
  return 'never';
}

export function PdScheduledTasksList() {
  const tasks = useScheduleStore((s) => s.tasks);
  const loadTasks = useScheduleStore((s) => s.loadTasks);
  const deleteTask = useScheduleStore((s) => s.deleteTask);
  const runTaskNow = useScheduleStore((s) => s.runTaskNow);
  const toggleTask = useScheduleStore((s) => s.toggleTask);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const stats = useMemo(() => {
    const activeCount = tasks.filter((t) => t.status === 'active').length;
    const disabledCount = tasks.filter((t) => t.status === 'disabled').length;
    const totalRuns = tasks.reduce((acc, t) => acc + (t.runCount || 0), 0);
    return { activeCount, disabledCount, totalRuns };
  }, [tasks]);

  // 容器层会在 tasks.length === 0 时切到 PdScheduledTasksEmpty，本组件假定 tasks 非空。
  // 防御性：若仍被错误调度，渲染空 div 而非 prototype mock。
  if (tasks.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards — 真实数据 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label={t('tasks.active')}
          value={String(stats.activeCount)}
          icon="play_circle"
          accent="text-[var(--pd-color-success)]"
        />
        <StatCard
          label={t('tasks.disabled')}
          value={String(stats.disabledCount)}
          icon="pause_circle"
          accent="text-[var(--pd-color-text-tertiary)]"
        />
        <StatCard
          label={t('scheduledPage.nextRun')}
          value={String(stats.totalRuns)}
          icon="history"
          accent="text-[var(--pd-color-brand)]"
          sublabel={t('tasks.totalTasks')}
        />
      </div>

      {/* Tasks table */}
      <div className="rounded-2xl overflow-hidden border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--pd-color-surface-container)]/60">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--pd-color-text-tertiary)] border-b border-[var(--pd-color-border)]/50">
                {t('scheduledPage.colTaskName')}
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--pd-color-text-tertiary)] border-b border-[var(--pd-color-border)]/50">
                {t('scheduledPage.colFrequency')}
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--pd-color-text-tertiary)] border-b border-[var(--pd-color-border)]/50">
                {t('scheduledPage.colLastResult')}
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--pd-color-text-tertiary)] border-b border-[var(--pd-color-border)]/50">
                {t('scheduledPage.colNextExecution')}
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--pd-color-text-tertiary)] border-b border-[var(--pd-color-border)]/50 text-right">
                {t('scheduledPage.colActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pd-color-border)]/40">
            {tasks.map((task) => {
              const result = lastRunStatus(task);
              return (
                <tr key={task.id} className="group hover:bg-[var(--pd-color-surface-hover)] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.status === 'active'
                            ? 'bg-[var(--pd-color-success)]'
                            : 'bg-[var(--pd-color-text-tertiary)]'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--pd-color-text-primary)] truncate">
                          {task.name}
                        </div>
                        {task.description && (
                          <div className="text-xs text-[var(--pd-color-text-secondary)] truncate">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 bg-[var(--pd-color-surface-container)] rounded-full text-xs font-medium text-[var(--pd-color-text-secondary)]">
                      {describeCron(task.cron, t)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {result === 'success' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--pd-color-success)]">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        {t('tasks.runStatus.completed')}
                      </span>
                    )}
                    {result === 'failed' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--pd-color-error)]">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                        {t('tasks.runStatus.failed')}
                      </span>
                    )}
                    {result === 'never' && (
                      <span className="text-xs text-[var(--pd-color-text-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-[var(--pd-font-mono)] text-xs text-[var(--pd-color-text-secondary)]">
                      {formatNextRun(task.nextRunAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => void runTaskNow(task.id)}
                        title={t('tasks.runNow')}
                        className="p-1.5 rounded-md text-[var(--pd-color-text-tertiary)] hover:text-[var(--pd-color-brand)] hover:bg-[var(--pd-color-surface-container)] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleTask(task.id)}
                        title={task.status === 'active' ? t('tasks.confirmDisable') : t('tasks.confirmEnable')}
                        className="p-1.5 rounded-md text-[var(--pd-color-text-tertiary)] hover:text-[var(--pd-color-text-primary)] hover:bg-[var(--pd-color-surface-container)] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {task.status === 'active' ? 'pause' : 'play_circle'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTask(task.id)}
                        title={t('tasks.confirmDelete')}
                        className="p-1.5 rounded-md text-[var(--pd-color-text-tertiary)] hover:text-[var(--pd-color-error)] hover:bg-[var(--pd-color-surface-container)] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Stat card sub-component (cc-haha 视觉规范：rounded-2xl/border 60%/shadow-sm) ───
function StatCard({
  label,
  value,
  icon,
  accent,
  sublabel,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--pd-color-text-tertiary)]">
          {label}
        </span>
        <span className={`material-symbols-outlined ${accent}`}>{icon}</span>
      </div>
      <div className="text-3xl font-bold text-[var(--pd-color-text-primary)]">{value}</div>
      {sublabel && (
        <div className="mt-1 text-xs text-[var(--pd-color-text-tertiary)]">{sublabel}</div>
      )}
    </div>
  );
}

export default PdScheduledTasksList;
