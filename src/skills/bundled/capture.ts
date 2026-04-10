// Input: user text content via /capture command
// Output: note saved to working/inbox directory as timestamped markdown
// Pos: bundled skill — quick idea capture entry point
import { getAutoMemPath } from '../../memdir/paths.js'
import { getOriginalCwd } from '../../bootstrap/state.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerCaptureSkill(): void {
  registerBundledSkill({
    name: 'capture',
    description:
      'Quick-capture an idea or note to working directory · 快速捕获想法到工作目录',
    argumentHint: '<text>',
    userInvocable: true,
    async getPromptForCommand(args) {
      const content = args.trim()
      const memoryDir = getAutoMemPath()
      const cwd = getOriginalCwd() || '.'
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

      if (!content) {
        return [
          {
            type: 'text',
            text: '请提供要捕获的内容。用法: `/capture 你想记录的想法或笔记`',
          },
        ]
      }

      const slug = content.slice(0, 30).replace(/[^a-zA-Z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'note'
      const isoNow = new Date().toISOString()

      const prompt = `你正在执行 /capture 命令。

任务：将用户的想法快速捕获并归档到记忆系统。

用户输入: ${content}

步骤：
1. 分析内容，判定 PARA 分类:
   - Projects: 有明确截止日期或交付物的项目相关 → working/projects/
   - Areas: 持续关注的责任领域（健康、学习、团队管理等）→ working/areas/
   - Resources: 有价值的参考资料、灵感、方法论 → working/resources/
   - Archives: 已完成或不再活跃的内容 → working/archives/
   - 无法明确分类 → working/inbox/

2. 使用 Write 工具创建文件:
   路径: ${memoryDir}/working/{para-category}/${timestamp}-${slug}.md

   文件内容:
   ---
   type: capture
   para: {category}
   created: ${isoNow}
   tags: [自动推断的标签]
   ---

   ${content}

   ## AI 补充
   {对内容的简要分析和可能的后续行动建议}

3. 返回确认: "已保存到 working/{category}/{filename}"

注意：必须实际创建文件。使用 Write 工具，不要让用户手动操作。全程使用中文输出。`
      return [{ type: 'text', text: prompt }]
    },
  })
}
