// Input: providerStore (CRUD actions), useI18n (t)
// Output: Provider configuration panel — API key + baseUrl inputs per provider, activate toggle, add/remove
// Pos: settings/ProvidersTab — third tab in SettingsPage
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React, { useState, type ComponentType } from 'react';
import { useShallow } from 'zustand/react/shallow';
// @ts-ignore lucide-react bundled .d.ts omits top-level exports
import { Plus as _Plus, Trash2 as _Trash2, CheckCircle2 as _Check } from 'lucide-react';
import { PdInput } from '../../components/atoms/PdInput';
import { useI18n } from '../../hooks/useI18n';
import { useProviderStore, type Provider } from '../../stores/providerStore';
import { SettingRow } from './SettingRow';
import { cn } from '../../lib/cn';

type IconFC = ComponentType<{ className?: string; size?: number }>;
const Plus = _Plus as IconFC;
const Trash2 = _Trash2 as IconFC;
const Check = _Check as IconFC;

const PROVIDER_TYPE_OPTIONS: Array<{ value: Provider['type']; label: string; baseUrlHint: string }> = [
  { value: 'anthropic', label: 'Anthropic', baseUrlHint: 'https://api.anthropic.com' },
  { value: 'openai', label: 'OpenAI 兼容', baseUrlHint: 'https://api.openai.com/v1' },
  { value: 'openrouter', label: 'OpenRouter', baseUrlHint: 'https://openrouter.ai/api/v1' },
  { value: 'bedrock', label: 'AWS Bedrock', baseUrlHint: 'us-east-1' },
  { value: 'vertex', label: 'Google Vertex', baseUrlHint: 'project-id:location' },
  { value: 'azure', label: 'Azure OpenAI', baseUrlHint: 'https://{resource}.openai.azure.com' },
];

export const ProvidersTab: React.FC = () => {
  const { t } = useI18n();
  const { providers, activeProviderId, updateProvider, addProvider, removeProvider, setActiveProvider } =
    useProviderStore(
      useShallow((s) => ({
        providers: s.providers,
        activeProviderId: s.activeProviderId,
        updateProvider: s.updateProvider,
        addProvider: s.addProvider,
        removeProvider: s.removeProvider,
        setActiveProvider: s.setActiveProvider,
      })),
    );

  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<{ name: string; type: Provider['type']; apiKey: string; baseUrl: string }>(
    { name: '', type: 'anthropic', apiKey: '', baseUrl: '' },
  );

  const handleAdd = () => {
    if (!draft.name.trim()) return;
    const id = `${draft.type}-${Date.now()}`;
    addProvider({
      id,
      name: draft.name.trim(),
      type: draft.type,
      isActive: true,
      models: [],
      apiKey: draft.apiKey || undefined,
      baseUrl: draft.baseUrl || undefined,
    });
    setDraft({ name: '', type: 'anthropic', apiKey: '', baseUrl: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[18px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
            {t('settings.tabProviders')}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--pd-color-fg-muted)]">
            配置 API Key / Base URL；激活哪个 provider，对话就用它。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className={cn(
            'h-8 px-3 rounded-[8px] inline-flex items-center gap-1.5',
            'bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent,#fff)]',
            'text-[13px] font-[var(--pd-font-medium)]',
            'hover:bg-[var(--pd-color-accent-hover,var(--pd-color-accent))] cursor-pointer',
          )}
        >
          <Plus size={14} />
          <span>新增 Provider</span>
        </button>
      </div>

      {showAdd && (
        <div className="rounded-[12px] border border-[var(--pd-color-border)] bg-[var(--pd-color-bg-subtle)] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-[var(--pd-color-fg-muted)] mb-1">名称</label>
              <PdInput
                value={draft.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, name: e.target.value })}
                placeholder="My Anthropic"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--pd-color-fg-muted)] mb-1">类型</label>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as Provider['type'] })}
                className="w-full h-8 px-2 rounded-[6px] border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)] text-[13px] text-[var(--pd-color-fg)]"
              >
                {PROVIDER_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] text-[var(--pd-color-fg-muted)] mb-1">API Key</label>
            <PdInput
              type="password"
              value={draft.apiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, apiKey: e.target.value })}
              placeholder="sk-ant-..."
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label className="block text-[12px] text-[var(--pd-color-fg-muted)] mb-1">Base URL（可选）</label>
            <PdInput
              value={draft.baseUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, baseUrl: e.target.value })}
              placeholder={PROVIDER_TYPE_OPTIONS.find((o) => o.value === draft.type)?.baseUrlHint ?? ''}
              style={{ width: '100%' }}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draft.name.trim()}
              className="h-8 px-3 rounded-[6px] bg-[var(--pd-color-accent)] text-white text-[13px] font-medium disabled:opacity-40 cursor-pointer"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="h-8 px-3 rounded-[6px] text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] text-[13px] cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(providers ?? []).map((p) => {
          const typeOpt = PROVIDER_TYPE_OPTIONS.find((o) => o.value === p.type);
          const isCurrentActive = p.id === activeProviderId;
          return (
            <div
              key={p.id}
              className={cn(
                'rounded-[12px] border p-4 transition-colors',
                isCurrentActive
                  ? 'border-[var(--pd-color-accent)] bg-[var(--pd-color-bg-subtle)]'
                  : 'border-[var(--pd-color-border)] bg-[var(--pd-color-bg-elevated)]',
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
                      {p.name}
                    </span>
                    {isCurrentActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--pd-color-accent)]">
                        <Check size={12} />
                        使用中
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--pd-color-fg-subtle)] mt-0.5">
                    {typeOpt?.label ?? p.type}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isCurrentActive && (
                    <button
                      type="button"
                      onClick={() => setActiveProvider(p.id)}
                      className="text-[12px] text-[var(--pd-color-accent)] hover:underline cursor-pointer"
                    >
                      设为使用中
                    </button>
                  )}
                  {providers.length > 1 && (
                    <button
                      type="button"
                      aria-label="删除"
                      onClick={() => removeProvider(p.id)}
                      className="h-7 w-7 rounded-[6px] flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-error,#BA1A1A)] cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <SettingRow label="API Key" description={t('settings.apiKeyPlaceholder') as string}>
                <PdInput
                  type="password"
                  value={p.apiKey ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateProvider(p.id, { apiKey: e.target.value })
                  }
                  placeholder="sk-..."
                  style={{ width: 260 }}
                />
              </SettingRow>
              <SettingRow label="Base URL" description={typeOpt?.baseUrlHint ?? ''}>
                <PdInput
                  value={p.baseUrl ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateProvider(p.id, { baseUrl: e.target.value })
                  }
                  placeholder={typeOpt?.baseUrlHint ?? ''}
                  style={{ width: 260 }}
                />
              </SettingRow>
            </div>
          );
        })}
        {(!providers || providers.length === 0) && (
          <div className="text-center py-10 text-[13px] text-[var(--pd-color-fg-muted)]">
            {t('settings.noProviders')}
          </div>
        )}
      </div>
    </div>
  );
};
