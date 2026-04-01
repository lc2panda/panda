// @bun
import {
  Spinner,
  init_Spinner
} from "./chunk-jwtmq3ad.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/design-system/LoadingState.tsx
function LoadingState(t0) {
  const $ = import_compiler_runtime.c(10);
  const {
    message,
    bold: t1,
    dimColor: t2,
    subtitle
  } = t0;
  const bold = t1 === undefined ? false : t1;
  const dimColor = t2 === undefined ? false : t2;
  let t3;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this);
    $[0] = t3;
  } else {
    t3 = $[0];
  }
  let t4;
  if ($[1] !== bold || $[2] !== dimColor || $[3] !== message) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "row",
      children: [
        t3,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold,
          dimColor,
          children: [
            " ",
            message
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[1] = bold;
    $[2] = dimColor;
    $[3] = message;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  let t5;
  if ($[5] !== subtitle) {
    t5 = subtitle && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: subtitle
    }, undefined, false, undefined, this);
    $[5] = subtitle;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  let t6;
  if ($[7] !== t4 || $[8] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[7] = t4;
    $[8] = t5;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  return t6;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_LoadingState = __esm(() => {
  init_ink();
  init_Spinner();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { LoadingState, init_LoadingState };
