// @bun
import {
  Ansi,
  TerminalSizeContext,
  ThemedBox_default,
  ThemedText,
  init_TerminalSizeContext,
  init_ink,
  require_compiler_runtime,
  use_input_default
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_stringWidth,
  stringWidth
} from "./chunk-hsd2zcr5.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/hooks/useTerminalSize.ts
function useTerminalSize() {
  const size = import_react.useContext(TerminalSizeContext);
  if (!size) {
    throw new Error("useTerminalSize must be used within an Ink App component");
  }
  return size;
}
var import_react;
var init_useTerminalSize = __esm(() => {
  init_TerminalSizeContext();
  import_react = __toESM(require_react(), 1);
});

// src/keybindings/match.ts
function getKeyName(input, key) {
  if (key.escape)
    return "escape";
  if (key.return)
    return "enter";
  if (key.tab)
    return "tab";
  if (key.backspace)
    return "backspace";
  if (key.delete)
    return "delete";
  if (key.upArrow)
    return "up";
  if (key.downArrow)
    return "down";
  if (key.leftArrow)
    return "left";
  if (key.rightArrow)
    return "right";
  if (key.pageUp)
    return "pageup";
  if (key.pageDown)
    return "pagedown";
  if (key.wheelUp)
    return "wheelup";
  if (key.wheelDown)
    return "wheeldown";
  if (key.home)
    return "home";
  if (key.end)
    return "end";
  if (input.length === 1)
    return input.toLowerCase();
  return null;
}
var init_match = () => {};

// src/keybindings/parser.ts
function parseKeystroke(input) {
  const parts = input.split("+");
  const keystroke = {
    key: "",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    super: false
  };
  for (const part of parts) {
    const lower = part.toLowerCase();
    switch (lower) {
      case "ctrl":
      case "control":
        keystroke.ctrl = true;
        break;
      case "alt":
      case "opt":
      case "option":
        keystroke.alt = true;
        break;
      case "shift":
        keystroke.shift = true;
        break;
      case "meta":
        keystroke.meta = true;
        break;
      case "cmd":
      case "command":
      case "super":
      case "win":
        keystroke.super = true;
        break;
      case "esc":
        keystroke.key = "escape";
        break;
      case "return":
        keystroke.key = "enter";
        break;
      case "space":
        keystroke.key = " ";
        break;
      case "\u2191":
        keystroke.key = "up";
        break;
      case "\u2193":
        keystroke.key = "down";
        break;
      case "\u2190":
        keystroke.key = "left";
        break;
      case "\u2192":
        keystroke.key = "right";
        break;
      default:
        keystroke.key = lower;
        break;
    }
  }
  return keystroke;
}
function parseChord(input) {
  if (input === " ")
    return [parseKeystroke("space")];
  return input.trim().split(/\s+/).map(parseKeystroke);
}
function keystrokeToString(ks) {
  const parts = [];
  if (ks.ctrl)
    parts.push("ctrl");
  if (ks.alt)
    parts.push("alt");
  if (ks.shift)
    parts.push("shift");
  if (ks.meta)
    parts.push("meta");
  if (ks.super)
    parts.push("cmd");
  const displayKey = keyToDisplayName(ks.key);
  parts.push(displayKey);
  return parts.join("+");
}
function keyToDisplayName(key) {
  switch (key) {
    case "escape":
      return "Esc";
    case " ":
      return "Space";
    case "tab":
      return "tab";
    case "enter":
      return "Enter";
    case "backspace":
      return "Backspace";
    case "delete":
      return "Delete";
    case "up":
      return "\u2191";
    case "down":
      return "\u2193";
    case "left":
      return "\u2190";
    case "right":
      return "\u2192";
    case "pageup":
      return "PageUp";
    case "pagedown":
      return "PageDown";
    case "home":
      return "Home";
    case "end":
      return "End";
    default:
      return key;
  }
}
function chordToString(chord) {
  return chord.map(keystrokeToString).join(" ");
}
function parseBindings(blocks) {
  const bindings = [];
  for (const block of blocks) {
    for (const [key, action] of Object.entries(block.bindings)) {
      bindings.push({
        chord: parseChord(key),
        action,
        context: block.context
      });
    }
  }
  return bindings;
}
var init_parser = () => {};

