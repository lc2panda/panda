// @bun
import {
  ClaudeMdExternalIncludesDialog,
  init_ClaudeMdExternalIncludesDialog
} from "./chunk-mwc35q1s.js";
import {
  init_bridgeEnabled
} from "./chunk-1h6wzzqp.js";
import {
  ModelPicker,
  init_ModelPicker,
  init_extraUsage,
  isBilledAsExtraUsage
} from "./chunk-axera48n.js";
import {
  ThemePicker,
  init_ThemePicker
} from "./chunk-k5c302g6.js";
import {
  OverageCreditUpsell,
  init_OverageCreditUpsell,
  isEligibleForOverageCreditGrant
} from "./chunk-w5dxtc43.js";
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
  useTabHeaderFocus
} from "./chunk-5rsyjdzb.js";
import {
  fetchUtilization,
  init_usage
} from "./chunk-k89c99s6.js";
import {
  DEFAULT_OUTPUT_STYLE_NAME,
  OUTPUT_STYLE_CONFIG,
  ProgressBar,
  Select,
  TextInput,
  buildAPIProviderProperties,
  buildAccountProperties,
  buildIDEProperties,
  buildInstallationDiagnostics,
  buildInstallationHealthDiagnostics,
  buildMcpProperties,
  buildMemoryDiagnostics,
  buildSandboxProperties,
  buildSettingSourcesProperties,
  exports_BriefTool,
  extraUsage,
  formatCost,
  getAllOutputStyles,
  getCurrentSessionTitle,
  getExternalClaudeMdIncludes,
  getHardcodedTeammateModelFallback,
  getMemoryFiles,
  getModelDisplayLabel,
  hasAccessToIDEExtensionDiffFeature,
  hasExternalClaudeMdIncludes,
  init_AppState,
  init_BriefTool,
  init_CustomSelect,
  init_ProgressBar,
  init_TextInput,
  init_claudemd,
  init_cost_tracker,
  init_extra_usage,
  init_ide,
  init_outputStyles,
  init_permissionSetup,
  init_select,
  init_sessionStorage,
  init_status,
  init_teammateModel,
  isSupportedTerminal,
  transitionPlanAutoMode,
  useAppState,
  useAppStateStore,
  useSetAppState
} from "./chunk-jwtmq3ad.js";
import {
  clearCliTeammateModeOverride,
  getCliTeammateModeOverride,
  init_teammateModeSnapshot
} from "./chunk-23zd2gfp.js";
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
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-gywzh15r.js";
import {
  Pane,
  init_Pane,
  init_modalContext,
  init_useKeybinding,
  init_useTerminalSize,
  useIsInsideModal,
  useKeybinding,
  useKeybindings,
  useModalOrTerminalSize,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_fullscreen,
  init_ink,
  isFullscreenEnvEnabled,
  require_compiler_runtime,
  useTerminalFocus,
  useTheme,
  useThemeSetting
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  EXTERNAL_PERMISSION_MODES,
  FAST_MODE_MODEL_DISPLAY,
  clearFastModeCooldown,
  formatAutoUpdaterDisabledReason,
  getAutoUpdaterDisabledReason,
  getCurrentProjectConfig,
  getFastModeModel,
  getFeatureValue_CACHED_MAY_BE_STALE,
  getGlobalConfig,
  getInitialSettings,
  getSettingsForSource,
  getSubscriptionType,
  init_PermissionMode,
  init_agentSwarmsEnabled,
  init_auth,
  init_authPortable,
  init_config1 as init_config,
  init_fastMode,
  init_growthbook,
  init_model,
  init_settings1 as init_settings,
  init_source,
  isAgentSwarmsEnabled,
  isExternalPermissionMode,
  isFastModeAvailable,
  isFastModeEnabled,
  isFastModeSupportedByModel,
  isOpus1mMergeEnabled,
  modelDisplayString,
  normalizeApiKeyForConfig,
  permissionModeFromString,
  permissionModeTitle,
  saveGlobalConfig,
  source_default,
  toExternalPermissionMode,
  updateSettingsForSource
} from "./chunk-bt6e264h.js";
import {
  formatResetText,
  init_format
} from "./chunk-hsd2zcr5.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import {
  figures_default,
  init_figures
} from "./chunk-nahdbxge.js";
import {
  init_log,
  logError
} from "./chunk-43vdtd69.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import {
  init_slowOperations,
  jsonStringify
} from "./chunk-71hncdva.js";
import {
  init_envUtils,
  isEnvTruthy,
  isRunningOnHomespace
} from "./chunk-3r24h7t6.js";
import {
  getSessionId,
  getUserMsgOptIn,
  init_state,
  setUserMsgOptIn
} from "./chunk-24stks7b.js";
import {
  __esm,
  __toCommonJS,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/Settings/Status.tsx
function buildPrimarySection() {
  const sessionId = getSessionId();
  const customTitle = getCurrentSessionTitle(sessionId);
  const nameValue = customTitle ?? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
    dimColor: true,
    children: "/rename to add a name"
  }, undefined, false, undefined, this);
  return [{
    label: "Version",
    value: MACRO.VERSION
  }, {
    label: "Session name",
    value: nameValue
  }, {
    label: "Session ID",
    value: sessionId
  }, {
    label: "cwd",
    value: getCwd()
  }, ...buildAccountProperties(), ...buildAPIProviderProperties()];
}
function buildSecondarySection({
  mainLoopModel,
  mcp,
  theme,
  context
}) {
  const modelLabel = getModelDisplayLabel(mainLoopModel);
  return [{
    label: "Model",
    value: modelLabel
  }, ...buildIDEProperties(mcp.clients, context.options.ideInstallationStatus, theme), ...buildMcpProperties(mcp.clients, theme), ...buildSandboxProperties(), ...buildSettingSourcesProperties()];
}
async function buildDiagnostics() {
  return [...await buildInstallationDiagnostics(), ...await buildInstallationHealthDiagnostics(), ...await buildMemoryDiagnostics()];
}
function PropertyValue(t0) {
  const $ = import_compiler_runtime.c(8);
  const {
    value
  } = t0;
  if (Array.isArray(value)) {
    let t1;
    if ($[0] !== value) {
      let t22;
      if ($[2] !== value.length) {
        t22 = (item, i) => /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: [
            item,
            i < value.length - 1 ? "," : ""
          ]
        }, i, true, undefined, this);
        $[2] = value.length;
        $[3] = t22;
      } else {
        t22 = $[3];
      }
      t1 = value.map(t22);
      $[0] = value;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    let t2;
    if ($[4] !== t1) {
      t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexWrap: "wrap",
        columnGap: 1,
        flexShrink: 99,
        children: t1
      }, undefined, false, undefined, this);
      $[4] = t1;
      $[5] = t2;
    } else {
      t2 = $[5];
    }
    return t2;
  }
  if (typeof value === "string") {
    let t1;
    if ($[6] !== value) {
      t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: value
      }, undefined, false, undefined, this);
      $[6] = value;
      $[7] = t1;
    } else {
      t1 = $[7];
    }
    return t1;
  }
  return value;
}
function Status(t0) {
  const $ = import_compiler_runtime.c(20);
  const {
    context,
    diagnosticsPromise
  } = t0;
  const mainLoopModel = useAppState(_temp);
  const mcp = useAppState(_temp2);
  const [theme] = useTheme();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = buildPrimarySection();
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== context || $[2] !== mainLoopModel || $[3] !== mcp || $[4] !== theme) {
    t2 = buildSecondarySection({
      mainLoopModel,
      mcp,
      theme,
      context
    });
    $[1] = context;
    $[2] = mainLoopModel;
    $[3] = mcp;
    $[4] = theme;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== t2) {
    t3 = [t1, t2];
    $[6] = t2;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const sections = t3;
  const grow = useIsInsideModal() ? 1 : undefined;
  let t4;
  if ($[8] !== sections) {
    t4 = sections.map(_temp4);
    $[8] = sections;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] !== diagnosticsPromise) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(import_react.Suspense, {
      fallback: null,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Diagnostics, {
        promise: diagnosticsPromise
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[10] = diagnosticsPromise;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  let t6;
  if ($[12] !== grow || $[13] !== t4 || $[14] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      flexGrow: grow,
      children: [
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[12] = grow;
    $[13] = t4;
    $[14] = t5;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  let t7;
  if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
        action: "confirm:no",
        context: "Settings",
        fallback: "Esc",
        description: "cancel"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[16] = t7;
  } else {
    t7 = $[16];
  }
  let t8;
  if ($[17] !== grow || $[18] !== t6) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      flexGrow: grow,
      children: [
        t6,
        t7
      ]
    }, undefined, true, undefined, this);
    $[17] = grow;
    $[18] = t6;
    $[19] = t8;
  } else {
    t8 = $[19];
  }
  return t8;
}
function _temp4(properties, i) {
  return properties.length > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: properties.map(_temp3)
  }, i, false, undefined, this);
}
function _temp3(t0, j) {
  const {
    label,
    value
  } = t0;
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "row",
    gap: 1,
    flexShrink: 0,
    children: [
      label !== undefined && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        bold: true,
        children: [
          label,
          ":"
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(PropertyValue, {
        value
      }, undefined, false, undefined, this)
    ]
  }, j, true, undefined, this);
}
function _temp2(s_0) {
  return s_0.mcp;
}
function _temp(s) {
  return s.mainLoopModel;
}
function Diagnostics(t0) {
  const $ = import_compiler_runtime.c(5);
  const {
    promise
  } = t0;
  const diagnostics = import_react.use(promise);
  if (diagnostics.length === 0) {
    return null;
  }
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: "System Diagnostics"
    }, undefined, false, undefined, this);
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== diagnostics) {
    t2 = diagnostics.map(_temp5);
    $[1] = diagnostics;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      paddingBottom: 1,
      children: [
        t1,
        t2
      ]
    }, undefined, true, undefined, this);
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
function _temp5(diagnostic, i) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "row",
    gap: 1,
    paddingX: 1,
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "error",
        children: figures_default.warning
      }, undefined, false, undefined, this),
      typeof diagnostic === "string" ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        wrap: "wrap",
        children: diagnostic
      }, undefined, false, undefined, this) : diagnostic
    ]
  }, i, true, undefined, this);
}
var import_compiler_runtime, import_react, jsx_dev_runtime;
var init_Status = __esm(() => {
  init_figures();
  init_state();
  init_modalContext();
  init_ink();
  init_AppState();
  init_cwd();
  init_sessionStorage();
  init_status();
  init_ConfigurableShortcutHint();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/ChannelDowngradeDialog.tsx
function ChannelDowngradeDialog(t0) {
  const $ = import_compiler_runtime2.c(17);
  const {
    currentVersion,
    onChoice
  } = t0;
  let t1;
  if ($[0] !== onChoice) {
    t1 = function handleSelect2(value) {
      onChoice(value);
    };
    $[0] = onChoice;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleSelect = t1;
  let t2;
  if ($[2] !== onChoice) {
    t2 = function handleCancel2() {
      onChoice("cancel");
    };
    $[2] = onChoice;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const handleCancel = t2;
  let t3;
  if ($[4] !== currentVersion) {
    t3 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: [
        "The stable channel may have an older version than what you're currently running (",
        currentVersion,
        ")."
      ]
    }, undefined, true, undefined, this);
    $[4] = currentVersion;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: "How would you like to handle this?"
    }, undefined, false, undefined, this);
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = {
      label: "Allow possible downgrade to stable version",
      value: "downgrade"
    };
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  const t6 = `Stay on current version (${currentVersion}) until stable catches up`;
  let t7;
  if ($[8] !== t6) {
    t7 = [t5, {
      label: t6,
      value: "stay"
    }];
    $[8] = t6;
    $[9] = t7;
  } else {
    t7 = $[9];
  }
  let t8;
  if ($[10] !== handleSelect || $[11] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Select, {
      options: t7,
      onChange: handleSelect
    }, undefined, false, undefined, this);
    $[10] = handleSelect;
    $[11] = t7;
    $[12] = t8;
  } else {
    t8 = $[12];
  }
  let t9;
  if ($[13] !== handleCancel || $[14] !== t3 || $[15] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
      title: "Switch to Stable Channel",
      onCancel: handleCancel,
      color: "permission",
      hideBorder: true,
      hideInputGuide: true,
      children: [
        t3,
        t4,
        t8
      ]
    }, undefined, true, undefined, this);
    $[13] = handleCancel;
    $[14] = t3;
    $[15] = t8;
    $[16] = t9;
  } else {
    t9 = $[16];
  }
  return t9;
}
var import_compiler_runtime2, jsx_dev_runtime2;
var init_ChannelDowngradeDialog = __esm(() => {
  init_ink();
  init_CustomSelect();
  init_Dialog();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/OutputStylePicker.tsx
function mapConfigsToOptions(styles) {
  return Object.entries(styles).map(([style, config]) => ({
    label: config?.name ?? DEFAULT_OUTPUT_STYLE_LABEL,
    value: style,
    description: config?.description ?? DEFAULT_OUTPUT_STYLE_DESCRIPTION
  }));
}
function OutputStylePicker(t0) {
  const $ = import_compiler_runtime3.c(16);
  const {
    initialStyle,
    onComplete,
    onCancel,
    isStandaloneCommand
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [styleOptions, setStyleOptions] = import_react2.useState(t1);
  const [isLoading, setIsLoading] = import_react2.useState(true);
  let t2;
  let t3;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      getAllOutputStyles(getCwd()).then((allStyles) => {
        const options = mapConfigsToOptions(allStyles);
        setStyleOptions(options);
        setIsLoading(false);
      }).catch(() => {
        const builtInOptions = mapConfigsToOptions(OUTPUT_STYLE_CONFIG);
        setStyleOptions(builtInOptions);
        setIsLoading(false);
      });
    };
    t3 = [];
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  import_react2.useEffect(t2, t3);
  let t4;
  if ($[3] !== onComplete) {
    t4 = (style) => {
      const outputStyle = style;
      onComplete(outputStyle);
    };
    $[3] = onComplete;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  const handleStyleSelect = t4;
  const t5 = !isStandaloneCommand;
  const t6 = !isStandaloneCommand;
  let t7;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: "This changes how Panda Code communicates with you"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[5] = t7;
  } else {
    t7 = $[5];
  }
  let t8;
  if ($[6] !== handleStyleSelect || $[7] !== initialStyle || $[8] !== isLoading || $[9] !== styleOptions) {
    t8 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t7,
        isLoading ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          dimColor: true,
          children: "Loading output styles\u2026"
        }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Select, {
          options: styleOptions,
          onChange: handleStyleSelect,
          visibleOptionCount: 10,
          defaultValue: initialStyle
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[6] = handleStyleSelect;
    $[7] = initialStyle;
    $[8] = isLoading;
    $[9] = styleOptions;
    $[10] = t8;
  } else {
    t8 = $[10];
  }
  let t9;
  if ($[11] !== onCancel || $[12] !== t5 || $[13] !== t6 || $[14] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Dialog, {
      title: "Preferred output style",
      onCancel,
      hideInputGuide: t5,
      hideBorder: t6,
      children: t8
    }, undefined, false, undefined, this);
    $[11] = onCancel;
    $[12] = t5;
    $[13] = t6;
    $[14] = t8;
    $[15] = t9;
  } else {
    t9 = $[15];
  }
  return t9;
}
var import_compiler_runtime3, import_react2, jsx_dev_runtime3, DEFAULT_OUTPUT_STYLE_LABEL = "Default", DEFAULT_OUTPUT_STYLE_DESCRIPTION = "Claude completes coding tasks efficiently and provides concise responses";
var init_OutputStylePicker = __esm(() => {
  init_outputStyles();
  init_ink();
  init_cwd();
  init_select();
  init_Dialog();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/LanguagePicker.tsx
function LanguagePicker(t0) {
  const $ = import_compiler_runtime4.c(13);
  const {
    initialLanguage,
    onComplete,
    onCancel
  } = t0;
  const [language, setLanguage] = import_react3.useState(initialLanguage);
  const [cursorOffset, setCursorOffset] = import_react3.useState((initialLanguage ?? "").length);
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
  let t2;
  if ($[1] !== language || $[2] !== onComplete) {
    t2 = function handleSubmit2() {
      const trimmed = language?.trim();
      onComplete(trimmed || undefined);
    };
    $[1] = language;
    $[2] = onComplete;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const handleSubmit = t2;
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: "Enter your preferred response and voice language:"
    }, undefined, false, undefined, this);
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: figures_default.pointer
    }, undefined, false, undefined, this);
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const t5 = language ?? "";
  let t6;
  if ($[6] !== cursorOffset || $[7] !== handleSubmit || $[8] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "row",
      gap: 1,
      children: [
        t4,
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(TextInput, {
          value: t5,
          onChange: setLanguage,
          onSubmit: handleSubmit,
          focus: true,
          showCursor: true,
          placeholder: `e.g., Japanese, \u65E5\u672C\u8A9E, Espa\xF1ol${figures_default.ellipsis}`,
          columns: 60,
          cursorOffset,
          onChangeCursorOffset: setCursorOffset
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[6] = cursorOffset;
    $[7] = handleSubmit;
    $[8] = t5;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  let t7;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Leave empty for default (English)"
    }, undefined, false, undefined, this);
    $[10] = t7;
  } else {
    t7 = $[10];
  }
  let t8;
  if ($[11] !== t6) {
    t8 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t3,
        t6,
        t7
      ]
    }, undefined, true, undefined, this);
    $[11] = t6;
    $[12] = t8;
  } else {
    t8 = $[12];
  }
  return t8;
}
var import_compiler_runtime4, import_react3, jsx_dev_runtime4;
var init_LanguagePicker = __esm(() => {
  init_figures();
  init_ink();
  init_useKeybinding();
  init_TextInput();
  import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  import_react3 = __toESM(require_react(), 1);
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/Settings/Config.tsx
function Config({
  onClose,
  context,
  setTabsHidden,
  onIsSearchModeChange,
  contentHeight
}) {
  const {
    headerFocused,
    focusHeader
  } = useTabHeaderFocus();
  const insideModal = useIsInsideModal();
  const [, setTheme] = useTheme();
  const themeSetting = useThemeSetting();
  const [globalConfig, setGlobalConfig] = import_react4.useState(getGlobalConfig());
  const initialConfig = React2.useRef(getGlobalConfig());
  const [settingsData, setSettingsData] = import_react4.useState(getInitialSettings());
  const initialSettingsData = React2.useRef(getInitialSettings());
  const [currentOutputStyle, setCurrentOutputStyle] = import_react4.useState(settingsData?.outputStyle || DEFAULT_OUTPUT_STYLE_NAME);
  const initialOutputStyle = React2.useRef(currentOutputStyle);
  const [currentLanguage, setCurrentLanguage] = import_react4.useState(settingsData?.language);
  const initialLanguage = React2.useRef(currentLanguage);
  const [selectedIndex, setSelectedIndex] = import_react4.useState(0);
  const [scrollOffset, setScrollOffset] = import_react4.useState(0);
  const [isSearchMode, setIsSearchMode] = import_react4.useState(true);
  const isTerminalFocused = useTerminalFocus();
  const {
    rows
  } = useTerminalSize();
  const paneCap = contentHeight ?? Math.min(Math.floor(rows * 0.8), 30);
  const maxVisible = Math.max(5, paneCap - 10);
  const mainLoopModel = useAppState((s) => s.mainLoopModel);
  const verbose = useAppState((s_0) => s_0.verbose);
  const thinkingEnabled = useAppState((s_1) => s_1.thinkingEnabled);
  const isFastMode = useAppState((s_2) => isFastModeEnabled() ? s_2.fastMode : false);
  const promptSuggestionEnabled = useAppState((s_3) => s_3.promptSuggestionEnabled);
  const showAutoInDefaultModePicker = false;
  const showDefaultViewPicker = (init_BriefTool(), __toCommonJS(exports_BriefTool)).isBriefEntitled();
  const setAppState = useSetAppState();
  const [changes, setChanges] = import_react4.useState({});
  const initialThinkingEnabled = React2.useRef(thinkingEnabled);
  const [initialLocalSettings] = import_react4.useState(() => getSettingsForSource("localSettings"));
  const [initialUserSettings] = import_react4.useState(() => getSettingsForSource("userSettings"));
  const initialThemeSetting = React2.useRef(themeSetting);
  const store = useAppStateStore();
  const [initialAppState] = import_react4.useState(() => {
    const s_4 = store.getState();
    return {
      mainLoopModel: s_4.mainLoopModel,
      mainLoopModelForSession: s_4.mainLoopModelForSession,
      verbose: s_4.verbose,
      thinkingEnabled: s_4.thinkingEnabled,
      fastMode: s_4.fastMode,
      promptSuggestionEnabled: s_4.promptSuggestionEnabled,
      isBriefOnly: s_4.isBriefOnly,
      replBridgeEnabled: s_4.replBridgeEnabled,
      replBridgeOutboundOnly: s_4.replBridgeOutboundOnly,
      settings: s_4.settings
    };
  });
  const [initialUserMsgOptIn] = import_react4.useState(() => getUserMsgOptIn());
  const isDirty = React2.useRef(false);
  const [showThinkingWarning, setShowThinkingWarning] = import_react4.useState(false);
  const [showSubmenu, setShowSubmenu] = import_react4.useState(null);
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    cursorOffset: searchCursorOffset
  } = useSearchInput({
    isActive: isSearchMode && showSubmenu === null && !headerFocused,
    onExit: () => setIsSearchMode(false),
    onExitUp: focusHeader,
    passthroughCtrlKeys: ["c", "d"]
  });
  const ownsEsc = isSearchMode && !headerFocused;
  React2.useEffect(() => {
    onIsSearchModeChange?.(ownsEsc);
  }, [ownsEsc, onIsSearchModeChange]);
  const isConnectedToIde = hasAccessToIDEExtensionDiffFeature(context.options.mcpClients);
  const isFileCheckpointingAvailable = !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING);
  const memoryFiles = React2.use(getMemoryFiles(true));
  const shouldShowExternalIncludesToggle = hasExternalClaudeMdIncludes(memoryFiles);
  const autoUpdaterDisabledReason = getAutoUpdaterDisabledReason();
  function onChangeMainModelConfig(value) {
    const previousModel = mainLoopModel;
    logEvent("tengu_config_model_changed", {
      from_model: previousModel,
      to_model: value
    });
    setAppState((prev) => ({
      ...prev,
      mainLoopModel: value,
      mainLoopModelForSession: null
    }));
    setChanges((prev_0) => {
      const valStr = modelDisplayString(value) + (isBilledAsExtraUsage(value, false, isOpus1mMergeEnabled()) ? " \xB7 Billed as extra usage" : "");
      if ("model" in prev_0) {
        const {
          model,
          ...rest
        } = prev_0;
        return {
          ...rest,
          model: valStr
        };
      }
      return {
        ...prev_0,
        model: valStr
      };
    });
  }
  function onChangeVerbose(value_0) {
    saveGlobalConfig((current) => ({
      ...current,
      verbose: value_0
    }));
    setGlobalConfig({
      ...getGlobalConfig(),
      verbose: value_0
    });
    setAppState((prev_1) => ({
      ...prev_1,
      verbose: value_0
    }));
    setChanges((prev_2) => {
      if ("verbose" in prev_2) {
        const {
          verbose: verbose_0,
          ...rest_0
        } = prev_2;
        return rest_0;
      }
      return {
        ...prev_2,
        verbose: value_0
      };
    });
  }
  const settingsItems = [
    {
      id: "autoCompactEnabled",
      label: "Auto-compact",
      value: globalConfig.autoCompactEnabled,
      type: "boolean",
      onChange(autoCompactEnabled) {
        saveGlobalConfig((current_0) => ({
          ...current_0,
          autoCompactEnabled
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          autoCompactEnabled
        });
        logEvent("tengu_auto_compact_setting_changed", {
          enabled: autoCompactEnabled
        });
      }
    },
    {
      id: "spinnerTipsEnabled",
      label: "Show tips",
      value: settingsData?.spinnerTipsEnabled ?? true,
      type: "boolean",
      onChange(spinnerTipsEnabled) {
        updateSettingsForSource("localSettings", {
          spinnerTipsEnabled
        });
        setSettingsData((prev_3) => ({
          ...prev_3,
          spinnerTipsEnabled
        }));
        logEvent("tengu_tips_setting_changed", {
          enabled: spinnerTipsEnabled
        });
      }
    },
    {
      id: "prefersReducedMotion",
      label: "Reduce motion",
      value: settingsData?.prefersReducedMotion ?? false,
      type: "boolean",
      onChange(prefersReducedMotion) {
        updateSettingsForSource("localSettings", {
          prefersReducedMotion
        });
        setSettingsData((prev_4) => ({
          ...prev_4,
          prefersReducedMotion
        }));
        setAppState((prev_5) => ({
          ...prev_5,
          settings: {
            ...prev_5.settings,
            prefersReducedMotion
          }
        }));
        logEvent("tengu_reduce_motion_setting_changed", {
          enabled: prefersReducedMotion
        });
      }
    },
    {
      id: "thinkingEnabled",
      label: "Thinking mode",
      value: thinkingEnabled ?? true,
      type: "boolean",
      onChange(enabled) {
        setAppState((prev_6) => ({
          ...prev_6,
          thinkingEnabled: enabled
        }));
        updateSettingsForSource("userSettings", {
          alwaysThinkingEnabled: enabled ? undefined : false
        });
        logEvent("tengu_thinking_toggled", {
          enabled
        });
      }
    },
    ...isFastModeEnabled() && isFastModeAvailable() ? [{
      id: "fastMode",
      label: `Fast mode (${FAST_MODE_MODEL_DISPLAY} only)`,
      value: !!isFastMode,
      type: "boolean",
      onChange(enabled_0) {
        clearFastModeCooldown();
        updateSettingsForSource("userSettings", {
          fastMode: enabled_0 ? true : undefined
        });
        if (enabled_0) {
          setAppState((prev_7) => ({
            ...prev_7,
            mainLoopModel: getFastModeModel(),
            mainLoopModelForSession: null,
            fastMode: true
          }));
          setChanges((prev_8) => ({
            ...prev_8,
            model: getFastModeModel(),
            "Fast mode": "ON"
          }));
        } else {
          setAppState((prev_9) => ({
            ...prev_9,
            fastMode: false
          }));
          setChanges((prev_10) => ({
            ...prev_10,
            "Fast mode": "OFF"
          }));
        }
      }
    }] : [],
    ...getFeatureValue_CACHED_MAY_BE_STALE("tengu_chomp_inflection", false) ? [{
      id: "promptSuggestionEnabled",
      label: "Prompt suggestions",
      value: promptSuggestionEnabled,
      type: "boolean",
      onChange(enabled_1) {
        setAppState((prev_11) => ({
          ...prev_11,
          promptSuggestionEnabled: enabled_1
        }));
        updateSettingsForSource("userSettings", {
          promptSuggestionEnabled: enabled_1 ? undefined : false
        });
      }
    }] : [],
    ...[],
    ...isFileCheckpointingAvailable ? [{
      id: "fileCheckpointingEnabled",
      label: "Rewind code (checkpoints)",
      value: globalConfig.fileCheckpointingEnabled,
      type: "boolean",
      onChange(enabled_3) {
        saveGlobalConfig((current_2) => ({
          ...current_2,
          fileCheckpointingEnabled: enabled_3
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          fileCheckpointingEnabled: enabled_3
        });
        logEvent("tengu_file_history_snapshots_setting_changed", {
          enabled: enabled_3
        });
      }
    }] : [],
    {
      id: "verbose",
      label: "Verbose output",
      value: verbose,
      type: "boolean",
      onChange: onChangeVerbose
    },
    {
      id: "terminalProgressBarEnabled",
      label: "Terminal progress bar",
      value: globalConfig.terminalProgressBarEnabled,
      type: "boolean",
      onChange(terminalProgressBarEnabled) {
        saveGlobalConfig((current_3) => ({
          ...current_3,
          terminalProgressBarEnabled
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          terminalProgressBarEnabled
        });
        logEvent("tengu_terminal_progress_bar_setting_changed", {
          enabled: terminalProgressBarEnabled
        });
      }
    },
    ...getFeatureValue_CACHED_MAY_BE_STALE("tengu_terminal_sidebar", false) ? [{
      id: "showStatusInTerminalTab",
      label: "Show status in terminal tab",
      value: globalConfig.showStatusInTerminalTab ?? false,
      type: "boolean",
      onChange(showStatusInTerminalTab) {
        saveGlobalConfig((current_4) => ({
          ...current_4,
          showStatusInTerminalTab
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          showStatusInTerminalTab
        });
        logEvent("tengu_terminal_tab_status_setting_changed", {
          enabled: showStatusInTerminalTab
        });
      }
    }] : [],
    {
      id: "showTurnDuration",
      label: "Show turn duration",
      value: globalConfig.showTurnDuration,
      type: "boolean",
      onChange(showTurnDuration) {
        saveGlobalConfig((current_5) => ({
          ...current_5,
          showTurnDuration
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          showTurnDuration
        });
        logEvent("tengu_show_turn_duration_setting_changed", {
          enabled: showTurnDuration
        });
      }
    },
    {
      id: "defaultPermissionMode",
      label: "Default permission mode",
      value: settingsData?.permissions?.defaultMode || "default",
      options: (() => {
        const priorityOrder = ["default", "plan"];
        const allModes = EXTERNAL_PERMISSION_MODES;
        const excluded = ["bypassPermissions"];
        if (false) {}
        return [...priorityOrder, ...allModes.filter((m) => !priorityOrder.includes(m) && !excluded.includes(m))];
      })(),
      type: "enum",
      onChange(mode) {
        const parsedMode = permissionModeFromString(mode);
        const validatedMode = isExternalPermissionMode(parsedMode) ? toExternalPermissionMode(parsedMode) : parsedMode;
        const result = updateSettingsForSource("userSettings", {
          permissions: {
            ...settingsData?.permissions,
            defaultMode: validatedMode
          }
        });
        if (result.error) {
          logError(result.error);
          return;
        }
        setSettingsData((prev_12) => ({
          ...prev_12,
          permissions: {
            ...prev_12?.permissions,
            defaultMode: validatedMode
          }
        }));
        setChanges((prev_13) => ({
          ...prev_13,
          defaultPermissionMode: mode
        }));
        logEvent("tengu_config_changed", {
          setting: "defaultPermissionMode",
          value: mode
        });
      }
    },
    ...[],
    {
      id: "respectGitignore",
      label: "Respect .gitignore in file picker",
      value: globalConfig.respectGitignore,
      type: "boolean",
      onChange(respectGitignore) {
        saveGlobalConfig((current_6) => ({
          ...current_6,
          respectGitignore
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          respectGitignore
        });
        logEvent("tengu_respect_gitignore_setting_changed", {
          enabled: respectGitignore
        });
      }
    },
    {
      id: "copyFullResponse",
      label: "Always copy full response (skip /copy picker)",
      value: globalConfig.copyFullResponse,
      type: "boolean",
      onChange(copyFullResponse) {
        saveGlobalConfig((current_7) => ({
          ...current_7,
          copyFullResponse
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          copyFullResponse
        });
        logEvent("tengu_config_changed", {
          setting: "copyFullResponse",
          value: String(copyFullResponse)
        });
      }
    },
    ...isFullscreenEnvEnabled() ? [{
      id: "copyOnSelect",
      label: "Copy on select",
      value: globalConfig.copyOnSelect ?? true,
      type: "boolean",
      onChange(copyOnSelect) {
        saveGlobalConfig((current_8) => ({
          ...current_8,
          copyOnSelect
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          copyOnSelect
        });
        logEvent("tengu_config_changed", {
          setting: "copyOnSelect",
          value: String(copyOnSelect)
        });
      }
    }] : [],
    autoUpdaterDisabledReason ? {
      id: "autoUpdatesChannel",
      label: "Auto-update channel",
      value: "disabled",
      type: "managedEnum",
      onChange() {}
    } : {
      id: "autoUpdatesChannel",
      label: "Auto-update channel",
      value: settingsData?.autoUpdatesChannel ?? "latest",
      type: "managedEnum",
      onChange() {}
    },
    {
      id: "theme",
      label: "Theme",
      value: themeSetting,
      type: "managedEnum",
      onChange: setTheme
    },
    {
      id: "notifChannel",
      label: "Local notifications",
      value: globalConfig.preferredNotifChannel,
      options: ["auto", "iterm2", "terminal_bell", "iterm2_with_bell", "kitty", "ghostty", "notifications_disabled"],
      type: "enum",
      onChange(notifChannel) {
        saveGlobalConfig((current_9) => ({
          ...current_9,
          preferredNotifChannel: notifChannel
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          preferredNotifChannel: notifChannel
        });
      }
    },
    ...[{
      id: "taskCompleteNotifEnabled",
      label: "Push when idle",
      value: globalConfig.taskCompleteNotifEnabled ?? false,
      type: "boolean",
      onChange(taskCompleteNotifEnabled) {
        saveGlobalConfig((current_10) => ({
          ...current_10,
          taskCompleteNotifEnabled
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          taskCompleteNotifEnabled
        });
      }
    }, {
      id: "inputNeededNotifEnabled",
      label: "Push when input needed",
      value: globalConfig.inputNeededNotifEnabled ?? false,
      type: "boolean",
      onChange(inputNeededNotifEnabled) {
        saveGlobalConfig((current_11) => ({
          ...current_11,
          inputNeededNotifEnabled
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          inputNeededNotifEnabled
        });
      }
    }, {
      id: "agentPushNotifEnabled",
      label: "Push when Claude decides",
      value: globalConfig.agentPushNotifEnabled ?? false,
      type: "boolean",
      onChange(agentPushNotifEnabled) {
        saveGlobalConfig((current_12) => ({
          ...current_12,
          agentPushNotifEnabled
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          agentPushNotifEnabled
        });
      }
    }],
    {
      id: "outputStyle",
      label: "Output style",
      value: currentOutputStyle,
      type: "managedEnum",
      onChange: () => {}
    },
    ...showDefaultViewPicker ? [{
      id: "defaultView",
      label: "What you see by default",
      value: settingsData?.defaultView === undefined ? "default" : String(settingsData.defaultView),
      options: ["transcript", "chat", "default"],
      type: "enum",
      onChange(selected) {
        const defaultView = selected === "default" ? undefined : selected;
        updateSettingsForSource("localSettings", {
          defaultView
        });
        setSettingsData((prev_17) => ({
          ...prev_17,
          defaultView
        }));
        const nextBrief = defaultView === "chat";
        setAppState((prev_18) => {
          if (prev_18.isBriefOnly === nextBrief)
            return prev_18;
          return {
            ...prev_18,
            isBriefOnly: nextBrief
          };
        });
        setUserMsgOptIn(nextBrief);
        setChanges((prev_19) => ({
          ...prev_19,
          "Default view": selected
        }));
        logEvent("tengu_default_view_setting_changed", {
          value: defaultView ?? "unset"
        });
      }
    }] : [],
    {
      id: "language",
      label: "Language",
      value: currentLanguage ?? "Default (English)",
      type: "managedEnum",
      onChange: () => {}
    },
    {
      id: "editorMode",
      label: "Editor mode",
      value: globalConfig.editorMode === "emacs" ? "normal" : globalConfig.editorMode || "normal",
      options: ["normal", "vim"],
      type: "enum",
      onChange(value_1) {
        saveGlobalConfig((current_13) => ({
          ...current_13,
          editorMode: value_1
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          editorMode: value_1
        });
        logEvent("tengu_editor_mode_changed", {
          mode: value_1,
          source: "config_panel"
        });
      }
    },
    {
      id: "prStatusFooterEnabled",
      label: "Show PR status footer",
      value: globalConfig.prStatusFooterEnabled ?? true,
      type: "boolean",
      onChange(enabled_4) {
        saveGlobalConfig((current_14) => {
          if (current_14.prStatusFooterEnabled === enabled_4)
            return current_14;
          return {
            ...current_14,
            prStatusFooterEnabled: enabled_4
          };
        });
        setGlobalConfig({
          ...getGlobalConfig(),
          prStatusFooterEnabled: enabled_4
        });
        logEvent("tengu_pr_status_footer_setting_changed", {
          enabled: enabled_4
        });
      }
    },
    {
      id: "model",
      label: "Model",
      value: mainLoopModel === null ? "Default (recommended)" : mainLoopModel,
      type: "managedEnum",
      onChange: onChangeMainModelConfig
    },
    ...isConnectedToIde ? [{
      id: "diffTool",
      label: "Diff tool",
      value: globalConfig.diffTool ?? "auto",
      options: ["terminal", "auto"],
      type: "enum",
      onChange(diffTool) {
        saveGlobalConfig((current_15) => ({
          ...current_15,
          diffTool
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          diffTool
        });
        logEvent("tengu_diff_tool_changed", {
          tool: diffTool,
          source: "config_panel"
        });
      }
    }] : [],
    ...!isSupportedTerminal() ? [{
      id: "autoConnectIde",
      label: "Auto-connect to IDE (external terminal)",
      value: globalConfig.autoConnectIde ?? false,
      type: "boolean",
      onChange(autoConnectIde) {
        saveGlobalConfig((current_16) => ({
          ...current_16,
          autoConnectIde
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          autoConnectIde
        });
        logEvent("tengu_auto_connect_ide_changed", {
          enabled: autoConnectIde,
          source: "config_panel"
        });
      }
    }] : [],
    ...isSupportedTerminal() ? [{
      id: "autoInstallIdeExtension",
      label: "Auto-install IDE extension",
      value: globalConfig.autoInstallIdeExtension ?? true,
      type: "boolean",
      onChange(autoInstallIdeExtension) {
        saveGlobalConfig((current_17) => ({
          ...current_17,
          autoInstallIdeExtension
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          autoInstallIdeExtension
        });
        logEvent("tengu_auto_install_ide_extension_changed", {
          enabled: autoInstallIdeExtension,
          source: "config_panel"
        });
      }
    }] : [],
    {
      id: "claudeInChromeDefaultEnabled",
      label: "Claude in Chrome enabled by default",
      value: globalConfig.claudeInChromeDefaultEnabled ?? true,
      type: "boolean",
      onChange(enabled_5) {
        saveGlobalConfig((current_18) => ({
          ...current_18,
          claudeInChromeDefaultEnabled: enabled_5
        }));
        setGlobalConfig({
          ...getGlobalConfig(),
          claudeInChromeDefaultEnabled: enabled_5
        });
        logEvent("tengu_claude_in_chrome_setting_changed", {
          enabled: enabled_5
        });
      }
    },
    ...isAgentSwarmsEnabled() ? (() => {
      const cliOverride = getCliTeammateModeOverride();
      const label = cliOverride ? `Teammate mode [overridden: ${cliOverride}]` : "Teammate mode";
      return [{
        id: "teammateMode",
        label,
        value: globalConfig.teammateMode ?? "auto",
        options: ["auto", "tmux", "in-process"],
        type: "enum",
        onChange(mode_0) {
          if (mode_0 !== "auto" && mode_0 !== "tmux" && mode_0 !== "in-process") {
            return;
          }
          clearCliTeammateModeOverride(mode_0);
          saveGlobalConfig((current_19) => ({
            ...current_19,
            teammateMode: mode_0
          }));
          setGlobalConfig({
            ...getGlobalConfig(),
            teammateMode: mode_0
          });
          logEvent("tengu_teammate_mode_changed", {
            mode: mode_0
          });
        }
      }, {
        id: "teammateDefaultModel",
        label: "Default teammate model",
        value: teammateModelDisplayString(globalConfig.teammateDefaultModel),
        type: "managedEnum",
        onChange() {}
      }];
    })() : [],
    ...[],
    ...shouldShowExternalIncludesToggle ? [{
      id: "showExternalIncludesDialog",
      label: "External CLAUDE.md includes",
      value: (() => {
        const projectConfig = getCurrentProjectConfig();
        if (projectConfig.hasClaudeMdExternalIncludesApproved) {
          return "true";
        } else {
          return "false";
        }
      })(),
      type: "managedEnum",
      onChange() {}
    }] : [],
    ...process.env.ANTHROPIC_API_KEY && !isRunningOnHomespace() ? [{
      id: "apiKey",
      label: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        children: [
          "Use custom API key:",
          " ",
          /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
            bold: true,
            children: normalizeApiKeyForConfig(process.env.ANTHROPIC_API_KEY)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      searchText: "Use custom API key",
      value: Boolean(process.env.ANTHROPIC_API_KEY && globalConfig.customApiKeyResponses?.approved?.includes(normalizeApiKeyForConfig(process.env.ANTHROPIC_API_KEY))),
      type: "boolean",
      onChange(useCustomKey) {
        saveGlobalConfig((current_22) => {
          const updated = {
            ...current_22
          };
          if (!updated.customApiKeyResponses) {
            updated.customApiKeyResponses = {
              approved: [],
              rejected: []
            };
          }
          if (!updated.customApiKeyResponses.approved) {
            updated.customApiKeyResponses = {
              ...updated.customApiKeyResponses,
              approved: []
            };
          }
          if (!updated.customApiKeyResponses.rejected) {
            updated.customApiKeyResponses = {
              ...updated.customApiKeyResponses,
              rejected: []
            };
          }
          if (process.env.ANTHROPIC_API_KEY) {
            const truncatedKey = normalizeApiKeyForConfig(process.env.ANTHROPIC_API_KEY);
            if (useCustomKey) {
              updated.customApiKeyResponses = {
                ...updated.customApiKeyResponses,
                approved: [...(updated.customApiKeyResponses.approved ?? []).filter((k) => k !== truncatedKey), truncatedKey],
                rejected: (updated.customApiKeyResponses.rejected ?? []).filter((k_0) => k_0 !== truncatedKey)
              };
            } else {
              updated.customApiKeyResponses = {
                ...updated.customApiKeyResponses,
                approved: (updated.customApiKeyResponses.approved ?? []).filter((k_1) => k_1 !== truncatedKey),
                rejected: [...(updated.customApiKeyResponses.rejected ?? []).filter((k_2) => k_2 !== truncatedKey), truncatedKey]
              };
            }
          }
          return updated;
        });
        setGlobalConfig(getGlobalConfig());
      }
    }] : []
  ];
  const filteredSettingsItems = React2.useMemo(() => {
    if (!searchQuery)
      return settingsItems;
    const lowerQuery = searchQuery.toLowerCase();
    return settingsItems.filter((setting) => {
      if (setting.id.toLowerCase().includes(lowerQuery))
        return true;
      const searchableText = "searchText" in setting ? setting.searchText : setting.label;
      return searchableText.toLowerCase().includes(lowerQuery);
    });
  }, [settingsItems, searchQuery]);
  React2.useEffect(() => {
    if (selectedIndex >= filteredSettingsItems.length) {
      const newIndex = Math.max(0, filteredSettingsItems.length - 1);
      setSelectedIndex(newIndex);
      setScrollOffset(Math.max(0, newIndex - maxVisible + 1));
      return;
    }
    setScrollOffset((prev_21) => {
      if (selectedIndex < prev_21)
        return selectedIndex;
      if (selectedIndex >= prev_21 + maxVisible)
        return selectedIndex - maxVisible + 1;
      return prev_21;
    });
  }, [filteredSettingsItems.length, selectedIndex, maxVisible]);
  const adjustScrollOffset = import_react4.useCallback((newIndex_0) => {
    setScrollOffset((prev_22) => {
      if (newIndex_0 < prev_22)
        return newIndex_0;
      if (newIndex_0 >= prev_22 + maxVisible)
        return newIndex_0 - maxVisible + 1;
      return prev_22;
    });
  }, [maxVisible]);
  const handleSaveAndClose = import_react4.useCallback(() => {
    if (showSubmenu !== null) {
      return;
    }
    const formattedChanges = Object.entries(changes).map(([key, value_2]) => {
      logEvent("tengu_config_changed", {
        key,
        value: value_2
      });
      return `Set ${key} to ${source_default.bold(value_2)}`;
    });
    const effectiveApiKey = isRunningOnHomespace() ? undefined : process.env.ANTHROPIC_API_KEY;
    const initialUsingCustomKey = Boolean(effectiveApiKey && initialConfig.current.customApiKeyResponses?.approved?.includes(normalizeApiKeyForConfig(effectiveApiKey)));
    const currentUsingCustomKey = Boolean(effectiveApiKey && globalConfig.customApiKeyResponses?.approved?.includes(normalizeApiKeyForConfig(effectiveApiKey)));
    if (initialUsingCustomKey !== currentUsingCustomKey) {
      formattedChanges.push(`${currentUsingCustomKey ? "Enabled" : "Disabled"} custom API key`);
      logEvent("tengu_config_changed", {
        key: "env.ANTHROPIC_API_KEY",
        value: currentUsingCustomKey
      });
    }
    if (globalConfig.theme !== initialConfig.current.theme) {
      formattedChanges.push(`Set theme to ${source_default.bold(globalConfig.theme)}`);
    }
    if (globalConfig.preferredNotifChannel !== initialConfig.current.preferredNotifChannel) {
      formattedChanges.push(`Set notifications to ${source_default.bold(globalConfig.preferredNotifChannel)}`);
    }
    if (currentOutputStyle !== initialOutputStyle.current) {
      formattedChanges.push(`Set output style to ${source_default.bold(currentOutputStyle)}`);
    }
    if (currentLanguage !== initialLanguage.current) {
      formattedChanges.push(`Set response language to ${source_default.bold(currentLanguage ?? "Default (English)")}`);
    }
    if (globalConfig.editorMode !== initialConfig.current.editorMode) {
      formattedChanges.push(`Set editor mode to ${source_default.bold(globalConfig.editorMode || "emacs")}`);
    }
    if (globalConfig.diffTool !== initialConfig.current.diffTool) {
      formattedChanges.push(`Set diff tool to ${source_default.bold(globalConfig.diffTool)}`);
    }
    if (globalConfig.autoConnectIde !== initialConfig.current.autoConnectIde) {
      formattedChanges.push(`${globalConfig.autoConnectIde ? "Enabled" : "Disabled"} auto-connect to IDE`);
    }
    if (globalConfig.autoInstallIdeExtension !== initialConfig.current.autoInstallIdeExtension) {
      formattedChanges.push(`${globalConfig.autoInstallIdeExtension ? "Enabled" : "Disabled"} auto-install IDE extension`);
    }
    if (globalConfig.autoCompactEnabled !== initialConfig.current.autoCompactEnabled) {
      formattedChanges.push(`${globalConfig.autoCompactEnabled ? "Enabled" : "Disabled"} auto-compact`);
    }
    if (globalConfig.respectGitignore !== initialConfig.current.respectGitignore) {
      formattedChanges.push(`${globalConfig.respectGitignore ? "Enabled" : "Disabled"} respect .gitignore in file picker`);
    }
    if (globalConfig.copyFullResponse !== initialConfig.current.copyFullResponse) {
      formattedChanges.push(`${globalConfig.copyFullResponse ? "Enabled" : "Disabled"} always copy full response`);
    }
    if (globalConfig.copyOnSelect !== initialConfig.current.copyOnSelect) {
      formattedChanges.push(`${globalConfig.copyOnSelect ? "Enabled" : "Disabled"} copy on select`);
    }
    if (globalConfig.terminalProgressBarEnabled !== initialConfig.current.terminalProgressBarEnabled) {
      formattedChanges.push(`${globalConfig.terminalProgressBarEnabled ? "Enabled" : "Disabled"} terminal progress bar`);
    }
    if (globalConfig.showStatusInTerminalTab !== initialConfig.current.showStatusInTerminalTab) {
      formattedChanges.push(`${globalConfig.showStatusInTerminalTab ? "Enabled" : "Disabled"} terminal tab status`);
    }
    if (globalConfig.showTurnDuration !== initialConfig.current.showTurnDuration) {
      formattedChanges.push(`${globalConfig.showTurnDuration ? "Enabled" : "Disabled"} turn duration`);
    }
    if (globalConfig.remoteControlAtStartup !== initialConfig.current.remoteControlAtStartup) {
      const remoteLabel = globalConfig.remoteControlAtStartup === undefined ? "Reset Remote Control to default" : `${globalConfig.remoteControlAtStartup ? "Enabled" : "Disabled"} Remote Control for all sessions`;
      formattedChanges.push(remoteLabel);
    }
    if (settingsData?.autoUpdatesChannel !== initialSettingsData.current?.autoUpdatesChannel) {
      formattedChanges.push(`Set auto-update channel to ${source_default.bold(settingsData?.autoUpdatesChannel ?? "latest")}`);
    }
    if (formattedChanges.length > 0) {
      onClose(formattedChanges.join(`
`));
    } else {
      onClose("Config dialog dismissed", {
        display: "system"
      });
    }
  }, [showSubmenu, changes, globalConfig, mainLoopModel, currentOutputStyle, currentLanguage, settingsData?.autoUpdatesChannel, isFastModeEnabled() ? settingsData?.fastMode : undefined, onClose]);
  const revertChanges = import_react4.useCallback(() => {
    if (themeSetting !== initialThemeSetting.current) {
      setTheme(initialThemeSetting.current);
    }
    saveGlobalConfig(() => initialConfig.current);
    const il = initialLocalSettings;
    updateSettingsForSource("localSettings", {
      spinnerTipsEnabled: il?.spinnerTipsEnabled,
      prefersReducedMotion: il?.prefersReducedMotion,
      defaultView: il?.defaultView,
      outputStyle: il?.outputStyle
    });
    const iu = initialUserSettings;
    updateSettingsForSource("userSettings", {
      alwaysThinkingEnabled: iu?.alwaysThinkingEnabled,
      fastMode: iu?.fastMode,
      promptSuggestionEnabled: iu?.promptSuggestionEnabled,
      autoUpdatesChannel: iu?.autoUpdatesChannel,
      minimumVersion: iu?.minimumVersion,
      language: iu?.language,
      ...{},
      syntaxHighlightingDisabled: iu?.syntaxHighlightingDisabled,
      permissions: iu?.permissions === undefined ? undefined : {
        ...iu.permissions,
        defaultMode: iu.permissions.defaultMode
      }
    });
    const ia = initialAppState;
    setAppState((prev_23) => ({
      ...prev_23,
      mainLoopModel: ia.mainLoopModel,
      mainLoopModelForSession: ia.mainLoopModelForSession,
      verbose: ia.verbose,
      thinkingEnabled: ia.thinkingEnabled,
      fastMode: ia.fastMode,
      promptSuggestionEnabled: ia.promptSuggestionEnabled,
      isBriefOnly: ia.isBriefOnly,
      replBridgeEnabled: ia.replBridgeEnabled,
      replBridgeOutboundOnly: ia.replBridgeOutboundOnly,
      settings: ia.settings,
      toolPermissionContext: transitionPlanAutoMode(prev_23.toolPermissionContext)
    }));
    if (getUserMsgOptIn() !== initialUserMsgOptIn) {
      setUserMsgOptIn(initialUserMsgOptIn);
    }
  }, [themeSetting, setTheme, initialLocalSettings, initialUserSettings, initialAppState, initialUserMsgOptIn, setAppState]);
  const handleEscape = import_react4.useCallback(() => {
    if (showSubmenu !== null) {
      return;
    }
    if (isDirty.current) {
      revertChanges();
    }
    onClose("Config dialog dismissed", {
      display: "system"
    });
  }, [showSubmenu, revertChanges, onClose]);
  useKeybinding("confirm:no", handleEscape, {
    context: "Settings",
    isActive: showSubmenu === null && !isSearchMode && !headerFocused
  });
  useKeybinding("settings:close", handleSaveAndClose, {
    context: "Settings",
    isActive: showSubmenu === null && !isSearchMode && !headerFocused
  });
  const toggleSetting = import_react4.useCallback(() => {
    const setting_0 = filteredSettingsItems[selectedIndex];
    if (!setting_0 || !setting_0.onChange) {
      return;
    }
    if (setting_0.type === "boolean") {
      isDirty.current = true;
      setting_0.onChange(!setting_0.value);
      if (setting_0.id === "thinkingEnabled") {
        const newValue = !setting_0.value;
        const backToInitial = newValue === initialThinkingEnabled.current;
        if (backToInitial) {
          setShowThinkingWarning(false);
        } else if (context.messages.some((m_0) => m_0.type === "assistant")) {
          setShowThinkingWarning(true);
        }
      }
      return;
    }
    if (setting_0.id === "theme" || setting_0.id === "model" || setting_0.id === "teammateDefaultModel" || setting_0.id === "showExternalIncludesDialog" || setting_0.id === "outputStyle" || setting_0.id === "language") {
      switch (setting_0.id) {
        case "theme":
          setShowSubmenu("Theme");
          setTabsHidden(true);
          return;
        case "model":
          setShowSubmenu("Model");
          setTabsHidden(true);
          return;
        case "teammateDefaultModel":
          setShowSubmenu("TeammateModel");
          setTabsHidden(true);
          return;
        case "showExternalIncludesDialog":
          setShowSubmenu("ExternalIncludes");
          setTabsHidden(true);
          return;
        case "outputStyle":
          setShowSubmenu("OutputStyle");
          setTabsHidden(true);
          return;
        case "language":
          setShowSubmenu("Language");
          setTabsHidden(true);
          return;
      }
    }
    if (setting_0.id === "autoUpdatesChannel") {
      if (autoUpdaterDisabledReason) {
        setShowSubmenu("EnableAutoUpdates");
        setTabsHidden(true);
        return;
      }
      const currentChannel = settingsData?.autoUpdatesChannel ?? "latest";
      if (currentChannel === "latest") {
        setShowSubmenu("ChannelDowngrade");
        setTabsHidden(true);
      } else {
        isDirty.current = true;
        updateSettingsForSource("userSettings", {
          autoUpdatesChannel: "latest",
          minimumVersion: undefined
        });
        setSettingsData((prev_24) => ({
          ...prev_24,
          autoUpdatesChannel: "latest",
          minimumVersion: undefined
        }));
        logEvent("tengu_autoupdate_channel_changed", {
          channel: "latest"
        });
      }
      return;
    }
    if (setting_0.type === "enum") {
      isDirty.current = true;
      const currentIndex = setting_0.options.indexOf(setting_0.value);
      const nextIndex = (currentIndex + 1) % setting_0.options.length;
      setting_0.onChange(setting_0.options[nextIndex]);
      return;
    }
  }, [autoUpdaterDisabledReason, filteredSettingsItems, selectedIndex, settingsData?.autoUpdatesChannel, setTabsHidden]);
  const moveSelection = (delta) => {
    setShowThinkingWarning(false);
    const newIndex_1 = Math.max(0, Math.min(filteredSettingsItems.length - 1, selectedIndex + delta));
    setSelectedIndex(newIndex_1);
    adjustScrollOffset(newIndex_1);
  };
  useKeybindings({
    "select:previous": () => {
      if (selectedIndex === 0) {
        setShowThinkingWarning(false);
        setIsSearchMode(true);
        setScrollOffset(0);
      } else {
        moveSelection(-1);
      }
    },
    "select:next": () => moveSelection(1),
    "scroll:lineUp": () => moveSelection(-1),
    "scroll:lineDown": () => moveSelection(1),
    "select:accept": toggleSetting,
    "settings:search": () => {
      setIsSearchMode(true);
      setSearchQuery("");
    }
  }, {
    context: "Settings",
    isActive: showSubmenu === null && !isSearchMode && !headerFocused
  });
  const handleKeyDown = import_react4.useCallback((e) => {
    if (showSubmenu !== null)
      return;
    if (headerFocused)
      return;
    if (isSearchMode) {
      if (e.key === "escape") {
        e.preventDefault();
        if (searchQuery.length > 0) {
          setSearchQuery("");
        } else {
          setIsSearchMode(false);
        }
        return;
      }
      if (e.key === "return" || e.key === "down" || e.key === "wheeldown") {
        e.preventDefault();
        setIsSearchMode(false);
        setSelectedIndex(0);
        setScrollOffset(0);
      }
      return;
    }
    if (e.key === "left" || e.key === "right" || e.key === "tab") {
      e.preventDefault();
      toggleSetting();
      return;
    }
    if (e.ctrl || e.meta)
      return;
    if (e.key === "j" || e.key === "k" || e.key === "/")
      return;
    if (e.key.length === 1 && e.key !== " ") {
      e.preventDefault();
      setIsSearchMode(true);
      setSearchQuery(e.key);
    }
  }, [showSubmenu, headerFocused, isSearchMode, searchQuery, setSearchQuery, toggleSetting]);
  return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    width: "100%",
    tabIndex: 0,
    autoFocus: true,
    onKeyDown: handleKeyDown,
    children: showSubmenu === "Theme" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(jsx_dev_runtime5.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemePicker, {
          onThemeSelect: (setting_1) => {
            isDirty.current = true;
            setTheme(setting_1);
            setShowSubmenu(null);
            setTabsHidden(false);
          },
          onCancel: () => {
            setShowSubmenu(null);
            setTabsHidden(false);
          },
          hideEscToCancel: true,
          skipExitHandling: true
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                  shortcut: "Enter",
                  action: "select"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                  action: "confirm:no",
                  context: "Confirmation",
                  fallback: "Esc",
                  description: "cancel"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : showSubmenu === "Model" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(jsx_dev_runtime5.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ModelPicker, {
          initial: mainLoopModel,
          onSelect: (model_0, _effort) => {
            isDirty.current = true;
            onChangeMainModelConfig(model_0);
            setShowSubmenu(null);
            setTabsHidden(false);
          },
          onCancel: () => {
            setShowSubmenu(null);
            setTabsHidden(false);
          },
          showFastModeNotice: isFastModeEnabled() ? isFastMode && isFastModeSupportedByModel(mainLoopModel) && isFastModeAvailable() : false
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                shortcut: "Enter",
                action: "confirm"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : showSubmenu === "TeammateModel" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(jsx_dev_runtime5.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ModelPicker, {
          initial: globalConfig.teammateDefaultModel ?? null,
          skipSettingsWrite: true,
          headerText: "Default model for newly spawned teammates. The leader can override via the tool call's model parameter.",
          onSelect: (model_1, _effort_0) => {
            setShowSubmenu(null);
            setTabsHidden(false);
            if (globalConfig.teammateDefaultModel === undefined && model_1 === null) {
              return;
            }
            isDirty.current = true;
            saveGlobalConfig((current_23) => current_23.teammateDefaultModel === model_1 ? current_23 : {
              ...current_23,
              teammateDefaultModel: model_1
            });
            setGlobalConfig({
              ...getGlobalConfig(),
              teammateDefaultModel: model_1
            });
            setChanges((prev_25) => ({
              ...prev_25,
              teammateDefaultModel: teammateModelDisplayString(model_1)
            }));
            logEvent("tengu_teammate_default_model_changed", {
              model: model_1
            });
          },
          onCancel: () => {
            setShowSubmenu(null);
            setTabsHidden(false);
          }
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                shortcut: "Enter",
                action: "confirm"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : showSubmenu === "ExternalIncludes" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(jsx_dev_runtime5.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ClaudeMdExternalIncludesDialog, {
          onDone: () => {
            setShowSubmenu(null);
            setTabsHidden(false);
          },
          externalIncludes: getExternalClaudeMdIncludes(memoryFiles)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                shortcut: "Enter",
                action: "confirm"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "disable external includes"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : showSubmenu === "OutputStyle" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(jsx_dev_runtime5.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(OutputStylePicker, {
          initialStyle: currentOutputStyle,
          onComplete: (style) => {
            isDirty.current = true;
            setCurrentOutputStyle(style ?? DEFAULT_OUTPUT_STYLE_NAME);
            setShowSubmenu(null);
            setTabsHidden(false);
            updateSettingsForSource("localSettings", {
              outputStyle: style
            });
            logEvent("tengu_output_style_changed", {
              style: style ?? DEFAULT_OUTPUT_STYLE_NAME,
              source: "config_panel",
              settings_source: "localSettings"
            });
          },
          onCancel: () => {
            setShowSubmenu(null);
            setTabsHidden(false);
          }
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                shortcut: "Enter",
                action: "confirm"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : showSubmenu === "Language" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(jsx_dev_runtime5.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(LanguagePicker, {
          initialLanguage: currentLanguage,
          onComplete: (language) => {
            isDirty.current = true;
            setCurrentLanguage(language);
            setShowSubmenu(null);
            setTabsHidden(false);
            updateSettingsForSource("userSettings", {
              language
            });
            logEvent("tengu_language_changed", {
              language: language ?? "default",
              source: "config_panel"
            });
          },
          onCancel: () => {
            setShowSubmenu(null);
            setTabsHidden(false);
          }
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                shortcut: "Enter",
                action: "confirm"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Settings",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : showSubmenu === "EnableAutoUpdates" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Dialog, {
      title: "Enable Auto-Updates",
      onCancel: () => {
        setShowSubmenu(null);
        setTabsHidden(false);
      },
      hideBorder: true,
      hideInputGuide: true,
      children: autoUpdaterDisabledReason?.type !== "config" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(jsx_dev_runtime5.Fragment, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
            children: autoUpdaterDisabledReason?.type === "env" ? "Auto-updates are controlled by an environment variable and cannot be changed here." : "Auto-updates are disabled in development builds."
          }, undefined, false, undefined, this),
          autoUpdaterDisabledReason?.type === "env" && /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "Unset ",
              autoUpdaterDisabledReason.envVar,
              " to re-enable auto-updates."
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Select, {
        options: [{
          label: "Enable with latest channel",
          value: "latest"
        }, {
          label: "Enable with stable channel",
          value: "stable"
        }],
        onChange: (channel) => {
          isDirty.current = true;
          setShowSubmenu(null);
          setTabsHidden(false);
          saveGlobalConfig((current_24) => ({
            ...current_24,
            autoUpdates: true
          }));
          setGlobalConfig({
            ...getGlobalConfig(),
            autoUpdates: true
          });
          updateSettingsForSource("userSettings", {
            autoUpdatesChannel: channel,
            minimumVersion: undefined
          });
          setSettingsData((prev_26) => ({
            ...prev_26,
            autoUpdatesChannel: channel,
            minimumVersion: undefined
          }));
          logEvent("tengu_autoupdate_enabled", {
            channel
          });
        }
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this) : showSubmenu === "ChannelDowngrade" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ChannelDowngradeDialog, {
      currentVersion: MACRO.VERSION,
      onChoice: (choice) => {
        setShowSubmenu(null);
        setTabsHidden(false);
        if (choice === "cancel") {
          return;
        }
        isDirty.current = true;
        const newSettings = {
          autoUpdatesChannel: "stable"
        };
        if (choice === "stay") {
          newSettings.minimumVersion = MACRO.VERSION;
        }
        updateSettingsForSource("userSettings", newSettings);
        setSettingsData((prev_27) => ({
          ...prev_27,
          ...newSettings
        }));
        logEvent("tengu_autoupdate_channel_changed", {
          channel: "stable",
          minimum_version_set: choice === "stay"
        });
      }
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      marginY: insideModal ? undefined : 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(SearchBox, {
          query: searchQuery,
          isFocused: isSearchMode && !headerFocused,
          isTerminalFocused,
          cursorOffset: searchCursorOffset,
          placeholder: "Search settings\u2026"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: filteredSettingsItems.length === 0 ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: [
              'No settings match "',
              searchQuery,
              '"'
            ]
          }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(jsx_dev_runtime5.Fragment, {
            children: [
              scrollOffset > 0 && /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  figures_default.arrowUp,
                  " ",
                  scrollOffset,
                  " more above"
                ]
              }, undefined, true, undefined, this),
              filteredSettingsItems.slice(scrollOffset, scrollOffset + maxVisible).map((setting_2, i) => {
                const actualIndex = scrollOffset + i;
                const isSelected = actualIndex === selectedIndex && !headerFocused && !isSearchMode;
                return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(React2.Fragment, {
                  children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
                    children: [
                      /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
                        width: 44,
                        children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                          color: isSelected ? "suggestion" : undefined,
                          children: [
                            isSelected ? figures_default.pointer : " ",
                            " ",
                            setting_2.label
                          ]
                        }, undefined, true, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
                        children: setting_2.type === "boolean" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(jsx_dev_runtime5.Fragment, {
                          children: [
                            /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                              color: isSelected ? "suggestion" : undefined,
                              children: setting_2.value.toString()
                            }, undefined, false, undefined, this),
                            showThinkingWarning && setting_2.id === "thinkingEnabled" && /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                              color: "warning",
                              children: [
                                " ",
                                "Changing thinking mode mid-conversation will increase latency and may reduce quality."
                              ]
                            }, undefined, true, undefined, this)
                          ]
                        }, undefined, true, undefined, this) : setting_2.id === "theme" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                          color: isSelected ? "suggestion" : undefined,
                          children: THEME_LABELS[setting_2.value.toString()] ?? setting_2.value.toString()
                        }, undefined, false, undefined, this) : setting_2.id === "notifChannel" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                          color: isSelected ? "suggestion" : undefined,
                          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(NotifChannelLabel, {
                            value: setting_2.value.toString()
                          }, undefined, false, undefined, this)
                        }, undefined, false, undefined, this) : setting_2.id === "defaultPermissionMode" ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                          color: isSelected ? "suggestion" : undefined,
                          children: permissionModeTitle(setting_2.value)
                        }, undefined, false, undefined, this) : setting_2.id === "autoUpdatesChannel" && autoUpdaterDisabledReason ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
                          flexDirection: "column",
                          children: [
                            /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                              color: isSelected ? "suggestion" : undefined,
                              children: "disabled"
                            }, undefined, false, undefined, this),
                            /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                              dimColor: true,
                              children: [
                                "(",
                                formatAutoUpdaterDisabledReason(autoUpdaterDisabledReason),
                                ")"
                              ]
                            }, undefined, true, undefined, this)
                          ]
                        }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                          color: isSelected ? "suggestion" : undefined,
                          children: setting_2.value.toString()
                        }, undefined, false, undefined, this)
                      }, isSelected ? "selected" : "unselected", false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                }, setting_2.id, false, undefined, this);
              }),
              scrollOffset + maxVisible < filteredSettingsItems.length && /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  figures_default.arrowDown,
                  " ",
                  filteredSettingsItems.length - scrollOffset - maxVisible,
                  " ",
                  "more below"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        headerFocused ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                shortcut: "\u2190/\u2192 tab",
                action: "switch"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                shortcut: "\u2193",
                action: "return"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Settings",
                fallback: "Esc",
                description: "close"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this) : isSearchMode ? /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
                children: "Type to filter"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                shortcut: "Enter/\u2193",
                action: "select"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(KeyboardShortcutHint, {
                shortcut: "\u2191",
                action: "tabs"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Settings",
                fallback: "Esc",
                description: "clear"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "select:accept",
                context: "Settings",
                fallback: "Space",
                description: "change"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "settings:close",
                context: "Settings",
                fallback: "Enter",
                description: "save"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "settings:search",
                context: "Settings",
                fallback: "/",
                description: "search"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Settings",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function teammateModelDisplayString(value) {
  if (value === undefined) {
    return modelDisplayString(getHardcodedTeammateModelFallback());
  }
  if (value === null)
    return "Default (leader's model)";
  return modelDisplayString(value);
}
function NotifChannelLabel(t0) {
  const $ = import_compiler_runtime5.c(4);
  const {
    value
  } = t0;
  switch (value) {
    case "auto": {
      return "Auto";
    }
    case "iterm2": {
      let t1;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            "iTerm2 ",
            /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
              dimColor: true,
              children: "(OSC 9)"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[0] = t1;
      } else {
        t1 = $[0];
      }
      return t1;
    }
    case "terminal_bell": {
      let t1;
      if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            "Terminal Bell ",
            /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
              dimColor: true,
              children: "(\\a)"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[1] = t1;
      } else {
        t1 = $[1];
      }
      return t1;
    }
    case "kitty": {
      let t1;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            "Kitty ",
            /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
              dimColor: true,
              children: "(OSC 99)"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[2] = t1;
      } else {
        t1 = $[2];
      }
      return t1;
    }
    case "ghostty": {
      let t1;
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            "Ghostty ",
            /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
              dimColor: true,
              children: "(OSC 777)"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[3] = t1;
      } else {
        t1 = $[3];
      }
      return t1;
    }
    case "iterm2_with_bell": {
      return "iTerm2 w/ Bell";
    }
    case "notifications_disabled": {
      return "Disabled";
    }
    default: {
      return value;
    }
  }
}
var import_compiler_runtime5, React2, import_react4, jsx_dev_runtime5, THEME_LABELS;
var init_Config = __esm(() => {
  init_ink();
  init_useKeybinding();
  init_figures();
  init_config();
  init_authPortable();
  init_config();
  init_source();
  init_PermissionMode();
  init_permissionSetup();
  init_log();
  init_analytics();
  init_bridgeEnabled();
  init_ThemePicker();
  init_AppState();
  init_ModelPicker();
  init_model();
  init_extraUsage();
  init_ClaudeMdExternalIncludesDialog();
  init_ChannelDowngradeDialog();
  init_Dialog();
  init_CustomSelect();
  init_OutputStylePicker();
  init_LanguagePicker();
  init_claudemd();
  init_KeyboardShortcutHint();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_Tabs();
  init_modalContext();
  init_SearchBox();
  init_ide();
  init_settings();
  init_state();
  init_outputStyles();
  init_envUtils();
  init_growthbook();
  init_agentSwarmsEnabled();
  init_teammateModeSnapshot();
  init_teammateModel();
  init_useSearchInput();
  init_useTerminalSize();
  init_fastMode();
  init_fullscreen();
  import_compiler_runtime5 = __toESM(require_compiler_runtime(), 1);
  React2 = __toESM(require_react(), 1);
  import_react4 = __toESM(require_react(), 1);
  jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime(), 1);
  THEME_LABELS = {
    auto: "Auto (match terminal)",
    dark: "Dark mode",
    light: "Light mode",
    "dark-daltonized": "Dark mode (colorblind-friendly)",
    "light-daltonized": "Light mode (colorblind-friendly)",
    "dark-ansi": "Dark mode (ANSI colors only)",
    "light-ansi": "Light mode (ANSI colors only)"
  };
});

// src/components/Settings/Usage.tsx
function LimitBar(t0) {
  const $ = import_compiler_runtime6.c(34);
  const {
    title,
    limit,
    maxWidth,
    showTimeInReset: t1,
    extraSubtext
  } = t0;
  const showTimeInReset = t1 === undefined ? true : t1;
  const {
    utilization,
    resets_at
  } = limit;
  if (utilization === null) {
    return null;
  }
  const usedText = `${Math.floor(utilization)}% used`;
  let subtext;
  if (resets_at) {
    let t2;
    if ($[0] !== resets_at || $[1] !== showTimeInReset) {
      t2 = formatResetText(resets_at, true, showTimeInReset);
      $[0] = resets_at;
      $[1] = showTimeInReset;
      $[2] = t2;
    } else {
      t2 = $[2];
    }
    subtext = `Resets ${t2}`;
  }
  if (extraSubtext) {
    if (subtext) {
      subtext = `${extraSubtext} \xB7 ${subtext}`;
    } else {
      subtext = extraSubtext;
    }
  }
  if (maxWidth >= 62) {
    let t2;
    if ($[3] !== title) {
      t2 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        bold: true,
        children: title
      }, undefined, false, undefined, this);
      $[3] = title;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    const t3 = utilization / 100;
    let t4;
    if ($[5] !== t3) {
      t4 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ProgressBar, {
        ratio: t3,
        width: 50,
        fillColor: "rate_limit_fill",
        emptyColor: "rate_limit_empty"
      }, undefined, false, undefined, this);
      $[5] = t3;
      $[6] = t4;
    } else {
      t4 = $[6];
    }
    let t5;
    if ($[7] !== usedText) {
      t5 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        children: usedText
      }, undefined, false, undefined, this);
      $[7] = usedText;
      $[8] = t5;
    } else {
      t5 = $[8];
    }
    let t6;
    if ($[9] !== t4 || $[10] !== t5) {
      t6 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
        flexDirection: "row",
        gap: 1,
        children: [
          t4,
          t5
        ]
      }, undefined, true, undefined, this);
      $[9] = t4;
      $[10] = t5;
      $[11] = t6;
    } else {
      t6 = $[11];
    }
    let t7;
    if ($[12] !== subtext) {
      t7 = subtext && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        dimColor: true,
        children: subtext
      }, undefined, false, undefined, this);
      $[12] = subtext;
      $[13] = t7;
    } else {
      t7 = $[13];
    }
    let t8;
    if ($[14] !== t2 || $[15] !== t6 || $[16] !== t7) {
      t8 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t2,
          t6,
          t7
        ]
      }, undefined, true, undefined, this);
      $[14] = t2;
      $[15] = t6;
      $[16] = t7;
      $[17] = t8;
    } else {
      t8 = $[17];
    }
    return t8;
  } else {
    let t2;
    if ($[18] !== title) {
      t2 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        bold: true,
        children: title
      }, undefined, false, undefined, this);
      $[18] = title;
      $[19] = t2;
    } else {
      t2 = $[19];
    }
    let t3;
    if ($[20] !== subtext) {
      t3 = subtext && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(jsx_dev_runtime6.Fragment, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "\xB7 ",
              subtext
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[20] = subtext;
      $[21] = t3;
    } else {
      t3 = $[21];
    }
    let t4;
    if ($[22] !== t2 || $[23] !== t3) {
      t4 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        children: [
          t2,
          t3
        ]
      }, undefined, true, undefined, this);
      $[22] = t2;
      $[23] = t3;
      $[24] = t4;
    } else {
      t4 = $[24];
    }
    const t5 = utilization / 100;
    let t6;
    if ($[25] !== maxWidth || $[26] !== t5) {
      t6 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ProgressBar, {
        ratio: t5,
        width: maxWidth,
        fillColor: "rate_limit_fill",
        emptyColor: "rate_limit_empty"
      }, undefined, false, undefined, this);
      $[25] = maxWidth;
      $[26] = t5;
      $[27] = t6;
    } else {
      t6 = $[27];
    }
    let t7;
    if ($[28] !== usedText) {
      t7 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        children: usedText
      }, undefined, false, undefined, this);
      $[28] = usedText;
      $[29] = t7;
    } else {
      t7 = $[29];
    }
    let t8;
    if ($[30] !== t4 || $[31] !== t6 || $[32] !== t7) {
      t8 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t4,
          t6,
          t7
        ]
      }, undefined, true, undefined, this);
      $[30] = t4;
      $[31] = t6;
      $[32] = t7;
      $[33] = t8;
    } else {
      t8 = $[33];
    }
    return t8;
  }
}
function Usage() {
  const [utilization, setUtilization] = import_react5.useState(null);
  const [error, setError] = import_react5.useState(null);
  const [isLoading, setIsLoading] = import_react5.useState(true);
  const {
    columns
  } = useTerminalSize();
  const availableWidth = columns - 2;
  const maxWidth = Math.min(availableWidth, 80);
  const loadUtilization = React3.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUtilization();
      setUtilization(data);
    } catch (err) {
      logError(err);
      const axiosError = err;
      const responseBody = axiosError.response?.data ? jsonStringify(axiosError.response.data) : undefined;
      setError(responseBody ? `Failed to load usage data: ${responseBody}` : "Failed to load usage data");
    } finally {
      setIsLoading(false);
    }
  }, []);
  import_react5.useEffect(() => {
    loadUtilization();
  }, [loadUtilization]);
  useKeybinding("settings:retry", () => {
    loadUtilization();
  }, {
    context: "Settings",
    isActive: !!error && !isLoading
  });
  if (error) {
    return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          color: "error",
          children: [
            "Error: ",
            error
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
                action: "settings:retry",
                context: "Settings",
                fallback: "r",
                description: "retry"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Settings",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (!utilization) {
    return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          dimColor: true,
          children: "Loading usage data\u2026"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
            action: "confirm:no",
            context: "Settings",
            fallback: "Esc",
            description: "cancel"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const subscriptionType = getSubscriptionType();
  const showSonnetBar = subscriptionType === "max" || subscriptionType === "team" || subscriptionType === null;
  const limits = [{
    title: "Current session",
    limit: utilization.five_hour
  }, {
    title: "Current week (all models)",
    limit: utilization.seven_day
  }, ...showSonnetBar ? [{
    title: "Current week (Sonnet only)",
    limit: utilization.seven_day_sonnet
  }] : []];
  return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    gap: 1,
    width: "100%",
    children: [
      limits.some(({
        limit
      }) => limit) || /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        dimColor: true,
        children: "/usage is only available for subscription plans."
      }, undefined, false, undefined, this),
      limits.map(({
        title,
        limit: limit_0
      }) => limit_0 && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(LimitBar, {
        title,
        limit: limit_0,
        maxWidth
      }, title, false, undefined, this)),
      utilization.extra_usage && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ExtraUsageSection, {
        extraUsage: utilization.extra_usage,
        maxWidth
      }, undefined, false, undefined, this),
      isEligibleForOverageCreditGrant() && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(OverageCreditUpsell, {
        maxWidth
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        dimColor: true,
        children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Settings",
          fallback: "Esc",
          description: "cancel"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function ExtraUsageSection(t0) {
  const $ = import_compiler_runtime6.c(20);
  const {
    extraUsage: extraUsage2,
    maxWidth
  } = t0;
  const subscriptionType = getSubscriptionType();
  const isProOrMax = subscriptionType === "pro" || subscriptionType === "max";
  if (!isProOrMax) {
    return false;
  }
  if (!extraUsage2.is_enabled) {
    if (extraUsage.isEnabled()) {
      let t12;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              bold: true,
              children: EXTRA_USAGE_SECTION_TITLE
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Extra usage not enabled \xB7 /extra-usage to enable"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[0] = t12;
      } else {
        t12 = $[0];
      }
      return t12;
    }
    return null;
  }
  if (extraUsage2.monthly_limit === null) {
    let t12;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            bold: true,
            children: EXTRA_USAGE_SECTION_TITLE
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Unlimited"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[1] = t12;
    } else {
      t12 = $[1];
    }
    return t12;
  }
  if (typeof extraUsage2.used_credits !== "number" || typeof extraUsage2.utilization !== "number") {
    return null;
  }
  const t1 = extraUsage2.used_credits / 100;
  let t2;
  if ($[2] !== t1) {
    t2 = formatCost(t1, 2);
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const formattedUsedCredits = t2;
  const t3 = extraUsage2.monthly_limit / 100;
  let t4;
  if ($[4] !== t3) {
    t4 = formatCost(t3, 2);
    $[4] = t3;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const formattedMonthlyLimit = t4;
  let T0;
  let t5;
  let t6;
  let t7;
  if ($[6] !== extraUsage2.utilization) {
    const now = new Date;
    const oneMonthReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    T0 = LimitBar;
    t7 = EXTRA_USAGE_SECTION_TITLE;
    t5 = extraUsage2.utilization;
    t6 = oneMonthReset.toISOString();
    $[6] = extraUsage2.utilization;
    $[7] = T0;
    $[8] = t5;
    $[9] = t6;
    $[10] = t7;
  } else {
    T0 = $[7];
    t5 = $[8];
    t6 = $[9];
    t7 = $[10];
  }
  let t8;
  if ($[11] !== t5 || $[12] !== t6) {
    t8 = {
      utilization: t5,
      resets_at: t6
    };
    $[11] = t5;
    $[12] = t6;
    $[13] = t8;
  } else {
    t8 = $[13];
  }
  const t9 = `${formattedUsedCredits} / ${formattedMonthlyLimit} spent`;
  let t10;
  if ($[14] !== T0 || $[15] !== maxWidth || $[16] !== t7 || $[17] !== t8 || $[18] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(T0, {
      title: t7,
      limit: t8,
      showTimeInReset: false,
      extraSubtext: t9,
      maxWidth
    }, undefined, false, undefined, this);
    $[14] = T0;
    $[15] = maxWidth;
    $[16] = t7;
    $[17] = t8;
    $[18] = t9;
    $[19] = t10;
  } else {
    t10 = $[19];
  }
  return t10;
}
var import_compiler_runtime6, React3, import_react5, jsx_dev_runtime6, EXTRA_USAGE_SECTION_TITLE = "Extra usage";
var init_Usage = __esm(() => {
  init_extra_usage();
  init_cost_tracker();
  init_auth();
  init_useTerminalSize();
  init_ink();
  init_useKeybinding();
  init_usage();
  init_format();
  init_log();
  init_slowOperations();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_ProgressBar();
  init_OverageCreditUpsell();
  import_compiler_runtime6 = __toESM(require_compiler_runtime(), 1);
  React3 = __toESM(require_react(), 1);
  import_react5 = __toESM(require_react(), 1);
  jsx_dev_runtime6 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/Settings/Settings.tsx
function Settings(t0) {
  const $ = import_compiler_runtime7.c(25);
  const {
    onClose,
    context,
    defaultTab
  } = t0;
  const [selectedTab, setSelectedTab] = import_react6.useState(defaultTab);
  const [tabsHidden, setTabsHidden] = import_react6.useState(false);
  const [configOwnsEsc, setConfigOwnsEsc] = import_react6.useState(false);
  const [gatesOwnsEsc, setGatesOwnsEsc] = import_react6.useState(false);
  const insideModal = useIsInsideModal();
  const {
    rows
  } = useModalOrTerminalSize(useTerminalSize());
  const contentHeight = insideModal ? rows + 1 : Math.max(15, Math.min(Math.floor(rows * 0.8), 30));
  const [diagnosticsPromise] = import_react6.useState(_temp22);
  useExitOnCtrlCDWithKeybindings();
  let t1;
  if ($[0] !== onClose || $[1] !== tabsHidden) {
    t1 = () => {
      if (tabsHidden) {
        return;
      }
      onClose("Status dialog dismissed", {
        display: "system"
      });
    };
    $[0] = onClose;
    $[1] = tabsHidden;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const handleEscape = t1;
  const t2 = !tabsHidden && !(selectedTab === "Config" && configOwnsEsc) && !(selectedTab === "Gates" && gatesOwnsEsc);
  let t3;
  if ($[3] !== t2) {
    t3 = {
      context: "Settings",
      isActive: t2
    };
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  useKeybinding("confirm:no", handleEscape, t3);
  let t4;
  if ($[5] !== context || $[6] !== diagnosticsPromise) {
    t4 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tab, {
      title: "Status",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Status, {
        context,
        diagnosticsPromise
      }, undefined, false, undefined, this)
    }, "status", false, undefined, this);
    $[5] = context;
    $[6] = diagnosticsPromise;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== contentHeight || $[9] !== context || $[10] !== onClose) {
    t5 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tab, {
      title: "Config",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(import_react6.Suspense, {
        fallback: null,
        children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Config, {
          context,
          onClose,
          setTabsHidden,
          onIsSearchModeChange: setConfigOwnsEsc,
          contentHeight
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    }, "config", false, undefined, this);
    $[8] = contentHeight;
    $[9] = context;
    $[10] = onClose;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  let t6;
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tab, {
      title: "Usage",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Usage, {}, undefined, false, undefined, this)
    }, "usage", false, undefined, this);
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  let t7;
  if ($[13] !== contentHeight) {
    const GatesComponent = Gates;
    t7 = [];
    $[13] = contentHeight;
    $[14] = t7;
  } else {
    t7 = $[14];
  }
  let t8;
  if ($[15] !== t4 || $[16] !== t5 || $[17] !== t7) {
    t8 = [t4, t5, t6, ...t7];
    $[15] = t4;
    $[16] = t5;
    $[17] = t7;
    $[18] = t8;
  } else {
    t8 = $[18];
  }
  const tabs = t8;
  const t9 = defaultTab !== "Config" && defaultTab !== "Gates";
  const t10 = tabsHidden || insideModal ? undefined : contentHeight;
  let t11;
  if ($[19] !== selectedTab || $[20] !== t10 || $[21] !== t9 || $[22] !== tabs || $[23] !== tabsHidden) {
    t11 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Pane, {
      color: "permission",
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Tabs, {
        color: "permission",
        selectedTab,
        onTabChange: setSelectedTab,
        hidden: tabsHidden,
        initialHeaderFocused: t9,
        contentHeight: t10,
        children: tabs
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[19] = selectedTab;
    $[20] = t10;
    $[21] = t9;
    $[22] = tabs;
    $[23] = tabsHidden;
    $[24] = t11;
  } else {
    t11 = $[24];
  }
  return t11;
}
function _temp22() {
  return buildDiagnostics().catch(_temp6);
}
function _temp6() {
  return [];
}
var import_compiler_runtime7, import_react6, jsx_dev_runtime7;
var init_Settings = __esm(() => {
  init_useKeybinding();
  init_useExitOnCtrlCDWithKeybindings();
  init_useTerminalSize();
  init_modalContext();
  init_Pane();
  init_Tabs();
  init_Status();
  init_Config();
  init_Usage();
  import_compiler_runtime7 = __toESM(require_compiler_runtime(), 1);
  import_react6 = __toESM(require_react(), 1);
  jsx_dev_runtime7 = __toESM(require_jsx_dev_runtime(), 1);
});

export { Settings, init_Settings };
