// @bun
import {
  init_partition,
  partition_default
} from "./chunk-e0n3wce0.js";
import {
  init_tools,
  init_uniqBy,
  init_utils,
  isMcpTool,
  uniqBy_default
} from "./chunk-ekfe4t3x.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/utils/toolPool.ts
function mergeAndFilterTools(initialTools, assembled, mode) {
  const [mcp, builtIn] = partition_default(uniqBy_default([...initialTools, ...assembled], "name"), isMcpTool);
  const byName = (a, b) => a.name.localeCompare(b.name);
  const tools = [...builtIn.sort(byName), ...mcp.sort(byName)];
  if (false) {}
  return tools;
}
var init_toolPool = __esm(() => {
  init_partition();
  init_uniqBy();
  init_tools();
  init_utils();
});

export { mergeAndFilterTools, init_toolPool };
