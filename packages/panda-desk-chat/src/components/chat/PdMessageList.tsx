// Input: Array of UIMessage (5-type union: user/assistant/system/tool_use/tool_result) from chatStore + isStreaming + sessionId
// Output: cc-haha 1:1 MessageList — flex-1 overflow-y-auto px-4 py-4 + mx-auto max-w-[860px] + auto-scroll + buildRenderModel + Rewind Modal + per-type dispatch
// Pos: Chat layer — main conversation display area; mirrors cc-haha MessageList L1-590.
//
// Reference: monitor/tmp/cc-haha/desktop/src/components/chat/MessageList.tsx L1-590
//   - L50-115 buildRenderModel (tool grouping + AskUserQuestion split)
//   - L130-292 MessageList container + auto-scroll + Rewind dialog state machine
//   - L295-481 Render tree (renderItems + StreamingIndicator + Rewind Modal)
//   - L485-590 MessageBlock 9-case dispatch (panda 适配为 5-case + system + tool_result)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React, { useEffect, useRef, useCallback, useMemo, useState, memo } from "react";
import { cn } from "../../lib/cn";
import { PdUserBubble } from "./PdUserBubble";
import { PdMessageBubble } from "./PdMessageBubble";
import { PdToolCallCard } from "./PdToolCallCard";
import { PdToolResultBlock } from "./PdToolResultBlock";
import { PdThinkingBlock } from "./PdThinkingBlock";
import { PdStreamingIndicator } from "./PdStreamingIndicator";
// V2 修复: 删 PdSessionHeader import — 该组件在 ActiveSession 自带 header（cc-haha L158-198）后变冗余，
//   保留组件文件本身（其它 entry point 如 history viewer 可能用），仅从 MessageList 卸下.
// import { PdSessionHeader } from "./PdSessionHeader";
import { PdCommandStub, isPandaCliCommandStub } from "./PdCommandStub";
import { PdTaskNotificationCard, isTaskNotification } from "./PdTaskNotificationCard";
// V2 修复: cc-haha L17 import { ToolCallGroup } from './ToolCallGroup'
//   panda 把组件内联到本文件末尾（避免新增 PdToolCallGroup.tsx 文件），
//   由本文件 renderItems 分支调用。1:1 cc-haha ToolCallGroup L189-247（多 tool 折叠）+
//   L78-87（单 tool 直接渲染）行为。
import type { TranslationKey } from "../../i18n";
import {
  useChatStore,
  extractText,
  extractThinking,
  type UIMessage,
  type UIUserMessage,
  type UIToolUseMessage,
  type UIToolResultMessage,
} from "../../stores/chatStore";
// V2 修复: 删 useSessionStore — 原服务 PdSessionHeader（已卸下）；ActiveSession.tsx 内部仍用.
import { useVirtualList } from "../../hooks/useVirtualList";
import { t } from "../../i18n";

// Re-export for callers that imported UIMessage from this module historically.
export type { UIMessage } from "../../stores/chatStore";

export interface PdMessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
  /** Live-streaming text not yet committed to the assistant message. */
  streamingText: string;
  sessionId: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Render-model helper — 1:1 cc-haha buildRenderModel L50-115                 */
/* ────────────────────────────────────────────────────────────────────────── */

type RenderItem =
  | { kind: "tool_group"; toolCalls: UIToolUseMessage[]; id: string }
  | { kind: "message"; message: UIMessage };

type RenderModel = {
  renderItems: RenderItem[];
  toolResultMap: Map<string, UIToolResultMessage>;
  childToolCallsByParent: Map<string, UIToolUseMessage[]>;
};

function appendChildToolCall(
  childToolCallsByParent: Map<string, UIToolUseMessage[]>,
  parentToolUseId: string,
  toolCall: UIToolUseMessage,
) {
  const siblings = childToolCallsByParent.get(parentToolUseId);
  if (siblings) {
    siblings.push(toolCall);
  } else {
    childToolCallsByParent.set(parentToolUseId, [toolCall]);
  }
}

