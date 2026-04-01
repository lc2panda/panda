// @bun
import {
  checkAndDisableBypassPermissionsIfNeeded,
  init_bypassPermissionsKillswitch,
  resetBypassPermissionsCheck
} from "./chunk-1ycmdvzz.js";
import {
  init_useMainLoopModel,
  useMainLoopModel
} from "./chunk-y4tgrnzg.js";
import {
  ConsoleOAuthFlow,
  init_ConsoleOAuthFlow,
  init_messages1 as init_messages,
  init_policyLimits,
  init_remoteManagedSettings,
  refreshPolicyLimits,
  refreshRemoteManagedSettings,
  stripSignatureBlocks
} from "./chunk-jwtmq3ad.js";
import {
  clearTrustedDeviceToken,
  enrollTrustedDevice,
  init_trustedDevice
} from "./chunk-mxbr8dgb.js";
import {
  ConfigurableShortcutHint,
  Dialog,
  init_ConfigurableShortcutHint,
  init_Dialog
} from "./chunk-px2n7q1y.js";
import {
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import {
  init_growthbook,
  init_user,
  refreshGrowthBookAfterAuthChange,
  resetUserCache
} from "./chunk-bt6e264h.js";
import {
  init_state,
  resetCostState
} from "./chunk-24stks7b.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/login/login.tsx
async function call(onDone, context) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Login, {
    onDone: async (success) => {
      context.onChangeAPIKey();
      context.setMessages(stripSignatureBlocks);
      if (success) {
        resetCostState();
        refreshRemoteManagedSettings();
        refreshPolicyLimits();
        resetUserCache();
        refreshGrowthBookAfterAuthChange();
        clearTrustedDeviceToken();
        enrollTrustedDevice();
        resetBypassPermissionsCheck();
        const appState = context.getAppState();
        checkAndDisableBypassPermissionsIfNeeded(appState.toolPermissionContext, context.setAppState);
        if (false) {}
        context.setAppState((prev) => ({
          ...prev,
          authVersion: prev.authVersion + 1
        }));
      }
      onDone(success ? "Login successful" : "Login interrupted");
    }
  }, undefined, false, undefined, this);
}
function Login(props) {
  const $ = import_compiler_runtime.c(12);
  const mainLoopModel = useMainLoopModel();
  let t0;
  if ($[0] !== mainLoopModel || $[1] !== props) {
    t0 = () => props.onDone(false, mainLoopModel);
    $[0] = mainLoopModel;
    $[1] = props;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  let t1;
  if ($[3] !== mainLoopModel || $[4] !== props) {
    t1 = () => props.onDone(true, mainLoopModel);
    $[3] = mainLoopModel;
    $[4] = props;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  let t2;
  if ($[6] !== props.startingMessage || $[7] !== t1) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConsoleOAuthFlow, {
      onDone: t1,
      startingMessage: props.startingMessage
    }, undefined, false, undefined, this);
    $[6] = props.startingMessage;
    $[7] = t1;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  let t3;
  if ($[9] !== t0 || $[10] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Login",
      onCancel: t0,
      color: "permission",
      inputGuide: _temp,
      children: t2
    }, undefined, false, undefined, this);
    $[9] = t0;
    $[10] = t2;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  return t3;
}
function _temp(exitState) {
  return exitState.pending ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
    children: [
      "Press ",
      exitState.keyName,
      " again to exit"
    ]
  }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
    action: "confirm:no",
    context: "Confirmation",
    fallback: "Esc",
    description: "cancel"
  }, undefined, false, undefined, this);
}
var import_compiler_runtime, jsx_dev_runtime;
var init_login = __esm(() => {
  init_state();
  init_trustedDevice();
  init_ConfigurableShortcutHint();
  init_ConsoleOAuthFlow();
  init_Dialog();
  init_useMainLoopModel();
  init_ink();
  init_growthbook();
  init_policyLimits();
  init_remoteManagedSettings();
  init_messages();
  init_bypassPermissionsKillswitch();
  init_user();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { call, Login, init_login };
