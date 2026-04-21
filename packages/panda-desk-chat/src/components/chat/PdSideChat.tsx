// Input: Parent session context, independent side session state
// Output: Compact chat panel for quick side conversations
// Pos: Chat layer — secondary conversation panel, reads parent context

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { useChatStore } from '../../stores';
import type { UIMessage } from './MessageList';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface SideChatProps {
  parentSessionId: string;
  onClose: () => void;
}

/* -------------------------------------------------------------------------- */
/*  SideChat                                                                  */
/* -------------------------------------------------------------------------- */

export const SideChat: React.FC<SideChatProps> = ({ parentSessionId, onClose }) => {
  const sideSessionId = `side-${parentSessionId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  /* -- Store selectors --------------------------------------------------- */
  const initSession = useChatStore((s) => s.initSession);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sideSession = useChatStore((s) => s.sessions.get(sideSessionId));
  const parentSession = useChatStore((s) => s.sessions.get(parentSessionId));

  /* -- Ensure side session exists ---------------------------------------- */
  useEffect(() => {
    initSession(sideSessionId);
  }, [sideSessionId, initSession]);

  /* -- Focus input on mount ---------------------------------------------- */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* -- Auto-scroll on new messages --------------------------------------- */
  const sideMessages = sideSession?.messages ?? [];
  const streamingText = sideSession?.streamingText ?? '';
  const chatState = sideSession?.chatState ?? 'idle';
  const isStreaming = chatState === 'streaming' || chatState === 'thinking';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sideMessages.length, streamingText]);

  /* -- Parent messages (context) ----------------------------------------- */
  const parentMessages: UIMessage[] = useMemo(
    () =>
      (parentSession?.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    [parentSession?.messages],
  );

  /* -- Handlers ---------------------------------------------------------- */
  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(sideSessionId, trimmed);
    setInputValue('');
  }, [inputValue, isStreaming, sendMessage, sideSessionId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      // Escape closes side chat
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleSend, onClose],
  );

  return (
    <div
      className={cn(
        'flex flex-col',
        'w-[320px] min-w-[320px] h-full',
        'border-l border-[var(--pd-color-border)]',
        'bg-[var(--pd-color-bg)]',
      )}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center justify-between shrink-0',
          'h-9 px-3',
          'bg-[var(--pd-color-bg-subtle)]',
          'border-b border-[var(--pd-color-border)]',
        )}
      >
        <span className="text-[var(--pd-text-sm)] font-[var(--pd-font-medium)] text-[var(--pd-color-fg)]">
          Side Chat
        </span>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'flex items-center justify-center',
            'w-6 h-6 rounded-[var(--pd-radius-sm)]',
            'text-[var(--pd-color-fg-muted)]',
            'hover:text-[var(--pd-color-fg)]',
            'hover:bg-[var(--pd-color-bg-hover)]',
            'transition-colors duration-[var(--pd-duration-fast)]',
          )}
          aria-label="Close side chat"
        >
          &times;
        </button>
      </div>

      {/* ── Context (parent messages, collapsible) ────────────────────── */}
      <div
        className={cn(
          'shrink-0 border-b border-[var(--pd-color-border-subtle)]',
        )}
      >
        <button
          type="button"
          onClick={() => setContextOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1 w-full px-3 py-1',
            'text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]',
            'hover:bg-[var(--pd-color-bg-hover)]',
            'transition-colors duration-[var(--pd-duration-fast)]',
          )}
        >
          <span className="inline-block transition-transform duration-150"
            style={{ transform: contextOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            &#9654;
          </span>
          <span>Context ({parentMessages.length} messages)</span>
        </button>
        {contextOpen && (
          <div className="max-h-32 overflow-y-auto px-3 pb-2">
            {parentMessages.length === 0 ? (
              <p className="text-[var(--pd-text-xs)] text-[var(--pd-color-fg-subtle)] italic">
                No parent messages
              </p>
            ) : (
              parentMessages.map((m) => (
                <div key={m.id} className="py-0.5">
                  <span
                    className={cn(
                      'text-[var(--pd-text-xs)] font-[var(--pd-font-medium)]',
                      m.role === 'user'
                        ? 'text-[var(--pd-color-accent)]'
                        : 'text-[var(--pd-color-fg-muted)]',
                    )}
                  >
                    {m.role === 'user' ? 'You' : 'AI'}:
                  </span>{' '}
                  <span className="text-[var(--pd-text-xs)] text-[var(--pd-color-fg)]">
                    {m.content.length > 120 ? `${m.content.slice(0, 120)}...` : m.content}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {sideMessages.length === 0 && !isStreaming ? (
          <p className="text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)] text-center py-4 select-none">
            Quick side conversation
          </p>
        ) : (
          sideMessages.map((m) => (
            <div key={m.id} className="py-1">
              <div className="flex items-start gap-1">
                <span
                  className={cn(
                    'text-[var(--pd-text-xs)] font-[var(--pd-font-semibold)] shrink-0',
                    m.role === 'user'
                      ? 'text-[var(--pd-color-accent)]'
                      : 'text-[var(--pd-color-fg-muted)]',
                  )}
                >
                  {m.role === 'user' ? 'You' : 'AI'}
                </span>
                <p className="text-[var(--pd-text-sm)] text-[var(--pd-color-fg)] leading-snug break-words min-w-0">
                  {m.content}
                </p>
              </div>
            </div>
          ))
        )}
        {/* Streaming bubble */}
        {isStreaming && streamingText && (
          <div className="py-1">
            <div className="flex items-start gap-1">
              <span className="text-[var(--pd-text-xs)] font-[var(--pd-font-semibold)] shrink-0 text-[var(--pd-color-fg-muted)]">
                AI
              </span>
              <p className="text-[var(--pd-text-sm)] text-[var(--pd-color-fg)] leading-snug break-words min-w-0 opacity-70">
                {streamingText}
              </p>
            </div>
          </div>
        )}
        {isStreaming && !streamingText && (
          <div className="py-1 text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)] animate-pulse">
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'shrink-0 flex items-center gap-2',
          'px-3 py-2',
          'border-t border-[var(--pd-color-border-subtle)]',
          'bg-[var(--pd-color-bg)]',
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Side message..."
          disabled={isStreaming}
          className={cn(
            'flex-1 min-w-0',
            'h-8 px-2',
            'rounded-[var(--pd-radius-md)]',
            'border border-[var(--pd-color-border)]',
            'bg-[var(--pd-color-bg-input)]',
            'text-[var(--pd-text-sm)] text-[var(--pd-color-fg)]',
            'placeholder:text-[var(--pd-color-fg-muted)]',
            'focus:outline-none focus:ring-1 focus:ring-[var(--pd-color-accent)]',
            'disabled:opacity-50',
          )}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isStreaming || !inputValue.trim()}
          className={cn(
            'shrink-0 h-8 px-3',
            'rounded-[var(--pd-radius-md)]',
            'text-[var(--pd-text-sm)] font-[var(--pd-font-medium)]',
            'bg-[var(--pd-color-accent)]',
            'text-[var(--pd-color-fg-on-accent)]',
            'hover:bg-[var(--pd-color-accent-hover)]',
            'active:bg-[var(--pd-color-accent-active)]',
            'disabled:opacity-40 disabled:pointer-events-none',
            'transition-colors duration-[var(--pd-duration-fast)]',
          )}
        >
          Send
        </button>
      </div>
    </div>
  );
};

SideChat.displayName = 'SideChat';
