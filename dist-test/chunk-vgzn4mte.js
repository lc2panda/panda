// @bun
import {
  notifyPermissionModeChanged,
  notifySessionMetadataChanged
} from "./chunk-2z93bdss.js";
import {
  SAFE_ENV_VARS,
  isProviderManagedEnvVar
} from "./chunk-x8b7vft8.js";
import {
  init_syncCache,
  isRemoteManagedSettingsEligible
} from "./chunk-wk0emb79.js";
import {
  clearApiKeyHelperCache,
  clearAwsCredentialsCache,
  clearGcpCredentialsCache,
  getGlobalConfig,
  getSettingsForSource,
  getSettings_DEPRECATED,
  init_PermissionMode,
  init_auth,
  init_config1 as init_config,
  init_constants,
  init_settings1 as init_settings,
  isSettingSourceEnabled,
  permissionModeFromString,
  saveGlobalConfig,
  toExternalPermissionMode,
  updateSettingsForSource
} from "./chunk-bt6e264h.js";
import {
  clearCACertsCache,
  clearMTLSCache,
  clearProxyCache,
  configureGlobalAgents,
  init_caCerts,
  init_mtls,
  init_proxy
} from "./chunk-7gjw150h.js";
import {
  init_log,
  logError
} from "./chunk-43vdtd69.js";
import {
  init_errors,
  toError
} from "./chunk-71hncdva.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-3r24h7t6.js";
import {
  init_state,
  setMainLoopModelOverride
} from "./chunk-24stks7b.js";

// src/utils/managedEnv.ts
init_syncCache();
init_caCerts();
init_config();
init_envUtils();
init_mtls();
init_proxy();
init_constants();
init_settings();
function withoutSSHTunnelVars(env) {
  if (!env || !process.env.ANTHROPIC_UNIX_SOCKET)
    return env || {};
  const {
    ANTHROPIC_UNIX_SOCKET: _1,
    ANTHROPIC_BASE_URL: _2,
    ANTHROPIC_API_KEY: _3,
    ANTHROPIC_AUTH_TOKEN: _4,
    CLAUDE_CODE_OAUTH_TOKEN: _5,
    ...rest
  } = env;
  return rest;
}
function withoutHostManagedProviderVars(env) {
  if (!env)
    return {};
  if (!isEnvTruthy(process.env.CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST)) {
    return env;
  }
  const out = {};
  for (const [key, value] of Object.entries(env)) {
    if (!isProviderManagedEnvVar(key)) {
      out[key] = value;
    }
  }
  return out;
}
var ccdSpawnEnvKeys;
function withoutCcdSpawnEnvKeys(env) {
  if (!env || !ccdSpawnEnvKeys)
    return env || {};
  const out = {};
  for (const [key, value] of Object.entries(env)) {
    if (!ccdSpawnEnvKeys.has(key))
      out[key] = value;
  }
  return out;
}
function filterSettingsEnv(env) {
  return withoutCcdSpawnEnvKeys(withoutHostManagedProviderVars(withoutSSHTunnelVars(env)));
}
var TRUSTED_SETTING_SOURCES = [
  "userSettings",
  "flagSettings",
  "policySettings"
];
function applySafeConfigEnvironmentVariables() {
  if (ccdSpawnEnvKeys === undefined) {
    ccdSpawnEnvKeys = process.env.CLAUDE_CODE_ENTRYPOINT === "claude-desktop" ? new Set(Object.keys(process.env)) : null;
  }
  Object.assign(process.env, filterSettingsEnv(getGlobalConfig().env));
  for (const source of TRUSTED_SETTING_SOURCES) {
    if (source === "policySettings")
      continue;
    if (!isSettingSourceEnabled(source))
      continue;
    Object.assign(process.env, filterSettingsEnv(getSettingsForSource(source)?.env));
  }
  isRemoteManagedSettingsEligible();
  Object.assign(process.env, filterSettingsEnv(getSettingsForSource("policySettings")?.env));
  const settingsEnv = filterSettingsEnv(getSettings_DEPRECATED()?.env);
  for (const [key, value] of Object.entries(settingsEnv)) {
    if (SAFE_ENV_VARS.has(key.toUpperCase())) {
      process.env[key] = value;
    }
  }
}
function applyConfigEnvironmentVariables() {
  Object.assign(process.env, filterSettingsEnv(getGlobalConfig().env));
  Object.assign(process.env, filterSettingsEnv(getSettings_DEPRECATED()?.env));
  clearCACertsCache();
  clearMTLSCache();
  clearProxyCache();
  configureGlobalAgents();
}

