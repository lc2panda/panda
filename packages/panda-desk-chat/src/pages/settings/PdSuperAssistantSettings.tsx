// Input: localStorage 'panda-desk:settings.superAssistant' + UI 交互 + pandaAPI.wechat IPC
// Output: 超级助手配置面板 — 7 区块（启用/通知渠道/隐私/静默/数据采集/命令/微信 db 解密）
// Pos: Settings sub-tab — pendingSettingsTab='superAssistant' 路由目标
//
// Comdr 指令: 不实现真后端 — 所有表单数据写到 localStorage 'panda-desk:settings.superAssistant'。
//   后续 panda CLI 端落地超级助手主动层时再接 IPC bridge。
//   视觉沿用 cc-haha 1:1：圆角/border/shadow + material-symbols + section 标题。
//   Comdr 指令: 超级助手 Wechat DB / 任务 C — 加 7th 区块「微信本地 db 解密」走 panda:wechat:* IPC。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useCallback, useEffect, useState } from 'react';
import { t } from '../../i18n';
import { PdInput } from '../../components/shared/PdInput';
import { PdButton } from '../../components/shared/PdButton';
import type { WechatDbStatusResult } from '../../ipc/types';
// Comdr 指令: panda 独有能力补齐 — Group 3（跳左侧栏 Patterns NavItem 用）
import { useTabStore, PATTERNS_TAB_ID } from '../../stores/tabStore';

const STORAGE_KEY = 'panda-desk:settings.superAssistant';
// Comdr 指令: panda 独有能力补齐 — Group 3（独立存储 key 避免污染主结构）
const G3_STORAGE_KEY = 'panda-desk:settings.superAssistantG3';

// ─── Group 3: Smart Cron 6 项 ──────────────────────────────────────
type CronJobKey = 'morningBriefing' | 'deepDream' | 'memoryDecay' | 'weeklyReport' | 'codeHealth' | 'profileExpiry';

interface G3CronJob {
  enabled: boolean;
  // 频率描述（如 "每日 07:00"）— 当前为只读展示
}

// ─── Group 3: 103 场景维度 ─────────────────────────────────────────
type ScenarioDimension =
  | 'system'
  | 'communication'
  | 'file'
  | 'development'
  | 'knowledge'
  | 'efficiency'
  | 'security'
  | 'personal';

interface G3State {
  cron: Record<CronJobKey, G3CronJob>;
  scenariosEnabled: Record<string, boolean>;
  // 维度展开状态
  dimensionExpanded: Record<ScenarioDimension, boolean>;
  // Patterns/Scars
  patternsEnabled: boolean;
}

const G3_CRON_DEFAULT: Record<CronJobKey, G3CronJob> = {
  morningBriefing: { enabled: false },
  deepDream: { enabled: false },
  memoryDecay: { enabled: true },
  weeklyReport: { enabled: false },
  codeHealth: { enabled: false },
  profileExpiry: { enabled: true },
};

const G3_CRON_FREQ: Record<CronJobKey, string> = {
  morningBriefing: 'settings.superAssistant.cron.morningBriefing.freq',
  deepDream: 'settings.superAssistant.cron.deepDream.freq',
  memoryDecay: 'settings.superAssistant.cron.memoryDecay.freq',
  weeklyReport: 'settings.superAssistant.cron.weeklyReport.freq',
  codeHealth: 'settings.superAssistant.cron.codeHealth.freq',
  profileExpiry: 'settings.superAssistant.cron.profileExpiry.freq',
};

const G3_CRON_ICON: Record<CronJobKey, string> = {
  morningBriefing: 'wb_sunny',
  deepDream: 'bedtime',
  memoryDecay: 'history_toggle_off',
  weeklyReport: 'summarize',
  codeHealth: 'monitor_heart',
  profileExpiry: 'event_busy',
};

