import axios from 'axios'
import { constants as fsConstants, createWriteStream } from 'fs'
import { access, mkdtemp, unlink, writeFile } from 'fs/promises'
import { homedir, tmpdir } from 'os'
import { join } from 'path'
import { pipeline } from 'stream/promises'
import { getDynamicConfig_BLOCKS_ON_INIT } from 'src/services/analytics/growthbook.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
import { type ReleaseChannel, saveGlobalConfig } from './config.js'
import { logForDebugging } from './debug.js'
import { env } from './env.js'
import { getClaudeConfigHomeDir } from './envUtils.js'
import { ClaudeError, getErrnoCode, isENOENT } from './errors.js'
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'
import { getFsImplementation } from './fsOperations.js'
import { gracefulShutdownSync } from './gracefulShutdown.js'
import { getUserAgent } from './http.js'
import { logError } from './log.js'
import { gt, gte, lt } from './semver.js'
import { getInitialSettings } from './settings/settings.js'
import {
  filterClaudeAliases,
  getShellConfigPaths,
  readFileLines,
  writeFileLines,
} from './shellConfig.js'
import { jsonParse } from './slowOperations.js'

const GCS_BUCKET_URL =
  'https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases'

/** GitHub Packages npm registry (scoped @lc2panda) */
const GH_PACKAGES_REGISTRY = 'https://npm.pkg.github.com'
/** Public releases repo — aligned with install.sh REPO */
const GH_RELEASE_REPO = 'lc2panda/panda'
const NPM_VIEW_TIMEOUT_MS = 12_000
const GH_API_TIMEOUT_MS = 12_000
const NPM_INSTALL_TIMEOUT_MS = 120_000
const TARBALL_DOWNLOAD_TIMEOUT_MS = 120_000

export type LatestVersionInfo = {
  version: string
  source: 'npm' | 'github-release' | 'both'
  tarballUrl?: string
  npmAvailable: boolean
}

export type InstallGlobalPackageOptions = {
  tarballUrl?: string
  preferTarball?: boolean
}

/**
 * Install decision after applying maxVersion kill-switch.
 * All install paths (UI AutoUpdater, CLI `panda update`, installGlobalPackage)
 * must use this so tarballUrl/preferTarball never point past the cap.
 */
export type InstallTargetDecision = {
  /** Version to install / compare against (already capped if needed) */
  version: string
  /** Use GH tarball first — only when tarball matches the capped target */
  preferTarball: boolean
  /** Tarball URL safe for this target; undefined when capped or unavailable */
  tarballUrl?: string
  /** True when maxVersion reduced the remote latest */
  cappedByMaxVersion: boolean
  /** True when current is already at/above max while remote is higher — do not upgrade */
  skipUpdate: boolean
}

type GitHubReleaseAsset = {
  name?: string
  browser_download_url?: string
}

type GitHubRelease = {
  tag_name?: string
  prerelease?: boolean
  assets?: GitHubReleaseAsset[]
}

class AutoUpdaterError extends ClaudeError {}

export type InstallStatus =
  | 'success'
  | 'no_permissions'
  | 'install_failed'
  | 'in_progress'

export type AutoUpdaterResult = {
  version: string | null
  status: InstallStatus
  notifications?: string[]
}

export type MaxVersionConfig = {
  external?: string
  ant?: string
  external_message?: string
  ant_message?: string
}

/**
 * Checks if the current version meets the minimum required version from Statsig config
 * Terminates the process with an error message if the version is too old
 *
 * NOTE ON SHA-BASED VERSIONING:
 * We use SemVer-compliant versioning with build metadata format (X.X.X+SHA) for continuous deployment.
 * According to SemVer specs, build metadata (the +SHA part) is ignored when comparing versions.
 *
 * Versioning approach:
 * 1. For version requirements/compatibility (assertMinVersion), we use semver comparison that ignores build metadata
 * 2. For updates ('claude update'), we use exact string comparison to detect any change, including SHA
 *    - This ensures users always get the latest build, even when only the SHA changes
 *    - The UI clearly shows both versions including build metadata
 *
 * This approach keeps version comparison logic simple while maintaining traceability via the SHA.
 */
