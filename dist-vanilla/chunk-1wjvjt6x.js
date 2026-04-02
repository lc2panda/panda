// @bun
import {
  describeMcpConfigFilePath,
  getMcpConfigsByScope,
  getScopeLabel,
  init_config,
  init_utils
} from "./chunk-ekfe4t3x.js";
import {
  Link,
  ThemedBox_default,
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

// src/components/mcp/McpParsingWarnings.tsx
function McpConfigErrorSection(t0) {
  const $ = import_compiler_runtime.c(26);
  const {
    scope,
    parsingErrors,
    warnings
  } = t0;
  const hasErrors = parsingErrors.length > 0;
  const hasWarnings = warnings.length > 0;
  if (!hasErrors && !hasWarnings) {
    return null;
  }
  let t1;
  if ($[0] !== hasErrors || $[1] !== hasWarnings) {
    t1 = (hasErrors || hasWarnings) && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: hasErrors ? "error" : "warning",
      children: [
        "[",
        hasErrors ? "Failed to parse" : "Contains warnings",
        "]",
        " "
      ]
    }, undefined, true, undefined, this);
    $[0] = hasErrors;
    $[1] = hasWarnings;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== scope) {
    t2 = getScopeLabel(scope);
    $[3] = scope;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: t2
    }, undefined, false, undefined, this);
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== t1 || $[8] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: [
        t1,
        t3
      ]
    }, undefined, true, undefined, this);
    $[7] = t1;
    $[8] = t3;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Location: "
    }, undefined, false, undefined, this);
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  let t6;
  if ($[11] !== scope) {
    t6 = describeMcpConfigFilePath(scope);
    $[11] = scope;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  let t7;
  if ($[13] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: [
        t5,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: t6
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[13] = t6;
    $[14] = t7;
  } else {
    t7 = $[14];
  }
  let t8;
  if ($[15] !== parsingErrors) {
    t8 = parsingErrors.map(_temp);
    $[15] = parsingErrors;
    $[16] = t8;
  } else {
    t8 = $[16];
  }
  let t9;
  if ($[17] !== warnings) {
    t9 = warnings.map(_temp2);
    $[17] = warnings;
    $[18] = t9;
  } else {
    t9 = $[18];
  }
  let t10;
  if ($[19] !== t8 || $[20] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      marginLeft: 1,
      flexDirection: "column",
      children: [
        t8,
        t9
      ]
    }, undefined, true, undefined, this);
    $[19] = t8;
    $[20] = t9;
    $[21] = t10;
  } else {
    t10 = $[21];
  }
  let t11;
  if ($[22] !== t10 || $[23] !== t4 || $[24] !== t7) {
    t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        t4,
        t7,
        t10
      ]
    }, undefined, true, undefined, this);
    $[22] = t10;
    $[23] = t4;
    $[24] = t7;
    $[25] = t11;
  } else {
    t11 = $[25];
  }
  return t11;
}
function _temp2(warning, i_0) {
  const serverName_0 = warning.mcpErrorMetadata?.serverName;
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "\u2514 "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "warning",
          children: "[Warning]"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            " ",
            serverName_0 && `[${serverName_0}] `,
            warning.path && warning.path !== "" ? `${warning.path}: ` : "",
            warning.message
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, `warning-${i_0}`, false, undefined, this);
}
function _temp(error, i) {
  const serverName = error.mcpErrorMetadata?.serverName;
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "\u2514 "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "error",
          children: "[Error]"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            " ",
            serverName && `[${serverName}] `,
            error.path && error.path !== "" ? `${error.path}: ` : "",
            error.message
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, `error-${i}`, false, undefined, this);
}
function McpParsingWarnings() {
  const $ = import_compiler_runtime.c(6);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      scope: "user",
      config: getMcpConfigsByScope("user")
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      scope: "project",
      config: getMcpConfigsByScope("project")
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = {
      scope: "local",
      config: getMcpConfigsByScope("local")
    };
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = [t0, t1, t2, {
      scope: "enterprise",
      config: getMcpConfigsByScope("enterprise")
    }];
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const scopes = t3;
  const hasParsingErrors = scopes.some(_temp3);
  const hasWarnings = scopes.some(_temp4);
  if (!hasParsingErrors && !hasWarnings) {
    return null;
  }
  let t4;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: "MCP Config Diagnostics"
    }, undefined, false, undefined, this);
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  let t5;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      marginBottom: 1,
      children: [
        t4,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "For help configuring MCP servers, see:",
              " ",
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
                url: "https://code.claude.com/docs/en/mcp",
                children: "https://code.claude.com/docs/en/mcp"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        scopes.map(_temp5)
      ]
    }, undefined, true, undefined, this);
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  return t5;
}
function _temp5(t0) {
  const {
    scope,
    config: config_1
  } = t0;
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(McpConfigErrorSection, {
    scope,
    parsingErrors: filterErrors(config_1.errors, "fatal"),
    warnings: filterErrors(config_1.errors, "warning")
  }, scope, false, undefined, this);
}
function _temp4(t0) {
  const {
    config: config_0
  } = t0;
  return filterErrors(config_0.errors, "warning").length > 0;
}
function _temp3(t0) {
  const {
    config
  } = t0;
  return filterErrors(config.errors, "fatal").length > 0;
}
function filterErrors(errors, severity) {
  return errors.filter((e) => e.mcpErrorMetadata?.severity === severity);
}
var import_compiler_runtime, jsx_dev_runtime;
var init_McpParsingWarnings = __esm(() => {
  init_config();
  init_utils();
  init_ink();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { McpParsingWarnings, init_McpParsingWarnings };
