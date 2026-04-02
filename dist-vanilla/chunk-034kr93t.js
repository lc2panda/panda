// @bun
import {
  initSinks
} from "./chunk-49f3h22h.js";
import {
  getRecentActivity,
  init_logoV2Utils
} from "./chunk-f7gck38e.js";
import {
  checkForReleaseNotes,
  init_releaseNotes
} from "./chunk-tt59dtbd.js";
import"./chunk-29et9sxk.js";
import {
  DEFAULT_SESSION_MEMORY_CONFIG,
  FILE_EDIT_TOOL_NAME,
  FileReadTool,
  asSessionId,
  buildSessionMemoryUpdatePrompt,
  captureHooksConfigSnapshot,
  clearMemoryFileCaches,
  createCacheSafeParams,
  createSubagentContext,
  createTmuxSessionForWorktree,
  createUserMessage,
  createWorktreeForSession,
  generateTmuxSessionName,
  getCommands,
  getPlanSlug,
  getSessionMemoryConfig,
  getSessionMemoryDir,
  getSessionMemoryPath,
  getTokenUsage,
  getToolCallsBetweenUpdates,
  hasMetInitializationThreshold,
  hasMetUpdateThreshold,
  hasToolCallsInLastAssistantTurn,
  hasWorktreeCreateHook,
  init_FileReadTool,
  init_Shell,
  init_autoCompact,
  init_claudemd,
  init_commands1 as init_commands,
  init_constants,
  init_context,
  init_fileChangedWatcher,
  init_filesystem,
  init_forkedAgent,
  init_hooks1 as init_hooks,
  init_hooksConfigSnapshot,
  init_ids,
  init_messages1 as init_messages,
  init_nativeInstaller,
  init_plans,
  init_postSamplingHooks,
  init_prompts,
  init_prompts1 as init_prompts2,
  init_sessionMemoryUtils,
  init_sessionStorage,
  init_systemPromptType,
  init_tokens,
  init_worktree,
  initializeFileChangedWatcher,
  isAutoCompactEnabled,
  isSessionMemoryInitialized,
  loadSessionMemoryTemplate,
  lockCurrentVersion,
  markExtractionCompleted,
  markExtractionStarted,
  markSessionMemoryInitialized,
  recordExtractionTokenCount,
  registerPostSamplingHook,
  runForkedAgent,
  saveWorktreeState,
  setCwd,
  setLastSummarizedMessageId,
  setSessionMemoryConfig,
  tokenCountWithEstimation,
  updateHooksConfigSnapshot,
  worktreeBranchName
} from "./chunk-ekfe4t3x.js";
import"./chunk-4xshe7tf.js";
import"./chunk-tdbeghs2.js";
import"./chunk-86h8sspq.js";
import"./chunk-hkxvdww3.js";
import"./chunk-9bwery1w.js";
import"./chunk-4c08gv68.js";
import"./chunk-p9ra2v2f.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-4cwfa7zk.js";
import"./chunk-mjd4qde5.js";
import"./chunk-5g7gx4y7.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-sknn7p3z.js";
import"./chunk-2hb5pyjj.js";
import"./chunk-9gbamk79.js";
import {
  checkAndRestoreTerminalBackup,
  init_appleTerminalBackup
} from "./chunk-1hjzbne1.js";
import"./chunk-djq17a7g.js";
import"./chunk-gypetngm.js";
import"./chunk-qjz5kp97.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import"./chunk-g338npwr.js";
import"./chunk-7nbhgtwq.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-73re2yq9.js";
import"./chunk-j30w257d.js";
import"./chunk-fxerh6v6.js";
import {
  envDynamic,
  getCurrentProjectConfig,
  getDynamicConfig_CACHED_MAY_BE_STALE,
  getFeatureValue_CACHED_MAY_BE_STALE,
  getGlobalConfig,
  init_agentSwarmsEnabled,
  init_auth,
  init_config1 as init_config,
  init_envDynamic,
  init_growthbook,
  init_sequential,
  init_source,
  isAgentSwarmsEnabled,
  prefetchApiKeyFromApiKeyHelperIfSafe,
  saveGlobalConfig,
  sequential,
  source_default
} from "./chunk-w5d5b7r0.js";
import"./chunk-0f1005z8.js";
import"./chunk-ccq9c4dq.js";
import"./chunk-tg3zbmz7.js";
import"./chunk-3asghxv4.js";
import {
  count,
  init_array
} from "./chunk-xk4zgzx2.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-2g1tm0n3.js";
import"./chunk-55wgxwa9.js";
import"./chunk-tbpx2160.js";
import"./chunk-4jm600zv.js";
import {
  env,
  init_env
} from "./chunk-7np1pz21.js";
import"./chunk-5cqfqj5r.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-1mc1wz9m.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import {
  init_startupProfiler,
  profileCheckpoint
} from "./chunk-ywhstzac.js";
import"./chunk-cdz5yb0r.js";
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
import"./chunk-c4pgn9ph.js";
import {
  findCanonicalGitRoot,
  findGitRoot,
  getIsGit,
  init_diagLogs,
  init_git,
  logForDiagnosticsNoPII
} from "./chunk-bjwxx22f.js";
import"./chunk-tjd99w4c.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-7z9e9ndj.js";
import"./chunk-sctqkknr.js";
import"./chunk-ehab6nmr.js";
import {
  init_log,
  logError
} from "./chunk-myphr2va.js";
import"./chunk-8tnsngw2.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  errorMessage,
  getErrnoCode,
  getFsImplementation,
  init_errors,
  init_fsOperations
} from "./chunk-cv4r43rj.js";
import"./chunk-fbv4apne.js";
import {
  init_envUtils,
  isBareMode,
  isEnvTruthy
} from "./chunk-er95axp1.js";
import {
  getIsNonInteractiveSession,
  getIsRemoteMode,
  getProjectRoot,
  getSessionId,
  init_state,
  setOriginalCwd,
  setProjectRoot,
  switchSession
} from "./chunk-24stks7b.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __require
} from "./chunk-qp2qdcda.js";

