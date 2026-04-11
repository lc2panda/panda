// Input: none (unit test)
// Output: Bun test assertions on subagentPolicy 纯函数
// Pos: Hermes P1-3 subagent 策略层单元测试
import { test, expect } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  SUBAGENT_BLOCKED_TOOLS_BASE,
  DEFAULT_SUBAGENT_MODEL,
  loadSubagentConfig,
  computeBlockedTools,
  filterSubagentTools,
  resolveSubagentModel,
  resolveSubagentPolicy,
} from './subagentPolicy.js'

test('SUBAGENT_BLOCKED_TOOLS_BASE 包含 Agent/AgentTool/Task 防递归', () => {
  expect(SUBAGENT_BLOCKED_TOOLS_BASE.has('Agent')).toBe(true)
  expect(SUBAGENT_BLOCKED_TOOLS_BASE.has('AgentTool')).toBe(true)
  expect(SUBAGENT_BLOCKED_TOOLS_BASE.has('Task')).toBe(true)
  expect(SUBAGENT_BLOCKED_TOOLS_BASE.has('Read')).toBe(false)
  expect(SUBAGENT_BLOCKED_TOOLS_BASE.has('Bash')).toBe(false)
})

test('DEFAULT_SUBAGENT_MODEL — haiku 便宜快', () => {
  expect(DEFAULT_SUBAGENT_MODEL).toBe('haiku')
})

test('resolveSubagentModel: input.model 优先', () => {
  expect(resolveSubagentModel('opus', {})).toBe('opus')
  expect(resolveSubagentModel('sonnet', { defaultModel: 'opus' })).toBe('sonnet')
})

test('resolveSubagentModel: 无 input 时走 config.defaultModel', () => {
  expect(resolveSubagentModel(undefined, { defaultModel: 'sonnet' })).toBe('sonnet')
})

test('resolveSubagentModel: 空配置时 fallback haiku', () => {
  expect(resolveSubagentModel(undefined, {})).toBe('haiku')
})

test('computeBlockedTools: 无 config 时仅基线', () => {
  const blocked = computeBlockedTools({})
  expect(blocked.has('Agent')).toBe(true)
  expect(blocked.has('Task')).toBe(true)
  expect(blocked.size).toBe(SUBAGENT_BLOCKED_TOOLS_BASE.size)
})

test('computeBlockedTools: config.blockedTools 追加 union', () => {
  const blocked = computeBlockedTools({ blockedTools: ['BashTool', 'CustomDangerous'] })
  expect(blocked.has('Agent')).toBe(true)
  expect(blocked.has('BashTool')).toBe(true)
  expect(blocked.has('CustomDangerous')).toBe(true)
})

test('computeBlockedTools: 非法 blockedTools 项被丢弃', () => {
  // 伪造混入非 string 项模拟坏配置
  const bad = { blockedTools: ['Valid', 123, null, '', undefined] as unknown as string[] }
  const blocked = computeBlockedTools(bad)
  expect(blocked.has('Valid')).toBe(true)
  expect(blocked.has('')).toBe(false)
})

test('filterSubagentTools: 剥离禁用工具', () => {
  const tools = [
    { name: 'Read' },
    { name: 'Agent' },
    { name: 'Bash' },
    { name: 'Task' },
    { name: 'Grep' },
  ]
  const blocked = new Set(['Agent', 'Task'])
  const out = filterSubagentTools(tools, blocked)
  expect(out.map(t => t.name)).toEqual(['Read', 'Bash', 'Grep'])
})

test('filterSubagentTools: undefined / 空数组返回 []', () => {
  expect(filterSubagentTools(undefined, new Set())).toEqual([])
  expect(filterSubagentTools([], new Set(['Agent']))).toEqual([])
})

test('loadSubagentConfig: 文件缺失返回空对象', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'panda-subagent-cfg-'))
  try {
    expect(loadSubagentConfig(tmp)).toEqual({})
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('loadSubagentConfig: 合法 JSON 正确解析', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'panda-subagent-cfg-'))
  try {
    const dir = join(tmp, '.pandacc', 'config')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'subagent.json'),
      JSON.stringify({ defaultModel: 'sonnet', blockedTools: ['Bash'], maxConcurrent: 3 }),
      'utf-8',
    )
    const cfg = loadSubagentConfig(tmp)
    expect(cfg.defaultModel).toBe('sonnet')
    expect(cfg.blockedTools).toEqual(['Bash'])
    expect(cfg.maxConcurrent).toBe(3)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('loadSubagentConfig: 损坏 JSON fail-safe 返回空对象', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'panda-subagent-cfg-'))
  try {
    const dir = join(tmp, '.pandacc', 'config')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'subagent.json'), '{not valid json', 'utf-8')
    expect(loadSubagentConfig(tmp)).toEqual({})
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('resolveSubagentPolicy: 默认值 + 注入 configLoader', () => {
  const policy = resolveSubagentPolicy(undefined, () => ({}))
  expect(policy.model).toBe('haiku')
  expect(policy.blockedTools.has('Agent')).toBe(true)
  expect(policy.config).toEqual({})
})

test('resolveSubagentPolicy: input.model 覆盖 config', () => {
  const policy = resolveSubagentPolicy('opus', () => ({ defaultModel: 'sonnet' }))
  expect(policy.model).toBe('opus')
})

test('resolveSubagentPolicy: config.defaultModel 覆盖硬编码 haiku', () => {
  const policy = resolveSubagentPolicy(undefined, () => ({ defaultModel: 'sonnet' }))
  expect(policy.model).toBe('sonnet')
})

test('resolveSubagentPolicy: config.blockedTools 追加进策略', () => {
  const policy = resolveSubagentPolicy(undefined, () => ({ blockedTools: ['Custom'] }))
  expect(policy.blockedTools.has('Custom')).toBe(true)
  expect(policy.blockedTools.has('Agent')).toBe(true)
})
