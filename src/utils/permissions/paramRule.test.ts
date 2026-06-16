// Input:  含 Tool(param:value) 规则的 ToolPermissionContext + 工具及本次调用 input
// Output: param 级 deny/ask/allow 按 input 字段 + 通配命中；MCP/Bash/WebFetch 被护栏排除；旧规则不变
// Pos:    波次2 项1（上游 178）— Tool(param:value) 参数级权限规则单元测试（含安全反例）

import { describe, expect, test } from 'bun:test'
import {
  getParamAllowRuleForTool,
  getParamAskRuleForTool,
  getParamDenyRuleForTool,
  parseParamRule,
} from './permissions.js'
import { getEmptyToolPermissionContext } from '../../Tool.js'
import type { ToolPermissionContext } from '../../Tool.js'

function ctx(opts: {
  deny?: string[]
  ask?: string[]
  allow?: string[]
}): ToolPermissionContext {
  return {
    ...getEmptyToolPermissionContext(),
    alwaysDenyRules: opts.deny ? { localSettings: opts.deny } : {},
    alwaysAskRules: opts.ask ? { localSettings: opts.ask } : {},
    alwaysAllowRules: opts.allow ? { localSettings: opts.allow } : {},
  } as ToolPermissionContext
}

const agentTool = {
  name: 'Agent',
} as Parameters<typeof getParamDenyRuleForTool>[1]
const webFetchTool = {
  name: 'WebFetch',
} as Parameters<typeof getParamDenyRuleForTool>[1]
const bashTool = {
  name: 'Bash',
} as Parameters<typeof getParamDenyRuleForTool>[1]

describe('parseParamRule', () => {
  test('解析 model:opus → {param,valuePattern}', () => {
    expect(parseParamRule('model:opus')).toEqual({
      param: 'model',
      valuePattern: 'opus',
    })
  })
  test('解析通配 model:opus* ', () => {
    expect(parseParamRule('model:opus*')).toEqual({
      param: 'model',
      valuePattern: 'opus*',
    })
  })
  test('非 param:value 形态（npm install）返回 null', () => {
    expect(parseParamRule('npm install')).toBeNull()
  })
  test('缺冒号返回 null', () => {
    expect(parseParamRule('opus')).toBeNull()
  })
})

describe('参数级权限规则 Tool(param:value)（上游 178）', () => {
  // 1. Agent(model:opus) deny → 命中 opus、不命中 sonnet
  test('Agent(model:opus) deny 命中 model=opus 调用', () => {
    const c = ctx({ deny: ['Agent(model:opus)'] })
    const hit = getParamDenyRuleForTool(c, agentTool, { model: 'opus' })
    expect(hit).not.toBeNull()
  })
  test('Agent(model:opus) deny 不命中 model=sonnet 调用', () => {
    const c = ctx({ deny: ['Agent(model:opus)'] })
    const miss = getParamDenyRuleForTool(c, agentTool, { model: 'sonnet' })
    expect(miss).toBeNull()
  })

  // 2. 通配 value
  test('Agent(model:opus*) 通配命中 opus-4-7', () => {
    const c = ctx({ deny: ['Agent(model:opus*)'] })
    const hit = getParamDenyRuleForTool(c, agentTool, { model: 'opus-4-7' })
    expect(hit).not.toBeNull()
  })
  test('Agent(model:opus*) 不命中 sonnet-4-6', () => {
    const c = ctx({ deny: ['Agent(model:opus*)'] })
    const miss = getParamDenyRuleForTool(c, agentTool, { model: 'sonnet-4-6' })
    expect(miss).toBeNull()
  })

  // 3. 无 (param:value) 旧规则行为不变（整工具规则 ruleContent=undefined → param 匹配器不处理）
  test('整工具规则 Agent（无 param）不被 param 匹配器命中', () => {
    const c = ctx({ deny: ['Agent'] })
    const miss = getParamDenyRuleForTool(c, agentTool, { model: 'opus' })
    expect(miss).toBeNull()
  })

  // 4. 安全反例：WebFetch(domain:*.x.com) 不被通用 param 匹配器误吞
  test('WebFetch(domain:*.x.com) 不被 param 匹配器命中（护栏 A：WebFetch 排除）', () => {
    const c = ctx({ deny: ['WebFetch(domain:*.x.com)'] })
    // 即便构造一个含 domain 字段的 input，WebFetch 也被整体排除
    const miss = getParamDenyRuleForTool(c, webFetchTool, {
      url: 'https://a.x.com',
      domain: 'a.x.com',
    })
    expect(miss).toBeNull()
  })

  // 5. 安全反例：Bash node:* 前缀规则不被误吞
  test('Bash(node:*) 不被 param 匹配器命中（护栏 A：Bash 排除）', () => {
    const c = ctx({ deny: ['Bash(node:*)'] })
    const miss = getParamDenyRuleForTool(c, bashTool, {
      command: 'node script.js',
      node: 'x',
    })
    expect(miss).toBeNull()
  })

  // B 主语义：input[param] 不存在 → 不命中
  test('input 缺少 param 字段 → 不命中（B：必须存在）', () => {
    const c = ctx({ deny: ['Agent(model:opus)'] })
    const miss = getParamDenyRuleForTool(c, agentTool, {
      description: 'foo',
    })
    expect(miss).toBeNull()
  })
  test('input 为 undefined → 不命中', () => {
    const c = ctx({ deny: ['Agent(model:opus)'] })
    const miss = getParamDenyRuleForTool(c, agentTool, undefined)
    expect(miss).toBeNull()
  })

  // ask 通道
  test('Agent(model:opus) ask 命中 opus', () => {
    const c = ctx({ ask: ['Agent(model:opus)'] })
    const hit = getParamAskRuleForTool(c, agentTool, { model: 'opus' })
    expect(hit).not.toBeNull()
  })

  // 6. param-allow 只收窄不扩大
  test('Agent(model:opus) allow 命中 opus（收窄放行）', () => {
    const c = ctx({ allow: ['Agent(model:opus)'] })
    const hit = getParamAllowRuleForTool(c, agentTool, { model: 'opus' })
    expect(hit).not.toBeNull()
  })
  test('Agent(model:opus) allow 不命中 sonnet（不扩大放行面）', () => {
    const c = ctx({ allow: ['Agent(model:opus)'] })
    const miss = getParamAllowRuleForTool(c, agentTool, { model: 'sonnet' })
    expect(miss).toBeNull()
  })

  // 通用性：任意工具任意入参（非仅 Agent）
  test('通用于任意工具：CustomTool(level:high) 命中 level=high', () => {
    const c = ctx({ deny: ['CustomTool(level:high)'] })
    const customTool = {
      name: 'CustomTool',
    } as Parameters<typeof getParamDenyRuleForTool>[1]
    const hit = getParamDenyRuleForTool(c, customTool, { level: 'high' })
    expect(hit).not.toBeNull()
  })
})
