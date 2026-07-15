// Input: MCP command names and server config objects
// Output: bun:test assertions on Windows command resolution and config parsing
// Pos: guard MCP stdio launch and transport config validation

import { test, expect, describe } from 'bun:test'
// import { resolveWindowsCommand } from './client.js'  // Removed - cross-spawn handles automatically
import { McpServerConfigSchema } from './types.js'

// resolveWindowsCommand 已移除：cross-spawn 自动处理 Windows 命令扩展名
// 手动追加 .cmd/.exe 会破坏 cross-spawn 的自动机制，导致 Windows MCP 全部失败
// 参考：WINDOWS-MCP-ROOT-CAUSE.md
/*
describe.skip('resolveWindowsCommand (deprecated)', () => {
  test('npx 添加 .cmd 后缀', () => {
    expect(resolveWindowsCommand('npx')).toBe('npx.cmd')
  })

  test('npm 添加 .cmd 后缀', () => {
    expect(resolveWindowsCommand('npm')).toBe('npm.cmd')
  })

  test('yarn 添加 .cmd 后缀', () => {
    expect(resolveWindowsCommand('yarn')).toBe('yarn.cmd')
  })

  test('pnpm 添加 .cmd 后缀', () => {
    expect(resolveWindowsCommand('pnpm')).toBe('pnpm.cmd')
  })

  test('node/python/deno/bun/docker/podman 添加 .exe 后缀', () => {
    for (const command of ['node', 'python', 'python3', 'py', 'deno', 'bun', 'docker', 'podman']) {
      expect(resolveWindowsCommand(command)).toBe(`${command}.exe`)
    }
  })

  test('已有扩展名的命令不修改', () => {
    expect(resolveWindowsCommand('npx.cmd')).toBe('npx.cmd')
    expect(resolveWindowsCommand('node.exe')).toBe('node.exe')
    expect(resolveWindowsCommand('./script.js')).toBe('./script.js')
  })

  test('绝对路径带扩展名直接返回', () => {
    const absPath = process.platform === 'win32'
      ? 'C:\\Program Files\\nodejs\\node.exe'
      : '/usr/bin/node.exe' // 测试逻辑，非真实路径
    expect(resolveWindowsCommand(absPath)).toBe(absPath)
  })

  test('非 cmdScripts 和非 exeCommands 的命令不修改', () => {
    expect(resolveWindowsCommand('unknown-cmd')).toBe('unknown-cmd')
    expect(resolveWindowsCommand('custom-tool')).toBe('custom-tool')
  })

  test('路径中的 npx 命令正确添加后缀', () => {
    expect(resolveWindowsCommand('./node_modules/.bin/npx')).toMatch(/npx\.cmd$/)
    expect(resolveWindowsCommand('node_modules/.bin/npx')).toMatch(/npx\.cmd$/)
  })

  test('路径中的 node 命令正确添加后缀', () => {
    expect(resolveWindowsCommand('./bin/node')).toMatch(/node\.exe$/)
    expect(resolveWindowsCommand('tools/node')).toMatch(/node\.exe$/)
  })

  test('MCP 常见场景：npx 启动 @modelcontextprotocol/server-*', () => {
    // 典型的 MCP stdio 配置中 command 为 "npx"
    expect(resolveWindowsCommand('npx')).toBe('npx.cmd')
  })

  test('MCP 常见场景：使用全局安装的 npm 包', () => {
    expect(resolveWindowsCommand('npm')).toBe('npm.cmd')
    expect(resolveWindowsCommand('yarn')).toBe('yarn.cmd')
  })

  test('边界情况：空字符串和点开头', () => {
    expect(resolveWindowsCommand('')).toBe('')
    expect(resolveWindowsCommand('.')).toBe('.')
  })
})
*/

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