// src/setup.ts
init_source();
init_analytics();
init_cwd();
init_releaseNotes();
init_Shell();
init_state();
init_commands();

// src/services/SessionMemory/sessionMemory.ts
init_memoize();
init_state();
init_prompts2();
init_context();
init_constants();
init_FileReadTool();
init_array();
init_forkedAgent();
init_fsOperations();
init_postSamplingHooks();
init_messages();
init_filesystem();
init_sequential();
init_systemPromptType();
init_tokens();
init_analytics();
init_autoCompact();
init_prompts();
init_sessionMemoryUtils();
init_errors();
init_growthbook();
import { writeFile } from "fs/promises";
function isSessionMemoryGateEnabled() {
  return getFeatureValue_CACHED_MAY_BE_STALE("tengu_session_memory", false);
}
function getSessionMemoryRemoteConfig() {
  return getDynamicConfig_CACHED_MAY_BE_STALE("tengu_sm_config", {});
}
var lastMemoryMessageUuid;
function countToolCallsSince(messages, sinceUuid) {
  let toolCallCount = 0;
  let foundStart = sinceUuid === null || sinceUuid === undefined;
  for (const message of messages) {
    if (!foundStart) {
      if (message.uuid === sinceUuid) {
        foundStart = true;
      }
      continue;
    }
    if (message.type === "assistant") {
      const content = message.message.content;
      if (Array.isArray(content)) {
        toolCallCount += count(content, (block) => block.type === "tool_use");
      }
    }
  }
  return toolCallCount;
}
function shouldExtractMemory(messages) {
  const currentTokenCount = tokenCountWithEstimation(messages);
  if (!isSessionMemoryInitialized()) {
    if (!hasMetInitializationThreshold(currentTokenCount)) {
      return false;
    }
    markSessionMemoryInitialized();
  }
  const hasMetTokenThreshold = hasMetUpdateThreshold(currentTokenCount);
  const toolCallsSinceLastUpdate = countToolCallsSince(messages, lastMemoryMessageUuid);
  const hasMetToolCallThreshold = toolCallsSinceLastUpdate >= getToolCallsBetweenUpdates();
  const hasToolCallsInLastTurn = hasToolCallsInLastAssistantTurn(messages);
  const shouldExtract = hasMetTokenThreshold && hasMetToolCallThreshold || hasMetTokenThreshold && !hasToolCallsInLastTurn;
  if (shouldExtract) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.uuid) {
      lastMemoryMessageUuid = lastMessage.uuid;
    }
    return true;
  }
  return false;
}
async function setupSessionMemoryFile(toolUseContext) {
  const fs = getFsImplementation();
  const sessionMemoryDir = getSessionMemoryDir();
  await fs.mkdir(sessionMemoryDir, { mode: 448 });
  const memoryPath = getSessionMemoryPath();
  try {
    await writeFile(memoryPath, "", {
      encoding: "utf-8",
      mode: 384,
      flag: "wx"
    });
    const template = await loadSessionMemoryTemplate();
    await writeFile(memoryPath, template, {
      encoding: "utf-8",
      mode: 384
    });
  } catch (e) {
    const code = getErrnoCode(e);
    if (code !== "EEXIST") {
      throw e;
    }
  }
  toolUseContext.readFileState.delete(memoryPath);
  const result = await FileReadTool.call({ file_path: memoryPath }, toolUseContext);
  let currentMemory = "";
  const output = result.data;
  if (output.type === "text") {
    currentMemory = output.file.content;
  }
  logEvent("tengu_session_memory_file_read", {
    content_length: currentMemory.length
  });
  return { memoryPath, currentMemory };
}
var initSessionMemoryConfigIfNeeded = memoize_default(() => {
  const remoteConfig = getSessionMemoryRemoteConfig();
  const config = {
    minimumMessageTokensToInit: remoteConfig.minimumMessageTokensToInit && remoteConfig.minimumMessageTokensToInit > 0 ? remoteConfig.minimumMessageTokensToInit : DEFAULT_SESSION_MEMORY_CONFIG.minimumMessageTokensToInit,
    minimumTokensBetweenUpdate: remoteConfig.minimumTokensBetweenUpdate && remoteConfig.minimumTokensBetweenUpdate > 0 ? remoteConfig.minimumTokensBetweenUpdate : DEFAULT_SESSION_MEMORY_CONFIG.minimumTokensBetweenUpdate,
    toolCallsBetweenUpdates: remoteConfig.toolCallsBetweenUpdates && remoteConfig.toolCallsBetweenUpdates > 0 ? remoteConfig.toolCallsBetweenUpdates : DEFAULT_SESSION_MEMORY_CONFIG.toolCallsBetweenUpdates
  };
  setSessionMemoryConfig(config);
});
var hasLoggedGateFailure = false;
var extractSessionMemory = sequential(async function(context) {
  const { messages, toolUseContext, querySource } = context;
  if (querySource !== "repl_main_thread") {
    return;
  }
  if (!isSessionMemoryGateEnabled()) {
    if (process.env.USER_TYPE === "ant" && !hasLoggedGateFailure) {
      hasLoggedGateFailure = true;
      logEvent("tengu_session_memory_gate_disabled", {});
    }
    return;
  }
  initSessionMemoryConfigIfNeeded();
  if (!shouldExtractMemory(messages)) {
    return;
  }
  markExtractionStarted();
  const setupContext = createSubagentContext(toolUseContext);
  const { memoryPath, currentMemory } = await setupSessionMemoryFile(setupContext);
  const userPrompt = await buildSessionMemoryUpdatePrompt(currentMemory, memoryPath);
  await runForkedAgent({
    promptMessages: [createUserMessage({ content: userPrompt })],
    cacheSafeParams: createCacheSafeParams(context),
    canUseTool: createMemoryFileCanUseTool(memoryPath),
    querySource: "session_memory",
    forkLabel: "session_memory",
    overrides: { readFileState: setupContext.readFileState }
  });
  const lastMessage = messages[messages.length - 1];
  const usage = lastMessage ? getTokenUsage(lastMessage) : undefined;
  const config = getSessionMemoryConfig();
  logEvent("tengu_session_memory_extraction", {
    input_tokens: usage?.input_tokens,
    output_tokens: usage?.output_tokens,
    cache_read_input_tokens: usage?.cache_read_input_tokens ?? undefined,
    cache_creation_input_tokens: usage?.cache_creation_input_tokens ?? undefined,
    config_min_message_tokens_to_init: config.minimumMessageTokensToInit,
    config_min_tokens_between_update: config.minimumTokensBetweenUpdate,
    config_tool_calls_between_updates: config.toolCallsBetweenUpdates
  });
  recordExtractionTokenCount(tokenCountWithEstimation(messages));
  updateLastSummarizedMessageIdIfSafe(messages);
  markExtractionCompleted();
});
function initSessionMemory() {
  if (getIsRemoteMode())
    return;
  const autoCompactEnabled = isAutoCompactEnabled();
  if (process.env.USER_TYPE === "ant") {
    logEvent("tengu_session_memory_init", {
      auto_compact_enabled: autoCompactEnabled
    });
  }
  if (!autoCompactEnabled) {
    return;
  }
  registerPostSamplingHook(extractSessionMemory);
}
function createMemoryFileCanUseTool(memoryPath) {
  return async (tool, input) => {
    if (tool.name === FILE_EDIT_TOOL_NAME && typeof input === "object" && input !== null && "file_path" in input) {
      const filePath = input.file_path;
      if (typeof filePath === "string" && filePath === memoryPath) {
        return { behavior: "allow", updatedInput: input };
      }
    }
    return {
      behavior: "deny",
      message: `only ${FILE_EDIT_TOOL_NAME} on ${memoryPath} is allowed`,
      decisionReason: {
        type: "other",
        reason: `only ${FILE_EDIT_TOOL_NAME} on ${memoryPath} is allowed`
      }
    };
  };
}
function updateLastSummarizedMessageIdIfSafe(messages) {
  if (!hasToolCallsInLastAssistantTurn(messages)) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.uuid) {
      setLastSummarizedMessageId(lastMessage.uuid);
    }
  }
}

