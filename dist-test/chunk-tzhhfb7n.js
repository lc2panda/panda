// @bun
import {
  LogSelector,
  agenticSessionSearch,
  checkCrossProjectResume,
  init_LogSelector,
  init_agenticSessionSearch,
  init_crossProjectResume
} from "./chunk-fx6h5kc1.js";
import"./chunk-h55zbzrb.js";
import"./chunk-1hnd7vq6.js";
import"./chunk-ngsk090g.js";
import"./chunk-d86m7wng.js";
import"./chunk-yhdqebwk.js";
import"./chunk-w5dxtc43.js";
import"./chunk-4th7m2zk.js";
import"./chunk-zh5rwmys.js";
import"./chunk-7jpkjgjt.js";
import"./chunk-vy2p8z1v.js";
import"./chunk-y5v4npt0.js";
import"./chunk-1275y2ma.js";
import"./chunk-586jhxa4.js";
import {
  MessageResponse,
  Spinner,
  getLastSessionLog,
  getSessionIdFromLog,
  getWorktreePaths,
  init_MessageResponse,
  init_Spinner,
  init_getWorktreePaths,
  init_sessionStorage,
  init_uuid,
  isCustomTitleEnabled,
  isLiteLog,
  loadAllProjectsMessageLogs,
  loadFullLog,
  loadSameRepoMessageLogs,
  searchSessionsByCustomTitle,
  validateUuid
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
import {
  init_modalContext,
  init_useTerminalSize,
  useIsInsideModal,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  init_osc,
  require_compiler_runtime,
  setClipboard
} from "./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  init_source,
  source_default
} from "./chunk-bt6e264h.js";
import"./chunk-y9h5c3hn.js";
import"./chunk-7rxmkr8t.js";
import"./chunk-vratq94g.js";
import"./chunk-7gjw150h.js";
import"./chunk-0e1xsncc.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-m859hz3m.js";
import"./chunk-55wgxwa9.js";
import"./chunk-n9s3rq14.js";
import"./chunk-4jm600zv.js";
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
  figures_default,
  init_figures
} from "./chunk-nahdbxge.js";
import {
  init_log,
  logError
} from "./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import"./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import {
  getOriginalCwd,
  getSessionId,
  init_state
} from "./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/resume/resume.tsx
function resumeHelpMessage(result) {
  switch (result.resultType) {
    case "sessionNotFound":
      return `Session ${source_default.bold(result.arg)} was not found.`;
    case "multipleMatches":
      return `Found ${result.count} sessions matching ${source_default.bold(result.arg)}. Please use /resume to pick a specific session.`;
  }
}
function ResumeError(t0) {
  const $ = import_compiler_runtime.c(10);
  const {
    message,
    args,
    onDone
  } = t0;
  let t1;
  let t2;
  if ($[0] !== onDone) {
    t1 = () => {
      const timer = setTimeout(onDone, 0);
      return () => clearTimeout(timer);
    };
    t2 = [onDone];
    $[0] = onDone;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  React.useEffect(t1, t2);
  let t3;
  if ($[3] !== args) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        figures_default.pointer,
        " /resume ",
        args
      ]
    }, undefined, true, undefined, this);
    $[3] = args;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] !== message) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(MessageResponse, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: message
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[5] = message;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== t3 || $[8] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t3,
        t4
      ]
    }, undefined, true, undefined, this);
    $[7] = t3;
    $[8] = t4;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  return t5;
}
function ResumeCommand({
  onDone,
  onResume
}) {
  const [logs, setLogs] = React.useState([]);
  const [worktreePaths, setWorktreePaths] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [resuming, setResuming] = React.useState(false);
  const [showAllProjects, setShowAllProjects] = React.useState(false);
  const {
    rows
  } = useTerminalSize();
  const insideModal = useIsInsideModal();
  const loadLogs = React.useCallback(async (allProjects, paths) => {
    setLoading(true);
    try {
      const allLogs = allProjects ? await loadAllProjectsMessageLogs() : await loadSameRepoMessageLogs(paths);
      const resumable = filterResumableSessions(allLogs, getSessionId());
      if (resumable.length === 0) {
        onDone("No conversations found to resume");
        return;
      }
      setLogs(resumable);
    } catch (_err) {
      onDone("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [onDone]);
  React.useEffect(() => {
    async function init() {
      const paths_0 = await getWorktreePaths(getOriginalCwd());
      setWorktreePaths(paths_0);
      loadLogs(false, paths_0);
    }
    init();
  }, [loadLogs]);
  const handleToggleAllProjects = React.useCallback(() => {
    const newValue = !showAllProjects;
    setShowAllProjects(newValue);
    loadLogs(newValue, worktreePaths);
  }, [showAllProjects, loadLogs, worktreePaths]);
  async function handleSelect(log) {
    const sessionId = validateUuid(getSessionIdFromLog(log));
    if (!sessionId) {
      onDone("Failed to resume conversation");
      return;
    }
    const fullLog = isLiteLog(log) ? await loadFullLog(log) : log;
    const crossProjectCheck = checkCrossProjectResume(fullLog, showAllProjects, worktreePaths);
    if (crossProjectCheck.isCrossProject) {
      if (crossProjectCheck.isSameRepoWorktree) {
        setResuming(true);
        onResume(sessionId, fullLog, "slash_command_picker");
        return;
      }
      const crossCmd = crossProjectCheck.command;
      const raw = await setClipboard(crossCmd);
      if (raw)
        process.stdout.write(raw);
      const message = ["", "This conversation is from a different directory.", "", "To resume, run:", `  ${crossCmd}`, "", "(Command copied to clipboard)", ""].join(`
`);
      onDone(message, {
        display: "user"
      });
      return;
    }
    setResuming(true);
    onResume(sessionId, fullLog, "slash_command_picker");
  }
  function handleCancel() {
    onDone("Resume cancelled", {
      display: "system"
    });
  }
  if (loading) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: " Loading conversations\u2026"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (resuming) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: " Resuming conversation\u2026"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(LogSelector, {
    logs,
    maxHeight: insideModal ? Math.floor(rows / 2) : rows - 2,
    onCancel: handleCancel,
    onSelect: handleSelect,
    onLogsChanged: () => loadLogs(showAllProjects, worktreePaths),
    showAllProjects,
    onToggleAllProjects: handleToggleAllProjects,
    onAgenticSearch: agenticSessionSearch
  }, undefined, false, undefined, this);
}
function filterResumableSessions(logs, currentSessionId) {
  return logs.filter((l) => !l.isSidechain && getSessionIdFromLog(l) !== currentSessionId);
}
var import_compiler_runtime, React, jsx_dev_runtime, call = async (onDone, context, args) => {
  const onResume = async (sessionId, log, entrypoint) => {
    try {
      await context.resume?.(sessionId, log, entrypoint);
      onDone(undefined, {
        display: "skip"
      });
    } catch (error) {
      logError(error);
      onDone(`Failed to resume: ${error.message}`);
    }
  };
  const arg = args?.trim();
  if (!arg) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ResumeCommand, {
      onDone,
      onResume
    }, Date.now(), false, undefined, this);
  }
  const worktreePaths = await getWorktreePaths(getOriginalCwd());
  const logs = await loadSameRepoMessageLogs(worktreePaths);
  if (logs.length === 0) {
    const message2 = "No conversations found to resume.";
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ResumeError, {
      message: message2,
      args: arg,
      onDone: () => onDone(message2)
    }, undefined, false, undefined, this);
  }
  const maybeSessionId = validateUuid(arg);
  if (maybeSessionId) {
    const matchingLogs = logs.filter((l) => getSessionIdFromLog(l) === maybeSessionId).sort((a, b) => b.modified.getTime() - a.modified.getTime());
    if (matchingLogs.length > 0) {
      const log = matchingLogs[0];
      const fullLog = isLiteLog(log) ? await loadFullLog(log) : log;
      onResume(maybeSessionId, fullLog, "slash_command_session_id");
      return null;
    }
    const directLog = await getLastSessionLog(maybeSessionId);
    if (directLog) {
      onResume(maybeSessionId, directLog, "slash_command_session_id");
      return null;
    }
  }
  if (isCustomTitleEnabled()) {
    const titleMatches = await searchSessionsByCustomTitle(arg, {
      exact: true
    });
    if (titleMatches.length === 1) {
      const log = titleMatches[0];
      const sessionId = getSessionIdFromLog(log);
      if (sessionId) {
        const fullLog = isLiteLog(log) ? await loadFullLog(log) : log;
        onResume(sessionId, fullLog, "slash_command_title");
        return null;
      }
    }
    if (titleMatches.length > 1) {
      const message2 = resumeHelpMessage({
        resultType: "multipleMatches",
        arg,
        count: titleMatches.length
      });
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ResumeError, {
        message: message2,
        args: arg,
        onDone: () => onDone(message2)
      }, undefined, false, undefined, this);
    }
  }
  const message = resumeHelpMessage({
    resultType: "sessionNotFound",
    arg
  });
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ResumeError, {
    message,
    args: arg,
    onDone: () => onDone(message)
  }, undefined, false, undefined, this);
};
var init_resume = __esm(() => {
  init_source();
  init_figures();
  init_state();
  init_LogSelector();
  init_MessageResponse();
  init_Spinner();
  init_modalContext();
  init_useTerminalSize();
  init_osc();
  init_ink();
  init_agenticSessionSearch();
  init_crossProjectResume();
  init_getWorktreePaths();
  init_log();
  init_sessionStorage();
  init_uuid();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  React = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});
init_resume();

export {
  filterResumableSessions,
  call
};
