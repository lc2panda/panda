// Input: chatStore (messages, sendMessage, isStreaming), sessionStore (activeSession), useI18n
// Output: 聊天内容区 — MessageList + Composer 或 HeroComposer
// Pos: App.tsx 的 main content slot，不含外层布局

import React, { useCallback } from 'react';
import { PdMessageList } from '../components/chat/PdMessageList';
import { PdComposer } from '../components/chat/PdComposer';
import { PdHeroComposer } from '../components/chat/PdHeroComposer';
import { PdStreamingIndicator } from '../components/chat/PdStreamingIndicator';
import { useI18n } from '../hooks/useI18n';
import { useChatStore } from '../stores/chatStore';
import { useSessionStore } from '../stores/sessionStore';

export interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ className }) => {
  const { t } = useI18n();
  const { messages, sendMessage, isStreaming } = useChatStore();
  const { sessions, activeId, createSession } = useSessionStore();

  const activeSession = sessions.find((s: any) => s.id === activeId);
  const hasActiveSession = !!activeSession;

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
      const session = createSession();
      sendMessage(content);
    },
    [createSession, sendMessage]
  );

  return (
    <div
      className={`pd-chat-content ${className ?? ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
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
    </div>
  );
};

export default ChatPage;
