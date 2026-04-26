// Input: bridge.getComputerUseStatusPandacc() + listComputerUseInstalledApps() + getComputerUseAuthorizedApps() + setComputerUseAuthorizedApps() + openComputerUseSettings()
// Output: 5-section ComputerUse settings page — Status / Permissions / Authorized Apps / Available Apps / Init Grants
// Pos: Settings tab — eleventh entry (icon: mouse)
//
// Comdr 指令: ComputerUse 完整实现 - cc-haha 对标
//   - panda 走 Swift 路线（@ant/computer-use-swift），不依赖 Python venv
//   - 5 大区块: 状态卡 / macOS 权限 / 已授权应用 / 可授权应用 / 初始化授权目录
//   - 视觉规范严格对齐 cc-haha：rounded-2xl/border 60%/shadow-sm + var(--pd-color-*)
//   - 任意写操作失败 → 不静默：用 toast 友好提示
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useCallback, useEffect, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  getComputerUseStatusPandacc,
  listComputerUseInstalledApps,
  getComputerUseAuthorizedApps,
  setComputerUseAuthorizedApps,
  openComputerUseSettings,
} from '../../ipc/bridge';
import type {
  PandaccComputerUseStatus,
  ComputerUseAuthorizedApp,
  ComputerUseInstalledApp,
  ComputerUseGrantFlags,
  ComputerUsePane,
} from '../../ipc/types';

type CheckState = 'loading' | 'ready' | 'error';

// ─── Status 三态图标（沿用 cc-haha 视觉） ─────────────────────────────────────

function StatusIcon({ ok }: { ok: boolean | null }) {
  if (ok === null) {
    return (
      <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-tertiary)]">
        help
      </span>
    );
  }
  return ok ? (
    <span
      aria-hidden="true"
      className="material-symbols-outlined text-[18px] text-green-500"
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      check_circle
    </span>
  ) : (
    <span
      aria-hidden="true"
      className="material-symbols-outlined text-[18px] text-red-400"
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      cancel
    </span>
  );
}

