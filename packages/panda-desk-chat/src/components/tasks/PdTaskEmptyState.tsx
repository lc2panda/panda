// Input: onCreateTask callback (open new-task modal)
// Output: 居中空态 — clock SVG + 标题 + 描述 + Button CTA
// Pos: components/tasks/ — ScheduledTasks 页面 tasks.length===0 分支
//
// Source 1:1: cc-haha desktop/src/components/tasks/TaskEmptyState.tsx L1-30 (30 行)
//   panda 适配：var(--color-*) → var(--pd-color-*);Button → PdButton;t() 函数
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { PdButton } from '../shared/PdButton';
import { t } from '../../i18n';

type Props = {
  onCreateTask: () => void;
};

export function PdTaskEmptyState({ onCreateTask }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Clock icon */}
      <div className="w-16 h-16 rounded-full bg-[var(--pd-color-surface-info)] flex items-center justify-center mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--pd-color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      <h3 className="text-sm font-medium text-[var(--pd-color-text-primary)] mb-1">
        {t('tasks.emptyTitle')}
      </h3>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-4 text-center max-w-sm">
        {t('tasks.emptyDesc')}
      </p>

      <PdButton onClick={onCreateTask}>{t('tasks.newTask')}</PdButton>
    </div>
  );
}
