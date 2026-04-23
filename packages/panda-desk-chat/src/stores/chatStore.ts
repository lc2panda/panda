// Input: Chat events from IPC bridge (streaming deltas, tool calls, permissions)
// Output: Per-session chat state (messages, streaming buffers, tool status, permissions)
// Pos: Core state layer — drives message list, composer, permission dialogs, status bar

import { create } from 'zustand';
import * as bridge from '../ipc/bridge';
import { useToastStore } from './toastStore';
import { useBuddyStore } from './buddyStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export interface UIToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  status: 'pending' | 'running' | 'success' | 'error';
}

export type MessageFeedback = 'positive' | 'negative' | null;

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  // assistant extensions
  thinkingContent?: string;
  toolCalls?: UIToolCall[];
  tokenUsage?: TokenUsage;
  finishReason?: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  feedback?: MessageFeedback;
}

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

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  // -- Message actions -------------------------------------------------------

  addUserMessage: (sessionId, content) =>
    set((state) => {
      const session = getSession(state.sessions, sessionId);
      if (!session) return state;
      const msg: UIMessage = {
        id: crypto.randomUUID(),
        role: 'user',
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
      // Create a placeholder assistant message
      const msg: UIMessage = {
        id: messageId,
        role: 'assistant',
        content: '',
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

      // Apply deltas to the last assistant message
      const messages = [...session.messages];
      const lastIdx = messages.length - 1;
      if (lastIdx < 0 || messages[lastIdx].role !== 'assistant') return state;

      const lastMsg = { ...messages[lastIdx] };
      if (textDelta) lastMsg.content += textDelta;
      if (thinkingDelta)
        lastMsg.thinkingContent = (lastMsg.thinkingContent ?? '') + thinkingDelta;
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
        if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
          const m = { ...messages[lastIdx] };
          if (buf.text) m.content += buf.text;
          if (buf.thinking)
            m.thinkingContent = (m.thinkingContent ?? '') + buf.thinking;
          messages[lastIdx] = m;
        }
        buf.text = '';
        buf.thinking = '';
        buf.toolInput = '';
      }

      const updated = updateMessage(messages, messageId, (msg) => ({
        ...msg,
        finishReason: finishReason as UIMessage['finishReason'],
        tokenUsage,
      }));

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

      // Append tool call to the last assistant message
      const messages = [...session.messages];
      const lastIdx = messages.length - 1;
      if (lastIdx < 0 || messages[lastIdx].role !== 'assistant') return state;

      const lastMsg = { ...messages[lastIdx] };
      const toolCall: UIToolCall = {
        id: toolUseId,
        toolName,
        input,
        status: 'running',
      };
      lastMsg.toolCalls = [...(lastMsg.toolCalls ?? []), toolCall];
      messages[lastIdx] = lastMsg;

      return {
        sessions: putSession(state.sessions, {
          ...session,
          messages,
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

      const messages = [...session.messages];
      const lastIdx = messages.length - 1;
      if (lastIdx < 0 || messages[lastIdx].role !== 'assistant') return state;

      const lastMsg = { ...messages[lastIdx] };
      if (lastMsg.toolCalls) {
        lastMsg.toolCalls = lastMsg.toolCalls.map((tc) =>
          tc.id === toolUseId
            ? { ...tc, result, isError, status: isError ? 'error' : 'success' as const }
            : tc,
        );
      }
      messages[lastIdx] = lastMsg;

      return {
        sessions: putSession(state.sessions, {
          ...session,
          messages,
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
    bridge.sendMessage(sessionId, content).catch((err) => {
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

    // Find the last user message content
    const { messages } = session;
    let lastUserContent: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserContent = messages[i].content;
        break;
      }
    }
    if (!lastUserContent) return;

    // Remove the last assistant message (if it is the final message)
    const trimmed =
      messages.length > 0 && messages[messages.length - 1].role === 'assistant'
        ? messages.slice(0, -1)
        : [...messages];

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
}));

// ---------------------------------------------------------------------------
// Bridge event wiring — connects IPC events to store actions
// ---------------------------------------------------------------------------

let bridgeListenersInitialized = false;
let flushRAF: ReturnType<typeof requestAnimationFrame> | null = null;
const activeSessions = new Set<string>();

/**
 * Setup IPC bridge listeners. Call once at app initialization.
 * In dev mode this hooks into DevMockRelay events; in production it hooks into
 * the Electron preload bridge.
 */
export function setupBridgeListeners(): void {
  if (bridgeListenersInitialized) return;
  bridgeListenersInitialized = true;

  const store = useChatStore.getState;

  // stream:start → create assistant message placeholder
  bridge.onStreamStart((payload) => {
    const { sessionId, messageId } = payload as { sessionId: string; messageId: string };
    store().startStreaming(sessionId, messageId);
    activeSessions.add(sessionId);
    startFlushLoop();
    // Buddy: record user message + award XP
    useBuddyStore.getState().recordMessage();
    useBuddyStore.getState().addXP(5, 'message');
  });

  // stream:delta → buffer deltas
  bridge.onStreamDelta((payload) => {
    const { sessionId, messageId, delta, type } = payload as {
      sessionId: string;
      messageId: string;
      delta: string;
      type: 'text' | 'thinking' | 'tool_input';
    };
    store().appendStreamDelta(sessionId, messageId, delta, type);
  });

  // stream:end → finalize message
  bridge.onStreamEnd((payload) => {
    const { sessionId, messageId, finishReason, tokenUsage } = payload as {
      sessionId: string;
      messageId: string;
      finishReason: string;
      tokenUsage?: TokenUsage;
    };
    store().endStreaming(sessionId, messageId, finishReason, tokenUsage);
    activeSessions.delete(sessionId);
    if (activeSessions.size === 0) stopFlushLoop();
  });

  // tool:start
  bridge.onToolUseStart((payload) => {
    const { sessionId, toolUseId, toolName, input } = payload as {
      sessionId: string;
      toolUseId: string;
      toolName: string;
      input: Record<string, unknown>;
    };
    store().startToolUse(sessionId, toolUseId, toolName, input);
    // Buddy: record tool use + award XP
    useBuddyStore.getState().recordToolUse(toolName);
    useBuddyStore.getState().addXP(3, 'tool_use');
  });
  bridge.onToolUseEnd((payload) => {
    const { sessionId, toolUseId, result, isError } = payload as {
      sessionId: string;
      toolUseId: string;
      result: string;
      isError: boolean;
    };
    store().endToolUse(sessionId, toolUseId, result, isError);
  });

  // permission:request
  bridge.onPermissionRequest((payload) => {
    const { sessionId, toolUseId, toolName, input, tier } = payload as {
      sessionId: string;
      toolUseId: string;
      toolName: string;
      input: Record<string, unknown>;
      tier: 'read' | 'write' | 'exec';
    };
    store().requestPermission(sessionId, { toolUseId, toolName, input, tier });
  });

  // window:toggle → dispatch custom DOM event for UI components
  bridge.onWindowToggle(() => {
    window.dispatchEvent(new CustomEvent('pd-window-toggle'));
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
