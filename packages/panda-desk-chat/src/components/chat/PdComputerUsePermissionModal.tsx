// Input:  sessionId + ComputerUsePermissionRequest（或 null）
// Output: PdModal 表单 — 应用授权列表 / TCC（Accessibility/Screen Recording）开关
// Pos:    Chat layer — Computer Use 工具被调用时弹出的系统级授权确认
//
// Source 1:1: cc-haha desktop/src/components/chat/ComputerUsePermissionModal.tsx (L1-L312)
//   - className 转换：var(--color-*) → var(--pd-color-*)
//   - cc-haha shared/Modal → panda shared/PdModal
//   - cc-haha shared/Button → panda shared/PdButton
//   - cc-haha computerUseApi.openSettings → panda 暂无 IPC，按钮点击仅打日志（待 Computer Use IPC 上线后接通）
//   - cc-haha chatStore.respondToComputerUsePermission → panda 暂无该 action，调用降级为 console.warn
import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { PdButton } from '../shared/PdButton';
import { PdModal } from '../shared/PdModal';

// cc-haha types/chat 内类型在 panda 不存在；本地内联定义保持等价形态。
type AppDescriptor = {
  resolved?: {
    bundleId: string;
    displayName: string;
  };
  requestedName: string;
  alreadyGranted?: boolean;
  isSentinel?: boolean;
  proposedTier: 'read' | 'write' | 'exec';
};

type TccState = {
  accessibility: boolean;
  screenRecording: boolean;
};

type ComputerUsePermissionRequest = {
  requestId: string;
  apps: AppDescriptor[];
  requestedFlags: Record<string, boolean>;
  reason?: string;
  willHide?: string[];
  autoUnhideEnabled?: boolean;
  tccState?: TccState | null;
};

type Props = {
  sessionId: string;
  request: ComputerUsePermissionRequest | null;
};

const DEFAULT_GRANT_FLAGS = {
  clipboardRead: false,
  clipboardWrite: false,
  systemKeyCombos: false,
} as const;

