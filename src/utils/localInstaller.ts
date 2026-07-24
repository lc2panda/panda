/**
 * Utilities for handling local installation
 */

import { access, chmod, writeFile } from 'fs/promises'
import { join } from 'path'
import {
  downloadReleaseTarball,
  getMaxVersion,
  type InstallGlobalPackageOptions,
  isTarballAllowedForInstall,
} from './autoUpdater.js'
import { type ReleaseChannel, saveGlobalConfig } from './config.js'
import { logForDebugging } from './debug.js'
import { getClaudeConfigHomeDir } from './envUtils.js'
import { getErrnoCode } from './errors.js'
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'
import { getFsImplementation } from './fsOperations.js'
import { logError } from './log.js'
import { lt } from './semver.js'
import { jsonStringify } from './slowOperations.js'

/** Same registry as autoUpdater dual-source path */
const GH_PACKAGES_REGISTRY = 'https://npm.pkg.github.com'

// Lazy getters: getClaudeConfigHomeDir() is memoized and reads process.env.
// Evaluating at module scope would capture the value before entrypoints like
// hfi.tsx get a chance to set CLAUDE_CONFIG_DIR in main(), and would also
// populate the memoize cache with that stale value for all 150+ other callers.
function getLocalInstallDir(): string {
  return join(getClaudeConfigHomeDir(), 'local')
}
export function getLocalClaudePath(): string {
  return join(getLocalInstallDir(), 'claude')
}

/**
 * Check if we're running from our managed local installation
 */
export function isRunningFromLocalInstallation(): boolean {
  const execPath = process.argv[1] || ''
  return execPath.includes('/.pandacc/local/node_modules/')
}

/**
 * Write `content` to `path` only if the file does not already exist.
 * Uses O_EXCL ('wx') for atomic create-if-missing.
 */
async function writeIfMissing(
  path: string,
  content: string,
  mode?: number,
): Promise<boolean> {
  try {
    await writeFile(path, content, { encoding: 'utf8', flag: 'wx', mode })
    return true
  } catch (e) {
    if (getErrnoCode(e) === 'EEXIST') return false
    throw e
  }
}

/**
 * Ensure the local package environment is set up
 * Creates the directory, package.json, and wrapper script
 */
export async function ensureLocalPackageEnvironment(): Promise<boolean> {
  try {
    const localInstallDir = getLocalInstallDir()

    // Create installation directory (recursive, idempotent)
    await getFsImplementation().mkdir(localInstallDir)

    // Create package.json if it doesn't exist
    await writeIfMissing(
      join(localInstallDir, 'package.json'),
      jsonStringify(
        { name: 'claude-local', version: '0.0.1', private: true },
        null,
        2,
      ),
    )

    // Create the wrapper script if it doesn't exist
    const wrapperPath = join(localInstallDir, 'claude')
    const created = await writeIfMissing(
      wrapperPath,
      `#!/bin/sh\nexec "${localInstallDir}/node_modules/.bin/claude" "$@"`,
      0o755,
    )
    if (created) {
      // Mode in writeFile is masked by umask; chmod to ensure executable bit.
      await chmod(wrapperPath, 0o755)
    }

    return true
  } catch (error) {
    logError(error)
    return false
  }
}

const LOCAL_NPM_EXEC_OPTS = {
  maxBuffer: 1_000_000,
  abortSignal: AbortSignal.timeout(120_000),
} as const

function localNpmInstallArgs(packageSpec: string): string[] {
  return [
    'install',
    packageSpec,
    `--registry=${GH_PACKAGES_REGISTRY}`,
    '--fetch-timeout=8000',
    '--fetch-retries=1',
  ]
}

function localNpmInstallTarballArgs(tarballPath: string): string[] {
  // Tarball is a local file path — no registry needed
  return [
    'install',
    tarballPath,
    '--fetch-timeout=8000',
    '--fetch-retries=1',
  ]
}

/**
 * Pure dual-source plan for local installs (H-006).
 * Mirrors installGlobalPackage decision order:
 * 1. Strip tarball above maxVersion
 * 2. preferTarball → try tarball first
 * 3. Cap npm version to maxVersion
 * 4. Allow tarball fallback after registry failure when still allowed
 */
export type LocalInstallPlan = {
  preferTarballFirst: boolean
  tarballUrl?: string
  installVersion: string
  allowTarballFallback: boolean
}

export function planLocalInstall(
  channel: ReleaseChannel,
  specificVersion: string | null | undefined,
  options: InstallGlobalPackageOptions | undefined,
  maxVersion: string | undefined,
): LocalInstallPlan {
  let tarballUrl = options?.tarballUrl
  if (
    tarballUrl &&
    !isTarballAllowedForInstall(tarballUrl, specificVersion, maxVersion)
  ) {
    tarballUrl = undefined
  }

  let installVersion = specificVersion
    ? specificVersion
    : channel === 'stable'
      ? 'stable'
      : 'latest'
  if (maxVersion) {
    if (!specificVersion) {
      installVersion = maxVersion
    } else if (lt(maxVersion, specificVersion)) {
      installVersion = maxVersion
    }
  }

  return {
    preferTarballFirst: Boolean(options?.preferTarball && tarballUrl),
    tarballUrl,
    installVersion,
    allowTarballFallback: Boolean(tarballUrl),
  }
}

