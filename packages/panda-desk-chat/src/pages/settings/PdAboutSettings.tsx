// Input: updateStore (status/availableVersion/progress/installUpdate/checkForUpdates)
// Output: Logo · version · GitHub (repo/releases/issues) · update card (error fallback → Releases) · author/social links
// Pos: Settings tab — eleventh entry (icon: info, prefixed with border-t separator)
//
// Source 1:1: cc-haha desktop/src/pages/Settings.tsx L1384-L1619 (AboutSettings)
//   panda 自有品牌：app icon + GitHub repo 替换；其他 cc-haha 链接保留作者署名以遵守开源致谢。
//   panda updateStore 已有；这里直接消费。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { PdButton } from '../../components/shared/PdButton';
import { useUpdateStore } from '../../stores/updateStore';
import { formatBytes } from '../../lib/formatBytes';

const PANDA_GITHUB_REPO = 'https://github.com/lc2panda/panda';
const PANDA_RELEASES = 'https://github.com/lc2panda/panda/releases';
const PANDA_ISSUES = 'https://github.com/lc2panda/panda/issues';
const PANDA_AUTHOR = 'PandaAI';
const PANDA_AUTHOR_GITHUB = 'https://github.com/lc2panda';
const PANDA_WECHAT_OFFICIAL = 'PandaAI';

