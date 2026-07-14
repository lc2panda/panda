/**
 * Input: 技能上下文（对话历史、工作目录、API 密钥）+ 顾问提示词
 * Output: 顾问分析结果文本
 * Pos: 技能层与 query() 核心接口之间的适配桥梁
 *
 * 为技能提供顾问模型调用能力，封装消息构造、可用性检查、结果提取等逻辑。
 */

import type { Message } from '../../types/message.js'
import { query } from '../../query.js'
import { getGlobalConfig } from '../../utils/config.js'
import type { QuerySource } from '../../constants/querySource.js'

/**
 * 技能调用顾问的上下文参数
 */
export interface SkillAdvisorContext {
  /** 当前对话历史 */
  messages: Message[]
  /** 工作目录 */
  workingDirectory: string
  /** API 密钥 */
  apiKey: string
  /** 技能的 toolUseContext（包含模型配置、系统提示等） */
  toolUseContext: any // 使用 any 以兼容现有架构
}

/**
 * 顾问调用选项
 */
export interface AdvisorCallOptions {
  /** 发送给顾问的用户提示词 */
  prompt: string
  /** 可选：覆盖全局顾问模型配置 */
  advisorModel?: string
  /** 可选：限制上下文消息数量（默认 10 条） */
  contextMessageLimit?: number
}

/**
 * 为技能调用顾问模型
 *
 * @param context 技能上下文（包含对话历史、工作目录等）
 * @param options 调用选项（提示词、模型覆盖等）
 * @returns 顾问分析结果文本
 * @throws {Error} 顾问未配置或调用失败
 *
 * @example
 * ```typescript
 * const result = await callAdvisorForSkill(
 *   { messages, workingDirectory, apiKey, toolUseContext },
 *   { prompt: '分析当前代码库的架构模式' }
 * )
 * ```
 */
export async function callAdvisorForSkill(
  context: SkillAdvisorContext,
  options: AdvisorCallOptions,
): Promise<string> {
  // 1. 检查可用性
  if (!isAdvisorAvailableForSkill()) {
    throw new Error(
      'Advisor not configured. Set advisorModel in global config (~/.pandacc/config.json).',
    )
  }

  // 2. 获取顾问模型配置
  const config = getGlobalConfig()
  const advisorModel = options.advisorModel || config.settings?.advisorModel
  if (!advisorModel) {
    throw new Error('advisorModel not specified in config or options')
  }

  // 3. 构造消息数组
  const messages = buildMessagesForAdvisor(
    context.messages,
    options.prompt,
    options.contextMessageLimit,
  )

  // 4. 构造 QueryParams
  // 注意：根据当前架构，query() 需要完整的 QueryParams
  // 这里使用 toolUseContext 提供必要参数
  const queryParams = {
    messages,
    systemPrompt: context.toolUseContext.systemPrompt || '',
    userContext: context.toolUseContext.userContext || {},
    systemContext: context.toolUseContext.systemContext || {},
    canUseTool: context.toolUseContext.canUseTool || (() => true),
    toolUseContext: {
      ...context.toolUseContext,
      options: {
        ...context.toolUseContext.options,
        model: advisorModel, // 使用顾问模型
        apiKey: context.apiKey,
      },
    },
    querySource: 'skill_advisor_call' as QuerySource,
    maxTurns: 1, // 顾问调用限制单轮
  }

  // 5. 调用 query() 并收集结果
  const responseChunks: string[] = []
  let lastAssistantContent: any = null

  try {
    for await (const event of query(queryParams)) {
      // 收集 assistant 消息内容
      if (event.type === 'assistant') {
        lastAssistantContent = event.message?.content
      }
      // 也可以收集 content_block_delta 等流式事件
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        responseChunks.push(event.delta.text || '')
      }
    }
  } catch (error) {
    throw new Error(
      `Advisor query failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // 6. 提取顾问结果
  // 优先使用流式累积文本，如果为空则从最终消息提取
  if (responseChunks.length > 0) {
    return responseChunks.join('')
  }

  if (lastAssistantContent) {
    return extractTextFromContent(lastAssistantContent)
  }

  throw new Error('No advisor result found in response')
}

/**
 * 检查顾问是否可用
 *
 * @returns true 如果全局配置中存在 advisorModel
 */
export function isAdvisorAvailableForSkill(): boolean {
  try {
    const config = getGlobalConfig()
    return !!(config.settings?.advisorModel)
  } catch {
    return false
  }
}

/**
 * 构造顾问消息格式
 *
 * @param conversationHistory 对话历史
 * @param userPrompt 用户问题
 * @param contextLimit 上下文消息数量限制（默认 10）
 * @returns 格式化的消息数组
 */
function buildMessagesForAdvisor(
  conversationHistory: Message[],
  userPrompt: string,
  contextLimit: number = 10,
): Message[] {
  // 截取最近 N 条消息作为上下文
  const recentMessages = conversationHistory.slice(-contextLimit)

  // 添加用户问题（构造简单的 UserMessage）
  const userMessage: Message = {
    type: 'user',
    uuid: crypto.randomUUID(),
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: userPrompt,
        },
      ],
    },
  }

  return [...recentMessages, userMessage]
}

/**
 * 从消息内容中提取纯文本
 *
 * @param content 消息内容（string | ContentBlock[]）
 * @returns 提取的文本
 */
function extractTextFromContent(content: any): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    const textBlocks = content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text || '')
    return textBlocks.join('\n')
  }

  return ''
}