// 8 维度场景示例 ID（每维度 ~5–15 个，UI 列出代表性 ID；完整列表由 panda 后端 enabledScenarios 持久化）
const G3_DIMENSIONS: Array<{ key: ScenarioDimension; icon: string; scenarioIds: string[] }> = [
  { key: 'system', icon: 'memory', scenarioIds: ['disk-free-warning', 'memory-pressure', 'battery-low', 'network-latency', 'system-update'] },
  { key: 'communication', icon: 'forum', scenarioIds: ['email-flagged-reminder', 'email-unread-important', 'email-unreplied', 'wechat-pinned-reply', 'wechat-mention'] },
  { key: 'file', icon: 'folder', scenarioIds: ['downloads-cleanup', 'desktop-cleanup', 'trash-large', 'screenshot-cleanup', 'duplicate-files'] },
  { key: 'development', icon: 'code', scenarioIds: ['git-uncommitted', 'git-stale-branch', 'todo-growth', 'pr-pending-review', 'ci-failure'] },
  { key: 'knowledge', icon: 'menu_book', scenarioIds: ['note-stale', 'doc-orphan', 'reading-list', 'highlights-export'] },
  { key: 'efficiency', icon: 'timer', scenarioIds: ['no-break-warning', 'late-night-care', 'pomodoro-suggest', 'focus-mode'] },
  { key: 'security', icon: 'shield', scenarioIds: ['ssh-key-rotate', 'ssl-cert-expiry', 'password-leak', 'login-anomaly'] },
  { key: 'personal', icon: 'favorite', scenarioIds: ['contact-birthday', 'anniversary', 'health-checkup', 'medication-reminder'] },
];

const G3_DEFAULTS: G3State = {
  cron: G3_CRON_DEFAULT,
  scenariosEnabled: {},
  dimensionExpanded: {
    system: false,
    communication: false,
    file: false,
    development: false,
    knowledge: false,
    efficiency: false,
    security: false,
    personal: false,
  },
  patternsEnabled: true,
};

function loadG3(): G3State {
  if (typeof localStorage === 'undefined') return G3_DEFAULTS;
  try {
    const raw = localStorage.getItem(G3_STORAGE_KEY);
    if (!raw) return G3_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<G3State>;
    return {
      cron: { ...G3_DEFAULTS.cron, ...(parsed.cron ?? {}) },
      scenariosEnabled: { ...G3_DEFAULTS.scenariosEnabled, ...(parsed.scenariosEnabled ?? {}) },
      dimensionExpanded: { ...G3_DEFAULTS.dimensionExpanded, ...(parsed.dimensionExpanded ?? {}) },
      patternsEnabled: parsed.patternsEnabled ?? G3_DEFAULTS.patternsEnabled,
    };
  } catch {
    return G3_DEFAULTS;
  }
}

