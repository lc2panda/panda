// Input: 路由 — useTabStore.activeTabId === SUPER_ASSISTANT_TAB_ID 时挂载
// Output: 超级助手主页 — Hero + 5 张能力卡片 + 底部「前往设置」按钮
// Pos: Page layer — PdContentRouter 'super-assistant' 分支唯一目标
//
// Comdr 指令: panda 自有页面，对应 README §3「超级助手」5 模块；视觉沿用 cc-haha 1:1 token：
//   - 圆角 16 / border 60% / shadow-sm / surface
//   - icon 用 material-symbols-outlined
//   - 无后端：纯文本展示能力，配置入口路由到 settings.superAssistant tab。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React from 'react';
import { useI18n } from '../hooks/useI18n';
import { useTabStore, SETTINGS_TAB_ID } from '../stores/tabStore';
import { useUIStore } from '../stores/uiStore';
import { PdButton } from '../components/shared/PdButton';

interface CapabilityCard {
  icon: string;
  titleKey: string;
  descKey: string;
}

const CAPABILITY_CARDS: CapabilityCard[] = [
  { icon: 'psychology', titleKey: 'superAssistant.memory.title', descKey: 'superAssistant.memory.desc' },
  { icon: 'bolt', titleKey: 'superAssistant.proactive.title', descKey: 'superAssistant.proactive.desc' },
  { icon: 'forum', titleKey: 'superAssistant.passive.title', descKey: 'superAssistant.passive.desc' },
  { icon: 'notifications_active', titleKey: 'superAssistant.channels.title', descKey: 'superAssistant.channels.desc' },
  { icon: 'shield_lock', titleKey: 'superAssistant.privacy.title', descKey: 'superAssistant.privacy.desc' },
];

export const PdSuperAssistant: React.FC = () => {
  const { t } = useI18n();
  const setPendingSettingsTab = useUIStore((s) => s.setPendingSettingsTab);

  const handleGotoSettings = React.useCallback(() => {
    // Comdr 指令: 与 PdSidebar settings 入口同构 — openTab + pendingSettingsTab='superAssistant'
    setPendingSettingsTab('superAssistant');
    useTabStore.getState().openTab(SETTINGS_TAB_ID, t('sidebar.settings'), 'settings');
  }, [setPendingSettingsTab, t]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto w-full max-w-3xl">
          {/* Hero */}
          <header className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)]">
              <span aria-hidden="true" className="material-symbols-outlined text-[28px] text-[var(--pd-color-brand)]">
                auto_awesome
              </span>
            </div>
            <h1
              className="mb-2 text-2xl font-bold tracking-tight text-[var(--pd-color-text-primary)]"
              style={{ fontFamily: 'var(--pd-font-headline)' }}
            >
              {t('superAssistant.title')}
            </h1>
            <p
              className="mx-auto max-w-md text-sm text-[var(--pd-color-text-secondary)]"
              style={{ fontFamily: 'var(--pd-font-body)' }}
            >
              {t('superAssistant.subtitle')}
            </p>
          </header>

          {/* Capability cards 5 张 */}
          <div className="grid gap-3 sm:grid-cols-2">
            {CAPABILITY_CARDS.map((card) => (
              <article
                key={card.titleKey}
                className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2.5">
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[var(--pd-color-brand)]">
                    {card.icon}
                  </span>
                  <h2 className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                    {t(card.titleKey)}
                  </h2>
                </div>
                <p className="text-xs leading-relaxed text-[var(--pd-color-text-secondary)]">
                  {t(card.descKey)}
                </p>
              </article>
            ))}
          </div>

          {/* CTA — 前往设置 */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <PdButton variant="primary" size="lg" onClick={handleGotoSettings}>
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">tune</span>
              {t('superAssistant.gotoSettings')}
            </PdButton>
            <p className="text-xs text-[var(--pd-color-text-tertiary)]">
              {t('superAssistant.gotoHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdSuperAssistant;
