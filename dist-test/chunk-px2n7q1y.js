// @bun
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-gywzh15r.js";
import {
  Pane,
  init_KeybindingContext,
  init_Pane,
  init_useKeybinding,
  useKeybinding,
  useOptionalKeybindingContext
} from "./chunk-x2y5syym.js";
import {
  Text,
  ThemedBox_default,
  ThemedText,
  init_Text,
  init_ink,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/keybindings/useShortcutDisplay.ts
function useShortcutDisplay(action, context, fallback) {
  const keybindingContext = useOptionalKeybindingContext();
  const resolved = keybindingContext?.getDisplayText(action, context);
  const isFallback = resolved === undefined;
  const reason = keybindingContext ? "action_not_found" : "no_context";
  const hasLoggedRef = import_react.useRef(false);
  import_react.useEffect(() => {
    if (isFallback && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      logEvent("tengu_keybinding_fallback_used", {
        action,
        context,
        fallback,
        reason
      });
    }
  }, [isFallback, action, context, fallback, reason]);
  return isFallback ? fallback : resolved;
}
var import_react;
var init_useShortcutDisplay = __esm(() => {
  init_analytics();
  init_KeybindingContext();
  import_react = __toESM(require_react(), 1);
});

// src/components/design-system/KeyboardShortcutHint.tsx
function KeyboardShortcutHint(t0) {
  const $ = import_compiler_runtime.c(9);
  const {
    shortcut,
    action,
    parens: t1,
    bold: t2
  } = t0;
  const parens = t1 === undefined ? false : t1;
  const bold = t2 === undefined ? false : t2;
  let t3;
  if ($[0] !== bold || $[1] !== shortcut) {
    t3 = bold ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Text, {
      bold: true,
      children: shortcut
    }, undefined, false, undefined, this) : shortcut;
    $[0] = bold;
    $[1] = shortcut;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const shortcutText = t3;
  if (parens) {
    let t42;
    if ($[3] !== action || $[4] !== shortcutText) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Text, {
        children: [
          "(",
          shortcutText,
          " to ",
          action,
          ")"
        ]
      }, undefined, true, undefined, this);
      $[3] = action;
      $[4] = shortcutText;
      $[5] = t42;
    } else {
      t42 = $[5];
    }
    return t42;
  }
  let t4;
  if ($[6] !== action || $[7] !== shortcutText) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Text, {
      children: [
        shortcutText,
        " to ",
        action
      ]
    }, undefined, true, undefined, this);
    $[6] = action;
    $[7] = shortcutText;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_KeyboardShortcutHint = __esm(() => {
  init_Text();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/ConfigurableShortcutHint.tsx
function ConfigurableShortcutHint(t0) {
  const $ = import_compiler_runtime2.c(5);
  const {
    action,
    context,
    fallback,
    description,
    parens,
    bold
  } = t0;
  const shortcut = useShortcutDisplay(action, context, fallback);
  let t1;
  if ($[0] !== bold || $[1] !== description || $[2] !== parens || $[3] !== shortcut) {
    t1 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(KeyboardShortcutHint, {
      shortcut,
      action: description,
      parens,
      bold
    }, undefined, false, undefined, this);
    $[0] = bold;
    $[1] = description;
    $[2] = parens;
    $[3] = shortcut;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}
var import_compiler_runtime2, jsx_dev_runtime2;
var init_ConfigurableShortcutHint = __esm(() => {
  init_useShortcutDisplay();
  init_KeyboardShortcutHint();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/design-system/Byline.tsx
function Byline(t0) {
  const $ = import_compiler_runtime3.c(5);
  const {
    children
  } = t0;
  let t1;
  let t2;
  if ($[0] !== children) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const validChildren = import_react2.Children.toArray(children);
      if (validChildren.length === 0) {
        t2 = null;
        break bb0;
      }
      t1 = validChildren.map(_temp);
    }
    $[0] = children;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
  let t3;
  if ($[3] !== t1) {
    t3 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
      children: t1
    }, undefined, false, undefined, this);
    $[3] = t1;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
function _temp(child, index) {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(import_react2.default.Fragment, {
    children: [
      index > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: " \xB7 "
      }, undefined, false, undefined, this),
      child
    ]
  }, import_react2.isValidElement(child) ? child.key ?? index : index, true, undefined, this);
}
var import_compiler_runtime3, import_react2, jsx_dev_runtime3;
var init_Byline = __esm(() => {
  init_ink();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/design-system/Dialog.tsx
function Dialog(t0) {
  const $ = import_compiler_runtime4.c(27);
  const {
    title,
    subtitle,
    children,
    onCancel,
    color: t1,
    hideInputGuide,
    hideBorder,
    inputGuide,
    isCancelActive: t2
  } = t0;
  const color = t1 === undefined ? "permission" : t1;
  const isCancelActive = t2 === undefined ? true : t2;
  const exitState = useExitOnCtrlCDWithKeybindings(undefined, undefined, isCancelActive);
  let t3;
  if ($[0] !== isCancelActive) {
    t3 = {
      context: "Confirmation",
      isActive: isCancelActive
    };
    $[0] = isCancelActive;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  useKeybinding("confirm:no", onCancel, t3);
  let t4;
  if ($[2] !== exitState.keyName || $[3] !== exitState.pending) {
    t4 = exitState.pending ? /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "confirm"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Confirmation",
          fallback: "Esc",
          description: "cancel"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[2] = exitState.keyName;
    $[3] = exitState.pending;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  const defaultInputGuide = t4;
  let t5;
  if ($[5] !== color || $[6] !== title) {
    t5 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      bold: true,
      color,
      children: title
    }, undefined, false, undefined, this);
    $[5] = color;
    $[6] = title;
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  let t6;
  if ($[8] !== subtitle) {
    t6 = subtitle && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      dimColor: true,
      children: subtitle
    }, undefined, false, undefined, this);
    $[8] = subtitle;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  let t7;
  if ($[10] !== t5 || $[11] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t5,
        t6
      ]
    }, undefined, true, undefined, this);
    $[10] = t5;
    $[11] = t6;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  let t8;
  if ($[13] !== children || $[14] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t7,
        children
      ]
    }, undefined, true, undefined, this);
    $[13] = children;
    $[14] = t7;
    $[15] = t8;
  } else {
    t8 = $[15];
  }
  let t9;
  if ($[16] !== defaultInputGuide || $[17] !== exitState || $[18] !== hideInputGuide || $[19] !== inputGuide) {
    t9 = !hideInputGuide && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: inputGuide ? inputGuide(exitState) : defaultInputGuide
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[16] = defaultInputGuide;
    $[17] = exitState;
    $[18] = hideInputGuide;
    $[19] = inputGuide;
    $[20] = t9;
  } else {
    t9 = $[20];
  }
  let t10;
  if ($[21] !== t8 || $[22] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(jsx_dev_runtime4.Fragment, {
      children: [
        t8,
        t9
      ]
    }, undefined, true, undefined, this);
    $[21] = t8;
    $[22] = t9;
    $[23] = t10;
  } else {
    t10 = $[23];
  }
  const content = t10;
  if (hideBorder) {
    return content;
  }
  let t11;
  if ($[24] !== color || $[25] !== content) {
    t11 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Pane, {
      color,
      children: content
    }, undefined, false, undefined, this);
    $[24] = color;
    $[25] = content;
    $[26] = t11;
  } else {
    t11 = $[26];
  }
  return t11;
}
var import_compiler_runtime4, jsx_dev_runtime4;
var init_Dialog = __esm(() => {
  init_useExitOnCtrlCDWithKeybindings();
  init_ink();
  init_useKeybinding();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_KeyboardShortcutHint();
  init_Pane();
  import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/utils/claudeInChrome/prompt.ts
function getChromeSystemPrompt() {
  return BASE_CHROME_PROMPT;
}
var BASE_CHROME_PROMPT = `# Claude in Chrome browser automation

You have access to browser automation tools (mcp__claude-in-chrome__*) for interacting with web pages in Chrome. Follow these guidelines for effective browser automation.

## GIF recording

When performing multi-step browser interactions that the user may want to review or share, use mcp__claude-in-chrome__gif_creator to record them.

You must ALWAYS:
* Capture extra frames before and after taking actions to ensure smooth playback
* Name the file meaningfully to help the user identify it later (e.g., "login_process.gif")

## Console log debugging

You can use mcp__claude-in-chrome__read_console_messages to read console output. Console output may be verbose. If you are looking for specific log entries, use the 'pattern' parameter with a regex-compatible pattern. This filters results efficiently and avoids overwhelming output. For example, use pattern: "[MyApp]" to filter for application-specific logs rather than reading all console output.

## Alerts and dialogs

IMPORTANT: Do not trigger JavaScript alerts, confirms, prompts, or browser modal dialogs through your actions. These browser dialogs block all further browser events and will prevent the extension from receiving any subsequent commands. Instead, when possible, use console.log for debugging and then use the mcp__claude-in-chrome__read_console_messages tool to read those log messages. If a page has dialog-triggering elements:
1. Avoid clicking buttons or links that may trigger alerts (e.g., "Delete" buttons with confirmation dialogs)
2. If you must interact with such elements, warn the user first that this may interrupt the session
3. Use mcp__claude-in-chrome__javascript_tool to check for and dismiss any existing dialogs before proceeding

If you accidentally trigger a dialog and lose responsiveness, inform the user they need to manually dismiss it in the browser.

## Avoid rabbit holes and loops

When using browser automation tools, stay focused on the specific task. If you encounter any of the following, stop and ask the user for guidance:
- Unexpected complexity or tangential browser exploration
- Browser tool calls failing or returning errors after 2-3 attempts
- No response from the browser extension
- Page elements not responding to clicks or input
- Pages not loading or timing out
- Unable to complete the browser task despite multiple approaches

Explain what you attempted, what went wrong, and ask how the user would like to proceed. Do not keep retrying the same failing browser action or explore unrelated pages without checking in first.

## Tab context and session startup

IMPORTANT: At the start of each browser automation session, call mcp__claude-in-chrome__tabs_context_mcp first to get information about the user's current browser tabs. Use this context to understand what the user might want to work with before creating new tabs.

Never reuse tab IDs from a previous/other session. Follow these guidelines:
1. Only reuse an existing tab if the user explicitly asks to work with it
2. Otherwise, create a new tab with mcp__claude-in-chrome__tabs_create_mcp
3. If a tool returns an error indicating the tab doesn't exist or is invalid, call tabs_context_mcp to get fresh tab IDs
4. When a tab is closed by the user or a navigation error occurs, call tabs_context_mcp to see what tabs are available`, CHROME_TOOL_SEARCH_INSTRUCTIONS = `**IMPORTANT: Before using any chrome browser tools, you MUST first load them using ToolSearch.**

Chrome browser tools are MCP tools that require loading before use. Before calling any mcp__claude-in-chrome__* tool:
1. Use ToolSearch with \`select:mcp__claude-in-chrome__<tool_name>\` to load the specific tool
2. Then call the tool

For example, to get tab context:
1. First: ToolSearch with query "select:mcp__claude-in-chrome__tabs_context_mcp"
2. Then: Call mcp__claude-in-chrome__tabs_context_mcp`, CLAUDE_IN_CHROME_SKILL_HINT = `**Browser Automation**: Chrome browser tools are available via the "claude-in-chrome" skill. CRITICAL: Before using any mcp__claude-in-chrome__* tools, invoke the skill by calling the Skill tool with skill: "claude-in-chrome". The skill provides browser automation instructions and enables the tools.`;
var init_prompt = () => {};

export { useShortcutDisplay, init_useShortcutDisplay, KeyboardShortcutHint, init_KeyboardShortcutHint, ConfigurableShortcutHint, init_ConfigurableShortcutHint, Byline, init_Byline, Dialog, init_Dialog, BASE_CHROME_PROMPT, CHROME_TOOL_SEARCH_INSTRUCTIONS, getChromeSystemPrompt, CLAUDE_IN_CHROME_SKILL_HINT, init_prompt };
