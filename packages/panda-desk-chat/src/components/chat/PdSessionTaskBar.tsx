// Input: nothing (reads cliTaskStore stub state internally — TODO once panda has cliTaskStore)
// Output: cc-haha 1:1 sticky session task bar — header + progress bar + expand/collapse + per-task rows
// Pos:    Chat layer — sticky above MessageList while CLI agent has open tasks
//
// Source 1:1: cc-haha desktop/src/components/chat/SessionTaskBar.tsx (L1-159)
//
// Notes:
// - panda 没有 cliTaskStore — 我们读 panda chatStore 内 task_summary 类消息（如有），
//   并提供 stub `tasks=[]` 让组件无副作用渲染（cc-haha L34: tasks.length===0 → return null）。
//   一旦 S1 Agent 把 cliTaskStore 接进来，把 useTaskState() 替换即可。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import { useState } from 'react'
import { t } from '../../i18n'

interface CLITask {
  id: string
  subject: string
  status: 'pending' | 'in_progress' | 'completed'
  activeForm?: string
  owner?: string
}

const statusConfig = {
  pending: {
    icon: 'radio_button_unchecked',
    color: 'var(--pd-color-text-tertiary)',
    label: 'pending',
  },
  in_progress: {
    icon: 'pending',
    color: 'var(--pd-color-warning)',
    label: 'active',
  },
  completed: {
    icon: 'check_circle',
    color: 'var(--pd-color-success)',
    label: 'done',
  },
} as const

/**
 * Stub state hook — wires to panda cliTaskStore once landed by S1 Agent.
 * Returning empty list short-circuits the bar (cc-haha L34).
 *
 * TODO(S1): replace with `import { useCLITaskStore } from '../../stores/cliTaskStore'`.
 */
function useTaskState() {
  const [expanded, setExpanded] = useState(true)
  return {
    tasks: [] as CLITask[],
    expanded,
    toggleExpanded: () => setExpanded((v) => !v),
    completedAndDismissed: false,
    resetCompletedTasks: async () => {
      /* noop until cliTaskStore lands */
    },
  }
}

export function PdSessionTaskBar() {
  const {
    tasks,
    expanded,
    toggleExpanded,
    completedAndDismissed,
    resetCompletedTasks,
  } = useTaskState()

  if (tasks.length === 0) return null

  // Don't show sticky bar if tasks were completed and the user already continued chatting
  const allCompleted = tasks.every((tk) => tk.status === 'completed')
  if (allCompleted && completedAndDismissed) return null

  const completedCount = tasks.filter((tk) => tk.status === 'completed').length
  const totalCount = tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="shrink-0 px-8">
      <div className="mx-auto max-w-[860px] rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container-lowest)] overflow-hidden mb-2">
        {/* Header — always visible, clickable to toggle */}
        <div className="flex items-center gap-2 bg-[var(--pd-color-surface-container)] px-2 py-1.5">
          <button
            type="button"
            onClick={toggleExpanded}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--pd-radius-md)] px-2 py-1 hover:bg-[var(--pd-color-surface-container-low)] transition-colors"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-secondary)]/10">
              <span
                className="material-symbols-outlined text-[14px] text-[var(--pd-color-secondary)]"
              >
                checklist
              </span>
            </div>

            <span className="text-xs font-semibold text-[var(--pd-color-text-primary)]">
              {t('tasks.title') || 'Tasks'}
            </span>

            {/* Progress bar */}
            <div className="flex-1 h-1.5 rounded-full bg-[var(--pd-color-border)] overflow-hidden max-w-[200px]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: completedCount === totalCount
                    ? 'var(--pd-color-success)'
                    : 'var(--pd-color-brand)',
                }}
              />
            </div>

            <span className="text-[10px] text-[var(--pd-color-text-tertiary)] tabular-nums">
              {completedCount}/{totalCount}
            </span>

            <span
              className="material-symbols-outlined text-[14px] text-[var(--pd-color-text-tertiary)] transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              expand_less
            </span>
          </button>

          {allCompleted && (
            <button
              type="button"
              aria-label={t('tasks.dismissCompleted') || 'Dismiss'}
              onClick={() => { void resetCompletedTasks() }}
              className="flex shrink-0 items-center justify-center rounded-[var(--pd-radius-md)] p-1.5 text-[var(--pd-color-text-tertiary)] hover:bg-[var(--pd-color-surface-container-low)] hover:text-[var(--pd-color-text-primary)] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Expanded task list */}
        {expanded && (
          <div className="px-4 pb-2 pt-1 flex flex-col gap-0.5 max-h-[240px] overflow-y-auto border-t border-[var(--pd-color-outline-variant)]/20">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskItem({ task }: { task: CLITask }) {
  const config = statusConfig[task.status]

  return (
    <div className="flex items-start gap-2 py-1.5 px-1 rounded-md">
      <span
        className="material-symbols-outlined text-[16px] mt-px shrink-0"
        style={{ color: config.color, fontVariationSettings: "'FILL' 1" }}
      >
        {config.icon}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
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

        {task.status === 'in_progress' && task.activeForm && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--pd-color-warning)] animate-pulse" />
            <span className="text-[10px] text-[var(--pd-color-warning)]">
              {task.activeForm}
            </span>
          </div>
        )}

        {task.owner && (
          <span className="text-[10px] text-[var(--pd-color-text-tertiary)] mt-0.5 inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">person</span>
            {task.owner}
          </span>
        )}
      </div>
    </div>
  )
}

PdSessionTaskBar.displayName = 'PdSessionTaskBar'
