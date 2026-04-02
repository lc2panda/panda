// @bun
import {
  init_loadUserBindings,
  isKeybindingCustomizationEnabled
} from "./chunk-ekfe4t3x.js";
import {
  init_useShortcutDisplay,
  useShortcutDisplay
} from "./chunk-p9ra2v2f.js";
import {
  hasUsedBackslashReturn,
  init_terminalSetup,
  isShiftEnterKeyBindingInstalled
} from "./chunk-1hjzbne1.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import {
  getGlobalConfig,
  init_config1 as init_config,
  init_fastMode,
  init_growthbook,
  isFastModeAvailable,
  isFastModeEnabled
} from "./chunk-w5d5b7r0.js";
import {
  getPlatform,
  init_platform
} from "./chunk-2g1tm0n3.js";
import {
  env,
  init_env
} from "./chunk-7np1pz21.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/PromptInput/utils.ts
function isVimModeEnabled() {
  const config = getGlobalConfig();
  return config.editorMode === "vim";
}
function getNewlineInstructions() {
  if (env.terminal === "Apple_Terminal" && process.platform === "darwin") {
    return "shift + \u23CE for newline";
  }
  if (isShiftEnterKeyBindingInstalled()) {
    return "shift + \u23CE for newline";
  }
  return hasUsedBackslashReturn() ? "\\\u23CE for newline" : "backslash (\\) + return (\u23CE) for newline";
}
function isNonSpacePrintable(input, key) {
  if (key.ctrl || key.meta || key.escape || key.return || key.tab || key.backspace || key.delete || key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.pageUp || key.pageDown || key.home || key.end) {
    return false;
  }
  return input.length > 0 && !/^\s/.test(input) && !input.startsWith("\x1B");
}
var init_utils = __esm(() => {
  init_terminalSetup();
  init_config();
  init_env();
});

