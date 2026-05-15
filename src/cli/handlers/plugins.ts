/**
 * Plugin and marketplace subcommand handlers — extracted from main.tsx for lazy loading.
 * These are dynamically imported only when `claude plugin *` or `claude plugin marketplace *` runs.
 */
/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handlers intentionally exit */
import figures from 'figures'
import { basename, dirname } from 'path'
import { setUseCoworkPlugins } from '../../bootstrap/state.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../../services/analytics/index.js'
import {
  disableAllPlugins,
  disablePlugin,
  enablePlugin,
  installPlugin,
  prunePluginsCli,
  uninstallPlugin,
  updatePluginCli,
  VALID_INSTALLABLE_SCOPES,
  VALID_UPDATE_SCOPES,
} from '../../services/plugins/pluginCliCommands.js'
import { getPluginErrorMessage } from '../../types/plugin.js'
import { errorMessage } from '../../utils/errors.js'
import { logError } from '../../utils/log.js'
import { clearAllCaches } from '../../utils/plugins/cacheUtils.js'
import { getInstallCounts } from '../../utils/plugins/installCounts.js'
import {
  isPluginInstalled,
  loadInstalledPluginsV2,
} from '../../utils/plugins/installedPluginsManager.js'
import {
  createPluginId,
  loadMarketplacesWithGracefulDegradation,
} from '../../utils/plugins/marketplaceHelpers.js'
import {
  addMarketplaceSource,
  loadKnownMarketplacesConfig,
  refreshAllMarketplaces,
  refreshMarketplace,
  removeMarketplaceSource,
  saveMarketplaceToSettings,
} from '../../utils/plugins/marketplaceManager.js'
import { loadPluginMcpServers } from '../../utils/plugins/mcpPluginIntegration.js'
import { parseMarketplaceInput } from '../../utils/plugins/parseMarketplaceInput.js'
import {
  parsePluginIdentifier,
  scopeToSettingSource,
} from '../../utils/plugins/pluginIdentifier.js'
import { loadAllPlugins } from '../../utils/plugins/pluginLoader.js'
import type { PluginSource } from '../../utils/plugins/schemas.js'
import {
  type ValidationResult,
  validateManifest,
  validatePluginContents,
} from '../../utils/plugins/validatePlugin.js'
import { jsonStringify } from '../../utils/slowOperations.js'
import { plural } from '../../utils/stringUtils.js'
import { cliError, cliOk } from '../exit.js'

// Re-export for main.tsx to reference in option definitions
export { VALID_INSTALLABLE_SCOPES, VALID_UPDATE_SCOPES }

/**
 * Helper function to handle marketplace command errors consistently.
 */
export function handleMarketplaceError(error: unknown, action: string): never {
  logError(error)
  cliError(`${figures.cross} Failed to ${action}: ${errorMessage(error)}`)
}

function printValidationResult(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.log(
      `${figures.cross} Found ${result.errors.length} ${plural(result.errors.length, 'error')}:\n`,
    )
    result.errors.forEach(error => {
      console.log(`  ${figures.pointer} ${error.path}: ${error.message}`)
    })
    console.log('')
  }
  if (result.warnings.length > 0) {
    console.log(
      `${figures.warning} Found ${result.warnings.length} ${plural(result.warnings.length, 'warning')}:\n`,
    )
    result.warnings.forEach(warning => {
      console.log(`  ${figures.pointer} ${warning.path}: ${warning.message}`)
    })
    console.log('')
  }
}

// plugin validate
export async function pluginValidateHandler(
  manifestPath: string,
  options: { cowork?: boolean },
): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  try {
    const result = await validateManifest(manifestPath)

    console.log(`Validating ${result.fileType} manifest: ${result.filePath}\n`)
    printValidationResult(result)

    // If this is a plugin manifest located inside a .claude-plugin directory,
    // also validate the plugin's content files (skills, agents, commands,
    // hooks). Works whether the user passed a directory or the plugin.json
    // path directly.
    let contentResults: ValidationResult[] = []
    if (result.fileType === 'plugin') {
      const manifestDir = dirname(result.filePath)
      if (basename(manifestDir) === '.claude-plugin') {
        contentResults = await validatePluginContents(dirname(manifestDir))
        for (const r of contentResults) {
          console.log(`Validating ${r.fileType}: ${r.filePath}\n`)
          printValidationResult(r)
        }
      }
    }

    const allSuccess = result.success && contentResults.every(r => r.success)
    const hasWarnings =
      result.warnings.length > 0 ||
      contentResults.some(r => r.warnings.length > 0)

    if (allSuccess) {
      cliOk(
        hasWarnings
          ? `${figures.tick} Validation passed with warnings`
          : `${figures.tick} Validation passed`,
      )
    } else {
      console.log(`${figures.cross} Validation failed`)
      process.exit(1)
    }
  } catch (error) {
    logError(error)
    console.error(
      `${figures.cross} Unexpected error during validation: ${errorMessage(error)}`,
    )
    process.exit(2)
  }
}

