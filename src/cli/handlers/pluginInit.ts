/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handler intentionally exits */

import { createInterface } from 'readline'
import { mkdir, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

/**
 * Input: 用户交互输入（插件名、类型、描述等）
 * Output: 生成插件脚手架文件（package.json、tsconfig.json、src/index.ts、README.md）
 * Pos: CLI handlers — plugin init 交互式初始化
 */

interface PluginInitOptions {
  name?: string
  type?: string
  description?: string
  author?: string
  output?: string
  nonInteractive?: boolean
}

const PLUGIN_TYPES = [
  { value: 'tool', label: 'Tool Plugin (提供自定义工具)' },
  { value: 'hook', label: 'Hook Plugin (监听生命周期事件)' },
  { value: 'agent', label: 'Agent Plugin (注册 sub-agent)' },
  { value: 'mcp', label: 'MCP Plugin (包装 MCP 服务器)' },
] as const

export async function pluginInitHandler(options: PluginInitOptions) {
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

    console.log('\n✨ 初始化 Panda 插件\n')

    // 插件名称
    let pluginName = options.name
    if (!pluginName && !options.nonInteractive) {
      pluginName = await question('? 插件名称 (my-plugin): ')
    }
    pluginName = pluginName?.trim() || 'my-plugin'

    // 插件类型
    let pluginType = options.type
    if (!pluginType && !options.nonInteractive) {
      console.log('\n? 插件类型:')
      PLUGIN_TYPES.forEach((t, i) => {
        console.log(`  ${i === 0 ? '❯' : ' '} ${t.label}`)
      })
      const typeInput = await question('  选择 [1-4] (1): ')
      const typeIndex = parseInt(typeInput.trim() || '1', 10) - 1
      pluginType = PLUGIN_TYPES[typeIndex]?.value || 'tool'
    }
    pluginType = pluginType || 'tool'
    if (!PLUGIN_TYPES.some(({ value }) => value === pluginType)) {
      pluginType = 'tool'
    }
    const canonicalPluginType = pluginType as (typeof PLUGIN_TYPES)[number]['value']

    // 描述
    let description = options.description
    if (!description && !options.nonInteractive) {
      description = await question('? 描述 (可选): ')
    }
    description = description?.trim() || `A ${canonicalPluginType} plugin for Panda`

    // 作者
    let author = options.author
    if (!author && !options.nonInteractive) {
      author = await question('? 作者 (可选): ')
    }
    author = author?.trim() || ''

    // 输出目录
    let outputDir = options.output
    if (!outputDir && !options.nonInteractive) {
      outputDir = await question(`? 输出目录 (.): `)
    }
    outputDir = resolve(outputDir?.trim() || '.', pluginName)

    rl.close()

    // 检查目录是否存在
    if (existsSync(outputDir)) {
      console.error(`\n❌ 目录已存在: ${outputDir}`)
      process.exit(1)
    }

    // 创建目录结构
    await mkdir(join(outputDir, 'src'), { recursive: true })

    // 生成 package.json
    const packageJson = {
      name: pluginName,
      version: '0.1.0',
      description,
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      files: ['dist'],
      scripts: {
        build: 'tsc',
        watch: 'tsc --watch',
      },
      keywords: ['panda-plugin', canonicalPluginType],
      author,
      license: 'MIT',
      devDependencies: {
        '@types/node': '^22.0.0',
        typescript: '^5.8.3',
      },
      peerDependencies: {
        '@cline/core': '*',
      },
    }

    await writeFile(
      join(outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )

    // 生成 tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        declaration: true,
        outDir: './dist',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    }

    await writeFile(
      join(outputDir, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    )

    // 生成插件代码
    const pluginCode = generatePluginCode(pluginName, canonicalPluginType, description)
    await writeFile(join(outputDir, 'src', 'index.ts'), pluginCode)

    // 生成 README.md
    const readme = generateReadme(pluginName, canonicalPluginType, description)
    await writeFile(join(outputDir, 'README.md'), readme)

    // 完成
    console.log(`\n✅ 已创建:`)
    console.log(`  ${outputDir}/package.json`)
    console.log(`  ${outputDir}/tsconfig.json`)
    console.log(`  ${outputDir}/src/index.ts`)
    console.log(`  ${outputDir}/README.md`)
    console.log(`\n📖 下一步:`)
    console.log(`  cd ${pluginName}`)
    console.log(`  npm install`)
    console.log(`  npm run build`)
    console.log(`  panda plugin install ${outputDir}`)
    console.log()

    return 0
  } catch (error) {
    console.error(`\n❌ 插件初始化失败: ${error instanceof Error ? error.message : String(error)}`)
    return 1
  }
}

function generatePluginCode(
  name: string,
  type: 'tool' | 'hook' | 'agent' | 'mcp',
  description: string
): string {
  const baseImports = `/**
 * ${name}
 * ${description}
 *
 * 参考: https://github.com/cline/cline/tree/main/sdk/examples/plugins
 */

import { type AgentPlugin, createTool } from '@cline/core'
`

  if (type === 'tool') {
    return `${baseImports}
const plugin: AgentPlugin = {
  name: '${name}',
  version: '0.1.0',
  description: '${description}',

  setup(api, ctx) {
    // 注册自定义工具
    api.registerTool(
      createTool({
        name: '${name.replace(/-/g, '_')}',
        description: '${description}',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: '工具输入参数',
            },
          },
          required: ['input'],
        },
        async execute({ input }) {
          // 实现工具逻辑
          return {
            success: true,
            result: \`处理了输入: \${input}\`,
          }
        },
      })
    )
  },
}

export { plugin }
export default plugin
`
  }

  if (type === 'hook') {
    return `${baseImports}
const plugin: AgentPlugin = {
  name: '${name}',
  version: '0.1.0',
  description: '${description}',

  setup(api, ctx) {
    console.log(\`[\${plugin.name}] 插件已加载\`)
  },

  hooks: {
    beforeRun(ctx) {
      console.log(\`[\${plugin.name}] beforeRun - 任务开始\`)
    },

    beforeTool(ctx, tool) {
      console.log(\`[\${plugin.name}] beforeTool - 即将执行工具: \${tool.name}\`)
    },

    afterTool(ctx, tool, result) {
      console.log(\`[\${plugin.name}] afterTool - 工具执行完成: \${tool.name}\`)
    },

    afterRun(ctx, result) {
      console.log(\`[\${plugin.name}] afterRun - 任务结束, 状态: \${result.status}\`)
    },
  },
}

export { plugin }
export default plugin
`
  }

  if (type === 'agent') {
    return `${baseImports}
const plugin: AgentPlugin = {
  name: '${name}',
  version: '0.1.0',
  description: '${description}',

  setup(api, ctx) {
    // 注册 sub-agent
    api.registerAgent({
      id: '${name}-agent',
      name: '${name} Agent',
      description: '${description}',
      async run(input, context) {
        // 实现 agent 逻辑
        return {
          success: true,
          output: \`Agent 处理了输入: \${input}\`,
        }
      },
    })
  },
}

export { plugin }
export default plugin
`
  }

  // MCP plugin
  return `${baseImports}
const plugin: AgentPlugin = {
  name: '${name}',
  version: '0.1.0',
  description: '${description}',

  setup(api, ctx) {
    // 注册 MCP 服务器
    // 参考: https://github.com/cline/cline/blob/main/sdk/examples/plugins/README.md
    console.log(\`[\${plugin.name}] MCP 服务器配置待实现\`)
  },
}

export { plugin }
export default plugin
`
}

function generateReadme(
  name: string,
  type: string,
  description: string
): string {
  return `# ${name}

${description}

## 安装

\`\`\`bash
# 本地安装
panda plugin install /path/to/${name}

# 从 npm 安装（发布后）
panda plugin install ${name}
\`\`\`

## 开发

\`\`\`bash
# 安装依赖
npm install

# 构建
npm run build

# 监听模式
npm run watch
\`\`\`

## 使用

插件类型: **${type}**

${
  type === 'tool'
    ? `安装后，可在 Panda 对话中使用工具 \`${name.replace(/-/g, '_')}\`。`
    : type === 'hook'
      ? '插件会在 Panda 运行期间自动监听生命周期事件。'
      : type === 'agent'
        ? `安装后，可使用 \`/${name}-agent\` 调用此 agent。`
        : 'MCP 服务器配置详见插件代码。'
}

## 参考

- [Cline Plugin SDK](https://github.com/cline/cline/tree/main/sdk/examples/plugins)
- [Panda 插件文档](https://github.com/PandaAI/panda-code)
`
}