// src/keybindings/resolver.ts
function getBindingDisplayText(action, context, bindings) {
  const binding = bindings.findLast((b) => b.action === action && b.context === context);
  return binding ? chordToString(binding.chord) : undefined;
}
function buildKeystroke(input, key) {
  const keyName = getKeyName(input, key);
  if (!keyName)
    return null;
  const effectiveMeta = key.escape ? false : key.meta;
  return {
    key: keyName,
    ctrl: key.ctrl,
    alt: effectiveMeta,
    shift: key.shift,
    meta: effectiveMeta,
    super: key.super
  };
}
function keystrokesEqual(a, b) {
  return a.key === b.key && a.ctrl === b.ctrl && a.shift === b.shift && (a.alt || a.meta) === (b.alt || b.meta) && a.super === b.super;
}
function chordPrefixMatches(prefix, binding) {
  if (prefix.length >= binding.chord.length)
    return false;
  for (let i = 0;i < prefix.length; i++) {
    const prefixKey = prefix[i];
    const bindingKey = binding.chord[i];
    if (!prefixKey || !bindingKey)
      return false;
    if (!keystrokesEqual(prefixKey, bindingKey))
      return false;
  }
  return true;
}
function chordExactlyMatches(chord, binding) {
  if (chord.length !== binding.chord.length)
    return false;
  for (let i = 0;i < chord.length; i++) {
    const chordKey = chord[i];
    const bindingKey = binding.chord[i];
    if (!chordKey || !bindingKey)
      return false;
    if (!keystrokesEqual(chordKey, bindingKey))
      return false;
  }
  return true;
}
function resolveKeyWithChordState(input, key, activeContexts, bindings, pending) {
  if (key.escape && pending !== null) {
    return { type: "chord_cancelled" };
  }
  const currentKeystroke = buildKeystroke(input, key);
  if (!currentKeystroke) {
    if (pending !== null) {
      return { type: "chord_cancelled" };
    }
    return { type: "none" };
  }
  const testChord = pending ? [...pending, currentKeystroke] : [currentKeystroke];
  const ctxSet = new Set(activeContexts);
  const contextBindings = bindings.filter((b) => ctxSet.has(b.context));
  const chordWinners = new Map;
  for (const binding of contextBindings) {
    if (binding.chord.length > testChord.length && chordPrefixMatches(testChord, binding)) {
      chordWinners.set(chordToString(binding.chord), binding.action);
    }
  }
  let hasLongerChords = false;
  for (const action of chordWinners.values()) {
    if (action !== null) {
      hasLongerChords = true;
      break;
    }
  }
  if (hasLongerChords) {
    return { type: "chord_started", pending: testChord };
  }
  let exactMatch;
  for (const binding of contextBindings) {
    if (chordExactlyMatches(testChord, binding)) {
      exactMatch = binding;
    }
  }
  if (exactMatch) {
    if (exactMatch.action === null) {
      return { type: "unbound" };
    }
    return { type: "match", action: exactMatch.action };
  }
  if (pending !== null) {
    return { type: "chord_cancelled" };
  }
  return { type: "none" };
}
var init_resolver = __esm(() => {
  init_match();
  init_parser();
});

