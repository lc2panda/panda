// Input: IM adapter config (Telegram/Feishu/Wechat) + pairing code/timeline
// Output: adapter config + pairing actions for PdAdapterSettings
// Pos: State layer — drives PdAdapterSettings (Feishu + Telegram + Wechat)
//
// Source 1:1: cc-haha desktop/src/stores/adapterStore.ts shape
//   panda IPC 缺 adapterApi → 用 localStorage 持久化 + stub pairing TODO。
//   Comdr 指令: IM Wechat — 加 wechat 字段配 panda lc2panda-plugins/wechat plugin。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import { storage } from '../lib/storage';

export type PairedUser = {
  userId: string | number;
  displayName: string;
  pairedAt: number;
};

// Comdr 指令: IM Wechat — 登录方式 union
export type WechatLoginMode = 'qr' | 'bot-token';

export type AdapterConfig = {
  defaultProjectDir?: string;
  telegram?: {
    botToken?: string;
    allowedUsers?: number[];
    pairedUsers?: PairedUser[];
  };
  feishu?: {
    appId?: string;
    appSecret?: string;
    encryptKey?: string;
    verificationToken?: string;
    allowedUsers?: string[];
    streamingCard?: boolean;
    pairedUsers?: PairedUser[];
  };
  // Comdr 指令: IM Wechat — panda wechat plugin 配置
  wechat?: {
    loginMode?: WechatLoginMode;
    botToken?: string;       // 企业微信 Bot Token（仅 bot-token mode）
    webhookUrl?: string;     // 可选 webhook 接收消息 URL
    defaultSession?: string; // 默认转发到的 panda session id
    allowedUsers?: string[];
    pairedUsers?: PairedUser[];
  };
  pairing?: {
    expiresAt?: number;
    code?: string;
  };
};

const STORAGE_KEY = 'adapter-config';

// Comdr 指令: IM Wechat — 平台 union 扩到含 wechat
export type AdapterPlatform = 'telegram' | 'feishu' | 'wechat';

export interface AdapterStore {
  config: AdapterConfig;
  isLoading: boolean;
  error: string | null;

  fetchConfig: () => Promise<void>;
  updateConfig: (patch: Partial<AdapterConfig>) => Promise<void>;
  generatePairingCode: () => Promise<string>;
  removePairedUser: (
    platform: AdapterPlatform,
    userId: string | number,
  ) => Promise<void>;
}

function loadConfig(): AdapterConfig {
  return storage.get<AdapterConfig>(STORAGE_KEY, {});
}

function saveConfig(config: AdapterConfig) {
  storage.set<AdapterConfig>(STORAGE_KEY, config);
}

export const useAdapterStore = create<AdapterStore>()((set, get) => ({
  config: loadConfig(),
  isLoading: false,
  error: null,

  // TODO(IPC): panda 缺 adapterApi.getConfig；从 localStorage 读取。
  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ config: loadConfig(), isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load adapter config',
      });
    }
  },

  // TODO(IPC): panda 缺 adapterApi.updateConfig；写入 localStorage。
  updateConfig: async (patch) => {
    const next = { ...get().config, ...patch };
    set({ config: next });
    saveConfig(next);
  },

  // TODO(IPC): panda 缺 adapterApi.generatePairingCode；用本地 6 位随机数 + 60min TTL。
  generatePairingCode: async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const next = { ...get().config, pairing: { code, expiresAt } };
    set({ config: next });
    saveConfig(next);
    return code;
  },

  // TODO(IPC): panda 缺 adapterApi.removePairedUser；本地按平台过滤。
  removePairedUser: async (platform, userId) => {
    const config = get().config;
    if (platform === 'telegram' && config.telegram?.pairedUsers) {
      const next = {
        ...config,
        telegram: {
          ...config.telegram,
          pairedUsers: config.telegram.pairedUsers.filter(
            (u) => u.userId !== userId,
          ),
        },
      };
      set({ config: next });
      saveConfig(next);
    } else if (platform === 'feishu' && config.feishu?.pairedUsers) {
      const next = {
        ...config,
        feishu: {
          ...config.feishu,
          pairedUsers: config.feishu.pairedUsers.filter(
            (u) => u.userId !== userId,
          ),
        },
      };
      set({ config: next });
      saveConfig(next);
    } else if (platform === 'wechat' && config.wechat?.pairedUsers) {
      // Comdr 指令: IM Wechat — wechat 平台解绑
      const next = {
        ...config,
        wechat: {
          ...config.wechat,
          pairedUsers: config.wechat.pairedUsers.filter(
            (u) => u.userId !== userId,
          ),
        },
      };
      set({ config: next });
      saveConfig(next);
    }
  },
}));
