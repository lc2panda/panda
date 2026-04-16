import Anthropic, { type ClientOptions } from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'
import type { GoogleAuth } from 'google-auth-library'
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getAnthropicApiKey,
  getApiKeyFromApiKeyHelper,
  getClaudeAIOAuthTokens,
  isClaudeAISubscriber,
  refreshAndGetAwsCredentials,
  refreshGcpCredentialsIfNeeded,
} from 'src/utils/auth.js'
import { getGlobalConfig } from 'src/utils/config.js'
import { getUserAgent } from 'src/utils/http.js'
import { getSmallFastModel } from 'src/utils/model/model.js'
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
  isThirdPartyProvider,
} from 'src/utils/model/providers.js'
import { getProxyFetchOptions } from 'src/utils/proxy.js'
import {
  getIsNonInteractiveSession,
  getSessionId,
} from '../../bootstrap/state.js'
import { getOauthConfig } from '../../constants/oauth.js'
import { isDebugToStdErr, logForDebugging } from '../../utils/debug.js'
import {
  getAWSRegion,
  getVertexRegionForModel,
  isEnvTruthy,
} from '../../utils/envUtils.js'

/**
 * Environment variables for different client types:
 *
 * Direct API:
 * - ANTHROPIC_API_KEY: Required for direct API access
 *
 * AWS Bedrock:
 * - AWS credentials configured via aws-sdk defaults
 * - AWS_REGION or AWS_DEFAULT_REGION: Sets the AWS region for all models (default: us-east-1)
 * - ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION: Optional. Override AWS region specifically for the small fast model (Haiku)
 *
 * Foundry (Azure):
 * - ANTHROPIC_FOUNDRY_RESOURCE: Your Azure resource name (e.g., 'my-resource')
 *   For the full endpoint: https://{resource}.services.ai.azure.com/anthropic/v1/messages
 * - ANTHROPIC_FOUNDRY_BASE_URL: Optional. Alternative to resource - provide full base URL directly
 *   (e.g., 'https://my-resource.services.ai.azure.com')
 *
 * Authentication (one of the following):
 * - ANTHROPIC_FOUNDRY_API_KEY: Your Microsoft Foundry API key (if using API key auth)
 * - Azure AD authentication: If no API key is provided, uses DefaultAzureCredential
 *   which supports multiple auth methods (environment variables, managed identity,
 *   Azure CLI, etc.). See: https://docs.microsoft.com/en-us/javascript/api/@azure/identity
 *
 * Vertex AI:
 * - Model-specific region variables (highest priority):
 *   - VERTEX_REGION_CLAUDE_3_5_HAIKU: Region for Claude 3.5 Haiku model
 *   - VERTEX_REGION_CLAUDE_HAIKU_4_5: Region for Claude Haiku 4.5 model
 *   - VERTEX_REGION_CLAUDE_3_5_SONNET: Region for Claude 3.5 Sonnet model
 *   - VERTEX_REGION_CLAUDE_3_7_SONNET: Region for Claude 3.7 Sonnet model
 * - CLOUD_ML_REGION: Optional. The default GCP region to use for all models
 *   If specific model region not specified above
 * - ANTHROPIC_VERTEX_PROJECT_ID: Required. Your GCP project ID
 * - Standard GCP credentials configured via google-auth-library
 *
 * Priority for determining region:
 * 1. Hardcoded model-specific environment variables
 * 2. Global CLOUD_ML_REGION variable
 * 3. Default region from config
 * 4. Fallback region (us-east5)
 */

function createStderrLogger(): ClientOptions['logger'] {
  return {
    error: (msg, ...args) =>
      // biome-ignore lint/suspicious/noConsole:: intentional console output -- SDK logger must use console
      console.error('[Anthropic SDK ERROR]', msg, ...args),
    // biome-ignore lint/suspicious/noConsole:: intentional console output -- SDK logger must use console
    warn: (msg, ...args) => console.error('[Anthropic SDK WARN]', msg, ...args),
    // biome-ignore lint/suspicious/noConsole:: intentional console output -- SDK logger must use console
    info: (msg, ...args) => console.error('[Anthropic SDK INFO]', msg, ...args),
    debug: (msg, ...args) =>
      // biome-ignore lint/suspicious/noConsole:: intentional console output -- SDK logger must use console
      console.error('[Anthropic SDK DEBUG]', msg, ...args),
  }
}

