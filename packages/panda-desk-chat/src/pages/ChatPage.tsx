// Input: chatStore (per-session state via activeSessionId), sessionStore (sessions, activeId), useI18n
// Output: 聊天内容区 — RoutingBanner + MessageList + StreamingIndicator + PermissionDialog + SuperAssistBar + Composer 或 PetCameo + HeroComposer
// Pos: App.tsx 的 main content slot，不含外层布局

import React, { useCallback, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PdMessageList } from '../components/chat/PdMessageList';
import { PdComposer } from '../components/chat/PdComposer';
import type { PdComposerHandle } from '../components/chat/PdComposer';
import { PdHeroComposer } from '../components/chat/PdHeroComposer';
import { PdSuperAssistBar } from '../components/chat/PdSuperAssistBar';
import { PdStreamingIndicator } from '../components/chat/PdStreamingIndicator';
import { PdPermissionDialog } from '../components/chat/PdPermissionDialog';
import { PdRoutingBanner } from '../components/chat/PdRoutingBanner';
import { PdPetCameo } from '../components/chat/PdPetCameo';
import { useI18n } from '../hooks/useI18n';
import { useChatStore } from '../stores/chatStore';
import { useSessionStore } from '../stores/sessionStore';

export interface ChatPageProps {
  className?: string;
  /** Callback to open Inspector on the Buddy Log tab */
  onOpenBuddyLog?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ className, onOpenBuddyLog }) => {
  const { t } = useI18n();
  const composerRef = useRef<PdComposerHandle>(null);
  const [thinkHardActive, setThinkHardActive] = useState(false);

  // Session store — list + active ID (shallow compare avoids re-render on unrelated store changes)
  const { sessions, activeId, createSession } = useSessionStore(
    useShallow((s) => ({ sessions: s.sessions, activeId: s.activeId, createSession: s.createSession })),
  );

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
      // When "think hard" mode is active, prepend directive
      const payload = thinkHardActive
        ? `think hard\n\n${content}`
        : content;
      sendMessage(activeId, payload);
    },
    [sendMessage, activeId, thinkHardActive],
  );

  const handleNewSession = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      const session = await createSession();
      sendMessage(session.id, content);
    },
    [createSession, sendMessage],
  );

  /* -- SuperAssistBar callbacks -- */
  const handleAssistCommand = useCallback(
    (cmd: string) => {
      if (!activeId) return;
      sendMessage(activeId, cmd);
    },
    [sendMessage, activeId],
  );

  const handleToggleThinking = useCallback((active: boolean) => {
    setThinkHardActive(active);
  }, []);

  const handleOpenSlashMenu = useCallback(() => {
    composerRef.current?.insertSlash();
  }, []);

  const handleOpenBuddyLog = useCallback(() => {
    onOpenBuddyLog?.();
  }, [onOpenBuddyLog]);

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
            sessionId={activeId ?? ''}
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
          <PdSuperAssistBar
            onSendCommand={handleAssistCommand}
            onToggleThinking={handleToggleThinking}
            onOpenSlashMenu={handleOpenSlashMenu}
            onOpenBuddyLog={handleOpenBuddyLog}
          />
          <PdComposer
            ref={composerRef}
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
