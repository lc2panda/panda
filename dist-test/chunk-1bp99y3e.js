// @bun
import {
  LoadingState,
  init_LoadingState
} from "./chunk-4xfytryp.js";
import {
  Select,
  fetchEnvironments,
  init_environments,
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
import"./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import {
  init_useKeybinding,
  useKeybinding
} from "./chunk-x2y5syym.js";
import {
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
  SETTING_SOURCES,
  getSettingSourceName,
  getSettingsForSource,
  getSettings_DEPRECATED,
  init_constants,
  init_settings1 as init_settings,
  init_source,
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
import {
  init_log,
  logError
} from "./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  init_errors,
  toError
} from "./chunk-71hncdva.js";
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

// src/utils/teleport/environmentSelection.ts
async function getEnvironmentSelectionInfo() {
  const environments = await fetchEnvironments();
  if (environments.length === 0) {
    return {
      availableEnvironments: [],
      selectedEnvironment: null,
      selectedEnvironmentSource: null
    };
  }
  const mergedSettings = getSettings_DEPRECATED();
  const defaultEnvironmentId = mergedSettings?.remote?.defaultEnvironmentId;
  let selectedEnvironment = environments.find((env) => env.kind !== "bridge") ?? environments[0];
  let selectedEnvironmentSource = null;
  if (defaultEnvironmentId) {
    const matchingEnvironment = environments.find((env) => env.environment_id === defaultEnvironmentId);
    if (matchingEnvironment) {
      selectedEnvironment = matchingEnvironment;
      for (let i = SETTING_SOURCES.length - 1;i >= 0; i--) {
        const source = SETTING_SOURCES[i];
        if (!source || source === "flagSettings") {
          continue;
        }
        const sourceSettings = getSettingsForSource(source);
        if (sourceSettings?.remote?.defaultEnvironmentId === defaultEnvironmentId) {
          selectedEnvironmentSource = source;
          break;
        }
      }
    }
  }
  return {
    availableEnvironments: environments,
    selectedEnvironment,
    selectedEnvironmentSource
  };
}
var init_environmentSelection = __esm(() => {
  init_constants();
  init_settings();
  init_environments();
});

