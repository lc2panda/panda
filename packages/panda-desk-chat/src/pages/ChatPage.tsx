// Input: Session ID and chat store state
// Output: Complete chat interface page
// Pos: Page layer — orchestrates all chat components
import React, { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useChatStore } from "../stores";
import { MessageList } from "../components/chat/MessageList";
import { ChatInput, type ChatInputHandle } from "../components/chat/ChatInput";
import { StreamingIndicator } from "../components/chat/StreamingIndicator";
import {
  PermissionDialog,
  type PermissionDecision,
} from "../components/chat/PermissionDialog";

/* -------------------------------------------------------------------------- */
/*  ChatPage                                                                  */
/* -------------------------------------------------------------------------- */

export const ChatPage: React.FC = () => {
  const inputRef = useRef<ChatInputHandle>(null);
  const [mockSessionId] = useState(() => "session-default");

  /* -- Store selectors --------------------------------------------------- */
  const initSession = useChatStore((s) => s.initSession);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const cancelStream = useChatStore((s) => s.cancelStream);
  const respondPermission = useChatStore((s) => s.respondPermission);
  const session = useChatStore((s) => s.sessions.get(mockSessionId));

  /* -- Ensure session exists --------------------------------------------- */
  React.useEffect(() => {
    initSession(mockSessionId);
    setActiveSession(mockSessionId);
  }, [mockSessionId, initSession, setActiveSession]);

  /* -- Derived state ----------------------------------------------------- */
  const messages = session?.messages ?? [];
  const chatState = session?.chatState ?? "idle";
  const streamingText = session?.streamingText ?? "";
  const pendingPermission = session?.pendingPermission ?? null;
  const statusVerb = session?.statusVerb || "Thinking";
  const elapsedSeconds = session?.elapsedSeconds ?? 0;

  const isStreaming = chatState === "streaming" || chatState === "thinking";
  const isEmpty = messages.length === 0 && !isStreaming;

  /* -- Handlers ---------------------------------------------------------- */
  const handleSend = useCallback(
    (content: string) => {
      sendMessage(mockSessionId, content);
    },
    [sendMessage, mockSessionId],
  );

  const handleStop = useCallback(() => {
    cancelStream(mockSessionId);
  }, [cancelStream, mockSessionId]);

  const handlePermission = useCallback(
    (decision: PermissionDecision) => {
      const toolUseId = session?.pendingPermission?.toolUseId ?? '';
      respondPermission(
        mockSessionId,
        toolUseId,
        decision === 'deny' ? 'deny' : decision === 'allow_session' ? 'allow_session' : 'allow',
      );
    },
    [respondPermission, mockSessionId, session?.pendingPermission?.toolUseId],
  );

  /* -- UIMessage mapping (chat store type -> MessageList type) ------------ */
  const uiMessages = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        thinkingContent: m.thinkingContent,
        toolCalls: m.toolCalls,
      })),
    [messages],
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* ── Message area ─────────────────────────────────────────────── */}
      {isEmpty ? (
        <EmptyState onFocusInput={() => inputRef.current?.focus()} />
      ) : (
        <MessageList
          messages={uiMessages}
          isStreaming={isStreaming}
          streamingText={streamingText}
        />
      )}

      {/* ── Streaming indicator ──────────────────────────────────────── */}
      {isStreaming && (
        <div
          className={cn(
            "flex justify-center",
            "py-[var(--pd-space-2)]",
            "border-t border-[var(--pd-color-border-subtle)]",
          )}
        >
          <StreamingIndicator verb={statusVerb} elapsed={elapsedSeconds} />
        </div>
      )}

      {/* ── Input area (fixed bottom) ────────────────────────────────── */}
      <div
        className={cn(
          "shrink-0",
          "px-[var(--pd-layout-main-padding-x)]",
          "py-[var(--pd-space-3)]",
          "border-t border-[var(--pd-color-border-subtle)]",
          "bg-[var(--pd-color-bg)]",
        )}
      >
        <ChatInput
          ref={inputRef}
          sessionId={mockSessionId}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
        />
      </div>

      {/* ── Permission dialog (modal overlay) ────────────────────────── */}
      {pendingPermission && (
        <PermissionDialog
          visible={!!pendingPermission}
          toolName={pendingPermission.toolName}
          input={pendingPermission.input}
          tier={pendingPermission.tier}
          onDecision={handlePermission}
        />
      )}
    </div>
  );
};

ChatPage.displayName = "ChatPage";

/* -------------------------------------------------------------------------- */
/*  Empty state                                                               */
/* -------------------------------------------------------------------------- */

interface EmptyStateProps {
  onFocusInput: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onFocusInput }) => (
  <div
    className={cn(
      "flex-1 flex flex-col items-center justify-center",
      "gap-[var(--pd-space-4)]",
      "select-none",
    )}
  >
    {/* Panda logo placeholder */}
    <div
      className={cn(
        "w-16 h-16 flex items-center justify-center",
        "rounded-[var(--pd-radius-xl)]",
        "bg-[var(--pd-color-bg-subtle)]",
        "text-[2rem]",
      )}
      aria-hidden="true"
    >
      &#x1F43C;
    </div>
    <h2
      className={cn(
        "text-[var(--pd-text-lg)]",
        "font-[var(--pd-font-semibold)]",
        "text-[var(--pd-color-fg)]",
      )}
    >
      Start a conversation
    </h2>
    <p
      className={cn(
        "text-[var(--pd-text-sm)]",
        "text-[var(--pd-color-fg-muted)]",
        "max-w-xs text-center",
      )}
    >
      Ask Panda Code to write, refactor, debug, or explain code.
    </p>
    <button
      type="button"
      onClick={onFocusInput}
      className={cn(
        "px-[var(--pd-space-4)] py-[var(--pd-space-2)]",
        "rounded-[var(--pd-radius-md)]",
        "text-[var(--pd-text-sm)]",
        "font-[var(--pd-font-medium)]",
        "bg-[var(--pd-color-accent)]",
        "text-[var(--pd-color-fg-on-accent)]",
        "shadow-[var(--pd-shadow-button-primary)]",
        "hover:bg-[var(--pd-color-accent-hover)]",
        "active:bg-[var(--pd-color-accent-active)]",
        "transition-colors duration-[var(--pd-duration-fast)]",
      )}
    >
      Type a message
    </button>
  </div>
);
