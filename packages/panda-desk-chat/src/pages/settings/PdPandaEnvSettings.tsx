// Input: bridge.getPandaEnv() / setPandaEnv() — ~/.pandacc/settings.json env 字段读写
// Output: 22 个 PANDA_* 环境变量配置 UI（功能/Agent/Cache/OAuth/Skill 5 组）
// Pos: Settings tab — Comdr 指令: 新增 panda 配置 sub-tab，对齐 README §1.4。
//
// Comdr 指令: 实接 ~/.pandacc/settings.json，每个变量对应 toggle / number / select / text 组件。
//   merge-write 不覆盖其它字段（permissions / attribution）。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { getPandaEnv, setPandaEnv } from '../../ipc/bridge';

// ─── 22 个变量定义 — 单一真相源 ───────────────────────────────────────────────

type EnvKind = 'toggle' | 'number' | 'select' | 'text';

interface EnvVarSpec {
  key: string;
  kind: EnvKind;
  defaultValue?: string;
  options?: string[]; // for select
  placeholder?: string; // for text
}

const FUNC_VARS: EnvVarSpec[] = [
  { key: 'PANDA_SECURITY_RESEARCH', kind: 'toggle' },
  { key: 'PANDA_HIDE_CONTEXT_WARNING', kind: 'toggle' },
  { key: 'PANDA_NO_AUTO_COLLAPSE', kind: 'toggle' },
  { key: 'PANDA_SHOW_DEVBAR', kind: 'toggle' },
  { key: 'PANDA_DEBUG', kind: 'toggle' },
  { key: 'PANDA_THEME', kind: 'select', options: ['', 'matrix'] },
  { key: 'PANDA_CONFIG_DIR', kind: 'text', placeholder: '~/.pandacc' },
  { key: 'PANDA_MODEL_ROUTING', kind: 'toggle' },
  { key: 'PANDA_CONTEXT_COLLAPSE', kind: 'toggle' },
];

const AGENT_VARS: EnvVarSpec[] = [
  { key: 'PANDA_AGENT_MAX_TURNS', kind: 'number', defaultValue: '10' },
  { key: 'PANDA_AGENT_PER_TURN_LIMIT', kind: 'number', defaultValue: '2' },
  { key: 'PANDA_AGENT_TIMEOUT_MS', kind: 'number', defaultValue: '0' },
  { key: 'PANDA_FORK_TIMEOUT_MS', kind: 'number', defaultValue: '0' },
  { key: 'PANDA_AGENT_MAX_OUTPUT_TOKENS', kind: 'number', defaultValue: '65536' },
];

const CACHE_VARS: EnvVarSpec[] = [
  { key: 'PANDA_CACHE_TEXT_KEEP_LAST', kind: 'number', defaultValue: '5' },
  { key: 'PANDA_CACHE_TEXT_MIN_SIZE', kind: 'number', defaultValue: '1500' },
  { key: 'PANDA_FORCE_CACHE_STRATEGY', kind: 'select', options: ['', 'explicit', 'implicit', 'none'] },
];

const OAUTH_VARS: EnvVarSpec[] = [
  { key: 'PANDA_OAUTH_CA_FILE', kind: 'text', placeholder: '/path/to/cert.pem' },
  { key: 'PANDA_PROXY_DEBUG', kind: 'toggle' },
  { key: 'PANDA_CODEX_DEFAULT_MODEL', kind: 'text', placeholder: 'gpt-5-codex' },
  { key: 'PANDA_CODEX_ALLOW_CODEX_MODEL', kind: 'toggle' },
  { key: 'PANDA_PROVIDER', kind: 'select', options: ['', 'openai'] },
];

const SKILL_VARS: EnvVarSpec[] = [
  { key: 'PANDA_SKILL_LEARNING_TEST', kind: 'toggle' },
];

const ALL_VARS = [...FUNC_VARS, ...AGENT_VARS, ...CACHE_VARS, ...OAUTH_VARS, ...SKILL_VARS];

// ─── Component ───────────────────────────────────────────────────────────────

