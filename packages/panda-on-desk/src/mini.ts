// Input: ctx { getWin, getHitWin, sendToRenderer } — main.js L1117-1118 调用 miniMod(ctx)
// Output: getter/setter cluster + enter/exit/peek + restoreFromPrefs/handleDisplayChange/cleanup
// Pos: panda-on-desk Mini 模式（拖屏边缘隐藏 + hover peek） — v0.1-alpha 占位 stub
//
// Forked from clawd-on-desk@4b07658:src/mini.js (MIT License) — 仅占位
// [NEW-FILE:#20260419-DESK-FIX-07]
//
// A1 §1.1 判定"直接 fork"，但 P1-T2 时未 fork。当前 stub 满足 main.js
// 全部 _mini.* 调用接口签名，运行时永远报告 mini 未激活（getMiniMode → false）。
// TODO[v0.5]: 完整 fork 实现 — 涉及 BrowserWindow x 动画 + display 事件 + prefs 持久化。

"use strict";

interface MiniCtx {
  getWin?: () => unknown;
  getHitWin?: () => unknown;
  sendToRenderer?: (...args: unknown[]) => void;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MiniInstance {
  enterMiniMode(): void;
  exitMiniMode(): void;
  enterMiniViaMenu(): void;
  miniPeekIn(): void;
  miniPeekOut(): void;
  checkSnap(): void;
  checkMiniModeSnap(): void;
  cancelMiniTransition(): void;
  refreshTheme(): void;
  handleDisplayChange(): void;
  handleResize(): void;
  restoreFromPrefs(_prefs: unknown, size: { width: number; height: number }): Bounds | null;
  getMiniMode(): boolean;
  getMiniEdge(): null;
  getMiniTransitioning(): boolean;
  getMiniSleepPeeked(): boolean;
  setMiniSleepPeeked(v: boolean): void;
  getMiniPeeked(): boolean;
  setMiniPeeked(v: boolean): void;
  getIsAnimating(): boolean;
  cleanup(): void;
}

const initMini = function initMini(_ctx: MiniCtx): MiniInstance {
  return {
    enterMiniMode() {},
    exitMiniMode() {},
    enterMiniViaMenu() {},
    miniPeekIn() {},
    miniPeekOut() {},
    checkSnap() {},
    checkMiniModeSnap() {},
    cancelMiniTransition() {},
    refreshTheme() {},
    handleDisplayChange() {},
    handleResize() {},
    // 返回 null — main.js L694 守卫 `if (prefs.miniMode && _mini && ...)`，
    // 默认 prefs.miniMode=false 不会走到这；即便走到，null 也能让上游兜底。
    restoreFromPrefs(_prefs: unknown, _size: { width: number; height: number }): Bounds | null {
      return null;
    },
    getMiniMode() {
      return false;
    },
    getMiniEdge() {
      return null;
    },
    getMiniTransitioning() {
      return false;
    },
    getMiniSleepPeeked() {
      return false;
    },
    setMiniSleepPeeked(_v: boolean) {},
    getMiniPeeked() {
      return false;
    },
    setMiniPeeked(_v: boolean) {},
    getIsAnimating() {
      return false;
    },
    cleanup() {},
  };
};

module.exports = initMini;
module.exports.default = initMini;

export default initMini;
