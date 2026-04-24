// Input: tasks array (pending|in_progress|done), optional progress override
// Output: Inline checklist card with progress bar, per-task circle marker
// Pos: Chat layer — rendered inline inside assistant messages for TodoWrite tool output
// Reference: cc-haha/src/components/chat/InlineTaskSummary (design spec only, not source)

import React, { useMemo } from 'react';
import { cn } from '../../lib/cn';

export type PdTaskStatus = 'pending' | 'in_progress' | 'done';

export interface PdTask {
  id: string;
  title: string;
  status: PdTaskStatus;
}

export interface PdInlineTaskSummaryProps {
  tasks: PdTask[];
  className?: string;
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 8 6.5 11.5 13 5" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 12 5 14 9 10" />
      <polyline points="3 5 5 7 9 3" />
      <polyline points="3 19 5 21 9 17" />
      <line x1="13" y1="6" x2="21" y2="6" />
      <line x1="13" y1="12" x2="21" y2="12" />
      <line x1="13" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export const PdInlineTaskSummary: React.FC<PdInlineTaskSummaryProps> = React.memo(
  ({ tasks, className }) => {
    const { doneCount, total, pct } = useMemo(() => {
      const t = tasks.length;
      const d = tasks.filter((x) => x.status === 'done').length;
      return { doneCount: d, total: t, pct: t > 0 ? Math.round((d / t) * 100) : 0 };
    }, [tasks]);

    return (
      <div
        className={cn(
          'rounded-[14px] border border-[var(--pd-color-border)]',
          'bg-[var(--pd-color-bg-elevated)] p-3',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[var(--pd-color-accent)]">
            <ChecklistIcon />
          </span>
          <span className="text-[13px] font-[var(--pd-font-medium)] text-[var(--pd-color-fg)]">
            Tasks
          </span>
          <span className="ml-auto text-[11px] text-[var(--pd-color-fg-muted)]">
            {doneCount} of {total} completed
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-[var(--pd-color-bg-subtle)] overflow-hidden">
          <div
            className="h-full bg-[var(--pd-color-accent)] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Task list */}
        <ul className="mt-3 space-y-1.5 list-none p-0 m-0">
          {tasks.map((task) => {
            const isDone = task.status === 'done';
            const isRunning = task.status === 'in_progress';
            return (
              <li
                key={task.id}
                className="flex items-center gap-2.5 text-[13px] leading-[1.45]"
              >
                <span
                  className={cn(
                    'shrink-0 inline-flex items-center justify-center',
                    'w-[16px] h-[16px] rounded-full',
                    'transition-colors duration-200',
                  )}
                  style={{
                    background: isDone
                      ? 'var(--pd-color-success, #16A34A)'
                      : isRunning
                        ? 'var(--pd-color-accent)'
                        : 'transparent',
                    border: isDone || isRunning
                      ? 'none'
                      : '1.5px solid var(--pd-color-border)',
                    color: '#fff',
                  }}
                  aria-label={task.status}
                >
                  {isDone && <CheckIcon />}
                  {isRunning && (
                    <span
                      className="w-[6px] h-[6px] rounded-full bg-white"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span
                  className={cn(
                    'flex-1 min-w-0',
                    isDone && 'line-through text-[var(--pd-color-fg-muted)]',
                    !isDone && 'text-[var(--pd-color-fg)]',
                  )}
                >
                  {task.title}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

PdInlineTaskSummary.displayName = 'PdInlineTaskSummary';
