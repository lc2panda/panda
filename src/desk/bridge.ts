// Input:  panda CLI 内部信号（PetState / XP / 升级 / 权限请求 / scene / session）
// Output: HTTP POST → http://127.0.0.1:<port>/event（端口/secret 从 ~/.pandacc/runtime.json 读）
// Pos:    panda CLI → panda-on-desk 单向桥（SSE 反向订阅可选）；
//         feature('BUDDY') + companionOnDesk gate；on-desk 离线时静默忽略
//         严守 anthropic byte-equal — 仅 node 内置 http/fs，无 anthropic 通道
//
// [NEW-FILE:#20260419-P1-05]

import { feature } from 'bun:bundle'
import { existsSync, readFileSync } from 'node:fs'
import { request as httpRequest, type IncomingMessage } from 'node:http'
import { join } from 'node:path'

import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
import {
  APP_IDENTITY,
  type OnDeskEvent,
  type PermissionRequestEvent,
  type ReverseMessage,
  type RuntimeJson,
  RUNTIME_FILE_NAME,
  SECRET_HEADER,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// runtime.json 读取（缓存 + invalidate）
// ─────────────────────────────────────────────────────────────────────────────

interface CachedRuntime {
  loadedAt: number
  data: RuntimeJson | null
  /** 用于 cache invalidation 的文件 mtime */
  mtimeMs: number
}

let runtimeCache: CachedRuntime | null = null

/** 缓存 TTL — 1 秒；on-desk 重启时端口可能变 */
const RUNTIME_CACHE_TTL_MS = 1_000

export function __resetRuntimeCacheForTesting(): void {
  runtimeCache = null
}

function getRuntimePath(): string {
  return join(getClaudeConfigHomeDir(), RUNTIME_FILE_NAME)
}

function readRuntime(): RuntimeJson | null {
  const path = getRuntimePath()
  if (!existsSync(path)) return null
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<RuntimeJson>
    if (
      typeof parsed.port !== 'number' ||
      typeof parsed.secret !== 'string' ||
      parsed.secret.length === 0 ||
      typeof parsed.pid !== 'number'
    ) {
      return null
    }
    // why: clamp port to non-privileged range so a corrupt file can't redirect to 80/443
    if (parsed.port < 1024 || parsed.port > 65_535) return null
    return {
      version: parsed.version ?? 1,
      port: parsed.port,
      secret: parsed.secret,
      pid: parsed.pid,
      startedAt: parsed.startedAt ?? 0,
      appVersion: parsed.appVersion,
    }
  } catch {
    return null
  }
}

function getRuntime(): RuntimeJson | null {
  const now = Date.now()
  if (runtimeCache && now - runtimeCache.loadedAt < RUNTIME_CACHE_TTL_MS) {
    return runtimeCache.data
  }
  const data = readRuntime()
  runtimeCache = { loadedAt: now, data, mtimeMs: now }
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// feature gate — feature('BUDDY') + globalConfig.companionOnDesk
// ─────────────────────────────────────────────────────────────────────────────

/** lazy import 避免 bridge.ts 进入 config 模块 require 链初始化时序问题 */
function readCompanionOnDeskFlag(): boolean {
  try {
    // why: dynamic require 不绕开 type system，但避免 CLI 冷启动 import 链
    // companionOnDesk 字段尚未声明在 GlobalConfig，按 (any) 读取 + 默认 true
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cfg = require('../utils/config.js') as {
      getGlobalConfig?: () => Record<string, unknown> & { companionOnDesk?: boolean }
    }
    if (typeof cfg.getGlobalConfig !== 'function') return true
    const v = cfg.getGlobalConfig().companionOnDesk
    if (v === false) return false
    return true
  } catch {
    return true
  }
}

export function isOnDeskEnabled(): boolean {
  if (!feature('BUDDY')) return false
  return readCompanionOnDeskFlag()
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部：HTTP 请求（fire-and-forget；失败静默吞）
// ─────────────────────────────────────────────────────────────────────────────

interface PostResult {
  ok: boolean
  status?: number
  /** 仅诊断/测试用 — 生产路径不暴露 */
  error?: string
}

/** 默认请求超时（ms） — on-desk 卡死时不阻塞 panda CLI 主路径 */
const DEFAULT_REQUEST_TIMEOUT_MS = 1_500

function postToOnDesk(
  pathname: string,
  body: unknown,
  opts: { timeoutMs?: number } = {},
): Promise<PostResult> {
  return new Promise(resolve => {
    const runtime = getRuntime()
    if (!runtime) {
      resolve({ ok: false, error: 'runtime-not-available' })
      return
    }
    let payload: string
    try {
      payload = JSON.stringify(body)
    } catch (err) {
      resolve({
        ok: false,
        error: `serialize-failed:${err instanceof Error ? err.message : String(err)}`,
      })
      return
    }
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port: runtime.port,
        path: pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload).toString(),
          [SECRET_HEADER]: runtime.secret,
        },
        timeout: opts.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      },
      (res: IncomingMessage) => {
        // drain to free socket
        res.resume()
        const status = res.statusCode ?? 0
        if (status === 401 || status === 403) {
          // why: 鉴权失败 → 缓存的 secret 已 stale，强制下次重读 runtime.json
          runtimeCache = null
        }
        resolve({ ok: status >= 200 && status < 300, status })
      },
    )
    req.on('error', err => {
      // ECONNREFUSED / ENOENT → on-desk 未启动；静默
      if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
        runtimeCache = null
      }
      resolve({ ok: false, error: err.message })
    })
    req.on('timeout', () => {
      req.destroy()
      resolve({ ok: false, error: 'timeout' })
    })
    req.write(payload)
    req.end()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 1. push 单事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 推送单个事件给 panda-on-desk。fire-and-forget，永不抛错。
 *
 * 静默路径：feature 关 / config 关 / runtime.json 不存在 / on-desk 离线 / 鉴权失败。
 *
 * @returns Promise<boolean> — 仅供测试观测 ack；调用方无需 await
 */
