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
import { getInitialSettings } from '../../utils/settings/settings.js'
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
  { name: string; baseURL: string; defaultModel: string }
> = {
  deepseek: { name: 'DeepSeek', baseURL: 'https://api.deepseek.com/anthropic', defaultModel: 'deepseek-chat' },
  kimi: { name: 'Kimi (Moonshot)', baseURL: 'https://api.moonshot.ai/anthropic', defaultModel: 'kimi-k2.5' },
  qwen: { name: 'Qwen (阿里百炼)', baseURL: 'https://dashscope.aliyuncs.com/apps/anthropic', defaultModel: 'qwen-plus' },
  minimax: { name: 'MiniMax', baseURL: 'https://api.minimax.io/anthropic', defaultModel: 'MiniMax-M2.5' },
  glm: { name: 'GLM (智谱)', baseURL: 'https://open.bigmodel.cn/api/anthropic', defaultModel: 'glm-4' },
  volcano: { name: 'Volcano (火山引擎)', baseURL: 'https://ark.cn-beijing.volces.com/api/coding', defaultModel: 'ark-code-latest' },
}

// Full provider list including Anthropic (for interactive selection)
const ALL_PROVIDERS: Record<string, { name: string; baseURL: string | null; defaultModel: string | null }> = {
  anthropic: { name: 'Anthropic (Claude)', baseURL: null, defaultModel: null },
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
// Third-party login flow
// ---------------------------------------------------------------------------
async function thirdPartyLogin(providerKey: string): Promise<void> {
  const provider = THIRD_PARTY_PROVIDERS[providerKey]
  if (!provider) {
    process.stderr.write(`Error: unknown provider "${providerKey}".\n`)
    process.exit(1)
  }

  process.stdout.write(`\nLogging in to ${provider.name}...\n`)
  process.stdout.write(`Get your API key from the provider's console.\n\n`)
  const apiKey = await readlineQuestion('API Key: ')

  if (!apiKey.trim()) {
    process.stderr.write('Error: API key is required.\n')
    process.exit(1)
  }

  saveGlobalConfig(current => ({
    ...current,
    thirdPartyProvider: {
      name: providerKey,
      baseURL: provider.baseURL,
      apiKey: apiKey.trim(),
      model: provider.defaultModel,
    },
  }))

  try {
    const { readFileSync, writeFileSync } = await import('fs')
    const { join } = await import('path')
    const { homedir } = await import('os')
    const settingsPath = join(process.env.PANDA_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.pandacc'), 'settings.json')
    const raw = readFileSync(settingsPath, 'utf-8')
    const settings = JSON.parse(raw)
    if (settings.env) {
      delete settings.env.ANTHROPIC_BASE_URL
      delete settings.env.ANTHROPIC_AUTH_TOKEN
      delete settings.env.ANTHROPIC_MODEL
      if (Object.keys(settings.env).length === 0) delete settings.env
      writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    }
  } catch {}

  // Set env vars so the current process can use them immediately
  process.env.ANTHROPIC_BASE_URL = provider.baseURL
  process.env.ANTHROPIC_AUTH_TOKEN = apiKey.trim()
  process.env.ANTHROPIC_MODEL = provider.defaultModel

  process.stdout.write(`\n✓ Login successful! Provider: ${provider.name}\n`)
  process.stdout.write(`  Model: ${provider.defaultModel}\n`)
  process.stdout.write(`  Base URL: ${provider.baseURL}\n`)
  process.stdout.write(`\nRun 'panda' to start.\n`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Interactive provider selection (when no --provider flag)
// ---------------------------------------------------------------------------
async function selectProviderInteractively(): Promise<string> {
  process.stdout.write('\nSelect provider:\n')
  const keys = Object.keys(ALL_PROVIDERS)
  keys.forEach((k, i) =>
    process.stdout.write(`  ${i + 1}. ${ALL_PROVIDERS[k]!.name}\n`),
  )
  const choice = await readlineQuestion(`\nChoice (1-${keys.length}): `)
  const idx = parseInt(choice, 10) - 1
  if (idx < 0 || idx >= keys.length || Number.isNaN(idx)) {
    process.stderr.write('Invalid choice.\n')
    process.exit(1)
  }
  return keys[idx]!
}

/**
 * Shared post-token-acquisition logic. Saves tokens, fetches profile/roles,
 * and sets up the local auth state.
 */
export async function installOAuthTokens(tokens: OAuthTokens): Promise<void> {
  // Clear old state before saving new credentials
  await performLogout({ clearOnboarding: false })

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
