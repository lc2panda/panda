// Input: 路由 — 已下线（PdContentRouter 不再 lazy import）；Composer 底部按钮组承载 fork/branch/resume/stop。
// Output: 会话控制面板 — Permission / Model / Effort 切换 + Fork / Branch / Resume / Stop 动作
// Pos: Page layer — 已嵌入 Composer 底部按钮组，本文件保留作为完整面板备用（下一轮可挂载到 Settings）。
//
// Comdr 指令 cc-haha 路线 A 调整：本页面已不在路由中使用，保留代码用于：
//   1. 下一轮可移到 Settings sub-tab（与 PdToolInspection 同模式）；
//   2. 模型选择已用 useSettingsStore.availableModels 真实数据，不杜撰 mock；
//   3. 删除会破坏既有持久化模型/effort/permission 状态切换逻辑。
//
// Comdr 指令 cc-haha 路线 A — PdSessionControls 真实数据接入：
//   useSettingsStore.permissionMode/currentModel/availableModels/effortLevel  → 真实可用字段
//   useSettingsStore.setPermissionMode / setModel / setEffort                 → 写回 panda IPC
//   useSessionStore.activeSessionId + sessions[]                              → 当前活会话
//   useChatStore.stopGeneration(sessionId)                                    → Stop 动作
//   bridge.dispatchSessionControl(sessionId, fork|branch|resume)              → /fork|/branch|/resume slash 注入
//
// 不含杜撰：mockPermissionModes / mockModels / mockEffortLevels / mockSessions / mockStatusBar
//          通通不引用。所有数据来自 panda 真实 store + IPC。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useState } from 'react';
import { t } from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { useSessionStore } from '../stores/sessionStore';
import { useChatStore } from '../stores/chatStore';
import { useToastStore } from '../stores/toastStore';
import { dispatchSessionControl } from '../ipc/bridge';
import { PdButton } from '../components/shared/PdButton';
import type { PermissionMode, EffortLevel } from '../types/settings';
import type { SessionControlAction } from '../ipc/types';

// ─── Static metadata（i18n key → label）────────────────────────────────────

interface PermissionModeMeta {
  id: PermissionMode;
  icon: string;
  labelKey: string;
  iconColor: string;
}

const PERMISSION_MODES: PermissionModeMeta[] = [
  {
    id: 'default',
    icon: 'verified_user',
    labelKey: 'sessionControls.permissionMode.default',
    iconColor: 'text-[var(--pd-color-text-tertiary)]',
  },
  {
    id: 'acceptEdits',
    icon: 'edit_check',
    labelKey: 'sessionControls.permissionMode.acceptEdits',
    iconColor: 'text-[var(--pd-color-text-tertiary)]',
  },
  {
    id: 'plan',
    icon: 'architecture',
    labelKey: 'sessionControls.permissionMode.plan',
    iconColor: 'text-[var(--pd-color-brand)]',
  },
  {
    id: 'auto',
    icon: 'bolt',
    labelKey: 'sessionControls.permissionMode.auto',
    iconColor: 'text-[var(--pd-color-text-tertiary)]',
  },
  {
    id: 'bypassPermissions',
    icon: 'gavel',
    labelKey: 'sessionControls.permissionMode.bypassPermissions',
    iconColor: 'text-[var(--pd-color-error)]',
  },
];

interface EffortLevelMeta {
  id: EffortLevel;
  labelKey: string;
}

const EFFORT_LEVELS: EffortLevelMeta[] = [
  { id: 'low', labelKey: 'sessionControls.effort.low' },
  { id: 'medium', labelKey: 'sessionControls.effort.medium' },
  { id: 'high', labelKey: 'sessionControls.effort.high' },
];

