// @bun
import {
  init_registry,
  registerTmuxBackend
} from "./chunk-wk0emb79.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-ngnveex9.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-2e5y8sgq.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-zz424j25.js";
import"./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import"./chunk-x2y5syym.js";
import"./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import"./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  init_sleep,
  sleep
} from "./chunk-bt6e264h.js";
import"./chunk-y9h5c3hn.js";
import"./chunk-7rxmkr8t.js";
import"./chunk-vratq94g.js";
import"./chunk-7gjw150h.js";
import {
  count,
  init_array
} from "./chunk-0e1xsncc.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-m859hz3m.js";
import"./chunk-55wgxwa9.js";
import {
  getLeaderPaneId,
  init_detection,
  isInsideTmux,
  isTmuxAvailable
} from "./chunk-n9s3rq14.js";
import {
  HIDDEN_SESSION_NAME,
  SWARM_SESSION_NAME,
  SWARM_VIEW_WINDOW_NAME,
  TMUX_COMMAND,
  getSwarmSocketName,
  init_constants
} from "./chunk-4jm600zv.js";
import"./chunk-zfp09a4r.js";
import"./chunk-7ymfj7m3.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-e5n0k9bd.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import"./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import"./chunk-h0rbjg6x.js";
import"./chunk-s85yj5xm.js";
import"./chunk-73q6p10n.js";
import"./chunk-8qg6qavk.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-14j8jv5j.js";
import"./chunk-0xqnccz6.js";
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-nahdbxge.js";
import {
  init_log,
  logError
} from "./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/utils/swarm/backends/TmuxBackend.ts
function waitForPaneShellReady() {
  return sleep(PANE_SHELL_INIT_DELAY_MS);
}
function acquirePaneCreationLock() {
  let release;
  const newLock = new Promise((resolve) => {
    release = resolve;
  });
  const previousLock = paneCreationLock;
  paneCreationLock = newLock;
  return previousLock.then(() => release);
}
function getTmuxColorName(color) {
  const tmuxColors = {
    red: "red",
    blue: "blue",
    green: "green",
    yellow: "yellow",
    purple: "magenta",
    orange: "colour208",
    pink: "colour205",
    cyan: "cyan"
  };
  return tmuxColors[color];
}
function runTmuxInUserSession(args) {
  return execFileNoThrow(TMUX_COMMAND, args);
}
function runTmuxInSwarm(args) {
  return execFileNoThrow(TMUX_COMMAND, ["-L", getSwarmSocketName(), ...args]);
}

