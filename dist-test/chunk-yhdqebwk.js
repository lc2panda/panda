// @bun
import {
  init_pluginIdentifier,
  parsePluginIdentifier
} from "./chunk-65xxc9v8.js";
import {
  getFeatureValue_CACHED_MAY_BE_STALE,
  init_growthbook
} from "./chunk-bt6e264h.js";
import {
  init_v4
} from "./chunk-g0j0t6qk.js";
import {
  exports_external,
  init_lazySchema,
  lazySchema
} from "./chunk-55wgxwa9.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/services/mcp/channelAllowlist.ts
function getChannelAllowlist() {
  const raw = getFeatureValue_CACHED_MAY_BE_STALE("tengu_harbor_ledger", []);
  const parsed = ChannelAllowlistSchema().safeParse(raw);
  return parsed.success ? parsed.data : [];
}
function isChannelsEnabled() {
  return getFeatureValue_CACHED_MAY_BE_STALE("tengu_harbor", false);
}
function isChannelAllowlisted(pluginSource) {
  if (!pluginSource)
    return false;
  const { name, marketplace } = parsePluginIdentifier(pluginSource);
  if (!marketplace)
    return false;
  return getChannelAllowlist().some((e) => e.plugin === name && e.marketplace === marketplace);
}
var ChannelAllowlistSchema;
var init_channelAllowlist = __esm(() => {
  init_v4();
  init_lazySchema();
  init_pluginIdentifier();
  init_growthbook();
  ChannelAllowlistSchema = lazySchema(() => exports_external.array(exports_external.object({
    marketplace: exports_external.string(),
    plugin: exports_external.string()
  })));
});

export { getChannelAllowlist, isChannelsEnabled, isChannelAllowlisted, init_channelAllowlist };
