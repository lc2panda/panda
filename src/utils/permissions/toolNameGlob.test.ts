// Input:  含 deny 规则（"*" / 具体工具名 / "Web*"）的 ToolPermissionContext + 各类工具
// Output: getDenyRuleForTool 让裸 "*" 命中任意工具、工具名 glob 命中前缀、精确规则只命中自身
// Pos:    波次2 项2（上游 166）— deny 工具名位置 glob 匹配单元测试

import { describe, expect, test } from 'bun:test'
import { getDenyRuleForTool, toolAlwaysAllowedRule } from './permissions.js'
import { getEmptyToolPermissionContext } from '../../Tool.js'
import type { ToolPermissionContext } from '../../Tool.js'

function denyCtx(rules: string[]): ToolPermissionContext {
  return {
    ...getEmptyToolPermissionContext(),
    alwaysDenyRules: { localSettings: rules },
  } as ToolPermissionContext
}

function allowCtx(rules: string[]): ToolPermissionContext {
  return {
    ...getEmptyToolPermissionContext(),
    alwaysAllowRules: { localSettings: rules },
  } as ToolPermissionContext
}

const bashTool = { name: 'Bash' } as Parameters<typeof getDenyRuleForTool>[1]
const readTool = { name: 'Read' } as Parameters<typeof getDenyRuleForTool>[1]
const webFetchTool = {
  name: 'WebFetch',
} as Parameters<typeof getDenyRuleForTool>[1]

describe('getDenyRuleForTool — 工具名位置 glob（上游 166）', () => {
  test('deny "*" 拦截任意工具（Bash）', () => {
    const ctx = denyCtx(['*'])
    expect(getDenyRuleForTool(ctx, bashTool)).not.toBeNull()
  })

  test('deny "*" 拦截任意工具（Read / WebFetch）', () => {
    const ctx = denyCtx(['*'])
    expect(getDenyRuleForTool(ctx, readTool)).not.toBeNull()
    expect(getDenyRuleForTool(ctx, webFetchTool)).not.toBeNull()
  })

  test('deny "Web*" 命中 WebFetch、不命中 Bash', () => {
    const ctx = denyCtx(['Web*'])
    expect(getDenyRuleForTool(ctx, webFetchTool)).not.toBeNull()
    expect(getDenyRuleForTool(ctx, bashTool)).toBeNull()
  })

  test('具体工具名规则 deny "Bash" 只命中 Bash（旧行为不变）', () => {
    const ctx = denyCtx(['Bash'])
    expect(getDenyRuleForTool(ctx, bashTool)).not.toBeNull()
    expect(getDenyRuleForTool(ctx, readTool)).toBeNull()
  })

  test('无 "*" 规则时不误命中（空 deny → null）', () => {
    const ctx = denyCtx(['Bash'])
    expect(getDenyRuleForTool(ctx, webFetchTool)).toBeNull()
  })

  test('allow "*" 同样匹配任意工具（glob 通用于 allow 列表）', () => {
    const ctx = allowCtx(['*'])
    expect(toolAlwaysAllowedRule(ctx, bashTool)).not.toBeNull()
    expect(toolAlwaysAllowedRule(ctx, readTool)).not.toBeNull()
  })
})
