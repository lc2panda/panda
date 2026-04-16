// Input: 无（读 PANDA_CONFIG_DIR / CLAUDE_CONFIG_DIR / 回退 os.homedir()/.pandacc）
// Output: merge 17 项 PANDA_* 默认值到 settings.json 的 env block（不覆盖已有）；
//         返回 { newlyAddedKeys, skipped }
// Pos: 启动早期（init.ts 最开头）或 npm postinstall，保证新用户一键获得 Panda 专属能力
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

/**
 * 17 项 Panda 默认 env。任何新增项走此处集中。
 * PANDA_CONFIG_DIR 的值保留字面 "~/.pandacc"：它是给用户阅读 settings.json 的提示，
 * 实际读取时 envUtils.getClaudeConfigHomeDir() 会优先取 env 变量，且本文件中的路径
 * 解析永远使用 os.homedir() —— 跨平台安全。
 */
export const PANDA_DEFAULTS: Readonly<Record<string, string>> = Object.freeze({
  PANDA_SECURITY_RESEARCH: '1',
  PANDA_HIDE_CONTEXT_WARNING: '1',
  PANDA_NO_AUTO_COLLAPSE: '1',
  PANDA_SHOW_DEVBAR: '1',
  PANDA_DEBUG: '1',
  PANDA_THEME: 'matrix',
  PANDA_CONFIG_DIR: '~/.pandacc',
  PANDA_MODEL_ROUTING: '1',
  PANDA_CONTEXT_COLLAPSE: '1',
  PANDA_AGENT_MAX_TURNS: '10',
  PANDA_AGENT_PER_TURN_LIMIT: '2',
  PANDA_AGENT_TIMEOUT_MS: '0',
  PANDA_FORK_TIMEOUT_MS: '0',
  PANDA_CACHE_TEXT_KEEP_LAST: '5',
  PANDA_CACHE_TEXT_MIN_SIZE: '1500',
  PANDA_FORCE_CACHE_STRATEGY: 'explicit',
  PANDA_SKILL_LEARNING_TEST: '1',
})

export interface InitResult {
  newlyAddedKeys: string[]
  skipped: boolean
}

/**
 * 解析配置目录：
 *   PANDA_CONFIG_DIR > CLAUDE_CONFIG_DIR > path.join(os.homedir(), '.pandacc')
 *
 * 若 env 里的值是字面 "~/.pandacc" 之类波浪号开头，展开为 homedir()。
 * Windows 下 os.homedir() 等价 %USERPROFILE%，`path.join` 自动用平台分隔符。
 */
function resolveConfigDir(): string {
  const raw =
    process.env.PANDA_CONFIG_DIR ??
    process.env.CLAUDE_CONFIG_DIR ??
    join(homedir(), '.pandacc')
  if (raw.startsWith('~')) {
    // '~' 或 '~/xxx' → 替换首字符
    return join(homedir(), raw.slice(1).replace(/^[\\/]/, ''))
  }
  return raw
}

/**
 * options.silent: 不打印 console 提示（postinstall 场景默认 false，init.ts 场景建议 true，
 *                 由调用方决定是否打印）。
 */
export function initDefaultPandaccSettings(options?: {
  silent?: boolean
}): InitResult {
  // 显式 skip 开关（CI / 企业只读环境）
  if (process.env.PANDA_SKIP_AUTO_INIT === '1') {
    return { newlyAddedKeys: [], skipped: true }
  }

  const silent = options?.silent ?? false
  const configDir = resolveConfigDir()
  const settingsPath = join(configDir, 'settings.json')

  // 读取或初始化 settings
  let settings: Record<string, unknown> = {}
  if (existsSync(settingsPath)) {
    try {
      const raw = readFileSync(settingsPath, { encoding: 'utf-8' })
      // 空文件按 {} 处理
      const trimmed = raw.trim()
      if (trimmed.length === 0) {
        settings = {}
      } else {
        const parsed: unknown = JSON.parse(trimmed)
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          // JSON 合法但不是对象 → skip，不破坏用户文件
          if (!silent) {
            console.warn(
              `[panda] settings.json 根不是对象，跳过自动初始化（path: ${settingsPath}）`,
            )
          }
          return { newlyAddedKeys: [], skipped: true }
        }
        settings = parsed as Record<string, unknown>
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!silent) {
        console.warn(
          `[panda] settings.json 解析失败，跳过自动初始化（path: ${settingsPath}, error: ${msg}）`,
        )
      }
      return { newlyAddedKeys: [], skipped: true }
    }
  }

  // env block 必须是对象
  const existingEnvRaw = settings.env
  const existingEnv: Record<string, unknown> =
    existingEnvRaw !== null &&
    typeof existingEnvRaw === 'object' &&
    !Array.isArray(existingEnvRaw)
      ? (existingEnvRaw as Record<string, unknown>)
      : {}

  // 计算缺失 key —— 只补不改
  const newlyAddedKeys: string[] = []
  const mergedEnv: Record<string, unknown> = { ...existingEnv }
  for (const [key, defaultValue] of Object.entries(PANDA_DEFAULTS)) {
    if (!(key in mergedEnv)) {
      mergedEnv[key] = defaultValue
      newlyAddedKeys.push(key)
    }
  }

  // 幂等：无变化直接 return
  if (newlyAddedKeys.length === 0) {
    return { newlyAddedKeys: [], skipped: false }
  }

  // 只替换 env；其他字段（permissions / enabledPlugins / ANTHROPIC_* 等）全保留
  const nextSettings: Record<string, unknown> = {
    ...settings,
    env: mergedEnv,
  }

  // 写入（含容错）
  try {
    // recursive:true 在 Mac/Linux/Windows 均幂等
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }
    const serialized = JSON.stringify(nextSettings, null, 2) + '\n'
    writeFileSync(settingsPath, serialized, { encoding: 'utf-8' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (!silent) {
      console.warn(
        `[panda] settings.json 写入失败，跳过自动初始化（path: ${settingsPath}, error: ${msg}）`,
      )
    }
    return { newlyAddedKeys: [], skipped: true }
  }

  return { newlyAddedKeys, skipped: false }
}
