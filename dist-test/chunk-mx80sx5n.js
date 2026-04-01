// @bun
import {
  PermissionDialog
} from "./chunk-xz4dxer0.js";
import {
  SAFE_ENV_VARS
} from "./chunk-x8b7vft8.js";
import {
  BASH_TOOL_NAME,
  Select,
  getMcpConfigsByScope,
  getPermissionRulesForSource,
  gracefulShutdownSync,
  init_CustomSelect,
  init_config as init_config2,
  init_gracefulShutdown,
  init_permissionsLoader,
  init_toolName
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-73qtc7a9.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-2e5y8sgq.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-zz424j25.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import {
  init_useKeybinding,
  useKeybinding
} from "./chunk-x2y5syym.js";
import {
  Link,
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  checkHasTrustDialogAccepted,
  getSettingsForSource,
  init_config1 as init_config,
  init_settings1 as init_settings,
  saveCurrentProjectConfig
} from "./chunk-bt6e264h.js";
import"./chunk-y9h5c3hn.js";
import"./chunk-7rxmkr8t.js";
import"./chunk-vratq94g.js";
import"./chunk-7gjw150h.js";
import"./chunk-0e1xsncc.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-m859hz3m.js";
import"./chunk-55wgxwa9.js";
import"./chunk-n9s3rq14.js";
import"./chunk-4jm600zv.js";
import"./chunk-zfp09a4r.js";
import"./chunk-7ymfj7m3.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-e5n0k9bd.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import"./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import"./chunk-s85yj5xm.js";
import"./chunk-73q6p10n.js";
import"./chunk-8qg6qavk.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-14j8jv5j.js";
import"./chunk-0xqnccz6.js";
import"./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  getFsImplementation,
  init_fsOperations
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import {
  init_state,
  setSessionTrustAccepted
} from "./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/TrustDialog/TrustDialog.tsx
init_analytics();
init_state();
init_useExitOnCtrlCDWithKeybindings();
init_ink();
init_useKeybinding();
init_config2();
init_toolName();
init_config();
init_cwd();
init_fsOperations();
init_gracefulShutdown();
init_CustomSelect();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var import_react = __toESM(require_react(), 1);
import { homedir } from "os";

// src/components/TrustDialog/utils.ts
init_settings();
init_toolName();
init_permissionsLoader();
function hasHooks(settings) {
  if (settings === null || settings.disableAllHooks) {
    return false;
  }
  if (settings.statusLine) {
    return true;
  }
  if (settings.fileSuggestion) {
    return true;
  }
  if (!settings.hooks) {
    return false;
  }
  for (const hookConfig of Object.values(settings.hooks)) {
    if (hookConfig.length > 0) {
      return true;
    }
  }
  return false;
}
function getHooksSources() {
  const sources = [];
  const projectSettings = getSettingsForSource("projectSettings");
  if (hasHooks(projectSettings)) {
    sources.push(".claude/settings.json");
  }
  const localSettings = getSettingsForSource("localSettings");
  if (hasHooks(localSettings)) {
    sources.push(".claude/settings.local.json");
  }
  return sources;
}
function hasBashPermission(rules) {
  return rules.some((rule) => rule.ruleBehavior === "allow" && (rule.ruleValue.toolName === BASH_TOOL_NAME || rule.ruleValue.toolName.startsWith(BASH_TOOL_NAME + "(")));
}
function getBashPermissionSources() {
  const sources = [];
  const projectRules = getPermissionRulesForSource("projectSettings");
  if (hasBashPermission(projectRules)) {
    sources.push(".claude/settings.json");
  }
  const localRules = getPermissionRulesForSource("localSettings");
  if (hasBashPermission(localRules)) {
    sources.push(".claude/settings.local.json");
  }
  return sources;
}
function hasOtelHeadersHelper(settings) {
  return !!settings?.otelHeadersHelper;
}
function getOtelHeadersHelperSources() {
  const sources = [];
  const projectSettings = getSettingsForSource("projectSettings");
  if (hasOtelHeadersHelper(projectSettings)) {
    sources.push(".claude/settings.json");
  }
  const localSettings = getSettingsForSource("localSettings");
  if (hasOtelHeadersHelper(localSettings)) {
    sources.push(".claude/settings.local.json");
  }
  return sources;
}
function hasApiKeyHelper(settings) {
  return !!settings?.apiKeyHelper;
}
function getApiKeyHelperSources() {
  const sources = [];
  const projectSettings = getSettingsForSource("projectSettings");
  if (hasApiKeyHelper(projectSettings)) {
    sources.push(".claude/settings.json");
  }
  const localSettings = getSettingsForSource("localSettings");
  if (hasApiKeyHelper(localSettings)) {
    sources.push(".claude/settings.local.json");
  }
  return sources;
}
function hasAwsCommands(settings) {
  return !!(settings?.awsAuthRefresh || settings?.awsCredentialExport);
}
function getAwsCommandsSources() {
  const sources = [];
  const projectSettings = getSettingsForSource("projectSettings");
  if (hasAwsCommands(projectSettings)) {
    sources.push(".claude/settings.json");
  }
  const localSettings = getSettingsForSource("localSettings");
  if (hasAwsCommands(localSettings)) {
    sources.push(".claude/settings.local.json");
  }
  return sources;
}
function hasGcpCommands(settings) {
  return !!settings?.gcpAuthRefresh;
}
function getGcpCommandsSources() {
  const sources = [];
  const projectSettings = getSettingsForSource("projectSettings");
  if (hasGcpCommands(projectSettings)) {
    sources.push(".claude/settings.json");
  }
  const localSettings = getSettingsForSource("localSettings");
  if (hasGcpCommands(localSettings)) {
    sources.push(".claude/settings.local.json");
  }
  return sources;
}
function hasDangerousEnvVars(settings) {
  if (!settings?.env) {
    return false;
  }
  return Object.keys(settings.env).some((key) => !SAFE_ENV_VARS.has(key.toUpperCase()));
}
function getDangerousEnvVarsSources() {
  const sources = [];
  const projectSettings = getSettingsForSource("projectSettings");
  if (hasDangerousEnvVars(projectSettings)) {
    sources.push(".claude/settings.json");
  }
  const localSettings = getSettingsForSource("localSettings");
  if (hasDangerousEnvVars(localSettings)) {
    sources.push(".claude/settings.local.json");
  }
  return sources;
}

// src/components/TrustDialog/TrustDialog.tsx
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
function TrustDialog(t0) {
  const $ = import_compiler_runtime.c(33);
  const {
    onDone,
    commands
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getMcpConfigsByScope("project");
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const {
    servers: projectServers
  } = t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = Object.keys(projectServers);
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const hasMcpServers = t2.length > 0;
  let t3;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = getHooksSources();
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const hooksSettingSources = t3;
  const hasHooks2 = hooksSettingSources.length > 0;
  let t4;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = getBashPermissionSources();
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  const bashSettingSources = t4;
  let t5;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = getApiKeyHelperSources();
    $[4] = t5;
  } else {
    t5 = $[4];
  }
  const apiKeyHelperSources = t5;
  const hasApiKeyHelper2 = apiKeyHelperSources.length > 0;
  let t6;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = getAwsCommandsSources();
    $[5] = t6;
  } else {
    t6 = $[5];
  }
  const awsCommandsSources = t6;
  const hasAwsCommands2 = awsCommandsSources.length > 0;
  let t7;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = getGcpCommandsSources();
    $[6] = t7;
  } else {
    t7 = $[6];
  }
  const gcpCommandsSources = t7;
  const hasGcpCommands2 = gcpCommandsSources.length > 0;
  let t8;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = getOtelHeadersHelperSources();
    $[7] = t8;
  } else {
    t8 = $[7];
  }
  const otelHeadersHelperSources = t8;
  const hasOtelHeadersHelper2 = otelHeadersHelperSources.length > 0;
  let t9;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = getDangerousEnvVarsSources();
    $[8] = t9;
  } else {
    t9 = $[8];
  }
  const dangerousEnvVarsSources = t9;
  const hasDangerousEnvVars2 = dangerousEnvVarsSources.length > 0;
  let t10;
  if ($[9] !== commands) {
    t10 = commands?.some(_temp2) ?? false;
    $[9] = commands;
    $[10] = t10;
  } else {
    t10 = $[10];
  }
  const hasSlashCommandBash = t10;
  let t11;
  if ($[11] !== commands) {
    t11 = commands?.some(_temp4) ?? false;
    $[11] = commands;
    $[12] = t11;
  } else {
    t11 = $[12];
  }
  const hasSkillsBash = t11;
  const hasAnyBashExecution = bashSettingSources.length > 0 || hasSlashCommandBash || hasSkillsBash;
  const hasTrustDialogAccepted = checkHasTrustDialogAccepted();
  let t12;
  let t13;
  if ($[13] !== hasAnyBashExecution) {
    t12 = () => {
      const isHomeDir = homedir() === getCwd();
      logEvent("tengu_trust_dialog_shown", {
        isHomeDir,
        hasMcpServers,
        hasHooks: hasHooks2,
        hasBashExecution: hasAnyBashExecution,
        hasApiKeyHelper: hasApiKeyHelper2,
        hasAwsCommands: hasAwsCommands2,
        hasGcpCommands: hasGcpCommands2,
        hasOtelHeadersHelper: hasOtelHeadersHelper2,
        hasDangerousEnvVars: hasDangerousEnvVars2
      });
    };
    t13 = [hasMcpServers, hasHooks2, hasAnyBashExecution, hasApiKeyHelper2, hasAwsCommands2, hasGcpCommands2, hasOtelHeadersHelper2, hasDangerousEnvVars2];
    $[13] = hasAnyBashExecution;
    $[14] = t12;
    $[15] = t13;
  } else {
    t12 = $[14];
    t13 = $[15];
  }
  import_react.default.useEffect(t12, t13);
  let t14;
  if ($[16] !== hasAnyBashExecution || $[17] !== onDone) {
    t14 = function onChange2(value) {
      if (value === "exit") {
        gracefulShutdownSync(1);
        return;
      }
      const isHomeDir_0 = homedir() === getCwd();
      logEvent("tengu_trust_dialog_accept", {
        isHomeDir: isHomeDir_0,
        hasMcpServers,
        hasHooks: hasHooks2,
        hasBashExecution: hasAnyBashExecution,
        hasApiKeyHelper: hasApiKeyHelper2,
        hasAwsCommands: hasAwsCommands2,
        hasGcpCommands: hasGcpCommands2,
        hasOtelHeadersHelper: hasOtelHeadersHelper2,
        hasDangerousEnvVars: hasDangerousEnvVars2
      });
      if (isHomeDir_0) {
        setSessionTrustAccepted(true);
      } else {
        saveCurrentProjectConfig(_temp5);
      }
      onDone();
    };
    $[16] = hasAnyBashExecution;
    $[17] = onDone;
    $[18] = t14;
  } else {
    t14 = $[18];
  }
  const onChange = t14;
  const exitState = useExitOnCtrlCDWithKeybindings(_temp6);
  let t15;
  if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
    t15 = {
      context: "Confirmation"
    };
    $[19] = t15;
  } else {
    t15 = $[19];
  }
  useKeybinding("confirm:no", _temp7, t15);
  if (hasTrustDialogAccepted) {
    setTimeout(onDone);
    return null;
  }
  let t16;
  let t17;
  let t18;
  if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
    t16 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: getFsImplementation().cwd()
    }, undefined, false, undefined, this);
    t17 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "Quick safety check: Is this a project you created or one you trust? (Like your own code, a well-known open source project, or work from your team). If not, take a moment to review what",
        "'",
        "s in this folder first."
      ]
    }, undefined, true, undefined, this);
    t18 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "Panda Code",
        "'",
        "ll be able to read, edit, and execute files here."
      ]
    }, undefined, true, undefined, this);
    $[20] = t16;
    $[21] = t17;
    $[22] = t18;
  } else {
    t16 = $[20];
    t17 = $[21];
    t18 = $[22];
  }
  let t19;
  if ($[23] === Symbol.for("react.memo_cache_sentinel")) {
    t19 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
        url: "https://code.claude.com/docs/en/security",
        children: "Security guide"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[23] = t19;
  } else {
    t19 = $[23];
  }
  let t20;
  if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
    t20 = [{
      label: "Yes, I trust this folder",
      value: "enable_all"
    }, {
      label: "No, exit",
      value: "exit"
    }];
    $[24] = t20;
  } else {
    t20 = $[24];
  }
  let t21;
  if ($[25] !== onChange) {
    t21 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      options: t20,
      onChange: (value_0) => onChange(value_0),
      onCancel: () => onChange("exit")
    }, undefined, false, undefined, this);
    $[25] = onChange;
    $[26] = t21;
  } else {
    t21 = $[26];
  }
  let t22;
  if ($[27] !== exitState.keyName || $[28] !== exitState.pending) {
    t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
        children: [
          "Press ",
          exitState.keyName,
          " again to exit"
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
        children: "Enter to confirm \xB7 Esc to cancel"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[27] = exitState.keyName;
    $[28] = exitState.pending;
    $[29] = t22;
  } else {
    t22 = $[29];
  }
  let t23;
  if ($[30] !== t21 || $[31] !== t22) {
    t23 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(PermissionDialog, {
      color: "warning",
      titleColor: "warning",
      title: "Accessing workspace:",
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        paddingTop: 1,
        children: [
          t16,
          t17,
          t18,
          t19,
          t21,
          t22
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[30] = t21;
    $[31] = t22;
    $[32] = t23;
  } else {
    t23 = $[32];
  }
  return t23;
}
function _temp7() {
  gracefulShutdownSync(0);
}
function _temp6() {
  return gracefulShutdownSync(1);
}
function _temp5(current) {
  return {
    ...current,
    hasTrustDialogAccepted: true
  };
}
function _temp4(command_0) {
  return command_0.type === "prompt" && (command_0.loadedFrom === "skills" || command_0.loadedFrom === "plugin") && (command_0.source === "projectSettings" || command_0.source === "localSettings" || command_0.source === "plugin") && command_0.allowedTools?.some(_temp3);
}
function _temp3(tool_0) {
  return tool_0 === BASH_TOOL_NAME || tool_0.startsWith(BASH_TOOL_NAME + "(");
}
function _temp2(command) {
  return command.type === "prompt" && command.loadedFrom === "commands_DEPRECATED" && (command.source === "projectSettings" || command.source === "localSettings") && command.allowedTools?.some(_temp);
}
function _temp(tool) {
  return tool === BASH_TOOL_NAME || tool.startsWith(BASH_TOOL_NAME + "(");
}
export {
  TrustDialog
};
