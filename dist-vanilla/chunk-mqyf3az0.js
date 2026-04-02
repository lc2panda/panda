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
  figures_default,
  init_figures
} from "./chunk-ehab6nmr.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/design-system/StatusIcon.tsx
function StatusIcon(t0) {
  const $ = import_compiler_runtime.c(5);
  const {
    status,
    withSpace: t1
  } = t0;
  const withSpace = t1 === undefined ? false : t1;
  const config = STATUS_CONFIG[status];
  const t2 = !config.color;
  const t3 = withSpace && " ";
  let t4;
  if ($[0] !== config.color || $[1] !== config.icon || $[2] !== t2 || $[3] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: config.color,
      dimColor: t2,
      children: [
        config.icon,
        t3
      ]
    }, undefined, true, undefined, this);
    $[0] = config.color;
    $[1] = config.icon;
    $[2] = t2;
    $[3] = t3;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  return t4;
}
var import_compiler_runtime, jsx_dev_runtime, STATUS_CONFIG;
var init_StatusIcon = __esm(() => {
  init_figures();
  init_ink();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
  STATUS_CONFIG = {
    success: {
      icon: figures_default.tick,
      color: "success"
    },
    error: {
      icon: figures_default.cross,
      color: "error"
    },
    warning: {
      icon: figures_default.warning,
      color: "warning"
    },
    info: {
      icon: figures_default.info,
      color: "suggestion"
    },
    pending: {
      icon: figures_default.circle,
      color: undefined
    },
    loading: {
      icon: "\u2026",
      color: undefined
    }
  };
});

export { StatusIcon, init_StatusIcon };
