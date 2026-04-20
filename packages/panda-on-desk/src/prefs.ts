// Input: prefsPath (默认 userData/panda-on-desk-prefs.json) — main.ts 调用
// Output: load() → { snapshot } | null；save(prefsPath, data) → 原子写入
// Pos: panda-on-desk 用户偏好持久化 + W3 收尾 desk-prefs 双写
//
// W3-T1 升级（2026-04-20 +08:00）：
//   - 维持原 stub 兼容（main.ts 直接 require 路径不变）
//   - 新增 ~/.pandacc/desk-prefs.json 双写入口（loadDeskPrefs / saveDeskPrefs）
//     供 settings.html / preload/settings.ts 使用，与上游 userData 路径并存。
//   - 5 个 panda 选项：companionOnDesk / species / dndStart / dndEnd / notificationVolume / autoLaunch
//   - W5-T3 (2026-04-20 +08:00): 新增 language ∈ {en,zh,ko}（PANDA_LANG_WHITELIST），三语 UI 持久化
//
// 上游 fork：clawd-on-desk@4b07658:src/prefs.js（MIT）— 仅借鉴 atomic-write 思路
// [NEW-FILE:#20260419-DESK-FIX-02]（原 stub 创建标签）

"use strict";

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export const CURRENT_VERSION = 1;
export const SCHEMA: Record<string, unknown> = {};
export const SCHEMA_KEYS: string[] = [];
export const AGENT_FLAGS: string[] = [];

// ── 18 物种白名单（与 src/theme-renderer.ts::PANDA_SPECIES 1:1 对齐） ──
export const PANDA_SPECIES_WHITELIST = [
  "default",
  "axolotl",
  "blob",
  "cactus",
  "capybara",
  "cat",
  "chonk",
  "dragon",
  "duck",
  "ghost",
  "goose",
  "mushroom",
  "octopus",
  "owl",
  "penguin",
  "rabbit",
  "robot",
  "snail",
  "turtle",
] as const;

export type PandaSpecies = (typeof PANDA_SPECIES_WHITELIST)[number];

// ── 三语 LangCode 白名单（与 i18n.ts SUPPORTED_LANGS 1:1） ──
// W5-T3 新增：language 持久化字段，detectInitialLang() 自动从 process.env.LANG / app.getLocale() 选首语
export const PANDA_LANG_WHITELIST = ["en", "zh", "ko"] as const;
export type PandaLang = (typeof PANDA_LANG_WHITELIST)[number];

// ── 5 选项 panda 偏好 schema ──
export interface DeskPrefs {
  companionOnDesk: boolean;          // 启用桌面宠物总开关
  species: PandaSpecies;              // 物种（18 选 1）
  dndStart: string;                   // DND 开始时间 "HH:MM" 24h
  dndEnd: string;                     // DND 结束时间 "HH:MM"
  notificationVolume: number;         // 通知音量 0~100
  autoLaunch: boolean;                // 开机自启
  language: PandaLang;                // W5-T3 三语 UI 语言（默认按 detectInitialLang() 决定）
}

export const DEFAULT_DESK_PREFS: DeskPrefs = {
  companionOnDesk: true,
  species: "default",
  dndStart: "22:00",
  dndEnd: "08:00",
  notificationVolume: 60,
  autoLaunch: false,
  language: "en",
};

// ── ~/.pandacc/desk-prefs.json 路径 ──
export function getDeskPrefsPath(): string {
  return path.join(os.homedir(), ".pandacc", "desk-prefs.json");
}

function ensureDirSync(filePath: string): void {
  const dir = path.dirname(filePath);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.warn("[panda-on-desk:prefs] ensureDir failed:", (err as Error).message);
  }
}

function isValidTime(str: unknown): boolean {
  return typeof str === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(str);
}

function isValidVolume(n: unknown): boolean {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
}

export function validateDeskPrefs(input: unknown): DeskPrefs {
  const inp = (input && typeof input === "object" ? input : {}) as Partial<DeskPrefs>;
  const species = (PANDA_SPECIES_WHITELIST as readonly string[]).includes(inp.species as string)
    ? (inp.species as PandaSpecies)
    : DEFAULT_DESK_PREFS.species;
  const language = (PANDA_LANG_WHITELIST as readonly string[]).includes(inp.language as string)
    ? (inp.language as PandaLang)
    : DEFAULT_DESK_PREFS.language;
  return {
    companionOnDesk: typeof inp.companionOnDesk === "boolean" ? inp.companionOnDesk : DEFAULT_DESK_PREFS.companionOnDesk,
    species,
    dndStart: isValidTime(inp.dndStart) ? (inp.dndStart as string) : DEFAULT_DESK_PREFS.dndStart,
    dndEnd: isValidTime(inp.dndEnd) ? (inp.dndEnd as string) : DEFAULT_DESK_PREFS.dndEnd,
    notificationVolume: isValidVolume(inp.notificationVolume) ? (inp.notificationVolume as number) : DEFAULT_DESK_PREFS.notificationVolume,
    autoLaunch: typeof inp.autoLaunch === "boolean" ? inp.autoLaunch : DEFAULT_DESK_PREFS.autoLaunch,
    language,
  };
}

/**
 * 读取 ~/.pandacc/desk-prefs.json — 文件缺失/损坏 → 返回 default。
 * 全错误兜底 — 从不抛。
 */
export function loadDeskPrefs(prefsPath: string = getDeskPrefsPath()): DeskPrefs {
  try {
    if (!fs.existsSync(prefsPath)) return { ...DEFAULT_DESK_PREFS };
    const raw = fs.readFileSync(prefsPath, "utf8");
    const parsed = JSON.parse(raw);
    return validateDeskPrefs(parsed);
  } catch (err) {
    console.warn("[panda-on-desk:prefs] loadDeskPrefs fallback to defaults:", (err as Error).message);
    return { ...DEFAULT_DESK_PREFS };
  }
}

/**
 * 原子写入 ~/.pandacc/desk-prefs.json — 写 .tmp 后 rename。
 */
export function saveDeskPrefs(
  data: Partial<DeskPrefs>,
  prefsPath: string = getDeskPrefsPath(),
): { status: "ok"; data: DeskPrefs } | { status: "error"; message: string } {
  try {
    ensureDirSync(prefsPath);
    const merged = validateDeskPrefs({ ...loadDeskPrefs(prefsPath), ...data });
    const tmp = `${prefsPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(merged, null, 2), "utf8");
    fs.renameSync(tmp, prefsPath);
    return { status: "ok", data: merged };
  } catch (err) {
    const msg = (err as Error).message;
    console.warn("[panda-on-desk:prefs] saveDeskPrefs failed:", msg);
    return { status: "error", message: msg };
  }
}

// ── 上游兼容 stub（main.ts 仍走 _stubSettingsController；不破坏 byte-equal 行为） ──

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
 * 上游 stub 接口：返回 null 让 settings-controller 走默认值（保持 P1-T5 行为不变）。
 * desk-prefs 双写走独立 loadDeskPrefs / saveDeskPrefs 入口，不影响此处。
 */
export function load(_prefsPath: string): null {
  return null;
}

export function save(_prefsPath: string, _data: unknown): { status: "ok"; noop: true } {
  return { status: "ok", noop: true };
}

export function normalizeThemeOverrides(input: unknown): unknown {
  return input;
}

export function normalizeShortcuts(input: unknown): unknown {
  return input;
}
