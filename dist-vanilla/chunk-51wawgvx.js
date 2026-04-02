// @bun
import {
  clearFileSuggestionCaches,
  init_fileSuggestions
} from "./chunk-6yfkb49r.js";
import {
  clearTrackedMagicDocs,
  init_magicDocs
} from "./chunk-4drn420h.js";
import {
  clearAllDumpState,
  clearAllPendingCallbacks,
  clearAllSessions,
  clearCommandPrefixCaches,
  clearCommandsCache,
  clearDynamicSkills,
  clearSessionEnvVars,
  clearStoredImagePaths,
  getGitStatus,
  getSessionStartDate,
  getSystemContext,
  getUserContext,
  init_LSPDiagnosticRegistry,
  init_attachments,
  init_claudemd,
  init_commands,
  init_commands1 as init_commands2,
  init_common,
  init_context,
  init_dumpPrompts,
  init_imageStore,
  init_loadSkillsDir,
  init_postCompactCleanup,
  init_promptCacheBreakDetection,
  init_sessionEnvVars,
  init_sessionIngress,
  init_useSwarmPermissionPoller,
  resetAllLSPDiagnosticState,
  resetGetMemoryFilesCache,
  resetPromptCacheBreakDetection,
  resetSentSkillNames,
  runPostCompactCleanup,
  setSystemPromptInjection
} from "./chunk-ekfe4t3x.js";
import {
  clearRepositoryCaches,
  init_detectRepository
} from "./chunk-c4pgn9ph.js";
import {
  clearResolveGitDirCache,
  init_gitFilesystem
} from "./chunk-bjwxx22f.js";
import {
  clearInvokedSkills,
  init_state,
  setLastEmittedDate
} from "./chunk-24stks7b.js";
import {
  __esm,
  __require
} from "./chunk-qp2qdcda.js";

// src/commands/clear/caches.ts
function clearSessionCaches(preservedAgentIds = new Set) {
  const hasPreserved = preservedAgentIds.size > 0;
  getUserContext.cache.clear?.();
  getSystemContext.cache.clear?.();
  getGitStatus.cache.clear?.();
  getSessionStartDate.cache.clear?.();
  clearFileSuggestionCaches();
  clearCommandsCache();
  if (!hasPreserved)
    resetPromptCacheBreakDetection();
  setSystemPromptInjection(null);
  setLastEmittedDate(null);
  runPostCompactCleanup();
  resetSentSkillNames();
  resetGetMemoryFilesCache("session_start");
  clearStoredImagePaths();
  clearAllSessions();
  if (!hasPreserved)
    clearAllPendingCallbacks();
  if (process.env.USER_TYPE === "ant") {
    import("./chunk-jx817w05.js").then(({ clearSessionsWithTungstenUsage, resetInitializationState }) => {
      clearSessionsWithTungstenUsage();
      resetInitializationState();
    });
  }
  if (false) {}
  clearRepositoryCaches();
  clearCommandPrefixCaches();
  if (!hasPreserved)
    clearAllDumpState();
  clearInvokedSkills(preservedAgentIds);
  clearResolveGitDirCache();
  clearDynamicSkills();
  resetAllLSPDiagnosticState();
  clearTrackedMagicDocs();
  clearSessionEnvVars();
  import("./chunk-r38exvfz.js").then(({ clearWebFetchCache }) => clearWebFetchCache());
  import("./chunk-8p79yef7.js").then(({ clearToolSearchDescriptionCache }) => clearToolSearchDescriptionCache());
  import("./chunk-08fv1nm6.js").then(({ clearAgentDefinitionsCache }) => clearAgentDefinitionsCache());
  import("./chunk-7507nbpj.js").then(({ clearPromptCache }) => clearPromptCache());
}
var init_caches = __esm(() => {
  init_state();
  init_commands2();
  init_common();
  init_context();
  init_fileSuggestions();
  init_useSwarmPermissionPoller();
  init_dumpPrompts();
  init_promptCacheBreakDetection();
  init_sessionIngress();
  init_postCompactCleanup();
  init_LSPDiagnosticRegistry();
  init_magicDocs();
  init_loadSkillsDir();
  init_attachments();
  init_commands();
  init_claudemd();
  init_detectRepository();
  init_gitFilesystem();
  init_imageStore();
  init_sessionEnvVars();
});

export { clearSessionCaches, init_caches };
