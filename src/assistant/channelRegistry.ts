// Input: channel MCP server 连接注册 + inbound 消息 context 缓存
// Output: 供 _pushToChannels 使用的 server 引用和 reply context
// Pos: assistant/ 通知推送的 channel MCP 桥接层

import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { logForDebugging } from 'src/utils/debug.js'

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

/**
 * Pending 消息（尚未送达的通知）。
 * 当所有 channel 都没有可用 context 时暂存，
 * 等到 saveChannelContext 收到 inbound 消息后 flush。
 */
interface PendingMessage {
  title: string
  body: string
  timestamp: number
}

// channel 名 → server entry（如 "wechat" → { client, serverName, ... }）
const _servers = new Map<string, ChannelServerEntry>()

// channel 名 → 最近 reply context
const _contexts = new Map<string, ChannelReplyContext>()

// 等待 context 到达后补发的消息缓冲区（最大 50 条）
const _pendingMessages: PendingMessage[] = []
const MAX_PENDING = 50

/** pending 消息最大有效期：1 小时 */
const PENDING_TTL_MS = 3_600_000

/** 磁盘 context 文件路径映射 */
const PERSISTED_CONTEXT_FILES: Record<string, string> = {
  wechat: 'channels/wechat/context-tokens.json',
  feishu: 'channels/feishu/user-chat-map.json',
}

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

  // Context 到达，flush 之前积压的 pending 消息
  _flushPending(channel)
}

/**
 * 从磁盘加载持久化的 channel context（fallback）。
 * WeChat: ~/.pandacc/channels/wechat/context-tokens.json → { "user_id": "context_token" }
 * Feishu: ~/.pandacc/channels/feishu/user-chat-map.json  → { "user_id": "chat_id" }
 *
 * 加载成功后写入 _contexts 缓存，下次不再读磁盘。
 * 全程 try/catch，失败返回 null。
 */
function _loadPersistedContext(channel: string): ChannelReplyContext | null {
  try {
    const relPath = PERSISTED_CONTEXT_FILES[channel]
    if (!relPath) return null

    const { readFileSync, statSync } = require('fs')
    const { join } = require('path')
    const { homedir } = require('os')
    const filePath = join(homedir(), '.pandacc', relPath)

    const stat = statSync(filePath)
    const mtime = stat.mtimeMs

    // 超过 CONTEXT_TTL_MS 的磁盘 context 视为过期
    if (Date.now() - mtime > CONTEXT_TTL_MS) {
      logForDebugging(
        `[channelRegistry] Persisted context for ${channel} expired (mtime ${new Date(mtime).toISOString()})`,
      )
      return null
    }

    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, string>
    const entries = Object.entries(raw)
    if (entries.length === 0) return null

    const [userId, token] = entries[0]
    if (!userId || !token) return null

    const ctx: ChannelReplyContext = {
      user_id: userId,
      context_token: token,
      updated: mtime,
    }

    // 写入内存缓存，下次不再读磁盘
    _contexts.set(channel, ctx)
    logForDebugging(
      `[channelRegistry] Loaded persisted context for ${channel}: user=${userId.slice(0, 12)}...`,
    )
    return ctx
  } catch (e) {
    logForDebugging(
      `[channelRegistry] Failed to load persisted context for ${channel}: ${(e as Error)?.message || e}`,
    )
    return null
  }
}

/**
 * 通过已注册的 channel MCP server 推送通知。
 * 遍历所有已注册 server，使用最近的 context 调用 reply 工具。
 *
 * WeChat reply tool 参数：{ user_id, context_token, text }
 * Feishu  reply tool 参数：{ user_id, chat_id, text }
 * 全程 try/catch，不抛出异常。
 *
 * 如果所有 channel 都没有可用 context，消息暂存到 _pendingMessages，
 * 等下次 saveChannelContext 时自动 flush。
 */
export function pushViaChannelMCP(title: string, body: string): void {
  const message = `[${title || 'Panda'}]\n${body || ''}`
  let delivered = false

  for (const [channel, server] of _servers) {
    try {
      let ctx = _contexts.get(channel)
      if (!ctx) {
        ctx = _loadPersistedContext(channel)
        if (!ctx) continue
      }

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
      }).catch((e: unknown) => {
        logForDebugging(
          `[channelRegistry] pushViaChannelMCP: reply 调用失败 (channel=${channel}): ${(e as Error)?.message || e}`,
        )
      })
      delivered = true
    } catch (e) {
      logForDebugging(
        `[channelRegistry] pushViaChannelMCP: 处理 channel=${channel} 时异常: ${(e as Error)?.message || e}`,
      )
    }
  }

  // 如果没有任何 channel 成功投递，暂存到 pending buffer
  if (!delivered) {
    _pendingMessages.push({ title, body, timestamp: Date.now() })
    // 超出上限时淘汰最旧的
    while (_pendingMessages.length > MAX_PENDING) {
      _pendingMessages.shift()
    }
    logForDebugging(
      `[channelRegistry] No available context, buffered notification (${_pendingMessages.length} pending): ${title}`,
    )
  }
}

/**
 * Flush pending 消息到指定 channel。
 * 在 saveChannelContext 后调用，将积压的通知补发出去。
 * 全程 try/catch + 异步，不阻塞调用方。
 */
function _flushPending(channel: string): void {
  if (_pendingMessages.length === 0) return

  const server = _servers.get(channel)
  let ctx = _contexts.get(channel)
  if (!ctx) {
    ctx = _loadPersistedContext(channel)
  }
  if (!server || !ctx) return

  const toolName = REPLY_TOOL_MAP[channel]
  if (!toolName) return

  const now = Date.now()

  // 取出所有 pending 消息并清空 buffer
  const messages = _pendingMessages.splice(0, _pendingMessages.length)

  // 过滤掉超过 TTL 的消息
  const valid = messages.filter(m => now - m.timestamp <= PENDING_TTL_MS)
  const expired = messages.length - valid.length

  if (expired > 0) {
    logForDebugging(
      `[channelRegistry] Discarded ${expired} expired pending notification(s)`,
    )
  }

  if (valid.length === 0) return

  logForDebugging(
    `[channelRegistry] Flushing ${valid.length} pending notification(s) to ${channel}`,
  )

  for (const msg of valid) {
    try {
      const text = `[${msg.title || 'Panda'}]\n${msg.body || ''}`
      const args: Record<string, string> = {
        user_id: ctx.user_id,
        text,
      }
      if (channel === 'wechat') {
        args.context_token = ctx.context_token
      } else {
        args.chat_id = ctx.context_token
      }

      // 异步发送，不 await（避免阻塞 saveChannelContext 调用链）
      void server.client.callTool({
        name: toolName,
        arguments: args,
      }).catch((e: unknown) => {
        logForDebugging(
          `[channelRegistry] Failed to flush pending notification to ${channel}: ${msg.title} (${(e as Error)?.message || e})`,
        )
      })
    } catch (e) {
      logForDebugging(
        `[channelRegistry] _flushPending: 处理 channel=${channel} 消息时异常: ${(e as Error)?.message || e}`,
      )
    }
  }
}

/**
 * 获取已注册的 channel 列表（调试用）。
 */
export function getRegisteredChannels(): string[] {
  return [..._servers.keys()]
}

/**
 * 获取当前 pending 消息数量（调试用）。
 */
export function getPendingCount(): number {
  return _pendingMessages.length
}
