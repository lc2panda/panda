/**
 * Input: 技能上下文（对话历史、工作目录、API 密钥）+ 顾问提示词
 * Output: 顾问分析结果文本
 * Pos: 技能层与 query() 核心接口之间的适配桥梁
 *
 * 为技能提供顾问模型调用能力，封装消息构造、可用性检查、结果提取等逻辑。
 *
 * 数据源约定（H-015）：
 *   resolveAdvisorModel 是唯一解析入口：
 *   1) options.advisorModel 显式覆盖
 *   2) 会话 appState.advisorModel（/advisor 命令写入）
 *   3) 持久化 settings.advisorModel（getInitialAdvisorSetting）
 *   禁止读取 getGlobalConfig().settings（GlobalConfig 无 settings 字段）。
 *
 * 权限约定（H-014）：
 *   canUseTool 默认 fail-closed 拒绝；禁止 () => true 自动放行。
 */

import type { Message } from '../../types/message.js'
import { query } from '../../query.js'
import { getInitialAdvisorSetting } from '../../utils/advisor.js'
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
  /** 技能的 toolUseContext（包含模型配置、系统提示、canUseTool、getAppState 等） */
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
  /**
   * 可选：工具审批回调。若缺省，回退到 toolUseContext.canUseTool；
   * 二者皆缺时 fail-closed 拒绝（H-014）。
   */
  canUseTool?: (tool: unknown, input: unknown) => unknown
}

/** AppState 子集：仅取 advisorModel */
type AdvisorAppStateSlice = { advisorModel?: string }

/** 可提供 getAppState 的上下文（ToolUseContext 子集） */
export type AdvisorModelContext = {
  getAppState?: () => AdvisorAppStateSlice
}

/**
 * Fail-closed 默认 canUseTool：拒绝一切工具调用（H-014）。
 * 调用方必须显式传入 canUseTool 才能放行。
 */
export async function denyAllCanUseTool(): Promise<{
  behavior: 'deny'
  message: string
  decisionReason: { type: 'other'; reason: string }
}> {
  return {
    behavior: 'deny',
    message:
      'Advisor skill denies tool use by default (fail-closed). Pass canUseTool explicitly to grant permissions.',
    decisionReason: {
      type: 'other',
      reason: 'advisor-skill-default-deny',
    },
  }
}

/**
 * 统一解析 advisorModel（H-015 单一事实源）。
 *
 * 优先级：
 * 1. explicitOverride（调用方 options.advisorModel）
 * 2. 会话 appState.advisorModel（/advisor 写入，与技能一致）
 * 3. 持久化 settings.advisorModel（getInitialAdvisorSetting）
 */
export function resolveAdvisorModel(
  toolUseContext?: AdvisorModelContext | null,
  explicitOverride?: string,
): string | undefined {
  if (explicitOverride && explicitOverride.trim()) {
    return explicitOverride.trim()
  }

  try {
    const sessionModel = toolUseContext?.getAppState?.()?.advisorModel
    if (sessionModel && sessionModel.trim()) {
      return sessionModel.trim()
    }
  } catch {
    // getAppState 不可用时回退 settings
  }

  return getInitialAdvisorSetting()
}

/**
 * 判断输入是否为明确的配置意图（H-013）。
 *
 * 仅下列情况走配置分支：
 * - 空输入（status）
 * - 整词 subcommand：clear / status / off / on
 * - 单 token 模型名（sonnet / opus / haiku / claude…）
 * - `set <model>` / `model <model>`
 *
 * 含分析问法（vs / 怎么 / 如何 / 比较 等）→ 决策分析。
 */
export function isAdvisorConfigIntent(args: string): boolean {
  const trimmed = args.trim()
  if (!trimmed) return true // empty → status

  const lower = trimmed.toLowerCase()

  // 分析问法优先：一旦命中，绝不走配置
  if (hasAnalysisIntent(lower)) {
    return false
  }

  const tokens = lower.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  // 显式 subcommand
  const CONFIG_SUBCOMMANDS = new Set([
    'clear',
    'status',
    'off',
    'on',
    'set',
    'model',
  ])
  if (tokens.length === 1 && CONFIG_SUBCOMMANDS.has(tokens[0]!)) {
    return true
  }

  // set <model> / model <model>
  if (
    tokens.length === 2 &&
    (tokens[0] === 'set' || tokens[0] === 'model') &&
    looksLikeModelToken(tokens[1]!)
  ) {
    return true
  }

  // 仅单 token 且像模型名 → 配置（/advisor sonnet）
  if (tokens.length === 1 && looksLikeModelToken(tokens[0]!)) {
    return true
  }

  // 其余（含多 token 自然语言）→ 决策分析
  return false
}

