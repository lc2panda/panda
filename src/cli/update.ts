import chalk from 'chalk'
import { logEvent } from 'src/services/analytics/index.js'
import {
  getLatestVersionInfo,
  getMaxVersion,
  type InstallStatus,
  installGlobalPackage,
  type LatestVersionInfo,
  resolveInstallTarget,
} from 'src/utils/autoUpdater.js'
import { regenerateCompletionCache } from 'src/utils/completionCache.js'
import {
  getGlobalConfig,
  type InstallMethod,
  saveGlobalConfig,
} from 'src/utils/config.js'
import { logForDebugging } from 'src/utils/debug.js'
import { getDoctorDiagnostic } from 'src/utils/doctorDiagnostic.js'
import { gracefulShutdown } from 'src/utils/gracefulShutdown.js'
import {
  installOrUpdateClaudePackage,
  localInstallationExists,
} from 'src/utils/localInstaller.js'
import {
  installLatest as installLatestNative,
  removeInstalledSymlink,
} from 'src/utils/nativeInstaller/index.js'
import { getPackageManager } from 'src/utils/nativeInstaller/packageManagers.js'
import { writeToStdout } from 'src/utils/process.js'
import { gte } from 'src/utils/semver.js'
import { getInitialSettings } from 'src/utils/settings/settings.js'

