// Input: 路由 — useTabStore.activeTabId === CONNECTORS_TAB_ID 时挂载
// Output: 数据连接器列表 — panda CLI src/connectors/registry.ts 内置 6 platform：
//         feishu / dingtalk / slack / telegram / wechat / teams
// Pos: Page layer — PdContentRouter 'connectors' 分支唯一目标
//
// Comdr 指令 cc-haha 路线 A — PdConnectors 真实数据接入：
//   bridge.getConnectorsSnapshot()  → ~/.pandacc/config/connectors.json
//   bridge.toggleConnector()        → 写回开关位（仅 enabled，不动 secret 字段）
//   不展示 calendar/email/notifications（panda CLI 当前未实现这些 platform）。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useCallback, useEffect, useState } from 'react';
import { t } from '../i18n';
import { PdButton } from '../components/shared/PdButton';
import {
  getConnectorsSnapshot,
  toggleConnector as bridgeToggleConnector,
} from '../ipc/bridge';
import type {
  ConnectorEntry,
  ConnectorPlatformId,
  ConnectorsConfigSnapshot,
} from '../ipc/types';

interface ConnectorMeta {
  platform: ConnectorPlatformId;
  icon: string;
  titleKey: string;
  descKey: string;
}

/** panda CLI 真实 6 platform — 与 src/connectors/registry.ts 内置工厂顺序对齐。 */
const PLATFORM_META: ConnectorMeta[] = [
  { platform: 'feishu', icon: 'forum', titleKey: 'connectors.feishu.title', descKey: 'connectors.feishu.desc' },
  { platform: 'dingtalk', icon: 'campaign', titleKey: 'connectors.dingtalk.title', descKey: 'connectors.dingtalk.desc' },
  { platform: 'slack', icon: 'tag', titleKey: 'connectors.slack.title', descKey: 'connectors.slack.desc' },
  { platform: 'telegram', icon: 'send', titleKey: 'connectors.telegram.title', descKey: 'connectors.telegram.desc' },
  { platform: 'wechat', icon: 'chat', titleKey: 'connectors.wechat.title', descKey: 'connectors.wechat.desc' },
  { platform: 'teams', icon: 'groups_3', titleKey: 'connectors.teams.title', descKey: 'connectors.teams.desc' },
];

interface State {
  snapshot: ConnectorsConfigSnapshot | null;
  loading: boolean;
  error: string | null;
  pending: Partial<Record<ConnectorPlatformId, boolean>>;
}