export async function assertMinVersion(): Promise<void> {
  if (process.env.PANDA_SKIP_UPDATE_CHECK === '1') {
    return
  }
  if (process.env.NODE_ENV === 'test') {
    return
  }

  try {
    const versionConfig = await getDynamicConfig_BLOCKS_ON_INIT<{
      minVersion: string
    }>('tengu_version_config', { minVersion: '0.0.0' })

    if (
      versionConfig.minVersion &&
      lt(MACRO.VERSION, versionConfig.minVersion)
    ) {
      console.error(`
It looks like your version of Panda (${MACRO.VERSION}) needs an update.
A newer version (${versionConfig.minVersion} or higher) is required to continue.

To update, please run:
    claude update

This will ensure you have access to the latest features and improvements.
`)
      gracefulShutdownSync(1)
    }
  } catch (error) {
    logError(error as Error)
  }
}

/**
 * Returns the maximum allowed version for the current user type.
 * For ants, returns the `ant` field (dev version format).
 * For external users, returns the `external` field (clean semver).
 * This is used as a server-side kill switch to pause auto-updates during incidents.
 * Returns undefined if no cap is configured.
 */
export async function getMaxVersion(): Promise<string | undefined> {
  const config = await getMaxVersionConfig()
  if (process.env.USER_TYPE === 'ant') {
    return config.ant || undefined
  }
  return config.external || undefined
}

/**
 * Returns the server-driven message explaining the known issue, if configured.
 * Shown in the warning banner when the current version exceeds the max allowed version.
 */
export async function getMaxVersionMessage(): Promise<string | undefined> {
  const config = await getMaxVersionConfig()
  if (process.env.USER_TYPE === 'ant') {
    return config.ant_message || undefined
  }
  return config.external_message || undefined
}

async function getMaxVersionConfig(): Promise<MaxVersionConfig> {
  try {
    return await getDynamicConfig_BLOCKS_ON_INIT<MaxVersionConfig>(
      'tengu_max_version_config',
      {},
    )
  } catch (error) {
    logError(error as Error)
    return {}
  }
}

/**
 * Checks if a target version should be skipped due to user's minimumVersion setting.
 * This is used when switching to stable channel - the user can choose to stay on their
 * current version until stable catches up, preventing downgrades.
 */
export function shouldSkipVersion(targetVersion: string): boolean {
  const settings = getInitialSettings()
  const minimumVersion = settings?.minimumVersion
  if (!minimumVersion) {
    return false
  }
  // Skip if target version is less than minimum
  const shouldSkip = !gte(targetVersion, minimumVersion)
  if (shouldSkip) {
    logForDebugging(
      `Skipping update to ${targetVersion} - below minimumVersion ${minimumVersion}`,
    )
  }
  return shouldSkip
}

// Lock file for auto-updater to prevent concurrent updates
const LOCK_TIMEOUT_MS = 5 * 60 * 1000 // 5 minute timeout for locks

/**
 * Get the path to the lock file
 * This is a function to ensure it's evaluated at runtime after test setup
 */
export function getLockFilePath(): string {
  return join(getClaudeConfigHomeDir(), '.update.lock')
}

/**
 * Attempts to acquire a lock for auto-updater
 * @returns true if lock was acquired, false if another process holds the lock
 */
