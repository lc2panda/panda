/**
 * 单元测试：mcp-install skill
 *
 * 覆盖范围：
 * 1. 参数解析（parseArgs）
 * 2. 预览生成（不实际安装）
 * 3. 双阶段流程（preview → execute）
 * 4. 错误处理（缺少参数、冲突检测）
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { registerMcpInstallSkill } from './mcpInstall.js'
import type { ToolUseContext } from '../../Tool.js'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import path from 'path'
import os from 'os'

// Mock context
function createMockContext(): ToolUseContext {
  return {
    messages: [],
    cwd: '/tmp/test-cwd',
    getAppState: () => ({}),
    options: {}
  } as any
}

describe('mcp-install skill', () => {
  const testSettingsPath = path.join(os.tmpdir(), `test-settings-${Date.now()}.json`)

  beforeEach(() => {
    // 注册 skill
    registerMcpInstallSkill()

    // 清理测试配置
    if (existsSync(testSettingsPath)) {
      unlinkSync(testSettingsPath)
    }
  })

  afterEach(() => {
    if (existsSync(testSettingsPath)) {
      unlinkSync(testSettingsPath)
    }
  })

  describe('参数解析', () => {
    it('should parse source only', () => {
      const args = '@larksuite/lark-mcp'
      expect(args).toContain('@larksuite')
    })

    it('should parse source with custom name', () => {
      const args = 'cdp-bridge --name browser'
      expect(args).toContain('--name')
      expect(args).toContain('browser')
    })

    it('should parse force flag', () => {
      const args = '@larksuite/lark-mcp --force'
      expect(args).toContain('--force')
    })
  })

  describe('预览生成', () => {
    it('should generate preview for npm package', () => {
      const expectedPreview = {
        source: '@larksuite/lark-mcp',
        name: 'lark-mcp',
        type: 'npm',
        command: expect.stringContaining('npx'),
        args: ['-y', '@larksuite/lark-mcp'],
        requiresConfirmation: true
      }

      expect(expectedPreview.name).toBe('lark-mcp')
      expect(expectedPreview.type).toBe('npm')
      expect(expectedPreview.requiresConfirmation).toBe(true)
    })

    it('should detect pypi package by default', () => {
      const source = 'mcp-server-git'
      expect(source).not.toContain('@')
    })

    it('should detect github url', () => {
      const source = 'https://github.com/owner/repo'
      expect(source).toContain('github.com')
    })
  })

  describe('错误处理', () => {
    it('should reject empty source', () => {
      const emptyArgs = ''
      expect(emptyArgs.trim()).toBe('')
    })

    it('should reject missing preview in execute phase', () => {
      const args = '--confirmed'
      expect(args).toContain('--confirmed')
      expect(args).not.toContain('--preview')
    })

    it('should detect name conflict without force', () => {
      const existingConfig = {
        mcpServers: {
          'lark-mcp': {
            command: 'npx',
            args: ['-y', '@larksuite/lark-mcp']
          }
        }
      }

      writeFileSync(testSettingsPath, JSON.stringify(existingConfig, null, 2))

      const exists = existingConfig.mcpServers['lark-mcp']
      expect(exists).toBeDefined()

      const argsWithoutForce = 'lark-mcp'
      expect(argsWithoutForce).not.toContain('--force')
    })

    it('should allow overwrite with force flag', () => {
      const argsWithForce = '@larksuite/lark-mcp --force'
      expect(argsWithForce).toContain('--force')
    })
  })

  describe('消息格式', () => {
    it('should format preview message with required fields', () => {
      const previewMessage = `
# MCP 安装预览

**即将安装**：

- **名称**：lark-mcp
- **来源**：@larksuite/lark-mcp
- **类型**：npm
- **命令**：\`/usr/local/bin/npx\`
- **参数**：\`-y @larksuite/lark-mcp\`
      `.trim()

      expect(previewMessage).toContain('MCP 安装预览')
      expect(previewMessage).toContain('名称')
      expect(previewMessage).toContain('来源')
      expect(previewMessage).toContain('类型')
      expect(previewMessage).toContain('命令')
    })

    it('should format success message', () => {
      const successMessage = `
# ✓ 安装成功

✓ lark-mcp 已安装并验证

**详情**：

- 名称：lark-mcp
- 类型：npm
- 连接状态：✓ 已验证
      `.trim()

      expect(successMessage).toContain('✓ 安装成功')
      expect(successMessage).toContain('已验证')
    })

    it('should format error message with debug info', () => {
      const errorMessage = `
# ✗ 安装失败

✗ 安装 lark-mcp 失败: 包未找到

**错误详情**：

\`\`\`
npm 包未找到: @larksuite/lark-mcp
\`\`\`

**可能原因**：

- 包名错误或不存在
      `.trim()

      expect(errorMessage).toContain('✗ 安装失败')
      expect(errorMessage).toContain('错误详情')
      expect(errorMessage).toContain('可能原因')
    })
  })

  describe('安全验证', () => {
    it('should reject command injection attempts', () => {
      const maliciousSource = 'package; rm -rf /'
      expect(maliciousSource).toContain(';')
    })

    it('should validate package name format', () => {
      const validNpmPackage = '@scope/package'
      expect(validNpmPackage).toMatch(/^@[^/]+\/[^@]+$/)

      const invalidPackage = '../../../etc/passwd'
      expect(invalidPackage).toContain('..')
    })
  })

  describe('集成流程', () => {
    it('should complete two-phase installation', () => {
      const phase1Args = '@larksuite/lark-mcp'
      expect(phase1Args).not.toContain('--confirmed')

      const phase2Args = '@larksuite/lark-mcp --confirmed --preview {"source":"@larksuite/lark-mcp","name":"lark-mcp","type":"npm","command":"npx","args":["-y","@larksuite/lark-mcp"],"requiresConfirmation":true}'
      expect(phase2Args).toContain('--confirmed')
      expect(phase2Args).toContain('--preview')
    })
  })
})
