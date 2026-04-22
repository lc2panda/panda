// Input: useI18n (t), bridge update functions, UpdateStatus IPC events
// Output: About panel — app name, version, auto-update UI with check/download/install
// Pos: settings/AboutTab — fifth tab in SettingsPage
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { PdButton } from '../../components/atoms/PdButton';
import { PdSpinner } from '../../components/atoms/PdSpinner';
import { PdProgressBar } from '../../components/special/PdProgressBar';
import { checkForUpdates, downloadUpdate, installUpdate, onUpdateStatus } from '../../ipc/bridge';
import type { UpdateStatus } from '../../ipc/types';

// ---------------------------------------------------------------------------
// Package version (injected by Vite define or read at build time)
// ---------------------------------------------------------------------------

const APP_VERSION: string =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.2.0';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AboutTab: React.FC = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<UpdateStatus | null>(null);

  // Subscribe to update status events from main process
  useEffect(() => {
    const unsub = onUpdateStatus((s) => setStatus(s));
    return unsub;
  }, []);

  const handleCheck = useCallback(() => {
    setStatus({ status: 'checking' });
    checkForUpdates();
  }, []);

  const handleDownload = useCallback(() => {
    downloadUpdate();
  }, []);

  const handleInstall = useCallback(() => {
    installUpdate();
  }, []);

  return (
    <div style={{ padding: 'var(--pd-space-4)', textAlign: 'center' }}>
      {/* App identity */}
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--pd-text-primary)' }}>
        🐼 Panda Code
      </div>
      <div style={{
        fontSize: '0.875rem',
        color: 'var(--pd-text-secondary)',
        marginTop: 'var(--pd-space-2)',
      }}>
        v{APP_VERSION} • Built with 🎋
      </div>

      {/* Update section */}
      <div style={{ marginTop: 'var(--pd-space-4)' }}>
        {!status && (
          <PdButton variant="secondary" size="sm" onClick={handleCheck}>
            {t('settings.about.checkUpdate')}
          </PdButton>
        )}

        {status?.status === 'checking' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--pd-space-2)',
            color: 'var(--pd-text-secondary)',
          }}>
            <PdSpinner variant="ring" size="sm" />
            <span>{t('settings.about.checkUpdate')}...</span>
          </div>
        )}

        {status?.status === 'up-to-date' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pd-space-2)' }}>
            <span style={{ color: 'var(--pd-text-success, var(--pd-text-secondary))' }}>
              ✓ {t('settings.about.upToDate')}
            </span>
            <PdButton variant="ghost" size="xs" onClick={handleCheck}>
              {t('settings.about.checkUpdate')}
            </PdButton>
          </div>
        )}

        {status?.status === 'available' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pd-space-2)' }}>
            <span style={{ color: 'var(--pd-text-primary)' }}>
              {t('settings.about.updateAvailable', { version: String(status.version ?? '') })}
            </span>
            <PdButton variant="primary" size="sm" onClick={handleDownload}>
              Download
            </PdButton>
          </div>
        )}

        {status?.status === 'downloading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pd-space-2)', width: '100%' }}>
            <span style={{ color: 'var(--pd-text-secondary)' }}>
              {t('settings.about.downloading', { percent: String(status.percent ?? 0) })}
            </span>
            <div style={{ width: '60%' }}>
              <PdProgressBar value={status.percent ?? 0} size="sm" />
            </div>
          </div>
        )}

        {status?.status === 'downloaded' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pd-space-2)' }}>
            <span style={{ color: 'var(--pd-text-primary)' }}>
              {t('settings.about.readyToInstall')}
            </span>
            <PdButton variant="primary" size="sm" onClick={handleInstall}>
              {t('settings.about.restartNow')}
            </PdButton>
          </div>
        )}

        {status?.status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pd-space-2)' }}>
            <span style={{ color: 'var(--pd-text-danger, #ef4444)' }}>
              {t('settings.about.checkFailed')}: {status.message}
            </span>
            <PdButton variant="ghost" size="xs" onClick={handleCheck}>
              {t('settings.about.checkUpdate')}
            </PdButton>
          </div>
        )}
      </div>
    </div>
  );
};
