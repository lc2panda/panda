// Input:  HTTP requests from Electron main process (proxied from chat renderer)
// Output: Forwarded requests/responses to/from Panda CLI
// Pos:    Bridge extension — connects chat BrowserWindow to CLI via HTTP/SSE
//
// [NEW-FILE:#20260421-10]
// 6 chat endpoints for Wave 2 M0-10:
//   POST /chat/send        — send message to CLI
//   GET  /chat/stream/:id  — SSE streaming response (per session)
//   POST /chat/session      — create new session
//   GET  /chat/sessions     — list all sessions
//   POST /chat/stop/:id     — abort current conversation
//   POST /chat/tool/approve — tool permission approval

import type { IncomingMessage, ServerResponse } from 'node:http'

import { log as deskLog } from '../util/logger.js'

// ─────────────────────────────────────────────────────────────────────────────
// Types — chat-specific request/response shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatSendRequest {
  sessionId: string
  content: string
  attachments?: Array<{
    type: 'file' | 'image'
    path: string
    name?: string
  }>
}

export interface ChatSendResponse {
  ok: true
  messageId: string
}

export interface ChatSessionCreateRequest {
  cwd?: string
  name?: string
}

export interface ChatSessionInfo {
  id: string
  name: string
  cwd: string
  createdAt: number
  lastActiveAt: number
}

export interface ChatSessionCreateResponse {
  id: string
  name: string
  cwd: string
}

export interface ChatSessionsResponse {
  sessions: ChatSessionInfo[]
}

export interface ChatStopResponse {
  ok: true
}

export interface ChatToolApproveRequest {
  sessionId: string
  toolUseId: string
  decision: 'approve' | 'deny'
}

export interface ChatToolApproveResponse {
  ok: true
}

export interface ChatStreamEvent {
  type: 'connected' | 'text' | 'tool_use' | 'tool_result' | 'error' | 'done'
  sessionId: string
  data?: unknown
}

export interface ChatErrorResponse {
  ok: false
  error: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE client management (chat-specific, separate from state SSE hub)
// ─────────────────────────────────────────────────────────────────────────────

interface ChatSseClient {
  res: ServerResponse
  sessionId: string
}

class ChatSseHub {
  private clients = new Set<ChatSseClient>()

  add(res: ServerResponse, sessionId: string): ChatSseClient {
    const client: ChatSseClient = { res, sessionId }
    this.clients.add(client)
    res.on('close', () => this.clients.delete(client))
    return client
  }

  /** Send event to all clients subscribed to a specific session */
  sendToSession(sessionId: string, event: ChatStreamEvent): void {
    const payload = `data: ${JSON.stringify(event)}\n\n`
    for (const c of this.clients) {
      if (c.sessionId !== sessionId) continue
      try {
        c.res.write(payload)
      } catch {
        this.clients.delete(c)
      }
    }
  }

  /** Broadcast to all connected chat SSE clients */
  broadcast(event: ChatStreamEvent): void {
    const payload = `data: ${JSON.stringify(event)}\n\n`
    for (const c of this.clients) {
      try {
        c.res.write(payload)
      } catch {
        this.clients.delete(c)
      }
    }
  }

  closeAll(): void {
    for (const c of this.clients) {
      try {
        c.res.end()
      } catch {
        // ignore
      }
    }
    this.clients.clear()
  }

  size(): number {
    return this.clients.size
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Body parser (reuse the same pattern as server.ts readJsonBody)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CHAT_BODY_BYTES = 256 * 1024 // 256KB — chat messages can be larger

function readChatBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let bytes = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      bytes += c.length
      if (bytes > MAX_CHAT_BODY_BYTES) {
        req.destroy()
        reject(new Error('payload-too-large'))
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8')
        resolve(raw.length === 0 ? null : JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function jsonRes(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload).toString(),
  })
  res.end(payload)
}

// ─────────────────────────────────────────────────────────────────────────────
// Route matcher — extract :id from paths like /chat/stream/:id
// ─────────────────────────────────────────────────────────────────────────────

function matchRoute(
  url: string,
  method: string,
  expectedMethod: string,
  pattern: string,
): { matched: boolean; params: Record<string, string> } {
  if (method !== expectedMethod) return { matched: false, params: {} }

  // Strip query string
  const path = url.split('?')[0]!

  // Split both pattern and path into segments
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return { matched: false, params: {} }

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!
    const vp = pathParts[i]!
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(vp)
    } else if (pp !== vp) {
      return { matched: false, params: {} }
    }
  }
  return { matched: true, params }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat endpoint handler — called from server.ts for /chat/* routes
// ─────────────────────────────────────────────────────────────────────────────

const chatSseHub = new ChatSseHub()

/**
 * Handle a /chat/* request. Returns true if the route was matched and handled,
 * false if the URL doesn't start with /chat/ (caller should fall through to 404).
 *
 * This function is designed to integrate with the existing raw http.createServer
 * pattern in server.ts — no framework dependency.
 */
export async function handleChatRoute(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = req.url ?? ''
  const method = req.method ?? 'GET'

  // Quick prefix check — only handle /chat/ routes
  if (!url.startsWith('/chat/') && url !== '/chat') return false

  // ── 1. POST /chat/send — send message to CLI session
  if (method === 'POST' && url === '/chat/send') {
    try {
      const body = (await readChatBody(req)) as ChatSendRequest | null
      if (!body || !body.sessionId || !body.content) {
        jsonRes(res, 400, { ok: false, error: 'sessionId and content required' } satisfies ChatErrorResponse)
        return true
      }
      // TODO M2: forward to CLI QueryEngine via IPC
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      deskLog.info(`[bridge:chat] send to session ${body.sessionId}: ${body.content.substring(0, 80)}...`)

      const response: ChatSendResponse = { ok: true, messageId }
      jsonRes(res, 200, response)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      jsonRes(res, 400, { ok: false, error: msg } satisfies ChatErrorResponse)
    }
    return true
  }

  // ── 2. GET /chat/stream/:id — SSE stream for a session
  {
    const { matched, params } = matchRoute(url, method, 'GET', '/chat/stream/:id')
    if (matched) {
      const sessionId = params.id!

      // SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      })

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          res.write(': heartbeat\n\n')
        } catch {
          clearInterval(heartbeat)
        }
      }, 15_000)