// 动作元信息（i18n + slash 命令 + variant）
const ACTIONS: Array<{
  id: SessionControlAction | 'stop';
  icon: string;
  variant: 'primary' | 'secondary' | 'danger';
  labelKey: string;
  descKey: string;
}> = [
  {
    id: 'fork',
    icon: 'call_split',
    variant: 'secondary',
    labelKey: 'sessionControls.action.fork',
    descKey: 'sessionControls.action.forkDesc',
  },
  {
    id: 'branch',
    icon: 'fork_right',
    variant: 'secondary',
    labelKey: 'sessionControls.action.branch',
    descKey: 'sessionControls.action.branchDesc',
  },
  {
    id: 'resume',
    icon: 'history',
    variant: 'secondary',
    labelKey: 'sessionControls.action.resume',
    descKey: 'sessionControls.action.resumeDesc',
  },
  {
    id: 'stop',
    icon: 'stop_circle',
    variant: 'danger',
    labelKey: 'sessionControls.action.stop',
    descKey: 'sessionControls.action.stopDesc',
  },
];

export function PdSessionControls() {
  const permissionMode = useSettingsStore((s) => s.permissionMode);
  const setPermissionMode = useSettingsStore((s) => s.setPermissionMode);
  const currentModel = useSettingsStore((s) => s.currentModel);
  const availableModels = useSettingsStore((s) => s.availableModels);
  const setModel = useSettingsStore((s) => s.setModel);
  const effortLevel = useSettingsStore((s) => s.effortLevel);
  const setEffort = useSettingsStore((s) => s.setEffort);

  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const stopGeneration = useChatStore((s) => s.stopGeneration);
  const addToast = useToastStore((s) => s.addToast);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  const [pendingAction, setPendingAction] = useState<SessionControlAction | 'stop' | null>(null);

  const handlePermissionChange = async (mode: PermissionMode) => {
    try {
      await setPermissionMode(mode);
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleModelChange = async (modelId: string) => {
    try {
      await setModel(modelId);
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleEffortChange = async (level: EffortLevel) => {
    try {
      await setEffort(level);
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleAction = async (action: SessionControlAction | 'stop') => {
    if (!activeSessionId) return;
    setPendingAction(action);
    try {
      if (action === 'stop') {
        stopGeneration(activeSessionId);
        addToast({ type: 'info', message: 'Stop' });
      } else {
        const result = await dispatchSessionControl(activeSessionId, action);
        if (result.ok) {
          addToast({
            type: 'success',
            message: t('sessionControls.dispatchOk').replace('{cmd}', result.command),
          });
        } else {
          addToast({
            type: 'error',
            message: t('sessionControls.dispatchError').replace('{err}', result.error ?? ''),
          });
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)]">
                <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-[var(--pd-color-brand)]">
                  tune
                </span>
              </div>
              <h1
                className="text-2xl font-bold tracking-tight text-[var(--pd-color-text-primary)]"
                style={{ fontFamily: 'var(--pd-font-headline)' }}
              >
                {t('sessionControls.title')}
              </h1>
            </div>
            <p className="text-sm text-[var(--pd-color-text-secondary)]">
              {t('sessionControls.description')}
            </p>
          </header>

          {!activeSession && (
            <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[32px] text-[var(--pd-color-text-tertiary)] mb-2 block">
                bedtime
              </span>
              <p className="text-sm text-[var(--pd-color-text-tertiary)]">
                {t('sessionControls.noSession')}
              </p>
            </div>
          )}

          {activeSession && (
            <div className="space-y-4">
              {/* 活会话信息卡 */}
              <section className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] p-4 shadow-sm">
                <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-3">
                  {t('sessionControls.activeSession')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <SessionStat
                    icon="folder"
                    label={t('sessionControls.cwd')}
                    value={activeSession.cwd || '-'}
                    mono
                  />
                  <SessionStat
                    icon="forum"
                    label={t('sessionControls.messageCount')}
                    value={String(activeSession.messageCount)}
                  />
                  <SessionStat
                    icon="schedule"
                    label={t('sessionControls.lastActive')}
                    value={
                      activeSession.lastActive
                        ? new Date(activeSession.lastActive).toLocaleString()
                        : '-'
                    }
                  />
                </div>
                <div className="mt-3 text-[10px] font-mono text-[var(--pd-color-text-tertiary)] truncate">
                  id: {activeSession.id}
                </div>
              </section>

              {/* Permission Mode */}
              <section className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-4 shadow-sm">
                <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-3">
                  {t('sessionControls.permissionMode')}
                </div>
                <div className="space-y-1">
                  {PERMISSION_MODES.map((mode) => {
                    const isSelected = permissionMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => void handlePermissionChange(mode.id)}
                        className={`w-full text-left rounded-xl border px-3 py-2 transition-colors flex items-center gap-3 ${
                          isSelected
                            ? 'border-[var(--pd-color-brand)]/50 bg-[var(--pd-color-brand)]/5'
                            : 'border-[var(--pd-color-border)]/60 hover:bg-[var(--pd-color-surface-hover)]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`material-symbols-outlined text-[18px] ${mode.iconColor}`}
                        >
                          {mode.icon}
                        </span>
                        <span className="flex-1 text-sm font-medium text-[var(--pd-color-text-primary)]">
                          {t(mode.labelKey)}
                        </span>
                        {isSelected && (
                          <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-brand)]">
                            check_circle
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Model + Effort */}
              <section className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-4 shadow-sm">
                <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-3">
                  {t('sessionControls.model')}
                </div>
                {availableModels.length === 0 ? (
                  <div className="text-xs text-[var(--pd-color-text-tertiary)]">
                    {t('sessionControls.modelLoading')}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableModels.map((m) => {
                      const isActive = currentModel?.id === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => void handleModelChange(m.id)}
                          className={`w-full text-left rounded-xl border px-3 py-2 transition-colors flex items-center gap-3 ${
                            isActive
                              ? 'border-[var(--pd-color-brand)]/50 bg-[var(--pd-color-brand)]/5'
                              : 'border-[var(--pd-color-border)]/60 hover:bg-[var(--pd-color-surface-hover)]'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-tertiary)]"
                          >
                            smart_toy
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[var(--pd-color-text-primary)] truncate">
                              {m.name}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--pd-color-text-tertiary)] truncate">
                              {m.id}
                            </div>
                          </div>
                          {isActive && (
                            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-brand)]">
                              radio_button_checked
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-2">
                  {t('sessionControls.effortLevel')}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {EFFORT_LEVELS.map((e) => {
                    const isActive = effortLevel === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => void handleEffortChange(e.id)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? 'border-[var(--pd-color-brand)]/60 bg-[var(--pd-color-brand)]/10 text-[var(--pd-color-brand)]'
                            : 'border-[var(--pd-color-border)]/60 text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
                        }`}
                      >
                        {t(e.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Actions */}
              <section className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-4 shadow-sm">
                <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-3">
                  {t('sessionControls.actions')}
                </div>
                <div className="space-y-2">
                  {ACTIONS.map((a) => {
                    const isPending = pendingAction === a.id;
                    return (
                      <div
                        key={a.id}
                        className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] p-3 flex items-start gap-3"
                      >
                        <span aria-hidden="true" className={`material-symbols-outlined text-[20px] mt-0.5 ${a.variant === 'danger' ? 'text-[var(--pd-color-error)]' : 'text-[var(--pd-color-text-secondary)]'}`}>
                          {a.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">
                            {t(a.labelKey)}
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--pd-color-text-tertiary)] leading-relaxed">
                            {t(a.descKey)}
                          </p>
                        </div>
                        <PdButton
                          variant={a.variant}
                          size="sm"
                          disabled={isPending}
                          onClick={() => void handleAction(a.id)}
                        >
                          {isPending
                            ? t('sessionControls.action.running')
                            : t('sessionControls.action.run')}
                        </PdButton>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionStat({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-3">
      <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-tertiary)] flex-shrink-0">
          {icon}
        </span>
        <span className={`text-xs ${mono ? 'font-mono' : ''} text-[var(--pd-color-text-primary)] truncate`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default PdSessionControls;
