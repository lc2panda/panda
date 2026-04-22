// Input: useTheme (mode, setMode), settingsStore (fontSize, setFontSize), useI18n (t)
// Output: Appearance settings panel — theme mode selector, font size selector
// Pos: settings/AppearanceTab — second tab in SettingsPage

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PdSelect } from '../../components/atoms/PdSelect';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { SettingRow } from './SettingRow';

export const AppearanceTab: React.FC = () => {
  const { t } = useI18n();
  const { mode, setMode } = useTheme();
  const { fontSize, setFontSize } = useSettingsStore(
    useShallow((s) => ({ fontSize: s.fontSize, setFontSize: s.setFontSize })),
  );
  return (
    <div>
      <SettingRow label={t('settings.theme')} description={t('settings.themeDesc')}>
        <PdSelect value={mode} onChange={(v: string) => setMode(v as any)} options={[
          { value: 'light', label: t('settings.themeLight') },
          { value: 'dark', label: t('settings.themeDark') },
          { value: 'system', label: t('settings.themeSystem') },
          { value: 'matrix', label: 'Matrix' },
        ]} />
      </SettingRow>
      <SettingRow label={t('settings.fontSize')}>
        <PdSelect value={String(fontSize || 14)} onChange={(v: string) => setFontSize(Number(v))} options={[
          { value: '12', label: '12px' },
          { value: '13', label: '13px' },
          { value: '14', label: '14px' },
          { value: '15', label: '15px' },
          { value: '16', label: '16px' },
        ]} />
      </SettingRow>
    </div>
  );
};
