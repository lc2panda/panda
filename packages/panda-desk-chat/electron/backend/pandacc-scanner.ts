// Input: ~/.pandacc/{skills,agents,plugins,settings.json,computer-use} + ~/.pandacc.json 真实文件 + macOS systemPreferences (TCC) + spawn(system_profiler/mdfind) + shell.openExternal
// Output: SkillItem[] / AgentItem[] / PluginItem[] / EnvVars / ProviderSnapshot / ComputerUseStatusEx (+permissions) / InstalledApp[] / AuthorizedApp[] / open-settings void
// Pos: electron main — 扫描真实 ~/.pandacc 配置目录供 Settings sub-tab 使用
//
// Comdr 指令: 扫描 panda 默认配置目录 ~/.pandacc/，对接 Skills/Agents/Plugins/ComputerUse/Env 5 个 Settings sub-tab。
// 不引入新依赖：frontmatter 用极简正则解析（仅取 name/description/tools/version），不解析嵌套 YAML。
//
// Comdr 指令: ComputerUse 完整实现 - cc-haha 对标
//   - 5 个新 IPC 后端: status (with TCC perms) / installed-apps / authorized-apps (R/W) / open-settings
//   - panda 是 Swift 路线（@ant/computer-use-swift），无 Python venv，因此不检 Python/dependencies
//   - macOS TCC 通过 Electron systemPreferences 检测 — accessibility/screen recording
//   - installedApps 用 system_profiler (官方 macOS 工具) 扫 /Applications
//   - grants.json 写入 ~/.pandacc/computer-use/，首次自动 mkdir
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawn as childSpawn } from 'node:child_process';
import { systemPreferences, shell } from 'electron';

// ─── 路径约定 ────────────────────────────────────────────────────────────────

/** pandacc 根目录 — 默认 ~/.pandacc，可通过 PANDA_CONFIG_DIR 覆盖（与 cli 行为一致）。 */
function pandaccRoot(): string {
  return process.env.PANDA_CONFIG_DIR && process.env.PANDA_CONFIG_DIR.trim()
    ? process.env.PANDA_CONFIG_DIR
    : path.join(os.homedir(), '.pandacc');
}

const SKILLS_DIR = () => path.join(pandaccRoot(), 'skills');
const AGENTS_DIR = () => path.join(pandaccRoot(), 'agents');
const PLUGINS_INSTALLED_JSON = () =>
  path.join(pandaccRoot(), 'plugins', 'installed_plugins.json');
const SETTINGS_JSON = () => path.join(pandaccRoot(), 'settings.json');
const GLOBAL_CONFIG_JSON = () => path.join(os.homedir(), '.pandacc.json');
const COMPUTER_USE_DIR = () => path.join(pandaccRoot(), 'computer-use');

// ─── 公共类型 ────────────────────────────────────────────────────────────────

export interface SkillItem {
  name: string;
  displayName?: string;
  description: string;
  path: string;
  version?: string;
  hasSkillMd: boolean;
}

export interface AgentItem {
  name: string;
  description: string;
  tools: string[];
  model?: string;
  path: string;
}

export interface PluginItem {
  id: string; // "name@marketplace"
  name: string;
  marketplace: string;
  version: string;
  scope: 'user' | 'project' | 'managed' | 'builtin';
  installPath: string;
  installedAt?: string;
  lastUpdated?: string;
  enabled: boolean;
}

// Comdr 指令: ComputerUse 完整实现 - cc-haha 对标
// macOS TCC 权限三态：true=已授权 / false=明确拒绝或未请求 / null=不可检测（非 darwin / API 不返回值）
export interface ComputerUsePermissions {
  accessibility: boolean | null;
  screenRecording: boolean | null;
}

export interface AuthorizedApp {
  bundleId: string;
  displayName: string;
  authorizedAt: string;
}

export interface InstalledApp {
  bundleId: string;
  displayName: string;
  path: string;
}

export interface ComputerUseGrantFlags {
  clipboardRead: boolean;
  clipboardWrite: boolean;
  systemKeyCombos: boolean;
}

