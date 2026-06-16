// Input: TitleGenerateInput (sessionId, firstUserMessage, provider, ...)
// Output: vitest 用例覆盖 deriveTitle / generateSessionTitle AI 成功/失败/超时/清理
// Pos: packages/panda-desk-chat/electron/backend/__tests__ — v2.27.1 titleService 单测

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  deriveTitle,
  generateSessionTitle,
  buildTitleLanguageDirective,
  buildTitlePrompt,
} from '../title-service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FetchMock = { mockResolvedValueOnce(v: unknown): void; mockRejectedValueOnce(v: unknown): void; not: { toHaveBeenCalled(): void } };

// ---------------------------------------------------------------------------
// M2: 标题语言指令 — buildTitleLanguageDirective / buildTitlePrompt
// ---------------------------------------------------------------------------

describe('buildTitleLanguageDirective (M2)', () => {
  it('未配置 language → 跟随对话语言', () => {
    expect(buildTitleLanguageDirective()).toContain('same language as the conversation');
    expect(buildTitleLanguageDirective('')).toContain('same language as the conversation');
    expect(buildTitleLanguageDirective('   ')).toContain('same language as the conversation');
  });

  it('language=zh → 固定 Chinese', () => {
    expect(buildTitleLanguageDirective('zh')).toBe('Write the title in Chinese.');
    expect(buildTitleLanguageDirective('ZH')).toBe('Write the title in Chinese.');
  });

  it('language=en → 固定 English', () => {
    expect(buildTitleLanguageDirective('en')).toBe('Write the title in English.');
  });

  it('language=ja → 固定 Japanese', () => {
    expect(buildTitleLanguageDirective('ja')).toBe('Write the title in Japanese.');
  });

  it('未知 language 码 → 原样使用', () => {
    expect(buildTitleLanguageDirective('xx-custom')).toBe('Write the title in xx-custom.');
  });
});

describe('buildTitlePrompt (M2)', () => {
  it('配置 language=zh 时 prompt 含中文指令', () => {
    const p = buildTitlePrompt('user msg', 'assistant reply', 'zh');
    expect(p).toContain('Write the title in Chinese.');
    expect(p).toContain('user msg');
    expect(p).toContain('assistant reply');
  });

  it('未配置 language 时 prompt 含跟随对话语言指令', () => {
    const p = buildTitlePrompt('hello', 'hi');
    expect(p).toContain('same language as the conversation');
    expect(p).not.toContain('Generate a concise 4-12 character Chinese title');
  });
});

// ---------------------------------------------------------------------------
// deriveTitle — sync unit tests
// ---------------------------------------------------------------------------

describe('deriveTitle', () => {
  it('返回非空 fallback（空字符串 → 新对话）', () => {
    expect(deriveTitle('')).toBe('新对话');
    expect(deriveTitle('   ')).toBe('新对话');
  });

  it('短消息直接返回', () => {
    expect(deriveTitle('Hello')).toBe('Hello');
  });

  it('中文 user message 截断在 40 字内', () => {
    const long = '请帮我分析一下这段代码的性能瓶颈，包括时间复杂度和空间复杂度的详细说明。';
    const result = deriveTitle(long);
    expect(result.length).toBeLessThanOrEqual(32);
    expect(result.length).toBeGreaterThan(0);
  });

  it('按句号智能截断', () => {
    const msg = '你好。请帮我分析这段代码的问题。还有其他需求。';
    const result = deriveTitle(msg);
    expect(result).toBe('你好。');
  });

  it('按逗号截断（句号不在前 40 字内时）', () => {
    const msg = '请分析,然后继续进行下面非常漫长的描述以确保超出四十字符的限制在这里';
    const result = deriveTitle(msg);
    expect(result.endsWith(',')).toBe(true);
  });

  it('超长结果截断到 32 字符', () => {
    const msg = 'a'.repeat(50);
    expect(deriveTitle(msg).length).toBeLessThanOrEqual(32);
  });
});

// ---------------------------------------------------------------------------
// generateSessionTitle — AI 路径（mock fetch）
// ---------------------------------------------------------------------------

const MOCK_API_KEY = 'sk-ant-test';
const BASE_PROVIDER = { apiKey: MOCK_API_KEY };

