// @bun
import {
  getBridgeBaseUrlOverride,
  getBridgeTokenOverride,
  init_bridgeConfig
} from "./chunk-0rr92msc.js";
import {
  generateSessionName,
  init_generateSessionName
} from "./chunk-npd1fxd2.js";
import"./chunk-pc2kk6wc.js";
import {
  getMessagesAfterCompactBoundary,
  getTranscriptPath,
  init_messages1 as init_messages,
  init_sessionStorage,
  saveAgentName,
  saveCustomTitle
} from "./chunk-wk0emb79.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-ngnveex9.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-2e5y8sgq.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-zz424j25.js";
import"./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import"./chunk-x2y5syym.js";
import"./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import"./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import"./chunk-bt6e264h.js";
import"./chunk-y9h5c3hn.js";
import"./chunk-7rxmkr8t.js";
import"./chunk-vratq94g.js";
import"./chunk-7gjw150h.js";
import {
  init_teammate,
  isTeammate
} from "./chunk-0e1xsncc.js";
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
  __require
} from "./chunk-qp2qdcda.js";

// src/commands/rename/rename.ts
async function call(onDone, context, args) {
  if (isTeammate()) {
    onDone("Cannot rename: This session is a swarm teammate. Teammate names are set by the team leader.", { display: "system" });
    return null;
  }
  let newName;
  if (!args || args.trim() === "") {
    const generated = await generateSessionName(getMessagesAfterCompactBoundary(context.messages), context.abortController.signal);
    if (!generated) {
      onDone("Could not generate a name: no conversation context yet. Usage: /rename <name>", { display: "system" });
      return null;
    }
    newName = generated;
  } else {
    newName = args.trim();
  }
  const sessionId = getSessionId();
  const fullPath = getTranscriptPath();
  await saveCustomTitle(sessionId, newName, fullPath);
  const appState = context.getAppState();
  const bridgeSessionId = appState.replBridgeSessionId;
  if (bridgeSessionId) {
    const tokenOverride = getBridgeTokenOverride();
    import("./chunk-4svejd03.js").then(({ updateBridgeSessionTitle }) => updateBridgeSessionTitle(bridgeSessionId, newName, {
      baseUrl: getBridgeBaseUrlOverride(),
      getAccessToken: tokenOverride ? () => tokenOverride : undefined
    }).catch(() => {}));
  }
  await saveAgentName(sessionId, newName, fullPath);
  context.setAppState((prev) => ({
    ...prev,
    standaloneAgentContext: {
      ...prev.standaloneAgentContext,
      name: newName
    }
  }));
  onDone(`Session renamed to: ${newName}`, { display: "system" });
  return null;
}
var init_rename = __esm(() => {
  init_state();
  init_bridgeConfig();
  init_messages();
  init_sessionStorage();
  init_teammate();
  init_generateSessionName();
});
init_rename();

export {
  call
};
