// Input: providerStore (providers, setProviders), useI18n (t)
// Output: Provider configuration panel — API key inputs per provider
// Pos: settings/ProvidersTab — third tab in SettingsPage

import React from 'react';
import { PdInput } from '../../components/atoms/PdInput';
import { useI18n } from '../../hooks/useI18n';
import { useProviderStore } from '../../stores/providerStore';
import { SettingRow } from './SettingRow';

export const ProvidersTab: React.FC = () => {
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
