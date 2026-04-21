// Input: Settings state from stores
// Output: Settings configuration UI
// Pos: Page layer — accessible from sidebar

import { useSettingsStore } from '../stores';
import { PdButton } from '../components/atoms/PdButton';

const themes = ['light', 'dark', 'system'] as const;
const permissionModes = ['ask', 'auto-allow', 'auto-deny'] as const;
const locales = ['en', 'zh'] as const;

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { theme, fontSize, locale, permissionMode, setTheme, setFontSize, setLocale, setPermissionMode } = useSettingsStore();

  return (
    <div style={{ padding: '24px', maxWidth: 640, margin: '0 auto', color: 'var(--pd-color-fg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <PdButton variant="ghost" size="sm" onClick={onBack}>← Back</PdButton>
        <h1 style={{ fontSize: 'var(--pd-text-xl)', fontWeight: 600, margin: 0 }}>Settings</h1>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <Row label="Theme">
          <div style={{ display: 'flex', gap: 8 }}>
            {themes.map((t) => (
              <PdButton key={t} variant={theme === t ? 'primary' : 'secondary'} size="sm" onClick={() => setTheme(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </PdButton>
            ))}
          </div>
        </Row>
        <Row label="Font Size">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min={12} max={20} step={1} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--pd-color-accent)' }} />
            <span style={{ fontFamily: 'var(--pd-font-mono)', fontSize: 'var(--pd-text-sm)', minWidth: 36 }}>{fontSize}px</span>
          </div>
        </Row>
        <Row label="Language">
          <select value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'zh')}
            style={{ padding: '6px 12px', borderRadius: 'var(--pd-radius-md)', border: '1px solid var(--pd-color-border)', background: 'var(--pd-color-bg-subtle)', color: 'var(--pd-color-fg)', fontSize: 'var(--pd-text-sm)' }}>
            {locales.map((l) => <option key={l} value={l}>{l === 'en' ? 'English' : '中文'}</option>)}
          </select>
        </Row>
      </Section>

      {/* Permissions */}
      <Section title="Permissions">
        <Row label="Tool Permission Mode">
          <select value={permissionMode} onChange={(e) => setPermissionMode(e.target.value as any)}
            style={{ padding: '6px 12px', borderRadius: 'var(--pd-radius-md)', border: '1px solid var(--pd-color-border)', background: 'var(--pd-color-bg-subtle)', color: 'var(--pd-color-fg)', fontSize: 'var(--pd-text-sm)' }}>
            {permissionModes.map((m) => <option key={m} value={m}>{m === 'ask' ? 'Ask Every Time' : m === 'auto-allow' ? 'Auto Allow' : 'Auto Deny'}</option>)}
          </select>
        </Row>
      </Section>

      {/* Provider */}
      <Section title="Provider">
        <Row label="API Key">
          <input type="password" placeholder="sk-ant-..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--pd-radius-md)', border: '1px solid var(--pd-color-border)', background: 'var(--pd-color-bg-subtle)', color: 'var(--pd-color-fg)', fontFamily: 'var(--pd-font-mono)', fontSize: 'var(--pd-text-sm)' }} />
        </Row>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 'var(--pd-text-lg)', fontWeight: 600, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--pd-color-border)' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <label style={{ fontSize: 'var(--pd-text-sm)', color: 'var(--pd-color-fg-muted)', minWidth: 140 }}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
