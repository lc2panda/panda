// Input: localStorage 'panda-desk:settings.hooks' + UI 交互
// Output: Hooks 配置面板 — PreToolUse/PostToolUse/Stop/Notification/UserPromptSubmit/SessionStart/SessionEnd 启用/禁用
// Pos: Settings sub-tab — pendingSettingsTab='hooks' 路由目标
//
// Comdr 指令: panda 独有能力补齐 — Group 2（panda src/hooks 桥接）
//   预期数据源：~/.pandacc/hooks.json
//   panda 后端 IPC 暂未提供 hooks 列表/启用接口 → 用 localStorage stub + TODO 注释。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';

type HookKind =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'UserPromptSubmit'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop'
  | 'SessionStart'
  | 'SessionEnd';

const HOOK_KINDS: HookKind[] = [
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'Notification',
  'Stop',
  'SubagentStop',
  'SessionStart',
  'SessionEnd',
];

const STORAGE_KEY = 'panda-desk:settings.hooks';

interface HooksSettings {
  enabled: Record<HookKind, boolean>;
}

const DEFAULTS: HooksSettings = {
  enabled: {
    PreToolUse: false,
    PostToolUse: false,
    UserPromptSubmit: false,
    Notification: false,
    Stop: false,
    SubagentStop: false,
    SessionStart: false,
    SessionEnd: false,
  },
};

function load(): HooksSettings {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<HooksSettings>;
    return { enabled: { ...DEFAULTS.enabled, ...(parsed.enabled ?? {}) } };
  } catch {
    return DEFAULTS;
  }
}

function save(s: HooksSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

function getHookIcon(kind: HookKind): string {
  switch (kind) {
    case 'PreToolUse': return 'play_arrow';
    case 'PostToolUse': return 'stop';
    case 'UserPromptSubmit': return 'send';
    case 'Notification': return 'notifications';
    case 'Stop': return 'block';
    case 'SubagentStop': return 'pan_tool';
    case 'SessionStart': return 'login';
    case 'SessionEnd': return 'logout';
  }
}

export function PdHooksSettings() {
  const [s, setS] = useState<HooksSettings>(() => load());

  useEffect(() => {
    save(s);
  }, [s]);

  const toggle = (kind: HookKind) => {
    setS((prev) => ({ ...prev, enabled: { ...prev.enabled, [kind]: !prev.enabled[kind] } }));
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.hooks.title')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-6">
        {t('settings.hooks.description')}
      </p>

      <Section title={t('settings.hooks.kindsSection')}>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-2">
          {t('settings.hooks.kindsDesc')}
        </p>
        {HOOK_KINDS.map((kind) => (
          <div
            key={kind}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface-container-low)] px-3 py-2.5"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-tertiary)]"
              >
                {getHookIcon(kind)}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--pd-color-text-primary)] truncate">
                  {kind}
                </div>
                <div className="text-[10px] text-[var(--pd-color-text-tertiary)] mt-0.5">
                  {t(`settings.hooks.kind.${kind}.desc`)}
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={s.enabled[kind]}
              onClick={() => toggle(kind)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                s.enabled[kind] ? 'bg-[var(--pd-color-brand)]' : 'bg-[var(--pd-color-border)]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  s.enabled[kind] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </Section>

      <Section title={t('settings.hooks.configFileSection')}>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-2">
          {t('settings.hooks.configFileDesc')}
        </p>
        <div className="text-[11px] font-mono text-[var(--pd-color-text-secondary)] break-all rounded-md border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] px-3 py-2">
          ~/.pandacc/hooks.json
        </div>
        <p className="text-[10px] text-[var(--pd-color-text-tertiary)] mt-2">
          {t('settings.hooks.editHint')}
        </p>
      </Section>

      <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-6">
        {t('settings.hooks.savedHint')}
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

export default PdHooksSettings;
