// @bun
import {
  getSessionIngressAuthHeaders,
  getSessionIngressAuthToken,
  init_sessionActivity,
  init_sessionIngressAuth,
  registerSessionActivityCallback,
  unregisterSessionActivityCallback
} from "./chunk-yey6xqfs.js";
import {
  getClaudeCodeUserAgent,
  init_sleep,
  init_userAgent,
  sleep
} from "./chunk-bt6e264h.js";
import {
  createAxiosInstance,
  init_proxy
} from "./chunk-7gjw150h.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import {
  init_diagLogs,
  logForDiagnosticsNoPII
} from "./chunk-73q6p10n.js";
import {
  errorMessage,
  getErrnoCode,
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

// src/bridge/jwtUtils.ts
init_analytics();
init_debug();
init_diagLogs();
init_errors();
init_slowOperations();
function formatDuration(ms) {
  if (ms < 60000)
    return `${Math.round(ms / 1000)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round(ms % 60000 / 1000);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
function decodeJwtPayload(token) {
  const jwt = token.startsWith("sk-ant-si-") ? token.slice("sk-ant-si-".length) : token;
  const parts = jwt.split(".");
  if (parts.length !== 3 || !parts[1])
    return null;
  try {
    return jsonParse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
function decodeJwtExpiry(token) {
  const payload = decodeJwtPayload(token);
  if (payload !== null && typeof payload === "object" && "exp" in payload && typeof payload.exp === "number") {
    return payload.exp;
  }
  return null;
}
var TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
var FALLBACK_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
var MAX_REFRESH_FAILURES = 3;
var REFRESH_RETRY_DELAY_MS = 60000;
function createTokenRefreshScheduler({
  getAccessToken,
  onRefresh,
  label,
  refreshBufferMs = TOKEN_REFRESH_BUFFER_MS
}) {
  const timers = new Map;
  const failureCounts = new Map;
  const generations = new Map;
  function nextGeneration(sessionId) {
    const gen = (generations.get(sessionId) ?? 0) + 1;
    generations.set(sessionId, gen);
    return gen;
  }
  function schedule(sessionId, token) {
    const expiry = decodeJwtExpiry(token);
    if (!expiry) {
      logForDebugging(`[${label}:token] Could not decode JWT expiry for sessionId=${sessionId}, token prefix=${token.slice(0, 15)}\u2026, keeping existing timer`);
      return;
    }
    const existing = timers.get(sessionId);
    if (existing) {
      clearTimeout(existing);
    }
    const gen = nextGeneration(sessionId);
    const expiryDate = new Date(expiry * 1000).toISOString();
    const delayMs = expiry * 1000 - Date.now() - refreshBufferMs;
    if (delayMs <= 0) {
      logForDebugging(`[${label}:token] Token for sessionId=${sessionId} expires=${expiryDate} (past or within buffer), refreshing immediately`);
      doRefresh(sessionId, gen);
      return;
    }
    logForDebugging(`[${label}:token] Scheduled token refresh for sessionId=${sessionId} in ${formatDuration(delayMs)} (expires=${expiryDate}, buffer=${refreshBufferMs / 1000}s)`);
    const timer = setTimeout(doRefresh, delayMs, sessionId, gen);
    timers.set(sessionId, timer);
  }
  function scheduleFromExpiresIn(sessionId, expiresInSeconds) {
    const existing = timers.get(sessionId);
    if (existing)
      clearTimeout(existing);
    const gen = nextGeneration(sessionId);
    const delayMs = Math.max(expiresInSeconds * 1000 - refreshBufferMs, 30000);
    logForDebugging(`[${label}:token] Scheduled token refresh for sessionId=${sessionId} in ${formatDuration(delayMs)} (expires_in=${expiresInSeconds}s, buffer=${refreshBufferMs / 1000}s)`);
    const timer = setTimeout(doRefresh, delayMs, sessionId, gen);
    timers.set(sessionId, timer);
  }
  async function doRefresh(sessionId, gen) {
    let oauthToken;
    try {
      oauthToken = await getAccessToken();
    } catch (err) {
      logForDebugging(`[${label}:token] getAccessToken threw for sessionId=${sessionId}: ${errorMessage(err)}`, { level: "error" });
    }
    if (generations.get(sessionId) !== gen) {
      logForDebugging(`[${label}:token] doRefresh for sessionId=${sessionId} stale (gen ${gen} vs ${generations.get(sessionId)}), skipping`);
      return;
    }
    if (!oauthToken) {
      const failures = (failureCounts.get(sessionId) ?? 0) + 1;
      failureCounts.set(sessionId, failures);
      logForDebugging(`[${label}:token] No OAuth token available for refresh, sessionId=${sessionId} (failure ${failures}/${MAX_REFRESH_FAILURES})`, { level: "error" });
      logForDiagnosticsNoPII("error", "bridge_token_refresh_no_oauth");
      if (failures < MAX_REFRESH_FAILURES) {
        const retryTimer = setTimeout(doRefresh, REFRESH_RETRY_DELAY_MS, sessionId, gen);
        timers.set(sessionId, retryTimer);
      }
      return;
    }
    failureCounts.delete(sessionId);
    logForDebugging(`[${label}:token] Refreshing token for sessionId=${sessionId}: new token prefix=${oauthToken.slice(0, 15)}\u2026`);
    logEvent("tengu_bridge_token_refreshed", {});
    onRefresh(sessionId, oauthToken);
    const timer = setTimeout(doRefresh, FALLBACK_REFRESH_INTERVAL_MS, sessionId, gen);
    timers.set(sessionId, timer);
    logForDebugging(`[${label}:token] Scheduled follow-up refresh for sessionId=${sessionId} in ${formatDuration(FALLBACK_REFRESH_INTERVAL_MS)}`);
  }
  function cancel(sessionId) {
    nextGeneration(sessionId);
    const timer = timers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      timers.delete(sessionId);
    }
    failureCounts.delete(sessionId);
  }
  function cancelAll() {
    for (const sessionId of generations.keys()) {
      nextGeneration(sessionId);
    }
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
    failureCounts.clear();
  }
  return { schedule, scheduleFromExpiresIn, cancel, cancelAll };
}

// src/cli/transports/ccrClient.ts
import { randomUUID } from "crypto";
init_debug();
init_diagLogs();
init_errors();
init_proxy();
init_sessionActivity();
init_sessionIngressAuth();
init_sleep();
init_userAgent();

// src/cli/transports/SerialBatchEventUploader.ts
init_slowOperations();

class RetryableError extends Error {
  retryAfterMs;
  constructor(message, retryAfterMs) {
    super(message);
    this.retryAfterMs = retryAfterMs;
  }
}

class SerialBatchEventUploader {
  pending = [];
  pendingAtClose = 0;
  draining = false;
  closed = false;
  backpressureResolvers = [];
  sleepResolve = null;
  flushResolvers = [];
  droppedBatches = 0;
  config;
  constructor(config) {
    this.config = config;
  }
  get droppedBatchCount() {
    return this.droppedBatches;
  }
  get pendingCount() {
    return this.closed ? this.pendingAtClose : this.pending.length;
  }
  async enqueue(events) {
    if (this.closed)
      return;
    const items = Array.isArray(events) ? events : [events];
    if (items.length === 0)
      return;
    while (this.pending.length + items.length > this.config.maxQueueSize && !this.closed) {
      await new Promise((resolve) => {
        this.backpressureResolvers.push(resolve);
      });
    }
    if (this.closed)
      return;
    this.pending.push(...items);
    this.drain();
  }
  flush() {
    if (this.pending.length === 0 && !this.draining) {
      return Promise.resolve();
    }
    this.drain();
    return new Promise((resolve) => {
      this.flushResolvers.push(resolve);
    });
  }
  close() {
    if (this.closed)
      return;
    this.closed = true;
    this.pendingAtClose = this.pending.length;
    this.pending = [];
    this.sleepResolve?.();
    this.sleepResolve = null;
    for (const resolve of this.backpressureResolvers)
      resolve();
    this.backpressureResolvers = [];
    for (const resolve of this.flushResolvers)
      resolve();
    this.flushResolvers = [];
  }
  async drain() {
    if (this.draining || this.closed)
      return;
    this.draining = true;
    let failures = 0;
    try {
      while (this.pending.length > 0 && !this.closed) {
        const batch = this.takeBatch();
        if (batch.length === 0)
          continue;
        try {
          await this.config.send(batch);
          failures = 0;
        } catch (err) {
          failures++;
          if (this.config.maxConsecutiveFailures !== undefined && failures >= this.config.maxConsecutiveFailures) {
            this.droppedBatches++;
            this.config.onBatchDropped?.(batch.length, failures);
            failures = 0;
            this.releaseBackpressure();
            continue;
          }
          this.pending = batch.concat(this.pending);
          const retryAfterMs = err instanceof RetryableError ? err.retryAfterMs : undefined;
          await this.sleep(this.retryDelay(failures, retryAfterMs));
          continue;
        }
        this.releaseBackpressure();
      }
    } finally {
      this.draining = false;
      if (this.pending.length === 0) {
        for (const resolve of this.flushResolvers)
          resolve();
        this.flushResolvers = [];
      }
    }
  }
  takeBatch() {
    const { maxBatchSize, maxBatchBytes } = this.config;
    if (maxBatchBytes === undefined) {
      return this.pending.splice(0, maxBatchSize);
    }
    let bytes = 0;
    let count = 0;
    while (count < this.pending.length && count < maxBatchSize) {
      let itemBytes;
      try {
        itemBytes = Buffer.byteLength(jsonStringify(this.pending[count]));
      } catch {
        this.pending.splice(count, 1);
        continue;
      }
      if (count > 0 && bytes + itemBytes > maxBatchBytes)
        break;
      bytes += itemBytes;
      count++;
    }
    return this.pending.splice(0, count);
  }
  retryDelay(failures, retryAfterMs) {
    const jitter = Math.random() * this.config.jitterMs;
    if (retryAfterMs !== undefined) {
      const clamped = Math.max(this.config.baseDelayMs, Math.min(retryAfterMs, this.config.maxDelayMs));
      return clamped + jitter;
    }
    const exponential = Math.min(this.config.baseDelayMs * 2 ** (failures - 1), this.config.maxDelayMs);
    return exponential + jitter;
  }
  releaseBackpressure() {
    const resolvers = this.backpressureResolvers;
    this.backpressureResolvers = [];
    for (const resolve of resolvers)
      resolve();
  }
  sleep(ms) {
    return new Promise((resolve) => {
      this.sleepResolve = resolve;
      setTimeout((self, resolve2) => {
        self.sleepResolve = null;
        resolve2();
      }, ms, this, resolve);
    });
  }
}

// src/cli/transports/WorkerStateUploader.ts
init_sleep();

class WorkerStateUploader {
  inflight = null;
  pending = null;
  closed = false;
  config;
  constructor(config) {
    this.config = config;
  }
  enqueue(patch) {
    if (this.closed)
      return;
    this.pending = this.pending ? coalescePatches(this.pending, patch) : patch;
    this.drain();
  }
  close() {
    this.closed = true;
    this.pending = null;
  }
  async drain() {
    if (this.inflight || this.closed)
      return;
    if (!this.pending)
      return;
    const payload = this.pending;
    this.pending = null;
    this.inflight = this.sendWithRetry(payload).then(() => {
      this.inflight = null;
      if (this.pending && !this.closed) {
        this.drain();
      }
    });
  }
  async sendWithRetry(payload) {
    let current = payload;
    let failures = 0;
    while (!this.closed) {
      const ok = await this.config.send(current);
      if (ok)
        return;
      failures++;
      await sleep(this.retryDelay(failures));
      if (this.pending && !this.closed) {
        current = coalescePatches(current, this.pending);
        this.pending = null;
      }
    }
  }
  retryDelay(failures) {
    const exponential = Math.min(this.config.baseDelayMs * 2 ** (failures - 1), this.config.maxDelayMs);
    const jitter = Math.random() * this.config.jitterMs;
    return exponential + jitter;
  }
}
function coalescePatches(base, overlay) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if ((key === "external_metadata" || key === "internal_metadata") && merged[key] && typeof merged[key] === "object" && typeof value === "object" && value !== null) {
      merged[key] = {
        ...merged[key],
        ...value
      };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

// src/cli/transports/ccrClient.ts
var DEFAULT_HEARTBEAT_INTERVAL_MS = 20000;
var STREAM_EVENT_FLUSH_INTERVAL_MS = 100;
function alwaysValidStatus() {
  return true;
}

class CCRInitError extends Error {
  reason;
  constructor(reason) {
    super(`CCRClient init failed: ${reason}`);
    this.reason = reason;
  }
}
var MAX_CONSECUTIVE_AUTH_FAILURES = 10;
function createStreamAccumulator() {
  return { byMessage: new Map, scopeToMessage: new Map };
}
function scopeKey(m) {
  return `${m.session_id}:${m.parent_tool_use_id ?? ""}`;
}
function accumulateStreamEvents(buffer, state) {
  const out = [];
  const touched = new Map;
  for (const msg of buffer) {
    switch (msg.event.type) {
      case "message_start": {
        const id = msg.event.message.id;
        const prevId = state.scopeToMessage.get(scopeKey(msg));
        if (prevId)
          state.byMessage.delete(prevId);
        state.scopeToMessage.set(scopeKey(msg), id);
        state.byMessage.set(id, []);
        out.push(msg);
        break;
      }
      case "content_block_delta": {
        if (msg.event.delta.type !== "text_delta") {
          out.push(msg);
          break;
        }
        const messageId = state.scopeToMessage.get(scopeKey(msg));
        const blocks = messageId ? state.byMessage.get(messageId) : undefined;
        if (!blocks) {
          out.push(msg);
          break;
        }
        const chunks = blocks[msg.event.index] ??= [];
        chunks.push(msg.event.delta.text);
        const existing = touched.get(chunks);
        if (existing) {
          existing.event.delta.text = chunks.join("");
          break;
        }
        const snapshot = {
          type: "stream_event",
          uuid: msg.uuid,
          session_id: msg.session_id,
          parent_tool_use_id: msg.parent_tool_use_id,
          event: {
            type: "content_block_delta",
            index: msg.event.index,
            delta: { type: "text_delta", text: chunks.join("") }
          }
        };
        touched.set(chunks, snapshot);
        out.push(snapshot);
        break;
      }
      default:
        out.push(msg);
    }
  }
  return out;
}
function clearStreamAccumulatorForMessage(state, assistant) {
  state.byMessage.delete(assistant.message.id);
  const scope = scopeKey(assistant);
  if (state.scopeToMessage.get(scope) === assistant.message.id) {
    state.scopeToMessage.delete(scope);
  }
}

class CCRClient {
  workerEpoch = 0;
  heartbeatIntervalMs;
  heartbeatJitterFraction;
  heartbeatTimer = null;
  heartbeatInFlight = false;
  closed = false;
  consecutiveAuthFailures = 0;
  currentState = null;
  sessionBaseUrl;
  sessionId;
  http = createAxiosInstance({ keepAlive: true });
  streamEventBuffer = [];
  streamEventTimer = null;
  streamTextAccumulator = createStreamAccumulator();
  workerState;
  eventUploader;
  internalEventUploader;
  deliveryUploader;
  onEpochMismatch;
  getAuthHeaders;
  constructor(transport, sessionUrl, opts) {
    this.onEpochMismatch = opts?.onEpochMismatch ?? (() => {
      process.exit(1);
    });
    this.heartbeatIntervalMs = opts?.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
    this.heartbeatJitterFraction = opts?.heartbeatJitterFraction ?? 0;
    this.getAuthHeaders = opts?.getAuthHeaders ?? getSessionIngressAuthHeaders;
    if (sessionUrl.protocol !== "http:" && sessionUrl.protocol !== "https:") {
      throw new Error(`CCRClient: Expected http(s) URL, got ${sessionUrl.protocol}`);
    }
    const pathname = sessionUrl.pathname.replace(/\/$/, "");
    this.sessionBaseUrl = `${sessionUrl.protocol}//${sessionUrl.host}${pathname}`;
    this.sessionId = pathname.split("/").pop() || "";
    this.workerState = new WorkerStateUploader({
      send: (body) => this.request("put", "/worker", { worker_epoch: this.workerEpoch, ...body }, "PUT worker").then((r) => r.ok),
      baseDelayMs: 500,
      maxDelayMs: 30000,
      jitterMs: 500
    });
    this.eventUploader = new SerialBatchEventUploader({
      maxBatchSize: 100,
      maxBatchBytes: 10 * 1024 * 1024,
      maxQueueSize: 1e5,
      send: async (batch) => {
        const result = await this.request("post", "/worker/events", { worker_epoch: this.workerEpoch, events: batch }, "client events");
        if (!result.ok) {
          throw new RetryableError("client event POST failed", result.retryAfterMs);
        }
      },
      baseDelayMs: 500,
      maxDelayMs: 30000,
      jitterMs: 500
    });
    this.internalEventUploader = new SerialBatchEventUploader({
      maxBatchSize: 100,
      maxBatchBytes: 10 * 1024 * 1024,
      maxQueueSize: 200,
      send: async (batch) => {
        const result = await this.request("post", "/worker/internal-events", { worker_epoch: this.workerEpoch, events: batch }, "internal events");
        if (!result.ok) {
          throw new RetryableError("internal event POST failed", result.retryAfterMs);
        }
      },
      baseDelayMs: 500,
      maxDelayMs: 30000,
      jitterMs: 500
    });
    this.deliveryUploader = new SerialBatchEventUploader({
      maxBatchSize: 64,
      maxQueueSize: 64,
      send: async (batch) => {
        const result = await this.request("post", "/worker/events/delivery", {
          worker_epoch: this.workerEpoch,
          updates: batch.map((d) => ({
            event_id: d.eventId,
            status: d.status
          }))
        }, "delivery batch");
        if (!result.ok) {
          throw new RetryableError("delivery POST failed", result.retryAfterMs);
        }
      },
      baseDelayMs: 500,
      maxDelayMs: 30000,
      jitterMs: 500
    });
    transport.setOnEvent((event) => {
      this.reportDelivery(event.event_id, "received");
    });
  }
  async initialize(epoch) {
    const startMs = Date.now();
    if (Object.keys(this.getAuthHeaders()).length === 0) {
      throw new CCRInitError("no_auth_headers");
    }
    if (epoch === undefined) {
      const rawEpoch = process.env.CLAUDE_CODE_WORKER_EPOCH;
      epoch = rawEpoch ? parseInt(rawEpoch, 10) : NaN;
    }
    if (isNaN(epoch)) {
      throw new CCRInitError("missing_epoch");
    }
    this.workerEpoch = epoch;
    const restoredPromise = this.getWorkerState();
    const result = await this.request("put", "/worker", {
      worker_status: "idle",
      worker_epoch: this.workerEpoch,
      external_metadata: {
        pending_action: null,
        task_summary: null
      }
    }, "PUT worker (init)");
    if (!result.ok) {
      throw new CCRInitError("worker_register_failed");
    }
    this.currentState = "idle";
    this.startHeartbeat();
    registerSessionActivityCallback(() => {
      this.writeEvent({ type: "keep_alive" });
    });
    logForDebugging(`CCRClient: initialized, epoch=${this.workerEpoch}`);
    logForDiagnosticsNoPII("info", "cli_worker_lifecycle_initialized", {
      epoch: this.workerEpoch,
      duration_ms: Date.now() - startMs
    });
    const { metadata, durationMs } = await restoredPromise;
    if (!this.closed) {
      logForDiagnosticsNoPII("info", "cli_worker_state_restored", {
        duration_ms: durationMs,
        had_state: metadata !== null
      });
    }
    return metadata;
  }
  async getWorkerState() {
    const startMs = Date.now();
    const authHeaders = this.getAuthHeaders();
    if (Object.keys(authHeaders).length === 0) {
      return { metadata: null, durationMs: 0 };
    }
    const data = await this.getWithRetry(`${this.sessionBaseUrl}/worker`, authHeaders, "worker_state");
    return {
      metadata: data?.worker?.external_metadata ?? null,
      durationMs: Date.now() - startMs
    };
  }
  async request(method, path, body, label, { timeout = 1e4 } = {}) {
    const authHeaders = this.getAuthHeaders();
    if (Object.keys(authHeaders).length === 0)
      return { ok: false };
    try {
      const response = await this.http[method](`${this.sessionBaseUrl}${path}`, body, {
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "User-Agent": getClaudeCodeUserAgent()
        },
        validateStatus: alwaysValidStatus,
        timeout
      });
      if (response.status >= 200 && response.status < 300) {
        this.consecutiveAuthFailures = 0;
        return { ok: true };
      }
      if (response.status === 409) {
        this.handleEpochMismatch();
      }
      if (response.status === 401 || response.status === 403) {
        const tok = getSessionIngressAuthToken();
        const exp = tok ? decodeJwtExpiry(tok) : null;
        if (exp !== null && exp * 1000 < Date.now()) {
          logForDebugging(`CCRClient: session_token expired (exp=${new Date(exp * 1000).toISOString()}) \u2014 no refresh was delivered, exiting`, { level: "error" });
          logForDiagnosticsNoPII("error", "cli_worker_token_expired_no_refresh");
          this.onEpochMismatch();
        }
        this.consecutiveAuthFailures++;
        if (this.consecutiveAuthFailures >= MAX_CONSECUTIVE_AUTH_FAILURES) {
          logForDebugging(`CCRClient: ${this.consecutiveAuthFailures} consecutive auth failures with a valid-looking token \u2014 server-side auth unrecoverable, exiting`, { level: "error" });
          logForDiagnosticsNoPII("error", "cli_worker_auth_failures_exhausted");
          this.onEpochMismatch();
        }
      }
      logForDebugging(`CCRClient: ${label} returned ${response.status}`, {
        level: "warn"
      });
      logForDiagnosticsNoPII("warn", "cli_worker_request_failed", {
        method,
        path,
        status: response.status
      });
      if (response.status === 429) {
        const raw = response.headers?.["retry-after"];
        const seconds = typeof raw === "string" ? parseInt(raw, 10) : NaN;
        if (!isNaN(seconds) && seconds >= 0) {
          return { ok: false, retryAfterMs: seconds * 1000 };
        }
      }
      return { ok: false };
    } catch (error) {
      logForDebugging(`CCRClient: ${label} failed: ${errorMessage(error)}`, {
        level: "warn"
      });
      logForDiagnosticsNoPII("warn", "cli_worker_request_error", {
        method,
        path,
        error_code: getErrnoCode(error)
      });
      return { ok: false };
    }
  }
  reportState(state, details) {
    if (state === this.currentState && !details)
      return;
    this.currentState = state;
    this.workerState.enqueue({
      worker_status: state,
      requires_action_details: details ? {
        tool_name: details.tool_name,
        action_description: details.action_description,
        request_id: details.request_id
      } : null
    });
  }
  reportMetadata(metadata) {
    this.workerState.enqueue({ external_metadata: metadata });
  }
  handleEpochMismatch() {
    logForDebugging("CCRClient: Epoch mismatch (409), shutting down", {
      level: "error"
    });
    logForDiagnosticsNoPII("error", "cli_worker_epoch_mismatch");
    this.onEpochMismatch();
  }
  startHeartbeat() {
    this.stopHeartbeat();
    const schedule = () => {
      const jitter = this.heartbeatIntervalMs * this.heartbeatJitterFraction * (2 * Math.random() - 1);
      this.heartbeatTimer = setTimeout(tick, this.heartbeatIntervalMs + jitter);
    };
    const tick = () => {
      this.sendHeartbeat();
      if (this.heartbeatTimer === null)
        return;
      schedule();
    };
    schedule();
  }
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  async sendHeartbeat() {
    if (this.heartbeatInFlight)
      return;
    this.heartbeatInFlight = true;
    try {
      const result = await this.request("post", "/worker/heartbeat", { session_id: this.sessionId, worker_epoch: this.workerEpoch }, "Heartbeat", { timeout: 5000 });
      if (result.ok) {
        logForDebugging("CCRClient: Heartbeat sent");
      }
    } finally {
      this.heartbeatInFlight = false;
    }
  }
  async writeEvent(message) {
    if (message.type === "stream_event") {
      this.streamEventBuffer.push(message);
      if (!this.streamEventTimer) {
        this.streamEventTimer = setTimeout(() => void this.flushStreamEventBuffer(), STREAM_EVENT_FLUSH_INTERVAL_MS);
      }
      return;
    }
    await this.flushStreamEventBuffer();
    if (message.type === "assistant") {
      clearStreamAccumulatorForMessage(this.streamTextAccumulator, message);
    }
    await this.eventUploader.enqueue(this.toClientEvent(message));
  }
  toClientEvent(message) {
    const msg = message;
    return {
      payload: {
        ...msg,
        uuid: typeof msg.uuid === "string" ? msg.uuid : randomUUID()
      }
    };
  }
  async flushStreamEventBuffer() {
    if (this.streamEventTimer) {
      clearTimeout(this.streamEventTimer);
      this.streamEventTimer = null;
    }
    if (this.streamEventBuffer.length === 0)
      return;
    const buffered = this.streamEventBuffer;
    this.streamEventBuffer = [];
    const payloads = accumulateStreamEvents(buffered, this.streamTextAccumulator);
    await this.eventUploader.enqueue(payloads.map((payload) => ({ payload, ephemeral: true })));
  }
  async writeInternalEvent(eventType, payload, {
    isCompaction = false,
    agentId
  } = {}) {
    const event = {
      payload: {
        type: eventType,
        ...payload,
        uuid: typeof payload.uuid === "string" ? payload.uuid : randomUUID()
      },
      ...isCompaction && { is_compaction: true },
      ...agentId && { agent_id: agentId }
    };
    await this.internalEventUploader.enqueue(event);
  }
  flushInternalEvents() {
    return this.internalEventUploader.flush();
  }
  async flush() {
    await this.flushStreamEventBuffer();
    return this.eventUploader.flush();
  }
  async readInternalEvents() {
    return this.paginatedGet("/worker/internal-events", {}, "internal_events");
  }
  async readSubagentInternalEvents() {
    return this.paginatedGet("/worker/internal-events", { subagents: "true" }, "subagent_events");
  }
  async paginatedGet(path, params, context) {
    const authHeaders = this.getAuthHeaders();
    if (Object.keys(authHeaders).length === 0)
      return null;
    const allEvents = [];
    let cursor;
    do {
      const url = new URL(`${this.sessionBaseUrl}${path}`);
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }
      const page = await this.getWithRetry(url.toString(), authHeaders, context);
      if (!page)
        return null;
      allEvents.push(...page.data ?? []);
      cursor = page.next_cursor;
    } while (cursor);
    logForDebugging(`CCRClient: Read ${allEvents.length} internal events from ${path}${params.subagents ? " (subagents)" : ""}`);
    return allEvents;
  }
  async getWithRetry(url, authHeaders, context) {
    for (let attempt = 1;attempt <= 10; attempt++) {
      let response;
      try {
        response = await this.http.get(url, {
          headers: {
            ...authHeaders,
            "anthropic-version": "2023-06-01",
            "User-Agent": getClaudeCodeUserAgent()
          },
          validateStatus: alwaysValidStatus,
          timeout: 30000
        });
      } catch (error) {
        logForDebugging(`CCRClient: GET ${url} failed (attempt ${attempt}/10): ${errorMessage(error)}`, { level: "warn" });
        if (attempt < 10) {
          const delay = Math.min(500 * 2 ** (attempt - 1), 30000) + Math.random() * 500;
          await sleep(delay);
        }
        continue;
      }
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      }
      if (response.status === 409) {
        this.handleEpochMismatch();
      }
      logForDebugging(`CCRClient: GET ${url} returned ${response.status} (attempt ${attempt}/10)`, { level: "warn" });
      if (attempt < 10) {
        const delay = Math.min(500 * 2 ** (attempt - 1), 30000) + Math.random() * 500;
        await sleep(delay);
      }
    }
    logForDebugging("CCRClient: GET retries exhausted", { level: "error" });
    logForDiagnosticsNoPII("error", "cli_worker_get_retries_exhausted", {
      context
    });
    return null;
  }
  reportDelivery(eventId, status) {
    this.deliveryUploader.enqueue({ eventId, status });
  }
  getWorkerEpoch() {
    return this.workerEpoch;
  }
  get internalEventsPending() {
    return this.internalEventUploader.pendingCount;
  }
  close() {
    this.closed = true;
    this.stopHeartbeat();
    unregisterSessionActivityCallback();
    if (this.streamEventTimer) {
      clearTimeout(this.streamEventTimer);
      this.streamEventTimer = null;
    }
    this.streamEventBuffer = [];
    this.streamTextAccumulator.byMessage.clear();
    this.streamTextAccumulator.scopeToMessage.clear();
    this.workerState.close();
    this.eventUploader.close();
    this.internalEventUploader.close();
    this.deliveryUploader.close();
  }
}