export interface ComputerUseStatusEx {
  platform: NodeJS.Platform;
  supported: boolean;
  grantsExist: boolean;
  grantsPath: string;
  grantedApps: AuthorizedApp[];
  // Comdr 指令: ComputerUse 完整实现 - cc-haha 对标 — 加 macOS TCC 实测权限
  permissions: ComputerUsePermissions;
}

export interface ProviderSnapshot {
  activeProviderId: string;
  activeProviderName: string;
  providerType: 'anthropic' | 'openai' | 'openrouter' | 'custom';
  baseUrl: string;
  currentModel: string;
  auth: {
    configured: boolean;
    method: 'process.env' | 'settings.json' | 'auth login' | 'oauthAccount' | 'none';
    account?: string;
  };
  models: {
    main?: string;
    haiku?: string;
    sonnet?: string;
    opus?: string;
  };
  sources: {
    settingsJson: { path: string; exists: boolean; envKeys: string[] };
    globalConfig: { path: string; exists: boolean; hasThirdPartyProvider: boolean; hasOAuthAccount: boolean };
    processEnvKeys: string[];
  };
}

// grants.json 格式 — cc-haha API 对齐
interface GrantsFile {
  authorizedApps: AuthorizedApp[];
  grantFlags: ComputerUseGrantFlags;
}

const DEFAULT_GRANT_FLAGS: ComputerUseGrantFlags = {
  clipboardRead: true,
  clipboardWrite: true,
  systemKeyCombos: true,
};

// ─── 极简 frontmatter 解析（不引入 yaml 依赖） ────────────────────────────────

interface ParsedFrontmatter {
  data: Record<string, unknown>;
  body: string;
}

/** 取 `---\n...\n---` 之间的内容；只解析顶层 key: value 与 `key:\n  - item` 形式 list。 */
function parseFrontmatter(content: string): ParsedFrontmatter {
  const trimmed = content.replace(/^\uFEFF/, '');
  if (!trimmed.startsWith('---')) {
    return { data: {}, body: trimmed };
  }
  const end = trimmed.indexOf('\n---', 3);
  if (end < 0) return { data: {}, body: trimmed };
  const fm = trimmed.slice(3, end).replace(/^\n/, '');
  const body = trimmed.slice(end + 4).replace(/^\n/, '');

  const data: Record<string, unknown> = {};
  const lines = fm.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    // 顶层 key（无前导空格）
    const m = line.match(/^([A-Za-z0-9_\-.]+)\s*:\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1]!;
    let raw = (m[2] ?? '').trim();
    // 处理 multiline `|` / `>` block scalar — 取所有缩进行
    if (raw === '|' || raw === '>' || raw === '|-' || raw === '>-') {
      const buf: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s+\S/.test(lines[j] ?? '')) {
        buf.push((lines[j] ?? '').replace(/^\s+/, ''));
        j++;
      }
      data[key] = buf.join(raw.startsWith('>') ? ' ' : '\n');
      i = j;
      continue;
    }
    // 列表：value 为空且下一行 `  - ...`
    if (raw === '') {
      const list: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s+-\s+/.test(lines[j] ?? '')) {
        list.push((lines[j] ?? '').replace(/^\s+-\s+/, '').trim().replace(/^["'](.+)["']$/, '$1'));
        j++;
      }
      if (list.length > 0) {
        data[key] = list;
        i = j;
        continue;
      }
      // 否则当 nested object，跳过其缩进块（粗粒度）
      let j2 = i + 1;
      while (j2 < lines.length && /^\s+\S/.test(lines[j2] ?? '')) j2++;
      i = j2;
      continue;
    }
    // 标量 — 去掉前后引号
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1);
    }
    data[key] = raw;
    i++;
  }
  return { data, body };
}

// ─── Skills 扫描 ─────────────────────────────────────────────────────────────