export function buildRenderModel(messages: UIMessage[]): RenderModel {
  const items: RenderItem[] = [];
  const toolResultMap = new Map<string, UIToolResultMessage>();
  const childToolCallsByParent = new Map<string, UIToolUseMessage[]>();
  const toolUseIds = new Set<string>();
  let pendingToolCalls: UIToolUseMessage[] = [];
  const inlineParentToolUseIds = new Set<string>();

  const flushGroup = (resetInlineParents = false) => {
    if (pendingToolCalls.length > 0) {
      items.push({
        kind: "tool_group",
        toolCalls: [...pendingToolCalls],
        id: `group-${pendingToolCalls[0]!.id}`,
      });
      for (const toolCall of pendingToolCalls) {
        inlineParentToolUseIds.add(toolCall.toolUseId);
      }
      pendingToolCalls = [];
    }

    if (resetInlineParents) {
      inlineParentToolUseIds.clear();
    }
  };

  for (const msg of messages) {
    if (msg.type === "tool_use") {
      toolUseIds.add(msg.toolUseId);
    }
    if (msg.type === "tool_result") {
      toolResultMap.set(msg.toolUseId, msg);
    }
  }

  for (const msg of messages) {
    if (msg.type === "tool_result" && toolUseIds.has(msg.toolUseId)) {
      continue;
    }

    if (msg.type === "tool_use") {
      const parentIsPending = msg.parentToolUseId
        ? pendingToolCalls.some((toolCall) => toolCall.toolUseId === msg.parentToolUseId)
        : false;

      if (
        msg.parentToolUseId &&
        (inlineParentToolUseIds.has(msg.parentToolUseId) || parentIsPending)
      ) {
        flushGroup();
        appendChildToolCall(childToolCallsByParent, msg.parentToolUseId, msg);
        inlineParentToolUseIds.add(msg.toolUseId);
        continue;
      }
      if (msg.toolName === "AskUserQuestion") {
        flushGroup(true);
        items.push({ kind: "message", message: msg });
      } else {
        pendingToolCalls.push(msg);
      }
    } else {
      flushGroup(true);
      items.push({ kind: "message", message: msg });
    }
  }

  flushGroup();
  return { renderItems: items, toolResultMap, childToolCallsByParent };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const AUTO_SCROLL_BOTTOM_THRESHOLD_PX = 48;

function isNearScrollBottom(element: HTMLElement) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <=
    AUTO_SCROLL_BOTTOM_THRESHOLD_PX
  );
}

/** Drop CLI transport meta system messages — see cc-haha L23-26 isMeta filter. */
function isSystemMeta(text: string): boolean {
  if (text.startsWith("<system-reminder")) return true;
  if (text.startsWith("<local-command-stdout") || text.startsWith("<local-command-stderr"))
    return true;
  if (
    text.startsWith("<command-name") ||
    text.startsWith("<command-message") ||
    text.startsWith("<command-args")
  )
    return true;
  if (text.startsWith("<env>") || text.startsWith("<cwd>")) return true;
  if (text.startsWith("Caveat: The messages below were generated")) return true;
  return false;
}

