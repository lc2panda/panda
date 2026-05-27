// Input: PdMessageList messages props — UIUserMessage with attachments
// Output: PdUserBubble 收到 attachments prop（透传链路验证）
// Pos: test layer — Bug J 修复回归，PdMessageList → PdUserBubble attachments 透传

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// ─── Mock 外部依赖 ────────────────────────────────────────────────────────────

vi.mock('../../components/chat/PdUserBubble', () => ({
  PdUserBubble: (props: { content: string; attachments?: unknown[] }) =>
    React.createElement('div', {
      'data-testid': 'user-bubble',
      'data-attachment-count': String(props.attachments?.length ?? 0),
    }, props.content),
}));

vi.mock('../../components/chat/PdMessageBubble', () => ({
  PdMessageBubble: () => null,
}));

vi.mock('../../components/chat/PdToolCallCard', () => ({
  PdToolCallCard: () => null,
}));

vi.mock('../../components/chat/PdToolResultBlock', () => ({
  PdToolResultBlock: () => null,
}));

vi.mock('../../components/chat/PdThinkingBlock', () => ({
  PdThinkingBlock: () => null,
}));

vi.mock('../../components/chat/PdStreamingIndicator', () => ({
  PdStreamingIndicator: () => null,
}));

vi.mock('../../hooks/useVirtualList', () => ({
  useVirtualList: ({ items }: { items: unknown[] }) => ({
    containerRef: { current: null },
    items: items.map((item, index) => ({ item, index })),
    totalHeight: items.length * 60,
    setScrollTarget: vi.fn(),
    isAtBottom: true,
    scrollToBottom: vi.fn(),
  }),
}));

vi.mock('../../i18n', () => ({
  t: (k: string) => k,
}));

vi.mock('../../stores/chatStore', async () => {
  const actual = await vi.importActual<typeof import('../../stores/chatStore')>('../../stores/chatStore');
  return {
    ...actual,
    useChatStore: vi.fn(() => ({ rewindTo: vi.fn() })),
  };
});

import { PdMessageList } from '../../components/chat/PdMessageList';
import type { UIUserMessage } from '../../stores/chatStore';

const TS = 1748340000000;

describe('PdMessageList — attachments 透传 (Bug J)', () => {
  it('UIUserMessage.attachments 透传到 PdUserBubble prop', () => {
    const userMsg: UIUserMessage = {
      id: 'msg-u1',
      type: 'user',
      content: 'see image',
      timestamp: TS,
      attachments: [
        { type: 'image', name: 'photo.jpg', mediaType: 'image/jpeg', data: 'L3Rlc3Q=' },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(PdMessageList, {
        messages: [userMsg],
        isStreaming: false,
        streamingText: '',
        sessionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      }),
    );

    expect(html).toContain('data-testid="user-bubble"');
    expect(html).toContain('data-attachment-count="1"');
  });
});
