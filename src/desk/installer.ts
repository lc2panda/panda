// Input:  无（lazy 检测 packages/panda-on-desk/node_modules/electron 是否存在 +
//         按需触发 npm install electron@41 etc. 在隔离 tmp 目录内）
// Output: checkElectronInstalled(): boolean — 同步检测 electron 是否已装；
//         installPandaOnDeskDeps(opts?): Promise<InstallResult> — 异步安装并回传
//         {ok, code, durationMs, message}；幂等（已装时不重复装），失败容错（网络断/权限拒）
// Pos:    panda CLI → panda-on-desk 自动启动稳定性闭环：
//         1) src/desk/launcher.ts 在 spawn launch.cjs 前先 checkElectronInstalled()
//         2) panda --install-desk 显式触发 installPandaOnDeskDeps（src/cli/handlers/desk-install.ts）
//         严守 anthropic byte-equal — 仅 node 内置 child_process/fs/path/os
//         + 自家 utils（不引入第三方依赖）
//
// [NEW-FILE:#20260419-W4-01]
// 2026-04-20 08:13 +08:00 W4-T1 panda v2.25.1 桌面端依赖按需安装
// 2026-04-20 14:20 +08:00 P0 hotfix v2.25.16 — 改用临时 stage 目录 npm install
//                          绕开主仓 workspace:* devDeps 触发的 EUNSUPPORTEDPROTOCOL
// 2026-04-20 16:00 +08:00 W23-T1 install UX — 进度解析 / 失败分类 / 自动重试 /
//                          安装后自检（require electron 验证可加载）

import { spawn, spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─────────────────────────────────────────────────────────────────────────────
// 常量 — electron + 其余 panda-on-desk 必装运行依赖
//
// 版本对齐策略（与 packages/panda-on-desk/package.json）：
//   - electron@41          ← 子包 devDependencies（开发期 electron-builder 需要）
//                            生产期通过本列表显式 install 到 node_modules，让 launch.cjs
//                            require('electron') 解析成功；不在 dependencies 是为了
//                            避免 npm install 主仓库时连带拉 electron ~80MB
//   - electron-updater@6.8.3 ← 子包 dependencies
//   - koffi@2.15.2          ← 子包 dependencies
//   - htmlparser2@12        ← 子包 dependencies
//
// 修改此列表必须同步 packages/panda-on-desk/package.json 与 CONTRIBUTING.md §1.2，
// 否则版本漂移导致桌面端启动失败。W9-T2 add regression test 守护版本一致性。
// ─────────────────────────────────────────────────────────────────────────────

/** electron + 其余 panda-on-desk 必装运行依赖（按上方注释策略） */
export const ELECTRON_DEPS: ReadonlyArray<string> = [
  'electron@41',
  'electron-updater@6.8.3',
  'koffi@2.15.2',
  'htmlparser2@12',
] as const

/**
 * 解析 'electron@41' → { name: 'electron', version: '^41.0.0' }
 * 用于 stage package.json dependencies；major-only 版本规范化为 ^X.0.0
 *
 * 为什么不直接传给 npm install <pkg@ver>：
 *   stage 目录中 package.json 才是 npm 解析 deps 的源头；不写 deps 直接
 *   `npm install electron@41` 仍会工作，但写入 deps 后 npm install 默认
 *   只装 deps（更确定性，且未来切 yarn/pnpm 时一致）
 */
export function __parseDepSpecForTesting(spec: string): {
  name: string
  version: string
} {
  const atIdx = spec.lastIndexOf('@')
  if (atIdx <= 0) {
    return { name: spec, version: '*' }
  }
  const name = spec.slice(0, atIdx)
  const raw = spec.slice(atIdx + 1)
  // 已带 ^/~/= 等前缀 → 原样；否则补 ^ 让 npm semver 接受
  const version = /^[\d]/.test(raw) ? `^${raw}` : raw
  return { name, version }
}

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
  /** W23-T1 失败分类：timeout / network / permission / unknown / verify */
  errorKind?: InstallErrorKind
  /** W23-T1 重试次数（0=未重试，1=自动重试一次） */
  retried?: number
  /** W23-T1 自检状态：pass / fail / skipped（未触发） */
  verifyStatus?: 'pass' | 'fail' | 'skipped'
}

/** W23-T1 失败分类枚举，用于 CLI handler 给出对应 hint */
export type InstallErrorKind =
  | 'timeout'
  | 'network'
  | 'permission'
  | 'verify'
  | 'unknown'