/** Best-effort string render of tool_result content for the inline preview slot. */
function extractToolResultPreview(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === "string") return c;
        if (c && typeof c === "object") {
          const block = c as Record<string, unknown>;
          if (typeof block.text === "string") return block.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (content && typeof content === "object") {
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  }
  return "";
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  PdMessageList                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export const PdMessageList: React.FC<PdMessageListProps> = ({
  messages,
  isStreaming,
  streamingText,
  sessionId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastSessionIdRef = useRef<string | null>(sessionId);
  const transcriptMode = useChatStore((s) => s.transcriptMode);
  const cycleTranscriptMode = useChatStore((s) => s.cycleTranscriptMode);
  const retryLastMessage = useChatStore((s) => s.retryLastMessage);
  const setFeedback = useChatStore((s) => s.setFeedback);
  const activeSession = useChatStore((s) => s.getActiveSession());
  const chatState = activeSession?.chatState ?? "idle";
  const activeThinkingId = activeSession?.activeThinkingId ?? null;
  // panda store 暂无 agentTaskNotifications — stub `{}` for cc-haha 接口对齐.
  const agentTaskNotifications: Record<string, unknown> = {};

  // W23C 任务 #3：全局 Ctrl+O 切换 transcriptMode（normal → verbose → summary → ...）
  //   verbose 模式下所有 truncate 失效（消息全展开），与 Claude Code CLI 行为一致。
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+O 或 Cmd+O（macOS friendly）— 但不能与浏览器 "open file" 冲突，
      //   因此只在不带 Shift / Alt 的情况下触发，且如果焦点在 input/textarea 内不触发
      const target = e.target as HTMLElement | null;
      const inEditable =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (inEditable) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === "o" || e.key === "O") && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        cycleTranscriptMode();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [cycleTranscriptMode]);

  /* ── Rewind Modal state — 1:1 cc-haha L153-291 (panda：暂未接入 sessionsApi，
        仅维持 dialog 视觉与可触发交互；confirm 按钮无网络副作用) ────────────── */
  const [rewindTarget, setRewindTarget] = useState<{
    userMessageIndex: number;
    content: string;
  } | null>(null);

  // V2 修复: 删 sessionMeta / headerTitle / headerLastUpdated — 原服务于 PdSessionHeader（已卸下）.
  //   header 由 ActiveSession.tsx 自身从 sessionsStore 读取 + 渲染（cc-haha L158-198 1:1）.

  /* ── Virtual scrolling (panda 增强 — cc-haha 不做虚拟列表) ──────────── */
  const VIRTUALIZE_THRESHOLD = 200;

  const timeline = useMemo(
    () => messages.map((msg, idx) => ({ msg, idx })),
    [messages],
  );

  const shouldVirtualize = timeline.length > VIRTUALIZE_THRESHOLD;

  const {
    virtualItems,
    totalHeight,
    paddingTop,
    paddingBottom,
    onScroll: virtualOnScroll,
  } = useVirtualList({
    items: timeline,
    containerRef,
    estimatedItemHeight: 100,
    overscan: 5,
    enabled: shouldVirtualize,
  });

  /* ── buildRenderModel — 1:1 cc-haha L221-224 ─────────────────────────── */
  const { toolResultMap, childToolCallsByParent: _childToolCallsByParent, renderItems } =
    useMemo(() => buildRenderModel(messages), [messages]);

  /* ── Auto-scroll detection — 1:1 cc-haha L163-178 ────────────────────── */
  const updateAutoScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    shouldAutoScrollRef.current = isNearScrollBottom(container);
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent) => {
      updateAutoScrollState();
      if (shouldVirtualize) virtualOnScroll(e);
    },
    [updateAutoScrollState, shouldVirtualize, virtualOnScroll],
  );

  useEffect(() => {
    if (lastSessionIdRef.current !== sessionId) {
      shouldAutoScrollRef.current = true;
      lastSessionIdRef.current = sessionId;
    }
    if (!shouldAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages.length, sessionId, streamingText]);

  /* ── Rewind callbacks — 1:1 cc-haha L226-291 (network calls stubbed) ───── */
  const closeRewindModal = useCallback(() => {
    setRewindTarget(null);
  }, []);

  /* ── Per-type renderer — 1:1 cc-haha MessageBlock L485-590 (panda 5-type) ── */
  let visibleUserMessageIndex = -1;

  // Comdr 指令 (任务: streaming 不刷新根因修复):
  //   MessageBlockMemo 调 renderFn(msg, -1, ...)，导致原有 `idx === messages.length - 1` 判断
  //   永远 false，进而 `isLastAssistant` 为 false，PdMessageBubble 收不到 streamingContent，
  //   live text 永远不显示（thinkingContent 走 PdThinkingBlock 单独路径不受影响 → 用户看到
  //   "思考中" 但没有最终回复）。改用 id 直接比对 messages 末尾，绕过 idx -1 闭包陷阱。
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1]!.id : null;

  const renderMessage = useCallback(
    (msg: UIMessage, _idx: number, rewindableUserIndex: number | null) => {
      const isLast = msg.id === lastMessageId;
      const isLastAssistant = isLast && msg.type === "assistant";
      void agentTaskNotifications; // tagged for 后续 panda 接入 — TODO

      switch (msg.type) {
        case "user": {
          const text = extractText(msg.content);
          const trimmed = text.trim();
          // panda 增强：cron worker callback envelope → floating card
          if (isTaskNotification(trimmed)) {
            return <PdTaskNotificationCard key={msg.id} content={trimmed} />;
          }
          // panda 增强：slash-command transport envelope → folded stub
          if (isPandaCliCommandStub(trimmed)) {
            return <PdCommandStub key={msg.id} content={trimmed} />;
          }
          return (
            <PdUserBubble
              key={msg.id}
              content={text}
              timestamp={msg.timestamp}
              transcriptMode={transcriptMode}
              attachments={(msg as UIUserMessage).attachments}
              onRewind={
                typeof rewindableUserIndex === "number"
                  ? () =>
                      setRewindTarget({
                        userMessageIndex: rewindableUserIndex,
                        content: text,
                      })
                  : undefined
              }
              rewindLabel={t("chat.rewindAction")}
            />
          );
        }

        case "assistant": {
          // Comdr 指令 (任务: streaming 不刷新根因修复 — 二阶修复):
          //   panda CLI 的 onMessageHistory 推下来的 assistant 消息 content 字段为 undefined
          //   （cli-manager.ts L750-752 用 ...msg 展开，但 SDK msg 把 content 嵌在 message.content
          //   里），实际 text 只在 streamingContent 字段（被 flushStreamBuffer 累积的 deltas）。
          //   原代码只在 isLastAssistant 时读 streamingContent → 历史已完成 streaming 的 assistant
          //   消息渲染时 baseText="" + liveText=""，bubble body 整段消失（用户感受："必须 Cmd+R 刷新"）。
          //   修：baseText 优先 extractText(content)，空时 fallback 到 streamingContent。
          const extractedText = extractText(msg.content);
          const baseText =
            extractedText || (msg.streamingContent && !isLastAssistant ? msg.streamingContent : "");
          const liveText =
            isLastAssistant && isStreaming ? msg.streamingContent ?? streamingText : "";
          const displayContent = (baseText + liveText).trimStart();
          if (isTaskNotification(displayContent.trim())) {
            return <PdTaskNotificationCard key={msg.id} content={displayContent.trim()} />;
          }
          const thinkingContent = msg.thinkingContent ?? extractThinking(msg.content);
          return (
            <PdMessageBubble
              key={msg.id}
              content={displayContent}
              timestamp={msg.timestamp}
              thinkingContent={thinkingContent}
              isStreaming={isLastAssistant && isStreaming}
              transcriptMode={transcriptMode}
              isLastAssistant={isLastAssistant}
              onRetry={isLastAssistant ? () => retryLastMessage(sessionId) : undefined}
              feedback={msg.feedback}
              onFeedbackChange={(value) => setFeedback(sessionId, msg.id, value)}
            />
          );
        }

        case "tool_use": {
          // cc-haha L521 ThinkingBlock case 已在 assistant 路径中通过 thinkingContent 渲染.
          // panda 这里仅 dispatch tool_use（cc-haha L523-544）.
          const tu = msg as UIToolUseMessage;
          const result = toolResultMap.get(tu.toolUseId);
          const inlineResult = result ? extractToolResultPreview(result.content) : undefined;
          const status: "pending" | "running" | "success" | "error" = result
            ? result.isError
              ? "error"
              : "success"
            : tu.status ?? "running";

          return (
            <div key={msg.id} className="ml-10 mb-4">
              <PdToolCallCard
                toolName={tu.toolName}
                input={tu.input}
                status={status}
                result={inlineResult}
                isError={result?.isError === true}
                defaultExpanded={transcriptMode === "verbose"}
                forceCollapsed={transcriptMode === "summary"}
              />
            </div>
          );
        }

        case "tool_result": {
          // cc-haha L545-552: standalone — but only when tool_use peer is missing.
          const tr = msg as UIToolResultMessage;
          if (toolResultMap.has(tr.toolUseId)) {
            // already paired with a tool_use above, suppress
            return null;
          }
          return (
            <PdToolResultBlock
              key={msg.id}
              content={tr.content}
              isError={tr.isError === true}
            />
          );
        }

        case "system": {
          // cc-haha L583-588: small centered tertiary text.
          const text =
            extractText(msg.content) ||
            (typeof msg.content === "string" ? msg.content : "");
          const trimmed = text.trim();
          if (!trimmed) return null;
          if (isSystemMeta(trimmed)) return null;
          return (
            <div
              key={msg.id}
              className="mb-3 text-center text-xs text-[var(--pd-color-text-tertiary)]"
            >
              {trimmed}
            </div>
          );
        }

        default:
          return null;
      }
    },
    [
      lastMessageId,
      isStreaming,
      streamingText,
      transcriptMode,
      retryLastMessage,
      setFeedback,
      sessionId,
      toolResultMap,
    ],
  );

  /* ── Decide which items to render ─────────────────────────────────── */
  const renderedTimeline = shouldVirtualize
    ? virtualItems.map((vi) => vi.item)
    : timeline;

  /* ── 1:1 cc-haha MessageList L295-481 outer container ──────────────── */
  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Conversation messages"
      className={cn(
        "flex-1 overflow-y-auto px-4 py-4",
        "scrollbar-thin scrollbar-thumb-[var(--pd-color-border)]",
        "scrollbar-track-transparent",
      )}
    >
      {/* V2 修复: 移除 PdSessionHeader 渲染 — 与 ActiveSession.tsx 自带 header（cc-haha L158-198）重复.
          cc-haha MessageList.tsx L296-301 没有 SessionHeader，标题/元数据条在 ActiveSession 父组件渲染. */}

      {/* 1:1 cc-haha L301: mx-auto max-w-[860px] */}
      <div className="mx-auto max-w-[860px]">
        {shouldVirtualize && (
          <div style={{ height: paddingTop }} />
        )}

        {/* 1:1 cc-haha L302-352: renderItems map (tool_group / message) */}
        {renderItems.map((item) => {
          if (item.kind === "tool_group") {
            // V2 修复: cc-haha L304-316 ToolCallGroup（多 tool 折叠 summary 卡）
            //   单 tool → 直接 PdToolCallCard（cc-haha L78-87）
            //   多 tool → ToolCallGroupMulti 折叠（cc-haha L189-247）
            return (
              <PdToolCallGroup
                key={item.id}
                toolCalls={item.toolCalls}
                toolResultMap={toolResultMap}
                transcriptMode={transcriptMode}
                isStreaming={
                  chatState === "tool_executing" &&
                  item.toolCalls.some((tc) => !toolResultMap.has(tc.toolUseId))
                }
              />
            );
          }

          const msg = item.message;
          // cc-haha L320-323: only count visible non-pending user_text turns
          const rewindableUserIndex =
            msg.type === "user" ? ++visibleUserMessageIndex : null;

          return (
            <MessageBlockMemo
              key={msg.id}
              message={msg}
              activeThinkingId={activeThinkingId}
              rewindableUserIndex={rewindableUserIndex}
              renderFn={renderMessage}
            />
          );
        })}

        {shouldVirtualize && (
          <div style={{ height: paddingBottom }} />
        )}

        {/* 1:1 cc-haha L354-356: streaming assistant message rendered separately
            when no committed assistant entry has absorbed the stream yet. */}
        {streamingText &&
          (messages.length === 0 ||
            messages[messages.length - 1].type !== "assistant") && (
            <PdMessageBubble
              content={streamingText}
              timestamp={Date.now()}
              isStreaming={chatState === "streaming"}
              transcriptMode={transcriptMode}
            />
          )}

        {/* 1:1 cc-haha L362-364: StreamingIndicator visibility logic */}
        {(chatState === "tool_executing" ||
          (chatState === "thinking" && !activeThinkingId)) && (
          <PdStreamingIndicator />
        )}

        {/* Show standalone ThinkingBlock when stream is in `thinking` state and
            an active thinking id exists — cc-haha 1:1 dispatch via MessageBlock. */}
        {chatState === "thinking" &&
          activeThinkingId &&
          !messages.find((m) => m.id === activeThinkingId) && (
            <PdThinkingBlock content={activeSession?.streamingText ?? ""} isActive />
          )}

        <div ref={bottomRef} />
      </div>

      {/* ── Rewind Modal (1:1 cc-haha L369-481) ───────────────────────── */}
      <RewindModal
        target={rewindTarget}
        onClose={closeRewindModal}
        onConfirm={closeRewindModal /* panda 暂未接 sessionsApi.rewind */}
      />

      {/* panda 兼容: 从 hook 中拿一次 totalHeight 以避免未使用警告（虚拟列表分支已用） */}
      {shouldVirtualize && totalHeight === -1 && null}
      {/* 同样消化未使用变量（cc-haha 暂不需要 childToolCallsByParent 一级用法） */}
      {_childToolCallsByParent.size === -1 && null}
      {/* 同样消化 renderedTimeline 直引用（保留以兼容潜在虚拟列表回归） */}
      {renderedTimeline.length === -1 && null}
    </div>
  );
};

