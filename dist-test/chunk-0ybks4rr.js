// @bun
import {
  ThemedBox_default,
  ThemedText,
  color,
  init_color,
  init_ink,
  require_compiler_runtime,
  useTheme
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import {
  _baseSet_default,
  init__baseSet
} from "./chunk-bt6e264h.js";
import {
  figures_default,
  init_figures
} from "./chunk-nahdbxge.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// node_modules/.bun/lodash-es@4.17.23/node_modules/lodash-es/setWith.js
function setWith(object, path, value, customizer) {
  customizer = typeof customizer == "function" ? customizer : undefined;
  return object == null ? object : _baseSet_default(object, path, value, customizer);
}
var setWith_default;
var init_setWith = __esm(() => {
  init__baseSet();
  setWith_default = setWith;
});

// src/utils/treeify.ts
function treeify(obj, options = {}) {
  const {
    showValues = true,
    hideFunctions = false,
    themeName = "dark",
    treeCharColors = {}
  } = options;
  const lines = [];
  const visited = new WeakSet;
  function colorize(text, colorKey) {
    if (!colorKey)
      return text;
    return color(colorKey, themeName)(text);
  }
  function growBranch(node, prefix, _isLast, depth = 0) {
    if (typeof node === "string") {
      lines.push(prefix + colorize(node, treeCharColors.value));
      return;
    }
    if (typeof node !== "object" || node === null) {
      if (showValues) {
        const valueStr = String(node);
        lines.push(prefix + colorize(valueStr, treeCharColors.value));
      }
      return;
    }
    if (visited.has(node)) {
      lines.push(prefix + colorize("[Circular]", treeCharColors.value));
      return;
    }
    visited.add(node);
    const keys2 = Object.keys(node).filter((key) => {
      const value = node[key];
      if (hideFunctions && typeof value === "function")
        return false;
      return true;
    });
    keys2.forEach((key, index) => {
      const value = node[key];
      const isLastKey = index === keys2.length - 1;
      const nodePrefix = depth === 0 && index === 0 ? "" : prefix;
      const treeChar = isLastKey ? DEFAULT_TREE_CHARS.lastBranch : DEFAULT_TREE_CHARS.branch;
      const coloredTreeChar = colorize(treeChar, treeCharColors.treeChar);
      const coloredKey = key.trim() === "" ? "" : colorize(key, treeCharColors.key);
      let line = nodePrefix + coloredTreeChar + (coloredKey ? " " + coloredKey : "");
      const shouldAddColon = key.trim() !== "";
      if (value && typeof value === "object" && visited.has(value)) {
        const coloredValue = colorize("[Circular]", treeCharColors.value);
        lines.push(line + (shouldAddColon ? ": " : line ? " " : "") + coloredValue);
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        lines.push(line);
        const continuationChar = isLastKey ? DEFAULT_TREE_CHARS.empty : DEFAULT_TREE_CHARS.line;
        const coloredContinuation = colorize(continuationChar, treeCharColors.treeChar);
        const nextPrefix = nodePrefix + coloredContinuation + " ";
        growBranch(value, nextPrefix, isLastKey, depth + 1);
      } else if (Array.isArray(value)) {
        lines.push(line + (shouldAddColon ? ": " : line ? " " : "") + "[Array(" + value.length + ")]");
      } else if (showValues) {
        const valueStr = typeof value === "function" ? "[Function]" : String(value);
        const coloredValue = colorize(valueStr, treeCharColors.value);
        line += (shouldAddColon ? ": " : line ? " " : "") + coloredValue;
        lines.push(line);
      } else {
        lines.push(line);
      }
    });
  }
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return colorize("(empty)", treeCharColors.value);
  }
  if (keys.length === 1 && keys[0] !== undefined && keys[0].trim() === "" && typeof obj[keys[0]] === "string") {
    const firstKey = keys[0];
    const coloredTreeChar = colorize(DEFAULT_TREE_CHARS.lastBranch, treeCharColors.treeChar);
    const coloredValue = colorize(obj[firstKey], treeCharColors.value);
    return coloredTreeChar + " " + coloredValue;
  }
  growBranch(obj, "", true);
  return lines.join(`
`);
}
var DEFAULT_TREE_CHARS;
var init_treeify = __esm(() => {
  init_figures();
  init_color();
  DEFAULT_TREE_CHARS = {
    branch: figures_default.lineUpDownRight,
    lastBranch: figures_default.lineUpRight,
    line: figures_default.lineVertical,
    empty: " "
  };
});

