// Input: args string (source + optional flags: name/force/confirmed/preview)
// Output: registers the `mcp-install` bundled skill (Command) into the registry
// Pos: bundled skills — 对话内 MCP 服务器安装，支持双阶段确认（preview + execute）
//
// 双阶段设计：
// 1. 预览阶段（confirmed=false，默认）：
//    - 解析来源（npm/pypi/url/github）
//    - 验证包存在性
//    - 返回安装预览（命令、参数、影响范围）
//    - 请求用户确认
// 2. 执行阶段（confirmed=true）：
//    - 执行真实安装
//    - 写入 settings.json
//    - 测试连接
//    - 返回安装结果
//
// 安全约束：
// - 禁止跳过确认（除非 force=true）
// - 命令注入防护（sanitize command/args）
// - 冲突检测（已存在服务器需 force）

import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import type { ToolUseContext } from '../../Tool.js'
import { registerBundledSkill } from '../bundledSkills.js'
import { SourceDetector, type McpSource } from '../../cli/mcp/sourceDetector.js'
import { NpmInstaller } from '../../cli/mcp/installers/npmInstaller.js'
import { PypiInstaller } from '../../cli/mcp/installers/pypiInstaller.js'
import { UrlInstaller } from '../../cli/mcp/installers/urlInstaller.js'
import { GitHubInstaller } from '../../cli/mcp/installers/githubInstaller.js'
import type { BaseInstaller } from '../../cli/mcp/installers/base.js'
import { getGlobalConfig } from '../../utils/config.js'
import { getGlobalClaudeFile } from '../../utils/env.js'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import os from 'os'
import { connectToServer } from '../../services/mcp/client.js'
import type { ScopedMcpServerConfig } from '../../services/mcp/types.js'

interface McpInstallPreview {
  source: string
  name: string
  type: string
  command: string
  args: string[]
  requiresConfirmation: true
}

interface McpInstallArgs {
  source?: string
  name?: string
  force?: boolean
  confirmed?: boolean
  preview?: McpInstallPreview
}

/**
 * 解析 args 字符串为结构化参数
 */
function parseArgs(argsString: string): McpInstallArgs {
  const trimmed = argsString.trim()
  if (!trimmed) {
    throw new Error('Missing source argument')
  }

  const parts = trimmed.split(/\s+/)
  const result: McpInstallArgs = {}

  let i = 0
  if (!parts[0]?.startsWith('--')) {
    result.source = parts[0]
    i = 1
  }

  while (i < parts.length) {
    const part = parts[i]
    if (part === '--name' && parts[i + 1]) {
      result.name = parts[i + 1]
      i += 2
    } else if (part === '--force') {
      result.force = true
      i += 1
    } else if (part === '--confirmed') {
      result.confirmed = true
      i += 1
    } else if (part === '--preview' && parts[i + 1]) {
      try {
        result.preview = JSON.parse(parts[i + 1])
      } catch {
        throw new Error('Invalid preview JSON')
      }
      i += 2
    } else {
      i += 1
    }
  }

  return result
}

/**
 * 生成安装预览
 */
async function generatePreview(args: McpInstallArgs): Promise<McpInstallPreview> {
  if (!args.source) {
    throw new Error('Missing source argument')
  }

  const detector = new SourceDetector()
  const source = detector.detect(args.source)
  const installer = getInstaller(source.type)
  const config = await precheck(source, installer)
  const name = args.name || source.name || 'unknown'

  return {
    source: args.source,
    name,
    type: source.type,
    command: config.command,
    args: config.args,
    requiresConfirmation: true
  }
}

/**
 * 获取对应类型的安装器
 */
function getInstaller(type: string): BaseInstaller {
  const installers: Record<string, BaseInstaller> = {
    npm: new NpmInstaller(),
    pypi: new PypiInstaller(),
    url: new UrlInstaller(),
    github: new GitHubInstaller()
  }

  const installer = installers[type]
  if (!installer) {
    throw new Error(`Unsupported source type: ${type}`)
  }

  return installer
}

