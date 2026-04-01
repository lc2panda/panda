// @bun
import {
  Select,
  getAllHooks,
  getHookDisplayText,
  getTools,
  hookSourceDescriptionDisplayString,
  hookSourceHeaderDisplayString,
  hookSourceInlineDisplayString,
  init_AppState,
  init_hooksSettings,
  init_select,
  init_tools1 as init_tools,
  init_useSettingsChange,
  sortMatchersByPriority,
  useAppState,
  useAppStateStore,
  useSettingsChange
} from "./chunk-wk0emb79.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import {
  Dialog,
  init_Dialog
} from "./chunk-px2n7q1y.js";
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
  init_useKeybinding,
  useKeybinding
} from "./chunk-x2y5syym.js";
import {
  Link,
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
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
  getSettingsForSource,
  getSettings_DEPRECATED,
  init_settings1 as init_settings,
  init_stringUtils,
  plural
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
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
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
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import"./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import {
  getRegisteredHooks,
  init_state
} from "./chunk-24stks7b.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/utils/hooks/hooksConfigManager.ts
function groupHooksByEventAndMatcher(appState, toolNames) {
  const grouped = {
    PreToolUse: {},
    PostToolUse: {},
    PostToolUseFailure: {},
    PermissionDenied: {},
    Notification: {},
    UserPromptSubmit: {},
    SessionStart: {},
    SessionEnd: {},
    Stop: {},
    StopFailure: {},
    SubagentStart: {},
    SubagentStop: {},
    PreCompact: {},
    PostCompact: {},
    PermissionRequest: {},
    Setup: {},
    TeammateIdle: {},
    TaskCreated: {},
    TaskCompleted: {},
    Elicitation: {},
    ElicitationResult: {},
    ConfigChange: {},
    WorktreeCreate: {},
    WorktreeRemove: {},
    InstructionsLoaded: {},
    CwdChanged: {},
    FileChanged: {}
  };
  const metadata = getHookEventMetadata(toolNames);
  getAllHooks(appState).forEach((hook) => {
    const eventGroup = grouped[hook.event];
    if (eventGroup) {
      const matcherKey = metadata[hook.event].matcherMetadata !== undefined ? hook.matcher || "" : "";
      if (!eventGroup[matcherKey]) {
        eventGroup[matcherKey] = [];
      }
      eventGroup[matcherKey].push(hook);
    }
  });
  const registeredHooks = getRegisteredHooks();
  if (registeredHooks) {
    for (const [event, matchers] of Object.entries(registeredHooks)) {
      const hookEvent = event;
      const eventGroup = grouped[hookEvent];
      if (!eventGroup)
        continue;
      for (const matcher of matchers) {
        const matcherKey = matcher.matcher || "";
        if ("pluginRoot" in matcher) {
          eventGroup[matcherKey] ??= [];
          for (const hook of matcher.hooks) {
            eventGroup[matcherKey].push({
              event: hookEvent,
              config: hook,
              matcher: matcher.matcher,
              source: "pluginHook",
              pluginName: matcher.pluginId
            });
          }
        } else if (process.env.USER_TYPE === "ant") {
          eventGroup[matcherKey] ??= [];
          for (const _hook of matcher.hooks) {
            eventGroup[matcherKey].push({
              event: hookEvent,
              config: {
                type: "command",
                command: "[ANT-ONLY] Built-in Hook"
              },
              matcher: matcher.matcher,
              source: "builtinHook"
            });
          }
        }
      }
    }
  }
  return grouped;
}
function getSortedMatchersForEvent(hooksByEventAndMatcher, event) {
  const matchers = Object.keys(hooksByEventAndMatcher[event] || {});
  return sortMatchersByPriority(matchers, hooksByEventAndMatcher, event);
}
function getHooksForMatcher(hooksByEventAndMatcher, event, matcher) {
  const matcherKey = matcher ?? "";
  return hooksByEventAndMatcher[event]?.[matcherKey] ?? [];
}
function getMatcherMetadata(event, toolNames) {
  return getHookEventMetadata(toolNames)[event].matcherMetadata;
}
var getHookEventMetadata;
var init_hooksConfigManager = __esm(() => {
  init_memoize();
  init_state();
  init_hooksSettings();
  getHookEventMetadata = memoize_default(function(toolNames) {
    return {
      PreToolUse: {
        summary: "Before tool execution",
        description: `Input to command is JSON of tool call arguments.
Exit code 0 - stdout/stderr not shown
Exit code 2 - show stderr to model and block tool call
Other exit codes - show stderr to user only but continue with tool call`,
        matcherMetadata: {
          fieldToMatch: "tool_name",
          values: toolNames
        }
      },
      PostToolUse: {
        summary: "After tool execution",
        description: `Input to command is JSON with fields "inputs" (tool call arguments) and "response" (tool call response).
Exit code 0 - stdout shown in transcript mode (ctrl+o)
Exit code 2 - show stderr to model immediately
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "tool_name",
          values: toolNames
        }
      },
      PostToolUseFailure: {
        summary: "After tool execution fails",
        description: `Input to command is JSON with tool_name, tool_input, tool_use_id, error, error_type, is_interrupt, and is_timeout.
Exit code 0 - stdout shown in transcript mode (ctrl+o)
Exit code 2 - show stderr to model immediately
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "tool_name",
          values: toolNames
        }
      },
      PermissionDenied: {
        summary: "After auto mode classifier denies a tool call",
        description: `Input to command is JSON with tool_name, tool_input, tool_use_id, and reason.
Return {"hookSpecificOutput":{"hookEventName":"PermissionDenied","retry":true}} to tell the model it may retry.
Exit code 0 - stdout shown in transcript mode (ctrl+o)
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "tool_name",
          values: toolNames
        }
      },
      Notification: {
        summary: "When notifications are sent",
        description: `Input to command is JSON with notification message and type.
Exit code 0 - stdout/stderr not shown
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "notification_type",
          values: [
            "permission_prompt",
            "idle_prompt",
            "auth_success",
            "elicitation_dialog",
            "elicitation_complete",
            "elicitation_response"
          ]
        }
      },
      UserPromptSubmit: {
        summary: "When the user submits a prompt",
        description: `Input to command is JSON with original user prompt text.
Exit code 0 - stdout shown to Claude
Exit code 2 - block processing, erase original prompt, and show stderr to user only
Other exit codes - show stderr to user only`
      },
      SessionStart: {
        summary: "When a new session is started",
        description: `Input to command is JSON with session start source.
Exit code 0 - stdout shown to Claude
Blocking errors are ignored
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "source",
          values: ["startup", "resume", "clear", "compact"]
        }
      },
      Stop: {
        summary: "Right before Claude concludes its response",
        description: `Exit code 0 - stdout/stderr not shown
Exit code 2 - show stderr to model and continue conversation
Other exit codes - show stderr to user only`
      },
      StopFailure: {
        summary: "When the turn ends due to an API error",
        description: "Fires instead of Stop when an API error (rate limit, auth failure, etc.) ended the turn. Fire-and-forget \u2014 hook output and exit codes are ignored.",
        matcherMetadata: {
          fieldToMatch: "error",
          values: [
            "rate_limit",
            "authentication_failed",
            "billing_error",
            "invalid_request",
            "server_error",
            "max_output_tokens",
            "unknown"
          ]
        }
      },
      SubagentStart: {
        summary: "When a subagent (Agent tool call) is started",
        description: `Input to command is JSON with agent_id and agent_type.
Exit code 0 - stdout shown to subagent
Blocking errors are ignored
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "agent_type",
          values: []
        }
      },
      SubagentStop: {
        summary: "Right before a subagent (Agent tool call) concludes its response",
        description: `Input to command is JSON with agent_id, agent_type, and agent_transcript_path.
Exit code 0 - stdout/stderr not shown
Exit code 2 - show stderr to subagent and continue having it run
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "agent_type",
          values: []
        }
      },
      PreCompact: {
        summary: "Before conversation compaction",
        description: `Input to command is JSON with compaction details.
Exit code 0 - stdout appended as custom compact instructions
Exit code 2 - block compaction
Other exit codes - show stderr to user only but continue with compaction`,
        matcherMetadata: {
          fieldToMatch: "trigger",
          values: ["manual", "auto"]
        }
      },
      PostCompact: {
        summary: "After conversation compaction",
        description: `Input to command is JSON with compaction details and the summary.
Exit code 0 - stdout shown to user
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "trigger",
          values: ["manual", "auto"]
        }
      },
      SessionEnd: {
        summary: "When a session is ending",
        description: `Input to command is JSON with session end reason.
Exit code 0 - command completes successfully
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "reason",
          values: ["clear", "logout", "prompt_input_exit", "other"]
        }
      },
      PermissionRequest: {
        summary: "When a permission dialog is displayed",
        description: `Input to command is JSON with tool_name, tool_input, and tool_use_id.
Output JSON with hookSpecificOutput containing decision to allow or deny.
Exit code 0 - use hook decision if provided
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "tool_name",
          values: toolNames
        }
      },
      Setup: {
        summary: "Repo setup hooks for init and maintenance",
        description: `Input to command is JSON with trigger (init or maintenance).
Exit code 0 - stdout shown to Claude
Blocking errors are ignored
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "trigger",
          values: ["init", "maintenance"]
        }
      },
      TeammateIdle: {
        summary: "When a teammate is about to go idle",
        description: `Input to command is JSON with teammate_name and team_name.
Exit code 0 - stdout/stderr not shown
Exit code 2 - show stderr to teammate and prevent idle (teammate continues working)
Other exit codes - show stderr to user only`
      },
      TaskCreated: {
        summary: "When a task is being created",
        description: `Input to command is JSON with task_id, task_subject, task_description, teammate_name, and team_name.
Exit code 0 - stdout/stderr not shown
Exit code 2 - show stderr to model and prevent task creation
Other exit codes - show stderr to user only`
      },
      TaskCompleted: {
        summary: "When a task is being marked as completed",
        description: `Input to command is JSON with task_id, task_subject, task_description, teammate_name, and team_name.
Exit code 0 - stdout/stderr not shown
Exit code 2 - show stderr to model and prevent task completion
Other exit codes - show stderr to user only`
      },
      Elicitation: {
        summary: "When an MCP server requests user input (elicitation)",
        description: `Input to command is JSON with mcp_server_name, message, and requested_schema.
Output JSON with hookSpecificOutput containing action (accept/decline/cancel) and optional content.
Exit code 0 - use hook response if provided
Exit code 2 - deny the elicitation
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "mcp_server_name",
          values: []
        }
      },
      ElicitationResult: {
        summary: "After a user responds to an MCP elicitation",
        description: `Input to command is JSON with mcp_server_name, action, content, mode, and elicitation_id.
Output JSON with hookSpecificOutput containing optional action and content to override the response.
Exit code 0 - use hook response if provided
Exit code 2 - block the response (action becomes decline)
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "mcp_server_name",
          values: []
        }
      },
      ConfigChange: {
        summary: "When configuration files change during a session",
        description: `Input to command is JSON with source (user_settings, project_settings, local_settings, policy_settings, skills) and file_path.
Exit code 0 - allow the change
Exit code 2 - block the change from being applied to the session
Other exit codes - show stderr to user only`,
        matcherMetadata: {
          fieldToMatch: "source",
          values: [
            "user_settings",
            "project_settings",
            "local_settings",
            "policy_settings",
            "skills"
          ]
        }
      },
      InstructionsLoaded: {
        summary: "When an instruction file (CLAUDE.md or rule) is loaded",
        description: `Input to command is JSON with file_path, memory_type (User, Project, Local, Managed), load_reason (session_start, nested_traversal, path_glob_match, include, compact), globs (optional \u2014 the paths: frontmatter patterns that matched), trigger_file_path (optional \u2014 the file Claude touched that caused the load), and parent_file_path (optional \u2014 the file that @-included this one).
Exit code 0 - command completes successfully
Other exit codes - show stderr to user only
This hook is observability-only and does not support blocking.`,
        matcherMetadata: {
          fieldToMatch: "load_reason",
          values: [
            "session_start",
            "nested_traversal",
            "path_glob_match",
            "include",
            "compact"
          ]
        }
      },
      WorktreeCreate: {
        summary: "Create an isolated worktree for VCS-agnostic isolation",
        description: `Input to command is JSON with name (suggested worktree slug).
Stdout should contain the absolute path to the created worktree directory.
Exit code 0 - worktree created successfully
Other exit codes - worktree creation failed`
      },
      WorktreeRemove: {
        summary: "Remove a previously created worktree",
        description: `Input to command is JSON with worktree_path (absolute path to worktree).
Exit code 0 - worktree removed successfully
Other exit codes - show stderr to user only`
      },
      CwdChanged: {
        summary: "After the working directory changes",
        description: `Input to command is JSON with old_cwd and new_cwd.
CLAUDE_ENV_FILE is set \u2014 write bash exports there to apply env to subsequent BashTool commands.
Hook output can include hookSpecificOutput.watchPaths (array of absolute paths) to register with the FileChanged watcher.
Exit code 0 - command completes successfully
Other exit codes - show stderr to user only`
      },
      FileChanged: {
        summary: "When a watched file changes",
        description: `Input to command is JSON with file_path and event (change, add, unlink).
CLAUDE_ENV_FILE is set \u2014 write bash exports there to apply env to subsequent BashTool commands.
The matcher field specifies filenames to watch in the current directory (e.g. ".envrc|.env").
Hook output can include hookSpecificOutput.watchPaths (array of absolute paths) to dynamically update the watch list.
Exit code 0 - command completes successfully
Other exit codes - show stderr to user only`
      }
    };
  }, (toolNames) => toolNames.slice().sort().join(","));
});

// src/components/hooks/SelectEventMode.tsx
function SelectEventMode(t0) {
  const $ = import_compiler_runtime.c(23);
  const {
    hookEventMetadata,
    hooksByEvent,
    totalHooksCount,
    restrictedByPolicy,
    onSelectEvent,
    onCancel
  } = t0;
  let t1;
  if ($[0] !== totalHooksCount) {
    t1 = plural(totalHooksCount, "hook");
    $[0] = totalHooksCount;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const subtitle = `${totalHooksCount} ${t1} configured`;
  let t2;
  if ($[2] !== restrictedByPolicy) {
    t2 = restrictedByPolicy && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "suggestion",
          children: [
            figures_default.info,
            " Hooks Restricted by Policy"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "Only hooks from managed settings can run. User-defined hooks from ~/.claude/settings.json, .claude/settings.json, and .claude/settings.local.json are blocked."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[2] = restrictedByPolicy;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          figures_default.info,
          " This menu is read-only. To add or modify hooks, edit settings.json directly or ask Claude.",
          " ",
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
            url: "https://code.claude.com/docs/en/hooks",
            children: "Learn more"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] !== onSelectEvent) {
    t4 = (value) => {
      onSelectEvent(value);
    };
    $[5] = onSelectEvent;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== hookEventMetadata) {
    t5 = Object.entries(hookEventMetadata);
    $[7] = hookEventMetadata;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  let t6;
  if ($[9] !== hooksByEvent || $[10] !== t5) {
    t6 = t5.map((t72) => {
      const [name, metadata] = t72;
      const count = hooksByEvent[name] || 0;
      return {
        label: count > 0 ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: [
            name,
            " ",
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              color: "suggestion",
              children: [
                "(",
                count,
                ")"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this) : name,
        value: name,
        description: metadata.summary
      };
    });
    $[9] = hooksByEvent;
    $[10] = t5;
    $[11] = t6;
  } else {
    t6 = $[11];
  }
  let t7;
  if ($[12] !== onCancel || $[13] !== t4 || $[14] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
        onChange: t4,
        onCancel,
        options: t6
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[12] = onCancel;
    $[13] = t4;
    $[14] = t6;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  let t8;
  if ($[16] !== t2 || $[17] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t2,
        t3,
        t7
      ]
    }, undefined, true, undefined, this);
    $[16] = t2;
    $[17] = t7;
    $[18] = t8;
  } else {
    t8 = $[18];
  }
  let t9;
  if ($[19] !== onCancel || $[20] !== subtitle || $[21] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Hooks",
      subtitle,
      onCancel,
      children: t8
    }, undefined, false, undefined, this);
    $[19] = onCancel;
    $[20] = subtitle;
    $[21] = t8;
    $[22] = t9;
  } else {
    t9 = $[22];
  }
  return t9;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_SelectEventMode = __esm(() => {
  init_figures();
  init_ink();
  init_stringUtils();
  init_select();
  init_Dialog();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/hooks/SelectHookMode.tsx
function SelectHookMode(t0) {
  const $ = import_compiler_runtime2.c(19);
  const {
    selectedEvent,
    selectedMatcher,
    hooksForSelectedMatcher,
    hookEventMetadata,
    onSelect,
    onCancel
  } = t0;
  const title = hookEventMetadata.matcherMetadata !== undefined ? `${selectedEvent} - Matcher: ${selectedMatcher || "(all)"}` : selectedEvent;
  if (hooksForSelectedMatcher.length === 0) {
    let t12;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: true,
            children: "No hooks configured for this event."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: true,
            children: "To add hooks, edit settings.json directly or ask Claude."
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[0] = t12;
    } else {
      t12 = $[0];
    }
    let t22;
    if ($[1] !== hookEventMetadata.description || $[2] !== onCancel || $[3] !== title) {
      t22 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
        title,
        subtitle: hookEventMetadata.description,
        onCancel,
        inputGuide: _temp,
        children: t12
      }, undefined, false, undefined, this);
      $[1] = hookEventMetadata.description;
      $[2] = onCancel;
      $[3] = title;
      $[4] = t22;
    } else {
      t22 = $[4];
    }
    return t22;
  }
  const t1 = hookEventMetadata.description;
  let t2;
  if ($[5] !== hooksForSelectedMatcher) {
    t2 = hooksForSelectedMatcher.map(_temp2);
    $[5] = hooksForSelectedMatcher;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  let t3;
  if ($[7] !== hooksForSelectedMatcher || $[8] !== onSelect) {
    t3 = (value) => {
      const index_0 = parseInt(value, 10);
      const hook_0 = hooksForSelectedMatcher[index_0];
      if (hook_0) {
        onSelect(hook_0);
      }
    };
    $[7] = hooksForSelectedMatcher;
    $[8] = onSelect;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  let t4;
  if ($[10] !== onCancel || $[11] !== t2 || $[12] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Select, {
        options: t2,
        onChange: t3,
        onCancel
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[10] = onCancel;
    $[11] = t2;
    $[12] = t3;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  let t5;
  if ($[14] !== hookEventMetadata.description || $[15] !== onCancel || $[16] !== t4 || $[17] !== title) {
    t5 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
      title,
      subtitle: t1,
      onCancel,
      children: t4
    }, undefined, false, undefined, this);
    $[14] = hookEventMetadata.description;
    $[15] = onCancel;
    $[16] = t4;
    $[17] = title;
    $[18] = t5;
  } else {
    t5 = $[18];
  }
  return t5;
}
function _temp2(hook, index) {
  return {
    label: `[${hook.config.type}] ${getHookDisplayText(hook.config)}`,
    value: index.toString(),
    description: hook.source === "pluginHook" && hook.pluginName ? `${hookSourceHeaderDisplayString(hook.source)} (${hook.pluginName})` : hookSourceHeaderDisplayString(hook.source)
  };
}
function _temp() {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
    children: "Esc to go back"
  }, undefined, false, undefined, this);
}
var import_compiler_runtime2, jsx_dev_runtime2;
var init_SelectHookMode = __esm(() => {
  init_ink();
  init_hooksSettings();
  init_select();
  init_Dialog();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/hooks/SelectMatcherMode.tsx
function SelectMatcherMode(t0) {
  const $ = import_compiler_runtime3.c(25);
  const {
    selectedEvent,
    matchersForSelectedEvent,
    hooksByEventAndMatcher,
    eventDescription,
    onSelect,
    onCancel
  } = t0;
  let t1;
  if ($[0] !== hooksByEventAndMatcher || $[1] !== matchersForSelectedEvent || $[2] !== selectedEvent) {
    let t22;
    if ($[4] !== hooksByEventAndMatcher || $[5] !== selectedEvent) {
      t22 = (matcher) => {
        const hooks = hooksByEventAndMatcher[selectedEvent]?.[matcher] || [];
        const sources = Array.from(new Set(hooks.map(_temp4)));
        return {
          matcher,
          sources,
          hookCount: hooks.length
        };
      };
      $[4] = hooksByEventAndMatcher;
      $[5] = selectedEvent;
      $[6] = t22;
    } else {
      t22 = $[6];
    }
    t1 = matchersForSelectedEvent.map(t22);
    $[0] = hooksByEventAndMatcher;
    $[1] = matchersForSelectedEvent;
    $[2] = selectedEvent;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const matchersWithSources = t1;
  if (matchersForSelectedEvent.length === 0) {
    const t22 = `${selectedEvent} - Matchers`;
    let t32;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t32 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            dimColor: true,
            children: "No hooks configured for this event."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            dimColor: true,
            children: "To add hooks, edit settings.json directly or ask Claude."
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[7] = t32;
    } else {
      t32 = $[7];
    }
    let t42;
    if ($[8] !== eventDescription || $[9] !== onCancel || $[10] !== t22) {
      t42 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Dialog, {
        title: t22,
        subtitle: eventDescription,
        onCancel,
        inputGuide: _temp22,
        children: t32
      }, undefined, false, undefined, this);
      $[8] = eventDescription;
      $[9] = onCancel;
      $[10] = t22;
      $[11] = t42;
    } else {
      t42 = $[11];
    }
    return t42;
  }
  const t2 = `${selectedEvent} - Matchers`;
  let t3;
  if ($[12] !== matchersWithSources) {
    t3 = matchersWithSources.map(_temp3);
    $[12] = matchersWithSources;
    $[13] = t3;
  } else {
    t3 = $[13];
  }
  let t4;
  if ($[14] !== onSelect) {
    t4 = (value) => {
      onSelect(value);
    };
    $[14] = onSelect;
    $[15] = t4;
  } else {
    t4 = $[15];
  }
  let t5;
  if ($[16] !== onCancel || $[17] !== t3 || $[18] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Select, {
        options: t3,
        onChange: t4,
        onCancel
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[16] = onCancel;
    $[17] = t3;
    $[18] = t4;
    $[19] = t5;
  } else {
    t5 = $[19];
  }
  let t6;
  if ($[20] !== eventDescription || $[21] !== onCancel || $[22] !== t2 || $[23] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Dialog, {
      title: t2,
      subtitle: eventDescription,
      onCancel,
      children: t5
    }, undefined, false, undefined, this);
    $[20] = eventDescription;
    $[21] = onCancel;
    $[22] = t2;
    $[23] = t5;
    $[24] = t6;
  } else {
    t6 = $[24];
  }
  return t6;
}
function _temp3(item) {
  const sourceText = item.sources.map(hookSourceInlineDisplayString).join(", ");
  const matcherLabel = item.matcher || "(all)";
  return {
    label: `[${sourceText}] ${matcherLabel}`,
    value: item.matcher,
    description: `${item.hookCount} ${plural(item.hookCount, "hook")}`
  };
}
function _temp22() {
  return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
    children: "Esc to go back"
  }, undefined, false, undefined, this);
}
function _temp4(h) {
  return h.source;
}
var import_compiler_runtime3, jsx_dev_runtime3;
var init_SelectMatcherMode = __esm(() => {
  init_ink();
  init_hooksSettings();
  init_stringUtils();
  init_select();
  init_Dialog();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/hooks/ViewHookMode.tsx
function ViewHookMode(t0) {
  const $ = import_compiler_runtime4.c(40);
  const {
    selectedHook,
    eventSupportsMatcher,
    onCancel
  } = t0;
  let t1;
  if ($[0] !== selectedHook.event) {
    t1 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: [
        "Event: ",
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
          bold: true,
          children: selectedHook.event
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[0] = selectedHook.event;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== eventSupportsMatcher || $[3] !== selectedHook.matcher) {
    t2 = eventSupportsMatcher && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: [
        "Matcher: ",
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
          bold: true,
          children: selectedHook.matcher || "(all)"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[2] = eventSupportsMatcher;
    $[3] = selectedHook.matcher;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== selectedHook.config.type) {
    t3 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: [
        "Type: ",
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
          bold: true,
          children: selectedHook.config.type
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[5] = selectedHook.config.type;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== selectedHook.source) {
    t4 = hookSourceDescriptionDisplayString(selectedHook.source);
    $[7] = selectedHook.source;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  let t5;
  if ($[9] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: [
        "Source:",
        " ",
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
          dimColor: true,
          children: t4
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[9] = t4;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  let t6;
  if ($[11] !== selectedHook.pluginName) {
    t6 = selectedHook.pluginName && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: [
        "Plugin: ",
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
          dimColor: true,
          children: selectedHook.pluginName
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[11] = selectedHook.pluginName;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  let t7;
  if ($[13] !== t1 || $[14] !== t2 || $[15] !== t3 || $[16] !== t5 || $[17] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t1,
        t2,
        t3,
        t5,
        t6
      ]
    }, undefined, true, undefined, this);
    $[13] = t1;
    $[14] = t2;
    $[15] = t3;
    $[16] = t5;
    $[17] = t6;
    $[18] = t7;
  } else {
    t7 = $[18];
  }
  let t8;
  if ($[19] !== selectedHook.config) {
    t8 = getContentFieldLabel(selectedHook.config);
    $[19] = selectedHook.config;
    $[20] = t8;
  } else {
    t8 = $[20];
  }
  let t9;
  if ($[21] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        t8,
        ":"
      ]
    }, undefined, true, undefined, this);
    $[21] = t8;
    $[22] = t9;
  } else {
    t9 = $[22];
  }
  let t10;
  if ($[23] !== selectedHook.config) {
    t10 = getContentFieldValue(selectedHook.config);
    $[23] = selectedHook.config;
    $[24] = t10;
  } else {
    t10 = $[24];
  }
  let t11;
  if ($[25] !== t10) {
    t11 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      borderStyle: "round",
      borderDimColor: true,
      paddingLeft: 1,
      paddingRight: 1,
      children: /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
        children: t10
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[25] = t10;
    $[26] = t11;
  } else {
    t11 = $[26];
  }
  let t12;
  if ($[27] !== t11 || $[28] !== t9) {
    t12 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t9,
        t11
      ]
    }, undefined, true, undefined, this);
    $[27] = t11;
    $[28] = t9;
    $[29] = t12;
  } else {
    t12 = $[29];
  }
  let t13;
  if ($[30] !== selectedHook.config) {
    t13 = "statusMessage" in selectedHook.config && selectedHook.config.statusMessage && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      children: [
        "Status message:",
        " ",
        /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
          dimColor: true,
          children: selectedHook.config.statusMessage
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[30] = selectedHook.config;
    $[31] = t13;
  } else {
    t13 = $[31];
  }
  let t14;
  if ($[32] === Symbol.for("react.memo_cache_sentinel")) {
    t14 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
      dimColor: true,
      children: "To modify or remove this hook, edit settings.json directly or ask Claude to help."
    }, undefined, false, undefined, this);
    $[32] = t14;
  } else {
    t14 = $[32];
  }
  let t15;
  if ($[33] !== t12 || $[34] !== t13 || $[35] !== t7) {
    t15 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t7,
        t12,
        t13,
        t14
      ]
    }, undefined, true, undefined, this);
    $[33] = t12;
    $[34] = t13;
    $[35] = t7;
    $[36] = t15;
  } else {
    t15 = $[36];
  }
  let t16;
  if ($[37] !== onCancel || $[38] !== t15) {
    t16 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(Dialog, {
      title: "Hook details",
      onCancel,
      inputGuide: _temp6,
      children: t15
    }, undefined, false, undefined, this);
    $[37] = onCancel;
    $[38] = t15;
    $[39] = t16;
  } else {
    t16 = $[39];
  }
  return t16;
}
function _temp6() {
  return /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(ThemedText, {
    children: "Esc to go back"
  }, undefined, false, undefined, this);
}
function getContentFieldLabel(config) {
  switch (config.type) {
    case "command":
      return "Command";
    case "prompt":
      return "Prompt";
    case "agent":
      return "Prompt";
    case "http":
      return "URL";
  }
}
function getContentFieldValue(config) {
  switch (config.type) {
    case "command":
      return config.command;
    case "prompt":
      return config.prompt;
    case "agent":
      return config.prompt;
    case "http":
      return config.url;
  }
}
var import_compiler_runtime4, jsx_dev_runtime4;
var init_ViewHookMode = __esm(() => {
  init_ink();
  init_hooksSettings();
  init_Dialog();
  import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/hooks/HooksConfigMenu.tsx
function HooksConfigMenu(t0) {
  const $ = import_compiler_runtime5.c(100);
  const {
    toolNames,
    onExit
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      mode: "select-event"
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [modeState, setModeState] = import_react.useState(t1);
  const [disabledByPolicy, setDisabledByPolicy] = import_react.useState(_temp7);
  const [restrictedByPolicy, setRestrictedByPolicy] = import_react.useState(_temp23);
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = (source) => {
      if (source === "policySettings") {
        const settings_0 = getSettings_DEPRECATED();
        const hooksDisabled_0 = settings_0?.disableAllHooks === true;
        setDisabledByPolicy(hooksDisabled_0 && getSettingsForSource("policySettings")?.disableAllHooks === true);
        setRestrictedByPolicy(getSettingsForSource("policySettings")?.allowManagedHooksOnly === true);
      }
    };
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  useSettingsChange(t2);
  const mode = modeState.mode;
  const selectedEvent = "event" in modeState ? modeState.event : "PreToolUse";
  const selectedMatcher = "matcher" in modeState ? modeState.matcher : null;
  const mcp = useAppState(_temp32);
  const appStateStore = useAppStateStore();
  let t3;
  if ($[2] !== mcp.tools || $[3] !== toolNames) {
    t3 = [...toolNames, ...mcp.tools.map(_temp42)];
    $[2] = mcp.tools;
    $[3] = toolNames;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const combinedToolNames = t3;
  let t4;
  if ($[5] !== appStateStore || $[6] !== combinedToolNames) {
    t4 = groupHooksByEventAndMatcher(appStateStore.getState(), combinedToolNames);
    $[5] = appStateStore;
    $[6] = combinedToolNames;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  const hooksByEventAndMatcher = t4;
  let t5;
  if ($[8] !== hooksByEventAndMatcher || $[9] !== selectedEvent) {
    t5 = getSortedMatchersForEvent(hooksByEventAndMatcher, selectedEvent);
    $[8] = hooksByEventAndMatcher;
    $[9] = selectedEvent;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  const sortedMatchersForSelectedEvent = t5;
  let t6;
  if ($[11] !== hooksByEventAndMatcher || $[12] !== selectedEvent || $[13] !== selectedMatcher) {
    t6 = getHooksForMatcher(hooksByEventAndMatcher, selectedEvent, selectedMatcher);
    $[11] = hooksByEventAndMatcher;
    $[12] = selectedEvent;
    $[13] = selectedMatcher;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  const hooksForSelectedMatcher = t6;
  let t7;
  if ($[15] !== onExit) {
    t7 = () => {
      onExit("Hooks dialog dismissed", {
        display: "system"
      });
    };
    $[15] = onExit;
    $[16] = t7;
  } else {
    t7 = $[16];
  }
  const handleExit = t7;
  const t8 = mode === "select-event";
  let t9;
  if ($[17] !== t8) {
    t9 = {
      context: "Confirmation",
      isActive: t8
    };
    $[17] = t8;
    $[18] = t9;
  } else {
    t9 = $[18];
  }
  useKeybinding("confirm:no", handleExit, t9);
  let t10;
  if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = () => {
      setModeState({
        mode: "select-event"
      });
    };
    $[19] = t10;
  } else {
    t10 = $[19];
  }
  const t11 = mode === "select-matcher";
  let t12;
  if ($[20] !== t11) {
    t12 = {
      context: "Confirmation",
      isActive: t11
    };
    $[20] = t11;
    $[21] = t12;
  } else {
    t12 = $[21];
  }
  useKeybinding("confirm:no", t10, t12);
  let t13;
  if ($[22] !== combinedToolNames || $[23] !== modeState) {
    t13 = () => {
      if ("event" in modeState) {
        if (getMatcherMetadata(modeState.event, combinedToolNames) !== undefined) {
          setModeState({
            mode: "select-matcher",
            event: modeState.event
          });
        } else {
          setModeState({
            mode: "select-event"
          });
        }
      }
    };
    $[22] = combinedToolNames;
    $[23] = modeState;
    $[24] = t13;
  } else {
    t13 = $[24];
  }
  const t14 = mode === "select-hook";
  let t15;
  if ($[25] !== t14) {
    t15 = {
      context: "Confirmation",
      isActive: t14
    };
    $[25] = t14;
    $[26] = t15;
  } else {
    t15 = $[26];
  }
  useKeybinding("confirm:no", t13, t15);
  let t16;
  if ($[27] !== modeState) {
    t16 = () => {
      if (modeState.mode === "view-hook") {
        const {
          event,
          hook
        } = modeState;
        setModeState({
          mode: "select-hook",
          event,
          matcher: hook.matcher || ""
        });
      }
    };
    $[27] = modeState;
    $[28] = t16;
  } else {
    t16 = $[28];
  }
  const t17 = mode === "view-hook";
  let t18;
  if ($[29] !== t17) {
    t18 = {
      context: "Confirmation",
      isActive: t17
    };
    $[29] = t17;
    $[30] = t18;
  } else {
    t18 = $[30];
  }
  useKeybinding("confirm:no", t16, t18);
  let t19;
  if ($[31] !== combinedToolNames) {
    t19 = getHookEventMetadata(combinedToolNames);
    $[31] = combinedToolNames;
    $[32] = t19;
  } else {
    t19 = $[32];
  }
  const hookEventMetadata = t19;
  const settings_1 = getSettings_DEPRECATED();
  const hooksDisabled_1 = settings_1?.disableAllHooks === true;
  let t20;
  if ($[33] !== hooksByEventAndMatcher) {
    const byEvent = {};
    let total = 0;
    for (const [event_0, matchers] of Object.entries(hooksByEventAndMatcher)) {
      const eventCount = Object.values(matchers).reduce(_temp5, 0);
      byEvent[event_0] = eventCount;
      total = total + eventCount;
    }
    t20 = {
      hooksByEvent: byEvent,
      totalHooksCount: total
    };
    $[33] = hooksByEventAndMatcher;
    $[34] = t20;
  } else {
    t20 = $[34];
  }
  const {
    hooksByEvent,
    totalHooksCount
  } = t20;
  if (hooksDisabled_1) {
    let t21;
    if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
      t21 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        bold: true,
        children: "disabled"
      }, undefined, false, undefined, this);
      $[35] = t21;
    } else {
      t21 = $[35];
    }
    const t22 = disabledByPolicy && " by a managed settings file";
    let t23;
    if ($[36] !== totalHooksCount) {
      t23 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        bold: true,
        children: totalHooksCount
      }, undefined, false, undefined, this);
      $[36] = totalHooksCount;
      $[37] = t23;
    } else {
      t23 = $[37];
    }
    let t24;
    if ($[38] !== totalHooksCount) {
      t24 = plural(totalHooksCount, "hook");
      $[38] = totalHooksCount;
      $[39] = t24;
    } else {
      t24 = $[39];
    }
    let t25;
    if ($[40] !== totalHooksCount) {
      t25 = plural(totalHooksCount, "is", "are");
      $[40] = totalHooksCount;
      $[41] = t25;
    } else {
      t25 = $[41];
    }
    let t26;
    if ($[42] !== t22 || $[43] !== t23 || $[44] !== t24 || $[45] !== t25) {
      t26 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        children: [
          "All hooks are currently ",
          t21,
          t22,
          ". You have",
          " ",
          t23,
          " configured",
          " ",
          t24,
          " that",
          " ",
          t25,
          " not running."
        ]
      }, undefined, true, undefined, this);
      $[42] = t22;
      $[43] = t23;
      $[44] = t24;
      $[45] = t25;
      $[46] = t26;
    } else {
      t26 = $[46];
    }
    let t27;
    let t28;
    let t29;
    let t30;
    if ($[47] === Symbol.for("react.memo_cache_sentinel")) {
      t27 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
        marginTop: 1,
        children: /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
          dimColor: true,
          children: "When hooks are disabled:"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      t28 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        dimColor: true,
        children: "\xB7 No hook commands will execute"
      }, undefined, false, undefined, this);
      t29 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        dimColor: true,
        children: "\xB7 StatusLine will not be displayed"
      }, undefined, false, undefined, this);
      t30 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        dimColor: true,
        children: "\xB7 Tool operations will proceed without hook validation"
      }, undefined, false, undefined, this);
      $[47] = t27;
      $[48] = t28;
      $[49] = t29;
      $[50] = t30;
    } else {
      t27 = $[47];
      t28 = $[48];
      t29 = $[49];
      t30 = $[50];
    }
    let t31;
    if ($[51] !== t26) {
      t31 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t26,
          t27,
          t28,
          t29,
          t30
        ]
      }, undefined, true, undefined, this);
      $[51] = t26;
      $[52] = t31;
    } else {
      t31 = $[52];
    }
    let t32;
    if ($[53] !== disabledByPolicy) {
      t32 = !disabledByPolicy && /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
        dimColor: true,
        children: 'To re-enable hooks, remove "disableAllHooks" from settings.json or ask Claude.'
      }, undefined, false, undefined, this);
      $[53] = disabledByPolicy;
      $[54] = t32;
    } else {
      t32 = $[54];
    }
    let t33;
    if ($[55] !== t31 || $[56] !== t32) {
      t33 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          t31,
          t32
        ]
      }, undefined, true, undefined, this);
      $[55] = t31;
      $[56] = t32;
      $[57] = t33;
    } else {
      t33 = $[57];
    }
    let t34;
    if ($[58] !== handleExit || $[59] !== t33) {
      t34 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(Dialog, {
        title: "Hook Configuration - Disabled",
        onCancel: handleExit,
        inputGuide: _temp62,
        children: t33
      }, undefined, false, undefined, this);
      $[58] = handleExit;
      $[59] = t33;
      $[60] = t34;
    } else {
      t34 = $[60];
    }
    return t34;
  }
  switch (modeState.mode) {
    case "select-event": {
      let t21;
      if ($[61] !== combinedToolNames) {
        t21 = (event_2) => {
          if (getMatcherMetadata(event_2, combinedToolNames) !== undefined) {
            setModeState({
              mode: "select-matcher",
              event: event_2
            });
          } else {
            setModeState({
              mode: "select-hook",
              event: event_2,
              matcher: ""
            });
          }
        };
        $[61] = combinedToolNames;
        $[62] = t21;
      } else {
        t21 = $[62];
      }
      let t22;
      if ($[63] !== handleExit || $[64] !== hookEventMetadata || $[65] !== hooksByEvent || $[66] !== restrictedByPolicy || $[67] !== t21 || $[68] !== totalHooksCount) {
        t22 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(SelectEventMode, {
          hookEventMetadata,
          hooksByEvent,
          totalHooksCount,
          restrictedByPolicy,
          onSelectEvent: t21,
          onCancel: handleExit
        }, undefined, false, undefined, this);
        $[63] = handleExit;
        $[64] = hookEventMetadata;
        $[65] = hooksByEvent;
        $[66] = restrictedByPolicy;
        $[67] = t21;
        $[68] = totalHooksCount;
        $[69] = t22;
      } else {
        t22 = $[69];
      }
      return t22;
    }
    case "select-matcher": {
      const t21 = hookEventMetadata[modeState.event];
      let t22;
      if ($[70] !== modeState.event) {
        t22 = (matcher) => {
          setModeState({
            mode: "select-hook",
            event: modeState.event,
            matcher
          });
        };
        $[70] = modeState.event;
        $[71] = t22;
      } else {
        t22 = $[71];
      }
      let t23;
      if ($[72] === Symbol.for("react.memo_cache_sentinel")) {
        t23 = () => {
          setModeState({
            mode: "select-event"
          });
        };
        $[72] = t23;
      } else {
        t23 = $[72];
      }
      let t24;
      if ($[73] !== hooksByEventAndMatcher || $[74] !== modeState.event || $[75] !== sortedMatchersForSelectedEvent || $[76] !== t21.description || $[77] !== t22) {
        t24 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(SelectMatcherMode, {
          selectedEvent: modeState.event,
          matchersForSelectedEvent: sortedMatchersForSelectedEvent,
          hooksByEventAndMatcher,
          eventDescription: t21.description,
          onSelect: t22,
          onCancel: t23
        }, undefined, false, undefined, this);
        $[73] = hooksByEventAndMatcher;
        $[74] = modeState.event;
        $[75] = sortedMatchersForSelectedEvent;
        $[76] = t21.description;
        $[77] = t22;
        $[78] = t24;
      } else {
        t24 = $[78];
      }
      return t24;
    }
    case "select-hook": {
      const t21 = hookEventMetadata[modeState.event];
      let t22;
      if ($[79] !== modeState.event) {
        t22 = (hook_1) => {
          setModeState({
            mode: "view-hook",
            event: modeState.event,
            hook: hook_1
          });
        };
        $[79] = modeState.event;
        $[80] = t22;
      } else {
        t22 = $[80];
      }
      let t23;
      if ($[81] !== combinedToolNames || $[82] !== modeState.event) {
        t23 = () => {
          if (getMatcherMetadata(modeState.event, combinedToolNames) !== undefined) {
            setModeState({
              mode: "select-matcher",
              event: modeState.event
            });
          } else {
            setModeState({
              mode: "select-event"
            });
          }
        };
        $[81] = combinedToolNames;
        $[82] = modeState.event;
        $[83] = t23;
      } else {
        t23 = $[83];
      }
      let t24;
      if ($[84] !== hooksForSelectedMatcher || $[85] !== modeState.event || $[86] !== modeState.matcher || $[87] !== t21 || $[88] !== t22 || $[89] !== t23) {
        t24 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(SelectHookMode, {
          selectedEvent: modeState.event,
          selectedMatcher: modeState.matcher,
          hooksForSelectedMatcher,
          hookEventMetadata: t21,
          onSelect: t22,
          onCancel: t23
        }, undefined, false, undefined, this);
        $[84] = hooksForSelectedMatcher;
        $[85] = modeState.event;
        $[86] = modeState.matcher;
        $[87] = t21;
        $[88] = t22;
        $[89] = t23;
        $[90] = t24;
      } else {
        t24 = $[90];
      }
      return t24;
    }
    case "view-hook": {
      const t21 = modeState.hook;
      let t22;
      if ($[91] !== combinedToolNames || $[92] !== modeState.event) {
        t22 = getMatcherMetadata(modeState.event, combinedToolNames);
        $[91] = combinedToolNames;
        $[92] = modeState.event;
        $[93] = t22;
      } else {
        t22 = $[93];
      }
      const t23 = t22 !== undefined;
      let t24;
      if ($[94] !== modeState) {
        t24 = () => {
          const {
            event: event_1,
            hook: hook_0
          } = modeState;
          setModeState({
            mode: "select-hook",
            event: event_1,
            matcher: hook_0.matcher || ""
          });
        };
        $[94] = modeState;
        $[95] = t24;
      } else {
        t24 = $[95];
      }
      let t25;
      if ($[96] !== modeState.hook || $[97] !== t23 || $[98] !== t24) {
        t25 = /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ViewHookMode, {
          selectedHook: t21,
          eventSupportsMatcher: t23,
          onCancel: t24
        }, undefined, false, undefined, this);
        $[96] = modeState.hook;
        $[97] = t23;
        $[98] = t24;
        $[99] = t25;
      } else {
        t25 = $[99];
      }
      return t25;
    }
  }
}
function _temp62() {
  return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(ThemedText, {
    children: "Esc to close"
  }, undefined, false, undefined, this);
}
function _temp5(sum, hooks) {
  return sum + hooks.length;
}
function _temp42(tool) {
  return tool.name;
}
function _temp32(s) {
  return s.mcp;
}
function _temp23() {
  return getSettingsForSource("policySettings")?.allowManagedHooksOnly === true;
}
function _temp7() {
  const settings = getSettings_DEPRECATED();
  const hooksDisabled = settings?.disableAllHooks === true;
  return hooksDisabled && getSettingsForSource("policySettings")?.disableAllHooks === true;
}
var import_compiler_runtime5, import_react, jsx_dev_runtime5;
var init_HooksConfigMenu = __esm(() => {
  init_AppState();
  init_useSettingsChange();
  init_ink();
  init_useKeybinding();
  init_hooksConfigManager();
  init_settings();
  init_stringUtils();
  init_Dialog();
  init_SelectEventMode();
  init_SelectHookMode();
  init_SelectMatcherMode();
  init_ViewHookMode();
  import_compiler_runtime5 = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/hooks/hooks.tsx
var jsx_dev_runtime6, call = async (onDone, context) => {
  logEvent("tengu_hooks_command", {});
  const appState = context.getAppState();
  const permissionContext = appState.toolPermissionContext;
  const toolNames = getTools(permissionContext).map((tool) => tool.name);
  return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(HooksConfigMenu, {
    toolNames,
    onExit: onDone
  }, undefined, false, undefined, this);
};
var init_hooks = __esm(() => {
  init_HooksConfigMenu();
  init_analytics();
  init_tools();
  jsx_dev_runtime6 = __toESM(require_jsx_dev_runtime(), 1);
});
init_hooks();

export {
  call
};
