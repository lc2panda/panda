// @bun
import {
  AGENT_SOURCE_GROUPS,
  compareAgentsByName,
  getOverrideSourceLabel,
  init_agentDisplay,
  resolveAgentModelDisplay,
  resolveAgentOverrides
} from "./chunk-spkrcgjr.js";
import {
  getActiveAgentsFromList,
  getAgentDefinitionsWithOverrides,
  init_loadAgentsDir
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
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
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
import"./chunk-qp2qdcda.js";

// src/cli/handlers/agents.ts
init_agentDisplay();
init_loadAgentsDir();
init_cwd();
function formatAgent(agent) {
  const model = resolveAgentModelDisplay(agent);
  const parts = [agent.agentType];
  if (model) {
    parts.push(model);
  }
  if (agent.memory) {
    parts.push(`${agent.memory} memory`);
  }
  return parts.join(" \xB7 ");
}
async function agentsHandler() {
  const cwd = getCwd();
  const { allAgents } = await getAgentDefinitionsWithOverrides(cwd);
  const activeAgents = getActiveAgentsFromList(allAgents);
  const resolvedAgents = resolveAgentOverrides(allAgents, activeAgents);
  const lines = [];
  let totalActive = 0;
  for (const { label, source } of AGENT_SOURCE_GROUPS) {
    const groupAgents = resolvedAgents.filter((a) => a.source === source).sort(compareAgentsByName);
    if (groupAgents.length === 0)
      continue;
    lines.push(`${label}:`);
    for (const agent of groupAgents) {
      if (agent.overriddenBy) {
        const winnerSource = getOverrideSourceLabel(agent.overriddenBy);
        lines.push(`  (shadowed by ${winnerSource}) ${formatAgent(agent)}`);
      } else {
        lines.push(`  ${formatAgent(agent)}`);
        totalActive++;
      }
    }
    lines.push("");
  }
  if (lines.length === 0) {
    console.log("No agents found.");
  } else {
    console.log(`${totalActive} active agents
`);
    console.log(lines.join(`
`).trimEnd());
  }
}
export {
  agentsHandler
};
