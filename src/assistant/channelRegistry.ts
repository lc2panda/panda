// Input: channel MCP server 连接注册 + inbound/磁盘多用户 context 缓存
// Output: 供 _pushToChannels 使用的 server 引用与按 user_id 索引的 reply context
// Pos: assistant/ 通知推送的 channel MCP 桥接层（H-010 冷启动恢复全部用户 token）

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

// channel 名 → (user_id → reply context)。H-010：完整多用户 Map，不再只保留单条
const _contexts = new Map<string, Map<string, ChannelReplyContext>>()

// channel 名 → 最近 inbound 的 user_id（pending flush 目标）
const _lastActiveUser = new Map<string, string>()

// 已尝试从磁盘加载过的 channel（每进程每 channel 一次，避免反复 IO）
const _diskLoaded = new Set<string>()

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

function _userMap(channel: string): Map<string, ChannelReplyContext> {
  let m = _contexts.get(channel)
  if (!m) {
    m = new Map()
    _contexts.set(channel, m)
  }
  return m
}

/** 写入/更新单个用户 context，并标记为 last active */
function _upsertContext(
  channel: string,
  userId: string,
  contextToken: string,
  updated: number,
  markActive: boolean,
): ChannelReplyContext {
  const ctx: ChannelReplyContext = {
    user_id: userId,
    context_token: contextToken,
    updated,
  }
  _userMap(channel).set(userId, ctx)
  if (markActive) {
    _lastActiveUser.set(channel, userId)
  }
  return ctx
}

/** 返回 channel 下未过期的全部 context（按 Map 插入序） */
function _listLiveContexts(channel: string): ChannelReplyContext[] {
  const m = _contexts.get(channel)
  if (!m || m.size === 0) return []
  const now = Date.now()
  const live: ChannelReplyContext[] = []
  for (const ctx of m.values()) {
    if (now - ctx.updated <= CONTEXT_TTL_MS) {
      live.push(ctx)
    }
  }
  return live
}

/**
 * 取 reply 目标：
 * - 指定 userId → 该用户（未过期）
 * - 否则 last active（未过期）
 * - 再否则第一个 live context
 */
function _resolveContext(
  channel: string,
  userId?: string,
): ChannelReplyContext | undefined {
  const m = _contexts.get(channel)
  if (!m || m.size === 0) return undefined
  const now = Date.now()

  if (userId) {
    const ctx = m.get(userId)
    if (ctx && now - ctx.updated <= CONTEXT_TTL_MS) return ctx
    return undefined
  }

  const activeId = _lastActiveUser.get(channel)
  if (activeId) {
    const active = m.get(activeId)
    if (active && now - active.updated <= CONTEXT_TTL_MS) return active
  }

  for (const ctx of m.values()) {
    if (now - ctx.updated <= CONTEXT_TTL_MS) return ctx
  }
  return undefined
}

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
  _upsertContext(channel, userId, contextToken, Date.now(), true)

  // Context 到达，flush 之前积压的 pending 消息（异步，失败已在内部回写 pending）
  void _flushPending(channel).catch((e: unknown) => {
    logForDebugging(
      `[channelRegistry] _flushPending rejected (channel=${channel}): ${(e as Error)?.message || e}`,
    )
  })
}

/**
 * 读取 channel 的 reply context。
 * - 指定 userId：按用户精确取（H-010 多用户）
 * - 省略 userId：last active → 任一 live
 * 先 ensure 磁盘冷启动加载。
 */
export function getChannelContext(
  channel: string,
  userId?: string,
): ChannelReplyContext | undefined {
  _ensureDiskContextsLoaded(channel)
  return _resolveContext(channel, userId)
}

/**
 * 从磁盘加载持久化的 channel context（fallback）。
 * WeChat: ~/.pandacc/channels/wechat/context-tokens.json → { "user_id": "context_token", ... }
 * Feishu: ~/.pandacc/channels/feishu/user-chat-map.json  → { "user_id": "chat_id", ... }
 *
 * H-010：恢复 Map 中**全部**用户 token，不再只取 entries[0]。
 * 与内存中更新时间更新的条目合并（不覆盖更新的 in-memory）。
 * 全程 try/catch，失败可观测日志。
 */
