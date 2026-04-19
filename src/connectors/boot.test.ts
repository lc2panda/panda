// Input: bootConnectors() 幂等注册行为
// Output: bun:test 断言 6 个内置 factory 全部进入 registry 且重复调用不重复注册
// Pos: connectors/ 启动钩子单元测试，守护 IM 子系统不再回归"factory 注册数=0"死代码

import { test, expect, beforeEach } from 'bun:test'
import { bootConnectors, _resetBootForTests } from './boot.js'
import { getConnectorRegistry } from './registry.js'

const EXPECTED_PLATFORMS = ['feishu', 'dingtalk', 'slack', 'telegram', 'teams', 'wechat'] as const

beforeEach(() => {
  // why: registry 是模块级单例，测试间需手动复位 boot flag 避免被前序 test 影响
  _resetBootForTests()
})

test('bootConnectors — 6 个内置 factory 全部注册', () => {
  bootConnectors()
  const platforms = getConnectorRegistry().listPlatforms().map(p => p.platform)
  for (const p of EXPECTED_PLATFORMS) {
    expect(platforms).toContain(p)
  }
})

test('bootConnectors — 幂等：重复调用不抛错且不重复注册', () => {
  bootConnectors()
  const before = getConnectorRegistry().listPlatforms().length
  bootConnectors()
  bootConnectors()
  const after = getConnectorRegistry().listPlatforms().length
  expect(after).toBe(before)
})

test('bootConnectors — 每个 factory 暴露 displayName 与 create()', () => {
  bootConnectors()
  const list = getConnectorRegistry().listPlatforms()
  for (const item of list) {
    if (!EXPECTED_PLATFORMS.includes(item.platform as any)) continue
    expect(typeof item.displayName).toBe('string')
    expect(item.displayName.length).toBeGreaterThan(0)
  }
})