/** W23-T1 进度事件载荷 — 由 CLI handler 实时渲染 spinner / percentage / ETA */
export interface InstallProgressEvent {
  /** 阶段：start | downloading | extracting | linking | done | retry | verify */
  phase:
    | 'start'
    | 'downloading'
    | 'extracting'
    | 'linking'
    | 'done'
    | 'retry'
    | 'verify'
  /** 0~100；未知阶段保持 0（spinner only） */
  percent: number
  /** 估计剩余秒数；未知则 -1 */
  etaSeconds: number
  /** 给人看的简短中文描述 */
  label: string
  /** 关联日志行（可选） */
  rawLine?: string
}

export interface InstallOptions {
  /** 显式覆盖 panda-on-desk 子包目录（测试注入用） */
  deskDir?: string
  /** 进度/日志回调（默认 no-op；CLI handler 会传入打印到 stderr 的函数） */
  onLog?: (line: string) => void
  /** W23-T1 进度事件回调（默认 no-op；CLI handler 会渲染 spinner + % + ETA） */
  onProgress?: (event: InstallProgressEvent) => void
  /** 自定义 npm 可执行（测试注入用，默认 'npm' 走 PATH） */
  npmCmd?: string
  /** 子进程超时 ms（默认 1800000 = 30 分钟，electron 80MB 下载兜底；
   *  v2.25.18 由 600s 提到 1800s — Mac 实测 600s 不够慢网络场景。
   *  ENV PANDA_DESK_INSTALL_TIMEOUT_MS 可覆盖） */
  timeoutMs?: number
  /** W23-T1 自动重试次数（默认 1；仅在 timeout / network 失败时触发） */
  maxRetries?: number
  /** W23-T1 是否在安装完成后跑 require('electron') 自检（默认 true） */
  verifyAfterInstall?: boolean
  /** W23-T1 自检子进程超时 ms（默认 10000） */
  verifyTimeoutMs?: number
  /** W23-T1 测试注入：覆盖 node 可执行路径用于自检 spawnSync */
  nodeCmd?: string
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
// W23-T1 失败分类与进度解析 helpers（纯函数 / 易测）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 把任意错误（npm stderr 行 / 子进程 message / Error.message）映射到
 * InstallErrorKind，CLI handler 据此给出对应排查 hint。
 *
 * 关键字依据：
 *   - timeout: 我方注入的超时消息含 "超时"；node ETIMEDOUT/ESOCKETTIMEDOUT
 *   - network: ECONNREFUSED / ECONNRESET / ENOTFOUND / EAI_AGAIN /
 *              proxy / network / registry.npmjs.org
 *   - permission: EACCES / EPERM / EROFS / sudo / Permission denied
 *   - 其余 → unknown
 *
 * 不区分大小写；为空字符串时返回 unknown。
 */
export function __classifyInstallErrorForTesting(
  raw: string | null | undefined,
): InstallErrorKind {
  if (!raw) return 'unknown'
  const s = raw.toLowerCase()
  // timeout 优先（自家注入消息含"超时"）
  if (
    s.includes('超时') ||
    s.includes('timeout') ||
    s.includes('etimedout') ||
    s.includes('esockettimedout')
  ) {
    return 'timeout'
  }
  if (
    s.includes('econnrefused') ||
    s.includes('econnreset') ||
    s.includes('enotfound') ||
    s.includes('eai_again') ||
    s.includes('network') ||
    s.includes('proxy') ||
    s.includes('registry.npmjs') ||
    s.includes('getaddrinfo') ||
    s.includes('socket hang up')
  ) {
    return 'network'
  }
  if (
    s.includes('eacces') ||
    s.includes('eperm') ||
    s.includes('erofs') ||
    s.includes('permission denied') ||
    s.includes('sudo')
  ) {
    return 'permission'
  }
  return 'unknown'
}

/**
 * 解析 npm 输出行 → InstallProgressEvent（或 null 表示无进度信号）。
 *
 * npm 7+ 默认无 progress bar，但常见输出包含可解析阶段：
 *   - "added 142 packages in 23.5s"           → done, 100%
 *   - "removed N packages"                    → linking
 *   - "downloaded N tarballs / fetching ..."  → downloading
 *   - "extract:electron"                       → extracting
 *   - 自家日志 "[panda-desk] 开始安装"          → start
 *
 * 同时支持 "added X packages in Ys" 提取 percentage（已知 deps 总数）：
 *   currentAdded / expectedTotal * 100
 *   expectedTotal 由调用方传入（npm 实测 4 deps 会拉 ~140 子 deps，无法精确）
 *   → 退化为 0% + spinner only 而非给假数字
 */
export function __parseProgressLineForTesting(
  line: string,
): { phase: InstallProgressEvent['phase']; percent: number; label: string } | null {
  const s = line.toLowerCase()
  // npm 8+ 的最终 summary：added X packages in Ys
  const addedMatch = line.match(/added\s+(\d+)\s+packages?\s+in\s+([\d.]+)s/i)
  if (addedMatch) {
    return {
      phase: 'done',
      percent: 100,
      label: `npm 完成（共 ${addedMatch[1]} 包，耗时 ${addedMatch[2]}s）`,
    }
  }
  // fetching / downloading
  if (
    s.includes('downloading') ||
    s.includes('fetching') ||
    s.includes('npm http fetch')
  ) {
    return { phase: 'downloading', percent: 0, label: '下载依赖中' }
  }
  // extract / unpack
  if (s.includes('extract:') || s.includes('extracting')) {
    return { phase: 'extracting', percent: 0, label: '解压依赖中' }
  }
  // electron postinstall（80MB binary 解压）
  if (s.includes('electron') && (s.includes('postinstall') || s.includes('install'))) {
    return { phase: 'extracting', percent: 0, label: '安装 electron 二进制' }
  }
  // npm link / building
  if (s.includes('linking') || s.includes('building')) {
    return { phase: 'linking', percent: 0, label: '链接依赖' }
  }
  return null
}

/**
 * 跑 `node -e "require('electron')"` 验证 electron 真的可加载（非仅文件存在）。
 *
 * 为什么不直接 require：
 *   installer.ts 是 ESM 上下文，require 不可直接用；且子进程隔离能避免
 *   electron native binary 加载副作用污染当前 node 进程。
 *
 * 子进程必须 cwd: deskDir，让 require resolve 走子包 node_modules。
 */
export function __verifyElectronLoadableForTesting(
  deskDir: string,
  opts: { nodeCmd?: string; timeoutMs?: number } = {},
): { ok: boolean; message: string } {
  const nodeCmd = opts.nodeCmd ?? process.execPath ?? 'node'
  const timeoutMs = opts.timeoutMs ?? 10_000
  try {
    const r = spawnSync(
      nodeCmd,
      ['-e', "require('electron'); process.exit(0)"],
      {
        cwd: deskDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: timeoutMs,
        windowsHide: true,
      },
    )
    if (r.error) {
      return {
        ok: false,
        message: `自检 spawn 失败：${r.error.message}（建议 reinstall）`,
      }
    }
    if (r.status === 0) {
      return { ok: true, message: 'electron 可加载（自检通过）' }
    }
    const stderr = (r.stderr?.toString('utf-8') ?? '').slice(0, 200)
    return {
      ok: false,
      message: `自检失败（exit ${r.status}）：${stderr || 'electron require 抛错'}（建议 panda --install-desk 重装）`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, message: `自检异常：${msg}（建议 reinstall）` }
  }
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
// 内部 — 临时 stage 目录工具
//
// P0 hotfix 2026-04-20：原实现直接 cwd: deskDir 跑 npm install，npm 沿 cwd
// 向上扫到主仓 package.json，撞上 9 个 workspace:* devDeps →
// EUNSUPPORTEDPROTOCOL "Unsupported URL Type 'workspace:'"。
//
// 修复策略：
//   1. 在 os.tmpdir() 下创建 pandacc-desk-install-<rand>/ stage 目录
//   2. 写最小 package.json（仅 4 个 deps，无 workspace）+ 空 .npmrc 屏蔽继承
//   3. 在 stage cwd 跑 npm install — 完全脱离主仓上下文
//   4. 把 stage/node_modules/* 搬迁到 deskDir/node_modules/
//   5. 无论成败都清理 stage 目录
//
// 不引入新依赖：仅 node 内置 fs/os/path/child_process。
// ─────────────────────────────────────────────────────────────────────────────

/** 创建 stage tmp 目录，写入最小 package.json + 空 .npmrc。返回 stage 绝对路径。 */
export function __createStageDirForTesting(deps: ReadonlyArray<string>): string {
  const stage = mkdtempSync(join(tmpdir(), 'pandacc-desk-install-'))
  const dependencies: Record<string, string> = {}
  for (const spec of deps) {
    const { name, version } = __parseDepSpecForTesting(spec)
    dependencies[name] = version
  }
  writeFileSync(
    join(stage, 'package.json'),
    JSON.stringify(
      {
        name: 'pandacc-desk-deps-stage',
        version: '0.0.0',
        private: true,
        dependencies,
      },
      null,
      2,
    ),
    'utf-8',
  )
  // 空 .npmrc — 防止 stage 继承主仓 .npmrc 的 workspace 配置；但允许 user-level
  // ~/.npmrc 生效（HTTPS_PROXY / registry 等用户配置）
  // 不设 prefix/store 等 — npm 默认行为已隔离
  writeFileSync(join(stage, '.npmrc'), '', 'utf-8')
  return stage
}

/**
 * 将 stage/node_modules/* 搬迁到 dest/node_modules/。
 * 优先 rename（同盘原子），跨盘失败回退 cp -r + rm -rf。
 *
 * 为什么不直接 rename 整个 node_modules：
 *   deskDir 可能已有 node_modules（如 dev 环境 bun install 产物），
 *   覆盖会丢失子包既有依赖。这里逐 entry 搬迁，仅替换冲突的同名 entry。
 */
export function __moveNodeModulesForTesting(
  stage: string,
  dest: string,
): { moved: number; errors: string[] } {
  const errors: string[] = []
  let moved = 0
  const stageNm = join(stage, 'node_modules')
  const destNm = join(dest, 'node_modules')
  if (!existsSync(stageNm)) {
    errors.push(`stage/node_modules 不存在：${stageNm}`)
    return { moved, errors }
  }
  try {
    mkdirSync(destNm, { recursive: true })
  } catch (e) {
    errors.push(
      `创建目标 node_modules 失败：${e instanceof Error ? e.message : String(e)}`,
    )
    return { moved, errors }
  }
  let entries: string[]
  try {
    entries = readdirSync(stageNm)
  } catch (e) {
    errors.push(
      `读取 stage/node_modules 失败：${e instanceof Error ? e.message : String(e)}`,
    )
    return { moved, errors }
  }
  for (const entry of entries) {
    const src = join(stageNm, entry)
    const tgt = join(destNm, entry)
    try {
      // 已存在同名 → 先删，避免 rename EEXIST（Windows 严格）
      if (existsSync(tgt)) {
        rmSync(tgt, { recursive: true, force: true })
      }
      try {
        renameSync(src, tgt)
      } catch {
        // 跨盘 EXDEV 兜底：cp -r + rm -rf
        cpSync(src, tgt, { recursive: true })
        rmSync(src, { recursive: true, force: true })
      }
      moved++
    } catch (e) {
      errors.push(
        `搬迁 ${entry} 失败：${e instanceof Error ? e.message : String(e)}`,
      )
    }
  }
  return { moved, errors }
}

/** 静默清理 stage 目录（绝不抛） */
function cleanupStage(stage: string): void {
  try {
    rmSync(stage, { recursive: true, force: true })
  } catch {
    // 留给 OS tmp 自动清理
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — installPandaOnDeskDeps
//
// 1) 幂等：已装直接 return ok:true, alreadyInstalled:true
// 2) 并发幂等：进行中复用同一 Promise（避免双 npm install 互锁）
// 3) 容错：spawn 失败、子进程非 0、超时、定位失败 → 全部转 InstallResult，绝不抛
// 4) 跨平台：Windows 用 npm.cmd 自动兜底（spawn shell:true）
// 5) 隔离：在 os.tmpdir() stage 目录跑 npm install，避开主仓 workspace:* 解析
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 内部 — 单次 npm install 子进程闭环（不含重试 / 自检）。
 * 抽离为内部函数让 installPandaOnDeskDeps 主体专注于编排（重试 / 自检 / 锁）。
 */
function _runInstallOnce(params: {
  deskDir: string
  npmCmd: string
  timeoutMs: number
  log: (line: string) => void
  emitProgress: (event: InstallProgressEvent) => void
}): Promise<InstallResult> {
  const { deskDir, npmCmd, timeoutMs, log, emitProgress } = params
  const startedAt = Date.now()
  return new Promise<InstallResult>((resolve) => {
    let stage: string
    try {
      stage = __createStageDirForTesting(ELECTRON_DEPS)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      resolve({
        ok: false,
        code: null,
        durationMs: Date.now() - startedAt,
        message: `创建临时安装目录失败：${msg}（检查 ${tmpdir()} 可写）`,
        errorKind: __classifyInstallErrorForTesting(msg),
      })
      return
    }

    const args = [
      'install',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      '--omit=dev',
    ]

    log(`[panda-desk] 开始安装桌面宠物依赖 (${ELECTRON_DEPS.join(', ')})`)
    log(`[panda-desk] stage=${stage}`)
    log(`[panda-desk] dest=${deskDir}`)
    log(`[panda-desk] cmd=${npmCmd} ${args.join(' ')}`)
    emitProgress({
      phase: 'start',
      percent: 0,
      etaSeconds: -1,
      label: '准备 npm install',
    })

    let child
    try {
      child = spawn(npmCmd, args, {
        cwd: stage,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        windowsHide: true,
      })
    } catch (e) {
      cleanupStage(stage)
      const msg = e instanceof Error ? e.message : String(e)
      resolve({
        ok: false,
        code: null,
        durationMs: Date.now() - startedAt,
        message: `spawn npm 失败：${msg}`,
        errorKind: __classifyInstallErrorForTesting(msg),
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

    // npm stderr 行汇总，用于失败分类（取末尾 200 字够用）
    let stderrTail = ''
    const STDERR_TAIL_MAX = 4000

    // 流式转发 npm 输出 + 进度解析
    const forward = (chunk: Buffer | string, isStderr: boolean) => {
      try {
        const text = typeof chunk === 'string' ? chunk : chunk.toString('utf-8')
        if (isStderr) {
          stderrTail = (stderrTail + text).slice(-STDERR_TAIL_MAX)
        }
        for (const line of text.split(/\r?\n/)) {
          if (line.length === 0) continue
          log(`[npm] ${line}`)
          // 进度解析（无信号则不发事件，避免进度抖动）
          const p = __parseProgressLineForTesting(line)
          if (p) {
            const elapsed = (Date.now() - startedAt) / 1000
            // 简单 ETA：done 时 0；否则按 percent 线性外推（百分比为 0 时 ETA -1）
            const etaSeconds =
              p.percent > 0 && p.percent < 100
                ? Math.max(0, Math.round((elapsed * (100 - p.percent)) / p.percent))
                : p.percent === 100
                  ? 0
                  : -1
            emitProgress({
              phase: p.phase,
              percent: p.percent,
              etaSeconds,
              label: p.label,
              rawLine: line,
            })
          }
        }
      } catch {
        // 编码异常忽略
      }
    }
    child.stdout?.on('data', (c) => forward(c, false))
    child.stderr?.on('data', (c) => forward(c, true))

    child.on('error', (err) => {
      clearTimeout(timeout)
      cleanupStage(stage)
      const msg = err.message
      resolve({
        ok: false,
        code: null,
        durationMs: Date.now() - startedAt,
        message: `npm 子进程错误：${msg}（常见原因：网络断/权限拒/npm 未安装）`,
        errorKind: __classifyInstallErrorForTesting(msg),
      })
    })

    child.on('close', (code) => {
      clearTimeout(timeout)
      const durationMs = Date.now() - startedAt
      if (timedOut) {
        cleanupStage(stage)
        resolve({
          ok: false,
          code,
          durationMs,
          message: `npm install 超时（${Math.round(timeoutMs / 1000)}s）— 网络太慢；可设 PANDA_DESK_INSTALL_TIMEOUT_MS=3600000（1h）后重试`,
          errorKind: 'timeout',
        })
        return
      }
      if (code !== 0) {
        cleanupStage(stage)
        const kind = __classifyInstallErrorForTesting(stderrTail)
        resolve({
          ok: false,
          code,
          durationMs,
          message: `npm install 失败（exit ${code}）— ${stderrTail.split(/\r?\n/).filter(Boolean).slice(-1)[0] || '检查网络/代理/权限后重试'}`,
          errorKind: kind,
        })
        return
      }
      log('[panda-desk] npm install 成功，搬迁 node_modules → 子包')
      emitProgress({
        phase: 'linking',
        percent: 95,
        etaSeconds: 1,
        label: '搬迁 node_modules',
      })
      const moveResult = __moveNodeModulesForTesting(stage, deskDir)
      cleanupStage(stage)
      if (moveResult.errors.length > 0) {
        for (const err of moveResult.errors) log(`[panda-desk] mv 错误: ${err}`)
        const firstErr = moveResult.errors[0]
        resolve({
          ok: false,
          code,
          durationMs,
          message: `安装完成但搬迁失败（${moveResult.errors.length} 个错误）：${firstErr}`,
          errorKind: __classifyInstallErrorForTesting(firstErr),
        })
        return
      }
      if (!checkElectronInstalled(deskDir)) {
        resolve({
          ok: false,
          code,
          durationMs,
          message:
            'npm install 退出 0 + 搬迁完成但未检测到 electron — 可能 deps 解析异常',
          errorKind: 'unknown',
        })
        return
      }
      resolve({
        ok: true,
        code: 0,
        durationMs,
        message: `桌面宠物依赖安装完成（${Math.round(durationMs / 1000)}s，搬迁 ${moveResult.moved} 个 entry）`,
      })
    })
  })
}

export function installPandaOnDeskDeps(
  opts: InstallOptions = {},
): Promise<InstallResult> {
  // 并发幂等
  if (_installInFlight) return _installInFlight

  const startedAt = Date.now()
  const log = opts.onLog ?? (() => {})
  const emitProgress = opts.onProgress ?? (() => {})

  const promise = (async (): Promise<InstallResult> => {
    const deskDir = opts.deskDir ?? locateDeskDir()
    if (!deskDir) {
      return {
        ok: false,
        code: null,
        durationMs: Date.now() - startedAt,
        message: '未找到 packages/panda-on-desk 目录（panda 安装可能不完整）',
        errorKind: 'unknown',
      }
    }

    // 已装 → short-circuit
    if (checkElectronInstalled(deskDir)) {
      return {
        ok: true,
        code: 0,
        durationMs: Date.now() - startedAt,
        message: 'electron 已安装，跳过',
        alreadyInstalled: true,
        verifyStatus: 'skipped',
      }
    }

    const npmCmd = opts.npmCmd ?? 'npm'
    const envTimeout = Number(process.env.PANDA_DESK_INSTALL_TIMEOUT_MS)
    const timeoutMs =
      opts.timeoutMs ??
      (Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : 1_800_000)
    const maxRetries = opts.maxRetries ?? 1

    let result = await _runInstallOnce({
      deskDir,
      npmCmd,
      timeoutMs,
      log,
      emitProgress,
    })
    let retried = 0

    // W23-T1 自动重试：仅 timeout / network 类失败重试 1 次（permission / unknown 不重试）
    while (
      !result.ok &&
      retried < maxRetries &&
      (result.errorKind === 'timeout' || result.errorKind === 'network')
    ) {
      retried++
      log(
        `[panda-desk] 第 ${retried} 次重试（上次失败：${result.errorKind} - ${result.message}）`,
      )
      emitProgress({
        phase: 'retry',
        percent: 0,
        etaSeconds: -1,
        label: `自动重试（第 ${retried} 次，原因：${result.errorKind}）`,
      })
      result = await _runInstallOnce({
        deskDir,
        npmCmd,
        timeoutMs,
        log,
        emitProgress,
      })
    }
    if (retried > 0) {
      result = { ...result, retried }
    }

    // W23-T1 安装后自检：require('electron') 验证可加载
    const verifyAfterInstall = opts.verifyAfterInstall ?? true
    if (result.ok && verifyAfterInstall) {
      emitProgress({
        phase: 'verify',
        percent: 99,
        etaSeconds: 1,
        label: '自检 require(electron)',
      })
      const verify = __verifyElectronLoadableForTesting(deskDir, {
        nodeCmd: opts.nodeCmd,
        timeoutMs: opts.verifyTimeoutMs,
      })
      log(`[panda-desk] 自检：${verify.message}`)
      if (verify.ok) {
        result = { ...result, verifyStatus: 'pass' }
      } else {
        result = {
          ...result,
          ok: false,
          verifyStatus: 'fail',
          errorKind: 'verify',
          message: verify.message,
        }
      }
    } else if (result.ok && !verifyAfterInstall) {
      result = { ...result, verifyStatus: 'skipped' }
    }

    if (result.ok) {
      emitProgress({
        phase: 'done',
        percent: 100,
        etaSeconds: 0,
        label: '安装完成',
      })
    }
    return result
  })()

  _installInFlight = promise
  // 完成后释放 in-flight 锁，允许下次重试
  promise.finally(() => {
    _installInFlight = null
  })
  return promise
}
