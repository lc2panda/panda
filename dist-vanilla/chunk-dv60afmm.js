// @bun
import {
  init_mappers,
  toInternalMessages
} from "./chunk-7tmts4xx.js";
import {
  ASK_USER_QUESTION_TOOL_NAME,
  DreamTask,
  EMPTY_LOOKUPS,
  EXIT_PLAN_MODE_V2_TOOL_NAME,
  InProcessTeammateTask,
  LocalAgentTask,
  LocalShellTask,
  Message,
  REMOTE_CONTROL_DISCONNECTED_MSG,
  RemoteAgentTask,
  Select,
  UserPlanMessage,
  archiveRemoteSession,
  checkRemoteAgentEligibility,
  enqueuePendingNotification,
  extractTag,
  findToolByName,
  formatPreconditionError,
  getEmptyToolPermissionContext,
  getRainbowColor,
  getRemoteSessionUrl,
  getRemoteTaskSessionUrl,
  getTaskOutputPath,
  getTools,
  init_AppState,
  init_DreamTask,
  init_InProcessTeammateTask,
  init_LocalAgentTask,
  init_LocalShellTask,
  init_Message,
  init_RemoteAgentTask,
  init_Task,
  init_Tool,
  init_UserPlanMessage,
  init_collapseReadSearch,
  init_constants2,
  init_coordinatorMode,
  init_diskOutput,
  init_framework,
  init_ink as init_ink2,
  init_messageQueueManager,
  init_messages1 as init_messages,
  init_overlayContext,
  init_product,
  init_prompt8 as init_prompt,
  init_select,
  init_teleport,
  init_thinking,
  init_tools1 as init_tools,
  init_types3 as init_types,
  init_types5 as init_types2,
  init_useElapsedTime,
  init_useSettings,
  isBackgroundTask,
  isCoordinatorMode,
  isTerminalTaskStatus,
  normalizeMessages,
  pollRemoteSessionEvents,
  registerRemoteAgentTask,
  summarizeRecentActivities,
  teleportResumeCodeSession,
  teleportToRemote,
  toInkColor,
  updateTaskState,
  useAppState,
  useElapsedTime,
  useRegisterOverlay,
  useSetAppState,
  useSettings
} from "./chunk-ekfe4t3x.js";
import {
  Byline,
  Dialog,
  KeyboardShortcutHint,
  init_Byline,
  init_Dialog,
  init_KeyboardShortcutHint,
  init_useShortcutDisplay,
  useShortcutDisplay
} from "./chunk-p9ra2v2f.js";
import {
  init_useKeybinding,
  init_useTerminalSize,
  useKeybindings,
  useTerminalSize
} from "./chunk-gypetngm.js";
import {
  Link,
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime,
  useAnimationFrame,
  useTheme
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_api,
  isTransientNetworkError
} from "./chunk-73re2yq9.js";
import {
  init_browser,
  openBrowser
} from "./chunk-j30w257d.js";
import {
  AGENT_TOOL_NAME,
  ALL_MODEL_CONFIGS,
  DIAMOND_FILLED,
  DIAMOND_OPEN,
  LEGACY_AGENT_TOOL_NAME,
  getFeatureValue_CACHED_MAY_BE_STALE,
  init_configs,
  init_constants1 as init_constants,
  init_figures as init_figures2,
  init_growthbook,
  init_sleep,
  init_stringUtils,
  plural,
  sleep
} from "./chunk-w5d5b7r0.js";
import {
  count,
  init_array,
  intersperse
} from "./chunk-xk4zgzx2.js";
import {
  TEAM_LEAD_NAME,
  init_constants as init_constants3
} from "./chunk-4jm600zv.js";
import {
  formatDuration,
  formatFileSize,
  formatNumber,
  init_format,
  truncate,
  truncateToWidth
} from "./chunk-ywhstzac.js";
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
import {
  figures_default,
  init_figures
} from "./chunk-ehab6nmr.js";
import {
  init_log,
  logError
} from "./chunk-myphr2va.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  init_fsOperations,
  logForDebugging,
  tailFile
} from "./chunk-cv4r43rj.js";
import {
  __commonJS,
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/state/teammateViewHelpers.ts
function isLocalAgent(task) {
  return typeof task === "object" && task !== null && "type" in task && task.type === "local_agent";
}
function release(task) {
  return {
    ...task,
    retain: false,
    messages: undefined,
    diskLoaded: false,
    evictAfter: isTerminalTaskStatus(task.status) ? Date.now() + PANEL_GRACE_MS : undefined
  };
}
function enterTeammateView(taskId, setAppState) {
  logEvent("tengu_transcript_view_enter", {});
  setAppState((prev) => {
    const task = prev.tasks[taskId];
    const prevId = prev.viewingAgentTaskId;
    const prevTask = prevId !== undefined ? prev.tasks[prevId] : undefined;
    const switching = prevId !== undefined && prevId !== taskId && isLocalAgent(prevTask) && prevTask.retain;
    const needsRetain = isLocalAgent(task) && (!task.retain || task.evictAfter !== undefined);
    const needsView = prev.viewingAgentTaskId !== taskId || prev.viewSelectionMode !== "viewing-agent";
    if (!needsRetain && !needsView && !switching)
      return prev;
    let tasks = prev.tasks;
    if (switching || needsRetain) {
      tasks = { ...prev.tasks };
      if (switching)
        tasks[prevId] = release(prevTask);
      if (needsRetain) {
        tasks[taskId] = { ...task, retain: true, evictAfter: undefined };
      }
    }
    return {
      ...prev,
      viewingAgentTaskId: taskId,
      viewSelectionMode: "viewing-agent",
      tasks
    };
  });
}
function exitTeammateView(setAppState) {
  logEvent("tengu_transcript_view_exit", {});
  setAppState((prev) => {
    const id = prev.viewingAgentTaskId;
    const cleared = {
      ...prev,
      viewingAgentTaskId: undefined,
      viewSelectionMode: "none"
    };
    if (id === undefined) {
      return prev.viewSelectionMode === "none" ? prev : cleared;
    }
    const task = prev.tasks[id];
    if (!isLocalAgent(task) || !task.retain)
      return cleared;
    return {
      ...cleared,
      tasks: { ...prev.tasks, [id]: release(task) }
    };
  });
}
function stopOrDismissAgent(taskId, setAppState) {
  setAppState((prev) => {
    const task = prev.tasks[taskId];
    if (!isLocalAgent(task))
      return prev;
    if (task.status === "running") {
      task.abortController?.abort();
      return prev;
    }
    if (task.evictAfter === 0)
      return prev;
    const viewingThis = prev.viewingAgentTaskId === taskId;
    return {
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: { ...release(task), evictAfter: 0 }
      },
      ...viewingThis && {
        viewingAgentTaskId: undefined,
        viewSelectionMode: "none"
      }
    };
  });
}
var PANEL_GRACE_MS = 30000;
var init_teammateViewHelpers = __esm(() => {
  init_analytics();
  init_Task();
});

