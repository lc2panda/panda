// Input:  telemetry.track(event, props) / captureException(err) / setUserConsent(bool) 调用点
// Output: 当前阶段全部 no-op；可选写入本地 audit log（~/.pandacc/telemetry-audit.log）
//         绝不发起任何外部 HTTP / WebSocket / DNS 请求
// Pos:    panda-on-desk 未来 telemetry 唯一接入点 — main/renderer/bridge 任何埋点必须走此 stub
//         严守 anthropic byte-equal — 仅 node 内置 fs/path/os；0 新依赖
//
// [NEW-FILE:#W9-02]
// 2026-04-20 +08:00 W9-T3 telemetry stub（agent-γ-W9-telemetry）
//
// 设计契约（详见 ../../PRIVACY.md §3）：
//   · 默认 disabled — 必须 opt-in，绝不 opt-out
//   · 当前阶段全部 no-op — 不实装任何上传逻辑
//   · 仅当用户显式同意（setUserConsent(true)）才写本地 audit log
//   · audit log 写在 ~/.pandacc/telemetry-audit.log（JSON Lines）
//   · 任何未来上传必须经过 isUploadAllowed() 双层检查（同意 + ENV 强制开关）
//   · 0 新依赖 — 纯 fs / path / os
//
// 用法（未来）：
//   import { telemetry } from './util/telemetry.js'
//   telemetry.track('petstate.change', { from: 'idle', to: 'thinking' })  // 当前 no-op
//   telemetry.captureException(err)                                          // 当前 no-op

import { homedir } from 'node:os'
import { join } from 'node:path'

// ─────────────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────────────

export type TelemetryEvent = {
  event: string
  props?: Record<string, unknown>
  ts: string // ISO 8601 UTC
}

export type TelemetryConsent = {
  enabled: boolean
  crashReport: boolean
  usageMetrics: boolean
  featureFlags: boolean
  errorLog: boolean
}

const DEFAULT_CONSENT: TelemetryConsent = {
  enabled: false,
  crashReport: false,
  usageMetrics: false,
  featureFlags: false,
  errorLog: false,
}

// ─────────────────────────────────────────────────────────────────────────────
// 配置目录解析（与 logger.ts / bridge/server.ts 1:1 对齐）
// ─────────────────────────────────────────────────────────────────────────────

function getConfigHomeDir(): string {
  const fromEnv = process.env.PANDA_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR
  return (fromEnv ?? join(homedir(), '.pandacc')).normalize('NFC')
}

export const AUDIT_LOG_NAME = 'telemetry-audit.log'

export function getAuditLogPath(configDir = getConfigHomeDir()): string {
  return join(configDir, AUDIT_LOG_NAME)
}

// ─────────────────────────────────────────────────────────────────────────────
// 内存态 consent — 默认全 false；只能由 setUserConsent 修改
// ─────────────────────────────────────────────────────────────────────────────

let _consent: TelemetryConsent = { ...DEFAULT_CONSENT }

export function getConsent(): TelemetryConsent {
  return { ...DEFAULT_CONSENT, ..._consent }
}

/**
 * 用户显式同意接口。仅当 enabled=true 且某子项=true 时，对应类别才允许写 audit log。
 * 即使全开，当前阶段也不会发起任何外部 HTTP — 仅写本地 audit log。
 */
export function setUserConsent(consent: Partial<TelemetryConsent>): TelemetryConsent {
  _consent = { ...DEFAULT_CONSENT, ..._consent, ...consent }
  return getConsent()
}

/** 测试用 — 重置到默认禁用态 */
export function __resetConsentForTesting(): void {
  _consent = { ...DEFAULT_CONSENT }
}

// ─────────────────────────────────────────────────────────────────────────────
// 上传守门 — 当前永远返回 false（v2.0+ 实装时再开放）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 是否允许向远程发送 telemetry。
 * 当前阶段（v2.25.x）**永远返回 false**，不论 consent 如何 —— 因为 0 telemetry 实装。
 * v2.0+ 才会接入实际上传，且需 consent.enabled === true && ENV PANDA_TELEMETRY_UPLOAD === '1' 双确认。
 */
export function isUploadAllowed(): boolean {
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// 本地 audit log — 仅当 consent 对应子项开启时才写；写失败静默
// ─────────────────────────────────────────────────────────────────────────────

function writeAuditLog(line: string): void {
  try {
    // 懒加载 fs，避免测试在未 mock ENV 前就触发文件系统访问
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs')
    const path = getAuditLogPath()
    const dir = path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')))
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(path, line + '\n', { encoding: 'utf8' })
  } catch {
    // 静默 — telemetry 失败绝不影响主流程
  }
}

function buildEvent(event: string, props?: Record<string, unknown>): TelemetryEvent {
  return {
    event,
    props: props ? { ...props } : undefined,
    ts: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — track / captureException
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 通用事件埋点。当前阶段：
 *   - 默认（consent.usageMetrics=false）→ 完全 no-op
 *   - consent.usageMetrics=true → 仅写本地 audit log，不上传
 */
export function track(event: string, props?: Record<string, unknown>): void {
  const c = getConsent()
  if (!c.enabled || !c.usageMetrics) return // no-op fast path
  const evt = buildEvent(event, props)
  writeAuditLog(JSON.stringify({ kind: 'track', ...evt }))
  // why: 此处绝不调用 fetch/https — 本 stub 阶段唯一动作就是落盘
}

/**
 * 异常捕获。当前阶段：
 *   - 默认（consent.crashReport=false）→ 完全 no-op
 *   - consent.crashReport=true → 仅写本地 audit log，不上传
 */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  const c = getConsent()
  if (!c.enabled || !c.crashReport) return
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack ?? '' : ''
  const evt = buildEvent('exception', {
    message,
    stack: stack.replace(/\r?\n\s*/g, ' | '), // 单行化，便于排查
    ...(context ? { context } : {}),
  })
  writeAuditLog(JSON.stringify({ kind: 'exception', ...evt }))
}

/** 命名空间汇总，便于 main/renderer/bridge 统一引用 */
export const telemetry = {
  track,
  captureException,
  setUserConsent,
  getConsent,
  isUploadAllowed,
  getAuditLogPath,
}

// 测试 / 诊断辅助
export const __internals = {
  getConfigHomeDir,
  buildEvent,
  DEFAULT_CONSENT,
}
