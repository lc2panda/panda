// @bun
import {
  init_semver
} from "./chunk-ps49ymvj.js";
import {
  init_auth,
  init_growthbook
} from "./chunk-w5d5b7r0.js";
import {
  init_envUtils
} from "./chunk-er95axp1.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/bridge/bridgeEnabled.ts
function isBridgeEnabled() {
  return false;
}
async function isBridgeEnabledBlocking() {
  return false;
}
function isEnvLessBridgeEnabled() {
  return false;
}
function isCseShimEnabled() {
  return true;
}
function checkBridgeMinVersion() {
  if (false) {}
  return null;
}
var init_bridgeEnabled = __esm(() => {
  init_growthbook();
  init_auth();
  init_envUtils();
  init_semver();
});

export { isBridgeEnabled, isBridgeEnabledBlocking, isEnvLessBridgeEnabled, isCseShimEnabled, checkBridgeMinVersion, init_bridgeEnabled };
