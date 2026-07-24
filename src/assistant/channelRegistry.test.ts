// Input: mock MCP client / channel context / 多用户磁盘 token
// Output: H-003 delivered 语义 + H-010 多用户冷启动恢复断言
// Pos: assistant/channelRegistry 单元测试
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { describe, expect, mock, beforeEach, afterEach, test } from 'bun:test'
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import {
  pushViaChannelMCP,
  registerChannelServer,
  saveChannelContext,
  getChannelContext,
  getPendingCount,
  resetChannelRegistryForTests,
  unregisterChannelServer,
} from './channelRegistry.js'

function mockClient(
  callTool: (args: unknown) => Promise<unknown>,
): Client {
  return { callTool } as unknown as Client
}

describe('pushViaChannelMCP (H-003)', () => {
  beforeEach(() => {
    resetChannelRegistryForTests()
  })

  test('callTool 成功完成 → delivered=true，不进入 pending', async () => {
    const callTool = mock(async () => ({ content: [{ type: 'text', text: 'ok' }] }))
    registerChannelServer('plugin:wechat:wechat', mockClient(callTool))
    saveChannelContext('plugin:wechat:wechat', {
      user_id: 'u-success',
      context_token: 'tok-success',
    })

    // 等 saveChannelContext 触发的 flush 落地
    await Promise.resolve()

    const before = getPendingCount()
    const delivered = await pushViaChannelMCP('hello', 'world')

    expect(delivered).toBe(true)
    expect(callTool).toHaveBeenCalled()
    expect(getPendingCount()).toBe(before)
  })

  test('callTool reject → delivered=false，写入 pending 可重试', async () => {
    const callTool = mock(async () => {
      throw new Error('network down')
    })
    registerChannelServer('plugin:wechat:wechat', mockClient(callTool))
    saveChannelContext('plugin:wechat:wechat', {
      user_id: 'u-reject',
      context_token: 'tok-reject',
    })
    await Promise.resolve()

    const before = getPendingCount()
    const delivered = await pushViaChannelMCP('fail-title', 'fail-body')

    expect(delivered).toBe(false)
    expect(callTool).toHaveBeenCalled()
    expect(getPendingCount()).toBe(before + 1)
  })

  test('callTool 返回 isError → delivered=false，写入 pending', async () => {
    const callTool = mock(async () => ({
      isError: true,
      content: [{ type: 'text', text: 'tool failed' }],
    }))
    registerChannelServer('plugin:wechat:wechat', mockClient(callTool))
    saveChannelContext('plugin:wechat:wechat', {
      user_id: 'u-iserror',
      context_token: 'tok-iserror',
    })
    await Promise.resolve()

    const before = getPendingCount()
    const delivered = await pushViaChannelMCP('iserror-title', 'iserror-body')

    expect(delivered).toBe(false)
    expect(callTool).toHaveBeenCalled()
    expect(getPendingCount()).toBe(before + 1)
  })

  test('无 server/context 时 delivered=false 且 buffer', async () => {
    unregisterChannelServer('plugin:wechat:wechat')
    const before = getPendingCount()
    const delivered = await pushViaChannelMCP('no-channel', 'body')
    expect(delivered).toBe(false)
    expect(getPendingCount()).toBe(before + 1)
  })
})

describe('multi-user context restore (H-010)', () => {
  const tokensPath = join(homedir(), '.pandacc', 'channels', 'wechat', 'context-tokens.json')
  let backup: string | null = null
  let hadFile = false

  beforeEach(() => {
    resetChannelRegistryForTests()
    hadFile = existsSync(tokensPath)
    backup = hadFile ? readFileSync(tokensPath, 'utf-8') : null
  })

  afterEach(() => {
    resetChannelRegistryForTests()
    try {
      if (backup !== null) {
        writeFileSync(tokensPath, backup, 'utf-8')
      } else if (hadFile === false && existsSync(tokensPath)) {
        // 测试新建的文件：仅当原先不存在时删除，避免误删真实生产 token
        // 若目录下只有测试数据则可删；有备份则已恢复
        // 此处 backup===null 且原先不存在 → 删除测试写入
        rmSync(tokensPath, { force: true })
      }
    } catch {
      // 清理失败不阻断
    }
  })

  test('内存多用户：两个 user 都能取到各自 context', () => {
    saveChannelContext('plugin:wechat:wechat', {
      user_id: 'user-a',
      context_token: 'token-a',
    })
    saveChannelContext('plugin:wechat:wechat', {
      user_id: 'user-b',
      context_token: 'token-b',
    })

    const a = getChannelContext('wechat', 'user-a')
    const b = getChannelContext('wechat', 'user-b')
    expect(a?.user_id).toBe('user-a')
    expect(a?.context_token).toBe('token-a')
    expect(b?.user_id).toBe('user-b')
    expect(b?.context_token).toBe('token-b')
  })

  test('冷启动：磁盘多用户 Map 全部恢复，非仅 entries[0]', () => {
    mkdirSync(join(homedir(), '.pandacc', 'channels', 'wechat'), { recursive: true })
    // 故意把非首用户放在后面：旧实现 entries[0] 只会拿到 user-first
    writeFileSync(
      tokensPath,
      JSON.stringify({
        'user-first': 'token-first',
        'user-second': 'token-second',
      }),
      'utf-8',
    )

    // 清空内存 → 模拟冷启动
    resetChannelRegistryForTests()

    const first = getChannelContext('wechat', 'user-first')
    const second = getChannelContext('wechat', 'user-second')

    expect(first?.user_id).toBe('user-first')
    expect(first?.context_token).toBe('token-first')
    expect(second?.user_id).toBe('user-second')
    expect(second?.context_token).toBe('token-second')
  })

  test('冷启动 push fan-out：两个用户均收到 callTool', async () => {
    mkdirSync(join(homedir(), '.pandacc', 'channels', 'wechat'), { recursive: true })
    writeFileSync(
      tokensPath,
      JSON.stringify({
        'user-alpha': 'tok-alpha',
        'user-beta': 'tok-beta',
      }),
      'utf-8',
    )
    resetChannelRegistryForTests()

    const seenUserIds: string[] = []
    const callTool = mock(async (args: unknown) => {
      const a = args as { arguments?: { user_id?: string } }
      if (a.arguments?.user_id) seenUserIds.push(a.arguments.user_id)
      return { content: [{ type: 'text', text: 'ok' }] }
    })
    registerChannelServer('plugin:wechat:wechat', mockClient(callTool))

    const delivered = await pushViaChannelMCP('multi', 'body')
    expect(delivered).toBe(true)
    expect(seenUserIds.sort()).toEqual(['user-alpha', 'user-beta'])
    expect(callTool).toHaveBeenCalledTimes(2)
  })
})