// plugin list (lines 5217–5416)
export async function pluginListHandler(options: {
  json?: boolean
  available?: boolean
  cowork?: boolean
}): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  logEvent('tengu_plugin_list_command', {})

  const installedData = loadInstalledPluginsV2()
  const { getPluginEditableScopes } = await import(
    '../../utils/plugins/pluginStartupCheck.js'
  )
  const enabledPlugins = getPluginEditableScopes()

  const pluginIds = Object.keys(installedData.plugins)

  // Load all plugins once. The JSON and human paths both need:
  //  - loadErrors (to show load failures per plugin)
  //  - inline plugins (session-only via --plugin-dir, source='name@inline')
  //    which are NOT in installedData.plugins (V2 bookkeeping) — they must
  //    be surfaced separately or `plugin list` silently ignores --plugin-dir.
  const {
    enabled: loadedEnabled,
    disabled: loadedDisabled,
    errors: loadErrors,
  } = await loadAllPlugins()
  const allLoadedPlugins = [...loadedEnabled, ...loadedDisabled]
  const inlinePlugins = allLoadedPlugins.filter(p =>
    p.source.endsWith('@inline'),
  )
  // Path-level inline failures (dir doesn't exist, parse error before
  // manifest is read) use source='inline[N]'. Plugin-level errors after
  // manifest read use source='name@inline'. Collect both for the session
  // section — these are otherwise invisible since they have no pluginId.
  const inlineLoadErrors = loadErrors.filter(
    e => e.source.endsWith('@inline') || e.source.startsWith('inline['),
  )

  if (options.json) {
    // Create a map of plugin source to loaded plugin for quick lookup
    const loadedPluginMap = new Map(allLoadedPlugins.map(p => [p.source, p]))

    const plugins: Array<{
      id: string
      version: string
      scope: string
      enabled: boolean
      installPath: string
      installedAt?: string
      lastUpdated?: string
      projectPath?: string
      mcpServers?: Record<string, unknown>
      errors?: string[]
    }> = []

    for (const pluginId of pluginIds.sort()) {
      const installations = installedData.plugins[pluginId]
      if (!installations || installations.length === 0) continue

      // Find loading errors for this plugin
      const pluginName = parsePluginIdentifier(pluginId).name
      const pluginErrors = loadErrors
        .filter(
          e =>
            e.source === pluginId || ('plugin' in e && e.plugin === pluginName),
        )
        .map(getPluginErrorMessage)

      for (const installation of installations) {
        // Try to find the loaded plugin to get MCP servers
        const loadedPlugin = loadedPluginMap.get(pluginId)
        let mcpServers: Record<string, unknown> | undefined

        if (loadedPlugin) {
          // Load MCP servers if not already cached
          const servers =
            loadedPlugin.mcpServers ||
            (await loadPluginMcpServers(loadedPlugin))
          if (servers && Object.keys(servers).length > 0) {
            mcpServers = servers
          }
        }

        plugins.push({
          id: pluginId,
          version: installation.version || 'unknown',
          scope: installation.scope,
          enabled: enabledPlugins.has(pluginId),
          installPath: installation.installPath,
          installedAt: installation.installedAt,
          lastUpdated: installation.lastUpdated,
          projectPath: installation.projectPath,
          mcpServers,
          errors: pluginErrors.length > 0 ? pluginErrors : undefined,
        })
      }
    }

    // Session-only plugins: scope='session', no install metadata.
    // Filter from inlineLoadErrors (not loadErrors) so an installed plugin
    // with the same manifest name doesn't cross-contaminate via e.plugin.
    // The e.plugin fallback catches the dirName≠manifestName case:
    // createPluginFromPath tags errors with `${dirName}@inline` but
    // plugin.source is reassigned to `${manifest.name}@inline` afterward
    // (pluginLoader.ts loadInlinePlugins), so e.source !== p.source when
    // a dev checkout dir like ~/code/my-fork/ has manifest name 'cool-plugin'.
    for (const p of inlinePlugins) {
      const servers = p.mcpServers || (await loadPluginMcpServers(p))
      const pErrors = inlineLoadErrors
        .filter(
          e => e.source === p.source || ('plugin' in e && e.plugin === p.name),
        )
        .map(getPluginErrorMessage)
      plugins.push({
        id: p.source,
        version: p.manifest.version ?? 'unknown',
        scope: 'session',
        enabled: p.enabled !== false,
        installPath: p.path,
        mcpServers:
          servers && Object.keys(servers).length > 0 ? servers : undefined,
        errors: pErrors.length > 0 ? pErrors : undefined,
      })
    }
    // Path-level inline failures (--plugin-dir /nonexistent): no LoadedPlugin
    // exists so the loop above can't surface them. Mirror the human-path
    // handling so JSON consumers see the failure instead of silent omission.
    for (const e of inlineLoadErrors.filter(e =>
      e.source.startsWith('inline['),
    )) {
      plugins.push({
        id: e.source,
        version: 'unknown',
        scope: 'session',
        enabled: false,
        installPath: 'path' in e ? e.path : '',
        errors: [getPluginErrorMessage(e)],
      })
    }

    // If --available is set, also load available plugins from marketplaces
    if (options.available) {
      const available: Array<{
        pluginId: string
        name: string
        description?: string
        marketplaceName: string
        version?: string
        source: PluginSource
        installCount?: number
      }> = []

      try {
        const [config, installCounts] = await Promise.all([
          loadKnownMarketplacesConfig(),
          getInstallCounts(),
        ])
        const { marketplaces } =
          await loadMarketplacesWithGracefulDegradation(config)

        for (const {
          name: marketplaceName,
          data: marketplace,
        } of marketplaces) {
          if (marketplace) {
            for (const entry of marketplace.plugins) {
              const pluginId = createPluginId(entry.name, marketplaceName)
              // Only include plugins that are not already installed
              if (!isPluginInstalled(pluginId)) {
                available.push({
                  pluginId,
                  name: entry.name,
                  description: entry.description,
                  marketplaceName,
                  version: entry.version,
                  source: entry.source,
                  installCount: installCounts?.get(pluginId),
                })
              }
            }
          }
        }
      } catch {
        // Silently ignore marketplace loading errors
      }

      cliOk(jsonStringify({ installed: plugins, available }, null, 2))
    } else {
      cliOk(jsonStringify(plugins, null, 2))
    }
  }

  if (pluginIds.length === 0 && inlinePlugins.length === 0) {
    // inlineLoadErrors can exist with zero inline plugins (e.g. --plugin-dir
    // points at a nonexistent path). Don't early-exit over them — fall
    // through to the session section so the failure is visible.
    if (inlineLoadErrors.length === 0) {
      cliOk(
        'No plugins installed. Use `panda plugin install` to install a plugin.',
      )
    }
  }

  if (pluginIds.length > 0) {
    console.log('Installed plugins:\n')
  }

  for (const pluginId of pluginIds.sort()) {
    const installations = installedData.plugins[pluginId]
    if (!installations || installations.length === 0) continue

    // Find loading errors for this plugin
    const pluginName = parsePluginIdentifier(pluginId).name
    const pluginErrors = loadErrors.filter(
      e => e.source === pluginId || ('plugin' in e && e.plugin === pluginName),
    )

    for (const installation of installations) {
      const isEnabled = enabledPlugins.has(pluginId)
      const status =
        pluginErrors.length > 0
          ? `${figures.cross} failed to load`
          : isEnabled
            ? `${figures.tick} enabled`
            : `${figures.cross} disabled`
      const version = installation.version || 'unknown'
      const scope = installation.scope

      console.log(`  ${figures.pointer} ${pluginId}`)
      console.log(`    Version: ${version}`)
      console.log(`    Scope: ${scope}`)
      console.log(`    Status: ${status}`)
      for (const error of pluginErrors) {
        console.log(`    Error: ${getPluginErrorMessage(error)}`)
      }
      console.log('')
    }
  }

  if (inlinePlugins.length > 0 || inlineLoadErrors.length > 0) {
    console.log('Session-only plugins (--plugin-dir):\n')
    for (const p of inlinePlugins) {
      // Same dirName≠manifestName fallback as the JSON path above — error
      // sources use the dir basename but p.source uses the manifest name.
      const pErrors = inlineLoadErrors.filter(
        e => e.source === p.source || ('plugin' in e && e.plugin === p.name),
      )
      const status =
        pErrors.length > 0
          ? `${figures.cross} loaded with errors`
          : `${figures.tick} loaded`
      console.log(`  ${figures.pointer} ${p.source}`)
      console.log(`    Version: ${p.manifest.version ?? 'unknown'}`)
      console.log(`    Path: ${p.path}`)
      console.log(`    Status: ${status}`)
      for (const e of pErrors) {
        console.log(`    Error: ${getPluginErrorMessage(e)}`)
      }
      console.log('')
    }
    // Path-level failures: no LoadedPlugin object exists. Show them so
    // `--plugin-dir /typo` doesn't just silently produce nothing.
    for (const e of inlineLoadErrors.filter(e =>
      e.source.startsWith('inline['),
    )) {
      console.log(
        `  ${figures.pointer} ${e.source}: ${figures.cross} ${getPluginErrorMessage(e)}\n`,
      )
    }
  }

  cliOk()
}

