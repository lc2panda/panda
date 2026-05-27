// Input: channel ('feishu'|'telegram'), channel config, notification payload
// Output: Promise<{ ok: boolean; error?: string }> — HTTP webhook 推送结果
// Pos: packages/panda-desk-chat/electron/backend — v2.27.1 外部 webhook 通知通道（飞书+Telegram）
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import * as crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface FeishuConfig {
  webhookUrl: string;
  /** 飞书 v2 签名密钥（可选）。有则按 timestamp\n<secret> HMAC-SHA256 base64 签名。 */
  secret?: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export type WebhookChannel = 'feishu' | 'telegram';

export type NotificationLevel = 'info' | 'warn' | 'error';

export interface NotificationPayload {
  title: string;
  body: string;
  level?: NotificationLevel;
}

export interface WebhookResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Level emoji
// ---------------------------------------------------------------------------

const LEVEL_EMOJI: Record<NotificationLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨',
};

function levelEmoji(level: NotificationLevel = 'info'): string {
  return LEVEL_EMOJI[level] ?? 'ℹ️';
}

// ---------------------------------------------------------------------------
// 飞书 v2 签名
// ---------------------------------------------------------------------------

/**
 * 飞书 v2 签名算法：
 *   sign_str = "<timestamp>\n<secret>"
 *   sign     = base64( HMAC-SHA256( sign_str, secret ) )
 */
function buildFeishuSign(
  timestamp: number,
  secret: string,
): string {
  const signStr = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signStr);
  return hmac.digest('base64');
}

// ---------------------------------------------------------------------------
// 飞书推送
// ---------------------------------------------------------------------------

async function sendFeishu(
  config: FeishuConfig,
  payload: NotificationPayload,
  signal: AbortSignal,
): Promise<WebhookResult> {
  const emoji = levelEmoji(payload.level);
  const text = `${emoji} ${payload.title}\n${payload.body}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    msg_type: 'text',
    content: { text },
  };

  if (config.secret) {
    const timestamp = Math.floor(Date.now() / 1000);
    body.timestamp = String(timestamp);
    body.sign = buildFeishuSign(timestamp, config.secret);
  }

  let response: Response;
  try {
    response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `飞书请求失败：${msg}` };
  }

  // 飞书机器人成功响应 HTTP 200 但 code != 0 时表示业务错误
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `飞书 HTTP ${response.status}：${JSON.stringify(json)}`,
    };
  }

  const data = json as Record<string, unknown> | null;
  if (data && typeof data.code === 'number' && data.code !== 0) {
    return {
      ok: false,
      error: `飞书业务错误 code=${data.code}：${data.msg ?? '未知错误'}`,
    };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Telegram 推送
// ---------------------------------------------------------------------------

async function sendTelegram(
  config: TelegramConfig,
  payload: NotificationPayload,
  signal: AbortSignal,
): Promise<WebhookResult> {
  const emoji = levelEmoji(payload.level);
  const rawText = `${emoji} ${payload.title}\n${payload.body}`;
  const encodedText = encodeURIComponent(rawText);

  const url =
    `https://api.telegram.org/bot${config.botToken}/sendMessage` +
    `?chat_id=${encodeURIComponent(config.chatId)}` +
    `&text=${encodedText}`;

  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Telegram 请求失败：${msg}` };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const data = json as Record<string, unknown> | null;
    const description = data?.description ?? `HTTP ${response.status}`;
    return { ok: false, error: `Telegram 错误：${description}` };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 5_000;

/**
 * 向外部 webhook 通道推送通知。
 *
 * @param channel  'feishu' | 'telegram'
 * @param config   对应通道配置
 * @param payload  通知内容（title / body / level）
 * @returns        { ok: boolean; error?: string }
 */
export async function sendWebhookNotification(
  channel: 'feishu',
  config: FeishuConfig,
  payload: NotificationPayload,
): Promise<WebhookResult>;
export async function sendWebhookNotification(
  channel: 'telegram',
  config: TelegramConfig,
  payload: NotificationPayload,
): Promise<WebhookResult>;
export async function sendWebhookNotification(
  channel: WebhookChannel,
  config: FeishuConfig | TelegramConfig,
  payload: NotificationPayload,
): Promise<WebhookResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (channel === 'feishu') {
      return await sendFeishu(config as FeishuConfig, payload, controller.signal);
    } else {
      return await sendTelegram(config as TelegramConfig, payload, controller.signal);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `webhook 推送异常：${msg}` };
  } finally {
    clearTimeout(timer);
  }
}
