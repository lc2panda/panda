// Input: FeishuAPIConnector.sendNotification() 的输入参数和配置
// Output: 验证通知消息正确调用飞书 API
// Pos: connectors/feishu/ 单元测试，守护飞书通知功能不回归

import { test, expect, mock, spyOn, beforeEach, afterEach } from 'bun:test'
import { createFeishuConnector } from './index.js'
import type { PandaNotification } from '../types.js'

const originalFetch = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = mock(async () => new Response(JSON.stringify({
    code: 0,
    tenant_access_token: 'tenant_access_token_test',
    expire: 7200,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })) as any
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('sendNotification — 无 chatId 配置时跳过', async () => {
  const connector = createFeishuConnector({
    platform: 'feishu',
    mode: 'api',
    appId: 'cli_test',
    appSecret: 'secret_test',
  })
  await connector.initialize({
    platform: 'feishu',
    mode: 'api',
    appId: 'cli_test',
    appSecret: 'secret_test',
  })

  const apiPostSpy = spyOn(connector as any, 'apiPost')

  await connector.sendNotification({ title: 'Test', body: 'Body' })

  expect(apiPostSpy).not.toHaveBeenCalled()
})

test('sendNotification — 正常发送消息', async () => {
  const connector = createFeishuConnector({
    platform: 'feishu',
    mode: 'api',
    appId: 'cli_test',
    appSecret: 'secret_test',
    extra: { chatId: 'oc_test123' },
  })
  await connector.initialize({
    platform: 'feishu',
    mode: 'api',
    appId: 'cli_test',
    appSecret: 'secret_test',
    extra: { chatId: 'oc_test123' },
  })

  const mockApiPost = mock(async () => ({ code: 0, msg: 'success' }))
  ;(connector as any).apiPost = mockApiPost

  const notification: PandaNotification = {
    title: 'Panda 通知',
    body: '这是一条测试消息',
  }

  await connector.sendNotification(notification)

  expect(mockApiPost).toHaveBeenCalledTimes(1)
  const [path, payload] = mockApiPost.mock.calls[0] as unknown as [
    string,
    { receive_id: string; msg_type: string; content: string },
  ]

  expect(path).toContain('/im/v1/messages')
  expect(path).toContain('receive_id_type=chat_id')
  expect(payload.receive_id).toBe('oc_test123')
  expect(payload.msg_type).toBe('text')

  const content = JSON.parse(payload.content)
  expect(content.text).toContain('Panda 通知')
  expect(content.text).toContain('这是一条测试消息')
})

test('sendNotification — API 失败时捕获错误', async () => {
  const connector = createFeishuConnector({
    platform: 'feishu',
    mode: 'api',
    appId: 'cli_test',
    appSecret: 'secret_test',
    extra: { chatId: 'oc_test123' },
  })
  await connector.initialize({
    platform: 'feishu',
    mode: 'api',
    appId: 'cli_test',
    appSecret: 'secret_test',
    extra: { chatId: 'oc_test123' },
  })

  const mockApiPost = mock(async () => ({ code: 99999, msg: 'API Error' }))
  ;(connector as any).apiPost = mockApiPost

  // 不应抛出错误，应该被内部 catch 捕获
  await expect(connector.sendNotification({ title: 'Test', body: 'Body' })).resolves.toBeUndefined()
})

test('sendNotification — 网络异常时捕获错误', async () => {
  const connector = createFeishuConnector({
    platform: 'feishu',
    mode: 'api',
    appId: 'cli_test',
    appSecret: 'secret_test',
    extra: { chatId: 'oc_test123' },
  })
  await connector.initialize({
    platform: 'feishu',
    mode: 'api',
    appId: 'cli_test',
    appSecret: 'secret_test',
    extra: { chatId: 'oc_test123' },
  })

  const mockApiPost = mock(async () => {
    throw new Error('Network failure')
  })
  ;(connector as any).apiPost = mockApiPost

  // 不应抛出错误，应该被内部 catch 捕获
  await expect(connector.sendNotification({ title: 'Test', body: 'Body' })).resolves.toBeUndefined()
})

// ─── H-004: 默认 MCP connector 必须具备 sendNotification ───

test('MCP sendNotification — 默认/ mcp 工厂实例具备方法 (H-004)', () => {
  const defaultConn = createFeishuConnector({ platform: 'feishu' })
  const mcpConn = createFeishuConnector({ platform: 'feishu', mode: 'mcp' })
  expect(typeof defaultConn.sendNotification).toBe('function')
  expect(typeof mcpConn.sendNotification).toBe('function')
})

test('MCP sendNotification — 无 chatId 配置时跳过', async () => {
  const connector = createFeishuConnector({ platform: 'feishu', mode: 'mcp' })
  // 不 initialize（避免拉起 MCP 子进程），直接注入 config
  ;(connector as any).config = { platform: 'feishu', mode: 'mcp' }
  const callToolSpy = spyOn(connector as any, 'callTool')

  await connector.sendNotification!({ title: 'Test', body: 'Body' })

  expect(callToolSpy).not.toHaveBeenCalled()
})

test('MCP sendNotification — 有 chatId 时走 feishu_send_message', async () => {
  const connector = createFeishuConnector({ platform: 'feishu', mode: 'mcp' })
  ;(connector as any).config = {
    platform: 'feishu',
    mode: 'mcp',
    extra: { chatId: 'oc_mcp_test' },
  }
  const mockCallTool = mock(async () => ({ message_id: 'om_test' }))
  ;(connector as any).callTool = mockCallTool

  await connector.sendNotification!({ title: 'Panda 通知', body: 'MCP 路径消息' })

  expect(mockCallTool).toHaveBeenCalledTimes(1)
  const [toolName, args] = mockCallTool.mock.calls[0] as unknown as [
    string,
    { target: string; content: string; content_type: string },
  ]
  expect(toolName).toBe('feishu_send_message')
  expect(args.target).toBe('oc_mcp_test')
  expect(args.content_type).toBe('text')
  expect(args.content).toContain('Panda 通知')
  expect(args.content).toContain('MCP 路径消息')
})

test('MCP sendNotification — callTool 失败时捕获错误', async () => {
  const connector = createFeishuConnector({ platform: 'feishu', mode: 'mcp' })
  ;(connector as any).config = {
    platform: 'feishu',
    mode: 'mcp',
    extra: { chatId: 'oc_mcp_test' },
  }
  ;(connector as any).callTool = mock(async () => {
    throw new Error('MCP not connected')
  })

  await expect(
    connector.sendNotification!({ title: 'Test', body: 'Body' }),
  ).resolves.toBeUndefined()
})
