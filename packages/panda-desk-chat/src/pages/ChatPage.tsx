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

  const activeMeta = sessions.find((s: any) => s.id === activeId) ?? null;
  const hasActiveSession = !!activeMeta;
  // Show conversation view as soon as a session is active, even before any
  // messages exist. Gating on messages.length > 0 made clicking historical
  // sessions feel unresponsive — the hero kept showing until loadSessionHistory
  // finished, and if the transcript was empty the UI never changed at all.
  const showConversation = hasActiveSession;
  // Disk-sourced sessions start "disconnected" by design — the CLI is not
  // running yet and is only spawned when the user sends the first message.
  // Suppress the disconnected banner for them so the sidebar entry doesn't
  // look broken; a genuine "connected then lost" still surfaces via 'error'.
  const isDiskSession = Boolean((activeMeta as any)?.isDiskSession);

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
      {showConversation ? (
        <>
          {connectionState === 'error' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--pd-color-error-subtle)] border-b border-[var(--pd-color-error)] text-[var(--pd-text-sm)] text-[var(--pd-color-error)]">
              <span>⚠️</span>
              <span>{t('chat.connectionError') || 'Connection lost. Retrying...'}</span>
            </div>
          )}
          {connectionState === 'disconnected' && showConversation && !isDiskSession && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--pd-color-warning-subtle)] border-b border-[var(--pd-color-warning)] text-[var(--pd-text-sm)] text-[var(--pd-color-fg-muted)]">
              <span>🔌</span>
              <span>{t('statusbar.connection.disconnected' as any) || 'Disconnected'}</span>
            </div>
          )}
          {connectionState === 'disconnected' && showConversation && isDiskSession && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--pd-color-info-subtle,rgba(180,150,110,0.12))] border-b border-[var(--pd-color-border)] text-[var(--pd-text-sm)] text-[var(--pd-color-fg-muted)]">
              <span>📜</span>
              <span>{t('chat.historicalSession' as any) || '历史会话 · 发送消息以激活'}</span>
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
            placeholder={t('chat.placeholder')}
            disabled={isStreaming}
          />
        </>
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center min-h-0">
            <PdHeroComposer />
          </div>
          <PdComposer
            ref={composerRef}
            sessionId={activeId ?? ''}
            onSend={activeId ? handleSend : handleNewSession}
            onStop={() => { /* no streaming in empty state */ }}
            isStreaming={false}
            placeholder={t('chat.placeholder')}
          />
          <ProjectPill cwd={(activeMeta as { cwd?: string } | null)?.cwd} />
        </>
      )}
    </div>
  );
};

/** Project pill — Reference: cc-haha 01_full_ui bottom pill (design spec only, not source) */
function ProjectPill({ cwd }: { cwd?: string }) {
  if (!cwd) return null;
  const base = cwd.replace(/\/$/, '').split('/').filter(Boolean).slice(-2).join('/');
  return (
    <div className="flex justify-center pt-2 pb-4 select-none">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--pd-color-bg-subtle)] text-[12px] text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)] transition-colors cursor-pointer"
        title={cwd}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
        <span>{base || cwd}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default ChatPage;