      // Register SSE client
      chatSseHub.add(res, sessionId)

      // Send initial connected event
      const connEvent: ChatStreamEvent = { type: 'connected', sessionId }
      res.write(`data: ${JSON.stringify(connEvent)}\n\n`)

      // TODO M2: subscribe to CLI session's streaming output and pipe events

      req.on('close', () => {
        clearInterval(heartbeat)
        deskLog.info(`[bridge:chat] SSE disconnected for session ${sessionId}`)
      })
      return true
    }
  }

  // ── 3. POST /chat/session — create new session
  if (method === 'POST' && url === '/chat/session') {
    try {
      const body = (await readChatBody(req)) as ChatSessionCreateRequest | null
      // TODO M2: create real session via CLI spawn or IPC
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const now = Date.now()
      deskLog.info(`[bridge:chat] create session: ${body?.name || 'unnamed'} at ${body?.cwd || process.cwd()}`)

      const response: ChatSessionCreateResponse = {
        id: sessionId,
        name: body?.name || 'New Chat',
        cwd: body?.cwd || process.cwd(),
      }
      jsonRes(res, 200, response)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      jsonRes(res, 400, { ok: false, error: msg } satisfies ChatErrorResponse)
    }
    return true
  }

  // ── 4. GET /chat/sessions — list all sessions
  if (method === 'GET' && url === '/chat/sessions') {
    // TODO M2: read real session list from CLI
    const response: ChatSessionsResponse = { sessions: [] }
    jsonRes(res, 200, response)
    return true
  }

  // ── 5. POST /chat/stop/:id — abort current conversation
  {
    const { matched, params } = matchRoute(url, method, 'POST', '/chat/stop/:id')
    if (matched) {
      const sessionId = params.id!
      deskLog.info(`[bridge:chat] stop session ${sessionId}`)
      // TODO M2: send abort signal to CLI via IPC
      const response: ChatStopResponse = { ok: true }
      jsonRes(res, 200, response)
      return true
    }
  }

  // ── 6. POST /chat/tool/approve — tool permission approval
  if (method === 'POST' && url === '/chat/tool/approve') {
    try {
      const body = (await readChatBody(req)) as ChatToolApproveRequest | null
      if (!body || !body.sessionId || !body.toolUseId || !body.decision) {
        jsonRes(res, 400, {
          ok: false,
          error: 'sessionId, toolUseId, and decision required',
        } satisfies ChatErrorResponse)
        return true
      }
      if (body.decision !== 'approve' && body.decision !== 'deny') {
        jsonRes(res, 400, {
          ok: false,
          error: 'decision must be "approve" or "deny"',
        } satisfies ChatErrorResponse)
        return true
      }
      deskLog.info(`[bridge:chat] tool approve: ${body.toolUseId} -> ${body.decision}`)
      // TODO M2: forward permission decision to CLI
      const response: ChatToolApproveResponse = { ok: true }
      jsonRes(res, 200, response)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      jsonRes(res, 400, { ok: false, error: msg } satisfies ChatErrorResponse)
    }
    return true
  }

  // No /chat/ route matched — return false so server.ts sends 404
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API for other modules to push events into chat SSE streams
// ─────────────────────────────────────────────────────────────────────────────

/** Push a streaming event to all SSE clients of a specific session */
export function pushChatEvent(sessionId: string, event: ChatStreamEvent): void {
  chatSseHub.sendToSession(sessionId, event)
}

/** Close all chat SSE connections (called during server shutdown) */
export function closeChatSseHub(): void {
  chatSseHub.closeAll()
}

// Test / diagnostic export
export const __chatInternals = {
  chatSseHub,
  matchRoute,
  readChatBody,
}