export function PdPandaEnvSettings() {
  const [env, setEnv] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});

  const reload = async () => {
    setIsLoading(true);
    try {
      const data = await getPandaEnv();
      setEnv(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const writeKey = async (key: string, value: string | null) => {
    setSavingKey(key);
    const next = { ...env };
    if (value === null || value === '') {
      delete next[key];
    } else {
      next[key] = value;
    }
    setEnv(next);
    try {
      const result = await setPandaEnv(key, value === '' ? null : value);
      if (!result.ok) {
        setErrorByKey((e) => ({ ...e, [key]: result.error }));
      } else {
        setErrorByKey((e) => {
          if (!(key in e)) return e;
          const c = { ...e };
          delete c[key];
          return c;
        });
      }
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-4xl" data-tab="pandaEnv">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
            {t('settings.pandaEnv.title')}
          </h2>
          <p className="text-sm text-[var(--pd-color-text-tertiary)]">
            {t('settings.pandaEnv.description')}
          </p>
        </div>
        <button
          onClick={() => void reload()}
          className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--pd-color-text-secondary)] border border-[var(--pd-color-border)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">refresh</span>
          {t('settings.pandaEnv.refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-5 h-5 border-2 border-[var(--pd-color-brand)] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-5">
          <Group title={t('settings.pandaEnv.group.func')} icon="tune">
            {FUNC_VARS.map((spec) => (
              <EnvVarRow
                key={spec.key}
                spec={spec}
                value={env[spec.key]}
                onChange={(v) => void writeKey(spec.key, v)}
                saving={savingKey === spec.key}
                error={errorByKey[spec.key]}
              />
            ))}
          </Group>

          <Group title={t('settings.pandaEnv.group.agent')} icon="smart_toy">
            {AGENT_VARS.map((spec) => (
              <EnvVarRow
                key={spec.key}
                spec={spec}
                value={env[spec.key]}
                onChange={(v) => void writeKey(spec.key, v)}
                saving={savingKey === spec.key}
                error={errorByKey[spec.key]}
              />
            ))}
          </Group>

          <Group title={t('settings.pandaEnv.group.cache')} icon="memory">
            {CACHE_VARS.map((spec) => (
              <EnvVarRow
                key={spec.key}
                spec={spec}
                value={env[spec.key]}
                onChange={(v) => void writeKey(spec.key, v)}
                saving={savingKey === spec.key}
                error={errorByKey[spec.key]}
              />
            ))}
          </Group>

          <Group title={t('settings.pandaEnv.group.oauth')} icon="vpn_key">
            {OAUTH_VARS.map((spec) => (
              <EnvVarRow
                key={spec.key}
                spec={spec}
                value={env[spec.key]}
                onChange={(v) => void writeKey(spec.key, v)}
                saving={savingKey === spec.key}
                error={errorByKey[spec.key]}
              />
            ))}
          </Group>

          <Group title={t('settings.pandaEnv.group.skill')} icon="auto_awesome">
            {SKILL_VARS.map((spec) => (
              <EnvVarRow
                key={spec.key}
                spec={spec}
                value={env[spec.key]}
                onChange={(v) => void writeKey(spec.key, v)}
                saving={savingKey === spec.key}
                error={errorByKey[spec.key]}
              />
            ))}
          </Group>

          <div className="text-[11px] text-[var(--pd-color-text-tertiary)] py-2">
            {t('settings.pandaEnv.coverage', {
              count: String(ALL_VARS.length),
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub components ──────────────────────────────────────────────────────────

function Group({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] overflow-hidden">
      <div className="border-b border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[var(--pd-color-brand)]">
            {icon}
          </span>
          <h4 className="text-sm font-semibold text-[var(--pd-color-text-primary)]">{title}</h4>
        </div>
      </div>
      <div className="divide-y divide-[var(--pd-color-border)]">{children}</div>
    </section>
  );
}

function EnvVarRow({
  spec,
  value,
  onChange,
  saving,
  error,
}: {
  spec: EnvVarSpec;
  value: string | undefined;
  onChange: (newValue: string) => void;
  saving: boolean;
  error?: string;
}) {
  const labelKey = `settings.pandaEnv.${spec.key}.label`;
  const descKey = `settings.pandaEnv.${spec.key}.description`;

  return (
    <div className="px-4 py-3" data-env-key={spec.key}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[var(--pd-color-text-primary)]">
              {t(labelKey)}
            </span>
            <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)] border border-[var(--pd-color-border)]">
              {spec.key}
            </code>
            {saving && (
              <span className="text-[10px] text-[var(--pd-color-text-tertiary)]">
                {t('settings.pandaEnv.saving')}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[var(--pd-color-text-tertiary)]">
            {t(descKey)}
          </p>
          {error && (
            <p className="mt-1 text-[11px] text-[var(--pd-color-error)]">{error}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {spec.kind === 'toggle' && (
            <ToggleControl
              checked={value === '1' || value === 'true'}
              onChange={(c) => onChange(c ? '1' : '')}
            />
          )}
          {spec.kind === 'number' && (
            <input
              type="number"
              value={value ?? ''}
              placeholder={spec.defaultValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-24 rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2 py-1.5 text-sm text-[var(--pd-color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pd-color-brand)]"
            />
          )}
          {spec.kind === 'select' && (
            <select
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-32 rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2 py-1.5 text-sm text-[var(--pd-color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pd-color-brand)]"
            >
              {(spec.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt === '' ? t('settings.pandaEnv.unset') : opt}
                </option>
              ))}
            </select>
          )}
          {spec.kind === 'text' && (
            <input
              type="text"
              value={value ?? ''}
              placeholder={spec.placeholder}
              onChange={(e) => onChange(e.target.value)}
              className="w-56 rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2 py-1.5 text-sm text-[var(--pd-color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pd-color-brand)]"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleControl({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-color-brand)] focus-visible:ring-offset-2 ${
        checked ? 'bg-[var(--pd-color-brand)]' : 'bg-[var(--pd-color-surface-container-high)]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
