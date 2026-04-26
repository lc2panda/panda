// Input: CronTask + showLogs flag + onToggleLogs
// Output: 单行任务条 — 状态点 + 名称/描述 + cron 描述 + run/logs/menu 按钮 + 内联 Edit 弹窗 + 行下展开 RunsPanel
// Pos: components/tasks/ — PdTaskList 表格替代列表的子项
//
// Source 1:1: cc-haha desktop/src/components/tasks/TaskRow.tsx L1-253 (253 行)
//   panda 适配：
//     - cc-haha taskStore (deleteTask/updateTask/runTask) → panda taskStore（已建）
//     - cc-haha lib/cronDescribe.describeCron → panda lib（已建）
//     - cc-haha TaskRunsPanel/NewTaskModal → panda PdTaskRunsPanel/PdNewTaskModal（已建/已改）
//     - cc-haha useTranslation → panda t()
//     - cc-haha var(--color-*) / radius → panda var(--pd-color-*) / pd-radius
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useRef, useState } from 'react';
import type { CronTask } from '../../types/task';
import { useTaskStore } from '../../stores/taskStore';
import { t } from '../../i18n';
import { describeCron } from '../../lib/cronDescribe';
import { PdTaskRunsPanel } from './PdTaskRunsPanel';
import { PdNewTaskModal } from './PdNewTaskModal';

type Props = {
  task: CronTask;
  showLogs: boolean;
  onToggleLogs: () => void;
};

type ConfirmAction = 'run' | 'toggle' | 'delete' | null;

