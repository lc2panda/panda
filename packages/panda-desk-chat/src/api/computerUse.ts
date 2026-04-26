// Input: cc-haha desktop/src/api/computerUse.ts shape
// Output: ComputerUseStatus / SetupResult / Apps API (stub) for PdComputerUseSettings
// Pos: API layer — consumed by PdComputerUseSettings
//
// 1:1 cc-haha 字段；panda 全部走 stub（panda 暂不支持 computer-use），UI 仍可渲染状态。

export type ComputerUseStatus = {
  supported: boolean;
  platform: string;
  python: { installed: boolean; version?: string; path?: string };
  venv: { created: boolean; path?: string };
  dependencies: { installed: boolean };
  permissions: {
    accessibility: boolean | null;
    screenRecording: boolean | null;
  };
};

export type SetupResult = {
  success: boolean;
  steps: Array<{ name: string; ok: boolean; message: string }>;
};

export type InstalledApp = {
  bundleId: string;
  displayName: string;
};

export type AuthorizedApp = InstalledApp & {
  authorizedAt: string;
};

export type AuthorizedAppsResponse = {
  authorizedApps: AuthorizedApp[];
  grantFlags: {
    clipboardRead: boolean;
    clipboardWrite: boolean;
    systemKeyCombos: boolean;
  };
};

export type SetAuthorizedAppsInput = {
  authorizedApps: AuthorizedApp[];
  grantFlags: AuthorizedAppsResponse['grantFlags'];
};

const platform =
  typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
    ? 'darwin'
    : typeof navigator !== 'undefined' && /win/i.test(navigator.platform)
      ? 'win32'
      : 'linux';

// TODO(IPC): panda 完全没有 computerUseApi 后端；UI 始终展示 not-supported 占位。
export const computerUseApi = {
  async getStatus(): Promise<ComputerUseStatus> {
    return {
      supported: false,
      platform,
      python: { installed: false },
      venv: { created: false },
      dependencies: { installed: false },
      permissions: {
        accessibility: null,
        screenRecording: null,
      },
    };
  },

  async runSetup(): Promise<SetupResult> {
    return {
      success: false,
      steps: [
        {
          name: 'computer-use-not-implemented',
          ok: false,
          message: 'Computer-use is not yet supported in panda-desk-chat',
        },
      ],
    };
  },

  async getInstalledApps(): Promise<{ apps: InstalledApp[] }> {
    return { apps: [] };
  },

  async getAuthorizedApps(): Promise<AuthorizedAppsResponse> {
    return {
      authorizedApps: [],
      grantFlags: {
        clipboardRead: true,
        clipboardWrite: true,
        systemKeyCombos: true,
      },
    };
  },

  async setAuthorizedApps(_input: SetAuthorizedAppsInput): Promise<void> {
    /* TODO(IPC): no-op until computer-use sidecar wired */
  },

  async openSettings(_pane: 'Privacy_ScreenCapture' | 'Privacy_Accessibility'): Promise<void> {
    /* TODO(IPC): macOS-only sidecar required */
  },
};
