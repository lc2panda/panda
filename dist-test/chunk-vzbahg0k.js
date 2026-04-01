// @bun
import {
  useManagePlugins
} from "./chunk-tcvcmfet.js";
import"./chunk-ta2mcxm9.js";
import {
  WelcomeV2
} from "./chunk-angb4he4.js";
import {
  onChangeAppState
} from "./chunk-8f7jp608.js";
import"./chunk-jnepefk8.js";
import"./chunk-x8b7vft8.js";
import {
  MCPConnectionManager,
  init_MCPConnectionManager
} from "./chunk-x7w5872j.js";
import"./chunk-xangvvta.js";
import"./chunk-tehf7yb8.js";
import"./chunk-9vz0twjz.js";
import"./chunk-fs7eaved.js";
import"./chunk-yhdqebwk.js";
import {
  AppStateProvider,
  KeybindingSetup,
  init_AppState,
  init_KeybindingProviderSetup
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
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
  init_auth,
  isAnthropicAuthEnabled
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
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
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
  } = await import("./chunk-bzd09jrk.js");
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
var DoctorLazy = import_react.default.lazy(() => import("./chunk-jzsrqct0.js").then((m) => ({
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
  } = await import("./chunk-rpefh1h9.js");
  await setup(cwd(), "default", false, false, undefined, false);
  const {
    install
  } = await import("./chunk-1zymmmr4.js");
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
