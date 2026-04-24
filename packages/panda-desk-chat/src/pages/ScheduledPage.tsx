// Input: scheduleStore (tasks + CRUD), user clicks on stats / toggle / run-now / new-task
// Output: Scheduled tasks page with Header, 3 stat cards, task list, execution logs, New-task modal
// Pos: Main content area, shown when uiStore.activeView === 'scheduled'
// Reference: cc-haha desktop_ui 08_scheduled_task (design spec only, not source)

import React, { useEffect, useMemo, useState, type ComponentType } from 'react';
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
  CheckCircle2 as _Check,
  // @ts-ignore
  AlertCircle as _Alert,
  // @ts-ignore
  PauseCircle as _Pause,
  // @ts-ignore
  Trash2 as _Trash,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { useScheduleStore } from '../stores/scheduleStore';
import type { ScheduledTask, CreateScheduledTaskInput } from '../ipc/types';

type IconFC = ComponentType<{ className?: string; size?: number }>;
const Plus = _Plus as IconFC;
const Clock = _Clock as IconFC;
const Play = _Play as IconFC;
const FileText = _FileText as IconFC;
const X = _X as IconFC;
const Check = _Check as IconFC;
const Alert = _Alert as IconFC;
const Pause = _Pause as IconFC;
const Trash = _Trash as IconFC;

export interface ScheduledPageProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Preset cron options — matches common UI patterns
// ---------------------------------------------------------------------------

interface CronPreset {
  label: string;
  cron: string;
}

const CRON_PRESETS: CronPreset[] = [
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every hour',       cron: '0 * * * *' },
  { label: 'Every day at 09:00', cron: '0 9 * * *' },
  { label: 'Weekdays at 09:00',  cron: '0 9 * * 1-5' },
  { label: 'Every Monday 09:00', cron: '0 9 * * 1' },
  { label: 'Custom',             cron: '' },
];

function humanizeCron(expr: string): string {
  const preset = CRON_PRESETS.find((p) => p.cron === expr.trim());
  return preset && preset.label !== 'Custom' ? preset.label : expr;
}

function formatRelative(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  if (abs < 60_000) return diffMs > 0 ? 'in <1m' : 'just now';
  if (abs < 60 * 60_000) {
    const m = Math.round(abs / 60_000);
    return diffMs > 0 ? `in ${m}m` : `${m}m ago`;
  }
  if (abs < 24 * 60 * 60_000) {
    const h = Math.round(abs / (60 * 60_000));
    return diffMs > 0 ? `in ${h}h` : `${h}h ago`;
  }
  return d.toLocaleString();
}

