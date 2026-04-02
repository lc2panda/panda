// @bun
import {
  removePathFromRepo,
  validateRepoAtPath
} from "./chunk-2d5e1eaw.js";
import {
  Select,
  Spinner,
  init_CustomSelect,
  init_Spinner
} from "./chunk-ekfe4t3x.js";
import"./chunk-4xshe7tf.js";
import"./chunk-tdbeghs2.js";
import"./chunk-86h8sspq.js";
import"./chunk-hkxvdww3.js";
import"./chunk-9bwery1w.js";
import"./chunk-4c08gv68.js";
import {
  Dialog,
  init_Dialog
} from "./chunk-p9ra2v2f.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-4cwfa7zk.js";
import"./chunk-mjd4qde5.js";
import"./chunk-5g7gx4y7.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-sknn7p3z.js";
import"./chunk-2hb5pyjj.js";
import"./chunk-9gbamk79.js";
import"./chunk-1hjzbne1.js";
import"./chunk-djq17a7g.js";
import"./chunk-gypetngm.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import"./chunk-7nbhgtwq.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-73re2yq9.js";
import"./chunk-j30w257d.js";
import"./chunk-fxerh6v6.js";
import {
  getDisplayPath,
  init_file
} from "./chunk-w5d5b7r0.js";
import"./chunk-0f1005z8.js";
import"./chunk-ccq9c4dq.js";
import"./chunk-tg3zbmz7.js";
import"./chunk-3asghxv4.js";
import"./chunk-xk4zgzx2.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-2g1tm0n3.js";
import"./chunk-55wgxwa9.js";
import"./chunk-tbpx2160.js";
import"./chunk-4jm600zv.js";
import"./chunk-7np1pz21.js";
import"./chunk-5cqfqj5r.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-1mc1wz9m.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import"./chunk-ywhstzac.js";
import"./chunk-cdz5yb0r.js";
import"./chunk-47cb3k0q.js";
import"./chunk-c4pgn9ph.js";
import"./chunk-bjwxx22f.js";
import"./chunk-tjd99w4c.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-7z9e9ndj.js";
import"./chunk-sctqkknr.js";
import"./chunk-ehab6nmr.js";
import"./chunk-myphr2va.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import"./chunk-cv4r43rj.js";
import"./chunk-fbv4apne.js";
import"./chunk-er95axp1.js";
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
