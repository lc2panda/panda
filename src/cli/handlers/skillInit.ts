/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handler intentionally exits */

import { createInterface } from 'readline'
import { mkdir, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
import { homedir } from 'os'

/**
 * Input: 用户交互输入（skill 名称、入口指令、描述等）
 * Output: 生成 skill 文件（skill.json、prompt.md）
 * Pos: CLI handlers — skill init 交互式初始化
 */

interface SkillInitOptions {
  name?: string
  command?: string
  description?: string
  output?: string
  nonInteractive?: boolean
}

export async function skillInitHandler(options: SkillInitOptions) {
  try {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve)
      })
    }

    console.log('\n✨ 初始化 Panda Skill\n')

    // Skill 名称
    let skillName = options.name
    if (!skillName && !options.nonInteractive) {
      skillName = await question('? Skill 名称: ')
    }
    skillName = skillName?.trim() || 'my-skill'

    // 入口指令
    let command = options.command
    if (!command && !options.nonInteractive) {
      command = await question(`? 入口指令 (可选, 如 /${skillName}): `)
    }
    command = command?.trim() || `/${skillName}`

    // 描述
    let description = options.description
    if (!description && !options.nonInteractive) {
      description = await question('? 描述: ')
    }
    description = description?.trim() || `Custom skill: ${skillName}`

    // 输出目录
    let outputDir = options.output
    if (!outputDir && !options.nonInteractive) {
      const defaultDir = join(homedir(), '.panda', 'skills')
      outputDir = await question(`? 输出目录 (${defaultDir}): `)
    }
    const baseDir = outputDir?.trim() || join(homedir(), '.panda', 'skills')
    outputDir = resolve(baseDir, skillName)

    rl.close()

    // 检查目录是否存在
    if (existsSync(outputDir)) {
      console.error(`\n❌ 目录已存在: ${outputDir}`)
      process.exit(1)
    }

    // 创建目录
    await mkdir(outputDir, { recursive: true })

    // 生成 skill.json
    const skillJson = {
      name: skillName,
      version: '0.1.0',
      description,
      command,
      prompt: './prompt.md',
    }

    await writeFile(
      join(outputDir, 'skill.json'),
      JSON.stringify(skillJson, null, 2)
    )

    // 生成 prompt.md
    const promptMd = generatePromptTemplate(skillName, description)
    await writeFile(join(outputDir, 'prompt.md'), promptMd)

    // 完成
    console.log(`\n✅ 已创建:`)
    console.log(`  ${outputDir}/skill.json`)
    console.log(`  ${outputDir}/prompt.md`)
    console.log(`\n📖 使用方式:`)
    console.log(`  在 Panda 对话中输入: ${command} <参数>`)
    console.log(`\n💡 提示:`)
    console.log(`  编辑 ${outputDir}/prompt.md 来定义 skill 行为`)
    console.log()

    return 0
  } catch (error) {
    console.error(
      `\n❌ Skill 初始化失败: ${error instanceof Error ? error.message : String(error)}`
    )
    return 1
  }
}

function generatePromptTemplate(name: string, description: string): string {
  return `# ${name}

${description}

## 指令

\`${name}\` — ${description}

## 行为

当用户输入此 skill 时：

1. 分析用户输入的参数
2. 执行相应操作
3. 返回结果

## 示例

\`\`\`
User: /${name} test
Assistant: [根据 skill 逻辑处理 'test' 参数]
\`\`\`

## 参数说明

- \`<input>\` - 输入参数描述

## 实现提示

在此定义 skill 的具体行为逻辑、调用的工具、生成的输出格式等。
该 prompt 会被注入到 AI 的系统消息中。
`
}
