// @bun
import {
  call as call2,
  init_upgrade
} from "./chunk-03pczf9s.js";
import {
  call,
  init_extra_usage
} from "./chunk-8377ex3b.js";
import"./chunk-04t2yz0f.js";
import"./chunk-2k91ndxd.js";
import"./chunk-2fpyr1jm.js";
import"./chunk-d0xj8268.js";
import"./chunk-kptsbbzr.js";
import"./chunk-q94ke0f1.js";
import {
  Select,
  extraUsage,
  init_claudeAiLimitsHook,
  init_extra_usage as init_extra_usage2,
  init_select,
  init_upgrade as init_upgrade2,
  upgrade_default,
  useClaudeAiLimits
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
  getFeatureValue_CACHED_MAY_BE_STALE,
  getOauthAccountInfo,
  getRateLimitTier,
  getSubscriptionType,
  hasClaudeAiBillingAccess,
  init_auth,
  init_billing,
  init_growthbook
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
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/rate-limit-options/rate-limit-options.tsx
function RateLimitOptionsMenu(t0) {
  const $ = import_compiler_runtime.c(25);
  const {
    onDone,
    context
  } = t0;
  const [subCommandJSX, setSubCommandJSX] = import_react.useState(null);
  const claudeAiLimits = useClaudeAiLimits();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getSubscriptionType();
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const subscriptionType = t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = getRateLimitTier();
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const rateLimitTier = t2;
  const hasExtraUsageEnabled = getOauthAccountInfo()?.hasExtraUsageEnabled === true;
  const isMax = subscriptionType === "max";
  const isMax20x = isMax && rateLimitTier === "default_claude_max_20x";
  const isTeamOrEnterprise = subscriptionType === "team" || subscriptionType === "enterprise";
  const buyFirst = getFeatureValue_CACHED_MAY_BE_STALE("tengu_jade_anvil_4", false);
  let t3;
  bb0: {
    let actionOptions;
    if ($[2] !== claudeAiLimits.overageDisabledReason || $[3] !== claudeAiLimits.overageStatus) {
      actionOptions = [];
      if (extraUsage.isEnabled()) {
        const hasBillingAccess = hasClaudeAiBillingAccess();
        const needsToRequestFromAdmin = isTeamOrEnterprise && !hasBillingAccess;
        const isOrgSpendCapDepleted = claudeAiLimits.overageDisabledReason === "out_of_credits" || claudeAiLimits.overageDisabledReason === "org_level_disabled_until" || claudeAiLimits.overageDisabledReason === "org_service_zero_credit_limit";
        if (needsToRequestFromAdmin && isOrgSpendCapDepleted) {} else {
          const isOverageState = claudeAiLimits.overageStatus === "rejected" || claudeAiLimits.overageStatus === "allowed_warning";
          let label;
          if (needsToRequestFromAdmin) {
            label = isOverageState ? "Request more" : "Request extra usage";
          } else {
            label = hasExtraUsageEnabled ? "Add funds to continue with extra usage" : "Switch to extra usage";
          }
          let t43;
          if ($[5] !== label) {
            t43 = {
              label,
              value: "extra-usage"
            };
            $[5] = label;
            $[6] = t43;
          } else {
            t43 = $[6];
          }
          actionOptions.push(t43);
        }
      }
      if (!isMax20x && !isTeamOrEnterprise && upgrade_default.isEnabled()) {
        let t43;
        if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
          t43 = {
            label: "Upgrade your plan",
            value: "upgrade"
          };
          $[7] = t43;
        } else {
          t43 = $[7];
        }
        actionOptions.push(t43);
      }
      $[2] = claudeAiLimits.overageDisabledReason;
      $[3] = claudeAiLimits.overageStatus;
      $[4] = actionOptions;
    } else {
      actionOptions = $[4];
    }
    let t42;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = {
        label: "Stop and wait for limit to reset",
        value: "cancel"
      };
      $[8] = t42;
    } else {
      t42 = $[8];
    }
    const cancelOption = t42;
    if (buyFirst) {
      let t53;
      if ($[9] !== actionOptions) {
        t53 = [...actionOptions, cancelOption];
        $[9] = actionOptions;
        $[10] = t53;
      } else {
        t53 = $[10];
      }
      t3 = t53;
      break bb0;
    }
    let t52;
    if ($[11] !== actionOptions) {
      t52 = [cancelOption, ...actionOptions];
      $[11] = actionOptions;
      $[12] = t52;
    } else {
      t52 = $[12];
    }
    t3 = t52;
  }
  const options = t3;
  let t4;
  if ($[13] !== onDone) {
    t4 = function handleCancel2() {
      logEvent("tengu_rate_limit_options_menu_cancel", {});
      onDone(undefined, {
        display: "skip"
      });
    };
    $[13] = onDone;
    $[14] = t4;
  } else {
    t4 = $[14];
  }
  const handleCancel = t4;
  let t5;
  if ($[15] !== context || $[16] !== handleCancel || $[17] !== onDone) {
    t5 = function handleSelect2(value) {
      if (value === "upgrade") {
        logEvent("tengu_rate_limit_options_menu_select_upgrade", {});
        call2(onDone, context).then((jsx) => {
          if (jsx) {
            setSubCommandJSX(jsx);
          }
        });
      } else {
        if (value === "extra-usage") {
          logEvent("tengu_rate_limit_options_menu_select_extra_usage", {});
          call(onDone, context).then((jsx_0) => {
            if (jsx_0) {
              setSubCommandJSX(jsx_0);
            }
          });
        } else {
          if (value === "cancel") {
            handleCancel();
          }
        }
      }
    };
    $[15] = context;
    $[16] = handleCancel;
    $[17] = onDone;
    $[18] = t5;
  } else {
    t5 = $[18];
  }
  const handleSelect = t5;
  if (subCommandJSX) {
    return subCommandJSX;
  }
  let t6;
  if ($[19] !== handleSelect || $[20] !== options) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      options,
      onChange: handleSelect,
      visibleOptionCount: options.length
    }, undefined, false, undefined, this);
    $[19] = handleSelect;
    $[20] = options;
    $[21] = t6;
  } else {
    t6 = $[21];
  }
  let t7;
  if ($[22] !== handleCancel || $[23] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "What do you want to do?",
      onCancel: handleCancel,
      color: "suggestion",
      children: t6
    }, undefined, false, undefined, this);
    $[22] = handleCancel;
    $[23] = t6;
    $[24] = t7;
  } else {
    t7 = $[24];
  }
  return t7;
}
async function call3(onDone, context) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(RateLimitOptionsMenu, {
    onDone,
    context
  }, undefined, false, undefined, this);
}
var import_compiler_runtime, import_react, jsx_dev_runtime;
var init_rate_limit_options = __esm(() => {
  init_select();
  init_Dialog();
  init_growthbook();
  init_analytics();
  init_claudeAiLimitsHook();
  init_auth();
  init_billing();
  init_extra_usage();
  init_extra_usage2();
  init_upgrade2();
  init_upgrade();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});
init_rate_limit_options();

export {
  call3 as call
};