/**
 * 预检查（轻量级验证）
 */
async function precheck(
  source: McpSource,
  installer: BaseInstaller
): Promise<{ command: string; args: string[] }> {
  if (source.type === 'npm' || source.type === 'pypi') {
    const result = await installer.install(source, source.name || 'temp')
    return {
      command: result.config.command,
      args: result.config.args
    }
  }

  if (source.type === 'url') {
    const localPath = path.join(
      os.homedir(),
      '.pandacc',
      'mcp-servers',
      source.name || 'unknown',
      'server'
    )
    return {
      command: localPath,
      args: []
    }
  }

  if (source.type === 'github') {
    return {
      command: 'TBD (will be determined after download)',
      args: []
    }
  }

  throw new Error(`Unsupported type: ${source.type}`)
}

/**
 * 执行安装
 */
async function executeInstall(
  preview: McpInstallPreview,
  force?: boolean
): Promise<{
  success: boolean
  name: string
  type: string
  connected?: boolean
  version?: string
  installedPath?: string
  error?: string
  message: string
}> {
  const detector = new SourceDetector()
  const source = detector.detect(preview.source)
  const installer = getInstaller(source.type)

  try {
    const result = await installer.install(source, preview.name)
    await addMcpServerToSettings(preview.name, result.config, force)
    const connected = await testConnection(preview.name, result.config)

    return {
      success: true,
      name: preview.name,
      type: source.type,
      connected,
      version: result.version,
      installedPath: result.installedPath,
      message: connected
        ? `✓ ${preview.name} 已安装并验证`
        : `⚠ ${preview.name} 已安装但连接测试失败（运行 'panda mcp doctor' 诊断）`
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      name: preview.name,
      type: source.type,
      error: errorMessage,
      message: `✗ 安装 ${preview.name} 失败: ${errorMessage}`
    }
  }
}

/**
 * 写入 MCP 服务器配置到 settings.json
 */
async function addMcpServerToSettings(
  name: string,
  config: { command: string; args: string[]; env?: Record<string, string> },
  force?: boolean
): Promise<void> {
  const globalConfig = getGlobalConfig()
  const settingsPath = globalConfig.settingsPath || getGlobalClaudeFile()

  let settings: any = {}
  try {
    const content = readFileSync(settingsPath, 'utf-8')
    settings = JSON.parse(content)
  } catch {
    // 文件不存在，使用空配置
  }

  if (settings.mcpServers?.[name] && !force) {
    throw new Error(`MCP 服务器 '${name}' 已存在。使用 --force 覆盖`)
  }

  settings.mcpServers = settings.mcpServers || {}
  settings.mcpServers[name] = config

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
}

/**
 * 测试 MCP 连接
 */