// src/state/onChangeAppState.ts
init_state();
init_auth();
init_config();
init_errors();
init_log();
init_PermissionMode();
init_settings();
function externalMetadataToAppState(metadata) {
  return (prev) => ({
    ...prev,
    ...typeof metadata.permission_mode === "string" ? {
      toolPermissionContext: {
        ...prev.toolPermissionContext,
        mode: permissionModeFromString(metadata.permission_mode)
      }
    } : {},
    ...typeof metadata.is_ultraplan_mode === "boolean" ? { isUltraplanMode: metadata.is_ultraplan_mode } : {}
  });
}
function onChangeAppState({
  newState,
  oldState
}) {
  const prevMode = oldState.toolPermissionContext.mode;
  const newMode = newState.toolPermissionContext.mode;
  if (prevMode !== newMode) {
    const prevExternal = toExternalPermissionMode(prevMode);
    const newExternal = toExternalPermissionMode(newMode);
    if (prevExternal !== newExternal) {
      const isUltraplan = newExternal === "plan" && newState.isUltraplanMode && !oldState.isUltraplanMode ? true : null;
      notifySessionMetadataChanged({
        permission_mode: newExternal,
        is_ultraplan_mode: isUltraplan
      });
    }
    notifyPermissionModeChanged(newMode);
  }
  if (newState.mainLoopModel !== oldState.mainLoopModel && newState.mainLoopModel === null) {
    updateSettingsForSource("userSettings", { model: undefined });
    setMainLoopModelOverride(null);
  }
  if (newState.mainLoopModel !== oldState.mainLoopModel && newState.mainLoopModel !== null) {
    updateSettingsForSource("userSettings", { model: newState.mainLoopModel });
    setMainLoopModelOverride(newState.mainLoopModel);
  }
  if (newState.expandedView !== oldState.expandedView) {
    const showExpandedTodos = newState.expandedView === "tasks";
    const showSpinnerTree = newState.expandedView === "teammates";
    if (getGlobalConfig().showExpandedTodos !== showExpandedTodos || getGlobalConfig().showSpinnerTree !== showSpinnerTree) {
      saveGlobalConfig((current) => ({
        ...current,
        showExpandedTodos,
        showSpinnerTree
      }));
    }
  }
  if (newState.verbose !== oldState.verbose && getGlobalConfig().verbose !== newState.verbose) {
    const verbose = newState.verbose;
    saveGlobalConfig((current) => ({
      ...current,
      verbose
    }));
  }
  if (process.env.USER_TYPE === "ant") {
    if (newState.tungstenPanelVisible !== oldState.tungstenPanelVisible && newState.tungstenPanelVisible !== undefined && getGlobalConfig().tungstenPanelVisible !== newState.tungstenPanelVisible) {
      const tungstenPanelVisible = newState.tungstenPanelVisible;
      saveGlobalConfig((current) => ({ ...current, tungstenPanelVisible }));
    }
  }
  if (newState.settings !== oldState.settings) {
    try {
      clearApiKeyHelperCache();
      clearAwsCredentialsCache();
      clearGcpCredentialsCache();
      if (newState.settings.env !== oldState.settings.env) {
        applyConfigEnvironmentVariables();
      }
    } catch (error) {
      logError(toError(error));
    }
  }
}

export { applySafeConfigEnvironmentVariables, applyConfigEnvironmentVariables, externalMetadataToAppState, onChangeAppState };