// src/setup.ts
init_ids();
init_agentSwarmsEnabled();
init_appleTerminalBackup();
init_auth();
init_claudemd();
init_config();
init_diagLogs();
init_env();
init_envDynamic();
init_envUtils();
init_errors();
init_git();
init_fileChangedWatcher();
init_hooksConfigSnapshot();
init_hooks();

// src/utils/iTermBackup.ts
init_config();
init_log();
import { copyFile, stat } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
function markITerm2SetupComplete() {
  saveGlobalConfig((current) => ({
    ...current,
    iterm2SetupInProgress: false
  }));
}
function getIterm2RecoveryInfo() {
  const config = getGlobalConfig();
  return {
    inProgress: config.iterm2SetupInProgress ?? false,
    backupPath: config.iterm2BackupPath || null
  };
}
function getITerm2PlistPath() {
  return join(homedir(), "Library", "Preferences", "com.googlecode.iterm2.plist");
}
async function checkAndRestoreITerm2Backup() {
  const { inProgress, backupPath } = getIterm2RecoveryInfo();
  if (!inProgress) {
    return { status: "no_backup" };
  }
  if (!backupPath) {
    markITerm2SetupComplete();
    return { status: "no_backup" };
  }
  try {
    await stat(backupPath);
  } catch {
    markITerm2SetupComplete();
    return { status: "no_backup" };
  }
  try {
    await copyFile(backupPath, getITerm2PlistPath());
    markITerm2SetupComplete();
    return { status: "restored" };
  } catch (restoreError) {
    logError(new Error(`Failed to restore iTerm2 settings with: ${restoreError}`));
    markITerm2SetupComplete();
    return { status: "failed", backupPath };
  }
}

