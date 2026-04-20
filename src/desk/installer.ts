// Input:  无（lazy 检测 packages/panda-on-desk/node_modules/electron 是否存在 +
//         按需触发 npm install --production electron@41 etc. 在子包目录内）
// Output: checkElectronInstalled(): boolean — 同步检测 electron 是否已装；
//         installPandaOnDeskDeps(opts?): Promise<InstallResult> — 异步安装并回传
//         {ok, code, durationMs, message}；幂等（已装时不重复装），失败容错（网络断/权限拒）
// Pos:    panda CLI → panda-on-desk 自动启动稳定性闭环：
//         1) src/desk/launcher.ts 在 spawn launch.cjs 前先 checkElectronInstalled()
//         2) panda --install-desk 显式触发 installPandaOnDeskDeps（src/cli/handlers/desk-install.ts）
//         严守 anthropic byte-equal — 仅 node 内置 child_process/fs/path
//         + 自家 utils（不引入第三方依赖）
//
// [NEW-FILE:#20260419-W4-01]
// 2026-04-20 08:13 +08:00 W4-T1 panda v2.25.1 桌面端依赖按需安装

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─────────────────────────────────────────────────────────────────────────────
// 常量 — electron deps 与 panda-on-desk/package.json 的 dependencies 严格对齐
// 修改此列表必须同步 packages/panda-on-desk/package.json，否则版本漂移
// ─────────────────────────────────────────────────────────────────────────────

/** electron + 其余 panda-on-desk 必装运行依赖（与子包 package.json 对齐） */
export const ELECTRON_DEPS: ReadonlyArray<string> = [
  'electron@41',
  'electron-updater@6.8.3',
  'koffi@2.15.2',
  'htmlparser2@12',
] as const

// ─────────────────────────────────────────────────────────────────────────────
// 单进程内幂等标志 — 多个钩子同时触发安装时只跑一次
// ─────────────────────────────────────────────────────────────────────────────

let _installInFlight: Promise<InstallResult> | null = null

