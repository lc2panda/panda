// Input: mock MCP client / channel context
// Output: H-003 delivered 语义断言
// Pos: assistant/channelRegistry 单元测试
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { describe, expect, mock, beforeEach, test } from 'bun:test'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import {
  pushViaChannelMCP,
  registerChannelServer,
  saveChannelContext,
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
