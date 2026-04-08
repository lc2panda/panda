// Input: subcommand (from/review/plan) with file path or topic
// Output: flashcards, review session, or learning plan in markdown
// Pos: bundled skill — learning assistance entry point
import { getOriginalCwd } from '../../bootstrap/state.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerLearnSkill(): void {
  registerBundledSkill({
    name: 'learn',
    description:
      'Learning assistant — flashcards, spaced review, study plans · 学习助手 — 闪卡生成、间隔复习、学习路径规划',
    argumentHint: 'from <file> | review | plan <topic>',
    userInvocable: true,
    async getPromptForCommand(args) {
      const trimmed = args.trim()
      const subMatch = trimmed.match(/^(from|review|plan)\s*([\s\S]*)$/i)
      const subcommand = subMatch ? subMatch[1].toLowerCase() : 'plan'
      const rest = subMatch ? subMatch[2].trim() : trimmed
      const cwd = getOriginalCwd() || '.'

      if (subcommand === 'from') {
        const filePath = rest || ''
        if (!filePath) {
          return [
            {
              type: 'text',
              text: '请提供文件路径。用法: `/learn from <file>`',
            },
          ]
        }
        const prompt = `# 从文件生成闪卡

源文件: \`${filePath}\`

## 任务

读取指定文件的内容，提取关键知识点，生成间隔重复（Spaced Repetition）闪卡。

## 步骤

1. **读取文件**：完整读取 \`${filePath}\` 的内容
2. **内容分析**：
   - 识别核心概念、定义、公式、代码模式
   - 提取因果关系、对比关系、步骤流程
   - 标记难度级别（基础/中级/高级）
3. **生成闪卡**（最多 20 张）：
   - 每张卡片包含：正面（问题）和背面（答案）
   - 问题类型多样化：定义题、对比题、应用题、填空题
   - 避免过于简单或过于宽泛的问题
4. **输出格式**：

\`\`\`markdown
## 闪卡集: <主题>

### 卡片 1 [基础]
**Q**: 问题
**A**: 答案

### 卡片 2 [中级]
**Q**: 问题
**A**: 答案
\`\`\`

5. **保存闪卡**：将闪卡保存到 \`${cwd}/working/flashcards/\` 目录（自动创建）

全程使用中文输出。`
        return [{ type: 'text', text: prompt }]
      }

      if (subcommand === 'review') {
        const prompt = `# 间隔重复复习

工作目录: \`${cwd}\`

## 任务

查找并组织一次间隔重复复习会话。

## 步骤

1. **查找闪卡**：
   - 扫描 \`${cwd}/working/flashcards/\` 目录下所有闪卡文件
   - 如果没有找到闪卡，提示用户先运行 \`/learn from <file>\` 生成
2. **选择复习集**：
   - 如果有复习记录文件 (\`${cwd}/working/flashcards/.review-log.json\`)，基于间隔重复算法选择到期卡片
   - 如果没有记录，选择最旧的闪卡集开始
   - 每次复习 5-10 张卡片
3. **进行复习**：
   - 逐张展示卡片正面（问题）
   - 等待用户思考后展示答案
   - 使用 AskUserQuestion 让用户自评：记住了 / 模糊 / 忘了
4. **更新记录**：
   - 根据自评结果更新复习间隔
   - 记住了: 间隔 x2（最长 30 天）
   - 模糊: 间隔不变
   - 忘了: 重置为 1 天
   - 保存到 .review-log.json
5. **复习总结**：展示本次复习的统计数据

全程使用中文输出。`
        return [{ type: 'text', text: prompt }]
      }

      // Default: plan
      const topic = rest || '未指定主题 — 请提供一个学习主题'
      const prompt = `# 学习路径规划

主题: **${topic}**

## 任务

为「${topic}」制定一份系统化的学习路径。

## 路径结构

1. **前置知识评估**：
   - 列出学习该主题需要的前置知识
   - 标注哪些是必须的、哪些是推荐的
   - 提供快速检验是否具备前置知识的小测试

2. **学习阶段规划**（3-5 个阶段）：
   每个阶段包含：
   - 阶段目标（学完能做什么）
   - 核心概念列表
   - 推荐资源（书籍/课程/文档/项目）
   - 练习建议（动手项目或习题）
   - 预估时间
   - 检验标准（怎么知道学会了）

3. **里程碑项目**：
   - 2-3 个递进难度的实践项目
   - 每个项目的目标、技术栈、预期成果

4. **常见陷阱**：
   - 学习该主题时常见的误区
   - 容易卡住的难点及解决建议

5. **持续成长**：
   - 进阶方向
   - 社区/资源推荐
   - 保持技能的建议

## 输出

以 Markdown 格式输出完整学习路径。保存到 \`${cwd}/working/learn-plans/\` 目录。

全程使用中文输出。`
      return [{ type: 'text', text: prompt }]
    },
  })
}
