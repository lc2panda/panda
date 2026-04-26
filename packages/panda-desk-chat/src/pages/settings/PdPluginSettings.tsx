// Input: pluginStore (plugins / marketplaces / reload action / selectedPlugin) — Comdr 指令: 真实 ~/.pandacc/plugins/installed_plugins.json
// Output: Plugins browser banner · summary cards · marketplaces · grouped buckets (enabled/disabled)
// Pos: Settings tab — ninth entry (icon: extension)
//
// Source 1:1: cc-haha desktop/src/components/plugins/PluginList.tsx + PluginDetail.tsx
//   Comdr 指令: pluginStore 改用 listPluginsPandacc() 读真实数据，UI 直接展示卡片网格。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useMemo } from 'react';
import { t } from '../../i18n';
import { usePluginStore } from '../../stores/pluginStore';

export function PdPluginSettings() {
  const plugins = usePluginStore((s) => s.plugins);
  const marketplaces = usePluginStore((s) => s.marketplaces);
  const summary = usePluginStore((s) => s.summary);
  const isLoading = usePluginStore((s) => s.isLoading);
  const error = usePluginStore((s) => s.error);
  const fetchPlugins = usePluginStore((s) => s.fetchPlugins);

  useEffect(() => {
    void fetchPlugins(undefined);
  }, [fetchPlugins]);

  const grouped = useMemo(() => {
    const enabled = plugins.filter((p) => p.enabled);
    const disabled = plugins.filter((p) => !p.enabled);
    return { enabled, disabled };
  }, [plugins]);

  return (
    <div className="w-full min-w-0">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
            {t('settings.plugins.title')}
          </h2>
          <p className="text-sm text-[var(--pd-color-text-tertiary)]">
            {t('settings.plugins.description')}
          </p>
        </div>
        <button
          onClick={() => void fetchPlugins(undefined)}
          className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--pd-color-text-secondary)] border border-[var(--pd-color-border)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">refresh</span>
          {t('settings.plugins.refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-5 h-5 border-2 border-[var(--pd-color-brand)] border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-sm text-[var(--pd-color-error)] py-4">{error}</div>
      ) : plugins.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-6">
          <span aria-hidden="true" className="material-symbols-outlined text-[40px] text-[var(--pd-color-text-tertiary)] mb-2 block">
            extension
          </span>
          <p className="text-sm text-[var(--pd-color-text-tertiary)]">
            {t('settings.plugins.empty')}
          </p>
          <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-1">
            {t('settings.plugins.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary row */}
          {summary && (
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryStat
                icon="extension"
                label={t('settings.plugins.summary.total')}
                value={String(summary.total)}
              />
              <SummaryStat
                icon="check_circle"
                label={t('settings.plugins.summary.enabled')}
                value={String(summary.enabled)}
              />
              <SummaryStat
                icon="storefront"
                label={t('settings.plugins.summary.marketplaces')}
                value={String(summary.marketplaceCount)}
              />
            </div>
          )}

          {/* Marketplaces row */}
          {marketplaces.length > 0 && (
            <section className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pd-color-text-tertiary)] mb-2">
                {t('settings.plugins.marketplacesTitle')}
              </div>
              <div className="flex flex-wrap gap-2">
                {marketplaces.map((m) => (
                  <span
                    key={m.name}
                    className="rounded-full border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2.5 py-1 text-[11px] font-mono text-[var(--pd-color-text-secondary)]"
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Enabled */}
          {grouped.enabled.length > 0 && (
            <section className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] overflow-hidden">
              <div className="border-b border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[var(--pd-color-success)]">
                    check_circle
                  </span>
                  <h4 className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                    {t('settings.plugins.group.enabled')}
                  </h4>
                  <span className="text-xs text-[var(--pd-color-text-tertiary)]">
                    {grouped.enabled.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[var(--pd-color-border)]">
                {grouped.enabled.map((p) => (
                  <PluginRow key={p.id} plugin={p} />
                ))}
              </div>
            </section>
          )}

          {/* Disabled */}
          {grouped.disabled.length > 0 && (
            <section className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] overflow-hidden">
              <div className="border-b border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-tertiary)]">
                    block
                  </span>
                  <h4 className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                    {t('settings.plugins.group.disabled')}
                  </h4>
                  <span className="text-xs text-[var(--pd-color-text-tertiary)]">
                    {grouped.disabled.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[var(--pd-color-border)]">
                {grouped.disabled.map((p) => (
                  <PluginRow key={p.id} plugin={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-3 py-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[var(--pd-color-text-tertiary)]">
        <span aria-hidden="true" className="material-symbols-outlined text-[14px]">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold text-[var(--pd-color-text-primary)]">
        {value}
      </div>
    </div>
  );
}

function PluginRow({
  plugin,
}: {
  plugin: { id: string; name: string; version?: string; enabled: boolean; description?: string };
}) {
  return (
    <div data-plugin={plugin.id} className="px-4 py-3 transition-colors hover:bg-[var(--pd-color-surface-hover)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[var(--pd-color-text-primary)] break-all">
              {plugin.name}
            </span>
            <span className="rounded-full border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-2 py-0.5 text-[10px] font-mono text-[var(--pd-color-text-tertiary)]">
              v{plugin.version ?? 'unknown'}
            </span>
            <span className="text-[11px] font-mono text-[var(--pd-color-text-tertiary)] truncate">
              {plugin.id}
            </span>
          </div>
          {plugin.description && (
            <div className="mt-1 text-[11px] font-mono text-[var(--pd-color-text-tertiary)] truncate">
              {plugin.description}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em]">
          {plugin.enabled ? (
            <span className="text-[var(--pd-color-success)]">
              {t('settings.plugins.status.enabled')}
            </span>
          ) : (
            <span className="text-[var(--pd-color-text-tertiary)]">
              {t('settings.plugins.status.disabled')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
