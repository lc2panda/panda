// Input: useI18n (t)
// Output: About panel — app name, description, version
// Pos: settings/AboutTab — fifth tab in SettingsPage

import React from 'react';
import { useI18n } from '../../hooks/useI18n';

export const AboutTab: React.FC = () => {
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
