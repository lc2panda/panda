// Input: chatStore attachments path — addUserMessage、sendMessage、loadSessionHistory（image blocks）
// Output: UIUserMessage.attachments 字段正确写入 / 解析
// Pos: test layer — Bug J 修复回归，UI 气泡图片展示链路

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock bridge module
const bridgeMock = vi.hoisted(() => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
  stopGeneration: vi.fn().mockResolvedValue(undefined),
  pasteImage: vi.fn().mockResolvedValue(undefined),
  respondToPermission: vi.fn().mockResolvedValue(undefined),
  createSession: vi.fn().mockResolvedValue({ id: '22222222-2222-4222-8222-222222222222' }),
  listAllSessions: vi.fn().mockResolvedValue([]),
  listSessions: vi.fn().mockResolvedValue([]),
  getSessionHistory: vi.fn().mockResolvedValue(null),
  focusSession: vi.fn().mockResolvedValue(undefined),
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
  onMessageHistory: vi.fn(() => () => {}),
}));

vi.mock('@/ipc/bridge', () => ({
  bridge: bridgeMock,
  ...bridgeMock,
}));

vi.mock('@/stores/toastStore', () => ({
  useToastStore: {
    getState: () => ({ addToast: vi.fn() }),
  },
}));

import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTabStore } from '@/stores/tabStore';
import type { UIUserMessage, UIAttachment } from '@/stores/chatStore';

const SID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('chatStore — attachments (Bug J)', () => {
  beforeEach(() => {
    useChatStore.setState({
      sessions: new Map(),
      activeSessionId: null,
      transcriptMode: 'normal',
    });
    useSessionStore.setState({ sessions: [], activeSessionId: null });
    useTabStore.setState({ tabs: [], activeTabId: null });
    vi.clearAllMocks();
  });

  // ── 用例 1: addUserMessage 写入 attachments ──────────────────────────────
  it('addUserMessage 写入 attachments 到 UIUserMessage', () => {
    useChatStore.getState().initSession(SID);

    const attachments: UIAttachment[] = [
      { type: 'image', name: 'photo.png', mediaType: 'image/png', data: 'aGVsbG8=' },
    ];
    useChatStore.getState().addUserMessage(SID, 'look at this', attachments);

    const session = useChatStore.getState().sessions.get(SID)!;
    expect(session.messages).toHaveLength(1);

    const msg = session.messages[0] as UIUserMessage;
    expect(msg.type).toBe('user');
    expect(msg.content).toBe('look at this');
    expect(msg.attachments).toBeDefined();
    expect(msg.attachments).toHaveLength(1);
    expect(msg.attachments![0].mediaType).toBe('image/png');
    expect(msg.attachments![0].data).toBe('aGVsbG8=');
    expect(msg.attachments![0].name).toBe('photo.png');
  });

  // ── 用例 2: addUserMessage 无 attachments 时不挂空数组 ───────────────────
  it('addUserMessage 无 attachments 参数时不写入 attachments 字段', () => {
    useChatStore.getState().initSession(SID);
    useChatStore.getState().addUserMessage(SID, 'just text');

    const msg = useChatStore.getState().sessions.get(SID)!.messages[0] as UIUserMessage;
    expect(msg.attachments).toBeUndefined();
  });

  // ── 用例 3: sendMessage normalize 链路 ──────────────────────────────────
  it('sendMessage normalize 将 {mediaType,data} 转为 UIAttachment[] 写进气泡', async () => {
    useChatStore.getState().initSession(SID);

    const rawAttachments = [
      { mediaType: 'image/jpeg', data: 'L3Rlc3Q=' },
      { mediaType: 'image/png',  data: 'cGluZw==' },
    ];

    useChatStore.getState().sendMessage(SID, 'two images', rawAttachments);
    await flushPromises();

    const session = useChatStore.getState().sessions.get(SID)!;
    const msg = session.messages[0] as UIUserMessage;

    expect(msg.attachments).toHaveLength(2);
    expect(msg.attachments![0].type).toBe('image');
    expect(msg.attachments![0].mediaType).toBe('image/jpeg');
    expect(msg.attachments![0].data).toBe('L3Rlc3Q=');
    expect(msg.attachments![1].mediaType).toBe('image/png');

    // bridge.sendMessage も呼ばれていることを確認
    expect(bridgeMock.sendMessage).toHaveBeenCalledWith(SID, 'two images', rawAttachments);
  });

  // ── 用例 4: messageEntryToUIMessage 解析单 image block ───────────────────
  it('loadSessionHistory 解析含单 image block 的 user entry → UIAttachment', async () => {
    bridgeMock.getSessionHistory.mockResolvedValueOnce({
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          type: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: 'aW1hZ2VkYXRh',
              },
            },
          ],
          timestamp: '2026-05-27T10:00:00.000Z',
        },
      ],
    });

    useChatStore.getState().initSession(SID);
    await useChatStore.getState().loadSessionHistory(SID);
    await flushPromises();

    const session = useChatStore.getState().sessions.get(SID)!;
    expect(session.messages).toHaveLength(1);

    const msg = session.messages[0] as UIUserMessage;
    expect(msg.type).toBe('user');
    expect(msg.attachments).toHaveLength(1);
    expect(msg.attachments![0].type).toBe('image');
    expect(msg.attachments![0].mediaType).toBe('image/png');
    expect(msg.attachments![0].data).toBe('aW1hZ2VkYXRh');
  });

  // ── 用例 5: messageEntryToUIMessage 解析 text+image 混合（多附件顺序）────
  it('loadSessionHistory 解析 text+image 混合 entry，text 保留，attachments 顺序正确', async () => {
    bridgeMock.getSessionHistory.mockResolvedValueOnce({
      messages: [
        {
          id: 'msg-2',
          role: 'user',
          type: 'user',
          content: [
            { type: 'text', text: 'here are two images' },
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: 'Zmlyc3Q=' },
            },
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: 'c2Vjb25k' },
            },
          ],
          timestamp: '2026-05-27T11:00:00.000Z',
        },
      ],
    });

    useChatStore.getState().initSession(SID);
    await useChatStore.getState().loadSessionHistory(SID);
    await flushPromises();

    const msg = useChatStore.getState().sessions.get(SID)!.messages[0] as UIUserMessage;
    expect(msg.content).toBe('here are two images');
    expect(msg.attachments).toHaveLength(2);
    expect(msg.attachments![0].mediaType).toBe('image/jpeg');
    expect(msg.attachments![0].data).toBe('Zmlyc3Q=');
    expect(msg.attachments![1].mediaType).toBe('image/png');
    expect(msg.attachments![1].data).toBe('c2Vjb25k');
  });
});