describe('generateSessionTitle', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('成功响应 → 返回 ai title', async () => {
    (fetch as unknown as FetchMock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '代码分析' }],
      }),
    });

    const result = await generateSessionTitle({
      sessionId: 'test-session-1',
      firstUserMessage: '帮我分析这段代码',
      provider: BASE_PROVIDER,
    });

    expect(result.source).toBe('ai');
    expect(result.title).toBe('代码分析');
  });

  it('401 失败 → fallback', async () => {
    (fetch as unknown as FetchMock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'unauthorized' }),
    });

    const result = await generateSessionTitle({
      sessionId: 'test-session-2',
      firstUserMessage: '帮我写一首诗',
      provider: BASE_PROVIDER,
    });

    expect(result.source).toBe('fallback');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('fetch 抛错（模拟超时 AbortError）→ fallback', async () => {
    const abortErr = new DOMException('The operation was aborted', 'AbortError');
    (fetch as unknown as FetchMock).mockRejectedValueOnce(abortErr);

    const result = await generateSessionTitle({
      sessionId: 'test-session-3',
      firstUserMessage: '请帮我规划一下今天的工作安排',
      provider: BASE_PROVIDER,
    });

    expect(result.source).toBe('fallback');
  });

  it('模型返回带引号和标点 → cleanTitle 后返回干净 title', async () => {
    (fetch as unknown as FetchMock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '"代码审查"' }],
      }),
    });

    const result = await generateSessionTitle({
      sessionId: 'test-session-4',
      firstUserMessage: '帮我审查一下代码',
      provider: BASE_PROVIDER,
    });

    expect(result.source).toBe('ai');
    expect(result.title).toBe('代码审查');
    expect(result.title).not.toContain('"');
  });

  it('中文 user message → 中文 title', async () => {
    (fetch as unknown as FetchMock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '旅行计划' }],
      }),
    });

    const result = await generateSessionTitle({
      sessionId: 'test-session-5',
      firstUserMessage: '帮我规划一次从北京到上海的旅行',
      provider: BASE_PROVIDER,
    });

    expect(result.source).toBe('ai');
    expect(result.title).toBe('旅行计划');
  });

  it('模型返回过长 title → 截断到 32 字符', async () => {
    const longTitle = '这是一个非常非常非常非常非常非常非常非常非常非常长的标题内容超过了限制';
    (fetch as unknown as FetchMock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: longTitle }],
      }),
    });

    const result = await generateSessionTitle({
      sessionId: 'test-session-6',
      firstUserMessage: '测试',
      provider: BASE_PROVIDER,
    });

    expect(result.source).toBe('ai');
    expect(result.title.length).toBeLessThanOrEqual(32);
  });

  it('空 user message → fallback 到默认', async () => {
    const result = await generateSessionTitle({
      sessionId: 'test-session-7',
      firstUserMessage: '',
      provider: BASE_PROVIDER,
    });

    // 无 provider.apiKey 时（空消息时 fallback 调 deriveTitle → '新对话'）
    // 注意：这里 provider 有 apiKey，但 firstUserMessage 为空，deriveTitle 返回 '新对话'
    // fetch 不会被调用因为即使调用了 AI，AI 返回后 cleanTitle('') = '' 也会 fallback
    // 实际上 fetch 会被调用（有 apiKey），但 AI 返回空时 fallback
    (fetch as unknown as FetchMock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '' }],
      }),
    });

    const result2 = await generateSessionTitle({
      sessionId: 'test-session-7b',
      firstUserMessage: '',
      provider: BASE_PROVIDER,
    });

    expect(result2.source).toBe('fallback');
    expect(result2.title).toBe('新对话');
  });

  it('language 选项注入请求 prompt（固定语言）', async () => {
    const fetchMock = fetch as unknown as FetchMock & { mock: { calls: unknown[][] } };
    (fetch as unknown as FetchMock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'Code review' }] }),
    });

    await generateSessionTitle({
      sessionId: 'test-session-lang',
      firstUserMessage: '帮我审查代码',
      language: 'en',
      provider: BASE_PROVIDER,
    });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    const promptText = body.messages[0].content as string;
    expect(promptText).toContain('Write the title in English.');
  });

  it('无 provider.apiKey 且无环境变量 → fallback', async () => {
    // 确保 process.env 没有 ANTHROPIC_API_KEY（避免本机环境干扰）
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    // 设置不存在的 settings 路径（resolveApiKey 会 ENOENT fallback）
    process.env.PANDA_CONFIG_DIR = '/tmp/__non_existent_panda_config__';

    const result = await generateSessionTitle({
      sessionId: 'test-session-8',
      firstUserMessage: '帮我写一首诗',
    });

    process.env.ANTHROPIC_API_KEY = saved ?? undefined!;
    delete process.env.PANDA_CONFIG_DIR;

    expect(result.source).toBe('fallback');
  });
});
