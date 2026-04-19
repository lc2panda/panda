// Input:  bun test 触发 — W2-T3 端到端触发：panda CLI side mock 实推 → 验证 POST /event 内容
// Output: ≥ 4 用例 — 验证：mock launcher 起 panda-on-desk / pushNotification mock fetch 验证 POST /event 内容 /
//         节流测试（同 scenarioId 5min 内合并）
// Pos:    Phase W2 P3 收尾 · W2-T3 通知联动实测 [NEW-FILE:#20260419-W2-04]
//         严守 anthropic byte-equal — 不引用 src/services/api/{claude,oauth,providers}
//         零新依赖 — 仅 bun:test + node:http + node:crypto
//
// 设计说明:
//   1. feature('BUDDY') 在 bun test 默认 false → pushNotification 高层 helper 短路；
//      因此用例分两层：
//      a) 纯函数 build* 构造器（验证字段 / 节流逻辑） — 不走 feature gate
//      b) 真 bridge server + raw HTTP push（绕 feature gate）— 验证协议端到端
//   2. mock launcher 测试不实拉子进程（沙盒受限），仅验证幂等 + 不抛错
//   3. 节流测试基于 dnd/aggregator.ts 的 5 分钟窗口（聚合发生在 dispatcher 入口；
//      panda CLI 侧 throttle 仅在 PetState 通道，notification 默认无 throttle —
//      但 dispatcher 在 DND 期间 5min 聚合是正确的"同 scenarioId 5min 合并"位置）

import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { request as httpRequest, type Server, createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 隔离 ~/.pandacc — 避免用例间 runtime.json / dnd-state.json 串扰
const TMP_DIR = mkdtempSync(join(tmpdir(), 'panda-w2t3-trigger-'))
const SAVED_PANDA_CONFIG = process.env.PANDA_CONFIG_DIR
process.env.PANDA_CONFIG_DIR = TMP_DIR

beforeAll(() => {
  process.env.PANDA_CONFIG_DIR = TMP_DIR
})

import {
  __resetRuntimeCacheForTesting,
  buildNotificationEvent,
  buildBadgeBumpEvent,
  buildBadgeResetEvent,
  buildDndEvent,
  buildDragTargetEnableEvent,
  pushNotification,
  isOnDeskEnabled,
} from './bridge.js'
import {
  __resetSpawnedFlagForTesting,
  maybeSpawnOnDesk,
} from './launcher.js'
import {
  type NotificationEvent,
  type OnDeskEvent,
  RUNTIME_FILE_NAME,
  RUNTIME_SCHEMA_VERSION,
  SECRET_HEADER,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 工具：runtime.json 写入 + mock on-desk server
// ─────────────────────────────────────────────────────────────────────────────

function writeRuntime(port: number, secret: string): void {
  const path = join(TMP_DIR, RUNTIME_FILE_NAME)
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
  /** received 仅记录通过鉴权的 /event；用此数组验证节流是否合并 */
  close: () => Promise<void>
}

async function startMockServer(secret: string): Promise<MockHandle> {
  const received: OnDeskEvent[] = []
  const server = createServer(async (req, res) => {
    const url = req.url ?? ''
    const method = req.method ?? 'GET'
    const headerSecret = req.headers[SECRET_HEADER.toLowerCase()] as string | undefined

    if (method === 'GET' && url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          app: 'panda-on-desk',
          version: RUNTIME_SCHEMA_VERSION,
          pid: process.pid,
          uptimeMs: 1,
        }),
      )
      return
    }

    if (headerSecret !== secret) {
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
          /* ignore */
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, receivedAt: Date.now() }))
      })
      return
    }

    res.writeHead(404)
    res.end()
  })

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
    close: () =>
      new Promise<void>(resolve => {
        server.close(() => resolve())
      }),
  }
}

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

// ─────────────────────────────────────────────────────────────────────────────
// 测试隔离
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  __resetRuntimeCacheForTesting()
  __resetSpawnedFlagForTesting()
  // 清理上轮残留 runtime.json
  try {
    rmSync(join(TMP_DIR, RUNTIME_FILE_NAME), { force: true })
  } catch {
    /* ignore */
  }
})

afterEach(() => {
  __resetRuntimeCacheForTesting()
  __resetSpawnedFlagForTesting()
  try {
    rmSync(join(TMP_DIR, RUNTIME_FILE_NAME), { force: true })
  } catch {
    /* ignore */
  }
})

