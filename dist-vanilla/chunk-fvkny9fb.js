// @bun
import"./chunk-m1aqyck3.js";
import {
  cliError,
  cliOk
} from "./chunk-z2dp53wn.js";
import {
  filterExistingPaths,
  getKnownPathsForRepo,
  updateGithubRepoPathMapping
} from "./chunk-2d5e1eaw.js";
import {
  computeInitialTeamContext,
  createRemoteSessionConfig,
  getModelDeprecationWarning,
  getRelevantTips,
  refreshExampleCommands
} from "./chunk-3cjq6c4f.js";
import {
  processResumedConversation,
  skillChangeDetector
} from "./chunk-rs3a56ry.js";
import"./chunk-25xrkpnf.js";
import"./chunk-fxeq1g8e.js";
import {
  getBaseRenderOptions
} from "./chunk-gfseb3wc.js";
import {
  createStatsStore
} from "./chunk-vwv0jd80.js";
import {
  applyConfigEnvironmentVariables,
  applySafeConfigEnvironmentVariables,
  onChangeAppState
} from "./chunk-9repn0e3.js";
import"./chunk-x8b7vft8.js";
import"./chunk-vs07phhn.js";
import"./chunk-6n2qgm9v.js";
import {
  init_setup,
  setupClaudeInChrome,
  shouldAutoEnableClaudeInChrome,
  shouldEnableClaudeInChrome
} from "./chunk-hgpdgppd.js";
import {
  init_partition,
  partition_default
} from "./chunk-e0n3wce0.js";
import {
  init_releaseNotes,
  migrateChangelogFromConfig
} from "./chunk-tt59dtbd.js";
import {
  VALID_INSTALLABLE_SCOPES,
  VALID_UPDATE_SCOPES
} from "./chunk-y585t2zm.js";
import"./chunk-jnyvtta3.js";
import"./chunk-h5c9fsax.js";
import"./chunk-46e4vrhz.js";
import"./chunk-7dq274ma.js";
import"./chunk-kptsbbzr.js";
import {
  init_sink,
  initializeAnalyticsGates
} from "./chunk-29et9sxk.js";
import {
  BROWSER_TOOLS,
  init_src
} from "./chunk-gyj242zr.js";
import {
  ASK_USER_QUESTION_TOOL_NAME,
  AppStateProvider,
  CLAUDE_CODE_GUIDE_AGENT_TYPE,
  DEFAULT_BINDINGS,
  ENTER_PLAN_MODE_TOOL_NAME,
  EXIT_PLAN_MODE_TOOL_NAME,
  IDLE_SPECULATION_STATE,
  KeybindingSetup,
  MACOS_RESERVED,
  NON_REBINDABLE,
  SKILL_TOOL_NAME,
  SandboxManager,
  Select,
  SelectMulti,
  TERMINAL_RESERVED,
  acquireIdpIdToken,
  addMcpConfig,
  addToHistory,
  areMcpConfigsAllowedWithEnterpriseMcpConfig,
  asSessionId,
  assertMinVersion,
  cacheSessionTitle,
  canUserConfigureAdvisor,
  checkAndDisableBypassPermissions,
  checkOutTeleportedSessionBranch,
  checkQuotaStatus,
  cleanupOrphanedPluginVersionsInBackground,
  clearIdpClientSecret,
  clearIdpIdToken,
  clearPluginCache,
  clearServerCache,
  countConcurrentSessions,
  countFilesRoundedRg,
  createStore,
  createSyntheticOutputTool,
  createSystemMessage,
  createUserMessage,
  dedupClaudeAiMcpServers,
  describeMcpConfigFilePath,
  doesEnterpriseMcpConfigExist,
  downloadSessionFiles,
  ensureConfigScope,
  ensureScratchpadDir,
  ensureTransport,
  excludeCommandsByServer,
  excludeResourcesByServer,
  exports_BriefTool,
  exports_teammatePromptAddendum,
  fetchClaudeAIMcpConfigsIfEligible,
  filterCommandsForRemoteMode,
  filterMcpServersByPolicy,
  generateTempFilePath,
  getActiveAgentsFromList,
  getAgentDefinitionsWithOverrides,
  getCachedIdpIdToken,
  getCharBudget,
  getClaudeCodeMcpConfigs,
  getCommands,
  getDefaultAppState,
  getExternalClaudeMdIncludes,
  getGlobExclusionsForPluginCache,
  getIdpClientSecret,
  getInitialAdvisorSetting,
  getInitialEffortSetting,
  getManagedPluginNames,
  getMcpConfigsByScope,
  getMcpServerSignature,
  getMcpToolsCommandsAndResources,
  getMemoryFiles,
  getMessagesAfterCompactBoundary,
  getPluginSeedDirs,
  getProjectMcpServerStatus,
  getRemoteSessionUrl,
  getSessionIdFromLog,
  getSessionMemoryContent,
  getSettingsWithAllErrors,
  getSkillToolCommands,
  getSystemContext,
  getTmuxInstallInstructions,
  getTools,
  getUserContext,
  getWorktreePaths,
  getXaaIdpSettings,
  gracefulShutdown,
  gracefulShutdownSync,
  init_AppState,
  init_AppStateStore,
  init_BriefTool,
  init_CustomSelect,
  init_KeybindingProviderSetup,
  init_SelectMulti,
  init_Shell,
  init_SyntheticOutputTool,
  init_advisor,
  init_allErrors,
  init_api as init_api2,
  init_auth as init_auth2,
  init_autoUpdater,
  init_bundledSkills,
  init_cacheUtils,
  init_changeDetector,
  init_claudeAiLimits,
  init_claudeCodeGuideAgent,
  init_claudeai,
  init_claudemd,
  init_client as init_client2,
  init_commands1 as init_commands,
  init_concurrentSessions,
  init_config as init_config3,
  init_constants2 as init_constants3,
  init_constants3 as init_constants4,
  init_constants5,
  init_context as init_context2,
  init_conversationRecovery,
  init_defaultBindings,
  init_effort,
  init_filesApi,
  init_filesystem,
  init_frontmatterParser,
  init_getWorktreePaths,
  init_gracefulShutdown,
  init_grove,
  init_history,
  init_hookEvents,
  init_ids,
  init_installedPluginsManager,
  init_internalLogging,
  init_loadAgentsDir,
  init_loadUserBindings,
  init_managedPlugins,
  init_manager,
  init_mapValues,
  init_messages1 as init_messages,
  init_orphanedPluginFilter,
  init_permissionSetup,
  init_pluginDirectories,
  init_pluginLoader,
  init_pluginTelemetry,
  init_policyLimits,
  init_product,
  init_prompt6 as init_prompt,
  init_prompt8 as init_prompt2,
  init_promptSuggestion,
  init_remoteManagedSettings,
  init_reservedShortcuts,
  init_ripgrep,
  init_sandbox_adapter,
  init_sessionMemoryUtils,
  init_sessionStart,
  init_sessionStorage,
  init_store,
  init_teammatePromptAddendum,
  init_teleport,
  init_tempfile,
  init_thinking,
  init_tools1 as init_tools,
  init_uniqBy,
  init_utils,
  init_uuid,
  init_worktree,
  init_xaaIdpLogin,
  initialPermissionModeFromCLI,
  initializeLspServerManager,
  initializePolicyLimitsLoadingPromise,
  initializeRemoteManagedSettingsLoadingPromise,
  initializeToolPermissionContext,
  initializeVersionedPlugins,
  isAdvisorEnabled,
  isBuiltInAgent,
  isEligibleForRemoteManagedSettings,
  isKeybindingCustomizationEnabled,
  isPolicyAllowed,
  isPolicyLimitsEligible,
  isQualifiedForGrove,
  isScratchpadEnabled,
  isSyntheticOutputToolEnabled,
  isTmuxAvailable,
  isValidAdvisorModel,
  isXaaEnabled,
  issuerKey,
  loadAllPluginsCacheOnly,
  loadConversationForResume,
  loadPolicyLimits,
  loadRemoteManagedSettings,
  logContextMetrics,
  logPermissionContextForAnts,
  logPluginLoadErrors,
  logPluginsEnabledForSession,
  mapValues_default,
  modelSupportsAdvisor,
  parseAgentsFromJson,
  parseEffortValue,
  parseFileSpecs,
  parseFrontmatter,
  parseHeaders,
  parseMcpConfig,
  parseMcpConfigFromFilePath,
  parsePRReference,
  prefetchAllMcpResources,
  processMessagesForTeleportResume,
  processSessionStartHooks,
  processSetupHooks,
  readClientSecret,
  refreshPolicyLimits,
  refreshRemoteManagedSettings,
  registerBundledSkill,
  registerSession,
  saveAgentSetting,
  saveIdpClientSecret,
  saveIdpIdTokenFromJwt,
  saveMcpClientSecret,
  searchSessionsByCustomTitle,
  sessionIdExists,
  setAllHookEventsEnabled,
  setCwd,
  settingsChangeDetector,
  setupGracefulShutdown,
  shouldEnablePromptSuggestion,
  shouldEnableThinkingByDefault,
  shouldShowClaudeMdExternalIncludesWarning,
  shutdownLspServerManager,
  teleportToRemoteWithErrorHandling,
  uniqBy_default,
  updateSessionName,
  validateGitState,
  validateSessionRepository,
  validateUuid,
  waitForPolicyLimitsToLoad,
  waitForRemoteManagedSettingsToLoad
} from "./chunk-ekfe4t3x.js";
import {
  createEmptyAttributionState,
  init_commitAttribution
} from "./chunk-4xshe7tf.js";
import"./chunk-tdbeghs2.js";
import {
  getSessionIngressAuthToken,
  init_sessionIngressAuth
} from "./chunk-86h8sspq.js";
import"./chunk-hkxvdww3.js";
import"./chunk-9bwery1w.js";
import {
  exports_teammateModeSnapshot,
  init_teammateModeSnapshot
} from "./chunk-4c08gv68.js";
import {
  BASE_CHROME_PROMPT,
  Byline,
  CLAUDE_IN_CHROME_SKILL_HINT,
  ConfigurableShortcutHint,
  Dialog,
  KeyboardShortcutHint,
  init_Byline,
  init_ConfigurableShortcutHint,
  init_Dialog,
  init_KeyboardShortcutHint,
  init_prompt as init_prompt3
} from "./chunk-p9ra2v2f.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-4cwfa7zk.js";
import {
  DEFAULT_TASKS_MODE_TASK_LIST_ID,
  init_tasks
} from "./chunk-mjd4qde5.js";
import {
  CLAUDE_IN_CHROME_MCP_SERVER_NAME,
  init_common,
  isClaudeInChromeMCPServer
} from "./chunk-5g7gx4y7.js";
import {
  init_worktreeModeEnabled,
  isWorktreeModeEnabled
} from "./chunk-cgfdkzhb.js";
import {
  init_referral,
  prefetchPassesEligibility
} from "./chunk-sknn7p3z.js";
import"./chunk-2hb5pyjj.js";
import"./chunk-9gbamk79.js";
import"./chunk-1hjzbne1.js";
import"./chunk-djq17a7g.js";
import"./chunk-gypetngm.js";
import {
  Link,
  SHOW_CURSOR,
  ThemedBox_default,
  ThemedText,
  init_dec,
  init_ink,
  init_terminal,
  isSynchronizedOutputSupported,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  init_earlyInput,
  seedEarlyInput,
  stopCapturingEarlyInput
} from "./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import"./chunk-7nbhgtwq.js";
import"./chunk-zk2wsm7d.js";
import {
  fetchSession,
  init_api,
  prepareApiRequest
} from "./chunk-73re2yq9.js";
import"./chunk-j30w257d.js";
import {
  getTelemetryAttributes,
  init_betaSessionTracing,
  init_telemetryAttributes,
  isBetaTracingEnabled
} from "./chunk-fxerh6v6.js";
import {
  AGENT_TOOL_NAME,
  PERMISSION_MODES,
  SettingsSchema,
  checkHasTrustDialogAccepted,
  enableConfigs,
  ensureKeychainPrefetchCompleted,
  ensureMdmSettingsLoaded,
  ensureModelStringsInitialized,
  filterAllowedSdkBetas,
  getAPIProvider,
  getAnthropicApiKey,
  getAutoMemPath,
  getClaudeAIOAuthTokens,
  getClaudeCodeUserAgent,
  getContextWindowForModel,
  getCurrentProjectConfig,
  getCustomApiKeyStatus,
  getDefaultMainLoopModel,
  getDefaultMainLoopModelSetting,
  getFeatureValue_CACHED_MAY_BE_STALE,
  getGlobalConfig,
  getInitialFastModeSetting,
  getInitialSettings,
  getManagedSettingsKeysForLogging,
  getRemoteControlAtStartup,
  getSettingsFilePathForSource,
  getSettingsForSource,
  getSettingsWithErrors,
  getSettings_DEPRECATED,
  getSubscriptionType,
  getUserSpecifiedModelSetting,
  hasProfileScope,
  hasSkipDangerousModePermissionPrompt,
  initJetBrainsDetection,
  initUser,
  init_PermissionMode,
  init_agentSwarmsEnabled,
  init_auth,
  init_authPortable,
  init_betas1 as init_betas,
  init_client,
  init_config,
  init_config1 as init_config2,
  init_constants,
  init_constants1 as init_constants2,
  init_context,
  init_envDynamic,
  init_fastMode,
  init_growthbook,
  init_http,
  init_isEqual,
  init_keychainPrefetch,
  init_model,
  init_modelCapabilities,
  init_modelStrings,
  init_officialRegistry,
  init_paths,
  init_pickBy,
  init_providers,
  init_rawRead,
  init_settings,
  init_settings1 as init_settings2,
  init_source,
  init_stringUtils,
  init_types,
  init_user,
  init_userAgent,
  initializeGrowthBook,
  isAgentSwarmsEnabled,
  isAnalyticsDisabled,
  isAutoMemoryEnabled,
  isAutoUpdaterDisabled,
  isClaudeAISubscriber,
  isEqual_default,
  isFastModeEnabled,
  isLegacyModelRemapEnabled,
  isMaxSubscriber,
  isOpus1mMergeEnabled,
  isProSubscriber,
  isTeamPremiumSubscriber,
  normalizeApiKeyForConfig,
  normalizeModelStringForAPI,
  parseSettingSourcesFlag,
  parseUserSpecifiedModel,
  pickBy_default,
  plural,
  populateOAuthAccountInfoIfNeeded,
  prefetchAwsCredentialsAndBedRockInfoIfSafe,
  prefetchFastModeStatus,
  prefetchGcpCredentialsIfSafe,
  prefetchOfficialMcpUrls,
  recordFirstStartTime,
  refreshGrowthBookAfterAuthChange,
  refreshModelCapabilities,
  resetGrowthBook,
  resetUserCache,
  resolveFastModeStatusFromCache,
  saveCurrentProjectConfig,
  saveGlobalConfig,
  source_default,
  startKeychainPrefetch,
  startMdmRawRead,
  updateSettingsForSource,
  validateForceLoginOrg,
  withOAuth401Retry
} from "./chunk-w5d5b7r0.js";
import {
  init_json,
  safeParseJSON
} from "./chunk-0f1005z8.js";
import {
  init_windowsPaths,
  setShellIfWindows
} from "./chunk-ccq9c4dq.js";
import"./chunk-tg3zbmz7.js";
import {
  configureGlobalAgents,
  configureGlobalMTLS,
  init_mtls,
  init_proxy
} from "./chunk-3asghxv4.js";
import {
  count,
  exports_teammate,
  init_array,
  init_teammate,
  uniq
} from "./chunk-xk4zgzx2.js";
import {
  init_v4
} from "./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import {
  getPlatform,
  init_platform
} from "./chunk-2g1tm0n3.js";
import {
  exports_external,
  init_lazySchema,
  lazySchema,
  toJSONSchema
} from "./chunk-55wgxwa9.js";
import"./chunk-tbpx2160.js";
import"./chunk-4jm600zv.js";
import {
  init_bundledMode,
  isInBundledMode
} from "./chunk-7np1pz21.js";
import {
  OAUTH_BETA_HEADER,
  getOauthConfig,
  init_oauth
} from "./chunk-5cqfqj5r.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-1mc1wz9m.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import {
  formatFileSize,
  init_format,
  init_startupProfiler,
  profileCheckpoint,
  profileReport
} from "./chunk-ywhstzac.js";
import"./chunk-cdz5yb0r.js";
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
import {
  detectCurrentRepository,
  init_detectRepository
} from "./chunk-c4pgn9ph.js";
import {
  getBranch,
  getIsGit,
  getWorktreeCount,
  init_diagLogs,
  init_git,
  init_gitFilesystem,
  logForDiagnosticsNoPII
} from "./chunk-bjwxx22f.js";
import"./chunk-tjd99w4c.js";
import"./chunk-qnfx3qtx.js";
import {
  init_which,
  which
} from "./chunk-7z9e9ndj.js";
import"./chunk-sctqkknr.js";
import {
  execa,
  init_execa
} from "./chunk-ehab6nmr.js";
import {
  init_log,
  init_privacyLevel,
  isEssentialTrafficOnly,
  logError
} from "./chunk-myphr2va.js";
import"./chunk-8tnsngw2.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  ConfigParseError,
  TeleportOperationError,
  enableDebugLogging,
  errorMessage,
  getDebugLogPath,
  getErrnoCode,
  getFsImplementation,
  init_cleanupRegistry,
  init_debug,
  init_errors,
  init_fsOperations,
  init_slowOperations,
  isENOENT,
  jsonParse,
  jsonStringify,
  logForDebugging,
  registerCleanup,
  safeResolvePath,
  setHasFormattedOutput,
  toError,
  writeFileSync_DEPRECATED
} from "./chunk-cv4r43rj.js";
import {
  init_process,
  peekForStdinData,
  writeToStderr
} from "./chunk-fbv4apne.js";
import {
  getClaudeConfigHomeDir,
  hasNodeOption,
  init_envUtils,
  isBareMode,
  isEnvTruthy,
  isInProtectedNamespace,
  isRunningOnHomespace,
  parseEnvVars
} from "./chunk-er95axp1.js";
import {
  getInitialMainLoopModel,
  getIsNonInteractiveSession,
  getMainLoopModelOverride,
  getOriginalCwd,
  getSdkBetas,
  getSessionCounter,
  getSessionId,
  init_settingsCache,
  init_state,
  resetSettingsCache,
  setAdditionalDirectoriesForClaudeMd,
  setAllowedSettingSources,
  setChromeFlagOverride,
  setClientType,
  setFlagSettingsPath,
  setInitialMainLoopModel,
  setInlinePlugins,
  setIsInteractive,
  setIsRemoteMode,
  setMainLoopModelOverride,
  setMainThreadAgentType,
  setMeter,
  setOriginalCwd,
  setQuestionPreviewFormat,
  setSdkBetas,
  setSessionBypassPermissionsMode,
  setSessionPersistenceDisabled,
  setSessionSource,
  setSessionTrustAccepted,
  setStatsStore,
  setTeleportedSessionInfo,
  setUserMsgOptIn,
  switchSession
} from "./chunk-24stks7b.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import {
  axios_default,
  init_axios
} from "./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __commonJS,
  __require,
  __toCommonJS,
  __toESM
} from "./chunk-qp2qdcda.js";

// node_modules/.bun/commander@13.1.0/node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, "commander.invalidArgument", message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/.bun/commander@13.1.0/node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || "";
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case "<":
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case "[":
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.length > 3 && this._name.slice(-3) === "...") {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
    return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/.bun/commander@13.1.0/node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.minWidthToWrap = 40;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    prepareContext(contextOptions) {
      this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions)
        return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
      return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command))));
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument))));
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + "|" + cmd._aliases[0];
      }
      let ancestorCmdNames = "";
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + " " + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (option.defaultValue !== undefined) {
        const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
        if (showDefault) {
          extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        return `${option.description} (${extraInfo.join(", ")})`;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(", ")})`;
        if (argument.description) {
          return `${argument.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return argument.description;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth ?? 80;
      function callFormatItem(term, description) {
        return helper.formatItem(term, termWidth, description, helper);
      }
      let output = [
        `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
        ""
      ];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
          ""
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return callFormatItem(helper.styleArgumentTerm(helper.argumentTerm(argument)), helper.styleArgumentDescription(helper.argumentDescription(argument)));
      });
      if (argumentList.length > 0) {
        output = output.concat([
          helper.styleTitle("Arguments:"),
          ...argumentList,
          ""
        ]);
      }
      const optionList = helper.visibleOptions(cmd).map((option) => {
        return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
      });
      if (optionList.length > 0) {
        output = output.concat([
          helper.styleTitle("Options:"),
          ...optionList,
          ""
        ]);
      }
      if (helper.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
        });
        if (globalOptionList.length > 0) {
          output = output.concat([
            helper.styleTitle("Global Options:"),
            ...globalOptionList,
            ""
          ]);
        }
      }
      const commandList = helper.visibleCommands(cmd).map((cmd2) => {
        return callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(cmd2)), helper.styleSubcommandDescription(helper.subcommandDescription(cmd2)));
      });
      if (commandList.length > 0) {
        output = output.concat([
          helper.styleTitle("Commands:"),
          ...commandList,
          ""
        ]);
      }
      return output.join(`
`);
    }
    displayWidth(str) {
      return stripColor(str).length;
    }
    styleTitle(str) {
      return str;
    }
    styleUsage(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word === "[command]")
          return this.styleSubcommandText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleCommandText(word);
      }).join(" ");
    }
    styleCommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleOptionDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleSubcommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleArgumentDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleDescriptionText(str) {
      return str;
    }
    styleOptionTerm(str) {
      return this.styleOptionText(str);
    }
    styleSubcommandTerm(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleSubcommandText(word);
      }).join(" ");
    }
    styleArgumentTerm(str) {
      return this.styleArgumentText(str);
    }
    styleOptionText(str) {
      return str;
    }
    styleArgumentText(str) {
      return str;
    }
    styleSubcommandText(str) {
      return str;
    }
    styleCommandText(str) {
      return str;
    }
    padWidth(cmd, helper) {
      return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    preformatted(str) {
      return /\n[^\S\r\n]/.test(str);
    }
    formatItem(term, termWidth, description, helper) {
      const itemIndent = 2;
      const itemIndentStr = " ".repeat(itemIndent);
      if (!description)
        return itemIndentStr + term;
      const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
      const spacerWidth = 2;
      const helpWidth = this.helpWidth ?? 80;
      const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
      let formattedDescription;
      if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
        formattedDescription = description;
      } else {
        const wrappedDescription = helper.boxWrap(description, remainingWidth);
        formattedDescription = wrappedDescription.replace(/\n/g, `
` + " ".repeat(termWidth + spacerWidth));
      }
      return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
    }
    boxWrap(str, width) {
      if (width < this.minWidthToWrap)
        return str;
      const rawLines = str.split(/\r\n|\n/);
      const chunkPattern = /[\s]*[^\s]+/g;
      const wrappedLines = [];
      rawLines.forEach((line) => {
        const chunks = line.match(chunkPattern);
        if (chunks === null) {
          wrappedLines.push("");
          return;
        }
        let sumChunks = [chunks.shift()];
        let sumWidth = this.displayWidth(sumChunks[0]);
        chunks.forEach((chunk) => {
          const visibleWidth = this.displayWidth(chunk);
          if (sumWidth + visibleWidth <= width) {
            sumChunks.push(chunk);
            sumWidth += visibleWidth;
            return;
          }
          wrappedLines.push(sumChunks.join(""));
          const nextChunk = chunk.trimStart();
          sumChunks = [nextChunk];
          sumWidth = this.displayWidth(nextChunk);
        });
        wrappedLines.push(sumChunks.join(""));
      });
      return wrappedLines.join(`
`);
    }
  }
  function stripColor(str) {
    const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
    return str.replace(sgrPattern, "");
  }
  exports.Help = Help;
  exports.stripColor = stripColor;
});

// node_modules/.bun/commander@13.1.0/node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || "";
      this.required = flags.includes("<");
      this.optional = flags.includes("[");
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith("--no-");
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === "string") {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, "");
      }
      return this.short.replace(/^-/, "");
    }
    attributeName() {
      if (this.negate) {
        return camelcase(this.name().replace(/^no-/, ""));
      }
      return camelcase(this.name());
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map;
      this.negativeOptions = new Map;
      this.dualOptions = new Set;
      options.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey))
        return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str) {
    return str.split("-").reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const shortFlagExp = /^-[^-]$/;
    const longFlagExp = /^--[^-]/;
    const flagParts = flags.split(/[ |,]+/).concat("guard");
    if (shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (longFlagExp.test(flagParts[0]))
      longFlag = flagParts.shift();
    if (!shortFlag && shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (!shortFlag && longFlagExp.test(flagParts[0])) {
      shortFlag = longFlag;
      longFlag = flagParts.shift();
    }
    if (flagParts[0].startsWith("-")) {
      const unsupportedFlag = flagParts[0];
      const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
      if (/^-[^-][^-]/.test(unsupportedFlag))
        throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
      if (shortFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many short flags`);
      if (longFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many long flags`);
      throw new Error(`${baseError}
- unrecognised flag format`);
    }
    if (shortFlag === undefined && longFlag === undefined)
      throw new Error(`option creation failed due to no flags found in '${flags}'.`);
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// node_modules/.bun/commander@13.1.0/node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0;i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0;j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1;j <= b.length; j++) {
      for (let i = 1;i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0)
      return "";
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith("--");
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1)
        return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(", ")}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return "";
  }
  exports.suggestSimilar = suggestSimilar;
});

// node_modules/.bun/commander@13.1.0/node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var EventEmitter = __require("events").EventEmitter;
  var childProcess = __require("child_process");
  var path = __require("path");
  var fs = __require("fs");
  var process2 = __require("process");
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help, stripColor } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = false;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || "";
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = "";
      this._summary = "";
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._savedState = null;
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        outputError: (str, write) => write(str),
        getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : undefined,
        getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
        getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
        stripColor: (str) => stripColor(str)
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this;command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args)
        cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc)
        return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help, this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined)
        return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined)
        return this._outputConfiguration;
      Object.assign(this._outputConfiguration, configuration);
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== "string")
        displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden)
        cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, fn, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof fn === "function") {
        argument.default(defaultValue).argParser(fn);
      } else {
        argument.default(fn);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names.trim().split(/ +/).forEach((detail) => {
        this.argument(detail);
      });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument && previousArgument.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
        throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === "boolean") {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        return this;
      }
      enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
      const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? "display help for command";
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs)
        helpCommand.arguments(helpArgs);
      if (helpDescription)
        helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== "object") {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ["preSubcommand", "preAction", "postAction"];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {}
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === "commander.invalidArgument") {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
      if (matchingOption) {
        const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
        const newCmd = knownBy(command).join("|");
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
      }
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, "default");
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, "default");
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._concatValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = "";
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on("option:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "cli");
      });
      if (option.envVar) {
        this.on("optionEnv:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "env");
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === "object" && flags instanceof Option) {
        throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === "function") {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error("call .storeOptionsAsProperties() before adding options");
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error("call .storeOptionsAsProperties() before setting option values");
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error("first parameter to parse must be array or undefined");
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = "electron";
        }
        const execArgv = process2.execArgv ?? [];
        if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
          parseOptions.from = "eval";
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case "node":
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case "electron":
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case "user":
          userArgs = argv.slice(0);
          break;
        case "eval":
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || "program";
      return userArgs;
    }
    parse(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _prepareForParse() {
      if (this._savedState === null) {
        this.saveStateBeforeParse();
      } else {
        this.restoreStateBeforeParse();
      }
    }
    saveStateBeforeParse() {
      this._savedState = {
        _name: this._name,
        _optionValues: { ...this._optionValues },
        _optionValueSources: { ...this._optionValueSources }
      };
    }
    restoreStateBeforeParse() {
      if (this._storeOptionsAsProperties)
        throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
      this._name = this._savedState._name;
      this._scriptPath = null;
      this.rawArgs = [];
      this._optionValues = { ...this._savedState._optionValues };
      this._optionValueSources = { ...this._savedState._optionValueSources };
      this.args = [];
      this.processedArgs = [];
    }
    _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
      if (fs.existsSync(executableFile))
        return;
      const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
      const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
      throw new Error(executableMissing);
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin))
          return localBin;
        if (sourceExt.includes(path.extname(baseName)))
          return;
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
        if (foundExt)
          return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || "";
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== "win32") {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
        }
      } else {
        this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
      }
      if (!proc.killed) {
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on("close", (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
        }
      });
      proc.on("error", (err) => {
        if (err.code === "ENOENT") {
          this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        } else if (err.code === "EACCES") {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand)
        this.help({ error: true });
      subCommand._prepareForParse();
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise && promise.then && typeof promise.then === "function") {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== undefined).forEach((hookedCommand) => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
      if (event === "postAction") {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
        promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
        return promiseChain;
      }
      if (this.parent && this.parent.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand("*")) {
          return this._dispatchSubcommand("*", operands, unknown);
        }
        if (this.listenerCount("command:*")) {
          this.emit("command:*", operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name)
        return;
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== "default";
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(argv) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      const args = argv.slice();
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === "-";
      }
      let activeVariadicOption = null;
      while (args.length) {
        const arg = args.shift();
        if (arg === "--") {
          if (dest === unknown)
            dest.push(arg);
          dest.push(...args);
          break;
        }
        if (activeVariadicOption && !maybeOption(arg)) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args.shift();
              if (value === undefined)
                this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (args.length > 0 && !maybeOption(args[0])) {
                value = args.shift();
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || option.optional && this._combineFlagAndOptionalValue) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              args.unshift(`-${arg.slice(2)}`);
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf("=");
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (maybeOption(arg)) {
          dest = unknown;
        }
        if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg);
            if (args.length > 0)
              operands.push(...args);
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg);
          if (args.length > 0)
            dest.push(...args);
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0;i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(`${message}
`, this._outputConfiguration.writeErr);
      if (typeof this._showHelpAfterError === "string") {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || "commander.error";
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === undefined || ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return this.getOptionValue(optionKey) !== undefined && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
      };
      this.options.filter((option) => option.implied !== undefined && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
        Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
          this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
        });
      });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: "commander.missingArgument" });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: "commander.optionMissingArgument" });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: "commander.missingMandatoryOptionValue" });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
        const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
        if (negativeOption && (negativeOption.presetArg === undefined && optionValue === false || negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === "env") {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: "commander.conflictingOption" });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption)
        return;
      let suggestion = "";
      if (flag.startsWith("--") && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: "commander.unknownOption" });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments)
        return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? "" : "s";
      const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: "commander.excessArguments" });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = "";
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp().visibleCommands(this).forEach((command) => {
          candidateNames.push(command.name());
          if (command.alias())
            candidateNames.push(command.alias());
        });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: "commander.unknownCommand" });
    }
    version(str, flags, description) {
      if (str === undefined)
        return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on("option:" + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}
`);
        this._exit(0, "commander.version", str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined)
        return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined)
        return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined)
        return this._aliases[0];
      let command = this;
      if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
        throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined)
        return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage)
          return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined)
        return this._name;
      this._name = str;
      return this;
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined)
        return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      const context = this._getOutputContext(contextOptions);
      helper.prepareContext({
        error: context.error,
        helpWidth: context.helpWidth,
        outputHasColors: context.hasColors
      });
      const text = helper.formatHelp(this, helper);
      if (context.hasColors)
        return text;
      return this._outputConfiguration.stripColor(text);
    }
    _getOutputContext(contextOptions) {
      contextOptions = contextOptions || {};
      const error = !!contextOptions.error;
      let baseWrite;
      let hasColors;
      let helpWidth;
      if (error) {
        baseWrite = (str) => this._outputConfiguration.writeErr(str);
        hasColors = this._outputConfiguration.getErrHasColors();
        helpWidth = this._outputConfiguration.getErrHelpWidth();
      } else {
        baseWrite = (str) => this._outputConfiguration.writeOut(str);
        hasColors = this._outputConfiguration.getOutHasColors();
        helpWidth = this._outputConfiguration.getOutHelpWidth();
      }
      const write = (str) => {
        if (!hasColors)
          str = this._outputConfiguration.stripColor(str);
        return baseWrite(str);
      };
      return { error, write, hasColors, helpWidth };
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === "function") {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const outputContext = this._getOutputContext(contextOptions);
      const eventContext = {
        error: outputContext.error,
        write: outputContext.write,
        command: this
      };
      this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
      this.emit("beforeHelp", eventContext);
      let helpInformation = this.helpInformation({ error: outputContext.error });
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
          throw new Error("outputHelp callback must return a string or a Buffer");
        }
      }
      outputContext.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit("afterHelp", eventContext);
      this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", eventContext));
    }
    helpOption(flags, description) {
      if (typeof flags === "boolean") {
        if (flags) {
          this._helpOption = this._helpOption ?? undefined;
        } else {
          this._helpOption = null;
        }
        return this;
      }
      flags = flags ?? "-h, --help";
      description = description ?? "display help for command";
      this._helpOption = this.createOption(flags, description);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = Number(process2.exitCode ?? 0);
      if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
        exitCode = 1;
      }
      this._exit(exitCode, "commander.help", "(outputHelp)");
    }
    addHelpText(position, text) {
      const allowedValues = ["beforeAll", "before", "after", "afterAll"];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === "function") {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}
`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith("--inspect")) {
        return arg;
      }
      let debugOption;
      let debugHost = "127.0.0.1";
      let debugPort = "9229";
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== "0") {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  function useColor() {
    if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
      return false;
    if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== undefined)
      return true;
    return;
  }
  exports.Command = Command;
  exports.useColor = useColor;
});

// node_modules/.bun/commander@13.1.0/node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command;
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) => new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// node_modules/.bun/@commander-js+extra-typings@14.0.0+1cee9bec6fc8d393/node_modules/@commander-js/extra-typings/index.js
var require_extra_typings = __commonJS((exports, module) => {
  var commander = require_commander();
  exports = module.exports = {};
  exports.program = new commander.Command;
  exports.Argument = commander.Argument;
  exports.Command = commander.Command;
  exports.CommanderError = commander.CommanderError;
  exports.Help = commander.Help;
  exports.InvalidArgumentError = commander.InvalidArgumentError;
  exports.InvalidOptionArgumentError = commander.InvalidArgumentError;
  exports.Option = commander.Option;
  exports.createCommand = (name) => new commander.Command(name);
  exports.createOption = (flags, description) => new commander.Option(flags, description);
  exports.createArgument = (name, description) => new commander.Argument(name, description);
});

// src/main.tsx
init_startupProfiler();
init_rawRead();
init_keychainPrefetch();

// node_modules/.bun/@commander-js+extra-typings@14.0.0+1cee9bec6fc8d393/node_modules/@commander-js/extra-typings/esm.mjs
var import__ = __toESM(require_extra_typings(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  Command,
  Argument,
  Option,
  Help
} = import__.default;

// src/main.tsx
init_source();
init_mapValues();
init_pickBy();
init_uniqBy();
init_oauth();
init_product();
init_context2();
import { readFileSync as readFileSync2 } from "fs";

// src/entrypoints/init.ts
init_startupProfiler();
init_state();
init_config2();
init_memoize();
init_state();
init_state();
init_manager();
init_client();
init_policyLimits();
init_remoteManagedSettings();
import { existsSync as existsSync2, cpSync, copyFileSync } from "fs";
import { join as join2 } from "path";
import { homedir as homedir2 } from "os";

// src/utils/apiPreconnect.ts
init_oauth();
init_envUtils();
var fired = false;
function preconnectAnthropicApi() {
  if (fired)
    return;
  fired = true;
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) || isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) || isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)) {
    return;
  }
  if (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || process.env.ANTHROPIC_UNIX_SOCKET || process.env.CLAUDE_CODE_CLIENT_CERT || process.env.CLAUDE_CODE_CLIENT_KEY) {
    return;
  }
  const baseUrl = process.env.ANTHROPIC_BASE_URL || getOauthConfig().BASE_API_URL;
  fetch(baseUrl, {
    method: "HEAD",
    signal: AbortSignal.timeout(1e4)
  }).catch(() => {});
}

// src/utils/caCertsConfig.ts
init_config2();
init_debug();
init_settings2();
function applyExtraCACertsFromConfig() {
  if (process.env.NODE_EXTRA_CA_CERTS) {
    return;
  }
  const configPath = getExtraCertsPathFromConfig();
  if (configPath) {
    process.env.NODE_EXTRA_CA_CERTS = configPath;
    logForDebugging(`CA certs: Applied NODE_EXTRA_CA_CERTS from config to process.env: ${configPath}`);
  }
}
function getExtraCertsPathFromConfig() {
  try {
    const globalConfig = getGlobalConfig();
    const globalEnv = globalConfig?.env;
    const settings = getSettingsForSource("userSettings");
    const settingsEnv = settings?.env;
    logForDebugging(`CA certs: Config fallback - globalEnv keys: ${globalEnv ? Object.keys(globalEnv).join(",") : "none"}, settingsEnv keys: ${settingsEnv ? Object.keys(settingsEnv).join(",") : "none"}`);
    const path = settingsEnv?.NODE_EXTRA_CA_CERTS || globalEnv?.NODE_EXTRA_CA_CERTS;
    if (path) {
      logForDebugging(`CA certs: Found NODE_EXTRA_CA_CERTS in config/settings: ${path}`);
    }
    return path;
  } catch (error) {
    logForDebugging(`CA certs: Config fallback failed: ${error}`, {
      level: "error"
    });
    return;
  }
}

// src/entrypoints/init.ts
init_cleanupRegistry();
init_config2();
init_debug();
init_detectRepository();
init_diagLogs();
init_envDynamic();
init_envUtils();
init_errors();
init_gracefulShutdown();
init_mtls();
init_filesystem();
init_proxy();
init_betaSessionTracing();
init_telemetryAttributes();
init_windowsPaths();

// src/utils/hello2ccInstaller.ts
init_envUtils();
init_debug();
import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
var HELLO2CC_FILES = [
  ["scripts/orchestrator.mjs", `#!/usr/bin/env node
import { normalizeAgentTeamSemantics } from './lib/agent-input.mjs';
import { configuredModels } from './lib/config.mjs';
import { resolvedAgentModelOverride } from './lib/agent-models.mjs';
import {
  allowWithUpdatedInput,
  emptySuppress,
  maybeDumpPayload,
  readStdinJson,
  suppressHook,
} from './lib/hook-io.mjs';
import { buildRouteSteps, buildSessionStartContext, extractPromptText } from './lib/native-context.mjs';
import {
  clearAllSessionContexts,
  clearSessionContext,
  rememberSessionContext,
  rememberPromptSignals,
  readSessionContext,
} from './lib/session-state.mjs';
import { classifyPrompt, isSubagentPrompt, startsWithExplicitCommand } from './lib/prompt-signals.mjs';

const cmd = process.argv[2] || '';

function currentSessionContext(payload = {}) {
  return {
    ...readSessionContext(payload?.session_id),
    ...rememberSessionContext(payload),
  };
}

async function cmdSessionStart() {
  const payload = readStdinJson('orchestrator.mjs');
  const sessionContext = currentSessionContext(payload);

  suppressHook('SessionStart', buildSessionStartContext(sessionContext));
}

async function cmdRoute() {
  const payload = readStdinJson('orchestrator.mjs');
  const sessionContext = currentSessionContext(payload);
  maybeDumpPayload('route', payload);

  const prompt = extractPromptText(payload).trim();
  if (!prompt || startsWithExplicitCommand(prompt) || isSubagentPrompt(prompt)) {
    emptySuppress();
    return;
  }

  const signals = classifyPrompt(prompt);
  rememberPromptSignals(payload?.session_id, signals);

  const additionalContext = buildRouteSteps(prompt, sessionContext);
  if (!additionalContext) {
    emptySuppress();
    return;
  }

  suppressHook('UserPromptSubmit', additionalContext);
}

async function cmdPreAgentModel() {
  const payload = readStdinJson('orchestrator.mjs');
  const input = payload.tool_input || {};
  const sessionContext = currentSessionContext(payload);

  if (payload.tool_name && payload.tool_name !== 'Agent') {
    emptySuppress();
    return;
  }

  const teamNormalization = normalizeAgentTeamSemantics(input, sessionContext);
  const override = resolvedAgentModelOverride(teamNormalization.input, configuredModels(sessionContext));
  if (!override.model && !teamNormalization.changed) {
    emptySuppress();
    return;
  }

  const updatedInput = {
    ...teamNormalization.input,
    ...(override.model ? { model: override.model } : {}),
  };
  const reasons = [
    teamNormalization.reason,
    override.reason,
  ].filter(Boolean);

  allowWithUpdatedInput(
    updatedInput,
    reasons.join('; '),
  );
}

async function cmdConfigChange() {
  const payload = readStdinJson('orchestrator.mjs');
  const source = String(payload?.source || '').trim();
  const sessionId = String(payload?.session_id || '').trim();

  if (source === 'user_settings' || source === 'policy_settings') {
    clearAllSessionContexts();
  } else if (sessionId) {
    clearSessionContext(sessionId);
  }

  emptySuppress();
}

async function main() {
  switch (cmd) {
    case 'session-start':
      await cmdSessionStart();
      break;
    case 'route':
      await cmdRoute();
      break;
    case 'pre-agent-model':
      await cmdPreAgentModel();
      break;
    case 'config-change':
      await cmdConfigChange();
      break;
    default:
      process.stderr.write(\`orchestrator.mjs: unknown command "\${cmd}"\\n\`);
      process.exit(1);
  }
}

await main();
`],
  ["scripts/subagent-context.mjs", `#!/usr/bin/env node
const cmd = process.argv[2] || '';

function writeJson(additionalContext) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SubagentStart',
      additionalContext,
    },
    suppressOutput: true,
  }));
}

const contexts = {
  explore: [
    '# hello2cc Explore mode',
    '',
    '- Follow the parent task and any higher-priority \`CLAUDE.md\` / project formatting rules; do not restyle the response on your own.',
    '- Stay read-only unless the parent task explicitly asks for changes.',
    '- Start with native search and targeted reads; use \`ToolSearch\` only for capability uncertainty, MCP discovery, or tool availability questions.',
    '- Return exact file paths, concrete symbols or interfaces, and any remaining unknowns.',
    '- When comparing candidates, entry points, or risks, prefer a compact Markdown table; use ASCII only when plain text layout is necessary.',
    '- Parallelize independent searches when doing so improves coverage.',
  ].join('\\n'),
  plan: [
    '# hello2cc Plan mode',
    '',
    '- Follow the parent task and any higher-priority \`CLAUDE.md\` / project formatting rules; do not restyle the response on your own.',
    '- Convert findings into an executable plan with ordered phases, dependencies, validation checks, and rollback risks.',
    '- Call out which slices stay in the main thread, which should become parallel native \`Agent\` work, and which ones truly need a persistent team workflow.',
    '- Use tables for task matrices, ownership splits, or trade-off comparisons when that makes the plan easier to scan.',
    '- Keep the plan concrete enough that a \`General-Purpose\` teammate can implement one slice without reinterpretation.',
  ].join('\\n'),
  general: [
    '# hello2cc General-Purpose mode',
    '',
    '- Follow the parent task and any higher-priority \`CLAUDE.md\` / project formatting rules; do not restyle the response on your own.',
    '- Stay tightly scoped to the assigned slice; avoid broad repo-wide drift.',
    '- Prefer surgical edits in existing files, use dedicated tools before shell when possible, and run the narrowest relevant validation before reporting done.',
    '- Summarize changed files, validations, and remaining risks in a compact table when there are multiple items.',
    '- Report outcomes faithfully: if a validation failed or was not run, say so plainly.',
    '- If the task needs more context or a split into multiple tracks, say so explicitly instead of improvising a team in plain text.',
  ].join('\\n'),
};

switch (cmd) {
  case 'explore':
    writeJson(contexts.explore);
    break;
  case 'plan':
    writeJson(contexts.plan);
    break;
  case 'general':
    writeJson(contexts.general);
    break;
  default:
    process.stderr.write(\`subagent-context.mjs: unknown command "\${cmd}"\\n\`);
    process.exit(1);
}
`],
  ["scripts/subagent-stop.mjs", `#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateSubagentStop } from './lib/subagent-quality.mjs';

function readStdinJson() {
  try {
    const raw = readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    process.stderr.write(\`subagent-stop.mjs: failed to parse stdin JSON: \${error.message}\\n\`);
    return {};
  }
}

const payload = readStdinJson();
const feedback = validateSubagentStop(payload.agent_type, payload.last_assistant_message);

if (feedback) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: feedback,
  }));
}
`],
  ["scripts/task-lifecycle.mjs", `#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateTaskDefinition } from './lib/task-quality.mjs';

function readStdinJson() {
  try {
    const raw = readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    process.stderr.write(\`task-lifecycle.mjs: failed to parse stdin JSON: \${error.message}\\n\`);
    return {};
  }
}

const payload = readStdinJson();
const feedback = validateTaskDefinition(payload);

if (feedback) {
  process.stderr.write(\`\${feedback} Tighten the task spec or completion evidence before marking it done.\\n\`);
  process.exit(2);
}

`],
  ["scripts/lib/agent-input.mjs", `function trimmed(value) {
  return String(value || '').trim();
}

const IMPLICIT_ASSISTANT_TEAM_NAMES = new Set(['main', 'default']);

function isImplicitAssistantTeamName(value) {
  return IMPLICIT_ASSISTANT_TEAM_NAMES.has(trimmed(value).toLowerCase());
}

function stripAgentTeamFields(input) {
  const updatedInput = { ...input };
  delete updatedInput.name;
  delete updatedInput.team_name;
  return updatedInput;
}

export function normalizeAgentTeamSemantics(input = {}, sessionContext = {}) {
  const workerName = trimmed(input?.name);
  const explicitTeamName = trimmed(input?.team_name);
  const activeTeamName = trimmed(sessionContext?.teamName);
  const teamWorkflow = Boolean(sessionContext?.lastPromptSignals?.teamWorkflow);
  const hasTeamSemantics = Boolean(workerName || explicitTeamName);
  const activeTeamIsImplicit = isImplicitAssistantTeamName(activeTeamName);
  const explicitTeamIsImplicit = isImplicitAssistantTeamName(explicitTeamName);

  if (!hasTeamSemantics) {
    return { input, changed: false, reason: '' };
  }

  if (!teamWorkflow) {
    return {
      input: stripAgentTeamFields(input),
      changed: true,
      reason: 'hello2cc normalized Agent to plain subagent semantics by removing implicit team fields outside explicit team workflows',
    };
  }

  if (explicitTeamName && !explicitTeamIsImplicit) {
    return { input, changed: false, reason: '' };
  }

  if (activeTeamName && !activeTeamIsImplicit) {
    return {
      input: {
        ...input,
        team_name: activeTeamName,
      },
      changed: true,
      reason: \`hello2cc made Agent.team_name explicit from active team context (\${activeTeamName})\`,
    };
  }

  return {
    input: stripAgentTeamFields(input),
    changed: true,
    reason: 'hello2cc blocked implicit assistant team semantics until TeamCreate or a real explicit team_name is available',
  };
}
`],
  ["scripts/lib/agent-models.mjs", `function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const HOST_AGENT_MODEL_SLOTS = ['opus', 'sonnet', 'haiku'];

export function canonicalAgentType(input) {
  const raw = String(input?.subagent_type || input?.agent_type || input?.name || '').trim();
  if (!raw) return '';

  const slug = normalizeSlug(raw);

  if (slug === 'explore') return 'Explore';
  if (slug === 'plan') return 'Plan';

  if ([
    'general-purpose',
    'general-purpose-agent',
    'generalpurpose',
  ].includes(slug)) {
    return 'general-purpose';
  }

  if ([
    'claude-code-guide',
    'claude-code-guide-agent',
    'claude-guide',
    'claudecodeguide',
  ].includes(slug)) {
    return 'claude-code-guide';
  }

  return raw;
}

export function hostAgentModelSlot(value) {
  const slug = normalizeSlug(value);
  if (!slug) return '';

  for (const slot of HOST_AGENT_MODEL_SLOTS) {
    if (
      slug === slot ||
      slug.startsWith(\`\${slot}-\`) ||
      slug.endsWith(\`-\${slot}\`) ||
      slug.includes(\`-\${slot}-\`)
    ) {
      return slot;
    }
  }

  return '';
}

export function preferredModelForAgent(input, config) {
  if (!input || config.routingPolicy === 'prompt-only' || input.model) {
    return '';
  }

  const agentType = canonicalAgentType(input);
  const teamName = String(input?.team_name || '').trim();
  const hasTeamName = Boolean(teamName);

  if (agentType === 'claude-code-guide') {
    return config.guideModel || config.sessionModel || config.primaryModel || '';
  }

  if (agentType === 'Explore') {
    return config.exploreModel || config.sessionModel || config.subagentModel || config.primaryModel || '';
  }

  if (agentType === 'Plan' && config.explicitPlanModel) {
    return config.planModel || '';
  }

  if (agentType === 'general-purpose' && hasTeamName) {
    if (!config.explicitTeamModel && !config.explicitSubagentModel) {
      return '';
    }

    return config.teamModel || config.subagentModel || config.generalModel || config.primaryModel || '';
  }

  if (agentType === 'general-purpose') {
    if (!config.explicitGeneralModel && !config.explicitSubagentModel) {
      return '';
    }

    return config.generalModel || config.subagentModel || config.primaryModel || '';
  }

  if (hasTeamName) {
    if (!config.explicitTeamModel && !config.explicitSubagentModel) {
      return '';
    }

    return config.teamModel || config.subagentModel || config.generalModel || config.primaryModel || '';
  }

  if (!agentType) {
    return config.explicitSubagentModel ? config.subagentModel || '' : '';
  }

  if (config.explicitSubagentModel) {
    return config.subagentModel || '';
  }

  return '';
}

export function resolvedAgentModelOverride(input, config) {
  const preferredModel = preferredModelForAgent(input, config);
  if (!preferredModel) {
    return { model: '', reason: '' };
  }

  const directSlot = hostAgentModelSlot(preferredModel);
  if (directSlot) {
    return {
      model: directSlot,
      reason: \`hello2cc injected Agent.model=\${directSlot}\`,
    };
  }

  const fallbackSlot = [
    config?.sessionModel,
    config?.primaryModel,
  ]
    .map(hostAgentModelSlot)
    .find(Boolean) || '';

  if (!fallbackSlot) {
    return { model: '', reason: '' };
  }

  return {
    model: fallbackSlot,
    reason: \`hello2cc normalized unsupported Agent.model=\${preferredModel} to host-safe slot=\${fallbackSlot}\`,
  };
}
`],
  ["scripts/lib/config.mjs", `export const FORCED_OUTPUT_STYLE_NAME = 'hello2cc:hello2cc Native';

export function envValue(name) {
  return String(process.env[name] || '').trim();
}

export function pluginOption(key) {
  return envValue(\`CLAUDE_PLUGIN_OPTION_\${key.toUpperCase()}\`);
}

export function configuredPolicy() {
  return pluginOption('routing_policy') || 'native-inject';
}

export function configuredMirrorSessionModel() {
  return pluginOption('mirror_session_model') !== 'false';
}

function mirroredSessionModel(sessionContext) {
  if (!configuredMirrorSessionModel()) return '';

  return String(
    sessionContext?.mainModel ||
    sessionContext?.model ||
    '',
  ).trim();
}

export function configuredModels(sessionContext = {}) {
  const sessionModel = mirroredSessionModel(sessionContext);
  const primaryModelOption = pluginOption('primary_model');
  const subagentModelOption = pluginOption('subagent_model');
  const guideModelOption = pluginOption('guide_model');
  const exploreModelOption = pluginOption('explore_model');
  const planModelOption = pluginOption('plan_model');
  const generalModelOption = pluginOption('general_model');
  const teamModelOption = pluginOption('team_model');

  const primaryModel = primaryModelOption || sessionModel || '';
  const subagentFallback = envValue('CLAUDE_CODE_SUBAGENT_MODEL');
  const subagentModel = subagentModelOption || subagentFallback || sessionModel || primaryModel || '';
  const guideModel = guideModelOption || sessionModel || primaryModel || '';
  const exploreModel = exploreModelOption || sessionModel || subagentModel || primaryModel || '';
  const planModel = planModelOption || primaryModel || sessionModel || subagentModel || '';
  const generalModel = generalModelOption || primaryModel || subagentModel || sessionModel || '';
  const teamModel = teamModelOption || subagentModel || generalModel || primaryModel || sessionModel || '';

  return {
    routingPolicy: configuredPolicy(),
    mirrorSessionModel: configuredMirrorSessionModel(),
    sessionModel,
    primaryModel,
    subagentModel,
    guideModel,
    exploreModel,
    planModel,
    generalModel,
    teamModel,
    explicitPrimaryModel: Boolean(primaryModelOption),
    explicitSubagentModel: Boolean(subagentModelOption || subagentFallback),
    explicitGuideModel: Boolean(guideModelOption),
    explicitExploreModel: Boolean(exploreModelOption),
    explicitPlanModel: Boolean(planModelOption),
    explicitGeneralModel: Boolean(generalModelOption),
    explicitTeamModel: Boolean(teamModelOption),
  };
}
`],
  ["scripts/lib/hook-io.mjs", `import { readFileSync, writeFileSync } from 'node:fs';

export function readStdinJson(label = 'hook') {
  try {
    const raw = readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    process.stderr.write(\`\${label}: failed to parse stdin JSON: \${error.message}\\n\`);
    return {};
  }
}

export function writeJson(payload) {
  process.stdout.write(JSON.stringify(payload));
}

export function maybeDumpPayload(label, payload) {
  const dumpPath = String(process.env.HELLO2CC_DEBUG_ROUTE_PATH || '').trim();
  if (!dumpPath) return;

  try {
    writeFileSync(dumpPath, JSON.stringify({ label, payload }, null, 2), 'utf8');
  } catch (error) {
    process.stderr.write(\`\${label}: failed to write debug payload: \${error.message}\\n\`);
  }
}

export function suppressHook(hookEventName, additionalContext) {
  writeJson({
    hookSpecificOutput: {
      hookEventName,
      ...(additionalContext ? { additionalContext } : {}),
    },
    suppressOutput: true,
  });
}

export function emptySuppress() {
  writeJson({ suppressOutput: true });
}

export function allowWithUpdatedInput(updatedInput, reason) {
  writeJson({
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: reason,
      updatedInput,
    },
    suppressOutput: true,
  });
}
`],
  ["scripts/lib/native-context.mjs", `import { classifyPrompt } from './prompt-signals.mjs';
import { buildRouteStepsFromSignals } from './route-guidance.mjs';
import { buildSessionStartContext as buildSessionStartContextText } from './session-guidance.mjs';

function flattenPromptValue(value, seen = new WeakSet()) {
  if (typeof value === 'string') return value;
  if (!value) return '';
  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '';

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => flattenPromptValue(item, seen)).filter(Boolean).join(' ');
  }

  const preferredKeys = ['text', 'prompt', 'message', 'content', 'input'];
  const parts = [];

  for (const key of preferredKeys) {
    if (key in value) {
      parts.push(flattenPromptValue(value[key], seen));
    }
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (preferredKeys.includes(key)) continue;
    parts.push(flattenPromptValue(nestedValue, seen));
  }

  return parts.filter(Boolean).join(' ');
}

export function extractPromptText(payload) {
  const candidates = [
    payload?.prompt,
    payload?.userPrompt,
    payload?.message,
    payload?.input,
    payload?.text,
  ];

  return candidates
    .map((candidate) => flattenPromptValue(candidate))
    .find((text) => String(text || '').trim()) || '';
}

export function buildSessionStartContext(sessionContext = {}) {
  return buildSessionStartContextText(sessionContext);
}

export function buildRouteSteps(prompt, sessionContext = {}) {
  const signals = classifyPrompt(prompt);
  return buildRouteStepsFromSignals(signals, sessionContext);
}
`],
  ["scripts/lib/plugin-data.mjs", `import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

function fallbackDataRoot() {
  return join(homedir(), '.claude', 'plugins-data', 'hello2cc');
}

export function pluginDataRoot() {
  return String(process.env.CLAUDE_PLUGIN_DATA || '').trim() || fallbackDataRoot();
}

export function readJsonFile(path, fallback = {}) {
  if (!existsSync(path)) return fallback;

  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJsonFile(path, payload) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\\n', 'utf8');
}

export function readPluginDataJson(relativePath, fallback = {}) {
  return readJsonFile(join(pluginDataRoot(), relativePath), fallback);
}

export function writePluginDataJson(relativePath, payload) {
  writeJsonFile(join(pluginDataRoot(), relativePath), payload);
}
`],
  ["scripts/lib/plugin-meta.mjs", `import { join } from 'node:path';
import { readJsonFile } from './plugin-data.mjs';

export function pluginRoot() {
  return String(process.env.CLAUDE_PLUGIN_ROOT || '').trim() || process.cwd();
}

export function pluginVersion() {
  const pkg = readJsonFile(join(pluginRoot(), 'package.json'), {});
  return String(pkg.version || '0.0.0').trim() || '0.0.0';
}
`],
  ["scripts/lib/prompt-signals.mjs", `function normalizePrompt(text) {
  return String(text || '').trim().toLowerCase().replace(/\\s+/g, ' ');
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function hasQuestionIntent(text) {
  return hasAny(text, [
    /\\?/,
    /^(can|does|do|how|why|what|which|when|where)\\b/,
    /\\b(can|does|do|how|why|what|which|when|where)\\b/,
    /\u80FD\u4E0D\u80FD/,
    /\u5982\u4F55/,
    /\u600E\u4E48/,
    /\u4E3A\u4EC0\u4E48/,
    /\u662F\u4EC0\u4E48/,
    /\u662F\u5426/,
    /\u533A\u522B/,
    /\u8FB9\u754C/,
    /\u652F\u6301\u54EA\u4E9B/,
  ]);
}

const DIAGRAM_PATTERNS = [
  /ascii/,
  /diagram/,
  /draw/,
  /visuali[sz]e/,
  /flowchart/,
  /sequence/,
  /state machine/,
  /workflow/,
  /topology/,
  /architecture/,
  /table/,
  /matrix/,
  /\u67B6\u6784\u56FE/,
  /\u6D41\u7A0B\u56FE/,
  /\u65F6\u5E8F\u56FE/,
  /\u72B6\u6001\u56FE/,
  /\u62D3\u6251\u56FE/,
  /\u5173\u7CFB\u56FE/,
  /\u793A\u610F\u56FE/,
  /\u56FE\u8868/,
  /\u8868\u683C/,
  /\u77E9\u9635/,
];

const RESEARCH_PATTERNS = [
  /research/,
  /investigate/,
  /compare/,
  /explore/,
  /docs?/,
  /documentation/,
  /how does/,
  /why does/,
  /what is/,
  /can i/,
  /support/,
  /\u8BC4\u4F30/,
  /\u7814\u7A76/,
  /\u8C03\u7814/,
  /\u5BF9\u6BD4/,
  /\u5206\u6790/,
  /\u539F\u7406/,
  /\u6587\u6863/,
  /\u8FB9\u754C/,
  /\u533A\u522B/,
  /\u652F\u6301/,
];

const SWARM_PATTERNS = [
  /parallel/,
  /in parallel/,
  /subagent/,
  /\u591A\u4E2A\u6A21\u5757/,
  /\u5E76\u884C/,
  /\u540C\u65F6\u63A8\u8FDB/,
  /\u591A\u6761\u7EBF/,
  /\u534F\u4F5C/,
  /\u5206\u5DE5/,
  /\u4EFB\u52A1\u7F16\u6392/,
];

const TEAM_WORKFLOW_PATTERNS = [
  /swarm/,
  /teamcreate/,
  /teamdelete/,
  /sendmessage/,
  /teammate/,
  /multi-agent team/,
  /agent team/,
  /agents team/,
  /persistent team/,
  /\u56E2\u961F\u4EE3\u7406/,
  /\u56E2\u961F\u7F16\u6392/,
  /\u5B50\u4EE3\u7406\u7F16\u6392/,
  /\u6301\u4E45\u56E2\u961F/,
];

const VERIFY_PATTERNS = [
  /test/,
  /verify/,
  /review/,
  /check/,
  /lint/,
  /build/,
  /smoke/,
  /sanity/,
  /regression/,
  /\u4FEE\u590D\u540E\u9A8C\u8BC1/,
  /\u9A8C\u8BC1/,
  /\u6D4B\u8BD5/,
  /\u5BA1\u67E5/,
  /\u68C0\u67E5/,
  /\u56DE\u5F52/,
  /\u9A8C\u6536/,
];

const COMPLEX_PATTERNS = [
  /implement/,
  /build/,
  /create/,
  /add /,
  /refactor/,
  /rewrite/,
  /migrate/,
  /integrate/,
  /plugin/,
  /feature/,
  /workflow/,
  /\u7F16\u5199/,
  /\u5B9E\u73B0/,
  /\u65B0\u589E/,
  /\u91CD\u6784/,
  /\u8FC1\u79FB/,
  /\u63A5\u5165/,
  /\u63D2\u4EF6/,
  /\u529F\u80FD/,
  /\u5DE5\u4F5C\u6D41/,
];

const IMPLEMENT_PATTERNS = [
  /implement/,
  /build/,
  /create/,
  /add /,
  /fix/,
  /update/,
  /rewrite/,
  /refactor/,
  /integrate/,
  /ship/,
  /patch/,
  /\u5B9E\u73B0/,
  /\u7F16\u5199/,
  /\u65B0\u589E/,
  /\u4FEE\u590D/,
  /\u66F4\u65B0/,
  /\u91CD\u6784/,
  /\u63A5\u5165/,
  /\u843D\u5730/,
];

const REVIEW_PATTERNS = [
  /review/,
  /audit/,
  /inspect/,
  /check/,
  /sanity/,
  /regression/,
  /code review/,
  /pull request/,
  /pr comments?/,
  /\u5BA1\u67E5/,
  /\u5BA1\u6838/,
  /\u590D\u6838/,
  /\u68C0\u67E5/,
  /\u9A8C\u6536/,
  /\u56DE\u5F52/,
];

const MCP_PATTERNS = [
  /\\bmcp\\b/,
  /github/,
  /jira/,
  /slack/,
  /figma/,
  /sentry/,
  /statsig/,
  /postgres/,
  /database/,
  /external tool/,
  /external system/,
  /connected tool/,
  /\u5916\u90E8\u7CFB\u7EDF/,
  /\u5916\u90E8\u5DE5\u5177/,
  /\u6570\u636E\u6E90/,
  /\u6570\u636E\u5E93/,
  /\u5DE5\u5355/,
];

const FRONTEND_PATTERNS = [
  /frontend/,
  /\\bui\\b/,
  /client/,
  /web app/,
  /\u9875\u9762/,
  /\u524D\u7AEF/,
  /\u754C\u9762/,
  /\u5BA2\u6237\u7AEF/,
];

const BACKEND_PATTERNS = [
  /backend/,
  /\\bapi\\b/,
  /server/,
  /database/,
  /service/,
  /worker/,
  /\u540E\u7AEF/,
  /\u63A5\u53E3/,
  /\u670D\u52A1\u7AEF/,
  /\u6570\u636E\u5E93/,
];

const HOST_FEATURE_PATTERNS = [
  /toolsearch/,
  /enterplanmode/,
  /teamcreate/,
  /teamdelete/,
  /sendmessage/,
  /askuserquestion/,
  /enterworktree/,
  /task(create|update|list|get)/,
  /taskoutput/,
  /taskstop/,
  /todowrite/,
  /listmcpresources/,
  /readmcpresource/,
  /claude code guide/,
  /general-purpose/,
  /\\bexplore\\b/,
  /\\bplan\\b/,
];

const GUIDE_PATTERNS = [
  /claude code/,
  /claude api/,
  /anthropic api/,
  /agent sdk/,
  /slash command/,
  /hooks?/,
  /\\bmcp\\b/,
  /settings/,
  /permissions?/,
  /anthropic/,
  /\u547D\u4EE4/,
  /hook/,
  /\u914D\u7F6E/,
  /\u6743\u9650/,
  /\u8BBE\u7F6E/,
];

const HOST_TOPIC_PATTERNS = [
  ...HOST_FEATURE_PATTERNS,
  ...GUIDE_PATTERNS,
  /\u5DE5\u5177/,
  /\u63D2\u4EF6/,
  /\u5B50\u4EE3\u7406/,
  /\u4EFB\u52A1\u5DE5\u5177/,
];

const PLAN_PATTERNS = [
  /plan/,
  /design/,
  /architecture/,
  /roadmap/,
  /trade[\\s-]?off/,
  /multi[\\s-]?file/,
  /cross[\\s-]?file/,
  /\u65B9\u6848/,
  /\u8BBE\u8BA1/,
  /\u67B6\u6784/,
  /\u8BA1\u5212/,
  /\u8DEF\u7EBF\u56FE/,
  /\u53D6\u820D/,
  /\u591A\u6587\u4EF6/,
  /\u8DE8\u6587\u4EF6/,
  /\u4EFB\u52A1\u62C6\u5206/,
];

const TASK_LIST_PATTERNS = [
  /task list/,
  /checklist/,
  /todo/,
  /kanban/,
  /task board/,
  /\u4EFB\u52A1\u6E05\u5355/,
  /\u5F85\u529E/,
  /\u770B\u677F/,
  /\u62C6\u4EFB\u52A1/,
  /\u5206\u6D3E/,
];

const DECISION_PATTERNS = [
  /choose between/,
  /which option/,
  /which approach/,
  /which should/i,
  /what(?:'s| is) better/,
  /trade[\\s-]?off/,
  /tradeoff/,
  /recommend (?:one|an approach|a path|a direction)/,
  /which one/,
  /\u9009\u54EA\u4E2A/,
  /\u600E\u4E48\u9009/,
  /\u54EA\u4E2A\u66F4\u597D/,
  /\u53D6\u820D/,
  /\u5982\u4F55\u53D6\u820D/,
  /\u6743\u8861/,
  /\u63A8\u8350\u54EA/,
  /\u63A8\u8350\u54EA\u4E2A/,
  /\u65B9\u6848\u5BF9\u6BD4/,
];

const WORKTREE_PATTERNS = [
  /enterworktree/,
  /git worktree/,
  /worktree/,
  /separate worktree/,
  /isolated worktree/,
  /parallel worktree/,
  /\u72EC\u7ACB\u5DE5\u4F5C\u6811/,
  /\u5355\u72EC\u5DE5\u4F5C\u6811/,
  /\u5E76\u884C\u5DE5\u4F5C\u6811/,
  /\u9694\u79BB\u5DE5\u4F5C\u6811/,
  /\u5DE5\u4F5C\u6811/,
];

export function startsWithExplicitCommand(prompt) {
  return /^(~|\\/)/.test(String(prompt || '').trim());
}

export function isSubagentPrompt(prompt) {
  return /^\\[(?:\u5B50\u4EE3\u7406\u4EFB\u52A1|subagent task|agent task|teammate task)\\]/i.test(String(prompt || '').trim());
}

export function classifyPrompt(prompt) {
  const text = normalizePrompt(prompt);
  const research = hasAny(text, RESEARCH_PATTERNS);
  const explicitHostFeature = hasAny(text, HOST_FEATURE_PATTERNS);
  const claudeGuide = hasQuestionIntent(text) && hasAny(text, GUIDE_PATTERNS);
  const implement = hasAny(text, IMPLEMENT_PATTERNS);
  const review = hasAny(text, REVIEW_PATTERNS);
  const mcp = hasAny(text, MCP_PATTERNS);
  const frontend = hasAny(text, FRONTEND_PATTERNS);
  const backend = hasAny(text, BACKEND_PATTERNS);
  const complex = hasAny(text, COMPLEX_PATTERNS);
  const verify = hasAny(text, VERIFY_PATTERNS);
  const multiTrackByStructure =
    (research && implement) ||
    (research && verify) ||
    (implement && verify) ||
    (frontend && backend);
  const plan = complex || multiTrackByStructure || hasAny(text, PLAN_PATTERNS);
  const swarm = hasAny(text, SWARM_PATTERNS) || multiTrackByStructure;
  const teamWorkflow = hasAny(text, TEAM_WORKFLOW_PATTERNS);
  const decisionHeavy = hasQuestionIntent(text) && hasAny(text, DECISION_PATTERNS);
  const capabilityQuery = explicitHostFeature || (hasQuestionIntent(text) && hasAny(text, HOST_TOPIC_PATTERNS)) || mcp;
  const codeResearch = research && !capabilityQuery;

  const tracks = [];
  if (frontend) tracks.push('frontend');
  if (backend) tracks.push('backend');
  if (research && (implement || review || verify) && !tracks.includes('research')) {
    tracks.unshift('research');
  }
  if (!tracks.includes('implementation') && implement && (research || verify || review)) {
    tracks.push('implementation');
  }
  if (!tracks.includes('review') && review && !verify) {
    tracks.push('review');
  }
  if (!tracks.includes('verification') && verify) {
    tracks.push('verification');
  }

  const boundedImplementation = implement && !research && !swarm && tracks.length <= 1 && !frontend && !backend;

  return {
    diagram: hasAny(text, DIAGRAM_PATTERNS),
    research,
    swarm,
    teamWorkflow,
    verify,
    complex,
    tools: explicitHostFeature,
    claudeGuide,
    plan,
    taskList: plan || hasAny(text, TASK_LIST_PATTERNS),
    implement,
    review,
    mcp,
    frontend,
    backend,
    decisionHeavy,
    capabilityQuery,
    codeResearch,
    tracks,
    boundedImplementation,
    toolSearchFirst: capabilityQuery,
    wantsWorktree: hasAny(text, WORKTREE_PATTERNS),
  };
}
`],
  ["scripts/lib/route-guidance.mjs", "import { configuredModels } from './config.mjs';\n\nfunction buildTaskPlanningStep() {\n  return '\u8FD9\u662F\u975E trivial \u5B9E\u73B0\uFF1A\u5148 `EnterPlanMode()`\uFF1B\u53EA\u6709\u771F\u7684\u9700\u8981\u4EFB\u52A1\u76D8\u65F6\u518D\u7528 `TaskCreate` / `TaskList` / `TaskUpdate`\u3002';\n}\n\nfunction buildTaskTrackingStep() {\n  return '\u8BE5\u4EFB\u52A1\u9002\u5408\u663E\u5F0F\u62C6\u89E3\uFF1A\u7EF4\u62A4 `TaskCreate` / `TaskList` / `TaskUpdate`\uFF1B\u66F4\u65B0\u524D\u5148 `TaskGet` \u770B\u5F53\u524D\u72B6\u6001\uFF0C\u4E0D\u8981\u53EA\u5728\u6B63\u6587\u91CC\u53E3\u5934\u5217\u6B65\u9AA4\u3002';\n}\n\nfunction recommendedTrackLabels(signals) {\n  if (signals.tracks?.length) return signals.tracks;\n  if (signals.research && signals.verify) return ['research', 'verification'];\n  if (signals.research && signals.implement) return ['research', 'implementation'];\n  if (signals.implement && signals.verify) return ['implementation', 'verification'];\n  return ['track-1', 'track-2'];\n}\n\nfunction buildSwarmStep(signals) {\n  const trackList = recommendedTrackLabels(signals)\n    .map((track) => `\\`${track}\\``)\n    .join(' / ');\n\n  if (signals.teamWorkflow) {\n    return [\n      `\u7528\u6237\u663E\u5F0F\u8981\u6C42\u56E2\u961F\u7F16\u6392\uFF1A\u7528 \\`TeamCreate\\` \u5EFA\u7ACB\u6301\u4E45\u56E2\u961F\u6765\u63A8\u8FDB ${trackList}\u3002`,\n      '\u7B49 `TeamCreate` \u4EA7\u51FA\u771F\u5B9E\u56E2\u961F\u540E\uFF0C\u540E\u7EED `Agent` \u8C03\u7528\u518D\u663E\u5F0F\u4F20\u5165 `name` + `team_name`\uFF1B\u4E0D\u8981\u4F9D\u8D56 `main` / `default` \u8FD9\u7C7B\u9690\u5F0F team \u4E0A\u4E0B\u6587\u3002',\n      '\u56E2\u961F\u6210\u5458\u5DF2\u542F\u52A8\u540E\uFF0C\u8865\u5145\u6307\u4EE4\u3001\u4FEE\u6B63\u8303\u56F4\u6216\u7EED\u6D3E\u65F6\u7528 `SendMessage`\u3002',\n      '\u56E2\u961F\u5B8C\u6210\u540E\u7528 `TeamDelete` \u6E05\u7406\u3002',\n    ].join(' ');\n  }\n\n  return [\n    `\u8FD9\u662F\u591A\u7EBF\u4EFB\u52A1\uFF1A\u4F18\u5148\u5728\u540C\u4E00\u6761\u56DE\u590D\u91CC\u5E76\u884C\u53D1\u8D77\u591A\u4E2A\u539F\u751F \\`Agent\\` worker\uFF0C\u5206\u522B\u8986\u76D6 ${trackList}\u3002`,\n    '\u666E\u901A\u5E76\u884C worker \u8D70 plain subagent \u8DEF\u5F84\uFF1A\u4E0D\u8981\u7ED9\u666E\u901A worker \u4F20 `name` \u6216 `team_name`\uFF0C\u907F\u514D\u88AB\u5BBF\u4E3B\u8BEF\u5224\u4E3A teammate\u3002',\n    '\u542F\u52A8\u540E\u7B80\u77ED\u544A\u8BC9\u7528\u6237\u5DF2\u542F\u52A8\u54EA\u4E9B worker\uFF0C\u7136\u540E\u7B49\u5F85\u5B8C\u6210\u901A\u77E5 / \u56DE\u4F20\u6D88\u606F\uFF0C\u4E0D\u8981\u7ACB\u523B\u8F6E\u8BE2\u666E\u901A agent \u7ED3\u679C\u3002',\n    '\u9700\u8981\u8865\u5145\u6307\u4EE4\u6216\u7EED\u6D3E\u65F6\u7528 `SendMessage`\uFF1B\u5982\u679C\u67D0\u4E2A worker \u660E\u663E\u8D70\u9519\u65B9\u5411\uFF0C\u518D\u7528 `TaskStop`\u3002',\n    '\u4E0D\u8981\u628A `TaskOutput` \u5F53\u6210\u666E\u901A worker \u7684\u9ED8\u8BA4\u7ED3\u679C\u83B7\u53D6\u65B9\u5F0F\uFF1B\u5B83\u66F4\u9002\u5408\u660E\u786E\u7684\u540E\u53F0\u4EFB\u52A1\u65E5\u5FD7\u8BFB\u53D6\u3002',\n  ].join(' ');\n}\n\nfunction buildResearchStep(signals) {\n  if (signals.claudeGuide) {\n    return '\u8FD9\u662F Claude Code / Claude API / Agent SDK / hooks / settings / MCP \u80FD\u529B\u95EE\u9898\uFF1A\u4F18\u5148\u8C03\u7528\u539F\u751F `Agent` \u7684 `Claude Code Guide`\u3002';\n  }\n\n  if (signals.codeResearch) {\n    return '\u8FD9\u662F\u4EE3\u7801\u5E93\u7814\u7A76 / \u5B9A\u4F4D\u4EFB\u52A1\uFF1A\u5148\u7528\u539F\u751F\u8BFB\u5199 / \u641C\u7D22\u5DE5\u5177\u7F29\u5C0F\u8303\u56F4\uFF0C\u518D\u5728\u9700\u8981\u66F4\u5927\u641C\u7D22\u9762\u65F6\u8F6C\u539F\u751F `Explore` \u6216 `Plan`\u3002';\n  }\n\n  if (!signals.research) {\n    return '';\n  }\n\n  return '\u8FD9\u662F\u7814\u7A76 / \u5BF9\u6BD4 / \u6587\u6863\u4EFB\u52A1\uFF1A\u5148\u505A\u5B9A\u5411\u641C\u7D22\u4E0E\u8BC1\u636E\u6536\u96C6\uFF0C\u518D\u5728\u9700\u8981\u6269\u5927\u641C\u7D22\u9762\u65F6\u8F6C\u539F\u751F `Explore` \u6216 `Plan`\u3002';\n}\n\nexport function buildRouteStepsFromSignals(signals, sessionContext = {}) {\n  const config = configuredModels(sessionContext);\n  const steps = [];\n\n  steps.push('\u53EF\u89C1\u6587\u672C\u9ED8\u8BA4\u8DDF\u968F\u7528\u6237\u5F53\u524D\u8BED\u8A00\uFF1B\u4E0D\u8981\u8F93\u51FA\u201C\u6211\u6253\u7B97 / \u6211\u5E94\u8BE5 / let\u2019s\u201D\u8FD9\u7C7B\u5185\u90E8\u601D\u8003\u5F0F\u5143\u53D9\u8FF0\u3002');\n\n  if (signals.toolSearchFirst) {\n    steps.push('\u5148 `ToolSearch` \u786E\u8BA4\u53EF\u7528\u5DE5\u5177\u3001\u539F\u751F agent \u7C7B\u578B\u3001MCP \u80FD\u529B\u3001\u6743\u9650\u4E0E\u8FB9\u754C\uFF0C\u4E0D\u8981\u51ED\u8BB0\u5FC6\u731C\u3002');\n  }\n\n  if (signals.mcp) {\n    steps.push('\u5982\u679C\u4EFB\u52A1\u6D89\u53CA\u5916\u90E8\u7CFB\u7EDF\u3001\u6570\u636E\u6E90\u6216\u96C6\u6210\u5E73\u53F0\uFF0C\u4F18\u5148 `ListMcpResources` / `ReadMcpResource` \u6216\u5BF9\u5E94 MCP / connected tools\u3002');\n  }\n\n  const researchStep = buildResearchStep(signals);\n  if (researchStep) {\n    steps.push(researchStep);\n  }\n\n  if (signals.boundedImplementation) {\n    steps.push('\u8FD9\u662F\u8FB9\u754C\u6E05\u6670\u7684\u5B9E\u73B0 / \u4FEE\u590D / \u9A8C\u8BC1\u5B50\u4EFB\u52A1\uFF1A\u4F18\u5148\u4F7F\u7528\u539F\u751F `Agent` \u7684 `General-Purpose` \u627F\u63A5\u5355\u4E00\u5207\u7247\uFF0C\u800C\u4E0D\u662F\u628A\u63A2\u7D22\u3001\u89C4\u5212\u548C\u5B9E\u73B0\u90FD\u6DF7\u5728\u4E3B\u7EBF\u7A0B\u3002');\n  }\n\n  if (signals.complex) {\n    steps.push(buildTaskPlanningStep());\n  }\n\n  if (signals.plan) {\n    steps.push('\u4EFB\u52A1\u5B58\u5728\u8DE8\u6587\u4EF6\u3001\u67B6\u6784\u53D6\u820D\u6216\u591A\u4E2A\u9636\u6BB5\uFF1A\u4F18\u5148\u8BA1\u5212\u6A21\u5F0F\uFF1B\u5982\u679C\u5DF2\u7ECF\u8FDB\u5165\u4EFB\u52A1\u76D8\uFF0C\u5C31\u6301\u7EED\u7EF4\u62A4\u53EF\u8FFD\u8E2A\u4EFB\u52A1\u72B6\u6001\u3002');\n  }\n\n  if (signals.taskList) {\n    steps.push(buildTaskTrackingStep());\n  }\n\n  if (signals.decisionHeavy) {\n    steps.push('\u5982\u679C\u6267\u884C\u8FC7\u7A0B\u4E2D\u51FA\u73B0\u5355\u4E00\u771F\u5B9E\u963B\u585E\u9009\u62E9\uFF0C\u4F18\u5148\u7528 `AskUserQuestion` \u53D1\u8D77\u7ED3\u6784\u5316\u9009\u62E9\uFF0C\u4E0D\u8981\u628A\u786E\u8BA4\u57CB\u5728\u957F\u6BB5\u843D\u91CC\u3002');\n  }\n\n  if (signals.swarm) {\n    steps.push(buildSwarmStep(signals));\n  }\n\n  if (signals.wantsWorktree) {\n    steps.push('\u7528\u6237\u660E\u786E\u8981\u6C42\u9694\u79BB\u5DE5\u4F5C\u6811\uFF1A\u53EA\u6709\u786E\u5B9E\u9700\u8981\u9694\u79BB\u5DE5\u4F5C\u533A\u3001\u5206\u652F\u5F0F\u5B9E\u9A8C\u6216\u5E76\u884C\u4FEE\u6539\u65F6\u624D\u8FDB\u5165 `EnterWorktree`\u3002');\n  }\n\n  if (signals.diagram) {\n    steps.push('\u9700\u8981\u7ED3\u6784\u5316\u8868\u8FBE\uFF1A\u4F18\u5148\u6807\u51C6 Markdown \u8868\u683C\u6216\u56FE\u793A\uFF1B\u53EA\u6709 Markdown \u660E\u663E\u4E0D\u9002\u5408\u65F6\u518D\u4F7F\u7528 ASCII\u3002');\n  }\n\n  if (signals.verify) {\n    steps.push('\u6536\u5C3E\u524D\u5148\u505A\u6700\u8D34\u8FD1\u6539\u52A8\u8303\u56F4\u7684\u9A8C\u8BC1\uFF0C\u518D\u89C6\u7ED3\u679C\u6269\u5927\u8303\u56F4\uFF1B\u672A\u9A8C\u8BC1\u4E0D\u8981\u58F0\u79F0\u5DF2\u5B8C\u6210\u3002');\n  }\n\n  if (config.routingPolicy !== 'prompt-only') {\n    steps.push('\u5982\u679C\u539F\u751F `Agent` \u8C03\u7528\u6CA1\u6709\u663E\u5F0F `model`\uFF0C\u4F18\u5148\u4E0E\u5F53\u524D\u4F1A\u8BDD\u6A21\u578B\u4FDD\u6301\u4E00\u81F4\uFF1B\u663E\u5F0F\u4F20\u5165\u7684 `model` \u6C38\u8FDC\u4F18\u5148\u3002');\n  }\n\n  if (steps.length === 0) {\n    return '';\n  }\n\n  return [\n    '# hello2cc native-first routing',\n    '',\n    '\u6309\u4E0B\u9762\u987A\u5E8F\u4F18\u5148\u51B3\u7B56\uFF1A',\n    '',\n    ...steps.map((step, index) => `${index + 1}. ${step}`),\n  ].join('\\n');\n}\n"],
  ["scripts/lib/session-capabilities.mjs", `function normalizeNames(values) {
  return Array.isArray(values)
    ? values.map((value) => String(value || '').trim()).filter(Boolean)
    : [];
}

function canonicalSet(values) {
  return new Set(normalizeNames(values).map((value) => value.toLowerCase()));
}

function hasAnyName(values, names) {
  const normalized = canonicalSet(values);
  return names.some((name) => normalized.has(String(name || '').trim().toLowerCase()));
}

const TOOL_CAPABILITY_RULES = [
  { key: 'agentToolAvailable', names: ['Agent'] },
  { key: 'toolSearchAvailable', names: ['ToolSearch'] },
  { key: 'teamCreateAvailable', names: ['TeamCreate'] },
  { key: 'teamDeleteAvailable', names: ['TeamDelete'] },
  { key: 'sendMessageAvailable', names: ['SendMessage'] },
  { key: 'askUserQuestionAvailable', names: ['AskUserQuestion'] },
  { key: 'enterPlanModeAvailable', names: ['EnterPlanMode'] },
  { key: 'enterWorktreeAvailable', names: ['EnterWorktree'] },
  { key: 'taskCreateAvailable', names: ['TaskCreate'] },
  { key: 'taskGetAvailable', names: ['TaskGet'] },
  { key: 'taskListAvailable', names: ['TaskList'] },
  { key: 'taskUpdateAvailable', names: ['TaskUpdate'] },
  { key: 'taskOutputAvailable', names: ['TaskOutput'] },
  { key: 'taskStopAvailable', names: ['TaskStop'] },
  { key: 'todoWriteAvailable', names: ['TodoWrite'] },
  { key: 'listMcpResourcesAvailable', names: ['ListMcpResources'] },
  { key: 'readMcpResourceAvailable', names: ['ReadMcpResource'] },
  { key: 'webFetchAvailable', names: ['WebFetch'] },
  { key: 'webSearchAvailable', names: ['WebSearch'] },
  { key: 'notebookEditAvailable', names: ['NotebookEdit'] },
  { key: 'lspAvailable', names: ['LSP'] },
  { key: 'powerShellAvailable', names: ['PowerShell'] },
  { key: 'briefAvailable', names: ['SendUserMessage', 'Brief'] },
];

const AGENT_CAPABILITY_RULES = [
  { key: 'claudeCodeGuideAvailable', names: ['claude-code-guide', 'Claude Code Guide'] },
  { key: 'exploreAgentAvailable', names: ['Explore'] },
  { key: 'planAgentAvailable', names: ['Plan'] },
  { key: 'generalPurposeAgentAvailable', names: ['general-purpose', 'General-Purpose', 'General Purpose'] },
];

export function normalizeToolNames(values) {
  return normalizeNames(values);
}

export function normalizeAgentTypes(values) {
  return normalizeNames(values);
}

export function deriveToolCapabilities(toolNames) {
  const normalized = normalizeToolNames(toolNames);
  const capabilities = Object.fromEntries(
    TOOL_CAPABILITY_RULES.map(({ key, names }) => [key, hasAnyName(normalized, names)]),
  );

  return {
    ...capabilities,
    taskToolAvailable: capabilities.taskCreateAvailable || hasAnyName(normalized, ['Task']),
  };
}

export function deriveAgentCapabilities(agentTypes) {
  const normalized = normalizeAgentTypes(agentTypes);
  return Object.fromEntries(
    AGENT_CAPABILITY_RULES.map(({ key, names }) => [key, hasAnyName(normalized, names)]),
  );
}
`],
  ["scripts/lib/session-guidance.mjs", `import { FORCED_OUTPUT_STYLE_NAME, configuredModels } from './config.mjs';

function formatNames(values) {
  return values.map((value) => \`\\\`\${value}\\\`\`).join(', ');
}

function detectedTools(sessionContext = {}) {
  return Array.isArray(sessionContext?.toolNames) ? sessionContext.toolNames.filter(Boolean) : [];
}

function detectedAgents(sessionContext = {}) {
  return Array.isArray(sessionContext?.agentTypes) ? sessionContext.agentTypes.filter(Boolean) : [];
}

function buildObservedSurfaceLines(sessionContext = {}) {
  const tools = detectedTools(sessionContext);
  const agents = detectedAgents(sessionContext);

  if (tools.length === 0 && agents.length === 0) {
    return [
      '## \u5F53\u524D\u4F1A\u8BDD\u80FD\u529B',
      '- Claude Code \u8FD8\u6CA1\u6709\u5728 hook \u8D1F\u8F7D\u91CC\u663E\u5F0F\u5217\u51FA\u672C\u4F1A\u8BDD\u80FD\u529B\uFF1B\u4FDD\u6301\u539F\u751F\u5DE5\u4F5C\u65B9\u5F0F\u5373\u53EF\uFF0C\u4E0D\u8981\u51ED\u7A7A\u53D1\u660E\u4E0D\u5B58\u5728\u7684\u5DE5\u5177\u6216 agent\u3002',
    ];
  }

  const lines = ['## \u5F53\u524D\u4F1A\u8BDD\u80FD\u529B'];
  if (tools.length) {
    lines.push(\`- \u5DF2\u89C2\u6D4B\u5230\u7684\u539F\u751F\u5DE5\u5177\uFF1A\${formatNames(tools)}\u3002\`);
  }
  if (agents.length) {
    lines.push(\`- \u5DF2\u89C2\u6D4B\u5230\u7684\u5185\u5EFA agent\uFF1A\${formatNames(agents)}\u3002\`);
  }
  return lines;
}

function buildSessionModelLines(sessionContext = {}) {
  const config = configuredModels(sessionContext);
  const lines = ['## \u4F1A\u8BDD\u4F7F\u7528\u65B9\u5F0F'];

  lines.push('- \u50CF\u5E73\u5E38\u4E00\u6837\u76F4\u63A5\u4F7F\u7528 Claude Code\uFF1B\u4E0D\u9700\u8981\u989D\u5916\u624B\u52A8\u52A0\u8F7D\uFF0C\u4E5F\u4E0D\u9700\u8981\u5207\u6362\u5230\u53E6\u4E00\u5957\u5DE5\u4F5C\u6D41\u3002');
  lines.push('- hello2cc \u53EA\u5F3A\u5316 Claude / Opus \u98CE\u683C\u7684\u539F\u751F\u5DE5\u5177\u3001\u539F\u751F agent\u3001\u539F\u751F\u8BA1\u5212\u4E0E\u4EFB\u52A1\u4E60\u60EF\uFF0C\u4E0D\u66FF\u6362\u73B0\u6709 \`CLAUDE.md\`\u3001\u9879\u76EE\u89C4\u5219\u6216\u7528\u6237\u6307\u5B9A\u8F93\u51FA\u683C\u5F0F\u3002');

  if (config.sessionModel) {
    lines.push(\`- \u5F53\u524D\u4F1A\u8BDD\u6A21\u578B\u522B\u540D\uFF1A\\\`\${config.sessionModel}\\\`\u3002\`);
  }

  if (config.routingPolicy === 'prompt-only') {
    lines.push('- \u5F53\u524D\u4EC5\u505A\u539F\u751F\u80FD\u529B\u5F15\u5BFC\uFF0C\u4E0D\u6539\u5199\u539F\u751F\u5DE5\u5177\u8F93\u5165\u3002');
  } else {
    lines.push('- \u5F53\u539F\u751F \`Agent\` \u8C03\u7528\u6CA1\u6709\u663E\u5F0F \`model\` \u65F6\uFF0C\u4F18\u5148\u4FDD\u6301\u4E0E\u5F53\u524D\u4F1A\u8BDD\u6A21\u578B\u4E00\u81F4\u3002');
  }

  lines.push('- \u5982\u679C\u539F\u751F\u5DE5\u5177\u8C03\u7528\u91CC\u5DF2\u7ECF\u663E\u5F0F\u4F20\u5165 \`model\`\uFF0C\u59CB\u7EC8\u4EE5\u663E\u5F0F\u503C\u4E3A\u51C6\u3002');
  return lines;
}

function buildWorkingHabitLines() {
  return [
    '## \u539F\u751F\u5DE5\u4F5C\u4E60\u60EF',
    '- \u4FDD\u6301 Claude / Opus \u98CE\u683C\u7684\u539F\u751F\u5DE5\u4F5C\u65B9\u5F0F\uFF1A\u5148\u8BFB\u76F8\u5173\u4EE3\u7801\uFF0C\u518D\u6539\u52A8\uFF1B\u4F18\u5148\u6539\u5DF2\u6709\u6587\u4EF6\u800C\u4E0D\u662F\u65B0\u5EFA\u6587\u4EF6\u3002',
    '- \u53EF\u89C1\u6587\u672C\u9ED8\u8BA4\u8DDF\u968F\u7528\u6237\u5F53\u524D\u8BED\u8A00\uFF1B\u9664\u975E\u7528\u6237\u660E\u786E\u8981\u6C42\uFF0C\u5426\u5219\u4E0D\u8981\u65E0\u6545\u5207\u6362\u8BED\u8A00\u3002',
    '- \u4E0D\u8981\u628A\u5185\u90E8\u601D\u8003\u8FC7\u7A0B\u76F4\u63A5\u8BF4\u51FA\u6765\uFF1B\u5DE5\u5177\u524D\u8BF4\u660E\u4FDD\u6301\u4E00\u53E5\u7B80\u77ED\u884C\u52A8\u63CF\u8FF0\uFF0C\u907F\u514D\u201C\u6211\u6253\u7B97 / \u6211\u5E94\u8BE5 / let\u2019s\u201D\u5F0F\u5143\u53D9\u8FF0\u3002',
    '- \u6709\u4E13\u7528\u8BFB\u5199 / \u641C\u7D22\u5DE5\u5177\u65F6\u4F18\u5148\u7528\u4E13\u7528\u5DE5\u5177\uFF0C\u518D\u8003\u8651 shell\u3002',
    '- \u975E trivial \u4EFB\u52A1\u4F18\u5148 \`EnterPlanMode()\`\uFF1B\u53EA\u6709\u771F\u7684\u9700\u8981\u4EFB\u52A1\u76D8\u65F6\u518D\u7EF4\u62A4\u539F\u751F \`Task*\`\u3002',
    '- \u4E0D\u786E\u5B9A\u53EF\u7528\u5DE5\u5177\u3001agent\u3001MCP\u3001\u6743\u9650\u8FB9\u754C\u65F6\uFF0C\u4F18\u5148 \`ToolSearch\`\u3002',
    '- Claude Code / hooks / MCP / settings / Agent SDK / Claude API \u95EE\u9898\u4F18\u5148 \`Claude Code Guide\`\u3002',
    '- \u4EE3\u7801\u5E93\u7814\u7A76\u4E0E\u8303\u56F4\u63A2\u7D22\u4F18\u5148\u539F\u751F\u641C\u7D22\uFF0C\u518D\u6309\u9700\u8981\u8F6C \`Explore\` \u6216 \`Plan\`\u3002',
    '- \u8FB9\u754C\u6E05\u6670\u7684\u5B9E\u73B0\u3001\u4FEE\u590D\u3001\u9A8C\u8BC1\u5207\u7247\u4F18\u5148 \`General-Purpose\`\u3002',
    '- \u591A\u7EBF\u4EFB\u52A1\u9ED8\u8BA4\u4F18\u5148\u5E76\u884C\u591A\u4E2A\u539F\u751F \`Agent\` worker\uFF1B\u7EED\u6D3E\u4F18\u5148 \`SendMessage\`\uFF1B\u8DD1\u504F\u65F6\u518D \`TaskStop\`\u3002',
    '- \u666E\u901A \`Agent\` worker \u9ED8\u8BA4\u4E0D\u8981\u4F20 \`name\` / \`team_name\`\uFF1B\u907F\u514D\u5BBF\u4E3B\u628A\u666E\u901A subagent \u8BEF\u8DEF\u7531\u6210 teammate\u3002',
    '- \u53EA\u6709\u7528\u6237\u660E\u786E\u8981\u6C42\u56E2\u961F\u7F16\u6392\u6216\u6301\u4E45\u56E2\u961F\u8EAB\u4EFD\u65F6\uFF0C\u624D\u4F7F\u7528 \`TeamCreate\`\uFF1B\u5B8C\u6210\u540E\u53CA\u65F6 \`TeamDelete\`\u3002',
    '- \u771F\u6B63\u9700\u8981 agent team \u65F6\uFF0C\u5148 \`TeamCreate\` \u62FF\u5230\u771F\u5B9E\u56E2\u961F\uFF0C\u518D\u7ED9 \`Agent\` \u663E\u5F0F\u4F20\u5165 \`name\` + \`team_name\`\uFF1B\u4E0D\u8981\u4F9D\u8D56 \`main\` / \`default\` \u8FD9\u7C7B\u9690\u5F0F team \u4E0A\u4E0B\u6587\u3002',
    '- \u666E\u901A worker \u7684\u7ED3\u679C\u9ED8\u8BA4\u770B\u5B8C\u6210\u901A\u77E5 / \u56DE\u4F20\u6D88\u606F\uFF0C\u4E0D\u8981\u628A \`TaskOutput\` \u5F53\u6210\u666E\u901A worker \u7684\u9ED8\u8BA4\u7ED3\u679C\u83B7\u53D6\u65B9\u5F0F\u3002',
    '- \u5916\u90E8\u7CFB\u7EDF\u4E0E\u96C6\u6210\u4F18\u5148\u539F\u751F MCP / connected tools\uFF0C\u4F18\u5148 \`ListMcpResources\` / \`ReadMcpResource\`\u3002',
    '- \u5982\u679C\u53EA\u88AB\u4E00\u4E2A\u771F\u5B9E\u7528\u6237\u9009\u62E9\u963B\u585E\uFF0C\u4F18\u5148 \`AskUserQuestion\`\u3002',
    '- \u53EA\u6709\u7528\u6237\u660E\u786E\u8981\u6C42\u9694\u79BB\u5DE5\u4F5C\u6811\u65F6\u624D\u4F7F\u7528 \`EnterWorktree\`\u3002',
    '- \u5BA3\u79F0\u5B8C\u6210\u524D\u5148\u8DD1\u4E0E\u6539\u52A8\u6700\u8D34\u8FD1\u7684\u9A8C\u8BC1\uFF1B\u9A8C\u8BC1\u7ED3\u679C\u8981\u8BDA\u5B9E\u3002',
  ];
}

function buildToolSearchLines() {
  return [
    '## ToolSearch \u72B6\u6001',
    '- \u539F\u751F \`ToolSearch\` \u662F\u9ED8\u8BA4\u4F18\u5148\u8DEF\u5F84\uFF1A\u5148\u7528\u5B83\u786E\u8BA4\u53EF\u7528\u5DE5\u5177\u3001\u539F\u751F agent \u7C7B\u578B\u3001MCP \u80FD\u529B\u3001\u6743\u9650\u4E0E\u8FB9\u754C\u3002',
    '- hello2cc \u4E0D\u4F1A\u4E3B\u52A8\u628A\u7B2C\u4E09\u65B9\u6A21\u578B\u4ECE\u8FD9\u6761\u539F\u751F\u8DEF\u5F84\u62C9\u8D70\u3002',
  ];
}

export function buildSessionStartContext(sessionContext = {}) {
  return [
    '# hello2cc',
    '',
    'hello2cc \u4F1A\u8BA9\u7B2C\u4E09\u65B9\u6A21\u578B\u5728 Claude Code \u91CC\u5C3D\u91CF\u6309 Claude / Opus \u7684\u539F\u751F\u65B9\u5F0F\u5DE5\u4F5C\uFF1A\u4F18\u5148\u539F\u751F\u5DE5\u5177\u3001\u539F\u751F agent\u3001\u539F\u751F\u8BA1\u5212\u4E0E\u539F\u751F\u534F\u4F5C\u6D41\u7A0B\u3002',
    '',
    '## \u4F18\u5148\u7EA7',
    '- \u7528\u6237\u5F53\u524D\u6D88\u606F\u3001Claude Code \u5BBF\u4E3B\u89C4\u5219\u3001\`CLAUDE.md\` / \`AGENTS.md\` / \u9879\u76EE\u89C4\u5219\uFF0C\u59CB\u7EC8\u9AD8\u4E8E hello2cc\u3002',
    '- hello2cc \u4E0D\u5F97\u8986\u76D6\u73B0\u6709\u5DE5\u4F5C\u6D41\u3001\u8F93\u51FA\u683C\u5F0F\u3001\u547D\u4EE4\u8DEF\u7531\u3001\u9876\u90E8/\u5E95\u90E8\u4FE1\u606F\u680F\u6216\u9879\u76EE\u7EA6\u5B9A\u3002',
    '',
    ...buildSessionModelLines(sessionContext),
    '',
    ...buildWorkingHabitLines(),
    '',
    ...buildObservedSurfaceLines(sessionContext),
    '',
    ...buildToolSearchLines(),
    '',
    '## \u8F93\u51FA\u98CE\u683C',
    \`- \u5F53\u524D\u63D2\u4EF6\u8F93\u51FA\u98CE\u683C\uFF1A\\\`\${FORCED_OUTPUT_STYLE_NAME}\\\`\u3002\`,
    '- \u5982\u679C\u66F4\u9AD8\u4F18\u5148\u7EA7\u89C4\u5219\u6CA1\u6709\u6307\u5B9A\u683C\u5F0F\uFF0C\u4FDD\u6301 Claude Code \u539F\u751F\u3001\u7B80\u6D01\u3001\u7ED3\u679C\u5BFC\u5411\u7684\u8868\u8FBE\u3002',
    '- \u5982\u679C\u9700\u8981\u8868\u683C\uFF0C\u4F18\u5148 Markdown \u8868\u683C\uFF1B\u53EA\u6709 Markdown \u660E\u663E\u4E0D\u9002\u5408\u65F6\u518D\u4F7F\u7528 ASCII\u3002',
  ].join('\\n');
}
`],
  ["scripts/lib/session-state.mjs", `import { readPluginDataJson, writePluginDataJson } from './plugin-data.mjs';
import {
  deriveAgentCapabilities,
  deriveToolCapabilities,
  normalizeAgentTypes,
  normalizeToolNames,
} from './session-capabilities.mjs';
import { extractSessionContextFromTranscript } from './transcript-context.mjs';

const SESSION_STATE_PATH = 'runtime/session-context.json';
const MAX_SESSION_ENTRIES = 50;

function normalizeSessionId(sessionId) {
  return String(sessionId || '').trim();
}

function compactEntries(entries) {
  return Object.fromEntries(
    Object.entries(entries)
      .sort(([, left], [, right]) => String(right?.updatedAt || '').localeCompare(String(left?.updatedAt || '')))
      .slice(0, MAX_SESSION_ENTRIES),
  );
}

export function readSessionContext(sessionId) {
  const key = normalizeSessionId(sessionId);
  if (!key) return {};

  const sessions = readPluginDataJson(SESSION_STATE_PATH, {});
  return sessions[key] || {};
}

export function clearSessionContext(sessionId) {
  const key = normalizeSessionId(sessionId);
  if (!key) return false;

  const sessions = readPluginDataJson(SESSION_STATE_PATH, {});
  if (!(key in sessions)) return false;

  const nextState = { ...sessions };
  delete nextState[key];
  writePluginDataJson(SESSION_STATE_PATH, compactEntries(nextState));
  return true;
}

export function clearAllSessionContexts() {
  writePluginDataJson(SESSION_STATE_PATH, {});
}

export function sessionContextFromPayload(payload = {}) {
  const sessionId = normalizeSessionId(payload?.session_id);
  const tools = normalizeToolNames(payload?.tools);
  const agents = normalizeAgentTypes(payload?.agents);

  return {
    ...extractSessionContextFromTranscript(payload?.transcript_path, sessionId),
    ...(String(payload?.model || '').trim() ? { mainModel: String(payload.model).trim() } : {}),
    ...(String(payload?.output_style || '').trim() ? { outputStyle: String(payload.output_style).trim() } : {}),
    ...(tools.length ? {
      toolNames: tools,
      ...deriveToolCapabilities(tools),
    } : {}),
    ...(agents.length ? {
      agentTypes: agents,
      ...deriveAgentCapabilities(agents),
    } : {}),
  };
}

export function rememberSessionContext(payload) {
  const key = normalizeSessionId(payload?.session_id);
  const context = sessionContextFromPayload(payload);
  const mainModel = String(context.mainModel || '').trim();
  const outputStyle = String(context.outputStyle || '').trim();
  const toolNames = Array.isArray(context.toolNames) ? context.toolNames : [];
  const agentTypes = Array.isArray(context.agentTypes) ? context.agentTypes : [];
  const teamName = String(context.teamName || '').trim();
  const agentName = String(context.agentName || '').trim();

  if (!key || (!mainModel && !outputStyle && toolNames.length === 0 && agentTypes.length === 0 && !teamName && !agentName)) {
    return {};
  }

  const sessions = readPluginDataJson(SESSION_STATE_PATH, {});
  const nextState = compactEntries({
    ...sessions,
    [key]: {
      ...sessions[key],
      ...(mainModel ? { mainModel } : {}),
      ...(outputStyle ? { outputStyle } : {}),
      ...(toolNames.length ? {
        toolNames,
        ...deriveToolCapabilities(toolNames),
      } : {}),
      ...(agentTypes.length ? {
        agentTypes,
        ...deriveAgentCapabilities(agentTypes),
      } : {}),
      ...(teamName ? { teamName } : {}),
      ...(agentName ? { agentName } : {}),
      updatedAt: new Date().toISOString(),
    },
  });

  writePluginDataJson(SESSION_STATE_PATH, nextState);
  return nextState[key] || {};
}

export function rememberPromptSignals(sessionId, signals = {}) {
  const key = normalizeSessionId(sessionId);
  if (!key) return {};

  const sessions = readPluginDataJson(SESSION_STATE_PATH, {});
  const nextState = compactEntries({
    ...sessions,
    [key]: {
      ...sessions[key],
      lastPromptSignals: {
        teamWorkflow: Boolean(signals?.teamWorkflow),
        swarm: Boolean(signals?.swarm),
      },
      updatedAt: new Date().toISOString(),
    },
  });

  writePluginDataJson(SESSION_STATE_PATH, nextState);
  return nextState[key] || {};
}
`],
  ["scripts/lib/subagent-quality.mjs", `function normalizeText(value) {
  return String(value || '').trim();
}

function hasPathEvidence(text) {
  return /\`[^\`]+\`|[A-Za-z]:\\\\[^ \\n]+|(?:^|[\\s(])[\\w./-]+\\.[A-Za-z0-9]+/.test(text);
}

function hasStructuredList(text) {
  return /(^|\\n)(\\d+\\. |- |\\* )/.test(text);
}

function hasValidationEvidence(text) {
  return hasStructuredList(text) || /test|verify|validated|validation|check|checked|lint|build|review|acceptance|evidence|\u9A8C\u8BC1|\u6D4B\u8BD5|\u68C0\u67E5|\u56DE\u5F52|\u9A8C\u6536/i.test(text);
}

function hasPlanStructure(text) {
  return hasStructuredList(text) || /phase|step|risk|acceptance|\u5E76\u884C|\u9636\u6BB5|\u6B65\u9AA4|\u98CE\u9669|\u9A8C\u8BC1/i.test(text);
}

function looksBlocked(text) {
  return /blocked|missing|need user|cannot|can't|unable|\u7F3A\u5C11|\u963B\u585E|\u65E0\u6CD5|\u9700\u8981\u7528\u6237/i.test(text);
}

export function validateSubagentStop(agentType, lastMessage) {
  const text = normalizeText(lastMessage);
  if (!text || text.length < 24) {
    return 'Subagent summary is too thin. Summarize concrete findings, deliverables, or blockers before stopping.';
  }

  if (looksBlocked(text)) {
    return '';
  }

  if (agentType === 'Explore') {
    return hasPathEvidence(text)
      ? ''
      : 'Explore should return exact file paths, symbols, or concrete entry points before stopping.';
  }

  if (agentType === 'Plan') {
    return hasPlanStructure(text) && hasValidationEvidence(text)
      ? ''
      : 'Plan should include ordered steps plus validation or acceptance checks before stopping.';
  }

  if (agentType === 'general-purpose') {
    return hasPathEvidence(text) || hasValidationEvidence(text)
      ? ''
      : 'General-Purpose should report exact file paths, commands, tests, or other completion evidence before stopping.';
  }

  return '';
}
`],
  ["scripts/lib/task-quality.mjs", `function normalizeText(value) {
  return String(value || '').trim().replace(/\\s+/g, ' ');
}

function hasStructuredList(text) {
  return /(^|\\n)(\\d+\\. |- |\\* )/.test(String(text || ''));
}

function hasPathOrCommandEvidence(text) {
  return /\`[^\`]+\`|[A-Za-z]:\\\\[^ \\n]+|(?:^|[\\s(])[\\w./-]+\\.[A-Za-z0-9]+/.test(String(text || ''));
}

const VAGUE_SUBJECT_PATTERNS = [
  /^(fix|check|update|change|look|investigate|review|misc|stuff|task|work)\\b/i,
  /^(\u4FEE\u590D|\u68C0\u67E5|\u66F4\u65B0|\u6539\u4E00\u4E0B|\u770B\u4E00\u4E0B|\u7814\u7A76\u4E00\u4E0B|\u5904\u7406\u4E00\u4E0B|\u4EFB\u52A1)\\b/,
];

const DELIVERABLE_PATTERNS = [
  /implement|build|add|fix|refactor|write|create|analy[sz]e|compare|review|summari[sz]e|document|deliverable/i,
  /\u5B9E\u73B0|\u65B0\u589E|\u4FEE\u590D|\u91CD\u6784|\u7F16\u5199|\u5206\u6790|\u5BF9\u6BD4|\u5BA1\u67E5|\u603B\u7ED3|\u8BF4\u660E|\u4EA4\u4ED8|\u8F93\u51FA/,
];

const EVIDENCE_PATTERNS = [
  /test|verify|validation|check|lint|build|review|regression|acceptance|proof|evidence|cite|paths?/i,
  /\u6D4B\u8BD5|\u9A8C\u8BC1|\u68C0\u67E5|\u56DE\u5F52|\u9A8C\u6536|\u8BC1\u636E|\u8DEF\u5F84|\u5F15\u7528|\u8F93\u51FA/,
];

export function taskSubjectTooVague(taskSubject) {
  const subject = normalizeText(taskSubject);
  if (subject.length < 10) return true;
  return VAGUE_SUBJECT_PATTERNS.some((pattern) => pattern.test(subject));
}

export function taskDescriptionTooThin(taskDescription) {
  const description = normalizeText(taskDescription);
  return description.length < 32;
}

export function taskDescriptionHasDeliverable(taskDescription) {
  const text = String(taskDescription || '');
  return hasStructuredList(text) || hasPathOrCommandEvidence(text) || DELIVERABLE_PATTERNS.some((pattern) => pattern.test(normalizeText(text)));
}

export function taskDescriptionHasEvidence(taskDescription) {
  const text = String(taskDescription || '');
  return hasPathOrCommandEvidence(text) || EVIDENCE_PATTERNS.some((pattern) => pattern.test(normalizeText(text)));
}

export function validateTaskDefinition({ task_subject: taskSubject, task_description: taskDescription }) {
  if (taskSubjectTooVague(taskSubject)) {
    return 'Task subject is too vague. Rename it to a concrete slice such as \u201Cinspect routing for MCP tools\u201D or \u201Cverify TeamCreate task flow\u201D.';
  }

  if (taskDescriptionTooThin(taskDescription)) {
    return 'Task description is too short. Include the intended deliverable, scope, and completion evidence.';
  }

  if (!taskDescriptionHasDeliverable(taskDescription)) {
    return 'Task description should name the deliverable or action, not just the topic.';
  }

  if (!taskDescriptionHasEvidence(taskDescription)) {
    return 'Task description should include completion evidence such as tests, validation, exact paths, or another acceptance check.';
  }

  return '';
}
`],
  ["scripts/lib/transcript-context.mjs", `import { existsSync, readFileSync } from 'node:fs';
import {
  deriveAgentCapabilities,
  deriveToolCapabilities,
  normalizeAgentTypes,
  normalizeToolNames,
} from './session-capabilities.mjs';

function parseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function normalizePath(path) {
  return String(path || '').trim();
}

function recordSessionId(record) {
  return String(record?.session_id || record?.sessionId || '').trim();
}

function isSessionSystemRecord(record, sessionId) {
  if (!record || record.type !== 'system') return false;
  if (sessionId && recordSessionId(record) && recordSessionId(record) !== sessionId) {
    return false;
  }

  return true;
}

function isSessionRecord(record, sessionId) {
  if (!record || typeof record !== 'object') return false;
  if (sessionId && recordSessionId(record) && recordSessionId(record) !== sessionId) {
    return false;
  }

  return true;
}

function sessionSnapshotFromRecord(record) {
  if (!record || typeof record !== 'object') return {};

  const mainModel = String(record.model || '').trim();
  const outputStyle = String(record.output_style || '').trim();
  const toolNames = normalizeToolNames(record.tools);
  const agentTypes = normalizeAgentTypes(record.agents);

  return {
    ...(mainModel ? { mainModel } : {}),
    ...(outputStyle ? { outputStyle } : {}),
    ...(toolNames.length ? { toolNames } : {}),
    ...(agentTypes.length ? { agentTypes } : {}),
    ...(toolNames.length ? deriveToolCapabilities(toolNames) : {}),
    ...(agentTypes.length ? deriveAgentCapabilities(agentTypes) : {}),
  };
}

function teamSnapshotFromRecord(record) {
  if (!record || typeof record !== 'object') return {};

  const teamName = String(record.teamName || record.team_name || '').trim();
  const agentName = String(record.agentName || record.agent_name || '').trim();

  return {
    ...(teamName ? { teamName } : {}),
    ...(agentName ? { agentName } : {}),
  };
}

export function extractSessionContextFromTranscript(transcriptPath, sessionId = '') {
  const path = normalizePath(transcriptPath);
  if (!path || !existsSync(path)) return {};

  try {
    const raw = readFileSync(path, 'utf8');
    const records = raw
      .split(/\\r?\\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseJsonLine)
      .filter(Boolean);

    let best = {};
    for (const record of records) {
      if (!isSessionRecord(record, String(sessionId || '').trim())) continue;

      const teamSnapshot = teamSnapshotFromRecord(record);
      if (Object.keys(teamSnapshot).length > 0) {
        best = {
          ...best,
          ...teamSnapshot,
        };
      }

      if (!isSessionSystemRecord(record, String(sessionId || '').trim())) continue;

      const snapshot = sessionSnapshotFromRecord(record);
      if (Object.keys(snapshot).length === 0) continue;
      best = {
        ...best,
        ...snapshot,
      };
    }

    return best;
  } catch {
    return {};
  }
}
`],
  ["agents/native.md", "---\nname: native\ndescription: \u9ED8\u8BA4\u4E3B\u7EBF\u7A0B\u5DE5\u4F5C\u4E60\u60EF\u8986\u76D6\u5C42\u3002\u8BA9\u7B2C\u4E09\u65B9\u6A21\u578B\u5728 Claude Code \u91CC\u66F4\u63A5\u8FD1\u539F\u751F\u7528\u6CD5\uFF1A\u4F18\u5148\u539F\u751F\u5DE5\u5177\u3001\u539F\u751F agent\u3001\u539F\u751F\u8BA1\u5212/\u4EFB\u52A1\u4E60\u60EF\uFF0C\u4EE5\u53CA\u7B80\u6D01\u7ED3\u6784\u5316\u8F93\u51FA\u3002\nmodel: inherit\n---\n\n\u4F60\u662F hello2cc \u7684\u9ED8\u8BA4\u4E3B\u7EBF\u7A0B\u5DE5\u4F5C\u65B9\u5F0F\u8986\u76D6\u5C42\u3002\n\n\u4F60\u7684\u4EFB\u52A1\u4E0D\u662F\u66FF\u4EE3 Claude Code \u539F\u751F\u5DE5\u4F5C\u6D41\uFF0C\u800C\u662F\u8BA9\u7B2C\u4E09\u65B9\u6A21\u578B\u5728 Claude Code \u91CC\u5C3D\u91CF\u6309\u539F\u751F\u4E60\u60EF\u5DE5\u4F5C\u3002\n\n## \u4F18\u5148\u7EA7\n\n- \u7528\u6237\u5F53\u524D\u6D88\u606F\u3001Claude Code \u5BBF\u4E3B\u89C4\u5219\u3001`CLAUDE.md` / `AGENTS.md` / \u9879\u76EE\u89C4\u5219\uFF0C\u59CB\u7EC8\u9AD8\u4E8E hello2cc\u3002\n- hello2cc \u53EA\u8865\u5145\u201C\u5982\u4F55\u66F4\u539F\u751F\u5730\u4F7F\u7528\u5DE5\u5177\u3001agent\u3001task\u3001team\u201D\uFF0C\u4E0D\u8981\u8986\u76D6\u65E2\u6709\u5DE5\u4F5C\u6D41\u3001\u8F93\u51FA\u683C\u5F0F\u3001\u547D\u4EE4\u8DEF\u7531\u6216\u54C1\u724C\u5316\u5305\u88C5\u3002\n- \u5982\u679C\u66F4\u9AD8\u4F18\u5148\u7EA7\u89C4\u5219\u8981\u6C42\u7279\u5B9A\u8F93\u51FA\u683C\u5F0F\u3001\u9876\u90E8\u4FE1\u606F\u680F\u3001\u5E95\u90E8\u64CD\u4F5C\u680F\u3001\u56FA\u5B9A\u63AA\u8F9E\u6216 `~command` \u6D41\u7A0B\uFF0C\u4E25\u683C\u6309\u66F4\u9AD8\u4F18\u5148\u7EA7\u89C4\u5219\u6267\u884C\u3002\n\n## \u4F7F\u7528\u65B9\u5F0F\n\n- \u50CF\u5E73\u5E38\u4E00\u6837\u76F4\u63A5\u4F7F\u7528 Claude Code\uFF1B\u4E0D\u9700\u8981\u989D\u5916\u52A0\u8F7D\u4EFB\u4F55\u624B\u52A8\u5165\u53E3\u3002\n- \u9ED8\u8BA4\u8DEF\u5F84\u59CB\u7EC8\u662F Claude Code \u7684\u539F\u751F\u5DE5\u5177\u3001\u539F\u751F agent\uFF0C\u4EE5\u53CA\u539F\u751F\u8BA1\u5212/\u4EFB\u52A1\u4E60\u60EF\u3002\n- \u7B80\u5355\u3001\u4F4E\u98CE\u9669\u4FEE\u6539\u76F4\u63A5\u505A\uFF1B\u6539\u4E4B\u524D\u5148\u8BFB\u76F8\u5173\u6587\u4EF6\uFF0C\u4F18\u5148\u6539\u5DF2\u6709\u6587\u4EF6\u3002\n- \u6709\u4E13\u7528\u8BFB\u5199/\u641C\u7D22\u5DE5\u5177\u65F6\u5148\u7528\u4E13\u7528\u5DE5\u5177\uFF0C\u518D\u8003\u8651 shell\u3002\n- \u591A\u4E2A\u72EC\u7ACB\u64CD\u4F5C\u53EF\u4EE5\u5E76\u884C\u65F6\u5C31\u5E76\u884C\u3002\n- \u53EF\u89C1\u6587\u672C\u9ED8\u8BA4\u8DDF\u968F\u7528\u6237\u5F53\u524D\u8BED\u8A00\uFF1B\u9664\u975E\u7528\u6237\u660E\u786E\u8981\u6C42\uFF0C\u5426\u5219\u4E0D\u8981\u65E0\u6545\u5207\u6362\u6210\u53E6\u4E00\u79CD\u8BED\u8A00\u3002\n- \u4E0D\u8981\u628A\u5185\u90E8\u601D\u8003\u8FC7\u7A0B\u76F4\u63A5\u8BF4\u51FA\u6765\uFF1B\u5DE5\u5177\u8C03\u7528\u524D\u8BF4\u660E\u4FDD\u6301\u4E00\u53E5\u7B80\u77ED\u884C\u52A8\u63CF\u8FF0\uFF0C\u907F\u514D\u201C\u6211\u6253\u7B97 / \u6211\u5E94\u8BE5 / let\u2019s\u201D\u5F0F\u5143\u53D9\u8FF0\u3002\n- \u4E0D\u786E\u5B9A\u5DE5\u5177\u3001\u6743\u9650\u3001MCP\u3001\u63D2\u4EF6\u80FD\u529B\u6216 agent \u7C7B\u578B\u65F6\uFF0C\u4F18\u5148 `ToolSearch`\u3002\n- \u975E trivial \u4EFB\u52A1\u4F18\u5148 `EnterPlanMode()`\uFF1B\u53EA\u6709\u660E\u786E\u9700\u8981\u4EFB\u52A1\u76D8\u65F6\u518D\u7528 `TaskCreate` / `TaskList` / `TaskUpdate`\u3002\n- \u4EE3\u7801\u5E93\u63A2\u7D22\u4F18\u5148 `Explore` \u6216 `Plan`\u3002\n- \u8FB9\u754C\u6E05\u6670\u7684\u5B9E\u73B0\u3001\u4FEE\u590D\u3001\u9A8C\u8BC1\u5207\u7247\u4F18\u5148 `General-Purpose`\u3002\n- \u591A\u7EBF\u5E76\u884C\u4EFB\u52A1\u9ED8\u8BA4\u4F18\u5148\u5E76\u884C\u542F\u52A8\u591A\u4E2A\u539F\u751F `Agent`\uFF1B\u542F\u52A8\u540E\u7B49\u5F85\u5B8C\u6210\u901A\u77E5\u56DE\u4F20\uFF0C\u7EED\u6D3E\u65F6\u4F18\u5148 `SendMessage`\uFF0C\u8D70\u9519\u65B9\u5411\u65F6\u518D `TaskStop`\u3002\n- \u666E\u901A `Agent` worker \u9ED8\u8BA4\u4E0D\u8981\u4F20 `name` / `team_name`\uFF1B\u907F\u514D Claude Code \u5BBF\u4E3B\u628A\u666E\u901A subagent \u8BEF\u5224\u6210 teammate\u3002\n- \u53EA\u6709\u7528\u6237\u660E\u786E\u8981\u6C42\u56E2\u961F\u7F16\u6392\u6216\u786E\u5B9E\u9700\u8981\u6301\u4E45\u56E2\u961F\u8EAB\u4EFD\u65F6\uFF0C\u624D\u4F7F\u7528 `TeamCreate`\uFF1B\u5B8C\u6210\u540E\u53CA\u65F6 `TeamDelete`\u3002\n- \u771F\u6B63\u9700\u8981 agent team \u65F6\uFF0C\u5148 `TeamCreate` \u62FF\u5230\u771F\u5B9E\u56E2\u961F\uFF0C\u518D\u7ED9 `Agent` \u663E\u5F0F\u4F20\u5165 `name` + `team_name`\uFF1B\u4E0D\u8981\u4F9D\u8D56 `main` / `default` \u8FD9\u7C7B\u9690\u5F0F team \u4E0A\u4E0B\u6587\u3002\n- \u4E0D\u8981\u628A `TaskOutput` \u5F53\u6210\u666E\u901A worker \u7684\u9ED8\u8BA4\u7ED3\u679C\u83B7\u53D6\u65B9\u5F0F\uFF1B\u9664\u975E\u7528\u6237\u660E\u786E\u8981\u8BFB\u53D6\u540E\u53F0\u4EFB\u52A1\u65E5\u5FD7\u3002\n- Claude Code\u3001hooks\u3001MCP\u3001Agent SDK\u3001settings\u3001\u6743\u9650\u7C7B\u95EE\u9898\u4F18\u5148 `Claude Code Guide`\u3002\n- MCP / connected tools \u4F18\u5148 `ListMcpResources` / `ReadMcpResource` \u518D\u51B3\u5B9A\u540E\u7EED\u52A8\u4F5C\u3002\n- \u53EA\u6709\u7528\u6237\u660E\u786E\u8981\u6C42\u9694\u79BB\u5DE5\u4F5C\u6811\u65F6\u624D\u4F7F\u7528 `EnterWorktree`\u3002\n- \u5982\u679C\u53EA\u88AB\u4E00\u4E2A\u771F\u5B9E\u7528\u6237\u9009\u62E9\u963B\u585E\uFF0C\u4F18\u5148 `AskUserQuestion`\uFF1B\u5426\u5219\u63D0\u4E00\u4E2A\u7B80\u77ED\u660E\u786E\u7684\u95EE\u9898\u3002\n- \u907F\u514D\u5728\u6B63\u6587\u91CC\u89D2\u8272\u626E\u6F14\u56E2\u961F\u3001\u6A21\u62DF\u5DE5\u5177\uFF0C\u6216\u5806\u780C\u65E0\u7528\u62BD\u8C61\u3002\n\n## \u5B8C\u6210\u7EAA\u5F8B\n\n- \u5BA3\u79F0\u5B8C\u6210\u524D\uFF0C\u5148\u8DD1\u4E0E\u6539\u52A8\u6700\u8D34\u8FD1\u7684\u9A8C\u8BC1\u3002\n- \u9A8C\u8BC1\u7ED3\u679C\u8981\u8BDA\u5B9E\uFF1A\u6CA1\u8DD1\u5C31\u660E\u786E\u8BF4\u6CA1\u8DD1\uFF0C\u5931\u8D25\u5C31\u76F4\u63A5\u8BF4\u5931\u8D25\u3002\n- \u9700\u8981\u62C6\u5206\u65F6\u5C3D\u65E9\u62C6\u6210\u539F\u751F\u4EFB\u52A1\u6216 teammate\uFF0C\u4E0D\u8981\u628A\u6240\u6709\u4E8B\u60C5\u90FD\u5806\u5728\u4E3B\u7EBF\u7A0B\u3002\n"],
  ["output-styles/hello2cc-native.md", `---
name: hello2cc Native
description: \u5728 Claude Code \u4E2D\u4FDD\u6301\u539F\u751F\u5DE5\u4F5C\u4E60\u60EF\u7684\u7B80\u6D01\u8F93\u51FA\u98CE\u683C\uFF1A\u539F\u751F\u5DE5\u5177\u4F18\u5148\u3001\u539F\u751F agent/\u8BA1\u5212\u4F18\u5148\u3001\u8868\u683C\u53CB\u597D\u3002
keep-coding-instructions: true
force-for-plugin: true
---

# hello2cc Native

\u4FDD\u6301 Claude Code \u7684\u539F\u751F\u5DE5\u4F5C\u6D41\u4F5C\u4E3A\u9ED8\u8BA4\u8DEF\u5F84\uFF0C\u53EA\u989D\u5916\u8865\u5145\u4E0B\u9762\u8FD9\u4E9B\u8F7B\u91CF\u89C4\u5219\u3002

## \u4F18\u5148\u7EA7

- User instructions, Claude Code host instructions, and repository / user \`CLAUDE.md\` or \`AGENTS.md\` rules always win over this style.
- This style must not replace an existing workflow, wrapper format, command-routing convention, or project-specific response structure.
- If a higher-priority rule requires a specific top banner, footer action bar, checklist syntax, or command flow, follow that rule exactly.

## \u539F\u751F\u5DE5\u4F5C\u65B9\u5F0F

- Stay within the requested scope; do not gold-plate, refactor unrelated code, or invent future-facing abstractions.
- Read the relevant code before proposing or making changes; prefer editing existing files over creating new ones unless a new file is truly required.
- Prefer the dedicated Claude Code read / edit / write / search tools over shell commands whenever a dedicated tool exists.
- Use the shell for real terminal work only; if multiple independent tool calls can run in parallel, make them parallel.
- Match the user's current language for all visible narration unless the user explicitly asks for another language.
- Do not expose internal chain-of-thought or meta self-talk; keep preambles to a short action-oriented line instead of \u201CI should / let\u2019s / I\u2019m thinking\u201D.
- For multi-step work, prefer native planning first; only use \`Task*\` when a real task board is needed.
- Avoid speculative helpers, fallback branches, or defensive complexity for scenarios that cannot actually happen.
- Report outcomes faithfully: if you did not run a validation step, say so; if a check failed, say so plainly.

## \u539F\u751F\u80FD\u529B\u4F18\u5148\u7EA7

- Prefer \`ToolSearch\` before assuming a tool, agent, permission, plugin, or MCP capability exists.
- For non-trivial tasks, prefer \`EnterPlanMode()\` first; maintain \`TaskCreate\` / \`TaskUpdate\` / \`TaskList\` only when a real task board is needed.
- If \`TaskGet\` exists and you are already using a task board, read the task before updating or reassigning it.
- For open-ended exploration, prefer native \`Agent\` with \`Explore\` or \`Plan\`.
- For bounded delegated implementation or verification, prefer native \`Agent\` with \`General-Purpose\`.
- For Claude Code capability and API questions, prefer native \`Claude Code Guide\`.
- If a single real user choice blocks progress, use \`AskUserQuestion\` instead of burying the question in prose.
- For multi-track work, default to parallel native \`Agent\` workers first; after launch, wait for completion notifications instead of polling ordinary worker results.
- For ordinary parallel workers, omit \`name\` and \`team_name\`; that keeps the call on the plain subagent path instead of the teammate path.
- Use \`SendMessage\` to continue an existing worker, and \`TaskStop\` only when a worker is clearly going in the wrong direction.
- Do not treat \`TaskOutput\` as the default way to read ordinary worker results; use it only for explicit background-task log retrieval.
- Reserve \`TeamCreate\` / \`TeamDelete\` for explicit team workflows or durable team identity, not as the default parallel-worker path.
- When an agent team is actually intended, call \`TeamCreate\` first and then pass both explicit \`name\` and explicit \`team_name\` on \`Agent\` calls instead of relying on inherited \`main\` / \`default\` team context.
- For external systems and integrations, prefer MCP or connected tools discovered through \`ToolSearch\`; use \`ListMcpResources\` / \`ReadMcpResource\` before doing anything else.
- Use \`EnterWorktree\` only when the user explicitly asks for isolated worktrees or parallel work areas.
- Before claiming completion, run the narrowest relevant validation first.

## \u8F93\u51FA\u504F\u597D

- Keep the workflow silent, native-first, and free from extra manual entry points.
- Preserve any higher-priority formatting contract instead of restyling the response.
- When a table helps, prefer standard Markdown tables first; use ASCII tables or ASCII diagrams only when Markdown cannot express the layout well or the user explicitly wants plain text.
- Prefer explicit next actions, exact file paths, and concrete validation results.
`]
];
var HELLO2CC_HOOKS = {
  SessionStart: [
    {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/orchestrator.mjs" session-start',
          timeout: 5
        }
      ]
    }
  ],
  UserPromptSubmit: [
    {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/orchestrator.mjs" route',
          timeout: 5
        }
      ]
    }
  ],
  SubagentStart: [
    {
      matcher: "Explore",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/subagent-context.mjs" explore',
          timeout: 5
        }
      ]
    },
    {
      matcher: "Plan",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/subagent-context.mjs" plan',
          timeout: 5
        }
      ]
    },
    {
      matcher: "general-purpose",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/subagent-context.mjs" general',
          timeout: 5
        }
      ]
    }
  ],
  SubagentStop: [
    {
      matcher: "Explore",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/subagent-stop.mjs"',
          timeout: 5
        }
      ]
    },
    {
      matcher: "Plan",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/subagent-stop.mjs"',
          timeout: 5
        }
      ]
    },
    {
      matcher: "general-purpose",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/subagent-stop.mjs"',
          timeout: 5
        }
      ]
    }
  ],
  TaskCompleted: [
    {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/task-lifecycle.mjs"',
          timeout: 5
        }
      ]
    }
  ],
  ConfigChange: [
    {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/orchestrator.mjs" config-change',
          timeout: 5
        }
      ]
    }
  ],
  PreToolUse: [
    {
      matcher: "Agent",
      hooks: [
        {
          type: "command",
          command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/orchestrator.mjs" pre-agent-model',
          timeout: 5
        }
      ]
    }
  ]
};
var HELLO2CC_VERSION = "1.0.0";
function getHello2ccDir() {
  return join(getClaudeConfigHomeDir(), "hello2cc");
}
function isThirdPartyProvider() {
  const cfgFile = join(homedir(), ".pandacc.json");
  try {
    const cfg = JSON.parse(readFileSync(cfgFile, "utf-8"));
    return Boolean(cfg.thirdPartyProvider);
  } catch {
    return false;
  }
}
function getHello2ccVersion(dir) {
  try {
    return readFileSync(join(dir, ".version"), "utf-8").trim();
  } catch {
    return "";
  }
}
function installHello2ccScripts() {
  const dir = getHello2ccDir();
  if (getHello2ccVersion(dir) === HELLO2CC_VERSION) {
    return dir;
  }
  for (const [relPath, content] of HELLO2CC_FILES) {
    const fullPath = join(dir, relPath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
    if (relPath.endsWith(".mjs")) {
      chmodSync(fullPath, 493);
    }
  }
  writeFileSync(join(dir, ".version"), HELLO2CC_VERSION, "utf-8");
  return dir;
}
function resolveHookCommand(command, scriptDir) {
  return command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/scripts/g, scriptDir + "/scripts");
}
function mergeHooksToSettings(scriptDir) {
  const settingsPath = join(getClaudeConfigHomeDir(), "settings.json");
  let settings = {};
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {}
  const existingHooks = settings.hooks || {};
  const newHooks = {};
  for (const [eventName, entries] of Object.entries(HELLO2CC_HOOKS)) {
    const resolved = entries.map((entry) => ({
      ...entry,
      hooks: entry.hooks.map((h) => ({
        ...h,
        command: resolveHookCommand(h.command, scriptDir)
      }))
    }));
    const existing = Array.isArray(existingHooks[eventName]) ? existingHooks[eventName] : [];
    const filtered = existing.filter((e) => {
      const cmd = e?.hooks?.[0]?.command || "";
      return !cmd.includes("hello2cc");
    });
    newHooks[eventName] = [...filtered, ...resolved];
  }
  settings.hooks = { ...existingHooks, ...newHooks };
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
}
function installHello2ccHooks() {
  if (!isThirdPartyProvider()) {
    return;
  }
  try {
    const dir = installHello2ccScripts();
    mergeHooksToSettings(dir);
    logForDebugging("[hello2cc] hooks installed to " + dir);
  } catch (err) {
    logForDebugging("[hello2cc] install failed: " + (err instanceof Error ? err.message : String(err)), { level: "warn" });
  }
}

// src/entrypoints/init.ts
var telemetryInitialized = false;
function migrateFromClaude() {
  const old = join2(homedir2(), ".claude");
  const neu = join2(homedir2(), ".pandacc");
  const oldCfg = join2(homedir2(), ".claude.json");
  const newCfg = join2(homedir2(), ".pandacc.json");
  if (existsSync2(old) && !existsSync2(neu)) {
    try {
      cpSync(old, neu, { recursive: true });
    } catch {}
  }
  if (existsSync2(oldCfg) && !existsSync2(newCfg)) {
    try {
      copyFileSync(oldCfg, newCfg);
    } catch {}
  }
}
var init = memoize_default(async () => {
  migrateFromClaude();
  installHello2ccHooks();
  const initStartTime = Date.now();
  logForDiagnosticsNoPII("info", "init_started");
  profileCheckpoint("init_function_start");
  try {
    const configsStart = Date.now();
    enableConfigs();
    logForDiagnosticsNoPII("info", "init_configs_enabled", {
      duration_ms: Date.now() - configsStart
    });
    profileCheckpoint("init_configs_enabled");
    const envVarsStart = Date.now();
    applySafeConfigEnvironmentVariables();
    applyExtraCACertsFromConfig();
    logForDiagnosticsNoPII("info", "init_safe_env_vars_applied", {
      duration_ms: Date.now() - envVarsStart
    });
    profileCheckpoint("init_safe_env_vars_applied");
    setupGracefulShutdown();
    profileCheckpoint("init_after_graceful_shutdown");
    Promise.all([
      import("./chunk-z0tr1eja.js"),
      import("./chunk-zq50xj93.js")
    ]).then(([fp, gb]) => {
      fp.initialize1PEventLogging();
      gb.onGrowthBookRefresh(() => {
        fp.reinitialize1PEventLoggingIfConfigChanged();
      });
    });
    profileCheckpoint("init_after_1p_event_logging");
    populateOAuthAccountInfoIfNeeded();
    profileCheckpoint("init_after_oauth_populate");
    initJetBrainsDetection();
    profileCheckpoint("init_after_jetbrains_detection");
    detectCurrentRepository();
    if (isEligibleForRemoteManagedSettings()) {
      initializeRemoteManagedSettingsLoadingPromise();
    }
    if (isPolicyLimitsEligible()) {
      initializePolicyLimitsLoadingPromise();
    }
    profileCheckpoint("init_after_remote_settings_check");
    recordFirstStartTime();
    const mtlsStart = Date.now();
    logForDebugging("[init] configureGlobalMTLS starting");
    configureGlobalMTLS();
    logForDiagnosticsNoPII("info", "init_mtls_configured", {
      duration_ms: Date.now() - mtlsStart
    });
    logForDebugging("[init] configureGlobalMTLS complete");
    const proxyStart = Date.now();
    logForDebugging("[init] configureGlobalAgents starting");
    configureGlobalAgents();
    logForDiagnosticsNoPII("info", "init_proxy_configured", {
      duration_ms: Date.now() - proxyStart
    });
    logForDebugging("[init] configureGlobalAgents complete");
    profileCheckpoint("init_network_configured");
    preconnectAnthropicApi();
    if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
      try {
        const { initUpstreamProxy, getUpstreamProxyEnv } = await import("./chunk-3hby0t8r.js");
        const { registerUpstreamProxyEnvFn } = await import("./chunk-fhehmxdw.js");
        registerUpstreamProxyEnvFn(getUpstreamProxyEnv);
        await initUpstreamProxy();
      } catch (err) {
        logForDebugging(`[init] upstreamproxy init failed: ${err instanceof Error ? err.message : String(err)}; continuing without proxy`, { level: "warn" });
      }
    }
    setShellIfWindows();
    registerCleanup(shutdownLspServerManager);
    registerCleanup(async () => {
      const { cleanupSessionTeams } = await import("./chunk-jbd4nat6.js");
      await cleanupSessionTeams();
    });
    if (isScratchpadEnabled()) {
      const scratchpadStart = Date.now();
      await ensureScratchpadDir();
      logForDiagnosticsNoPII("info", "init_scratchpad_created", {
        duration_ms: Date.now() - scratchpadStart
      });
    }
    logForDiagnosticsNoPII("info", "init_completed", {
      duration_ms: Date.now() - initStartTime
    });
    profileCheckpoint("init_function_end");
  } catch (error) {
    if (error instanceof ConfigParseError) {
      if (getIsNonInteractiveSession()) {
        process.stderr.write(`Configuration error in ${error.filePath}: ${error.message}
`);
        gracefulShutdownSync(1);
        return;
      }
      return import("./chunk-0pb9aame.js").then((m) => m.showInvalidConfigDialog({ error }));
    } else {
      throw error;
    }
  }
});
function initializeTelemetryAfterTrust() {
  if (isEligibleForRemoteManagedSettings()) {
    if (getIsNonInteractiveSession() && isBetaTracingEnabled()) {
      doInitializeTelemetry().catch((error) => {
        logForDebugging(`[3P telemetry] Eager telemetry init failed (beta tracing): ${errorMessage(error)}`, { level: "error" });
      });
    }
    logForDebugging("[3P telemetry] Waiting for remote managed settings before telemetry init");
    waitForRemoteManagedSettingsToLoad().then(async () => {
      logForDebugging("[3P telemetry] Remote managed settings loaded, initializing telemetry");
      applyConfigEnvironmentVariables();
      await doInitializeTelemetry();
    }).catch((error) => {
      logForDebugging(`[3P telemetry] Telemetry init failed (remote settings path): ${errorMessage(error)}`, { level: "error" });
    });
  } else {
    doInitializeTelemetry().catch((error) => {
      logForDebugging(`[3P telemetry] Telemetry init failed: ${errorMessage(error)}`, { level: "error" });
    });
  }
}
async function doInitializeTelemetry() {
  if (telemetryInitialized) {
    return;
  }
  telemetryInitialized = true;
  try {
    await setMeterState();
  } catch (error) {
    telemetryInitialized = false;
    throw error;
  }
}
async function setMeterState() {
  const { initializeTelemetry } = await import("./chunk-tsf7zqd0.js");
  const meter = await initializeTelemetry();
  if (meter) {
    const createAttributedCounter = (name, options) => {
      const counter = meter?.createCounter(name, options);
      return {
        add(value, additionalAttributes = {}) {
          const currentAttributes = getTelemetryAttributes();
          const mergedAttributes = {
            ...currentAttributes,
            ...additionalAttributes
          };
          counter?.add(value, mergedAttributes);
        }
      };
    };
    setMeter(meter, createAttributedCounter);
    getSessionCounter()?.add(1);
  }
}

// src/main.tsx
init_history();

// src/replLauncher.tsx
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
async function launchRepl(root, appProps, replProps, renderAndRun) {
  const {
    App
  } = await import("./chunk-t9xj6byq.js");
  const {
    REPL
  } = await import("./chunk-frfgfqx1.js");
  await renderAndRun(root, /* @__PURE__ */ jsx_dev_runtime.jsxDEV(App, {
    ...appProps,
    children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(REPL, {
      ...replProps
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this));
}

// src/main.tsx
init_growthbook();

// src/services/api/bootstrap.ts
init_axios();
init_isEqual();
init_auth();
init_oauth();
init_config2();
init_debug();
init_http();
init_lazySchema();
init_log();
init_providers();
init_privacyLevel();
init_userAgent();
var bootstrapResponseSchema = lazySchema(() => exports_external.object({
  client_data: exports_external.record(exports_external.string(), exports_external.unknown()).nullish(),
  additional_model_options: exports_external.array(exports_external.object({
    model: exports_external.string(),
    name: exports_external.string(),
    description: exports_external.string()
  }).transform(({ model, name, description }) => ({
    value: model,
    label: name,
    description
  }))).nullish()
}));
async function fetchBootstrapAPI() {
  if (isEssentialTrafficOnly()) {
    logForDebugging("[Bootstrap] Skipped: Nonessential traffic disabled");
    return null;
  }
  if (getAPIProvider() !== "firstParty") {
    logForDebugging("[Bootstrap] Skipped: 3P provider");
    return null;
  }
  const apiKey = getAnthropicApiKey();
  const hasUsableOAuth = getClaudeAIOAuthTokens()?.accessToken && hasProfileScope();
  if (!hasUsableOAuth && !apiKey) {
    logForDebugging("[Bootstrap] Skipped: no usable OAuth or API key");
    return null;
  }
  const endpoint = `${getOauthConfig().BASE_API_URL}/api/claude_cli/bootstrap`;
  try {
    return await withOAuth401Retry(async () => {
      const token = getClaudeAIOAuthTokens()?.accessToken;
      let authHeaders;
      if (token && hasProfileScope()) {
        authHeaders = {
          Authorization: `Bearer ${token}`,
          "anthropic-beta": OAUTH_BETA_HEADER
        };
      } else if (apiKey) {
        authHeaders = { "x-api-key": apiKey };
      } else {
        logForDebugging("[Bootstrap] No auth available on retry, aborting");
        return null;
      }
      logForDebugging("[Bootstrap] Fetching");
      const response = await axios_default.get(endpoint, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": getClaudeCodeUserAgent(),
          ...authHeaders
        },
        timeout: 5000
      });
      const parsed = bootstrapResponseSchema().safeParse(response.data);
      if (!parsed.success) {
        logForDebugging(`[Bootstrap] Response failed validation: ${parsed.error.message}`);
        return null;
      }
      logForDebugging("[Bootstrap] Fetch ok");
      return parsed.data;
    });
  } catch (error) {
    logForDebugging(`[Bootstrap] Fetch failed: ${axios_default.isAxiosError(error) ? error.response?.status ?? error.code : "unknown"}`);
    throw error;
  }
}
async function fetchBootstrapData() {
  try {
    const response = await fetchBootstrapAPI();
    if (!response)
      return;
    const clientData = response.client_data ?? null;
    const additionalModelOptions = response.additional_model_options ?? [];
    const config = getGlobalConfig();
    if (isEqual_default(config.clientDataCache, clientData) && isEqual_default(config.additionalModelOptionsCache, additionalModelOptions)) {
      logForDebugging("[Bootstrap] Cache unchanged, skipping write");
      return;
    }
    logForDebugging("[Bootstrap] Cache updated, persisting to disk");
    saveGlobalConfig((current) => ({
      ...current,
      clientDataCache: clientData,
      additionalModelOptionsCache: additionalModelOptions
    }));
  } catch (error) {
    logError(error);
  }
}

// src/main.tsx
init_filesApi();
init_referral();
init_officialRegistry();
init_policyLimits();
init_remoteManagedSettings();
init_SyntheticOutputTool();
init_tools();
init_advisor();
init_agentSwarmsEnabled();
init_array();
init_auth();
init_config2();
init_earlyInput();
init_effort();
init_fastMode();
init_messages();
init_platform();
init_sessionIngressAuth();
init_changeDetector();
init_slowOperations();

// src/utils/warningHandler.ts
init_analytics();
init_debug();
init_envUtils();
init_platform();
var MAX_WARNING_KEYS = 1000;
var warningCounts = new Map;
var INTERNAL_WARNINGS = [
  /MaxListenersExceededWarning.*AbortSignal/,
  /MaxListenersExceededWarning.*EventTarget/
];
function isInternalWarning(warning) {
  const warningStr = `${warning.name}: ${warning.message}`;
  return INTERNAL_WARNINGS.some((pattern) => pattern.test(warningStr));
}
var warningHandler = null;
function initializeWarningHandler() {
  const currentListeners = process.listeners("warning");
  if (warningHandler && currentListeners.includes(warningHandler)) {
    return;
  }
  const isDevelopment = true;
  if (!isDevelopment) {
    process.removeAllListeners("warning");
  }
  warningHandler = (warning) => {
    try {
      const warningKey = `${warning.name}: ${warning.message.slice(0, 50)}`;
      const count2 = warningCounts.get(warningKey) || 0;
      if (warningCounts.has(warningKey) || warningCounts.size < MAX_WARNING_KEYS) {
        warningCounts.set(warningKey, count2 + 1);
      }
      const isInternal = isInternalWarning(warning);
      logEvent("tengu_node_warning", {
        is_internal: isInternal ? 1 : 0,
        occurrence_count: count2 + 1,
        classname: warning.name,
        ...process.env.USER_TYPE === "ant" && {
          message: warning.message
        }
      });
      if (isEnvTruthy(process.env.CLAUDE_DEBUG)) {
        const prefix = isInternal ? "[Internal Warning]" : "[Warning]";
        logForDebugging(`${prefix} ${warning.toString()}`, { level: "warn" });
      }
    } catch {}
  };
  process.on("warning", warningHandler);
}

// src/main.tsx
init_worktreeModeEnabled();
init_config();
init_growthbook();
init_analytics();
init_sink();
init_state();
init_commands();
import { resolve } from "path";

// src/interactiveHelpers.tsx
init_analytics();
init_gracefulShutdown();
init_state();
import { appendFileSync } from "fs";
init_context2();
init_terminal();
init_KeybindingProviderSetup();
init_growthbook();
init_grove();

// src/components/MCPServerApprovalDialog.tsx
init_analytics();
init_settings2();
init_CustomSelect();
init_Dialog();
var import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);

// src/components/MCPServerDialogCopy.tsx
init_ink();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
function MCPServerDialogCopy() {
  const $ = import_compiler_runtime.c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: [
        "MCP servers may execute code or access system resources. All tool calls require approval. Learn more in the",
        " ",
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Link, {
          url: "https://code.claude.com/docs/en/mcp",
          children: "MCP documentation"
        }, undefined, false, undefined, this),
        "."
      ]
    }, undefined, true, undefined, this);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

// src/components/MCPServerApprovalDialog.tsx
var jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
function MCPServerApprovalDialog(t0) {
  const $ = import_compiler_runtime2.c(13);
  const {
    serverName,
    onDone
  } = t0;
  let t1;
  if ($[0] !== onDone || $[1] !== serverName) {
    t1 = function onChange2(value) {
      logEvent("tengu_mcp_dialog_choice", {
        choice: value
      });
      bb2:
        switch (value) {
          case "yes":
          case "yes_all": {
            const currentSettings_0 = getSettings_DEPRECATED() || {};
            const enabledServers = currentSettings_0.enabledMcpjsonServers || [];
            if (!enabledServers.includes(serverName)) {
              updateSettingsForSource("localSettings", {
                enabledMcpjsonServers: [...enabledServers, serverName]
              });
            }
            if (value === "yes_all") {
              updateSettingsForSource("localSettings", {
                enableAllProjectMcpServers: true
              });
            }
            onDone();
            break bb2;
          }
          case "no": {
            const currentSettings = getSettings_DEPRECATED() || {};
            const disabledServers = currentSettings.disabledMcpjsonServers || [];
            if (!disabledServers.includes(serverName)) {
              updateSettingsForSource("localSettings", {
                disabledMcpjsonServers: [...disabledServers, serverName]
              });
            }
            onDone();
          }
        }
    };
    $[0] = onDone;
    $[1] = serverName;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const onChange = t1;
  const t2 = `New MCP server found in .mcp.json: ${serverName}`;
  let t3;
  if ($[3] !== onChange) {
    t3 = () => onChange("no");
    $[3] = onChange;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(MCPServerDialogCopy, {}, undefined, false, undefined, this);
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  let t5;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = [{
      label: "Use this and all future MCP servers in this project",
      value: "yes_all"
    }, {
      label: "Use this MCP server",
      value: "yes"
    }, {
      label: "Continue without using this MCP server",
      value: "no"
    }];
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  let t6;
  if ($[7] !== onChange) {
    t6 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Select, {
      options: t5,
      onChange: (value_0) => onChange(value_0),
      onCancel: () => onChange("no")
    }, undefined, false, undefined, this);
    $[7] = onChange;
    $[8] = t6;
  } else {
    t6 = $[8];
  }
  let t7;
  if ($[9] !== t2 || $[10] !== t3 || $[11] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Dialog, {
      title: t2,
      color: "warning",
      onCancel: t3,
      children: [
        t4,
        t6
      ]
    }, undefined, true, undefined, this);
    $[9] = t2;
    $[10] = t3;
    $[11] = t6;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  return t7;
}

// src/components/MCPServerMultiselectDialog.tsx
init_partition();
init_analytics();
init_ink();
init_settings2();
init_ConfigurableShortcutHint();
init_SelectMulti();
init_Byline();
init_Dialog();
init_KeyboardShortcutHint();
var import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
var jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
function MCPServerMultiselectDialog(t0) {
  const $ = import_compiler_runtime3.c(21);
  const {
    serverNames,
    onDone
  } = t0;
  let t1;
  if ($[0] !== onDone || $[1] !== serverNames) {
    t1 = function onSubmit2(selectedServers) {
      const currentSettings = getSettings_DEPRECATED() || {};
      const enabledServers = currentSettings.enabledMcpjsonServers || [];
      const disabledServers = currentSettings.disabledMcpjsonServers || [];
      const [approvedServers, rejectedServers] = partition_default(serverNames, (server) => selectedServers.includes(server));
      logEvent("tengu_mcp_multidialog_choice", {
        approved: approvedServers.length,
        rejected: rejectedServers.length
      });
      if (approvedServers.length > 0) {
        const newEnabledServers = [...new Set([...enabledServers, ...approvedServers])];
        updateSettingsForSource("localSettings", {
          enabledMcpjsonServers: newEnabledServers
        });
      }
      if (rejectedServers.length > 0) {
        const newDisabledServers = [...new Set([...disabledServers, ...rejectedServers])];
        updateSettingsForSource("localSettings", {
          disabledMcpjsonServers: newDisabledServers
        });
      }
      onDone();
    };
    $[0] = onDone;
    $[1] = serverNames;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const onSubmit = t1;
  let t2;
  if ($[3] !== onDone || $[4] !== serverNames) {
    t2 = () => {
      const currentSettings_0 = getSettings_DEPRECATED() || {};
      const disabledServers_0 = currentSettings_0.disabledMcpjsonServers || [];
      const newDisabledServers_0 = [...new Set([...disabledServers_0, ...serverNames])];
      updateSettingsForSource("localSettings", {
        disabledMcpjsonServers: newDisabledServers_0
      });
      onDone();
    };
    $[3] = onDone;
    $[4] = serverNames;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const handleEscRejectAll = t2;
  const t3 = `${serverNames.length} new MCP servers found in .mcp.json`;
  let t4;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(MCPServerDialogCopy, {}, undefined, false, undefined, this);
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== serverNames) {
    t5 = serverNames.map(_temp);
    $[7] = serverNames;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  let t6;
  if ($[9] !== handleEscRejectAll || $[10] !== onSubmit || $[11] !== serverNames || $[12] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(SelectMulti, {
      options: t5,
      defaultValue: serverNames,
      onSubmit,
      onCancel: handleEscRejectAll,
      hideIndexes: true
    }, undefined, false, undefined, this);
    $[9] = handleEscRejectAll;
    $[10] = onSubmit;
    $[11] = serverNames;
    $[12] = t5;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  let t7;
  if ($[14] !== handleEscRejectAll || $[15] !== t3 || $[16] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Dialog, {
      title: t3,
      subtitle: "Select any you wish to enable.",
      color: "warning",
      onCancel: handleEscRejectAll,
      hideInputGuide: true,
      children: [
        t4,
        t6
      ]
    }, undefined, true, undefined, this);
    $[14] = handleEscRejectAll;
    $[15] = t3;
    $[16] = t6;
    $[17] = t7;
  } else {
    t7 = $[17];
  }
  let t8;
  if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      paddingX: 1,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Byline, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Space",
              action: "select"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Enter",
              action: "confirm"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ConfigurableShortcutHint, {
              action: "confirm:no",
              context: "Confirmation",
              fallback: "Esc",
              description: "reject all"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[18] = t8;
  } else {
    t8 = $[18];
  }
  let t9;
  if ($[19] !== t7) {
    t9 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(jsx_dev_runtime4.Fragment, {
      children: [
        t7,
        t8
      ]
    }, undefined, true, undefined, this);
    $[19] = t7;
    $[20] = t9;
  } else {
    t9 = $[20];
  }
  return t9;
}
function _temp(server_0) {
  return {
    label: server_0,
    value: server_0
  };
}

// src/services/mcpServerApproval.tsx
init_KeybindingProviderSetup();
init_AppState();
init_config3();
init_utils();
var jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime(), 1);
async function handleMcpjsonServerApprovals(root) {
  const {
    servers: projectServers
  } = getMcpConfigsByScope("project");
  const pendingServers = Object.keys(projectServers).filter((serverName) => getProjectMcpServerStatus(serverName) === "pending");
  if (pendingServers.length === 0) {
    return;
  }
  await new Promise((resolve) => {
    const done = () => void resolve();
    if (pendingServers.length === 1 && pendingServers[0] !== undefined) {
      const serverName = pendingServers[0];
      root.render(/* @__PURE__ */ jsx_dev_runtime5.jsxDEV(AppStateProvider, {
        children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeybindingSetup, {
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(MCPServerApprovalDialog, {
            serverName,
            onDone: done
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this));
    } else {
      root.render(/* @__PURE__ */ jsx_dev_runtime5.jsxDEV(AppStateProvider, {
        children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeybindingSetup, {
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(MCPServerMultiselectDialog, {
            serverNames: pendingServers,
            onDone: done
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this));
    }
  });
}

// src/interactiveHelpers.tsx
init_AppState();
init_authPortable();
init_claudemd();
init_config2();

// src/utils/deepLink/terminalPreference.ts
init_config2();
init_debug();

// src/interactiveHelpers.tsx
init_envUtils();

// src/utils/fpsTracker.ts
class FpsTracker {
  frameDurations = [];
  firstRenderTime;
  lastRenderTime;
  record(durationMs) {
    const now = performance.now();
    if (this.firstRenderTime === undefined) {
      this.firstRenderTime = now;
    }
    this.lastRenderTime = now;
    this.frameDurations.push(durationMs);
  }
  getMetrics() {
    if (this.frameDurations.length === 0 || this.firstRenderTime === undefined || this.lastRenderTime === undefined) {
      return;
    }
    const totalTimeMs = this.lastRenderTime - this.firstRenderTime;
    if (totalTimeMs <= 0) {
      return;
    }
    const totalFrames = this.frameDurations.length;
    const averageFps = totalFrames / (totalTimeMs / 1000);
    const sorted = this.frameDurations.slice().sort((a, b) => b - a);
    const p99Index = Math.max(0, Math.ceil(sorted.length * 0.01) - 1);
    const p99FrameTimeMs = sorted[p99Index];
    const low1PctFps = p99FrameTimeMs > 0 ? 1000 / p99FrameTimeMs : 0;
    return {
      averageFps: Math.round(averageFps * 100) / 100,
      low1PctFps: Math.round(low1PctFps * 100) / 100
    };
  }
}

// src/interactiveHelpers.tsx
init_allErrors();
init_settings2();
var jsx_dev_runtime6 = __toESM(require_jsx_dev_runtime(), 1);
function completeOnboarding() {
  saveGlobalConfig((current) => ({
    ...current,
    hasCompletedOnboarding: true,
    lastOnboardingVersion: MACRO.VERSION
  }));
}
function showDialog(root, renderer) {
  return new Promise((resolve) => {
    const done = (result) => void resolve(result);
    root.render(renderer(done));
  });
}
async function exitWithError(root, message, beforeExit) {
  return exitWithMessage(root, message, {
    color: "error",
    beforeExit
  });
}
async function exitWithMessage(root, message, options) {
  const {
    Text
  } = await import("./chunk-5rf2fy46.js");
  const color = options?.color;
  const exitCode = options?.exitCode ?? 1;
  root.render(color ? /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(Text, {
    color,
    children: message
  }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(Text, {
    children: message
  }, undefined, false, undefined, this));
  root.unmount();
  await options?.beforeExit?.();
  process.exit(exitCode);
}
function showSetupDialog(root, renderer, options) {
  return showDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(AppStateProvider, {
    onChangeAppState: options?.onChangeAppState,
    children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(KeybindingSetup, {
      children: renderer(done)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this));
}
async function renderAndRun(root, element) {
  root.render(element);
  startDeferredPrefetches();
  await root.waitUntilExit();
  await gracefulShutdown(0);
}
async function showSetupScreens(root, permissionMode, allowDangerouslySkipPermissions, commands, claudeInChrome, devChannels) {
  if (isEnvTruthy(false) || process.env.IS_DEMO) {
    return false;
  }
  const config = getGlobalConfig();
  let onboardingShown = false;
  if (!config.theme || !config.hasCompletedOnboarding) {
    onboardingShown = true;
    const {
      Onboarding
    } = await import("./chunk-1fgwnr34.js");
    await showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(Onboarding, {
      onDone: () => {
        completeOnboarding();
        done();
      }
    }, undefined, false, undefined, this), {
      onChangeAppState
    });
  }
  if (!isEnvTruthy(process.env.CLAUBBIT)) {
    if (!checkHasTrustDialogAccepted()) {
      const {
        TrustDialog
      } = await import("./chunk-r4egax3c.js");
      await showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(TrustDialog, {
        commands,
        onDone: done
      }, undefined, false, undefined, this));
    }
    setSessionTrustAccepted(true);
    resetGrowthBook();
    initializeGrowthBook();
    getSystemContext();
    const {
      errors: allErrors
    } = getSettingsWithAllErrors();
    if (allErrors.length === 0) {
      await handleMcpjsonServerApprovals(root);
    }
    if (await shouldShowClaudeMdExternalIncludesWarning()) {
      const externalIncludes = getExternalClaudeMdIncludes(await getMemoryFiles(true));
      const {
        ClaudeMdExternalIncludesDialog
      } = await import("./chunk-hsk7tcve.js");
      await showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ClaudeMdExternalIncludesDialog, {
        onDone: done,
        isStandaloneDialog: true,
        externalIncludes
      }, undefined, false, undefined, this));
    }
  }
  updateGithubRepoPathMapping();
  if (false) {}
  applyConfigEnvironmentVariables();
  setImmediate(() => initializeTelemetryAfterTrust());
  if (await isQualifiedForGrove()) {
    const {
      GroveDialog
    } = await import("./chunk-8cewzeec.js");
    const decision = await showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(GroveDialog, {
      showIfAlreadyViewed: false,
      location: onboardingShown ? "onboarding" : "policy_update_modal",
      onDone: done
    }, undefined, false, undefined, this));
    if (decision === "escape") {
      logEvent("tengu_grove_policy_exited", {});
      gracefulShutdownSync(0);
      return false;
    }
  }
  if (process.env.ANTHROPIC_API_KEY && !isRunningOnHomespace()) {
    const customApiKeyTruncated = normalizeApiKeyForConfig(process.env.ANTHROPIC_API_KEY);
    const keyStatus = getCustomApiKeyStatus(customApiKeyTruncated);
    if (keyStatus === "new") {
      const {
        ApproveApiKey
      } = await import("./chunk-p9nkcsvq.js");
      await showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ApproveApiKey, {
        customApiKeyTruncated,
        onDone: done
      }, undefined, false, undefined, this), {
        onChangeAppState
      });
    }
  }
  if ((permissionMode === "bypassPermissions" || allowDangerouslySkipPermissions) && !hasSkipDangerousModePermissionPrompt()) {
    const {
      BypassPermissionsModeDialog
    } = await import("./chunk-t00hnczz.js");
    await showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(BypassPermissionsModeDialog, {
      onAccept: done
    }, undefined, false, undefined, this));
  }
  if (false) {}
  if (false) {}
  if (claudeInChrome && !getGlobalConfig().hasCompletedClaudeInChromeOnboarding) {
    const {
      ClaudeInChromeOnboarding
    } = await import("./chunk-jajdwtje.js");
    await showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ClaudeInChromeOnboarding, {
      onDone: done
    }, undefined, false, undefined, this));
  }
  return onboardingShown;
}
function getRenderContext(exitOnCtrlC) {
  let lastFlickerTime = 0;
  const baseOptions = getBaseRenderOptions(exitOnCtrlC);
  if (baseOptions.stdin) {
    logEvent("tengu_stdin_interactive", {});
  }
  const fpsTracker = new FpsTracker;
  const stats = createStatsStore();
  setStatsStore(stats);
  const frameTimingLogPath = process.env.CLAUDE_CODE_FRAME_TIMING_LOG;
  return {
    getFpsMetrics: () => fpsTracker.getMetrics(),
    stats,
    renderOptions: {
      ...baseOptions,
      onFrame: (event) => {
        fpsTracker.record(event.durationMs);
        stats.observe("frame_duration_ms", event.durationMs);
        if (frameTimingLogPath && event.phases) {
          const line = JSON.stringify({
            total: event.durationMs,
            ...event.phases,
            rss: process.memoryUsage.rss(),
            cpu: process.cpuUsage()
          }) + `
`;
          appendFileSync(frameTimingLogPath, line);
        }
        if (isSynchronizedOutputSupported()) {
          return;
        }
        for (const flicker of event.flickers) {
          if (flicker.reason === "resize") {
            continue;
          }
          const now = Date.now();
          if (now - lastFlickerTime < 1000) {
            logEvent("tengu_flicker", {
              desiredHeight: flicker.desiredHeight,
              actualHeight: flicker.availableHeight,
              reason: flicker.reason
            });
          }
          lastFlickerTime = now;
        }
      }
    }
  };
}

// src/dialogLaunchers.tsx
init_KeybindingProviderSetup();
var jsx_dev_runtime7 = __toESM(require_jsx_dev_runtime(), 1);
async function launchInvalidSettingsDialog(root, props) {
  const {
    InvalidSettingsDialog
  } = await import("./chunk-eyxc8kfx.js");
  return showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(InvalidSettingsDialog, {
    settingsErrors: props.settingsErrors,
    onContinue: done,
    onExit: props.onExit
  }, undefined, false, undefined, this));
}
async function launchTeleportResumeWrapper(root) {
  const {
    TeleportResumeWrapper
  } = await import("./chunk-q3akejrh.js");
  return showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(TeleportResumeWrapper, {
    onComplete: done,
    onCancel: () => done(null),
    source: "cliArg"
  }, undefined, false, undefined, this));
}
async function launchTeleportRepoMismatchDialog(root, props) {
  const {
    TeleportRepoMismatchDialog
  } = await import("./chunk-vvyewdgb.js");
  return showSetupDialog(root, (done) => /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(TeleportRepoMismatchDialog, {
    targetRepo: props.targetRepo,
    initialPaths: props.initialPaths,
    onSelectPath: done,
    onCancel: () => done(null)
  }, undefined, false, undefined, this));
}
async function launchResumeChooser(root, appProps, worktreePathsPromise, resumeProps) {
  const [worktreePaths, {
    ResumeConversation
  }, {
    App
  }] = await Promise.all([worktreePathsPromise, import("./chunk-c7vbanzs.js"), import("./chunk-t9xj6byq.js")]);
  await renderAndRun(root, /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(App, {
    getFpsMetrics: appProps.getFpsMetrics,
    stats: appProps.stats,
    initialState: appProps.initialState,
    children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(KeybindingSetup, {
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ResumeConversation, {
        ...resumeProps,
        worktreePaths
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this));
}

// src/main.tsx
init_dec();

// src/plugins/bundled/index.ts
function initBuiltinPlugins() {}

// src/main.tsx
init_claudeAiLimits();
init_client2();

// src/skills/bundled/index.ts
init_setup();

// src/skills/bundled/batch.ts
init_constants2();
init_prompt2();
init_constants4();
init_constants3();
init_constants5();
init_git();
init_bundledSkills();
var MIN_AGENTS = 5;
var MAX_AGENTS = 30;
var WORKER_INSTRUCTIONS = `After you finish implementing the change:
1. **Simplify** \u2014 Invoke the \`${SKILL_TOOL_NAME}\` tool with \`skill: "simplify"\` to review and clean up your changes.
2. **Run unit tests** \u2014 Run the project's test suite (check for package.json scripts, Makefile targets, or common commands like \`npm test\`, \`bun test\`, \`pytest\`, \`go test\`). If tests fail, fix them.
3. **Test end-to-end** \u2014 Follow the e2e test recipe from the coordinator's prompt (below). If the recipe says to skip e2e for this unit, skip it.
4. **Commit and push** \u2014 Commit all changes with a clear message, push the branch, and create a PR with \`gh pr create\`. Use a descriptive title. If \`gh\` is not available or the push fails, note it in your final message.
5. **Report** \u2014 End with a single line: \`PR: <url>\` so the coordinator can track it. If no PR was created, end with \`PR: none \u2014 <reason>\`.`;
function buildPrompt(instruction) {
  return `# Batch: Parallel Work Orchestration

You are orchestrating a large, parallelizable change across this codebase.

## User Instruction

${instruction}

## Phase 1: Research and Plan (Plan Mode)

Call the \`${ENTER_PLAN_MODE_TOOL_NAME}\` tool now to enter plan mode, then:

1. **Understand the scope.** Launch one or more subagents (in the foreground \u2014 you need their results) to deeply research what this instruction touches. Find all the files, patterns, and call sites that need to change. Understand the existing conventions so the migration is consistent.

2. **Decompose into independent units.** Break the work into ${MIN_AGENTS}\u2013${MAX_AGENTS} self-contained units. Each unit must:
   - Be independently implementable in an isolated git worktree (no shared state with sibling units)
   - Be mergeable on its own without depending on another unit's PR landing first
   - Be roughly uniform in size (split large units, merge trivial ones)

   Scale the count to the actual work: few files \u2192 closer to ${MIN_AGENTS}; hundreds of files \u2192 closer to ${MAX_AGENTS}. Prefer per-directory or per-module slicing over arbitrary file lists.

3. **Determine the e2e test recipe.** Figure out how a worker can verify its change actually works end-to-end \u2014 not just that unit tests pass. Look for:
   - A \`claude-in-chrome\` skill or browser-automation tool (for UI changes: click through the affected flow, screenshot the result)
   - A \`tmux\` or CLI-verifier skill (for CLI changes: launch the app interactively, exercise the changed behavior)
   - A dev-server + curl pattern (for API changes: start the server, hit the affected endpoints)
   - An existing e2e/integration test suite the worker can run

   If you cannot find a concrete e2e path, use the \`${ASK_USER_QUESTION_TOOL_NAME}\` tool to ask the user how to verify this change end-to-end. Offer 2\u20133 specific options based on what you found (e.g., "Screenshot via chrome extension", "Run \`bun run dev\` and curl the endpoint", "No e2e \u2014 unit tests are sufficient"). Do not skip this \u2014 the workers cannot ask the user themselves.

   Write the recipe as a short, concrete set of steps that a worker can execute autonomously. Include any setup (start a dev server, build first) and the exact command/interaction to verify.

4. **Write the plan.** In your plan file, include:
   - A summary of what you found during research
   - A numbered list of work units \u2014 for each: a short title, the list of files/directories it covers, and a one-line description of the change
   - The e2e test recipe (or "skip e2e because \u2026" if the user chose that)
   - The exact worker instructions you will give each agent (the shared template)

5. Call \`${EXIT_PLAN_MODE_TOOL_NAME}\` to present the plan for approval.

## Phase 2: Spawn Workers (After Plan Approval)

Once the plan is approved, spawn one background agent per work unit using the \`${AGENT_TOOL_NAME}\` tool. **All agents must use \`isolation: "worktree"\` and \`run_in_background: true\`.** Launch them all in a single message block so they run in parallel.

For each agent, the prompt must be fully self-contained. Include:
- The overall goal (the user's instruction)
- This unit's specific task (title, file list, change description \u2014 copied verbatim from your plan)
- Any codebase conventions you discovered that the worker needs to follow
- The e2e test recipe from your plan (or "skip e2e because \u2026")
- The worker instructions below, copied verbatim:

\`\`\`
${WORKER_INSTRUCTIONS}
\`\`\`

Use \`subagent_type: "general-purpose"\` unless a more specific agent type fits.

## Phase 3: Track Progress

After launching all workers, render an initial status table:

| # | Unit | Status | PR |
|---|------|--------|----|
| 1 | <title> | running | \u2014 |
| 2 | <title> | running | \u2014 |

As background-agent completion notifications arrive, parse the \`PR: <url>\` line from each agent's result and re-render the table with updated status (\`done\` / \`failed\`) and PR links. Keep a brief failure note for any agent that did not produce a PR.

When all agents have reported, render the final table and a one-line summary (e.g., "22/24 units landed as PRs").
`;
}
var NOT_A_GIT_REPO_MESSAGE = `This is not a git repository. The \`/batch\` command requires a git repo because it spawns agents in isolated git worktrees and creates PRs from each. Initialize a repo first, or run this from inside an existing one.`;
var MISSING_INSTRUCTION_MESSAGE = `Provide an instruction describing the batch change you want to make.

Examples:
  /batch migrate from react to vue
  /batch replace all uses of lodash with native equivalents
  /batch add type annotations to all untyped function parameters`;
function registerBatchSkill() {
  registerBundledSkill({
    name: "batch",
    description: "Research and plan a large-scale change, then execute it in parallel across 5\u201330 isolated worktree agents that each open a PR.",
    whenToUse: "Use when the user wants to make a sweeping, mechanical change across many files (migrations, refactors, bulk renames) that can be decomposed into independent parallel units.",
    argumentHint: "<instruction>",
    userInvocable: true,
    disableModelInvocation: true,
    async getPromptForCommand(args) {
      const instruction = args.trim();
      if (!instruction) {
        return [{ type: "text", text: MISSING_INSTRUCTION_MESSAGE }];
      }
      const isGit = await getIsGit();
      if (!isGit) {
        return [{ type: "text", text: NOT_A_GIT_REPO_MESSAGE }];
      }
      return [{ type: "text", text: buildPrompt(instruction) }];
    }
  });
}

// src/skills/bundled/cleanup.ts
init_bundledSkills();
function registerCleanupSkill() {
  registerBundledSkill({
    name: "cleanup",
    description: "Clean temporary files \xB7 \u6E05\u7406\u4E34\u65F6\u6587\u4EF6",
    userInvocable: true,
    async getPromptForCommand(args) {
      const target = args.trim() || ".";
      return [
        {
          type: "text",
          text: `Scan the directory "${target}" and identify temporary/cache files that can be safely cleaned up. Look for: node_modules/.cache, .DS_Store, *.log, tmp/, dist/, build artifacts. List what you found and ask for confirmation before deleting anything. Never delete source code or configuration files.`
        }
      ];
    }
  });
}

// src/skills/bundled/claudeInChrome.ts
init_src();
init_prompt3();
init_setup();
init_bundledSkills();
var CLAUDE_IN_CHROME_MCP_TOOLS = BROWSER_TOOLS.map((tool) => `mcp__claude-in-chrome__${tool.name}`);
var SKILL_ACTIVATION_MESSAGE = `
Now that this skill is invoked, you have access to Chrome browser automation tools. You can now use the mcp__claude-in-chrome__* tools to interact with web pages.

IMPORTANT: Start by calling mcp__claude-in-chrome__tabs_context_mcp to get information about the user's current browser tabs.
`;
function registerClaudeInChromeSkill() {
  registerBundledSkill({
    name: "claude-in-chrome",
    description: "Automates your Chrome browser to interact with web pages - clicking elements, filling forms, capturing screenshots, reading console logs, and navigating sites. Opens pages in new tabs within your existing Chrome session. Requires site-level permissions before executing (configured in the extension).",
    whenToUse: "When the user wants to interact with web pages, automate browser tasks, capture screenshots, read console logs, or perform any browser-based actions. Always invoke BEFORE attempting to use any mcp__claude-in-chrome__* tools.",
    allowedTools: CLAUDE_IN_CHROME_MCP_TOOLS,
    userInvocable: true,
    isEnabled: () => shouldAutoEnableClaudeInChrome(),
    async getPromptForCommand(args) {
      let prompt = `${BASE_CHROME_PROMPT}
${SKILL_ACTIVATION_MESSAGE}`;
      if (args) {
        prompt += `
## Task

${args}`;
      }
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/debug.ts
init_claudeCodeGuideAgent();
init_settings2();
init_debug();
init_errors();
init_format();
init_bundledSkills();
import { open, stat } from "fs/promises";
var DEFAULT_DEBUG_LINES_READ = 20;
var TAIL_READ_BYTES = 64 * 1024;
function registerDebugSkill() {
  registerBundledSkill({
    name: "debug",
    description: process.env.USER_TYPE === "ant" ? "Debug your current Panda Code session by reading the session debug log. Includes all event logging" : "Enable debug logging for this session and help diagnose issues",
    allowedTools: ["Read", "Grep", "Glob"],
    argumentHint: "[issue description]",
    disableModelInvocation: true,
    userInvocable: true,
    async getPromptForCommand(args) {
      const wasAlreadyLogging = enableDebugLogging();
      const debugLogPath = getDebugLogPath();
      let logInfo;
      try {
        const stats = await stat(debugLogPath);
        const readSize = Math.min(stats.size, TAIL_READ_BYTES);
        const startOffset = stats.size - readSize;
        const fd = await open(debugLogPath, "r");
        try {
          const { buffer, bytesRead } = await fd.read({
            buffer: Buffer.alloc(readSize),
            position: startOffset
          });
          const tail = buffer.toString("utf-8", 0, bytesRead).split(`
`).slice(-DEFAULT_DEBUG_LINES_READ).join(`
`);
          logInfo = `Log size: ${formatFileSize(stats.size)}

### Last ${DEFAULT_DEBUG_LINES_READ} lines

\`\`\`
${tail}
\`\`\``;
        } finally {
          await fd.close();
        }
      } catch (e) {
        logInfo = isENOENT(e) ? "No debug log exists yet \u2014 logging was just enabled." : `Failed to read last ${DEFAULT_DEBUG_LINES_READ} lines of debug log: ${errorMessage(e)}`;
      }
      const justEnabledSection = wasAlreadyLogging ? "" : `
## Debug Logging Just Enabled

Debug logging was OFF for this session until now. Nothing prior to this /debug invocation was captured.

Tell the user that debug logging is now active at \`${debugLogPath}\`, ask them to reproduce the issue, then re-read the log. If they can't reproduce, they can also restart with \`claude --debug\` to capture logs from startup.
`;
      const prompt = `# Debug Skill

Help the user debug an issue they're encountering in this current Panda Code session.
${justEnabledSection}
## Session Debug Log

The debug log for the current session is at: \`${debugLogPath}\`

${logInfo}

For additional context, grep for [ERROR] and [WARN] lines across the full file.

## Issue Description

${args || "The user did not describe a specific issue. Read the debug log and summarize any errors, warnings, or notable issues."}

## Settings

Remember that settings are in:
* user - ${getSettingsFilePathForSource("userSettings")}
* project - ${getSettingsFilePathForSource("projectSettings")}
* local - ${getSettingsFilePathForSource("localSettings")}

## Instructions

1. Review the user's issue description
2. The last ${DEFAULT_DEBUG_LINES_READ} lines show the debug file format. Look for [ERROR] and [WARN] entries, stack traces, and failure patterns across the file
3. Consider launching the ${CLAUDE_CODE_GUIDE_AGENT_TYPE} subagent to understand the relevant Panda Code features
4. Explain what you found in plain language
5. Suggest concrete fixes or next steps
`;
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/healthCheck.ts
init_state();
init_bundledSkills();
function registerHealthCheckSkill() {
  registerBundledSkill({
    name: "health-check",
    description: "Quick project health diagnosis \u2014 git status, dependency freshness, security hints, lint status.",
    userInvocable: true,
    async getPromptForCommand(args) {
      const cwd = getOriginalCwd();
      let prompt = `# Project Health Check

Working directory: \`${cwd}\`

## 1. Git Status

- Run \`git status\` \u2014 report uncommitted changes, untracked files
- Run \`git log --oneline -5\` \u2014 recent activity
- Check if the branch is behind its remote: \`git rev-list --count HEAD..@{upstream} 2>/dev/null\`
- List stale branches (no commits in 30+ days): \`git for-each-ref --sort=-committerdate --format='%(refname:short) %(committerdate:relative)' refs/heads/\`

## 2. Dependencies

- If package.json exists, check for outdated packages: \`bun outdated 2>/dev/null || npm outdated 2>/dev/null\`
- Report any packages with major version bumps available
- Check for known vulnerabilities: \`bun audit 2>/dev/null || npm audit --json 2>/dev/null\`

## 3. Code Quality Signals

- Count TODO/FIXME/HACK comments: \`grep -rn 'TODO\\|FIXME\\|HACK' --include='*.ts' --include='*.tsx' --include='*.js' . | head -20\`
- If tsconfig.json exists, run \`bun tsc --noEmit 2>&1 | tail -5\` to check type errors (report count only)
- If .eslintrc or eslint config exists, note its presence

## 4. Summary Report

Present a health scorecard:
- Git: clean/dirty, up-to-date/behind
- Dependencies: all current / N outdated / N vulnerable
- Code quality: N TODOs, type check pass/fail

## Output

Present in concise Chinese (\u4E2D\u6587). Use a simple scorecard format. Flag critical issues with clear markers.`;
      if (args.trim()) {
        prompt += `

## Focus area

${args.trim()}`;
      }
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/keybindings.ts
init_defaultBindings();
init_loadUserBindings();
init_reservedShortcuts();

// src/keybindings/schema.ts
init_v4();
init_lazySchema();
var KEYBINDING_CONTEXTS = [
  "Global",
  "Chat",
  "Autocomplete",
  "Confirmation",
  "Help",
  "Transcript",
  "HistorySearch",
  "Task",
  "ThemePicker",
  "Settings",
  "Tabs",
  "Attachments",
  "Footer",
  "MessageSelector",
  "DiffDialog",
  "ModelPicker",
  "Select",
  "Plugin"
];
var KEYBINDING_CONTEXT_DESCRIPTIONS = {
  Global: "Active everywhere, regardless of focus",
  Chat: "When the chat input is focused",
  Autocomplete: "When autocomplete menu is visible",
  Confirmation: "When a confirmation/permission dialog is shown",
  Help: "When the help overlay is open",
  Transcript: "When viewing the transcript",
  HistorySearch: "When searching command history (ctrl+r)",
  Task: "When a task/agent is running in the foreground",
  ThemePicker: "When the theme picker is open",
  Settings: "When the settings menu is open",
  Tabs: "When tab navigation is active",
  Attachments: "When navigating image attachments in a select dialog",
  Footer: "When footer indicators are focused",
  MessageSelector: "When the message selector (rewind) is open",
  DiffDialog: "When the diff dialog is open",
  ModelPicker: "When the model picker is open",
  Select: "When a select/list component is focused",
  Plugin: "When the plugin dialog is open"
};
var KEYBINDING_ACTIONS = [
  "app:interrupt",
  "app:exit",
  "app:toggleTodos",
  "app:toggleTranscript",
  "app:toggleBrief",
  "app:toggleTeammatePreview",
  "app:toggleTerminal",
  "app:redraw",
  "app:globalSearch",
  "app:quickOpen",
  "history:search",
  "history:previous",
  "history:next",
  "chat:cancel",
  "chat:killAgents",
  "chat:cycleMode",
  "chat:modelPicker",
  "chat:fastMode",
  "chat:thinkingToggle",
  "chat:submit",
  "chat:newline",
  "chat:undo",
  "chat:externalEditor",
  "chat:stash",
  "chat:imagePaste",
  "chat:messageActions",
  "autocomplete:accept",
  "autocomplete:dismiss",
  "autocomplete:previous",
  "autocomplete:next",
  "confirm:yes",
  "confirm:no",
  "confirm:previous",
  "confirm:next",
  "confirm:nextField",
  "confirm:previousField",
  "confirm:cycleMode",
  "confirm:toggle",
  "confirm:toggleExplanation",
  "tabs:next",
  "tabs:previous",
  "transcript:toggleShowAll",
  "transcript:exit",
  "historySearch:next",
  "historySearch:accept",
  "historySearch:cancel",
  "historySearch:execute",
  "task:background",
  "theme:toggleSyntaxHighlighting",
  "help:dismiss",
  "attachments:next",
  "attachments:previous",
  "attachments:remove",
  "attachments:exit",
  "footer:up",
  "footer:down",
  "footer:next",
  "footer:previous",
  "footer:openSelected",
  "footer:clearSelection",
  "footer:close",
  "messageSelector:up",
  "messageSelector:down",
  "messageSelector:top",
  "messageSelector:bottom",
  "messageSelector:select",
  "diff:dismiss",
  "diff:previousSource",
  "diff:nextSource",
  "diff:back",
  "diff:viewDetails",
  "diff:previousFile",
  "diff:nextFile",
  "modelPicker:decreaseEffort",
  "modelPicker:increaseEffort",
  "select:next",
  "select:previous",
  "select:accept",
  "select:cancel",
  "plugin:toggle",
  "plugin:install",
  "permission:toggleDebug",
  "settings:search",
  "settings:retry",
  "settings:close",
  "voice:pushToTalk"
];
var KeybindingBlockSchema = lazySchema(() => exports_external.object({
  context: exports_external.enum(KEYBINDING_CONTEXTS).describe("UI context where these bindings apply. Global bindings work everywhere."),
  bindings: exports_external.record(exports_external.string().describe('Keystroke pattern (e.g., "ctrl+k", "shift+tab")'), exports_external.union([
    exports_external.enum(KEYBINDING_ACTIONS),
    exports_external.string().regex(/^command:[a-zA-Z0-9:\-_]+$/).describe('Command binding (e.g., "command:help", "command:compact"). Executes the slash command as if typed.'),
    exports_external.null().describe("Set to null to unbind a default shortcut")
  ]).describe("Action to trigger, command to invoke, or null to unbind")).describe("Map of keystroke patterns to actions")
}).describe("A block of keybindings for a specific context"));
var KeybindingsSchema = lazySchema(() => exports_external.object({
  $schema: exports_external.string().optional().describe("JSON Schema URL for editor validation"),
  $docs: exports_external.string().optional().describe("Documentation URL"),
  bindings: exports_external.array(KeybindingBlockSchema()).describe("Array of keybinding blocks by context")
}).describe("Panda Code keybindings configuration. Customize keyboard shortcuts by context."));

// src/skills/bundled/keybindings.ts
init_slowOperations();
init_bundledSkills();
function generateContextsTable() {
  return markdownTable(["Context", "Description"], KEYBINDING_CONTEXTS.map((ctx) => [
    `\`${ctx}\``,
    KEYBINDING_CONTEXT_DESCRIPTIONS[ctx]
  ]));
}
function generateActionsTable() {
  const actionInfo = {};
  for (const block of DEFAULT_BINDINGS) {
    for (const [key, action] of Object.entries(block.bindings)) {
      if (action) {
        if (!actionInfo[action]) {
          actionInfo[action] = { keys: [], context: block.context };
        }
        actionInfo[action].keys.push(key);
      }
    }
  }
  return markdownTable(["Action", "Default Key(s)", "Context"], KEYBINDING_ACTIONS.map((action) => {
    const info = actionInfo[action];
    const keys = info ? info.keys.map((k) => `\`${k}\``).join(", ") : "(none)";
    const context = info ? info.context : inferContextFromAction(action);
    return [`\`${action}\``, keys, context];
  }));
}
function inferContextFromAction(action) {
  const prefix = action.split(":")[0];
  const prefixToContext = {
    app: "Global",
    history: "Global or Chat",
    chat: "Chat",
    autocomplete: "Autocomplete",
    confirm: "Confirmation",
    tabs: "Tabs",
    transcript: "Transcript",
    historySearch: "HistorySearch",
    task: "Task",
    theme: "ThemePicker",
    help: "Help",
    attachments: "Attachments",
    footer: "Footer",
    messageSelector: "MessageSelector",
    diff: "DiffDialog",
    modelPicker: "ModelPicker",
    select: "Select",
    permission: "Confirmation"
  };
  return prefixToContext[prefix ?? ""] ?? "Unknown";
}
function generateReservedShortcuts() {
  const lines = [];
  lines.push("### Non-rebindable (errors)");
  for (const s of NON_REBINDABLE) {
    lines.push(`- \`${s.key}\` \u2014 ${s.reason}`);
  }
  lines.push("");
  lines.push("### Terminal reserved (errors/warnings)");
  for (const s of TERMINAL_RESERVED) {
    lines.push(`- \`${s.key}\` \u2014 ${s.reason} (${s.severity === "error" ? "will not work" : "may conflict"})`);
  }
  lines.push("");
  lines.push("### macOS reserved (errors)");
  for (const s of MACOS_RESERVED) {
    lines.push(`- \`${s.key}\` \u2014 ${s.reason}`);
  }
  return lines.join(`
`);
}
var FILE_FORMAT_EXAMPLE = {
  $schema: "https://www.schemastore.org/claude-code-keybindings.json",
  $docs: "https://code.claude.com/docs/en/keybindings",
  bindings: [
    {
      context: "Chat",
      bindings: {
        "ctrl+e": "chat:externalEditor"
      }
    }
  ]
};
var UNBIND_EXAMPLE = {
  context: "Chat",
  bindings: {
    "ctrl+s": null
  }
};
var REBIND_EXAMPLE = {
  context: "Chat",
  bindings: {
    "ctrl+g": null,
    "ctrl+e": "chat:externalEditor"
  }
};
var CHORD_EXAMPLE = {
  context: "Global",
  bindings: {
    "ctrl+k ctrl+t": "app:toggleTodos"
  }
};
var SECTION_INTRO = [
  "# Keybindings Skill",
  "",
  "Create or modify `~/.pandacc/keybindings.json` to customize keyboard shortcuts.",
  "",
  "## CRITICAL: Read Before Write",
  "",
  "**Always read `~/.pandacc/keybindings.json` first** (it may not exist yet). Merge changes with existing bindings \u2014 never replace the entire file.",
  "",
  "- Use **Edit** tool for modifications to existing files",
  "- Use **Write** tool only if the file does not exist yet"
].join(`
`);
var SECTION_FILE_FORMAT = [
  "## File Format",
  "",
  "```json",
  jsonStringify(FILE_FORMAT_EXAMPLE, null, 2),
  "```",
  "",
  "Always include the `$schema` and `$docs` fields."
].join(`
`);
var SECTION_KEYSTROKE_SYNTAX = [
  "## Keystroke Syntax",
  "",
  "**Modifiers** (combine with `+`):",
  "- `ctrl` (alias: `control`)",
  "- `alt` (aliases: `opt`, `option`) \u2014 note: `alt` and `meta` are identical in terminals",
  "- `shift`",
  "- `meta` (aliases: `cmd`, `command`)",
  "",
  "**Special keys**: `escape`/`esc`, `enter`/`return`, `tab`, `space`, `backspace`, `delete`, `up`, `down`, `left`, `right`",
  "",
  "**Chords**: Space-separated keystrokes, e.g. `ctrl+k ctrl+s` (1-second timeout between keystrokes)",
  "",
  "**Examples**: `ctrl+shift+p`, `alt+enter`, `ctrl+k ctrl+n`"
].join(`
`);
var SECTION_UNBINDING = [
  "## Unbinding Default Shortcuts",
  "",
  "Set a key to `null` to remove its default binding:",
  "",
  "```json",
  jsonStringify(UNBIND_EXAMPLE, null, 2),
  "```"
].join(`
`);
var SECTION_INTERACTION = [
  "## How User Bindings Interact with Defaults",
  "",
  "- User bindings are **additive** \u2014 they are appended after the default bindings",
  "- To **move** a binding to a different key: unbind the old key (`null`) AND add the new binding",
  "- A context only needs to appear in the user's file if they want to change something in that context"
].join(`
`);
var SECTION_COMMON_PATTERNS = [
  "## Common Patterns",
  "",
  "### Rebind a key",
  "To change the external editor shortcut from `ctrl+g` to `ctrl+e`:",
  "```json",
  jsonStringify(REBIND_EXAMPLE, null, 2),
  "```",
  "",
  "### Add a chord binding",
  "```json",
  jsonStringify(CHORD_EXAMPLE, null, 2),
  "```"
].join(`
`);
var SECTION_BEHAVIORAL_RULES = [
  "## Behavioral Rules",
  "",
  "1. Only include contexts the user wants to change (minimal overrides)",
  "2. Validate that actions and contexts are from the known lists below",
  "3. Warn the user proactively if they choose a key that conflicts with reserved shortcuts or common tools like tmux (`ctrl+b`) and screen (`ctrl+a`)",
  "4. When adding a new binding for an existing action, the new binding is additive (existing default still works unless explicitly unbound)",
  "5. To fully replace a default binding, unbind the old key AND add the new one"
].join(`
`);
var SECTION_DOCTOR = [
  "## Validation with /doctor",
  "",
  'The `/doctor` command includes a "Keybinding Configuration Issues" section that validates `~/.pandacc/keybindings.json`.',
  "",
  "### Common Issues and Fixes",
  "",
  markdownTable(["Issue", "Cause", "Fix"], [
    [
      '`keybindings.json must have a "bindings" array`',
      "Missing wrapper object",
      'Wrap bindings in `{ "bindings": [...] }`'
    ],
    [
      '`"bindings" must be an array`',
      "`bindings` is not an array",
      'Set `"bindings"` to an array: `[{ context: ..., bindings: ... }]`'
    ],
    [
      '`Unknown context "X"`',
      "Typo or invalid context name",
      "Use exact context names from the Available Contexts table"
    ],
    [
      '`Duplicate key "X" in Y bindings`',
      "Same key defined twice in one context",
      "Remove the duplicate; JSON uses only the last value"
    ],
    [
      '`"X" may not work: ...`',
      "Key conflicts with terminal/OS reserved shortcut",
      "Choose a different key (see Reserved Shortcuts section)"
    ],
    [
      '`Could not parse keystroke "X"`',
      "Invalid key syntax",
      "Check syntax: use `+` between modifiers, valid key names"
    ],
    [
      '`Invalid action for "X"`',
      "Action value is not a string or null",
      'Actions must be strings like `"app:help"` or `null` to unbind'
    ]
  ]),
  "",
  "### Example /doctor Output",
  "",
  "```",
  "Keybinding Configuration Issues",
  "Location: ~/.pandacc/keybindings.json",
  '  \u2514 [Error] Unknown context "chat"',
  "    \u2192 Valid contexts: Global, Chat, Autocomplete, ...",
  '  \u2514 [Warning] "ctrl+c" may not work: Terminal interrupt (SIGINT)',
  "```",
  "",
  "**Errors** prevent bindings from working and must be fixed. **Warnings** indicate potential conflicts but the binding may still work."
].join(`
`);
function registerKeybindingsSkill() {
  registerBundledSkill({
    name: "keybindings-help",
    description: 'Use when the user wants to customize keyboard shortcuts, rebind keys, add chord bindings, or modify ~/.pandacc/keybindings.json. Examples: "rebind ctrl+s", "add a chord shortcut", "change the submit key", "customize keybindings".',
    allowedTools: ["Read"],
    userInvocable: false,
    isEnabled: isKeybindingCustomizationEnabled,
    async getPromptForCommand(args) {
      const contextsTable = generateContextsTable();
      const actionsTable = generateActionsTable();
      const reservedShortcuts = generateReservedShortcuts();
      const sections = [
        SECTION_INTRO,
        SECTION_FILE_FORMAT,
        SECTION_KEYSTROKE_SYNTAX,
        SECTION_UNBINDING,
        SECTION_INTERACTION,
        SECTION_COMMON_PATTERNS,
        SECTION_BEHAVIORAL_RULES,
        SECTION_DOCTOR,
        `## Reserved Shortcuts

${reservedShortcuts}`,
        `## Available Contexts

${contextsTable}`,
        `## Available Actions

${actionsTable}`
      ];
      if (args) {
        sections.push(`## User Request

${args}`);
      }
      return [{ type: "text", text: sections.join(`

`) }];
    }
  });
}
function markdownTable(headers, rows) {
  const separator = headers.map(() => "---");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`)
  ].join(`
`);
}

// src/skills/bundled/loremIpsum.ts
init_bundledSkills();
var ONE_TOKEN_WORDS = [
  "the",
  "a",
  "an",
  "I",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "its",
  "our",
  "this",
  "that",
  "what",
  "who",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "can",
  "could",
  "may",
  "might",
  "must",
  "shall",
  "should",
  "make",
  "made",
  "get",
  "got",
  "go",
  "went",
  "come",
  "came",
  "see",
  "saw",
  "know",
  "take",
  "think",
  "look",
  "want",
  "use",
  "find",
  "give",
  "tell",
  "work",
  "call",
  "try",
  "ask",
  "need",
  "feel",
  "seem",
  "leave",
  "put",
  "time",
  "year",
  "day",
  "way",
  "man",
  "thing",
  "life",
  "hand",
  "part",
  "place",
  "case",
  "point",
  "fact",
  "good",
  "new",
  "first",
  "last",
  "long",
  "great",
  "little",
  "own",
  "other",
  "old",
  "right",
  "big",
  "high",
  "small",
  "large",
  "next",
  "early",
  "young",
  "few",
  "public",
  "bad",
  "same",
  "able",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "from",
  "by",
  "about",
  "like",
  "through",
  "over",
  "before",
  "between",
  "under",
  "since",
  "without",
  "and",
  "or",
  "but",
  "if",
  "than",
  "because",
  "as",
  "until",
  "while",
  "so",
  "though",
  "both",
  "each",
  "when",
  "where",
  "why",
  "how",
  "not",
  "now",
  "just",
  "more",
  "also",
  "here",
  "there",
  "then",
  "only",
  "very",
  "well",
  "back",
  "still",
  "even",
  "much",
  "too",
  "such",
  "never",
  "again",
  "most",
  "once",
  "off",
  "away",
  "down",
  "out",
  "up",
  "test",
  "code",
  "data",
  "file",
  "line",
  "text",
  "word",
  "number",
  "system",
  "program",
  "set",
  "run",
  "value",
  "name",
  "type",
  "state",
  "end",
  "start"
];
function generateLoremIpsum(targetTokens) {
  let tokens = 0;
  let result = "";
  while (tokens < targetTokens) {
    const sentenceLength = 10 + Math.floor(Math.random() * 11);
    let wordsInSentence = 0;
    for (let i = 0;i < sentenceLength && tokens < targetTokens; i++) {
      const word = ONE_TOKEN_WORDS[Math.floor(Math.random() * ONE_TOKEN_WORDS.length)];
      result += word;
      tokens++;
      wordsInSentence++;
      if (i === sentenceLength - 1 || tokens >= targetTokens) {
        result += ". ";
      } else {
        result += " ";
      }
    }
    if (wordsInSentence > 0 && Math.random() < 0.2 && tokens < targetTokens) {
      result += `

`;
    }
  }
  return result.trim();
}
function registerLoremIpsumSkill() {
  if (process.env.USER_TYPE !== "ant") {
    return;
  }
  registerBundledSkill({
    name: "lorem-ipsum",
    description: "Generate filler text for long context testing. Specify token count as argument (e.g., /lorem-ipsum 50000). Outputs approximately the requested number of tokens. Ant-only.",
    argumentHint: "[token_count]",
    userInvocable: true,
    async getPromptForCommand(args) {
      const parsed = parseInt(args);
      if (args && (isNaN(parsed) || parsed <= 0)) {
        return [
          {
            type: "text",
            text: "Invalid token count. Please provide a positive number (e.g., /lorem-ipsum 10000)."
          }
        ];
      }
      const targetTokens = parsed || 1e4;
      const cappedTokens = Math.min(targetTokens, 500000);
      if (cappedTokens < targetTokens) {
        return [
          {
            type: "text",
            text: `Requested ${targetTokens} tokens, but capped at 500,000 for safety.

${generateLoremIpsum(cappedTokens)}`
          }
        ];
      }
      const loremText = generateLoremIpsum(cappedTokens);
      return [
        {
          type: "text",
          text: loremText
        }
      ];
    }
  });
}

// src/skills/bundled/morning.ts
init_paths();
init_state();
init_bundledSkills();
function registerMorningSkill() {
  registerBundledSkill({
    name: "morning",
    description: "Generate a morning briefing \u2014 yesterday summary, open TODOs, today priorities, project status.",
    userInvocable: true,
    async getPromptForCommand(args) {
      const memoryDir = getAutoMemPath();
      const cwd = getOriginalCwd();
      let prompt = `# Morning Briefing

Memory directory: \`${memoryDir}\`
Working directory: \`${cwd}\`

## Phase 1 \u2014 Yesterday's Work

- Read recent memory files in \`${memoryDir}\` (ls, then skim the most recently modified files)
- Summarize what was accomplished yesterday or in the most recent session
- Note any decisions made or issues encountered

## Phase 2 \u2014 Open Items

- Check for TODO.md or similar task files in the project root
- Run \`git status\` to see uncommitted changes
- Run \`git log --oneline -10\` to see recent commits
- Check for any open branches with \`git branch\`
- Identify anything left incomplete

## Phase 3 \u2014 Today's Priorities

Based on the above, suggest a prioritized list of tasks for today:
1. Urgent / blocking items first
2. In-progress work that should be finished
3. New work that could be started

## Phase 4 \u2014 Project Status

- Brief git status summary (branch, clean/dirty, ahead/behind)
- Any stale branches or old PRs worth cleaning up

## Output

Present everything in concise Chinese (\u4E2D\u6587). Keep it under 25 lines. Use bullet points. Highlight the top 3 priorities clearly.`;
      if (args.trim()) {
        prompt += `

## Additional context

${args.trim()}`;
      }
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/organize.ts
init_state();
init_bundledSkills();
import { homedir as homedir3 } from "os";
import { join as join3 } from "path";
function registerOrganizeSkill() {
  registerBundledSkill({
    name: "organize",
    description: "Analyze a directory structure and suggest cleanup \u2014 redundant files, reorganization ideas, large file warnings.",
    argumentHint: "[path]",
    userInvocable: true,
    async getPromptForCommand(args) {
      const targetDir = args.trim() || getOriginalCwd() || join3(homedir3(), "Downloads");
      const prompt = `# File Organization Analysis

Target directory: \`${targetDir}\`

## Phase 1 \u2014 Survey

- List the directory contents (non-recursive first, then key subdirectories)
- Categorize files by type: documents, images, code, archives, config, other
- Note file sizes \u2014 flag anything over 100MB

## Phase 2 \u2014 Identify Issues

- **Redundant files**: duplicate names, backup copies (*.bak, *-copy, *.old)
- **Orphaned files**: temp files, .DS_Store, Thumbs.db, *.swp, *~
- **Misplaced files**: files that don't belong in their current directory
- **Naming inconsistencies**: mixed conventions (camelCase vs snake_case, etc.)

## Phase 3 \u2014 Recommendations

For each issue found, suggest a concrete action:
- Move file X to directory Y
- Delete orphaned file Z
- Rename for consistency

## Safety Rules

- Do NOT execute any changes \u2014 this is analysis only
- Present findings as a report the user can review
- Group suggestions by priority (quick wins first)

## Output

Present in concise Chinese (\u4E2D\u6587). Use tables where helpful.`;
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/remember.ts
init_paths();
init_bundledSkills();
function registerRememberSkill() {
  if (process.env.USER_TYPE !== "ant") {
    return;
  }
  const SKILL_PROMPT = `# Memory Review

## Goal
Review the user's memory landscape and produce a clear report of proposed changes, grouped by action type. Do NOT apply changes \u2014 present proposals for user approval.

## Steps

### 1. Gather all memory layers
Read CLAUDE.md and CLAUDE.local.md from the project root (if they exist). Your auto-memory content is already in your system prompt \u2014 review it there. Note which team memory sections exist, if any.

**Success criteria**: You have the contents of all memory layers and can compare them.

### 2. Classify each auto-memory entry
For each substantive entry in auto-memory, determine the best destination:

| Destination | What belongs there | Examples |
|---|---|---|
| **CLAUDE.md** | Project conventions and instructions for Claude that all contributors should follow | "use bun not npm", "API routes use kebab-case", "test command is bun test", "prefer functional style" |
| **CLAUDE.local.md** | Personal instructions for Claude specific to this user, not applicable to other contributors | "I prefer concise responses", "always explain trade-offs", "don't auto-commit", "run tests before committing" |
| **Team memory** | Org-wide knowledge that applies across repositories (only if team memory is configured) | "deploy PRs go through #deploy-queue", "staging is at staging.internal", "platform team owns infra" |
| **Stay in auto-memory** | Working notes, temporary context, or entries that don't clearly fit elsewhere | Session-specific observations, uncertain patterns |

**Important distinctions:**
- CLAUDE.md and CLAUDE.local.md contain instructions for Claude, not user preferences for external tools (editor theme, IDE keybindings, etc. don't belong in either)
- Workflow practices (PR conventions, merge strategies, branch naming) are ambiguous \u2014 ask the user whether they're personal or team-wide
- When unsure, ask rather than guess

**Success criteria**: Each entry has a proposed destination or is flagged as ambiguous.

### 3. Identify cleanup opportunities
Scan across all layers for:
- **Duplicates**: Auto-memory entries already captured in CLAUDE.md or CLAUDE.local.md \u2192 propose removing from auto-memory
- **Outdated**: CLAUDE.md or CLAUDE.local.md entries contradicted by newer auto-memory entries \u2192 propose updating the older layer
- **Conflicts**: Contradictions between any two layers \u2192 propose resolution, noting which is more recent

**Success criteria**: All cross-layer issues identified.

### 4. Present the report
Output a structured report grouped by action type:
1. **Promotions** \u2014 entries to move, with destination and rationale
2. **Cleanup** \u2014 duplicates, outdated entries, conflicts to resolve
3. **Ambiguous** \u2014 entries where you need the user's input on destination
4. **No action needed** \u2014 brief note on entries that should stay put

If auto-memory is empty, say so and offer to review CLAUDE.md for cleanup.

**Success criteria**: User can review and approve/reject each proposal individually.

## Rules
- Present ALL proposals before making any changes
- Do NOT modify files without explicit user approval
- Do NOT create new files unless the target doesn't exist yet
- Ask about ambiguous entries \u2014 don't guess
`;
  registerBundledSkill({
    name: "remember",
    description: "Review auto-memory entries and propose promotions to CLAUDE.md, CLAUDE.local.md, or shared memory. Also detects outdated, conflicting, and duplicate entries across memory layers.",
    whenToUse: "Use when the user wants to review, organize, or promote their auto-memory entries. Also useful for cleaning up outdated or conflicting entries across CLAUDE.md, CLAUDE.local.md, and auto-memory.",
    userInvocable: true,
    isEnabled: () => isAutoMemoryEnabled(),
    async getPromptForCommand(args) {
      let prompt = SKILL_PROMPT;
      if (args) {
        prompt += `
## Additional context from user

${args}`;
      }
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/remind.ts
init_bundledSkills();
function registerRemindSkill() {
  registerBundledSkill({
    name: "remind",
    description: "Set a reminder using natural language time \u2014 delegates to ScheduleCronTool.",
    argumentHint: "<message> <time>",
    userInvocable: true,
    async getPromptForCommand(args) {
      const prompt = `# Set Reminder

User input: "${args}"

## Steps

1. Parse the user's time description (e.g. "\u660E\u5929\u4E0B\u53483\u70B9", "30\u5206\u949F\u540E", "\u6BCF\u5929\u65E9\u4E0A9\u70B9", "in 2 hours", "every Friday at 5pm")
2. Convert to a cron expression
3. Use the CronCreate tool to create the scheduled task:
   - For one-time reminders: set recurring to false
   - For repeating reminders: set recurring to true
   - The command should echo the reminder message clearly
4. Confirm the reminder was created and tell the user the exact trigger time

## Important

- If the user input is empty or unclear, ask them what they want to be reminded about and when
- Always confirm the interpreted time before creating the cron job
- Use Asia/Singapore timezone (+08:00) for time interpretation
- Present confirmation in Chinese (\u4E2D\u6587)`;
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/simplify.ts
init_constants2();
init_bundledSkills();
var SIMPLIFY_PROMPT = `# Simplify: Code Review and Cleanup

Review all changed files for reuse, quality, and efficiency. Fix any issues found.

## Phase 1: Identify Changes

Run \`git diff\` (or \`git diff HEAD\` if there are staged changes) to see what changed. If there are no git changes, review the most recently modified files that the user mentioned or that you edited earlier in this conversation.

## Phase 2: Launch Three Review Agents in Parallel

Use the ${AGENT_TOOL_NAME} tool to launch all three agents concurrently in a single message. Pass each agent the full diff so it has the complete context.

### Agent 1: Code Reuse Review

For each change:

1. **Search for existing utilities and helpers** that could replace newly written code. Look for similar patterns elsewhere in the codebase \u2014 common locations are utility directories, shared modules, and files adjacent to the changed ones.
2. **Flag any new function that duplicates existing functionality.** Suggest the existing function to use instead.
3. **Flag any inline logic that could use an existing utility** \u2014 hand-rolled string manipulation, manual path handling, custom environment checks, ad-hoc type guards, and similar patterns are common candidates.

### Agent 2: Code Quality Review

Review the same changes for hacky patterns:

1. **Redundant state**: state that duplicates existing state, cached values that could be derived, observers/effects that could be direct calls
2. **Parameter sprawl**: adding new parameters to a function instead of generalizing or restructuring existing ones
3. **Copy-paste with slight variation**: near-duplicate code blocks that should be unified with a shared abstraction
4. **Leaky abstractions**: exposing internal details that should be encapsulated, or breaking existing abstraction boundaries
5. **Stringly-typed code**: using raw strings where constants, enums (string unions), or branded types already exist in the codebase
6. **Unnecessary JSX nesting**: wrapper Boxes/elements that add no layout value \u2014 check if inner component props (flexShrink, alignItems, etc.) already provide the needed behavior
7. **Unnecessary comments**: comments explaining WHAT the code does (well-named identifiers already do that), narrating the change, or referencing the task/caller \u2014 delete; keep only non-obvious WHY (hidden constraints, subtle invariants, workarounds)

### Agent 3: Efficiency Review

Review the same changes for efficiency:

1. **Unnecessary work**: redundant computations, repeated file reads, duplicate network/API calls, N+1 patterns
2. **Missed concurrency**: independent operations run sequentially when they could run in parallel
3. **Hot-path bloat**: new blocking work added to startup or per-request/per-render hot paths
4. **Recurring no-op updates**: state/store updates inside polling loops, intervals, or event handlers that fire unconditionally \u2014 add a change-detection guard so downstream consumers aren't notified when nothing changed. Also: if a wrapper function takes an updater/reducer callback, verify it honors same-reference returns (or whatever the "no change" signal is) \u2014 otherwise callers' early-return no-ops are silently defeated
5. **Unnecessary existence checks**: pre-checking file/resource existence before operating (TOCTOU anti-pattern) \u2014 operate directly and handle the error
6. **Memory**: unbounded data structures, missing cleanup, event listener leaks
7. **Overly broad operations**: reading entire files when only a portion is needed, loading all items when filtering for one

## Phase 3: Fix Issues

Wait for all three agents to complete. Aggregate their findings and fix each issue directly. If a finding is a false positive or not worth addressing, note it and move on \u2014 do not argue with the finding, just skip it.

When done, briefly summarize what was fixed (or confirm the code was already clean).
`;
function registerSimplifySkill() {
  registerBundledSkill({
    name: "simplify",
    description: "Review changed code for reuse, quality, and efficiency, then fix any issues found.",
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = SIMPLIFY_PROMPT;
      if (args) {
        prompt += `

## Additional Focus

${args}`;
      }
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/skillify.ts
init_sessionMemoryUtils();
init_messages();
init_bundledSkills();
function extractUserMessages(messages) {
  return messages.filter((m) => m.type === "user").map((m) => {
    const content = m.message?.content;
    if (typeof content === "string")
      return content;
    if (!Array.isArray(content))
      return "";
    return content.filter((b) => b.type === "text").map((b) => b.text).join(`
`);
  }).filter((text) => text.trim().length > 0);
}
var SKILLIFY_PROMPT = `# Skillify {{userDescriptionBlock}}

You are capturing this session's repeatable process as a reusable skill.

## Your Session Context

Here is the session memory summary:
<session_memory>
{{sessionMemory}}
</session_memory>

Here are the user's messages during this session. Pay attention to how they steered the process, to help capture their detailed preferences in the skill:
<user_messages>
{{userMessages}}
</user_messages>

## Your Task

### Step 1: Analyze the Session

Before asking any questions, analyze the session to identify:
- What repeatable process was performed
- What the inputs/parameters were
- The distinct steps (in order)
- The success artifacts/criteria (e.g. not just "writing code," but "an open PR with CI fully passing") for each step
- Where the user corrected or steered you
- What tools and permissions were needed
- What agents were used
- What the goals and success artifacts were

### Step 2: Interview the User

You will use the AskUserQuestion to understand what the user wants to automate. Important notes:
- Use AskUserQuestion for ALL questions! Never ask questions via plain text.
- For each round, iterate as much as needed until the user is happy.
- The user always has a freeform "Other" option to type edits or feedback -- do NOT add your own "Needs tweaking" or "I'll provide edits" option. Just offer the substantive choices.

**Round 1: High level confirmation**
- Suggest a name and description for the skill based on your analysis. Ask the user to confirm or rename.
- Suggest high-level goal(s) and specific success criteria for the skill.

**Round 2: More details**
- Present the high-level steps you identified as a numbered list. Tell the user you will dig into the detail in the next round.
- If you think the skill will require arguments, suggest arguments based on what you observed. Make sure you understand what someone would need to provide.
- If it's not clear, ask if this skill should run inline (in the current conversation) or forked (as a sub-agent with its own context). Forked is better for self-contained tasks that don't need mid-process user input; inline is better when the user wants to steer mid-process.
- Ask where the skill should be saved. Suggest a default based on context (repo-specific workflows \u2192 repo, cross-repo personal workflows \u2192 user). Options:
  - **This repo** (\`.pandacc/skills/<name>/SKILL.md\`) \u2014 for workflows specific to this project
  - **Personal** (\`~/.pandacc/skills/<name>/SKILL.md\`) \u2014 follows you across all repos

**Round 3: Breaking down each step**
For each major step, if it's not glaringly obvious, ask:
- What does this step produce that later steps need? (data, artifacts, IDs)
- What proves that this step succeeded, and that we can move on?
- Should the user be asked to confirm before proceeding? (especially for irreversible actions like merging, sending messages, or destructive operations)
- Are any steps independent and could run in parallel? (e.g., posting to Slack and monitoring CI at the same time)
- How should the skill be executed? (e.g. always use a Task agent to conduct code review, or invoke an agent team for a set of concurrent steps)
- What are the hard constraints or hard preferences? Things that must or must not happen?

You may do multiple rounds of AskUserQuestion here, one round per step, especially if there are more than 3 steps or many clarification questions. Iterate as much as needed.

IMPORTANT: Pay special attention to places where the user corrected you during the session, to help inform your design.

**Round 4: Final questions**
- Confirm when this skill should be invoked, and suggest/confirm trigger phrases too. (e.g. For a cherrypick workflow you could say: Use when the user wants to cherry-pick a PR to a release branch. Examples: 'cherry-pick to release', 'CP this PR', 'hotfix.')
- You can also ask for any other gotchas or things to watch out for, if it's still unclear.

Stop interviewing once you have enough information. IMPORTANT: Don't over-ask for simple processes!

### Step 3: Write the SKILL.md

Create the skill directory and file at the location the user chose in Round 2.

Use this format:

\`\`\`markdown
---
name: {{skill-name}}
description: {{one-line description}}
allowed-tools:
  {{list of tool permission patterns observed during session}}
when_to_use: {{detailed description of when Claude should automatically invoke this skill, including trigger phrases and example user messages}}
argument-hint: "{{hint showing argument placeholders}}"
arguments:
  {{list of argument names}}
context: {{inline or fork -- omit for inline}}
---

# {{Skill Title}}
Description of skill

## Inputs
- \`$arg_name\`: Description of this input

## Goal
Clearly stated goal for this workflow. Best if you have clearly defined artifacts or criteria for completion.

## Steps

### 1. Step Name
What to do in this step. Be specific and actionable. Include commands when appropriate.

**Success criteria**: ALWAYS include this! This shows that the step is done and we can move on. Can be a list.

IMPORTANT: see the next section below for the per-step annotations you can optionally include for each step.

...
\`\`\`

**Per-step annotations**:
- **Success criteria** is REQUIRED on every step. This helps the model understand what the user expects from their workflow, and when it should have the confidence to move on.
- **Execution**: \`Direct\` (default), \`Task agent\` (straightforward subagents), \`Teammate\` (agent with true parallelism and inter-agent communication), or \`[human]\` (user does it). Only needs specifying if not Direct.
- **Artifacts**: Data this step produces that later steps need (e.g., PR number, commit SHA). Only include if later steps depend on it.
- **Human checkpoint**: When to pause and ask the user before proceeding. Include for irreversible actions (merging, sending messages), error judgment (merge conflicts), or output review.
- **Rules**: Hard rules for the workflow. User corrections during the reference session can be especially useful here.

**Step structure tips:**
- Steps that can run concurrently use sub-numbers: 3a, 3b
- Steps requiring the user to act get \`[human]\` in the title
- Keep simple skills simple -- a 2-step skill doesn't need annotations on every step

**Frontmatter rules:**
- \`allowed-tools\`: Minimum permissions needed (use patterns like \`Bash(gh:*)\` not \`Bash\`)
- \`context\`: Only set \`context: fork\` for self-contained skills that don't need mid-process user input.
- \`when_to_use\` is CRITICAL -- tells the model when to auto-invoke. Start with "Use when..." and include trigger phrases. Example: "Use when the user wants to cherry-pick a PR to a release branch. Examples: 'cherry-pick to release', 'CP this PR', 'hotfix'."
- \`arguments\` and \`argument-hint\`: Only include if the skill takes parameters. Use \`$name\` in the body for substitution.

### Step 4: Confirm and Save

Before writing the file, output the complete SKILL.md content as a yaml code block in your response so the user can review it with proper syntax highlighting. Then ask for confirmation using AskUserQuestion with a simple question like "Does this SKILL.md look good to save?" \u2014 do NOT use the body field, keep the question concise.

After writing, tell the user:
- Where the skill was saved
- How to invoke it: \`/{{skill-name}} [arguments]\`
- That they can edit the SKILL.md directly to refine it
`;
function registerSkillifySkill() {
  if (process.env.USER_TYPE !== "ant") {
    return;
  }
  registerBundledSkill({
    name: "skillify",
    description: "Capture this session's repeatable process into a skill. Call at end of the process you want to capture with an optional description.",
    allowedTools: [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "AskUserQuestion",
      "Bash(mkdir:*)"
    ],
    userInvocable: true,
    disableModelInvocation: true,
    argumentHint: "[description of the process you want to capture]",
    async getPromptForCommand(args, context) {
      const sessionMemory = await getSessionMemoryContent() ?? "No session memory available.";
      const userMessages = extractUserMessages(getMessagesAfterCompactBoundary(context.messages));
      const userDescriptionBlock = args ? `The user described this process as: "${args}"` : "";
      const prompt = SKILLIFY_PROMPT.replace("{{sessionMemory}}", sessionMemory).replace("{{userMessages}}", userMessages.join(`

---

`)).replace("{{userDescriptionBlock}}", userDescriptionBlock);
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/stuck.ts
init_bundledSkills();
var STUCK_PROMPT = `# /stuck \u2014 diagnose frozen/slow Panda Code sessions

The user thinks another Panda Code session on this machine is frozen, stuck, or very slow. Investigate and post a report to #claude-code-feedback.

## What to look for

Scan for other Panda Code processes (excluding the current one \u2014 PID is in \`process.pid\` but for shell commands just exclude the PID you see running this prompt). Process names are typically \`claude\` (installed) or \`cli\` (native dev build).

Signs of a stuck session:
- **High CPU (\u226590%) sustained** \u2014 likely an infinite loop. Sample twice, 1-2s apart, to confirm it's not a transient spike.
- **Process state \`D\` (uninterruptible sleep)** \u2014 often an I/O hang. The \`state\` column in \`ps\` output; first character matters (ignore modifiers like \`+\`, \`s\`, \`<\`).
- **Process state \`T\` (stopped)** \u2014 user probably hit Ctrl+Z by accident.
- **Process state \`Z\` (zombie)** \u2014 parent isn't reaping.
- **Very high RSS (\u22654GB)** \u2014 possible memory leak making the session sluggish.
- **Stuck child process** \u2014 a hung \`git\`, \`node\`, or shell subprocess can freeze the parent. Check \`pgrep -lP <pid>\` for each session.

## Investigation steps

1. **List all Panda Code processes** (macOS/Linux):
   \`\`\`
   ps -axo pid=,pcpu=,rss=,etime=,state=,comm=,command= | grep -E '(claude|cli)' | grep -v grep
   \`\`\`
   Filter to rows where \`comm\` is \`claude\` or (\`cli\` AND the command path contains "claude").

2. **For anything suspicious**, gather more context:
   - Child processes: \`pgrep -lP <pid>\`
   - If high CPU: sample again after 1-2s to confirm it's sustained
   - If a child looks hung (e.g., a git command), note its full command line with \`ps -p <child_pid> -o command=\`
   - Check the session's debug log if you can infer the session ID: \`~/.pandacc/debug/<session-id>.txt\` (the last few hundred lines often show what it was doing before hanging)

3. **Consider a stack dump** for a truly frozen process (advanced, optional):
   - macOS: \`sample <pid> 3\` gives a 3-second native stack sample
   - This is big \u2014 only grab it if the process is clearly hung and you want to know *why*

## Report

**Only post to Slack if you actually found something stuck.** If every session looks healthy, tell the user that directly \u2014 do not post an all-clear to the channel.

If you did find a stuck/slow session, post to **#claude-code-feedback** (channel ID: \`C07VBSHV7EV\`) using the Slack MCP tool. Use ToolSearch to find \`slack_send_message\` if it's not already loaded.

**Use a two-message structure** to keep the channel scannable:

1. **Top-level message** \u2014 one short line: hostname, Panda Code version, and a terse symptom (e.g. "session PID 12345 pegged at 100% CPU for 10min" or "git subprocess hung in D state"). No code blocks, no details.
2. **Thread reply** \u2014 the full diagnostic dump. Pass the top-level message's \`ts\` as \`thread_ts\`. Include:
   - PID, CPU%, RSS, state, uptime, command line, child processes
   - Your diagnosis of what's likely wrong
   - Relevant debug log tail or \`sample\` output if you captured it

If Slack MCP isn't available, format the report as a message the user can copy-paste into #claude-code-feedback (and let them know to thread the details themselves).

## Notes
- Don't kill or signal any processes \u2014 this is diagnostic only.
- If the user gave an argument (e.g., a specific PID or symptom), focus there first.
`;
function registerStuckSkill() {
  if (process.env.USER_TYPE !== "ant") {
    return;
  }
  registerBundledSkill({
    name: "stuck",
    description: "[ANT-ONLY] Investigate frozen/stuck/slow Panda Code sessions on this machine and post a diagnostic report to #claude-code-feedback.",
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = STUCK_PROMPT;
      if (args) {
        prompt += `
## User-provided context

${args}
`;
      }
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/updateConfig.ts
init_v4();
init_types();
init_slowOperations();
init_bundledSkills();
function generateSettingsSchema() {
  const jsonSchema = toJSONSchema(SettingsSchema(), { io: "input" });
  return jsonStringify(jsonSchema, null, 2);
}
var SETTINGS_EXAMPLES_DOCS = `## Settings File Locations

Choose the appropriate file based on scope:

| File | Scope | Git | Use For |
|------|-------|-----|---------|
| \`~/.pandacc/settings.json\` | Global | N/A | Personal preferences for all projects |
| \`.pandacc/settings.json\` | Project | Commit | Team-wide hooks, permissions, plugins |
| \`.pandacc/settings.local.json\` | Project | Gitignore | Personal overrides for this project |

Settings load in order: user \u2192 project \u2192 local (later overrides earlier).

## Settings Schema Reference

### Permissions
\`\`\`json
{
  "permissions": {
    "allow": ["Bash(npm:*)", "Edit(.claude)", "Read"],
    "deny": ["Bash(rm -rf:*)"],
    "ask": ["Write(/etc/*)"],
    "defaultMode": "default" | "plan" | "acceptEdits" | "dontAsk",
    "additionalDirectories": ["/extra/dir"]
  }
}
\`\`\`

**Permission Rule Syntax:**
- Exact match: \`"Bash(npm run test)"\`
- Prefix wildcard: \`"Bash(git:*)"\` - matches \`git status\`, \`git commit\`, etc.
- Tool only: \`"Read"\` - allows all Read operations

### Environment Variables
\`\`\`json
{
  "env": {
    "DEBUG": "true",
    "MY_API_KEY": "value"
  }
}
\`\`\`

### Model & Agent
\`\`\`json
{
  "model": "sonnet",  // or "opus", "haiku", full model ID
  "agent": "agent-name",
  "alwaysThinkingEnabled": true
}
\`\`\`

### Attribution (Commits & PRs)
\`\`\`json
{
  "attribution": {
    "commit": "Custom commit trailer text",
    "pr": "Custom PR description text"
  }
}
\`\`\`
Set \`commit\` or \`pr\` to empty string \`""\` to hide that attribution.

### MCP Server Management
\`\`\`json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["server1", "server2"],
  "disabledMcpjsonServers": ["blocked-server"]
}
\`\`\`

### Plugins
\`\`\`json
{
  "enabledPlugins": {
    "formatter@anthropic-tools": true
  }
}
\`\`\`
Plugin syntax: \`plugin-name@source\` where source is \`claude-code-marketplace\`, \`claude-plugins-official\`, or \`builtin\`.

### Other Settings
- \`language\`: Preferred response language (e.g., "japanese")
- \`cleanupPeriodDays\`: Days to keep transcripts (default: 30; 0 disables persistence entirely)
- \`respectGitignore\`: Whether to respect .gitignore (default: true)
- \`spinnerTipsEnabled\`: Show tips in spinner
- \`spinnerVerbs\`: Customize spinner verbs (\`{ "mode": "append" | "replace", "verbs": [...] }\`)
- \`spinnerTipsOverride\`: Override spinner tips (\`{ "excludeDefault": true, "tips": ["Custom tip"] }\`)
- \`syntaxHighlightingDisabled\`: Disable diff highlighting
`;
var HOOKS_DOCS = `## Hooks Configuration

Hooks run commands at specific points in Panda Code's lifecycle.

### Hook Structure
\`\`\`json
{
  "hooks": {
    "EVENT_NAME": [
      {
        "matcher": "ToolName|OtherTool",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here",
            "timeout": 60,
            "statusMessage": "Running..."
          }
        ]
      }
    ]
  }
}
\`\`\`

### Hook Events

| Event | Matcher | Purpose |
|-------|---------|---------|
| PermissionRequest | Tool name | Run before permission prompt |
| PreToolUse | Tool name | Run before tool, can block |
| PostToolUse | Tool name | Run after successful tool |
| PostToolUseFailure | Tool name | Run after tool fails |
| Notification | Notification type | Run on notifications |
| Stop | - | Run when Claude stops (including clear, resume, compact) |
| PreCompact | "manual"/"auto" | Before compaction |
| PostCompact | "manual"/"auto" | After compaction (receives summary) |
| UserPromptSubmit | - | When user submits |
| SessionStart | - | When session starts |

**Common tool matchers:** \`Bash\`, \`Write\`, \`Edit\`, \`Read\`, \`Glob\`, \`Grep\`

### Hook Types

**1. Command Hook** - Runs a shell command:
\`\`\`json
{ "type": "command", "command": "prettier --write $FILE", "timeout": 30 }
\`\`\`

**2. Prompt Hook** - Evaluates a condition with LLM:
\`\`\`json
{ "type": "prompt", "prompt": "Is this safe? $ARGUMENTS" }
\`\`\`
Only available for tool events: PreToolUse, PostToolUse, PermissionRequest.

**3. Agent Hook** - Runs an agent with tools:
\`\`\`json
{ "type": "agent", "prompt": "Verify tests pass: $ARGUMENTS" }
\`\`\`
Only available for tool events: PreToolUse, PostToolUse, PermissionRequest.

### Hook Input (stdin JSON)
\`\`\`json
{
  "session_id": "abc123",
  "tool_name": "Write",
  "tool_input": { "file_path": "/path/to/file.txt", "content": "..." },
  "tool_response": { "success": true }  // PostToolUse only
}
\`\`\`

### Hook JSON Output

Hooks can return JSON to control behavior:

\`\`\`json
{
  "systemMessage": "Warning shown to user in UI",
  "continue": false,
  "stopReason": "Message shown when blocking",
  "suppressOutput": false,
  "decision": "block",
  "reason": "Explanation for decision",
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "Context injected back to model"
  }
}
\`\`\`

**Fields:**
- \`systemMessage\` - Display a message to the user (all hooks)
- \`continue\` - Set to \`false\` to block/stop (default: true)
- \`stopReason\` - Message shown when \`continue\` is false
- \`suppressOutput\` - Hide stdout from transcript (default: false)
- \`decision\` - "block" for PostToolUse/Stop/UserPromptSubmit hooks (deprecated for PreToolUse, use hookSpecificOutput.permissionDecision instead)
- \`reason\` - Explanation for decision
- \`hookSpecificOutput\` - Event-specific output (must include \`hookEventName\`):
  - \`additionalContext\` - Text injected into model context
  - \`permissionDecision\` - "allow", "deny", or "ask" (PreToolUse only)
  - \`permissionDecisionReason\` - Reason for the permission decision (PreToolUse only)
  - \`updatedInput\` - Modified tool input (PreToolUse only)

### Common Patterns

**Auto-format after writes:**
\`\`\`json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_response.filePath // .tool_input.file_path' | { read -r f; prettier --write \\"$f\\"; } 2>/dev/null || true"
      }]
    }]
  }
}
\`\`\`

**Log all bash commands:**
\`\`\`json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.command' >> ~/.pandacc/bash-log.txt"
      }]
    }]
  }
}
\`\`\`

**Stop hook that displays message to user:**

Command must output JSON with \`systemMessage\` field:
\`\`\`bash
# Example command that outputs: {"systemMessage": "Session complete!"}
echo '{"systemMessage": "Session complete!"}'
\`\`\`

**Run tests after code changes:**
\`\`\`json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.file_path // .tool_response.filePath' | grep -E '\\\\.(ts|js)$' && npm test || true"
      }]
    }]
  }
}
\`\`\`
`;
var HOOK_VERIFICATION_FLOW = `## Constructing a Hook (with verification)

Given an event, matcher, target file, and desired behavior, follow this flow. Each step catches a different failure class \u2014 a hook that silently does nothing is worse than no hook.

1. **Dedup check.** Read the target file. If a hook already exists on the same event+matcher, show the existing command and ask: keep it, replace it, or add alongside.

2. **Construct the command for THIS project \u2014 don't assume.** The hook receives JSON on stdin. Build a command that:
   - Extracts any needed payload safely \u2014 use \`jq -r\` into a quoted variable or \`{ read -r f; ... "$f"; }\`, NOT unquoted \`| xargs\` (splits on spaces)
   - Invokes the underlying tool the way this project runs it (npx/bunx/yarn/pnpm? Makefile target? globally-installed?)
   - Skips inputs the tool doesn't handle (formatters often have \`--ignore-unknown\`; if not, guard by extension)
   - Stays RAW for now \u2014 no \`|| true\`, no stderr suppression. You'll wrap it after the pipe-test passes.

3. **Pipe-test the raw command.** Synthesize the stdin payload the hook will receive and pipe it directly:
   - \`Pre|PostToolUse\` on \`Write|Edit\`: \`echo '{"tool_name":"Edit","tool_input":{"file_path":"<a real file from this repo>"}}' | <cmd>\`
   - \`Pre|PostToolUse\` on \`Bash\`: \`echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | <cmd>\`
   - \`Stop\`/\`UserPromptSubmit\`/\`SessionStart\`: most commands don't read stdin, so \`echo '{}' | <cmd>\` suffices

   Check exit code AND side effect (file actually formatted, test actually ran). If it fails you get a real error \u2014 fix (wrong package manager? tool not installed? jq path wrong?) and retest. Once it works, wrap with \`2>/dev/null || true\` (unless the user wants a blocking check).

4. **Write the JSON.** Merge into the target file (schema shape in the "Hook Structure" section above). If this creates \`.pandacc/settings.local.json\` for the first time, add it to .gitignore \u2014 the Write tool doesn't auto-gitignore it.

5. **Validate syntax + schema in one shot:**

   \`jq -e '.hooks.<event>[] | select(.matcher == "<matcher>") | .hooks[] | select(.type == "command") | .command' <target-file>\`

   Exit 0 + prints your command = correct. Exit 4 = matcher doesn't match. Exit 5 = malformed JSON or wrong nesting. A broken settings.json silently disables ALL settings from that file \u2014 fix any pre-existing malformation too.

6. **Prove the hook fires** \u2014 only for \`Pre|PostToolUse\` on a matcher you can trigger in-turn (\`Write|Edit\` via Edit, \`Bash\` via Bash). \`Stop\`/\`UserPromptSubmit\`/\`SessionStart\` fire outside this turn \u2014 skip to step 7.

   For a **formatter** on \`PostToolUse\`/\`Write|Edit\`: introduce a detectable violation via Edit (two consecutive blank lines, bad indentation, missing semicolon \u2014 something this formatter corrects; NOT trailing whitespace, Edit strips that before writing), re-read, confirm the hook **fixed** it. For **anything else**: temporarily prefix the command in settings.json with \`echo "$(date) hook fired" >> /tmp/claude-hook-check.txt; \`, trigger the matching tool (Edit for \`Write|Edit\`, a harmless \`true\` for \`Bash\`), read the sentinel file.

   **Always clean up** \u2014 revert the violation, strip the sentinel prefix \u2014 whether the proof passed or failed.

   **If proof fails but pipe-test passed and \`jq -e\` passed**: the settings watcher isn't watching \`.pandacc/\` \u2014 it only watches directories that had a settings file when this session started. The hook is written correctly. Tell the user to open \`/hooks\` once (reloads config) or restart \u2014 you can't do this yourself; \`/hooks\` is a user UI menu and opening it ends this turn.

7. **Handoff.** Tell the user the hook is live (or needs \`/hooks\`/restart per the watcher caveat). Point them at \`/hooks\` to review, edit, or disable it later. The UI only shows "Ran N hooks" if a hook errors or is slow \u2014 silent success is invisible by design.
`;
var UPDATE_CONFIG_PROMPT = `# Update Config Skill

Modify Panda Code configuration by updating settings.json files.

## When Hooks Are Required (Not Memory)

If the user wants something to happen automatically in response to an EVENT, they need a **hook** configured in settings.json. Memory/preferences cannot trigger automated actions.

**These require hooks:**
- "Before compacting, ask me what to preserve" \u2192 PreCompact hook
- "After writing files, run prettier" \u2192 PostToolUse hook with Write|Edit matcher
- "When I run bash commands, log them" \u2192 PreToolUse hook with Bash matcher
- "Always run tests after code changes" \u2192 PostToolUse hook

**Hook events:** PreToolUse, PostToolUse, PreCompact, PostCompact, Stop, Notification, SessionStart

## CRITICAL: Read Before Write

**Always read the existing settings file before making changes.** Merge new settings with existing ones - never replace the entire file.

## CRITICAL: Use AskUserQuestion for Ambiguity

When the user's request is ambiguous, use AskUserQuestion to clarify:
- Which settings file to modify (user/project/local)
- Whether to add to existing arrays or replace them
- Specific values when multiple options exist

## Decision: Config Tool vs Direct Edit

**Use the Config tool** for these simple settings:
- \`theme\`, \`editorMode\`, \`verbose\`, \`model\`
- \`language\`, \`alwaysThinkingEnabled\`
- \`permissions.defaultMode\`

**Edit settings.json directly** for:
- Hooks (PreToolUse, PostToolUse, etc.)
- Complex permission rules (allow/deny arrays)
- Environment variables
- MCP server configuration
- Plugin configuration

## Workflow

1. **Clarify intent** - Ask if the request is ambiguous
2. **Read existing file** - Use Read tool on the target settings file
3. **Merge carefully** - Preserve existing settings, especially arrays
4. **Edit file** - Use Edit tool (if file doesn't exist, ask user to create it first)
5. **Confirm** - Tell user what was changed

## Merging Arrays (Important!)

When adding to permission arrays or hook arrays, **merge with existing**, don't replace:

**WRONG** (replaces existing permissions):
\`\`\`json
{ "permissions": { "allow": ["Bash(npm:*)"] } }
\`\`\`

**RIGHT** (preserves existing + adds new):
\`\`\`json
{
  "permissions": {
    "allow": [
      "Bash(git:*)",      // existing
      "Edit(.claude)",    // existing
      "Bash(npm:*)"       // new
    ]
  }
}
\`\`\`

${SETTINGS_EXAMPLES_DOCS}

${HOOKS_DOCS}

${HOOK_VERIFICATION_FLOW}

## Example Workflows

### Adding a Hook

User: "Format my code after Claude writes it"

1. **Clarify**: Which formatter? (prettier, gofmt, etc.)
2. **Read**: \`.pandacc/settings.json\` (or create if missing)
3. **Merge**: Add to existing hooks, don't replace
4. **Result**:
\`\`\`json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_response.filePath // .tool_input.file_path' | { read -r f; prettier --write \\"$f\\"; } 2>/dev/null || true"
      }]
    }]
  }
}
\`\`\`

### Adding Permissions

User: "Allow npm commands without prompting"

1. **Read**: Existing permissions
2. **Merge**: Add \`Bash(npm:*)\` to allow array
3. **Result**: Combined with existing allows

### Environment Variables

User: "Set DEBUG=true"

1. **Decide**: User settings (global) or project settings?
2. **Read**: Target file
3. **Merge**: Add to env object
\`\`\`json
{ "env": { "DEBUG": "true" } }
\`\`\`

## Common Mistakes to Avoid

1. **Replacing instead of merging** - Always preserve existing settings
2. **Wrong file** - Ask user if scope is unclear
3. **Invalid JSON** - Validate syntax after changes
4. **Forgetting to read first** - Always read before write

## Troubleshooting Hooks

If a hook isn't running:
1. **Check the settings file** - Read ~/.pandacc/settings.json or .pandacc/settings.json
2. **Verify JSON syntax** - Invalid JSON silently fails
3. **Check the matcher** - Does it match the tool name? (e.g., "Bash", "Write", "Edit")
4. **Check hook type** - Is it "command", "prompt", or "agent"?
5. **Test the command** - Run the hook command manually to see if it works
6. **Use --debug** - Run \`claude --debug\` to see hook execution logs
`;
function registerUpdateConfigSkill() {
  registerBundledSkill({
    name: "update-config",
    description: 'Use this skill to configure the Panda Code harness via settings.json. Automated behaviors ("from now on when X", "each time X", "whenever X", "before/after X") require hooks configured in settings.json - the harness executes these, not Claude, so memory/preferences cannot fulfill them. Also use for: permissions ("allow X", "add permission", "move permission to"), env vars ("set X=Y"), hook troubleshooting, or any changes to settings.json/settings.local.json files. Examples: "allow npm commands", "add bq permission to global settings", "move permission to user settings", "set DEBUG=true", "when claude stops show X". For simple settings like theme/model, use Config tool.',
    allowedTools: ["Read"],
    userInvocable: true,
    async getPromptForCommand(args) {
      if (args.startsWith("[hooks-only]")) {
        const req = args.slice("[hooks-only]".length).trim();
        let prompt2 = HOOKS_DOCS + `

` + HOOK_VERIFICATION_FLOW;
        if (req) {
          prompt2 += `

## Task

${req}`;
        }
        return [{ type: "text", text: prompt2 }];
      }
      const jsonSchema = generateSettingsSchema();
      let prompt = UPDATE_CONFIG_PROMPT;
      prompt += `

## Full Settings JSON Schema

\`\`\`json
${jsonSchema}
\`\`\``;
      if (args) {
        prompt += `

## User Request

${args}`;
      }
      return [{ type: "text", text: prompt }];
    }
  });
}

// src/skills/bundled/verify.ts
init_frontmatterParser();
init_bundledSkills();

// src/skills/bundled/verify/examples/cli.md
var cli_default = `<h1>CLI</h1>
`;

// src/skills/bundled/verify/examples/server.md
var server_default = `<h1>Server</h1>
`;

// src/skills/bundled/verify/SKILL.md
var SKILL_default = `<h1>Skill</h1>
`;

// src/skills/bundled/verifyContent.ts
var SKILL_MD = SKILL_default;
var SKILL_FILES = {
  "examples/cli.md": cli_default,
  "examples/server.md": server_default
};

// src/skills/bundled/verify.ts
var { frontmatter, content: SKILL_BODY } = parseFrontmatter(SKILL_MD);
var DESCRIPTION = typeof frontmatter.description === "string" ? frontmatter.description : "Verify a code change does what it should by running the app.";
function registerVerifySkill() {
  if (process.env.USER_TYPE !== "ant") {
    return;
  }
  registerBundledSkill({
    name: "verify",
    description: DESCRIPTION,
    userInvocable: true,
    files: SKILL_FILES,
    async getPromptForCommand(args) {
      const parts = [SKILL_BODY.trimStart()];
      if (args) {
        parts.push(`## User Request

${args}`);
      }
      return [{ type: "text", text: parts.join(`

`) }];
    }
  });
}

// src/skills/bundled/index.ts
function initBundledSkills() {
  registerUpdateConfigSkill();
  registerKeybindingsSkill();
  registerVerifySkill();
  registerDebugSkill();
  registerLoremIpsumSkill();
  registerSkillifySkill();
  registerRememberSkill();
  registerSimplifySkill();
  registerBatchSkill();
  registerStuckSkill();
  registerMorningSkill();
  registerOrganizeSkill();
  registerCleanupSkill();
  registerHealthCheckSkill();
  registerRemindSkill();
  if (false) {}
  if (false) {}
  if (false) {}
  if (false) {}
  if (false) {}
  if (shouldAutoEnableClaudeInChrome()) {
    registerClaudeInChromeSkill();
  }
  if (false) {}
}

// src/main.tsx
init_loadAgentsDir();
init_autoUpdater();
init_prompt3();
init_setup();
init_context();
init_conversationRecovery();

// src/utils/deepLink/banner.ts
init_format();
init_gitFilesystem();
init_git();
var STALE_FETCH_WARN_MS = 7 * 24 * 60 * 60 * 1000;

// src/main.tsx
init_envUtils();
init_getWorktreePaths();
init_git();

// src/utils/github/ghAuthStatus.ts
init_execa();
init_which();
async function getGhAuthStatus() {
  const ghPath = await which("gh");
  if (!ghPath) {
    return "not_installed";
  }
  const { exitCode } = await execa("gh", ["auth", "token"], {
    stdout: "ignore",
    stderr: "ignore",
    timeout: 5000,
    reject: false
  });
  return exitCode === 0 ? "authenticated" : "not_authenticated";
}

// src/main.tsx
init_json();
init_log();
init_model();
init_modelStrings();
init_PermissionMode();
init_permissionSetup();
init_cacheUtils();
init_installedPluginsManager();
init_managedPlugins();
init_orphanedPluginFilter();
init_pluginDirectories();
init_ripgrep();
init_sessionStart();
init_sessionStorage();
init_settings();
init_settings2();
init_settingsCache();
init_tasks();
init_pluginTelemetry();

// src/utils/telemetry/skillLoadedEvent.ts
init_commands();
init_analytics();
init_prompt();
async function logSkillsLoaded(cwd, contextWindowTokens) {
  const skills = await getSkillToolCommands(cwd);
  const skillBudget = getCharBudget(contextWindowTokens);
  for (const skill of skills) {
    if (skill.type !== "prompt")
      continue;
    logEvent("tengu_skill_loaded", {
      _PROTO_skill_name: skill.name,
      skill_source: skill.source,
      skill_loaded_from: skill.loadedFrom,
      skill_budget: skillBudget,
      ...skill.kind && {
        skill_kind: skill.kind
      }
    });
  }
}

// src/main.tsx
init_tempfile();
init_uuid();

// src/commands/mcp/addCommand.ts
init_analytics();
init_auth2();
init_config3();
init_utils();
init_xaaIdpLogin();
init_envUtils();
init_slowOperations();
function registerMcpAddCommand(mcp) {
  mcp.command("add <name> <commandOrUrl> [args...]").description(`Add an MCP server to Panda Code.

` + `Examples:
` + `  # Add HTTP server:
` + `  claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

` + `  # Add HTTP server with headers:
` + `  claude mcp add --transport http corridor https://app.corridor.dev/api/mcp --header "Authorization: Bearer ..."

` + `  # Add stdio server with environment variables:
` + `  claude mcp add -e API_KEY=xxx my-server -- npx my-mcp-server

` + `  # Add stdio server with subprocess flags:
` + "  claude mcp add my-server -- my-command --some-flag arg1").option("-s, --scope <scope>", "Configuration scope (local, user, or project)", "local").option("-t, --transport <transport>", "Transport type (stdio, sse, http). Defaults to stdio if not specified.").option("-e, --env <env...>", "Set environment variables (e.g. -e KEY=value)").option("-H, --header <header...>", 'Set WebSocket headers (e.g. -H "X-Api-Key: abc123" -H "X-Custom: value")').option("--client-id <clientId>", "OAuth client ID for HTTP/SSE servers").option("--client-secret", "Prompt for OAuth client secret (or set MCP_CLIENT_SECRET env var)").option("--callback-port <port>", "Fixed port for OAuth callback (for servers requiring pre-registered redirect URIs)").helpOption("-h, --help", "Display help for command").addOption(new Option("--xaa", "Enable XAA (SEP-990) for this server. Requires 'claude mcp xaa setup' first. Also requires --client-id and --client-secret (for the MCP server's AS).").hideHelp(!isXaaEnabled())).action(async (name, commandOrUrl, args, options) => {
    const actualCommand = commandOrUrl;
    const actualArgs = args;
    if (!name) {
      cliError(`Error: Server name is required.
` + "Usage: claude mcp add <name> <command> [args...]");
    } else if (!actualCommand) {
      cliError(`Error: Command is required when server name is provided.
` + "Usage: claude mcp add <name> <command> [args...]");
    }
    try {
      const scope = ensureConfigScope(options.scope);
      const transport = ensureTransport(options.transport);
      if (options.xaa && !isXaaEnabled()) {
        cliError("Error: --xaa requires CLAUDE_CODE_ENABLE_XAA=1 in your environment");
      }
      const xaa = Boolean(options.xaa);
      if (xaa) {
        const missing = [];
        if (!options.clientId)
          missing.push("--client-id");
        if (!options.clientSecret)
          missing.push("--client-secret");
        if (!getXaaIdpSettings()) {
          missing.push("'claude mcp xaa setup' (settings.xaaIdp not configured)");
        }
        if (missing.length) {
          cliError(`Error: --xaa requires: ${missing.join(", ")}`);
        }
      }
      const transportExplicit = options.transport !== undefined;
      const looksLikeUrl = actualCommand.startsWith("http://") || actualCommand.startsWith("https://") || actualCommand.startsWith("localhost") || actualCommand.endsWith("/sse") || actualCommand.endsWith("/mcp");
      logEvent("tengu_mcp_add", {
        type: transport,
        scope,
        source: "command",
        transport,
        transportExplicit,
        looksLikeUrl
      });
      if (transport === "sse") {
        if (!actualCommand) {
          cliError("Error: URL is required for SSE transport.");
        }
        const headers = options.header ? parseHeaders(options.header) : undefined;
        const callbackPort = options.callbackPort ? parseInt(options.callbackPort, 10) : undefined;
        const oauth = options.clientId || callbackPort || xaa ? {
          ...options.clientId ? { clientId: options.clientId } : {},
          ...callbackPort ? { callbackPort } : {},
          ...xaa ? { xaa: true } : {}
        } : undefined;
        const clientSecret = options.clientSecret && options.clientId ? await readClientSecret() : undefined;
        const serverConfig = {
          type: "sse",
          url: actualCommand,
          headers,
          oauth
        };
        await addMcpConfig(name, serverConfig, scope);
        if (clientSecret) {
          saveMcpClientSecret(name, serverConfig, clientSecret);
        }
        process.stdout.write(`Added SSE MCP server ${name} with URL: ${actualCommand} to ${scope} config
`);
        if (headers) {
          process.stdout.write(`Headers: ${jsonStringify(headers, null, 2)}
`);
        }
      } else if (transport === "http") {
        if (!actualCommand) {
          cliError("Error: URL is required for HTTP transport.");
        }
        const headers = options.header ? parseHeaders(options.header) : undefined;
        const callbackPort = options.callbackPort ? parseInt(options.callbackPort, 10) : undefined;
        const oauth = options.clientId || callbackPort || xaa ? {
          ...options.clientId ? { clientId: options.clientId } : {},
          ...callbackPort ? { callbackPort } : {},
          ...xaa ? { xaa: true } : {}
        } : undefined;
        const clientSecret = options.clientSecret && options.clientId ? await readClientSecret() : undefined;
        const serverConfig = {
          type: "http",
          url: actualCommand,
          headers,
          oauth
        };
        await addMcpConfig(name, serverConfig, scope);
        if (clientSecret) {
          saveMcpClientSecret(name, serverConfig, clientSecret);
        }
        process.stdout.write(`Added HTTP MCP server ${name} with URL: ${actualCommand} to ${scope} config
`);
        if (headers) {
          process.stdout.write(`Headers: ${jsonStringify(headers, null, 2)}
`);
        }
      } else {
        if (options.clientId || options.clientSecret || options.callbackPort || options.xaa) {
          process.stderr.write(`Warning: --client-id, --client-secret, --callback-port, and --xaa are only supported for HTTP/SSE transports and will be ignored for stdio.
`);
        }
        if (!transportExplicit && looksLikeUrl) {
          process.stderr.write(`
Warning: The command "${actualCommand}" looks like a URL, but is being interpreted as a stdio server as --transport was not specified.
`);
          process.stderr.write(`If this is an HTTP server, use: claude mcp add --transport http ${name} ${actualCommand}
`);
          process.stderr.write(`If this is an SSE server, use: claude mcp add --transport sse ${name} ${actualCommand}
`);
        }
        const env = parseEnvVars(options.env);
        await addMcpConfig(name, { type: "stdio", command: actualCommand, args: actualArgs, env }, scope);
        process.stdout.write(`Added stdio MCP server ${name} with command: ${actualCommand} ${actualArgs.join(" ")} to ${scope} config
`);
      }
      cliOk(`File modified: ${describeMcpConfigFilePath(scope)}`);
    } catch (error) {
      cliError(error.message);
    }
  });
}

// src/commands/mcp/xaaIdpCommand.ts
init_xaaIdpLogin();
init_errors();
init_settings2();
function registerMcpXaaIdpCommand(mcp) {
  const xaaIdp = mcp.command("xaa").description("Manage the XAA (SEP-990) IdP connection");
  xaaIdp.command("setup").description("Configure the IdP connection (one-time setup for all XAA-enabled servers)").requiredOption("--issuer <url>", "IdP issuer URL (OIDC discovery)").requiredOption("--client-id <id>", "Panda Code's client_id at the IdP").option("--client-secret", "Read IdP client secret from MCP_XAA_IDP_CLIENT_SECRET env var").option("--callback-port <port>", "Fixed loopback callback port (only if IdP does not honor RFC 8252 port-any matching)").action((options) => {
    let issuerUrl;
    try {
      issuerUrl = new URL(options.issuer);
    } catch {
      return cliError(`Error: --issuer must be a valid URL (got "${options.issuer}")`);
    }
    if (issuerUrl.protocol !== "https:" && !(issuerUrl.protocol === "http:" && (issuerUrl.hostname === "localhost" || issuerUrl.hostname === "127.0.0.1" || issuerUrl.hostname === "[::1]"))) {
      return cliError(`Error: --issuer must use https:// (got "${issuerUrl.protocol}//${issuerUrl.host}")`);
    }
    const callbackPort = options.callbackPort ? parseInt(options.callbackPort, 10) : undefined;
    if (callbackPort !== undefined && (!Number.isInteger(callbackPort) || callbackPort <= 0)) {
      return cliError("Error: --callback-port must be a positive integer");
    }
    const secret = options.clientSecret ? process.env.MCP_XAA_IDP_CLIENT_SECRET : undefined;
    if (options.clientSecret && !secret) {
      return cliError("Error: --client-secret requires MCP_XAA_IDP_CLIENT_SECRET env var");
    }
    const old = getXaaIdpSettings();
    const oldIssuer = old?.issuer;
    const oldClientId = old?.clientId;
    const { error } = updateSettingsForSource("userSettings", {
      xaaIdp: {
        issuer: options.issuer,
        clientId: options.clientId,
        callbackPort
      }
    });
    if (error) {
      return cliError(`Error writing settings: ${error.message}`);
    }
    if (oldIssuer) {
      if (issuerKey(oldIssuer) !== issuerKey(options.issuer)) {
        clearIdpIdToken(oldIssuer);
        clearIdpClientSecret(oldIssuer);
      } else if (oldClientId !== options.clientId) {
        clearIdpIdToken(oldIssuer);
        clearIdpClientSecret(oldIssuer);
      }
    }
    if (secret) {
      const { success, warning } = saveIdpClientSecret(options.issuer, secret);
      if (!success) {
        return cliError(`Error: settings written but keychain save failed${warning ? ` \u2014 ${warning}` : ""}. ` + `Re-run with --client-secret once keychain is available.`);
      }
    }
    cliOk(`XAA IdP connection configured for ${options.issuer}`);
  });
  xaaIdp.command("login").description("Cache an IdP id_token so XAA-enabled MCP servers authenticate " + "silently. Default: run the OIDC browser login. With --id-token: " + "write a pre-obtained JWT directly (used by conformance/e2e tests " + "where the mock IdP does not serve /authorize).").option("--force", "Ignore any cached id_token and re-login (useful after IdP-side revocation)").option("--id-token <jwt>", "Write this pre-obtained id_token directly to cache, skipping the OIDC browser login").action(async (options) => {
    const idp = getXaaIdpSettings();
    if (!idp) {
      return cliError("Error: no XAA IdP connection. Run 'claude mcp xaa setup' first.");
    }
    if (options.idToken) {
      const expiresAt = saveIdpIdTokenFromJwt(idp.issuer, options.idToken);
      return cliOk(`id_token cached for ${idp.issuer} (expires ${new Date(expiresAt).toISOString()})`);
    }
    if (options.force) {
      clearIdpIdToken(idp.issuer);
    }
    const wasCached = getCachedIdpIdToken(idp.issuer) !== undefined;
    if (wasCached) {
      return cliOk(`Already logged in to ${idp.issuer} (cached id_token still valid). Use --force to re-login.`);
    }
    process.stdout.write(`Opening browser for IdP login at ${idp.issuer}\u2026
`);
    try {
      await acquireIdpIdToken({
        idpIssuer: idp.issuer,
        idpClientId: idp.clientId,
        idpClientSecret: getIdpClientSecret(idp.issuer),
        callbackPort: idp.callbackPort,
        onAuthorizationUrl: (url) => {
          process.stdout.write(`If the browser did not open, visit:
  ${url}
`);
        }
      });
      cliOk(`Logged in. MCP servers with --xaa will now authenticate silently.`);
    } catch (e) {
      cliError(`IdP login failed: ${errorMessage(e)}`);
    }
  });
  xaaIdp.command("show").description("Show the current IdP connection config").action(() => {
    const idp = getXaaIdpSettings();
    if (!idp) {
      return cliOk("No XAA IdP connection configured.");
    }
    const hasSecret = getIdpClientSecret(idp.issuer) !== undefined;
    const hasIdToken = getCachedIdpIdToken(idp.issuer) !== undefined;
    process.stdout.write(`Issuer:        ${idp.issuer}
`);
    process.stdout.write(`Client ID:     ${idp.clientId}
`);
    if (idp.callbackPort !== undefined) {
      process.stdout.write(`Callback port: ${idp.callbackPort}
`);
    }
    process.stdout.write(`Client secret: ${hasSecret ? "(stored in keychain)" : "(not set \u2014 PKCE-only)"}
`);
    process.stdout.write(`Logged in:     ${hasIdToken ? "yes (id_token cached)" : "no \u2014 run 'claude mcp xaa login'"}
`);
    cliOk();
  });
  xaaIdp.command("clear").description("Clear the IdP connection config and cached id_token").action(() => {
    const idp = getXaaIdpSettings();
    const { error } = updateSettingsForSource("userSettings", {
      xaaIdp: undefined
    });
    if (error) {
      return cliError(`Error writing settings: ${error.message}`);
    }
    if (idp) {
      clearIdpIdToken(idp.issuer);
      clearIdpClientSecret(idp.issuer);
    }
    cliOk("XAA IdP connection cleared");
  });
}

// src/main.tsx
init_internalLogging();
init_claudeai();
init_client2();
init_config3();
init_utils();
init_xaaIdpLogin();
init_api2();
init_common();
init_cleanupRegistry();

// src/utils/cliArgs.ts
function eagerParseCliFlag(flagName, argv = process.argv) {
  for (let i = 0;i < argv.length; i++) {
    const arg = argv[i];
    if (arg?.startsWith(`${flagName}=`)) {
      return arg.slice(flagName.length + 1);
    }
    if (arg === flagName && i + 1 < argv.length) {
      return argv[i + 1];
    }
  }
  return;
}

// src/main.tsx
init_commitAttribution();
init_concurrentSessions();
init_cwd();
init_debug();
init_errors();
init_fsOperations();
init_gracefulShutdown();
init_hookEvents();
init_modelCapabilities();
init_process();
init_Shell();
init_constants();
init_stringUtils();
init_state();

// src/migrations/migrateAutoUpdatesToSettings.ts
init_analytics();
init_config2();
init_log();
init_settings2();
function migrateAutoUpdatesToSettings() {
  const globalConfig = getGlobalConfig();
  if (globalConfig.autoUpdates !== false || globalConfig.autoUpdatesProtectedForNative === true) {
    return;
  }
  try {
    const userSettings = getSettingsForSource("userSettings") || {};
    updateSettingsForSource("userSettings", {
      ...userSettings,
      env: {
        ...userSettings.env,
        DISABLE_AUTOUPDATER: "1"
      }
    });
    logEvent("tengu_migrate_autoupdates_to_settings", {
      was_user_preference: true,
      already_had_env_var: !!userSettings.env?.DISABLE_AUTOUPDATER
    });
    process.env.DISABLE_AUTOUPDATER = "1";
    saveGlobalConfig((current) => {
      const {
        autoUpdates: _,
        autoUpdatesProtectedForNative: __,
        ...updatedConfig
      } = current;
      return updatedConfig;
    });
  } catch (error) {
    logError(new Error(`Failed to migrate auto-updates: ${error}`));
    logEvent("tengu_migrate_autoupdates_error", {
      has_error: true
    });
  }
}

// src/migrations/migrateBypassPermissionsAcceptedToSettings.ts
init_analytics();
init_config2();
init_log();
init_settings2();
function migrateBypassPermissionsAcceptedToSettings() {
  const globalConfig = getGlobalConfig();
  if (!globalConfig.bypassPermissionsModeAccepted) {
    return;
  }
  try {
    if (!hasSkipDangerousModePermissionPrompt()) {
      updateSettingsForSource("userSettings", {
        skipDangerousModePermissionPrompt: true
      });
    }
    logEvent("tengu_migrate_bypass_permissions_accepted", {});
    saveGlobalConfig((current) => {
      if (!("bypassPermissionsModeAccepted" in current))
        return current;
      const { bypassPermissionsModeAccepted: _, ...updatedConfig } = current;
      return updatedConfig;
    });
  } catch (error) {
    logError(new Error(`Failed to migrate bypass permissions accepted: ${error}`));
  }
}

// src/migrations/migrateEnableAllProjectMcpServersToSettings.ts
init_analytics();
init_config2();
init_log();
init_settings2();
function migrateEnableAllProjectMcpServersToSettings() {
  const projectConfig = getCurrentProjectConfig();
  const hasEnableAll = projectConfig.enableAllProjectMcpServers !== undefined;
  const hasEnabledServers = projectConfig.enabledMcpjsonServers && projectConfig.enabledMcpjsonServers.length > 0;
  const hasDisabledServers = projectConfig.disabledMcpjsonServers && projectConfig.disabledMcpjsonServers.length > 0;
  if (!hasEnableAll && !hasEnabledServers && !hasDisabledServers) {
    return;
  }
  try {
    const existingSettings = getSettingsForSource("localSettings") || {};
    const updates = {};
    const fieldsToRemove = [];
    if (hasEnableAll && existingSettings.enableAllProjectMcpServers === undefined) {
      updates.enableAllProjectMcpServers = projectConfig.enableAllProjectMcpServers;
      fieldsToRemove.push("enableAllProjectMcpServers");
    } else if (hasEnableAll) {
      fieldsToRemove.push("enableAllProjectMcpServers");
    }
    if (hasEnabledServers && projectConfig.enabledMcpjsonServers) {
      const existingEnabledServers = existingSettings.enabledMcpjsonServers || [];
      updates.enabledMcpjsonServers = [
        ...new Set([
          ...existingEnabledServers,
          ...projectConfig.enabledMcpjsonServers
        ])
      ];
      fieldsToRemove.push("enabledMcpjsonServers");
    }
    if (hasDisabledServers && projectConfig.disabledMcpjsonServers) {
      const existingDisabledServers = existingSettings.disabledMcpjsonServers || [];
      updates.disabledMcpjsonServers = [
        ...new Set([
          ...existingDisabledServers,
          ...projectConfig.disabledMcpjsonServers
        ])
      ];
      fieldsToRemove.push("disabledMcpjsonServers");
    }
    if (Object.keys(updates).length > 0) {
      updateSettingsForSource("localSettings", updates);
    }
    if (fieldsToRemove.includes("enableAllProjectMcpServers") || fieldsToRemove.includes("enabledMcpjsonServers") || fieldsToRemove.includes("disabledMcpjsonServers")) {
      saveCurrentProjectConfig((current) => {
        const {
          enableAllProjectMcpServers: _enableAll,
          enabledMcpjsonServers: _enabledServers,
          disabledMcpjsonServers: _disabledServers,
          ...configWithoutFields
        } = current;
        return configWithoutFields;
      });
    }
    logEvent("tengu_migrate_mcp_approval_fields_success", {
      migratedCount: fieldsToRemove.length
    });
  } catch (e) {
    logError(e);
    logEvent("tengu_migrate_mcp_approval_fields_error", {});
  }
}

// src/migrations/migrateFennecToOpus.ts
init_settings2();

// src/migrations/migrateLegacyOpusToCurrent.ts
init_analytics();
init_config2();
init_model();
init_providers();
init_settings2();
function migrateLegacyOpusToCurrent() {
  if (getAPIProvider() !== "firstParty") {
    return;
  }
  if (!isLegacyModelRemapEnabled()) {
    return;
  }
  const model = getSettingsForSource("userSettings")?.model;
  if (model !== "claude-opus-4-20250514" && model !== "claude-opus-4-1-20250805" && model !== "claude-opus-4-0" && model !== "claude-opus-4-1") {
    return;
  }
  updateSettingsForSource("userSettings", { model: "opus" });
  saveGlobalConfig((current) => ({
    ...current,
    legacyOpusMigrationTimestamp: Date.now()
  }));
  logEvent("tengu_legacy_opus_migration", {
    from_model: model
  });
}

// src/migrations/migrateOpusToOpus1m.ts
init_analytics();
init_model();
init_settings2();
function migrateOpusToOpus1m() {
  if (!isOpus1mMergeEnabled()) {
    return;
  }
  const model = getSettingsForSource("userSettings")?.model;
  if (model !== "opus") {
    return;
  }
  const migrated = "opus[1m]";
  const modelToSet = parseUserSpecifiedModel(migrated) === parseUserSpecifiedModel(getDefaultMainLoopModelSetting()) ? undefined : migrated;
  updateSettingsForSource("userSettings", { model: modelToSet });
  logEvent("tengu_opus_to_opus1m_migration", {});
}

// src/migrations/migrateReplBridgeEnabledToRemoteControlAtStartup.ts
init_config2();
function migrateReplBridgeEnabledToRemoteControlAtStartup() {
  saveGlobalConfig((prev) => {
    const oldValue = prev["replBridgeEnabled"];
    if (oldValue === undefined)
      return prev;
    if (prev.remoteControlAtStartup !== undefined)
      return prev;
    const next = { ...prev, remoteControlAtStartup: Boolean(oldValue) };
    delete next["replBridgeEnabled"];
    return next;
  });
}

// src/migrations/migrateSonnet1mToSonnet45.ts
init_state();
init_config2();
init_settings2();
function migrateSonnet1mToSonnet45() {
  const config = getGlobalConfig();
  if (config.sonnet1m45MigrationComplete) {
    return;
  }
  const model = getSettingsForSource("userSettings")?.model;
  if (model === "sonnet[1m]") {
    updateSettingsForSource("userSettings", {
      model: "sonnet-4-5-20250929[1m]"
    });
  }
  const override = getMainLoopModelOverride();
  if (override === "sonnet[1m]") {
    setMainLoopModelOverride("sonnet-4-5-20250929[1m]");
  }
  saveGlobalConfig((current) => ({
    ...current,
    sonnet1m45MigrationComplete: true
  }));
}

// src/migrations/migrateSonnet45ToSonnet46.ts
init_analytics();
init_auth();
init_config2();
init_providers();
init_settings2();
function migrateSonnet45ToSonnet46() {
  if (getAPIProvider() !== "firstParty") {
    return;
  }
  if (!isProSubscriber() && !isMaxSubscriber() && !isTeamPremiumSubscriber()) {
    return;
  }
  const model = getSettingsForSource("userSettings")?.model;
  if (model !== "claude-sonnet-4-5-20250929" && model !== "claude-sonnet-4-5-20250929[1m]" && model !== "sonnet-4-5-20250929" && model !== "sonnet-4-5-20250929[1m]") {
    return;
  }
  const has1m = model.endsWith("[1m]");
  updateSettingsForSource("userSettings", {
    model: has1m ? "sonnet[1m]" : "sonnet"
  });
  const config = getGlobalConfig();
  if (config.numStartups > 1) {
    saveGlobalConfig((current) => ({
      ...current,
      sonnet45To46MigrationTimestamp: Date.now()
    }));
  }
  logEvent("tengu_sonnet45_to_46_migration", {
    from_model: model,
    has_1m: has1m
  });
}

// src/migrations/resetAutoModeOptInForDefaultOffer.ts
init_analytics();
init_config2();
init_log();
init_permissionSetup();
init_settings2();

// src/migrations/resetProToOpusDefault.ts
init_analytics();
init_auth();
init_config2();
init_providers();
init_settings2();
function resetProToOpusDefault() {
  const config = getGlobalConfig();
  if (config.opusProMigrationComplete) {
    return;
  }
  const apiProvider = getAPIProvider();
  if (apiProvider !== "firstParty" || !isProSubscriber()) {
    saveGlobalConfig((current) => ({
      ...current,
      opusProMigrationComplete: true
    }));
    logEvent("tengu_reset_pro_to_opus_default", { skipped: true });
    return;
  }
  const settings = getSettings_DEPRECATED();
  if (settings?.model === undefined) {
    const opusProMigrationTimestamp = Date.now();
    saveGlobalConfig((current) => ({
      ...current,
      opusProMigrationComplete: true,
      opusProMigrationTimestamp
    }));
    logEvent("tengu_reset_pro_to_opus_default", {
      skipped: false,
      had_custom_model: false
    });
  } else {
    saveGlobalConfig((current) => ({
      ...current,
      opusProMigrationComplete: true
    }));
    logEvent("tengu_reset_pro_to_opus_default", {
      skipped: false,
      had_custom_model: true
    });
  }
}

// src/server/createDirectConnectSession.ts
init_errors();
init_slowOperations();

// src/server/types.ts
init_v4();
init_lazySchema();
var connectResponseSchema = lazySchema(() => exports_external.object({
  session_id: exports_external.string(),
  ws_url: exports_external.string(),
  work_dir: exports_external.string().optional()
}));

// src/main.tsx
init_manager();
init_promptSuggestion();
init_AppStateStore();
init_store();
init_ids();
init_betas();
init_bundledMode();
init_diagLogs();
init_pluginLoader();
init_releaseNotes();
init_sandbox_adapter();
init_api();
init_teleport();
init_thinking();
init_user();
init_worktree();
profileCheckpoint("main_tsx_entry");
startMdmRawRead();
startKeychainPrefetch();
var getTeammateUtils = () => (init_teammate(), __toCommonJS(exports_teammate));
var getTeammatePromptAddendum = () => (init_teammatePromptAddendum(), __toCommonJS(exports_teammatePromptAddendum));
var getTeammateModeSnapshot = () => (init_teammateModeSnapshot(), __toCommonJS(exports_teammateModeSnapshot));
var coordinatorModeModule = null;
profileCheckpoint("main_tsx_imports_loaded");
function logManagedSettings() {
  try {
    const policySettings = getSettingsForSource("policySettings");
    if (policySettings) {
      const allKeys = getManagedSettingsKeysForLogging(policySettings);
      logEvent("tengu_managed_settings_loaded", {
        keyCount: allKeys.length,
        keys: allKeys.join(",")
      });
    }
  } catch {}
}
function logSessionTelemetry() {
  const model = parseUserSpecifiedModel(getInitialMainLoopModel() ?? getDefaultMainLoopModel());
  logSkillsLoaded(getCwd(), getContextWindowForModel(model, getSdkBetas()));
  loadAllPluginsCacheOnly().then(({
    enabled,
    errors
  }) => {
    const managedNames = getManagedPluginNames();
    logPluginsEnabledForSession(enabled, managedNames, getPluginSeedDirs());
    logPluginLoadErrors(errors, managedNames);
  }).catch((err) => logError(err));
}
function getCertEnvVarTelemetry() {
  const result = {};
  if (process.env.NODE_EXTRA_CA_CERTS) {
    result.has_node_extra_ca_certs = true;
  }
  if (process.env.CLAUDE_CODE_CLIENT_CERT) {
    result.has_client_cert = true;
  }
  if (hasNodeOption("--use-system-ca")) {
    result.has_use_system_ca = true;
  }
  if (hasNodeOption("--use-openssl-ca")) {
    result.has_use_openssl_ca = true;
  }
  return result;
}
async function logStartupTelemetry() {
  if (isAnalyticsDisabled())
    return;
  const [isGit, worktreeCount, ghAuthStatus] = await Promise.all([getIsGit(), getWorktreeCount(), getGhAuthStatus()]);
  logEvent("tengu_startup_telemetry", {
    is_git: isGit,
    worktree_count: worktreeCount,
    gh_auth_status: ghAuthStatus,
    sandbox_enabled: SandboxManager.isSandboxingEnabled(),
    are_unsandboxed_commands_allowed: SandboxManager.areUnsandboxedCommandsAllowed(),
    is_auto_bash_allowed_if_sandbox_enabled: SandboxManager.isAutoAllowBashIfSandboxedEnabled(),
    auto_updater_disabled: isAutoUpdaterDisabled(),
    prefers_reduced_motion: getInitialSettings().prefersReducedMotion ?? false,
    ...getCertEnvVarTelemetry()
  });
}
var CURRENT_MIGRATION_VERSION = 11;
function runMigrations() {
  if (getGlobalConfig().migrationVersion !== CURRENT_MIGRATION_VERSION) {
    migrateAutoUpdatesToSettings();
    migrateBypassPermissionsAcceptedToSettings();
    migrateEnableAllProjectMcpServersToSettings();
    resetProToOpusDefault();
    migrateSonnet1mToSonnet45();
    migrateLegacyOpusToCurrent();
    migrateSonnet45ToSonnet46();
    migrateOpusToOpus1m();
    migrateReplBridgeEnabledToRemoteControlAtStartup();
    if (false) {}
    if (false) {}
    saveGlobalConfig((prev) => prev.migrationVersion === CURRENT_MIGRATION_VERSION ? prev : {
      ...prev,
      migrationVersion: CURRENT_MIGRATION_VERSION
    });
  }
  migrateChangelogFromConfig().catch(() => {});
}
function prefetchSystemContextIfSafe() {
  const isNonInteractiveSession = getIsNonInteractiveSession();
  if (isNonInteractiveSession) {
    logForDiagnosticsNoPII("info", "prefetch_system_context_non_interactive");
    getSystemContext();
    return;
  }
  const hasTrust = checkHasTrustDialogAccepted();
  if (hasTrust) {
    logForDiagnosticsNoPII("info", "prefetch_system_context_has_trust");
    getSystemContext();
  } else {
    logForDiagnosticsNoPII("info", "prefetch_system_context_skipped_no_trust");
  }
}
function startDeferredPrefetches() {
  if (isEnvTruthy(process.env.CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER) || isBareMode()) {
    return;
  }
  initUser();
  getUserContext();
  prefetchSystemContextIfSafe();
  getRelevantTips();
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) && !isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)) {
    prefetchAwsCredentialsAndBedRockInfoIfSafe();
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) && !isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)) {
    prefetchGcpCredentialsIfSafe();
  }
  countFilesRoundedRg(getCwd(), AbortSignal.timeout(3000), []);
  initializeAnalyticsGates();
  prefetchOfficialMcpUrls();
  refreshModelCapabilities();
  settingsChangeDetector.initialize();
  if (!isBareMode()) {
    skillChangeDetector.initialize();
  }
  if (false) {}
}
function loadSettingsFromFlag(settingsFile) {
  try {
    const trimmedSettings = settingsFile.trim();
    const looksLikeJson = trimmedSettings.startsWith("{") && trimmedSettings.endsWith("}");
    let settingsPath;
    if (looksLikeJson) {
      const parsedJson = safeParseJSON(trimmedSettings);
      if (!parsedJson) {
        process.stderr.write(source_default.red(`Error: Invalid JSON provided to --settings
`));
        process.exit(1);
      }
      settingsPath = generateTempFilePath("claude-settings", ".json", {
        contentHash: trimmedSettings
      });
      writeFileSync_DEPRECATED(settingsPath, trimmedSettings, "utf8");
    } else {
      const {
        resolvedPath: resolvedSettingsPath
      } = safeResolvePath(getFsImplementation(), settingsFile);
      try {
        readFileSync2(resolvedSettingsPath, "utf8");
      } catch (e) {
        if (isENOENT(e)) {
          process.stderr.write(source_default.red(`Error: Settings file not found: ${resolvedSettingsPath}
`));
          process.exit(1);
        }
        throw e;
      }
      settingsPath = resolvedSettingsPath;
    }
    setFlagSettingsPath(settingsPath);
    resetSettingsCache();
  } catch (error) {
    if (error instanceof Error) {
      logError(error);
    }
    process.stderr.write(source_default.red(`Error processing settings: ${errorMessage(error)}
`));
    process.exit(1);
  }
}
function loadSettingSourcesFromFlag(settingSourcesArg) {
  try {
    const sources = parseSettingSourcesFlag(settingSourcesArg);
    setAllowedSettingSources(sources);
    resetSettingsCache();
  } catch (error) {
    if (error instanceof Error) {
      logError(error);
    }
    process.stderr.write(source_default.red(`Error processing --setting-sources: ${errorMessage(error)}
`));
    process.exit(1);
  }
}
function eagerLoadSettings() {
  profileCheckpoint("eagerLoadSettings_start");
  const settingsFile = eagerParseCliFlag("--settings");
  if (settingsFile) {
    loadSettingsFromFlag(settingsFile);
  }
  const settingSourcesArg = eagerParseCliFlag("--setting-sources");
  if (settingSourcesArg !== undefined) {
    loadSettingSourcesFromFlag(settingSourcesArg);
  }
  profileCheckpoint("eagerLoadSettings_end");
}
function initializeEntrypoint(isNonInteractive) {
  if (process.env.CLAUDE_CODE_ENTRYPOINT) {
    return;
  }
  const cliArgs = process.argv.slice(2);
  const mcpIndex = cliArgs.indexOf("mcp");
  if (mcpIndex !== -1 && cliArgs[mcpIndex + 1] === "serve") {
    process.env.CLAUDE_CODE_ENTRYPOINT = "mcp";
    return;
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_ACTION)) {
    process.env.CLAUDE_CODE_ENTRYPOINT = "claude-code-github-action";
    return;
  }
  process.env.CLAUDE_CODE_ENTRYPOINT = isNonInteractive ? "sdk-cli" : "cli";
}
async function main() {
  profileCheckpoint("main_function_start");
  process.env.NoDefaultCurrentDirectoryInExePath = "1";
  initializeWarningHandler();
  process.on("exit", () => {
    resetCursor();
  });
  process.on("SIGINT", () => {
    if (process.argv.includes("-p") || process.argv.includes("--print")) {
      return;
    }
    process.exit(0);
  });
  profileCheckpoint("main_warning_handler_initialized");
  if (false) {}
  if (false) {}
  if (false) {}
  if (false) {}
  const cliArgs = process.argv.slice(2);
  const hasPrintFlag = cliArgs.includes("-p") || cliArgs.includes("--print");
  const hasInitOnlyFlag = cliArgs.includes("--init-only");
  const hasSdkUrl = cliArgs.some((arg) => arg.startsWith("--sdk-url"));
  const isNonInteractive = hasPrintFlag || hasInitOnlyFlag || hasSdkUrl || !process.stdout.isTTY;
  if (isNonInteractive) {
    stopCapturingEarlyInput();
  }
  const isInteractive = !isNonInteractive;
  setIsInteractive(isInteractive);
  initializeEntrypoint(isNonInteractive);
  const clientType = (() => {
    if (isEnvTruthy(process.env.GITHUB_ACTIONS))
      return "github-action";
    if (process.env.CLAUDE_CODE_ENTRYPOINT === "sdk-ts")
      return "sdk-typescript";
    if (process.env.CLAUDE_CODE_ENTRYPOINT === "sdk-py")
      return "sdk-python";
    if (process.env.CLAUDE_CODE_ENTRYPOINT === "sdk-cli")
      return "sdk-cli";
    if (process.env.CLAUDE_CODE_ENTRYPOINT === "claude-vscode")
      return "claude-vscode";
    if (process.env.CLAUDE_CODE_ENTRYPOINT === "local-agent")
      return "local-agent";
    if (process.env.CLAUDE_CODE_ENTRYPOINT === "claude-desktop")
      return "claude-desktop";
    const hasSessionIngressToken = process.env.CLAUDE_CODE_SESSION_ACCESS_TOKEN || process.env.CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR;
    if (process.env.CLAUDE_CODE_ENTRYPOINT === "remote" || hasSessionIngressToken) {
      return "remote";
    }
    return "cli";
  })();
  setClientType(clientType);
  const previewFormat = process.env.CLAUDE_CODE_QUESTION_PREVIEW_FORMAT;
  if (previewFormat === "markdown" || previewFormat === "html") {
    setQuestionPreviewFormat(previewFormat);
  } else if (!clientType.startsWith("sdk-") && clientType !== "claude-desktop" && clientType !== "local-agent" && clientType !== "remote") {
    setQuestionPreviewFormat("markdown");
  }
  if (process.env.CLAUDE_CODE_ENVIRONMENT_KIND === "bridge") {
    setSessionSource("remote-control");
  }
  profileCheckpoint("main_client_type_determined");
  eagerLoadSettings();
  profileCheckpoint("main_before_run");
  await run();
  profileCheckpoint("main_after_run");
}
async function getInputPrompt(prompt, inputFormat) {
  if (!process.stdin.isTTY && !process.argv.includes("mcp")) {
    if (inputFormat === "stream-json") {
      return process.stdin;
    }
    process.stdin.setEncoding("utf8");
    let data = "";
    const onData = (chunk) => {
      data += chunk;
    };
    process.stdin.on("data", onData);
    const timedOut = await peekForStdinData(process.stdin, 3000);
    process.stdin.off("data", onData);
    if (timedOut) {
      process.stderr.write(`Warning: no stdin data received in 3s, proceeding without it. If piping from a slow command, redirect stdin explicitly: < /dev/null to skip, or wait longer.
`);
    }
    return [prompt, data].filter(Boolean).join(`
`);
  }
  return prompt;
}
async function run() {
  profileCheckpoint("run_function_start");
  function createSortedHelpConfig() {
    const getOptionSortKey = (opt) => opt.long?.replace(/^--/, "") ?? opt.short?.replace(/^-/, "") ?? "";
    return Object.assign({
      sortSubcommands: true,
      sortOptions: true
    }, {
      compareOptions: (a, b) => getOptionSortKey(a).localeCompare(getOptionSortKey(b))
    });
  }
  const program2 = new Command().configureHelp(createSortedHelpConfig()).enablePositionalOptions();
  profileCheckpoint("run_commander_initialized");
  program2.hook("preAction", async (thisCommand) => {
    profileCheckpoint("preAction_start");
    await Promise.all([ensureMdmSettingsLoaded(), ensureKeychainPrefetchCompleted()]);
    profileCheckpoint("preAction_after_mdm");
    await init();
    profileCheckpoint("preAction_after_init");
    if (!isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_TERMINAL_TITLE)) {
      process.title = "claude";
    }
    const {
      initSinks
    } = await import("./chunk-8fghpzn4.js");
    initSinks();
    profileCheckpoint("preAction_after_sinks");
    const pluginDir = thisCommand.getOptionValue("pluginDir");
    if (Array.isArray(pluginDir) && pluginDir.length > 0 && pluginDir.every((p) => typeof p === "string")) {
      setInlinePlugins(pluginDir);
      clearPluginCache("preAction: --plugin-dir inline plugins");
    }
    runMigrations();
    profileCheckpoint("preAction_after_migrations");
    loadRemoteManagedSettings();
    loadPolicyLimits();
    profileCheckpoint("preAction_after_remote_settings");
    if (false) {}
    profileCheckpoint("preAction_after_settings_sync");
  });
  program2.name("claude").description(`Panda Code - starts an interactive session by default, use -p/--print for non-interactive output \xB7 \u9ED8\u8BA4\u542F\u52A8\u4EA4\u4E92\u4F1A\u8BDD\uFF0C\u4F7F\u7528 -p \u8FDB\u5165\u975E\u4EA4\u4E92\u6A21\u5F0F`).argument("[prompt]", "Your prompt", String).helpOption("-h, --help", "Display help for command").option("-d, --debug [filter]", 'Enable debug mode with optional category filtering (e.g., "api,hooks" or "!1p,!file")', (_value) => {
    return true;
  }).addOption(new Option("--debug-to-stderr", "Enable debug mode (to stderr)").argParser(Boolean).hideHelp()).option("--debug-file <path>", "Write debug logs to a specific file path (implicitly enables debug mode)", () => true).option("--verbose", "Override verbose mode setting from config", () => true).option("-p, --print", "Print response and exit (useful for pipes). Note: The workspace trust dialog is skipped when Claude is run with the -p mode. Only use this flag in directories you trust.", () => true).option("--bare", "Minimal mode: skip hooks, LSP, plugin sync, attribution, auto-memory, background prefetches, keychain reads, and CLAUDE.md auto-discovery. Sets CLAUDE_CODE_SIMPLE=1. Anthropic auth is strictly ANTHROPIC_API_KEY or apiKeyHelper via --settings (OAuth and keychain are never read). 3P providers (Bedrock/Vertex/Foundry) use their own credentials. Skills still resolve via /skill-name. Explicitly provide context via: --system-prompt[-file], --append-system-prompt[-file], --add-dir (CLAUDE.md dirs), --mcp-config, --settings, --agents, --plugin-dir.", () => true).addOption(new Option("--init", "Run Setup hooks with init trigger, then continue").hideHelp()).addOption(new Option("--init-only", "Run Setup and SessionStart:startup hooks, then exit").hideHelp()).addOption(new Option("--maintenance", "Run Setup hooks with maintenance trigger, then continue").hideHelp()).addOption(new Option("--output-format <format>", 'Output format (only works with --print): "text" (default), "json" (single result), or "stream-json" (realtime streaming)').choices(["text", "json", "stream-json"])).addOption(new Option("--json-schema <schema>", 'JSON Schema for structured output validation. Example: {"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}').argParser(String)).option("--include-hook-events", "Include all hook lifecycle events in the output stream (only works with --output-format=stream-json)", () => true).option("--include-partial-messages", "Include partial message chunks as they arrive (only works with --print and --output-format=stream-json)", () => true).addOption(new Option("--input-format <format>", 'Input format (only works with --print): "text" (default), or "stream-json" (realtime streaming input)').choices(["text", "stream-json"])).option("--mcp-debug", "[DEPRECATED. Use --debug instead] Enable MCP debug mode (shows MCP server errors)", () => true).option("--dangerously-skip-permissions", "Bypass all permission checks. Recommended only for sandboxes with no internet access.", () => true).option("--allow-dangerously-skip-permissions", "Enable bypassing all permission checks as an option, without it being enabled by default. Recommended only for sandboxes with no internet access.", () => true).addOption(new Option("--thinking <mode>", "Thinking mode: enabled (equivalent to adaptive), disabled").choices(["enabled", "adaptive", "disabled"]).hideHelp()).addOption(new Option("--max-thinking-tokens <tokens>", "[DEPRECATED. Use --thinking instead for newer models] Maximum number of thinking tokens (only works with --print)").argParser(Number).hideHelp()).addOption(new Option("--max-turns <turns>", "Maximum number of agentic turns in non-interactive mode. This will early exit the conversation after the specified number of turns. (only works with --print)").argParser(Number).hideHelp()).addOption(new Option("--max-budget-usd <amount>", "Maximum dollar amount to spend on API calls (only works with --print)").argParser((value) => {
    const amount = Number(value);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("--max-budget-usd must be a positive number greater than 0");
    }
    return amount;
  })).addOption(new Option("--task-budget <tokens>", "API-side task budget in tokens (output_config.task_budget)").argParser((value) => {
    const tokens = Number(value);
    if (isNaN(tokens) || tokens <= 0 || !Number.isInteger(tokens)) {
      throw new Error("--task-budget must be a positive integer");
    }
    return tokens;
  }).hideHelp()).option("--replay-user-messages", "Re-emit user messages from stdin back on stdout for acknowledgment (only works with --input-format=stream-json and --output-format=stream-json)", () => true).addOption(new Option("--enable-auth-status", "Enable auth status messages in SDK mode").default(false).hideHelp()).option("--allowedTools, --allowed-tools <tools...>", 'Comma or space-separated list of tool names to allow (e.g. "Bash(git:*) Edit")').option("--tools <tools...>", 'Specify the list of available tools from the built-in set. Use "" to disable all tools, "default" to use all tools, or specify tool names (e.g. "Bash,Edit,Read").').option("--disallowedTools, --disallowed-tools <tools...>", 'Comma or space-separated list of tool names to deny (e.g. "Bash(git:*) Edit")').option("--mcp-config <configs...>", "Load MCP servers from JSON files or strings (space-separated)").addOption(new Option("--permission-prompt-tool <tool>", "MCP tool to use for permission prompts (only works with --print)").argParser(String).hideHelp()).addOption(new Option("--system-prompt <prompt>", "System prompt to use for the session").argParser(String)).addOption(new Option("--system-prompt-file <file>", "Read system prompt from a file").argParser(String).hideHelp()).addOption(new Option("--append-system-prompt <prompt>", "Append a system prompt to the default system prompt").argParser(String)).addOption(new Option("--append-system-prompt-file <file>", "Read system prompt from a file and append to the default system prompt").argParser(String).hideHelp()).addOption(new Option("--permission-mode <mode>", "Permission mode to use for the session").argParser(String).choices(PERMISSION_MODES)).option("-c, --continue", "Continue the most recent conversation in the current directory", () => true).option("-r, --resume [value]", "Resume a conversation by session ID, or open interactive picker with optional search term", (value) => value || true).option("--fork-session", "When resuming, create a new session ID instead of reusing the original (use with --resume or --continue)", () => true).addOption(new Option("--prefill <text>", "Pre-fill the prompt input with text without submitting it").hideHelp()).addOption(new Option("--deep-link-origin", "Signal that this session was launched from a deep link").hideHelp()).addOption(new Option("--deep-link-repo <slug>", "Repo slug the deep link ?repo= parameter resolved to the current cwd").hideHelp()).addOption(new Option("--deep-link-last-fetch <ms>", "FETCH_HEAD mtime in epoch ms, precomputed by the deep link trampoline").argParser((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }).hideHelp()).option("--from-pr [value]", "Resume a session linked to a PR by PR number/URL, or open interactive picker with optional search term", (value) => value || true).option("--no-session-persistence", "Disable session persistence - sessions will not be saved to disk and cannot be resumed (only works with --print)").addOption(new Option("--resume-session-at <message id>", "When resuming, only messages up to and including the assistant message with <message.id> (use with --resume in print mode)").argParser(String).hideHelp()).addOption(new Option("--rewind-files <user-message-id>", "Restore files to state at the specified user message and exit (requires --resume)").hideHelp()).option("--model <model>", `Model for the current session. Provide an alias for the latest model (e.g. 'sonnet' or 'opus') or a model's full name (e.g. 'claude-sonnet-4-6').`).addOption(new Option("--effort <level>", `Effort level for the current session (low, medium, high, max)`).argParser((rawValue) => {
    const value = rawValue.toLowerCase();
    const allowed = ["low", "medium", "high", "max"];
    if (!allowed.includes(value)) {
      throw new InvalidArgumentError(`It must be one of: ${allowed.join(", ")}`);
    }
    return value;
  })).option("--agent <agent>", `Agent for the current session. Overrides the 'agent' setting.`).option("--betas <betas...>", "Beta headers to include in API requests (API key users only)").option("--fallback-model <model>", "Enable automatic fallback to specified model when default model is overloaded (only works with --print)").addOption(new Option("--workload <tag>", "Workload tag for billing-header attribution (cc_workload). Process-scoped; set by SDK daemon callers that spawn subprocesses for cron work. (only works with --print)").hideHelp()).option("--settings <file-or-json>", "Path to a settings JSON file or a JSON string to load additional settings from").option("--add-dir <directories...>", "Additional directories to allow tool access to").option("--ide", "Automatically connect to IDE on startup if exactly one valid IDE is available", () => true).option("--strict-mcp-config", "Only use MCP servers from --mcp-config, ignoring all other MCP configurations", () => true).option("--session-id <uuid>", "Use a specific session ID for the conversation (must be a valid UUID)").option("-n, --name <name>", "Set a display name for this session (shown in /resume and terminal title)").option("--agents <json>", `JSON object defining custom agents (e.g. '{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}')`).option("--setting-sources <sources>", "Comma-separated list of setting sources to load (user, project, local).").option("--plugin-dir <path>", "Load plugins from a directory for this session only (repeatable: --plugin-dir A --plugin-dir B)", (val, prev) => [...prev, val], []).option("--disable-slash-commands", "Disable all skills", () => true).option("--chrome", "Enable Claude in Chrome integration").option("--no-chrome", "Disable Claude in Chrome integration").option("--file <specs...>", "File resources to download at startup. Format: file_id:relative_path (e.g., --file file_abc:doc.txt file_def:img.png)").action(async (prompt, options) => {
    profileCheckpoint("action_handler_start");
    if (options.bare) {
      process.env.CLAUDE_CODE_SIMPLE = "1";
    }
    if (prompt === "code") {
      logEvent("tengu_code_prompt_ignored", {});
      console.warn(source_default.yellow("Tip: You can launch Panda Code with just `claude`"));
      prompt = undefined;
    }
    if (prompt && typeof prompt === "string" && !/\s/.test(prompt) && prompt.length > 0) {
      logEvent("tengu_single_word_prompt", {
        length: prompt.length
      });
    }
    let kairosEnabled = false;
    let assistantTeamContext;
    if (false) {}
    if (false) {}
    const {
      debug = false,
      debugToStderr = false,
      dangerouslySkipPermissions,
      allowDangerouslySkipPermissions = false,
      tools: baseTools = [],
      allowedTools = [],
      disallowedTools = [],
      mcpConfig = [],
      permissionMode: permissionModeCli,
      addDir = [],
      fallbackModel,
      betas = [],
      ide = false,
      sessionId,
      includeHookEvents,
      includePartialMessages
    } = options;
    if (options.prefill) {
      seedEarlyInput(options.prefill);
    }
    let fileDownloadPromise;
    const agentsJson = options.agents;
    const agentCli = options.agent;
    if (false) {}
    let outputFormat = options.outputFormat;
    let inputFormat = options.inputFormat;
    let verbose = options.verbose ?? getGlobalConfig().verbose;
    let print = options.print;
    const init2 = options.init ?? false;
    const initOnly = options.initOnly ?? false;
    const maintenance = options.maintenance ?? false;
    const disableSlashCommands = options.disableSlashCommands || false;
    const tasksOption = false;
    const taskListId = tasksOption ? typeof tasksOption === "string" ? tasksOption : DEFAULT_TASKS_MODE_TASK_LIST_ID : undefined;
    if (false) {}
    const worktreeOption = isWorktreeModeEnabled() ? options.worktree : undefined;
    let worktreeName = typeof worktreeOption === "string" ? worktreeOption : undefined;
    const worktreeEnabled = worktreeOption !== undefined;
    let worktreePRNumber;
    if (worktreeName) {
      const prNum = parsePRReference(worktreeName);
      if (prNum !== null) {
        worktreePRNumber = prNum;
        worktreeName = undefined;
      }
    }
    const tmuxEnabled = isWorktreeModeEnabled() && options.tmux === true;
    if (tmuxEnabled) {
      if (!worktreeEnabled) {
        process.stderr.write(source_default.red(`Error: --tmux requires --worktree
`));
        process.exit(1);
      }
      if (getPlatform() === "windows") {
        process.stderr.write(source_default.red(`Error: --tmux is not supported on Windows
`));
        process.exit(1);
      }
      if (!await isTmuxAvailable()) {
        process.stderr.write(source_default.red(`Error: tmux is not installed.
${getTmuxInstallInstructions()}
`));
        process.exit(1);
      }
    }
    let storedTeammateOpts;
    if (isAgentSwarmsEnabled()) {
      const teammateOpts = extractTeammateOptions(options);
      storedTeammateOpts = teammateOpts;
      const hasAnyTeammateOpt = teammateOpts.agentId || teammateOpts.agentName || teammateOpts.teamName;
      const hasAllRequiredTeammateOpts = teammateOpts.agentId && teammateOpts.agentName && teammateOpts.teamName;
      if (hasAnyTeammateOpt && !hasAllRequiredTeammateOpts) {
        process.stderr.write(source_default.red(`Error: --agent-id, --agent-name, and --team-name must all be provided together
`));
        process.exit(1);
      }
      if (teammateOpts.agentId && teammateOpts.agentName && teammateOpts.teamName) {
        getTeammateUtils().setDynamicTeamContext?.({
          agentId: teammateOpts.agentId,
          agentName: teammateOpts.agentName,
          teamName: teammateOpts.teamName,
          color: teammateOpts.agentColor,
          planModeRequired: teammateOpts.planModeRequired ?? false,
          parentSessionId: teammateOpts.parentSessionId
        });
      }
      if (teammateOpts.teammateMode) {
        getTeammateModeSnapshot().setCliTeammateModeOverride?.(teammateOpts.teammateMode);
      }
    }
    const sdkUrl = options.sdkUrl ?? undefined;
    const effectiveIncludePartialMessages = includePartialMessages || isEnvTruthy(process.env.CLAUDE_CODE_INCLUDE_PARTIAL_MESSAGES);
    if (includeHookEvents || isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
      setAllHookEventsEnabled(true);
    }
    if (sdkUrl) {
      if (!inputFormat) {
        inputFormat = "stream-json";
      }
      if (!outputFormat) {
        outputFormat = "stream-json";
      }
      if (options.verbose === undefined) {
        verbose = true;
      }
      if (!options.print) {
        print = true;
      }
    }
    const teleport = options.teleport ?? null;
    const remoteOption = options.remote;
    const remote = remoteOption === true ? "" : remoteOption ?? null;
    const remoteControlOption = options.remoteControl ?? options.rc;
    let remoteControl = false;
    const remoteControlName = typeof remoteControlOption === "string" && remoteControlOption.length > 0 ? remoteControlOption : undefined;
    if (sessionId) {
      if ((options.continue || options.resume) && !options.forkSession) {
        process.stderr.write(source_default.red(`Error: --session-id can only be used with --continue or --resume if --fork-session is also specified.
`));
        process.exit(1);
      }
      if (!sdkUrl) {
        const validatedSessionId = validateUuid(sessionId);
        if (!validatedSessionId) {
          process.stderr.write(source_default.red(`Error: Invalid session ID. Must be a valid UUID.
`));
          process.exit(1);
        }
        if (sessionIdExists(validatedSessionId)) {
          process.stderr.write(source_default.red(`Error: Session ID ${validatedSessionId} is already in use.
`));
          process.exit(1);
        }
      }
    }
    const fileSpecs = options.file;
    if (fileSpecs && fileSpecs.length > 0) {
      const sessionToken = getSessionIngressAuthToken();
      if (!sessionToken) {
        process.stderr.write(source_default.red(`Error: Session token required for file downloads. CLAUDE_CODE_SESSION_ACCESS_TOKEN must be set.
`));
        process.exit(1);
      }
      const fileSessionId = process.env.CLAUDE_CODE_REMOTE_SESSION_ID || getSessionId();
      const files = parseFileSpecs(fileSpecs);
      if (files.length > 0) {
        const config = {
          baseUrl: process.env.ANTHROPIC_BASE_URL || getOauthConfig().BASE_API_URL,
          oauthToken: sessionToken,
          sessionId: fileSessionId
        };
        fileDownloadPromise = downloadSessionFiles(files, config);
      }
    }
    const isNonInteractiveSession = getIsNonInteractiveSession();
    if (fallbackModel && options.model && fallbackModel === options.model) {
      process.stderr.write(source_default.red(`Error: Fallback model cannot be the same as the main model. Please specify a different model for --fallback-model.
`));
      process.exit(1);
    }
    let systemPrompt = options.systemPrompt;
    if (options.systemPromptFile) {
      if (options.systemPrompt) {
        process.stderr.write(source_default.red(`Error: Cannot use both --system-prompt and --system-prompt-file. Please use only one.
`));
        process.exit(1);
      }
      try {
        const filePath = resolve(options.systemPromptFile);
        systemPrompt = readFileSync2(filePath, "utf8");
      } catch (error) {
        const code = getErrnoCode(error);
        if (code === "ENOENT") {
          process.stderr.write(source_default.red(`Error: System prompt file not found: ${resolve(options.systemPromptFile)}
`));
          process.exit(1);
        }
        process.stderr.write(source_default.red(`Error reading system prompt file: ${errorMessage(error)}
`));
        process.exit(1);
      }
    }
    let appendSystemPrompt = options.appendSystemPrompt;
    if (options.appendSystemPromptFile) {
      if (options.appendSystemPrompt) {
        process.stderr.write(source_default.red(`Error: Cannot use both --append-system-prompt and --append-system-prompt-file. Please use only one.
`));
        process.exit(1);
      }
      try {
        const filePath = resolve(options.appendSystemPromptFile);
        appendSystemPrompt = readFileSync2(filePath, "utf8");
      } catch (error) {
        const code = getErrnoCode(error);
        if (code === "ENOENT") {
          process.stderr.write(source_default.red(`Error: Append system prompt file not found: ${resolve(options.appendSystemPromptFile)}
`));
          process.exit(1);
        }
        process.stderr.write(source_default.red(`Error reading append system prompt file: ${errorMessage(error)}
`));
        process.exit(1);
      }
    }
    if (isAgentSwarmsEnabled() && storedTeammateOpts?.agentId && storedTeammateOpts?.agentName && storedTeammateOpts?.teamName) {
      const addendum = getTeammatePromptAddendum().TEAMMATE_SYSTEM_PROMPT_ADDENDUM;
      appendSystemPrompt = appendSystemPrompt ? `${appendSystemPrompt}

${addendum}` : addendum;
    }
    const {
      mode: permissionMode,
      notification: permissionModeNotification
    } = initialPermissionModeFromCLI({
      permissionModeCli,
      dangerouslySkipPermissions
    });
    setSessionBypassPermissionsMode(permissionMode === "bypassPermissions");
    if (false) {}
    let dynamicMcpConfig = {};
    if (mcpConfig && mcpConfig.length > 0) {
      const processedConfigs = mcpConfig.map((config) => config.trim()).filter((config) => config.length > 0);
      let allConfigs = {};
      const allErrors = [];
      for (const configItem of processedConfigs) {
        let configs = null;
        let errors = [];
        const parsedJson = safeParseJSON(configItem);
        if (parsedJson) {
          const result = parseMcpConfig({
            configObject: parsedJson,
            filePath: "command line",
            expandVars: true,
            scope: "dynamic"
          });
          if (result.config) {
            configs = result.config.mcpServers;
          } else {
            errors = result.errors;
          }
        } else {
          const configPath = resolve(configItem);
          const result = parseMcpConfigFromFilePath({
            filePath: configPath,
            expandVars: true,
            scope: "dynamic"
          });
          if (result.config) {
            configs = result.config.mcpServers;
          } else {
            errors = result.errors;
          }
        }
        if (errors.length > 0) {
          allErrors.push(...errors);
        } else if (configs) {
          allConfigs = {
            ...allConfigs,
            ...configs
          };
        }
      }
      if (allErrors.length > 0) {
        const formattedErrors = allErrors.map((err) => `${err.path ? err.path + ": " : ""}${err.message}`).join(`
`);
        logForDebugging(`--mcp-config validation failed (${allErrors.length} errors): ${formattedErrors}`, {
          level: "error"
        });
        process.stderr.write(`Error: Invalid MCP configuration:
${formattedErrors}
`);
        process.exit(1);
      }
      if (Object.keys(allConfigs).length > 0) {
        const nonSdkConfigNames = Object.entries(allConfigs).filter(([, config]) => config.type !== "sdk").map(([name]) => name);
        let reservedNameError = null;
        if (nonSdkConfigNames.some(isClaudeInChromeMCPServer)) {
          reservedNameError = `Invalid MCP configuration: "${CLAUDE_IN_CHROME_MCP_SERVER_NAME}" is a reserved MCP name.`;
        } else if (false) {}
        if (reservedNameError) {
          process.stderr.write(`Error: ${reservedNameError}
`);
          process.exit(1);
        }
        const scopedConfigs = mapValues_default(allConfigs, (config) => ({
          ...config,
          scope: "dynamic"
        }));
        const {
          allowed,
          blocked
        } = filterMcpServersByPolicy(scopedConfigs);
        if (blocked.length > 0) {
          process.stderr.write(`Warning: MCP ${plural(blocked.length, "server")} blocked by enterprise policy: ${blocked.join(", ")}
`);
        }
        dynamicMcpConfig = {
          ...dynamicMcpConfig,
          ...allowed
        };
      }
    }
    const chromeOpts = options;
    setChromeFlagOverride(chromeOpts.chrome);
    const enableClaudeInChrome = shouldEnableClaudeInChrome(chromeOpts.chrome) && isClaudeAISubscriber();
    const autoEnableClaudeInChrome = !enableClaudeInChrome && shouldAutoEnableClaudeInChrome();
    if (enableClaudeInChrome) {
      const platform = getPlatform();
      try {
        logEvent("tengu_claude_in_chrome_setup", {
          platform
        });
        const {
          mcpConfig: chromeMcpConfig,
          allowedTools: chromeMcpTools,
          systemPrompt: chromeSystemPrompt
        } = setupClaudeInChrome();
        dynamicMcpConfig = {
          ...dynamicMcpConfig,
          ...chromeMcpConfig
        };
        allowedTools.push(...chromeMcpTools);
        if (chromeSystemPrompt) {
          appendSystemPrompt = appendSystemPrompt ? `${chromeSystemPrompt}

${appendSystemPrompt}` : chromeSystemPrompt;
        }
      } catch (error) {
        logEvent("tengu_claude_in_chrome_setup_failed", {
          platform
        });
        logForDebugging(`[Claude in Chrome] Error: ${error}`);
        logError(error);
        console.error(`Error: Failed to run with Claude in Chrome.`);
        process.exit(1);
      }
    } else if (autoEnableClaudeInChrome) {
      try {
        const {
          mcpConfig: chromeMcpConfig
        } = setupClaudeInChrome();
        dynamicMcpConfig = {
          ...dynamicMcpConfig,
          ...chromeMcpConfig
        };
        const hint = CLAUDE_IN_CHROME_SKILL_HINT;
        appendSystemPrompt = appendSystemPrompt ? `${appendSystemPrompt}

${hint}` : hint;
      } catch (error) {
        logForDebugging(`[Claude in Chrome] Error (auto-enable): ${error}`);
      }
    }
    const strictMcpConfig = options.strictMcpConfig || false;
    if (doesEnterpriseMcpConfigExist()) {
      if (strictMcpConfig) {
        process.stderr.write(source_default.red("You cannot use --strict-mcp-config when an enterprise MCP config is present"));
        process.exit(1);
      }
      if (dynamicMcpConfig && !areMcpConfigsAllowedWithEnterpriseMcpConfig(dynamicMcpConfig)) {
        process.stderr.write(source_default.red("You cannot dynamically configure MCP servers when an enterprise MCP config is present"));
        process.exit(1);
      }
    }
    if (false) {}
    setAdditionalDirectoriesForClaudeMd(addDir);
    let devChannels;
    if (false) {}
    if (false) {}
    const initResult = await initializeToolPermissionContext({
      allowedToolsCli: allowedTools,
      disallowedToolsCli: disallowedTools,
      baseToolsCli: baseTools,
      permissionMode,
      allowDangerouslySkipPermissions,
      addDirs: addDir
    });
    let toolPermissionContext = initResult.toolPermissionContext;
    const {
      warnings,
      dangerousPermissions,
      overlyBroadBashPermissions
    } = initResult;
    if (false) {}
    if (false) {}
    warnings.forEach((warning) => {
      console.error(warning);
    });
    assertMinVersion();
    const claudeaiConfigPromise = isNonInteractiveSession && !strictMcpConfig && !doesEnterpriseMcpConfigExist() && !isBareMode() ? fetchClaudeAIMcpConfigsIfEligible().then((configs) => {
      const {
        allowed,
        blocked
      } = filterMcpServersByPolicy(configs);
      if (blocked.length > 0) {
        process.stderr.write(`Warning: claude.ai MCP ${plural(blocked.length, "server")} blocked by enterprise policy: ${blocked.join(", ")}
`);
      }
      return allowed;
    }) : Promise.resolve({});
    logForDebugging("[STARTUP] Loading MCP configs...");
    const mcpConfigStart = Date.now();
    let mcpConfigResolvedMs;
    const mcpConfigPromise = (strictMcpConfig || isBareMode() ? Promise.resolve({
      servers: {}
    }) : getClaudeCodeMcpConfigs(dynamicMcpConfig)).then((result) => {
      mcpConfigResolvedMs = Date.now() - mcpConfigStart;
      return result;
    });
    if (inputFormat && inputFormat !== "text" && inputFormat !== "stream-json") {
      console.error(`Error: Invalid input format "${inputFormat}".`);
      process.exit(1);
    }
    if (inputFormat === "stream-json" && outputFormat !== "stream-json") {
      console.error(`Error: --input-format=stream-json requires output-format=stream-json.`);
      process.exit(1);
    }
    if (sdkUrl) {
      if (inputFormat !== "stream-json" || outputFormat !== "stream-json") {
        console.error(`Error: --sdk-url requires both --input-format=stream-json and --output-format=stream-json.`);
        process.exit(1);
      }
    }
    if (options.replayUserMessages) {
      if (inputFormat !== "stream-json" || outputFormat !== "stream-json") {
        console.error(`Error: --replay-user-messages requires both --input-format=stream-json and --output-format=stream-json.`);
        process.exit(1);
      }
    }
    if (effectiveIncludePartialMessages) {
      if (!isNonInteractiveSession || outputFormat !== "stream-json") {
        writeToStderr(`Error: --include-partial-messages requires --print and --output-format=stream-json.`);
        process.exit(1);
      }
    }
    if (options.sessionPersistence === false && !isNonInteractiveSession) {
      writeToStderr(`Error: --no-session-persistence can only be used with --print mode.`);
      process.exit(1);
    }
    const effectivePrompt = prompt || "";
    let inputPrompt = await getInputPrompt(effectivePrompt, inputFormat ?? "text");
    profileCheckpoint("action_after_input_prompt");
    maybeActivateProactive(options);
    let tools = getTools(toolPermissionContext);
    if (false) {}
    profileCheckpoint("action_tools_loaded");
    let jsonSchema;
    if (isSyntheticOutputToolEnabled({
      isNonInteractiveSession
    }) && options.jsonSchema) {
      jsonSchema = jsonParse(options.jsonSchema);
    }
    if (jsonSchema) {
      const syntheticOutputResult = createSyntheticOutputTool(jsonSchema);
      if ("tool" in syntheticOutputResult) {
        tools = [...tools, syntheticOutputResult.tool];
        logEvent("tengu_structured_output_enabled", {
          schema_property_count: Object.keys(jsonSchema.properties || {}).length,
          has_required_fields: Boolean(jsonSchema.required)
        });
      } else {
        logEvent("tengu_structured_output_failure", {
          error: "Invalid JSON schema"
        });
      }
    }
    profileCheckpoint("action_before_setup");
    logForDebugging("[STARTUP] Running setup()...");
    const setupStart = Date.now();
    const {
      setup
    } = await import("./chunk-034kr93t.js");
    const messagingSocketPath = undefined;
    const preSetupCwd = getCwd();
    if (process.env.CLAUDE_CODE_ENTRYPOINT !== "local-agent") {
      initBuiltinPlugins();
      initBundledSkills();
    }
    const setupPromise = setup(preSetupCwd, permissionMode, allowDangerouslySkipPermissions, worktreeEnabled, worktreeName, tmuxEnabled, sessionId ? validateUuid(sessionId) : undefined, worktreePRNumber, messagingSocketPath);
    const commandsPromise = worktreeEnabled ? null : getCommands(preSetupCwd);
    const agentDefsPromise = worktreeEnabled ? null : getAgentDefinitionsWithOverrides(preSetupCwd);
    commandsPromise?.catch(() => {});
    agentDefsPromise?.catch(() => {});
    await setupPromise;
    logForDebugging(`[STARTUP] setup() completed in ${Date.now() - setupStart}ms`);
    profileCheckpoint("action_after_setup");
    let effectiveReplayUserMessages = !!options.replayUserMessages;
    if (false) {}
    if (getIsNonInteractiveSession()) {
      applyConfigEnvironmentVariables();
      getSystemContext();
      getUserContext();
      ensureModelStringsInitialized();
    }
    const sessionNameArg = options.name?.trim();
    if (sessionNameArg) {
      cacheSessionTitle(sessionNameArg);
    }
    const explicitModel = options.model || process.env.ANTHROPIC_MODEL;
    if (false) {}
    const userSpecifiedModel = options.model === "default" ? getDefaultMainLoopModel() : options.model;
    const userSpecifiedFallbackModel = fallbackModel === "default" ? getDefaultMainLoopModel() : fallbackModel;
    const currentCwd = worktreeEnabled ? getCwd() : preSetupCwd;
    logForDebugging("[STARTUP] Loading commands and agents...");
    const commandsStart = Date.now();
    const [commands, agentDefinitionsResult] = await Promise.all([commandsPromise ?? getCommands(currentCwd), agentDefsPromise ?? getAgentDefinitionsWithOverrides(currentCwd)]);
    logForDebugging(`[STARTUP] Commands and agents loaded in ${Date.now() - commandsStart}ms`);
    profileCheckpoint("action_commands_loaded");
    let cliAgents = [];
    if (agentsJson) {
      try {
        const parsedAgents = safeParseJSON(agentsJson);
        if (parsedAgents) {
          cliAgents = parseAgentsFromJson(parsedAgents, "flagSettings");
        }
      } catch (error) {
        logError(error);
      }
    }
    const allAgents = [...agentDefinitionsResult.allAgents, ...cliAgents];
    const agentDefinitions = {
      ...agentDefinitionsResult,
      allAgents,
      activeAgents: getActiveAgentsFromList(allAgents)
    };
    const agentSetting = agentCli ?? getInitialSettings().agent;
    let mainThreadAgentDefinition;
    if (agentSetting) {
      mainThreadAgentDefinition = agentDefinitions.activeAgents.find((agent) => agent.agentType === agentSetting);
      if (!mainThreadAgentDefinition) {
        logForDebugging(`Warning: agent "${agentSetting}" not found. Available agents: ${agentDefinitions.activeAgents.map((a) => a.agentType).join(", ")}. Using default behavior.`);
      }
    }
    setMainThreadAgentType(mainThreadAgentDefinition?.agentType);
    if (mainThreadAgentDefinition) {
      logEvent("tengu_agent_flag", {
        agentType: isBuiltInAgent(mainThreadAgentDefinition) ? mainThreadAgentDefinition.agentType : "custom",
        ...agentCli && {
          source: "cli"
        }
      });
    }
    if (mainThreadAgentDefinition?.agentType) {
      saveAgentSetting(mainThreadAgentDefinition.agentType);
    }
    if (isNonInteractiveSession && mainThreadAgentDefinition && !systemPrompt && !isBuiltInAgent(mainThreadAgentDefinition)) {
      const agentSystemPrompt = mainThreadAgentDefinition.getSystemPrompt();
      if (agentSystemPrompt) {
        systemPrompt = agentSystemPrompt;
      }
    }
    if (mainThreadAgentDefinition?.initialPrompt) {
      if (typeof inputPrompt === "string") {
        inputPrompt = inputPrompt ? `${mainThreadAgentDefinition.initialPrompt}

${inputPrompt}` : mainThreadAgentDefinition.initialPrompt;
      } else if (!inputPrompt) {
        inputPrompt = mainThreadAgentDefinition.initialPrompt;
      }
    }
    let effectiveModel = userSpecifiedModel;
    if (!effectiveModel && mainThreadAgentDefinition?.model && mainThreadAgentDefinition.model !== "inherit") {
      effectiveModel = parseUserSpecifiedModel(mainThreadAgentDefinition.model);
    }
    setMainLoopModelOverride(effectiveModel);
    setInitialMainLoopModel(getUserSpecifiedModelSetting() || null);
    const initialMainLoopModel = getInitialMainLoopModel();
    const resolvedInitialModel = parseUserSpecifiedModel(initialMainLoopModel ?? getDefaultMainLoopModel());
    let advisorModel;
    if (isAdvisorEnabled()) {
      const advisorOption = canUserConfigureAdvisor() ? options.advisor : undefined;
      if (advisorOption) {
        logForDebugging(`[AdvisorTool] --advisor ${advisorOption}`);
        if (!modelSupportsAdvisor(resolvedInitialModel)) {
          process.stderr.write(source_default.red(`Error: The model "${resolvedInitialModel}" does not support the advisor tool.
`));
          process.exit(1);
        }
        const normalizedAdvisorModel = normalizeModelStringForAPI(parseUserSpecifiedModel(advisorOption));
        if (!isValidAdvisorModel(normalizedAdvisorModel)) {
          process.stderr.write(source_default.red(`Error: The model "${advisorOption}" cannot be used as an advisor.
`));
          process.exit(1);
        }
      }
      advisorModel = canUserConfigureAdvisor() ? advisorOption ?? getInitialAdvisorSetting() : advisorOption;
      if (advisorModel) {
        logForDebugging(`[AdvisorTool] Advisor model: ${advisorModel}`);
      }
    }
    if (isAgentSwarmsEnabled() && storedTeammateOpts?.agentId && storedTeammateOpts?.agentName && storedTeammateOpts?.teamName && storedTeammateOpts?.agentType) {
      const customAgent = agentDefinitions.activeAgents.find((a) => a.agentType === storedTeammateOpts.agentType);
      if (customAgent) {
        let customPrompt;
        if (customAgent.source === "built-in") {
          logForDebugging(`[teammate] Built-in agent ${storedTeammateOpts.agentType} - skipping custom prompt (not supported)`);
        } else {
          customPrompt = customAgent.getSystemPrompt();
        }
        if (customAgent.memory) {
          logEvent("tengu_agent_memory_loaded", {
            ...false,
            scope: customAgent.memory,
            source: "teammate"
          });
        }
        if (customPrompt) {
          const customInstructions = `
# Custom Agent Instructions
${customPrompt}`;
          appendSystemPrompt = appendSystemPrompt ? `${appendSystemPrompt}

${customInstructions}` : customInstructions;
        }
      } else {
        logForDebugging(`[teammate] Custom agent ${storedTeammateOpts.agentType} not found in available agents`);
      }
    }
    maybeActivateBrief(options);
    if (false) {}
    if (false) {}
    if (false) {}
    let root;
    let getFpsMetrics;
    let stats;
    if (!isNonInteractiveSession) {
      const ctx = getRenderContext(false);
      getFpsMetrics = ctx.getFpsMetrics;
      stats = ctx.stats;
      if (false) {}
      const {
        createRoot
      } = await import("./chunk-5rf2fy46.js");
      root = await createRoot(ctx.renderOptions);
      logEvent("tengu_timer", {
        event: "startup",
        durationMs: Math.round(process.uptime() * 1000)
      });
      logForDebugging("[STARTUP] Running showSetupScreens()...");
      const setupScreensStart = Date.now();
      const onboardingShown = await showSetupScreens(root, permissionMode, allowDangerouslySkipPermissions, commands, enableClaudeInChrome, devChannels);
      logForDebugging(`[STARTUP] showSetupScreens() completed in ${Date.now() - setupScreensStart}ms`);
      if (false) {}
      if (false) {}
      if (onboardingShown && prompt?.trim().toLowerCase() === "/login") {
        prompt = "";
      }
      if (onboardingShown) {
        refreshRemoteManagedSettings();
        refreshPolicyLimits();
        resetUserCache();
        refreshGrowthBookAfterAuthChange();
        import("./chunk-m8j50axq.js").then((m) => {
          m.clearTrustedDeviceToken();
          return m.enrollTrustedDevice();
        });
      }
      const orgValidation = await validateForceLoginOrg();
      if (!orgValidation.valid) {
        await exitWithError(root, orgValidation.message);
      }
    }
    if (process.exitCode !== undefined) {
      logForDebugging("Graceful shutdown initiated, skipping further initialization");
      return;
    }
    initializeLspServerManager();
    if (!isNonInteractiveSession) {
      const {
        errors
      } = getSettingsWithErrors();
      const nonMcpErrors = errors.filter((e) => !e.mcpErrorMetadata);
      if (nonMcpErrors.length > 0) {
        await launchInvalidSettingsDialog(root, {
          settingsErrors: nonMcpErrors,
          onExit: () => gracefulShutdownSync(1)
        });
      }
    }
    const bgRefreshThrottleMs = getFeatureValue_CACHED_MAY_BE_STALE("tengu_cicada_nap_ms", 0);
    const lastPrefetched = getGlobalConfig().startupPrefetchedAt ?? 0;
    const skipStartupPrefetches = isBareMode() || bgRefreshThrottleMs > 0 && Date.now() - lastPrefetched < bgRefreshThrottleMs;
    if (!skipStartupPrefetches) {
      const lastPrefetchedInfo = lastPrefetched > 0 ? ` last ran ${Math.round((Date.now() - lastPrefetched) / 1000)}s ago` : "";
      logForDebugging(`Starting background startup prefetches${lastPrefetchedInfo}`);
      checkQuotaStatus().catch((error) => logError(error));
      fetchBootstrapData();
      prefetchPassesEligibility();
      if (!getFeatureValue_CACHED_MAY_BE_STALE("tengu_miraculo_the_bard", false)) {
        prefetchFastModeStatus();
      } else {
        resolveFastModeStatusFromCache();
      }
      if (bgRefreshThrottleMs > 0) {
        saveGlobalConfig((current) => ({
          ...current,
          startupPrefetchedAt: Date.now()
        }));
      }
    } else {
      logForDebugging(`Skipping startup prefetches, last ran ${Math.round((Date.now() - lastPrefetched) / 1000)}s ago`);
      resolveFastModeStatusFromCache();
    }
    if (!isNonInteractiveSession) {
      refreshExampleCommands();
    }
    const {
      servers: existingMcpConfigs
    } = await mcpConfigPromise;
    logForDebugging(`[STARTUP] MCP configs resolved in ${mcpConfigResolvedMs}ms (awaited at +${Date.now() - mcpConfigStart}ms)`);
    const allMcpConfigs = {
      ...existingMcpConfigs,
      ...dynamicMcpConfig
    };
    const sdkMcpConfigs = {};
    const regularMcpConfigs = {};
    for (const [name, config] of Object.entries(allMcpConfigs)) {
      const typedConfig = config;
      if (typedConfig.type === "sdk") {
        sdkMcpConfigs[name] = typedConfig;
      } else {
        regularMcpConfigs[name] = typedConfig;
      }
    }
    profileCheckpoint("action_mcp_configs_loaded");
    const localMcpPromise = isNonInteractiveSession ? Promise.resolve({
      clients: [],
      tools: [],
      commands: []
    }) : prefetchAllMcpResources(regularMcpConfigs);
    const claudeaiMcpPromise = isNonInteractiveSession ? Promise.resolve({
      clients: [],
      tools: [],
      commands: []
    }) : claudeaiConfigPromise.then((configs) => Object.keys(configs).length > 0 ? prefetchAllMcpResources(configs) : {
      clients: [],
      tools: [],
      commands: []
    });
    const mcpPromise = Promise.all([localMcpPromise, claudeaiMcpPromise]).then(([local, claudeai]) => ({
      clients: [...local.clients, ...claudeai.clients],
      tools: uniqBy_default([...local.tools, ...claudeai.tools], "name"),
      commands: uniqBy_default([...local.commands, ...claudeai.commands], "name")
    }));
    const hooksPromise = initOnly || init2 || maintenance || isNonInteractiveSession || options.continue || options.resume ? null : processSessionStartHooks("startup", {
      agentType: mainThreadAgentDefinition?.agentType,
      model: resolvedInitialModel
    });
    const hookMessages = [];
    mcpPromise.catch(() => {});
    const mcpClients = [];
    const mcpTools = [];
    const mcpCommands = [];
    let thinkingEnabled = shouldEnableThinkingByDefault();
    let thinkingConfig = thinkingEnabled !== false ? {
      type: "adaptive"
    } : {
      type: "disabled"
    };
    if (options.thinking === "adaptive" || options.thinking === "enabled") {
      thinkingEnabled = true;
      thinkingConfig = {
        type: "adaptive"
      };
    } else if (options.thinking === "disabled") {
      thinkingEnabled = false;
      thinkingConfig = {
        type: "disabled"
      };
    } else {
      const maxThinkingTokens = process.env.MAX_THINKING_TOKENS ? parseInt(process.env.MAX_THINKING_TOKENS, 10) : options.maxThinkingTokens;
      if (maxThinkingTokens !== undefined) {
        if (maxThinkingTokens > 0) {
          thinkingEnabled = true;
          thinkingConfig = {
            type: "enabled",
            budgetTokens: maxThinkingTokens
          };
        } else if (maxThinkingTokens === 0) {
          thinkingEnabled = false;
          thinkingConfig = {
            type: "disabled"
          };
        }
      }
    }
    logForDiagnosticsNoPII("info", "started", {
      version: MACRO.VERSION,
      is_native_binary: isInBundledMode()
    });
    registerCleanup(async () => {
      logForDiagnosticsNoPII("info", "exited");
    });
    logTenguInit({
      hasInitialPrompt: Boolean(prompt),
      hasStdin: Boolean(inputPrompt),
      verbose,
      debug,
      debugToStderr,
      print: print ?? false,
      outputFormat: outputFormat ?? "text",
      inputFormat: inputFormat ?? "text",
      numAllowedTools: allowedTools.length,
      numDisallowedTools: disallowedTools.length,
      mcpClientCount: Object.keys(allMcpConfigs).length,
      worktreeEnabled,
      skipWebFetchPreflight: getInitialSettings().skipWebFetchPreflight,
      githubActionInputs: process.env.GITHUB_ACTION_INPUTS,
      dangerouslySkipPermissionsPassed: dangerouslySkipPermissions ?? false,
      permissionMode,
      modeIsBypass: permissionMode === "bypassPermissions",
      allowDangerouslySkipPermissionsPassed: allowDangerouslySkipPermissions,
      systemPromptFlag: systemPrompt ? options.systemPromptFile ? "file" : "flag" : undefined,
      appendSystemPromptFlag: appendSystemPrompt ? options.appendSystemPromptFile ? "file" : "flag" : undefined,
      thinkingConfig,
      assistantActivationPath: undefined
    });
    logContextMetrics(regularMcpConfigs, toolPermissionContext);
    logPermissionContextForAnts(null, "initialization");
    logManagedSettings();
    registerSession().then((registered) => {
      if (!registered)
        return;
      if (sessionNameArg) {
        updateSessionName(sessionNameArg);
      }
      countConcurrentSessions().then((count2) => {
        if (count2 >= 2) {
          logEvent("tengu_concurrent_sessions", {
            num_sessions: count2
          });
        }
      });
    });
    if (isBareMode()) {} else if (isNonInteractiveSession) {
      await initializeVersionedPlugins();
      profileCheckpoint("action_after_plugins_init");
      cleanupOrphanedPluginVersionsInBackground().then(() => getGlobExclusionsForPluginCache());
    } else {
      initializeVersionedPlugins().then(async () => {
        profileCheckpoint("action_after_plugins_init");
        await cleanupOrphanedPluginVersionsInBackground();
        getGlobExclusionsForPluginCache();
      });
    }
    const setupTrigger = initOnly || init2 ? "init" : maintenance ? "maintenance" : null;
    if (initOnly) {
      applyConfigEnvironmentVariables();
      await processSetupHooks("init", {
        forceSyncExecution: true
      });
      await processSessionStartHooks("startup", {
        forceSyncExecution: true
      });
      gracefulShutdownSync(0);
      return;
    }
    if (isNonInteractiveSession) {
      if (outputFormat === "stream-json" || outputFormat === "json") {
        setHasFormattedOutput(true);
      }
      applyConfigEnvironmentVariables();
      initializeTelemetryAfterTrust();
      const sessionStartHooksPromise = options.continue || options.resume || teleport || setupTrigger ? undefined : processSessionStartHooks("startup");
      sessionStartHooksPromise?.catch(() => {});
      profileCheckpoint("before_validateForceLoginOrg");
      const orgValidation = await validateForceLoginOrg();
      if (!orgValidation.valid) {
        process.stderr.write(orgValidation.message + `
`);
        process.exit(1);
      }
      const commandsHeadless = disableSlashCommands ? [] : commands.filter((command) => command.type === "prompt" && !command.disableNonInteractive || command.type === "local" && command.supportsNonInteractive);
      const defaultState = getDefaultAppState();
      const headlessInitialState = {
        ...defaultState,
        mcp: {
          ...defaultState.mcp,
          clients: mcpClients,
          commands: mcpCommands,
          tools: mcpTools
        },
        toolPermissionContext,
        effortValue: parseEffortValue(options.effort) ?? getInitialEffortSetting(),
        ...isFastModeEnabled() && {
          fastMode: getInitialFastModeSetting(effectiveModel ?? null)
        },
        ...isAdvisorEnabled() && advisorModel && {
          advisorModel
        },
        ...{}
      };
      const headlessStore = createStore(headlessInitialState, onChangeAppState);
      if (toolPermissionContext.mode === "bypassPermissions" || allowDangerouslySkipPermissions) {
        checkAndDisableBypassPermissions(toolPermissionContext);
      }
      if (false) {}
      if (options.sessionPersistence === false) {
        setSessionPersistenceDisabled(true);
      }
      setSdkBetas(filterAllowedSdkBetas(betas));
      const connectMcpBatch = (configs, label) => {
        if (Object.keys(configs).length === 0)
          return Promise.resolve();
        headlessStore.setState((prev) => ({
          ...prev,
          mcp: {
            ...prev.mcp,
            clients: [...prev.mcp.clients, ...Object.entries(configs).map(([name, config]) => ({
              name,
              type: "pending",
              config
            }))]
          }
        }));
        return getMcpToolsCommandsAndResources(({
          client,
          tools: tools2,
          commands: commands2
        }) => {
          headlessStore.setState((prev) => ({
            ...prev,
            mcp: {
              ...prev.mcp,
              clients: prev.mcp.clients.some((c) => c.name === client.name) ? prev.mcp.clients.map((c) => c.name === client.name ? client : c) : [...prev.mcp.clients, client],
              tools: uniqBy_default([...prev.mcp.tools, ...tools2], "name"),
              commands: uniqBy_default([...prev.mcp.commands, ...commands2], "name")
            }
          }));
        }, configs).catch((err) => logForDebugging(`[MCP] ${label} connect error: ${err}`));
      };
      profileCheckpoint("before_connectMcp");
      await connectMcpBatch(regularMcpConfigs, "regular");
      profileCheckpoint("after_connectMcp");
      const CLAUDE_AI_MCP_TIMEOUT_MS = 5000;
      const claudeaiConnect = claudeaiConfigPromise.then((claudeaiConfigs) => {
        if (Object.keys(claudeaiConfigs).length > 0) {
          const claudeaiSigs = new Set;
          for (const config of Object.values(claudeaiConfigs)) {
            const sig = getMcpServerSignature(config);
            if (sig)
              claudeaiSigs.add(sig);
          }
          const suppressed = new Set;
          for (const [name, config] of Object.entries(regularMcpConfigs)) {
            if (!name.startsWith("plugin:"))
              continue;
            const sig = getMcpServerSignature(config);
            if (sig && claudeaiSigs.has(sig))
              suppressed.add(name);
          }
          if (suppressed.size > 0) {
            logForDebugging(`[MCP] Lazy dedup: suppressing ${suppressed.size} plugin server(s) that duplicate claude.ai connectors: ${[...suppressed].join(", ")}`);
            for (const c of headlessStore.getState().mcp.clients) {
              if (!suppressed.has(c.name) || c.type !== "connected")
                continue;
              c.client.onclose = undefined;
              clearServerCache(c.name, c.config).catch(() => {});
            }
            headlessStore.setState((prev) => {
              let {
                clients,
                tools: tools2,
                commands: commands2,
                resources
              } = prev.mcp;
              clients = clients.filter((c) => !suppressed.has(c.name));
              tools2 = tools2.filter((t) => !t.mcpInfo || !suppressed.has(t.mcpInfo.serverName));
              for (const name of suppressed) {
                commands2 = excludeCommandsByServer(commands2, name);
                resources = excludeResourcesByServer(resources, name);
              }
              return {
                ...prev,
                mcp: {
                  ...prev.mcp,
                  clients,
                  tools: tools2,
                  commands: commands2,
                  resources
                }
              };
            });
          }
        }
        const nonPluginConfigs = pickBy_default(regularMcpConfigs, (_, n) => !n.startsWith("plugin:"));
        const {
          servers: dedupedClaudeAi
        } = dedupClaudeAiMcpServers(claudeaiConfigs, nonPluginConfigs);
        return connectMcpBatch(dedupedClaudeAi, "claudeai");
      });
      let claudeaiTimer;
      const claudeaiTimedOut = await Promise.race([claudeaiConnect.then(() => false), new Promise((resolve2) => {
        claudeaiTimer = setTimeout((r) => r(true), CLAUDE_AI_MCP_TIMEOUT_MS, resolve2);
      })]);
      if (claudeaiTimer)
        clearTimeout(claudeaiTimer);
      if (claudeaiTimedOut) {
        logForDebugging(`[MCP] claude.ai connectors not ready after ${CLAUDE_AI_MCP_TIMEOUT_MS}ms \u2014 proceeding; background connection continues`);
      }
      profileCheckpoint("after_connectMcp_claudeai");
      if (!isBareMode()) {
        startDeferredPrefetches();
        import("./chunk-6zeeg4pf.js").then((m) => m.startBackgroundHousekeeping());
        if (false) {}
      }
      logSessionTelemetry();
      profileCheckpoint("before_print_import");
      const {
        runHeadless
      } = await import("./chunk-5db533vq.js");
      profileCheckpoint("after_print_import");
      runHeadless(inputPrompt, () => headlessStore.getState(), headlessStore.setState, commandsHeadless, tools, sdkMcpConfigs, agentDefinitions.activeAgents, {
        continue: options.continue,
        resume: options.resume,
        verbose,
        outputFormat,
        jsonSchema,
        permissionPromptToolName: options.permissionPromptTool,
        allowedTools,
        thinkingConfig,
        maxTurns: options.maxTurns,
        maxBudgetUsd: options.maxBudgetUsd,
        taskBudget: options.taskBudget ? {
          total: options.taskBudget
        } : undefined,
        systemPrompt,
        appendSystemPrompt,
        userSpecifiedModel: effectiveModel,
        fallbackModel: userSpecifiedFallbackModel,
        teleport,
        sdkUrl,
        replayUserMessages: effectiveReplayUserMessages,
        includePartialMessages: effectiveIncludePartialMessages,
        forkSession: options.forkSession || false,
        resumeSessionAt: options.resumeSessionAt || undefined,
        rewindFiles: options.rewindFiles,
        enableAuthStatus: options.enableAuthStatus,
        agent: agentCli,
        workload: options.workload,
        setupTrigger: setupTrigger ?? undefined,
        sessionStartHooksPromise
      });
      return;
    }
    logEvent("tengu_startup_manual_model_config", {
      cli_flag: options.model,
      env_var: process.env.ANTHROPIC_MODEL,
      settings_file: (getInitialSettings() || {}).model,
      subscriptionType: getSubscriptionType(),
      agent: agentSetting
    });
    const deprecationWarning = getModelDeprecationWarning(resolvedInitialModel);
    const initialNotifications = [];
    if (permissionModeNotification) {
      initialNotifications.push({
        key: "permission-mode-notification",
        text: permissionModeNotification,
        priority: "high"
      });
    }
    if (deprecationWarning) {
      initialNotifications.push({
        key: "model-deprecation-warning",
        text: deprecationWarning,
        color: "warning",
        priority: "high"
      });
    }
    if (overlyBroadBashPermissions.length > 0) {
      const displayList = uniq(overlyBroadBashPermissions.map((p) => p.ruleDisplay));
      const displays = displayList.join(", ");
      const sources = uniq(overlyBroadBashPermissions.map((p) => p.sourceDisplay)).join(", ");
      const n = displayList.length;
      initialNotifications.push({
        key: "overly-broad-bash-notification",
        text: `${displays} allow ${plural(n, "rule")} from ${sources} ${plural(n, "was", "were")} ignored \u2014 not available for Ants, please use auto-mode instead`,
        color: "warning",
        priority: "high"
      });
    }
    const effectiveToolPermissionContext = {
      ...toolPermissionContext,
      mode: isAgentSwarmsEnabled() && getTeammateUtils().isPlanModeRequired() ? "plan" : toolPermissionContext.mode
    };
    const initialIsBriefOnly = false;
    const fullRemoteControl = remoteControl || getRemoteControlAtStartup() || kairosEnabled;
    let ccrMirrorEnabled = false;
    if (false) {}
    const initialState = {
      settings: getInitialSettings(),
      tasks: {},
      agentNameRegistry: new Map,
      verbose: verbose ?? getGlobalConfig().verbose ?? false,
      mainLoopModel: initialMainLoopModel,
      mainLoopModelForSession: null,
      isBriefOnly: initialIsBriefOnly,
      expandedView: getGlobalConfig().showSpinnerTree ? "teammates" : getGlobalConfig().showExpandedTodos ? "tasks" : "none",
      showTeammateMessagePreview: isAgentSwarmsEnabled() ? false : undefined,
      selectedIPAgentIndex: -1,
      coordinatorTaskIndex: -1,
      viewSelectionMode: "none",
      footerSelection: null,
      toolPermissionContext: effectiveToolPermissionContext,
      agent: mainThreadAgentDefinition?.agentType,
      agentDefinitions,
      mcp: {
        clients: [],
        tools: [],
        commands: [],
        resources: {},
        pluginReconnectKey: 0
      },
      plugins: {
        enabled: [],
        disabled: [],
        commands: [],
        errors: [],
        installationStatus: {
          marketplaces: [],
          plugins: []
        },
        needsRefresh: false
      },
      statusLineText: undefined,
      kairosEnabled,
      remoteSessionUrl: undefined,
      remoteConnectionStatus: "connecting",
      remoteBackgroundTaskCount: 0,
      replBridgeEnabled: fullRemoteControl || ccrMirrorEnabled,
      replBridgeExplicit: remoteControl,
      replBridgeOutboundOnly: ccrMirrorEnabled,
      replBridgeConnected: false,
      replBridgeSessionActive: false,
      replBridgeReconnecting: false,
      replBridgeConnectUrl: undefined,
      replBridgeSessionUrl: undefined,
      replBridgeEnvironmentId: undefined,
      replBridgeSessionId: undefined,
      replBridgeError: undefined,
      replBridgeInitialName: remoteControlName,
      showRemoteCallout: false,
      notifications: {
        current: null,
        queue: initialNotifications
      },
      elicitation: {
        queue: []
      },
      todos: {},
      remoteAgentTaskSuggestions: [],
      fileHistory: {
        snapshots: [],
        trackedFiles: new Set,
        snapshotSequence: 0
      },
      attribution: createEmptyAttributionState(),
      thinkingEnabled,
      promptSuggestionEnabled: shouldEnablePromptSuggestion(),
      sessionHooks: new Map,
      inbox: {
        messages: []
      },
      promptSuggestion: {
        text: null,
        promptId: null,
        shownAt: 0,
        acceptedAt: 0,
        generationRequestId: null
      },
      speculation: IDLE_SPECULATION_STATE,
      speculationSessionTimeSavedMs: 0,
      skillImprovement: {
        suggestion: null
      },
      workerSandboxPermissions: {
        queue: [],
        selectedIndex: 0
      },
      pendingWorkerRequest: null,
      pendingSandboxRequest: null,
      authVersion: 0,
      initialMessage: inputPrompt ? {
        message: createUserMessage({
          content: String(inputPrompt)
        })
      } : null,
      effortValue: parseEffortValue(options.effort) ?? getInitialEffortSetting(),
      activeOverlays: new Set,
      fastMode: getInitialFastModeSetting(resolvedInitialModel),
      ...isAdvisorEnabled() && advisorModel && {
        advisorModel
      },
      teamContext: computeInitialTeamContext?.() || undefined
    };
    if (inputPrompt) {
      addToHistory(String(inputPrompt));
    }
    const initialTools = mcpTools;
    saveGlobalConfig((current) => ({
      ...current,
      numStartups: (current.numStartups ?? 0) + 1
    }));
    setImmediate(() => {
      logStartupTelemetry();
      logSessionTelemetry();
    });
    const sessionUploaderPromise = null;
    const uploaderReady = sessionUploaderPromise ? sessionUploaderPromise.then((mod) => mod.createSessionTurnUploader()).catch(() => null) : null;
    const sessionConfig = {
      debug: debug || debugToStderr,
      commands: [...commands, ...mcpCommands],
      initialTools,
      mcpClients,
      autoConnectIdeFlag: ide,
      mainThreadAgentDefinition,
      disableSlashCommands,
      dynamicMcpConfig,
      strictMcpConfig,
      systemPrompt,
      appendSystemPrompt,
      taskListId,
      thinkingConfig,
      ...uploaderReady && {
        onTurnComplete: (messages) => {
          uploaderReady.then((uploader) => uploader?.(messages));
        }
      }
    };
    const resumeContext = {
      modeApi: coordinatorModeModule,
      mainThreadAgentDefinition,
      agentDefinitions,
      currentCwd,
      cliAgents,
      initialState
    };
    if (options.continue) {
      let resumeSucceeded = false;
      try {
        const resumeStart = performance.now();
        const {
          clearSessionCaches
        } = await import("./chunk-rjbgvnpg.js");
        clearSessionCaches();
        const result = await loadConversationForResume(undefined, undefined);
        if (!result) {
          logEvent("tengu_continue", {
            success: false
          });
          return await exitWithError(root, "No conversation found to continue");
        }
        const loaded = await processResumedConversation(result, {
          forkSession: !!options.forkSession,
          includeAttribution: true,
          transcriptPath: result.fullPath
        }, resumeContext);
        if (loaded.restoredAgentDef) {
          mainThreadAgentDefinition = loaded.restoredAgentDef;
        }
        maybeActivateProactive(options);
        maybeActivateBrief(options);
        logEvent("tengu_continue", {
          success: true,
          resume_duration_ms: Math.round(performance.now() - resumeStart)
        });
        resumeSucceeded = true;
        await launchRepl(root, {
          getFpsMetrics,
          stats,
          initialState: loaded.initialState
        }, {
          ...sessionConfig,
          mainThreadAgentDefinition: loaded.restoredAgentDef ?? mainThreadAgentDefinition,
          initialMessages: loaded.messages,
          initialFileHistorySnapshots: loaded.fileHistorySnapshots,
          initialContentReplacements: loaded.contentReplacements,
          initialAgentName: loaded.agentName,
          initialAgentColor: loaded.agentColor
        }, renderAndRun);
      } catch (error) {
        if (!resumeSucceeded) {
          logEvent("tengu_continue", {
            success: false
          });
        }
        logError(error);
        process.exit(1);
      }
    } else if (false) {} else if (false) {} else if (false) {} else if (options.resume || options.fromPr || teleport || remote !== null) {
      const {
        clearSessionCaches
      } = await import("./chunk-rjbgvnpg.js");
      clearSessionCaches();
      let messages = null;
      let processedResume = undefined;
      let maybeSessionId = validateUuid(options.resume);
      let searchTerm = undefined;
      let matchedLog = null;
      let filterByPr = undefined;
      if (options.fromPr) {
        if (options.fromPr === true) {
          filterByPr = true;
        } else if (typeof options.fromPr === "string") {
          filterByPr = options.fromPr;
        }
      }
      if (options.resume && typeof options.resume === "string" && !maybeSessionId) {
        const trimmedValue = options.resume.trim();
        if (trimmedValue) {
          const matches = await searchSessionsByCustomTitle(trimmedValue, {
            exact: true
          });
          if (matches.length === 1) {
            matchedLog = matches[0];
            maybeSessionId = getSessionIdFromLog(matchedLog) ?? null;
          } else {
            searchTerm = trimmedValue;
          }
        }
      }
      if (remote !== null || teleport) {
        await waitForPolicyLimitsToLoad();
        if (!isPolicyAllowed("allow_remote_sessions")) {
          return await exitWithError(root, "Error: Remote sessions are disabled by your organization's policy.", () => gracefulShutdown(1));
        }
      }
      if (remote !== null) {
        const hasInitialPrompt = remote.length > 0;
        const isRemoteTuiEnabled = getFeatureValue_CACHED_MAY_BE_STALE("tengu_remote_backend", false);
        if (!isRemoteTuiEnabled && !hasInitialPrompt) {
          return await exitWithError(root, `Error: --remote requires a description.
Usage: claude --remote "your task description"`, () => gracefulShutdown(1));
        }
        logEvent("tengu_remote_create_session", {
          has_initial_prompt: String(hasInitialPrompt)
        });
        const currentBranch = await getBranch();
        const createdSession = await teleportToRemoteWithErrorHandling(root, hasInitialPrompt ? remote : null, new AbortController().signal, currentBranch || undefined);
        if (!createdSession) {
          logEvent("tengu_remote_create_session_error", {
            error: "unable_to_create_session"
          });
          return await exitWithError(root, "Error: Unable to create remote session", () => gracefulShutdown(1));
        }
        logEvent("tengu_remote_create_session_success", {
          session_id: createdSession.id
        });
        if (!isRemoteTuiEnabled) {
          process.stdout.write(`Created remote session: ${createdSession.title}
`);
          process.stdout.write(`View: ${getRemoteSessionUrl(createdSession.id)}?m=0
`);
          process.stdout.write(`Resume with: claude --teleport ${createdSession.id}
`);
          await gracefulShutdown(0);
          process.exit(0);
        }
        setIsRemoteMode(true);
        switchSession(asSessionId(createdSession.id));
        let apiCreds;
        try {
          apiCreds = await prepareApiRequest();
        } catch (error) {
          logError(toError(error));
          return await exitWithError(root, `Error: ${errorMessage(error) || "Failed to authenticate"}`, () => gracefulShutdown(1));
        }
        const {
          getClaudeAIOAuthTokens: getTokensForRemote
        } = await import("./chunk-6xykcd6y.js");
        const getAccessTokenForRemote = () => getTokensForRemote()?.accessToken ?? apiCreds.accessToken;
        const remoteSessionConfig = createRemoteSessionConfig(createdSession.id, getAccessTokenForRemote, apiCreds.orgUUID, hasInitialPrompt);
        const remoteSessionUrl = `${getRemoteSessionUrl(createdSession.id)}?m=0`;
        const remoteInfoMessage = createSystemMessage(`/remote-control is active. Code in CLI or at ${remoteSessionUrl}`, "info");
        const initialUserMessage = hasInitialPrompt ? createUserMessage({
          content: remote
        }) : null;
        const remoteInitialState = {
          ...initialState,
          remoteSessionUrl
        };
        const remoteCommands = filterCommandsForRemoteMode(commands);
        await launchRepl(root, {
          getFpsMetrics,
          stats,
          initialState: remoteInitialState
        }, {
          debug: debug || debugToStderr,
          commands: remoteCommands,
          initialTools: [],
          initialMessages: initialUserMessage ? [remoteInfoMessage, initialUserMessage] : [remoteInfoMessage],
          mcpClients: [],
          autoConnectIdeFlag: ide,
          mainThreadAgentDefinition,
          disableSlashCommands,
          remoteSessionConfig,
          thinkingConfig
        }, renderAndRun);
        return;
      } else if (teleport) {
        if (teleport === true || teleport === "") {
          logEvent("tengu_teleport_interactive_mode", {});
          logForDebugging("selectAndResumeTeleportTask: Starting teleport flow...");
          const teleportResult = await launchTeleportResumeWrapper(root);
          if (!teleportResult) {
            await gracefulShutdown(0);
            process.exit(0);
          }
          const {
            branchError
          } = await checkOutTeleportedSessionBranch(teleportResult.branch);
          messages = processMessagesForTeleportResume(teleportResult.log, branchError);
        } else if (typeof teleport === "string") {
          logEvent("tengu_teleport_resume_session", {
            mode: "direct"
          });
          try {
            const sessionData = await fetchSession(teleport);
            const repoValidation = await validateSessionRepository(sessionData);
            if (repoValidation.status === "mismatch" || repoValidation.status === "not_in_repo") {
              const sessionRepo = repoValidation.sessionRepo;
              if (sessionRepo) {
                const knownPaths = getKnownPathsForRepo(sessionRepo);
                const existingPaths = await filterExistingPaths(knownPaths);
                if (existingPaths.length > 0) {
                  const selectedPath = await launchTeleportRepoMismatchDialog(root, {
                    targetRepo: sessionRepo,
                    initialPaths: existingPaths
                  });
                  if (selectedPath) {
                    process.chdir(selectedPath);
                    setCwd(selectedPath);
                    setOriginalCwd(selectedPath);
                  } else {
                    await gracefulShutdown(0);
                  }
                } else {
                  throw new TeleportOperationError(`You must run claude --teleport ${teleport} from a checkout of ${sessionRepo}.`, source_default.red(`You must run claude --teleport ${teleport} from a checkout of ${source_default.bold(sessionRepo)}.
`));
                }
              }
            } else if (repoValidation.status === "error") {
              throw new TeleportOperationError(repoValidation.errorMessage || "Failed to validate session", source_default.red(`Error: ${repoValidation.errorMessage || "Failed to validate session"}
`));
            }
            await validateGitState();
            const {
              teleportWithProgress
            } = await import("./chunk-84ey3xe5.js");
            const result = await teleportWithProgress(root, teleport);
            setTeleportedSessionInfo({
              sessionId: teleport
            });
            messages = result.messages;
          } catch (error) {
            if (error instanceof TeleportOperationError) {
              process.stderr.write(error.formattedMessage + `
`);
            } else {
              logError(error);
              process.stderr.write(source_default.red(`Error: ${errorMessage(error)}
`));
            }
            await gracefulShutdown(1);
          }
        }
      }
      if (false) {}
      if (maybeSessionId) {
        const sessionId2 = maybeSessionId;
        try {
          const resumeStart = performance.now();
          const result = await loadConversationForResume(matchedLog ?? sessionId2, undefined);
          if (!result) {
            logEvent("tengu_session_resumed", {
              entrypoint: "cli_flag",
              success: false
            });
            return await exitWithError(root, `No conversation found with session ID: ${sessionId2}`);
          }
          const fullPath = matchedLog?.fullPath ?? result.fullPath;
          processedResume = await processResumedConversation(result, {
            forkSession: !!options.forkSession,
            sessionIdOverride: sessionId2,
            transcriptPath: fullPath
          }, resumeContext);
          if (processedResume.restoredAgentDef) {
            mainThreadAgentDefinition = processedResume.restoredAgentDef;
          }
          logEvent("tengu_session_resumed", {
            entrypoint: "cli_flag",
            success: true,
            resume_duration_ms: Math.round(performance.now() - resumeStart)
          });
        } catch (error) {
          logEvent("tengu_session_resumed", {
            entrypoint: "cli_flag",
            success: false
          });
          logError(error);
          await exitWithError(root, `Failed to resume session ${sessionId2}`);
        }
      }
      if (fileDownloadPromise) {
        try {
          const results = await fileDownloadPromise;
          const failedCount = count(results, (r) => !r.success);
          if (failedCount > 0) {
            process.stderr.write(source_default.yellow(`Warning: ${failedCount}/${results.length} file(s) failed to download.
`));
          }
        } catch (error) {
          return await exitWithError(root, `Error downloading files: ${errorMessage(error)}`);
        }
      }
      const resumeData = processedResume ?? (Array.isArray(messages) ? {
        messages,
        fileHistorySnapshots: undefined,
        agentName: undefined,
        agentColor: undefined,
        restoredAgentDef: mainThreadAgentDefinition,
        initialState,
        contentReplacements: undefined
      } : undefined);
      if (resumeData) {
        maybeActivateProactive(options);
        maybeActivateBrief(options);
        await launchRepl(root, {
          getFpsMetrics,
          stats,
          initialState: resumeData.initialState
        }, {
          ...sessionConfig,
          mainThreadAgentDefinition: resumeData.restoredAgentDef ?? mainThreadAgentDefinition,
          initialMessages: resumeData.messages,
          initialFileHistorySnapshots: resumeData.fileHistorySnapshots,
          initialContentReplacements: resumeData.contentReplacements,
          initialAgentName: resumeData.agentName,
          initialAgentColor: resumeData.agentColor
        }, renderAndRun);
      } else {
        await launchResumeChooser(root, {
          getFpsMetrics,
          stats,
          initialState
        }, getWorktreePaths(getOriginalCwd()), {
          ...sessionConfig,
          initialSearchQuery: searchTerm,
          forkSession: options.forkSession,
          filterByPr
        });
      }
    } else {
      const pendingHookMessages = hooksPromise && hookMessages.length === 0 ? hooksPromise : undefined;
      profileCheckpoint("action_after_hooks");
      maybeActivateProactive(options);
      maybeActivateBrief(options);
      if (false) {}
      let deepLinkBanner = null;
      if (false) {}
      const initialMessages = deepLinkBanner ? [deepLinkBanner, ...hookMessages] : hookMessages.length > 0 ? hookMessages : undefined;
      await launchRepl(root, {
        getFpsMetrics,
        stats,
        initialState
      }, {
        ...sessionConfig,
        initialMessages,
        pendingHookMessages
      }, renderAndRun);
    }
  }).version(`${MACRO.VERSION} (Panda Code)`, "-v, --version", "Output the version number");
  program2.option("-w, --worktree [name]", "Create a new git worktree for this session (optionally specify a name)");
  program2.option("--tmux", "Create a tmux session for the worktree (requires --worktree). Uses iTerm2 native panes when available; use --tmux=classic for traditional tmux.");
  if (canUserConfigureAdvisor()) {
    program2.addOption(new Option("--advisor <model>", "Enable the server-side advisor tool with the specified model (alias or full ID).").hideHelp());
  }
  if (false) {}
  if (false) {}
  if (false) {}
  if (false) {}
  if (false) {}
  if (false) {}
  if (false) {}
  program2.addOption(new Option("--agent-id <id>", "Teammate agent ID").hideHelp());
  program2.addOption(new Option("--agent-name <name>", "Teammate display name").hideHelp());
  program2.addOption(new Option("--team-name <name>", "Team name for swarm coordination").hideHelp());
  program2.addOption(new Option("--agent-color <color>", "Teammate UI color").hideHelp());
  program2.addOption(new Option("--plan-mode-required", "Require plan mode before implementation").hideHelp());
  program2.addOption(new Option("--parent-session-id <id>", "Parent session ID for analytics correlation").hideHelp());
  program2.addOption(new Option("--teammate-mode <mode>", 'How to spawn teammates: "tmux", "in-process", or "auto"').choices(["auto", "tmux", "in-process"]).hideHelp());
  program2.addOption(new Option("--agent-type <type>", "Custom agent type for this teammate").hideHelp());
  program2.addOption(new Option("--sdk-url <url>", "Use remote WebSocket endpoint for SDK I/O streaming (only with -p and stream-json format)").hideHelp());
  program2.addOption(new Option("--teleport [session]", "Resume a teleport session, optionally specify session ID").hideHelp());
  program2.addOption(new Option("--remote [description]", "Create a remote session with the given description").hideHelp());
  if (false) {}
  if (false) {}
  profileCheckpoint("run_main_options_built");
  const isPrintMode = process.argv.includes("-p") || process.argv.includes("--print");
  const isCcUrl = process.argv.some((a) => a.startsWith("cc://") || a.startsWith("cc+unix://"));
  if (isPrintMode && !isCcUrl) {
    profileCheckpoint("run_before_parse");
    await program2.parseAsync(process.argv);
    profileCheckpoint("run_after_parse");
    return program2;
  }
  const mcp = program2.command("mcp").description("Configure and manage MCP servers \xB7 \u914D\u7F6E\u548C\u7BA1\u7406 MCP \u670D\u52A1\u5668").configureHelp(createSortedHelpConfig()).enablePositionalOptions();
  mcp.command("serve").description(`Start the Panda Code MCP server \xB7 \u542F\u52A8 MCP \u670D\u52A1\u5668`).option("-d, --debug", "Enable debug mode", () => true).option("--verbose", "Override verbose mode setting from config", () => true).action(async ({
    debug,
    verbose
  }) => {
    const {
      mcpServeHandler
    } = await import("./chunk-z2xtrtwr.js");
    await mcpServeHandler({
      debug,
      verbose
    });
  });
  registerMcpAddCommand(mcp);
  if (isXaaEnabled()) {
    registerMcpXaaIdpCommand(mcp);
  }
  mcp.command("remove <name>").description("Remove an MCP server \xB7 \u79FB\u9664 MCP \u670D\u52A1\u5668").option("-s, --scope <scope>", "Configuration scope (local, user, or project) - if not specified, removes from whichever scope it exists in").action(async (name, options) => {
    const {
      mcpRemoveHandler
    } = await import("./chunk-z2xtrtwr.js");
    await mcpRemoveHandler(name, options);
  });
  mcp.command("list").description("List configured MCP servers. Note: The workspace trust dialog is skipped and stdio servers from .mcp.json are spawned for health checks. Only use this command in directories you trust. \xB7 \u5217\u51FA\u5DF2\u914D\u7F6E\u7684 MCP \u670D\u52A1\u5668").action(async () => {
    const {
      mcpListHandler
    } = await import("./chunk-z2xtrtwr.js");
    await mcpListHandler();
  });
  mcp.command("get <name>").description("Get details about an MCP server. Note: The workspace trust dialog is skipped and stdio servers from .mcp.json are spawned for health checks. Only use this command in directories you trust. \xB7 \u83B7\u53D6 MCP \u670D\u52A1\u5668\u8BE6\u60C5").action(async (name) => {
    const {
      mcpGetHandler
    } = await import("./chunk-z2xtrtwr.js");
    await mcpGetHandler(name);
  });
  mcp.command("add-json <name> <json>").description("Add an MCP server (stdio or SSE) with a JSON string \xB7 \u901A\u8FC7 JSON \u5B57\u7B26\u4E32\u6DFB\u52A0 MCP \u670D\u52A1\u5668").option("-s, --scope <scope>", "Configuration scope (local, user, or project)", "local").option("--client-secret", "Prompt for OAuth client secret (or set MCP_CLIENT_SECRET env var)").action(async (name, json, options) => {
    const {
      mcpAddJsonHandler
    } = await import("./chunk-z2xtrtwr.js");
    await mcpAddJsonHandler(name, json, options);
  });
  mcp.command("add-from-claude-desktop").description("Import MCP servers from Claude Desktop (Mac and WSL only) \xB7 \u4ECE Claude Desktop \u5BFC\u5165 MCP \u670D\u52A1\u5668").option("-s, --scope <scope>", "Configuration scope (local, user, or project)", "local").action(async (options) => {
    const {
      mcpAddFromDesktopHandler
    } = await import("./chunk-z2xtrtwr.js");
    await mcpAddFromDesktopHandler(options);
  });
  mcp.command("reset-project-choices").description("Reset all approved and rejected project-scoped (.mcp.json) servers within this project \xB7 \u91CD\u7F6E\u9879\u76EE\u7EA7 MCP \u670D\u52A1\u5668\u5BA1\u6279\u72B6\u6001").action(async () => {
    const {
      mcpResetChoicesHandler
    } = await import("./chunk-z2xtrtwr.js");
    await mcpResetChoicesHandler();
  });
  if (false) {}
  if (false) {}
  if (false) {}
  const auth = program2.command("auth").description("Manage authentication \xB7 \u7BA1\u7406\u8BA4\u8BC1").configureHelp(createSortedHelpConfig());
  auth.command("login").description("Sign in to your Anthropic account \xB7 \u767B\u5F55\u8D26\u6237").option("--email <email>", "Pre-populate email address on the login page").option("--sso", "Force SSO login flow").option("--console", "Use Anthropic Console (API usage billing) instead of Claude subscription").option("--claudeai", "Use Claude subscription (default)").option("--provider <name>", "API provider (anthropic, deepseek, kimi, qwen, minimax, glm, volcano)").action(async ({
    email,
    sso,
    console: useConsole,
    claudeai,
    provider
  }) => {
    const {
      authLogin
    } = await import("./chunk-k8vt77zc.js");
    await authLogin({
      email,
      sso,
      console: useConsole,
      claudeai,
      provider
    });
  });
  auth.command("status").description("Show authentication status \xB7 \u663E\u793A\u8BA4\u8BC1\u72B6\u6001").option("--json", "Output as JSON (default)").option("--text", "Output as human-readable text").action(async (opts) => {
    const {
      authStatus
    } = await import("./chunk-k8vt77zc.js");
    await authStatus(opts);
  });
  auth.command("logout").description("Log out from your Anthropic account \xB7 \u9000\u51FA\u767B\u5F55").action(async () => {
    const {
      authLogout
    } = await import("./chunk-k8vt77zc.js");
    await authLogout();
  });
  const coworkOption = () => new Option("--cowork", "Use cowork_plugins directory").hideHelp();
  const pluginCmd = program2.command("plugin").alias("plugins").description("Manage Panda Code plugins \xB7 \u7BA1\u7406\u63D2\u4EF6").configureHelp(createSortedHelpConfig());
  pluginCmd.command("validate <path>").description("Validate a plugin or marketplace manifest \xB7 \u9A8C\u8BC1\u63D2\u4EF6\u6216\u5E02\u573A\u6E05\u5355").addOption(coworkOption()).action(async (manifestPath, options) => {
    const {
      pluginValidateHandler
    } = await import("./chunk-hgeezmvk.js");
    await pluginValidateHandler(manifestPath, options);
  });
  pluginCmd.command("list").description("List installed plugins \xB7 \u5217\u51FA\u5DF2\u5B89\u88C5\u63D2\u4EF6").option("--json", "Output as JSON").option("--available", "Include available plugins from marketplaces (requires --json)").addOption(coworkOption()).action(async (options) => {
    const {
      pluginListHandler
    } = await import("./chunk-hgeezmvk.js");
    await pluginListHandler(options);
  });
  const marketplaceCmd = pluginCmd.command("marketplace").description("Manage Panda Code marketplaces \xB7 \u7BA1\u7406\u63D2\u4EF6\u5E02\u573A").configureHelp(createSortedHelpConfig());
  marketplaceCmd.command("add <source>").description("Add a marketplace from a URL, path, or GitHub repo \xB7 \u6DFB\u52A0\u63D2\u4EF6\u5E02\u573A").addOption(coworkOption()).option("--sparse <paths...>", "Limit checkout to specific directories via git sparse-checkout (for monorepos). Example: --sparse .claude-plugin plugins").option("--scope <scope>", "Where to declare the marketplace: user (default), project, or local").action(async (source, options) => {
    const {
      marketplaceAddHandler
    } = await import("./chunk-hgeezmvk.js");
    await marketplaceAddHandler(source, options);
  });
  marketplaceCmd.command("list").description("List all configured marketplaces \xB7 \u5217\u51FA\u6240\u6709\u5DF2\u914D\u7F6E\u7684\u5E02\u573A").option("--json", "Output as JSON").addOption(coworkOption()).action(async (options) => {
    const {
      marketplaceListHandler
    } = await import("./chunk-hgeezmvk.js");
    await marketplaceListHandler(options);
  });
  marketplaceCmd.command("remove <name>").alias("rm").description("Remove a configured marketplace \xB7 \u79FB\u9664\u5DF2\u914D\u7F6E\u7684\u5E02\u573A").addOption(coworkOption()).action(async (name, options) => {
    const {
      marketplaceRemoveHandler
    } = await import("./chunk-hgeezmvk.js");
    await marketplaceRemoveHandler(name, options);
  });
  marketplaceCmd.command("update [name]").description("Update marketplace(s) from their source - updates all if no name specified \xB7 \u66F4\u65B0\u5E02\u573A\u6E90").addOption(coworkOption()).action(async (name, options) => {
    const {
      marketplaceUpdateHandler
    } = await import("./chunk-hgeezmvk.js");
    await marketplaceUpdateHandler(name, options);
  });
  pluginCmd.command("install <plugin>").alias("i").description("Install a plugin from available marketplaces (use plugin@marketplace for specific marketplace) \xB7 \u4ECE\u5E02\u573A\u5B89\u88C5\u63D2\u4EF6").option("-s, --scope <scope>", "Installation scope: user, project, or local", "user").addOption(coworkOption()).action(async (plugin, options) => {
    const {
      pluginInstallHandler
    } = await import("./chunk-hgeezmvk.js");
    await pluginInstallHandler(plugin, options);
  });
  pluginCmd.command("uninstall <plugin>").alias("remove").alias("rm").description("Uninstall an installed plugin \xB7 \u5378\u8F7D\u63D2\u4EF6").option("-s, --scope <scope>", "Uninstall from scope: user, project, or local", "user").option("--keep-data", "Preserve the plugin's persistent data directory (~/.pandacc/plugins/data/{id}/)").addOption(coworkOption()).action(async (plugin, options) => {
    const {
      pluginUninstallHandler
    } = await import("./chunk-hgeezmvk.js");
    await pluginUninstallHandler(plugin, options);
  });
  pluginCmd.command("enable <plugin>").description("Enable a disabled plugin \xB7 \u542F\u7528\u5DF2\u7981\u7528\u7684\u63D2\u4EF6").option("-s, --scope <scope>", `Installation scope: ${VALID_INSTALLABLE_SCOPES.join(", ")} (default: auto-detect)`).addOption(coworkOption()).action(async (plugin, options) => {
    const {
      pluginEnableHandler
    } = await import("./chunk-hgeezmvk.js");
    await pluginEnableHandler(plugin, options);
  });
  pluginCmd.command("disable [plugin]").description("Disable an enabled plugin \xB7 \u7981\u7528\u63D2\u4EF6").option("-a, --all", "Disable all enabled plugins").option("-s, --scope <scope>", `Installation scope: ${VALID_INSTALLABLE_SCOPES.join(", ")} (default: auto-detect)`).addOption(coworkOption()).action(async (plugin, options) => {
    const {
      pluginDisableHandler
    } = await import("./chunk-hgeezmvk.js");
    await pluginDisableHandler(plugin, options);
  });
  pluginCmd.command("update <plugin>").description("Update a plugin to the latest version (restart required to apply) \xB7 \u66F4\u65B0\u63D2\u4EF6\u5230\u6700\u65B0\u7248\u672C").option("-s, --scope <scope>", `Installation scope: ${VALID_UPDATE_SCOPES.join(", ")} (default: user)`).addOption(coworkOption()).action(async (plugin, options) => {
    const {
      pluginUpdateHandler
    } = await import("./chunk-hgeezmvk.js");
    await pluginUpdateHandler(plugin, options);
  });
  program2.command("setup-token").description("Set up a long-lived authentication token (requires Claude subscription) \xB7 \u8BBE\u7F6E\u957F\u671F\u8BA4\u8BC1\u4EE4\u724C").action(async () => {
    const [{
      setupTokenHandler
    }, {
      createRoot
    }] = await Promise.all([import("./chunk-rkgrrmyd.js"), import("./chunk-5rf2fy46.js")]);
    const root = await createRoot(getBaseRenderOptions(false));
    await setupTokenHandler(root);
  });
  program2.command("agents").description("List configured agents \xB7 \u5217\u51FA\u5DF2\u914D\u7F6E\u7684 Agent").option("--setting-sources <sources>", "Comma-separated list of setting sources to load (user, project, local).").action(async () => {
    const {
      agentsHandler
    } = await import("./chunk-avhvv04k.js");
    await agentsHandler();
    process.exit(0);
  });
  if (false) {}
  if (false) {}
  if (false) {}
  program2.command("doctor").description("Check the health of your Panda Code auto-updater \xB7 \u68C0\u67E5\u81EA\u52A8\u66F4\u65B0\u5065\u5EB7\u72B6\u6001").action(async () => {
    const [{
      doctorHandler
    }, {
      createRoot
    }] = await Promise.all([import("./chunk-rkgrrmyd.js"), import("./chunk-5rf2fy46.js")]);
    const root = await createRoot(getBaseRenderOptions(false));
    await doctorHandler(root);
  });
  program2.command("update").alias("upgrade").description("Check for updates and install if available \xB7 \u68C0\u67E5\u5E76\u5B89\u88C5\u66F4\u65B0").action(async () => {
    const {
      update
    } = await import("./chunk-1478v3fh.js");
    await update();
  });
  if (false) {}
  if (false) {}
  program2.command("install [target]").description("Install Panda Code native build. Use [target] to specify version (stable, latest, or specific version) \xB7 \u5B89\u88C5\u539F\u751F\u6784\u5EFA").option("--force", "Force installation even if already installed").action(async (target, options) => {
    const {
      installHandler
    } = await import("./chunk-rkgrrmyd.js");
    await installHandler(target, options);
  });
  if (false) {}
  profileCheckpoint("run_before_parse");
  await program2.parseAsync(process.argv);
  profileCheckpoint("run_after_parse");
  profileCheckpoint("main_after_run");
  profileReport();
  return program2;
}
async function logTenguInit({
  hasInitialPrompt,
  hasStdin,
  verbose,
  debug,
  debugToStderr,
  print,
  outputFormat,
  inputFormat,
  numAllowedTools,
  numDisallowedTools,
  mcpClientCount,
  worktreeEnabled,
  skipWebFetchPreflight,
  githubActionInputs,
  dangerouslySkipPermissionsPassed,
  permissionMode,
  modeIsBypass,
  allowDangerouslySkipPermissionsPassed,
  systemPromptFlag,
  appendSystemPromptFlag,
  thinkingConfig,
  assistantActivationPath
}) {
  try {
    logEvent("tengu_init", {
      entrypoint: "claude",
      hasInitialPrompt,
      hasStdin,
      verbose,
      debug,
      debugToStderr,
      print,
      outputFormat,
      inputFormat,
      numAllowedTools,
      numDisallowedTools,
      mcpClientCount,
      worktree: worktreeEnabled,
      skipWebFetchPreflight,
      ...githubActionInputs && {
        githubActionInputs
      },
      dangerouslySkipPermissionsPassed,
      permissionMode,
      modeIsBypass,
      inProtectedNamespace: isInProtectedNamespace(),
      allowDangerouslySkipPermissionsPassed,
      thinkingType: thinkingConfig.type,
      ...systemPromptFlag && {
        systemPromptFlag
      },
      ...appendSystemPromptFlag && {
        appendSystemPromptFlag
      },
      is_simple: isBareMode() || undefined,
      is_coordinator: undefined,
      ...assistantActivationPath && {
        assistantActivationPath
      },
      autoUpdatesChannel: getInitialSettings().autoUpdatesChannel ?? "latest",
      ...{}
    });
  } catch (error) {
    logError(error);
  }
}
function maybeActivateProactive(options) {
  if (false) {}
}
function maybeActivateBrief(options) {
  if (true)
    return;
  const briefFlag = options.brief;
  const briefEnv = isEnvTruthy(process.env.CLAUDE_CODE_BRIEF);
  if (!briefFlag && !briefEnv)
    return;
  const {
    isBriefEntitled
  } = (init_BriefTool(), __toCommonJS(exports_BriefTool));
  const entitled = isBriefEntitled();
  if (entitled) {
    setUserMsgOptIn(true);
  }
  logEvent("tengu_brief_mode_enabled", {
    enabled: entitled,
    gated: !entitled,
    source: briefEnv ? "env" : "flag"
  });
}
function resetCursor() {
  const terminal = process.stderr.isTTY ? process.stderr : process.stdout.isTTY ? process.stdout : undefined;
  terminal?.write(SHOW_CURSOR);
}
function extractTeammateOptions(options) {
  if (typeof options !== "object" || options === null) {
    return {};
  }
  const opts = options;
  const teammateMode = opts.teammateMode;
  return {
    agentId: typeof opts.agentId === "string" ? opts.agentId : undefined,
    agentName: typeof opts.agentName === "string" ? opts.agentName : undefined,
    teamName: typeof opts.teamName === "string" ? opts.teamName : undefined,
    agentColor: typeof opts.agentColor === "string" ? opts.agentColor : undefined,
    planModeRequired: typeof opts.planModeRequired === "boolean" ? opts.planModeRequired : undefined,
    parentSessionId: typeof opts.parentSessionId === "string" ? opts.parentSessionId : undefined,
    teammateMode: teammateMode === "auto" || teammateMode === "tmux" || teammateMode === "in-process" ? teammateMode : undefined,
    agentType: typeof opts.agentType === "string" ? opts.agentType : undefined
  };
}
export {
  startDeferredPrefetches,
  main
};