// src/utils/ultraplan/ccrSession.ts
class ExitPlanModeScanner {
  exitPlanCalls = [];
  results = new Map;
  rejectedIds = new Set;
  terminated = null;
  rescanAfterRejection = false;
  everSeenPending = false;
  get rejectCount() {
    return this.rejectedIds.size;
  }
  get hasPendingPlan() {
    const id = this.exitPlanCalls.findLast((c) => !this.rejectedIds.has(c));
    return id !== undefined && !this.results.has(id);
  }
  ingest(newEvents) {
    for (const m of newEvents) {
      if (m.type === "assistant") {
        for (const block of m.message.content) {
          if (block.type !== "tool_use")
            continue;
          const tu = block;
          if (tu.name === EXIT_PLAN_MODE_V2_TOOL_NAME) {
            this.exitPlanCalls.push(tu.id);
          }
        }
      } else if (m.type === "user") {
        const content = m.message.content;
        if (!Array.isArray(content))
          continue;
        for (const block of content) {
          if (block.type === "tool_result") {
            this.results.set(block.tool_use_id, block);
          }
        }
      } else if (m.type === "result" && m.subtype !== "success") {
        this.terminated = { subtype: m.subtype };
      }
    }
    const shouldScan = newEvents.length > 0 || this.rescanAfterRejection;
    this.rescanAfterRejection = false;
    let found = null;
    if (shouldScan) {
      for (let i = this.exitPlanCalls.length - 1;i >= 0; i--) {
        const id = this.exitPlanCalls[i];
        if (this.rejectedIds.has(id))
          continue;
        const tr = this.results.get(id);
        if (!tr) {
          found = { kind: "pending" };
        } else if (tr.is_error === true) {
          const teleportPlan = extractTeleportPlan(tr.content);
          found = teleportPlan !== null ? { kind: "teleport", plan: teleportPlan } : { kind: "rejected", id };
        } else {
          found = { kind: "approved", plan: extractApprovedPlan(tr.content) };
        }
        break;
      }
      if (found?.kind === "approved" || found?.kind === "teleport")
        return found;
    }
    if (found?.kind === "rejected") {
      this.rejectedIds.add(found.id);
      this.rescanAfterRejection = true;
    }
    if (this.terminated) {
      return { kind: "terminated", subtype: this.terminated.subtype };
    }
    if (found?.kind === "rejected") {
      return found;
    }
    if (found?.kind === "pending") {
      this.everSeenPending = true;
      return found;
    }
    return { kind: "unchanged" };
  }
}
async function pollForApprovedExitPlanMode(sessionId, timeoutMs, onPhaseChange, shouldStop) {
  const deadline = Date.now() + timeoutMs;
  const scanner = new ExitPlanModeScanner;
  let cursor = null;
  let failures = 0;
  let lastPhase = "running";
  while (Date.now() < deadline) {
    if (shouldStop?.()) {
      throw new UltraplanPollError("poll stopped by caller", "stopped", scanner.rejectCount);
    }
    let newEvents;
    let sessionStatus;
    try {
      const resp = await pollRemoteSessionEvents(sessionId, cursor);
      newEvents = resp.newEvents;
      cursor = resp.lastEventId;
      sessionStatus = resp.sessionStatus;
      failures = 0;
    } catch (e) {
      const transient = isTransientNetworkError(e);
      if (!transient || ++failures >= MAX_CONSECUTIVE_FAILURES) {
        throw new UltraplanPollError(e instanceof Error ? e.message : String(e), "network_or_unknown", scanner.rejectCount, { cause: e });
      }
      await sleep(POLL_INTERVAL_MS);
      continue;
    }
    let result;
    try {
      result = scanner.ingest(newEvents);
    } catch (e) {
      throw new UltraplanPollError(e instanceof Error ? e.message : String(e), "extract_marker_missing", scanner.rejectCount);
    }
    if (result.kind === "approved") {
      return {
        plan: result.plan,
        rejectCount: scanner.rejectCount,
        executionTarget: "remote"
      };
    }
    if (result.kind === "teleport") {
      return {
        plan: result.plan,
        rejectCount: scanner.rejectCount,
        executionTarget: "local"
      };
    }
    if (result.kind === "terminated") {
      throw new UltraplanPollError(`remote session ended (${result.subtype}) before plan approval`, "terminated", scanner.rejectCount);
    }
    const quietIdle = (sessionStatus === "idle" || sessionStatus === "requires_action") && newEvents.length === 0;
    const phase = scanner.hasPendingPlan ? "plan_ready" : quietIdle ? "needs_input" : "running";
    if (phase !== lastPhase) {
      logForDebugging(`[ultraplan] phase ${lastPhase} \u2192 ${phase}`);
      lastPhase = phase;
      onPhaseChange?.(phase);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new UltraplanPollError(scanner.everSeenPending ? `no approval after ${timeoutMs / 1000}s` : `ExitPlanMode never reached after ${timeoutMs / 1000}s (the remote container failed to start, or session ID mismatch?)`, scanner.everSeenPending ? "timeout_pending" : "timeout_no_plan", scanner.rejectCount);
}
function contentToText(content) {
  return typeof content === "string" ? content : Array.isArray(content) ? content.map((b) => ("text" in b) ? b.text : "").join("") : "";
}
function extractTeleportPlan(content) {
  const text = contentToText(content);
  const marker = `${ULTRAPLAN_TELEPORT_SENTINEL}
`;
  const idx = text.indexOf(marker);
  if (idx === -1)
    return null;
  return text.slice(idx + marker.length).trimEnd();
}
function extractApprovedPlan(content) {
  const text = contentToText(content);
  const markers = [
    `## Approved Plan (edited by user):
`,
    `## Approved Plan:
`
  ];
  for (const marker of markers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      return text.slice(idx + marker.length).trimEnd();
    }
  }
  throw new Error(`ExitPlanMode approved but tool_result has no "## Approved Plan:" marker \u2014 remote may have hit the empty-plan or isAgent branch. Content preview: ${text.slice(0, 200)}`);
}
var POLL_INTERVAL_MS = 3000, MAX_CONSECUTIVE_FAILURES = 5, UltraplanPollError, ULTRAPLAN_TELEPORT_SENTINEL = "__ULTRAPLAN_TELEPORT_LOCAL__";
var init_ccrSession = __esm(() => {
  init_constants2();
  init_debug();
  init_sleep();
  init_api();
  init_teleport();
  UltraplanPollError = class UltraplanPollError extends Error {
    reason;
    rejectCount;
    constructor(message, reason, rejectCount, options) {
      super(message, options);
      this.reason = reason;
      this.rejectCount = rejectCount;
      this.name = "UltraplanPollError";
    }
  };
});

// src/utils/ultraplan/prompt.txt
var require_prompt = __commonJS((exports, module) => {
  module.exports = `
`;
});

// src/commands/ultraplan.tsx
function getUltraplanModel() {
  return getFeatureValue_CACHED_MAY_BE_STALE("tengu_ultraplan_model", ALL_MODEL_CONFIGS.opus46.firstParty);
}
function buildUltraplanPrompt(blurb, seedPlan) {
  const parts = [];
  if (seedPlan) {
    parts.push("Here is a draft plan to refine:", "", seedPlan, "");
  }
  parts.push(ULTRAPLAN_INSTRUCTIONS);
  if (blurb) {
    parts.push("", blurb);
  }
  return parts.join(`
`);
}
function startDetachedPoll(taskId, sessionId, url, getAppState, setAppState) {
  const started = Date.now();
  let failed = false;
  (async () => {
    try {
      const {
        plan,
        rejectCount,
        executionTarget
      } = await pollForApprovedExitPlanMode(sessionId, ULTRAPLAN_TIMEOUT_MS, (phase) => {
        if (phase === "needs_input")
          logEvent("tengu_ultraplan_awaiting_input", {});
        updateTaskState(taskId, setAppState, (t) => {
          if (t.status !== "running")
            return t;
          const next = phase === "running" ? undefined : phase;
          return t.ultraplanPhase === next ? t : {
            ...t,
            ultraplanPhase: next
          };
        });
      }, () => getAppState().tasks?.[taskId]?.status !== "running");
      logEvent("tengu_ultraplan_approved", {
        duration_ms: Date.now() - started,
        plan_length: plan.length,
        reject_count: rejectCount,
        execution_target: executionTarget
      });
      if (executionTarget === "remote") {
        const task = getAppState().tasks?.[taskId];
        if (task?.status !== "running")
          return;
        updateTaskState(taskId, setAppState, (t) => t.status !== "running" ? t : {
          ...t,
          status: "completed",
          endTime: Date.now()
        });
        setAppState((prev) => prev.ultraplanSessionUrl === url ? {
          ...prev,
          ultraplanSessionUrl: undefined
        } : prev);
        enqueuePendingNotification({
          value: [`Ultraplan approved \u2014 executing in Panda Code on the web. Follow along at: ${url}`, "", "Results will land as a pull request when the remote session finishes. There is nothing to do here."].join(`
`),
          mode: "task-notification"
        });
      } else {
        setAppState((prev) => {
          const task = prev.tasks?.[taskId];
          if (!task || task.status !== "running")
            return prev;
          return {
            ...prev,
            ultraplanPendingChoice: {
              plan,
              sessionId,
              taskId
            }
          };
        });
      }
    } catch (e) {
      const task = getAppState().tasks?.[taskId];
      if (task?.status !== "running")
        return;
      failed = true;
      logEvent("tengu_ultraplan_failed", {
        duration_ms: Date.now() - started,
        reason: e instanceof UltraplanPollError ? e.reason : "network_or_unknown",
        reject_count: e instanceof UltraplanPollError ? e.rejectCount : undefined
      });
      enqueuePendingNotification({
        value: `Ultraplan failed: ${errorMessage(e)}

Session: ${url}`,
        mode: "task-notification"
      });
      archiveRemoteSession(sessionId).catch((e2) => logForDebugging(`ultraplan archive failed: ${String(e2)}`));
      setAppState((prev) => prev.ultraplanSessionUrl === url ? {
        ...prev,
        ultraplanSessionUrl: undefined
      } : prev);
    } finally {
      if (failed) {
        updateTaskState(taskId, setAppState, (t) => t.status !== "running" ? t : {
          ...t,
          status: "failed",
          endTime: Date.now()
        });
      }
    }
  })();
}
function buildLaunchMessage(disconnectedBridge) {
  const prefix = disconnectedBridge ? `${REMOTE_CONTROL_DISCONNECTED_MSG} ` : "";
  return `${DIAMOND_OPEN} ultraplan
${prefix}Starting Panda Code on the web\u2026`;
}
function buildSessionReadyMessage(url) {
  return `${DIAMOND_OPEN} ultraplan \xB7 Monitor progress in Panda Code on the web ${url}
You can continue working \u2014 when the ${DIAMOND_OPEN} fills, press \u2193 to view results`;
}
function buildAlreadyActiveMessage(url) {
  return url ? `ultraplan: already polling. Open ${url} to check status, or wait for the plan to land here.` : "ultraplan: already launching. Please wait for the session to start.";
}
async function stopUltraplan(taskId, sessionId, setAppState) {
  await RemoteAgentTask.kill(taskId, setAppState);
  setAppState((prev) => prev.ultraplanSessionUrl || prev.ultraplanPendingChoice || prev.ultraplanLaunching ? {
    ...prev,
    ultraplanSessionUrl: undefined,
    ultraplanPendingChoice: undefined,
    ultraplanLaunching: undefined
  } : prev);
  const url = getRemoteSessionUrl(sessionId, process.env.SESSION_INGRESS_URL);
  enqueuePendingNotification({
    value: `Ultraplan stopped.

Session: ${url}`,
    mode: "task-notification"
  });
  enqueuePendingNotification({
    value: "The user stopped the ultraplan session above. Do not respond to the stop notification \u2014 wait for their next message.",
    mode: "task-notification",
    isMeta: true
  });
}
async function launchUltraplan(opts) {
  const {
    blurb,
    seedPlan,
    getAppState,
    setAppState,
    signal,
    disconnectedBridge,
    onSessionReady
  } = opts;
  const {
    ultraplanSessionUrl: active,
    ultraplanLaunching
  } = getAppState();
  if (active || ultraplanLaunching) {
    logEvent("tengu_ultraplan_create_failed", {
      reason: active ? "already_polling" : "already_launching"
    });
    return buildAlreadyActiveMessage(active);
  }
  if (!blurb && !seedPlan) {
    return [
      'Usage: /ultraplan \\<prompt\\>, or include "ultraplan" anywhere',
      "in your prompt",
      "",
      "Advanced multi-agent plan mode with our most powerful model",
      "(Opus). Runs in Panda Code on the web. When the plan is ready,",
      "you can execute it in the web session or send it back here.",
      "Terminal stays free while the remote plans.",
      "Requires /login.",
      "",
      `Terms: ${CCR_TERMS_URL}`
    ].join(`
`);
  }
  setAppState((prev) => prev.ultraplanLaunching ? prev : {
    ...prev,
    ultraplanLaunching: true
  });
  launchDetached({
    blurb,
    seedPlan,
    getAppState,
    setAppState,
    signal,
    onSessionReady
  });
  return buildLaunchMessage(disconnectedBridge);
}
async function launchDetached(opts) {
  const {
    blurb,
    seedPlan,
    getAppState,
    setAppState,
    signal,
    onSessionReady
  } = opts;
  let sessionId;
  try {
    const model = getUltraplanModel();
    const eligibility = await checkRemoteAgentEligibility();
    if (!eligibility.eligible) {
      const eligErrors = eligibility.errors;
      logEvent("tengu_ultraplan_create_failed", {
        reason: "precondition",
        precondition_errors: eligErrors.map((e) => e.type).join(",")
      });
      const reasons = eligErrors.map(formatPreconditionError).join(`
`);
      enqueuePendingNotification({
        value: `ultraplan: cannot launch remote session \u2014
${reasons}`,
        mode: "task-notification"
      });
      return;
    }
    const prompt = buildUltraplanPrompt(blurb, seedPlan);
    let bundleFailMsg;
    const session = await teleportToRemote({
      initialMessage: prompt,
      description: blurb || "Refine local plan",
      model,
      permissionMode: "plan",
      ultraplan: true,
      signal,
      useDefaultEnvironment: true,
      onBundleFail: (msg) => {
        bundleFailMsg = msg;
      }
    });
    if (!session) {
      logEvent("tengu_ultraplan_create_failed", {
        reason: bundleFailMsg ? "bundle_fail" : "teleport_null"
      });
      enqueuePendingNotification({
        value: `ultraplan: session creation failed${bundleFailMsg ? ` \u2014 ${bundleFailMsg}` : ""}. See --debug for details.`,
        mode: "task-notification"
      });
      return;
    }
    sessionId = session.id;
    const url = getRemoteSessionUrl(session.id, process.env.SESSION_INGRESS_URL);
    setAppState((prev) => ({
      ...prev,
      ultraplanSessionUrl: url,
      ultraplanLaunching: undefined
    }));
    onSessionReady?.(buildSessionReadyMessage(url));
    logEvent("tengu_ultraplan_launched", {
      has_seed_plan: Boolean(seedPlan),
      model
    });
    const {
      taskId
    } = registerRemoteAgentTask({
      remoteTaskType: "ultraplan",
      session: {
        id: session.id,
        title: blurb || "Ultraplan"
      },
      command: blurb,
      context: {
        abortController: new AbortController,
        getAppState,
        setAppState
      },
      isUltraplan: true
    });
    startDetachedPoll(taskId, session.id, url, getAppState, setAppState);
  } catch (e) {
    logError(e);
    logEvent("tengu_ultraplan_create_failed", {
      reason: "unexpected_error"
    });
    enqueuePendingNotification({
      value: `ultraplan: unexpected error \u2014 ${errorMessage(e)}`,
      mode: "task-notification"
    });
    if (sessionId) {
      archiveRemoteSession(sessionId).catch((err) => logForDebugging("ultraplan: failed to archive orphaned session", err));
      setAppState((prev) => prev.ultraplanSessionUrl ? {
        ...prev,
        ultraplanSessionUrl: undefined
      } : prev);
    }
  } finally {
    setAppState((prev) => prev.ultraplanLaunching ? {
      ...prev,
      ultraplanLaunching: undefined
    } : prev);
  }
}
var ULTRAPLAN_TIMEOUT_MS, CCR_TERMS_URL = "https://code.claude.com/docs/en/claude-code-on-the-web", _rawPrompt, DEFAULT_INSTRUCTIONS, ULTRAPLAN_INSTRUCTIONS, call = async (onDone, context, args) => {
  const blurb = args.trim();
  if (!blurb) {
    const msg = await launchUltraplan({
      blurb,
      getAppState: context.getAppState,
      setAppState: context.setAppState,
      signal: context.abortController.signal
    });
    onDone(msg, {
      display: "system"
    });
    return null;
  }
  const {
    ultraplanSessionUrl: active,
    ultraplanLaunching
  } = context.getAppState();
  if (active || ultraplanLaunching) {
    logEvent("tengu_ultraplan_create_failed", {
      reason: active ? "already_polling" : "already_launching"
    });
    onDone(buildAlreadyActiveMessage(active), {
      display: "system"
    });
    return null;
  }
  context.setAppState((prev) => ({
    ...prev,
    ultraplanLaunchPending: {
      blurb
    }
  }));
  onDone(undefined, {
    display: "skip"
  });
  return null;
}, ultraplan_default;
var init_ultraplan = __esm(() => {
  init_types2();
  init_figures2();
  init_product();
  init_growthbook();
  init_analytics();
  init_RemoteAgentTask();
  init_debug();
  init_errors();
  init_log();
  init_messageQueueManager();
  init_configs();
  init_framework();
  init_teleport();
  init_ccrSession();
  ULTRAPLAN_TIMEOUT_MS = 30 * 60 * 1000;
  _rawPrompt = require_prompt();
  DEFAULT_INSTRUCTIONS = (typeof _rawPrompt === "string" ? _rawPrompt : _rawPrompt.default).trimEnd();
  ULTRAPLAN_INSTRUCTIONS = DEFAULT_INSTRUCTIONS;
  ultraplan_default = {
    type: "local-jsx",
    name: "ultraplan",
    description: `~10\u201330 min \xB7 Panda Code on the web drafts an advanced plan you can edit and approve. See ${CCR_TERMS_URL} \xB7 \u6DF1\u5EA6\u8BA1\u5212\uFF1A\u751F\u6210\u53EF\u7F16\u8F91\u5BA1\u6279\u7684\u9AD8\u7EA7\u65B9\u6848`,
    argumentHint: "<prompt>",
    isEnabled: () => false,
    load: () => Promise.resolve({
      call
    })
  };
});

// src/components/tasks/renderToolActivity.tsx
function renderToolActivity(activity, tools, theme) {
  const tool = findToolByName(tools, activity.toolName);
  if (!tool) {
    return activity.toolName;
  }
  try {
    const parsed = tool.inputSchema.safeParse(activity.input);
    const parsedInput = parsed.success ? parsed.data : {};
    const userFacingName = tool.userFacingName(parsedInput);
    if (!userFacingName) {
      return activity.toolName;
    }
    const toolArgs = tool.renderToolUseMessage(parsedInput, {
      theme,
      verbose: false
    });
    if (toolArgs) {
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          userFacingName,
          "(",
          toolArgs,
          ")"
        ]
      }, undefined, true, undefined, this);
    }
    return userFacingName;
  } catch {
    return activity.toolName;
  }
}
var jsx_dev_runtime;
var init_renderToolActivity = __esm(() => {
  init_ink();
  init_Tool();
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/tasks/taskStatusUtils.tsx
function getTaskStatusIcon(status, options) {
  const {
    isIdle,
    awaitingApproval,
    hasError,
    shutdownRequested
  } = options ?? {};
  if (hasError)
    return figures_default.cross;
  if (awaitingApproval)
    return figures_default.questionMarkPrefix;
  if (shutdownRequested)
    return figures_default.warning;
  if (status === "running") {
    if (isIdle)
      return figures_default.ellipsis;
    return figures_default.play;
  }
  if (status === "completed")
    return figures_default.tick;
  if (status === "failed" || status === "killed")
    return figures_default.cross;
  return figures_default.bullet;
}
function getTaskStatusColor(status, options) {
  const {
    isIdle,
    awaitingApproval,
    hasError,
    shutdownRequested
  } = options ?? {};
  if (hasError)
    return "error";
  if (awaitingApproval)
    return "warning";
  if (shutdownRequested)
    return "warning";
  if (isIdle)
    return "background";
  if (status === "completed")
    return "success";
  if (status === "failed")
    return "error";
  if (status === "killed")
    return "warning";
  return "background";
}
function describeTeammateActivity(t) {
  if (t.shutdownRequested)
    return "stopping";
  if (t.awaitingPlanApproval)
    return "awaiting approval";
  if (t.isIdle)
    return "idle";
  return (t.progress?.recentActivities && summarizeRecentActivities(t.progress.recentActivities)) ?? t.progress?.lastActivity?.activityDescription ?? "working";
}
function shouldHideTasksFooter(tasks, showSpinnerTree) {
  if (!showSpinnerTree)
    return false;
  let hasVisibleTask = false;
  for (const t of Object.values(tasks)) {
    if (!isBackgroundTask(t) || false) {
      continue;
    }
    hasVisibleTask = true;
    if (t.type !== "in_process_teammate")
      return false;
  }
  return hasVisibleTask;
}
var init_taskStatusUtils = __esm(() => {
  init_figures();
  init_LocalAgentTask();
  init_types();
  init_collapseReadSearch();
});

// src/components/tasks/AsyncAgentDetailDialog.tsx
function AsyncAgentDetailDialog(t0) {
  const $ = import_compiler_runtime.c(54);
  const {
    agent,
    onDone,
    onKillAgent,
    onBack
  } = t0;
  const [theme] = useTheme();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getTools(getEmptyToolPermissionContext());
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const tools = t1;
  const elapsedTime = useElapsedTime(agent.startTime, agent.status === "running", 1000, agent.totalPausedMs ?? 0);
  let t2;
  if ($[1] !== onDone) {
    t2 = {
      "confirm:yes": onDone
    };
    $[1] = onDone;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = {
      context: "Confirmation"
    };
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  useKeybindings(t2, t3);
  let t4;
  if ($[4] !== agent.status || $[5] !== onBack || $[6] !== onDone || $[7] !== onKillAgent) {
    t4 = (e) => {
      if (e.key === " ") {
        e.preventDefault();
        onDone();
      } else {
        if (e.key === "left" && onBack) {
          e.preventDefault();
          onBack();
        } else {
          if (e.key === "x" && agent.status === "running" && onKillAgent) {
            e.preventDefault();
            onKillAgent();
          }
        }
      }
    };
    $[4] = agent.status;
    $[5] = onBack;
    $[6] = onDone;
    $[7] = onKillAgent;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  const handleKeyDown = t4;
  let t5;
  if ($[9] !== agent.prompt) {
    t5 = extractTag(agent.prompt, "plan");
    $[9] = agent.prompt;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  const planContent = t5;
  const displayPrompt = agent.prompt.length > 300 ? agent.prompt.substring(0, 297) + "\u2026" : agent.prompt;
  const tokenCount = agent.result?.totalTokens ?? agent.progress?.tokenCount;
  const toolUseCount = agent.result?.totalToolUseCount ?? agent.progress?.toolUseCount;
  const t6 = agent.selectedAgent?.agentType ?? "agent";
  const t7 = agent.description || "Async agent";
  let t8;
  if ($[11] !== t6 || $[12] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: [
        t6,
        " \u203A",
        " ",
        t7
      ]
    }, undefined, true, undefined, this);
    $[11] = t6;
    $[12] = t7;
    $[13] = t8;
  } else {
    t8 = $[13];
  }
  const title = t8;
  let t9;
  if ($[14] !== agent.status) {
    t9 = agent.status !== "running" && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      color: getTaskStatusColor(agent.status),
      children: [
        getTaskStatusIcon(agent.status),
        " ",
        agent.status === "completed" ? "Completed" : agent.status === "failed" ? "Failed" : "Stopped",
        " \xB7 "
      ]
    }, undefined, true, undefined, this);
    $[14] = agent.status;
    $[15] = t9;
  } else {
    t9 = $[15];
  }
  let t10;
  if ($[16] !== tokenCount) {
    t10 = tokenCount !== undefined && tokenCount > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(jsx_dev_runtime2.Fragment, {
      children: [
        " \xB7 ",
        formatNumber(tokenCount),
        " tokens"
      ]
    }, undefined, true, undefined, this);
    $[16] = tokenCount;
    $[17] = t10;
  } else {
    t10 = $[17];
  }
  let t11;
  if ($[18] !== toolUseCount) {
    t11 = toolUseCount !== undefined && toolUseCount > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(jsx_dev_runtime2.Fragment, {
      children: [
        " ",
        "\xB7 ",
        toolUseCount,
        " ",
        toolUseCount === 1 ? "tool" : "tools"
      ]
    }, undefined, true, undefined, this);
    $[18] = toolUseCount;
    $[19] = t11;
  } else {
    t11 = $[19];
  }
  let t12;
  if ($[20] !== elapsedTime || $[21] !== t10 || $[22] !== t11) {
    t12 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        elapsedTime,
        t10,
        t11
      ]
    }, undefined, true, undefined, this);
    $[20] = elapsedTime;
    $[21] = t10;
    $[22] = t11;
    $[23] = t12;
  } else {
    t12 = $[23];
  }
  let t13;
  if ($[24] !== t12 || $[25] !== t9) {
    t13 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: [
        t9,
        t12
      ]
    }, undefined, true, undefined, this);
    $[24] = t12;
    $[25] = t9;
    $[26] = t13;
  } else {
    t13 = $[26];
  }
  const subtitle = t13;
  let t14;
  if ($[27] !== agent.status || $[28] !== onBack || $[29] !== onKillAgent) {
    t14 = (exitState) => exitState.pending ? /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Byline, {
      children: [
        onBack && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2190",
          action: "go back"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Esc/Enter/Space",
          action: "close"
        }, undefined, false, undefined, this),
        agent.status === "running" && onKillAgent && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(KeyboardShortcutHint, {
          shortcut: "x",
          action: "stop"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[27] = agent.status;
    $[28] = onBack;
    $[29] = onKillAgent;
    $[30] = t14;
  } else {
    t14 = $[30];
  }
  let t15;
  if ($[31] !== agent.progress || $[32] !== agent.status || $[33] !== theme) {
    t15 = agent.status === "running" && agent.progress?.recentActivities && agent.progress.recentActivities.length > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          bold: true,
          dimColor: true,
          children: "Progress"
        }, undefined, false, undefined, this),
        agent.progress.recentActivities.map((activity, i) => /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          dimColor: i < agent.progress.recentActivities.length - 1,
          wrap: "truncate-end",
          children: [
            i === agent.progress.recentActivities.length - 1 ? "\u203A " : "  ",
            renderToolActivity(activity, tools, theme)
          ]
        }, i, true, undefined, this))
      ]
    }, undefined, true, undefined, this);
    $[31] = agent.progress;
    $[32] = agent.status;
    $[33] = theme;
    $[34] = t15;
  } else {
    t15 = $[34];
  }
  let t16;
  if ($[35] !== displayPrompt || $[36] !== planContent) {
    t16 = planContent ? /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(UserPlanMessage, {
        addMargin: false,
        planContent
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          bold: true,
          dimColor: true,
          children: "Prompt"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          wrap: "wrap",
          children: displayPrompt
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[35] = displayPrompt;
    $[36] = planContent;
    $[37] = t16;
  } else {
    t16 = $[37];
  }
  let t17;
  if ($[38] !== agent.error || $[39] !== agent.status) {
    t17 = agent.status === "failed" && agent.error && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          bold: true,
          color: "error",
          children: "Error"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          color: "error",
          wrap: "wrap",
          children: agent.error
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[38] = agent.error;
    $[39] = agent.status;
    $[40] = t17;
  } else {
    t17 = $[40];
  }
  let t18;
  if ($[41] !== t15 || $[42] !== t16 || $[43] !== t17) {
    t18 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t15,
        t16,
        t17
      ]
    }, undefined, true, undefined, this);
    $[41] = t15;
    $[42] = t16;
    $[43] = t17;
    $[44] = t18;
  } else {
    t18 = $[44];
  }
  let t19;
  if ($[45] !== onDone || $[46] !== subtitle || $[47] !== t14 || $[48] !== t18 || $[49] !== title) {
    t19 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
      title,
      subtitle,
      onCancel: onDone,
      color: "background",
      inputGuide: t14,
      children: t18
    }, undefined, false, undefined, this);
    $[45] = onDone;
    $[46] = subtitle;
    $[47] = t14;
    $[48] = t18;
    $[49] = title;
    $[50] = t19;
  } else {
    t19 = $[50];
  }
  let t20;
  if ($[51] !== handleKeyDown || $[52] !== t19) {
    t20 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: t19
    }, undefined, false, undefined, this);
    $[51] = handleKeyDown;
    $[52] = t19;
    $[53] = t20;
  } else {
    t20 = $[53];
  }
  return t20;
}
var import_compiler_runtime, jsx_dev_runtime2;
var init_AsyncAgentDetailDialog = __esm(() => {
  init_useElapsedTime();
  init_ink();
  init_useKeybinding();
  init_Tool();
  init_tools();
  init_format();
  init_messages();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  init_UserPlanMessage();
  init_renderToolActivity();
  init_taskStatusUtils();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/tasks/RemoteSessionProgress.tsx
function formatReviewStageCounts(stage, found, verified, refuted) {
  if (!stage)
    return `${found} found \xB7 ${verified} verified`;
  if (stage === "synthesizing") {
    const parts = [`${verified} verified`];
    if (refuted > 0)
      parts.push(`${refuted} refuted`);
    parts.push("deduping");
    return parts.join(" \xB7 ");
  }
  if (stage === "verifying") {
    const parts = [`${found} found`, `${verified} verified`];
    if (refuted > 0)
      parts.push(`${refuted} refuted`);
    return parts.join(" \xB7 ");
  }
  return found > 0 ? `${found} found` : "finding";
}
function RainbowText(t0) {
  const $ = import_compiler_runtime2.c(5);
  const {
    text,
    phase: t1
  } = t0;
  const phase = t1 === undefined ? 0 : t1;
  let t2;
  if ($[0] !== text) {
    t2 = [...text];
    $[0] = text;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] !== phase || $[3] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
      children: t2.map((ch, i) => /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        color: getRainbowColor(i + phase),
        children: ch
      }, i, false, undefined, this))
    }, undefined, false, undefined, this);
    $[2] = phase;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
