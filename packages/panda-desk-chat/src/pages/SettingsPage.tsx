// Input: settingsStore, providerStore, useI18n, useTheme
// Output: 多标签设置页面 — General/Appearance/Providers/Shortcuts/About
// Pos: 设置页面路由，管理应用配置

import React, { useState, useCallback } from 'react';
import { PdTabs } from '../components/containers/PdTabs';
import { PdButton } from '../components/atoms/PdButton';
import { PdInput } from '../components/atoms/PdInput';
import { PdSelect } from '../components/atoms/PdSelect';
import { PdSwitch } from '../components/atoms/PdSwitch';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import { useProviderStore } from '../stores/providerStore';

export interface SettingsPageProps {
  className?: string;
  onClose?: () => void;
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'var(--pd-space-3) 0',
    borderBottom: '1px solid var(--pd-border)',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--pd-text-primary)' }}>{label}</div>
      {description && <div style={{ fontSize: '0.75rem', color: 'var(--pd-text-tertiary)', marginTop: '2px' }}>{description}</div>}
    </div>
    <div style={{ marginLeft: 'var(--pd-space-3)' }}>{children}</div>
  </div>
);

const GeneralTab: React.FC = () => {
  const { t, locale, setLocale } = useI18n();
  const { resetSettings } = useSettingsStore();
  return (
    <div>
      <SettingRow label={t('settings.language')} description={t('settings.languageDesc')}>
        <PdSelect value={locale} onChange={(v: string) => setLocale(v)} options={[
          { value: 'en', label: 'English' },
          { value: 'zh', label: '中文' },
          { value: 'ja', label: '日本語' },
          { value: 'ko', label: '한국어' },
        ]} />
      </SettingRow>
      <SettingRow label={t('settings.reset')} description={t('settings.resetDesc')}>
        <PdButton variant="danger" size="sm" onClick={resetSettings}>{t('settings.resetBtn')}</PdButton>
      </SettingRow>
    </div>
  );
};

const AppearanceTab: React.FC = () => {
  const { t } = useI18n();
  const { mode, setMode } = useTheme();
  const { fontSize, setFontSize } = useSettingsStore();
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

const ProvidersTab: React.FC = () => {
  const { t } = useI18n();
  const { providers, setProviders } = useProviderStore();
  return (
    <div>
      {(providers || []).map((p: any) => (
        <SettingRow key={p.id} label={p.name} description={p.endpoint || ''}>
          <PdInput
            type="password"
            placeholder={t('settings.apiKeyPlaceholder')}
            value={p.apiKey || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const updated = (providers || []).map((pr: any) =>
                pr.id === p.id ? { ...pr, apiKey: e.target.value } : pr
              );
              setProviders(updated);
            }}
            style={{ width: 200 }}
          />
        </SettingRow>
      ))}
      {(!providers || providers.length === 0) && (
        <div style={{ padding: 'var(--pd-space-4)', color: 'var(--pd-text-tertiary)', textAlign: 'center' }}>
          {t('settings.noProviders')}
        </div>
      )}
    </div>
  );
};

const ShortcutsTab: React.FC = () => {
  const { t } = useI18n();
  const shortcuts = [
    { key: '⌘K', action: t('commands.commandPalette') },
    { key: '⌘P', action: t('commands.switchSession') },
    { key: '⌘B', action: t('commands.toggleSidebar') },
    { key: '⌘\\', action: t('commands.toggleInspector') },
    { key: '⌘N', action: t('commands.newChat') },
  ];
  return (
    <div>
      {shortcuts.map((s) => (
        <SettingRow key={s.key} label={s.action}>
          <kbd style={{
            padding: '2px 8px', borderRadius: 4,
            background: 'var(--pd-bg-tertiary)', color: 'var(--pd-text-secondary)',
            fontSize: '0.75rem', fontFamily: 'var(--pd-font-mono)',
            border: '1px solid var(--pd-border)',
          }}>{s.key}</kbd>
        </SettingRow>
      ))}
    </div>
  );
};

const AboutTab: React.FC = () => {
  const { t } = useI18n();
  return (
    <div style={{ padding: 'var(--pd-space-4)', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--pd-text-primary)' }}>🐼 Panda Code</div>
      <div style={{ fontSize: '0.875rem', color: 'var(--pd-text-secondary)', marginTop: 'var(--pd-space-2)' }}>
        {t('settings.aboutDesc')}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--pd-text-tertiary)', marginTop: 'var(--pd-space-3)' }}>
        v2.21.19 • Built with 🎋
      </div>
    </div>
  );
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ className, onClose }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: t('settings.tabGeneral'), content: <GeneralTab /> },
    { id: 'appearance', label: t('settings.tabAppearance'), content: <AppearanceTab /> },
    { id: 'providers', label: t('settings.tabProviders'), content: <ProvidersTab /> },
    { id: 'shortcuts', label: t('settings.tabShortcuts'), content: <ShortcutsTab /> },
    { id: 'about', label: t('settings.tabAbout'), content: <AboutTab /> },
  ];

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={`pd-settings-page ${className ?? ''}`} style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--pd-bg-primary)', color: 'var(--pd-text-primary)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--pd-space-3) var(--pd-space-4)',
        borderBottom: '1px solid var(--pd-border)',
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('settings.title')}</h2>
        {onClose && <PdButton variant="ghost" size="sm" onClick={onClose}>✕</PdButton>}
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--pd-border)', padding: '0 var(--pd-space-4)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: 'var(--pd-space-2) var(--pd-space-3)',
              fontSize: '0.8125rem',
              color: activeTab === tab.id ? 'var(--pd-accent)' : 'var(--pd-text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--pd-accent)' : '2px solid transparent',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >{tab.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--pd-space-4)' }}>
        {activeContent}
      </div>
    </div>
  );
};

export default SettingsPage;
