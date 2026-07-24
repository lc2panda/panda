// Input: MCP server config objects + client.ts source (scar guards)
// Output: bun:test assertions on config parsing and anti-regression guards
// Pos: guard MCP stdio launch / transport config; lock out resolveWindowsCommand

import { test, expect, describe } from 'bun:test'
import { readFile } from 'fs/promises'
import { McpServerConfigSchema } from './types.js'

describe('resolveWindowsCommand must stay deleted (H-016 / scar)', () => {
  test('client.ts 不得定义或 export resolveWindowsCommand', async () => {
    // scar: windows-command-optimization-breaks-cross-spawn
    // Rewriting commands to .cmd/.exe before StdioClientTransport breaks cross-spawn.
    const src = await readFile(new URL('./client.ts', import.meta.url), 'utf8')
    expect(src).not.toMatch(
      /(?:export\s+)?function\s+resolveWindowsCommand\s*\(/,
    )
    expect(src).not.toMatch(
      /export\s*\{[^}]*\bresolveWindowsCommand\b[^}]*\}/,
    )
    // Must not call any resolveWindowsCommand helper on the spawn path
    expect(src).not.toMatch(/resolveWindowsCommand\s*\(/)
  })
})

describe('McpServerConfigSchema', () => {
  test('url 配置缺少 type 时给出明确 transport 提示', () => {
    const result = McpServerConfigSchema().safeParse({
      url: 'https://example.com/mcp',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.some(issue =>
      issue.path.join('.') === 'type' &&
      issue.message.includes('type: "sse" | "http" | "ws"'),
    )).toBe(true)
  })

  test('有效 url transport 配置行为保持不变', () => {
    expect(McpServerConfigSchema().safeParse({
      type: 'http',
      url: 'https://example.com/mcp',
    }).success).toBe(true)
    expect(McpServerConfigSchema().safeParse({
      type: 'sse',
      url: 'https://example.com/sse',
    }).success).toBe(true)
    expect(McpServerConfigSchema().safeParse({
      type: 'ws',
      url: 'wss://example.com/ws',
    }).success).toBe(true)
  })

  test('stdio 配置缺少 command 时拒绝初始化输入', () => {
    const result = McpServerConfigSchema().safeParse({
      type: 'stdio',
      args: ['--version'],
    })

    expect(result.success).toBe(false)
    const issueText = JSON.stringify(result.error?.issues)
    expect(issueText).toContain('command')
  })
})
