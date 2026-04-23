// Input: Array of UIMessage from chatStore, buddy events from buddyStore, isStreaming flag, streamingText
// Output: Scrollable message list with auto-scroll, buddy event cards interleaved, and a11y live region
// Pos: Chat layer — main conversation display area wrapping PdUserBubble + PdMessageBubble + PdBuddyEventCard
import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "../../lib/cn";
import { PdUserBubble } from "./PdUserBubble";
import { PdMessageBubble, type ToolCallInfo } from "./PdMessageBubble";
import { PdBuddyEventCard } from "./PdBuddyEventCard";
import { useChatStore, type TranscriptMode, type MessageFeedback } from "../../stores/chatStore";
import { useBuddyStore, type BuddyEvent } from "../../stores/buddyStore";
import { useVirtualList } from "../../hooks/useVirtualList";

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
  const buddyEvents = useBuddyStore((s) => s.events);

  /* ── Virtual scrolling: enable when timeline items exceed threshold ── */
  const VIRTUALIZE_THRESHOLD = 200;

  /* ── Merge messages and buddy events into a single timeline ────────── */
  type TimelineItem =
    | { kind: 'message'; msg: UIMessage; idx: number }
    | { kind: 'buddy'; event: BuddyEvent };

  const timeline = useMemo<TimelineItem[]>(() => {
    // Only include buddy events that fall within the message time range
    const firstTs = messages.length > 0 ? messages[0].timestamp : 0;
    const relevantEvents = firstTs > 0
      ? buddyEvents.filter((e) => e.timestamp >= firstTs)
      : buddyEvents;

    const items: TimelineItem[] = [];
    let eIdx = 0;

    for (let mIdx = 0; mIdx < messages.length; mIdx++) {
      // Insert any buddy events that occurred before this message
      while (eIdx < relevantEvents.length && relevantEvents[eIdx].timestamp <= messages[mIdx].timestamp) {
        items.push({ kind: 'buddy', event: relevantEvents[eIdx] });
        eIdx++;
      }
      items.push({ kind: 'message', msg: messages[mIdx], idx: mIdx });
    }
    // Remaining buddy events after the last message
    while (eIdx < relevantEvents.length) {
      items.push({ kind: 'buddy', event: relevantEvents[eIdx] });
      eIdx++;
    }
    return items;
  }, [messages, buddyEvents]);

  /* ── Virtual scrolling (conditional) ──────────────────────────────── */
  const shouldVirtualize = timeline.length > VIRTUALIZE_THRESHOLD;

  const { virtualItems, totalHeight, paddingTop, paddingBottom, onScroll: virtualOnScroll } =
    useVirtualList({
      items: timeline,
      containerRef,
      estimatedItemHeight: 100,
      overscan: 5,
      enabled: shouldVirtualize,
    });

  /* ── Detect manual scroll-up ───────────────────────────────────────── */
  const handleScroll = useCallback(
    (e: React.UIEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distanceFromBottom < 48;
      // Forward to virtual list handler when virtualization is active
      if (shouldVirtualize) virtualOnScroll(e);
    },
    [shouldVirtualize, virtualOnScroll],
  );

  /* ── Auto-scroll on new content ────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamingText]);

  /* ── Render a single timeline item ────────────────────────────────── */
  const renderTimelineItem = useCallback(
    (item: (typeof timeline)[number]) => {
      if (item.kind === 'buddy') {
        return (
          <PdBuddyEventCard
            key={`buddy-${item.event.id}`}
            type={item.event.type}
            title={item.event.title}
            description={item.event.description}
            emoji={item.event.emoji}
            timestamp={item.event.timestamp}
          />
        );
      }

      const { msg, idx } = item;
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
          onFeedbackChange={(value) => setFeedback(sessionId, msg.id, value)}
        />
      );
    },
    [messages.length, isStreaming, streamingText, transcriptMode, retryLastMessage, sessionId, setFeedback],
  );

  /* ── Decide which items to render ─────────────────────────────────── */
  const renderedItems = shouldVirtualize ? virtualItems : timeline.map((item, index) => ({ item, index, offsetTop: 0 }));

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
      {shouldVirtualize ? (
        /* Virtualized: use spacers to maintain scroll position */
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <div style={{ height: paddingTop }} />
            {renderedItems.map((vi) => renderTimelineItem(vi.item))}
            <div style={{ height: paddingBottom }} />
          </div>
        </div>
      ) : (
        /* Non-virtualized: render all items directly */
        renderedItems.map((vi) => renderTimelineItem(vi.item))
      )}

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