function StatusRow({
  label,
  ok,
  detail,
  action,
}: {
  label: string;
  ok: boolean | null;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-4 rounded-lg bg-[var(--pd-color-surface-container-low)]">
      <StatusIcon ok={ok} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">{label}</div>
        <div className="mt-0.5 text-xs text-[var(--pd-color-text-tertiary)] break-all">{detail}</div>
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export function PdComputerUseSettings() {
  const [status, setStatus] = useState<PandaccComputerUseStatus | null>(null);
  const [checkState, setCheckState] = useState<CheckState>('loading');

  const [installedApps, setInstalledApps] = useState<ComputerUseInstalledApp[]>([]);
  const [appsLoading, setAppsLoading] = useState<boolean>(false);

  const [authorizedApps, setAuthorizedApps] = useState<ComputerUseAuthorizedApp[]>([]);
  const [grantFlags, setGrantFlags] = useState<ComputerUseGrantFlags>({
    clipboardRead: true,
    clipboardWrite: true,
    systemKeyCombos: true,
  });
  const [authorizedBundleIds, setAuthorizedBundleIds] = useState<Set<string>>(new Set());
  const [savingErr, setSavingErr] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ── Status: Platform / grants / TCC perms 一次性拉取 ─────────────────────
  const fetchStatus = useCallback(async () => {
    setCheckState('loading');
    try {
      const s = await getComputerUseStatusPandacc();
      setStatus(s);
      setCheckState('ready');
    } catch {
      setCheckState('error');
    }
  }, []);

  // ── Apps: 已装 + 已授权（仅 darwin 且 grants 已存在时拉） ──────────────────
  const fetchApps = useCallback(async () => {
    setAppsLoading(true);
    try {
      const [installed, grants] = await Promise.all([
        listComputerUseInstalledApps(),
        getComputerUseAuthorizedApps(),
      ]);
      setInstalledApps(installed);
      setAuthorizedApps(grants.authorizedApps);
      setGrantFlags(grants.grantFlags);
      setAuthorizedBundleIds(new Set(grants.authorizedApps.map((a) => a.bundleId)));
    } catch {
      // 单个失败不阻塞 — UI 自降级显示空列表
    } finally {
      setAppsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  // grants 存在 + darwin 时才拉应用列表（节省 system_profiler 调用）
  const shouldFetchApps = status?.supported && status.grantsExist;
  useEffect(() => {
    if (shouldFetchApps) void fetchApps();
  }, [shouldFetchApps, fetchApps]);

  // ── 写授权（自动保存 + 1.5s 提示） ─────────────────────────────────────────
  const persistAuthorized = useCallback(
    async (next: ComputerUseAuthorizedApp[], nextFlags?: ComputerUseGrantFlags) => {
      setSavingErr(null);
      const result = await setComputerUseAuthorizedApps({
        authorizedApps: next,
        grantFlags: nextFlags ?? grantFlags,
      });
      if (result.ok) {
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 1500);
        // 写完后刷一次 status — grantsExist 可能由 false 翻 true
        if (!status?.grantsExist) void fetchStatus();
      } else {
        setSavingErr(result.error || t('settings.computerUse.savingErr'));
      }
    },
    [grantFlags, status?.grantsExist, fetchStatus],
  );

  const toggleApp = useCallback(
    async (app: ComputerUseInstalledApp) => {
      const isAuth = authorizedBundleIds.has(app.bundleId);
      let next: ComputerUseAuthorizedApp[];
      if (isAuth) {
        next = authorizedApps.filter((a) => a.bundleId !== app.bundleId);
      } else {
        next = [
          ...authorizedApps,
          {
            bundleId: app.bundleId,
            displayName: app.displayName,
            authorizedAt: new Date().toISOString(),
          },
        ];
      }
      setAuthorizedApps(next);
      setAuthorizedBundleIds(new Set(next.map((a) => a.bundleId)));
      await persistAuthorized(next);
    },
    [authorizedApps, authorizedBundleIds, persistAuthorized],
  );

  const removeAuthorized = useCallback(
    async (bundleId: string) => {
      const next = authorizedApps.filter((a) => a.bundleId !== bundleId);
      setAuthorizedApps(next);
      setAuthorizedBundleIds(new Set(next.map((a) => a.bundleId)));
      await persistAuthorized(next);
    },
    [authorizedApps, persistAuthorized],
  );

  const toggleFlag = useCallback(
    async (key: keyof ComputerUseGrantFlags, value: boolean) => {
      const next: ComputerUseGrantFlags = {
        ...grantFlags,
        [key]: value,
        // clipboardRead / clipboardWrite 联动 — UI 仅一个开关
        ...(key === 'clipboardRead' ? { clipboardWrite: value } : {}),
      };
      setGrantFlags(next);
      await persistAuthorized(authorizedApps, next);
    },
    [authorizedApps, grantFlags, persistAuthorized],
  );

  const initGrants = useCallback(async () => {
    setSavingErr(null);
    const result = await setComputerUseAuthorizedApps({
      authorizedApps: [],
      grantFlags: {
        clipboardRead: true,
        clipboardWrite: true,
        systemKeyCombos: true,
      },
    });
    if (result.ok) {
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1500);
      await fetchStatus();
      await fetchApps();
    } else {
      setSavingErr(result.error || t('settings.computerUse.savingErr'));
    }
  }, [fetchStatus, fetchApps]);

  const handleOpenSettings = useCallback(async (pane: ComputerUsePane) => {
    setSavingErr(null);
    const result = await openComputerUseSettings(pane);
    if (!result.ok) {
      setSavingErr(result.error || t('settings.computerUse.openSettingsErr'));
    }
  }, []);

  const filteredApps = useMemo(() => {
    if (!searchQuery) return installedApps;
    const q = searchQuery.toLowerCase();
    return installedApps.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.bundleId.toLowerCase().includes(q),
    );
  }, [installedApps, searchQuery]);

  const sortedApps = useMemo(() => {
    return [...filteredApps].sort((a, b) => {
      const aAuth = authorizedBundleIds.has(a.bundleId) ? 0 : 1;
      const bAuth = authorizedBundleIds.has(b.bundleId) ? 0 : 1;
      if (aAuth !== bAuth) return aAuth - bAuth;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [filteredApps, authorizedBundleIds]);

  // ── 渲染 ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6" data-tab="computerUse">
      {/* 标题 */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--pd-color-text-primary)]">
          {t('settings.computerUse.title')}
        </h2>
        <p className="mt-1 text-sm text-[var(--pd-color-text-secondary)]">
          {t('settings.computerUse.description')}
        </p>
        <p className="mt-1 text-xs text-[var(--pd-color-text-tertiary)]">
          {t('settings.computerUse.swiftRouteHint')}
        </p>
      </div>

      {/* 加载/错误态 */}
      {checkState === 'loading' ? (
        <div className="py-8 text-center text-sm text-[var(--pd-color-text-tertiary)]">
          {t('common.loading')}
        </div>
      ) : checkState === 'error' ? (
        <div className="py-8 text-center text-sm text-red-400">
          Failed to check status.
          <button onClick={() => void fetchStatus()} className="ml-2 underline">
            {t('common.retry')}
          </button>
        </div>
      ) : status ? (
        <>
          {/* 区块 1: 顶部状态卡 — Platform / Grants 行 */}
          <section className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-4 py-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pd-color-text-tertiary)] mb-3">
              {t('settings.computerUse.pandaccTitle')}
            </div>
            <div className="space-y-2">
              <StatusRow
                label={t('settings.computerUse.platform')}
                ok={status.supported}
                detail={`${status.platform} — ${
                  status.supported
                    ? t('settings.computerUse.platformSupported')
                    : t('settings.computerUse.platformUnsupported')
                }`}
              />
              <StatusRow
                label={t('settings.computerUse.grants')}
                ok={status.grantsExist}
                detail={
                  status.grantsExist
                    ? `${t('settings.computerUse.grantsExist')} — ${status.grantsPath}`
                    : t('settings.computerUse.grantsMissing')
                }
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => void fetchStatus()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pd-color-border)] px-3 py-1.5 text-xs text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                  refresh
                </span>
                {t('settings.computerUse.recheckBtn')}
              </button>
              {savedToast && (
                <span className="inline-flex items-center gap-1 text-xs text-green-500">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                  {t('settings.computerUse.appsSaved')}
                </span>
              )}
            </div>
          </section>

          {/* 非 darwin 平台直接告警，跳过其余区块 */}
          {!status.supported ? (
            <div className="px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-600">
              {t('settings.computerUse.notSupported')}
            </div>
          ) : (
            <>
              {/* 区块 2: macOS 权限 — accessibility + screen recording */}
              <section className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                      {t('settings.computerUse.permsTitle')}
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--pd-color-text-tertiary)]">
                      {t('settings.computerUse.permsHint')}
                    </p>
                  </div>
                  <button
                    onClick={() => void fetchStatus()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pd-color-border)] px-3 py-1.5 text-xs text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] transition-colors flex-shrink-0"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                      refresh
                    </span>
                    {t('settings.computerUse.permRefresh')}
                  </button>
                </div>

                <div className="space-y-2">
                  <StatusRow
                    label={t('settings.computerUse.accessibility')}
                    ok={status.permissions.accessibility}
                    detail={
                      status.permissions.accessibility === true
                        ? t('settings.computerUse.permGranted')
                        : status.permissions.accessibility === false
                          ? t('settings.computerUse.permDenied')
                          : t('settings.computerUse.permUnknown')
                    }
                    action={
                      status.permissions.accessibility !== true ? (
                        <button
                          onClick={() => void handleOpenSettings('accessibility')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--pd-color-accent)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                            open_in_new
                          </span>
                          {t('settings.computerUse.openAccessibility')}
                        </button>
                      ) : undefined
                    }
                  />
                  <StatusRow
                    label={t('settings.computerUse.screenRecording')}
                    ok={status.permissions.screenRecording}
                    detail={
                      status.permissions.screenRecording === true
                        ? t('settings.computerUse.permGranted')
                        : status.permissions.screenRecording === false
                          ? t('settings.computerUse.permDenied')
                          : t('settings.computerUse.permScreenRecordingUnknownSoft')
                    }
                    action={
                      status.permissions.screenRecording !== true ? (
                        <button
                          onClick={() => void handleOpenSettings('screen-recording')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--pd-color-accent)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                            open_in_new
                          </span>
                          {t('settings.computerUse.openScreenRecording')}
                        </button>
                      ) : undefined
                    }
                  />
                </div>
                <p className="mt-3 text-[11px] text-[var(--pd-color-text-tertiary)]">
                  {t('settings.computerUse.permRestartHint')}
                </p>
              </section>

              {/* 区块 5: 初始化授权目录（grants 不存在时显示，置于权限之后、应用列表之前） */}
              {!status.grantsExist && (
                <section className="rounded-2xl border border-dashed border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[20px] text-[var(--pd-color-accent)] mt-0.5"
                    >
                      folder_off
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                        {t('settings.computerUse.initGrantsTitle')}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--pd-color-text-tertiary)]">
                        {t('settings.computerUse.initGrantsHint')}
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={() => void initGrants()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pd-color-accent)] px-4 py-2 text-xs font-semibold text-[var(--pd-color-fg-on-accent)] hover:opacity-90 transition-opacity"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                            create_new_folder
                          </span>
                          {t('settings.computerUse.initGrantsBtn')}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 区块 3: 已授权应用 + grant flags */}
              {status.grantsExist && (
                <section className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                        {t('settings.computerUse.appsTitle')}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--pd-color-text-tertiary)]">
                        {t('settings.computerUse.appsDescription')}
                      </p>
                    </div>
                  </div>

                  {/* Grant flags */}
                  <div className="flex gap-4 mt-3 mb-4">
                    <label className="flex items-center gap-2 text-xs text-[var(--pd-color-text-secondary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={grantFlags.clipboardRead}
                        onChange={(e) => void toggleFlag('clipboardRead', e.target.checked)}
                        className="rounded border-[var(--pd-color-border)] accent-[var(--pd-color-accent)]"
                      />
                      {t('settings.computerUse.flagClipboard')}
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[var(--pd-color-text-secondary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={grantFlags.systemKeyCombos}
                        onChange={(e) => void toggleFlag('systemKeyCombos', e.target.checked)}
                        className="rounded border-[var(--pd-color-border)] accent-[var(--pd-color-accent)]"
                      />
                      {t('settings.computerUse.flagSystemKeys')}
                    </label>
                  </div>

                  {/* 已授权列表（带取消授权） */}
                  {authorizedApps.length === 0 ? (
                    <div className="text-xs text-[var(--pd-color-text-tertiary)] py-3">
                      {t('settings.computerUse.authorizedAppsEmpty')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {authorizedApps.map((app) => (
                        <div
                          key={app.bundleId}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--pd-color-surface-container-low)]"
                        >
                          <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-[18px] text-green-500"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            verified
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[var(--pd-color-text-primary)] truncate">
                              {app.displayName}
                            </div>
                            <div className="text-[11px] font-mono text-[var(--pd-color-text-tertiary)] truncate">
                              {app.bundleId}
                            </div>
                          </div>
                          <button
                            onClick={() => void removeAuthorized(app.bundleId)}
                            className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg border border-[var(--pd-color-border)] px-2.5 py-1 text-[11px] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] hover:text-red-400 transition-colors"
                          >
                            <span aria-hidden="true" className="material-symbols-outlined text-[12px]">
                              delete
                            </span>
                            {t('settings.computerUse.removeAppBtn')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* 区块 4: 可授权应用 — 列已装应用 + 搜索 + 选中即写 */}
              {status.grantsExist && (
                <section className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                        {t('settings.computerUse.installedAppsTitle')}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--pd-color-text-tertiary)]">
                        {t('settings.computerUse.installedAppsHint')}
                      </p>
                    </div>
                    <button
                      onClick={() => void fetchApps()}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[var(--pd-color-border)] px-3 py-1.5 text-xs text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                        refresh
                      </span>
                      {t('settings.skills.refresh')}
                    </button>
                  </div>

                  {/* 搜索 */}
                  <div className="relative mb-3">
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2"
                    >
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('settings.computerUse.appsSearch')}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--pd-color-surface-container-low)] border border-[var(--pd-color-border)] rounded-lg text-[var(--pd-color-text-primary)] placeholder:text-[var(--pd-color-text-tertiary)] focus:outline-none focus:border-[var(--pd-color-accent)]"
                    />
                  </div>

                  {/* App 列表 */}
                  {appsLoading ? (
                    <div className="py-6 text-center text-sm text-[var(--pd-color-text-tertiary)]">
                      {t('settings.computerUse.appsLoading')}
                    </div>
                  ) : installedApps.length === 0 ? (
                    <div className="py-6 text-center text-sm text-[var(--pd-color-text-tertiary)]">
                      {t('settings.computerUse.appsEmpty')}
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto rounded-lg border border-[var(--pd-color-border)]">
                      {sortedApps.map((app) => {
                        const isAuthorized = authorizedBundleIds.has(app.bundleId);
                        return (
                          <button
                            key={`${app.path}::${app.bundleId}`}
                            onClick={() => void toggleApp(app)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--pd-color-surface-hover)] border-b border-[var(--pd-color-border)] last:border-b-0 ${
                              isAuthorized ? 'bg-[var(--pd-color-accent)]/5' : ''
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${
                                isAuthorized
                                  ? 'bg-[var(--pd-color-accent)] border-[var(--pd-color-accent)]'
                                  : 'border-[var(--pd-color-border)]'
                              }`}
                            >
                              {isAuthorized && (
                                <span
                                  aria-hidden="true"
                                  className="material-symbols-outlined text-[14px] text-[var(--pd-color-fg-on-accent)]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  check
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[var(--pd-color-text-primary)] truncate">
                                {app.displayName}
                              </div>
                              <div className="text-[11px] text-[var(--pd-color-text-tertiary)] truncate font-mono">
                                {app.path}
                              </div>
                            </div>
                            <span className="flex-shrink-0 text-[11px] font-medium text-[var(--pd-color-text-tertiary)]">
                              {isAuthorized
                                ? t('settings.computerUse.removeAppBtn')
                                : t('settings.computerUse.addAppBtn')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* 错误提示（持久显示直到下一次成功操作） */}
              {savingErr && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                  {savingErr}
                </div>
              )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
