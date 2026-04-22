// Input: chatStore (per-session state via activeSessionId), sessionStore (sessions, activeId), useI18n
// Output: 聊天内容区 — RoutingBanner + MessageList + StreamingIndicator + PermissionDialog + Composer 或 PetCameo + HeroComposer
// Pos: App.tsx 的 main content slot，不含外层布局

import React, { useCallback } from 'react';
import { PdMessageList } from '../components/chat/PdMessageList';
import { PdComposer } from '../components/chat/PdComposer';
import { PdHeroComposer } from '../components/chat/PdHeroComposer';
import { PdStreamingIndicator } from '../components/chat/PdStreamingIndicator';
import { PdPermissionDialog } from '../components/chat/PdPermissionDialog';
import { PdRoutingBanner } from '../components/chat/PdRoutingBanner';
import { PdPetCameo } from '../components/chat/PdPetCameo';
import { useI18n } from '../hooks/useI18n';
import { useChatStore } from '../stores/chatStore';
import { useSessionStore } from '../stores/sessionStore';

export interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ className }) => {
  const { t } = useI18n();

  // Session store — list + active ID
  const { sessions, activeId, createSession } = useSessionStore();

  // Chat store — session-aware selectors
  const activeSession = useChatStore((s) =>
    s.activeSessionId ? s.sessions.get(s.activeSessionId) ?? null : null,
  );
  const sendMessage = useChatStore((s) => s.sendMessage);
  const cancelStream = useChatStore((s) => s.cancelStream);
  const respondPermission = useChatStore((s) => s.respondPermission);
  const dismissRouting = useChatStore((s) => s.dismissRouting);

  // Derived per-session state
  const messages = activeSession?.messages ?? [];
  const chatState = activeSession?.chatState ?? 'idle';
  const isStreaming = chatState === 'streaming' || chatState === 'thinking';
  const streamingText = activeSession?.streamingText ?? '';
  const statusVerb = activeSession?.statusVerb ?? '';
  const elapsedSeconds = activeSession?.elapsedSeconds ?? 0;
  const tokenUsage = activeSession?.tokenUsage ?? null;
  const pendingPermission = activeSession?.pendingPermission ?? null;
  const connectionState = activeSession?.connectionState ?? 'disconnected';
  const routingInfo = activeSession?.routingInfo ?? null;

  const hasActiveSession = !!sessions.find((s: any) => s.id === activeId);

  const handleSend = useCallback(
    (content: string) => {
      if (!content.trim() || !activeId) return;
      sendMessage(activeId, content);
    },
    [sendMessage, activeId],
  );

  const handleNewSession = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      const session = createSession();
      sendMessage(session.id, content);
    },
    [createSession, sendMessage],
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
          {connectionState === 'error' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--pd-color-error-subtle)] border-b border-[var(--pd-color-error)] text-[var(--pd-text-sm)] text-[var(--pd-color-error)]">
              <span>⚠️</span>
              <span>{t('chat.connectionError') || 'Connection lost. Retrying...'}</span>
            </div>
          )}
          {connectionState === 'disconnected' && hasActiveSession && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--pd-color-warning-subtle)] border-b border-[var(--pd-color-warning)] text-[var(--pd-text-sm)] text-[var(--pd-color-fg-muted)]">
              <span>🔌</span>
              <span>{t('chat.disconnected') || 'Disconnected'}</span>
            </div>
          )}
          {routingInfo && activeId && (
            <PdRoutingBanner
              fromModel={routingInfo.fromModel}
              toModel={routingInfo.toModel}
              reason={routingInfo.reason}
              onDismiss={() => dismissRouting(activeId)}
            />
          )}
          <PdMessageList
            messages={messages}
            isStreaming={isStreaming}
            streamingText={streamingText}
          />
          {isStreaming && (
            <PdStreamingIndicator
              verb={statusVerb}
              elapsed={elapsedSeconds}
              tokens={tokenUsage?.output}
            />
          )}
          {pendingPermission && activeId && (
            <PdPermissionDialog
              visible={!!pendingPermission}
              toolName={pendingPermission.toolName}
              input={pendingPermission.input}
              tier={pendingPermission.tier}
              onDecision={(decision) =>
                respondPermission(activeId, pendingPermission.toolUseId, decision)
              }
            />
          )}
          <PdComposer
            sessionId={activeId!}
            onSend={handleSend}
            onStop={() => activeId && cancelStream(activeId)}
            isStreaming={isStreaming}
            placeholder={t('composer.placeholder')}
            disabled={isStreaming}
          />
        </>
      ) : (
        <>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PdPetCameo occasion="empty_state" />
          </div>
          <PdHeroComposer
            onSend={handleNewSession}
          />
        </>
      )}
    </div>
  );
};

export default ChatPage;
