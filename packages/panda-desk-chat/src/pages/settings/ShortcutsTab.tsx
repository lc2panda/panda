// Input: useI18n (t)
// Output: Keyboard shortcuts reference panel
// Pos: settings/ShortcutsTab — fourth tab in SettingsPage

import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { SettingRow } from './SettingRow';

export const ShortcutsTab: React.FC = () => {
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