// marketplace add (lines 5433–5487)
export async function marketplaceAddHandler(
  source: string,
  options: { cowork?: boolean; sparse?: string[]; scope?: string },
): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  try {
    const parsed = await parseMarketplaceInput(source)

    if (!parsed) {
      cliError(
        `${figures.cross} Invalid marketplace source format. Try: owner/repo, https://..., or ./path`,
      )
    }

    if ('error' in parsed) {
      cliError(`${figures.cross} ${parsed.error}`)
    }

    // Validate scope
    const scope = options.scope ?? 'user'
    if (scope !== 'user' && scope !== 'project' && scope !== 'local') {
      cliError(
        `${figures.cross} Invalid scope '${scope}'. Use: user, project, or local`,
      )
    }
    const settingSource = scopeToSettingSource(scope)

    let marketplaceSource = parsed

    if (options.sparse && options.sparse.length > 0) {
      if (
        marketplaceSource.source === 'github' ||
        marketplaceSource.source === 'git'
      ) {
        marketplaceSource = {
          ...marketplaceSource,
          sparsePaths: options.sparse,
        }
      } else {
        cliError(
          `${figures.cross} --sparse is only supported for github and git marketplace sources (got: ${marketplaceSource.source})`,
        )
      }
    }

    console.log('Adding marketplace...')

    const { name, alreadyMaterialized, resolvedSource } =
      await addMarketplaceSource(marketplaceSource, message => {
        console.log(message)
      })

    // Write intent to settings at the requested scope
    saveMarketplaceToSettings(name, { source: resolvedSource }, settingSource)

    clearAllCaches()

    let sourceType = marketplaceSource.source
    if (marketplaceSource.source === 'github') {
      sourceType =
        marketplaceSource.repo as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    }
    logEvent('tengu_marketplace_added', {
      source_type:
        sourceType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    cliOk(
      alreadyMaterialized
        ? `${figures.tick} Marketplace '${name}' already on disk — declared in ${scope} settings`
        : `${figures.tick} Successfully added marketplace: ${name} (declared in ${scope} settings)`,
    )
  } catch (error) {
    handleMarketplaceError(error, 'add marketplace')
  }
}

// marketplace list (lines 5497–5565)
export async function marketplaceListHandler(options: {
  json?: boolean
  cowork?: boolean
}): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  try {
    const config = await loadKnownMarketplacesConfig()
    const names = Object.keys(config)

    if (options.json) {
      const marketplaces = names.sort().map(name => {
        const marketplace = config[name]
        const source = marketplace?.source
        return {
          name,
          source: source?.source,
          ...(source?.source === 'github' && { repo: source.repo }),
          ...(source?.source === 'git' && { url: source.url }),
          ...(source?.source === 'url' && { url: source.url }),
          ...(source?.source === 'directory' && { path: source.path }),
          ...(source?.source === 'file' && { path: source.path }),
          installLocation: marketplace?.installLocation,
        }
      })
      cliOk(jsonStringify(marketplaces, null, 2))
    }

    if (names.length === 0) {
      cliOk('No marketplaces configured')
    }

    console.log('Configured marketplaces:\n')
    names.forEach(name => {
      const marketplace = config[name]
      console.log(`  ${figures.pointer} ${name}`)

      if (marketplace?.source) {
        const src = marketplace.source
        if (src.source === 'github') {
          console.log(`    Source: GitHub (${src.repo})`)
        } else if (src.source === 'git') {
          console.log(`    Source: Git (${src.url})`)
        } else if (src.source === 'url') {
          console.log(`    Source: URL (${src.url})`)
        } else if (src.source === 'directory') {
          console.log(`    Source: Directory (${src.path})`)
        } else if (src.source === 'file') {
          console.log(`    Source: File (${src.path})`)
        }
      }
      console.log('')
    })

    cliOk()
  } catch (error) {
    handleMarketplaceError(error, 'list marketplaces')
  }
}