/** 测试用 — 重置 in-flight 锁 */
export function __resetInstallerStateForTesting(): void {
  _installInFlight = null
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共类型
// ─────────────────────────────────────────────────────────────────────────────

export interface InstallResult {
  /** 安装链路最终成功 */
  ok: boolean
  /** npm 子进程 exit code（未 spawn 时为 null） */
  code: number | null
  /** 总耗时（ms，含子进程） */
  durationMs: number
  /** 简短中文消息（成功 / 失败原因） */
  message: string
  /** 是否因为 electron 已装而 short-circuit（幂等命中） */
  alreadyInstalled?: boolean
}

export interface InstallOptions {
  /** 显式覆盖 panda-on-desk 子包目录（测试注入用） */
  deskDir?: string
  /** 进度/日志回调（默认 no-op；CLI handler 会传入打印到 stderr 的函数） */
  onLog?: (line: string) => void
  /** 自定义 npm 可执行（测试注入用，默认 'npm' 走 PATH） */
  npmCmd?: string
  /** 子进程超时 ms（默认 600000 = 10 分钟，electron 80MB 下载兜底） */
  timeoutMs?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部 — 定位 packages/panda-on-desk 目录
//
// 与 launcher.ts buildCandidatePaths 同思路，但这里只关心目录而非 launch.cjs 文件
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentDir(): string {
  try {
    return dirname(fileURLToPath(import.meta.url))
  } catch {
    return process.cwd()
  }
}

function buildDeskDirCandidates(): string[] {
  const here = getCurrentDir()
  return [
    // dev: src/desk/installer.ts → ../../packages/panda-on-desk/
    join(here, '..', '..', 'packages', 'panda-on-desk'),
    // dist 单 bundle: dist/chunk-*.js → ../packages/panda-on-desk/
    join(here, '..', 'packages', 'panda-on-desk'),
    // dist 多目录: dist/desk/installer.js → ../../../packages/panda-on-desk/
    join(here, '..', '..', '..', 'packages', 'panda-on-desk'),
    // cwd 兜底
    join(process.cwd(), 'packages', 'panda-on-desk'),
  ]
}

/** 测试用 — 注入候选目录数组，返回首个 package.json 存在的或 null */
export function __locateDeskDirForTesting(
  candidates: string[],
): string | null {
  for (const c of candidates) {
    try {
      if (existsSync(join(c, 'package.json'))) return c
    } catch {
      // existsSync 罕见抛错（权限）— 继续
    }
  }
  return null
}

function locateDeskDir(): string | null {
  return __locateDeskDirForTesting(buildDeskDirCandidates())
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — checkElectronInstalled
//
// 同步检测 packages/panda-on-desk/node_modules/electron 是否存在。
// 用于 launcher.ts 在 spawn launch.cjs 前快速 gate；任何异常静默 false（保守降级）
// ─────────────────────────────────────────────────────────────────────────────

export function checkElectronInstalled(deskDir?: string): boolean {
  try {
    const dir = deskDir ?? locateDeskDir()
    if (!dir) return false
    // electron 包目录存在即视为已装；不强制 require.resolve（避免触发 native 加载）
    const electronPkg = join(dir, 'node_modules', 'electron', 'package.json')
    return existsSync(electronPkg)
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — installPandaOnDeskDeps
//
// 1) 幂等：已装直接 return ok:true, alreadyInstalled:true
// 2) 并发幂等：进行中复用同一 Promise（避免双 npm install 互锁）
// 3) 容错：spawn 失败、子进程非 0、超时、定位失败 → 全部转 InstallResult，绝不抛
// 4) 跨平台：Windows 用 npm.cmd 自动兜底（spawn shell:true）
// ─────────────────────────────────────────────────────────────────────────────

export function installPandaOnDeskDeps(
  opts: InstallOptions = {},
): Promise<InstallResult> {
  // 并发幂等
  if (_installInFlight) return _installInFlight

  const startedAt = Date.now()
  const log = opts.onLog ?? (() => {})

  const promise = new Promise<InstallResult>((resolve) => {
    const deskDir = opts.deskDir ?? locateDeskDir()
    if (!deskDir) {
      resolve({
        ok: false,
        code: null,
        durationMs: Date.now() - startedAt,
        message: '未找到 packages/panda-on-desk 目录（panda 安装可能不完整）',
      })
      return
    }

    // 已装 → short-circuit
    if (checkElectronInstalled(deskDir)) {
      resolve({
        ok: true,
        code: 0,
        durationMs: Date.now() - startedAt,
        message: 'electron 已安装，跳过',
        alreadyInstalled: true,
      })
      return
    }

    const npmCmd = opts.npmCmd ?? 'npm'
    const timeoutMs = opts.timeoutMs ?? 600_000
    const args = ['install', '--production', '--no-audit', '--no-fund', ...ELECTRON_DEPS]

    log(`[panda-desk] 开始安装桌面宠物依赖 (${ELECTRON_DEPS.join(', ')})`)
    log(`[panda-desk] cwd=${deskDir}`)
    log(`[panda-desk] cmd=${npmCmd} ${args.join(' ')}`)

    let child
    try {
      // why shell:true — Windows 下 npm 实际是 npm.cmd，spawn 需 shell 兜底；
      //   POSIX shell:true 不影响 PATH 解析
      child = spawn(npmCmd, args, {
        cwd: deskDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        windowsHide: true,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      resolve({
        ok: false,
        code: null,
        durationMs: Date.now() - startedAt,
        message: `spawn npm 失败：${msg}`,
      })
      return
    }

    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      try {
        child.kill('SIGKILL')
      } catch {
        // 已退出
      }
    }, timeoutMs)

    // 流式转发 npm 输出到 onLog（按行；避免半行垃圾）
    const forward = (chunk: Buffer | string) => {
      try {
        const text = typeof chunk === 'string' ? chunk : chunk.toString('utf-8')
        for (const line of text.split(/\r?\n/)) {
          if (line.length > 0) log(`[npm] ${line}`)
        }
      } catch {
        // 编码异常忽略
      }
    }
    child.stdout?.on('data', forward)
    child.stderr?.on('data', forward)

    child.on('error', (err) => {
      clearTimeout(timeout)
      resolve({
        ok: false,
        code: null,
        durationMs: Date.now() - startedAt,
        message: `npm 子进程错误：${err.message}（常见原因：网络断/权限拒/npm 未安装）`,
      })
    })

    child.on('close', (code) => {
      clearTimeout(timeout)
      const durationMs = Date.now() - startedAt
      if (timedOut) {
        resolve({
          ok: false,
          code,
          durationMs,
          message: `npm install 超时（${Math.round(timeoutMs / 1000)}s）— 检查网络或代理后重试`,
        })
        return
      }
      if (code === 0 && checkElectronInstalled(deskDir)) {
        resolve({
          ok: true,
          code: 0,
          durationMs,
          message: `桌面宠物依赖安装完成（${Math.round(durationMs / 1000)}s）`,
        })
        return
      }
      resolve({
        ok: false,
        code,
        durationMs,
        message:
          code === 0
            ? 'npm install 退出 0 但未检测到 electron — 可能磁盘满或被 .npmrc 忽略'
            : `npm install 失败（exit ${code}）— 检查网络/代理/权限后重试`,
      })
    })
  })

  _installInFlight = promise
  // 完成后释放 in-flight 锁，允许下次重试
  promise.finally(() => {
    _installInFlight = null
  })
  return promise
}
