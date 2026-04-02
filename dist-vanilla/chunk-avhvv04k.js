// @bun
import {
  AGENT_SOURCE_GROUPS,
  compareAgentsByName,
  getOverrideSourceLabel,
  init_agentDisplay,
  resolveAgentModelDisplay,
  resolveAgentOverrides
} from "./chunk-0a1qykpg.js";
import {
  getActiveAgentsFromList,
  getAgentDefinitionsWithOverrides,
  init_loadAgentsDir
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
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
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
