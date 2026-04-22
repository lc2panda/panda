// Input: label (string), description? (string), children (ReactNode)
// Output: A labeled setting row with description and control slot
// Pos: settings/SettingRow — shared layout primitive for all settings tabs

import React from 'react';

export interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => (
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
