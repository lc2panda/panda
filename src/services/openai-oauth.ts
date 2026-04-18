/**
 * OpenAI / Codex OAuth login flow.
 *
 * Input:  交互式 PKCE 浏览器流 / env 中现存 refresh_token
 * Output: ChatGPT backend token 三元组 { accessToken, refreshToken, idToken, accountId, expiresAt }
 *         以及 refresh 时的新三元组（refresh_token 会轮换，必须覆盖保存）
 * Pos:    src/services/openai-oauth.ts — OAuth 前端 + token 仓库入口
 *
 * 契约：
 *   - id_token 里 namespaced claim "https://api.openai.com/auth" 含 chatgpt_account_id
 *   - refresh 使用 application/x-www-form-urlencoded，client_id=app_EMoamEEZ73f0CkXaXp7hrann
 *   - refresh 响应的 refresh_token 会轮换，漏存即下次 401（CLIProxyAPI 实测）
 *   - 并发 refresh 竞态用 module-level Promise 锁防抖（refreshLock）
 */

import axios from 'axios'
import { execFile } from 'child_process'
import { createHash, randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { createServer, type Server } from 'http'
import { Agent as HttpsAgent } from 'https'
import type { AddressInfo } from 'net'
import { promisify } from 'util'
import { openBrowser } from '../utils/browser.js'

const execFileAsync = promisify(execFile)

// ─── Constants ───────────────────────────────────────────────────────────────

const OPENAI_ISSUER = 'https://auth.openai.com'
const OPENAI_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann'
const OPENAI_DEFAULT_PORT = 1455
const OPENAI_SCOPES = 'openid profile email offline_access'
const OPENAI_REDIRECT_PATH = '/auth/callback'
const OPENAI_LOGIN_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

// ─── PKCE helpers ────────────────────────────────────────────────────────────

function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(64))
}

function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(createHash('sha256').update(verifier).digest())
}

function generateState(): string {
  return randomBytes(32).toString('hex')
}

// ─── Build authorization URL ─────────────────────────────────────────────────

function buildAuthorizationUrl(params: {
  port: number
  codeChallenge: string
  state: string
}): string {
  const redirectUri = `http://localhost:${params.port}${OPENAI_REDIRECT_PATH}`
  const url = new URL(`${OPENAI_ISSUER}/oauth/authorize`)
  url.searchParams.set('client_id', OPENAI_CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', OPENAI_SCOPES)
  url.searchParams.set('state', params.state)
  url.searchParams.set('code_challenge', params.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('codex_cli_simplified_flow', 'true')
  url.searchParams.set('id_token_add_organizations', 'true')
  url.searchParams.set('prompt', 'login')
  return url.toString()
}

// ─── Local callback server ───────────────────────────────────────────────────

function startCallbackServer(
  expectedState: string,
  preferredPort: number,
): Promise<{ code: string; port: number }> {
  return new Promise((resolve, reject) => {
    let settled = false

    const server: Server = createServer((req, res) => {
      const url = new URL(
        req.url || '/',
        `http://localhost:${(server.address() as AddressInfo).port}`,
      )

      if (url.pathname !== OPENAI_REDIRECT_PATH) {
        res.writeHead(404)
        res.end()
        return
      }

      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const error = url.searchParams.get('error')

      if (error) {
        const desc = url.searchParams.get('error_description') || error
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(
          '<html><body><h2>Login Failed</h2>' +
            `<p>${desc}</p>` +
            '<p>You can close this window.</p></body></html>',
        )
        server.close()
        if (!settled) {
          settled = true
          reject(new Error(`OAuth error: ${desc}`))
        }
        return
      }

      if (!code || state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html' })
        res.end(
          '<html><body><h2>Error</h2>' +
            '<p>Invalid state or missing code.</p></body></html>',
        )
        server.close()
        if (!settled) {
          settled = true
          reject(new Error('Invalid state or missing authorization code'))
        }
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(
        '<html><body><h2>Login Successful!</h2>' +
          '<p>You can close this window and return to your terminal.</p></body></html>',
      )

      const actualPort = (server.address() as AddressInfo).port
      server.close()
      if (!settled) {
        settled = true
        resolve({ code, port: actualPort })
      }
    })

    // If preferred port is busy, fall back to OS-assigned port
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(0, '127.0.0.1')
      } else if (!settled) {
        settled = true
        reject(err)
      }
    })

    // Timeout guard
    const timer = setTimeout(() => {
      server.close()
      if (!settled) {
        settled = true
        reject(new Error('OAuth login timed out after 5 minutes'))
      }
    }, OPENAI_LOGIN_TIMEOUT_MS)

    server.once('listening', () => {
      // Prevent timer from keeping the process alive if the server is closed
      timer.unref()
    })

    server.listen(preferredPort, '127.0.0.1')
  })
}