export function PdComputerUsePermissionModal({ sessionId, request }: Props) {
  const [openingPane, setOpeningPane] = useState<
    'Privacy_Accessibility' | 'Privacy_ScreenCapture' | null
  >(null);

  const requestedFlags = useMemo(
    () =>
      request
        ? Object.entries(request.requestedFlags)
            .filter(([, enabled]) => enabled)
            .map(([flag]) => flag)
        : [],
    [request],
  );

  if (!request) return null;

  const handleDeny = () => {
    // panda chatStore 暂无 respondToComputerUsePermission；降级日志（待 IPC 上线后接通）。
    // eslint-disable-next-line no-console
    console.warn('[PdComputerUsePermissionModal] deny request', { sessionId, requestId: request.requestId });
  };

  const handleAllow = () => {
    const now = Date.now();
    const granted = request.apps.flatMap((app) => {
      if (!app.resolved || app.alreadyGranted) return [];
      return [{
        bundleId: app.resolved.bundleId,
        displayName: app.resolved.displayName,
        grantedAt: now,
        tier: app.proposedTier,
      }];
    });
    const denied = request.apps.flatMap((app) => {
      if (app.resolved) return [];
      return [{
        bundleId: app.requestedName,
        reason: 'not_installed' as const,
      }];
    });
    const flags = {
      ...DEFAULT_GRANT_FLAGS,
      ...Object.fromEntries(
        Object.entries(request.requestedFlags).filter(([, value]) => value === true),
      ),
    };
    // eslint-disable-next-line no-console
    console.warn('[PdComputerUsePermissionModal] allow request', {
      sessionId,
      requestId: request.requestId,
      response: { granted, denied, flags, userConsented: true },
    });
  };

  const openSettings = async (
    pane: 'Privacy_Accessibility' | 'Privacy_ScreenCapture',
  ) => {
    setOpeningPane(pane);
    // eslint-disable-next-line no-console
    console.warn('[PdComputerUsePermissionModal] openSettings (no IPC):', pane);
    setOpeningPane(null);
  };

  const tccState = request.tccState;

  return (
    <PdModal
      open
      onClose={handleDeny}
      title={
        tccState
          ? t('computerUseApproval.titleTcc')
          : t('computerUseApproval.titleApps')
      }
      width={640}
      footer={
        tccState ? (
          <PdButton variant="ghost" onClick={handleDeny}>
            {t('computerUseApproval.deny')}
          </PdButton>
        ) : (
          <>
            <PdButton variant="ghost" onClick={handleDeny}>
              {t('computerUseApproval.deny')}
            </PdButton>
            <PdButton variant="primary" onClick={handleAllow}>
              {t('computerUseApproval.allow')}
            </PdButton>
          </>
        )
      }
    >
      {tccState ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--pd-color-text-secondary)]">
            {t('computerUseApproval.tccHint')}
          </p>

          <div className="space-y-3">
            <PermissionRow
              label={t('computerUseApproval.accessibility')}
              granted={tccState.accessibility}
              actionLabel={t('computerUseApproval.openAccessibility')}
              actionLoading={openingPane === 'Privacy_Accessibility'}
              onAction={() => openSettings('Privacy_Accessibility')}
            />
            <PermissionRow
              label={t('computerUseApproval.screenRecording')}
              granted={tccState.screenRecording}
              actionLabel={t('computerUseApproval.openScreenRecording')}
              actionLoading={openingPane === 'Privacy_ScreenCapture'}
              onAction={() => openSettings('Privacy_ScreenCapture')}
            />
          </div>

          <div className="rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-3 text-xs text-[var(--pd-color-text-tertiary)]">
            {t('computerUseApproval.tryAgainHint')}
          </div>

          <div className="flex justify-end">
            <PdButton variant="secondary" onClick={handleDeny}>
              {t('computerUseApproval.tryAgain')}
            </PdButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {request.reason ? (
            <div className="rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--pd-color-text-tertiary)]">
                {t('computerUseApproval.reason')}
              </div>
              <div className="mt-1 text-sm text-[var(--pd-color-text-primary)]">
                {request.reason}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            {request.apps.map((app) => {
              const resolved = app.resolved;
              return (
                <div
                  key={resolved?.bundleId ?? app.requestedName}
                  className="rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                        {resolved?.displayName ?? app.requestedName}
                      </div>
                      <div className="mt-1 text-xs text-[var(--pd-color-text-tertiary)]">
                        {resolved?.bundleId ?? t('computerUseApproval.notInstalled')}
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--pd-color-surface-container)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--pd-color-text-secondary)]">
                      {app.proposedTier}
                    </span>
                  </div>

                  {!resolved ? (
                    <p className="mt-2 text-xs text-[var(--pd-color-error)]">
                      {t('computerUseApproval.notInstalled')}
                    </p>
                  ) : null}

                  {app.alreadyGranted ? (
                    <p className="mt-2 text-xs text-[var(--pd-color-success)]">
                      {t('computerUseApproval.alreadyGranted')}
                    </p>
                  ) : null}

                  {app.isSentinel ? (
                    <p className="mt-2 text-xs text-[var(--pd-color-warning)]">
                      {t('computerUseApproval.sensitiveApp')}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {requestedFlags.length > 0 ? (
            <div className="rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--pd-color-text-tertiary)]">
                {t('computerUseApproval.alsoRequested')}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {requestedFlags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-full bg-[var(--pd-color-surface-container)] px-2 py-1 text-[11px] text-[var(--pd-color-text-secondary)]"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {request.willHide && request.willHide.length > 0 ? (
            <div className="rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-3 text-sm text-[var(--pd-color-text-secondary)]">
              {request.autoUnhideEnabled
                ? t('computerUseApproval.hideWhileWorkingRestore', {
                    count: request.willHide.length,
                  })
                : t('computerUseApproval.hideWhileWorking', {
                    count: request.willHide.length,
                  })}
            </div>
          ) : null}
        </div>
      )}
    </PdModal>
  );
}

function PermissionRow({
  label,
  granted,
  actionLabel,
  actionLoading,
  onAction,
}: {
  label: string;
  granted: boolean;
  actionLabel: string;
  actionLoading: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-3">
      <div>
        <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
          {label}
        </div>
        <div className="mt-1 text-xs text-[var(--pd-color-text-tertiary)]">
          {granted
            ? t('computerUseApproval.granted')
            : t('computerUseApproval.notGranted')}
        </div>
      </div>

      {!granted ? (
        <PdButton
          variant="secondary"
          size="sm"
          loading={actionLoading}
          onClick={onAction}
        >
          {actionLabel}
        </PdButton>
      ) : null}
    </div>
  );
}
