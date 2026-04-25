// Input: providerStore (getAvailableModels), settingsStore (model, setModel), useI18n (t)
// Output: Model selection list with search filter — click row to set active model
// Pos: settings/ModelTab — Model tab inside SettingsPage

import React, { useMemo, useState, type ComponentType } from 'react';
import {
  // @ts-ignore lucide-react bundled .d.ts omits top-level exports
  Search as _Search,
  // @ts-ignore
  CheckCircle2 as _Check,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useI18n } from '../../hooks/useI18n';
import { useSettingsStore } from '../../stores/settingsStore';
import { useProviderStore, type ModelInfo } from '../../stores/providerStore';

type IconFC = ComponentType<{ className?: string; size?: number }>;
const Search = _Search as IconFC;
const Check = _Check as IconFC;

function formatTokens(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

export const ModelTab: React.FC = () => {
  const { t } = useI18n();
  const currentModel = useSettingsStore((s) => s.model);
  const setModel = useSettingsStore((s) => s.setModel);
  const providers = useProviderStore((s) => s.providers);

  const models = useMemo<ModelInfo[]>(() => {
    return providers.filter((p) => p.isActive).flatMap((p) => p.models);
  }, [providers]);

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
    );
  }, [models, query]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
          {t('settings.model.title')}
        </h2>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pd-color-fg-muted)]">
          <Search size={14} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('settings.model.search')}
          className={cn(
            'w-full h-9 pl-9 pr-3 rounded-[8px]',
            'border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)]',
            'text-[13px] text-[var(--pd-color-fg)] placeholder:text-[var(--pd-color-fg-subtle)]',
            'outline-none focus:border-[var(--pd-color-accent)]',
          )}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-[var(--pd-color-fg-muted)]">
          {t('settings.model.noModels')}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const isActive = m.id === currentModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setModel(m.id)}
                className={cn(
                  'w-full text-left rounded-[12px] border px-4 py-3 transition-colors cursor-pointer',
                  isActive
                    ? 'border-[var(--pd-color-accent)] bg-[var(--pd-color-bg-selected)]'
                    : 'border-[var(--pd-color-border)] bg-[var(--pd-color-bg-subtle)] hover:bg-[var(--pd-color-bg-hover)]',
                )}
                aria-pressed={isActive}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)] truncate">
                        {m.name}
                      </span>
                      {isActive && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[var(--pd-color-accent)]">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--pd-color-fg-subtle)] truncate">
                      {m.provider} · {m.id}
                    </div>
                    {m.tags && m.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center h-5 px-2 rounded-[6px] bg-[var(--pd-color-bg)] border border-[var(--pd-color-border)] text-[10px] text-[var(--pd-color-fg-muted)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] text-[var(--pd-color-fg-muted)]">
                      {t('settings.model.maxTokens')}
                    </div>
                    <div className="text-[13px] font-[var(--pd-font-medium)] text-[var(--pd-color-fg)]">
                      {formatTokens(m.maxTokens)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