export async function update() {
  logEvent('tengu_update_check', {})
  writeToStdout(`Current version: ${MACRO.VERSION}\n`)

  const channel = getInitialSettings()?.autoUpdatesChannel ?? 'latest'
  writeToStdout(chalk.dim('Checking installation…') + '\n')

  logForDebugging('update: Starting update check')

  // Run diagnostic to detect potential issues
  logForDebugging('update: Running diagnostic')
  const diagnostic = await getDoctorDiagnostic()
  logForDebugging(`update: Installation type: ${diagnostic.installationType}`)
  logForDebugging(
    `update: Config install method: ${diagnostic.configInstallMethod}`,
  )
  writeToStdout(chalk.dim(`Checking for updates (${channel})…`) + '\n')

  // Check for multiple installations
  if (diagnostic.multipleInstallations.length > 1) {
    writeToStdout('\n')
    writeToStdout(chalk.yellow('Warning: Multiple installations found') + '\n')
    for (const install of diagnostic.multipleInstallations) {
      const current =
        diagnostic.installationType === install.type
          ? ' (currently running)'
          : ''
      writeToStdout(`- ${install.type} at ${install.path}${current}\n`)
    }
  }

  // Display warnings if any exist
  if (diagnostic.warnings.length > 0) {
    writeToStdout('\n')
    for (const warning of diagnostic.warnings) {
      logForDebugging(`update: Warning detected: ${warning.issue}`)

      // Don't skip PATH warnings - they're always relevant
      // The user needs to know that 'which claude' points elsewhere
      logForDebugging(`update: Showing warning: ${warning.issue}`)

      writeToStdout(chalk.yellow(`Warning: ${warning.issue}\n`))

      writeToStdout(chalk.bold(`Fix: ${warning.fix}\n`))
    }
  }

  // Update config if installMethod is not set (but skip for package managers)
  const config = getGlobalConfig()
  if (
    !config.installMethod &&
    diagnostic.installationType !== 'package-manager'
  ) {
    writeToStdout('\n')
    writeToStdout('Updating configuration to track installation method...\n')
    let detectedMethod: 'local' | 'native' | 'global' | 'unknown' = 'unknown'

    // Map diagnostic installation type to config install method
    switch (diagnostic.installationType) {
      case 'npm-local':
        detectedMethod = 'local'
        break
      case 'native':
        detectedMethod = 'native'
        break
      case 'npm-global':
        detectedMethod = 'global'
        break
      default:
        detectedMethod = 'unknown'
    }

    saveGlobalConfig(current => ({
      ...current,
      installMethod: detectedMethod,
    }))
    writeToStdout(`Installation method set to: ${detectedMethod}\n`)
  }

  // Check if running from development build
  if (diagnostic.installationType === 'development') {
    writeToStdout('\n')
    writeToStdout(
      chalk.yellow('Warning: Cannot update development build') + '\n',
    )
    await gracefulShutdown(1)
  }

  // Check if running from a package manager
  if (diagnostic.installationType === 'package-manager') {
    const packageManager = await getPackageManager()
    writeToStdout('\n')

    // Package-manager installs only print upgrade guidance; still dual-source probe
    const pmLatest = (await getLatestVersionInfo(channel))?.version ?? null
    if (packageManager === 'homebrew') {
      writeToStdout('Panda is managed by Homebrew.\n')
      if (pmLatest && !gte(MACRO.VERSION, pmLatest)) {
        writeToStdout(`Update available: ${MACRO.VERSION} → ${pmLatest}\n`)
        writeToStdout('\n')
        writeToStdout('To update, run:\n')
        writeToStdout(chalk.bold('  brew upgrade panda-code') + '\n')
      } else {
        writeToStdout('Panda is up to date!\n')
      }
    } else if (packageManager === 'winget') {
      writeToStdout('Panda is managed by winget.\n')
      if (pmLatest && !gte(MACRO.VERSION, pmLatest)) {
        writeToStdout(`Update available: ${MACRO.VERSION} → ${pmLatest}\n`)
        writeToStdout('\n')
        writeToStdout('To update, run:\n')
        writeToStdout(
          chalk.bold('  winget upgrade PandaAI.PandaCode') + '\n',
        )
      } else {
        writeToStdout('Panda is up to date!\n')
      }
    } else if (packageManager === 'apk') {
      writeToStdout('Panda is managed by apk.\n')
      if (pmLatest && !gte(MACRO.VERSION, pmLatest)) {
        writeToStdout(`Update available: ${MACRO.VERSION} → ${pmLatest}\n`)
        writeToStdout('\n')
        writeToStdout('To update, run:\n')
        writeToStdout(chalk.bold('  apk upgrade panda-code') + '\n')
      } else {
        writeToStdout('Panda is up to date!\n')
      }
    } else {
      // pacman, deb, and rpm don't get specific commands because they each have
      // multiple frontends (pacman: yay/paru/makepkg, deb: apt/apt-get/aptitude/nala,
      // rpm: dnf/yum/zypper)
      writeToStdout('Claude is managed by a package manager.\n')
      writeToStdout('Please use your package manager to update.\n')
    }

    await gracefulShutdown(0)
  }

  // Check for config/reality mismatch (skip for package-manager installs)
  if (
    config.installMethod &&
    diagnostic.configInstallMethod !== 'not set' &&
    diagnostic.installationType !== 'package-manager'
  ) {
    const runningType = diagnostic.installationType
    const configExpects = diagnostic.configInstallMethod

    // Map installation types for comparison
    const typeMapping: Record<string, string> = {
      'npm-local': 'local',
      'npm-global': 'global',
      native: 'native',
      development: 'development',
      unknown: 'unknown',
    }

    const normalizedRunningType = typeMapping[runningType] || runningType

    if (
      normalizedRunningType !== configExpects &&
      configExpects !== 'unknown'
    ) {
      writeToStdout('\n')
      writeToStdout(chalk.yellow('Warning: Configuration mismatch') + '\n')
      writeToStdout(`Config expects: ${configExpects} installation\n`)
      writeToStdout(`Currently running: ${runningType}\n`)
      writeToStdout(
        chalk.yellow(
          `Updating the ${runningType} installation you are currently using`,
        ) + '\n',
      )

      // Update config to match reality
      saveGlobalConfig(current => ({
        ...current,
        installMethod: normalizedRunningType as InstallMethod,
      }))
      writeToStdout(
        `Config updated to reflect current installation method: ${normalizedRunningType}\n`,
      )
    }
  }

  // Handle native installation updates first
  if (diagnostic.installationType === 'native') {
    logForDebugging(
      'update: Detected native installation, using native updater',
    )
    try {
      const result = await installLatestNative(channel, true)

      // Handle lock contention gracefully
      if (result.lockFailed) {
        const pidInfo = result.lockHolderPid
          ? ` (PID ${result.lockHolderPid})`
          : ''
        writeToStdout(
          chalk.yellow(
            `Another Claude process${pidInfo} is currently running. Please try again in a moment.`,
          ) + '\n',
        )
        await gracefulShutdown(0)
      }

      if (!result.latestVersion) {
        process.stderr.write('Failed to check for updates\n')
        await gracefulShutdown(1)
      }

      if (result.latestVersion === MACRO.VERSION) {
        writeToStdout(
          chalk.green(`Panda is up to date (${MACRO.VERSION})`) + '\n',
        )
      } else {
        writeToStdout(
          chalk.green(
            `Successfully updated from ${MACRO.VERSION} to version ${result.latestVersion}`,
          ) + '\n',
        )
        await regenerateCompletionCache()
      }
      await gracefulShutdown(0)
    } catch (error) {
      process.stderr.write('Error: Failed to install native update\n')
      process.stderr.write(String(error) + '\n')
      process.stderr.write('Try running "panda doctor" for diagnostics\n')
      await gracefulShutdown(1)
    }
  }

  // Fallback to existing JS/npm-based update logic
  // Remove native installer symlink since we're not using native installation
  // But only if user hasn't migrated to native installation
  if (config.installMethod !== 'native') {
    await removeInstalledSymlink()
  }

  writeToStdout(chalk.dim('Checking registry…') + '\n')
  writeToStdout(chalk.dim('Checking GitHub releases…') + '\n')
  logForDebugging('update: Checking npm Packages + GitHub Releases')
  logForDebugging(`update: Package URL: ${MACRO.PACKAGE_URL}`)
  const latestInfo: LatestVersionInfo | null =
    await getLatestVersionInfo(channel)
  logForDebugging(
    `update: Latest version info: ${latestInfo ? JSON.stringify(latestInfo) : 'FAILED'}`,
  )

  if (!latestInfo) {
    logForDebugging('update: Failed to get latest version from npm and GitHub')
    process.stderr.write(chalk.red('Failed to check for updates') + '\n')
    process.stderr.write(
      'Unable to fetch latest version from GitHub Packages or GitHub Releases\n',
    )
    process.stderr.write('\n')
    process.stderr.write('Possible causes:\n')
    process.stderr.write('  • Network connectivity issues\n')
    process.stderr.write('  • GitHub Packages / API is unreachable or slow\n')
    process.stderr.write('  • Corporate proxy/firewall blocking registry\n')
    if (MACRO.PACKAGE_URL && !MACRO.PACKAGE_URL.startsWith('@anthropic')) {
      process.stderr.write(
        '  • Internal/development build not published yet\n',
      )
    }
    process.stderr.write('\n')
    process.stderr.write('Try:\n')
    process.stderr.write('  • Check your internet connection\n')
    process.stderr.write('  • Run with --debug flag for more details\n')
    const packageName =
      MACRO.PACKAGE_URL ||
      (process.env.USER_TYPE === 'ant'
        ? '@anthropic-ai/claude-cli'
        : '@lc2panda/panda-code')
    process.stderr.write(
      `  • Manually check: npm view ${packageName} version --registry=https://npm.pkg.github.com\n`,
    )
    process.stderr.write(
      '  • Or install from Release: curl -fsSL https://raw.githubusercontent.com/lc2panda/panda/main/install.sh | bash\n',
    )
    process.stderr.write('  • Check if you need to login: npm whoami\n')
    await gracefulShutdown(1)
  }

  // Single source of truth: maxVersion kill-switch caps version AND strips
  // tarballUrl/preferTarball so GH tarball cannot bypass the cap.
  const maxVersion = await getMaxVersion()
  const target = resolveInstallTarget(latestInfo, maxVersion, MACRO.VERSION)
  if (target.skipUpdate) {
    writeToStdout(
      chalk.green(
        `Panda is up to date (${MACRO.VERSION}${maxVersion ? `; max allowed ${maxVersion}` : ''})`,
      ) + '\n',
    )
    await gracefulShutdown(0)
  }

  const latestVersion = target.version
  // Semver: local already >= capped target → up to date
  if (gte(MACRO.VERSION, latestVersion)) {
    writeToStdout(
      chalk.green(`Panda is up to date (${MACRO.VERSION})`) + '\n',
    )
    await gracefulShutdown(0)
  }

  const sourceLabel =
    target.cappedByMaxVersion
      ? `maxVersion cap ${maxVersion} (remote ${latestInfo.version})`
      : latestInfo.source === 'github-release'
        ? 'GitHub Release'
        : latestInfo.source === 'both'
          ? 'npm + GitHub Release'
          : 'npm'
  writeToStdout(
    `New version available: ${latestVersion} (current: ${MACRO.VERSION}, source: ${sourceLabel})\n`,
  )
  writeToStdout('Installing update…\n')

  // Determine update method based on what's actually running
  let useLocalUpdate = false
  let updateMethodName = ''

  switch (diagnostic.installationType) {
    case 'npm-local':
      useLocalUpdate = true
      updateMethodName = 'local'
      break
    case 'npm-global':
      useLocalUpdate = false
      updateMethodName = 'global'
      break
    case 'unknown': {
      // Fallback to detection if we can't determine installation type
      const isLocal = await localInstallationExists()
      useLocalUpdate = isLocal
      updateMethodName = isLocal ? 'local' : 'global'
      writeToStdout(
        chalk.yellow('Warning: Could not determine installation type') + '\n',
      )
      writeToStdout(
        `Attempting ${updateMethodName} update based on file detection...\n`,
      )
      break
    }
    default:
      process.stderr.write(
        `Error: Cannot update ${diagnostic.installationType} installation\n`,
      )
      await gracefulShutdown(1)
  }

  writeToStdout(`Using ${updateMethodName} installation update method…\n`)

  logForDebugging(`update: Update method determined: ${updateMethodName}`)
  logForDebugging(`update: useLocalUpdate: ${useLocalUpdate}`)

  let status: InstallStatus

  // Shared dual-source options (H-006): local and global both honor
  // resolveInstallTarget preferTarball / tarballUrl / maxVersion cap.
  const dualSourceOpts = {
    tarballUrl: target.tarballUrl,
    preferTarball: target.preferTarball,
  }

  if (useLocalUpdate) {
    logForDebugging(
      `update: Calling installOrUpdateClaudePackage(${latestVersion}, preferTarball=${target.preferTarball}, capped=${target.cappedByMaxVersion}) for local update`,
    )
    status = await installOrUpdateClaudePackage(
      channel,
      latestVersion,
      dualSourceOpts,
    )
  } else {
    logForDebugging(
      `update: Calling installGlobalPackage(${latestVersion}, preferTarball=${target.preferTarball}, capped=${target.cappedByMaxVersion})`,
    )
    status = await installGlobalPackage(latestVersion, dualSourceOpts)
  }

  logForDebugging(`update: Installation status: ${status}`)

  switch (status) {
    case 'success':
      writeToStdout(
        chalk.green(
          `Successfully updated from ${MACRO.VERSION} to version ${latestVersion} via ${sourceLabel}`,
        ) + '\n',
      )
      await regenerateCompletionCache()
      break
    case 'no_permissions':
      process.stderr.write(
        'Error: Insufficient permissions to install update\n',
      )
      if (useLocalUpdate) {
        process.stderr.write('Try manually updating with:\n')
        process.stderr.write(
          `  cd ~/.pandacc/local && npm update ${MACRO.PACKAGE_URL}\n`,
        )
      } else {
        process.stderr.write('Try running with sudo or fix npm permissions\n')
        process.stderr.write(
          'Or install from GitHub Release: curl -fsSL https://raw.githubusercontent.com/lc2panda/panda/main/install.sh | bash\n',
        )
      }
      await gracefulShutdown(1)
      break
    case 'install_failed':
      process.stderr.write('Error: Failed to install update\n')
      if (useLocalUpdate) {
        process.stderr.write('Try manually updating with:\n')
        process.stderr.write(
          `  cd ~/.pandacc/local && npm update ${MACRO.PACKAGE_URL}\n`,
        )
      } else {
        process.stderr.write(
          'Try: curl -fsSL https://raw.githubusercontent.com/lc2panda/panda/main/install.sh | bash\n',
        )
        if (target.tarballUrl) {
          process.stderr.write(
            `Or: npm install -g ${target.tarballUrl}\n`,
          )
        }
      }
      await gracefulShutdown(1)
      break
    case 'in_progress':
      process.stderr.write(
        'Error: Another instance is currently performing an update\n',
      )
      process.stderr.write('Please wait and try again later\n')
      await gracefulShutdown(1)
      break
  }
  await gracefulShutdown(0)
}
