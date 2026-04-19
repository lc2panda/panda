// Input: { prefsPath, loadResult, injectedDeps } — main.js L196-216 调用
// Output: controller { get / getSnapshot / applyUpdate / subscribe / ... }
// Pos: panda-on-desk 设置面板控制器 — v0.1-alpha 占位 stub
//
// Forked from clawd-on-desk@4b07658:src/settings-controller.js (MIT License) — 仅占位
// [NEW-FILE:#20260419-DESK-FIX-03]
//
// TODO[v0.5]: 真实接入 SCHEMA-driven validate + persist + 多 key 订阅 + commandRegistry。
// 当前与 main.js _stubSettingsController fallback 行为一致；存在意义是
// 让 require('./settings-controller') 不抛错 + 接口签名锁定。

"use strict";

type Snapshot = Record<string, unknown>;
type Subscriber = (snap: Snapshot) => void;

interface CreateOpts {
  prefsPath?: string;
  loadResult?: unknown;
  injectedDeps?: Record<string, unknown>;
}

const DEFAULT_SNAPSHOT: Snapshot = {
  lang: "en",
  showTray: true,
  showDock: true,
  size: "P:25",
  miniMode: false,
  positionSaved: false,
  x: 0,
  y: 0,
  openAtLoginHydrated: false,
  manageClaudeHooksAutomatically: false,
  autoStartWithClaude: false,
  shortcuts: {},
  agents: { panda: { enabled: true, permissionsEnabled: true } },
  themeId: "panda",
  themeVariantId: "default",
  themeOverrides: {},
};

export function createSettingsController(_opts: CreateOpts = {}) {
  const snap: Snapshot = { ...DEFAULT_SNAPSHOT };
  const subs = new Set<Subscriber>();

  function get<T = unknown>(key: string): T {
    return snap[key] as T;
  }
  function getSnapshot(): Snapshot {
    return { ...snap };
  }
  function applyUpdate(key: string, value: unknown): { status: "ok" } {
    snap[key] = value;
    for (const fn of subs) {
      try {
        fn({ ...snap });
      } catch {
        // ignore subscriber error in stub
      }
    }
    return { status: "ok" };
  }
  function applyBulk(updates: Record<string, unknown>): { status: "ok" } {
    for (const [k, v] of Object.entries(updates)) snap[k] = v;
    for (const fn of subs) {
      try {
        fn({ ...snap });
      } catch {
        // ignore
      }
    }
    return { status: "ok" };
  }
  function applyCommand(_cmd: string, _payload?: unknown) {
    return { status: "ok", noop: true } as const;
  }
  function hydrate(_input: Snapshot) {
    return { status: "ok" } as const;
  }
  function subscribe(fn: Subscriber): () => void {
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  }
  function subscribeKey(_key: string, fn: Subscriber): () => void {
    return subscribe(fn);
  }
  function persist() {
    return { status: "ok", noop: true } as const;
  }
  function isLocked(): boolean {
    return false;
  }
  function dispose(): void {
    subs.clear();
  }

  return {
    applyUpdate,
    applyBulk,
    applyCommand,
    hydrate,
    getSnapshot,
    get,
    subscribe,
    subscribeKey,
    persist,
    isLocked,
    dispose,
  };
}
