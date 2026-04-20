"use strict";
// Input:  panda CLI 内部事件（PetState 变化 / XP 增量 / 升级 / 权限请求 / 会话生命周期 /
//         P2-T1 新增：notification / badge / drag-target / dnd 4 类）
// Output: 跨进程 IPC 协议字段 — panda CLI ↔ panda-on-desk 共用 schema
// Pos:    src/desk/bridge.ts 与 packages/panda-on-desk/src/bridge/types.ts 同源
//         严守 anthropic byte-equal — 无 anthropic 通道引用
//
// [NEW-FILE:#20260419-P1-06]
// 2026-04-19 +08:00 P2-T1 扩展：4 新事件 + NotificationKind/Level 枚举（agent-α-P2-protocol）
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_IDENTITY = exports.PORT_PROBE_MAX = exports.PORT_BASE = exports.SECRET_HEADER = exports.RUNTIME_SCHEMA_VERSION = exports.RUNTIME_FILE_NAME = void 0;
// ─────────────────────────────────────────────────────────────────────────────
// 协议常量 — runtime.json schema / HTTP header / 端口范围
// ─────────────────────────────────────────────────────────────────────────────
/** runtime.json 落盘文件名（位于 ~/.pandacc/runtime.json） */
exports.RUNTIME_FILE_NAME = 'runtime.json';
/** runtime.json schema 版本，未来 schema 升级时用于兼容 fallback */
exports.RUNTIME_SCHEMA_VERSION = 1;
/** HTTP 鉴权 header 名 — 每个 POST 必须含此 header */
exports.SECRET_HEADER = 'X-Panda-Secret';
/** 端口探测起始 + 上限：1455 → 1455 + PORT_PROBE_MAX - 1 */
exports.PORT_BASE = 1455;
exports.PORT_PROBE_MAX = 16;
/** 兼容标识 — health 返回该字符串才认为是 panda-on-desk（防误命中其他 1455+ 服务） */
exports.APP_IDENTITY = 'panda-on-desk';
