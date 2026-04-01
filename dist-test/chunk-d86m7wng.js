// @bun
import {
  getChannelAllowlist,
  init_channelAllowlist,
  isChannelsEnabled
} from "./chunk-yhdqebwk.js";
import {
  escapeXmlAttr,
  init_xml as init_xml2
} from "./chunk-wk0emb79.js";
import {
  init_pluginIdentifier,
  parsePluginIdentifier
} from "./chunk-65xxc9v8.js";
import {
  getClaudeAIOAuthTokens,
  getSettingsForSource,
  getSubscriptionType,
  init_auth,
  init_settings1 as init_settings
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
  CHANNEL_TAG,
  init_xml
} from "./chunk-43vdtd69.js";
import {
  getAllowedChannels,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/services/mcp/channelNotification.ts
function wrapChannelMessage(serverName, content, meta) {
  const attrs = Object.entries(meta ?? {}).filter(([k]) => SAFE_META_KEY.test(k)).map(([k, v]) => ` ${k}="${escapeXmlAttr(v)}"`).join("");
  return `<${CHANNEL_TAG} source="${escapeXmlAttr(serverName)}"${attrs}>
${content}
</${CHANNEL_TAG}>`;
}
function getEffectiveChannelAllowlist(sub, orgList) {
  if ((sub === "team" || sub === "enterprise") && orgList) {
    return { entries: orgList, source: "org" };
  }
  return { entries: getChannelAllowlist(), source: "ledger" };
}
function findChannelEntry(serverName, channels) {
  const parts = serverName.split(":");
  return channels.find((c) => c.kind === "server" ? serverName === c.name : parts[0] === "plugin" && parts[1] === c.name);
}
function gateChannelServer(serverName, capabilities, pluginSource) {
  if (!capabilities?.experimental?.["claude/channel"]) {
    return {
      action: "skip",
      kind: "capability",
      reason: "server did not declare claude/channel capability"
    };
  }
  if (!isChannelsEnabled()) {
    return {
      action: "skip",
      kind: "disabled",
      reason: "channels feature is not currently available"
    };
  }
  if (!getClaudeAIOAuthTokens()?.accessToken) {
    return {
      action: "skip",
      kind: "auth",
      reason: "channels requires claude.ai authentication (run /login)"
    };
  }
  const sub = getSubscriptionType();
  const managed = sub === "team" || sub === "enterprise";
  const policy = managed ? getSettingsForSource("policySettings") : undefined;
  if (managed && policy?.channelsEnabled !== true) {
    return {
      action: "skip",
      kind: "policy",
      reason: "channels not enabled by org policy (set channelsEnabled: true in managed settings)"
    };
  }
  const entry = findChannelEntry(serverName, getAllowedChannels());
  if (!entry) {
    return {
      action: "skip",
      kind: "session",
      reason: `server ${serverName} not in --channels list for this session`
    };
  }
  if (entry.kind === "plugin") {
    const actual = pluginSource ? parsePluginIdentifier(pluginSource).marketplace : undefined;
    if (actual !== entry.marketplace) {
      return {
        action: "skip",
        kind: "marketplace",
        reason: `you asked for plugin:${entry.name}@${entry.marketplace} but the installed ${entry.name} plugin is from ${actual ?? "an unknown source"}`
      };
    }
    if (!entry.dev) {
      const { entries, source } = getEffectiveChannelAllowlist(sub, policy?.allowedChannelPlugins);
      if (!entries.some((e) => e.plugin === entry.name && e.marketplace === entry.marketplace)) {
        return {
          action: "skip",
          kind: "allowlist",
          reason: source === "org" ? `plugin ${entry.name}@${entry.marketplace} is not on your org's approved channels list (set allowedChannelPlugins in managed settings)` : `plugin ${entry.name}@${entry.marketplace} is not on the approved channels allowlist (use --dangerously-load-development-channels for local dev)`
        };
      }
    }
  } else {
    if (!entry.dev) {
      return {
        action: "skip",
        kind: "allowlist",
        reason: `server ${entry.name} is not on the approved channels allowlist (use --dangerously-load-development-channels for local dev)`
      };
    }
  }
  return { action: "register" };
}
var ChannelMessageNotificationSchema, CHANNEL_PERMISSION_METHOD = "notifications/claude/channel/permission", ChannelPermissionNotificationSchema, CHANNEL_PERMISSION_REQUEST_METHOD = "notifications/claude/channel/permission_request", SAFE_META_KEY;
var init_channelNotification = __esm(() => {
  init_v4();
  init_state();
  init_xml();
  init_auth();
  init_lazySchema();
  init_pluginIdentifier();
  init_settings();
  init_xml2();
  init_channelAllowlist();
  ChannelMessageNotificationSchema = lazySchema(() => exports_external.object({
    method: exports_external.literal("notifications/claude/channel"),
    params: exports_external.object({
      content: exports_external.string(),
      meta: exports_external.record(exports_external.string(), exports_external.string()).optional()
    })
  }));
  ChannelPermissionNotificationSchema = lazySchema(() => exports_external.object({
    method: exports_external.literal(CHANNEL_PERMISSION_METHOD),
    params: exports_external.object({
      request_id: exports_external.string(),
      behavior: exports_external.enum(["allow", "deny"])
    })
  }));
  SAFE_META_KEY = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
});

export { ChannelMessageNotificationSchema, CHANNEL_PERMISSION_METHOD, ChannelPermissionNotificationSchema, CHANNEL_PERMISSION_REQUEST_METHOD, wrapChannelMessage, getEffectiveChannelAllowlist, findChannelEntry, gateChannelServer, init_channelNotification };
