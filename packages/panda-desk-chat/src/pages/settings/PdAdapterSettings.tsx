// Input: adapterStore (config + pairing actions) · pandaAPI.adapter (start/stop/status)
// Output: Pairing card · Default project picker · Feishu/Telegram/Wechat tabs · Save button · Unbind dialog
// Pos: Settings tab — fourth entry (icon: chat)
//
// Source 1:1: cc-haha desktop/src/pages/AdapterSettings.tsx (404 行)
//   panda IPC 缺 adapterApi 全部端点 → adapterStore 走 localStorage stub。
//   className 严格 cc-haha；--color-* → --pd-color-*。
//   Comdr 指令: IM Wechat / 任务 A — 加 wechat tab 5 区块（插件状态/登录方式/配置/运行状态/使用说明）。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useCallback, useEffect, useState } from 'react';
import { t } from '../../i18n';
import { useAdapterStore } from '../../stores/adapterStore';
import { useUIStore } from '../../stores/uiStore';
import type { AdapterStatus, AdapterPlatform } from '../../ipc/types';
import { PdInput } from '../../components/shared/PdInput';
import { PdButton } from '../../components/shared/PdButton';
import { PdDirectoryPicker } from '../../components/shared/PdDirectoryPicker';
import { PdConfirmDialog } from '../../components/shared/PdConfirmDialog';

// Comdr 指令: IM Wechat — tabs 加 wechat
type ImTab = 'feishu' | 'telegram' | 'wechat';