// Privacy-safe session ID: random per process launch, not traceable to user
const PRIVACY_SESSION_ID = randomUUID()

export async function getAnthropicClient({
  apiKey,
  maxRetries,
  model,
  fetchOverride,
  source,
  routingOverride,
}: {
  apiKey?: string
  maxRetries: number
  model?: string
  fetchOverride?: ClientOptions['fetch']
  source?: string
  /** Panda: per-request provider override from Multi-Model Routing.
   *  When set, creates a client pointed at a specific endpoint instead of
   *  the global provider. Only used when enableModelRouting=true and the
   *  agent is routed to a third-party model. */
  routingOverride?: { baseURL: string; apiKey: string }
}): Promise<Anthropic> {
  // Panda: per-request routing override takes highest priority
  if (routingOverride) {
    // Temporarily set env vars for this client creation only.
    // The Anthropic SDK reads these during construction.
    const savedBaseURL = process.env.ANTHROPIC_BASE_URL
    const savedAuthToken = process.env.ANTHROPIC_AUTH_TOKEN
    const savedApiKey = process.env.ANTHROPIC_API_KEY
    process.env.ANTHROPIC_BASE_URL = routingOverride.baseURL
    process.env.ANTHROPIC_AUTH_TOKEN = routingOverride.apiKey
    process.env.ANTHROPIC_API_KEY = routingOverride.apiKey
    // Restore after client creation (handled below in the return path)
    const restoreEnv = () => {
      if (savedBaseURL !== undefined) process.env.ANTHROPIC_BASE_URL = savedBaseURL
      else delete process.env.ANTHROPIC_BASE_URL
      if (savedAuthToken !== undefined) process.env.ANTHROPIC_AUTH_TOKEN = savedAuthToken
      else delete process.env.ANTHROPIC_AUTH_TOKEN
      if (savedApiKey !== undefined) process.env.ANTHROPIC_API_KEY = savedApiKey
      else delete process.env.ANTHROPIC_API_KEY
    }
    // Create client with override, then restore env
    try {
      const { logForDebugging: _log } = await import('../../utils/debug.js')
      _log(`[routing] Creating routed client → ${routingOverride.baseURL}`)
    } catch {}
    // Fall through to normal client creation (env vars now point to routed endpoint)
    // restoreEnv is called after client construction below
    // Store restoreEnv for cleanup
    ;(globalThis as Record<string, unknown>).__pandaRoutingRestore = restoreEnv
  }

  // Auto-load third-party provider config from global settings (set via `panda auth login`).
  // Uses = (not ??=) to override stale env vars from settings.json.
  // Skip if routing override is active (it already set the env vars).
  if (!routingOverride) {
    const _tpConfig = getGlobalConfig().thirdPartyProvider
    if (_tpConfig) {
      if (_tpConfig.name === 'openai') {
        // OpenAI provider: set PANDA_PROVIDER + OPENAI_* env vars
        // so the OpenAI adapter proxy in getAnthropicClient() is activated
        process.env.PANDA_PROVIDER = 'openai'
        process.env.OPENAI_API_KEY = _tpConfig.apiKey
        process.env.OPENAI_BASE_URL = _tpConfig.baseURL
        process.env.ANTHROPIC_MODEL = _tpConfig.model
      } else {
        process.env.ANTHROPIC_BASE_URL = _tpConfig.baseURL
        process.env.ANTHROPIC_AUTH_TOKEN = _tpConfig.apiKey
        process.env.ANTHROPIC_API_KEY = _tpConfig.apiKey
        process.env.ANTHROPIC_MODEL = _tpConfig.model
      }
    }
  }

  // v2.20.13 阶段F: Kimi/Moonshot 自动切 Anthropic 兼容 endpoint
  // Moonshot 默认 endpoint 不支持 cache_control。但 api.moonshot.ai/anthropic
  // 完全兼容 Anthropic 协议（官方公告）。检测到 Kimi 模型时自动切换。
  // env DISABLE_MOONSHOT_ANTHROPIC_ENDPOINT 可 opt-out。
  if (!isEnvTruthy(process.env.DISABLE_MOONSHOT_ANTHROPIC_ENDPOINT)) {
    const baseUrl = process.env.ANTHROPIC_BASE_URL
    const model = process.env.ANTHROPIC_MODEL || ''
    if (baseUrl && /^kimi/i.test(model)) {
      try {
        const url = new URL(baseUrl)
        if (url.host === 'api.moonshot.ai' && !url.pathname.includes('anthropic')) {
          url.pathname = '/anthropic' + (url.pathname === '/' ? '' : url.pathname)
          process.env.ANTHROPIC_BASE_URL = url.toString().replace(/\/$/, '')
          try {
            const { logForDebugging } = await import('../../utils/debug.js')
            logForDebugging(`[cache-strategy] Moonshot Anthropic endpoint auto-enabled: ${process.env.ANTHROPIC_BASE_URL}`)
          } catch {}
        }
      } catch {}
    }
  }

  // v2.20.14 阶段F-2: Minimax 自动切 Anthropic 兼容 endpoint
  // Minimax 默认 endpoint 不支持 cache_control。但 api.minimax.io/anthropic
  // 完整兼容 Anthropic 协议（官方文档：TTL 5m, write 1.25x, read 0.1x）。
  // 检测到 Minimax 模型 (minimax-* / MiniMax-* / abab*) 时自动切换。
  // env DISABLE_MINIMAX_ANTHROPIC_ENDPOINT 可 opt-out。
  if (!isEnvTruthy(process.env.DISABLE_MINIMAX_ANTHROPIC_ENDPOINT)) {
    const baseUrl = process.env.ANTHROPIC_BASE_URL
    const model = process.env.ANTHROPIC_MODEL || ''
    if (baseUrl && /^(minimax|abab)/i.test(model)) {
      try {
        const url = new URL(baseUrl)
        if (url.host === 'api.minimax.io' && !url.pathname.includes('anthropic')) {
          url.pathname = '/anthropic' + (url.pathname === '/' ? '' : url.pathname)
          process.env.ANTHROPIC_BASE_URL = url.toString().replace(/\/$/, '')
          try {
            const { logForDebugging } = await import('../../utils/debug.js')
            logForDebugging(`[cache-strategy] Minimax Anthropic endpoint auto-enabled: ${process.env.ANTHROPIC_BASE_URL}`)
          } catch {}
        }
      } catch {}
    }
  }

  const containerId = process.env.CLAUDE_CODE_CONTAINER_ID
  const remoteSessionId = process.env.CLAUDE_CODE_REMOTE_SESSION_ID
  const clientApp = process.env.CLAUDE_AGENT_SDK_CLIENT_APP
  const customHeaders = getCustomHeaders()
  // v2.20.13 阶段G: OpenRouter sticky provider routing
  // 对 openrouter.ai 的请求自动加 OR-Prefer-Provider，确保后续请求路由到
  // 同一个底层 provider, 避免 cache 因 provider 轮询失效。
  const openrouterHeaders: { [key: string]: string } = {}
  try {
    const baseUrl = process.env.ANTHROPIC_BASE_URL
    if (baseUrl && new URL(baseUrl).host.includes('openrouter')) {
      // 默认保留底层 provider 路由一致性（sticky）
      const preferProvider = process.env.OPENROUTER_PREFER_PROVIDER
      openrouterHeaders['X-OR-Sort'] = 'throughput'  // 优先高吞吐
      if (preferProvider) {
        openrouterHeaders['X-OR-Prefer-Provider'] = preferProvider
      }
      // OpenRouter provider sticky routing: 复用上次成功的 provider
      openrouterHeaders['X-OR-Allow-Fallbacks'] = 'false'
    }
  } catch {}

  const defaultHeaders: { [key: string]: string } = isThirdPartyProvider()
    ? {
        'User-Agent': getUserAgent(),
        ...openrouterHeaders,
        ...customHeaders,
      }
    : {
        'x-app': 'cli',
        'User-Agent': getUserAgent(),
        'X-Claude-Code-Session-Id': PRIVACY_SESSION_ID,
        ...customHeaders,
        ...(containerId
          ? { 'x-claude-remote-container-id': containerId }
          : {}),
        ...(remoteSessionId
          ? { 'x-claude-remote-session-id': remoteSessionId }
          : {}),
        ...(clientApp ? { 'x-client-app': clientApp } : {}),
      }

  // Log API client configuration for HFI debugging
  logForDebugging(
    `[API:request] Creating client, ANTHROPIC_CUSTOM_HEADERS present: ${!!process.env.ANTHROPIC_CUSTOM_HEADERS}, has Authorization header: ${!!customHeaders['Authorization']}`,
  )

  // Add additional protection header if enabled via env var
  const additionalProtectionEnabled = isEnvTruthy(
    process.env.CLAUDE_CODE_ADDITIONAL_PROTECTION,
  )
  if (additionalProtectionEnabled) {
    defaultHeaders['x-anthropic-additional-protection'] = 'true'
  }

  logForDebugging('[API:auth] OAuth token check starting')
  await checkAndRefreshOAuthTokenIfNeeded()
  logForDebugging('[API:auth] OAuth token check complete')

  // 第三方 provider 必须注入 API key header，即使 isClaudeAISubscriber() 为 true
  // （因为 isClaudeAISubscriber 在 fork 中硬编码返回 true，但第三方不走 OAuth）
  if (!isClaudeAISubscriber() || isThirdPartyProvider()) {
    await configureApiKeyHeaders(defaultHeaders, getIsNonInteractiveSession())
  }

  const resolvedFetch = buildFetch(fetchOverride, source)

  const ARGS = {
    defaultHeaders,
    maxRetries,
    timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
    dangerouslyAllowBrowser: true,
    fetchOptions: getProxyFetchOptions({
      forAnthropicAPI: true,
    }) as ClientOptions['fetchOptions'],
    ...(resolvedFetch && {
      fetch: resolvedFetch,
    }),
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)) {
    const { AnthropicBedrock } = await import('@anthropic-ai/bedrock-sdk')
    // Use region override for small fast model if specified
    const awsRegion =
      model === getSmallFastModel() &&
      process.env.ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION
        ? process.env.ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION
        : getAWSRegion()

    const bedrockArgs: Record<string, unknown> = {
      ...ARGS,
      awsRegion,
      ...(isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH) && {
        skipAuth: true,
      }),
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }

    // Add API key authentication if available
    if (process.env.AWS_BEARER_TOKEN_BEDROCK) {
      bedrockArgs.skipAuth = true
      // Add the Bearer token for Bedrock API key authentication
      bedrockArgs.defaultHeaders = {
        ...(bedrockArgs.defaultHeaders as Record<string, string> | undefined),
        Authorization: `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`,
      }
    } else if (!isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)) {
      // Refresh auth and get credentials with cache clearing
      const cachedCredentials = await refreshAndGetAwsCredentials()
      if (cachedCredentials) {
        bedrockArgs.awsAccessKey = cachedCredentials.accessKeyId
        bedrockArgs.awsSecretKey = cachedCredentials.secretAccessKey
        bedrockArgs.awsSessionToken = cachedCredentials.sessionToken
      }
    }
    // we have always been lying about the return type - this doesn't support batching or models
    return new AnthropicBedrock(bedrockArgs) as unknown as Anthropic
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)) {
    const { AnthropicFoundry } = await import('@anthropic-ai/foundry-sdk')
    // Determine Azure AD token provider based on configuration
    // SDK reads ANTHROPIC_FOUNDRY_API_KEY by default
    let azureADTokenProvider: (() => Promise<string>) | undefined
    if (!process.env.ANTHROPIC_FOUNDRY_API_KEY) {
      if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FOUNDRY_AUTH)) {
        // Mock token provider for testing/proxy scenarios (similar to Vertex mock GoogleAuth)
        azureADTokenProvider = () => Promise.resolve('')
      } else {
        // Use real Azure AD authentication with DefaultAzureCredential
        const {
          DefaultAzureCredential: AzureCredential,
          getBearerTokenProvider,
        } = await import('@azure/identity')
        azureADTokenProvider = getBearerTokenProvider(
          new AzureCredential(),
          'https://cognitiveservices.azure.com/.default',
        )
      }
    }

    const foundryArgs: ConstructorParameters<typeof AnthropicFoundry>[0] = {
      ...ARGS,
      ...(azureADTokenProvider && { azureADTokenProvider }),
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }
    // we have always been lying about the return type - this doesn't support batching or models
    return new AnthropicFoundry(foundryArgs) as unknown as Anthropic
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)) {
    // Refresh GCP credentials if gcpAuthRefresh is configured and credentials are expired
    // This is similar to how we handle AWS credential refresh for Bedrock
    if (!isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)) {
      await refreshGcpCredentialsIfNeeded()
    }

    const [{ AnthropicVertex }, { GoogleAuth }] = await Promise.all([
      import('@anthropic-ai/vertex-sdk'),
      import('google-auth-library'),
    ])
    // TODO: Cache either GoogleAuth instance or AuthClient to improve performance
    // Currently we create a new GoogleAuth instance for every getAnthropicClient() call
    // This could cause repeated authentication flows and metadata server checks
    // However, caching needs careful handling of:
    // - Credential refresh/expiration
    // - Environment variable changes (GOOGLE_APPLICATION_CREDENTIALS, project vars)
    // - Cross-request auth state management
    // See: https://github.com/googleapis/google-auth-library-nodejs/issues/390 for caching challenges

    // Prevent metadata server timeout by providing projectId as fallback
    // google-auth-library checks project ID in this order:
    // 1. Environment variables (GCLOUD_PROJECT, GOOGLE_CLOUD_PROJECT, etc.)
    // 2. Credential files (service account JSON, ADC file)
    // 3. gcloud config
    // 4. GCE metadata server (causes 12s timeout outside GCP)
    //
    // We only set projectId if user hasn't configured other discovery methods
    // to avoid interfering with their existing auth setup

    // Check project environment variables in same order as google-auth-library
    // See: https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/googleauth.ts
    const hasProjectEnvVar =
      process.env['GCLOUD_PROJECT'] ||
      process.env['GOOGLE_CLOUD_PROJECT'] ||
      process.env['gcloud_project'] ||
      process.env['google_cloud_project']

    // Check for credential file paths (service account or ADC)
    // Note: We're checking both standard and lowercase variants to be safe,
    // though we should verify what google-auth-library actually checks
    const hasKeyFile =
      process.env['GOOGLE_APPLICATION_CREDENTIALS'] ||
      process.env['google_application_credentials']

    const googleAuth = isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)
      ? ({
          // Mock GoogleAuth for testing/proxy scenarios
          getClient: () => ({
            getRequestHeaders: () => ({}),
          }),
        } as unknown as GoogleAuth)
      : new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          // Only use ANTHROPIC_VERTEX_PROJECT_ID as last resort fallback
          // This prevents the 12-second metadata server timeout when:
          // - No project env vars are set AND
          // - No credential keyfile is specified AND
          // - ADC file exists but lacks project_id field
          //
          // Risk: If auth project != API target project, this could cause billing/audit issues
          // Mitigation: Users can set GOOGLE_CLOUD_PROJECT to override
          ...(hasProjectEnvVar || hasKeyFile
            ? {}
            : {
                projectId: process.env.ANTHROPIC_VERTEX_PROJECT_ID,
              }),
        })

    const vertexArgs: ConstructorParameters<typeof AnthropicVertex>[0] = {
      ...ARGS,
      region: getVertexRegionForModel(model),
      googleAuth: googleAuth as any,
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }
    // we have always been lying about the return type - this doesn't support batching or models
    return new AnthropicVertex(vertexArgs) as unknown as Anthropic
  }

  // ---- OpenAI Provider ----
  if (process.env.PANDA_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
    const { OpenAIClient } = await import('./openaiAdapter.js')
    const openaiApiKey = process.env.OPENAI_API_KEY
    const openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const openaiClient = new OpenAIClient(openaiApiKey, openaiBaseUrl)

    // Return a Proxy that intercepts beta.messages.create calls
    // and routes them through the OpenAI adapter
    const proxy = {
      beta: {
        messages: {
          create: async (params: any, options?: any) => {
            if (params.stream || options?.stream) {
              // Return an async iterable that yields Anthropic-format events
              const stream = openaiClient.createMessageStream(params)
              // Wrap in an object that mimics Anthropic's stream response
              return {
                [Symbol.asyncIterator]: () => stream[Symbol.asyncIterator](),
                async *events() {
                  yield* stream
                },
                // Provide a finalMessage() that collects all events
                async finalMessage() {
                  return openaiClient.createMessage(params)
                },
              }
            }
            return openaiClient.createMessage(params)
          },
        },
      },
      messages: {
        create: async (params: any) => {
          return openaiClient.createMessage(params)
        },
      },
    }
    logForDebugging(`[API:openai] Using OpenAI provider: ${openaiBaseUrl}, model mapping active`)
    return proxy as unknown as Anthropic
  }

  const _hasThirdParty = !!getGlobalConfig().thirdPartyProvider
  const resolvedApiKey = (_hasThirdParty || !isClaudeAISubscriber()) ? (apiKey || getAnthropicApiKey()) : null
  const resolvedAuthToken = (!_hasThirdParty && isClaudeAISubscriber())
    ? getClaudeAIOAuthTokens()?.accessToken
    : undefined
  const clientConfig: ConstructorParameters<typeof Anthropic>[0] = {
    apiKey: resolvedApiKey,
    authToken: resolvedAuthToken,
    // Set baseURL from OAuth config when using staging OAuth
    ...(process.env.USER_TYPE === 'ant' &&
    isEnvTruthy(process.env.USE_STAGING_OAUTH)
      ? { baseURL: getOauthConfig().BASE_API_URL }
      : {}),
    ...ARGS,
    ...(isDebugToStdErr() && { logger: createStderrLogger() }),
  }

  const client = new Anthropic(clientConfig)

  // Panda: restore env vars after routing override client creation
  const restoreEnv = (globalThis as Record<string, unknown>).__pandaRoutingRestore as (() => void) | undefined
  if (restoreEnv) {
    restoreEnv()
    delete (globalThis as Record<string, unknown>).__pandaRoutingRestore
  }

  return client
}