async function acquireLock(): Promise<boolean> {
  const fs = getFsImplementation()
  const lockPath = getLockFilePath()

  // Check for existing lock: 1 stat() on the happy path (fresh lock or ENOENT),
  // 2 on stale-lock recovery (re-verify staleness immediately before unlink).
  try {
    const stats = await fs.stat(lockPath)
    const age = Date.now() - stats.mtimeMs
    if (age < LOCK_TIMEOUT_MS) {
      return false
    }
    // Lock is stale, remove it before taking over. Re-verify staleness
    // immediately before unlinking to close a TOCTOU race: if two processes
    // both observe the stale lock, A unlinks + writes a fresh lock, then B
    // would unlink A's fresh lock and both believe they hold it. A fresh
    // lock has a recent mtime, so re-checking staleness makes B back off.
    try {
      const recheck = await fs.stat(lockPath)
      if (Date.now() - recheck.mtimeMs < LOCK_TIMEOUT_MS) {
        return false
      }
      await fs.unlink(lockPath)
    } catch (err) {
      if (!isENOENT(err)) {
        logError(err as Error)
        return false
      }
    }
  } catch (err) {
    if (!isENOENT(err)) {
      logError(err as Error)
      return false
    }
    // ENOENT: no lock file, proceed to create one
  }

  // Create lock file atomically with O_EXCL (flag: 'wx'). If another process
  // wins the race and creates it first, we get EEXIST and back off.
  // Lazy-mkdir the config dir on ENOENT.
  try {
    await writeFile(lockPath, `${process.pid}`, {
      encoding: 'utf8',
      flag: 'wx',
    })
    return true
  } catch (err) {
    const code = getErrnoCode(err)
    if (code === 'EEXIST') {
      return false
    }
    if (code === 'ENOENT') {
      try {
        // fs.mkdir from getFsImplementation() is always recursive:true and
        // swallows EEXIST internally, so a dir-creation race cannot reach the
        // catch below — only writeFile's EEXIST (true lock contention) can.
        await fs.mkdir(getClaudeConfigHomeDir())
        await writeFile(lockPath, `${process.pid}`, {
          encoding: 'utf8',
          flag: 'wx',
        })
        return true
      } catch (mkdirErr) {
        if (getErrnoCode(mkdirErr) === 'EEXIST') {
          return false
        }
        logError(mkdirErr as Error)
        return false
      }
    }
    logError(err as Error)
    return false
  }
}

/**
 * Releases the update lock if it's held by this process
 */
async function releaseLock(): Promise<void> {
  const fs = getFsImplementation()
  const lockPath = getLockFilePath()
  try {
    const lockData = await fs.readFile(lockPath, { encoding: 'utf8' })
    if (lockData === `${process.pid}`) {
      await fs.unlink(lockPath)
    }
  } catch (err) {
    if (isENOENT(err)) {
      return
    }
    logError(err as Error)
  }
}

async function getInstallationPrefix(): Promise<string | null> {
  // Run from home directory to avoid reading project-level .npmrc/.bunfig.toml
  const isBun = env.isRunningWithBun()
  let prefixResult = null
  if (isBun) {
    prefixResult = await execFileNoThrowWithCwd('bun', ['pm', 'bin', '-g'], {
      cwd: homedir(),
    })
  } else {
    prefixResult = await execFileNoThrowWithCwd(
      'npm',
      ['-g', 'config', 'get', 'prefix'],
      { cwd: homedir() },
    )
  }
  if (prefixResult.code !== 0) {
    logError(new Error(`Failed to check ${isBun ? 'bun' : 'npm'} permissions`))
    return null
  }
  return prefixResult.stdout.trim()
}

export async function checkGlobalInstallPermissions(): Promise<{
  hasPermissions: boolean
  npmPrefix: string | null
}> {
  try {
    const prefix = await getInstallationPrefix()
    if (!prefix) {
      return { hasPermissions: false, npmPrefix: null }
    }

    try {
      await access(prefix, fsConstants.W_OK)
      return { hasPermissions: true, npmPrefix: prefix }
    } catch {
      logError(
        new AutoUpdaterError(
          'Insufficient permissions for global npm install.',
        ),
      )
      return { hasPermissions: false, npmPrefix: prefix }
    }
  } catch (error) {
    logError(error as Error)
    return { hasPermissions: false, npmPrefix: null }
  }
}

function normalizeVersion(version: string | null | undefined): string | null {
  if (!version) {
    return null
  }
  const trimmed = version.trim()
  if (!trimmed) {
    return null
  }
  return trimmed.startsWith('v') ? trimmed.slice(1) : trimmed
}

/**
 * Parse a package version embedded in a GitHub release tarball URL / asset name.
 * Examples:
 *   .../lc2panda-panda-code-2.32.3.tgz
 *   .../panda-code-2.32.3.tgz?X-Amz-...
 */
export function versionFromTarballUrl(tarballUrl: string): string | null {
  try {
    const pathPart = tarballUrl.split('?')[0] ?? tarballUrl
    const fileName = decodeURIComponent(pathPart.split('/').pop() ?? '')
    const match = fileName.match(
      /(?:^|[-_])v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.]+)?)\.tgz$/i,
    )
    return match?.[1] ?? null
  } catch {
    return null
  }
}