// ─── HTTP transport: axios / axios+CA / subprocess curl ──────────────────────
//
// Why three transports:
//   - Bun 1.3.x does NOT read Windows system CA store, so axios (which uses
//     node:https under Bun) fails TLS handshake against auth.openai.com when
//     a MITM proxy / enterprise CA is in use. Upstream issues:
//       anthropics/claude-code#31777, oven-sh/bun#27890
//   - curl (Windows curl.exe / macOS/Linux /usr/bin/curl) uses the system CA
//     bundle + honors HTTPS_PROXY, so it just works on Bun.
//   - PANDA_OAUTH_CA_FILE provides an explicit override for both Node and Bun.

interface PostFormResponse {
  status: number
  data: unknown
}

class CurlNotAvailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CurlNotAvailableError'
  }
}

/** Invoke system curl via child_process. System CA + system proxy honored. */
async function postFormViaCurl(
  url: string,
  body: string,
  timeoutMs: number,
): Promise<PostFormResponse> {
  const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
  const maxTimeSec = Math.max(1, Math.ceil(timeoutMs / 1000))
  // Windows 下 curl.exe 不读 WinHTTP/PAC 系统代理，必须显式 -x 透传
  // （和 chatgptBackendRequest 用同一个 detectSystemProxy）
  const args = [
    '-sS',
    '-X',
    'POST',
    '-H',
    'Content-Type: application/x-www-form-urlencoded',
    '--data',
    body,
    '--max-time',
    String(maxTimeSec),
    '-w',
    '\n%{http_code}',
  ]
  // 复用 openaiAdapter 的系统代理探测（PAC / 注册表 / env 三级）
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const adapterMod = require('./api/openaiAdapter.js') as {
      detectSystemProxyForOAuth?: () => string | undefined
    }
    const proxy = adapterMod.detectSystemProxyForOAuth?.()
    if (proxy) {
      args.push('-x', proxy)
    }
  } catch {
    // openaiAdapter 暴露的 detect 不可用 → 退回 env-only
    const envProxy =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy
    if (envProxy) args.push('-x', envProxy)
  }
  args.push(url)

  try {
    const { stdout } = await execFileAsync(curlBin, args, {
      env: { ...process.env },
      timeout: timeoutMs + 2000,
      maxBuffer: 10 * 1024 * 1024,
    })
    // Last line is %{http_code}, everything before is the body.
    const newlineIdx = stdout.lastIndexOf('\n')
    const rawBody = newlineIdx >= 0 ? stdout.slice(0, newlineIdx) : ''
    const statusLine = newlineIdx >= 0 ? stdout.slice(newlineIdx + 1) : stdout
    const status = parseInt(statusLine.trim(), 10)
    if (!Number.isFinite(status)) {
      throw new Error(
        `postFormViaCurl: could not parse http_code from curl output: ${JSON.stringify(stdout).slice(0, 200)}`,
      )
    }
    let data: unknown = rawBody
    if (rawBody.length > 0) {
      try {
        data = JSON.parse(rawBody)
      } catch {
        // Leave as string; caller renders it into an error message.
      }
    }
    return { status, data }
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string; code?: string | number }
    if (e && (e.code === 'ENOENT' || /ENOENT/.test(String(e.message || '')))) {
      throw new CurlNotAvailableError(
        `system ${curlBin} not found (ENOENT). Install curl or set PANDA_OAUTH_CA_FILE.`,
      )
    }
    const stderr = typeof e.stderr === 'string' ? e.stderr.trim() : ''
    const suffix = stderr ? ` | stderr: ${stderr}` : ''
    throw new Error(`curl exited non-zero for ${url}: ${e.message}${suffix}`)
  }
}

/** axios POST with explicit CA bundle loaded from PANDA_OAUTH_CA_FILE. */
async function postFormViaAxiosWithCA(
  url: string,
  body: string,
  caFile: string,
  timeoutMs: number,
): Promise<PostFormResponse> {
  const ca = readFileSync(caFile)
  const httpsAgent = new HttpsAgent({ ca, keepAlive: false })
  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
    timeout: timeoutMs,
    httpsAgent,
  })
  return { status: response.status, data: response.data }
}

