// @bun
import {
  ScrollBox_default,
  init_ScrollBox
} from "./chunk-y5v4npt0.js";
import {
  init_modalContext,
  init_useKeybinding,
  init_useTerminalSize,
  useIsInsideModal,
  useKeybindings,
  useModalScrollRef,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
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

// src/components/design-system/Tabs.tsx
function Tabs(t0) {
  const $ = import_compiler_runtime.c(25);
  const {
    title,
    color,
    defaultTab,
    children,
    hidden,
    useFullWidth,
    selectedTab: controlledSelectedTab,
    onTabChange,
    banner,
    disableNavigation,
    initialHeaderFocused: t1,
    contentHeight,
    navFromContent: t2
  } = t0;
  const initialHeaderFocused = t1 === undefined ? true : t1;
  const navFromContent = t2 === undefined ? false : t2;
  const {
    columns: terminalWidth
  } = useTerminalSize();
  const tabs = children.map(_temp);
  const defaultTabIndex = defaultTab ? tabs.findIndex((tab) => defaultTab === tab[0]) : 0;
  const isControlled = controlledSelectedTab !== undefined;
  const [internalSelectedTab, setInternalSelectedTab] = import_react.useState(defaultTabIndex !== -1 ? defaultTabIndex : 0);
  const controlledTabIndex = isControlled ? tabs.findIndex((tab_0) => tab_0[0] === controlledSelectedTab) : -1;
  const selectedTabIndex = isControlled ? controlledTabIndex !== -1 ? controlledTabIndex : 0 : internalSelectedTab;
  const modalScrollRef = useModalScrollRef();
  const [headerFocused, setHeaderFocused] = import_react.useState(initialHeaderFocused);
  let t3;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = () => setHeaderFocused(true);
    $[0] = t3;
  } else {
    t3 = $[0];
  }
  const focusHeader = t3;
  let t4;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = () => setHeaderFocused(false);
    $[1] = t4;
  } else {
    t4 = $[1];
  }
  const blurHeader = t4;
  const [optInCount, setOptInCount] = import_react.useState(0);
  let t5;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = () => {
      setOptInCount(_temp2);
      return () => setOptInCount(_temp3);
    };
    $[2] = t5;
  } else {
    t5 = $[2];
  }
  const registerOptIn = t5;
  const optedIn = optInCount > 0;
  const handleTabChange = (offset) => {
    const newIndex = (selectedTabIndex + tabs.length + offset) % tabs.length;
    const newTabId = tabs[newIndex]?.[0];
    if (isControlled && onTabChange && newTabId) {
      onTabChange(newTabId);
    } else {
      setInternalSelectedTab(newIndex);
    }
    setHeaderFocused(true);
  };
  const t6 = !hidden && !disableNavigation && headerFocused;
  let t7;
  if ($[3] !== t6) {
    t7 = {
      context: "Tabs",
      isActive: t6
    };
    $[3] = t6;
    $[4] = t7;
  } else {
    t7 = $[4];
  }
  useKeybindings({
    "tabs:next": () => handleTabChange(1),
    "tabs:previous": () => handleTabChange(-1)
  }, t7);
  let t8;
  if ($[5] !== headerFocused || $[6] !== hidden || $[7] !== optedIn) {
    t8 = (e) => {
      if (!headerFocused || !optedIn || hidden) {
        return;
      }
      if (e.key === "down") {
        e.preventDefault();
        setHeaderFocused(false);
      }
    };
    $[5] = headerFocused;
    $[6] = hidden;
    $[7] = optedIn;
    $[8] = t8;
  } else {
    t8 = $[8];
  }
  const handleKeyDown = t8;
  const t9 = navFromContent && !headerFocused && optedIn && !hidden && !disableNavigation;
  let t10;
  if ($[9] !== t9) {
    t10 = {
      context: "Tabs",
      isActive: t9
    };
    $[9] = t9;
    $[10] = t10;
  } else {
    t10 = $[10];
  }
  useKeybindings({
    "tabs:next": () => {
      handleTabChange(1);
      setHeaderFocused(true);
    },
    "tabs:previous": () => {
      handleTabChange(-1);
      setHeaderFocused(true);
    }
  }, t10);
  const titleWidth = title ? stringWidth(title) + 1 : 0;
  const tabsWidth = tabs.reduce(_temp4, 0);
  const usedWidth = titleWidth + tabsWidth;
  const spacerWidth = useFullWidth ? Math.max(0, terminalWidth - usedWidth) : 0;
  const contentWidth = useFullWidth ? terminalWidth : undefined;
  const T0 = ThemedBox_default;
  const t11 = "column";
  const t12 = 0;
  const t13 = true;
  const t14 = modalScrollRef ? 0 : undefined;
  const t15 = !hidden && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "row",
    gap: 1,
    flexShrink: modalScrollRef ? 0 : undefined,
    children: [
      title !== undefined && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        bold: true,
        color,
        children: title
      }, undefined, false, undefined, this),
      tabs.map((t16, i) => {
        const [id, title_0] = t16;
        const isCurrent = selectedTabIndex === i;
        const hasColorCursor = color && isCurrent && headerFocused;
        return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          backgroundColor: hasColorCursor ? color : undefined,
          color: hasColorCursor ? "inverseText" : undefined,
          inverse: isCurrent && !hasColorCursor,
          bold: isCurrent,
          children: [
            " ",
            title_0,
            " "
          ]
        }, id, true, undefined, this);
      }),
      spacerWidth > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: " ".repeat(spacerWidth)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
  let t17;
  if ($[11] !== children || $[12] !== contentHeight || $[13] !== contentWidth || $[14] !== hidden || $[15] !== modalScrollRef || $[16] !== selectedTabIndex) {
    t17 = modalScrollRef ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      width: contentWidth,
      marginTop: hidden ? 0 : 1,
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ScrollBox_default, {
        ref: modalScrollRef,
        flexDirection: "column",
        flexShrink: 0,
        children
      }, selectedTabIndex, false, undefined, this)
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      width: contentWidth,
      marginTop: hidden ? 0 : 1,
      height: contentHeight,
      overflowY: contentHeight !== undefined ? "hidden" : undefined,
      children
    }, undefined, false, undefined, this);
    $[11] = children;
    $[12] = contentHeight;
    $[13] = contentWidth;
    $[14] = hidden;
    $[15] = modalScrollRef;
    $[16] = selectedTabIndex;
    $[17] = t17;
  } else {
    t17 = $[17];
  }
  let t18;
  if ($[18] !== T0 || $[19] !== banner || $[20] !== handleKeyDown || $[21] !== t14 || $[22] !== t15 || $[23] !== t17) {
    t18 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T0, {
      flexDirection: t11,
      tabIndex: t12,
      autoFocus: t13,
      onKeyDown: handleKeyDown,
      flexShrink: t14,
      children: [
        t15,
        banner,
        t17
      ]
    }, undefined, true, undefined, this);
    $[18] = T0;
    $[19] = banner;
    $[20] = handleKeyDown;
    $[21] = t14;
    $[22] = t15;
    $[23] = t17;
    $[24] = t18;
  } else {
    t18 = $[24];
  }
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(TabsContext.Provider, {
    value: {
      selectedTab: tabs[selectedTabIndex][0],
      width: contentWidth,
      headerFocused,
      focusHeader,
      blurHeader,
      registerOptIn
    },
    children: t18
  }, undefined, false, undefined, this);
}
function _temp4(sum, t0) {
  const [, tabTitle] = t0;
  return sum + (tabTitle ? stringWidth(tabTitle) : 0) + 2 + 1;
}
function _temp3(n_0) {
  return n_0 - 1;
}
function _temp2(n) {
  return n + 1;
}
function _temp(child) {
  return [child.props.id ?? child.props.title, child.props.title];
}
function Tab(t0) {
  const $ = import_compiler_runtime.c(4);
  const {
    title,
    id,
    children
  } = t0;
  const {
    selectedTab,
    width
  } = import_react.useContext(TabsContext);
  const insideModal = useIsInsideModal();
  if (selectedTab !== (id ?? title)) {
    return null;
  }
  const t1 = insideModal ? 0 : undefined;
  let t2;
  if ($[0] !== children || $[1] !== t1 || $[2] !== width) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      width,
      flexShrink: t1,
      children
    }, undefined, false, undefined, this);
    $[0] = children;
    $[1] = t1;
    $[2] = width;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}
