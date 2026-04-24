// Input: none (future: scheduled task store)
// Output: Scheduled tasks page with Header, 3 stat cards, task list, execution logs
// Pos: Main content area, shown when uiStore.activeView === 'scheduled'
// Reference: cc-haha desktop_ui 08_scheduled_task (design spec only, not source)

import React, { useState, type ComponentType } from 'react';
import {
  Plus as _Plus,
  X as _X,
  // @ts-ignore lucide-react bundled .d.ts omits these top-level exports
  Clock as _Clock,
  // @ts-ignore
  Play as _Play,
  // @ts-ignore
  FileText as _FileText,
  // @ts-ignore
  MoreHorizontal as _More,
  // @ts-ignore
  CheckCircle2 as _Check,
  // @ts-ignore
  AlertCircle as _Alert,
} from 'lucide-react';
import { cn } from '../lib/cn';

type IconFC = ComponentType<{ className?: string; size?: number }>;
const Plus = _Plus as IconFC;
const Clock = _Clock as IconFC;
const Play = _Play as IconFC;
const FileText = _FileText as IconFC;
const More = _More as IconFC;
const X = _X as IconFC;
const Check = _Check as IconFC;
const Alert = _Alert as IconFC;

export interface ScheduledTaskRun {
  id: string;
  status: 'completed' | 'failed';
  timestamp: string;
  durationSeconds: number;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  frequency: string;
  createdAt: string;
  lastRun?: string;
  isRunning: boolean;
  logs: ScheduledTaskRun[];
}

export interface ScheduledPageProps {
  className?: string;
  tasks?: ScheduledTask[];
}

const DEMO_TASKS: ScheduledTask[] = [];

