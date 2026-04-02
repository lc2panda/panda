// @bun
import {
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/PressEnterToContinue.tsx
function PressEnterToContinue() {
  const $ = import_compiler_runtime.c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "permission",
      children: [
        "Press ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Enter"
        }, undefined, false, undefined, this),
        " to continue\u2026"
      ]
    }, undefined, true, undefined, this);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_PressEnterToContinue = __esm(() => {
  init_ink();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { PressEnterToContinue, init_PressEnterToContinue };