// src/keybindings/KeybindingContext.tsx
function KeybindingProvider(t0) {
  const $ = import_compiler_runtime.c(24);
  const {
    bindings,
    pendingChordRef,
    pendingChord,
    setPendingChord,
    activeContexts,
    registerActiveContext,
    unregisterActiveContext,
    handlerRegistryRef,
    children
  } = t0;
  let t1;
  if ($[0] !== bindings) {
    t1 = (action, context) => getBindingDisplayText(action, context, bindings);
    $[0] = bindings;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const getDisplay = t1;
  let t2;
  if ($[2] !== handlerRegistryRef) {
    t2 = (registration) => {
      const registry = handlerRegistryRef.current;
      if (!registry) {
        return _temp;
      }
      if (!registry.has(registration.action)) {
        registry.set(registration.action, new Set);
      }
      registry.get(registration.action).add(registration);
      return () => {
        const handlers = registry.get(registration.action);
        if (handlers) {
          handlers.delete(registration);
          if (handlers.size === 0) {
            registry.delete(registration.action);
          }
        }
      };
    };
    $[2] = handlerRegistryRef;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const registerHandler = t2;
  let t3;
  if ($[4] !== activeContexts || $[5] !== handlerRegistryRef) {
    t3 = (action_0) => {
      const registry_0 = handlerRegistryRef.current;
      if (!registry_0) {
        return false;
      }
      const handlers_0 = registry_0.get(action_0);
      if (!handlers_0 || handlers_0.size === 0) {
        return false;
      }
      for (const registration_0 of handlers_0) {
        if (activeContexts.has(registration_0.context)) {
          registration_0.handler();
          return true;
        }
      }
      return false;
    };
    $[4] = activeContexts;
    $[5] = handlerRegistryRef;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const invokeAction = t3;
  let t4;
  if ($[7] !== bindings || $[8] !== pendingChordRef) {
    t4 = (input, key, contexts) => resolveKeyWithChordState(input, key, contexts, bindings, pendingChordRef.current);
    $[7] = bindings;
    $[8] = pendingChordRef;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] !== activeContexts || $[11] !== bindings || $[12] !== getDisplay || $[13] !== invokeAction || $[14] !== pendingChord || $[15] !== registerActiveContext || $[16] !== registerHandler || $[17] !== setPendingChord || $[18] !== t4 || $[19] !== unregisterActiveContext) {
    t5 = {
      resolve: t4,
      setPendingChord,
      getDisplayText: getDisplay,
      bindings,
      pendingChord,
      activeContexts,
      registerActiveContext,
      unregisterActiveContext,
      registerHandler,
      invokeAction
    };
    $[10] = activeContexts;
    $[11] = bindings;
    $[12] = getDisplay;
    $[13] = invokeAction;
    $[14] = pendingChord;
    $[15] = registerActiveContext;
    $[16] = registerHandler;
    $[17] = setPendingChord;
    $[18] = t4;
    $[19] = unregisterActiveContext;
    $[20] = t5;
  } else {
    t5 = $[20];
  }
  const value = t5;
  let t6;
  if ($[21] !== children || $[22] !== value) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeybindingContext.Provider, {
      value,
      children
    }, undefined, false, undefined, this);
    $[21] = children;
    $[22] = value;
    $[23] = t6;
  } else {
    t6 = $[23];
  }
  return t6;
}
function _temp() {}
function useOptionalKeybindingContext() {
  return import_react2.useContext(KeybindingContext);
}
function useRegisterKeybindingContext(context, t0) {
  const $ = import_compiler_runtime.c(5);
  const isActive = t0 === undefined ? true : t0;
  const keybindingContext = useOptionalKeybindingContext();
  let t1;
  let t2;
  if ($[0] !== context || $[1] !== isActive || $[2] !== keybindingContext) {
    t1 = () => {
      if (!keybindingContext || !isActive) {
        return;
      }
      keybindingContext.registerActiveContext(context);
      return () => {
        keybindingContext.unregisterActiveContext(context);
      };
    };
    t2 = [context, keybindingContext, isActive];
    $[0] = context;
    $[1] = isActive;
    $[2] = keybindingContext;
    $[3] = t1;
    $[4] = t2;
  } else {
    t1 = $[3];
    t2 = $[4];
  }
  import_react2.useLayoutEffect(t1, t2);
}
var import_compiler_runtime, import_react2, jsx_dev_runtime, KeybindingContext;
var init_KeybindingContext = __esm(() => {
  init_resolver();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
  KeybindingContext = import_react2.createContext(null);
});

