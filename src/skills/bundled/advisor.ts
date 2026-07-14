// Input: args string (问题描述 或 配置命令：status/off/<model>)
// Output: registers the `advisor` bundled skill (Command) into the registry
// Pos: bundled skills — 智能顾问技能，技术决策分析与多方案对比
//
// 双模式设计：
// 1. 配置管理模式（委托给 /advisor 命令）：
//    - /advisor            → 显示当前配置
//    - /advisor opus       → 设置顾问模型
//    - /advisor off        → 禁用顾问
// 2. 推理执行模式（生成分析 prompt）：
//    - /advisor 如何选择数据库？ → 触发技术决策分析
//
// 配置持久化对齐：
// - 读取路径：getAppState().advisorModel (来自 settings.advisorModel)
// - 示例配置：{ "advisorModel": "claude-opus-4-6" }
// - 未配置时友好提示配置方式，不静默失败

import { registerBundledSkill } from '../bundledSkills.js'

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
 * 构建推理执行 prompt（技术决策分析）
 */
function buildAnalysisPrompt(question: string, context: {
  advisorModel?: string
  mainModel?: string
}): string {
  const sections: string[] = []

  sections.push(`# 智能顾问 — 技术决策分析

**问题**：${question}

你的任务是以高级技术顾问的身份，提供深度、结构化的技术决策分析。`)

  // 配置状态提示
  if (!context.advisorModel) {
    sections.push(`## ⚠️ 配置提示

当前未配置 advisorModel。建议先配置顾问模型以启用服务端 advisor 工具：

\`\`\`bash
/advisor claude-opus-4-6
\`\`\`

配置后，主循环模型（${context.mainModel || '当前模型'}）可以在需要时自动调用 advisor 工具获得更强的推理支持。

**本次分析将继续进行**，但不会使用服务端 advisor 工具。`)
  } else {
    sections.push(`## ℹ️ 配置状态

- 当前 advisorModel: \`${context.advisorModel}\`
- 主循环模型: \`${context.mainModel || '未知'}\`

注：本 skill 基于 prompt 模式分析，不直接调用服务端 advisor 工具（该工具仅在主循环中自动触发）。`)
  }

  sections.push(`## Phase 1: 问题澄清与边界定义

- 识别问题的核心维度（性能/成本/可维护性/团队能力/时间约束等）
- 列出关键约束条件
- 明确决策的影响范围和时间跨度
- 如果问题描述不够具体，列出需要澄清的关键信息点`)

  sections.push(`## Phase 2: 方案生成（至少 3 个）

为每个方案提供：
1. **方案名称**（清晰简洁）
2. **核心思路**（2-3 句话）
3. **技术栈**（具体工具/框架/服务）
4. **适用场景**（什么情况下这是最优解）
5. **关键优势**（3-5 点，量化数据优先）
6. **主要风险**（技术债/运维成本/团队学习曲线等）
7. **实施成本**（时间/人力/资金的粗略估算）

覆盖不同的技术路线（如：自建 vs 托管服务，SQL vs NoSQL，单体 vs 微服务等）。`)

  sections.push(`## Phase 3: 多维度对比矩阵

构建对比表格（Markdown table），维度至少包含：
- 初始成本
- 运维复杂度
- 可扩展性
- 性能表现
- 生态成熟度
- 团队熟悉度
- 长期 TCO（Total Cost of Ownership）

使用评分（1-5 分）或明确的量化指标（QPS、延迟、成本/月等）。`)

  sections.push(`## Phase 4: 决策建议

基于前述分析，给出：
1. **推荐方案**（Top 1 或 Top 2）及推荐理由
2. **不推荐方案**及排除原因
3. **决策树**（如果 X 条件成立选 A，否则选 B）
4. **验证计划**（如何快速验证选择是否正确，如 PoC 方案、关键指标）
5. **回滚预案**（如果选择失败，如何以最小代价切换）`)

  sections.push(`## Phase 5: 延伸资源

- 官方文档链接（优先级最高）
- 权威对比文章或白皮书
- 真实案例研究（类似规模/场景的公司选型经验）
- 社区讨论（GitHub Issues、Stack Overflow 高票回答等）

**格式要求**：
- 使用中文输出
- 结构清晰，分段明确
- 优先使用表格、列表等结构化格式
- 量化数据优先于主观描述
- 明确标注假设和不确定性

**禁止**：
- 模糊的"根据情况而定"式建议
- 没有证据支撑的绝对化断言
- 忽略成本/风险的单一维度推荐
- 过时的技术栈推荐（需注明调研时间）`)

  return sections.join('\n\n')
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

      // 模式 2：推理执行模式（技术决策分析）
      const appState = context.getAppState()
      const advisorModel = appState.advisorModel
      const mainModel = appState.mainLoopModel

      const prompt = buildAnalysisPrompt(rawArgs, {
        advisorModel,
        mainModel,
      })

      return [{ type: 'text', text: prompt }]
    },
  })
}
