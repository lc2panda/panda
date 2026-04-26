// Input: tasks (TaskSummaryItem[] — id/subject/status/activeForm)
// Output: cc-haha 1:1 inline checklist card — header + per-task material-symbols + line-through done
// Pos:    Chat layer — rendered inline inside assistant messages for TodoWrite/TaskSummary outputs
//
// Source 1:1: cc-haha desktop/src/components/chat/InlineTaskSummary.tsx (L1-60)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import type { TaskSummaryItem } from '../../types/chat'
import { t } from '../../i18n'

const statusIcon: Record<TaskSummaryItem['status'], string> = {
  pending: 'radio_button_unchecked',
  in_progress: 'pending',
  completed: 'check_circle',
}

const statusColor: Record<TaskSummaryItem['status'], string> = {
  pending: 'var(--pd-color-text-tertiary)',
  in_progress: 'var(--pd-color-warning)',
  completed: 'var(--pd-color-success)',
}

export interface PdInlineTaskSummaryProps {
  tasks: TaskSummaryItem[]
}

export function PdInlineTaskSummary({ tasks }: PdInlineTaskSummaryProps) {
  const completed = tasks.filter((tk) => tk.status === 'completed').length
  const total = tasks.length

  return (
    <div className="mb-3 rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container-lowest)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 bg-[var(--pd-color-surface-container)]">
        <div className="flex items-center justify-center w-5 h-5 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-success)]/10">
          <span className="material-symbols-outlined text-[13px] text-[var(--pd-color-success)]" style={{ fontVariationSettings: "'FILL' 1" }}>
            task_alt
          </span>
        </div>
        <span className="text-xs font-semibold text-[var(--pd-color-text-primary)]">
          {t('tasks.completed') || 'Completed'}
        </span>
        <span className="text-[10px] text-[var(--pd-color-text-tertiary)] tabular-nums">
          {completed}/{total}
        </span>
      </div>
      <div className="px-4 py-2 flex flex-col gap-0.5">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-2 py-1 px-1">
            <span
              className="material-symbols-outlined text-[14px] shrink-0"
              style={{ color: statusColor[task.status], fontVariationSettings: "'FILL' 1" }}
            >
              {statusIcon[task.status]}
            </span>
            <span className="text-[10px] font-mono text-[var(--pd-color-text-tertiary)]">
              #{task.id}
            </span>
            <span className={`text-xs ${
              task.status === 'completed'
                ? 'text-[var(--pd-color-text-tertiary)] line-through'
                : 'text-[var(--pd-color-text-primary)]'
            }`}>
              {task.subject}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

PdInlineTaskSummary.displayName = 'PdInlineTaskSummary'
