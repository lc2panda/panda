// @bun
import {
  init_toolPool,
  mergeAndFilterTools
} from "./chunk-k6m09ga9.js";
import {
  assembleToolPool,
  init_tools1 as init_tools
} from "./chunk-jwtmq3ad.js";
import {
  require_react
} from "./chunk-g338npwr.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/hooks/useMergedTools.ts
function useMergedTools(initialTools, mcpTools, toolPermissionContext) {
  let replBridgeEnabled = false;
  let replBridgeOutboundOnly = false;
  return import_react.useMemo(() => {
    const assembled = assembleToolPool(toolPermissionContext, mcpTools);
    return mergeAndFilterTools(initialTools, assembled, toolPermissionContext.mode);
  }, [
    initialTools,
    mcpTools,
    toolPermissionContext,
    replBridgeEnabled,
    replBridgeOutboundOnly
  ]);
}
var import_react;
var init_useMergedTools = __esm(() => {
  init_tools();
  init_toolPool();
  import_react = __toESM(require_react(), 1);
});

export { useMergedTools, init_useMergedTools };
