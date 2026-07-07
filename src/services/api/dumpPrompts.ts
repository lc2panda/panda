import type { ClientOptions } from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { dirname, join } from 'path'
import { getSessionId } from 'src/bootstrap/state.js'
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'

function hashString(str: string): string {
  return createHash('sha256').update(str).digest('hex')
}

// Cache last few API requests for ant users (e.g., for /issue command)
const MAX_CACHED_REQUESTS = 5
const cachedApiRequests: Array<{ timestamp: string; request: unknown }> = []

type DumpState = {
  initialized: boolean
  messageCountSeen: number
  lastInitDataHash: string
  // Cheap proxy for change detection — skips the expensive stringify+hash
  // when model/tools/system are structurally identical to the last call.
  lastInitFingerprint: string
}

// Track state per session to avoid duplicating data
const dumpState = new Map<string, DumpState>()

export function getLastApiRequests(): Array<{
  timestamp: string
  request: unknown
}> {
  return [...cachedApiRequests]
}

export function clearApiRequestCache(): void {
  cachedApiRequests.length = 0
}

export function clearDumpState(agentIdOrSessionId: string): void {
  dumpState.delete(agentIdOrSessionId)
}

export function clearAllDumpState(): void {
  dumpState.clear()
}

export function addApiRequestToCache(requestData: unknown): void {
  if (process.env.USER_TYPE !== 'ant') return
  cachedApiRequests.push({
    timestamp: new Date().toISOString(),
    request: requestData,
  })
  if (cachedApiRequests.length > MAX_CACHED_REQUESTS) {
    cachedApiRequests.shift()
  }
}

export function getDumpPromptsPath(agentIdOrSessionId?: string): string {
  return join(
    getClaudeConfigHomeDir(),
    'dump-prompts',
    `${agentIdOrSessionId ?? getSessionId()}.jsonl`,
  )
}

function appendToFile(filePath: string, entries: string[]): void {
  if (entries.length === 0) return
  fs.mkdir(dirname(filePath), { recursive: true })
    .then(() => fs.appendFile(filePath, entries.join('\n') + '\n'))
    .catch(() => {})
}

function initFingerprint(req: Record<string, unknown>): string {
  const tools = req.tools as Array<{ name?: string }> | undefined
  const system = req.system as unknown[] | string | undefined
  const sysLen =
    typeof system === 'string'
      ? system.length
      : Array.isArray(system)
        ? system.reduce(
            (n: number, b) => n + ((b as { text?: string }).text?.length ?? 0),
            0,
          )
        : 0
  const toolNames = tools?.map(t => t.name ?? '').join(',') ?? ''
  return `${req.model}|${toolNames}|${sysLen}`
}

/**
 * Compute a compact per-request summary for cache-diagnostics截面对比.
 * Includes stable byte-level hashes of system + tools so that字节级 prefix
 * drift can be detected even when initFingerprint (model|names|sysLen)
 * happens to collide across turns.
 */
function computeRequestSummary(
  req: Record<string, unknown>,
  requestId: string,
  ts: string,
): Record<string, unknown> {
  const system = req.system as unknown
  const tools = req.tools as Array<{ name?: string }> | undefined
  const messages = (req.messages ?? []) as Array<{ role?: string }>

  const systemStr =
    typeof system === 'string'
      ? system
      : system !== undefined
        ? JSON.stringify(system)
        : ''
  const systemLen =
    typeof system === 'string'
      ? system.length
      : Array.isArray(system)
        ? (system as Array<unknown>).reduce<number>(
            (n, b) => n + ((b as { text?: string }).text?.length ?? 0),
            0,
          )
        : 0
  const toolsStr = tools !== undefined ? JSON.stringify(tools) : ''

  const summary: Record<string, unknown> = {
    type: 'request',
    timestamp: ts,
    requestId,
    model: req.model ?? null,
    stream: req.stream ?? null,
    messagesCount: messages.length,
    systemHash: systemStr ? hashString(systemStr) : null,
    systemLen,
    toolsHash: toolsStr ? hashString(toolsStr) : null,
    toolCount: tools?.length ?? 0,
  }
  if (req.temperature !== undefined) summary.temperature = req.temperature
  if (req.max_tokens !== undefined) summary.max_tokens = req.max_tokens
  if (req.thinking !== undefined) summary.thinking = req.thinking
  if (req.metadata !== undefined) summary.metadata = req.metadata
  return summary
}