// marketplace remove (lines 5576–5598)
export async function marketplaceRemoveHandler(
  name: string,
  options: { cowork?: boolean },
): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  try {
    await removeMarketplaceSource(name)
    clearAllCaches()

    logEvent('tengu_marketplace_removed', {
      marketplace_name:
        name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    cliOk(`${figures.tick} Successfully removed marketplace: ${name}`)
  } catch (error) {
    handleMarketplaceError(error, 'remove marketplace')
  }
}

// marketplace update (lines 5609–5672)
export async function marketplaceUpdateHandler(
  name: string | undefined,
  options: { cowork?: boolean },
): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  try {
    if (name) {
      console.log(`Updating marketplace: ${name}...`)

      await refreshMarketplace(name, message => {
        console.log(message)
      })

      clearAllCaches()

      logEvent('tengu_marketplace_updated', {
        marketplace_name:
          name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      cliOk(`${figures.tick} Successfully updated marketplace: ${name}`)
    } else {
      const config = await loadKnownMarketplacesConfig()
      const marketplaceNames = Object.keys(config)

      if (marketplaceNames.length === 0) {
        cliOk('No marketplaces configured')
      }

      console.log(`Updating ${marketplaceNames.length} marketplace(s)...`)

      await refreshAllMarketplaces()
      clearAllCaches()

      logEvent('tengu_marketplace_updated_all', {
        count:
          marketplaceNames.length as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      cliOk(
        `${figures.tick} Successfully updated ${marketplaceNames.length} marketplace(s)`,
      )
    }
  } catch (error) {
    handleMarketplaceError(error, 'update marketplace(s)')
  }
}

// plugin install (lines 5690–5721)
export async function pluginInstallHandler(
  plugin: string,
  options: { scope?: string; cowork?: boolean },
): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  const scope = options.scope || 'user'
  if (options.cowork && scope !== 'user') {
    cliError('--cowork can only be used with user scope')
  }
  if (
    !VALID_INSTALLABLE_SCOPES.includes(
      scope as (typeof VALID_INSTALLABLE_SCOPES)[number],
    )
  ) {
    cliError(
      `Invalid scope: ${scope}. Must be one of: ${VALID_INSTALLABLE_SCOPES.join(', ')}.`,
    )
  }
  // _PROTO_* routes to PII-tagged plugin_name/marketplace_name BQ columns.
  // Unredacted plugin arg was previously logged to general-access
  // additional_metadata for all users — dropped in favor of the privileged
  // column route. marketplace may be undefined (fires before resolution).
  const { name, marketplace } = parsePluginIdentifier(plugin)
  logEvent('tengu_plugin_install_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
    scope: scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  await installPlugin(plugin, scope as 'user' | 'project' | 'local')
}

// plugin uninstall (lines 5738–5769)
export async function pluginUninstallHandler(
  plugin: string,
  options: { scope?: string; cowork?: boolean; keepData?: boolean },
): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  const scope = options.scope || 'user'
  if (options.cowork && scope !== 'user') {
    cliError('--cowork can only be used with user scope')
  }
  if (
    !VALID_INSTALLABLE_SCOPES.includes(
      scope as (typeof VALID_INSTALLABLE_SCOPES)[number],
    )
  ) {
    cliError(
      `Invalid scope: ${scope}. Must be one of: ${VALID_INSTALLABLE_SCOPES.join(', ')}.`,
    )
  }
  const { name, marketplace } = parsePluginIdentifier(plugin)
  logEvent('tengu_plugin_uninstall_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
    scope: scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  await uninstallPlugin(
    plugin,
    scope as 'user' | 'project' | 'local',
    options.keepData,
  )
}

// plugin enable (lines 5783–5818)
export async function pluginEnableHandler(
  plugin: string,
  options: { scope?: string; cowork?: boolean },
): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  let scope: (typeof VALID_INSTALLABLE_SCOPES)[number] | undefined
  if (options.scope) {
    if (
      !VALID_INSTALLABLE_SCOPES.includes(
        options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number],
      )
    ) {
      cliError(
        `Invalid scope "${options.scope}". Valid scopes: ${VALID_INSTALLABLE_SCOPES.join(', ')}`,
      )
    }
    scope = options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number]
  }
  if (options.cowork && scope !== undefined && scope !== 'user') {
    cliError('--cowork can only be used with user scope')
  }

  // --cowork always operates at user scope
  if (options.cowork && scope === undefined) {
    scope = 'user'
  }

  const { name, marketplace } = parsePluginIdentifier(plugin)
  logEvent('tengu_plugin_enable_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
    scope: (scope ??
      'auto') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  await enablePlugin(plugin, scope)
}

// plugin disable (lines 5833–5902)
export async function pluginDisableHandler(
  plugin: string | undefined,
  options: { scope?: string; cowork?: boolean; all?: boolean },
): Promise<void> {
  if (options.all && plugin) {
    cliError('Cannot use --all with a specific plugin')
  }

  if (!options.all && !plugin) {
    cliError('Please specify a plugin name or use --all to disable all plugins')
  }

  if (options.cowork) setUseCoworkPlugins(true)

  if (options.all) {
    if (options.scope) {
      cliError('Cannot use --scope with --all')
    }

    // No _PROTO_plugin_name here — --all disables all plugins.
    // Distinguishable from the specific-plugin branch by plugin_name IS NULL.
    logEvent('tengu_plugin_disable_command', {})

    await disableAllPlugins()
    return
  }

  let scope: (typeof VALID_INSTALLABLE_SCOPES)[number] | undefined
  if (options.scope) {
    if (
      !VALID_INSTALLABLE_SCOPES.includes(
        options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number],
      )
    ) {
      cliError(
        `Invalid scope "${options.scope}". Valid scopes: ${VALID_INSTALLABLE_SCOPES.join(', ')}`,
      )
    }
    scope = options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number]
  }
  if (options.cowork && scope !== undefined && scope !== 'user') {
    cliError('--cowork can only be used with user scope')
  }

  // --cowork always operates at user scope
  if (options.cowork && scope === undefined) {
    scope = 'user'
  }

  const { name, marketplace } = parsePluginIdentifier(plugin!)
  logEvent('tengu_plugin_disable_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
    scope: (scope ??
      'auto') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  await disablePlugin(plugin!, scope)
}

// plugin prune (upstream v2.1.121)
export async function pluginPruneHandler(options: {
  dryRun?: boolean
  json?: boolean
  cowork?: boolean
}): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  await prunePluginsCli({ dryRun: options.dryRun, json: options.json })
}

