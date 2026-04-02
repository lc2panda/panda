// @bun
import {
  init_channelNotification,
  init_omit,
  omit_default
} from "./chunk-1sdr4gt0.js";
import {
  PromptListChangedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  clearClaudeAIMcpConfigsCache,
  clearServerCache,
  commandBelongsToServer,
  dedupClaudeAiMcpServers,
  doesEnterpriseMcpConfigExist,
  excludeStalePluginClients,
  fetchClaudeAIMcpConfigsIfEligible,
  fetchCommandsForClient,
  fetchResourcesForClient,
  fetchToolsForClient,
  filterMcpServersByPolicy,
  getClaudeCodeMcpConfigs,
  getMcpToolsCommandsAndResources,
  init_AppState,
  init_claudeai,
  init_client,
  init_config,
  init_elicitationHandler,
  init_messageQueueManager,
  init_notifications,
  init_reject,
  init_types,
  init_utils,
  isMcpServerDisabled,
  reconnectMcpServerImpl,
  registerElicitationHandler,
  reject_default,
  setMcpServerEnabled,
  useAppState,
  useAppStateStore,
  useNotifications,
  useSetAppState
} from "./chunk-ekfe4t3x.js";
import {
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  getMcpPrefix,
  init_growthbook,
  init_mcpStringUtils
} from "./chunk-w5d5b7r0.js";
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
import {
  init_log,
  logMCPDebug,
  logMCPError
} from "./chunk-myphr2va.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  init_slowOperations,
  logForDebugging
} from "./chunk-cv4r43rj.js";
import {
  getSessionId,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/services/mcp/channelPermissions.ts
var init_channelPermissions = __esm(() => {
  init_slowOperations();
  init_growthbook();
});

// src/services/mcp/useManageMCPConnections.ts
import { basename } from "path";
function getErrorKey(error) {
  const plugin = "plugin" in error ? error.plugin : "no-plugin";
  return `${error.type}:${error.source}:${plugin}`;
}
function addErrorsToAppState(setAppState, newErrors) {
  if (newErrors.length === 0)
    return;
  setAppState((prevState) => {
    const existingKeys = new Set(prevState.plugins.errors.map((e) => getErrorKey(e)));
    const uniqueNewErrors = newErrors.filter((error) => !existingKeys.has(getErrorKey(error)));
    if (uniqueNewErrors.length === 0) {
      return prevState;
    }
    return {
      ...prevState,
      plugins: {
        ...prevState.plugins,
        errors: [...prevState.plugins.errors, ...uniqueNewErrors]
      }
    };
  });
}
function useManageMCPConnections(dynamicMcpConfig, isStrictMcpConfig = false) {
  const store = useAppStateStore();
  const _authVersion = useAppState((s) => s.authVersion);
  const _pluginReconnectKey = useAppState((s) => s.mcp.pluginReconnectKey);
  const setAppState = useSetAppState();
  const reconnectTimersRef = import_react.useRef(new Map);
  const channelWarnedKindsRef = import_react.useRef(new Set);
  const channelPermCallbacksRef = import_react.useRef(null);
  if (false) {}
  import_react.useEffect(() => {
    if (false) {}
  }, [setAppState]);
  const { addNotification } = useNotifications();
  const MCP_BATCH_FLUSH_MS = 16;
  const pendingUpdatesRef = import_react.useRef([]);
  const flushTimerRef = import_react.useRef(null);
  const flushPendingUpdates = import_react.useCallback(() => {
    flushTimerRef.current = null;
    const updates = pendingUpdatesRef.current;
    if (updates.length === 0)
      return;
    pendingUpdatesRef.current = [];
    setAppState((prevState) => {
      let mcp = prevState.mcp;
      for (const update of updates) {
        const {
          tools: rawTools,
          commands: rawCmds,
          resources: rawRes,
          ...client
        } = update;
        const tools = client.type === "disabled" || client.type === "failed" ? rawTools ?? [] : rawTools;
        const commands = client.type === "disabled" || client.type === "failed" ? rawCmds ?? [] : rawCmds;
        const resources = client.type === "disabled" || client.type === "failed" ? rawRes ?? [] : rawRes;
        const prefix = getMcpPrefix(client.name);
        const existingClientIndex = mcp.clients.findIndex((c) => c.name === client.name);
        const updatedClients = existingClientIndex === -1 ? [...mcp.clients, client] : mcp.clients.map((c) => c.name === client.name ? client : c);
        const updatedTools = tools === undefined ? mcp.tools : [...reject_default(mcp.tools, (t) => t.name?.startsWith(prefix)), ...tools];
        const updatedCommands = commands === undefined ? mcp.commands : [
          ...reject_default(mcp.commands, (c) => commandBelongsToServer(c, client.name)),
          ...commands
        ];
        const updatedResources = resources === undefined ? mcp.resources : {
          ...mcp.resources,
          ...resources.length > 0 ? { [client.name]: resources } : omit_default(mcp.resources, client.name)
        };
        mcp = {
          ...mcp,
          clients: updatedClients,
          tools: updatedTools,
          commands: updatedCommands,
          resources: updatedResources
        };
      }
      return { ...prevState, mcp };
    });
  }, [setAppState]);
  const updateServer = import_react.useCallback((update) => {
    pendingUpdatesRef.current.push(update);
    if (flushTimerRef.current === null) {
      flushTimerRef.current = setTimeout(flushPendingUpdates, MCP_BATCH_FLUSH_MS);
    }
  }, [flushPendingUpdates]);
  const onConnectionAttempt = import_react.useCallback(({
    client,
    tools,
    commands,
    resources
  }) => {
    updateServer({ ...client, tools, commands, resources });
    switch (client.type) {
      case "connected": {
        registerElicitationHandler(client.client, client.name, setAppState);
        client.client.onclose = () => {
          const configType = client.config.type ?? "stdio";
          clearServerCache(client.name, client.config).catch(() => {
            logForDebugging(`Failed to invalidate the server cache: ${client.name}`);
          });
          if (isMcpServerDisabled(client.name)) {
            logMCPDebug(client.name, `Server is disabled, skipping automatic reconnection`);
            return;
          }
          if (configType !== "stdio" && configType !== "sdk") {
            const transportType = getTransportDisplayName(configType);
            logMCPDebug(client.name, `${transportType} transport closed/disconnected, attempting automatic reconnection`);
            const existingTimer = reconnectTimersRef.current.get(client.name);
            if (existingTimer) {
              clearTimeout(existingTimer);
              reconnectTimersRef.current.delete(client.name);
            }
            const reconnectWithBackoff = async () => {
              for (let attempt = 1;attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
                if (isMcpServerDisabled(client.name)) {
                  logMCPDebug(client.name, `Server disabled during reconnection, stopping retry`);
                  reconnectTimersRef.current.delete(client.name);
                  return;
                }
                updateServer({
                  ...client,
                  type: "pending",
                  reconnectAttempt: attempt,
                  maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS
                });
                const reconnectStartTime = Date.now();
                try {
                  const result = await reconnectMcpServerImpl(client.name, client.config);
                  const elapsed = Date.now() - reconnectStartTime;
                  if (result.client.type === "connected") {
                    logMCPDebug(client.name, `${transportType} reconnection successful after ${elapsed}ms (attempt ${attempt})`);
                    reconnectTimersRef.current.delete(client.name);
                    onConnectionAttempt(result);
                    return;
                  }
                  logMCPDebug(client.name, `${transportType} reconnection attempt ${attempt} completed with status: ${result.client.type}`);
                  if (attempt === MAX_RECONNECT_ATTEMPTS) {
                    logMCPDebug(client.name, `Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached, giving up`);
                    reconnectTimersRef.current.delete(client.name);
                    onConnectionAttempt(result);
                    return;
                  }
                } catch (error) {
                  const elapsed = Date.now() - reconnectStartTime;
                  logMCPError(client.name, `${transportType} reconnection attempt ${attempt} failed after ${elapsed}ms: ${error}`);
                  if (attempt === MAX_RECONNECT_ATTEMPTS) {
                    logMCPDebug(client.name, `Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached, giving up`);
                    reconnectTimersRef.current.delete(client.name);
                    updateServer({ ...client, type: "failed" });
                    return;
                  }
                }
                const backoffMs = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
                logMCPDebug(client.name, `Scheduling reconnection attempt ${attempt + 1} in ${backoffMs}ms`);
                await new Promise((resolve) => {
                  const timer = setTimeout(resolve, backoffMs);
                  reconnectTimersRef.current.set(client.name, timer);
                });
              }
            };
            reconnectWithBackoff();
          } else {
            updateServer({ ...client, type: "failed" });
          }
        };
        if (false) {
          switch (gate.action) {
            case "register":
            case "skip":
          }
        }
        if (client.capabilities?.tools?.listChanged) {
          client.client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
            logMCPDebug(client.name, `Received tools/list_changed notification, refreshing tools`);
            try {
              const previousToolsPromise = fetchToolsForClient.cache.get(client.name);
              fetchToolsForClient.cache.delete(client.name);
              const newTools = await fetchToolsForClient(client);
              const newCount = newTools.length;
              if (previousToolsPromise) {
                previousToolsPromise.then((previousTools) => {
                  logEvent("tengu_mcp_list_changed", {
                    type: "tools",
                    previousCount: previousTools.length,
                    newCount
                  });
                }, () => {
                  logEvent("tengu_mcp_list_changed", {
                    type: "tools",
                    newCount
                  });
                });
              } else {
                logEvent("tengu_mcp_list_changed", {
                  type: "tools",
                  newCount
                });
              }
              updateServer({ ...client, tools: newTools });
            } catch (error) {
              logMCPError(client.name, `Failed to refresh tools after list_changed notification: ${errorMessage(error)}`);
            }
          });
        }
        if (client.capabilities?.prompts?.listChanged) {
          client.client.setNotificationHandler(PromptListChangedNotificationSchema, async () => {
            logMCPDebug(client.name, `Received prompts/list_changed notification, refreshing prompts`);
            logEvent("tengu_mcp_list_changed", {
              type: "prompts"
            });
            try {
              fetchCommandsForClient.cache.delete(client.name);
              const [mcpPrompts, mcpSkills] = await Promise.all([
                fetchCommandsForClient(client),
                Promise.resolve([])
              ]);
              updateServer({
                ...client,
                commands: [...mcpPrompts, ...mcpSkills]
              });
              clearSkillIndexCache?.();
            } catch (error) {
              logMCPError(client.name, `Failed to refresh prompts after list_changed notification: ${errorMessage(error)}`);
            }
          });
        }
        if (client.capabilities?.resources?.listChanged) {
          client.client.setNotificationHandler(ResourceListChangedNotificationSchema, async () => {
            logMCPDebug(client.name, `Received resources/list_changed notification, refreshing resources`);
            logEvent("tengu_mcp_list_changed", {
              type: "resources"
            });
            try {
              fetchResourcesForClient.cache.delete(client.name);
              if (false) {} else {
                const newResources = await fetchResourcesForClient(client);
                updateServer({ ...client, resources: newResources });
              }
            } catch (error) {
              logMCPError(client.name, `Failed to refresh resources after list_changed notification: ${errorMessage(error)}`);
            }
          });
        }
        break;
      }
      case "needs-auth":
      case "failed":
      case "pending":
      case "disabled":
        break;
    }
  }, [updateServer]);
  const sessionId = getSessionId();
  import_react.useEffect(() => {
    async function initializeServersAsPending() {
      const { servers: existingConfigs, errors: mcpErrors } = isStrictMcpConfig ? { servers: {}, errors: [] } : await getClaudeCodeMcpConfigs(dynamicMcpConfig);
      const configs = { ...existingConfigs, ...dynamicMcpConfig };
      addErrorsToAppState(setAppState, mcpErrors);
      setAppState((prevState) => {
        const { stale, ...mcpWithoutStale } = excludeStalePluginClients(prevState.mcp, configs);
        for (const s of stale) {
          const timer = reconnectTimersRef.current.get(s.name);
          if (timer) {
            clearTimeout(timer);
            reconnectTimersRef.current.delete(s.name);
          }
          if (s.type === "connected") {
            s.client.onclose = undefined;
            clearServerCache(s.name, s.config).catch(() => {});
          }
        }
        const existingServerNames = new Set(mcpWithoutStale.clients.map((c) => c.name));
        const newClients = Object.entries(configs).filter(([name]) => !existingServerNames.has(name)).map(([name, config]) => ({
          name,
          type: isMcpServerDisabled(name) ? "disabled" : "pending",
          config
        }));
        if (newClients.length === 0 && stale.length === 0) {
          return prevState;
        }
        return {
          ...prevState,
          mcp: {
            ...prevState.mcp,
            ...mcpWithoutStale,
            clients: [...mcpWithoutStale.clients, ...newClients]
          }
        };
      });
    }
    initializeServersAsPending().catch((error) => {
      logMCPError("useManageMCPConnections", `Failed to initialize servers as pending: ${errorMessage(error)}`);
    });
  }, [
    isStrictMcpConfig,
    dynamicMcpConfig,
    setAppState,
    sessionId,
    _pluginReconnectKey
  ]);
  import_react.useEffect(() => {
    let cancelled = false;
    async function loadAndConnectMcpConfigs() {
      let claudeaiPromise;
      if (isStrictMcpConfig || doesEnterpriseMcpConfigExist()) {
        claudeaiPromise = Promise.resolve({});
      } else {
        clearClaudeAIMcpConfigsCache();
        claudeaiPromise = fetchClaudeAIMcpConfigsIfEligible();
      }
      const { servers: claudeCodeConfigs, errors: mcpErrors } = isStrictMcpConfig ? { servers: {}, errors: [] } : await getClaudeCodeMcpConfigs(dynamicMcpConfig, claudeaiPromise);
      if (cancelled)
        return;
      addErrorsToAppState(setAppState, mcpErrors);
      const configs = { ...claudeCodeConfigs, ...dynamicMcpConfig };
      const enabledConfigs = Object.fromEntries(Object.entries(configs).filter(([name]) => !isMcpServerDisabled(name)));
      getMcpToolsCommandsAndResources(onConnectionAttempt, enabledConfigs).catch((error) => {
        logMCPError("useManageMcpConnections", `Failed to get MCP resources: ${errorMessage(error)}`);
      });
      let claudeaiConfigs = {};
      if (!isStrictMcpConfig) {
        claudeaiConfigs = filterMcpServersByPolicy(await claudeaiPromise).allowed;
        if (cancelled)
          return;
        if (Object.keys(claudeaiConfigs).length > 0) {
          const { servers: dedupedClaudeAi } = dedupClaudeAiMcpServers(claudeaiConfigs, configs);
          claudeaiConfigs = dedupedClaudeAi;
        }
        if (Object.keys(claudeaiConfigs).length > 0) {
          setAppState((prevState) => {
            const existingServerNames = new Set(prevState.mcp.clients.map((c) => c.name));
            const newClients = Object.entries(claudeaiConfigs).filter(([name]) => !existingServerNames.has(name)).map(([name, config]) => ({
              name,
              type: isMcpServerDisabled(name) ? "disabled" : "pending",
              config
            }));
            if (newClients.length === 0)
              return prevState;
            return {
              ...prevState,
              mcp: {
                ...prevState.mcp,
                clients: [...prevState.mcp.clients, ...newClients]
              }
            };
          });
          const enabledClaudeaiConfigs = Object.fromEntries(Object.entries(claudeaiConfigs).filter(([name]) => !isMcpServerDisabled(name)));
          getMcpToolsCommandsAndResources(onConnectionAttempt, enabledClaudeaiConfigs).catch((error) => {
            logMCPError("useManageMcpConnections", `Failed to get claude.ai MCP resources: ${errorMessage(error)}`);
          });
        }
      }
      const allConfigs = { ...configs, ...claudeaiConfigs };
      const counts = {
        enterprise: 0,
        global: 0,
        project: 0,
        user: 0,
        plugin: 0,
        claudeai: 0
      };
      const stdioCommands = [];
      for (const [name, serverConfig] of Object.entries(allConfigs)) {
        if (serverConfig.scope === "enterprise")
          counts.enterprise++;
        else if (serverConfig.scope === "user")
          counts.global++;
        else if (serverConfig.scope === "project")
          counts.project++;
        else if (serverConfig.scope === "local")
          counts.user++;
        else if (serverConfig.scope === "dynamic")
          counts.plugin++;
        else if (serverConfig.scope === "claudeai")
          counts.claudeai++;
        if (process.env.USER_TYPE === "ant" && !isMcpServerDisabled(name) && (serverConfig.type === undefined || serverConfig.type === "stdio") && "command" in serverConfig) {
          stdioCommands.push(basename(serverConfig.command));
        }
      }
      logEvent("tengu_mcp_servers", {
        ...counts,
        ...process.env.USER_TYPE === "ant" && stdioCommands.length > 0 ? {
          stdio_commands: stdioCommands.sort().join(",")
        } : {}
      });
    }
    loadAndConnectMcpConfigs();
    return () => {
      cancelled = true;
    };
  }, [
    isStrictMcpConfig,
    dynamicMcpConfig,
    onConnectionAttempt,
    setAppState,
    _authVersion,
    sessionId,
    _pluginReconnectKey
  ]);
  import_react.useEffect(() => {
    const timers = reconnectTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
        flushPendingUpdates();
      }
    };
  }, [flushPendingUpdates]);
  const reconnectMcpServer = import_react.useCallback(async (serverName) => {
    const client = store.getState().mcp.clients.find((c) => c.name === serverName);
    if (!client) {
      throw new Error(`MCP server ${serverName} not found`);
    }
    const existingTimer = reconnectTimersRef.current.get(serverName);
    if (existingTimer) {
      clearTimeout(existingTimer);
      reconnectTimersRef.current.delete(serverName);
    }
    const result = await reconnectMcpServerImpl(serverName, client.config);
    onConnectionAttempt(result);
    return result;
  }, [store, onConnectionAttempt]);
  const toggleMcpServer = import_react.useCallback(async (serverName) => {
    const client = store.getState().mcp.clients.find((c) => c.name === serverName);
    if (!client) {
      throw new Error(`MCP server ${serverName} not found`);
    }
    const isCurrentlyDisabled = client.type === "disabled";
    if (!isCurrentlyDisabled) {
      const existingTimer = reconnectTimersRef.current.get(serverName);
      if (existingTimer) {
        clearTimeout(existingTimer);
        reconnectTimersRef.current.delete(serverName);
      }
      setMcpServerEnabled(serverName, false);
      if (client.type === "connected") {
        await clearServerCache(serverName, client.config);
      }
      updateServer({
        name: serverName,
        type: "disabled",
        config: client.config
      });
    } else {
      setMcpServerEnabled(serverName, true);
      updateServer({
        name: serverName,
        type: "pending",
        config: client.config
      });
      const result = await reconnectMcpServerImpl(serverName, client.config);
      onConnectionAttempt(result);
    }
  }, [store, updateServer, onConnectionAttempt]);
  return { reconnectMcpServer, toggleMcpServer };
}
function getTransportDisplayName(type) {
  switch (type) {
    case "http":
      return "HTTP";
    case "ws":
    case "ws-ide":
      return "WebSocket";
    default:
      return "SSE";
  }
}
var import_react, clearSkillIndexCache = null, MAX_RECONNECT_ATTEMPTS = 5, INITIAL_BACKOFF_MS = 1000, MAX_BACKOFF_MS = 30000;
var init_useManageMCPConnections = __esm(() => {
  init_state();
  init_client();
  init_types();
  init_omit();
  init_reject();
  init_analytics();
  init_config();
  init_debug();
  init_state();
  init_notifications();
  init_AppState();
  init_errors();
  init_log();
  init_messageQueueManager();
  init_channelNotification();
  init_channelPermissions();
  init_claudeai();
  init_elicitationHandler();
  init_mcpStringUtils();
  init_utils();
  import_react = __toESM(require_react(), 1);
});

