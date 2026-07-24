import axios from 'axios'
import { createHash } from 'crypto'
import { constants as fsConstants, createWriteStream } from 'fs'
import { access, mkdtemp, unlink, writeFile } from 'fs/promises'
import { homedir, tmpdir } from 'os'
import { join } from 'path'
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
  /** Lowercase hex sha256 of the tarball when GH provides digest/sidecar (H-012) */
  tarballSha256?: string
  npmAvailable: boolean
}

export type InstallGlobalPackageOptions = {
  tarballUrl?: string
  tarballSha256?: string
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
  /** Integrity digest paired with tarballUrl (stripped together under maxVersion) */
  tarballSha256?: string
  /** True when maxVersion reduced the remote latest */
  cappedByMaxVersion: boolean
  /** True when current is already at/above max while remote is higher — do not upgrade */
  skipUpdate: boolean
}

/** Hard cap for GH release tarball downloads (H-012). Do not raise. */
export const MAX_TARBALL_BYTES = 20 * 1024 * 1024

/** npm package tarball asset name prefix used by GH Releases */
export const GH_PACKAGE_TARBALL_PREFIX = 'lc2panda-panda-code'

const ALLOWED_TARBALL_CONTENT_TYPES = new Set([
  'application/gzip',
  'application/x-gzip',
  'application/x-gtar',
  'application/x-tar',
  'application/tar+gzip',
  'application/octet-stream',
  // Some CDNs omit subtype specifics
  'binary/octet-stream',
])

export type GitHubReleaseAsset = {
  name?: string
  browser_download_url?: string
  size?: number
  content_type?: string
  /** GitHub API digest field, e.g. "sha256:abcd..." */
  digest?: string
}

export type GitHubRelease = {
  tag_name?: string
  prerelease?: boolean
  draft?: boolean
  assets?: GitHubReleaseAsset[]
}

