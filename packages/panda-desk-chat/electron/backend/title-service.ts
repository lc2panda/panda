// Input: sessionId + firstUserMessage + optional firstAssistantMessage + optional provider creds
// Output: { title: string; source: 'ai' | 'fallback' } — concise session title (按对话语言或 language 配置)
// Pos: packages/panda-desk-chat/electron/backend — v2.27.1 titleService Haiku 两阶段抽取

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TITLE_LEN = 32;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_TOKENS = 64;
const TEMPERATURE = 0.5;

// ---------------------------------------------------------------------------
// Config path helper
// ---------------------------------------------------------------------------

function pandaccRoot(): string {
  return (process.env.PANDA_CONFIG_DIR ?? '').trim() || path.join(os.homedir(), '.pandacc');
}

/**
 * 从以下来源按优先级解析 Anthropic API key：
 *  1. opts.provider.apiKey（调用方显式传入）
 *  2. process.env.ANTHROPIC_API_KEY
 *  3. ~/.pandacc/settings.json env.ANTHROPIC_API_KEY
 * 未找到时返回 null。
 */
async function resolveApiKey(provider?: { apiKey?: string }): Promise<string | null> {
  if (provider?.apiKey) return provider.apiKey;
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

  const settingsPath = path.join(pandaccRoot(), 'settings.json');
  try {
    const raw = await fs.readFile(settingsPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const env = parsed.env;
    if (env && typeof env === 'object') {
      const key = (env as Record<string, unknown>).ANTHROPIC_API_KEY;
      if (typeof key === 'string' && key.trim()) return key.trim();
    }
  } catch {
    // file missing or parse error → return null
  }
  return null;
}

// 把 settings.language 配置值映射到人类可读语言名，供标题 prompt 指定语言。
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  zh: 'Chinese',
  'zh-cn': 'Chinese',
  'zh-tw': 'Chinese (Traditional)',
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  pt: 'Portuguese',
  ru: 'Russian',
  it: 'Italian',
};

/**
 * 构造标题语言指令：
 * - 配置了 language → 固定用该语言生成标题
 * - 未配置 → 跟随对话语言生成标题
 * 导出以便复用与单测（不触发 API）。
 */
export function buildTitleLanguageDirective(language?: string): string {
  const normalized = (language ?? '').trim().toLowerCase();
  if (!normalized) {
    return 'Write the title in the same language as the conversation.';
  }
  const displayName = LANGUAGE_DISPLAY_NAMES[normalized] ?? language!.trim();
  return `Write the title in ${displayName}.`;
}

/**
 * 从 ~/.pandacc/settings.json 读取 language 配置；缺失/解析失败返回 undefined。
 */
async function resolveLanguage(): Promise<string | undefined> {
  const settingsPath = path.join(pandaccRoot(), 'settings.json');
  try {
    const raw = await fs.readFile(settingsPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const lang = parsed.language;
    if (typeof lang === 'string' && lang.trim()) return lang.trim();
  } catch {
    // file missing or parse error → undefined（跟随对话语言）
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TitleGenerateInput {
  sessionId: string;
  jsonlPath?: string;
  firstUserMessage: string;
  firstAssistantMessage?: string;
  /**
   * 固定标题语言（如 'zh'/'en'）。未传时从 settings.json 读取；
   * 仍未配置则跟随对话语言生成。
   */
  language?: string;
  provider?: {
    apiKey: string;
    baseUrl?: string;
  };
}

export interface TitleGenerateResult {
  title: string;
  source: 'ai' | 'fallback';
}

// ---------------------------------------------------------------------------
// deriveTitle — sync fallback (首 user message 智能截断)
// ---------------------------------------------------------------------------

/**
 * 同步 fallback：取 firstUserMessage 前 40 字符，按句号/逗号/换行智能截断。
 * 总是返回非空字符串。
 */
export function deriveTitle(firstUserMessage: string): string {
  const raw = firstUserMessage.replace(/\s+/g, ' ').trim();
  if (!raw) return '新对话';

  // 智能截断：找第一个自然断点（句号/逗号/换行），要求至少 1 个有效字符
  const cap = raw.slice(0, 40);
  let stopIdx = -1;
  for (let i = 1; i < cap.length; i++) {
    const ch = cap[i];
    if (ch === '。' || ch === '\n' || ch === '.') {
      stopIdx = i;
      break;
    }
    if (ch === '，' || ch === ',') {
      stopIdx = i;
      break;
    }
  }

  const derived = stopIdx >= 1 ? cap.slice(0, stopIdx + 1) : cap;
  return derived.slice(0, MAX_TITLE_LEN);
}

// ---------------------------------------------------------------------------
// cleanTitle — strip quotes, punctuation, trailing spaces, then truncate
// ---------------------------------------------------------------------------

function cleanTitle(raw: string): string {
  return raw
    .replace(/^["""''`\s]+|["""''`\s]+$/g, '') // strip surrounding quotes/spaces
    .replace(/[\r\n]+/g, '')                    // remove newlines
    .replace(/\s{2,}/g, ' ')                    // collapse double spaces
    .trim()
    .slice(0, MAX_TITLE_LEN);
}

// ---------------------------------------------------------------------------
// generateTitle — async AI call (Haiku)
// ---------------------------------------------------------------------------

/**
 * 拼装会话标题 prompt。language 配置时固定该语言，未配置时跟随对话语言。
 * 导出以便单测断言语言指令注入（不触发 API）。
 */
export function buildTitlePrompt(
  userSnippet: string,
  assistantSnippet: string,
  language?: string,
): string {
  return (
    'Generate a concise title (4-12 characters / 3-7 words) for this conversation.\n' +
    `${buildTitleLanguageDirective(language)}\n` +
    'Output JUST the title, no quotes, no punctuation, no markdown.\n\n' +
    `User message: ${userSnippet}\n` +
    `Assistant reply: ${assistantSnippet}\n\n` +
    'Title:'
  );
}

/**
 * 调 Anthropic Haiku 生成会话标题。language 配置时固定该语言，未配置时
 * 跟随对话语言。失败/超时时静默返回 deriveTitle fallback。
 */
export async function generateSessionTitle(
  opts: TitleGenerateInput,
): Promise<TitleGenerateResult> {
  const fallback = deriveTitle(opts.firstUserMessage);

  const apiKey = await resolveApiKey(opts.provider);
  if (!apiKey) {
    return { title: fallback, source: 'fallback' };
  }

  const baseUrl = opts.provider?.baseUrl?.replace(/\/$/, '') ?? 'https://api.anthropic.com';
  const endpoint = `${baseUrl}/v1/messages`;

  const userSnippet = opts.firstUserMessage.slice(0, 500);
  const assistantSnippet = (opts.firstAssistantMessage ?? '').slice(0, 500);

  // language 配置时固定标题语言，未配置时跟随对话语言
  const language = opts.language ?? (await resolveLanguage());
  const promptText = buildTitlePrompt(userSnippet, assistantSnippet, language);

  const body = JSON.stringify({
    model: HAIKU_MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    messages: [{ role: 'user', content: promptText }],
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return { title: fallback, source: 'fallback' };
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    const rawTitle =
      data.content?.find((b) => b.type === 'text')?.text ?? '';
    const cleaned = cleanTitle(rawTitle);

    if (!cleaned) {
      return { title: fallback, source: 'fallback' };
    }

    return { title: cleaned, source: 'ai' };
  } catch {
    clearTimeout(timer);
    return { title: fallback, source: 'fallback' };
  }
}
