// Input: 用户输入文本 + localStorage 持久化消息 + sessionId
// Output: 侧边聊天面板 — 独立于主会话的轻量级辅助聊天
// Pos: PdInspector > sideChat tab 内容区
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useState, useEffect, useRef, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { useChatStore } from '../../../stores/chatStore';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface SideChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const MAX_MESSAGES = 50;
const STORAGE_PREFIX = 'panda-sidechat-';

/* -------------------------------------------------------------------------- */
/*  Persistence helpers                                                       */
/* -------------------------------------------------------------------------- */

function loadMessages(sessionId: string): SideChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + sessionId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES) : [];
  } catch {
    return [];
  }
}

function saveMessages(sessionId: string, messages: SideChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + sessionId, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // localStorage full — silently ignore
  }
}

/* -------------------------------------------------------------------------- */
/*  Mock response (IPC bridge not wired for side-chat yet)                    */
/* -------------------------------------------------------------------------- */

function generateMockResponse(userContent: string): string {
  const lower = userContent.toLowerCase();
  if (lower.includes('help') || lower.includes('帮助'))
    return '有什么可以帮你的？你可以在这里提出快速问题，不会影响主对话。';
  if (lower.includes('hello') || lower.includes('你好'))
    return '你好！这是侧边聊天，可以用于快速笔记和提问。';
  if (lower.includes('status') || lower.includes('状态'))
    return '主会话正常运行中。这里的消息独立于主对话。';
  return `已收到: "${userContent.slice(0, 60)}${userContent.length > 60 ? '...' : ''}"。侧边聊天暂为本地模式，后续将接入 IPC bridge。`;
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function ChatBubble({ msg }: { msg: SideChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className="flex"
      style={{
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 8,
      }}
    >
      <div
        className="rounded-lg px-3 py-2 text-xs"
        style={{
          maxWidth: '85%',
          background: isUser ? 'var(--pd-color-accent, #22c55e)' : 'var(--pd-color-bg-hover)',
          color: isUser ? '#fff' : 'var(--pd-color-fg)',
          borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
          wordBreak: 'break-word',
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Panel                                                                */
/* -------------------------------------------------------------------------- */

export function SideChatPanel() {
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessionId = activeSessionId ?? 'default';

  const [messages, setMessages] = useState<SideChatMessage[]>(() => loadMessages(sessionId));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reload messages when session changes
  useEffect(() => {
    setMessages(loadMessages(sessionId));
  }, [sessionId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Persist on change
  useEffect(() => {
    saveMessages(sessionId, messages);
  }, [sessionId, messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: SideChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg].slice(-MAX_MESSAGES));
    setInput('');
    setIsSending(true);

    // Simulate async response (replace with IPC bridge call when available)
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

    const assistantMsg: SideChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: generateMockResponse(text),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMsg].slice(-MAX_MESSAGES));
    setIsSending(false);
    inputRef.current?.focus();
  }, [input, isSending]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-[var(--pd-fg)]">侧边聊天</h3>
        <span className="text-[10px] text-[var(--pd-color-fg-muted)]">
          {messages.length} 条消息
        </span>
      </div>
      <div className="mx-4 border-t border-[var(--pd-color-border)]" />

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--pd-color-fg-muted)]">
            在这里提问，不会打断主对话
          </div>
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} msg={msg} />)
        )}
        {isSending && (
          <div className="flex justify-start mb-2">
            <div
              className="rounded-lg px-3 py-2 text-xs"
              style={{
                background: 'var(--pd-color-bg-hover)',
                color: 'var(--pd-color-fg-muted)',
                borderRadius: '12px 12px 12px 4px',
              }}
            >
              ...
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex items-center gap-2 px-3 py-2"
        style={{ borderTop: '1px solid var(--pd-color-border)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          disabled={isSending}
          className="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none"
          style={{
            background: 'var(--pd-color-bg)',
            borderColor: 'var(--pd-color-border)',
            color: 'var(--pd-color-fg)',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="shrink-0 cursor-pointer rounded-lg border-none px-3 py-1.5 text-xs font-medium"
          style={{
            background: input.trim() && !isSending ? 'var(--pd-color-accent, #22c55e)' : 'var(--pd-color-bg-hover)',
            color: input.trim() && !isSending ? '#fff' : 'var(--pd-color-fg-muted)',
            cursor: input.trim() && !isSending ? 'pointer' : 'default',
          }}
        >
          发送
        </button>
      </form>
    </div>
  );
}
