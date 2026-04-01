// @bun
import {
  CCRClient,
  SSETransport
} from "./chunk-p3x1ev9n.js";
import {
  init_bridgeEnabled
} from "./chunk-1h6wzzqp.js";
import {
  init_sessionIngressAuth,
  updateSessionIngressAuthToken
} from "./chunk-yey6xqfs.js";
import {
  init_semver,
  lt
} from "./chunk-ps49ymvj.js";
import {
  getFeatureValue_DEPRECATED,
  init_growthbook
} from "./chunk-bt6e264h.js";
import {
  init_v4
} from "./chunk-g0j0t6qk.js";
import {
  exports_external,
  init_lazySchema,
  lazySchema
} from "./chunk-55wgxwa9.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  init_slowOperations,
  jsonParse,
  jsonStringify,
  logForDebugging
} from "./chunk-71hncdva.js";
import {
  axios_default,
  init_axios
} from "./chunk-xszk7n10.js";

// src/bridge/envLessBridgeConfig.ts
init_v4();
init_growthbook();
init_lazySchema();
init_semver();
init_bridgeEnabled();
var DEFAULT_ENV_LESS_BRIDGE_CONFIG = {
  init_retry_max_attempts: 3,
  init_retry_base_delay_ms: 500,
  init_retry_jitter_fraction: 0.25,
  init_retry_max_delay_ms: 4000,
  http_timeout_ms: 1e4,
  uuid_dedup_buffer_size: 2000,
  heartbeat_interval_ms: 20000,
  heartbeat_jitter_fraction: 0.1,
  token_refresh_buffer_ms: 300000,
  teardown_archive_timeout_ms: 1500,
  connect_timeout_ms: 15000,
  min_version: "0.0.0",
  should_show_app_upgrade_message: false
};
var envLessBridgeConfigSchema = lazySchema(() => exports_external.object({
  init_retry_max_attempts: exports_external.number().int().min(1).max(10).default(3),
  init_retry_base_delay_ms: exports_external.number().int().min(100).default(500),
  init_retry_jitter_fraction: exports_external.number().min(0).max(1).default(0.25),
  init_retry_max_delay_ms: exports_external.number().int().min(500).default(4000),
  http_timeout_ms: exports_external.number().int().min(2000).default(1e4),
  uuid_dedup_buffer_size: exports_external.number().int().min(100).max(50000).default(2000),
  heartbeat_interval_ms: exports_external.number().int().min(5000).max(30000).default(20000),
  heartbeat_jitter_fraction: exports_external.number().min(0).max(0.5).default(0.1),
  token_refresh_buffer_ms: exports_external.number().int().min(30000).max(1800000).default(300000),
  teardown_archive_timeout_ms: exports_external.number().int().min(500).max(2000).default(1500),
  connect_timeout_ms: exports_external.number().int().min(5000).max(60000).default(15000),
  min_version: exports_external.string().refine((v) => {
    try {
      lt(v, "0.0.0");
      return true;
    } catch {
      return false;
    }
  }).default("0.0.0"),
  should_show_app_upgrade_message: exports_external.boolean().default(false)
}));
async function getEnvLessBridgeConfig() {
  const raw = await getFeatureValue_DEPRECATED("tengu_bridge_repl_v2_config", DEFAULT_ENV_LESS_BRIDGE_CONFIG);
  const parsed = envLessBridgeConfigSchema().safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_ENV_LESS_BRIDGE_CONFIG;
}
async function checkEnvLessBridgeMinVersion() {
  const cfg = await getEnvLessBridgeConfig();
  if (cfg.min_version && lt(MACRO.VERSION, cfg.min_version)) {
    return `Your version of Panda Code (${MACRO.VERSION}) is too old for Remote Control.
Version ${cfg.min_version} or higher is required. Run \`claude update\` to update.`;
  }
  return null;
}

