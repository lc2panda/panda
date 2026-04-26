// Input: tasks 数组（CronTask[]）
// Output: 3 stat cards (total/active/disabled) + accordion 列表（PdTaskRow * N）
// Pos: components/tasks/ — ScheduledTasks 页面 tasks.length>0 分支
//
// Source 1:1: cc-haha desktop/src/components/tasks/TaskList.tsx L1-46 (46 行)
//   panda 适配：var(--color-*) → var(--pd-color-*); useTranslation → t()
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useState } from 'react';
import type { CronTask } from '../../types/task';
import { PdTaskRow } from './PdTaskRow';
import { t } from '../../i18n';

type Props = {
  tasks: CronTask[];
};

export function PdTaskList({ tasks }: Props) {
  const enabledCount = tasks.filter((task) => task.enabled).length;
  const [expandedLogsId, setExpandedLogsId] = useState<string | null>(null);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label={t('tasks.totalTasks')} value={String(tasks.length)} />
        <StatCard label={t('tasks.active')} value={String(enabledCount)} />
        <StatCard label={t('tasks.disabled')} value={String(tasks.length - enabledCount)} />
      </div>

      {/* Task rows — accordion: only one logs panel open at a time */}
      <div className="flex flex-col">
        {tasks.map((task) => (
          <PdTaskRow
            key={task.id}
            task={task}
            showLogs={expandedLogsId === task.id}
            onToggleLogs={() => setExpandedLogsId(expandedLogsId === task.id ? null : task.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 rounded-[var(--pd-radius-lg)] bg-[var(--pd-color-surface-info)]">
      <div className="text-2xl font-bold text-[var(--pd-color-text-primary)]">{value}</div>
      <div className="text-xs text-[var(--pd-color-text-secondary)]">{label}</div>
    </div>
  );
}
