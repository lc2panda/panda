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
2. **创建笔记文件**：
   - 保存路径: \`${cwd}/working/inbox/${timestamp}.md\`（如果 working/inbox 目录不存在，先创建它）
   - 如果用户有 memory 目录 (\`${memoryDir}\`)，同时在 memory 中追加索引条目
3. **文件内容格式**：
   \`\`\`markdown
   ---
   type: <想法|TODO|问题|代码片段|参考|灵感>
   captured: ${new Date().toISOString()}
   source: manual
   ---

   <用户原文，适当格式化>
   \`\`\`
4. **确认输出**：告知用户文件已保存的位置和内容摘要

## 安全规则

- 不要修改用户原始内容的语义
- 如果内容看起来像代码，用代码块包裹
- 如果内容包含 URL，提取为链接格式

全程使用中文输出。`
      return [{ type: 'text', text: prompt }]
    },
  })
}