function useTabsWidth() {
  const {
    width
  } = import_react.useContext(TabsContext);
  return width;
}
function useTabHeaderFocus() {
  const $ = import_compiler_runtime.c(6);
  const {
    headerFocused,
    focusHeader,
    blurHeader,
    registerOptIn
  } = import_react.useContext(TabsContext);
  let t0;
  if ($[0] !== registerOptIn) {
    t0 = [registerOptIn];
    $[0] = registerOptIn;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  import_react.useEffect(registerOptIn, t0);
  let t1;
  if ($[2] !== blurHeader || $[3] !== focusHeader || $[4] !== headerFocused) {
    t1 = {
      headerFocused,
      focusHeader,
      blurHeader
    };
    $[2] = blurHeader;
    $[3] = focusHeader;
    $[4] = headerFocused;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}
var import_compiler_runtime, import_react, jsx_dev_runtime, TabsContext;
var init_Tabs = __esm(() => {
  init_modalContext();
  init_useTerminalSize();
  init_ScrollBox();
  init_stringWidth();
  init_ink();
  init_useKeybinding();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
  TabsContext = import_react.createContext({
    selectedTab: undefined,
    width: undefined,
    headerFocused: false,
    focusHeader: () => {},
    blurHeader: () => {},
    registerOptIn: () => () => {}
  });
});

export { Tabs, Tab, useTabsWidth, useTabHeaderFocus, init_Tabs };
