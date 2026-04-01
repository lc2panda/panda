// @bun
import {
  $toString,
  init_server
} from "./chunk-jdgeec04.js";
import {
  init_AppState,
  useAppState
} from "./chunk-wk0emb79.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-ngnveex9.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-2e5y8sgq.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-zz424j25.js";
import"./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
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
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
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
import"./chunk-n9s3rq14.js";
import"./chunk-4jm600zv.js";
import"./chunk-zfp09a4r.js";
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
import {
  init_debug,
  logForDebugging
} from "./chunk-71hncdva.js";
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

// src/commands/session/session.tsx
function SessionInfo(t0) {
  const $ = import_compiler_runtime.c(19);
  const {
    onDone
  } = t0;
  const remoteSessionUrl = useAppState(_temp);
  const [qrCode, setQrCode] = import_react.useState("");
  let t1;
  let t2;
  if ($[0] !== remoteSessionUrl) {
    t1 = () => {
      if (!remoteSessionUrl) {
        return;
      }
      const url = remoteSessionUrl;
      const generateQRCode = async function generateQRCode2() {
        const qr = await $toString(url, {
          type: "utf8",
          errorCorrectionLevel: "L"
        });
        setQrCode(qr);
      };
      generateQRCode().catch(_temp2);
    };
    t2 = [remoteSessionUrl];
    $[0] = remoteSessionUrl;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  import_react.useEffect(t1, t2);
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = {
      context: "Confirmation"
    };
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  useKeybinding("confirm:no", onDone, t3);
  if (!remoteSessionUrl) {
    let t42;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Pane, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "warning",
            children: "Not in remote mode. Start with `claude --remote` to use this command."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: "(press esc to close)"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[4] = t42;
    } else {
      t42 = $[4];
    }
    return t42;
  }
  let T0;
  let t4;
  let t5;
  if ($[5] !== qrCode) {
    const lines = qrCode.split(`
`).filter(_temp3);
    const isLoading = lines.length === 0;
    T0 = Pane;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: "Remote session"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[9] = t4;
    } else {
      t4 = $[9];
    }
    t5 = isLoading ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Generating QR code\u2026"
    }, undefined, false, undefined, this) : lines.map(_temp4);
    $[5] = qrCode;
    $[6] = T0;
    $[7] = t4;
    $[8] = t5;
  } else {
    T0 = $[6];
    t4 = $[7];
    t5 = $[8];
  }
  let t6;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Open in browser: "
    }, undefined, false, undefined, this);
    $[10] = t6;
  } else {
    t6 = $[10];
  }
  let t7;
  if ($[11] !== remoteSessionUrl) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: [
        t6,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "ide",
          children: remoteSessionUrl
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[11] = remoteSessionUrl;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  let t8;
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: "(press esc to close)"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[13] = t8;
  } else {
    t8 = $[13];
  }
  let t9;
  if ($[14] !== T0 || $[15] !== t4 || $[16] !== t5 || $[17] !== t7) {
    t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T0, {
      children: [
        t4,
        t5,
        t7,
        t8
      ]
    }, undefined, true, undefined, this);
    $[14] = T0;
    $[15] = t4;
    $[16] = t5;
    $[17] = t7;
    $[18] = t9;
  } else {
    t9 = $[18];
  }
  return t9;
}
function _temp4(line_0, i) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
    children: line_0
  }, i, false, undefined, this);
}
function _temp3(line) {
  return line.length > 0;
}
function _temp2(e) {
  logForDebugging("QR code generation failed", e);
}
function _temp(s) {
  return s.remoteSessionUrl;
}
var import_compiler_runtime, import_react, jsx_dev_runtime, call = async (onDone) => {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(SessionInfo, {
    onDone
  }, undefined, false, undefined, this);
};
var init_session = __esm(() => {
  init_server();
  init_Pane();
  init_ink();
  init_useKeybinding();
  init_AppState();
  init_debug();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});
init_session();

export {
  call
};
