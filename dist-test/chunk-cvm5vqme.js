// @bun
import {
  Select,
  Spinner,
  TeleportError,
  init_CustomSelect,
  init_Spinner,
  init_TeleportError,
  init_teleport,
  teleportResumeCodeSession
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import {
  Byline,
  ConfigurableShortcutHint,
  KeyboardShortcutHint,
  init_Byline,
  init_ConfigurableShortcutHint,
  init_KeyboardShortcutHint,
  init_useShortcutDisplay,
  useShortcutDisplay
} from "./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-73qtc7a9.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-2e5y8sgq.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-zz424j25.js";
import"./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import {
  init_useKeybinding,
  init_useTerminalSize,
  useKeybinding,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime,
  use_input_default
} from "./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import {
  fetchCodeSessionsFromSessionsAPI,
  init_api
} from "./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import"./chunk-bt6e264h.js";
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
import {
  formatRelativeTime,
  init_format
} from "./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import {
  detectCurrentRepository,
  init_detectRepository
} from "./chunk-s85yj5xm.js";
import"./chunk-73q6p10n.js";
import"./chunk-8qg6qavk.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-14j8jv5j.js";
import"./chunk-0xqnccz6.js";
import"./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  TeleportOperationError,
  errorMessage,
  init_debug,
  init_errors,
  logForDebugging
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import {
  init_state,
  setTeleportedSessionInfo
} from "./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/TeleportResumeWrapper.tsx
init_analytics();
var import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
var import_react3 = __toESM(require_react(), 1);

