// Input: channel MCP server 连接注册 + inbound 消息 context 缓存
// Output: 供 _pushToChannels 使用的 server 引用和 reply context
// Pos: assistant/ 通知推送的 channel MCP 桥接层

import type { Client } from '@modelcontextprotocol/sdk/client/index.js'

/**
 * 已注册的 channel MCP server 引用。
 * 模块级单例，生命周期跟随进程。
 */
interface ChannelServerEntry {
  /** MCP SDK Client 实例（可直接调用 callTool） */
  client: Client
  /** server name，如 "plugin:wechat:wechat" */
  serverName: string
  /** 注册时间 */
  registeredAt: number
}

/**
 * 最近一次 inbound 消息的 reply context。
 * 用于主动推送时构造 reply 工具参数。
 */
interface ChannelReplyContext {
  user_id: string
  context_token: string
  /** 最后更新时间（ms） */
  updated: number
}

// channel 名 → server entry（如 "wechat" → { client, serverName, ... }）
const _servers = new Map<string, ChannelServerEntry>()

// channel 名 → 最近 reply context
const _contexts = new Map<string, ChannelReplyContext>()

// reply 工具名映射（MCP server 使用 unprefixed 名称）
const REPLY_TOOL_MAP: Record<string, string> = {
  wechat: 'reply',
  feishu: 'reply',
}

/** context 最大有效期：24 小时 */
const CONTEXT_TTL_MS = 86_400_000

/**
 * 从 MCP server name 提取 channel 标识。
 * "plugin:wechat:wechat" → "wechat"
 * "plugin:feishu:feishu" → "feishu"
 * 其他情况返回最后一个冒号后的部分。
 */
function extractChannelName(serverName: string): string {
  const parts = serverName.split(':')
  // plugin:X:Y → 取第二段 X
  if (parts[0] === 'plugin' && parts.length >= 3) {
    return parts[1]
  }
  return parts[parts.length - 1]
}

/**
 * 注册一个 channel MCP server。
 * 由 print.ts 在 channel notification handler 注册时调用。
 */
export function registerChannelServer(serverName: string, client: Client): void {
  const channel = extractChannelName(serverName)
  _servers.set(channel, {
    client,
    serverName,
    registeredAt: Date.now(),
  })
}

/**
 * 注销一个 channel MCP server。
 */
export function unregisterChannelServer(serverName: string): void {
  const channel = extractChannelName(serverName)
  _servers.delete(channel)
}

/**
 * 保存 inbound 消息的 reply context（从 meta 中提取 user_id + context_token/chat_id）。
 * 由 print.ts 在收到 channel notification 时调用。
 *
 * WeChat meta 字段：{ user_id, context_token, ts }
 * Feishu  meta 字段：{ user_id, chat_id, ts }
 */
export function saveChannelContext(
  serverName: string,
  meta: Record<string, string> | undefined,
): void {
  if (!meta) return
  const userId = meta.user_id || meta.from_user_id
  // WeChat uses context_token, Feishu uses chat_id — normalize to context_token
  const contextToken = meta.context_token || meta.chat_id
  if (!userId || !contextToken) return

  const channel = extractChannelName(serverName)
  _contexts.set(channel, {
    user_id: userId,
    context_token: contextToken,
    updated: Date.now(),
  })
}

/**
 * 通过已注册的 channel MCP server 推送通知。
 * 遍历所有已注册 server，使用最近的 context 调用 reply 工具。
 *
 * WeChat reply tool 参数：{ user_id, context_token, text }
 * Feishu  reply tool 参数：{ user_id, chat_id, text }
 * 全程 try/catch，不抛出异常。
 */
export function pushViaChannelMCP(title: string, body: string): void {
  const message = `[${title || 'Panda'}]\n${body || ''}`

  for (const [channel, server] of _servers) {
    try {
      const ctx = _contexts.get(channel)
      if (!ctx) continue

      // 检查 context 是否过期
      if (Date.now() - ctx.updated > CONTEXT_TTL_MS) continue

      const toolName = REPLY_TOOL_MAP[channel]
      if (!toolName) continue

      // 构造正确的参数名：WeChat → context_token, Feishu → chat_id
      const args: Record<string, string> = {
        user_id: ctx.user_id,
        text: message,
      }
      if (channel === 'wechat') {
        args.context_token = ctx.context_token
      } else {
        // Feishu and other channels use chat_id
        args.chat_id = ctx.context_token
      }

      // 异步调用 MCP reply 工具，不 await（避免阻塞推送管道）
      void server.client.callTool({
        name: toolName,
        arguments: args,
      }).catch(() => {
        // 静默降级——推送失败不影响主流程
      })
    } catch {
      // 静默降级
    }
  }
}

/**
 * 获取已注册的 channel 列表（调试用）。
 */
export function getRegisteredChannels(): string[] {
  return [..._servers.keys()]
}
