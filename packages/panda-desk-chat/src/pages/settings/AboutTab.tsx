// Input: useI18n (t), bridge update functions, UpdateStatus IPC events
// Output: About panel — app identity, version + auto-update, links (GitHub/docs/discord), credits
// Pos: settings/AboutTab — last tab in SettingsPage
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React, { useCallback, useEffect, useState, type ComponentType } from 'react';
// @ts-ignore lucide-react bundled .d.ts omits these top-level icons
import { Github as _Github, ExternalLink as _ExternalLink, BookOpen as _BookOpen, MessageCircle as _MessageCircle, Heart as _Heart } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { PdButton } from '../../components/atoms/PdButton';
import { PdSpinner } from '../../components/atoms/PdSpinner';
import { PdProgressBar } from '../../components/special/PdProgressBar';
import { checkForUpdates, downloadUpdate, installUpdate, onUpdateStatus } from '../../ipc/bridge';
import type { UpdateStatus } from '../../ipc/types';
import { cn } from '../../lib/cn';

type IconFC = ComponentType<{ size?: number; className?: string }>;
const Github = _Github as IconFC;
const ExternalLink = _ExternalLink as IconFC;
const BookOpen = _BookOpen as IconFC;
const MessageCircle = _MessageCircle as IconFC;
const Heart = _Heart as IconFC;

const APP_VERSION: string =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.2.0';

const LINKS = [
  { id: 'github', icon: Github, label: 'GitHub', href: 'https://github.com/lc2panda/panda', desc: '源代码 / Issue 反馈' },
  { id: 'docs', icon: BookOpen, label: '文档', href: 'https://github.com/lc2panda/panda#readme', desc: '使用指南与 API' },
  { id: 'discord', icon: MessageCircle, label: '社区', href: 'https://github.com/lc2panda/panda/discussions', desc: 'Discussions 与社区' },
];

export const AboutTab: React.FC = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<UpdateStatus | null>(null);

  useEffect(() => {
    const unsub = onUpdateStatus((s) => setStatus(s));
    return unsub;
  }, []);

  const handleCheck = useCallback(() => {
    setStatus({ status: 'checking' });
    checkForUpdates();
  }, []);
  const handleDownload = useCallback(() => downloadUpdate(), []);
  const handleInstall = useCallback(() => installUpdate(), []);

  return (
    <div className="space-y-6">
      {/* App identity card */}
      <div
        className="rounded-[16px] p-6 flex flex-col items-center gap-3"
        style={{ background: 'var(--pd-color-bg-subtle)' }}
      >
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-[28px]"
          style={{ background: 'var(--pd-color-bg-elevated)', boxShadow: 'var(--pd-shadow-sm)' }}
          aria-hidden="true"
        >
          🐼
        </div>
        <div>
          <h1 className="text-[20px] font-[var(--pd-font-bold)] text-[var(--pd-color-fg)] text-center">Panda Code</h1>
          <div className="text-[12px] text-[var(--pd-color-fg-muted)] text-center mt-0.5">
            v{APP_VERSION} · 一个本地优先的 AI 编码桌面客户端
          </div>
        </div>
      </div>

      {/* Update section */}
      <section className="rounded-[12px] border border-[var(--pd-color-border)] p-4 space-y-3">
        <h2 className="text-[14px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
          {t('settings.about.checkUpdate')}
        </h2>
        {!status && (
          <PdButton variant="secondary" size="sm" onClick={handleCheck}>
            {t('settings.about.checkUpdate')}
          </PdButton>
        )}
        {status?.status === 'checking' && (
          <div className="flex items-center gap-2 text-[var(--pd-color-fg-muted)] text-[13px]">
            <PdSpinner variant="ring" size="sm" />
            <span>{t('settings.about.checkUpdate')}...</span>
          </div>
        )}
        {status?.status === 'up-to-date' && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--pd-color-success)]">
              ✓ {t('settings.about.upToDate')}
            </span>
            <PdButton variant="ghost" size="xs" onClick={handleCheck}>
              {t('settings.about.checkUpdate')}
            </PdButton>
          </div>
        )}
        {status?.status === 'available' && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-[var(--pd-color-fg)]">
              {t('settings.about.updateAvailable', { version: String(status.version ?? '') })}
            </span>
            <PdButton variant="primary" size="sm" onClick={handleDownload}>
              下载更新
            </PdButton>
          </div>
        )}
        {status?.status === 'downloading' && (
          <div className="space-y-2">
            <div className="text-[13px] text-[var(--pd-color-fg-muted)]">
              {t('settings.about.downloading', { percent: String(status.percent ?? 0) })}
            </div>
            <PdProgressBar value={status.percent ?? 0} size="sm" />
          </div>
        )}
        {status?.status === 'downloaded' && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-[var(--pd-color-fg)]">{t('settings.about.readyToInstall')}</span>
            <PdButton variant="primary" size="sm" onClick={handleInstall}>
              {t('settings.about.restartNow')}
            </PdButton>
          </div>
        )}
        {status?.status === 'error' && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-[var(--pd-color-error)]">
              {t('settings.about.checkFailed')}: {status.message}
            </span>
            <PdButton variant="ghost" size="xs" onClick={handleCheck}>
              {t('settings.about.checkUpdate')}
            </PdButton>
          </div>
        )}
      </section>

      {/* Links section */}
      <section className="space-y-2">
        <h2 className="text-[14px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)] mb-2">
          链接
        </h2>
        <div className="space-y-1">
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.id}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[8px]',
                  'border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)]',
                  'hover:bg-[var(--pd-color-bg-hover)] transition-colors',
                  'no-underline cursor-pointer',
                )}
                style={{ textDecoration: 'none' }}
              >
                <Icon size={16} className="text-[var(--pd-color-fg-muted)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-[var(--pd-font-medium)] text-[var(--pd-color-fg)]">{l.label}</div>
                  <div className="text-[11px] text-[var(--pd-color-fg-muted)]">{l.desc}</div>
                </div>
                <ExternalLink size={12} className="text-[var(--pd-color-fg-subtle)] shrink-0" />
              </a>
            );
          })}
        </div>
      </section>

      {/* Credits */}
      <div className="text-center text-[11px] text-[var(--pd-color-fg-subtle)] pt-2 flex items-center justify-center gap-1">
        <span>Made with</span>
        <Heart size={11} className="text-[var(--pd-color-accent)]" />
        <span>by Panda team</span>
      </div>
    </div>
  );
};
