// @bun
import {
  ValidationErrorsList,
  init_ValidationErrorsList
} from "./chunk-esj8r2se.js";
import {
  init_useSettingsErrors,
  useSettingsErrors
} from "./chunk-bh7asme0.js";
import {
  PressEnterToContinue,
  init_PressEnterToContinue
} from "./chunk-2m13bh48.js";
import {
  detectUnreachableRules,
  init_shadowedRuleDetection
} from "./chunk-dpj3j7gj.js";
import {
  AGENT_DESCRIPTIONS_THRESHOLD,
  getAgentDescriptionsTotalTokens,
  init_statusNoticeHelpers
} from "./chunk-wsp9dpe6.js";
import {
  McpParsingWarnings,
  init_McpParsingWarnings
} from "./chunk-1wjvjt6x.js";
import {
  BASH_MAX_OUTPUT_DEFAULT,
  BASH_MAX_OUTPUT_UPPER_LIMIT,
  MAX_MEMORY_CHARACTER_COUNT,
  SandboxManager,
  TASK_MAX_OUTPUT_DEFAULT,
  TASK_MAX_OUTPUT_UPPER_LIMIT,
  cleanupStaleLocks,
  countMcpToolTokens,
  getAllLockInfo,
  getCachedKeybindingWarnings,
  getDoctorDiagnostic,
  getGcsDistTags,
  getKeybindingsPath,
  getLargeMemoryFiles,
  getMemoryFiles,
  getNpmDistTags,
  getPluginErrorMessage,
  getXDGStateHome,
  init_AppState,
  init_analyzeContext,
  init_autoUpdater,
  init_claudemd,
  init_doctorDiagnostic,
  init_envValidation,
  init_loadUserBindings,
  init_outputFormatting,
  init_outputLimits,
  init_pidLock,
  init_plugin,
  init_sandbox_adapter,
  init_tokenEstimation,
  init_xdg,
  isKeybindingCustomizationEnabled,
  isPidBasedLockingEnabled,
  roughTokenCountEstimation,
  useAppState,
  validateBoundedIntEnvVar
} from "./chunk-ekfe4t3x.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-2hb5pyjj.js";
import {
  Pane,
  init_Pane,
  init_useKeybinding,
  useKeybindings
} from "./chunk-gypetngm.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  getInitialSettings,
  getMainLoopModel,
  getModelMaxOutputTokens,
  init_context,
  init_file,
  init_model,
  init_permissionRuleParser,
  init_settings1 as init_settings,
  init_stringUtils,
  pathExists,
  permissionRuleValueToString,
  plural
} from "./chunk-w5d5b7r0.js";
import {
  figures_default,
  init_figures
} from "./chunk-ehab6nmr.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils
} from "./chunk-er95axp1.js";
import {
  getOriginalCwd,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/KeybindingWarnings.tsx
function KeybindingWarnings() {
  const $ = import_compiler_runtime.c(2);
  if (!isKeybindingCustomizationEnabled()) {
    return null;
  }
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const warnings = getCachedKeybindingWarnings();
      if (warnings.length === 0) {
        t1 = null;
        break bb0;
      }
      const errors = warnings.filter(_temp);
      const warns = warnings.filter(_temp2);
      t0 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        marginTop: 1,
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            bold: true,
            color: errors.length > 0 ? "error" : "warning",
            children: "Keybinding Configuration Issues"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: "Location: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: getKeybindingsPath()
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginLeft: 1,
            flexDirection: "column",
            marginTop: 1,
            children: [
              errors.map(_temp3),
              warns.map(_temp4)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
    }
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  return t0;
}
function _temp4(warning, i_0) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: "\u2514 "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "warning",
            children: "[Warning]"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              " ",
              warning.message
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      warning.suggestion && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        marginLeft: 3,
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "\u2192 ",
            warning.suggestion
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, `warning-${i_0}`, true, undefined, this);
}
function _temp3(error, i) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: "\u2514 "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "error",
            children: "[Error]"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              " ",
              error.message
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      error.suggestion && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        marginLeft: 3,
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "\u2192 ",
            error.suggestion
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, `error-${i}`, true, undefined, this);
}
function _temp2(w_0) {
  return w_0.severity === "warning";
}
function _temp(w) {
  return w.severity === "error";
}
var import_compiler_runtime, jsx_dev_runtime;
var init_KeybindingWarnings = __esm(() => {
  init_ink();
  init_loadUserBindings();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/sandbox/SandboxDoctorSection.tsx
function SandboxDoctorSection() {
  const $ = import_compiler_runtime2.c(2);
  if (!SandboxManager.isSupportedPlatform()) {
    return null;
  }
  if (!SandboxManager.isSandboxEnabledInSettings()) {
    return null;
  }
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const depCheck = SandboxManager.checkDependencies();
      const hasErrors = depCheck.errors.length > 0;
      const hasWarnings = depCheck.warnings.length > 0;
      if (!hasErrors && !hasWarnings) {
        t1 = null;
        break bb0;
      }
      const statusColor = hasErrors ? "error" : "warning";
      const statusText = hasErrors ? "Missing dependencies" : "Available (with warnings)";
      t0 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            bold: true,
            children: "Sandbox"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            children: [
              "\u2514 Status: ",
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                color: statusColor,
                children: statusText
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          depCheck.errors.map(_temp5),
          depCheck.warnings.map(_temp22),
          hasErrors && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: true,
            children: "\u2514 Run /sandbox for install instructions"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
    }
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  return t0;
}
function _temp22(w, i_0) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
    color: "warning",
    children: [
      "\u2514 ",
      w
    ]
  }, i_0, true, undefined, this);
}
function _temp5(e, i) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
    color: "error",
    children: [
      "\u2514 ",
      e
    ]
  }, i, true, undefined, this);
}
var import_compiler_runtime2, jsx_dev_runtime2;
var init_SandboxDoctorSection = __esm(() => {
  init_ink();
  init_sandbox_adapter();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/utils/doctorContextWarnings.ts
async function checkClaudeMdFiles() {
  const largeFiles = getLargeMemoryFiles(await getMemoryFiles());
  if (largeFiles.length === 0) {
    return null;
  }
  const details = largeFiles.sort((a, b) => b.content.length - a.content.length).map((file) => `${file.path}: ${file.content.length.toLocaleString()} chars`);
  const message = largeFiles.length === 1 ? `Large CLAUDE.md file detected (${largeFiles[0].content.length.toLocaleString()} chars > ${MAX_MEMORY_CHARACTER_COUNT.toLocaleString()})` : `${largeFiles.length} large CLAUDE.md files detected (each > ${MAX_MEMORY_CHARACTER_COUNT.toLocaleString()} chars)`;
  return {
    type: "claudemd_files",
    severity: "warning",
    message,
    details,
    currentValue: largeFiles.length,
    threshold: MAX_MEMORY_CHARACTER_COUNT
  };
}
async function checkAgentDescriptions(agentInfo) {
  if (!agentInfo) {
    return null;
  }
  const totalTokens = getAgentDescriptionsTotalTokens(agentInfo);
  if (totalTokens <= AGENT_DESCRIPTIONS_THRESHOLD) {
    return null;
  }
  const agentTokens = agentInfo.activeAgents.filter((a) => a.source !== "built-in").map((agent) => {
    const description = `${agent.agentType}: ${agent.whenToUse}`;
    return {
      name: agent.agentType,
      tokens: roughTokenCountEstimation(description)
    };
  }).sort((a, b) => b.tokens - a.tokens);
  const details = agentTokens.slice(0, 5).map((agent) => `${agent.name}: ~${agent.tokens.toLocaleString()} tokens`);
  if (agentTokens.length > 5) {
    details.push(`(${agentTokens.length - 5} more custom agents)`);
  }
  return {
    type: "agent_descriptions",
    severity: "warning",
    message: `Large agent descriptions (~${totalTokens.toLocaleString()} tokens > ${AGENT_DESCRIPTIONS_THRESHOLD.toLocaleString()})`,
    details,
    currentValue: totalTokens,
    threshold: AGENT_DESCRIPTIONS_THRESHOLD
  };
}
async function checkMcpTools(tools, getToolPermissionContext, agentInfo) {
  const mcpTools = tools.filter((tool) => tool.isMcp);
  if (mcpTools.length === 0) {
    return null;
  }
  try {
    const model = getMainLoopModel();
    const { mcpToolTokens, mcpToolDetails } = await countMcpToolTokens(tools, getToolPermissionContext, agentInfo, model);
    if (mcpToolTokens <= MCP_TOOLS_THRESHOLD) {
      return null;
    }
    const toolsByServer = new Map;
    for (const tool of mcpToolDetails) {
      const parts = tool.name.split("__");
      const serverName = parts[1] || "unknown";
      const current = toolsByServer.get(serverName) || { count: 0, tokens: 0 };
      toolsByServer.set(serverName, {
        count: current.count + 1,
        tokens: current.tokens + tool.tokens
      });
    }
    const sortedServers = Array.from(toolsByServer.entries()).sort((a, b) => b[1].tokens - a[1].tokens);
    const details = sortedServers.slice(0, 5).map(([name, info]) => `${name}: ${info.count} tools (~${info.tokens.toLocaleString()} tokens)`);
    if (sortedServers.length > 5) {
      details.push(`(${sortedServers.length - 5} more servers)`);
    }
    return {
      type: "mcp_tools",
      severity: "warning",
      message: `Large MCP tools context (~${mcpToolTokens.toLocaleString()} tokens > ${MCP_TOOLS_THRESHOLD.toLocaleString()})`,
      details,
      currentValue: mcpToolTokens,
      threshold: MCP_TOOLS_THRESHOLD
    };
  } catch (_error) {
    const estimatedTokens = mcpTools.reduce((total, tool) => {
      const chars = (tool.name?.length || 0) + tool.description.length;
      return total + roughTokenCountEstimation(chars.toString());
    }, 0);
    if (estimatedTokens <= MCP_TOOLS_THRESHOLD) {
      return null;
    }
    return {
      type: "mcp_tools",
      severity: "warning",
      message: `Large MCP tools context (~${estimatedTokens.toLocaleString()} tokens estimated > ${MCP_TOOLS_THRESHOLD.toLocaleString()})`,
      details: [
        `${mcpTools.length} MCP tools detected (token count estimated)`
      ],
      currentValue: estimatedTokens,
      threshold: MCP_TOOLS_THRESHOLD
    };
  }
}
async function checkUnreachableRules(getToolPermissionContext) {
  const context = await getToolPermissionContext();
  const sandboxAutoAllowEnabled = SandboxManager.isSandboxingEnabled() && SandboxManager.isAutoAllowBashIfSandboxedEnabled();
  const unreachable = detectUnreachableRules(context, {
    sandboxAutoAllowEnabled
  });
  if (unreachable.length === 0) {
    return null;
  }
  const details = unreachable.flatMap((r) => [
    `${permissionRuleValueToString(r.rule.ruleValue)}: ${r.reason}`,
    `  Fix: ${r.fix}`
  ]);
  return {
    type: "unreachable_rules",
    severity: "warning",
    message: `${unreachable.length} ${plural(unreachable.length, "unreachable permission rule")} detected`,
    details,
    currentValue: unreachable.length,
    threshold: 0
  };
}
async function checkContextWarnings(tools, agentInfo, getToolPermissionContext) {
  const [claudeMdWarning, agentWarning, mcpWarning, unreachableRulesWarning] = await Promise.all([
    checkClaudeMdFiles(),
    checkAgentDescriptions(agentInfo),
    checkMcpTools(tools, getToolPermissionContext, agentInfo),
    checkUnreachableRules(getToolPermissionContext)
  ]);
  return {
    claudeMdWarning,
    agentWarning,
    mcpWarning,
    unreachableRulesWarning
  };
}
var MCP_TOOLS_THRESHOLD = 25000;
var init_doctorContextWarnings = __esm(() => {
  init_tokenEstimation();
  init_analyzeContext();
  init_claudemd();
  init_model();
  init_permissionRuleParser();
  init_shadowedRuleDetection();
  init_sandbox_adapter();
  init_statusNoticeHelpers();
  init_stringUtils();
});

// src/screens/Doctor.tsx
import { join } from "path";
function DistTagsDisplay(t0) {
  const $ = import_compiler_runtime3.c(8);
  const {
    promise
  } = t0;
  const distTags = import_react.use(promise);
  if (!distTags.latest) {
    let t12;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: "\u2514 Failed to fetch versions"
      }, undefined, false, undefined, this);
      $[0] = t12;
    } else {
      t12 = $[0];
    }
    return t12;
  }
  let t1;
  if ($[1] !== distTags.stable) {
    t1 = distTags.stable && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Stable version: ",
        distTags.stable
      ]
    }, undefined, true, undefined, this);
    $[1] = distTags.stable;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== distTags.latest) {
    t2 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Latest version: ",
        distTags.latest
      ]
    }, undefined, true, undefined, this);
    $[3] = distTags.latest;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== t1 || $[6] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
      children: [
        t1,
        t2
      ]
    }, undefined, true, undefined, this);
    $[5] = t1;
    $[6] = t2;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  return t3;
}
function Doctor(t0) {
  const $ = import_compiler_runtime3.c(84);
  const {
    onDone
  } = t0;
  const agentDefinitions = useAppState(_temp19);
  const mcpTools = useAppState(_temp23);
  const toolPermissionContext = useAppState(_temp32);
  const pluginsErrors = useAppState(_temp42);
  useExitOnCtrlCDWithKeybindings();
  let t1;
  if ($[0] !== mcpTools) {
    t1 = mcpTools || [];
    $[0] = mcpTools;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const tools = t1;
  const [diagnostic, setDiagnostic] = import_react.useState(null);
  const [agentInfo, setAgentInfo] = import_react.useState(null);
  const [contextWarnings, setContextWarnings] = import_react.useState(null);
  const [versionLockInfo, setVersionLockInfo] = import_react.useState(null);
  const validationErrors = useSettingsErrors();
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = getDoctorDiagnostic().then(_temp6);
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const distTagsPromise = t2;
  const autoUpdatesChannel = getInitialSettings()?.autoUpdatesChannel ?? "latest";
  let t3;
  if ($[3] !== validationErrors) {
    t3 = validationErrors.filter(_temp7);
    $[3] = validationErrors;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const errorsExcludingMcp = t3;
  let t4;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    const envVars = [{
      name: "BASH_MAX_OUTPUT_LENGTH",
      default: BASH_MAX_OUTPUT_DEFAULT,
      upperLimit: BASH_MAX_OUTPUT_UPPER_LIMIT
    }, {
      name: "TASK_MAX_OUTPUT_LENGTH",
      default: TASK_MAX_OUTPUT_DEFAULT,
      upperLimit: TASK_MAX_OUTPUT_UPPER_LIMIT
    }, {
      name: "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
      ...getModelMaxOutputTokens("claude-opus-4-6")
    }];
    t4 = envVars.map(_temp8).filter(_temp9);
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const envValidationErrors = t4;
  let t5;
  let t6;
  if ($[6] !== agentDefinitions || $[7] !== toolPermissionContext || $[8] !== tools) {
    t5 = () => {
      getDoctorDiagnostic().then(setDiagnostic);
      (async () => {
        const userAgentsDir = join(getClaudeConfigHomeDir(), "agents");
        const projectAgentsDir = join(getOriginalCwd(), ".pandacc", "agents");
        const {
          activeAgents,
          allAgents,
          failedFiles
        } = agentDefinitions;
        const [userDirExists, projectDirExists] = await Promise.all([pathExists(userAgentsDir), pathExists(projectAgentsDir)]);
        const agentInfoData = {
          activeAgents: activeAgents.map(_temp0),
          userAgentsDir,
          projectAgentsDir,
          userDirExists,
          projectDirExists,
          failedFiles
        };
        setAgentInfo(agentInfoData);
        const warnings = await checkContextWarnings(tools, {
          activeAgents,
          allAgents,
          failedFiles
        }, async () => toolPermissionContext);
        setContextWarnings(warnings);
        if (isPidBasedLockingEnabled()) {
          const locksDir = join(getXDGStateHome(), "claude", "locks");
          const staleLocksCleaned = cleanupStaleLocks(locksDir);
          const locks = getAllLockInfo(locksDir);
          setVersionLockInfo({
            enabled: true,
            locks,
            locksDir,
            staleLocksCleaned
          });
        } else {
          setVersionLockInfo({
            enabled: false,
            locks: [],
            locksDir: "",
            staleLocksCleaned: 0
          });
        }
      })();
    };
    t6 = [toolPermissionContext, tools, agentDefinitions];
    $[6] = agentDefinitions;
    $[7] = toolPermissionContext;
    $[8] = tools;
    $[9] = t5;
    $[10] = t6;
  } else {
    t5 = $[9];
    t6 = $[10];
  }
  import_react.useEffect(t5, t6);
  let t7;
  if ($[11] !== onDone) {
    t7 = () => {
      onDone("Panda Code diagnostics dismissed", {
        display: "system"
      });
    };
    $[11] = onDone;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  const handleDismiss = t7;
  let t8;
  if ($[13] !== handleDismiss) {
    t8 = {
      "confirm:yes": handleDismiss,
      "confirm:no": handleDismiss
    };
    $[13] = handleDismiss;
    $[14] = t8;
  } else {
    t8 = $[14];
  }
  let t9;
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = {
      context: "Confirmation"
    };
    $[15] = t9;
  } else {
    t9 = $[15];
  }
  useKeybindings(t8, t9);
  if (!diagnostic) {
    let t102;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      t102 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Pane, {
        children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          dimColor: true,
          children: "Checking installation status\u2026"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[16] = t102;
    } else {
      t102 = $[16];
    }
    return t102;
  }
  let t10;
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      bold: true,
      children: "Diagnostics"
    }, undefined, false, undefined, this);
    $[17] = t10;
  } else {
    t10 = $[17];
  }
  let t11;
  if ($[18] !== diagnostic.installationType || $[19] !== diagnostic.version) {
    t11 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Currently running: ",
        diagnostic.installationType,
        " (",
        diagnostic.version,
        ")"
      ]
    }, undefined, true, undefined, this);
    $[18] = diagnostic.installationType;
    $[19] = diagnostic.version;
    $[20] = t11;
  } else {
    t11 = $[20];
  }
  let t12;
  if ($[21] !== diagnostic.packageManager) {
    t12 = diagnostic.packageManager && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Package manager: ",
        diagnostic.packageManager
      ]
    }, undefined, true, undefined, this);
    $[21] = diagnostic.packageManager;
    $[22] = t12;
  } else {
    t12 = $[22];
  }
  let t13;
  if ($[23] !== diagnostic.installationPath) {
    t13 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Path: ",
        diagnostic.installationPath
      ]
    }, undefined, true, undefined, this);
    $[23] = diagnostic.installationPath;
    $[24] = t13;
  } else {
    t13 = $[24];
  }
  let t14;
  if ($[25] !== diagnostic.invokedBinary) {
    t14 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Invoked: ",
        diagnostic.invokedBinary
      ]
    }, undefined, true, undefined, this);
    $[25] = diagnostic.invokedBinary;
    $[26] = t14;
  } else {
    t14 = $[26];
  }
  let t15;
  if ($[27] !== diagnostic.configInstallMethod) {
    t15 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Config install method: ",
        diagnostic.configInstallMethod
      ]
    }, undefined, true, undefined, this);
    $[27] = diagnostic.configInstallMethod;
    $[28] = t15;
  } else {
    t15 = $[28];
  }
  const t16 = diagnostic.ripgrepStatus.working ? "OK" : "Not working";
  const t17 = diagnostic.ripgrepStatus.mode === "embedded" ? "bundled" : diagnostic.ripgrepStatus.mode === "builtin" ? "vendor" : diagnostic.ripgrepStatus.systemPath || "system";
  let t18;
  if ($[29] !== t16 || $[30] !== t17) {
    t18 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Search: ",
        t16,
        " (",
        t17,
        ")"
      ]
    }, undefined, true, undefined, this);
    $[29] = t16;
    $[30] = t17;
    $[31] = t18;
  } else {
    t18 = $[31];
  }
  let t19;
  if ($[32] !== diagnostic.recommendation) {
    t19 = diagnostic.recommendation && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {}, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          color: "warning",
          children: [
            "Recommendation: ",
            diagnostic.recommendation.split(`
`)[0]
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          dimColor: true,
          children: diagnostic.recommendation.split(`
`)[1]
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[32] = diagnostic.recommendation;
    $[33] = t19;
  } else {
    t19 = $[33];
  }
  let t20;
  if ($[34] !== diagnostic.multipleInstallations) {
    t20 = diagnostic.multipleInstallations.length > 1 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {}, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          color: "warning",
          children: "Warning: Multiple installations found"
        }, undefined, false, undefined, this),
        diagnostic.multipleInstallations.map(_temp1)
      ]
    }, undefined, true, undefined, this);
    $[34] = diagnostic.multipleInstallations;
    $[35] = t20;
  } else {
    t20 = $[35];
  }
  let t21;
  if ($[36] !== diagnostic.warnings) {
    t21 = diagnostic.warnings.length > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {}, undefined, false, undefined, this),
        diagnostic.warnings.map(_temp10)
      ]
    }, undefined, true, undefined, this);
    $[36] = diagnostic.warnings;
    $[37] = t21;
  } else {
    t21 = $[37];
  }
  let t22;
  if ($[38] !== errorsExcludingMcp) {
    t22 = errorsExcludingMcp.length > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          bold: true,
          children: "Invalid Settings"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ValidationErrorsList, {
          errors: errorsExcludingMcp
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[38] = errorsExcludingMcp;
    $[39] = t22;
  } else {
    t22 = $[39];
  }
  let t23;
  if ($[40] !== t11 || $[41] !== t12 || $[42] !== t13 || $[43] !== t14 || $[44] !== t15 || $[45] !== t18 || $[46] !== t19 || $[47] !== t20 || $[48] !== t21 || $[49] !== t22) {
    t23 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t10,
        t11,
        t12,
        t13,
        t14,
        t15,
        t18,
        t19,
        t20,
        t21,
        t22
      ]
    }, undefined, true, undefined, this);
    $[40] = t11;
    $[41] = t12;
    $[42] = t13;
    $[43] = t14;
    $[44] = t15;
    $[45] = t18;
    $[46] = t19;
    $[47] = t20;
    $[48] = t21;
    $[49] = t22;
    $[50] = t23;
  } else {
    t23 = $[50];
  }
  let t24;
  if ($[51] === Symbol.for("react.memo_cache_sentinel")) {
    t24 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      bold: true,
      children: "Updates"
    }, undefined, false, undefined, this);
    $[51] = t24;
  } else {
    t24 = $[51];
  }
  const t25 = diagnostic.packageManager ? "Managed by package manager" : diagnostic.autoUpdates;
  let t26;
  if ($[52] !== t25) {
    t26 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Auto-updates:",
        " ",
        t25
      ]
    }, undefined, true, undefined, this);
    $[52] = t25;
    $[53] = t26;
  } else {
    t26 = $[53];
  }
  let t27;
  if ($[54] !== diagnostic.hasUpdatePermissions) {
    t27 = diagnostic.hasUpdatePermissions !== null && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Update permissions:",
        " ",
        diagnostic.hasUpdatePermissions ? "Yes" : "No (requires sudo)"
      ]
    }, undefined, true, undefined, this);
    $[54] = diagnostic.hasUpdatePermissions;
    $[55] = t27;
  } else {
    t27 = $[55];
  }
  let t28;
  if ($[56] === Symbol.for("react.memo_cache_sentinel")) {
    t28 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "\u2514 Auto-update channel: ",
        autoUpdatesChannel
      ]
    }, undefined, true, undefined, this);
    $[56] = t28;
  } else {
    t28 = $[56];
  }
  let t29;
  if ($[57] === Symbol.for("react.memo_cache_sentinel")) {
    t29 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(import_react.Suspense, {
      fallback: null,
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(DistTagsDisplay, {
        promise: distTagsPromise
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[57] = t29;
  } else {
    t29 = $[57];
  }
  let t30;
  if ($[58] !== t26 || $[59] !== t27) {
    t30 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t24,
        t26,
        t27,
        t28,
        t29
      ]
    }, undefined, true, undefined, this);
    $[58] = t26;
    $[59] = t27;
    $[60] = t30;
  } else {
    t30 = $[60];
  }
  let t31;
  let t32;
  let t33;
  let t34;
  if ($[61] === Symbol.for("react.memo_cache_sentinel")) {
    t31 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(SandboxDoctorSection, {}, undefined, false, undefined, this);
    t32 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(McpParsingWarnings, {}, undefined, false, undefined, this);
    t33 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(KeybindingWarnings, {}, undefined, false, undefined, this);
    t34 = envValidationErrors.length > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          bold: true,
          children: "Environment Variables"
        }, undefined, false, undefined, this),
        envValidationErrors.map(_temp11)
      ]
    }, undefined, true, undefined, this);
    $[61] = t31;
    $[62] = t32;
    $[63] = t33;
    $[64] = t34;
  } else {
    t31 = $[61];
    t32 = $[62];
    t33 = $[63];
    t34 = $[64];
  }
  let t35;
  if ($[65] !== versionLockInfo) {
    t35 = versionLockInfo?.enabled && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          bold: true,
          children: "Version Locks"
        }, undefined, false, undefined, this),
        versionLockInfo.staleLocksCleaned > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "\u2514 Cleaned ",
            versionLockInfo.staleLocksCleaned,
            " stale lock(s)"
          ]
        }, undefined, true, undefined, this),
        versionLockInfo.locks.length === 0 ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          dimColor: true,
          children: "\u2514 No active version locks"
        }, undefined, false, undefined, this) : versionLockInfo.locks.map(_temp12)
      ]
    }, undefined, true, undefined, this);
    $[65] = versionLockInfo;
    $[66] = t35;
  } else {
    t35 = $[66];
  }
  let t36;
  if ($[67] !== agentInfo) {
    t36 = agentInfo?.failedFiles && agentInfo.failedFiles.length > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          bold: true,
          color: "error",
          children: "Agent Parse Errors"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          color: "error",
          children: [
            "\u2514 Failed to parse ",
            agentInfo.failedFiles.length,
            " agent file(s):"
          ]
        }, undefined, true, undefined, this),
        agentInfo.failedFiles.map(_temp13)
      ]
    }, undefined, true, undefined, this);
    $[67] = agentInfo;
    $[68] = t36;
  } else {
    t36 = $[68];
  }
  let t37;
  if ($[69] !== pluginsErrors) {
    t37 = pluginsErrors.length > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          bold: true,
          color: "error",
          children: "Plugin Errors"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          color: "error",
          children: [
            "\u2514 ",
            pluginsErrors.length,
            " plugin error(s) detected:"
          ]
        }, undefined, true, undefined, this),
        pluginsErrors.map(_temp14)
      ]
    }, undefined, true, undefined, this);
    $[69] = pluginsErrors;
    $[70] = t37;
  } else {
    t37 = $[70];
  }
  let t38;
  if ($[71] !== contextWarnings) {
    t38 = contextWarnings?.unreachableRulesWarning && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          bold: true,
          color: "warning",
          children: "Unreachable Permission Rules"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          children: [
            "\u2514",
            " ",
            /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
              color: "warning",
              children: [
                figures_default.warning,
                " ",
                contextWarnings.unreachableRulesWarning.message
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        contextWarnings.unreachableRulesWarning.details.map(_temp15)
      ]
    }, undefined, true, undefined, this);
    $[71] = contextWarnings;
    $[72] = t38;
  } else {
    t38 = $[72];
  }
  let t39;
  if ($[73] !== contextWarnings) {
    t39 = contextWarnings && (contextWarnings.claudeMdWarning || contextWarnings.agentWarning || contextWarnings.mcpWarning) && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          bold: true,
          children: "Context Usage Warnings"
        }, undefined, false, undefined, this),
        contextWarnings.claudeMdWarning && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
              children: [
                "\u2514",
                " ",
                /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
                  color: "warning",
                  children: [
                    figures_default.warning,
                    " ",
                    contextWarnings.claudeMdWarning.message
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
              children: [
                "  ",
                "\u2514 Files:"
              ]
            }, undefined, true, undefined, this),
            contextWarnings.claudeMdWarning.details.map(_temp16)
          ]
        }, undefined, true, undefined, this),
        contextWarnings.agentWarning && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
              children: [
                "\u2514",
                " ",
                /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
                  color: "warning",
                  children: [
                    figures_default.warning,
                    " ",
                    contextWarnings.agentWarning.message
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
              children: [
                "  ",
                "\u2514 Top contributors:"
              ]
            }, undefined, true, undefined, this),
            contextWarnings.agentWarning.details.map(_temp17)
          ]
        }, undefined, true, undefined, this),
        contextWarnings.mcpWarning && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
              children: [
                "\u2514",
                " ",
                /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
                  color: "warning",
                  children: [
                    figures_default.warning,
                    " ",
                    contextWarnings.mcpWarning.message
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
              children: [
                "  ",
                "\u2514 MCP servers:"
              ]
            }, undefined, true, undefined, this),
            contextWarnings.mcpWarning.details.map(_temp18)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[73] = contextWarnings;
    $[74] = t39;
  } else {
    t39 = $[74];
  }
  let t40;
  if ($[75] === Symbol.for("react.memo_cache_sentinel")) {
    t40 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(PressEnterToContinue, {}, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[75] = t40;
  } else {
    t40 = $[75];
  }
  let t41;
  if ($[76] !== t23 || $[77] !== t30 || $[78] !== t35 || $[79] !== t36 || $[80] !== t37 || $[81] !== t38 || $[82] !== t39) {
    t41 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Pane, {
      children: [
        t23,
        t30,
        t31,
        t32,
        t33,
        t34,
        t35,
        t36,
        t37,
        t38,
        t39,
        t40
      ]
    }, undefined, true, undefined, this);
    $[76] = t23;
    $[77] = t30;
    $[78] = t35;
    $[79] = t36;
    $[80] = t37;
    $[81] = t38;
    $[82] = t39;
    $[83] = t41;
  } else {
    t41 = $[83];
  }
  return t41;
}
function _temp18(detail_2, i_8) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    dimColor: true,
    children: [
      "    ",
      "\u2514 ",
      detail_2
    ]
  }, i_8, true, undefined, this);
}
function _temp17(detail_1, i_7) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    dimColor: true,
    children: [
      "    ",
      "\u2514 ",
      detail_1
    ]
  }, i_7, true, undefined, this);
}
function _temp16(detail_0, i_6) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    dimColor: true,
    children: [
      "    ",
      "\u2514 ",
      detail_0
    ]
  }, i_6, true, undefined, this);
}
function _temp15(detail, i_5) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    dimColor: true,
    children: [
      "  ",
      "\u2514 ",
      detail
    ]
  }, i_5, true, undefined, this);
}
function _temp14(error_0, i_4) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    dimColor: true,
    children: [
      "  ",
      "\u2514 ",
      error_0.source || "unknown",
      "plugin" in error_0 && error_0.plugin ? ` [${error_0.plugin}]` : "",
      ":",
      " ",
      getPluginErrorMessage(error_0)
    ]
  }, i_4, true, undefined, this);
}
function _temp13(file, i_3) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    dimColor: true,
    children: [
      "  ",
      "\u2514 ",
      file.path,
      ": ",
      file.error
    ]
  }, i_3, true, undefined, this);
}
function _temp12(lock, i_2) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    children: [
      "\u2514 ",
      lock.version,
      ": PID ",
      lock.pid,
      " ",
      lock.isProcessRunning ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        children: "(running)"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        color: "warning",
        children: "(stale)"
      }, undefined, false, undefined, this)
    ]
  }, i_2, true, undefined, this);
}
function _temp11(validation, i_1) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    children: [
      "\u2514 ",
      validation.name,
      ":",
      " ",
      /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        color: validation.status === "capped" ? "warning" : "error",
        children: validation.message
      }, undefined, false, undefined, this)
    ]
  }, i_1, true, undefined, this);
}
function _temp10(warning, i_0) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        color: "warning",
        children: [
          "Warning: ",
          warning.issue
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        children: [
          "Fix: ",
          warning.fix
        ]
      }, undefined, true, undefined, this)
    ]
  }, i_0, true, undefined, this);
}
function _temp1(install, i) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    children: [
      "\u2514 ",
      install.type,
      " at ",
      install.path
    ]
  }, i, true, undefined, this);
}
function _temp0(a) {
  return {
    agentType: a.agentType,
    source: a.source
  };
}
function _temp9(v_0) {
  return v_0.status !== "valid";
}
function _temp8(v) {
  const value = process.env[v.name];
  const result = validateBoundedIntEnvVar(v.name, value, v.default, v.upperLimit);
  return {
    name: v.name,
    ...result
  };
}
function _temp7(error) {
  return error.mcpErrorMetadata === undefined;
}
function _temp6(diag) {
  const fetchDistTags = diag.installationType === "native" ? getGcsDistTags : getNpmDistTags;
  return fetchDistTags().catch(_temp52);
}
function _temp52() {
  return {
    latest: null,
    stable: null
  };
}
function _temp42(s_2) {
  return s_2.plugins.errors;
}
function _temp32(s_1) {
  return s_1.toolPermissionContext;
}
function _temp23(s_0) {
  return s_0.mcp.tools;
}
function _temp19(s) {
  return s.agentDefinitions;
}
var import_compiler_runtime3, import_react, jsx_dev_runtime3;
var init_Doctor = __esm(() => {
  init_figures();
  init_KeybindingWarnings();
  init_McpParsingWarnings();
  init_context();
  init_envUtils();
  init_state();
  init_Pane();
  init_PressEnterToContinue();
  init_SandboxDoctorSection();
  init_ValidationErrorsList();
  init_useSettingsErrors();
  init_useExitOnCtrlCDWithKeybindings();
  init_ink();
  init_useKeybinding();
  init_AppState();
  init_plugin();
  init_autoUpdater();
  init_doctorContextWarnings();
  init_doctorDiagnostic();
  init_envValidation();
  init_file();
  init_pidLock();
  init_settings();
  init_outputLimits();
  init_outputFormatting();
  init_xdg();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

export { Doctor, init_Doctor };
