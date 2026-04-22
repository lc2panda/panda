/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handler intentionally exits */

import { createInterface } from 'readline'
import {
  clearAuthRelatedCaches,
  performLogout,
} from '../../commands/logout/logout.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
import { getSSLErrorHint } from '../../services/api/errorUtils.js'
import { fetchAndStoreClaudeCodeFirstTokenDate } from '../../services/api/firstTokenDate.js'
import {
  createAndStoreApiKey,
  fetchAndStoreUserRoles,
  refreshOAuthToken,
  shouldUseClaudeAIAuth,
  storeOAuthAccountInfo,
} from '../../services/oauth/client.js'
import { getOauthProfileFromOauthToken } from '../../services/oauth/getOauthProfile.js'
import { OAuthService } from '../../services/oauth/index.js'
import type { OAuthTokens } from '../../services/oauth/types.js'
import {
  clearOAuthTokenCache,
  getAnthropicApiKeyWithSource,
  getAuthTokenSource,
  getOauthAccountInfo,
  getSubscriptionType,
  isUsing3PServices,
  saveOAuthTokensIfNeeded,
  validateForceLoginOrg,
} from '../../utils/auth.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import { logForDebugging } from '../../utils/debug.js'
import { isRunningOnHomespace } from '../../utils/envUtils.js'
import { errorMessage } from '../../utils/errors.js'
import { logError } from '../../utils/log.js'
import { getAPIProvider } from '../../utils/model/providers.js'
import {
  getInitialSettings,
  removeSettingsEnvKeys,
} from '../../utils/settings/settings.js'
import { jsonStringify } from '../../utils/slowOperations.js'
import {
  buildAccountProperties,
  buildAPIProviderProperties,
} from '../../utils/status.js'

// ---------------------------------------------------------------------------
// Third-party provider definitions
// ---------------------------------------------------------------------------
const THIRD_PARTY_PROVIDERS: Record<
  string,
  { name: string; baseURL: string; defaultModel: string; consoleURL: string }
> = {
  deepseek: { name: 'DeepSeek', baseURL: 'https://api.deepseek.com/anthropic', defaultModel: 'deepseek-chat', consoleURL: 'https://platform.deepseek.com/api_keys' },
  kimi: { name: 'Kimi Code', baseURL: 'https://api.kimi.com/coding/', defaultModel: 'kimi-for-coding', consoleURL: 'https://www.kimi.com/code' },
  qwen: { name: 'Qwen (阿里百炼)', baseURL: 'https://dashscope-intl.aliyuncs.com/apps/anthropic', defaultModel: 'qwen3.5-plus', consoleURL: 'https://dashscope.console.aliyun.com/' },
  minimax: { name: 'MiniMax', baseURL: 'https://api.minimax.io/anthropic', defaultModel: 'minimax-m2.7', consoleURL: 'https://platform.minimax.io' },
  glm: { name: 'GLM (智谱)', baseURL: 'https://open.bigmodel.cn/api/anthropic/', defaultModel: 'glm-5.1', consoleURL: 'https://open.bigmodel.cn/' },
  volcano: { name: 'Volcano (火山引擎)', baseURL: 'https://ark.cn-beijing.volces.com/api/coding', defaultModel: 'doubao-seed-code', consoleURL: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey' },
  openai: { name: 'OpenAI', baseURL: 'https://api.openai.com/v1', defaultModel: 'gpt-4o', consoleURL: 'https://platform.openai.com/api-keys' },
}

const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'deepseek-chat': 128000,
  'deepseek-reasoner': 128000,
  'kimi-for-coding': 262144,
  'kimi-k2.5': 262144,
  'kimi-k2': 262144,
  'kimi-k2-thinking': 262144,
  'kimi-k2-thinking-turbo': 262144,
  'qwen3.5-plus': 1000000,
  'qwen3.5-flash': 1000000,
  'qwen3-max': 262144,
  'qwen-plus': 1000000,
  'qwen-max': 32000,
  'qwen-turbo': 1000000,
  'minimax-m2.7': 204800,
  'minimax-m2.7-highspeed': 204800,
  'minimax-m2.5': 196608,
  'minimax-m2.1': 200000,
  'minimax-m2': 200000,
  'glm-5.1': 204800,
  'glm-5': 200000,
  'glm-4.7': 200000,
  'glm-4.5': 131000,
  'glm-4-plus': 128000,
  'doubao-seed-code': 256000,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4.1': 1047576,
  'gpt-4.1-mini': 1047576,
  'gpt-4.1-nano': 1047576,
  'o3': 200000,
  'o3-mini': 200000,
  'o4-mini': 200000,
  'codex-mini': 192000,
}

