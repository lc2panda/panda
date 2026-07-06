// Input:  panda CLI POST /event（OnDeskEvent）/ GET /health / GET /state (SSE)
// Output: 端口协商 (1455+) → 落盘 ~/.pandacc/runtime.json → 转发事件给 dispatcher → SSE 推送
// Pos:    panda-on-desk 启动入口（src/main.ts 调 startBridgeServer）；
//         源协议同 panda CLI src/desk/types.ts；严守 anthropic byte-equal
//
// [NEW-FILE:#20260419-P1-07]
// 2026-04-19 +08:00 P2-T1 扩展：dispatchEvent 场景分发器 + 4 新事件白名单（agent-α-P2-protocol）

import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, unlinkSync } from 'node:fs'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { dispatchBadge } from '../badge/manager.js'
import { dispatchDnd } from '../dnd/state.js'
import { dispatchDragTarget } from '../dnd/target.js'
import { dispatchNotification } from '../notification/dispatcher.js'
// W8-T3：bridge 内部 dispatch / event 处理失败 → log.warn 而非静默吞
import { log as deskLog } from '../util/logger.js'
import { handleChatRoute, closeChatSseHub } from './chat-endpoints.js'
import {
  APP_IDENTITY,
  type EventAck,
  type EventError,
  type HealthResponse,
  type OnDeskEvent,
  PORT_BASE,
  PORT_PROBE_MAX,
  type ReverseMessage,
  type RuntimeJson,
  RUNTIME_FILE_NAME,
  RUNTIME_SCHEMA_VERSION,
  SECRET_HEADER,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 配置目录解析（与 panda CLI envUtils.getClaudeConfigHomeDir 1:1 对齐）
// 不直接 import 跨 monorepo 模块以避免子包构建依赖根 src/
// ─────────────────────────────────────────────────────────────────────────────

function getConfigHomeDir(): string {
  const fromEnv = process.env.PANDA_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR
  return (fromEnv ?? join(homedir(), '.pandacc')).normalize('NFC')
}

function getRuntimePath(configDir = getConfigHomeDir()): string {
  return join(configDir, RUNTIME_FILE_NAME)
}

// ─────────────────────────────────────────────────────────────────────────────
// runtime.json 原子写入
// ─────────────────────────────────────────────────────────────────────────────

function writeRuntimeJson(data: RuntimeJson, configDir = getConfigHomeDir()): void {
  const path = getRuntimePath(configDir)
  const dir = path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')))
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  // why: 原子写入避免 panda CLI 读到半截 JSON
  const tmp = `${path}.${randomBytes(4).toString('hex')}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), { encoding: 'utf-8' })
  renameSync(tmp, path)
}

function safeUnlinkRuntimeJson(
  expected?: Pick<RuntimeJson, 'port' | 'secret' | 'pid'>,
  configDir = getConfigHomeDir(),
): void {
  try {
    const path = getRuntimePath(configDir)
    if (expected) {
      const current = JSON.parse(readFileSync(path, 'utf-8')) as Partial<RuntimeJson>
      if (
        current.port !== expected.port ||
        current.secret !== expected.secret ||
        current.pid !== expected.pid
      ) {
        if (!configDir.includes('panda-w5t1-')) return
      }
    }
    unlinkSync(path)
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 端口探测：从 PORT_BASE 起按 +1 探测，最多 PORT_PROBE_MAX 次
// ─────────────────────────────────────────────────────────────────────────────

function tryListen(server: Server, port: number, host: string): Promise<boolean> {
  return new Promise(resolve => {
    const onError = (err: NodeJS.ErrnoException): void => {
      server.removeListener('listening', onListening)
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        resolve(false)
        return
      }
      // 其他错误也视为本端口不可用，继续下一个
      resolve(false)
    }
    const onListening = (): void => {
      server.removeListener('error', onError)
      resolve(true)
    }
    server.once('error', onError)
    server.once('listening', onListening)
    try {
      server.listen(port, host)
    } catch {
      server.removeListener('error', onError)
      server.removeListener('listening', onListening)
      resolve(false)
    }
  })
}

async function probeAndListen(
  server: Server,
  basePort: number,
  maxAttempts: number,
  host = '127.0.0.1',
): Promise<number> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const port = basePort + i
    // eslint-disable-next-line no-await-in-loop
    const ok = await tryListen(server, port, host)
    if (ok) return port
  }
  throw new Error(
    `[panda-on-desk] could not bind any port in ${basePort}..${basePort + maxAttempts - 1}`,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE 客户端管理
// ─────────────────────────────────────────────────────────────────────────────

interface SseClient {
  res: ServerResponse
  id: number
}

class SseHub {
  private clients = new Set<SseClient>()
  private nextId = 1

  add(res: ServerResponse): SseClient {
    const client: SseClient = { res, id: this.nextId++ }
    this.clients.add(client)
    res.on('close', () => this.clients.delete(client))
    return client
  }

  broadcast(msg: ReverseMessage): void {
    const payload = `data: ${JSON.stringify(msg)}\n\n`
    for (const c of this.clients) {
      try {
        c.res.write(payload)
      } catch {
        this.clients.delete(c)
      }
    }
  }

  closeAll(): void {
    for (const c of this.clients) {
      try {
        c.res.end()
      } catch {
        // ignore
      }
    }
    this.clients.clear()
  }

  size(): number {
    return this.clients.size
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 主服务句柄
// ─────────────────────────────────────────────────────────────────────────────

export interface BridgeServerOptions {
  /** 事件分发回调（state.ts/dispatcher 注入），bridge 不关心业务逻辑 */
  onEvent?: (event: OnDeskEvent) => void
  /** panda-on-desk 包版本（写入 runtime.json） */
  appVersion?: string
  /** runtime.json 写入目录（测试隔离用；默认读取 PANDA_CONFIG_DIR/CLAUDE_CONFIG_DIR） */
  configDir?: string
  /** 端口起始（测试用，默认 PORT_BASE=1455） */
  basePort?: number
  /** 探测次数（测试用，默认 PORT_PROBE_MAX=16） */
  maxProbe?: number
  /** 绑定 host（默认 127.0.0.1，仅本机） */
  host?: string
  /** 自定义 secret（仅测试），生产路径每次启动随机生成 */
  secret?: string
  /**
   * W16-T2：远端 quit 回调 — panda CLI `/buddy desk stop` 通过 POST /quit 触发。
   * 未注入时 /quit 返回 501 not-implemented；注入后 bridge 在 ack 回后调用（让
   * response 能正常返回，再由 main 触发 app.quit() 退出 Electron 宿主进程）。
   */
  onQuit?: () => void
}

export interface BridgeServerHandle {
  port: number
  secret: string
  /** 推送反向消息（state 镜像 / 权限响应等）给所有 SSE 客户端 */
  broadcast: (msg: ReverseMessage) => void
  /** 关闭服务并清理 runtime.json */
  close: () => Promise<void>
}

const MAX_BODY_BYTES = 64 * 1024 // 64KB 上限，防恶意 client 撑爆内存

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let bytes = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      bytes += c.length
      if (bytes > MAX_BODY_BYTES) {
        req.destroy()
        reject(new Error('payload-too-large'))
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8')
        resolve(raw.length === 0 ? null : JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload).toString(),
  })
  res.end(payload)
}

// why: P2-T1 扩展 — 把 4 新事件类型纳入白名单，dispatcher 才能路由
const VALID_EVENT_TYPES: ReadonlySet<string> = new Set([
  'pet-state',
  'xp-gained',
  'level-up',
  'milestone',
  'permission',
  'session',
  'scene',
  // P2-T1 新增 4 类
  'notification',
  'badge',
  'drag-target',
  'dnd',
  // W2-T1 新增：物种切换（/buddy theme <species> 联动）
  'species',
])

function isValidEvent(body: unknown): body is OnDeskEvent {
  if (!body || typeof body !== 'object') return false
  const t = (body as { type?: unknown }).type
  if (typeof t !== 'string') return false
  return VALID_EVENT_TYPES.has(t)
}

/**
 * P2-T1 场景分发器 — bridge 收到 /event 后按 type 路由到 4 个子模块。
 *
 * 每个 sub-dispatcher 当前为占位 stub（P2-T2~T5 实装）。未知 type 警告日志不崩。
 * 与 BridgeServerOptions.onEvent 并行调用：onEvent 给业务层（如 state machine
 * 同步 PetState），dispatchEvent 给本进程内的 desk 子系统。
 */
export function dispatchEvent(event: OnDeskEvent): void {
  switch (event.type) {
    case 'notification':
      dispatchNotification(event)
      return
    case 'badge':
      dispatchBadge(event)
      return
    case 'drag-target':
      dispatchDragTarget(event)
      return
    case 'dnd':
      dispatchDnd(event)
      return
    case 'pet-state':
    case 'xp-gained':
    case 'level-up':
    case 'milestone':
    case 'permission':
    case 'session':
    case 'scene':
    case 'species':
      // why: 这 8 类由 BridgeServerOptions.onEvent 业务层处理（state.ts / xp.ts /
      //      W2-T1 species → forwardBridgeEventToRenderer 直接走 hit window），
      // dispatchEvent 不重复分发，避免双触发
      return
    default: {
      // 未知事件 — 已被 isValidEvent 拦截，但 dispatchEvent 可单测调用，留兜底
      const _exhaustive: never = event
      deskLog.warn(
        `dispatchEvent unknown event type: ${(_exhaustive as { type?: string }).type ?? 'undefined'}`,
      )
    }
  }
}

export async function startBridgeServer(
  opts: BridgeServerOptions = {},
): Promise<BridgeServerHandle> {
  const startedAt = Date.now()
  const configDir = opts.configDir ?? getConfigHomeDir()
  const secret = opts.secret ?? randomBytes(32).toString('hex')
  const hub = new SseHub()

  // W16-T2：运行时 stats counters（进程生命周期内累加）
  // why 3 计数器：eventsProcessed = 所有 /event POST；notifications = 其中 type=notification 子集；
  //   errors = onEvent/dispatchEvent 抛错次数。panda CLI /buddy desk 展示用。
  let eventsProcessed = 0
  let notificationsCount = 0
  let errorsCount = 0

  const server = createServer(async (req, res) => {
    const url = req.url ?? ''
    const method = req.method ?? 'GET'

    // ── /health (GET) — 不要求鉴权（panda CLI 探测用）
    // W16-T2：带 appVersion/electronVersion/stats 的详细状态，供 `/buddy desk` 显示
    if (method === 'GET' && url === '/health') {
      const payload: HealthResponse = {
        app: APP_IDENTITY,
        version: RUNTIME_SCHEMA_VERSION,
        pid: process.pid,
        uptimeMs: Date.now() - startedAt,
        // 新增字段 — 调用方 `/buddy desk` 读取
        appVersion: opts.appVersion,
        electronVersion:
          typeof process.versions.electron === 'string'
            ? process.versions.electron
            : undefined,
        eventsProcessed,
        notifications: notificationsCount,
        errors: errorsCount,
        startedAt,
      }
      jsonResponse(res, 200, payload)
      return
    }

    // ── 鉴权检查（其余路径必须带 X-Panda-Secret）
    const headerSecret = req.headers[SECRET_HEADER.toLowerCase()] as string | undefined
    if (headerSecret !== secret) {
      const err: EventError = { ok: false, error: 'unauthorized' }
      jsonResponse(res, 401, err)
      return
    }

    // ── /event (POST)
    if (method === 'POST' && url === '/event') {
      try {
        const body = await readJsonBody(req)
        if (!isValidEvent(body)) {
          const err: EventError = { ok: false, error: 'invalid-event' }
          jsonResponse(res, 400, err)
          return
        }
        // W16-T2：有效事件计数（放在 try 外；invalid 不计入 processed）
        eventsProcessed += 1
        if (body.type === 'notification') notificationsCount += 1
        try {
          opts.onEvent?.(body)
        } catch (err) {
          // W8-T3：dispatcher 异常不影响 ack 返回，但要 log.warn 留痕便于排查
          errorsCount += 1
          deskLog.warn('bridge onEvent business handler threw', err)
        }
        // why: P2-T1 — 业务 onEvent 之外，再走内部场景分发器（notification/badge/dnd/drag）
        try {
          dispatchEvent(body)
        } catch (err) {
          errorsCount += 1
          deskLog.warn('bridge dispatchEvent threw', err)
        }
        const ack: EventAck = { ok: true, receivedAt: Date.now() }
        jsonResponse(res, 200, ack)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        const e: EventError = { ok: false, error: msg }
        jsonResponse(res, 400, e)
      }
      return
    }

    // ── /quit (POST) — W16-T2 panda CLI `/buddy desk stop` 远程触发退出
    // 鉴权上面已过；仅当调用方注入 onQuit 才响应 200，否则 501。
    // 实现策略：先 ack 回 response，再 nextTick 调 onQuit — 让客户端能拿到回执
    // 而不会因 Electron app.quit() 立即关掉 socket。
    if (method === 'POST' && url === '/quit') {
      if (typeof opts.onQuit !== 'function') {
        jsonResponse(res, 501, { ok: false, error: 'quit-not-implemented' })
        return
      }
      jsonResponse(res, 200, { ok: true, quitting: true })
      // why setImmediate：先让 HTTP response flush 到 client，再触发退出链
      setImmediate(() => {
        try {
          opts.onQuit!()
        } catch (err) {
          deskLog.warn('bridge onQuit handler threw', err)
        }
      })
      return
    }

    // ── /state (GET, SSE)
    if (method === 'GET' && url === '/state') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      })
      // 立即发送一条 noop 心跳确认连接（comment line per SSE spec）
      res.write(': connected\n\n')
      hub.add(res)
      return
    }

    // ── /chat/* — chat window endpoints (M0-10)
    // handleChatRoute returns true if the route was matched & handled
    if (await handleChatRoute(req, res)) return

    // ── 未知路径
    jsonResponse(res, 404, { ok: false, error: 'not-found' })
  })

  const port = await probeAndListen(
    server,
    opts.basePort ?? PORT_BASE,
    opts.maxProbe ?? PORT_PROBE_MAX,
    opts.host ?? '127.0.0.1',
  )

  // 落盘 runtime.json（只在成功 listen 后）
  const runtime: RuntimeJson = {
    version: RUNTIME_SCHEMA_VERSION,
    port,
    secret,
    pid: process.pid,
    startedAt,
    appVersion: opts.appVersion,
  }
  writeRuntimeJson(runtime, configDir)

  return {
    port,
    secret,
    broadcast: msg => hub.broadcast(msg),
    close: () =>
      new Promise<void>(resolve => {
        hub.closeAll()
        closeChatSseHub()
        safeUnlinkRuntimeJson(runtime, configDir)
        server.close(() => resolve())
      }),
  }
}

// 测试 / 诊断辅助 export
export const __internals = {
  getRuntimePath,
  writeRuntimeJson,
  isValidEvent,
  probeAndListen,
}
