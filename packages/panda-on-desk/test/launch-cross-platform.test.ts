// Input: bun test 触发；mock process.platform / 注入 fake spawn / fake require
// Output: 验证 launch.cjs 在 mac/win/linux 三平台 args+env 计算正确，电子缺失走 exit 12，
//         spawn 失败走 exit 12，close code 透传
// Pos: panda-on-desk W13-T2 launch.cjs 跨平台兼容性回归测试
//
// [NEW-FILE:#W13-02]
// 2026-04-20 W13-T2 launch 跨平台 agent · agent-β-W13-launch

import { describe, expect, it } from 'bun:test'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')
const LAUNCH_CJS = path.join(PKG_ROOT, 'launch.cjs')

/**
 * 加载 launch.cjs 取其 module.exports（纯 helper），不触发顶部 spawn。
 * launch.cjs 只在 require.main === module 时执行 main()，require() 安全。
 */
function loadLaunch(): {
  EXIT_ELECTRON_MISSING: number
  computeArgs: (platform: string) => string[]
  computeEnv: (platform: string, baseEnv: NodeJS.ProcessEnv) => NodeJS.ProcessEnv
  tryRequireElectron: (deps: any) => any
  main: (deps: any) => any
} {
  const resolved = require.resolve(LAUNCH_CJS)
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete (require.cache as Record<string, any>)[resolved]
  return require(LAUNCH_CJS)
}

