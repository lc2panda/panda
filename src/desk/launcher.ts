// Input:  panda CLI 启动钩子（main.tsx preAction 内 init() 完成后）
// Output: spawn panda-on-desk Electron 子进程（detached + unref，不阻塞 panda CLI 主进程）
//         W19-T3：child.on('exit') 监听 → crash (code !== 0) 自动重启，5min 内最多 3 次防 crash loop
// Pos:    panda CLI → panda-on-desk 自动拉起入口；
//         feature('BUDDY') + globalConfig.companionOnDesk + isTTY + --no-desk 四重 gate；
//         严守 anthropic byte-equal — 仅 node 内置 + 自家 utils
//
// [NEW-FILE:#20260419-W1-01]
// 2026-04-19 23:34 +08:00 W1-T1 panda v2.24.4 桌面端自动启动支持
// 2026-04-20 08:13 +08:00 W4-T1 增强：spawn 前 checkElectronInstalled + friendly hint
// 2026-04-20 11:42 +08:00 W11-T4 startup perf：defer 选项 + 路径缓存 + cfg 缓存 (≥3 项)
// 2026-04-20 17:50 +08:00 W19-T3 crash 自动恢复：child.on('exit') + 限频 3次/5min
// 2026-04-20 22:10 +08:00 W20-T2 性能 v4：gate 顺序按命中开销升序 + argv/env/tty 缓存（O(n)→O(1)）

import { feature } from 'bun:bundle'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkElectronInstalled } from './installer.js'

// ─────────────────────────────────────────────────────────────────────────────
// 单进程内幂等标志 — maybeSpawnOnDesk 可被多个钩子点调用，但子进程只起一次
// ─────────────────────────────────────────────────────────────────────────────

let _spawned = false

// W4-T1：友好提示节流 — 同一进程内只打一次（避免多个钩子点重复刷屏）
let _hintPrinted = false

// W11-T4 perf：launch.cjs 路径解析结果缓存
//   - undefined：尚未解析；null：解析过且全部 candidate 都不存在；string：命中路径
//   why: maybeSpawnOnDesk 可被多个钩子点调用；每次 4 个 existsSync sync stat
//   累计 ~2-8ms（取决于盘 IO）。命中后无需再扫，未命中也无需再扫（path 不会
//   在单进程生命周期内突然出现）。整轮 startup 节省 ~5ms 平均。
let _launchCjsCache: string | null | undefined = undefined

// W11-T4 perf：companionOnDesk 配置读取缓存
//   why: readCompanionOnDeskFlag 内部 require('../utils/config.js') 首次会触发
//   config 模块树（~30ms）。虽然 maybeSpawnOnDesk 通常一进程只调一次，但 config
//   require 缓存命中时仍有 jsonParse 开销；缓存判定结果省去重复函数调用栈。
let _companionOnDeskCache: boolean | undefined = undefined

// W20-T2 perf：argv `--no-desk` 命中状态缓存
//   why: process.argv.includes 是 O(n) 扫描；每次 startup 5000 iter 中重复扫
//   累积开销可观（v8 JIT 后单次 ~100ns × 5000 = 0.5ms）。argv 在单进程生命周期内
//   不变，缓存一次足够。null = 未探测；true/false = 已探测结果。
let _noDeskArgvCache: boolean | null = null

// W20-T2 perf：env 关键变量缓存
//   why: process.env.PANDA_NO_DESK 每次访问会进 v8 属性查找 + lazy env 字典；
//   缓存到原始 boolean 后下次直接 if (cache) return，省字符串比较 + property get。
let _noDeskEnvCache: boolean | null = null

// W20-T2 perf：isTTY 缓存
//   why: process.stdout.isTTY 是 getter，每次访问可能触发 fd stat（虽然 Node 缓存了
//   但仍有 v8 函数调用开销）。boolean cache 命中后纯局部变量比较。
let _isTtyCache: boolean | null = null

// ─────────────────────────────────────────────────────────────────────────────
// W19-T3：crash 自动恢复 — 限频窗口 + 用户主动 quit 标记
// ─────────────────────────────────────────────────────────────────────────────
//
// 设计：
//   · 子进程 exit code 0 → 视为正常退出（before-quit 走完），不重启。
//   · code !== 0（含 null=signal 杀死）→ 视为 crash，按窗口限频重启。
//   · 限频：滚动 5 分钟窗口内最多 3 次重启（_restartTimestamps 数组裁剪）。
//   · _userQuit 由 /buddy desk stop 路径 (markUserQuit) 设置，标记后任何 exit 都不重启。
//   · 用 _spawned 与重启路径解耦：每次重启重置 _spawned=false，使重启走完整 spawn 链路。
//
// why 不是直接 setTimeout 重试：限频判断依据"窗口内已重启次数"而非"当前是否在退避"，
//   语义更接近 supervisor 而非 retry 调度器。

