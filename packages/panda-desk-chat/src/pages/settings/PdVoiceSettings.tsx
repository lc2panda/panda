// Input: localStorage 'panda-desk:settings.voice' + UI 交互
// Output: 语音设置面板 — STT/TTS toggle + 录音设备选择
// Pos: Settings sub-tab — pendingSettingsTab='voice' 路由目标
//
// Comdr 指令: panda 独有能力补齐 — Group 2（panda src/voice 桥接）
//   panda 后端 IPC 暂未提供 voice list-devices 接口 → 用 localStorage stub + TODO 注释。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';

const STORAGE_KEY = 'panda-desk:settings.voice';

interface VoiceSettings {
  sttEnabled: boolean;
  ttsEnabled: boolean;
  inputDevice: string; // 'default' or device id
  outputDevice: string;
  language: string; // 'auto' or BCP-47
}

const DEFAULTS: VoiceSettings = {
  sttEnabled: false,
  ttsEnabled: false,
  inputDevice: 'default',
  outputDevice: 'default',
  language: 'auto',
};

function load(): VoiceSettings {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<VoiceSettings>) };
  } catch {
    return DEFAULTS;
  }
}

function save(s: VoiceSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

export function PdVoiceSettings() {
  const [s, setS] = useState<VoiceSettings>(() => load());

  useEffect(() => {
    save(s);
  }, [s]);

  const update = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    setS((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.voice.title')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-6">
        {t('settings.voice.description')}
      </p>

      <Section title={t('settings.voice.sttSection')}>
        <ToggleRow
          label={t('settings.voice.stt.enable')}
          desc={t('settings.voice.stt.enableDesc')}
          checked={s.sttEnabled}
          onChange={(v) => update('sttEnabled', v)}
        />
        <SelectRow
          label={t('settings.voice.stt.inputDevice')}
          value={s.inputDevice}
          onChange={(v) => update('inputDevice', v)}
          options={[
            { value: 'default', label: t('settings.voice.device.systemDefault') },
            // TODO(panda IPC): bridge.voice.listInputDevices() → 动态填充
          ]}
          disabled={!s.sttEnabled}
        />
        <SelectRow
          label={t('settings.voice.stt.language')}
          value={s.language}
          onChange={(v) => update('language', v)}
          options={[
            { value: 'auto', label: t('settings.voice.lang.auto') },
            { value: 'en-US', label: 'English (US)' },
            { value: 'zh-CN', label: '中文（普通话）' },
            { value: 'ja-JP', label: '日本語' },
            { value: 'ko-KR', label: '한국어' },
          ]}
          disabled={!s.sttEnabled}
        />
      </Section>

      <Section title={t('settings.voice.ttsSection')}>
        <ToggleRow
          label={t('settings.voice.tts.enable')}
          desc={t('settings.voice.tts.enableDesc')}
          checked={s.ttsEnabled}
          onChange={(v) => update('ttsEnabled', v)}
        />
        <SelectRow
          label={t('settings.voice.tts.outputDevice')}
          value={s.outputDevice}
          onChange={(v) => update('outputDevice', v)}
          options={[
            { value: 'default', label: t('settings.voice.device.systemDefault') },
          ]}
          disabled={!s.ttsEnabled}
        />
      </Section>

      <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-6">
        {t('settings.voice.savedHint')}
      </p>
    </div>
  );
}

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
          checked ? 'bg-[var(--pd-color-brand)]' : 'bg-[var(--pd-color-border)]'
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

function SelectRow({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-1 ${disabled ? 'opacity-50' : ''}`}>
      <div className="text-sm font-medium text-[var(--pd-color-text-primary)] flex-1 min-w-0">
        {label}
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] text-sm text-[var(--pd-color-text-primary)] outline-none focus:border-[var(--pd-color-border-focus)] disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PdVoiceSettings;
