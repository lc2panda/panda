// Input: sessionStore, chatStore, tabStore, uiStore, i18n, globalShortcuts
// Output: 三栏聊天界面 — Sidebar + Main content + Inspector
// Pos: 主页面路由入口，承载核心聊天交互

import React, { useCallback, useEffect, useState } from 'react';
import { PdSidebar } from '../components/layout/PdSidebar';
import { PdInspector } from '../components/layout/PdInspector';
import { PdHeader } from '../components/layout/PdHeader';
import { PdStatusBar } from '../components/layout/PdStatusBar';
import { PdTabBarConnected } from '../components/layout/PdTabBarConnected';
import { PdNavItem } from '../components/layout/PdNavItem';
import { PdMessageList } from '../components/chat/PdMessageList';
import { PdComposer } from '../components/chat/PdComposer';
import { PdHeroComposer } from '../components/chat/PdHeroComposer';
import { PdStreamingIndicator } from '../components/chat/PdStreamingIndicator';
import { PdCommandPalette } from '../components/special/PdCommandPalette';
import { PdSessionSwitcher } from '../components/special/PdSessionSwitcher';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import { useChatStore } from '../stores/chatStore';
import { useSessionStore } from '../stores/sessionStore';
import { useTabStore } from '../stores/tabStore';
import { useUiStore } from '../stores/uiStore';

export interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ className }) => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { messages, sendMessage, isStreaming } = useChatStore();
  const { sessions, activeSessionId, switchSession, createSession } = useSessionStore();
  const { tabs, activeTabId } = useTabStore();
  const {
    sidebarCollapsed,
    inspectorVisible,
    toggleSidebar,
    toggleInspector,
  } = useUiStore();

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSessionSwitcher, setShowSessionSwitcher] = useState(false);

  const activeSession = sessions.find((s: any) => s.id === activeSessionId);
  const hasActiveSession = !!activeSession;

  // Global shortcuts
  useGlobalShortcuts({
    'Meta+k': () => setShowCommandPalette((v) => !v),
    'Meta+p': () => setShowSessionSwitcher((v) => !v),
    'Meta+\\': toggleInspector,
    'Meta+b': toggleSidebar,
  });

  const handleSend = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      sendMessage(content);
    },
    [sendMessage]
  );

  const handleNewSession = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      createSession();
      sendMessage(content);
    },
    [createSession, sendMessage]
  );

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      switchSession(sessionId);
      setShowSessionSwitcher(false);
    },
    [switchSession]
  );

  const commands = [
    { id: 'new-chat', label: t('commands.newChat'), shortcut: 'Meta+N', group: t('commands.groupChat'), action: createSession },
    { id: 'toggle-sidebar', label: t('commands.toggleSidebar'), shortcut: 'Meta+B', group: t('commands.groupView'), action: toggleSidebar },
    { id: 'toggle-inspector', label: t('commands.toggleInspector'), shortcut: 'Meta+\\', group: t('commands.groupView'), action: toggleInspector },
    { id: 'switch-session', label: t('commands.switchSession'), shortcut: 'Meta+P', group: t('commands.groupNav'), action: () => setShowSessionSwitcher(true) },
  ];

  const navItems = [
    { icon: '💬', label: t('nav.chat'), active: true, onClick: () => {} },
    { icon: '⚙️', label: t('nav.settings'), active: false, onClick: () => {} },
  ];

  return (
    <div
      className={`pd-chat-page ${className ?? ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `${sidebarCollapsed ? '48px' : '240px'} 1fr ${inspectorVisible ? '280px' : '0px'}`,
        gridTemplateRows: 'auto 1fr auto',
        height: '100vh',
        background: 'var(--pd-bg-primary)',
        color: 'var(--pd-text-primary)',
        transition: 'grid-template-columns 0.2s ease',
      }}
    >
      {/* Sidebar — spans all rows */}
      <PdSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        style={{ gridRow: '1 / -1' }}
      >
        {navItems.map((item) => (
          <PdNavItem
            key={item.label}
            icon={<span>{item.icon}</span>}
            label={item.label}
            active={item.active}
            onClick={item.onClick}
          />
        ))}
      </PdSidebar>

      {/* Header + TabBar */}
      <PdHeader style={{ gridColumn: '2 / -1' }}>
        <PdTabBarConnected />
      </PdHeader>

      {/* Main content area */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {hasActiveSession ? (
          <>
            <PdMessageList
              messages={messages}
              style={{ flex: 1, overflow: 'auto' }}
            />
            {isStreaming && <PdStreamingIndicator />}
            <PdComposer
              onSend={handleSend}
              placeholder={t('composer.placeholder')}
              disabled={isStreaming}
            />
          </>
        ) : (
          <PdHeroComposer
            onSend={handleNewSession}
            title={t('hero.title')}
            subtitle={t('hero.subtitle')}
          />
        )}
      </main>

      {/* Inspector panel */}
      {inspectorVisible && (
        <PdInspector
          style={{ gridRow: '2 / -1', borderLeft: '1px solid var(--pd-border)' }}
        >
          {activeSession ? (
            <div style={{ padding: 'var(--pd-space-3)' }}>
              <h3 style={{ color: 'var(--pd-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 'var(--pd-space-2)' }}>
                {t('inspector.sessionInfo')}
              </h3>
              <dl style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                <dt style={{ color: 'var(--pd-text-tertiary)' }}>{t('inspector.sessionId')}</dt>
                <dd style={{ color: 'var(--pd-text-primary)', marginBottom: 'var(--pd-space-2)' }}>{activeSession.id?.slice(0, 8)}</dd>
                <dt style={{ color: 'var(--pd-text-tertiary)' }}>{t('inspector.messageCount')}</dt>
                <dd style={{ color: 'var(--pd-text-primary)' }}>{messages.length}</dd>
              </dl>
            </div>
          ) : (
            <div style={{ padding: 'var(--pd-space-3)', color: 'var(--pd-text-tertiary)', textAlign: 'center' }}>
              {t('inspector.noSession')}
            </div>
          )}
        </PdInspector>
      )}

      {/* Status bar */}
      <PdStatusBar style={{ gridColumn: '2 / -1' }}>
        <span>{activeSession ? `${t('status.session')}: ${activeSession.id?.slice(0, 8)}` : t('status.noSession')}</span>
        <span>{t('status.messages')}: {messages.length}</span>
      </PdStatusBar>

      {/* Overlays */}
      {showCommandPalette && (
        <PdCommandPalette
          commands={commands}
          onSelect={(cmd: any) => { cmd.action?.(); setShowCommandPalette(false); }}
          onClose={() => setShowCommandPalette(false)}
        />
      )}
      {showSessionSwitcher && (
        <PdSessionSwitcher
          sessions={sessions.map((s: any) => ({ id: s.id, title: s.title || `Session ${s.id?.slice(0, 6)}`, preview: '', date: '' }))}
          onSelect={handleSessionSelect}
          onClose={() => setShowSessionSwitcher(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;
