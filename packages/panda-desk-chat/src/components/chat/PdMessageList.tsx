// Input: Array of UIMessage from chatStore, isStreaming flag, streamingText
// Output: Scrollable message list with auto-scroll and a11y live region
// Pos: Chat layer — main conversation display area wrapping PdUserBubble + PdMessageBubble
import React, { useEffect, useRef, useCallback } from "react";
import { cn } from "../../lib/cn";
import { PdUserBubble } from "./PdUserBubble";
import { PdMessageBubble, type ToolCallInfo } from "./PdMessageBubble";
import { useChatStore, type TranscriptMode, type MessageFeedback } from "../../stores/chatStore";

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  thinkingContent?: string;
  toolCalls?: ToolCallInfo[];
  feedback?: MessageFeedback;
}

export interface PdMessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
  streamingText: string;
  sessionId: string;
}

export const PdMessageList: React.FC<PdMessageListProps> = ({
  messages,
  isStreaming,
  streamingText,
  sessionId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const transcriptMode = useChatStore((s) => s.transcriptMode);
  const retryLastMessage = useChatStore((s) => s.retryLastMessage);
  const setFeedback = useChatStore((s) => s.setFeedback);

  /* ── Detect manual scroll-up ───────────────────────────────────────── */
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 48;
  }, []);

  /* ── Auto-scroll on new content ────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamingText]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Conversation messages"
      className={cn(
        "flex-1 overflow-y-auto",
        "px-[var(--pd-layout-main-padding-x)] py-[var(--pd-space-4)]",
        // Minimal scrollbar styling
        "scrollbar-thin scrollbar-thumb-[var(--pd-color-border)]",
        "scrollbar-track-transparent",
      )}
    >
      {messages.map((msg, idx) => {
        const isLast = idx === messages.length - 1;
        const isLastAssistant = isLast && msg.role === "assistant";

        if (msg.role === "user") {
          return (
            <PdUserBubble
              key={msg.id}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          );
        }

        /* Assistant message — merge streaming text into last msg */
        const displayContent =
          isLastAssistant && isStreaming
            ? msg.content + streamingText
            : msg.content;

        return (
          <PdMessageBubble
            key={msg.id}
            content={displayContent}
            timestamp={msg.timestamp}
            thinkingContent={msg.thinkingContent}
            toolCalls={msg.toolCalls}
            isStreaming={isLastAssistant && isStreaming}
            transcriptMode={transcriptMode}
            isLastAssistant={isLastAssistant}
            onRetry={isLastAssistant ? () => retryLastMessage(sessionId) : undefined}
            feedback={msg.feedback}
            onFeedbackChange={
              (value) => setFeedback(sessionId, msg.id, value)
            }
          />
        );
      })}

      {/* Streaming placeholder when no assistant message exists yet */}
      {isStreaming && (messages.length === 0 || messages[messages.length - 1].role !== "assistant") && streamingText && (
        <PdMessageBubble
          content={streamingText}
          timestamp={Date.now()}
          isStreaming
          transcriptMode={transcriptMode}
        />
      )}
    </div>
  );
};

PdMessageList.displayName = "PdMessageList";
