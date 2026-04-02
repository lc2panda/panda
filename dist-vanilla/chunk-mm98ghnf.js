// @bun
import {
  Select,
  init_CustomSelect
} from "./chunk-ekfe4t3x.js";
import {
  Dialog,
  init_Dialog
} from "./chunk-p9ra2v2f.js";
import {
  Link,
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_config1 as init_config,
  saveCurrentProjectConfig
} from "./chunk-w5d5b7r0.js";
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/ClaudeMdExternalIncludesDialog.tsx
function ClaudeMdExternalIncludesDialog(t0) {
  const $ = import_compiler_runtime.c(18);
  const {
    onDone,
    isStandaloneDialog,
    externalIncludes
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  import_react.default.useEffect(_temp, t1);
  let t2;
  if ($[1] !== onDone) {
    t2 = (value) => {
      if (value === "no") {
        logEvent("tengu_claude_md_external_includes_dialog_declined", {});
        saveCurrentProjectConfig(_temp2);
      } else {
        logEvent("tengu_claude_md_external_includes_dialog_accepted", {});
        saveCurrentProjectConfig(_temp3);
      }
      onDone();
    };
    $[1] = onDone;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const handleSelection = t2;
  let t3;
  if ($[3] !== handleSelection) {
    t3 = () => {
      handleSelection("no");
    };
    $[3] = handleSelection;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const handleEscape = t3;
  const t4 = !isStandaloneDialog;
  const t5 = !isStandaloneDialog;
  let t6;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "This project's CLAUDE.md imports files outside the current working directory. Never allow this for third-party repositories."
    }, undefined, false, undefined, this);
    $[5] = t6;
  } else {
    t6 = $[5];
  }
  let t7;
  if ($[6] !== externalIncludes) {
    t7 = externalIncludes && externalIncludes.length > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "External imports:"
        }, undefined, false, undefined, this),
        externalIncludes.map(_temp4)
      ]
    }, undefined, true, undefined, this);
    $[6] = externalIncludes;
    $[7] = t7;
  } else {
    t7 = $[7];
  }
  let t8;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "Important: Only use Panda Code with files you trust. Accessing untrusted files may pose security risks",
        " ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
          url: "https://code.claude.com/docs/en/security"
        }, undefined, false, undefined, this),
        " "
      ]
    }, undefined, true, undefined, this);
    $[8] = t8;
  } else {
    t8 = $[8];
  }
  let t9;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = [{
      label: "Yes, allow external imports",
      value: "yes"
    }, {
      label: "No, disable external imports",
      value: "no"
    }];
    $[9] = t9;
  } else {
    t9 = $[9];
  }
  let t10;
  if ($[10] !== handleSelection) {
    t10 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      options: t9,
      onChange: (value_0) => handleSelection(value_0)
    }, undefined, false, undefined, this);
    $[10] = handleSelection;
    $[11] = t10;
  } else {
    t10 = $[11];
  }
  let t11;
  if ($[12] !== handleEscape || $[13] !== t10 || $[14] !== t4 || $[15] !== t5 || $[16] !== t7) {
    t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Allow external CLAUDE.md file imports?",
      color: "warning",
      onCancel: handleEscape,
      hideBorder: t4,
      hideInputGuide: t5,
      children: [
        t6,
        t7,
        t8,
        t10
      ]
    }, undefined, true, undefined, this);
    $[12] = handleEscape;
    $[13] = t10;
    $[14] = t4;
    $[15] = t5;
    $[16] = t7;
    $[17] = t11;
  } else {
    t11 = $[17];
  }
  return t11;
}
function _temp4(include, i) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
    dimColor: true,
    children: [
      "  ",
      include.path
    ]
  }, i, true, undefined, this);
}
function _temp3(current_0) {
  return {
    ...current_0,
    hasClaudeMdExternalIncludesApproved: true,
    hasClaudeMdExternalIncludesWarningShown: true
  };
}
function _temp2(current) {
  return {
    ...current,
    hasClaudeMdExternalIncludesApproved: false,
    hasClaudeMdExternalIncludesWarningShown: true
  };
}
function _temp() {
  logEvent("tengu_claude_md_includes_dialog_shown", {});
}
var import_compiler_runtime, import_react, jsx_dev_runtime;
var init_ClaudeMdExternalIncludesDialog = __esm(() => {
  init_analytics();
  init_ink();
  init_config();
  init_CustomSelect();
  init_Dialog();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { ClaudeMdExternalIncludesDialog, init_ClaudeMdExternalIncludesDialog };
