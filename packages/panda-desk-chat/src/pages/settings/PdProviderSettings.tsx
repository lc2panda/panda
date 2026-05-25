// Input: providerStore (CRUD/test/activate + CLI provider snapshot) + settingsStore.fetchAll
// Output: provider list (CLI synced official + saved) + Add/Edit Modal with preset chips, models mapping, settings.json textarea
// Pos: Settings tab — first entry, also exports ProviderFormModal
//
// Source 1:1: cc-haha desktop/src/pages/Settings.tsx L100-L670 (ProviderSettings + ProviderFormModal)
//   - cc-haha providerStore action surface 完整缺失 → 这里以 panda providerStore 形态复用，
//     缺失的 CRUD/test 调用走 stub TODO（panda 无对应后端）。
//   - 视觉/className/字段顺序 1:1 cc-haha；color token --color-* → --pd-color-*。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { PdButton } from '../../components/shared/PdButton';
import { PdInput } from '../../components/shared/PdInput';
import { PdModal } from '../../components/shared/PdModal';
import { PdConfirmDialog } from '../../components/shared/PdConfirmDialog';
import {
  useProviderStore,
  type Provider,
} from '../../stores/providerStore';
import { useSettingsStore } from '../../stores/settingsStore';

type ProviderTestResult = {
  connectivity: { success: boolean; latencyMs: number; error?: string };
  proxy?: { success: boolean; latencyMs: number; error?: string };
};

type ApiFormat = 'anthropic' | 'openai_chat' | 'openai_responses';
type ModelMapping = { main: string; haiku: string; sonnet: string; opus: string };

type SavedProvider = Provider & {
  presetId?: string;
  apiFormat?: ApiFormat;
  models: Provider['models']; // tagged: panda Provider.models is ModelInfo[] but UI iterates main/haiku/sonnet/opus
  baseUrl?: string;
  notes?: string;
};

type ProviderPreset = {
  id: string;
  name: string;
  baseUrl: string;
  apiFormat: ApiFormat;
  defaultModels: ModelMapping;
  needsApiKey: boolean;
  websiteUrl?: string;
};

// cc-haha 提供 4 个常用 preset（panda providerStore 暂无 presets 端点，本地写死）。
const FALLBACK_PRESETS: ProviderPreset[] = [
  {
    id: 'official',
    name: 'Claude Official',
    baseUrl: 'https://api.anthropic.com',
    apiFormat: 'anthropic',
    defaultModels: { main: 'claude-opus-4-7', haiku: '', sonnet: '', opus: '' },
    needsApiKey: true,
  },
  {
    id: 'openai-compat',
    name: 'OpenAI Compatible',
    baseUrl: 'https://api.openai.com/v1',
    apiFormat: 'openai_chat',
    defaultModels: { main: 'gpt-4o', haiku: '', sonnet: '', opus: '' },
    needsApiKey: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiFormat: 'openai_chat',
    defaultModels: {
      main: 'anthropic/claude-opus-4',
      haiku: '',
      sonnet: '',
      opus: '',
    },
    needsApiKey: true,
  },
  {
    id: 'custom',
    name: 'Custom',
    baseUrl: '',
    apiFormat: 'anthropic',
    defaultModels: { main: '', haiku: '', sonnet: '', opus: '' },
    needsApiKey: true,
  },
];

function modelsToMapping(models: Provider['models']): ModelMapping {
  // panda Provider.models 是 ModelInfo[]，cc-haha UI 期望 { main/haiku/sonnet/opus }
  // 取前 4 个 id 拍平成映射；不存在的留空。
  const main = models[0]?.id ?? '';
  const sonnet = models.find((m) => /sonnet/i.test(m.id))?.id ?? '';
  const opus = models.find((m) => /opus/i.test(m.id))?.id ?? '';
  const haiku = models.find((m) => /haiku/i.test(m.id))?.id ?? '';
  return { main, haiku, sonnet, opus };
}