class TmuxBackend {
  type = "tmux";
  displayName = "tmux";
  supportsHideShow = true;
  async isAvailable() {
    return isTmuxAvailable();
  }
  async isRunningInside() {
    return isInsideTmux();
  }
  async createTeammatePaneInSwarmView(name, color) {
    const releaseLock = await acquirePaneCreationLock();
    try {
      const insideTmux = await this.isRunningInside();
      if (insideTmux) {
        return await this.createTeammatePaneWithLeader(name, color);
      }
      return await this.createTeammatePaneExternal(name, color);
    } finally {
      releaseLock();
    }
  }
  async sendCommandToPane(paneId, command, useExternalSession = false) {
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession;
    const result = await runTmux(["send-keys", "-t", paneId, command, "Enter"]);
    if (result.code !== 0) {
      throw new Error(`Failed to send command to pane ${paneId}: ${result.stderr}`);
    }
  }
  async setPaneBorderColor(paneId, color, useExternalSession = false) {
    const tmuxColor = getTmuxColorName(color);
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession;
    await runTmux([
      "select-pane",
      "-t",
      paneId,
      "-P",
      `bg=default,fg=${tmuxColor}`
    ]);
    await runTmux([
      "set-option",
      "-p",
      "-t",
      paneId,
      "pane-border-style",
      `fg=${tmuxColor}`
    ]);
    await runTmux([
      "set-option",
      "-p",
      "-t",
      paneId,
      "pane-active-border-style",
      `fg=${tmuxColor}`
    ]);
  }
  async setPaneTitle(paneId, name, color, useExternalSession = false) {
    const tmuxColor = getTmuxColorName(color);
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession;
    await runTmux(["select-pane", "-t", paneId, "-T", name]);
    await runTmux([
      "set-option",
      "-p",
      "-t",
      paneId,
      "pane-border-format",
      `#[fg=${tmuxColor},bold] #{pane_title} #[default]`
    ]);
  }
  async enablePaneBorderStatus(windowTarget, useExternalSession = false) {
    const target = windowTarget || await this.getCurrentWindowTarget();
    if (!target) {
      return;
    }
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession;
    await runTmux([
      "set-option",
      "-w",
      "-t",
      target,
      "pane-border-status",
      "top"
    ]);
  }
  async rebalancePanes(windowTarget, hasLeader) {
    if (hasLeader) {
      await this.rebalancePanesWithLeader(windowTarget);
    } else {
      await this.rebalancePanesTiled(windowTarget);
    }
  }
  async killPane(paneId, useExternalSession = false) {
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession;
    const result = await runTmux(["kill-pane", "-t", paneId]);
    return result.code === 0;
  }
  async hidePane(paneId, useExternalSession = false) {
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession;
    await runTmux(["new-session", "-d", "-s", HIDDEN_SESSION_NAME]);
    const result = await runTmux([
      "break-pane",
      "-d",
      "-s",
      paneId,
      "-t",
      `${HIDDEN_SESSION_NAME}:`
    ]);
    if (result.code === 0) {
      logForDebugging(`[TmuxBackend] Hidden pane ${paneId}`);
    } else {
      logForDebugging(`[TmuxBackend] Failed to hide pane ${paneId}: ${result.stderr}`);
    }
    return result.code === 0;
  }
  async showPane(paneId, targetWindowOrPane, useExternalSession = false) {
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession;
    const result = await runTmux([
      "join-pane",
      "-h",
      "-s",
      paneId,
      "-t",
      targetWindowOrPane
    ]);
    if (result.code !== 0) {
      logForDebugging(`[TmuxBackend] Failed to show pane ${paneId}: ${result.stderr}`);
      return false;
    }
    logForDebugging(`[TmuxBackend] Showed pane ${paneId} in ${targetWindowOrPane}`);
    await runTmux(["select-layout", "-t", targetWindowOrPane, "main-vertical"]);
    const panesResult = await runTmux([
      "list-panes",
      "-t",
      targetWindowOrPane,
      "-F",
      "#{pane_id}"
    ]);
    const panes = panesResult.stdout.trim().split(`
`).filter(Boolean);
    if (panes[0]) {
      await runTmux(["resize-pane", "-t", panes[0], "-x", "30%"]);
    }
    return true;
  }
  async getCurrentPaneId() {
    const leaderPane = getLeaderPaneId();
    if (leaderPane) {
      return leaderPane;
    }
    const result = await execFileNoThrow(TMUX_COMMAND, [
      "display-message",
      "-p",
      "#{pane_id}"
    ]);
    if (result.code !== 0) {
      logForDebugging(`[TmuxBackend] Failed to get current pane ID (exit ${result.code}): ${result.stderr}`);
      return null;
    }
    return result.stdout.trim();
  }
  async getCurrentWindowTarget() {
    if (cachedLeaderWindowTarget) {
      return cachedLeaderWindowTarget;
    }
    const leaderPane = getLeaderPaneId();
    const args = ["display-message"];
    if (leaderPane) {
      args.push("-t", leaderPane);
    }
    args.push("-p", "#{session_name}:#{window_index}");
    const result = await execFileNoThrow(TMUX_COMMAND, args);
    if (result.code !== 0) {
      logForDebugging(`[TmuxBackend] Failed to get current window target (exit ${result.code}): ${result.stderr}`);
      return null;
    }
    cachedLeaderWindowTarget = result.stdout.trim();
    return cachedLeaderWindowTarget;
  }
  async getCurrentWindowPaneCount(windowTarget, useSwarmSocket = false) {
    const target = windowTarget || await this.getCurrentWindowTarget();
    if (!target) {
      return null;
    }
    const args = ["list-panes", "-t", target, "-F", "#{pane_id}"];
    const result = useSwarmSocket ? await runTmuxInSwarm(args) : await runTmuxInUserSession(args);
    if (result.code !== 0) {
      logError(new Error(`[TmuxBackend] Failed to get pane count for ${target} (exit ${result.code}): ${result.stderr}`));
      return null;
    }
    return count(result.stdout.trim().split(`
`), Boolean);
  }
  async hasSessionInSwarm(sessionName) {
    const result = await runTmuxInSwarm(["has-session", "-t", sessionName]);
    return result.code === 0;
  }
  async createExternalSwarmSession() {
    const sessionExists = await this.hasSessionInSwarm(SWARM_SESSION_NAME);
    if (!sessionExists) {
      const result = await runTmuxInSwarm([
        "new-session",
        "-d",
        "-s",
        SWARM_SESSION_NAME,
        "-n",
        SWARM_VIEW_WINDOW_NAME,
        "-P",
        "-F",
        "#{pane_id}"
      ]);
      if (result.code !== 0) {
        throw new Error(`Failed to create swarm session: ${result.stderr || "Unknown error"}`);
      }
      const paneId = result.stdout.trim();
      const windowTarget2 = `${SWARM_SESSION_NAME}:${SWARM_VIEW_WINDOW_NAME}`;
      logForDebugging(`[TmuxBackend] Created external swarm session with window ${windowTarget2}, pane ${paneId}`);
      return { windowTarget: windowTarget2, paneId };
    }
    const listResult = await runTmuxInSwarm([
      "list-windows",
      "-t",
      SWARM_SESSION_NAME,
      "-F",
      "#{window_name}"
    ]);
    const windows = listResult.stdout.trim().split(`
`).filter(Boolean);
    const windowTarget = `${SWARM_SESSION_NAME}:${SWARM_VIEW_WINDOW_NAME}`;
    if (windows.includes(SWARM_VIEW_WINDOW_NAME)) {
      const paneResult = await runTmuxInSwarm([
        "list-panes",
        "-t",
        windowTarget,
        "-F",
        "#{pane_id}"
      ]);
      const panes = paneResult.stdout.trim().split(`
`).filter(Boolean);
      return { windowTarget, paneId: panes[0] || "" };
    }
    const createResult = await runTmuxInSwarm([
      "new-window",
      "-t",
      SWARM_SESSION_NAME,
      "-n",
      SWARM_VIEW_WINDOW_NAME,
      "-P",
      "-F",
      "#{pane_id}"
    ]);
    if (createResult.code !== 0) {
      throw new Error(`Failed to create swarm-view window: ${createResult.stderr || "Unknown error"}`);
    }
    return { windowTarget, paneId: createResult.stdout.trim() };
  }
  async createTeammatePaneWithLeader(teammateName, teammateColor) {
    const currentPaneId = await this.getCurrentPaneId();
    const windowTarget = await this.getCurrentWindowTarget();
    if (!currentPaneId || !windowTarget) {
      throw new Error("Could not determine current tmux pane/window");
    }
    const paneCount = await this.getCurrentWindowPaneCount(windowTarget);
    if (paneCount === null) {
      throw new Error("Could not determine pane count for current window");
    }
    const isFirstTeammate = paneCount === 1;
    let splitResult;
    if (isFirstTeammate) {
      splitResult = await execFileNoThrow(TMUX_COMMAND, [
        "split-window",
        "-t",
        currentPaneId,
        "-h",
        "-l",
        "70%",
        "-P",
        "-F",
        "#{pane_id}"
      ]);
    } else {
      const listResult = await execFileNoThrow(TMUX_COMMAND, [
        "list-panes",
        "-t",
        windowTarget,
        "-F",
        "#{pane_id}"
      ]);
      const panes = listResult.stdout.trim().split(`
`).filter(Boolean);
      const teammatePanes = panes.slice(1);
      const teammateCount = teammatePanes.length;
      const splitVertically = teammateCount % 2 === 1;
      const targetPaneIndex = Math.floor((teammateCount - 1) / 2);
      const targetPane = teammatePanes[targetPaneIndex] || teammatePanes[teammatePanes.length - 1];
      splitResult = await execFileNoThrow(TMUX_COMMAND, [
        "split-window",
        "-t",
        targetPane,
        splitVertically ? "-v" : "-h",
        "-P",
        "-F",
        "#{pane_id}"
      ]);
    }
    if (splitResult.code !== 0) {
      throw new Error(`Failed to create teammate pane: ${splitResult.stderr}`);
    }
    const paneId = splitResult.stdout.trim();
    logForDebugging(`[TmuxBackend] Created teammate pane for ${teammateName}: ${paneId}`);
    await this.setPaneBorderColor(paneId, teammateColor);
    await this.setPaneTitle(paneId, teammateName, teammateColor);
    await this.rebalancePanesWithLeader(windowTarget);
    await waitForPaneShellReady();
    return { paneId, isFirstTeammate };
  }
  async createTeammatePaneExternal(teammateName, teammateColor) {
    const { windowTarget, paneId: firstPaneId } = await this.createExternalSwarmSession();
    const paneCount = await this.getCurrentWindowPaneCount(windowTarget, true);
    if (paneCount === null) {
      throw new Error("Could not determine pane count for swarm window");
    }
    const isFirstTeammate = !firstPaneUsedForExternal && paneCount === 1;
    let paneId;
    if (isFirstTeammate) {
      paneId = firstPaneId;
      firstPaneUsedForExternal = true;
      logForDebugging(`[TmuxBackend] Using initial pane for first teammate ${teammateName}: ${paneId}`);
      await this.enablePaneBorderStatus(windowTarget, true);
    } else {
      const listResult = await runTmuxInSwarm([
        "list-panes",
        "-t",
        windowTarget,
        "-F",
        "#{pane_id}"
      ]);
      const panes = listResult.stdout.trim().split(`
`).filter(Boolean);
      const teammateCount = panes.length;
      const splitVertically = teammateCount % 2 === 1;
      const targetPaneIndex = Math.floor((teammateCount - 1) / 2);
      const targetPane = panes[targetPaneIndex] || panes[panes.length - 1];
      const splitResult = await runTmuxInSwarm([
        "split-window",
        "-t",
        targetPane,
        splitVertically ? "-v" : "-h",
        "-P",
        "-F",
        "#{pane_id}"
      ]);
      if (splitResult.code !== 0) {
        throw new Error(`Failed to create teammate pane: ${splitResult.stderr}`);
      }
      paneId = splitResult.stdout.trim();
      logForDebugging(`[TmuxBackend] Created teammate pane for ${teammateName}: ${paneId}`);
    }
    await this.setPaneBorderColor(paneId, teammateColor, true);
    await this.setPaneTitle(paneId, teammateName, teammateColor, true);
    await this.rebalancePanesTiled(windowTarget);
    await waitForPaneShellReady();
    return { paneId, isFirstTeammate };
  }
  async rebalancePanesWithLeader(windowTarget) {
    const listResult = await runTmuxInUserSession([
      "list-panes",
      "-t",
      windowTarget,
      "-F",
      "#{pane_id}"
    ]);
    const panes = listResult.stdout.trim().split(`
`).filter(Boolean);
    if (panes.length <= 2) {
      return;
    }
    await runTmuxInUserSession([
      "select-layout",
      "-t",
      windowTarget,
      "main-vertical"
    ]);
    const leaderPane = panes[0];
    await runTmuxInUserSession(["resize-pane", "-t", leaderPane, "-x", "30%"]);
    logForDebugging(`[TmuxBackend] Rebalanced ${panes.length - 1} teammate panes with leader`);
  }
  async rebalancePanesTiled(windowTarget) {
    const listResult = await runTmuxInSwarm([
      "list-panes",
      "-t",
      windowTarget,
      "-F",
      "#{pane_id}"
    ]);
    const panes = listResult.stdout.trim().split(`
`).filter(Boolean);
    if (panes.length <= 1) {
      return;
    }
    await runTmuxInSwarm(["select-layout", "-t", windowTarget, "tiled"]);
    logForDebugging(`[TmuxBackend] Rebalanced ${panes.length} teammate panes with tiled layout`);
  }
}
var firstPaneUsedForExternal = false, cachedLeaderWindowTarget = null, paneCreationLock, PANE_SHELL_INIT_DELAY_MS = 200;
var init_TmuxBackend = __esm(() => {
  init_debug();
  init_execFileNoThrow();
  init_log();
  init_array();
  init_sleep();
  init_constants();
  init_detection();
  init_registry();
  paneCreationLock = Promise.resolve();
  registerTmuxBackend(TmuxBackend);
});
init_TmuxBackend();

export {
  TmuxBackend
};
