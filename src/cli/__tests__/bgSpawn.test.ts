// Input: bgSpawn.ts 函数 + 环境变量
// Output: bun test 断言结果
// Pos: src/cli/__tests__/ —— bgSpawn 单元测试（env 注入、shell 引号、tmux 可用性）

import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test'

// ─── mock execFileNoThrow ─────────────────────────────────────────────────────
// bgSpawn.ts 在 module-level 没有副作用，所以我们 mock 底层 execFileNoThrow
// 和 isTmuxAvailable 来做纯函数测试。

let mockExecReturn: { stdout: string; stderr: string; code: number } = {
  stdout: '',
  stderr: '',
  code: 0,
}

mock.module('../../utils/execFileNoThrow.js', () => ({
  execFileNoThrow: async () => mockExecReturn,
}))

mock.module('../../utils/swarm/backends/detection.js', () => ({
  isTmuxAvailable: async () => mockTmuxAvailable,
}))

mock.module('../../utils/swarm/constants.js', () => ({
  TMUX_COMMAND: 'tmux',
}))

let mockTmuxAvailable = true

async function importBgSpawn() {
  return await import('../bgSpawn.js')
}

describe('bgSpawn — ensureTmuxAvailable', () => {
  beforeEach(() => {
    mockTmuxAvailable = true
    mockExecReturn = { stdout: '', stderr: '', code: 0 }
    process.env.PANDA_TEST_TMUX_AVAILABLE = '1'
  })

  afterEach(() => {
    delete process.env.PANDA_TEST_TMUX_AVAILABLE
  })

  test('tmux 可用时返回 { ok: true }', async () => {
    mockTmuxAvailable = true
    const { ensureTmuxAvailable } = await importBgSpawn()
    const result = await ensureTmuxAvailable()
    expect(result.ok).toBe(true)
  })

  test('tmux 不可用时返回 { ok: false, error: ... }', async () => {
    mockTmuxAvailable = false
    process.env.PANDA_TEST_TMUX_AVAILABLE = '0'
    const { ensureTmuxAvailable } = await importBgSpawn()
    const result = await ensureTmuxAvailable()
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toContain('tmux')
  })
})

describe('bgSpawn — BG_TMUX_SESSION 常量', () => {
  test('claude-bg 常量值正确', async () => {
    const { BG_TMUX_SESSION } = await importBgSpawn()
    expect(BG_TMUX_SESSION).toBe('claude-bg')
  })
})

describe('bgSpawn — CLAUDE_CODE_SESSION_KIND env 注入', () => {
  test('spawnBgSession 构造的 env 包含 CLAUDE_CODE_SESSION_KIND=bg', async () => {
    // 捕获 execFileNoThrow 的调用参数来验证 env 注入
    const calls: Array<[string, string[], unknown]> = []
    mock.module('../../utils/execFileNoThrow.js', () => ({
      execFileNoThrow: async (file: string, args: string[], opts: unknown) => {
        calls.push([file, args, opts])
        return { stdout: '', stderr: '', code: 0 }
      },
    }))
    mock.module('../../utils/swarm/backends/detection.js', () => ({
      isTmuxAvailable: async () => true,
    }))

    const { spawnBgSession } = await import('../bgSpawn.js')
    const testId = '11111111-2222-3333-4444-555555555555'
    await spawnBgSession([], testId, { cwd: '/tmp/test-cwd' })

    // 找到 new-window 调用（包含命令字符串的那次）
    const newWindowCall = calls.find(c => c[1]?.includes('new-window'))
    expect(newWindowCall).toBeDefined()
    if (newWindowCall) {
      // 命令字符串（最后一个参数）应包含 CLAUDE_CODE_SESSION_KIND=bg
      const cmdArg = newWindowCall[1][newWindowCall[1].length - 1]
      expect(cmdArg).toContain('CLAUDE_CODE_SESSION_KIND')
      expect(cmdArg).toContain('bg')
    }
  })

  test('spawnBgSession 构造的 env 包含 CALLER_DIR', async () => {
    const calls: Array<[string, string[], unknown]> = []
    mock.module('../../utils/execFileNoThrow.js', () => ({
      execFileNoThrow: async (file: string, args: string[], opts: unknown) => {
        calls.push([file, args, opts])
        return { stdout: '', stderr: '', code: 0 }
      },
    }))

    const { spawnBgSession } = await import('../bgSpawn.js')
    const testCwd = '/tmp/my-project'
    await spawnBgSession([], 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', {
      cwd: testCwd,
    })

    const newWindowCall = calls.find(c => c[1]?.includes('new-window'))
    if (newWindowCall) {
      const cmdArg = newWindowCall[1][newWindowCall[1].length - 1]
      expect(cmdArg).toContain('CALLER_DIR')
      expect(cmdArg).toContain(testCwd)
    }
  })

  test('tmux 不可用时 spawnBgSession 返回 { ok: false }', async () => {
    mock.module('../../utils/swarm/backends/detection.js', () => ({
      isTmuxAvailable: async () => false,
    }))
    const { spawnBgSession } = await import('../bgSpawn.js')
    const result = await spawnBgSession([], 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('tmux')
  })
})
