// Input: FeishuWebhookConfig / TelegramWebhookConfig 来自 UI 设置 + sendNotification(channel, payload) 来自业务触发
// Output: Zustand store — webhook 通知配置持久化 + 发送 action，脱敏 secret/botToken 显示
// Pos: State layer — v2.27.1 外部 webhook 通知通道（飞书 + Telegram）状态管理
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import { sendWebhookNotification } from '../ipc/bridge';
import type {
  FeishuWebhookConfig,
  TelegramWebhookConfig,
  WebhookNotificationPayload,
  WebhookChannelType,
} from '../ipc/types';

// ---------------------------------------------------------------------------
// LocalStorage keys
// ---------------------------------------------------------------------------

const LS_FEISHU_KEY = 'panda:webhook:feishu';
const LS_TELEGRAM_KEY = 'panda:webhook:telegram';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface WebhookStore {
  feishuConfig: FeishuWebhookConfig | null;
  telegramConfig: TelegramWebhookConfig | null;
  isSending: boolean;
  lastError: string | null;

  setFeishuConfig: (config: FeishuWebhookConfig | null) => void;
  setTelegramConfig: (config: TelegramWebhookConfig | null) => void;
  sendNotification: (
    channel: WebhookChannelType,
    payload: WebhookNotificationPayload,
  ) => Promise<{ ok: boolean; error?: string }>;
  clearError: () => void;

  /** 脱敏显示 secret（仅后 4 位） */
  maskedFeishuSecret: () => string | undefined;
  /** 脱敏显示 botToken（仅后 4 位） */
  maskedTelegramToken: () => string | undefined;
}

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function saveToStorage<T>(key: string, value: T | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // localStorage 不可用时静默忽略（e.g. 单测环境无 Storage quota）
  }
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useWebhookStore = create<WebhookStore>()((set, get) => ({
  feishuConfig: loadFromStorage<FeishuWebhookConfig>(LS_FEISHU_KEY),
  telegramConfig: loadFromStorage<TelegramWebhookConfig>(LS_TELEGRAM_KEY),
  isSending: false,
  lastError: null,

  setFeishuConfig: (config) => {
    saveToStorage(LS_FEISHU_KEY, config);
    set({ feishuConfig: config, lastError: null });
  },

  setTelegramConfig: (config) => {
    saveToStorage(LS_TELEGRAM_KEY, config);
    set({ telegramConfig: config, lastError: null });
  },

  sendNotification: async (channel, payload) => {
    const state = get();
    if (channel === 'feishu') {
      if (!state.feishuConfig) {
        const err = '飞书 webhook 未配置';
        set({ lastError: err });
        return { ok: false, error: err };
      }
      set({ isSending: true, lastError: null });
      const result = await sendWebhookNotification('feishu', state.feishuConfig, payload);
      set({ isSending: false, lastError: result.error ?? null });
      return result;
    } else {
      if (!state.telegramConfig) {
        const err = 'Telegram webhook 未配置';
        set({ lastError: err });
        return { ok: false, error: err };
      }
      set({ isSending: true, lastError: null });
      const result = await sendWebhookNotification('telegram', state.telegramConfig, payload);
      set({ isSending: false, lastError: result.error ?? null });
      return result;
    }
  },

  clearError: () => set({ lastError: null }),

  maskedFeishuSecret: () => {
    const s = get().feishuConfig?.secret;
    if (!s) return undefined;
    return s.length > 4 ? `****${s.slice(-4)}` : '****';
  },

  maskedTelegramToken: () => {
    const t = get().telegramConfig?.botToken;
    if (!t) return undefined;
    return t.length > 4 ? `****${t.slice(-4)}` : '****';
  },
}));
