// Input: pandaAPI.update.onStatus events (Electron auto-updater)
// Output: top-right popup with version / progress / error / install actions
// Pos: Shared layer — global update prompt UI mounted at App root
//
// Source 1:1: cc-haha desktop/src/components/shared/UpdateChecker.tsx (L1-L106)
//   - cc-haha useUpdateStore (Zustand) → panda 暂无 updateStore；本组件内部
//     用 useState 维护等价状态，bridge.onUpdateStatus 推送事件即可；
//   - cc-haha isTauriRuntime → panda isElectronRuntime（pandaAPI/electronAPI 探测）；
//   - cc-haha MarkdownRenderer → panda PdMarkdownRenderer（同义）；
//   - cc-haha formatBytes → panda inline 简实现；
//   - install/dismiss 走 panda bridge.installUpdate；fetch 由主进程触发，无需 UI 调用。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { PdMarkdownRenderer } from '../chat/PdMarkdownRenderer';
import { onUpdateStatus, installUpdate as installUpdateBridge } from '../../ipc/bridge';
import type { UpdateStatus } from '../../ipc/types';

function isElectronRuntime() {
  return typeof window !== 'undefined' && ('electronAPI' in window || 'pandaAPI' in window);
}

function formatBytes(bytes?: number): string {
  if (typeof bytes !== 'number' || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

type UpdateUIStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'restarting' | 'error';

export function PdUpdateChecker() {
  const [status, setStatus] = useState<UpdateUIStatus>('idle');
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [shouldPrompt, setShouldPrompt] = useState(true);

  useEffect(() => {
    if (!isElectronRuntime()) return;
    const unsub = onUpdateStatus((s: UpdateStatus) => {
      // panda UpdateStatus 字段：status/version/releaseNotes/percent/message
      // cc-haha UI 期望：status/availableVersion/releaseNotes/progressPercent/downloadedBytes/totalBytes/error
      // 适配：percent → progressPercent；message → error/statusText；downloaded/total 缺则按 known=false 渲染。
      const next = s.status === 'up-to-date'
        ? 'idle'
        : s.status === 'downloaded'
          ? 'restarting'
          : (s.status as UpdateUIStatus);
      setStatus(next);
      if (s.version) setAvailableVersion(s.version);
      if (s.releaseNotes !== undefined && s.releaseNotes !== null) {
        setReleaseNotes(typeof s.releaseNotes === 'string' ? s.releaseNotes : null);
      }
      if (typeof s.percent === 'number') setProgressPercent(s.percent);
      // panda 暂不提供字节级 progress 详情
      setDownloadedBytes(0);
      setTotalBytes(undefined);
      setError(s.status === 'error' ? s.message ?? null : null);
    });
    return () => unsub();
  }, []);

  const dismissPrompt = () => setShouldPrompt(false);
  const installUpdate = () => { void installUpdateBridge(); };

  if (!isElectronRuntime()) return null;

  const showPopup =
    shouldPrompt && !!availableVersion && (['available', 'downloading', 'restarting'] as UpdateUIStatus[]).includes(status);

  if (!showPopup) return null;

  const hasKnownProgress = typeof totalBytes === 'number' && totalBytes > 0;
  const downloadedText = formatBytes(downloadedBytes);
  const statusText =
    status === 'restarting'
      ? t('update.restarting')
      : status === 'downloading'
        ? hasKnownProgress
          ? t('update.downloading')
          : t('update.progressBytes', { downloaded: downloadedText })
        : null;

  return (
    <div className="fixed top-4 right-4 z-[200] max-w-sm">
      <div className="bg-[var(--pd-color-surface-container-low)] border border-[var(--pd-color-border)] rounded-[var(--pd-radius-lg)] shadow-[var(--pd-shadow-dropdown)] p-4">
        <p className="text-sm font-medium text-[var(--pd-color-text-primary)]">
          {t('update.available', { version: availableVersion ?? '' })}
        </p>

        {releaseNotes && (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)]/70 px-3 py-2">
            <PdMarkdownRenderer
              content={releaseNotes}
              className="text-xs leading-5 text-[var(--pd-color-text-secondary)] [&_h1]:mb-2 [&_h1]:text-sm [&_h1]:font-semibold [&_h2]:mb-1.5 [&_h2]:text-xs [&_h2]:font-semibold [&_p]:my-1.5 [&_p]:text-xs [&_p]:leading-5 [&_ul]:my-1.5 [&_ol]:my-1.5"
            />
          </div>
        )}

        {(status === 'downloading' || status === 'restarting') && (
          <div className="mt-3">
            <div className="h-1.5 bg-[var(--pd-color-surface)] rounded-full overflow-hidden">
              {hasKnownProgress || status === 'restarting' ? (
                <div
                  className="h-full bg-[var(--pd-color-text-accent)] transition-all duration-300"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              ) : (
                <div className="h-full w-1/3 rounded-full bg-[var(--pd-color-text-accent)]/75 animate-pulse" />
              )}
            </div>
            {statusText && (
              <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-1">
                {statusText}
                {status === 'downloading' && hasKnownProgress ? ` ${progressPercent}%` : ''}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-[var(--pd-color-error)]">
            {t('update.failed', { error })}
          </p>
        )}

        {status === 'available' && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => installUpdate()}
              className="px-3 py-1 text-xs font-medium rounded-[var(--pd-radius-md)] bg-[var(--pd-color-text-accent)] text-white hover:opacity-90 transition-opacity"
            >
              {t('update.now')}
            </button>
            <button
              onClick={dismissPrompt}
              className="px-3 py-1 text-xs text-[var(--pd-color-text-tertiary)] hover:text-[var(--pd-color-text-primary)] transition-colors"
            >
              {t('update.later')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
