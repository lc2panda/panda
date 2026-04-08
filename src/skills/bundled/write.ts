// Input: user topic string or directory path via /write command
// Output: writing outline (markdown) or compiled single document
// Pos: bundled skill — non-coding writing assistance entry point
import { getOriginalCwd } from '../../bootstrap/state.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerWriteSkill(): void {
  registerBundledSkill({
    name: 'write',
    description:
      'Generate writing outlines or compile markdown projects · 生成写作大纲或编译 Markdown 写作项目',
    argumentHint: 'outline <topic> | compile [dir]',
    userInvocable: true,
    async getPromptForCommand(args) {
      const trimmed = args.trim()
      const subMatch = trimmed.match(/^(outline|compile)\s*([\s\S]*)$/i)
      const subcommand = subMatch ? subMatch[1].toLowerCase() : 'outline'
      const rest = subMatch ? subMatch[2].trim() : trimmed

      if (subcommand === 'compile') {
        const targetDir = rest || getOriginalCwd() || '.'
        const prompt = `# 写作项目编译

目标目录: \`${targetDir}\`

## 任务

将目录下所有 Markdown (.md) 文件编译为一份完整文档。

## 步骤

1. **扫描目录**：列出 \`${targetDir}\` 下所有 .md 文件（递归），按文件名/路径自然排序
2. **读取内容**：逐一读取每个文件的完整内容
3. **合并输出**：
   - 生成统一标题页（基于目录名或 README 中的项目名）
   - 按排序顺序拼接所有文件内容
   - 在文件之间插入分隔符和来源标注
   - 生成目录索引（TOC）
4. **质量检查**：
   - 检查标题层级是否一致（避免 h1 冲突）
   - 检查交叉引用和链接是否失效
   - 检查图片引用路径

## 输出

将编译结果输出为一份完整的 Markdown 文档。如果文件过多，先展示目录结构和统计信息，询问用户确认后再完整输出。

全程使用中文输出。`
        return [{ type: 'text', text: prompt }]
      }

      // Default: outline
      const topic = rest || '未指定主题 — 请提供一个写作主题'
      const prompt = `# 写作大纲生成

主题: **${topic}**

## 任务

为「${topic}」生成一份结构清晰、逻辑连贯的写作大纲。

## 大纲要求

1. **标题与副标题**：为文章拟定一个吸引读者的标题和副标题
2. **引言段**：明确文章的核心论点/目的，吸引读者兴趣
3. **主体结构**（3-7 个主要章节）：
   - 每章节包含：标题、核心要点（2-4 个）、支撑论据/案例提示
   - 章节之间有逻辑递进关系
4. **结论段**：总结要点，呼应引言，提供行动建议或思考方向
5. **附录建议**：参考资料方向、进一步阅读建议

## 输出格式

使用 Markdown 层级结构输出大纲，每个要点用简明的一句话描述。在大纲末尾附上：
- 预估字数范围
- 目标读者画像
- 写作风格建议（学术/通俗/叙事/说服等）

全程使用中文输出。`
      return [{ type: 'text', text: prompt }]
    },
  })
}
