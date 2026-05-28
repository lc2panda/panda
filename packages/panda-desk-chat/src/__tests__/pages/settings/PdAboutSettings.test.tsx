// Input: PdAboutSettings component — PANDA_GITHUB_REPO / PANDA_RELEASES / PANDA_ISSUES 常量 + updateStore
// Output: 版本号渲染 / GitHub 链接 URL 正确性 / error 状态 fallback 按钮存在性（renderToStaticMarkup）
// Pos: test layer — v2.27.7 关于页字段修复回归

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// ── mock i18n ──────────────────────────────────────────────────────────────
vi.mock('../../../i18n', () => ({
  t: (key: string, params?: Record<string, string>) => {
    const map: Record<string, string> = {
      'settings.about.starHint': 'Star on GitHub',
      'settings.about.releases': 'Releases',
      'settings.about.issues': 'Report an Issue',
      'settings.about.updates': 'App Updates',
      'settings.about.updatesDesc': 'Check GitHub Releases.',
      'update.checkNow': 'Check Now',
      'update.viewReleasesManually': 'View Releases page manually',
      'update.upToDate': 'You are up to date on v{version}.',
      'settings.about.author': 'Author',
      'settings.about.wechatOfficial': 'WeChat',
    };
    let text = map[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  },
}));

// ── mock updateStore ───────────────────────────────────────────────────────
const mockCheckForUpdates = vi.fn();
const mockInstallUpdate = vi.fn();
const mockInitialize = vi.fn();

interface StoreState {
  status: string;
  availableVersion: string | null;
  releaseNotes: null;
  progressPercent: number;
  downloadedBytes: number;
  totalBytes: number;
  error: string | null;
  checkedAt: number | null;
  checkForUpdates: typeof mockCheckForUpdates;
  installUpdate: typeof mockInstallUpdate;
  initialize: typeof mockInitialize;
}

let mockStoreState: StoreState = {
  status: 'up-to-date',
  availableVersion: null,
  releaseNotes: null,
  progressPercent: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  error: null,
  checkedAt: null,
  checkForUpdates: mockCheckForUpdates,
  installUpdate: mockInstallUpdate,
  initialize: mockInitialize,
};

vi.mock('../../../stores/updateStore', () => ({
  useUpdateStore: (selector: (s: StoreState) => unknown) => selector(mockStoreState),
}));

// ── mock PdButton ─────────────────────────────────────────────────────────
vi.mock('../../../components/shared/PdButton', () => ({
  PdButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

// ── mock formatBytes ──────────────────────────────────────────────────────
vi.mock('../../../lib/formatBytes', () => ({
  formatBytes: (n: number) => `${n}B`,
}));

// ── import component (after mocks) ────────────────────────────────────────
import { PdAboutSettings } from '../../../pages/settings/PdAboutSettings';

beforeEach(() => {
  vi.clearAllMocks();
  mockStoreState = {
    status: 'up-to-date',
    availableVersion: null,
    releaseNotes: null,
    progressPercent: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    error: null,
    checkedAt: null,
    checkForUpdates: mockCheckForUpdates,
    installUpdate: mockInstallUpdate,
    initialize: mockInitialize,
  };
});

describe('PdAboutSettings — v2.27.7 字段修复', () => {
  it('GitHub Repo 显示 lc2panda/panda（不是 panda-code）', () => {
    const html = renderToStaticMarkup(<PdAboutSettings />);
    expect(html).toContain('lc2panda/panda');
    expect(html).not.toContain('lc2panda/panda-code');
  });

  it('Releases 按钮存在且 openUrl 指向 /releases URL', () => {
    // PdAboutSettings 的 PANDA_RELEASES 常量应是 /panda/releases
    const html = renderToStaticMarkup(<PdAboutSettings />);
    expect(html).toContain('Releases');
    // 页面上应有 releases URL 文字或内嵌在 onClick 处理中的标识文本
    expect(html).toContain('github.com/lc2panda/panda/releases');
  });

  it('Issues 按钮存在且页面含 issues URL 标识', () => {
    const html = renderToStaticMarkup(<PdAboutSettings />);
    expect(html).toContain('Report an Issue');
    expect(html).toContain('github.com/lc2panda/panda/issues');
  });

  it('检查更新按钮在 up-to-date 状态下渲染', () => {
    const html = renderToStaticMarkup(<PdAboutSettings />);
    expect(html).toContain('Check Now');
  });

  it('error 状态时渲染 fallback Releases 文字', () => {
    mockStoreState.status = 'error';
    mockStoreState.error = 'update check failed';
    const html = renderToStaticMarkup(<PdAboutSettings />);
    expect(html).toContain('View Releases page manually');
  });

  it('非 error 状态时不渲染 fallback Releases 文字', () => {
    mockStoreState.status = 'up-to-date';
    mockStoreState.error = null;
    const html = renderToStaticMarkup(<PdAboutSettings />);
    expect(html).not.toContain('View Releases page manually');
  });
});
