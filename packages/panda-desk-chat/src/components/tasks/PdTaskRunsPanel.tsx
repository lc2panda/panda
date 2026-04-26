// Input: taskId + onClose + 可选 refreshKey（手动触发后刷新）
// Output: 任务运行历史面板 — 状态/时间/时长 + 输出展开 + Open session 跳转
// Pos: components/tasks/ — TaskRow 展开后内嵌
//
// Source 1:1: cc-haha desktop/src/components/tasks/TaskRunsPanel.tsx L1-195 (195 行)
//   panda 适配：
//     - cc-haha taskStore.fetchTaskRuns → panda taskStore（已建）
//     - cc-haha chatStore.connectToSession → panda chatStore（已存在）
//     - cc-haha tabStore.openTab → panda tabStore（已存在）
//     - cc-haha lib/parseRunOutput → panda lib/parseRunOutput（已建）
//     - cc-haha useTranslation → panda t()
//     - cc-haha var(--color-*) / radius → panda var(--pd-color-*) / pd-radius
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useChatStore } from '../../stores/chatStore';
import { useTabStore } from '../../stores/tabStore';
import { t } from '../../i18n';
import { parseRunOutput } from '../../lib/parseRunOutput';
import type { TaskRun } from '../../types/task';

function RunOutput({ run }: { run: TaskRun }) {
  if (run.error) {
    return (
      <div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-[var(--pd-radius-sm)] border border-[var(--pd-color-error)]/20 bg-[var(--pd-color-error-container)]/28 p-2.5 text-xs text-[var(--pd-color-error)]">
        {run.error}
      </div>
    );
  }

  const text = parseRunOutput(run.output || '');

  if (!text) {
    return (
      <div className="mt-2 p-2.5 rounded-[var(--pd-radius-sm)] bg-[var(--pd-color-surface-container)] text-xs text-[var(--pd-color-text-tertiary)] italic">
        {run.sessionId ? t('tasks.outputHintSession') : t('tasks.noOutputText')}
      </div>
    );
  }

  return (
    <div className="mt-2 p-2.5 rounded-[var(--pd-radius-sm)] bg-[var(--pd-color-surface-container)] text-xs text-[var(--pd-color-text-secondary)] whitespace-pre-wrap break-words max-h-48 overflow-y-auto leading-relaxed">
      {text}
    </div>
  );
}

type Props = {
  taskId: string;
  onClose: () => void;
  refreshKey?: number;
};

const STATUS_CONFIG: Record<string, { icon: string; color: string }> = {
  running: { icon: 'sync', color: 'var(--pd-color-warning)' },
  completed: { icon: 'check_circle', color: 'var(--pd-color-success)' },
  failed: { icon: 'error', color: 'var(--pd-color-error)' },
  timeout: { icon: 'timer_off', color: 'var(--pd-color-error)' },
};

export function PdTaskRunsPanel({ taskId, onClose, refreshKey }: Props) {
  const { fetchTaskRuns } = useTaskStore();
  const connectToSession = useChatStore((s) => s.connectToSession);
  const openTab = useTabStore((s) => s.openTab);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openSession = (sessionId: string, taskName?: string) => {
    openTab(sessionId, taskName || 'Task Run', 'session');
    connectToSession(sessionId);
  };

  const refresh = () => {
    fetchTaskRuns(taskId)
      .then((r) => {
        setRuns(r);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, fetchTaskRuns, refreshKey]);

  const hasRunning = runs.some((r) => r.status === 'running');
  useEffect(() => {
    if (!hasRunning && refreshKey === 0) return;
    let interval = 1000;
    let timer = setInterval(refresh, interval);
    const slowDown = setTimeout(() => {
      clearInterval(timer);
      if (hasRunning) {
        timer = setInterval(refresh, 3000);
      }
    }, 10000);
    const stopTimer = hasRunning ? undefined : setTimeout(() => clearInterval(timer), 12000);
    return () => {
      clearInterval(timer);
      clearTimeout(slowDown);
      if (stopTimer) clearTimeout(stopTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRunning, taskId, refreshKey]);

  return (
    <div className="mt-2 mb-1 rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--pd-color-surface-container)]">
        <span className="text-xs font-medium text-[var(--pd-color-text-primary)]">{t('tasks.logsTitle')}</span>
        <button
          onClick={onClose}
          className="p-0.5 text-[var(--pd-color-text-tertiary)] hover:text-[var(--pd-color-text-primary)] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin w-4 h-4 border-2 border-[var(--pd-color-brand)] border-t-transparent rounded-full" />
          </div>
        ) : runs.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[var(--pd-color-text-tertiary)]">
            {t('tasks.noLogs')}
          </div>
        ) : (
          <div className="divide-y divide-[var(--pd-color-border-separator)]">
            {runs.map((run) => {
              const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.failed!;
              const isExpanded = expandedId === run.id;
              return (
                <div key={run.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-[16px] ${run.status === 'running' ? 'animate-spin' : ''}`}
                      style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}
                    >
                      {cfg.icon}
                    </span>

                    <span className="text-xs font-medium" style={{ color: cfg.color }}>
                      {t(`tasks.runStatus.${run.status}`)}
                    </span>

                    <span className="text-xs text-[var(--pd-color-text-tertiary)]">
                      {new Date(run.startedAt).toLocaleString()}
                    </span>

                    {run.durationMs != null && (
                      <span className="text-xs text-[var(--pd-color-text-tertiary)]">
                        {t('tasks.duration', { s: Math.round(run.durationMs / 1000) })}
                      </span>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      {run.sessionId && run.status !== 'running' && (
                        <button
                          onClick={() => openSession(run.sessionId!, run.taskName)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--pd-color-brand)] bg-[var(--pd-color-brand)]/8 hover:bg-[var(--pd-color-brand)]/15 rounded-[var(--pd-radius-sm)] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          {t('tasks.openSession')}
                        </button>
                      )}

                      {(run.output || run.error) && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : run.id)}
                          className="text-xs text-[var(--pd-color-text-tertiary)] hover:text-[var(--pd-color-text-secondary)] transition-colors"
                        >
                          {isExpanded ? t('tasks.hideOutput') : t('tasks.viewOutput')}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && <RunOutput run={run} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
