// Input: ctx { getWin, getHitWin, sendToRenderer } — main.js L1115-1116 调用 permissionMod(ctx)
// Output: { repositionBubbles, handleBubbleHeight, handleDecide, cleanup, ... }
// Pos: panda-on-desk 权限气泡（clawd permission.js 812 行） — v0.1-alpha 占位 stub
//
// Forked from clawd-on-desk@4b07658:src/permission.js (MIT License) — 仅占位
// [NEW-FILE:#20260419-DESK-FIX-06]
//
// 注意：A1 §1.1 判定"不需要 fork"（panda CLI 自带 PermissionRequest UI），
//   但 main.js 引用 permissionMod 故必须有占位让 require 不抛错。
// v0.5+ 评估：彻底删 main.js permissionMod 引用 vs 真实 fork 此模块（取决于 hooks gateway 需求）。

"use strict";

import type { Event } from "electron";

interface PermissionCtx {
  getWin?: () => unknown;
  getHitWin?: () => unknown;
  sendToRenderer?: (...args: unknown[]) => void;
}

interface PermissionInstance {
  repositionBubbles(): void;
  handleBubbleHeight(event: Event, height: number): void;
  handleDecide(event: Event, behavior: unknown): void;
  cleanup(): void;
  getPendingPermissions(): unknown[];
}

const initPermission = function initPermission(_ctx: PermissionCtx): PermissionInstance {
  return {
    repositionBubbles(): void {
      // no-op
    },
    handleBubbleHeight(_event: Event, _height: number): void {
      // no-op
    },
    handleDecide(_event: Event, _behavior: unknown): void {
      // no-op
    },
    cleanup(): void {
      // no-op
    },
    getPendingPermissions(): unknown[] {
      return [];
    },
  };
};

module.exports = initPermission;
module.exports.default = initPermission;

export default initPermission;