function formatDuration(ms?: number): string {
  if (!ms || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const ScheduledPage: React.FC<ScheduledPageProps> = ({ className }) => {
  const tasks = useScheduleStore((s) => s.tasks);
  const loading = useScheduleStore((s) => s.loading);
  const error = useScheduleStore((s) => s.error);
  const loadTasks = useScheduleStore((s) => s.loadTasks);
  const createTask = useScheduleStore((s) => s.createTask);
  const deleteTask = useScheduleStore((s) => s.deleteTask);
  const toggleTask = useScheduleStore((s) => s.toggleTask);
  const runTaskNow = useScheduleStore((s) => s.runTaskNow);

  const [expandedLogsId, setExpandedLogsId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    // Defensive: if the bridge auto-load raced the mount, refresh here too.
    if (tasks.length === 0 && !loading) void loadTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { total, active, disabled } = useMemo(() => {
    const t = tasks.length;
    const a = tasks.filter((x) => x.status === 'active').length;
    return { total: t, active: a, disabled: t - a };
  }, [tasks]);

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
            onClick={() => setCreateOpen(true)}
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

        {error && (
          <div className="mb-4 rounded-[12px] px-3 py-2.5 text-[13px] bg-[var(--pd-color-error-subtle,rgba(186,26,26,0.08))] text-[var(--pd-color-error,#BA1A1A)]">
            {error}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Tasks', value: total },
            { label: 'Active',      value: active },
            { label: 'Disabled',    value: disabled },
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

        {/* Task list / empty state */}
        {tasks.length === 0 ? (
          <EmptyState onNew={() => setCreateOpen(true)} />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                expanded={expandedLogsId === task.id}
                onToggleLogs={() =>
                  setExpandedLogsId((prev) => (prev === task.id ? null : task.id))
                }
                onRunNow={() => void runTaskNow(task.id)}
                onToggle={() => void toggleTask(task.id)}
                onDelete={() => void deleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <NewTaskModal
          onClose={() => setCreateOpen(false)}
          onCreate={async (input) => {
            const created = await createTask(input);
            if (created) setCreateOpen(false);
            return created;
          }}
        />
      )}
    </div>
  );
};

export default ScheduledPage;

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

interface TaskRowProps {
  task: ScheduledTask;
  expanded: boolean;
  onToggleLogs: () => void;
  onRunNow: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, expanded, onToggleLogs, onRunNow, onToggle, onDelete }) => {
  const isActive = task.status === 'active';
  const isRunning = task.logs.some((l) => l.status === 'running');

  return (
    <div
      className="rounded-[12px] border border-[var(--pd-color-border)] bg-[var(--pd-color-bg-elevated)] p-4"
    >
      <div className="flex items-start gap-2">
        <span
          className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full"
          style={{
            background: isRunning
              ? 'var(--pd-color-accent, #D97B4F)'
              : isActive
                ? 'var(--pd-color-success, #16A34A)'
                : 'var(--pd-color-fg-subtle, #A0A09D)',
          }}
          aria-label={isRunning ? 'running' : isActive ? 'active' : 'disabled'}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-[var(--pd-font-medium)] text-[var(--pd-color-fg)] leading-tight">
            {task.name}
          </h3>
          {task.description && (
            <p className="mt-1 text-[13px] text-[var(--pd-color-fg-muted)]">
              {task.description}
            </p>
          )}
          <div className="mt-1 text-[11px] text-[var(--pd-color-fg-subtle)]">
            Created: {new Date(task.createdAt).toLocaleString()}
            {task.lastRunAt ? ` · Last run: ${formatRelative(task.lastRunAt)}` : ''}
            {task.nextRunAt && isActive ? ` · Next run: ${formatRelative(task.nextRunAt)}` : ''}
            {' · Runs: '}{task.runCount}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <span
            className="text-[11px] text-[var(--pd-color-fg-muted)] px-2 py-1 rounded-[6px] bg-[var(--pd-color-bg-subtle)]"
            title={task.cron}
          >
            {humanizeCron(task.cron)}
          </span>
          <button
            type="button"
            aria-label="Run now"
            title="Run now"
            onClick={onRunNow}
            className="h-8 w-8 rounded-[6px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
          >
            <Play size={14} />
          </button>
          <button
            type="button"
            aria-label={isActive ? 'Disable' : 'Enable'}
            title={isActive ? 'Disable' : 'Enable'}
            onClick={onToggle}
            className="h-8 w-8 rounded-[6px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
          >
            {isActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            aria-label="Toggle logs"
            title="Toggle logs"
            onClick={onToggleLogs}
            className="h-8 w-8 rounded-[6px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
          >
            <FileText size={14} />
          </button>
          <button
            type="button"
            aria-label="Delete"
            title="Delete"
            onClick={onDelete}
            className="h-8 w-8 rounded-[6px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-error,#BA1A1A)]"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 rounded-[12px] bg-[var(--pd-color-bg-subtle)] p-4 relative">
          <button
            type="button"
            aria-label="Close logs"
            onClick={onToggleLogs}
            className="absolute top-2 right-2 h-6 w-6 rounded-[4px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
          >
            <X size={12} />
          </button>
          <h4 className="text-[11px] font-[var(--pd-font-semibold)] uppercase tracking-wide text-[var(--pd-color-fg-muted)] mb-2">
            Execution logs
          </h4>
          {task.logs.length === 0 ? (
            <div className="text-[12px] text-[var(--pd-color-fg-subtle)]">No runs yet.</div>
          ) : (
            <ul className="space-y-1.5 list-none m-0 p-0">
              {[...task.logs].reverse().map((run) => {
                const ok = run.status === 'completed';
                const failed = run.status === 'failed';
                return (
                  <li key={run.id} className="flex items-center gap-3 text-[13px]">
                    {ok ? (
                      <Check size={14} className="text-[var(--pd-color-success,#16A34A)] shrink-0" />
                    ) : failed ? (
                      <Alert size={14} className="text-[var(--pd-color-error,#BA1A1A)] shrink-0" />
                    ) : (
                      <Clock size={14} className="text-[var(--pd-color-accent,#D97B4F)] shrink-0" />
                    )}
                    <span
                      className={cn(
                        'font-[var(--pd-font-medium)] min-w-[72px]',
                        ok && 'text-[var(--pd-color-success,#16A34A)]',
                        failed && 'text-[var(--pd-color-error,#BA1A1A)]',
                        !ok && !failed && 'text-[var(--pd-color-accent,#D97B4F)]',
                      )}
                    >
                      {ok ? 'Completed' : failed ? 'Failed' : 'Running'}
                    </span>
                    <span className="text-[var(--pd-color-fg-muted)]">
                      {new Date(run.startedAt).toLocaleString()}
                    </span>
                    <span className="text-[var(--pd-color-fg-subtle)] min-w-[48px]">
                      {formatDuration(run.durationMs)}
                    </span>
                    {run.error && (
                      <span className="ml-auto text-[11px] text-[var(--pd-color-error,#BA1A1A)] truncate max-w-[260px]" title={run.error}>
                        {run.error}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ onNew: () => void }> = ({ onNew }) => (
  <div className="rounded-[12px] border border-dashed border-[var(--pd-color-border)] py-16 flex flex-col items-center gap-3">
    <Clock size={32} className="text-[var(--pd-color-fg-subtle)]" />
    <div className="text-[14px] text-[var(--pd-color-fg-muted)]">
      No scheduled tasks yet
    </div>
    <div className="text-[12px] text-[var(--pd-color-fg-subtle)]">
      Create one from the button below, or type{' '}
      <code className="font-[family-name:var(--pd-font-mono)]">/schedule</code> inside any session.
    </div>
    <button
      type="button"
      onClick={onNew}
      className={cn(
        'mt-2 h-8 px-3 rounded-[6px] flex items-center gap-1.5',
        'bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent)]',
        'text-[12px] font-[var(--pd-font-medium)]',
      )}
    >
      <Plus size={12} />
      <span>Create task</span>
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// New-task modal — minimal form with cron presets + validation
// ---------------------------------------------------------------------------

interface NewTaskModalProps {
  onClose: () => void;
  onCreate: (input: CreateScheduledTaskInput) => Promise<ScheduledTask | null>;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ onClose, onCreate }) => {
  const validateCron = useScheduleStore((s) => s.validateCron);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [presetIdx, setPresetIdx] = useState(0);
  const [customCron, setCustomCron] = useState('');
  const [cwd, setCwd] = useState('');
  const [nextPreview, setNextPreview] = useState<string | null>(null);
  const [cronValid, setCronValid] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedPreset = CRON_PRESETS[presetIdx] ?? CRON_PRESETS[0]!;
  const activeCron = selectedPreset.cron === '' ? customCron : selectedPreset.cron;

  useEffect(() => {
    let cancelled = false;
    if (!activeCron.trim()) {
      setCronValid(true);
      setNextPreview(null);
      return;
    }
    void validateCron(activeCron).then((res) => {
      if (cancelled) return;
      setCronValid(res.valid);
      setNextPreview(res.valid && res.nextRunAt ? res.nextRunAt : null);
    });
    return () => {
      cancelled = true;
    };
  }, [activeCron, validateCron]);

  const canSubmit =
    name.trim().length > 0 &&
    prompt.trim().length > 0 &&
    activeCron.trim().length > 0 &&
    cronValid &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErr(null);
    try {
      const created = await onCreate({
        name: name.trim(),
        description: description.trim(),
        cron: activeCron.trim(),
        prompt: prompt.trim(),
        cwd: cwd.trim() || undefined,
      });
      if (!created) setErr('Failed to create task');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[520px] rounded-[12px] bg-[var(--pd-color-bg-elevated)] border border-[var(--pd-color-border)] shadow-2xl"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--pd-color-border)]">
          <h2 className="text-[16px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
            New scheduled task
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="h-8 w-8 rounded-[6px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily security scan"
              className="w-full h-9 px-3 rounded-[8px] border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)] text-[13px] text-[var(--pd-color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--pd-color-accent)]"
            />
          </Field>

          <Field label="Description (optional)">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should this task do?"
              className="w-full h-9 px-3 rounded-[8px] border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)] text-[13px] text-[var(--pd-color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--pd-color-accent)]"
            />
          </Field>

          <Field label="Frequency">
            <div className="grid grid-cols-2 gap-2">
              {CRON_PRESETS.map((preset, idx) => (
                <label
                  key={preset.label}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-[8px] border cursor-pointer text-[12px]',
                    presetIdx === idx
                      ? 'border-[var(--pd-color-accent)] bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg)]'
                      : 'border-[var(--pd-color-border)] text-[var(--pd-color-fg-muted)] hover:text-[var(--pd-color-fg)]',
                  )}
                >
                  <input
                    type="radio"
                    name="freq"
                    checked={presetIdx === idx}
                    onChange={() => setPresetIdx(idx)}
                    className="sr-only"
                  />
                  {preset.label}
                </label>
              ))}
            </div>
            {selectedPreset.cron === '' && (
              <input
                type="text"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="*/30 * * * *"
                className={cn(
                  'mt-2 w-full h-9 px-3 rounded-[8px] border bg-[var(--pd-color-bg)] text-[13px] text-[var(--pd-color-fg)] focus:outline-none focus:ring-2',
                  cronValid
                    ? 'border-[var(--pd-color-border)] focus:ring-[var(--pd-color-accent)]'
                    : 'border-[var(--pd-color-error,#BA1A1A)] focus:ring-[var(--pd-color-error,#BA1A1A)]',
                )}
              />
            )}
            <div className="mt-1 text-[11px] text-[var(--pd-color-fg-subtle)]">
              {activeCron && cronValid && nextPreview
                ? `Next run: ${formatRelative(nextPreview)}`
                : activeCron && !cronValid
                  ? 'Invalid cron expression'
                  : 'Pick a preset or write a 5-field cron.'}
            </div>
          </Field>

          <Field label="Prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="What should Panda do when this fires?"
              className="w-full px-3 py-2 rounded-[8px] border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)] text-[13px] text-[var(--pd-color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--pd-color-accent)] resize-y"
            />
          </Field>

          <Field label="Working directory (optional)">
            <input
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="/absolute/path (defaults to app cwd)"
              className="w-full h-9 px-3 rounded-[8px] border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)] text-[13px] text-[var(--pd-color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--pd-color-accent)] font-[family-name:var(--pd-font-mono)]"
            />
          </Field>

          {err && (
            <div className="text-[12px] text-[var(--pd-color-error,#BA1A1A)]">{err}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--pd-color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-[8px] text-[13px] text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className={cn(
              'h-9 px-4 rounded-[8px] text-[13px] font-[var(--pd-font-medium)] flex items-center gap-1.5',
              canSubmit
                ? 'bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent)] hover:bg-[var(--pd-color-accent-hover)]'
                : 'bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg-subtle)] cursor-not-allowed',
            )}
          >
            {submitting ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[11px] font-[var(--pd-font-semibold)] uppercase tracking-wide text-[var(--pd-color-fg-muted)]">
      {label}
    </span>
    {children}
  </div>
);
