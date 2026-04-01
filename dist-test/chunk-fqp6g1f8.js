// @bun
import {
  Select,
  getCurrentSessionTag,
  getTranscriptPath,
  init_sanitization,
  init_select,
  init_sessionStorage,
  recursivelySanitizeUnicode,
  saveTag
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
  init_source,
  source_default
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
import {
  COMMON_HELP_ARGS,
  COMMON_INFO_ARGS,
  init_xml
} from "./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import"./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import {
  getSessionId,
  init_state
} from "./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/tag/tag.tsx
function ConfirmRemoveTag(t0) {
  const $ = import_compiler_runtime.c(11);
  const {
    tagName,
    onConfirm,
    onCancel
  } = t0;
  const t1 = `Current tag: #${tagName}`;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "This will remove the tag from the current session."
    }, undefined, false, undefined, this);
    $[0] = t2;
  } else {
    t2 = $[0];
  }
  let t3;
  if ($[1] !== onCancel || $[2] !== onConfirm) {
    t3 = (value) => value === "yes" ? onConfirm() : onCancel();
    $[1] = onCancel;
    $[2] = onConfirm;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  let t4;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = [{
      label: "Yes, remove tag",
      value: "yes"
    }, {
      label: "No, keep tag",
      value: "no"
    }];
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  let t5;
  if ($[5] !== t3) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t2,
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
          onChange: t3,
          options: t4
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[5] = t3;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  let t6;
  if ($[7] !== onCancel || $[8] !== t1 || $[9] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Remove tag?",
      subtitle: t1,
      onCancel,
      color: "warning",
      children: t5
    }, undefined, false, undefined, this);
    $[7] = onCancel;
    $[8] = t1;
    $[9] = t5;
    $[10] = t6;
  } else {
    t6 = $[10];
  }
  return t6;
}
function ToggleTagAndClose(t0) {
  const $ = import_compiler_runtime.c(17);
  const {
    tagName,
    onDone
  } = t0;
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [sessionId, setSessionId] = React.useState(null);
  let t1;
  if ($[0] !== tagName) {
    t1 = recursivelySanitizeUnicode(tagName).trim();
    $[0] = tagName;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const normalizedTag = t1;
  let t2;
  let t3;
  if ($[2] !== normalizedTag || $[3] !== onDone) {
    t2 = () => {
      const id = getSessionId();
      if (!id) {
        onDone("No active session to tag", {
          display: "system"
        });
        return;
      }
      if (!normalizedTag) {
        onDone("Tag name cannot be empty", {
          display: "system"
        });
        return;
      }
      setSessionId(id);
      const currentTag = getCurrentSessionTag(id);
      if (currentTag === normalizedTag) {
        logEvent("tengu_tag_command_remove_prompt", {});
        setShowConfirm(true);
      } else {
        const isReplacing = !!currentTag;
        logEvent("tengu_tag_command_add", {
          is_replacing: isReplacing
        });
        (async () => {
          const fullPath = getTranscriptPath();
          await saveTag(id, normalizedTag, fullPath);
          onDone(`Tagged session with ${source_default.cyan(`#${normalizedTag}`)}`, {
            display: "system"
          });
        })();
      }
    };
    t3 = [normalizedTag, onDone];
    $[2] = normalizedTag;
    $[3] = onDone;
    $[4] = t2;
    $[5] = t3;
  } else {
    t2 = $[4];
    t3 = $[5];
  }
  React.useEffect(t2, t3);
  if (showConfirm && sessionId) {
    let t4;
    if ($[6] !== normalizedTag || $[7] !== onDone || $[8] !== sessionId) {
      t4 = async () => {
        logEvent("tengu_tag_command_remove_confirmed", {});
        const fullPath_0 = getTranscriptPath();
        await saveTag(sessionId, "", fullPath_0);
        onDone(`Removed tag ${source_default.cyan(`#${normalizedTag}`)}`, {
          display: "system"
        });
      };
      $[6] = normalizedTag;
      $[7] = onDone;
      $[8] = sessionId;
      $[9] = t4;
    } else {
      t4 = $[9];
    }
    let t5;
    if ($[10] !== normalizedTag || $[11] !== onDone) {
      t5 = () => {
        logEvent("tengu_tag_command_remove_cancelled", {});
        onDone(`Kept tag ${source_default.cyan(`#${normalizedTag}`)}`, {
          display: "system"
        });
      };
      $[10] = normalizedTag;
      $[11] = onDone;
      $[12] = t5;
    } else {
      t5 = $[12];
    }
    let t6;
    if ($[13] !== normalizedTag || $[14] !== t4 || $[15] !== t5) {
      t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfirmRemoveTag, {
        tagName: normalizedTag,
        onConfirm: t4,
        onCancel: t5
      }, undefined, false, undefined, this);
      $[13] = normalizedTag;
      $[14] = t4;
      $[15] = t5;
      $[16] = t6;
    } else {
      t6 = $[16];
    }
    return t6;
  }
  return null;
}
function ShowHelp(t0) {
  const $ = import_compiler_runtime.c(3);
  const {
    onDone
  } = t0;
  let t1;
  let t2;
  if ($[0] !== onDone) {
    t1 = () => {
      onDone(`Usage: /tag <tag-name>

Toggle a searchable tag on the current session.
Run the same command again to remove the tag.
Tags are displayed after the branch name in /resume and can be searched with /.

Examples:
  /tag bugfix        # Add tag
  /tag bugfix        # Remove tag (toggle)
  /tag feature-auth
  /tag wip`, {
        display: "system"
      });
    };
    t2 = [onDone];
    $[0] = onDone;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  React.useEffect(t1, t2);
  return null;
}
async function call(onDone, _context, args) {
  args = args?.trim() || "";
  if (COMMON_INFO_ARGS.includes(args) || COMMON_HELP_ARGS.includes(args)) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ShowHelp, {
      onDone
    }, undefined, false, undefined, this);
  }
  if (!args) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ShowHelp, {
      onDone
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ToggleTagAndClose, {
    tagName: args,
    onDone
  }, undefined, false, undefined, this);
}
var import_compiler_runtime, React, jsx_dev_runtime;
var init_tag = __esm(() => {
  init_source();
  init_state();
  init_select();
  init_Dialog();
  init_xml();
  init_ink();
  init_analytics();
  init_sanitization();
  init_sessionStorage();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  React = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});
init_tag();

export {
  call
};
