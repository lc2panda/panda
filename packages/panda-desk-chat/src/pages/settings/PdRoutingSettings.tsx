// Input: localStorage 'panda-desk:settings.routing' + UI 交互
// Output: Multi-Model Routing 配置面板 — PANDA_MODEL_ROUTING toggle + 路由表展示
// Pos: Settings sub-tab — pendingSettingsTab='routing' 路由目标
//
// Comdr 指令: panda 独有能力补齐 — Group 2（panda README §2.4 Multi-Model Routing 桥接）
//   预期数据源：~/.pandacc/config/routing.json（参考 panda src/routing/）
//   panda 后端 IPC 暂未提供 routing 读写接口 → 用 localStorage stub + TODO 注释。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';

const STORAGE_KEY = 'panda-desk:settings.routing';

interface RoutingSettings {
  enabled: boolean;
  // 路由表只读展示文本（panda IPC 接入前的占位）
  configText: string;
}

const DEFAULT_CONFIG_TEXT = `{
  "rules": [
    { "task": "default", "model": "claude-opus-4-7" },
    { "task": "background", "model": "claude-haiku-4-5" },
    { "task": "subagent", "model": "claude-sonnet-4-7" },
    { "task": "thinking", "model": "claude-opus-4-7" }
  ]
}`;

const DEFAULTS: RoutingSettings = {
  enabled: false,
  configText: DEFAULT_CONFIG_TEXT,
};

function load(): RoutingSettings {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<RoutingSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function save(s: RoutingSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

export function PdRoutingSettings() {
  const [s, setS] = useState<RoutingSettings>(() => load());

  useEffect(() => {
    save(s);
  }, [s]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.routing.title')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-6">
        {t('settings.routing.description')}
      </p>

      <Section title={t('settings.routing.enableSection')}>
        <ToggleRow
          label={t('settings.routing.enable')}
          desc={t('settings.routing.enableDesc')}
          checked={s.enabled}
          onChange={(v) => setS((p) => ({ ...p, enabled: v }))}
        />
        <div className="text-[10px] text-[var(--pd-color-text-tertiary)] font-mono mt-1">
          PANDA_MODEL_ROUTING={s.enabled ? '1' : '0'}
        </div>
      </Section>

      <Section title={t('settings.routing.tableSection')}>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-2">
          {t('settings.routing.tableDesc')}
        </p>
        <div className="text-[10px] text-[var(--pd-color-text-tertiary)] font-mono mb-2 break-all">
          ~/.pandacc/config/routing.json
        </div>
        <textarea
          readOnly
          value={s.configText}
          className="w-full h-48 px-3 py-2 rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] text-xs font-mono text-[var(--pd-color-text-secondary)] outline-none resize-none"
          spellCheck={false}
        />
        <p className="text-[10px] text-[var(--pd-color-text-tertiary)] mt-2">
          {t('settings.routing.editHint')}
        </p>
      </Section>

      <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-6">
        {t('settings.routing.savedHint')}
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

export default PdRoutingSettings;
