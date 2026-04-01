// @bun
import {
  init_setup,
  isChromeExtensionInstalled
} from "./chunk-n52dg9q8.js";
import"./chunk-gyj242zr.js";
import {
  Dialog,
  init_Dialog
} from "./chunk-px2n7q1y.js";
import"./chunk-2e5y8sgq.js";
import"./chunk-gywzh15r.js";
import"./chunk-x2y5syym.js";
import {
  Link,
  Newline,
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime,
  use_input_default
} from "./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_config1 as init_config,
  saveGlobalConfig
} from "./chunk-bt6e264h.js";
import"./chunk-y9h5c3hn.js";
import"./chunk-7rxmkr8t.js";
import"./chunk-vratq94g.js";
import"./chunk-7gjw150h.js";
import"./chunk-0e1xsncc.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-m859hz3m.js";
import"./chunk-55wgxwa9.js";
import"./chunk-zfp09a4r.js";
import"./chunk-7ymfj7m3.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-p2816w9z.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import"./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import"./chunk-73q6p10n.js";
import"./chunk-8qg6qavk.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-14j8jv5j.js";
import"./chunk-0xqnccz6.js";
import"./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import"./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/ClaudeInChromeOnboarding.tsx
init_analytics();
init_ink();
init_setup();
init_config();
init_Dialog();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var import_react = __toESM(require_react(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
var CHROME_EXTENSION_URL = "https://claude.ai/chrome";
var CHROME_PERMISSIONS_URL = "https://clau.de/chrome/permissions";
function ClaudeInChromeOnboarding(t0) {
  const $ = import_compiler_runtime.c(20);
  const {
    onDone
  } = t0;
  const [isExtensionInstalled, setIsExtensionInstalled] = import_react.default.useState(false);
  let t1;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      logEvent("tengu_claude_in_chrome_onboarding_shown", {});
      isChromeExtensionInstalled().then(setIsExtensionInstalled);
      saveGlobalConfig(_temp);
    };
    t2 = [];
    $[0] = t1;
    $[1] = t2;
  } else {
    t1 = $[0];
    t2 = $[1];
  }
  import_react.default.useEffect(t1, t2);
  let t3;
  if ($[2] !== onDone) {
    t3 = (_input, key) => {
      if (key.return) {
        onDone();
      }
    };
    $[2] = onDone;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  use_input_default(t3);
  let t4;
  if ($[4] !== isExtensionInstalled) {
    t4 = !isExtensionInstalled && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Newline, {}, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Newline, {}, undefined, false, undefined, this),
        "Requires the Chrome extension. Get started at",
        " ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
          url: CHROME_EXTENSION_URL
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[4] = isExtensionInstalled;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  let t5;
  if ($[6] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "Claude in Chrome works with the Chrome extension to let you control your browser directly from Panda Code. You can navigate websites, fill forms, capture screenshots, record GIFs, and debug with console logs and network requests.",
        t4
      ]
    }, undefined, true, undefined, this);
    $[6] = t4;
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  let t6;
  if ($[8] !== isExtensionInstalled) {
    t6 = isExtensionInstalled && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: [
        " ",
        "(",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
          url: CHROME_PERMISSIONS_URL
        }, undefined, false, undefined, this),
        ")"
      ]
    }, undefined, true, undefined, this);
    $[8] = isExtensionInstalled;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  let t7;
  if ($[10] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on",
        t6,
        "."
      ]
    }, undefined, true, undefined, this);
    $[10] = t6;
    $[11] = t7;
  } else {
    t7 = $[11];
  }
  let t8;
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      color: "chromeYellow",
      children: "/chrome"
    }, undefined, false, undefined, this);
    $[12] = t8;
  } else {
    t8 = $[12];
  }
  let t9;
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "For more info, use",
        " ",
        t8,
        " ",
        "or visit ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
          url: "https://code.claude.com/docs/en/chrome"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[13] = t9;
  } else {
    t9 = $[13];
  }
  let t10;
  if ($[14] !== t5 || $[15] !== t7) {
    t10 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t5,
        t7,
        t9
      ]
    }, undefined, true, undefined, this);
    $[14] = t5;
    $[15] = t7;
    $[16] = t10;
  } else {
    t10 = $[16];
  }
  let t11;
  if ($[17] !== onDone || $[18] !== t10) {
    t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Claude in Chrome (Beta)",
      onCancel: onDone,
      color: "chromeYellow",
      children: t10
    }, undefined, false, undefined, this);
    $[17] = onDone;
    $[18] = t10;
    $[19] = t11;
  } else {
    t11 = $[19];
  }
  return t11;
}
function _temp(current) {
  return {
    ...current,
    hasCompletedClaudeInChromeOnboarding: true
  };
}
export {
  ClaudeInChromeOnboarding
};