// src/components/PromptInput/PromptInputHelpMenu.tsx
function formatShortcut(shortcut) {
  return shortcut.replace(/\+/g, " + ");
}
function PromptInputHelpMenu(props) {
  const $ = import_compiler_runtime.c(99);
  const {
    dimColor,
    fixedWidth,
    gap,
    paddingX
  } = props;
  const t0 = useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o");
  let t1;
  if ($[0] !== t0) {
    t1 = formatShortcut(t0);
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const transcriptShortcut = t1;
  const t2 = useShortcutDisplay("app:toggleTodos", "Global", "ctrl+t");
  let t3;
  if ($[2] !== t2) {
    t3 = formatShortcut(t2);
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const todosShortcut = t3;
  const t4 = useShortcutDisplay("chat:undo", "Chat", "ctrl+_");
  let t5;
  if ($[4] !== t4) {
    t5 = formatShortcut(t4);
    $[4] = t4;
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  const undoShortcut = t5;
  const t6 = useShortcutDisplay("chat:stash", "Chat", "ctrl+s");
  let t7;
  if ($[6] !== t6) {
    t7 = formatShortcut(t6);
    $[6] = t6;
    $[7] = t7;
  } else {
    t7 = $[7];
  }
  const stashShortcut = t7;
  const t8 = useShortcutDisplay("chat:cycleMode", "Chat", "shift+tab");
  let t9;
  if ($[8] !== t8) {
    t9 = formatShortcut(t8);
    $[8] = t8;
    $[9] = t9;
  } else {
    t9 = $[9];
  }
  const cycleModeShortcut = t9;
  const t10 = useShortcutDisplay("chat:modelPicker", "Chat", "alt+p");
  let t11;
  if ($[10] !== t10) {
    t11 = formatShortcut(t10);
    $[10] = t10;
    $[11] = t11;
  } else {
    t11 = $[11];
  }
  const modelPickerShortcut = t11;
  const t12 = useShortcutDisplay("chat:fastMode", "Chat", "alt+o");
  let t13;
  if ($[12] !== t12) {
    t13 = formatShortcut(t12);
    $[12] = t12;
    $[13] = t13;
  } else {
    t13 = $[13];
  }
  const fastModeShortcut = t13;
  const t14 = useShortcutDisplay("chat:externalEditor", "Chat", "ctrl+g");
  let t15;
  if ($[14] !== t14) {
    t15 = formatShortcut(t14);
    $[14] = t14;
    $[15] = t15;
  } else {
    t15 = $[15];
  }
  const externalEditorShortcut = t15;
  const t16 = useShortcutDisplay("app:toggleTerminal", "Global", "meta+j");
  let t17;
  if ($[16] !== t16) {
    t17 = formatShortcut(t16);
    $[16] = t16;
    $[17] = t17;
  } else {
    t17 = $[17];
  }
  const terminalShortcut = t17;
  const t18 = useShortcutDisplay("chat:imagePaste", "Chat", "ctrl+v");
  let t19;
  if ($[18] !== t18) {
    t19 = formatShortcut(t18);
    $[18] = t18;
    $[19] = t19;
  } else {
    t19 = $[19];
  }
  const imagePasteShortcut = t19;
  let t20;
  if ($[20] !== dimColor || $[21] !== terminalShortcut) {
    t20 = null;
    $[20] = dimColor;
    $[21] = terminalShortcut;
    $[22] = t20;
  } else {
    t20 = $[22];
  }
  const terminalShortcutElement = t20;
  const t21 = fixedWidth ? 24 : undefined;
  let t22;
  if ($[23] !== dimColor) {
    t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: "! for bash mode"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[23] = dimColor;
    $[24] = t22;
  } else {
    t22 = $[24];
  }
  let t23;
  if ($[25] !== dimColor) {
    t23 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: "/ for commands"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[25] = dimColor;
    $[26] = t23;
  } else {
    t23 = $[26];
  }
  let t24;
  if ($[27] !== dimColor) {
    t24 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: "@ for file paths"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[27] = dimColor;
    $[28] = t24;
  } else {
    t24 = $[28];
  }
  let t25;
  if ($[29] !== dimColor) {
    t25 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: "& for background"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[29] = dimColor;
    $[30] = t25;
  } else {
    t25 = $[30];
  }
  let t26;
  if ($[31] !== dimColor) {
    t26 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: "/btw for side question"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[31] = dimColor;
    $[32] = t26;
  } else {
    t26 = $[32];
  }
  let t27;
  if ($[33] !== t21 || $[34] !== t22 || $[35] !== t23 || $[36] !== t24 || $[37] !== t25 || $[38] !== t26) {
    t27 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      width: t21,
      children: [
        t22,
        t23,
        t24,
        t25,
        t26
      ]
    }, undefined, true, undefined, this);
    $[33] = t21;
    $[34] = t22;
    $[35] = t23;
    $[36] = t24;
    $[37] = t25;
    $[38] = t26;
    $[39] = t27;
  } else {
    t27 = $[39];
  }
  const t28 = fixedWidth ? 35 : undefined;
  let t29;
  if ($[40] !== dimColor) {
    t29 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: "double tap esc to clear input"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[40] = dimColor;
    $[41] = t29;
  } else {
    t29 = $[41];
  }
  let t30;
  if ($[42] !== cycleModeShortcut || $[43] !== dimColor) {
    t30 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: [
          cycleModeShortcut,
          " ",
          "to auto-accept edits"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[42] = cycleModeShortcut;
    $[43] = dimColor;
    $[44] = t30;
  } else {
    t30 = $[44];
  }
  let t31;
  if ($[45] !== dimColor || $[46] !== transcriptShortcut) {
    t31 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: [
          transcriptShortcut,
          " for verbose output"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[45] = dimColor;
    $[46] = transcriptShortcut;
    $[47] = t31;
  } else {
    t31 = $[47];
  }
  let t32;
  if ($[48] !== dimColor || $[49] !== todosShortcut) {
    t32 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: [
          todosShortcut,
          " to toggle tasks"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[48] = dimColor;
    $[49] = todosShortcut;
    $[50] = t32;
  } else {
    t32 = $[50];
  }
  let t33;
  if ($[51] === Symbol.for("react.memo_cache_sentinel")) {
    t33 = getNewlineInstructions();
    $[51] = t33;
  } else {
    t33 = $[51];
  }
  let t34;
  if ($[52] !== dimColor) {
    t34 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: t33
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[52] = dimColor;
    $[53] = t34;
  } else {
    t34 = $[53];
  }
  let t35;
  if ($[54] !== t28 || $[55] !== t29 || $[56] !== t30 || $[57] !== t31 || $[58] !== t32 || $[59] !== t34 || $[60] !== terminalShortcutElement) {
    t35 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      width: t28,
      children: [
        t29,
        t30,
        t31,
        t32,
        terminalShortcutElement,
        t34
      ]
    }, undefined, true, undefined, this);
    $[54] = t28;
    $[55] = t29;
    $[56] = t30;
    $[57] = t31;
    $[58] = t32;
    $[59] = t34;
    $[60] = terminalShortcutElement;
    $[61] = t35;
  } else {
    t35 = $[61];
  }
  let t36;
  if ($[62] !== dimColor || $[63] !== undoShortcut) {
    t36 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: [
          undoShortcut,
          " to undo"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[62] = dimColor;
    $[63] = undoShortcut;
    $[64] = t36;
  } else {
    t36 = $[64];
  }
  let t37;
  if ($[65] !== dimColor) {
    t37 = getPlatform() !== "windows" && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: "ctrl + z to suspend"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[65] = dimColor;
    $[66] = t37;
  } else {
    t37 = $[66];
  }
  let t38;
  if ($[67] !== dimColor || $[68] !== imagePasteShortcut) {
    t38 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: [
          imagePasteShortcut,
          " to paste images"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[67] = dimColor;
    $[68] = imagePasteShortcut;
    $[69] = t38;
  } else {
    t38 = $[69];
  }
  let t39;
  if ($[70] !== dimColor || $[71] !== modelPickerShortcut) {
    t39 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: [
          modelPickerShortcut,
          " to switch model"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[70] = dimColor;
    $[71] = modelPickerShortcut;
    $[72] = t39;
  } else {
    t39 = $[72];
  }
  let t40;
  if ($[73] !== dimColor || $[74] !== fastModeShortcut) {
    t40 = isFastModeEnabled() && isFastModeAvailable() && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: [
          fastModeShortcut,
          " to toggle fast mode"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[73] = dimColor;
    $[74] = fastModeShortcut;
    $[75] = t40;
  } else {
    t40 = $[75];
  }
  let t41;
  if ($[76] !== dimColor || $[77] !== stashShortcut) {
    t41 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: [
          stashShortcut,
          " to stash prompt"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[76] = dimColor;
    $[77] = stashShortcut;
    $[78] = t41;
  } else {
    t41 = $[78];
  }
  let t42;
  if ($[79] !== dimColor || $[80] !== externalEditorShortcut) {
    t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: [
          externalEditorShortcut,
          " to edit in $EDITOR"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[79] = dimColor;
    $[80] = externalEditorShortcut;
    $[81] = t42;
  } else {
    t42 = $[81];
  }
  let t43;
  if ($[82] !== dimColor) {
    t43 = isKeybindingCustomizationEnabled() && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor,
        children: "/keybindings to customize"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[82] = dimColor;
    $[83] = t43;
  } else {
    t43 = $[83];
  }
  let t44;
  if ($[84] !== t36 || $[85] !== t37 || $[86] !== t38 || $[87] !== t39 || $[88] !== t40 || $[89] !== t41 || $[90] !== t42 || $[91] !== t43) {
    t44 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t36,
        t37,
        t38,
        t39,
        t40,
        t41,
        t42,
        t43
      ]
    }, undefined, true, undefined, this);
    $[84] = t36;
    $[85] = t37;
    $[86] = t38;
    $[87] = t39;
    $[88] = t40;
    $[89] = t41;
    $[90] = t42;
    $[91] = t43;
    $[92] = t44;
  } else {
    t44 = $[92];
  }
  let t45;
  if ($[93] !== gap || $[94] !== paddingX || $[95] !== t27 || $[96] !== t35 || $[97] !== t44) {
    t45 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      paddingX,
      flexDirection: "row",
      gap,
      children: [
        t27,
        t35,
        t44
      ]
    }, undefined, true, undefined, this);
    $[93] = gap;
    $[94] = paddingX;
    $[95] = t27;
    $[96] = t35;
    $[97] = t44;
    $[98] = t45;
  } else {
    t45 = $[98];
  }
  return t45;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_PromptInputHelpMenu = __esm(() => {
  init_ink();
  init_platform();
  init_loadUserBindings();
  init_useShortcutDisplay();
  init_growthbook();
  init_fastMode();
  init_utils();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { isVimModeEnabled, isNonSpacePrintable, init_utils, PromptInputHelpMenu, init_PromptInputHelpMenu };
