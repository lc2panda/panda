// @bun
import {
  AGENT_SOURCE_GROUPS,
  compareAgentsByName,
  getOverrideSourceLabel,
  init_agentDisplay,
  resolveAgentModelDisplay,
  resolveAgentOverrides
} from "./chunk-spkrcgjr.js";
import {
  init_useMergedTools,
  useMergedTools
} from "./chunk-0ypre8xa.js";
import"./chunk-k6m09ga9.js";
import"./chunk-060az9wp.js";
import {
  editFileInEditor,
  editPromptInEditor,
  init_promptEditor
} from "./chunk-n7a7jk3x.js";
import {
  init_useMainLoopModel,
  useMainLoopModel
} from "./chunk-y4tgrnzg.js";
import {
  AGENT_COLORS,
  AGENT_COLOR_TO_THEME_COLOR,
  BashTool,
  ExitPlanModeV2Tool,
  FileEditTool,
  FileReadTool,
  FileWriteTool,
  GlobTool,
  GrepTool,
  ListMcpResourcesTool,
  Markdown,
  NotebookEditTool,
  ReadMcpResourceTool,
  Select,
  Spinner,
  TaskOutputTool,
  TaskStopTool,
  TextInput,
  TodoWriteTool,
  WebFetchTool,
  WebSearchTool,
  asSystemPrompt,
  capitalize_default,
  createAbortController,
  createUserMessage,
  filterToolsForAgent,
  getActiveAgentsFromList,
  getAgentColor,
  getAgentModelDisplay,
  getAgentModelOptions,
  getEmptyToolPermissionContext,
  getMemoryScopeDisplay,
  getTools,
  getUserContext,
  init_AppState,
  init_BashTool,
  init_ExitPlanModeV2Tool,
  init_FileEditTool,
  init_FileReadTool,
  init_FileWriteTool,
  init_GlobTool,
  init_GrepTool,
  init_ListMcpResourcesTool,
  init_Markdown,
  init_NotebookEditTool,
  init_ReadMcpResourceTool,
  init_Spinner,
  init_TaskOutputTool,
  init_TaskStopTool,
  init_TextInput,
  init_TodoWriteTool,
  init_Tool,
  init_WebFetchTool,
  init_WebSearchTool,
  init_abortController,
  init_agent,
  init_agentColorManager,
  init_agentMemory,
  init_agentToolUtils,
  init_api,
  init_capitalize,
  init_claude,
  init_context,
  init_loadAgentsDir,
  init_messages1 as init_messages,
  init_select,
  init_systemPromptType,
  init_tools1 as init_tools,
  init_utils,
  isBuiltInAgent,
  isCustomAgent,
  isMcpTool,
  isPluginAgent,
  loadAgentMemoryPrompt,
  normalizeMessagesForAPI,
  prependUserContext,
  queryModelWithoutStreaming,
  resolveAgentTools,
  setAgentColor,
  useAppState,
  useSetAppState
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import {
  Byline,
  ConfigurableShortcutHint,
  Dialog,
  KeyboardShortcutHint,
  init_Byline,
  init_ConfigurableShortcutHint,
  init_Dialog,
  init_KeyboardShortcutHint
} from "./chunk-px2n7q1y.js";
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
  Divider,
  init_Divider,
  init_useKeybinding,
  useKeybinding
} from "./chunk-x2y5syym.js";
import {
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
import {
  init_TungstenTool
} from "./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  AGENT_TOOL_NAME,
  capitalize,
  getManagedFilePath,
  getSettingSourceName,
  init_constants,
  init_constants1 as init_constants2,
  init_managedPath,
  init_mcpStringUtils,
  init_paths,
  init_source,
  init_stringUtils,
  isAutoMemoryEnabled,
  mcpInfoFromString,
  plural,
  source_default
} from "./chunk-bt6e264h.js";
import"./chunk-y9h5c3hn.js";
import"./chunk-7rxmkr8t.js";
import"./chunk-vratq94g.js";
import"./chunk-7gjw150h.js";
import {
  count,
  init_array
} from "./chunk-0e1xsncc.js";
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
import {
  init_format,
  truncateToWidth
} from "./chunk-hsd2zcr5.js";
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
import {
  figures_default,
  init_figures
} from "./chunk-nahdbxge.js";
import {
  init_log,
  logError
} from "./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  getErrnoCode,
  init_errors,
  init_slowOperations,
  jsonParse,
  toError
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils
} from "./chunk-3r24h7t6.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import {
  init_sdk
} from "./chunk-4g3v8y12.js";
import {
  APIUserAbortError
} from "./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/agents/types.ts
var AGENT_PATHS;
var init_types = __esm(() => {
  AGENT_PATHS = {
    FOLDER_NAME: ".claude",
    AGENTS_DIR: "agents"
  };
});

// src/components/agents/agentFileUtils.ts
import { mkdir, open, unlink } from "fs/promises";
import { join } from "path";
function formatAgentAsMarkdown(agentType, whenToUse, tools, systemPrompt, color, model, memory, effort) {
  const escapedWhenToUse = whenToUse.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\\\n");
  const isAllTools = tools === undefined || tools.length === 1 && tools[0] === "*";
  const toolsLine = isAllTools ? "" : `
tools: ${tools.join(", ")}`;
  const modelLine = model ? `
model: ${model}` : "";
  const effortLine = effort !== undefined ? `
effort: ${effort}` : "";
  const colorLine = color ? `
color: ${color}` : "";
  const memoryLine = memory ? `
memory: ${memory}` : "";
  return `---
name: ${agentType}
description: "${escapedWhenToUse}"${toolsLine}${modelLine}${effortLine}${colorLine}${memoryLine}
---

${systemPrompt}
`;
}
function getAgentDirectoryPath(location) {
  switch (location) {
    case "flagSettings":
      throw new Error(`Cannot get directory path for ${location} agents`);
    case "userSettings":
      return join(getClaudeConfigHomeDir(), AGENT_PATHS.AGENTS_DIR);
    case "projectSettings":
      return join(getCwd(), AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR);
    case "policySettings":
      return join(getManagedFilePath(), AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR);
    case "localSettings":
      return join(getCwd(), AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR);
  }
}
function getRelativeAgentDirectoryPath(location) {
  switch (location) {
    case "projectSettings":
      return join(".", AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR);
    default:
      return getAgentDirectoryPath(location);
  }
}
function getNewAgentFilePath(agent) {
  const dirPath = getAgentDirectoryPath(agent.source);
  return join(dirPath, `${agent.agentType}.md`);
}
function getActualAgentFilePath(agent) {
  if (agent.source === "built-in") {
    return "Built-in";
  }
  if (agent.source === "plugin") {
    throw new Error("Cannot get file path for plugin agents");
  }
  const dirPath = getAgentDirectoryPath(agent.source);
  const filename = agent.filename || agent.agentType;
  return join(dirPath, `${filename}.md`);
}
function getNewRelativeAgentFilePath(agent) {
  if (agent.source === "built-in") {
    return "Built-in";
  }
  const dirPath = getRelativeAgentDirectoryPath(agent.source);
  return join(dirPath, `${agent.agentType}.md`);
}
function getActualRelativeAgentFilePath(agent) {
  if (isBuiltInAgent(agent)) {
    return "Built-in";
  }
  if (isPluginAgent(agent)) {
    return `Plugin: ${agent.plugin || "Unknown"}`;
  }
  if (agent.source === "flagSettings") {
    return "CLI argument";
  }
  const dirPath = getRelativeAgentDirectoryPath(agent.source);
  const filename = agent.filename || agent.agentType;
  return join(dirPath, `${filename}.md`);
}
async function ensureAgentDirectoryExists(source) {
  const dirPath = getAgentDirectoryPath(source);
  await mkdir(dirPath, { recursive: true });
  return dirPath;
}
async function saveAgentToFile(source, agentType, whenToUse, tools, systemPrompt, checkExists = true, color, model, memory, effort) {
  if (source === "built-in") {
    throw new Error("Cannot save built-in agents");
  }
  await ensureAgentDirectoryExists(source);
  const filePath = getNewAgentFilePath({ source, agentType });
  const content = formatAgentAsMarkdown(agentType, whenToUse, tools, systemPrompt, color, model, memory, effort);
  try {
    await writeFileAndFlush(filePath, content, checkExists ? "wx" : "w");
  } catch (e) {
    if (getErrnoCode(e) === "EEXIST") {
      throw new Error(`Agent file already exists: ${filePath}`);
    }
    throw e;
  }
}
async function updateAgentFile(agent, newWhenToUse, newTools, newSystemPrompt, newColor, newModel, newMemory, newEffort) {
  if (agent.source === "built-in") {
    throw new Error("Cannot update built-in agents");
  }
  const filePath = getActualAgentFilePath(agent);
  const content = formatAgentAsMarkdown(agent.agentType, newWhenToUse, newTools, newSystemPrompt, newColor, newModel, newMemory, newEffort);
  await writeFileAndFlush(filePath, content);
}
async function deleteAgentFromFile(agent) {
  if (agent.source === "built-in") {
    throw new Error("Cannot delete built-in agents");
  }
  const filePath = getActualAgentFilePath(agent);
  try {
    await unlink(filePath);
  } catch (e) {
    const code = getErrnoCode(e);
    if (code !== "ENOENT") {
      throw e;
    }
  }
}
async function writeFileAndFlush(filePath, content, flag = "w") {
  const handle = await open(filePath, flag);
  try {
    await handle.writeFile(content, { encoding: "utf-8" });
    await handle.datasync();
  } finally {
    await handle.close();
  }
}
var init_agentFileUtils = __esm(() => {
  init_managedPath();
  init_loadAgentsDir();
  init_cwd();
  init_envUtils();
  init_errors();
  init_types();
});

// src/components/agents/AgentDetail.tsx
function AgentDetail(t0) {
  const $ = import_compiler_runtime.c(48);
  const {
    agent,
    tools,
    onBack
  } = t0;
  const resolvedTools = resolveAgentTools(agent, tools, false);
  let t1;
  if ($[0] !== agent) {
    t1 = getActualRelativeAgentFilePath(agent);
    $[0] = agent;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const filePath = t1;
  let t2;
  if ($[2] !== agent.agentType) {
    t2 = getAgentColor(agent.agentType);
    $[2] = agent.agentType;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const backgroundColor = t2;
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = {
      context: "Confirmation"
    };
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  useKeybinding("confirm:no", onBack, t3);
  let t4;
  if ($[5] !== onBack) {
    t4 = (e) => {
      if (e.key === "return") {
        e.preventDefault();
        onBack();
      }
    };
    $[5] = onBack;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  const handleKeyDown = t4;
  const renderToolsList = function renderToolsList2() {
    if (resolvedTools.hasWildcard) {
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "All tools"
      }, undefined, false, undefined, this);
    }
    if (!agent.tools || agent.tools.length === 0) {
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "None"
      }, undefined, false, undefined, this);
    }
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: [
        resolvedTools.validTools.length > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: resolvedTools.validTools.join(", ")
        }, undefined, false, undefined, this),
        resolvedTools.invalidTools.length > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "warning",
          children: [
            figures_default.warning,
            " Unrecognized:",
            " ",
            resolvedTools.invalidTools.join(", ")
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  const T0 = ThemedBox_default;
  const t5 = "column";
  const t6 = 1;
  const t7 = 0;
  const t8 = true;
  let t9;
  if ($[7] !== filePath) {
    t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: filePath
    }, undefined, false, undefined, this);
    $[7] = filePath;
    $[8] = t9;
  } else {
    t9 = $[8];
  }
  let t10;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Description"
        }, undefined, false, undefined, this),
        " (tells Claude when to use this agent):"
      ]
    }, undefined, true, undefined, this);
    $[9] = t10;
  } else {
    t10 = $[9];
  }
  let t11;
  if ($[10] !== agent.whenToUse) {
    t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t10,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          marginLeft: 2,
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: agent.whenToUse
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[10] = agent.whenToUse;
    $[11] = t11;
  } else {
    t11 = $[11];
  }
  const T1 = ThemedBox_default;
  let t12;
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Tools"
        }, undefined, false, undefined, this),
        ":",
        " "
      ]
    }, undefined, true, undefined, this);
    $[12] = t12;
  } else {
    t12 = $[12];
  }
  const t13 = renderToolsList();
  let t14;
  if ($[13] !== T1 || $[14] !== t12 || $[15] !== t13) {
    t14 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T1, {
      children: [
        t12,
        t13
      ]
    }, undefined, true, undefined, this);
    $[13] = T1;
    $[14] = t12;
    $[15] = t13;
    $[16] = t14;
  } else {
    t14 = $[16];
  }
  let t15;
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    t15 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: "Model"
    }, undefined, false, undefined, this);
    $[17] = t15;
  } else {
    t15 = $[17];
  }
  let t16;
  if ($[18] !== agent.model) {
    t16 = getAgentModelDisplay(agent.model);
    $[18] = agent.model;
    $[19] = t16;
  } else {
    t16 = $[19];
  }
  let t17;
  if ($[20] !== t16) {
    t17 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        t15,
        ": ",
        t16
      ]
    }, undefined, true, undefined, this);
    $[20] = t16;
    $[21] = t17;
  } else {
    t17 = $[21];
  }
  let t18;
  if ($[22] !== agent.permissionMode) {
    t18 = agent.permissionMode && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Permission mode"
        }, undefined, false, undefined, this),
        ": ",
        agent.permissionMode
      ]
    }, undefined, true, undefined, this);
    $[22] = agent.permissionMode;
    $[23] = t18;
  } else {
    t18 = $[23];
  }
  let t19;
  if ($[24] !== agent.memory) {
    t19 = agent.memory && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Memory"
        }, undefined, false, undefined, this),
        ": ",
        getMemoryScopeDisplay(agent.memory)
      ]
    }, undefined, true, undefined, this);
    $[24] = agent.memory;
    $[25] = t19;
  } else {
    t19 = $[25];
  }
  let t20;
  if ($[26] !== agent.hooks) {
    t20 = agent.hooks && Object.keys(agent.hooks).length > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Hooks"
        }, undefined, false, undefined, this),
        ": ",
        Object.keys(agent.hooks).join(", ")
      ]
    }, undefined, true, undefined, this);
    $[26] = agent.hooks;
    $[27] = t20;
  } else {
    t20 = $[27];
  }
  let t21;
  if ($[28] !== agent.skills) {
    t21 = agent.skills && agent.skills.length > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Skills"
        }, undefined, false, undefined, this),
        ":",
        " ",
        agent.skills.length > 10 ? `${agent.skills.length} skills` : agent.skills.join(", ")
      ]
    }, undefined, true, undefined, this);
    $[28] = agent.skills;
    $[29] = t21;
  } else {
    t21 = $[29];
  }
  let t22;
  if ($[30] !== agent.agentType || $[31] !== backgroundColor) {
    t22 = backgroundColor && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            bold: true,
            children: "Color"
          }, undefined, false, undefined, this),
          ":",
          " ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            backgroundColor,
            color: "inverseText",
            children: [
              " ",
              agent.agentType,
              " "
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[30] = agent.agentType;
    $[31] = backgroundColor;
    $[32] = t22;
  } else {
    t22 = $[32];
  }
  let t23;
  if ($[33] !== agent) {
    t23 = !isBuiltInAgent(agent) && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: "System prompt"
              }, undefined, false, undefined, this),
              ":"
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          marginLeft: 2,
          marginRight: 2,
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Markdown, {
            children: agent.getSystemPrompt()
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[33] = agent;
    $[34] = t23;
  } else {
    t23 = $[34];
  }
  let t24;
  if ($[35] !== T0 || $[36] !== handleKeyDown || $[37] !== t11 || $[38] !== t14 || $[39] !== t17 || $[40] !== t18 || $[41] !== t19 || $[42] !== t20 || $[43] !== t21 || $[44] !== t22 || $[45] !== t23 || $[46] !== t9) {
    t24 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T0, {
      flexDirection: t5,
      gap: t6,
      tabIndex: t7,
      autoFocus: t8,
      onKeyDown: handleKeyDown,
      children: [
        t9,
        t11,
        t14,
        t17,
        t18,
        t19,
        t20,
        t21,
        t22,
        t23
      ]
    }, undefined, true, undefined, this);
    $[35] = T0;
    $[36] = handleKeyDown;
    $[37] = t11;
    $[38] = t14;
    $[39] = t17;
    $[40] = t18;
    $[41] = t19;
    $[42] = t20;
    $[43] = t21;
    $[44] = t22;
    $[45] = t23;
    $[46] = t9;
    $[47] = t24;
  } else {
    t24 = $[47];
  }
  return t24;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_AgentDetail = __esm(() => {
  init_figures();
  init_ink();
  init_useKeybinding();
  init_agentColorManager();
  init_agentMemory();
  init_agentToolUtils();
  init_loadAgentsDir();
  init_agent();
  init_Markdown();
  init_agentFileUtils();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/ColorPicker.tsx
function ColorPicker(t0) {
  const $ = import_compiler_runtime2.c(17);
  const {
    agentName,
    currentColor: t1,
    onConfirm
  } = t0;
  const currentColor = t1 === undefined ? "automatic" : t1;
  let t2;
  if ($[0] !== currentColor) {
    t2 = COLOR_OPTIONS.findIndex((opt) => opt === currentColor);
    $[0] = currentColor;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const [selectedIndex, setSelectedIndex] = import_react.useState(Math.max(0, t2));
  let t3;
  if ($[2] !== onConfirm || $[3] !== selectedIndex) {
    t3 = (e) => {
      if (e.key === "up") {
        e.preventDefault();
        setSelectedIndex(_temp);
      } else {
        if (e.key === "down") {
          e.preventDefault();
          setSelectedIndex(_temp2);
        } else {
          if (e.key === "return") {
            e.preventDefault();
            const selected = COLOR_OPTIONS[selectedIndex];
            onConfirm(selected === "automatic" ? undefined : selected);
          }
        }
      }
    };
    $[2] = onConfirm;
    $[3] = selectedIndex;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const handleKeyDown = t3;
  const selectedValue = COLOR_OPTIONS[selectedIndex];
  let t4;
  if ($[5] !== selectedIndex) {
    t4 = COLOR_OPTIONS.map((option, index) => {
      const isSelected = index === selectedIndex;
      return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "row",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            color: isSelected ? "suggestion" : undefined,
            children: isSelected ? figures_default.pointer : " "
          }, undefined, false, undefined, this),
          option === "automatic" ? /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            bold: isSelected,
            children: "Automatic color"
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
            gap: 1,
            children: [
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                backgroundColor: AGENT_COLOR_TO_THEME_COLOR[option],
                color: "inverseText",
                children: " "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                bold: isSelected,
                children: capitalize(option)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, option, true, undefined, this);
    });
    $[5] = selectedIndex;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: t4
    }, undefined, false, undefined, this);
    $[7] = t4;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  let t6;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: "Preview: "
    }, undefined, false, undefined, this);
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  let t7;
  if ($[10] !== agentName || $[11] !== selectedValue) {
    t7 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: [
        t6,
        selectedValue === undefined || selectedValue === "automatic" ? /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          inverse: true,
          bold: true,
          children: [
            " ",
            "@",
            agentName,
            " "
          ]
        }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          backgroundColor: AGENT_COLOR_TO_THEME_COLOR[selectedValue],
          color: "inverseText",
          bold: true,
          children: [
            " ",
            "@",
            agentName,
            " "
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[10] = agentName;
    $[11] = selectedValue;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  let t8;
  if ($[13] !== handleKeyDown || $[14] !== t5 || $[15] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: [
        t5,
        t7
      ]
    }, undefined, true, undefined, this);
    $[13] = handleKeyDown;
    $[14] = t5;
    $[15] = t7;
    $[16] = t8;
  } else {
    t8 = $[16];
  }
  return t8;
}
function _temp2(prev_0) {
  return prev_0 < COLOR_OPTIONS.length - 1 ? prev_0 + 1 : 0;
}
function _temp(prev) {
  return prev > 0 ? prev - 1 : COLOR_OPTIONS.length - 1;
}
var import_compiler_runtime2, import_react, jsx_dev_runtime2, COLOR_OPTIONS;
var init_ColorPicker = __esm(() => {
  init_figures();
  init_ink();
  init_agentColorManager();
  init_stringUtils();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
  COLOR_OPTIONS = ["automatic", ...AGENT_COLORS];
});

