// @bun
import {
  editFileInEditor,
  init_promptEditor
} from "./chunk-n7a7jk3x.js";
import {
  ListItem,
  Select,
  clearMemoryFileCaches,
  getAgentMemoryDir,
  getMemoryFiles,
  init_AppState,
  init_CustomSelect,
  init_ListItem,
  init_agentMemory,
  init_claudemd,
  init_config1 as init_config,
  init_consolidationLock,
  isAutoDreamEnabled,
  readLastConsolidatedAt,
  useAppState
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import {
  Dialog,
  init_Dialog
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
import {
  init_browser,
  openPath
} from "./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  getAutoMemPath,
  getDisplayPath,
  init_file,
  init_paths,
  init_settings1 as init_settings,
  init_source,
  isAutoMemoryEnabled,
  source_default,
  updateSettingsForSource
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
import {
  formatRelativeTimeAgo,
  init_format
} from "./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import"./chunk-s85yj5xm.js";
import {
  findGitRoot,
  init_git
} from "./chunk-73q6p10n.js";
import"./chunk-8qg6qavk.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-14j8jv5j.js";
import"./chunk-0xqnccz6.js";
import"./chunk-nahdbxge.js";
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
  init_errors
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils
} from "./chunk-3r24h7t6.js";
import {
  getOriginalCwd,
  init_state
} from "./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/utils/memory/versions.ts
function projectIsInGitRepo(cwd) {
  return findGitRoot(cwd) !== null;
}
var init_versions = __esm(() => {
  init_git();
});

// src/components/memory/MemoryFileSelector.tsx
import { mkdir } from "fs/promises";
import { join } from "path";
function MemoryFileSelector(t0) {
  const $ = import_compiler_runtime.c(58);
  const {
    onSelect,
    onCancel
  } = t0;
  const existingMemoryFiles = import_react.use(getMemoryFiles());
  const userMemoryPath = join(getClaudeConfigHomeDir(), "CLAUDE.md");
  const projectMemoryPath = join(getOriginalCwd(), "CLAUDE.md");
  const hasUserMemory = existingMemoryFiles.some((f) => f.path === userMemoryPath);
  const hasProjectMemory = existingMemoryFiles.some((f_0) => f_0.path === projectMemoryPath);
  const allMemoryFiles = [...existingMemoryFiles.filter(_temp).map(_temp2), ...hasUserMemory ? [] : [{
    path: userMemoryPath,
    type: "User",
    content: "",
    exists: false
  }], ...hasProjectMemory ? [] : [{
    path: projectMemoryPath,
    type: "Project",
    content: "",
    exists: false
  }]];
  const depths = new Map;
  const memoryOptions = allMemoryFiles.map((file) => {
    const displayPath = getDisplayPath(file.path);
    const existsLabel = file.exists ? "" : " (new)";
    const depth = file.parent ? (depths.get(file.parent) ?? 0) + 1 : 0;
    depths.set(file.path, depth);
    const indent = depth > 0 ? "  ".repeat(depth - 1) : "";
    let label;
    if (file.type === "User" && !file.isNested && file.path === userMemoryPath) {
      label = "User memory";
    } else {
      if (file.type === "Project" && !file.isNested && file.path === projectMemoryPath) {
        label = "Project memory";
      } else {
        if (depth > 0) {
          label = `${indent}L ${displayPath}${existsLabel}`;
        } else {
          label = `${displayPath}`;
        }
      }
    }
    let description;
    const isGit = projectIsInGitRepo(getOriginalCwd());
    if (file.type === "User" && !file.isNested) {
      description = "Saved in ~/.claude/CLAUDE.md";
    } else {
      if (file.type === "Project" && !file.isNested && file.path === projectMemoryPath) {
        description = `${isGit ? "Checked in at" : "Saved in"} ./CLAUDE.md`;
      } else {
        if (file.parent) {
          description = "@-imported";
        } else {
          if (file.isNested) {
            description = "dynamically loaded";
          } else {
            description = "";
          }
        }
      }
    }
    return {
      label,
      value: file.path,
      description
    };
  });
  const folderOptions = [];
  const agentDefinitions = useAppState(_temp3);
  if (isAutoMemoryEnabled()) {
    let t110;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t110 = {
        label: "Open auto-memory folder",
        value: `${OPEN_FOLDER_PREFIX}${getAutoMemPath()}`,
        description: ""
      };
      $[0] = t110;
    } else {
      t110 = $[0];
    }
    folderOptions.push(t110);
    if (false) {}
    for (const agent of agentDefinitions.activeAgents) {
      if (agent.memory) {
        const agentDir = getAgentMemoryDir(agent.agentType, agent.memory);
        folderOptions.push({
          label: `Open ${source_default.bold(agent.agentType)} agent memory`,
          value: `${OPEN_FOLDER_PREFIX}${agentDir}`,
          description: `${agent.memory} scope`
        });
      }
    }
  }
  memoryOptions.push(...folderOptions);
  let t1;
  if ($[2] !== memoryOptions) {
    t1 = lastSelectedPath && memoryOptions.some(_temp4) ? lastSelectedPath : memoryOptions[0]?.value || "";
    $[2] = memoryOptions;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const initialPath = t1;
  const [autoMemoryOn, setAutoMemoryOn] = import_react.useState(isAutoMemoryEnabled);
  const [autoDreamOn, setAutoDreamOn] = import_react.useState(isAutoDreamEnabled);
  const [showDreamRow] = import_react.useState(isAutoMemoryEnabled);
  const isDreamRunning = useAppState(_temp6);
  const [lastDreamAt, setLastDreamAt] = import_react.useState(null);
  let t2;
  if ($[4] !== showDreamRow) {
    t2 = () => {
      if (!showDreamRow) {
        return;
      }
      readLastConsolidatedAt().then(setLastDreamAt);
    };
    $[4] = showDreamRow;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== isDreamRunning || $[7] !== showDreamRow) {
    t3 = [showDreamRow, isDreamRunning];
    $[6] = isDreamRunning;
    $[7] = showDreamRow;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  import_react.useEffect(t2, t3);
  let t4;
  if ($[9] !== isDreamRunning || $[10] !== lastDreamAt) {
    t4 = isDreamRunning ? "running" : lastDreamAt === null ? "" : lastDreamAt === 0 ? "never" : `last ran ${formatRelativeTimeAgo(new Date(lastDreamAt))}`;
    $[9] = isDreamRunning;
    $[10] = lastDreamAt;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  const dreamStatus = t4;
  const [focusedToggle, setFocusedToggle] = import_react.useState(null);
  const toggleFocused = focusedToggle !== null;
  const lastToggleIndex = showDreamRow ? 1 : 0;
  let t5;
  if ($[12] !== autoMemoryOn) {
    t5 = function handleToggleAutoMemory2() {
      const newValue = !autoMemoryOn;
      updateSettingsForSource("userSettings", {
        autoMemoryEnabled: newValue
      });
      setAutoMemoryOn(newValue);
      logEvent("tengu_auto_memory_toggled", {
        enabled: newValue
      });
    };
    $[12] = autoMemoryOn;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  const handleToggleAutoMemory = t5;
  let t6;
  if ($[14] !== autoDreamOn) {
    t6 = function handleToggleAutoDream2() {
      const newValue_0 = !autoDreamOn;
      updateSettingsForSource("userSettings", {
        autoDreamEnabled: newValue_0
      });
      setAutoDreamOn(newValue_0);
      logEvent("tengu_auto_dream_toggled", {
        enabled: newValue_0
      });
    };
    $[14] = autoDreamOn;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  const handleToggleAutoDream = t6;
  useExitOnCtrlCDWithKeybindings();
  let t7;
  if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = {
      context: "Confirmation"
    };
    $[16] = t7;
  } else {
    t7 = $[16];
  }
  useKeybinding("confirm:no", onCancel, t7);
  let t8;
  if ($[17] !== focusedToggle || $[18] !== handleToggleAutoDream || $[19] !== handleToggleAutoMemory) {
    t8 = () => {
      if (focusedToggle === 0) {
        handleToggleAutoMemory();
      } else {
        if (focusedToggle === 1) {
          handleToggleAutoDream();
        }
      }
    };
    $[17] = focusedToggle;
    $[18] = handleToggleAutoDream;
    $[19] = handleToggleAutoMemory;
    $[20] = t8;
  } else {
    t8 = $[20];
  }
  let t9;
  if ($[21] !== toggleFocused) {
    t9 = {
      context: "Confirmation",
      isActive: toggleFocused
    };
    $[21] = toggleFocused;
    $[22] = t9;
  } else {
    t9 = $[22];
  }
  useKeybinding("confirm:yes", t8, t9);
  let t10;
  if ($[23] !== lastToggleIndex) {
    t10 = () => {
      setFocusedToggle((prev) => prev !== null && prev < lastToggleIndex ? prev + 1 : null);
    };
    $[23] = lastToggleIndex;
    $[24] = t10;
  } else {
    t10 = $[24];
  }
  let t11;
  if ($[25] !== toggleFocused) {
    t11 = {
      context: "Select",
      isActive: toggleFocused
    };
    $[25] = toggleFocused;
    $[26] = t11;
  } else {
    t11 = $[26];
  }
  useKeybinding("select:next", t10, t11);
  let t12;
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    t12 = () => {
      setFocusedToggle(_temp7);
    };
    $[27] = t12;
  } else {
    t12 = $[27];
  }
  let t13;
  if ($[28] !== toggleFocused) {
    t13 = {
      context: "Select",
      isActive: toggleFocused
    };
    $[28] = toggleFocused;
    $[29] = t13;
  } else {
    t13 = $[29];
  }
  useKeybinding("select:previous", t12, t13);
  const t14 = focusedToggle === 0;
  const t15 = autoMemoryOn ? "on" : "off";
  let t16;
  if ($[30] !== t15) {
    t16 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "Auto-memory: ",
        t15
      ]
    }, undefined, true, undefined, this);
    $[30] = t15;
    $[31] = t16;
  } else {
    t16 = $[31];
  }
  let t17;
  if ($[32] !== t14 || $[33] !== t16) {
    t17 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ListItem, {
      isFocused: t14,
      children: t16
    }, undefined, false, undefined, this);
    $[32] = t14;
    $[33] = t16;
    $[34] = t17;
  } else {
    t17 = $[34];
  }
  let t18;
  if ($[35] !== autoDreamOn || $[36] !== dreamStatus || $[37] !== focusedToggle || $[38] !== isDreamRunning || $[39] !== showDreamRow) {
    t18 = showDreamRow && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ListItem, {
      isFocused: focusedToggle === 1,
      styled: false,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: focusedToggle === 1 ? "suggestion" : undefined,
        children: [
          "Auto-dream: ",
          autoDreamOn ? "on" : "off",
          dreamStatus && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              " \xB7 ",
              dreamStatus
            ]
          }, undefined, true, undefined, this),
          !isDreamRunning && autoDreamOn && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: " \xB7 /dream to run"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[35] = autoDreamOn;
    $[36] = dreamStatus;
    $[37] = focusedToggle;
    $[38] = isDreamRunning;
    $[39] = showDreamRow;
    $[40] = t18;
  } else {
    t18 = $[40];
  }
  let t19;
  if ($[41] !== t17 || $[42] !== t18) {
    t19 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        t17,
        t18
      ]
    }, undefined, true, undefined, this);
    $[41] = t17;
    $[42] = t18;
    $[43] = t19;
  } else {
    t19 = $[43];
  }
  let t20;
  if ($[44] !== onSelect) {
    t20 = (value) => {
      if (value.startsWith(OPEN_FOLDER_PREFIX)) {
        const folderPath = value.slice(OPEN_FOLDER_PREFIX.length);
        mkdir(folderPath, {
          recursive: true
        }).catch(_temp8).then(() => openPath(folderPath));
        return;
      }
      lastSelectedPath = value;
      onSelect(value);
    };
    $[44] = onSelect;
    $[45] = t20;
  } else {
    t20 = $[45];
  }
  let t21;
  if ($[46] !== lastToggleIndex) {
    t21 = () => setFocusedToggle(lastToggleIndex);
    $[46] = lastToggleIndex;
    $[47] = t21;
  } else {
    t21 = $[47];
  }
  let t22;
  if ($[48] !== initialPath || $[49] !== memoryOptions || $[50] !== onCancel || $[51] !== t20 || $[52] !== t21 || $[53] !== toggleFocused) {
    t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      defaultFocusValue: initialPath,
      options: memoryOptions,
      isDisabled: toggleFocused,
      onChange: t20,
      onCancel,
      onUpFromFirstItem: t21
    }, undefined, false, undefined, this);
    $[48] = initialPath;
    $[49] = memoryOptions;
    $[50] = onCancel;
    $[51] = t20;
    $[52] = t21;
    $[53] = toggleFocused;
    $[54] = t22;
  } else {
    t22 = $[54];
  }
  let t23;
  if ($[55] !== t19 || $[56] !== t22) {
    t23 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      width: "100%",
      children: [
        t19,
        t22
      ]
    }, undefined, true, undefined, this);
    $[55] = t19;
    $[56] = t22;
    $[57] = t23;
  } else {
    t23 = $[57];
  }
  return t23;
}
function _temp8() {}
function _temp7(prev_0) {
  return prev_0 !== null && prev_0 > 0 ? prev_0 - 1 : prev_0;
}
function _temp6(s_0) {
  return Object.values(s_0.tasks).some(_temp5);
}
function _temp5(t) {
  return t.type === "dream" && t.status === "running";
}
function _temp4(opt) {
  return opt.value === lastSelectedPath;
}
function _temp3(s) {
  return s.agentDefinitions;
}
function _temp2(f_2) {
  return {
    ...f_2,
    exists: true
  };
}
function _temp(f_1) {
  return f_1.type !== "AutoMem" && f_1.type !== "TeamMem";
}
var import_compiler_runtime, import_react, jsx_dev_runtime, lastSelectedPath, OPEN_FOLDER_PREFIX = "__open_folder__";
var init_MemoryFileSelector = __esm(() => {
  init_source();
  init_state();
  init_useExitOnCtrlCDWithKeybindings();
  init_ink();
  init_useKeybinding();
  init_paths();
  init_analytics();
  init_config();
  init_consolidationLock();
  init_AppState();
  init_agentMemory();
  init_browser();
  init_claudemd();
  init_envUtils();
  init_file();
  init_format();
  init_versions();
  init_settings();
  init_CustomSelect();
  init_ListItem();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/memory/MemoryUpdateNotification.tsx
import { homedir } from "os";
import { relative } from "path";
function getRelativeMemoryPath(path) {
  const homeDir = homedir();
  const cwd = getCwd();
  const relativeToHome = path.startsWith(homeDir) ? "~" + path.slice(homeDir.length) : null;
  const relativeToCwd = path.startsWith(cwd) ? "./" + relative(cwd, path) : null;
  if (relativeToHome && relativeToCwd) {
    return relativeToHome.length <= relativeToCwd.length ? relativeToHome : relativeToCwd;
  }
  return relativeToHome || relativeToCwd || path;
}
var import_compiler_runtime2, jsx_dev_runtime2;
var init_MemoryUpdateNotification = __esm(() => {
  init_ink();
  init_cwd();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/memory/memory.tsx
import { mkdir as mkdir2, writeFile } from "fs/promises";
function MemoryCommand({
  onDone
}) {
  const handleSelectMemoryFile = async (memoryPath) => {
    try {
      if (memoryPath.includes(getClaudeConfigHomeDir())) {
        await mkdir2(getClaudeConfigHomeDir(), {
          recursive: true
        });
      }
      try {
        await writeFile(memoryPath, "", {
          encoding: "utf8",
          flag: "wx"
        });
      } catch (e) {
        if (getErrnoCode(e) !== "EEXIST") {
          throw e;
        }
      }
      await editFileInEditor(memoryPath);
      let editorSource = "default";
      let editorValue = "";
      if (process.env.VISUAL) {
        editorSource = "$VISUAL";
        editorValue = process.env.VISUAL;
      } else if (process.env.EDITOR) {
        editorSource = "$EDITOR";
        editorValue = process.env.EDITOR;
      }
      const editorInfo = editorSource !== "default" ? `Using ${editorSource}="${editorValue}".` : "";
      const editorHint = editorInfo ? `> ${editorInfo} To change editor, set $EDITOR or $VISUAL environment variable.` : `> To use a different editor, set the $EDITOR or $VISUAL environment variable.`;
      onDone(`Opened memory file at ${getRelativeMemoryPath(memoryPath)}

${editorHint}`, {
        display: "system"
      });
    } catch (error) {
      logError(error);
      onDone(`Error opening memory file: ${error}`);
    }
  };
  const handleCancel = () => {
    onDone("Cancelled memory editing", {
      display: "system"
    });
  };
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Dialog, {
    title: "Memory",
    onCancel: handleCancel,
    color: "remember",
    children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(React.Suspense, {
          fallback: null,
          children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(MemoryFileSelector, {
            onSelect: handleSelectMemoryFile,
            onCancel: handleCancel
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "Learn more: ",
              /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Link, {
                url: "https://code.claude.com/docs/en/memory"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
var React, jsx_dev_runtime3, call = async (onDone) => {
  clearMemoryFileCaches();
  await getMemoryFiles();
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(MemoryCommand, {
    onDone
  }, undefined, false, undefined, this);
};
var init_memory = __esm(() => {
  init_Dialog();
  init_MemoryFileSelector();
  init_MemoryUpdateNotification();
  init_ink();
  init_claudemd();
  init_envUtils();
  init_errors();
  init_log();
  init_promptEditor();
  React = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});
init_memory();

export {
  call
};
