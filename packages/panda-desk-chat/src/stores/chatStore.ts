// Input: Chat events from IPC bridge (streaming deltas, tool calls, permissions) + disk session history
// Output: Per-session chat state (cc-haha-aligned MessageEntry[] union with 5 types, streaming buffers, permissions)
// Pos: Core state layer — drives message list, composer, permission dialogs, status bar

import { create } from 'zustand';
import * as bridge from '../ipc/bridge';
import type { MessageEntry } from '../ipc/types';
import { useToastStore } from './toastStore';

// ---------------------------------------------------------------------------
// Types — UIMessage union mirrors cc-haha MessageEntry (5 types)
// ---------------------------------------------------------------------------

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export type MessageFeedback = 'positive' | 'negative' | null;

/**
 * 5-type message union. Each entry is independent — tool_use and
 * tool_result are NOT folded into the assistant turn. Renderer dispatches
 * by `type`. `content` is left as `unknown` for dispatch-time extraction
 * (text/thinking/tool_use/tool_result blocks are pulled out lossily on
 * demand by extractText/extractThinking/etc.).
 */
export interface UIMessageBase {
  id: string;
  /** ms-since-epoch, derived from JSONL `timestamp` or live Date.now(). */
  timestamp: number;
}

export interface UIUserMessage extends UIMessageBase {
  type: 'user';
  /** Raw JSONL content — string or Anthropic content blocks array. */
  content: unknown;
  feedback?: MessageFeedback;
}

export interface UIAssistantMessage extends UIMessageBase {
  type: 'assistant';
  /** Raw JSONL content — string or Anthropic content blocks array. */
  content: unknown;
  /**
   * Live-streaming text buffer. While streaming we append to this
   * string and let the renderer extract via extractText(content) ||
   * streamingContent.
   */
  streamingContent?: string;
  thinkingContent?: string;
  model?: string;
  tokenUsage?: TokenUsage;
  finishReason?: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  feedback?: MessageFeedback;
}

export interface UISystemMessage extends UIMessageBase {
  type: 'system';
  content: unknown;
}

export interface UIToolUseMessage extends UIMessageBase {
  type: 'tool_use';
  /** The full Anthropic content array — usually `[{type:'tool_use', ...}]`. */
  content: unknown;
  /** Hoisted for renderer convenience; equals the `id` of the tool_use block. */
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  /**
   * Set when the live tool stream completes. Renderer uses this +
   * matching tool_result entry to decide success/error pill.
   */
  status?: 'pending' | 'running' | 'success' | 'error';
  parentToolUseId?: string;
}

export interface UIToolResultMessage extends UIMessageBase {
  type: 'tool_result';
  /** The raw `content` field from the tool_result block (string or array). */
  content: unknown;
  toolUseId: string;
  isError?: boolean;
  parentToolUseId?: string;
}

export type UIMessage =
  | UIUserMessage
  | UIAssistantMessage
  | UISystemMessage
  | UIToolUseMessage
  | UIToolResultMessage;

export type TranscriptMode = 'normal' | 'verbose' | 'summary';

export type ChatState =
  | 'idle'
  | 'thinking'
  | 'streaming'
  | 'tool_executing'
  | 'permission_pending';

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface PendingPermission {
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  tier: 'read' | 'write' | 'exec';
}

export interface RoutingInfo {
  fromModel?: string;
  toModel: string;
  reason?: string;
}

export interface PerSessionState {
  sessionId: string;
  messages: UIMessage[];
  chatState: ChatState;
  connectionState: ConnectionState;
  streamingText: string;
  streamingToolInput: string;
  activeToolUseId: string | null;
  activeToolName: string | null;
  activeThinkingId: string | null;
  pendingPermission: PendingPermission | null;
  tokenUsage: TokenUsage;
  elapsedSeconds: number;
  statusVerb: string;
  routingInfo: RoutingInfo | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptySession(sessionId: string): PerSessionState {
  return {
    sessionId,
    messages: [],
    chatState: 'idle',
    connectionState: 'disconnected',
    streamingText: '',
    streamingToolInput: '',
    activeToolUseId: null,
    activeToolName: null,
    activeThinkingId: null,
    pendingPermission: null,
    tokenUsage: { input: 0, output: 0 },
    elapsedSeconds: 0,
    statusVerb: '',
    routingInfo: null,
  };
}

/** Shallow-clone a session from the map, returning null if missing. */
function getSession(
  sessions: Map<string, PerSessionState>,
  sessionId: string,
): PerSessionState | null {
  return sessions.get(sessionId) ?? null;
}

/** Return a new Map with an updated session entry. */
function putSession(
  sessions: Map<string, PerSessionState>,
  session: PerSessionState,
): Map<string, PerSessionState> {
  const next = new Map(sessions);
  next.set(session.sessionId, session);
  return next;
}

/**
 * Locate a message inside a session's message list and return a shallow copy
 * of the array with the updated message. Returns null if the message is not
 * found.
 */
function updateMessage(
  messages: UIMessage[],
  messageId: string,
  updater: (msg: UIMessage) => UIMessage,
): UIMessage[] | null {
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx === -1) return null;
  const updated = [...messages];
  updated[idx] = updater({ ...messages[idx] });
  return updated;
}