describe('panda-on-desk launch.cjs 跨平台 (W13-T2)', () => {
  // ── 1. computeArgs：linux 加 --no-sandbox，mac/win 不加 ──
  it('computeArgs：linux 携带 --no-sandbox，darwin/win32 仅 "."', () => {
    const launch = loadLaunch()
    expect(launch.computeArgs('linux')).toEqual([
      '.',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ])
    expect(launch.computeArgs('darwin')).toEqual(['.'])
    expect(launch.computeArgs('win32')).toEqual(['.'])
    expect(launch.computeArgs('freebsd')).toEqual(['.']) // 兜底分支
  })

  // ── 2. computeEnv：剥 ELECTRON_RUN_AS_NODE + linux 注入 sandbox 关闭 ──
  it('computeEnv 永远剥 ELECTRON_RUN_AS_NODE，且不 mutate 入参', () => {
    const launch = loadLaunch()
    const baseEnv = {
      PATH: '/usr/bin',
      ELECTRON_RUN_AS_NODE: '1',
      USER: 'commander',
    }
    const out = launch.computeEnv('darwin', baseEnv)
    expect(out.ELECTRON_RUN_AS_NODE).toBeUndefined()
    expect(out.PATH).toBe('/usr/bin')
    expect(out.USER).toBe('commander')
    // 不 mutate 入参（immutable）
    expect(baseEnv.ELECTRON_RUN_AS_NODE).toBe('1')
  })

  it('computeEnv linux 额外注入 ELECTRON_DISABLE_SANDBOX + 清空 CHROME_DEVEL_SANDBOX', () => {
    const launch = loadLaunch()
    const linuxEnv = launch.computeEnv('linux', { ELECTRON_RUN_AS_NODE: '1' })
    expect(linuxEnv.ELECTRON_DISABLE_SANDBOX).toBe('1')
    expect(linuxEnv.CHROME_DEVEL_SANDBOX).toBe('')
    expect(linuxEnv.ELECTRON_RUN_AS_NODE).toBeUndefined()

    // mac/win 不注入 sandbox 相关
    const macEnv = launch.computeEnv('darwin', {})
    expect(macEnv.ELECTRON_DISABLE_SANDBOX).toBeUndefined()
    expect(macEnv.CHROME_DEVEL_SANDBOX).toBeUndefined()

    const winEnv = launch.computeEnv('win32', {})
    expect(winEnv.ELECTRON_DISABLE_SANDBOX).toBeUndefined()
    expect(winEnv.CHROME_DEVEL_SANDBOX).toBeUndefined()
  })

  // ── 3. tryRequireElectron：缺失走 exit 12 + 友好 stderr ──
  it('tryRequireElectron：electron 缺失时打友好提示并 exit(12)', () => {
    const launch = loadLaunch()
    let stderrCaptured = ''
    let exitCalled: number | null = null
    const fakeRequire = (mod: string): unknown => {
      if (mod === 'electron') {
        const err = new Error("Cannot find module 'electron'")
        ;(err as any).code = 'MODULE_NOT_FOUND'
        throw err
      }
      throw new Error('unexpected require: ' + mod)
    }
    const ret = launch.tryRequireElectron({
      requireFn: fakeRequire,
      stderrWrite: (s: string) => {
        stderrCaptured += s
      },
      exitFn: (c: number) => {
        exitCalled = c
      },
    })
    expect(ret).toBeNull()
    expect(exitCalled).toBe(launch.EXIT_ELECTRON_MISSING)
    expect(launch.EXIT_ELECTRON_MISSING).toBe(12)
    expect(stderrCaptured).toContain('electron 未安装')
    expect(stderrCaptured).toContain('panda --install-desk')
  })

  it('tryRequireElectron：electron 已装时返回模块路径字符串（不退出）', () => {
    const launch = loadLaunch()
    let exitCalled = false
    const fakeRequire = (mod: string): unknown => {
      if (mod === 'electron') return '/fake/path/to/electron'
      throw new Error('unexpected: ' + mod)
    }
    const ret = launch.tryRequireElectron({
      requireFn: fakeRequire,
      stderrWrite: () => {},
      exitFn: () => {
        exitCalled = true
      },
    })
    expect(ret).toBe('/fake/path/to/electron')
    expect(exitCalled).toBe(false)
  })

  // ── 4. main：spawn 接收正确 args/env/cwd（三平台） ──
  it('main 在 darwin 平台调用 spawn(electron, ["."], cwd=__dirname, env 剥掉 ELECTRON_RUN_AS_NODE)', () => {
    const launch = loadLaunch()
    let spawnCall: any = null
    const fakeChild = {
      on: (_evt: string, _cb: any) => {},
    }
    launch.main({
      platform: 'darwin',
      baseEnv: { ELECTRON_RUN_AS_NODE: '1', PATH: '/usr/bin' },
      cwd: '/some/cwd',
      requireFn: () => '/fake/electron',
      spawnFn: (bin: string, args: string[], opts: any) => {
        spawnCall = { bin, args, opts }
        return fakeChild
      },
      stderrWrite: () => {},
      exitFn: () => {},
    })
    expect(spawnCall).not.toBeNull()
    expect(spawnCall.bin).toBe('/fake/electron')
    expect(spawnCall.args).toEqual(['.'])
    expect(spawnCall.opts.cwd).toBe('/some/cwd')
    expect(spawnCall.opts.stdio).toBe('inherit')
    expect(spawnCall.opts.env.ELECTRON_RUN_AS_NODE).toBeUndefined()
    expect(spawnCall.opts.env.PATH).toBe('/usr/bin')
  })

  it('main 在 linux 平台带 --no-sandbox + sandbox 关闭 env', () => {
    const launch = loadLaunch()
    let spawnCall: any = null
    launch.main({
      platform: 'linux',
      baseEnv: {},
      cwd: '/lin/cwd',
      requireFn: () => '/fake/electron',
      spawnFn: (bin: string, args: string[], opts: any) => {
        spawnCall = { bin, args, opts }
        return { on: () => {} }
      },
      stderrWrite: () => {},
      exitFn: () => {},
    })
    expect(spawnCall.args).toContain('--no-sandbox')
    expect(spawnCall.args).toContain('--disable-setuid-sandbox')
    expect(spawnCall.opts.env.ELECTRON_DISABLE_SANDBOX).toBe('1')
    expect(spawnCall.opts.env.CHROME_DEVEL_SANDBOX).toBe('')
  })

  it('main 在 win32 平台不带 sandbox flag（仅 "."）', () => {
    const launch = loadLaunch()
    let spawnCall: any = null
    launch.main({
      platform: 'win32',
      baseEnv: { ELECTRON_RUN_AS_NODE: '1' },
      cwd: 'C:\\fake\\cwd',
      requireFn: () => 'C:\\fake\\electron.cmd',
      spawnFn: (bin: string, args: string[], opts: any) => {
        spawnCall = { bin, args, opts }
        return { on: () => {} }
      },
      stderrWrite: () => {},
      exitFn: () => {},
    })
    expect(spawnCall.args).toEqual(['.'])
    expect(spawnCall.opts.env.ELECTRON_DISABLE_SANDBOX).toBeUndefined()
    expect(spawnCall.opts.env.ELECTRON_RUN_AS_NODE).toBeUndefined()
  })

  // ── 5. main：close 事件透传 exit code ──
  it('main：child close 事件透传 exit code（0/正常/null→0）', () => {
    const launch = loadLaunch()
    const handlers: Record<string, (...a: any[]) => void> = {}
    let exitCode: number | null = null
    launch.main({
      platform: 'darwin',
      baseEnv: {},
      cwd: '/x',
      requireFn: () => '/fake',
      spawnFn: () => ({
        on: (evt: string, cb: any) => {
          handlers[evt] = cb
        },
      }),
      stderrWrite: () => {},
      exitFn: (c: number) => {
        exitCode = c
      },
    })
    expect(typeof handlers.close).toBe('function')
    // 透传 0
    handlers.close(0)
    expect(exitCode).toBe(0)
    // 透传任意非零
    handlers.close(7)
    expect(exitCode).toBe(7)
    // null → 0
    handlers.close(null)
    expect(exitCode).toBe(0)
  })

  // ── 6. main：spawn 抛错走 exit 12 + 友好 stderr ──
  it('main：spawn 抛同步异常时走 exit 12 + 友好 stderr', () => {
    const launch = loadLaunch()
    let stderrCaptured = ''
    let exitCalled: number | null = null
    launch.main({
      platform: 'darwin',
      baseEnv: {},
      cwd: '/x',
      requireFn: () => '/fake/electron',
      spawnFn: () => {
        throw new Error('EACCES: permission denied')
      },
      stderrWrite: (s: string) => {
        stderrCaptured += s
      },
      exitFn: (c: number) => {
        exitCalled = c
      },
    })
    expect(exitCalled).toBe(launch.EXIT_ELECTRON_MISSING)
    expect(stderrCaptured).toContain('electron 子进程启动失败')
    expect(stderrCaptured).toContain('EACCES')
  })

  // ── 7. main：child 'error' 事件走 exit 12 ──
  it('main：child error 事件触发 exit 12', () => {
    const launch = loadLaunch()
    const handlers: Record<string, (...a: any[]) => void> = {}
    let exitCode: number | null = null
    let stderrCaptured = ''
    launch.main({
      platform: 'darwin',
      baseEnv: {},
      cwd: '/x',
      requireFn: () => '/fake',
      spawnFn: () => ({
        on: (evt: string, cb: any) => {
          handlers[evt] = cb
        },
      }),
      stderrWrite: (s: string) => {
        stderrCaptured += s
      },
      exitFn: (c: number) => {
        exitCode = c
      },
    })
    expect(typeof handlers.error).toBe('function')
    handlers.error(new Error('ENOENT: electron binary missing'))
    expect(exitCode).toBe(launch.EXIT_ELECTRON_MISSING)
    expect(stderrCaptured).toContain('electron 子进程错误')
    expect(stderrCaptured).toContain('ENOENT')
  })

  // ── 8. EXIT_ELECTRON_MISSING 常量 = 12，区分于 1 ──
  it('EXIT_ELECTRON_MISSING 严格等于 12（与 launch.cjs 一般 fail=1 区分）', () => {
    const launch = loadLaunch()
    expect(launch.EXIT_ELECTRON_MISSING).toBe(12)
    expect(launch.EXIT_ELECTRON_MISSING).not.toBe(1)
    expect(launch.EXIT_ELECTRON_MISSING).not.toBe(0)
  })
})