function _loadPersistedContext(channel: string): number {
  try {
    const relPath = PERSISTED_CONTEXT_FILES[channel]
    if (!relPath) return 0

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
      return 0
    }

    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, string>
    const entries = Object.entries(raw)
    if (entries.length === 0) return 0

    const userMap = _userMap(channel)
    let loaded = 0
    for (const [userId, token] of entries) {
      if (!userId || typeof token !== 'string' || !token) continue
      const existing = userMap.get(userId)
      // 不覆盖更新鲜的 in-memory 条目
      if (existing && existing.updated >= mtime) continue
      userMap.set(userId, {
        user_id: userId,
        context_token: token,
        updated: mtime,
      })
      loaded++
    }

    logForDebugging(
      `[channelRegistry] Loaded ${loaded}/${entries.length} persisted user context(s) for ${channel}`,
    )
    return loaded
  } catch (e) {
    logForDebugging(
      `[channelRegistry] Failed to load persisted context for ${channel}: ${(e as Error)?.message || e}`,
    )
    return 0
  }
}

/** 每 channel 冷启动只读一次磁盘，合并全部用户 token */
function _ensureDiskContextsLoaded(channel: string): void {
  if (_diskLoaded.has(channel)) return
  _diskLoaded.add(channel)
  _loadPersistedContext(channel)
}

/**
 * 判定 MCP callTool 结果是否为业务失败。
 * SDK 可能 resolve 带 isError:true 的结果而不 reject。
 */
function _isCallToolErrorResult(result: unknown): boolean {
  return (
    !!result &&
    typeof result === 'object' &&
    'isError' in result &&
    (result as { isError?: boolean }).isError === true
  )
}

/** 构造 reply 工具参数：WeChat → context_token，Feishu → chat_id */
function _buildReplyArgs(
  channel: string,
  ctx: ChannelReplyContext,
  text: string,
): Record<string, string> {
  const args: Record<string, string> = {
    user_id: ctx.user_id,
    text,
  }
  if (channel === 'wechat') {
    args.context_token = ctx.context_token
  } else {
    args.chat_id = ctx.context_token
  }
  return args
}

/**
 * 通过已注册的 channel MCP server 推送通知。
 * 遍历所有已注册 server，对 channel 下**全部 live 用户** fan-out 调用 reply（H-010）。
 *
 * WeChat reply tool 参数：{ user_id, context_token, text }
 * Feishu  reply tool 参数：{ user_id, chat_id, text }
 * 全程 try/catch，不抛出异常。
 *
 * delivered 语义（H-003）：仅在至少一个 callTool **成功完成**（无 throw、无 isError）后为 true。
 * 失败时返回 false 并将消息写入 pending，供后续 saveChannelContext 重投。
 *
 * 如果所有 channel 都没有可用 context，消息暂存到 _pendingMessages，
 * 等下次 saveChannelContext 时自动 flush。
 */