/** Dispatcher picks the right transport per runtime and env. */
async function postForm(
  url: string,
  body: string,
  timeoutMs: number,
): Promise<PostFormResponse> {
  const caFile = process.env.PANDA_OAUTH_CA_FILE
  const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined'

  if (caFile) {
    return postFormViaAxiosWithCA(url, body, caFile, timeoutMs)
  }

  if (isBun) {
    try {
      return await postFormViaCurl(url, body, timeoutMs)
    } catch (err) {
      if (err instanceof CurlNotAvailableError) {
        throw new Error(
          `OpenAI login failed: Bun runtime requires system curl for TLS, ` +
            `but curl is not available. Install curl or set ` +
            `PANDA_OAUTH_CA_FILE to point at your CA certificate file.\n\n` +
            `Original error: ${err.message}`,
        )
      }
      throw err
    }
  }

  // Node runtime, no CA override — keep v2.21.22 axios path.
  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
    timeout: timeoutMs,
  })
  return { status: response.status, data: response.data }
}

// Exposed for unit tests only.
export const __testing = {
  postFormViaCurl,
  postFormViaAxiosWithCA,
  postForm,
  CurlNotAvailableError,
  // refresh 并发锁状态（测试用）
  isRefreshLockActive: () => refreshLock !== null,
}

// ─── Token exchange helpers ──────────────────────────────────────────────────

async function exchangeCodeForTokens(params: {
  code: string
  port: number
  codeVerifier: string
}): Promise<{
  id_token: string
  access_token: string
  refresh_token?: string
  expires_in?: number
}> {
  const redirectUri = `http://localhost:${params.port}${OPENAI_REDIRECT_PATH}`

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: redirectUri,
    client_id: OPENAI_CLIENT_ID,
    code_verifier: params.codeVerifier,
  })

  const response = await postForm(
    `${OPENAI_ISSUER}/oauth/token`,
    body.toString(),
    30000,
  )

  if (response.status < 200 || response.status >= 300) {
    const text =
      typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data)
    throw new Error(`Token exchange failed (${response.status}): ${text}`)
  }

  return response.data as {
    id_token: string
    access_token: string
    refresh_token?: string
    expires_in?: number
  }
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

export interface OpenAITokenBundle {
  accessToken: string
  refreshToken: string
  idToken: string
  accountId: string | null
  email: string | null
  /** unix ms epoch; set conservatively to 28 minutes from issuance (tokens live 30m) */
  expiresAt: number
}

/**
 * 解析 JWT payload 段（不校验签名，仅读 claim）。
 * OpenAI 的 id_token 里带 namespaced claim:
 *   payload["https://api.openai.com/auth"].chatgpt_account_id
 */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    // base64url → base64
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? b64 : b64 + '='.repeat(4 - (b64.length % 4))
    const json = Buffer.from(pad, 'base64').toString('utf-8')
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * 从 JWT payload 抽取 chatgpt_account_id。
 * CLIProxyAPI 实测：claim key 必须是 URL 形式 "https://api.openai.com/auth"，不能用点路径。
 */
export function extractAccountId(token: string): string | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  const authClaim = payload['https://api.openai.com/auth'] as
    | Record<string, unknown>
    | undefined
  if (!authClaim || typeof authClaim !== 'object') return null
  const id = authClaim['chatgpt_account_id']
  return typeof id === 'string' && id.length > 0 ? id : null
}

export function extractEmail(token: string): string | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  const email = payload['email']
  return typeof email === 'string' && email.length > 0 ? email : null
}

/**
 * 作战线 N：从 id_token 解 chatgpt_plan_type（free/plus/pro/team/enterprise）
 * 用途：Codex 模型候选列表分派（free 走 mini 列表，paid 走 full 列表）。
 * Claim 路径与 account_id 同源：`https://api.openai.com/auth`.chatgpt_plan_type
 * 未找到返回 null（调用方应 fallback 到 free 策略以免误给 free 账户发 paid-only 模型）
 */
export function extractPlanType(token: string): string | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  const authClaim = payload['https://api.openai.com/auth'] as
    | Record<string, unknown>
    | undefined
  if (!authClaim || typeof authClaim !== 'object') return null
  const pt = authClaim['chatgpt_plan_type']
  return typeof pt === 'string' && pt.length > 0 ? pt : null
}

// ─── Token refresh (with module-level concurrency lock) ──────────────────────

// 防并发：多个请求同时到期触发 refresh，会同时 POST 两次 /oauth/token，
// 第二次拿到的 refresh_token 会被第一次覆盖，然后第二次的 rt 作废 → 401。
// 用 module-level Promise 锁保证同一时刻只有一次 refresh 飞行。
let refreshLock: Promise<OpenAITokenBundle> | null = null