export function PdProviderSettings() {
  const providers = useProviderStore((s) => s.providers);
  const activeProviderId = useProviderStore((s) => s.activeProviderId);
  const cliSnapshot = useProviderStore((s) => s.cliSnapshot);
  const syncCliSnapshot = useProviderStore((s) => s.syncCliSnapshot);
  const setActiveProvider = useProviderStore((s) => s.setActiveProvider);
  const removeProvider = useProviderStore((s) => s.removeProvider);
  const fetchSettings = useSettingsStore((s) => s.fetchAll);

  const [editingProvider, setEditingProvider] = useState<SavedProvider | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingDeleteProvider, setPendingDeleteProvider] =
    useState<SavedProvider | null>(null);
  const [isDeletingProvider, setIsDeletingProvider] = useState(false);
  const [testResults, setTestResults] = useState<
    Record<string, { loading: boolean; result?: ProviderTestResult }>
  >({});

  // panda providerStore 已经初始化过；这里调一次 fetchSettings 同步 model 列表
  useEffect(() => {
    void syncCliSnapshot();
    void fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presets = FALLBACK_PRESETS;
  const presetMap = useMemo(
    () => new Map(presets.map((preset) => [preset.id, preset])),
    [presets],
  );

  const handleDelete = (provider: SavedProvider) => {
    if (activeProviderId === provider.id) return;
    setPendingDeleteProvider(provider);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteProvider) return;
    setIsDeletingProvider(true);
    try {
      removeProvider(pendingDeleteProvider.id);
      setPendingDeleteProvider(null);
    } finally {
      setIsDeletingProvider(false);
    }
  };

  // TODO(IPC): panda 无 testProvider 后端；本地直接返回成功，加 latency=0 占位。
  const handleTest = async (provider: SavedProvider) => {
    setTestResults((r) => ({ ...r, [provider.id]: { loading: true } }));
    await new Promise((res) => setTimeout(res, 300));
    setTestResults((r) => ({
      ...r,
      [provider.id]: {
        loading: false,
        result: {
          connectivity: {
            success: true,
            latencyMs: 0,
            error: t('settings.providers.requestFailed'),
          },
        },
      },
    }));
  };

  const handleActivate = async (id: string) => {
    setActiveProvider(id);
    await fetchSettings();
  };

  const handleActivateOfficial = async () => {
    // panda providers 中以 'anthropic' 作为官方
    const official = providers.find((p) => p.type === 'anthropic');
    if (official) {
      setActiveProvider(official.id);
    }
    await fetchSettings();
  };

  const isOfficialActive = (() => {
    const active = providers.find((p) => p.id === activeProviderId);
    return active?.type === 'anthropic' && active.id === 'anthropic';
  })();

  // 过滤掉 official，剩下视为 saved providers
  const savedProviders: SavedProvider[] = providers
    .filter((p) => !(p.type === 'anthropic' && p.id === 'anthropic'))
    .map((p) => ({
      ...p,
      presetId: p.type,
      apiFormat: p.type === 'openai' || p.type === 'openrouter' ? 'openai_chat' : 'anthropic',
      models: p.models,
      baseUrl: p.baseUrl,
    }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)]">{t('settings.providers.title')}</h2>
          <p className="text-sm text-[var(--pd-color-text-tertiary)] mt-0.5">{t('settings.providers.description')}</p>
        </div>
        <PdButton size="sm" onClick={() => setShowCreateModal(true)}>
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">add</span>
          {t('settings.providers.addProvider')}
        </PdButton>
      </div>

      {cliSnapshot && (
        <div className="mb-3 rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[var(--pd-color-text-primary)]">
                CLI 当前服务商：{cliSnapshot.activeProviderName}
              </div>
              <div className="mt-1 text-[11px] text-[var(--pd-color-text-tertiary)]">
                {cliSnapshot.baseUrl} · {cliSnapshot.currentModel}
              </div>
            </div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
              cliSnapshot.auth.configured
                ? 'bg-[var(--pd-color-success)]/12 text-[var(--pd-color-success)]'
                : 'bg-[var(--pd-color-warning)]/12 text-[var(--pd-color-warning)]'
            }`}>
              {cliSnapshot.auth.configured ? `已认证 · ${cliSnapshot.auth.method}` : '未检测到认证'}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-[var(--pd-color-text-tertiary)]">
            <div>settings.json：{cliSnapshot.sources.settingsJson.exists ? cliSnapshot.sources.settingsJson.path : '未找到'}</div>
            <div>.pandacc.json：{cliSnapshot.sources.globalConfig.exists ? cliSnapshot.sources.globalConfig.path : '未找到'}</div>
            <div>
              配置来源：
              {[
                ...cliSnapshot.sources.processEnvKeys.map((key) => `process.env:${key}`),
                ...cliSnapshot.sources.settingsJson.envKeys.map((key) => `settings.json:${key}`),
                cliSnapshot.sources.globalConfig.hasThirdPartyProvider ? 'auth login:thirdPartyProvider' : '',
                cliSnapshot.sources.globalConfig.hasOAuthAccount ? 'auth login:oauthAccount' : '',
              ].filter(Boolean).join(' / ') || '无'}
            </div>
          </div>
        </div>
      )}

      {/* Official provider — always visible at top */}
      <div
        className={`relative flex flex-col rounded-xl border transition-all mb-2 ${
          isOfficialActive
            ? 'border-[var(--pd-color-brand)] bg-[var(--pd-color-surface-container)] shadow-[var(--pd-shadow-focus-ring)]'
            : 'border-[var(--pd-color-border)] hover:border-[var(--pd-color-border-focus)] cursor-pointer'
        }`}
      >
        <div
          className="flex items-center gap-4 px-4 py-3.5"
          onClick={() => !isOfficialActive && handleActivateOfficial()}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              isOfficialActive
                ? 'bg-[var(--pd-color-success)]'
                : 'bg-[var(--pd-color-text-tertiary)]'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                {t('settings.providers.officialName')}
              </span>
              {isOfficialActive && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border border-[var(--pd-color-brand)]/18 bg-[var(--pd-color-brand)]/14 text-[var(--pd-color-brand)] leading-none">
                  {t('settings.providers.default')}
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--pd-color-text-tertiary)] mt-0.5">
              {t('settings.providers.officialDesc')}
            </div>
          </div>
        </div>

        {isOfficialActive && (
          <div className="px-4 pb-4 pt-3 border-t border-[var(--pd-color-border-separator)]">
            <ClaudeOfficialLogin />
          </div>
        )}
      </div>

      {/* Saved providers */}
      <div className="flex flex-col gap-2">
        {savedProviders.map((provider) => {
          const isActive = activeProviderId === provider.id;
          const test = testResults[provider.id];
          const preset = presetMap.get(provider.presetId ?? '');
          const mapping = modelsToMapping(provider.models);
          return (
            <div
              key={provider.id}
              className={`relative flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all group ${
                isActive
                  ? 'border-[var(--pd-color-brand)] bg-[var(--pd-color-surface-container)] shadow-[var(--pd-shadow-focus-ring)]'
                  : 'border-[var(--pd-color-border)] hover:border-[var(--pd-color-border-focus)]'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isActive
                    ? 'bg-[var(--pd-color-success)]'
                    : 'bg-[var(--pd-color-text-tertiary)]'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--pd-color-text-primary)] truncate">
                    {provider.name}
                  </span>
                  {preset && preset.id !== 'custom' && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--pd-color-surface-container-high)] text-[var(--pd-color-text-tertiary)] leading-none">
                      {preset.name}
                    </span>
                  )}
                  {provider.apiFormat && provider.apiFormat !== 'anthropic' && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--pd-color-surface-container-high)] text-[var(--pd-color-warning)] leading-none">
                      {provider.apiFormat === 'openai_chat'
                        ? 'OpenAI Chat'
                        : 'OpenAI Responses'}
                    </span>
                  )}
                  {isActive && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border border-[var(--pd-color-brand)]/18 bg-[var(--pd-color-brand)]/14 text-[var(--pd-color-brand)] leading-none">
                      {t('settings.providers.default')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--pd-color-text-tertiary)] truncate mt-0.5">
                  {provider.baseUrl} &middot; {mapping.main || '—'}
                </div>
                {test && !test.loading && test.result && (
                  <div className="text-xs mt-1 flex flex-col gap-0.5">
                    <span
                      className={
                        test.result.connectivity.success
                          ? 'text-[var(--pd-color-success)]'
                          : 'text-[var(--pd-color-error)]'
                      }
                    >
                      {test.result.connectivity.success
                        ? t('settings.providers.connectivityOk', {
                            latency: String(test.result.connectivity.latencyMs),
                          })
                        : t('settings.providers.connectivityFailed', {
                            error: test.result.connectivity.error || '',
                          })}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {!isActive && (
                  <PdButton variant="ghost" size="sm" onClick={() => handleActivate(provider.id)}>
                    {t('settings.providers.setDefault')}
                  </PdButton>
                )}
                <PdButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTest(provider)}
                  loading={test?.loading}
                >
                  {t('settings.providers.test')}
                </PdButton>
                <PdButton variant="ghost" size="sm" onClick={() => setEditingProvider(provider)}>
                  {t('settings.providers.edit')}
                </PdButton>
                {!isActive && (
                  <PdButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(provider)}
                    className="text-[var(--pd-color-error)] hover:text-[var(--pd-color-error)]"
                  >
                    {t('common.delete')}
                  </PdButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <ProviderFormModal
          open
          onClose={() => setShowCreateModal(false)}
          mode="create"
          presets={presets}
        />
      )}

      {/* Edit Modal */}
      {editingProvider && (
        <ProviderFormModal
          key={editingProvider.id}
          open
          onClose={() => setEditingProvider(null)}
          mode="edit"
          provider={editingProvider}
          presets={presets}
        />
      )}

      <PdConfirmDialog
        open={pendingDeleteProvider !== null}
        onClose={() => {
          if (isDeletingProvider) return;
          setPendingDeleteProvider(null);
        }}
        onConfirm={confirmDelete}
        title={t('common.delete')}
        body={
          pendingDeleteProvider
            ? t('settings.providers.confirmDelete', {
                name: pendingDeleteProvider.name,
              })
            : ''
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        confirmVariant="danger"
        loading={isDeletingProvider}
      />
    </div>
  );
}