export async function pushViaChannelMCP(
  title: string,
  body: string,
): Promise<boolean> {
  const message = `[${title || 'Panda'}]\n${body || ''}`
  let delivered = false

  try {
    for (const [channel, server] of _servers) {
      try {
        // H-010：冷启动恢复全部用户 token，再 fan-out 到 live 用户
        _ensureDiskContextsLoaded(channel)
        const targets = _listLiveContexts(channel)
        if (targets.length === 0) {
          logForDebugging(
            `[channelRegistry] pushViaChannelMCP: no live context for ${channel}`,
          )
          continue
        }

        const toolName = REPLY_TOOL_MAP[channel]
        if (!toolName) continue

        let channelDelivered = false
        for (const ctx of targets) {
          try {
            // H-003：必须 await 成功后再标 delivered，禁止 fire-and-forget 假成功
            const result = await server.client.callTool({
              name: toolName,
              arguments: _buildReplyArgs(channel, ctx, message),
            })
            if (_isCallToolErrorResult(result)) {
              logForDebugging(
                `[channelRegistry] pushViaChannelMCP: reply 返回 isError (channel=${channel}, user=${ctx.user_id.slice(0, 12)}...): ${JSON.stringify((result as { content?: unknown }).content ?? result)}`,
              )
              continue
            }
            channelDelivered = true
            logForDebugging(
              `[channelRegistry] pushViaChannelMCP: delivered via ${channel} user=${ctx.user_id.slice(0, 12)}...`,
            )
          } catch (e) {
            logForDebugging(
              `[channelRegistry] pushViaChannelMCP: reply 调用失败 (channel=${channel}, user=${ctx.user_id.slice(0, 12)}...): ${(e as Error)?.message || e}`,
            )
          }
        }

        if (channelDelivered) {
          delivered = true
        }
      } catch (e) {
        logForDebugging(
          `[channelRegistry] pushViaChannelMCP: reply 调用失败 (channel=${channel}): ${(e as Error)?.message || e}`,
        )
      }
    }

    // 如果没有任何 channel 成功投递，暂存到 pending buffer 供重试
    if (!delivered) {
      _pendingMessages.push({ title, body, timestamp: Date.now() })
      // 超出上限时淘汰最旧的
      while (_pendingMessages.length > MAX_PENDING) {
        _pendingMessages.shift()
      }
      logForDebugging(
        `[channelRegistry] No successful delivery, buffered notification (${_pendingMessages.length} pending): ${title}`,
      )
    }
  } catch (e) {
    // 外层兜底：绝不向调用方抛错；失败可观测且进入 pending
    logForDebugging(
      `[channelRegistry] pushViaChannelMCP: unexpected error: ${(e as Error)?.message || e}`,
    )
    if (!delivered) {
      _pendingMessages.push({ title, body, timestamp: Date.now() })
      while (_pendingMessages.length > MAX_PENDING) {
        _pendingMessages.shift()
      }
    }
  }

  return delivered
}

/**
 * Flush pending 消息到指定 channel 的 last-active 用户。
 * 在 saveChannelContext 后调用，将积压的通知补发给刚 inbound 的用户。
 * 仅在 callTool 成功后丢弃消息；失败则回写 pending 供重试。
 * 全程 try/catch，不向调用方抛错。
 */
async function _flushPending(channel: string): Promise<void> {
  if (_pendingMessages.length === 0) return

  const server = _servers.get(channel)
  // flush 目标：刚 save 的 last-active 用户（非 fan-out）
  const ctx = _resolveContext(channel)
  if (!server || !ctx) return

  const toolName = REPLY_TOOL_MAP[channel]
  if (!toolName) return

  const now = Date.now()

  // 取出所有 pending 消息并清空 buffer；失败项会回写
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
    `[channelRegistry] Flushing ${valid.length} pending notification(s) to ${channel} user=${ctx.user_id.slice(0, 12)}...`,
  )

  const failed: PendingMessage[] = []

  for (const msg of valid) {
    try {
      const text = `[${msg.title || 'Panda'}]\n${msg.body || ''}`
      const result = await server.client.callTool({
        name: toolName,
        arguments: _buildReplyArgs(channel, ctx, text),
      })
      if (_isCallToolErrorResult(result)) {
        logForDebugging(
          `[channelRegistry] Failed to flush pending notification to ${channel}: ${msg.title} (isError)`,
        )
        failed.push(msg)
      }
    } catch (e) {
      logForDebugging(
        `[channelRegistry] Failed to flush pending notification to ${channel}: ${msg.title} (${(e as Error)?.message || e})`,
      )
      failed.push(msg)
    }
  }

  if (failed.length > 0) {
    // 失败消息回写队首，保留可重试语义
    _pendingMessages.unshift(...failed)
    while (_pendingMessages.length > MAX_PENDING) {
      _pendingMessages.pop()
    }
    logForDebugging(
      `[channelRegistry] Re-queued ${failed.length} failed pending notification(s) (${_pendingMessages.length} pending)`,
    )
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

/**
 * 测试用：清空 servers / contexts / pending，避免用例间状态串扰。
 * @internal
 */
export function resetChannelRegistryForTests(): void {
  _servers.clear()
  _contexts.clear()
  _lastActiveUser.clear()
  _diskLoaded.clear()
  _pendingMessages.length = 0
}
