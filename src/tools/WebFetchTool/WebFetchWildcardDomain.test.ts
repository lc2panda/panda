// Input:  WebFetch url 输入 + 含通配域名规则（domain:*.x.com）的 ToolPermissionContext
// Output: checkPermissions 让 *.x.com 匹配子域、不匹配裸 apex 与异域；精确域名规则不受影响
// Pos:    波次2 项3（上游 172）— WebFetch 域名通配子域匹配单元测试

import { describe, expect, test } from 'bun:test'
import { WebFetchTool } from './WebFetchTool.js'
import { getEmptyToolPermissionContext } from '../../Tool.js'
import type { ToolPermissionContext } from '../../Tool.js'

function makeContext(
  kind: 'deny' | 'ask' | 'allow',
  ruleHost: string,
): ToolPermissionContext {
  const base = getEmptyToolPermissionContext()
  const rule = [`WebFetch(domain:${ruleHost})`]
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

async function check(ctx: ToolPermissionContext, url: string) {
  return WebFetchTool.checkPermissions({ url, prompt: 'x' }, makeCtxArg(ctx))
}

describe('WebFetchTool.checkPermissions — 域名通配子域匹配（上游 172）', () => {
  test('allow *.x.com 匹配子域 a.x.com → 放行', async () => {
    const ctx = makeContext('allow', '*.x.com')
    const result = await check(ctx, 'https://a.x.com/page')
    expect(result.behavior).toBe('allow')
  })

  test('allow *.x.com 匹配多级子域 b.deep.x.com → 放行', async () => {
    const ctx = makeContext('allow', '*.x.com')
    const result = await check(ctx, 'https://b.deep.x.com/page')
    expect(result.behavior).toBe('allow')
  })

  test('deny *.x.com 拦截子域 a.x.com → deny', async () => {
    const ctx = makeContext('deny', '*.x.com')
    const result = await check(ctx, 'https://a.x.com/page')
    expect(result.behavior).toBe('deny')
  })

  test('*.x.com 不匹配异域 x.evil.com → 不命中（回退默认 ask）', async () => {
    const ctx = makeContext('allow', '*.x.com')
    const result = await check(ctx, 'https://x.evil.com/page')
    // 未命中通配规则、非预批域名 → 默认要求确认
    expect(result.behavior).toBe('ask')
  })

  test('*.x.com 不匹配裸 apex x.com → 不命中（回退默认 ask）', async () => {
    const ctx = makeContext('allow', '*.x.com')
    const result = await check(ctx, 'https://x.com/page')
    expect(result.behavior).toBe('ask')
  })

  test('精确域名规则 domain:a.x.com 仅匹配自身、不匹配 b.x.com（旧行为不变）', async () => {
    const ctx = makeContext('allow', 'a.x.com')
    const hit = await check(ctx, 'https://a.x.com/page')
    expect(hit.behavior).toBe('allow')
    const miss = await check(ctx, 'https://b.x.com/page')
    expect(miss.behavior).toBe('ask')
  })
})