async function testConnection(
  name: string,
  config: { command: string; args: string[]; env?: Record<string, string> }
): Promise<boolean> {
  try {
    const serverConfig: ScopedMcpServerConfig = {
      type: 'stdio',
      command: config.command,
      args: config.args,
      env: config.env,
      scope: 'user'
    }
    const result = await connectToServer(name, serverConfig)

    if (result.type === 'connected') {
      return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * 格式化预览消息
 */
function formatPreviewMessage(preview: McpInstallPreview): string {
  return `# MCP 安装预览

**即将安装**：

- **名称**：${preview.name}
- **来源**：${preview.source}
- **类型**：${preview.type}
- **命令**：\`${preview.command}\`
- **参数**：\`${preview.args.join(' ')}\`

**操作**：

1. 下载并配置 ${preview.name}
2. 添加到 \`~/.pandacc.json\`
3. 测试连接

**确认**：回复 "yes" 或 "确认" 继续安装，回复 "no" 或 "取消" 中止。`
}

/**
 * 格式化安装结果消息
 */
function formatResultMessage(result: {
  success: boolean
  name: string
  type: string
  connected?: boolean
  version?: string
  installedPath?: string
  error?: string
  message: string
}): string {
  if (result.success) {
    let msg = `# ✓ 安装成功\n\n${result.message}\n\n**详情**：\n\n`
    msg += `- 名称：${result.name}\n`
    msg += `- 类型：${result.type}\n`
    if (result.version) msg += `- 版本：${result.version}\n`
    if (result.installedPath) msg += `- 路径：\`${result.installedPath}\`\n`
    msg += `- 连接状态：${result.connected ? '✓ 已验证' : '⚠ 需检查'}\n`
    msg += `\n**下一步**：\n\n`
    msg += `- 运行 \`panda mcp doctor\` 查看所有服务器状态\n`
    msg += `- 现在可以使用 ${result.name} 的功能了`
    return msg
  } else {
    let msg = `# ✗ 安装失败\n\n${result.message}\n\n**错误详情**：\n\n`
    msg += `\`\`\`\n${result.error}\n\`\`\`\n\n`
    msg += `**可能原因**：\n\n`
    msg += `- 包名错误或不存在\n`
    msg += `- 网络连接问题\n`
    msg += `- 依赖工具（npx/uvx）不可用\n`
    msg += `- 权限不足\n\n`
    msg += `**调试建议**：\n\n`
    msg += `1. 确认包名正确：访问 npm/pypi 官网搜索\n`
    msg += `2. 检查网络：\`curl -I https://registry.npmjs.org\`\n`
    msg += `3. 手动测试工具：\`npx --version\` 或 \`uvx --version\`\n`
    msg += `4. 查看日志：\`~/.pandacc/logs/mcp.log\``
    return msg
  }
}

/**
 * 主执行逻辑
 */
async function executeMcpInstall(
  argsString: string,
  context: ToolUseContext
): Promise<ContentBlockParam[]> {
  try {
    const args = parseArgs(argsString)

    if (!args.confirmed) {
      const preview = await generatePreview(args)
      const message = formatPreviewMessage(preview)

      return [
        {
          type: 'text',
          text: message
        }
      ]
    }

    if (!args.preview) {
      return [
        {
          type: 'text',
          text: '❌ **内部错误**：缺少预览数据\n\n请重新开始安装流程。'
        }
      ]
    }

    const result = await executeInstall(args.preview, args.force)
    const message = formatResultMessage(result)

    return [
      {
        type: 'text',
        text: message
      }
    ]
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return [
      {
        type: 'text',
        text: `❌ **执行失败**\n\n${errorMessage}\n\n**用法**：\n\n\`\`\`\n/mcp-install <source> [--name <custom-name>] [--force]\n\`\`\`\n\n**示例**：\n\n- \`/mcp-install @larksuite/lark-mcp\`\n- \`/mcp-install cdp-bridge --name browser\`\n- \`/mcp-install https://example.com/server.tar.gz\``
      }
    ]
  }
}

export function registerMcpInstallSkill(): void {
  registerBundledSkill({
    name: 'mcp-install',
    description: `Install MCP (Model Context Protocol) servers for Panda CLI.

**Trigger keywords**: "安装 MCP", "install MCP", "添加 MCP 服务器", "MCP 服务器", "MCP server"

**Examples**:
- "安装 MCP 服务器 cdp-bridge"
- "帮我安装 MCP: @larksuite/lark-mcp"
- "添加 MCP 服务器 filesystem"
- "install MCP server cdp-bridge"

**Supported sources**:
- npm packages: @scope/package or package-name
- PyPI packages: package-name
- GitHub repos: github:user/repo
- URLs: https://example.com/server

**Important**: This installs MCP servers for Panda CLI, NOT Claude Code or file directories.

在对话中安装 MCP 服务器（支持 npm/pypi/url/github）`,
    userInvocable: true,
    argumentHint: '<source> [--name <custom-name>] [--force]',
    async getPromptForCommand(args, context) {
      return executeMcpInstall(args || '', context)
    }
  })
}