function dumpRequest(
  body: string,
  ts: string,
  requestId: string,
  state: DumpState,
  filePath: string,
  shouldDump: boolean,
): void {
  try {
    const req = jsonParse(body) as Record<string, unknown>
    if (shouldDump) {
      addApiRequestToCache(req)
    }

    if (!shouldDump) return
    const entries: string[] = []
    const messages = (req.messages ?? []) as Array<{ role?: string }>

    // 1. Write init data (system, tools, metadata) on first request,
    //    and a system_update entry whenever it changes.
    // Cheap fingerprint first: system+tools don't change between turns,
    // so skip the 300ms stringify when the shape is unchanged.
    const fingerprint = initFingerprint(req)
    if (!state.initialized || fingerprint !== state.lastInitFingerprint) {
      const { messages: _, ...initData } = req
      const initDataStr = jsonStringify(initData)
      const initDataHash = hashString(initDataStr)
      state.lastInitFingerprint = fingerprint
      if (!state.initialized) {
        state.initialized = true
        state.lastInitDataHash = initDataHash
        // Reuse initDataStr rather than re-serializing initData inside a wrapper.
        // timestamp from toISOString() contains no chars needing JSON escaping.
        entries.push(
          `{"type":"init","timestamp":"${ts}","data":${initDataStr}}`,
        )
      } else if (initDataHash !== state.lastInitDataHash) {
        state.lastInitDataHash = initDataHash
        entries.push(
          `{"type":"system_update","timestamp":"${ts}","data":${initDataStr}}`,
        )
      }
    }

    // 2. Always emit a per-turn request summary so that every真实 API 请求
    //    都有一条可配对的记录（requestId 关联后续 response）。
    //    记录保持轻量 (~300B)，system/tools 只存 SHA256 指纹，
    //    完整内容仍由 init + system_update 承担。
    entries.push(jsonStringify(computeRequestSummary(req, requestId, ts)))

    // 3. Write only new user messages (assistant messages captured in response)
    for (const msg of messages.slice(state.messageCountSeen)) {
      if (msg.role === 'user') {
        entries.push(
          jsonStringify({
            type: 'message',
            timestamp: ts,
            requestId,
            data: msg,
          }),
        )
      }
    }
    state.messageCountSeen = messages.length

    appendToFile(filePath, entries)
  } catch {
    // Ignore parsing errors
  }
}

/**
 * Generate a short, unique-enough request id for dump pairing.
 * Not cryptographic; collision-resistant for per-session pairing.
 */
function generateRequestId(): string {
  const rand = Math.random().toString(36).slice(2, 10)
  const t = Date.now().toString(36)
  return `req_${t}_${rand}`
}

export function createDumpPromptsFetch(
  agentIdOrSessionId: string,
): ClientOptions['fetch'] {
  const filePath = getDumpPromptsPath(agentIdOrSessionId)
  const shouldDump = process.env.USER_TYPE === 'ant'
  const fetchImpl = globalThis.fetch.bind(globalThis)

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const state = dumpState.get(agentIdOrSessionId) ?? {
      initialized: false,
      messageCountSeen: 0,
      lastInitDataHash: '',
      lastInitFingerprint: '',
    }
    dumpState.set(agentIdOrSessionId, state)

    let timestamp: string | undefined
    let requestId: string | undefined

    if (init?.method === 'POST' && init.body) {
      timestamp = new Date().toISOString()
      requestId = generateRequestId()
      // Parsing + stringifying the request (system prompt + tool schemas = MBs)
      // takes hundreds of ms. Defer so it doesn't block the actual API call —
      // this is debug tooling for /issue, not on the critical path.
      setImmediate(
        dumpRequest,
        init.body as string,
        timestamp,
        requestId,
        state,
        filePath,
        shouldDump,
      )
    }

    // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
    const response = await fetchImpl(input, init)

    // Save response async
    if (timestamp && response.ok && shouldDump) {
      const cloned = response.clone()
      void (async () => {
        try {
          const isStreaming = cloned.headers
            .get('content-type')
            ?.includes('text/event-stream')

          let data: unknown
          if (isStreaming && cloned.body) {
            // Panda v2.25.53+: 增量解析 SSE 流，避免内存峰值爆炸。
            // 旧实现：把整个流的所有 chunks 拼到单 string buffer（10000+ 个
            // content_block_delta event，单 message 累计 MB 级），并发 query
            // 时多份副本叠加（响应 .clone() + dump 完整 buffer 双份）。
            // 新实现：流式按 SSE event 分隔符 '\n\n' 切片，已完整 event 立即
            // 解析+push 后丢弃；只保留尾部最后一个不完整 event。内存峰值
            // 降到单 event 大小（KB 级）。落盘 jsonl 格式不变（仍为
            // { stream: true, chunks: [...] }）。
            const reader = cloned.body.getReader()
            const decoder = new TextDecoder()
            const chunks: unknown[] = []
            let buffer = ''
            const drainEvents = (): void => {
              // SSE event 分隔符为 '\n\n'。最后一段可能不完整 → 留回 buffer。
              let sepIdx: number
              while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
                const event = buffer.slice(0, sepIdx)
                buffer = buffer.slice(sepIdx + 2)
                for (const line of event.split('\n')) {
                  if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                      chunks.push(jsonParse(line.slice(6)))
                    } catch {
                      // Ignore parse errors
                    }
                  }
                }
              }
            }
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                drainEvents()
              }
              // 流结束后 flush 解码器尾部 + 处理可能没有 '\n\n' 收尾的最后 event
              buffer += decoder.decode()
              if (buffer.length > 0) {
                // 末尾缺分隔符的孤立 event（防御性）
                for (const line of buffer.split('\n')) {
                  if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                      chunks.push(jsonParse(line.slice(6)))
                    } catch {
                      // Ignore parse errors
                    }
                  }
                }
                buffer = ''
              }
            } finally {
              reader.releaseLock()
            }
            data = { stream: true, chunks }
          } else {
            data = await cloned.json()
          }

          await fs.appendFile(
            filePath,
            jsonStringify({
              type: 'response',
              timestamp,
              requestId,
              data,
            }) + '\n',
          )
        } catch {
          // Best effort
        }
      })()
    }

    return response
  }
}
