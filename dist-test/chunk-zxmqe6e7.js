// @bun
import {
  removePathFromRepo,
  validateRepoAtPath
} from "./chunk-2vckrned.js";
import {
  Select,
  Spinner,
  init_CustomSelect,
  init_Spinner
} from "./chunk-jwtmq3ad.js";
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
import"./chunk-73qtc7a9.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-2e5y8sgq.js";
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
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  getDisplayPath,
  init_file
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

// src/components/TeleportRepoMismatchDialog.tsx
init_ink();
init_file();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var import_react = __toESM(require_react(), 1);
init_CustomSelect();
init_Dialog();
init_Spinner();
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
function TeleportRepoMismatchDialog(t0) {
  const $ = import_compiler_runtime.c(18);
  const {
    targetRepo,
    initialPaths,
    onSelectPath,
    onCancel
  } = t0;
  const [availablePaths, setAvailablePaths] = import_react.useState(initialPaths);
  const [errorMessage, setErrorMessage] = import_react.useState(null);
  const [validating, setValidating] = import_react.useState(false);
  let t1;
  if ($[0] !== availablePaths || $[1] !== onCancel || $[2] !== onSelectPath || $[3] !== targetRepo) {
    t1 = async (value) => {
      if (value === "cancel") {
        onCancel();
        return;
      }
      setValidating(true);
      setErrorMessage(null);
      const isValid = await validateRepoAtPath(value, targetRepo);
      if (isValid) {
        onSelectPath(value);
        return;
      }
      removePathFromRepo(targetRepo, value);
      const updatedPaths = availablePaths.filter((p) => p !== value);
      setAvailablePaths(updatedPaths);
      setValidating(false);
      setErrorMessage(`${getDisplayPath(value)} no longer contains the correct repository. Select another path.`);
    };
    $[0] = availablePaths;
    $[1] = onCancel;
    $[2] = onSelectPath;
    $[3] = targetRepo;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const handleChange = t1;
  let t2;
  if ($[5] !== availablePaths) {
    let t32;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t32 = {
        label: "Cancel",
        value: "cancel"
      };
      $[7] = t32;
    } else {
      t32 = $[7];
    }
    t2 = [...availablePaths.map(_temp), t32];
    $[5] = availablePaths;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  const options = t2;
  let t3;
  if ($[8] !== availablePaths.length || $[9] !== errorMessage || $[10] !== handleChange || $[11] !== options || $[12] !== targetRepo || $[13] !== validating) {
    t3 = availablePaths.length > 0 ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          gap: 1,
          children: [
            errorMessage && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              color: "error",
              children: errorMessage
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: [
                "Open Panda Code in ",
                /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  bold: true,
                  children: targetRepo
                }, undefined, false, undefined, this),
                ":"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        validating ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: " Validating repository\u2026"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
          options,
          onChange: (value_0) => void handleChange(value_0)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        errorMessage && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "error",
          children: errorMessage
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "Run claude --teleport from a checkout of ",
            targetRepo
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[8] = availablePaths.length;
    $[9] = errorMessage;
    $[10] = handleChange;
    $[11] = options;
    $[12] = targetRepo;
    $[13] = validating;
    $[14] = t3;
  } else {
    t3 = $[14];
  }
  let t4;
  if ($[15] !== onCancel || $[16] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Teleport to Repo",
      onCancel,
      color: "background",
      children: t3
    }, undefined, false, undefined, this);
    $[15] = onCancel;
    $[16] = t3;
    $[17] = t4;
  } else {
    t4 = $[17];
  }
  return t4;
}
function _temp(path) {
  return {
    label: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "Use ",
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: getDisplayPath(path)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this),
    value: path
  };
}
export {
  TeleportRepoMismatchDialog
};
