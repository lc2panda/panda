
function importFresh<T>(specifier: string): Promise<T> {
  return import(specifier) as Promise<T>
}
/**
 * 阶段 1 单元测试 — JWT 解析 + refresh_token 轮换 + 并发锁
 *
 * Input:  各类 JWT payload / mock 过的 postForm
 * Output: 断言 accountId/email 提取、refresh 结果结构、并发锁行为
 * Pos:    src/services/openai-oauth.ts — OAuth 后端新增逻辑单测入口
 *
 * NEW-FILE:#20260417-01
 */

import { test, expect, mock, afterEach } from 'bun:test'

afterEach(() => {
  mock.restore()
})

// ─── helper: 构造合法 JWT 的中段（base64url payload） ────────────────────────

function b64url(obj: unknown): string {
  const json = JSON.stringify(obj)
  return Buffer.from(json, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function makeJwt(payload: Record<string, unknown>): string {
  // 固定 header/sig，只要结构是三段、中段能解就够
  const header = b64url({ alg: 'RS256', typ: 'JWT' })
  const sig = 'sig'
  return `${header}.${b64url(payload)}.${sig}`
}

// ─── decodeJwtPayload / extractAccountId / extractEmail ──────────────────────

test('decodeJwtPayload 解合法 JWT 中段', async () => {
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?jwt-decode=1')
  const jwt = makeJwt({ foo: 'bar', n: 42 })
  const payload = mod.decodeJwtPayload(jwt)
  expect(payload).toEqual({ foo: 'bar', n: 42 })
})

test('decodeJwtPayload 非法输入返回 null', async () => {
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?jwt-decode-null=1')
  expect(mod.decodeJwtPayload('')).toBeNull()
  expect(mod.decodeJwtPayload('not-a-jwt')).toBeNull()
  expect(mod.decodeJwtPayload('a.b')).toBeNull()
  expect(mod.decodeJwtPayload('a.%%%.c')).toBeNull()
})

test('extractAccountId 读 namespaced claim (URL 形式)', async () => {
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?jwt-acc=1')
  const jwt = makeJwt({
    'https://api.openai.com/auth': {
      chatgpt_account_id: 'acct-abc123',
    },
    email: 'x@y.com',
  })
  expect(mod.extractAccountId(jwt)).toBe('acct-abc123')
})

test('extractAccountId 不存在 claim 时返回 null', async () => {
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?jwt-acc-null=1')
  expect(mod.extractAccountId(makeJwt({ other: 'x' }))).toBeNull()
  expect(
    mod.extractAccountId(
      makeJwt({ 'https://api.openai.com/auth': { nothing: 'here' } }),
    ),
  ).toBeNull()
})

test('extractEmail 读 email claim', async () => {
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?jwt-email=1')
  const jwt = makeJwt({ email: 'commander@example.com' })
  expect(mod.extractEmail(jwt)).toBe('commander@example.com')
})

// ─── 作战线 N: extractPlanType ──────────────────────────────────────────────

test('extractPlanType 读 namespaced claim 的 chatgpt_plan_type', async () => {
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?jwt-plan=1')
  const jwt = makeJwt({
    'https://api.openai.com/auth': {
      chatgpt_account_id: 'acct-x',
      chatgpt_plan_type: 'plus',
    },
  })
  expect(mod.extractPlanType(jwt)).toBe('plus')
})

test('extractPlanType 无 claim 时返回 null', async () => {
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?jwt-plan-null=1')
  expect(mod.extractPlanType(makeJwt({ foo: 'bar' }))).toBeNull()
  expect(
    mod.extractPlanType(
      makeJwt({ 'https://api.openai.com/auth': { chatgpt_account_id: 'a' } }),
    ),
  ).toBeNull()
})

// ─── refreshOpenAIAccessToken: 成功响应 + refresh_token 轮换 ─────────────────

// 强制走 axios 分支（Bun 默认走 curl；mock 不到 native 子进程）
// 两种策略：设 PANDA_OAUTH_CA_FILE 触发 postFormViaAxiosWithCA；或直接 mock 整个
// postForm 的上游 axios.post。这里用 CA file + mock axios 的组合。
async function setupAxiosMock(
  respond: () => { status: number; data: unknown },
): Promise<string> {
  const { writeFileSync, mkdtempSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const dir = mkdtempSync(join(tmpdir(), 'panda-oauth-jwt-'))
  const caPath = join(dir, 'ca.pem')
  writeFileSync(caPath, '-----BEGIN CERTIFICATE-----\nX\n-----END CERTIFICATE-----\n')
  process.env.PANDA_OAUTH_CA_FILE = caPath
  mock.module('axios', () => ({
    default: {
      post: async () => respond(),
    },
  }))
  return caPath
}

afterEach(() => {
  delete process.env.PANDA_OAUTH_CA_FILE
})

test('refreshOpenAIAccessToken 返回新 bundle 并保留轮换 rt', async () => {
  const newIdToken = makeJwt({
    'https://api.openai.com/auth': { chatgpt_account_id: 'acct-new' },
    email: 'new@example.com',
  })
  await setupAxiosMock(() => ({
    status: 200,
    data: {
      access_token: 'at-new',
      refresh_token: 'rt-rotated',
      id_token: newIdToken,
      expires_in: 1800,
    },
  }))
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?refresh-ok=1')
  const bundle = await mod.refreshOpenAIAccessToken('rt-old')
  expect(bundle.accessToken).toBe('at-new')
  expect(bundle.refreshToken).toBe('rt-rotated')
  expect(bundle.accountId).toBe('acct-new')
  expect(bundle.email).toBe('new@example.com')
  expect(bundle.expiresAt).toBeGreaterThan(Date.now())
})

test('refreshOpenAIAccessToken 服务端未返回新 rt 时兜底回旧的', async () => {
  const newIdToken = makeJwt({
    'https://api.openai.com/auth': { chatgpt_account_id: 'acct-2' },
  })
  await setupAxiosMock(() => ({
    status: 200,
    data: {
      access_token: 'at-2',
      id_token: newIdToken,
      // 注意：refresh_token 缺失
      expires_in: 1800,
    },
  }))
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?refresh-no-rotate=1')
  const bundle = await mod.refreshOpenAIAccessToken('rt-keep')
  expect(bundle.refreshToken).toBe('rt-keep')
})

test('refreshOpenAIAccessToken 失败时抛出带 status 的错误', async () => {
  await setupAxiosMock(() => ({
    status: 401,
    data: { error: 'invalid_grant' },
  }))
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?refresh-fail=1')
  let caught: unknown
  try {
    await mod.refreshOpenAIAccessToken('rt-bad')
  } catch (e) {
    caught = e
  }
  expect(caught).toBeInstanceOf(Error)
  expect(String(caught)).toContain('401')
})

test('refreshOpenAIAccessToken 空 rt 立刻抛错', async () => {
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?refresh-empty=1')
  let caught: unknown
  try {
    await mod.refreshOpenAIAccessToken('')
  } catch (e) {
    caught = e
  }
  expect(caught).toBeInstanceOf(Error)
  expect(String(caught)).toContain('refreshToken')
})

// ─── 并发锁：两路同时 refresh 只触发一次网络请求 ─────────────────────────────

test('refreshOpenAIAccessToken 并发锁合并同时请求', async () => {
  let postCount = 0
  const newIdToken = makeJwt({
    'https://api.openai.com/auth': { chatgpt_account_id: 'acct-lock' },
  })
  // 这里不能用 setupAxiosMock —— 我们要计数且延迟。单独 mock：
  const { writeFileSync, mkdtempSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const dir = mkdtempSync(join(tmpdir(), 'panda-oauth-lock-'))
  const caPath = join(dir, 'ca.pem')
  writeFileSync(caPath, '-----BEGIN CERTIFICATE-----\nX\n-----END CERTIFICATE-----\n')
  process.env.PANDA_OAUTH_CA_FILE = caPath
  mock.module('axios', () => ({
    default: {
      post: async () => {
        postCount++
        await new Promise(r => setTimeout(r, 20))
        return {
          status: 200,
          data: {
            access_token: `at-${postCount}`,
            refresh_token: 'rt-locked',
            id_token: newIdToken,
            expires_in: 1800,
          },
        }
      },
    },
  }))
  const mod = await importFresh<typeof import('./openai-oauth.js')>('./openai-oauth.js?refresh-lock=1')
  // 两路同时发起
  const [b1, b2] = await Promise.all([
    mod.refreshOpenAIAccessToken('rt-concurrent'),
    mod.refreshOpenAIAccessToken('rt-concurrent'),
  ])
  expect(postCount).toBe(1)
  // 两路都拿到同一个 bundle（并发 dedupe）
  expect(b1.accessToken).toBe(b2.accessToken)
  expect(b1.refreshToken).toBe('rt-locked')
})