export async function listSkills(): Promise<SkillItem[]> {
  const dir = SKILLS_DIR();
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: SkillItem[] = [];
  for (const entry of entries) {
    // 跳过 .DS_Store / 隐藏文件
    if (entry.name.startsWith('.')) continue;
    // ⚠️ 兼容 symlink 目录：withFileTypes 不解析符号链接，必须用 fs.stat 跟踪
    let isDirLike = entry.isDirectory();
    if (!isDirLike && entry.isSymbolicLink()) {
      try {
        const linkStat = await fs.stat(path.join(dir, entry.name));
        isDirLike = linkStat.isDirectory();
      } catch {
        // 死链接 — 跳过
        continue;
      }
    }
    if (!isDirLike) continue;
    const skillDir = path.join(dir, entry.name);
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    let description = '';
    let displayName: string | undefined;
    let version: string | undefined;
    let hasSkillMd = false;
    try {
      const md = await fs.readFile(skillMdPath, 'utf8');
      hasSkillMd = true;
      const { data } = parseFrontmatter(md);
      const desc = data['description'];
      if (typeof desc === 'string') description = desc.trim();
      const name = data['name'];
      if (typeof name === 'string') displayName = name;
      const ver = data['version'];
      if (typeof ver === 'string') version = ver;
    } catch {
      // 没 SKILL.md，仅返回目录名占位
    }
    out.push({
      name: entry.name,
      displayName,
      description,
      path: skillDir,
      version,
      hasSkillMd,
    });
  }
  // 名字排序，稳定可预期
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// ─── Agents 扫描 ─────────────────────────────────────────────────────────────

export async function listAgents(): Promise<AgentItem[]> {
  const dir = AGENTS_DIR();
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: AgentItem[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue;
    const agentPath = path.join(dir, entry.name);
    const stem = entry.name.replace(/\.md$/i, '');
    try {
      const md = await fs.readFile(agentPath, 'utf8');
      const { data } = parseFrontmatter(md);
      const name = typeof data['name'] === 'string' ? (data['name'] as string) : stem;
      const description = typeof data['description'] === 'string' ? (data['description'] as string).trim() : '';
      const tools = Array.isArray(data['tools'])
        ? (data['tools'] as unknown[]).filter((t): t is string => typeof t === 'string')
        : [];
      const model = typeof data['model'] === 'string' ? (data['model'] as string) : undefined;
      out.push({ name, description, tools, model, path: agentPath });
    } catch {
      out.push({ name: stem, description: '', tools: [], path: agentPath });
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// ─── Plugins 列表 ────────────────────────────────────────────────────────────

interface InstalledPluginEntry {
  scope?: string;
  installPath?: string;
  version?: string;
  installedAt?: string;
  lastUpdated?: string;
  gitCommitSha?: string;
  enabled?: boolean;
}

interface InstalledPluginsFile {
  version?: number;
  plugins?: Record<string, InstalledPluginEntry[]>;
  disabled?: string[];
}

export async function listPlugins(): Promise<PluginItem[]> {
  let raw: string;
  try {
    raw = await fs.readFile(PLUGINS_INSTALLED_JSON(), 'utf8');
  } catch {
    return [];
  }
  let parsed: InstalledPluginsFile;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const disabled = new Set<string>(Array.isArray(parsed.disabled) ? parsed.disabled : []);
  const out: PluginItem[] = [];
  const map = parsed.plugins ?? {};
  for (const [id, instances] of Object.entries(map)) {
    if (!Array.isArray(instances) || instances.length === 0) continue;
    // 取首个 install — 与 cc-haha 行为对齐
    const first = instances[0]!;
    const [name, marketplace] = id.split('@');
    const scope = (first.scope === 'project' || first.scope === 'managed' || first.scope === 'builtin'
      ? first.scope
      : 'user') as PluginItem['scope'];
    out.push({
      id,
      name: name ?? id,
      marketplace: marketplace ?? '',
      version: first.version ?? 'unknown',
      scope,
      installPath: first.installPath ?? '',
      installedAt: first.installedAt,
      lastUpdated: first.lastUpdated,
      enabled: !disabled.has(id),
    });
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

// ─── settings.json env 读写 ──────────────────────────────────────────────────

export async function getPandaEnv(): Promise<Record<string, string>> {
  let raw: string;
  try {
    raw = await fs.readFile(SETTINGS_JSON(), 'utf8');
  } catch {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as { env?: Record<string, unknown> };
    if (!parsed.env || typeof parsed.env !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.env)) {
      if (typeof v === 'string') out[k] = v;
      else if (typeof v === 'number' || typeof v === 'boolean') out[k] = String(v);
    }
    return out;
  } catch {
    return {};
  }
}

type ThirdPartyProviderConfig = {
  name?: string;
  baseURL?: string;
  apiKey?: string;
  model?: string;
  mode?: 'api_key' | 'chatgpt_backend';
  accessToken?: string;
  refreshToken?: string;
  email?: string;
};

type GlobalConfigSnapshot = {
  thirdPartyProvider?: ThirdPartyProviderConfig;
  oauthAccount?: {
    emailAddress?: string;
    displayName?: string;
    organizationName?: string | null;
  };
  model?: string;
};

function pickEnvValue(
  key: string,
  settingsEnv: Record<string, string>,
): { value: string; source: 'process.env' | 'settings.json' } | null {
  const processValue = process.env[key];
  if (typeof processValue === 'string' && processValue.trim()) {
    return { value: processValue, source: 'process.env' };
  }
  const settingsValue = settingsEnv[key];
  if (typeof settingsValue === 'string' && settingsValue.trim()) {
    return { value: settingsValue, source: 'settings.json' };
  }
  return null;
}

function providerTypeFrom(name: string, baseUrl: string): ProviderSnapshot['providerType'] {
  const haystack = `${name} ${baseUrl}`.toLowerCase();
  if (haystack.includes('openrouter')) return 'openrouter';
  if (haystack.includes('openai') || haystack.includes('chatgpt')) return 'openai';
  if (haystack.includes('anthropic') || haystack.includes('claude')) return 'anthropic';
  return baseUrl.includes('anthropic.com') ? 'anthropic' : 'custom';
}

function configuredEnvKeys(env: Record<string, string>, keys: string[]): string[] {
  return keys.filter((key) => {
    const value = env[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

export async function getProviderSnapshot(): Promise<ProviderSnapshot> {
  const settingsEnv = await getPandaEnv();
  const settingsPath = SETTINGS_JSON();
  const globalPath = GLOBAL_CONFIG_JSON();
  let globalExists = false;
  let globalConfig: GlobalConfigSnapshot = {};
  try {
    const raw = await fs.readFile(globalPath, 'utf8');
    globalExists = true;
    const parsed = JSON.parse(raw) as GlobalConfigSnapshot;
    if (parsed && typeof parsed === 'object') globalConfig = parsed;
  } catch {
    globalExists = false;
  }

  let settingsExists = false;
  try {
    const s = await fs.stat(settingsPath);
    settingsExists = s.isFile();
  } catch {
    settingsExists = false;
  }

  const relevantEnvKeys = [
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_MODEL',
    'ANTHROPIC_DEFAULT_HAIKU_MODEL',
    'ANTHROPIC_DEFAULT_SONNET_MODEL',
    'ANTHROPIC_DEFAULT_OPUS_MODEL',
  ];
  const processEnvKeys = configuredEnvKeys(process.env as Record<string, string>, relevantEnvKeys);
  const settingsEnvKeys = configuredEnvKeys(settingsEnv, relevantEnvKeys);

  const thirdParty = globalConfig.thirdPartyProvider;
  const baseUrl =
    pickEnvValue('ANTHROPIC_BASE_URL', settingsEnv)?.value ||
    thirdParty?.baseURL ||
    'https://api.anthropic.com';
  const currentModel =
    pickEnvValue('ANTHROPIC_MODEL', settingsEnv)?.value ||
    thirdParty?.model ||
    globalConfig.model ||
    pickEnvValue('ANTHROPIC_DEFAULT_OPUS_MODEL', settingsEnv)?.value ||
    'claude-opus-4-7';
  const rawName = thirdParty?.name || (baseUrl.includes('anthropic.com') ? 'Anthropic' : 'Custom Provider');
  const providerType = providerTypeFrom(rawName, baseUrl);

  const apiKey = pickEnvValue('ANTHROPIC_API_KEY', settingsEnv);
  const authToken = pickEnvValue('ANTHROPIC_AUTH_TOKEN', settingsEnv);
  let auth: ProviderSnapshot['auth'] = { configured: false, method: 'none' };
  if (apiKey) auth = { configured: true, method: apiKey.source };
  else if (authToken) auth = { configured: true, method: authToken.source };
  else if (thirdParty?.apiKey || thirdParty?.accessToken || thirdParty?.refreshToken) {
    auth = {
      configured: true,
      method: 'auth login',
      account: thirdParty.email,
    };
  } else if (globalConfig.oauthAccount) {
    auth = {
      configured: true,
      method: 'oauthAccount',
      account: globalConfig.oauthAccount.emailAddress || globalConfig.oauthAccount.displayName,
    };
  }

  const models = {
    main: currentModel,
    haiku: pickEnvValue('ANTHROPIC_DEFAULT_HAIKU_MODEL', settingsEnv)?.value,
    sonnet: pickEnvValue('ANTHROPIC_DEFAULT_SONNET_MODEL', settingsEnv)?.value,
    opus: pickEnvValue('ANTHROPIC_DEFAULT_OPUS_MODEL', settingsEnv)?.value,
  };

  return {
    activeProviderId: providerType === 'anthropic' ? 'anthropic' : `${providerType}-cli`,
    activeProviderName: rawName,
    providerType,
    baseUrl,
    currentModel,
    auth,
    models,
    sources: {
      settingsJson: { path: settingsPath, exists: settingsExists, envKeys: settingsEnvKeys },
      globalConfig: {
        path: globalPath,
        exists: globalExists,
        hasThirdPartyProvider: !!thirdParty,
        hasOAuthAccount: !!globalConfig.oauthAccount,
      },
      processEnvKeys,
    },
  };
}

/**
 * Merge-write a single env key into ~/.pandacc/settings.json without touching
 * permissions / attribution / other top-level fields.
 *
 * - value === null | '' → delete the key
 * - 其它情况 → 写入字符串值
 */
export async function setPandaEnvKey(key: string, value: string | null): Promise<void> {
  if (!key || typeof key !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    throw new Error(`invalid env key: ${key}`);
  }
  const settingsPath = SETTINGS_JSON();
  let parsed: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(settingsPath, 'utf8');
    parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') parsed = {};
  } catch {
    // 文件不存在或损坏 — 重建
    parsed = {};
  }
  const env = (parsed.env && typeof parsed.env === 'object' ? parsed.env : {}) as Record<string, unknown>;
  if (value === null || value === '') {
    delete env[key];
  } else {
    env[key] = value;
  }
  parsed.env = env;
  // 确保 .pandacc 目录存在（首次写）
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  // 4 空格缩进 — 与 panda CLI 写法对齐
  await fs.writeFile(settingsPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
}

// ─── Computer Use 状态（含 TCC 权限） ────────────────────────────────────────
// Comdr 指令: ComputerUse 完整实现 - cc-haha 对标

const GRANTS_FILE = () => path.join(COMPUTER_USE_DIR(), 'grants.json');

/**
 * macOS TCC 权限实测 — 仅在 darwin 平台返回 boolean，否则 null。
 *
 * - accessibility: systemPreferences.isTrustedAccessibilityClient(false)
 *   → false 不弹窗（prompt=false），仅返回当前授权态。
 * - screenRecording: systemPreferences.getMediaAccessStatus('screen')
 *   → 返回 'granted' | 'denied' | 'restricted' | 'not-determined' | 'unknown'。
 */
function readMacOsTccPermissions(): ComputerUsePermissions {
  if (process.platform !== 'darwin') {
    return { accessibility: null, screenRecording: null };
  }
  let accessibility: boolean | null = null;
  let screenRecording: boolean | null = null;
  try {
    accessibility = systemPreferences.isTrustedAccessibilityClient(false);
  } catch {
    accessibility = null;
  }
  try {
    const status = systemPreferences.getMediaAccessStatus('screen');
    if (status === 'granted') screenRecording = true;
    else if (status === 'denied' || status === 'restricted') screenRecording = false;
    else screenRecording = null; // not-determined / unknown
  } catch {
    screenRecording = null;
  }
  return { accessibility, screenRecording };
}

/**
 * 读 grants.json — 返回完整 GrantsFile，缺失/损坏时返回默认空结构。
 */
async function readGrantsFile(): Promise<GrantsFile> {
  try {
    const raw = await fs.readFile(GRANTS_FILE(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<GrantsFile>;
    const authorizedApps = Array.isArray(parsed.authorizedApps)
      ? parsed.authorizedApps
          .filter((a): a is AuthorizedApp =>
            !!a &&
            typeof (a as AuthorizedApp).bundleId === 'string' &&
            typeof (a as AuthorizedApp).displayName === 'string',
          )
          .map((a) => ({
            bundleId: a.bundleId,
            displayName: a.displayName,
            authorizedAt: typeof a.authorizedAt === 'string' ? a.authorizedAt : new Date().toISOString(),
          }))
      : [];
    const grantFlags: ComputerUseGrantFlags = {
      clipboardRead: typeof parsed.grantFlags?.clipboardRead === 'boolean'
        ? parsed.grantFlags.clipboardRead : DEFAULT_GRANT_FLAGS.clipboardRead,
      clipboardWrite: typeof parsed.grantFlags?.clipboardWrite === 'boolean'
        ? parsed.grantFlags.clipboardWrite : DEFAULT_GRANT_FLAGS.clipboardWrite,
      systemKeyCombos: typeof parsed.grantFlags?.systemKeyCombos === 'boolean'
        ? parsed.grantFlags.systemKeyCombos : DEFAULT_GRANT_FLAGS.systemKeyCombos,
    };
    return { authorizedApps, grantFlags };
  } catch {
    return { authorizedApps: [], grantFlags: { ...DEFAULT_GRANT_FLAGS } };
  }
}

/**
 * Computer Use 全状态 — platform / supported / grants / TCC perms。
 */
export async function getComputerUseStatusEx(): Promise<ComputerUseStatusEx> {
  const platform = process.platform;
  const supported = platform === 'darwin';
  const grantsPath = COMPUTER_USE_DIR();
  let grantsExist = false;
  let grantedApps: AuthorizedApp[] = [];
  try {
    const stat = await fs.stat(grantsPath);
    grantsExist = stat.isDirectory();
    if (grantsExist) {
      const { authorizedApps } = await readGrantsFile();
      grantedApps = authorizedApps;
    }
  } catch {
    grantsExist = false;
  }
  return {
    platform,
    supported,
    grantsExist,
    grantsPath,
    grantedApps,
    permissions: readMacOsTccPermissions(),
  };
}

/**
 * 列已安装的 macOS 应用 — 用 system_profiler SPApplicationsDataType -json 扫。
 *
 * 性能取舍：
 *   - system_profiler 单次约 1~3s，覆盖 /Applications + /System/Applications + ~/Applications
 *   - 比 mdfind 更稳（mdfind 依赖 Spotlight 索引）
 *   - 我们要的是 displayName + bundleId + path，system_profiler 字段直接对齐
 *
 * 仅 darwin 可用；其它平台返回空数组。
 */
export async function listInstalledApps(): Promise<InstalledApp[]> {
  if (process.platform !== 'darwin') return [];
  return new Promise<InstalledApp[]>((resolve) => {
    let stdout = '';
    let stderr = '';
    const proc = childSpawn(
      'system_profiler',
      ['SPApplicationsDataType', '-json', '-detailLevel', 'mini'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const timer = setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch { /* noop */ }
      resolve([]);
    }, 8000);
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8'); });
    proc.on('error', () => {
      clearTimeout(timer);
      resolve([]);
    });
    proc.on('close', () => {
      clearTimeout(timer);
      if (!stdout.trim()) {
        if (stderr) console.warn('[computer-use] system_profiler stderr:', stderr.slice(0, 200));
        resolve([]);
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as {
          SPApplicationsDataType?: Array<{
            _name?: string;
            path?: string;
            info?: string;
            version?: string;
            obtained_from?: string;
            signed_by?: string[];
          }>;
        };
        const items = parsed.SPApplicationsDataType ?? [];
        const apps: InstalledApp[] = [];
        const seen = new Set<string>();
        for (const it of items) {
          const appPath = typeof it.path === 'string' ? it.path : '';
          const displayName = typeof it._name === 'string' ? it._name : '';
          if (!appPath || !displayName) continue;
          // bundleId — system_profiler 不直接给，回退 reverse-DNS by Info.plist 解析过于重；
          // 实用化 fallback：从 path basename 推 ID（display 唯一性）。如需精确 bundleId，
          // 可用 mdls -name kMDItemCFBundleIdentifier <path>，但此处优先稳定性。
          const baseName = path.basename(appPath, '.app');
          // 兜底 bundleId：用 path 反推一个稳定 key
          const bundleId = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '.');
          const dedupKey = `${appPath}::${displayName}`;
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);
          apps.push({ bundleId, displayName, path: appPath });
        }
        // 按 displayName 排序，UI 友好
        apps.sort((a, b) => a.displayName.localeCompare(b.displayName));
        resolve(apps);
      } catch (err) {
        console.warn('[computer-use] system_profiler json parse failed:', err);
        resolve([]);
      }
    });
  });
}

/**
 * 仅返回 grants.json 里的 authorizedApps + grantFlags（不含 status / perms）。
 */
export async function getAuthorizedApps(): Promise<GrantsFile> {
  return readGrantsFile();
}

/**
 * 写 grants.json — 必要时自动 mkdir ~/.pandacc/computer-use/。
 *
 * - authorizedApps: 完整列表（覆盖式写入；UI 负责增删后整体提交）
 * - grantFlags: 可选；缺省时用默认 true/true/true
 *
 * 触发首次创建目录的入口：UI "初始化授权目录" 按钮调用 setAuthorizedApps([], undefined)
 * 即可创建 ~/.pandacc/computer-use/grants.json (authorizedApps:[], grantFlags:default)。
 */
export async function setAuthorizedApps(input: {
  authorizedApps: AuthorizedApp[];
  grantFlags?: Partial<ComputerUseGrantFlags>;
}): Promise<{ ok: true }> {
  if (!Array.isArray(input?.authorizedApps)) {
    throw new Error('setAuthorizedApps: authorizedApps must be an array');
  }
  const dir = COMPUTER_USE_DIR();
  await fs.mkdir(dir, { recursive: true });

  // 校验 + 标准化 — bundleId / displayName 必填，authorizedAt 缺则填 now
  const normalized: AuthorizedApp[] = input.authorizedApps
    .filter((a) =>
      !!a && typeof a.bundleId === 'string' && a.bundleId.length > 0 &&
      typeof a.displayName === 'string' && a.displayName.length > 0,
    )
    .map((a) => ({
      bundleId: a.bundleId,
      displayName: a.displayName,
      authorizedAt: typeof a.authorizedAt === 'string' && a.authorizedAt
        ? a.authorizedAt
        : new Date().toISOString(),
    }));

  // 合并 grantFlags（UI 仅传被改字段时不丢失其它值）
  const existing = await readGrantsFile();
  const grantFlags: ComputerUseGrantFlags = {
    clipboardRead: input.grantFlags?.clipboardRead ?? existing.grantFlags.clipboardRead,
    clipboardWrite: input.grantFlags?.clipboardWrite ?? existing.grantFlags.clipboardWrite,
    systemKeyCombos: input.grantFlags?.systemKeyCombos ?? existing.grantFlags.systemKeyCombos,
  };

  const out: GrantsFile = { authorizedApps: normalized, grantFlags };
  await fs.writeFile(GRANTS_FILE(), JSON.stringify(out, null, 2) + '\n', 'utf8');
  return { ok: true };
}

/**
 * 跳 macOS 系统设置 → 隐私&安全性 → 辅助功能 / 屏幕录制。
 *
 * 用 x-apple.systempreferences URL scheme — macOS 13+ 通用。
 */
export async function openSystemPrivacySettings(pane: 'accessibility' | 'screen-recording'): Promise<{ ok: true }> {
  if (process.platform !== 'darwin') {
    throw new Error('open-settings only supported on macOS');
  }
  const PANE_MAP = {
    accessibility: 'Privacy_Accessibility',
    'screen-recording': 'Privacy_ScreenCapture',
  } as const;
  const target = PANE_MAP[pane];
  if (!target) throw new Error(`unknown pane: ${pane}`);
  const url = `x-apple.systempreferences:com.apple.preference.security?${target}`;
  await shell.openExternal(url);
  return { ok: true };
}