// src/keybindings/useKeybinding.ts
function useKeybinding(action, handler, options = {}) {
  const { context = "Global", isActive = true } = options;
  const keybindingContext = useOptionalKeybindingContext();
  import_react3.useEffect(() => {
    if (!keybindingContext || !isActive)
      return;
    return keybindingContext.registerHandler({ action, context, handler });
  }, [action, context, handler, keybindingContext, isActive]);
  const handleInput = import_react3.useCallback((input, key, event) => {
    if (!keybindingContext)
      return;
    const contextsToCheck = [
      ...keybindingContext.activeContexts,
      context,
      "Global"
    ];
    const uniqueContexts = [...new Set(contextsToCheck)];
    const result = keybindingContext.resolve(input, key, uniqueContexts);
    switch (result.type) {
      case "match":
        keybindingContext.setPendingChord(null);
        if (result.action === action) {
          if (handler() !== false) {
            event.stopImmediatePropagation();
          }
        }
        break;
      case "chord_started":
        keybindingContext.setPendingChord(result.pending);
        event.stopImmediatePropagation();
        break;
      case "chord_cancelled":
        keybindingContext.setPendingChord(null);
        break;
      case "unbound":
        keybindingContext.setPendingChord(null);
        event.stopImmediatePropagation();
        break;
      case "none":
        break;
    }
  }, [action, context, handler, keybindingContext]);
  use_input_default(handleInput, { isActive });
}
function useKeybindings(handlers, options = {}) {
  const { context = "Global", isActive = true } = options;
  const keybindingContext = useOptionalKeybindingContext();
  import_react3.useEffect(() => {
    if (!keybindingContext || !isActive)
      return;
    const unregisterFns = [];
    for (const [action, handler] of Object.entries(handlers)) {
      unregisterFns.push(keybindingContext.registerHandler({ action, context, handler }));
    }
    return () => {
      for (const unregister of unregisterFns) {
        unregister();
      }
    };
  }, [context, handlers, keybindingContext, isActive]);
  const handleInput = import_react3.useCallback((input, key, event) => {
    if (!keybindingContext)
      return;
    const contextsToCheck = [
      ...keybindingContext.activeContexts,
      context,
      "Global"
    ];
    const uniqueContexts = [...new Set(contextsToCheck)];
    const result = keybindingContext.resolve(input, key, uniqueContexts);
    switch (result.type) {
      case "match":
        keybindingContext.setPendingChord(null);
        if (result.action in handlers) {
          const handler = handlers[result.action];
          if (handler && handler() !== false) {
            event.stopImmediatePropagation();
          }
        }
        break;
      case "chord_started":
        keybindingContext.setPendingChord(result.pending);
        event.stopImmediatePropagation();
        break;
      case "chord_cancelled":
        keybindingContext.setPendingChord(null);
        break;
      case "unbound":
        keybindingContext.setPendingChord(null);
        event.stopImmediatePropagation();
        break;
      case "none":
        break;
    }
  }, [context, handlers, keybindingContext]);
  use_input_default(handleInput, { isActive });
}
var import_react3;
var init_useKeybinding = __esm(() => {
  init_ink();
  init_KeybindingContext();
  import_react3 = __toESM(require_react(), 1);
});