// src/components/agents/ModelSelector.tsx
function ModelSelector(t0) {
  const $ = import_compiler_runtime3.c(11);
  const {
    initialModel,
    onComplete,
    onCancel
  } = t0;
  let t1;
  if ($[0] !== initialModel) {
    bb0: {
      const base = getAgentModelOptions();
      if (initialModel && !base.some((o) => o.value === initialModel)) {
        t1 = [{
          value: initialModel,
          label: initialModel,
          description: "Current model (custom ID)"
        }, ...base];
        break bb0;
      }
      t1 = base;
    }
    $[0] = initialModel;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const modelOptions = t1;
  const defaultModel = initialModel ?? "sonnet";
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      marginBottom: 1,
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: "Model determines the agent's reasoning capabilities and speed."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== onCancel || $[4] !== onComplete) {
    t3 = () => onCancel ? onCancel() : onComplete(undefined);
    $[3] = onCancel;
    $[4] = onComplete;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== defaultModel || $[7] !== modelOptions || $[8] !== onComplete || $[9] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t2,
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Select, {
          options: modelOptions,
          defaultValue: defaultModel,
          onChange: onComplete,
          onCancel: t3
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[6] = defaultModel;
    $[7] = modelOptions;
    $[8] = onComplete;
    $[9] = t3;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
}
var import_compiler_runtime3, jsx_dev_runtime3;
var init_ModelSelector = __esm(() => {
  init_ink();
  init_agent();
  init_select();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/ToolSelector.tsx
function getToolBuckets() {
  return {
    READ_ONLY: {
      name: "Read-only tools",
      toolNames: new Set([GlobTool.name, GrepTool.name, ExitPlanModeV2Tool.name, FileReadTool.name, WebFetchTool.name, TodoWriteTool.name, WebSearchTool.name, TaskStopTool.name, TaskOutputTool.name, ListMcpResourcesTool.name, ReadMcpResourceTool.name])
    },
    EDIT: {
      name: "Edit tools",
      toolNames: new Set([FileEditTool.name, FileWriteTool.name, NotebookEditTool.name])
    },
    EXECUTION: {
      name: "Execution tools",
      toolNames: new Set([BashTool.name, undefined].filter((n) => n !== undefined))
    },
    MCP: {
      name: "MCP tools",
      toolNames: new Set,
      isMcp: true
    },
    OTHER: {
      name: "Other tools",
      toolNames: new Set
    }
  };
}
function getMcpServerBuckets(tools) {
  const serverMap = new Map;
  tools.forEach((tool) => {
    if (isMcpTool(tool)) {
      const mcpInfo = mcpInfoFromString(tool.name);
      if (mcpInfo?.serverName) {
        const existing = serverMap.get(mcpInfo.serverName) || [];
        existing.push(tool);
        serverMap.set(mcpInfo.serverName, existing);
      }
    }
  });
  return Array.from(serverMap.entries()).map(([serverName, tools2]) => ({
    serverName,
    tools: tools2
  })).sort((a, b) => a.serverName.localeCompare(b.serverName));
}
function ToolSelector(t0) {
  const $ = import_compiler_runtime4.c(69);
  const {
    tools,
    initialTools,
    onComplete,
    onCancel
  } = t0;
  let t1;
  if ($[0] !== tools) {
    t1 = filterToolsForAgent({
      tools,
      isBuiltIn: false,
      isAsync: false
    });
    $[0] = tools;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const customAgentTools = t1;
  let t2;
  if ($[2] !== customAgentTools || $[3] !== initialTools) {
    t2 = !initialTools || initialTools.includes("*") ? customAgentTools.map(_temp9) : initialTools;
    $[2] = customAgentTools;
    $[3] = initialTools;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const expandedInitialTools = t2;
  const [selectedTools, setSelectedTools] = import_react2.useState(expandedInitialTools);
  const [focusIndex, setFocusIndex] = import_react2.useState(0);
  const [showIndividualTools, setShowIndividualTools] = import_react2.useState(false);
  let t3;
  if ($[5] !== customAgentTools) {
    t3 = new Set(customAgentTools.map(_temp22));
    $[5] = customAgentTools;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const toolNames = t3;
  let t4;
  if ($[7] !== selectedTools || $[8] !== toolNames) {
    let t52;
    if ($[10] !== toolNames) {
      t52 = (name) => toolNames.has(name);
      $[10] = toolNames;
      $[11] = t52;
    } else {
      t52 = $[11];
    }
    t4 = selectedTools.filter(t52);
    $[7] = selectedTools;
    $[8] = toolNames;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const validSelectedTools = t4;
  let t5;
  if ($[12] !== validSelectedTools) {
    t5 = new Set(validSelectedTools);
    $[12] = validSelectedTools;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  const selectedSet = t5;
  const isAllSelected = validSelectedTools.length === customAgentTools.length && customAgentTools.length > 0;
  let t6;
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = (toolName) => {
      if (!toolName) {
        return;
      }
      setSelectedTools((current) => current.includes(toolName) ? current.filter((t_1) => t_1 !== toolName) : [...current, toolName]);
    };
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  const handleToggleTool = t6;
  let t7;
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = (toolNames_0, select) => {
      setSelectedTools((current_0) => {
        if (select) {
          const toolsToAdd = toolNames_0.filter((t_2) => !current_0.includes(t_2));
          return [...current_0, ...toolsToAdd];
        } else {
          return current_0.filter((t_3) => !toolNames_0.includes(t_3));
        }
      });
    };
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  const handleToggleTools = t7;
  let t8;
  if ($[16] !== customAgentTools || $[17] !== onComplete || $[18] !== validSelectedTools) {
    t8 = () => {
      const allToolNames = customAgentTools.map(_temp3);
      const areAllToolsSelected = validSelectedTools.length === allToolNames.length && allToolNames.every((name_0) => validSelectedTools.includes(name_0));
      const finalTools = areAllToolsSelected ? undefined : validSelectedTools;
      onComplete(finalTools);
    };
    $[16] = customAgentTools;
    $[17] = onComplete;
    $[18] = validSelectedTools;
    $[19] = t8;
  } else {
    t8 = $[19];
  }
  const handleConfirm = t8;
  let buckets;
  if ($[20] !== customAgentTools) {
    const toolBuckets = getToolBuckets();
    buckets = {
      readOnly: [],
      edit: [],
      execution: [],
      mcp: [],
      other: []
    };
    customAgentTools.forEach((tool) => {
      if (isMcpTool(tool)) {
        buckets.mcp.push(tool);
      } else {
        if (toolBuckets.READ_ONLY.toolNames.has(tool.name)) {
          buckets.readOnly.push(tool);
        } else {
          if (toolBuckets.EDIT.toolNames.has(tool.name)) {
            buckets.edit.push(tool);
          } else {
            if (toolBuckets.EXECUTION.toolNames.has(tool.name)) {
              buckets.execution.push(tool);
            } else {
              if (tool.name !== AGENT_TOOL_NAME) {
                buckets.other.push(tool);
              }
            }
          }
        }
      }
    });
    $[20] = customAgentTools;
    $[21] = buckets;
  } else {
    buckets = $[21];
  }
  const toolsByBucket = buckets;
  let t9;
  if ($[22] !== selectedSet) {
    t9 = (bucketTools) => {
      const selected = count(bucketTools, (t_5) => selectedSet.has(t_5.name));
      const needsSelection = selected < bucketTools.length;
      return () => {
        const toolNames_1 = bucketTools.map(_temp4);
        handleToggleTools(toolNames_1, needsSelection);
      };
    };
    $[22] = selectedSet;
    $[23] = t9;
  } else {
    t9 = $[23];
  }
  const createBucketToggleAction = t9;
  let navigableItems;
  if ($[24] !== createBucketToggleAction || $[25] !== customAgentTools || $[26] !== focusIndex || $[27] !== handleConfirm || $[28] !== isAllSelected || $[29] !== selectedSet || $[30] !== showIndividualTools || $[31] !== toolsByBucket.edit || $[32] !== toolsByBucket.execution || $[33] !== toolsByBucket.mcp || $[34] !== toolsByBucket.other || $[35] !== toolsByBucket.readOnly) {
    navigableItems = [];
    navigableItems.push({
      id: "continue",
      label: "Continue",
      action: handleConfirm,
      isContinue: true
    });
    let t102;
    if ($[37] !== customAgentTools || $[38] !== isAllSelected) {
      t102 = () => {
        const allToolNames_0 = customAgentTools.map(_temp5);
        handleToggleTools(allToolNames_0, !isAllSelected);
      };
      $[37] = customAgentTools;
      $[38] = isAllSelected;
      $[39] = t102;
    } else {
      t102 = $[39];
    }
    navigableItems.push({
      id: "bucket-all",
      label: `${isAllSelected ? figures_default.checkboxOn : figures_default.checkboxOff} All tools`,
      action: t102
    });
    const toolBuckets_0 = getToolBuckets();
    const bucketConfigs = [{
      id: "bucket-readonly",
      name: toolBuckets_0.READ_ONLY.name,
      tools: toolsByBucket.readOnly
    }, {
      id: "bucket-edit",
      name: toolBuckets_0.EDIT.name,
      tools: toolsByBucket.edit
    }, {
      id: "bucket-execution",
      name: toolBuckets_0.EXECUTION.name,
      tools: toolsByBucket.execution
    }, {
      id: "bucket-mcp",
      name: toolBuckets_0.MCP.name,
      tools: toolsByBucket.mcp
    }, {
      id: "bucket-other",
      name: toolBuckets_0.OTHER.name,
      tools: toolsByBucket.other
    }];
    bucketConfigs.forEach((t112) => {
      const {
        id,
        name: name_1,
        tools: bucketTools_0
      } = t112;
      if (bucketTools_0.length === 0) {
        return;
      }
      const selected_0 = count(bucketTools_0, (t_8) => selectedSet.has(t_8.name));
      const isFullySelected = selected_0 === bucketTools_0.length;
      navigableItems.push({
        id,
        label: `${isFullySelected ? figures_default.checkboxOn : figures_default.checkboxOff} ${name_1}`,
        action: createBucketToggleAction(bucketTools_0)
      });
    });
    const toggleButtonIndex = navigableItems.length;
    let t122;
    if ($[40] !== focusIndex || $[41] !== showIndividualTools || $[42] !== toggleButtonIndex) {
      t122 = () => {
        setShowIndividualTools(!showIndividualTools);
        if (showIndividualTools && focusIndex > toggleButtonIndex) {
          setFocusIndex(toggleButtonIndex);
        }
      };
      $[40] = focusIndex;
      $[41] = showIndividualTools;
      $[42] = toggleButtonIndex;
      $[43] = t122;
    } else {
      t122 = $[43];
    }
    navigableItems.push({
      id: "toggle-individual",
      label: showIndividualTools ? "Hide advanced options" : "Show advanced options",
      action: t122,
      isToggle: true
    });
    const mcpServerBuckets = getMcpServerBuckets(customAgentTools);
    if (showIndividualTools) {
      if (mcpServerBuckets.length > 0) {
        navigableItems.push({
          id: "mcp-servers-header",
          label: "MCP Servers:",
          action: _temp6,
          isHeader: true
        });
        mcpServerBuckets.forEach((t132) => {
          const {
            serverName,
            tools: serverTools
          } = t132;
          const selected_1 = count(serverTools, (t_9) => selectedSet.has(t_9.name));
          const isFullySelected_0 = selected_1 === serverTools.length;
          navigableItems.push({
            id: `mcp-server-${serverName}`,
            label: `${isFullySelected_0 ? figures_default.checkboxOn : figures_default.checkboxOff} ${serverName} (${serverTools.length} ${plural(serverTools.length, "tool")})`,
            action: () => {
              const toolNames_2 = serverTools.map(_temp7);
              handleToggleTools(toolNames_2, !isFullySelected_0);
            }
          });
        });
        navigableItems.push({
          id: "tools-header",
          label: "Individual Tools:",
          action: _temp8,
          isHeader: true
        });
      }
      customAgentTools.forEach((tool_0) => {
        let displayName = tool_0.name;
        if (tool_0.name.startsWith("mcp__")) {
          const mcpInfo = mcpInfoFromString(tool_0.name);
          displayName = mcpInfo ? `${mcpInfo.toolName} (${mcpInfo.serverName})` : tool_0.name;
        }
        navigableItems.push({
          id: `tool-${tool_0.name}`,
          label: `${selectedSet.has(tool_0.name) ? figures_default.checkboxOn : figures_default.checkboxOff} ${displayName}`,
          action: () => handleToggleTool(tool_0.name)
        });
      });
    }
    $[24] = createBucketToggleAction;
    $[25] = customAgentTools;
    $[26] = focusIndex;
    $[27] = handleConfirm;
    $[28] = isAllSelected;
    $[29] = selectedSet;
    $[30] = showIndividualTools;
    $[31] = toolsByBucket.edit;
    $[32] = toolsByBucket.execution;
    $[33] = toolsByBucket.mcp;
    $[34] = toolsByBucket.other;
    $[35] = toolsByBucket.readOnly;
    $[36] = navigableItems;
  } else {
    navigableItems = $[36];
  }
  let t10;
  if ($[44] !== initialTools || $[45] !== onCancel || $[46] !== onComplete) {
    t10 = () => {
      if (onCancel) {
        onCancel();
      } else {
        onComplete(initialTools);
      }
    };
    $[44] = initialTools;
    $[45] = onCancel;
    $[46] = onComplete;
    $[47] = t10;
  } else {
    t10 = $[47];
  }
  const handleCancel = t10;
  let t11;
  if ($[48] === Symbol.for("react.memo_cache_sentinel")) {
    t11 = {
      context: "Confirmation"
    };
    $[48] = t11;
  } else {
    t11 = $[48];
  }
  useKeybinding("confirm:no", handleCancel, t11);
  let t12;
  if ($[49] !== focusIndex || $[50] !== navigableItems) {
    t12 = (e) => {
      if (e.key === "return") {
        e.preventDefault();
        const item = navigableItems[focusIndex];
        if (item && !item.isHeader) {
          item.action();
        }
      } else {
        if (e.key === "up") {
          e.preventDefault();
          let newIndex = focusIndex - 1;
          while (newIndex > 0 && navigableItems[newIndex]?.isHeader) {
            newIndex--;
          }
          setFocusIndex(Math.max(0, newIndex));
        } else {
          if (e.key === "down") {
            e.preventDefault();
            let newIndex_0 = focusIndex + 1;
            while (newIndex_0 < navigableItems.length - 1 && navigableItems[newIndex_0]?.isHeader) {
              newIndex_0++;
            }
            setFocusIndex(Math.min(navigableItems.length - 1, newIndex_0));
          }
        }
      }
    };
    $[49] = focusIndex;
    $[50] = navigableItems;
    $[51] = t12;
  } else {
    t12 = $[51];
  }
  const handleKeyDown = t12;
  const t13 = focusIndex === 0 ? "suggestion" : undefined;
  const t14 = focusIndex === 0;
  const t15 = focusIndex === 0 ? `${figures_default.pointer} ` : "  ";
  let t16;
  if ($[52] !== t13 || $[53] !== t14 || $[54] !== t15) {
    t16 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      color: t13,
      bold: t14,
      children: [
        t15,
        "[ Continue ]"
      ]
    }, undefined, true, undefined, this);
    $[52] = t13;
    $[53] = t14;
    $[54] = t15;
    $[55] = t16;
  } else {
    t16 = $[55];
  }
  let t17;
  if ($[56] === Symbol.for("react.memo_cache_sentinel")) {
    t17 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Divider, {
      width: 40
    }, undefined, false, undefined, this);
    $[56] = t17;
  } else {
    t17 = $[56];
  }
  let t18;
  if ($[57] !== navigableItems) {
    t18 = navigableItems.slice(1);
    $[57] = navigableItems;
    $[58] = t18;
  } else {
    t18 = $[58];
  }
  let t19;
  if ($[59] !== focusIndex || $[60] !== t18) {
    t19 = t18.map((item_0, index) => {
      const isCurrentlyFocused = index + 1 === focusIndex;
      const isToggleButton = item_0.isToggle;
      const isHeader = item_0.isHeader;
      return /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(import_react2.default.Fragment, {
        children: [
          isToggleButton && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Divider, {
            width: 40
          }, undefined, false, undefined, this),
          isHeader && index > 0 && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
            marginTop: 1
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
            color: isHeader ? undefined : isCurrentlyFocused ? "suggestion" : undefined,
            dimColor: isHeader,
            bold: isToggleButton && isCurrentlyFocused,
            children: [
              isHeader ? "" : isCurrentlyFocused ? `${figures_default.pointer} ` : "  ",
              isToggleButton ? `[ ${item_0.label} ]` : item_0.label
            ]
          }, undefined, true, undefined, this)
        ]
      }, item_0.id, true, undefined, this);
    });
    $[59] = focusIndex;
    $[60] = t18;
    $[61] = t19;
  } else {
    t19 = $[61];
  }
  const t20 = isAllSelected ? "All tools selected" : `${selectedSet.size} of ${customAgentTools.length} tools selected`;
  let t21;
  if ($[62] !== t20) {
    t21 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        children: t20
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[62] = t20;
    $[63] = t21;
  } else {
    t21 = $[63];
  }
  let t22;
  if ($[64] !== handleKeyDown || $[65] !== t16 || $[66] !== t19 || $[67] !== t21) {
    t22 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: [
        t16,
        t17,
        t19,
        t21
      ]
    }, undefined, true, undefined, this);
    $[64] = handleKeyDown;
    $[65] = t16;
    $[66] = t19;
    $[67] = t21;
    $[68] = t22;
  } else {
    t22 = $[68];
  }
  return t22;
}
function _temp8() {}
function _temp7(t_10) {
  return t_10.name;
}
function _temp6() {}
function _temp5(t_7) {
  return t_7.name;
}
function _temp4(t_6) {
  return t_6.name;
}
function _temp3(t_4) {
  return t_4.name;
}
function _temp22(t_0) {
  return t_0.name;
}
function _temp9(t) {
  return t.name;
}
var import_compiler_runtime4, import_react2, jsx_dev_runtime4;
var init_ToolSelector = __esm(() => {
  init_figures();
  init_mcpStringUtils();
  init_utils();
  init_agentToolUtils();
  init_constants2();
  init_BashTool();
  init_ExitPlanModeV2Tool();
  init_FileEditTool();
  init_FileReadTool();
  init_FileWriteTool();
  init_GlobTool();
  init_GrepTool();
  init_ListMcpResourcesTool();
  init_NotebookEditTool();
  init_ReadMcpResourceTool();
  init_TaskOutputTool();
  init_TaskStopTool();
  init_TodoWriteTool();
  init_TungstenTool();
  init_WebFetchTool();
  init_WebSearchTool();
  init_ink();
  init_useKeybinding();
  init_array();
  init_stringUtils();
  init_Divider();
  import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/utils.ts
function getAgentSourceDisplayName(source) {
  if (source === "all") {
    return "Agents";
  }
  if (source === "built-in") {
    return "Built-in agents";
  }
  if (source === "plugin") {
    return "Plugin agents";
  }
  return capitalize_default(getSettingSourceName(source));
}
var init_utils2 = __esm(() => {
  init_capitalize();
  init_constants();
});

// src/components/agents/AgentEditor.tsx
function AgentEditor({
  agent,
  tools,
  onSaved,
  onBack
}) {
  const setAppState = useSetAppState();
  const [editMode, setEditMode] = import_react3.useState("menu");
  const [selectedMenuIndex, setSelectedMenuIndex] = import_react3.useState(0);
  const [error, setError] = import_react3.useState(null);
  const [selectedColor, setSelectedColor] = import_react3.useState(agent.color);
  const handleOpenInEditor = import_react3.useCallback(async () => {
    const filePath = getActualAgentFilePath(agent);
    const result = await editFileInEditor(filePath);
    if (result.error) {
      setError(result.error);
    } else {
      onSaved(`Opened ${agent.agentType} in editor. If you made edits, restart to load the latest version.`);
    }
  }, [agent, onSaved]);
  const handleSave = import_react3.useCallback(async (changes = {}) => {
    const {
      tools: newTools,
      color: newColor,
      model: newModel
    } = changes;
    const finalColor = newColor ?? selectedColor;
    const hasToolsChanged = newTools !== undefined;
    const hasModelChanged = newModel !== undefined;
    const hasColorChanged = finalColor !== agent.color;
    if (!hasToolsChanged && !hasModelChanged && !hasColorChanged) {
      return false;
    }
    try {
      if (!isCustomAgent(agent) && !isPluginAgent(agent)) {
        return false;
      }
      await updateAgentFile(agent, agent.whenToUse, newTools ?? agent.tools, agent.getSystemPrompt(), finalColor, newModel ?? agent.model);
      if (hasColorChanged && finalColor) {
        setAgentColor(agent.agentType, finalColor);
      }
      setAppState((state) => {
        const allAgents = state.agentDefinitions.allAgents.map((a) => a.agentType === agent.agentType ? {
          ...a,
          tools: newTools ?? a.tools,
          color: finalColor,
          model: newModel ?? a.model
        } : a);
        return {
          ...state,
          agentDefinitions: {
            ...state.agentDefinitions,
            activeAgents: getActiveAgentsFromList(allAgents),
            allAgents
          }
        };
      });
      onSaved(`Updated agent: ${source_default.bold(agent.agentType)}`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save agent");
      return false;
    }
  }, [agent, selectedColor, onSaved, setAppState]);
  const menuItems = import_react3.useMemo(() => [{
    label: "Open in editor",
    action: handleOpenInEditor
  }, {
    label: "Edit tools",
    action: () => setEditMode("edit-tools")
  }, {
    label: "Edit model",
    action: () => setEditMode("edit-model")
  }, {
    label: "Edit color",
    action: () => setEditMode("edit-color")
  }], [handleOpenInEditor]);
  const handleEscape = import_react3.useCallback(() => {
    setError(null);
    if (editMode === "menu") {
      onBack();
    } else {
      setEditMode("menu");
    }
  }, [editMode, onBack]);
  const handleMenuKeyDown = import_react3.useCallback((e) => {
    if (e.key === "up") {
      e.preventDefault();
      setSelectedMenuIndex((index) => Math.max(0, index - 1));
    } else if (e.key === "down") {
      e.preventDefault();
      setSelectedMenuIndex((index_0) => Math.min(menuItems.length - 1, index_0 + 1));
    } else if (e.key === "return") {
      e.preventDefault();
      const selectedItem = menuItems[selectedMenuIndex];
      if (selectedItem) {
        selectedItem.action();
      }
    }
  }, [menuItems, selectedMenuIndex]);
  useKeybinding("confirm:no", handleEscape, {
    context: "Confirmation"
  });
  const renderMenu = () => /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    tabIndex: 0,
    autoFocus: true,
    onKeyDown: handleMenuKeyDown,
    children: [
      /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "Source: ",
          getAgentSourceDisplayName(agent.source)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        flexDirection: "column",
        children: menuItems.map((item, index_1) => /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          color: index_1 === selectedMenuIndex ? "suggestion" : undefined,
          children: [
            index_1 === selectedMenuIndex ? `${figures_default.pointer} ` : "  ",
            item.label
          ]
        }, item.label, true, undefined, this))
      }, undefined, false, undefined, this),
      error && /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          color: "error",
          children: error
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
  switch (editMode) {
    case "menu":
      return renderMenu();
    case "edit-tools":
      return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ToolSelector, {
        tools,
        initialTools: agent.tools,
        onComplete: async (finalTools) => {
          setEditMode("menu");
          await handleSave({
            tools: finalTools
          });
        }
      }, undefined, false, undefined, this);
    case "edit-color":
      return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ColorPicker, {
        agentName: agent.agentType,
        currentColor: selectedColor || agent.color || "automatic",
        onConfirm: async (color) => {
          setSelectedColor(color);
          setEditMode("menu");
          await handleSave({
            color
          });
        }
      }, undefined, false, undefined, this);
    case "edit-model":
      return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ModelSelector, {
        initialModel: agent.model,
        onComplete: async (model) => {
          setEditMode("menu");
          await handleSave({
            model
          });
        }
      }, undefined, false, undefined, this);
    default:
      return null;
  }
}
var import_react3, jsx_dev_runtime5;
var init_AgentEditor = __esm(() => {
  init_source();
  init_figures();
  init_AppState();
  init_ink();
  init_useKeybinding();
  init_agentColorManager();
  init_loadAgentsDir();
  init_promptEditor();
  init_agentFileUtils();
  init_ColorPicker();
  init_ModelSelector();
  init_ToolSelector();
  init_utils2();
  import_react3 = __toESM(require_react(), 1);
  jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/AgentNavigationFooter.tsx
function AgentNavigationFooter(t0) {
  const $ = import_compiler_runtime5.c(2);
  const {
    instructions: t1
  } = t0;
  const instructions = t1 === undefined ? "Press \u2191\u2193 to navigate \xB7 Enter to select \xB7 Esc to go back" : t1;
  const exitState = useExitOnCtrlCDWithKeybindings();
  const t2 = exitState.pending ? `Press ${exitState.keyName} again to exit` : instructions;
  let t3;
  if ($[0] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
      marginLeft: 2,
      children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        dimColor: true,
        children: t2
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[0] = t2;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  return t3;
}
var import_compiler_runtime5, jsx_dev_runtime6;
var init_AgentNavigationFooter = __esm(() => {
  init_useExitOnCtrlCDWithKeybindings();
  init_ink();
  import_compiler_runtime5 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime6 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/AgentsList.tsx
function AgentsList(t0) {
  const $ = import_compiler_runtime6.c(96);
  const {
    source,
    agents,
    onBack,
    onSelect,
    onCreateNew,
    changes
  } = t0;
  const [selectedAgent, setSelectedAgent] = React3.useState(null);
  const [isCreateNewSelected, setIsCreateNewSelected] = React3.useState(true);
  let t1;
  if ($[0] !== agents) {
    t1 = [...agents].sort(compareAgentsByName);
    $[0] = agents;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const sortedAgents = t1;
  const getOverrideInfo = _temp11;
  let t2;
  if ($[2] !== isCreateNewSelected) {
    t2 = () => /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          color: isCreateNewSelected ? "suggestion" : undefined,
          children: isCreateNewSelected ? `${figures_default.pointer} ` : "  "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          color: isCreateNewSelected ? "suggestion" : undefined,
          children: "Create new agent"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[2] = isCreateNewSelected;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const renderCreateNewOption = t2;
  let t3;
  if ($[4] !== isCreateNewSelected || $[5] !== selectedAgent?.agentType || $[6] !== selectedAgent?.source) {
    t3 = (agent_0) => {
      const isBuiltIn = agent_0.source === "built-in";
      const isSelected = !isBuiltIn && !isCreateNewSelected && selectedAgent?.agentType === agent_0.agentType && selectedAgent?.source === agent_0.source;
      const {
        isOverridden,
        overriddenBy
      } = getOverrideInfo(agent_0);
      const dimmed = isBuiltIn || isOverridden;
      const textColor = !isBuiltIn && isSelected ? "suggestion" : undefined;
      const resolvedModel = resolveAgentModelDisplay(agent_0);
      return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: dimmed && !isSelected,
            color: textColor,
            children: isBuiltIn ? "" : isSelected ? `${figures_default.pointer} ` : "  "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: dimmed && !isSelected,
            color: textColor,
            children: agent_0.agentType
          }, undefined, false, undefined, this),
          resolvedModel && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            color: textColor,
            children: [
              " \xB7 ",
              resolvedModel
            ]
          }, undefined, true, undefined, this),
          agent_0.memory && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            color: textColor,
            children: [
              " \xB7 ",
              agent_0.memory,
              " memory"
            ]
          }, undefined, true, undefined, this),
          overriddenBy && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: !isSelected,
            color: isSelected ? "warning" : undefined,
            children: [
              " ",
              figures_default.warning,
              " shadowed by ",
              getOverrideSourceLabel(overriddenBy)
            ]
          }, undefined, true, undefined, this)
        ]
      }, `${agent_0.agentType}-${agent_0.source}`, true, undefined, this);
    };
    $[4] = isCreateNewSelected;
    $[5] = selectedAgent?.agentType;
    $[6] = selectedAgent?.source;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const renderAgent = t3;
  let t4;
  if ($[8] !== sortedAgents || $[9] !== source) {
    bb0: {
      const nonBuiltIn = sortedAgents.filter(_temp23);
      if (source === "all") {
        t4 = AGENT_SOURCE_GROUPS.filter(_temp32).flatMap((t52) => {
          const {
            source: groupSource
          } = t52;
          return nonBuiltIn.filter((a_0) => a_0.source === groupSource);
        });
        break bb0;
      }
      t4 = nonBuiltIn;
    }
    $[8] = sortedAgents;
    $[9] = source;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  const selectableAgentsInOrder = t4;
  let t5;
  let t6;
  if ($[11] !== isCreateNewSelected || $[12] !== onCreateNew || $[13] !== selectableAgentsInOrder || $[14] !== selectedAgent) {
    t5 = () => {
      if (!selectedAgent && !isCreateNewSelected && selectableAgentsInOrder.length > 0) {
        if (onCreateNew) {
          setIsCreateNewSelected(true);
        } else {
          setSelectedAgent(selectableAgentsInOrder[0] || null);
        }
      }
    };
    t6 = [selectableAgentsInOrder, selectedAgent, isCreateNewSelected, onCreateNew];
    $[11] = isCreateNewSelected;
    $[12] = onCreateNew;
    $[13] = selectableAgentsInOrder;
    $[14] = selectedAgent;
    $[15] = t5;
    $[16] = t6;
  } else {
    t5 = $[15];
    t6 = $[16];
  }
  React3.useEffect(t5, t6);
  let t7;
  if ($[17] !== isCreateNewSelected || $[18] !== onCreateNew || $[19] !== onSelect || $[20] !== selectableAgentsInOrder || $[21] !== selectedAgent) {
    t7 = (e) => {
      if (e.key === "return") {
        e.preventDefault();
        if (isCreateNewSelected && onCreateNew) {
          onCreateNew();
        } else {
          if (selectedAgent) {
            onSelect(selectedAgent);
          }
        }
        return;
      }
      if (e.key !== "up" && e.key !== "down") {
        return;
      }
      e.preventDefault();
      const hasCreateOption = !!onCreateNew;
      const totalItems = selectableAgentsInOrder.length + (hasCreateOption ? 1 : 0);
      if (totalItems === 0) {
        return;
      }
      let currentPosition = 0;
      if (!isCreateNewSelected && selectedAgent) {
        const agentIndex = selectableAgentsInOrder.findIndex((a_1) => a_1.agentType === selectedAgent.agentType && a_1.source === selectedAgent.source);
        if (agentIndex >= 0) {
          currentPosition = hasCreateOption ? agentIndex + 1 : agentIndex;
        }
      }
      const newPosition = e.key === "up" ? currentPosition === 0 ? totalItems - 1 : currentPosition - 1 : currentPosition === totalItems - 1 ? 0 : currentPosition + 1;
      if (hasCreateOption && newPosition === 0) {
        setIsCreateNewSelected(true);
        setSelectedAgent(null);
      } else {
        const agentIndex_0 = hasCreateOption ? newPosition - 1 : newPosition;
        const newAgent = selectableAgentsInOrder[agentIndex_0];
        if (newAgent) {
          setIsCreateNewSelected(false);
          setSelectedAgent(newAgent);
        }
      }
    };
    $[17] = isCreateNewSelected;
    $[18] = onCreateNew;
    $[19] = onSelect;
    $[20] = selectableAgentsInOrder;
    $[21] = selectedAgent;
    $[22] = t7;
  } else {
    t7 = $[22];
  }
  const handleKeyDown = t7;
  let t8;
  if ($[23] !== renderAgent || $[24] !== sortedAgents) {
    t8 = (t92) => {
      const title = t92 === undefined ? "Built-in (always available):" : t92;
      const builtInAgents = sortedAgents.filter(_temp42);
      return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        marginBottom: 1,
        paddingLeft: 2,
        children: [
          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            bold: true,
            dimColor: true,
            children: title
          }, undefined, false, undefined, this),
          builtInAgents.map(renderAgent)
        ]
      }, undefined, true, undefined, this);
    };
    $[23] = renderAgent;
    $[24] = sortedAgents;
    $[25] = t8;
  } else {
    t8 = $[25];
  }
  const renderBuiltInAgentsSection = t8;
  let t9;
  if ($[26] !== renderAgent) {
    t9 = (title_0, groupAgents) => {
      if (!groupAgents.length) {
        return null;
      }
      const folderPath = groupAgents[0]?.baseDir;
      return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
            paddingLeft: 2,
            children: [
              /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                bold: true,
                dimColor: true,
                children: title_0
              }, undefined, false, undefined, this),
              folderPath && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  " (",
                  folderPath,
                  ")"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          groupAgents.map((agent_1) => renderAgent(agent_1))
        ]
      }, undefined, true, undefined, this);
    };
    $[26] = renderAgent;
    $[27] = t9;
  } else {
    t9 = $[27];
  }
  const renderAgentGroup = t9;
  let t10;
  if ($[28] !== source) {
    t10 = getAgentSourceDisplayName(source);
    $[28] = source;
    $[29] = t10;
  } else {
    t10 = $[29];
  }
  const sourceTitle = t10;
  let T0;
  let T1;
  let t11;
  let t12;
  let t13;
  let t14;
  let t15;
  let t16;
  let t17;
  let t18;
  let t19;
  let t20;
  let t21;
  let t22;
  if ($[30] !== changes || $[31] !== handleKeyDown || $[32] !== onBack || $[33] !== onCreateNew || $[34] !== renderAgent || $[35] !== renderAgentGroup || $[36] !== renderBuiltInAgentsSection || $[37] !== renderCreateNewOption || $[38] !== sortedAgents || $[39] !== source || $[40] !== sourceTitle) {
    t22 = Symbol.for("react.early_return_sentinel");
    bb1: {
      const builtInAgents_0 = sortedAgents.filter(_temp52);
      const hasNoAgents = !sortedAgents.length || source !== "built-in" && !sortedAgents.some(_temp62);
      if (hasNoAgents) {
        let t233;
        if ($[55] !== onCreateNew || $[56] !== renderCreateNewOption) {
          t233 = onCreateNew && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
            children: renderCreateNewOption()
          }, undefined, false, undefined, this);
          $[55] = onCreateNew;
          $[56] = renderCreateNewOption;
          $[57] = t233;
        } else {
          t233 = $[57];
        }
        let t242;
        let t25;
        let t26;
        if ($[58] === Symbol.for("react.memo_cache_sentinel")) {
          t242 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            children: "No agents found. Create specialized subagents that Claude can delegate to."
          }, undefined, false, undefined, this);
          t25 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Each subagent has its own context window, custom system prompt, and specific tools."
          }, undefined, false, undefined, this);
          t26 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Try creating: Code Reviewer, Code Simplifier, Security Reviewer, Tech Lead, or UX Reviewer."
          }, undefined, false, undefined, this);
          $[58] = t242;
          $[59] = t25;
          $[60] = t26;
        } else {
          t242 = $[58];
          t25 = $[59];
          t26 = $[60];
        }
        let t27;
        if ($[61] !== renderBuiltInAgentsSection || $[62] !== sortedAgents || $[63] !== source) {
          t27 = source !== "built-in" && sortedAgents.some(_temp72) && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Divider, {}, undefined, false, undefined, this),
              renderBuiltInAgentsSection()
            ]
          }, undefined, true, undefined, this);
          $[61] = renderBuiltInAgentsSection;
          $[62] = sortedAgents;
          $[63] = source;
          $[64] = t27;
        } else {
          t27 = $[64];
        }
        let t28;
        if ($[65] !== handleKeyDown || $[66] !== t233 || $[67] !== t27) {
          t28 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            gap: 1,
            tabIndex: 0,
            autoFocus: true,
            onKeyDown: handleKeyDown,
            children: [
              t233,
              t242,
              t25,
              t26,
              t27
            ]
          }, undefined, true, undefined, this);
          $[65] = handleKeyDown;
          $[66] = t233;
          $[67] = t27;
          $[68] = t28;
        } else {
          t28 = $[68];
        }
        let t29;
        if ($[69] !== onBack || $[70] !== sourceTitle || $[71] !== t28) {
          t29 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Dialog, {
            title: sourceTitle,
            subtitle: "No agents found",
            onCancel: onBack,
            hideInputGuide: true,
            children: t28
          }, undefined, false, undefined, this);
          $[69] = onBack;
          $[70] = sourceTitle;
          $[71] = t28;
          $[72] = t29;
        } else {
          t29 = $[72];
        }
        t22 = t29;
        break bb1;
      }
      T1 = Dialog;
      t17 = sourceTitle;
      let t232;
      if ($[73] !== sortedAgents) {
        t232 = count(sortedAgents, _temp82);
        $[73] = sortedAgents;
        $[74] = t232;
      } else {
        t232 = $[74];
      }
      t18 = `${t232} agents`;
      t19 = onBack;
      t20 = true;
      if ($[75] !== changes) {
        t21 = changes && changes.length > 0 && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            children: changes[changes.length - 1]
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this);
        $[75] = changes;
        $[76] = t21;
      } else {
        t21 = $[76];
      }
      T0 = ThemedBox_default;
      t11 = "column";
      t12 = 0;
      t13 = true;
      t14 = handleKeyDown;
      if ($[77] !== onCreateNew || $[78] !== renderCreateNewOption) {
        t15 = onCreateNew && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: renderCreateNewOption()
        }, undefined, false, undefined, this);
        $[77] = onCreateNew;
        $[78] = renderCreateNewOption;
        $[79] = t15;
      } else {
        t15 = $[79];
      }
      t16 = source === "all" ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
        children: [
          AGENT_SOURCE_GROUPS.filter(_temp92).map((t242) => {
            const {
              label,
              source: groupSource_0
            } = t242;
            return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(React3.Fragment, {
              children: renderAgentGroup(label, sortedAgents.filter((a_7) => a_7.source === groupSource_0))
            }, groupSource_0, false, undefined, this);
          }),
          builtInAgents_0.length > 0 && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginBottom: 1,
            paddingLeft: 2,
            children: [
              /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Built-in agents"
                  }, undefined, false, undefined, this),
                  " (always available)"
                ]
              }, undefined, true, undefined, this),
              builtInAgents_0.map(renderAgent)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this) : source === "built-in" ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: "Built-in agents are provided by default and cannot be modified."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            flexDirection: "column",
            children: sortedAgents.map((agent_2) => renderAgent(agent_2))
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
        children: [
          sortedAgents.filter(_temp0).map((agent_3) => renderAgent(agent_3)),
          sortedAgents.some(_temp1) && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Divider, {}, undefined, false, undefined, this),
              renderBuiltInAgentsSection()
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
    }
    $[30] = changes;
    $[31] = handleKeyDown;
    $[32] = onBack;
    $[33] = onCreateNew;
    $[34] = renderAgent;
    $[35] = renderAgentGroup;
    $[36] = renderBuiltInAgentsSection;
    $[37] = renderCreateNewOption;
    $[38] = sortedAgents;
    $[39] = source;
    $[40] = sourceTitle;
    $[41] = T0;
    $[42] = T1;
    $[43] = t11;
    $[44] = t12;
    $[45] = t13;
    $[46] = t14;
    $[47] = t15;
    $[48] = t16;
    $[49] = t17;
    $[50] = t18;
    $[51] = t19;
    $[52] = t20;
    $[53] = t21;
    $[54] = t22;
  } else {
    T0 = $[41];
    T1 = $[42];
    t11 = $[43];
    t12 = $[44];
    t13 = $[45];
    t14 = $[46];
    t15 = $[47];
    t16 = $[48];
    t17 = $[49];
    t18 = $[50];
    t19 = $[51];
    t20 = $[52];
    t21 = $[53];
    t22 = $[54];
  }
  if (t22 !== Symbol.for("react.early_return_sentinel")) {
    return t22;
  }
  let t23;
  if ($[80] !== T0 || $[81] !== t11 || $[82] !== t12 || $[83] !== t13 || $[84] !== t14 || $[85] !== t15 || $[86] !== t16) {
    t23 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(T0, {
      flexDirection: t11,
      tabIndex: t12,
      autoFocus: t13,
      onKeyDown: t14,
      children: [
        t15,
        t16
      ]
    }, undefined, true, undefined, this);
    $[80] = T0;
    $[81] = t11;
    $[82] = t12;
    $[83] = t13;
    $[84] = t14;
    $[85] = t15;
    $[86] = t16;
    $[87] = t23;
  } else {
    t23 = $[87];
  }
  let t24;
  if ($[88] !== T1 || $[89] !== t17 || $[90] !== t18 || $[91] !== t19 || $[92] !== t20 || $[93] !== t21 || $[94] !== t23) {
    t24 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(T1, {
      title: t17,
      subtitle: t18,
      onCancel: t19,
      hideInputGuide: t20,
      children: [
        t21,
        t23
      ]
    }, undefined, true, undefined, this);
    $[88] = T1;
    $[89] = t17;
    $[90] = t18;
    $[91] = t19;
    $[92] = t20;
    $[93] = t21;
    $[94] = t23;
    $[95] = t24;
  } else {
    t24 = $[95];
  }
  return t24;
}
function _temp1(a_9) {
  return a_9.source === "built-in";
}
function _temp0(a_8) {
  return a_8.source !== "built-in";
}
function _temp92(g_0) {
  return g_0.source !== "built-in";
}
function _temp82(a_6) {
  return !a_6.overriddenBy;
}
function _temp72(a_5) {
  return a_5.source === "built-in";
}
function _temp62(a_4) {
  return a_4.source !== "built-in";
}
function _temp52(a_3) {
  return a_3.source === "built-in";
}
function _temp42(a_2) {
  return a_2.source === "built-in";
}
function _temp32(g) {
  return g.source !== "built-in";
}
function _temp23(a) {
  return a.source !== "built-in";
}
function _temp11(agent) {
  return {
    isOverridden: !!agent.overriddenBy,
    overriddenBy: agent.overriddenBy || null
  };
}
var import_compiler_runtime6, React3, jsx_dev_runtime7;
var init_AgentsList = __esm(() => {
  init_figures();
  init_ink();
  init_agentDisplay();
  init_array();
  init_Dialog();
  init_Divider();
  init_utils2();
  import_compiler_runtime6 = __toESM(require_compiler_runtime(), 1);
  React3 = __toESM(require_react(), 1);
  jsx_dev_runtime7 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/wizard/WizardProvider.tsx
function WizardProvider(t0) {
  const $ = import_compiler_runtime7.c(38);
  const {
    steps,
    initialData: t1,
    onComplete,
    onCancel,
    children,
    title,
    showStepCounter: t2
  } = t0;
  let t3;
  if ($[0] !== t1) {
    t3 = t1 === undefined ? {} : t1;
    $[0] = t1;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  const initialData = t3;
  const showStepCounter = t2 === undefined ? true : t2;
  const [currentStepIndex, setCurrentStepIndex] = import_react4.useState(0);
  const [wizardData, setWizardData] = import_react4.useState(initialData);
  const [isCompleted, setIsCompleted] = import_react4.useState(false);
  let t4;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = [];
    $[2] = t4;
  } else {
    t4 = $[2];
  }
  const [navigationHistory, setNavigationHistory] = import_react4.useState(t4);
  useExitOnCtrlCDWithKeybindings();
  let t5;
  let t6;
  if ($[3] !== isCompleted || $[4] !== onComplete || $[5] !== wizardData) {
    t5 = () => {
      if (isCompleted) {
        setNavigationHistory([]);
        onComplete(wizardData);
      }
    };
    t6 = [isCompleted, wizardData, onComplete];
    $[3] = isCompleted;
    $[4] = onComplete;
    $[5] = wizardData;
    $[6] = t5;
    $[7] = t6;
  } else {
    t5 = $[6];
    t6 = $[7];
  }
  import_react4.useEffect(t5, t6);
  let t7;
  if ($[8] !== currentStepIndex || $[9] !== navigationHistory || $[10] !== steps.length) {
    t7 = () => {
      if (currentStepIndex < steps.length - 1) {
        if (navigationHistory.length > 0) {
          setNavigationHistory((prev) => [...prev, currentStepIndex]);
        }
        setCurrentStepIndex(_temp12);
      } else {
        setIsCompleted(true);
      }
    };
    $[8] = currentStepIndex;
    $[9] = navigationHistory;
    $[10] = steps.length;
    $[11] = t7;
  } else {
    t7 = $[11];
  }
  const goNext = t7;
  let t8;
  if ($[12] !== currentStepIndex || $[13] !== navigationHistory || $[14] !== onCancel) {
    t8 = () => {
      if (navigationHistory.length > 0) {
        const previousStep = navigationHistory[navigationHistory.length - 1];
        if (previousStep !== undefined) {
          setNavigationHistory(_temp24);
          setCurrentStepIndex(previousStep);
        }
      } else {
        if (currentStepIndex > 0) {
          setCurrentStepIndex(_temp33);
        } else {
          if (onCancel) {
            onCancel();
          }
        }
      }
    };
    $[12] = currentStepIndex;
    $[13] = navigationHistory;
    $[14] = onCancel;
    $[15] = t8;
  } else {
    t8 = $[15];
  }
  const goBack = t8;
  let t9;
  if ($[16] !== currentStepIndex || $[17] !== steps.length) {
    t9 = (index) => {
      if (index >= 0 && index < steps.length) {
        setNavigationHistory((prev_3) => [...prev_3, currentStepIndex]);
        setCurrentStepIndex(index);
      }
    };
    $[16] = currentStepIndex;
    $[17] = steps.length;
    $[18] = t9;
  } else {
    t9 = $[18];
  }
  const goToStep = t9;
  let t10;
  if ($[19] !== onCancel) {
    t10 = () => {
      setNavigationHistory([]);
      if (onCancel) {
        onCancel();
      }
    };
    $[19] = onCancel;
    $[20] = t10;
  } else {
    t10 = $[20];
  }
  const cancel = t10;
  let t11;
  if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
    t11 = (updates) => {
      setWizardData((prev_4) => ({
        ...prev_4,
        ...updates
      }));
    };
    $[21] = t11;
  } else {
    t11 = $[21];
  }
  const updateWizardData = t11;
  let t12;
  if ($[22] !== cancel || $[23] !== currentStepIndex || $[24] !== goBack || $[25] !== goNext || $[26] !== goToStep || $[27] !== showStepCounter || $[28] !== steps.length || $[29] !== title || $[30] !== wizardData) {
    t12 = {
      currentStepIndex,
      totalSteps: steps.length,
      wizardData,
      setWizardData,
      updateWizardData,
      goNext,
      goBack,
      goToStep,
      cancel,
      title,
      showStepCounter
    };
    $[22] = cancel;
    $[23] = currentStepIndex;
    $[24] = goBack;
    $[25] = goNext;
    $[26] = goToStep;
    $[27] = showStepCounter;
    $[28] = steps.length;
    $[29] = title;
    $[30] = wizardData;
    $[31] = t12;
  } else {
    t12 = $[31];
  }
  const contextValue = t12;
  const CurrentStepComponent = steps[currentStepIndex];
  if (!CurrentStepComponent || isCompleted) {
    return null;
  }
  let t13;
  if ($[32] !== CurrentStepComponent || $[33] !== children) {
    t13 = children || /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(CurrentStepComponent, {}, undefined, false, undefined, this);
    $[32] = CurrentStepComponent;
    $[33] = children;
    $[34] = t13;
  } else {
    t13 = $[34];
  }
  let t14;
  if ($[35] !== contextValue || $[36] !== t13) {
    t14 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(WizardContext.Provider, {
      value: contextValue,
      children: t13
    }, undefined, false, undefined, this);
    $[35] = contextValue;
    $[36] = t13;
    $[37] = t14;
  } else {
    t14 = $[37];
  }
  return t14;
}
function _temp33(prev_2) {
  return prev_2 - 1;
}
function _temp24(prev_1) {
  return prev_1.slice(0, -1);
}
function _temp12(prev_0) {
  return prev_0 + 1;
}
var import_compiler_runtime7, import_react4, jsx_dev_runtime8, WizardContext;
var init_WizardProvider = __esm(() => {
  init_useExitOnCtrlCDWithKeybindings();
  import_compiler_runtime7 = __toESM(require_compiler_runtime(), 1);
  import_react4 = __toESM(require_react(), 1);
  jsx_dev_runtime8 = __toESM(require_jsx_dev_runtime(), 1);
  WizardContext = import_react4.createContext(null);
});

// src/components/wizard/useWizard.ts
function useWizard() {
  const context = import_react5.useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
var import_react5;
var init_useWizard = __esm(() => {
  init_WizardProvider();
  import_react5 = __toESM(require_react(), 1);
});

// src/components/wizard/WizardNavigationFooter.tsx
function WizardNavigationFooter({
  instructions = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(Byline, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(KeyboardShortcutHint, {
        shortcut: "\u2191\u2193",
        action: "navigate"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(KeyboardShortcutHint, {
        shortcut: "Enter",
        action: "select"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ConfigurableShortcutHint, {
        action: "confirm:no",
        context: "Confirmation",
        fallback: "Esc",
        description: "go back"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this)
}) {
  const exitState = useExitOnCtrlCDWithKeybindings();
  return /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedBox_default, {
    marginLeft: 3,
    marginTop: 1,
    children: /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      dimColor: true,
      children: exitState.pending ? `Press ${exitState.keyName} again to exit` : instructions
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
var jsx_dev_runtime9;
var init_WizardNavigationFooter = __esm(() => {
  init_useExitOnCtrlCDWithKeybindings();
  init_ink();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  jsx_dev_runtime9 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/wizard/WizardDialogLayout.tsx
function WizardDialogLayout(t0) {
  const $ = import_compiler_runtime8.c(11);
  const {
    title: titleOverride,
    color: t1,
    children,
    subtitle,
    footerText
  } = t0;
  const color = t1 === undefined ? "suggestion" : t1;
  const {
    currentStepIndex,
    totalSteps,
    title: providerTitle,
    showStepCounter,
    goBack
  } = useWizard();
  const title = titleOverride || providerTitle || "Wizard";
  const stepSuffix = showStepCounter !== false ? ` (${currentStepIndex + 1}/${totalSteps})` : "";
  const t2 = `${title}${stepSuffix}`;
  let t3;
  if ($[0] !== children || $[1] !== color || $[2] !== goBack || $[3] !== subtitle || $[4] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Dialog, {
      title: t2,
      subtitle,
      onCancel: goBack,
      color,
      hideInputGuide: true,
      isCancelActive: false,
      children
    }, undefined, false, undefined, this);
    $[0] = children;
    $[1] = color;
    $[2] = goBack;
    $[3] = subtitle;
    $[4] = t2;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== footerText) {
    t4 = /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(WizardNavigationFooter, {
      instructions: footerText
    }, undefined, false, undefined, this);
    $[6] = footerText;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== t3 || $[9] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
      children: [
        t3,
        t4
      ]
    }, undefined, true, undefined, this);
    $[8] = t3;
    $[9] = t4;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  return t5;
}
var import_compiler_runtime8, jsx_dev_runtime10;
var init_WizardDialogLayout = __esm(() => {
  init_Dialog();
  init_useWizard();
  init_WizardNavigationFooter();
  import_compiler_runtime8 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime10 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/wizard/index.ts
var init_wizard = __esm(() => {
  init_useWizard();
  init_WizardDialogLayout();
  init_WizardNavigationFooter();
  init_WizardProvider();
});

// src/components/agents/new-agent-creation/wizard-steps/ColorStep.tsx
function ColorStep() {
  const $ = import_compiler_runtime9.c(14);
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      context: "Confirmation"
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useKeybinding("confirm:no", goBack, t0);
  let t1;
  if ($[1] !== goNext || $[2] !== updateWizardData || $[3] !== wizardData.agentType || $[4] !== wizardData.location || $[5] !== wizardData.selectedModel || $[6] !== wizardData.selectedTools || $[7] !== wizardData.systemPrompt || $[8] !== wizardData.whenToUse) {
    t1 = (color) => {
      updateWizardData({
        selectedColor: color,
        finalAgent: {
          agentType: wizardData.agentType,
          whenToUse: wizardData.whenToUse,
          getSystemPrompt: () => wizardData.systemPrompt,
          tools: wizardData.selectedTools,
          ...wizardData.selectedModel ? {
            model: wizardData.selectedModel
          } : {},
          ...color ? {
            color
          } : {},
          source: wizardData.location
        }
      });
      goNext();
    };
    $[1] = goNext;
    $[2] = updateWizardData;
    $[3] = wizardData.agentType;
    $[4] = wizardData.location;
    $[5] = wizardData.selectedModel;
    $[6] = wizardData.selectedTools;
    $[7] = wizardData.systemPrompt;
    $[8] = wizardData.whenToUse;
    $[9] = t1;
  } else {
    t1 = $[9];
  }
  const handleConfirm = t1;
  let t2;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2191\u2193",
          action: "navigate"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "select"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Confirmation",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[10] = t2;
  } else {
    t2 = $[10];
  }
  const t3 = wizardData.agentType || "agent";
  let t4;
  if ($[11] !== handleConfirm || $[12] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(WizardDialogLayout, {
      subtitle: "Choose background color",
      footerText: t2,
      children: /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ColorPicker, {
          agentName: t3,
          currentColor: "automatic",
          onConfirm: handleConfirm
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[11] = handleConfirm;
    $[12] = t3;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  return t4;
}
var import_compiler_runtime9, jsx_dev_runtime11;
var init_ColorStep = __esm(() => {
  init_ink();
  init_useKeybinding();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_wizard();
  init_WizardDialogLayout();
  init_ColorPicker();
  import_compiler_runtime9 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime11 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/validateAgent.ts
function validateAgentType(agentType) {
  if (!agentType) {
    return "Agent type is required";
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(agentType)) {
    return "Agent type must start and end with alphanumeric characters and contain only letters, numbers, and hyphens";
  }
  if (agentType.length < 3) {
    return "Agent type must be at least 3 characters long";
  }
  if (agentType.length > 50) {
    return "Agent type must be less than 50 characters";
  }
  return null;
}
function validateAgent(agent, availableTools, existingAgents) {
  const errors = [];
  const warnings = [];
  if (!agent.agentType) {
    errors.push("Agent type is required");
  } else {
    const typeError = validateAgentType(agent.agentType);
    if (typeError) {
      errors.push(typeError);
    }
    const duplicate = existingAgents.find((a) => a.agentType === agent.agentType && a.source !== agent.source);
    if (duplicate) {
      errors.push(`Agent type "${agent.agentType}" already exists in ${getAgentSourceDisplayName(duplicate.source)}`);
    }
  }
  if (!agent.whenToUse) {
    errors.push("Description (description) is required");
  } else if (agent.whenToUse.length < 10) {
    warnings.push("Description should be more descriptive (at least 10 characters)");
  } else if (agent.whenToUse.length > 5000) {
    warnings.push("Description is very long (over 5000 characters)");
  }
  if (agent.tools !== undefined && !Array.isArray(agent.tools)) {
    errors.push("Tools must be an array");
  } else {
    if (agent.tools === undefined) {
      warnings.push("Agent has access to all tools");
    } else if (agent.tools.length === 0) {
      warnings.push("No tools selected - agent will have very limited capabilities");
    }
    const resolvedTools = resolveAgentTools(agent, availableTools, false);
    if (resolvedTools.invalidTools.length > 0) {
      errors.push(`Invalid tools: ${resolvedTools.invalidTools.join(", ")}`);
    }
  }
  const systemPrompt = agent.getSystemPrompt();
  if (!systemPrompt) {
    errors.push("System prompt is required");
  } else if (systemPrompt.length < 20) {
    errors.push("System prompt is too short (minimum 20 characters)");
  } else if (systemPrompt.length > 1e4) {
    warnings.push("System prompt is very long (over 10,000 characters)");
  }
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
var init_validateAgent = __esm(() => {
  init_agentToolUtils();
  init_utils2();
});

// src/components/agents/new-agent-creation/wizard-steps/ConfirmStep.tsx
function ConfirmStep(t0) {
  const $ = import_compiler_runtime10.c(88);
  const {
    tools,
    existingAgents,
    onSave,
    onSaveAndEdit,
    error
  } = t0;
  const {
    goBack,
    wizardData
  } = useWizard();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      context: "Confirmation"
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  useKeybinding("confirm:no", goBack, t1);
  let t2;
  if ($[1] !== onSave || $[2] !== onSaveAndEdit) {
    t2 = (e) => {
      if (e.key === "s" || e.key === "return") {
        e.preventDefault();
        onSave();
      } else {
        if (e.key === "e") {
          e.preventDefault();
          onSaveAndEdit();
        }
      }
    };
    $[1] = onSave;
    $[2] = onSaveAndEdit;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const handleKeyDown = t2;
  const agent = wizardData.finalAgent;
  let T0;
  let T1;
  let t10;
  let t11;
  let t12;
  let t13;
  let t14;
  let t15;
  let t16;
  let t17;
  let t18;
  let t19;
  let t3;
  let t4;
  let t5;
  let t6;
  let t7;
  let t8;
  let t9;
  if ($[4] !== agent || $[5] !== existingAgents || $[6] !== handleKeyDown || $[7] !== tools || $[8] !== wizardData.location) {
    const validation = validateAgent(agent, tools, existingAgents);
    let t202;
    if ($[28] !== agent) {
      t202 = truncateToWidth(agent.getSystemPrompt(), 240);
      $[28] = agent;
      $[29] = t202;
    } else {
      t202 = $[29];
    }
    const systemPromptPreview = t202;
    let t212;
    if ($[30] !== agent.whenToUse) {
      t212 = truncateToWidth(agent.whenToUse, 240);
      $[30] = agent.whenToUse;
      $[31] = t212;
    } else {
      t212 = $[31];
    }
    const whenToUsePreview = t212;
    const getToolsDisplay = _temp13;
    let t222;
    if ($[32] !== agent.memory) {
      t222 = isAutoMemoryEnabled() ? /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
            bold: true,
            children: "Memory"
          }, undefined, false, undefined, this),
          ": ",
          getMemoryScopeDisplay(agent.memory)
        ]
      }, undefined, true, undefined, this) : null;
      $[32] = agent.memory;
      $[33] = t222;
    } else {
      t222 = $[33];
    }
    const memoryDisplayElement = t222;
    T1 = WizardDialogLayout;
    t18 = "Confirm and save";
    if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
      t19 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(Byline, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(KeyboardShortcutHint, {
            shortcut: "s/Enter",
            action: "save"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(KeyboardShortcutHint, {
            shortcut: "e",
            action: "edit in your editor"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ConfigurableShortcutHint, {
            action: "confirm:no",
            context: "Confirmation",
            fallback: "Esc",
            description: "cancel"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[34] = t19;
    } else {
      t19 = $[34];
    }
    T0 = ThemedBox_default;
    t3 = "column";
    t4 = 0;
    t5 = true;
    t6 = handleKeyDown;
    let t232;
    if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
      t232 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        bold: true,
        children: "Name"
      }, undefined, false, undefined, this);
      $[35] = t232;
    } else {
      t232 = $[35];
    }
    if ($[36] !== agent.agentType) {
      t7 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        children: [
          t232,
          ": ",
          agent.agentType
        ]
      }, undefined, true, undefined, this);
      $[36] = agent.agentType;
      $[37] = t7;
    } else {
      t7 = $[37];
    }
    let t242;
    if ($[38] === Symbol.for("react.memo_cache_sentinel")) {
      t242 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        bold: true,
        children: "Location"
      }, undefined, false, undefined, this);
      $[38] = t242;
    } else {
      t242 = $[38];
    }
    let t252;
    if ($[39] !== agent.agentType || $[40] !== wizardData.location) {
      t252 = getNewRelativeAgentFilePath({
        source: wizardData.location,
        agentType: agent.agentType
      });
      $[39] = agent.agentType;
      $[40] = wizardData.location;
      $[41] = t252;
    } else {
      t252 = $[41];
    }
    if ($[42] !== t252) {
      t8 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        children: [
          t242,
          ":",
          " ",
          t252
        ]
      }, undefined, true, undefined, this);
      $[42] = t252;
      $[43] = t8;
    } else {
      t8 = $[43];
    }
    let t26;
    if ($[44] === Symbol.for("react.memo_cache_sentinel")) {
      t26 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        bold: true,
        children: "Tools"
      }, undefined, false, undefined, this);
      $[44] = t26;
    } else {
      t26 = $[44];
    }
    let t27;
    if ($[45] !== agent.tools) {
      t27 = getToolsDisplay(agent.tools);
      $[45] = agent.tools;
      $[46] = t27;
    } else {
      t27 = $[46];
    }
    if ($[47] !== t27) {
      t9 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        children: [
          t26,
          ": ",
          t27
        ]
      }, undefined, true, undefined, this);
      $[47] = t27;
      $[48] = t9;
    } else {
      t9 = $[48];
    }
    let t28;
    if ($[49] === Symbol.for("react.memo_cache_sentinel")) {
      t28 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        bold: true,
        children: "Model"
      }, undefined, false, undefined, this);
      $[49] = t28;
    } else {
      t28 = $[49];
    }
    let t29;
    if ($[50] !== agent.model) {
      t29 = getAgentModelDisplay(agent.model);
      $[50] = agent.model;
      $[51] = t29;
    } else {
      t29 = $[51];
    }
    if ($[52] !== t29) {
      t10 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        children: [
          t28,
          ": ",
          t29
        ]
      }, undefined, true, undefined, this);
      $[52] = t29;
      $[53] = t10;
    } else {
      t10 = $[53];
    }
    t11 = memoryDisplayElement;
    if ($[54] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
              bold: true,
              children: "Description"
            }, undefined, false, undefined, this),
            " (tells Claude when to use this agent):"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this);
      $[54] = t12;
    } else {
      t12 = $[54];
    }
    if ($[55] !== whenToUsePreview) {
      t13 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
        marginLeft: 2,
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          children: whenToUsePreview
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[55] = whenToUsePreview;
      $[56] = t13;
    } else {
      t13 = $[56];
    }
    if ($[57] === Symbol.for("react.memo_cache_sentinel")) {
      t14 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
              bold: true,
              children: "System prompt"
            }, undefined, false, undefined, this),
            ":"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this);
      $[57] = t14;
    } else {
      t14 = $[57];
    }
    if ($[58] !== systemPromptPreview) {
      t15 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
        marginLeft: 2,
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          children: systemPromptPreview
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[58] = systemPromptPreview;
      $[59] = t15;
    } else {
      t15 = $[59];
    }
    t16 = validation.warnings.length > 0 && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          color: "warning",
          children: "Warnings:"
        }, undefined, false, undefined, this),
        validation.warnings.map(_temp25)
      ]
    }, undefined, true, undefined, this);
    t17 = validation.errors.length > 0 && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          color: "error",
          children: "Errors:"
        }, undefined, false, undefined, this),
        validation.errors.map(_temp34)
      ]
    }, undefined, true, undefined, this);
    $[4] = agent;
    $[5] = existingAgents;
    $[6] = handleKeyDown;
    $[7] = tools;
    $[8] = wizardData.location;
    $[9] = T0;
    $[10] = T1;
    $[11] = t10;
    $[12] = t11;
    $[13] = t12;
    $[14] = t13;
    $[15] = t14;
    $[16] = t15;
    $[17] = t16;
    $[18] = t17;
    $[19] = t18;
    $[20] = t19;
    $[21] = t3;
    $[22] = t4;
    $[23] = t5;
    $[24] = t6;
    $[25] = t7;
    $[26] = t8;
    $[27] = t9;
  } else {
    T0 = $[9];
    T1 = $[10];
    t10 = $[11];
    t11 = $[12];
    t12 = $[13];
    t13 = $[14];
    t14 = $[15];
    t15 = $[16];
    t16 = $[17];
    t17 = $[18];
    t18 = $[19];
    t19 = $[20];
    t3 = $[21];
    t4 = $[22];
    t5 = $[23];
    t6 = $[24];
    t7 = $[25];
    t8 = $[26];
    t9 = $[27];
  }
  let t20;
  if ($[60] !== error) {
    t20 = error && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        color: "error",
        children: error
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[60] = error;
    $[61] = t20;
  } else {
    t20 = $[61];
  }
  let t21;
  if ($[62] === Symbol.for("react.memo_cache_sentinel")) {
    t21 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
      bold: true,
      children: "s"
    }, undefined, false, undefined, this);
    $[62] = t21;
  } else {
    t21 = $[62];
  }
  let t22;
  if ($[63] === Symbol.for("react.memo_cache_sentinel")) {
    t22 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
      bold: true,
      children: "Enter"
    }, undefined, false, undefined, this);
    $[63] = t22;
  } else {
    t22 = $[63];
  }
  let t23;
  if ($[64] === Symbol.for("react.memo_cache_sentinel")) {
    t23 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
      marginTop: 2,
      children: /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
        color: "success",
        children: [
          "Press ",
          t21,
          " or ",
          t22,
          " to save,",
          " ",
          /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
            bold: true,
            children: "e"
          }, undefined, false, undefined, this),
          " to save and edit"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[64] = t23;
  } else {
    t23 = $[64];
  }
  let t24;
  if ($[65] !== T0 || $[66] !== t10 || $[67] !== t11 || $[68] !== t12 || $[69] !== t13 || $[70] !== t14 || $[71] !== t15 || $[72] !== t16 || $[73] !== t17 || $[74] !== t20 || $[75] !== t3 || $[76] !== t4 || $[77] !== t5 || $[78] !== t6 || $[79] !== t7 || $[80] !== t8 || $[81] !== t9) {
    t24 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(T0, {
      flexDirection: t3,
      tabIndex: t4,
      autoFocus: t5,
      onKeyDown: t6,
      children: [
        t7,
        t8,
        t9,
        t10,
        t11,
        t12,
        t13,
        t14,
        t15,
        t16,
        t17,
        t20,
        t23
      ]
    }, undefined, true, undefined, this);
    $[65] = T0;
    $[66] = t10;
    $[67] = t11;
    $[68] = t12;
    $[69] = t13;
    $[70] = t14;
    $[71] = t15;
    $[72] = t16;
    $[73] = t17;
    $[74] = t20;
    $[75] = t3;
    $[76] = t4;
    $[77] = t5;
    $[78] = t6;
    $[79] = t7;
    $[80] = t8;
    $[81] = t9;
    $[82] = t24;
  } else {
    t24 = $[82];
  }
  let t25;
  if ($[83] !== T1 || $[84] !== t18 || $[85] !== t19 || $[86] !== t24) {
    t25 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(T1, {
      subtitle: t18,
      footerText: t19,
      children: t24
    }, undefined, false, undefined, this);
    $[83] = T1;
    $[84] = t18;
    $[85] = t19;
    $[86] = t24;
    $[87] = t25;
  } else {
    t25 = $[87];
  }
  return t25;
}
function _temp34(err, i_0) {
  return /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
    color: "error",
    children: [
      " ",
      "\u2022 ",
      err
    ]
  }, i_0, true, undefined, this);
}
function _temp25(warning, i) {
  return /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
    dimColor: true,
    children: [
      " ",
      "\u2022 ",
      warning
    ]
  }, i, true, undefined, this);
}
function _temp13(toolNames) {
  if (toolNames === undefined) {
    return "All tools";
  }
  if (toolNames.length === 0) {
    return "None";
  }
  if (toolNames.length === 1) {
    return toolNames[0] || "None";
  }
  if (toolNames.length === 2) {
    return toolNames.join(" and ");
  }
  return `${toolNames.slice(0, -1).join(", ")}, and ${toolNames[toolNames.length - 1]}`;
}
var import_compiler_runtime10, jsx_dev_runtime12;
var init_ConfirmStep = __esm(() => {
  init_ink();
  init_useKeybinding();
  init_paths();
  init_agentMemory();
  init_format();
  init_agent();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_wizard();
  init_WizardDialogLayout();
  init_agentFileUtils();
  init_validateAgent();
  import_compiler_runtime10 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime12 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/wizard-steps/ConfirmStepWrapper.tsx
function ConfirmStepWrapper({
  tools,
  existingAgents,
  onComplete
}) {
  const {
    wizardData
  } = useWizard();
  const [saveError, setSaveError] = import_react6.useState(null);
  const setAppState = useSetAppState();
  const saveAgent = import_react6.useCallback(async (openInEditor) => {
    if (!wizardData?.finalAgent)
      return;
    try {
      await saveAgentToFile(wizardData.location, wizardData.finalAgent.agentType, wizardData.finalAgent.whenToUse, wizardData.finalAgent.tools, wizardData.finalAgent.getSystemPrompt(), true, wizardData.finalAgent.color, wizardData.finalAgent.model, wizardData.finalAgent.memory);
      setAppState((state) => {
        if (!wizardData.finalAgent)
          return state;
        const allAgents = state.agentDefinitions.allAgents.concat(wizardData.finalAgent);
        return {
          ...state,
          agentDefinitions: {
            ...state.agentDefinitions,
            activeAgents: getActiveAgentsFromList(allAgents),
            allAgents
          }
        };
      });
      if (openInEditor) {
        const filePath = getNewAgentFilePath({
          source: wizardData.location,
          agentType: wizardData.finalAgent.agentType
        });
        await editFileInEditor(filePath);
      }
      logEvent("tengu_agent_created", {
        agent_type: wizardData.finalAgent.agentType,
        generation_method: wizardData.wasGenerated ? "generated" : "manual",
        source: wizardData.location,
        tool_count: wizardData.finalAgent.tools?.length ?? "all",
        has_custom_model: !!wizardData.finalAgent.model,
        has_custom_color: !!wizardData.finalAgent.color,
        has_memory: !!wizardData.finalAgent.memory,
        memory_scope: wizardData.finalAgent.memory ?? "none",
        ...openInEditor ? {
          opened_in_editor: true
        } : {}
      });
      const message = openInEditor ? `Created agent: ${source_default.bold(wizardData.finalAgent.agentType)} and opened in editor. ` + `If you made edits, restart to load the latest version.` : `Created agent: ${source_default.bold(wizardData.finalAgent.agentType)}`;
      onComplete(message);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save agent");
    }
  }, [wizardData, onComplete, setAppState]);
  const handleSave = import_react6.useCallback(() => saveAgent(false), [saveAgent]);
  const handleSaveAndEdit = import_react6.useCallback(() => saveAgent(true), [saveAgent]);
  return /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(ConfirmStep, {
    tools,
    existingAgents,
    onSave: handleSave,
    onSaveAndEdit: handleSaveAndEdit,
    error: saveError
  }, undefined, false, undefined, this);
}
var import_react6, jsx_dev_runtime13;
var init_ConfirmStepWrapper = __esm(() => {
  init_source();
  init_analytics();
  init_AppState();
  init_loadAgentsDir();
  init_promptEditor();
  init_wizard();
  init_agentFileUtils();
  init_ConfirmStep();
  import_react6 = __toESM(require_react(), 1);
  jsx_dev_runtime13 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/wizard-steps/DescriptionStep.tsx
function DescriptionStep() {
  const $ = import_compiler_runtime11.c(18);
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  const [whenToUse, setWhenToUse] = import_react7.useState(wizardData.whenToUse || "");
  const [cursorOffset, setCursorOffset] = import_react7.useState(whenToUse.length);
  const [error, setError] = import_react7.useState(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      context: "Settings"
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useKeybinding("confirm:no", goBack, t0);
  let t1;
  if ($[1] !== whenToUse) {
    t1 = async () => {
      const result = await editPromptInEditor(whenToUse);
      if (result.content !== null) {
        setWhenToUse(result.content);
        setCursorOffset(result.content.length);
      }
    };
    $[1] = whenToUse;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const handleExternalEditor = t1;
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = {
      context: "Chat"
    };
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useKeybinding("chat:externalEditor", handleExternalEditor, t2);
  let t3;
  if ($[4] !== goNext || $[5] !== updateWizardData) {
    t3 = (value) => {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setError("Description is required");
        return;
      }
      setError(null);
      updateWizardData({
        whenToUse: trimmedValue
      });
      goNext();
    };
    $[4] = goNext;
    $[5] = updateWizardData;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const handleSubmit = t3;
  let t4;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Type",
          action: "enter text"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "continue"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ConfigurableShortcutHint, {
          action: "chat:externalEditor",
          context: "Chat",
          fallback: "ctrl+g",
          description: "open in editor"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Settings",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
      children: "When should Claude use this agent?"
    }, undefined, false, undefined, this);
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  let t6;
  if ($[9] !== cursorOffset || $[10] !== handleSubmit || $[11] !== whenToUse) {
    t6 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(TextInput, {
        value: whenToUse,
        onChange: setWhenToUse,
        onSubmit: handleSubmit,
        placeholder: "e.g., use this agent after you're done writing code...",
        columns: 80,
        cursorOffset,
        onChangeCursorOffset: setCursorOffset,
        focus: true,
        showCursor: true
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[9] = cursorOffset;
    $[10] = handleSubmit;
    $[11] = whenToUse;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  let t7;
  if ($[13] !== error) {
    t7 = error && /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        color: "error",
        children: error
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[13] = error;
    $[14] = t7;
  } else {
    t7 = $[14];
  }
  let t8;
  if ($[15] !== t6 || $[16] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(WizardDialogLayout, {
      subtitle: "Description (tell Claude when to use this agent)",
      footerText: t4,
      children: /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t5,
          t6,
          t7
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[15] = t6;
    $[16] = t7;
    $[17] = t8;
  } else {
    t8 = $[17];
  }
  return t8;
}
var import_compiler_runtime11, import_react7, jsx_dev_runtime14;
var init_DescriptionStep = __esm(() => {
  init_ink();
  init_useKeybinding();
  init_promptEditor();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_TextInput();
  init_wizard();
  init_WizardDialogLayout();
  import_compiler_runtime11 = __toESM(require_compiler_runtime(), 1);
  import_react7 = __toESM(require_react(), 1);
  jsx_dev_runtime14 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/generateAgent.ts
async function generateAgent(userPrompt, model, existingIdentifiers, abortSignal) {
  const existingList = existingIdentifiers.length > 0 ? `

IMPORTANT: The following identifiers already exist and must NOT be used: ${existingIdentifiers.join(", ")}` : "";
  const prompt = `Create an agent configuration based on this request: "${userPrompt}".${existingList}
  Return ONLY the JSON object, no other text.`;
  const userMessage = createUserMessage({ content: prompt });
  const userContext = await getUserContext();
  const messagesWithContext = prependUserContext([userMessage], userContext);
  const systemPrompt = isAutoMemoryEnabled() ? AGENT_CREATION_SYSTEM_PROMPT + AGENT_MEMORY_INSTRUCTIONS : AGENT_CREATION_SYSTEM_PROMPT;
  const response = await queryModelWithoutStreaming({
    messages: normalizeMessagesForAPI(messagesWithContext),
    systemPrompt: asSystemPrompt([systemPrompt]),
    thinkingConfig: { type: "disabled" },
    tools: [],
    signal: abortSignal,
    options: {
      getToolPermissionContext: async () => getEmptyToolPermissionContext(),
      model,
      toolChoice: undefined,
      agents: [],
      isNonInteractiveSession: false,
      hasAppendSystemPrompt: false,
      querySource: "agent_creation",
      mcpTools: []
    }
  });
  const textBlocks = (Array.isArray(response.message.content) ? response.message.content : []).filter((block) => block.type === "text");
  const responseText = textBlocks.map((block) => block.text).join(`
`);
  let parsed;
  try {
    parsed = jsonParse(responseText.trim());
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    parsed = jsonParse(jsonMatch[0]);
  }
  if (!parsed.identifier || !parsed.whenToUse || !parsed.systemPrompt) {
    throw new Error("Invalid agent configuration generated");
  }
  logEvent("tengu_agent_definition_generated", {
    agent_identifier: parsed.identifier
  });
  return {
    identifier: parsed.identifier,
    whenToUse: parsed.whenToUse,
    systemPrompt: parsed.systemPrompt
  };
}
var AGENT_CREATION_SYSTEM_PROMPT, AGENT_MEMORY_INSTRUCTIONS = `

7. **Agent Memory Instructions**: If the user mentions "memory", "remember", "learn", "persist", or similar concepts, OR if the agent would benefit from building up knowledge across conversations (e.g., code reviewers learning patterns, architects learning codebase structure, etc.), include domain-specific memory update instructions in the systemPrompt.

   Add a section like this to the systemPrompt, tailored to the agent's specific domain:

   "**Update your agent memory** as you discover [domain-specific items]. This builds up institutional knowledge across conversations. Write concise notes about what you found and where.

   Examples of what to record:
   - [domain-specific item 1]
   - [domain-specific item 2]
   - [domain-specific item 3]"

   Examples of domain-specific memory instructions:
   - For a code-reviewer: "Update your agent memory as you discover code patterns, style conventions, common issues, and architectural decisions in this codebase."
   - For a test-runner: "Update your agent memory as you discover test patterns, common failure modes, flaky tests, and testing best practices."
   - For an architect: "Update your agent memory as you discover codepaths, library locations, key architectural decisions, and component relationships."
   - For a documentation writer: "Update your agent memory as you discover documentation patterns, API structures, and terminology conventions."

   The memory instructions should be specific to what the agent would naturally learn while performing its core tasks.
`;
var init_generateAgent = __esm(() => {
  init_context();
  init_claude();
  init_Tool();
  init_constants2();
  init_api();
  init_messages();
  init_paths();
  init_analytics();
  init_slowOperations();
  init_systemPromptType();
  AGENT_CREATION_SYSTEM_PROMPT = `You are an elite AI agent architect specializing in crafting high-performance agent configurations. Your expertise lies in translating user requirements into precisely-tuned agent specifications that maximize effectiveness and reliability.

**Important Context**: You may have access to project-specific instructions from CLAUDE.md files and other context that may include coding standards, project structure, and custom requirements. Consider this context when creating agents to ensure they align with the project's established patterns and practices.

When a user describes what they want an agent to do, you will:

1. **Extract Core Intent**: Identify the fundamental purpose, key responsibilities, and success criteria for the agent. Look for both explicit requirements and implicit needs. Consider any project-specific context from CLAUDE.md files. For agents that are meant to review code, you should assume that the user is asking to review recently written code and not the whole codebase, unless the user has explicitly instructed you otherwise.

2. **Design Expert Persona**: Create a compelling expert identity that embodies deep domain knowledge relevant to the task. The persona should inspire confidence and guide the agent's decision-making approach.

3. **Architect Comprehensive Instructions**: Develop a system prompt that:
   - Establishes clear behavioral boundaries and operational parameters
   - Provides specific methodologies and best practices for task execution
   - Anticipates edge cases and provides guidance for handling them
   - Incorporates any specific requirements or preferences mentioned by the user
   - Defines output format expectations when relevant
   - Aligns with project-specific coding standards and patterns from CLAUDE.md

4. **Optimize for Performance**: Include:
   - Decision-making frameworks appropriate to the domain
   - Quality control mechanisms and self-verification steps
   - Efficient workflow patterns
   - Clear escalation or fallback strategies

5. **Create Identifier**: Design a concise, descriptive identifier that:
   - Uses lowercase letters, numbers, and hyphens only
   - Is typically 2-4 words joined by hyphens
   - Clearly indicates the agent's primary function
   - Is memorable and easy to type
   - Avoids generic terms like "helper" or "assistant"

6 **Example agent descriptions**:
  - in the 'whenToUse' field of the JSON object, you should include examples of when this agent should be used.
  - examples should be of the form:
    - <example>
      Context: The user is creating a test-runner agent that should be called after a logical chunk of code is written.
      user: "Please write a function that checks if a number is prime"
      assistant: "Here is the relevant function: "
      <function call omitted for brevity only for this example>
      <commentary>
      Since a significant piece of code was written, use the ${AGENT_TOOL_NAME} tool to launch the test-runner agent to run the tests.
      </commentary>
      assistant: "Now let me use the test-runner agent to run the tests"
    </example>
    - <example>
      Context: User is creating an agent to respond to the word "hello" with a friendly jok.
      user: "Hello"
      assistant: "I'm going to use the ${AGENT_TOOL_NAME} tool to launch the greeting-responder agent to respond with a friendly joke"
      <commentary>
      Since the user is greeting, use the greeting-responder agent to respond with a friendly joke. 
      </commentary>
    </example>
  - If the user mentioned or implied that the agent should be used proactively, you should include examples of this.
- NOTE: Ensure that in the examples, you are making the assistant use the Agent tool and not simply respond directly to the task.

Your output must be a valid JSON object with exactly these fields:
{
  "identifier": "A unique, descriptive identifier using lowercase letters, numbers, and hyphens (e.g., 'test-runner', 'api-docs-writer', 'code-formatter')",
  "whenToUse": "A precise, actionable description starting with 'Use this agent when...' that clearly defines the triggering conditions and use cases. Ensure you include examples as described above.",
  "systemPrompt": "The complete system prompt that will govern the agent's behavior, written in second person ('You are...', 'You will...') and structured for maximum clarity and effectiveness"
}

Key principles for your system prompts:
- Be specific rather than generic - avoid vague instructions
- Include concrete examples when they would clarify behavior
- Balance comprehensiveness with clarity - every instruction should add value
- Ensure the agent has enough context to handle variations of the core task
- Make the agent proactive in seeking clarification when needed
- Build in quality assurance and self-correction mechanisms

Remember: The agents you create should be autonomous experts capable of handling their designated tasks with minimal additional guidance. Your system prompts are their complete operational manual.
`;
});

// src/components/agents/new-agent-creation/wizard-steps/GenerateStep.tsx
function GenerateStep() {
  const {
    updateWizardData,
    goBack,
    goToStep,
    wizardData
  } = useWizard();
  const [prompt, setPrompt] = import_react8.useState(wizardData.generationPrompt || "");
  const [isGenerating, setIsGenerating] = import_react8.useState(false);
  const [error, setError] = import_react8.useState(null);
  const [cursorOffset, setCursorOffset] = import_react8.useState(prompt.length);
  const model = useMainLoopModel();
  const abortControllerRef = import_react8.useRef(null);
  const handleCancelGeneration = import_react8.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setError("Generation cancelled");
    }
  }, []);
  useKeybinding("confirm:no", handleCancelGeneration, {
    context: "Settings",
    isActive: isGenerating
  });
  const handleExternalEditor = import_react8.useCallback(async () => {
    const result = await editPromptInEditor(prompt);
    if (result.content !== null) {
      setPrompt(result.content);
      setCursorOffset(result.content.length);
    }
  }, [prompt]);
  useKeybinding("chat:externalEditor", handleExternalEditor, {
    context: "Chat",
    isActive: !isGenerating
  });
  const handleGoBack = import_react8.useCallback(() => {
    updateWizardData({
      generationPrompt: "",
      agentType: "",
      systemPrompt: "",
      whenToUse: "",
      generatedAgent: undefined,
      wasGenerated: false
    });
    setPrompt("");
    setError(null);
    goBack();
  }, [updateWizardData, goBack]);
  useKeybinding("confirm:no", handleGoBack, {
    context: "Settings",
    isActive: !isGenerating
  });
  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Please describe what the agent should do");
      return;
    }
    setError(null);
    setIsGenerating(true);
    updateWizardData({
      generationPrompt: trimmedPrompt,
      isGenerating: true
    });
    const controller = createAbortController();
    abortControllerRef.current = controller;
    try {
      const generated = await generateAgent(trimmedPrompt, model, [], controller.signal);
      updateWizardData({
        agentType: generated.identifier,
        whenToUse: generated.whenToUse,
        systemPrompt: generated.systemPrompt,
        generatedAgent: generated,
        isGenerating: false,
        wasGenerated: true
      });
      goToStep(6);
    } catch (err) {
      if (err instanceof APIUserAbortError) {} else if (err instanceof Error && !err.message.includes("No assistant message found")) {
        setError(err.message || "Failed to generate agent");
      }
      updateWizardData({
        isGenerating: false
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };
  const subtitle = "Describe what this agent should do and when it should be used (be comprehensive for best results)";
  if (isGenerating) {
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(WizardDialogLayout, {
      subtitle,
      footerText: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
        action: "confirm:no",
        context: "Settings",
        fallback: "Esc",
        description: "cancel"
      }, undefined, false, undefined, this),
      children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
        flexDirection: "row",
        alignItems: "center",
        children: [
          /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(Spinner, {}, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            color: "suggestion",
            children: " Generating agent from description..."
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(WizardDialogLayout, {
    subtitle,
    footerText: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:yes",
          context: "Confirmation",
          fallback: "Enter",
          description: "submit"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
          action: "chat:externalEditor",
          context: "Chat",
          fallback: "ctrl+g",
          description: "open in editor"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Settings",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this),
    children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        error && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            color: "error",
            children: error
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(TextInput, {
          value: prompt,
          onChange: setPrompt,
          onSubmit: handleGenerate,
          placeholder: "e.g., Help me write unit tests for my code...",
          columns: 80,
          cursorOffset,
          onChangeCursorOffset: setCursorOffset,
          focus: true,
          showCursor: true
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
var import_react8, jsx_dev_runtime15;
var init_GenerateStep = __esm(() => {
  init_sdk();
  init_useMainLoopModel();
  init_ink();
  init_useKeybinding();
  init_abortController();
  init_promptEditor();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_Spinner();
  init_TextInput();
  init_wizard();
  init_WizardDialogLayout();
  init_generateAgent();
  import_react8 = __toESM(require_react(), 1);
  jsx_dev_runtime15 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/wizard-steps/LocationStep.tsx
function LocationStep() {
  const $ = import_compiler_runtime12.c(11);
  const {
    goNext,
    updateWizardData,
    cancel
  } = useWizard();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      label: "Project (.claude/agents/)",
      value: "projectSettings"
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [t0, {
      label: "Personal (~/.claude/agents/)",
      value: "userSettings"
    }];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const locationOptions = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime16.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime16.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2191\u2193",
          action: "navigate"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime16.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "select"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime16.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Confirmation",
          fallback: "Esc",
          description: "cancel"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== goNext || $[4] !== updateWizardData) {
    t3 = (value) => {
      updateWizardData({
        location: value
      });
      goNext();
    };
    $[3] = goNext;
    $[4] = updateWizardData;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== cancel) {
    t4 = () => cancel();
    $[6] = cancel;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== t3 || $[9] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime16.jsxDEV(WizardDialogLayout, {
      subtitle: "Choose location",
      footerText: t2,
      children: /* @__PURE__ */ jsx_dev_runtime16.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime16.jsxDEV(Select, {
          options: locationOptions,
          onChange: t3,
          onCancel: t4
        }, "location-select", false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[8] = t3;
    $[9] = t4;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  return t5;
}
var import_compiler_runtime12, jsx_dev_runtime16;
var init_LocationStep = __esm(() => {
  init_ink();
  init_ConfigurableShortcutHint();
  init_select();
  init_Byline();
  init_KeyboardShortcutHint();
  init_wizard();
  init_WizardDialogLayout();
  import_compiler_runtime12 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime16 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/wizard-steps/MemoryStep.tsx
function MemoryStep() {
  const $ = import_compiler_runtime13.c(13);
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      context: "Confirmation"
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useKeybinding("confirm:no", goBack, t0);
  const isUserScope = wizardData.location === "userSettings";
  let t1;
  if ($[1] !== isUserScope) {
    t1 = isUserScope ? [{
      label: "User scope (~/.claude/agent-memory/) (Recommended)",
      value: "user"
    }, {
      label: "None (no persistent memory)",
      value: "none"
    }, {
      label: "Project scope (.claude/agent-memory/)",
      value: "project"
    }, {
      label: "Local scope (.claude/agent-memory-local/)",
      value: "local"
    }] : [{
      label: "Project scope (.claude/agent-memory/) (Recommended)",
      value: "project"
    }, {
      label: "None (no persistent memory)",
      value: "none"
    }, {
      label: "User scope (~/.claude/agent-memory/)",
      value: "user"
    }, {
      label: "Local scope (.claude/agent-memory-local/)",
      value: "local"
    }];
    $[1] = isUserScope;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const memoryOptions = t1;
  let t2;
  if ($[3] !== goNext || $[4] !== updateWizardData || $[5] !== wizardData.finalAgent || $[6] !== wizardData.systemPrompt) {
    t2 = (value) => {
      const memory = value === "none" ? undefined : value;
      const agentType = wizardData.finalAgent?.agentType;
      updateWizardData({
        selectedMemory: memory,
        finalAgent: wizardData.finalAgent ? {
          ...wizardData.finalAgent,
          memory,
          getSystemPrompt: isAutoMemoryEnabled() && memory && agentType ? () => wizardData.systemPrompt + `

` + loadAgentMemoryPrompt(agentType, memory) : () => wizardData.systemPrompt
        } : undefined
      });
      goNext();
    };
    $[3] = goNext;
    $[4] = updateWizardData;
    $[5] = wizardData.finalAgent;
    $[6] = wizardData.systemPrompt;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  const handleSelect = t2;
  let t3;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2191\u2193",
          action: "navigate"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "select"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Confirmation",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  let t4;
  if ($[9] !== goBack || $[10] !== handleSelect || $[11] !== memoryOptions) {
    t4 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(WizardDialogLayout, {
      subtitle: "Configure agent memory",
      footerText: t3,
      children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(Select, {
          options: memoryOptions,
          onChange: handleSelect,
          onCancel: goBack
        }, "memory-select", false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[9] = goBack;
    $[10] = handleSelect;
    $[11] = memoryOptions;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  return t4;
}
var import_compiler_runtime13, jsx_dev_runtime17;
var init_MemoryStep = __esm(() => {
  init_ink();
  init_useKeybinding();
  init_paths();
  init_agentMemory();
  init_ConfigurableShortcutHint();
  init_select();
  init_Byline();
  init_KeyboardShortcutHint();
  init_wizard();
  init_WizardDialogLayout();
  import_compiler_runtime13 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime17 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/wizard-steps/MethodStep.tsx
function MethodStep() {
  const $ = import_compiler_runtime14.c(11);
  const {
    goNext,
    goBack,
    updateWizardData,
    goToStep
  } = useWizard();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [{
      label: "Generate with Claude (recommended)",
      value: "generate"
    }, {
      label: "Manual configuration",
      value: "manual"
    }];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const methodOptions = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime18.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime18.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2191\u2193",
          action: "navigate"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime18.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "select"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime18.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Confirmation",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== goNext || $[3] !== goToStep || $[4] !== updateWizardData) {
    t2 = (value) => {
      const method = value;
      updateWizardData({
        method,
        wasGenerated: method === "generate"
      });
      if (method === "generate") {
        goNext();
      } else {
        goToStep(3);
      }
    };
    $[2] = goNext;
    $[3] = goToStep;
    $[4] = updateWizardData;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== goBack) {
    t3 = () => goBack();
    $[6] = goBack;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  let t4;
  if ($[8] !== t2 || $[9] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime18.jsxDEV(WizardDialogLayout, {
      subtitle: "Creation method",
      footerText: t1,
      children: /* @__PURE__ */ jsx_dev_runtime18.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime18.jsxDEV(Select, {
          options: methodOptions,
          onChange: t2,
          onCancel: t3
        }, "method-select", false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[8] = t2;
    $[9] = t3;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
}
var import_compiler_runtime14, jsx_dev_runtime18;
var init_MethodStep = __esm(() => {
  init_ink();
  init_ConfigurableShortcutHint();
  init_select();
  init_Byline();
  init_KeyboardShortcutHint();
  init_wizard();
  init_WizardDialogLayout();
  import_compiler_runtime14 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime18 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/wizard-steps/ModelStep.tsx
function ModelStep() {
  const $ = import_compiler_runtime15.c(8);
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  let t0;
  if ($[0] !== goNext || $[1] !== updateWizardData) {
    t0 = (model) => {
      updateWizardData({
        selectedModel: model
      });
      goNext();
    };
    $[0] = goNext;
    $[1] = updateWizardData;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const handleComplete = t0;
  let t1;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime19.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime19.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2191\u2193",
          action: "navigate"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime19.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "select"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime19.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Confirmation",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== goBack || $[5] !== handleComplete || $[6] !== wizardData.selectedModel) {
    t2 = /* @__PURE__ */ jsx_dev_runtime19.jsxDEV(WizardDialogLayout, {
      subtitle: "Select model",
      footerText: t1,
      children: /* @__PURE__ */ jsx_dev_runtime19.jsxDEV(ModelSelector, {
        initialModel: wizardData.selectedModel,
        onComplete: handleComplete,
        onCancel: goBack
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[4] = goBack;
    $[5] = handleComplete;
    $[6] = wizardData.selectedModel;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}
var import_compiler_runtime15, jsx_dev_runtime19;
var init_ModelStep = __esm(() => {
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_wizard();
  init_WizardDialogLayout();
  init_ModelSelector();
  import_compiler_runtime15 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime19 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/wizard-steps/PromptStep.tsx
function PromptStep() {
  const $ = import_compiler_runtime16.c(20);
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  const [systemPrompt, setSystemPrompt] = import_react9.useState(wizardData.systemPrompt || "");
  const [cursorOffset, setCursorOffset] = import_react9.useState(systemPrompt.length);
  const [error, setError] = import_react9.useState(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      context: "Settings"
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useKeybinding("confirm:no", goBack, t0);
  let t1;
  if ($[1] !== systemPrompt) {
    t1 = async () => {
      const result = await editPromptInEditor(systemPrompt);
      if (result.content !== null) {
        setSystemPrompt(result.content);
        setCursorOffset(result.content.length);
      }
    };
    $[1] = systemPrompt;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const handleExternalEditor = t1;
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = {
      context: "Chat"
    };
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useKeybinding("chat:externalEditor", handleExternalEditor, t2);
  let t3;
  if ($[4] !== goNext || $[5] !== systemPrompt || $[6] !== updateWizardData) {
    t3 = () => {
      const trimmedPrompt = systemPrompt.trim();
      if (!trimmedPrompt) {
        setError("System prompt is required");
        return;
      }
      setError(null);
      updateWizardData({
        systemPrompt: trimmedPrompt
      });
      goNext();
    };
    $[4] = goNext;
    $[5] = systemPrompt;
    $[6] = updateWizardData;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const handleSubmit = t3;
  let t4;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Type",
          action: "enter text"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "continue"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(ConfigurableShortcutHint, {
          action: "chat:externalEditor",
          context: "Chat",
          fallback: "ctrl+g",
          description: "open in editor"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Settings",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  let t5;
  let t6;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(ThemedText, {
      children: "Enter the system prompt for your agent:"
    }, undefined, false, undefined, this);
    t6 = /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Be comprehensive for best results"
    }, undefined, false, undefined, this);
    $[9] = t5;
    $[10] = t6;
  } else {
    t5 = $[9];
    t6 = $[10];
  }
  let t7;
  if ($[11] !== cursorOffset || $[12] !== handleSubmit || $[13] !== systemPrompt) {
    t7 = /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(TextInput, {
        value: systemPrompt,
        onChange: setSystemPrompt,
        onSubmit: handleSubmit,
        placeholder: "You are a helpful code reviewer who...",
        columns: 80,
        cursorOffset,
        onChangeCursorOffset: setCursorOffset,
        focus: true,
        showCursor: true
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[11] = cursorOffset;
    $[12] = handleSubmit;
    $[13] = systemPrompt;
    $[14] = t7;
  } else {
    t7 = $[14];
  }
  let t8;
  if ($[15] !== error) {
    t8 = error && /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(ThemedText, {
        color: "error",
        children: error
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[15] = error;
    $[16] = t8;
  } else {
    t8 = $[16];
  }
  let t9;
  if ($[17] !== t7 || $[18] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(WizardDialogLayout, {
      subtitle: "System prompt",
      footerText: t4,
      children: /* @__PURE__ */ jsx_dev_runtime20.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t5,
          t6,
          t7,
          t8
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[17] = t7;
    $[18] = t8;
    $[19] = t9;
  } else {
    t9 = $[19];
  }
  return t9;
}
var import_compiler_runtime16, import_react9, jsx_dev_runtime20;
var init_PromptStep = __esm(() => {
  init_ink();
  init_useKeybinding();
  init_promptEditor();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_TextInput();
  init_wizard();
  init_WizardDialogLayout();
  import_compiler_runtime16 = __toESM(require_compiler_runtime(), 1);
  import_react9 = __toESM(require_react(), 1);
  jsx_dev_runtime20 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/wizard-steps/ToolsStep.tsx
function ToolsStep(t0) {
  const $ = import_compiler_runtime17.c(9);
  const {
    tools
  } = t0;
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  let t1;
  if ($[0] !== goNext || $[1] !== updateWizardData) {
    t1 = (selectedTools) => {
      updateWizardData({
        selectedTools
      });
      goNext();
    };
    $[0] = goNext;
    $[1] = updateWizardData;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const handleComplete = t1;
  const initialTools = wizardData.selectedTools;
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime21.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime21.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "toggle selection"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime21.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2191\u2193",
          action: "navigate"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime21.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Confirmation",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== goBack || $[5] !== handleComplete || $[6] !== initialTools || $[7] !== tools) {
    t3 = /* @__PURE__ */ jsx_dev_runtime21.jsxDEV(WizardDialogLayout, {
      subtitle: "Select tools",
      footerText: t2,
      children: /* @__PURE__ */ jsx_dev_runtime21.jsxDEV(ToolSelector, {
        tools,
        initialTools,
        onComplete: handleComplete,
        onCancel: goBack
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[4] = goBack;
    $[5] = handleComplete;
    $[6] = initialTools;
    $[7] = tools;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}
var import_compiler_runtime17, jsx_dev_runtime21;
var init_ToolsStep = __esm(() => {
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_wizard();
  init_WizardDialogLayout();
  init_ToolSelector();
  import_compiler_runtime17 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime21 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/wizard-steps/TypeStep.tsx
function TypeStep(_props) {
  const $ = import_compiler_runtime18.c(15);
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  const [agentType, setAgentType] = import_react10.useState(wizardData.agentType || "");
  const [error, setError] = import_react10.useState(null);
  const [cursorOffset, setCursorOffset] = import_react10.useState(agentType.length);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      context: "Settings"
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useKeybinding("confirm:no", goBack, t0);
  let t1;
  if ($[1] !== goNext || $[2] !== updateWizardData) {
    t1 = (value) => {
      const trimmedValue = value.trim();
      const validationError = validateAgentType(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      updateWizardData({
        agentType: trimmedValue
      });
      goNext();
    };
    $[1] = goNext;
    $[2] = updateWizardData;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const handleSubmit = t1;
  let t2;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Type",
          action: "enter text"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "continue"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Settings",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(ThemedText, {
      children: "Enter a unique identifier for your agent:"
    }, undefined, false, undefined, this);
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== agentType || $[7] !== cursorOffset || $[8] !== handleSubmit) {
    t4 = /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(TextInput, {
        value: agentType,
        onChange: setAgentType,
        onSubmit: handleSubmit,
        placeholder: "e.g., test-runner, tech-lead, etc",
        columns: 60,
        cursorOffset,
        onChangeCursorOffset: setCursorOffset,
        focus: true,
        showCursor: true
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[6] = agentType;
    $[7] = cursorOffset;
    $[8] = handleSubmit;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] !== error) {
    t5 = error && /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(ThemedText, {
        color: "error",
        children: error
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[10] = error;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  let t6;
  if ($[12] !== t4 || $[13] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(WizardDialogLayout, {
      subtitle: "Agent type (identifier)",
      footerText: t2,
      children: /* @__PURE__ */ jsx_dev_runtime22.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t3,
          t4,
          t5
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[12] = t4;
    $[13] = t5;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  return t6;
}
var import_compiler_runtime18, import_react10, jsx_dev_runtime22;
var init_TypeStep = __esm(() => {
  init_ink();
  init_useKeybinding();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_TextInput();
  init_wizard();
  init_WizardDialogLayout();
  init_validateAgent();
  import_compiler_runtime18 = __toESM(require_compiler_runtime(), 1);
  import_react10 = __toESM(require_react(), 1);
  jsx_dev_runtime22 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/new-agent-creation/CreateAgentWizard.tsx
function CreateAgentWizard(t0) {
  const $ = import_compiler_runtime19.c(17);
  const {
    tools,
    existingAgents,
    onComplete,
    onCancel
  } = t0;
  let t1;
  if ($[0] !== existingAgents) {
    t1 = () => /* @__PURE__ */ jsx_dev_runtime23.jsxDEV(TypeStep, {
      existingAgents
    }, undefined, false, undefined, this);
    $[0] = existingAgents;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== tools) {
    t2 = () => /* @__PURE__ */ jsx_dev_runtime23.jsxDEV(ToolsStep, {
      tools
    }, undefined, false, undefined, this);
    $[2] = tools;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = isAutoMemoryEnabled() ? [MemoryStep] : [];
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] !== existingAgents || $[6] !== onComplete || $[7] !== tools) {
    t4 = () => /* @__PURE__ */ jsx_dev_runtime23.jsxDEV(ConfirmStepWrapper, {
      tools,
      existingAgents,
      onComplete
    }, undefined, false, undefined, this);
    $[5] = existingAgents;
    $[6] = onComplete;
    $[7] = tools;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  let t5;
  if ($[9] !== t1 || $[10] !== t2 || $[11] !== t4) {
    t5 = [LocationStep, MethodStep, GenerateStep, t1, PromptStep, DescriptionStep, t2, ModelStep, ColorStep, ...t3, t4];
    $[9] = t1;
    $[10] = t2;
    $[11] = t4;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  const steps = t5;
  let t6;
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = {};
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  let t7;
  if ($[14] !== onCancel || $[15] !== steps) {
    t7 = /* @__PURE__ */ jsx_dev_runtime23.jsxDEV(WizardProvider, {
      steps,
      initialData: t6,
      onComplete: _temp14,
      onCancel,
      title: "Create new agent",
      showStepCounter: false
    }, undefined, false, undefined, this);
    $[14] = onCancel;
    $[15] = steps;
    $[16] = t7;
  } else {
    t7 = $[16];
  }
  return t7;
}
function _temp14() {}
var import_compiler_runtime19, jsx_dev_runtime23;
var init_CreateAgentWizard = __esm(() => {
  init_paths();
  init_wizard();
  init_ColorStep();
  init_ConfirmStepWrapper();
  init_DescriptionStep();
  init_GenerateStep();
  init_LocationStep();
  init_MemoryStep();
  init_MethodStep();
  init_ModelStep();
  init_PromptStep();
  init_ToolsStep();
  init_TypeStep();
  import_compiler_runtime19 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime23 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/agents/AgentsMenu.tsx
function AgentsMenu(t0) {
  const $ = import_compiler_runtime20.c(157);
  const {
    tools,
    onExit
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      mode: "list-agents",
      source: "all"
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [modeState, setModeState] = import_react11.useState(t1);
  const agentDefinitions = useAppState(_temp15);
  const mcpTools = useAppState(_temp26);
  const toolPermissionContext = useAppState(_temp35);
  const setAppState = useSetAppState();
  const {
    allAgents,
    activeAgents: agents
  } = agentDefinitions;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const [changes, setChanges] = import_react11.useState(t2);
  const mergedTools = useMergedTools(tools, mcpTools, toolPermissionContext);
  useExitOnCtrlCDWithKeybindings();
  let t3;
  if ($[2] !== allAgents) {
    t3 = allAgents.filter(_temp43);
    $[2] = allAgents;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  let t4;
  if ($[4] !== allAgents) {
    t4 = allAgents.filter(_temp53);
    $[4] = allAgents;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  let t5;
  if ($[6] !== allAgents) {
    t5 = allAgents.filter(_temp63);
    $[6] = allAgents;
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  let t6;
  if ($[8] !== allAgents) {
    t6 = allAgents.filter(_temp73);
    $[8] = allAgents;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  let t7;
  if ($[10] !== allAgents) {
    t7 = allAgents.filter(_temp83);
    $[10] = allAgents;
    $[11] = t7;
  } else {
    t7 = $[11];
  }
  let t8;
  if ($[12] !== allAgents) {
    t8 = allAgents.filter(_temp93);
    $[12] = allAgents;
    $[13] = t8;
  } else {
    t8 = $[13];
  }
  let t9;
  if ($[14] !== allAgents) {
    t9 = allAgents.filter(_temp02);
    $[14] = allAgents;
    $[15] = t9;
  } else {
    t9 = $[15];
  }
  let t10;
  if ($[16] !== allAgents || $[17] !== t3 || $[18] !== t4 || $[19] !== t5 || $[20] !== t6 || $[21] !== t7 || $[22] !== t8 || $[23] !== t9) {
    t10 = {
      "built-in": t3,
      userSettings: t4,
      projectSettings: t5,
      policySettings: t6,
      localSettings: t7,
      flagSettings: t8,
      plugin: t9,
      all: allAgents
    };
    $[16] = allAgents;
    $[17] = t3;
    $[18] = t4;
    $[19] = t5;
    $[20] = t6;
    $[21] = t7;
    $[22] = t8;
    $[23] = t9;
    $[24] = t10;
  } else {
    t10 = $[24];
  }
  const agentsBySource = t10;
  let t11;
  if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
    t11 = (message) => {
      setChanges((prev) => [...prev, message]);
      setModeState({
        mode: "list-agents",
        source: "all"
      });
    };
    $[25] = t11;
  } else {
    t11 = $[25];
  }
  const handleAgentCreated = t11;
  let t12;
  if ($[26] !== setAppState) {
    t12 = async (agent) => {
      try {
        await deleteAgentFromFile(agent);
        setAppState((state) => {
          const allAgents_0 = state.agentDefinitions.allAgents.filter((a_6) => !(a_6.agentType === agent.agentType && a_6.source === agent.source));
          return {
            ...state,
            agentDefinitions: {
              ...state.agentDefinitions,
              allAgents: allAgents_0,
              activeAgents: getActiveAgentsFromList(allAgents_0)
            }
          };
        });
        setChanges((prev_0) => [...prev_0, `Deleted agent: ${source_default.bold(agent.agentType)}`]);
        setModeState({
          mode: "list-agents",
          source: "all"
        });
      } catch (t13) {
        const error = t13;
        logError(toError(error));
      }
    };
    $[26] = setAppState;
    $[27] = t12;
  } else {
    t12 = $[27];
  }
  const handleAgentDeleted = t12;
  switch (modeState.mode) {
    case "list-agents": {
      let t13;
      if ($[28] !== agentsBySource || $[29] !== modeState.source) {
        t13 = modeState.source === "all" ? [...agentsBySource["built-in"], ...agentsBySource.userSettings, ...agentsBySource.projectSettings, ...agentsBySource.localSettings, ...agentsBySource.policySettings, ...agentsBySource.flagSettings, ...agentsBySource.plugin] : agentsBySource[modeState.source];
        $[28] = agentsBySource;
        $[29] = modeState.source;
        $[30] = t13;
      } else {
        t13 = $[30];
      }
      const agentsToShow = t13;
      let t14;
      if ($[31] !== agents || $[32] !== agentsToShow) {
        t14 = resolveAgentOverrides(agentsToShow, agents);
        $[31] = agents;
        $[32] = agentsToShow;
        $[33] = t14;
      } else {
        t14 = $[33];
      }
      const allResolved = t14;
      const resolvedAgents = allResolved;
      let t15;
      if ($[34] !== changes || $[35] !== onExit) {
        t15 = () => {
          const exitMessage = changes.length > 0 ? `Agent changes:
${changes.join(`
`)}` : undefined;
          onExit(exitMessage ?? "Agents dialog dismissed", {
            display: changes.length === 0 ? "system" : undefined
          });
        };
        $[34] = changes;
        $[35] = onExit;
        $[36] = t15;
      } else {
        t15 = $[36];
      }
      let t16;
      if ($[37] !== modeState) {
        t16 = (agent_0) => setModeState({
          mode: "agent-menu",
          agent: agent_0,
          previousMode: modeState
        });
        $[37] = modeState;
        $[38] = t16;
      } else {
        t16 = $[38];
      }
      let t17;
      if ($[39] === Symbol.for("react.memo_cache_sentinel")) {
        t17 = () => setModeState({
          mode: "create-agent"
        });
        $[39] = t17;
      } else {
        t17 = $[39];
      }
      let t18;
      if ($[40] !== changes || $[41] !== modeState.source || $[42] !== resolvedAgents || $[43] !== t15 || $[44] !== t16) {
        t18 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(AgentsList, {
          source: modeState.source,
          agents: resolvedAgents,
          onBack: t15,
          onSelect: t16,
          onCreateNew: t17,
          changes
        }, undefined, false, undefined, this);
        $[40] = changes;
        $[41] = modeState.source;
        $[42] = resolvedAgents;
        $[43] = t15;
        $[44] = t16;
        $[45] = t18;
      } else {
        t18 = $[45];
      }
      let t19;
      if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
        t19 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(AgentNavigationFooter, {}, undefined, false, undefined, this);
        $[46] = t19;
      } else {
        t19 = $[46];
      }
      let t20;
      if ($[47] !== t18) {
        t20 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(jsx_dev_runtime24.Fragment, {
          children: [
            t18,
            t19
          ]
        }, undefined, true, undefined, this);
        $[47] = t18;
        $[48] = t20;
      } else {
        t20 = $[48];
      }
      return t20;
    }
    case "create-agent": {
      let t13;
      if ($[49] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = () => setModeState({
          mode: "list-agents",
          source: "all"
        });
        $[49] = t13;
      } else {
        t13 = $[49];
      }
      let t14;
      if ($[50] !== agents || $[51] !== mergedTools) {
        t14 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(CreateAgentWizard, {
          tools: mergedTools,
          existingAgents: agents,
          onComplete: handleAgentCreated,
          onCancel: t13
        }, undefined, false, undefined, this);
        $[50] = agents;
        $[51] = mergedTools;
        $[52] = t14;
      } else {
        t14 = $[52];
      }
      return t14;
    }
    case "agent-menu": {
      let t13;
      if ($[53] !== allAgents || $[54] !== modeState.agent.agentType || $[55] !== modeState.agent.source) {
        let t142;
        if ($[57] !== modeState.agent.agentType || $[58] !== modeState.agent.source) {
          t142 = (a_9) => a_9.agentType === modeState.agent.agentType && a_9.source === modeState.agent.source;
          $[57] = modeState.agent.agentType;
          $[58] = modeState.agent.source;
          $[59] = t142;
        } else {
          t142 = $[59];
        }
        t13 = allAgents.find(t142);
        $[53] = allAgents;
        $[54] = modeState.agent.agentType;
        $[55] = modeState.agent.source;
        $[56] = t13;
      } else {
        t13 = $[56];
      }
      const freshAgent_1 = t13;
      const agentToUse = freshAgent_1 || modeState.agent;
      const isEditable = agentToUse.source !== "built-in" && agentToUse.source !== "plugin" && agentToUse.source !== "flagSettings";
      let t14;
      if ($[60] === Symbol.for("react.memo_cache_sentinel")) {
        t14 = {
          label: "View agent",
          value: "view"
        };
        $[60] = t14;
      } else {
        t14 = $[60];
      }
      let t15;
      if ($[61] !== isEditable) {
        t15 = isEditable ? [{
          label: "Edit agent",
          value: "edit"
        }, {
          label: "Delete agent",
          value: "delete"
        }] : [];
        $[61] = isEditable;
        $[62] = t15;
      } else {
        t15 = $[62];
      }
      let t16;
      if ($[63] === Symbol.for("react.memo_cache_sentinel")) {
        t16 = {
          label: "Back",
          value: "back"
        };
        $[63] = t16;
      } else {
        t16 = $[63];
      }
      let t17;
      if ($[64] !== t15) {
        t17 = [t14, ...t15, t16];
        $[64] = t15;
        $[65] = t17;
      } else {
        t17 = $[65];
      }
      const menuItems = t17;
      let t18;
      if ($[66] !== agentToUse || $[67] !== modeState) {
        t18 = (value_0) => {
          bb129:
            switch (value_0) {
              case "view": {
                setModeState({
                  mode: "view-agent",
                  agent: agentToUse,
                  previousMode: modeState.previousMode
                });
                break bb129;
              }
              case "edit": {
                setModeState({
                  mode: "edit-agent",
                  agent: agentToUse,
                  previousMode: modeState
                });
                break bb129;
              }
              case "delete": {
                setModeState({
                  mode: "delete-confirm",
                  agent: agentToUse,
                  previousMode: modeState
                });
                break bb129;
              }
              case "back": {
                setModeState(modeState.previousMode);
              }
            }
        };
        $[66] = agentToUse;
        $[67] = modeState;
        $[68] = t18;
      } else {
        t18 = $[68];
      }
      const handleMenuSelect = t18;
      let t19;
      if ($[69] !== modeState.previousMode) {
        t19 = () => setModeState(modeState.previousMode);
        $[69] = modeState.previousMode;
        $[70] = t19;
      } else {
        t19 = $[70];
      }
      let t20;
      if ($[71] !== modeState.previousMode) {
        t20 = () => setModeState(modeState.previousMode);
        $[71] = modeState.previousMode;
        $[72] = t20;
      } else {
        t20 = $[72];
      }
      let t21;
      if ($[73] !== handleMenuSelect || $[74] !== menuItems || $[75] !== t20) {
        t21 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(Select, {
          options: menuItems,
          onChange: handleMenuSelect,
          onCancel: t20
        }, undefined, false, undefined, this);
        $[73] = handleMenuSelect;
        $[74] = menuItems;
        $[75] = t20;
        $[76] = t21;
      } else {
        t21 = $[76];
      }
      let t22;
      if ($[77] !== changes) {
        t22 = changes.length > 0 && /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(ThemedText, {
            dimColor: true,
            children: changes[changes.length - 1]
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this);
        $[77] = changes;
        $[78] = t22;
      } else {
        t22 = $[78];
      }
      let t23;
      if ($[79] !== t21 || $[80] !== t22) {
        t23 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            t21,
            t22
          ]
        }, undefined, true, undefined, this);
        $[79] = t21;
        $[80] = t22;
        $[81] = t23;
      } else {
        t23 = $[81];
      }
      let t24;
      if ($[82] !== modeState.agent.agentType || $[83] !== t19 || $[84] !== t23) {
        t24 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(Dialog, {
          title: modeState.agent.agentType,
          onCancel: t19,
          hideInputGuide: true,
          children: t23
        }, undefined, false, undefined, this);
        $[82] = modeState.agent.agentType;
        $[83] = t19;
        $[84] = t23;
        $[85] = t24;
      } else {
        t24 = $[85];
      }
      let t25;
      if ($[86] === Symbol.for("react.memo_cache_sentinel")) {
        t25 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(AgentNavigationFooter, {}, undefined, false, undefined, this);
        $[86] = t25;
      } else {
        t25 = $[86];
      }
      let t26;
      if ($[87] !== t24) {
        t26 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(jsx_dev_runtime24.Fragment, {
          children: [
            t24,
            t25
          ]
        }, undefined, true, undefined, this);
        $[87] = t24;
        $[88] = t26;
      } else {
        t26 = $[88];
      }
      return t26;
    }
    case "view-agent": {
      let t13;
      if ($[89] !== allAgents || $[90] !== modeState.agent) {
        let t142;
        if ($[92] !== modeState.agent) {
          t142 = (a_8) => a_8.agentType === modeState.agent.agentType && a_8.source === modeState.agent.source;
          $[92] = modeState.agent;
          $[93] = t142;
        } else {
          t142 = $[93];
        }
        t13 = allAgents.find(t142);
        $[89] = allAgents;
        $[90] = modeState.agent;
        $[91] = t13;
      } else {
        t13 = $[91];
      }
      const freshAgent_0 = t13;
      const agentToDisplay = freshAgent_0 || modeState.agent;
      let t14;
      if ($[94] !== agentToDisplay || $[95] !== modeState.previousMode) {
        t14 = () => setModeState({
          mode: "agent-menu",
          agent: agentToDisplay,
          previousMode: modeState.previousMode
        });
        $[94] = agentToDisplay;
        $[95] = modeState.previousMode;
        $[96] = t14;
      } else {
        t14 = $[96];
      }
      let t15;
      if ($[97] !== agentToDisplay || $[98] !== modeState.previousMode) {
        t15 = () => setModeState({
          mode: "agent-menu",
          agent: agentToDisplay,
          previousMode: modeState.previousMode
        });
        $[97] = agentToDisplay;
        $[98] = modeState.previousMode;
        $[99] = t15;
      } else {
        t15 = $[99];
      }
      let t16;
      if ($[100] !== agentToDisplay || $[101] !== allAgents || $[102] !== mergedTools || $[103] !== t15) {
        t16 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(AgentDetail, {
          agent: agentToDisplay,
          tools: mergedTools,
          allAgents,
          onBack: t15
        }, undefined, false, undefined, this);
        $[100] = agentToDisplay;
        $[101] = allAgents;
        $[102] = mergedTools;
        $[103] = t15;
        $[104] = t16;
      } else {
        t16 = $[104];
      }
      let t17;
      if ($[105] !== agentToDisplay.agentType || $[106] !== t14 || $[107] !== t16) {
        t17 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(Dialog, {
          title: agentToDisplay.agentType,
          onCancel: t14,
          hideInputGuide: true,
          children: t16
        }, undefined, false, undefined, this);
        $[105] = agentToDisplay.agentType;
        $[106] = t14;
        $[107] = t16;
        $[108] = t17;
      } else {
        t17 = $[108];
      }
      let t18;
      if ($[109] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(AgentNavigationFooter, {
          instructions: "Press Enter or Esc to go back"
        }, undefined, false, undefined, this);
        $[109] = t18;
      } else {
        t18 = $[109];
      }
      let t19;
      if ($[110] !== t17) {
        t19 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(jsx_dev_runtime24.Fragment, {
          children: [
            t17,
            t18
          ]
        }, undefined, true, undefined, this);
        $[110] = t17;
        $[111] = t19;
      } else {
        t19 = $[111];
      }
      return t19;
    }
    case "delete-confirm": {
      let t13;
      if ($[112] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = [{
          label: "Yes, delete",
          value: "yes"
        }, {
          label: "No, cancel",
          value: "no"
        }];
        $[112] = t13;
      } else {
        t13 = $[112];
      }
      const deleteOptions = t13;
      let t14;
      if ($[113] !== modeState) {
        t14 = () => {
          if ("previousMode" in modeState) {
            setModeState(modeState.previousMode);
          }
        };
        $[113] = modeState;
        $[114] = t14;
      } else {
        t14 = $[114];
      }
      let t15;
      if ($[115] !== modeState.agent.agentType) {
        t15 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(ThemedText, {
          children: [
            "Are you sure you want to delete the agent",
            " ",
            /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(ThemedText, {
              bold: true,
              children: modeState.agent.agentType
            }, undefined, false, undefined, this),
            "?"
          ]
        }, undefined, true, undefined, this);
        $[115] = modeState.agent.agentType;
        $[116] = t15;
      } else {
        t15 = $[116];
      }
      let t16;
      if ($[117] !== modeState.agent.source) {
        t16 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "Source: ",
              modeState.agent.source
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this);
        $[117] = modeState.agent.source;
        $[118] = t16;
      } else {
        t16 = $[118];
      }
      let t17;
      if ($[119] !== handleAgentDeleted || $[120] !== modeState) {
        t17 = (value) => {
          if (value === "yes") {
            handleAgentDeleted(modeState.agent);
          } else {
            if ("previousMode" in modeState) {
              setModeState(modeState.previousMode);
            }
          }
        };
        $[119] = handleAgentDeleted;
        $[120] = modeState;
        $[121] = t17;
      } else {
        t17 = $[121];
      }
      let t18;
      if ($[122] !== modeState) {
        t18 = () => {
          if ("previousMode" in modeState) {
            setModeState(modeState.previousMode);
          }
        };
        $[122] = modeState;
        $[123] = t18;
      } else {
        t18 = $[123];
      }
      let t19;
      if ($[124] !== t17 || $[125] !== t18) {
        t19 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(Select, {
            options: deleteOptions,
            onChange: t17,
            onCancel: t18
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this);
        $[124] = t17;
        $[125] = t18;
        $[126] = t19;
      } else {
        t19 = $[126];
      }
      let t20;
      if ($[127] !== t14 || $[128] !== t15 || $[129] !== t16 || $[130] !== t19) {
        t20 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(Dialog, {
          title: "Delete agent",
          onCancel: t14,
          color: "error",
          children: [
            t15,
            t16,
            t19
          ]
        }, undefined, true, undefined, this);
        $[127] = t14;
        $[128] = t15;
        $[129] = t16;
        $[130] = t19;
        $[131] = t20;
      } else {
        t20 = $[131];
      }
      let t21;
      if ($[132] === Symbol.for("react.memo_cache_sentinel")) {
        t21 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(AgentNavigationFooter, {
          instructions: "Press \u2191\u2193 to navigate, Enter to select, Esc to cancel"
        }, undefined, false, undefined, this);
        $[132] = t21;
      } else {
        t21 = $[132];
      }
      let t22;
      if ($[133] !== t20) {
        t22 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(jsx_dev_runtime24.Fragment, {
          children: [
            t20,
            t21
          ]
        }, undefined, true, undefined, this);
        $[133] = t20;
        $[134] = t22;
      } else {
        t22 = $[134];
      }
      return t22;
    }
    case "edit-agent": {
      let t13;
      if ($[135] !== allAgents || $[136] !== modeState.agent) {
        let t142;
        if ($[138] !== modeState.agent) {
          t142 = (a_7) => a_7.agentType === modeState.agent.agentType && a_7.source === modeState.agent.source;
          $[138] = modeState.agent;
          $[139] = t142;
        } else {
          t142 = $[139];
        }
        t13 = allAgents.find(t142);
        $[135] = allAgents;
        $[136] = modeState.agent;
        $[137] = t13;
      } else {
        t13 = $[137];
      }
      const freshAgent = t13;
      const agentToEdit = freshAgent || modeState.agent;
      const t14 = `Edit agent: ${agentToEdit.agentType}`;
      let t15;
      if ($[140] !== modeState.previousMode) {
        t15 = () => setModeState(modeState.previousMode);
        $[140] = modeState.previousMode;
        $[141] = t15;
      } else {
        t15 = $[141];
      }
      let t16;
      let t17;
      if ($[142] !== modeState.previousMode) {
        t16 = (message_0) => {
          handleAgentCreated(message_0);
          setModeState(modeState.previousMode);
        };
        t17 = () => setModeState(modeState.previousMode);
        $[142] = modeState.previousMode;
        $[143] = t16;
        $[144] = t17;
      } else {
        t16 = $[143];
        t17 = $[144];
      }
      let t18;
      if ($[145] !== agentToEdit || $[146] !== mergedTools || $[147] !== t16 || $[148] !== t17) {
        t18 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(AgentEditor, {
          agent: agentToEdit,
          tools: mergedTools,
          onSaved: t16,
          onBack: t17
        }, undefined, false, undefined, this);
        $[145] = agentToEdit;
        $[146] = mergedTools;
        $[147] = t16;
        $[148] = t17;
        $[149] = t18;
      } else {
        t18 = $[149];
      }
      let t19;
      if ($[150] !== t14 || $[151] !== t15 || $[152] !== t18) {
        t19 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(Dialog, {
          title: t14,
          onCancel: t15,
          hideInputGuide: true,
          children: t18
        }, undefined, false, undefined, this);
        $[150] = t14;
        $[151] = t15;
        $[152] = t18;
        $[153] = t19;
      } else {
        t19 = $[153];
      }
      let t20;
      if ($[154] === Symbol.for("react.memo_cache_sentinel")) {
        t20 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(AgentNavigationFooter, {}, undefined, false, undefined, this);
        $[154] = t20;
      } else {
        t20 = $[154];
      }
      let t21;
      if ($[155] !== t19) {
        t21 = /* @__PURE__ */ jsx_dev_runtime24.jsxDEV(jsx_dev_runtime24.Fragment, {
          children: [
            t19,
            t20
          ]
        }, undefined, true, undefined, this);
        $[155] = t19;
        $[156] = t21;
      } else {
        t21 = $[156];
      }
      return t21;
    }
    default: {
      return null;
    }
  }
}
function _temp02(a_5) {
  return a_5.source === "plugin";
}
function _temp93(a_4) {
  return a_4.source === "flagSettings";
}
function _temp83(a_3) {
  return a_3.source === "localSettings";
}
function _temp73(a_2) {
  return a_2.source === "policySettings";
}
function _temp63(a_1) {
  return a_1.source === "projectSettings";
}
function _temp53(a_0) {
  return a_0.source === "userSettings";
}
function _temp43(a) {
  return a.source === "built-in";
}
function _temp35(s_1) {
  return s_1.toolPermissionContext;
}
function _temp26(s_0) {
  return s_0.mcp.tools;
}
function _temp15(s) {
  return s.agentDefinitions;
}
var import_compiler_runtime20, import_react11, jsx_dev_runtime24;
var init_AgentsMenu = __esm(() => {
  init_source();
  init_useExitOnCtrlCDWithKeybindings();
  init_useMergedTools();
  init_ink();
  init_AppState();
  init_agentDisplay();
  init_loadAgentsDir();
  init_errors();
  init_log();
  init_select();
  init_Dialog();
  init_AgentDetail();
  init_AgentEditor();
  init_AgentNavigationFooter();
  init_AgentsList();
  init_agentFileUtils();
  init_CreateAgentWizard();
  import_compiler_runtime20 = __toESM(require_compiler_runtime(), 1);
  import_react11 = __toESM(require_react(), 1);
  jsx_dev_runtime24 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/agents/agents.tsx
async function call(onDone, context) {
  const appState = context.getAppState();
  const permissionContext = appState.toolPermissionContext;
  const tools = getTools(permissionContext);
  return /* @__PURE__ */ jsx_dev_runtime25.jsxDEV(AgentsMenu, {
    tools,
    onExit: onDone
  }, undefined, false, undefined, this);
}
var jsx_dev_runtime25;
var init_agents = __esm(() => {
  init_AgentsMenu();
  init_tools();
  jsx_dev_runtime25 = __toESM(require_jsx_dev_runtime(), 1);
});
init_agents();

export {
  call
};
