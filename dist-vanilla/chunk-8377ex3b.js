// @bun
import {
  Login,
  init_login
} from "./chunk-04t2yz0f.js";
import {
  init_extra_usage_core,
  runExtraUsage
} from "./chunk-d0xj8268.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/extra-usage/extra-usage.tsx
async function call(onDone, context) {
  const result = await runExtraUsage();
  if (result.type === "message") {
    onDone(result.value);
    return null;
  }
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Login, {
    startingMessage: "Starting new login following /extra-usage. Exit with Ctrl-C to use existing account.",
    onDone: (success) => {
      context.onChangeAPIKey();
      onDone(success ? "Login successful" : "Login interrupted");
    }
  }, undefined, false, undefined, this);
}
var jsx_dev_runtime;
var init_extra_usage = __esm(() => {
  init_login();
  init_extra_usage_core();
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { call, init_extra_usage };
