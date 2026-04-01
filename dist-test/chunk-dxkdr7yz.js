// @bun
import {
  Cursor,
  getLastKill,
  init_Cursor,
  pushToKillRing,
  recordYank,
  resetKillAccumulation,
  resetYankState,
  updateYankLength,
  yankPop
} from "./chunk-jwtmq3ad.js";
import {
  init_useTerminalSize,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  KeyboardEvent,
  ThemedBox_default,
  ThemedText,
  init_ink,
  init_keyboard_event,
  require_compiler_runtime,
  use_input_default
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/hooks/useSearchInput.ts
function isKillKey(e) {
  if (e.ctrl && (e.key === "k" || e.key === "u" || e.key === "w")) {
    return true;
  }
  if (e.meta && e.key === "backspace") {
    return true;
  }
  return false;
}
function isYankKey(e) {
  return (e.ctrl || e.meta) && e.key === "y";
}
function useSearchInput({
  isActive,
  onExit,
  onCancel,
  onExitUp,
  columns,
  passthroughCtrlKeys = [],
  initialQuery = "",
  backspaceExitsOnEmpty = true
}) {
  const { columns: terminalColumns } = useTerminalSize();
  const effectiveColumns = columns ?? terminalColumns;
  const [query, setQueryState] = import_react.useState(initialQuery);
  const [cursorOffset, setCursorOffset] = import_react.useState(initialQuery.length);
  const setQuery = import_react.useCallback((q) => {
    setQueryState(q);
    setCursorOffset(q.length);
  }, []);
  const handleKeyDown = (e) => {
    if (!isActive)
      return;
    const cursor = Cursor.fromText(query, effectiveColumns, cursorOffset);
    if (e.ctrl && passthroughCtrlKeys.includes(e.key.toLowerCase())) {
      return;
    }
    if (!isKillKey(e)) {
      resetKillAccumulation();
    }
    if (!isYankKey(e)) {
      resetYankState();
    }
    if (e.key === "return" || e.key === "down") {
      e.preventDefault();
      onExit();
      return;
    }
    if (e.key === "up") {
      e.preventDefault();
      if (onExitUp) {
        onExitUp();
      }
      return;
    }
    if (e.key === "escape") {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      } else if (query.length > 0) {
        setQueryState("");
        setCursorOffset(0);
      } else {
        onExit();
      }
      return;
    }
    if (e.key === "backspace") {
      e.preventDefault();
      if (e.meta) {
        const { cursor: newCursor2, killed } = cursor.deleteWordBefore();
        pushToKillRing(killed, "prepend");
        setQueryState(newCursor2.text);
        setCursorOffset(newCursor2.offset);
        return;
      }
      if (query.length === 0) {
        if (backspaceExitsOnEmpty)
          (onCancel ?? onExit)();
        return;
      }
      const newCursor = cursor.backspace();
      setQueryState(newCursor.text);
      setCursorOffset(newCursor.offset);
      return;
    }
    if (e.key === "delete") {
      e.preventDefault();
      const newCursor = cursor.del();
      setQueryState(newCursor.text);
      setCursorOffset(newCursor.offset);
      return;
    }
    if (e.key === "left" && (e.ctrl || e.meta || e.fn)) {
      e.preventDefault();
      const newCursor = cursor.prevWord();
      setCursorOffset(newCursor.offset);
      return;
    }
    if (e.key === "right" && (e.ctrl || e.meta || e.fn)) {
      e.preventDefault();
      const newCursor = cursor.nextWord();
      setCursorOffset(newCursor.offset);
      return;
    }
    if (e.key === "left") {
      e.preventDefault();
      const newCursor = cursor.left();
      setCursorOffset(newCursor.offset);
      return;
    }
    if (e.key === "right") {
      e.preventDefault();
      const newCursor = cursor.right();
      setCursorOffset(newCursor.offset);
      return;
    }
    if (e.key === "home") {
      e.preventDefault();
      setCursorOffset(0);
      return;
    }
    if (e.key === "end") {
      e.preventDefault();
      setCursorOffset(query.length);
      return;
    }
    if (e.ctrl) {
      e.preventDefault();
      switch (e.key.toLowerCase()) {
        case "a":
          setCursorOffset(0);
          return;
        case "e":
          setCursorOffset(query.length);
          return;
        case "b":
          setCursorOffset(cursor.left().offset);
          return;
        case "f":
          setCursorOffset(cursor.right().offset);
          return;
        case "d": {
          if (query.length === 0) {
            (onCancel ?? onExit)();
            return;
          }
          const newCursor = cursor.del();
          setQueryState(newCursor.text);
          setCursorOffset(newCursor.offset);
          return;
        }
        case "h": {
          if (query.length === 0) {
            if (backspaceExitsOnEmpty)
              (onCancel ?? onExit)();
            return;
          }
          const newCursor = cursor.backspace();
          setQueryState(newCursor.text);
          setCursorOffset(newCursor.offset);
          return;
        }
        case "k": {
          const { cursor: newCursor, killed } = cursor.deleteToLineEnd();
          pushToKillRing(killed, "append");
          setQueryState(newCursor.text);
          setCursorOffset(newCursor.offset);
          return;
        }
        case "u": {
          const { cursor: newCursor, killed } = cursor.deleteToLineStart();
          pushToKillRing(killed, "prepend");
          setQueryState(newCursor.text);
          setCursorOffset(newCursor.offset);
          return;
        }
        case "w": {
          const { cursor: newCursor, killed } = cursor.deleteWordBefore();
          pushToKillRing(killed, "prepend");
          setQueryState(newCursor.text);
          setCursorOffset(newCursor.offset);
          return;
        }
        case "y": {
          const text = getLastKill();
          if (text.length > 0) {
            const startOffset = cursor.offset;
            const newCursor = cursor.insert(text);
            recordYank(startOffset, text.length);
            setQueryState(newCursor.text);
            setCursorOffset(newCursor.offset);
          }
          return;
        }
        case "g":
        case "c":
          if (onCancel) {
            onCancel();
            return;
          }
      }
      return;
    }
    if (e.meta) {
      e.preventDefault();
      switch (e.key.toLowerCase()) {
        case "b":
          setCursorOffset(cursor.prevWord().offset);
          return;
        case "f":
          setCursorOffset(cursor.nextWord().offset);
          return;
        case "d": {
          const newCursor = cursor.deleteWordAfter();
          setQueryState(newCursor.text);
          setCursorOffset(newCursor.offset);
          return;
        }
        case "y": {
          const popResult = yankPop();
          if (popResult) {
            const { text, start, length } = popResult;
            const before = query.slice(0, start);
            const after = query.slice(start + length);
            const newText = before + text + after;
            const newOffset = start + text.length;
            updateYankLength(text.length);
            setQueryState(newText);
            setCursorOffset(newOffset);
          }
          return;
        }
      }
      return;
    }
    if (e.key === "tab") {
      return;
    }
    if (e.key.length >= 1 && !UNHANDLED_SPECIAL_KEYS.has(e.key)) {
      e.preventDefault();
      const newCursor = cursor.insert(e.key);
      setQueryState(newCursor.text);
      setCursorOffset(newCursor.offset);
    }
  };
  use_input_default((_input, _key, event) => {
    handleKeyDown(new KeyboardEvent(event.keypress));
  }, { isActive });
  return { query, setQuery, cursorOffset, handleKeyDown };
}
var import_react, UNHANDLED_SPECIAL_KEYS;
var init_useSearchInput = __esm(() => {
  init_keyboard_event();
  init_ink();
  init_Cursor();
  init_useTerminalSize();
  import_react = __toESM(require_react(), 1);
  UNHANDLED_SPECIAL_KEYS = new Set([
    "pageup",
    "pagedown",
    "insert",
    "wheelup",
    "wheeldown",
    "mouse",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f6",
    "f7",
    "f8",
    "f9",
    "f10",
    "f11",
    "f12"
  ]);
});