export function PdAboutSettings() {
  const status = useUpdateStore((s) => s.status);
  const availableVersion = useUpdateStore((s) => s.availableVersion);
  const releaseNotes = useUpdateStore((s) => s.releaseNotes);
  const progressPercent = useUpdateStore((s) => s.progressPercent);
  const downloadedBytes = useUpdateStore((s) => s.downloadedBytes);
  const totalBytes = useUpdateStore((s) => s.totalBytes);
  const error = useUpdateStore((s) => s.error);
  const checkedAt = useUpdateStore((s) => s.checkedAt);
  const checkForUpdates = useUpdateStore((s) => s.checkForUpdates);
  const installUpdate = useUpdateStore((s) => s.installUpdate);
  const initialize = useUpdateStore((s) => s.initialize);

  const [version, setVersion] = useState<string>('0.1.0');

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    // panda 直接读 package.json 静态版本（webpack/vite 注入）；缺则走默认。
    try {
      const w = window as unknown as { __PANDA_VERSION__?: string };
      if (typeof w.__PANDA_VERSION__ === 'string') {
        setVersion(w.__PANDA_VERSION__);
      }
    } catch {
      /* noop */
    }
  }, []);

  const openUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const checkedAtText = checkedAt
    ? new Date(checkedAt).toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const hasKnownProgress = typeof totalBytes === 'number' && totalBytes > 0;
  const downloadedText = formatBytes(downloadedBytes);

  const updateDescription =
    status === 'checking'
      ? t('update.checking')
      : status === 'downloading'
        ? hasKnownProgress
          ? t('update.progress', { progress: String(progressPercent) })
          : t('update.progressBytes', { downloaded: downloadedText })
        : status === 'restarting'
          ? t('update.restarting')
          : status === 'available' && availableVersion
            ? t('update.newVersion', { version: availableVersion })
            : status === 'up-to-date'
              ? t('update.upToDate', {
                  version: version || t('update.currentVersionUnknown'),
                })
              : error
                ? t('update.failed', { error })
                : t('update.idle');

  return (
    <div className="w-full min-w-0 max-w-lg mx-auto flex flex-col items-center py-6">
      {/* Logo + App Name + Version */}
      <img src="/app-icon.png" alt="Panda" className="w-20 h-20 mb-4 rounded-2xl" />
      <h1 className="text-xl font-bold text-[var(--pd-color-text-primary)]">Panda</h1>
      {version && (
        <span className="text-xs text-[var(--pd-color-text-tertiary)] mt-1">
          {t('settings.about.version')} {version}
        </span>
      )}

      {/* GitHub Repo */}
      <div className="mt-6 w-full">
        <button
          onClick={() => openUrl(PANDA_GITHUB_REPO)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--pd-color-border)] hover:bg-[var(--pd-color-surface-hover)] transition-colors cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] opacity-70">
            code
          </span>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">
              lc2panda/panda
            </div>
            <div className="text-xs text-[var(--pd-color-text-tertiary)]">
              {t('settings.about.starHint')}
            </div>
          </div>
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-tertiary)]">
            open_in_new
          </span>
        </button>

        {/* Releases link */}
        <button
          onClick={() => openUrl(PANDA_RELEASES)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--pd-color-border)] hover:bg-[var(--pd-color-surface-hover)] transition-colors cursor-pointer mt-2"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] opacity-70">
            new_releases
          </span>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">
              {t('settings.about.releases')}
            </div>
            <div className="text-xs text-[var(--pd-color-text-tertiary)]">
              github.com/lc2panda/panda/releases
            </div>
          </div>
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-tertiary)]">
            open_in_new
          </span>
        </button>

        {/* Issues / feedback link */}
        <button
          onClick={() => openUrl(PANDA_ISSUES)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--pd-color-border)] hover:bg-[var(--pd-color-surface-hover)] transition-colors cursor-pointer mt-2"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] opacity-70">
            bug_report
          </span>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">
              {t('settings.about.issues')}
            </div>
            <div className="text-xs text-[var(--pd-color-text-tertiary)]">
              github.com/lc2panda/panda/issues
            </div>
          </div>
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-tertiary)]">
            open_in_new
          </span>
        </button>
      </div>

      {/* Update card */}
      <div className="mt-4 w-full rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">
              {t('settings.about.updates')}
            </div>
            <div className="text-xs text-[var(--pd-color-text-tertiary)] mt-1">
              {t('settings.about.updatesDesc')}
            </div>
          </div>
          <PdButton
            size="sm"
            variant="secondary"
            onClick={() => void checkForUpdates()}
            loading={status === 'checking'}
          >
            {t('update.checkNow')}
          </PdButton>
        </div>

        <div className="mt-4 rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--pd-color-text-tertiary)]">
                {t('settings.about.version')}
              </div>
              <div className="text-sm font-medium text-[var(--pd-color-text-primary)] mt-1">
                {version || t('update.currentVersionUnknown')}
              </div>
            </div>

            {availableVersion && (
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.14em] text-[var(--pd-color-text-tertiary)]">
                  {t('update.availableLabel')}
                </div>
                <div className="text-sm font-medium text-[var(--pd-color-text-primary)] mt-1">
                  {availableVersion}
                </div>
              </div>
            )}
          </div>

          <p
            className={`mt-3 text-sm ${
              error
                ? 'text-[var(--pd-color-error)]'
                : 'text-[var(--pd-color-text-secondary)]'
            }`}
          >
            {updateDescription}
          </p>

          {error && (
            <button
              onClick={() => openUrl(PANDA_RELEASES)}
              className="mt-2 text-xs text-[var(--pd-color-accent)] hover:underline cursor-pointer"
            >
              {t('update.viewReleasesManually')}
            </button>
          )}

          {checkedAtText && (
            <p className="mt-1 text-xs text-[var(--pd-color-text-tertiary)]">
              {t('update.checkedAt', { time: checkedAtText })}
            </p>
          )}

          {(status === 'downloading' || status === 'restarting') && (
            <div className="mt-3">
              <div className="h-1.5 bg-[var(--pd-color-surface-container-low)] rounded-full overflow-hidden">
                {hasKnownProgress || status === 'restarting' ? (
                  <div
                    className="h-full bg-[var(--pd-color-text-accent)] transition-all duration-300"
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                ) : (
                  <div className="h-full w-1/3 rounded-full bg-[var(--pd-color-text-accent)]/75 animate-pulse" />
                )}
              </div>
              {!hasKnownProgress && status === 'downloading' && downloadedBytes > 0 && (
                <p className="mt-1 text-xs text-[var(--pd-color-text-tertiary)]">
                  {downloadedText}
                </p>
              )}
            </div>
          )}

          {releaseNotes && availableVersion && (
            <div className="mt-3 rounded-lg bg-[var(--pd-color-surface-container-low)] px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--pd-color-text-tertiary)]">
                {t('update.releaseNotes')}
              </div>
              <div className="mt-2 text-[13px] leading-6 text-[var(--pd-color-text-secondary)] whitespace-pre-wrap">
                {releaseNotes}
              </div>
            </div>
          )}

          {availableVersion && (
            <div className="mt-3 flex justify-end">
              <PdButton
                size="sm"
                onClick={() => void installUpdate()}
                loading={status === 'downloading' || status === 'restarting'}
                disabled={status === 'checking'}
              >
                {status === 'restarting' ? t('update.restarting') : t('update.now')}
              </PdButton>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-[var(--pd-color-border)]/40 my-6" />

      {/* Author */}
      <div className="w-full">
        <h3 className="text-xs font-medium text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-3">
          {t('settings.about.author')}
        </h3>
        <button
          onClick={() => openUrl(PANDA_AUTHOR_GITHUB)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-[var(--pd-color-surface-hover)] transition-colors cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] opacity-60">code</span>
          <span className="text-sm text-[var(--pd-color-text-primary)]">
            {PANDA_AUTHOR}
          </span>
          <span className="text-xs text-[var(--pd-color-text-tertiary)] ml-auto">
            GitHub
          </span>
        </button>
        {/* Comdr 指令: 作者署名增加 微信公众号 PandaAI 联系方式 */}
        <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] opacity-60">forum</span>
          <span className="text-sm text-[var(--pd-color-text-primary)]">
            {t('settings.about.wechatOfficial')}
          </span>
          <span className="text-xs text-[var(--pd-color-text-tertiary)] ml-auto select-text">
            {PANDA_WECHAT_OFFICIAL}
          </span>
        </div>
      </div>
    </div>
  );
}
