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
        const prompt = `你正在执行 /write compile 命令。

任务：将目录 \`${targetDir}\` 下的所有 Markdown 文件编译为一个完整文档。

步骤：
1. 使用 Glob 工具扫描 \`${targetDir}\` 下所有 .md 文件
2. 使用 Read 工具逐个读取文件内容
3. 按文件名排序，生成目录（TOC）
4. 合并所有内容，每个文件作为一个章节
5. 使用 Write 工具保存到 \`${targetDir}/compiled.md\`
6. 报告：文件数、总字数、输出路径

注意：必须使用工具操作，不能只在对话中展示。全程使用中文输出。`
        return [{ type: 'text', text: prompt }]
      }

      // Default: outline
      const topic = rest || '未指定主题 — 请提供一个写作主题'
      const topicSlug = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'untitled'
      const prompt = `你正在执行 /write outline 命令。

任务：为「${topic}」生成结构化写作大纲，并保存到文件。

步骤：
1. 生成包含 3-5 个主要章节的结构化大纲，每个章节有 2-3 个子节点
2. 使用 Write 工具保存大纲到当前目录下的 writing/ 子目录：
   文件路径: writing/${topicSlug}/outline.md
   格式: Markdown，带层级标题
3. 返回确认信息，包含文件路径和大纲概要

注意：必须实际创建文件，不能只在对话中展示大纲。全程使用中文输出。`
      return [{ type: 'text', text: prompt }]
    },
  })
}
