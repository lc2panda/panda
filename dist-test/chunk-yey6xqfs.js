// @bun
import {
  CCR_SESSION_INGRESS_TOKEN_PATH,
  init_authFileDescriptor,
  maybePersistTokenForSubprocesses,
  readTokenFromWellKnownFile
} from "./chunk-bt6e264h.js";
import {
  init_diagLogs,
  logForDiagnosticsNoPII
} from "./chunk-73q6p10n.js";
import {
  errorMessage,
  getFsImplementation,
  init_cleanupRegistry,
  init_debug,
  init_errors,
  init_fsOperations,
  logForDebugging,
  registerCleanup
} from "./chunk-71hncdva.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-3r24h7t6.js";
import {
  getSessionIngressToken,
  init_state,
  setSessionIngressToken
} from "./chunk-24stks7b.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/utils/sessionIngressAuth.ts
function getTokenFromFileDescriptor() {
  const cachedToken = getSessionIngressToken();
  if (cachedToken !== undefined) {
    return cachedToken;
  }
  const fdEnv = process.env.CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR;
  if (!fdEnv) {
    const path = process.env.CLAUDE_SESSION_INGRESS_TOKEN_FILE ?? CCR_SESSION_INGRESS_TOKEN_PATH;
    const fromFile = readTokenFromWellKnownFile(path, "session ingress token");
    setSessionIngressToken(fromFile);
    return fromFile;
  }
  const fd = parseInt(fdEnv, 10);
  if (Number.isNaN(fd)) {
    logForDebugging(`CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR must be a valid file descriptor number, got: ${fdEnv}`, { level: "error" });
    setSessionIngressToken(null);
    return null;
  }
  try {
    const fsOps = getFsImplementation();
    const fdPath = process.platform === "darwin" || process.platform === "freebsd" ? `/dev/fd/${fd}` : `/proc/self/fd/${fd}`;
    const token = fsOps.readFileSync(fdPath, { encoding: "utf8" }).trim();
    if (!token) {
      logForDebugging("File descriptor contained empty token", {
        level: "error"
      });
      setSessionIngressToken(null);
      return null;
    }
    logForDebugging(`Successfully read token from file descriptor ${fd}`);
    setSessionIngressToken(token);
    maybePersistTokenForSubprocesses(CCR_SESSION_INGRESS_TOKEN_PATH, token, "session ingress token");
    return token;
  } catch (error) {
    logForDebugging(`Failed to read token from file descriptor ${fd}: ${errorMessage(error)}`, { level: "error" });
    const path = process.env.CLAUDE_SESSION_INGRESS_TOKEN_FILE ?? CCR_SESSION_INGRESS_TOKEN_PATH;
    const fromFile = readTokenFromWellKnownFile(path, "session ingress token");
    setSessionIngressToken(fromFile);
    return fromFile;
  }
}
function getSessionIngressAuthToken() {
  const envToken = process.env.CLAUDE_CODE_SESSION_ACCESS_TOKEN;
  if (envToken) {
    return envToken;
  }
  return getTokenFromFileDescriptor();
}
function getSessionIngressAuthHeaders() {
  const token = getSessionIngressAuthToken();
  if (!token)
    return {};
  if (token.startsWith("sk-ant-sid")) {
    const headers = {
      Cookie: `sessionKey=${token}`
    };
    const orgUuid = process.env.CLAUDE_CODE_ORGANIZATION_UUID;
    if (orgUuid) {
      headers["X-Organization-Uuid"] = orgUuid;
    }
    return headers;
  }
  return { Authorization: `Bearer ${token}` };
}
function updateSessionIngressAuthToken(token) {
  process.env.CLAUDE_CODE_SESSION_ACCESS_TOKEN = token;
}
var init_sessionIngressAuth = __esm(() => {
  init_state();
  init_authFileDescriptor();
  init_debug();
  init_errors();
  init_fsOperations();
});

// src/services/api/emptyUsage.ts
var EMPTY_USAGE;
var init_emptyUsage = __esm(() => {
  EMPTY_USAGE = {
    input_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    output_tokens: 0,
    server_tool_use: { web_search_requests: 0, web_fetch_requests: 0 },
    service_tier: "standard",
    cache_creation: {
      ephemeral_1h_input_tokens: 0,
      ephemeral_5m_input_tokens: 0
    },
    inference_geo: "",
    iterations: [],
    speed: "standard"
  };
});

// src/utils/sessionActivity.ts
function startHeartbeatTimer() {
  clearIdleTimer();
  heartbeatTimer = setInterval(() => {
    logForDiagnosticsNoPII("debug", "session_keepalive_heartbeat", {
      refcount
    });
    if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE_SEND_KEEPALIVES)) {
      activityCallback?.();
    }
  }, SESSION_ACTIVITY_INTERVAL_MS);
}
function startIdleTimer() {
  clearIdleTimer();
  if (activityCallback === null) {
    return;
  }
  idleTimer = setTimeout(() => {
    logForDiagnosticsNoPII("info", "session_idle_30s");
    idleTimer = null;
  }, SESSION_ACTIVITY_INTERVAL_MS);
}
function clearIdleTimer() {
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}
function registerSessionActivityCallback(cb) {
  activityCallback = cb;
  if (refcount > 0 && heartbeatTimer === null) {
    startHeartbeatTimer();
  }
}
function unregisterSessionActivityCallback() {
  activityCallback = null;
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  clearIdleTimer();
}
function sendSessionActivitySignal() {
  if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE_SEND_KEEPALIVES)) {
    activityCallback?.();
  }
}
function isSessionActivityTrackingActive() {
  return activityCallback !== null;
}
function startSessionActivity(reason) {
  refcount++;
  activeReasons.set(reason, (activeReasons.get(reason) ?? 0) + 1);
  if (refcount === 1) {
    oldestActivityStartedAt = Date.now();
    if (activityCallback !== null && heartbeatTimer === null) {
      startHeartbeatTimer();
    }
  }
  if (!cleanupRegistered) {
    cleanupRegistered = true;
    registerCleanup(async () => {
      logForDiagnosticsNoPII("info", "session_activity_at_shutdown", {
        refcount,
        active: Object.fromEntries(activeReasons),
        oldest_activity_ms: refcount > 0 && oldestActivityStartedAt !== null ? Date.now() - oldestActivityStartedAt : null
      });
    });
  }
}
function stopSessionActivity(reason) {
  if (refcount > 0) {
    refcount--;
  }
  const n = (activeReasons.get(reason) ?? 0) - 1;
  if (n > 0)
    activeReasons.set(reason, n);
  else
    activeReasons.delete(reason);
  if (refcount === 0 && heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    startIdleTimer();
  }
}
var SESSION_ACTIVITY_INTERVAL_MS = 30000, activityCallback = null, refcount = 0, activeReasons, oldestActivityStartedAt = null, heartbeatTimer = null, idleTimer = null, cleanupRegistered = false;
var init_sessionActivity = __esm(() => {
  init_cleanupRegistry();
  init_diagLogs();
  init_envUtils();
  activeReasons = new Map;
});

export { getSessionIngressAuthToken, getSessionIngressAuthHeaders, updateSessionIngressAuthToken, init_sessionIngressAuth, registerSessionActivityCallback, unregisterSessionActivityCallback, sendSessionActivitySignal, isSessionActivityTrackingActive, startSessionActivity, stopSessionActivity, init_sessionActivity, EMPTY_USAGE, init_emptyUsage };