export function PdConnectors() {
  const [state, setState] = useState<State>({
    snapshot: null,
    loading: true,
    error: null,
    pending: {},
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const snapshot = await getConnectorsSnapshot();
      setState((s) => ({ ...s, snapshot, loading: false, error: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const snapshot = await getConnectorsSnapshot();
        if (!mounted) return;
        setState((s) => ({ ...s, snapshot, loading: false, error: null }));
      } catch (err) {
        if (!mounted) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggle = useCallback(
    async (platform: ConnectorPlatformId, current: boolean) => {
      setState((s) => ({ ...s, pending: { ...s.pending, [platform]: true } }));
      try {
        const result = await bridgeToggleConnector(platform, !current);
        if (!result.ok) {
          setState((s) => ({
            ...s,
            pending: { ...s.pending, [platform]: false },
            error: result.error,
          }));
          return;
        }
        // 重读快照，确保 configured/hasKeychainRef 等派生字段同步
        await refresh();
        setState((s) => ({ ...s, pending: { ...s.pending, [platform]: false } }));
      } catch (err) {
        setState((s) => ({
          ...s,
          pending: { ...s.pending, [platform]: false },
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    },
    [refresh],
  );

  const snapshot = state.snapshot;
  const entriesByPlatform = new Map<ConnectorPlatformId, ConnectorEntry>();
  if (snapshot) {
    for (const e of snapshot.entries) entriesByPlatform.set(e.platform, e);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)]">
                <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-[var(--pd-color-brand)]">
                  cable
                </span>
              </div>
              <h1
                className="text-2xl font-bold tracking-tight text-[var(--pd-color-text-primary)]"
                style={{ fontFamily: 'var(--pd-font-headline)' }}
              >
                {t('connectors.title')}
              </h1>
            </div>
            <p className="text-sm text-[var(--pd-color-text-secondary)]">
              {t('connectors.description')}
            </p>
          </header>

          {/* 配置文件状态条 */}
          {snapshot && (
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  aria-hidden="true"
                  className={`material-symbols-outlined text-[18px] ${
                    snapshot.configExists
                      ? 'text-[var(--pd-color-success)]'
                      : 'text-[var(--pd-color-text-tertiary)]'
                  }`}
                >
                  {snapshot.configExists ? 'check_circle' : 'pending'}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--pd-color-text-primary)]">
                    {snapshot.configExists
                      ? t('connectors.configFound')
                      : t('connectors.configMissing')}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[var(--pd-color-text-tertiary)] font-mono break-all">
                    {snapshot.configPath || '~/.pandacc/config/connectors.json'}
                  </div>
                </div>
              </div>
              <PdButton variant="ghost" size="sm" onClick={() => void refresh()}>
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                  refresh
                </span>
              </PdButton>
            </div>
          )}

          {state.loading && !snapshot && (
            <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center text-sm text-[var(--pd-color-text-tertiary)] shadow-sm">
              {t('connectors.loading')}
            </div>
          )}

          {state.error && (
            <div className="mb-4 rounded-2xl border border-[var(--pd-color-error)]/40 bg-[var(--pd-color-error)]/5 p-3 shadow-sm">
              <div className="text-xs font-semibold text-[var(--pd-color-error)]">
                {t('connectors.error')}
              </div>
              <div className="mt-1 text-xs text-[var(--pd-color-text-secondary)] break-words">
                {state.error}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {PLATFORM_META.map((meta) => {
              const entry = entriesByPlatform.get(meta.platform);
              const isOn = !!entry?.enabled;
              const isPending = !!state.pending[meta.platform];
              const configured = !!entry?.configured;
              const hasKeychainRef = !!entry?.hasKeychainRef;
              return (
                <div
                  key={meta.platform}
                  className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-4 shadow-sm transition-colors hover:bg-[var(--pd-color-surface-hover)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)]">
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[var(--pd-color-text-secondary)]">
                        {meta.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[var(--pd-color-text-primary)] truncate">
                          {t(meta.titleKey)}
                        </h3>
                        <StatusBadge active={isOn} configured={configured} />
                        {entry?.mode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)]">
                            {entry.mode}
                          </span>
                        )}
                        {hasKeychainRef && (
                          <span
                            title={t('connectors.keychainHint')}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)] flex items-center gap-1"
                          >
                            <span aria-hidden="true" className="material-symbols-outlined text-[12px]">
                              key
                            </span>
                            keychain
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[var(--pd-color-text-tertiary)] leading-relaxed">
                        {t(meta.descKey)}
                      </p>
                      {entry?.permissions && entry.permissions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {entry.permissions.slice(0, 4).map((p) => (
                            <span
                              key={p}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)]"
                            >
                              {p}
                            </span>
                          ))}
                          {entry.permissions.length > 4 && (
                            <span className="text-[10px] text-[var(--pd-color-text-tertiary)]">
                              +{entry.permissions.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <PdButton
                          variant={isOn ? 'secondary' : 'primary'}
                          size="sm"
                          disabled={isPending}
                          onClick={() => void handleToggle(meta.platform, isOn)}
                        >
                          {isPending
                            ? t('connectors.pending')
                            : isOn
                              ? t('connectors.action.disable')
                              : t('connectors.action.enable')}
                        </PdButton>
                        <PdButton
                          variant="ghost"
                          size="sm"
                          disabled
                          title={t('connectors.configurePending')}
                        >
                          {t('connectors.action.configure')}
                        </PdButton>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-xs text-[var(--pd-color-text-tertiary)]">
            {t('connectors.savedHint')}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ active, configured }: { active: boolean; configured: boolean }) {
  if (!configured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)]">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--pd-color-text-tertiary)]" />
        {t('connectors.status.unconfigured')}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        active
          ? 'border-[var(--pd-color-success)]/40 bg-[var(--pd-color-success)]/10 text-[var(--pd-color-success)]'
          : 'border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[var(--pd-color-success)]' : 'bg-[var(--pd-color-text-tertiary)]'}`}
      />
      {active ? t('connectors.status.enabled') : t('connectors.status.disabled')}
    </span>
  );
}

export default PdConnectors;
