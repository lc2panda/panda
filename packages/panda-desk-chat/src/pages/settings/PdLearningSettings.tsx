// Input: localStorage 'panda-desk:settings.learning' + UI 交互
// Output: 学习助手 settings sub-tab — 4 个子区块（写作 / 知识 / 学习 / 输出风格）
// Pos: Settings sub-tab — pendingSettingsTab='learning' 路由目标
//
// Comdr 指令: 学习助手 + Output Styles 重组 — panda 自有 settings sub-tab，
//   覆盖 README §3.4 的「写作助理 / 知识管理 / 学习助理」三大流程 + 内嵌 Output Styles 单选。
//   panda 后端 IPC 暂未提供 learning 配置端点 → 全部 localStorage stub + TODO 注释。
//   Output Styles 子区块复刻 PdOutputStylesSettings 的内置风格列表（同源 STORAGE_KEY 'panda-desk:settings.outputStyles'）
//   以保证用户在两处均可见到同一选择，迁移期 zero-loss。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';

// ────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'panda-desk:settings.learning';
const OUTPUT_STYLES_STORAGE_KEY = 'panda-desk:settings.outputStyles';

interface LearningSettings {
  // 写作助理
  writeOutputFormat: 'markdown' | 'plain' | 'docx';
  writeDraftDir: string;
  writeAutoCompile: boolean;
  // 知识管理
  paraRootDir: string;
  captureAutoArchive: boolean;
  captureTagSuggestion: boolean;
  // 学习助理
  fsrsRequestedRetention: number;
  fsrsMaximumInterval: number;
  reviewReminderDaily: boolean;
  learnPlanDir: string;
}

const DEFAULTS: LearningSettings = {
  writeOutputFormat: 'markdown',
  writeDraftDir: '~/manuscript/',
  writeAutoCompile: false,
  paraRootDir: '~/Documents/PARA/',
  captureAutoArchive: true,
  captureTagSuggestion: true,
  fsrsRequestedRetention: 0.9,
  fsrsMaximumInterval: 365,
  reviewReminderDaily: true,
  learnPlanDir: '~/.pandacc/learn/',
};

function load(): LearningSettings {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<LearningSettings>) };
  } catch {
    return DEFAULTS;
  }
}

