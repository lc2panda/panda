// @bun
import {
  Messages,
  init_Messages
} from "./chunk-tcraqz83.js";
import {
  SearchBox,
  init_SearchBox,
  init_useSearchInput,
  useSearchInput
} from "./chunk-00ffg8st.js";
import {
  LoadingState,
  init_LoadingState
} from "./chunk-7dq274ma.js";
import {
  Select,
  Spinner,
  TextInput,
  getAllBaseTools,
  getFirstMeaningfulUserMessageTextContent,
  getSessionIdFromLog,
  getWorktreePaths,
  init_Spinner,
  init_TextInput,
  init_getWorktreePaths,
  init_select,
  init_sessionStorage,
  init_shellQuote,
  init_sideQuery,
  init_tools1 as init_tools,
  isCustomTitleEnabled,
  isLiteLog,
  loadFullLog,
  quote,
  saveCustomTitle,
  sideQuery
} from "./chunk-ekfe4t3x.js";
import {
  Byline,
  ConfigurableShortcutHint,
  KeyboardShortcutHint,
  init_Byline,
  init_ConfigurableShortcutHint,
  init_KeyboardShortcutHint
} from "./chunk-p9ra2v2f.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-2hb5pyjj.js";
import {
  Divider,
  init_Divider,
  init_useKeybinding,
  init_useTerminalSize,
  useKeybinding,
  useTerminalSize
} from "./chunk-gypetngm.js";
import {
  ThemedBox_default,
  ThemedText,
  applyColor,
  getTheme,
  init_colorize,
  init_ink,
  init_theme,
  require_compiler_runtime,
  useTerminalFocus,
  useTheme,
  use_input_default
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  getSmallFastModel,
  init_model,
  init_source,
  source_default
} from "./chunk-w5d5b7r0.js";
import {
  count,
  init_array
} from "./chunk-xk4zgzx2.js";
import {
  formatLogMetadata,
  formatRelativeTimeAgo,
  init_format,
  init_stringWidth,
  stringWidth,
  truncateToWidth
} from "./chunk-ywhstzac.js";
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
import {
  getBranch,
  init_git
} from "./chunk-bjwxx22f.js";
import {
  getLogDisplayTitle,
  init_log,
  logError
} from "./chunk-myphr2va.js";
import {
  init_debug,
  init_slowOperations,
  jsonParse,
  logForDebugging
} from "./chunk-cv4r43rj.js";
import {
  getOriginalCwd,
  getSessionId,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/SessionPreview.tsx
function SessionPreview(t0) {
  const $ = import_compiler_runtime.c(33);
  const {
    log,
    onExit,
    onSelect
  } = t0;
  const [fullLog, setFullLog] = import_react.default.useState(null);
  let t1;
  let t2;
  if ($[0] !== log) {
    t1 = () => {
      setFullLog(null);
      if (isLiteLog(log)) {
        loadFullLog(log).then(setFullLog);
      }
    };
    t2 = [log];
    $[0] = log;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  import_react.default.useEffect(t1, t2);
  const isLoading = isLiteLog(log) && fullLog === null;
  const displayLog = fullLog ?? log;
  let t3;
  if ($[3] !== displayLog) {
    t3 = getSessionIdFromLog(displayLog) || "";
    $[3] = displayLog;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const conversationId = t3;
  let t4;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = getAllBaseTools();
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const tools = t4;
  let t5;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = {
      context: "Confirmation"
    };
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  useKeybinding("confirm:no", onExit, t5);
  let t6;
  if ($[7] !== fullLog || $[8] !== log || $[9] !== onSelect) {
    t6 = () => {
      onSelect(fullLog ?? log);
    };
    $[7] = fullLog;
    $[8] = log;
    $[9] = onSelect;
    $[10] = t6;
  } else {
    t6 = $[10];
  }
  const handleSelect = t6;
  let t7;
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = {
      context: "Confirmation"
    };
    $[11] = t7;
  } else {
    t7 = $[11];
  }
  useKeybinding("confirm:yes", handleSelect, t7);
  if (isLoading) {
    let t82;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      t82 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(LoadingState, {
        message: "Loading session\u2026"
      }, undefined, false, undefined, this);
      $[12] = t82;
    } else {
      t82 = $[12];
    }
    let t92;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      t92 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        padding: 1,
        children: [
          t82,
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
              children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[13] = t92;
    } else {
      t92 = $[13];
    }
    return t92;
  }
  let t8;
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = [];
    $[14] = t8;
  } else {
    t8 = $[14];
  }
  let t10;
  let t9;
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = [];
    t10 = new Set;
    $[15] = t10;
    $[16] = t9;
  } else {
    t10 = $[15];
    t9 = $[16];
  }
  let t11;
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    t11 = [];
    $[17] = t11;
  } else {
    t11 = $[17];
  }
  let t12;
  if ($[18] !== conversationId || $[19] !== displayLog.messages) {
    t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Messages, {
      messages: displayLog.messages,
      tools,
      commands: t8,
      verbose: true,
      toolJSX: null,
      toolUseConfirmQueue: t9,
      inProgressToolUseIDs: t10,
      isMessageSelectorVisible: false,
      conversationId,
      screen: "transcript",
      streamingToolUses: t11,
      showAllInTranscript: true,
      isLoading: false
    }, undefined, false, undefined, this);
    $[18] = conversationId;
    $[19] = displayLog.messages;
    $[20] = t12;
  } else {
    t12 = $[20];
  }
  let t13;
  if ($[21] !== displayLog.modified) {
    t13 = formatRelativeTimeAgo(displayLog.modified);
    $[21] = displayLog.modified;
    $[22] = t13;
  } else {
    t13 = $[22];
  }
  const t14 = displayLog.gitBranch ? ` \xB7 ${displayLog.gitBranch}` : "";
  let t15;
  if ($[23] !== displayLog.messageCount || $[24] !== t13 || $[25] !== t14) {
    t15 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        t13,
        " \xB7",
        " ",
        displayLog.messageCount,
        " messages",
        t14
      ]
    }, undefined, true, undefined, this);
    $[23] = displayLog.messageCount;
    $[24] = t13;
    $[25] = t14;
    $[26] = t15;
  } else {
    t15 = $[26];
  }
  let t16;
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    t16 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
            shortcut: "Enter",
            action: "resume"
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
    $[27] = t16;
  } else {
    t16 = $[27];
  }
  let t17;
  if ($[28] !== t15) {
    t17 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexShrink: 0,
      flexDirection: "column",
      borderTopDimColor: true,
      borderBottom: false,
      borderLeft: false,
      borderRight: false,
      borderStyle: "single",
      paddingLeft: 2,
      children: [
        t15,
        t16
      ]
    }, undefined, true, undefined, this);
    $[28] = t15;
    $[29] = t17;
  } else {
    t17 = $[29];
  }
  let t18;
  if ($[30] !== t12 || $[31] !== t17) {
    t18 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t12,
        t17
      ]
    }, undefined, true, undefined, this);
    $[30] = t12;
    $[31] = t17;
    $[32] = t18;
  } else {
    t18 = $[32];
  }
  return t18;
}
var import_compiler_runtime, import_react, jsx_dev_runtime;
var init_SessionPreview = __esm(() => {
  init_ink();
  init_useKeybinding();
  init_tools();
  init_format();
  init_sessionStorage();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_LoadingState();
  init_Messages();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/TagTabs.tsx
function getTabWidth(tab, maxWidth) {
  if (tab === ALL_TAB_LABEL) {
    return ALL_TAB_LABEL.length + TAB_PADDING;
  }
  const tagWidth = stringWidth(tab);
  const effectiveTagWidth = maxWidth ? Math.min(tagWidth, maxWidth - TAB_PADDING - HASH_PREFIX_LENGTH) : tagWidth;
  return Math.max(0, effectiveTagWidth) + TAB_PADDING + HASH_PREFIX_LENGTH;
}
function truncateTag(tag, maxWidth) {
  const availableForTag = maxWidth - TAB_PADDING - HASH_PREFIX_LENGTH;
  if (stringWidth(tag) <= availableForTag) {
    return tag;
  }
  if (availableForTag <= 1) {
    return tag.charAt(0);
  }
  return truncateToWidth(tag, availableForTag);
}
function TagTabs({
  tabs,
  selectedIndex,
  availableWidth,
  showAllProjects = false
}) {
  const resumeLabel = showAllProjects ? "Resume (All Projects)" : "Resume";
  const resumeLabelWidth = resumeLabel.length + 1;
  const rightHintWidth = Math.max(RIGHT_HINT_WIDTH_WITH_COUNT, RIGHT_HINT_WIDTH_NO_COUNT);
  const maxTabsWidth = availableWidth - resumeLabelWidth - rightHintWidth - 2;
  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, tabs.length - 1));
  const maxSingleTabWidth = Math.max(20, Math.floor(maxTabsWidth / 2));
  const tabWidths = tabs.map((tab) => getTabWidth(tab, maxSingleTabWidth));
  let startIndex = 0;
  let endIndex = tabs.length;
  const totalTabsWidth = tabWidths.reduce((sum, w, i) => sum + w + (i < tabWidths.length - 1 ? 1 : 0), 0);
  if (totalTabsWidth > maxTabsWidth) {
    const effectiveMaxWidth = maxTabsWidth - LEFT_ARROW_WIDTH;
    let windowWidth = tabWidths[safeSelectedIndex] ?? 0;
    startIndex = safeSelectedIndex;
    endIndex = safeSelectedIndex + 1;
    while (startIndex > 0 || endIndex < tabs.length) {
      const canExpandLeft = startIndex > 0;
      const canExpandRight = endIndex < tabs.length;
      if (canExpandLeft) {
        const leftWidth = (tabWidths[startIndex - 1] ?? 0) + 1;
        if (windowWidth + leftWidth <= effectiveMaxWidth) {
          startIndex--;
          windowWidth += leftWidth;
          continue;
        }
      }
      if (canExpandRight) {
        const rightWidth = (tabWidths[endIndex] ?? 0) + 1;
        if (windowWidth + rightWidth <= effectiveMaxWidth) {
          endIndex++;
          windowWidth += rightWidth;
          continue;
        }
      }
      break;
    }
  }
  const hiddenLeft = startIndex;
  const hiddenRight = tabs.length - endIndex;
  const visibleTabs = tabs.slice(startIndex, endIndex);
  const visibleIndices = visibleTabs.map((_, i_0) => startIndex + i_0);
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    flexDirection: "row",
    gap: 1,
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        color: "suggestion",
        children: resumeLabel
      }, undefined, false, undefined, this),
      hiddenLeft > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          LEFT_ARROW_PREFIX,
          hiddenLeft
        ]
      }, undefined, true, undefined, this),
      visibleTabs.map((tab_0, i_1) => {
        const actualIndex = visibleIndices[i_1];
        const isSelected = actualIndex === safeSelectedIndex;
        const displayText = tab_0 === ALL_TAB_LABEL ? tab_0 : `#${truncateTag(tab_0, maxSingleTabWidth - TAB_PADDING)}`;
        return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          backgroundColor: isSelected ? "suggestion" : undefined,
          color: isSelected ? "inverseText" : undefined,
          bold: isSelected,
          children: [
            " ",
            displayText,
            " "
          ]
        }, tab_0, true, undefined, this);
      }),
      hiddenRight > 0 ? /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          RIGHT_HINT_WITH_COUNT_PREFIX,
          hiddenRight,
          RIGHT_HINT_SUFFIX
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: RIGHT_HINT_NO_COUNT
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var jsx_dev_runtime2, ALL_TAB_LABEL = "All", TAB_PADDING = 2, HASH_PREFIX_LENGTH = 1, LEFT_ARROW_PREFIX = "\u2190 ", RIGHT_HINT_WITH_COUNT_PREFIX = "\u2192", RIGHT_HINT_SUFFIX = " (tab to cycle)", RIGHT_HINT_NO_COUNT = "(tab to cycle)", MAX_OVERFLOW_DIGITS = 2, LEFT_ARROW_WIDTH, RIGHT_HINT_WIDTH_WITH_COUNT, RIGHT_HINT_WIDTH_NO_COUNT;
var init_TagTabs = __esm(() => {
  init_stringWidth();
  init_ink();
  init_format();
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
  LEFT_ARROW_WIDTH = LEFT_ARROW_PREFIX.length + MAX_OVERFLOW_DIGITS + 1;
  RIGHT_HINT_WIDTH_WITH_COUNT = RIGHT_HINT_WITH_COUNT_PREFIX.length + MAX_OVERFLOW_DIGITS + RIGHT_HINT_SUFFIX.length;
  RIGHT_HINT_WIDTH_NO_COUNT = RIGHT_HINT_NO_COUNT.length;
});