// src/context/modalContext.tsx
function useIsInsideModal() {
  return import_react4.useContext(ModalContext) !== null;
}
function useModalOrTerminalSize(fallback) {
  const $ = import_compiler_runtime2.c(3);
  const ctx = import_react4.useContext(ModalContext);
  let t0;
  if ($[0] !== ctx || $[1] !== fallback) {
    t0 = ctx ? {
      rows: ctx.rows,
      columns: ctx.columns
    } : fallback;
    $[0] = ctx;
    $[1] = fallback;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}
function useModalScrollRef() {
  return import_react4.useContext(ModalContext)?.scrollRef ?? null;
}
var import_compiler_runtime2, import_react4, ModalContext;
var init_modalContext = __esm(() => {
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  import_react4 = __toESM(require_react(), 1);
  ModalContext = import_react4.createContext(null);
});

// src/components/design-system/Divider.tsx
function Divider(t0) {
  const $ = import_compiler_runtime3.c(21);
  const {
    width,
    color,
    char: t1,
    padding: t2,
    title
  } = t0;
  const char = t1 === undefined ? "\u2500" : t1;
  const padding = t2 === undefined ? 0 : t2;
  const {
    columns: terminalWidth
  } = useTerminalSize();
  const effectiveWidth = Math.max(0, (width ?? terminalWidth) - padding);
  if (title) {
    const titleWidth = stringWidth(title) + 2;
    const sideWidth = Math.max(0, effectiveWidth - titleWidth);
    const leftWidth = Math.floor(sideWidth / 2);
    const rightWidth = sideWidth - leftWidth;
    const t32 = !color;
    let t42;
    if ($[0] !== char || $[1] !== leftWidth) {
      t42 = char.repeat(leftWidth);
      $[0] = char;
      $[1] = leftWidth;
      $[2] = t42;
    } else {
      t42 = $[2];
    }
    let t52;
    if ($[3] !== title) {
      t52 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Ansi, {
          children: title
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[3] = title;
      $[4] = t52;
    } else {
      t52 = $[4];
    }
    let t6;
    if ($[5] !== char || $[6] !== rightWidth) {
      t6 = char.repeat(rightWidth);
      $[5] = char;
      $[6] = rightWidth;
      $[7] = t6;
    } else {
      t6 = $[7];
    }
    let t7;
    if ($[8] !== color || $[9] !== t32 || $[10] !== t42 || $[11] !== t52 || $[12] !== t6) {
      t7 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        color,
        dimColor: t32,
        children: [
          t42,
          " ",
          t52,
          " ",
          t6
        ]
      }, undefined, true, undefined, this);
      $[8] = color;
      $[9] = t32;
      $[10] = t42;
      $[11] = t52;
      $[12] = t6;
      $[13] = t7;
    } else {
      t7 = $[13];
    }
    return t7;
  }
  const t3 = !color;
  let t4;
  if ($[14] !== char || $[15] !== effectiveWidth) {
    t4 = char.repeat(effectiveWidth);
    $[14] = char;
    $[15] = effectiveWidth;
    $[16] = t4;
  } else {
    t4 = $[16];
  }
  let t5;
  if ($[17] !== color || $[18] !== t3 || $[19] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      color,
      dimColor: t3,
      children: t4
    }, undefined, false, undefined, this);
    $[17] = color;
    $[18] = t3;
    $[19] = t4;
    $[20] = t5;
  } else {
    t5 = $[20];
  }
  return t5;
}
var import_compiler_runtime3, jsx_dev_runtime2;
var init_Divider = __esm(() => {
  init_useTerminalSize();
  init_stringWidth();
  init_ink();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/design-system/Pane.tsx
function Pane(t0) {
  const $ = import_compiler_runtime4.c(9);
  const {
    children,
    color
  } = t0;
  if (useIsInsideModal()) {
    let t12;
    if ($[0] !== children) {
      t12 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        paddingX: 1,
        flexShrink: 0,
        children
      }, undefined, false, undefined, this);
      $[0] = children;
      $[1] = t12;
    } else {
      t12 = $[1];
    }
    return t12;
  }
  let t1;
  if ($[2] !== color) {
    t1 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Divider, {
      color
    }, undefined, false, undefined, this);
    $[2] = color;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== children) {
    t2 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      paddingX: 2,
      children
    }, undefined, false, undefined, this);
    $[4] = children;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== t1 || $[7] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      paddingTop: 1,
      children: [
        t1,
        t2
      ]
    }, undefined, true, undefined, this);
    $[6] = t1;
    $[7] = t2;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}
var import_compiler_runtime4, jsx_dev_runtime3;
var init_Pane = __esm(() => {
  init_modalContext();
  init_ink();
  init_Divider();
  import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

export { useTerminalSize, init_useTerminalSize, parseKeystroke, parseChord, chordToString, parseBindings, init_parser, getBindingDisplayText, resolveKeyWithChordState, init_resolver, KeybindingProvider, useOptionalKeybindingContext, useRegisterKeybindingContext, init_KeybindingContext, useKeybinding, useKeybindings, init_useKeybinding, ModalContext, useIsInsideModal, useModalOrTerminalSize, useModalScrollRef, init_modalContext, Divider, init_Divider, Pane, init_Pane };
