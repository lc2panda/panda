// Input: 无（读 PANDA_CONFIG_DIR / CLAUDE_CONFIG_DIR / 回退 os.homedir()/.pandacc）
// Output: merge 16 项 PANDA_* 默认值到 settings.json 的 env block + N 项顶层 settings 默认（不覆盖已有）；
//         返回 { newlyAddedKeys, newlyAddedTopLevelKeys, skipped }
// Pos: 启动早期（init.ts 最开头）或 npm postinstall，保证新用户一键获得 Panda 专属能力
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

/**
 * 16 项 Panda 默认 env。任何新增项走此处集中。
 *
 * v2.21.5 移除 PANDA_CONFIG_DIR: '~/.pandacc' 默认项 — 该字面值在
 * src/utils/envUtils.ts / env.ts / cli/handlers/auth.ts 多处被当作绝对路径直接
 * join filename 使用（未展开 ~），会产生 `$CWD/~/.pandacc/...` 错误目录。
 * 未设 env 时 panda 自动走 os.homedir() + '/.pandacc'，无需手工配置。
 *
 * 三个曾被怀疑为"死字段"的项已确认有真实消费方（A3 报告误判，F3 验证修正）：
 *   PANDA_NO_AUTO_COLLAPSE → src/utils/collapseReadSearch.ts:240,248
 *   PANDA_SHOW_DEVBAR      → src/screens/REPL.tsx:5037
 *   outputCompression 顶层字段 → src/tools/BashTool/compressionConfig.ts:39
 */
export const PANDA_DEFAULTS: Readonly<Record<string, string>> = Object.freeze({
  PANDA_SECURITY_RESEARCH: '1',
  PANDA_HIDE_CONTEXT_WARNING: '1',
  PANDA_NO_AUTO_COLLAPSE: '1',
  PANDA_SHOW_DEVBAR: '1',
  PANDA_DEBUG: '1',
  PANDA_THEME: 'matrix',
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

/**
 * 顶层 settings.json 默认值（panda 自有字段，A3 报告 §G.2 11 项中真正应该首启写入的子集）。
 *
 * 选取原则（保守优先 — 首启不强行启用任何高级/付费功能）：
 *   - enableModelRouting: false        — Multi-Model Routing 默认关闭，需要用户显式开启
 *                                         （PANDA_MODEL_ROUTING env 已在 PANDA_DEFAULTS 设为 '1' 走 env-only 路径，
 *                                          不依赖此顶层字段；这里写 false 仅为让 zod 校验有显式默认）
 *   - autoMemoryEnabled: true          — 自动记忆是 Panda 核心特性，README §1.4 默认承诺开启
 *   - outputCompression.enabled: true  — B13 已实装并默认 enabled，与 compressionConfig.ts DEFAULT_CONFIG 对齐
 *
 * 不写入的字段（保留 undefined 走代码内 fallback）：
 *   activeRoutingPreset / routingPresets / modelRegistry / customModelAliases
 *     —— 用户必须按 README §1867 手写 modelRegistry 才有意义，空对象会污染 zod 验证。
 *   autoMemoryDirectory  —— 走 paths.ts 懒解析逻辑，无默认路径。
 *   autoDreamEnabled     —— 后台整理 22:00 触发，新用户首启不强制开启（避免意外行为）。
 *   assistant / assistantName —— KAIROS feature gated，未启用时 schema 不存在，写入会被 zod 拒。
 */
export const SETTINGS_DEFAULTS: Readonly<Record<string, unknown>> = Object.freeze({
  enableModelRouting: false,
  autoMemoryEnabled: true,
  outputCompression: Object.freeze({ enabled: true }),
})

export interface InitResult {
  /** 新加入 env 块的 PANDA_* key 列表 */
  newlyAddedKeys: string[]
  /** 新加入顶层的 settings key 列表 */
  newlyAddedTopLevelKeys: string[]
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
    return { newlyAddedKeys: [], newlyAddedTopLevelKeys: [], skipped: true }
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
          return { newlyAddedKeys: [], newlyAddedTopLevelKeys: [], skipped: true }
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
      return { newlyAddedKeys: [], newlyAddedTopLevelKeys: [], skipped: true }
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

  // 计算缺失 env key —— 只补不改
  const newlyAddedKeys: string[] = []
  const mergedEnv: Record<string, unknown> = { ...existingEnv }
  for (const [key, defaultValue] of Object.entries(PANDA_DEFAULTS)) {
    if (!(key in mergedEnv)) {
      mergedEnv[key] = defaultValue
      newlyAddedKeys.push(key)
    }
  }

  // 计算缺失顶层 key —— 只补不改（保守默认，不覆盖任何已有用户配置）
  const newlyAddedTopLevelKeys: string[] = []
  const topLevelPatch: Record<string, unknown> = {}
  for (const [key, defaultValue] of Object.entries(SETTINGS_DEFAULTS)) {
    if (!(key in settings)) {
      topLevelPatch[key] = defaultValue
      newlyAddedTopLevelKeys.push(key)
    }
  }

  // 幂等：env / 顶层都无变化直接 return
  if (newlyAddedKeys.length === 0 && newlyAddedTopLevelKeys.length === 0) {
    return { newlyAddedKeys: [], newlyAddedTopLevelKeys: [], skipped: false }
  }

  // 只替换 env + 补顶层；其他字段（permissions / enabledPlugins / ANTHROPIC_* 等）全保留
  const nextSettings: Record<string, unknown> = {
    ...settings,
    ...topLevelPatch, // 顶层 patch 在 settings 之后展开 — 只补缺失（已确保 key 不存在）
    env: mergedEnv, // env 始终最后展开，保证 mergedEnv 优先
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
    return { newlyAddedKeys: [], newlyAddedTopLevelKeys: [], skipped: true }
  }

  return { newlyAddedKeys, newlyAddedTopLevelKeys, skipped: false }
}