// src/cli/transports/SSETransport.ts
init_axios();
init_debug();
init_diagLogs();
init_errors();
init_sessionIngressAuth();
init_sleep();
init_slowOperations();
init_userAgent();
var RECONNECT_BASE_DELAY_MS = 1000;
var RECONNECT_MAX_DELAY_MS = 30000;
var RECONNECT_GIVE_UP_MS = 600000;
var LIVENESS_TIMEOUT_MS = 45000;
var PERMANENT_HTTP_CODES = new Set([401, 403, 404]);
var POST_MAX_RETRIES = 10;
var POST_BASE_DELAY_MS = 500;
var POST_MAX_DELAY_MS = 8000;
var STREAM_DECODE_OPTS = { stream: true };
function alwaysValidStatus2() {
  return true;
}
function parseSSEFrames(buffer) {
  const frames = [];
  let pos = 0;
  let idx;
  while ((idx = buffer.indexOf(`

`, pos)) !== -1) {
    const rawFrame = buffer.slice(pos, idx);
    pos = idx + 2;
    if (!rawFrame.trim())
      continue;
    const frame = {};
    let isComment = false;
    for (const line of rawFrame.split(`
`)) {
      if (line.startsWith(":")) {
        isComment = true;
        continue;
      }
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1)
        continue;
      const field = line.slice(0, colonIdx);
      const value = line[colonIdx + 1] === " " ? line.slice(colonIdx + 2) : line.slice(colonIdx + 1);
      switch (field) {
        case "event":
          frame.event = value;
          break;
        case "id":
          frame.id = value;
          break;
        case "data":
          frame.data = frame.data ? frame.data + `
` + value : value;
          break;
      }
    }
    if (frame.data || isComment) {
      frames.push(frame);
    }
  }
  return { frames, remaining: buffer.slice(pos) };
}

