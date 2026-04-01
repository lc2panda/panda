// @bun
import {
  Box_default,
  init_Box,
  init_dom,
  init_reconciler,
  markCommitStart,
  markDirty,
  scheduleRenderFrom
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_state,
  markScrollActivity
} from "./chunk-24stks7b.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/ink/components/ScrollBox.tsx
function ScrollBox({
  children,
  ref,
  stickyScroll,
  ...style
}) {
  const domRef = import_react.useRef(null);
  const [, forceRender] = import_react.useState(0);
  const listenersRef = import_react.useRef(new Set);
  const renderQueuedRef = import_react.useRef(false);
  const notify = () => {
    for (const l of listenersRef.current)
      l();
  };
  function scrollMutated(el) {
    markScrollActivity();
    markDirty(el);
    markCommitStart();
    notify();
    if (renderQueuedRef.current)
      return;
    renderQueuedRef.current = true;
    queueMicrotask(() => {
      renderQueuedRef.current = false;
      scheduleRenderFrom(el);
    });
  }
  import_react.useImperativeHandle(ref, () => ({
    scrollTo(y) {
      const el = domRef.current;
      if (!el)
        return;
      el.stickyScroll = false;
      el.pendingScrollDelta = undefined;
      el.scrollAnchor = undefined;
      el.scrollTop = Math.max(0, Math.floor(y));
      scrollMutated(el);
    },
    scrollToElement(el, offset = 0) {
      const box = domRef.current;
      if (!box)
        return;
      box.stickyScroll = false;
      box.pendingScrollDelta = undefined;
      box.scrollAnchor = {
        el,
        offset
      };
      scrollMutated(box);
    },
    scrollBy(dy) {
      const el = domRef.current;
      if (!el)
        return;
      el.stickyScroll = false;
      el.scrollAnchor = undefined;
      el.pendingScrollDelta = (el.pendingScrollDelta ?? 0) + Math.floor(dy);
      scrollMutated(el);
    },
    scrollToBottom() {
      const el = domRef.current;
      if (!el)
        return;
      el.pendingScrollDelta = undefined;
      el.stickyScroll = true;
      markDirty(el);
      notify();
      forceRender((n) => n + 1);
    },
    getScrollTop() {
      return domRef.current?.scrollTop ?? 0;
    },
    getPendingDelta() {
      return domRef.current?.pendingScrollDelta ?? 0;
    },
    getScrollHeight() {
      return domRef.current?.scrollHeight ?? 0;
    },
    getFreshScrollHeight() {
      const content = domRef.current?.childNodes[0];
      return content?.yogaNode?.getComputedHeight() ?? domRef.current?.scrollHeight ?? 0;
    },
    getViewportHeight() {
      return domRef.current?.scrollViewportHeight ?? 0;
    },
    getViewportTop() {
      return domRef.current?.scrollViewportTop ?? 0;
    },
    isSticky() {
      const el = domRef.current;
      if (!el)
        return false;
      return el.stickyScroll ?? Boolean(el.attributes["stickyScroll"]);
    },
    subscribe(listener) {
      listenersRef.current.add(listener);
      return () => listenersRef.current.delete(listener);
    },
    setClampBounds(min, max) {
      const el = domRef.current;
      if (!el)
        return;
      el.scrollClampMin = min;
      el.scrollClampMax = max;
    }
  }), []);
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("ink-box", {
    ref: (el) => {
      domRef.current = el;
      if (el)
        el.scrollTop ??= 0;
    },
    style: {
      flexWrap: "nowrap",
      flexDirection: style.flexDirection ?? "row",
      flexGrow: style.flexGrow ?? 0,
      flexShrink: style.flexShrink ?? 1,
      ...style,
      overflowX: "scroll",
      overflowY: "scroll"
    },
    ...stickyScroll ? {
      stickyScroll: true
    } : {},
    children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Box_default, {
      flexDirection: "column",
      flexGrow: 1,
      flexShrink: 0,
      width: "100%",
      children
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
var import_react, jsx_dev_runtime, ScrollBox_default;
var init_ScrollBox = __esm(() => {
  init_state();
  init_dom();
  init_reconciler();
  init_Box();
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
  ScrollBox_default = ScrollBox;
});

export { ScrollBox_default, init_ScrollBox };
