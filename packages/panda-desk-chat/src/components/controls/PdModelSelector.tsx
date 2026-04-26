// Input: optional value/onChange (controlled) + runtimeKey (per-session)
// Output: pill-trigger + dropdown listing models by provider with effort grid
// Pos: Controls layer — composer-row model picker
//
// Source 1:1: cc-haha desktop/src/components/controls/ModelSelector.tsx (L1-L395)
//   - cc-haha constants/modelCatalog (OFFICIAL_DEFAULT_MODEL_ID/OFFICIAL_MODELS) → panda 暂无；
//     用 settingsStore.availableModels 派生即可；
//   - cc-haha types/runtime (RuntimeSelection) → panda 内联类型定义；
//   - cc-haha types/provider (SavedProvider) → panda providerStore.Provider 字段不同
//     （provider.models[] 已是 ModelInfo[]，不需 main/haiku/sonnet/opus 角色拆分）；
//   - cc-haha sessionRuntimeStore + DRAFT_RUNTIME_SELECTION_KEY → panda 暂无；
//     runtimeKey 模式降级为 controlled 模式；
//   - cc-haha chatStore.setSessionRuntime → panda 暂无；
//   - cc-haha useTranslation hook → panda t() 函数（同义）。

import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useProviderStore } from '../../stores/providerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { EffortLevel, ModelInfo } from '../../types/settings';

type ProviderChoice = {
  providerId: string | null;
  providerName: string;
  isDefault: boolean;
  models: ModelInfo[];
};

type Props = {
  value?: string;
  onChange?: (modelId: string) => void;
  runtimeKey?: string;
  disabled?: boolean;
};

function buildProviderChoices(
  providers: ReturnType<typeof useProviderStore.getState>['providers'],
  activeProviderId: string | null,
  fallbackOfficialModels: ModelInfo[],
  officialName: string,
): ProviderChoice[] {
  const fromProviders: ProviderChoice[] = providers.map((provider) => {
    const models: ModelInfo[] = (provider.models ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      description: m.tags?.join(' · ') ?? undefined,
    }));
    return {
      providerId: provider.id,
      providerName: provider.name,
      isDefault: activeProviderId === provider.id,
      // 若该 provider 是当前活跃但 models 为空，回退到 official models
      models: models.length > 0 ? models : (provider.id === activeProviderId ? fallbackOfficialModels : []),
    };
  });
  if (fromProviders.length === 0) {
    fromProviders.push({
      providerId: null,
      providerName: officialName,
      isDefault: true,
      models: fallbackOfficialModels,
    });
  }
  return fromProviders;
}

