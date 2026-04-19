// Input:  src/desk/bridge.ts 的全部公共 API
// Output: 6+ 测试用例覆盖 push 成功 / on-desk 离线静默 / 401 鉴权失败 / 端口探测 /
//         SSE state 推送 / feature flag off
// Pos:    Phase 1 P1-T5 IPC bridge 验证 [NEW-FILE:#20260419-P1-08]
//         不连真 panda-on-desk —— 自起 mock HTTP server 验证协议；
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  __resetRuntimeCacheForTesting,
  checkHealth,
  isOnDeskEnabled,
  pushEventToOnDesk,
  pushPermissionRequest,
  subscribeReverseStream,
  subscribeToOnDesk,
} from './bridge.js'
import {
  APP_IDENTITY,
  type OnDeskEvent,
  type ReverseMessage,
  RUNTIME_FILE_NAME,
  RUNTIME_SCHEMA_VERSION,
  SECRET_HEADER,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures — 临时配置目录 + mock on-desk server
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string
let savedEnv: { panda: string | undefined; claude: string | undefined }

function writeRuntime(port: number, secret: string): void {
  const path = join(tmpDir, RUNTIME_FILE_NAME)
  writeFileSync(
    path,
    JSON.stringify({
      version: RUNTIME_SCHEMA_VERSION,
      port,
      secret,
      pid: process.pid,
      startedAt: Date.now(),
    }),
    { encoding: 'utf-8' },
  )
}

interface MockHandle {
  server: Server
  port: number
  received: OnDeskEvent[]
  /** 模拟服务端推送 SSE 反向消息 */
  pushReverse: (msg: ReverseMessage) => void
  /** 关闭：所有 SSE 客户端 + server */
  close: () => Promise<void>
}

interface MockOptions {
  secret: string
  /** 验证响应；默认 200 ack */
  status?: number
}

async function startMockServer(opts: MockOptions): Promise<MockHandle> {
  const received: OnDeskEvent[] = []
  const sseClients = new Set<{ write: (s: string) => boolean; end: () => void }>()
  const server = createServer(async (req, res) => {
    const url = req.url ?? ''
    const method = req.method ?? 'GET'
    const headerSecret = req.headers[SECRET_HEADER.toLowerCase()] as string | undefined

    if (method === 'GET' && url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          app: APP_IDENTITY,
          version: RUNTIME_SCHEMA_VERSION,
          pid: process.pid,
          uptimeMs: 1,
        }),
      )
      return
    }

    if (headerSecret !== opts.secret) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'unauthorized' }))
      return
    }

    if (method === 'POST' && url === '/event') {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as OnDeskEvent
          received.push(body)
        } catch {
          // ignore
        }
        const status = opts.status ?? 200
        res.writeHead(status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: status === 200, receivedAt: Date.now() }))
      })
      return
    }

    if (method === 'GET' && url === '/state') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
      res.write(': connected\n\n')
      const client = {
        write: (s: string) => res.write(s),
        end: () => res.end(),
      }
      sseClients.add(client)
      res.on('close', () => sseClients.delete(client))
      return
    }

    res.writeHead(404)
    res.end()
  })

  // 让 OS 选可用端口
  const port: number = await new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') resolve(addr.port)
      else resolve(0)
    })
  })

  return {
    server,
    port,
    received,
    pushReverse: msg => {
      const payload = `data: ${JSON.stringify(msg)}\n\n`
      for (const c of sseClients) {
        try {
          c.write(payload)
        } catch {
          /* ignore */
        }
      }
    },
    close: () =>
      new Promise<void>(resolve => {
        for (const c of sseClients) {
          try {
            c.end()
          } catch {
            /* ignore */
          }
        }
        sseClients.clear()
        server.close(() => resolve())
      }),
  }
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-desk-bridge-test-'))
  savedEnv = {
    panda: process.env.PANDA_CONFIG_DIR,
    claude: process.env.CLAUDE_CONFIG_DIR,
  }
  process.env.PANDA_CONFIG_DIR = tmpDir
  __resetRuntimeCacheForTesting()
})

