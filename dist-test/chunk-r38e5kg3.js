// @bun
import {
  Select,
  capitalize_default,
  convertEffortValueToLevel,
  getDefaultEffortForModel,
  getDisplayedEffortLevel,
  getModelOptions,
  init_AppState,
  init_CustomSelect,
  init_capitalize,
  init_effort,
  init_modelOptions,
  modelSupportsEffort,
  modelSupportsMaxEffort,
  resolvePickerEffortPersistence,
  toPersistableEffort,
  useAppState,
  useSetAppState
} from "./chunk-wk0emb79.js";
import {
  Byline,
  ConfigurableShortcutHint,
  KeyboardShortcutHint,
  init_Byline,
  init_ConfigurableShortcutHint,
  init_KeyboardShortcutHint
} from "./chunk-px2n7q1y.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-gywzh15r.js";
import {
  Pane,
  init_Pane,
  init_useKeybinding,
  useKeybindings
} from "./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  EFFORT_HIGH,
  EFFORT_LOW,
  EFFORT_MAX,
  EFFORT_MEDIUM,
  FAST_MODE_MODEL_DISPLAY,
  getDefaultMainLoopModel,
  getSettingsForSource,
  has1mContext,
  init_auth,
  init_context,
  init_fastMode,
  init_figures,
  init_model,
  init_settings1 as init_settings,
  isClaudeAISubscriber,
  isFastModeAvailable,
  isFastModeCooldown,
  isFastModeEnabled,
  modelDisplayString,
  parseUserSpecifiedModel,
  updateSettingsForSource
} from "./chunk-bt6e264h.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/EffortIndicator.ts
function getEffortNotificationText(effortValue, model) {
  if (!modelSupportsEffort(model))
    return;
  const level = getDisplayedEffortLevel(model, effortValue);
  return `${effortLevelToSymbol(level)} ${level} \xB7 /effort`;
}
function effortLevelToSymbol(level) {
  switch (level) {
    case "low":
      return EFFORT_LOW;
    case "medium":
      return EFFORT_MEDIUM;
    case "high":
      return EFFORT_HIGH;
    case "max":
      return EFFORT_MAX;
    default:
      return EFFORT_HIGH;
  }
}
var init_EffortIndicator = __esm(() => {
  init_figures();
  init_effort();
});

