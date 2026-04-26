// Input: settingsStore (effort/locale/theme/skipWebFetchPreflight setters)
// Output: 4 sections — Appearance · Language · Effort · Web fetch preflight checkbox
// Pos: Settings tab — third entry (icon: tune)
//
// Source 1:1: cc-haha desktop/src/pages/Settings.tsx L724-L836 (GeneralSettings)
//   panda i18n 多 ja/ko；保留 cc-haha 的 LANGUAGES 列表 + 扩展。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { t } from '../../i18n';
import { useSettingsStore, type Theme } from '../../stores/settingsStore';
import type { EffortLevel, ThemeMode } from '../../types/settings';
import type { Locale } from '../../i18n';

export function PdGeneralSettings() {
  const effortLevel = useSettingsStore((s) => s.effortLevel);
  const setEffort = useSettingsStore((s) => s.setEffort);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const skipWebFetchPreflight = useSettingsStore((s) => s.skipWebFetchPreflight);
  const setSkipWebFetchPreflight = useSettingsStore(
    (s) => s.setSkipWebFetchPreflight,
  );

  const EFFORT_LABELS: Record<EffortLevel, string> = {
    low: t('settings.general.effort.low'),
    medium: t('settings.general.effort.medium'),
    high: t('settings.general.effort.high'),
    max: t('settings.general.effort.max'),
    // panda 兼容：'minimal' 历史字面量复用 low 文案
    minimal: t('settings.general.effort.low'),
  };

  // Comdr 指令: 仅支持 zh/en，去掉 ja/ko
  const LANGUAGES: Array<{ value: Locale; label: string }> = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
  ];

  const THEMES: Array<{ value: ThemeMode; label: string }> = [
    { value: 'light', label: t('settings.general.appearance.light') },
    { value: 'dark', label: t('settings.general.appearance.dark') },
  ];

  return (
    <div className="max-w-xl">
      {/* Appearance selector */}
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.general.appearanceTitle')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-3">
        {t('settings.general.appearanceDescription')}
      </p>
      <div className="flex gap-2 mb-8">
        {THEMES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value as Theme)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
              theme === value
                ? 'bg-[image:var(--pd-gradient-btn-primary)] text-[var(--pd-color-btn-primary-fg)] border-transparent shadow-[var(--pd-shadow-button-primary)]'
                : 'border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Language selector */}
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.general.languageTitle')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-3">
        {t('settings.general.languageDescription')}
      </p>
      <div className="flex gap-2 mb-8">
        {LANGUAGES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setLocale(value)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
              locale === value
                ? 'bg-[var(--pd-color-brand)] text-white border-[var(--pd-color-brand)]'
                : 'border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Effort Level */}
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.general.effortTitle')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-3">
        {t('settings.general.effortDescription')}
      </p>
      <div className="flex gap-2">
        {(['low', 'medium', 'high', 'max'] as EffortLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => void setEffort(level)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
              effortLevel === level
                ? 'bg-[var(--pd-color-brand)] text-white border-[var(--pd-color-brand)]'
                : 'border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
            }`}
          >
            {EFFORT_LABELS[level]}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
          {t('settings.general.webFetchPreflightTitle')}
        </h2>
        <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-3">
          {t('settings.general.webFetchPreflightDescription')}
        </p>
        <label className="flex items-start gap-3 rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-4 py-3 cursor-pointer hover:border-[var(--pd-color-border-focus)] transition-colors">
          <input
            type="checkbox"
            aria-label={t('settings.general.webFetchPreflightEnabled')}
            checked={skipWebFetchPreflight}
            onChange={(e) => void setSkipWebFetchPreflight(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--pd-color-border)] text-[var(--pd-color-brand)] focus:ring-[var(--pd-color-brand)]"
          />
          <div className="min-w-0">
            <div className="text-sm font-medium text-[var(--pd-color-text-primary)]">
              {t('settings.general.webFetchPreflightEnabled')}
            </div>
            <div className="text-xs text-[var(--pd-color-text-tertiary)] mt-1 leading-5">
              {t('settings.general.webFetchPreflightHint')}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
