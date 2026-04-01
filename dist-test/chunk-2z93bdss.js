// @bun
import {
  enqueueSdkEvent,
  init_sdkEventQueue
} from "./chunk-wk0emb79.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-3r24h7t6.js";

// src/utils/sessionState.ts
init_envUtils();
init_sdkEventQueue();
var stateListener = null;
var metadataListener = null;
var permissionModeListener = null;
function setSessionStateChangedListener(cb) {
  stateListener = cb;
}
function setSessionMetadataChangedListener(cb) {
  metadataListener = cb;
}
function setPermissionModeChangedListener(cb) {
  permissionModeListener = cb;
}
var hasPendingAction = false;
var currentState = "idle";
function getSessionState() {
  return currentState;
}
function notifySessionStateChanged(state, details) {
  currentState = state;
  stateListener?.(state, details);
  if (state === "requires_action" && details) {
    hasPendingAction = true;
    metadataListener?.({
      pending_action: details
    });
  } else if (hasPendingAction) {
    hasPendingAction = false;
    metadataListener?.({ pending_action: null });
  }
  if (state === "idle") {
    metadataListener?.({ task_summary: null });
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS)) {
    enqueueSdkEvent({
      type: "system",
      subtype: "session_state_changed",
      state
    });
  }
}
function notifySessionMetadataChanged(metadata) {
  metadataListener?.(metadata);
}
function notifyPermissionModeChanged(mode) {
  permissionModeListener?.(mode);
}

export { setSessionStateChangedListener, setSessionMetadataChangedListener, setPermissionModeChangedListener, getSessionState, notifySessionStateChanged, notifySessionMetadataChanged, notifyPermissionModeChanged };
