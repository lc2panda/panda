// Input: 由 main.js L116-117 require 解构 ANIMATION_OVERRIDES_EXPORT_VERSION
// Output: updateRegistry / commandRegistry / ANIMATION_OVERRIDES_EXPORT_VERSION / 校验 helpers
// Pos: panda-on-desk 设置面板动作注册中心 — v0.1-alpha 占位 stub
//
// Forked from clawd-on-desk@4b07658:src/settings-actions.js (MIT License) — 仅占位
// [NEW-FILE:#20260419-DESK-FIX-04]
//
// TODO[v0.5]: 真实接入 SCHEMA-driven update + command registry + 主题 override 校验。

"use strict";

export const ANIMATION_OVERRIDES_EXPORT_VERSION = 1;
export const ONESHOT_OVERRIDE_STATES: string[] = [
  "attention",
  "error",
  "sweeping",
  "notification",
  "carrying",
];

export const updateRegistry: Record<string, unknown> = {};
export const commandRegistry: Record<string, unknown> = {};

// ── 校验 helpers (test-only export 在 clawd 中) ────────────────────────────
export function requireBoolean(v: unknown, label = "value"): boolean {
  if (typeof v !== "boolean") throw new TypeError(`${label}: expected boolean`);
  return v;
}
export function requireFiniteNumber(v: unknown, label = "value"): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new TypeError(`${label}: expected finite number`);
  }
  return v;
}
export function requireEnum<T extends string>(v: unknown, choices: readonly T[], label = "value"): T {
  if (typeof v !== "string" || !choices.includes(v as T)) {
    throw new TypeError(`${label}: expected one of ${choices.join("|")}`);
  }
  return v as T;
}
export function requireString(v: unknown, label = "value"): string {
  if (typeof v !== "string") throw new TypeError(`${label}: expected string`);
  return v;
}
export function requirePlainObject(v: unknown, label = "value"): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    throw new TypeError(`${label}: expected plain object`);
  }
  return v as Record<string, unknown>;
}
