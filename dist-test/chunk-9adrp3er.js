// @bun
import {
  PromptInputHelpMenu,
  init_PromptInputHelpMenu
} from "./chunk-hqm0dgqd.js";
import {
  Tab,
  Tabs,
  init_Tabs,
  useTabHeaderFocus
} from "./chunk-5rsyjdzb.js";
import"./chunk-y5v4npt0.js";
import {
  Select,
  builtInCommandNames,
  formatDescriptionWithSource,
  init_commands1 as init_commands,
  init_select
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import {
  init_useShortcutDisplay,
  useShortcutDisplay
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
  Pane,
  init_Pane,
  init_modalContext,
  init_useKeybinding,
  init_useTerminalSize,
  useIsInsideModal,
  useKeybinding,
  useTerminalSize
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
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import"./chunk-bt6e264h.js";
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
  init_format,
  truncate
} from "./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import"./chunk-h0rbjg6x.js";
import"./chunk-s85yj5xm.js";
import"./chunk-73q6p10n.js";
import"./chunk-8qg6qavk.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-14j8jv5j.js";
import"./chunk-0xqnccz6.js";
import"./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
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

// src/components/HelpV2/Commands.tsx
function Commands(t0) {
  const $ = import_compiler_runtime.c(14);
  const {
    commands,
    maxHeight,
    columns,
    title,
    onCancel,
    emptyMessage
  } = t0;
  const {
    headerFocused,
    focusHeader
  } = useTabHeaderFocus();
  const maxWidth = Math.max(1, columns - 10);
  const visibleCount = Math.max(1, Math.floor((maxHeight - 10) / 2));
  let t1;
  if ($[0] !== commands || $[1] !== maxWidth) {
    const seen = new Set;
    let t22;
    if ($[3] !== maxWidth) {
      t22 = (cmd_0) => ({
        label: `/${cmd_0.name}`,
        value: cmd_0.name,
        description: truncate(formatDescriptionWithSource(cmd_0), maxWidth, true)
      });
      $[3] = maxWidth;
      $[4] = t22;
    } else {
      t22 = $[4];
    }
    t1 = commands.filter((cmd) => {
      if (seen.has(cmd.name)) {
        return false;
      }
      seen.add(cmd.name);
      return true;
    }).sort(_temp).map(t22);
    $[0] = commands;
    $[1] = maxWidth;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const options = t1;
  let t2;
  if ($[5] !== commands.length || $[6] !== emptyMessage || $[7] !== focusHeader || $[8] !== headerFocused || $[9] !== onCancel || $[10] !== options || $[11] !== title || $[12] !== visibleCount) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      paddingY: 1,
      children: commands.length === 0 && emptyMessage ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: emptyMessage
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: title
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
              options,
              visibleOptionCount: visibleCount,
              onCancel,
              disableSelection: true,
              hideIndexes: true,
              layout: "compact-vertical",
              onUpFromFirstItem: focusHeader,
              isDisabled: headerFocused
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[5] = commands.length;
    $[6] = emptyMessage;
    $[7] = focusHeader;
    $[8] = headerFocused;
    $[9] = onCancel;
    $[10] = options;
    $[11] = title;
    $[12] = visibleCount;
    $[13] = t2;
  } else {
    t2 = $[13];
  }
  return t2;
}
function _temp(a, b) {
  return a.name.localeCompare(b.name);
}
var import_compiler_runtime, jsx_dev_runtime;
var init_Commands = __esm(() => {
  init_commands();
  init_ink();
  init_format();
  init_select();
  init_Tabs();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/HelpV2/General.tsx
function General() {
  const $ = import_compiler_runtime2.c(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        children: "Claude understands your codebase, makes edits with your permission, and executes commands \u2014 right from your terminal."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      paddingY: 1,
      gap: 1,
      children: [
        t0,
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
              children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                bold: true,
                children: "Shortcuts"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(PromptInputHelpMenu, {
              gap: 2,
              fixedWidth: true
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}
var import_compiler_runtime2, jsx_dev_runtime2;
var init_General = __esm(() => {
  init_ink();
  init_PromptInputHelpMenu();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/HelpV2/HelpV2.tsx
function HelpV2(t0) {
  const $ = import_compiler_runtime3.c(44);
  const {
    onClose,
    commands
  } = t0;
  const {
    rows,
    columns
  } = useTerminalSize();
  const maxHeight = Math.floor(rows / 2);
  const insideModal = useIsInsideModal();
  let t1;
  if ($[0] !== onClose) {
    t1 = () => onClose("Help dialog dismissed", {
      display: "system"
    });
    $[0] = onClose;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const close = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = {
      context: "Help"
    };
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  useKeybinding("help:dismiss", close, t2);
  const exitState = useExitOnCtrlCDWithKeybindings(close);
  const dismissShortcut = useShortcutDisplay("help:dismiss", "Help", "esc");
  let antOnlyCommands;
  let builtinCommands;
  let t3;
  if ($[3] !== commands) {
    const builtinNames = builtInCommandNames();
    builtinCommands = commands.filter((cmd) => builtinNames.has(cmd.name) && !cmd.isHidden);
    let t42;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = [];
      $[7] = t42;
    } else {
      t42 = $[7];
    }
    antOnlyCommands = t42;
    t3 = commands.filter((cmd_2) => !builtinNames.has(cmd_2.name) && !cmd_2.isHidden);
    $[3] = commands;
    $[4] = antOnlyCommands;
    $[5] = builtinCommands;
    $[6] = t3;
  } else {
    antOnlyCommands = $[4];
    builtinCommands = $[5];
    t3 = $[6];
  }
  const customCommands = t3;
  let t4;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Tab, {
      title: "general",
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(General, {}, undefined, false, undefined, this)
    }, "general", false, undefined, this);
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  let tabs;
  if ($[9] !== antOnlyCommands || $[10] !== builtinCommands || $[11] !== close || $[12] !== columns || $[13] !== customCommands || $[14] !== maxHeight) {
    tabs = [t4];
    let t52;
    if ($[16] !== builtinCommands || $[17] !== close || $[18] !== columns || $[19] !== maxHeight) {
      t52 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Tab, {
        title: "commands",
        children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Commands, {
          commands: builtinCommands,
          maxHeight,
          columns,
          title: "Browse default commands:",
          onCancel: close
        }, undefined, false, undefined, this)
      }, "commands", false, undefined, this);
      $[16] = builtinCommands;
      $[17] = close;
      $[18] = columns;
      $[19] = maxHeight;
      $[20] = t52;
    } else {
      t52 = $[20];
    }
    tabs.push(t52);
    let t62;
    if ($[21] !== close || $[22] !== columns || $[23] !== customCommands || $[24] !== maxHeight) {
      t62 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Tab, {
        title: "custom-commands",
        children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Commands, {
          commands: customCommands,
          maxHeight,
          columns,
          title: "Browse custom commands:",
          emptyMessage: "No custom commands found",
          onCancel: close
        }, undefined, false, undefined, this)
      }, "custom", false, undefined, this);
      $[21] = close;
      $[22] = columns;
      $[23] = customCommands;
      $[24] = maxHeight;
      $[25] = t62;
    } else {
      t62 = $[25];
    }
    tabs.push(t62);
    if (false) {}
    $[9] = antOnlyCommands;
    $[10] = builtinCommands;
    $[11] = close;
    $[12] = columns;
    $[13] = customCommands;
    $[14] = maxHeight;
    $[15] = tabs;
  } else {
    tabs = $[15];
  }
  const t5 = insideModal ? undefined : maxHeight;
  let t6;
  if ($[31] !== tabs) {
    t6 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Tabs, {
      title: `Panda Code v${MACRO.VERSION}`,
      color: "professionalBlue",
      defaultTab: "general",
      children: tabs
    }, undefined, false, undefined, this);
    $[31] = tabs;
    $[32] = t6;
  } else {
    t6 = $[32];
  }
  let t7;
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        children: [
          "For more help:",
          " ",
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Link, {
            url: "https://code.claude.com/docs/en/overview"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[33] = t7;
  } else {
    t7 = $[33];
  }
  let t8;
  if ($[34] !== dismissShortcut || $[35] !== exitState.keyName || $[36] !== exitState.pending) {
    t8 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
          children: [
            "Press ",
            exitState.keyName,
            " again to exit"
          ]
        }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          italic: true,
          children: [
            dismissShortcut,
            " to cancel"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[34] = dismissShortcut;
    $[35] = exitState.keyName;
    $[36] = exitState.pending;
    $[37] = t8;
  } else {
    t8 = $[37];
  }
  let t9;
  if ($[38] !== t6 || $[39] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Pane, {
      color: "professionalBlue",
      children: [
        t6,
        t7,
        t8
      ]
    }, undefined, true, undefined, this);
    $[38] = t6;
    $[39] = t8;
    $[40] = t9;
  } else {
    t9 = $[40];
  }
  let t10;
  if ($[41] !== t5 || $[42] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      height: t5,
      children: t9
    }, undefined, false, undefined, this);
    $[41] = t5;
    $[42] = t9;
    $[43] = t10;
  } else {
    t10 = $[43];
  }
  return t10;
}
var import_compiler_runtime3, jsx_dev_runtime3;
var init_HelpV2 = __esm(() => {
  init_useExitOnCtrlCDWithKeybindings();
  init_useShortcutDisplay();
  init_commands();
  init_modalContext();
  init_useTerminalSize();
  init_ink();
  init_useKeybinding();
  init_Pane();
  init_Tabs();
  init_Commands();
  init_General();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/help/help.tsx
var jsx_dev_runtime4, call = async (onDone, {
  options: {
    commands
  }
}) => {
  return /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(HelpV2, {
    commands,
    onClose: onDone
  }, undefined, false, undefined, this);
};
var init_help = __esm(() => {
  init_HelpV2();
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
});
init_help();

export {
  call
};
