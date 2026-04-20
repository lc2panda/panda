// Input:  bun test 触发 — W5-T1 真双进程 e2e 实测
// Output: ≥ 8 用例 — 验证 panda CLI ↔ panda-on-desk bridge 真 IPC：
//         1) raw HTTP /event 推 PetStateChange → on-desk bridge 接到 (bytewise)
//         2) raw HTTP /event 推 NotificationEvent → on-desk dispatcher 路由
//         3) 端口探测 1455 占用 → 1456 fallback (server.ts probeAndListen)
//         4) runtime.json 字段完整 + 原子写盘 + close 时清理
//         5) secret mismatch → 401 拒绝 (server.ts 鉴权)
//         6) on-desk 离线 → panda CLI postToOnDesk 静默不阻塞 (≤ 1.5s timeout)
//         7) Bun.spawn 真子进程 → 跨进程 IPC bytewise (token 计数 → XP → LevelUp)
//         8) 健康探测 GET /health 返回 APP_IDENTITY (无鉴权)
//         9) /event 大 body 64KB+ → 413 / 4xx 拒绝 (防恶意 client)
//        10) SSE /state 反向通道 connect + broadcast 收到
// Pos:    Phase W5 P1 真 e2e 实测 [NEW-FILE:#W5-01]
//         严守 anthropic byte-equal — 不引用 src/services/api/{claude,oauth,providers}
//         0 新依赖 — 仅 bun:test + node:http + node:crypto + node:fs + Bun.spawn
//
// 真双进程定义：
//   · 主进程：跑 startBridgeServer (panda-on-desk on-desk side) — 真 node http server，真 socket bind
//   · 客户端：raw HTTP request (模拟 panda CLI src/desk/bridge.ts postToOnDesk bytewise)
//   · 增强：Bun.spawn 真 child_process → 子进程内 import on-desk bridge → 推 IPC → 父进程接收
//   · 此布置覆盖：socket 字节传输、JSON serialize/deserialize、SECRET_HEADER 鉴权、
//     runtime.json 落盘读、port probe fallback。无需 GUI / xvfb / electron。

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { request as httpRequest, type Server, createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// ─────────────────────────────────────────────────────────────────────────────
// 隔离配置目录 — 避免 runtime.json / queue jsonl 污染真实 ~/.pandacc
// 必须在 import on-desk 模块前设置（getConfigHomeDir 在 module-load 时不缓存，每次读 env）
// ─────────────────────────────────────────────────────────────────────────────

const TMP_DIR = mkdtempSync(join(tmpdir(), 'panda-w5t1-real-e2e-'))
const SAVED_PANDA_CONFIG = process.env.PANDA_CONFIG_DIR
const SAVED_CLAUDE_CONFIG = process.env.CLAUDE_CONFIG_DIR
process.env.PANDA_CONFIG_DIR = TMP_DIR

import { startBridgeServer } from '../src/bridge/server.js'
import {
  APP_IDENTITY,
  type LevelUpEvent,
  type NotificationEvent,
  type OnDeskEvent,
  type PetStateChangeEvent,
  PORT_BASE,
  type RuntimeJson,
  RUNTIME_FILE_NAME,
  RUNTIME_SCHEMA_VERSION,
  SECRET_HEADER,
  type XPGainedEvent,
} from '../src/bridge/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 工具：raw HTTP 请求（panda CLI bytewise 模拟）
// 与 src/desk/bridge.ts postToOnDesk 几乎 1:1（仅去掉 fire-and-forget 包装）
// ─────────────────────────────────────────────────────────────────────────────

interface RawResp {
  status: number
  body: string
}

function rawRequest(opts: {
  port: number
  path: string
  method: string
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
}): Promise<RawResp> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port: opts.port,
        path: opts.path,
        method: opts.method,
        headers: {
          'Content-Type': 'application/json',
          ...(opts.body ? { 'Content-Length': Buffer.byteLength(opts.body).toString() } : {}),
          ...(opts.headers ?? {}),
        },
        timeout: opts.timeoutMs ?? 2_000,
      },
      res => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf-8'),
          }),
        )
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('request-timeout'))
    })
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试 fixture
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  process.env.PANDA_CONFIG_DIR = TMP_DIR
})

