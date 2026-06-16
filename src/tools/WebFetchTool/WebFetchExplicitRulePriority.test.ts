// Input:  WebFetch url 输入 + 含显式 deny/ask/allow 规则的 ToolPermissionContext
// Output: checkPermissions 让显式用户规则优先于内置预批域名（deny/ask 可覆盖预批 allow）
// Pos:    波次1 项2（上游 162）— WebFetch 显式规则优先于内置预批域名单元测试

import { describe, expect, test } from 'bun:test'
import { WebFetchTool } from './WebFetchTool.js'
import { isPreapprovedHost } from './preapproved.js'
import { getEmptyToolPermissionContext } from '../../Tool.js'
import type { ToolPermissionContext } from '../../Tool.js'

// developer.mozilla.org 在内置预批列表中，作为"预批域名 + 显式规则"冲突的样本
const PREAPPROVED_HOST = 'developer.mozilla.org'
const PREAPPROVED_URL = `https://${PREAPPROVED_HOST}/en-US/docs/Web/JavaScript`

function makeContext(
  kind: 'deny' | 'ask' | 'allow' | null,
  host: string,
): ToolPermissionContext {
  const base = getEmptyToolPermissionContext()
  const rule = [`WebFetch(domain:${host})`]
  return {
    ...base,
    alwaysDenyRules: kind === 'deny' ? { localSettings: rule } : {},
    alwaysAskRules: kind === 'ask' ? { localSettings: rule } : {},
    alwaysAllowRules: kind === 'allow' ? { localSettings: rule } : {},
  } as ToolPermissionContext
}

function makeCtxArg(permissionContext: ToolPermissionContext) {
  return {
    getAppState: () => ({ toolPermissionContext: permissionContext }),
  } as unknown as Parameters<typeof WebFetchTool.checkPermissions>[1]
}

describe('WebFetchTool.checkPermissions — 显式规则优先于内置预批（上游 162）', () => {
  test('前置确认：developer.mozilla.org 确实在内置预批列表中', () => {
    expect(isPreapprovedHost(PREAPPROVED_HOST, '/en-US/docs')).toBe(true)
  })

  test('对预批域名设显式 deny → 被拦截（deny 盖过预批 allow）', async () => {
    const ctx = makeCtxArg(makeContext('deny', PREAPPROVED_HOST))
    const result = await WebFetchTool.checkPermissions(
      { url: PREAPPROVED_URL, prompt: 'x' },
      ctx,
    )
    expect(result.behavior).toBe('deny')
  })

  test('对预批域名设显式 ask → 要求确认（ask 盖过预批 allow）', async () => {
    const ctx = makeCtxArg(makeContext('ask', PREAPPROVED_HOST))
    const result = await WebFetchTool.checkPermissions(
      { url: PREAPPROVED_URL, prompt: 'x' },
      ctx,
    )
    expect(result.behavior).toBe('ask')
  })

  test('预批域名无任何显式规则 → 回退到预批 allow', async () => {
    const ctx = makeCtxArg(makeContext(null, PREAPPROVED_HOST))
    const result = await WebFetchTool.checkPermissions(
      { url: PREAPPROVED_URL, prompt: 'x' },
      ctx,
    )
    expect(result.behavior).toBe('allow')
    if (result.behavior === 'allow') {
      expect(result.decisionReason).toEqual({
        type: 'other',
        reason: 'Preapproved host',
      })
    }
  })

  test('非预批域名设显式 allow → 放行', async () => {
    const host = 'example.com'
    const ctx = makeCtxArg(makeContext('allow', host))
    const result = await WebFetchTool.checkPermissions(
      { url: `https://${host}/page`, prompt: 'x' },
      ctx,
    )
    expect(result.behavior).toBe('allow')
  })

  test('非预批域名无规则 → 默认要求确认', async () => {
    const host = 'untrusted.example.org'
    expect(isPreapprovedHost(host, '/')).toBe(false)
    const ctx = makeCtxArg(makeContext(null, host))
    const result = await WebFetchTool.checkPermissions(
      { url: `https://${host}/page`, prompt: 'x' },
      ctx,
    )
    expect(result.behavior).toBe('ask')
  })
})