// src/hooks/useTeleportResume.tsx
init_state();
init_analytics();
init_errors();
init_teleport();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var import_react = __toESM(require_react(), 1);
function useTeleportResume(source) {
  const $ = import_compiler_runtime.c(8);
  const [isResuming, setIsResuming] = import_react.useState(false);
  const [error, setError] = import_react.useState(null);
  const [selectedSession, setSelectedSession] = import_react.useState(null);
  let t0;
  if ($[0] !== source) {
    t0 = async (session) => {
      setIsResuming(true);
      setError(null);
      setSelectedSession(session);
      logEvent("tengu_teleport_resume_session", {
        source,
        session_id: session.id
      });
      try {
        const result = await teleportResumeCodeSession(session.id);
        setTeleportedSessionInfo({
          sessionId: session.id
        });
        setIsResuming(false);
        return result;
      } catch (t12) {
        const err = t12;
        const teleportError = {
          message: err instanceof TeleportOperationError ? err.message : errorMessage(err),
          formattedMessage: err instanceof TeleportOperationError ? err.formattedMessage : undefined,
          isOperationError: err instanceof TeleportOperationError
        };
        setError(teleportError);
        setIsResuming(false);
        return null;
      }
    };
    $[0] = source;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const resumeSession = t0;
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      setError(null);
    };
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const clearError = t1;
  let t2;
  if ($[3] !== error || $[4] !== isResuming || $[5] !== resumeSession || $[6] !== selectedSession) {
    t2 = {
      resumeSession,
      isResuming,
      error,
      selectedSession,
      clearError
    };
    $[3] = error;
    $[4] = isResuming;
    $[5] = resumeSession;
    $[6] = selectedSession;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}

// src/components/TeleportResumeWrapper.tsx
init_ink();
init_useKeybinding();

// src/components/ResumeTask.tsx
init_useTerminalSize();
init_api();
init_ink();
init_useKeybinding();
init_useShortcutDisplay();
init_debug();
init_detectRepository();
init_format();
init_ConfigurableShortcutHint();
init_CustomSelect();
init_Byline();
init_KeyboardShortcutHint();
init_Spinner();
init_TeleportError();
var import_react2 = __toESM(require_react(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
var UPDATED_STRING = "Updated";
var SPACE_BETWEEN_TABLE_COLUMNS = "  ";
function ResumeTask({
  onSelect,
  onCancel,
  isEmbedded = false
}) {
  const {
    rows
  } = useTerminalSize();
  const [sessions, setSessions] = import_react2.useState([]);
  const [currentRepo, setCurrentRepo] = import_react2.useState(null);
  const [loading, setLoading] = import_react2.useState(true);
  const [loadErrorType, setLoadErrorType] = import_react2.useState(null);
  const [retrying, setRetrying] = import_react2.useState(false);
  const [hasCompletedTeleportErrorFlow, setHasCompletedTeleportErrorFlow] = import_react2.useState(false);
  const [focusedIndex, setFocusedIndex] = import_react2.useState(1);
  const escKey = useShortcutDisplay("confirm:no", "Confirmation", "Esc");
  const loadSessions = import_react2.useCallback(async () => {
    try {
      setLoading(true);
      setLoadErrorType(null);
      const detectedRepo = await detectCurrentRepository();
      setCurrentRepo(detectedRepo);
      logForDebugging(`Current repository: ${detectedRepo || "not detected"}`);
      const codeSessions = await fetchCodeSessionsFromSessionsAPI();
      let filteredSessions = codeSessions;
      if (detectedRepo) {
        filteredSessions = codeSessions.filter((session) => {
          if (!session.repo)
            return false;
          const sessionRepo = `${session.repo.owner.login}/${session.repo.name}`;
          return sessionRepo === detectedRepo;
        });
        logForDebugging(`Filtered ${filteredSessions.length} sessions for repo ${detectedRepo} from ${codeSessions.length} total`);
      }
      const sortedSessions = [...filteredSessions].sort((a, b) => {
        const dateA = new Date(a.updated_at);
        const dateB = new Date(b.updated_at);
        return dateB.getTime() - dateA.getTime();
      });
      setSessions(sortedSessions);
    } catch (err) {
      const errorMessage2 = err instanceof Error ? err.message : String(err);
      logForDebugging(`Error loading code sessions: ${errorMessage2}`);
      setLoadErrorType(determineErrorType(errorMessage2));
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);
  const handleRetry = () => {
    setRetrying(true);
    loadSessions();
  };
  useKeybinding("confirm:no", onCancel, {
    context: "Confirmation"
  });
  use_input_default((input, key) => {
    if (key.ctrl && input === "c") {
      onCancel();
      return;
    }
    if (key.ctrl && input === "r" && loadErrorType) {
      handleRetry();
      return;
    }
    if (loadErrorType !== null && key.return) {
      onCancel();
      return;
    }
  });
  const handleErrorComplete = import_react2.useCallback(() => {
    setHasCompletedTeleportErrorFlow(true);
    loadSessions();
  }, [setHasCompletedTeleportErrorFlow, loadSessions]);
  if (!hasCompletedTeleportErrorFlow) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(TeleportError, {
      onComplete: handleErrorComplete
    }, undefined, false, undefined, this);
  }
  if (loading) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      padding: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          flexDirection: "row",
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              bold: true,
              children: "Loading Panda Code sessions\u2026"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: retrying ? "Retrying\u2026" : "Fetching your Panda Code sessions\u2026"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (loadErrorType) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      padding: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          color: "error",
          children: "Error loading Panda Code sessions"
        }, undefined, false, undefined, this),
        renderErrorSpecificGuidance(loadErrorType),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "Press ",
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              bold: true,
              children: "Ctrl+R"
            }, undefined, false, undefined, this),
            " to retry \xB7 Press",
            " ",
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              bold: true,
              children: escKey
            }, undefined, false, undefined, this),
            " to cancel"
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (sessions.length === 0) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      padding: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: [
            "No Panda Code sessions found",
            currentRepo && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: [
                " for ",
                currentRepo
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "Press ",
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: escKey
              }, undefined, false, undefined, this),
              " to cancel"
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const sessionMetadata = sessions.map((session_0) => ({
    ...session_0,
    timeString: formatRelativeTime(new Date(session_0.updated_at))
  }));
  const maxTimeStringLength = Math.max(UPDATED_STRING.length, ...sessionMetadata.map((meta) => meta.timeString.length));
  const options = sessionMetadata.map(({
    timeString,
    title,
    id
  }) => {
    const paddedTime = timeString.padEnd(maxTimeStringLength, " ");
    return {
      label: `${paddedTime}  ${title}`,
      value: id
    };
  });
  const layoutOverhead = 7;
  const maxVisibleOptions = Math.max(1, isEmbedded ? Math.min(sessions.length, 5, rows - 6 - layoutOverhead) : Math.min(sessions.length, rows - 1 - layoutOverhead));
  const maxHeight = maxVisibleOptions + layoutOverhead;
  const showScrollPosition = sessions.length > maxVisibleOptions;
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    padding: 1,
    height: maxHeight,
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        bold: true,
        children: [
          "Select a session to resume",
          showScrollPosition && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              " ",
              "(",
              focusedIndex,
              " of ",
              sessions.length,
              ")"
            ]
          }, undefined, true, undefined, this),
          currentRepo && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              " (",
              currentRepo,
              ")"
            ]
          }, undefined, true, undefined, this),
          ":"
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        marginTop: 1,
        flexGrow: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginLeft: 2,
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              bold: true,
              children: [
                UPDATED_STRING.padEnd(maxTimeStringLength, " "),
                SPACE_BETWEEN_TABLE_COLUMNS,
                "Session Title"
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
            visibleOptionCount: maxVisibleOptions,
            options,
            onChange: (value) => {
              const session_1 = sessions.find((s) => s.id === value);
              if (session_1) {
                onSelect(session_1);
              }
            },
            onFocus: (value_0) => {
              const index = options.findIndex((o) => o.value === value_0);
              if (index >= 0) {
                setFocusedIndex(index + 1);
              }
            }
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "row",
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
                shortcut: "\u2191/\u2193",
                action: "select"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
                shortcut: "Enter",
                action: "confirm"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function determineErrorType(errorMessage2) {
  const message = errorMessage2.toLowerCase();
  if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) {
    return "network";
  }
  if (message.includes("auth") || message.includes("token") || message.includes("permission") || message.includes("oauth") || message.includes("not authenticated") || message.includes("/login") || message.includes("console account") || message.includes("403")) {
    return "auth";
  }
  if (message.includes("api") || message.includes("rate limit") || message.includes("500") || message.includes("529")) {
    return "api";
  }
  return "other";
}
function renderErrorSpecificGuidance(errorType) {
  switch (errorType) {
    case "network":
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        marginY: 1,
        flexDirection: "column",
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "Check your internet connection"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
    case "auth":
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        marginY: 1,
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: "Teleport requires a Claude account"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "Run ",
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: "/login"
              }, undefined, false, undefined, this),
              ' and select "Claude account with subscription"'
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
    case "api":
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        marginY: 1,
        flexDirection: "column",
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "Sorry, Claude encountered an error"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
    case "other":
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        marginY: 1,
        flexDirection: "row",
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "Sorry, Panda Code encountered an error"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
  }
}

