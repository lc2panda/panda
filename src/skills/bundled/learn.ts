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
        const todayStr = new Date().toISOString().slice(0, 10)
        const prompt = `你正在执行 /learn from 命令。

任务：从文件中提取知识点并生成闪卡。

步骤：
1. 使用 Read 工具读取 \`${filePath}\`
2. 提取 5-15 个关键知识点，每个生成 Q/A 闪卡对
3. 使用 Write 工具保存到 \`${cwd}/working/flashcards/{topic}.json\`:
   {
     "topic": "{推断的主题}",
     "source": "${filePath}",
     "created": "${new Date().toISOString()}",
     "cards": [
       { "id": 1, "q": "问题", "a": "答案", "stability": 1, "difficulty": 0.3, "lastReview": null, "nextReview": "${todayStr}" }
     ]
   }
4. 如果 \`${cwd}/working/flashcards/.review-log.json\` 不存在，使用 Write 创建初始化文件
5. 报告：生成了 N 张闪卡，保存路径

注意：必须使用 Write 工具创建实际文件。全程使用中文输出。`
        return [{ type: 'text', text: prompt }]
      }

      if (subcommand === 'review') {
        const prompt = `你正在执行 /learn review 命令。

任务：基于 FSRS 间隔重复进行闪卡复习。

步骤：
1. 使用 Glob 扫描 \`${cwd}/working/flashcards/*.json\`
2. 使用 Read 读取所有闪卡文件
3. 筛选今日到期的闪卡（nextReview <= today）
4. 逐卡展示问题，等待用户回答
5. 用户自评后（0=忘了 1=困难 2=一般 3=容易），计算新间隔:
   调用 fsrsNextInterval(grade, stability, difficulty, elapsed) 逻辑:
   - 更新 stability, difficulty, nextReview
6. 使用 Edit 工具更新闪卡文件中的参数
7. 汇总报告：复习 N 张，下次到期分布

注意：必须实际更新文件中的 FSRS 参数。全程使用中文输出。`
        return [{ type: 'text', text: prompt }]
      }

      // Default: plan
      const topic = rest || '未指定主题 — 请提供一个学习主题'
      const topicSlug = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'untitled'
      const prompt = `你正在执行 /learn plan 命令。

任务：为主题「${topic}」生成学习路径。

步骤：
1. 生成 3-5 个学习阶段，每阶段含:
   - 目标
   - 推荐资源（书籍/文档/教程）
   - 练习建议
   - 预计时间
   - 里程碑检查点
2. 使用 Write 工具保存到 \`${cwd}/working/learning-plans/${topicSlug}.md\`
3. 报告文件路径

注意：必须使用 Write 工具创建文件。全程使用中文输出。`
      return [{ type: 'text', text: prompt }]
    },
  })
}