export function PdModelSelector({
  value,
  onChange,
  runtimeKey,
  disabled = false,
}: Props = {}) {
  const {
    currentModel: storeModel,
    availableModels,
    effortLevel,
    activeProviderName,
    setModel,
    setEffort,
  } = useSettingsStore();
  const {
    providers,
    activeProviderId,
  } = useProviderStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const EFFORT_OPTIONS: { value: EffortLevel; label: string }[] = [
    { value: 'low', label: t('settings.general.effort.low') },
    { value: 'medium', label: t('settings.general.effort.medium') },
    { value: 'high', label: t('settings.general.effort.high') },
    { value: 'max', label: t('settings.general.effort.max') },
  ];

  const isControlled = value !== undefined;
  // panda 暂无 sessionRuntimeStore；runtimeKey 模式视作 controlled 模式占位渲染。
  const isRuntimeScoped = !isControlled && runtimeKey !== undefined;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const providerChoices = useMemo(
    () => buildProviderChoices(
      providers,
      activeProviderId,
      availableModels,
      t('settings.providers.officialName'),
    ),
    [providers, activeProviderId, availableModels],
  );

  const selectedModel = isControlled
    ? availableModels.find((model) => model.id === value) || null
    : storeModel;

  const buttonModelLabel = selectedModel?.name ?? t('model.selectModel');
  const buttonProviderLabel = isRuntimeScoped
    ? activeProviderName ?? t('settings.providers.officialName')
    : null;

  const handleScopedSelect = (modelId: string) => {
    // panda 暂无 per-runtime 持久化；走全局 setModel。
    void setModel(modelId);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex max-w-[280px] items-center gap-2 rounded-full bg-[var(--pd-color-surface-container-low)] px-3 py-1.5 text-xs font-medium text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--pd-color-text-primary)]">
            {buttonModelLabel}
          </span>
          {buttonProviderLabel && (
            <span className="max-w-[108px] flex-shrink-0 truncate text-[11px] text-[var(--pd-color-text-tertiary)]">
              {buttonProviderLabel}
            </span>
          )}
        </div>
        <span className="material-symbols-outlined flex-shrink-0 text-[12px]">expand_more</span>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full z-50 mb-2 w-[360px] rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-lowest)] shadow-[var(--pd-shadow-dropdown)]">
          <div className="max-h-[420px] overflow-y-auto p-3">
            <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-[var(--pd-color-outline)]">
              {t('model.configuration')}
            </div>

            {isRuntimeScoped ? (
              <div className="space-y-3">
                {providerChoices.map((choice) => (
                  <div key={choice.providerId ?? 'official'} className="space-y-1.5">
                    <div className="flex items-center justify-between px-2 pt-1">
                      <span className="truncate text-[11px] font-semibold tracking-[0.01em] text-[var(--pd-color-text-secondary)]">
                        {choice.providerName}
                      </span>
                      {choice.isDefault && (
                        <span className="flex-shrink-0 text-[10px] font-medium text-[var(--pd-color-text-tertiary)]">
                          {t('settings.providers.default')}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {choice.models.map((model) => {
                        const isSelected = model.id === storeModel?.id;
                        return (
                          <button
                            key={`${choice.providerId ?? 'official'}:${model.id}`}
                            onClick={() => handleScopedSelect(model.id)}
                            className={`
                              w-full rounded-lg border px-3 py-2.5 text-left transition-colors
                              ${isSelected
                                ? 'border-[var(--pd-color-brand)]/20 bg-[var(--pd-color-primary-fixed)]'
                                : 'border-transparent hover:bg-[var(--pd-color-surface-hover)]'
                              }
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                                isSelected ? 'border-[var(--pd-color-brand)]' : 'border-[var(--pd-color-outline)]'
                              }`}>
                                {isSelected && (
                                  <div className="h-2 w-2 rounded-full bg-[var(--pd-color-brand)]" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-[var(--pd-color-text-primary)]">
                                  {model.name}
                                </div>
                                {model.description && (
                                  <div className="mt-0.5 truncate pr-[6px] text-[10px] text-[var(--pd-color-text-tertiary)]">
                                    {model.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {availableModels.map((model) => {
                  const isSelected = model.id === selectedModel?.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        if (isControlled) {
                          onChange?.(model.id);
                        } else {
                          void setModel(model.id);
                        }
                        setOpen(false);
                      }}
                      className={`
                        w-full rounded-lg px-3 py-2.5 text-left transition-colors
                        ${isSelected
                          ? 'bg-[var(--pd-color-primary-fixed)] border border-[var(--pd-color-brand)]/20'
                          : 'hover:bg-[var(--pd-color-surface-hover)]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                          isSelected ? 'border-[var(--pd-color-brand)]' : 'border-[var(--pd-color-outline)]'
                        }`}>
                          {isSelected && (
                            <div className="h-2 w-2 rounded-full bg-[var(--pd-color-brand)]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">{model.name}</div>
                          {model.description && (
                            <div className="mt-0.5 truncate text-[10px] text-[var(--pd-color-text-tertiary)]">
                              {model.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!isControlled && !isRuntimeScoped && (
            <div className="border-t border-[var(--pd-color-border)] p-3">
              <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-[var(--pd-color-outline)]">
                {t('model.effort')}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {EFFORT_OPTIONS.map((opt) => {
                  const isSelected = opt.value === effortLevel;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        void setEffort(opt.value);
                        setOpen(false);
                      }}
                      className={`
                        rounded-lg py-2 text-center text-xs font-semibold transition-colors
                        ${isSelected
                          ? 'bg-[var(--pd-color-brand)] text-white'
                          : 'bg-[var(--pd-color-surface-container-high)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