export function PdTaskRow({ task, showLogs, onToggleLogs }: Props) {
  const { deleteTask, updateTask, runTask } = useTaskStore();
  const [showEdit, setShowEdit] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [logsRefreshKey, setLogsRefreshKey] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu && !confirmAction) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showMenu && menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false);
      }
      if (confirmAction && confirmRef.current && !confirmRef.current.contains(target)) {
        setConfirmAction(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu, confirmAction]);

  const handleRunNow = async () => {
    setConfirmAction(null);
    setIsRunning(true);
    if (!showLogs) onToggleLogs();
    try {
      await runTask(task.id);
      setLogsRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to run task:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggle = () => {
    setConfirmAction(null);
    setShowMenu(false);
    void updateTask(task.id, { enabled: !task.enabled });
  };

  const handleDelete = () => {
    setConfirmAction(null);
    setShowMenu(false);
    void deleteTask(task.id);
  };

  const iconBtn = 'p-1.5 rounded-[var(--pd-radius-sm)] transition-colors';
  const menuItem = 'flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left rounded-[var(--pd-radius-sm)] transition-colors';

  return (
    <div className="border-b border-[var(--pd-color-border-separator)]">
      <div className="flex items-center justify-between px-4 py-3 hover:bg-[var(--pd-color-surface-hover)] transition-colors group">
        {/* Left: status + info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.enabled ? 'bg-[var(--pd-color-success)]' : 'bg-[var(--pd-color-text-tertiary)]'}`} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-[var(--pd-color-text-primary)] truncate">{task.name}</div>
            {task.description && (
              <div className="text-xs text-[var(--pd-color-text-secondary)] truncate">{task.description}</div>
            )}
            <div className="flex items-center gap-3 text-[11px] text-[var(--pd-color-text-tertiary)] mt-0.5">
              <span>{t('tasks.createdAt')}{new Date(task.createdAt).toLocaleDateString()}</span>
              {task.lastFiredAt && (
                <span>{t('tasks.lastRunAt')}{new Date(task.lastFiredAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: cron + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-[var(--pd-color-text-tertiary)]" title={task.cron}>
            {describeCron(task.cron, t)}
          </span>

          <div className="flex items-center gap-0.5">
            {/* Run Now */}
            <div className="relative" ref={confirmAction === 'run' ? confirmRef : undefined}>
              <button
                onClick={() => (isRunning || !task.enabled ? undefined : setConfirmAction(confirmAction === 'run' ? null : 'run'))}
                disabled={isRunning || !task.enabled}
                className={`${iconBtn} ${task.enabled ? 'text-[var(--pd-color-brand)] hover:bg-[var(--pd-color-surface-selected)]' : 'text-[var(--pd-color-text-tertiary)] cursor-not-allowed'} disabled:opacity-50`}
                title={task.enabled ? t('tasks.runNow') : undefined}
              >
                <span className={`material-symbols-outlined text-[18px] ${isRunning ? 'animate-spin' : ''}`}>
                  {isRunning ? 'sync' : 'play_arrow'}
                </span>
              </button>
              {confirmAction === 'run' && (
                <ConfirmPopover
                  message={t('tasks.confirmRun')}
                  confirmLabel={t('tasks.runNow')}
                  onConfirm={handleRunNow}
                  onCancel={() => setConfirmAction(null)}
                  cancelLabel={t('common.cancel')}
                />
              )}
            </div>

            {/* View Logs */}
            <button
              onClick={onToggleLogs}
              className={`${iconBtn} ${showLogs ? 'text-[var(--pd-color-brand)] bg-[var(--pd-color-surface-selected)]' : 'text-[var(--pd-color-text-tertiary)] hover:bg-[var(--pd-color-surface-selected)]'}`}
              title={t('tasks.viewLogs')}
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </button>

            {/* More menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  setShowMenu(!showMenu);
                  setConfirmAction(null);
                }}
                className={`${iconBtn} text-[var(--pd-color-text-tertiary)] hover:bg-[var(--pd-color-surface-selected)]`}
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>

              {showMenu && !confirmAction && (
                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] shadow-lg py-1">
                  {/* Edit */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowEdit(true);
                    }}
                    className={`${menuItem} text-[var(--pd-color-text-primary)] hover:bg-[var(--pd-color-surface-hover)]`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-secondary)]">edit</span>
                    {t('tasks.edit')}
                  </button>

                  {/* Toggle */}
                  <button
                    onClick={() => setConfirmAction('toggle')}
                    className={`${menuItem} text-[var(--pd-color-text-primary)] hover:bg-[var(--pd-color-surface-hover)]`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-secondary)]">
                      {task.enabled ? 'pause_circle' : 'play_circle'}
                    </span>
                    {task.enabled ? t('common.disable') : t('common.enable')}
                  </button>

                  <div className="my-1 h-px bg-[var(--pd-color-border-separator)]" />

                  {/* Delete */}
                  <button
                    onClick={() => setConfirmAction('delete')}
                    className={`${menuItem} text-[var(--pd-color-error)] hover:bg-[var(--pd-color-error-container)]/18`}
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    {t('common.delete')}
                  </button>
                </div>
              )}

              {/* Confirm popovers for menu actions */}
              {confirmAction === 'toggle' && (
                <div ref={confirmRef}>
                  <ConfirmPopover
                    message={task.enabled ? t('tasks.confirmDisable') : t('tasks.confirmEnable')}
                    confirmLabel={task.enabled ? t('common.disable') : t('common.enable')}
                    onConfirm={handleToggle}
                    onCancel={() => {
                      setConfirmAction(null);
                      setShowMenu(false);
                    }}
                    cancelLabel={t('common.cancel')}
                  />
                </div>
              )}
              {confirmAction === 'delete' && (
                <div ref={confirmRef}>
                  <ConfirmPopover
                    message={t('tasks.confirmDelete')}
                    confirmLabel={t('common.delete')}
                    onConfirm={handleDelete}
                    onCancel={() => {
                      setConfirmAction(null);
                      setShowMenu(false);
                    }}
                    cancelLabel={t('common.cancel')}
                    variant="error"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Runs panel */}
      {showLogs && (
        <div className="px-4 pb-3">
          <PdTaskRunsPanel taskId={task.id} onClose={onToggleLogs} refreshKey={logsRefreshKey} />
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <PdNewTaskModal open editTask={task} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}

// ─── Confirm Popover ─────────────────────────────────────────────────────────

function ConfirmPopover({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  cancelLabel,
  variant = 'brand',
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  cancelLabel: string;
  variant?: 'brand' | 'error';
}) {
  return (
    <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] shadow-lg p-3">
      <p className="text-xs text-[var(--pd-color-text-secondary)] mb-2.5">{message}</p>
      <div className="flex justify-end gap-1.5">
        <button
          onClick={onCancel}
          className="px-2.5 py-1 text-xs rounded-[var(--pd-radius-sm)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`px-2.5 py-1 text-xs rounded-[var(--pd-radius-sm)] hover:opacity-90 transition-opacity ${
            variant === 'error'
              ? 'bg-[var(--pd-color-error-container)] text-[var(--pd-color-on-error-container)]'
              : 'bg-[image:var(--pd-gradient-btn-primary)] text-[var(--pd-color-btn-primary-fg)]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
