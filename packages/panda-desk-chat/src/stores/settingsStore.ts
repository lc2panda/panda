// Input: 用户偏好（permission/model/effort/locale/theme/sidebar/font/notification/skipWebFetchPreflight）
// Output: cc-haha 1:1 settings 状态 + panda 扩展（fontSize/sidebarExpanded/inspectorVisible/workingDirectory/notificationsEnabled/migration）
// Pos: State layer — consumed by SettingsPage / model selector / theme provider / i18n / notification manager
//
// Source 1:1: cc-haha desktop/src/stores/settingsStore.ts (135 行)
//   字段名 / action 名 / action 顺序与 cc-haha 完全一致；
//   panda IPC bridge 替换 cc-haha settingsApi/modelsApi；
//   panda 扩展（fontSize / sidebarExpanded / inspectorVisible / workingDirectory /
//   notificationsEnabled / loadSettings / saveSettings / setupSettingsBridge / migration）保留。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import * as bridge from '../ipc/bridge';
import { storage } from '../lib/storage';
import type {
  PermissionMode,
  EffortLevel,
  ModelInfo,
  ThemeMode,
} from '../types/settings';
import { useUIStore } from './uiStore';
// Comdr 指令 cc-haha 路线 A 调整：settingsStore.setLocale 必须同步调用 i18n.setLocale
//   （后者负责 dispatch 'panda-locale-change' + 强制 reload window）。
//   旧实现只 set state + saveSettings，导致 PdGeneralSettings 切换语言后必须手动 Cmd+R。
import { setLocale as applyI18nLocale } from '../i18n';
// Comdr 指令 (任务 4): fetchAll fallback — IPC getModels 缺失/为空时回退到 providerStore
//   的 active provider models（避免 availableModels=[] 让 PdModelSelector 显示 placeholder）。
import { useProviderStore } from './providerStore';

// ---------------------------------------------------------------------------
// Locale — cc-haha L7-L16
// Comdr 指令: 仅支持 zh / en（删除 ja/ko）
// ---------------------------------------------------------------------------

export type Locale = 'zh' | 'en';

const LOCALE_STORAGE_KEY = 'panda-locale';
const STORAGE_KEY = 'settings';

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
    // 历史 ja/ko 用户迁移到 en
    if (stored === 'ja' || stored === 'ko') {
      localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
      return 'en';
    }
  } catch {
    /* localStorage unavailable */
  }
  return 'zh';
}

// ---------------------------------------------------------------------------
// panda 扩展类型 — Theme/Locale 别名 + 持久化字段
// ---------------------------------------------------------------------------

/** panda 兼容：Theme 比 cc-haha ThemeMode 多一个 'system'。 */
export type Theme = ThemeMode | 'system';

export type { PermissionMode, EffortLevel } from '../types/settings';

interface PersistedExtras {
  /** panda only — UI 字号 */
  fontSize: number;
  /** panda only — 侧栏展开 */
  sidebarExpanded: boolean;
  /** panda only — 检视器可见 */
  inspectorVisible: boolean;
  /** panda only — 工作目录 */
  workingDirectory: string;
  /** panda only — 系统通知 */
  notificationsEnabled: boolean;
  /** panda only — model id 直接持久化（cc-haha 用 currentModel: ModelInfo） */
  model: string;
}

// ---------------------------------------------------------------------------
// Store interface — cc-haha L18-L37 + panda 扩展
// ---------------------------------------------------------------------------

export interface SettingsStore extends PersistedExtras {
  // ── cc-haha L19-L29 字段 ────────────────────────────────────────────────
  permissionMode: PermissionMode;
  currentModel: ModelInfo | null;
  effortLevel: EffortLevel;
  availableModels: ModelInfo[];
  activeProviderName: string | null;
  locale: Locale;
  theme: Theme;
  skipWebFetchPreflight: boolean;
  isLoading: boolean;
  error: string | null;

  // ── cc-haha actions（顺序与 cc-haha L31-L36 一致）────────────────────────
  // cc-haha L31
  fetchAll: () => Promise<void>;
  // cc-haha L32: setPermissionMode（async：optimistic + 失败回滚）
  setPermissionMode: (mode: PermissionMode) => Promise<void>;
  // cc-haha L33
  setModel: (modelId: string) => Promise<void>;
  // cc-haha L34
  setEffort: (level: EffortLevel) => Promise<void>;
  // cc-haha L35
  setLocale: (locale: Locale) => void;
  // cc-haha L36
  setTheme: (theme: Theme) => void;
  // cc-haha L37
  setSkipWebFetchPreflight: (enabled: boolean) => Promise<void>;

