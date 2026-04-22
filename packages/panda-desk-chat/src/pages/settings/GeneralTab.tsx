// Input: settingsStore (workingDirectory, setWorkingDirectory, loadSettings), useI18n (t, locale, changeLocale)
// Output: General settings panel — language switcher, working directory picker, reset button
// Pos: settings/GeneralTab — first tab in SettingsPage

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PdButton } from '../../components/atoms/PdButton';
import { PdSelect } from '../../components/atoms/PdSelect';
import { PdDirectoryPicker } from '../../components/special/PdDirectoryPicker';
import { useI18n } from '../../hooks/useI18n';
import type { Locale } from '../../i18n';
import { useSettingsStore } from '../../stores/settingsStore';
import { SettingRow } from './SettingRow';

export const GeneralTab: React.FC = () => {
  const { t, locale, changeLocale } = useI18n();
  const { loadSettings, workingDirectory, setWorkingDirectory } = useSettingsStore(
    useShallow((s) => ({
      loadSettings: s.loadSettings,
      workingDirectory: s.workingDirectory,
      setWorkingDirectory: s.setWorkingDirectory,
    })),
  );
  return (
    <div>
      <SettingRow label={t('settings.workingDir')} description={t('settings.workingDirDesc')}>
        <PdDirectoryPicker
          value={workingDirectory}
          onChange={setWorkingDirectory}
          placeholder={t('settings.workingDirPlaceholder')}
        />
      </SettingRow>
      <SettingRow label={t('settings.language')} description={t('settings.languageDesc')}>
        <PdSelect value={locale} onChange={(v: string) => changeLocale(v as Locale)} options={[
          { value: 'en', label: 'English' },
          { value: 'zh', label: '中文' },
          { value: 'ja', label: '日本語' },
          { value: 'ko', label: '한국어' },
        ]} />
      </SettingRow>
      <SettingRow label={t('settings.reset')} description={t('settings.resetDesc')}>
        <PdButton variant="danger" size="sm" onClick={loadSettings}>{t('settings.resetBtn')}</PdButton>
      </SettingRow>
    </div>
  );
};
