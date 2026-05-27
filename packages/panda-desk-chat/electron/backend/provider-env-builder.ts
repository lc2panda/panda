// Input: opts { cwd, provider?, skipDotenv?, managedOAuth? } — spawn 选项
// Output: 精简后的子进程 env，清除 shell 残留 provider token，注入正确 provider env key
// Pos: electron/backend — cli-manager spawn 时调用，替换直接展开 process.env
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
//
// 设计原则：
//   - 允许通过的 key 白名单：系统基础 env（HOME/PATH/SHELL 等）+ PANDA_* + NODE_* + TZ/LANG/LC_*
//   - 强制清除：ANTHROPIC_* / OPENAI_* / GOOGLE_* / GEMINI_* / AWS_* / VERTEX_*，
//     防止 shell 残留 provider token 污染新 provider 调用
//   - 按 provider 类型注入对应 env key（apiKey / baseUrl）
//   - managedOAuth=true 注入 CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST + CLAUDE_CODE_ENTRYPOINT
//   - skipDotenv=true 注入 PANDA_SKIP_DOTENV=1（panda-cli 读到该 env 跳过 .env 自动加载）
//   - CALLER_DIR / PWD 始终强制注入 opts.cwd（Bug B 规则，v2.26.14 建立）

export type ProviderType =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'bedrock'
  | 'vertex'
  | 'azure'
  | 'custom';

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  // Bedrock-specific
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsRegion?: string;
  // Vertex-specific
  googleApplicationCredentials?: string;
  cloudMlRegion?: string;
}

export interface BuildChildEnvOptions {
  cwd: string;
  provider?: ProviderConfig;
  skipDotenv?: boolean;
  managedOAuth?: boolean;
}

// Key prefixes that must be stripped from shell env to prevent cross-provider pollution.
const STRIP_PREFIXES = [
  'ANTHROPIC_',
  'OPENAI_',
  'GOOGLE_',
  'GEMINI_',
  'AWS_',
  'VERTEX_',
  'CLAUDE_CODE_',
];

// Allowed key patterns (exact match list + prefix-based check).
// Everything else from process.env that is NOT in the strip list is passed through.
// We strip provider-specific tokens explicitly; generic system env is kept.
const ALLOWED_EXACT: ReadonlySet<string> = new Set([
  'HOME',
  'PATH',
  'SHELL',
  'USER',
  'LOGNAME',
  'TMPDIR',
  'TEMP',
  'TMP',
  'LANG',
  'TZ',
  'TERM',
  'COLORTERM',
  'TERM_PROGRAM',
  'TERM_PROGRAM_VERSION',
  // macOS specific
  'XPC_SERVICE_NAME',
  'XPC_FLAGS',
  'APPLE_UNIVERSAL_PACKAGE',
  'SECURITYSESSIONID',
  '__CF_USER_TEXT_ENCODING',
  // Common CI / runtime
  'CI',
]);

const ALLOWED_PREFIXES = [
  'LC_',
  'NODE_',
  'PANDA_',
  'BUN_',
  'NVM_',
  'npm_',
  // Proxy
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'no_proxy',
];

function shouldStripKey(key: string): boolean {
  return STRIP_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isAllowedKey(key: string): boolean {
  if (ALLOWED_EXACT.has(key)) return true;
  return ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Build a sanitized env object for spawning panda-cli child processes.
 *
 * Contract:
 *   1. Strip all provider-sensitive key prefixes from process.env.
 *   2. Pass through system/runtime env that is in the allow-list.
 *   3. Inject provider-specific env keys from opts.provider.
 *   4. Inject managed-OAuth markers if opts.managedOAuth=true.
 *   5. Inject PANDA_SKIP_DOTENV=1 if opts.skipDotenv=true.
 *   6. Always inject CALLER_DIR and PWD = opts.cwd (Bug B invariant).
 */
export function buildChildEnv(opts: BuildChildEnvOptions): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {};

  // Step 1: Copy allowed keys from process.env, stripping provider tokens.
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (shouldStripKey(key)) continue;
    if (isAllowedKey(key)) {
      result[key] = value;
    }
  }

  // Step 2: Inject provider-specific env keys.
  if (opts.provider) {
    const p = opts.provider;
    switch (p.type) {
      case 'anthropic':
        if (p.apiKey) result['ANTHROPIC_API_KEY'] = p.apiKey;
        if (p.baseUrl) result['ANTHROPIC_BASE_URL'] = p.baseUrl;
        break;

      case 'openai':
        if (p.apiKey) result['OPENAI_API_KEY'] = p.apiKey;
        if (p.baseUrl) result['OPENAI_BASE_URL'] = p.baseUrl;
        break;

      case 'gemini':
        if (p.apiKey) {
          result['GOOGLE_API_KEY'] = p.apiKey;
          result['GEMINI_API_KEY'] = p.apiKey;
        }
        if (p.baseUrl) result['GOOGLE_API_BASE_URL'] = p.baseUrl;
        break;

      case 'bedrock':
        if (p.awsAccessKeyId) result['AWS_ACCESS_KEY_ID'] = p.awsAccessKeyId;
        if (p.awsSecretAccessKey) result['AWS_SECRET_ACCESS_KEY'] = p.awsSecretAccessKey;
        if (p.awsSessionToken) result['AWS_SESSION_TOKEN'] = p.awsSessionToken;
        if (p.awsRegion) result['AWS_REGION'] = p.awsRegion;
        break;

      case 'vertex':
        if (p.googleApplicationCredentials)
          result['GOOGLE_APPLICATION_CREDENTIALS'] = p.googleApplicationCredentials;
        if (p.cloudMlRegion) result['CLOUD_ML_REGION'] = p.cloudMlRegion;
        break;

      case 'azure':
        // Azure uses OPENAI_API_KEY + OPENAI_BASE_URL convention
        if (p.apiKey) result['OPENAI_API_KEY'] = p.apiKey;
        if (p.baseUrl) result['OPENAI_BASE_URL'] = p.baseUrl;
        break;

      case 'custom':
        // Custom provider: inject apiKey as ANTHROPIC_API_KEY fallback + optional base URL
        if (p.apiKey) result['ANTHROPIC_API_KEY'] = p.apiKey;
        if (p.baseUrl) result['ANTHROPIC_BASE_URL'] = p.baseUrl;
        break;
    }
  }

  // Step 3: Managed-OAuth markers.
  if (opts.managedOAuth) {
    result['CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST'] = '1';
    result['CLAUDE_CODE_ENTRYPOINT'] = 'panda-desktop';
  }

  // Step 4: Skip dotenv loading.
  if (opts.skipDotenv) {
    result['PANDA_SKIP_DOTENV'] = '1';
  }

  // Step 5: Force-inject CALLER_DIR and PWD (Bug B invariant, v2.26.14).
  result['CALLER_DIR'] = opts.cwd;
  result['PWD'] = opts.cwd;

  return result;
}
