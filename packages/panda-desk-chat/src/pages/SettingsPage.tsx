// Input: useI18n, tab components from settings/
// Output: 多标签设置页面 — General/Appearance/Providers/Shortcuts/About
// Pos: 设置页面路由，管理应用配置（Tab 组件已拆分至 settings/ 目录）

import React, { useState } from 'react';
import { PdButton } from '../components/atoms/PdButton';
import { useI18n } from '../hooks/useI18n';
import { GeneralTab, AppearanceTab, ProvidersTab, ShortcutsTab, AboutTab } from './settings';

export interface SettingsPageProps {
  className?: string;
  onClose?: () => void;
}

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