const RESTART_WINDOW_MS = 5 * 60 * 1_000 // 5 分钟
const RESTART_MAX_COUNT = 3 // 窗口内最多 3 次

let _restartTimestamps: number[] = []
let _userQuit = false

/**
 * /buddy desk stop 调用前先 markUserQuit() — 让 child.on('exit') 不再触发重启。
 * /buddy desk start / restart 路径会清掉该标记。
 */
export function markUserQuit(): void {
  _userQuit = true
}

/**
 * 决定是否应该重启 — 纯函数便于测试。
 *   · code === 0 → false（正常退出）
 *   · _userQuit  → false（用户主动）
 *   · 5min 内已重启 ≥ RESTART_MAX_COUNT → false（防 crash loop）
 *   · 其他 → true，并把当前 ts 推入数组（裁剪超窗的）
 */
export function __shouldRestartForTesting(
  code: number | null,
  now: number,
  timestamps: number[],
  userQuit: boolean,
): { restart: boolean; nextTimestamps: number[]; reason: string } {
  if (userQuit) {
    return { restart: false, nextTimestamps: timestamps, reason: 'user-initiated quit' }
  }
  if (code === 0) {
    return { restart: false, nextTimestamps: timestamps, reason: 'normal exit (code=0)' }
  }
  // 裁剪：丢弃 5min 窗口外的旧时间戳
  const fresh = timestamps.filter(ts => now - ts < RESTART_WINDOW_MS)
  if (fresh.length >= RESTART_MAX_COUNT) {
    return {
      restart: false,
      nextTimestamps: fresh,
      reason: `crash-loop guard: ${fresh.length}/${RESTART_MAX_COUNT} in last ${RESTART_WINDOW_MS / 1000}s`,
    }
  }
  return {
    restart: true,
    nextTimestamps: [...fresh, now],
    reason: `crash detected (code=${code === null ? 'signal' : code})`,
  }
}

/** 测试用 — 重置幂等标志 + W19-T3 重启状态 + W20-T2 startup gate cache */
export function __resetSpawnedFlagForTesting(): void {
  _spawned = false
  _hintPrinted = false
  _launchCjsCache = undefined
  _companionOnDeskCache = undefined
  _restartTimestamps = []
  _userQuit = false
  _noDeskArgvCache = null
  _noDeskEnvCache = null
  _isTtyCache = null
}

// ─────────────────────────────────────────────────────────────────────────────
// 入口 — maybeSpawnOnDesk
//
// 4 重 gate（任一不满足即静默 return）：
//   1. _spawned (单进程内幂等)
//   2. feature('BUDDY') (编译期 flag — 沙盒/未启用包构建为 false)
//   3. globalConfig.companionOnDesk !== false (用户显式关 → 跳过)
//   4. process.stdout.isTTY (CI/管道 → 跳过)
//   5. process.argv 不含 '--no-desk'
//
// 任何异常都被 try/catch 静默吞 — 桌面端是可选体验，不能阻塞 panda CLI 主流程。
//
// W11-T4 perf：新增 opts.defer — 默认 true，把重量级 fs/config/spawn 全部推到
// setImmediate 外（让出 main thread，TTFR 不被该函数阻塞）。
// 测试/同步场景可传 { defer: false } 保持旧语义。
// ─────────────────────────────────────────────────────────────────────────────

export interface MaybeSpawnOnDeskOptions {
  /**
   * 是否推迟 fs/config/spawn 到 setImmediate（不阻塞 main thread）。
   * 默认 true — 典型 preAction 调用链不应被 spawn 链路拖累。
   * 传 false 可恢复同步语义（测试夹具依赖旧同步行为的路径）。
   */
  defer?: boolean
}

