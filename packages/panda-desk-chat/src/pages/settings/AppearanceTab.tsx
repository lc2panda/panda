// Input: useTheme (mode, setMode), settingsStore (fontSize, setFontSize), useI18n (t)
// Output: Appearance settings panel with theme selector and font-size slider
// Pos: settings/AppearanceTab — Appearance tab inside SettingsPage
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useI18n } from '../../hooks/useI18n';
import { SettingRow } from './SettingRow';
import { PdSegmentedControl } from '../../components/special/PdSegmentedControl';

export const AppearanceTab: React.FC = () => {
  const { t } = useI18n();
  const { mode, setMode } = useTheme();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);

  const themeOptions = [
    { value: 'light',  label: `☀️ ${t('settings.theme.light')}` },
    { value: 'dark',   label: `🌙 ${t('settings.theme.dark')}` },
    { value: 'system', label: `💻 ${t('settings.theme.system')}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pd-space-2)' }}>
      {/* Theme selector */}
      <SettingRow label={t('settings.theme')} description={t('settings.themeDesc')}>
        <PdSegmentedControl
          options={themeOptions}
          value={mode}
          onChange={(v) => setMode(v as 'light' | 'dark' | 'system')}
        />
      </SettingRow>

      {/* Font size */}
      <SettingRow label={t('settings.fontSize')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pd-space-2)' }}>
          <input
            type="range"
            min={12}
            max={20}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--pd-text-secondary)',
            minWidth: '3ch',
            textAlign: 'right',
          }}>
            {fontSize}
          </span>
        </div>
      </SettingRow>
    </div>
  );
};
