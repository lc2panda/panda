// Input: onCreateTask 回调（可选，未传则隐藏按钮）+ i18n
// Output: 嵌入式空态组件 — clock hero icon + 标题 + 副标题（含落盘路径提示）+ "新建任务"按钮
// Pos: Pages — PdScheduledTasks 容器在 tasks.length===0 时调度
//
// 历史：S9 之前为 cc-haha pixel-perfect prototype，全屏壳 + mockStatusBar；
// S10 改造：删 mock + 删全屏壳（sidebar/header/footer），保留空态 hero。
//   副标题追加真实落盘路径 "~/.pandacc/scheduled_tasks.json" 让 Comdr 知道
//   panda-desk-chat 的定时任务真存盘到哪个文件，不再杜撰。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { t } from '../i18n';

type Props = {
  onCreateTask?: () => void;
};

export function PdScheduledTasksEmpty({ onCreateTask }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      {/* Hero clock icon */}
      <div className="w-24 h-24 rounded-full bg-[var(--pd-color-surface-container)] flex items-center justify-center mb-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[var(--pd-color-surface)] flex items-center justify-center border border-[var(--pd-color-border)]/60">
          <span
            className="material-symbols-outlined text-[var(--pd-color-brand)] text-4xl"
            style={{ fontVariationSettings: "'wght' 300" }}
          >
            schedule
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-2">
        {t('tasks.emptyTitle')}
      </h3>

      {/* Subtitle + 真实存储路径提示 */}
      <p className="text-sm text-[var(--pd-color-text-secondary)] text-center max-w-md mb-2">
        {t('tasks.emptyDesc')}
      </p>
      <p className="text-xs text-[var(--pd-color-text-tertiary)] text-center max-w-md mb-6">
        任务存储在{' '}
        <code className="px-1.5 py-0.5 rounded bg-[var(--pd-color-surface-container)] font-[var(--pd-font-mono)] text-[11px]">
          ~/.pandacc/scheduled_tasks.json
        </code>
      </p>

      {/* CTA */}
      {onCreateTask && (
        <button
          type="button"
          onClick={onCreateTask}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--pd-color-brand)] hover:bg-[var(--pd-color-brand-hover)] text-white rounded-2xl font-medium text-sm shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add_task</span>
          <span>{t('tasks.newTask')}</span>
        </button>
      )}
    </div>
  );
}

export default PdScheduledTasksEmpty;