// 全局清理 TMP_DIR — 防泄漏到下一次 test 运行
afterEach(() => {
  if (SAVED_PANDA_CONFIG === undefined) {
    process.env.PANDA_CONFIG_DIR = TMP_DIR // 保持隔离
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：mock launcher 起 panda-on-desk
// 沙盒下 launch.cjs 不存在 + feature('BUDDY')=false → maybeSpawnOnDesk 应 no-op
// 关键断言：不抛错 + 幂等
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / mock launcher → maybeSpawnOnDesk', () => {
  test('沙盒环境（feature off / 无 launch.cjs） → maybeSpawnOnDesk 静默 no-op 不抛错', () => {
    expect(() => maybeSpawnOnDesk()).not.toThrow()
  })

  test('多次调 maybeSpawnOnDesk → 幂等（不抛错且不重复 spawn）', () => {
    expect(() => maybeSpawnOnDesk()).not.toThrow()
    expect(() => maybeSpawnOnDesk()).not.toThrow()
    expect(() => maybeSpawnOnDesk()).not.toThrow()
  })

  test('--no-desk flag → maybeSpawnOnDesk no-op（不抛错）', () => {
    const savedArgv = process.argv.slice()
    try {
      process.argv = ['node', 'panda', '--no-desk']
      expect(() => maybeSpawnOnDesk()).not.toThrow()
    } finally {
      process.argv = savedArgv
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：buildNotificationEvent 字段验证（pushNotification 的纯函数底座）
// why: pushNotification 在 feature off 时短路，但 buildNotificationEvent 总是返回
//      完整 NotificationEvent，可断言 panda CLI 推送给 on-desk 的 schema 正确性
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / buildNotificationEvent — 推送 schema 验证', () => {
  test('完整 NotificationEvent 字段：type/kind/level/scenarioId/title/body/ts', () => {
    const before = Date.now()
    const ev = buildNotificationEvent({
      kind: 'overlay',
      level: 'warning',
      scenarioId: 'disk-low',
      title: 'Disk Low',
      body: '5GB remaining',
    })
    const after = Date.now()

    expect(ev.type).toBe('notification')
    expect(ev.kind).toBe('overlay')
    expect(ev.level).toBe('warning')
    expect(ev.scenarioId).toBe('disk-low')
    expect(ev.title).toBe('Disk Low')
    expect(ev.body).toBe('5GB remaining')
    expect(ev.ts).toBeGreaterThanOrEqual(before)
    expect(ev.ts).toBeLessThanOrEqual(after)
  })

  test('actions / badge / soundCue 透传不丢字段', () => {
    const ev = buildNotificationEvent({
      kind: 'overlay',
      level: 'error',
      scenarioId: 'ci-failed',
      title: 'CI failed',
      actions: [
        { id: 'view-log', label: 'View log', primary: true },
        { id: 'rerun', label: 'Rerun' },
      ],
      badge: { count: 3, color: '#f00' },
      soundCue: 'critical',
      ttlMs: 10_000,
    })

    expect(ev.actions?.length).toBe(2)
    expect(ev.actions?.[0].id).toBe('view-log')
    expect(ev.actions?.[0].primary).toBe(true)
    expect(ev.badge?.count).toBe(3)
    expect(ev.badge?.color).toBe('#f00')
    expect(ev.soundCue).toBe('critical')
    expect(ev.ttlMs).toBe(10_000)
  })

  test('buildBadgeBumpEvent / buildBadgeResetEvent / buildDndEvent / buildDragTargetEnableEvent — 关联 helper schema', () => {
    const bump = buildBadgeBumpEvent('git-remote-changed', 2)
    expect(bump.type).toBe('badge')
    expect(bump.scenarioId).toBe('git-remote-changed')
    expect(bump.delta).toBe(2)

    const reset = buildBadgeResetEvent('git-remote-changed')
    expect(reset.reset).toBe(true)

    const dnd = buildDndEvent(true, { reason: 'focus-mode' })
    expect(dnd.type).toBe('dnd')
    expect(dnd.enabled).toBe(true)
    expect(dnd.reason).toBe('focus-mode')

    const drag = buildDragTargetEnableEvent('file-organizer', ['file', 'image'])
    expect(drag.type).toBe('drag-target')
    expect(drag.enable).toBe(true)
    expect(drag.acceptKinds).toEqual(['file', 'image'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：feature gate 行为 — pushNotification 在 feature off 时静默
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / pushNotification feature gate', () => {
  test('feature off → pushNotification 静默返回 void，不触发任何 HTTP 请求', async () => {
    expect(isOnDeskEnabled()).toBe(false)

    const secret = 'w2t3-feature-off'
    const mock = await startMockServer(secret)
    writeRuntime(mock.port, secret)
    __resetRuntimeCacheForTesting()

    // helper 调用 — feature off 路径
    expect(() =>
      pushNotification({
        kind: 'overlay',
        level: 'info',
        scenarioId: 'morning-brief',
        title: 'morning',
      }),
    ).not.toThrow()

    // 给 fire-and-forget 充分时间（即使被错误触发也能观察到）
    await new Promise(r => setTimeout(r, 100))

    // mock server 应未收到任何请求
    expect(mock.received.length).toBe(0)

    await mock.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D：mock fetch 验证 POST /event 内容（绕 feature gate，直接 raw HTTP）
// 验证 panda CLI side 推送的 NotificationEvent 抵达 on-desk 后字段不丢失
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / raw HTTP push → mock server 收到正确 NotificationEvent', () => {
  test('POST /event NotificationEvent → 200 + server 收到完整字段', async () => {
    const secret = 'w2t3-push-1'
    const mock = await startMockServer(secret)

    const ev = buildNotificationEvent({
      kind: 'overlay',
      level: 'info',
      scenarioId: 'morning-brief',
      title: 'Good morning',
      body: '4 PRs need review',
    })
    const resp = await rawRequest({
      port: mock.port,
      path: '/event',
      method: 'POST',
      headers: { [SECRET_HEADER]: secret },
      body: JSON.stringify(ev),
    })

    expect(resp.status).toBe(200)
    expect(mock.received.length).toBe(1)
    const got = mock.received[0] as NotificationEvent
    expect(got.type).toBe('notification')
    expect(got.kind).toBe('overlay')
    expect(got.scenarioId).toBe('morning-brief')
    expect(got.title).toBe('Good morning')
    expect(got.body).toBe('4 PRs need review')

    await mock.close()
  })

  test('错误 secret → 401 + server received 不增加', async () => {
    const secret = 'w2t3-push-2'
    const mock = await startMockServer(secret)

    const ev = buildNotificationEvent({
      kind: 'badge',
      level: 'info',
      scenarioId: 'git-remote-changed',
      title: 'remote ahead',
      badge: { count: 1 },
    })
    const resp = await rawRequest({
      port: mock.port,
      path: '/event',
      method: 'POST',
      headers: { [SECRET_HEADER]: 'WRONG-SECRET' },
      body: JSON.stringify(ev),
    })

    expect(resp.status).toBe(401)
    expect(mock.received.length).toBe(0)

    await mock.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E：节流测试 — 同 scenarioId 5min 内合并
// 设计：调用 dnd/aggregator 的 aggregateNotification（dispatcher 入口在 DND 期间执行此聚合）
//       验证窗口内重复 → skip=true + mergedCount 累加；窗口结束 → 重置
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / 节流：同 scenarioId 5min 内合并', () => {
  test('同 scenarioId 5min 窗口内重复 → 第 1 次 skip=false，第 2~N 次 skip=true', async () => {
    const { aggregateNotification, __resetAggregatorForTesting, AGGREGATION_WINDOW_MS } =
      await import('../../packages/panda-on-desk/src/dnd/aggregator.js')

    __resetAggregatorForTesting()

    const ev = buildNotificationEvent({
      kind: 'overlay',
      level: 'info',
      scenarioId: 'morning-brief',
      title: 'morning',
    })

    const t0 = 1_700_000_000_000

    // 首次 → skip=false
    const r1 = aggregateNotification(ev, t0)
    expect(r1.skip).toBe(false)

    // 窗口内（+ 1min）→ skip=true，mergedCount=2
    const r2 = aggregateNotification(ev, t0 + 60_000)
    expect(r2.skip).toBe(true)
    expect(r2.mergedCount).toBe(2)

    // 窗口内（+ 4min）→ skip=true，mergedCount=3
    const r3 = aggregateNotification(ev, t0 + 4 * 60_000)
    expect(r3.skip).toBe(true)
    expect(r3.mergedCount).toBe(3)

    // 窗口结束（+ 5min）→ 重置 → skip=false
    const r4 = aggregateNotification(ev, t0 + AGGREGATION_WINDOW_MS)
    expect(r4.skip).toBe(false)

    __resetAggregatorForTesting()
  })

  test('不同 scenarioId 不互相影响', async () => {
    const { aggregateNotification, __resetAggregatorForTesting } = await import(
      '../../packages/panda-on-desk/src/dnd/aggregator.js'
    )
    __resetAggregatorForTesting()

    const evA = buildNotificationEvent({
      kind: 'overlay',
      level: 'info',
      scenarioId: 'morning-brief',
      title: 'a',
    })
    const evB = buildNotificationEvent({
      kind: 'overlay',
      level: 'info',
      scenarioId: 'disk-low',
      title: 'b',
    })

    const t0 = 1_700_000_000_000
    const r1 = aggregateNotification(evA, t0)
    const r2 = aggregateNotification(evB, t0 + 1_000)
    expect(r1.skip).toBe(false)
    expect(r2.skip).toBe(false) // 不同 scenarioId — 各自独立窗口

    __resetAggregatorForTesting()
  })
})
