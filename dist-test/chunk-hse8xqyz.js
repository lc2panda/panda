// @bun
import {
  Select,
  calculateShouldShowGrove,
  getGroveNoticeConfig,
  getGroveSettings,
  init_CustomSelect,
  init_grove,
  markGroveNoticeViewed,
  updateGroveSettings
} from "./chunk-wk0emb79.js";
import {
  Byline,
  Dialog,
  KeyboardShortcutHint,
  init_Byline,
  init_Dialog,
  init_KeyboardShortcutHint
} from "./chunk-px2n7q1y.js";
import {
  Link,
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime,
  use_input_default
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

// src/components/grove/Grove.tsx
function GracePeriodContentBody() {
  const $ = import_compiler_runtime.c(9);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "An update to our Consumer Terms and Privacy Policy will take effect on",
        " ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "October 8, 2025"
        }, undefined, false, undefined, this),
        ". You can accept the updated terms today."
      ]
    }, undefined, true, undefined, this);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "What's changing?"
    }, undefined, false, undefined, this);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  let t3;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "\xB7 "
    }, undefined, false, undefined, this);
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: "You can help improve Claude "
    }, undefined, false, undefined, this);
    $[2] = t2;
    $[3] = t3;
  } else {
    t2 = $[2];
    t3 = $[3];
  }
  let t4;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      paddingLeft: 1,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          t2,
          t3,
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: [
              "\u2014 Allow the use of your chats and coding sessions to train and improve Anthropic AI models. Change anytime in your Privacy Settings (",
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
                url: "https://claude.ai/settings/data-privacy-controls"
              }, undefined, false, undefined, this),
              ")."
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  let t5;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t1,
        t4,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          paddingLeft: 1,
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: "\xB7 "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: "Updates to data retention "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: "\u2014 To help us improve our AI models and safety protections, we're extending data retention to 5 years."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  let t6;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
      url: "https://www.anthropic.com/news/updates-to-our-consumer-terms"
    }, undefined, false, undefined, this);
    $[6] = t6;
  } else {
    t6 = $[6];
  }
  let t7;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
      url: "https://anthropic.com/legal/terms"
    }, undefined, false, undefined, this);
    $[7] = t7;
  } else {
    t7 = $[7];
  }
  let t8;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: [
        t0,
        t5,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: [
            "Learn more (",
            t6,
            ") or read the updated Consumer Terms (",
            t7,
            ") and Privacy Policy (",
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
              url: "https://anthropic.com/legal/privacy"
            }, undefined, false, undefined, this),
            ")"
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[8] = t8;
  } else {
    t8 = $[8];
  }
  return t8;
}
function PostGracePeriodContentBody() {
  const $ = import_compiler_runtime.c(7);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "We've updated our Consumer Terms and Privacy Policy."
    }, undefined, false, undefined, this);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "What's changing?"
    }, undefined, false, undefined, this);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Help improve Claude"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "Allow the use of your chats and coding sessions to train and improve Anthropic AI models. You can change this anytime in Privacy Settings"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
          url: "https://claude.ai/settings/data-privacy-controls"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t1,
        t2,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              bold: true,
              children: "How this affects data retention"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: "Turning ON the improve Claude setting extends data retention from 30 days to 5 years. Turning it OFF keeps the default 30-day data retention. Delete data anytime."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  let t4;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
      url: "https://www.anthropic.com/news/updates-to-our-consumer-terms"
    }, undefined, false, undefined, this);
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  let t5;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
      url: "https://anthropic.com/legal/terms"
    }, undefined, false, undefined, this);
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  let t6;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: [
        t0,
        t3,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: [
            "Learn more (",
            t4,
            ") or read the updated Consumer Terms (",
            t5,
            ") and Privacy Policy (",
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
              url: "https://anthropic.com/legal/privacy"
            }, undefined, false, undefined, this),
            ")"
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[6] = t6;
  } else {
    t6 = $[6];
  }
  return t6;
}
function GroveDialog(t0) {
  const $ = import_compiler_runtime.c(34);
  const {
    showIfAlreadyViewed,
    location,
    onDone
  } = t0;
  const [shouldShowDialog, setShouldShowDialog] = import_react.useState(null);
  const [groveConfig, setGroveConfig] = import_react.useState(null);
  let t1;
  let t2;
  if ($[0] !== location || $[1] !== onDone || $[2] !== showIfAlreadyViewed) {
    t1 = () => {
      const checkGroveSettings = async function checkGroveSettings2() {
        const [settingsResult, configResult] = await Promise.all([getGroveSettings(), getGroveNoticeConfig()]);
        const config = configResult.success ? configResult.data : null;
        setGroveConfig(config);
        const shouldShow = calculateShouldShowGrove(settingsResult, configResult, showIfAlreadyViewed);
        setShouldShowDialog(shouldShow);
        if (!shouldShow) {
          onDone("skip_rendering");
          return;
        }
        markGroveNoticeViewed();
        logEvent("tengu_grove_policy_viewed", {
          location,
          dismissable: config?.notice_is_grace_period
        });
      };
      checkGroveSettings();
    };
    t2 = [showIfAlreadyViewed, location, onDone];
    $[0] = location;
    $[1] = onDone;
    $[2] = showIfAlreadyViewed;
    $[3] = t1;
    $[4] = t2;
  } else {
    t1 = $[3];
    t2 = $[4];
  }
  import_react.useEffect(t1, t2);
  if (shouldShowDialog === null) {
    return null;
  }
  if (!shouldShowDialog) {
    return null;
  }
  let t3;
  if ($[5] !== groveConfig?.notice_is_grace_period || $[6] !== onDone) {
    t3 = async function onChange2(value) {
      bb21:
        switch (value) {
          case "accept_opt_in": {
            await updateGroveSettings(true);
            logEvent("tengu_grove_policy_submitted", {
              state: true,
              dismissable: groveConfig?.notice_is_grace_period
            });
            break bb21;
          }
          case "accept_opt_out": {
            await updateGroveSettings(false);
            logEvent("tengu_grove_policy_submitted", {
              state: false,
              dismissable: groveConfig?.notice_is_grace_period
            });
            break bb21;
          }
          case "defer": {
            logEvent("tengu_grove_policy_dismissed", {
              state: true
            });
            break bb21;
          }
          case "escape": {
            logEvent("tengu_grove_policy_escaped", {});
          }
        }
      onDone(value);
    };
    $[5] = groveConfig?.notice_is_grace_period;
    $[6] = onDone;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const onChange = t3;
  let t4;
  if ($[8] !== groveConfig?.domain_excluded) {
    t4 = groveConfig?.domain_excluded ? [{
      label: "Accept terms \xB7 Help improve Claude: OFF (for emails with your domain)",
      value: "accept_opt_out"
    }] : [{
      label: "Accept terms \xB7 Help improve Claude: ON",
      value: "accept_opt_in"
    }, {
      label: "Accept terms \xB7 Help improve Claude: OFF",
      value: "accept_opt_out"
    }];
    $[8] = groveConfig?.domain_excluded;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const acceptOptions = t4;
  let t5;
  if ($[10] !== groveConfig?.notice_is_grace_period || $[11] !== onChange) {
    t5 = function handleCancel2() {
      if (groveConfig?.notice_is_grace_period) {
        onChange("defer");
        return;
      }
      onChange("escape");
    };
    $[10] = groveConfig?.notice_is_grace_period;
    $[11] = onChange;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  const handleCancel = t5;
  let t6;
  if ($[13] !== groveConfig?.notice_is_grace_period) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      flexGrow: 1,
      children: groveConfig?.notice_is_grace_period ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(GracePeriodContentBody, {}, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(PostGracePeriodContentBody, {}, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[13] = groveConfig?.notice_is_grace_period;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  let t7;
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexShrink: 0,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "professionalBlue",
        children: NEW_TERMS_ASCII
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  let t8;
  if ($[16] !== t6) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "row",
      children: [
        t6,
        t7
      ]
    }, undefined, true, undefined, this);
    $[16] = t6;
    $[17] = t8;
  } else {
    t8 = $[17];
  }
  let t9;
  if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Please select how you'd like to continue"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "Your choice takes effect immediately upon confirmation."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[18] = t9;
  } else {
    t9 = $[18];
  }
  let t10;
  if ($[19] !== groveConfig?.notice_is_grace_period) {
    t10 = groveConfig?.notice_is_grace_period ? [{
      label: "Not now",
      value: "defer"
    }] : [];
    $[19] = groveConfig?.notice_is_grace_period;
    $[20] = t10;
  } else {
    t10 = $[20];
  }
  let t11;
  if ($[21] !== acceptOptions || $[22] !== t10) {
    t11 = [...acceptOptions, ...t10];
    $[21] = acceptOptions;
    $[22] = t10;
    $[23] = t11;
  } else {
    t11 = $[23];
  }
  let t12;
  if ($[24] !== onChange) {
    t12 = (value_0) => onChange(value_0);
    $[24] = onChange;
    $[25] = t12;
  } else {
    t12 = $[25];
  }
  let t13;
  if ($[26] !== handleCancel || $[27] !== t11 || $[28] !== t12) {
    t13 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t9,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
          options: t11,
          onChange: t12,
          onCancel: handleCancel
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[26] = handleCancel;
    $[27] = t11;
    $[28] = t12;
    $[29] = t13;
  } else {
    t13 = $[29];
  }
  let t14;
  if ($[30] !== handleCancel || $[31] !== t13 || $[32] !== t8) {
    t14 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Updates to Consumer Terms and Policies",
      color: "professionalBlue",
      onCancel: handleCancel,
      inputGuide: _temp,
      children: [
        t8,
        t13
      ]
    }, undefined, true, undefined, this);
    $[30] = handleCancel;
    $[31] = t13;
    $[32] = t8;
    $[33] = t14;
  } else {
    t14 = $[33];
  }
  return t14;
}
function _temp(exitState) {
  return exitState.pending ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
    children: [
      "Press ",
      exitState.keyName,
      " again to exit"
    ]
  }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
        shortcut: "Enter",
        action: "confirm"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
        shortcut: "Esc",
        action: "cancel"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PrivacySettingsDialog(t0) {
  const $ = import_compiler_runtime.c(17);
  const {
    settings,
    domainExcluded,
    onDone
  } = t0;
  const [groveEnabled, setGroveEnabled] = import_react.useState(settings.grove_enabled);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  import_react.default.useEffect(_temp2, t1);
  let t2;
  if ($[1] !== domainExcluded || $[2] !== groveEnabled) {
    t2 = async (input, key) => {
      if (!domainExcluded && (key.tab || key.return || input === " ")) {
        const newValue = !groveEnabled;
        setGroveEnabled(newValue);
        await updateGroveSettings(newValue);
      }
    };
    $[1] = domainExcluded;
    $[2] = groveEnabled;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  use_input_default(t2);
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "error",
      children: "false"
    }, undefined, false, undefined, this);
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let valueComponent = t3;
  if (domainExcluded) {
    let t42;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "error",
        children: "false (for emails with your domain)"
      }, undefined, false, undefined, this);
      $[5] = t42;
    } else {
      t42 = $[5];
    }
    valueComponent = t42;
  } else {
    if (groveEnabled) {
      let t42;
      if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "success",
          children: "true"
        }, undefined, false, undefined, this);
        $[6] = t42;
      } else {
        t42 = $[6];
      }
      valueComponent = t42;
    }
  }
  let t4;
  if ($[7] !== domainExcluded) {
    t4 = (exitState) => exitState.pending ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }, undefined, true, undefined, this) : domainExcluded ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
      shortcut: "Esc",
      action: "cancel"
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter/Tab/Space",
          action: "toggle"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Esc",
          action: "cancel"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[7] = domainExcluded;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  let t5;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "Review and manage your privacy settings at",
        " ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
          url: "https://claude.ai/settings/data-privacy-controls"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  let t6;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      width: 44,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        bold: true,
        children: "Help improve Claude"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[10] = t6;
  } else {
    t6 = $[10];
  }
  let t7;
  if ($[11] !== valueComponent) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: [
        t6,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          children: valueComponent
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[11] = valueComponent;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  let t8;
  if ($[13] !== onDone || $[14] !== t4 || $[15] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Data Privacy",
      color: "professionalBlue",
      onCancel: onDone,
      inputGuide: t4,
      children: [
        t5,
        t7
      ]
    }, undefined, true, undefined, this);
    $[13] = onDone;
    $[14] = t4;
    $[15] = t7;
    $[16] = t8;
  } else {
    t8 = $[16];
  }
  return t8;
}
function _temp2() {
  logEvent("tengu_grove_privacy_settings_viewed", {});
}
var import_compiler_runtime, import_react, jsx_dev_runtime, NEW_TERMS_ASCII = ` _____________
 |          \\  \\
 | NEW TERMS \\__\\
 |              |
 |  ----------  |
 |  ----------  |
 |  ----------  |
 |  ----------  |
 |  ----------  |
 |              |
 |______________|`;
var init_Grove = __esm(() => {
  init_analytics();
  init_ink();
  init_grove();
  init_CustomSelect();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { GroveDialog, PrivacySettingsDialog, init_Grove };