/**
 * Single source of truth for maxVersion kill-switch + tarball install decisions.
 *
 * When remote latest > maxVersion:
 * - Cap install version to maxVersion
 * - Drop tarballUrl / preferTarball (tarball always tracks uncapped GH latest)
 * - Caller must install via npm @maxVersion or skip — never a higher tarball
 *
 * When current >= maxVersion while remote is higher: skipUpdate=true.
 */
export function resolveInstallTarget(
  latestInfo: LatestVersionInfo,
  maxVersion: string | undefined,
  currentVersion: string,
): InstallTargetDecision {
  let version = latestInfo.version
  let cappedByMaxVersion = false

  if (maxVersion && gt(version, maxVersion)) {
    if (gte(currentVersion, maxVersion)) {
      logForDebugging(
        `resolveInstallTarget: current ${currentVersion} >= maxVersion ${maxVersion}, skip (remote ${version})`,
      )
      return {
        version,
        preferTarball: false,
        tarballUrl: undefined,
        cappedByMaxVersion: true,
        skipUpdate: true,
      }
    }
    logForDebugging(
      `resolveInstallTarget: cap ${version} → ${maxVersion}; stripping tarball (would exceed kill-switch)`,
    )
    version = maxVersion
    cappedByMaxVersion = true
  }

  // Tarball assets are for the remote GH version. After a maxVersion cap they
  // point at a forbidden higher build — never prefer or fall back to them.
  const tarballUrl =
    !cappedByMaxVersion && latestInfo.tarballUrl
      ? latestInfo.tarballUrl
      : undefined

  // Prefer tarball only when it is the intended install artifact for `version`
  // (GH is ahead / npm missing) and we did not cap below that artifact.
  const preferTarball =
    !!tarballUrl &&
    (latestInfo.source === 'github-release' || !latestInfo.npmAvailable)

  return {
    version,
    preferTarball,
    tarballUrl,
    cappedByMaxVersion,
    skipUpdate: false,
  }
}

/**
 * Defense-in-depth: refuse a tarball whose embedded version exceeds either the
 * caller-requested specificVersion or the server maxVersion kill-switch.
 * Unparseable URLs are refused when any cap is active (fail closed).
 */
export function isTarballAllowedForInstall(
  tarballUrl: string,
  specificVersion?: string | null,
  maxVersion?: string | null,
): boolean {
  const tarballVersion = versionFromTarballUrl(tarballUrl)
  const caps = [specificVersion, maxVersion].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  )

  if (!tarballVersion) {
    if (caps.length > 0) {
      logForDebugging(
        `isTarballAllowedForInstall: cannot parse version from ${tarballUrl} while cap(s) active — reject`,
      )
      return false
    }
    return true
  }

  for (const cap of caps) {
    if (gt(tarballVersion, cap)) {
      logForDebugging(
        `isTarballAllowedForInstall: tarball ${tarballVersion} > cap ${cap} — reject`,
      )
      return false
    }
  }
  return true
}

function pickTarballAsset(
  assets: GitHubReleaseAsset[] | undefined,
  version: string,
): string | null {
  if (!assets?.length) {
    return null
  }
  // Prefer exact asset name used by install.sh comments, then any panda-code .tgz
  const exact = assets.find(
    a => a.name === `lc2panda-panda-code-${version}.tgz` && a.browser_download_url,
  )
  if (exact?.browser_download_url) {
    return exact.browser_download_url
  }
  const match = assets.find(
    a =>
      typeof a.name === 'string' &&
      a.name.includes('panda-code') &&
      a.name.endsWith('.tgz') &&
      a.browser_download_url,
  )
  if (match?.browser_download_url) {
    return match.browser_download_url
  }
  const anyTgz = assets.find(
    a =>
      typeof a.name === 'string' &&
      a.name.endsWith('.tgz') &&
      a.browser_download_url,
  )
  return anyTgz?.browser_download_url ?? null
}

function githubAuthHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': getUserAgent(),
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/**
 * Resolve latest package version from GitHub Releases (not Packages metadata).
 * Aligns with install.sh GH release → .tgz flow.
 */