function getContextWindowForThirdPartyModel(model: string): number | undefined {
  return MODEL_CONTEXT_WINDOWS[model]
}

// Full provider list including Anthropic (for interactive selection)
const ALL_PROVIDERS: Record<string, { name: string; baseURL: string | null; defaultModel: string | null; consoleURL: string | null }> = {
  anthropic: { name: 'Anthropic (Claude)', baseURL: null, defaultModel: null, consoleURL: null },
  ...THIRD_PARTY_PROVIDERS,
}

// ---------------------------------------------------------------------------
// readline helper (no new dependencies)
// ---------------------------------------------------------------------------
function readlineQuestion(prompt: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close()
      resolve(answer)
    })
  })
}

// ---------------------------------------------------------------------------
// Helper: ↑↓ select Codex model from fetched list
// ---------------------------------------------------------------------------
/**
 * 作战线 Q：登录后让用户 ↑↓ 选默认 Codex 模型。
 *
 * 风格沿用本文件 thirdPartyLogin api_key 分支的 raw-mode 选择器（同款体验，
 * 无新增 inquirer/prompts 依赖 —— 项目当前根本不依赖 inquirer）。
 *
 * 退出语义：
 *   ↑/k     上移
 *   ↓/j     下移
 *   Enter   确认当前项
 *   Ctrl+C  退出整个 login 流程（process.exit）
 *
 * @param models    fetched 可用模型列表（含 id + 可选 label）
 * @param defaultIdx 默认高亮位置（pickDefaultCodexModel 推荐项的索引；找不到→0）
 * @param planType  用于在推荐项后显示 "(推荐 - <plan>)" 标签
 */
async function promptSelectCodexModel(
  models: { id: string; label?: string }[],
  defaultIdx: number,
  planType: string | null,
): Promise<string> {
  let sel = Math.max(0, Math.min(defaultIdx, models.length - 1))

  const formatLine = (m: { id: string; label?: string }, i: number): string => {
    const mark = i === sel ? '\x1b[36m❯\x1b[0m' : ' '
    const text = i === sel ? `\x1b[1m${m.id}\x1b[0m` : `\x1b[2m${m.id}\x1b[0m`
    const label = m.label && m.label !== m.id ? ` \x1b[2m(${m.label})\x1b[0m` : ''
    const recommend =
      i === defaultIdx
        ? ` \x1b[33m← 推荐${planType ? ` - ${planType}` : ''}\x1b[0m`
        : ''
    return `  ${mark} ${text}${label}${recommend}\n`
  }

  process.stdout.write('\n选择默认模型 (↑↓ 移动, Enter 确认, Ctrl+C 退出):\n')
  for (let i = 0; i < models.length; i++) {
    process.stdout.write(formatLine(models[i]!, i))
  }

  const render = () => {
    // 回到列表起点，清屏到末尾，重绘
    process.stdout.write(`\x1b[${models.length}A\x1b[J`)
    for (let i = 0; i < models.length; i++) {
      process.stdout.write(formatLine(models[i]!, i))
    }
  }

  return new Promise<string>(resolve => {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf-8')

    const onKey = (d: string) => {
      // 上键 / k
      if (d === '\x1b[A' || d === 'k') {
        sel = (sel - 1 + models.length) % models.length
        render()
        return
      }
      // 下键 / j
      if (d === '\x1b[B' || d === 'j') {
        sel = (sel + 1) % models.length
        render()
        return
      }
      // Enter
      if (d === '\r' || d === '\n') {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onKey)
        resolve(models[sel]!.id)
        return
      }
      // Ctrl+C
      if (d === '\x03') {
        process.stdin.setRawMode(false)
        process.stderr.write('\n登录已取消\n')
        process.exit(130)
      }
    }
    process.stdin.on('data', onKey)
  })
}

// ---------------------------------------------------------------------------
// Helper: save OpenAI config after successful OAuth login
// ---------------------------------------------------------------------------
/**
 * OpenAI config 保存 —— 双轨：
 *   'api_key'          传统手动 API key 模式（保留向后兼容）
 *   'chatgpt_backend'  新增 ChatGPT backend + OAuth token bundle 模式
 */