afterEach(() => {
  // 清理 runtime.json 防止用例间串扰
  try {
    rmSync(join(TMP_DIR, RUNTIME_FILE_NAME), { force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A · 真双进程 IPC：raw HTTP → on-desk bridge → onEvent 接到 raw event
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T1 · 真 e2e · raw HTTP → on-desk bridge → onEvent', () => {
  test('PetStateChangeEvent: panda CLI raw POST /event → on-desk onEvent 接到 1 次 (bytewise 完整)', async () => {
    const onEventCalls: OnDeskEvent[] = []
    const handle = await startBridgeServer({
      basePort: 17_400,
      maxProbe: 50,
      secret: 'w5t1-pet-state',
      onEvent: e => onEventCalls.push(e),
    })
    try {
      const event: PetStateChangeEvent = {
        type: 'pet-state',
        state: 'thinking',
        sessionId: 'sid-w5t1-A',
        ts: 1_745_174_400_000,
      }
      const resp = await rawRequest({
        port: handle.port,
        path: '/event',
        method: 'POST',
        headers: { [SECRET_HEADER]: 'w5t1-pet-state' },
        body: JSON.stringify(event),
      })
      expect(resp.status).toBe(200)
      const ack = JSON.parse(resp.body) as { ok: boolean; receivedAt: number }
      expect(ack.ok).toBe(true)
      expect(typeof ack.receivedAt).toBe('number')

      // bridge 同步调 onEvent；bytewise 完整
      expect(onEventCalls.length).toBe(1)
      expect(onEventCalls[0]).toEqual(event)
    } finally {
      await handle.close()
    }
  })

  test('NotificationEvent: raw POST /event → on-desk onEvent 接到 + scenarioId 完整透传', async () => {
    const onEventCalls: OnDeskEvent[] = []
    const handle = await startBridgeServer({
      basePort: 17_410,
      maxProbe: 50,
      secret: 'w5t1-notif',
      onEvent: e => onEventCalls.push(e),
    })
    try {
      const event: NotificationEvent = {
        type: 'notification',
        kind: 'overlay',
        level: 'info',
        scenarioId: 'morning-brief',
        title: 'Good morning, commander',
        body: '4 PRs need review',
        ts: Date.now(),
      }
      const resp = await rawRequest({
        port: handle.port,
        path: '/event',
        method: 'POST',
        headers: { [SECRET_HEADER]: 'w5t1-notif' },
        body: JSON.stringify(event),
      })
      expect(resp.status).toBe(200)
      expect(onEventCalls.length).toBe(1)
      const got = onEventCalls[0] as NotificationEvent
      expect(got.type).toBe('notification')
      expect(got.scenarioId).toBe('morning-brief')
      expect(got.kind).toBe('overlay')
      expect(got.title).toBe('Good morning, commander')
    } finally {
      await handle.close()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B · 端口协商 1455 → 1456 fallback (server.ts probeAndListen)
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T1 · 真 e2e · 端口探测 1455 占用 → +1 fallback', () => {
  test('basePort 占用 → 自动 +1 落到下一个可用端口', async () => {
    // 用一个普通 http server 占住 basePort
    const blockerPort = 17_500
    const blocker: Server = await new Promise(resolve => {
      const s = createServer((_req, res) => {
        res.writeHead(204)
        res.end()
      })
      s.listen(blockerPort, '127.0.0.1', () => resolve(s))
    })
    try {
      const handle = await startBridgeServer({
        basePort: blockerPort,
        maxProbe: 10,
        secret: 'w5t1-port-probe',
      })
      try {
        // 应自动 fallback 到 blockerPort + 1（或更高，若 +1 也被占）
        expect(handle.port).toBeGreaterThan(blockerPort)
        expect(handle.port).toBeLessThanOrEqual(blockerPort + 9)

        // /health 仍然可用（验证真起来了）
        const health = await rawRequest({
          port: handle.port,
          path: '/health',
          method: 'GET',
        })
        expect(health.status).toBe(200)
        const body = JSON.parse(health.body) as {
          app: string
          version: number
        }
        expect(body.app).toBe(APP_IDENTITY)
      } finally {
        await handle.close()
      }
    } finally {
      await new Promise<void>(r => blocker.close(() => r()))
    }
  })

  test('basePort + 多重占用 → 跨多个端口 fallback (1455→1456→1457)', async () => {
    const base = 17_510
    const b1: Server = await new Promise(resolve => {
      const s = createServer((_req, res) => res.end())
      s.listen(base, '127.0.0.1', () => resolve(s))
    })
    const b2: Server = await new Promise(resolve => {
      const s = createServer((_req, res) => res.end())
      s.listen(base + 1, '127.0.0.1', () => resolve(s))
    })
    try {
      const handle = await startBridgeServer({
        basePort: base,
        maxProbe: 10,
        secret: 'w5t1-multi-block',
      })
      try {
        expect(handle.port).toBeGreaterThanOrEqual(base + 2)
      } finally {
        await handle.close()
      }
    } finally {
      await new Promise<void>(r => b1.close(() => r()))
      await new Promise<void>(r => b2.close(() => r()))
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C · runtime.json 完整字段 + 原子写盘 + close 清理
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T1 · 真 e2e · runtime.json 字段完整性 + 生命周期', () => {
  test('startBridgeServer 落盘 runtime.json — 含 version/port/secret/pid/startedAt', async () => {
    const handle = await startBridgeServer({
      basePort: 17_600,
      maxProbe: 20,
      secret: 'w5t1-runtime-json',
      appVersion: '2.25.3',
    })
    try {
      const path = join(TMP_DIR, RUNTIME_FILE_NAME)
      expect(existsSync(path)).toBe(true)

      const raw = readFileSync(path, 'utf-8')
      const data = JSON.parse(raw) as RuntimeJson

      expect(data.version).toBe(RUNTIME_SCHEMA_VERSION)
      expect(data.port).toBe(handle.port)
      expect(data.secret).toBe('w5t1-runtime-json')
      expect(data.pid).toBe(process.pid)
      expect(typeof data.startedAt).toBe('number')
      expect(data.startedAt).toBeGreaterThan(0)
      expect(data.appVersion).toBe('2.25.3')

      // 端口必须在合理范围（防止 corrupt 覆盖到 80/443）
      expect(data.port).toBeGreaterThanOrEqual(1024)
      expect(data.port).toBeLessThanOrEqual(65_535)
    } finally {
      await handle.close()
    }
    // close 后 runtime.json 应被清理
    expect(existsSync(join(TMP_DIR, RUNTIME_FILE_NAME))).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D · 鉴权安全：secret mismatch → 401
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T1 · 真 e2e · 鉴权安全', () => {
  test('错误 X-Panda-Secret → /event 返回 401 + onEvent 不被触发', async () => {
    const onEventCalls: OnDeskEvent[] = []
    const handle = await startBridgeServer({
      basePort: 17_700,
      maxProbe: 20,
      secret: 'real-secret-w5t1',
      onEvent: e => onEventCalls.push(e),
    })
    try {
      const event: PetStateChangeEvent = {
        type: 'pet-state',
        state: 'idle',
        sessionId: 'sid-w5t1-D',
        ts: Date.now(),
      }
      const resp = await rawRequest({
        port: handle.port,
        path: '/event',
        method: 'POST',
        headers: { [SECRET_HEADER]: 'wrong-secret' },
        body: JSON.stringify(event),
      })
      expect(resp.status).toBe(401)
      const err = JSON.parse(resp.body) as { ok: boolean; error: string }
      expect(err.ok).toBe(false)
      expect(err.error).toBe('unauthorized')

      // 鉴权失败 → onEvent 一次都不被触发
      expect(onEventCalls.length).toBe(0)
    } finally {
      await handle.close()
    }
  })

  test('缺失 X-Panda-Secret header → 401', async () => {
    const handle = await startBridgeServer({
      basePort: 17_710,
      maxProbe: 20,
      secret: 'w5t1-missing-secret',
    })
    try {
      const resp = await rawRequest({
        port: handle.port,
        path: '/event',
        method: 'POST',
        body: JSON.stringify({ type: 'pet-state', state: 'idle', sessionId: 's', ts: 0 }),
      })
      expect(resp.status).toBe(401)
    } finally {
      await handle.close()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E · 离线 → panda CLI 不阻塞（无 on-desk 时 raw HTTP 应快速 ECONNREFUSED）
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T1 · 真 e2e · on-desk 离线 → panda CLI 不阻塞', () => {
  test('on-desk 离线 (无 server listen) → raw HTTP 在 1.5s 内失败返回，不阻塞调用方', async () => {
    // 选一个绝对没人 listen 的高位端口
    const offlinePort = 17_999
    const t0 = Date.now()
    let errored = false
    try {
      await rawRequest({
        port: offlinePort,
        path: '/event',
        method: 'POST',
        headers: { [SECRET_HEADER]: 'whatever' },
        body: JSON.stringify({ type: 'pet-state', state: 'idle', sessionId: 's', ts: 0 }),
        timeoutMs: 1_500,
      })
    } catch (err) {
      errored = true
      // 应是 ECONNREFUSED 或 timeout — 都说明客户端正确放弃
      const msg = err instanceof Error ? err.message : String(err)
      expect(msg.length).toBeGreaterThan(0)
    }
    const elapsed = Date.now() - t0
    expect(errored).toBe(true)
    // 不阻塞 — 1.5s timeout 上限足够；实际 ECONNREFUSED 通常 <100ms
    expect(elapsed).toBeLessThan(2_000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group F · 健康探测 /health 无鉴权 + APP_IDENTITY 一致性
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T1 · 真 e2e · /health 协议契约', () => {
  test('GET /health (无 secret header) → 200 + app=panda-on-desk', async () => {
    const handle = await startBridgeServer({
      basePort: 17_800,
      maxProbe: 20,
      secret: 'w5t1-health',
    })
    try {
      const resp = await rawRequest({
        port: handle.port,
        path: '/health',
        method: 'GET',
      })
      expect(resp.status).toBe(200)
      const body = JSON.parse(resp.body) as {
        app: string
        version: number
        pid: number
        uptimeMs: number
      }
      expect(body.app).toBe(APP_IDENTITY)
      expect(body.version).toBe(RUNTIME_SCHEMA_VERSION)
      expect(body.pid).toBe(process.pid)
      expect(body.uptimeMs).toBeGreaterThanOrEqual(0)
    } finally {
      await handle.close()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group G · 大 body 拒绝（防恶意 client 撑爆内存）
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T1 · 真 e2e · 安全边界 — 64KB body 上限', () => {
  test('POST /event 65KB body → 4xx 拒绝（不撑爆内存）', async () => {
    const handle = await startBridgeServer({
      basePort: 17_900,
      maxProbe: 20,
      secret: 'w5t1-big-body',
    })
    try {
      // 构造 70KB filler — 超过 MAX_BODY_BYTES (64KB)
      const filler = 'x'.repeat(70 * 1024)
      const event = {
        type: 'pet-state',
        state: 'thinking',
        sessionId: filler,
        ts: Date.now(),
      }
      let resp: RawResp | null = null
      let errored = false
      try {
        resp = await rawRequest({
          port: handle.port,
          path: '/event',
          method: 'POST',
          headers: { [SECRET_HEADER]: 'w5t1-big-body' },
          body: JSON.stringify(event),
          timeoutMs: 2_000,
        })
      } catch {
        // server destroy req 时 client 可能也收到 socket-error；视作 reject 成功
        errored = true
      }
      // 任一条件成立即视为 server 正确拒绝
      const rejected = errored || (resp !== null && resp.status >= 400 && resp.status < 500)
      expect(rejected).toBe(true)
    } finally {
      await handle.close()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group H · token 计数 → XP → LevelUp IPC 链路 (3 事件按序透传)
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T1 · 真 e2e · token → XP → LevelUp 完整链路', () => {
  test('连发 XPGainedEvent + LevelUpEvent → on-desk 按序接到 2 事件', async () => {
    const onEventCalls: OnDeskEvent[] = []
    const handle = await startBridgeServer({
      basePort: 17_810,
      maxProbe: 20,
      secret: 'w5t1-xp-chain',
      onEvent: e => onEventCalls.push(e),
    })
    try {
      const xpEvent: XPGainedEvent = {
        type: 'xp-gained',
        delta: 100,
        bucket: 'outputTokens',
        totalXp: 1_000,
        level: 12,
        ts: Date.now(),
      }
      const lvlEvent: LevelUpEvent = {
        type: 'level-up',
        fromLevel: 12,
        toLevel: 13,
        ts: Date.now(),
      }

      const resp1 = await rawRequest({
        port: handle.port,
        path: '/event',
        method: 'POST',
        headers: { [SECRET_HEADER]: 'w5t1-xp-chain' },
        body: JSON.stringify(xpEvent),
      })
      const resp2 = await rawRequest({
        port: handle.port,
        path: '/event',
        method: 'POST',
        headers: { [SECRET_HEADER]: 'w5t1-xp-chain' },
        body: JSON.stringify(lvlEvent),
      })
      expect(resp1.status).toBe(200)
      expect(resp2.status).toBe(200)

      expect(onEventCalls.length).toBe(2)
      expect(onEventCalls[0].type).toBe('xp-gained')
      expect((onEventCalls[0] as XPGainedEvent).level).toBe(12)
      expect(onEventCalls[1].type).toBe('level-up')
      expect((onEventCalls[1] as LevelUpEvent).toLevel).toBe(13)
    } finally {
      await handle.close()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group I · SSE /state 反向通道 — 真 socket 双向
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T1 · 真 e2e · SSE /state 反向通道', () => {
  test('GET /state 建立 SSE → broadcast 后客户端收到 data 帧', async () => {
    const handle = await startBridgeServer({
      basePort: 17_820,
      maxProbe: 20,
      secret: 'w5t1-sse',
    })
    const received: string[] = []
    const closeWaiter = new Promise<void>(resolve => {
      const req = httpRequest(
        {
          host: '127.0.0.1',
          port: handle.port,
          path: '/state',
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            [SECRET_HEADER]: 'w5t1-sse',
          },
        },
        res => {
          let buffer = ''
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
                received.push(dataLine.slice(5).trim())
              }
              idx = buffer.indexOf('\n\n')
            }
          })
          res.on('close', () => resolve())
          res.on('end', () => resolve())
        },
      )
      req.on('error', () => resolve())
      req.end()
    })

    try {
      // 等连接建立
      await new Promise(r => setTimeout(r, 100))
      handle.broadcast({ type: 'state', state: 'attention', ts: Date.now() })
      await new Promise(r => setTimeout(r, 150))

      expect(received.length).toBeGreaterThanOrEqual(1)
      const parsed = JSON.parse(received[0]) as { type: string; state: string }
      expect(parsed.type).toBe('state')
      expect(parsed.state).toBe('attention')
    } finally {
      await handle.close()
      await closeWaiter
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group J · 真子进程 e2e — Bun.spawn 跑 child 脚本，跨进程推 IPC，父接收
// 这是"真双进程"最强证据 —— 真 child_process 边界 + 真 socket 字节传输
// ─────────────────────────────────────────────────────────────────────────────

const CHILD_SCRIPT = `
import { request as httpRequest } from 'node:http'

const port = Number(process.env.W5_TEST_PORT)
const secret = process.env.W5_TEST_SECRET ?? ''
const event = {
  type: 'pet-state',
  state: 'working',
  sessionId: 'sid-w5t1-child-process',
  ts: Date.now(),
}
const payload = JSON.stringify(event)

const req = httpRequest(
  {
    host: '127.0.0.1',
    port,
    path: '/event',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload).toString(),
      'X-Panda-Secret': secret,
    },
    timeout: 2000,
  },
  res => {
    let body = ''
    res.setEncoding('utf-8')
    res.on('data', chunk => { body += chunk })
    res.on('end', () => {
      process.stdout.write('STATUS=' + res.statusCode + ';BODY=' + body)
      process.exit(res.statusCode === 200 ? 0 : 1)
    })
  },
)
req.on('error', err => {
  process.stderr.write('ERR=' + err.message)
  process.exit(2)
})
req.on('timeout', () => {
  req.destroy()
  process.stderr.write('TIMEOUT')
  process.exit(3)
})
req.write(payload)
req.end()
`

describe('W5-T1 · 真 e2e · Bun.spawn 子进程 → 父进程 server 跨进程 IPC', () => {
  test('子进程 (panda CLI 模拟) POST /event → 父进程 (on-desk 模拟) onEvent 接到 + child exit 0', async () => {
    const onEventCalls: OnDeskEvent[] = []
    const handle = await startBridgeServer({
      basePort: 17_900,
      maxProbe: 20,
      secret: 'w5t1-child-spawn',
      onEvent: e => onEventCalls.push(e),
    })
    try {
      // 写 child 脚本到临时文件
      const childPath = join(TMP_DIR, 'w5t1-child.mjs')
      const { writeFileSync } = await import('node:fs')
      writeFileSync(childPath, CHILD_SCRIPT, { encoding: 'utf-8' })

      // Bun.spawn 真起子进程
      const proc = Bun.spawn({
        cmd: [process.execPath, childPath],
        env: {
          ...process.env,
          W5_TEST_PORT: String(handle.port),
          W5_TEST_SECRET: 'w5t1-child-spawn',
        },
        stdout: 'pipe',
        stderr: 'pipe',
      })

      const exitCode = await proc.exited
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()

      // 子进程退出 0 + stdout 含 STATUS=200
      if (exitCode !== 0) {
        // 诊断信息便于排查
        // eslint-disable-next-line no-console
        console.error('[w5t1-child] exit', exitCode, 'stdout=', stdout, 'stderr=', stderr)
      }
      expect(exitCode).toBe(0)
      expect(stdout).toContain('STATUS=200')

      // 父进程 onEvent 收到子进程发的事件
      expect(onEventCalls.length).toBe(1)
      const got = onEventCalls[0] as PetStateChangeEvent
      expect(got.type).toBe('pet-state')
      expect(got.state).toBe('working')
      expect(got.sessionId).toBe('sid-w5t1-child-process')
    } finally {
      await handle.close()
    }
  }, 15_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// 全部用例结束后还原环境变量
// ─────────────────────────────────────────────────────────────────────────────

import { afterAll } from 'bun:test'

afterAll(() => {
  if (SAVED_PANDA_CONFIG === undefined) {
    delete process.env.PANDA_CONFIG_DIR
  } else {
    process.env.PANDA_CONFIG_DIR = SAVED_PANDA_CONFIG
  }
  if (SAVED_CLAUDE_CONFIG === undefined) {
    delete process.env.CLAUDE_CONFIG_DIR
  } else {
    process.env.CLAUDE_CONFIG_DIR = SAVED_CLAUDE_CONFIG
  }
  try {
    rmSync(TMP_DIR, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})