export async function getLatestVersionFromGitHub(
  channel: ReleaseChannel,
): Promise<{ version: string; tarballUrl: string } | null> {
  try {
    const headers = githubAuthHeaders()
    let release: GitHubRelease | null = null

    if (channel === 'stable') {
      // Prefer non-prerelease; latest endpoint already excludes drafts/prereleases
      // but stable channel also scans recent list as a safety net.
      const list = await axios.get<GitHubRelease[]>(
        `https://api.github.com/repos/${GH_RELEASE_REPO}/releases`,
        {
          timeout: GH_API_TIMEOUT_MS,
          headers,
          params: { per_page: 10 },
          validateStatus: s => s >= 200 && s < 300,
        },
      )
      release =
        list.data.find(r => r && r.prerelease !== true && r.tag_name) ?? null
    } else {
      const response = await axios.get<GitHubRelease>(
        `https://api.github.com/repos/${GH_RELEASE_REPO}/releases/latest`,
        {
          timeout: GH_API_TIMEOUT_MS,
          headers,
          validateStatus: s => s >= 200 && s < 300,
        },
      )
      release = response.data
    }

    if (!release?.tag_name) {
      logForDebugging('GitHub releases: missing tag_name')
      return null
    }

    const version = normalizeVersion(release.tag_name)
    if (!version) {
      return null
    }
    const tarballUrl = pickTarballAsset(release.assets, version)
    if (!tarballUrl) {
      logForDebugging(
        `GitHub releases: no .tgz asset for ${GH_RELEASE_REPO} ${version}`,
      )
      return null
    }
    logForDebugging(
      `GitHub releases: latest=${version} tarball=${tarballUrl} channel=${channel}`,
    )
    return { version, tarballUrl }
  } catch (error) {
    logForDebugging(`GitHub releases lookup failed: ${error}`)
    return null
  }
}

/**
 * npm view against GitHub Packages with short fetch/process timeouts.
 * Avoids hanging on full metadata over slow proxies.
 */
export async function getLatestVersionFromNpm(
  channel: ReleaseChannel,
): Promise<string | null> {
  const npmTag = channel === 'stable' ? 'stable' : 'latest'
  // Run from home directory to avoid reading project-level .npmrc
  // which could be maliciously crafted to redirect to an attacker's registry
  const result = await execFileNoThrowWithCwd(
    'npm',
    [
      'view',
      `${MACRO.PACKAGE_URL}@${npmTag}`,
      'version',
      '--prefer-online',
      `--registry=${GH_PACKAGES_REGISTRY}`,
      '--fetch-timeout=8000',
      '--fetch-retries=0',
    ],
    { abortSignal: AbortSignal.timeout(NPM_VIEW_TIMEOUT_MS), cwd: homedir() },
  )
  if (result.code !== 0) {
    logForDebugging(`npm view failed with code ${result.code}`)
    if (result.stderr) {
      logForDebugging(`npm stderr: ${result.stderr.trim()}`)
    } else {
      logForDebugging('npm stderr: (empty)')
    }
    if (result.stdout) {
      logForDebugging(`npm stdout: ${result.stdout.trim()}`)
    }
    return null
  }
  return normalizeVersion(result.stdout)
}

/**
 * Parallel npm + GitHub Release lookup; returns the higher semver and install hints.
 */
export async function getLatestVersionInfo(
  channel: ReleaseChannel,
): Promise<LatestVersionInfo | null> {
  const [npmResult, ghResult] = await Promise.allSettled([
    getLatestVersionFromNpm(channel),
    getLatestVersionFromGitHub(channel),
  ])

  const npmVersion =
    npmResult.status === 'fulfilled' ? npmResult.value : null
  if (npmResult.status === 'rejected') {
    logForDebugging(`npm version lookup rejected: ${npmResult.reason}`)
  }

  const ghInfo =
    ghResult.status === 'fulfilled' ? ghResult.value : null
  if (ghResult.status === 'rejected') {
    logForDebugging(`GitHub version lookup rejected: ${ghResult.reason}`)
  }

  const ghVersion = ghInfo?.version ?? null
  const tarballUrl = ghInfo?.tarballUrl

  if (!npmVersion && !ghVersion) {
    return null
  }
  if (npmVersion && !ghVersion) {
    return {
      version: npmVersion,
      source: 'npm',
      npmAvailable: true,
    }
  }
  if (!npmVersion && ghVersion) {
    return {
      version: ghVersion,
      source: 'github-release',
      tarballUrl: tarballUrl,
      npmAvailable: false,
    }
  }

  // both present
  if (npmVersion === ghVersion) {
    return {
      version: npmVersion!,
      source: 'both',
      tarballUrl: tarballUrl,
      npmAvailable: true,
    }
  }
  if (gt(ghVersion!, npmVersion!)) {
    return {
      version: ghVersion!,
      source: 'github-release',
      tarballUrl: tarballUrl,
      npmAvailable: true,
    }
  }
  return {
    version: npmVersion!,
    source: 'npm',
    tarballUrl: tarballUrl,
    npmAvailable: true,
  }
}