export function PdAdapterSettings() {
  const config = useAdapterStore((s) => s.config);
  const isLoading = useAdapterStore((s) => s.isLoading);
  const fetchConfig = useAdapterStore((s) => s.fetchConfig);
  const updateConfig = useAdapterStore((s) => s.updateConfig);
  const generatePairingCode = useAdapterStore((s) => s.generatePairingCode);
  const removePairedUser = useAdapterStore((s) => s.removePairedUser);

  const [activeIm, setActiveIm] = useState<ImTab>('feishu');
  const [defaultProjectDir, setDefaultProjectDir] = useState('');

  // Telegram
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgAllowedUsers, setTgAllowedUsers] = useState('');

  // Feishu
  const [fsAppId, setFsAppId] = useState('');
  const [fsAppSecret, setFsAppSecret] = useState('');
  const [fsEncryptKey, setFsEncryptKey] = useState('');
  const [fsVerificationToken, setFsVerificationToken] = useState('');
  const [fsAllowedUsers, setFsAllowedUsers] = useState('');
  const [fsStreamingCard, setFsStreamingCard] = useState(false);

  // Comdr 指令: IM Wechat — wechat tab 表单字段
  const [wxLoginMode, setWxLoginMode] = useState<'qr' | 'bot-token'>('qr');
  const [wxBotToken, setWxBotToken] = useState('');
  const [wxWebhookUrl, setWxWebhookUrl] = useState('');
  const [wxDefaultSession, setWxDefaultSession] = useState('');

  // Comdr 指令: IM Wechat — 各平台运行状态（pid + installed + lastError）
  const [adapterStatus, setAdapterStatus] = useState<Record<ImTab, AdapterStatus | null>>({
    feishu: null,
    telegram: null,
    wechat: null,
  });
  const [adapterBusy, setAdapterBusy] = useState<Record<ImTab, boolean>>({
    feishu: false,
    telegram: false,
    wechat: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingUnbind, setPendingUnbind] = useState<{
    platform: 'telegram' | 'feishu' | 'wechat';
    userId: string | number;
  } | null>(null);
  const [isUnbinding, setIsUnbinding] = useState(false);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    setDefaultProjectDir(config.defaultProjectDir ?? '');
    setTgBotToken(config.telegram?.botToken ?? '');
    setTgAllowedUsers(config.telegram?.allowedUsers?.join(', ') ?? '');
    setFsAppId(config.feishu?.appId ?? '');
    setFsAppSecret(config.feishu?.appSecret ?? '');
    setFsEncryptKey(config.feishu?.encryptKey ?? '');
    setFsVerificationToken(config.feishu?.verificationToken ?? '');
    setFsAllowedUsers(config.feishu?.allowedUsers?.join(', ') ?? '');
    setFsStreamingCard(config.feishu?.streamingCard ?? false);
    // Comdr 指令: IM Wechat — wechat 字段回填
    setWxLoginMode(config.wechat?.loginMode ?? 'qr');
    setWxBotToken(config.wechat?.botToken ?? '');
    setWxWebhookUrl(config.wechat?.webhookUrl ?? '');
    setWxDefaultSession(config.wechat?.defaultSession ?? '');
  }, [config]);

  // Comdr 指令: IM Wechat — 进入页面时拉一次状态，每 5s 轮询当前 active tab
  const refreshAdapterStatus = useCallback(async (platform: ImTab) => {
    const api = (typeof window !== 'undefined' ? window.pandaAPI : undefined);
    if (!api?.adapter) return;
    try {
      const s = await api.adapter.status(platform);
      setAdapterStatus((prev) => ({ ...prev, [platform]: s }));
    } catch (err) {
      // 失败保留旧值；不打扰用户
    }
  }, []);

  useEffect(() => {
    void refreshAdapterStatus(activeIm);
    const tid = setInterval(() => void refreshAdapterStatus(activeIm), 5000);
    return () => clearInterval(tid);
  }, [activeIm, refreshAdapterStatus]);

  async function handleSave() {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveError('');
    try {
      const tgUsers = tgAllowedUsers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !Number.isNaN(n));

      const fsUsers = fsAllowedUsers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateConfig({
        defaultProjectDir: defaultProjectDir || undefined,
        telegram: {
          botToken: tgBotToken || undefined,
          allowedUsers: tgUsers,
        },
        feishu: {
          appId: fsAppId || undefined,
          appSecret: fsAppSecret || undefined,
          encryptKey: fsEncryptKey || undefined,
          verificationToken: fsVerificationToken || undefined,
          allowedUsers: fsUsers,
          streamingCard: fsStreamingCard,
        },
        // Comdr 指令: IM Wechat — wechat 字段持久化
        wechat: {
          loginMode: wxLoginMode,
          botToken: wxBotToken || undefined,
          webhookUrl: wxWebhookUrl || undefined,
          defaultSession: wxDefaultSession || undefined,
        },
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  const handleGenerateCode = useCallback(async () => {
    setIsGenerating(true);
    try {
      const code = await generatePairingCode();
      setPairingCode(code);
    } catch (err) {
      console.error('Failed to generate pairing code:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [generatePairingCode]);

  const handleUnbind = useCallback(
    (platform: 'telegram' | 'feishu' | 'wechat', userId: string | number) => {
      setPendingUnbind({ platform, userId });
    },
    [],
  );

  const confirmUnbind = useCallback(async () => {
    if (!pendingUnbind) return;
    setIsUnbinding(true);
    try {
      await removePairedUser(pendingUnbind.platform, pendingUnbind.userId);
      await fetchConfig();
      setPendingUnbind(null);
    } finally {
      setIsUnbinding(false);
    }
  }, [pendingUnbind, removePairedUser, fetchConfig]);

  // Comdr 指令: IM Wechat — adapter start/stop（任务 B IPC 调用）
  const setBusy = useCallback((platform: ImTab, busy: boolean) => {
    setAdapterBusy((prev) => ({ ...prev, [platform]: busy }));
  }, []);

  const handleStartAdapter = useCallback(
    async (platform: ImTab) => {
      const api = (typeof window !== 'undefined' ? window.pandaAPI : undefined);
      if (!api?.adapter) {
        setAdapterStatus((prev) => ({
          ...prev,
          [platform]: {
            platform: platform as AdapterPlatform,
            running: false,
            pid: null,
            installed: false,
            lastError: 'pandaAPI.adapter unavailable (not running in Electron?)',
            lastExitCode: null,
          },
        }));
        return;
      }
      setBusy(platform, true);
      try {
        await api.adapter.start(platform);
        await refreshAdapterStatus(platform);
      } catch (err) {
        setAdapterStatus((prev) => ({
          ...prev,
          [platform]: {
            platform: platform as AdapterPlatform,
            running: false,
            pid: null,
            installed: prev[platform]?.installed ?? false,
            lastError: err instanceof Error ? err.message : String(err),
            lastExitCode: null,
          },
        }));
      } finally {
        setBusy(platform, false);
      }
    },
    [refreshAdapterStatus, setBusy],
  );

  const handleStopAdapter = useCallback(
    async (platform: ImTab) => {
      const api = (typeof window !== 'undefined' ? window.pandaAPI : undefined);
      if (!api?.adapter) return;
      setBusy(platform, true);
      try {
        await api.adapter.stop(platform);
        await refreshAdapterStatus(platform);
      } finally {
        setBusy(platform, false);
      }
    },
    [refreshAdapterStatus, setBusy],
  );

  // Comdr 指令: IM Wechat — 跳到插件市场 tab 安装 wechat plugin
  const goToPluginsTab = useCallback(() => {
    useUIStore.getState().setPendingSettingsTab('plugins');
  }, []);

  const allPairedUsers = [
    ...(config.telegram?.pairedUsers ?? []).map((u) => ({
      ...u,
      platform: 'telegram' as const,
    })),
    ...(config.feishu?.pairedUsers ?? []).map((u) => ({
      ...u,
      platform: 'feishu' as const,
    })),
    // Comdr 指令: IM Wechat — wechat 平台 paired users
    ...(config.wechat?.pairedUsers ?? []).map((u) => ({
      ...u,
      platform: 'wechat' as const,
    })),
  ];

  const pairingExpiry = config.pairing?.expiresAt;
  const isPairingActive = pairingExpiry ? Date.now() < pairingExpiry : false;
  const minutesLeft = pairingExpiry
    ? Math.max(0, Math.ceil((pairingExpiry - Date.now()) / 60000))
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--pd-color-text-tertiary)]">
        <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[20px] mr-2">
          progress_activity
        </span>
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Description */}
      <div>
        <p className="text-sm text-[var(--pd-color-text-secondary)]">
          {t('settings.adapters.description')}
        </p>
      </div>

      {/* Pairing */}
      <section className="rounded-xl border border-[var(--pd-color-border)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--pd-color-surface-hover)] border-b border-[var(--pd-color-border)]">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-secondary)]">
            link
          </span>
          <span className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
            {t('settings.adapters.pairing')}
          </span>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-[var(--pd-color-text-secondary)]">
            {t('settings.adapters.pairingDesc')}
          </p>

          <div className="flex items-center gap-3">
            <PdButton onClick={handleGenerateCode} loading={isGenerating}>
              {pairingCode || isPairingActive
                ? t('settings.adapters.regenerateCode')
                : t('settings.adapters.generateCode')}
            </PdButton>
            {pairingCode && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold tracking-[0.3em] text-[var(--pd-color-brand)]">
                  {pairingCode}
                </span>
                <span className="text-xs text-[var(--pd-color-text-tertiary)]">
                  {t('settings.adapters.codeExpiresIn')} 60 {t('settings.adapters.minutes')}
                </span>
              </div>
            )}
            {!pairingCode && isPairingActive && (
              <span className="text-xs text-[var(--pd-color-text-tertiary)]">
                {t('settings.adapters.codeExpiresIn')} {minutesLeft}{' '}
                {t('settings.adapters.minutes')}
              </span>
            )}
          </div>
          {pairingCode && (
            <p className="text-xs text-[var(--pd-color-text-tertiary)]">
              {t('settings.adapters.pairingCodeHint')}
            </p>
          )}

          {/* Paired users list */}
          <div>
            <h4 className="text-sm font-medium text-[var(--pd-color-text-primary)] mb-2">
              {t('settings.adapters.pairedUsers')}
            </h4>
            {allPairedUsers.length === 0 ? (
              <p className="text-sm text-[var(--pd-color-text-tertiary)]">
                {t('settings.adapters.noPairedUsers')}
              </p>
            ) : (
              <div className="space-y-2">
                {allPairedUsers.map((user) => (
                  <div
                    key={`${user.platform}-${user.userId}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--pd-color-surface-hover)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--pd-color-surface)] text-[var(--pd-color-text-secondary)]">
                        {t(`settings.adapters.platform.${user.platform}`)}
                      </span>
                      <span className="text-sm text-[var(--pd-color-text-primary)]">
                        {user.displayName}
                      </span>
                      <span className="text-xs text-[var(--pd-color-text-tertiary)]">
                        {new Date(user.pairedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleUnbind(user.platform, user.userId)}
                      className="text-xs text-[var(--pd-color-error)] hover:underline cursor-pointer"
                    >
                      {t('settings.adapters.unbind')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Default Project */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--pd-color-text-primary)]">
          {t('settings.adapters.defaultProject')}
        </label>
        <PdDirectoryPicker
          value={defaultProjectDir}
          onChange={setDefaultProjectDir}
        />
        <p className="text-xs text-[var(--pd-color-text-tertiary)]">
          {t('settings.adapters.defaultProjectHint')}
        </p>
      </div>

      {/* IM Adapter Tabs */}
      <section className="rounded-xl border border-[var(--pd-color-border)] overflow-hidden">
        <div
          role="tablist"
          aria-label="IM adapter"
          className="flex items-stretch border-b border-[var(--pd-color-border)] bg-[var(--pd-color-surface-hover)]"
        >
          <ImTabButton
            label={t('settings.adapters.feishu')}
            active={activeIm === 'feishu'}
            onClick={() => setActiveIm('feishu')}
          />
          <ImTabButton
            label={t('settings.adapters.telegram')}
            active={activeIm === 'telegram'}
            onClick={() => setActiveIm('telegram')}
          />
          {/* Comdr 指令: IM Wechat / 任务 A — wechat tab */}
          <ImTabButton
            label={t('settings.adapters.wechat')}
            active={activeIm === 'wechat'}
            onClick={() => setActiveIm('wechat')}
          />
        </div>

        {activeIm === 'feishu' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <PdInput
                label={t('settings.adapters.appId')}
                value={fsAppId}
                onChange={(e) => setFsAppId(e.target.value)}
                placeholder={t('settings.adapters.appIdPlaceholder')}
              />
              <PdInput
                label={t('settings.adapters.appSecret')}
                type="password"
                value={fsAppSecret}
                onChange={(e) => setFsAppSecret(e.target.value)}
                placeholder={t('settings.adapters.appSecretPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PdInput
                label={t('settings.adapters.encryptKey')}
                type="password"
                value={fsEncryptKey}
                onChange={(e) => setFsEncryptKey(e.target.value)}
                placeholder={t('settings.adapters.encryptKeyPlaceholder')}
              />
              <PdInput
                label={t('settings.adapters.verificationToken')}
                type="password"
                value={fsVerificationToken}
                onChange={(e) => setFsVerificationToken(e.target.value)}
                placeholder={t('settings.adapters.verificationTokenPlaceholder')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <PdInput
                label={t('settings.adapters.allowedUsers')}
                value={fsAllowedUsers}
                onChange={(e) => setFsAllowedUsers(e.target.value)}
                placeholder={t('settings.adapters.fsAllowedUsersPlaceholder')}
              />
              <p className="text-xs text-[var(--pd-color-text-tertiary)]">
                {t('settings.adapters.allowedUsersHint')}
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={fsStreamingCard}
                onChange={(e) => setFsStreamingCard(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--pd-color-border)] accent-[var(--pd-color-brand)]"
              />
              <div>
                <span className="text-sm text-[var(--pd-color-text-primary)]">
                  {t('settings.adapters.streamingCard')}
                </span>
                <p className="text-xs text-[var(--pd-color-text-tertiary)]">
                  {t('settings.adapters.streamingCardDesc')}
                </p>
              </div>
            </label>
          </div>
        )}

        {activeIm === 'telegram' && (
          <div className="p-4 space-y-4">
            <PdInput
              label={t('settings.adapters.botToken')}
              type="password"
              value={tgBotToken}
              onChange={(e) => setTgBotToken(e.target.value)}
              placeholder={t('settings.adapters.botTokenPlaceholder')}
            />
            <div className="flex flex-col gap-1">
              <PdInput
                label={t('settings.adapters.allowedUsers')}
                value={tgAllowedUsers}
                onChange={(e) => setTgAllowedUsers(e.target.value)}
                placeholder={t('settings.adapters.tgAllowedUsersPlaceholder')}
              />
              <p className="text-xs text-[var(--pd-color-text-tertiary)]">
                {t('settings.adapters.allowedUsersHint')}
              </p>
            </div>
          </div>
        )}

        {/* Comdr 指令: IM Wechat / 任务 A — wechat 5 区块 */}
        {activeIm === 'wechat' && (
          <WechatTabPanel
            installed={adapterStatus.wechat?.installed ?? false}
            installedPath={adapterStatus.wechat?.installedPath}
            running={adapterStatus.wechat?.running ?? false}
            pid={adapterStatus.wechat?.pid ?? null}
            lastError={adapterStatus.wechat?.lastError}
            busy={adapterBusy.wechat}
            loginMode={wxLoginMode}
            onLoginModeChange={setWxLoginMode}
            botToken={wxBotToken}
            onBotTokenChange={setWxBotToken}
            webhookUrl={wxWebhookUrl}
            onWebhookUrlChange={setWxWebhookUrl}
            defaultSession={wxDefaultSession}
            onDefaultSessionChange={setWxDefaultSession}
            onStart={() => handleStartAdapter('wechat')}
            onStop={() => handleStopAdapter('wechat')}
            onInstallPlugin={goToPluginsTab}
          />
        )}
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <PdButton onClick={handleSave} loading={isSaving}>
          {saveStatus === 'saved'
            ? t('settings.adapters.saved')
            : t('settings.adapters.save')}
        </PdButton>
        {saveStatus === 'saved' && (
          <span className="text-sm text-[var(--pd-color-success)]">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px] align-middle mr-1">
              check_circle
            </span>
            {t('settings.adapters.saved')}
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-[var(--pd-color-error)]">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px] align-middle mr-1">
              error
            </span>
            {saveError}
          </span>
        )}
      </div>

      <PdConfirmDialog
        open={pendingUnbind !== null}
        onClose={() => {
          if (isUnbinding) return;
          setPendingUnbind(null);
        }}
        onConfirm={confirmUnbind}
        title={t('settings.adapters.unbind')}
        body={t('settings.adapters.unbindConfirm')}
        confirmLabel={t('settings.adapters.unbind')}
        cancelLabel={t('common.cancel')}
        confirmVariant="danger"
        loading={isUnbinding}
      />
    </div>
  );
}

function ImTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-color-brand)] focus-visible:ring-inset ${
        active
          ? "text-[var(--pd-color-text-primary)] font-semibold after:absolute after:left-3 after:right-3 after:bottom-0 after:h-[2px] after:bg-[var(--pd-color-brand)]"
          : 'text-[var(--pd-color-text-secondary)] hover:text-[var(--pd-color-text-primary)]'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Comdr 指令: IM Wechat / 任务 A — Wechat tab 5 区块 ────────────────────
//   1) 插件状态  2) 登录方式  3) 配置表单  4) 运行状态  5) 使用说明（折叠）

interface WechatTabPanelProps {
  installed: boolean;
  installedPath?: string;
  running: boolean;
  pid: number | null;
  lastError?: string;
  busy: boolean;
  loginMode: 'qr' | 'bot-token';
  onLoginModeChange: (m: 'qr' | 'bot-token') => void;
  botToken: string;
  onBotTokenChange: (v: string) => void;
  webhookUrl: string;
  onWebhookUrlChange: (v: string) => void;
  defaultSession: string;
  onDefaultSessionChange: (v: string) => void;
  onStart: () => void;
  onStop: () => void;
  onInstallPlugin: () => void;
}

function WechatTabPanel(props: WechatTabPanelProps) {
  const [showHelp, setShowHelp] = useState(false);
  const versionFromPath = (() => {
    if (!props.installedPath) return null;
    const m = props.installedPath.match(/\/wechat\/([\d.]+)\//);
    return m?.[1] ?? null;
  })();

  return (
    <div className="p-4 space-y-5">
      {/* (1) 插件状态 */}
      <div className="rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-hover)] p-3 flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[20px] ${
            props.installed
              ? 'text-[var(--pd-color-success)]'
              : 'text-[var(--pd-color-text-tertiary)]'
          }`}
        >
          {props.installed ? 'extension' : 'extension_off'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">
            {t('settings.adapters.wechat.pluginStatus')}
          </div>
          <div className="text-xs text-[var(--pd-color-text-tertiary)] truncate">
            {props.installed
              ? `${t('settings.adapters.wechat.installed')} ${
                  versionFromPath ? `· v${versionFromPath}` : ''
                }`
              : t('settings.adapters.wechat.notInstalled')}
          </div>
        </div>
        {!props.installed && (
          <PdButton size="sm" variant="secondary" onClick={props.onInstallPlugin}>
            {t('settings.adapters.wechat.installPlugin')}
          </PdButton>
        )}
      </div>

      {/* (2) 登录方式 */}
      <div>
        <label className="text-sm font-medium text-[var(--pd-color-text-primary)] block mb-2">
          {t('settings.adapters.wechat.loginMode')}
        </label>
        <div className="flex gap-2">
          <RadioPill
            label={t('settings.adapters.wechat.qrLogin')}
            checked={props.loginMode === 'qr'}
            onClick={() => props.onLoginModeChange('qr')}
          />
          <RadioPill
            label={t('settings.adapters.wechat.botTokenLogin')}
            checked={props.loginMode === 'bot-token'}
            onClick={() => props.onLoginModeChange('bot-token')}
          />
        </div>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-2">
          {props.loginMode === 'qr'
            ? t('settings.adapters.wechat.qrLoginDesc')
            : t('settings.adapters.wechat.botTokenLoginDesc')}
        </p>
      </div>

      {/* (3) 配置表单 */}
      <div className="space-y-3">
        {props.loginMode === 'bot-token' && (
          <PdInput
            label={t('settings.adapters.wechat.botToken')}
            type="password"
            value={props.botToken}
            onChange={(e) => props.onBotTokenChange(e.target.value)}
            placeholder={t('settings.adapters.wechat.botTokenPlaceholder')}
          />
        )}
        <PdInput
          label={t('settings.adapters.wechat.webhookUrl')}
          value={props.webhookUrl}
          onChange={(e) => props.onWebhookUrlChange(e.target.value)}
          placeholder={t('settings.adapters.wechat.webhookUrlPlaceholder')}
        />
        <PdInput
          label={t('settings.adapters.wechat.defaultSession')}
          value={props.defaultSession}
          onChange={(e) => props.onDefaultSessionChange(e.target.value)}
          placeholder={t('settings.adapters.wechat.defaultSessionPlaceholder')}
        />
      </div>

      {/* (4) 运行状态 */}
      <div className="rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-hover)] p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`inline-block w-2 h-2 rounded-full ${
              props.running
                ? 'bg-[var(--pd-color-success)]'
                : props.lastError
                  ? 'bg-[var(--pd-color-error)]'
                  : 'bg-[var(--pd-color-text-tertiary)]'
            }`}
          />
          <span className="text-sm font-medium text-[var(--pd-color-text-primary)]">
            {props.running
              ? `${t('settings.adapters.wechat.running')}${props.pid ? ` · pid ${props.pid}` : ''}`
              : props.lastError
                ? t('settings.adapters.wechat.errored')
                : t('settings.adapters.wechat.notRunning')}
          </span>
        </div>
        {props.lastError && !props.running && (
          <p className="text-xs text-[var(--pd-color-error)] break-all">
            {props.lastError}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          {props.running ? (
            <PdButton size="sm" variant="danger" onClick={props.onStop} loading={props.busy}>
              {t('settings.adapters.wechat.stop')}
            </PdButton>
          ) : (
            <PdButton
              size="sm"
              onClick={props.onStart}
              loading={props.busy}
              disabled={!props.installed}
            >
              {t('settings.adapters.wechat.start')}
            </PdButton>
          )}
        </div>
      </div>

      {/* (5) 使用说明（折叠） */}
      <details
        className="rounded-lg border border-[var(--pd-color-border)] p-3"
        open={showHelp}
        onToggle={(e) => setShowHelp((e.target as HTMLDetailsElement).open)}
      >
        <summary className="text-sm font-medium text-[var(--pd-color-text-primary)] cursor-pointer">
          {t('settings.adapters.wechat.howToUse')}
        </summary>
        <ul className="mt-2 text-xs text-[var(--pd-color-text-secondary)] space-y-1.5 list-disc pl-5">
          <li>{t('settings.adapters.wechat.help1')}</li>
          <li>{t('settings.adapters.wechat.help2')}</li>
          <li>{t('settings.adapters.wechat.help3')}</li>
          <li>{t('settings.adapters.wechat.help4')}</li>
        </ul>
      </details>
    </div>
  );
}

function RadioPill({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
        checked
          ? 'bg-[image:var(--pd-gradient-btn-primary)] text-[var(--pd-color-btn-primary-fg)] border-transparent shadow-[var(--pd-shadow-button-primary)]'
          : 'border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
      }`}
    >
      {label}
    </button>
  );
}
