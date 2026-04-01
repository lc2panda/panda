// @bun
import {
  ALLOWED_OFFICIAL_MARKETPLACE_NAMES,
  init_schemas
} from "./chunk-bt6e264h.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/utils/plugins/pluginIdentifier.ts
function parsePluginIdentifier(plugin) {
  if (plugin.includes("@")) {
    const parts = plugin.split("@");
    return { name: parts[0] || "", marketplace: parts[1] };
  }
  return { name: plugin };
}
function isOfficialMarketplaceName(marketplace) {
  return marketplace !== undefined && ALLOWED_OFFICIAL_MARKETPLACE_NAMES.has(marketplace.toLowerCase());
}
function scopeToSettingSource(scope) {
  if (scope === "managed") {
    throw new Error("Cannot install plugins to managed scope");
  }
  return SCOPE_TO_EDITABLE_SOURCE[scope];
}
function settingSourceToScope(source) {
  return SETTING_SOURCE_TO_SCOPE[source];
}
var SETTING_SOURCE_TO_SCOPE, SCOPE_TO_EDITABLE_SOURCE;
var init_pluginIdentifier = __esm(() => {
  init_schemas();
  SETTING_SOURCE_TO_SCOPE = {
    policySettings: "managed",
    userSettings: "user",
    projectSettings: "project",
    localSettings: "local",
    flagSettings: "flag"
  };
  SCOPE_TO_EDITABLE_SOURCE = {
    user: "userSettings",
    project: "projectSettings",
    local: "localSettings"
  };
});

export { SETTING_SOURCE_TO_SCOPE, parsePluginIdentifier, isOfficialMarketplaceName, scopeToSettingSource, settingSourceToScope, init_pluginIdentifier };
