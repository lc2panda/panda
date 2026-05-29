// Input: workerId string (从 --daemon-worker <id> 传入，格式 "<kind>/<uuid>")
// Output: 根据 kind 分发到具体 worker 实现，配置 CLAUDE_CODE_SESSION_KIND=daemon-worker 后运行
// Pos: src/daemon/ —— supervisor 所有 worker 进程的分发入口；由 cli.tsx:319-321 fast-path 调用

import { logForDebugging } from '../utils/debug.js'

/**
 * Worker 类型枚举。
 * supervisor 用此枚举决定 spawn 哪个 worker bin / 路由到哪段逻辑。
 */
export type WorkerKind =
  | 'assistant'  // 主 REPL 工作进程（保留，供 agent fleet 模式使用）
  | 'bridge'     // 桥接/远控 worker
  | 'generic'    // 通用占位 worker（开发/测试用）

export interface WorkerRunContext {
  workerId: string
  kind: WorkerKind
  /** worker 启动时刻 */
  startedAt: number
}

/**
 * 解析 workerId 格式 "<kind>/<uuid>" 或仅 "<kind>"。
 * 返回 { kind, uuid }，unknown kind 归为 'generic'。
 */
function parseWorkerId(workerId: string): { kind: WorkerKind; uuid: string } {
  const slash = workerId.indexOf('/')
  const rawKind = slash >= 0 ? workerId.slice(0, slash) : workerId
  const uuid = slash >= 0 ? workerId.slice(slash + 1) : workerId

  const kind: WorkerKind =
    rawKind === 'assistant' || rawKind === 'bridge'
      ? (rawKind as WorkerKind)
      : 'generic'

  return { kind, uuid }
}

/**
 * 每个 worker 启动时执行的通用初始化：
 * - 写 CLAUDE_CODE_SESSION_KIND=daemon-worker（供 PID registry 使用）
 * - 设置标题（debug 可见）
 */
function initWorkerProcess(ctx: WorkerRunContext): void {
  process.env.CLAUDE_CODE_SESSION_KIND = 'daemon-worker'
  process.env.CLAUDE_CODE_DAEMON_WORKER_ID = ctx.workerId
  process.env.CLAUDE_CODE_DAEMON_WORKER_KIND = ctx.kind

  // 更新进程标题方便 ps 可见
  process.title = `panda-daemon-worker[${ctx.kind}]`

  logForDebugging(
    `[daemon-worker:${ctx.workerId}] started kind=${ctx.kind} pid=${process.pid}`,
  )
}

/**
 * 通用 worker：不执行任何业务逻辑，仅保活并响应 SIGTERM。
 * 开发/测试占位，也是 unknown kind 的安全兜底。
 */
async function runGenericWorker(ctx: WorkerRunContext): Promise<void> {
  logForDebugging(`[daemon-worker:${ctx.workerId}] generic worker alive`)

  await new Promise<void>(resolve => {
    const onSignal = (): void => {
      logForDebugging(`[daemon-worker:${ctx.workerId}] generic worker terminating`)
      resolve()
    }
    process.once('SIGTERM', onSignal)
    process.once('SIGINT', onSignal)
  })
}

/**
 * Bridge worker：将来可挂载 bridgeMain 消息通道。
 * 目前作为 skeleton 存在——保活直到 SIGTERM。
 */
async function runBridgeWorker(ctx: WorkerRunContext): Promise<void> {
  logForDebugging(`[daemon-worker:${ctx.workerId}] bridge worker alive`)

  // 将来：const { bridgeMain } = await import('../commands/bridge/index.js')
  //       await bridgeMain([...])
  await new Promise<void>(resolve => {
    const onSignal = (): void => {
      logForDebugging(
        `[daemon-worker:${ctx.workerId}] bridge worker terminating`,
      )
      resolve()
    }
    process.once('SIGTERM', onSignal)
    process.once('SIGINT', onSignal)
  })
}

/**
 * 公开的 worker 分发函数。
 * 由 cli.tsx:319-321 fast-path 调用：
 *   await runDaemonWorker(args[1])  // args[1] = "<kind>/<uuid>"
 */
export async function runDaemonWorker(workerId: string): Promise<void> {
  const { kind, uuid: _uuid } = parseWorkerId(workerId ?? 'generic')

  const ctx: WorkerRunContext = {
    workerId: workerId ?? 'generic',
    kind,
    startedAt: Date.now(),
  }

  initWorkerProcess(ctx)

  try {
    switch (kind) {
      case 'bridge':
        await runBridgeWorker(ctx)
        break
      case 'assistant':
      case 'generic':
      default:
        await runGenericWorker(ctx)
        break
    }
  } catch (err) {
    logForDebugging(
      `[daemon-worker:${ctx.workerId}] unhandled error: ${String(err)}`,
    )
    process.exit(1)
  }

  logForDebugging(`[daemon-worker:${ctx.workerId}] exited cleanly`)
}