// ─── Claude Official 认证状态 (panda 适配版) ────────────
//
// Comdr 指令 (W23B 任务 #4 — 服务商配置不可用根因修复，2026-05-06):
//   旧 ClaudeOfficialLogin 是 cc-haha 1:1 占位（disabled OAuth 按钮 + "Claude OAuth
//   not yet wired"），导致 Comdr 进设置-服务商看到 "登录 Claude 账号" 按钮永久灰禁，
//   误判为"配置不可用"。panda 实际认证模式不是 OAuth，而是：
//     1. 环境变量 ANTHROPIC_API_KEY (优先)
//     2. ~/.pandacc/settings.json 中的 token
//     3. panda CLI 终端运行 /login 走完整 OAuth 流程
//   本组件改为状态说明面板，明确告知用户当前认证方式，去掉 disabled 按钮，避免
//   "不可用"误导。

function ClaudeOfficialLogin() {
  const cliSnapshot = useProviderStore((s) => s.cliSnapshot);
  return (
    <div className="flex flex-col gap-2 text-sm">
      {cliSnapshot && (
        <div className="rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-lowest)] px-3 py-2 text-xs text-[var(--pd-color-text-secondary)]">
          <div>当前模型：{cliSnapshot.currentModel}</div>
          <div>Base URL：{cliSnapshot.baseUrl}</div>
          <div>
            认证状态：
            {cliSnapshot.auth.configured
              ? ` 已配置（${cliSnapshot.auth.method}${cliSnapshot.auth.account ? ` · ${cliSnapshot.auth.account}` : ''}）`
              : ' 未检测到'}
          </div>
        </div>
      )}
      <div className="text-[var(--pd-color-text-secondary)] leading-relaxed">
        Anthropic 官方服务商通过以下任一方式认证（按优先级）：
      </div>
      <ol className="ml-4 list-decimal text-xs text-[var(--pd-color-text-secondary)] space-y-1 leading-relaxed">
        <li>
          环境变量 <code className="rounded bg-[var(--pd-color-surface-container-high)] px-1 py-0.5 font-mono text-[11px]">ANTHROPIC_API_KEY</code>
        </li>
        <li>
          配置文件 <code className="rounded bg-[var(--pd-color-surface-container-high)] px-1 py-0.5 font-mono text-[11px]">~/.pandacc/settings.json</code>
        </li>
        <li>
          在 panda 终端运行 <code className="rounded bg-[var(--pd-color-surface-container-high)] px-1 py-0.5 font-mono text-[11px]">/login</code> 触发浏览器 OAuth
        </li>
      </ol>
      <div className="text-[11px] text-[var(--pd-color-text-tertiary)] leading-relaxed">
        如需切换账号或重新登录：可在任何会话的输入框输入 <code className="rounded bg-[var(--pd-color-surface-container-high)] px-1 font-mono text-[10px]">/login</code> 然后回车，panda CLI 会处理 OAuth 流程。
      </div>
    </div>
  );
}

