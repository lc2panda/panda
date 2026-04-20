// Input:  panda CLI 启动钩子（main.tsx preAction 内 init() 完成后）
// Output: spawn panda-on-desk Electron 子进程（detached + unref，不阻塞 panda CLI 主进程）
// Pos:    panda CLI → panda-on-desk 自动拉起入口；
//         feature('BUDDY') + globalConfig.companionOnDesk + isTTY + --no-desk 四重 gate；
//         严守 anthropic byte-equal — 仅 node 内置 + 自家 utils
//
// [NEW-FILE:#20260419-W1-01]
// 2026-04-19 23:34 +08:00 W1-T1 panda v2.24.4 桌面端自动启动支持
// 2026-04-20 08:13 +08:00 W4-T1 增强：spawn 前 checkElectronInstalled + friendly hint

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

/** 测试用 — 重置幂等标志 */
export function __resetSpawnedFlagForTesting(): void {
  _spawned = false
  _hintPrinted = false
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
// ─────────────────────────────────────────────────────────────────────────────

export function maybeSpawnOnDesk(): void {
  // 1. 单进程内幂等
  if (_spawned) return
  // 2. 编译期 feature flag
  if (!feature('BUDDY')) return
  // 3. CLI flag — 提前 short-circuit，避免后续 require config 链 + sync fs 探测的耗时
  //    (W6-T4 perf polish：CI/sandbox 高频 spawn panda 时此分支命中率高)
  if (process.argv.includes('--no-desk')) return
  // 3b. env 快速 gate — process.env 比 process.argv.includes O(1) vs O(n)，且文档化运维侧关闭方式
  if (process.env.PANDA_NO_DESK === '1' || process.env.PANDA_NO_DESK === 'true') return
  // 4. 非交互模式（CI / pipe / SDK）
  if (!process.stdout.isTTY) return
  // 5. 用户显式关（最后再 require config — 前面 gate 已挡住 99% non-desk 场景）
  if (!readCompanionOnDeskFlag()) return

  try {
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
    child.unref()
    _spawned = true
  } catch {
    // 静默失败 — 桌面端可选，不能阻塞 panda CLI 主流程
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部 — companionOnDesk 配置读取（lazy + try/catch）
// 与 src/desk/bridge.ts:99-114 同模式 — 避免 launcher 进入 config 模块
// require 链初始化时序问题；字段未在 GlobalConfig 声明时按 (any) 读取 + 默认 true
// ─────────────────────────────────────────────────────────────────────────────

function readCompanionOnDeskFlag(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cfg = require('../utils/config.js') as {
      getGlobalConfig?: () => Record<string, unknown> & {
        companionOnDesk?: boolean
      }
    }
    if (typeof cfg.getGlobalConfig !== 'function') return true
    const v = cfg.getGlobalConfig().companionOnDesk
    if (v === false) return false
    return true
  } catch {
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
  return __locatePandaOnDeskLaunchForTesting(buildCandidatePaths())
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