/**
 * plugin details <plugin> (upstream v2.1.139 → v2.1.142)
 *
 * Input:  pluginId string ("name" or "name@marketplace"), --json flag.
 * Output: human-readable or JSON breakdown of a single plugin's installation
 *         path, components (commands/skills/agents/hooks/mcp/lsp), and a
 *         per-session token estimate for each component (commands description
 *         + skill SKILL.md size, etc.). Prints to stdout via cliOk.
 * Pos:    src/cli/handlers/plugins.ts — invoked by the `plugin details <name>`
 *         subcommand registered in main.tsx (v2.1.142 adds LSP listing).
 *
 * Token estimates use the same fast heuristic as contextBudget.ts so the
 * numbers line up with the budgeting subsystem. The estimate is "per-session"
 * because it counts components that would be loaded into the system prompt /
 * tool catalog when the plugin is enabled — it does NOT include MCP server
 * runtime token cost (which depends on tool invocations).
 */
export async function pluginDetailsHandler(
  pluginIdInput: string,
  options: { json?: boolean; cowork?: boolean },
): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  const { readdir, readFile, stat } = await import('fs/promises')
  const { join, basename } = await import('path')
  const { estimateTokens } = await import('../../utils/contextBudget.js')

  // Resolve the plugin identifier. If the user passed just "name" with no
  // "@marketplace", scan loaded plugins for the unique match. Ambiguity is
  // a user error — surface the candidates so they can disambiguate.
  const parsed = parsePluginIdentifier(pluginIdInput)
  const { enabled, disabled, errors: loadErrors } = await loadAllPlugins()
  const allLoaded = [...enabled, ...disabled]

  let matched: (typeof allLoaded)[number] | undefined
  if (parsed.marketplace) {
    matched = allLoaded.find(p => p.source === pluginIdInput)
  } else {
    // Inline plugins use `${name}@inline` as source; installed plugins use
    // `${name}@${marketplace}`. Match on the leading `name` segment.
    const candidates = allLoaded.filter(p => {
      const head = p.source.split('@')[0]
      return head === parsed.name
    })
    if (candidates.length === 1) {
      matched = candidates[0]
    } else if (candidates.length > 1) {
      cliError(
        `${figures.cross} Multiple plugins named '${parsed.name}' are installed. Specify the marketplace: ${candidates
          .map(c => `'${c.source}'`)
          .join(', ')}`,
      )
    }
  }

  // Fallback: loadAllPlugins() only materializes plugins enabled in settings —
  // disabled installs are skipped to keep startup fast. For `plugin details`
  // we still want to inspect them, so reconstruct a minimal LoadedPlugin from
  // the on-disk installPath recorded in installed_plugins.json.
  if (!matched) {
    const installedData = loadInstalledPluginsV2()
    const candidatePluginIds: string[] = []
    if (parsed.marketplace) {
      if (installedData.plugins[pluginIdInput]) {
        candidatePluginIds.push(pluginIdInput)
      }
    } else {
      for (const id of Object.keys(installedData.plugins)) {
        if (id.split('@')[0] === parsed.name) {
          candidatePluginIds.push(id)
        }
      }
    }
    if (candidatePluginIds.length > 1) {
      cliError(
        `${figures.cross} Multiple plugins named '${parsed.name}' are installed. Specify the marketplace: ${candidatePluginIds
          .map(c => `'${c}'`)
          .join(', ')}`,
      )
    }
    const resolvedId = candidatePluginIds[0]
    if (resolvedId) {
      const installations = installedData.plugins[resolvedId]
      const installation = installations?.[0]
      if (installation?.installPath) {
        // Manual reconstruction: parse manifest + probe the conventional
        // component subdirectories. We deliberately do NOT call the loader's
        // internal finishLoadingPluginFromPath (it isn't exported and ships
        // a load-pipeline side-effect chain we don't want here — settings
        // merging, dependency verification, etc.). For details display, the
        // direct probe gives the same component breakdown without the
        // side-effects.
        try {
          const { loadPluginManifest } = await import(
            '../../utils/plugins/pluginLoader.js'
          )
          const manifestPath = join(
            installation.installPath,
            '.claude-plugin',
            'plugin.json',
          )
          const manifest = await loadPluginManifest(
            manifestPath,
            parsed.name,
            resolvedId,
          )
          const probe = async (sub: string): Promise<string | undefined> => {
            try {
              const p = join(installation.installPath, sub)
              const s = await stat(p)
              return s.isDirectory() ? p : undefined
            } catch {
              return undefined
            }
          }
          const [commandsPath, agentsPath, skillsPath] = await Promise.all([
            probe('commands'),
            probe('agents'),
            probe('skills'),
          ])
          let hooksConfig: Record<string, unknown> | undefined
          try {
            const hooksJsonPath = join(
              installation.installPath,
              'hooks',
              'hooks.json',
            )
            const text = await readFile(hooksJsonPath, { encoding: 'utf-8' })
            hooksConfig = JSON.parse(text) as Record<string, unknown>
          } catch {
            /* no hooks.json — ok */
          }
          // Build a synthetic LoadedPlugin shape. enabled=false is hard-coded
          // so the human output stays accurate: this branch only fires for
          // disabled installs.
          // The cast through `unknown` is intentional — full LoadedPlugin
          // requires fields we don't compute here (e.g., outputStylesPath)
          // but the details handler only reads the subset we populate.
          matched = {
            name: manifest.name ?? parsed.name,
            manifest,
            path: installation.installPath,
            source: resolvedId,
            repository: resolvedId,
            enabled: false,
            commandsPath,
            agentsPath,
            skillsPath,
            hooksConfig,
            mcpServers: (manifest as { mcpServers?: Record<string, unknown> })
              .mcpServers,
            lspServers: (manifest as { lspServers?: Record<string, unknown> })
              .lspServers,
          } as unknown as typeof allLoaded[number]
        } catch {
          // Fall through to error below — reconstruction is best-effort.
        }
      }
    }
  }

  if (!matched) {
    cliError(
      `${figures.cross} Plugin '${pluginIdInput}' is not installed or could not be loaded. Run \`panda plugin list\` to see installed plugins.`,
    )
  }
  const plugin = matched!

  // Collect plugin error messages so users see load failures alongside the
  // component breakdown (a partially-loaded plugin may have an empty
  // commands/skills list because of a parse error, which is otherwise
  // surprising).
  const pluginErrors = loadErrors
    .filter(
      e =>
        e.source === plugin.source ||
        ('plugin' in e && e.plugin === plugin.name),
    )
    .map(getPluginErrorMessage)

  // Helper — walk a directory non-recursively and return [filename, size,
  // tokens] tuples for files that look like component content (.md, .txt,
  // .json, no extension). Returns [] if the dir doesn't exist or is empty.
  async function summarizeDir(
    dir: string | undefined,
    opts: { recurse?: boolean; filter?: (name: string) => boolean } = {},
  ): Promise<
    Array<{ name: string; path: string; bytes: number; tokens: number }>
  > {
    if (!dir) return []
    try {
      const out: Array<{
        name: string
        path: string
        bytes: number
        tokens: number
      }> = []
      const recurse = opts.recurse ?? false
      const filter = opts.filter ?? (() => true)
      const queue: string[] = [dir]
      while (queue.length > 0) {
        const current = queue.shift()!
        const entries = await readdir(current, { withFileTypes: true })
        for (const entry of entries) {
          const full = join(current, entry.name)
          if (entry.isDirectory()) {
            if (recurse) queue.push(full)
            continue
          }
          if (!filter(entry.name)) continue
          try {
            const text = await readFile(full, { encoding: 'utf-8' })
            out.push({
              name: entry.name,
              path: full,
              bytes: text.length,
              tokens: estimateTokens(text),
            })
          } catch {
            // Unreadable file — skip silently (the load result already
            // surfaced any structural errors).
          }
        }
      }
      return out
    } catch {
      return []
    }
  }

  // Commands: from `commands/` directory and any object-mapped commands.
  // The object-mapped `commandsMetadata` may include inline `content` fields
  // (no file path) — estimate those directly. File-based commands are
  // listed under commandsPath and commandsPaths.
  const commandFiles = await summarizeDir(plugin.commandsPath, {
    filter: name => name.endsWith('.md'),
  })
  for (const extra of plugin.commandsPaths ?? []) {
    try {
      const s = await stat(extra)
      if (s.isFile() && extra.endsWith('.md')) {
        const text = await readFile(extra, { encoding: 'utf-8' })
        commandFiles.push({
          name: basename(extra),
          path: extra,
          bytes: text.length,
          tokens: estimateTokens(text),
        })
      } else if (s.isDirectory()) {
        commandFiles.push(
          ...(await summarizeDir(extra, {
            filter: name => name.endsWith('.md'),
          })),
        )
      }
    } catch {
      // ignore inaccessible extra paths
    }
  }
  // Inline commandsMetadata.content entries — counted as virtual commands.
  const inlineCommandEntries: Array<{ name: string; tokens: number }> = []
  if (plugin.commandsMetadata) {
    // The recovered-from-disk path may attach a CommandMetadata-shaped value
    // whose static type narrows to unknown after Object.entries. Inline the
    // shape check rather than relying on the upstream type.
    for (const [cmdName, metaUnknown] of Object.entries(
      plugin.commandsMetadata,
    )) {
      const meta = metaUnknown as { content?: unknown } | undefined
      if (meta?.content && typeof meta.content === 'string') {
        inlineCommandEntries.push({
          name: cmdName,
          tokens: estimateTokens(meta.content),
        })
      }
    }
  }

  // Skills: each immediate child directory of skillsPath is a skill; its
  // SKILL.md (or skill.md) is what gets loaded into the system prompt when
  // invoked. Token estimate counts that file's size.
  async function summarizeSkills(dir: string | undefined): Promise<
    Array<{ name: string; path: string; bytes: number; tokens: number }>
  > {
    if (!dir) return []
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      const out: Array<{
        name: string
        path: string
        bytes: number
        tokens: number
      }> = []
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const skillDir = join(dir, entry.name)
        const candidates = ['SKILL.md', 'skill.md']
        let resolvedPath: string | undefined
        for (const c of candidates) {
          const probe = join(skillDir, c)
          try {
            const s = await stat(probe)
            if (s.isFile()) {
              resolvedPath = probe
              break
            }
          } catch {
            /* try next */
          }
        }
        if (!resolvedPath) continue
        try {
          const text = await readFile(resolvedPath, { encoding: 'utf-8' })
          out.push({
            name: entry.name,
            path: resolvedPath,
            bytes: text.length,
            tokens: estimateTokens(text),
          })
        } catch {
          /* skip unreadable */
        }
      }
      return out
    } catch {
      return []
    }
  }
  const skillEntries = await summarizeSkills(plugin.skillsPath)
  for (const extra of plugin.skillsPaths ?? []) {
    skillEntries.push(...(await summarizeSkills(extra)))
  }

  // Agents: each .md file under agentsPath is an agent definition. Like
  // skills, the file contents get materialized into the system prompt at
  // spawn time.
  const agentEntries = await summarizeDir(plugin.agentsPath, {
    filter: name => name.endsWith('.md'),
  })
  for (const extra of plugin.agentsPaths ?? []) {
    try {
      const s = await stat(extra)
      if (s.isFile() && extra.endsWith('.md')) {
        const text = await readFile(extra, { encoding: 'utf-8' })
        agentEntries.push({
          name: basename(extra),
          path: extra,
          bytes: text.length,
          tokens: estimateTokens(text),
        })
      } else if (s.isDirectory()) {
        agentEntries.push(
          ...(await summarizeDir(extra, {
            filter: name => name.endsWith('.md'),
          })),
        )
      }
    } catch {
      /* ignore inaccessible extra paths */
    }
  }

  // Hooks: count matchers per event from the manifest-merged hooksConfig.
  // Token estimate is the JSON-stringified hook block (this is what the
  // settings layer materializes — accurate per-session cost).
  const hookSummary: Array<{ event: string; matcherCount: number }> = []
  let hookTokens = 0
  if (plugin.hooksConfig) {
    for (const [event, matchers] of Object.entries(plugin.hooksConfig)) {
      if (!Array.isArray(matchers)) continue
      hookSummary.push({ event, matcherCount: matchers.length })
    }
    hookTokens = estimateTokens(jsonStringify(plugin.hooksConfig))
  }

  // MCP servers: load via loadPluginMcpServers (resolves the manifest
  // record); count each server entry. Token cost is the JSON-stringified
  // entry (sent to the model as part of the tools catalog when servers are
  // hot).
  const mcpServers =
    plugin.mcpServers ?? (await loadPluginMcpServers(plugin)) ?? {}
  const mcpSummary: Array<{ name: string; tokens: number }> = []
  for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
    mcpSummary.push({
      name: serverName,
      tokens: estimateTokens(jsonStringify(serverConfig)),
    })
  }

  // LSP servers: v2.1.142 added LSP server listing. The loader sets
  // plugin.lspServers if the manifest declares any.
  const lspSummary: Array<{ name: string; tokens: number }> = []
  for (const [name, config] of Object.entries(plugin.lspServers ?? {})) {
    lspSummary.push({
      name,
      tokens: estimateTokens(jsonStringify(config)),
    })
  }

  const commandTokenTotal =
    commandFiles.reduce((acc, f) => acc + f.tokens, 0) +
    inlineCommandEntries.reduce((acc, c) => acc + c.tokens, 0)
  const skillTokenTotal = skillEntries.reduce((acc, s) => acc + s.tokens, 0)
  const agentTokenTotal = agentEntries.reduce((acc, a) => acc + a.tokens, 0)
  const mcpTokenTotal = mcpSummary.reduce((acc, m) => acc + m.tokens, 0)
  const lspTokenTotal = lspSummary.reduce((acc, l) => acc + l.tokens, 0)
  const totalTokens =
    commandTokenTotal +
    skillTokenTotal +
    agentTokenTotal +
    hookTokens +
    mcpTokenTotal +
    lspTokenTotal

  logEvent('tengu_plugin_details_command', {
    _PROTO_plugin_name:
      plugin.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    command_count:
      (commandFiles.length +
        inlineCommandEntries.length) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    skill_count:
      skillEntries.length as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    agent_count:
      agentEntries.length as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    hook_matcher_count: hookSummary.reduce(
      (acc, h) => acc + h.matcherCount,
      0,
    ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    mcp_server_count:
      mcpSummary.length as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    lsp_server_count:
      lspSummary.length as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    total_session_tokens:
      totalTokens as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  if (options.json) {
    cliOk(
      jsonStringify(
        {
          id: plugin.source,
          name: plugin.name,
          version: plugin.manifest.version ?? 'unknown',
          installPath: plugin.path,
          enabled: plugin.enabled !== false,
          isBuiltin: plugin.isBuiltin === true,
          errors: pluginErrors.length > 0 ? pluginErrors : undefined,
          components: {
            commands: {
              count: commandFiles.length + inlineCommandEntries.length,
              tokens: commandTokenTotal,
              files: commandFiles.map(f => ({
                name: f.name,
                path: f.path,
                tokens: f.tokens,
              })),
              inline: inlineCommandEntries,
            },
            skills: {
              count: skillEntries.length,
              tokens: skillTokenTotal,
              entries: skillEntries.map(s => ({
                name: s.name,
                path: s.path,
                tokens: s.tokens,
              })),
            },
            agents: {
              count: agentEntries.length,
              tokens: agentTokenTotal,
              entries: agentEntries.map(a => ({
                name: a.name,
                path: a.path,
                tokens: a.tokens,
              })),
            },
            hooks: {
              eventCount: hookSummary.length,
              matcherCount: hookSummary.reduce(
                (acc, h) => acc + h.matcherCount,
                0,
              ),
              tokens: hookTokens,
              events: hookSummary,
            },
            mcpServers: {
              count: mcpSummary.length,
              tokens: mcpTokenTotal,
              entries: mcpSummary,
            },
            lspServers: {
              count: lspSummary.length,
              tokens: lspTokenTotal,
              entries: lspSummary,
            },
          },
          totalSessionTokens: totalTokens,
        },
        null,
        2,
      ),
    )
  }

  // Human-readable output.
  console.log(`${figures.pointer} ${plugin.source}`)
  console.log(`    Name: ${plugin.name}`)
  console.log(`    Version: ${plugin.manifest.version ?? 'unknown'}`)
  console.log(`    Install path: ${plugin.path}`)
  console.log(
    `    Status: ${plugin.enabled !== false ? `${figures.tick} enabled` : `${figures.cross} disabled`}${plugin.isBuiltin ? ' (built-in)' : ''}`,
  )
  if (pluginErrors.length > 0) {
    for (const err of pluginErrors) {
      console.log(`    Error: ${err}`)
    }
  }
  console.log('')

  const printSection = (
    title: string,
    count: number,
    tokens: number,
    entries: Array<{ name: string; tokens: number; path?: string }>,
  ): void => {
    console.log(`  ${title}: ${count} (≈ ${tokens} tokens)`)
    for (const e of entries) {
      console.log(`    ${figures.pointer} ${e.name} — ${e.tokens} tokens`)
    }
    if (entries.length > 0) console.log('')
  }

  printSection(
    'Commands',
    commandFiles.length + inlineCommandEntries.length,
    commandTokenTotal,
    [
      ...commandFiles.map(f => ({
        name: f.name,
        tokens: f.tokens,
        path: f.path,
      })),
      ...inlineCommandEntries.map(c => ({
        name: `${c.name} (inline)`,
        tokens: c.tokens,
      })),
    ],
  )
  printSection(
    'Skills',
    skillEntries.length,
    skillTokenTotal,
    skillEntries.map(s => ({ name: s.name, tokens: s.tokens, path: s.path })),
  )
  printSection(
    'Agents',
    agentEntries.length,
    agentTokenTotal,
    agentEntries.map(a => ({ name: a.name, tokens: a.tokens, path: a.path })),
  )
  console.log(
    `  Hooks: ${hookSummary.length} event(s), ${hookSummary.reduce((acc, h) => acc + h.matcherCount, 0)} matcher(s) (≈ ${hookTokens} tokens)`,
  )
  for (const h of hookSummary) {
    console.log(
      `    ${figures.pointer} ${h.event}: ${h.matcherCount} matcher(s)`,
    )
  }
  if (hookSummary.length > 0) console.log('')
  printSection(
    'MCP servers',
    mcpSummary.length,
    mcpTokenTotal,
    mcpSummary.map(m => ({ name: m.name, tokens: m.tokens })),
  )
  // LSP listing — v2.1.142.
  printSection(
    'LSP servers',
    lspSummary.length,
    lspTokenTotal,
    lspSummary.map(l => ({ name: l.name, tokens: l.tokens })),
  )

  console.log(`  Total per-session tokens: ≈ ${totalTokens}`)
  cliOk()
}

// plugin update (lines 5918–5948)
export async function pluginUpdateHandler(
  plugin: string,
  options: { scope?: string; cowork?: boolean },
): Promise<void> {
  if (options.cowork) setUseCoworkPlugins(true)
  const { name, marketplace } = parsePluginIdentifier(plugin)
  logEvent('tengu_plugin_update_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
  })

  let scope: (typeof VALID_UPDATE_SCOPES)[number] = 'user'
  if (options.scope) {
    if (
      !VALID_UPDATE_SCOPES.includes(
        options.scope as (typeof VALID_UPDATE_SCOPES)[number],
      )
    ) {
      cliError(
        `Invalid scope "${options.scope}". Valid scopes: ${VALID_UPDATE_SCOPES.join(', ')}`,
      )
    }
    scope = options.scope as (typeof VALID_UPDATE_SCOPES)[number]
  }
  if (options.cowork && scope !== 'user') {
    cliError('--cowork can only be used with user scope')
  }

  await updatePluginCli(plugin, scope)
}