// ─── Provider Form Modal — cc-haha L347-L670 ────────────────────────────────

type ProviderFormProps = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  provider?: SavedProvider;
  presets: ProviderPreset[];
};

function requirePreset(preset: ProviderPreset | undefined): ProviderPreset {
  if (!preset) throw new Error('Provider presets are not configured');
  return preset;
}

function buildFallbackPreset(provider?: SavedProvider): ProviderPreset {
  return {
    id: provider?.presetId ?? 'custom',
    name: provider?.name ?? 'Custom',
    baseUrl: provider?.baseUrl ?? '',
    apiFormat: provider?.apiFormat ?? 'anthropic',
    defaultModels: provider ? modelsToMapping(provider.models) : { main: '', haiku: '', sonnet: '', opus: '' },
    needsApiKey: true,
    websiteUrl: '',
  };
}

function ProviderFormModal({ open, onClose, mode, provider, presets }: ProviderFormProps) {
  const updateProvider = useProviderStore((s) => s.updateProvider);
  const addProvider = useProviderStore((s) => s.addProvider);

  const availablePresets = presets.filter((p) => p.id !== 'official');
  const fallbackPreset = provider
    ? buildFallbackPreset(provider)
    : requirePreset(availablePresets[availablePresets.length - 1]);
  const initialPreset = requirePreset(
    provider
      ? availablePresets.find((p) => p.id === provider.presetId) ?? fallbackPreset
      : availablePresets[0] ?? fallbackPreset,
  );

  const [selectedPreset, setSelectedPreset] = useState<ProviderPreset>(initialPreset);
  const [name, setName] = useState(provider?.name ?? initialPreset.name);
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl ?? initialPreset.baseUrl);
  const [apiFormat, setApiFormat] = useState<ApiFormat>(provider?.apiFormat ?? initialPreset.apiFormat ?? 'anthropic');
  const [apiKey, setApiKey] = useState('');
  const [notes, setNotes] = useState(provider?.notes ?? '');
  const [models, setModels] = useState<ModelMapping>(
    provider ? modelsToMapping(provider.models) : { ...initialPreset.defaultModels },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<ProviderTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [settingsJson, setSettingsJson] = useState('');
  const [settingsJsonError, setSettingsJsonError] = useState<string | null>(null);
  const jsonPastedRef = useRef(false);

  // Build initial settings.json preview
  useEffect(() => {
    if (jsonPastedRef.current) {
      jsonPastedRef.current = false;
      return;
    }
    const needsProxy = apiFormat !== 'anthropic';
    const merged = {
      env: {
        ANTHROPIC_BASE_URL: needsProxy ? 'http://127.0.0.1:3456/proxy' : baseUrl,
        ANTHROPIC_AUTH_TOKEN: needsProxy ? 'proxy-managed' : apiKey || '(your API key)',
        ANTHROPIC_MODEL: models.main,
        ANTHROPIC_DEFAULT_HAIKU_MODEL: models.haiku,
        ANTHROPIC_DEFAULT_SONNET_MODEL: models.sonnet,
        ANTHROPIC_DEFAULT_OPUS_MODEL: models.opus,
      },
    };
    setSettingsJson(JSON.stringify(merged, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset.id]);

  const handlePresetChange = (preset: ProviderPreset) => {
    setSelectedPreset(preset);
    setName(preset.name);
    setBaseUrl(preset.baseUrl);
    setApiFormat(preset.apiFormat ?? 'anthropic');
    setModels({ ...preset.defaultModels });
    setTestResult(null);
  };

  const isCustom = selectedPreset.id === 'custom';
  const canSubmit =
    !!name.trim() &&
    !!baseUrl.trim() &&
    (mode === 'edit' || !!apiKey.trim()) &&
    !!models.main.trim() &&
    !settingsJsonError;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const id = `${selectedPreset.id}-${Date.now()}`;
        const type: Provider['type'] = apiFormat === 'anthropic' ? 'anthropic' : 'openai';
        addProvider({
          id,
          name: name.trim(),
          type,
          isActive: true,
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim() || undefined,
          models: [
            {
              id: models.main,
              name: models.main,
              provider: type,
              maxTokens: 64_000,
              supportsVision: true,
              supportsThinking: true,
            },
          ],
        });
      } else if (provider) {
        const patch: Partial<Provider> = {
          name: name.trim(),
          baseUrl: baseUrl.trim(),
        };
        if (apiKey.trim()) patch.apiKey = apiKey.trim();
        updateProvider(provider.id, patch);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO(IPC): panda 无 testConfig；返回 success 占位。
  const handleTest = async () => {
    if (!baseUrl.trim() || !models.main.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    await new Promise((res) => setTimeout(res, 300));
    setTestResult({ connectivity: { success: true, latencyMs: 0 } });
    setIsTesting(false);
  };

  return (
    <PdModal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? t('settings.providers.addTitle') : t('settings.providers.editTitle')}
      width={720}
      footer={
        <>
          <PdButton variant="secondary" onClick={onClose}>{t('common.cancel')}</PdButton>
          <PdButton onClick={handleSubmit} disabled={!canSubmit} loading={isSubmitting}>
            {mode === 'create' ? t('common.add') : t('common.save')}
          </PdButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Preset chips */}
        {mode === 'create' && (
          <div>
            <label className="text-sm font-medium text-[var(--pd-color-text-primary)] mb-2 block">
              {t('settings.providers.preset')}
            </label>
            <div className="flex flex-wrap gap-2">
              {availablePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    selectedPreset.id === preset.id
                      ? 'border-[var(--pd-color-brand)] bg-[var(--pd-color-surface-container-high)] text-[var(--pd-color-brand)] shadow-[var(--pd-shadow-focus-ring)]'
                      : 'border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] hover:border-[var(--pd-color-border-focus)] hover:bg-[var(--pd-color-surface-hover)]'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <PdInput
          label={t('settings.providers.name')}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('settings.providers.namePlaceholder')}
        />

        <PdInput
          label={t('settings.providers.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('settings.providers.notesPlaceholder')}
        />

        {/* Base URL */}
        {isCustom || mode === 'edit' ? (
          <PdInput
            label={t('settings.providers.baseUrl')}
            required
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={t('settings.providers.baseUrlPlaceholder')}
          />
        ) : (
          <div>
            <label className="text-sm font-medium text-[var(--pd-color-text-primary)] mb-1 block">
              {t('settings.providers.baseUrl')}
            </label>
            <div className="text-xs text-[var(--pd-color-text-tertiary)] px-3 py-2 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-surface-container-low)] border border-[var(--pd-color-border)]">
              {baseUrl}
            </div>
          </div>
        )}

        {/* API Format */}
        {(isCustom || mode === 'edit') ? (
          <div>
            <label className="text-sm font-medium text-[var(--pd-color-text-primary)] mb-1 block">
              {t('settings.providers.apiFormat')}
            </label>
            <select
              value={apiFormat}
              onChange={(e) => setApiFormat(e.target.value as ApiFormat)}
              className="w-full text-sm px-3 py-2 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-surface-container-low)] border border-[var(--pd-color-border)] text-[var(--pd-color-text-primary)] outline-none focus:border-[var(--pd-color-border-focus)]"
            >
              <option value="anthropic">{t('settings.providers.apiFormatAnthropic')}</option>
              <option value="openai_chat">{t('settings.providers.apiFormatOpenaiChat')}</option>
              <option value="openai_responses">{t('settings.providers.apiFormatOpenaiResponses')}</option>
            </select>
            {apiFormat !== 'anthropic' && (
              <p className="text-[11px] text-[var(--pd-color-text-tertiary)] mt-1">{t('settings.providers.proxyHint')}</p>
            )}
          </div>
        ) : null}

        <PdInput
          label={mode === 'edit' ? t('settings.providers.apiKeyKeep') : t('settings.providers.apiKey')}
          required={mode === 'create'}
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={mode === 'edit' ? '****' : 'sk-...'}
        />

        {/* Model Mapping */}
        <div>
          <label className="text-sm font-medium text-[var(--pd-color-text-primary)] mb-2 block">
            {t('settings.providers.modelMapping')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <PdInput
              label={t('settings.providers.mainModel')}
              required
              value={models.main}
              onChange={(e) => setModels({ ...models, main: e.target.value })}
              placeholder="Model ID"
            />
            <PdInput
              label={t('settings.providers.haikuModel')}
              value={models.haiku}
              onChange={(e) => setModels({ ...models, haiku: e.target.value })}
              placeholder={t('settings.providers.sameAsMain')}
            />
            <PdInput
              label={t('settings.providers.sonnetModel')}
              value={models.sonnet}
              onChange={(e) => setModels({ ...models, sonnet: e.target.value })}
              placeholder={t('settings.providers.sameAsMain')}
            />
            <PdInput
              label={t('settings.providers.opusModel')}
              value={models.opus}
              onChange={(e) => setModels({ ...models, opus: e.target.value })}
              placeholder={t('settings.providers.sameAsMain')}
            />
          </div>
        </div>

        {/* Test connection */}
        <div className="flex items-center gap-3">
          <PdButton
            variant="secondary"
            size="sm"
            onClick={handleTest}
            loading={isTesting}
            disabled={!baseUrl.trim() || !models.main.trim()}
          >
            {t('settings.providers.testConnection')}
          </PdButton>
          {testResult && (
            <div className="flex flex-col gap-0.5">
              <span
                className={`text-xs ${
                  testResult.connectivity.success
                    ? 'text-[var(--pd-color-success)]'
                    : 'text-[var(--pd-color-error)]'
                }`}
              >
                {testResult.connectivity.success
                  ? t('settings.providers.connectivityOk', {
                      latency: String(testResult.connectivity.latencyMs),
                    })
                  : t('settings.providers.connectivityFailed', {
                      error: testResult.connectivity.error || '',
                    })}
              </span>
            </div>
          )}
        </div>

        {/* Settings JSON */}
        <div>
          <label className="text-sm font-medium text-[var(--pd-color-text-primary)] mb-2 block">
            {t('settings.providers.settingsJson')}
          </label>
          <textarea
            value={settingsJson}
            onChange={(e) => {
              const raw = e.target.value;
              setSettingsJson(raw);
              try {
                JSON.parse(raw);
                setSettingsJsonError(null);
              } catch (err) {
                setSettingsJsonError(err instanceof Error ? err.message : 'Invalid JSON');
              }
            }}
            rows={16}
            spellCheck={false}
            className={`w-full text-xs px-3 py-3 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-surface-container-low)] border font-mono leading-relaxed resize-y text-[var(--pd-color-text-secondary)] outline-none ${
              settingsJsonError
                ? 'border-[var(--pd-color-error)] focus:border-[var(--pd-color-error)]'
                : 'border-[var(--pd-color-border)] focus:border-[var(--pd-color-border-focus)]'
            }`}
          />
          {settingsJsonError && (
            <p className="text-[11px] text-[var(--pd-color-error)] mt-1">
              {t('settings.providers.jsonError', { error: settingsJsonError })}
            </p>
          )}
          <p className="text-[11px] text-[var(--pd-color-text-tertiary)] mt-1">
            {t('settings.providers.settingsJsonDesc')}
          </p>
        </div>
      </div>
    </PdModal>
  );
}
