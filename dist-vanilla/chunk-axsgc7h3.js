// @bun
import {
  init_useTerminalSize,
  useTerminalSize
} from "./chunk-gypetngm.js";
import {
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
  init_format,
  init_stringWidth,
  stringWidth,
  truncatePathMiddle,
  truncateToWidth
} from "./chunk-ywhstzac.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/PromptInput/PromptInputFooterSuggestions.tsx
function getIcon(itemId) {
  if (itemId.startsWith("file-"))
    return "+";
  if (itemId.startsWith("mcp-resource-"))
    return "\u25C7";
  if (itemId.startsWith("agent-"))
    return "*";
  return "+";
}
function isUnifiedSuggestion(itemId) {
  return itemId.startsWith("file-") || itemId.startsWith("mcp-resource-") || itemId.startsWith("agent-");
}
function PromptInputFooterSuggestions(t0) {
  const $ = import_compiler_runtime.c(22);
  const {
    suggestions,
    selectedSuggestion,
    maxColumnWidth: maxColumnWidthProp,
    overlay
  } = t0;
  const {
    rows
  } = useTerminalSize();
  const maxVisibleItems = overlay ? OVERLAY_MAX_ITEMS : Math.min(6, Math.max(1, rows - 3));
  if (suggestions.length === 0) {
    return null;
  }
  let t1;
  if ($[0] !== maxColumnWidthProp || $[1] !== suggestions) {
    t1 = maxColumnWidthProp ?? Math.max(...suggestions.map(_temp)) + 5;
    $[0] = maxColumnWidthProp;
    $[1] = suggestions;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const maxColumnWidth = t1;
  const startIndex = Math.max(0, Math.min(selectedSuggestion - Math.floor(maxVisibleItems / 2), suggestions.length - maxVisibleItems));
  const endIndex = Math.min(startIndex + maxVisibleItems, suggestions.length);
  let T0;
  let t2;
  let t3;
  let t4;
  if ($[3] !== endIndex || $[4] !== maxColumnWidth || $[5] !== overlay || $[6] !== selectedSuggestion || $[7] !== startIndex || $[8] !== suggestions) {
    const visibleItems = suggestions.slice(startIndex, endIndex);
    T0 = ThemedBox_default;
    t2 = "column";
    t3 = overlay ? undefined : "flex-end";
    let t52;
    if ($[13] !== maxColumnWidth || $[14] !== selectedSuggestion || $[15] !== suggestions) {
      t52 = (item_0) => /* @__PURE__ */ jsx_dev_runtime.jsxDEV(SuggestionItemRow, {
        item: item_0,
        maxColumnWidth,
        isSelected: item_0.id === suggestions[selectedSuggestion]?.id
      }, item_0.id, false, undefined, this);
      $[13] = maxColumnWidth;
      $[14] = selectedSuggestion;
      $[15] = suggestions;
      $[16] = t52;
    } else {
      t52 = $[16];
    }
    t4 = visibleItems.map(t52);
    $[3] = endIndex;
    $[4] = maxColumnWidth;
    $[5] = overlay;
    $[6] = selectedSuggestion;
    $[7] = startIndex;
    $[8] = suggestions;
    $[9] = T0;
    $[10] = t2;
    $[11] = t3;
    $[12] = t4;
  } else {
    T0 = $[9];
    t2 = $[10];
    t3 = $[11];
    t4 = $[12];
  }
  let t5;
  if ($[17] !== T0 || $[18] !== t2 || $[19] !== t3 || $[20] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T0, {
      flexDirection: t2,
      justifyContent: t3,
      children: t4
    }, undefined, false, undefined, this);
    $[17] = T0;
    $[18] = t2;
    $[19] = t3;
    $[20] = t4;
    $[21] = t5;
  } else {
    t5 = $[21];
  }
  return t5;
}
function _temp(item) {
  return stringWidth(item.displayText);
}
var import_compiler_runtime, import_react, jsx_dev_runtime, OVERLAY_MAX_ITEMS = 5, SuggestionItemRow, PromptInputFooterSuggestions_default;
var init_PromptInputFooterSuggestions = __esm(() => {
  init_useTerminalSize();
  init_stringWidth();
  init_ink();
  init_format();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
  SuggestionItemRow = import_react.memo(function SuggestionItemRow2(t0) {
    const $ = import_compiler_runtime.c(36);
    const {
      item,
      maxColumnWidth,
      isSelected
    } = t0;
    const columns = useTerminalSize().columns;
    const isUnified = isUnifiedSuggestion(item.id);
    if (isUnified) {
      let t12;
      if ($[0] !== item.id) {
        t12 = getIcon(item.id);
        $[0] = item.id;
        $[1] = t12;
      } else {
        t12 = $[1];
      }
      const icon = t12;
      const textColor = isSelected ? "suggestion" : undefined;
      const dimColor = !isSelected;
      const isFile = item.id.startsWith("file-");
      const isMcpResource = item.id.startsWith("mcp-resource-");
      const separatorWidth = item.description ? 3 : 0;
      let displayText;
      if (isFile) {
        let t23;
        if ($[2] !== item.description) {
          t23 = item.description ? Math.min(20, stringWidth(item.description)) : 0;
          $[2] = item.description;
          $[3] = t23;
        } else {
          t23 = $[3];
        }
        const descReserve = t23;
        const maxPathLength = columns - 2 - 4 - separatorWidth - descReserve;
        let t32;
        if ($[4] !== item.displayText || $[5] !== maxPathLength) {
          t32 = truncatePathMiddle(item.displayText, maxPathLength);
          $[4] = item.displayText;
          $[5] = maxPathLength;
          $[6] = t32;
        } else {
          t32 = $[6];
        }
        displayText = t32;
      } else {
        if (isMcpResource) {
          let t23;
          if ($[7] !== item.displayText) {
            t23 = truncateToWidth(item.displayText, 30);
            $[7] = item.displayText;
            $[8] = t23;
          } else {
            t23 = $[8];
          }
          displayText = t23;
        } else {
          displayText = item.displayText;
        }
      }
      const availableWidth = columns - 2 - stringWidth(displayText) - separatorWidth - 4;
      let lineContent;
      if (item.description) {
        const maxDescLength = Math.max(0, availableWidth);
        let t23;
        if ($[9] !== item.description || $[10] !== maxDescLength) {
          t23 = truncateToWidth(item.description.replace(/\s+/g, " "), maxDescLength);
          $[9] = item.description;
          $[10] = maxDescLength;
          $[11] = t23;
        } else {
          t23 = $[11];
        }
        const truncatedDesc = t23;
        lineContent = `${icon} ${displayText} \u2013 ${truncatedDesc}`;
      } else {
        lineContent = `${icon} ${displayText}`;
      }
      let t22;
      if ($[12] !== dimColor || $[13] !== lineContent || $[14] !== textColor) {
        t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: textColor,
          dimColor,
          wrap: "truncate",
          children: lineContent
        }, undefined, false, undefined, this);
        $[12] = dimColor;
        $[13] = lineContent;
        $[14] = textColor;
        $[15] = t22;
      } else {
        t22 = $[15];
      }
      return t22;
    }
    const maxNameWidth = Math.floor(columns * 0.4);
    const displayTextWidth = Math.min(maxColumnWidth ?? stringWidth(item.displayText) + 5, maxNameWidth);
    const textColor_0 = item.color || (isSelected ? "suggestion" : undefined);
    const shouldDim = !isSelected;
    let displayText_0 = item.displayText;
    if (stringWidth(displayText_0) > displayTextWidth - 2) {
      const t12 = displayTextWidth - 2;
      let t22;
      if ($[16] !== displayText_0 || $[17] !== t12) {
        t22 = truncateToWidth(displayText_0, t12);
        $[16] = displayText_0;
        $[17] = t12;
        $[18] = t22;
      } else {
        t22 = $[18];
      }
      displayText_0 = t22;
    }
    const paddedDisplayText = displayText_0 + " ".repeat(Math.max(0, displayTextWidth - stringWidth(displayText_0)));
    const tagText = item.tag ? `[${item.tag}] ` : "";
    const tagWidth = stringWidth(tagText);
    const descriptionWidth = Math.max(0, columns - displayTextWidth - tagWidth - 4);
    let t1;
    if ($[19] !== descriptionWidth || $[20] !== item.description) {
      t1 = item.description ? truncateToWidth(item.description.replace(/\s+/g, " "), descriptionWidth) : "";
      $[19] = descriptionWidth;
      $[20] = item.description;
      $[21] = t1;
    } else {
      t1 = $[21];
    }
    const truncatedDescription = t1;
    let t2;
    if ($[22] !== paddedDisplayText || $[23] !== shouldDim || $[24] !== textColor_0) {
      t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: textColor_0,
        dimColor: shouldDim,
        children: paddedDisplayText
      }, undefined, false, undefined, this);
      $[22] = paddedDisplayText;
      $[23] = shouldDim;
      $[24] = textColor_0;
      $[25] = t2;
    } else {
      t2 = $[25];
    }
    let t3;
    if ($[26] !== tagText) {
      t3 = tagText ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: tagText
      }, undefined, false, undefined, this) : null;
      $[26] = tagText;
      $[27] = t3;
    } else {
      t3 = $[27];
    }
    const t4 = isSelected ? "suggestion" : undefined;
    const t5 = !isSelected;
    let t6;
    if ($[28] !== t4 || $[29] !== t5 || $[30] !== truncatedDescription) {
      t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: t4,
        dimColor: t5,
        children: truncatedDescription
      }, undefined, false, undefined, this);
      $[28] = t4;
      $[29] = t5;
      $[30] = truncatedDescription;
      $[31] = t6;
    } else {
      t6 = $[31];
    }
    let t7;
    if ($[32] !== t2 || $[33] !== t3 || $[34] !== t6) {
      t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        wrap: "truncate",
        children: [
          t2,
          t3,
          t6
        ]
      }, undefined, true, undefined, this);
      $[32] = t2;
      $[33] = t3;
      $[34] = t6;
      $[35] = t7;
    } else {
      t7 = $[35];
    }
    return t7;
  });
  PromptInputFooterSuggestions_default = import_react.memo(PromptInputFooterSuggestions);
});

export { PromptInputFooterSuggestions, PromptInputFooterSuggestions_default, init_PromptInputFooterSuggestions };