// src/setup.ts
init_log();
init_logoV2Utils();
init_nativeInstaller();
init_plans();
init_sessionStorage();
init_startupProfiler();
init_worktree();
async function setup(cwd, permissionMode, allowDangerouslySkipPermissions, worktreeEnabled, worktreeName, tmuxEnabled, customSessionId, worktreePRNumber, messagingSocketPath) {
  logForDiagnosticsNoPII("info", "setup_started");
  const nodeVersion = process.version.match(/^v(\d+)\./)?.[1];
  if (!nodeVersion || parseInt(nodeVersion) < 18) {
    console.error(source_default.bold.red("Error: Panda Code requires Node.js version 18 or higher."));
    process.exit(1);
  }
  if (customSessionId) {
    switchSession(asSessionId(customSessionId));
  }
  if (!isBareMode() || messagingSocketPath !== undefined) {
    if (false) {}
  }
  if (!isBareMode() && isAgentSwarmsEnabled()) {
    const { captureTeammateModeSnapshot } = await import("./chunk-5q8a2vsx.js");
    captureTeammateModeSnapshot();
  }
  if (!getIsNonInteractiveSession()) {
    if (isAgentSwarmsEnabled()) {
      const restoredIterm2Backup = await checkAndRestoreITerm2Backup();
      if (restoredIterm2Backup.status === "restored") {
        console.log(source_default.yellow("Detected an interrupted iTerm2 setup. Your original settings have been restored. You may need to restart iTerm2 for the changes to take effect."));
      } else if (restoredIterm2Backup.status === "failed") {
        console.error(source_default.red(`Failed to restore iTerm2 settings. Please manually restore your original settings with: defaults import com.googlecode.iterm2 ${restoredIterm2Backup.backupPath}.`));
      }
    }
    try {
      const restoredTerminalBackup = await checkAndRestoreTerminalBackup();
      if (restoredTerminalBackup.status === "restored") {
        console.log(source_default.yellow("Detected an interrupted Terminal.app setup. Your original settings have been restored. You may need to restart Terminal.app for the changes to take effect."));
      } else if (restoredTerminalBackup.status === "failed") {
        console.error(source_default.red(`Failed to restore Terminal.app settings. Please manually restore your original settings with: defaults import com.apple.Terminal ${restoredTerminalBackup.backupPath}.`));
      }
    } catch (error) {
      logError(error);
    }
  }
  setCwd(cwd);
  const hooksStart = Date.now();
  captureHooksConfigSnapshot();
  logForDiagnosticsNoPII("info", "setup_hooks_captured", {
    duration_ms: Date.now() - hooksStart
  });
  initializeFileChangedWatcher(cwd);
  if (worktreeEnabled) {
    const hasHook = hasWorktreeCreateHook();
    const inGit = await getIsGit();
    if (!hasHook && !inGit) {
      process.stderr.write(source_default.red(`Error: Can only use --worktree in a git repository, but ${source_default.bold(cwd)} is not a git repository. Configure a WorktreeCreate hook in settings.json to use --worktree with other VCS systems.
`));
      process.exit(1);
    }
    const slug = worktreePRNumber ? `pr-${worktreePRNumber}` : worktreeName ?? getPlanSlug();
    let tmuxSessionName;
    if (inGit) {
      const mainRepoRoot = findCanonicalGitRoot(getCwd());
      if (!mainRepoRoot) {
        process.stderr.write(source_default.red(`Error: Could not determine the main git repository root.
`));
        process.exit(1);
      }
      if (mainRepoRoot !== (findGitRoot(getCwd()) ?? getCwd())) {
        logForDiagnosticsNoPII("info", "worktree_resolved_to_main_repo");
        process.chdir(mainRepoRoot);
        setCwd(mainRepoRoot);
      }
      tmuxSessionName = tmuxEnabled ? generateTmuxSessionName(mainRepoRoot, worktreeBranchName(slug)) : undefined;
    } else {
      tmuxSessionName = tmuxEnabled ? generateTmuxSessionName(getCwd(), worktreeBranchName(slug)) : undefined;
    }
    let worktreeSession;
    try {
      worktreeSession = await createWorktreeForSession(getSessionId(), slug, tmuxSessionName, worktreePRNumber ? { prNumber: worktreePRNumber } : undefined);
    } catch (error) {
      process.stderr.write(source_default.red(`Error creating worktree: ${errorMessage(error)}
`));
      process.exit(1);
    }
    logEvent("tengu_worktree_created", { tmux_enabled: tmuxEnabled });
    if (tmuxEnabled && tmuxSessionName) {
      const tmuxResult = await createTmuxSessionForWorktree(tmuxSessionName, worktreeSession.worktreePath);
      if (tmuxResult.created) {
        console.log(source_default.green(`Created tmux session: ${source_default.bold(tmuxSessionName)}
To attach: ${source_default.bold(`tmux attach -t ${tmuxSessionName}`)}`));
      } else {
        console.error(source_default.yellow(`Warning: Failed to create tmux session: ${tmuxResult.error}`));
      }
    }
    process.chdir(worktreeSession.worktreePath);
    setCwd(worktreeSession.worktreePath);
    setOriginalCwd(getCwd());
    setProjectRoot(getCwd());
    saveWorktreeState(worktreeSession);
    clearMemoryFileCaches();
    updateHooksConfigSnapshot();
  }
  logForDiagnosticsNoPII("info", "setup_background_jobs_starting");
  if (!isBareMode()) {
    initSessionMemory();
    if (false) {}
  }
  lockCurrentVersion();
  logForDiagnosticsNoPII("info", "setup_background_jobs_launched");
  profileCheckpoint("setup_before_prefetch");
  logForDiagnosticsNoPII("info", "setup_prefetch_starting");
  const skipPluginPrefetch = getIsNonInteractiveSession() && isEnvTruthy(process.env.CLAUDE_CODE_SYNC_PLUGIN_INSTALL) || isBareMode();
  if (!skipPluginPrefetch) {
    getCommands(getProjectRoot());
  }
  import("./chunk-egbjdnab.js").then((m) => {
    if (!skipPluginPrefetch) {
      m.loadPluginHooks();
      m.setupPluginHookHotReload();
    }
  });
  if (!isBareMode()) {
    if (process.env.USER_TYPE === "ant") {
      import("./chunk-ksk1wv4k.js").then(async (m) => {
        if (await m.isInternalModelRepo()) {
          const { clearSystemPromptSections } = await import("./chunk-0vbmt08k.js");
          clearSystemPromptSections();
        }
      });
    }
    if (false) {}
    import("./chunk-tk1dqqx3.js").then((m) => m.registerSessionFileAccessHooks());
    if (false) {}
  }
  initSinks();
  logEvent("tengu_started", {});
  prefetchApiKeyFromApiKeyHelperIfSafe(getIsNonInteractiveSession());
  profileCheckpoint("setup_after_prefetch");
  if (!isBareMode()) {
    const { hasReleaseNotes } = await checkForReleaseNotes(getGlobalConfig().lastReleaseNotesSeen);
    if (hasReleaseNotes) {
      await getRecentActivity();
    }
  }
  if (permissionMode === "bypassPermissions" || allowDangerouslySkipPermissions) {
    if (process.platform !== "win32" && typeof process.getuid === "function" && process.getuid() === 0 && process.env.IS_SANDBOX !== "1" && !isEnvTruthy(process.env.CLAUDE_CODE_BUBBLEWRAP)) {
      console.error(`--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons`);
      process.exit(1);
    }
    if (process.env.USER_TYPE === "ant" && process.env.CLAUDE_CODE_ENTRYPOINT !== "local-agent" && process.env.CLAUDE_CODE_ENTRYPOINT !== "claude-desktop") {
      const [isDocker, hasInternet] = await Promise.all([
        envDynamic.getIsDocker(),
        env.hasInternetAccess()
      ]);
      const isBubblewrap = envDynamic.getIsBubblewrapSandbox();
      const isSandbox = process.env.IS_SANDBOX === "1";
      const isSandboxed = isDocker || isBubblewrap || isSandbox;
      if (!isSandboxed || hasInternet) {
        console.error(`--dangerously-skip-permissions can only be used in Docker/sandbox containers with no internet access but got Docker: ${isDocker}, Bubblewrap: ${isBubblewrap}, IS_SANDBOX: ${isSandbox}, hasInternet: ${hasInternet}`);
        process.exit(1);
      }
    }
  }
  if (false) {}
  const projectConfig = getCurrentProjectConfig();
  if (projectConfig.lastCost !== undefined && projectConfig.lastDuration !== undefined) {
    logEvent("tengu_exit", {
      last_session_cost: projectConfig.lastCost,
      last_session_api_duration: projectConfig.lastAPIDuration,
      last_session_tool_duration: projectConfig.lastToolDuration,
      last_session_duration: projectConfig.lastDuration,
      last_session_lines_added: projectConfig.lastLinesAdded,
      last_session_lines_removed: projectConfig.lastLinesRemoved,
      last_session_total_input_tokens: projectConfig.lastTotalInputTokens,
      last_session_total_output_tokens: projectConfig.lastTotalOutputTokens,
      last_session_total_cache_creation_input_tokens: projectConfig.lastTotalCacheCreationInputTokens,
      last_session_total_cache_read_input_tokens: projectConfig.lastTotalCacheReadInputTokens,
      last_session_fps_average: projectConfig.lastFpsAverage,
      last_session_fps_low_1_pct: projectConfig.lastFpsLow1Pct,
      last_session_id: projectConfig.lastSessionId,
      ...projectConfig.lastSessionMetrics
    });
  }
}
export {
  setup
};