// src/components/ui/TreeSelect.tsx
function TreeSelect(t0) {
  const $ = import_compiler_runtime2.c(48);
  const {
    nodes,
    onSelect,
    onCancel,
    onFocus,
    focusNodeId,
    visibleOptionCount,
    layout: t1,
    isDisabled: t2,
    hideIndexes: t3,
    isNodeExpanded,
    onExpand,
    onCollapse,
    getParentPrefix,
    getChildPrefix,
    onUpFromFirstItem
  } = t0;
  const layout = t1 === undefined ? "expanded" : t1;
  const isDisabled = t2 === undefined ? false : t2;
  const hideIndexes = t3 === undefined ? false : t3;
  let t4;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = new Set;
    $[0] = t4;
  } else {
    t4 = $[0];
  }
  const [internalExpandedIds, setInternalExpandedIds] = import_react2.default.useState(t4);
  const isProgrammaticFocusRef = import_react2.default.useRef(false);
  const lastFocusedIdRef = import_react2.default.useRef(null);
  let t5;
  if ($[1] !== internalExpandedIds || $[2] !== isNodeExpanded) {
    t5 = (nodeId) => {
      if (isNodeExpanded) {
        return isNodeExpanded(nodeId);
      }
      return internalExpandedIds.has(nodeId);
    };
    $[1] = internalExpandedIds;
    $[2] = isNodeExpanded;
    $[3] = t5;
  } else {
    t5 = $[3];
  }
  const isExpanded = t5;
  let result;
  if ($[4] !== isExpanded || $[5] !== nodes) {
    let traverse = function(node, depth, parentId) {
      const hasChildren = !!node.children && node.children.length > 0;
      const nodeIsExpanded = isExpanded(node.id);
      result.push({
        node,
        depth,
        isExpanded: nodeIsExpanded,
        hasChildren,
        parentId
      });
      if (hasChildren && nodeIsExpanded && node.children) {
        for (const child of node.children) {
          traverse(child, depth + 1, node.id);
        }
      }
    };
    result = [];
    for (const node_0 of nodes) {
      traverse(node_0, 0, undefined);
    }
    $[4] = isExpanded;
    $[5] = nodes;
    $[6] = result;
  } else {
    result = $[6];
  }
  const flattenedNodes = result;
  const defaultGetParentPrefix = _temp;
  const defaultGetChildPrefix = _temp2;
  const parentPrefixFn = getParentPrefix ?? defaultGetParentPrefix;
  const childPrefixFn = getChildPrefix ?? defaultGetChildPrefix;
  let t6;
  if ($[7] !== childPrefixFn || $[8] !== parentPrefixFn) {
    t6 = (flatNode) => {
      let prefix = "";
      if (flatNode.hasChildren) {
        prefix = parentPrefixFn(flatNode.isExpanded);
      } else {
        if (flatNode.depth > 0) {
          prefix = childPrefixFn(flatNode.depth);
        }
      }
      return prefix + flatNode.node.label;
    };
    $[7] = childPrefixFn;
    $[8] = parentPrefixFn;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  const buildLabel = t6;
  let t7;
  if ($[10] !== buildLabel || $[11] !== flattenedNodes) {
    t7 = flattenedNodes.map((flatNode_0) => ({
      label: buildLabel(flatNode_0),
      description: flatNode_0.node.description,
      dimDescription: flatNode_0.node.dimDescription ?? true,
      value: flatNode_0.node.id
    }));
    $[10] = buildLabel;
    $[11] = flattenedNodes;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  const options = t7;
  let map;
  if ($[13] !== flattenedNodes) {
    map = new Map;
    flattenedNodes.forEach((fn) => map.set(fn.node.id, fn.node));
    $[13] = flattenedNodes;
    $[14] = map;
  } else {
    map = $[14];
  }
  const nodeMap = map;
  let t8;
  if ($[15] !== flattenedNodes) {
    t8 = (nodeId_0) => flattenedNodes.find((fn_0) => fn_0.node.id === nodeId_0);
    $[15] = flattenedNodes;
    $[16] = t8;
  } else {
    t8 = $[16];
  }
  const findFlattenedNode = t8;
  let t9;
  if ($[17] !== findFlattenedNode || $[18] !== onCollapse || $[19] !== onExpand) {
    t9 = (nodeId_1, shouldExpand) => {
      const flatNode_1 = findFlattenedNode(nodeId_1);
      if (!flatNode_1 || !flatNode_1.hasChildren) {
        return;
      }
      if (shouldExpand) {
        if (onExpand) {
          onExpand(nodeId_1);
        } else {
          setInternalExpandedIds((prev) => new Set(prev).add(nodeId_1));
        }
      } else {
        if (onCollapse) {
          onCollapse(nodeId_1);
        } else {
          setInternalExpandedIds((prev_0) => {
            const newSet = new Set(prev_0);
            newSet.delete(nodeId_1);
            return newSet;
          });
        }
      }
    };
    $[17] = findFlattenedNode;
    $[18] = onCollapse;
    $[19] = onExpand;
    $[20] = t9;
  } else {
    t9 = $[20];
  }
  const toggleExpand = t9;
  let t10;
  if ($[21] !== findFlattenedNode || $[22] !== focusNodeId || $[23] !== isDisabled || $[24] !== nodeMap || $[25] !== onFocus || $[26] !== toggleExpand) {
    t10 = (e) => {
      if (!focusNodeId || isDisabled) {
        return;
      }
      const flatNode_2 = findFlattenedNode(focusNodeId);
      if (!flatNode_2) {
        return;
      }
      if (e.key === "right" && flatNode_2.hasChildren) {
        e.preventDefault();
        toggleExpand(focusNodeId, true);
      } else {
        if (e.key === "left") {
          if (flatNode_2.hasChildren && flatNode_2.isExpanded) {
            e.preventDefault();
            toggleExpand(focusNodeId, false);
          } else {
            if (flatNode_2.parentId !== undefined) {
              e.preventDefault();
              isProgrammaticFocusRef.current = true;
              toggleExpand(flatNode_2.parentId, false);
              if (onFocus) {
                const parentNode = nodeMap.get(flatNode_2.parentId);
                if (parentNode) {
                  onFocus(parentNode);
                }
              }
            }
          }
        }
      }
    };
    $[21] = findFlattenedNode;
    $[22] = focusNodeId;
    $[23] = isDisabled;
    $[24] = nodeMap;
    $[25] = onFocus;
    $[26] = toggleExpand;
    $[27] = t10;
  } else {
    t10 = $[27];
  }
  const handleKeyDown = t10;
  let t11;
  if ($[28] !== nodeMap || $[29] !== onSelect) {
    t11 = (nodeId_2) => {
      const node_1 = nodeMap.get(nodeId_2);
      if (!node_1) {
        return;
      }
      onSelect(node_1);
    };
    $[28] = nodeMap;
    $[29] = onSelect;
    $[30] = t11;
  } else {
    t11 = $[30];
  }
  const handleChange = t11;
  let t12;
  if ($[31] !== nodeMap || $[32] !== onFocus) {
    t12 = (nodeId_3) => {
      if (isProgrammaticFocusRef.current) {
        isProgrammaticFocusRef.current = false;
        return;
      }
      if (lastFocusedIdRef.current === nodeId_3) {
        return;
      }
      lastFocusedIdRef.current = nodeId_3;
      if (onFocus) {
        const node_2 = nodeMap.get(nodeId_3);
        if (node_2) {
          onFocus(node_2);
        }
      }
    };
    $[31] = nodeMap;
    $[32] = onFocus;
    $[33] = t12;
  } else {
    t12 = $[33];
  }
  const handleFocus = t12;
  let t13;
  if ($[34] !== focusNodeId || $[35] !== handleChange || $[36] !== handleFocus || $[37] !== hideIndexes || $[38] !== isDisabled || $[39] !== layout || $[40] !== onCancel || $[41] !== onUpFromFirstItem || $[42] !== options || $[43] !== visibleOptionCount) {
    t13 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Select, {
      options,
      onChange: handleChange,
      onFocus: handleFocus,
      onCancel,
      defaultFocusValue: focusNodeId,
      visibleOptionCount,
      layout,
      isDisabled,
      hideIndexes,
      onUpFromFirstItem
    }, undefined, false, undefined, this);
    $[34] = focusNodeId;
    $[35] = handleChange;
    $[36] = handleFocus;
    $[37] = hideIndexes;
    $[38] = isDisabled;
    $[39] = layout;
    $[40] = onCancel;
    $[41] = onUpFromFirstItem;
    $[42] = options;
    $[43] = visibleOptionCount;
    $[44] = t13;
  } else {
    t13 = $[44];
  }
  let t14;
  if ($[45] !== handleKeyDown || $[46] !== t13) {
    t14 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: t13
    }, undefined, false, undefined, this);
    $[45] = handleKeyDown;
    $[46] = t13;
    $[47] = t14;
  } else {
    t14 = $[47];
  }
  return t14;
}
function _temp2(_depth) {
  return "  \u25B8 ";
}
function _temp(isExpanded_0) {
  return isExpanded_0 ? "\u25BC " : "\u25B6 ";
}
var import_compiler_runtime2, import_react2, jsx_dev_runtime3;
var init_TreeSelect = __esm(() => {
  init_ink();
  init_select();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/LogSelector.tsx
function normalizeAndTruncateToWidth(text, maxWidth) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return truncateToWidth(normalized, maxWidth);
}
function formatSnippet({
  before,
  match,
  after
}, highlightColor) {
  return source_default.dim(before) + highlightColor(match) + source_default.dim(after);
}
function extractSnippet(text, query, contextChars) {
  const matchIndex = text.toLowerCase().indexOf(query.toLowerCase());
  if (matchIndex === -1)
    return null;
  const matchEnd = matchIndex + query.length;
  const snippetStart = Math.max(0, matchIndex - contextChars);
  const snippetEnd = Math.min(text.length, matchEnd + contextChars);
  const beforeRaw = text.slice(snippetStart, matchIndex);
  const matchText = text.slice(matchIndex, matchEnd);
  const afterRaw = text.slice(matchEnd, snippetEnd);
  return {
    before: (snippetStart > 0 ? "\u2026" : "") + beforeRaw.replace(/\s+/g, " ").trimStart(),
    match: matchText.trim(),
    after: afterRaw.replace(/\s+/g, " ").trimEnd() + (snippetEnd < text.length ? "\u2026" : "")
  };
}
function buildLogLabel(log, maxLabelWidth, options) {
  const {
    isGroupHeader = false,
    isChild = false,
    forkCount = 0
  } = options || {};
  const prefixWidth = isGroupHeader && forkCount > 0 ? PARENT_PREFIX_WIDTH : isChild ? CHILD_PREFIX_WIDTH : 0;
  const sessionCountSuffix = isGroupHeader && forkCount > 0 ? ` (+${forkCount} other ${forkCount === 1 ? "session" : "sessions"})` : "";
  const sidechainSuffix = log.isSidechain ? " (sidechain)" : "";
  const maxSummaryWidth = maxLabelWidth - prefixWidth - sidechainSuffix.length - sessionCountSuffix.length;
  const truncatedSummary = normalizeAndTruncateToWidth(getLogDisplayTitle(log), maxSummaryWidth);
  return `${truncatedSummary}${sidechainSuffix}${sessionCountSuffix}`;
}
function buildLogMetadata(log, options) {
  const {
    isChild = false,
    showProjectPath = false
  } = options || {};
  const childPadding = isChild ? "    " : "";
  const baseMetadata = formatLogMetadata(log);
  const projectSuffix = showProjectPath && log.projectPath ? ` \xB7 ${log.projectPath}` : "";
  return childPadding + baseMetadata + projectSuffix;
}
function LogSelector(t0) {
  const $ = import_compiler_runtime3.c(247);
  const {
    logs,
    maxHeight: t1,
    forceWidth,
    onCancel,
    onSelect,
    onLogsChanged,
    onLoadMore,
    initialSearchQuery,
    showAllProjects: t2,
    onToggleAllProjects,
    onAgenticSearch
  } = t0;
  const maxHeight = t1 === undefined ? Infinity : t1;
  const showAllProjects = t2 === undefined ? false : t2;
  const terminalSize = useTerminalSize();
  const columns = forceWidth === undefined ? terminalSize.columns : forceWidth;
  const exitState = useExitOnCtrlCDWithKeybindings(onCancel);
  const isTerminalFocused = useTerminalFocus();
  let t3;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = isCustomTitleEnabled();
    $[0] = t3;
  } else {
    t3 = $[0];
  }
  const isResumeWithRenameEnabled = t3;
  const isDeepSearchEnabled = false;
  const [themeName] = useTheme();
  let t4;
  if ($[1] !== themeName) {
    t4 = getTheme(themeName);
    $[1] = themeName;
    $[2] = t4;
  } else {
    t4 = $[2];
  }
  const theme = t4;
  let t5;
  if ($[3] !== theme.warning) {
    t5 = (text) => applyColor(text, theme.warning);
    $[3] = theme.warning;
    $[4] = t5;
  } else {
    t5 = $[4];
  }
  const highlightColor = t5;
  const isAgenticSearchEnabled = false;
  const [currentBranch, setCurrentBranch] = import_react3.default.useState(null);
  const [branchFilterEnabled, setBranchFilterEnabled] = import_react3.default.useState(false);
  const [showAllWorktrees, setShowAllWorktrees] = import_react3.default.useState(false);
  const [hasMultipleWorktrees, setHasMultipleWorktrees] = import_react3.default.useState(false);
  let t6;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = getOriginalCwd();
    $[5] = t6;
  } else {
    t6 = $[5];
  }
  const currentCwd = t6;
  const [renameValue, setRenameValue] = import_react3.default.useState("");
  const [renameCursorOffset, setRenameCursorOffset] = import_react3.default.useState(0);
  let t7;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = new Set;
    $[6] = t7;
  } else {
    t7 = $[6];
  }
  const [expandedGroupSessionIds, setExpandedGroupSessionIds] = import_react3.default.useState(t7);
  const [focusedNode, setFocusedNode] = import_react3.default.useState(null);
  const [focusedIndex, setFocusedIndex] = import_react3.default.useState(1);
  const [viewMode, setViewMode] = import_react3.default.useState("list");
  const [previewLog, setPreviewLog] = import_react3.default.useState(null);
  const prevFocusedIdRef = import_react3.default.useRef(null);
  const [selectedTagIndex, setSelectedTagIndex] = import_react3.default.useState(0);
  let t8;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = {
      status: "idle"
    };
    $[7] = t8;
  } else {
    t8 = $[7];
  }
  const [agenticSearchState, setAgenticSearchState] = import_react3.default.useState(t8);
  const [isAgenticSearchOptionFocused, setIsAgenticSearchOptionFocused] = import_react3.default.useState(false);
  const agenticSearchAbortRef = import_react3.default.useRef(null);
  const t9 = viewMode === "search" && agenticSearchState.status !== "searching";
  let t10;
  let t11;
  let t12;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = () => {
      setViewMode("list");
      logEvent("tengu_session_search_toggled", {
        enabled: false
      });
    };
    t11 = () => {
      setViewMode("list");
      logEvent("tengu_session_search_toggled", {
        enabled: false
      });
    };
    t12 = ["n"];
    $[8] = t10;
    $[9] = t11;
    $[10] = t12;
  } else {
    t10 = $[8];
    t11 = $[9];
    t12 = $[10];
  }
  const t13 = initialSearchQuery || "";
  let t14;
  if ($[11] !== t13 || $[12] !== t9) {
    t14 = {
      isActive: t9,
      onExit: t10,
      onExitUp: t11,
      passthroughCtrlKeys: t12,
      initialQuery: t13
    };
    $[11] = t13;
    $[12] = t9;
    $[13] = t14;
  } else {
    t14 = $[13];
  }
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    cursorOffset: searchCursorOffset
  } = useSearchInput(t14);
  const deferredSearchQuery = import_react3.default.useDeferredValue(searchQuery);
  const [debouncedDeepSearchQuery, setDebouncedDeepSearchQuery] = import_react3.default.useState("");
  let t15;
  let t16;
  if ($[14] !== deferredSearchQuery) {
    t15 = () => {
      if (!deferredSearchQuery) {
        setDebouncedDeepSearchQuery("");
        return;
      }
      const timeoutId = setTimeout(setDebouncedDeepSearchQuery, 300, deferredSearchQuery);
      return () => clearTimeout(timeoutId);
    };
    t16 = [deferredSearchQuery];
    $[14] = deferredSearchQuery;
    $[15] = t15;
    $[16] = t16;
  } else {
    t15 = $[15];
    t16 = $[16];
  }
  import_react3.default.useEffect(t15, t16);
  const [deepSearchResults, setDeepSearchResults] = import_react3.default.useState(null);
  const [isSearching, setIsSearching] = import_react3.default.useState(false);
  let t17;
  let t18;
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    t17 = () => {
      getBranch().then((branch) => setCurrentBranch(branch));
      getWorktreePaths(currentCwd).then((paths) => {
        setHasMultipleWorktrees(paths.length > 1);
      });
    };
    t18 = [currentCwd];
    $[17] = t17;
    $[18] = t18;
  } else {
    t17 = $[17];
    t18 = $[18];
  }
  import_react3.default.useEffect(t17, t18);
  const searchableTextByLog = new Map(logs.map(_temp8));
  let t19;
  t19 = null;
  let t20;
  if ($[19] !== logs) {
    t20 = getUniqueTags(logs);
    $[19] = logs;
    $[20] = t20;
  } else {
    t20 = $[20];
  }
  const uniqueTags = t20;
  const hasTags = uniqueTags.length > 0;
  let t21;
  if ($[21] !== hasTags || $[22] !== uniqueTags) {
    t21 = hasTags ? ["All", ...uniqueTags] : [];
    $[21] = hasTags;
    $[22] = uniqueTags;
    $[23] = t21;
  } else {
    t21 = $[23];
  }
  const tagTabs = t21;
  const effectiveTagIndex = tagTabs.length > 0 && selectedTagIndex < tagTabs.length ? selectedTagIndex : 0;
  const selectedTab = tagTabs[effectiveTagIndex];
  const tagFilter = selectedTab === "All" ? undefined : selectedTab;
  const tagTabsLines = hasTags ? 1 : 0;
  let filtered = logs;
  if (isResumeWithRenameEnabled) {
    let t222;
    if ($[24] !== logs) {
      t222 = logs.filter(_temp22);
      $[24] = logs;
      $[25] = t222;
    } else {
      t222 = $[25];
    }
    filtered = t222;
  }
  if (tagFilter !== undefined) {
    let t222;
    if ($[26] !== filtered || $[27] !== tagFilter) {
      let t232;
      if ($[29] !== tagFilter) {
        t232 = (log_2) => log_2.tag === tagFilter;
        $[29] = tagFilter;
        $[30] = t232;
      } else {
        t232 = $[30];
      }
      t222 = filtered.filter(t232);
      $[26] = filtered;
      $[27] = tagFilter;
      $[28] = t222;
    } else {
      t222 = $[28];
    }
    filtered = t222;
  }
  if (branchFilterEnabled && currentBranch) {
    let t222;
    if ($[31] !== currentBranch || $[32] !== filtered) {
      let t232;
      if ($[34] !== currentBranch) {
        t232 = (log_3) => log_3.gitBranch === currentBranch;
        $[34] = currentBranch;
        $[35] = t232;
      } else {
        t232 = $[35];
      }
      t222 = filtered.filter(t232);
      $[31] = currentBranch;
      $[32] = filtered;
      $[33] = t222;
    } else {
      t222 = $[33];
    }
    filtered = t222;
  }
  if (hasMultipleWorktrees && !showAllWorktrees) {
    let t222;
    if ($[36] !== filtered) {
      let t232;
      if ($[38] === Symbol.for("react.memo_cache_sentinel")) {
        t232 = (log_4) => log_4.projectPath === currentCwd;
        $[38] = t232;
      } else {
        t232 = $[38];
      }
      t222 = filtered.filter(t232);
      $[36] = filtered;
      $[37] = t222;
    } else {
      t222 = $[37];
    }
    filtered = t222;
  }
  const baseFilteredLogs = filtered;
  let t22;
  bb0: {
    if (!searchQuery) {
      t22 = baseFilteredLogs;
      break bb0;
    }
    let t232;
    if ($[39] !== baseFilteredLogs || $[40] !== searchQuery) {
      const query = searchQuery.toLowerCase();
      t232 = baseFilteredLogs.filter((log_5) => {
        const displayedTitle = getLogDisplayTitle(log_5).toLowerCase();
        const branch_0 = (log_5.gitBranch || "").toLowerCase();
        const tag = (log_5.tag || "").toLowerCase();
        const prInfo = log_5.prNumber ? `pr #${log_5.prNumber} ${log_5.prRepository || ""}`.toLowerCase() : "";
        return displayedTitle.includes(query) || branch_0.includes(query) || tag.includes(query) || prInfo.includes(query);
      });
      $[39] = baseFilteredLogs;
      $[40] = searchQuery;
      $[41] = t232;
    } else {
      t232 = $[41];
    }
    t22 = t232;
  }
  const titleFilteredLogs = t22;
  let t23;
  let t24;
  if ($[42] !== debouncedDeepSearchQuery || $[43] !== deferredSearchQuery) {
    t23 = () => {
      if (false) {}
    };
    t24 = [deferredSearchQuery, debouncedDeepSearchQuery, false];
    $[42] = debouncedDeepSearchQuery;
    $[43] = deferredSearchQuery;
    $[44] = t23;
    $[45] = t24;
  } else {
    t23 = $[44];
    t24 = $[45];
  }
  import_react3.default.useEffect(t23, t24);
  let t25;
  let t26;
  if ($[46] !== debouncedDeepSearchQuery) {
    t25 = () => {
      if (true) {
        setDeepSearchResults(null);
        setIsSearching(false);
        return;
      }
      const timeoutId_0 = setTimeout(_temp5, 0, null, debouncedDeepSearchQuery, setDeepSearchResults, setIsSearching);
      return () => {
        clearTimeout(timeoutId_0);
      };
    };
    t26 = [debouncedDeepSearchQuery, null, false];
    $[46] = debouncedDeepSearchQuery;
    $[47] = t25;
    $[48] = t26;
  } else {
    t25 = $[47];
    t26 = $[48];
  }
  import_react3.default.useEffect(t25, t26);
  let filtered_0;
  let snippetMap;
  if ($[49] !== debouncedDeepSearchQuery || $[50] !== deepSearchResults || $[51] !== titleFilteredLogs) {
    snippetMap = new Map;
    filtered_0 = titleFilteredLogs;
    if (deepSearchResults && debouncedDeepSearchQuery && deepSearchResults.query === debouncedDeepSearchQuery) {
      for (const result of deepSearchResults.results) {
        if (result.searchableText) {
          const snippet = extractSnippet(result.searchableText, debouncedDeepSearchQuery, SNIPPET_CONTEXT_CHARS);
          if (snippet) {
            snippetMap.set(result.log, snippet);
          }
        }
      }
      let t272;
      if ($[54] !== filtered_0) {
        t272 = new Set(filtered_0.map(_temp6));
        $[54] = filtered_0;
        $[55] = t272;
      } else {
        t272 = $[55];
      }
      const titleMatchIds = t272;
      let t282;
      if ($[56] !== deepSearchResults.results || $[57] !== filtered_0 || $[58] !== titleMatchIds) {
        let t292;
        if ($[60] !== titleMatchIds) {
          t292 = (log_7) => !titleMatchIds.has(log_7.messages[0]?.uuid);
          $[60] = titleMatchIds;
          $[61] = t292;
        } else {
          t292 = $[61];
        }
        const transcriptOnlyMatches = deepSearchResults.results.map(_temp7).filter(t292);
        t282 = [...filtered_0, ...transcriptOnlyMatches];
        $[56] = deepSearchResults.results;
        $[57] = filtered_0;
        $[58] = titleMatchIds;
        $[59] = t282;
      } else {
        t282 = $[59];
      }
      filtered_0 = t282;
    }
    $[49] = debouncedDeepSearchQuery;
    $[50] = deepSearchResults;
    $[51] = titleFilteredLogs;
    $[52] = filtered_0;
    $[53] = snippetMap;
  } else {
    filtered_0 = $[52];
    snippetMap = $[53];
  }
  let t27;
  if ($[62] !== filtered_0 || $[63] !== snippetMap) {
    t27 = {
      filteredLogs: filtered_0,
      snippets: snippetMap
    };
    $[62] = filtered_0;
    $[63] = snippetMap;
    $[64] = t27;
  } else {
    t27 = $[64];
  }
  const {
    filteredLogs,
    snippets
  } = t27;
  let t28;
  bb1: {
    if (agenticSearchState.status === "results" && agenticSearchState.results.length > 0) {
      t28 = agenticSearchState.results;
      break bb1;
    }
    t28 = filteredLogs;
  }
  const displayedLogs = t28;
  const maxLabelWidth = Math.max(30, columns - 4);
  let t29;
  bb2: {
    if (!isResumeWithRenameEnabled) {
      let t303;
      if ($[65] === Symbol.for("react.memo_cache_sentinel")) {
        t303 = [];
        $[65] = t303;
      } else {
        t303 = $[65];
      }
      t29 = t303;
      break bb2;
    }
    let t302;
    if ($[66] !== displayedLogs || $[67] !== highlightColor || $[68] !== maxLabelWidth || $[69] !== showAllProjects || $[70] !== snippets) {
      const sessionGroups = groupLogsBySessionId(displayedLogs);
      t302 = Array.from(sessionGroups.entries()).map((t312) => {
        const [sessionId, groupLogs] = t312;
        const latestLog = groupLogs[0];
        const indexInFiltered = displayedLogs.indexOf(latestLog);
        const snippet_0 = snippets.get(latestLog);
        const snippetStr = snippet_0 ? formatSnippet(snippet_0, highlightColor) : null;
        if (groupLogs.length === 1) {
          const metadata = buildLogMetadata(latestLog, {
            showProjectPath: showAllProjects
          });
          return {
            id: `log:${sessionId}:0`,
            value: {
              log: latestLog,
              indexInFiltered
            },
            label: buildLogLabel(latestLog, maxLabelWidth),
            description: snippetStr ? `${metadata}
  ${snippetStr}` : metadata,
            dimDescription: true
          };
        }
        const forkCount = groupLogs.length - 1;
        const children = groupLogs.slice(1).map((log_8, index) => {
          const childIndexInFiltered = displayedLogs.indexOf(log_8);
          const childSnippet = snippets.get(log_8);
          const childSnippetStr = childSnippet ? formatSnippet(childSnippet, highlightColor) : null;
          const childMetadata = buildLogMetadata(log_8, {
            isChild: true,
            showProjectPath: showAllProjects
          });
          return {
            id: `log:${sessionId}:${index + 1}`,
            value: {
              log: log_8,
              indexInFiltered: childIndexInFiltered
            },
            label: buildLogLabel(log_8, maxLabelWidth, {
              isChild: true
            }),
            description: childSnippetStr ? `${childMetadata}
      ${childSnippetStr}` : childMetadata,
            dimDescription: true
          };
        });
        const parentMetadata = buildLogMetadata(latestLog, {
          showProjectPath: showAllProjects
        });
        return {
          id: `group:${sessionId}`,
          value: {
            log: latestLog,
            indexInFiltered
          },
          label: buildLogLabel(latestLog, maxLabelWidth, {
            isGroupHeader: true,
            forkCount
          }),
          description: snippetStr ? `${parentMetadata}
  ${snippetStr}` : parentMetadata,
          dimDescription: true,
          children
        };
      });
      $[66] = displayedLogs;
      $[67] = highlightColor;
      $[68] = maxLabelWidth;
      $[69] = showAllProjects;
      $[70] = snippets;
      $[71] = t302;
    } else {
      t302 = $[71];
    }
    t29 = t302;
  }
  const treeNodes = t29;
  let t30;
  bb3: {
    if (isResumeWithRenameEnabled) {
      let t313;
      if ($[72] === Symbol.for("react.memo_cache_sentinel")) {
        t313 = [];
        $[72] = t313;
      } else {
        t313 = $[72];
      }
      t30 = t313;
      break bb3;
    }
    let t312;
    if ($[73] !== displayedLogs || $[74] !== highlightColor || $[75] !== maxLabelWidth || $[76] !== showAllProjects || $[77] !== snippets) {
      let t322;
      if ($[79] !== highlightColor || $[80] !== maxLabelWidth || $[81] !== showAllProjects || $[82] !== snippets) {
        t322 = (log_9, index_0) => {
          const rawSummary = getLogDisplayTitle(log_9);
          const summaryWithSidechain = rawSummary + (log_9.isSidechain ? " (sidechain)" : "");
          const summary = normalizeAndTruncateToWidth(summaryWithSidechain, maxLabelWidth);
          const baseDescription = formatLogMetadata(log_9);
          const projectSuffix = showAllProjects && log_9.projectPath ? ` \xB7 ${log_9.projectPath}` : "";
          const snippet_1 = snippets.get(log_9);
          const snippetStr_0 = snippet_1 ? formatSnippet(snippet_1, highlightColor) : null;
          return {
            label: summary,
            description: snippetStr_0 ? `${baseDescription}${projectSuffix}
  ${snippetStr_0}` : baseDescription + projectSuffix,
            dimDescription: true,
            value: index_0.toString()
          };
        };
        $[79] = highlightColor;
        $[80] = maxLabelWidth;
        $[81] = showAllProjects;
        $[82] = snippets;
        $[83] = t322;
      } else {
        t322 = $[83];
      }
      t312 = displayedLogs.map(t322);
      $[73] = displayedLogs;
      $[74] = highlightColor;
      $[75] = maxLabelWidth;
      $[76] = showAllProjects;
      $[77] = snippets;
      $[78] = t312;
    } else {
      t312 = $[78];
    }
    t30 = t312;
  }
  const flatOptions = t30;
  const focusedLog = focusedNode?.value.log ?? null;
  let t31;
  if ($[84] !== displayedLogs || $[85] !== expandedGroupSessionIds || $[86] !== focusedLog) {
    t31 = () => {
      if (!isResumeWithRenameEnabled || !focusedLog) {
        return "";
      }
      const sessionId_0 = getSessionIdFromLog(focusedLog);
      if (!sessionId_0) {
        return "";
      }
      const sessionLogs = displayedLogs.filter((log_10) => getSessionIdFromLog(log_10) === sessionId_0);
      const hasMultipleLogs = sessionLogs.length > 1;
      if (!hasMultipleLogs) {
        return "";
      }
      const isExpanded = expandedGroupSessionIds.has(sessionId_0);
      const isChildNode = sessionLogs.indexOf(focusedLog) > 0;
      if (isChildNode) {
        return "\u2190 to collapse";
      }
      return isExpanded ? "\u2190 to collapse" : "\u2192 to expand";
    };
    $[84] = displayedLogs;
    $[85] = expandedGroupSessionIds;
    $[86] = focusedLog;
    $[87] = t31;
  } else {
    t31 = $[87];
  }
  const getExpandCollapseHint = t31;
  let t32;
  if ($[88] !== focusedLog || $[89] !== onLogsChanged || $[90] !== renameValue) {
    t32 = async () => {
      const sessionId_1 = focusedLog ? getSessionIdFromLog(focusedLog) : undefined;
      if (!focusedLog || !sessionId_1) {
        setViewMode("list");
        setRenameValue("");
        return;
      }
      if (renameValue.trim()) {
        await saveCustomTitle(sessionId_1, renameValue.trim(), focusedLog.fullPath);
        if (isResumeWithRenameEnabled && onLogsChanged) {
          onLogsChanged();
        }
      }
      setViewMode("list");
      setRenameValue("");
    };
    $[88] = focusedLog;
    $[89] = onLogsChanged;
    $[90] = renameValue;
    $[91] = t32;
  } else {
    t32 = $[91];
  }
  const handleRenameSubmit = t32;
  let t33;
  if ($[92] === Symbol.for("react.memo_cache_sentinel")) {
    t33 = () => {
      setViewMode("list");
      logEvent("tengu_session_search_toggled", {
        enabled: false
      });
    };
    $[92] = t33;
  } else {
    t33 = $[92];
  }
  const exitSearchMode = t33;
  let t34;
  if ($[93] === Symbol.for("react.memo_cache_sentinel")) {
    t34 = () => {
      setViewMode("search");
      logEvent("tengu_session_search_toggled", {
        enabled: true
      });
    };
    $[93] = t34;
  } else {
    t34 = $[93];
  }
  const enterSearchMode = t34;
  let t35;
  if ($[94] !== logs || $[95] !== onAgenticSearch || $[96] !== searchQuery) {
    t35 = async () => {
      if (!searchQuery.trim() || !onAgenticSearch || true) {
        return;
      }
      agenticSearchAbortRef.current?.abort();
      const abortController = new AbortController;
      agenticSearchAbortRef.current = abortController;
      setAgenticSearchState({
        status: "searching"
      });
      logEvent("tengu_agentic_search_started", {
        query_length: searchQuery.length
      });
      try {
        const results_0 = await onAgenticSearch(searchQuery, logs, abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }
        setAgenticSearchState({
          status: "results",
          results: results_0,
          query: searchQuery
        });
        logEvent("tengu_agentic_search_completed", {
          query_length: searchQuery.length,
          results_count: results_0.length
        });
      } catch (t362) {
        const error = t362;
        if (abortController.signal.aborted) {
          return;
        }
        setAgenticSearchState({
          status: "error",
          message: error instanceof Error ? error.message : "Search failed"
        });
        logEvent("tengu_agentic_search_error", {
          query_length: searchQuery.length
        });
      }
    };
    $[94] = logs;
    $[95] = onAgenticSearch;
    $[96] = searchQuery;
    $[97] = t35;
  } else {
    t35 = $[97];
  }
  const handleAgenticSearch = t35;
  let t36;
  if ($[98] !== agenticSearchState.query || $[99] !== agenticSearchState.status || $[100] !== searchQuery) {
    t36 = () => {
      if (agenticSearchState.status !== "idle" && agenticSearchState.status !== "searching") {
        if (agenticSearchState.status === "results" && agenticSearchState.query !== searchQuery || agenticSearchState.status === "error") {
          setAgenticSearchState({
            status: "idle"
          });
        }
      }
    };
    $[98] = agenticSearchState.query;
    $[99] = agenticSearchState.status;
    $[100] = searchQuery;
    $[101] = t36;
  } else {
    t36 = $[101];
  }
  let t37;
  if ($[102] !== agenticSearchState || $[103] !== searchQuery) {
    t37 = [searchQuery, agenticSearchState];
    $[102] = agenticSearchState;
    $[103] = searchQuery;
    $[104] = t37;
  } else {
    t37 = $[104];
  }
  import_react3.default.useEffect(t36, t37);
  let t38;
  let t39;
  if ($[105] === Symbol.for("react.memo_cache_sentinel")) {
    t38 = () => () => {
      agenticSearchAbortRef.current?.abort();
    };
    t39 = [];
    $[105] = t38;
    $[106] = t39;
  } else {
    t38 = $[105];
    t39 = $[106];
  }
  import_react3.default.useEffect(t38, t39);
  const prevAgenticStatusRef = import_react3.default.useRef(agenticSearchState.status);
  let t40;
  if ($[107] !== agenticSearchState.status || $[108] !== displayedLogs[0] || $[109] !== displayedLogs.length || $[110] !== treeNodes) {
    t40 = () => {
      const prevStatus = prevAgenticStatusRef.current;
      prevAgenticStatusRef.current = agenticSearchState.status;
      if (prevStatus === "searching" && agenticSearchState.status === "results") {
        if (isResumeWithRenameEnabled && treeNodes.length > 0) {
          setFocusedNode(treeNodes[0]);
        } else {
          if (!isResumeWithRenameEnabled && displayedLogs.length > 0) {
            const firstLog = displayedLogs[0];
            setFocusedNode({
              id: "0",
              value: {
                log: firstLog,
                indexInFiltered: 0
              },
              label: ""
            });
          }
        }
      }
    };
    $[107] = agenticSearchState.status;
    $[108] = displayedLogs[0];
    $[109] = displayedLogs.length;
    $[110] = treeNodes;
    $[111] = t40;
  } else {
    t40 = $[111];
  }
  let t41;
  if ($[112] !== agenticSearchState.status || $[113] !== displayedLogs || $[114] !== treeNodes) {
    t41 = [agenticSearchState.status, isResumeWithRenameEnabled, treeNodes, displayedLogs];
    $[112] = agenticSearchState.status;
    $[113] = displayedLogs;
    $[114] = treeNodes;
    $[115] = t41;
  } else {
    t41 = $[115];
  }
  import_react3.default.useEffect(t40, t41);
  let t42;
  if ($[116] !== displayedLogs) {
    t42 = (value) => {
      const index_1 = parseInt(value, 10);
      const log_11 = displayedLogs[index_1];
      if (!log_11 || prevFocusedIdRef.current === index_1.toString()) {
        return;
      }
      prevFocusedIdRef.current = index_1.toString();
      setFocusedNode({
        id: index_1.toString(),
        value: {
          log: log_11,
          indexInFiltered: index_1
        },
        label: ""
      });
      setFocusedIndex(index_1 + 1);
    };
    $[116] = displayedLogs;
    $[117] = t42;
  } else {
    t42 = $[117];
  }
  const handleFlatOptionsSelectFocus = t42;
  let t43;
  if ($[118] !== displayedLogs) {
    t43 = (node) => {
      setFocusedNode(node);
      const index_2 = displayedLogs.findIndex((log_12) => getSessionIdFromLog(log_12) === getSessionIdFromLog(node.value.log));
      if (index_2 >= 0) {
        setFocusedIndex(index_2 + 1);
      }
    };
    $[118] = displayedLogs;
    $[119] = t43;
  } else {
    t43 = $[119];
  }
  const handleTreeSelectFocus = t43;
  let t44;
  if ($[120] === Symbol.for("react.memo_cache_sentinel")) {
    t44 = () => {
      agenticSearchAbortRef.current?.abort();
      setAgenticSearchState({
        status: "idle"
      });
      logEvent("tengu_agentic_search_cancelled", {});
    };
    $[120] = t44;
  } else {
    t44 = $[120];
  }
  const t45 = viewMode !== "preview" && agenticSearchState.status === "searching";
  let t46;
  if ($[121] !== t45) {
    t46 = {
      context: "Confirmation",
      isActive: t45
    };
    $[121] = t45;
    $[122] = t46;
  } else {
    t46 = $[122];
  }
  useKeybinding("confirm:no", t44, t46);
  let t47;
  if ($[123] === Symbol.for("react.memo_cache_sentinel")) {
    t47 = () => {
      setViewMode("list");
      setRenameValue("");
    };
    $[123] = t47;
  } else {
    t47 = $[123];
  }
  const t48 = viewMode === "rename" && agenticSearchState.status !== "searching";
  let t49;
  if ($[124] !== t48) {
    t49 = {
      context: "Settings",
      isActive: t48
    };
    $[124] = t48;
    $[125] = t49;
  } else {
    t49 = $[125];
  }
  useKeybinding("confirm:no", t47, t49);
  let t50;
  if ($[126] !== onCancel || $[127] !== setSearchQuery) {
    t50 = () => {
      setSearchQuery("");
      setIsAgenticSearchOptionFocused(false);
      onCancel?.();
    };
    $[126] = onCancel;
    $[127] = setSearchQuery;
    $[128] = t50;
  } else {
    t50 = $[128];
  }
  const t51 = viewMode !== "preview" && viewMode !== "rename" && viewMode !== "search" && isAgenticSearchOptionFocused && agenticSearchState.status !== "searching";
  let t52;
  if ($[129] !== t51) {
    t52 = {
      context: "Confirmation",
      isActive: t51
    };
    $[129] = t51;
    $[130] = t52;
  } else {
    t52 = $[130];
  }
  useKeybinding("confirm:no", t50, t52);
  let t53;
  if ($[131] !== agenticSearchState.status || $[132] !== branchFilterEnabled || $[133] !== focusedLog || $[134] !== handleAgenticSearch || $[135] !== hasMultipleWorktrees || $[136] !== hasTags || $[137] !== isAgenticSearchOptionFocused || $[138] !== onAgenticSearch || $[139] !== onToggleAllProjects || $[140] !== searchQuery || $[141] !== setSearchQuery || $[142] !== showAllProjects || $[143] !== showAllWorktrees || $[144] !== tagTabs || $[145] !== uniqueTags || $[146] !== viewMode) {
    t53 = (input, key) => {
      if (viewMode === "preview") {
        return;
      }
      if (agenticSearchState.status === "searching") {
        return;
      }
      if (viewMode === "rename") {} else {
        if (viewMode === "search") {
          if (input.toLowerCase() === "n" && key.ctrl) {
            exitSearchMode();
          } else {
            if (key.return || key.downArrow) {
              if (searchQuery.trim() && onAgenticSearch && false) {}
            }
          }
        } else {
          if (isAgenticSearchOptionFocused) {
            if (key.return) {
              handleAgenticSearch();
              setIsAgenticSearchOptionFocused(false);
              return;
            } else {
              if (key.downArrow) {
                setIsAgenticSearchOptionFocused(false);
                return;
              } else {
                if (key.upArrow) {
                  setViewMode("search");
                  setIsAgenticSearchOptionFocused(false);
                  return;
                }
              }
            }
          }
          if (hasTags && key.tab) {
            const offset = key.shift ? -1 : 1;
            setSelectedTagIndex((prev) => {
              const current = prev < tagTabs.length ? prev : 0;
              const newIndex = (current + tagTabs.length + offset) % tagTabs.length;
              const newTab = tagTabs[newIndex];
              logEvent("tengu_session_tag_filter_changed", {
                is_all: newTab === "All",
                tag_count: uniqueTags.length
              });
              return newIndex;
            });
            return;
          }
          const keyIsNotCtrlOrMeta = !key.ctrl && !key.meta;
          const lowerInput = input.toLowerCase();
          if (lowerInput === "a" && key.ctrl && onToggleAllProjects) {
            onToggleAllProjects();
            logEvent("tengu_session_all_projects_toggled", {
              enabled: !showAllProjects
            });
          } else {
            if (lowerInput === "b" && key.ctrl) {
              const newEnabled = !branchFilterEnabled;
              setBranchFilterEnabled(newEnabled);
              logEvent("tengu_session_branch_filter_toggled", {
                enabled: newEnabled
              });
            } else {
              if (lowerInput === "w" && key.ctrl && hasMultipleWorktrees) {
                const newValue = !showAllWorktrees;
                setShowAllWorktrees(newValue);
                logEvent("tengu_session_worktree_filter_toggled", {
                  enabled: newValue
                });
              } else {
                if (lowerInput === "/" && keyIsNotCtrlOrMeta) {
                  setViewMode("search");
                  logEvent("tengu_session_search_toggled", {
                    enabled: true
                  });
                } else {
                  if (lowerInput === "r" && key.ctrl && focusedLog) {
                    setViewMode("rename");
                    setRenameValue("");
                    logEvent("tengu_session_rename_started", {});
                  } else {
                    if (lowerInput === "v" && key.ctrl && focusedLog) {
                      setPreviewLog(focusedLog);
                      setViewMode("preview");
                      logEvent("tengu_session_preview_opened", {
                        messageCount: focusedLog.messageCount
                      });
                    } else {
                      if (focusedLog && keyIsNotCtrlOrMeta && input.length > 0 && !/^\s+$/.test(input)) {
                        setViewMode("search");
                        setSearchQuery(input);
                        logEvent("tengu_session_search_toggled", {
                          enabled: true
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    $[131] = agenticSearchState.status;
    $[132] = branchFilterEnabled;
    $[133] = focusedLog;
    $[134] = handleAgenticSearch;
    $[135] = hasMultipleWorktrees;
    $[136] = hasTags;
    $[137] = isAgenticSearchOptionFocused;
    $[138] = onAgenticSearch;
    $[139] = onToggleAllProjects;
    $[140] = searchQuery;
    $[141] = setSearchQuery;
    $[142] = showAllProjects;
    $[143] = showAllWorktrees;
    $[144] = tagTabs;
    $[145] = uniqueTags;
    $[146] = viewMode;
    $[147] = t53;
  } else {
    t53 = $[147];
  }
  let t54;
  if ($[148] === Symbol.for("react.memo_cache_sentinel")) {
    t54 = {
      isActive: true
    };
    $[148] = t54;
  } else {
    t54 = $[148];
  }
  use_input_default(t53, t54);
  let filterIndicators;
  if ($[149] !== branchFilterEnabled || $[150] !== currentBranch || $[151] !== hasMultipleWorktrees || $[152] !== showAllWorktrees) {
    filterIndicators = [];
    if (branchFilterEnabled && currentBranch) {
      filterIndicators.push(currentBranch);
    }
    if (hasMultipleWorktrees && !showAllWorktrees) {
      filterIndicators.push("current worktree");
    }
    $[149] = branchFilterEnabled;
    $[150] = currentBranch;
    $[151] = hasMultipleWorktrees;
    $[152] = showAllWorktrees;
    $[153] = filterIndicators;
  } else {
    filterIndicators = $[153];
  }
  const showAdditionalFilterLine = filterIndicators.length > 0 && viewMode !== "search";
  const headerLines = 8 + (showAdditionalFilterLine ? 1 : 0) + tagTabsLines;
  const visibleCount = Math.max(1, Math.floor((maxHeight - headerLines - 2) / 3));
  let t55;
  let t56;
  if ($[154] !== displayedLogs.length || $[155] !== focusedIndex || $[156] !== onLoadMore || $[157] !== visibleCount) {
    t55 = () => {
      if (!onLoadMore) {
        return;
      }
      const buffer = visibleCount * 2;
      if (focusedIndex + buffer >= displayedLogs.length) {
        onLoadMore(visibleCount * 3);
      }
    };
    t56 = [focusedIndex, visibleCount, displayedLogs.length, onLoadMore];
    $[154] = displayedLogs.length;
    $[155] = focusedIndex;
    $[156] = onLoadMore;
    $[157] = visibleCount;
    $[158] = t55;
    $[159] = t56;
  } else {
    t55 = $[158];
    t56 = $[159];
  }
  import_react3.default.useEffect(t55, t56);
  if (logs.length === 0) {
    return null;
  }
  if (viewMode === "preview" && previewLog && isResumeWithRenameEnabled) {
    let t572;
    if ($[160] === Symbol.for("react.memo_cache_sentinel")) {
      t572 = () => {
        setViewMode("list");
        setPreviewLog(null);
      };
      $[160] = t572;
    } else {
      t572 = $[160];
    }
    let t582;
    if ($[161] !== onSelect || $[162] !== previewLog) {
      t582 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(SessionPreview, {
        log: previewLog,
        onExit: t572,
        onSelect
      }, undefined, false, undefined, this);
      $[161] = onSelect;
      $[162] = previewLog;
      $[163] = t582;
    } else {
      t582 = $[163];
    }
    return t582;
  }
  const t57 = maxHeight - 1;
  let t58;
  if ($[164] === Symbol.for("react.memo_cache_sentinel")) {
    t58 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Divider, {
        color: "suggestion"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[164] = t58;
  } else {
    t58 = $[164];
  }
  let t59;
  if ($[165] === Symbol.for("react.memo_cache_sentinel")) {
    t59 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        children: " "
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[165] = t59;
  } else {
    t59 = $[165];
  }
  let t60;
  if ($[166] !== columns || $[167] !== displayedLogs.length || $[168] !== effectiveTagIndex || $[169] !== focusedIndex || $[170] !== hasTags || $[171] !== showAllProjects || $[172] !== tagTabs || $[173] !== viewMode || $[174] !== visibleCount) {
    t60 = hasTags ? /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(TagTabs, {
      tabs: tagTabs,
      selectedIndex: effectiveTagIndex,
      availableWidth: columns,
      showAllProjects
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        bold: true,
        color: "suggestion",
        children: [
          "Resume Session",
          viewMode === "list" && displayedLogs.length > visibleCount && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              " ",
              "(",
              focusedIndex,
              " of ",
              displayedLogs.length,
              ")"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[166] = columns;
    $[167] = displayedLogs.length;
    $[168] = effectiveTagIndex;
    $[169] = focusedIndex;
    $[170] = hasTags;
    $[171] = showAllProjects;
    $[172] = tagTabs;
    $[173] = viewMode;
    $[174] = visibleCount;
    $[175] = t60;
  } else {
    t60 = $[175];
  }
  const t61 = viewMode === "search";
  let t62;
  if ($[176] !== isTerminalFocused || $[177] !== searchCursorOffset || $[178] !== searchQuery || $[179] !== t61) {
    t62 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(SearchBox, {
      query: searchQuery,
      isFocused: t61,
      isTerminalFocused,
      cursorOffset: searchCursorOffset
    }, undefined, false, undefined, this);
    $[176] = isTerminalFocused;
    $[177] = searchCursorOffset;
    $[178] = searchQuery;
    $[179] = t61;
    $[180] = t62;
  } else {
    t62 = $[180];
  }
  let t63;
  if ($[181] !== filterIndicators || $[182] !== viewMode) {
    t63 = filterIndicators.length > 0 && viewMode !== "search" && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexShrink: 0,
      paddingLeft: 2,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Byline, {
          children: filterIndicators
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[181] = filterIndicators;
    $[182] = viewMode;
    $[183] = t63;
  } else {
    t63 = $[183];
  }
  let t64;
  if ($[184] === Symbol.for("react.memo_cache_sentinel")) {
    t64 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        children: " "
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[184] = t64;
  } else {
    t64 = $[184];
  }
  let t65;
  if ($[185] !== agenticSearchState.status) {
    t65 = agenticSearchState.status === "searching" && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      paddingLeft: 1,
      flexShrink: 0,
      children: [
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Spinner, {}, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
          children: " Searching\u2026"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[185] = agenticSearchState.status;
    $[186] = t65;
  } else {
    t65 = $[186];
  }
  let t66;
  if ($[187] !== agenticSearchState.results || $[188] !== agenticSearchState.status) {
    t66 = agenticSearchState.status === "results" && agenticSearchState.results.length > 0 && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      paddingLeft: 1,
      marginBottom: 1,
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: "Claude found these results:"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[187] = agenticSearchState.results;
    $[188] = agenticSearchState.status;
    $[189] = t66;
  } else {
    t66 = $[189];
  }
  let t67;
  if ($[190] !== agenticSearchState.results || $[191] !== agenticSearchState.status || $[192] !== filteredLogs) {
    t67 = agenticSearchState.status === "results" && agenticSearchState.results.length === 0 && filteredLogs.length === 0 && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      paddingLeft: 1,
      marginBottom: 1,
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: "No matching sessions found."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[190] = agenticSearchState.results;
    $[191] = agenticSearchState.status;
    $[192] = filteredLogs;
    $[193] = t67;
  } else {
    t67 = $[193];
  }
  let t68;
  if ($[194] !== agenticSearchState.status || $[195] !== filteredLogs) {
    t68 = agenticSearchState.status === "error" && filteredLogs.length === 0 && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      paddingLeft: 1,
      marginBottom: 1,
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: "No matching sessions found."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[194] = agenticSearchState.status;
    $[195] = filteredLogs;
    $[196] = t68;
  } else {
    t68 = $[196];
  }
  let t69;
  if ($[197] !== agenticSearchState.status || $[198] !== isAgenticSearchOptionFocused || $[199] !== onAgenticSearch || $[200] !== searchQuery) {
    t69 = Boolean(searchQuery.trim()) && onAgenticSearch && false;
    $[197] = agenticSearchState.status;
    $[198] = isAgenticSearchOptionFocused;
    $[199] = onAgenticSearch;
    $[200] = searchQuery;
    $[201] = t69;
  } else {
    t69 = $[201];
  }
  let t70;
  if ($[202] !== agenticSearchState.status || $[203] !== branchFilterEnabled || $[204] !== columns || $[205] !== displayedLogs || $[206] !== expandedGroupSessionIds || $[207] !== flatOptions || $[208] !== focusedLog || $[209] !== focusedNode?.id || $[210] !== handleFlatOptionsSelectFocus || $[211] !== handleRenameSubmit || $[212] !== handleTreeSelectFocus || $[213] !== isAgenticSearchOptionFocused || $[214] !== onCancel || $[215] !== onSelect || $[216] !== renameCursorOffset || $[217] !== renameValue || $[218] !== treeNodes || $[219] !== viewMode || $[220] !== visibleCount) {
    t70 = agenticSearchState.status === "searching" ? null : viewMode === "rename" && focusedLog ? /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      paddingLeft: 2,
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
          bold: true,
          children: "Rename session:"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
          paddingTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(TextInput, {
            value: renameValue,
            onChange: setRenameValue,
            onSubmit: handleRenameSubmit,
            placeholder: getLogDisplayTitle(focusedLog, "Enter new session name"),
            columns,
            cursorOffset: renameCursorOffset,
            onChangeCursorOffset: setRenameCursorOffset,
            showCursor: true
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : isResumeWithRenameEnabled ? /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(TreeSelect, {
      nodes: treeNodes,
      onSelect: (node_0) => {
        onSelect(node_0.value.log);
      },
      onFocus: handleTreeSelectFocus,
      onCancel,
      focusNodeId: focusedNode?.id,
      visibleOptionCount: visibleCount,
      layout: "expanded",
      isDisabled: viewMode === "search" || isAgenticSearchOptionFocused,
      hideIndexes: false,
      isNodeExpanded: (nodeId) => {
        if (viewMode === "search" || branchFilterEnabled) {
          return true;
        }
        const sessionId_2 = typeof nodeId === "string" && nodeId.startsWith("group:") ? nodeId.substring(6) : null;
        return sessionId_2 ? expandedGroupSessionIds.has(sessionId_2) : false;
      },
      onExpand: (nodeId_0) => {
        const sessionId_3 = typeof nodeId_0 === "string" && nodeId_0.startsWith("group:") ? nodeId_0.substring(6) : null;
        if (sessionId_3) {
          setExpandedGroupSessionIds((prev_0) => new Set(prev_0).add(sessionId_3));
          logEvent("tengu_session_group_expanded", {});
        }
      },
      onCollapse: (nodeId_1) => {
        const sessionId_4 = typeof nodeId_1 === "string" && nodeId_1.startsWith("group:") ? nodeId_1.substring(6) : null;
        if (sessionId_4) {
          setExpandedGroupSessionIds((prev_1) => {
            const newSet = new Set(prev_1);
            newSet.delete(sessionId_4);
            return newSet;
          });
        }
      },
      onUpFromFirstItem: enterSearchMode
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Select, {
      options: flatOptions,
      onChange: (value_0) => {
        const itemIndex = parseInt(value_0, 10);
        const log_13 = displayedLogs[itemIndex];
        if (log_13) {
          onSelect(log_13);
        }
      },
      visibleOptionCount: visibleCount,
      onCancel,
      onFocus: handleFlatOptionsSelectFocus,
      defaultFocusValue: focusedNode?.id.toString(),
      layout: "expanded",
      isDisabled: viewMode === "search" || isAgenticSearchOptionFocused,
      onUpFromFirstItem: enterSearchMode
    }, undefined, false, undefined, this);
    $[202] = agenticSearchState.status;
    $[203] = branchFilterEnabled;
    $[204] = columns;
    $[205] = displayedLogs;
    $[206] = expandedGroupSessionIds;
    $[207] = flatOptions;
    $[208] = focusedLog;
    $[209] = focusedNode?.id;
    $[210] = handleFlatOptionsSelectFocus;
    $[211] = handleRenameSubmit;
    $[212] = handleTreeSelectFocus;
    $[213] = isAgenticSearchOptionFocused;
    $[214] = onCancel;
    $[215] = onSelect;
    $[216] = renameCursorOffset;
    $[217] = renameValue;
    $[218] = treeNodes;
    $[219] = viewMode;
    $[220] = visibleCount;
    $[221] = t70;
  } else {
    t70 = $[221];
  }
  let t71;
  if ($[222] !== agenticSearchState.status || $[223] !== currentBranch || $[224] !== exitState.keyName || $[225] !== exitState.pending || $[226] !== getExpandCollapseHint || $[227] !== hasMultipleWorktrees || $[228] !== isAgenticSearchOptionFocused || $[229] !== isSearching || $[230] !== onToggleAllProjects || $[231] !== showAllProjects || $[232] !== showAllWorktrees || $[233] !== viewMode) {
    t71 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      paddingLeft: 2,
      children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "Press ",
          exitState.keyName,
          " again to exit"
        ]
      }, undefined, true, undefined, this) : viewMode === "rename" ? /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Byline, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Enter",
              action: "save"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ConfigurableShortcutHint, {
              action: "confirm:no",
              context: "Confirmation",
              fallback: "Esc",
              description: "cancel"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this) : agenticSearchState.status === "searching" ? /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Byline, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
              children: "Searching with Claude\u2026"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ConfigurableShortcutHint, {
              action: "confirm:no",
              context: "Confirmation",
              fallback: "Esc",
              description: "cancel"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this) : isAgenticSearchOptionFocused ? /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Byline, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Enter",
              action: "search"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "\u2193",
              action: "skip"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ConfigurableShortcutHint, {
              action: "confirm:no",
              context: "Confirmation",
              fallback: "Esc",
              description: "cancel"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this) : viewMode === "search" ? /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Byline, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
              children: "Type to Search"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Enter",
              action: "select"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ConfigurableShortcutHint, {
              action: "confirm:no",
              context: "Confirmation",
              fallback: "Esc",
              description: "clear"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Byline, {
          children: [
            onToggleAllProjects && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Ctrl+A",
              action: `show ${showAllProjects ? "current dir" : "all projects"}`
            }, undefined, false, undefined, this),
            currentBranch && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Ctrl+B",
              action: "toggle branch"
            }, undefined, false, undefined, this),
            hasMultipleWorktrees && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Ctrl+W",
              action: `show ${showAllWorktrees ? "current worktree" : "all worktrees"}`
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Ctrl+V",
              action: "preview"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Ctrl+R",
              action: "rename"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
              children: "Type to search"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ConfigurableShortcutHint, {
              action: "confirm:no",
              context: "Confirmation",
              fallback: "Esc",
              description: "cancel"
            }, undefined, false, undefined, this),
            getExpandCollapseHint() && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
              children: getExpandCollapseHint()
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[222] = agenticSearchState.status;
    $[223] = currentBranch;
    $[224] = exitState.keyName;
    $[225] = exitState.pending;
    $[226] = getExpandCollapseHint;
    $[227] = hasMultipleWorktrees;
    $[228] = isAgenticSearchOptionFocused;
    $[229] = isSearching;
    $[230] = onToggleAllProjects;
    $[231] = showAllProjects;
    $[232] = showAllWorktrees;
    $[233] = viewMode;
    $[234] = t71;
  } else {
    t71 = $[234];
  }
  let t72;
  if ($[235] !== t57 || $[236] !== t60 || $[237] !== t62 || $[238] !== t63 || $[239] !== t65 || $[240] !== t66 || $[241] !== t67 || $[242] !== t68 || $[243] !== t69 || $[244] !== t70 || $[245] !== t71) {
    t72 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      height: t57,
      children: [
        t58,
        t59,
        t60,
        t62,
        t63,
        t64,
        t65,
        t66,
        t67,
        t68,
        t69,
        t70,
        t71
      ]
    }, undefined, true, undefined, this);
    $[235] = t57;
    $[236] = t60;
    $[237] = t62;
    $[238] = t63;
    $[239] = t65;
    $[240] = t66;
    $[241] = t67;
    $[242] = t68;
    $[243] = t69;
    $[244] = t70;
    $[245] = t71;
    $[246] = t72;
  } else {
    t72 = $[246];
  }
  return t72;
}
function _temp7(r_0) {
  return r_0.log;
}
function _temp6(log_6) {
  return log_6.messages[0]?.uuid;
}
function _temp5(fuseIndex_0, debouncedDeepSearchQuery_0, setDeepSearchResults_0, setIsSearching_0) {
  const results = fuseIndex_0.search(debouncedDeepSearchQuery_0);
  results.sort(_temp3);
  setDeepSearchResults_0({
    results: results.map(_temp4),
    query: debouncedDeepSearchQuery_0
  });
  setIsSearching_0(false);
}
function _temp4(r) {
  return {
    log: r.item.log,
    score: r.score,
    searchableText: r.item.searchableText
  };
}
function _temp3(a, b) {
  const aTime = new Date(a.item.log.modified).getTime();
  const bTime = new Date(b.item.log.modified).getTime();
  const timeDiff = bTime - aTime;
  if (Math.abs(timeDiff) > DATE_TIE_THRESHOLD_MS) {
    return timeDiff;
  }
  return (a.score ?? 1) - (b.score ?? 1);
}
function _temp22(log_1) {
  const currentSessionId = getSessionId();
  const logSessionId = getSessionIdFromLog(log_1);
  const isCurrentSession = currentSessionId && logSessionId === currentSessionId;
  if (isCurrentSession) {
    return true;
  }
  if (log_1.customTitle) {
    return true;
  }
  const fromMessages = getFirstMeaningfulUserMessageTextContent(log_1.messages);
  if (fromMessages) {
    return true;
  }
  if (log_1.firstPrompt || log_1.customTitle) {
    return true;
  }
  return false;
}
function _temp8(log) {
  return [log, buildSearchableText(log)];
}
function extractSearchableText(message) {
  if (message.type !== "user" && message.type !== "assistant") {
    return "";
  }
  const content = "message" in message ? message.message?.content : undefined;
  if (!content)
    return "";
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map((block) => {
      if (typeof block === "string")
        return block;
      if ("text" in block && typeof block.text === "string")
        return block.text;
      return "";
    }).filter(Boolean).join(" ");
  }
  return "";
}
function buildSearchableText(log) {
  const searchableMessages = log.messages.length <= DEEP_SEARCH_MAX_MESSAGES ? log.messages : [...log.messages.slice(0, DEEP_SEARCH_CROP_SIZE), ...log.messages.slice(-DEEP_SEARCH_CROP_SIZE)];
  const messageText = searchableMessages.map(extractSearchableText).filter(Boolean).join(" ");
  const metadata = [log.customTitle, log.summary, log.firstPrompt, log.gitBranch, log.tag, log.prNumber ? `PR #${log.prNumber}` : undefined, log.prRepository].filter(Boolean).join(" ");
  const fullText = `${metadata} ${messageText}`.trim();
  return fullText.length > DEEP_SEARCH_MAX_TEXT_LENGTH ? fullText.slice(0, DEEP_SEARCH_MAX_TEXT_LENGTH) : fullText;
}
function groupLogsBySessionId(filteredLogs) {
  const groups = new Map;
  for (const log of filteredLogs) {
    const sessionId = getSessionIdFromLog(log);
    if (sessionId) {
      const existing = groups.get(sessionId);
      if (existing) {
        existing.push(log);
      } else {
        groups.set(sessionId, [log]);
      }
    }
  }
  groups.forEach((logs) => logs.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()));
  return groups;
}
function getUniqueTags(logs) {
  const tags = new Set;
  for (const log of logs) {
    if (log.tag) {
      tags.add(log.tag);
    }
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}
var import_compiler_runtime3, import_react3, jsx_dev_runtime4, PARENT_PREFIX_WIDTH = 2, CHILD_PREFIX_WIDTH = 4, DEEP_SEARCH_MAX_MESSAGES = 2000, DEEP_SEARCH_CROP_SIZE = 1000, DEEP_SEARCH_MAX_TEXT_LENGTH = 50000, DATE_TIE_THRESHOLD_MS, SNIPPET_CONTEXT_CHARS = 50;
var init_LogSelector = __esm(() => {
  init_source();
  init_state();
  init_useExitOnCtrlCDWithKeybindings();
  init_useSearchInput();
  init_useTerminalSize();
  init_colorize();
  init_ink();
  init_useKeybinding();
  init_analytics();
  init_format();
  init_getWorktreePaths();
  init_git();
  init_log();
  init_sessionStorage();
  init_theme();
  init_ConfigurableShortcutHint();
  init_select();
  init_Byline();
  init_Divider();
  init_KeyboardShortcutHint();
  init_SearchBox();
  init_SessionPreview();
  init_Spinner();
  init_TagTabs();
  init_TextInput();
  init_TreeSelect();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  import_react3 = __toESM(require_react(), 1);
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
  DATE_TIE_THRESHOLD_MS = 60 * 1000;
});

// src/utils/agenticSessionSearch.ts
function extractMessageText(message) {
  if (message.type !== "user" && message.type !== "assistant") {
    return "";
  }
  const content = "message" in message ? message.message?.content : undefined;
  if (!content)
    return "";
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map((block) => {
      if (typeof block === "string")
        return block;
      if ("text" in block && typeof block.text === "string")
        return block.text;
      return "";
    }).filter(Boolean).join(" ");
  }
  return "";
}
function extractTranscript(messages) {
  if (messages.length === 0)
    return "";
  const messagesToScan = messages.length <= MAX_MESSAGES_TO_SCAN ? messages : [
    ...messages.slice(0, MAX_MESSAGES_TO_SCAN / 2),
    ...messages.slice(-MAX_MESSAGES_TO_SCAN / 2)
  ];
  const text = messagesToScan.map(extractMessageText).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return text.length > MAX_TRANSCRIPT_CHARS ? text.slice(0, MAX_TRANSCRIPT_CHARS) + "\u2026" : text;
}
function logContainsQuery(log, queryLower) {
  const title = getLogDisplayTitle(log).toLowerCase();
  if (title.includes(queryLower))
    return true;
  if (log.customTitle?.toLowerCase().includes(queryLower))
    return true;
  if (log.tag?.toLowerCase().includes(queryLower))
    return true;
  if (log.gitBranch?.toLowerCase().includes(queryLower))
    return true;
  if (log.summary?.toLowerCase().includes(queryLower))
    return true;
  if (log.firstPrompt?.toLowerCase().includes(queryLower))
    return true;
  if (log.messages && log.messages.length > 0) {
    const transcript = extractTranscript(log.messages).toLowerCase();
    if (transcript.includes(queryLower))
      return true;
  }
  return false;
}
async function agenticSessionSearch(query, logs, signal) {
  if (!query.trim() || logs.length === 0) {
    return [];
  }
  const queryLower = query.toLowerCase();
  const matchingLogs = logs.filter((log) => logContainsQuery(log, queryLower));
  let logsToSearch;
  if (matchingLogs.length >= MAX_SESSIONS_TO_SEARCH) {
    logsToSearch = matchingLogs.slice(0, MAX_SESSIONS_TO_SEARCH);
  } else {
    const nonMatchingLogs = logs.filter((log) => !logContainsQuery(log, queryLower));
    const remainingSlots = MAX_SESSIONS_TO_SEARCH - matchingLogs.length;
    logsToSearch = [
      ...matchingLogs,
      ...nonMatchingLogs.slice(0, remainingSlots)
    ];
  }
  logForDebugging(`Agentic search: ${logsToSearch.length}/${logs.length} logs, query="${query}", ` + `matching: ${matchingLogs.length}, with messages: ${count(logsToSearch, (l) => l.messages?.length > 0)}`);
  const logsWithTranscriptsPromises = logsToSearch.map(async (log) => {
    if (isLiteLog(log)) {
      try {
        return await loadFullLog(log);
      } catch (error) {
        logError(error);
        return log;
      }
    }
    return log;
  });
  const logsWithTranscripts = await Promise.all(logsWithTranscriptsPromises);
  logForDebugging(`Agentic search: loaded ${count(logsWithTranscripts, (l) => l.messages?.length > 0)}/${logsToSearch.length} logs with transcripts`);
  const sessionList = logsWithTranscripts.map((log, index) => {
    const parts = [`${index}:`];
    const displayTitle = getLogDisplayTitle(log);
    parts.push(displayTitle);
    if (log.customTitle && log.customTitle !== displayTitle) {
      parts.push(`[custom title: ${log.customTitle}]`);
    }
    if (log.tag) {
      parts.push(`[tag: ${log.tag}]`);
    }
    if (log.gitBranch) {
      parts.push(`[branch: ${log.gitBranch}]`);
    }
    if (log.summary) {
      parts.push(`- Summary: ${log.summary}`);
    }
    if (log.firstPrompt && log.firstPrompt !== "No prompt") {
      parts.push(`- First message: ${log.firstPrompt.slice(0, 300)}`);
    }
    if (log.messages && log.messages.length > 0) {
      const transcript = extractTranscript(log.messages);
      if (transcript) {
        parts.push(`- Transcript: ${transcript}`);
      }
    }
    return parts.join(" ");
  }).join(`
`);
  const userMessage = `Sessions:
${sessionList}

Search query: "${query}"

Find the sessions that are most relevant to this query.`;
  logForDebugging(`Agentic search prompt (first 500 chars): ${userMessage.slice(0, 500)}...`);
  try {
    const model = getSmallFastModel();
    logForDebugging(`Agentic search using model: ${model}`);
    const response = await sideQuery({
      model,
      system: SESSION_SEARCH_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      signal,
      querySource: "session_search"
    });
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      logForDebugging("No text content in agentic search response");
      return [];
    }
    logForDebugging(`Agentic search response: ${textContent.text}`);
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logForDebugging("Could not find JSON in agentic search response");
      return [];
    }
    const result = jsonParse(jsonMatch[0]);
    const relevantIndices = result.relevant_indices || [];
    const relevantLogs = relevantIndices.filter((index) => index >= 0 && index < logsWithTranscripts.length).map((index) => logsWithTranscripts[index]);
    logForDebugging(`Agentic search found ${relevantLogs.length} relevant sessions`);
    return relevantLogs;
  } catch (error) {
    logError(error);
    logForDebugging(`Agentic search error: ${error}`);
    return [];
  }
}
var MAX_TRANSCRIPT_CHARS = 2000, MAX_MESSAGES_TO_SCAN = 100, MAX_SESSIONS_TO_SEARCH = 100, SESSION_SEARCH_SYSTEM_PROMPT = `Your goal is to find relevant sessions based on a user's search query.

You will be given a list of sessions with their metadata and a search query. Identify which sessions are most relevant to the query.

Each session may include:
- Title (display name or custom title)
- Tag (user-assigned category, shown as [tag: name] - users tag sessions with /tag command to categorize them)
- Branch (git branch name, shown as [branch: name])
- Summary (AI-generated summary)
- First message (beginning of the conversation)
- Transcript (excerpt of conversation content)

IMPORTANT: Tags are user-assigned labels that indicate the session's topic or category. If the query matches a tag exactly or partially, those sessions should be highly prioritized.

For each session, consider (in order of priority):
1. Exact tag matches (highest priority - user explicitly categorized this session)
2. Partial tag matches or tag-related terms
3. Title matches (custom titles or first message content)
4. Branch name matches
5. Summary and transcript content matches
6. Semantic similarity and related concepts

CRITICAL: Be VERY inclusive in your matching. Include sessions that:
- Contain the query term anywhere in any field
- Are semantically related to the query (e.g., "testing" matches sessions about "tests", "unit tests", "QA", etc.)
- Discuss topics that could be related to the query
- Have transcripts that mention the concept even in passing

When in doubt, INCLUDE the session. It's better to return too many results than too few. The user can easily scan through results, but missing relevant sessions is frustrating.

Return sessions ordered by relevance (most relevant first). If truly no sessions have ANY connection to the query, return an empty array - but this should be rare.

Respond with ONLY the JSON object, no markdown formatting:
{"relevant_indices": [2, 5, 0]}`;
var init_agenticSessionSearch = __esm(() => {
  init_array();
  init_debug();
  init_log();
  init_model();
  init_sessionStorage();
  init_sideQuery();
  init_slowOperations();
});

// src/utils/crossProjectResume.ts
import { sep } from "path";
function checkCrossProjectResume(log, showAllProjects, worktreePaths) {
  const currentCwd = getOriginalCwd();
  if (!showAllProjects || !log.projectPath || log.projectPath === currentCwd) {
    return { isCrossProject: false };
  }
  if (process.env.USER_TYPE !== "ant") {
    const sessionId2 = getSessionIdFromLog(log);
    const command2 = `cd ${quote([log.projectPath])} && claude --resume ${sessionId2}`;
    return {
      isCrossProject: true,
      isSameRepoWorktree: false,
      command: command2,
      projectPath: log.projectPath
    };
  }
  const isSameRepo = worktreePaths.some((wt) => log.projectPath === wt || log.projectPath.startsWith(wt + sep));
  if (isSameRepo) {
    return {
      isCrossProject: true,
      isSameRepoWorktree: true,
      projectPath: log.projectPath
    };
  }
  const sessionId = getSessionIdFromLog(log);
  const command = `cd ${quote([log.projectPath])} && claude --resume ${sessionId}`;
  return {
    isCrossProject: true,
    isSameRepoWorktree: false,
    command,
    projectPath: log.projectPath
  };
}
var init_crossProjectResume = __esm(() => {
  init_state();
  init_shellQuote();
  init_sessionStorage();
});

export { LogSelector, init_LogSelector, agenticSessionSearch, init_agenticSessionSearch, checkCrossProjectResume, init_crossProjectResume };
