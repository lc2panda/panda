// @bun
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/services/compact/cachedMicrocompact.ts
var isCachedMicrocompactEnabled = () => false, isModelSupportedForCacheEditing = () => false, getCachedMCConfig = () => ({ triggerThreshold: 0, keepRecent: 0 }), createCachedMCState = () => ({
  registeredTools: new Set,
  toolOrder: [],
  deletedRefs: new Set,
  pinnedEdits: [],
  toolsSentToAPI: false
}), markToolsSentToAPI = () => {}, resetCachedMCState = () => {}, registerToolResult = () => {}, registerToolMessage = () => {}, getToolResultsToDelete = () => [], createCacheEditsBlock = () => null;
var init_cachedMicrocompact = () => {};
init_cachedMicrocompact();

export {
  resetCachedMCState,
  registerToolResult,
  registerToolMessage,
  markToolsSentToAPI,
  isModelSupportedForCacheEditing,
  isCachedMicrocompactEnabled,
  getToolResultsToDelete,
  getCachedMCConfig,
  createCachedMCState,
  createCacheEditsBlock
};