async function configureApiKeyHeaders(
  headers: Record<string, string>,
  isNonInteractiveSession: boolean,
): Promise<void> {
  const token =
    process.env.ANTHROPIC_AUTH_TOKEN ||
    (await getApiKeyFromApiKeyHelper(isNonInteractiveSession))
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
}

function getCustomHeaders(): Record<string, string> {
  const customHeaders: Record<string, string> = {}
  const customHeadersEnv = process.env.ANTHROPIC_CUSTOM_HEADERS

  if (!customHeadersEnv) return customHeaders

  // Split by newlines to support multiple headers
  const headerStrings = customHeadersEnv.split(/\n|\r\n/)

  for (const headerString of headerStrings) {
    if (!headerString.trim()) continue

    // Parse header in format "Name: Value" (curl style). Split on first `:`
    // then trim — avoids regex backtracking on malformed long header lines.
    const colonIdx = headerString.indexOf(':')
    if (colonIdx === -1) continue
    const name = headerString.slice(0, colonIdx).trim()
    const value = headerString.slice(colonIdx + 1).trim()
    if (name) {
      customHeaders[name] = value
    }
  }

  return customHeaders
}

export const CLIENT_REQUEST_ID_HEADER = 'x-client-request-id'

function buildFetch(
  fetchOverride: ClientOptions['fetch'],
  source: string | undefined,
): ClientOptions['fetch'] {
  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
  const inner = fetchOverride ?? globalThis.fetch
  // Only send to the first-party API — Bedrock/Vertex/Foundry don't log it
  // and unknown headers risk rejection by strict proxies (inc-4029 class).
  const injectClientRequestId =
    getAPIProvider() === 'firstParty' && isFirstPartyAnthropicBaseUrl()
  return (input, init) => {
    // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
    const headers = new Headers(init?.headers)
    // Generate a client-side request ID so timeouts (which return no server
    // request ID) can still be correlated with server logs by the API team.
    // Callers that want to track the ID themselves can pre-set the header.
    if (injectClientRequestId && !headers.has(CLIENT_REQUEST_ID_HEADER)) {
      headers.set(CLIENT_REQUEST_ID_HEADER, randomUUID())
    }
    try {
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      const url = input instanceof Request ? input.url : String(input)
      const id = headers.get(CLIENT_REQUEST_ID_HEADER)
      logForDebugging(
        `[API REQUEST] ${new URL(url).pathname}${id ? ` ${CLIENT_REQUEST_ID_HEADER}=${id}` : ''} source=${source ?? 'unknown'}`,
      )
    } catch {
      // never let logging crash the fetch
    }
    return inner(input, { ...init, headers })
  }
}
