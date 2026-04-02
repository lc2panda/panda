// @bun
import {
  formatGrantAmount,
  getCachedOverageCreditGrant,
  init_overageCreditGrant,
  refreshOverageCreditGrantCache
} from "./chunk-kptsbbzr.js";
import {
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  getGlobalConfig,
  init_config1 as init_config,
  saveGlobalConfig
} from "./chunk-w5d5b7r0.js";
import {
  init_format,
  truncate
} from "./chunk-ywhstzac.js";
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/LogoV2/OverageCreditUpsell.tsx
function isEligibleForOverageCreditGrant() {
  const info = getCachedOverageCreditGrant();
  if (!info || !info.available || info.granted)
    return false;
  return formatGrantAmount(info) !== null;
}
function shouldShowOverageCreditUpsell() {
  if (!isEligibleForOverageCreditGrant())
    return false;
  const config = getGlobalConfig();
  if (config.hasVisitedExtraUsage)
    return false;
  if ((config.overageCreditUpsellSeenCount ?? 0) >= MAX_IMPRESSIONS)
    return false;
  return true;
}
function maybeRefreshOverageCreditCache() {
  if (getCachedOverageCreditGrant() !== null)
    return;
  refreshOverageCreditGrantCache();
}
function useShowOverageCreditUpsell() {
  const [show] = import_react.useState(_temp);
  return show;
}
function _temp() {
  maybeRefreshOverageCreditCache();
  return shouldShowOverageCreditUpsell();
}
function incrementOverageCreditUpsellSeenCount() {
  let newCount = 0;
  saveGlobalConfig((prev) => {
    newCount = (prev.overageCreditUpsellSeenCount ?? 0) + 1;
    return {
      ...prev,
      overageCreditUpsellSeenCount: newCount
    };
  });
  logEvent("tengu_overage_credit_upsell_shown", {
    seen_count: newCount
  });
}
function getUsageText(amount) {
  return `${amount} in extra usage for third-party apps \xB7 /extra-usage`;
}
function getFeedTitle(amount) {
  return `${amount} in extra usage`;
}
function OverageCreditUpsell(t0) {
  const $ = import_compiler_runtime.c(8);
  const {
    maxWidth,
    twoLine
  } = t0;
  let t1;
  let t2;
  if ($[0] !== maxWidth || $[1] !== twoLine) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const info = getCachedOverageCreditGrant();
      if (!info) {
        t2 = null;
        break bb0;
      }
      const amount = formatGrantAmount(info);
      if (!amount) {
        t2 = null;
        break bb0;
      }
      if (twoLine) {
        const title = getFeedTitle(amount);
        let t3;
        if ($[4] !== maxWidth) {
          t3 = maxWidth ? truncate(FEED_SUBTITLE, maxWidth) : FEED_SUBTITLE;
          $[4] = maxWidth;
          $[5] = t3;
        } else {
          t3 = $[5];
        }
        let t4;
        if ($[6] !== t3) {
          t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: t3
          }, undefined, false, undefined, this);
          $[6] = t3;
          $[7] = t4;
        } else {
          t4 = $[7];
        }
        t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              color: "claude",
              children: maxWidth ? truncate(title, maxWidth) : title
            }, undefined, false, undefined, this),
            t4
          ]
        }, undefined, true, undefined, this);
        break bb0;
      }
      const text = getUsageText(amount);
      const display = maxWidth ? truncate(text, maxWidth) : text;
      const highlightLen = Math.min(getFeedTitle(amount).length, display.length);
      t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "claude",
            children: display.slice(0, highlightLen)
          }, undefined, false, undefined, this),
          display.slice(highlightLen)
        ]
      }, undefined, true, undefined, this);
    }
    $[0] = maxWidth;
    $[1] = twoLine;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
  return t1;
}
function createOverageCreditFeed() {
  const info = getCachedOverageCreditGrant();
  const amount = info ? formatGrantAmount(info) : null;
  const title = amount ? getFeedTitle(amount) : "extra usage credit";
  return {
    title,
    lines: [],
    customContent: {
      content: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: FEED_SUBTITLE
      }, undefined, false, undefined, this),
      width: Math.max(title.length, FEED_SUBTITLE.length)
    }
  };
}
var import_compiler_runtime, import_react, jsx_dev_runtime, MAX_IMPRESSIONS = 3, FEED_SUBTITLE = "On us. Works on third-party apps \xB7 /extra-usage";
var init_OverageCreditUpsell = __esm(() => {
  init_ink();
  init_analytics();
  init_overageCreditGrant();
  init_config();
  init_format();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { isEligibleForOverageCreditGrant, shouldShowOverageCreditUpsell, useShowOverageCreditUpsell, incrementOverageCreditUpsellSeenCount, OverageCreditUpsell, createOverageCreditFeed, init_OverageCreditUpsell };
