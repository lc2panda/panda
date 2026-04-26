// Input: localStorage 'panda-desk:settings.outputStyles' + UI 交互
// Output: Output Styles 选择面板 — panda src/outputStyles/ 内置风格单选
// Pos: Settings sub-tab — pendingSettingsTab='outputStyles' 路由目标
//
// Comdr 指令: panda 独有能力补齐 — Group 2（panda src/outputStyles 桥接）
//   预期数据源：~/.pandacc/output-styles/<name>.md + panda 内置 markdown 文件
//   panda 后端 IPC 暂未提供 outputStyles 列表/选择接口 → 用 localStorage stub + 内置候选 + TODO 注释。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';

const STORAGE_KEY = 'panda-desk:settings.outputStyles';

interface StyleMeta {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  builtin: boolean;
}

// 内置风格列表（panda src/outputStyles/loadOutputStylesDir.ts 默认装载的 builtin styles）
const BUILTIN_STYLES: StyleMeta[] = [
  { id: 'default', icon: 'auto_fix', titleKey: 'settings.outputStyles.style.default.title', descKey: 'settings.outputStyles.style.default.desc', builtin: true },
  { id: 'concise', icon: 'short_text', titleKey: 'settings.outputStyles.style.concise.title', descKey: 'settings.outputStyles.style.concise.desc', builtin: true },
  { id: 'verbose', icon: 'subject', titleKey: 'settings.outputStyles.style.verbose.title', descKey: 'settings.outputStyles.style.verbose.desc', builtin: true },
  { id: 'explanatory', icon: 'school', titleKey: 'settings.outputStyles.style.explanatory.title', descKey: 'settings.outputStyles.style.explanatory.desc', builtin: true },
  { id: 'learning', icon: 'menu_book', titleKey: 'settings.outputStyles.style.learning.title', descKey: 'settings.outputStyles.style.learning.desc', builtin: true },
];

interface OutputStylesSettings {
  selectedStyle: string;
}

const DEFAULTS: OutputStylesSettings = { selectedStyle: 'default' };

function load(): OutputStylesSettings {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<OutputStylesSettings>) };
  } catch {
    return DEFAULTS;
  }
}

function save(s: OutputStylesSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

export function PdOutputStylesSettings() {
  const [s, setS] = useState<OutputStylesSettings>(() => load());

  useEffect(() => {
    save(s);
  }, [s]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.outputStyles.title')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-6">
        {t('settings.outputStyles.description')}
      </p>

      <Section title={t('settings.outputStyles.builtinSection')}>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-2">
          {t('settings.outputStyles.builtinDesc')}
        </p>
        <div className="space-y-2">
          {BUILTIN_STYLES.map((style) => {
            const isSelected = s.selectedStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setS({ selectedStyle: style.id })}
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  isSelected
                    ? 'border-[var(--pd-color-brand)] bg-[var(--pd-color-primary-fixed)]/40 shadow-sm'
                    : 'border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] hover:bg-[var(--pd-color-surface-hover)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined text-[20px] ${
                      isSelected ? 'text-[var(--pd-color-brand)]' : 'text-[var(--pd-color-text-tertiary)]'
                    }`}
                  >
                    {style.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-semibold ${
                          isSelected ? 'text-[var(--pd-color-brand)]' : 'text-[var(--pd-color-text-primary)]'
                        }`}
                      >
                        {t(style.titleKey)}
                      </div>
                      {style.builtin && (
                        <span className="text-[9px] uppercase tracking-wider rounded-full px-1.5 py-0.5 border border-[var(--pd-color-border)] text-[var(--pd-color-text-tertiary)]">
                          {t('settings.outputStyles.builtinBadge')}
                        </span>
                      )}
                      {isSelected && (
                        <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-[var(--pd-color-brand)]">
                          check_circle
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-[var(--pd-color-text-tertiary)] leading-relaxed">
                      {t(style.descKey)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t('settings.outputStyles.customSection')}>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-2">
          {t('settings.outputStyles.customDesc')}
        </p>
        <div className="text-[11px] font-mono text-[var(--pd-color-text-secondary)] break-all rounded-md border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] px-3 py-2">
          ~/.pandacc/output-styles/
        </div>
      </Section>

      <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-6">
        {t('settings.outputStyles.savedHint')}
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

export default PdOutputStylesSettings;
