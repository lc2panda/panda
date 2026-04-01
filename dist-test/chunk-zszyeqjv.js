// @bun
import {
  init_sink,
  initializeAnalyticsSink
} from "./chunk-1mh3217q.js";
import {
  CACHE_PATHS,
  attachErrorLogSink,
  dateToFilename,
  init_cachePaths,
  init_log
} from "./chunk-43vdtd69.js";
import {
  createBufferedWriter,
  getFsImplementation,
  init_bufferedWriter,
  init_cleanupRegistry,
  init_debug,
  init_fsOperations,
  init_slowOperations,
  jsonStringify,
  logForDebugging,
  registerCleanup
} from "./chunk-71hncdva.js";
import {
  getSessionId,
  init_state
} from "./chunk-24stks7b.js";
import {
  axios_default,
  init_axios
} from "./chunk-xszk7n10.js";

// src/utils/sinks.ts
init_sink();

// src/utils/errorLogSink.ts
init_axios();
init_state();
init_bufferedWriter();
init_cachePaths();
init_cleanupRegistry();
init_debug();
init_fsOperations();
init_log();
init_slowOperations();
import { dirname, join } from "path";
var DATE = dateToFilename(new Date);
function getErrorsPath() {
  return join(CACHE_PATHS.errors(), DATE + ".jsonl");
}
function getMCPLogsPath(serverName) {
  return join(CACHE_PATHS.mcpLogs(serverName), DATE + ".jsonl");
}
function createJsonlWriter(options) {
  const writer = createBufferedWriter(options);
  return {
    write(obj) {
      writer.write(jsonStringify(obj) + `
`);
    },
    flush: writer.flush,
    dispose: writer.dispose
  };
}
var logWriters = new Map;
function getLogWriter(path) {
  let writer = logWriters.get(path);
  if (!writer) {
    const dir = dirname(path);
    writer = createJsonlWriter({
      writeFn: (content) => {
        try {
          getFsImplementation().appendFileSync(path, content);
        } catch {
          getFsImplementation().mkdirSync(dir);
          getFsImplementation().appendFileSync(path, content);
        }
      },
      flushIntervalMs: 1000,
      maxBufferSize: 50
    });
    logWriters.set(path, writer);
    registerCleanup(async () => writer?.dispose());
  }
  return writer;
}
function appendToLog(path, message) {
  if (process.env.USER_TYPE !== "ant") {
    return;
  }
  const messageWithTimestamp = {
    timestamp: new Date().toISOString(),
    ...message,
    cwd: getFsImplementation().cwd(),
    userType: process.env.USER_TYPE,
    sessionId: getSessionId(),
    version: MACRO.VERSION
  };
  getLogWriter(path).write(messageWithTimestamp);
}
function extractServerMessage(data) {
  if (typeof data === "string") {
    return data;
  }
  if (data && typeof data === "object") {
    const obj = data;
    if (typeof obj.message === "string") {
      return obj.message;
    }
    if (typeof obj.error === "object" && obj.error && "message" in obj.error && typeof obj.error.message === "string") {
      return obj.error.message;
    }
  }
  return;
}
function logErrorImpl(error) {
  const errorStr = error.stack || error.message;
  let context = "";
  if (axios_default.isAxiosError(error) && error.config?.url) {
    const parts = [`url=${error.config.url}`];
    if (error.response?.status !== undefined) {
      parts.push(`status=${error.response.status}`);
    }
    const serverMessage = extractServerMessage(error.response?.data);
    if (serverMessage) {
      parts.push(`body=${serverMessage}`);
    }
    context = `[${parts.join(",")}] `;
  }
  logForDebugging(`${error.name}: ${context}${errorStr}`, { level: "error" });
  appendToLog(getErrorsPath(), {
    error: `${context}${errorStr}`
  });
}
function logMCPErrorImpl(serverName, error) {
  logForDebugging(`MCP server "${serverName}" ${error}`, { level: "error" });
  const logFile = getMCPLogsPath(serverName);
  const errorStr = error instanceof Error ? error.stack || error.message : String(error);
  const errorInfo = {
    error: errorStr,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    cwd: getFsImplementation().cwd()
  };
  getLogWriter(logFile).write(errorInfo);
}
function logMCPDebugImpl(serverName, message) {
  logForDebugging(`MCP server "${serverName}": ${message}`);
  const logFile = getMCPLogsPath(serverName);
  const debugInfo = {
    debug: message,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    cwd: getFsImplementation().cwd()
  };
  getLogWriter(logFile).write(debugInfo);
}
function initializeErrorLogSink() {
  attachErrorLogSink({
    logError: logErrorImpl,
    logMCPError: logMCPErrorImpl,
    logMCPDebug: logMCPDebugImpl,
    getErrorsPath,
    getMCPLogsPath
  });
  logForDebugging("Error log sink initialized");
}

// src/utils/sinks.ts
function initSinks() {
  initializeErrorLogSink();
  initializeAnalyticsSink();
}

export { initSinks };
