// Input: args string (问题描述 或 配置命令：status/off/<model>)
// Output: registers the `advisor` bundled skill (Command) into the registry
// Pos: bundled skills — 智能顾问技能，技术决策分析与多方案对比
//
// 双模式设计：
// 1. 配置管理模式（委托给 /advisor 命令）：
//    - /advisor            → 显示当前配置
//    - /advisor opus       → 设置顾问模型
//    - /advisor off        → 禁用顾问
// 2. 推理执行模式（真实 advisor API 调用）：
//    - /advisor 如何选择数据库？ → 调用 advisorHelper 进行深度分析
//
// 配置持久化对齐：
// - 读取路径：getAppState().advisorModel (来自 settings.advisorModel)
// - 示例配置：{ "advisorModel": "claude-opus-4-6" }
// - 未配置时友好提示配置方式，不静默失败

import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
import type { ToolUseContext } from '../../Tool.js'
import type { Message } from '../../types/message.js'
import { registerBundledSkill } from '../bundledSkills.js'
import { callAdvisorForSkill, isAdvisorAvailableForSkill } from '../utils/advisorHelper.js'

/**
 * 判断 args 是否为配置命令（而非问题描述）
 */
function isConfigCommand(args: string): boolean {
  const trimmed = args.trim().toLowerCase()
  return (
    !trimmed || // 空参数 → 显示状态
    trimmed === 'status' ||
    trimmed === 'off' ||
    trimmed === 'unset' ||
    trimmed.startsWith('claude-') || // 模型名称模式
    trimmed.startsWith('opus') ||
    trimmed.startsWith('sonnet') ||
    trimmed.startsWith('haiku')
  )
}

/**
 * 构建配置管理提示（委托给 /advisor 命令）
 */
function buildConfigPrompt(args: string): string {
  return `# Advisor 配置委托

用户请求配置 advisor 模型，但 skill 层无法直接修改配置。

**请执行**：\`/advisor ${args.trim()}\`

该命令会：
- 验证模型有效性（通过 validateModel）
- 更新 appState.advisorModel
- 持久化到 settings.json（通过 updateSettingsForSource）
- 返回友好的配置确认消息

**不要**自行尝试修改配置或模拟命令输出，直接调用 /advisor 命令即可。`
}

/**
 * 执行顾问查询（推理模式）
 * 调用 advisorHelper 真实使用 advisor 模型
 */
async function executeAdvisorQuery(
  question: string,
  context: ToolUseContext
): Promise<ContentBlockParam[]> {
  const appState = context.getAppState()
  const advisorModel = appState.advisorModel

  // 配置检查
  if (!advisorModel) {
    return [{
      type: 'text',
      text: `⚠️ **顾问模型未配置**

请先设置顾问模型以启用真实 advisor 调用：

\`\`\`bash
/advisor claude-opus-4-6
\`\`\`

或使用其他支持的模型（opus/sonnet/haiku 系列）。`
    }]
  }

  // 可用性检查
  if (!isAdvisorAvailableForSkill()) {
    return [{
      type: 'text',
      text: `⚠️ **Advisor 功能未启用**

需要配置 advisorModel 并确保 API 访问正常。
当前配置：\`${advisorModel}\`

如果问题持续，请检查：
- API Key 是否有效（运行 \`panda config\` 验证）
- 是否有网络连接
- 模型名称是否正确`
    }]
  }

  try {
    // 调用 advisorHelper 真实实现
    const result = await callAdvisorForSkill({
      messages: context.messages as Message[],
      workingDirectory: context.cwd || process.cwd(),
      apiKey: context.options?.apiKey || '',
      toolUseContext: context
    }, {
      prompt: question,
      advisorModel,
      contextMessageLimit: 10  // 限制上下文长度，控制成本
    })

    return [{
      type: 'text',
      text: result,
      cache_control: { type: 'ephemeral' }  // 启用 prompt caching
    }]

  } catch (error) {
    // 错误分级处理
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('429')) {
      return [{
        type: 'text',
        text: `⚠️ **API 限流**

请求过于频繁，请稍后重试（建议等待 1-2 分钟）。

如果频繁遇到此问题，可以：
- 减少 advisor 调用频率
- 检查 API 配额使用情况
- 考虑升级 API 套餐`
      }]
    }

    if (errorMessage.includes('401') || errorMessage.includes('API Key') || errorMessage.includes('authentication')) {
      return [{
        type: 'text',
        text: `❌ **认证失败**

API Key 无效或已过期。

**修复方法**：
1. 运行 \`panda config\` 更新 API Key
2. 确认 Key 权限包含 Messages API 访问
3. 检查 Key 是否已被撤销

当前 advisor 模型：\`${advisorModel}\``
      }]
    }

    if (errorMessage.includes('400') || errorMessage.includes('invalid_request')) {
      return [{
        type: 'text',
        text: `❌ **请求格式错误**

${errorMessage}

可能原因：
- 问题描述包含不支持的字符
- 上下文过长（当前限制：10 条消息）
- 模型不支持当前请求格式

请尝试简化问题描述或清空上下文后重试。`
      }]
    }

    // 通用错误
    return [{
      type: 'text',
      text: `❌ **Advisor 执行失败**

${errorMessage}

**调试信息**：
- Advisor 模型：\`${advisorModel}\`
- 工作目录：\`${context.cwd || process.cwd()}\`
- 上下文消息数：${context.messages.length}

如果问题持续，请提供上述信息寻求支持。`
    }]
  }
}

export function registerAdvisorSkill(): void {
  registerBundledSkill({
    name: 'advisor',
    description:
      '智能顾问 — 技术决策分析与多方案对比（需配置 advisorModel）',
    userInvocable: true,
    async getPromptForCommand(args, context) {
      const rawArgs = args?.trim() || ''

      // 模式 1：配置管理命令（委托给 /advisor）
      if (isConfigCommand(rawArgs)) {
        return [{ type: 'text', text: buildConfigPrompt(rawArgs) }]
      }

      // 模式 2：推理执行模式（真实 advisor API 调用）
      return executeAdvisorQuery(rawArgs, context)
    },
  })
}