// src/services/mcp/MCPConnectionManager.tsx
function useMcpReconnect() {
  const context = import_react2.useContext(MCPConnectionContext);
  if (!context) {
    throw new Error("useMcpReconnect must be used within MCPConnectionManager");
  }
  return context.reconnectMcpServer;
}
function useMcpToggleEnabled() {
  const context = import_react2.useContext(MCPConnectionContext);
  if (!context) {
    throw new Error("useMcpToggleEnabled must be used within MCPConnectionManager");
  }
  return context.toggleMcpServer;
}
function MCPConnectionManager(t0) {
  const $ = import_compiler_runtime.c(6);
  const {
    children,
    dynamicMcpConfig,
    isStrictMcpConfig
  } = t0;
  const {
    reconnectMcpServer,
    toggleMcpServer
  } = useManageMCPConnections(dynamicMcpConfig, isStrictMcpConfig);
  let t1;
  if ($[0] !== reconnectMcpServer || $[1] !== toggleMcpServer) {
    t1 = {
      reconnectMcpServer,
      toggleMcpServer
    };
    $[0] = reconnectMcpServer;
    $[1] = toggleMcpServer;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const value = t1;
  let t2;
  if ($[3] !== children || $[4] !== value) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(MCPConnectionContext.Provider, {
      value,
      children
    }, undefined, false, undefined, this);
    $[3] = children;
    $[4] = value;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}
var import_compiler_runtime, import_react2, jsx_dev_runtime, MCPConnectionContext;
var init_MCPConnectionManager = __esm(() => {
  init_useManageMCPConnections();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react2 = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
  MCPConnectionContext = import_react2.createContext(null);
});

export { init_channelPermissions, useMcpReconnect, useMcpToggleEnabled, MCPConnectionManager, init_MCPConnectionManager };