export type PickedTarballAsset = {
  url: string
  name: string
  size?: number
  contentType?: string
  sha256?: string
  /** true when name was exact lc2panda-panda-code-${version}.tgz */
  exactMatch: boolean
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
        tarballSha256: undefined,
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
  // Integrity digest is stripped together with the URL (H-001 + H-012).
  const tarballUrl =
    !cappedByMaxVersion && latestInfo.tarballUrl
      ? latestInfo.tarballUrl
      : undefined
  const tarballSha256 =
    tarballUrl && latestInfo.tarballSha256
      ? latestInfo.tarballSha256
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
    tarballSha256,
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

/**
 * Parse GitHub asset digest field (`sha256:<hex>` or bare 64-char hex).
 */
export function parseGitHubAssetDigest(
  digest: string | undefined | null,
): string | undefined {
  if (!digest || typeof digest !== 'string') {
    return undefined
  }
  const trimmed = digest.trim()
  const m = trimmed.match(/^(?:sha-?256:)?([a-f0-9]{64})$/i)
  return m?.[1]?.toLowerCase()
}

/**
 * True when the release is eligible for the stable channel:
 * not draft/prerelease and version has no semver prerelease suffix.
 * (GH may leave beta tags with prerelease=false — still exclude them.)
 */
export function isStableChannelRelease(release: GitHubRelease): boolean {
  if (release.draft || release.prerelease) {
    return false
  }
  const version = normalizeVersion(release.tag_name ?? '')
  if (!version) {
    return false
  }
  return !version.includes('-')
}

/**
 * Select a release aligned with npm dist-tag semantics (H-011):
 * - stable → first stable (non-prerelease, no semver pre) from list
 * - latest → first non-draft (includes GH prerelease + semver pre / beta)
 *
 * Always driven by the releases list — never pin non-stable to
 * `/releases/latest`, which only surfaces GitHub's single "latest" pointer.
 */
export function selectGitHubReleaseForChannel(
  releases: GitHubRelease[],
  channel: ReleaseChannel,
): GitHubRelease | undefined {
  const candidates = releases.filter(r => !r.draft && !!r.tag_name)
  if (channel === 'stable') {
    return candidates.find(isStableChannelRelease)
  }
  // latest (and any non-stable): newest non-draft, including betas/prereleases
  return candidates[0]
}

/**
 * Whether an asset name is an acceptable CLI package tarball (H-012).
 * Requires package-name marker + optional version pin; rejects bare/random .tgz,
 * checksum sidecars, and native binary-looking assets.
 */
export function isAcceptablePackageTarballName(
  name: string,
  version?: string,
): boolean {
  const lower = name.toLowerCase()
  if (lower.endsWith('.sha256') || lower.endsWith('.sha512')) {
    return false
  }
  if (lower.includes('checksum') || lower.includes('sha256sums')) {
    return false
  }
  const isTgz = lower.endsWith('.tgz') || lower.endsWith('.tar.gz')
  if (!isTgz) {
    return false
  }

  // Native binary release assets (not the npm package tarball)
  if (
    /(?:^|[-_.])(darwin|linux|win32|windows|macos)[-_.](arm64|aarch64|x64|amd64|x86_64)/i.test(
      name,
    )
  ) {
    return false
  }

  const hasCanonical =
    lower.includes(GH_PACKAGE_TARBALL_PREFIX) ||
    lower.includes('lc2panda.panda-code')
  const hasLoosePackage =
    lower.includes('panda-code') &&
    (lower.includes('lc2panda') || lower.startsWith('panda-code-'))

  if (!hasCanonical && !hasLoosePackage) {
    return false
  }

  if (version) {
    const n = (normalizeVersion(version) ?? version).toLowerCase()
    if (!lower.includes(n)) {
      return false
    }
  }
  return true
}

/**
 * Look for a companion checksum asset digest for `tarballName` when present.
 * Only trusts the GitHub API digest field (no sidecar body download).
 */
export function findSidecarSha256(
  assets: GitHubReleaseAsset[] | undefined,
  tarballName: string,
): string | undefined {
  if (!assets?.length) {
    return undefined
  }
  const exactSidecar = assets.find(
    a =>
      a.name === `${tarballName}.sha256` ||
      a.name === `${tarballName}.sha256.txt`,
  )
  if (exactSidecar?.digest) {
    return parseGitHubAssetDigest(exactSidecar.digest)
  }
  return undefined
}

/**
 * Prefer the canonical package tarball asset; never silently accept arbitrary .tgz (H-012).
 * Asset names follow npm pack: `@scope/name` → `scope-name-version.tgz`
 * e.g. `@lc2panda/panda-code@2.32.3` → `lc2panda-panda-code-2.32.3.tgz`
 */
export function pickTarballAsset(
  assets: GitHubReleaseAsset[] | undefined,
  version: string,
): PickedTarballAsset | null {
  if (!assets?.length) {
    return null
  }

  const exactName = `${GH_PACKAGE_TARBALL_PREFIX}-${version}.tgz`
  const exact = assets.find(
    a => a.name === exactName && a.browser_download_url,
  )
  if (exact?.browser_download_url && exact.name) {
    const sha256 =
      parseGitHubAssetDigest(exact.digest) ??
      findSidecarSha256(assets, exact.name)
    return {
      url: exact.browser_download_url,
      name: exact.name,
      size: exact.size,
      contentType: exact.content_type,
      sha256,
      exactMatch: true,
    }
  }

  // Tightened fallback: package-name marker + version pin required. No bare .tgz.
  const fallback = assets.find(
    a =>
      !!a.name &&
      !!a.browser_download_url &&
      isAcceptablePackageTarballName(a.name, version),
  )
  if (fallback?.browser_download_url && fallback.name) {
    logForDebugging(
      `pickTarballAsset: exact ${exactName} missing; using tightened match ${fallback.name}`,
    )
    const sha256 =
      parseGitHubAssetDigest(fallback.digest) ??
      findSidecarSha256(assets, fallback.name)
    return {
      url: fallback.browser_download_url,
      name: fallback.name,
      size: fallback.size,
      contentType: fallback.content_type,
      sha256,
      exactMatch: false,
    }
  }

  const rejected = assets
    .filter(a => a.name?.endsWith('.tgz') || a.name?.endsWith('.tar.gz'))
    .map(a => a.name)
  if (rejected.length) {
    logForDebugging(
      `pickTarballAsset: rejected non-package tarball asset(s) for ${version}: ${rejected.join(', ')}`,
    )
  }
  return null
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
 * Resolve channel-aligned package version from GitHub Releases (H-011).
 * Always lists /releases — never pins non-stable to /releases/latest.
 * Aligns with install.sh GH release → .tgz flow and npm dist-tag semantics.
 */
export async function getLatestVersionFromGitHub(
  channel: ReleaseChannel,
): Promise<{
  version: string
  tarballUrl: string
  tarballSha256?: string
} | null> {
  try {
    const headers = githubAuthHeaders()
    // List for both channels so latest can include betas/prereleases and stable
    // can apply semver-stable filtering (H-011). Never hit /releases/latest for
    // non-stable — that endpoint only returns GitHub's single "latest" pointer.
    const list = await axios.get<GitHubRelease[]>(
      `https://api.github.com/repos/${GH_RELEASE_REPO}/releases`,
      {
        timeout: GH_API_TIMEOUT_MS,
        headers,
        params: { per_page: 30 },
        validateStatus: s => s >= 200 && s < 300,
      },
    )
    const release = selectGitHubReleaseForChannel(list.data ?? [], channel)

    if (!release?.tag_name) {
      logForDebugging(
        `GitHub releases: no release for channel=${channel}`,
      )
      return null
    }

    const version = normalizeVersion(release.tag_name)
    if (!version) {
      return null
    }
    const picked = pickTarballAsset(release.assets, version)
    if (!picked) {
      logForDebugging(
        `GitHub releases: no acceptable package .tgz for ${GH_RELEASE_REPO} ${version}`,
      )
      return null
    }
    if (picked.size !== undefined && picked.size > MAX_TARBALL_BYTES) {
      logForDebugging(
        `GitHub releases: asset ${picked.name} size ${picked.size} exceeds ${MAX_TARBALL_BYTES} cap — refuse`,
      )
      return null
    }
    if (!picked.sha256) {
      logForDebugging(
        `GitHub releases: WARNING no sha256 digest for ${picked.name}; download will proceed with name/content-type constraints only`,
      )
    }
    logForDebugging(
      `GitHub releases: latest=${version} tarball=${picked.url} channel=${channel} exact=${picked.exactMatch} sha256=${picked.sha256 ? 'yes' : 'no'}`,
    )
    return {
      version,
      tarballUrl: picked.url,
      tarballSha256: picked.sha256,
    }
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
  const tarballSha256 = ghInfo?.tarballSha256

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
      tarballUrl,
      tarballSha256,
      npmAvailable: false,
    }
  }

  // both present
  if (npmVersion === ghVersion) {
    return {
      version: npmVersion!,
      source: 'both',
      tarballUrl,
      tarballSha256,
      npmAvailable: true,
    }
  }
  if (gt(ghVersion!, npmVersion!)) {
    return {
      version: ghVersion!,
      source: 'github-release',
      tarballUrl,
      tarballSha256,
      npmAvailable: true,
    }
  }
  return {
    version: npmVersion!,
    source: 'npm',
    // Keep GH tarball as optional fallback only when versions match was false
    // and npm won; strip integrity with URL if callers still prefer tarball.
    tarballUrl,
    tarballSha256,
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
 * Enforces 20MB cap, optional content-type check, and sha256 integrity (H-012).
 * Returns the local path on success, null on failure.
 * Exported for local install path (H-006) — same dual-source artifact as global.
 */
export async function downloadReleaseTarball(
  tarballUrl: string,
  options?: {
    expectedSha256?: string
    maxBytes?: number
  },
): Promise<string | null> {
  const maxBytes = options?.maxBytes ?? MAX_TARBALL_BYTES
  const expectedSha256 = options?.expectedSha256
    ? options.expectedSha256.toLowerCase()
    : undefined
  const dir = await mkdtemp(join(tmpdir(), 'panda-update-'))
  const filePath = join(dir, 'package.tgz')
  try {
    const headers = githubAuthHeaders()
    const response = await axios.get(tarballUrl, {
      timeout: TARBALL_DOWNLOAD_TIMEOUT_MS,
      responseType: 'stream',
      headers,
      maxRedirects: 5,
      maxContentLength: maxBytes,
      maxBodyLength: maxBytes,
      validateStatus: s => s >= 200 && s < 300,
    })

    const contentTypeHeader = String(
      response.headers?.['content-type'] ?? '',
    )
      .split(';')[0]
      ?.trim()
      .toLowerCase()
    if (
      contentTypeHeader &&
      !ALLOWED_TARBALL_CONTENT_TYPES.has(contentTypeHeader)
    ) {
      logForDebugging(
        `tarball download: unexpected content-type ${contentTypeHeader} for ${tarballUrl}`,
      )
      // Soft constraint: log and continue — some mirrors use unusual types.
      // Hard reject only clearly non-archive types.
      if (
        contentTypeHeader.startsWith('text/') ||
        contentTypeHeader.includes('html') ||
        contentTypeHeader.includes('json') ||
        contentTypeHeader.includes('xml')
      ) {
        throw new Error(
          `refusing tarball with content-type ${contentTypeHeader}`,
        )
      }
    }

    const contentLength = Number(response.headers?.['content-length'] ?? 0)
    if (contentLength > maxBytes) {
      throw new Error(
        `tarball content-length ${contentLength} exceeds ${maxBytes} cap`,
      )
    }

    let received = 0
    const hash = createHash('sha256')
    const writeStream = createWriteStream(filePath)

    await new Promise<void>((resolve, reject) => {
      const stream = response.data as NodeJS.ReadableStream
      const onData = (chunk: Buffer | string) => {
        const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
        received += buf.length
        if (received > maxBytes) {
          stream.destroy()
          writeStream.destroy()
          reject(
            new Error(
              `tarball download exceeded ${maxBytes} byte cap (received ${received})`,
            ),
          )
          return
        }
        hash.update(buf)
        if (!writeStream.write(buf)) {
          stream.pause()
          writeStream.once('drain', () => stream.resume())
        }
      }
      stream.on('data', onData)
      stream.on('error', reject)
      stream.on('end', () => {
        writeStream.end(() => resolve())
      })
      writeStream.on('error', reject)
    })

    const actualSha256 = hash.digest('hex')
    if (expectedSha256) {
      if (actualSha256 !== expectedSha256) {
        throw new Error(
          `tarball sha256 mismatch: expected ${expectedSha256}, got ${actualSha256}`,
        )
      }
      logForDebugging(
        `tarball download: sha256 verified (${actualSha256.slice(0, 12)}…)`,
      )
    } else {
      logForDebugging(
        `tarball download: WARNING no expected sha256 for ${tarballUrl}; wrote ${received} bytes (hash=${actualSha256.slice(0, 12)}…)`,
      )
    }

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
    // Integrity digest only valid when the paired URL is kept (H-001 + H-012)
    const tarballSha256 = tarballUrl ? options?.tarballSha256 : undefined
    const preferTarball = options?.preferTarball === true && !!tarballUrl
    const tarballDlOpts = tarballSha256
      ? { expectedSha256: tarballSha256 }
      : undefined

    // Prefer GitHub Release tarball when npm is stale/unavailable
    if (preferTarball && tarballUrl) {
      logForDebugging(`installGlobalPackage: prefer tarball ${tarballUrl}`)
      tarballPath = await downloadReleaseTarball(tarballUrl, tarballDlOpts)
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
        tarballPath = await downloadReleaseTarball(tarballUrl, tarballDlOpts)
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