// src/components/ValidationErrorsList.tsx
function buildNestedTree(errors) {
  const tree = {};
  errors.forEach((error) => {
    if (!error.path) {
      tree[""] = error.message;
      return;
    }
    const pathParts = error.path.split(".");
    let modifiedPath = error.path;
    if (error.invalidValue !== null && error.invalidValue !== undefined && pathParts.length > 0) {
      const newPathParts = [];
      for (let i = 0;i < pathParts.length; i++) {
        const part = pathParts[i];
        if (!part)
          continue;
        const numericPart = parseInt(part, 10);
        if (!isNaN(numericPart) && i === pathParts.length - 1) {
          let displayValue;
          if (typeof error.invalidValue === "string") {
            displayValue = `"${error.invalidValue}"`;
          } else if (error.invalidValue === null) {
            displayValue = "null";
          } else if (error.invalidValue === undefined) {
            displayValue = "undefined";
          } else {
            displayValue = String(error.invalidValue);
          }
          newPathParts.push(displayValue);
        } else {
          newPathParts.push(part);
        }
      }
      modifiedPath = newPathParts.join(".");
    }
    setWith_default(tree, modifiedPath, error.message, Object);
  });
  return tree;
}
function ValidationErrorsList(t0) {
  const $ = import_compiler_runtime.c(9);
  const {
    errors
  } = t0;
  const [themeName] = useTheme();
  if (errors.length === 0) {
    return null;
  }
  let T0;
  let t1;
  let t2;
  if ($[0] !== errors || $[1] !== themeName) {
    const errorsByFile = errors.reduce(_temp, {});
    const sortedFiles = Object.keys(errorsByFile).sort();
    T0 = ThemedBox_default;
    t1 = "column";
    t2 = sortedFiles.map((file_0) => {
      const fileErrors = errorsByFile[file_0] || [];
      fileErrors.sort(_temp2);
      const errorTree = buildNestedTree(fileErrors);
      const suggestionPairs = new Map;
      fileErrors.forEach((error_0) => {
        if (error_0.suggestion || error_0.docLink) {
          const key = `${error_0.suggestion || ""}|${error_0.docLink || ""}`;
          if (!suggestionPairs.has(key)) {
            suggestionPairs.set(key, {
              suggestion: error_0.suggestion,
              docLink: error_0.docLink
            });
          }
        }
      });
      const treeOutput = treeify(errorTree, {
        showValues: true,
        themeName,
        treeCharColors: {
          treeChar: "inactive",
          key: "text",
          value: "inactive"
        }
      });
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: file_0
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginLeft: 1,
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              dimColor: true,
              children: treeOutput
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          suggestionPairs.size > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginTop: 1,
            children: Array.from(suggestionPairs.values()).map(_temp3)
          }, undefined, false, undefined, this)
        ]
      }, file_0, true, undefined, this);
    });
    $[0] = errors;
    $[1] = themeName;
    $[2] = T0;
    $[3] = t1;
    $[4] = t2;
  } else {
    T0 = $[2];
    t1 = $[3];
    t2 = $[4];
  }
  let t3;
  if ($[5] !== T0 || $[6] !== t1 || $[7] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T0, {
      flexDirection: t1,
      children: t2
    }, undefined, false, undefined, this);
    $[5] = T0;
    $[6] = t1;
    $[7] = t2;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}
function _temp3(pair, index) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      pair.suggestion && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        wrap: "wrap",
        children: pair.suggestion
      }, undefined, false, undefined, this),
      pair.docLink && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        wrap: "wrap",
        children: [
          "Learn more: ",
          pair.docLink
        ]
      }, undefined, true, undefined, this)
    ]
  }, `suggestion-pair-${index}`, true, undefined, this);
}
function _temp2(a, b) {
  if (!a.path && b.path) {
    return -1;
  }
  if (a.path && !b.path) {
    return 1;
  }
  return (a.path || "").localeCompare(b.path || "");
}
function _temp(acc, error) {
  const file = error.file || "(file not specified)";
  if (!acc[file]) {
    acc[file] = [];
  }
  acc[file].push(error);
  return acc;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_ValidationErrorsList = __esm(() => {
  init_setWith();
  init_ink();
  init_treeify();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { ValidationErrorsList, init_ValidationErrorsList };
