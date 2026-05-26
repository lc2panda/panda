import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatPage } from '../../pages/ChatPage';
import { ActiveSession } from '../../pages/ActiveSession';
import type { PerSessionState } from '../../stores/chatStore';

const historyUuid = '7398afd6-82a3-4653-81a2-349f8d6ec4fe';

const storeProbe = vi.hoisted(() => {
  const chatState: any = {
    sessions: new Map(),
    sendMessage: vi.fn(),
  };
  const sessionState: any = {
    sessions: [],
  };
  const tabState: any = {
    tabs: [],
    activeTabId: null,
  };
  return { chatState, sessionState, tabState };
});

const composerProbe = vi.hoisted(() => ({
  submitOnRender: false,
  calls: [] as Array<{ sessionId: string; hasOnSend: boolean; variant?: string }>,
}));

vi.mock('../../stores/chatStore', () => ({
  useChatStore: Object.assign(
    (selector?: (state: any) => unknown) => selector ? selector(storeProbe.chatState) : storeProbe.chatState,
    { getState: () => storeProbe.chatState },
  ),
}));

vi.mock('../../stores/sessionStore', () => ({
  useSessionStore: (selector?: (state: any) => unknown) => selector ? selector(storeProbe.sessionState) : storeProbe.sessionState,
}));

vi.mock('../../stores/tabStore', () => ({
  useTabStore: (selector?: (state: any) => unknown) => selector ? selector(storeProbe.tabState) : storeProbe.tabState,
}));

vi.mock('../../hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars?.n !== undefined) return `${key}:${vars.n}`;
      if (vars?.time !== undefined) return `${key}:${vars.time}`;
      if (vars?.count !== undefined) return `${key}:${vars.count}`;
      return key;
    },
  }),
}));

vi.mock('../../components/chat/PdMessageList', () => ({
  PdMessageList: ({ sessionId }: { sessionId: string }) => <div data-testid="message-list" data-session-id={sessionId} />,
}));

vi.mock('../../components/chat/PdSessionTaskBar', () => ({
  PdSessionTaskBar: () => <div data-testid="task-bar" />,
}));

vi.mock('../../components/teams/PdTeamStatusBar', () => ({
  PdTeamStatusBar: () => <div data-testid="team-status" />,
}));

vi.mock('../../components/chat/PdComputerUsePermissionModal', () => ({
  PdComputerUsePermissionModal: ({ sessionId }: { sessionId: string }) => <div data-testid="permission" data-session-id={sessionId} />,
}));

vi.mock('../../components/chat/PdComposer', () => ({
  PdComposer: ({ sessionId, onSend, variant }: { sessionId: string; onSend?: (text: string) => void; variant?: string }) => {
    composerProbe.calls.push({ sessionId, hasOnSend: typeof onSend === 'function', variant });
    if (composerProbe.submitOnRender && onSend) onSend('ping');
    return <form data-testid="composer" data-session-id={sessionId} data-has-on-send={String(typeof onSend === 'function')} />;
  },
}));

const sessionState = (sessionId: string): PerSessionState => ({
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
});

const resetStores = () => {
  composerProbe.submitOnRender = false;
  composerProbe.calls = [];
  storeProbe.chatState.sessions = new Map();
  storeProbe.chatState.sendMessage = vi.fn();
  storeProbe.sessionState.sessions = [];
  storeProbe.tabState.tabs = [];
  storeProbe.tabState.activeTabId = null;
};

describe('Desk Chat 页面发送路径', () => {
  beforeEach(() => {
    resetStores();
  });

  it('ChatPage 在历史 UUID 暂无 chat session 时仍渲染 ActiveSession 并保留发送 UUID', () => {
    storeProbe.tabState.tabs = [{ id: historyUuid, sessionId: historyUuid, title: '历史会话', status: 'idle', type: 'session' }];
    storeProbe.tabState.activeTabId = historyUuid;
    storeProbe.sessionState.sessions = [{
      id: historyUuid,
      name: '历史会话',
      cwd: '/Users/panda/Downloads/cc-panda',
      createdAt: '2026-05-26T04:46:20.000Z',
      lastActive: '2026-05-26T04:46:20.000Z',
      messageCount: 1,
    }];

    const html = renderToStaticMarkup(<ChatPage />);

    expect(html).toContain(`data-session-id="${historyUuid}"`);
    expect(html).toContain('data-has-on-send="true"');
    expect(composerProbe.calls).toContainEqual(expect.objectContaining({
      sessionId: historyUuid,
      hasOnSend: true,
      variant: 'hero',
    }));
    expect(html).not.toContain('activeId=null');
  });

  it('ActiveSession 通过显式 onSend 调用 chatStore.sendMessage(historyUuid, ping)', () => {
    storeProbe.sessionState.sessions = [{
      id: historyUuid,
      name: '历史会话',
      cwd: '/Users/panda/Downloads/cc-panda',
      createdAt: '2026-05-26T04:46:20.000Z',
      lastActive: '2026-05-26T04:46:20.000Z',
      messageCount: 1,
    }];
    composerProbe.submitOnRender = true;

    renderToStaticMarkup(<ActiveSession activeId={historyUuid} session={sessionState(historyUuid)} />);

    expect(storeProbe.chatState.sendMessage).toHaveBeenCalledTimes(1);
    expect(storeProbe.chatState.sendMessage).toHaveBeenCalledWith(historyUuid, 'ping');
    expect(storeProbe.chatState.sendMessage).not.toHaveBeenCalledWith(null, 'ping');
  });
});