class SSETransport {
  url;
  state = "idle";
  onData;
  onCloseCallback;
  onEventCallback;
  headers;
  sessionId;
  refreshHeaders;
  getAuthHeaders;
  abortController = null;
  lastSequenceNum = 0;
  seenSequenceNums = new Set;
  reconnectAttempts = 0;
  reconnectStartTime = null;
  reconnectTimer = null;
  livenessTimer = null;
  postUrl;
  constructor(url, headers = {}, sessionId, refreshHeaders, initialSequenceNum, getAuthHeaders) {
    this.url = url;
    this.headers = headers;
    this.sessionId = sessionId;
    this.refreshHeaders = refreshHeaders;
    this.getAuthHeaders = getAuthHeaders ?? getSessionIngressAuthHeaders;
    this.postUrl = convertSSEUrlToPostUrl(url);
    if (initialSequenceNum !== undefined && initialSequenceNum > 0) {
      this.lastSequenceNum = initialSequenceNum;
    }
    logForDebugging(`SSETransport: SSE URL = ${url.href}`);
    logForDebugging(`SSETransport: POST URL = ${this.postUrl}`);
    logForDiagnosticsNoPII("info", "cli_sse_transport_initialized");
  }
  getLastSequenceNum() {
    return this.lastSequenceNum;
  }
  async connect() {
    if (this.state !== "idle" && this.state !== "reconnecting") {
      logForDebugging(`SSETransport: Cannot connect, current state is ${this.state}`, { level: "error" });
      logForDiagnosticsNoPII("error", "cli_sse_connect_failed");
      return;
    }
    this.state = "reconnecting";
    const connectStartTime = Date.now();
    const sseUrl = new URL(this.url.href);
    if (this.lastSequenceNum > 0) {
      sseUrl.searchParams.set("from_sequence_num", String(this.lastSequenceNum));
    }
    const authHeaders = this.getAuthHeaders();
    const headers = {
      ...this.headers,
      ...authHeaders,
      Accept: "text/event-stream",
      "anthropic-version": "2023-06-01",
      "User-Agent": getClaudeCodeUserAgent()
    };
    if (authHeaders["Cookie"]) {
      delete headers["Authorization"];
    }
    if (this.lastSequenceNum > 0) {
      headers["Last-Event-ID"] = String(this.lastSequenceNum);
    }
    logForDebugging(`SSETransport: Opening ${sseUrl.href}`);
    logForDiagnosticsNoPII("info", "cli_sse_connect_opening");
    this.abortController = new AbortController;
    try {
      const response = await fetch(sseUrl.href, {
        headers,
        signal: this.abortController.signal
      });
      if (!response.ok) {
        const isPermanent = PERMANENT_HTTP_CODES.has(response.status);
        logForDebugging(`SSETransport: HTTP ${response.status}${isPermanent ? " (permanent)" : ""}`, { level: "error" });
        logForDiagnosticsNoPII("error", "cli_sse_connect_http_error", {
          status: response.status
        });
        if (isPermanent) {
          this.state = "closed";
          this.onCloseCallback?.(response.status);
          return;
        }
        this.handleConnectionError();
        return;
      }
      if (!response.body) {
        logForDebugging("SSETransport: No response body");
        this.handleConnectionError();
        return;
      }
      const connectDuration = Date.now() - connectStartTime;
      logForDebugging("SSETransport: Connected");
      logForDiagnosticsNoPII("info", "cli_sse_connect_connected", {
        duration_ms: connectDuration
      });
      this.state = "connected";
      this.reconnectAttempts = 0;
      this.reconnectStartTime = null;
      this.resetLivenessTimer();
      await this.readStream(response.body);
    } catch (error) {
      if (this.abortController?.signal.aborted) {
        return;
      }
      logForDebugging(`SSETransport: Connection error: ${errorMessage(error)}`, { level: "error" });
      logForDiagnosticsNoPII("error", "cli_sse_connect_error");
      this.handleConnectionError();
    }
  }
  async readStream(body) {
    const reader = body.getReader();
    const decoder = new TextDecoder;
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        buffer += decoder.decode(value, STREAM_DECODE_OPTS);
        const { frames, remaining } = parseSSEFrames(buffer);
        buffer = remaining;
        for (const frame of frames) {
          this.resetLivenessTimer();
          if (frame.id) {
            const seqNum = parseInt(frame.id, 10);
            if (!isNaN(seqNum)) {
              if (this.seenSequenceNums.has(seqNum)) {
                logForDebugging(`SSETransport: DUPLICATE frame seq=${seqNum} (lastSequenceNum=${this.lastSequenceNum}, seenCount=${this.seenSequenceNums.size})`, { level: "warn" });
                logForDiagnosticsNoPII("warn", "cli_sse_duplicate_sequence");
              } else {
                this.seenSequenceNums.add(seqNum);
                if (this.seenSequenceNums.size > 1000) {
                  const threshold = this.lastSequenceNum - 200;
                  for (const s of this.seenSequenceNums) {
                    if (s < threshold) {
                      this.seenSequenceNums.delete(s);
                    }
                  }
                }
              }
              if (seqNum > this.lastSequenceNum) {
                this.lastSequenceNum = seqNum;
              }
            }
          }
          if (frame.event && frame.data) {
            this.handleSSEFrame(frame.event, frame.data);
          } else if (frame.data) {
            logForDebugging("SSETransport: Frame has data: but no event: field \u2014 dropped", { level: "warn" });
            logForDiagnosticsNoPII("warn", "cli_sse_frame_missing_event_field");
          }
        }
      }
    } catch (error) {
      if (this.abortController?.signal.aborted)
        return;
      logForDebugging(`SSETransport: Stream read error: ${errorMessage(error)}`, { level: "error" });
      logForDiagnosticsNoPII("error", "cli_sse_stream_read_error");
    } finally {
      reader.releaseLock();
    }
    if (this.state !== "closing" && this.state !== "closed") {
      logForDebugging("SSETransport: Stream ended, reconnecting");
      this.handleConnectionError();
    }
  }
  handleSSEFrame(eventType, data) {
    if (eventType !== "client_event") {
      logForDebugging(`SSETransport: Unexpected SSE event type '${eventType}' on worker stream`, { level: "warn" });
      logForDiagnosticsNoPII("warn", "cli_sse_unexpected_event_type", {
        event_type: eventType
      });
      return;
    }
    let ev;
    try {
      ev = jsonParse(data);
    } catch (error) {
      logForDebugging(`SSETransport: Failed to parse client_event data: ${errorMessage(error)}`, { level: "error" });
      return;
    }
    const payload = ev.payload;
    if (payload && typeof payload === "object" && "type" in payload) {
      const sessionLabel = this.sessionId ? ` session=${this.sessionId}` : "";
      logForDebugging(`SSETransport: Event seq=${ev.sequence_num} event_id=${ev.event_id} event_type=${ev.event_type} payload_type=${String(payload.type)}${sessionLabel}`);
      logForDiagnosticsNoPII("info", "cli_sse_message_received");
      this.onData?.(jsonStringify(payload) + `
`);
    } else {
      logForDebugging(`SSETransport: Ignoring client_event with no type in payload: event_id=${ev.event_id}`);
    }
    this.onEventCallback?.(ev);
  }
  handleConnectionError() {
    this.clearLivenessTimer();
    if (this.state === "closing" || this.state === "closed")
      return;
    this.abortController?.abort();
    this.abortController = null;
    const now = Date.now();
    if (!this.reconnectStartTime) {
      this.reconnectStartTime = now;
    }
    const elapsed = now - this.reconnectStartTime;
    if (elapsed < RECONNECT_GIVE_UP_MS) {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.refreshHeaders) {
        const freshHeaders = this.refreshHeaders();
        Object.assign(this.headers, freshHeaders);
        logForDebugging("SSETransport: Refreshed headers for reconnect");
      }
      this.state = "reconnecting";
      this.reconnectAttempts++;
      const baseDelay = Math.min(RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1), RECONNECT_MAX_DELAY_MS);
      const delay = Math.max(0, baseDelay + baseDelay * 0.25 * (2 * Math.random() - 1));
      logForDebugging(`SSETransport: Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}, ${Math.round(elapsed / 1000)}s elapsed)`);
      logForDiagnosticsNoPII("error", "cli_sse_reconnect_attempt", {
        reconnectAttempts: this.reconnectAttempts
      });
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    } else {
      logForDebugging(`SSETransport: Reconnection time budget exhausted after ${Math.round(elapsed / 1000)}s`, { level: "error" });
      logForDiagnosticsNoPII("error", "cli_sse_reconnect_exhausted", {
        reconnectAttempts: this.reconnectAttempts,
        elapsedMs: elapsed
      });
      this.state = "closed";
      this.onCloseCallback?.();
    }
  }
  onLivenessTimeout = () => {
    this.livenessTimer = null;
    logForDebugging("SSETransport: Liveness timeout, reconnecting", {
      level: "error"
    });
    logForDiagnosticsNoPII("error", "cli_sse_liveness_timeout");
    this.abortController?.abort();
    this.handleConnectionError();
  };
  resetLivenessTimer() {
    this.clearLivenessTimer();
    this.livenessTimer = setTimeout(this.onLivenessTimeout, LIVENESS_TIMEOUT_MS);
  }
  clearLivenessTimer() {
    if (this.livenessTimer) {
      clearTimeout(this.livenessTimer);
      this.livenessTimer = null;
    }
  }
  async write(message) {
    const authHeaders = this.getAuthHeaders();
    if (Object.keys(authHeaders).length === 0) {
      logForDebugging("SSETransport: No session token available for POST");
      logForDiagnosticsNoPII("warn", "cli_sse_post_no_token");
      return;
    }
    const headers = {
      ...authHeaders,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "User-Agent": getClaudeCodeUserAgent()
    };
    logForDebugging(`SSETransport: POST body keys=${Object.keys(message).join(",")}`);
    for (let attempt = 1;attempt <= POST_MAX_RETRIES; attempt++) {
      try {
        const response = await axios_default.post(this.postUrl, message, {
          headers,
          validateStatus: alwaysValidStatus2
        });
        if (response.status === 200 || response.status === 201) {
          logForDebugging(`SSETransport: POST success type=${message.type}`);
          return;
        }
        logForDebugging(`SSETransport: POST ${response.status} body=${jsonStringify(response.data).slice(0, 200)}`);
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          logForDebugging(`SSETransport: POST returned ${response.status} (client error), not retrying`);
          logForDiagnosticsNoPII("warn", "cli_sse_post_client_error", {
            status: response.status
          });
          return;
        }
        logForDebugging(`SSETransport: POST returned ${response.status}, attempt ${attempt}/${POST_MAX_RETRIES}`);
        logForDiagnosticsNoPII("warn", "cli_sse_post_retryable_error", {
          status: response.status,
          attempt
        });
      } catch (error) {
        const axiosError = error;
        logForDebugging(`SSETransport: POST error: ${axiosError.message}, attempt ${attempt}/${POST_MAX_RETRIES}`);
        logForDiagnosticsNoPII("warn", "cli_sse_post_network_error", {
          attempt
        });
      }
      if (attempt === POST_MAX_RETRIES) {
        logForDebugging(`SSETransport: POST failed after ${POST_MAX_RETRIES} attempts, continuing`);
        logForDiagnosticsNoPII("warn", "cli_sse_post_retries_exhausted");
        return;
      }
      const delayMs = Math.min(POST_BASE_DELAY_MS * Math.pow(2, attempt - 1), POST_MAX_DELAY_MS);
      await sleep(delayMs);
    }
  }
  isConnectedStatus() {
    return this.state === "connected";
  }
  isClosedStatus() {
    return this.state === "closed";
  }
  setOnData(callback) {
    this.onData = callback;
  }
  setOnClose(callback) {
    this.onCloseCallback = callback;
  }
  setOnEvent(callback) {
    this.onEventCallback = callback;
  }
  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearLivenessTimer();
    this.state = "closing";
    this.abortController?.abort();
    this.abortController = null;
  }
}
function convertSSEUrlToPostUrl(sseUrl) {
  let pathname = sseUrl.pathname;
  if (pathname.endsWith("/stream")) {
    pathname = pathname.slice(0, -"/stream".length);
  }
  return `${sseUrl.protocol}//${sseUrl.host}${pathname}`;
}

export { createTokenRefreshScheduler, SerialBatchEventUploader, CCRInitError, CCRClient, SSETransport };