interface OpenAIApiKeyConfig {
  mode: 'api_key'
  apiKey: string
}
interface OpenAIChatGPTConfig {
  mode: 'chatgpt_backend'
  accessToken: string
  refreshToken: string
  idToken: string
  accountId: string
  email: string | null
  expiresAt: number
  /** 作战线 N：从 id_token 解出的 chatgpt_plan_type，用于选默认模型 */
  planType: string | null
  /**
   * 作战线 Q：登录后从 /backend-api/codex/models 拉到的可用模型 id 列表。
   * 拉取失败时 undefined（saveOpenAIConfig 会走 pickDefaultCodexModel 兜底）。
   */
  availableModels?: string[]
  /**
   * 作战线 Q：用户在 inquirer prompt 选定的模型（如有）。
   * 缺失则 saveOpenAIConfig 用 pickDefaultCodexModel(planType) 兜底。
   */
  selectedModel?: string
}
type OpenAIAuthConfig = OpenAIApiKeyConfig | OpenAIChatGPTConfig

function saveOpenAIConfig(
  providerKey: string,
  provider: { name: string; baseURL: string; defaultModel: string; consoleURL: string },
  auth: OpenAIAuthConfig,
): void {
  // 作战线 N：chatgpt_backend 模式按 plan-type 动态选默认模型
  // 作战线 Q：若 thirdPartyLogin 已 prompt 用户选定（auth.selectedModel），优先使用
  //          否则回退 pickDefaultCodexModel(planType)；api_key 模式仍用 provider.defaultModel
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { pickDefaultCodexModel } = require('../../services/api/openaiAdapter.js') as {
    pickDefaultCodexModel: (planType: string | null | undefined) => string
  }
  const selectedModel =
    auth.mode === 'chatgpt_backend'
      ? auth.selectedModel || pickDefaultCodexModel(auth.planType)
      : provider.defaultModel
  // ChatGPT backend 走 chatgpt.com/backend-api/codex/responses（与 api.openai.com/v1 完全不同）
  const baseURL =
    auth.mode === 'chatgpt_backend'
      ? 'https://chatgpt.com/backend-api/codex'
      : provider.baseURL

  saveGlobalConfig(current => {
    const base = {
      name: providerKey,
      baseURL,
      model: selectedModel,
      contextWindow: getContextWindowForThirdPartyModel(selectedModel),
    }
    return {
      ...current,
      thirdPartyProvider:
        auth.mode === 'api_key'
          ? { ...base, apiKey: auth.apiKey, mode: 'api_key' as const }
          : {
              ...base,
              mode: 'chatgpt_backend' as const,
              accessToken: auth.accessToken,
              refreshToken: auth.refreshToken,
              idToken: auth.idToken,
              accountId: auth.accountId,
              email: auth.email ?? undefined,
              expiresAt: auth.expiresAt,
              // 作战线 N：持久化 planType，后续 fallback 逻辑可读
              ...(auth.planType ? { planType: auth.planType } : {}),
              // 作战线 Q：持久化 fetched 可用模型列表，供 /model autocomplete + 后续 fallback
              ...(auth.availableModels && auth.availableModels.length > 0
                ? { availableModels: auth.availableModels }
                : {}),
              // 保留 apiKey 字段为空字符串以兼容旧代码路径（某些地方直接读 tp.apiKey）
              apiKey: '',
            },
    }
  })

  // Clean settings.json env vars that might conflict (race-safe via updateSettingsForSource)
  removeSettingsEnvKeys('userSettings', [
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_MODEL',
  ])

  // Set env vars for the current process
  process.env.PANDA_PROVIDER = 'openai'
  if (auth.mode === 'chatgpt_backend') {
    process.env.OPENAI_ACCESS_TOKEN = auth.accessToken
    process.env.OPENAI_ACCOUNT_ID = auth.accountId
    process.env.PANDA_OPENAI_MODE = 'chatgpt'
    // 清 api_key 模式遗留
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = auth.apiKey
    process.env.PANDA_OPENAI_MODE = 'api_key'
    delete process.env.OPENAI_ACCESS_TOKEN
    delete process.env.OPENAI_ACCOUNT_ID
  }
  process.env.OPENAI_BASE_URL = baseURL

  // 不向 ANTHROPIC_* 写入任何 token —— 严格守 Anthropic 原生通道 byte-equal
  // 旧代码写 ANTHROPIC_BASE_URL/ANTHROPIC_AUTH_TOKEN 是错的，会污染 provider 判定
  delete process.env.ANTHROPIC_BASE_URL
  delete process.env.ANTHROPIC_AUTH_TOKEN
  process.env.ANTHROPIC_MODEL = selectedModel

  process.stdout.write(`\n✓ Login successful! Provider: ${provider.name}\n`)
  if (auth.mode === 'chatgpt_backend') {
    process.stdout.write(`  Mode: ChatGPT backend (OAuth)\n`)
    if (auth.email) {
      process.stdout.write(`  Account: ${auth.email}\n`)
    }
    if (auth.planType) {
      process.stdout.write(`  Plan: ${auth.planType}\n`)
    }
  } else {
    process.stdout.write(`  Mode: API key\n`)
  }
  // 作战线 Q：标注模型来源（fetched / fallback）
  if (
    auth.mode === 'chatgpt_backend' &&
    auth.availableModels &&
    auth.availableModels.length > 0
  ) {
    process.stdout.write(
      `  Model: ${selectedModel}  (从 ${auth.availableModels.length} 个可用模型中选择)\n`,
    )
  } else {
    process.stdout.write(`  Model: ${selectedModel}\n`)
  }
  process.stdout.write(`  Base URL: ${baseURL}\n`)
  process.stdout.write(`\nRun 'panda' to start.\n`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Third-party login flow
// ---------------------------------------------------------------------------
async function thirdPartyLogin(providerKey: string): Promise<void> {
  // Clear previous auth state to prevent conflicts between providers
  await performLogout({ clearOnboarding: false })
  clearOAuthTokenCache()

  const provider = THIRD_PARTY_PROVIDERS[providerKey]
  if (!provider) {
    process.stderr.write(`Error: unknown provider "${providerKey}".\n`)
    process.exit(1)
  }

  // OpenAI: 浏览器 OAuth 流 → ChatGPT backend token bundle
  if (providerKey === 'openai') {
    const { openaiOAuthLogin, extractPlanType } = await import('../../services/openai-oauth.js')
    const { fetchAvailableCodexModels, pickDefaultCodexModel } = await import(
      '../../services/api/openaiAdapter.js'
    )
    try {
      const bundle = await openaiOAuthLogin()
      // 作战线 N：从 id_token 解 plan_type 用于选默认模型
      const planType = bundle.idToken ? extractPlanType(bundle.idToken) : null

      // 作战线 Q：登录成功立即拉真实可用模型列表
      process.stdout.write('\nFetching available models...\n')
      const models = await fetchAvailableCodexModels(bundle.accessToken, bundle.accountId!)

      // 默认选中：planType 推荐项 → 否则列表首项
      const recommended = pickDefaultCodexModel(planType)
      const defaultIdx = Math.max(
        0,
        models.findIndex(m => m.id === recommended),
      )

      // 让用户 ↑↓ 选择（TTY 才弹，CI/pipe 直接走推荐项 / 列表首项）
      let selectedModel: string | undefined
      if (models.length > 0 && process.stdin.isTTY) {
        selectedModel = await promptSelectCodexModel(models, defaultIdx, planType)
      } else if (models.length > 0) {
        // 非交互终端：用推荐项（若在列表中）或列表首项
        selectedModel = models[defaultIdx]?.id ?? models[0]?.id
      }
      // models 为空（fetch 失败）→ selectedModel 留 undefined，saveOpenAIConfig 走 pickDefaultCodexModel 兜底

      saveOpenAIConfig(providerKey, provider, {
        mode: 'chatgpt_backend',
        accessToken: bundle.accessToken,
        refreshToken: bundle.refreshToken,
        idToken: bundle.idToken,
        accountId: bundle.accountId!, // openaiOAuthLogin 已校验非空
        email: bundle.email,
        planType,
        expiresAt: bundle.expiresAt,
        availableModels: models.length > 0 ? models.map(m => m.id) : undefined,
        selectedModel,
      })
      return
    } catch (err) {
      process.stderr.write(`\nOpenAI login failed: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  }

  process.stdout.write(`\nLogging in to ${provider.name}...\n`)

  const { exec } = await import('child_process')
  const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${openCmd} ${provider.consoleURL}`)
  process.stdout.write(`Opening ${provider.consoleURL} ...\n`)

  process.stdout.write(`Get your API key from the provider's console.\n\n`)
  const apiKey = await readlineQuestion('API Key: ')

  if (!apiKey.trim()) {
    process.stderr.write('Error: API key is required.\n')
    process.exit(1)
  }

  let selectedModel = provider.defaultModel
  try {
    process.stdout.write('\nFetching available models...\n')
    const modelsURL = provider.baseURL.replace(/\/?$/, '/v1/models')
    const res = await fetch(modelsURL, {
      headers: { 'x-api-key': apiKey.trim(), 'Authorization': `Bearer ${apiKey.trim()}` },
    })
    if (res.ok) {
      const data = await res.json() as { data?: Array<{ id: string }> }
      const models = data.data?.map(m => m.id).filter(Boolean) ?? []
      if (models.length > 0) {
        process.stdout.write(`\nAvailable models (${models.length}):\n`)
        let sel = 0
        const renderModels = () => {
          process.stdout.write(`\x1b[${models.length}A\x1b[J`)
          models.forEach((m, i) => {
            process.stdout.write(`  ${i === sel ? '\x1b[36m❯\x1b[0m \x1b[1m' + m + '\x1b[0m' : '  \x1b[2m' + m + '\x1b[0m'}\n`)
          })
        }
        models.forEach((m, i) => {
          process.stdout.write(`  ${i === sel ? '\x1b[36m❯\x1b[0m \x1b[1m' + m + '\x1b[0m' : '  \x1b[2m' + m + '\x1b[0m'}\n`)
        })
        selectedModel = await new Promise<string>(resolve => {
          if (!process.stdin.isTTY) { resolve(models[0]!); return }
          process.stdin.setRawMode(true)
          process.stdin.resume()
          process.stdin.setEncoding('utf-8')
          const onKey = (d: string) => {
            if (d === '\x1b[A' || d === 'k') { sel = (sel - 1 + models.length) % models.length; renderModels() }
            else if (d === '\x1b[B' || d === 'j') { sel = (sel + 1) % models.length; renderModels() }
            else if (d === '\r' || d === '\n') { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.removeListener('data', onKey); resolve(models[sel]!) }
            else if (d === '\x03') { process.stdin.setRawMode(false); process.exit(0) }
          }
          process.stdin.on('data', onKey)
        })
      }
    }
  } catch {}

  saveGlobalConfig(current => ({
    ...current,
    thirdPartyProvider: {
      name: providerKey,
      baseURL: provider.baseURL,
      apiKey: apiKey.trim(),
      model: selectedModel,
      contextWindow: getContextWindowForThirdPartyModel(selectedModel),
    },
  }))

  // Clean stale Anthropic env vars from settings.json (race-safe)
  removeSettingsEnvKeys('userSettings', [
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_MODEL',
  ])

  // Set env vars so the current process can use them immediately
  process.env.ANTHROPIC_BASE_URL = provider.baseURL
  process.env.ANTHROPIC_AUTH_TOKEN = apiKey.trim()
  process.env.ANTHROPIC_MODEL = selectedModel

  // OpenAI provider: also set env vars for OpenAI adapter
  if (providerKey === 'openai') {
    process.env.PANDA_PROVIDER = 'openai'
    process.env.OPENAI_API_KEY = apiKey.trim()
    process.env.OPENAI_BASE_URL = provider.baseURL
  }

  process.stdout.write(`\n✓ Login successful! Provider: ${provider.name}\n`)
  process.stdout.write(`  Model: ${selectedModel}\n`)
  process.stdout.write(`  Base URL: ${provider.baseURL}\n`)
  process.stdout.write(`\nRun 'panda' to start.\n`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Interactive provider selection (when no --provider flag)
// ---------------------------------------------------------------------------
async function selectProviderInteractively(): Promise<string> {
  const keys = Object.keys(ALL_PROVIDERS)
  const names = keys.map(k => ALL_PROVIDERS[k]!.name)
  let selected = 0

  function render() {
    process.stdout.write(`\x1b[${names.length + 1}A\x1b[J`)
    process.stdout.write('Select provider:\n')
    names.forEach((name, i) => {
      const prefix = i === selected ? '\x1b[36m❯\x1b[0m' : ' '
      const text = i === selected ? `\x1b[1m${name}\x1b[0m` : `\x1b[2m${name}\x1b[0m`
      process.stdout.write(`  ${prefix} ${text}\n`)
    })
  }

  process.stdout.write('Select provider:\n')
  names.forEach((name, i) => {
    const prefix = i === selected ? '\x1b[36m❯\x1b[0m' : ' '
    const text = i === selected ? `\x1b[1m${name}\x1b[0m` : `\x1b[2m${name}\x1b[0m`
    process.stdout.write(`  ${prefix} ${text}\n`)
  })

  return new Promise(resolve => {
    if (!process.stdin.isTTY) {
      resolve(keys[0]!)
      return
    }
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf-8')
    const onData = (data: string) => {
      if (data === '\x1b[A' || data === 'k') {
        selected = (selected - 1 + names.length) % names.length
        render()
      } else if (data === '\x1b[B' || data === 'j') {
        selected = (selected + 1) % names.length
        render()
      } else if (data === '\r' || data === '\n') {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onData)
        resolve(keys[selected]!)
      } else if (data === '\x03') {
        process.stdin.setRawMode(false)
        process.exit(0)
      }
    }
    process.stdin.on('data', onData)
  })
}

/**
 * Shared post-token-acquisition logic. Saves tokens, fetches profile/roles,
 * and sets up the local auth state.
 */
export async function installOAuthTokens(tokens: OAuthTokens): Promise<void> {
  await performLogout({ clearOnboarding: false })
  clearOAuthTokenCache()

  saveGlobalConfig(current => {
    const updated = { ...current }
    delete updated.thirdPartyProvider
    return updated
  })

  // 清掉 settings.json 里残留的 ANTHROPIC_* —— 第三方登录时曾写入
  // (thirdPartyLogin 已处理，但 Anthropic OAuth 这条路之前漏了)
  // 不清会被 applySafeConfigEnvironmentVariables 重新注入 process.env，
  // 导致 Bearer token 被送到错的 host，触发 403 no body。
  // Race-safe: delegate to updateSettingsForSource via removeSettingsEnvKeys
  removeSettingsEnvKeys('userSettings', [
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_MODEL',
  ])

  // 当前进程立即清掉同样的 env，避免本次会话继续用旧值
  delete process.env.ANTHROPIC_BASE_URL
  delete process.env.ANTHROPIC_AUTH_TOKEN
  delete process.env.ANTHROPIC_MODEL

  // Reuse pre-fetched profile if available, otherwise fetch fresh
  const profile =
    tokens.profile ?? (await getOauthProfileFromOauthToken(tokens.accessToken))
  if (profile) {
    storeOAuthAccountInfo({
      accountUuid: profile.account.uuid,
      emailAddress: profile.account.email,
      organizationUuid: profile.organization.uuid,
      displayName: profile.account.display_name || undefined,
      hasExtraUsageEnabled:
        profile.organization.has_extra_usage_enabled ?? undefined,
      billingType: profile.organization.billing_type ?? undefined,
      subscriptionCreatedAt:
        profile.organization.subscription_created_at ?? undefined,
      accountCreatedAt: profile.account.created_at,
    })
  } else if (tokens.tokenAccount) {
    // Fallback to token exchange account data when profile endpoint fails
    storeOAuthAccountInfo({
      accountUuid: tokens.tokenAccount.uuid,
      emailAddress: tokens.tokenAccount.emailAddress,
      organizationUuid: tokens.tokenAccount.organizationUuid,
    })
  }

  const storageResult = saveOAuthTokensIfNeeded(tokens)
  clearOAuthTokenCache()

  if (storageResult.warning) {
    logEvent('tengu_oauth_storage_warning', {
      warning:
        storageResult.warning as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }

  // Roles and first-token-date may fail for limited-scope tokens (e.g.
  // inference-only from setup-token). They're not required for core auth.
  await fetchAndStoreUserRoles(tokens.accessToken).catch(err =>
    logForDebugging(String(err), { level: 'error' }),
  )

  if (shouldUseClaudeAIAuth(tokens.scopes)) {
    await fetchAndStoreClaudeCodeFirstTokenDate().catch(err =>
      logForDebugging(String(err), { level: 'error' }),
    )
  } else {
    // API key creation is critical for Console users — let it throw.
    const apiKey = await createAndStoreApiKey(tokens.accessToken)
    if (!apiKey) {
      throw new Error(
        'Unable to create API key. The server accepted the request but did not return a key.',
      )
    }
  }

  await clearAuthRelatedCaches()
}

export async function authLogin({
  email,
  sso,
  console: useConsole,
  claudeai,
  provider,
}: {
  email?: string
  sso?: boolean
  console?: boolean
  claudeai?: boolean
  provider?: string
}): Promise<void> {
  // --provider flag: go directly to third-party login
  if (provider) {
    if (provider === 'anthropic') {
      // fall through to normal OAuth flow below
    } else {
      await thirdPartyLogin(provider)
      return // thirdPartyLogin calls process.exit, but for type-safety
    }
  }

  // Interactive provider selection when no flags are given
  if (!provider && !useConsole && !claudeai && !email && !sso) {
    const selected = await selectProviderInteractively()
    if (selected !== 'anthropic') {
      await thirdPartyLogin(selected)
      return
    }
    // selected === 'anthropic' → fall through to original OAuth flow
  }

  if (useConsole && claudeai) {
    process.stderr.write(
      'Error: --console and --claudeai cannot be used together.\n',
    )
    process.exit(1)
  }

  const settings = getInitialSettings()
  // forceLoginMethod is a hard constraint (enterprise setting) — matches ConsoleOAuthFlow behavior.
  // Without it, --console selects Console; --claudeai (or no flag) selects claude.ai.
  const loginWithClaudeAi = settings.forceLoginMethod
    ? settings.forceLoginMethod === 'claudeai'
    : !useConsole
  const orgUUID = settings.forceLoginOrgUUID

  // Fast path: if a refresh token is provided via env var, skip the browser
  // OAuth flow and exchange it directly for tokens.
  const envRefreshToken = process.env.CLAUDE_CODE_OAUTH_REFRESH_TOKEN
  if (envRefreshToken) {
    const envScopes = process.env.CLAUDE_CODE_OAUTH_SCOPES
    if (!envScopes) {
      process.stderr.write(
        'CLAUDE_CODE_OAUTH_SCOPES is required when using CLAUDE_CODE_OAUTH_REFRESH_TOKEN.\n' +
          'Set it to the space-separated scopes the refresh token was issued with\n' +
          '(e.g. "user:inference" or "user:profile user:inference user:sessions:claude_code user:mcp_servers").\n',
      )
      process.exit(1)
    }

    const scopes = envScopes.split(/\s+/).filter(Boolean)

    try {
      logEvent('tengu_login_from_refresh_token', {})

      const tokens = await refreshOAuthToken(envRefreshToken, { scopes })
      await installOAuthTokens(tokens)

      const orgResult = await validateForceLoginOrg()
      if (!orgResult.valid) {
        process.stderr.write((orgResult as { valid: false; message: string }).message + '\n')
        process.exit(1)
      }

      // Mark onboarding complete — interactive paths handle this via
      // the Onboarding component, but the env var path skips it.
      saveGlobalConfig(current => {
        if (current.hasCompletedOnboarding) return current
        return { ...current, hasCompletedOnboarding: true }
      })

      logEvent('tengu_oauth_success', {
        loginWithClaudeAi: shouldUseClaudeAIAuth(tokens.scopes),
      })
      process.stdout.write('Login successful.\n')
      process.exit(0)
    } catch (err) {
      logError(err)
      const sslHint = getSSLErrorHint(err)
      process.stderr.write(
        `Login failed: ${errorMessage(err)}\n${sslHint ? sslHint + '\n' : ''}`,
      )
      process.exit(1)
    }
  }

  const resolvedLoginMethod = sso ? 'sso' : undefined

  const oauthService = new OAuthService()

  try {
    logEvent('tengu_oauth_flow_start', { loginWithClaudeAi })

    const result = await oauthService.startOAuthFlow(
      async url => {
        process.stdout.write('Opening browser to sign in…\n')
        process.stdout.write(`If the browser didn't open, visit: ${url}\n`)
      },
      {
        loginWithClaudeAi,
        loginHint: email,
        loginMethod: resolvedLoginMethod,
        orgUUID,
      },
    )

    await installOAuthTokens(result)

    const orgResult = await validateForceLoginOrg()
    if (!orgResult.valid) {
      process.stderr.write((orgResult as { valid: false; message: string }).message + '\n')
      process.exit(1)
    }

    logEvent('tengu_oauth_success', { loginWithClaudeAi })

    process.stdout.write('Login successful.\n')
    process.exit(0)
  } catch (err) {
    logError(err)
    const sslHint = getSSLErrorHint(err)
    process.stderr.write(
      `Login failed: ${errorMessage(err)}\n${sslHint ? sslHint + '\n' : ''}`,
    )
    process.exit(1)
  } finally {
    oauthService.cleanup()
  }
}

export async function authStatus(opts: {
  json?: boolean
  text?: boolean
}): Promise<void> {
  const { source: authTokenSource, hasToken } = getAuthTokenSource()
  const { source: apiKeySource } = getAnthropicApiKeyWithSource()
  const hasApiKeyEnvVar =
    !!process.env.ANTHROPIC_API_KEY && !isRunningOnHomespace()
  const oauthAccount = getOauthAccountInfo()
  const subscriptionType = getSubscriptionType()
  const using3P = isUsing3PServices()

  // Check third-party provider from global config
  const globalCfg = getGlobalConfig()
  const tp = globalCfg.thirdPartyProvider

  const loggedIn =
    hasToken || apiKeySource !== 'none' || hasApiKeyEnvVar || using3P || !!tp

  // Determine auth method
  let authMethod: string = 'none'
  if (tp) {
    authMethod = 'third_party_provider'
  } else if (using3P) {
    authMethod = 'third_party'
  } else if (authTokenSource === 'claude.ai') {
    authMethod = 'claude.ai'
  } else if (authTokenSource === 'apiKeyHelper') {
    authMethod = 'api_key_helper'
  } else if (authTokenSource !== 'none') {
    authMethod = 'oauth_token'
  } else if (apiKeySource === 'ANTHROPIC_API_KEY' || hasApiKeyEnvVar) {
    authMethod = 'api_key'
  } else if (apiKeySource === '/login managed key') {
    authMethod = 'claude.ai'
  }

  if (opts.text) {
    const properties = [
      ...buildAccountProperties(),
      ...buildAPIProviderProperties(),
    ]
    let hasAuthProperty = false
    for (const prop of properties) {
      const value =
        typeof prop.value === 'string'
          ? prop.value
          : Array.isArray(prop.value)
            ? prop.value.join(', ')
            : null
      if (value === null || value === 'none') {
        continue
      }
      hasAuthProperty = true
      if (prop.label) {
        process.stdout.write(`${prop.label}: ${value}\n`)
      } else {
        process.stdout.write(`${value}\n`)
      }
    }
    if (!hasAuthProperty && hasApiKeyEnvVar) {
      process.stdout.write('API key: ANTHROPIC_API_KEY\n')
    }
    if (tp) {
      const tpDisplay = ALL_PROVIDERS[tp.name]?.name ?? tp.name
      process.stdout.write(`Provider: ${tpDisplay}\n`)
      process.stdout.write(`Model: ${tp.model}\n`)
      process.stdout.write(`Base URL: ${tp.baseURL}\n`)
    }
    if (!loggedIn) {
      process.stdout.write(
        'Not logged in. Run panda auth login to authenticate.\n',
      )
    }
  } else {
    const apiProvider = getAPIProvider()
    const resolvedApiKeySource =
      apiKeySource !== 'none'
        ? apiKeySource
        : hasApiKeyEnvVar
          ? 'ANTHROPIC_API_KEY'
          : null
    const output: Record<string, string | boolean | null> = {
      loggedIn,
      authMethod,
      apiProvider,
    }
    if (resolvedApiKeySource) {
      output.apiKeySource = resolvedApiKeySource
    }
    if (authMethod === 'claude.ai') {
      output.email = oauthAccount?.emailAddress ?? null
      output.orgId = oauthAccount?.organizationUuid ?? null
      output.orgName = oauthAccount?.organizationName ?? null
      output.subscriptionType = subscriptionType ?? null
    }
    if (tp) {
      output.thirdPartyProvider = tp.name
      output.thirdPartyModel = tp.model
      output.thirdPartyBaseURL = tp.baseURL
    }

    process.stdout.write(jsonStringify(output, null, 2) + '\n')
  }
  process.exit(loggedIn ? 0 : 1)
}

export async function authLogout(): Promise<void> {
  // Clear third-party provider config if present
  const globalCfg = getGlobalConfig()
  if (globalCfg.thirdPartyProvider) {
    saveGlobalConfig(current => {
      const updated = { ...current }
      delete updated.thirdPartyProvider
      return updated
    })
    // Also clear env vars that may have been set from the config
    delete process.env.ANTHROPIC_BASE_URL
    delete process.env.ANTHROPIC_AUTH_TOKEN
    delete process.env.ANTHROPIC_MODEL
  }

  try {
    await performLogout({ clearOnboarding: false })
  } catch {
    process.stderr.write('Failed to log out.\n')
    process.exit(1)
  }
  process.stdout.write('Successfully logged out.\n')
  process.exit(0)
}
