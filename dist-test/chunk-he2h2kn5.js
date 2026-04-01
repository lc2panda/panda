// @bun
import {
  StdioServerTransport,
  init_stdio
} from "./chunk-8p3gp3w1.js";
import {
  init_sink,
  initializeAnalyticsSink
} from "./chunk-1mh3217q.js";
import {
  createClaudeForChromeMcpServer,
  init_src
} from "./chunk-gyj242zr.js";
import {
  init_sideQuery,
  sideQuery
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import {
  init_datadog,
  shutdownDatadog
} from "./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-73qtc7a9.js";
import"./chunk-2gzv8nrw.js";
import {
  getAllSocketPaths,
  getSecureSocketPath,
  init_common
} from "./chunk-2e5y8sgq.js";
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
  enableConfigs,
  getClaudeAIOAuthTokens,
  getFeatureValue_CACHED_MAY_BE_STALE,
  getGlobalConfig,
  init_auth,
  init_config1 as init_config,
  init_firstPartyEventLogger,
  init_growthbook,
  saveGlobalConfig,
  shutdown1PEventLogging
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
import"./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-3r24h7t6.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/utils/claudeInChrome/mcpServer.ts
import { format } from "util";
function isPermissionMode(raw) {
  return PERMISSION_MODES.some((m) => m === raw);
}
function getChromeBridgeUrl() {
  const bridgeEnabled = process.env.USER_TYPE === "ant" || getFeatureValue_CACHED_MAY_BE_STALE("tengu_copper_bridge", false);
  if (!bridgeEnabled) {
    return;
  }
  if (isEnvTruthy(process.env.USE_LOCAL_OAUTH) || isEnvTruthy(process.env.LOCAL_BRIDGE)) {
    return "ws://localhost:8765";
  }
  if (isEnvTruthy(process.env.USE_STAGING_OAUTH)) {
    return "wss://bridge-staging.claudeusercontent.com";
  }
  return "wss://bridge.claudeusercontent.com";
}
function isLocalBridge() {
  return isEnvTruthy(process.env.USE_LOCAL_OAUTH) || isEnvTruthy(process.env.LOCAL_BRIDGE);
}
function createChromeContext(env) {
  const logger = new DebugLogger;
  const chromeBridgeUrl = getChromeBridgeUrl();
  logger.info(`Bridge URL: ${chromeBridgeUrl ?? "none (using native socket)"}`);
  const rawPermissionMode = env?.CLAUDE_CHROME_PERMISSION_MODE ?? process.env.CLAUDE_CHROME_PERMISSION_MODE;
  let initialPermissionMode;
  if (rawPermissionMode) {
    if (isPermissionMode(rawPermissionMode)) {
      initialPermissionMode = rawPermissionMode;
    } else {
      logger.warn(`Invalid CLAUDE_CHROME_PERMISSION_MODE "${rawPermissionMode}". Valid values: ${PERMISSION_MODES.join(", ")}`);
    }
  }
  return {
    serverName: "Claude in Chrome",
    logger,
    socketPath: getSecureSocketPath(),
    getSocketPaths: getAllSocketPaths,
    clientTypeId: "claude-code",
    onAuthenticationError: () => {
      logger.warn("Authentication error occurred. Please ensure you are logged into the Claude browser extension with the same claude.ai account as Panda Code.");
    },
    onToolCallDisconnected: () => {
      return `Browser extension is not connected. Please ensure the Claude browser extension is installed and running (${EXTENSION_DOWNLOAD_URL}), and that you are logged into claude.ai with the same account as Panda Code. If this is your first time connecting to Chrome, you may need to restart Chrome for the installation to take effect. If you continue to experience issues, please report a bug: ${BUG_REPORT_URL}`;
    },
    onExtensionPaired: (deviceId, name) => {
      saveGlobalConfig((config) => {
        if (config.chromeExtension?.pairedDeviceId === deviceId && config.chromeExtension?.pairedDeviceName === name) {
          return config;
        }
        return {
          ...config,
          chromeExtension: {
            pairedDeviceId: deviceId,
            pairedDeviceName: name
          }
        };
      });
      logger.info(`Paired with "${name}" (${deviceId.slice(0, 8)})`);
    },
    getPersistedDeviceId: () => {
      return getGlobalConfig().chromeExtension?.pairedDeviceId;
    },
    ...chromeBridgeUrl && {
      bridgeConfig: {
        url: chromeBridgeUrl,
        getUserId: async () => {
          return getGlobalConfig().oauthAccount?.accountUuid;
        },
        getOAuthToken: async () => {
          return getClaudeAIOAuthTokens()?.accessToken ?? "";
        },
        ...isLocalBridge() && { devUserId: "dev_user_local" }
      }
    },
    ...initialPermissionMode && { initialPermissionMode },
    ...process.env.USER_TYPE === "ant" && {
      callAnthropicMessages: async (req) => {
        const response = await sideQuery({
          model: req.model,
          system: req.system,
          messages: req.messages,
          max_tokens: req.max_tokens,
          stop_sequences: req.stop_sequences,
          signal: req.signal,
          skipSystemPromptPrefix: true,
          tools: [],
          querySource: "chrome_mcp"
        });
        const textBlocks = [];
        for (const b of response.content) {
          if (b.type === "text") {
            textBlocks.push({ type: "text", text: b.text });
          }
        }
        return {
          content: textBlocks,
          stop_reason: response.stop_reason,
          usage: {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens
          }
        };
      }
    },
    trackEvent: (eventName, metadata) => {
      const safeMetadata = {};
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          const safeKey = key === "status" ? "bridge_status" : key;
          if (typeof value === "boolean" || typeof value === "number") {
            safeMetadata[safeKey] = value;
          } else if (typeof value === "string" && SAFE_BRIDGE_STRING_KEYS.has(safeKey)) {
            safeMetadata[safeKey] = value;
          }
        }
      }
      logEvent(eventName, safeMetadata);
    }
  };
}
async function runClaudeInChromeMcpServer() {
  enableConfigs();
  initializeAnalyticsSink();
  const context = createChromeContext();
  const server = createClaudeForChromeMcpServer(context);
  const transport = new StdioServerTransport;
  let exiting = false;
  const shutdownAndExit = async () => {
    if (exiting) {
      return;
    }
    exiting = true;
    await shutdown1PEventLogging();
    await shutdownDatadog();
    process.exit(0);
  };
  process.stdin.on("end", () => void shutdownAndExit());
  process.stdin.on("error", () => void shutdownAndExit());
  logForDebugging("[Claude in Chrome] Starting MCP server");
  await server.connect(transport);
  logForDebugging("[Claude in Chrome] MCP server started");
}