// src/bridge/workSecret.ts
init_axios();
init_slowOperations();
function decodeWorkSecret(secret) {
  const json = Buffer.from(secret, "base64url").toString("utf-8");
  const parsed = jsonParse(json);
  if (!parsed || typeof parsed !== "object" || !("version" in parsed) || parsed.version !== 1) {
    throw new Error(`Unsupported work secret version: ${parsed && typeof parsed === "object" && "version" in parsed ? parsed.version : "unknown"}`);
  }
  const obj = parsed;
  if (typeof obj.session_ingress_token !== "string" || obj.session_ingress_token.length === 0) {
    throw new Error("Invalid work secret: missing or empty session_ingress_token");
  }
  if (typeof obj.api_base_url !== "string") {
    throw new Error("Invalid work secret: missing api_base_url");
  }
  return parsed;
}
function buildSdkUrl(apiBaseUrl, sessionId) {
  const isLocalhost = apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1");
  const protocol = isLocalhost ? "ws" : "wss";
  const version = isLocalhost ? "v2" : "v1";
  const host = apiBaseUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `${protocol}://${host}/${version}/session_ingress/ws/${sessionId}`;
}
function sameSessionId(a, b) {
  if (a === b)
    return true;
  const aBody = a.slice(a.lastIndexOf("_") + 1);
  const bBody = b.slice(b.lastIndexOf("_") + 1);
  return aBody.length >= 4 && aBody === bBody;
}
function buildCCRv2SdkUrl(apiBaseUrl, sessionId) {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/v1/code/sessions/${sessionId}`;
}
async function registerWorker(sessionUrl, accessToken) {
  const response = await axios_default.post(`${sessionUrl}/worker/register`, {}, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01"
    },
    timeout: 1e4
  });
  const raw = response.data?.worker_epoch;
  const epoch = typeof raw === "string" ? Number(raw) : raw;
  if (typeof epoch !== "number" || !Number.isFinite(epoch) || !Number.isSafeInteger(epoch)) {
    throw new Error(`registerWorker: invalid worker_epoch in response: ${jsonStringify(response.data)}`);
  }
  return epoch;
}

// src/bridge/replBridgeTransport.ts
init_debug();
init_errors();
init_sessionIngressAuth();
function createV1ReplTransport(hybrid) {
  return {
    write: (msg) => hybrid.write(msg),
    writeBatch: (msgs) => hybrid.writeBatch(msgs),
    close: () => hybrid.close(),
    isConnectedStatus: () => hybrid.isConnectedStatus(),
    getStateLabel: () => hybrid.getStateLabel(),
    setOnData: (cb) => hybrid.setOnData(cb),
    setOnClose: (cb) => hybrid.setOnClose(cb),
    setOnConnect: (cb) => hybrid.setOnConnect(cb),
    connect: () => void hybrid.connect(),
    getLastSequenceNum: () => 0,
    get droppedBatchCount() {
      return hybrid.droppedBatchCount;
    },
    reportState: () => {},
    reportMetadata: () => {},
    reportDelivery: () => {},
    flush: () => Promise.resolve()
  };
}
async function createV2ReplTransport(opts) {
  const {
    sessionUrl,
    ingressToken,
    sessionId,
    initialSequenceNum,
    getAuthToken
  } = opts;
  let getAuthHeaders;
  if (getAuthToken) {
    getAuthHeaders = () => {
      const token = getAuthToken();
      if (!token)
        return {};
      return { Authorization: `Bearer ${token}` };
    };
  } else {
    updateSessionIngressAuthToken(ingressToken);
  }
  const epoch = opts.epoch ?? await registerWorker(sessionUrl, ingressToken);
  logForDebugging(`[bridge:repl] CCR v2: worker sessionId=${sessionId} epoch=${epoch}${opts.epoch !== undefined ? " (from /bridge)" : " (via registerWorker)"}`);
  const sseUrl = new URL(sessionUrl);
  sseUrl.pathname = sseUrl.pathname.replace(/\/$/, "") + "/worker/events/stream";
  const sse = new SSETransport(sseUrl, {}, sessionId, undefined, initialSequenceNum, getAuthHeaders);
  let onCloseCb;
  const ccr = new CCRClient(sse, new URL(sessionUrl), {
    getAuthHeaders,
    heartbeatIntervalMs: opts.heartbeatIntervalMs,
    heartbeatJitterFraction: opts.heartbeatJitterFraction,
    onEpochMismatch: () => {
      logForDebugging("[bridge:repl] CCR v2: epoch superseded (409) \u2014 closing for poll-loop recovery");
      try {
        ccr.close();
        sse.close();
        onCloseCb?.(4090);
      } catch (closeErr) {
        logForDebugging(`[bridge:repl] CCR v2: error during epoch-mismatch cleanup: ${errorMessage(closeErr)}`, { level: "error" });
      }
      throw new Error("epoch superseded");
    }
  });
  sse.setOnEvent((event) => {
    ccr.reportDelivery(event.event_id, "received");
    ccr.reportDelivery(event.event_id, "processed");
  });
  let onConnectCb;
  let ccrInitialized = false;
  let closed = false;
  return {
    write(msg) {
      return ccr.writeEvent(msg);
    },
    async writeBatch(msgs) {
      for (const m of msgs) {
        if (closed)
          break;
        await ccr.writeEvent(m);
      }
    },
    close() {
      closed = true;
      ccr.close();
      sse.close();
    },
    isConnectedStatus() {
      return ccrInitialized;
    },
    getStateLabel() {
      if (sse.isClosedStatus())
        return "closed";
      if (sse.isConnectedStatus())
        return ccrInitialized ? "connected" : "init";
      return "connecting";
    },
    setOnData(cb) {
      sse.setOnData(cb);
    },
    setOnClose(cb) {
      onCloseCb = cb;
      sse.setOnClose((code) => {
        ccr.close();
        cb(code ?? 4092);
      });
    },
    setOnConnect(cb) {
      onConnectCb = cb;
    },
    getLastSequenceNum() {
      return sse.getLastSequenceNum();
    },
    droppedBatchCount: 0,
    reportState(state) {
      ccr.reportState(state);
    },
    reportMetadata(metadata) {
      ccr.reportMetadata(metadata);
    },
    reportDelivery(eventId, status) {
      ccr.reportDelivery(eventId, status);
    },
    flush() {
      return ccr.flush();
    },
    connect() {
      if (!opts.outboundOnly) {
        sse.connect();
      }
      ccr.initialize(epoch).then(() => {
        ccrInitialized = true;
        logForDebugging(`[bridge:repl] v2 transport ready for writes (epoch=${epoch}, sse=${sse.isConnectedStatus() ? "open" : "opening"})`);
        onConnectCb?.();
      }, (err) => {
        logForDebugging(`[bridge:repl] CCR v2 initialize failed: ${errorMessage(err)}`, { level: "error" });
        ccr.close();
        sse.close();
        onCloseCb?.(4091);
      });
    }
  };
}

// src/bridge/flushGate.ts
class FlushGate {
  _active = false;
  _pending = [];
  get active() {
    return this._active;
  }
  get pendingCount() {
    return this._pending.length;
  }
  start() {
    this._active = true;
  }
  end() {
    this._active = false;
    return this._pending.splice(0);
  }
  enqueue(...items) {
    if (!this._active)
      return false;
    this._pending.push(...items);
    return true;
  }
  drop() {
    this._active = false;
    const count = this._pending.length;
    this._pending.length = 0;
    return count;
  }
  deactivate() {
    this._active = false;
  }
}

export { getEnvLessBridgeConfig, checkEnvLessBridgeMinVersion, decodeWorkSecret, buildSdkUrl, sameSessionId, buildCCRv2SdkUrl, createV1ReplTransport, createV2ReplTransport, FlushGate };
