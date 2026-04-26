// Input: optional value/onChange (controlled mode) + workDir; fallback uses settingsStore
// Output: pill-trigger + bottom dropdown with 4 permission modes + bypass confirmation portal
// Pos: Controls layer — composer-row permission mode picker
//
// Source 1:1: cc-haha desktop/src/components/controls/PermissionModeSelector.tsx (L1-L229)
//   - cc-haha useTranslation hook → panda t() 函数（同义）
//   - cc-haha chatStore.setSessionPermissionMode → panda chatStore 暂无该 action；
//     仅同步 settingsStore.setPermissionMode（全局），TODO(IPC) 待 chatStore 增加 per-session API；
//   - cc-haha sessionStore activeSessionId → panda sessionStore 同名字段（已对齐）；
//   - cc-haha tabStore activeTabId → panda tabStore 同名字段；
//   - cc-haha DOMPurify → panda 未装：bypass body 用纯文本 + <br/> safe 渲染（无 HTML 注入风险）。

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useTabStore } from '../../stores/tabStore';
import { t } from '../../i18n';
import type { PermissionMode } from '../../types/settings';

const MODE_ICONS: Record<string, string> = {
  default: 'verified_user',
  acceptEdits: 'bolt',
  plan: 'architecture',
  bypassPermissions: 'gavel',
  dontAsk: 'gavel',
  auto: 'bolt',
};

type Props = {
  workDir?: string;
  /** Controlled mode: override current value */
  value?: PermissionMode;
  /** Controlled mode: called on change instead of updating global store */
  onChange?: (mode: PermissionMode) => void;
};

export function PdPermissionModeSelector({ workDir: workDirProp, value, onChange }: Props = {}) {
  const { permissionMode: storeMode, setPermissionMode } = useSettingsStore();
  const activeTabId = useTabStore((s) => s.activeTabId);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const [open, setOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isControlled = value !== undefined;
  const currentMode = isControlled ? value : storeMode;

  const PERMISSION_ITEMS: Array<{
    value: PermissionMode;
    label: string;
    description: string;
    icon: string;
    color?: string;
  }> = [
    {
      value: 'default',
      label: t('permMode.askPermissions'),
      description: t('permMode.askPermDesc'),
      icon: 'verified_user',
    },
    {
      value: 'acceptEdits',
      label: t('permMode.autoAccept'),
      description: t('permMode.autoAcceptDesc'),
      icon: 'bolt',
    },
    {
      value: 'plan',
      label: t('permMode.planMode'),
      description: t('permMode.planModeDesc'),
      icon: 'architecture',
      color: 'text-[var(--pd-color-text-tertiary)]',
    },
    {
      value: 'bypassPermissions',
      label: t('permMode.bypass'),
      description: t('permMode.bypassDesc'),
      icon: 'gavel',
      color: 'text-[var(--pd-color-error)]',
    },
  ];

  const MODE_LABELS: Record<string, string> = {
    default: t('permMode.label.default'),
    acceptEdits: t('permMode.label.acceptEdits'),
    plan: t('permMode.label.plan'),
    bypassPermissions: t('permMode.label.bypassPermissions'),
    dontAsk: t('permMode.label.dontAsk'),
    auto: t('permMode.label.acceptEdits'),
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const workDir = workDirProp || activeSession?.cwd || '~';

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const applyMode = (next: PermissionMode) => {
    if (isControlled) {
      onChange?.(next);
    } else {
      void setPermissionMode(next);
      // TODO(chatStore): 当 chatStore 暴露 setSessionPermissionMode 后，调用 it(activeTabId, next) 同步 per-tab。
      void activeTabId;
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--pd-color-surface-container-low)] hover:bg-[var(--pd-color-surface-hover)] rounded-full text-xs font-medium text-[var(--pd-color-text-secondary)] transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">{MODE_ICONS[currentMode] ?? 'verified_user'}</span>
        <span>{MODE_LABELS[currentMode] ?? currentMode}</span>
        <span className="material-symbols-outlined text-[12px]">expand_more</span>
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-[320px] rounded-xl bg-[var(--pd-color-surface-container-lowest)] border border-[var(--pd-color-border)] shadow-[var(--pd-shadow-dropdown)] z-50 py-2">
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--pd-color-outline)]">
            {t('permMode.executionPermissions')}
          </div>
          {PERMISSION_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                if (item.value === 'bypassPermissions') {
                  setOpen(false);
                  setConfirmDialog(true);
                  return;
                }
                applyMode(item.value);
                setOpen(false);
              }}
              className={`
                w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
                hover:bg-[var(--pd-color-surface-hover)]
                ${item.value === currentMode ? 'bg-[var(--pd-color-surface-selected)]' : ''}
              `}
            >
              <span className={`material-symbols-outlined text-[20px] mt-0.5 ${item.color || 'text-[var(--pd-color-text-secondary)]'}`}>
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">{item.label}</div>
                <div className="text-xs text-[var(--pd-color-text-tertiary)] mt-0.5">{item.description}</div>
              </div>
              {item.value === currentMode && (
                <span className="material-symbols-outlined text-[16px] text-[var(--pd-color-brand)] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Bypass confirmation dialog */}
      {confirmDialog && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 pl-[var(--pd-sidebar-width)]" onClick={() => setConfirmDialog(false)}>
          <div
            className="w-[420px] rounded-2xl bg-[var(--pd-color-surface-container-lowest)] border border-[var(--pd-color-border)] shadow-[var(--pd-shadow-dropdown)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-[var(--pd-color-error)]/8 border-b border-[var(--pd-color-error)]/15">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--pd-color-error)]/12">
                <span className="material-symbols-outlined text-[22px] text-[var(--pd-color-error)]">warning</span>
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--pd-color-text-primary)]">{t('permMode.enableBypassTitle')}</div>
                <div className="text-xs text-[var(--pd-color-text-tertiary)] mt-0.5">{t('permMode.enableBypassSubtitle')}</div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-xs text-[var(--pd-color-text-secondary)] leading-relaxed mb-3">
                {t('permMode.enableBypassBody')}
              </p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--pd-color-surface-container)] border border-[var(--pd-color-border)]" title={workDir}>
                <span className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-tertiary)] shrink-0">folder</span>
                <code className="text-xs font-[var(--pd-font-mono)] text-[var(--pd-color-text-primary)] truncate">{workDir}</code>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-[var(--pd-color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-error)] mt-0.5">check</span>
                  {t('permMode.permReadWrite')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-error)] mt-0.5">check</span>
                  {t('permMode.permShell')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-error)] mt-0.5">check</span>
                  {t('permMode.permPackages')}
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)]">
              <button
                onClick={() => setConfirmDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  applyMode('bypassPermissions');
                  setConfirmDialog(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[var(--pd-color-error)] hover:opacity-90 rounded-lg transition-colors"
              >
                {t('permMode.enableBypassBtn')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
