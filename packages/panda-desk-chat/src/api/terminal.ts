// Input: cc-haha desktop/src/api/terminal.ts shape
// Output: terminal session lifecycle + stream events (stub for panda)
// Pos: API layer — consumed by PdTerminalSettings
//
// panda 暂无桌面 PTY sidecar → isAvailable() 返回 false，UI 走 unavailable 分支。

export type TerminalSpawnInput = { cols: number; rows: number };
export type TerminalSpawnResult = {
  session_id: number;
  shell: string;
  cwd: string;
};
export type TerminalOutputPayload = { session_id: number; data: string };
export type TerminalExitPayload = {
  session_id: number;
  code: number;
  signal?: string;
};

// TODO(IPC): panda 缺 terminal sidecar；isAvailable false → UI 显示 unavailable card。
export const terminalApi = {
  isAvailable(): boolean {
    return false;
  },

  async spawn(_input: TerminalSpawnInput): Promise<TerminalSpawnResult> {
    throw new Error('Terminal sidecar is not available in panda-desk-chat');
  },

  async resize(
    _sessionId: number,
    _cols: number,
    _rows: number,
  ): Promise<void> {
    /* noop */
  },

  async write(_sessionId: number, _data: string): Promise<void> {
    /* noop */
  },

  async kill(_sessionId: number): Promise<void> {
    /* noop */
  },

  async onOutput(_cb: (payload: TerminalOutputPayload) => void): Promise<() => void> {
    return () => {};
  },

  async onExit(_cb: (payload: TerminalExitPayload) => void): Promise<() => void> {
    return () => {};
  },
};
