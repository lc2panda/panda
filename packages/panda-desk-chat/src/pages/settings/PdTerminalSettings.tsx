// Input: terminalApi (panda stub) — isAvailable() === false 走 unavailable 分支
// Output: terminal status pill + 系统终端按钮 + xterm host (panda 暂无 PTY → planned card + openSystemTerminal G5)
// Pos: Settings tab — fifth entry (icon: terminal)
//
// Bug F G2+G5: 文案改为"规划中" + 新增"打开系统终端"按钮 (openSystemTerminal IPC)
//   完整 PTY 集成 (G3) 留 v2.28+ 独立大版本立项。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useState } from 'react';
import { t } from '../../i18n';
import { terminalApi } from '../../api/terminal';
import { openSystemTerminal } from '../../ipc/bridge';

type TerminalStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'exited'
  | 'error'
  | 'unavailable';

const STATUS_LABEL_KEYS: Record<TerminalStatus, string> = {
  idle: 'settings.terminal.status.idle',
  starting: 'settings.terminal.status.starting',
  running: 'settings.terminal.status.running',
  exited: 'settings.terminal.status.exited',
  error: 'settings.terminal.status.error',
  unavailable: 'settings.terminal.status.unavailable',
};

export function PdTerminalSettings() {
  const [status] = useState<TerminalStatus>(() =>
    terminalApi.isAvailable() ? 'idle' : 'unavailable',
  );
  const [error] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-[620px] flex-col overflow-hidden">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)]">
            {t('settings.terminal.title')}
          </h2>
          <p className="mt-0.5 max-w-2xl text-sm text-[var(--pd-color-text-tertiary)]">
            {t('settings.terminal.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { void openSystemTerminal(); }}
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-text-primary)] px-2.5 text-xs font-medium text-[var(--pd-color-surface)] transition-colors hover:opacity-90"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">open_in_new</span>
            {t('settings.terminal.openSystemTerminal')}
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--pd-color-text-tertiary)]">
        <StatusPill status={status} label={t(STATUS_LABEL_KEYS[status])} />
      </div>

      {error && (
        <div className="mb-3 rounded-[var(--pd-radius-md)] border border-[var(--pd-color-error)]/20 bg-[var(--pd-color-error)]/10 px-3 py-2 text-sm text-[var(--pd-color-error)]">
          {error}
        </div>
      )}

      {status === 'unavailable' ? (
        <div className="flex flex-1 items-center justify-center rounded-[var(--pd-radius-lg)] border border-dashed border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-8 text-center">
          <div>
            <span aria-hidden="true" className="material-symbols-outlined mb-3 block text-[32px] text-[var(--pd-color-text-tertiary)]">
              desktop_windows
            </span>
            <p className="text-sm font-medium text-[var(--pd-color-text-primary)]">
              {t('settings.terminal.unavailableTitle')}
            </p>
            <p className="mt-1 text-sm text-[var(--pd-color-text-tertiary)]">
              {t('settings.terminal.unavailableBody')}
            </p>
            <button
              type="button"
              onClick={() => { void openSystemTerminal(); }}
              className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-text-primary)] px-3 text-xs font-medium text-[var(--pd-color-surface)] transition-colors hover:opacity-90"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">open_in_new</span>
              {t('settings.terminal.openSystemTerminal')}
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-terminal-border)] bg-[var(--pd-color-terminal-bg)] shadow-[var(--pd-shadow-dropdown)]">
          <div className="flex h-8 items-center gap-2 border-b border-[var(--pd-color-terminal-border)] bg-[var(--pd-color-terminal-header)] px-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--pd-color-terminal-danger)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--pd-color-terminal-warning)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--pd-color-terminal-accent)]" />
            <span className="ml-2 truncate font-mono text-[11px] text-[var(--pd-color-terminal-muted)]">
              {t('settings.terminal.windowTitle')}
            </span>
          </div>
          <div
            data-testid="settings-terminal-host"
            className="settings-terminal-host h-[calc(100%-2rem)] w-full overflow-hidden p-2"
          />
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, label }: { status: TerminalStatus; label: string }) {
  const color =
    status === 'running'
      ? 'bg-[var(--pd-color-success)]'
      : status === 'error'
        ? 'bg-[var(--pd-color-error)]'
        : status === 'starting'
          ? 'bg-[var(--pd-color-warning)]'
          : 'bg-[var(--pd-color-text-tertiary)]';

  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-2.5 text-[11px] font-medium text-[var(--pd-color-text-secondary)]">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