export const ScheduledPage: React.FC<ScheduledPageProps> = ({ className, tasks = DEMO_TASKS }) => {
  const [expandedLogsId, setExpandedLogsId] = useState<string | null>(null);

  const total = tasks.length;
  const active = tasks.filter((t) => t.isRunning).length;
  const disabled = total - active;

  return (
    <div
      className={cn('h-full overflow-y-auto', className)}
      style={{ background: 'var(--pd-color-bg)' }}
    >
      <div className="max-w-[1100px] mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[24px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)] leading-tight">
              Scheduled tasks
            </h1>
            <p className="mt-1 text-[14px] text-[var(--pd-color-fg-muted)] max-w-[720px]">
              Run tasks on a schedule or whenever you need them. Type{' '}
              <code className="px-1.5 py-0.5 rounded-[4px] bg-[var(--pd-color-bg-subtle)] font-[family-name:var(--pd-font-mono)] text-[12px]">
                /schedule
              </code>{' '}
              in any existing session to create one.
            </p>
          </div>
          <button
            type="button"
            className={cn(
              'h-9 px-4 rounded-[8px] flex items-center gap-1.5',
              'bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent)]',
              'text-[13px] font-[var(--pd-font-medium)]',
              'shadow-[var(--pd-shadow-button-primary)]',
              'hover:bg-[var(--pd-color-accent-hover)] active:bg-[var(--pd-color-accent-active)]',
              'transition-colors',
            )}
          >
            <Plus size={14} />
            <span>New task</span>
          </button>
        </div>

        {/* Warning banner */}
        <div
          className="flex items-center gap-2 rounded-[12px] px-3 py-2.5 mb-6"
          style={{
            background: 'var(--pd-color-warning-subtle, rgba(202, 138, 4, 0.08))',
            border: '1px solid var(--pd-color-warning-border, rgba(202, 138, 4, 0.25))',
          }}
        >
          <Clock size={16} className="shrink-0 text-[var(--pd-color-warning,#CA8A04)]" />
          <span className="text-[13px] text-[var(--pd-color-fg)]">
            Scheduled tasks only run while the desktop app is open. Make sure it stays running for tasks to fire on time.
          </span>
        </div>

        {/* Stats row — cc-haha StatCard spec: grid-3 gap-4, card px-4 py-3 rounded-lg bg surface-info, num text-2xl, label text-xs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Tasks', value: total },
            { label: 'Active', value: active },
            { label: 'Disabled', value: disabled },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[12px] px-4 py-3"
              style={{ background: 'var(--pd-color-bg-subtle, #F4F4F0)' }}
            >
              <div className="text-[24px] font-[var(--pd-font-bold)] text-[var(--pd-color-fg)] leading-tight">
                {card.value}
              </div>
              <div className="text-[12px] text-[var(--pd-color-fg-muted)] mt-1">
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <div
            className="rounded-[12px] border border-dashed border-[var(--pd-color-border)] py-16 flex flex-col items-center gap-3"
          >
            <Clock size={32} className="text-[var(--pd-color-fg-subtle)]" />
            <div className="text-[14px] text-[var(--pd-color-fg-muted)]">
              No scheduled tasks yet
            </div>
            <div className="text-[12px] text-[var(--pd-color-fg-subtle)]">
              Create one from the button above, or type <code className="font-[family-name:var(--pd-font-mono)]">/schedule</code> inside any session.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-[12px] border border-[var(--pd-color-border)] bg-[var(--pd-color-bg-elevated)] p-4"
              >
                <div className="flex items-start gap-2">
                  <span
                    className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full"
                    style={{
                      background: task.isRunning
                        ? 'var(--pd-color-success, #16A34A)'
                        : 'var(--pd-color-fg-subtle, #A0A09D)',
                    }}
                    aria-label={task.isRunning ? 'running' : 'idle'}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-[var(--pd-font-medium)] text-[var(--pd-color-fg)] leading-tight">
                      {task.name}
                    </h3>
                    <p className="mt-1 text-[13px] text-[var(--pd-color-fg-muted)]">
                      {task.description}
                    </p>
                    <div className="mt-1 text-[11px] text-[var(--pd-color-fg-subtle)]">
                      Created: {task.createdAt}
                      {task.lastRun ? ` · Last run: ${task.lastRun}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <span className="text-[11px] text-[var(--pd-color-fg-muted)] px-2 py-1 rounded-[6px] bg-[var(--pd-color-bg-subtle)]">
                      {task.frequency}
                    </span>
                    <button
                      type="button"
                      aria-label="Run now"
                      className="h-8 w-8 rounded-[6px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
                    >
                      <Play size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Toggle logs"
                      onClick={() =>
                        setExpandedLogsId((prev) => (prev === task.id ? null : task.id))
                      }
                      className="h-8 w-8 rounded-[6px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
                    >
                      <FileText size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="More options"
                      className="h-8 w-8 rounded-[6px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
                    >
                      <More size={14} />
                    </button>
                  </div>
                </div>

                {expandedLogsId === task.id && (
                  <div className="mt-3 rounded-[12px] bg-[var(--pd-color-bg-subtle)] p-4 relative">
                    <button
                      type="button"
                      aria-label="Close logs"
                      onClick={() => setExpandedLogsId(null)}
                      className="absolute top-2 right-2 h-6 w-6 rounded-[4px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
                    >
                      <X size={12} />
                    </button>
                    <h4 className="text-[11px] font-[var(--pd-font-semibold)] uppercase tracking-wide text-[var(--pd-color-fg-muted)] mb-2">
                      Execution logs
                    </h4>
                    <ul className="space-y-1.5 list-none m-0 p-0">
                      {task.logs.map((run) => {
                        const ok = run.status === 'completed';
                        return (
                          <li
                            key={run.id}
                            className="flex items-center gap-3 text-[13px]"
                          >
                            {ok ? (
                              <Check size={14} className="text-[var(--pd-color-success,#16A34A)] shrink-0" />
                            ) : (
                              <Alert size={14} className="text-[var(--pd-color-error,#BA1A1A)] shrink-0" />
                            )}
                            <span
                              className={cn(
                                'font-[var(--pd-font-medium)] min-w-[72px]',
                                ok ? 'text-[var(--pd-color-success,#16A34A)]' : 'text-[var(--pd-color-error,#BA1A1A)]',
                              )}
                            >
                              {ok ? 'Completed' : 'Failed'}
                            </span>
                            <span className="text-[var(--pd-color-fg-muted)]">
                              {run.timestamp}
                            </span>
                            <span className="text-[var(--pd-color-fg-subtle)] min-w-[48px]">
                              {run.durationSeconds}s
                            </span>
                            <a
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="ml-auto text-[11px] text-[var(--pd-color-accent)] hover:underline"
                            >
                              Summary
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledPage;
