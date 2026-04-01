// @bun
import {
  call as call2,
  init_upgrade
} from "./chunk-nt5pfwzf.js";
import {
  call,
  init_extra_usage
} from "./chunk-4v6sgaz9.js";
import"./chunk-hnsyzhbv.js";
import"./chunk-1ycmdvzz.js";
import"./chunk-y4tgrnzg.js";
import"./chunk-7p8z8dra.js";
import"./chunk-586jhxa4.js";
import"./chunk-k89c99s6.js";
import {
  Select,
  extraUsage,
  init_claudeAiLimitsHook,
  init_extra_usage as init_extra_usage2,
  init_select,
  init_upgrade as init_upgrade2,
  upgrade_default,
  useClaudeAiLimits
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
  getFeatureValue_CACHED_MAY_BE_STALE,
  getOauthAccountInfo,
  getRateLimitTier,
  getSubscriptionType,
  hasClaudeAiBillingAccess,
  init_auth,
  init_billing,
  init_growthbook
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