  // ── panda 扩展 actions（保留向下兼容）────────────────────────────────────
  setFontSize: (size: number) => void;
  setEffortLevel: (level: EffortLevel) => void;
  setWorkingDirectory: (dir: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  loadSettings: () => void;
  saveSettings: () => void;
  resetSettings: () => void;
}

// ---------------------------------------------------------------------------
// Defaults & helpers
// ---------------------------------------------------------------------------

const defaultExtras: PersistedExtras = {
  fontSize: 16, // cc-haha 默认浏览器 16px root；avoid Tailwind utility 6.25% 偏小（V1 audit 根因 #1）
  sidebarExpanded: true,
  inspectorVisible: false,
  workingDirectory: '',
  notificationsEnabled: true,
  model: 'claude-opus-4-7',
};

interface PersistedSettings extends PersistedExtras {
  theme: Theme;
  locale: Locale;
  permissionMode: PermissionMode;
  effortLevel: EffortLevel;
}

const persistedDefaults: PersistedSettings = {
  ...defaultExtras,
  theme: 'light',
  locale: getStoredLocale(),
  permissionMode: 'default',
  effortLevel: 'medium',
};

function pickPersisted(state: SettingsStore): PersistedSettings {
  return {
    fontSize: state.fontSize,
    sidebarExpanded: state.sidebarExpanded,
    inspectorVisible: state.inspectorVisible,
    workingDirectory: state.workingDirectory,
    notificationsEnabled: state.notificationsEnabled,
    model: state.model,
    theme: state.theme,
    locale: state.locale,
    permissionMode: state.permissionMode,
    effortLevel: state.effortLevel,
  };
}

/**
 * cc-haha PermissionMode (`default | acceptEdits | bypassPermissions | plan`)
 * 与 panda IPC PermissionMode (`default | plan | auto | bypassPermissions`)
 * 不完全对齐：`acceptEdits` 在 panda IPC 缺失，映射到最接近的 `default`；
 * panda IPC `auto` 不在 cc-haha 中（仅用于 PdComposer 旧 UI）。
 * TODO(IPC): 等 panda 主进程接受 `acceptEdits` 字面量后即可去掉此映射。
 */
function toIpcPermissionMode(
  mode: PermissionMode,
): 'default' | 'plan' | 'auto' | 'bypassPermissions' {
  if (mode === 'acceptEdits') return 'default';
  return mode;
}

// ---------------------------------------------------------------------------
// Store — cc-haha L39-L134
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  // cc-haha L40-L49 默认状态
  permissionMode: 'default',
  currentModel: null,
  effortLevel: 'medium',
  availableModels: [],
  activeProviderName: null,
  locale: getStoredLocale(),
  theme: useUIStore.getState().theme,
  skipWebFetchPreflight: true,
  isLoading: false,
  error: null,
  // panda 扩展默认
  ...defaultExtras,

  // cc-haha L51-L80: fetchAll — 并发拉取 5 路 + 失败回滚
  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      // panda IPC 适配：bridge.getModels()/getSlashCommands() 暴露 ModelListResponse；
      // 但 cc-haha 的 5 个端点（getPermissionMode/list/getCurrent/getEffort/getUser）
      // 在 panda IPC 下并不全部存在。可用：bridge.getModels() 拿 models + provider；
      // 其他权限模式 / current model / effort / userSettings 直接读 panda localStorage 或回退默认。
      // TODO(IPC): 等 panda 主进程暴露 settings.get*/models.getCurrent 后切回真正的并发拉取。
      const modelsRes = await bridge.getModels();
      let list = Array.isArray(modelsRes)
        ? (modelsRes as unknown as ModelInfo[])
        : ((modelsRes as unknown as { models?: ModelInfo[] }).models ?? []);
      let providerName =
        (modelsRes as unknown as { provider?: { name?: string } }).provider
          ?.name ?? null;

