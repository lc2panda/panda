// @bun
import {
  init_ink,
  render,
  require_compiler_runtime,
  use_app_default
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_strip_ansi,
  stripAnsi
} from "./chunk-hsd2zcr5.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/utils/staticRender.tsx
import { PassThrough } from "stream";
function RenderOnceAndExit(t0) {
  const $ = import_compiler_runtime.c(5);
  const {
    children
  } = t0;
  const {
    exit
  } = use_app_default();
  let t1;
  let t2;
  if ($[0] !== exit) {
    t1 = () => {
      const timer = setTimeout(exit, 0);
      return () => clearTimeout(timer);
    };
    t2 = [exit];
    $[0] = exit;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  import_react.useLayoutEffect(t1, t2);
  let t3;
  if ($[3] !== children) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children
    }, undefined, false, undefined, this);
    $[3] = children;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
function extractFirstFrame(output) {
  const startIndex = output.indexOf(SYNC_START);
  if (startIndex === -1)
    return output;
  const contentStart = startIndex + SYNC_START.length;
  const endIndex = output.indexOf(SYNC_END, contentStart);
  if (endIndex === -1)
    return output;
  return output.slice(contentStart, endIndex);
}
function renderToAnsiString(node, columns) {
  return new Promise(async (resolve) => {
    let output = "";
    const stream = new PassThrough;
    if (columns !== undefined) {
      stream.columns = columns;
    }
    stream.on("data", (chunk) => {
      output += chunk.toString();
    });
    const instance = await render(/* @__PURE__ */ jsx_dev_runtime.jsxDEV(RenderOnceAndExit, {
      children: node
    }, undefined, false, undefined, this), {
      stdout: stream,
      patchConsole: false
    });
    await instance.waitUntilExit();
    await resolve(extractFirstFrame(output));
  });
}
async function renderToString(node, columns) {
  const output = await renderToAnsiString(node, columns);
  return stripAnsi(output);
}
var import_compiler_runtime, import_react, jsx_dev_runtime, SYNC_START = "\x1B[?2026h", SYNC_END = "\x1B[?2026l";
var init_staticRender = __esm(() => {
  init_strip_ansi();
  init_ink();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { renderToAnsiString, renderToString, init_staticRender };
