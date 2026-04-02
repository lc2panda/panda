// @bun
import {
  useManagePlugins
} from "./chunk-mkt1ffx2.js";
import"./chunk-cakknxx1.js";
import {
  WelcomeV2
} from "./chunk-0zcw148q.js";
import {
  onChangeAppState
} from "./chunk-9repn0e3.js";
import"./chunk-x8b7vft8.js";
import"./chunk-vs07phhn.js";
import {
  MCPConnectionManager,
  init_MCPConnectionManager
} from "./chunk-k4yyhds2.js";
import"./chunk-1sdr4gt0.js";
import"./chunk-y585t2zm.js";
import"./chunk-jnyvtta3.js";
import {
  AppStateProvider,
  KeybindingSetup,
  init_AppState,
  init_KeybindingProviderSetup
} from "./chunk-ekfe4t3x.js";
import"./chunk-4xshe7tf.js";
import"./chunk-tdbeghs2.js";
import"./chunk-86h8sspq.js";
import"./chunk-hkxvdww3.js";
import"./chunk-9bwery1w.js";
import"./chunk-4c08gv68.js";
import"./chunk-p9ra2v2f.js";
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
  init_auth,
  isAnthropicAuthEnabled
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
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
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
  __require,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/cli/handlers/util.tsx
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var import_react = __toESM(require_react(), 1);
import { cwd } from "process";
init_ink();
init_KeybindingProviderSetup();
init_analytics();
init_MCPConnectionManager();
init_AppState();
init_auth();
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
async function setupTokenHandler(root) {
  logEvent("tengu_setup_token_command", {});
  const showAuthWarning = !isAnthropicAuthEnabled();
  const {
    ConsoleOAuthFlow
  } = await import("./chunk-ba36zhsx.js");
  await new Promise((resolve) => {
    root.render(/* @__PURE__ */ jsx_dev_runtime.jsxDEV(AppStateProvider, {
      onChangeAppState,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeybindingSetup, {
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          gap: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(WelcomeV2, {}, undefined, false, undefined, this),
            showAuthWarning && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
              flexDirection: "column",
              children: [
                /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  color: "warning",
                  children: "Warning: You already have authentication configured via environment variable or API key helper."
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  color: "warning",
                  children: "The setup-token command will create a new OAuth token which you can use instead."
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConsoleOAuthFlow, {
              onDone: () => {
                resolve();
              },
              mode: "setup-token",
              startingMessage: "This will guide you through long-lived (1-year) auth token setup for your Claude account. Claude subscription required."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this));
  });
  root.unmount();
  process.exit(0);
}
var DoctorLazy = import_react.default.lazy(() => import("./chunk-jbe16p7g.js").then((m) => ({
  default: m.Doctor
})));
function DoctorWithPlugins(t0) {
  const $ = import_compiler_runtime.c(2);
  const {
    onDone
  } = t0;
  useManagePlugins();
  let t1;
  if ($[0] !== onDone) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(import_react.default.Suspense, {
      fallback: null,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(DoctorLazy, {
        onDone
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[0] = onDone;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}
async function doctorHandler(root) {
  logEvent("tengu_doctor_command", {});
  await new Promise((resolve) => {
    root.render(/* @__PURE__ */ jsx_dev_runtime.jsxDEV(AppStateProvider, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeybindingSetup, {
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(MCPConnectionManager, {
          dynamicMcpConfig: undefined,
          isStrictMcpConfig: false,
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(DoctorWithPlugins, {
            onDone: () => {
              resolve();
            }
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this));
  });
  root.unmount();
  process.exit(0);
}
async function installHandler(target, options) {
  const {
    setup
  } = await import("./chunk-034kr93t.js");
  await setup(cwd(), "default", false, false, undefined, false);
  const {
    install
  } = await import("./chunk-yba6s72k.js");
  await new Promise((resolve) => {
    const args = [];
    if (target)
      args.push(target);
    if (options.force)
      args.push("--force");
    install.call((result) => {
      resolve();
      process.exit(result.includes("failed") ? 1 : 0);
    }, {}, args);
  });
}
export {
  setupTokenHandler,
  installHandler,
  doctorHandler
};