export async function refreshOpenAIAccessToken(
  currentRefreshToken: string,
): Promise<OpenAITokenBundle> {
  if (!currentRefreshToken) {
    throw new Error('refreshOpenAIAccessToken: refreshToken is empty')
  }
  if (refreshLock) return refreshLock

  refreshLock = (async (): Promise<OpenAITokenBundle> => {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentRefreshToken,
        client_id: OPENAI_CLIENT_ID,
        scope: OPENAI_SCOPES,
      })
      const response = await postForm(
        `${OPENAI_ISSUER}/oauth/token`,
        body.toString(),
        30000,
      )
      if (response.status < 200 || response.status >= 300) {
        const text =
          typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data)
        throw new Error(`Token refresh failed (${response.status}): ${text}`)
      }
      const data = response.data as {
        access_token: string
        refresh_token?: string
        id_token?: string
        expires_in?: number
      }
      const newIdToken = data.id_token || ''
      // 保守估计：expires_in 若缺失则默认 30min，再留 2min 余量
      const ttlSec =
        typeof data.expires_in === 'number' && data.expires_in > 0
          ? data.expires_in
          : 30 * 60
      const expiresAt = Date.now() + Math.max(60, ttlSec - 120) * 1000
      return {
        accessToken: data.access_token,
        // 必须回写新 rt；如果 server 未轮换（兜底），保留旧的
        refreshToken: data.refresh_token || currentRefreshToken,
        idToken: newIdToken,
        accountId: newIdToken ? extractAccountId(newIdToken) : null,
        email: newIdToken ? extractEmail(newIdToken) : null,
        expiresAt,
      }
    } finally {
      refreshLock = null
    }
  })()

  return refreshLock
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function openaiOAuthLogin(): Promise<OpenAITokenBundle> {
  // 1. PKCE + state
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const state = generateState()

  // 2. Start local callback server (try preferred port, fall back to random)
  const serverPromise = startCallbackServer(state, OPENAI_DEFAULT_PORT)

  // Give the server a moment to bind before we open the browser
  await new Promise(resolve => setTimeout(resolve, 100))

  // 3. Build auth URL & open browser
  // We use the preferred port for the URL; if the server fell back to a
  // random port the redirect will fail gracefully and the user can retry.
  const authUrl = buildAuthorizationUrl({
    port: OPENAI_DEFAULT_PORT,
    codeChallenge,
    state,
  })

  process.stdout.write('\nOpening browser for OpenAI login...\n')
  process.stdout.write('If the browser doesn\'t open, visit this URL:\n\n')
  process.stdout.write(authUrl + '\n\n')

  await openBrowser(authUrl)

  // 4. Wait for the callback
  process.stdout.write('Waiting for authentication...\n')
  const { code, port: actualPort } = await serverPromise

  // 5. Exchange authorization code → tokens
  process.stdout.write('Exchanging authorization code for tokens...\n')
  const tokens = await exchangeCodeForTokens({
    code,
    port: actualPort,
    codeVerifier,
  })

  if (!tokens.access_token) {
    throw new Error('OAuth succeeded but server did not return access_token')
  }
  if (!tokens.refresh_token) {
    throw new Error(
      'OAuth succeeded but server did not return refresh_token. ' +
        'The "offline_access" scope may be missing or declined.',
    )
  }

  // 6. 解 id_token 拿 chatgpt_account_id（ChatGPT backend 必需 header）
  process.stdout.write('Decoding ChatGPT account id...\n')
  const accountId = tokens.id_token ? extractAccountId(tokens.id_token) : null
  const email = tokens.id_token ? extractEmail(tokens.id_token) : null
  if (!accountId) {
    throw new Error(
      'OAuth succeeded but id_token did not contain chatgpt_account_id. ' +
        'The namespaced claim "https://api.openai.com/auth" is missing.',
    )
  }

  // TTL 三级优先：OAuth 响应 expires_in → id_token 的 exp claim → 兜底 10 天
  // CLIProxyAPI 实测样本 access_token iat→exp ≈ 10 天（864001s），不是 30min
  let ttlSec: number
  if (typeof tokens.expires_in === 'number' && tokens.expires_in > 60) {
    ttlSec = tokens.expires_in
  } else {
    const payload = tokens.id_token ? decodeJwtPayload(tokens.id_token) : null
    const jwtExp =
      payload && typeof payload.exp === 'number'
        ? (payload.exp as number)
        : null
    if (jwtExp && jwtExp * 1000 > Date.now()) {
      ttlSec = jwtExp - Math.floor(Date.now() / 1000)
    } else {
      ttlSec = 10 * 24 * 60 * 60 // 10-day fallback
    }
  }
  const expiresAt = Date.now() + Math.max(60, ttlSec - 120) * 1000

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    accountId,
    email,
    expiresAt,
  }
}
