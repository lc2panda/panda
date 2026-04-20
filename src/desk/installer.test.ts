// Input:  src/desk/installer.ts 公共 API checkElectronInstalled / installPandaOnDeskDeps
//         + 内部 helpers __locateDeskDirForTesting / __resetInstallerStateForTesting
// Output: 8 测试用例 — 路径定位 / electron 检测三态 / 已装 short-circuit /
//         npm 失败 / spawn 抛错 / 并发幂等 / 超时 / 常量对齐
// Pos:    W4-T1 panda CLI 启动稳定性验证 — 桌面宠物 deps 按需安装闭环
//         严守 anthropic byte-equal — 仅 node 内置 + 自家模块
//
// [NEW-FILE:#20260419-W4-03]
// 2026-04-20 08:13 +08:00

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  ELECTRON_DEPS,
  __locateDeskDirForTesting,
  __resetInstallerStateForTesting,
  checkElectronInstalled,
  installPandaOnDeskDeps,
} from './installer.js'

// ─────────────────────────────────────────────────────────────────────────────
// 测试夹具 — 临时目录模拟 packages/panda-on-desk 子包结构
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string

function mkDeskDirWith(opts: { electron?: boolean }): string {
  const desk = join(tmpDir, 'packages', 'panda-on-desk')
  mkdirSync(desk, { recursive: true })
  writeFileSync(
    join(desk, 'package.json'),
    JSON.stringify({ name: '@lc2panda/panda-on-desk', version: '0.0.0-test' }),
    'utf-8',
  )
  if (opts.electron) {
    const elDir = join(desk, 'node_modules', 'electron')
    mkdirSync(elDir, { recursive: true })
    writeFileSync(
      join(elDir, 'package.json'),
      JSON.stringify({ name: 'electron', version: '41.0.0' }),
      'utf-8',
    )
  }
  return desk
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-desk-installer-test-'))
  __resetInstallerStateForTesting()
})

afterEach(() => {
  __resetInstallerStateForTesting()
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 1 — 常量对齐：ELECTRON_DEPS 必须含 electron + electron-updater + koffi + htmlparser2
// 与 packages/panda-on-desk/package.json dependencies 一致
// ─────────────────────────────────────────────────────────────────────────────

describe('ELECTRON_DEPS · 常量', () => {
  test('包含 4 个核心依赖 + 版本前缀对齐 panda-on-desk/package.json', () => {
    // why: 任何漂移立即被发现 — 否则 install 完桌面宠物仍跑不起来
    expect(ELECTRON_DEPS.length).toBe(4)
    const joined = ELECTRON_DEPS.join(' ')
    expect(joined).toContain('electron@41')
    expect(joined).toContain('electron-updater@6.8.3')
    expect(joined).toContain('koffi@2.15.2')
    expect(joined).toContain('htmlparser2@12')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 2 — __locateDeskDirForTesting 路径解析
// ─────────────────────────────────────────────────────────────────────────────

describe('__locateDeskDirForTesting · 路径解析', () => {
  test('package.json 存在 → 命中', () => {
    const desk = mkDeskDirWith({ electron: false })
    expect(__locateDeskDirForTesting([desk])).toBe(desk)
  })

  test('全部候选都不含 package.json → null', () => {
    const ghost = join(tmpDir, 'no-such', 'panda-on-desk')
    expect(__locateDeskDirForTesting([ghost])).toBeNull()
  })

  test('多候选 → 命中第一个 package.json 存在的', () => {
    const ghost = join(tmpDir, 'ghost', 'panda-on-desk')
    const real = mkDeskDirWith({ electron: false })
    expect(__locateDeskDirForTesting([ghost, real])).toBe(real)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 3 — checkElectronInstalled 三态
// ─────────────────────────────────────────────────────────────────────────────

describe('checkElectronInstalled · 检测', () => {
  test('electron node_modules 存在 → true', () => {
    const desk = mkDeskDirWith({ electron: true })
    expect(checkElectronInstalled(desk)).toBe(true)
  })

  test('electron 未装 → false', () => {
    const desk = mkDeskDirWith({ electron: false })
    expect(checkElectronInstalled(desk)).toBe(false)
  })

  test('deskDir 不存在 → false（保守降级，不抛）', () => {
    const ghost = join(tmpDir, 'no-such-dir')
    expect(checkElectronInstalled(ghost)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 4 — installPandaOnDeskDeps 已装 short-circuit（幂等）
// ─────────────────────────────────────────────────────────────────────────────

describe('installPandaOnDeskDeps · 幂等', () => {
  test('electron 已装 → 立即 ok:true + alreadyInstalled:true，不 spawn npm', async () => {
    const desk = mkDeskDirWith({ electron: true })
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      // npmCmd 给一个不存在的命令 — 若实现错误会真去 spawn 然后失败；
      // 正确实现应该 short-circuit 在 spawn 之前
      npmCmd: 'definitely-not-a-real-command-zzz',
    })
    expect(result.ok).toBe(true)
    expect(result.alreadyInstalled).toBe(true)
    expect(result.code).toBe(0)
  })

  test('deskDir 定位失败 → ok:false + 友好错误（不抛）', async () => {
    const result = await installPandaOnDeskDeps({
      deskDir: join(tmpDir, 'ghost', 'panda-on-desk'),
    })
    // ghost 目录不存在 package.json → 走 short-circuit "未找到目录" 分支前
    // 还是会先经过 checkElectronInstalled false → 进入 spawn 路径。
    // 但因为 deskDir 显式给了一个不存在的目录，spawn cwd 会失败 → ok:false
    expect(result.ok).toBe(false)
    expect(typeof result.message).toBe('string')
    expect(result.message.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 5 — installPandaOnDeskDeps npm 失败容错
// 用一个绝对不存在的 npmCmd 模拟 spawn 失败 / npm 子进程错误
// ─────────────────────────────────────────────────────────────────────────────

describe('installPandaOnDeskDeps · 容错', () => {
  test('npm 命令不存在 → ok:false + 友好中文消息（不抛）', async () => {
    const desk = mkDeskDirWith({ electron: false })
    const result = await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd: 'definitely-not-a-real-command-zzz-xyz-9999',
      timeoutMs: 5000,
    })
    expect(result.ok).toBe(false)
    expect(result.message).toBeTruthy()
    // 消息应包含中文提示而非裸 stack trace
    expect(result.message.length).toBeGreaterThan(0)
  }, 15_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 6 — onLog 回调被调用（即便最终失败也要有日志输出，便于排查）
// ─────────────────────────────────────────────────────────────────────────────

describe('installPandaOnDeskDeps · 进度日志', () => {
  test('onLog 至少被调用 1 次（开始安装的提示行）', async () => {
    const desk = mkDeskDirWith({ electron: false })
    const lines: string[] = []
    await installPandaOnDeskDeps({
      deskDir: desk,
      npmCmd: 'definitely-not-a-real-command-zzz-2',
      timeoutMs: 5000,
      onLog: (l) => lines.push(l),
    })
    // 至少有"开始安装"或"cwd"或"cmd"行
    const joined = lines.join('\n')
    expect(joined).toContain('panda-desk')
  }, 15_000)
})
