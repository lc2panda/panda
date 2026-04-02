// @bun
import {
  TMUX_COMMAND,
  init_constants
} from "./chunk-4jm600zv.js";
import {
  env,
  init_env
} from "./chunk-7np1pz21.js";
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-ehab6nmr.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/utils/swarm/backends/detection.ts
function isInsideTmuxSync() {
  return !!ORIGINAL_USER_TMUX;
}
async function isInsideTmux() {
  if (isInsideTmuxCached !== null) {
    return isInsideTmuxCached;
  }
  isInsideTmuxCached = !!ORIGINAL_USER_TMUX;
  return isInsideTmuxCached;
}
function getLeaderPaneId() {
  return ORIGINAL_TMUX_PANE || null;
}
async function isTmuxAvailable() {
  const result = await execFileNoThrow(TMUX_COMMAND, ["-V"]);
  return result.code === 0;
}
function isInITerm2() {
  if (isInITerm2Cached !== null) {
    return isInITerm2Cached;
  }
  const termProgram = process.env.TERM_PROGRAM;
  const hasItermSessionId = !!process.env.ITERM_SESSION_ID;
  const terminalIsITerm = env.terminal === "iTerm.app";
  isInITerm2Cached = termProgram === "iTerm.app" || hasItermSessionId || terminalIsITerm;
  return isInITerm2Cached;
}
async function isIt2CliAvailable() {
  const result = await execFileNoThrow(IT2_COMMAND, ["session", "list"]);
  return result.code === 0;
}
function resetDetectionCache() {
  isInsideTmuxCached = null;
  isInITerm2Cached = null;
}
var ORIGINAL_USER_TMUX, ORIGINAL_TMUX_PANE, isInsideTmuxCached = null, isInITerm2Cached = null, IT2_COMMAND = "it2";
var init_detection = __esm(() => {
  init_env();
  init_execFileNoThrow();
  init_constants();
  ORIGINAL_USER_TMUX = process.env.TMUX;
  ORIGINAL_TMUX_PANE = process.env.TMUX_PANE;
});

export { isInsideTmuxSync, isInsideTmux, getLeaderPaneId, isTmuxAvailable, isInITerm2, IT2_COMMAND, isIt2CliAvailable, resetDetectionCache, init_detection };
