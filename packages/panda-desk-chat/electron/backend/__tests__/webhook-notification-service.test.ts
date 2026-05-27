// Input: sendWebhookNotification(channel, config, payload)
// Output: vitest 用例覆盖飞书/Telegram 各成功、失败、签名、超时场景
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — v2.27.1 webhook 单测

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendWebhookNotification } from '../webhook-notification-service';
import * as crypto from 'node:crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FetchMock = (...args: any[]) => Promise<any>;

// ---------------------------------------------------------------------------
// 飞书 — 无 secret
// ---------------------------------------------------------------------------

describe('sendWebhookNotification — feishu 无 secret', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('成功响应 → ok:true', async () => {
    (fetch as unknown as { mockResolvedValueOnce: FetchMock }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, msg: 'success' }),
    });

    const result = await sendWebhookNotification(
      'feishu',
      { webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test' },
      { title: '测试', body: '内容', level: 'info' },
    );

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();

    const [url, opts] = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toBe('https://open.feishu.cn/open-apis/bot/v2/hook/test');
    expect(opts.method).toBe('POST');

    const sentBody = JSON.parse(opts.body as string) as Record<string, unknown>;
    expect(sentBody.msg_type).toBe('text');
    expect(sentBody.sign).toBeUndefined();
    expect(sentBody.timestamp).toBeUndefined();
    expect((sentBody.content as Record<string, string>).text).toContain('测试');
    expect((sentBody.content as Record<string, string>).text).toContain('内容');
    expect((sentBody.content as Record<string, string>).text).toContain('ℹ️');
  });

  it('level=error → 🚨 emoji', async () => {
    (fetch as unknown as { mockResolvedValueOnce: FetchMock }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0 }),
    });

    await sendWebhookNotification(
      'feishu',
      { webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test' },
      { title: '严重错误', body: '系统崩溃', level: 'error' },
    );

    const [, opts] = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    const sentBody = JSON.parse(opts.body as string) as Record<string, unknown>;
    expect((sentBody.content as Record<string, string>).text).toContain('🚨');
  });

  it('HTTP 非 200 → ok:false + error 含状态码', async () => {
    (fetch as unknown as { mockResolvedValueOnce: FetchMock }).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'internal' }),
    });

    const result = await sendWebhookNotification(
      'feishu',
      { webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test' },
      { title: 'T', body: 'B' },
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('500');
  });

  it('code != 0 → ok:false + error 含 code', async () => {
    (fetch as unknown as { mockResolvedValueOnce: FetchMock }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 19001, msg: 'invalid hook' }),
    });

    const result = await sendWebhookNotification(
      'feishu',
      { webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test' },
      { title: 'T', body: 'B' },
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('19001');
  });
});

// ---------------------------------------------------------------------------
// 飞书 — 有 secret（签名验证）
// ---------------------------------------------------------------------------

describe('sendWebhookNotification — feishu 有 secret', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sign 字段符合 HMAC-SHA256 base64 算法', async () => {
    (fetch as unknown as { mockResolvedValueOnce: FetchMock }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0 }),
    });

    const secret = 'my-feishu-secret';
    await sendWebhookNotification(
      'feishu',
      { webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test', secret },
      { title: 'Sign Test', body: 'body', level: 'warn' },
    );

    const [, opts] = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    const sentBody = JSON.parse(opts.body as string) as {
      timestamp: string;
      sign: string;
      content: Record<string, string>;
    };

    expect(sentBody.timestamp).toBeTruthy();
    expect(sentBody.sign).toBeTruthy();

    // 独立重算签名验证
    const ts = Number(sentBody.timestamp);
    const signStr = `${ts}\n${secret}`;
    const expected = crypto.createHmac('sha256', secret).update(signStr).digest('base64');
    expect(sentBody.sign).toBe(expected);

    // 内容包含 ⚠️
    expect(sentBody.content.text).toContain('⚠️');
  });
});

// ---------------------------------------------------------------------------
// Telegram
// ---------------------------------------------------------------------------

describe('sendWebhookNotification — telegram', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('成功 → ok:true', async () => {
    (fetch as unknown as { mockResolvedValueOnce: FetchMock }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const result = await sendWebhookNotification(
      'telegram',
      { botToken: 'bot123:abc', chatId: '-100123456' },
      { title: 'Telegram Test', body: 'hello', level: 'info' },
    );

    expect(result.ok).toBe(true);

    // URL 包含 bot token 和 chat_id
    const [url] = (fetch as unknown as { mock: { calls: [string][] } }).mock.calls[0];
    expect(url).toContain('bot123:abc');
    expect(url).toContain(encodeURIComponent('-100123456'));
    // text 包含 emoji 前缀
    expect(url).toContain(encodeURIComponent('ℹ️'));
  });

  it('401 失败 → ok:false + error 含 description', async () => {
    (fetch as unknown as { mockResolvedValueOnce: FetchMock }).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ ok: false, description: 'Unauthorized' }),
    });

    const result = await sendWebhookNotification(
      'telegram',
      { botToken: 'badtoken', chatId: '123' },
      { title: 'T', body: 'B' },
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('fetch 抛错（超时 AbortError）→ ok:false + error 含中文', async () => {
    const abortErr = new DOMException('The operation was aborted', 'AbortError');
    (fetch as unknown as { mockRejectedValueOnce: FetchMock }).mockRejectedValueOnce(abortErr);

    const result = await sendWebhookNotification(
      'telegram',
      { botToken: 'bot:token', chatId: '999' },
      { title: 'T', body: 'B' },
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Telegram 请求失败');
  });
});