// src/components/RemoteEnvironmentDialog.tsx
function RemoteEnvironmentDialog(t0) {
  const $ = import_compiler_runtime.c(27);
  const {
    onDone
  } = t0;
  const [loadingState, setLoadingState] = import_react.useState("loading");
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [environments, setEnvironments] = import_react.useState(t1);
  const [selectedEnvironment, setSelectedEnvironment] = import_react.useState(null);
  const [selectedEnvironmentSource, setSelectedEnvironmentSource] = import_react.useState(null);
  const [error, setError] = import_react.useState(null);
  let t2;
  let t3;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      let cancelled = false;
      const fetchInfo = async function fetchInfo2() {
        try {
          const result = await getEnvironmentSelectionInfo();
          if (cancelled) {
            return;
          }
          setEnvironments(result.availableEnvironments);
          setSelectedEnvironment(result.selectedEnvironment);
          setSelectedEnvironmentSource(result.selectedEnvironmentSource);
          setLoadingState(null);
        } catch (t42) {
          const err = t42;
          if (cancelled) {
            return;
          }
          const fetchError = toError(err);
          logError(fetchError);
          setError(fetchError.message);
          setLoadingState(null);
        }
      };
      fetchInfo();
      return () => {
        cancelled = true;
      };
    };
    t3 = [];
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  import_react.useEffect(t2, t3);
  let t4;
  if ($[3] !== environments || $[4] !== onDone) {
    t4 = function handleSelect2(value) {
      if (value === "cancel") {
        onDone();
        return;
      }
      setLoadingState("updating");
      const selectedEnv = environments.find((env) => env.environment_id === value);
      if (!selectedEnv) {
        onDone("Error: Selected environment not found");
        return;
      }
      updateSettingsForSource("localSettings", {
        remote: {
          defaultEnvironmentId: selectedEnv.environment_id
        }
      });
      onDone(`Set default remote environment to ${source_default.bold(selectedEnv.name)} (${selectedEnv.environment_id})`);
    };
    $[3] = environments;
    $[4] = onDone;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const handleSelect = t4;
  if (loadingState === "loading") {
    let t52;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(LoadingState, {
        message: "Loading environments\u2026"
      }, undefined, false, undefined, this);
      $[6] = t52;
    } else {
      t52 = $[6];
    }
    let t6;
    if ($[7] !== onDone) {
      t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
        title: DIALOG_TITLE,
        onCancel: onDone,
        hideInputGuide: true,
        children: t52
      }, undefined, false, undefined, this);
      $[7] = onDone;
      $[8] = t6;
    } else {
      t6 = $[8];
    }
    return t6;
  }
  if (error) {
    let t52;
    if ($[9] !== error) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "error",
        children: [
          "Error: ",
          error
        ]
      }, undefined, true, undefined, this);
      $[9] = error;
      $[10] = t52;
    } else {
      t52 = $[10];
    }
    let t6;
    if ($[11] !== onDone || $[12] !== t52) {
      t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
        title: DIALOG_TITLE,
        onCancel: onDone,
        children: t52
      }, undefined, false, undefined, this);
      $[11] = onDone;
      $[12] = t52;
      $[13] = t6;
    } else {
      t6 = $[13];
    }
    return t6;
  }
  if (!selectedEnvironment) {
    let t52;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "No remote environments available."
      }, undefined, false, undefined, this);
      $[14] = t52;
    } else {
      t52 = $[14];
    }
    let t6;
    if ($[15] !== onDone) {
      t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
        title: DIALOG_TITLE,
        subtitle: SETUP_HINT,
        onCancel: onDone,
        children: t52
      }, undefined, false, undefined, this);
      $[15] = onDone;
      $[16] = t6;
    } else {
      t6 = $[16];
    }
    return t6;
  }
  if (environments.length === 1) {
    let t52;
    if ($[17] !== onDone || $[18] !== selectedEnvironment) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(SingleEnvironmentContent, {
        environment: selectedEnvironment,
        onDone
      }, undefined, false, undefined, this);
      $[17] = onDone;
      $[18] = selectedEnvironment;
      $[19] = t52;
    } else {
      t52 = $[19];
    }
    return t52;
  }
  let t5;
  if ($[20] !== environments || $[21] !== handleSelect || $[22] !== loadingState || $[23] !== onDone || $[24] !== selectedEnvironment || $[25] !== selectedEnvironmentSource) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(MultipleEnvironmentsContent, {
      environments,
      selectedEnvironment,
      selectedEnvironmentSource,
      loadingState,
      onSelect: handleSelect,
      onCancel: onDone
    }, undefined, false, undefined, this);
    $[20] = environments;
    $[21] = handleSelect;
    $[22] = loadingState;
    $[23] = onDone;
    $[24] = selectedEnvironment;
    $[25] = selectedEnvironmentSource;
    $[26] = t5;
  } else {
    t5 = $[26];
  }
  return t5;
}
function EnvironmentLabel(t0) {
  const $ = import_compiler_runtime.c(7);
  const {
    environment
  } = t0;
  let t1;
  if ($[0] !== environment.name) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: environment.name
    }, undefined, false, undefined, this);
    $[0] = environment.name;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== environment.environment_id) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "(",
        environment.environment_id,
        ")"
      ]
    }, undefined, true, undefined, this);
    $[2] = environment.environment_id;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1 || $[5] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        figures_default.tick,
        " Using ",
        t1,
        " ",
        t2
      ]
    }, undefined, true, undefined, this);
    $[4] = t1;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}
