// Input: none (direct unit test of resolveWindowsCommand)
// Output: bun:test assertions on Windows command resolution
// Pos: guard MCP stdio server launch on Windows platform

import { test, expect, describe } from 'bun:test'
import { basename, dirname, extname, isAbsolute, join } from 'node:path'

// 从 client.ts 提取 resolveWindowsCommand 函数用于测试
// 保持与源代码完全一致
function resolveWindowsCommand(command: string): string {
  // 已经是绝对路径且包含扩展名，直接返回
  if (isAbsolute(command) && extname(command)) {
    return command
  }

  // 已包含扩展名（相对路径），直接返回
  if (extname(command)) {
    return command
  }

  // npm/npx/yarn/pnpm 是 .cmd 脚本（非 .exe）
  const cmdScripts = ['npm', 'npx', 'yarn', 'pnpm']

  // 其他常见 CLI 工具追加 .exe
  const exeCommands = [
    'node',
    'python',
    'python3',
    'py',
    'deno',
    'bun',
    'docker',
    'podman',
  ]

  const baseName = basename(command)
  const dir = dirname(command)

  if (cmdScripts.includes(baseName)) {
    // npm/npx/yarn/pnpm → .cmd（cross-spawn 会自动处理 .cmd 脚本）
    return dir === '.' ? `${baseName}.cmd` : join(dir, `${baseName}.cmd`)
  }

  if (exeCommands.includes(baseName)) {
    // node/python 等 → .exe
    return dir === '.' ? `${baseName}.exe` : join(dir, `${baseName}.exe`)
  }

  // 其他命令：假设用户知道自己在做什么，返回原值
  return command
}

describe('resolveWindowsCommand', () => {
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

  test('node 添加 .exe 后缀', () => {
    expect(resolveWindowsCommand('node')).toBe('node.exe')
  })

  test('python 添加 .exe 后缀', () => {
    expect(resolveWindowsCommand('python')).toBe('python.exe')
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