function save(s: LearningSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Output Styles — 5 个内置风格（与 PdOutputStylesSettings 同源）
// ────────────────────────────────────────────────────────────────────────────

interface StyleMeta {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
}

const BUILTIN_STYLES: StyleMeta[] = [
  { id: 'default', icon: 'auto_fix', titleKey: 'settings.outputStyles.style.default.title', descKey: 'settings.outputStyles.style.default.desc' },
  { id: 'concise', icon: 'short_text', titleKey: 'settings.outputStyles.style.concise.title', descKey: 'settings.outputStyles.style.concise.desc' },
  { id: 'verbose', icon: 'subject', titleKey: 'settings.outputStyles.style.verbose.title', descKey: 'settings.outputStyles.style.verbose.desc' },
  { id: 'explanatory', icon: 'school', titleKey: 'settings.outputStyles.style.explanatory.title', descKey: 'settings.outputStyles.style.explanatory.desc' },
  { id: 'learning', icon: 'menu_book', titleKey: 'settings.outputStyles.style.learning.title', descKey: 'settings.outputStyles.style.learning.desc' },
];

interface OutputStylesState {
  selectedStyle: string;
}

function loadOutputStyles(): OutputStylesState {
  if (typeof localStorage === 'undefined') return { selectedStyle: 'default' };
  try {
    const raw = localStorage.getItem(OUTPUT_STYLES_STORAGE_KEY);
    if (!raw) return { selectedStyle: 'default' };
    return { selectedStyle: 'default', ...(JSON.parse(raw) as Partial<OutputStylesState>) };
  } catch {
    return { selectedStyle: 'default' };
  }
}

function saveOutputStyles(s: OutputStylesState) {
  try {
    localStorage.setItem(OUTPUT_STYLES_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function PdLearningSettings() {
  const [s, setS] = useState<LearningSettings>(() => load());
  const [styleState, setStyleState] = useState<OutputStylesState>(() => loadOutputStyles());

  useEffect(() => {
    save(s);
  }, [s]);

  useEffect(() => {
    saveOutputStyles(styleState);
  }, [styleState]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.learning.title')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-6">
        {t('settings.learning.description')}
      </p>

      {/* 1) 写作助理 */}
      <Section icon="edit_note" title={t('settings.learning.write.title')} description={t('settings.learning.write.desc')}>
        <Field label={t('settings.learning.write.outputFormat')}>
          <select
            value={s.writeOutputFormat}
            onChange={(e) => setS({ ...s, writeOutputFormat: e.target.value as LearningSettings['writeOutputFormat'] })}
            className="rounded-md border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2 py-1 text-xs text-[var(--pd-color-text-primary)]"
          >
            <option value="markdown">Markdown</option>
            <option value="plain">Plain Text</option>
            <option value="docx">DOCX</option>
          </select>
        </Field>
        <Field label={t('settings.learning.write.draftDir')}>
          <input
            type="text"
            value={s.writeDraftDir}
            onChange={(e) => setS({ ...s, writeDraftDir: e.target.value })}
            className="w-56 rounded-md border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2 py-1 text-xs font-mono text-[var(--pd-color-text-primary)]"
          />
        </Field>
        <Toggle
          label={t('settings.learning.write.autoCompile')}
          description={t('settings.learning.write.autoCompileDesc')}
          checked={s.writeAutoCompile}
          onChange={(v) => setS({ ...s, writeAutoCompile: v })}
        />
      </Section>

      {/* 2) 知识管理 */}
      <Section icon="inventory_2" title={t('settings.learning.capture.title')} description={t('settings.learning.capture.desc')}>
        <Field label={t('settings.learning.capture.paraRoot')}>
          <input
            type="text"
            value={s.paraRootDir}
            onChange={(e) => setS({ ...s, paraRootDir: e.target.value })}
            className="w-56 rounded-md border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2 py-1 text-xs font-mono text-[var(--pd-color-text-primary)]"
          />
        </Field>
        <Toggle
          label={t('settings.learning.capture.autoArchive')}
          description={t('settings.learning.capture.autoArchiveDesc')}
          checked={s.captureAutoArchive}
          onChange={(v) => setS({ ...s, captureAutoArchive: v })}
        />
        <Toggle
          label={t('settings.learning.capture.tagSuggestion')}
          description={t('settings.learning.capture.tagSuggestionDesc')}
          checked={s.captureTagSuggestion}
          onChange={(v) => setS({ ...s, captureTagSuggestion: v })}
        />
      </Section>

      {/* 3) 学习助理 */}
      <Section icon="menu_book" title={t('settings.learning.learn.title')} description={t('settings.learning.learn.desc')}>
        <Field label={t('settings.learning.learn.requestedRetention')}>
          <input
            type="number"
            min={0.7}
            max={0.99}
            step={0.01}
            value={s.fsrsRequestedRetention}
            onChange={(e) => setS({ ...s, fsrsRequestedRetention: Number(e.target.value) })}
            className="w-24 rounded-md border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2 py-1 text-xs text-[var(--pd-color-text-primary)]"
          />
        </Field>
        <Field label={t('settings.learning.learn.maxInterval')}>
          <input
            type="number"
            min={1}
            max={3650}
            step={1}
            value={s.fsrsMaximumInterval}
            onChange={(e) => setS({ ...s, fsrsMaximumInterval: Number(e.target.value) })}
            className="w-24 rounded-md border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2 py-1 text-xs text-[var(--pd-color-text-primary)]"
          />
        </Field>
        <Toggle
          label={t('settings.learning.learn.reviewReminder')}
          description={t('settings.learning.learn.reviewReminderDesc')}
          checked={s.reviewReminderDaily}
          onChange={(v) => setS({ ...s, reviewReminderDaily: v })}
        />
        <Field label={t('settings.learning.learn.planDir')}>
          <input
            type="text"
            value={s.learnPlanDir}
            onChange={(e) => setS({ ...s, learnPlanDir: e.target.value })}
            className="w-56 rounded-md border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-2 py-1 text-xs font-mono text-[var(--pd-color-text-primary)]"
          />
        </Field>
      </Section>

      {/* 4) 输出风格 — 内嵌 PdOutputStylesSettings 的内置风格单选 */}
      <Section icon="style" title={t('settings.learning.outputStyles.title')} description={t('settings.learning.outputStyles.desc')}>
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-2">
          {t('settings.outputStyles.builtinDesc')}
        </p>
        <div className="space-y-2">
          {BUILTIN_STYLES.map((style) => {
            const isSelected = styleState.selectedStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setStyleState({ selectedStyle: style.id })}
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
        <p className="text-[11px] text-[var(--pd-color-text-tertiary)] mt-2">
          {t('settings.outputStyles.savedHint')}
        </p>
      </Section>

      <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-6">
        {t('settings.learning.savedHint')}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-semibold text-[var(--pd-color-text-primary)] mb-1 flex items-center gap-2">
        <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-brand)]">
          {icon}
        </span>
        {title}
      </h3>
      {description && (
        <p className="text-xs text-[var(--pd-color-text-tertiary)] mb-3">{description}</p>
      )}
      <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-4 shadow-sm flex flex-col gap-3">
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-[28px]">
      <span className="text-xs text-[var(--pd-color-text-secondary)]">{label}</span>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-xs text-[var(--pd-color-text-primary)]">{label}</div>
        {description && (
          <div className="text-[11px] text-[var(--pd-color-text-tertiary)] mt-0.5 leading-snug">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-[var(--pd-color-brand)]' : 'bg-[var(--pd-color-border)]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export default PdLearningSettings;
