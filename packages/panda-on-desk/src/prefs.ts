// Input: prefsPath (userData/panda-on-desk-prefs.json) — main.js L114, L158 调用
// Output: load() → { snapshot, locked, ... } | null；其余 schema/migrate/save 占位
// Pos: panda-on-desk 用户偏好持久化 — v0.1-alpha 占位 stub
//
// Forked from clawd-on-desk@4b07658:src/prefs.js (MIT License) — 仅占位
// [NEW-FILE:#20260419-DESK-FIX-02]
//
// TODO[v0.5]: 真实接入 SCHEMA + validate + migrate + atomic save
// 当前 load() 永远返回 null（让 settings-controller 走默认值）；save() no-op。

"use strict";

export const CURRENT_VERSION = 1;
export const SCHEMA: Record<string, unknown> = {};
export const SCHEMA_KEYS: string[] = [];
export const AGENT_FLAGS: string[] = [];

export function getDefaults(): Record<string, unknown> {
  return {};
}

export function validate(_input: unknown): { ok: true } {
  return { ok: true };
}

export function migrate(input: unknown): unknown {
  return input;
}

/**
 * Stub: 真实实现会读 prefsPath JSON + 校验 + migrate。
 * v0.1-alpha 永远返回 null — main.js 中 _initialPrefsLoad 为 null 时
 * settings-controller 走默认值（_stubSettingsController fallback）。
 */
export function load(_prefsPath: string): null {
  return null;
}

/**
 * Stub: 真实实现会原子写 prefsPath JSON。
 * v0.1-alpha no-op — 用户调整不持久化（v0.5 接入）。
 */
export function save(_prefsPath: string, _data: unknown): { status: "ok"; noop: true } {
  return { status: "ok", noop: true };
}

export function normalizeThemeOverrides(input: unknown): unknown {
  return input;
}

export function normalizeShortcuts(input: unknown): unknown {
  return input;
}