class DebugLogger {
  silly(message, ...args) {
    logForDebugging(format(message, ...args), { level: "debug" });
  }
  debug(message, ...args) {
    logForDebugging(format(message, ...args), { level: "debug" });
  }
  info(message, ...args) {
    logForDebugging(format(message, ...args), { level: "info" });
  }
  warn(message, ...args) {
    logForDebugging(format(message, ...args), { level: "warn" });
  }
  error(message, ...args) {
    logForDebugging(format(message, ...args), { level: "error" });
  }
}
var EXTENSION_DOWNLOAD_URL = "https://claude.ai/chrome", BUG_REPORT_URL = "https://github.com/anthropics/claude-code/issues/new?labels=bug,claude-in-chrome", SAFE_BRIDGE_STRING_KEYS, PERMISSION_MODES;
var init_mcpServer = __esm(() => {
  init_src();
  init_stdio();
  init_datadog();
  init_firstPartyEventLogger();
  init_growthbook();
  init_analytics();
  init_sink();
  init_auth();
  init_config();
  init_debug();
  init_envUtils();
  init_sideQuery();
  init_common();
  SAFE_BRIDGE_STRING_KEYS = new Set([
    "bridge_status",
    "error_type",
    "tool_name"
  ]);
  PERMISSION_MODES = [
    "ask",
    "skip_all_permission_checks",
    "follow_a_plan"
  ];
});
init_mcpServer();

export {
  runClaudeInChromeMcpServer,
  createChromeContext
};
