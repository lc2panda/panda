// @bun
import {
  formatInstallCount,
  getInstallCounts,
  init_installCounts,
  init_parseMarketplaceInput,
  init_validatePlugin,
  parseMarketplaceInput,
  validateManifest
} from "./chunk-7wycv294.js";
import {
  init_MCPConnectionManager,
  useMcpReconnect,
  useMcpToggleEnabled
} from "./chunk-1vfyfzke.js";
import {
  getFlaggedPlugins,
  init_pluginFlagging,
  markFlaggedPluginsSeen,
  removeFlaggedPlugin
} from "./chunk-7xwxa47w.js";
import {
  init_pluginAutoupdate,
  updatePluginsForMarketplaces
} from "./chunk-8qpqccey.js";
import {
  disablePluginOp,
  enablePluginOp,
  getPluginInstallationFromV2,
  init_pluginOperations,
  isInstallableScope,
  isPluginEnabledAtProjectScope,
  uninstallPluginOp,
  updatePluginOp
} from "./chunk-htpyze82.js";
import {
  getPluginEditableScopes,
  init_pluginStartupCheck
} from "./chunk-vrk7h66v.js";
import {
  SearchBox,
  init_SearchBox,
  init_useSearchInput,
  useSearchInput
} from "./chunk-4th7m2zk.js";
import {
  Tab,
  Tabs,
  init_Tabs
} from "./chunk-5rsyjdzb.js";
import {
  AuthenticationCancelledError,
  OFFICIAL_MARKETPLACE_NAME,
  Select,
  Spinner,
  TextInput,
  addMarketplaceSource,
  clearAllCaches,
  clearServerCache,
  createPluginId,
  describeMcpConfigFilePath,
  detectEmptyMarketplaceReason,
  excludeCommandsByServer,
  excludeResourcesByServer,
  excludeToolsByServer,
  filterMcpPromptsByServer,
  filterToolsByServer,
  formatFailureDetails,
  formatMarketplaceLoadingErrors,
  getBuiltinPluginDefinition,
  getMarketplace,
  getMarketplaceSourceDisplay,
  getMcpConfigByName,
  getPluginDataDirSize,
  getPluginErrorMessage,
  getPluginTrustMessage,
  getUnconfiguredChannels,
  getUnconfiguredOptions,
  init_AppState,
  init_CustomSelect,
  init_Spinner,
  init_TextInput,
  init_auth as init_auth2,
  init_builtinPlugins,
  init_cacheUtils,
  init_client,
  init_config as init_config2,
  init_installedPluginsManager,
  init_marketplaceHelpers,
  init_marketplaceManager,
  init_mcpPluginIntegration,
  init_mcpbHandler,
  init_officialMarketplace,
  init_plugin,
  init_pluginDirectories,
  init_pluginInstallationHelpers,
  init_pluginLoader,
  init_pluginOptionsStorage,
  init_pluginPolicy,
  init_utils,
  installPluginFromMarketplace,
  isMcpbSource,
  isPluginBlockedByPolicy,
  isPluginGloballyInstalled,
  isPluginInstalled,
  loadAllPlugins,
  loadInstalledPluginsV2,
  loadKnownMarketplacesConfig,
  loadMarketplacesWithGracefulDegradation,
  loadMcpServerUserConfig,
  loadMcpbFile,
  loadPluginOptions,
  performMCPOAuthFlow,
  pluginDataDirPath,
  refreshMarketplace,
  removeMarketplaceSource,
  revokeServerTokens,
  saveMarketplaceToSettings,
  saveMcpServerUserConfig,
  savePluginOptions,
  setMarketplaceAutoUpdate,
  useAppState,
  useSetAppState
} from "./chunk-wk0emb79.js";
import {
  init_pluginIdentifier,
  parsePluginIdentifier
} from "./chunk-65xxc9v8.js";
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
  init_useKeybinding,
  init_useTerminalSize,
  useKeybinding,
  useKeybindings,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  Link,
  ThemedBox_default,
  ThemedText,
  color,
  init_ink,
  init_osc,
  require_compiler_runtime,
  setClipboard,
  useTerminalFocus,
  useTheme,
  use_input_default
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_browser,
  openBrowser
} from "./chunk-e046tp8q.js";
import {
  capitalize,
  extractMcpToolDisplayName,
  getMcpDisplayName,
  getOauthAccountInfo,
  getSettingsForSource,
  getSettings_DEPRECATED,
  init_auth,
  init_config1 as init_config,
  init_mcpStringUtils,
  init_schemas,
  init_settings1 as init_settings,
  init_stringUtils,
  isMarketplaceAutoUpdate,
  plural,
  shouldSkipPluginAutoupdate,
  updateSettingsForSource
} from "./chunk-bt6e264h.js";
import {
  count,
  init_array
} from "./chunk-0e1xsncc.js";
import {
  getOauthConfig,
  init_oauth
} from "./chunk-7ymfj7m3.js";
import {
  init_stringWidth,
  init_truncate,
  stringWidth,
  truncateToWidth
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
  logError,
  logMCPDebug
} from "./chunk-43vdtd69.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  init_slowOperations,
  jsonParse,
  logForDebugging,
  toError
} from "./chunk-71hncdva.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-3r24h7t6.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/plugin/AddMarketplace.tsx
function AddMarketplace({
  inputValue,
  setInputValue,
  cursorOffset,
  setCursorOffset,
  error,
  setError,
  result,
  setResult,
  setViewState,
  onAddComplete,
  cliMode = false
}) {
  const hasAttemptedAutoAdd = import_react.useRef(false);
  const [isLoading, setLoading] = import_react.useState(false);
  const [progressMessage, setProgressMessage] = import_react.useState("");
  const handleAdd = async () => {
    const input = inputValue.trim();
    if (!input) {
      setError("Please enter a marketplace source");
      return;
    }
    const parsed = await parseMarketplaceInput(input);
    if (!parsed) {
      setError("Invalid marketplace source format. Try: owner/repo, https://..., or ./path");
      return;
    }
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    setError(null);
    try {
      setLoading(true);
      setProgressMessage("");
      const {
        name,
        resolvedSource
      } = await addMarketplaceSource(parsed, (message) => {
        setProgressMessage(message);
      });
      saveMarketplaceToSettings(name, {
        source: resolvedSource
      });
      clearAllCaches();
      let sourceType = parsed.source;
      if (parsed.source === "github") {
        sourceType = parsed.repo;
      }
      logEvent("tengu_marketplace_added", {
        source_type: sourceType
      });
      if (onAddComplete) {
        await onAddComplete();
      }
      setProgressMessage("");
      setLoading(false);
      if (cliMode) {
        setResult(`Successfully added marketplace: ${name}`);
      } else {
        setViewState({
          type: "browse-marketplace",
          targetMarketplace: name
        });
      }
    } catch (err) {
      const error2 = toError(err);
      logError(error2);
      setError(error2.message);
      setProgressMessage("");
      setLoading(false);
      if (cliMode) {
        setResult(`Error: ${error2.message}`);
      } else {
        setResult(null);
      }
    }
  };
  import_react.useEffect(() => {
    if (inputValue && !hasAttemptedAutoAdd.current && !error && !result) {
      hasAttemptedAutoAdd.current = true;
      handleAdd();
    }
  }, []);
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        paddingX: 1,
        borderStyle: "round",
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginBottom: 1,
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              bold: true,
              children: "Add Marketplace"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: "Enter marketplace source:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: "Examples:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: " \xB7 owner/repo (GitHub)"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: " \xB7 git@github.com:owner/repo.git (SSH)"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: " \xB7 https://example.com/marketplace.json"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: " \xB7 ./path/to/marketplace"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                marginTop: 1,
                children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(TextInput, {
                  value: inputValue,
                  onChange: setInputValue,
                  onSubmit: handleAdd,
                  columns: 80,
                  cursorOffset,
                  onChangeCursorOffset: setCursorOffset,
                  focus: true,
                  showCursor: true
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          isLoading && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: progressMessage || "Adding marketplace to configuration\u2026"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          error && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              color: "error",
              children: error
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          result && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: result
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        marginLeft: 3,
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          italic: true,
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
                shortcut: "Enter",
                action: "add"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Settings",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var import_react, jsx_dev_runtime;
var init_AddMarketplace = __esm(() => {
  init_analytics();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_Spinner();
  init_TextInput();
  init_ink();
  init_errors();
  init_log();
  init_cacheUtils();
  init_marketplaceManager();
  init_parseMarketplaceInput();
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/PluginOptionsDialog.tsx
function buildFinalValues(fields, collected, configSchema, initialValues) {
  const finalValues = {};
  for (const fieldKey of fields) {
    const schema = configSchema[fieldKey];
    const value = collected[fieldKey] ?? "";
    if (schema?.sensitive === true && value === "" && initialValues?.[fieldKey] !== undefined) {
      continue;
    }
    if (schema?.type === "number") {
      if (value.trim() === "")
        continue;
      const num = Number(value);
      finalValues[fieldKey] = Number.isNaN(num) ? value : num;
    } else if (schema?.type === "boolean") {
      finalValues[fieldKey] = isEnvTruthy(value);
    } else {
      finalValues[fieldKey] = value;
    }
  }
  return finalValues;
}
function PluginOptionsDialog(t0) {
  const $ = import_compiler_runtime.c(70);
  const {
    title,
    subtitle,
    configSchema,
    initialValues,
    onSave,
    onCancel
  } = t0;
  let t1;
  if ($[0] !== configSchema) {
    t1 = Object.keys(configSchema);
    $[0] = configSchema;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const fields = t1;
  let t2;
  if ($[2] !== configSchema || $[3] !== initialValues) {
    t2 = (key) => {
      if (configSchema[key]?.sensitive === true) {
        return "";
      }
      const v = initialValues?.[key];
      return v === undefined ? "" : String(v);
    };
    $[2] = configSchema;
    $[3] = initialValues;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const initialFor = t2;
  const [currentFieldIndex, setCurrentFieldIndex] = import_react2.useState(0);
  let t3;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = {};
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const [values, setValues] = import_react2.useState(t3);
  let t4;
  if ($[6] !== fields[0] || $[7] !== initialFor) {
    t4 = () => fields[0] ? initialFor(fields[0]) : "";
    $[6] = fields[0];
    $[7] = initialFor;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  const [currentInput, setCurrentInput] = import_react2.useState(t4);
  const currentField = fields[currentFieldIndex];
  const fieldSchema = currentField ? configSchema[currentField] : null;
  let t5;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = {
      context: "Settings"
    };
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  useKeybinding("confirm:no", onCancel, t5);
  let t6;
  if ($[10] !== currentField || $[11] !== currentFieldIndex || $[12] !== currentInput || $[13] !== fields || $[14] !== initialFor) {
    t6 = () => {
      if (currentFieldIndex < fields.length - 1 && currentField) {
        setValues((prev) => ({
          ...prev,
          [currentField]: currentInput
        }));
        setCurrentFieldIndex(_temp);
        const nextKey = fields[currentFieldIndex + 1];
        setCurrentInput(nextKey ? initialFor(nextKey) : "");
      }
    };
    $[10] = currentField;
    $[11] = currentFieldIndex;
    $[12] = currentInput;
    $[13] = fields;
    $[14] = initialFor;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  const handleNextField = t6;
  let t7;
  if ($[16] !== configSchema || $[17] !== currentField || $[18] !== currentFieldIndex || $[19] !== currentInput || $[20] !== fields || $[21] !== initialFor || $[22] !== initialValues || $[23] !== onSave || $[24] !== values) {
    t7 = () => {
      if (!currentField) {
        return;
      }
      const newValues = {
        ...values,
        [currentField]: currentInput
      };
      if (currentFieldIndex === fields.length - 1) {
        onSave(buildFinalValues(fields, newValues, configSchema, initialValues));
      } else {
        setValues(newValues);
        setCurrentFieldIndex(_temp2);
        const nextKey_0 = fields[currentFieldIndex + 1];
        setCurrentInput(nextKey_0 ? initialFor(nextKey_0) : "");
      }
    };
    $[16] = configSchema;
    $[17] = currentField;
    $[18] = currentFieldIndex;
    $[19] = currentInput;
    $[20] = fields;
    $[21] = initialFor;
    $[22] = initialValues;
    $[23] = onSave;
    $[24] = values;
    $[25] = t7;
  } else {
    t7 = $[25];
  }
  const handleConfirm = t7;
  let t8;
  if ($[26] !== handleConfirm || $[27] !== handleNextField) {
    t8 = {
      "confirm:nextField": handleNextField,
      "confirm:yes": handleConfirm
    };
    $[26] = handleConfirm;
    $[27] = handleNextField;
    $[28] = t8;
  } else {
    t8 = $[28];
  }
  let t9;
  if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = {
      context: "Confirmation"
    };
    $[29] = t9;
  } else {
    t9 = $[29];
  }
  useKeybindings(t8, t9);
  let t10;
  if ($[30] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = (char, key_0) => {
      if (key_0.backspace || key_0.delete) {
        setCurrentInput(_temp3);
        return;
      }
      if (char && !key_0.ctrl && !key_0.meta && !key_0.tab && !key_0.return) {
        setCurrentInput((prev_3) => prev_3 + char);
      }
    };
    $[30] = t10;
  } else {
    t10 = $[30];
  }
  use_input_default(t10);
  if (!fieldSchema || !currentField) {
    return null;
  }
  const isSensitive = fieldSchema.sensitive === true;
  const isRequired = fieldSchema.required === true;
  let t11;
  if ($[31] !== currentInput || $[32] !== isSensitive) {
    t11 = isSensitive ? "*".repeat(stringWidth(currentInput)) : currentInput;
    $[31] = currentInput;
    $[32] = isSensitive;
    $[33] = t11;
  } else {
    t11 = $[33];
  }
  const displayValue = t11;
  const t12 = fieldSchema.title || currentField;
  let t13;
  if ($[34] !== isRequired) {
    t13 = isRequired && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      color: "error",
      children: " *"
    }, undefined, false, undefined, this);
    $[34] = isRequired;
    $[35] = t13;
  } else {
    t13 = $[35];
  }
  let t14;
  if ($[36] !== t12 || $[37] !== t13) {
    t14 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      bold: true,
      children: [
        t12,
        t13
      ]
    }, undefined, true, undefined, this);
    $[36] = t12;
    $[37] = t13;
    $[38] = t14;
  } else {
    t14 = $[38];
  }
  let t15;
  if ($[39] !== fieldSchema.description) {
    t15 = fieldSchema.description && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: fieldSchema.description
    }, undefined, false, undefined, this);
    $[39] = fieldSchema.description;
    $[40] = t15;
  } else {
    t15 = $[40];
  }
  let t16;
  if ($[41] === Symbol.for("react.memo_cache_sentinel")) {
    t16 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: [
        figures_default.pointerSmall,
        " "
      ]
    }, undefined, true, undefined, this);
    $[41] = t16;
  } else {
    t16 = $[41];
  }
  let t17;
  if ($[42] !== displayValue) {
    t17 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: displayValue
    }, undefined, false, undefined, this);
    $[42] = displayValue;
    $[43] = t17;
  } else {
    t17 = $[43];
  }
  let t18;
  if ($[44] === Symbol.for("react.memo_cache_sentinel")) {
    t18 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: "\u2588"
    }, undefined, false, undefined, this);
    $[44] = t18;
  } else {
    t18 = $[44];
  }
  let t19;
  if ($[45] !== t17) {
    t19 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: [
        t16,
        t17,
        t18
      ]
    }, undefined, true, undefined, this);
    $[45] = t17;
    $[46] = t19;
  } else {
    t19 = $[46];
  }
  let t20;
  if ($[47] !== t14 || $[48] !== t15 || $[49] !== t19) {
    t20 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t14,
        t15,
        t19
      ]
    }, undefined, true, undefined, this);
    $[47] = t14;
    $[48] = t15;
    $[49] = t19;
    $[50] = t20;
  } else {
    t20 = $[50];
  }
  const t21 = currentFieldIndex + 1;
  let t22;
  if ($[51] !== fields.length || $[52] !== t21) {
    t22 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "Field ",
        t21,
        " of ",
        fields.length
      ]
    }, undefined, true, undefined, this);
    $[51] = fields.length;
    $[52] = t21;
    $[53] = t22;
  } else {
    t22 = $[53];
  }
  let t23;
  if ($[54] !== currentFieldIndex || $[55] !== fields.length) {
    t23 = currentFieldIndex < fields.length - 1 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Tab: Next field \xB7 Enter: Save and continue"
    }, undefined, false, undefined, this);
    $[54] = currentFieldIndex;
    $[55] = fields.length;
    $[56] = t23;
  } else {
    t23 = $[56];
  }
  let t24;
  if ($[57] !== currentFieldIndex || $[58] !== fields.length) {
    t24 = currentFieldIndex === fields.length - 1 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Enter: Save configuration"
    }, undefined, false, undefined, this);
    $[57] = currentFieldIndex;
    $[58] = fields.length;
    $[59] = t24;
  } else {
    t24 = $[59];
  }
  let t25;
  if ($[60] !== t22 || $[61] !== t23 || $[62] !== t24) {
    t25 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t22,
        t23,
        t24
      ]
    }, undefined, true, undefined, this);
    $[60] = t22;
    $[61] = t23;
    $[62] = t24;
    $[63] = t25;
  } else {
    t25 = $[63];
  }
  let t26;
  if ($[64] !== onCancel || $[65] !== subtitle || $[66] !== t20 || $[67] !== t25 || $[68] !== title) {
    t26 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
      title,
      subtitle,
      onCancel,
      isCancelActive: false,
      children: [
        t20,
        t25
      ]
    }, undefined, true, undefined, this);
    $[64] = onCancel;
    $[65] = subtitle;
    $[66] = t20;
    $[67] = t25;
    $[68] = title;
    $[69] = t26;
  } else {
    t26 = $[69];
  }
  return t26;
}
function _temp3(prev_2) {
  return prev_2.slice(0, -1);
}
function _temp2(prev_1) {
  return prev_1 + 1;
}
function _temp(prev_0) {
  return prev_0 + 1;
}
var import_compiler_runtime, import_react2, jsx_dev_runtime2;
var init_PluginOptionsDialog = __esm(() => {
  init_figures();
  init_Dialog();
  init_stringWidth();
  init_ink();
  init_useKeybinding();
  init_envUtils();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/PluginOptionsFlow.tsx
async function findPluginOptionsTarget(pluginId) {
  const {
    enabled,
    disabled
  } = await loadAllPlugins();
  return [...enabled, ...disabled].find((p) => p.repository === pluginId || p.source === pluginId);
}
function PluginOptionsFlow({
  plugin,
  pluginId,
  onDone
}) {
  const [steps] = React2.useState(() => {
    const result = [];
    const unconfigured = getUnconfiguredOptions(plugin);
    if (Object.keys(unconfigured).length > 0) {
      result.push({
        key: "top-level",
        title: `Configure ${plugin.name}`,
        subtitle: "Plugin options",
        schema: unconfigured,
        load: () => loadPluginOptions(pluginId),
        save: (values) => savePluginOptions(pluginId, values, plugin.manifest.userConfig)
      });
    }
    const channels = getUnconfiguredChannels(plugin);
    for (const channel of channels) {
      result.push({
        key: `channel:${channel.server}`,
        title: `Configure ${channel.displayName}`,
        subtitle: `Plugin: ${plugin.name}`,
        schema: channel.configSchema,
        load: () => loadMcpServerUserConfig(pluginId, channel.server) ?? undefined,
        save: (values_0) => saveMcpServerUserConfig(pluginId, channel.server, values_0, channel.configSchema)
      });
    }
    return result;
  });
  const [index, setIndex] = React2.useState(0);
  const onDoneRef = React2.useRef(onDone);
  onDoneRef.current = onDone;
  React2.useEffect(() => {
    if (steps.length === 0) {
      onDoneRef.current("skipped");
    }
  }, [steps.length]);
  if (steps.length === 0) {
    return null;
  }
  const current = steps[index];
  function handleSave(values_1) {
    try {
      current.save(values_1);
    } catch (err) {
      onDone("error", errorMessage(err));
      return;
    }
    const next = index + 1;
    if (next < steps.length) {
      setIndex(next);
    } else {
      onDone("configured");
    }
  }
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(PluginOptionsDialog, {
    title: current.title,
    subtitle: current.subtitle,
    configSchema: current.schema,
    initialValues: current.load(),
    onSave: handleSave,
    onCancel: () => onDone("skipped")
  }, current.key, false, undefined, this);
}
var React2, jsx_dev_runtime3;
var init_PluginOptionsFlow = __esm(() => {
  init_errors();
  init_mcpbHandler();
  init_mcpPluginIntegration();
  init_pluginLoader();
  init_pluginOptionsStorage();
  init_PluginOptionsDialog();
  React2 = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/PluginTrustWarning.tsx
function PluginTrustWarning() {
  const $ = import_compiler_runtime2.c(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = getPluginTrustMessage();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const customMessage = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      color: "claude",
      children: [
        figures_default.warning,
        " "
      ]
    }, undefined, true, undefined, this);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      marginBottom: 1,
      children: [
        t1,
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
          dimColor: true,
          italic: true,
          children: [
            "Make sure you trust a plugin before installing, updating, or using it. Anthropic does not control what MCP servers, files, or other software are included in plugins and cannot verify that they will work as intended or that they won't change. See each plugin's homepage for more information.",
            customMessage ? ` ${customMessage}` : ""
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}
var import_compiler_runtime2, jsx_dev_runtime4;
var init_PluginTrustWarning = __esm(() => {
  init_figures();
  init_ink();
  init_marketplaceHelpers();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/pluginDetailsHelpers.tsx
function extractGitHubRepo(plugin) {
  const isGitHub = plugin.entry.source && typeof plugin.entry.source === "object" && "source" in plugin.entry.source && plugin.entry.source.source === "github";
  if (isGitHub && typeof plugin.entry.source === "object" && "repo" in plugin.entry.source) {
    return plugin.entry.source.repo;
  }
  return null;
}
function buildPluginDetailsMenuOptions(hasHomepage, githubRepo) {
  const options = [{
    label: "Install for you (user scope)",
    action: "install-user"
  }, {
    label: "Install for all collaborators on this repository (project scope)",
    action: "install-project"
  }, {
    label: "Install for you, in this repo only (local scope)",
    action: "install-local"
  }];
  if (hasHomepage) {
    options.push({
      label: "Open homepage",
      action: "homepage"
    });
  }
  if (githubRepo) {
    options.push({
      label: "View on GitHub",
      action: "github"
    });
  }
  options.push({
    label: "Back to plugin list",
    action: "back"
  });
  return options;
}
function PluginSelectionKeyHint(t0) {
  const $ = import_compiler_runtime3.c(7);
  const {
    hasSelection
  } = t0;
  let t1;
  if ($[0] !== hasSelection) {
    t1 = hasSelection && /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
      action: "plugin:install",
      context: "Plugin",
      fallback: "i",
      description: "install",
      bold: true
    }, undefined, false, undefined, this);
    $[0] = hasSelection;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  let t3;
  let t4;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
      action: "plugin:toggle",
      context: "Plugin",
      fallback: "Space",
      description: "toggle"
    }, undefined, false, undefined, this);
    t3 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
      action: "select:accept",
      context: "Select",
      fallback: "Enter",
      description: "details"
    }, undefined, false, undefined, this);
    t4 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ConfigurableShortcutHint, {
      action: "confirm:no",
      context: "Confirmation",
      fallback: "Esc",
      description: "back"
    }, undefined, false, undefined, this);
    $[2] = t2;
    $[3] = t3;
    $[4] = t4;
  } else {
    t2 = $[2];
    t3 = $[3];
    t4 = $[4];
  }
  let t5;
  if ($[5] !== t1) {
    t5 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Byline, {
          children: [
            t1,
            t2,
            t3,
            t4
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[5] = t1;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  return t5;
}
var import_compiler_runtime3, jsx_dev_runtime5;
var init_pluginDetailsHelpers = __esm(() => {
  init_ConfigurableShortcutHint();
  init_Byline();
  init_ink();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/usePagination.ts
function usePagination({
  totalItems,
  maxVisible = DEFAULT_MAX_VISIBLE,
  selectedIndex = 0
}) {
  const needsPagination = totalItems > maxVisible;
  const scrollOffsetRef = import_react3.useRef(0);
  const scrollOffset = import_react3.useMemo(() => {
    if (!needsPagination)
      return 0;
    const prevOffset = scrollOffsetRef.current;
    if (selectedIndex < prevOffset) {
      scrollOffsetRef.current = selectedIndex;
      return selectedIndex;
    }
    if (selectedIndex >= prevOffset + maxVisible) {
      const newOffset = selectedIndex - maxVisible + 1;
      scrollOffsetRef.current = newOffset;
      return newOffset;
    }
    const maxOffset = Math.max(0, totalItems - maxVisible);
    const clampedOffset = Math.min(prevOffset, maxOffset);
    scrollOffsetRef.current = clampedOffset;
    return clampedOffset;
  }, [selectedIndex, maxVisible, needsPagination, totalItems]);
  const startIndex = scrollOffset;
  const endIndex = Math.min(scrollOffset + maxVisible, totalItems);
  const getVisibleItems = import_react3.useCallback((items) => {
    if (!needsPagination)
      return items;
    return items.slice(startIndex, endIndex);
  }, [needsPagination, startIndex, endIndex]);
  const toActualIndex = import_react3.useCallback((visibleIndex) => {
    return startIndex + visibleIndex;
  }, [startIndex]);
  const isOnCurrentPage = import_react3.useCallback((actualIndex) => {
    return actualIndex >= startIndex && actualIndex < endIndex;
  }, [startIndex, endIndex]);
  const goToPage = import_react3.useCallback((_page) => {}, []);
  const nextPage = import_react3.useCallback(() => {}, []);
  const prevPage = import_react3.useCallback(() => {}, []);
  const handleSelectionChange = import_react3.useCallback((newIndex, setSelectedIndex) => {
    const clampedIndex = Math.max(0, Math.min(newIndex, totalItems - 1));
    setSelectedIndex(clampedIndex);
  }, [totalItems]);
  const handlePageNavigation = import_react3.useCallback((_direction, _setSelectedIndex) => {
    return false;
  }, []);
  const totalPages = Math.max(1, Math.ceil(totalItems / maxVisible));
  const currentPage = Math.floor(scrollOffset / maxVisible);
  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    needsPagination,
    pageSize: maxVisible,
    getVisibleItems,
    toActualIndex,
    isOnCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    handleSelectionChange,
    handlePageNavigation,
    scrollPosition: {
      current: selectedIndex + 1,
      total: totalItems,
      canScrollUp: scrollOffset > 0,
      canScrollDown: scrollOffset + maxVisible < totalItems
    }
  };
}
var import_react3, DEFAULT_MAX_VISIBLE = 5;
var init_usePagination = __esm(() => {
  import_react3 = __toESM(require_react(), 1);
});

// src/commands/plugin/BrowseMarketplace.tsx
function BrowseMarketplace({
  error,
  setError,
  result: _result,
  setResult,
  setViewState: setParentViewState,
  onInstallComplete,
  targetMarketplace,
  targetPlugin
}) {
  const [viewState, setViewState] = import_react4.useState("marketplace-list");
  const [selectedMarketplace, setSelectedMarketplace] = import_react4.useState(null);
  const [selectedPlugin, setSelectedPlugin] = import_react4.useState(null);
  const [marketplaces, setMarketplaces] = import_react4.useState([]);
  const [availablePlugins, setAvailablePlugins] = import_react4.useState([]);
  const [loading, setLoading] = import_react4.useState(true);
  const [installCounts, setInstallCounts] = import_react4.useState(null);
  const [selectedIndex, setSelectedIndex] = import_react4.useState(0);
  const [selectedForInstall, setSelectedForInstall] = import_react4.useState(new Set);
  const [installingPlugins, setInstallingPlugins] = import_react4.useState(new Set);
  const pagination = usePagination({
    totalItems: availablePlugins.length,
    selectedIndex
  });
  const [detailsMenuIndex, setDetailsMenuIndex] = import_react4.useState(0);
  const [isInstalling, setIsInstalling] = import_react4.useState(false);
  const [installError, setInstallError] = import_react4.useState(null);
  const [warning, setWarning] = import_react4.useState(null);
  const handleBack = React3.useCallback(() => {
    if (viewState === "plugin-list") {
      if (targetMarketplace) {
        setParentViewState({
          type: "manage-marketplaces",
          targetMarketplace
        });
      } else if (marketplaces.length === 1) {
        setParentViewState({
          type: "menu"
        });
      } else {
        setViewState("marketplace-list");
        setSelectedMarketplace(null);
        setSelectedForInstall(new Set);
      }
    } else if (viewState === "plugin-details") {
      setViewState("plugin-list");
      setSelectedPlugin(null);
    } else {
      setParentViewState({
        type: "menu"
      });
    }
  }, [viewState, targetMarketplace, setParentViewState, marketplaces.length]);
  useKeybinding("confirm:no", handleBack, {
    context: "Confirmation"
  });
  import_react4.useEffect(() => {
    async function loadMarketplaceData() {
      try {
        const config = await loadKnownMarketplacesConfig();
        const {
          marketplaces: marketplaces_0,
          failures
        } = await loadMarketplacesWithGracefulDegradation(config);
        const marketplaceInfos = [];
        for (const {
          name,
          config: marketplaceConfig,
          data: marketplace
        } of marketplaces_0) {
          if (marketplace) {
            const installedFromThisMarketplace = count(marketplace.plugins, (plugin) => isPluginInstalled(createPluginId(plugin.name, name)));
            marketplaceInfos.push({
              name,
              totalPlugins: marketplace.plugins.length,
              installedCount: installedFromThisMarketplace,
              source: getMarketplaceSourceDisplay(marketplaceConfig.source)
            });
          }
        }
        marketplaceInfos.sort((a, b) => {
          if (a.name === "claude-plugin-directory")
            return -1;
          if (b.name === "claude-plugin-directory")
            return 1;
          return 0;
        });
        setMarketplaces(marketplaceInfos);
        const successCount = count(marketplaces_0, (m) => m.data !== null);
        const errorResult = formatMarketplaceLoadingErrors(failures, successCount);
        if (errorResult) {
          if (errorResult.type === "warning") {
            setWarning(errorResult.message + ". Showing available marketplaces.");
          } else {
            throw new Error(errorResult.message);
          }
        }
        if (marketplaceInfos.length === 1 && !targetMarketplace && !targetPlugin) {
          const singleMarketplace = marketplaceInfos[0];
          if (singleMarketplace) {
            setSelectedMarketplace(singleMarketplace.name);
            setViewState("plugin-list");
          }
        }
        if (targetPlugin) {
          let foundPlugin = null;
          let foundMarketplace = null;
          for (const [name_0] of Object.entries(config)) {
            const marketplace_0 = await getMarketplace(name_0);
            if (marketplace_0) {
              const plugin_0 = marketplace_0.plugins.find((p) => p.name === targetPlugin);
              if (plugin_0) {
                const pluginId = createPluginId(plugin_0.name, name_0);
                foundPlugin = {
                  entry: plugin_0,
                  marketplaceName: name_0,
                  pluginId,
                  isInstalled: isPluginGloballyInstalled(pluginId)
                };
                foundMarketplace = name_0;
                break;
              }
            }
          }
          if (foundPlugin && foundMarketplace) {
            const pluginId_0 = foundPlugin.pluginId;
            const globallyInstalled = isPluginGloballyInstalled(pluginId_0);
            if (globallyInstalled) {
              setError(`Plugin '${pluginId_0}' is already installed globally. Use '/plugin' to manage existing plugins.`);
            } else {
              setSelectedMarketplace(foundMarketplace);
              setSelectedPlugin(foundPlugin);
              setViewState("plugin-details");
            }
          } else {
            setError(`Plugin "${targetPlugin}" not found in any marketplace`);
          }
        } else if (targetMarketplace) {
          const marketplaceExists = marketplaceInfos.some((m_0) => m_0.name === targetMarketplace);
          if (marketplaceExists) {
            setSelectedMarketplace(targetMarketplace);
            setViewState("plugin-list");
          } else {
            setError(`Marketplace "${targetMarketplace}" not found`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load marketplaces");
      } finally {
        setLoading(false);
      }
    }
    loadMarketplaceData();
  }, [setError, targetMarketplace, targetPlugin]);
  import_react4.useEffect(() => {
    if (!selectedMarketplace)
      return;
    let cancelled = false;
    async function loadPluginsForMarketplace(marketplaceName) {
      setLoading(true);
      try {
        const marketplace_1 = await getMarketplace(marketplaceName);
        if (cancelled)
          return;
        if (!marketplace_1) {
          throw new Error(`Failed to load marketplace: ${marketplaceName}`);
        }
        const installablePlugins = [];
        for (const entry of marketplace_1.plugins) {
          const pluginId_1 = createPluginId(entry.name, marketplaceName);
          if (isPluginBlockedByPolicy(pluginId_1))
            continue;
          installablePlugins.push({
            entry,
            marketplaceName,
            pluginId: pluginId_1,
            isInstalled: isPluginGloballyInstalled(pluginId_1)
          });
        }
        try {
          const counts = await getInstallCounts();
          if (cancelled)
            return;
          setInstallCounts(counts);
          if (counts) {
            installablePlugins.sort((a_1, b_1) => {
              const countA = counts.get(a_1.pluginId) ?? 0;
              const countB = counts.get(b_1.pluginId) ?? 0;
              if (countA !== countB)
                return countB - countA;
              return a_1.entry.name.localeCompare(b_1.entry.name);
            });
          } else {
            installablePlugins.sort((a_2, b_2) => a_2.entry.name.localeCompare(b_2.entry.name));
          }
        } catch (error_0) {
          if (cancelled)
            return;
          logForDebugging(`Failed to fetch install counts: ${errorMessage(error_0)}`);
          installablePlugins.sort((a_0, b_0) => a_0.entry.name.localeCompare(b_0.entry.name));
        }
        setAvailablePlugins(installablePlugins);
        setSelectedIndex(0);
        setSelectedForInstall(new Set);
      } catch (err_0) {
        if (cancelled)
          return;
        setError(err_0 instanceof Error ? err_0.message : "Failed to load plugins");
      } finally {
        setLoading(false);
      }
    }
    loadPluginsForMarketplace(selectedMarketplace);
    return () => {
      cancelled = true;
    };
  }, [selectedMarketplace, setError]);
  const installSelectedPlugins = async () => {
    if (selectedForInstall.size === 0)
      return;
    const pluginsToInstall = availablePlugins.filter((p_0) => selectedForInstall.has(p_0.pluginId));
    setInstallingPlugins(new Set(pluginsToInstall.map((p_1) => p_1.pluginId)));
    let successCount_0 = 0;
    let failureCount = 0;
    const newFailedPlugins = [];
    for (const plugin_1 of pluginsToInstall) {
      const result = await installPluginFromMarketplace({
        pluginId: plugin_1.pluginId,
        entry: plugin_1.entry,
        marketplaceName: plugin_1.marketplaceName,
        scope: "user"
      });
      if (result.success) {
        successCount_0++;
      } else {
        failureCount++;
        newFailedPlugins.push({
          name: plugin_1.entry.name,
          reason: result.error
        });
      }
    }
    setInstallingPlugins(new Set);
    setSelectedForInstall(new Set);
    clearAllCaches();
    if (failureCount === 0) {
      const message = `\u2713 Installed ${successCount_0} ${plural(successCount_0, "plugin")}. ` + `Run /reload-plugins to activate.`;
      setResult(message);
    } else if (successCount_0 === 0) {
      setError(`Failed to install: ${formatFailureDetails(newFailedPlugins, true)}`);
    } else {
      const message_0 = `\u2713 Installed ${successCount_0} of ${successCount_0 + failureCount} plugins. ` + `Failed: ${formatFailureDetails(newFailedPlugins, false)}. ` + `Run /reload-plugins to activate successfully installed plugins.`;
      setResult(message_0);
    }
    if (successCount_0 > 0) {
      if (onInstallComplete) {
        await onInstallComplete();
      }
    }
    setParentViewState({
      type: "menu"
    });
  };
  const handleSinglePluginInstall = async (plugin_2, scope = "user") => {
    setIsInstalling(true);
    setInstallError(null);
    const result_0 = await installPluginFromMarketplace({
      pluginId: plugin_2.pluginId,
      entry: plugin_2.entry,
      marketplaceName: plugin_2.marketplaceName,
      scope
    });
    if (result_0.success) {
      const loaded = await findPluginOptionsTarget(plugin_2.pluginId);
      if (loaded) {
        setIsInstalling(false);
        setViewState({
          type: "plugin-options",
          plugin: loaded,
          pluginId: plugin_2.pluginId
        });
        return;
      }
      setResult(result_0.message);
      if (onInstallComplete) {
        await onInstallComplete();
      }
      setParentViewState({
        type: "menu"
      });
    } else {
      setIsInstalling(false);
      setInstallError(result_0.error);
    }
  };
  import_react4.useEffect(() => {
    if (error) {
      setResult(error);
    }
  }, [error, setResult]);
  useKeybindings({
    "select:previous": () => {
      if (selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    },
    "select:next": () => {
      if (selectedIndex < marketplaces.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    },
    "select:accept": () => {
      const marketplace_2 = marketplaces[selectedIndex];
      if (marketplace_2) {
        setSelectedMarketplace(marketplace_2.name);
        setViewState("plugin-list");
      }
    }
  }, {
    context: "Select",
    isActive: viewState === "marketplace-list"
  });
  useKeybindings({
    "select:previous": () => {
      if (selectedIndex > 0) {
        pagination.handleSelectionChange(selectedIndex - 1, setSelectedIndex);
      }
    },
    "select:next": () => {
      if (selectedIndex < availablePlugins.length - 1) {
        pagination.handleSelectionChange(selectedIndex + 1, setSelectedIndex);
      }
    },
    "select:accept": () => {
      if (selectedIndex === availablePlugins.length && selectedForInstall.size > 0) {
        installSelectedPlugins();
      } else if (selectedIndex < availablePlugins.length) {
        const plugin_3 = availablePlugins[selectedIndex];
        if (plugin_3) {
          if (plugin_3.isInstalled) {
            setParentViewState({
              type: "manage-plugins",
              targetPlugin: plugin_3.entry.name,
              targetMarketplace: plugin_3.marketplaceName
            });
          } else {
            setSelectedPlugin(plugin_3);
            setViewState("plugin-details");
            setDetailsMenuIndex(0);
            setInstallError(null);
          }
        }
      }
    }
  }, {
    context: "Select",
    isActive: viewState === "plugin-list"
  });
  useKeybindings({
    "plugin:toggle": () => {
      if (selectedIndex < availablePlugins.length) {
        const plugin_4 = availablePlugins[selectedIndex];
        if (plugin_4 && !plugin_4.isInstalled) {
          const newSelection = new Set(selectedForInstall);
          if (newSelection.has(plugin_4.pluginId)) {
            newSelection.delete(plugin_4.pluginId);
          } else {
            newSelection.add(plugin_4.pluginId);
          }
          setSelectedForInstall(newSelection);
        }
      }
    },
    "plugin:install": () => {
      if (selectedForInstall.size > 0) {
        installSelectedPlugins();
      }
    }
  }, {
    context: "Plugin",
    isActive: viewState === "plugin-list"
  });
  const detailsMenuOptions = React3.useMemo(() => {
    if (!selectedPlugin)
      return [];
    const hasHomepage = selectedPlugin.entry.homepage;
    const githubRepo = extractGitHubRepo(selectedPlugin);
    return buildPluginDetailsMenuOptions(hasHomepage, githubRepo);
  }, [selectedPlugin]);
  useKeybindings({
    "select:previous": () => {
      if (detailsMenuIndex > 0) {
        setDetailsMenuIndex(detailsMenuIndex - 1);
      }
    },
    "select:next": () => {
      if (detailsMenuIndex < detailsMenuOptions.length - 1) {
        setDetailsMenuIndex(detailsMenuIndex + 1);
      }
    },
    "select:accept": () => {
      if (!selectedPlugin)
        return;
      const action = detailsMenuOptions[detailsMenuIndex]?.action;
      const hasHomepage_0 = selectedPlugin.entry.homepage;
      const githubRepo_0 = extractGitHubRepo(selectedPlugin);
      if (action === "install-user") {
        handleSinglePluginInstall(selectedPlugin, "user");
      } else if (action === "install-project") {
        handleSinglePluginInstall(selectedPlugin, "project");
      } else if (action === "install-local") {
        handleSinglePluginInstall(selectedPlugin, "local");
      } else if (action === "homepage" && hasHomepage_0) {
        openBrowser(hasHomepage_0);
      } else if (action === "github" && githubRepo_0) {
        openBrowser(`https://github.com/${githubRepo_0}`);
      } else if (action === "back") {
        setViewState("plugin-list");
        setSelectedPlugin(null);
      }
    }
  }, {
    context: "Select",
    isActive: viewState === "plugin-details" && !!selectedPlugin
  });
  if (typeof viewState === "object" && viewState.type === "plugin-options") {
    let finish = function(msg) {
      setResult(msg);
      if (onInstallComplete) {
        onInstallComplete();
      }
      setParentViewState({
        type: "menu"
      });
    };
    const {
      plugin: plugin_5,
      pluginId: pluginId_2
    } = viewState;
    return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(PluginOptionsFlow, {
      plugin: plugin_5,
      pluginId: pluginId_2,
      onDone: (outcome, detail) => {
        switch (outcome) {
          case "configured":
            finish(`\u2713 Installed and configured ${plugin_5.name}. Run /reload-plugins to apply.`);
            break;
          case "skipped":
            finish(`\u2713 Installed ${plugin_5.name}. Run /reload-plugins to apply.`);
            break;
          case "error":
            finish(`Installed but failed to save config: ${detail}`);
            break;
        }
      }
    }, undefined, false, undefined, this);
  }
  if (loading) {
    return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
      children: "Loading\u2026"
    }, undefined, false, undefined, this);
  }
  if (error) {
    return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
      color: "error",
      children: error
    }, undefined, false, undefined, this);
  }
  if (viewState === "marketplace-list") {
    if (marketplaces.length === 0) {
      return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
            marginBottom: 1,
            children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              bold: true,
              children: "Select marketplace"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            children: "No marketplaces configured."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "Add a marketplace first using ",
              "'Add marketplace'",
              "."
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            paddingLeft: 1,
            children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              dimColor: true,
              children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "go back"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
    }
    return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            bold: true,
            children: "Select marketplace"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        warning && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          flexDirection: "column",
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            color: "warning",
            children: [
              figures_default.warning,
              " ",
              warning
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        marketplaces.map((marketplace_3, index) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginBottom: index < marketplaces.length - 1 ? 1 : 0,
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
              children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                color: selectedIndex === index ? "suggestion" : undefined,
                children: [
                  selectedIndex === index ? figures_default.pointer : " ",
                  " ",
                  marketplace_3.name
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
              marginLeft: 2,
              children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  marketplace_3.totalPlugins,
                  " ",
                  plural(marketplace_3.totalPlugins, "plugin"),
                  " available",
                  marketplace_3.installedCount > 0 && ` \xB7 ${marketplace_3.installedCount} already installed`,
                  marketplace_3.source && ` \xB7 ${marketplace_3.source}`
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, marketplace_3.name, true, undefined, this)),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(Byline, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
                  action: "select:accept",
                  context: "Select",
                  fallback: "Enter",
                  description: "select"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
                  action: "confirm:no",
                  context: "Confirmation",
                  fallback: "Esc",
                  description: "go back"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (viewState === "plugin-details" && selectedPlugin) {
    const hasHomepage_1 = selectedPlugin.entry.homepage;
    const githubRepo_1 = extractGitHubRepo(selectedPlugin);
    const menuOptions = buildPluginDetailsMenuOptions(hasHomepage_1, githubRepo_1);
    return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            bold: true,
            children: "Plugin Details"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginBottom: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              bold: true,
              children: selectedPlugin.entry.name
            }, undefined, false, undefined, this),
            selectedPlugin.entry.version && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "Version: ",
                selectedPlugin.entry.version
              ]
            }, undefined, true, undefined, this),
            selectedPlugin.entry.description && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
              marginTop: 1,
              children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                children: selectedPlugin.entry.description
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            selectedPlugin.entry.author && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
              marginTop: 1,
              children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  "By:",
                  " ",
                  typeof selectedPlugin.entry.author === "string" ? selectedPlugin.entry.author : selectedPlugin.entry.author.name
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginBottom: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              bold: true,
              children: "Will install:"
            }, undefined, false, undefined, this),
            selectedPlugin.entry.commands && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "\xB7 Commands:",
                " ",
                Array.isArray(selectedPlugin.entry.commands) ? selectedPlugin.entry.commands.join(", ") : Object.keys(selectedPlugin.entry.commands).join(", ")
              ]
            }, undefined, true, undefined, this),
            selectedPlugin.entry.agents && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "\xB7 Agents:",
                " ",
                Array.isArray(selectedPlugin.entry.agents) ? selectedPlugin.entry.agents.join(", ") : Object.keys(selectedPlugin.entry.agents).join(", ")
              ]
            }, undefined, true, undefined, this),
            selectedPlugin.entry.hooks && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "\xB7 Hooks: ",
                Object.keys(selectedPlugin.entry.hooks).join(", ")
              ]
            }, undefined, true, undefined, this),
            selectedPlugin.entry.mcpServers && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "\xB7 MCP Servers:",
                " ",
                Array.isArray(selectedPlugin.entry.mcpServers) ? selectedPlugin.entry.mcpServers.join(", ") : typeof selectedPlugin.entry.mcpServers === "object" ? Object.keys(selectedPlugin.entry.mcpServers).join(", ") : "configured"
              ]
            }, undefined, true, undefined, this),
            !selectedPlugin.entry.commands && !selectedPlugin.entry.agents && !selectedPlugin.entry.hooks && !selectedPlugin.entry.mcpServers && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(jsx_dev_runtime6.Fragment, {
              children: typeof selectedPlugin.entry.source === "object" && "source" in selectedPlugin.entry.source && (selectedPlugin.entry.source.source === "github" || selectedPlugin.entry.source.source === "url" || selectedPlugin.entry.source.source === "npm" || selectedPlugin.entry.source.source === "pip") ? /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                dimColor: true,
                children: "\xB7 Component summary not available for remote plugin"
              }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                dimColor: true,
                children: "\xB7 Components will be discovered at installation"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(PluginTrustWarning, {}, undefined, false, undefined, this),
        installError && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            color: "error",
            children: [
              "Error: ",
              installError
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: menuOptions.map((option, index_0) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
            children: [
              detailsMenuIndex === index_0 && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                children: "> "
              }, undefined, false, undefined, this),
              detailsMenuIndex !== index_0 && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                children: "  "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                bold: detailsMenuIndex === index_0,
                children: isInstalling && option.action === "install" ? "Installing\u2026" : option.label
              }, undefined, false, undefined, this)
            ]
          }, option.action, true, undefined, this))
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          paddingLeft: 1,
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            dimColor: true,
            children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(Byline, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
                  action: "select:accept",
                  context: "Select",
                  fallback: "Enter",
                  description: "select"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
                  action: "confirm:no",
                  context: "Confirmation",
                  fallback: "Esc",
                  description: "back"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (availablePlugins.length === 0) {
    return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            bold: true,
            children: "Install plugins"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          dimColor: true,
          children: "No new plugins available to install."
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          dimColor: true,
          children: "All plugins from this marketplace are already installed."
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          marginLeft: 3,
          children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ConfigurableShortcutHint, {
              action: "confirm:no",
              context: "Confirmation",
              fallback: "Esc",
              description: "go back"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const visiblePlugins = pagination.getVisibleItems(availablePlugins);
  return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          bold: true,
          children: "Install Plugins"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      pagination.scrollPosition.canScrollUp && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            " ",
            figures_default.arrowUp,
            " more above"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      visiblePlugins.map((plugin_6, visibleIndex) => {
        const actualIndex = pagination.toActualIndex(visibleIndex);
        const isSelected = selectedIndex === actualIndex;
        const isSelectedForInstall = selectedForInstall.has(plugin_6.pluginId);
        const isInstalling_0 = installingPlugins.has(plugin_6.pluginId);
        const isLast = visibleIndex === visiblePlugins.length - 1;
        return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginBottom: isLast && !error ? 0 : 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                  color: isSelected ? "suggestion" : undefined,
                  children: [
                    isSelected ? figures_default.pointer : " ",
                    " "
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                  color: plugin_6.isInstalled ? "success" : undefined,
                  children: [
                    plugin_6.isInstalled ? figures_default.tick : isInstalling_0 ? figures_default.ellipsis : isSelectedForInstall ? figures_default.radioOn : figures_default.radioOff,
                    " ",
                    plugin_6.entry.name,
                    plugin_6.entry.category && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                      dimColor: true,
                      children: [
                        " [",
                        plugin_6.entry.category,
                        "]"
                      ]
                    }, undefined, true, undefined, this),
                    plugin_6.entry.tags?.includes("community-managed") && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                      dimColor: true,
                      children: " [Community Managed]"
                    }, undefined, false, undefined, this),
                    plugin_6.isInstalled && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                      dimColor: true,
                      children: " (installed)"
                    }, undefined, false, undefined, this),
                    installCounts && selectedMarketplace === OFFICIAL_MARKETPLACE_NAME && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                      dimColor: true,
                      children: [
                        " \xB7 ",
                        formatInstallCount(installCounts.get(plugin_6.pluginId) ?? 0),
                        " ",
                        "installs"
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            plugin_6.entry.description && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
              marginLeft: 4,
              children: [
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: truncateToWidth(plugin_6.entry.description, 60)
                }, undefined, false, undefined, this),
                plugin_6.entry.version && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: [
                    " \xB7 v",
                    plugin_6.entry.version
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, plugin_6.pluginId, true, undefined, this);
      }),
      pagination.scrollPosition.canScrollDown && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            " ",
            figures_default.arrowDown,
            " more below"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      error && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          color: "error",
          children: [
            figures_default.cross,
            " ",
            error
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(PluginSelectionKeyHint, {
        hasSelection: selectedForInstall.size > 0
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var React3, import_react4, jsx_dev_runtime6;
var init_BrowseMarketplace = __esm(() => {
  init_figures();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_ink();
  init_useKeybinding();
  init_array();
  init_browser();
  init_debug();
  init_errors();
  init_cacheUtils();
  init_installCounts();
  init_installedPluginsManager();
  init_marketplaceHelpers();
  init_marketplaceManager();
  init_officialMarketplace();
  init_pluginInstallationHelpers();
  init_pluginPolicy();
  init_stringUtils();
  init_truncate();
  init_PluginOptionsFlow();
  init_PluginTrustWarning();
  init_pluginDetailsHelpers();
  init_usePagination();
  React3 = __toESM(require_react(), 1);
  import_react4 = __toESM(require_react(), 1);
  jsx_dev_runtime6 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/DiscoverPlugins.tsx
function DiscoverPlugins({
  error,
  setError,
  result: _result,
  setResult,
  setViewState: setParentViewState,
  onInstallComplete,
  onSearchModeChange,
  targetPlugin
}) {
  const [viewState, setViewState] = import_react5.useState("plugin-list");
  const [selectedPlugin, setSelectedPlugin] = import_react5.useState(null);
  const [availablePlugins, setAvailablePlugins] = import_react5.useState([]);
  const [loading, setLoading] = import_react5.useState(true);
  const [installCounts, setInstallCounts] = import_react5.useState(null);
  const [isSearchMode, setIsSearchModeRaw] = import_react5.useState(false);
  const setIsSearchMode = import_react5.useCallback((active) => {
    setIsSearchModeRaw(active);
    onSearchModeChange?.(active);
  }, [onSearchModeChange]);
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    cursorOffset: searchCursorOffset
  } = useSearchInput({
    isActive: viewState === "plugin-list" && isSearchMode && !loading,
    onExit: () => {
      setIsSearchMode(false);
    }
  });
  const isTerminalFocused = useTerminalFocus();
  const {
    columns: terminalWidth
  } = useTerminalSize();
  const filteredPlugins = import_react5.useMemo(() => {
    if (!searchQuery)
      return availablePlugins;
    const lowerQuery = searchQuery.toLowerCase();
    return availablePlugins.filter((plugin) => plugin.entry.name.toLowerCase().includes(lowerQuery) || plugin.entry.description?.toLowerCase().includes(lowerQuery) || plugin.marketplaceName.toLowerCase().includes(lowerQuery));
  }, [availablePlugins, searchQuery]);
  const [selectedIndex, setSelectedIndex] = import_react5.useState(0);
  const [selectedForInstall, setSelectedForInstall] = import_react5.useState(new Set);
  const [installingPlugins, setInstallingPlugins] = import_react5.useState(new Set);
  const pagination = usePagination({
    totalItems: filteredPlugins.length,
    selectedIndex
  });
  import_react5.useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);
  const [detailsMenuIndex, setDetailsMenuIndex] = import_react5.useState(0);
  const [isInstalling, setIsInstalling] = import_react5.useState(false);
  const [installError, setInstallError] = import_react5.useState(null);
  const [warning, setWarning] = import_react5.useState(null);
  const [emptyReason, setEmptyReason] = import_react5.useState(null);
  import_react5.useEffect(() => {
    async function loadAllPlugins2() {
      try {
        const config = await loadKnownMarketplacesConfig();
        const {
          marketplaces,
          failures
        } = await loadMarketplacesWithGracefulDegradation(config);
        const allPlugins = [];
        for (const {
          name,
          data: marketplace
        } of marketplaces) {
          if (marketplace) {
            for (const entry of marketplace.plugins) {
              const pluginId = createPluginId(entry.name, name);
              allPlugins.push({
                entry,
                marketplaceName: name,
                pluginId,
                isInstalled: isPluginGloballyInstalled(pluginId)
              });
            }
          }
        }
        const uninstalledPlugins = allPlugins.filter((p) => !p.isInstalled && !isPluginBlockedByPolicy(p.pluginId));
        try {
          const counts = await getInstallCounts();
          setInstallCounts(counts);
          if (counts) {
            uninstalledPlugins.sort((a_0, b_0) => {
              const countA = counts.get(a_0.pluginId) ?? 0;
              const countB = counts.get(b_0.pluginId) ?? 0;
              if (countA !== countB)
                return countB - countA;
              return a_0.entry.name.localeCompare(b_0.entry.name);
            });
          } else {
            uninstalledPlugins.sort((a_1, b_1) => a_1.entry.name.localeCompare(b_1.entry.name));
          }
        } catch (error_0) {
          logForDebugging(`Failed to fetch install counts: ${errorMessage(error_0)}`);
          uninstalledPlugins.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
        }
        setAvailablePlugins(uninstalledPlugins);
        const configuredCount = Object.keys(config).length;
        if (uninstalledPlugins.length === 0) {
          const reason = await detectEmptyMarketplaceReason({
            configuredMarketplaceCount: configuredCount,
            failedMarketplaceCount: failures.length
          });
          setEmptyReason(reason);
        }
        const successCount = count(marketplaces, (m) => m.data !== null);
        const errorResult = formatMarketplaceLoadingErrors(failures, successCount);
        if (errorResult) {
          if (errorResult.type === "warning") {
            setWarning(errorResult.message + ". Showing available plugins.");
          } else {
            throw new Error(errorResult.message);
          }
        }
        if (targetPlugin) {
          const foundPlugin = allPlugins.find((p_0) => p_0.entry.name === targetPlugin);
          if (foundPlugin) {
            if (foundPlugin.isInstalled) {
              setError(`Plugin '${foundPlugin.pluginId}' is already installed. Use '/plugin' to manage existing plugins.`);
            } else {
              setSelectedPlugin(foundPlugin);
              setViewState("plugin-details");
            }
          } else {
            setError(`Plugin "${targetPlugin}" not found in any marketplace`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plugins");
      } finally {
        setLoading(false);
      }
    }
    loadAllPlugins2();
  }, [setError, targetPlugin]);
  const installSelectedPlugins = async () => {
    if (selectedForInstall.size === 0)
      return;
    const pluginsToInstall = availablePlugins.filter((p_1) => selectedForInstall.has(p_1.pluginId));
    setInstallingPlugins(new Set(pluginsToInstall.map((p_2) => p_2.pluginId)));
    let successCount_0 = 0;
    let failureCount = 0;
    const newFailedPlugins = [];
    for (const plugin_0 of pluginsToInstall) {
      const result = await installPluginFromMarketplace({
        pluginId: plugin_0.pluginId,
        entry: plugin_0.entry,
        marketplaceName: plugin_0.marketplaceName,
        scope: "user"
      });
      if (result.success) {
        successCount_0++;
      } else {
        failureCount++;
        newFailedPlugins.push({
          name: plugin_0.entry.name,
          reason: result.error
        });
      }
    }
    setInstallingPlugins(new Set);
    setSelectedForInstall(new Set);
    clearAllCaches();
    if (failureCount === 0) {
      const message = `\u2713 Installed ${successCount_0} ${plural(successCount_0, "plugin")}. ` + `Run /reload-plugins to activate.`;
      setResult(message);
    } else if (successCount_0 === 0) {
      setError(`Failed to install: ${formatFailureDetails(newFailedPlugins, true)}`);
    } else {
      const message_0 = `\u2713 Installed ${successCount_0} of ${successCount_0 + failureCount} plugins. ` + `Failed: ${formatFailureDetails(newFailedPlugins, false)}. ` + `Run /reload-plugins to activate successfully installed plugins.`;
      setResult(message_0);
    }
    if (successCount_0 > 0) {
      if (onInstallComplete) {
        await onInstallComplete();
      }
    }
    setParentViewState({
      type: "menu"
    });
  };
  const handleSinglePluginInstall = async (plugin_1, scope = "user") => {
    setIsInstalling(true);
    setInstallError(null);
    const result_0 = await installPluginFromMarketplace({
      pluginId: plugin_1.pluginId,
      entry: plugin_1.entry,
      marketplaceName: plugin_1.marketplaceName,
      scope
    });
    if (result_0.success) {
      const loaded = await findPluginOptionsTarget(plugin_1.pluginId);
      if (loaded) {
        setIsInstalling(false);
        setViewState({
          type: "plugin-options",
          plugin: loaded,
          pluginId: plugin_1.pluginId
        });
        return;
      }
      setResult(result_0.message);
      if (onInstallComplete) {
        await onInstallComplete();
      }
      setParentViewState({
        type: "menu"
      });
    } else {
      setIsInstalling(false);
      setInstallError(result_0.error);
    }
  };
  import_react5.useEffect(() => {
    if (error) {
      setResult(error);
    }
  }, [error, setResult]);
  useKeybinding("confirm:no", () => {
    setViewState("plugin-list");
    setSelectedPlugin(null);
  }, {
    context: "Confirmation",
    isActive: viewState === "plugin-details"
  });
  useKeybinding("confirm:no", () => {
    setParentViewState({
      type: "menu"
    });
  }, {
    context: "Confirmation",
    isActive: viewState === "plugin-list" && !isSearchMode
  });
  use_input_default((input, _key) => {
    const keyIsNotCtrlOrMeta = !_key.ctrl && !_key.meta;
    if (!isSearchMode) {
      if (input === "/" && keyIsNotCtrlOrMeta) {
        setIsSearchMode(true);
        setSearchQuery("");
      } else if (keyIsNotCtrlOrMeta && input.length > 0 && !/^\s+$/.test(input) && input !== "j" && input !== "k" && input !== "i") {
        setIsSearchMode(true);
        setSearchQuery(input);
      }
    }
  }, {
    isActive: viewState === "plugin-list" && !loading
  });
  useKeybindings({
    "select:previous": () => {
      if (selectedIndex === 0) {
        setIsSearchMode(true);
      } else {
        pagination.handleSelectionChange(selectedIndex - 1, setSelectedIndex);
      }
    },
    "select:next": () => {
      if (selectedIndex < filteredPlugins.length - 1) {
        pagination.handleSelectionChange(selectedIndex + 1, setSelectedIndex);
      }
    },
    "select:accept": () => {
      if (selectedIndex === filteredPlugins.length && selectedForInstall.size > 0) {
        installSelectedPlugins();
      } else if (selectedIndex < filteredPlugins.length) {
        const plugin_2 = filteredPlugins[selectedIndex];
        if (plugin_2) {
          if (plugin_2.isInstalled) {
            setParentViewState({
              type: "manage-plugins",
              targetPlugin: plugin_2.entry.name,
              targetMarketplace: plugin_2.marketplaceName
            });
          } else {
            setSelectedPlugin(plugin_2);
            setViewState("plugin-details");
            setDetailsMenuIndex(0);
            setInstallError(null);
          }
        }
      }
    }
  }, {
    context: "Select",
    isActive: viewState === "plugin-list" && !isSearchMode
  });
  useKeybindings({
    "plugin:toggle": () => {
      if (selectedIndex < filteredPlugins.length) {
        const plugin_3 = filteredPlugins[selectedIndex];
        if (plugin_3 && !plugin_3.isInstalled) {
          const newSelection = new Set(selectedForInstall);
          if (newSelection.has(plugin_3.pluginId)) {
            newSelection.delete(plugin_3.pluginId);
          } else {
            newSelection.add(plugin_3.pluginId);
          }
          setSelectedForInstall(newSelection);
        }
      }
    },
    "plugin:install": () => {
      if (selectedForInstall.size > 0) {
        installSelectedPlugins();
      }
    }
  }, {
    context: "Plugin",
    isActive: viewState === "plugin-list" && !isSearchMode
  });
  const detailsMenuOptions = React4.useMemo(() => {
    if (!selectedPlugin)
      return [];
    const hasHomepage = selectedPlugin.entry.homepage;
    const githubRepo = extractGitHubRepo(selectedPlugin);
    return buildPluginDetailsMenuOptions(hasHomepage, githubRepo);
  }, [selectedPlugin]);
  useKeybindings({
    "select:previous": () => {
      if (detailsMenuIndex > 0) {
        setDetailsMenuIndex(detailsMenuIndex - 1);
      }
    },
    "select:next": () => {
      if (detailsMenuIndex < detailsMenuOptions.length - 1) {
        setDetailsMenuIndex(detailsMenuIndex + 1);
      }
    },
    "select:accept": () => {
      if (!selectedPlugin)
        return;
      const action = detailsMenuOptions[detailsMenuIndex]?.action;
      const hasHomepage_0 = selectedPlugin.entry.homepage;
      const githubRepo_0 = extractGitHubRepo(selectedPlugin);
      if (action === "install-user") {
        handleSinglePluginInstall(selectedPlugin, "user");
      } else if (action === "install-project") {
        handleSinglePluginInstall(selectedPlugin, "project");
      } else if (action === "install-local") {
        handleSinglePluginInstall(selectedPlugin, "local");
      } else if (action === "homepage" && hasHomepage_0) {
        openBrowser(hasHomepage_0);
      } else if (action === "github" && githubRepo_0) {
        openBrowser(`https://github.com/${githubRepo_0}`);
      } else if (action === "back") {
        setViewState("plugin-list");
        setSelectedPlugin(null);
      }
    }
  }, {
    context: "Select",
    isActive: viewState === "plugin-details" && !!selectedPlugin
  });
  if (typeof viewState === "object" && viewState.type === "plugin-options") {
    let finish = function(msg) {
      setResult(msg);
      if (onInstallComplete) {
        onInstallComplete();
      }
      setParentViewState({
        type: "menu"
      });
    };
    const {
      plugin: plugin_4,
      pluginId: pluginId_0
    } = viewState;
    return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(PluginOptionsFlow, {
      plugin: plugin_4,
      pluginId: pluginId_0,
      onDone: (outcome, detail) => {
        switch (outcome) {
          case "configured":
            finish(`\u2713 Installed and configured ${plugin_4.name}. Run /reload-plugins to apply.`);
            break;
          case "skipped":
            finish(`\u2713 Installed ${plugin_4.name}. Run /reload-plugins to apply.`);
            break;
          case "error":
            finish(`Installed but failed to save config: ${detail}`);
            break;
        }
      }
    }, undefined, false, undefined, this);
  }
  if (loading) {
    return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      children: "Loading\u2026"
    }, undefined, false, undefined, this);
  }
  if (error) {
    return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      color: "error",
      children: error
    }, undefined, false, undefined, this);
  }
  if (viewState === "plugin-details" && selectedPlugin) {
    const hasHomepage_1 = selectedPlugin.entry.homepage;
    const githubRepo_1 = extractGitHubRepo(selectedPlugin);
    const menuOptions = buildPluginDetailsMenuOptions(hasHomepage_1, githubRepo_1);
    return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            bold: true,
            children: "Plugin details"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginBottom: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              bold: true,
              children: selectedPlugin.entry.name
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "from ",
                selectedPlugin.marketplaceName
              ]
            }, undefined, true, undefined, this),
            selectedPlugin.entry.version && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "Version: ",
                selectedPlugin.entry.version
              ]
            }, undefined, true, undefined, this),
            selectedPlugin.entry.description && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
              marginTop: 1,
              children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                children: selectedPlugin.entry.description
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            selectedPlugin.entry.author && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
              marginTop: 1,
              children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  "By:",
                  " ",
                  typeof selectedPlugin.entry.author === "string" ? selectedPlugin.entry.author : selectedPlugin.entry.author.name
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(PluginTrustWarning, {}, undefined, false, undefined, this),
        installError && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            color: "error",
            children: [
              "Error: ",
              installError
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: menuOptions.map((option, index) => /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
            children: [
              detailsMenuIndex === index && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                children: "> "
              }, undefined, false, undefined, this),
              detailsMenuIndex !== index && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                children: "  "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                bold: detailsMenuIndex === index,
                children: isInstalling && option.action.startsWith("install-") ? "Installing\u2026" : option.label
              }, undefined, false, undefined, this)
            ]
          }, option.action, true, undefined, this))
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Byline, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ConfigurableShortcutHint, {
                  action: "select:accept",
                  context: "Select",
                  fallback: "Enter",
                  description: "select"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ConfigurableShortcutHint, {
                  action: "confirm:no",
                  context: "Confirmation",
                  fallback: "Esc",
                  description: "back"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (availablePlugins.length === 0) {
    return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            bold: true,
            children: "Discover plugins"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(EmptyStateMessage, {
          reason: emptyReason
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: "Esc to go back"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const visiblePlugins = pagination.getVisibleItems(filteredPlugins);
  return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            bold: true,
            children: "Discover plugins"
          }, undefined, false, undefined, this),
          pagination.needsPagination && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              " ",
              "(",
              pagination.scrollPosition.current,
              "/",
              pagination.scrollPosition.total,
              ")"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(SearchBox, {
          query: searchQuery,
          isFocused: isSearchMode,
          isTerminalFocused,
          width: terminalWidth - 4,
          cursorOffset: searchCursorOffset
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      warning && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          color: "warning",
          children: [
            figures_default.warning,
            " ",
            warning
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      filteredPlugins.length === 0 && searchQuery && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            'No plugins match "',
            searchQuery,
            '"'
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      pagination.scrollPosition.canScrollUp && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            " ",
            figures_default.arrowUp,
            " more above"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      visiblePlugins.map((plugin_5, visibleIndex) => {
        const actualIndex = pagination.toActualIndex(visibleIndex);
        const isSelected = selectedIndex === actualIndex;
        const isSelectedForInstall = selectedForInstall.has(plugin_5.pluginId);
        const isInstallingThis = installingPlugins.has(plugin_5.pluginId);
        const isLast = visibleIndex === visiblePlugins.length - 1;
        return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginBottom: isLast && !error ? 0 : 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                  color: isSelected && !isSearchMode ? "suggestion" : undefined,
                  children: [
                    isSelected && !isSearchMode ? figures_default.pointer : " ",
                    " "
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                  children: [
                    isInstallingThis ? figures_default.ellipsis : isSelectedForInstall ? figures_default.radioOn : figures_default.radioOff,
                    " ",
                    plugin_5.entry.name,
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                      dimColor: true,
                      children: [
                        " \xB7 ",
                        plugin_5.marketplaceName
                      ]
                    }, undefined, true, undefined, this),
                    plugin_5.entry.tags?.includes("community-managed") && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                      dimColor: true,
                      children: " [Community Managed]"
                    }, undefined, false, undefined, this),
                    installCounts && plugin_5.marketplaceName === OFFICIAL_MARKETPLACE_NAME && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                      dimColor: true,
                      children: [
                        " \xB7 ",
                        formatInstallCount(installCounts.get(plugin_5.pluginId) ?? 0),
                        " ",
                        "installs"
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            plugin_5.entry.description && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
              marginLeft: 4,
              children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
                dimColor: true,
                children: truncateToWidth(plugin_5.entry.description, 60)
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, `${pagination.startIndex}-${plugin_5.pluginId}`, true, undefined, this);
      }),
      pagination.scrollPosition.canScrollDown && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            " ",
            figures_default.arrowDown,
            " more below"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      error && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          color: "error",
          children: [
            figures_default.cross,
            " ",
            error
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(DiscoverPluginsKeyHint, {
        hasSelection: selectedForInstall.size > 0,
        canToggle: selectedIndex < filteredPlugins.length && !filteredPlugins[selectedIndex]?.isInstalled
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function DiscoverPluginsKeyHint(t0) {
  const $ = import_compiler_runtime4.c(10);
  const {
    hasSelection,
    canToggle
  } = t0;
  let t1;
  if ($[0] !== hasSelection) {
    t1 = hasSelection && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ConfigurableShortcutHint, {
      action: "plugin:install",
      context: "Plugin",
      fallback: "i",
      description: "install",
      bold: true
    }, undefined, false, undefined, this);
    $[0] = hasSelection;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      children: "type to search"
    }, undefined, false, undefined, this);
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== canToggle) {
    t3 = canToggle && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ConfigurableShortcutHint, {
      action: "plugin:toggle",
      context: "Plugin",
      fallback: "Space",
      description: "toggle"
    }, undefined, false, undefined, this);
    $[3] = canToggle;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  let t5;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ConfigurableShortcutHint, {
      action: "select:accept",
      context: "Select",
      fallback: "Enter",
      description: "details"
    }, undefined, false, undefined, this);
    t5 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ConfigurableShortcutHint, {
      action: "confirm:no",
      context: "Confirmation",
      fallback: "Esc",
      description: "back"
    }, undefined, false, undefined, this);
    $[5] = t4;
    $[6] = t5;
  } else {
    t4 = $[5];
    t5 = $[6];
  }
  let t6;
  if ($[7] !== t1 || $[8] !== t3) {
    t6 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Byline, {
          children: [
            t1,
            t2,
            t3,
            t4,
            t5
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[7] = t1;
    $[8] = t3;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  return t6;
}
function EmptyStateMessage(t0) {
  const $ = import_compiler_runtime4.c(6);
  const {
    reason
  } = t0;
  switch (reason) {
    case "git-not-installed": {
      let t1;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Git is required to install marketplaces."
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Please install git and restart Panda Code."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[0] = t1;
      } else {
        t1 = $[0];
      }
      return t1;
    }
    case "all-blocked-by-policy": {
      let t1;
      if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Your organization policy does not allow any external marketplaces."
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Contact your administrator."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[1] = t1;
      } else {
        t1 = $[1];
      }
      return t1;
    }
    case "policy-restricts-sources": {
      let t1;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Your organization restricts which marketplaces can be added."
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Switch to the Marketplaces tab to view allowed sources."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[2] = t1;
      } else {
        t1 = $[2];
      }
      return t1;
    }
    case "all-marketplaces-failed": {
      let t1;
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Failed to load marketplace data."
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Check your network connection."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[3] = t1;
      } else {
        t1 = $[3];
      }
      return t1;
    }
    case "all-plugins-installed": {
      let t1;
      if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "All available plugins are already installed."
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Check for new plugins later or add more marketplaces."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[4] = t1;
      } else {
        t1 = $[4];
      }
      return t1;
    }
    case "no-marketplaces-configured":
    default: {
      let t1;
      if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "No plugins available."
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Add a marketplace first using the Marketplaces tab."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
        $[5] = t1;
      } else {
        t1 = $[5];
      }
      return t1;
    }
  }
}
var import_compiler_runtime4, React4, import_react5, jsx_dev_runtime7;
var init_DiscoverPlugins = __esm(() => {
  init_figures();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_SearchBox();
  init_useSearchInput();
  init_useTerminalSize();
  init_ink();
  init_useKeybinding();
  init_array();
  init_browser();
  init_debug();
  init_errors();
  init_cacheUtils();
  init_installCounts();
  init_installedPluginsManager();
  init_marketplaceHelpers();
  init_marketplaceManager();
  init_officialMarketplace();
  init_pluginInstallationHelpers();
  init_pluginPolicy();
  init_stringUtils();
  init_truncate();
  init_PluginOptionsFlow();
  init_PluginTrustWarning();
  init_pluginDetailsHelpers();
  init_usePagination();
  import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  React4 = __toESM(require_react(), 1);
  import_react5 = __toESM(require_react(), 1);
  jsx_dev_runtime7 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/ManageMarketplaces.tsx
function ManageMarketplaces({
  setViewState,
  error,
  setError,
  setResult,
  exitState,
  onManageComplete,
  targetMarketplace,
  action
}) {
  const [marketplaceStates, setMarketplaceStates] = import_react6.useState([]);
  const [loading, setLoading] = import_react6.useState(true);
  const [selectedIndex, setSelectedIndex] = import_react6.useState(0);
  const [isProcessing, setIsProcessing] = import_react6.useState(false);
  const [processError, setProcessError] = import_react6.useState(null);
  const [successMessage, setSuccessMessage] = import_react6.useState(null);
  const [progressMessage, setProgressMessage] = import_react6.useState(null);
  const [internalView, setInternalView] = import_react6.useState("list");
  const [selectedMarketplace, setSelectedMarketplace] = import_react6.useState(null);
  const [detailsMenuIndex, setDetailsMenuIndex] = import_react6.useState(0);
  const hasAttemptedAutoAction = import_react6.useRef(false);
  import_react6.useEffect(() => {
    async function loadMarketplaces() {
      try {
        const config = await loadKnownMarketplacesConfig();
        const {
          enabled,
          disabled
        } = await loadAllPlugins();
        const allPlugins = [...enabled, ...disabled];
        const {
          marketplaces,
          failures
        } = await loadMarketplacesWithGracefulDegradation(config);
        const states = [];
        for (const {
          name,
          config: entry,
          data: marketplace
        } of marketplaces) {
          const installedFromMarketplace = allPlugins.filter((plugin) => plugin.source.endsWith(`@${name}`));
          states.push({
            name,
            source: getMarketplaceSourceDisplay(entry.source),
            lastUpdated: entry.lastUpdated,
            pluginCount: marketplace?.plugins.length,
            installedPlugins: installedFromMarketplace,
            pendingUpdate: false,
            pendingRemove: false,
            autoUpdate: isMarketplaceAutoUpdate(name, entry)
          });
        }
        states.sort((a, b) => {
          if (a.name === "claude-plugin-directory")
            return -1;
          if (b.name === "claude-plugin-directory")
            return 1;
          return a.name.localeCompare(b.name);
        });
        setMarketplaceStates(states);
        const successCount = count(marketplaces, (m) => m.data !== null);
        const errorResult = formatMarketplaceLoadingErrors(failures, successCount);
        if (errorResult) {
          if (errorResult.type === "warning") {
            setProcessError(errorResult.message);
          } else {
            throw new Error(errorResult.message);
          }
        }
        if (targetMarketplace && !hasAttemptedAutoAction.current && !error) {
          hasAttemptedAutoAction.current = true;
          const targetIndex = states.findIndex((s) => s.name === targetMarketplace);
          if (targetIndex >= 0) {
            const targetState = states[targetIndex];
            if (action) {
              setSelectedIndex(targetIndex + 1);
              const newStates = [...states];
              if (action === "update") {
                newStates[targetIndex].pendingUpdate = true;
              } else if (action === "remove") {
                newStates[targetIndex].pendingRemove = true;
              }
              setMarketplaceStates(newStates);
              setTimeout(applyChanges, 100, newStates);
            } else if (targetState) {
              setSelectedIndex(targetIndex + 1);
              setSelectedMarketplace(targetState);
              setInternalView("details");
            }
          } else if (setError) {
            setError(`Marketplace not found: ${targetMarketplace}`);
          }
        }
      } catch (err) {
        if (setError) {
          setError(err instanceof Error ? err.message : "Failed to load marketplaces");
        }
        setProcessError(err instanceof Error ? err.message : "Failed to load marketplaces");
      } finally {
        setLoading(false);
      }
    }
    loadMarketplaces();
  }, [targetMarketplace, action, error]);
  const hasPendingChanges = () => {
    return marketplaceStates.some((state) => state.pendingUpdate || state.pendingRemove);
  };
  const getPendingCounts = () => {
    const updateCount2 = count(marketplaceStates, (s) => s.pendingUpdate);
    const removeCount2 = count(marketplaceStates, (s) => s.pendingRemove);
    return {
      updateCount: updateCount2,
      removeCount: removeCount2
    };
  };
  const applyChanges = async (states) => {
    const statesToProcess = states || marketplaceStates;
    const wasInDetailsView = internalView === "details";
    setIsProcessing(true);
    setProcessError(null);
    setSuccessMessage(null);
    setProgressMessage(null);
    try {
      const settings = getSettingsForSource("userSettings");
      let updatedCount = 0;
      let removedCount = 0;
      const refreshedMarketplaces = new Set;
      for (const state of statesToProcess) {
        if (state.pendingRemove) {
          if (state.installedPlugins && state.installedPlugins.length > 0) {
            const newEnabledPlugins = {
              ...settings?.enabledPlugins
            };
            for (const plugin of state.installedPlugins) {
              const pluginId = createPluginId(plugin.name, state.name);
              newEnabledPlugins[pluginId] = false;
            }
            updateSettingsForSource("userSettings", {
              enabledPlugins: newEnabledPlugins
            });
          }
          await removeMarketplaceSource(state.name);
          removedCount++;
          logEvent("tengu_marketplace_removed", {
            marketplace_name: state.name,
            plugins_uninstalled: state.installedPlugins?.length || 0
          });
          continue;
        }
        if (state.pendingUpdate) {
          await refreshMarketplace(state.name, (message) => {
            setProgressMessage(message);
          });
          updatedCount++;
          refreshedMarketplaces.add(state.name.toLowerCase());
          logEvent("tengu_marketplace_updated", {
            marketplace_name: state.name
          });
        }
      }
      let updatedPluginCount = 0;
      if (refreshedMarketplaces.size > 0) {
        const updatedPluginIds = await updatePluginsForMarketplaces(refreshedMarketplaces);
        updatedPluginCount = updatedPluginIds.length;
      }
      clearAllCaches();
      if (onManageComplete) {
        await onManageComplete();
      }
      const config = await loadKnownMarketplacesConfig();
      const {
        enabled,
        disabled
      } = await loadAllPlugins();
      const allPlugins = [...enabled, ...disabled];
      const {
        marketplaces
      } = await loadMarketplacesWithGracefulDegradation(config);
      const newStates = [];
      for (const {
        name,
        config: entry,
        data: marketplace
      } of marketplaces) {
        const installedFromMarketplace = allPlugins.filter((plugin) => plugin.source.endsWith(`@${name}`));
        newStates.push({
          name,
          source: getMarketplaceSourceDisplay(entry.source),
          lastUpdated: entry.lastUpdated,
          pluginCount: marketplace?.plugins.length,
          installedPlugins: installedFromMarketplace,
          pendingUpdate: false,
          pendingRemove: false,
          autoUpdate: isMarketplaceAutoUpdate(name, entry)
        });
      }
      newStates.sort((a, b) => {
        if (a.name === "claude-plugin-directory")
          return -1;
        if (b.name === "claude-plugin-directory")
          return 1;
        return a.name.localeCompare(b.name);
      });
      setMarketplaceStates(newStates);
      if (wasInDetailsView && selectedMarketplace) {
        const updatedMarketplace = newStates.find((s) => s.name === selectedMarketplace.name);
        if (updatedMarketplace) {
          setSelectedMarketplace(updatedMarketplace);
        }
      }
      const actions = [];
      if (updatedCount > 0) {
        const pluginPart = updatedPluginCount > 0 ? ` (${updatedPluginCount} ${plural(updatedPluginCount, "plugin")} bumped)` : "";
        actions.push(`Updated ${updatedCount} ${plural(updatedCount, "marketplace")}${pluginPart}`);
      }
      if (removedCount > 0) {
        actions.push(`Removed ${removedCount} ${plural(removedCount, "marketplace")}`);
      }
      if (actions.length > 0) {
        const successMsg = `${figures_default.tick} ${actions.join(", ")}`;
        if (wasInDetailsView) {
          setSuccessMessage(successMsg);
        } else {
          setResult(successMsg);
          setTimeout(setViewState, 2000, {
            type: "menu"
          });
        }
      } else if (!wasInDetailsView) {
        setViewState({
          type: "menu"
        });
      }
    } catch (err) {
      const errorMsg = errorMessage(err);
      setProcessError(errorMsg);
      if (setError) {
        setError(errorMsg);
      }
    } finally {
      setIsProcessing(false);
      setProgressMessage(null);
    }
  };
  const confirmRemove = async () => {
    if (!selectedMarketplace)
      return;
    const newStates = marketplaceStates.map((state) => state.name === selectedMarketplace.name ? {
      ...state,
      pendingRemove: true
    } : state);
    setMarketplaceStates(newStates);
    await applyChanges(newStates);
  };
  const buildDetailsMenuOptions = (marketplace) => {
    if (!marketplace)
      return [];
    const options = [{
      label: `Browse plugins (${marketplace.pluginCount ?? 0})`,
      value: "browse"
    }, {
      label: "Update marketplace",
      secondaryLabel: marketplace.lastUpdated ? `(last updated ${new Date(marketplace.lastUpdated).toLocaleDateString()})` : undefined,
      value: "update"
    }];
    if (!shouldSkipPluginAutoupdate()) {
      options.push({
        label: marketplace.autoUpdate ? "Disable auto-update" : "Enable auto-update",
        value: "toggle-auto-update"
      });
    }
    options.push({
      label: "Remove marketplace",
      value: "remove"
    });
    return options;
  };
  const handleToggleAutoUpdate = async (marketplace) => {
    const newAutoUpdate = !marketplace.autoUpdate;
    try {
      await setMarketplaceAutoUpdate(marketplace.name, newAutoUpdate);
      setMarketplaceStates((prev) => prev.map((state) => state.name === marketplace.name ? {
        ...state,
        autoUpdate: newAutoUpdate
      } : state));
      setSelectedMarketplace((prev) => prev ? {
        ...prev,
        autoUpdate: newAutoUpdate
      } : prev);
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : "Failed to update setting");
    }
  };
  useKeybinding("confirm:no", () => {
    setInternalView("list");
    setDetailsMenuIndex(0);
  }, {
    context: "Confirmation",
    isActive: !isProcessing && (internalView === "details" || internalView === "confirm-remove")
  });
  useKeybinding("confirm:no", () => {
    setMarketplaceStates((prev) => prev.map((state) => ({
      ...state,
      pendingUpdate: false,
      pendingRemove: false
    })));
    setSelectedIndex(0);
  }, {
    context: "Confirmation",
    isActive: !isProcessing && internalView === "list" && hasPendingChanges()
  });
  useKeybinding("confirm:no", () => {
    setViewState({
      type: "menu"
    });
  }, {
    context: "Confirmation",
    isActive: !isProcessing && internalView === "list" && !hasPendingChanges()
  });
  useKeybindings({
    "select:previous": () => setSelectedIndex((prev) => Math.max(0, prev - 1)),
    "select:next": () => {
      const totalItems = marketplaceStates.length + 1;
      setSelectedIndex((prev) => Math.min(totalItems - 1, prev + 1));
    },
    "select:accept": () => {
      const marketplaceIndex = selectedIndex - 1;
      if (selectedIndex === 0) {
        setViewState({
          type: "add-marketplace"
        });
      } else if (hasPendingChanges()) {
        applyChanges();
      } else {
        const marketplace = marketplaceStates[marketplaceIndex];
        if (marketplace) {
          setSelectedMarketplace(marketplace);
          setInternalView("details");
          setDetailsMenuIndex(0);
        }
      }
    }
  }, {
    context: "Select",
    isActive: !isProcessing && internalView === "list"
  });
  use_input_default((input) => {
    const marketplaceIndex = selectedIndex - 1;
    if ((input === "u" || input === "U") && marketplaceIndex >= 0) {
      setMarketplaceStates((prev) => prev.map((state, idx) => idx === marketplaceIndex ? {
        ...state,
        pendingUpdate: !state.pendingUpdate,
        pendingRemove: state.pendingUpdate ? state.pendingRemove : false
      } : state));
    } else if ((input === "r" || input === "R") && marketplaceIndex >= 0) {
      const marketplace = marketplaceStates[marketplaceIndex];
      if (marketplace) {
        setSelectedMarketplace(marketplace);
        setInternalView("confirm-remove");
      }
    }
  }, {
    isActive: !isProcessing && internalView === "list"
  });
  useKeybindings({
    "select:previous": () => setDetailsMenuIndex((prev) => Math.max(0, prev - 1)),
    "select:next": () => {
      const menuOptions = buildDetailsMenuOptions(selectedMarketplace);
      setDetailsMenuIndex((prev) => Math.min(menuOptions.length - 1, prev + 1));
    },
    "select:accept": () => {
      if (!selectedMarketplace)
        return;
      const menuOptions = buildDetailsMenuOptions(selectedMarketplace);
      const selectedOption = menuOptions[detailsMenuIndex];
      if (selectedOption?.value === "browse") {
        setViewState({
          type: "browse-marketplace",
          targetMarketplace: selectedMarketplace.name
        });
      } else if (selectedOption?.value === "update") {
        const newStates = marketplaceStates.map((state) => state.name === selectedMarketplace.name ? {
          ...state,
          pendingUpdate: true
        } : state);
        setMarketplaceStates(newStates);
        applyChanges(newStates);
      } else if (selectedOption?.value === "toggle-auto-update") {
        handleToggleAutoUpdate(selectedMarketplace);
      } else if (selectedOption?.value === "remove") {
        setInternalView("confirm-remove");
      }
    }
  }, {
    context: "Select",
    isActive: !isProcessing && internalView === "details"
  });
  use_input_default((input) => {
    if (input === "y" || input === "Y") {
      confirmRemove();
    } else if (input === "n" || input === "N") {
      setInternalView("list");
      setSelectedMarketplace(null);
    }
  }, {
    isActive: !isProcessing && internalView === "confirm-remove"
  });
  if (loading) {
    return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      children: "Loading marketplaces\u2026"
    }, undefined, false, undefined, this);
  }
  if (marketplaceStates.length === 0) {
    return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            bold: true,
            children: "Manage marketplaces"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          flexDirection: "row",
          gap: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              color: "suggestion",
              children: [
                figures_default.pointer,
                " +"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              bold: true,
              color: "suggestion",
              children: "Add Marketplace"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          marginLeft: 3,
          children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(jsx_dev_runtime8.Fragment, {
              children: [
                "Press ",
                exitState.keyName,
                " again to go back"
              ]
            }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Byline, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ConfigurableShortcutHint, {
                  action: "select:accept",
                  context: "Select",
                  fallback: "Enter",
                  description: "select"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ConfigurableShortcutHint, {
                  action: "confirm:no",
                  context: "Confirmation",
                  fallback: "Esc",
                  description: "go back"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (internalView === "confirm-remove" && selectedMarketplace) {
    const pluginCount = selectedMarketplace.installedPlugins?.length || 0;
    return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
          bold: true,
          color: "warning",
          children: [
            "Remove marketplace ",
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              italic: true,
              children: selectedMarketplace.name
            }, undefined, false, undefined, this),
            "?"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            pluginCount > 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
              marginTop: 1,
              children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                color: "warning",
                children: [
                  "This will also uninstall ",
                  pluginCount,
                  " ",
                  plural(pluginCount, "plugin"),
                  " from this marketplace:"
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            selectedMarketplace.installedPlugins && selectedMarketplace.installedPlugins.length > 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
              flexDirection: "column",
              marginTop: 1,
              marginLeft: 2,
              children: selectedMarketplace.installedPlugins.map((plugin) => /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  "\u2022 ",
                  plugin.name
                ]
              }, plugin.name, true, undefined, this))
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
              marginTop: 1,
              children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                children: [
                  "Press ",
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                    bold: true,
                    children: "y"
                  }, undefined, false, undefined, this),
                  " to confirm or ",
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                    bold: true,
                    children: "n"
                  }, undefined, false, undefined, this),
                  " to cancel"
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (internalView === "details" && selectedMarketplace) {
    const isUpdating = selectedMarketplace.pendingUpdate || isProcessing;
    const menuOptions = buildDetailsMenuOptions(selectedMarketplace);
    return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
          bold: true,
          children: selectedMarketplace.name
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
          dimColor: true,
          children: selectedMarketplace.source
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            children: [
              selectedMarketplace.pluginCount || 0,
              " available",
              " ",
              plural(selectedMarketplace.pluginCount || 0, "plugin")
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        selectedMarketplace.installedPlugins && selectedMarketplace.installedPlugins.length > 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginTop: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              bold: true,
              children: [
                "Installed plugins (",
                selectedMarketplace.installedPlugins.length,
                "):"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
              flexDirection: "column",
              marginLeft: 1,
              children: selectedMarketplace.installedPlugins.map((plugin) => /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
                flexDirection: "row",
                gap: 1,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                    children: figures_default.bullet
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
                    flexDirection: "column",
                    children: [
                      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                        children: plugin.name
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                        dimColor: true,
                        children: plugin.manifest.description
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, plugin.name, true, undefined, this))
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        isUpdating && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              color: "claude",
              children: "Updating marketplace\u2026"
            }, undefined, false, undefined, this),
            progressMessage && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              dimColor: true,
              children: progressMessage
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        !isUpdating && successMessage && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            color: "claude",
            children: successMessage
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        !isUpdating && processError && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            color: "error",
            children: processError
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        !isUpdating && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginTop: 1,
          children: menuOptions.map((option, idx) => {
            if (!option)
              return null;
            const isSelected = idx === detailsMenuIndex;
            return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  color: isSelected ? "suggestion" : undefined,
                  children: [
                    isSelected ? figures_default.pointer : " ",
                    " ",
                    option.label
                  ]
                }, undefined, true, undefined, this),
                option.secondaryLabel && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: [
                    " ",
                    option.secondaryLabel
                  ]
                }, undefined, true, undefined, this)
              ]
            }, option.value, true, undefined, this);
          })
        }, undefined, false, undefined, this),
        !isUpdating && !shouldSkipPluginAutoupdate() && selectedMarketplace.autoUpdate && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Auto-update enabled. Panda Code will automatically update this marketplace and its installed plugins."
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          marginLeft: 3,
          children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: isUpdating ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(jsx_dev_runtime8.Fragment, {
              children: "Please wait\u2026"
            }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Byline, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ConfigurableShortcutHint, {
                  action: "select:accept",
                  context: "Select",
                  fallback: "Enter",
                  description: "select"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ConfigurableShortcutHint, {
                  action: "confirm:no",
                  context: "Confirmation",
                  fallback: "Esc",
                  description: "go back"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const {
    updateCount,
    removeCount
  } = getPendingCounts();
  return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
          bold: true,
          children: "Manage marketplaces"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
        flexDirection: "row",
        gap: 1,
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            color: selectedIndex === 0 ? "suggestion" : undefined,
            children: [
              selectedIndex === 0 ? figures_default.pointer : " ",
              " +"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            bold: true,
            color: selectedIndex === 0 ? "suggestion" : undefined,
            children: "Add Marketplace"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: marketplaceStates.map((state, idx) => {
          const isSelected = idx + 1 === selectedIndex;
          const indicators = [];
          if (state.pendingUpdate)
            indicators.push("UPDATE");
          if (state.pendingRemove)
            indicators.push("REMOVE");
          return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
            flexDirection: "row",
            gap: 1,
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                color: isSelected ? "suggestion" : undefined,
                children: [
                  isSelected ? figures_default.pointer : " ",
                  " ",
                  state.pendingRemove ? figures_default.cross : figures_default.bullet
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
                flexDirection: "column",
                flexGrow: 1,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
                    flexDirection: "row",
                    gap: 1,
                    children: [
                      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                        bold: true,
                        strikethrough: state.pendingRemove,
                        dimColor: state.pendingRemove,
                        children: [
                          state.name === "claude-plugins-official" && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                            color: "claude",
                            children: "\u273B "
                          }, undefined, false, undefined, this),
                          state.name,
                          state.name === "claude-plugins-official" && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                            color: "claude",
                            children: " \u273B"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this),
                      indicators.length > 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                        color: "warning",
                        children: [
                          "[",
                          indicators.join(", "),
                          "]"
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: state.source
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: [
                      state.pluginCount !== undefined && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(jsx_dev_runtime8.Fragment, {
                        children: [
                          state.pluginCount,
                          " available"
                        ]
                      }, undefined, true, undefined, this),
                      state.installedPlugins && state.installedPlugins.length > 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(jsx_dev_runtime8.Fragment, {
                        children: [
                          " \u2022 ",
                          state.installedPlugins.length,
                          " installed"
                        ]
                      }, undefined, true, undefined, this),
                      state.lastUpdated && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(jsx_dev_runtime8.Fragment, {
                        children: [
                          " ",
                          "\u2022 Updated",
                          " ",
                          new Date(state.lastUpdated).toLocaleDateString()
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, state.name, true, undefined, this);
        })
      }, undefined, false, undefined, this),
      hasPendingChanges() && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                bold: true,
                children: "Pending changes:"
              }, undefined, false, undefined, this),
              " ",
              /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                dimColor: true,
                children: "Enter to apply"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          updateCount > 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            children: [
              "\u2022 Update ",
              updateCount,
              " ",
              plural(updateCount, "marketplace")
            ]
          }, undefined, true, undefined, this),
          removeCount > 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            color: "warning",
            children: [
              "\u2022 Remove ",
              removeCount,
              " ",
              plural(removeCount, "marketplace")
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      isProcessing && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
          color: "claude",
          children: "Processing changes\u2026"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      processError && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
          color: "error",
          children: processError
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ManageMarketplacesKeyHints, {
        exitState,
        hasPendingActions: hasPendingChanges()
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function ManageMarketplacesKeyHints(t0) {
  const $ = import_compiler_runtime5.c(18);
  const {
    exitState,
    hasPendingActions
  } = t0;
  if (exitState.pending) {
    let t12;
    if ($[0] !== exitState.keyName) {
      t12 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
          dimColor: true,
          italic: true,
          children: [
            "Press ",
            exitState.keyName,
            " again to go back"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this);
      $[0] = exitState.keyName;
      $[1] = t12;
    } else {
      t12 = $[1];
    }
    return t12;
  }
  let t1;
  if ($[2] !== hasPendingActions) {
    t1 = hasPendingActions && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ConfigurableShortcutHint, {
      action: "select:accept",
      context: "Select",
      fallback: "Enter",
      description: "apply changes"
    }, undefined, false, undefined, this);
    $[2] = hasPendingActions;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== hasPendingActions) {
    t2 = !hasPendingActions && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ConfigurableShortcutHint, {
      action: "select:accept",
      context: "Select",
      fallback: "Enter",
      description: "select"
    }, undefined, false, undefined, this);
    $[4] = hasPendingActions;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== hasPendingActions) {
    t3 = !hasPendingActions && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(KeyboardShortcutHint, {
      shortcut: "u",
      action: "update"
    }, undefined, false, undefined, this);
    $[6] = hasPendingActions;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  let t4;
  if ($[8] !== hasPendingActions) {
    t4 = !hasPendingActions && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(KeyboardShortcutHint, {
      shortcut: "r",
      action: "remove"
    }, undefined, false, undefined, this);
    $[8] = hasPendingActions;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const t5 = hasPendingActions ? "cancel" : "go back";
  let t6;
  if ($[10] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ConfigurableShortcutHint, {
      action: "confirm:no",
      context: "Confirmation",
      fallback: "Esc",
      description: t5
    }, undefined, false, undefined, this);
    $[10] = t5;
    $[11] = t6;
  } else {
    t6 = $[11];
  }
  let t7;
  if ($[12] !== t1 || $[13] !== t2 || $[14] !== t3 || $[15] !== t4 || $[16] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Byline, {
          children: [
            t1,
            t2,
            t3,
            t4,
            t6
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[12] = t1;
    $[13] = t2;
    $[14] = t3;
    $[15] = t4;
    $[16] = t6;
    $[17] = t7;
  } else {
    t7 = $[17];
  }
  return t7;
}
var import_compiler_runtime5, import_react6, jsx_dev_runtime8;
var init_ManageMarketplaces = __esm(() => {
  init_figures();
  init_analytics();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_ink();
  init_useKeybinding();
  init_array();
  init_config();
  init_errors();
  init_cacheUtils();
  init_marketplaceHelpers();
  init_marketplaceManager();
  init_pluginAutoupdate();
  init_pluginLoader();
  init_schemas();
  init_settings();
  init_stringUtils();
  import_compiler_runtime5 = __toESM(require_compiler_runtime(), 1);
  import_react6 = __toESM(require_react(), 1);
  jsx_dev_runtime8 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/mcp/CapabilitiesSection.tsx
function CapabilitiesSection(t0) {
  const $ = import_compiler_runtime6.c(9);
  const {
    serverToolsCount,
    serverPromptsCount,
    serverResourcesCount
  } = t0;
  let capabilities;
  if ($[0] !== serverPromptsCount || $[1] !== serverResourcesCount || $[2] !== serverToolsCount) {
    capabilities = [];
    if (serverToolsCount > 0) {
      capabilities.push("tools");
    }
    if (serverResourcesCount > 0) {
      capabilities.push("resources");
    }
    if (serverPromptsCount > 0) {
      capabilities.push("prompts");
    }
    $[0] = serverPromptsCount;
    $[1] = serverResourcesCount;
    $[2] = serverToolsCount;
    $[3] = capabilities;
  } else {
    capabilities = $[3];
  }
  let t1;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      bold: true,
      children: "Capabilities: "
    }, undefined, false, undefined, this);
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  let t2;
  if ($[5] !== capabilities) {
    t2 = capabilities.length > 0 ? /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(Byline, {
      children: capabilities
    }, undefined, false, undefined, this) : "none";
    $[5] = capabilities;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  let t3;
  if ($[7] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedBox_default, {
      children: [
        t1,
        /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
          color: "text",
          children: t2
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[7] = t2;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}
var import_compiler_runtime6, jsx_dev_runtime9;
var init_CapabilitiesSection = __esm(() => {
  init_ink();
  init_Byline();
  import_compiler_runtime6 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime9 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/mcp/utils/reconnectHelpers.tsx
function handleReconnectResult(result, serverName) {
  switch (result.client.type) {
    case "connected":
      return {
        message: `Reconnected to ${serverName}.`,
        success: true
      };
    case "needs-auth":
      return {
        message: `${serverName} requires authentication. Use the 'Authenticate' option.`,
        success: false
      };
    case "failed":
      return {
        message: `Failed to reconnect to ${serverName}.`,
        success: false
      };
    default:
      return {
        message: `Unknown result when reconnecting to ${serverName}.`,
        success: false
      };
  }
}
function handleReconnectError(error, serverName) {
  const errorMessage2 = error instanceof Error ? error.message : String(error);
  return `Error reconnecting to ${serverName}: ${errorMessage2}`;
}
var init_reconnectHelpers = () => {};

// src/components/mcp/MCPRemoteServerMenu.tsx
function MCPRemoteServerMenu({
  server,
  serverToolsCount,
  onViewTools,
  onCancel,
  onComplete,
  borderless = false
}) {
  const [theme] = useTheme();
  const exitState = useExitOnCtrlCDWithKeybindings();
  const {
    columns: terminalColumns
  } = useTerminalSize();
  const [isAuthenticating, setIsAuthenticating] = import_react7.default.useState(false);
  const [error, setError] = import_react7.default.useState(null);
  const mcp = useAppState((s) => s.mcp);
  const setAppState = useSetAppState();
  const [authorizationUrl, setAuthorizationUrl] = import_react7.default.useState(null);
  const [isReconnecting, setIsReconnecting] = import_react7.useState(false);
  const authAbortControllerRef = import_react7.useRef(null);
  const [isClaudeAIAuthenticating, setIsClaudeAIAuthenticating] = import_react7.useState(false);
  const [claudeAIAuthUrl, setClaudeAIAuthUrl] = import_react7.useState(null);
  const [isClaudeAIClearingAuth, setIsClaudeAIClearingAuth] = import_react7.useState(false);
  const [claudeAIClearAuthUrl, setClaudeAIClearAuthUrl] = import_react7.useState(null);
  const [claudeAIClearAuthBrowserOpened, setClaudeAIClearAuthBrowserOpened] = import_react7.useState(false);
  const [urlCopied, setUrlCopied] = import_react7.useState(false);
  const copyTimeoutRef = import_react7.useRef(undefined);
  const unmountedRef = import_react7.useRef(false);
  const [callbackUrlInput, setCallbackUrlInput] = import_react7.useState("");
  const [callbackUrlCursorOffset, setCallbackUrlCursorOffset] = import_react7.useState(0);
  const [manualCallbackSubmit, setManualCallbackSubmit] = import_react7.useState(null);
  import_react7.useEffect(() => () => {
    unmountedRef.current = true;
    authAbortControllerRef.current?.abort();
    if (copyTimeoutRef.current !== undefined) {
      clearTimeout(copyTimeoutRef.current);
    }
  }, []);
  const isEffectivelyAuthenticated = server.isAuthenticated || server.client.type === "connected" && serverToolsCount > 0;
  const reconnectMcpServer = useMcpReconnect();
  const handleClaudeAIAuthComplete = import_react7.default.useCallback(async () => {
    setIsClaudeAIAuthenticating(false);
    setClaudeAIAuthUrl(null);
    setIsReconnecting(true);
    try {
      const result = await reconnectMcpServer(server.name);
      const success = result.client.type === "connected";
      logEvent("tengu_claudeai_mcp_auth_completed", {
        success
      });
      if (success) {
        onComplete?.(`Authentication successful. Connected to ${server.name}.`);
      } else if (result.client.type === "needs-auth") {
        onComplete?.("Authentication successful, but server still requires authentication. You may need to manually restart Panda Code.");
      } else {
        onComplete?.("Authentication successful, but server reconnection failed. You may need to manually restart Panda Code for the changes to take effect.");
      }
    } catch (err) {
      logEvent("tengu_claudeai_mcp_auth_completed", {
        success: false
      });
      onComplete?.(handleReconnectError(err, server.name));
    } finally {
      setIsReconnecting(false);
    }
  }, [reconnectMcpServer, server.name, onComplete]);
  const handleClaudeAIClearAuthComplete = import_react7.default.useCallback(async () => {
    await clearServerCache(server.name, {
      ...server.config,
      scope: server.scope
    });
    setAppState((prev) => {
      const newClients = prev.mcp.clients.map((c) => c.name === server.name ? {
        ...c,
        type: "needs-auth"
      } : c);
      const newTools = excludeToolsByServer(prev.mcp.tools, server.name);
      const newCommands = excludeCommandsByServer(prev.mcp.commands, server.name);
      const newResources = excludeResourcesByServer(prev.mcp.resources, server.name);
      return {
        ...prev,
        mcp: {
          ...prev.mcp,
          clients: newClients,
          tools: newTools,
          commands: newCommands,
          resources: newResources
        }
      };
    });
    logEvent("tengu_claudeai_mcp_clear_auth_completed", {});
    onComplete?.(`Disconnected from ${server.name}.`);
    setIsClaudeAIClearingAuth(false);
    setClaudeAIClearAuthUrl(null);
    setClaudeAIClearAuthBrowserOpened(false);
  }, [server.name, server.config, server.scope, setAppState, onComplete]);
  useKeybinding("confirm:no", () => {
    authAbortControllerRef.current?.abort();
    authAbortControllerRef.current = null;
    setIsAuthenticating(false);
    setAuthorizationUrl(null);
  }, {
    context: "Confirmation",
    isActive: isAuthenticating
  });
  useKeybinding("confirm:no", () => {
    setIsClaudeAIAuthenticating(false);
    setClaudeAIAuthUrl(null);
  }, {
    context: "Confirmation",
    isActive: isClaudeAIAuthenticating
  });
  useKeybinding("confirm:no", () => {
    setIsClaudeAIClearingAuth(false);
    setClaudeAIClearAuthUrl(null);
    setClaudeAIClearAuthBrowserOpened(false);
  }, {
    context: "Confirmation",
    isActive: isClaudeAIClearingAuth
  });
  use_input_default((input, key) => {
    if (key.return && isClaudeAIAuthenticating) {
      handleClaudeAIAuthComplete();
    }
    if (key.return && isClaudeAIClearingAuth) {
      if (claudeAIClearAuthBrowserOpened) {
        handleClaudeAIClearAuthComplete();
      } else {
        const connectorsUrl = `${getOauthConfig().CLAUDE_AI_ORIGIN}/settings/connectors`;
        setClaudeAIClearAuthUrl(connectorsUrl);
        setClaudeAIClearAuthBrowserOpened(true);
        openBrowser(connectorsUrl);
      }
    }
    if (input === "c" && !urlCopied) {
      const urlToCopy = authorizationUrl || claudeAIAuthUrl || claudeAIClearAuthUrl;
      if (urlToCopy) {
        setClipboard(urlToCopy).then((raw) => {
          if (unmountedRef.current)
            return;
          if (raw)
            process.stdout.write(raw);
          setUrlCopied(true);
          if (copyTimeoutRef.current !== undefined) {
            clearTimeout(copyTimeoutRef.current);
          }
          copyTimeoutRef.current = setTimeout(setUrlCopied, 2000, false);
        });
      }
    }
  });
  const capitalizedServerName = capitalize(String(server.name));
  const serverCommandsCount = filterMcpPromptsByServer(mcp.commands, server.name).length;
  const toggleMcpServer = useMcpToggleEnabled();
  const handleClaudeAIAuth = import_react7.default.useCallback(async () => {
    const claudeAiBaseUrl = getOauthConfig().CLAUDE_AI_ORIGIN;
    const accountInfo = getOauthAccountInfo();
    const orgUuid = accountInfo?.organizationUuid;
    let authUrl;
    if (orgUuid && server.config.type === "claudeai-proxy" && server.config.id) {
      const serverId = server.config.id.startsWith("mcprs") ? "mcpsrv" + server.config.id.slice(5) : server.config.id;
      const productSurface = encodeURIComponent(process.env.CLAUDE_CODE_ENTRYPOINT || "cli");
      authUrl = `${claudeAiBaseUrl}/api/organizations/${orgUuid}/mcp/start-auth/${serverId}?product_surface=${productSurface}`;
    } else {
      authUrl = `${claudeAiBaseUrl}/settings/connectors`;
    }
    setClaudeAIAuthUrl(authUrl);
    setIsClaudeAIAuthenticating(true);
    logEvent("tengu_claudeai_mcp_auth_started", {});
    await openBrowser(authUrl);
  }, [server.config]);
  const handleClaudeAIClearAuth = import_react7.default.useCallback(() => {
    setIsClaudeAIClearingAuth(true);
    logEvent("tengu_claudeai_mcp_clear_auth_started", {});
  }, []);
  const handleToggleEnabled = import_react7.default.useCallback(async () => {
    const wasEnabled = server.client.type !== "disabled";
    try {
      await toggleMcpServer(server.name);
      if (server.config.type === "claudeai-proxy") {
        logEvent("tengu_claudeai_mcp_toggle", {
          new_state: wasEnabled ? "disabled" : "enabled"
        });
      }
      onCancel();
    } catch (err_0) {
      const action = wasEnabled ? "disable" : "enable";
      onComplete?.(`Failed to ${action} MCP server '${server.name}': ${errorMessage(err_0)}`);
    }
  }, [server.client.type, server.config.type, server.name, toggleMcpServer, onCancel, onComplete]);
  const handleAuthenticate = import_react7.default.useCallback(async () => {
    if (server.config.type === "claudeai-proxy")
      return;
    setIsAuthenticating(true);
    setError(null);
    const controller = new AbortController;
    authAbortControllerRef.current = controller;
    try {
      if (server.isAuthenticated && server.config) {
        await revokeServerTokens(server.name, server.config, {
          preserveStepUpState: true
        });
      }
      if (server.config) {
        await performMCPOAuthFlow(server.name, server.config, setAuthorizationUrl, controller.signal, {
          onWaitingForCallback: (submit) => {
            setManualCallbackSubmit(() => submit);
          }
        });
        logEvent("tengu_mcp_auth_config_authenticate", {
          wasAuthenticated: server.isAuthenticated
        });
        const result_0 = await reconnectMcpServer(server.name);
        if (result_0.client.type === "connected") {
          const message = isEffectivelyAuthenticated ? `Authentication successful. Reconnected to ${server.name}.` : `Authentication successful. Connected to ${server.name}.`;
          onComplete?.(message);
        } else if (result_0.client.type === "needs-auth") {
          onComplete?.("Authentication successful, but server still requires authentication. You may need to manually restart Panda Code.");
        } else {
          logMCPDebug(server.name, `Reconnection failed after authentication`);
          onComplete?.("Authentication successful, but server reconnection failed. You may need to manually restart Panda Code for the changes to take effect.");
        }
      }
    } catch (err_1) {
      if (err_1 instanceof Error && !(err_1 instanceof AuthenticationCancelledError)) {
        setError(err_1.message);
      }
    } finally {
      setIsAuthenticating(false);
      authAbortControllerRef.current = null;
      setManualCallbackSubmit(null);
      setCallbackUrlInput("");
    }
  }, [server.isAuthenticated, server.config, server.name, onComplete, reconnectMcpServer, isEffectivelyAuthenticated]);
  const handleClearAuth = async () => {
    if (server.config.type === "claudeai-proxy")
      return;
    if (server.config) {
      await revokeServerTokens(server.name, server.config);
      logEvent("tengu_mcp_auth_config_clear", {});
      await clearServerCache(server.name, {
        ...server.config,
        scope: server.scope
      });
      setAppState((prev_0) => {
        const newClients_0 = prev_0.mcp.clients.map((c_0) => c_0.name === server.name ? {
          ...c_0,
          type: "failed"
        } : c_0);
        const newTools_0 = excludeToolsByServer(prev_0.mcp.tools, server.name);
        const newCommands_0 = excludeCommandsByServer(prev_0.mcp.commands, server.name);
        const newResources_0 = excludeResourcesByServer(prev_0.mcp.resources, server.name);
        return {
          ...prev_0,
          mcp: {
            ...prev_0.mcp,
            clients: newClients_0,
            tools: newTools_0,
            commands: newCommands_0,
            resources: newResources_0
          }
        };
      });
      onComplete?.(`Authentication cleared for ${server.name}.`);
    }
  };
  if (isAuthenticating) {
    const authCopy = server.config.type !== "claudeai-proxy" && server.config.oauth?.xaa ? " Authenticating via your identity provider" : " A browser window will open for authentication";
    return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      padding: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
          color: "claude",
          children: [
            "Authenticating with ",
            server.name,
            "\u2026"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Spinner, {}, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              children: authCopy
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        authorizationUrl && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: [
                    "If your browser doesn't open automatically, copy this URL manually",
                    " "
                  ]
                }, undefined, true, undefined, this),
                urlCopied ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  color: "success",
                  children: "(Copied!)"
                }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
                    shortcut: "c",
                    action: "copy",
                    parens: true
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Link, {
              url: authorizationUrl
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        isAuthenticating && authorizationUrl && manualCallbackSubmit && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginTop: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              dimColor: true,
              children: "If the redirect page shows a connection error, paste the URL from your browser's address bar:"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: [
                    "URL ",
                    ">",
                    " "
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(TextInput, {
                  value: callbackUrlInput,
                  onChange: setCallbackUrlInput,
                  onSubmit: (value) => {
                    manualCallbackSubmit(value.trim());
                    setCallbackUrlInput("");
                  },
                  cursorOffset: callbackUrlCursorOffset,
                  onChangeCursorOffset: setCallbackUrlCursorOffset,
                  columns: terminalColumns - 8
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
          marginLeft: 3,
          children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Return here after authenticating in your browser. Press Esc to go back."
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (isClaudeAIAuthenticating) {
    return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      padding: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
          color: "claude",
          children: [
            "Authenticating with ",
            server.name,
            "\u2026"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Spinner, {}, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              children: " A browser window will open for authentication"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        claudeAIAuthUrl && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: [
                    "If your browser doesn't open automatically, copy this URL manually",
                    " "
                  ]
                }, undefined, true, undefined, this),
                urlCopied ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  color: "success",
                  children: "(Copied!)"
                }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
                    shortcut: "c",
                    action: "copy",
                    parens: true
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Link, {
              url: claudeAIAuthUrl
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
          marginLeft: 3,
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              color: "permission",
              children: [
                "Press ",
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  bold: true,
                  children: "Enter"
                }, undefined, false, undefined, this),
                " after authenticating in your browser."
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              dimColor: true,
              italic: true,
              children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "back"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (isClaudeAIClearingAuth) {
    return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      padding: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
          color: "claude",
          children: [
            "Clear authentication for ",
            server.name
          ]
        }, undefined, true, undefined, this),
        claudeAIClearAuthBrowserOpened ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              children: 'Find the MCP server in the browser and click "Disconnect".'
            }, undefined, false, undefined, this),
            claudeAIClearAuthUrl && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
              flexDirection: "column",
              children: [
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                      dimColor: true,
                      children: [
                        "If your browser didn't open automatically, copy this URL manually",
                        " "
                      ]
                    }, undefined, true, undefined, this),
                    urlCopied ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                      color: "success",
                      children: "(Copied!)"
                    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                      dimColor: true,
                      children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
                        shortcut: "c",
                        action: "copy",
                        parens: true
                      }, undefined, false, undefined, this)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Link, {
                  url: claudeAIClearAuthUrl
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
              marginLeft: 3,
              flexDirection: "column",
              children: [
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  color: "permission",
                  children: [
                    "Press ",
                    /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                      bold: true,
                      children: "Enter"
                    }, undefined, false, undefined, this),
                    " when done."
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  dimColor: true,
                  italic: true,
                  children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ConfigurableShortcutHint, {
                    action: "confirm:no",
                    context: "Confirmation",
                    fallback: "Esc",
                    description: "back"
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              children: 'This will open claude.ai in the browser. Find the MCP server in the list and click "Disconnect".'
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
              marginLeft: 3,
              flexDirection: "column",
              children: [
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  color: "permission",
                  children: [
                    "Press ",
                    /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                      bold: true,
                      children: "Enter"
                    }, undefined, false, undefined, this),
                    " to open the browser."
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                  dimColor: true,
                  italic: true,
                  children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ConfigurableShortcutHint, {
                    action: "confirm:no",
                    context: "Confirmation",
                    fallback: "Esc",
                    description: "back"
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (isReconnecting) {
    return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      padding: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
          color: "text",
          children: [
            "Connecting to ",
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              bold: true,
              children: server.name
            }, undefined, false, undefined, this),
            "\u2026"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Spinner, {}, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              children: " Establishing connection to MCP server"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
          dimColor: true,
          children: "This may take a few moments."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const menuOptions = [];
  if (server.client.type === "disabled") {
    menuOptions.push({
      label: "Enable",
      value: "toggle-enabled"
    });
  }
  if (server.client.type === "connected" && serverToolsCount > 0) {
    menuOptions.push({
      label: "View tools",
      value: "tools"
    });
  }
  if (server.config.type === "claudeai-proxy") {
    if (server.client.type === "connected") {
      menuOptions.push({
        label: "Clear authentication",
        value: "claudeai-clear-auth"
      });
    } else if (server.client.type !== "disabled") {
      menuOptions.push({
        label: "Authenticate",
        value: "claudeai-auth"
      });
    }
  } else {
    if (isEffectivelyAuthenticated) {
      menuOptions.push({
        label: "Re-authenticate",
        value: "reauth"
      });
      menuOptions.push({
        label: "Clear authentication",
        value: "clear-auth"
      });
    }
    if (!isEffectivelyAuthenticated) {
      menuOptions.push({
        label: "Authenticate",
        value: "auth"
      });
    }
  }
  if (server.client.type !== "disabled") {
    if (server.client.type !== "needs-auth") {
      menuOptions.push({
        label: "Reconnect",
        value: "reconnectMcpServer"
      });
    }
    menuOptions.push({
      label: "Disable",
      value: "toggle-enabled"
    });
  }
  if (menuOptions.length === 0) {
    menuOptions.push({
      label: "Back",
      value: "back"
    });
  }
  return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        paddingX: 1,
        borderStyle: borderless ? undefined : "round",
        children: [
          /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            marginBottom: 1,
            children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              bold: true,
              children: [
                capitalizedServerName,
                " MCP Server"
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            gap: 0,
            children: [
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Status: "
                  }, undefined, false, undefined, this),
                  server.client.type === "disabled" ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    children: [
                      color("inactive", theme)(figures_default.radioOff),
                      " disabled"
                    ]
                  }, undefined, true, undefined, this) : server.client.type === "connected" ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    children: [
                      color("success", theme)(figures_default.tick),
                      " connected"
                    ]
                  }, undefined, true, undefined, this) : server.client.type === "pending" ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
                    children: [
                      /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                        dimColor: true,
                        children: figures_default.radioOff
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                        children: " connecting\u2026"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this) : server.client.type === "needs-auth" ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    children: [
                      color("warning", theme)(figures_default.triangleUpOutline),
                      " needs authentication"
                    ]
                  }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    children: [
                      color("error", theme)(figures_default.cross),
                      " failed"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              server.transport !== "claudeai-proxy" && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Auth: "
                  }, undefined, false, undefined, this),
                  isEffectivelyAuthenticated ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    children: [
                      color("success", theme)(figures_default.tick),
                      " authenticated"
                    ]
                  }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    children: [
                      color("error", theme)(figures_default.cross),
                      " not authenticated"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: "URL: "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: server.config.url
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Config location: "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: describeMcpConfigFilePath(server.scope)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              server.client.type === "connected" && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(CapabilitiesSection, {
                serverToolsCount,
                serverPromptsCount: serverCommandsCount,
                serverResourcesCount: mcp.resources[server.name]?.length || 0
              }, undefined, false, undefined, this),
              server.client.type === "connected" && serverToolsCount > 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Tools: "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: [
                      serverToolsCount,
                      " tools"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          error && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              color: "error",
              children: [
                "Error: ",
                error
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          menuOptions.length > 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Select, {
              options: menuOptions,
              onChange: async (value_0) => {
                switch (value_0) {
                  case "tools":
                    onViewTools();
                    break;
                  case "auth":
                  case "reauth":
                    await handleAuthenticate();
                    break;
                  case "clear-auth":
                    await handleClearAuth();
                    break;
                  case "claudeai-auth":
                    await handleClaudeAIAuth();
                    break;
                  case "claudeai-clear-auth":
                    handleClaudeAIClearAuth();
                    break;
                  case "reconnectMcpServer":
                    setIsReconnecting(true);
                    try {
                      const result_1 = await reconnectMcpServer(server.name);
                      if (server.config.type === "claudeai-proxy") {
                        logEvent("tengu_claudeai_mcp_reconnect", {
                          success: result_1.client.type === "connected"
                        });
                      }
                      const {
                        message: message_0
                      } = handleReconnectResult(result_1, server.name);
                      onComplete?.(message_0);
                    } catch (err_2) {
                      if (server.config.type === "claudeai-proxy") {
                        logEvent("tengu_claudeai_mcp_reconnect", {
                          success: false
                        });
                      }
                      onComplete?.(handleReconnectError(err_2, server.name));
                    } finally {
                      setIsReconnecting(false);
                    }
                    break;
                  case "toggle-enabled":
                    await handleToggleEnabled();
                    break;
                  case "back":
                    onCancel();
                    break;
                }
              },
              onCancel
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
          dimColor: true,
          italic: true,
          children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
            children: [
              "Press ",
              exitState.keyName,
              " again to exit"
            ]
          }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
                shortcut: "\u2191\u2193",
                action: "navigate"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
                shortcut: "Enter",
                action: "select"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "back"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var import_react7, jsx_dev_runtime10;
var init_MCPRemoteServerMenu = __esm(() => {
  init_figures();
  init_analytics();
  init_oauth();
  init_useExitOnCtrlCDWithKeybindings();
  init_useTerminalSize();
  init_osc();
  init_ink();
  init_useKeybinding();
  init_auth2();
  init_client();
  init_MCPConnectionManager();
  init_utils();
  init_AppState();
  init_auth();
  init_browser();
  init_errors();
  init_log();
  init_stringUtils();
  init_ConfigurableShortcutHint();
  init_CustomSelect();
  init_Byline();
  init_KeyboardShortcutHint();
  init_Spinner();
  init_TextInput();
  init_CapabilitiesSection();
  init_reconnectHelpers();
  import_react7 = __toESM(require_react(), 1);
  jsx_dev_runtime10 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/mcp/MCPStdioServerMenu.tsx
function MCPStdioServerMenu({
  server,
  serverToolsCount,
  onViewTools,
  onCancel,
  onComplete,
  borderless = false
}) {
  const [theme] = useTheme();
  const exitState = useExitOnCtrlCDWithKeybindings();
  const mcp = useAppState((s) => s.mcp);
  const reconnectMcpServer = useMcpReconnect();
  const toggleMcpServer = useMcpToggleEnabled();
  const [isReconnecting, setIsReconnecting] = import_react8.useState(false);
  const handleToggleEnabled = import_react8.default.useCallback(async () => {
    const wasEnabled = server.client.type !== "disabled";
    try {
      await toggleMcpServer(server.name);
      onCancel();
    } catch (err) {
      const action = wasEnabled ? "disable" : "enable";
      onComplete(`Failed to ${action} MCP server '${server.name}': ${errorMessage(err)}`);
    }
  }, [server.client.type, server.name, toggleMcpServer, onCancel, onComplete]);
  const capitalizedServerName = capitalize(String(server.name));
  const serverCommandsCount = filterMcpPromptsByServer(mcp.commands, server.name).length;
  const menuOptions = [];
  if (server.client.type !== "disabled" && serverToolsCount > 0) {
    menuOptions.push({
      label: "View tools",
      value: "tools"
    });
  }
  if (server.client.type !== "disabled") {
    menuOptions.push({
      label: "Reconnect",
      value: "reconnectMcpServer"
    });
  }
  menuOptions.push({
    label: server.client.type !== "disabled" ? "Disable" : "Enable",
    value: "toggle-enabled"
  });
  if (menuOptions.length === 0) {
    menuOptions.push({
      label: "Back",
      value: "back"
    });
  }
  if (isReconnecting) {
    return /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      padding: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
          color: "text",
          children: [
            "Reconnecting to ",
            /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
              bold: true,
              children: server.name
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(Spinner, {}, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
              children: " Restarting MCP server process"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
          dimColor: true,
          children: "This may take a few moments."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        paddingX: 1,
        borderStyle: borderless ? undefined : "round",
        children: [
          /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
            marginBottom: 1,
            children: /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
              bold: true,
              children: [
                capitalizedServerName,
                " MCP Server"
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            gap: 0,
            children: [
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Status: "
                  }, undefined, false, undefined, this),
                  server.client.type === "disabled" ? /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    children: [
                      color("inactive", theme)(figures_default.radioOff),
                      " disabled"
                    ]
                  }, undefined, true, undefined, this) : server.client.type === "connected" ? /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    children: [
                      color("success", theme)(figures_default.tick),
                      " connected"
                    ]
                  }, undefined, true, undefined, this) : server.client.type === "pending" ? /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(jsx_dev_runtime11.Fragment, {
                    children: [
                      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                        dimColor: true,
                        children: figures_default.radioOff
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                        children: " connecting\u2026"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    children: [
                      color("error", theme)(figures_default.cross),
                      " failed"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Command: "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: server.config.command
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              server.config.args && server.config.args.length > 0 && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Args: "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: server.config.args.join(" ")
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Config location: "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: describeMcpConfigFilePath(getMcpConfigByName(server.name)?.scope ?? "dynamic")
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              server.client.type === "connected" && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(CapabilitiesSection, {
                serverToolsCount,
                serverPromptsCount: serverCommandsCount,
                serverResourcesCount: mcp.resources[server.name]?.length || 0
              }, undefined, false, undefined, this),
              server.client.type === "connected" && serverToolsCount > 0 && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    bold: true,
                    children: "Tools: "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: [
                      serverToolsCount,
                      " tools"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          menuOptions.length > 0 && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(Select, {
              options: menuOptions,
              onChange: async (value) => {
                if (value === "tools") {
                  onViewTools();
                } else if (value === "reconnectMcpServer") {
                  setIsReconnecting(true);
                  try {
                    const result = await reconnectMcpServer(server.name);
                    const {
                      message
                    } = handleReconnectResult(result, server.name);
                    onComplete?.(message);
                  } catch (err_0) {
                    onComplete?.(handleReconnectError(err_0, server.name));
                  } finally {
                    setIsReconnecting(false);
                  }
                } else if (value === "toggle-enabled") {
                  await handleToggleEnabled();
                } else if (value === "back") {
                  onCancel();
                }
              },
              onCancel
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(ThemedText, {
          dimColor: true,
          italic: true,
          children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(jsx_dev_runtime11.Fragment, {
            children: [
              "Press ",
              exitState.keyName,
              " again to exit"
            ]
          }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime11.jsxDEV(Byline, {
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
                description: "back"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var import_react8, jsx_dev_runtime11;
var init_MCPStdioServerMenu = __esm(() => {
  init_figures();
  init_useExitOnCtrlCDWithKeybindings();
  init_ink();
  init_config2();
  init_MCPConnectionManager();
  init_utils();
  init_AppState();
  init_errors();
  init_stringUtils();
  init_ConfigurableShortcutHint();
  init_CustomSelect();
  init_Byline();
  init_KeyboardShortcutHint();
  init_Spinner();
  init_CapabilitiesSection();
  init_reconnectHelpers();
  import_react8 = __toESM(require_react(), 1);
  jsx_dev_runtime11 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/mcp/MCPToolDetailView.tsx
function MCPToolDetailView(t0) {
  const $ = import_compiler_runtime7.c(44);
  const {
    tool,
    server,
    onBack
  } = t0;
  const [toolDescription, setToolDescription] = import_react9.default.useState("");
  let t1;
  let toolName;
  if ($[0] !== server.name || $[1] !== tool) {
    toolName = getMcpDisplayName(tool.name, server.name);
    const fullDisplayName = tool.userFacingName ? tool.userFacingName({}) : toolName;
    t1 = extractMcpToolDisplayName(fullDisplayName);
    $[0] = server.name;
    $[1] = tool;
    $[2] = t1;
    $[3] = toolName;
  } else {
    t1 = $[2];
    toolName = $[3];
  }
  const displayName = t1;
  let t2;
  if ($[4] !== tool) {
    t2 = tool.isReadOnly?.({}) ?? false;
    $[4] = tool;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const isReadOnly = t2;
  let t3;
  if ($[6] !== tool) {
    t3 = tool.isDestructive?.({}) ?? false;
    $[6] = tool;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const isDestructive = t3;
  let t4;
  if ($[8] !== tool) {
    t4 = tool.isOpenWorld?.({}) ?? false;
    $[8] = tool;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const isOpenWorld = t4;
  let t5;
  let t6;
  if ($[10] !== tool) {
    t5 = () => {
      const loadDescription = async function loadDescription2() {
        try {
          const desc = await tool.description({}, {
            isNonInteractiveSession: false,
            toolPermissionContext: {
              mode: "default",
              additionalWorkingDirectories: new Map,
              alwaysAllowRules: {},
              alwaysDenyRules: {},
              alwaysAskRules: {},
              isBypassPermissionsModeAvailable: false
            },
            tools: []
          });
          setToolDescription(desc);
        } catch {
          setToolDescription("Failed to load description");
        }
      };
      loadDescription();
    };
    t6 = [tool];
    $[10] = tool;
    $[11] = t5;
    $[12] = t6;
  } else {
    t5 = $[11];
    t6 = $[12];
  }
  import_react9.default.useEffect(t5, t6);
  let t7;
  if ($[13] !== isReadOnly) {
    t7 = isReadOnly && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
      color: "success",
      children: " [read-only]"
    }, undefined, false, undefined, this);
    $[13] = isReadOnly;
    $[14] = t7;
  } else {
    t7 = $[14];
  }
  let t8;
  if ($[15] !== isDestructive) {
    t8 = isDestructive && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
      color: "error",
      children: " [destructive]"
    }, undefined, false, undefined, this);
    $[15] = isDestructive;
    $[16] = t8;
  } else {
    t8 = $[16];
  }
  let t9;
  if ($[17] !== isOpenWorld) {
    t9 = isOpenWorld && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
      dimColor: true,
      children: " [open-world]"
    }, undefined, false, undefined, this);
    $[17] = isOpenWorld;
    $[18] = t9;
  } else {
    t9 = $[18];
  }
  let t10;
  if ($[19] !== displayName || $[20] !== t7 || $[21] !== t8 || $[22] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(jsx_dev_runtime12.Fragment, {
      children: [
        displayName,
        t7,
        t8,
        t9
      ]
    }, undefined, true, undefined, this);
    $[19] = displayName;
    $[20] = t7;
    $[21] = t8;
    $[22] = t9;
    $[23] = t10;
  } else {
    t10 = $[23];
  }
  const titleContent = t10;
  let t11;
  if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
    t11 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
      bold: true,
      children: "Tool name: "
    }, undefined, false, undefined, this);
    $[24] = t11;
  } else {
    t11 = $[24];
  }
  let t12;
  if ($[25] !== toolName) {
    t12 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
      children: [
        t11,
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          dimColor: true,
          children: toolName
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[25] = toolName;
    $[26] = t12;
  } else {
    t12 = $[26];
  }
  let t13;
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    t13 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
      bold: true,
      children: "Full name: "
    }, undefined, false, undefined, this);
    $[27] = t13;
  } else {
    t13 = $[27];
  }
  let t14;
  if ($[28] !== tool.name) {
    t14 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
      children: [
        t13,
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          dimColor: true,
          children: tool.name
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[28] = tool.name;
    $[29] = t14;
  } else {
    t14 = $[29];
  }
  let t15;
  if ($[30] !== toolDescription) {
    t15 = toolDescription && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          bold: true,
          children: "Description:"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          wrap: "wrap",
          children: toolDescription
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[30] = toolDescription;
    $[31] = t15;
  } else {
    t15 = $[31];
  }
  let t16;
  if ($[32] !== tool.inputJSONSchema) {
    t16 = tool.inputJSONSchema && tool.inputJSONSchema.properties && Object.keys(tool.inputJSONSchema.properties).length > 0 && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
          bold: true,
          children: "Parameters:"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
          marginLeft: 2,
          flexDirection: "column",
          children: Object.entries(tool.inputJSONSchema.properties).map((t172) => {
            const [key, value] = t172;
            const required = tool.inputJSONSchema?.required;
            const isRequired = required?.includes(key);
            return /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
              children: [
                "\u2022 ",
                key,
                isRequired && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: " (required)"
                }, undefined, false, undefined, this),
                ":",
                " ",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: typeof value === "object" && value && "type" in value ? String(value.type) : "unknown"
                }, undefined, false, undefined, this),
                typeof value === "object" && value && "description" in value && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: [
                    " - ",
                    String(value.description)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, key, true, undefined, this);
          })
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[32] = tool.inputJSONSchema;
    $[33] = t16;
  } else {
    t16 = $[33];
  }
  let t17;
  if ($[34] !== t12 || $[35] !== t14 || $[36] !== t15 || $[37] !== t16) {
    t17 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t12,
        t14,
        t15,
        t16
      ]
    }, undefined, true, undefined, this);
    $[34] = t12;
    $[35] = t14;
    $[36] = t15;
    $[37] = t16;
    $[38] = t17;
  } else {
    t17 = $[38];
  }
  let t18;
  if ($[39] !== onBack || $[40] !== server.name || $[41] !== t17 || $[42] !== titleContent) {
    t18 = /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(Dialog, {
      title: titleContent,
      subtitle: server.name,
      onCancel: onBack,
      inputGuide: _temp4,
      children: t17
    }, undefined, false, undefined, this);
    $[39] = onBack;
    $[40] = server.name;
    $[41] = t17;
    $[42] = titleContent;
    $[43] = t18;
  } else {
    t18 = $[43];
  }
  return t18;
}
function _temp4(exitState) {
  return exitState.pending ? /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ThemedText, {
    children: [
      "Press ",
      exitState.keyName,
      " again to exit"
    ]
  }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime12.jsxDEV(ConfigurableShortcutHint, {
    action: "confirm:no",
    context: "Confirmation",
    fallback: "Esc",
    description: "go back"
  }, undefined, false, undefined, this);
}
var import_compiler_runtime7, import_react9, jsx_dev_runtime12;
var init_MCPToolDetailView = __esm(() => {
  init_ink();
  init_mcpStringUtils();
  init_ConfigurableShortcutHint();
  init_Dialog();
  import_compiler_runtime7 = __toESM(require_compiler_runtime(), 1);
  import_react9 = __toESM(require_react(), 1);
  jsx_dev_runtime12 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/mcp/MCPToolListView.tsx
function MCPToolListView(t0) {
  const $ = import_compiler_runtime8.c(21);
  const {
    server,
    onSelectTool,
    onBack
  } = t0;
  const mcpTools = useAppState(_temp6);
  let t1;
  bb0: {
    if (server.client.type !== "connected") {
      let t23;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t23 = [];
        $[0] = t23;
      } else {
        t23 = $[0];
      }
      t1 = t23;
      break bb0;
    }
    let t22;
    if ($[1] !== mcpTools || $[2] !== server.name) {
      t22 = filterToolsByServer(mcpTools, server.name);
      $[1] = mcpTools;
      $[2] = server.name;
      $[3] = t22;
    } else {
      t22 = $[3];
    }
    t1 = t22;
  }
  const serverTools = t1;
  let t2;
  if ($[4] !== server.name || $[5] !== serverTools) {
    let t32;
    if ($[7] !== server.name) {
      t32 = (tool, index) => {
        const toolName = getMcpDisplayName(tool.name, server.name);
        const fullDisplayName = tool.userFacingName ? tool.userFacingName({}) : toolName;
        const displayName = extractMcpToolDisplayName(fullDisplayName);
        const isReadOnly = tool.isReadOnly?.({}) ?? false;
        const isDestructive = tool.isDestructive?.({}) ?? false;
        const isOpenWorld = tool.isOpenWorld?.({}) ?? false;
        const annotations = [];
        if (isReadOnly) {
          annotations.push("read-only");
        }
        if (isDestructive) {
          annotations.push("destructive");
        }
        if (isOpenWorld) {
          annotations.push("open-world");
        }
        return {
          label: displayName,
          value: index.toString(),
          description: annotations.length > 0 ? annotations.join(", ") : undefined,
          descriptionColor: isDestructive ? "error" : isReadOnly ? "success" : undefined
        };
      };
      $[7] = server.name;
      $[8] = t32;
    } else {
      t32 = $[8];
    }
    t2 = serverTools.map(t32);
    $[4] = server.name;
    $[5] = serverTools;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  const toolOptions = t2;
  const t3 = `Tools for ${server.name}`;
  const t4 = serverTools.length;
  let t5;
  if ($[9] !== serverTools.length) {
    t5 = plural(serverTools.length, "tool");
    $[9] = serverTools.length;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  const t6 = `${t4} ${t5}`;
  let t7;
  if ($[11] !== onBack || $[12] !== onSelectTool || $[13] !== serverTools || $[14] !== toolOptions) {
    t7 = serverTools.length === 0 ? /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(ThemedText, {
      dimColor: true,
      children: "No tools available"
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(Select, {
      options: toolOptions,
      onChange: (value) => {
        const index_0 = parseInt(value);
        const tool_0 = serverTools[index_0];
        if (tool_0) {
          onSelectTool(tool_0, index_0);
        }
      },
      onCancel: onBack
    }, undefined, false, undefined, this);
    $[11] = onBack;
    $[12] = onSelectTool;
    $[13] = serverTools;
    $[14] = toolOptions;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  let t8;
  if ($[16] !== onBack || $[17] !== t3 || $[18] !== t6 || $[19] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(Dialog, {
      title: t3,
      subtitle: t6,
      onCancel: onBack,
      inputGuide: _temp22,
      children: t7
    }, undefined, false, undefined, this);
    $[16] = onBack;
    $[17] = t3;
    $[18] = t6;
    $[19] = t7;
    $[20] = t8;
  } else {
    t8 = $[20];
  }
  return t8;
}
function _temp22(exitState) {
  return exitState.pending ? /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(ThemedText, {
    children: [
      "Press ",
      exitState.keyName,
      " again to exit"
    ]
  }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(Byline, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(KeyboardShortcutHint, {
        shortcut: "\u2191\u2193",
        action: "navigate"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(KeyboardShortcutHint, {
        shortcut: "Enter",
        action: "select"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(ConfigurableShortcutHint, {
        action: "confirm:no",
        context: "Confirmation",
        fallback: "Esc",
        description: "back"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function _temp6(s) {
  return s.mcp.tools;
}
var import_compiler_runtime8, jsx_dev_runtime13;
var init_MCPToolListView = __esm(() => {
  init_ink();
  init_mcpStringUtils();
  init_utils();
  init_AppState();
  init_stringUtils();
  init_ConfigurableShortcutHint();
  init_CustomSelect();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  import_compiler_runtime8 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime13 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/PluginErrors.tsx
function formatErrorMessage(error) {
  switch (error.type) {
    case "path-not-found":
      return `${error.component} path not found: ${error.path}`;
    case "git-auth-failed":
      return `Git ${error.authType.toUpperCase()} authentication failed for ${error.gitUrl}`;
    case "git-timeout":
      return `Git ${error.operation} timed out for ${error.gitUrl}`;
    case "network-error":
      return `Network error accessing ${error.url}${error.details ? `: ${error.details}` : ""}`;
    case "manifest-parse-error":
      return `Failed to parse manifest at ${error.manifestPath}: ${error.parseError}`;
    case "manifest-validation-error":
      return `Invalid manifest at ${error.manifestPath}: ${error.validationErrors.join(", ")}`;
    case "plugin-not-found":
      return `Plugin "${error.pluginId}" not found in marketplace "${error.marketplace}"`;
    case "marketplace-not-found":
      return `Marketplace "${error.marketplace}" not found`;
    case "marketplace-load-failed":
      return `Failed to load marketplace "${error.marketplace}": ${error.reason}`;
    case "mcp-config-invalid":
      return `Invalid MCP server config for "${error.serverName}": ${error.validationError}`;
    case "mcp-server-suppressed-duplicate": {
      const dup = error.duplicateOf.startsWith("plugin:") ? `server provided by plugin "${error.duplicateOf.split(":")[1] ?? "?"}"` : `already-configured "${error.duplicateOf}"`;
      return `MCP server "${error.serverName}" skipped \u2014 same command/URL as ${dup}`;
    }
    case "hook-load-failed":
      return `Failed to load hooks from ${error.hookPath}: ${error.reason}`;
    case "component-load-failed":
      return `Failed to load ${error.component} from ${error.path}: ${error.reason}`;
    case "mcpb-download-failed":
      return `Failed to download MCPB from ${error.url}: ${error.reason}`;
    case "mcpb-extract-failed":
      return `Failed to extract MCPB ${error.mcpbPath}: ${error.reason}`;
    case "mcpb-invalid-manifest":
      return `MCPB manifest invalid at ${error.mcpbPath}: ${error.validationError}`;
    case "marketplace-blocked-by-policy":
      return error.blockedByBlocklist ? `Marketplace "${error.marketplace}" is blocked by enterprise policy` : `Marketplace "${error.marketplace}" is not in the allowed marketplace list`;
    case "dependency-unsatisfied":
      return error.reason === "not-enabled" ? `Dependency "${error.dependency}" is disabled` : `Dependency "${error.dependency}" is not installed`;
    case "lsp-config-invalid":
      return `Invalid LSP server config for "${error.serverName}": ${error.validationError}`;
    case "lsp-server-start-failed":
      return `LSP server "${error.serverName}" failed to start: ${error.reason}`;
    case "lsp-server-crashed":
      return error.signal ? `LSP server "${error.serverName}" crashed with signal ${error.signal}` : `LSP server "${error.serverName}" crashed with exit code ${error.exitCode ?? "unknown"}`;
    case "lsp-request-timeout":
      return `LSP server "${error.serverName}" timed out on ${error.method} after ${error.timeoutMs}ms`;
    case "lsp-request-failed":
      return `LSP server "${error.serverName}" ${error.method} failed: ${error.error}`;
    case "plugin-cache-miss":
      return `Plugin "${error.plugin}" not cached at ${error.installPath}`;
    case "generic-error":
      return error.error;
  }
  const _exhaustive = error;
  return getPluginErrorMessage(_exhaustive);
}
function getErrorGuidance(error) {
  switch (error.type) {
    case "path-not-found":
      return "Check that the path in your manifest or marketplace config is correct";
    case "git-auth-failed":
      return error.authType === "ssh" ? "Configure SSH keys or use HTTPS URL instead" : "Configure credentials or use SSH URL instead";
    case "git-timeout":
    case "network-error":
      return "Check your internet connection and try again";
    case "manifest-parse-error":
      return "Check manifest file syntax in the plugin directory";
    case "manifest-validation-error":
      return "Check manifest file follows the required schema";
    case "plugin-not-found":
      return `Plugin may not exist in marketplace "${error.marketplace}"`;
    case "marketplace-not-found":
      return error.availableMarketplaces.length > 0 ? `Available marketplaces: ${error.availableMarketplaces.join(", ")}` : "Add the marketplace first using /plugin marketplace add";
    case "mcp-config-invalid":
      return "Check MCP server configuration in .mcp.json or manifest";
    case "mcp-server-suppressed-duplicate": {
      if (error.duplicateOf.startsWith("plugin:")) {
        const winningPlugin = error.duplicateOf.split(":")[1] ?? "the other plugin";
        return `Disable plugin "${winningPlugin}" if you want this plugin's version instead`;
      }
      return `Remove "${error.duplicateOf}" from your MCP config if you want the plugin's version instead`;
    }
    case "hook-load-failed":
      return "Check hooks.json file syntax and structure";
    case "component-load-failed":
      return `Check ${error.component} directory structure and file permissions`;
    case "mcpb-download-failed":
      return "Check your internet connection and URL accessibility";
    case "mcpb-extract-failed":
      return "Verify the MCPB file is valid and not corrupted";
    case "mcpb-invalid-manifest":
      return "Contact the plugin author about the invalid manifest";
    case "marketplace-blocked-by-policy":
      if (error.blockedByBlocklist) {
        return "This marketplace source is explicitly blocked by your administrator";
      }
      return error.allowedSources.length > 0 ? `Allowed sources: ${error.allowedSources.join(", ")}` : "Contact your administrator to configure allowed marketplace sources";
    case "dependency-unsatisfied":
      return error.reason === "not-enabled" ? `Enable "${error.dependency}" or uninstall "${error.plugin}"` : `Install "${error.dependency}" or uninstall "${error.plugin}"`;
    case "lsp-config-invalid":
      return "Check LSP server configuration in the plugin manifest";
    case "lsp-server-start-failed":
    case "lsp-server-crashed":
    case "lsp-request-timeout":
    case "lsp-request-failed":
      return "Check LSP server logs with --debug for details";
    case "plugin-cache-miss":
      return "Run /plugins to refresh the plugin cache";
    case "marketplace-load-failed":
    case "generic-error":
      return null;
  }
  const _exhaustive = error;
  return null;
}
var init_PluginErrors = __esm(() => {
  init_plugin();
});

// src/commands/plugin/UnifiedInstalledCell.tsx
function UnifiedInstalledCell(t0) {
  const $ = import_compiler_runtime9.c(142);
  const {
    item,
    isSelected
  } = t0;
  const [theme] = useTheme();
  if (item.type === "plugin") {
    let statusIcon;
    let statusText;
    if (item.pendingToggle) {
      let t15;
      if ($[0] !== theme) {
        t15 = color("suggestion", theme)(figures_default.arrowRight);
        $[0] = theme;
        $[1] = t15;
      } else {
        t15 = $[1];
      }
      statusIcon = t15;
      statusText = item.pendingToggle === "will-enable" ? "will enable" : "will disable";
    } else {
      if (item.errorCount > 0) {
        let t15;
        if ($[2] !== theme) {
          t15 = color("error", theme)(figures_default.cross);
          $[2] = theme;
          $[3] = t15;
        } else {
          t15 = $[3];
        }
        statusIcon = t15;
        const t23 = item.errorCount;
        let t33;
        if ($[4] !== item.errorCount) {
          t33 = plural(item.errorCount, "error");
          $[4] = item.errorCount;
          $[5] = t33;
        } else {
          t33 = $[5];
        }
        statusText = `${t23} ${t33}`;
      } else {
        if (!item.isEnabled) {
          let t15;
          if ($[6] !== theme) {
            t15 = color("inactive", theme)(figures_default.radioOff);
            $[6] = theme;
            $[7] = t15;
          } else {
            t15 = $[7];
          }
          statusIcon = t15;
          statusText = "disabled";
        } else {
          let t15;
          if ($[8] !== theme) {
            t15 = color("success", theme)(figures_default.tick);
            $[8] = theme;
            $[9] = t15;
          } else {
            t15 = $[9];
          }
          statusIcon = t15;
          statusText = "enabled";
        }
      }
    }
    const t14 = isSelected ? "suggestion" : undefined;
    const t22 = isSelected ? `${figures_default.pointer} ` : "  ";
    let t32;
    if ($[10] !== t14 || $[11] !== t22) {
      t32 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        color: t14,
        children: t22
      }, undefined, false, undefined, this);
      $[10] = t14;
      $[11] = t22;
      $[12] = t32;
    } else {
      t32 = $[12];
    }
    const t42 = isSelected ? "suggestion" : undefined;
    let t52;
    if ($[13] !== item.name || $[14] !== t42) {
      t52 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        color: t42,
        children: item.name
      }, undefined, false, undefined, this);
      $[13] = item.name;
      $[14] = t42;
      $[15] = t52;
    } else {
      t52 = $[15];
    }
    const t62 = !isSelected;
    let t72;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      t72 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        backgroundColor: "userMessageBackground",
        children: "Plugin"
      }, undefined, false, undefined, this);
      $[16] = t72;
    } else {
      t72 = $[16];
    }
    let t82;
    if ($[17] !== t62) {
      t82 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t62,
        children: [
          " ",
          t72
        ]
      }, undefined, true, undefined, this);
      $[17] = t62;
      $[18] = t82;
    } else {
      t82 = $[18];
    }
    let t92;
    if ($[19] !== item.marketplace) {
      t92 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          " \xB7 ",
          item.marketplace
        ]
      }, undefined, true, undefined, this);
      $[19] = item.marketplace;
      $[20] = t92;
    } else {
      t92 = $[20];
    }
    const t102 = !isSelected;
    let t112;
    if ($[21] !== statusIcon || $[22] !== t102) {
      t112 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t102,
        children: [
          " \xB7 ",
          statusIcon,
          " "
        ]
      }, undefined, true, undefined, this);
      $[21] = statusIcon;
      $[22] = t102;
      $[23] = t112;
    } else {
      t112 = $[23];
    }
    const t122 = !isSelected;
    let t132;
    if ($[24] !== statusText || $[25] !== t122) {
      t132 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t122,
        children: statusText
      }, undefined, false, undefined, this);
      $[24] = statusText;
      $[25] = t122;
      $[26] = t132;
    } else {
      t132 = $[26];
    }
    let t142;
    if ($[27] !== t112 || $[28] !== t132 || $[29] !== t32 || $[30] !== t52 || $[31] !== t82 || $[32] !== t92) {
      t142 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedBox_default, {
        children: [
          t32,
          t52,
          t82,
          t92,
          t112,
          t132
        ]
      }, undefined, true, undefined, this);
      $[27] = t112;
      $[28] = t132;
      $[29] = t32;
      $[30] = t52;
      $[31] = t82;
      $[32] = t92;
      $[33] = t142;
    } else {
      t142 = $[33];
    }
    return t142;
  }
  if (item.type === "flagged-plugin") {
    let t14;
    if ($[34] !== theme) {
      t14 = color("warning", theme)(figures_default.warning);
      $[34] = theme;
      $[35] = t14;
    } else {
      t14 = $[35];
    }
    const statusIcon_0 = t14;
    const t22 = isSelected ? "suggestion" : undefined;
    const t32 = isSelected ? `${figures_default.pointer} ` : "  ";
    let t42;
    if ($[36] !== t22 || $[37] !== t32) {
      t42 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        color: t22,
        children: t32
      }, undefined, false, undefined, this);
      $[36] = t22;
      $[37] = t32;
      $[38] = t42;
    } else {
      t42 = $[38];
    }
    const t52 = isSelected ? "suggestion" : undefined;
    let t62;
    if ($[39] !== item.name || $[40] !== t52) {
      t62 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        color: t52,
        children: item.name
      }, undefined, false, undefined, this);
      $[39] = item.name;
      $[40] = t52;
      $[41] = t62;
    } else {
      t62 = $[41];
    }
    const t72 = !isSelected;
    let t82;
    if ($[42] === Symbol.for("react.memo_cache_sentinel")) {
      t82 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        backgroundColor: "userMessageBackground",
        children: "Plugin"
      }, undefined, false, undefined, this);
      $[42] = t82;
    } else {
      t82 = $[42];
    }
    let t92;
    if ($[43] !== t72) {
      t92 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t72,
        children: [
          " ",
          t82
        ]
      }, undefined, true, undefined, this);
      $[43] = t72;
      $[44] = t92;
    } else {
      t92 = $[44];
    }
    let t102;
    if ($[45] !== item.marketplace) {
      t102 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          " \xB7 ",
          item.marketplace
        ]
      }, undefined, true, undefined, this);
      $[45] = item.marketplace;
      $[46] = t102;
    } else {
      t102 = $[46];
    }
    const t112 = !isSelected;
    let t122;
    if ($[47] !== statusIcon_0 || $[48] !== t112) {
      t122 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t112,
        children: [
          " \xB7 ",
          statusIcon_0,
          " "
        ]
      }, undefined, true, undefined, this);
      $[47] = statusIcon_0;
      $[48] = t112;
      $[49] = t122;
    } else {
      t122 = $[49];
    }
    const t132 = !isSelected;
    let t142;
    if ($[50] !== t132) {
      t142 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t132,
        children: "removed"
      }, undefined, false, undefined, this);
      $[50] = t132;
      $[51] = t142;
    } else {
      t142 = $[51];
    }
    let t15;
    if ($[52] !== t102 || $[53] !== t122 || $[54] !== t142 || $[55] !== t42 || $[56] !== t62 || $[57] !== t92) {
      t15 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedBox_default, {
        children: [
          t42,
          t62,
          t92,
          t102,
          t122,
          t142
        ]
      }, undefined, true, undefined, this);
      $[52] = t102;
      $[53] = t122;
      $[54] = t142;
      $[55] = t42;
      $[56] = t62;
      $[57] = t92;
      $[58] = t15;
    } else {
      t15 = $[58];
    }
    return t15;
  }
  if (item.type === "failed-plugin") {
    let t14;
    if ($[59] !== theme) {
      t14 = color("error", theme)(figures_default.cross);
      $[59] = theme;
      $[60] = t14;
    } else {
      t14 = $[60];
    }
    const statusIcon_1 = t14;
    const t22 = item.errorCount;
    let t32;
    if ($[61] !== item.errorCount) {
      t32 = plural(item.errorCount, "error");
      $[61] = item.errorCount;
      $[62] = t32;
    } else {
      t32 = $[62];
    }
    const statusText_0 = `failed to load \xB7 ${t22} ${t32}`;
    const t42 = isSelected ? "suggestion" : undefined;
    const t52 = isSelected ? `${figures_default.pointer} ` : "  ";
    let t62;
    if ($[63] !== t42 || $[64] !== t52) {
      t62 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        color: t42,
        children: t52
      }, undefined, false, undefined, this);
      $[63] = t42;
      $[64] = t52;
      $[65] = t62;
    } else {
      t62 = $[65];
    }
    const t72 = isSelected ? "suggestion" : undefined;
    let t82;
    if ($[66] !== item.name || $[67] !== t72) {
      t82 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        color: t72,
        children: item.name
      }, undefined, false, undefined, this);
      $[66] = item.name;
      $[67] = t72;
      $[68] = t82;
    } else {
      t82 = $[68];
    }
    const t92 = !isSelected;
    let t102;
    if ($[69] === Symbol.for("react.memo_cache_sentinel")) {
      t102 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        backgroundColor: "userMessageBackground",
        children: "Plugin"
      }, undefined, false, undefined, this);
      $[69] = t102;
    } else {
      t102 = $[69];
    }
    let t112;
    if ($[70] !== t92) {
      t112 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t92,
        children: [
          " ",
          t102
        ]
      }, undefined, true, undefined, this);
      $[70] = t92;
      $[71] = t112;
    } else {
      t112 = $[71];
    }
    let t122;
    if ($[72] !== item.marketplace) {
      t122 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          " \xB7 ",
          item.marketplace
        ]
      }, undefined, true, undefined, this);
      $[72] = item.marketplace;
      $[73] = t122;
    } else {
      t122 = $[73];
    }
    const t132 = !isSelected;
    let t142;
    if ($[74] !== statusIcon_1 || $[75] !== t132) {
      t142 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t132,
        children: [
          " \xB7 ",
          statusIcon_1,
          " "
        ]
      }, undefined, true, undefined, this);
      $[74] = statusIcon_1;
      $[75] = t132;
      $[76] = t142;
    } else {
      t142 = $[76];
    }
    const t15 = !isSelected;
    let t16;
    if ($[77] !== statusText_0 || $[78] !== t15) {
      t16 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t15,
        children: statusText_0
      }, undefined, false, undefined, this);
      $[77] = statusText_0;
      $[78] = t15;
      $[79] = t16;
    } else {
      t16 = $[79];
    }
    let t17;
    if ($[80] !== t112 || $[81] !== t122 || $[82] !== t142 || $[83] !== t16 || $[84] !== t62 || $[85] !== t82) {
      t17 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedBox_default, {
        children: [
          t62,
          t82,
          t112,
          t122,
          t142,
          t16
        ]
      }, undefined, true, undefined, this);
      $[80] = t112;
      $[81] = t122;
      $[82] = t142;
      $[83] = t16;
      $[84] = t62;
      $[85] = t82;
      $[86] = t17;
    } else {
      t17 = $[86];
    }
    return t17;
  }
  let statusIcon_2;
  let statusText_1;
  if (item.status === "connected") {
    let t14;
    if ($[87] !== theme) {
      t14 = color("success", theme)(figures_default.tick);
      $[87] = theme;
      $[88] = t14;
    } else {
      t14 = $[88];
    }
    statusIcon_2 = t14;
    statusText_1 = "connected";
  } else {
    if (item.status === "disabled") {
      let t14;
      if ($[89] !== theme) {
        t14 = color("inactive", theme)(figures_default.radioOff);
        $[89] = theme;
        $[90] = t14;
      } else {
        t14 = $[90];
      }
      statusIcon_2 = t14;
      statusText_1 = "disabled";
    } else {
      if (item.status === "pending") {
        let t14;
        if ($[91] !== theme) {
          t14 = color("inactive", theme)(figures_default.radioOff);
          $[91] = theme;
          $[92] = t14;
        } else {
          t14 = $[92];
        }
        statusIcon_2 = t14;
        statusText_1 = "connecting\u2026";
      } else {
        if (item.status === "needs-auth") {
          let t14;
          if ($[93] !== theme) {
            t14 = color("warning", theme)(figures_default.triangleUpOutline);
            $[93] = theme;
            $[94] = t14;
          } else {
            t14 = $[94];
          }
          statusIcon_2 = t14;
          statusText_1 = "Enter to auth";
        } else {
          let t14;
          if ($[95] !== theme) {
            t14 = color("error", theme)(figures_default.cross);
            $[95] = theme;
            $[96] = t14;
          } else {
            t14 = $[96];
          }
          statusIcon_2 = t14;
          statusText_1 = "failed";
        }
      }
    }
  }
  if (item.indented) {
    const t14 = isSelected ? "suggestion" : undefined;
    const t22 = isSelected ? `${figures_default.pointer} ` : "  ";
    let t32;
    if ($[97] !== t14 || $[98] !== t22) {
      t32 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        color: t14,
        children: t22
      }, undefined, false, undefined, this);
      $[97] = t14;
      $[98] = t22;
      $[99] = t32;
    } else {
      t32 = $[99];
    }
    const t42 = !isSelected;
    let t52;
    if ($[100] !== t42) {
      t52 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t42,
        children: "\u2514 "
      }, undefined, false, undefined, this);
      $[100] = t42;
      $[101] = t52;
    } else {
      t52 = $[101];
    }
    const t62 = isSelected ? "suggestion" : undefined;
    let t72;
    if ($[102] !== item.name || $[103] !== t62) {
      t72 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        color: t62,
        children: item.name
      }, undefined, false, undefined, this);
      $[102] = item.name;
      $[103] = t62;
      $[104] = t72;
    } else {
      t72 = $[104];
    }
    const t82 = !isSelected;
    let t92;
    if ($[105] === Symbol.for("react.memo_cache_sentinel")) {
      t92 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        backgroundColor: "userMessageBackground",
        children: "MCP"
      }, undefined, false, undefined, this);
      $[105] = t92;
    } else {
      t92 = $[105];
    }
    let t102;
    if ($[106] !== t82) {
      t102 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t82,
        children: [
          " ",
          t92
        ]
      }, undefined, true, undefined, this);
      $[106] = t82;
      $[107] = t102;
    } else {
      t102 = $[107];
    }
    const t112 = !isSelected;
    let t122;
    if ($[108] !== statusIcon_2 || $[109] !== t112) {
      t122 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t112,
        children: [
          " \xB7 ",
          statusIcon_2,
          " "
        ]
      }, undefined, true, undefined, this);
      $[108] = statusIcon_2;
      $[109] = t112;
      $[110] = t122;
    } else {
      t122 = $[110];
    }
    const t132 = !isSelected;
    let t142;
    if ($[111] !== statusText_1 || $[112] !== t132) {
      t142 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
        dimColor: t132,
        children: statusText_1
      }, undefined, false, undefined, this);
      $[111] = statusText_1;
      $[112] = t132;
      $[113] = t142;
    } else {
      t142 = $[113];
    }
    let t15;
    if ($[114] !== t102 || $[115] !== t122 || $[116] !== t142 || $[117] !== t32 || $[118] !== t52 || $[119] !== t72) {
      t15 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedBox_default, {
        children: [
          t32,
          t52,
          t72,
          t102,
          t122,
          t142
        ]
      }, undefined, true, undefined, this);
      $[114] = t102;
      $[115] = t122;
      $[116] = t142;
      $[117] = t32;
      $[118] = t52;
      $[119] = t72;
      $[120] = t15;
    } else {
      t15 = $[120];
    }
    return t15;
  }
  const t1 = isSelected ? "suggestion" : undefined;
  const t2 = isSelected ? `${figures_default.pointer} ` : "  ";
  let t3;
  if ($[121] !== t1 || $[122] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
      color: t1,
      children: t2
    }, undefined, false, undefined, this);
    $[121] = t1;
    $[122] = t2;
    $[123] = t3;
  } else {
    t3 = $[123];
  }
  const t4 = isSelected ? "suggestion" : undefined;
  let t5;
  if ($[124] !== item.name || $[125] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
      color: t4,
      children: item.name
    }, undefined, false, undefined, this);
    $[124] = item.name;
    $[125] = t4;
    $[126] = t5;
  } else {
    t5 = $[126];
  }
  const t6 = !isSelected;
  let t7;
  if ($[127] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
      backgroundColor: "userMessageBackground",
      children: "MCP"
    }, undefined, false, undefined, this);
    $[127] = t7;
  } else {
    t7 = $[127];
  }
  let t8;
  if ($[128] !== t6) {
    t8 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
      dimColor: t6,
      children: [
        " ",
        t7
      ]
    }, undefined, true, undefined, this);
    $[128] = t6;
    $[129] = t8;
  } else {
    t8 = $[129];
  }
  const t9 = !isSelected;
  let t10;
  if ($[130] !== statusIcon_2 || $[131] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
      dimColor: t9,
      children: [
        " \xB7 ",
        statusIcon_2,
        " "
      ]
    }, undefined, true, undefined, this);
    $[130] = statusIcon_2;
    $[131] = t9;
    $[132] = t10;
  } else {
    t10 = $[132];
  }
  const t11 = !isSelected;
  let t12;
  if ($[133] !== statusText_1 || $[134] !== t11) {
    t12 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedText, {
      dimColor: t11,
      children: statusText_1
    }, undefined, false, undefined, this);
    $[133] = statusText_1;
    $[134] = t11;
    $[135] = t12;
  } else {
    t12 = $[135];
  }
  let t13;
  if ($[136] !== t10 || $[137] !== t12 || $[138] !== t3 || $[139] !== t5 || $[140] !== t8) {
    t13 = /* @__PURE__ */ jsx_dev_runtime14.jsxDEV(ThemedBox_default, {
      children: [
        t3,
        t5,
        t8,
        t10,
        t12
      ]
    }, undefined, true, undefined, this);
    $[136] = t10;
    $[137] = t12;
    $[138] = t3;
    $[139] = t5;
    $[140] = t8;
    $[141] = t13;
  } else {
    t13 = $[141];
  }
  return t13;
}
var import_compiler_runtime9, jsx_dev_runtime14;
var init_UnifiedInstalledCell = __esm(() => {
  init_figures();
  init_ink();
  init_stringUtils();
  import_compiler_runtime9 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime14 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/ManagePlugins.tsx
import * as fs from "fs/promises";
import * as path from "path";
async function getBaseFileNames(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, {
      withFileTypes: true
    });
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => {
      const baseName = path.basename(entry.name, ".md");
      return baseName;
    });
  } catch (error) {
    const errorMsg = errorMessage(error);
    logForDebugging(`Failed to read plugin components from ${dirPath}: ${errorMsg}`, {
      level: "error"
    });
    logError(toError(error));
    return [];
  }
}
async function getSkillDirNames(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, {
      withFileTypes: true
    });
    const skillNames = [];
    for (const entry of entries) {
      if (entry.isDirectory() || entry.isSymbolicLink()) {
        const skillFilePath = path.join(dirPath, entry.name, "SKILL.md");
        try {
          const st = await fs.stat(skillFilePath);
          if (st.isFile()) {
            skillNames.push(entry.name);
          }
        } catch {}
      }
    }
    return skillNames;
  } catch (error) {
    const errorMsg = errorMessage(error);
    logForDebugging(`Failed to read skill directories from ${dirPath}: ${errorMsg}`, {
      level: "error"
    });
    logError(toError(error));
    return [];
  }
}
function PluginComponentsDisplay({
  plugin,
  marketplace
}) {
  const [components, setComponents] = import_react10.useState(null);
  const [loading, setLoading] = import_react10.useState(true);
  const [error, setError] = import_react10.useState(null);
  import_react10.useEffect(() => {
    async function loadComponents() {
      try {
        if (marketplace === "builtin") {
          const builtinDef = getBuiltinPluginDefinition(plugin.name);
          if (builtinDef) {
            const skillNames = builtinDef.skills?.map((s) => s.name) ?? [];
            const hookEvents = builtinDef.hooks ? Object.keys(builtinDef.hooks) : [];
            const mcpServerNames = builtinDef.mcpServers ? Object.keys(builtinDef.mcpServers) : [];
            setComponents({
              commands: null,
              agents: null,
              skills: skillNames.length > 0 ? skillNames : null,
              hooks: hookEvents.length > 0 ? hookEvents : null,
              mcpServers: mcpServerNames.length > 0 ? mcpServerNames : null
            });
          } else {
            setError(`Built-in plugin ${plugin.name} not found`);
          }
          setLoading(false);
          return;
        }
        const marketplaceData = await getMarketplace(marketplace);
        const pluginEntry = marketplaceData.plugins.find((p) => p.name === plugin.name);
        if (pluginEntry) {
          const commandPathList = [];
          if (plugin.commandsPath) {
            commandPathList.push(plugin.commandsPath);
          }
          if (plugin.commandsPaths) {
            commandPathList.push(...plugin.commandsPaths);
          }
          const commandList = [];
          for (const commandPath of commandPathList) {
            if (typeof commandPath === "string") {
              const baseNames = await getBaseFileNames(commandPath);
              commandList.push(...baseNames);
            }
          }
          const agentPathList = [];
          if (plugin.agentsPath) {
            agentPathList.push(plugin.agentsPath);
          }
          if (plugin.agentsPaths) {
            agentPathList.push(...plugin.agentsPaths);
          }
          const agentList = [];
          for (const agentPath of agentPathList) {
            if (typeof agentPath === "string") {
              const baseNames_0 = await getBaseFileNames(agentPath);
              agentList.push(...baseNames_0);
            }
          }
          const skillPathList = [];
          if (plugin.skillsPath) {
            skillPathList.push(plugin.skillsPath);
          }
          if (plugin.skillsPaths) {
            skillPathList.push(...plugin.skillsPaths);
          }
          const skillList = [];
          for (const skillPath of skillPathList) {
            if (typeof skillPath === "string") {
              const skillDirNames = await getSkillDirNames(skillPath);
              skillList.push(...skillDirNames);
            }
          }
          const hooksList = [];
          if (plugin.hooksConfig) {
            hooksList.push(Object.keys(plugin.hooksConfig));
          }
          if (pluginEntry.hooks) {
            hooksList.push(pluginEntry.hooks);
          }
          const mcpServersList = [];
          if (plugin.mcpServers) {
            mcpServersList.push(Object.keys(plugin.mcpServers));
          }
          if (pluginEntry.mcpServers) {
            mcpServersList.push(pluginEntry.mcpServers);
          }
          setComponents({
            commands: commandList.length > 0 ? commandList : null,
            agents: agentList.length > 0 ? agentList : null,
            skills: skillList.length > 0 ? skillList : null,
            hooks: hooksList.length > 0 ? hooksList : null,
            mcpServers: mcpServersList.length > 0 ? mcpServersList : null
          });
        } else {
          setError(`Plugin ${plugin.name} not found in marketplace`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load components");
      } finally {
        setLoading(false);
      }
    }
    loadComponents();
  }, [plugin.name, plugin.commandsPath, plugin.commandsPaths, plugin.agentsPath, plugin.agentsPaths, plugin.skillsPath, plugin.skillsPaths, plugin.hooksConfig, plugin.mcpServers, marketplace]);
  if (loading) {
    return null;
  }
  if (error) {
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          bold: true,
          children: "Components:"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "Error: ",
            error
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (!components) {
    return null;
  }
  const hasComponents = components.commands || components.agents || components.skills || components.hooks || components.mcpServers;
  if (!hasComponents) {
    return null;
  }
  return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
        bold: true,
        children: "Installed components:"
      }, undefined, false, undefined, this),
      components.commands ? /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "\u2022 Commands:",
          " ",
          typeof components.commands === "string" ? components.commands : Array.isArray(components.commands) ? components.commands.join(", ") : Object.keys(components.commands).join(", ")
        ]
      }, undefined, true, undefined, this) : null,
      components.agents ? /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "\u2022 Agents:",
          " ",
          typeof components.agents === "string" ? components.agents : Array.isArray(components.agents) ? components.agents.join(", ") : Object.keys(components.agents).join(", ")
        ]
      }, undefined, true, undefined, this) : null,
      components.skills ? /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "\u2022 Skills:",
          " ",
          typeof components.skills === "string" ? components.skills : Array.isArray(components.skills) ? components.skills.join(", ") : Object.keys(components.skills).join(", ")
        ]
      }, undefined, true, undefined, this) : null,
      components.hooks ? /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "\u2022 Hooks:",
          " ",
          typeof components.hooks === "string" ? components.hooks : Array.isArray(components.hooks) ? components.hooks.map(String).join(", ") : typeof components.hooks === "object" && components.hooks !== null ? Object.keys(components.hooks).join(", ") : String(components.hooks)
        ]
      }, undefined, true, undefined, this) : null,
      components.mcpServers ? /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "\u2022 MCP Servers:",
          " ",
          typeof components.mcpServers === "string" ? components.mcpServers : Array.isArray(components.mcpServers) ? components.mcpServers.map(String).join(", ") : typeof components.mcpServers === "object" && components.mcpServers !== null ? Object.keys(components.mcpServers).join(", ") : String(components.mcpServers)
        ]
      }, undefined, true, undefined, this) : null
    ]
  }, undefined, true, undefined, this);
}
async function checkIfLocalPlugin(pluginName, marketplaceName) {
  const marketplace = await getMarketplace(marketplaceName);
  const entry = marketplace?.plugins.find((p) => p.name === pluginName);
  if (entry && typeof entry.source === "string") {
    return `Local plugins cannot be updated remotely. To update, modify the source at: ${entry.source}`;
  }
  return null;
}
function filterManagedDisabledPlugins(plugins) {
  return plugins.filter((plugin) => {
    const marketplace = plugin.source.split("@")[1] || "local";
    return !isPluginBlockedByPolicy(`${plugin.name}@${marketplace}`);
  });
}
function ManagePlugins({
  setViewState: setParentViewState,
  setResult,
  onManageComplete,
  onSearchModeChange,
  targetPlugin,
  targetMarketplace,
  action
}) {
  const mcpClients = useAppState((s) => s.mcp.clients);
  const mcpTools = useAppState((s_0) => s_0.mcp.tools);
  const pluginErrors = useAppState((s_1) => s_1.plugins.errors);
  const flaggedPlugins = getFlaggedPlugins();
  const [isSearchMode, setIsSearchModeRaw] = import_react10.useState(false);
  const setIsSearchMode = import_react10.useCallback((active) => {
    setIsSearchModeRaw(active);
    onSearchModeChange?.(active);
  }, [onSearchModeChange]);
  const isTerminalFocused = useTerminalFocus();
  const {
    columns: terminalWidth
  } = useTerminalSize();
  const [viewState, setViewState] = import_react10.useState("plugin-list");
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    cursorOffset: searchCursorOffset
  } = useSearchInput({
    isActive: viewState === "plugin-list" && isSearchMode,
    onExit: () => {
      setIsSearchMode(false);
    }
  });
  const [selectedPlugin, setSelectedPlugin] = import_react10.useState(null);
  const [marketplaces, setMarketplaces] = import_react10.useState([]);
  const [pluginStates, setPluginStates] = import_react10.useState([]);
  const [loading, setLoading] = import_react10.useState(true);
  const [pendingToggles, setPendingToggles] = import_react10.useState(new Map);
  const hasAutoNavigated = import_react10.useRef(false);
  const pendingAutoActionRef = import_react10.useRef(undefined);
  const toggleMcpServer = useMcpToggleEnabled();
  const handleBack = React8.useCallback(() => {
    if (viewState === "plugin-details") {
      setViewState("plugin-list");
      setSelectedPlugin(null);
      setProcessError(null);
    } else if (typeof viewState === "object" && viewState.type === "failed-plugin-details") {
      setViewState("plugin-list");
      setProcessError(null);
    } else if (viewState === "configuring") {
      setViewState("plugin-details");
      setConfigNeeded(null);
    } else if (typeof viewState === "object" && (viewState.type === "plugin-options" || viewState.type === "configuring-options")) {
      setViewState("plugin-list");
      setSelectedPlugin(null);
      setResult("Plugin enabled. Configuration skipped \u2014 run /reload-plugins to apply.");
      if (onManageComplete) {
        onManageComplete();
      }
    } else if (typeof viewState === "object" && viewState.type === "flagged-detail") {
      setViewState("plugin-list");
      setProcessError(null);
    } else if (typeof viewState === "object" && viewState.type === "mcp-detail") {
      setViewState("plugin-list");
      setProcessError(null);
    } else if (typeof viewState === "object" && viewState.type === "mcp-tools") {
      setViewState({
        type: "mcp-detail",
        client: viewState.client
      });
    } else if (typeof viewState === "object" && viewState.type === "mcp-tool-detail") {
      setViewState({
        type: "mcp-tools",
        client: viewState.client
      });
    } else {
      if (pendingToggles.size > 0) {
        setResult("Run /reload-plugins to apply plugin changes.");
        return;
      }
      setParentViewState({
        type: "menu"
      });
    }
  }, [viewState, setParentViewState, pendingToggles, setResult]);
  useKeybinding("confirm:no", handleBack, {
    context: "Confirmation",
    isActive: (viewState !== "plugin-list" || !isSearchMode) && viewState !== "confirm-project-uninstall" && !(typeof viewState === "object" && viewState.type === "confirm-data-cleanup")
  });
  const getMcpStatus = (client) => {
    if (client.type === "connected")
      return "connected";
    if (client.type === "disabled")
      return "disabled";
    if (client.type === "pending")
      return "pending";
    if (client.type === "needs-auth")
      return "needs-auth";
    return "failed";
  };
  const unifiedItems = import_react10.useMemo(() => {
    const mergedSettings = getSettings_DEPRECATED();
    const pluginMcpMap = new Map;
    for (const client_0 of mcpClients) {
      if (client_0.name.startsWith("plugin:")) {
        const parts = client_0.name.split(":");
        if (parts.length >= 3) {
          const pluginName = parts[1];
          const serverName = parts.slice(2).join(":");
          const existing = pluginMcpMap.get(pluginName) || [];
          existing.push({
            displayName: serverName,
            client: client_0
          });
          pluginMcpMap.set(pluginName, existing);
        }
      }
    }
    const pluginsWithChildren = [];
    for (const state of pluginStates) {
      const pluginId = `${state.plugin.name}@${state.marketplace}`;
      const isEnabled = mergedSettings?.enabledPlugins?.[pluginId] !== false;
      const errors = pluginErrors.filter((e) => ("plugin" in e) && e.plugin === state.plugin.name || e.source === pluginId || e.source.startsWith(`${state.plugin.name}@`));
      const originalScope = state.plugin.isBuiltin ? "builtin" : state.scope || "user";
      pluginsWithChildren.push({
        item: {
          type: "plugin",
          id: pluginId,
          name: state.plugin.name,
          description: state.plugin.manifest.description,
          marketplace: state.marketplace,
          scope: originalScope,
          isEnabled,
          errorCount: errors.length,
          errors,
          plugin: state.plugin,
          pendingEnable: state.pendingEnable,
          pendingUpdate: state.pendingUpdate,
          pendingToggle: pendingToggles.get(pluginId)
        },
        originalScope,
        childMcps: pluginMcpMap.get(state.plugin.name) || []
      });
    }
    const matchedPluginIds = new Set(pluginsWithChildren.map(({
      item
    }) => item.id));
    const matchedPluginNames = new Set(pluginsWithChildren.map(({
      item: item_0
    }) => item_0.name));
    const orphanErrorsBySource = new Map;
    for (const error of pluginErrors) {
      if (matchedPluginIds.has(error.source) || "plugin" in error && typeof error.plugin === "string" && matchedPluginNames.has(error.plugin)) {
        continue;
      }
      const existing_0 = orphanErrorsBySource.get(error.source) || [];
      existing_0.push(error);
      orphanErrorsBySource.set(error.source, existing_0);
    }
    const pluginScopes = getPluginEditableScopes();
    const failedPluginItems = [];
    for (const [pluginId_0, errors_0] of orphanErrorsBySource) {
      if (pluginId_0 in flaggedPlugins)
        continue;
      const parsed = parsePluginIdentifier(pluginId_0);
      const pluginName_0 = parsed.name || pluginId_0;
      const marketplace = parsed.marketplace || "unknown";
      const rawScope = pluginScopes.get(pluginId_0);
      const scope = rawScope === "flag" || rawScope === undefined ? "user" : rawScope;
      failedPluginItems.push({
        type: "failed-plugin",
        id: pluginId_0,
        name: pluginName_0,
        marketplace,
        scope,
        errorCount: errors_0.length,
        errors: errors_0
      });
    }
    const standaloneMcps = [];
    for (const client_1 of mcpClients) {
      if (client_1.name === "ide")
        continue;
      if (client_1.name.startsWith("plugin:"))
        continue;
      standaloneMcps.push({
        type: "mcp",
        id: `mcp:${client_1.name}`,
        name: client_1.name,
        description: undefined,
        scope: client_1.config.scope,
        status: getMcpStatus(client_1),
        client: client_1
      });
    }
    const scopeOrder = {
      flagged: -1,
      project: 0,
      local: 1,
      user: 2,
      enterprise: 3,
      managed: 4,
      dynamic: 5,
      builtin: 6
    };
    const unified = [];
    const itemsByScope = new Map;
    for (const {
      item: item_1,
      originalScope: originalScope_0,
      childMcps
    } of pluginsWithChildren) {
      const scope_0 = item_1.scope;
      if (!itemsByScope.has(scope_0)) {
        itemsByScope.set(scope_0, []);
      }
      itemsByScope.get(scope_0).push(item_1);
      for (const {
        displayName,
        client: client_2
      } of childMcps) {
        const displayScope = originalScope_0 === "builtin" ? "user" : originalScope_0;
        if (!itemsByScope.has(displayScope)) {
          itemsByScope.set(displayScope, []);
        }
        itemsByScope.get(displayScope).push({
          type: "mcp",
          id: `mcp:${client_2.name}`,
          name: displayName,
          description: undefined,
          scope: displayScope,
          status: getMcpStatus(client_2),
          client: client_2,
          indented: true
        });
      }
    }
    for (const mcp of standaloneMcps) {
      const scope_1 = mcp.scope;
      if (!itemsByScope.has(scope_1)) {
        itemsByScope.set(scope_1, []);
      }
      itemsByScope.get(scope_1).push(mcp);
    }
    for (const failedPlugin of failedPluginItems) {
      const scope_2 = failedPlugin.scope;
      if (!itemsByScope.has(scope_2)) {
        itemsByScope.set(scope_2, []);
      }
      itemsByScope.get(scope_2).push(failedPlugin);
    }
    for (const [pluginId_1, entry] of Object.entries(flaggedPlugins)) {
      const parsed_0 = parsePluginIdentifier(pluginId_1);
      const pluginName_1 = parsed_0.name || pluginId_1;
      const marketplace_0 = parsed_0.marketplace || "unknown";
      if (!itemsByScope.has("flagged")) {
        itemsByScope.set("flagged", []);
      }
      itemsByScope.get("flagged").push({
        type: "flagged-plugin",
        id: pluginId_1,
        name: pluginName_1,
        marketplace: marketplace_0,
        scope: "flagged",
        reason: "delisted",
        text: "Removed from marketplace",
        flaggedAt: entry.flaggedAt
      });
    }
    const sortedScopes = [...itemsByScope.keys()].sort((a, b) => (scopeOrder[a] ?? 99) - (scopeOrder[b] ?? 99));
    for (const scope_3 of sortedScopes) {
      const items = itemsByScope.get(scope_3);
      const pluginGroups = [];
      const standaloneMcpsInScope = [];
      let i = 0;
      while (i < items.length) {
        const item_2 = items[i];
        if (item_2.type === "plugin" || item_2.type === "failed-plugin" || item_2.type === "flagged-plugin") {
          const group = [item_2];
          i++;
          let nextItem = items[i];
          while (nextItem?.type === "mcp" && nextItem.indented) {
            group.push(nextItem);
            i++;
            nextItem = items[i];
          }
          pluginGroups.push(group);
        } else if (item_2.type === "mcp" && !item_2.indented) {
          standaloneMcpsInScope.push(item_2);
          i++;
        } else {
          i++;
        }
      }
      pluginGroups.sort((a_0, b_0) => a_0[0].name.localeCompare(b_0[0].name));
      standaloneMcpsInScope.sort((a_1, b_1) => a_1.name.localeCompare(b_1.name));
      for (const group_0 of pluginGroups) {
        unified.push(...group_0);
      }
      unified.push(...standaloneMcpsInScope);
    }
    return unified;
  }, [pluginStates, mcpClients, pluginErrors, pendingToggles, flaggedPlugins]);
  const flaggedIds = import_react10.useMemo(() => unifiedItems.filter((item_3) => item_3.type === "flagged-plugin").map((item_4) => item_4.id), [unifiedItems]);
  import_react10.useEffect(() => {
    if (flaggedIds.length > 0) {
      markFlaggedPluginsSeen(flaggedIds);
    }
  }, [flaggedIds]);
  const filteredItems = import_react10.useMemo(() => {
    if (!searchQuery)
      return unifiedItems;
    const lowerQuery = searchQuery.toLowerCase();
    return unifiedItems.filter((item_5) => item_5.name.toLowerCase().includes(lowerQuery) || ("description" in item_5) && item_5.description?.toLowerCase().includes(lowerQuery));
  }, [unifiedItems, searchQuery]);
  const [selectedIndex, setSelectedIndex] = import_react10.useState(0);
  const pagination = usePagination({
    totalItems: filteredItems.length,
    selectedIndex,
    maxVisible: 8
  });
  const [detailsMenuIndex, setDetailsMenuIndex] = import_react10.useState(0);
  const [isProcessing, setIsProcessing] = import_react10.useState(false);
  const [processError, setProcessError] = import_react10.useState(null);
  const [configNeeded, setConfigNeeded] = import_react10.useState(null);
  const [_isLoadingConfig, setIsLoadingConfig] = import_react10.useState(false);
  const [selectedPluginHasMcpb, setSelectedPluginHasMcpb] = import_react10.useState(false);
  import_react10.useEffect(() => {
    if (!selectedPlugin) {
      setSelectedPluginHasMcpb(false);
      return;
    }
    async function detectMcpb() {
      const mcpServersSpec = selectedPlugin.plugin.manifest.mcpServers;
      let hasMcpb = false;
      if (mcpServersSpec) {
        hasMcpb = typeof mcpServersSpec === "string" && isMcpbSource(mcpServersSpec) || Array.isArray(mcpServersSpec) && mcpServersSpec.some((s_2) => typeof s_2 === "string" && isMcpbSource(s_2));
      }
      if (!hasMcpb) {
        try {
          const marketplaceDir = path.join(selectedPlugin.plugin.path, "..");
          const marketplaceJsonPath = path.join(marketplaceDir, ".claude-plugin", "marketplace.json");
          const content = await fs.readFile(marketplaceJsonPath, "utf-8");
          const marketplace_1 = jsonParse(content);
          const entry_0 = marketplace_1.plugins?.find((p) => p.name === selectedPlugin.plugin.name);
          if (entry_0?.mcpServers) {
            const spec = entry_0.mcpServers;
            hasMcpb = typeof spec === "string" && isMcpbSource(spec) || Array.isArray(spec) && spec.some((s_3) => typeof s_3 === "string" && isMcpbSource(s_3));
          }
        } catch (err) {
          logForDebugging(`Failed to read raw marketplace.json: ${err}`);
        }
      }
      setSelectedPluginHasMcpb(hasMcpb);
    }
    detectMcpb();
  }, [selectedPlugin]);
  import_react10.useEffect(() => {
    async function loadInstalledPlugins() {
      setLoading(true);
      try {
        const {
          enabled,
          disabled
        } = await loadAllPlugins();
        const mergedSettings = getSettings_DEPRECATED();
        const allPlugins = filterManagedDisabledPlugins([...enabled, ...disabled]);
        const pluginsByMarketplace = {};
        for (const plugin of allPlugins) {
          const marketplace = plugin.source.split("@")[1] || "local";
          if (!pluginsByMarketplace[marketplace]) {
            pluginsByMarketplace[marketplace] = [];
          }
          pluginsByMarketplace[marketplace].push(plugin);
        }
        const marketplaceInfos = [];
        for (const [name, plugins] of Object.entries(pluginsByMarketplace)) {
          const enabledCount = count(plugins, (p) => {
            const pluginId = `${p.name}@${name}`;
            return mergedSettings?.enabledPlugins?.[pluginId] !== false;
          });
          const disabledCount = plugins.length - enabledCount;
          marketplaceInfos.push({
            name,
            installedPlugins: plugins,
            enabledCount,
            disabledCount
          });
        }
        marketplaceInfos.sort((a, b) => {
          if (a.name === "claude-plugin-directory")
            return -1;
          if (b.name === "claude-plugin-directory")
            return 1;
          return a.name.localeCompare(b.name);
        });
        setMarketplaces(marketplaceInfos);
        const allStates = [];
        for (const marketplace of marketplaceInfos) {
          for (const plugin of marketplace.installedPlugins) {
            const pluginId = `${plugin.name}@${marketplace.name}`;
            const scope = plugin.isBuiltin ? "builtin" : getPluginInstallationFromV2(pluginId).scope;
            allStates.push({
              plugin,
              marketplace: marketplace.name,
              scope,
              pendingEnable: undefined,
              pendingUpdate: false
            });
          }
        }
        setPluginStates(allStates);
        setSelectedIndex(0);
      } finally {
        setLoading(false);
      }
    }
    loadInstalledPlugins();
  }, []);
  import_react10.useEffect(() => {
    if (hasAutoNavigated.current)
      return;
    if (targetPlugin && marketplaces.length > 0 && !loading) {
      const {
        name: targetName,
        marketplace: targetMktFromId
      } = parsePluginIdentifier(targetPlugin);
      const effectiveTargetMarketplace = targetMarketplace ?? targetMktFromId;
      const marketplacesToSearch = effectiveTargetMarketplace ? marketplaces.filter((m) => m.name === effectiveTargetMarketplace) : marketplaces;
      for (const marketplace_2 of marketplacesToSearch) {
        const plugin = marketplace_2.installedPlugins.find((p_0) => p_0.name === targetName);
        if (plugin) {
          const pluginId_2 = `${plugin.name}@${marketplace_2.name}`;
          const {
            scope: scope_4
          } = getPluginInstallationFromV2(pluginId_2);
          const pluginState = {
            plugin,
            marketplace: marketplace_2.name,
            scope: scope_4,
            pendingEnable: undefined,
            pendingUpdate: false
          };
          setSelectedPlugin(pluginState);
          setViewState("plugin-details");
          pendingAutoActionRef.current = action;
          hasAutoNavigated.current = true;
          return;
        }
      }
      const failedItem = unifiedItems.find((item_6) => item_6.type === "failed-plugin" && item_6.name === targetName);
      if (failedItem && failedItem.type === "failed-plugin") {
        setViewState({
          type: "failed-plugin-details",
          plugin: {
            id: failedItem.id,
            name: failedItem.name,
            marketplace: failedItem.marketplace,
            errors: failedItem.errors,
            scope: failedItem.scope
          }
        });
        hasAutoNavigated.current = true;
      }
      if (!hasAutoNavigated.current && action) {
        hasAutoNavigated.current = true;
        setResult(`Plugin "${targetPlugin}" is not installed in this project`);
      }
    }
  }, [targetPlugin, targetMarketplace, marketplaces, loading, unifiedItems, action, setResult]);
  const handleSingleOperation = async (operation) => {
    if (!selectedPlugin)
      return;
    const pluginScope = selectedPlugin.scope || "user";
    const isBuiltin = pluginScope === "builtin";
    if (isBuiltin && (operation === "update" || operation === "uninstall")) {
      setProcessError("Built-in plugins cannot be updated or uninstalled.");
      return;
    }
    if (!isBuiltin && !isInstallableScope(pluginScope) && operation !== "update") {
      setProcessError("This plugin is managed by your organization. Contact your admin to disable it.");
      return;
    }
    setIsProcessing(true);
    setProcessError(null);
    try {
      const pluginId_3 = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
      let reverseDependents;
      switch (operation) {
        case "enable": {
          const enableResult = await enablePluginOp(pluginId_3);
          if (!enableResult.success) {
            throw new Error(enableResult.message);
          }
          break;
        }
        case "disable": {
          const disableResult = await disablePluginOp(pluginId_3);
          if (!disableResult.success) {
            throw new Error(disableResult.message);
          }
          reverseDependents = disableResult.reverseDependents;
          break;
        }
        case "uninstall": {
          if (isBuiltin)
            break;
          if (!isInstallableScope(pluginScope))
            break;
          if (isPluginEnabledAtProjectScope(pluginId_3)) {
            setIsProcessing(false);
            setViewState("confirm-project-uninstall");
            return;
          }
          const installs = loadInstalledPluginsV2().plugins[pluginId_3];
          const isLastScope = !installs || installs.length <= 1;
          const dataSize = isLastScope ? await getPluginDataDirSize(pluginId_3) : null;
          if (dataSize) {
            setIsProcessing(false);
            setViewState({
              type: "confirm-data-cleanup",
              size: dataSize
            });
            return;
          }
          const result_0 = await uninstallPluginOp(pluginId_3, pluginScope);
          if (!result_0.success) {
            throw new Error(result_0.message);
          }
          reverseDependents = result_0.reverseDependents;
          break;
        }
        case "update": {
          if (isBuiltin)
            break;
          const result = await updatePluginOp(pluginId_3, pluginScope);
          if (!result.success) {
            throw new Error(result.message);
          }
          if (result.alreadyUpToDate) {
            setResult(`${selectedPlugin.plugin.name} is already at the latest version (${result.newVersion}).`);
            if (onManageComplete) {
              await onManageComplete();
            }
            setParentViewState({
              type: "menu"
            });
            return;
          }
          break;
        }
      }
      clearAllCaches();
      const pluginIdNow = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
      const settingsAfter = getSettings_DEPRECATED();
      const enabledAfter = settingsAfter?.enabledPlugins?.[pluginIdNow] !== false;
      if (enabledAfter) {
        setIsProcessing(false);
        setViewState({
          type: "plugin-options"
        });
        return;
      }
      const operationName = operation === "enable" ? "Enabled" : operation === "disable" ? "Disabled" : operation === "update" ? "Updated" : "Uninstalled";
      const depWarn = reverseDependents && reverseDependents.length > 0 ? ` \xB7 required by ${reverseDependents.join(", ")}` : "";
      const message = `\u2713 ${operationName} ${selectedPlugin.plugin.name}${depWarn}. Run /reload-plugins to apply.`;
      setResult(message);
      if (onManageComplete) {
        await onManageComplete();
      }
      setParentViewState({
        type: "menu"
      });
    } catch (error_0) {
      setIsProcessing(false);
      const errorMessage2 = error_0 instanceof Error ? error_0.message : String(error_0);
      setProcessError(`Failed to ${operation}: ${errorMessage2}`);
      logError(toError(error_0));
    }
  };
  const handleSingleOperationRef = import_react10.useRef(handleSingleOperation);
  handleSingleOperationRef.current = handleSingleOperation;
  import_react10.useEffect(() => {
    if (viewState === "plugin-details" && selectedPlugin && pendingAutoActionRef.current) {
      const pending = pendingAutoActionRef.current;
      pendingAutoActionRef.current = undefined;
      handleSingleOperationRef.current(pending);
    }
  }, [viewState, selectedPlugin]);
  const handleToggle = React8.useCallback(() => {
    if (selectedIndex >= filteredItems.length)
      return;
    const item_7 = filteredItems[selectedIndex];
    if (item_7?.type === "flagged-plugin")
      return;
    if (item_7?.type === "plugin") {
      const pluginId_4 = `${item_7.plugin.name}@${item_7.marketplace}`;
      const mergedSettings_0 = getSettings_DEPRECATED();
      const currentPending = pendingToggles.get(pluginId_4);
      const isEnabled_0 = mergedSettings_0?.enabledPlugins?.[pluginId_4] !== false;
      const pluginScope_0 = item_7.scope;
      const isBuiltin_0 = pluginScope_0 === "builtin";
      if (isBuiltin_0 || isInstallableScope(pluginScope_0)) {
        const newPending = new Map(pendingToggles);
        if (currentPending) {
          newPending.delete(pluginId_4);
          (async () => {
            try {
              if (currentPending === "will-disable") {
                await enablePluginOp(pluginId_4);
              } else {
                await disablePluginOp(pluginId_4);
              }
              clearAllCaches();
            } catch (err_0) {
              logError(err_0);
            }
          })();
        } else {
          newPending.set(pluginId_4, isEnabled_0 ? "will-disable" : "will-enable");
          (async () => {
            try {
              if (isEnabled_0) {
                await disablePluginOp(pluginId_4);
              } else {
                await enablePluginOp(pluginId_4);
              }
              clearAllCaches();
            } catch (err_1) {
              logError(err_1);
            }
          })();
        }
        setPendingToggles(newPending);
      }
    } else if (item_7?.type === "mcp") {
      toggleMcpServer(item_7.client.name);
    }
  }, [selectedIndex, filteredItems, pendingToggles, pluginStates, toggleMcpServer]);
  const handleAccept = React8.useCallback(() => {
    if (selectedIndex >= filteredItems.length)
      return;
    const item_8 = filteredItems[selectedIndex];
    if (item_8?.type === "plugin") {
      const state_0 = pluginStates.find((s_4) => s_4.plugin.name === item_8.plugin.name && s_4.marketplace === item_8.marketplace);
      if (state_0) {
        setSelectedPlugin(state_0);
        setViewState("plugin-details");
        setDetailsMenuIndex(0);
        setProcessError(null);
      }
    } else if (item_8?.type === "flagged-plugin") {
      setViewState({
        type: "flagged-detail",
        plugin: {
          id: item_8.id,
          name: item_8.name,
          marketplace: item_8.marketplace,
          reason: item_8.reason,
          text: item_8.text,
          flaggedAt: item_8.flaggedAt
        }
      });
      setProcessError(null);
    } else if (item_8?.type === "failed-plugin") {
      setViewState({
        type: "failed-plugin-details",
        plugin: {
          id: item_8.id,
          name: item_8.name,
          marketplace: item_8.marketplace,
          errors: item_8.errors,
          scope: item_8.scope
        }
      });
      setDetailsMenuIndex(0);
      setProcessError(null);
    } else if (item_8?.type === "mcp") {
      setViewState({
        type: "mcp-detail",
        client: item_8.client
      });
      setProcessError(null);
    }
  }, [selectedIndex, filteredItems, pluginStates]);
  useKeybindings({
    "select:previous": () => {
      if (selectedIndex === 0) {
        setIsSearchMode(true);
      } else {
        pagination.handleSelectionChange(selectedIndex - 1, setSelectedIndex);
      }
    },
    "select:next": () => {
      if (selectedIndex < filteredItems.length - 1) {
        pagination.handleSelectionChange(selectedIndex + 1, setSelectedIndex);
      }
    },
    "select:accept": handleAccept
  }, {
    context: "Select",
    isActive: viewState === "plugin-list" && !isSearchMode
  });
  useKeybindings({
    "plugin:toggle": handleToggle
  }, {
    context: "Plugin",
    isActive: viewState === "plugin-list" && !isSearchMode
  });
  const handleFlaggedDismiss = React8.useCallback(() => {
    if (typeof viewState !== "object" || viewState.type !== "flagged-detail")
      return;
    removeFlaggedPlugin(viewState.plugin.id);
    setViewState("plugin-list");
  }, [viewState]);
  useKeybindings({
    "select:accept": handleFlaggedDismiss
  }, {
    context: "Select",
    isActive: typeof viewState === "object" && viewState.type === "flagged-detail"
  });
  const detailsMenuItems = React8.useMemo(() => {
    if (viewState !== "plugin-details" || !selectedPlugin)
      return [];
    const mergedSettings_1 = getSettings_DEPRECATED();
    const pluginId_5 = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
    const isEnabled_1 = mergedSettings_1?.enabledPlugins?.[pluginId_5] !== false;
    const isBuiltin_1 = selectedPlugin.marketplace === "builtin";
    const menuItems = [];
    menuItems.push({
      label: isEnabled_1 ? "Disable plugin" : "Enable plugin",
      action: () => void handleSingleOperation(isEnabled_1 ? "disable" : "enable")
    });
    if (!isBuiltin_1) {
      menuItems.push({
        label: selectedPlugin.pendingUpdate ? "Unmark for update" : "Mark for update",
        action: async () => {
          try {
            const localError = await checkIfLocalPlugin(selectedPlugin.plugin.name, selectedPlugin.marketplace);
            if (localError) {
              setProcessError(localError);
              return;
            }
            const newStates = [...pluginStates];
            const index = newStates.findIndex((s_5) => s_5.plugin.name === selectedPlugin.plugin.name && s_5.marketplace === selectedPlugin.marketplace);
            if (index !== -1) {
              newStates[index].pendingUpdate = !selectedPlugin.pendingUpdate;
              setPluginStates(newStates);
              setSelectedPlugin({
                ...selectedPlugin,
                pendingUpdate: !selectedPlugin.pendingUpdate
              });
            }
          } catch (error_1) {
            setProcessError(error_1 instanceof Error ? error_1.message : "Failed to check plugin update availability");
          }
        }
      });
      if (selectedPluginHasMcpb) {
        menuItems.push({
          label: "Configure",
          action: async () => {
            setIsLoadingConfig(true);
            try {
              const mcpServersSpec_0 = selectedPlugin.plugin.manifest.mcpServers;
              let mcpbPath = null;
              if (typeof mcpServersSpec_0 === "string" && isMcpbSource(mcpServersSpec_0)) {
                mcpbPath = mcpServersSpec_0;
              } else if (Array.isArray(mcpServersSpec_0)) {
                for (const spec_0 of mcpServersSpec_0) {
                  if (typeof spec_0 === "string" && isMcpbSource(spec_0)) {
                    mcpbPath = spec_0;
                    break;
                  }
                }
              }
              if (!mcpbPath) {
                setProcessError("No MCPB file found in plugin");
                setIsLoadingConfig(false);
                return;
              }
              const pluginId_6 = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
              const result_1 = await loadMcpbFile(mcpbPath, selectedPlugin.plugin.path, pluginId_6, undefined, undefined, true);
              if ("status" in result_1 && result_1.status === "needs-config") {
                setConfigNeeded(result_1);
                setViewState("configuring");
              } else {
                setProcessError("Failed to load MCPB for configuration");
              }
            } catch (err_2) {
              const errorMsg = errorMessage(err_2);
              setProcessError(`Failed to load configuration: ${errorMsg}`);
            } finally {
              setIsLoadingConfig(false);
            }
          }
        });
      }
      if (selectedPlugin.plugin.manifest.userConfig && Object.keys(selectedPlugin.plugin.manifest.userConfig).length > 0) {
        menuItems.push({
          label: "Configure options",
          action: () => {
            setViewState({
              type: "configuring-options",
              schema: selectedPlugin.plugin.manifest.userConfig
            });
          }
        });
      }
      menuItems.push({
        label: "Update now",
        action: () => void handleSingleOperation("update")
      });
      menuItems.push({
        label: "Uninstall",
        action: () => void handleSingleOperation("uninstall")
      });
    }
    if (selectedPlugin.plugin.manifest.homepage) {
      menuItems.push({
        label: "Open homepage",
        action: () => void openBrowser(selectedPlugin.plugin.manifest.homepage)
      });
    }
    if (selectedPlugin.plugin.manifest.repository) {
      menuItems.push({
        label: "View repository",
        action: () => void openBrowser(selectedPlugin.plugin.manifest.repository)
      });
    }
    menuItems.push({
      label: "Back to plugin list",
      action: () => {
        setViewState("plugin-list");
        setSelectedPlugin(null);
        setProcessError(null);
      }
    });
    return menuItems;
  }, [viewState, selectedPlugin, selectedPluginHasMcpb, pluginStates]);
  useKeybindings({
    "select:previous": () => {
      if (detailsMenuIndex > 0) {
        setDetailsMenuIndex(detailsMenuIndex - 1);
      }
    },
    "select:next": () => {
      if (detailsMenuIndex < detailsMenuItems.length - 1) {
        setDetailsMenuIndex(detailsMenuIndex + 1);
      }
    },
    "select:accept": () => {
      if (detailsMenuItems[detailsMenuIndex]) {
        detailsMenuItems[detailsMenuIndex].action();
      }
    }
  }, {
    context: "Select",
    isActive: viewState === "plugin-details" && !!selectedPlugin
  });
  useKeybindings({
    "select:accept": () => {
      if (typeof viewState === "object" && viewState.type === "failed-plugin-details") {
        (async () => {
          setIsProcessing(true);
          setProcessError(null);
          const pluginId_7 = viewState.plugin.id;
          const pluginScope_1 = viewState.plugin.scope;
          const result_2 = isInstallableScope(pluginScope_1) ? await uninstallPluginOp(pluginId_7, pluginScope_1, false) : await uninstallPluginOp(pluginId_7, "user", false);
          let success = result_2.success;
          if (!success) {
            const editableSources = ["userSettings", "projectSettings", "localSettings"];
            for (const source of editableSources) {
              const settings = getSettingsForSource(source);
              if (settings?.enabledPlugins?.[pluginId_7] !== undefined) {
                updateSettingsForSource(source, {
                  enabledPlugins: {
                    ...settings.enabledPlugins,
                    [pluginId_7]: undefined
                  }
                });
                success = true;
              }
            }
            clearAllCaches();
          }
          if (success) {
            if (onManageComplete) {
              await onManageComplete();
            }
            setIsProcessing(false);
            setViewState("plugin-list");
          } else {
            setIsProcessing(false);
            setProcessError(result_2.message);
          }
        })();
      }
    }
  }, {
    context: "Select",
    isActive: typeof viewState === "object" && viewState.type === "failed-plugin-details" && viewState.plugin.scope !== "managed"
  });
  useKeybindings({
    "confirm:yes": () => {
      if (!selectedPlugin)
        return;
      setIsProcessing(true);
      setProcessError(null);
      const pluginId_8 = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
      const {
        error: error_2
      } = updateSettingsForSource("localSettings", {
        enabledPlugins: {
          ...getSettingsForSource("localSettings")?.enabledPlugins,
          [pluginId_8]: false
        }
      });
      if (error_2) {
        setIsProcessing(false);
        setProcessError(`Failed to write settings: ${error_2.message}`);
        return;
      }
      clearAllCaches();
      setResult(`\u2713 Disabled ${selectedPlugin.plugin.name} in .claude/settings.local.json. Run /reload-plugins to apply.`);
      if (onManageComplete)
        onManageComplete();
      setParentViewState({
        type: "menu"
      });
    },
    "confirm:no": () => {
      setViewState("plugin-details");
      setProcessError(null);
    }
  }, {
    context: "Confirmation",
    isActive: viewState === "confirm-project-uninstall" && !!selectedPlugin && !isProcessing
  });
  use_input_default((input, key) => {
    if (!selectedPlugin)
      return;
    const pluginId_9 = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
    const pluginScope_2 = selectedPlugin.scope;
    if (!pluginScope_2 || pluginScope_2 === "builtin" || !isInstallableScope(pluginScope_2))
      return;
    const doUninstall = async (deleteDataDir) => {
      setIsProcessing(true);
      setProcessError(null);
      try {
        const result_3 = await uninstallPluginOp(pluginId_9, pluginScope_2, deleteDataDir);
        if (!result_3.success)
          throw new Error(result_3.message);
        clearAllCaches();
        const suffix = deleteDataDir ? "" : " \xB7 data preserved";
        setResult(`${figures_default.tick} ${result_3.message}${suffix}`);
        if (onManageComplete)
          onManageComplete();
        setParentViewState({
          type: "menu"
        });
      } catch (e_0) {
        setIsProcessing(false);
        setProcessError(e_0 instanceof Error ? e_0.message : String(e_0));
      }
    };
    if (input === "y" || input === "Y") {
      doUninstall(true);
    } else if (input === "n" || input === "N") {
      doUninstall(false);
    } else if (key.escape) {
      setViewState("plugin-details");
      setProcessError(null);
    }
  }, {
    isActive: typeof viewState === "object" && viewState.type === "confirm-data-cleanup" && !!selectedPlugin && !isProcessing
  });
  React8.useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);
  use_input_default((input_0, key_0) => {
    const keyIsNotCtrlOrMeta = !key_0.ctrl && !key_0.meta;
    if (isSearchMode) {
      return;
    }
    if (input_0 === "/" && keyIsNotCtrlOrMeta) {
      setIsSearchMode(true);
      setSearchQuery("");
      setSelectedIndex(0);
    } else if (keyIsNotCtrlOrMeta && input_0.length > 0 && !/^\s+$/.test(input_0) && input_0 !== "j" && input_0 !== "k" && input_0 !== " ") {
      setIsSearchMode(true);
      setSearchQuery(input_0);
      setSelectedIndex(0);
    }
  }, {
    isActive: viewState === "plugin-list"
  });
  if (loading) {
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
      children: "Loading installed plugins\u2026"
    }, undefined, false, undefined, this);
  }
  if (unifiedItems.length === 0) {
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            bold: true,
            children: "Manage plugins"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          children: "No plugins or MCP servers installed."
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Esc to go back"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (typeof viewState === "object" && viewState.type === "plugin-options" && selectedPlugin) {
    let finish = function(msg) {
      setResult(msg);
      if (onManageComplete) {
        onManageComplete();
      }
      setParentViewState({
        type: "menu"
      });
    };
    const pluginId_10 = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(PluginOptionsFlow, {
      plugin: selectedPlugin.plugin,
      pluginId: pluginId_10,
      onDone: (outcome, detail) => {
        switch (outcome) {
          case "configured":
            finish(`\u2713 Enabled and configured ${selectedPlugin.plugin.name}. Run /reload-plugins to apply.`);
            break;
          case "skipped":
            finish(`\u2713 Enabled ${selectedPlugin.plugin.name}. Run /reload-plugins to apply.`);
            break;
          case "error":
            finish(`Failed to save configuration: ${detail}`);
            break;
        }
      }
    }, undefined, false, undefined, this);
  }
  if (typeof viewState === "object" && viewState.type === "configuring-options" && selectedPlugin) {
    const pluginId_11 = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(PluginOptionsDialog, {
      title: `Configure ${selectedPlugin.plugin.name}`,
      subtitle: "Plugin options",
      configSchema: viewState.schema,
      initialValues: loadPluginOptions(pluginId_11),
      onSave: (values) => {
        try {
          savePluginOptions(pluginId_11, values, viewState.schema);
          clearAllCaches();
          setResult("Configuration saved. Run /reload-plugins for changes to take effect.");
        } catch (err_3) {
          setProcessError(`Failed to save configuration: ${errorMessage(err_3)}`);
        }
        setViewState("plugin-details");
      },
      onCancel: () => setViewState("plugin-details")
    }, undefined, false, undefined, this);
  }
  if (viewState === "configuring" && configNeeded && selectedPlugin) {
    let handleCancel = function() {
      setConfigNeeded(null);
      setViewState("plugin-details");
    };
    const pluginId_12 = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
    async function handleSave(config) {
      if (!configNeeded || !selectedPlugin)
        return;
      try {
        const mcpServersSpec_1 = selectedPlugin.plugin.manifest.mcpServers;
        let mcpbPath_0 = null;
        if (typeof mcpServersSpec_1 === "string" && isMcpbSource(mcpServersSpec_1)) {
          mcpbPath_0 = mcpServersSpec_1;
        } else if (Array.isArray(mcpServersSpec_1)) {
          for (const spec_1 of mcpServersSpec_1) {
            if (typeof spec_1 === "string" && isMcpbSource(spec_1)) {
              mcpbPath_0 = spec_1;
              break;
            }
          }
        }
        if (!mcpbPath_0) {
          setProcessError("No MCPB file found");
          setViewState("plugin-details");
          return;
        }
        await loadMcpbFile(mcpbPath_0, selectedPlugin.plugin.path, pluginId_12, undefined, config);
        setProcessError(null);
        setConfigNeeded(null);
        setViewState("plugin-details");
        setResult("Configuration saved. Run /reload-plugins for changes to take effect.");
      } catch (err_4) {
        const errorMsg_0 = errorMessage(err_4);
        setProcessError(`Failed to save configuration: ${errorMsg_0}`);
        setViewState("plugin-details");
      }
    }
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(PluginOptionsDialog, {
      title: `Configure ${configNeeded.manifest.name}`,
      subtitle: `Plugin: ${selectedPlugin.plugin.name}`,
      configSchema: configNeeded.configSchema,
      initialValues: configNeeded.existingConfig,
      onSave: handleSave,
      onCancel: handleCancel
    }, undefined, false, undefined, this);
  }
  if (typeof viewState === "object" && viewState.type === "flagged-detail") {
    const fp = viewState.plugin;
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            bold: true,
            children: [
              fp.name,
              " @ ",
              fp.marketplace
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Status: "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              color: "error",
              children: "Removed"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              color: "error",
              children: [
                "Removed from marketplace \xB7 reason: ",
                fp.reason
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              children: fp.text
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "Flagged on ",
                new Date(fp.flaggedAt).toLocaleDateString()
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          flexDirection: "column",
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                children: [
                  figures_default.pointer,
                  " "
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                color: "suggestion",
                children: "Dismiss"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(Byline, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
              action: "select:accept",
              context: "Select",
              fallback: "Enter",
              description: "dismiss"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
              action: "confirm:no",
              context: "Confirmation",
              fallback: "Esc",
              description: "back"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (viewState === "confirm-project-uninstall" && selectedPlugin) {
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          bold: true,
          color: "warning",
          children: [
            selectedPlugin.plugin.name,
            " is enabled in .claude/settings.json (shared with your team)"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              children: "Disable it just for you in .claude/settings.local.json?"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: "This has the same effect as uninstalling, without affecting other contributors."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        processError && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            color: "error",
            children: processError
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: isProcessing ? /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Disabling\u2026"
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:yes",
                context: "Confirmation",
                fallback: "y",
                description: "disable"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (typeof viewState === "object" && viewState.type === "confirm-data-cleanup" && selectedPlugin) {
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          bold: true,
          children: [
            selectedPlugin.plugin.name,
            " has ",
            viewState.size.human,
            " of persistent data"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              children: "Delete it along with the plugin?"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: pluginDataDirPath(`${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        processError && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            color: "error",
            children: processError
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: isProcessing ? /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Uninstalling\u2026"
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                bold: true,
                children: "y"
              }, undefined, false, undefined, this),
              " to delete \xB7 ",
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                bold: true,
                children: "n"
              }, undefined, false, undefined, this),
              " to keep \xB7",
              " ",
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                bold: true,
                children: "esc"
              }, undefined, false, undefined, this),
              " to cancel"
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (viewState === "plugin-details" && selectedPlugin) {
    const mergedSettings_2 = getSettings_DEPRECATED();
    const pluginId_13 = `${selectedPlugin.plugin.name}@${selectedPlugin.marketplace}`;
    const isEnabled_2 = mergedSettings_2?.enabledPlugins?.[pluginId_13] !== false;
    const filteredPluginErrors = pluginErrors.filter((e_1) => ("plugin" in e_1) && e_1.plugin === selectedPlugin.plugin.name || e_1.source === pluginId_13 || e_1.source.startsWith(`${selectedPlugin.plugin.name}@`));
    const pluginErrorsSection = filteredPluginErrors.length === 0 ? null : /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          bold: true,
          color: "error",
          children: [
            filteredPluginErrors.length,
            " ",
            plural(filteredPluginErrors.length, "error"),
            ":"
          ]
        }, undefined, true, undefined, this),
        filteredPluginErrors.map((error_3, i_0) => {
          const guidance = getErrorGuidance(error_3);
          return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginLeft: 2,
            children: [
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                color: "error",
                children: formatErrorMessage(error_3)
              }, undefined, false, undefined, this),
              guidance && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                dimColor: true,
                italic: true,
                children: [
                  figures_default.arrowRight,
                  " ",
                  guidance
                ]
              }, undefined, true, undefined, this)
            ]
          }, i_0, true, undefined, this);
        })
      ]
    }, undefined, true, undefined, this);
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            bold: true,
            children: [
              selectedPlugin.plugin.name,
              " @ ",
              selectedPlugin.marketplace
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Scope: "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              children: selectedPlugin.scope || "user"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        selectedPlugin.plugin.manifest.version && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Version: "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              children: selectedPlugin.plugin.manifest.version
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        selectedPlugin.plugin.manifest.description && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            children: selectedPlugin.plugin.manifest.description
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        selectedPlugin.plugin.manifest.author && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Author: "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              children: selectedPlugin.plugin.manifest.author.name
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginBottom: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Status: "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              color: isEnabled_2 ? "success" : "warning",
              children: isEnabled_2 ? "Enabled" : "Disabled"
            }, undefined, false, undefined, this),
            selectedPlugin.pendingUpdate && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              color: "suggestion",
              children: " \xB7 Marked for update"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(PluginComponentsDisplay, {
          plugin: selectedPlugin.plugin,
          marketplace: selectedPlugin.marketplace
        }, undefined, false, undefined, this),
        pluginErrorsSection,
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          flexDirection: "column",
          children: detailsMenuItems.map((item_9, index_0) => {
            const isSelected = index_0 === detailsMenuIndex;
            return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
              children: [
                isSelected && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                  children: [
                    figures_default.pointer,
                    " "
                  ]
                }, undefined, true, undefined, this),
                !isSelected && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                  children: "  "
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                  bold: isSelected,
                  color: item_9.label.includes("Uninstall") ? "error" : item_9.label.includes("Update") ? "suggestion" : undefined,
                  children: item_9.label
                }, undefined, false, undefined, this)
              ]
            }, index_0, true, undefined, this);
          })
        }, undefined, false, undefined, this),
        isProcessing && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            children: "Processing\u2026"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        processError && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            color: "error",
            children: processError
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(Byline, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                  action: "select:previous",
                  context: "Select",
                  fallback: "\u2191",
                  description: "navigate"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                  action: "select:accept",
                  context: "Select",
                  fallback: "Enter",
                  description: "select"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                  action: "confirm:no",
                  context: "Confirmation",
                  fallback: "Esc",
                  description: "back"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (typeof viewState === "object" && viewState.type === "failed-plugin-details") {
    const failedPlugin_0 = viewState.plugin;
    const firstError = failedPlugin_0.errors[0];
    const errorMessage_0 = firstError ? formatErrorMessage(firstError) : "Failed to load";
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              bold: true,
              children: failedPlugin_0.name
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                " @ ",
                failedPlugin_0.marketplace
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                " (",
                failedPlugin_0.scope,
                ")"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          color: "error",
          children: errorMessage_0
        }, undefined, false, undefined, this),
        failedPlugin_0.scope === "managed" ? /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Managed by your organization \u2014 contact your admin"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              color: "suggestion",
              children: [
                figures_default.pointer,
                " "
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
              bold: true,
              children: "Remove"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        isProcessing && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          children: "Processing\u2026"
        }, undefined, false, undefined, this),
        processError && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          color: "error",
          children: processError
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(Byline, {
              children: [
                failedPlugin_0.scope !== "managed" && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                  action: "select:accept",
                  context: "Select",
                  fallback: "Enter",
                  description: "remove"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                  action: "confirm:no",
                  context: "Confirmation",
                  fallback: "Esc",
                  description: "back"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (typeof viewState === "object" && viewState.type === "mcp-detail") {
    const client_3 = viewState.client;
    const serverToolsCount = filterToolsByServer(mcpTools, client_3.name).length;
    const handleMcpViewTools = () => {
      setViewState({
        type: "mcp-tools",
        client: client_3
      });
    };
    const handleMcpCancel = () => {
      setViewState("plugin-list");
    };
    const handleMcpComplete = (result_4) => {
      if (result_4) {
        setResult(result_4);
      }
      setViewState("plugin-list");
    };
    const scope_5 = client_3.config.scope;
    const configType = client_3.config.type;
    if (configType === "stdio") {
      const server = {
        name: client_3.name,
        client: client_3,
        scope: scope_5,
        transport: "stdio",
        config: client_3.config
      };
      return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(MCPStdioServerMenu, {
        server,
        serverToolsCount,
        onViewTools: handleMcpViewTools,
        onCancel: handleMcpCancel,
        onComplete: handleMcpComplete,
        borderless: true
      }, undefined, false, undefined, this);
    } else if (configType === "sse") {
      const server_0 = {
        name: client_3.name,
        client: client_3,
        scope: scope_5,
        transport: "sse",
        isAuthenticated: undefined,
        config: client_3.config
      };
      return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(MCPRemoteServerMenu, {
        server: server_0,
        serverToolsCount,
        onViewTools: handleMcpViewTools,
        onCancel: handleMcpCancel,
        onComplete: handleMcpComplete,
        borderless: true
      }, undefined, false, undefined, this);
    } else if (configType === "http") {
      const server_1 = {
        name: client_3.name,
        client: client_3,
        scope: scope_5,
        transport: "http",
        isAuthenticated: undefined,
        config: client_3.config
      };
      return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(MCPRemoteServerMenu, {
        server: server_1,
        serverToolsCount,
        onViewTools: handleMcpViewTools,
        onCancel: handleMcpCancel,
        onComplete: handleMcpComplete,
        borderless: true
      }, undefined, false, undefined, this);
    } else if (configType === "claudeai-proxy") {
      const server_2 = {
        name: client_3.name,
        client: client_3,
        scope: scope_5,
        transport: "claudeai-proxy",
        isAuthenticated: undefined,
        config: client_3.config
      };
      return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(MCPRemoteServerMenu, {
        server: server_2,
        serverToolsCount,
        onViewTools: handleMcpViewTools,
        onCancel: handleMcpCancel,
        onComplete: handleMcpComplete,
        borderless: true
      }, undefined, false, undefined, this);
    }
    setViewState("plugin-list");
    return null;
  }
  if (typeof viewState === "object" && viewState.type === "mcp-tools") {
    const client_4 = viewState.client;
    const scope_6 = client_4.config.scope;
    const configType_0 = client_4.config.type;
    let server_3;
    if (configType_0 === "stdio") {
      server_3 = {
        name: client_4.name,
        client: client_4,
        scope: scope_6,
        transport: "stdio",
        config: client_4.config
      };
    } else if (configType_0 === "sse") {
      server_3 = {
        name: client_4.name,
        client: client_4,
        scope: scope_6,
        transport: "sse",
        isAuthenticated: undefined,
        config: client_4.config
      };
    } else if (configType_0 === "http") {
      server_3 = {
        name: client_4.name,
        client: client_4,
        scope: scope_6,
        transport: "http",
        isAuthenticated: undefined,
        config: client_4.config
      };
    } else {
      server_3 = {
        name: client_4.name,
        client: client_4,
        scope: scope_6,
        transport: "claudeai-proxy",
        isAuthenticated: undefined,
        config: client_4.config
      };
    }
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(MCPToolListView, {
      server: server_3,
      onSelectTool: (tool) => {
        setViewState({
          type: "mcp-tool-detail",
          client: client_4,
          tool
        });
      },
      onBack: () => setViewState({
        type: "mcp-detail",
        client: client_4
      })
    }, undefined, false, undefined, this);
  }
  if (typeof viewState === "object" && viewState.type === "mcp-tool-detail") {
    const {
      client: client_5,
      tool: tool_0
    } = viewState;
    const scope_7 = client_5.config.scope;
    const configType_1 = client_5.config.type;
    let server_4;
    if (configType_1 === "stdio") {
      server_4 = {
        name: client_5.name,
        client: client_5,
        scope: scope_7,
        transport: "stdio",
        config: client_5.config
      };
    } else if (configType_1 === "sse") {
      server_4 = {
        name: client_5.name,
        client: client_5,
        scope: scope_7,
        transport: "sse",
        isAuthenticated: undefined,
        config: client_5.config
      };
    } else if (configType_1 === "http") {
      server_4 = {
        name: client_5.name,
        client: client_5,
        scope: scope_7,
        transport: "http",
        isAuthenticated: undefined,
        config: client_5.config
      };
    } else {
      server_4 = {
        name: client_5.name,
        client: client_5,
        scope: scope_7,
        transport: "claudeai-proxy",
        isAuthenticated: undefined,
        config: client_5.config
      };
    }
    return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(MCPToolDetailView, {
      tool: tool_0,
      server: server_4,
      onBack: () => setViewState({
        type: "mcp-tools",
        client: client_5
      })
    }, undefined, false, undefined, this);
  }
  const visibleItems = pagination.getVisibleItems(filteredItems);
  return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(SearchBox, {
          query: searchQuery,
          isFocused: isSearchMode,
          isTerminalFocused,
          width: terminalWidth - 4,
          cursorOffset: searchCursorOffset
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      filteredItems.length === 0 && searchQuery && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            'No items match "',
            searchQuery,
            '"'
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      pagination.scrollPosition.canScrollUp && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            " ",
            figures_default.arrowUp,
            " more above"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      visibleItems.map((item_10, visibleIndex) => {
        const actualIndex = pagination.toActualIndex(visibleIndex);
        const isSelected_0 = actualIndex === selectedIndex && !isSearchMode;
        const prevItem = visibleIndex > 0 ? visibleItems[visibleIndex - 1] : null;
        const showScopeHeader = !prevItem || prevItem.scope !== item_10.scope;
        const getScopeLabel = (scope_8) => {
          switch (scope_8) {
            case "flagged":
              return "Flagged";
            case "project":
              return "Project";
            case "local":
              return "Local";
            case "user":
              return "User";
            case "enterprise":
              return "Enterprise";
            case "managed":
              return "Managed";
            case "builtin":
              return "Built-in";
            case "dynamic":
              return "Built-in";
            default:
              return scope_8;
          }
        };
        return /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(React8.Fragment, {
          children: [
            showScopeHeader && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
              marginTop: visibleIndex > 0 ? 1 : 0,
              paddingLeft: 2,
              children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                dimColor: item_10.scope !== "flagged",
                color: item_10.scope === "flagged" ? "warning" : undefined,
                bold: item_10.scope === "flagged",
                children: getScopeLabel(item_10.scope)
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(UnifiedInstalledCell, {
              item: item_10,
              isSelected: isSelected_0
            }, undefined, false, undefined, this)
          ]
        }, item_10.id, true, undefined, this);
      }),
      pagination.scrollPosition.canScrollDown && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            " ",
            figures_default.arrowDown,
            " more below"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        marginLeft: 1,
        children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          dimColor: true,
          italic: true,
          children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
                children: "type to search"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                action: "plugin:toggle",
                context: "Plugin",
                fallback: "Space",
                description: "toggle"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                action: "select:accept",
                context: "Select",
                fallback: "Enter",
                description: "details"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "back"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      pendingToggles.size > 0 && /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedBox_default, {
        marginLeft: 1,
        children: /* @__PURE__ */ jsx_dev_runtime15.jsxDEV(ThemedText, {
          dimColor: true,
          italic: true,
          children: "Run /reload-plugins to apply changes"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var React8, import_react10, jsx_dev_runtime15;
var init_ManagePlugins = __esm(() => {
  init_figures();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_MCPRemoteServerMenu();
  init_MCPStdioServerMenu();
  init_MCPToolDetailView();
  init_MCPToolListView();
  init_SearchBox();
  init_useSearchInput();
  init_useTerminalSize();
  init_ink();
  init_useKeybinding();
  init_builtinPlugins();
  init_MCPConnectionManager();
  init_utils();
  init_pluginOperations();
  init_AppState();
  init_array();
  init_browser();
  init_debug();
  init_errors();
  init_log();
  init_cacheUtils();
  init_installedPluginsManager();
  init_marketplaceManager();
  init_mcpbHandler();
  init_pluginDirectories();
  init_pluginFlagging();
  init_pluginIdentifier();
  init_pluginLoader();
  init_pluginOptionsStorage();
  init_pluginPolicy();
  init_pluginStartupCheck();
  init_settings();
  init_slowOperations();
  init_stringUtils();
  init_PluginErrors();
  init_PluginOptionsDialog();
  init_PluginOptionsFlow();
  init_UnifiedInstalledCell();
  init_usePagination();
  React8 = __toESM(require_react(), 1);
  import_react10 = __toESM(require_react(), 1);
  jsx_dev_runtime15 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/parseArgs.ts
function parsePluginArgs(args) {
  if (!args) {
    return { type: "menu" };
  }
  const parts = args.trim().split(/\s+/);
  const command = parts[0]?.toLowerCase();
  switch (command) {
    case "help":
    case "--help":
    case "-h":
      return { type: "help" };
    case "install":
    case "i": {
      const target = parts[1];
      if (!target) {
        return { type: "install" };
      }
      if (target.includes("@")) {
        const [plugin, marketplace] = target.split("@");
        return { type: "install", plugin, marketplace };
      }
      const isMarketplace = target.startsWith("http://") || target.startsWith("https://") || target.startsWith("file://") || target.includes("/") || target.includes("\\");
      if (isMarketplace) {
        return { type: "install", marketplace: target };
      }
      return { type: "install", plugin: target };
    }
    case "manage":
      return { type: "manage" };
    case "uninstall":
      return { type: "uninstall", plugin: parts[1] };
    case "enable":
      return { type: "enable", plugin: parts[1] };
    case "disable":
      return { type: "disable", plugin: parts[1] };
    case "validate": {
      const target = parts.slice(1).join(" ").trim();
      return { type: "validate", path: target || undefined };
    }
    case "marketplace":
    case "market": {
      const action = parts[1]?.toLowerCase();
      const target = parts.slice(2).join(" ");
      switch (action) {
        case "add":
          return { type: "marketplace", action: "add", target };
        case "remove":
        case "rm":
          return { type: "marketplace", action: "remove", target };
        case "update":
          return { type: "marketplace", action: "update", target };
        case "list":
          return { type: "marketplace", action: "list" };
        default:
          return { type: "marketplace" };
      }
    }
    default:
      return { type: "menu" };
  }
}
var init_parseArgs = () => {};

// src/commands/plugin/ValidatePlugin.tsx
function ValidatePlugin(t0) {
  const $ = import_compiler_runtime10.c(5);
  const {
    onComplete,
    path: path2
  } = t0;
  let t1;
  let t2;
  if ($[0] !== onComplete || $[1] !== path2) {
    t1 = () => {
      const runValidation = async function runValidation2() {
        if (!path2) {
          onComplete(`Usage: /plugin validate <path>

Validate a plugin or marketplace manifest file or directory.

Examples:
  /plugin validate .claude-plugin/plugin.json
  /plugin validate /path/to/plugin-directory
  /plugin validate .

When given a directory, automatically validates .claude-plugin/marketplace.json
or .claude-plugin/plugin.json (prefers marketplace if both exist).

Or from the command line:
  claude plugin validate <path>`);
          return;
        }
        try {
          const result = await validateManifest(path2);
          let output = "";
          output = output + `Validating ${result.fileType} manifest: ${result.filePath}

`;
          if (result.errors.length > 0) {
            output = output + `${figures_default.cross} Found ${result.errors.length} ${plural(result.errors.length, "error")}:

`;
            result.errors.forEach((error_0) => {
              output = output + `  ${figures_default.pointer} ${error_0.path}: ${error_0.message}
`;
            });
            output = output + `
`;
          }
          if (result.warnings.length > 0) {
            output = output + `${figures_default.warning} Found ${result.warnings.length} ${plural(result.warnings.length, "warning")}:

`;
            result.warnings.forEach((warning) => {
              output = output + `  ${figures_default.pointer} ${warning.path}: ${warning.message}
`;
            });
            output = output + `
`;
          }
          if (result.success) {
            if (result.warnings.length > 0) {
              output = output + `${figures_default.tick} Validation passed with warnings
`;
            } else {
              output = output + `${figures_default.tick} Validation passed
`;
            }
            process.exitCode = 0;
          } else {
            output = output + `${figures_default.cross} Validation failed
`;
            process.exitCode = 1;
          }
          onComplete(output);
        } catch (t32) {
          const error = t32;
          process.exitCode = 2;
          logError(error);
          onComplete(`${figures_default.cross} Unexpected error during validation: ${errorMessage(error)}`);
        }
      };
      runValidation();
    };
    t2 = [onComplete, path2];
    $[0] = onComplete;
    $[1] = path2;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  import_react11.useEffect(t1, t2);
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime16.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime16.jsxDEV(ThemedText, {
        children: "Running validation..."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
var import_compiler_runtime10, import_react11, jsx_dev_runtime16;
var init_ValidatePlugin = __esm(() => {
  init_figures();
  init_ink();
  init_errors();
  init_log();
  init_validatePlugin();
  init_stringUtils();
  import_compiler_runtime10 = __toESM(require_compiler_runtime(), 1);
  import_react11 = __toESM(require_react(), 1);
  jsx_dev_runtime16 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/plugin/PluginSettings.tsx
function MarketplaceList(t0) {
  const $ = import_compiler_runtime11.c(4);
  const {
    onComplete
  } = t0;
  let t1;
  let t2;
  if ($[0] !== onComplete) {
    t1 = () => {
      const loadList = async function loadList2() {
        try {
          const config = await loadKnownMarketplacesConfig();
          const names = Object.keys(config);
          if (names.length === 0) {
            onComplete("No marketplaces configured");
          } else {
            onComplete(`Configured marketplaces:
${names.map(_temp7).join(`
`)}`);
          }
        } catch (t32) {
          const err = t32;
          onComplete(`Error loading marketplaces: ${errorMessage(err)}`);
        }
      };
      loadList();
    };
    t2 = [onComplete];
    $[0] = onComplete;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  import_react12.useEffect(t1, t2);
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
      children: "Loading marketplaces..."
    }, undefined, false, undefined, this);
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
}
function _temp7(n) {
  return `  \u2022 ${n}`;
}
function McpRedirectBanner() {
  return null;
}
function getExtraMarketplaceSourceInfo(name) {
  const editableSources = [];
  const sourcesToCheck = [{
    source: "userSettings",
    scope: "user"
  }, {
    source: "projectSettings",
    scope: "project"
  }, {
    source: "localSettings",
    scope: "local"
  }];
  for (const {
    source,
    scope
  } of sourcesToCheck) {
    const settings = getSettingsForSource(source);
    if (settings?.extraKnownMarketplaces?.[name]) {
      editableSources.push({
        source,
        scope
      });
    }
  }
  const policySettings = getSettingsForSource("policySettings");
  const isInPolicy = Boolean(policySettings?.extraKnownMarketplaces?.[name]);
  return {
    editableSources,
    isInPolicy
  };
}
function buildMarketplaceAction(name) {
  const {
    editableSources,
    isInPolicy
  } = getExtraMarketplaceSourceInfo(name);
  if (editableSources.length > 0) {
    return {
      kind: "remove-extra-marketplace",
      name,
      sources: editableSources
    };
  }
  if (isInPolicy) {
    return {
      kind: "managed-only",
      name
    };
  }
  return {
    kind: "navigate",
    tab: "marketplaces",
    viewState: {
      type: "manage-marketplaces",
      targetMarketplace: name,
      action: "remove"
    }
  };
}
function buildPluginAction(pluginName) {
  return {
    kind: "navigate",
    tab: "installed",
    viewState: {
      type: "manage-plugins",
      targetPlugin: pluginName,
      action: "uninstall"
    }
  };
}
function isTransientError(error) {
  return TRANSIENT_ERROR_TYPES.has(error.type);
}
function getPluginNameFromError(error) {
  if ("pluginId" in error && error.pluginId)
    return error.pluginId;
  if ("plugin" in error && error.plugin)
    return error.plugin;
  if (error.source.includes("@"))
    return error.source.split("@")[0];
  return;
}
function buildErrorRows(failedMarketplaces, extraMarketplaceErrors, pluginLoadingErrors, otherErrors, brokenInstalledMarketplaces, transientErrors, pluginScopes) {
  const rows = [];
  for (const error of transientErrors) {
    const pluginName = "pluginId" in error ? error.pluginId : ("plugin" in error) ? error.plugin : undefined;
    rows.push({
      label: pluginName ?? error.source,
      message: formatErrorMessage(error),
      guidance: "Restart to retry loading plugins",
      action: {
        kind: "none"
      }
    });
  }
  const shownMarketplaceNames = new Set;
  for (const m of failedMarketplaces) {
    shownMarketplaceNames.add(m.name);
    const action = buildMarketplaceAction(m.name);
    const sourceInfo = getExtraMarketplaceSourceInfo(m.name);
    const scope = sourceInfo.isInPolicy ? "managed" : sourceInfo.editableSources[0]?.scope;
    rows.push({
      label: m.name,
      message: m.error ?? "Installation failed",
      guidance: action.kind === "managed-only" ? "Managed by your organization \u2014 contact your admin" : undefined,
      action,
      scope
    });
  }
  for (const e of extraMarketplaceErrors) {
    const marketplace = "marketplace" in e ? e.marketplace : e.source;
    if (shownMarketplaceNames.has(marketplace))
      continue;
    shownMarketplaceNames.add(marketplace);
    const action = buildMarketplaceAction(marketplace);
    const sourceInfo = getExtraMarketplaceSourceInfo(marketplace);
    const scope = sourceInfo.isInPolicy ? "managed" : sourceInfo.editableSources[0]?.scope;
    rows.push({
      label: marketplace,
      message: formatErrorMessage(e),
      guidance: action.kind === "managed-only" ? "Managed by your organization \u2014 contact your admin" : getErrorGuidance(e),
      action,
      scope
    });
  }
  for (const m of brokenInstalledMarketplaces) {
    if (shownMarketplaceNames.has(m.name))
      continue;
    shownMarketplaceNames.add(m.name);
    rows.push({
      label: m.name,
      message: m.error,
      action: {
        kind: "remove-installed-marketplace",
        name: m.name
      }
    });
  }
  const shownPluginNames = new Set;
  for (const error of pluginLoadingErrors) {
    const pluginName = getPluginNameFromError(error);
    if (pluginName && shownPluginNames.has(pluginName))
      continue;
    if (pluginName)
      shownPluginNames.add(pluginName);
    const marketplace = "marketplace" in error ? error.marketplace : undefined;
    const scope = pluginName ? pluginScopes.get(error.source) ?? pluginScopes.get(pluginName) : undefined;
    rows.push({
      label: pluginName ? marketplace ? `${pluginName} @ ${marketplace}` : pluginName : error.source,
      message: formatErrorMessage(error),
      guidance: getErrorGuidance(error),
      action: pluginName ? buildPluginAction(pluginName) : {
        kind: "none"
      },
      scope
    });
  }
  for (const error of otherErrors) {
    rows.push({
      label: error.source,
      message: formatErrorMessage(error),
      guidance: getErrorGuidance(error),
      action: {
        kind: "none"
      }
    });
  }
  return rows;
}
function removeExtraMarketplace(name, sources) {
  for (const {
    source
  } of sources) {
    const settings = getSettingsForSource(source);
    if (!settings)
      continue;
    const updates = {};
    if (settings.extraKnownMarketplaces?.[name]) {
      updates.extraKnownMarketplaces = {
        ...settings.extraKnownMarketplaces,
        [name]: undefined
      };
    }
    if (settings.enabledPlugins) {
      const suffix = `@${name}`;
      let removedPlugins = false;
      const updatedPlugins = {
        ...settings.enabledPlugins
      };
      for (const pluginId in updatedPlugins) {
        if (pluginId.endsWith(suffix)) {
          updatedPlugins[pluginId] = undefined;
          removedPlugins = true;
        }
      }
      if (removedPlugins) {
        updates.enabledPlugins = updatedPlugins;
      }
    }
    if (Object.keys(updates).length > 0) {
      updateSettingsForSource(source, updates);
    }
  }
}
function ErrorsTabContent(t0) {
  const $ = import_compiler_runtime11.c(26);
  const {
    setViewState,
    setActiveTab,
    markPluginsChanged
  } = t0;
  const errors = useAppState(_temp23);
  const installationStatus = useAppState(_temp32);
  const setAppState = useSetAppState();
  const [selectedIndex, setSelectedIndex] = import_react12.useState(0);
  const [actionMessage, setActionMessage] = import_react12.useState(null);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [marketplaceLoadFailures, setMarketplaceLoadFailures] = import_react12.useState(t1);
  let t2;
  let t3;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      (async () => {
        try {
          const config = await loadKnownMarketplacesConfig();
          const {
            failures
          } = await loadMarketplacesWithGracefulDegradation(config);
          setMarketplaceLoadFailures(failures);
        } catch {}
      })();
    };
    t3 = [];
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  import_react12.useEffect(t2, t3);
  const failedMarketplaces = installationStatus.marketplaces.filter(_temp42);
  const failedMarketplaceNames = new Set(failedMarketplaces.map(_temp5));
  const transientErrors = errors.filter(isTransientError);
  const extraMarketplaceErrors = errors.filter((e) => (e.type === "marketplace-not-found" || e.type === "marketplace-load-failed" || e.type === "marketplace-blocked-by-policy") && !failedMarketplaceNames.has(e.marketplace));
  const pluginLoadingErrors = errors.filter(_temp62);
  const otherErrors = errors.filter(_temp72);
  const pluginScopes = getPluginEditableScopes();
  const rows = buildErrorRows(failedMarketplaces, extraMarketplaceErrors, pluginLoadingErrors, otherErrors, marketplaceLoadFailures, transientErrors, pluginScopes);
  let t4;
  if ($[3] !== setViewState) {
    t4 = () => {
      setViewState({
        type: "menu"
      });
    };
    $[3] = setViewState;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  let t5;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = {
      context: "Confirmation"
    };
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  useKeybinding("confirm:no", t4, t5);
  const handleSelect = () => {
    const row = rows[selectedIndex];
    if (!row) {
      return;
    }
    const {
      action
    } = row;
    bb77:
      switch (action.kind) {
        case "navigate": {
          setActiveTab(action.tab);
          setViewState(action.viewState);
          break bb77;
        }
        case "remove-extra-marketplace": {
          const scopes = action.sources.map(_temp8).join(", ");
          removeExtraMarketplace(action.name, action.sources);
          clearAllCaches();
          setAppState((prev_0) => ({
            ...prev_0,
            plugins: {
              ...prev_0.plugins,
              errors: prev_0.plugins.errors.filter((e_2) => !(("marketplace" in e_2) && e_2.marketplace === action.name)),
              installationStatus: {
                ...prev_0.plugins.installationStatus,
                marketplaces: prev_0.plugins.installationStatus.marketplaces.filter((m_1) => m_1.name !== action.name)
              }
            }
          }));
          setActionMessage(`${figures_default.tick} Removed "${action.name}" from ${scopes} settings`);
          markPluginsChanged();
          break bb77;
        }
        case "remove-installed-marketplace": {
          (async () => {
            try {
              await removeMarketplaceSource(action.name);
              clearAllCaches();
              setMarketplaceLoadFailures((prev) => prev.filter((f) => f.name !== action.name));
              setActionMessage(`${figures_default.tick} Removed marketplace "${action.name}"`);
              markPluginsChanged();
            } catch (t6) {
              const err = t6;
              setActionMessage(`Failed to remove "${action.name}": ${err instanceof Error ? err.message : String(err)}`);
            }
          })();
          break bb77;
        }
        case "managed-only": {
          break bb77;
        }
        case "none":
      }
  };
  let t7;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = () => setSelectedIndex(_temp9);
    $[6] = t7;
  } else {
    t7 = $[6];
  }
  const t8 = rows.length > 0;
  let t9;
  if ($[7] !== t8) {
    t9 = {
      context: "Select",
      isActive: t8
    };
    $[7] = t8;
    $[8] = t9;
  } else {
    t9 = $[8];
  }
  useKeybindings({
    "select:previous": t7,
    "select:next": () => setSelectedIndex((prev_2) => Math.min(rows.length - 1, prev_2 + 1)),
    "select:accept": handleSelect
  }, t9);
  const clampedIndex = Math.min(selectedIndex, Math.max(0, rows.length - 1));
  if (clampedIndex !== selectedIndex) {
    setSelectedIndex(clampedIndex);
  }
  const selectedAction = rows[clampedIndex]?.action;
  const hasAction = selectedAction && selectedAction.kind !== "none" && selectedAction.kind !== "managed-only";
  if (rows.length === 0) {
    let t102;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      t102 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
        marginLeft: 1,
        children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
          dimColor: true,
          children: "No plugin errors"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[9] = t102;
    } else {
      t102 = $[9];
    }
    let t112;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
      t112 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t102,
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
              dimColor: true,
              italic: true,
              children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "back"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[10] = t112;
    } else {
      t112 = $[10];
    }
    return t112;
  }
  const T0 = ThemedBox_default;
  const t10 = "column";
  let t11;
  if ($[11] !== clampedIndex) {
    t11 = (row_0, idx) => {
      const isSelected = idx === clampedIndex;
      return /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
        marginLeft: 1,
        flexDirection: "column",
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
                color: isSelected ? "suggestion" : "error",
                children: [
                  isSelected ? figures_default.pointer : figures_default.cross,
                  " "
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
                bold: isSelected,
                children: row_0.label
              }, undefined, false, undefined, this),
              row_0.scope && /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  " (",
                  row_0.scope,
                  ")"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
            marginLeft: 3,
            children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
              color: "error",
              children: row_0.message
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          row_0.guidance && /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
            marginLeft: 3,
            children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
              dimColor: true,
              italic: true,
              children: row_0.guidance
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, idx, true, undefined, this);
    };
    $[11] = clampedIndex;
    $[12] = t11;
  } else {
    t11 = $[12];
  }
  const t12 = rows.map(t11);
  let t13;
  if ($[13] !== actionMessage) {
    t13 = actionMessage && /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      marginLeft: 1,
      children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
        color: "claude",
        children: actionMessage
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[13] = actionMessage;
    $[14] = t13;
  } else {
    t13 = $[14];
  }
  let t14;
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    t14 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ConfigurableShortcutHint, {
      action: "select:previous",
      context: "Select",
      fallback: "\u2191",
      description: "navigate"
    }, undefined, false, undefined, this);
    $[15] = t14;
  } else {
    t14 = $[15];
  }
  let t15;
  if ($[16] !== hasAction) {
    t15 = hasAction && /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ConfigurableShortcutHint, {
      action: "select:accept",
      context: "Select",
      fallback: "Enter",
      description: "resolve"
    }, undefined, false, undefined, this);
    $[16] = hasAction;
    $[17] = t15;
  } else {
    t15 = $[17];
  }
  let t16;
  if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
    t16 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ConfigurableShortcutHint, {
      action: "confirm:no",
      context: "Confirmation",
      fallback: "Esc",
      description: "back"
    }, undefined, false, undefined, this);
    $[18] = t16;
  } else {
    t16 = $[18];
  }
  let t17;
  if ($[19] !== t15) {
    t17 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(Byline, {
          children: [
            t14,
            t15,
            t16
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[19] = t15;
    $[20] = t17;
  } else {
    t17 = $[20];
  }
  let t18;
  if ($[21] !== T0 || $[22] !== t12 || $[23] !== t13 || $[24] !== t17) {
    t18 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(T0, {
      flexDirection: t10,
      children: [
        t12,
        t13,
        t17
      ]
    }, undefined, true, undefined, this);
    $[21] = T0;
    $[22] = t12;
    $[23] = t13;
    $[24] = t17;
    $[25] = t18;
  } else {
    t18 = $[25];
  }
  return t18;
}
function _temp9(prev_1) {
  return Math.max(0, prev_1 - 1);
}
function _temp8(s_1) {
  return s_1.scope;
}
function _temp72(e_1) {
  if (isTransientError(e_1)) {
    return false;
  }
  if (e_1.type === "marketplace-not-found" || e_1.type === "marketplace-load-failed" || e_1.type === "marketplace-blocked-by-policy") {
    return false;
  }
  return getPluginNameFromError(e_1) === undefined;
}
function _temp62(e_0) {
  if (isTransientError(e_0)) {
    return false;
  }
  if (e_0.type === "marketplace-not-found" || e_0.type === "marketplace-load-failed" || e_0.type === "marketplace-blocked-by-policy") {
    return false;
  }
  return getPluginNameFromError(e_0) !== undefined;
}
function _temp5(m_0) {
  return m_0.name;
}
function _temp42(m) {
  return m.status === "failed";
}
function _temp32(s_0) {
  return s_0.plugins.installationStatus;
}
function _temp23(s) {
  return s.plugins.errors;
}
function getInitialViewState(parsedCommand) {
  switch (parsedCommand.type) {
    case "help":
      return {
        type: "help"
      };
    case "validate":
      return {
        type: "validate",
        path: parsedCommand.path
      };
    case "install":
      if (parsedCommand.marketplace) {
        return {
          type: "browse-marketplace",
          targetMarketplace: parsedCommand.marketplace,
          targetPlugin: parsedCommand.plugin
        };
      }
      if (parsedCommand.plugin) {
        return {
          type: "discover-plugins",
          targetPlugin: parsedCommand.plugin
        };
      }
      return {
        type: "discover-plugins"
      };
    case "manage":
      return {
        type: "manage-plugins"
      };
    case "uninstall":
      return {
        type: "manage-plugins",
        targetPlugin: parsedCommand.plugin,
        action: "uninstall"
      };
    case "enable":
      return {
        type: "manage-plugins",
        targetPlugin: parsedCommand.plugin,
        action: "enable"
      };
    case "disable":
      return {
        type: "manage-plugins",
        targetPlugin: parsedCommand.plugin,
        action: "disable"
      };
    case "marketplace":
      if (parsedCommand.action === "list") {
        return {
          type: "marketplace-list"
        };
      }
      if (parsedCommand.action === "add") {
        return {
          type: "add-marketplace",
          initialValue: parsedCommand.target
        };
      }
      if (parsedCommand.action === "remove") {
        return {
          type: "manage-marketplaces",
          targetMarketplace: parsedCommand.target,
          action: "remove"
        };
      }
      if (parsedCommand.action === "update") {
        return {
          type: "manage-marketplaces",
          targetMarketplace: parsedCommand.target,
          action: "update"
        };
      }
      return {
        type: "marketplace-menu"
      };
    case "menu":
    default:
      return {
        type: "discover-plugins"
      };
  }
}
function getInitialTab(viewState) {
  if (viewState.type === "manage-plugins")
    return "installed";
  if (viewState.type === "manage-marketplaces")
    return "marketplaces";
  return "discover";
}
function PluginSettings(t0) {
  const $ = import_compiler_runtime11.c(75);
  const {
    onComplete,
    args,
    showMcpRedirectMessage
  } = t0;
  let parsedCommand;
  let t1;
  if ($[0] !== args) {
    parsedCommand = parsePluginArgs(args);
    t1 = getInitialViewState(parsedCommand);
    $[0] = args;
    $[1] = parsedCommand;
    $[2] = t1;
  } else {
    parsedCommand = $[1];
    t1 = $[2];
  }
  const initialViewState = t1;
  const [viewState, setViewState] = import_react12.useState(initialViewState);
  let t2;
  if ($[3] !== initialViewState) {
    t2 = getInitialTab(initialViewState);
    $[3] = initialViewState;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const [activeTab, setActiveTab] = import_react12.useState(t2);
  const [inputValue, setInputValue] = import_react12.useState(viewState.type === "add-marketplace" ? viewState.initialValue || "" : "");
  const [cursorOffset, setCursorOffset] = import_react12.useState(0);
  const [error, setError] = import_react12.useState(null);
  const [result, setResult] = import_react12.useState(null);
  const [childSearchActive, setChildSearchActive] = import_react12.useState(false);
  const setAppState = useSetAppState();
  const pluginErrorCount = useAppState(_temp0);
  const errorsTabTitle = pluginErrorCount > 0 ? `Errors (${pluginErrorCount})` : "Errors";
  const exitState = useExitOnCtrlCDWithKeybindings();
  const cliMode = parsedCommand.type === "marketplace" && parsedCommand.action === "add" && parsedCommand.target !== undefined;
  let t3;
  if ($[5] !== setAppState) {
    t3 = () => {
      setAppState(_temp1);
    };
    $[5] = setAppState;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const markPluginsChanged = t3;
  let t4;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = (tabId) => {
      const tab = tabId;
      setActiveTab(tab);
      setError(null);
      bb37:
        switch (tab) {
          case "discover": {
            setViewState({
              type: "discover-plugins"
            });
            break bb37;
          }
          case "installed": {
            setViewState({
              type: "manage-plugins"
            });
            break bb37;
          }
          case "marketplaces": {
            setViewState({
              type: "manage-marketplaces"
            });
            break bb37;
          }
          case "errors":
        }
    };
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  const handleTabChange = t4;
  let t5;
  let t6;
  if ($[8] !== onComplete || $[9] !== result || $[10] !== viewState.type) {
    t5 = () => {
      if (viewState.type === "menu" && !result) {
        onComplete();
      }
    };
    t6 = [viewState.type, result, onComplete];
    $[8] = onComplete;
    $[9] = result;
    $[10] = viewState.type;
    $[11] = t5;
    $[12] = t6;
  } else {
    t5 = $[11];
    t6 = $[12];
  }
  import_react12.useEffect(t5, t6);
  let t7;
  let t8;
  if ($[13] !== activeTab || $[14] !== viewState.type) {
    t7 = () => {
      if (viewState.type === "browse-marketplace" && activeTab !== "discover") {
        setActiveTab("discover");
      }
    };
    t8 = [viewState.type, activeTab];
    $[13] = activeTab;
    $[14] = viewState.type;
    $[15] = t7;
    $[16] = t8;
  } else {
    t7 = $[15];
    t8 = $[16];
  }
  import_react12.useEffect(t7, t8);
  let t9;
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = () => {
      setActiveTab("marketplaces");
      setViewState({
        type: "manage-marketplaces"
      });
      setInputValue("");
      setError(null);
    };
    $[17] = t9;
  } else {
    t9 = $[17];
  }
  const handleAddMarketplaceEscape = t9;
  const t10 = viewState.type === "add-marketplace";
  let t11;
  if ($[18] !== t10) {
    t11 = {
      context: "Settings",
      isActive: t10
    };
    $[18] = t10;
    $[19] = t11;
  } else {
    t11 = $[19];
  }
  useKeybinding("confirm:no", handleAddMarketplaceEscape, t11);
  let t12;
  let t13;
  if ($[20] !== onComplete || $[21] !== result) {
    t12 = () => {
      if (result) {
        onComplete(result);
      }
    };
    t13 = [result, onComplete];
    $[20] = onComplete;
    $[21] = result;
    $[22] = t12;
    $[23] = t13;
  } else {
    t12 = $[22];
    t13 = $[23];
  }
  import_react12.useEffect(t12, t13);
  let t14;
  let t15;
  if ($[24] !== onComplete || $[25] !== viewState.type) {
    t14 = () => {
      if (viewState.type === "help") {
        onComplete();
      }
    };
    t15 = [viewState.type, onComplete];
    $[24] = onComplete;
    $[25] = viewState.type;
    $[26] = t14;
    $[27] = t15;
  } else {
    t14 = $[26];
    t15 = $[27];
  }
  import_react12.useEffect(t14, t15);
  if (viewState.type === "help") {
    let t162;
    if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
      t162 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            bold: true,
            children: "Plugin Command Usage:"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Installation:"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin install - Browse and install plugins"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: [
              " ",
              "/plugin install <marketplace> - Install from specific marketplace"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin install <plugin> - Install specific plugin"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: [
              " ",
              "/plugin install <plugin>@<market> - Install plugin from marketplace"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Management:"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin manage - Manage installed plugins"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin enable <plugin> - Enable a plugin"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin disable <plugin> - Disable a plugin"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin uninstall <plugin> - Uninstall a plugin"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Marketplaces:"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin marketplace - Marketplace management menu"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin marketplace add - Add a marketplace"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: [
              " ",
              "/plugin marketplace add <path/url> - Add marketplace directly"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin marketplace update - Update marketplaces"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: [
              " ",
              "/plugin marketplace update <name> - Update specific marketplace"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin marketplace remove - Remove a marketplace"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: [
              " ",
              "/plugin marketplace remove <name> - Remove specific marketplace"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin marketplace list - List all marketplaces"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Validation:"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: [
              " ",
              "/plugin validate <path> - Validate a manifest file or directory"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Other:"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin - Main plugin menu"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugin help - Show this help"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ThemedText, {
            children: " /plugins - Alias for /plugin"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[28] = t162;
    } else {
      t162 = $[28];
    }
    return t162;
  }
  if (viewState.type === "validate") {
    let t162;
    if ($[29] !== onComplete || $[30] !== viewState.path) {
      t162 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ValidatePlugin, {
        onComplete,
        path: viewState.path
      }, undefined, false, undefined, this);
      $[29] = onComplete;
      $[30] = viewState.path;
      $[31] = t162;
    } else {
      t162 = $[31];
    }
    return t162;
  }
  if (viewState.type === "marketplace-menu") {
    setViewState({
      type: "menu"
    });
    return null;
  }
  if (viewState.type === "marketplace-list") {
    let t162;
    if ($[32] !== onComplete) {
      t162 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(MarketplaceList, {
        onComplete
      }, undefined, false, undefined, this);
      $[32] = onComplete;
      $[33] = t162;
    } else {
      t162 = $[33];
    }
    return t162;
  }
  if (viewState.type === "add-marketplace") {
    let t162;
    if ($[34] !== cliMode || $[35] !== cursorOffset || $[36] !== error || $[37] !== inputValue || $[38] !== markPluginsChanged || $[39] !== result) {
      t162 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(AddMarketplace, {
        inputValue,
        setInputValue,
        cursorOffset,
        setCursorOffset,
        error,
        setError,
        result,
        setResult,
        setViewState,
        onAddComplete: markPluginsChanged,
        cliMode
      }, undefined, false, undefined, this);
      $[34] = cliMode;
      $[35] = cursorOffset;
      $[36] = error;
      $[37] = inputValue;
      $[38] = markPluginsChanged;
      $[39] = result;
      $[40] = t162;
    } else {
      t162 = $[40];
    }
    return t162;
  }
  let t16;
  if ($[41] !== activeTab || $[42] !== showMcpRedirectMessage) {
    t16 = showMcpRedirectMessage && activeTab === "installed" ? /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(McpRedirectBanner, {}, undefined, false, undefined, this) : undefined;
    $[41] = activeTab;
    $[42] = showMcpRedirectMessage;
    $[43] = t16;
  } else {
    t16 = $[43];
  }
  let t17;
  if ($[44] !== error || $[45] !== markPluginsChanged || $[46] !== result || $[47] !== viewState.targetMarketplace || $[48] !== viewState.targetPlugin || $[49] !== viewState.type) {
    t17 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(Tab, {
      id: "discover",
      title: "Discover",
      children: viewState.type === "browse-marketplace" ? /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(BrowseMarketplace, {
        error,
        setError,
        result,
        setResult,
        setViewState,
        onInstallComplete: markPluginsChanged,
        targetMarketplace: viewState.targetMarketplace,
        targetPlugin: viewState.targetPlugin
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(DiscoverPlugins, {
        error,
        setError,
        result,
        setResult,
        setViewState,
        onInstallComplete: markPluginsChanged,
        onSearchModeChange: setChildSearchActive,
        targetPlugin: viewState.type === "discover-plugins" ? viewState.targetPlugin : undefined
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[44] = error;
    $[45] = markPluginsChanged;
    $[46] = result;
    $[47] = viewState.targetMarketplace;
    $[48] = viewState.targetPlugin;
    $[49] = viewState.type;
    $[50] = t17;
  } else {
    t17 = $[50];
  }
  const t18 = viewState.type === "manage-plugins" ? viewState.targetPlugin : undefined;
  const t19 = viewState.type === "manage-plugins" ? viewState.targetMarketplace : undefined;
  const t20 = viewState.type === "manage-plugins" ? viewState.action : undefined;
  let t21;
  if ($[51] !== markPluginsChanged || $[52] !== t18 || $[53] !== t19 || $[54] !== t20) {
    t21 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(Tab, {
      id: "installed",
      title: "Installed",
      children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ManagePlugins, {
        setViewState,
        setResult,
        onManageComplete: markPluginsChanged,
        onSearchModeChange: setChildSearchActive,
        targetPlugin: t18,
        targetMarketplace: t19,
        action: t20
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[51] = markPluginsChanged;
    $[52] = t18;
    $[53] = t19;
    $[54] = t20;
    $[55] = t21;
  } else {
    t21 = $[55];
  }
  const t22 = viewState.type === "manage-marketplaces" ? viewState.targetMarketplace : undefined;
  const t23 = viewState.type === "manage-marketplaces" ? viewState.action : undefined;
  let t24;
  if ($[56] !== error || $[57] !== exitState || $[58] !== markPluginsChanged || $[59] !== t22 || $[60] !== t23) {
    t24 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(Tab, {
      id: "marketplaces",
      title: "Marketplaces",
      children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ManageMarketplaces, {
        setViewState,
        error,
        setError,
        setResult,
        exitState,
        onManageComplete: markPluginsChanged,
        targetMarketplace: t22,
        action: t23
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[56] = error;
    $[57] = exitState;
    $[58] = markPluginsChanged;
    $[59] = t22;
    $[60] = t23;
    $[61] = t24;
  } else {
    t24 = $[61];
  }
  let t25;
  if ($[62] !== markPluginsChanged) {
    t25 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(ErrorsTabContent, {
      setViewState,
      setActiveTab,
      markPluginsChanged
    }, undefined, false, undefined, this);
    $[62] = markPluginsChanged;
    $[63] = t25;
  } else {
    t25 = $[63];
  }
  let t26;
  if ($[64] !== errorsTabTitle || $[65] !== t25) {
    t26 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(Tab, {
      id: "errors",
      title: errorsTabTitle,
      children: t25
    }, undefined, false, undefined, this);
    $[64] = errorsTabTitle;
    $[65] = t25;
    $[66] = t26;
  } else {
    t26 = $[66];
  }
  let t27;
  if ($[67] !== activeTab || $[68] !== childSearchActive || $[69] !== t16 || $[70] !== t17 || $[71] !== t21 || $[72] !== t24 || $[73] !== t26) {
    t27 = /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(Pane, {
      color: "suggestion",
      children: /* @__PURE__ */ jsx_dev_runtime17.jsxDEV(Tabs, {
        title: "Plugins",
        selectedTab: activeTab,
        onTabChange: handleTabChange,
        color: "suggestion",
        disableNavigation: childSearchActive,
        banner: t16,
        children: [
          t17,
          t21,
          t24,
          t26
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[67] = activeTab;
    $[68] = childSearchActive;
    $[69] = t16;
    $[70] = t17;
    $[71] = t21;
    $[72] = t24;
    $[73] = t26;
    $[74] = t27;
  } else {
    t27 = $[74];
  }
  return t27;
}
function _temp1(prev) {
  return prev.plugins.needsRefresh ? prev : {
    ...prev,
    plugins: {
      ...prev.plugins,
      needsRefresh: true
    }
  };
}
function _temp0(s) {
  let count2 = s.plugins.errors.length;
  for (const m of s.plugins.installationStatus.marketplaces) {
    if (m.status === "failed") {
      count2++;
    }
  }
  return count2;
}
var import_compiler_runtime11, import_react12, jsx_dev_runtime17, TRANSIENT_ERROR_TYPES;
var init_PluginSettings = __esm(() => {
  init_figures();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_Pane();
  init_Tabs();
  init_useExitOnCtrlCDWithKeybindings();
  init_ink();
  init_useKeybinding();
  init_AppState();
  init_errors();
  init_cacheUtils();
  init_marketplaceHelpers();
  init_marketplaceManager();
  init_pluginStartupCheck();
  init_settings();
  init_AddMarketplace();
  init_BrowseMarketplace();
  init_DiscoverPlugins();
  init_ManageMarketplaces();
  init_ManagePlugins();
  init_PluginErrors();
  init_parseArgs();
  init_ValidatePlugin();
  import_compiler_runtime11 = __toESM(require_compiler_runtime(), 1);
  import_react12 = __toESM(require_react(), 1);
  jsx_dev_runtime17 = __toESM(require_jsx_dev_runtime(), 1);
  TRANSIENT_ERROR_TYPES = new Set(["git-auth-failed", "git-timeout", "network-error"]);
});

export { MCPRemoteServerMenu, init_MCPRemoteServerMenu, MCPStdioServerMenu, init_MCPStdioServerMenu, MCPToolDetailView, init_MCPToolDetailView, MCPToolListView, init_MCPToolListView, PluginSettings, init_PluginSettings };
