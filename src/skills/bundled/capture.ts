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

      const prompt = `# 快速捕获

## 用户输入

${content}

## 任务

将上述内容保存为一条结构化笔记。

## 步骤

1. **分析内容**：判断内容类型（想法/TODO/问题/代码片段/参考链接/灵感）
2. **PARA 分类**：根据内容特征判断最合适的归档位置：
   - **Projects** (\`${cwd}/working/projects/\`): 有明确截止日期或交付物的活跃项目相关内容
   - **Areas** (\`${cwd}/working/areas/\`): 持续关注的责任领域（健康、财务、职业发展等）
   - **Resources** (\`${cwd}/working/resources/\`): 感兴趣的参考资料、教程、工具收集
   - **Archives** (\`${cwd}/working/archives/\`): 已完成或不再活跃的内容
   - **Inbox** (\`${cwd}/working/inbox/\`): 无法明确归类时的默认位置
   - 判断依据：如果内容提到具体项目名称/截止日期→Projects；如果是长期关注领域→Areas；如果是参考资料/链接收集→Resources；否则→Inbox
3. **创建笔记文件**：
   - 保存路径: \`${cwd}/working/<PARA分类>/${timestamp}.md\`（如果目录不存在，先创建它）
   - 如果用户有 memory 目录 (\`${memoryDir}\`)，同时在 memory 中追加索引条目
4. **文件内容格式**：
   \`\`\`markdown
   ---
   type: <想法|TODO|问题|代码片段|参考|灵感>
   para: <projects|areas|resources|archives|inbox>
   captured: ${new Date().toISOString()}
   source: manual
   ---

   <用户原文，适当格式化>
   \`\`\`
5. **确认输出**：告知用户文件已保存的位置和内容摘要

## 安全规则

- 不要修改用户原始内容的语义
- 如果内容看起来像代码，用代码块包裹
- 如果内容包含 URL，提取为链接格式

全程使用中文输出。`
      return [{ type: 'text', text: prompt }]
    },
  })
}
