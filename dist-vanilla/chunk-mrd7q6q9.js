// @bun
import {
  AGENT_COLORS,
  getTranscriptPath,
  init_agentColorManager,
  init_sessionStorage,
  saveAgentColor
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
import"./chunk-qjz5kp97.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import"./chunk-g338npwr.js";
import"./chunk-7nbhgtwq.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-73re2yq9.js";
import"./chunk-j30w257d.js";
import"./chunk-fxerh6v6.js";
import"./chunk-w5d5b7r0.js";
import"./chunk-0f1005z8.js";
import"./chunk-ccq9c4dq.js";
import"./chunk-tg3zbmz7.js";
import"./chunk-3asghxv4.js";
import {
  init_teammate,
  isTeammate
} from "./chunk-xk4zgzx2.js";
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
  __esm
} from "./chunk-qp2qdcda.js";

// src/commands/color/color.ts
async function call(onDone, context, args) {
  if (isTeammate()) {
    onDone("Cannot set color: This session is a swarm teammate. Teammate colors are assigned by the team leader.", { display: "system" });
    return null;
  }
  if (!args || args.trim() === "") {
    const colorList = AGENT_COLORS.join(", ");
    onDone(`Please provide a color. Available colors: ${colorList}, default`, {
      display: "system"
    });
    return null;
  }
  const colorArg = args.trim().toLowerCase();
  if (RESET_ALIASES.includes(colorArg)) {
    const sessionId2 = getSessionId();
    const fullPath2 = getTranscriptPath();
    await saveAgentColor(sessionId2, "default", fullPath2);
    context.setAppState((prev) => ({
      ...prev,
      standaloneAgentContext: {
        ...prev.standaloneAgentContext,
        name: prev.standaloneAgentContext?.name ?? "",
        color: undefined
      }
    }));
    onDone("Session color reset to default", { display: "system" });
    return null;
  }
  if (!AGENT_COLORS.includes(colorArg)) {
    const colorList = AGENT_COLORS.join(", ");
    onDone(`Invalid color "${colorArg}". Available colors: ${colorList}, default`, { display: "system" });
    return null;
  }
  const sessionId = getSessionId();
  const fullPath = getTranscriptPath();
  await saveAgentColor(sessionId, colorArg, fullPath);
  context.setAppState((prev) => ({
    ...prev,
    standaloneAgentContext: {
      ...prev.standaloneAgentContext,
      name: prev.standaloneAgentContext?.name ?? "",
      color: colorArg
    }
  }));
  onDone(`Session color set to: ${colorArg}`, { display: "system" });
  return null;
}
var RESET_ALIASES;
var init_color = __esm(() => {
  init_state();
  init_agentColorManager();
  init_sessionStorage();
  init_teammate();
  RESET_ALIASES = ["default", "reset", "none", "gray", "grey"];
});
init_color();

export {
  call
};
