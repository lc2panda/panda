// @bun
import {
  $toString,
  init_server
} from "./chunk-jdgeec04.js";
import {
  Pane,
  init_Pane,
  init_useKeybinding,
  useKeybinding
} from "./chunk-x2y5syym.js";
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
import"./chunk-bt6e264h.js";
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
import"./chunk-h0rbjg6x.js";
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
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/mobile/mobile.tsx
function MobileQRCode(t0) {
  const $ = import_compiler_runtime.c(52);
  const {
    onDone
  } = t0;
  const [platform, setPlatform] = import_react.useState("ios");
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      ios: "",
      android: ""
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [qrCodes, setQrCodes] = import_react.useState(t1);
  const {
    url
  } = PLATFORMS[platform];
  const qrCode = qrCodes[platform];
  let t2;
  let t3;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      const generateQRCodes = async function generateQRCodes2() {
        const [ios, android] = await Promise.all([$toString(PLATFORMS.ios.url, {
          type: "utf8",
          errorCorrectionLevel: "L"
        }), $toString(PLATFORMS.android.url, {
          type: "utf8",
          errorCorrectionLevel: "L"
        })]);
        setQrCodes({
          ios,
          android
        });
      };
      generateQRCodes().catch(_temp);
    };
    t3 = [];
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  import_react.useEffect(t2, t3);
  let t4;
  if ($[3] !== onDone) {
    t4 = () => {
      onDone();
    };
    $[3] = onDone;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  const handleClose = t4;
  let t5;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = {
      context: "Confirmation"
    };
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  useKeybinding("confirm:no", handleClose, t5);
  let t6;
  if ($[6] !== onDone) {
    t6 = function handleKeyDown2(e) {
      if (e.key === "q" || e.ctrl && e.key === "c") {
        e.preventDefault();
        onDone();
        return;
      }
      if (e.key === "tab" || e.key === "left" || e.key === "right") {
        e.preventDefault();
        setPlatform(_temp2);
      }
    };
    $[6] = onDone;
    $[7] = t6;
  } else {
    t6 = $[7];
  }
  const handleKeyDown = t6;
  let T0;
  let T1;
  let t10;
  let t11;
  let t12;
  let t13;
  let t7;
  let t8;
  let t9;
  if ($[8] !== handleKeyDown || $[9] !== qrCode) {
    const lines = qrCode.split(`
`).filter(_temp3);
    T1 = Pane;
    T0 = ThemedBox_default;
    t7 = "column";
    t8 = 0;
    t9 = true;
    t10 = handleKeyDown;
    if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
      t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: " "
      }, undefined, false, undefined, this);
      t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: " "
      }, undefined, false, undefined, this);
      $[19] = t11;
      $[20] = t12;
    } else {
      t11 = $[19];
      t12 = $[20];
    }
    t13 = lines.map(_temp4);
    $[8] = handleKeyDown;
    $[9] = qrCode;
    $[10] = T0;
    $[11] = T1;
    $[12] = t10;
    $[13] = t11;
    $[14] = t12;
    $[15] = t13;
    $[16] = t7;
    $[17] = t8;
    $[18] = t9;
  } else {
    T0 = $[10];
    T1 = $[11];
    t10 = $[12];
    t11 = $[13];
    t12 = $[14];
    t13 = $[15];
    t7 = $[16];
    t8 = $[17];
    t9 = $[18];
  }
  let t14;
  let t15;
  if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
    t14 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: " "
    }, undefined, false, undefined, this);
    t15 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: " "
    }, undefined, false, undefined, this);
    $[21] = t14;
    $[22] = t15;
  } else {
    t14 = $[21];
    t15 = $[22];
  }
  const t16 = platform === "ios";
  const t17 = platform === "ios";
  let t18;
  if ($[23] !== t16 || $[24] !== t17) {
    t18 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: t16,
      underline: t17,
      children: "iOS"
    }, undefined, false, undefined, this);
    $[23] = t16;
    $[24] = t17;
    $[25] = t18;
  } else {
    t18 = $[25];
  }
  let t19;
  if ($[26] === Symbol.for("react.memo_cache_sentinel")) {
    t19 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: " / "
    }, undefined, false, undefined, this);
    $[26] = t19;
  } else {
    t19 = $[26];
  }
  const t20 = platform === "android";
  const t21 = platform === "android";
  let t22;
  if ($[27] !== t20 || $[28] !== t21) {
    t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: t20,
      underline: t21,
      children: "Android"
    }, undefined, false, undefined, this);
    $[27] = t20;
    $[28] = t21;
    $[29] = t22;
  } else {
    t22 = $[29];
  }
  let t23;
  if ($[30] !== t18 || $[31] !== t22) {
    t23 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        t18,
        t19,
        t22
      ]
    }, undefined, true, undefined, this);
    $[30] = t18;
    $[31] = t22;
    $[32] = t23;
  } else {
    t23 = $[32];
  }
  let t24;
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    t24 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "(tab to switch, esc to close)"
    }, undefined, false, undefined, this);
    $[33] = t24;
  } else {
    t24 = $[33];
  }
  let t25;
  if ($[34] !== t23) {
    t25 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "row",
      gap: 2,
      children: [
        t23,
        t24
      ]
    }, undefined, true, undefined, this);
    $[34] = t23;
    $[35] = t25;
  } else {
    t25 = $[35];
  }
  let t26;
  if ($[36] !== url) {
    t26 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: url
    }, undefined, false, undefined, this);
    $[36] = url;
    $[37] = t26;
  } else {
    t26 = $[37];
  }
  let t27;
  if ($[38] !== T0 || $[39] !== t10 || $[40] !== t11 || $[41] !== t12 || $[42] !== t13 || $[43] !== t25 || $[44] !== t26 || $[45] !== t7 || $[46] !== t8 || $[47] !== t9) {
    t27 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T0, {
      flexDirection: t7,
      tabIndex: t8,
      autoFocus: t9,
      onKeyDown: t10,
      children: [
        t11,
        t12,
        t13,
        t14,
        t15,
        t25,
        t26
      ]
    }, undefined, true, undefined, this);
    $[38] = T0;
    $[39] = t10;
    $[40] = t11;
    $[41] = t12;
    $[42] = t13;
    $[43] = t25;
    $[44] = t26;
    $[45] = t7;
    $[46] = t8;
    $[47] = t9;
    $[48] = t27;
  } else {
    t27 = $[48];
  }
  let t28;
  if ($[49] !== T1 || $[50] !== t27) {
    t28 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T1, {
      children: t27
    }, undefined, false, undefined, this);
    $[49] = T1;
    $[50] = t27;
    $[51] = t28;
  } else {
    t28 = $[51];
  }
  return t28;
}
function _temp4(line_0, i) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
    children: line_0
  }, i, false, undefined, this);
}
function _temp3(line) {
  return line.length > 0;
}
function _temp2(prev) {
  return prev === "ios" ? "android" : "ios";
}
function _temp() {}
async function call(onDone) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(MobileQRCode, {
    onDone
  }, undefined, false, undefined, this);
}
var import_compiler_runtime, import_react, jsx_dev_runtime, PLATFORMS;
var init_mobile = __esm(() => {
  init_server();
  init_Pane();
  init_ink();
  init_useKeybinding();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
  PLATFORMS = {
    ios: {
      url: "https://apps.apple.com/app/claude-by-anthropic/id6473753684"
    },
    android: {
      url: "https://play.google.com/store/apps/details?id=com.anthropic.claude"
    }
  };
});
init_mobile();

export {
  call
};