      // Comdr 指令 (任务 4): IPC 返回空时从 providerStore active provider 拿 fallback。
      //   panda 的 IPC handlers.MODEL_LIST 返回 AVAILABLE_MODELS（3 条），但旧实现下游
      //   把 ModelInfo.provider 字段塞到了 description 上，导致 PdModelSelector 拿到的
      //   ModelInfo 缺 description；改为直接对齐字段后这里就只是数据通道。
      if (list.length === 0) {
        const ps = useProviderStore.getState();
        const active = ps.providers.find((p) => p.id === ps.activeProviderId) ?? ps.providers[0] ?? null;
        if (active && Array.isArray(active.models) && active.models.length > 0) {
          list = active.models.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.tags?.join(' · ') ?? undefined,
          })) as unknown as ModelInfo[];
          providerName = providerName ?? active.name;
        }
      }

      const persisted = storage.get<Partial<PersistedSettings>>(
        STORAGE_KEY,
        {},
      );

      const localeFinal = persisted.locale ?? getStoredLocale();
      const themeFinal = (persisted.theme ?? get().theme) as Theme;
      const effortFinal = persisted.effortLevel ?? 'medium';
      const permissionFinal = persisted.permissionMode ?? 'default';

      // 同步 UIStore 主题（cc-haha L62-L63 行为）
      if (themeFinal === 'light' || themeFinal === 'dark') {
        useUIStore.getState().setTheme(themeFinal);
      }

      // Comdr 指令：默认 Opus 4.7（backend list 已按 Opus → Sonnet → Haiku 家族 + 版本倒序，
      //   list[0] 即旗舰 Opus 4.7）。persisted.model 优先（用户选过的），fallback 到 list[0]。
      const currentId = persisted.model ?? get().model ?? list[0]?.id;
      const currentModel = list.find((m) => m.id === currentId) ?? list[0] ?? null;

      set({
        permissionMode: permissionFinal,
        availableModels: list,
        activeProviderName: providerName,
        currentModel,
        effortLevel: effortFinal,
        theme: themeFinal,
        locale: localeFinal,
        skipWebFetchPreflight: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load desktop settings';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  // cc-haha L82-L90: setPermissionMode — optimistic + 失败回滚
  setPermissionMode: async (mode) => {
    const prev = get().permissionMode;
    set({ permissionMode: mode });
    try {
      await bridge.setPermissionMode(toIpcPermissionMode(mode));
      get().saveSettings();
    } catch {
      set({ permissionMode: prev });
    }
  },

  // cc-haha L92-L96: setModel
  setModel: async (modelId) => {
    try {
      // panda 现在 setModel 需要 sessionId；这里以全局占位调用，让 chatStore 在切会话时再覆盖。
      // TODO(IPC): cc-haha 的 modelsApi.setCurrent(modelId) 是全局；panda IPC 需要扩展无 sessionId 的 setModel。
      await bridge.setModel('', modelId);
    } catch (err) {
      console.warn('[settingsStore] bridge.setModel failed (no session):', err);
    }
    const list = get().availableModels;
    const next = list.find((m) => m.id === modelId) ?? null;
    set({ currentModel: next, model: modelId });
    get().saveSettings();
  },

  // cc-haha L98-L106: setEffort — optimistic + 失败回滚
  setEffort: async (level) => {
    const prev = get().effortLevel;
    set({ effortLevel: level });
    try {
      // TODO(IPC): cc-haha 的 modelsApi.setEffort(level) 在 panda IPC 缺失。
      // 暂存到 localStorage；后续 panda IPC 暴露 effort 持久化端点后接入。
      get().saveSettings();
    } catch {
      set({ effortLevel: prev });
    }
  },

  // cc-haha L108-L111: setLocale
  // Comdr 指令 cc-haha 路线 A 调整：必须把 i18n 模块 currentLocale 同步切到目标，
  //   并触发 'panda-locale-change' 事件 + 整树 reload（i18n.setLocale 内部已实现）。
  //   旧实现只 set state + saveSettings → t() 仍读旧 currentLocale，必须 Cmd+R 才生效。
  setLocale: (locale) => {
    set({ locale });
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* noop */
    }
    get().saveSettings();
    // 立即应用 i18n（dispatch event + 触发 window.location.reload()）
    applyI18nLocale(locale);
  },

  // cc-haha L113-L123: setTheme — optimistic 同步 UIStore；panda 兼容 'system'
  setTheme: (theme) => {
    const prev = get().theme;
    set({ theme });
    if (theme === 'light' || theme === 'dark') {
      useUIStore.getState().setTheme(theme);
    }
    try {
      // TODO(IPC): cc-haha 的 settingsApi.updateUser({ theme }) 在 panda IPC 缺失。
      get().saveSettings();
    } catch {
      set({ theme: prev });
      if (prev === 'light' || prev === 'dark') {
        useUIStore.getState().setTheme(prev);
      }
    }
  },

  // cc-haha L125-L133: setSkipWebFetchPreflight — optimistic + 失败回滚
  setSkipWebFetchPreflight: async (enabled) => {
    const prev = get().skipWebFetchPreflight;
    set({ skipWebFetchPreflight: enabled });
    try {
      // TODO(IPC): cc-haha 的 settingsApi.updateUser({ skipWebFetchPreflight }) 在 panda IPC 缺失。
      get().saveSettings();
    } catch {
      set({ skipWebFetchPreflight: prev });
    }
  },

  // ── panda 扩展 actions ──────────────────────────────────────────────────
  setFontSize: (fontSize) => {
    set({ fontSize });
    get().saveSettings();
  },

  // panda 别名：等价 cc-haha setEffort（同步版本，下游 SettingsPage 直接用）
  setEffortLevel: (effortLevel) => {
    set({ effortLevel });
    get().saveSettings();
  },

  setWorkingDirectory: (workingDirectory) => {
    set({ workingDirectory });
    get().saveSettings();
  },

  setNotificationsEnabled: (enabled) => {
    set({ notificationsEnabled: enabled });
    get().saveSettings();
    bridge.setNotificationEnabled(enabled).catch((err: unknown) => {
      console.error('[settingsStore] setNotificationEnabled failed:', err);
    });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarExpanded: !state.sidebarExpanded }));
    get().saveSettings();
  },

  toggleInspector: () => {
    set((state) => ({ inspectorVisible: !state.inspectorVisible }));
    get().saveSettings();
  },

  loadSettings: () => {
    const saved = storage.get<Partial<PersistedSettings>>(STORAGE_KEY, {});
    // 一次性 migration：'system' → 'light'（panda 老用户兼容）
    const migratedTheme: Theme | undefined =
      saved.theme === 'system' ? 'light' : saved.theme;
    // EffortLevel migration: old vocab → new
    const oldEffort = saved.effortLevel as unknown as string | undefined;
    const validNew: EffortLevel[] = ['low', 'medium', 'high'];
    const migratedEffort: EffortLevel | undefined =
      oldEffort && !validNew.includes(oldEffort as EffortLevel)
        ? oldEffort === 'auto' || oldEffort === 'minimal'
          ? 'low'
          : oldEffort === 'max'
            ? 'high'
            : 'medium'
        : (oldEffort as EffortLevel | undefined);
    const merged: PersistedSettings = {
      ...persistedDefaults,
      ...saved,
      ...(migratedTheme ? { theme: migratedTheme } : {}),
      ...(migratedEffort ? { effortLevel: migratedEffort } : {}),
    };
    set(merged);
    const needsPersist =
      saved.theme === 'system' ||
      (oldEffort && !validNew.includes(oldEffort as EffortLevel));
    if (needsPersist) {
      storage.set(STORAGE_KEY, merged);
    }
  },

  saveSettings: () => {
    storage.set(STORAGE_KEY, pickPersisted(get()));
  },

  resetSettings: () => {
    storage.set(STORAGE_KEY, persistedDefaults);
    set({
      ...persistedDefaults,
      currentModel: null,
      availableModels: get().availableModels,
      activeProviderName: get().activeProviderName,
      skipWebFetchPreflight: true,
      isLoading: false,
      error: null,
    });
  },
}));

// ---------------------------------------------------------------------------
// Bridge event wiring — pushes permission mode to backend on startup
// ---------------------------------------------------------------------------

let settingsBridgeInitialized = false;

/**
 * Setup IPC bridge sync for settings.
 * Call once at app initialization (after setupBridgeListeners).
 */
export function setupSettingsBridge(): void {
  if (settingsBridgeInitialized) return;
  settingsBridgeInitialized = true;

  if (!bridge.isDevMode()) {
    const { permissionMode, notificationsEnabled } =
      useSettingsStore.getState();
    bridge.setPermissionMode(toIpcPermissionMode(permissionMode)).catch(
      (err: unknown) => {
        console.error(
          '[settingsStore] initial setPermissionMode failed:',
          err,
        );
      },
    );
    bridge.setNotificationEnabled(notificationsEnabled).catch((err: unknown) => {
      console.error(
        '[settingsStore] initial setNotificationEnabled failed:',
        err,
      );
    });
  }
}

// Auto-load on module init
useSettingsStore.getState().loadSettings();

// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