// src/components/TeleportResumeWrapper.tsx
init_Spinner();
var jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
function TeleportResumeWrapper(t0) {
  const $ = import_compiler_runtime2.c(25);
  const {
    onComplete,
    onCancel,
    onError,
    isEmbedded: t1,
    source
  } = t0;
  const isEmbedded = t1 === undefined ? false : t1;
  const {
    resumeSession,
    isResuming,
    error,
    selectedSession
  } = useTeleportResume(source);
  let t2;
  let t3;
  if ($[0] !== source) {
    t2 = () => {
      logEvent("tengu_teleport_started", {
        source
      });
    };
    t3 = [source];
    $[0] = source;
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  import_react3.useEffect(t2, t3);
  let t4;
  if ($[3] !== error || $[4] !== onComplete || $[5] !== onError || $[6] !== resumeSession) {
    t4 = async (session) => {
      const result = await resumeSession(session);
      if (result) {
        onComplete(result);
      } else {
        if (error) {
          if (onError) {
            onError(error.message, error.formattedMessage);
          }
        }
      }
    };
    $[3] = error;
    $[4] = onComplete;
    $[5] = onError;
    $[6] = resumeSession;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  const handleSelect = t4;
  let t5;
  if ($[8] !== onCancel) {
    t5 = () => {
      logEvent("tengu_teleport_cancelled", {});
      onCancel();
    };
    $[8] = onCancel;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  const handleCancel = t5;
  const t6 = !!error && !onError;
  let t7;
  if ($[10] !== t6) {
    t7 = {
      context: "Global",
      isActive: t6
    };
    $[10] = t6;
    $[11] = t7;
  } else {
    t7 = $[11];
  }
  useKeybinding("app:interrupt", handleCancel, t7);
  if (isResuming && selectedSession) {
    let t82;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      t82 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "row",
        children: [
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Spinner, {}, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            bold: true,
            children: "Resuming session\u2026"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[12] = t82;
    } else {
      t82 = $[12];
    }
    let t9;
    if ($[13] !== selectedSession.title) {
      t9 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        padding: 1,
        children: [
          t82,
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              'Loading "',
              selectedSession.title,
              '"\u2026'
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[13] = selectedSession.title;
      $[14] = t9;
    } else {
      t9 = $[14];
    }
    return t9;
  }
  if (error && !onError) {
    let t82;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
      t82 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        bold: true,
        color: "error",
        children: "Failed to resume session"
      }, undefined, false, undefined, this);
      $[15] = t82;
    } else {
      t82 = $[15];
    }
    let t9;
    if ($[16] !== error.message) {
      t9 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: error.message
      }, undefined, false, undefined, this);
      $[16] = error.message;
      $[17] = t9;
    } else {
      t9 = $[17];
    }
    let t10;
    if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
      t10 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            "Press ",
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              bold: true,
              children: "Esc"
            }, undefined, false, undefined, this),
            " to cancel"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this);
      $[18] = t10;
    } else {
      t10 = $[18];
    }
    let t11;
    if ($[19] !== t9) {
      t11 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        padding: 1,
        children: [
          t82,
          t9,
          t10
        ]
      }, undefined, true, undefined, this);
      $[19] = t9;
      $[20] = t11;
    } else {
      t11 = $[20];
    }
    return t11;
  }
  let t8;
  if ($[21] !== handleCancel || $[22] !== handleSelect || $[23] !== isEmbedded) {
    t8 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ResumeTask, {
      onSelect: handleSelect,
      onCancel: handleCancel,
      isEmbedded
    }, undefined, false, undefined, this);
    $[21] = handleCancel;
    $[22] = handleSelect;
    $[23] = isEmbedded;
    $[24] = t8;
  } else {
    t8 = $[24];
  }
  return t8;
}
export {
  TeleportResumeWrapper
};
