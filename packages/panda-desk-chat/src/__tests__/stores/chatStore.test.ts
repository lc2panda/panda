// Input: chatStore actions (session lifecycle, messages, connection, permissions, tools, routing)
// Output: state assertions validating chat store logic
// Pos: test layer — validates chatStore per-session state management

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock bridge module to avoid IPC/dev-relay side effects
const bridgeMock = vi.hoisted(() => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
  stopGeneration: vi.fn().mockResolvedValue(undefined),
  pasteImage: vi.fn().mockResolvedValue(undefined),
  respondToPermission: vi.fn().mockResolvedValue(undefined),
  createSession: vi.fn().mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111' }),
  listAllSessions: vi.fn().mockResolvedValue([]),
  listSessions: vi.fn().mockResolvedValue([]),
  onSessionCreated: vi.fn(() => () => {}),
  onSessionRemoved: vi.fn(() => () => {}),
  onStreamStart: vi.fn(() => () => {}),
  onStreamDelta: vi.fn(() => () => {}),
  onStreamEnd: vi.fn(() => () => {}),
  onStreamError: vi.fn(() => () => {}),
  onToolUseStart: vi.fn(() => () => {}),
  onToolUseEnd: vi.fn(() => () => {}),
  onPermissionRequest: vi.fn(() => () => {}),
  onWindowToggle: vi.fn(() => () => {}),
}));

vi.mock('@/ipc/bridge', () => ({
  bridge: bridgeMock,
  ...bridgeMock,
}));

// Mock toastStore to avoid PdToast component dependency
vi.mock('@/stores/toastStore', () => ({
  useToastStore: {
    getState: () => ({ addToast: vi.fn() }),
  },
}));

import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTabStore } from '@/stores/tabStore';
import * as bridge from '@/ipc/bridge';
import type { PendingPermission, TokenUsage } from '@/stores/chatStore';

