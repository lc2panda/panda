// @bun
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime,
  useTheme
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import {
  env,
  init_env
} from "./chunk-zfp09a4r.js";
import {
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/LogoV2/WelcomeV2.tsx
init_ink();
init_env();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
var WELCOME_V2_WIDTH = 58;
function WelcomeV2() {
  const $ = import_compiler_runtime.c(35);
  const [theme] = useTheme();
  if (env.terminal === "Apple_Terminal") {
    let t02;
    if ($[0] !== theme) {
      t02 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(AppleTerminalWelcomeV2, {
        theme,
        welcomeMessage: "Welcome to Panda Code"
      }, undefined, false, undefined, this);
      $[0] = theme;
      $[1] = t02;
    } else {
      t02 = $[1];
    }
    return t02;
  }
  if (["light", "light-daltonized", "light-ansi"].includes(theme)) {
    let t02;
    let t17;
    let t22;
    let t32;
    let t42;
    let t52;
    let t62;
    let t72;
    let t82;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t02 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "claude",
            children: [
              "Welcome to Panda Code",
              " "
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "v",
              MACRO.VERSION,
              " "
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
      t17 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
      }, undefined, false, undefined, this);
      t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                                          "
      }, undefined, false, undefined, this);
      t32 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                                          "
      }, undefined, false, undefined, this);
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                                          "
      }, undefined, false, undefined, this);
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "            \u2591\u2591\u2591\u2591\u2591\u2591                                        "
      }, undefined, false, undefined, this);
      t62 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                      "
      }, undefined, false, undefined, this);
      t72 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                    "
      }, undefined, false, undefined, this);
      t82 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                                          "
      }, undefined, false, undefined, this);
      $[2] = t02;
      $[3] = t17;
      $[4] = t22;
      $[5] = t32;
      $[6] = t42;
      $[7] = t52;
      $[8] = t62;
      $[9] = t72;
      $[10] = t82;
    } else {
      t02 = $[2];
      t17 = $[3];
      t22 = $[4];
      t32 = $[5];
      t42 = $[6];
      t52 = $[7];
      t62 = $[8];
      t72 = $[9];
      t82 = $[10];
    }
    let t92;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
      t92 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: "                           \u2591\u2591\u2591\u2591"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: "                     \u2588\u2588    "
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[11] = t92;
    } else {
      t92 = $[11];
    }
    let t102;
    let t112;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      t102 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: "                         \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: "               \u2588\u2588\u2592\u2592\u2588\u2588  "
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      t112 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                            \u2592\u2592      \u2588\u2588   \u2592"
      }, undefined, false, undefined, this);
      $[12] = t102;
      $[13] = t112;
    } else {
      t102 = $[12];
      t112 = $[13];
    }
    let t122;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      t122 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          "      ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "clawd_body",
            children: " \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 "
          }, undefined, false, undefined, this),
          "                         \u2592\u2592\u2591\u2591\u2592\u2592      \u2592 \u2592\u2592"
        ]
      }, undefined, true, undefined, this);
      $[14] = t122;
    } else {
      t122 = $[14];
    }
    let t132;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
      t132 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          "      ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "clawd_body",
            backgroundColor: "clawd_background",
            children: "\u2588\u2588\u2584\u2588\u2588\u2588\u2588\u2588\u2584\u2588\u2588"
          }, undefined, false, undefined, this),
          "                           \u2592\u2592         \u2592\u2592 "
        ]
      }, undefined, true, undefined, this);
      $[15] = t132;
    } else {
      t132 = $[15];
    }
    let t142;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      t142 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          "      ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "clawd_body",
            children: " \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 "
          }, undefined, false, undefined, this),
          "                          \u2591          \u2592   "
        ]
      }, undefined, true, undefined, this);
      $[16] = t142;
    } else {
      t142 = $[16];
    }
    let t152;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
      t152 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        width: WELCOME_V2_WIDTH,
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: [
            t02,
            t17,
            t22,
            t32,
            t42,
            t52,
            t62,
            t72,
            t82,
            t92,
            t102,
            t112,
            t122,
            t132,
            t142,
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: [
                "\u2026\u2026\u2026\u2026\u2026\u2026\u2026",
                /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  color: "clawd_body",
                  children: "\u2588 \u2588   \u2588 \u2588"
                }, undefined, false, undefined, this),
                "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2591\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2592\u2026\u2026\u2026\u2026"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this);
      $[17] = t152;
    } else {
      t152 = $[17];
    }
    return t152;
  }
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "claude",
          children: [
            "Welcome to Panda Code",
            " "
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "v",
            MACRO.VERSION,
            " "
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
    }, undefined, false, undefined, this);
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "                                                          "
    }, undefined, false, undefined, this);
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "     *                                       \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2591     "
    }, undefined, false, undefined, this);
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "                                 *         \u2588\u2588\u2588\u2593\u2591     \u2591\u2591   "
    }, undefined, false, undefined, this);
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "            \u2591\u2591\u2591\u2591\u2591\u2591                        \u2588\u2588\u2588\u2593\u2591           "
    }, undefined, false, undefined, this);
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                      \u2588\u2588\u2588\u2593\u2591           "
    }, undefined, false, undefined, this);
    $[18] = t0;
    $[19] = t1;
    $[20] = t2;
    $[21] = t3;
    $[22] = t4;
    $[23] = t5;
    $[24] = t6;
  } else {
    t0 = $[18];
    t1 = $[19];
    t2 = $[20];
    t3 = $[21];
    t4 = $[22];
    t5 = $[23];
    t6 = $[24];
  }
  let t10;
  let t11;
  let t7;
  let t8;
  let t9;
  if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591    "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "*"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "                \u2588\u2588\u2593\u2591\u2591      \u2593   "
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "                                             \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593\u2591    "
    }, undefined, false, undefined, this);
    t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: " *                                 \u2591\u2591\u2591\u2591                   "
    }, undefined, false, undefined, this);
    t10 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "                                 \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                 "
    }, undefined, false, undefined, this);
    t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "                               \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591           "
    }, undefined, false, undefined, this);
    $[25] = t10;
    $[26] = t11;
    $[27] = t7;
    $[28] = t8;
    $[29] = t9;
  } else {
    t10 = $[25];
    t11 = $[26];
    t7 = $[27];
    t8 = $[28];
    t9 = $[29];
  }
  let t12;
  if ($[30] === Symbol.for("react.memo_cache_sentinel")) {
    t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "clawd_body",
      children: " \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 "
    }, undefined, false, undefined, this);
    $[30] = t12;
  } else {
    t12 = $[30];
  }
  let t13;
  if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
    t13 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "      ",
        t12,
        "                                       ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "*"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: " "
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[31] = t13;
  } else {
    t13 = $[31];
  }
  let t14;
  if ($[32] === Symbol.for("react.memo_cache_sentinel")) {
    t14 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "      ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "clawd_body",
          children: "\u2588\u2588\u2584\u2588\u2588\u2588\u2588\u2588\u2584\u2588\u2588"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "                        "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "*"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "                "
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[32] = t14;
  } else {
    t14 = $[32];
  }
  let t15;
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    t15 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "      ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "clawd_body",
          children: " \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 "
        }, undefined, false, undefined, this),
        "     *                                   "
      ]
    }, undefined, true, undefined, this);
    $[33] = t15;
  } else {
    t15 = $[33];
  }
  let t16;
  if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
    t16 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      width: WELCOME_V2_WIDTH,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          t0,
          t1,
          t2,
          t3,
          t4,
          t5,
          t6,
          t7,
          t8,
          t9,
          t10,
          t11,
          t13,
          t14,
          t15,
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: [
              "\u2026\u2026\u2026\u2026\u2026\u2026\u2026",
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                color: "clawd_body",
                children: "\u2588 \u2588   \u2588 \u2588"
              }, undefined, false, undefined, this),
              "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[34] = t16;
  } else {
    t16 = $[34];
  }
  return t16;
}
function AppleTerminalWelcomeV2(t0) {
  const $ = import_compiler_runtime.c(44);
  const {
    theme,
    welcomeMessage
  } = t0;
  const isLightTheme = ["light", "light-daltonized", "light-ansi"].includes(theme);
  if (isLightTheme) {
    let t110;
    if ($[0] !== welcomeMessage) {
      t110 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "claude",
        children: [
          welcomeMessage,
          " "
        ]
      }, undefined, true, undefined, this);
      $[0] = welcomeMessage;
      $[1] = t110;
    } else {
      t110 = $[1];
    }
    let t22;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "v",
          MACRO.VERSION,
          " "
        ]
      }, undefined, true, undefined, this);
      $[2] = t22;
    } else {
      t22 = $[2];
    }
    let t32;
    if ($[3] !== t110) {
      t32 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          t110,
          t22
        ]
      }, undefined, true, undefined, this);
      $[3] = t110;
      $[4] = t32;
    } else {
      t32 = $[4];
    }
    let t102;
    let t112;
    let t42;
    let t52;
    let t62;
    let t72;
    let t82;
    let t92;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
      }, undefined, false, undefined, this);
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                                          "
      }, undefined, false, undefined, this);
      t62 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                                          "
      }, undefined, false, undefined, this);
      t72 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                                          "
      }, undefined, false, undefined, this);
      t82 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "            \u2591\u2591\u2591\u2591\u2591\u2591                                        "
      }, undefined, false, undefined, this);
      t92 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                      "
      }, undefined, false, undefined, this);
      t102 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                    "
      }, undefined, false, undefined, this);
      t112 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                                          "
      }, undefined, false, undefined, this);
      $[5] = t102;
      $[6] = t112;
      $[7] = t42;
      $[8] = t52;
      $[9] = t62;
      $[10] = t72;
      $[11] = t82;
      $[12] = t92;
    } else {
      t102 = $[5];
      t112 = $[6];
      t42 = $[7];
      t52 = $[8];
      t62 = $[9];
      t72 = $[10];
      t82 = $[11];
      t92 = $[12];
    }
    let t122;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      t122 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: "                           \u2591\u2591\u2591\u2591"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: "                     \u2588\u2588    "
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[13] = t122;
    } else {
      t122 = $[13];
    }
    let t132;
    let t142;
    let t152;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      t132 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: "                         \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: "               \u2588\u2588\u2592\u2592\u2588\u2588  "
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      t142 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                            \u2592\u2592      \u2588\u2588   \u2592"
      }, undefined, false, undefined, this);
      t152 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: "                                          \u2592\u2592\u2591\u2591\u2592\u2592      \u2592 \u2592\u2592"
      }, undefined, false, undefined, this);
      $[14] = t132;
      $[15] = t142;
      $[16] = t152;
    } else {
      t132 = $[14];
      t142 = $[15];
      t152 = $[16];
    }
    let t162;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
      t162 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          "      ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "clawd_body",
            children: "\u2597"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "clawd_background",
            backgroundColor: "clawd_body",
            children: [
              " ",
              "\u2597",
              "     ",
              "\u2596",
              " "
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "clawd_body",
            children: "\u2596"
          }, undefined, false, undefined, this),
          "                           \u2592\u2592         \u2592\u2592 "
        ]
      }, undefined, true, undefined, this);
      $[17] = t162;
    } else {
      t162 = $[17];
    }
    let t172;
    if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
      t172 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          "       ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            backgroundColor: "clawd_body",
            children: " ".repeat(9)
          }, undefined, false, undefined, this),
          "                           \u2591          \u2592   "
        ]
      }, undefined, true, undefined, this);
      $[18] = t172;
    } else {
      t172 = $[18];
    }
    let t182;
    if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
      t182 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          "\u2026\u2026\u2026\u2026\u2026\u2026\u2026",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            backgroundColor: "clawd_body",
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            backgroundColor: "clawd_body",
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: "   "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            backgroundColor: "clawd_body",
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            backgroundColor: "clawd_body",
            children: " "
          }, undefined, false, undefined, this),
          "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2591\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2592\u2026\u2026\u2026\u2026"
        ]
      }, undefined, true, undefined, this);
      $[19] = t182;
    } else {
      t182 = $[19];
    }
    let t192;
    if ($[20] !== t32) {
      t192 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        width: WELCOME_V2_WIDTH,
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: [
            t32,
            t42,
            t52,
            t62,
            t72,
            t82,
            t92,
            t102,
            t112,
            t122,
            t132,
            t142,
            t152,
            t162,
            t172,
            t182
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this);
      $[20] = t32;
      $[21] = t192;
    } else {
      t192 = $[21];
    }
    return t192;
  }
  let t1;
  if ($[22] !== welcomeMessage) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "claude",
      children: [
        welcomeMessage,
        " "
      ]
    }, undefined, true, undefined, this);
    $[22] = welcomeMessage;
    $[23] = t1;
  } else {
    t1 = $[23];
  }
  let t2;
  if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "v",
        MACRO.VERSION,
        " "
      ]
    }, undefined, true, undefined, this);
    $[24] = t2;
  } else {
    t2 = $[24];
  }
  let t3;
  if ($[25] !== t1) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        t1,
        t2
      ]
    }, undefined, true, undefined, this);
    $[25] = t1;
    $[26] = t3;
  } else {
    t3 = $[26];
  }
  let t4;
  let t5;
  let t6;
  let t7;
  let t8;
  let t9;
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
    }, undefined, false, undefined, this);
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "                                                          "
    }, undefined, false, undefined, this);
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "     *                                       \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2591     "
    }, undefined, false, undefined, this);
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "                                 *         \u2588\u2588\u2588\u2593\u2591     \u2591\u2591   "
    }, undefined, false, undefined, this);
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "            \u2591\u2591\u2591\u2591\u2591\u2591                        \u2588\u2588\u2588\u2593\u2591           "
    }, undefined, false, undefined, this);
    t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                      \u2588\u2588\u2588\u2593\u2591           "
    }, undefined, false, undefined, this);
    $[27] = t4;
    $[28] = t5;
    $[29] = t6;
    $[30] = t7;
    $[31] = t8;
    $[32] = t9;
  } else {
    t4 = $[27];
    t5 = $[28];
    t6 = $[29];
    t7 = $[30];
    t8 = $[31];
    t9 = $[32];
  }
  let t10;
  let t11;
  let t12;
  let t13;
  let t14;
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591    "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "*"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "                \u2588\u2588\u2593\u2591\u2591      \u2593   "
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "                                             \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593\u2591    "
    }, undefined, false, undefined, this);
    t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: " *                                 \u2591\u2591\u2591\u2591                   "
    }, undefined, false, undefined, this);
    t13 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "                                 \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                 "
    }, undefined, false, undefined, this);
    t14 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "                               \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591           "
    }, undefined, false, undefined, this);
    $[33] = t10;
    $[34] = t11;
    $[35] = t12;
    $[36] = t13;
    $[37] = t14;
  } else {
    t10 = $[33];
    t11 = $[34];
    t12 = $[35];
    t13 = $[36];
    t14 = $[37];
  }
  let t15;
  if ($[38] === Symbol.for("react.memo_cache_sentinel")) {
    t15 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "                                                      ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "*"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: " "
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[38] = t15;
  } else {
    t15 = $[38];
  }
  let t16;
  if ($[39] === Symbol.for("react.memo_cache_sentinel")) {
    t16 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "        ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "clawd_body",
          children: "\u2597"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "clawd_background",
          backgroundColor: "clawd_body",
          children: [
            " ",
            "\u2597",
            "     ",
            "\u2596",
            " "
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "clawd_body",
          children: "\u2596"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "                       "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "*"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "                "
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[39] = t16;
  } else {
    t16 = $[39];
  }
  let t17;
  if ($[40] === Symbol.for("react.memo_cache_sentinel")) {
    t17 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "        ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          backgroundColor: "clawd_body",
          children: " ".repeat(9)
        }, undefined, false, undefined, this),
        "      *                                   "
      ]
    }, undefined, true, undefined, this);
    $[40] = t17;
  } else {
    t17 = $[40];
  }
  let t18;
  if ($[41] === Symbol.for("react.memo_cache_sentinel")) {
    t18 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "\u2026\u2026\u2026\u2026\u2026\u2026\u2026",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          backgroundColor: "clawd_body",
          children: " "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: " "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          backgroundColor: "clawd_body",
          children: " "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "   "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          backgroundColor: "clawd_body",
          children: " "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: " "
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          backgroundColor: "clawd_body",
          children: " "
        }, undefined, false, undefined, this),
        "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
      ]
    }, undefined, true, undefined, this);
    $[41] = t18;
  } else {
    t18 = $[41];
  }
  let t19;
  if ($[42] !== t3) {
    t19 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      width: WELCOME_V2_WIDTH,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          t3,
          t4,
          t5,
          t6,
          t7,
          t8,
          t9,
          t10,
          t11,
          t12,
          t13,
          t14,
          t15,
          t16,
          t17,
          t18
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[42] = t3;
    $[43] = t19;
  } else {
    t19 = $[43];
  }
  return t19;
}

export { WelcomeV2 };