// src/components/SearchBox.tsx
function SearchBox(t0) {
  const $ = import_compiler_runtime.c(17);
  const {
    query,
    placeholder: t1,
    isFocused,
    isTerminalFocused,
    prefix: t2,
    width,
    cursorOffset,
    borderless: t3
  } = t0;
  const placeholder = t1 === undefined ? "Search\u2026" : t1;
  const prefix = t2 === undefined ? "\u2315" : t2;
  const borderless = t3 === undefined ? false : t3;
  const offset = cursorOffset ?? query.length;
  const t4 = borderless ? undefined : "round";
  const t5 = isFocused ? "suggestion" : undefined;
  const t6 = !isFocused;
  const t7 = borderless ? 0 : 1;
  const t8 = !isFocused;
  let t9;
  if ($[0] !== isFocused || $[1] !== isTerminalFocused || $[2] !== offset || $[3] !== placeholder || $[4] !== query) {
    t9 = isFocused ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: query ? isTerminalFocused ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: query.slice(0, offset)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            inverse: true,
            children: offset < query.length ? query[offset] : " "
          }, undefined, false, undefined, this),
          offset < query.length && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: query.slice(offset + 1)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: query
      }, undefined, false, undefined, this) : isTerminalFocused ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            inverse: true,
            children: placeholder.charAt(0)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: placeholder.slice(1)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: placeholder
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this) : query ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: query
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: placeholder
    }, undefined, false, undefined, this);
    $[0] = isFocused;
    $[1] = isTerminalFocused;
    $[2] = offset;
    $[3] = placeholder;
    $[4] = query;
    $[5] = t9;
  } else {
    t9 = $[5];
  }
  let t10;
  if ($[6] !== prefix || $[7] !== t8 || $[8] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: t8,
      children: [
        prefix,
        " ",
        t9
      ]
    }, undefined, true, undefined, this);
    $[6] = prefix;
    $[7] = t8;
    $[8] = t9;
    $[9] = t10;
  } else {
    t10 = $[9];
  }
  let t11;
  if ($[10] !== t10 || $[11] !== t4 || $[12] !== t5 || $[13] !== t6 || $[14] !== t7 || $[15] !== width) {
    t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexShrink: 0,
      borderStyle: t4,
      borderColor: t5,
      borderDimColor: t6,
      paddingX: t7,
      width,
      children: t10
    }, undefined, false, undefined, this);
    $[10] = t10;
    $[11] = t4;
    $[12] = t5;
    $[13] = t6;
    $[14] = t7;
    $[15] = width;
    $[16] = t11;
  } else {
    t11 = $[16];
  }
  return t11;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_SearchBox = __esm(() => {
  init_ink();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { SearchBox, init_SearchBox, useSearchInput, init_useSearchInput };