/**
 * Install or update Claude CLI package in the local directory.
 * Dual-source (H-006): same preferTarball / tarballUrl / maxVersion rules as
 * installGlobalPackage — GH Release tarball when Packages lag; never install a
 * tarball above maxVersion; observable failure when neither source can supply
 * the capped version (no silent older install).
 *
 * @param channel - Release channel to use (latest or stable)
 * @param specificVersion - Optional specific version to install (overrides channel)
 * @param options - Dual-source tarball options from resolveInstallTarget
 */
export async function installOrUpdateClaudePackage(
  channel: ReleaseChannel,
  specificVersion?: string | null,
  options?: InstallGlobalPackageOptions,
): Promise<'in_progress' | 'success' | 'install_failed'> {
  try {
    // First ensure the environment is set up
    if (!(await ensureLocalPackageEnvironment())) {
      return 'install_failed'
    }

    const maxVersion = await getMaxVersion()
    const localDir = getLocalInstallDir()
    const plan = planLocalInstall(channel, specificVersion, options, maxVersion)

    if (options?.tarballUrl && !plan.tarballUrl) {
      logForDebugging(
        `installOrUpdateClaudePackage: rejecting tarball ${options.tarballUrl} (exceeds version cap)`,
      )
    }

    // Prefer GH Release tarball when Packages lag (source=both / github)
    if (plan.preferTarballFirst && plan.tarballUrl) {
      logForDebugging(
        `installOrUpdateClaudePackage: preferTarball, installing from ${plan.tarballUrl}`,
      )
      const tarballPath = await downloadReleaseTarball(plan.tarballUrl)
      if (tarballPath) {
        const tarballResult = await execFileNoThrowWithCwd(
          'npm',
          localNpmInstallTarballArgs(tarballPath),
          { cwd: localDir, ...LOCAL_NPM_EXEC_OPTS },
        )
        if (tarballResult.code === 0) {
          saveGlobalConfig(current => ({
            ...current,
            installMethod: 'local',
          }))
          return 'success'
        }
        logError(
          new Error(
            `Local tarball install failed, falling back to registry: ${tarballResult.stderr || tarballResult.stdout || 'Unknown error'}`,
          ),
        )
      } else {
        logForDebugging(
          'installOrUpdateClaudePackage: tarball download failed, falling back to registry',
        )
      }
    }

    if (
      maxVersion &&
      specificVersion &&
      plan.installVersion === maxVersion &&
      lt(maxVersion, specificVersion)
    ) {
      logForDebugging(
        `installOrUpdateClaudePackage: capping ${specificVersion} to maxVersion ${maxVersion}`,
      )
    }

    // Force GH Packages registry + short fetch/process timeouts (avoid 10min hang)
    const result = await execFileNoThrowWithCwd(
      'npm',
      localNpmInstallArgs(`${MACRO.PACKAGE_URL}@${plan.installVersion}`),
      {
        cwd: localDir,
        ...LOCAL_NPM_EXEC_OPTS,
      },
    )

    if (result.code !== 0) {
      // Fallback: if dual-source provided a (still-allowed) tarball, try it
      if (plan.allowTarballFallback && plan.tarballUrl) {
        logForDebugging(
          `installOrUpdateClaudePackage: registry failed, falling back to tarball ${plan.tarballUrl}`,
        )
        const tarballPath = await downloadReleaseTarball(plan.tarballUrl)
        if (tarballPath) {
          const fallback = await execFileNoThrowWithCwd(
            'npm',
            localNpmInstallTarballArgs(tarballPath),
            { cwd: localDir, ...LOCAL_NPM_EXEC_OPTS },
          )
          if (fallback.code === 0) {
            saveGlobalConfig(current => ({
              ...current,
              installMethod: 'local',
            }))
            return 'success'
          }
          logError(
            new Error(
              `Local tarball fallback failed: ${fallback.stderr || fallback.stdout || 'Unknown error'}`,
            ),
          )
        }
      }
      const error = new Error(
        `Failed to install package ${MACRO.PACKAGE_URL}: ${result.stderr}`,
      )
      logError(error)
      return result.code === 190 ? 'in_progress' : 'install_failed'
    }

    // Set installMethod to 'local' to prevent npm permission warnings
    saveGlobalConfig(current => ({
      ...current,
      installMethod: 'local',
    }))

    return 'success'
  } catch (error) {
    logError(error)
    return 'install_failed'
  }
}

/**
 * Check if local installation exists.
 * Pure existence probe — callers use this to choose update path / UI hints.
 */
export async function localInstallationExists(): Promise<boolean> {
  // Prefer product bin `panda`; keep legacy `claude` for dual-compat installs
  for (const binName of ['panda', 'claude'] as const) {
    try {
      await access(join(getLocalInstallDir(), 'node_modules', '.bin', binName))
      return true
    } catch {
      // try next
    }
  }
  return false
}

/**
 * Get shell type to determine appropriate path setup
 */
export function getShellType(): string {
  const shellPath = process.env.SHELL || ''
  if (shellPath.includes('zsh')) return 'zsh'
  if (shellPath.includes('bash')) return 'bash'
  if (shellPath.includes('fish')) return 'fish'
  return 'unknown'
}
