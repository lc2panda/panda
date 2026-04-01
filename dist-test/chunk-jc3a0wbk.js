// @bun
import {
  Select,
  init_CustomSelect
} from "./chunk-jwtmq3ad.js";
import {
  Dialog,
  init_Dialog
} from "./chunk-px2n7q1y.js";
import {
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import {
  init_config1 as init_config,
  saveGlobalConfig
} from "./chunk-bt6e264h.js";
import {
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/ApproveApiKey.tsx
init_ink();
init_config();
init_CustomSelect();
init_Dialog();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
function ApproveApiKey(t0) {
  const $ = import_compiler_runtime.c(17);
  const {
    customApiKeyTruncated,
    onDone
  } = t0;
  let t1;
  if ($[0] !== customApiKeyTruncated || $[1] !== onDone) {
    t1 = function onChange2(value) {
      bb2:
        switch (value) {
          case "yes": {
            saveGlobalConfig((current_0) => ({
              ...current_0,
              customApiKeyResponses: {
                ...current_0.customApiKeyResponses,
                approved: [...current_0.customApiKeyResponses?.approved ?? [], customApiKeyTruncated]
              }
            }));
            onDone(true);
            break bb2;
          }
          case "no": {
            saveGlobalConfig((current) => ({
              ...current,
              customApiKeyResponses: {
                ...current.customApiKeyResponses,
                rejected: [...current.customApiKeyResponses?.rejected ?? [], customApiKeyTruncated]
              }
            }));
            onDone(false);
          }
        }
    };
    $[0] = customApiKeyTruncated;
    $[1] = onDone;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const onChange = t1;
  let t2;
  if ($[3] !== onChange) {
    t2 = () => onChange("no");
    $[3] = onChange;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: "ANTHROPIC_API_KEY"
    }, undefined, false, undefined, this);
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== customApiKeyTruncated) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        t3,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: [
            ": sk-ant-...",
            customApiKeyTruncated
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[6] = customApiKeyTruncated;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "Do you want to use this API key?"
    }, undefined, false, undefined, this);
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  let t6;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = {
      label: "Yes",
      value: "yes"
    };
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  let t7;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = [t6, {
      label: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          "No (",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            bold: true,
            children: "recommended"
          }, undefined, false, undefined, this),
          ")"
        ]
      }, undefined, true, undefined, this),
      value: "no"
    }];
    $[10] = t7;
  } else {
    t7 = $[10];
  }
  let t8;
  if ($[11] !== onChange) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      defaultValue: "no",
      defaultFocusValue: "no",
      options: t7,
      onChange: (value_0) => onChange(value_0),
      onCancel: () => onChange("no")
    }, undefined, false, undefined, this);
    $[11] = onChange;
    $[12] = t8;
  } else {
    t8 = $[12];
  }
  let t9;
  if ($[13] !== t2 || $[14] !== t4 || $[15] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Detected a custom API key in your environment",
      color: "warning",
      onCancel: t2,
      children: [
        t4,
        t5,
        t8
      ]
    }, undefined, true, undefined, this);
    $[13] = t2;
    $[14] = t4;
    $[15] = t8;
    $[16] = t9;
  } else {
    t9 = $[16];
  }
  return t9;
}

export { ApproveApiKey };
