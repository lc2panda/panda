/**
 * Unit tests for the OpenAI OAuth transport helpers.
 *
 * Covers the pieces introduced in v2.21.23:
 *   1. postFormViaCurl — parses stdout body + trailing http_code
 *   2. postFormViaCurl — ENOENT raises CurlNotAvailableError
 *   3. postFormViaCurl — non-parseable body stays a string
 *   4. postFormViaAxiosWithCA — reads CA file, attaches https.Agent with ca
 *
 * Note: the top-level `postForm` dispatcher switches on
 * `globalThis.Bun`, which is a read-only global under Bun and cannot be
 * monkey-patched in a unit test. Its branches are covered indirectly —
 * the two transport primitives below are the only things that actually
 * touch the network or TLS stack, and they are fully exercised here.
 *
 * Input:  mocked axios / child_process.execFile / fs.readFileSync
 * Output: assertions on response shape and error messages
 * Pos:    src/services/openai-oauth.ts — TLS transport layer for OpenAI auth
 */

import { test, expect, mock, afterEach } from 'bun:test'

afterEach(() => {
  mock.restore()
})

// ─── postFormViaCurl: happy path — JSON body + trailing http_code ────────────

test('postFormViaCurl parses stdout body + trailing http_code', async () => {
  const cp = await import('node:child_process')
  mock.module('child_process', () => ({
    ...cp,
    execFile: (
      _bin: string,
      _args: string[],
      _opts: unknown,
      cb: (err: Error | null, out: { stdout: string; stderr: string }) => void,
    ) => {
      cb(null, { stdout: '{"access_token":"t1","id_token":"i1"}\n200', stderr: '' })
    },
  }))

  const mod = await import('./openai-oauth.js?curl-happy=1')
  const { postFormViaCurl } = mod.__testing

  const res = await postFormViaCurl('https://auth.openai.com/oauth/token', 'k=v', 5000)
  expect(res.status).toBe(200)
  expect(res.data).toEqual({ access_token: 't1', id_token: 'i1' })
})

// ─── postFormViaCurl: ENOENT → CurlNotAvailableError ─────────────────────────

test('postFormViaCurl throws CurlNotAvailableError on ENOENT', async () => {
  const cp = await import('node:child_process')
  mock.module('child_process', () => ({
    ...cp,
    execFile: (
      _bin: string,
      _args: string[],
      _opts: unknown,
      cb: (err: NodeJS.ErrnoException | null) => void,
    ) => {
      const err = Object.assign(new Error('spawn curl ENOENT'), { code: 'ENOENT' })
      cb(err)
    },
  }))

  const mod = await import('./openai-oauth.js?curl-enoent=1')
  const { postFormViaCurl, CurlNotAvailableError } = mod.__testing

  let caught: unknown
  try {
    await postFormViaCurl('https://auth.openai.com/oauth/token', 'k=v', 5000)
  } catch (e) {
    caught = e
  }
  expect(caught).toBeInstanceOf(CurlNotAvailableError)
})

// ─── postFormViaCurl: non-JSON body stays a string ───────────────────────────

test('postFormViaCurl leaves non-JSON body as raw string', async () => {
  const cp = await import('node:child_process')
  mock.module('child_process', () => ({
    ...cp,
    execFile: (
      _bin: string,
      _args: string[],
      _opts: unknown,
      cb: (err: Error | null, out: { stdout: string; stderr: string }) => void,
    ) => {
      cb(null, { stdout: 'Internal Server Error\n500', stderr: '' })
    },
  }))

  const mod = await import('./openai-oauth.js?curl-textbody=1')
  const { postFormViaCurl } = mod.__testing

  const res = await postFormViaCurl('https://auth.openai.com/oauth/token', 'k=v', 5000)
  expect(res.status).toBe(500)
  expect(res.data).toBe('Internal Server Error')
})

// ─── postFormViaAxiosWithCA: reads CA, injects https.Agent ───────────────────

test('postFormViaAxiosWithCA reads CA file and attaches it via https.Agent', async () => {
  // Use a real temp file on disk to avoid monkey-patching `fs` globally,
  // which would bleed into unrelated test files sharing the same test run.
  const { writeFileSync, unlinkSync, mkdtempSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')

  const dir = mkdtempSync(join(tmpdir(), 'panda-oauth-ca-'))
  const caPath = join(dir, 'ca.pem')
  const caPem = '-----BEGIN CERTIFICATE-----\nPEM-BYTES\n-----END CERTIFICATE-----\n'
  writeFileSync(caPath, caPem)

  let capturedUrl = ''
  let capturedAgentCa: unknown = undefined
  mock.module('axios', () => ({
    default: {
      post: async (
        url: string,
        _body: string,
        cfg: { httpsAgent?: { options?: { ca?: unknown } } },
      ) => {
        capturedUrl = url
        capturedAgentCa = cfg.httpsAgent?.options?.ca
        return { status: 200, data: { access_token: 'via-ca' } }
      },
    },
  }))

  try {
    const mod = await import('./openai-oauth.js?axios-ca=1')
    const { postFormViaAxiosWithCA } = mod.__testing

    const res = await postFormViaAxiosWithCA(
      'https://auth.openai.com/oauth/token',
      'k=v',
      caPath,
      3000,
    )
    expect(res.status).toBe(200)
    expect(res.data).toEqual({ access_token: 'via-ca' })
    expect(capturedUrl).toBe('https://auth.openai.com/oauth/token')
    // The Agent stores the ca on its internal options; accept Buffer or string.
    const caStr = Buffer.isBuffer(capturedAgentCa)
      ? capturedAgentCa.toString()
      : String(capturedAgentCa)
    expect(caStr).toContain('PEM-BYTES')
  } finally {
    try { unlinkSync(caPath) } catch {}
  }
})