/** CJK / 英文分析意图标记 */
function hasAnalysisIntent(lowerText: string): boolean {
  const cjkMarkers = [
    '怎么',
    '如何',
    '比较',
    '选择',
    '哪个',
    '哪款',
    '区别',
    '还是',
    '推荐',
    '建议',
    '适合',
    '为什么',
  ]
  if (cjkMarkers.some(m => lowerText.includes(m))) {
    return true
  }

  // 英文整词匹配，避免 startsWith 误伤
  return /\b(vs|versus|compare|comparison|which|better|difference|what|why|how|or)\b/i.test(
    lowerText,
  )
}

function looksLikeModelToken(token: string): boolean {
  const SHORT = new Set(['sonnet', 'opus', 'haiku'])
  if (SHORT.has(token)) return true
  // claude / claude-sonnet-4-... / claude-3-5-sonnet-...
  if (token.startsWith('claude')) return true
  // sonnet-4 / opus@... 等扩展写法
  for (const m of SHORT) {
    if (token.startsWith(m + '-') || token.startsWith(m + '@')) return true
  }
  return false
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
 *   { prompt: '分析当前代码库的架构模式', canUseTool: parentCanUseTool }
 * )
 * ```
 */
export async function callAdvisorForSkill(
  context: SkillAdvisorContext,
  options: AdvisorCallOptions,
): Promise<string> {
  // 1. 解析模型（单一事实源，H-015）
  const advisorModel = resolveAdvisorModel(
    context.toolUseContext,
    options.advisorModel,
  )
  if (!advisorModel) {
    throw new Error(
      'Advisor not configured. Run `/advisor <model>` or set settings.advisorModel.',
    )
  }

  // 2. 构造消息数组
  const messages = buildMessagesForAdvisor(
    context.messages,
    options.prompt,
    options.contextMessageLimit,
  )

  // 3. 权限：显式 options > toolUseContext > fail-closed deny（H-014）
  const canUseTool =
    options.canUseTool ??
    (typeof context.toolUseContext?.canUseTool === 'function'
      ? context.toolUseContext.canUseTool
      : denyAllCanUseTool)

  // 4. 构造 QueryParams
  const queryParams = {
    messages,
    systemPrompt: context.toolUseContext.systemPrompt || '',
    userContext: context.toolUseContext.userContext || {},
    systemContext: context.toolUseContext.systemContext || {},
    canUseTool,
    toolUseContext: {
      ...context.toolUseContext,
      options: {
        ...context.toolUseContext.options,
        model: advisorModel,
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
      if (event.type === 'assistant') {
        lastAssistantContent = event.message?.content
      }
      if (
        event.type === 'content_block_delta' &&
        event.delta?.type === 'text_delta'
      ) {
        responseChunks.push(event.delta.text || '')
      }
    }
  } catch (error) {
    throw new Error(
      `Advisor query failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // 6. 提取顾问结果
  if (responseChunks.length > 0) {
    return responseChunks.join('')
  }

  if (lastAssistantContent) {
    return extractTextFromContent(lastAssistantContent)
  }

  throw new Error('No advisor result found in response')
}

/**
 * 检查顾问是否可用（H-015：与 resolveAdvisorModel 同源）。
 *
 * @param toolUseContext 可选；传入时可读取会话 appState.advisorModel
 * @returns true 当会话或持久化 settings 中存在 advisorModel
 */
export function isAdvisorAvailableForSkill(
  toolUseContext?: AdvisorModelContext | null,
): boolean {
  try {
    return !!resolveAdvisorModel(toolUseContext)
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
export function buildMessagesForAdvisor(
  conversationHistory: Message[],
  userPrompt: string,
  contextLimit: number = 10,
): Message[] {
  const recentMessages = conversationHistory.slice(-contextLimit)

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
export function extractTextFromContent(content: any): string {
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
