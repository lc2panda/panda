// Input: useI18n, tab components from settings/
// Output: 两栏设置页 — 左 nav · 右内容（cc-haha style）
// Pos: 设置页面路由
// Reference: cc-haha/src/pages/SettingsTab layout (design spec only, not source)

import React, { useState, type ComponentType } from 'react';
import {
  X as _X,
  // @ts-ignore lucide-react bundled .d.ts misses these top-level icons
  Sliders as _Sliders,
  // @ts-ignore
  Palette as _Palette,
  // @ts-ignore
  Server as _Server,
  // @ts-ignore
  Keyboard as _Keyboard,
  // @ts-ignore
  Info as _Info,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { useI18n } from '../hooks/useI18n';
import { GeneralTab, AppearanceTab, ProvidersTab, ShortcutsTab, AboutTab } from './settings';

type IconFC = ComponentType<{ className?: string; size?: number }>;
const Sliders = _Sliders as IconFC;
const Palette = _Palette as IconFC;
const Server = _Server as IconFC;
const Keyboard = _Keyboard as IconFC;
const Info = _Info as IconFC;
const X = _X as IconFC;

export interface SettingsPageProps {
  className?: string;
  onClose?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ className, onClose }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('general');

  // Top tabs (sit above About in sidebar)
  const topTabs: Array<{ id: string; label: string; icon: IconFC; content: React.ReactNode }> = [
    { id: 'providers', label: t('settings.tabProviders'), icon: Server, content: <ProvidersTab /> },
    { id: 'general', label: t('settings.tabGeneral'), icon: Sliders, content: <GeneralTab /> },
    { id: 'appearance', label: t('settings.tabAppearance'), icon: Palette, content: <AppearanceTab /> },
    { id: 'shortcuts', label: t('settings.tabShortcuts'), icon: Keyboard, content: <ShortcutsTab /> },
  ];
  const aboutTab = { id: 'about', label: t('settings.tabAbout'), icon: Info, content: <AboutTab /> };
  const allTabs = [...topTabs, aboutTab];
  const activeContent = allTabs.find((tab) => tab.id === activeTab)?.content;

  const renderNavItem = (tab: typeof topTabs[number]) => {
    const isActive = activeTab === tab.id;
    const Icon = tab.icon;
    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => setActiveTab(tab.id)}
        className={cn(
          'w-full px-4 py-2.5 flex items-center gap-2.5 text-left rounded-[8px]',
          'text-[14px] transition-colors duration-150',
          isActive
            ? 'bg-[var(--pd-color-bg-selected)] text-[var(--pd-color-fg)] font-[var(--pd-font-medium)]'
            : 'text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
        )}
      >
        <Icon size={18} />
        <span className="truncate">{tab.label}</span>
      </button>
    );
  };

  return (
    <div
      className={cn('flex h-full', className)}
      style={{ background: 'var(--pd-color-bg)', color: 'var(--pd-color-fg)' }}
    >
      {/* Left nav — 180px bg surface border-right (cc-haha 规格) */}
      <aside
        className="flex shrink-0 flex-col border-r border-[var(--pd-color-border)]"
        style={{ width: 180, background: 'var(--pd-color-bg)' }}
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--pd-color-border)]">
          <h2 className="text-[14px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
            {t('settings.title')}
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="h-6 w-6 rounded-md flex items-center justify-center text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {topTabs.map(renderNavItem)}
        </nav>
        <div className="border-t border-[var(--pd-color-border)] p-2">
          {renderNavItem(aboutTab)}
        </div>
      </aside>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[920px] mx-auto px-8 py-6">
          {activeContent}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
