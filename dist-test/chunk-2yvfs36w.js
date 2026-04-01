// @bun
import {
  createDisabledBypassPermissionsContext,
  init_AppState,
  init_permissionSetup,
  shouldDisableBypassPermissions,
  useAppState,
  useAppStateStore,
  useSetAppState
} from "./chunk-wk0emb79.js";
import {
  require_react
} from "./chunk-g338npwr.js";
import {
  getIsRemoteMode,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/utils/permissions/bypassPermissionsKillswitch.ts
async function checkAndDisableBypassPermissionsIfNeeded(toolPermissionContext, setAppState) {
  if (bypassPermissionsCheckRan) {
    return;
  }
  bypassPermissionsCheckRan = true;
  if (!toolPermissionContext.isBypassPermissionsModeAvailable) {
    return;
  }
  const shouldDisable = await shouldDisableBypassPermissions();
  if (!shouldDisable) {
    return;
  }
  setAppState((prev) => {
    return {
      ...prev,
      toolPermissionContext: createDisabledBypassPermissionsContext(prev.toolPermissionContext)
    };
  });
}
function resetBypassPermissionsCheck() {
  bypassPermissionsCheckRan = false;
}
function useKickOffCheckAndDisableBypassPermissionsIfNeeded() {
  const toolPermissionContext = useAppState((s) => s.toolPermissionContext);
  const setAppState = useSetAppState();
  import_react.useEffect(() => {
    if (getIsRemoteMode())
      return;
    checkAndDisableBypassPermissionsIfNeeded(toolPermissionContext, setAppState);
  }, []);
}
async function checkAndDisableAutoModeIfNeeded(toolPermissionContext, setAppState, fastMode) {
  if (false) {}
}
function resetAutoModeGateCheck() {
  autoModeCheckRan = false;
}
function useKickOffCheckAndDisableAutoModeIfNeeded() {
  const mainLoopModel = useAppState((s) => s.mainLoopModel);
  const mainLoopModelForSession = useAppState((s) => s.mainLoopModelForSession);
  const fastMode = useAppState((s) => s.fastMode);
  const setAppState = useSetAppState();
  const store = useAppStateStore();
  const isFirstRunRef = import_react.useRef(true);
  import_react.useEffect(() => {
    if (getIsRemoteMode())
      return;
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
    } else {
      resetAutoModeGateCheck();
    }
    checkAndDisableAutoModeIfNeeded(store.getState().toolPermissionContext, setAppState, fastMode);
  }, [mainLoopModel, mainLoopModelForSession, fastMode]);
}
var import_react, bypassPermissionsCheckRan = false, autoModeCheckRan = false;
var init_bypassPermissionsKillswitch = __esm(() => {
  init_AppState();
  init_state();
  init_permissionSetup();
  import_react = __toESM(require_react(), 1);
});

export { checkAndDisableBypassPermissionsIfNeeded, resetBypassPermissionsCheck, useKickOffCheckAndDisableBypassPermissionsIfNeeded, useKickOffCheckAndDisableAutoModeIfNeeded, init_bypassPermissionsKillswitch };