/**
 * Compatible wrapper: dual-source version string (npm + GitHub Releases).
 */
export async function getLatestVersion(
  channel: ReleaseChannel,
): Promise<string | null> {
  const info = await getLatestVersionInfo(channel)
  return info?.version ?? null
}

/**
 * Download a release tarball from GitHub Releases to a temp file.
 * Returns the local path on success, null on failure.
 * Exported for local install path (H-006) — same dual-source artifact as global.
 */
export async function downloadReleaseTarball(
  tarballUrl: string,
): Promise<string | null> {
  const dir = await mkdtemp(join(tmpdir(), 'panda-update-'))
  const filePath = join(dir, 'package.tgz')
  try {
    const headers = githubAuthHeaders()
    // Prefer axios stream to match rest of autoUpdater HTTP usage
    const response = await axios.get(tarballUrl, {
      timeout: TARBALL_DOWNLOAD_TIMEOUT_MS,
      responseType: 'stream',
      headers,
      maxRedirects: 5,
      validateStatus: s => s >= 200 && s < 300,
    })
    await pipeline(response.data, createWriteStream(filePath))
    return filePath
  } catch (error) {
    logForDebugging(`tarball download failed: ${error}`)
    try {
      await unlink(filePath)
    } catch {
      // ignore cleanup errors
    }
    return null
  }
}

async function installFromTarball(tarballPath: string): Promise<boolean> {
  const packageManager = env.isRunningWithBun() ? 'bun' : 'npm'
  const installResult = await execFileNoThrowWithCwd(
    packageManager,
    ['install', '-g', tarballPath],
    {
      cwd: homedir(),
      abortSignal: AbortSignal.timeout(NPM_INSTALL_TIMEOUT_MS),
    },
  )
  if (installResult.code !== 0) {
    logForDebugging(
      `tarball install failed: ${installResult.stdout} ${installResult.stderr}`,
    )
    return false
  }
  return true
}

async function installFromNpmRegistry(
  packageSpec: string,
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const packageManager = env.isRunningWithBun() ? 'bun' : 'npm'
  const args =
    packageManager === 'npm'
      ? [
          'install',
          '-g',
          packageSpec,
          `--registry=${GH_PACKAGES_REGISTRY}`,
          '--fetch-timeout=8000',
          '--fetch-retries=1',
        ]
      : ['install', '-g', packageSpec]
  const installResult = await execFileNoThrowWithCwd(packageManager, args, {
    cwd: homedir(),
    abortSignal: AbortSignal.timeout(NPM_INSTALL_TIMEOUT_MS),
  })
  return {
    ok: installResult.code === 0,
    stdout: installResult.stdout,
    stderr: installResult.stderr,
  }
}

export type NpmDistTags = {
  latest: string | null
  stable: string | null
}

/**
 * Get npm dist-tags (latest and stable versions) from the registry.
 * This is used by the doctor command to show users what versions are available.
 */
export async function getNpmDistTags(): Promise<NpmDistTags> {
  // Run from home directory to avoid reading project-level .npmrc
  const result = await execFileNoThrowWithCwd(
    'npm',
    [
      'view',
      MACRO.PACKAGE_URL,
      'dist-tags',
      '--json',
      '--prefer-online',
      `--registry=${GH_PACKAGES_REGISTRY}`,
      '--fetch-timeout=8000',
      '--fetch-retries=0',
    ],
    { abortSignal: AbortSignal.timeout(NPM_VIEW_TIMEOUT_MS), cwd: homedir() },
  )

  if (result.code !== 0) {
    logForDebugging(`npm view dist-tags failed with code ${result.code}`)
    return { latest: null, stable: null }
  }

  try {
    const parsed = jsonParse(result.stdout.trim()) as Record<string, unknown>
    return {
      latest: typeof parsed.latest === 'string' ? parsed.latest : null,
      stable: typeof parsed.stable === 'string' ? parsed.stable : null,
    }
  } catch (error) {
    logForDebugging(`Failed to parse dist-tags: ${error}`)
    return { latest: null, stable: null }
  }
}

