// @bun
import {
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  __toESM
} from "./chunk-qp2qdcda.js";

// src/context/fpsMetrics.tsx
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var import_react = __toESM(require_react(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
var FpsMetricsContext = import_react.createContext(undefined);
function FpsMetricsProvider(t0) {
  const $ = import_compiler_runtime.c(3);
  const {
    getFpsMetrics,
    children
  } = t0;
  let t1;
  if ($[0] !== children || $[1] !== getFpsMetrics) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(FpsMetricsContext.Provider, {
      value: getFpsMetrics,
      children
    }, undefined, false, undefined, this);
    $[0] = children;
    $[1] = getFpsMetrics;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}
function useFpsMetrics() {
  return import_react.useContext(FpsMetricsContext);
}

export { FpsMetricsProvider, useFpsMetrics };