// ---------------------------------------------------------------------------
// Stream buffer — accumulates deltas between flushes (16 ms cadence)
// ---------------------------------------------------------------------------

interface StreamBuffer {
  text: string;
  thinking: string;
  toolInput: string;
}

const streamBuffers = new Map<string, StreamBuffer>();

function getBuffer(sessionId: string): StreamBuffer {
  let buf = streamBuffers.get(sessionId);
  if (!buf) {
    buf = { text: '', thinking: '', toolInput: '' };
    streamBuffers.set(sessionId, buf);
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface ChatStore {
  sessions: Map<string, PerSessionState>;
  activeSessionId: string | null;
  transcriptMode: TranscriptMode;

  // Getters
  getActiveSession: () => PerSessionState | null;

  // Transcript mode
  cycleTranscriptMode: () => void;
  setTranscriptMode: (mode: TranscriptMode) => void;

  // Session lifecycle
  initSession: (sessionId: string) => void;
  removeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string) => void;

  // Message actions
  addUserMessage: (sessionId: string, content: string) => void;
  startStreaming: (sessionId: string, messageId: string) => void;
  appendStreamDelta: (
    sessionId: string,
    messageId: string,
    delta: string,
    type: 'text' | 'thinking' | 'tool_input',
  ) => void;
  endStreaming: (
    sessionId: string,
    messageId: string,
    finishReason: string,
    tokenUsage?: TokenUsage,
  ) => void;

  // Tool actions
  startToolUse: (
    sessionId: string,
    toolUseId: string,
    toolName: string,
    input: Record<string, unknown>,
  ) => void;
  endToolUse: (
    sessionId: string,
    toolUseId: string,
    result: string,
    isError: boolean,
  ) => void;

  // Permission actions
  requestPermission: (
    sessionId: string,
    permission: PendingPermission,
  ) => void;
  resolvePermission: (sessionId: string) => void;

  // Connection
  setConnectionState: (sessionId: string, state: ConnectionState) => void;

  // Timer / status
  setElapsed: (sessionId: string, seconds: number) => void;
  setStatusVerb: (sessionId: string, verb: string) => void;

  // Routing
  setRoutingInfo: (sessionId: string, info: RoutingInfo) => void;
  dismissRouting: (sessionId: string) => void;

  // Batch flush (call every ~16 ms from a RAF loop)
  flushStreamBuffer: (sessionId: string) => void;

  // High-level actions — wired to IPC bridge
  sendMessage: (sessionId: string, content: string) => void;
  respondPermission: (
    sessionId: string,
    toolUseId: string,
    decision: 'allow' | 'allow_session' | 'deny',
  ) => void;
  cancelStream: (sessionId: string) => void;
  pasteImage: (sessionId: string, dataUrl: string) => void;

  // Interaction enhancements (§11.4.2)
  setFeedback: (sessionId: string, messageId: string, feedback: MessageFeedback) => void;
  retryLastMessage: (sessionId: string) => void;

  /** Load session history from disk via IPC and populate messages. */
  loadSessionHistory: (sessionId: string) => Promise<void>;

  // ── cc-haha 兼容别名（PdSidebar/PdTabBar 1:1 复刻调用）────────────
  /** cc-haha: setActiveSession + loadSessionHistory + bridge.focusSession 一体动作。 */
  connectToSession: (sessionId: string) => void;
  /** cc-haha: 释放会话（等价于 removeSession 的清理动作）。 */
  disconnectSession: (sessionId: string) => void;
  /** cc-haha: 停止当前生成（等价于 cancelStream）。 */
  stopGeneration: (sessionId: string) => void;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  sessions: new Map<string, PerSessionState>(),
  activeSessionId: null,
  transcriptMode: 'normal' as TranscriptMode,

  // -- Getters ---------------------------------------------------------------

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    if (!activeSessionId) return null;
    return sessions.get(activeSessionId) ?? null;
  },

  // -- Transcript mode -------------------------------------------------------

  cycleTranscriptMode: () =>
    set((state) => {
      const order: TranscriptMode[] = ['normal', 'verbose', 'summary'];
      const idx = order.indexOf(state.transcriptMode);
      const next = order[(idx + 1) % order.length];
      return { transcriptMode: next };
    }),

  setTranscriptMode: (mode: TranscriptMode) => set({ transcriptMode: mode }),

  // -- Session lifecycle -----------------------------------------------------

  initSession: (sessionId) =>
    set((state) => {
      if (state.sessions.has(sessionId)) return state;
      return { sessions: putSession(state.sessions, createEmptySession(sessionId)) };
    }),

  removeSession: (sessionId) =>
    set((state) => {
      const next = new Map(state.sessions);
      next.delete(sessionId);
      streamBuffers.delete(sessionId);
      return {
        sessions: next,
        activeSessionId:
          state.activeSessionId === sessionId ? null : state.activeSessionId,
      };
    }),

  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId });
    // Lazy-load history from disk when switching to a session
    const session = getSession(get().sessions, sessionId);
    if (!session || session.messages.length === 0) {
      get().loadSessionHistory(sessionId);
    }
  },

  // -- Message actions -------------------------------------------------------

  addUserMessage: (sessionId, content) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      const msg: UIUserMessage = {
        id: crypto.randomUUID(),
        type: 'user',
        content,
        timestamp: Date.now(),
      };
      return {
        sessions: putSession(state.sessions, {
          ...session,
          messages: [...session.messages, msg],
          chatState: 'thinking',
        }),
      };
    }),

  startStreaming: (sessionId, messageId) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      // Create a placeholder assistant message — content stays empty until
      // the stream fills `streamingContent`. (cc-haha builds assistant
      // content on the fly the same way.)
      const msg: UIAssistantMessage = {
        id: messageId,
        type: 'assistant',
        content: '',
        streamingContent: '',
        timestamp: Date.now(),
      };
      return {
        sessions: putSession(state.sessions, {
          ...session,
          messages: [...session.messages, msg],
          chatState: 'streaming',
          streamingText: '',
          streamingToolInput: '',
        }),
      };
    }),

  appendStreamDelta: (sessionId, _messageId, delta, type) => {
    // Hot path — buffer only, no React re-render.
    const buf = getBuffer(sessionId);
    switch (type) {
      case 'text':
        buf.text += delta;
        break;
      case 'thinking':
        buf.thinking += delta;
        break;
      case 'tool_input':
        buf.toolInput += delta;
        break;
    }
  },

  flushStreamBuffer: (sessionId) =>
    set((state) => {
      const buf = streamBuffers.get(sessionId);
      if (!buf || (buf.text === '' && buf.thinking === '' && buf.toolInput === '')) {
        return state;
      }
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;

      const textDelta = buf.text;
      const thinkingDelta = buf.thinking;
      const toolInputDelta = buf.toolInput;

      // Reset buffer
      buf.text = '';
      buf.thinking = '';
      buf.toolInput = '';

      // Apply deltas to the last assistant message — only assistant
      // entries can absorb streaming text. (Tool-use streaming goes into
      // session.streamingToolInput, which the active tool card reads.)
      const messages = [...session.messages];
      const lastIdx = messages.length - 1;
      if (lastIdx < 0 || messages[lastIdx].type !== 'assistant') {
        return {
          sessions: putSession(state.sessions, {
            ...session,
            streamingText: session.streamingText + textDelta,
            streamingToolInput: session.streamingToolInput + toolInputDelta,
          }),
        };
      }

      const lastMsg: UIAssistantMessage = { ...(messages[lastIdx] as UIAssistantMessage) };
      if (textDelta) {
        lastMsg.streamingContent = (lastMsg.streamingContent ?? '') + textDelta;
      }
      if (thinkingDelta) {
        lastMsg.thinkingContent = (lastMsg.thinkingContent ?? '') + thinkingDelta;
      }
      messages[lastIdx] = lastMsg;

      return {
        sessions: putSession(state.sessions, {
          ...session,
          messages,
          streamingText: session.streamingText + textDelta,
          streamingToolInput: session.streamingToolInput + toolInputDelta,
        }),
      };
    }),

  endStreaming: (sessionId, messageId, finishReason, tokenUsage) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;

      // Flush any remaining buffered data first
      const buf = streamBuffers.get(sessionId);
      let messages = session.messages;
      if (buf && (buf.text || buf.thinking || buf.toolInput)) {
        messages = [...messages];
        const lastIdx = messages.length - 1;
        if (lastIdx >= 0 && messages[lastIdx].type === 'assistant') {
          const m: UIAssistantMessage = { ...(messages[lastIdx] as UIAssistantMessage) };
          if (buf.text) m.streamingContent = (m.streamingContent ?? '') + buf.text;
          if (buf.thinking) {
            m.thinkingContent = (m.thinkingContent ?? '') + buf.thinking;
          }
          messages[lastIdx] = m;
        }
        buf.text = '';
        buf.thinking = '';
        buf.toolInput = '';
      }

      // Finalize: lock in `content` from the streaming buffer so reload
      // from disk produces the same render shape, and stamp finish meta.
      const updated = updateMessage(messages, messageId, (msg) => {
        if (msg.type !== 'assistant') return msg;
        const finalContent =
          msg.streamingContent && msg.streamingContent.length > 0
            ? msg.streamingContent
            : msg.content;
        return {
          ...msg,
          content: finalContent,
          streamingContent: undefined,
          finishReason: finishReason as UIAssistantMessage['finishReason'],
          tokenUsage,
        };
      });

      return {
        sessions: putSession(state.sessions, {
          ...session,
          messages: updated ?? messages,
          chatState: 'idle',
          streamingText: '',
          streamingToolInput: '',
          tokenUsage: tokenUsage
            ? {
                input: session.tokenUsage.input + tokenUsage.input,
                output: session.tokenUsage.output + tokenUsage.output,
                cacheRead:
                  (session.tokenUsage.cacheRead ?? 0) +
                  (tokenUsage.cacheRead ?? 0),
                cacheWrite:
                  (session.tokenUsage.cacheWrite ?? 0) +
                  (tokenUsage.cacheWrite ?? 0),
              }
            : session.tokenUsage,
        }),
      };
    }),

  // -- Tool actions ----------------------------------------------------------

  startToolUse: (sessionId, toolUseId, toolName, input) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;

      // Push the tool_use as an INDEPENDENT MessageEntry (cc-haha shape).
      // We do NOT mutate the prior assistant message's content array.
      // `content` is shaped as a single Anthropic content block so that
      // disk-reload (which preserves raw block arrays) renders identically.
      const toolUseMsg: UIToolUseMessage = {
        id: toolUseId,
        type: 'tool_use',
        timestamp: Date.now(),
        toolUseId,
        toolName,
        input,
        status: 'running',
        content: [
          { type: 'tool_use', id: toolUseId, name: toolName, input },
        ],
      };

      return {
        sessions: putSession(state.sessions, {
          ...session,
          messages: [...session.messages, toolUseMsg],
          chatState: 'tool_executing',
          activeToolUseId: toolUseId,
          activeToolName: toolName,
          streamingToolInput: '',
        }),
      };
    }),

  endToolUse: (sessionId, toolUseId, result, isError) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;

      // 1. Update the existing tool_use entry's status (so the inline
      //    card renders the right pill on hot reloads / live too).
      const messages = session.messages.map((m): UIMessage => {
        if (m.type === 'tool_use' && m.toolUseId === toolUseId) {
          return {
            ...m,
            status: isError ? 'error' : 'success',
          };
        }
        return m;
      });

      // 2. Append a standalone tool_result MessageEntry. cc-haha
      //    semantics: the result is its own line in the transcript and
      //    MessageList's `buildRenderModel` decides whether to inline it
      //    next to the matching tool_use card or render standalone.
      const resultMsg: UIToolResultMessage = {
        id: `result-${toolUseId}-${Date.now()}`,
        type: 'tool_result',
        timestamp: Date.now(),
        toolUseId,
        isError,
        content: result,
      };

      return {
        sessions: putSession(state.sessions, {
          ...session,
          messages: [...messages, resultMsg],
          chatState: 'streaming',
          activeToolUseId: null,
          activeToolName: null,
          streamingToolInput: '',
        }),
      };
    }),

  // -- Permission actions ----------------------------------------------------

  requestPermission: (sessionId, permission) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      return {
        sessions: putSession(state.sessions, {
          ...session,
          chatState: 'permission_pending',
          pendingPermission: permission,
        }),
      };
    }),

  resolvePermission: (sessionId) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      return {
        sessions: putSession(state.sessions, {
          ...session,
          chatState: 'streaming',
          pendingPermission: null,
        }),
      };
    }),

  // -- Connection ------------------------------------------------------------

  setConnectionState: (sessionId, connectionState) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      return {
        sessions: putSession(state.sessions, { ...session, connectionState }),
      };
    }),

  // -- Timer / status --------------------------------------------------------

  setElapsed: (sessionId, seconds) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      return {
        sessions: putSession(state.sessions, {
          ...session,
          elapsedSeconds: seconds,
        }),
      };
    }),

  setStatusVerb: (sessionId, verb) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      return {
        sessions: putSession(state.sessions, { ...session, statusVerb: verb }),
      };
    }),

  setRoutingInfo: (sessionId, info) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      return {
        sessions: putSession(state.sessions, { ...session, routingInfo: info }),
      };
    }),

  dismissRouting: (sessionId) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      return {
        sessions: putSession(state.sessions, { ...session, routingInfo: null }),
      };
    }),

  // -- High-level bridge actions -----------------------------------------------

  sendMessage: (sessionId, content) => {
    const { addUserMessage } = get();
    addUserMessage(sessionId, content);
    bridge.sendMessage(sessionId, content).catch(async (err) => {
      // If the backend says session not found, focus it (triggers auto-create)
      // then retry once.
      const msg = err instanceof Error ? err.message : String(err);
      if (/not found|no.*session/i.test(msg)) {
        console.warn('[chatStore] Session stale, re-materialising:', sessionId);
        try {
          await bridge.focusSession(sessionId);
          await bridge.sendMessage(sessionId, content);
          return; // retry succeeded
        } catch (retryErr) {
          console.error('[chatStore] Retry after re-create also failed:', retryErr);
        }
      }
      console.error('[chatStore] sendMessage failed:', err);
      useToastStore.getState().addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to send message',
      });
    });
  },

  respondPermission: (sessionId, toolUseId, decision) => {
    const { resolvePermission } = get();
    resolvePermission(sessionId);
    bridge.respondToPermission(sessionId, toolUseId, decision).catch((err) => {
      console.error('[chatStore] respondPermission failed:', err);
      useToastStore.getState().addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to respond to permission',
      });
    });
  },

  cancelStream: (sessionId) => {
    bridge.stopGeneration(sessionId).catch((err) => {
      console.error('[chatStore] cancelStream failed:', err);
      useToastStore.getState().addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to cancel stream',
      });
    });
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      return {
        sessions: putSession(state.sessions, {
          ...session,
          chatState: 'idle',
          streamingText: '',
          streamingToolInput: '',
          activeToolUseId: null,
          activeToolName: null,
          pendingPermission: null,
        }),
      };
    });
  },

  pasteImage: (sessionId, dataUrl) => {
    bridge.pasteImage(sessionId, dataUrl).catch((err) => {
      console.error('[chatStore] pasteImage failed:', err);
      useToastStore.getState().addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to paste image',
      });
    });
  },

  // -- Interaction enhancements (§11.4.2) ------------------------------------

  setFeedback: (sessionId, messageId, feedback) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      const updated = updateMessage(session.messages, messageId, (msg) => ({
        ...msg,
        feedback,
      }));
      if (!updated) return state;
      return {
        sessions: putSession(state.sessions, { ...session, messages: updated }),
      };
    }),

  retryLastMessage: (sessionId) => {
    const state = get();
    const session = getSession(state.sessions, sessionId);
    if (!session) return;
    if (session.chatState !== 'idle') return;

    // Find the last user message — content might be a raw block array
    // when reloaded from disk, so reach for extractText() here.
    const { messages } = session;
    let lastUserContent: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.type === 'user') {
        lastUserContent = extractText(m.content);
        break;
      }
    }
    if (!lastUserContent) return;

    // Remove trailing assistant/tool messages so the resend produces a
    // fresh assistant turn (cc-haha behaviour: rewind back to the user
    // message).
    let trimEnd = messages.length;
    while (
      trimEnd > 0 &&
      messages[trimEnd - 1].type !== 'user'
    ) {
      trimEnd--;
    }
    const trimmed = messages.slice(0, trimEnd);

    set((s) => {
      const sess = getSession(s.sessions, sessionId);
      if (!sess) return s;
      return {
        sessions: putSession(s.sessions, { ...sess, messages: trimmed }),
      };
    });

    // Re-send via the bridge (addUserMessage + bridge call)
    get().sendMessage(sessionId, lastUserContent);
  },

  loadSessionHistory: async (sessionId) => {
    // Always seed an empty session immediately so the conversation view has
    // something to render while the IPC round-trip resolves.
    set((state) => {
      if (getSession(state.sessions, sessionId)) return state;
      return {
        sessions: putSession(state.sessions, createEmptySession(sessionId)),
      };
    });

    try {
      const detail = await bridge.getSessionHistory(sessionId);
      if (!detail) {
        console.warn('[chatStore] No session detail for', sessionId);
        return;
      }
      if (!detail.messages.length) {
        console.info('[chatStore] Session has no messages yet:', sessionId);
        return;
      }

      // 1:1 pass-through from MessageEntry → UIMessage. We preserve `content`
      // as `unknown` and let the renderer extract text/tool_use blocks on
      // demand. Tool_use & tool_result entries get hoisted fields so the
      // standalone cards have the data they need without re-walking content.
      const messages: UIMessage[] = detail.messages.map((m) =>
        messageEntryToUIMessage(m),
      );

      set((state) => {
        const existing = getSession(state.sessions, sessionId);
        if (existing && existing.messages.length > 0) return state;

        const session: PerSessionState = existing ?? createEmptySession(sessionId);
        return {
          sessions: putSession(state.sessions, {
            ...session,
            messages,
            connectionState: session.connectionState === 'connected'
              ? 'connected'
              : 'disconnected',
          }),
        };
      });
    } catch (err) {
      console.error('[chatStore] Failed to load session history:', err);
    }
  },

  // -- cc-haha 兼容别名 -----------------------------------------------------

  connectToSession: (sessionId) => {
    const { setActiveSession } = get();
    setActiveSession(sessionId);
  },

  disconnectSession: (sessionId) => {
    const { removeSession } = get();
    removeSession(sessionId);
  },

  stopGeneration: (sessionId) => {
    const { cancelStream } = get();
    cancelStream(sessionId);
  },
}));

