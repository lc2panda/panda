// @bun
import {
  MCPRemoteServerMenu,
  MCPStdioServerMenu,
  MCPToolDetailView,
  MCPToolListView,
  init_MCPRemoteServerMenu,
  init_MCPStdioServerMenu,
  init_MCPToolDetailView,
  init_MCPToolListView,
  init_PluginSettings
} from "./chunk-a7w9y4ht.js";
import"./chunk-frmxparx.js";
import {
  init_MCPConnectionManager,
  useMcpReconnect,
  useMcpToggleEnabled
} from "./chunk-x7w5872j.js";
import"./chunk-xangvvta.js";
import"./chunk-395k2kgy.js";
import"./chunk-tehf7yb8.js";
import"./chunk-9vz0twjz.js";
import"./chunk-fs7eaved.js";
import"./chunk-yhdqebwk.js";
import"./chunk-dxkdr7yz.js";
import"./chunk-5rsyjdzb.js";
import {
  McpParsingWarnings,
  init_McpParsingWarnings
} from "./chunk-kjvdgbqa.js";
import"./chunk-y5v4npt0.js";
import {
  AuthenticationCancelledError,
  ClaudeAuthProvider,
  Select,
  Spinner,
  describeMcpConfigFilePath,
  extractAgentMcpServers,
  filterToolsByServer,
  init_AppState,
  init_CustomSelect,
  init_Spinner,
  init_auth,
  init_utils,
  performMCPOAuthFlow,
  useAppState,
  useAppStateStore
} from "./chunk-jwtmq3ad.js";
import {
  getSessionIngressAuthToken,
  init_sessionIngressAuth
} from "./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import {
  Byline,
  ConfigurableShortcutHint,
  Dialog,
  KeyboardShortcutHint,
  init_Byline,
  init_ConfigurableShortcutHint,
  init_Dialog,
  init_KeyboardShortcutHint
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
  useKeybinding,
  useKeybindings
} from "./chunk-x2y5syym.js";
import {
  Link,
  ThemedBox_default,
  ThemedText,
  color,
  init_ink,
  require_compiler_runtime,
  useTheme
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
  capitalize,
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
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  init_debug,
  isDebugMode
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
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/mcp/MCPAgentServerMenu.tsx
function MCPAgentServerMenu({
  agentServer,
  onCancel,
  onComplete
}) {
  const [theme] = useTheme();
  const [isAuthenticating, setIsAuthenticating] = import_react.useState(false);
  const [error, setError] = import_react.useState(null);
  const [authorizationUrl, setAuthorizationUrl] = import_react.useState(null);
  const authAbortControllerRef = import_react.useRef(null);
  import_react.useEffect(() => () => authAbortControllerRef.current?.abort(), []);
  const handleEscCancel = import_react.useCallback(() => {
    if (isAuthenticating) {
      authAbortControllerRef.current?.abort();
      authAbortControllerRef.current = null;
      setIsAuthenticating(false);
      setAuthorizationUrl(null);
    }
  }, [isAuthenticating]);
  useKeybinding("confirm:no", handleEscCancel, {
    context: "Confirmation",
    isActive: isAuthenticating
  });
  const handleAuthenticate = import_react.useCallback(async () => {
    if (!agentServer.needsAuth || !agentServer.url) {
      return;
    }
    setIsAuthenticating(true);
    setError(null);
    const controller = new AbortController;
    authAbortControllerRef.current = controller;
    try {
      const tempConfig = {
        type: agentServer.transport,
        url: agentServer.url
      };
      await performMCPOAuthFlow(agentServer.name, tempConfig, setAuthorizationUrl, controller.signal);
      onComplete?.(`Authentication successful for ${agentServer.name}. The server will connect when the agent runs.`);
    } catch (err) {
      if (err instanceof Error && !(err instanceof AuthenticationCancelledError)) {
        setError(err.message);
      }
    } finally {
      setIsAuthenticating(false);
      authAbortControllerRef.current = null;
    }
  }, [agentServer, onComplete]);
  const capitalizedServerName = capitalize(String(agentServer.name));
  if (isAuthenticating) {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      padding: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "claude",
          children: [
            "Authenticating with ",
            agentServer.name,
            "\u2026"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: " A browser window will open for authentication"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        authorizationUrl && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              dimColor: true,
              children: "If your browser doesn't open automatically, copy this URL manually:"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Link, {
              url: authorizationUrl
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          marginLeft: 3,
          children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              "Return here after authenticating in your browser.",
              " ",
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
                action: "confirm:no",
                context: "Confirmation",
                fallback: "Esc",
                description: "go back"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const menuOptions = [];
  if (agentServer.needsAuth) {
    menuOptions.push({
      label: agentServer.isAuthenticated ? "Re-authenticate" : "Authenticate",
      value: "auth"
    });
  }
  menuOptions.push({
    label: "Back",
    value: "back"
  });
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
    title: `${capitalizedServerName} MCP Server`,
    subtitle: "agent-only",
    onCancel,
    inputGuide: (exitState) => exitState.pending ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
          shortcut: "\u2191\u2193",
          action: "navigate"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
          shortcut: "Enter",
          action: "confirm"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Confirmation",
          fallback: "Esc",
          description: "go back"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this),
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 0,
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: "Type: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: agentServer.transport
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          agentServer.url && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: "URL: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: agentServer.url
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          agentServer.command && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: "Command: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: agentServer.command
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: "Used by: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: agentServer.sourceAgents.join(", ")
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: "Status: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: [
                  color("inactive", theme)(figures_default.radioOff),
                  " not connected (agent-only)"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          agentServer.needsAuth && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                children: "Auth: "
              }, undefined, false, undefined, this),
              agentServer.isAuthenticated ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: [
                  color("success", theme)(figures_default.tick),
                  " authenticated"
                ]
              }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: [
                  color("warning", theme)(figures_default.triangleUpOutline),
                  " may need authentication"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "This server connects only when running the agent."
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      error && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          color: "error",
          children: [
            "Error: ",
            error
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
          options: menuOptions,
          onChange: async (value) => {
            switch (value) {
              case "auth":
                await handleAuthenticate();
                break;
              case "back":
                onCancel();
                break;
            }
          },
          onCancel
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var import_react, jsx_dev_runtime;
var init_MCPAgentServerMenu = __esm(() => {
  init_figures();
  init_ink();
  init_useKeybinding();
  init_auth();
  init_stringUtils();
  init_ConfigurableShortcutHint();
  init_CustomSelect();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  init_Spinner();
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/mcp/MCPListPanel.tsx
function getScopeHeading(scope) {
  switch (scope) {
    case "project":
      return {
        label: "Project MCPs",
        path: describeMcpConfigFilePath(scope)
      };
    case "user":
      return {
        label: "User MCPs",
        path: describeMcpConfigFilePath(scope)
      };
    case "local":
      return {
        label: "Local MCPs",
        path: describeMcpConfigFilePath(scope)
      };
    case "enterprise":
      return {
        label: "Enterprise MCPs"
      };
    case "dynamic":
      return {
        label: "Built-in MCPs",
        path: "always available"
      };
    default:
      return {
        label: scope
      };
  }
}
function groupServersByScope(serverList) {
  const groups = new Map;
  for (const server of serverList) {
    const scope = server.scope;
    if (!groups.has(scope)) {
      groups.set(scope, []);
    }
    groups.get(scope).push(server);
  }
  for (const [, groupServers] of groups) {
    groupServers.sort((a, b) => a.name.localeCompare(b.name));
  }
  return groups;
}
function MCPListPanel(t0) {
  const $ = import_compiler_runtime.c(78);
  const {
    servers,
    agentServers: t1,
    onSelectServer,
    onSelectAgentServer,
    onComplete
  } = t0;
  let t2;
  if ($[0] !== t1) {
    t2 = t1 === undefined ? [] : t1;
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const agentServers = t2;
  const [theme] = useTheme();
  const [selectedIndex, setSelectedIndex] = import_react2.useState(0);
  let t3;
  if ($[2] !== servers) {
    const regularServers = servers.filter(_temp);
    t3 = groupServersByScope(regularServers);
    $[2] = servers;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const serversByScope = t3;
  let t4;
  if ($[4] !== servers) {
    t4 = servers.filter(_temp2).sort(_temp3);
    $[4] = servers;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const claudeAiServers = t4;
  let t5;
  if ($[6] !== serversByScope) {
    t5 = (serversByScope.get("dynamic") ?? []).sort(_temp4);
    $[6] = serversByScope;
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  const dynamicServers = t5;
  let t6;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = getScopeHeading("dynamic");
    $[8] = t6;
  } else {
    t6 = $[8];
  }
  const dynamicHeading = t6;
  let items;
  if ($[9] !== agentServers || $[10] !== claudeAiServers || $[11] !== dynamicServers || $[12] !== serversByScope) {
    items = [];
    for (const scope of SCOPE_ORDER) {
      const scopeServers = serversByScope.get(scope) ?? [];
      for (const server of scopeServers) {
        items.push({
          type: "server",
          server
        });
      }
    }
    for (const server_0 of claudeAiServers) {
      items.push({
        type: "server",
        server: server_0
      });
    }
    for (const agentServer of agentServers) {
      items.push({
        type: "agent-server",
        agentServer
      });
    }
    for (const server_1 of dynamicServers) {
      items.push({
        type: "server",
        server: server_1
      });
    }
    $[9] = agentServers;
    $[10] = claudeAiServers;
    $[11] = dynamicServers;
    $[12] = serversByScope;
    $[13] = items;
  } else {
    items = $[13];
  }
  const selectableItems = items;
  let t7;
  if ($[14] !== onComplete) {
    t7 = () => {
      onComplete("MCP dialog dismissed", {
        display: "system"
      });
    };
    $[14] = onComplete;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  const handleCancel = t7;
  let t8;
  if ($[16] !== onSelectAgentServer || $[17] !== onSelectServer || $[18] !== selectableItems || $[19] !== selectedIndex) {
    t8 = () => {
      const item = selectableItems[selectedIndex];
      if (!item) {
        return;
      }
      if (item.type === "server") {
        onSelectServer(item.server);
      } else {
        if (item.type === "agent-server" && onSelectAgentServer) {
          onSelectAgentServer(item.agentServer);
        }
      }
    };
    $[16] = onSelectAgentServer;
    $[17] = onSelectServer;
    $[18] = selectableItems;
    $[19] = selectedIndex;
    $[20] = t8;
  } else {
    t8 = $[20];
  }
  const handleSelect = t8;
  let t10;
  let t9;
  if ($[21] !== selectableItems) {
    t9 = () => setSelectedIndex((prev) => prev === 0 ? selectableItems.length - 1 : prev - 1);
    t10 = () => setSelectedIndex((prev_0) => prev_0 === selectableItems.length - 1 ? 0 : prev_0 + 1);
    $[21] = selectableItems;
    $[22] = t10;
    $[23] = t9;
  } else {
    t10 = $[22];
    t9 = $[23];
  }
  let t11;
  if ($[24] !== handleCancel || $[25] !== handleSelect || $[26] !== t10 || $[27] !== t9) {
    t11 = {
      "confirm:previous": t9,
      "confirm:next": t10,
      "confirm:yes": handleSelect,
      "confirm:no": handleCancel
    };
    $[24] = handleCancel;
    $[25] = handleSelect;
    $[26] = t10;
    $[27] = t9;
    $[28] = t11;
  } else {
    t11 = $[28];
  }
  let t12;
  if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
    t12 = {
      context: "Confirmation"
    };
    $[29] = t12;
  } else {
    t12 = $[29];
  }
  useKeybindings(t11, t12);
  let t13;
  if ($[30] !== selectableItems) {
    t13 = (server_2) => selectableItems.findIndex((item_0) => item_0.type === "server" && item_0.server === server_2);
    $[30] = selectableItems;
    $[31] = t13;
  } else {
    t13 = $[31];
  }
  const getServerIndex = t13;
  let t14;
  if ($[32] !== selectableItems) {
    t14 = (agentServer_0) => selectableItems.findIndex((item_1) => item_1.type === "agent-server" && item_1.agentServer === agentServer_0);
    $[32] = selectableItems;
    $[33] = t14;
  } else {
    t14 = $[33];
  }
  const getAgentServerIndex = t14;
  let t15;
  if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
    t15 = isDebugMode();
    $[34] = t15;
  } else {
    t15 = $[34];
  }
  const debugMode = t15;
  let t16;
  if ($[35] !== servers) {
    t16 = servers.some(_temp5);
    $[35] = servers;
    $[36] = t16;
  } else {
    t16 = $[36];
  }
  const hasFailedClients = t16;
  if (servers.length === 0 && agentServers.length === 0) {
    return null;
  }
  let t17;
  if ($[37] !== getServerIndex || $[38] !== selectedIndex || $[39] !== theme) {
    t17 = (server_3) => {
      const index = getServerIndex(server_3);
      const isSelected = selectedIndex === index;
      let statusIcon;
      let statusText;
      if (server_3.client.type === "disabled") {
        statusIcon = color("inactive", theme)(figures_default.radioOff);
        statusText = "disabled";
      } else {
        if (server_3.client.type === "connected") {
          statusIcon = color("success", theme)(figures_default.tick);
          statusText = "connected";
        } else {
          if (server_3.client.type === "pending") {
            statusIcon = color("inactive", theme)(figures_default.radioOff);
            const {
              reconnectAttempt,
              maxReconnectAttempts
            } = server_3.client;
            if (reconnectAttempt && maxReconnectAttempts) {
              statusText = `reconnecting (${reconnectAttempt}/${maxReconnectAttempts})\u2026`;
            } else {
              statusText = "connecting\u2026";
            }
          } else {
            if (server_3.client.type === "needs-auth") {
              statusIcon = color("warning", theme)(figures_default.triangleUpOutline);
              statusText = "needs authentication";
            } else {
              statusIcon = color("error", theme)(figures_default.cross);
              statusText = "failed";
            }
          }
        }
      }
      return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            color: isSelected ? "suggestion" : undefined,
            children: isSelected ? `${figures_default.pointer} ` : "  "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            color: isSelected ? "suggestion" : undefined,
            children: server_3.name
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: !isSelected,
            children: [
              " \xB7 ",
              statusIcon,
              " "
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: !isSelected,
            children: statusText
          }, undefined, false, undefined, this)
        ]
      }, `${server_3.name}-${index}`, true, undefined, this);
    };
    $[37] = getServerIndex;
    $[38] = selectedIndex;
    $[39] = theme;
    $[40] = t17;
  } else {
    t17 = $[40];
  }
  const renderServerItem = t17;
  let t18;
  if ($[41] !== getAgentServerIndex || $[42] !== selectedIndex || $[43] !== theme) {
    t18 = (agentServer_1) => {
      const index_0 = getAgentServerIndex(agentServer_1);
      const isSelected_0 = selectedIndex === index_0;
      const statusIcon_0 = agentServer_1.needsAuth ? color("warning", theme)(figures_default.triangleUpOutline) : color("inactive", theme)(figures_default.radioOff);
      const statusText_0 = agentServer_1.needsAuth ? "may need auth" : "agent-only";
      return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            color: isSelected_0 ? "suggestion" : undefined,
            children: isSelected_0 ? `${figures_default.pointer} ` : "  "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            color: isSelected_0 ? "suggestion" : undefined,
            children: agentServer_1.name
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: !isSelected_0,
            children: [
              " \xB7 ",
              statusIcon_0,
              " "
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: !isSelected_0,
            children: statusText_0
          }, undefined, false, undefined, this)
        ]
      }, `agent-${agentServer_1.name}-${index_0}`, true, undefined, this);
    };
    $[41] = getAgentServerIndex;
    $[42] = selectedIndex;
    $[43] = theme;
    $[44] = t18;
  } else {
    t18 = $[44];
  }
  const renderAgentServerItem = t18;
  const totalServers = servers.length + agentServers.length;
  let t19;
  if ($[45] === Symbol.for("react.memo_cache_sentinel")) {
    t19 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(McpParsingWarnings, {}, undefined, false, undefined, this);
    $[45] = t19;
  } else {
    t19 = $[45];
  }
  let t20;
  if ($[46] !== totalServers) {
    t20 = plural(totalServers, "server");
    $[46] = totalServers;
    $[47] = t20;
  } else {
    t20 = $[47];
  }
  const t21 = `${totalServers} ${t20}`;
  let t22;
  if ($[48] !== renderServerItem || $[49] !== serversByScope) {
    t22 = SCOPE_ORDER.map((scope_0) => {
      const scopeServers_0 = serversByScope.get(scope_0);
      if (!scopeServers_0 || scopeServers_0.length === 0) {
        return null;
      }
      const heading = getScopeHeading(scope_0);
      return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
            paddingLeft: 2,
            children: [
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                bold: true,
                children: heading.label
              }, undefined, false, undefined, this),
              heading.path && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  " (",
                  heading.path,
                  ")"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          scopeServers_0.map((server_4) => renderServerItem(server_4))
        ]
      }, scope_0, true, undefined, this);
    });
    $[48] = renderServerItem;
    $[49] = serversByScope;
    $[50] = t22;
  } else {
    t22 = $[50];
  }
  let t23;
  if ($[51] !== claudeAiServers || $[52] !== renderServerItem) {
    t23 = claudeAiServers.length > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          paddingLeft: 2,
          children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            bold: true,
            children: "claude.ai"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        claudeAiServers.map((server_5) => renderServerItem(server_5))
      ]
    }, undefined, true, undefined, this);
    $[51] = claudeAiServers;
    $[52] = renderServerItem;
    $[53] = t23;
  } else {
    t23 = $[53];
  }
  let t24;
  if ($[54] !== agentServers || $[55] !== renderAgentServerItem) {
    t24 = agentServers.length > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          paddingLeft: 2,
          children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            bold: true,
            children: "Agent MCPs"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        [...new Set(agentServers.flatMap(_temp6))].map((agentName) => /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          flexDirection: "column",
          marginTop: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
              paddingLeft: 2,
              children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  "@",
                  agentName
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            agentServers.filter((s_3) => s_3.sourceAgents.includes(agentName)).map((agentServer_2) => renderAgentServerItem(agentServer_2))
          ]
        }, agentName, true, undefined, this))
      ]
    }, undefined, true, undefined, this);
    $[54] = agentServers;
    $[55] = renderAgentServerItem;
    $[56] = t24;
  } else {
    t24 = $[56];
  }
  let t25;
  if ($[57] !== dynamicServers || $[58] !== renderServerItem) {
    t25 = dynamicServers.length > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          paddingLeft: 2,
          children: [
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              bold: true,
              children: dynamicHeading.label
            }, undefined, false, undefined, this),
            dynamicHeading.path && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                " (",
                dynamicHeading.path,
                ")"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        dynamicServers.map((server_6) => renderServerItem(server_6))
      ]
    }, undefined, true, undefined, this);
    $[57] = dynamicServers;
    $[58] = renderServerItem;
    $[59] = t25;
  } else {
    t25 = $[59];
  }
  let t26;
  if ($[60] !== hasFailedClients) {
    t26 = hasFailedClients && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: debugMode ? "\u203B Error logs shown inline with --debug" : "\u203B Run claude --debug to see error logs"
    }, undefined, false, undefined, this);
    $[60] = hasFailedClients;
    $[61] = t26;
  } else {
    t26 = $[61];
  }
  let t27;
  if ($[62] === Symbol.for("react.memo_cache_sentinel")) {
    t27 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Link, {
          url: "https://code.claude.com/docs/en/mcp",
          children: "https://code.claude.com/docs/en/mcp"
        }, undefined, false, undefined, this),
        " ",
        "for help"
      ]
    }, undefined, true, undefined, this);
    $[62] = t27;
  } else {
    t27 = $[62];
  }
  let t28;
  if ($[63] !== t26) {
    t28 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t26,
        t27
      ]
    }, undefined, true, undefined, this);
    $[63] = t26;
    $[64] = t28;
  } else {
    t28 = $[64];
  }
  let t29;
  if ($[65] !== t22 || $[66] !== t23 || $[67] !== t24 || $[68] !== t25 || $[69] !== t28) {
    t29 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t22,
        t23,
        t24,
        t25,
        t28
      ]
    }, undefined, true, undefined, this);
    $[65] = t22;
    $[66] = t23;
    $[67] = t24;
    $[68] = t25;
    $[69] = t28;
    $[70] = t29;
  } else {
    t29 = $[70];
  }
  let t30;
  if ($[71] !== handleCancel || $[72] !== t21 || $[73] !== t29) {
    t30 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Dialog, {
      title: "Manage MCP servers",
      subtitle: t21,
      onCancel: handleCancel,
      hideInputGuide: true,
      children: t29
    }, undefined, false, undefined, this);
    $[71] = handleCancel;
    $[72] = t21;
    $[73] = t29;
    $[74] = t30;
  } else {
    t30 = $[74];
  }
  let t31;
  if ($[75] === Symbol.for("react.memo_cache_sentinel")) {
    t31 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      paddingX: 1,
      children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(Byline, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(KeyboardShortcutHint, {
              shortcut: "\u2191\u2193",
              action: "navigate"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(KeyboardShortcutHint, {
              shortcut: "Enter",
              action: "confirm"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ConfigurableShortcutHint, {
              action: "confirm:no",
              context: "Confirmation",
              fallback: "Esc",
              description: "cancel"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[75] = t31;
  } else {
    t31 = $[75];
  }
  let t32;
  if ($[76] !== t30) {
    t32 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t19,
        t30,
        t31
      ]
    }, undefined, true, undefined, this);
    $[76] = t30;
    $[77] = t32;
  } else {
    t32 = $[77];
  }
  return t32;
}
function _temp6(s_2) {
  return s_2.sourceAgents;
}
function _temp5(s_1) {
  return s_1.client.type === "failed";
}
function _temp4(a_0, b_0) {
  return a_0.name.localeCompare(b_0.name);
}
function _temp3(a, b) {
  return a.name.localeCompare(b.name);
}
function _temp2(s_0) {
  return s_0.client.config.type === "claudeai-proxy";
}
function _temp(s) {
  return s.client.config.type !== "claudeai-proxy";
}
var import_compiler_runtime, import_react2, jsx_dev_runtime2, SCOPE_ORDER;
var init_MCPListPanel = __esm(() => {
  init_figures();
  init_ink();
  init_useKeybinding();
  init_utils();
  init_debug();
  init_stringUtils();
  init_ConfigurableShortcutHint();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  init_McpParsingWarnings();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
  SCOPE_ORDER = ["project", "local", "user", "enterprise"];
});

// src/components/mcp/MCPReconnect.tsx
function MCPReconnect(t0) {
  const $ = import_compiler_runtime2.c(25);
  const {
    serverName,
    onComplete
  } = t0;
  const [theme] = useTheme();
  const store = useAppStateStore();
  const reconnectMcpServer = useMcpReconnect();
  const [isReconnecting, setIsReconnecting] = import_react3.useState(true);
  const [error, setError] = import_react3.useState(null);
  let t1;
  let t2;
  if ($[0] !== onComplete || $[1] !== reconnectMcpServer || $[2] !== serverName || $[3] !== store) {
    t1 = () => {
      const attemptReconnect = async function attemptReconnect2() {
        try {
          const server = store.getState().mcp.clients.find((c) => c.name === serverName);
          if (!server) {
            setError(`MCP server "${serverName}" not found`);
            setIsReconnecting(false);
            onComplete(`MCP server "${serverName}" not found`);
            return;
          }
          const result = await reconnectMcpServer(serverName);
          bb43:
            switch (result.client.type) {
              case "connected": {
                setIsReconnecting(false);
                onComplete(`Successfully reconnected to ${serverName}`);
                break bb43;
              }
              case "needs-auth": {
                setError(`${serverName} requires authentication`);
                setIsReconnecting(false);
                onComplete(`${serverName} requires authentication. Use /mcp to authenticate.`);
                break bb43;
              }
              case "pending":
              case "failed":
              case "disabled": {
                setError(`Failed to reconnect to ${serverName}`);
                setIsReconnecting(false);
                onComplete(`Failed to reconnect to ${serverName}`);
              }
            }
        } catch (t3) {
          const err = t3;
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage);
          setIsReconnecting(false);
          onComplete(`Error: ${errorMessage}`);
        }
      };
      attemptReconnect();
    };
    t2 = [serverName, reconnectMcpServer, store, onComplete];
    $[0] = onComplete;
    $[1] = reconnectMcpServer;
    $[2] = serverName;
    $[3] = store;
    $[4] = t1;
    $[5] = t2;
  } else {
    t1 = $[4];
    t2 = $[5];
  }
  import_react3.useEffect(t1, t2);
  if (isReconnecting) {
    let t3;
    if ($[6] !== serverName) {
      t3 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        color: "text",
        children: [
          "Reconnecting to ",
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            bold: true,
            children: serverName
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[6] = serverName;
      $[7] = t3;
    } else {
      t3 = $[7];
    }
    let t4;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      t4 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Spinner, {}, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            children: " Establishing connection to MCP server"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[8] = t4;
    } else {
      t4 = $[8];
    }
    let t5;
    if ($[9] !== t3) {
      t5 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        padding: 1,
        children: [
          t3,
          t4
        ]
      }, undefined, true, undefined, this);
      $[9] = t3;
      $[10] = t5;
    } else {
      t5 = $[10];
    }
    return t5;
  }
  if (error) {
    let t3;
    if ($[11] !== theme) {
      t3 = color("error", theme)(figures_default.cross);
      $[11] = theme;
      $[12] = t3;
    } else {
      t3 = $[12];
    }
    let t4;
    if ($[13] !== t3) {
      t4 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        children: [
          t3,
          " "
        ]
      }, undefined, true, undefined, this);
      $[13] = t3;
      $[14] = t4;
    } else {
      t4 = $[14];
    }
    let t5;
    if ($[15] !== serverName) {
      t5 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        color: "error",
        children: [
          "Failed to reconnect to ",
          serverName
        ]
      }, undefined, true, undefined, this);
      $[15] = serverName;
      $[16] = t5;
    } else {
      t5 = $[16];
    }
    let t6;
    if ($[17] !== t4 || $[18] !== t5) {
      t6 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
        children: [
          t4,
          t5
        ]
      }, undefined, true, undefined, this);
      $[17] = t4;
      $[18] = t5;
      $[19] = t6;
    } else {
      t6 = $[19];
    }
    let t7;
    if ($[20] !== error) {
      t7 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "Error: ",
          error
        ]
      }, undefined, true, undefined, this);
      $[20] = error;
      $[21] = t7;
    } else {
      t7 = $[21];
    }
    let t8;
    if ($[22] !== t6 || $[23] !== t7) {
      t8 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        padding: 1,
        children: [
          t6,
          t7
        ]
      }, undefined, true, undefined, this);
      $[22] = t6;
      $[23] = t7;
      $[24] = t8;
    } else {
      t8 = $[24];
    }
    return t8;
  }
  return null;
}
var import_compiler_runtime2, import_react3, jsx_dev_runtime3;
var init_MCPReconnect = __esm(() => {
  init_figures();
  init_ink();
  init_MCPConnectionManager();
  init_AppState();
  init_Spinner();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  import_react3 = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/mcp/MCPSettings.tsx
function MCPSettings(t0) {
  const $ = import_compiler_runtime3.c(66);
  const {
    onComplete
  } = t0;
  const mcp = useAppState(_temp7);
  const agentDefinitions = useAppState(_temp22);
  const mcpClients = mcp.clients;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      type: "list"
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [viewState, setViewState] = import_react4.default.useState(t1);
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const [servers, setServers] = import_react4.default.useState(t2);
  let t3;
  if ($[2] !== agentDefinitions.allAgents) {
    t3 = extractAgentMcpServers(agentDefinitions.allAgents);
    $[2] = agentDefinitions.allAgents;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const agentMcpServers = t3;
  let t4;
  if ($[4] !== mcpClients) {
    t4 = mcpClients.filter(_temp32).sort(_temp42);
    $[4] = mcpClients;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const filteredClients = t4;
  let t5;
  let t6;
  if ($[6] !== filteredClients || $[7] !== mcp.tools) {
    t5 = () => {
      let cancelled = false;
      const prepareServers = async function prepareServers2() {
        const serverInfos = await Promise.all(filteredClients.map(async (client_0) => {
          const scope = client_0.config.scope;
          const isSSE = client_0.config.type === "sse";
          const isHTTP = client_0.config.type === "http";
          const isClaudeAIProxy = client_0.config.type === "claudeai-proxy";
          let isAuthenticated = undefined;
          if (isSSE || isHTTP) {
            const authProvider = new ClaudeAuthProvider(client_0.name, client_0.config);
            const tokens = await authProvider.tokens();
            const hasSessionAuth = getSessionIngressAuthToken() !== null && client_0.type === "connected";
            const hasToolsAndConnected = client_0.type === "connected" && filterToolsByServer(mcp.tools, client_0.name).length > 0;
            isAuthenticated = Boolean(tokens) || hasSessionAuth || hasToolsAndConnected;
          }
          const baseInfo = {
            name: client_0.name,
            client: client_0,
            scope
          };
          if (isClaudeAIProxy) {
            return {
              ...baseInfo,
              transport: "claudeai-proxy",
              isAuthenticated: false,
              config: client_0.config
            };
          } else {
            if (isSSE) {
              return {
                ...baseInfo,
                transport: "sse",
                isAuthenticated,
                config: client_0.config
              };
            } else {
              if (isHTTP) {
                return {
                  ...baseInfo,
                  transport: "http",
                  isAuthenticated,
                  config: client_0.config
                };
              } else {
                return {
                  ...baseInfo,
                  transport: "stdio",
                  config: client_0.config
                };
              }
            }
          }
        }));
        if (cancelled) {
          return;
        }
        setServers(serverInfos);
      };
      prepareServers();
      return () => {
        cancelled = true;
      };
    };
    t6 = [filteredClients, mcp.tools];
    $[6] = filteredClients;
    $[7] = mcp.tools;
    $[8] = t5;
    $[9] = t6;
  } else {
    t5 = $[8];
    t6 = $[9];
  }
  import_react4.default.useEffect(t5, t6);
  let t7;
  let t8;
  if ($[10] !== agentMcpServers.length || $[11] !== filteredClients.length || $[12] !== onComplete || $[13] !== servers.length) {
    t7 = () => {
      if (servers.length === 0 && filteredClients.length > 0) {
        return;
      }
      if (servers.length === 0 && agentMcpServers.length === 0) {
        onComplete("No MCP servers configured. Please run /doctor if this is unexpected. Otherwise, run `claude mcp --help` or visit https://code.claude.com/docs/en/mcp to learn more.");
      }
    };
    t8 = [servers.length, filteredClients.length, agentMcpServers.length, onComplete];
    $[10] = agentMcpServers.length;
    $[11] = filteredClients.length;
    $[12] = onComplete;
    $[13] = servers.length;
    $[14] = t7;
    $[15] = t8;
  } else {
    t7 = $[14];
    t8 = $[15];
  }
  import_react4.useEffect(t7, t8);
  switch (viewState.type) {
    case "list": {
      let t10;
      let t9;
      if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = (server) => setViewState({
          type: "server-menu",
          server
        });
        t10 = (agentServer) => setViewState({
          type: "agent-server-menu",
          agentServer
        });
        $[16] = t10;
        $[17] = t9;
      } else {
        t10 = $[16];
        t9 = $[17];
      }
      let t11;
      if ($[18] !== agentMcpServers || $[19] !== onComplete || $[20] !== servers || $[21] !== viewState.defaultTab) {
        t11 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(MCPListPanel, {
          servers,
          agentServers: agentMcpServers,
          onSelectServer: t9,
          onSelectAgentServer: t10,
          onComplete,
          defaultTab: viewState.defaultTab
        }, undefined, false, undefined, this);
        $[18] = agentMcpServers;
        $[19] = onComplete;
        $[20] = servers;
        $[21] = viewState.defaultTab;
        $[22] = t11;
      } else {
        t11 = $[22];
      }
      return t11;
    }
    case "server-menu": {
      let t9;
      if ($[23] !== mcp.tools || $[24] !== viewState.server.name) {
        t9 = filterToolsByServer(mcp.tools, viewState.server.name);
        $[23] = mcp.tools;
        $[24] = viewState.server.name;
        $[25] = t9;
      } else {
        t9 = $[25];
      }
      const serverTools_0 = t9;
      const defaultTab = viewState.server.transport === "claudeai-proxy" ? "claude.ai" : "Panda Code";
      if (viewState.server.transport === "stdio") {
        let t10;
        if ($[26] !== viewState.server) {
          t10 = () => setViewState({
            type: "server-tools",
            server: viewState.server
          });
          $[26] = viewState.server;
          $[27] = t10;
        } else {
          t10 = $[27];
        }
        let t11;
        if ($[28] !== defaultTab) {
          t11 = () => setViewState({
            type: "list",
            defaultTab
          });
          $[28] = defaultTab;
          $[29] = t11;
        } else {
          t11 = $[29];
        }
        let t12;
        if ($[30] !== onComplete || $[31] !== serverTools_0.length || $[32] !== t10 || $[33] !== t11 || $[34] !== viewState.server) {
          t12 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(MCPStdioServerMenu, {
            server: viewState.server,
            serverToolsCount: serverTools_0.length,
            onViewTools: t10,
            onCancel: t11,
            onComplete
          }, undefined, false, undefined, this);
          $[30] = onComplete;
          $[31] = serverTools_0.length;
          $[32] = t10;
          $[33] = t11;
          $[34] = viewState.server;
          $[35] = t12;
        } else {
          t12 = $[35];
        }
        return t12;
      } else {
        let t10;
        if ($[36] !== viewState.server) {
          t10 = () => setViewState({
            type: "server-tools",
            server: viewState.server
          });
          $[36] = viewState.server;
          $[37] = t10;
        } else {
          t10 = $[37];
        }
        let t11;
        if ($[38] !== defaultTab) {
          t11 = () => setViewState({
            type: "list",
            defaultTab
          });
          $[38] = defaultTab;
          $[39] = t11;
        } else {
          t11 = $[39];
        }
        let t12;
        if ($[40] !== onComplete || $[41] !== serverTools_0.length || $[42] !== t10 || $[43] !== t11 || $[44] !== viewState.server) {
          t12 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(MCPRemoteServerMenu, {
            server: viewState.server,
            serverToolsCount: serverTools_0.length,
            onViewTools: t10,
            onCancel: t11,
            onComplete
          }, undefined, false, undefined, this);
          $[40] = onComplete;
          $[41] = serverTools_0.length;
          $[42] = t10;
          $[43] = t11;
          $[44] = viewState.server;
          $[45] = t12;
        } else {
          t12 = $[45];
        }
        return t12;
      }
    }
    case "server-tools": {
      let t10;
      let t9;
      if ($[46] !== viewState.server) {
        t9 = (_, index) => setViewState({
          type: "server-tool-detail",
          server: viewState.server,
          toolIndex: index
        });
        t10 = () => setViewState({
          type: "server-menu",
          server: viewState.server
        });
        $[46] = viewState.server;
        $[47] = t10;
        $[48] = t9;
      } else {
        t10 = $[47];
        t9 = $[48];
      }
      let t11;
      if ($[49] !== t10 || $[50] !== t9 || $[51] !== viewState.server) {
        t11 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(MCPToolListView, {
          server: viewState.server,
          onSelectTool: t9,
          onBack: t10
        }, undefined, false, undefined, this);
        $[49] = t10;
        $[50] = t9;
        $[51] = viewState.server;
        $[52] = t11;
      } else {
        t11 = $[52];
      }
      return t11;
    }
    case "server-tool-detail": {
      let t9;
      if ($[53] !== mcp.tools || $[54] !== viewState.server.name) {
        t9 = filterToolsByServer(mcp.tools, viewState.server.name);
        $[53] = mcp.tools;
        $[54] = viewState.server.name;
        $[55] = t9;
      } else {
        t9 = $[55];
      }
      const serverTools = t9;
      const tool = serverTools[viewState.toolIndex];
      if (!tool) {
        setViewState({
          type: "server-tools",
          server: viewState.server
        });
        return null;
      }
      let t10;
      if ($[56] !== viewState.server) {
        t10 = () => setViewState({
          type: "server-tools",
          server: viewState.server
        });
        $[56] = viewState.server;
        $[57] = t10;
      } else {
        t10 = $[57];
      }
      let t11;
      if ($[58] !== t10 || $[59] !== tool || $[60] !== viewState.server) {
        t11 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(MCPToolDetailView, {
          tool,
          server: viewState.server,
          onBack: t10
        }, undefined, false, undefined, this);
        $[58] = t10;
        $[59] = tool;
        $[60] = viewState.server;
        $[61] = t11;
      } else {
        t11 = $[61];
      }
      return t11;
    }
    case "agent-server-menu": {
      let t9;
      if ($[62] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = () => setViewState({
          type: "list",
          defaultTab: "Agents"
        });
        $[62] = t9;
      } else {
        t9 = $[62];
      }
      let t10;
      if ($[63] !== onComplete || $[64] !== viewState.agentServer) {
        t10 = /* @__PURE__ */ jsx_dev_runtime4.jsxDEV(MCPAgentServerMenu, {
          agentServer: viewState.agentServer,
          onCancel: t9,
          onComplete
        }, undefined, false, undefined, this);
        $[63] = onComplete;
        $[64] = viewState.agentServer;
        $[65] = t10;
      } else {
        t10 = $[65];
      }
      return t10;
    }
  }
}
function _temp42(a, b) {
  return a.name.localeCompare(b.name);
}
function _temp32(client) {
  return client.name !== "ide";
}
function _temp22(s_0) {
  return s_0.agentDefinitions;
}
function _temp7(s) {
  return s.mcp;
}
var import_compiler_runtime3, import_react4, jsx_dev_runtime4;
var init_MCPSettings = __esm(() => {
  init_auth();
  init_utils();
  init_AppState();
  init_sessionIngressAuth();
  init_MCPAgentServerMenu();
  init_MCPListPanel();
  init_MCPRemoteServerMenu();
  init_MCPStdioServerMenu();
  init_MCPToolDetailView();
  init_MCPToolListView();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  import_react4 = __toESM(require_react(), 1);
  jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/mcp/index.ts
var init_mcp = __esm(() => {
  init_MCPAgentServerMenu();
  init_MCPListPanel();
  init_MCPReconnect();
  init_MCPRemoteServerMenu();
  init_MCPSettings();
  init_MCPStdioServerMenu();
  init_MCPToolDetailView();
  init_MCPToolListView();
});

// src/commands/mcp/mcp.tsx
function MCPToggle(t0) {
  const $ = import_compiler_runtime4.c(7);
  const {
    action,
    target,
    onComplete
  } = t0;
  const mcpClients = useAppState(_temp9);
  const toggleMcpServer = useMcpToggleEnabled();
  const didRun = import_react5.useRef(false);
  let t1;
  let t2;
  if ($[0] !== action || $[1] !== mcpClients || $[2] !== onComplete || $[3] !== target || $[4] !== toggleMcpServer) {
    t1 = () => {
      if (didRun.current) {
        return;
      }
      didRun.current = true;
      const isEnabling = action === "enable";
      const clients = mcpClients.filter(_temp23);
      const toToggle = target === "all" ? clients.filter((c_0) => isEnabling ? c_0.type === "disabled" : c_0.type !== "disabled") : clients.filter((c_1) => c_1.name === target);
      if (toToggle.length === 0) {
        onComplete(target === "all" ? `All MCP servers are already ${isEnabling ? "enabled" : "disabled"}` : `MCP server "${target}" not found`);
        return;
      }
      for (const s_0 of toToggle) {
        toggleMcpServer(s_0.name);
      }
      onComplete(target === "all" ? `${isEnabling ? "Enabled" : "Disabled"} ${toToggle.length} MCP server(s)` : `MCP server "${target}" ${isEnabling ? "enabled" : "disabled"}`);
    };
    t2 = [action, target, mcpClients, toggleMcpServer, onComplete];
    $[0] = action;
    $[1] = mcpClients;
    $[2] = onComplete;
    $[3] = target;
    $[4] = toggleMcpServer;
    $[5] = t1;
    $[6] = t2;
  } else {
    t1 = $[5];
    t2 = $[6];
  }
  import_react5.useEffect(t1, t2);
  return null;
}
function _temp23(c) {
  return c.name !== "ide";
}
function _temp9(s) {
  return s.mcp.clients;
}
async function call(onDone, _context, args) {
  if (args) {
    const parts = args.trim().split(/\s+/);
    if (parts[0] === "no-redirect") {
      return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(MCPSettings, {
        onComplete: onDone
      }, undefined, false, undefined, this);
    }
    if (parts[0] === "reconnect" && parts[1]) {
      return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(MCPReconnect, {
        serverName: parts.slice(1).join(" "),
        onComplete: onDone
      }, undefined, false, undefined, this);
    }
    if (parts[0] === "enable" || parts[0] === "disable") {
      return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(MCPToggle, {
        action: parts[0],
        target: parts.length > 1 ? parts.slice(1).join(" ") : "all",
        onComplete: onDone
      }, undefined, false, undefined, this);
    }
  }
  if (false) {}
  return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV(MCPSettings, {
    onComplete: onDone
  }, undefined, false, undefined, this);
}
var import_compiler_runtime4, import_react5, jsx_dev_runtime5;
var init_mcp2 = __esm(() => {
  init_mcp();
  init_MCPReconnect();
  init_MCPConnectionManager();
  init_AppState();
  init_PluginSettings();
  import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  import_react5 = __toESM(require_react(), 1);
  jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime(), 1);
});
init_mcp2();

export {
  call
};