const SID = 'test-session-1';
const SID2 = 'test-session-2';
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store to pristine state
    useChatStore.setState({
      sessions: new Map(),
      activeSessionId: null,
      transcriptMode: 'normal',
    });
    useSessionStore.setState({
      sessions: [],
      activeSessionId: null,
    });
    useTabStore.setState({
      tabs: [],
      activeTabId: null,
    });
    vi.clearAllMocks();
  });

  // ── Session lifecycle ──────────────────────────────────────────────────

  describe('session lifecycle', () => {
    it('initSession creates an empty session', () => {
      useChatStore.getState().initSession(SID);

      const session = useChatStore.getState().sessions.get(SID);
      expect(session).toBeDefined();
      expect(session!.sessionId).toBe(SID);
      expect(session!.messages).toEqual([]);
      expect(session!.chatState).toBe('idle');
      expect(session!.connectionState).toBe('disconnected');
    });

    it('initSession is idempotent — does not overwrite existing session', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().addUserMessage(SID, 'hello');
      useChatStore.getState().initSession(SID); // second call

      const session = useChatStore.getState().sessions.get(SID);
      expect(session!.messages).toHaveLength(1);
    });

    it('removeSession deletes the session and clears activeSessionId if matched', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().setActiveSession(SID);
      expect(useChatStore.getState().activeSessionId).toBe(SID);

      useChatStore.getState().removeSession(SID);
      expect(useChatStore.getState().sessions.has(SID)).toBe(false);
      expect(useChatStore.getState().activeSessionId).toBeNull();
    });

    it('removeSession preserves activeSessionId when removing a different session', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().initSession(SID2);
      useChatStore.getState().setActiveSession(SID);

      useChatStore.getState().removeSession(SID2);
      expect(useChatStore.getState().activeSessionId).toBe(SID);
    });
  });

  // ── setActiveSession & getActiveSession ────────────────────────────────

  describe('active session', () => {
    it('setActiveSession updates activeSessionId', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().setActiveSession(SID);
      expect(useChatStore.getState().activeSessionId).toBe(SID);
    });

    it('getActiveSession returns the active session', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().setActiveSession(SID);

      const active = useChatStore.getState().getActiveSession();
      expect(active).not.toBeNull();
      expect(active!.sessionId).toBe(SID);
    });

    it('getActiveSession returns null when no session is active', () => {
      expect(useChatStore.getState().getActiveSession()).toBeNull();
    });
  });

  // ── Connection state ───────────────────────────────────────────────────

  describe('setConnectionState', () => {
    it('updates the connection state for the given session', () => {
      useChatStore.getState().initSession(SID);

      useChatStore.getState().setConnectionState(SID, 'connecting');
      expect(useChatStore.getState().sessions.get(SID)!.connectionState).toBe('connecting');

      useChatStore.getState().setConnectionState(SID, 'connected');
      expect(useChatStore.getState().sessions.get(SID)!.connectionState).toBe('connected');

      useChatStore.getState().setConnectionState(SID, 'error');
      expect(useChatStore.getState().sessions.get(SID)!.connectionState).toBe('error');
    });

    it('is a no-op for an unknown session', () => {
      useChatStore.getState().setConnectionState('ghost', 'connected');
      expect(useChatStore.getState().sessions.has('ghost')).toBe(false);
    });
  });

  // ── Message actions ────────────────────────────────────────────────────

  describe('message actions', () => {
    it('addUserMessage appends a user message and sets chatState to thinking', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().addUserMessage(SID, 'Hi there');

      const session = useChatStore.getState().sessions.get(SID)!;
      expect(session.messages).toHaveLength(1);
      const m = session.messages[0];
      expect(m.type).toBe('user');
      expect(m.content).toBe('Hi there');
      expect(session.chatState).toBe('thinking');
    });

    it('startStreaming creates an empty assistant message and sets chatState to streaming', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().startStreaming(SID, 'msg-1');

      const session = useChatStore.getState().sessions.get(SID)!;
      expect(session.messages).toHaveLength(1);
      const m = session.messages[0];
      expect(m.type).toBe('assistant');
      expect(m.id).toBe('msg-1');
      expect(m.type === 'assistant' && m.content === '').toBe(true);
      expect(session.chatState).toBe('streaming');
    });

    it('endStreaming finalizes the assistant message and resets chatState to idle', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().startStreaming(SID, 'msg-1');

      const usage: TokenUsage = { input: 100, output: 50, cacheRead: 10 };
      useChatStore.getState().endStreaming(SID, 'msg-1', 'end_turn', usage);

      const session = useChatStore.getState().sessions.get(SID)!;
      expect(session.chatState).toBe('idle');
      const m = session.messages[0];
      expect(m.type).toBe('assistant');
      if (m.type === 'assistant') {
        expect(m.finishReason).toBe('end_turn');
        expect(m.tokenUsage).toEqual(usage);
      }
      // Cumulative token usage
      expect(session.tokenUsage.input).toBe(100);
      expect(session.tokenUsage.output).toBe(50);
      expect(session.tokenUsage.cacheRead).toBe(10);
    });

    it('endStreaming accumulates token usage across multiple messages', () => {
      useChatStore.getState().initSession(SID);

      // First message
      useChatStore.getState().startStreaming(SID, 'msg-1');
      useChatStore.getState().endStreaming(SID, 'msg-1', 'end_turn', {
        input: 100,
        output: 50,
      });

      // Second message
      useChatStore.getState().startStreaming(SID, 'msg-2');
      useChatStore.getState().endStreaming(SID, 'msg-2', 'end_turn', {
        input: 200,
        output: 80,
        cacheRead: 5,
      });

      const session = useChatStore.getState().sessions.get(SID)!;
      expect(session.tokenUsage.input).toBe(300);
      expect(session.tokenUsage.output).toBe(130);
      expect(session.tokenUsage.cacheRead).toBe(5);
    });
  });

  // ── Tool actions ───────────────────────────────────────────────────────

  describe('tool actions', () => {
    it('startToolUse pushes a standalone tool_use MessageEntry (cc-haha shape)', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().startStreaming(SID, 'msg-1');

      useChatStore.getState().startToolUse(SID, 'tool-1', 'BashTool', { cmd: 'ls' });

      const session = useChatStore.getState().sessions.get(SID)!;
      expect(session.chatState).toBe('tool_executing');
      expect(session.activeToolUseId).toBe('tool-1');
      expect(session.activeToolName).toBe('BashTool');

      // [0] = assistant placeholder, [1] = tool_use entry
      expect(session.messages).toHaveLength(2);
      const toolMsg = session.messages[1];
      expect(toolMsg.type).toBe('tool_use');
      if (toolMsg.type === 'tool_use') {
        expect(toolMsg.toolUseId).toBe('tool-1');
        expect(toolMsg.toolName).toBe('BashTool');
        expect(toolMsg.status).toBe('running');
      }
    });

    it('endToolUse appends a standalone tool_result MessageEntry and updates tool_use status', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().startStreaming(SID, 'msg-1');
      useChatStore.getState().startToolUse(SID, 'tool-1', 'BashTool', { cmd: 'ls' });

      useChatStore.getState().endToolUse(SID, 'tool-1', 'file1.txt\nfile2.txt', false);

      const session = useChatStore.getState().sessions.get(SID)!;
      expect(session.chatState).toBe('streaming');
      expect(session.activeToolUseId).toBeNull();
      expect(session.activeToolName).toBeNull();

      // [0]=assistant, [1]=tool_use, [2]=tool_result
      expect(session.messages).toHaveLength(3);
      const toolMsg = session.messages[1];
      const resultMsg = session.messages[2];
      expect(toolMsg.type).toBe('tool_use');
      expect(resultMsg.type).toBe('tool_result');
      if (toolMsg.type === 'tool_use') {
        expect(toolMsg.status).toBe('success');
      }
      if (resultMsg.type === 'tool_result') {
        expect(resultMsg.toolUseId).toBe('tool-1');
        expect(resultMsg.content).toBe('file1.txt\nfile2.txt');
        expect(resultMsg.isError).toBe(false);
      }
    });

    it('endToolUse marks errored tool_result correctly and tool_use becomes error', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().startStreaming(SID, 'msg-1');
      useChatStore.getState().startToolUse(SID, 'tool-1', 'BashTool', { cmd: 'bad' });

      useChatStore.getState().endToolUse(SID, 'tool-1', 'command not found', true);

      const session = useChatStore.getState().sessions.get(SID)!;
      const toolMsg = session.messages[1];
      const resultMsg = session.messages[2];
      if (toolMsg.type === 'tool_use') expect(toolMsg.status).toBe('error');
      if (resultMsg.type === 'tool_result') {
        expect(resultMsg.isError).toBe(true);
        expect(resultMsg.content).toBe('command not found');
      }
    });
  });

  // ── Permission actions ─────────────────────────────────────────────────

  describe('permission actions', () => {
    it('requestPermission sets pending permission and chatState', () => {
      useChatStore.getState().initSession(SID);

      const perm: PendingPermission = {
        toolUseId: 'tool-1',
        toolName: 'FileEditTool',
        input: { path: '/tmp/test' },
        tier: 'write',
      };
      useChatStore.getState().requestPermission(SID, perm);

      const session = useChatStore.getState().sessions.get(SID)!;
      expect(session.chatState).toBe('permission_pending');
      expect(session.pendingPermission).toEqual(perm);
    });

    it('resolvePermission clears pending permission and returns to streaming', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().requestPermission(SID, {
        toolUseId: 'tool-1',
        toolName: 'BashTool',
        input: {},
        tier: 'exec',
      });

      useChatStore.getState().resolvePermission(SID);

      const session = useChatStore.getState().sessions.get(SID)!;
      expect(session.chatState).toBe('streaming');
      expect(session.pendingPermission).toBeNull();
    });
  });

  // ── Timer / status ─────────────────────────────────────────────────────

  describe('timer and status', () => {
    it('setElapsed updates elapsed seconds', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().setElapsed(SID, 42);
      expect(useChatStore.getState().sessions.get(SID)!.elapsedSeconds).toBe(42);
    });

    it('setStatusVerb updates status verb', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().setStatusVerb(SID, 'Compiling...');
      expect(useChatStore.getState().sessions.get(SID)!.statusVerb).toBe('Compiling...');
    });
  });

  // ── Routing ────────────────────────────────────────────────────────────

  describe('routing', () => {
    it('setRoutingInfo stores routing info', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().setRoutingInfo(SID, {
        toModel: 'claude-sonnet',
        reason: 'complexity',
      });

      const ri = useChatStore.getState().sessions.get(SID)!.routingInfo;
      expect(ri).toEqual({ toModel: 'claude-sonnet', reason: 'complexity' });
    });

    it('dismissRouting clears routing info', () => {
      useChatStore.getState().initSession(SID);
      useChatStore.getState().setRoutingInfo(SID, { toModel: 'opus' });
      useChatStore.getState().dismissRouting(SID);

      expect(useChatStore.getState().sessions.get(SID)!.routingInfo).toBeNull();
    });
  });

  // ── Transcript mode ────────────────────────────────────────────────────

  describe('transcript mode', () => {
    it('setTranscriptMode changes the mode directly', () => {
      useChatStore.getState().setTranscriptMode('verbose');
      expect(useChatStore.getState().transcriptMode).toBe('verbose');
    });

    it('cycleTranscriptMode cycles normal -> verbose -> summary -> normal', () => {
      expect(useChatStore.getState().transcriptMode).toBe('normal');

      useChatStore.getState().cycleTranscriptMode();
      expect(useChatStore.getState().transcriptMode).toBe('verbose');

      useChatStore.getState().cycleTranscriptMode();
      expect(useChatStore.getState().transcriptMode).toBe('summary');

      useChatStore.getState().cycleTranscriptMode();
      expect(useChatStore.getState().transcriptMode).toBe('normal');
    });
  });

  // ── sendMessage session id routing ────────────────────────────────────────

  describe('sendMessage session id routing', () => {
    const historyUuid = '7398afd6-82a3-4653-81a2-349f8d6ec4fe';
    const newUuid = '11111111-1111-4111-8111-111111111111';

    it('remaps non-UUID history id before sending to bridge', async () => {
      useTabStore.setState({
        tabs: [{ id: 'legacy-history-id', sessionId: 'legacy-history-id', title: 'Legacy', type: 'session', status: 'idle', order: 0, isActive: true, isPinned: false }],
        activeTabId: 'legacy-history-id',
      });

      await useChatStore.getState().sendMessage('legacy-history-id', 'ping');
      await flushPromises();

      expect(bridge.createSession).toHaveBeenCalledTimes(1);
      expect(bridge.sendMessage).toHaveBeenCalledWith(newUuid, 'ping');
      expect(bridge.sendMessage).not.toHaveBeenCalledWith('legacy-history-id', 'ping');
      expect(useTabStore.getState().tabs[0]?.sessionId).toBe(newUuid);
      expect(useTabStore.getState().activeTabId).toBe(newUuid);
    });

    it('sends valid history UUID directly without creating or replacing session', async () => {
      useTabStore.setState({
        tabs: [{ id: historyUuid, sessionId: historyUuid, title: 'History', type: 'session', status: 'idle', order: 0, isActive: true, isPinned: false }],
        activeTabId: historyUuid,
      });

      await useChatStore.getState().sendMessage(historyUuid, 'ping');

      expect(bridge.createSession).not.toHaveBeenCalled();
      expect(bridge.sendMessage).toHaveBeenCalledWith(historyUuid, 'ping');
      expect(useTabStore.getState().tabs[0]?.sessionId).toBe(historyUuid);
      expect(useTabStore.getState().activeTabId).toBe(historyUuid);
    });
  });

});
