/**
 * OpenAI / Codex OAuth login flow.
 *
 * Implements the full PKCE browser-based OAuth flow against OpenAI's auth
 * server, exchanging the resulting id_token for an OpenAI API key.
 */

import axios from 'axios'
import { createHash, randomBytes } from 'crypto'
import { createServer, type Server } from 'http'
import type { AddressInfo } from 'net'
import { openBrowser } from '../utils/browser.js'

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

// ─── Token exchange helpers ──────────────────────────────────────────────────

async function exchangeCodeForTokens(params: {
  code: string
  port: number
  codeVerifier: string
}): Promise<{ id_token: string; access_token: string; refresh_token?: string }> {
  const redirectUri = `http://localhost:${params.port}${OPENAI_REDIRECT_PATH}`

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: redirectUri,
    client_id: OPENAI_CLIENT_ID,
    code_verifier: params.codeVerifier,
  })

  const response = await axios.post(
    `${OPENAI_ISSUER}/oauth/token`,
    body.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      validateStatus: () => true,
    },
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
  }
}

async function exchangeTokenForApiKey(idToken: string): Promise<string> {
  if (!idToken) {
    throw new Error('exchangeTokenForApiKey: idToken is falsy (missing or empty). The token exchange step likely did not return an id_token.')
  }

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    client_id: OPENAI_CLIENT_ID,
    requested_token: 'openai-api-key',
    subject_token: idToken,
    subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
  })

  const response = await axios.post(
    `${OPENAI_ISSUER}/oauth/token`,
    body.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      validateStatus: () => true,
    },
  )

  if (response.status < 200 || response.status >= 300) {
    const text =
      typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data)
    throw new Error(`API key exchange failed (${response.status}): ${text}`)
  }

  const data = response.data as { access_token: string }
  return data.access_token
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function openaiOAuthLogin(): Promise<{ apiKey: string }> {
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

  // 6. Exchange id_token → API key
  process.stdout.write('Obtaining API key...\n')
  const apiKey = await exchangeTokenForApiKey(tokens.id_token)

  return { apiKey }
}
