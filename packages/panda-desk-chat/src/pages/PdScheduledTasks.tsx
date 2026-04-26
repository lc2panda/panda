// Input: useScheduleStore (真实 IPC tasks/loadTasks) + uiStore.activeModal('new-task')
// Output: ScheduledTasks 容器 — header + desktop notice + List/EmptyState 切换 + NewTaskModal
// Pos: Pages — uiStore.activeView === 'scheduled' 时由 PdContentRouter 加载
//
// 历史：S9 用 useTaskStore（cc-haha 1:1 形态，CronTask 转换层）；
// S10 切到 useScheduleStore 直接消费 ScheduledTask[]，去掉中间转换层。
//   切换/触发依赖共用 ~/.pandacc/scheduled_tasks.json，
//   PdNewTaskModal 内部仍走 taskStore.createTask（同 IPC channel，broadcast 同步），
//   两 store 通过 onScheduledTasksUpdated 自动一致。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect } from 'react';
import { useScheduleStore } from '../stores/scheduleStore';
import { useUIStore } from '../stores/uiStore';
import { t } from '../i18n';
import { PdButton } from '../components/shared/PdButton';
import { PdNewTaskModal } from '../components/tasks/PdNewTaskModal';
import { PdScheduledTasksList } from './PdScheduledTasksList';
import { PdScheduledTasksEmpty } from './PdScheduledTasksEmpty';

export function PdScheduledTasks() {
  const tasks = useScheduleStore((s) => s.tasks);
  const loading = useScheduleStore((s) => s.loading);
  const loadTasks = useScheduleStore((s) => s.loadTasks);
  const { activeModal, openModal, closeModal } = useUIStore();

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const isEmpty = tasks.length === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--pd-color-text-primary)]">
              {t('scheduledPage.title')}
            </h1>
            <p className="mt-1 text-sm text-[var(--pd-color-text-secondary)]">
              {(() => {
                const parts = t('scheduledPage.subtitle').split('{code}');
                return (
                  <>
                    {parts[0]}
                    <code className="px-1 py-0.5 rounded bg-[var(--pd-color-surface-container)] text-xs font-[var(--pd-font-mono)]">
                      /schedule
                    </code>
                    {parts[1]}
                  </>
                );
              })()}
            </p>
          </div>
          <PdButton onClick={() => openModal('new-task')}>{t('tasks.newTask')}</PdButton>
        </div>

        {/* Desktop-online notice */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-warning)]/8 border border-[var(--pd-color-warning)]/15 mb-6">
          <span className="material-symbols-outlined text-[18px] text-[var(--pd-color-warning)]">
            schedule
          </span>
          <span className="text-xs text-[var(--pd-color-text-secondary)]">
            {t('scheduledPage.desktopNotice')}
          </span>
        </div>

        {/* Content — Empty / List dispatcher */}
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-[var(--pd-color-brand)] border-t-transparent rounded-full" />
          </div>
        ) : isEmpty ? (
          <PdScheduledTasksEmpty onCreateTask={() => openModal('new-task')} />
        ) : (
          <PdScheduledTasksList />
        )}
      </div>

      {/* New Task Modal — 真实 IPC 写入 ~/.pandacc/scheduled_tasks.json */}
      {activeModal === 'new-task' && <PdNewTaskModal open onClose={closeModal} />}
    </div>
  );
}

export default PdScheduledTasks;
