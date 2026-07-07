import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test'

const projectConfig = { disabledMcpServers: [] as string[] }

mock.module('../../../utils/config.js', () => ({
  getCurrentProjectConfig: () => projectConfig,
  saveCurrentProjectConfig: () => {},
}))

mock.module('../../../utils/log.js', () => ({
  logError: () => {},
  logForDebugging: () => {},
}))

const {
  dedupClaudeAiMcpServers,
  dedupPluginMcpServers,
  getMcpServerSignature,
} = await import('../config.js')

describe('manual/plugin/claude.ai MCP 去重矩阵', () => {
  beforeEach(() => {
    projectConfig.disabledMcpServers = []
  })

  afterEach(() => {
    projectConfig.disabledMcpServers = []
  })

  test('duplicate signature：manual wins，plugin 与 claude.ai connector 被抑制', () => {
    const manual = {
      slack: { type: 'sse', url: 'https://mcp.slack.com/sse' },
    } as any
    const plugin = {
      'plugin:team:slack': { type: 'sse', url: 'https://mcp.slack.com/sse' },
    } as any
    const connectors = {
      'claude.ai Slack': { type: 'sse', url: 'https://mcp.slack.com/sse' },
    } as any

    expect(getMcpServerSignature(manual.slack)).toBe(
      getMcpServerSignature(plugin['plugin:team:slack']),
    )
    expect(dedupPluginMcpServers(plugin, manual)).toEqual({
      servers: {},
      suppressed: [{ name: 'plugin:team:slack', duplicateOf: 'slack' }],
    })
    expect(dedupClaudeAiMcpServers(connectors, manual)).toEqual({
      servers: {},
      suppressed: [{ name: 'claude.ai Slack', duplicateOf: 'slack' }],
    })
  })

  test('disabled manual 不抑制 claude.ai connector，connector wins 避免两者都不可用', () => {
    projectConfig.disabledMcpServers = ['slack']
    const manual = {
      slack: { type: 'sse', url: 'https://mcp.slack.com/sse' },
    } as any
    const connectors = {
      'claude.ai Slack': { type: 'sse', url: 'https://mcp.slack.com/sse' },
    } as any

    expect(dedupClaudeAiMcpServers(connectors, manual)).toEqual({
      servers: connectors,
      suppressed: [],
    })
  })

  test('plugin duplicate 间 first plugin wins，manual wins 保持既有项目语义', () => {
    const plugins = {
      'plugin:first:github': { type: 'stdio', command: 'npx', args: ['@mcp/github'] },
      'plugin:second:github': { type: 'stdio', command: 'npx', args: ['@mcp/github'] },
      'plugin:other:fs': { type: 'stdio', command: 'npx', args: ['@mcp/fs'] },
    } as any

    expect(dedupPluginMcpServers(plugins, {} as any)).toEqual({
      servers: {
        'plugin:first:github': plugins['plugin:first:github'],
        'plugin:other:fs': plugins['plugin:other:fs'],
      },
      suppressed: [
        { name: 'plugin:second:github', duplicateOf: 'plugin:first:github' },
      ],
    })

    expect(
      dedupPluginMcpServers(plugins, {
        github: { type: 'stdio', command: 'npx', args: ['@mcp/github'] },
      } as any),
    ).toEqual({
      servers: {
        'plugin:other:fs': plugins['plugin:other:fs'],
      },
      suppressed: [
        { name: 'plugin:first:github', duplicateOf: 'github' },
        { name: 'plugin:second:github', duplicateOf: 'github' },
      ],
    })
  })

  test('enterprise/policy 过滤后的 manual 才能作为 connector 去重目标', () => {
    const policyAllowedManual = {
      github: { type: 'sse', url: 'https://mcp.github.com/sse' },
    } as any
    const policyBlockedManual = {} as any
    const connectors = {
      'claude.ai GitHub': { type: 'sse', url: 'https://mcp.github.com/sse' },
    } as any

    expect(dedupClaudeAiMcpServers(connectors, policyAllowedManual)).toEqual({
      servers: {},
      suppressed: [{ name: 'claude.ai GitHub', duplicateOf: 'github' }],
    })
    expect(dedupClaudeAiMcpServers(connectors, policyBlockedManual)).toEqual({
      servers: connectors,
      suppressed: [],
    })
  })
})