// ---------------------------------------------------------------------------
// MessageEntry → UIMessage (lossless adapter for disk-history replay)
// ---------------------------------------------------------------------------

/** Hoist the first tool_use block out of a MessageEntry's content. */
function findFirstToolUseBlock(content: unknown): {
  id: string;
  name: string;
  input: Record<string, unknown>;
} | null {
  if (!Array.isArray(content)) return null;
  for (const raw of content as Array<Record<string, unknown>>) {
    if (
      raw?.type === 'tool_use' &&
      typeof raw?.id === 'string' &&
      typeof raw?.name === 'string'
    ) {
      const input =
        raw?.input && typeof raw.input === 'object' && raw.input !== null
          ? (raw.input as Record<string, unknown>)
          : {};
      return { id: raw.id as string, name: raw.name as string, input };
    }
  }
  return null;
}

/** Hoist the first tool_result block out of a MessageEntry's content. */
function findFirstToolResultBlock(content: unknown): {
  toolUseId: string;
  inner: unknown;
  isError: boolean;
} | null {
  if (!Array.isArray(content)) return null;
  for (const raw of content as Array<Record<string, unknown>>) {
    if (raw?.type === 'tool_result' && typeof raw?.tool_use_id === 'string') {
      return {
        toolUseId: raw.tool_use_id as string,
        inner: raw.content,
        isError: raw.is_error === true,
      };
    }
  }
  return null;
}

