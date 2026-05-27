import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ActiveSession } from '../../pages/ActiveSession';
import type { PerSessionState } from '../../stores/chatStore';

/**
 * v2.27.2 Bug E 真补集成测试
 *
 * 验证 PdComposer.onSend → ActiveSession.handleSendMessage → chatStore.sendMessage
 * 路径下 attachments 第三参真透传，不再像 v2.27.1 那样被丢弃。
 */

const sessionUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

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

// composerProbe.attachmentsToSend 让测试控制 onSend 携带的 attachments
const composerProbe = vi.hoisted(() => ({
  submitOnRender: false,
  attachmentsToSend: undefined as Array<{ mediaType: string; data: string }> | undefined,
  textToSend: 'ping',
}));

vi.mock('../../stores/chatStore', () => ({
  useChatStore: Object.assign(
    (selector?: (state: any) => unknown) => (selector ? selector(storeProbe.chatState) : storeProbe.chatState),
    { getState: () => storeProbe.chatState },
  ),
}));

vi.mock('../../stores/sessionStore', () => ({
  useSessionStore: (selector?: (state: any) => unknown) =>
    selector ? selector(storeProbe.sessionState) : storeProbe.sessionState,
}));

vi.mock('../../stores/tabStore', () => ({
  useTabStore: (selector?: (state: any) => unknown) =>
    selector ? selector(storeProbe.tabState) : storeProbe.tabState,
}));

vi.mock('../../hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars?.n !== undefined) return `${key}:${vars.n}`;
      return key;
    },
  }),
}));

vi.mock('../../components/chat/PdMessageList', () => ({
  PdMessageList: ({ sessionId }: { sessionId: string }) => (
    <div data-testid="message-list" data-session-id={sessionId} />
  ),
}));

vi.mock('../../components/chat/PdSessionTaskBar', () => ({
  PdSessionTaskBar: () => <div data-testid="task-bar" />,
}));

vi.mock('../../components/teams/PdTeamStatusBar', () => ({
  PdTeamStatusBar: () => <div data-testid="team-status" />,
}));

vi.mock('../../components/chat/PdComputerUsePermissionModal', () => ({
  PdComputerUsePermissionModal: ({ sessionId }: { sessionId: string }) => (
    <div data-testid="permission" data-session-id={sessionId} />
  ),
}));

vi.mock('../../components/chat/PdComposer', () => ({
  PdComposer: ({ onSend }: { onSend?: (text: string, attachments?: Array<{ mediaType: string; data: string }>) => void }) => {
    if (composerProbe.submitOnRender && onSend) {
      onSend(composerProbe.textToSend, composerProbe.attachmentsToSend);
    }
    return <form data-testid="composer" />;
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
  composerProbe.attachmentsToSend = undefined;
  composerProbe.textToSend = 'ping';
  storeProbe.chatState.sessions = new Map();
  storeProbe.chatState.sendMessage = vi.fn();
  storeProbe.sessionState.sessions = [];
  storeProbe.tabState.tabs = [];
  storeProbe.tabState.activeTabId = null;
};

describe('Bug E 真补：PdComposer attachments 经 ActiveSession 透传到 chatStore', () => {
  beforeEach(() => {
    resetStores();
  });

  it('单张图片附件（image/png）应作为第三参传入 chatStore.sendMessage', () => {
    const pngAttachment = {
      mediaType: 'image/png',
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    };
    composerProbe.submitOnRender = true;
    composerProbe.textToSend = '看这张图';
    composerProbe.attachmentsToSend = [pngAttachment];

    renderToStaticMarkup(<ActiveSession activeId={sessionUuid} session={sessionState(sessionUuid)} />);

    expect(storeProbe.chatState.sendMessage).toHaveBeenCalledTimes(1);
    expect(storeProbe.chatState.sendMessage).toHaveBeenCalledWith(sessionUuid, '看这张图', [pngAttachment]);

    // 关键反证：attachments 不能被丢弃成 undefined
    const callArgs = storeProbe.chatState.sendMessage.mock.calls[0];
    expect(callArgs[2]).toBeDefined();
    expect(Array.isArray(callArgs[2])).toBe(true);
    expect(callArgs[2]).toHaveLength(1);
    expect(callArgs[2][0].mediaType).toBe('image/png');
    // base64 纯 payload，不含 data: URI 前缀
    expect(callArgs[2][0].data.startsWith('data:')).toBe(false);
  });

  it('多张图片附件 (PNG + JPEG) 全部透传，顺序保留', () => {
    const attachments = [
      { mediaType: 'image/png', data: 'AAA' },
      { mediaType: 'image/jpeg', data: 'BBB' },
    ];
    composerProbe.submitOnRender = true;
    composerProbe.textToSend = '两张图';
    composerProbe.attachmentsToSend = attachments;

    renderToStaticMarkup(<ActiveSession activeId={sessionUuid} session={sessionState(sessionUuid)} />);

    expect(storeProbe.chatState.sendMessage).toHaveBeenCalledWith(sessionUuid, '两张图', attachments);
    const callArgs = storeProbe.chatState.sendMessage.mock.calls[0];
    expect(callArgs[2]).toHaveLength(2);
    expect(callArgs[2][0].mediaType).toBe('image/png');
    expect(callArgs[2][1].mediaType).toBe('image/jpeg');
  });

  it('无附件时第三参为 undefined（不影响纯文本路径）', () => {
    composerProbe.submitOnRender = true;
    composerProbe.textToSend = '纯文本';
    composerProbe.attachmentsToSend = undefined;

    renderToStaticMarkup(<ActiveSession activeId={sessionUuid} session={sessionState(sessionUuid)} />);

    expect(storeProbe.chatState.sendMessage).toHaveBeenCalledWith(sessionUuid, '纯文本', undefined);
  });
});
