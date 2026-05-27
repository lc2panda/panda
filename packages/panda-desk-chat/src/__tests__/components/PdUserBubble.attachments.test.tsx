// Input: PdUserBubble props — content / timestamp / attachments?
// Output: 有 attachments 时渲染 PdAttachmentGallery，无 attachments 时不渲染
// Pos: test layer — Bug J 修复回归，用户气泡图片缩略图渲染链路

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Mock PdAttachmentGallery — 只需验证是否被渲染，不测内部实现
vi.mock('../../components/chat/PdAttachmentGallery', () => ({
  PdAttachmentGallery: ({ attachments }: { attachments: Array<{ data?: string; name: string }> }) =>
    React.createElement('div', { 'data-testid': 'attachment-gallery', 'data-count': String(attachments.length) }, null),
}));

// Mock PdImageGalleryModal（PdAttachmentGallery 内部依赖）
vi.mock('../../components/chat/PdImageGalleryModal', () => ({
  PdImageGalleryModal: () => null,
}));

// Mock PdMessageActionBar — 防止 i18n 副作用
vi.mock('../../components/chat/PdMessageActionBar', () => ({
  PdMessageActionBar: () => null,
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  t: (k: string) => k,
}));

import { PdUserBubble } from '../../components/chat/PdUserBubble';
import type { UIAttachment } from '../../stores/chatStore';

const TS = 1748340000000;

describe('PdUserBubble — attachments (Bug J)', () => {
  // ── 用例 1: 有 attachments 时渲染 PdAttachmentGallery ───────────────────
  it('有 attachments 时渲染 PdAttachmentGallery，并以 dataURL 喂 data 字段', () => {
    const attachments: UIAttachment[] = [
      { type: 'image', name: 'cat.png', mediaType: 'image/png', data: 'aGVsbG8=' },
    ];

    const html = renderToStaticMarkup(
      React.createElement(PdUserBubble, {
        content: 'check this out',
        timestamp: TS,
        attachments,
      }),
    );

    // PdAttachmentGallery mock 渲染 data-testid="attachment-gallery"
    expect(html).toContain('data-testid="attachment-gallery"');
    // data-count 应为 1
    expect(html).toContain('data-count="1"');
  });

  // ── 用例 2: 无 attachments 时不渲染 gallery ─────────────────────────────
  it('无 attachments prop 时不渲染 PdAttachmentGallery', () => {
    const html = renderToStaticMarkup(
      React.createElement(PdUserBubble, {
        content: 'just text',
        timestamp: TS,
      }),
    );

    expect(html).not.toContain('attachment-gallery');
  });

  // ── 用例 3: 空 attachments 数组时不渲染 gallery ──────────────────────────
  it('空 attachments 数组时不渲染 PdAttachmentGallery', () => {
    const html = renderToStaticMarkup(
      React.createElement(PdUserBubble, {
        content: 'empty array',
        timestamp: TS,
        attachments: [],
      }),
    );

    expect(html).not.toContain('attachment-gallery');
  });
});
