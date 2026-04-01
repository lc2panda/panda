// @bun
import {
  ModelPicker,
  init_ModelPicker,
  init_extraUsage,
  isBilledAsExtraUsage
} from "./chunk-axera48n.js";
import {
  checkOpus1mAccess,
  checkSonnet1mAccess,
  init_AppState,
  init_check1mAccess,
  init_validateModel,
  useAppState,
  useSetAppState,
  validateModel
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
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
  MODEL_ALIASES,
  clearFastModeCooldown,
  getDefaultMainLoopModelSetting,
  init_aliases,
  init_fastMode,
  init_model,
  init_modelAllowlist,
  init_source,
  isFastModeAvailable,
  isFastModeEnabled,
  isFastModeSupportedByModel,
  isModelAllowed,
  isOpus1mMergeEnabled,
  renderDefaultModelSetting,
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
import"./chunk-nahdbxge.js";
import {
  COMMON_HELP_ARGS,
  COMMON_INFO_ARGS,
  init_xml
} from "./chunk-43vdtd69.js";
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

// src/commands/model/model.tsx
function ModelPickerWrapper(t0) {
  const $ = import_compiler_runtime.c(17);
  const {
    onDone
  } = t0;
  const mainLoopModel = useAppState(_temp);
  const mainLoopModelForSession = useAppState(_temp2);
  const isFastMode = useAppState(_temp3);
  const setAppState = useSetAppState();
  let t1;
  if ($[0] !== mainLoopModel || $[1] !== onDone) {
    t1 = function handleCancel2() {
      logEvent("tengu_model_command_menu", {
        action: "cancel"
      });
      const displayModel = renderModelLabel(mainLoopModel);
      onDone(`Kept model as ${source_default.bold(displayModel)}`, {
        display: "system"
      });
    };
    $[0] = mainLoopModel;
    $[1] = onDone;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const handleCancel = t1;
  let t2;
  if ($[3] !== isFastMode || $[4] !== mainLoopModel || $[5] !== onDone || $[6] !== setAppState) {
    t2 = function handleSelect2(model, effort) {
      logEvent("tengu_model_command_menu", {
        action: model,
        from_model: mainLoopModel,
        to_model: model
      });
      setAppState((prev) => ({
        ...prev,
        mainLoopModel: model,
        mainLoopModelForSession: null
      }));
      let message = `Set model to ${source_default.bold(renderModelLabel(model))}`;
      if (effort !== undefined) {
        message = message + ` with ${source_default.bold(effort)} effort`;
      }
      let wasFastModeToggledOn = undefined;
      if (isFastModeEnabled()) {
        clearFastModeCooldown();
        if (!isFastModeSupportedByModel(model) && isFastMode) {
          setAppState(_temp4);
          wasFastModeToggledOn = false;
        } else {
          if (isFastModeSupportedByModel(model) && isFastModeAvailable() && isFastMode) {
            message = message + " \xB7 Fast mode ON";
            wasFastModeToggledOn = true;
          }
        }
      }
      if (isBilledAsExtraUsage(model, wasFastModeToggledOn === true, isOpus1mMergeEnabled())) {
        message = message + " \xB7 Billed as extra usage";
      }
      if (wasFastModeToggledOn === false) {
        message = message + " \xB7 Fast mode OFF";
      }
      onDone(message);
    };
    $[3] = isFastMode;
    $[4] = mainLoopModel;
    $[5] = onDone;
    $[6] = setAppState;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  const handleSelect = t2;
  let t3;
  if ($[8] !== isFastMode || $[9] !== mainLoopModel) {
    t3 = isFastModeEnabled() && isFastMode && isFastModeSupportedByModel(mainLoopModel) && isFastModeAvailable();
    $[8] = isFastMode;
    $[9] = mainLoopModel;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  let t4;
  if ($[11] !== handleCancel || $[12] !== handleSelect || $[13] !== mainLoopModel || $[14] !== mainLoopModelForSession || $[15] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ModelPicker, {
      initial: mainLoopModel,
      sessionModel: mainLoopModelForSession,
      onSelect: handleSelect,
      onCancel: handleCancel,
      isStandaloneCommand: true,
      showFastModeNotice: t3
    }, undefined, false, undefined, this);
    $[11] = handleCancel;
    $[12] = handleSelect;
    $[13] = mainLoopModel;
    $[14] = mainLoopModelForSession;
    $[15] = t3;
    $[16] = t4;
  } else {
    t4 = $[16];
  }
  return t4;
}
function _temp4(prev_0) {
  return {
    ...prev_0,
    fastMode: false
  };
}
function _temp3(s_1) {
  return s_1.fastMode;
}
function _temp2(s_0) {
  return s_0.mainLoopModelForSession;
}
function _temp(s) {
  return s.mainLoopModel;
}
function SetModelAndClose({
  args,
  onDone
}) {
  const isFastMode = useAppState((s) => s.fastMode);
  const setAppState = useSetAppState();
  const model = args === "default" ? null : args;
  React.useEffect(() => {
    async function handleModelChange() {
      if (model && !isModelAllowed(model)) {
        onDone(`Model '${model}' is not available. Your organization restricts model selection.`, {
          display: "system"
        });
        return;
      }
      if (model && isOpus1mUnavailable(model)) {
        onDone(`Opus 4.6 with 1M context is not available for your account. Learn more: https://code.claude.com/docs/en/model-config#extended-context-with-1m`, {
          display: "system"
        });
        return;
      }
      if (model && isSonnet1mUnavailable(model)) {
        onDone(`Sonnet 4.6 with 1M context is not available for your account. Learn more: https://code.claude.com/docs/en/model-config#extended-context-with-1m`, {
          display: "system"
        });
        return;
      }
      if (!model) {
        setModel(null);
        return;
      }
      if (isKnownAlias(model)) {
        setModel(model);
        return;
      }
      try {
        const {
          valid,
          error: error_0
        } = await validateModel(model);
        if (valid) {
          setModel(model);
        } else {
          onDone(error_0 || `Model '${model}' not found`, {
            display: "system"
          });
        }
      } catch (error) {
        onDone(`Failed to validate model: ${error.message}`, {
          display: "system"
        });
      }
    }
    function setModel(modelValue) {
      setAppState((prev) => ({
        ...prev,
        mainLoopModel: modelValue,
        mainLoopModelForSession: null
      }));
      let message = `Set model to ${source_default.bold(renderModelLabel(modelValue))}`;
      let wasFastModeToggledOn = undefined;
      if (isFastModeEnabled()) {
        clearFastModeCooldown();
        if (!isFastModeSupportedByModel(modelValue) && isFastMode) {
          setAppState((prev_0) => ({
            ...prev_0,
            fastMode: false
          }));
          wasFastModeToggledOn = false;
        } else if (isFastModeSupportedByModel(modelValue) && isFastMode) {
          message += ` \xB7 Fast mode ON`;
          wasFastModeToggledOn = true;
        }
      }
      if (isBilledAsExtraUsage(modelValue, wasFastModeToggledOn === true, isOpus1mMergeEnabled())) {
        message += ` \xB7 Billed as extra usage`;
      }
      if (wasFastModeToggledOn === false) {
        message += ` \xB7 Fast mode OFF`;
      }
      onDone(message);
    }
    handleModelChange();
  }, [model, onDone, setAppState]);
  return null;
}
function isKnownAlias(model) {
  return MODEL_ALIASES.includes(model.toLowerCase().trim());
}
function isOpus1mUnavailable(model) {
  const m = model.toLowerCase();
  return !checkOpus1mAccess() && !isOpus1mMergeEnabled() && m.includes("opus") && m.includes("[1m]");
}
function isSonnet1mUnavailable(model) {
  const m = model.toLowerCase();
  return !checkSonnet1mAccess() && (m.includes("sonnet[1m]") || m.includes("sonnet-4-6[1m]"));
}
function ShowModelAndClose(t0) {
  const {
    onDone
  } = t0;
  const mainLoopModel = useAppState(_temp7);
  const mainLoopModelForSession = useAppState(_temp8);
  const effortValue = useAppState(_temp9);
  const displayModel = renderModelLabel(mainLoopModel);
  const effortInfo = effortValue !== undefined ? ` (effort: ${effortValue})` : "";
  if (mainLoopModelForSession) {
    onDone(`Current model: ${source_default.bold(renderModelLabel(mainLoopModelForSession))} (session override from plan mode)
Base model: ${displayModel}${effortInfo}`);
  } else {
    onDone(`Current model: ${displayModel}${effortInfo}`);
  }
  return null;
}
function _temp9(s_1) {
  return s_1.effortValue;
}
function _temp8(s_0) {
  return s_0.mainLoopModelForSession;
}
function _temp7(s) {
  return s.mainLoopModel;
}
function renderModelLabel(model) {
  const rendered = renderDefaultModelSetting(model ?? getDefaultMainLoopModelSetting());
  return model === null ? `${rendered} (default)` : rendered;
}
var import_compiler_runtime, React, jsx_dev_runtime, call = async (onDone, _context, args) => {
  args = args?.trim() || "";
  if (COMMON_INFO_ARGS.includes(args)) {
    logEvent("tengu_model_command_inline_help", {
      args
    });
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ShowModelAndClose, {
      onDone
    }, undefined, false, undefined, this);
  }
  if (COMMON_HELP_ARGS.includes(args)) {
    onDone("Run /model to open the model selection menu, or /model [modelName] to set the model.", {
      display: "system"
    });
    return;
  }
  if (args) {
    logEvent("tengu_model_command_inline", {
      args
    });
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(SetModelAndClose, {
      args,
      onDone
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ModelPickerWrapper, {
    onDone
  }, undefined, false, undefined, this);
};
var init_model2 = __esm(() => {
  init_source();
  init_ModelPicker();
  init_xml();
  init_analytics();
  init_AppState();
  init_extraUsage();
  init_fastMode();
  init_aliases();
  init_check1mAccess();
  init_model();
  init_modelAllowlist();
  init_validateModel();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  React = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});
init_model2();

export {
  call
};
