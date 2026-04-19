// Input: ctx { getWin, getHitWin, sendToRenderer, getActiveTheme } — main.js L1119-1126
// Output: { showUpdateBubble, hideUpdateBubble, getBubbleWindow, syncVisibility,
//           handleUpdateBubbleHeight, handleUpdateBubbleAction, repositionUpdateBubble, cleanup }
// Pos: panda-on-desk 更新提示气泡 — v0.1-alpha 占位 stub
//
// Forked from clawd-on-desk@4b07658:src/update-bubble.js (MIT License) — 仅占位
// [NEW-FILE:#20260419-DESK-FIX-08]
//
// TODO[v0.5]: 真实接入 BrowserWindow update-bubble.html + 配合 updater.ts。
// 当前 stub 让 main.js _updateBubble.* 调用全部 no-op；getBubbleWindow → null。

"use strict";

import type { Event } from "electron";

interface UpdateBubbleCtx {
  getWin?: () => unknown;
  getHitWin?: () => unknown;
  sendToRenderer?: (...args: unknown[]) => void;
  getActiveTheme?: () => unknown;
}

interface UpdateBubbleInstance {
  showUpdateBubble(payload: unknown): void;
  hideUpdateBubble(): void;
  getBubbleWindow(): null;
  syncVisibility(): void;
  repositionUpdateBubble(): void;
  handleUpdateBubbleHeight(event: Event, height: number): void;
  handleUpdateBubbleAction(event: Event, actionId: unknown): void;
  cleanup(): void;
}

const initUpdateBubble = function initUpdateBubble(_ctx: UpdateBubbleCtx): UpdateBubbleInstance {
  return {
    showUpdateBubble(_payload: unknown) {},
    hideUpdateBubble() {},
    getBubbleWindow() {
      return null;
    },
    syncVisibility() {},
    repositionUpdateBubble() {},
    handleUpdateBubbleHeight(_event: Event, _height: number) {},
    handleUpdateBubbleAction(_event: Event, _actionId: unknown) {},
    cleanup() {},
  };
};

module.exports = initUpdateBubble;
module.exports.default = initUpdateBubble;

export default initUpdateBubble;