// src/components/ModelPicker.tsx
function ModelPicker(t0) {
  const $ = import_compiler_runtime.c(82);
  const {
    initial,
    sessionModel,
    onSelect,
    onCancel,
    isStandaloneCommand,
    showFastModeNotice,
    headerText,
    skipSettingsWrite
  } = t0;
  const setAppState = useSetAppState();
  const exitState = useExitOnCtrlCDWithKeybindings();
  const initialValue = initial === null ? NO_PREFERENCE : initial;
  const [focusedValue, setFocusedValue] = import_react.useState(initialValue);
  const isFastMode = useAppState(_temp);
  const [hasToggledEffort, setHasToggledEffort] = import_react.useState(false);
  const effortValue = useAppState(_temp2);
  let t1;
  if ($[0] !== effortValue) {
    t1 = effortValue !== undefined ? convertEffortValueToLevel(effortValue) : undefined;
    $[0] = effortValue;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [effort, setEffort] = import_react.useState(t1);
  const t2 = isFastMode ?? false;
  let t3;
  if ($[2] !== t2) {
    t3 = getModelOptions(t2);
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const modelOptions = t3;
  let t4;
  bb0: {
    if (initial !== null && !modelOptions.some((opt) => opt.value === initial)) {
      let t52;
      if ($[4] !== initial) {
        t52 = modelDisplayString(initial);
        $[4] = initial;
        $[5] = t52;
      } else {
        t52 = $[5];
      }
      let t62;
      if ($[6] !== initial || $[7] !== t52) {
        t62 = {
          value: initial,
          label: t52,
          description: "Current model"
        };
        $[6] = initial;
        $[7] = t52;
        $[8] = t62;
      } else {
        t62 = $[8];
      }
      let t72;
      if ($[9] !== modelOptions || $[10] !== t62) {
        t72 = [...modelOptions, t62];
        $[9] = modelOptions;
        $[10] = t62;
        $[11] = t72;
      } else {
        t72 = $[11];
      }
      t4 = t72;
      break bb0;
    }
    t4 = modelOptions;
  }
  const optionsWithInitial = t4;
  let t5;
  if ($[12] !== optionsWithInitial) {
    t5 = optionsWithInitial.map(_temp3);
    $[12] = optionsWithInitial;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  const selectOptions = t5;
  let t6;
  if ($[14] !== initialValue || $[15] !== selectOptions) {
    t6 = selectOptions.some((_) => _.value === initialValue) ? initialValue : selectOptions[0]?.value ?? undefined;
    $[14] = initialValue;
    $[15] = selectOptions;
    $[16] = t6;
  } else {
    t6 = $[16];
  }
  const initialFocusValue = t6;
  const visibleCount = Math.min(10, selectOptions.length);
  const hiddenCount = Math.max(0, selectOptions.length - visibleCount);
  let t7;
  if ($[17] !== focusedValue || $[18] !== selectOptions) {
    t7 = selectOptions.find((opt_1) => opt_1.value === focusedValue)?.label;
    $[17] = focusedValue;
    $[18] = selectOptions;
    $[19] = t7;
  } else {
    t7 = $[19];
  }
  const focusedModelName = t7;
  let focusedSupportsEffort;
  let t8;
  if ($[20] !== focusedValue) {
    const focusedModel = resolveOptionModel(focusedValue);
    focusedSupportsEffort = focusedModel ? modelSupportsEffort(focusedModel) : false;
    t8 = focusedModel ? modelSupportsMaxEffort(focusedModel) : false;
    $[20] = focusedValue;
    $[21] = focusedSupportsEffort;
    $[22] = t8;
  } else {
    focusedSupportsEffort = $[21];
    t8 = $[22];
  }
  const focusedSupportsMax = t8;
  let t9;
  if ($[23] !== focusedValue) {
    t9 = getDefaultEffortLevelForOption(focusedValue);
    $[23] = focusedValue;
    $[24] = t9;
  } else {
    t9 = $[24];
  }
  const focusedDefaultEffort = t9;
  const displayEffort = effort === "max" && !focusedSupportsMax ? "high" : effort;
  let t10;
  if ($[25] !== effortValue || $[26] !== hasToggledEffort) {
    t10 = (value) => {
      setFocusedValue(value);
      if (!hasToggledEffort && effortValue === undefined) {
        setEffort(getDefaultEffortLevelForOption(value));
      }
    };
    $[25] = effortValue;
    $[26] = hasToggledEffort;
    $[27] = t10;
  } else {
    t10 = $[27];
  }
  const handleFocus = t10;
  let t11;
  if ($[28] !== focusedDefaultEffort || $[29] !== focusedSupportsEffort || $[30] !== focusedSupportsMax) {
    t11 = (direction) => {
      if (!focusedSupportsEffort) {
        return;
      }
      setEffort((prev) => cycleEffortLevel(prev ?? focusedDefaultEffort, direction, focusedSupportsMax));
      setHasToggledEffort(true);
    };
    $[28] = focusedDefaultEffort;
    $[29] = focusedSupportsEffort;
    $[30] = focusedSupportsMax;
    $[31] = t11;
  } else {
    t11 = $[31];
  }
  const handleCycleEffort = t11;
  let t12;
  if ($[32] !== handleCycleEffort) {
    t12 = {
      "modelPicker:decreaseEffort": () => handleCycleEffort("left"),
      "modelPicker:increaseEffort": () => handleCycleEffort("right")
    };
    $[32] = handleCycleEffort;
    $[33] = t12;
  } else {
    t12 = $[33];
  }
  let t13;
  if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
    t13 = {
      context: "ModelPicker"
    };
    $[34] = t13;
  } else {
    t13 = $[34];
  }
  useKeybindings(t12, t13);
  let t14;
  if ($[35] !== effort || $[36] !== hasToggledEffort || $[37] !== onSelect || $[38] !== setAppState || $[39] !== skipSettingsWrite) {
    t14 = function handleSelect2(value_0) {
      logEvent("tengu_model_command_menu_effort", {
        effort
      });
      if (!skipSettingsWrite) {
        const effortLevel = resolvePickerEffortPersistence(effort, getDefaultEffortLevelForOption(value_0), getSettingsForSource("userSettings")?.effortLevel, hasToggledEffort);
        const persistable = toPersistableEffort(effortLevel);
        if (persistable !== undefined) {
          updateSettingsForSource("userSettings", {
            effortLevel: persistable
          });
        }
        setAppState((prev_0) => ({
          ...prev_0,
          effortValue: effortLevel
        }));
      }
      const selectedModel = resolveOptionModel(value_0);
      const selectedEffort = hasToggledEffort && selectedModel && modelSupportsEffort(selectedModel) ? effort : undefined;
      if (value_0 === NO_PREFERENCE) {
        onSelect(null, selectedEffort);
        return;
      }
      onSelect(value_0, selectedEffort);
    };
    $[35] = effort;
    $[36] = hasToggledEffort;
    $[37] = onSelect;
    $[38] = setAppState;
    $[39] = skipSettingsWrite;
    $[40] = t14;
  } else {
    t14 = $[40];
  }
  const handleSelect = t14;
  let t15;
  if ($[41] === Symbol.for("react.memo_cache_sentinel")) {
    t15 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "remember",
      bold: true,
      children: "Select model"
    }, undefined, false, undefined, this);
    $[41] = t15;
  } else {
    t15 = $[41];
  }
  const t16 = headerText ?? "Switch between Claude models. Applies to this session and future Panda Code sessions. For other/previous model names, specify with --model.";
  let t17;
  if ($[42] !== t16) {
    t17 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: t16
    }, undefined, false, undefined, this);
    $[42] = t16;
    $[43] = t17;
  } else {
    t17 = $[43];
  }
  let t18;
  if ($[44] !== sessionModel) {
    t18 = sessionModel && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "Currently using ",
        modelDisplayString(sessionModel),
        " for this session (set by plan mode). Selecting a model will undo this."
      ]
    }, undefined, true, undefined, this);
    $[44] = sessionModel;
    $[45] = t18;
  } else {
    t18 = $[45];
  }
  let t19;
  if ($[46] !== t17 || $[47] !== t18) {
    t19 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      marginBottom: 1,
      flexDirection: "column",
      children: [
        t15,
        t17,
        t18
      ]
    }, undefined, true, undefined, this);
    $[46] = t17;
    $[47] = t18;
    $[48] = t19;
  } else {
    t19 = $[48];
  }
  const t20 = onCancel ?? _temp4;
  let t21;
  if ($[49] !== handleFocus || $[50] !== handleSelect || $[51] !== initialFocusValue || $[52] !== initialValue || $[53] !== selectOptions || $[54] !== t20 || $[55] !== visibleCount) {
    t21 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
        defaultValue: initialValue,
        defaultFocusValue: initialFocusValue,
        options: selectOptions,
        onChange: handleSelect,
        onFocus: handleFocus,
        onCancel: t20,
        visibleOptionCount: visibleCount
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[49] = handleFocus;
    $[50] = handleSelect;
    $[51] = initialFocusValue;
    $[52] = initialValue;
    $[53] = selectOptions;
    $[54] = t20;
    $[55] = visibleCount;
    $[56] = t21;
  } else {
    t21 = $[56];
  }
  let t22;
  if ($[57] !== hiddenCount) {
    t22 = hiddenCount > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      paddingLeft: 3,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "and ",
          hiddenCount,
          " more\u2026"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[57] = hiddenCount;
    $[58] = t22;
  } else {
    t22 = $[58];
  }
  let t23;
  if ($[59] !== t21 || $[60] !== t22) {
    t23 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        t21,
        t22
      ]
    }, undefined, true, undefined, this);
    $[59] = t21;
    $[60] = t22;
    $[61] = t23;
  } else {
    t23 = $[61];
  }
  let t24;
  if ($[62] !== displayEffort || $[63] !== focusedDefaultEffort || $[64] !== focusedModelName || $[65] !== focusedSupportsEffort) {
    t24 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      marginBottom: 1,
      flexDirection: "column",
      children: focusedSupportsEffort ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(EffortLevelIndicator, {
            effort: displayEffort
          }, undefined, false, undefined, this),
          " ",
          capitalize_default(displayEffort),
          " effort",
          displayEffort === focusedDefaultEffort ? " (default)" : "",
          " ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "subtle",
            children: "\u2190 \u2192 to adjust"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "subtle",
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(EffortLevelIndicator, {
            effort: undefined
          }, undefined, false, undefined, this),
          " Effort not supported",
          focusedModelName ? ` for ${focusedModelName}` : ""
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[62] = displayEffort;
    $[63] = focusedDefaultEffort;
    $[64] = focusedModelName;
    $[65] = focusedSupportsEffort;
    $[66] = t24;
  } else {
    t24 = $[66];
  }
  let t25;
  if ($[67] !== showFastModeNotice) {
    t25 = isFastModeEnabled() ? showFastModeNotice ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      marginBottom: 1,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "Fast mode is ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            bold: true,
            children: "ON"
          }, undefined, false, undefined, this),
          " and available with",
          " ",
          FAST_MODE_MODEL_DISPLAY,
          " only (/fast). Switching to other models turn off fast mode."
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this) : isFastModeAvailable() && !isFastModeCooldown() ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      marginBottom: 1,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "Use ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            bold: true,
            children: "/fast"
          }, undefined, false, undefined, this),
          " to turn on Fast mode (",
          FAST_MODE_MODEL_DISPLAY,
          " only)."
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this) : null : null;
    $[67] = showFastModeNotice;
    $[68] = t25;
  } else {
    t25 = $[68];
  }
  let t26;
  if ($[69] !== t19 || $[70] !== t23 || $[71] !== t24 || $[72] !== t25) {
    t26 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t19,
        t23,
        t24,
        t25
      ]
    }, undefined, true, undefined, this);
    $[69] = t19;
    $[70] = t23;
    $[71] = t24;
    $[72] = t25;
    $[73] = t26;
  } else {
    t26 = $[73];
  }
  let t27;
  if ($[74] !== exitState || $[75] !== isStandaloneCommand) {
    t27 = isStandaloneCommand && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      italic: true,
      children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
        children: [
          "Press ",
          exitState.keyName,
          " again to exit"
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
            shortcut: "Enter",
            action: "confirm"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
            action: "select:cancel",
            context: "Select",
            fallback: "Esc",
            description: "exit"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[74] = exitState;
    $[75] = isStandaloneCommand;
    $[76] = t27;
  } else {
    t27 = $[76];
  }
  let t28;
  if ($[77] !== t26 || $[78] !== t27) {
    t28 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t26,
        t27
      ]
    }, undefined, true, undefined, this);
    $[77] = t26;
    $[78] = t27;
    $[79] = t28;
  } else {
    t28 = $[79];
  }
  const content = t28;
  if (!isStandaloneCommand) {
    return content;
  }
  let t29;
  if ($[80] !== content) {
    t29 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Pane, {
      color: "permission",
      children: content
    }, undefined, false, undefined, this);
    $[80] = content;
    $[81] = t29;
  } else {
    t29 = $[81];
  }
  return t29;
}
function _temp4() {}
function _temp3(opt_0) {
  return {
    ...opt_0,
    value: opt_0.value === null ? NO_PREFERENCE : opt_0.value
  };
}
function _temp2(s_0) {
  return s_0.effortValue;
}
function _temp(s) {
  return isFastModeEnabled() ? s.fastMode : false;
}
function resolveOptionModel(value) {
  if (!value)
    return;
  return value === NO_PREFERENCE ? getDefaultMainLoopModel() : parseUserSpecifiedModel(value);
}
function EffortLevelIndicator(t0) {
  const $ = import_compiler_runtime.c(5);
  const {
    effort
  } = t0;
  const t1 = effort ? "claude" : "subtle";
  const t2 = effort ?? "low";
  let t3;
  if ($[0] !== t2) {
    t3 = effortLevelToSymbol(t2);
    $[0] = t2;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  let t4;
  if ($[2] !== t1 || $[3] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: t1,
      children: t3
    }, undefined, false, undefined, this);
    $[2] = t1;
    $[3] = t3;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  return t4;
}
function cycleEffortLevel(current, direction, includeMax) {
  const levels = includeMax ? ["low", "medium", "high", "max"] : ["low", "medium", "high"];
  const idx = levels.indexOf(current);
  const currentIndex = idx !== -1 ? idx : levels.indexOf("high");
  if (direction === "right") {
    return levels[(currentIndex + 1) % levels.length];
  } else {
    return levels[(currentIndex - 1 + levels.length) % levels.length];
  }
}
function getDefaultEffortLevelForOption(value) {
  const resolved = resolveOptionModel(value) ?? getDefaultMainLoopModel();
  const defaultValue = getDefaultEffortForModel(resolved);
  return defaultValue !== undefined ? convertEffortValueToLevel(defaultValue) : "high";
}
var import_compiler_runtime, import_react, jsx_dev_runtime, NO_PREFERENCE = "__NO_PREFERENCE__";
var init_ModelPicker = __esm(() => {
  init_capitalize();
  init_useExitOnCtrlCDWithKeybindings();
  init_analytics();
  init_fastMode();
  init_ink();
  init_useKeybinding();
  init_AppState();
  init_effort();
  init_model();
  init_modelOptions();
  init_settings();
  init_ConfigurableShortcutHint();
  init_CustomSelect();
  init_Byline();
  init_KeyboardShortcutHint();
  init_Pane();
  init_EffortIndicator();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/utils/extraUsage.ts
function isBilledAsExtraUsage(model, isFastMode, isOpus1mMerged) {
  if (!isClaudeAISubscriber())
    return false;
  if (isFastMode)
    return true;
  if (model === null || !has1mContext(model))
    return false;
  const m = model.toLowerCase().replace(/\[1m\]$/, "").trim();
  const isOpus46 = m === "opus" || m.includes("opus-4-6");
  const isSonnet46 = m === "sonnet" || m.includes("sonnet-4-6");
  if (isOpus46 && isOpus1mMerged)
    return false;
  return isOpus46 || isSonnet46;
}
var init_extraUsage = __esm(() => {
  init_auth();
  init_context();
});

export { getEffortNotificationText, effortLevelToSymbol, init_EffortIndicator, ModelPicker, init_ModelPicker, isBilledAsExtraUsage, init_extraUsage };