function useSmoothCount(target, time, snap) {
  const displayed = import_react.useRef(target);
  const lastTick = import_react.useRef(time);
  if (snap || target < displayed.current) {
    displayed.current = target;
  } else if (target > displayed.current && time !== lastTick.current) {
    displayed.current += 1;
    lastTick.current = time;
  }
  return displayed.current;
}
function ReviewRainbowLine(t0) {
  const $ = import_compiler_runtime2.c(15);
  const {
    session
  } = t0;
  const settings = useSettings();
  const reducedMotion = settings.prefersReducedMotion ?? false;
  const p = session.reviewProgress;
  const running = session.status === "running";
  const [, time] = useAnimationFrame(running && !reducedMotion ? TICK_MS : null);
  const targetFound = p?.bugsFound ?? 0;
  const targetVerified = p?.bugsVerified ?? 0;
  const targetRefuted = p?.bugsRefuted ?? 0;
  const snap = reducedMotion || !running;
  const found = useSmoothCount(targetFound, time, snap);
  const verified = useSmoothCount(targetVerified, time, snap);
  const refuted = useSmoothCount(targetRefuted, time, snap);
  const phase = Math.floor(time / (TICK_MS * 3)) % 7;
  if (session.status === "completed") {
    let t12;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            color: "background",
            children: [
              DIAMOND_FILLED,
              " "
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(RainbowText, {
            text: "ultrareview",
            phase: 0
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            dimColor: true,
            children: " ready \xB7 shift+\u2193 to view"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[0] = t12;
    } else {
      t12 = $[0];
    }
    return t12;
  }
  if (session.status === "failed") {
    let t12;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            color: "background",
            children: [
              DIAMOND_FILLED,
              " "
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(RainbowText, {
            text: "ultrareview",
            phase: 0
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            color: "error",
            dimColor: true,
            children: [
              " \xB7 ",
              "error"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[1] = t12;
    } else {
      t12 = $[1];
    }
    return t12;
  }
  let t1;
  if ($[2] !== found || $[3] !== p || $[4] !== refuted || $[5] !== verified) {
    t1 = !p ? "setting up" : formatReviewStageCounts(p.stage, found, verified, refuted);
    $[2] = found;
    $[3] = p;
    $[4] = refuted;
    $[5] = verified;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  const tail = t1;
  let t2;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      color: "background",
      children: [
        DIAMOND_OPEN,
        " "
      ]
    }, undefined, true, undefined, this);
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  const t3 = running ? phase : 0;
  let t4;
  if ($[8] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(RainbowText, {
      text: "ultrareview",
      phase: t3
    }, undefined, false, undefined, this);
    $[8] = t3;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] !== tail) {
    t5 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        " \xB7 ",
        tail
      ]
    }, undefined, true, undefined, this);
    $[10] = tail;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  let t6;
  if ($[12] !== t4 || $[13] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(jsx_dev_runtime3.Fragment, {
      children: [
        t2,
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[12] = t4;
    $[13] = t5;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  return t6;
}
function RemoteSessionProgress(t0) {
  const $ = import_compiler_runtime2.c(11);
  const {
    session
  } = t0;
  if (session.isRemoteReview) {
    let t12;
    if ($[0] !== session) {
      t12 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ReviewRainbowLine, {
        session
      }, undefined, false, undefined, this);
      $[0] = session;
      $[1] = t12;
    } else {
      t12 = $[1];
    }
    return t12;
  }
  if (session.status === "completed") {
    let t12;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        bold: true,
        color: "success",
        dimColor: true,
        children: "done"
      }, undefined, false, undefined, this);
      $[2] = t12;
    } else {
      t12 = $[2];
    }
    return t12;
  }
  if (session.status === "failed") {
    let t12;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        bold: true,
        color: "error",
        dimColor: true,
        children: "error"
      }, undefined, false, undefined, this);
      $[3] = t12;
    } else {
      t12 = $[3];
    }
    return t12;
  }
  if (!session.todoList.length) {
    let t12;
    if ($[4] !== session.status) {
      t12 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          session.status,
          "\u2026"
        ]
      }, undefined, true, undefined, this);
      $[4] = session.status;
      $[5] = t12;
    } else {
      t12 = $[5];
    }
    return t12;
  }
  let t1;
  if ($[6] !== session.todoList) {
    t1 = count(session.todoList, _temp);
    $[6] = session.todoList;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  const completed = t1;
  const total = session.todoList.length;
  let t2;
  if ($[8] !== completed || $[9] !== total) {
    t2 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        completed,
        "/",
        total
      ]
    }, undefined, true, undefined, this);
    $[8] = completed;
    $[9] = total;
    $[10] = t2;
  } else {
    t2 = $[10];
  }
  return t2;
}
function _temp(_) {
  return _.status === "completed";
}
var import_compiler_runtime2, import_react, jsx_dev_runtime3, TICK_MS = 80;
var init_RemoteSessionProgress = __esm(() => {
  init_figures2();
  init_useSettings();
  init_ink();
  init_array();
  init_thinking();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/tasks/ShellProgress.tsx
function TaskStatusText(t0) {
  const $ = import_compiler_runtime3.c(4);
  const {
    status,
    label,
    suffix
  } = t0;
  const displayLabel = label ?? status;
  const color = status === "completed" ? "success" : status === "failed" ? "error" : status === "killed" ? "warning" : undefined;
  let t1;
  if ($[0] !== color || $[1] !== displayLabel || $[2] !== suffix) {
    t1 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      color,
      dimColor: true,
      children: [
        "(",
        displayLabel,
        suffix,
        ")"
      ]
    }, undefined, true, undefined, this);
    $[0] = color;
    $[1] = displayLabel;
    $[2] = suffix;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}
function ShellProgress(t0) {
  const $ = import_compiler_runtime3.c(4);
  const {
    shell
  } = t0;
  switch (shell.status) {
    case "completed": {
      let t1;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(TaskStatusText, {
          status: "completed",
          label: "done"
        }, undefined, false, undefined, this);
        $[0] = t1;
      } else {
        t1 = $[0];
      }
      return t1;
    }
    case "failed": {
      let t1;
      if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(TaskStatusText, {
          status: "failed",
          label: "error"
        }, undefined, false, undefined, this);
        $[1] = t1;
      } else {
        t1 = $[1];
      }
      return t1;
    }
    case "killed": {
      let t1;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(TaskStatusText, {
          status: "killed",
          label: "stopped"
        }, undefined, false, undefined, this);
        $[2] = t1;
      } else {
        t1 = $[2];
      }
      return t1;
    }
    case "running":
    case "pending": {
      let t1;
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(TaskStatusText, {
          status: "running"
        }, undefined, false, undefined, this);
        $[3] = t1;
      } else {
        t1 = $[3];
      }
      return t1;
    }
  }
}
var import_compiler_runtime3, jsx_dev_runtime4;
var init_ShellProgress = __esm(() => {
  init_ink();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/tasks/BackgroundTask.tsx
function BackgroundTask(t0) {
  const $ = import_compiler_runtime4.c(92);
  const {
    task,
    maxActivityWidth
  } = t0;
  const activityLimit = maxActivityWidth ?? 40;
  switch (task.type) {
    case "local_bash": {
      const t1 = task.kind === "monitor" ? task.description : task.command;
      let t2;
      if ($[0] !== activityLimit || $[1] !== t1) {
        t2 = truncate(t1, activityLimit, true);
        $[0] = activityLimit;
        $[1] = t1;
        $[2] = t2;
      } else {
        t2 = $[2];
      }
      let t3;
      if ($[3] !== task) {
        t3 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ShellProgress, {
          shell: task
        }, undefined, false, undefined, this);
        $[3] = task;
        $[4] = t3;
      } else {
        t3 = $[4];
      }
      let t4;
      if ($[5] !== t2 || $[6] !== t3) {
        t4 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            t2,
            " ",
            t3
          ]
        }, undefined, true, undefined, this);
        $[5] = t2;
        $[6] = t3;
        $[7] = t4;
      } else {
        t4 = $[7];
      }
      return t4;
    }
    case "remote_agent": {
      if (task.isRemoteReview) {
        let t12;
        if ($[8] !== task) {
          t12 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
            children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(RemoteSessionProgress, {
              session: task
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this);
          $[8] = task;
          $[9] = t12;
        } else {
          t12 = $[9];
        }
        return t12;
      }
      const running = task.status === "running" || task.status === "pending";
      const t1 = running ? DIAMOND_OPEN : DIAMOND_FILLED;
      let t2;
      if ($[10] !== t1) {
        t2 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            t1,
            " "
          ]
        }, undefined, true, undefined, this);
        $[10] = t1;
        $[11] = t2;
      } else {
        t2 = $[11];
      }
      let t3;
      if ($[12] !== activityLimit || $[13] !== task.title) {
        t3 = truncate(task.title, activityLimit, true);
        $[12] = activityLimit;
        $[13] = task.title;
        $[14] = t3;
      } else {
        t3 = $[14];
      }
      let t4;
      if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: " \xB7 "
        }, undefined, false, undefined, this);
        $[15] = t4;
      } else {
        t4 = $[15];
      }
      let t5;
      if ($[16] !== task) {
        t5 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(RemoteSessionProgress, {
          session: task
        }, undefined, false, undefined, this);
        $[16] = task;
        $[17] = t5;
      } else {
        t5 = $[17];
      }
      let t6;
      if ($[18] !== t2 || $[19] !== t3 || $[20] !== t5) {
        t6 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            t2,
            t3,
            t4,
            t5
          ]
        }, undefined, true, undefined, this);
        $[18] = t2;
        $[19] = t3;
        $[20] = t5;
        $[21] = t6;
      } else {
        t6 = $[21];
      }
      return t6;
    }
    case "local_agent": {
      let t1;
      if ($[22] !== activityLimit || $[23] !== task.description) {
        t1 = truncate(task.description, activityLimit, true);
        $[22] = activityLimit;
        $[23] = task.description;
        $[24] = t1;
      } else {
        t1 = $[24];
      }
      const t2 = task.status === "completed" ? "done" : undefined;
      const t3 = task.status === "completed" && !task.notified ? ", unread" : undefined;
      let t4;
      if ($[25] !== t2 || $[26] !== t3 || $[27] !== task.status) {
        t4 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(TaskStatusText, {
          status: task.status,
          label: t2,
          suffix: t3
        }, undefined, false, undefined, this);
        $[25] = t2;
        $[26] = t3;
        $[27] = task.status;
        $[28] = t4;
      } else {
        t4 = $[28];
      }
      let t5;
      if ($[29] !== t1 || $[30] !== t4) {
        t5 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            t1,
            " ",
            t4
          ]
        }, undefined, true, undefined, this);
        $[29] = t1;
        $[30] = t4;
        $[31] = t5;
      } else {
        t5 = $[31];
      }
      return t5;
    }
    case "in_process_teammate": {
      let T0;
      let T1;
      let t1;
      let t2;
      let t3;
      let t4;
      if ($[32] !== activityLimit || $[33] !== task) {
        const activity = describeTeammateActivity(task);
        T1 = ThemedText;
        let t52;
        if ($[40] !== task.identity.color) {
          t52 = toInkColor(task.identity.color);
          $[40] = task.identity.color;
          $[41] = t52;
        } else {
          t52 = $[41];
        }
        if ($[42] !== t52 || $[43] !== task.identity.agentName) {
          t4 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
            color: t52,
            children: [
              "@",
              task.identity.agentName
            ]
          }, undefined, true, undefined, this);
          $[42] = t52;
          $[43] = task.identity.agentName;
          $[44] = t4;
        } else {
          t4 = $[44];
        }
        T0 = ThemedText;
        t1 = true;
        t2 = ": ";
        t3 = truncate(activity, activityLimit, true);
        $[32] = activityLimit;
        $[33] = task;
        $[34] = T0;
        $[35] = T1;
        $[36] = t1;
        $[37] = t2;
        $[38] = t3;
        $[39] = t4;
      } else {
        T0 = $[34];
        T1 = $[35];
        t1 = $[36];
        t2 = $[37];
        t3 = $[38];
        t4 = $[39];
      }
      let t5;
      if ($[45] !== T0 || $[46] !== t1 || $[47] !== t2 || $[48] !== t3) {
        t5 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(T0, {
          dimColor: t1,
          children: [
            t2,
            t3
          ]
        }, undefined, true, undefined, this);
        $[45] = T0;
        $[46] = t1;
        $[47] = t2;
        $[48] = t3;
        $[49] = t5;
      } else {
        t5 = $[49];
      }
      let t6;
      if ($[50] !== T1 || $[51] !== t4 || $[52] !== t5) {
        t6 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(T1, {
          children: [
            t4,
            t5
          ]
        }, undefined, true, undefined, this);
        $[50] = T1;
        $[51] = t4;
        $[52] = t5;
        $[53] = t6;
      } else {
        t6 = $[53];
      }
      return t6;
    }
    case "local_workflow": {
      const t1 = task.workflowName ?? task.summary ?? task.description;
      let t2;
      if ($[54] !== activityLimit || $[55] !== t1) {
        t2 = truncate(t1, activityLimit, true);
        $[54] = activityLimit;
        $[55] = t1;
        $[56] = t2;
      } else {
        t2 = $[56];
      }
      let t3;
      if ($[57] !== task.agentCount || $[58] !== task.status) {
        t3 = task.status === "running" ? `${task.agentCount} ${plural(task.agentCount, "agent")}` : task.status === "completed" ? "done" : undefined;
        $[57] = task.agentCount;
        $[58] = task.status;
        $[59] = t3;
      } else {
        t3 = $[59];
      }
      const t4 = task.status === "completed" && !task.notified ? ", unread" : undefined;
      let t5;
      if ($[60] !== t3 || $[61] !== t4 || $[62] !== task.status) {
        t5 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(TaskStatusText, {
          status: task.status,
          label: t3,
          suffix: t4
        }, undefined, false, undefined, this);
        $[60] = t3;
        $[61] = t4;
        $[62] = task.status;
        $[63] = t5;
      } else {
        t5 = $[63];
      }
      let t6;
      if ($[64] !== t2 || $[65] !== t5) {
        t6 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            t2,
            " ",
            t5
          ]
        }, undefined, true, undefined, this);
        $[64] = t2;
        $[65] = t5;
        $[66] = t6;
      } else {
        t6 = $[66];
      }
      return t6;
    }
    case "monitor_mcp": {
      let t1;
      if ($[67] !== activityLimit || $[68] !== task.description) {
        t1 = truncate(task.description, activityLimit, true);
        $[67] = activityLimit;
        $[68] = task.description;
        $[69] = t1;
      } else {
        t1 = $[69];
      }
      const t2 = task.status === "completed" ? "done" : undefined;
      const t3 = task.status === "completed" && !task.notified ? ", unread" : undefined;
      let t4;
      if ($[70] !== t2 || $[71] !== t3 || $[72] !== task.status) {
        t4 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(TaskStatusText, {
          status: task.status,
          label: t2,
          suffix: t3
        }, undefined, false, undefined, this);
        $[70] = t2;
        $[71] = t3;
        $[72] = task.status;
        $[73] = t4;
      } else {
        t4 = $[73];
      }
      let t5;
      if ($[74] !== t1 || $[75] !== t4) {
        t5 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            t1,
            " ",
            t4
          ]
        }, undefined, true, undefined, this);
        $[74] = t1;
        $[75] = t4;
        $[76] = t5;
      } else {
        t5 = $[76];
      }
      return t5;
    }
    case "dream": {
      const n = task.filesTouched.length;
      let t1;
      if ($[77] !== n || $[78] !== task.phase || $[79] !== task.sessionsReviewing) {
        t1 = task.phase === "updating" && n > 0 ? `${n} ${plural(n, "file")}` : `${task.sessionsReviewing} ${plural(task.sessionsReviewing, "session")}`;
        $[77] = n;
        $[78] = task.phase;
        $[79] = task.sessionsReviewing;
        $[80] = t1;
      } else {
        t1 = $[80];
      }
      const detail = t1;
      let t2;
      if ($[81] !== detail || $[82] !== task.phase) {
        t2 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "\xB7 ",
            task.phase,
            " \xB7 ",
            detail
          ]
        }, undefined, true, undefined, this);
        $[81] = detail;
        $[82] = task.phase;
        $[83] = t2;
      } else {
        t2 = $[83];
      }
      const t3 = task.status === "completed" ? "done" : undefined;
      const t4 = task.status === "completed" && !task.notified ? ", unread" : undefined;
      let t5;
      if ($[84] !== t3 || $[85] !== t4 || $[86] !== task.status) {
        t5 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(TaskStatusText, {
          status: task.status,
          label: t3,
          suffix: t4
        }, undefined, false, undefined, this);
        $[84] = t3;
        $[85] = t4;
        $[86] = task.status;
        $[87] = t5;
      } else {
        t5 = $[87];
      }
      let t6;
      if ($[88] !== t2 || $[89] !== t5 || $[90] !== task.description) {
        t6 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          children: [
            task.description,
            " ",
            t2,
            " ",
            t5
          ]
        }, undefined, true, undefined, this);
        $[88] = t2;
        $[89] = t5;
        $[90] = task.description;
        $[91] = t6;
      } else {
        t6 = $[91];
      }
      return t6;
    }
  }
}
var import_compiler_runtime4, jsx_dev_runtime5;
var init_BackgroundTask = __esm(() => {
  init_ink();
  init_format();
  init_ink2();
  init_stringUtils();
  init_figures2();
  init_RemoteSessionProgress();
  init_ShellProgress();
  init_taskStatusUtils();
  import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/tasks/DreamDetailDialog.tsx
function DreamDetailDialog(t0) {
  const $ = import_compiler_runtime5.c(70);
  const {
    task,
    onDone,
    onBack,
    onKill
  } = t0;
  const elapsedTime = useElapsedTime(task.startTime, task.status === "running", 1000, 0);
  let t1;
  if ($[0] !== onDone) {
    t1 = {
      "confirm:yes": onDone
    };
    $[0] = onDone;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = {
      context: "Confirmation"
    };
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  useKeybindings(t1, t2);
  let t3;
  if ($[3] !== onBack || $[4] !== onDone || $[5] !== onKill || $[6] !== task.status) {
    t3 = (e) => {
      if (e.key === " ") {
        e.preventDefault();
        onDone();
      } else {
        if (e.key === "left" && onBack) {
          e.preventDefault();
          onBack();
        } else {
          if (e.key === "x" && task.status === "running" && onKill) {
            e.preventDefault();
            onKill();
          }
        }
      }
    };
    $[3] = onBack;
    $[4] = onDone;
    $[5] = onKill;
    $[6] = task.status;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const handleKeyDown = t3;
  let T0;
  let T1;
  let T2;
  let t10;
  let t11;
  let t12;
  let t13;
  let t14;
  let t15;
  let t16;
  let t4;
  let t5;
  let t6;
  let t7;
  let t8;
  let t9;
  if ($[8] !== elapsedTime || $[9] !== handleKeyDown || $[10] !== onBack || $[11] !== onDone || $[12] !== onKill || $[13] !== task.filesTouched.length || $[14] !== task.sessionsReviewing || $[15] !== task.status || $[16] !== task.turns) {
    const visibleTurns = task.turns.filter(_temp3);
    const shown = visibleTurns.slice(-VISIBLE_TURNS);
    const hidden = visibleTurns.length - shown.length;
    T2 = ThemedBox_default;
    t13 = "column";
    t14 = 0;
    t15 = true;
    t16 = handleKeyDown;
    T1 = Dialog;
    t8 = "Memory consolidation";
    const t172 = task.sessionsReviewing;
    let t182;
    if ($[33] !== task.sessionsReviewing) {
      t182 = plural(task.sessionsReviewing, "session");
      $[33] = task.sessionsReviewing;
      $[34] = t182;
    } else {
      t182 = $[34];
    }
    let t192;
    if ($[35] !== task.filesTouched.length) {
      t192 = task.filesTouched.length > 0 && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(jsx_dev_runtime6.Fragment, {
        children: [
          " ",
          "\xB7 ",
          task.filesTouched.length,
          " ",
          plural(task.filesTouched.length, "file"),
          " touched"
        ]
      }, undefined, true, undefined, this);
      $[35] = task.filesTouched.length;
      $[36] = t192;
    } else {
      t192 = $[36];
    }
    if ($[37] !== elapsedTime || $[38] !== t182 || $[39] !== t192 || $[40] !== task.sessionsReviewing) {
      t9 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          elapsedTime,
          " \xB7 reviewing ",
          t172,
          " ",
          t182,
          t192
        ]
      }, undefined, true, undefined, this);
      $[37] = elapsedTime;
      $[38] = t182;
      $[39] = t192;
      $[40] = task.sessionsReviewing;
      $[41] = t9;
    } else {
      t9 = $[41];
    }
    t10 = onDone;
    t11 = "background";
    if ($[42] !== onBack || $[43] !== onKill || $[44] !== task.status) {
      t12 = (exitState) => exitState.pending ? /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        children: [
          "Press ",
          exitState.keyName,
          " again to exit"
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(Byline, {
        children: [
          onBack && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(KeyboardShortcutHint, {
            shortcut: "\u2190",
            action: "go back"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(KeyboardShortcutHint, {
            shortcut: "Esc/Enter/Space",
            action: "close"
          }, undefined, false, undefined, this),
          task.status === "running" && onKill && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(KeyboardShortcutHint, {
            shortcut: "x",
            action: "stop"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[42] = onBack;
      $[43] = onKill;
      $[44] = task.status;
      $[45] = t12;
    } else {
      t12 = $[45];
    }
    T0 = ThemedBox_default;
    t4 = "column";
    t5 = 1;
    let t20;
    if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
      t20 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        bold: true,
        children: "Status:"
      }, undefined, false, undefined, this);
      $[46] = t20;
    } else {
      t20 = $[46];
    }
    if ($[47] !== task.status) {
      t6 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        children: [
          t20,
          " ",
          task.status === "running" ? /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            color: "background",
            children: "running"
          }, undefined, false, undefined, this) : task.status === "completed" ? /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            color: "success",
            children: task.status
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
            color: "error",
            children: task.status
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[47] = task.status;
      $[48] = t6;
    } else {
      t6 = $[48];
    }
    t7 = shown.length === 0 ? /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
      dimColor: true,
      children: task.status === "running" ? "Starting\u2026" : "(no text output)"
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(jsx_dev_runtime6.Fragment, {
      children: [
        hidden > 0 && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "(",
            hidden,
            " earlier ",
            plural(hidden, "turn"),
            ")"
          ]
        }, undefined, true, undefined, this),
        shown.map(_temp2)
      ]
    }, undefined, true, undefined, this);
    $[8] = elapsedTime;
    $[9] = handleKeyDown;
    $[10] = onBack;
    $[11] = onDone;
    $[12] = onKill;
    $[13] = task.filesTouched.length;
    $[14] = task.sessionsReviewing;
    $[15] = task.status;
    $[16] = task.turns;
    $[17] = T0;
    $[18] = T1;
    $[19] = T2;
    $[20] = t10;
    $[21] = t11;
    $[22] = t12;
    $[23] = t13;
    $[24] = t14;
    $[25] = t15;
    $[26] = t16;
    $[27] = t4;
    $[28] = t5;
    $[29] = t6;
    $[30] = t7;
    $[31] = t8;
    $[32] = t9;
  } else {
    T0 = $[17];
    T1 = $[18];
    T2 = $[19];
    t10 = $[20];
    t11 = $[21];
    t12 = $[22];
    t13 = $[23];
    t14 = $[24];
    t15 = $[25];
    t16 = $[26];
    t4 = $[27];
    t5 = $[28];
    t6 = $[29];
    t7 = $[30];
    t8 = $[31];
    t9 = $[32];
  }
  let t17;
  if ($[49] !== T0 || $[50] !== t4 || $[51] !== t5 || $[52] !== t6 || $[53] !== t7) {
    t17 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(T0, {
      flexDirection: t4,
      gap: t5,
      children: [
        t6,
        t7
      ]
    }, undefined, true, undefined, this);
    $[49] = T0;
    $[50] = t4;
    $[51] = t5;
    $[52] = t6;
    $[53] = t7;
    $[54] = t17;
  } else {
    t17 = $[54];
  }
  let t18;
  if ($[55] !== T1 || $[56] !== t10 || $[57] !== t11 || $[58] !== t12 || $[59] !== t17 || $[60] !== t8 || $[61] !== t9) {
    t18 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(T1, {
      title: t8,
      subtitle: t9,
      onCancel: t10,
      color: t11,
      inputGuide: t12,
      children: t17
    }, undefined, false, undefined, this);
    $[55] = T1;
    $[56] = t10;
    $[57] = t11;
    $[58] = t12;
    $[59] = t17;
    $[60] = t8;
    $[61] = t9;
    $[62] = t18;
  } else {
    t18 = $[62];
  }
  let t19;
  if ($[63] !== T2 || $[64] !== t13 || $[65] !== t14 || $[66] !== t15 || $[67] !== t16 || $[68] !== t18) {
    t19 = /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(T2, {
      flexDirection: t13,
      tabIndex: t14,
      autoFocus: t15,
      onKeyDown: t16,
      children: t18
    }, undefined, false, undefined, this);
    $[63] = T2;
    $[64] = t13;
    $[65] = t14;
    $[66] = t15;
    $[67] = t16;
    $[68] = t18;
    $[69] = t19;
  } else {
    t19 = $[69];
  }
  return t19;
}
function _temp2(turn, i) {
  return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        wrap: "wrap",
        children: turn.text
      }, undefined, false, undefined, this),
      turn.toolUseCount > 0 && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "  ",
          "(",
          turn.toolUseCount,
          " ",
          plural(turn.toolUseCount, "tool"),
          ")"
        ]
      }, undefined, true, undefined, this)
    ]
  }, i, true, undefined, this);
}
function _temp3(t) {
  return t.text !== "";
}
var import_compiler_runtime5, jsx_dev_runtime6, VISIBLE_TURNS = 6;
var init_DreamDetailDialog = __esm(() => {
  init_useElapsedTime();
  init_ink();
  init_useKeybinding();
  init_stringUtils();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  import_compiler_runtime5 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime6 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/tasks/InProcessTeammateDetailDialog.tsx
function InProcessTeammateDetailDialog(t0) {
  const $ = import_compiler_runtime6.c(63);
  const {
    teammate,
    onDone,
    onKill,
    onBack,
    onForeground
  } = t0;
  const [theme] = useTheme();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getTools(getEmptyToolPermissionContext());
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const tools = t1;
  const elapsedTime = useElapsedTime(teammate.startTime, teammate.status === "running", 1000, teammate.totalPausedMs ?? 0);
  let t2;
  if ($[1] !== onDone) {
    t2 = {
      "confirm:yes": onDone
    };
    $[1] = onDone;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = {
      context: "Confirmation"
    };
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  useKeybindings(t2, t3);
  let t4;
  if ($[4] !== onBack || $[5] !== onDone || $[6] !== onForeground || $[7] !== onKill || $[8] !== teammate.status) {
    t4 = (e) => {
      if (e.key === " ") {
        e.preventDefault();
        onDone();
      } else {
        if (e.key === "left" && onBack) {
          e.preventDefault();
          onBack();
        } else {
          if (e.key === "x" && teammate.status === "running" && onKill) {
            e.preventDefault();
            onKill();
          } else {
            if (e.key === "f" && teammate.status === "running" && onForeground) {
              e.preventDefault();
              onForeground();
            }
          }
        }
      }
    };
    $[4] = onBack;
    $[5] = onDone;
    $[6] = onForeground;
    $[7] = onKill;
    $[8] = teammate.status;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const handleKeyDown = t4;
  let t5;
  if ($[10] !== teammate) {
    t5 = describeTeammateActivity(teammate);
    $[10] = teammate;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  const activity = t5;
  const tokenCount = teammate.result?.totalTokens ?? teammate.progress?.tokenCount;
  const toolUseCount = teammate.result?.totalToolUseCount ?? teammate.progress?.toolUseCount;
  let t6;
  if ($[12] !== teammate.prompt) {
    t6 = truncateToWidth(teammate.prompt, 300);
    $[12] = teammate.prompt;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  const displayPrompt = t6;
  let t7;
  if ($[14] !== teammate.identity.color) {
    t7 = toInkColor(teammate.identity.color);
    $[14] = teammate.identity.color;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  let t8;
  if ($[16] !== t7 || $[17] !== teammate.identity.agentName) {
    t8 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      color: t7,
      children: [
        "@",
        teammate.identity.agentName
      ]
    }, undefined, true, undefined, this);
    $[16] = t7;
    $[17] = teammate.identity.agentName;
    $[18] = t8;
  } else {
    t8 = $[18];
  }
  let t9;
  if ($[19] !== activity) {
    t9 = activity && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        " (",
        activity,
        ")"
      ]
    }, undefined, true, undefined, this);
    $[19] = activity;
    $[20] = t9;
  } else {
    t9 = $[20];
  }
  let t10;
  if ($[21] !== t8 || $[22] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      children: [
        t8,
        t9
      ]
    }, undefined, true, undefined, this);
    $[21] = t8;
    $[22] = t9;
    $[23] = t10;
  } else {
    t10 = $[23];
  }
  const title = t10;
  let t11;
  if ($[24] !== teammate.status) {
    t11 = teammate.status !== "running" && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      color: teammate.status === "completed" ? "success" : teammate.status === "killed" ? "warning" : "error",
      children: [
        teammate.status === "completed" ? "Completed" : teammate.status === "failed" ? "Failed" : "Stopped",
        " \xB7 "
      ]
    }, undefined, true, undefined, this);
    $[24] = teammate.status;
    $[25] = t11;
  } else {
    t11 = $[25];
  }
  let t12;
  if ($[26] !== tokenCount) {
    t12 = tokenCount !== undefined && tokenCount > 0 && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
      children: [
        " \xB7 ",
        formatNumber(tokenCount),
        " tokens"
      ]
    }, undefined, true, undefined, this);
    $[26] = tokenCount;
    $[27] = t12;
  } else {
    t12 = $[27];
  }
  let t13;
  if ($[28] !== toolUseCount) {
    t13 = toolUseCount !== undefined && toolUseCount > 0 && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(jsx_dev_runtime7.Fragment, {
      children: [
        " ",
        "\xB7 ",
        toolUseCount,
        " ",
        toolUseCount === 1 ? "tool" : "tools"
      ]
    }, undefined, true, undefined, this);
    $[28] = toolUseCount;
    $[29] = t13;
  } else {
    t13 = $[29];
  }
  let t14;
  if ($[30] !== elapsedTime || $[31] !== t12 || $[32] !== t13) {
    t14 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        elapsedTime,
        t12,
        t13
      ]
    }, undefined, true, undefined, this);
    $[30] = elapsedTime;
    $[31] = t12;
    $[32] = t13;
    $[33] = t14;
  } else {
    t14 = $[33];
  }
  let t15;
  if ($[34] !== t11 || $[35] !== t14) {
    t15 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      children: [
        t11,
        t14
      ]
    }, undefined, true, undefined, this);
    $[34] = t11;
    $[35] = t14;
    $[36] = t15;
  } else {
    t15 = $[36];
  }
  const subtitle = t15;
  let t16;
  if ($[37] !== onBack || $[38] !== onForeground || $[39] !== onKill || $[40] !== teammate.status) {
    t16 = (exitState) => exitState.pending ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Byline, {
      children: [
        onBack && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2190",
          action: "go back"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Esc/Enter/Space",
          action: "close"
        }, undefined, false, undefined, this),
        teammate.status === "running" && onKill && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(KeyboardShortcutHint, {
          shortcut: "x",
          action: "stop"
        }, undefined, false, undefined, this),
        teammate.status === "running" && onForeground && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(KeyboardShortcutHint, {
          shortcut: "f",
          action: "foreground"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[37] = onBack;
    $[38] = onForeground;
    $[39] = onKill;
    $[40] = teammate.status;
    $[41] = t16;
  } else {
    t16 = $[41];
  }
  let t17;
  if ($[42] !== teammate.progress || $[43] !== teammate.status || $[44] !== theme) {
    t17 = teammate.status === "running" && teammate.progress?.recentActivities && teammate.progress.recentActivities.length > 0 && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          bold: true,
          dimColor: true,
          children: "Progress"
        }, undefined, false, undefined, this),
        teammate.progress.recentActivities.map((activity_0, i) => /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          dimColor: i < teammate.progress.recentActivities.length - 1,
          wrap: "truncate-end",
          children: [
            i === teammate.progress.recentActivities.length - 1 ? "\u203A " : "  ",
            renderToolActivity(activity_0, tools, theme)
          ]
        }, i, true, undefined, this))
      ]
    }, undefined, true, undefined, this);
    $[42] = teammate.progress;
    $[43] = teammate.status;
    $[44] = theme;
    $[45] = t17;
  } else {
    t17 = $[45];
  }
  let t18;
  if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
    t18 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
      bold: true,
      dimColor: true,
      children: "Prompt"
    }, undefined, false, undefined, this);
    $[46] = t18;
  } else {
    t18 = $[46];
  }
  let t19;
  if ($[47] !== displayPrompt) {
    t19 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        t18,
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          wrap: "wrap",
          children: displayPrompt
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[47] = displayPrompt;
    $[48] = t19;
  } else {
    t19 = $[48];
  }
  let t20;
  if ($[49] !== teammate.error || $[50] !== teammate.status) {
    t20 = teammate.status === "failed" && teammate.error && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          bold: true,
          color: "error",
          children: "Error"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedText, {
          color: "error",
          wrap: "wrap",
          children: teammate.error
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[49] = teammate.error;
    $[50] = teammate.status;
    $[51] = t20;
  } else {
    t20 = $[51];
  }
  let t21;
  if ($[52] !== onDone || $[53] !== subtitle || $[54] !== t16 || $[55] !== t17 || $[56] !== t19 || $[57] !== t20 || $[58] !== title) {
    t21 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(Dialog, {
      title,
      subtitle,
      onCancel: onDone,
      color: "background",
      inputGuide: t16,
      children: [
        t17,
        t19,
        t20
      ]
    }, undefined, true, undefined, this);
    $[52] = onDone;
    $[53] = subtitle;
    $[54] = t16;
    $[55] = t17;
    $[56] = t19;
    $[57] = t20;
    $[58] = title;
    $[59] = t21;
  } else {
    t21 = $[59];
  }
  let t22;
  if ($[60] !== handleKeyDown || $[61] !== t21) {
    t22 = /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: t21
    }, undefined, false, undefined, this);
    $[60] = handleKeyDown;
    $[61] = t21;
    $[62] = t22;
  } else {
    t22 = $[62];
  }
  return t22;
}
var import_compiler_runtime6, jsx_dev_runtime7;
var init_InProcessTeammateDetailDialog = __esm(() => {
  init_useElapsedTime();
  init_ink();
  init_useKeybinding();
  init_Tool();
  init_tools();
  init_format();
  init_ink2();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  init_renderToolActivity();
  init_taskStatusUtils();
  import_compiler_runtime6 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime7 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/tasks/RemoteSessionDetailDialog.tsx
function formatToolUseSummary(name, input) {
  if (name === EXIT_PLAN_MODE_V2_TOOL_NAME) {
    return "Review the plan in Panda Code on the web";
  }
  if (!input || typeof input !== "object")
    return name;
  if (name === ASK_USER_QUESTION_TOOL_NAME && "questions" in input) {
    const qs = input.questions;
    if (Array.isArray(qs) && qs[0] && typeof qs[0] === "object") {
      const q = "question" in qs[0] && typeof qs[0].question === "string" && qs[0].question ? qs[0].question : ("header" in qs[0]) && typeof qs[0].header === "string" ? qs[0].header : null;
      if (q) {
        const oneLine = q.replace(/\s+/g, " ").trim();
        return `Answer in browser: ${truncateToWidth(oneLine, 50)}`;
      }
    }
  }
  for (const v of Object.values(input)) {
    if (typeof v === "string" && v.trim()) {
      const oneLine = v.replace(/\s+/g, " ").trim();
      return `${name} ${truncateToWidth(oneLine, 60)}`;
    }
  }
  return name;
}
function UltraplanSessionDetail(t0) {
  const $ = import_compiler_runtime7.c(70);
  const {
    session,
    onDone,
    onBack,
    onKill
  } = t0;
  const running = session.status === "running" || session.status === "pending";
  const phase = session.ultraplanPhase;
  const statusText = running ? phase ? PHASE_LABEL[phase] : "running" : session.status;
  const elapsedTime = useElapsedTime(session.startTime, running, 1000, 0, session.endTime);
  let spawns = 0;
  let calls = 0;
  let lastBlock = null;
  for (const msg of session.log) {
    if (msg.type !== "assistant") {
      continue;
    }
    for (const block of msg.message.content) {
      if (block.type !== "tool_use") {
        continue;
      }
      calls++;
      lastBlock = block;
      if (block.name === AGENT_TOOL_NAME || block.name === LEGACY_AGENT_TOOL_NAME) {
        spawns++;
      }
    }
  }
  const t1 = 1 + spawns;
  let t2;
  if ($[0] !== lastBlock) {
    t2 = lastBlock ? formatToolUseSummary(lastBlock.name, lastBlock.input) : null;
    $[0] = lastBlock;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] !== calls || $[3] !== t1 || $[4] !== t2) {
    t3 = {
      agentsWorking: t1,
      toolCalls: calls,
      lastToolCall: t2
    };
    $[2] = calls;
    $[3] = t1;
    $[4] = t2;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const {
    agentsWorking,
    toolCalls,
    lastToolCall
  } = t3;
  let t4;
  if ($[6] !== session.sessionId) {
    t4 = getRemoteTaskSessionUrl(session.sessionId);
    $[6] = session.sessionId;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  const sessionUrl = t4;
  let t5;
  if ($[8] !== onBack || $[9] !== onDone) {
    t5 = onBack ?? (() => onDone("Remote session details dismissed", {
      display: "system"
    }));
    $[8] = onBack;
    $[9] = onDone;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  const goBackOrClose = t5;
  const [confirmingStop, setConfirmingStop] = import_react2.useState(false);
  if (confirmingStop) {
    let t62;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
      t62 = () => setConfirmingStop(false);
      $[11] = t62;
    } else {
      t62 = $[11];
    }
    let t72;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      t72 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
        dimColor: true,
        children: "This will terminate the Panda Code on the web session."
      }, undefined, false, undefined, this);
      $[12] = t72;
    } else {
      t72 = $[12];
    }
    let t82;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      t82 = {
        label: "Terminate session",
        value: "stop"
      };
      $[13] = t82;
    } else {
      t82 = $[13];
    }
    let t92;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      t92 = [t82, {
        label: "Back",
        value: "back"
      }];
      $[14] = t92;
    } else {
      t92 = $[14];
    }
    let t102;
    if ($[15] !== goBackOrClose || $[16] !== onKill) {
      t102 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Dialog, {
        title: "Stop ultraplan?",
        onCancel: t62,
        color: "background",
        children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          gap: 1,
          children: [
            t72,
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Select, {
              options: t92,
              onChange: (v) => {
                if (v === "stop") {
                  onKill?.();
                  goBackOrClose();
                } else {
                  setConfirmingStop(false);
                }
              }
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this);
      $[15] = goBackOrClose;
      $[16] = onKill;
      $[17] = t102;
    } else {
      t102 = $[17];
    }
    return t102;
  }
  const t6 = phase === "plan_ready" ? DIAMOND_FILLED : DIAMOND_OPEN;
  let t7;
  if ($[18] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      color: "background",
      children: [
        t6,
        " "
      ]
    }, undefined, true, undefined, this);
    $[18] = t6;
    $[19] = t7;
  } else {
    t7 = $[19];
  }
  let t8;
  if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      bold: true,
      children: "ultraplan"
    }, undefined, false, undefined, this);
    $[20] = t8;
  } else {
    t8 = $[20];
  }
  let t9;
  if ($[21] !== elapsedTime || $[22] !== statusText) {
    t9 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        " \xB7 ",
        elapsedTime,
        " \xB7 ",
        statusText
      ]
    }, undefined, true, undefined, this);
    $[21] = elapsedTime;
    $[22] = statusText;
    $[23] = t9;
  } else {
    t9 = $[23];
  }
  let t10;
  if ($[24] !== t7 || $[25] !== t9) {
    t10 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      children: [
        t7,
        t8,
        t9
      ]
    }, undefined, true, undefined, this);
    $[24] = t7;
    $[25] = t9;
    $[26] = t10;
  } else {
    t10 = $[26];
  }
  let t11;
  if ($[27] !== phase) {
    t11 = phase === "plan_ready" && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      color: "success",
      children: [
        figures_default.tick,
        " "
      ]
    }, undefined, true, undefined, this);
    $[27] = phase;
    $[28] = t11;
  } else {
    t11 = $[28];
  }
  let t12;
  if ($[29] !== agentsWorking) {
    t12 = plural(agentsWorking, "agent");
    $[29] = agentsWorking;
    $[30] = t12;
  } else {
    t12 = $[30];
  }
  const t13 = phase ? AGENT_VERB[phase] : "working";
  let t14;
  if ($[31] !== toolCalls) {
    t14 = plural(toolCalls, "call");
    $[31] = toolCalls;
    $[32] = t14;
  } else {
    t14 = $[32];
  }
  let t15;
  if ($[33] !== agentsWorking || $[34] !== t11 || $[35] !== t12 || $[36] !== t13 || $[37] !== t14 || $[38] !== toolCalls) {
    t15 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      children: [
        t11,
        agentsWorking,
        " ",
        t12,
        " ",
        t13,
        " \xB7 ",
        toolCalls,
        " tool",
        " ",
        t14
      ]
    }, undefined, true, undefined, this);
    $[33] = agentsWorking;
    $[34] = t11;
    $[35] = t12;
    $[36] = t13;
    $[37] = t14;
    $[38] = toolCalls;
    $[39] = t15;
  } else {
    t15 = $[39];
  }
  let t16;
  if ($[40] !== lastToolCall) {
    t16 = lastToolCall && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      dimColor: true,
      children: lastToolCall
    }, undefined, false, undefined, this);
    $[40] = lastToolCall;
    $[41] = t16;
  } else {
    t16 = $[41];
  }
  let t17;
  if ($[42] !== sessionUrl) {
    t17 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      dimColor: true,
      children: sessionUrl
    }, undefined, false, undefined, this);
    $[42] = sessionUrl;
    $[43] = t17;
  } else {
    t17 = $[43];
  }
  let t18;
  if ($[44] !== sessionUrl || $[45] !== t17) {
    t18 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Link, {
      url: sessionUrl,
      children: t17
    }, undefined, false, undefined, this);
    $[44] = sessionUrl;
    $[45] = t17;
    $[46] = t18;
  } else {
    t18 = $[46];
  }
  let t19;
  if ($[47] === Symbol.for("react.memo_cache_sentinel")) {
    t19 = {
      label: "Review in Panda Code on the web",
      value: "open"
    };
    $[47] = t19;
  } else {
    t19 = $[47];
  }
  let t20;
  if ($[48] !== onKill || $[49] !== running) {
    t20 = onKill && running ? [{
      label: "Stop ultraplan",
      value: "stop"
    }] : [];
    $[48] = onKill;
    $[49] = running;
    $[50] = t20;
  } else {
    t20 = $[50];
  }
  let t21;
  if ($[51] === Symbol.for("react.memo_cache_sentinel")) {
    t21 = {
      label: "Back",
      value: "back"
    };
    $[51] = t21;
  } else {
    t21 = $[51];
  }
  let t22;
  if ($[52] !== t20) {
    t22 = [t19, ...t20, t21];
    $[52] = t20;
    $[53] = t22;
  } else {
    t22 = $[53];
  }
  let t23;
  if ($[54] !== goBackOrClose || $[55] !== onDone || $[56] !== sessionUrl) {
    t23 = (v_0) => {
      switch (v_0) {
        case "open": {
          openBrowser(sessionUrl);
          onDone();
          return;
        }
        case "stop": {
          setConfirmingStop(true);
          return;
        }
        case "back": {
          goBackOrClose();
          return;
        }
      }
    };
    $[54] = goBackOrClose;
    $[55] = onDone;
    $[56] = sessionUrl;
    $[57] = t23;
  } else {
    t23 = $[57];
  }
  let t24;
  if ($[58] !== t22 || $[59] !== t23) {
    t24 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Select, {
      options: t22,
      onChange: t23
    }, undefined, false, undefined, this);
    $[58] = t22;
    $[59] = t23;
    $[60] = t24;
  } else {
    t24 = $[60];
  }
  let t25;
  if ($[61] !== t15 || $[62] !== t16 || $[63] !== t18 || $[64] !== t24) {
    t25 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t15,
        t16,
        t18,
        t24
      ]
    }, undefined, true, undefined, this);
    $[61] = t15;
    $[62] = t16;
    $[63] = t18;
    $[64] = t24;
    $[65] = t25;
  } else {
    t25 = $[65];
  }
  let t26;
  if ($[66] !== goBackOrClose || $[67] !== t10 || $[68] !== t25) {
    t26 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Dialog, {
      title: t10,
      onCancel: goBackOrClose,
      color: "background",
      children: t25
    }, undefined, false, undefined, this);
    $[66] = goBackOrClose;
    $[67] = t10;
    $[68] = t25;
    $[69] = t26;
  } else {
    t26 = $[69];
  }
  return t26;
}
function StagePipeline(t0) {
  const $ = import_compiler_runtime7.c(15);
  const {
    stage,
    completed,
    hasProgress
  } = t0;
  let t1;
  if ($[0] !== stage) {
    t1 = stage ? STAGES.indexOf(stage) : -1;
    $[0] = stage;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const currentIdx = t1;
  const inSetup = !completed && !hasProgress;
  let t2;
  if ($[2] !== inSetup) {
    t2 = inSetup ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      color: "background",
      children: "Setup"
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Setup"
    }, undefined, false, undefined, this);
    $[2] = inSetup;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      dimColor: true,
      children: " \u2192 "
    }, undefined, false, undefined, this);
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] !== completed || $[6] !== currentIdx || $[7] !== inSetup) {
    t4 = STAGES.map((s, i) => {
      const isCurrent = !completed && !inSetup && i === currentIdx;
      return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(import_react2.default.Fragment, {
        children: [
          i > 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            dimColor: true,
            children: " \u2192 "
          }, undefined, false, undefined, this),
          isCurrent ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            color: "background",
            children: STAGE_LABELS[s]
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            dimColor: true,
            children: STAGE_LABELS[s]
          }, undefined, false, undefined, this)
        ]
      }, s, true, undefined, this);
    });
    $[5] = completed;
    $[6] = currentIdx;
    $[7] = inSetup;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  let t5;
  if ($[9] !== completed) {
    t5 = completed && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      color: "success",
      children: " \u2713"
    }, undefined, false, undefined, this);
    $[9] = completed;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  let t6;
  if ($[11] !== t2 || $[12] !== t4 || $[13] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      children: [
        t2,
        t3,
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[11] = t2;
    $[12] = t4;
    $[13] = t5;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  return t6;
}
function reviewCountsLine(session) {
  const p = session.reviewProgress;
  if (!p)
    return session.status === "completed" ? "done" : "setting up";
  const verified = p.bugsVerified;
  const refuted = p.bugsRefuted ?? 0;
  if (session.status === "completed") {
    const parts = [`${verified} ${plural(verified, "finding")}`];
    if (refuted > 0)
      parts.push(`${refuted} refuted`);
    return parts.join(" \xB7 ");
  }
  return formatReviewStageCounts(p.stage, p.bugsFound, verified, refuted);
}
function ReviewSessionDetail(t0) {
  const $ = import_compiler_runtime7.c(56);
  const {
    session,
    onDone,
    onBack,
    onKill
  } = t0;
  const completed = session.status === "completed";
  const running = session.status === "running" || session.status === "pending";
  const [confirmingStop, setConfirmingStop] = import_react2.useState(false);
  const elapsedTime = useElapsedTime(session.startTime, running, 1000, 0, session.endTime);
  let t1;
  if ($[0] !== onDone) {
    t1 = () => onDone("Remote session details dismissed", {
      display: "system"
    });
    $[0] = onDone;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleClose = t1;
  const goBackOrClose = onBack ?? handleClose;
  let t2;
  if ($[2] !== session.sessionId) {
    t2 = getRemoteTaskSessionUrl(session.sessionId);
    $[2] = session.sessionId;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const sessionUrl = t2;
  const statusLabel = completed ? "ready" : running ? "running" : session.status;
  if (confirmingStop) {
    let t32;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      t32 = () => setConfirmingStop(false);
      $[4] = t32;
    } else {
      t32 = $[4];
    }
    let t42;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
        dimColor: true,
        children: "This archives the remote session and stops local tracking. The review will not complete and any findings so far are discarded."
      }, undefined, false, undefined, this);
      $[5] = t42;
    } else {
      t42 = $[5];
    }
    let t52;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
      t52 = {
        label: "Stop ultrareview",
        value: "stop"
      };
      $[6] = t52;
    } else {
      t52 = $[6];
    }
    let t62;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t62 = [t52, {
        label: "Back",
        value: "back"
      }];
      $[7] = t62;
    } else {
      t62 = $[7];
    }
    let t72;
    if ($[8] !== goBackOrClose || $[9] !== onKill) {
      t72 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Dialog, {
        title: "Stop ultrareview?",
        onCancel: t32,
        color: "background",
        children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          gap: 1,
          children: [
            t42,
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Select, {
              options: t62,
              onChange: (v) => {
                if (v === "stop") {
                  onKill?.();
                  goBackOrClose();
                } else {
                  setConfirmingStop(false);
                }
              }
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this);
      $[8] = goBackOrClose;
      $[9] = onKill;
      $[10] = t72;
    } else {
      t72 = $[10];
    }
    return t72;
  }
  let t3;
  if ($[11] !== completed || $[12] !== onKill || $[13] !== running) {
    t3 = completed ? [{
      label: "Open in Panda Code on the web",
      value: "open"
    }, {
      label: "Dismiss",
      value: "dismiss"
    }] : [{
      label: "Open in Panda Code on the web",
      value: "open"
    }, ...onKill && running ? [{
      label: "Stop ultrareview",
      value: "stop"
    }] : [], {
      label: "Back",
      value: "back"
    }];
    $[11] = completed;
    $[12] = onKill;
    $[13] = running;
    $[14] = t3;
  } else {
    t3 = $[14];
  }
  const options = t3;
  let t4;
  if ($[15] !== goBackOrClose || $[16] !== handleClose || $[17] !== onDone || $[18] !== sessionUrl) {
    t4 = (action) => {
      bb45:
        switch (action) {
          case "open": {
            openBrowser(sessionUrl);
            onDone();
            break bb45;
          }
          case "stop": {
            setConfirmingStop(true);
            break bb45;
          }
          case "back": {
            goBackOrClose();
            break bb45;
          }
          case "dismiss": {
            handleClose();
          }
        }
    };
    $[15] = goBackOrClose;
    $[16] = handleClose;
    $[17] = onDone;
    $[18] = sessionUrl;
    $[19] = t4;
  } else {
    t4 = $[19];
  }
  const handleSelect = t4;
  const t5 = completed ? DIAMOND_FILLED : DIAMOND_OPEN;
  let t6;
  if ($[20] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      color: "background",
      children: [
        t5,
        " "
      ]
    }, undefined, true, undefined, this);
    $[20] = t5;
    $[21] = t6;
  } else {
    t6 = $[21];
  }
  let t7;
  if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      bold: true,
      children: "ultrareview"
    }, undefined, false, undefined, this);
    $[22] = t7;
  } else {
    t7 = $[22];
  }
  let t8;
  if ($[23] !== elapsedTime || $[24] !== statusLabel) {
    t8 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        " \xB7 ",
        elapsedTime,
        " \xB7 ",
        statusLabel
      ]
    }, undefined, true, undefined, this);
    $[23] = elapsedTime;
    $[24] = statusLabel;
    $[25] = t8;
  } else {
    t8 = $[25];
  }
  let t9;
  if ($[26] !== t6 || $[27] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      children: [
        t6,
        t7,
        t8
      ]
    }, undefined, true, undefined, this);
    $[26] = t6;
    $[27] = t8;
    $[28] = t9;
  } else {
    t9 = $[28];
  }
  const t10 = session.reviewProgress?.stage;
  const t11 = !!session.reviewProgress;
  let t12;
  if ($[29] !== completed || $[30] !== t10 || $[31] !== t11) {
    t12 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(StagePipeline, {
      stage: t10,
      completed,
      hasProgress: t11
    }, undefined, false, undefined, this);
    $[29] = completed;
    $[30] = t10;
    $[31] = t11;
    $[32] = t12;
  } else {
    t12 = $[32];
  }
  let t13;
  if ($[33] !== session) {
    t13 = reviewCountsLine(session);
    $[33] = session;
    $[34] = t13;
  } else {
    t13 = $[34];
  }
  let t14;
  if ($[35] !== t13) {
    t14 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      children: t13
    }, undefined, false, undefined, this);
    $[35] = t13;
    $[36] = t14;
  } else {
    t14 = $[36];
  }
  let t15;
  if ($[37] !== sessionUrl) {
    t15 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
      dimColor: true,
      children: sessionUrl
    }, undefined, false, undefined, this);
    $[37] = sessionUrl;
    $[38] = t15;
  } else {
    t15 = $[38];
  }
  let t16;
  if ($[39] !== sessionUrl || $[40] !== t15) {
    t16 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Link, {
      url: sessionUrl,
      children: t15
    }, undefined, false, undefined, this);
    $[39] = sessionUrl;
    $[40] = t15;
    $[41] = t16;
  } else {
    t16 = $[41];
  }
  let t17;
  if ($[42] !== t14 || $[43] !== t16) {
    t17 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t14,
        t16
      ]
    }, undefined, true, undefined, this);
    $[42] = t14;
    $[43] = t16;
    $[44] = t17;
  } else {
    t17 = $[44];
  }
  let t18;
  if ($[45] !== handleSelect || $[46] !== options) {
    t18 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Select, {
      options,
      onChange: handleSelect
    }, undefined, false, undefined, this);
    $[45] = handleSelect;
    $[46] = options;
    $[47] = t18;
  } else {
    t18 = $[47];
  }
  let t19;
  if ($[48] !== t12 || $[49] !== t17 || $[50] !== t18) {
    t19 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t12,
        t17,
        t18
      ]
    }, undefined, true, undefined, this);
    $[48] = t12;
    $[49] = t17;
    $[50] = t18;
    $[51] = t19;
  } else {
    t19 = $[51];
  }
  let t20;
  if ($[52] !== goBackOrClose || $[53] !== t19 || $[54] !== t9) {
    t20 = /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Dialog, {
      title: t9,
      onCancel: goBackOrClose,
      color: "background",
      inputGuide: _temp5,
      children: t19
    }, undefined, false, undefined, this);
    $[52] = goBackOrClose;
    $[53] = t19;
    $[54] = t9;
    $[55] = t20;
  } else {
    t20 = $[55];
  }
  return t20;
}
function _temp5(exitState) {
  return exitState.pending ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
    children: [
      "Press ",
      exitState.keyName,
      " again to exit"
    ]
  }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Byline, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(KeyboardShortcutHint, {
        shortcut: "Enter",
        action: "select"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(KeyboardShortcutHint, {
        shortcut: "Esc",
        action: "go back"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function RemoteSessionDetailDialog({
  session,
  toolUseContext,
  onDone,
  onBack,
  onKill
}) {
  const [isTeleporting, setIsTeleporting] = import_react2.useState(false);
  const [teleportError, setTeleportError] = import_react2.useState(null);
  const lastMessages = import_react2.useMemo(() => {
    if (session.isUltraplan || session.isRemoteReview)
      return [];
    return normalizeMessages(toInternalMessages(session.log)).filter((_) => _.type !== "progress").slice(-3);
  }, [session]);
  if (session.isUltraplan) {
    return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(UltraplanSessionDetail, {
      session,
      onDone,
      onBack,
      onKill
    }, undefined, false, undefined, this);
  }
  if (session.isRemoteReview) {
    return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ReviewSessionDetail, {
      session,
      onDone,
      onBack,
      onKill
    }, undefined, false, undefined, this);
  }
  const handleClose = () => onDone("Remote session details dismissed", {
    display: "system"
  });
  const handleKeyDown = (e) => {
    if (e.key === " ") {
      e.preventDefault();
      onDone("Remote session details dismissed", {
        display: "system"
      });
    } else if (e.key === "left" && onBack) {
      e.preventDefault();
      onBack();
    } else if (e.key === "t" && !isTeleporting) {
      e.preventDefault();
      handleTeleport();
    } else if (e.key === "return") {
      e.preventDefault();
      handleClose();
    }
  };
  async function handleTeleport() {
    setIsTeleporting(true);
    setTeleportError(null);
    try {
      await teleportResumeCodeSession(session.sessionId);
    } catch (err) {
      setTeleportError(errorMessage(err));
    } finally {
      setIsTeleporting(false);
    }
  }
  const displayTitle = truncateToWidth(session.title, 50);
  const displayStatus = session.status === "pending" ? "starting" : session.status;
  return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    tabIndex: 0,
    autoFocus: true,
    onKeyDown: handleKeyDown,
    children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Dialog, {
      title: "Remote session details",
      onCancel: handleClose,
      color: "background",
      inputGuide: (exitState) => exitState.pending ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
        children: [
          "Press ",
          exitState.keyName,
          " again to exit"
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Byline, {
        children: [
          onBack && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(KeyboardShortcutHint, {
            shortcut: "\u2190",
            action: "go back"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(KeyboardShortcutHint, {
            shortcut: "Esc/Enter/Space",
            action: "close"
          }, undefined, false, undefined, this),
          !isTeleporting && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(KeyboardShortcutHint, {
            shortcut: "t",
            action: "teleport"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      children: [
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  bold: true,
                  children: "Status"
                }, undefined, false, undefined, this),
                ":",
                " ",
                displayStatus === "running" || displayStatus === "starting" ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  color: "background",
                  children: displayStatus
                }, undefined, false, undefined, this) : displayStatus === "completed" ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  color: "success",
                  children: displayStatus
                }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  color: "error",
                  children: displayStatus
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  bold: true,
                  children: "Runtime"
                }, undefined, false, undefined, this),
                ":",
                " ",
                formatDuration((session.endTime ?? Date.now()) - session.startTime)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              wrap: "truncate-end",
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  bold: true,
                  children: "Title"
                }, undefined, false, undefined, this),
                ": ",
                displayTitle
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  bold: true,
                  children: "Progress"
                }, undefined, false, undefined, this),
                ":",
                " ",
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(RemoteSessionProgress, {
                  session
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  bold: true,
                  children: "Session URL"
                }, undefined, false, undefined, this),
                ":",
                " ",
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Link, {
                  url: getRemoteTaskSessionUrl(session.sessionId),
                  children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: getRemoteTaskSessionUrl(session.sessionId)
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        session.log.length > 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginTop: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                  bold: true,
                  children: "Recent messages"
                }, undefined, false, undefined, this),
                ":"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
              flexDirection: "column",
              height: 10,
              overflowY: "hidden",
              children: lastMessages.map((msg, i) => /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(Message, {
                message: msg,
                lookups: EMPTY_LOOKUPS,
                addMargin: i > 0,
                tools: toolUseContext.options.tools,
                commands: toolUseContext.options.commands,
                verbose: toolUseContext.options.verbose,
                inProgressToolUseIDs: new Set,
                progressMessagesForMessage: [],
                shouldAnimate: false,
                shouldShowDot: false,
                style: "condensed",
                isTranscriptMode: false,
                isStatic: true
              }, i, false, undefined, this))
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
              marginTop: 1,
              children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
                dimColor: true,
                italic: true,
                children: [
                  "Showing last ",
                  lastMessages.length,
                  " of ",
                  session.log.length,
                  " ",
                  "messages"
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        teleportError && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
            color: "error",
            children: [
              "Teleport failed: ",
              teleportError
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        isTeleporting && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV(ThemedText, {
          color: "background",
          children: "Teleporting to session\u2026"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
var import_compiler_runtime7, import_react2, jsx_dev_runtime8, PHASE_LABEL, AGENT_VERB, STAGES, STAGE_LABELS;
var init_RemoteSessionDetailDialog = __esm(() => {
  init_figures();
  init_figures2();
  init_useElapsedTime();
  init_ink();
  init_RemoteAgentTask();
  init_constants();
  init_prompt();
  init_constants2();
  init_browser();
  init_errors();
  init_format();
  init_mappers();
  init_messages();
  init_stringUtils();
  init_teleport();
  init_select();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  init_Message();
  init_RemoteSessionProgress();
  import_compiler_runtime7 = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime8 = __toESM(require_jsx_dev_runtime(), 1);
  PHASE_LABEL = {
    needs_input: "input required",
    plan_ready: "ready"
  };
  AGENT_VERB = {
    needs_input: "waiting",
    plan_ready: "done"
  };
  STAGES = ["finding", "verifying", "synthesizing"];
  STAGE_LABELS = {
    finding: "Find",
    verifying: "Verify",
    synthesizing: "Dedupe"
  };
});

// src/components/tasks/ShellDetailDialog.tsx
async function getTaskOutput(shell) {
  const path = getTaskOutputPath(shell.id);
  try {
    const result = await tailFile(path, SHELL_DETAIL_TAIL_BYTES);
    return {
      content: result.content,
      bytesTotal: result.bytesTotal
    };
  } catch {
    return {
      content: "",
      bytesTotal: 0
    };
  }
}
function ShellDetailDialog(t0) {
  const $ = import_compiler_runtime8.c(57);
  const {
    shell,
    onDone,
    onKillShell,
    onBack
  } = t0;
  const {
    columns
  } = useTerminalSize();
  let t1;
  if ($[0] !== shell) {
    t1 = () => getTaskOutput(shell);
    $[0] = shell;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [outputPromise, setOutputPromise] = import_react3.useState(t1);
  const deferredOutputPromise = import_react3.useDeferredValue(outputPromise);
  let t2;
  if ($[2] !== shell) {
    t2 = () => {
      if (shell.status !== "running") {
        return;
      }
      const timer = setInterval(_temp6, 1000, setOutputPromise, shell);
      return () => clearInterval(timer);
    };
    $[2] = shell;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== shell.id || $[5] !== shell.status) {
    t3 = [shell.id, shell.status];
    $[4] = shell.id;
    $[5] = shell.status;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  import_react3.useEffect(t2, t3);
  let t4;
  if ($[7] !== onDone) {
    t4 = () => onDone("Shell details dismissed", {
      display: "system"
    });
    $[7] = onDone;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  const handleClose = t4;
  let t5;
  if ($[9] !== handleClose) {
    t5 = {
      "confirm:yes": handleClose
    };
    $[9] = handleClose;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  let t6;
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = {
      context: "Confirmation"
    };
    $[11] = t6;
  } else {
    t6 = $[11];
  }
  useKeybindings(t5, t6);
  let t7;
  if ($[12] !== onBack || $[13] !== onDone || $[14] !== onKillShell || $[15] !== shell.status) {
    t7 = (e) => {
      if (e.key === " ") {
        e.preventDefault();
        onDone("Shell details dismissed", {
          display: "system"
        });
      } else {
        if (e.key === "left" && onBack) {
          e.preventDefault();
          onBack();
        } else {
          if (e.key === "x" && shell.status === "running" && onKillShell) {
            e.preventDefault();
            onKillShell();
          }
        }
      }
    };
    $[12] = onBack;
    $[13] = onDone;
    $[14] = onKillShell;
    $[15] = shell.status;
    $[16] = t7;
  } else {
    t7 = $[16];
  }
  const handleKeyDown = t7;
  const isMonitor = shell.kind === "monitor";
  let t8;
  if ($[17] !== shell.command) {
    t8 = truncateToWidth(shell.command, 280);
    $[17] = shell.command;
    $[18] = t8;
  } else {
    t8 = $[18];
  }
  const displayCommand = t8;
  const t9 = isMonitor ? "Monitor details" : "Shell details";
  let t10;
  if ($[19] !== onBack || $[20] !== onKillShell || $[21] !== shell.status) {
    t10 = (exitState) => exitState.pending ? /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(Byline, {
      children: [
        onBack && /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2190",
          action: "go back"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Esc/Enter/Space",
          action: "close"
        }, undefined, false, undefined, this),
        shell.status === "running" && onKillShell && /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(KeyboardShortcutHint, {
          shortcut: "x",
          action: "stop"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[19] = onBack;
    $[20] = onKillShell;
    $[21] = shell.status;
    $[22] = t10;
  } else {
    t10 = $[22];
  }
  let t11;
  if ($[23] === Symbol.for("react.memo_cache_sentinel")) {
    t11 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      bold: true,
      children: "Status:"
    }, undefined, false, undefined, this);
    $[23] = t11;
  } else {
    t11 = $[23];
  }
  let t12;
  if ($[24] !== shell.result || $[25] !== shell.status) {
    t12 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      children: [
        t11,
        " ",
        shell.status === "running" ? /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
          color: "background",
          children: [
            shell.status,
            shell.result?.code !== undefined && ` (exit code: ${shell.result.code})`
          ]
        }, undefined, true, undefined, this) : shell.status === "completed" ? /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
          color: "success",
          children: [
            shell.status,
            shell.result?.code !== undefined && ` (exit code: ${shell.result.code})`
          ]
        }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
          color: "error",
          children: [
            shell.status,
            shell.result?.code !== undefined && ` (exit code: ${shell.result.code})`
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[24] = shell.result;
    $[25] = shell.status;
    $[26] = t12;
  } else {
    t12 = $[26];
  }
  let t13;
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    t13 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      bold: true,
      children: "Runtime:"
    }, undefined, false, undefined, this);
    $[27] = t13;
  } else {
    t13 = $[27];
  }
  let t14;
  if ($[28] !== shell.endTime) {
    t14 = shell.endTime ?? Date.now();
    $[28] = shell.endTime;
    $[29] = t14;
  } else {
    t14 = $[29];
  }
  const t15 = t14 - shell.startTime;
  let t16;
  if ($[30] !== t15) {
    t16 = formatDuration(t15);
    $[30] = t15;
    $[31] = t16;
  } else {
    t16 = $[31];
  }
  let t17;
  if ($[32] !== t16) {
    t17 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      children: [
        t13,
        " ",
        t16
      ]
    }, undefined, true, undefined, this);
    $[32] = t16;
    $[33] = t17;
  } else {
    t17 = $[33];
  }
  const t18 = isMonitor ? "Script:" : "Command:";
  let t19;
  if ($[34] !== t18) {
    t19 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      bold: true,
      children: t18
    }, undefined, false, undefined, this);
    $[34] = t18;
    $[35] = t19;
  } else {
    t19 = $[35];
  }
  let t20;
  if ($[36] !== displayCommand || $[37] !== t19) {
    t20 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      wrap: "wrap",
      children: [
        t19,
        " ",
        displayCommand
      ]
    }, undefined, true, undefined, this);
    $[36] = displayCommand;
    $[37] = t19;
    $[38] = t20;
  } else {
    t20 = $[38];
  }
  let t21;
  if ($[39] !== t12 || $[40] !== t17 || $[41] !== t20) {
    t21 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t12,
        t17,
        t20
      ]
    }, undefined, true, undefined, this);
    $[39] = t12;
    $[40] = t17;
    $[41] = t20;
    $[42] = t21;
  } else {
    t21 = $[42];
  }
  let t22;
  if ($[43] === Symbol.for("react.memo_cache_sentinel")) {
    t22 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      bold: true,
      children: "Output:"
    }, undefined, false, undefined, this);
    $[43] = t22;
  } else {
    t22 = $[43];
  }
  let t23;
  if ($[44] === Symbol.for("react.memo_cache_sentinel")) {
    t23 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Loading output\u2026"
    }, undefined, false, undefined, this);
    $[44] = t23;
  } else {
    t23 = $[44];
  }
  let t24;
  if ($[45] !== columns || $[46] !== deferredOutputPromise) {
    t24 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t22,
        /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(import_react3.Suspense, {
          fallback: t23,
          children: /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ShellOutputContent, {
            outputPromise: deferredOutputPromise,
            columns
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[45] = columns;
    $[46] = deferredOutputPromise;
    $[47] = t24;
  } else {
    t24 = $[47];
  }
  let t25;
  if ($[48] !== handleClose || $[49] !== t10 || $[50] !== t21 || $[51] !== t24 || $[52] !== t9) {
    t25 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(Dialog, {
      title: t9,
      onCancel: handleClose,
      color: "background",
      inputGuide: t10,
      children: [
        t21,
        t24
      ]
    }, undefined, true, undefined, this);
    $[48] = handleClose;
    $[49] = t10;
    $[50] = t21;
    $[51] = t24;
    $[52] = t9;
    $[53] = t25;
  } else {
    t25 = $[53];
  }
  let t26;
  if ($[54] !== handleKeyDown || $[55] !== t25) {
    t26 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: t25
    }, undefined, false, undefined, this);
    $[54] = handleKeyDown;
    $[55] = t25;
    $[56] = t26;
  } else {
    t26 = $[56];
  }
  return t26;
}
function _temp6(setOutputPromise_0, shell_0) {
  return setOutputPromise_0(getTaskOutput(shell_0));
}
function ShellOutputContent(t0) {
  const $ = import_compiler_runtime8.c(19);
  const {
    outputPromise,
    columns
  } = t0;
  const {
    content,
    bytesTotal
  } = import_react3.use(outputPromise);
  if (!content) {
    let t12;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
        dimColor: true,
        children: "No output available"
      }, undefined, false, undefined, this);
      $[0] = t12;
    } else {
      t12 = $[0];
    }
    return t12;
  }
  let isIncomplete;
  let rendered;
  if ($[1] !== bytesTotal || $[2] !== content) {
    const starts = [];
    let pos = content.length;
    for (let i = 0;i < 10 && pos > 0; i++) {
      const prev = content.lastIndexOf(`
`, pos - 1);
      starts.push(prev + 1);
      pos = prev;
    }
    starts.reverse();
    isIncomplete = bytesTotal > content.length;
    rendered = [];
    for (let i_0 = 0;i_0 < starts.length; i_0++) {
      const start = starts[i_0];
      const end = i_0 < starts.length - 1 ? starts[i_0 + 1] - 1 : content.length;
      const line = content.slice(start, end);
      if (line) {
        rendered.push(line);
      }
    }
    $[1] = bytesTotal;
    $[2] = content;
    $[3] = isIncomplete;
    $[4] = rendered;
  } else {
    isIncomplete = $[3];
    rendered = $[4];
  }
  const t1 = columns - 6;
  let t2;
  if ($[5] !== rendered) {
    t2 = rendered.map(_temp22);
    $[5] = rendered;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  let t3;
  if ($[7] !== t1 || $[8] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedBox_default, {
      borderStyle: "round",
      paddingX: 1,
      flexDirection: "column",
      height: 12,
      maxWidth: t1,
      children: t2
    }, undefined, false, undefined, this);
    $[7] = t1;
    $[8] = t2;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  const t4 = `Showing ${rendered.length} lines`;
  let t5;
  if ($[10] !== bytesTotal || $[11] !== isIncomplete) {
    t5 = isIncomplete ? ` of ${formatFileSize(bytesTotal)}` : "";
    $[10] = bytesTotal;
    $[11] = isIncomplete;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  let t6;
  if ($[13] !== t4 || $[14] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
      dimColor: true,
      italic: true,
      children: [
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[13] = t4;
    $[14] = t5;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  let t7;
  if ($[16] !== t3 || $[17] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(jsx_dev_runtime9.Fragment, {
      children: [
        t3,
        t6
      ]
    }, undefined, true, undefined, this);
    $[16] = t3;
    $[17] = t6;
    $[18] = t7;
  } else {
    t7 = $[18];
  }
  return t7;
}
function _temp22(line_0, i_1) {
  return /* @__PURE__ */ jsx_dev_runtime9.jsxDEV(ThemedText, {
    wrap: "truncate-end",
    children: line_0
  }, i_1, false, undefined, this);
}
var import_compiler_runtime8, import_react3, jsx_dev_runtime9, SHELL_DETAIL_TAIL_BYTES = 8192;
var init_ShellDetailDialog = __esm(() => {
  init_useTerminalSize();
  init_ink();
  init_useKeybinding();
  init_format();
  init_fsOperations();
  init_diskOutput();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  import_compiler_runtime8 = __toESM(require_compiler_runtime(), 1);
  import_react3 = __toESM(require_react(), 1);
  jsx_dev_runtime9 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/tasks/BackgroundTasksDialog.tsx
function getSelectableBackgroundTasks(tasks, foregroundedTaskId) {
  const backgroundTasks = Object.values(tasks ?? {}).filter(isBackgroundTask);
  return backgroundTasks.filter((task) => !(task.type === "local_agent" && task.id === foregroundedTaskId));
}
function BackgroundTasksDialog({
  onDone,
  toolUseContext,
  initialDetailTaskId
}) {
  const tasks = useAppState((s) => s.tasks);
  const foregroundedTaskId = useAppState((s_0) => s_0.foregroundedTaskId);
  const showSpinnerTree = useAppState((s_1) => s_1.expandedView) === "teammates";
  const setAppState = useSetAppState();
  const killAgentsShortcut = useShortcutDisplay("chat:killAgents", "Chat", "ctrl+x ctrl+k");
  const typedTasks = tasks;
  const skippedListOnMount = import_react4.useRef(false);
  const [viewState, setViewState] = import_react4.useState(() => {
    if (initialDetailTaskId) {
      skippedListOnMount.current = true;
      return {
        mode: "detail",
        itemId: initialDetailTaskId
      };
    }
    const allItems = getSelectableBackgroundTasks(typedTasks, foregroundedTaskId);
    if (allItems.length === 1) {
      skippedListOnMount.current = true;
      return {
        mode: "detail",
        itemId: allItems[0].id
      };
    }
    return {
      mode: "list"
    };
  });
  const [selectedIndex, setSelectedIndex] = import_react4.useState(0);
  useRegisterOverlay("background-tasks-dialog", undefined);
  const {
    bashTasks,
    remoteSessions,
    agentTasks,
    teammateTasks,
    workflowTasks,
    mcpMonitors,
    dreamTasks: dreamTasks_0,
    allSelectableItems
  } = import_react4.useMemo(() => {
    const backgroundTasks = Object.values(typedTasks ?? {}).filter(isBackgroundTask);
    const allItems_0 = backgroundTasks.map(toListItem);
    const sorted = allItems_0.sort((a, b) => {
      const aStatus = a.status;
      const bStatus = b.status;
      if (aStatus === "running" && bStatus !== "running")
        return -1;
      if (aStatus !== "running" && bStatus === "running")
        return 1;
      const aTime = "task" in a ? a.task.startTime : 0;
      const bTime = "task" in b ? b.task.startTime : 0;
      return bTime - aTime;
    });
    const bash = sorted.filter((item) => item.type === "local_bash");
    const remote = sorted.filter((item_0) => item_0.type === "remote_agent");
    const agent = sorted.filter((item_1) => item_1.type === "local_agent" && item_1.id !== foregroundedTaskId);
    const workflows = sorted.filter((item_2) => item_2.type === "local_workflow");
    const monitorMcp = sorted.filter((item_3) => item_3.type === "monitor_mcp");
    const dreamTasks = sorted.filter((item_4) => item_4.type === "dream");
    const teammates = showSpinnerTree ? [] : sorted.filter((item_5) => item_5.type === "in_process_teammate");
    const leaderItem = teammates.length > 0 ? [{
      id: "__leader__",
      type: "leader",
      label: `@${TEAM_LEAD_NAME}`,
      status: "running"
    }] : [];
    return {
      bashTasks: bash,
      remoteSessions: remote,
      agentTasks: agent,
      workflowTasks: workflows,
      mcpMonitors: monitorMcp,
      dreamTasks,
      teammateTasks: [...leaderItem, ...teammates],
      allSelectableItems: [...leaderItem, ...teammates, ...bash, ...monitorMcp, ...remote, ...agent, ...workflows, ...dreamTasks]
    };
  }, [typedTasks, foregroundedTaskId, showSpinnerTree]);
  const currentSelection = allSelectableItems[selectedIndex] ?? null;
  useKeybindings({
    "confirm:previous": () => setSelectedIndex((prev) => Math.max(0, prev - 1)),
    "confirm:next": () => setSelectedIndex((prev_0) => Math.min(allSelectableItems.length - 1, prev_0 + 1)),
    "confirm:yes": () => {
      const current = allSelectableItems[selectedIndex];
      if (current) {
        if (current.type === "leader") {
          exitTeammateView(setAppState);
          onDone("Viewing leader", {
            display: "system"
          });
        } else {
          setViewState({
            mode: "detail",
            itemId: current.id
          });
        }
      }
    }
  }, {
    context: "Confirmation",
    isActive: viewState.mode === "list"
  });
  const handleKeyDown = (e) => {
    if (viewState.mode !== "list")
      return;
    if (e.key === "left") {
      e.preventDefault();
      onDone("Background tasks dialog dismissed", {
        display: "system"
      });
      return;
    }
    const currentSelection_0 = allSelectableItems[selectedIndex];
    if (!currentSelection_0)
      return;
    if (e.key === "x") {
      e.preventDefault();
      if (currentSelection_0.type === "local_bash" && currentSelection_0.status === "running") {
        killShellTask(currentSelection_0.id);
      } else if (currentSelection_0.type === "local_agent" && currentSelection_0.status === "running") {
        killAgentTask(currentSelection_0.id);
      } else if (currentSelection_0.type === "in_process_teammate" && currentSelection_0.status === "running") {
        killTeammateTask(currentSelection_0.id);
      } else if (currentSelection_0.type === "local_workflow" && currentSelection_0.status === "running" && killWorkflowTask) {
        killWorkflowTask(currentSelection_0.id, setAppState);
      } else if (currentSelection_0.type === "monitor_mcp" && currentSelection_0.status === "running" && killMonitorMcp) {
        killMonitorMcp(currentSelection_0.id, setAppState);
      } else if (currentSelection_0.type === "dream" && currentSelection_0.status === "running") {
        killDreamTask(currentSelection_0.id);
      } else if (currentSelection_0.type === "remote_agent" && currentSelection_0.status === "running") {
        if (currentSelection_0.task.isUltraplan) {
          stopUltraplan(currentSelection_0.id, currentSelection_0.task.sessionId, setAppState);
        } else {
          killRemoteAgentTask(currentSelection_0.id);
        }
      }
    }
    if (e.key === "f") {
      if (currentSelection_0.type === "in_process_teammate" && currentSelection_0.status === "running") {
        e.preventDefault();
        enterTeammateView(currentSelection_0.id, setAppState);
        onDone("Viewing teammate", {
          display: "system"
        });
      } else if (currentSelection_0.type === "leader") {
        e.preventDefault();
        exitTeammateView(setAppState);
        onDone("Viewing leader", {
          display: "system"
        });
      }
    }
  };
  async function killShellTask(taskId) {
    await LocalShellTask.kill(taskId, setAppState);
  }
  async function killAgentTask(taskId_0) {
    await LocalAgentTask.kill(taskId_0, setAppState);
  }
  async function killTeammateTask(taskId_1) {
    await InProcessTeammateTask.kill(taskId_1, setAppState);
  }
  async function killDreamTask(taskId_2) {
    await DreamTask.kill(taskId_2, setAppState);
  }
  async function killRemoteAgentTask(taskId_3) {
    await RemoteAgentTask.kill(taskId_3, setAppState);
  }
  const onDoneEvent = import_react4.useEffectEvent(onDone);
  import_react4.useEffect(() => {
    if (viewState.mode !== "list") {
      const task = (typedTasks ?? {})[viewState.itemId];
      if (!task || task.type !== "local_workflow" && !isBackgroundTask(task)) {
        if (skippedListOnMount.current) {
          onDoneEvent("Background tasks dialog dismissed", {
            display: "system"
          });
        } else {
          setViewState({
            mode: "list"
          });
        }
      }
    }
    const totalItems = allSelectableItems.length;
    if (selectedIndex >= totalItems && totalItems > 0) {
      setSelectedIndex(totalItems - 1);
    }
  }, [viewState, typedTasks, selectedIndex, allSelectableItems, onDoneEvent]);
  const goBackToList = () => {
    if (skippedListOnMount.current && allSelectableItems.length <= 1) {
      onDone("Background tasks dialog dismissed", {
        display: "system"
      });
    } else {
      skippedListOnMount.current = false;
      setViewState({
        mode: "list"
      });
    }
  };
  if (viewState.mode !== "list" && typedTasks) {
    const task_0 = typedTasks[viewState.itemId];
    if (!task_0) {
      return null;
    }
    switch (task_0.type) {
      case "local_bash":
        return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ShellDetailDialog, {
          shell: task_0,
          onDone,
          onKillShell: () => void killShellTask(task_0.id),
          onBack: goBackToList
        }, `shell-${task_0.id}`, false, undefined, this);
      case "local_agent":
        return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(AsyncAgentDetailDialog, {
          agent: task_0,
          onDone,
          onKillAgent: () => void killAgentTask(task_0.id),
          onBack: goBackToList
        }, `agent-${task_0.id}`, false, undefined, this);
      case "remote_agent":
        return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(RemoteSessionDetailDialog, {
          session: task_0,
          onDone,
          toolUseContext,
          onBack: goBackToList,
          onKill: task_0.status !== "running" ? undefined : task_0.isUltraplan ? () => void stopUltraplan(task_0.id, task_0.sessionId, setAppState) : () => void killRemoteAgentTask(task_0.id)
        }, `session-${task_0.id}`, false, undefined, this);
      case "in_process_teammate":
        return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(InProcessTeammateDetailDialog, {
          teammate: task_0,
          onDone,
          onKill: task_0.status === "running" ? () => void killTeammateTask(task_0.id) : undefined,
          onBack: goBackToList,
          onForeground: task_0.status === "running" ? () => {
            enterTeammateView(task_0.id, setAppState);
            onDone("Viewing teammate", {
              display: "system"
            });
          } : undefined
        }, `teammate-${task_0.id}`, false, undefined, this);
      case "local_workflow":
        if (!WorkflowDetailDialog)
          return null;
        return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(WorkflowDetailDialog, {
          workflow: task_0,
          onDone,
          onKill: task_0.status === "running" && killWorkflowTask ? () => killWorkflowTask(task_0.id, setAppState) : undefined,
          onSkipAgent: task_0.status === "running" && skipWorkflowAgent ? (agentId) => skipWorkflowAgent(task_0.id, agentId, setAppState) : undefined,
          onRetryAgent: task_0.status === "running" && retryWorkflowAgent ? (agentId_0) => retryWorkflowAgent(task_0.id, agentId_0, setAppState) : undefined,
          onBack: goBackToList
        }, `workflow-${task_0.id}`, false, undefined, this);
      case "monitor_mcp":
        if (!MonitorMcpDetailDialog)
          return null;
        return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(MonitorMcpDetailDialog, {
          task: task_0,
          onKill: task_0.status === "running" && killMonitorMcp ? () => killMonitorMcp(task_0.id, setAppState) : undefined,
          onBack: goBackToList
        }, `monitor-mcp-${task_0.id}`, false, undefined, this);
      case "dream":
        return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(DreamDetailDialog, {
          task: task_0,
          onDone: () => onDone("Background tasks dialog dismissed", {
            display: "system"
          }),
          onBack: goBackToList,
          onKill: task_0.status === "running" ? () => void killDreamTask(task_0.id) : undefined
        }, `dream-${task_0.id}`, false, undefined, this);
    }
  }
  const runningBashCount = count(bashTasks, (_) => _.status === "running");
  const runningAgentCount = count(remoteSessions, (__0) => __0.status === "running" || __0.status === "pending") + count(agentTasks, (__1) => __1.status === "running");
  const runningTeammateCount = count(teammateTasks, (__2) => __2.status === "running");
  const subtitle = intersperse([...runningTeammateCount > 0 ? [/* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
    children: [
      runningTeammateCount,
      " ",
      runningTeammateCount !== 1 ? "agents" : "agent"
    ]
  }, "teammates", true, undefined, this)] : [], ...runningBashCount > 0 ? [/* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
    children: [
      runningBashCount,
      " ",
      runningBashCount !== 1 ? "active shells" : "active shell"
    ]
  }, "shells", true, undefined, this)] : [], ...runningAgentCount > 0 ? [/* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
    children: [
      runningAgentCount,
      " ",
      runningAgentCount !== 1 ? "active agents" : "active agent"
    ]
  }, "agents", true, undefined, this)] : []], (index) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
    children: " \xB7 "
  }, `separator-${index}`, false, undefined, this));
  const actions = [/* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
    shortcut: "\u2191/\u2193",
    action: "select"
  }, "upDown", false, undefined, this), /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
    shortcut: "Enter",
    action: "view"
  }, "enter", false, undefined, this), ...currentSelection?.type === "in_process_teammate" && currentSelection.status === "running" ? [/* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
    shortcut: "f",
    action: "foreground"
  }, "foreground", false, undefined, this)] : [], ...(currentSelection?.type === "local_bash" || currentSelection?.type === "local_agent" || currentSelection?.type === "in_process_teammate" || currentSelection?.type === "local_workflow" || currentSelection?.type === "monitor_mcp" || currentSelection?.type === "dream" || currentSelection?.type === "remote_agent") && currentSelection.status === "running" ? [/* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
    shortcut: "x",
    action: "stop"
  }, "kill", false, undefined, this)] : [], ...agentTasks.some((t) => t.status === "running") ? [/* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
    shortcut: killAgentsShortcut,
    action: "stop all agents"
  }, "kill-all", false, undefined, this)] : [], /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(KeyboardShortcutHint, {
    shortcut: "\u2190/Esc",
    action: "close"
  }, "esc", false, undefined, this)];
  const handleCancel = () => onDone("Background tasks dialog dismissed", {
    display: "system"
  });
  function renderInputGuide(exitState) {
    if (exitState.pending) {
      return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
        children: [
          "Press ",
          exitState.keyName,
          " again to exit"
        ]
      }, undefined, true, undefined, this);
    }
    return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Byline, {
      children: actions
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    tabIndex: 0,
    autoFocus: true,
    onKeyDown: handleKeyDown,
    children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Dialog, {
      title: "Background tasks",
      subtitle: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
        children: subtitle
      }, undefined, false, undefined, this),
      onCancel: handleCancel,
      color: "background",
      inputGuide: renderInputGuide,
      children: allSelectableItems.length === 0 ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
        dimColor: true,
        children: "No tasks currently running"
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          teammateTasks.length > 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            children: [
              (bashTasks.length > 0 || remoteSessions.length > 0 || agentTasks.length > 0) && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: [
                      "  ",
                      "Agents"
                    ]
                  }, undefined, true, undefined, this),
                  " (",
                  count(teammateTasks, (i) => i.type !== "leader"),
                  ")"
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                flexDirection: "column",
                children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(TeammateTaskGroups, {
                  teammateTasks,
                  currentSelectionId: currentSelection?.id
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          bashTasks.length > 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginTop: teammateTasks.length > 0 ? 1 : 0,
            children: [
              (teammateTasks.length > 0 || remoteSessions.length > 0 || agentTasks.length > 0) && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: [
                      "  ",
                      "Shells"
                    ]
                  }, undefined, true, undefined, this),
                  " (",
                  bashTasks.length,
                  ")"
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                flexDirection: "column",
                children: bashTasks.map((item_6) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Item, {
                  item: item_6,
                  isSelected: item_6.id === currentSelection?.id
                }, item_6.id, false, undefined, this))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          mcpMonitors.length > 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginTop: teammateTasks.length > 0 || bashTasks.length > 0 ? 1 : 0,
            children: [
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: [
                      "  ",
                      "Monitors"
                    ]
                  }, undefined, true, undefined, this),
                  " (",
                  mcpMonitors.length,
                  ")"
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                flexDirection: "column",
                children: mcpMonitors.map((item_7) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Item, {
                  item: item_7,
                  isSelected: item_7.id === currentSelection?.id
                }, item_7.id, false, undefined, this))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          remoteSessions.length > 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginTop: teammateTasks.length > 0 || bashTasks.length > 0 || mcpMonitors.length > 0 ? 1 : 0,
            children: [
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: [
                      "  ",
                      "Remote agents"
                    ]
                  }, undefined, true, undefined, this),
                  " (",
                  remoteSessions.length,
                  ")"
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                flexDirection: "column",
                children: remoteSessions.map((item_8) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Item, {
                  item: item_8,
                  isSelected: item_8.id === currentSelection?.id
                }, item_8.id, false, undefined, this))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          agentTasks.length > 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginTop: teammateTasks.length > 0 || bashTasks.length > 0 || mcpMonitors.length > 0 || remoteSessions.length > 0 ? 1 : 0,
            children: [
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: [
                      "  ",
                      "Local agents"
                    ]
                  }, undefined, true, undefined, this),
                  " (",
                  agentTasks.length,
                  ")"
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                flexDirection: "column",
                children: agentTasks.map((item_9) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Item, {
                  item: item_9,
                  isSelected: item_9.id === currentSelection?.id
                }, item_9.id, false, undefined, this))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          workflowTasks.length > 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginTop: teammateTasks.length > 0 || bashTasks.length > 0 || mcpMonitors.length > 0 || remoteSessions.length > 0 || agentTasks.length > 0 ? 1 : 0,
            children: [
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
                    bold: true,
                    children: [
                      "  ",
                      "Workflows"
                    ]
                  }, undefined, true, undefined, this),
                  " (",
                  workflowTasks.length,
                  ")"
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
                flexDirection: "column",
                children: workflowTasks.map((item_10) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Item, {
                  item: item_10,
                  isSelected: item_10.id === currentSelection?.id
                }, item_10.id, false, undefined, this))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          dreamTasks_0.length > 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginTop: teammateTasks.length > 0 || bashTasks.length > 0 || mcpMonitors.length > 0 || remoteSessions.length > 0 || agentTasks.length > 0 || workflowTasks.length > 0 ? 1 : 0,
            children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
              flexDirection: "column",
              children: dreamTasks_0.map((item_11) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Item, {
                item: item_11,
                isSelected: item_11.id === currentSelection?.id
              }, item_11.id, false, undefined, this))
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
function toListItem(task) {
  switch (task.type) {
    case "local_bash":
      return {
        id: task.id,
        type: "local_bash",
        label: task.kind === "monitor" ? task.description : task.command,
        status: task.status,
        task
      };
    case "remote_agent":
      return {
        id: task.id,
        type: "remote_agent",
        label: task.title,
        status: task.status,
        task
      };
    case "local_agent":
      return {
        id: task.id,
        type: "local_agent",
        label: task.description,
        status: task.status,
        task
      };
    case "in_process_teammate":
      return {
        id: task.id,
        type: "in_process_teammate",
        label: `@${task.identity.agentName}`,
        status: task.status,
        task
      };
    case "local_workflow":
      return {
        id: task.id,
        type: "local_workflow",
        label: task.summary ?? task.description,
        status: task.status,
        task
      };
    case "monitor_mcp":
      return {
        id: task.id,
        type: "monitor_mcp",
        label: task.description,
        status: task.status,
        task
      };
    case "dream":
      return {
        id: task.id,
        type: "dream",
        label: task.description,
        status: task.status,
        task
      };
  }
}
function Item(t0) {
  const $ = import_compiler_runtime9.c(14);
  const {
    item,
    isSelected
  } = t0;
  const {
    columns
  } = useTerminalSize();
  const maxActivityWidth = Math.max(30, columns - 26);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = isCoordinatorMode();
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const useGreyPointer = t1;
  const t2 = useGreyPointer && isSelected;
  const t3 = isSelected ? figures_default.pointer + " " : "  ";
  let t4;
  if ($[1] !== t2 || $[2] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
      dimColor: t2,
      children: t3
    }, undefined, false, undefined, this);
    $[1] = t2;
    $[2] = t3;
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  const t5 = isSelected && !useGreyPointer ? "suggestion" : undefined;
  let t6;
  if ($[4] !== item.task || $[5] !== item.type || $[6] !== maxActivityWidth) {
    t6 = item.type === "leader" ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
      children: [
        "@",
        TEAM_LEAD_NAME
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(BackgroundTask, {
      task: item.task,
      maxActivityWidth
    }, undefined, false, undefined, this);
    $[4] = item.task;
    $[5] = item.type;
    $[6] = maxActivityWidth;
    $[7] = t6;
  } else {
    t6 = $[7];
  }
  let t7;
  if ($[8] !== t5 || $[9] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
      color: t5,
      children: t6
    }, undefined, false, undefined, this);
    $[8] = t5;
    $[9] = t6;
    $[10] = t7;
  } else {
    t7 = $[10];
  }
  let t8;
  if ($[11] !== t4 || $[12] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
      flexDirection: "row",
      children: [
        t4,
        t7
      ]
    }, undefined, true, undefined, this);
    $[11] = t4;
    $[12] = t7;
    $[13] = t8;
  } else {
    t8 = $[13];
  }
  return t8;
}
function TeammateTaskGroups(t0) {
  const $ = import_compiler_runtime9.c(3);
  const {
    teammateTasks,
    currentSelectionId
  } = t0;
  let t1;
  if ($[0] !== currentSelectionId || $[1] !== teammateTasks) {
    const leaderItems = teammateTasks.filter(_temp7);
    const teammateItems = teammateTasks.filter(_temp23);
    const teams = new Map;
    for (const item of teammateItems) {
      const teamName = item.task.identity.teamName;
      const group = teams.get(teamName);
      if (group) {
        group.push(item);
      } else {
        teams.set(teamName, [item]);
      }
    }
    const teamEntries = [...teams.entries()];
    t1 = /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
      children: teamEntries.map((t2) => {
        const [teamName_0, items] = t2;
        const memberCount = items.length + leaderItems.length;
        return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                "  ",
                "Team: ",
                teamName_0,
                " (",
                memberCount,
                ")"
              ]
            }, undefined, true, undefined, this),
            leaderItems.map((item_0) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Item, {
              item: item_0,
              isSelected: item_0.id === currentSelectionId
            }, `${item_0.id}-${teamName_0}`, false, undefined, this)),
            items.map((item_1) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(Item, {
              item: item_1,
              isSelected: item_1.id === currentSelectionId
            }, item_1.id, false, undefined, this))
          ]
        }, teamName_0, true, undefined, this);
      })
    }, undefined, false, undefined, this);
    $[0] = currentSelectionId;
    $[1] = teammateTasks;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}
function _temp23(i_0) {
  return i_0.type === "in_process_teammate";
}
function _temp7(i) {
  return i.type === "leader";
}
var import_compiler_runtime9, import_react4, jsx_dev_runtime10, WorkflowDetailDialog = null, workflowTaskModule = null, killWorkflowTask, skipWorkflowAgent, retryWorkflowAgent, monitorMcpModule = null, killMonitorMcp, MonitorMcpDetailDialog = null;
var init_BackgroundTasksDialog = __esm(() => {
  init_figures();
  init_coordinatorMode();
  init_useTerminalSize();
  init_AppState();
  init_teammateViewHelpers();
  init_DreamTask();
  init_InProcessTeammateTask();
  init_LocalAgentTask();
  init_LocalShellTask();
  init_RemoteAgentTask();
  init_types();
  init_array();
  init_constants3();
  init_ultraplan();
  init_overlayContext();
  init_ink();
  init_useKeybinding();
  init_useShortcutDisplay();
  init_array();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  init_AsyncAgentDetailDialog();
  init_BackgroundTask();
  init_DreamDetailDialog();
  init_InProcessTeammateDetailDialog();
  init_RemoteSessionDetailDialog();
  init_ShellDetailDialog();
  import_compiler_runtime9 = __toESM(require_compiler_runtime(), 1);
  import_react4 = __toESM(require_react(), 1);
  jsx_dev_runtime10 = __toESM(require_jsx_dev_runtime(), 1);
  killWorkflowTask = workflowTaskModule?.killWorkflowTask ?? null;
  skipWorkflowAgent = workflowTaskModule?.skipWorkflowAgent ?? null;
  retryWorkflowAgent = workflowTaskModule?.retryWorkflowAgent ?? null;
  killMonitorMcp = monitorMcpModule?.killMonitorMcp ?? null;
});

export { enterTeammateView, exitTeammateView, stopOrDismissAgent, init_teammateViewHelpers, launchUltraplan, init_ultraplan, shouldHideTasksFooter, init_taskStatusUtils, BackgroundTasksDialog, init_BackgroundTasksDialog };