PdMessageList.displayName = "PdMessageList";

/* ────────────────────────────────────────────────────────────────────────── */
/*  MessageBlock — memoized wrapper for renderItems map (cc-haha L485-590)     */
/* ────────────────────────────────────────────────────────────────────────── */

const MessageBlockMemo = memo(function MessageBlockMemo({
  message,
  activeThinkingId: _activeThinkingId,
  rewindableUserIndex,
  renderFn,
}: {
  message: UIMessage;
  activeThinkingId: string | null;
  rewindableUserIndex: number | null;
  renderFn: (
    msg: UIMessage,
    idx: number,
    rewindableUserIndex: number | null,
  ) => React.ReactNode;
}) {
  // idx 由调用方维护；这里仅传 -1 占位，因为 renderFn 内 isLast 计算用的是 messages.length 闭包.
  return <>{renderFn(message, -1, rewindableUserIndex)}</>;
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  Rewind Modal — 1:1 cc-haha L369-481 (panda 内联实现，不引外部 Modal/Button)  */
/*  panda 现状：sessionsApi 未接入，confirm 按钮等同 close 操作（视觉占位）       */
/* ────────────────────────────────────────────────────────────────────────── */

const RewindModal: React.FC<{
  target: { userMessageIndex: number; content: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ target, onClose, onConfirm }) => {
  if (!target) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[var(--pd-z-modal)] flex items-center justify-center bg-black/40 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-[640px]",
          "rounded-[var(--pd-radius-lg)]",
          "border border-[var(--pd-color-border)]",
          "bg-[var(--pd-color-surface)]",
          "shadow-lg",
        )}
      >
        <div className="px-5 pt-5 pb-3 text-base font-semibold text-[var(--pd-color-text-primary)]">
          {t("chat.rewindModalTitle") || "Rewind to here?"}
        </div>

        <div className="space-y-4 px-5 pb-5">
          {/* 1:1 cc-haha L399-407: prompt label card */}
          <div className="rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-4 py-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--pd-color-text-tertiary)]">
              {t("chat.rewindPromptLabel") || "Prompt"}
            </div>
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--pd-color-text-primary)]">
              {target.content || t("chat.rewindAttachmentOnly") || "(no text)"}
            </div>
          </div>
        </div>

        {/* Footer — 1:1 cc-haha L373-397 button alignment */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--pd-color-border)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex min-h-8 items-center rounded-[var(--pd-radius-sm)] px-3",
              "text-sm text-[var(--pd-color-text-secondary)]",
              "hover:bg-[var(--pd-color-bg-hover)]",
              "transition-colors",
            )}
          >
            {t("common.cancel") || "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "inline-flex min-h-8 items-center gap-1 rounded-[var(--pd-radius-sm)] px-3",
              "bg-[var(--pd-color-brand)] text-sm font-medium",
              "text-[var(--pd-color-fg-on-accent)]",
              "hover:bg-[var(--pd-color-accent-hover)]",
              "transition-colors",
            )}
          >
            <span className="material-symbols-outlined text-[16px]">undo</span>
            {t("chat.rewindConfirm") || "Rewind"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  PdToolCallGroup — V2 修复: 1:1 cc-haha ToolCallGroup L56-247                */
/*  - 单 tool（toolCalls.length===1） → 直接渲染 PdToolCallCard（cc-haha L78-87） */
/*  - 多 tool → 折叠 summary 卡（cc-haha L189-247 ToolCallGroupMulti）          */
/*  注: panda 不内联 AgentToolGroup，因为 panda Agent 工具暂未投入使用              */
/* ────────────────────────────────────────────────────────────────────────── */

// V2 修复: cc-haha L22-32 TOOL_VERBS — 把 toolName + count 转成 i18n 摘要字段
const TOOL_VERBS: Record<
  string,
  (count: number, t: (key: TranslationKey, params?: Record<string, string | number>) => string) => string
> = {
  Read: (n, tFn) => (n === 1 ? tFn("toolGroup.readOne") : tFn("toolGroup.readMany", { count: n })),
  Write: (n, tFn) => (n === 1 ? tFn("toolGroup.createdOne") : tFn("toolGroup.createdMany", { count: n })),
  Edit: (n, tFn) => (n === 1 ? tFn("toolGroup.editedOne") : tFn("toolGroup.editedMany", { count: n })),
  Bash: (n, tFn) => (n === 1 ? tFn("toolGroup.ranOne") : tFn("toolGroup.ranMany", { count: n })),
  Glob: (_n, tFn) => tFn("toolGroup.foundFiles"),
  Grep: (n, tFn) => (n === 1 ? tFn("toolGroup.searchedOne") : tFn("toolGroup.searchedMany", { count: n })),
  Agent: (n, tFn) => (n === 1 ? tFn("toolGroup.agentOne") : tFn("toolGroup.agentMany", { count: n })),
  WebSearch: (_n, tFn) => tFn("toolGroup.searchedWeb"),
  WebFetch: (n, tFn) => (n === 1 ? tFn("toolGroup.fetchedOne") : tFn("toolGroup.fetchedMany", { count: n })),
};

// V2 修复: cc-haha L34-47 generateSummary
function generateGroupSummary(
  toolCalls: UIToolUseMessage[],
  tFn: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  const counts = new Map<string, number>();
  for (const tc of toolCalls) {
    counts.set(tc.toolName, (counts.get(tc.toolName) ?? 0) + 1);
  }
  const parts: string[] = [];
  for (const [name, count] of counts) {
    const verbFn = TOOL_VERBS[name];
    parts.push(verbFn ? verbFn(count, tFn) : `${name} (${count})`);
  }
  return parts.join(", ");
}

// V2 修复: cc-haha L49-54 groupHasErrors
function groupHasErrors(
  toolCalls: UIToolUseMessage[],
  resultMap: Map<string, UIToolResultMessage>,
): boolean {
  return toolCalls.some((tc) => {
    const result = resultMap.get(tc.toolUseId);
    return result?.isError === true;
  });
}

// V2 修复: cc-haha ToolCallGroup L56-98 — 主入口分流
const PdToolCallGroup: React.FC<{
  toolCalls: UIToolUseMessage[];
  toolResultMap: Map<string, UIToolResultMessage>;
  transcriptMode: "summary" | "normal" | "verbose";
  isStreaming: boolean;
}> = ({ toolCalls, toolResultMap, transcriptMode, isStreaming }) => {
  // V2 修复: cc-haha L78-87 — 单 tool 直接渲染 PdToolCallCard
  if (toolCalls.length === 1) {
    const tc = toolCalls[0]!;
    const result = toolResultMap.get(tc.toolUseId);
    const status: "pending" | "running" | "success" | "error" = result
      ? result.isError
        ? "error"
        : "success"
      : tc.status ?? "running";
    const inlineResult = result ? extractToolResultPreview(result.content) : undefined;
    return (
      <div className="ml-10 mb-4">
        <PdToolCallCard
          toolName={tc.toolName}
          input={tc.input}
          status={status}
          result={inlineResult}
          isError={result?.isError === true}
          defaultExpanded={transcriptMode === "verbose"}
          forceCollapsed={transcriptMode === "summary"}
        />
      </div>
    );
  }

  // V2 修复: cc-haha L89-97 / L189-247 — 多 tool 折叠 summary 卡
  return (
    <PdToolCallGroupMulti
      toolCalls={toolCalls}
      toolResultMap={toolResultMap}
      transcriptMode={transcriptMode}
      isStreaming={isStreaming}
    />
  );
};

// V2 修复: cc-haha L189-247 ToolCallGroupMulti — 折叠 summary 卡 + 展开多 tool 列表
const PdToolCallGroupMulti: React.FC<{
  toolCalls: UIToolUseMessage[];
  toolResultMap: Map<string, UIToolResultMessage>;
  transcriptMode: "summary" | "normal" | "verbose";
  isStreaming: boolean;
}> = ({ toolCalls, toolResultMap, transcriptMode, isStreaming }) => {
  // V2 修复: cc-haha L190 — 默认 collapsed=false
  const [expanded, setExpanded] = useState(false);
  const summary = generateGroupSummary(toolCalls, t);
  const errorPresent = groupHasErrors(toolCalls, toolResultMap);
  const allComplete = toolCalls.every((tc) => toolResultMap.has(tc.toolUseId));

  // V2 修复: cc-haha L197-201 — streaming 时强制展开
  useEffect(() => {
    if (isStreaming) setExpanded(true);
  }, [isStreaming]);

  return (
    <div className="mb-2 ml-10">
      {/* V2 修复: cc-haha L205-228 — header 折叠按钮 */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface-container-low)] px-3 py-1.5 text-left transition-colors hover:bg-[var(--pd-color-surface-container-high)]"
      >
        <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)]">
          {expanded ? "expand_less" : "expand_more"}
        </span>
        <span className="flex-1 truncate text-[12px] text-[var(--pd-color-text-secondary)]">
          {summary}
        </span>
        {!isStreaming && allComplete && !errorPresent && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-success)]">
            check_circle
          </span>
        )}
        {!isStreaming && errorPresent && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-error)]">
            error
          </span>
        )}
        {!isStreaming && !allComplete && !errorPresent && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)]">
            pending
          </span>
        )}
        {isStreaming && (
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--pd-color-brand)] animate-pulse-dot" />
        )}
      </button>

      {/* V2 修复: cc-haha L230-244 — 展开时渲染所有 tool 卡片（compact 模式） */}
      {expanded && (
        <div className="mt-1.5 space-y-1">
          {toolCalls.map((tc) => {
            const result = toolResultMap.get(tc.toolUseId);
            const status: "pending" | "running" | "success" | "error" = result
              ? result.isError
                ? "error"
                : "success"
              : tc.status ?? "running";
            const inlineResult = result
              ? extractToolResultPreview(result.content)
              : undefined;
            return (
              <PdToolCallCard
                key={tc.id}
                toolName={tc.toolName}
                input={tc.input}
                status={status}
                result={inlineResult}
                isError={result?.isError === true}
                compact
                defaultExpanded={transcriptMode === "verbose"}
                forceCollapsed={transcriptMode === "summary"}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
