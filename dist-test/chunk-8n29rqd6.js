// @bun
import {
  getAutoModeDenials,
  init_autoModeDenials
} from "./chunk-0paqc2yw.js";
import {
  SearchBox,
  init_SearchBox,
  init_useSearchInput,
  useSearchInput
} from "./chunk-dxkdr7yz.js";
import {
  Tab,
  Tabs,
  init_Tabs,
  useTabHeaderFocus,
  useTabsWidth
} from "./chunk-5rsyjdzb.js";
import {
  StatusIcon,
  init_StatusIcon
} from "./chunk-wzr3bqfc.js";
import {
  detectUnreachableRules,
  init_shadowedRuleDetection
} from "./chunk-n0mxr6ce.js";
import {
  AddWorkspaceDirectory,
  init_AddWorkspaceDirectory
} from "./chunk-ws8d6b3n.js";
import"./chunk-rfvd0qfk.js";
import"./chunk-vy2p8z1v.js";
import"./chunk-y5v4npt0.js";
import {
  BashTool,
  SandboxManager,
  Select,
  TextInput,
  WebFetchTool,
  applyPermissionUpdate,
  createPermissionRetryMessage,
  deletePermissionRule,
  getAllowRules,
  getAskRules,
  getDenyRules,
  init_AppState,
  init_BashTool,
  init_PermissionUpdate,
  init_TextInput,
  init_WebFetchTool,
  init_messages1 as init_messages,
  init_permissions,
  init_sandbox_adapter,
  init_select,
  permissionRuleSourceDisplayString,
  persistPermissionUpdate,
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
  init_useKeybinding,
  init_useTerminalSize,
  useKeybinding,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  Newline,
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime,
  useTerminalFocus,
  use_input_default
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
  SOURCES,
  getRelativeSettingsFilePathForSource,
  init_constants,
  init_permissionRuleParser,
  init_settings1 as init_settings,
  init_source,
  init_stringUtils,
  permissionRuleValueFromString,
  permissionRuleValueToString,
  plural,
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
import"./chunk-h0rbjg6x.js";
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
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  init_slowOperations,
  jsonStringify
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
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

// src/components/permissions/rules/PermissionRuleDescription.tsx
function PermissionRuleDescription(t0) {
  const $ = import_compiler_runtime.c(9);
  const {
    ruleValue
  } = t0;
  switch (ruleValue.toolName) {
    case BashTool.name: {
      if (ruleValue.ruleContent) {
        if (ruleValue.ruleContent.endsWith(":*")) {
          let t1;
          if ($[0] !== ruleValue.ruleContent) {
            t1 = ruleValue.ruleContent.slice(0, -2);
            $[0] = ruleValue.ruleContent;
            $[1] = t1;
          } else {
            t1 = $[1];
          }
          let t2;
          if ($[2] !== t1) {
            t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "Any Bash command starting with",
                " ",
                /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  bold: true,
                  children: t1
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this);
            $[2] = t1;
            $[3] = t2;
          } else {
            t2 = $[3];
          }
          return t2;
        } else {
          let t1;
          if ($[4] !== ruleValue.ruleContent) {
            t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "The Bash command ",
                /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  bold: true,
                  children: ruleValue.ruleContent
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this);
            $[4] = ruleValue.ruleContent;
            $[5] = t1;
          } else {
            t1 = $[5];
          }
          return t1;
        }
      } else {
        let t1;
        if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
          t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Any Bash command"
          }, undefined, false, undefined, this);
          $[6] = t1;
        } else {
          t1 = $[6];
        }
        return t1;
      }
    }
    default: {
      if (!ruleValue.ruleContent) {
        let t1;
        if ($[7] !== ruleValue.toolName) {
          t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "Any use of the ",
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: ruleValue.toolName
              }, undefined, false, undefined, this),
              " tool"
            ]
          }, undefined, true, undefined, this);
          $[7] = ruleValue.toolName;
          $[8] = t1;
        } else {
          t1 = $[8];
        }
        return t1;
      } else {
        return null;
      }
    }
  }
}
var import_compiler_runtime, jsx_dev_runtime;
var init_PermissionRuleDescription = __esm(() => {
  init_ink();
  init_BashTool();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/permissions/rules/AddPermissionRules.tsx
function optionForPermissionSaveDestination(saveDestination) {
  switch (saveDestination) {
    case "localSettings":
      return {
        label: "Project settings (local)",
        description: `Saved in ${getRelativeSettingsFilePathForSource("localSettings")}`,
        value: saveDestination
      };
    case "projectSettings":
      return {
        label: "Project settings",
        description: `Checked in at ${getRelativeSettingsFilePathForSource("projectSettings")}`,
        value: saveDestination
      };
    case "userSettings":
      return {
        label: "User settings",
        description: `Saved in at ~/.claude/settings.json`,
        value: saveDestination
      };
  }
}
function AddPermissionRules(t0) {
  const $ = import_compiler_runtime2.c(26);
  const {
    onAddRules,
    onCancel,
    ruleValues,
    ruleBehavior,
    initialContext,
    setToolPermissionContext
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = SOURCES.map(optionForPermissionSaveDestination);
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const allOptions = t1;
  let t2;
  if ($[1] !== initialContext || $[2] !== onAddRules || $[3] !== onCancel || $[4] !== ruleBehavior || $[5] !== ruleValues || $[6] !== setToolPermissionContext) {
    t2 = (selectedValue) => {
      if (selectedValue === "cancel") {
        onCancel();
        return;
      } else {
        if (SOURCES.includes(selectedValue)) {
          const destination = selectedValue;
          const updatedContext = applyPermissionUpdate(initialContext, {
            type: "addRules",
            rules: ruleValues,
            behavior: ruleBehavior,
            destination
          });
          persistPermissionUpdate({
            type: "addRules",
            rules: ruleValues,
            behavior: ruleBehavior,
            destination
          });
          setToolPermissionContext(updatedContext);
          const rules = ruleValues.map((ruleValue) => ({
            ruleValue,
            ruleBehavior,
            source: destination
          }));
          const sandboxAutoAllowEnabled = SandboxManager.isSandboxingEnabled() && SandboxManager.isAutoAllowBashIfSandboxedEnabled();
          const allUnreachable = detectUnreachableRules(updatedContext, {
            sandboxAutoAllowEnabled
          });
          const newUnreachable = allUnreachable.filter((u) => ruleValues.some((rv) => rv.toolName === u.rule.ruleValue.toolName && rv.ruleContent === u.rule.ruleValue.ruleContent));
          onAddRules(rules, newUnreachable.length > 0 ? newUnreachable : undefined);
        }
      }
    };
    $[1] = initialContext;
    $[2] = onAddRules;
    $[3] = onCancel;
    $[4] = ruleBehavior;
    $[5] = ruleValues;
    $[6] = setToolPermissionContext;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  const onSelect = t2;
  let t3;
  if ($[8] !== ruleValues.length) {
    t3 = plural(ruleValues.length, "rule");
    $[8] = ruleValues.length;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  const title = `Add ${ruleBehavior} permission ${t3}`;
  let t4;
  if ($[10] !== ruleValues) {
    t4 = ruleValues.map(_temp);
    $[10] = ruleValues;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  let t5;
  if ($[12] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      paddingX: 2,
      children: t4
    }, undefined, false, undefined, this);
    $[12] = t4;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  const t6 = ruleValues.length === 1 ? "Where should this rule be saved?" : "Where should these rules be saved?";
  let t7;
  if ($[14] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: t6
    }, undefined, false, undefined, this);
    $[14] = t6;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  let t8;
  if ($[16] !== onSelect) {
    t8 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Select, {
      options: allOptions,
      onChange: onSelect
    }, undefined, false, undefined, this);
    $[16] = onSelect;
    $[17] = t8;
  } else {
    t8 = $[17];
  }
  let t9;
  if ($[18] !== t7 || $[19] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginY: 1,
      children: [
        t7,
        t8
      ]
    }, undefined, true, undefined, this);
    $[18] = t7;
    $[19] = t8;
    $[20] = t9;
  } else {
    t9 = $[20];
  }
  let t10;
  if ($[21] !== onCancel || $[22] !== t5 || $[23] !== t9 || $[24] !== title) {
    t10 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
      title,
      onCancel,
      color: "permission",
      children: [
        t5,
        t9
      ]
    }, undefined, true, undefined, this);
    $[21] = onCancel;
    $[22] = t5;
    $[23] = t9;
    $[24] = title;
    $[25] = t10;
  } else {
    t10 = $[25];
  }
  return t10;
}
function _temp(ruleValue_0) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        bold: true,
        children: permissionRuleValueToString(ruleValue_0)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(PermissionRuleDescription, {
        ruleValue: ruleValue_0
      }, undefined, false, undefined, this)
    ]
  }, permissionRuleValueToString(ruleValue_0), true, undefined, this);
}
var import_compiler_runtime2, jsx_dev_runtime2;
var init_AddPermissionRules = __esm(() => {
  init_select();
  init_ink();
  init_PermissionUpdate();
  init_permissionRuleParser();
  init_shadowedRuleDetection();
  init_sandbox_adapter();
  init_constants();
  init_settings();
  init_stringUtils();
  init_Dialog();
  init_PermissionRuleDescription();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/permissions/rules/PermissionRuleInput.tsx
function PermissionRuleInput(t0) {
  const $ = import_compiler_runtime3.c(24);
  const {
    onCancel,
    onSubmit,
    ruleBehavior
  } = t0;
  const [inputValue, setInputValue] = import_react.useState("");
  const [cursorOffset, setCursorOffset] = import_react.useState(0);
  const exitState = useExitOnCtrlCDWithKeybindings();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      context: "Settings"
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  useKeybinding("confirm:no", onCancel, t1);
  const {
    columns
  } = useTerminalSize();
  const textInputColumns = columns - 6;
  let t2;
  if ($[1] !== onSubmit || $[2] !== ruleBehavior) {
    t2 = (value) => {
      const trimmedValue = value.trim();
      if (trimmedValue.length === 0) {
        return;
      }
      const ruleValue = permissionRuleValueFromString(trimmedValue);
      onSubmit(ruleValue, ruleBehavior);
    };
    $[1] = onSubmit;
    $[2] = ruleBehavior;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const handleSubmit = t2;
  let t3;
  if ($[4] !== ruleBehavior) {
    t3 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      bold: true,
      color: "permission",
      children: [
        "Add ",
        ruleBehavior,
        " permission rule"
      ]
    }, undefined, true, undefined, this);
    $[4] = ruleBehavior;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Newline, {}, undefined, false, undefined, this);
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  let t6;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      bold: true,
      children: permissionRuleValueToString({
        toolName: WebFetchTool.name
      })
    }, undefined, false, undefined, this);
    t6 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      bold: false,
      children: " or "
    }, undefined, false, undefined, this);
    $[7] = t5;
    $[8] = t6;
  } else {
    t5 = $[7];
    t6 = $[8];
  }
  let t7;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "Permission rules are a tool name, optionally followed by a specifier in parentheses.",
        t4,
        "e.g.,",
        " ",
        t5,
        t6,
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          bold: true,
          children: permissionRuleValueToString({
            toolName: BashTool.name,
            ruleContent: "ls:*"
          })
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[9] = t7;
  } else {
    t7 = $[9];
  }
  let t8;
  if ($[10] !== cursorOffset || $[11] !== handleSubmit || $[12] !== inputValue || $[13] !== textInputColumns) {
    t8 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t7,
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
          borderDimColor: true,
          borderStyle: "round",
          marginY: 1,
          paddingLeft: 1,
          children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(TextInput, {
            showCursor: true,
            value: inputValue,
            onChange: setInputValue,
            onSubmit: handleSubmit,
            placeholder: `Enter permission rule${figures_default.ellipsis}`,
            columns: textInputColumns,
            cursorOffset,
            onChangeCursorOffset: setCursorOffset
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[10] = cursorOffset;
    $[11] = handleSubmit;
    $[12] = inputValue;
    $[13] = textInputColumns;
    $[14] = t8;
  } else {
    t8 = $[14];
  }
  let t9;
  if ($[15] !== t3 || $[16] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      borderStyle: "round",
      paddingLeft: 1,
      paddingRight: 1,
      borderColor: "permission",
      children: [
        t3,
        t8
      ]
    }, undefined, true, undefined, this);
    $[15] = t3;
    $[16] = t8;
    $[17] = t9;
  } else {
    t9 = $[17];
  }
  let t10;
  if ($[18] !== exitState.keyName || $[19] !== exitState.pending) {
    t10 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      marginLeft: 3,
      children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "Press ",
          exitState.keyName,
          " again to exit"
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: "Enter to submit \xB7 Esc to cancel"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[18] = exitState.keyName;
    $[19] = exitState.pending;
    $[20] = t10;
  } else {
    t10 = $[20];
  }
  let t11;
  if ($[21] !== t10 || $[22] !== t9) {
    t11 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
      children: [
        t9,
        t10
      ]
    }, undefined, true, undefined, this);
    $[21] = t10;
    $[22] = t9;
    $[23] = t11;
  } else {
    t11 = $[23];
  }
  return t11;
}
var import_compiler_runtime3, import_react, jsx_dev_runtime3;
var init_PermissionRuleInput = __esm(() => {
  init_figures();
  init_TextInput();
  init_useExitOnCtrlCDWithKeybindings();
  init_useTerminalSize();
  init_ink();
  init_useKeybinding();
  init_BashTool();
  init_WebFetchTool();
  init_permissionRuleParser();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/permissions/rules/RecentDenialsTab.tsx
function RecentDenialsTab(t0) {
  const $ = import_compiler_runtime4.c(30);
  const {
    onHeaderFocusChange,
    onStateChange
  } = t0;
  const {
    headerFocused,
    focusHeader
  } = useTabHeaderFocus();
  let t1;
  let t2;
  if ($[0] !== headerFocused || $[1] !== onHeaderFocusChange) {
    t1 = () => {
      onHeaderFocusChange?.(headerFocused);
    };
    t2 = [headerFocused, onHeaderFocusChange];
    $[0] = headerFocused;
    $[1] = onHeaderFocusChange;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  import_react2.useEffect(t1, t2);
  const [denials] = import_react2.useState(_temp4);
  const [approved, setApproved] = import_react2.useState(_temp2);
  const [retry, setRetry] = import_react2.useState(_temp3);
  const [focusedIdx, setFocusedIdx] = import_react2.useState(0);
  let t3;
  let t4;
  if ($[4] !== approved || $[5] !== denials || $[6] !== onStateChange || $[7] !== retry) {
    t3 = () => {
      onStateChange({
        approved,
        retry,
        denials
      });
    };
    t4 = [approved, retry, denials, onStateChange];
    $[4] = approved;
    $[5] = denials;
    $[6] = onStateChange;
    $[7] = retry;
    $[8] = t3;
    $[9] = t4;
  } else {
    t3 = $[8];
    t4 = $[9];
  }
  import_react2.useEffect(t3, t4);
  let t5;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = (value) => {
      const idx = Number(value);
      setApproved((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
        return next;
      });
    };
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  const handleSelect = t5;
  let t6;
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = (value_0) => {
      setFocusedIdx(Number(value_0));
    };
    $[11] = t6;
  } else {
    t6 = $[11];
  }
  const handleFocus = t6;
  let t7;
  if ($[12] !== focusedIdx) {
    t7 = (input, _key) => {
      if (input === "r") {
        setRetry((prev_0) => {
          const next_0 = new Set(prev_0);
          if (next_0.has(focusedIdx)) {
            next_0.delete(focusedIdx);
          } else {
            next_0.add(focusedIdx);
          }
          return next_0;
        });
        setApproved((prev_1) => {
          if (prev_1.has(focusedIdx)) {
            return prev_1;
          }
          const next_1 = new Set(prev_1);
          next_1.add(focusedIdx);
          return next_1;
        });
      }
    };
    $[12] = focusedIdx;
    $[13] = t7;
  } else {
    t7 = $[13];
  }
  const t8 = denials.length > 0;
  let t9;
  if ($[14] !== t8) {
    t9 = {
      isActive: t8
    };
    $[14] = t8;
    $[15] = t9;
  } else {
    t9 = $[15];
  }
  use_input_default(t7, t9);
  if (denials.length === 0) {
    let t102;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      t102 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        children: "No recent denials. Commands denied by the auto mode classifier will appear here."
      }, undefined, false, undefined, this);
      $[16] = t102;
    } else {
      t102 = $[16];
    }
    return t102;
  }
  let t10;
  if ($[17] !== approved || $[18] !== denials || $[19] !== retry) {
    let t112;
    if ($[21] !== approved || $[22] !== retry) {
      t112 = (d, idx_0) => {
        const isApproved = approved.has(idx_0);
        const suffix = retry.has(idx_0) ? " (retry)" : "";
        return {
          label: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(StatusIcon, {
                status: isApproved ? "success" : "error",
                withSpace: true
              }, undefined, false, undefined, this),
              d.display,
              /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
                dimColor: true,
                children: suffix
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          value: String(idx_0)
        };
      };
      $[21] = approved;
      $[22] = retry;
      $[23] = t112;
    } else {
      t112 = $[23];
    }
    t10 = denials.map(t112);
    $[17] = approved;
    $[18] = denials;
    $[19] = retry;
    $[20] = t10;
  } else {
    t10 = $[20];
  }
  const options = t10;
  let t11;
  if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
    t11 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: "Commands recently denied by the auto mode classifier."
    }, undefined, false, undefined, this);
    $[24] = t11;
  } else {
    t11 = $[24];
  }
  const t12 = Math.min(10, options.length);
  let t13;
  if ($[25] !== focusHeader || $[26] !== headerFocused || $[27] !== options || $[28] !== t12) {
    t13 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t11,
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Select, {
            options,
            onChange: handleSelect,
            onFocus: handleFocus,
            visibleOptionCount: t12,
            isDisabled: headerFocused,
            onUpFromFirstItem: focusHeader
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[25] = focusHeader;
    $[26] = headerFocused;
    $[27] = options;
    $[28] = t12;
    $[29] = t13;
  } else {
    t13 = $[29];
  }
  return t13;
}
function _temp3() {
  return new Set;
}
function _temp2() {
  return new Set;
}
function _temp4() {
  return getAutoModeDenials();
}
var import_compiler_runtime4, import_react2, jsx_dev_runtime4;
var init_RecentDenialsTab = __esm(() => {
  init_ink();
  init_autoModeDenials();
  init_select();
  init_StatusIcon();
  init_Tabs();
  import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/permissions/rules/RemoveWorkspaceDirectory.tsx
function RemoveWorkspaceDirectory(t0) {
  const $ = import_compiler_runtime5.c(19);
  const {
    directoryPath,
    onRemove,
    onCancel,
    permissionContext,
    setPermissionContext
  } = t0;
  let t1;
  if ($[0] !== directoryPath || $[1] !== onRemove || $[2] !== permissionContext || $[3] !== setPermissionContext) {
    t1 = () => {
      const updatedContext = applyPermissionUpdate(permissionContext, {
        type: "removeDirectories",
        directories: [directoryPath],
        destination: "session"
      });
      setPermissionContext(updatedContext);
      onRemove();
    };
    $[0] = directoryPath;
    $[1] = onRemove;
    $[2] = permissionContext;
    $[3] = setPermissionContext;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const handleRemove = t1;
  let t2;
  if ($[5] !== handleRemove || $[6] !== onCancel) {
    t2 = (value) => {
      if (value === "yes") {
        handleRemove();
      } else {
        onCancel();
      }
    };
    $[5] = handleRemove;
    $[6] = onCancel;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  const handleSelect = t2;
  let t3;
  if ($[8] !== directoryPath) {
    t3 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
      marginX: 2,
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        bold: true,
        children: directoryPath
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[8] = directoryPath;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  let t4;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
      children: "Panda Code will no longer have access to files in this directory."
    }, undefined, false, undefined, this);
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  let t5;
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = [{
      label: "Yes",
      value: "yes"
    }, {
      label: "No",
      value: "no"
    }];
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  let t6;
  if ($[12] !== handleSelect || $[13] !== onCancel) {
    t6 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Select, {
      onChange: handleSelect,
      onCancel,
      options: t5
    }, undefined, false, undefined, this);
    $[12] = handleSelect;
    $[13] = onCancel;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  let t7;
  if ($[15] !== onCancel || $[16] !== t3 || $[17] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Dialog, {
      title: "Remove directory from workspace?",
      onCancel,
      color: "error",
      children: [
        t3,
        t4,
        t6
      ]
    }, undefined, true, undefined, this);
    $[15] = onCancel;
    $[16] = t3;
    $[17] = t6;
    $[18] = t7;
  } else {
    t7 = $[18];
  }
  return t7;
}
var import_compiler_runtime5, jsx_dev_runtime5;
var init_RemoveWorkspaceDirectory = __esm(() => {
  init_select();
  init_ink();
  init_PermissionUpdate();
  init_Dialog();
  import_compiler_runtime5 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/permissions/rules/WorkspaceTab.tsx
function WorkspaceTab(t0) {
  const $ = import_compiler_runtime6.c(23);
  const {
    onExit,
    toolPermissionContext,
    onRequestAddDirectory,
    onRequestRemoveDirectory,
    onHeaderFocusChange
  } = t0;
  const {
    headerFocused,
    focusHeader
  } = useTabHeaderFocus();
  let t1;
  let t2;
  if ($[0] !== headerFocused || $[1] !== onHeaderFocusChange) {
    t1 = () => {
      onHeaderFocusChange?.(headerFocused);
    };
    t2 = [headerFocused, onHeaderFocusChange];
    $[0] = headerFocused;
    $[1] = onHeaderFocusChange;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  import_react3.useEffect(t1, t2);
  let t3;
  if ($[4] !== toolPermissionContext.additionalWorkingDirectories) {
    t3 = Array.from(toolPermissionContext.additionalWorkingDirectories.keys()).map(_temp6);
    $[4] = toolPermissionContext.additionalWorkingDirectories;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const additionalDirectories = t3;
  let t4;
  if ($[6] !== additionalDirectories || $[7] !== onRequestAddDirectory || $[8] !== onRequestRemoveDirectory) {
    t4 = (selectedValue) => {
      if (selectedValue === "add-directory") {
        onRequestAddDirectory();
        return;
      }
      const directory = additionalDirectories.find((d) => d.path === selectedValue);
      if (directory && directory.isDeletable) {
        onRequestRemoveDirectory(directory.path);
      }
    };
    $[6] = additionalDirectories;
    $[7] = onRequestAddDirectory;
    $[8] = onRequestRemoveDirectory;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const handleDirectorySelect = t4;
  let t5;
  if ($[10] !== onExit) {
    t5 = () => onExit("Workspace dialog dismissed", {
      display: "system"
    });
    $[10] = onExit;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  const handleCancel = t5;
  let opts;
  if ($[12] !== additionalDirectories) {
    opts = additionalDirectories.map(_temp22);
    let t62;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      t62 = {
        label: `Add directory${figures_default.ellipsis}`,
        value: "add-directory"
      };
      $[14] = t62;
    } else {
      t62 = $[14];
    }
    opts.push(t62);
    $[12] = additionalDirectories;
    $[13] = opts;
  } else {
    opts = $[13];
  }
  const options = opts;
  let t6;
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
      flexDirection: "row",
      marginTop: 1,
      marginLeft: 2,
      gap: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          children: `-  ${getOriginalCwd()}`
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          dimColor: true,
          children: "(Original working directory)"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  const t7 = Math.min(10, options.length);
  let t8;
  if ($[16] !== focusHeader || $[17] !== handleCancel || $[18] !== handleDirectorySelect || $[19] !== headerFocused || $[20] !== options || $[21] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        t6,
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(Select, {
          options,
          onChange: handleDirectorySelect,
          onCancel: handleCancel,
          visibleOptionCount: t7,
          onUpFromFirstItem: focusHeader,
          isDisabled: headerFocused
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[16] = focusHeader;
    $[17] = handleCancel;
    $[18] = handleDirectorySelect;
    $[19] = headerFocused;
    $[20] = options;
    $[21] = t7;
    $[22] = t8;
  } else {
    t8 = $[22];
  }
  return t8;
}
function _temp22(dir) {
  return {
    label: dir.path,
    value: dir.path
  };
}
function _temp6(path) {
  return {
    path,
    isCurrent: false,
    isDeletable: true
  };
}
var import_compiler_runtime6, import_react3, jsx_dev_runtime6;
var init_WorkspaceTab = __esm(() => {
  init_figures();
  init_state();
  init_select();
  init_ink();
  init_Tabs();
  import_compiler_runtime6 = __toESM(require_compiler_runtime(), 1);
  import_react3 = __toESM(require_react(), 1);
  jsx_dev_runtime6 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/permissions/rules/PermissionRuleList.tsx
function RuleSourceText(t0) {
  const $ = import_compiler_runtime7.c(4);
  const {
    rule
  } = t0;
  let t1;
  if ($[0] !== rule.source) {
    t1 = permissionRuleSourceDisplayString(rule.source);
    $[0] = rule.source;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = `From ${t1}`;
  let t3;
  if ($[2] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      dimColor: true,
      children: t2
    }, undefined, false, undefined, this);
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
}
function getRuleBehaviorLabel(ruleBehavior) {
  switch (ruleBehavior) {
    case "allow":
      return "allowed";
    case "deny":
      return "denied";
    case "ask":
      return "ask";
  }
}
function RuleDetails(t0) {
  const $ = import_compiler_runtime7.c(42);
  const {
    rule,
    onDelete,
    onCancel
  } = t0;
  const exitState = useExitOnCtrlCDWithKeybindings();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      context: "Confirmation"
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  useKeybinding("confirm:no", onCancel, t1);
  let t2;
  if ($[1] !== rule.ruleValue) {
    t2 = permissionRuleValueToString(rule.ruleValue);
    $[1] = rule.ruleValue;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      bold: true,
      children: t2
    }, undefined, false, undefined, this);
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] !== rule.ruleValue) {
    t4 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(PermissionRuleDescription, {
      ruleValue: rule.ruleValue
    }, undefined, false, undefined, this);
    $[5] = rule.ruleValue;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== rule) {
    t5 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(RuleSourceText, {
      rule
    }, undefined, false, undefined, this);
    $[7] = rule;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  let t6;
  if ($[9] !== t3 || $[10] !== t4 || $[11] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginX: 2,
      children: [
        t3,
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[9] = t3;
    $[10] = t4;
    $[11] = t5;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  const ruleDescription = t6;
  let t7;
  if ($[13] !== exitState.keyName || $[14] !== exitState.pending) {
    t7 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      marginLeft: 3,
      children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "Press ",
          exitState.keyName,
          " again to exit"
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
        dimColor: true,
        children: "Esc to cancel"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[13] = exitState.keyName;
    $[14] = exitState.pending;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  const footer = t7;
  if (rule.source === "policySettings") {
    let t82;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      t82 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
        bold: true,
        color: "permission",
        children: "Rule details"
      }, undefined, false, undefined, this);
      $[16] = t82;
    } else {
      t82 = $[16];
    }
    let t92;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
      t92 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
        italic: true,
        children: [
          "This rule is configured by managed settings and cannot be modified.",
          `
`,
          "Contact your system administrator for more information."
        ]
      }, undefined, true, undefined, this);
      $[17] = t92;
    } else {
      t92 = $[17];
    }
    let t102;
    if ($[18] !== ruleDescription) {
      t102 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        borderStyle: "round",
        paddingLeft: 1,
        paddingRight: 1,
        borderColor: "permission",
        children: [
          t82,
          ruleDescription,
          t92
        ]
      }, undefined, true, undefined, this);
      $[18] = ruleDescription;
      $[19] = t102;
    } else {
      t102 = $[19];
    }
    let t112;
    if ($[20] !== footer || $[21] !== t102) {
      t112 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
        children: [
          t102,
          footer
        ]
      }, undefined, true, undefined, this);
      $[20] = footer;
      $[21] = t102;
      $[22] = t112;
    } else {
      t112 = $[22];
    }
    return t112;
  }
  let t8;
  if ($[23] !== rule.ruleBehavior) {
    t8 = getRuleBehaviorLabel(rule.ruleBehavior);
    $[23] = rule.ruleBehavior;
    $[24] = t8;
  } else {
    t8 = $[24];
  }
  let t9;
  if ($[25] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      bold: true,
      color: "error",
      children: [
        "Delete ",
        t8,
        " tool?"
      ]
    }, undefined, true, undefined, this);
    $[25] = t8;
    $[26] = t9;
  } else {
    t9 = $[26];
  }
  let t10;
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      children: "Are you sure you want to delete this permission rule?"
    }, undefined, false, undefined, this);
    $[27] = t10;
  } else {
    t10 = $[27];
  }
  let t11;
  if ($[28] !== onCancel || $[29] !== onDelete) {
    t11 = (_) => _ === "yes" ? onDelete() : onCancel();
    $[28] = onCancel;
    $[29] = onDelete;
    $[30] = t11;
  } else {
    t11 = $[30];
  }
  let t12;
  if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
    t12 = [{
      label: "Yes",
      value: "yes"
    }, {
      label: "No",
      value: "no"
    }];
    $[31] = t12;
  } else {
    t12 = $[31];
  }
  let t13;
  if ($[32] !== onCancel || $[33] !== t11) {
    t13 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Select, {
      onChange: t11,
      onCancel,
      options: t12
    }, undefined, false, undefined, this);
    $[32] = onCancel;
    $[33] = t11;
    $[34] = t13;
  } else {
    t13 = $[34];
  }
  let t14;
  if ($[35] !== ruleDescription || $[36] !== t13 || $[37] !== t9) {
    t14 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      borderStyle: "round",
      paddingLeft: 1,
      paddingRight: 1,
      borderColor: "error",
      children: [
        t9,
        ruleDescription,
        t10,
        t13
      ]
    }, undefined, true, undefined, this);
    $[35] = ruleDescription;
    $[36] = t13;
    $[37] = t9;
    $[38] = t14;
  } else {
    t14 = $[38];
  }
  let t15;
  if ($[39] !== footer || $[40] !== t14) {
    t15 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
      children: [
        t14,
        footer
      ]
    }, undefined, true, undefined, this);
    $[39] = footer;
    $[40] = t14;
    $[41] = t15;
  } else {
    t15 = $[41];
  }
  return t15;
}
function RulesTabContent(props) {
  const $ = import_compiler_runtime7.c(26);
  const {
    options,
    searchQuery,
    isSearchMode,
    isFocused,
    onSelect,
    onCancel,
    lastFocusedRuleKey,
    cursorOffset,
    onHeaderFocusChange
  } = props;
  const tabWidth = useTabsWidth();
  const {
    headerFocused,
    focusHeader,
    blurHeader
  } = useTabHeaderFocus();
  let t0;
  let t1;
  if ($[0] !== blurHeader || $[1] !== headerFocused || $[2] !== isSearchMode) {
    t0 = () => {
      if (isSearchMode && headerFocused) {
        blurHeader();
      }
    };
    t1 = [isSearchMode, headerFocused, blurHeader];
    $[0] = blurHeader;
    $[1] = headerFocused;
    $[2] = isSearchMode;
    $[3] = t0;
    $[4] = t1;
  } else {
    t0 = $[3];
    t1 = $[4];
  }
  import_react4.useEffect(t0, t1);
  let t2;
  let t3;
  if ($[5] !== headerFocused || $[6] !== onHeaderFocusChange) {
    t2 = () => {
      onHeaderFocusChange?.(headerFocused);
    };
    t3 = [headerFocused, onHeaderFocusChange];
    $[5] = headerFocused;
    $[6] = onHeaderFocusChange;
    $[7] = t2;
    $[8] = t3;
  } else {
    t2 = $[7];
    t3 = $[8];
  }
  import_react4.useEffect(t2, t3);
  const t4 = isSearchMode && !headerFocused;
  let t5;
  if ($[9] !== cursorOffset || $[10] !== isFocused || $[11] !== searchQuery || $[12] !== t4 || $[13] !== tabWidth) {
    t5 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      marginBottom: 1,
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(SearchBox, {
        query: searchQuery,
        isFocused: t4,
        isTerminalFocused: isFocused,
        width: tabWidth,
        cursorOffset
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[9] = cursorOffset;
    $[10] = isFocused;
    $[11] = searchQuery;
    $[12] = t4;
    $[13] = tabWidth;
    $[14] = t5;
  } else {
    t5 = $[14];
  }
  const t6 = Math.min(10, options.length);
  const t7 = isSearchMode || headerFocused;
  let t8;
  if ($[15] !== focusHeader || $[16] !== lastFocusedRuleKey || $[17] !== onCancel || $[18] !== onSelect || $[19] !== options || $[20] !== t6 || $[21] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Select, {
      options,
      onChange: onSelect,
      onCancel,
      visibleOptionCount: t6,
      isDisabled: t7,
      defaultFocusValue: lastFocusedRuleKey,
      onUpFromFirstItem: focusHeader
    }, undefined, false, undefined, this);
    $[15] = focusHeader;
    $[16] = lastFocusedRuleKey;
    $[17] = onCancel;
    $[18] = onSelect;
    $[19] = options;
    $[20] = t6;
    $[21] = t7;
    $[22] = t8;
  } else {
    t8 = $[22];
  }
  let t9;
  if ($[23] !== t5 || $[24] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t5,
        t8
      ]
    }, undefined, true, undefined, this);
    $[23] = t5;
    $[24] = t8;
    $[25] = t9;
  } else {
    t9 = $[25];
  }
  return t9;
}
function PermissionRulesTab(t0) {
  const $ = import_compiler_runtime7.c(27);
  let T0;
  let T1;
  let handleToolSelect;
  let rulesProps;
  let t1;
  let t2;
  let t3;
  let t4;
  let tab;
  if ($[0] !== t0) {
    const {
      tab: t52,
      getRulesOptions,
      handleToolSelect: t62,
      ...t72
    } = t0;
    tab = t52;
    handleToolSelect = t62;
    rulesProps = t72;
    T1 = ThemedBox_default;
    t2 = "column";
    t3 = tab === "allow" ? 0 : undefined;
    let t8;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
      t8 = {
        allow: "Panda Code won't ask before using allowed tools.",
        ask: "Panda Code will always ask for confirmation before using these tools.",
        deny: "Panda Code will always reject requests to use denied tools."
      };
      $[10] = t8;
    } else {
      t8 = $[10];
    }
    const t9 = t8[tab];
    if ($[11] !== t9) {
      t4 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
        children: t9
      }, undefined, false, undefined, this);
      $[11] = t9;
      $[12] = t4;
    } else {
      t4 = $[12];
    }
    T0 = RulesTabContent;
    t1 = getRulesOptions(tab, rulesProps.searchQuery);
    $[0] = t0;
    $[1] = T0;
    $[2] = T1;
    $[3] = handleToolSelect;
    $[4] = rulesProps;
    $[5] = t1;
    $[6] = t2;
    $[7] = t3;
    $[8] = t4;
    $[9] = tab;
  } else {
    T0 = $[1];
    T1 = $[2];
    handleToolSelect = $[3];
    rulesProps = $[4];
    t1 = $[5];
    t2 = $[6];
    t3 = $[7];
    t4 = $[8];
    tab = $[9];
  }
  let t5;
  if ($[13] !== handleToolSelect || $[14] !== tab) {
    t5 = (v) => handleToolSelect(v, tab);
    $[13] = handleToolSelect;
    $[14] = tab;
    $[15] = t5;
  } else {
    t5 = $[15];
  }
  let t6;
  if ($[16] !== T0 || $[17] !== rulesProps || $[18] !== t1.options || $[19] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(T0, {
      options: t1.options,
      onSelect: t5,
      ...rulesProps
    }, undefined, false, undefined, this);
    $[16] = T0;
    $[17] = rulesProps;
    $[18] = t1.options;
    $[19] = t5;
    $[20] = t6;
  } else {
    t6 = $[20];
  }
  let t7;
  if ($[21] !== T1 || $[22] !== t2 || $[23] !== t3 || $[24] !== t4 || $[25] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(T1, {
      flexDirection: t2,
      flexShrink: t3,
      children: [
        t4,
        t6
      ]
    }, undefined, true, undefined, this);
    $[21] = T1;
    $[22] = t2;
    $[23] = t3;
    $[24] = t4;
    $[25] = t6;
    $[26] = t7;
  } else {
    t7 = $[26];
  }
  return t7;
}
function PermissionRuleList(t0) {
  const $ = import_compiler_runtime7.c(113);
  const {
    onExit,
    initialTab,
    onRetryDenials
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getAutoModeDenials();
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const hasDenials = t1.length > 0;
  const defaultTab = initialTab ?? (hasDenials ? "recent" : "allow");
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const [changes, setChanges] = import_react4.useState(t2);
  const toolPermissionContext = useAppState(_temp7);
  const setAppState = useSetAppState();
  const isTerminalFocused = useTerminalFocus();
  let t3;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = {
      approved: new Set,
      retry: new Set,
      denials: []
    };
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const denialStateRef = import_react4.useRef(t3);
  let t4;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = (s_0) => {
      denialStateRef.current = s_0;
    };
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  const handleDenialStateChange = t4;
  const [selectedRule, setSelectedRule] = import_react4.useState();
  const [lastFocusedRuleKey, setLastFocusedRuleKey] = import_react4.useState();
  const [addingRuleToTab, setAddingRuleToTab] = import_react4.useState(null);
  const [validatedRule, setValidatedRule] = import_react4.useState(null);
  const [isAddingWorkspaceDirectory, setIsAddingWorkspaceDirectory] = import_react4.useState(false);
  const [removingDirectory, setRemovingDirectory] = import_react4.useState(null);
  const [isSearchMode, setIsSearchMode] = import_react4.useState(false);
  const [headerFocused, setHeaderFocused] = import_react4.useState(true);
  let t5;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = (focused) => {
      setHeaderFocused(focused);
    };
    $[4] = t5;
  } else {
    t5 = $[4];
  }
  const handleHeaderFocusChange = t5;
  let map;
  if ($[5] !== toolPermissionContext) {
    map = new Map;
    getAllowRules(toolPermissionContext).forEach((rule) => {
      map.set(jsonStringify(rule), rule);
    });
    $[5] = toolPermissionContext;
    $[6] = map;
  } else {
    map = $[6];
  }
  const allowRulesByKey = map;
  let map_0;
  if ($[7] !== toolPermissionContext) {
    map_0 = new Map;
    getDenyRules(toolPermissionContext).forEach((rule_0) => {
      map_0.set(jsonStringify(rule_0), rule_0);
    });
    $[7] = toolPermissionContext;
    $[8] = map_0;
  } else {
    map_0 = $[8];
  }
  const denyRulesByKey = map_0;
  let map_1;
  if ($[9] !== toolPermissionContext) {
    map_1 = new Map;
    getAskRules(toolPermissionContext).forEach((rule_1) => {
      map_1.set(jsonStringify(rule_1), rule_1);
    });
    $[9] = toolPermissionContext;
    $[10] = map_1;
  } else {
    map_1 = $[10];
  }
  const askRulesByKey = map_1;
  let t6;
  if ($[11] !== allowRulesByKey || $[12] !== askRulesByKey || $[13] !== denyRulesByKey) {
    t6 = (tab, t72) => {
      const query = t72 === undefined ? "" : t72;
      const rulesByKey = (() => {
        switch (tab) {
          case "allow": {
            return allowRulesByKey;
          }
          case "deny": {
            return denyRulesByKey;
          }
          case "ask": {
            return askRulesByKey;
          }
          case "workspace":
          case "recent": {
            return new Map;
          }
        }
      })();
      const options = [];
      if (tab !== "workspace" && tab !== "recent" && !query) {
        options.push({
          label: `Add a new rule${figures_default.ellipsis}`,
          value: "add-new-rule"
        });
      }
      const sortedRuleKeys = Array.from(rulesByKey.keys()).sort((a, b) => {
        const ruleA = rulesByKey.get(a);
        const ruleB = rulesByKey.get(b);
        if (ruleA && ruleB) {
          const ruleAString = permissionRuleValueToString(ruleA.ruleValue).toLowerCase();
          const ruleBString = permissionRuleValueToString(ruleB.ruleValue).toLowerCase();
          return ruleAString.localeCompare(ruleBString);
        }
        return 0;
      });
      const lowerQuery = query.toLowerCase();
      for (const ruleKey of sortedRuleKeys) {
        const rule_2 = rulesByKey.get(ruleKey);
        if (rule_2) {
          const ruleString = permissionRuleValueToString(rule_2.ruleValue);
          if (query && !ruleString.toLowerCase().includes(lowerQuery)) {
            continue;
          }
          options.push({
            label: ruleString,
            value: ruleKey
          });
        }
      }
      return {
        options,
        rulesByKey
      };
    };
    $[11] = allowRulesByKey;
    $[12] = askRulesByKey;
    $[13] = denyRulesByKey;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  const getRulesOptions = t6;
  const exitState = useExitOnCtrlCDWithKeybindings();
  const isSearchModeActive = !selectedRule && !addingRuleToTab && !validatedRule && !isAddingWorkspaceDirectory && !removingDirectory;
  const t7 = isSearchModeActive && isSearchMode;
  let t8;
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = () => {
      setIsSearchMode(false);
    };
    $[15] = t8;
  } else {
    t8 = $[15];
  }
  let t9;
  if ($[16] !== t7) {
    t9 = {
      isActive: t7,
      onExit: t8
    };
    $[16] = t7;
    $[17] = t9;
  } else {
    t9 = $[17];
  }
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    cursorOffset: searchCursorOffset
  } = useSearchInput(t9);
  let t10;
  if ($[18] !== isSearchMode || $[19] !== isSearchModeActive || $[20] !== setSearchQuery) {
    t10 = (e) => {
      if (!isSearchModeActive) {
        return;
      }
      if (isSearchMode) {
        return;
      }
      if (e.ctrl || e.meta) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setIsSearchMode(true);
        setSearchQuery("");
      } else {
        if (e.key.length === 1 && e.key !== "j" && e.key !== "k" && e.key !== "m" && e.key !== "i" && e.key !== "r" && e.key !== " ") {
          e.preventDefault();
          setIsSearchMode(true);
          setSearchQuery(e.key);
        }
      }
    };
    $[18] = isSearchMode;
    $[19] = isSearchModeActive;
    $[20] = setSearchQuery;
    $[21] = t10;
  } else {
    t10 = $[21];
  }
  const handleKeyDown = t10;
  let t11;
  if ($[22] !== getRulesOptions) {
    t11 = (selectedValue, tab_0) => {
      const {
        rulesByKey: rulesByKey_0
      } = getRulesOptions(tab_0);
      if (selectedValue === "add-new-rule") {
        setAddingRuleToTab(tab_0);
        return;
      } else {
        setSelectedRule(rulesByKey_0.get(selectedValue));
        return;
      }
    };
    $[22] = getRulesOptions;
    $[23] = t11;
  } else {
    t11 = $[23];
  }
  const handleToolSelect = t11;
  let t12;
  if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
    t12 = () => {
      setAddingRuleToTab(null);
    };
    $[24] = t12;
  } else {
    t12 = $[24];
  }
  const handleRuleInputCancel = t12;
  let t13;
  if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
    t13 = (ruleValue, ruleBehavior) => {
      setValidatedRule({
        ruleValue,
        ruleBehavior
      });
      setAddingRuleToTab(null);
    };
    $[25] = t13;
  } else {
    t13 = $[25];
  }
  const handleRuleInputSubmit = t13;
  let t14;
  if ($[26] === Symbol.for("react.memo_cache_sentinel")) {
    t14 = (rules, unreachable) => {
      setValidatedRule(null);
      for (const rule_3 of rules) {
        setChanges((prev) => [...prev, `Added ${rule_3.ruleBehavior} rule ${source_default.bold(permissionRuleValueToString(rule_3.ruleValue))}`]);
      }
      if (unreachable && unreachable.length > 0) {
        for (const u of unreachable) {
          const severity = u.shadowType === "deny" ? "blocked" : "shadowed";
          setChanges((prev_0) => [...prev_0, source_default.yellow(`${figures_default.warning} Warning: ${permissionRuleValueToString(u.rule.ruleValue)} is ${severity}`), source_default.dim(`  ${u.reason}`), source_default.dim(`  Fix: ${u.fix}`)]);
        }
      }
    };
    $[26] = t14;
  } else {
    t14 = $[26];
  }
  const handleAddRulesSuccess = t14;
  let t15;
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    t15 = () => {
      setValidatedRule(null);
    };
    $[27] = t15;
  } else {
    t15 = $[27];
  }
  const handleAddRuleCancel = t15;
  let t16;
  if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
    t16 = () => setIsAddingWorkspaceDirectory(true);
    $[28] = t16;
  } else {
    t16 = $[28];
  }
  const handleRequestAddDirectory = t16;
  let t17;
  if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
    t17 = (path) => setRemovingDirectory(path);
    $[29] = t17;
  } else {
    t17 = $[29];
  }
  const handleRequestRemoveDirectory = t17;
  let t18;
  if ($[30] !== changes || $[31] !== onExit || $[32] !== onRetryDenials) {
    t18 = () => {
      const s_1 = denialStateRef.current;
      const denialsFor = (set) => Array.from(set).map((idx) => s_1.denials[idx]).filter(_temp23);
      const retryDenials = denialsFor(s_1.retry);
      if (retryDenials.length > 0) {
        const commands = retryDenials.map(_temp32);
        onRetryDenials?.(commands);
        onExit(undefined, {
          shouldQuery: true,
          metaMessages: [`Permission granted for: ${commands.join(", ")}. You may now retry ${commands.length === 1 ? "this command" : "these commands"} if you would like.`]
        });
        return;
      }
      const approvedDenials = denialsFor(s_1.approved);
      if (approvedDenials.length > 0 || changes.length > 0) {
        const approvedMsg = approvedDenials.length > 0 ? [`Approved ${approvedDenials.map(_temp42).join(", ")}`] : [];
        onExit([...approvedMsg, ...changes].join(`
`));
      } else {
        onExit("Permissions dialog dismissed", {
          display: "system"
        });
      }
    };
    $[30] = changes;
    $[31] = onExit;
    $[32] = onRetryDenials;
    $[33] = t18;
  } else {
    t18 = $[33];
  }
  const handleRulesCancel = t18;
  const t19 = isSearchModeActive && !isSearchMode;
  let t20;
  if ($[34] !== t19) {
    t20 = {
      context: "Settings",
      isActive: t19
    };
    $[34] = t19;
    $[35] = t20;
  } else {
    t20 = $[35];
  }
  useKeybinding("confirm:no", handleRulesCancel, t20);
  let t21;
  if ($[36] !== getRulesOptions || $[37] !== selectedRule || $[38] !== setAppState || $[39] !== toolPermissionContext) {
    t21 = () => {
      if (!selectedRule) {
        return;
      }
      const {
        options: options_0
      } = getRulesOptions(selectedRule.ruleBehavior);
      const selectedKey = jsonStringify(selectedRule);
      const ruleKeys = options_0.filter(_temp5).map(_temp62);
      const currentIndex = ruleKeys.indexOf(selectedKey);
      let nextFocusKey;
      if (currentIndex !== -1) {
        if (currentIndex < ruleKeys.length - 1) {
          nextFocusKey = ruleKeys[currentIndex + 1];
        } else {
          if (currentIndex > 0) {
            nextFocusKey = ruleKeys[currentIndex - 1];
          }
        }
      }
      setLastFocusedRuleKey(nextFocusKey);
      deletePermissionRule({
        rule: selectedRule,
        initialContext: toolPermissionContext,
        setToolPermissionContext(toolPermissionContext_0) {
          setAppState((prev_1) => ({
            ...prev_1,
            toolPermissionContext: toolPermissionContext_0
          }));
        }
      });
      setChanges((prev_2) => [...prev_2, `Deleted ${selectedRule.ruleBehavior} rule ${source_default.bold(permissionRuleValueToString(selectedRule.ruleValue))}`]);
      setSelectedRule(undefined);
    };
    $[36] = getRulesOptions;
    $[37] = selectedRule;
    $[38] = setAppState;
    $[39] = toolPermissionContext;
    $[40] = t21;
  } else {
    t21 = $[40];
  }
  const handleDeleteRule = t21;
  if (selectedRule) {
    let t222;
    if ($[41] === Symbol.for("react.memo_cache_sentinel")) {
      t222 = () => setSelectedRule(undefined);
      $[41] = t222;
    } else {
      t222 = $[41];
    }
    let t232;
    if ($[42] !== handleDeleteRule || $[43] !== selectedRule) {
      t232 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(RuleDetails, {
        rule: selectedRule,
        onDelete: handleDeleteRule,
        onCancel: t222
      }, undefined, false, undefined, this);
      $[42] = handleDeleteRule;
      $[43] = selectedRule;
      $[44] = t232;
    } else {
      t232 = $[44];
    }
    return t232;
  }
  if (addingRuleToTab && addingRuleToTab !== "workspace" && addingRuleToTab !== "recent") {
    let t222;
    if ($[45] !== addingRuleToTab) {
      t222 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(PermissionRuleInput, {
        onCancel: handleRuleInputCancel,
        onSubmit: handleRuleInputSubmit,
        ruleBehavior: addingRuleToTab
      }, undefined, false, undefined, this);
      $[45] = addingRuleToTab;
      $[46] = t222;
    } else {
      t222 = $[46];
    }
    return t222;
  }
  if (validatedRule) {
    let t222;
    if ($[47] !== validatedRule.ruleValue) {
      t222 = [validatedRule.ruleValue];
      $[47] = validatedRule.ruleValue;
      $[48] = t222;
    } else {
      t222 = $[48];
    }
    let t232;
    if ($[49] !== setAppState) {
      t232 = (toolPermissionContext_1) => {
        setAppState((prev_3) => ({
          ...prev_3,
          toolPermissionContext: toolPermissionContext_1
        }));
      };
      $[49] = setAppState;
      $[50] = t232;
    } else {
      t232 = $[50];
    }
    let t242;
    if ($[51] !== t222 || $[52] !== t232 || $[53] !== toolPermissionContext || $[54] !== validatedRule.ruleBehavior) {
      t242 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(AddPermissionRules, {
        onAddRules: handleAddRulesSuccess,
        onCancel: handleAddRuleCancel,
        ruleValues: t222,
        ruleBehavior: validatedRule.ruleBehavior,
        initialContext: toolPermissionContext,
        setToolPermissionContext: t232
      }, undefined, false, undefined, this);
      $[51] = t222;
      $[52] = t232;
      $[53] = toolPermissionContext;
      $[54] = validatedRule.ruleBehavior;
      $[55] = t242;
    } else {
      t242 = $[55];
    }
    return t242;
  }
  if (isAddingWorkspaceDirectory) {
    let t222;
    if ($[56] !== setAppState || $[57] !== toolPermissionContext) {
      t222 = (path_0, remember) => {
        const destination = remember ? "localSettings" : "session";
        const permissionUpdate = {
          type: "addDirectories",
          directories: [path_0],
          destination
        };
        const updatedContext = applyPermissionUpdate(toolPermissionContext, permissionUpdate);
        setAppState((prev_4) => ({
          ...prev_4,
          toolPermissionContext: updatedContext
        }));
        if (remember) {
          persistPermissionUpdate(permissionUpdate);
        }
        setChanges((prev_5) => [...prev_5, `Added directory ${source_default.bold(path_0)} to workspace${remember ? " and saved to local settings" : " for this session"}`]);
        setIsAddingWorkspaceDirectory(false);
      };
      $[56] = setAppState;
      $[57] = toolPermissionContext;
      $[58] = t222;
    } else {
      t222 = $[58];
    }
    let t232;
    if ($[59] === Symbol.for("react.memo_cache_sentinel")) {
      t232 = () => setIsAddingWorkspaceDirectory(false);
      $[59] = t232;
    } else {
      t232 = $[59];
    }
    let t242;
    if ($[60] !== t222 || $[61] !== toolPermissionContext) {
      t242 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(AddWorkspaceDirectory, {
        onAddDirectory: t222,
        onCancel: t232,
        permissionContext: toolPermissionContext
      }, undefined, false, undefined, this);
      $[60] = t222;
      $[61] = toolPermissionContext;
      $[62] = t242;
    } else {
      t242 = $[62];
    }
    return t242;
  }
  if (removingDirectory) {
    let t222;
    if ($[63] !== removingDirectory) {
      t222 = () => {
        setChanges((prev_6) => [...prev_6, `Removed directory ${source_default.bold(removingDirectory)} from workspace`]);
        setRemovingDirectory(null);
      };
      $[63] = removingDirectory;
      $[64] = t222;
    } else {
      t222 = $[64];
    }
    let t232;
    if ($[65] === Symbol.for("react.memo_cache_sentinel")) {
      t232 = () => setRemovingDirectory(null);
      $[65] = t232;
    } else {
      t232 = $[65];
    }
    let t242;
    if ($[66] !== setAppState) {
      t242 = (toolPermissionContext_2) => {
        setAppState((prev_7) => ({
          ...prev_7,
          toolPermissionContext: toolPermissionContext_2
        }));
      };
      $[66] = setAppState;
      $[67] = t242;
    } else {
      t242 = $[67];
    }
    let t252;
    if ($[68] !== removingDirectory || $[69] !== t222 || $[70] !== t242 || $[71] !== toolPermissionContext) {
      t252 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(RemoveWorkspaceDirectory, {
        directoryPath: removingDirectory,
        onRemove: t222,
        onCancel: t232,
        permissionContext: toolPermissionContext,
        setPermissionContext: t242
      }, undefined, false, undefined, this);
      $[68] = removingDirectory;
      $[69] = t222;
      $[70] = t242;
      $[71] = toolPermissionContext;
      $[72] = t252;
    } else {
      t252 = $[72];
    }
    return t252;
  }
  let t22;
  if ($[73] !== getRulesOptions || $[74] !== handleRulesCancel || $[75] !== handleToolSelect || $[76] !== isSearchMode || $[77] !== isTerminalFocused || $[78] !== lastFocusedRuleKey || $[79] !== searchCursorOffset || $[80] !== searchQuery) {
    t22 = {
      searchQuery,
      isSearchMode,
      isFocused: isTerminalFocused,
      onCancel: handleRulesCancel,
      lastFocusedRuleKey,
      cursorOffset: searchCursorOffset,
      getRulesOptions,
      handleToolSelect,
      onHeaderFocusChange: handleHeaderFocusChange
    };
    $[73] = getRulesOptions;
    $[74] = handleRulesCancel;
    $[75] = handleToolSelect;
    $[76] = isSearchMode;
    $[77] = isTerminalFocused;
    $[78] = lastFocusedRuleKey;
    $[79] = searchCursorOffset;
    $[80] = searchQuery;
    $[81] = t22;
  } else {
    t22 = $[81];
  }
  const sharedRulesProps = t22;
  const isHidden = !!selectedRule || !!addingRuleToTab || !!validatedRule || isAddingWorkspaceDirectory || !!removingDirectory;
  const t23 = !isSearchMode;
  let t24;
  if ($[82] === Symbol.for("react.memo_cache_sentinel")) {
    t24 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tab, {
      id: "recent",
      title: "Recently denied",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(RecentDenialsTab, {
        onHeaderFocusChange: handleHeaderFocusChange,
        onStateChange: handleDenialStateChange
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[82] = t24;
  } else {
    t24 = $[82];
  }
  let t25;
  if ($[83] !== sharedRulesProps) {
    t25 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tab, {
      id: "allow",
      title: "Allow",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(PermissionRulesTab, {
        tab: "allow",
        ...sharedRulesProps
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[83] = sharedRulesProps;
    $[84] = t25;
  } else {
    t25 = $[84];
  }
  let t26;
  if ($[85] !== sharedRulesProps) {
    t26 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tab, {
      id: "ask",
      title: "Ask",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(PermissionRulesTab, {
        tab: "ask",
        ...sharedRulesProps
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[85] = sharedRulesProps;
    $[86] = t26;
  } else {
    t26 = $[86];
  }
  let t27;
  if ($[87] !== sharedRulesProps) {
    t27 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tab, {
      id: "deny",
      title: "Deny",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(PermissionRulesTab, {
        tab: "deny",
        ...sharedRulesProps
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[87] = sharedRulesProps;
    $[88] = t27;
  } else {
    t27 = $[88];
  }
  let t28;
  if ($[89] === Symbol.for("react.memo_cache_sentinel")) {
    t28 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      children: "Panda Code can read files in the workspace, and make edits when auto-accept edits is on."
    }, undefined, false, undefined, this);
    $[89] = t28;
  } else {
    t28 = $[89];
  }
  let t29;
  if ($[90] !== onExit || $[91] !== toolPermissionContext) {
    t29 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tab, {
      id: "workspace",
      title: "Workspace",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t28,
          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(WorkspaceTab, {
            onExit,
            toolPermissionContext,
            onRequestAddDirectory: handleRequestAddDirectory,
            onRequestRemoveDirectory: handleRequestRemoveDirectory,
            onHeaderFocusChange: handleHeaderFocusChange
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[90] = onExit;
    $[91] = toolPermissionContext;
    $[92] = t29;
  } else {
    t29 = $[92];
  }
  let t30;
  if ($[93] !== defaultTab || $[94] !== isHidden || $[95] !== t23 || $[96] !== t25 || $[97] !== t26 || $[98] !== t27 || $[99] !== t29) {
    t30 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tabs, {
      title: "Permissions:",
      color: "permission",
      defaultTab,
      hidden: isHidden,
      initialHeaderFocused: !hasDenials,
      navFromContent: t23,
      children: [
        t24,
        t25,
        t26,
        t27,
        t29
      ]
    }, undefined, true, undefined, this);
    $[93] = defaultTab;
    $[94] = isHidden;
    $[95] = t23;
    $[96] = t25;
    $[97] = t26;
    $[98] = t27;
    $[99] = t29;
    $[100] = t30;
  } else {
    t30 = $[100];
  }
  let t31;
  if ($[101] !== defaultTab || $[102] !== exitState.keyName || $[103] !== exitState.pending || $[104] !== headerFocused || $[105] !== isSearchMode) {
    t31 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      paddingLeft: 1,
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
        dimColor: true,
        children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: [
            "Press ",
            exitState.keyName,
            " again to exit"
          ]
        }, undefined, true, undefined, this) : headerFocused ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: "\u2190/\u2192 tab switch \xB7 \u2193 return \xB7 Esc cancel"
        }, undefined, false, undefined, this) : isSearchMode ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: "Type to filter \xB7 Enter/\u2193 select \xB7 \u2191 tabs \xB7 Esc clear"
        }, undefined, false, undefined, this) : hasDenials && defaultTab === "recent" ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: "Enter approve \xB7 r retry \xB7 \u2191\u2193 navigate \xB7 \u2190/\u2192 switch \xB7 Esc cancel"
        }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: "\u2191\u2193 navigate \xB7 Enter select \xB7 Type to search \xB7 \u2190/\u2192 switch \xB7 Esc cancel"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[101] = defaultTab;
    $[102] = exitState.keyName;
    $[103] = exitState.pending;
    $[104] = headerFocused;
    $[105] = isSearchMode;
    $[106] = t31;
  } else {
    t31 = $[106];
  }
  let t32;
  if ($[107] !== t30 || $[108] !== t31) {
    t32 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Pane, {
      color: "permission",
      children: [
        t30,
        t31
      ]
    }, undefined, true, undefined, this);
    $[107] = t30;
    $[108] = t31;
    $[109] = t32;
  } else {
    t32 = $[109];
  }
  let t33;
  if ($[110] !== handleKeyDown || $[111] !== t32) {
    t33 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      onKeyDown: handleKeyDown,
      children: t32
    }, undefined, false, undefined, this);
    $[110] = handleKeyDown;
    $[111] = t32;
    $[112] = t33;
  } else {
    t33 = $[112];
  }
  return t33;
}
function _temp62(opt_0) {
  return opt_0.value;
}
function _temp5(opt) {
  return opt.value !== "add-new-rule";
}
function _temp42(d_1) {
  return source_default.bold(d_1.display);
}
function _temp32(d_0) {
  return d_0.display;
}
function _temp23(d) {
  return d !== undefined;
}
function _temp7(s) {
  return s.toolPermissionContext;
}
var import_compiler_runtime7, import_react4, jsx_dev_runtime7;
var init_PermissionRuleList = __esm(() => {
  init_source();
  init_figures();
  init_AppState();
  init_PermissionUpdate();
  init_select();
  init_useExitOnCtrlCDWithKeybindings();
  init_useSearchInput();
  init_ink();
  init_useKeybinding();
  init_autoModeDenials();
  init_permissionRuleParser();
  init_permissions();
  init_slowOperations();
  init_Pane();
  init_Tabs();
  init_SearchBox();
  init_AddPermissionRules();
  init_AddWorkspaceDirectory();
  init_PermissionRuleDescription();
  init_PermissionRuleInput();
  init_RecentDenialsTab();
  init_RemoveWorkspaceDirectory();
  init_WorkspaceTab();
  import_compiler_runtime7 = __toESM(require_compiler_runtime(), 1);
  import_react4 = __toESM(require_react(), 1);
  jsx_dev_runtime7 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/permissions/permissions.tsx
var jsx_dev_runtime8, call = async (onDone, context) => {
  return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(PermissionRuleList, {
    onExit: onDone,
    onRetryDenials: (commands) => {
      context.setMessages((prev) => [...prev, createPermissionRetryMessage(commands)]);
    }
  }, undefined, false, undefined, this);
};
var init_permissions2 = __esm(() => {
  init_PermissionRuleList();
  init_messages();
  jsx_dev_runtime8 = __toESM(require_jsx_dev_runtime(), 1);
});
init_permissions2();

export {
  call
};
