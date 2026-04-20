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

import { spawn } from 'node:child_process'
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
}

export interface InstallOptions {
  /** 显式覆盖 panda-on-desk 子包目录（测试注入用） */
  deskDir?: string
  /** 进度/日志回调（默认 no-op；CLI handler 会传入打印到 stderr 的函数） */
  onLog?: (line: string) => void
  /** 自定义 npm 可执行（测试注入用，默认 'npm' 走 PATH） */
  npmCmd?: string
  /** 子进程超时 ms（默认 1800000 = 30 分钟，electron 80MB 下载兜底；
   *  v2.25.18 由 600s 提到 1800s — Mac 实测 600s 不够慢网络场景。
   *  ENV PANDA_DESK_INSTALL_TIMEOUT_MS 可覆盖） */
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

    // 创建 stage 目录（隔离主仓 workspace:* 解析）
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
      })
      return
    }

    const npmCmd = opts.npmCmd ?? 'npm'
    // v2.25.18: 默认从 600s 提到 1800s（30min），允许 ENV 覆盖
    // why: Mac 实测 600s 不够 electron 80MB 下载在慢网络场景
    const envTimeout = Number(process.env.PANDA_DESK_INSTALL_TIMEOUT_MS)
    const timeoutMs = opts.timeoutMs ?? (Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : 1_800_000)
    // why --no-package-lock: stage 是一次性目录，无需 lock；省一次 IO
    // why --omit=dev: 与原 --production 等价的现代 npm 写法
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

    let child
    try {
      // why shell:true — Windows 下 npm 实际是 npm.cmd，spawn 需 shell 兜底；
      //   POSIX shell:true 不影响 PATH 解析
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
      cleanupStage(stage)
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
        cleanupStage(stage)
        resolve({
          ok: false,
          code,
          durationMs,
          message: `npm install 超时（${Math.round(timeoutMs / 1000)}s）— 网络太慢；可设 PANDA_DESK_INSTALL_TIMEOUT_MS=3600000（1h）后重试`,
        })
        return
      }
      if (code !== 0) {
        cleanupStage(stage)
        resolve({
          ok: false,
          code,
          durationMs,
          message: `npm install 失败（exit ${code}）— 检查网络/代理/权限后重试`,
        })
        return
      }
      // npm 成功 → 把 stage/node_modules/* 搬迁到 deskDir/node_modules/
      log('[panda-desk] npm install 成功，搬迁 node_modules → 子包')
      const moveResult = __moveNodeModulesForTesting(stage, deskDir)
      cleanupStage(stage)
      if (moveResult.errors.length > 0) {
        for (const err of moveResult.errors) log(`[panda-desk] mv 错误: ${err}`)
        resolve({
          ok: false,
          code,
          durationMs,
          message: `安装完成但搬迁失败（${moveResult.errors.length} 个错误）：${moveResult.errors[0]}`,
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

  _installInFlight = promise
  // 完成后释放 in-flight 锁，允许下次重试
  promise.finally(() => {
    _installInFlight = null
  })
  return promise
}
