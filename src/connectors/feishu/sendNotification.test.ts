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
  const [path, payload] = mockApiPost.mock.calls[0]

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
