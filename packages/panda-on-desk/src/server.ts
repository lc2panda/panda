// Input: ctx { updateSession, getActiveTheme } — main.js L1113-1114 调用 serverMod(ctx)
// Output: { start, cleanup } 占位 server 实例
// Pos: panda-on-desk 设置面板配套 HTTP server (clawd 用于 hooks/agent gateway) — v0.1-alpha 占位
//
// Forked from clawd-on-desk@4b07658:src/server.js (MIT License) — 仅占位
// [NEW-FILE:#20260419-DESK-FIX-05]
//
// 注意：与 packages/panda-on-desk/src/bridge/server.ts 是不同 server！
//   · bridge/server.ts —— Bridge IPC 协议层 (P2-T1 Phase 2)
//   · src/server.ts (本文件) —— clawd 遗留的 settings 面板 hooks gateway
// v0.5+ 评估二者是否可融合或彻底下线本 stub（panda 单 provider 可能不需要）。

"use strict";

interface ServerCtx {
  updateSession?: (...args: unknown[]) => void;
  getActiveTheme?: () => unknown;
}

interface ServerInstance {
  start(): void;
  cleanup(): void;
}

const initServer = function initServer(_ctx: ServerCtx): ServerInstance {
  return {
    start(): void {
      // no-op — v0.5 接入 hooks gateway HTTP server
    },
    cleanup(): void {
      // no-op
    },
  };
};

// CommonJS 兼容 main.js 的 `serverMod({...})` 调用形态
module.exports = initServer;
module.exports.default = initServer;

export default initServer;
