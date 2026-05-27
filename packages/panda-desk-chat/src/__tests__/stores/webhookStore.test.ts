// Input: useWebhookStore actions (setFeishuConfig, setTelegramConfig, sendNotification, clearError)
// Output: state assertions + localStorage 持久化 + bridge.sendWebhookNotification mock 验证
// Pos: test layer — v2.27.1 webhookStore 单测

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock bridge（sendWebhookNotification 重载版本）
// ---------------------------------------------------------------------------

vi.mock('@/ipc/bridge', () => ({
  isDevMode: () => false,
  sendWebhookNotification: vi.fn().mockResolvedValue({ ok: true }),
}));

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:    (key: string) => store[key] ?? null,
    setItem:    (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear:      () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key:        (i: number) => Object.keys(store)[i] ?? null,
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// ---------------------------------------------------------------------------
// Import store AFTER mocks
// ---------------------------------------------------------------------------

import { useWebhookStore } from '@/stores/webhookStore';
import * as bridge from '@/ipc/bridge';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWebhookStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useWebhookStore.setState({
      feishuConfig:   null,
      telegramConfig: null,
      isSending:      false,
      lastError:      null,
    });
    vi.mocked(bridge.sendWebhookNotification).mockClear();
    vi.mocked(bridge.sendWebhookNotification).mockResolvedValue({ ok: true });
  });

  // ── setFeishuConfig ──────────────────────────────────────────────────────

  it('setFeishuConfig → 更新 state 并持久化 localStorage', () => {
    const config = { webhookUrl: 'https://open.feishu.cn/test', secret: 'abc123secret' };
    useWebhookStore.getState().setFeishuConfig(config);

    const { feishuConfig } = useWebhookStore.getState();
    expect(feishuConfig).toEqual(config);

    const stored = JSON.parse(localStorageMock.getItem('panda:webhook:feishu') ?? 'null') as typeof config;
    expect(stored).toEqual(config);
  });

  it('setFeishuConfig(null) → 清除 state + localStorage', () => {
    localStorageMock.setItem('panda:webhook:feishu', JSON.stringify({ webhookUrl: 'x' }));
    useWebhookStore.setState({ feishuConfig: { webhookUrl: 'x' } });

    useWebhookStore.getState().setFeishuConfig(null);

    expect(useWebhookStore.getState().feishuConfig).toBeNull();
    expect(localStorageMock.getItem('panda:webhook:feishu')).toBeNull();
  });

  // ── setTelegramConfig ────────────────────────────────────────────────────

  it('setTelegramConfig → 更新 state 并持久化 localStorage', () => {
    const config = { botToken: 'bot123:secret', chatId: '-1001234567' };
    useWebhookStore.getState().setTelegramConfig(config);

    const { telegramConfig } = useWebhookStore.getState();
    expect(telegramConfig).toEqual(config);

    const stored = JSON.parse(localStorageMock.getItem('panda:webhook:telegram') ?? 'null') as typeof config;
    expect(stored).toEqual(config);
  });

  // ── sendNotification 成功路径 ────────────────────────────────────────────

  it('feishu sendNotification 成功 → ok:true + isSending 复位', async () => {
    useWebhookStore.setState({
      feishuConfig: { webhookUrl: 'https://open.feishu.cn/test' },
    });

    const result = await useWebhookStore.getState().sendNotification('feishu', {
      title: '测试',
      body: '内容',
      level: 'info',
    });

    expect(result.ok).toBe(true);
    expect(useWebhookStore.getState().isSending).toBe(false);
    expect(useWebhookStore.getState().lastError).toBeNull();

    // bridge 被调用且第一个参数是 'feishu'
    expect(bridge.sendWebhookNotification).toHaveBeenCalledOnce();
    const calls = vi.mocked(bridge.sendWebhookNotification).mock.calls;
    expect(calls[0][0]).toBe('feishu');
  });

  it('telegram sendNotification 成功 → ok:true', async () => {
    useWebhookStore.setState({
      telegramConfig: { botToken: 'bot:token', chatId: '999' },
    });

    const result = await useWebhookStore.getState().sendNotification('telegram', {
      title: 'T',
      body: 'B',
      level: 'warn',
    });

    expect(result.ok).toBe(true);
    const calls = vi.mocked(bridge.sendWebhookNotification).mock.calls;
    expect(calls[0][0]).toBe('telegram');
  });

  // ── sendNotification 失败路径 ────────────────────────────────────────────

  it('feishu 配置缺失 → ok:false + lastError 中文', async () => {
    const result = await useWebhookStore.getState().sendNotification('feishu', {
      title: 'T',
      body: 'B',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('飞书');
    expect(useWebhookStore.getState().lastError).toContain('飞书');
  });

  it('telegram 配置缺失 → ok:false', async () => {
    const result = await useWebhookStore.getState().sendNotification('telegram', {
      title: 'T',
      body: 'B',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Telegram');
  });

  it('bridge 返回 error → lastError 同步更新', async () => {
    vi.mocked(bridge.sendWebhookNotification).mockResolvedValue({
      ok: false,
      error: '飞书业务错误 code=19001',
    });

    useWebhookStore.setState({
      feishuConfig: { webhookUrl: 'https://open.feishu.cn/test' },
    });

    const result = await useWebhookStore.getState().sendNotification('feishu', {
      title: 'T',
      body: 'B',
    });

    expect(result.ok).toBe(false);
    expect(useWebhookStore.getState().lastError).toContain('19001');
    expect(useWebhookStore.getState().isSending).toBe(false);
  });

  // ── clearError ────────────────────────────────────────────────────────────

  it('clearError → lastError 清空', () => {
    useWebhookStore.setState({ lastError: '旧错误' });
    useWebhookStore.getState().clearError();
    expect(useWebhookStore.getState().lastError).toBeNull();
  });

  // ── 脱敏显示 ─────────────────────────────────────────────────────────────

  it('maskedFeishuSecret 显示后 4 位', () => {
    useWebhookStore.setState({ feishuConfig: { webhookUrl: 'x', secret: 'my-long-secret' } });
    const masked = useWebhookStore.getState().maskedFeishuSecret();
    expect(masked).toBe('****cret');
  });

  it('maskedTelegramToken 显示后 4 位', () => {
    useWebhookStore.setState({ telegramConfig: { botToken: 'bot123:ABCDEF', chatId: '1' } });
    const masked = useWebhookStore.getState().maskedTelegramToken();
    expect(masked).toBe('****CDEF');
  });
});
