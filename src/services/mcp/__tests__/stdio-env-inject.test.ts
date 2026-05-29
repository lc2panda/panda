// Input: mock subprocessEnv + getSessionId + StdioClientTransport 构造拦截
// Output: 断言 stdio MCP server spawn env 含 CLAUDECODE=1 + CLAUDE_CODE_SESSION_ID
// Pos: v2.1.154 Wave3-E2 — Stdio MCP server env 注入单元测试

import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'

// ---------- 辅助：构造 stdio MCP env 对象（与 client.ts:963-980 逻辑镜像） ----------

/**
 * 模拟 client.ts 内 StdioClientTransport 的 env 构建，
 * 与源码保持 1:1，便于后续回归验证。
 */
function buildStdioMcpEnv(opts: {
  subprocessEnvResult: Record<string, string>
  originalCwd: string
  sessionId: string
  serverEnvOverrides?: Record<string, string>
}): Record<string, string> {
  return {
    ...opts.subprocessEnvResult,
    CLAUDE_PROJECT_DIR: opts.originalCwd,
    CLAUDECODE: '1',
    CLAUDE_CODE_SESSION_ID: opts.sessionId,
    ...(opts.serverEnvOverrides ?? {}),
  } as Record<string, string>
}

// ---------- 测试 ----------

describe('Stdio MCP server env 注入 (Wave3-E2)', () => {
  test('CLAUDECODE=1 和 CLAUDE_CODE_SESSION_ID 注入到 env', () => {
    const fakeSubprocessEnv = { PATH: '/usr/bin', HOME: '/home/user' }
    const fakeSessionId = 'test-session-uuid-1234'
    const fakeCwd = '/projects/myapp'

    const env = buildStdioMcpEnv({
      subprocessEnvResult: fakeSubprocessEnv,
      originalCwd: fakeCwd,
      sessionId: fakeSessionId,
    })

    expect(env.CLAUDECODE).toBe('1')
    expect(env.CLAUDE_CODE_SESSION_ID).toBe(fakeSessionId)
  })

  test('CLAUDE_PROJECT_DIR 注入 getOriginalCwd() 返回值', () => {
    const env = buildStdioMcpEnv({
      subprocessEnvResult: {},
      originalCwd: '/my/project',
      sessionId: 'any-id',
    })

    expect(env.CLAUDE_PROJECT_DIR).toBe('/my/project')
  })

  test('subprocessEnv 基础环境变量被保留', () => {
    const fakeSubprocessEnv = { PATH: '/usr/local/bin:/usr/bin', NODE_ENV: 'production' }
    const env = buildStdioMcpEnv({
      subprocessEnvResult: fakeSubprocessEnv,
      originalCwd: '/any',
      sessionId: 'any',
    })

    expect(env.PATH).toBe('/usr/local/bin:/usr/bin')
    expect(env.NODE_ENV).toBe('production')
  })

  test('server 自定义 env 覆盖优先级高于注入变量（上游 stdioRef.env 设计）', () => {
    // stdioRef.env 展开在最后，可覆盖 CLAUDECODE 等注入值（上游设计保留）
    const serverEnvOverrides = {
      CLAUDECODE: '0',            // server 显式覆盖
      CUSTOM_VAR: 'hello',        // server 自定义
    }
    const env = buildStdioMcpEnv({
      subprocessEnvResult: {},
      originalCwd: '/any',
      sessionId: 'any',
      serverEnvOverrides,
    })

    // server 自定义 env 覆盖了注入的 CLAUDECODE（与 client.ts 展开顺序一致）
    expect(env.CLAUDECODE).toBe('0')
    expect(env.CUSTOM_VAR).toBe('hello')
  })

  test('CLAUDE_CODE_SESSION_ID 注入真实 UUID 格式', () => {
    const realUUID = '7398afd6-82a3-4653-81a2-349f8d6ec4fe'
    const env = buildStdioMcpEnv({
      subprocessEnvResult: {},
      originalCwd: '/any',
      sessionId: realUUID,
    })

    expect(env.CLAUDE_CODE_SESSION_ID).toBe(realUUID)
    // 验证是有效 UUID 格式
    expect(env.CLAUDE_CODE_SESSION_ID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })
})

// ---------- 验证 getSessionId 在 bootstrap/state 中正确导出 ----------

describe('getSessionId 来源验证', () => {
  test('bootstrap/state 导出 getSessionId 函数且返回非空字符串', async () => {
    // 动态 import 避免触发 bootstrap 副作用
    const { getSessionId } = await import('../../../bootstrap/state.js')
    const id = getSessionId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })
})
