// Input: mcpDoctorHandler() 健康检查逻辑
// Output: bun:test 断言命令执行成功且输出包含关键信息
// Pos: cli/handlers/ MCP 命令集成测试，守护 doctor 子命令不回归

import { test, expect } from 'bun:test'
import { spawn } from 'child_process'
import { join } from 'path'

const CLI_PATH = join(import.meta.dir, '../../../dist/launcher.cjs')

function runCommand(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [CLI_PATH, ...args], {
      env: { ...process.env, FORCE_COLOR: '0' }
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => { stderr += data.toString() })

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code })
    })
  })
}

test('mcp doctor — 基础执行：输出包含健康检查标题', async () => {
  const { stdout, exitCode } = await runCommand(['mcp', 'doctor'])

  expect(stdout).toContain('MCP Configuration Health Check')
  expect(stdout).toContain('Settings file:')
  expect(exitCode).toBe(0)
}, { timeout: 10000 })

test('mcp doctor — 平台兼容性检查', async () => {
  const { stdout } = await runCommand(['mcp', 'doctor'])

  expect(stdout).toContain('Platform:')
  expect(stdout).toContain('Compatibility:')
}, { timeout: 10000 })

test('mcp doctor — 服务器状态检查', async () => {
  const { stdout } = await runCommand(['mcp', 'doctor'])

  // 至少应该有配置检查的输出（即使是 0 个服务器）
  expect(stdout).toContain('mcpServers configured:')
}, { timeout: 10000 })