function extractThinking(content: unknown): string | undefined {
  if (!Array.isArray(content)) return undefined;
  const parts: string[] = [];
  for (const raw of content as Array<Record<string, unknown>>) {
    if (raw?.type === 'thinking' && typeof raw?.thinking === 'string') {
      parts.push(raw.thinking);
    }
  }
  return parts.length > 0 ? parts.join('\n') : undefined;
}

/**
 * Best-effort string extraction. Used for retry (where we need the
 * original user prompt as plain text) and a few defensive fallbacks.
 * Tool calls render directly from content blocks elsewhere.
 */
function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const raw of content as Array<Record<string, unknown>>) {
    if (raw?.type === 'text' && typeof raw?.text === 'string') {
      parts.push(raw.text);
    }
  }
  return parts.join('\n');
}

/** Re-exported for renderer dispatch (PdMessageList + PdToolResultBlock). */
export { extractText, extractThinking };

function messageEntryToUIMessage(entry: MessageEntry): UIMessage {
  const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now();
  const id = entry.id || crypto.randomUUID();
  const stableTs = Number.isNaN(ts) ? Date.now() : ts;

  switch (entry.type) {
    case 'user':
      return {
        id,
        type: 'user',
        content: entry.content,
        timestamp: stableTs,
      };

    case 'assistant':
      return {
        id,
        type: 'assistant',
        content: entry.content,
        timestamp: stableTs,
        model: entry.model,
        thinkingContent: extractThinking(entry.content),
      };

    case 'system':
      return {
        id,
        type: 'system',
        content: entry.content,
        timestamp: stableTs,
      };

    case 'tool_use': {
      const block = findFirstToolUseBlock(entry.content);
      const toolUseId = block?.id ?? id;
      const toolName = block?.name ?? 'unknown';
      const input = block?.input ?? {};
      return {
        id,
        type: 'tool_use',
        content: entry.content,
        timestamp: stableTs,
        toolUseId,
        toolName,
        input,
        // Loaded from disk → tool already ran; treat unknown as success.
        status: 'success',
        parentToolUseId: entry.parentToolUseId,
      };
    }

    case 'tool_result': {
      const block = findFirstToolResultBlock(entry.content);
      return {
        id,
        type: 'tool_result',
        content: block?.inner ?? entry.content,
        timestamp: stableTs,
        toolUseId: block?.toolUseId ?? '',
        isError: block?.isError === true,
        parentToolUseId: entry.parentToolUseId,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Bridge event wiring — connects IPC events to store actions
// ---------------------------------------------------------------------------

let flushRAF: ReturnType<typeof requestAnimationFrame> | null = null;
const activeSessions = new Set<string>();

// Comdr 指令 (任务 2 — 消息流刷新 bug 根因修复):
//   将 listener 句柄持久化到 globalThis，HMR 重载新模块时可以解除旧 listener
//   再重新绑定到当前模块的 useChatStore。否则旧 listener 仍调旧 store 实例的
//   action，新 store（React 组件订阅）永远收不到 stream:start/delta/end →
//   chatState 卡 thinking + assistant 消息不出现，必须 Cmd+R 才能见到。
//   生产模式无 HMR，模块只加载一次，行为等价。
type BridgeUnsub = () => void;
type BridgeRefs = {
  unsubs: BridgeUnsub[];
};
const G = globalThis as unknown as { __pdChatBridge?: BridgeRefs };

/**
 * Setup IPC bridge listeners. Call once at app initialization (and re-call after HMR).
 * 内部已做幂等：先解除旧 listener，再绑定新 listener。
 */
export function setupBridgeListeners(): void {
  // HMR resilience: tear down previous listeners (if any) so new ones bind to
  // the freshly-loaded useChatStore instance.
  if (G.__pdChatBridge?.unsubs) {
    for (const off of G.__pdChatBridge.unsubs) {
      try { off(); } catch { /* noop */ }
    }
  }
  const refs: BridgeRefs = { unsubs: [] };
  G.__pdChatBridge = refs;

  const store = useChatStore.getState;

  // 设置初始状态为 connecting（表示正在尝试连接）
  const activeSession = store().activeSessionId;
  if (activeSession) {
    store().setConnectionState(activeSession, 'connecting');
  }

  // stream:start → create assistant message placeholder
  refs.unsubs.push(bridge.onStreamStart((payload) => {
    const { sessionId, messageId } = payload as { sessionId: string; messageId: string };
    store().startStreaming(sessionId, messageId);
    store().setConnectionState(sessionId, 'connected');
    activeSessions.add(sessionId);
    startFlushLoop();
  }));

  // stream:delta → buffer deltas
  refs.unsubs.push(bridge.onStreamDelta((payload) => {
    const { sessionId, messageId, delta, type } = payload as {
      sessionId: string;
      messageId: string;
      delta: string;
      type: 'text' | 'thinking' | 'tool_input';
    };
    store().appendStreamDelta(sessionId, messageId, delta, type);
  }));

  // stream:end → finalize message
  refs.unsubs.push(bridge.onStreamEnd((payload) => {
    const { sessionId, messageId, finishReason, tokenUsage } = payload as {
      sessionId: string;
      messageId: string;
      finishReason: string;
      tokenUsage?: TokenUsage;
    };
    store().endStreaming(sessionId, messageId, finishReason, tokenUsage);
    store().setConnectionState(sessionId, 'connected');
    activeSessions.delete(sessionId);
    if (activeSessions.size === 0) stopFlushLoop();
  }));

  // tool:start
  refs.unsubs.push(bridge.onToolUseStart((payload) => {
    const { sessionId, toolUseId, toolName, input } = payload as {
      sessionId: string;
      toolUseId: string;
      toolName: string;
      input: Record<string, unknown>;
    };
    store().startToolUse(sessionId, toolUseId, toolName, input);
  }));
  refs.unsubs.push(bridge.onToolUseEnd((payload) => {
    const { sessionId, toolUseId, result, isError } = payload as {
      sessionId: string;
      toolUseId: string;
      result: string;
      isError: boolean;
    };
    store().endToolUse(sessionId, toolUseId, result, isError);
  }));

  // permission:request
  refs.unsubs.push(bridge.onPermissionRequest((payload) => {
    const { sessionId, toolUseId, toolName, input, tier } = payload as {
      sessionId: string;
      toolUseId: string;
      toolName: string;
      input: Record<string, unknown>;
      tier: 'read' | 'write' | 'exec';
    };
    store().requestPermission(sessionId, { toolUseId, toolName, input, tier });
  }));

  // window:toggle → dispatch custom DOM event for UI components
  refs.unsubs.push(bridge.onWindowToggle(() => {
    window.dispatchEvent(new CustomEvent('pd-window-toggle'));
  }));

  // session:ready → CLI has finished initialization
  refs.unsubs.push(bridge.onSessionReady((payload) => {
    const { sessionId } = payload as { sessionId: string };
    store().setConnectionState(sessionId, 'connected');
  }));

  // message:history → replayed messages during resume + live assistant push.
  // Comdr 指令 (任务 2 三阶根因): cli-manager.ts L750-756 发 'message:assistant'
  //   wireSessionEvents 用 spread 把整个 SDKMessage 字段铺到 payload 上 —
  //   payload 形态是 { sessionId, role, type:'assistant', message:{role,content:[...]}, ...}。
  //   旧代码只取 payload.content（不存在）→ history msg 的 content=undefined →
  //   extractText 拿空字符串 → assistant text bubble 永远为空（thinking 仍显示因为走
  //   独立 streaming flush 路径写到 placeholder.thinkingContent）。
  // 修复 1: 从 payload.message.content / payload.content 双源取 content。
  // 修复 2: 如果 messages 末尾已有 streaming placeholder（同 messageId 或最后一条 assistant
  //   content 为空），update 它而不是 push 新 — 避免 placeholder + history 重复 + thinking 双显示。
  refs.unsubs.push(bridge.onMessageHistory((payload) => {
    const p = payload as {
      sessionId: string;
      role: 'assistant' | 'user' | 'system';
      content?: unknown;
      message?: { content?: unknown; id?: string };
    };
    const { sessionId, role } = p;
    const content = p.message?.content ?? p.content;
    const incomingId = p.message?.id;
    const sess = store().sessions.get(sessionId);
    if (!sess) return;
    const ts = Date.now();

    // Try to update an existing streaming placeholder (assistant) — match by id
    // first, fall back to "last assistant with empty content".
    if (role === 'assistant') {
      const messages = sess.messages;
      let targetIdx = -1;
      if (incomingId) {
        targetIdx = messages.findIndex((m) => m.id === incomingId && m.type === 'assistant');
      }
      if (targetIdx === -1) {
        for (let i = messages.length - 1; i >= 0; i--) {
          const m = messages[i];
          if (m.type !== 'assistant') continue;
          const hasText = extractText(m.content).trim().length > 0;
          if (!hasText) { targetIdx = i; break; }
          break;
        }
      }
      if (targetIdx !== -1) {
        const next = [...messages];
        const prev = next[targetIdx] as UIAssistantMessage;
        next[targetIdx] = {
          ...prev,
          content,
          thinkingContent: prev.thinkingContent ?? extractThinking(content),
          streamingContent: undefined,
        };
        const updated = { ...sess, messages: next };
        useChatStore.setState((s) => ({ sessions: putSession(s.sessions, updated) }));
        return;
      }
    }

    // No placeholder — push new (resume / replay path).
    const id = incomingId ?? `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let msg: UIMessage;
    if (role === 'user') {
      msg = { id, type: 'user', content, timestamp: ts };
    } else if (role === 'assistant') {
      msg = {
        id,
        type: 'assistant',
        content,
        timestamp: ts,
        thinkingContent: extractThinking(content),
      };
    } else {
      msg = { id, type: 'system', content, timestamp: ts };
    }
    const updated = { ...sess, messages: [...sess.messages, msg] };
    useChatStore.setState((s) => ({ sessions: putSession(s.sessions, updated) }));
  }));
}

// Comdr 指令 (任务 2): 模块级自调用 — 加载即重新绑定。在 main.tsx setupAllBridges
//   也会调一次（idempotent），HMR 重载本模块时此自调用确保新 listener 总绑到新 store。
if (typeof window !== 'undefined') {
  // 推迟到下个 microtask，避免 chatStore 自身初始化期间的循环依赖。
  queueMicrotask(() => {
    try { setupBridgeListeners(); } catch (err) { console.warn('[chatStore] auto setupBridgeListeners failed:', err); }
  });
}

// ---------------------------------------------------------------------------
// RAF-based flush loop for streaming buffers (~16ms cadence)
// ---------------------------------------------------------------------------

function startFlushLoop(): void {
  if (flushRAF != null) return;
  const tick = () => {
    const store = useChatStore.getState();
    for (const sid of activeSessions) {
      store.flushStreamBuffer(sid);
    }
    flushRAF = requestAnimationFrame(tick);
  };
  flushRAF = requestAnimationFrame(tick);
}

function stopFlushLoop(): void {
  if (flushRAF != null) {
    cancelAnimationFrame(flushRAF);
    flushRAF = null;
  }
}

// ---------------------------------------------------------------------------
// 遗留 IPC 修复 #2: chatStore.chatState → tabStore.tab.status 自动同步
// cc-haha 行为：会话 running 时 TabBar 该 tab 显示绿色脉冲点（V3 audit 漏接缺陷）。
// 实现：subscribe 监听每次 state 变更，diff sessions Map 找出 chatState 变化的 session，
// 映射到 tabStore tab.status 并调 updateTabStatus。
// ---------------------------------------------------------------------------

function chatStateToTabStatus(state: ChatState): 'idle' | 'running' | 'error' {
  if (state === 'streaming' || state === 'thinking' || state === 'tool_executing') {
    return 'running';
  }
  return 'idle';
}

const prevChatStates = new Map<string, ChatState>();

// 延迟到下个 microtask，避免 chatStore 自身初始化期间 subscribe（chicken-and-egg）
queueMicrotask(() => {
  // 动态 import 避免顶部循环依赖（chatStore <-> tabStore）
  import('./tabStore').then(({ useTabStore }) => {
    useChatStore.subscribe((state) => {
      const tabStore = useTabStore.getState();
      state.sessions.forEach((session, sessionId) => {
        const prev = prevChatStates.get(sessionId);
        if (prev !== session.chatState) {
          tabStore.updateTabStatus(sessionId, chatStateToTabStatus(session.chatState));
          prevChatStates.set(sessionId, session.chatState);
        }
      });
    });
  }).catch((err) => {
    console.warn('[chatStore] tabStore status sync subscribe failed:', err);
  });
});