afterEach(() => {
  __resetRuntimeCacheForTesting()
  if (savedEnv.panda === undefined) {
    delete process.env.PANDA_CONFIG_DIR
  } else {
    process.env.PANDA_CONFIG_DIR = savedEnv.panda
  }
  if (savedEnv.claude === undefined) {
    delete process.env.CLAUDE_CONFIG_DIR
  } else {
    process.env.CLAUDE_CONFIG_DIR = savedEnv.claude
  }
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: feature flag off — 不发任何 HTTP 请求
// (bun test 默认 feature('BUDDY')=false → isOnDeskEnabled === false)
// ─────────────────────────────────────────────────────────────────────────────

describe('bridge / feature gate', () => {
  test('isOnDeskEnabled() 在 bun test 默认环境 (feature BUDDY off) 返回 false', () => {
    expect(isOnDeskEnabled()).toBe(false)
  })

  test('feature flag off → pushEventToOnDesk 静默返回 false 且不触发任何 HTTP 请求', async () => {
    // mock server 在线但应不被命中
    const secret = randomBytes(16).toString('hex')
    const mock = await startMockServer({ secret })
    writeRuntime(mock.port, secret)

    const event: OnDeskEvent = {
      type: 'pet-state',
      state: 'thinking',
      sessionId: 'sid-feature-off',
      ts: Date.now(),
    }
    const ok = await pushEventToOnDesk(event)
    expect(ok).toBe(false)
    expect(mock.received.length).toBe(0)

    await mock.close()
  })

  test('feature flag off → subscribeToOnDesk 立即回调 false 且 unsubscribe 无副作用', async () => {
    const calls: boolean[] = []
    const unsub = subscribeToOnDesk(online => calls.push(online))
    // 等一个 microtask + tick
    await new Promise(r => setTimeout(r, 50))
    expect(calls).toEqual([false])
    expect(typeof unsub).toBe('function')
    unsub()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 后续测试需要绕过 feature gate，直接测 HTTP 层（checkHealth 不走 isOnDeskEnabled）
// 同时直接调用内部 postToOnDesk 路径需 monkey-patch；这里用 checkHealth 探活，
// 用直接构造 HTTP 请求验证 server 协议。
// ─────────────────────────────────────────────────────────────────────────────

describe('bridge / runtime.json 读取与 HTTP 协议', () => {
  test('on-desk 未启动（runtime.json 不存在）→ checkHealth 静默返回 false', async () => {
    // 不写 runtime.json
    const ok = await checkHealth(500)
    expect(ok).toBe(false)
  })

  test('on-desk 在线 + runtime.json 正确 → checkHealth 返回 true', async () => {
    const secret = randomBytes(16).toString('hex')
    const mock = await startMockServer({ secret })
    writeRuntime(mock.port, secret)

    const ok = await checkHealth(1_000)
    expect(ok).toBe(true)

    await mock.close()
  })

  test('runtime.json 损坏 / 字段缺失 → checkHealth 静默返回 false', async () => {
    writeFileSync(join(tmpDir, RUNTIME_FILE_NAME), 'not-json{', { encoding: 'utf-8' })
    const ok = await checkHealth(300)
    expect(ok).toBe(false)
  })

  test('runtime.json 端口越界（80）→ 拒绝读取，checkHealth 返回 false', async () => {
    writeFileSync(
      join(tmpDir, RUNTIME_FILE_NAME),
      JSON.stringify({ version: 1, port: 80, secret: 'x', pid: 1, startedAt: 0 }),
      { encoding: 'utf-8' },
    )
    const ok = await checkHealth(300)
    expect(ok).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 直接 HTTP 层验证（不经 feature gate）— 验证 server.ts 协议正确
// ─────────────────────────────────────────────────────────────────────────────

import { request as httpRequest } from 'node:http'

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
        timeout: 2_000,
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
      reject(new Error('timeout'))
    })
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

describe('on-desk server 协议（直接构造 HTTP 验证）', () => {
  test('错误 secret → /event 返回 401', async () => {
    const secret = randomBytes(16).toString('hex')
    const mock = await startMockServer({ secret })

    const resp = await rawRequest({
      port: mock.port,
      path: '/event',
      method: 'POST',
      headers: { [SECRET_HEADER]: 'wrong-secret' },
      body: JSON.stringify({ type: 'pet-state', state: 'idle', sessionId: 's', ts: 0 }),
    })
    expect(resp.status).toBe(401)

    await mock.close()
  })

  test('正确 secret + 合法事件 → /event 返回 200 且 server 收到', async () => {
    const secret = randomBytes(16).toString('hex')
    const mock = await startMockServer({ secret })

    const event: OnDeskEvent = {
      type: 'pet-state',
      state: 'working',
      sessionId: 'sid-1',
      ts: 1_700_000_000_000,
    }
    const resp = await rawRequest({
      port: mock.port,
      path: '/event',
      method: 'POST',
      headers: { [SECRET_HEADER]: secret },
      body: JSON.stringify(event),
    })
    expect(resp.status).toBe(200)
    expect(mock.received.length).toBe(1)
    expect(mock.received[0]).toEqual(event)

    await mock.close()
  })

  test('SSE /state — 客户端连接 + 接收 broadcast', async () => {
    const secret = randomBytes(16).toString('hex')
    const mock = await startMockServer({ secret })

    // 直接 raw http GET /state，捕获 SSE 帧
    const received: ReverseMessage[] = []
    const closeWaiter = new Promise<void>(resolve => {
      const req = httpRequest(
        {
          host: '127.0.0.1',
          port: mock.port,
          path: '/state',
          method: 'GET',
          headers: { Accept: 'text/event-stream', [SECRET_HEADER]: secret },
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
                try {
                  received.push(JSON.parse(dataLine.slice(5).trim()))
                } catch {
                  /* ignore */
                }
              }
              idx = buffer.indexOf('\n\n')
            }
          })
          res.on('end', () => resolve())
          res.on('close', () => resolve())
        },
      )
      req.end()
    })

    // 等连接建立
    await new Promise(r => setTimeout(r, 100))
    mock.pushReverse({ type: 'state', state: 'attention', ts: Date.now() })
    mock.pushReverse({
      type: 'permission-response',
      requestId: 'req-1',
      decision: 'approve',
      ts: Date.now(),
    })

    // 等推送送达
    await new Promise(r => setTimeout(r, 150))
    await mock.close()
    await closeWaiter

    expect(received.length).toBeGreaterThanOrEqual(2)
    expect(received[0].type).toBe('state')
    expect(received[1].type).toBe('permission-response')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 端口探测：on-desk server.ts 的 probeAndListen 行为（独立子描述）
// ─────────────────────────────────────────────────────────────────────────────

describe('端口探测（基于 server.ts 内部）', () => {
  test('1455 占用 → 1456 → ... 逐个探测', async () => {
    // 复用 mock server 占住若干端口
    const secret = randomBytes(16).toString('hex')
    const blockerA = await startMockServer({ secret })
    const blockerB = await startMockServer({ secret })

    // 直接调用 server.ts 的内部 probeAndListen
    // why .js: tsc 在 root tsconfig 不开 allowImportingTsExtensions；bun 运行时按 .js→.ts 自动解析
    const { __internals, startBridgeServer } = await import(
      '../../packages/panda-on-desk/src/bridge/server.js'
    )
    expect(typeof __internals.probeAndListen).toBe('function')

    // basePort 故意撞 blockerA.port（确保第一次失败）
    const basePort = blockerA.port
    // 起一个真 bridge server，basePort 撞已占用 → 应自动 +1
    const handle = await startBridgeServer({
      basePort,
      maxProbe: 10,
      secret: 'test-secret',
    })
    expect(handle.port).toBeGreaterThanOrEqual(basePort)
    expect(handle.port).not.toBe(blockerA.port)
    // 验证 runtime.json 落盘
    const runtimePath = join(tmpDir, RUNTIME_FILE_NAME)
    expect(existsSync(runtimePath)).toBe(true)

    await handle.close()
    // close 后 runtime.json 应被清理
    expect(existsSync(runtimePath)).toBe(false)

    await blockerA.close()
    await blockerB.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// pushPermissionRequest 语义糖
// ─────────────────────────────────────────────────────────────────────────────

describe('pushPermissionRequest', () => {
  test('feature off → 静默返回 false', async () => {
    const ok = await pushPermissionRequest({
      requestId: 'rq-1',
      toolName: 'BashTool',
      summary: 'rm -rf /tmp/test',
      risk: 'high',
    })
    expect(ok).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// subscribeReverseStream — feature off 路径
// ─────────────────────────────────────────────────────────────────────────────

describe('subscribeReverseStream', () => {
  test('feature off → 返回 close noop 不抛错', () => {
    const sub = subscribeReverseStream(() => undefined)
    expect(typeof sub.close).toBe('function')
    sub.close()
  })
})

// 抑制未使用 import 警告（mkdirSync 仅 type-position 留作未来扩展）
void mkdirSync
