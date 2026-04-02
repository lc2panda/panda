// @bun
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import {
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/permissions/PermissionDialog.tsx
init_ink();
var import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);

// src/components/permissions/PermissionRequestTitle.tsx
init_ink();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
function PermissionRequestTitle(t0) {
  const $ = import_compiler_runtime.c(13);
  const {
    title,
    subtitle,
    color: t1,
    workerBadge
  } = t0;
  const color = t1 === undefined ? "permission" : t1;
  let t2;
  if ($[0] !== color || $[1] !== title) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      color,
      children: title
    }, undefined, false, undefined, this);
    $[0] = color;
    $[1] = title;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== workerBadge) {
    t3 = workerBadge && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "\xB7 ",
        "@",
        workerBadge.name
      ]
    }, undefined, true, undefined, this);
    $[3] = workerBadge;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] !== t2 || $[6] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "row",
      gap: 1,
      children: [
        t2,
        t3
      ]
    }, undefined, true, undefined, this);
    $[5] = t2;
    $[6] = t3;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== subtitle) {
    t5 = subtitle != null && (typeof subtitle === "string" ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      wrap: "truncate-start",
      children: subtitle
    }, undefined, false, undefined, this) : subtitle);
    $[8] = subtitle;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  let t6;
  if ($[10] !== t4 || $[11] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[10] = t4;
    $[11] = t5;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  return t6;
}

// src/components/permissions/PermissionDialog.tsx
var jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
function PermissionDialog(t0) {
  const $ = import_compiler_runtime2.c(15);
  const {
    title,
    subtitle,
    color: t1,
    titleColor,
    innerPaddingX: t2,
    workerBadge,
    titleRight,
    children
  } = t0;
  const color = t1 === undefined ? "permission" : t1;
  const innerPaddingX = t2 === undefined ? 1 : t2;
  let t3;
  if ($[0] !== subtitle || $[1] !== title || $[2] !== titleColor || $[3] !== workerBadge) {
    t3 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(PermissionRequestTitle, {
      title,
      subtitle,
      color: titleColor,
      workerBadge
    }, undefined, false, undefined, this);
    $[0] = subtitle;
    $[1] = title;
    $[2] = titleColor;
    $[3] = workerBadge;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] !== t3 || $[6] !== titleRight) {
    t4 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      paddingX: 1,
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        justifyContent: "space-between",
        children: [
          t3,
          titleRight
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[5] = t3;
    $[6] = titleRight;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== children || $[9] !== innerPaddingX) {
    t5 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      paddingX: innerPaddingX,
      children
    }, undefined, false, undefined, this);
    $[8] = children;
    $[9] = innerPaddingX;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  let t6;
  if ($[11] !== color || $[12] !== t4 || $[13] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      borderStyle: "round",
      borderColor: color,
      borderLeft: false,
      borderRight: false,
      borderBottom: false,
      marginTop: 1,
      children: [
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[11] = color;
    $[12] = t4;
    $[13] = t5;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  return t6;
}

export { PermissionRequestTitle, PermissionDialog };