/**
 * Get the latest version from GCS bucket for a given release channel.
 * This is used by installations that don't have npm (e.g. package manager installs).
 */
export async function getLatestVersionFromGcs(
  channel: ReleaseChannel,
): Promise<string | null> {
  try {
    const response = await axios.get(`${GCS_BUCKET_URL}/${channel}`, {
      timeout: 5000,
      responseType: 'text',
    })
    return response.data.trim()
  } catch (error) {
    logForDebugging(`Failed to fetch ${channel} from GCS: ${error}`)
    return null
  }
}

/**
 * Get available versions from GCS bucket (for native installations).
 * Fetches both latest and stable channel pointers.
 */
export async function getGcsDistTags(): Promise<NpmDistTags> {
  const [latest, stable] = await Promise.all([
    getLatestVersionFromGcs('latest'),
    getLatestVersionFromGcs('stable'),
  ])

  return { latest, stable }
}

/**
 * Get version history from npm registry (ant-only feature)
 * Returns versions sorted newest-first, limited to the specified count
 *
 * Uses NATIVE_PACKAGE_URL when available because:
 * 1. Native installation is the primary installation method for ant users
 * 2. Not all JS package versions have corresponding native packages
 * 3. This prevents rollback from listing versions that don't have native binaries
 */
export async function getVersionHistory(limit: number): Promise<string[]> {
  if (process.env.USER_TYPE !== 'ant') {
    return []
  }

  // Use native package URL when available to ensure we only show versions
  // that have native binaries (not all JS package versions have native builds)
  const packageUrl = MACRO.NATIVE_PACKAGE_URL ?? MACRO.PACKAGE_URL

  // Run from home directory to avoid reading project-level .npmrc
  const result = await execFileNoThrowWithCwd(
    'npm',
    ['view', packageUrl, 'versions', '--json', '--prefer-online'],
    // Longer timeout for version list
    { abortSignal: AbortSignal.timeout(30000), cwd: homedir() },
  )

  if (result.code !== 0) {
    logForDebugging(`npm view versions failed with code ${result.code}`)
    if (result.stderr) {
      logForDebugging(`npm stderr: ${result.stderr.trim()}`)
    }
    return []
  }

  try {
    const versions = jsonParse(result.stdout.trim()) as string[]
    // Take last N versions, then reverse to get newest first
    return versions.slice(-limit).reverse()
  } catch (error) {
    logForDebugging(`Failed to parse version history: ${error}`)
    return []
  }
}

