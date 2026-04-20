// Input:  bun test 触发 — 独立验证 src/bridge/server.ts probeAndListen 端口探测
// Output: 4 用例 — 验证 probeAndListen 在常见占用场景下能正确 +1 fallback
//         1) basePort 空 → 直接绑 basePort
//         2) basePort 占 1 个 → fallback +1
//         3) basePort 连占 3 个 → fallback +3
//         4) maxProbe=N 全占 → throw 含可读 port range 错误
// Pos:    Phase W15-T2 fail 扫尾 — 防 e2e-real-process Group B "端口探测" flake 回归
//         严守 anthropic byte-equal — 不引用 src/services/api/{claude,oauth,providers}
//         0 新依赖 — 仅 bun:test + node:net + node:http + 已有 server.ts internals
//
// [NEW-FILE:#W15-T2-01]
//
// 背景：
//   · 2026-04-20 W15-T2 排查 bun test 全量 2 fail（flaky）— 根因为 e2e-real-process.test.ts
//     Group J 与 Group G 共用 basePort 17_900，加上 Windows TIME_WAIT，并发跑 fallback 探测
//     20 个端口全 EADDRINUSE 而 throw。
//   · 此 regression 测试用孤立、稀疏端口范围（19_xxx，全仓 grep 无其他占用）+
//     createServer 直接占位（非 startBridgeServer），确保 probeAndListen 单元行为稳定。

import { afterAll, afterEach, describe, expect, test } from 'bun:test'
import { createServer, type Server } from 'node:http'

import { __internals } from '../src/bridge/server.js'

const { probeAndListen } = __internals

// 隔离区端口段 — 全仓 grep 无其他 test 占用 19_000-19_099
const ISOLATED_BASE = 19_000

// 起一个普通 http server 占位
function blockPort(port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const s = createServer((_req, res) => {
      res.writeHead(204)
      res.end()
    })
    s.once('error', reject)
    s.listen(port, '127.0.0.1', () => resolve(s))
  })
}

function closeServer(s: Server): Promise<void> {
  return new Promise(r => s.close(() => r()))
}

// 跨用例累积的 server 句柄；afterEach 全清防端口泄漏
const trackedServers: Server[] = []

function track<T extends Server>(s: T): T {
  trackedServers.push(s)
  return s
}

afterEach(async () => {
  while (trackedServers.length > 0) {
    const s = trackedServers.pop()
    if (s) {
      try {
        await closeServer(s)
      } catch {
        /* ignore */
      }
    }
  }
})

afterAll(async () => {
  // 给 OS 足够时间释放 fd（Windows TIME_WAIT 通常 2-4 min，但 fd 已 unbind）
  await new Promise(r => setTimeout(r, 50))
})

describe('W15-T2 regression · probeAndListen 端口探测稳定性', () => {
  test('basePort 空 → 直接绑 basePort（i=0 路径）', async () => {
    const base = ISOLATED_BASE
    const server = track(createServer((_req, res) => res.end()))
    const port = await probeAndListen(server, base, 5, '127.0.0.1')
    expect(port).toBe(base)
    expect(server.listening).toBe(true)
  })

  test('basePort 占 1 个 → fallback +1', async () => {
    const base = ISOLATED_BASE + 10
    const blocker = track(await blockPort(base))
    expect(blocker.listening).toBe(true)

    const server = track(createServer((_req, res) => res.end()))
    const port = await probeAndListen(server, base, 5, '127.0.0.1')
    expect(port).toBe(base + 1)
    expect(server.listening).toBe(true)
  })

  test('basePort 连占 3 个 → fallback +3', async () => {
    const base = ISOLATED_BASE + 20
    const b0 = track(await blockPort(base))
    const b1 = track(await blockPort(base + 1))
    const b2 = track(await blockPort(base + 2))
    expect(b0.listening && b1.listening && b2.listening).toBe(true)

    const server = track(createServer((_req, res) => res.end()))
    const port = await probeAndListen(server, base, 8, '127.0.0.1')
    expect(port).toBe(base + 3)
    expect(server.listening).toBe(true)
  })

  test('maxProbe=2 全占 → 抛出含可读 port range 的错误', async () => {
    const base = ISOLATED_BASE + 40
    const b0 = track(await blockPort(base))
    const b1 = track(await blockPort(base + 1))
    expect(b0.listening && b1.listening).toBe(true)

    const server = track(createServer((_req, res) => res.end()))
    let caught: unknown = null
    try {
      await probeAndListen(server, base, 2, '127.0.0.1')
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(Error)
    const msg = (caught as Error).message
    expect(msg).toContain('could not bind any port')
    expect(msg).toContain(String(base))
    expect(msg).toContain(String(base + 1))
  })
})
