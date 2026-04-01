// @bun
import {
  init_setup,
  isChromeExtensionInstalled
} from "./chunk-n52dg9q8.js";
import"./chunk-gyj242zr.js";
import {
  Select,
  init_AppState,
  init_select,
  useAppState
} from "./chunk-wk0emb79.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import {
  Dialog,
  init_Dialog
} from "./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-ngnveex9.js";
import"./chunk-2gzv8nrw.js";
import {
  CLAUDE_IN_CHROME_MCP_SERVER_NAME,
  init_common,
  openInChrome
} from "./chunk-2e5y8sgq.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-zz424j25.js";
import"./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import"./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import {
  init_browser,
  openBrowser
} from "./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  getGlobalConfig,
  init_auth,
  init_config1 as init_config,
  isClaudeAISubscriber,
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
import"./chunk-n9s3rq14.js";
import"./chunk-4jm600zv.js";
import {
  env,
  init_env
} from "./chunk-zfp09a4r.js";
import"./chunk-7ymfj7m3.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-e5n0k9bd.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import"./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import"./chunk-h0rbjg6x.js";
import"./chunk-s85yj5xm.js";
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
import {
  init_envUtils
} from "./chunk-3r24h7t6.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/chrome/chrome.tsx
function ClaudeInChromeMenu(t0) {
  const $ = import_compiler_runtime.c(41);
  const {
    onDone,
    isExtensionInstalled: installed,
    configEnabled,
    isClaudeAISubscriber: isClaudeAISubscriber2,
    isWSL
  } = t0;
  const mcpClients = useAppState(_temp);
  const [selectKey, setSelectKey] = import_react.useState(0);
  const [enabledByDefault, setEnabledByDefault] = import_react.useState(configEnabled ?? false);
  const [showInstallHint, setShowInstallHint] = import_react.useState(false);
  const [isExtensionInstalled, setIsExtensionInstalled] = import_react.useState(installed);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = false;
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const isHomespace = t1;
  let t2;
  if ($[1] !== mcpClients) {
    t2 = mcpClients.find(_temp2);
    $[1] = mcpClients;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const chromeClient = t2;
  const isConnected = chromeClient?.type === "connected";
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = function openUrl2(url) {
      if (isHomespace) {
        openBrowser(url);
      } else {
        openInChrome(url);
      }
    };
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const openUrl = t3;
  let t4;
  if ($[4] !== enabledByDefault) {
    t4 = function handleAction2(action) {
      bb22:
        switch (action) {
          case "install-extension": {
            setSelectKey(_temp3);
            setShowInstallHint(true);
            openUrl(CHROME_EXTENSION_URL);
            break bb22;
          }
          case "reconnect": {
            setSelectKey(_temp4);
            isChromeExtensionInstalled().then((installed_0) => {
              setIsExtensionInstalled(installed_0);
              if (installed_0) {
                setShowInstallHint(false);
              }
            });
            openUrl(CHROME_RECONNECT_URL);
            break bb22;
          }
          case "manage-permissions": {
            setSelectKey(_temp5);
            openUrl(CHROME_PERMISSIONS_URL);
            break bb22;
          }
          case "toggle-default": {
            const newValue = !enabledByDefault;
            saveGlobalConfig((current) => ({
              ...current,
              claudeInChromeDefaultEnabled: newValue
            }));
            setEnabledByDefault(newValue);
          }
        }
    };
    $[4] = enabledByDefault;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const handleAction = t4;
  let options;
  if ($[6] !== enabledByDefault || $[7] !== isExtensionInstalled) {
    options = [];
    const requiresExtensionSuffix = isExtensionInstalled ? "" : " (requires extension)";
    if (!isExtensionInstalled && !isHomespace) {
      let t53;
      if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
        t53 = {
          label: "Install Chrome extension",
          value: "install-extension"
        };
        $[9] = t53;
      } else {
        t53 = $[9];
      }
      options.push(t53);
    }
    let t52;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "Manage permissions"
      }, undefined, false, undefined, this);
      $[10] = t52;
    } else {
      t52 = $[10];
    }
    let t62;
    if ($[11] !== requiresExtensionSuffix) {
      t62 = {
        label: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
          children: [
            t52,
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              dimColor: true,
              children: requiresExtensionSuffix
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        value: "manage-permissions"
      };
      $[11] = requiresExtensionSuffix;
      $[12] = t62;
    } else {
      t62 = $[12];
    }
    let t72;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      t72 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "Reconnect extension"
      }, undefined, false, undefined, this);
      $[13] = t72;
    } else {
      t72 = $[13];
    }
    let t82;
    if ($[14] !== requiresExtensionSuffix) {
      t82 = {
        label: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
          children: [
            t72,
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              dimColor: true,
              children: requiresExtensionSuffix
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        value: "reconnect"
      };
      $[14] = requiresExtensionSuffix;
      $[15] = t82;
    } else {
      t82 = $[15];
    }
    const t92 = `Enabled by default: ${enabledByDefault ? "Yes" : "No"}`;
    let t102;
    if ($[16] !== t92) {
      t102 = {
        label: t92,
        value: "toggle-default"
      };
      $[16] = t92;
      $[17] = t102;
    } else {
      t102 = $[17];
    }
    options.push(t62, t82, t102);
    $[6] = enabledByDefault;
    $[7] = isExtensionInstalled;
    $[8] = options;
  } else {
    options = $[8];
  }
  const isDisabled = isWSL || !isClaudeAISubscriber2;
  let t5;
  if ($[18] !== onDone) {
    t5 = () => onDone();
    $[18] = onDone;
    $[19] = t5;
  } else {
    t5 = $[19];
  }
  let t6;
  if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "Claude in Chrome works with the Chrome extension to let you control your browser directly from Panda Code. Navigate websites, fill forms, capture screenshots, record GIFs, and debug with console logs and network requests."
    }, undefined, false, undefined, this);
    $[20] = t6;
  } else {
    t6 = $[20];
  }
  let t7;
  if ($[21] !== isWSL) {
    t7 = isWSL && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "error",
      children: "Claude in Chrome is not supported in WSL at this time."
    }, undefined, false, undefined, this);
    $[21] = isWSL;
    $[22] = t7;
  } else {
    t7 = $[22];
  }
  let t8;
  if ($[23] !== isClaudeAISubscriber2) {
    t8 = !isClaudeAISubscriber2 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "error",
      children: "Claude in Chrome requires a claude.ai subscription."
    }, undefined, false, undefined, this);
    $[23] = isClaudeAISubscriber2;
    $[24] = t8;
  } else {
    t8 = $[24];
  }
  let t9;
  if ($[25] !== handleAction || $[26] !== isConnected || $[27] !== isDisabled || $[28] !== isExtensionInstalled || $[29] !== options || $[30] !== selectKey || $[31] !== showInstallHint) {
    t9 = !isDisabled && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: [
        !isHomespace && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: [
                "Status:",
                " ",
                isConnected ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  color: "success",
                  children: "Enabled"
                }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  color: "inactive",
                  children: "Disabled"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: [
                "Extension:",
                " ",
                isExtensionInstalled ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  color: "success",
                  children: "Installed"
                }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  color: "warning",
                  children: "Not detected"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
          options,
          onChange: handleAction,
          hideIndexes: true
        }, selectKey, false, undefined, this),
        showInstallHint && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "warning",
          children: [
            "Once installed, select ",
            '"Reconnect extension"',
            " to connect."
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Usage: "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: "claude --chrome"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              dimColor: true,
              children: " or "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: "claude --no-chrome"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[25] = handleAction;
    $[26] = isConnected;
    $[27] = isDisabled;
    $[28] = isExtensionInstalled;
    $[29] = options;
    $[30] = selectKey;
    $[31] = showInstallHint;
    $[32] = t9;
  } else {
    t9 = $[32];
  }
  let t10;
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Learn more: https://code.claude.com/docs/en/chrome"
    }, undefined, false, undefined, this);
    $[33] = t10;
  } else {
    t10 = $[33];
  }
  let t11;
  if ($[34] !== t7 || $[35] !== t8 || $[36] !== t9) {
    t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t6,
        t7,
        t8,
        t9,
        t10
      ]
    }, undefined, true, undefined, this);
    $[34] = t7;
    $[35] = t8;
    $[36] = t9;
    $[37] = t11;
  } else {
    t11 = $[37];
  }
  let t12;
  if ($[38] !== t11 || $[39] !== t5) {
    t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Claude in Chrome (Beta)",
      onCancel: t5,
      color: "chromeYellow",
      children: t11
    }, undefined, false, undefined, this);
    $[38] = t11;
    $[39] = t5;
    $[40] = t12;
  } else {
    t12 = $[40];
  }
  return t12;
}
function _temp5(k) {
  return k + 1;
}
function _temp4(k_0) {
  return k_0 + 1;
}
function _temp3(k_1) {
  return k_1 + 1;
}
function _temp2(c) {
  return c.name === CLAUDE_IN_CHROME_MCP_SERVER_NAME;
}
function _temp(s) {
  return s.mcp.clients;
}
var import_compiler_runtime, import_react, jsx_dev_runtime, CHROME_EXTENSION_URL = "https://claude.ai/chrome", CHROME_PERMISSIONS_URL = "https://clau.de/chrome/permissions", CHROME_RECONNECT_URL = "https://clau.de/chrome/reconnect", call = async function(onDone) {
  const isExtensionInstalled = await isChromeExtensionInstalled();
  const config = getGlobalConfig();
  const isSubscriber = isClaudeAISubscriber();
  const isWSL = env.isWslEnvironment();
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ClaudeInChromeMenu, {
    onDone,
    isExtensionInstalled,
    configEnabled: config.claudeInChromeDefaultEnabled,
    isClaudeAISubscriber: isSubscriber,
    isWSL
  }, undefined, false, undefined, this);
};
var init_chrome = __esm(() => {
  init_select();
  init_Dialog();
  init_ink();
  init_AppState();
  init_auth();
  init_browser();
  init_common();
  init_setup();
  init_config();
  init_env();
  init_envUtils();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});
init_chrome();

export {
  call
};