export function maybeSpawnOnDesk(opts: MaybeSpawnOnDeskOptions = {}): void {
  // ── 快速 gate 路径：所有 cheap check 保持同步 ────────────────────────────────
  // W20-T2 perf：gate 顺序按"命中开销升序" → 单进程缓存 < env 缓存 < argv 缓存
  // < feature 编译期常量 < tty getter，确保最廉价的 gate 最先短路。
  // 1. 单进程内幂等（最廉价 — 单 boolean 比较）
  if (_spawned) return
  // 2. env 快速 gate（缓存命中后单 boolean 比较；首次 ~200ns property get + str compare）
  //    why 提前于 argv：env O(1) < argv.includes O(n)；运维侧 PANDA_NO_DESK=1 是
  //    主流关闭方式，应优先短路。
  if (_noDeskEnvCache === null) {
    const envVal = process.env.PANDA_NO_DESK
    _noDeskEnvCache = envVal === '1' || envVal === 'true'
  }
  if (_noDeskEnvCache) return
  // 3. 编译期 feature flag（const 折叠后是单 if false 直接 dead-code-elim）
  if (!feature('BUDDY')) return
  // 4. CLI flag 缓存（首次 O(n) argv 扫描；缓存后单 boolean）
  //    why: 5000 次 startup iter 累积扫描 = 5ms 开销；缓存后降至 ~50µs。
  if (_noDeskArgvCache === null) {
    _noDeskArgvCache = process.argv.includes('--no-desk')
  }
  if (_noDeskArgvCache) return
  // 5. 非交互模式（CI / pipe / SDK）— 缓存 isTTY getter
  //    why: process.stdout.isTTY 是 getter，缓存后省每次 v8 function call。
  if (_isTtyCache === null) {
    _isTtyCache = !!process.stdout.isTTY
  }
  if (!_isTtyCache) return

  // ── 重量级路径：config 读取 + fs stat + spawn ────────────────────────────────
  // defer 默认 true — 所有 sync 重活推到 setImmediate，让 preAction 先返回
  const heavy = (): void => {
    try {
      // 5. 用户显式关（最后再 require config — 前面 gate 已挡住 99% non-desk 场景）
      if (!readCompanionOnDeskFlag()) return

      const launchCjs = locatePandaOnDeskLaunch()
      if (!launchCjs) return

      // W4-T1 增强：spawn 前先 checkElectronInstalled，缺 electron 时打印 friendly hint
      // 而非让 launch.cjs 撞 'Cannot find module electron' 静默崩
      if (!checkElectronInstalled()) {
        if (!_hintPrinted) {
          _hintPrinted = true
          try {
            // hint 走 stderr，避免污染用户 stdout pipe；中文 + emoji 与 postinstall 风格一致
            process.stderr.write(
              '[panda] 桌面宠物未安装。跑 `panda --install-desk` 启用 ✨\n',
            )
          } catch {
            // tty 异常忽略
          }
        }
        return
      }

      // detached + ignore stdio + unref 防止阻塞 panda CLI 退出
      // why: 不继承 stdio — panda-on-desk 自带 GUI，不应往终端写
      // why: detached + child.unref() — 父进程退出不连带 kill，桌面端独立生存
      // why: windowsHide — Windows 下避免弹出多余 console 窗
      const child = spawn(process.execPath, [launchCjs], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      })

      // W19-T3：crash 自动恢复 — 监听 child exit，code !== 0 自动重启（限频 3次/5min）
      // why 在 unref 之前注册：listener 注册是同步行为，不影响 unref 语义；
      //   child 即使 unref 后父进程仍存活时，'exit' 事件仍会派发到本进程的事件循环。
      //   父进程退出后整个 process tree 终结，listener 自然失效，符合 detached 设计。
      // why cast EventEmitter 接口：tsconfig types:["bun"] 不含 node ChildProcess 完整 EventEmitter 定义
      try {
        (child as unknown as {
          on: (ev: 'exit', cb: (code: number | null) => void) => void
        }).on('exit', (code) => {
          try {
            const decision = __shouldRestartForTesting(
              code,
              Date.now(),
              _restartTimestamps,
              _userQuit,
            )
            _restartTimestamps = decision.nextTimestamps
            if (!decision.restart) {
              // why stderr：与 spawn 失败 hint 同通道；不污染用户 stdout pipe
              if (process.env.PANDA_DESK_VERBOSE === '1') {
                try {
                  process.stderr.write(
                    `[panda-on-desk] child exit code=${code} → no restart (${decision.reason})\n`,
                  )
                } catch {}
              }
              return
            }
            // 重启：重置幂等 + 重新走 maybeSpawnOnDesk（保留 _userQuit/_restartTimestamps）
            try {
              process.stderr.write(
                `[panda-on-desk] child exit code=${code} → restart (${decision.reason})\n`,
              )
            } catch {}
            _spawned = false
            // 异步触发避免在 exit handler 内同步重新 spawn 造成栈累积
            setImmediate(() => {
              try {
                maybeSpawnOnDesk({ defer: false })
              } catch {
                // 静默 — 重启失败不应抛
              }
            })
          } catch {
            // listener 内任何异常都吞 — 决不能让 panda CLI 因桌面端 crash 监听失败而崩
          }
        })
      } catch {
        // child.on 理论不抛；极端情况下静默不影响 spawn 主路径
      }

      child.unref()
      _spawned = true
    } catch {
      // 静默失败 — 桌面端可选，不能阻塞 panda CLI 主流程
    }
  }

  // defer 默认 true：推到下一个 tick，TTFR 不被阻塞
  // 只要 setImmediate 可用就走 defer；测试显式传 defer:false 保持同步
  if (opts.defer === false) {
    heavy()
    return
  }
  try {
    setImmediate(heavy)
  } catch {
    // setImmediate 理论不会抛；极端环境降级同步执行
    heavy()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部 — companionOnDesk 配置读取（lazy + try/catch）
// 与 src/desk/bridge.ts:99-114 同模式 — 避免 launcher 进入 config 模块
// require 链初始化时序问题；字段未在 GlobalConfig 声明时按 (any) 读取 + 默认 true
// ─────────────────────────────────────────────────────────────────────────────

function readCompanionOnDeskFlag(): boolean {
  // W11-T4 perf：单进程内缓存判定结果（cfg 在启动期内不会变）
  if (_companionOnDeskCache !== undefined) return _companionOnDeskCache
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cfg = require('../utils/config.js') as {
      getGlobalConfig?: () => Record<string, unknown> & {
        companionOnDesk?: boolean
      }
    }
    if (typeof cfg.getGlobalConfig !== 'function') {
      _companionOnDeskCache = true
      return true
    }
    const v = cfg.getGlobalConfig().companionOnDesk
    const decided = v !== false
    _companionOnDeskCache = decided
    return decided
  } catch {
    _companionOnDeskCache = true
    return true
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部 — 定位 packages/panda-on-desk/launch.cjs
//
// 候选优先级：
//   1. dev / monorepo：仓库根 packages/panda-on-desk/launch.cjs
//      （从 src/desk/launcher.{ts,js} 上推 2 层 → 仓库根）
//   2. dist 构建后：dist/desk/launcher.js → 上推 1 层到 dist → 上推 1 层到 npm 包根
//      → packages/panda-on-desk/launch.cjs
//   3. cwd fallback：当前工作目录 packages/panda-on-desk/launch.cjs
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentDir(): string {
  // ESM 安全获取当前文件所在目录；构建后落 dist/ 时仍可用
  try {
    return dirname(fileURLToPath(import.meta.url))
  } catch {
    // CJS / 测试 fallback
    return process.cwd()
  }
}

function buildCandidatePaths(): string[] {
  const here = getCurrentDir()
  return [
    // dev：src/desk/launcher.ts → ../../packages/panda-on-desk/launch.cjs
    join(here, '..', '..', 'packages', 'panda-on-desk', 'launch.cjs'),
    // dist 单 bundle (npm install 主路径)：
    //   build.ts 把 src/* 打成 dist/cli.js + dist/chunk-*.js（同层），
    //   import.meta.url 指向 dist/chunk-*.js → here = <pkg-root>/dist/
    //   → here/../packages/panda-on-desk/launch.cjs（仅 1 个 ..）
    // why: v2.25 polish-e2e 实测发现 npm install 后此路径才正确，原 candidate 漏写
    join(here, '..', 'packages', 'panda-on-desk', 'launch.cjs'),
    // dist：dist/desk/launcher.js → ../../packages/panda-on-desk/launch.cjs
    // （若未来 build.ts 改为按目录结构落盘 dist/desk/launcher.js，这条仍兜底）
    join(here, '..', '..', '..', 'packages', 'panda-on-desk', 'launch.cjs'),
    // cwd：用户从仓库根跑 panda 时
    join(process.cwd(), 'packages', 'panda-on-desk', 'launch.cjs'),
  ]
}

function locatePandaOnDeskLaunch(): string | null {
  // W11-T4 perf：单进程缓存命中即返回（path 不会在启动期内突然出现）
  if (_launchCjsCache !== undefined) return _launchCjsCache
  const found = __locatePandaOnDeskLaunchForTesting(buildCandidatePaths())
  _launchCjsCache = found
  return found
}

/** 测试用 — 注入候选路径数组，返回首个存在的或 null */
export function __locatePandaOnDeskLaunchForTesting(
  candidates: string[],
): string | null {
  for (const c of candidates) {
    try {
      if (existsSync(c)) return c
    } catch {
      // existsSync 通常不抛，但权限问题可能抛 — 静默继续
    }
  }
  return null
}