export async function installGlobalPackage(
  specificVersion?: string | null,
  options?: InstallGlobalPackageOptions,
): Promise<InstallStatus> {
  if (!(await acquireLock())) {
    logError(
      new AutoUpdaterError('Another process is currently installing an update'),
    )
    // Log the lock contention
    logEvent('tengu_auto_updater_lock_contention', {
      pid: process.pid,
      currentVersion:
        MACRO.VERSION as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    return 'in_progress'
  }

  let tarballPath: string | null = null
  try {
    await removeClaudeAliasesFromShellConfigs()
    // Check if we're using npm from Windows path in WSL
    if (!env.isRunningWithBun() && env.isNpmFromWindowsPath()) {
      logError(new Error('Windows NPM detected in WSL environment'))
      logEvent('tengu_auto_updater_windows_npm_in_wsl', {
        currentVersion:
          MACRO.VERSION as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      console.error(`
Error: Windows NPM detected in WSL

You're running Panda in WSL but using the Windows NPM installation from /mnt/c/.
This configuration is not supported for updates.

To fix this issue:
  1. Install Node.js within your Linux distribution: e.g. sudo apt install nodejs npm
  2. Make sure Linux NPM is in your PATH before the Windows version
  3. Try updating again with 'panda update'
`)
      return 'install_failed'
    }

    const { hasPermissions } = await checkGlobalInstallPermissions()
    if (!hasPermissions) {
      return 'no_permissions'
    }

    const rawTarballUrl = options?.tarballUrl
    // Kill-switch: never install a tarball past specificVersion (caller cap)
    // or server maxVersion, even if preferTarball was set incorrectly.
    const maxVersion = await getMaxVersion()
    const tarballUrl =
      rawTarballUrl &&
      isTarballAllowedForInstall(rawTarballUrl, specificVersion, maxVersion)
        ? rawTarballUrl
        : undefined
    if (rawTarballUrl && !tarballUrl) {
      logForDebugging(
        `installGlobalPackage: dropped tarball (exceeds maxVersion/specificVersion): ${rawTarballUrl}`,
      )
    }
    const preferTarball = options?.preferTarball === true && !!tarballUrl

    // Prefer GitHub Release tarball when npm is stale/unavailable
    if (preferTarball && tarballUrl) {
      logForDebugging(`installGlobalPackage: prefer tarball ${tarballUrl}`)
      tarballPath = await downloadReleaseTarball(tarballUrl)
      if (tarballPath && (await installFromTarball(tarballPath))) {
        saveGlobalConfig(current => ({
          ...current,
          installMethod: 'global',
        }))
        return 'success'
      }
      logForDebugging(
        'installGlobalPackage: tarball install failed; trying npm if version known',
      )
    }

    // Use specific version if provided, otherwise use latest from Packages.
    // When maxVersion kill-switch is set, never install above it — even if the
    // caller forgot to pass specificVersion or passed a higher value.
    let installVersion = specificVersion || null
    if (maxVersion) {
      if (!installVersion || gt(installVersion, maxVersion)) {
        logForDebugging(
          `installGlobalPackage: applying maxVersion ${maxVersion} (requested ${installVersion ?? 'latest'})`,
        )
        installVersion = maxVersion
      }
    }
    const packageSpec = installVersion
      ? `${MACRO.PACKAGE_URL}@${installVersion}`
      : MACRO.PACKAGE_URL

    // Run from home directory to avoid reading project-level .npmrc/.bunfig.toml
    // which could be maliciously crafted to redirect to an attacker's registry
    const npmInstall = await installFromNpmRegistry(packageSpec)
    if (npmInstall.ok) {
      saveGlobalConfig(current => ({
        ...current,
        installMethod: 'global',
      }))
      return 'success'
    }

    // Fallback: download GH Release tgz when npm install fails and tarball available
    // (already filtered against maxVersion / specificVersion above)
    if (tarballUrl) {
      logForDebugging(
        `installGlobalPackage: npm failed, fallback tarball ${tarballUrl}`,
      )
      if (!tarballPath) {
        tarballPath = await downloadReleaseTarball(tarballUrl)
      }
      if (tarballPath && (await installFromTarball(tarballPath))) {
        saveGlobalConfig(current => ({
          ...current,
          installMethod: 'global',
        }))
        return 'success'
      }
    }

    const error = new AutoUpdaterError(
      `Failed to install new version of panda: ${npmInstall.stdout} ${npmInstall.stderr}`,
    )
    logError(error)
    return 'install_failed'
  } finally {
    if (tarballPath) {
      try {
        await unlink(tarballPath)
      } catch {
        // ignore cleanup errors
      }
    }
    // Ensure we always release the lock
    await releaseLock()
  }
}

/**
 * Remove claude aliases from shell configuration files
 * This helps clean up old installation methods when switching to native or npm global
 */
async function removeClaudeAliasesFromShellConfigs(): Promise<void> {
  const configMap = getShellConfigPaths()

  // Process each shell config file
  for (const [, configFile] of Object.entries(configMap)) {
    try {
      const lines = await readFileLines(configFile)
      if (!lines) continue

      const { filtered, hadAlias } = filterClaudeAliases(lines)

      if (hadAlias) {
        await writeFileLines(configFile, filtered)
        logForDebugging(`Removed claude alias from ${configFile}`)
      }
    } catch (error) {
      // Don't fail the whole operation if one file can't be processed
      logForDebugging(`Failed to remove alias from ${configFile}: ${error}`, {
        level: 'error',
      })
    }
  }
}
