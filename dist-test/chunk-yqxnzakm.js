// @bun
import {
  Select,
  clearServerCache,
  detectIDEs,
  detectRunningIDEs,
  getCurrentWorktreeSession,
  init_AppState,
  init_CustomSelect,
  init_client,
  init_ide,
  init_worktree,
  isJetBrainsIde,
  isSupportedJetBrainsTerminal,
  isSupportedTerminal,
  toIDEDisplayName,
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
  Dialog,
  init_Dialog
} from "./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-73qtc7a9.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-2e5y8sgq.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-zz424j25.js";
import"./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import"./chunk-x2y5syym.js";
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
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  getGlobalConfig,
  init_config1 as init_config,
  init_source,
  saveGlobalConfig,
  source_default
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
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import"./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/IdeAutoConnectDialog.tsx
function IdeAutoConnectDialog(t0) {
  const $ = import_compiler_runtime.c(9);
  const {
    onComplete
  } = t0;
  let t1;
  if ($[0] !== onComplete) {
    t1 = async (value) => {
      const autoConnect = value === "yes";
      saveGlobalConfig((current) => ({
        ...current,
        autoConnectIde: autoConnect,
        hasIdeAutoConnectDialogBeenShown: true
      }));
      onComplete();
    };
    $[0] = onComplete;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleSelect = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [{
      label: "Yes",
      value: "yes"
    }, {
      label: "No",
      value: "no"
    }];
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const options = t2;
  let t3;
  if ($[3] !== handleSelect) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      options,
      onChange: handleSelect,
      defaultValue: "yes"
    }, undefined, false, undefined, this);
    $[3] = handleSelect;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "You can also configure this in /config or with the --ide flag"
    }, undefined, false, undefined, this);
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  let t5;
  if ($[6] !== onComplete || $[7] !== t3) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Do you wish to enable auto-connect to IDE?",
      color: "ide",
      onCancel: onComplete,
      children: [
        t3,
        t4
      ]
    }, undefined, true, undefined, this);
    $[6] = onComplete;
    $[7] = t3;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  return t5;
}
function shouldShowAutoConnectDialog() {
  const config = getGlobalConfig();
  return !isSupportedTerminal() && config.autoConnectIde !== true && config.hasIdeAutoConnectDialogBeenShown !== true;
}
function IdeDisableAutoConnectDialog(t0) {
  const $ = import_compiler_runtime.c(10);
  const {
    onComplete
  } = t0;
  let t1;
  if ($[0] !== onComplete) {
    t1 = (value) => {
      const disableAutoConnect = value === "yes";
      if (disableAutoConnect) {
        saveGlobalConfig(_temp);
      }
      onComplete(disableAutoConnect);
    };
    $[0] = onComplete;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleSelect = t1;
  let t2;
  if ($[2] !== onComplete) {
    t2 = () => {
      onComplete(false);
    };
    $[2] = onComplete;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const handleCancel = t2;
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = [{
      label: "No",
      value: "no"
    }, {
      label: "Yes",
      value: "yes"
    }];
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const options = t3;
  let t4;
  if ($[5] !== handleSelect) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      options,
      onChange: handleSelect,
      defaultValue: "no"
    }, undefined, false, undefined, this);
    $[5] = handleSelect;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== handleCancel || $[8] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Do you wish to disable auto-connect to IDE?",
      subtitle: "You can also configure this in /config",
      onCancel: handleCancel,
      color: "ide",
      children: t4
    }, undefined, false, undefined, this);
    $[7] = handleCancel;
    $[8] = t4;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  return t5;
}
function _temp(current) {
  return {
    ...current,
    autoConnectIde: false
  };
}
function shouldShowDisableAutoConnectDialog() {
  const config = getGlobalConfig();
  return !isSupportedTerminal() && config.autoConnectIde === true;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_IdeAutoConnectDialog = __esm(() => {
  init_ink();
  init_config();
  init_ide();
  init_CustomSelect();
  init_Dialog();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/ide/ide.tsx
import * as path from "path";
function IDEScreen(t0) {
  const $ = import_compiler_runtime2.c(39);
  const {
    availableIDEs,
    unavailableIDEs,
    selectedIDE,
    onClose,
    onSelect
  } = t0;
  let t1;
  if ($[0] !== selectedIDE?.port) {
    t1 = selectedIDE?.port?.toString() ?? "None";
    $[0] = selectedIDE?.port;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [selectedValue, setSelectedValue] = import_react.useState(t1);
  const [showAutoConnectDialog, setShowAutoConnectDialog] = import_react.useState(false);
  const [showDisableAutoConnectDialog, setShowDisableAutoConnectDialog] = import_react.useState(false);
  let t2;
  if ($[2] !== availableIDEs || $[3] !== onSelect) {
    t2 = (value) => {
      if (value !== "None" && shouldShowAutoConnectDialog()) {
        setShowAutoConnectDialog(true);
      } else {
        if (value === "None" && shouldShowDisableAutoConnectDialog()) {
          setShowDisableAutoConnectDialog(true);
        } else {
          onSelect(availableIDEs.find((ide) => ide.port === parseInt(value)));
        }
      }
    };
    $[2] = availableIDEs;
    $[3] = onSelect;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const handleSelectIDE = t2;
  let t3;
  if ($[5] !== availableIDEs) {
    t3 = availableIDEs.reduce(_temp4, {});
    $[5] = availableIDEs;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const ideCounts = t3;
  let t4;
  if ($[7] !== availableIDEs || $[8] !== ideCounts) {
    let t52;
    if ($[10] !== ideCounts) {
      t52 = (ide_1) => {
        const hasMultipleInstances = (ideCounts[ide_1.name] || 0) > 1;
        const showWorkspace = hasMultipleInstances && ide_1.workspaceFolders.length > 0;
        return {
          label: ide_1.name,
          value: ide_1.port.toString(),
          description: showWorkspace ? formatWorkspaceFolders(ide_1.workspaceFolders) : undefined
        };
      };
      $[10] = ideCounts;
      $[11] = t52;
    } else {
      t52 = $[11];
    }
    t4 = availableIDEs.map(t52).concat([{
      label: "None",
      value: "None",
      description: undefined
    }]);
    $[7] = availableIDEs;
    $[8] = ideCounts;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const options = t4;
  if (showAutoConnectDialog) {
    let t52;
    if ($[12] !== handleSelectIDE || $[13] !== selectedValue) {
      t52 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(IdeAutoConnectDialog, {
        onComplete: () => handleSelectIDE(selectedValue)
      }, undefined, false, undefined, this);
      $[12] = handleSelectIDE;
      $[13] = selectedValue;
      $[14] = t52;
    } else {
      t52 = $[14];
    }
    return t52;
  }
  if (showDisableAutoConnectDialog) {
    let t52;
    if ($[15] !== onSelect) {
      t52 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(IdeDisableAutoConnectDialog, {
        onComplete: () => {
          onSelect(undefined);
        }
      }, undefined, false, undefined, this);
      $[15] = onSelect;
      $[16] = t52;
    } else {
      t52 = $[16];
    }
    return t52;
  }
  let t5;
  if ($[17] !== availableIDEs.length) {
    t5 = availableIDEs.length === 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: isSupportedJetBrainsTerminal() ? `No available IDEs detected. Please install the plugin and restart your IDE:
https://docs.claude.com/s/claude-code-jetbrains` : "No available IDEs detected. Make sure your IDE has the Panda Code extension or plugin installed and is running."
    }, undefined, false, undefined, this);
    $[17] = availableIDEs.length;
    $[18] = t5;
  } else {
    t5 = $[18];
  }
  let t6;
  if ($[19] !== availableIDEs.length || $[20] !== handleSelectIDE || $[21] !== options || $[22] !== selectedValue) {
    t6 = availableIDEs.length !== 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Select, {
      defaultValue: selectedValue,
      defaultFocusValue: selectedValue,
      options,
      onChange: (value_0) => {
        setSelectedValue(value_0);
        handleSelectIDE(value_0);
      }
    }, undefined, false, undefined, this);
    $[19] = availableIDEs.length;
    $[20] = handleSelectIDE;
    $[21] = options;
    $[22] = selectedValue;
    $[23] = t6;
  } else {
    t6 = $[23];
  }
  let t7;
  if ($[24] !== availableIDEs) {
    t7 = availableIDEs.length !== 0 && availableIDEs.some(_temp2) && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        color: "warning",
        children: "Note: Only one Panda Code instance can be connected to VS Code at a time."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[24] = availableIDEs;
    $[25] = t7;
  } else {
    t7 = $[25];
  }
  let t8;
  if ($[26] !== availableIDEs.length) {
    t8 = availableIDEs.length !== 0 && !isSupportedTerminal() && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: "Tip: You can enable auto-connect to IDE in /config or with the --ide flag"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[26] = availableIDEs.length;
    $[27] = t8;
  } else {
    t8 = $[27];
  }
  let t9;
  if ($[28] !== unavailableIDEs) {
    t9 = unavailableIDEs.length > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "Found ",
            unavailableIDEs.length,
            " other running IDE(s). However, their workspace/project directories do not match the current cwd."
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          flexDirection: "column",
          children: unavailableIDEs.map(_temp3)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[28] = unavailableIDEs;
    $[29] = t9;
  } else {
    t9 = $[29];
  }
  let t10;
  if ($[30] !== t5 || $[31] !== t6 || $[32] !== t7 || $[33] !== t8 || $[34] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t5,
        t6,
        t7,
        t8,
        t9
      ]
    }, undefined, true, undefined, this);
    $[30] = t5;
    $[31] = t6;
    $[32] = t7;
    $[33] = t8;
    $[34] = t9;
    $[35] = t10;
  } else {
    t10 = $[35];
  }
  let t11;
  if ($[36] !== onClose || $[37] !== t10) {
    t11 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
      title: "Select IDE",
      subtitle: "Connect to an IDE for integrated development features.",
      onCancel: onClose,
      color: "ide",
      children: t10
    }, undefined, false, undefined, this);
    $[36] = onClose;
    $[37] = t10;
    $[38] = t11;
  } else {
    t11 = $[38];
  }
  return t11;
}
function _temp3(ide_3, index) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    paddingLeft: 3,
    children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "\u2022 ",
        ide_3.name,
        ": ",
        formatWorkspaceFolders(ide_3.workspaceFolders)
      ]
    }, undefined, true, undefined, this)
  }, index, false, undefined, this);
}
function _temp2(ide_2) {
  return ide_2.name === "VS Code" || ide_2.name === "Visual Studio Code";
}
function _temp4(acc, ide_0) {
  acc[ide_0.name] = (acc[ide_0.name] || 0) + 1;
  return acc;
}
async function findCurrentIDE(availableIDEs, dynamicMcpConfig) {
  const currentConfig = dynamicMcpConfig?.ide;
  if (!currentConfig || currentConfig.type !== "sse-ide" && currentConfig.type !== "ws-ide") {
    return null;
  }
  for (const ide of availableIDEs) {
    if (ide.url === currentConfig.url) {
      return ide;
    }
  }
  return null;
}
function IDEOpenSelection(t0) {
  const $ = import_compiler_runtime2.c(18);
  const {
    availableIDEs,
    onSelectIDE,
    onDone
  } = t0;
  let t1;
  if ($[0] !== availableIDEs[0]?.port) {
    t1 = availableIDEs[0]?.port?.toString() ?? "";
    $[0] = availableIDEs[0]?.port;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [selectedValue, setSelectedValue] = import_react.useState(t1);
  let t2;
  if ($[2] !== availableIDEs || $[3] !== onSelectIDE) {
    t2 = (value) => {
      const selectedIDE = availableIDEs.find((ide) => ide.port === parseInt(value));
      onSelectIDE(selectedIDE);
    };
    $[2] = availableIDEs;
    $[3] = onSelectIDE;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const handleSelectIDE = t2;
  let t3;
  if ($[5] !== availableIDEs) {
    t3 = availableIDEs.map(_temp42);
    $[5] = availableIDEs;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const options = t3;
  let t4;
  if ($[7] !== onDone) {
    t4 = function handleCancel2() {
      onDone("IDE selection cancelled", {
        display: "system"
      });
    };
    $[7] = onDone;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  const handleCancel = t4;
  let t5;
  if ($[9] !== handleSelectIDE) {
    t5 = (value_0) => {
      setSelectedValue(value_0);
      handleSelectIDE(value_0);
    };
    $[9] = handleSelectIDE;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  let t6;
  if ($[11] !== options || $[12] !== selectedValue || $[13] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Select, {
      defaultValue: selectedValue,
      defaultFocusValue: selectedValue,
      options,
      onChange: t5
    }, undefined, false, undefined, this);
    $[11] = options;
    $[12] = selectedValue;
    $[13] = t5;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  let t7;
  if ($[15] !== handleCancel || $[16] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
      title: "Select an IDE to open the project",
      onCancel: handleCancel,
      color: "ide",
      children: t6
    }, undefined, false, undefined, this);
    $[15] = handleCancel;
    $[16] = t6;
    $[17] = t7;
  } else {
    t7 = $[17];
  }
  return t7;
}
function _temp42(ide_0) {
  return {
    label: ide_0.name,
    value: ide_0.port.toString()
  };
}
function RunningIDESelector(t0) {
  const $ = import_compiler_runtime2.c(15);
  const {
    runningIDEs,
    onSelectIDE,
    onDone
  } = t0;
  const [selectedValue, setSelectedValue] = import_react.useState(runningIDEs[0] ?? "");
  let t1;
  if ($[0] !== onSelectIDE) {
    t1 = (value) => {
      onSelectIDE(value);
    };
    $[0] = onSelectIDE;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleSelectIDE = t1;
  let t2;
  if ($[2] !== runningIDEs) {
    t2 = runningIDEs.map(_temp5);
    $[2] = runningIDEs;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const options = t2;
  let t3;
  if ($[4] !== onDone) {
    t3 = function handleCancel2() {
      onDone("IDE selection cancelled", {
        display: "system"
      });
    };
    $[4] = onDone;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const handleCancel = t3;
  let t4;
  if ($[6] !== handleSelectIDE) {
    t4 = (value_0) => {
      setSelectedValue(value_0);
      handleSelectIDE(value_0);
    };
    $[6] = handleSelectIDE;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== options || $[9] !== selectedValue || $[10] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Select, {
      defaultFocusValue: selectedValue,
      options,
      onChange: t4
    }, undefined, false, undefined, this);
    $[8] = options;
    $[9] = selectedValue;
    $[10] = t4;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  let t6;
  if ($[12] !== handleCancel || $[13] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
      title: "Select IDE to install extension",
      onCancel: handleCancel,
      color: "ide",
      children: t5
    }, undefined, false, undefined, this);
    $[12] = handleCancel;
    $[13] = t5;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  return t6;
}
function _temp5(ide) {
  return {
    label: toIDEDisplayName(ide),
    value: ide
  };
}
function InstallOnMount(t0) {
  const $ = import_compiler_runtime2.c(4);
  const {
    ide,
    onInstall
  } = t0;
  let t1;
  let t2;
  if ($[0] !== ide || $[1] !== onInstall) {
    t1 = () => {
      onInstall(ide);
    };
    t2 = [ide, onInstall];
    $[0] = ide;
    $[1] = onInstall;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  import_react.useEffect(t1, t2);
  return null;
}
async function call(onDone, context, args) {
  logEvent("tengu_ext_ide_command", {});
  const {
    options: {
      dynamicMcpConfig
    },
    onChangeDynamicMcpConfig
  } = context;
  if (args?.trim() === "open") {
    const worktreeSession = getCurrentWorktreeSession();
    const targetPath = worktreeSession ? worktreeSession.worktreePath : getCwd();
    const detectedIDEs2 = await detectIDEs(true);
    const availableIDEs2 = detectedIDEs2.filter((ide) => ide.isValid);
    if (availableIDEs2.length === 0) {
      onDone("No IDEs with Panda Code extension detected.");
      return null;
    }
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(IDEOpenSelection, {
      availableIDEs: availableIDEs2,
      onSelectIDE: async (selectedIDE) => {
        if (!selectedIDE) {
          onDone("No IDE selected.");
          return;
        }
        if (selectedIDE.name.toLowerCase().includes("vscode") || selectedIDE.name.toLowerCase().includes("cursor") || selectedIDE.name.toLowerCase().includes("windsurf")) {
          const {
            code
          } = await execFileNoThrow("code", [targetPath]);
          if (code === 0) {
            onDone(`Opened ${worktreeSession ? "worktree" : "project"} in ${source_default.bold(selectedIDE.name)}`);
          } else {
            onDone(`Failed to open in ${selectedIDE.name}. Try opening manually: ${targetPath}`);
          }
        } else if (isSupportedJetBrainsTerminal()) {
          onDone(`Please open the ${worktreeSession ? "worktree" : "project"} manually in ${source_default.bold(selectedIDE.name)}: ${targetPath}`);
        } else {
          onDone(`Please open the ${worktreeSession ? "worktree" : "project"} manually in ${source_default.bold(selectedIDE.name)}: ${targetPath}`);
        }
      },
      onDone: () => {
        onDone("Exited without opening IDE", {
          display: "system"
        });
      }
    }, undefined, false, undefined, this);
  }
  const detectedIDEs = await detectIDEs(true);
  if (detectedIDEs.length === 0 && context.onInstallIDEExtension && !isSupportedTerminal()) {
    const runningIDEs = await detectRunningIDEs();
    const onInstall = (ide) => {
      if (context.onInstallIDEExtension) {
        context.onInstallIDEExtension(ide);
        if (isJetBrainsIde(ide)) {
          onDone(`Installed plugin to ${source_default.bold(toIDEDisplayName(ide))}
` + `Please ${source_default.bold("restart your IDE")} completely for it to take effect`);
        } else {
          onDone(`Installed extension to ${source_default.bold(toIDEDisplayName(ide))}`);
        }
      }
    };
    if (runningIDEs.length > 1) {
      return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(RunningIDESelector, {
        runningIDEs,
        onSelectIDE: onInstall,
        onDone: () => {
          onDone("No IDE selected.", {
            display: "system"
          });
        }
      }, undefined, false, undefined, this);
    } else if (runningIDEs.length === 1) {
      return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(InstallOnMount, {
        ide: runningIDEs[0],
        onInstall
      }, undefined, false, undefined, this);
    }
  }
  const availableIDEs = detectedIDEs.filter((ide) => ide.isValid);
  const unavailableIDEs = detectedIDEs.filter((ide) => !ide.isValid);
  const currentIDE = await findCurrentIDE(availableIDEs, dynamicMcpConfig);
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(IDECommandFlow, {
    availableIDEs,
    unavailableIDEs,
    currentIDE,
    dynamicMcpConfig,
    onChangeDynamicMcpConfig,
    onDone
  }, undefined, false, undefined, this);
}
function IDECommandFlow({
  availableIDEs,
  unavailableIDEs,
  currentIDE,
  dynamicMcpConfig,
  onChangeDynamicMcpConfig,
  onDone
}) {
  const [connectingIDE, setConnectingIDE] = import_react.useState(null);
  const ideClient = useAppState((s) => s.mcp.clients.find((c) => c.name === "ide"));
  const setAppState = useSetAppState();
  const isFirstCheckRef = import_react.useRef(true);
  import_react.useEffect(() => {
    if (!connectingIDE)
      return;
    if (isFirstCheckRef.current) {
      isFirstCheckRef.current = false;
      return;
    }
    if (!ideClient || ideClient.type === "pending")
      return;
    if (ideClient.type === "connected") {
      onDone(`Connected to ${connectingIDE.name}.`);
    } else if (ideClient.type === "failed") {
      onDone(`Failed to connect to ${connectingIDE.name}.`);
    }
  }, [ideClient, connectingIDE, onDone]);
  import_react.useEffect(() => {
    if (!connectingIDE)
      return;
    const timer = setTimeout(onDone, IDE_CONNECTION_TIMEOUT_MS, `Connection to ${connectingIDE.name} timed out.`);
    return () => clearTimeout(timer);
  }, [connectingIDE, onDone]);
  const handleSelectIDE = import_react.useCallback((selectedIDE) => {
    if (!onChangeDynamicMcpConfig) {
      onDone("Error connecting to IDE.");
      return;
    }
    const newConfig = {
      ...dynamicMcpConfig || {}
    };
    if (currentIDE) {
      delete newConfig.ide;
    }
    if (!selectedIDE) {
      if (ideClient && ideClient.type === "connected" && currentIDE) {
        ideClient.client.onclose = () => {};
        clearServerCache("ide", ideClient.config);
        setAppState((prev) => ({
          ...prev,
          mcp: {
            ...prev.mcp,
            clients: prev.mcp.clients.filter((c_0) => c_0.name !== "ide"),
            tools: prev.mcp.tools.filter((t) => !t.name?.startsWith("mcp__ide__")),
            commands: prev.mcp.commands.filter((c_1) => !c_1.name?.startsWith("mcp__ide__"))
          }
        }));
      }
      onChangeDynamicMcpConfig(newConfig);
      onDone(currentIDE ? `Disconnected from ${currentIDE.name}.` : "No IDE selected.");
      return;
    }
    const url = selectedIDE.url;
    newConfig.ide = {
      type: url.startsWith("ws:") ? "ws-ide" : "sse-ide",
      url,
      ideName: selectedIDE.name,
      authToken: selectedIDE.authToken,
      ideRunningInWindows: selectedIDE.ideRunningInWindows,
      scope: "dynamic"
    };
    isFirstCheckRef.current = true;
    setConnectingIDE(selectedIDE);
    onChangeDynamicMcpConfig(newConfig);
  }, [dynamicMcpConfig, currentIDE, ideClient, setAppState, onChangeDynamicMcpConfig, onDone]);
  if (connectingIDE) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "Connecting to ",
        connectingIDE.name,
        "\u2026"
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(IDEScreen, {
    availableIDEs,
    unavailableIDEs,
    selectedIDE: currentIDE,
    onClose: () => onDone("IDE selection cancelled", {
      display: "system"
    }),
    onSelect: handleSelectIDE
  }, undefined, false, undefined, this);
}
function formatWorkspaceFolders(folders, maxLength = 100) {
  if (folders.length === 0)
    return "";
  const cwd = getCwd();
  const foldersToShow = folders.slice(0, 2);
  const hasMore = folders.length > 2;
  const ellipsisOverhead = hasMore ? 3 : 0;
  const separatorOverhead = (foldersToShow.length - 1) * 2;
  const availableLength = maxLength - separatorOverhead - ellipsisOverhead;
  const maxLengthPerPath = Math.floor(availableLength / foldersToShow.length);
  const cwdNFC = cwd.normalize("NFC");
  const formattedFolders = foldersToShow.map((folder) => {
    const folderNFC = folder.normalize("NFC");
    if (folderNFC.startsWith(cwdNFC + path.sep)) {
      folder = folderNFC.slice(cwdNFC.length + 1);
    }
    if (folder.length <= maxLengthPerPath) {
      return folder;
    }
    return "\u2026" + folder.slice(-(maxLengthPerPath - 1));
  });
  let result = formattedFolders.join(", ");
  if (hasMore) {
    result += ", \u2026";
  }
  return result;
}
var import_compiler_runtime2, import_react, jsx_dev_runtime2, IDE_CONNECTION_TIMEOUT_MS = 35000;
var init_ide2 = __esm(() => {
  init_source();
  init_analytics();
  init_CustomSelect();
  init_Dialog();
  init_IdeAutoConnectDialog();
  init_ink();
  init_client();
  init_AppState();
  init_cwd();
  init_execFileNoThrow();
  init_ide();
  init_worktree();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});
init_ide2();

export {
  formatWorkspaceFolders,
  call
};