function SingleEnvironmentContent(t0) {
  const $ = import_compiler_runtime.c(6);
  const {
    environment,
    onDone
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      context: "Confirmation"
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  useKeybinding("confirm:yes", onDone, t1);
  let t2;
  if ($[1] !== environment) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(EnvironmentLabel, {
      environment
    }, undefined, false, undefined, this);
    $[1] = environment;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== onDone || $[4] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: DIALOG_TITLE,
      subtitle: SETUP_HINT,
      onCancel: onDone,
      children: t2
    }, undefined, false, undefined, this);
    $[3] = onDone;
    $[4] = t2;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}
function MultipleEnvironmentsContent(t0) {
  const $ = import_compiler_runtime.c(18);
  const {
    environments,
    selectedEnvironment,
    selectedEnvironmentSource,
    loadingState,
    onSelect,
    onCancel
  } = t0;
  let t1;
  if ($[0] !== selectedEnvironmentSource) {
    t1 = selectedEnvironmentSource && selectedEnvironmentSource !== "localSettings" ? ` (from ${getSettingSourceName(selectedEnvironmentSource)} settings)` : "";
    $[0] = selectedEnvironmentSource;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const sourceSuffix = t1;
  let t2;
  if ($[2] !== selectedEnvironment.name) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: selectedEnvironment.name
    }, undefined, false, undefined, this);
    $[2] = selectedEnvironment.name;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== sourceSuffix || $[5] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "Currently using: ",
        t2,
        sourceSuffix
      ]
    }, undefined, true, undefined, this);
    $[4] = sourceSuffix;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const subtitle = t3;
  let t4;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: SETUP_HINT
    }, undefined, false, undefined, this);
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== environments || $[9] !== loadingState || $[10] !== onSelect || $[11] !== selectedEnvironment.environment_id) {
    t5 = loadingState === "updating" ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(LoadingState, {
      message: "Updating\u2026"
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      options: environments.map(_temp),
      defaultValue: selectedEnvironment.environment_id,
      onChange: onSelect,
      onCancel: () => onSelect("cancel"),
      layout: "compact-vertical"
    }, undefined, false, undefined, this);
    $[8] = environments;
    $[9] = loadingState;
    $[10] = onSelect;
    $[11] = selectedEnvironment.environment_id;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  let t6;
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
            shortcut: "Enter",
            action: "select"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
            action: "confirm:no",
            context: "Confirmation",
            fallback: "Esc",
            description: "cancel"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  let t7;
  if ($[14] !== onCancel || $[15] !== subtitle || $[16] !== t5) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: DIALOG_TITLE,
      subtitle,
      onCancel,
      hideInputGuide: true,
      children: [
        t4,
        t5,
        t6
      ]
    }, undefined, true, undefined, this);
    $[14] = onCancel;
    $[15] = subtitle;
    $[16] = t5;
    $[17] = t7;
  } else {
    t7 = $[17];
  }
  return t7;
}
function _temp(env) {
  return {
    label: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        env.name,
        " ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "(",
            env.environment_id,
            ")"
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this),
    value: env.environment_id
  };
}
var import_compiler_runtime, import_react, jsx_dev_runtime, DIALOG_TITLE = "Select Remote Environment", SETUP_HINT = `Configure environments at: https://claude.ai/code`;
var init_RemoteEnvironmentDialog = __esm(() => {
  init_source();
  init_figures();
  init_ink();
  init_useKeybinding();
  init_errors();
  init_log();
  init_constants();
  init_settings();
  init_environmentSelection();
  init_ConfigurableShortcutHint();
  init_select();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  init_LoadingState();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/remote-env/remote-env.tsx
async function call(onDone) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(RemoteEnvironmentDialog, {
    onDone
  }, undefined, false, undefined, this);
}
var jsx_dev_runtime2;
var init_remote_env = __esm(() => {
  init_RemoteEnvironmentDialog();
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});
init_remote_env();

export {
  call
};