function saveG3(s: G3State) {
  try {
    localStorage.setItem(G3_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

type ChannelKind = 'macos' | 'webhook-feishu' | 'webhook-telegram' | 'webhook-wechat';
type PrivacyLevel = 'high' | 'medium' | 'low';

interface SuperAssistantSettings {
  // 主开关
  enabled: boolean;
  proactive: boolean;
  passive: boolean;
  deepDream: boolean;
  memoryDecay: boolean;
  // 通知渠道
  channels: Record<ChannelKind, boolean>;
  webhookUrls: {
    feishu: string;
    telegram: string;
    wechat: string;
  };
  // 隐私级别
  privacyLevel: PrivacyLevel;
  // 静默时段
  quietHoursEnabled: boolean;
  quietStart: string; // HH:mm
  quietEnd: string;
  // 数据采集授权
  collect: {
    calendar: boolean;
    git: boolean;
    filesystem: boolean;
  };
  // 超级助手命令开关
  commands: {
    proactive: boolean;
    assistant: boolean;
    nightMode: boolean;
  };
}

const DEFAULTS: SuperAssistantSettings = {
  enabled: false,
  proactive: false,
  passive: true,
  deepDream: false,
  memoryDecay: true,
  channels: {
    macos: true,
    'webhook-feishu': false,
    'webhook-telegram': false,
    'webhook-wechat': false,
  },
  webhookUrls: { feishu: '', telegram: '', wechat: '' },
  privacyLevel: 'high',
  quietHoursEnabled: true,
  quietStart: '22:00',
  quietEnd: '08:00',
  collect: { calendar: false, git: false, filesystem: false },
  commands: { proactive: true, assistant: true, nightMode: true },
};

function loadSettings(): SuperAssistantSettings {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<SuperAssistantSettings>;
    return {
      ...DEFAULTS,
      ...parsed,
      channels: { ...DEFAULTS.channels, ...(parsed.channels ?? {}) },
      webhookUrls: { ...DEFAULTS.webhookUrls, ...(parsed.webhookUrls ?? {}) },
      collect: { ...DEFAULTS.collect, ...(parsed.collect ?? {}) },
      commands: { ...DEFAULTS.commands, ...(parsed.commands ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(s: SuperAssistantSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

export function PdSuperAssistantSettings() {
  const [s, setS] = useState<SuperAssistantSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(s);
  }, [s]);

  const update = <K extends keyof SuperAssistantSettings>(key: K, value: SuperAssistantSettings[K]) => {
    setS((prev) => ({ ...prev, [key]: value }));
  };

  // ── Comdr 指令: panda 独有能力补齐 — Group 3 ─────────────────────────────
  const [g3, setG3] = useState<G3State>(() => loadG3());

  useEffect(() => {
    saveG3(g3);
  }, [g3]);

  const toggleCron = useCallback((key: CronJobKey) => {
    setG3((prev) => ({
      ...prev,
      cron: {
        ...prev.cron,
        [key]: { enabled: !prev.cron[key].enabled },
      },
    }));
  }, []);

  const toggleScenario = useCallback((scenarioId: string) => {
    setG3((prev) => ({
      ...prev,
      scenariosEnabled: {
        ...prev.scenariosEnabled,
        [scenarioId]: !prev.scenariosEnabled[scenarioId],
      },
    }));
  }, []);

  const toggleDimension = useCallback((dim: ScenarioDimension) => {
    setG3((prev) => ({
      ...prev,
      dimensionExpanded: {
        ...prev.dimensionExpanded,
        [dim]: !prev.dimensionExpanded[dim],
      },
    }));
  }, []);

  // 跳左侧栏 Patterns NavItem
  const handleGotoPatterns = useCallback(() => {
    useTabStore
      .getState()
      .openTab(PATTERNS_TAB_ID, t('sidebar.patterns'), 'patterns');
  }, []);

  // ── Comdr 指令: 超级助手 Wechat DB / 任务 C ─────────────────────────────
  const [wxStatus, setWxStatus] = useState<WechatDbStatusResult | null>(null);
  const [wxLoading, setWxLoading] = useState(false);
  const [wxKeysPath, setWxKeysPath] = useState('');
  const [wxAutoDecrypt, setWxAutoDecrypt] = useState<'off' | 'daily' | 'weekly'>('off');
  const [wxOpStatus, setWxOpStatus] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [wxOpMsg, setWxOpMsg] = useState('');
  const [wxRiskExpanded, setWxRiskExpanded] = useState(false);

  const refreshWxStatus = useCallback(async () => {
    const api = (typeof window !== 'undefined' ? window.pandaAPI : undefined);
    if (!api?.wechat) return;
    setWxLoading(true);
    try {
      const st = await api.wechat.getStatus();
      setWxStatus(st);
      if (st.keysFile.path && !wxKeysPath) {
        setWxKeysPath(st.keysFile.path);
      }
    } catch (err) {
      // ignore — render keeps previous state
    } finally {
      setWxLoading(false);
    }
  }, [wxKeysPath]);

  useEffect(() => {
    void refreshWxStatus();
  }, [refreshWxStatus]);

  const handleWxToggleEnabled = useCallback(
    async (next: boolean) => {
      const api = (typeof window !== 'undefined' ? window.pandaAPI : undefined);
      if (!api?.wechat) return;
      setWxOpStatus('busy');
      try {
        const r = await api.wechat.setConfig({ enabled: next, mode: 'local-db' });
        if (r.ok) {
          setWxOpStatus('ok');
          setWxOpMsg('');
          await refreshWxStatus();
        } else {
          setWxOpStatus('error');
          setWxOpMsg(r.error);
        }
      } catch (err) {
        setWxOpStatus('error');
        setWxOpMsg(err instanceof Error ? err.message : String(err));
      } finally {
        setTimeout(() => setWxOpStatus('idle'), 2000);
      }
    },
    [refreshWxStatus],
  );

  const handleWxKeysPathSave = useCallback(async () => {
    const api = (typeof window !== 'undefined' ? window.pandaAPI : undefined);
    if (!api?.wechat) return;
    setWxOpStatus('busy');
    try {
      const r = await api.wechat.setConfig({ keysFile: wxKeysPath });
      if (r.ok) {
        setWxOpStatus('ok');
        setWxOpMsg('');
        await refreshWxStatus();
      } else {
        setWxOpStatus('error');
        setWxOpMsg(r.error);
      }
    } finally {
      setTimeout(() => setWxOpStatus('idle'), 2000);
    }
  }, [wxKeysPath, refreshWxStatus]);

  const handleWxAutoDecryptChange = useCallback(
    async (next: 'off' | 'daily' | 'weekly') => {
      setWxAutoDecrypt(next);
      const api = (typeof window !== 'undefined' ? window.pandaAPI : undefined);
      if (!api?.wechat) return;
      try {
        await api.wechat.setConfig({ autoDecrypt: next });
        await refreshWxStatus();
      } catch { /* noop */ }
    },
    [refreshWxStatus],
  );

  const handleWxScenarioToggle = useCallback(
    async (key: 'wechatMessages' | 'wechatDailySituational', next: boolean) => {
      const api = (typeof window !== 'undefined' ? window.pandaAPI : undefined);
      if (!api?.wechat) return;
      try {
        await api.wechat.setProactive({ [key]: next });
        await refreshWxStatus();
      } catch { /* noop */ }
    },
    [refreshWxStatus],
  );

  const handleWxDecrypt = useCallback(async () => {
    const api = (typeof window !== 'undefined' ? window.pandaAPI : undefined);
    if (!api?.wechat) return;
    setWxOpStatus('busy');
    setWxOpMsg('');
    try {
      const r = await api.wechat.decrypt();
      if (r.ok) {
        setWxOpStatus('ok');
        setWxOpMsg(r.details ?? '');
        await refreshWxStatus();
      } else {
        setWxOpStatus('error');
        setWxOpMsg(r.error + (r.details ? ` — ${r.details}` : ''));
      }
    } catch (err) {
      setWxOpStatus('error');
      setWxOpMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setTimeout(() => setWxOpStatus('idle'), 4000);
    }
  }, [refreshWxStatus]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.superAssistant.title')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-6">
        {t('settings.superAssistant.description')}
      </p>

      {/* ── 启用开关 ──────────────────────────────────────────── */}
      <Section title={t('settings.superAssistant.enableSection')}>
        <ToggleRow
          label={t('settings.superAssistant.enable')}
          desc={t('settings.superAssistant.enableDesc')}
          checked={s.enabled}
          onChange={(v) => update('enabled', v)}
        />
        <ToggleRow
          label={t('settings.superAssistant.proactive')}
          desc={t('settings.superAssistant.proactiveDesc')}
          checked={s.proactive}
          onChange={(v) => update('proactive', v)}
          disabled={!s.enabled}
        />
        <ToggleRow
          label={t('settings.superAssistant.passive')}
          desc={t('settings.superAssistant.passiveDesc')}
          checked={s.passive}
          onChange={(v) => update('passive', v)}
          disabled={!s.enabled}
        />
        <ToggleRow
          label={t('settings.superAssistant.deepDream')}
          desc={t('settings.superAssistant.deepDreamDesc')}
          checked={s.deepDream}
          onChange={(v) => update('deepDream', v)}
          disabled={!s.enabled}
        />
        <ToggleRow
          label={t('settings.superAssistant.memoryDecay')}
          desc={t('settings.superAssistant.memoryDecayDesc')}
          checked={s.memoryDecay}
          onChange={(v) => update('memoryDecay', v)}
          disabled={!s.enabled}
        />
      </Section>

      {/* ── 通知渠道 ──────────────────────────────────────────── */}
      <Section title={t('settings.superAssistant.channels.section')}>
        <ToggleRow
          label={t('settings.superAssistant.channels.macos')}
          desc={t('settings.superAssistant.channels.macosDesc')}
          checked={s.channels.macos}
          onChange={(v) => update('channels', { ...s.channels, macos: v })}
        />
        <ToggleRow
          label={t('settings.superAssistant.channels.feishu')}
          desc={t('settings.superAssistant.channels.feishuDesc')}
          checked={s.channels['webhook-feishu']}
          onChange={(v) => update('channels', { ...s.channels, 'webhook-feishu': v })}
        />
        {s.channels['webhook-feishu'] && (
          <PdInput
            label={t('settings.superAssistant.channels.feishuUrl')}
            placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
            value={s.webhookUrls.feishu}
            onChange={(e) => update('webhookUrls', { ...s.webhookUrls, feishu: e.target.value })}
          />
        )}
        <ToggleRow
          label={t('settings.superAssistant.channels.telegram')}
          desc={t('settings.superAssistant.channels.telegramDesc')}
          checked={s.channels['webhook-telegram']}
          onChange={(v) => update('channels', { ...s.channels, 'webhook-telegram': v })}
        />
        {s.channels['webhook-telegram'] && (
          <PdInput
            label={t('settings.superAssistant.channels.telegramUrl')}
            placeholder="https://api.telegram.org/bot{token}/..."
            value={s.webhookUrls.telegram}
            onChange={(e) => update('webhookUrls', { ...s.webhookUrls, telegram: e.target.value })}
          />
        )}
        <ToggleRow
          label={t('settings.superAssistant.channels.wechat')}
          desc={t('settings.superAssistant.channels.wechatDesc')}
          checked={s.channels['webhook-wechat']}
          onChange={(v) => update('channels', { ...s.channels, 'webhook-wechat': v })}
        />
        {s.channels['webhook-wechat'] && (
          <PdInput
            label={t('settings.superAssistant.channels.wechatUrl')}
            placeholder="https://qyapi.weixin.qq.com/..."
            value={s.webhookUrls.wechat}
            onChange={(e) => update('webhookUrls', { ...s.webhookUrls, wechat: e.target.value })}
          />
        )}
      </Section>

      {/* ── 隐私级别 ──────────────────────────────────────────── */}
      <Section title={t('settings.superAssistant.privacy.section')}>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-3">
          {t('settings.superAssistant.privacy.desc')}
        </p>
        <div className="flex gap-2">
          {(['high', 'medium', 'low'] as PrivacyLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => update('privacyLevel', level)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                s.privacyLevel === level
                  ? 'bg-[image:var(--pd-gradient-btn-primary)] text-[var(--pd-color-btn-primary-fg)] border-transparent shadow-[var(--pd-shadow-button-primary)]'
                  : 'border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
              }`}
            >
              {t(`settings.superAssistant.privacy.${level}`)}
            </button>
          ))}
        </div>
      </Section>

      {/* ── 静默时段 ──────────────────────────────────────────── */}
      <Section title={t('settings.superAssistant.quietHours.section')}>
        <ToggleRow
          label={t('settings.superAssistant.quietHours.enable')}
          desc={t('settings.superAssistant.quietHours.desc')}
          checked={s.quietHoursEnabled}
          onChange={(v) => update('quietHoursEnabled', v)}
        />
        {s.quietHoursEnabled && (
          <div className="flex gap-3 mt-3">
            <div className="flex-1">
              <label className="block text-xs text-[var(--pd-color-text-secondary)] mb-1">
                {t('settings.superAssistant.quietHours.start')}
              </label>
              <input
                type="time"
                value={s.quietStart}
                onChange={(e) => update('quietStart', e.target.value)}
                className="w-full h-10 px-3 rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] text-sm text-[var(--pd-color-text-primary)] outline-none focus:border-[var(--pd-color-border-focus)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-[var(--pd-color-text-secondary)] mb-1">
                {t('settings.superAssistant.quietHours.end')}
              </label>
              <input
                type="time"
                value={s.quietEnd}
                onChange={(e) => update('quietEnd', e.target.value)}
                className="w-full h-10 px-3 rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] text-sm text-[var(--pd-color-text-primary)] outline-none focus:border-[var(--pd-color-border-focus)]"
              />
            </div>
          </div>
        )}
      </Section>

      {/* ── 数据采集授权 ──────────────────────────────────────── */}
      <Section title={t('settings.superAssistant.collect.section')}>
        <ToggleRow
          label={t('settings.superAssistant.collect.calendar')}
          desc={t('settings.superAssistant.collect.calendarDesc')}
          checked={s.collect.calendar}
          onChange={(v) => update('collect', { ...s.collect, calendar: v })}
        />
        <ToggleRow
          label={t('settings.superAssistant.collect.git')}
          desc={t('settings.superAssistant.collect.gitDesc')}
          checked={s.collect.git}
          onChange={(v) => update('collect', { ...s.collect, git: v })}
        />
        <ToggleRow
          label={t('settings.superAssistant.collect.filesystem')}
          desc={t('settings.superAssistant.collect.filesystemDesc')}
          checked={s.collect.filesystem}
          onChange={(v) => update('collect', { ...s.collect, filesystem: v })}
        />
      </Section>

      {/* ── 命令开关 ──────────────────────────────────────────── */}
      <Section title={t('settings.superAssistant.commands.section')}>
        <ToggleRow
          label="/proactive"
          desc={t('settings.superAssistant.commands.proactiveDesc')}
          checked={s.commands.proactive}
          onChange={(v) => update('commands', { ...s.commands, proactive: v })}
        />
        <ToggleRow
          label="/assistant"
          desc={t('settings.superAssistant.commands.assistantDesc')}
          checked={s.commands.assistant}
          onChange={(v) => update('commands', { ...s.commands, assistant: v })}
        />
        <ToggleRow
          label="/night-mode"
          desc={t('settings.superAssistant.commands.nightModeDesc')}
          checked={s.commands.nightMode}
          onChange={(v) => update('commands', { ...s.commands, nightMode: v })}
        />
      </Section>

      {/* ── Comdr 指令: 超级助手 Wechat DB / 任务 C — 微信本地 DB 解密 ────── */}
      <Section title={t('settings.superAssistant.wechatDb.section')}>
        {/* 状态卡 */}
        <div className="rounded-lg border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-hover)] p-3 space-y-2">
          <StatusRow
            label={t('settings.superAssistant.wechatDb.sqlcipherStatus')}
            value={
              wxStatus?.sqlcipher.installed
                ? `${t('common.installed')}${wxStatus.sqlcipher.version ? ` · v${wxStatus.sqlcipher.version}` : ''}`
                : t('common.notInstalled')
            }
            ok={!!wxStatus?.sqlcipher.installed}
          />
          <StatusRow
            label={t('settings.superAssistant.wechatDb.keysFile')}
            value={
              wxStatus?.keysFile.configured
                ? wxStatus.keysFile.exists
                  ? wxStatus.keysFile.path ?? '—'
                  : t('settings.superAssistant.wechatDb.keysFileMissing')
                : t('settings.superAssistant.wechatDb.keysFileNotConfigured')
            }
            ok={!!(wxStatus?.keysFile.exists && wxStatus.keysFile.readable)}
            mono
          />
          <StatusRow
            label={t('settings.superAssistant.wechatDb.decryptDir')}
            value={wxStatus?.decryptDir ?? '~/.pandacc/data/wechat-decrypted/'}
            ok={!!wxStatus?.decryptDirExists}
            mono
          />
          <StatusRow
            label={t('settings.superAssistant.wechatDb.lastDecryptAt')}
            value={
              wxStatus?.lastDecryptAt
                ? new Date(wxStatus.lastDecryptAt).toLocaleString()
                : t('settings.superAssistant.wechatDb.never')
            }
            ok={!!wxStatus?.lastDecryptAt}
          />
          <div className="pt-1">
            <PdButton size="sm" variant="ghost" onClick={refreshWxStatus} loading={wxLoading}>
              <span aria-hidden="true" className="material-symbols-outlined text-[14px]">refresh</span>
              {t('common.refresh')}
            </PdButton>
          </div>
        </div>

        {/* keys 路径配置 */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <PdInput
              label={t('settings.superAssistant.wechatDb.keysPath')}
              value={wxKeysPath}
              onChange={(e) => setWxKeysPath(e.target.value)}
              placeholder="/path/to/wechat_keys.json"
            />
          </div>
          <PdButton size="md" variant="secondary" onClick={handleWxKeysPathSave}>
            {t('common.save')}
          </PdButton>
        </div>

        {/* 启用开关 */}
        <ToggleRow
          label={t('settings.superAssistant.wechatDb.enableMode')}
          desc={t('settings.superAssistant.wechatDb.enableModeDesc')}
          checked={!!wxStatus?.wechatEnabled}
          onChange={handleWxToggleEnabled}
        />

        {/* 自动定时解密 */}
        <div>
          <label className="text-sm font-medium text-[var(--pd-color-text-primary)] block mb-1">
            {t('settings.superAssistant.wechatDb.autoDecrypt')}
          </label>
          <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-2">
            {t('settings.superAssistant.wechatDb.autoDecryptDesc')}
          </p>
          <div className="flex gap-2">
            {(['off', 'daily', 'weekly'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleWxAutoDecryptChange(opt)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  wxAutoDecrypt === opt
                    ? 'bg-[image:var(--pd-gradient-btn-primary)] text-[var(--pd-color-btn-primary-fg)] border-transparent shadow-[var(--pd-shadow-button-primary)]'
                    : 'border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
                }`}
              >
                {t(`settings.superAssistant.wechatDb.autoDecrypt.${opt}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 启用场景 */}
        <ToggleRow
          label={t('settings.superAssistant.wechatDb.scenarioMessages')}
          desc={t('settings.superAssistant.wechatDb.scenarioMessagesDesc')}
          checked={!!wxStatus?.scenarios.wechatMessages}
          onChange={(v) => handleWxScenarioToggle('wechatMessages', v)}
        />
        <ToggleRow
          label={t('settings.superAssistant.wechatDb.scenarioDaily')}
          desc={t('settings.superAssistant.wechatDb.scenarioDailyDesc')}
          checked={!!wxStatus?.scenarios.wechatDailySituational}
          onChange={(v) => handleWxScenarioToggle('wechatDailySituational', v)}
        />

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2 pt-1">
          <PdButton size="md" onClick={handleWxDecrypt} loading={wxOpStatus === 'busy'}>
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">lock_open</span>
            {t('settings.superAssistant.wechatDb.decryptNow')}
          </PdButton>
          <PdButton
            size="md"
            variant="secondary"
            onClick={() => {
              alert(t('settings.superAssistant.wechatDb.extractKeyHint'));
            }}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">key</span>
            {t('settings.superAssistant.wechatDb.extractKey')}
          </PdButton>
        </div>
        {wxOpStatus === 'ok' && wxOpMsg && (
          <p className="text-xs text-[var(--pd-color-success)]">{wxOpMsg}</p>
        )}
        {wxOpStatus === 'error' && (
          <p className="text-xs text-[var(--pd-color-error)] break-all">{wxOpMsg}</p>
        )}

        {/* 风险提示（折叠） */}
        <details
          className="rounded-lg border border-[var(--pd-color-border)] p-3"
          open={wxRiskExpanded}
          onToggle={(e) => setWxRiskExpanded((e.target as HTMLDetailsElement).open)}
        >
          <summary className="text-sm font-medium text-[var(--pd-color-text-primary)] cursor-pointer">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px] align-middle mr-1">
              warning
            </span>
            {t('settings.superAssistant.wechatDb.risks')}
          </summary>
          <ul className="mt-2 text-xs text-[var(--pd-color-text-secondary)] space-y-1.5 list-disc pl-5">
            <li>{t('settings.superAssistant.wechatDb.riskSip')}</li>
            <li>{t('settings.superAssistant.wechatDb.riskKeys')}</li>
            <li>{t('settings.superAssistant.wechatDb.riskLocal')}</li>
          </ul>
        </details>
      </Section>

      {/* ── Comdr 指令: panda 独有能力补齐 — Group 3.1 自主任务调度 (Smart Cron 6 项) ── */}
      <Section title={t('settings.superAssistant.cron.section')}>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-2">
          {t('settings.superAssistant.cron.desc')}
        </p>
        {(Object.keys(G3_CRON_DEFAULT) as CronJobKey[]).map((key) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface-container-low)] px-3 py-2.5"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-tertiary)]">
                {G3_CRON_ICON[key]}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--pd-color-text-primary)] truncate">
                  {t(`settings.superAssistant.cron.${key}.label`)}
                </div>
                <div className="text-[10px] text-[var(--pd-color-text-tertiary)] mt-0.5">
                  {t(G3_CRON_FREQ[key])}
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={g3.cron[key].enabled}
              onClick={() => toggleCron(key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                g3.cron[key].enabled ? 'bg-[var(--pd-color-brand)]' : 'bg-[var(--pd-color-border)]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  g3.cron[key].enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </Section>

      {/* ── Comdr 指令: panda 独有能力补齐 — Group 3.2 103 场景启用 (8 大维度) ── */}
      <Section title={t('settings.superAssistant.scenarios.section')}>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-2">
          {t('settings.superAssistant.scenarios.desc')}
        </p>
        <div className="text-[10px] text-[var(--pd-color-text-tertiary)] font-mono mb-3 break-all">
          ~/.pandacc/config/proactive.json
        </div>
        {G3_DIMENSIONS.map((dim) => {
          const isExpanded = g3.dimensionExpanded[dim.key];
          const dimEnabledCount = dim.scenarioIds.filter((id) => g3.scenariosEnabled[id]).length;
          return (
            <div
              key={dim.key}
              className="rounded-xl border border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface-container-low)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleDimension(dim.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--pd-color-surface-hover)] transition-colors"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-tertiary)]">
                  {dim.icon}
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">
                    {t(`settings.superAssistant.scenarios.dim.${dim.key}.title`)}
                  </div>
                  <div className="text-[10px] text-[var(--pd-color-text-tertiary)] mt-0.5">
                    {t('settings.superAssistant.scenarios.dim.count', {
                      enabled: dimEnabledCount,
                      total: dim.scenarioIds.length,
                    })}
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[20px] text-[var(--pd-color-text-tertiary)]"
                >
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {isExpanded && (
                <div className="border-t border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface)] px-3 py-2 space-y-1">
                  {dim.scenarioIds.map((id) => (
                    <label
                      key={id}
                      className="flex items-center justify-between gap-3 px-2 py-1.5 rounded hover:bg-[var(--pd-color-surface-hover)] cursor-pointer"
                    >
                      <span className="text-xs text-[var(--pd-color-text-secondary)] font-mono break-all">
                        {id}
                      </span>
                      <input
                        type="checkbox"
                        checked={!!g3.scenariosEnabled[id]}
                        onChange={() => toggleScenario(id)}
                        className="flex-shrink-0 h-4 w-4 rounded border-[var(--pd-color-border)] cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Section>

      {/* ── Comdr 指令: panda 独有能力补齐 — Group 3.3 Patterns/Scars 经验记忆 ── */}
      <Section title={t('settings.superAssistant.patterns.section')}>
        <ToggleRow
          label={t('settings.superAssistant.patterns.enable')}
          desc={t('settings.superAssistant.patterns.enableDesc')}
          checked={g3.patternsEnabled}
          onChange={(v) => setG3((prev) => ({ ...prev, patternsEnabled: v }))}
        />
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[var(--pd-color-border)]/40">
          <PdButton size="sm" variant="secondary" onClick={handleGotoPatterns}>
            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">psychology_alt</span>
            {t('settings.superAssistant.patterns.viewMemoryBank')}
          </PdButton>
          <span className="text-[11px] text-[var(--pd-color-text-tertiary)]">
            {t('settings.superAssistant.patterns.memoryHint')}
          </span>
        </div>
      </Section>

      <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-6">
        {t('settings.superAssistant.savedHint')}
      </p>
    </div>
  );
}

// Comdr 指令: 超级助手 Wechat DB — 状态行（label / value + 状态点）
function StatusRow({ label, value, ok, mono }: { label: string; value: string; ok: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-[var(--pd-color-text-tertiary)] flex-shrink-0">{label}</span>
      <span
        className={`text-xs ${mono ? 'font-mono break-all' : ''} ${
          ok ? 'text-[var(--pd-color-text-primary)]' : 'text-[var(--pd-color-text-tertiary)]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Sub-components

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-[var(--pd-color-text-primary)] mb-3 uppercase tracking-wider">
        {title}
      </h3>
      <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-4 shadow-sm flex flex-col gap-3">
        {children}
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 py-1 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">{label}</div>
        <div className="text-xs text-[var(--pd-color-text-tertiary)] mt-0.5">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked
            ? 'bg-[var(--pd-color-brand)]'
            : 'bg-[var(--pd-color-border)]'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default PdSuperAssistantSettings;