export async function pushEventToOnDesk(event: OnDeskEvent): Promise<boolean> {
  if (!isOnDeskEnabled()) return false
  try {
    const r = await postToOnDesk('/event', event)
    return r.ok
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 2. 权限气泡
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 弹出权限请求气泡到 panda-on-desk。
 *
 * 与 pushEventToOnDesk 等价但语义更清晰；调用方通常不关心 ack。
 */
export async function pushPermissionRequest(
  req: Omit<PermissionRequestEvent, 'type' | 'ts'>,
): Promise<boolean> {
  return pushEventToOnDesk({ type: 'permission', ts: Date.now(), ...req })
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 3. 在线探测
// ─────────────────────────────────────────────────────────────────────────────

interface SubscribeOptions {
  /** 探测间隔 ms — 默认 5s */
  intervalMs?: number
  /** 仅触发首次 + 每次状态翻转；默认 true */
  onlyOnChange?: boolean
}

/**
 * 订阅 panda-on-desk 是否在线。返回 unsubscribe 函数。
 *
 * 实现：定时 GET /health；on-desk 上线/下线时 callback(true/false)。
 * 若 isOnDeskEnabled() 为 false，立即 callback(false) 并返回 noop。
 */
export function subscribeToOnDesk(
  callback: (online: boolean) => void,
  options: SubscribeOptions = {},
): () => void {
  if (!isOnDeskEnabled()) {
    queueMicrotask(() => callback(false))
    return () => undefined
  }
  const interval = options.intervalMs ?? 5_000
  const onlyOnChange = options.onlyOnChange ?? true
  let stopped = false
  let lastOnline: boolean | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  const tick = async (): Promise<void> => {
    if (stopped) return
    const online = await checkHealth()
    if (!stopped && (!onlyOnChange || lastOnline !== online)) {
      lastOnline = online
      try {
        callback(online)
      } catch {
        // user callback errors must not break subscription
      }
    }
    if (!stopped) {
      timer = setTimeout(tick, interval)
    }
  }

  // 首次立即探测
  void tick()

  return () => {
    stopped = true
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }
}

/** 单次探测 — GET /health；可独立用于 isAvailable() 等场景 */
export function checkHealth(timeoutMs = 1_000): Promise<boolean> {
  return new Promise(resolve => {
    const runtime = getRuntime()
    if (!runtime) {
      resolve(false)
      return
    }
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port: runtime.port,
        path: '/health',
        method: 'GET',
        timeout: timeoutMs,
      },
      (res: IncomingMessage) => {
        if ((res.statusCode ?? 0) !== 200) {
          res.resume()
          resolve(false)
          return
        }
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => {
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as {
              app?: string
            }
            resolve(parsed.app === APP_IDENTITY)
          } catch {
            resolve(false)
          }
        })
      },
    )
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.end()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 4. SSE 反向订阅（desk → CLI）
// ─────────────────────────────────────────────────────────────────────────────

interface ReverseSubscription {
  close(): void
}

/**
 * 订阅 desk 端反向推送（state 镜像 / 权限响应等）。
 *
 * 极简 SSE 客户端 — 不引入 EventSource polyfill，仅按 `data: <json>\n\n` 切分。
 * 断线后调用方需自行重连（当前不内置 retry，避免 panda CLI 主路径开销）。
 */
export function subscribeReverseStream(
  onMessage: (msg: ReverseMessage) => void,
): ReverseSubscription {
  if (!isOnDeskEnabled()) {
    return { close: () => undefined }
  }
  const runtime = getRuntime()
  if (!runtime) {
    return { close: () => undefined }
  }
  const req = httpRequest({
    host: '127.0.0.1',
    port: runtime.port,
    path: '/state',
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      [SECRET_HEADER]: runtime.secret,
    },
  })
  let buffer = ''
  let closed = false
  req.on('response', (res: IncomingMessage) => {
    if ((res.statusCode ?? 0) !== 200) {
      res.resume()
      return
    }
    res.setEncoding('utf-8')
    res.on('data', (chunk: string) => {
      buffer += chunk
      let idx = buffer.indexOf('\n\n')
      while (idx !== -1) {
        const frame = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        const dataLine = frame
          .split('\n')
          .find(line => line.startsWith('data:'))
        if (dataLine) {
          try {
            const msg = JSON.parse(dataLine.slice(5).trim()) as ReverseMessage
            onMessage(msg)
          } catch {
            // skip malformed frame
          }
        }
        idx = buffer.indexOf('\n\n')
      }
    })
  })
  req.on('error', () => {
    // 断线静默；调用方按需重连
  })
  req.end()
  return {
    close: () => {
      if (closed) return
      closed = true
      req.destroy()
    },
  }
}
