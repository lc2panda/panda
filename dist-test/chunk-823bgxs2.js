// @bun
import {
  require_src as require_src5
} from "./chunk-a8ejc632.js";
import {
  endInteractionSpan,
  init_betaSessionTracing,
  init_perfettoTracing,
  init_sessionTracing,
  initializePerfettoTracing,
  isBetaTracingEnabled,
  isEnhancedTelemetryEnabled
} from "./chunk-g8nemwxs.js";
import {
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter,
  LoggerProvider,
  checkHasTrustDialogAccepted,
  getAuthHeaders,
  getClaudeCodeUserAgent,
  getGlobalConfig,
  getOtelHeadersFromHelper,
  getSettings_DEPRECATED,
  getSubscriptionType,
  hasProfileScope,
  init_auth,
  init_config1 as init_config,
  init_esm,
  init_esm1 as init_esm2,
  init_http,
  init_settings1 as init_settings,
  init_userAgent,
  is1PApiCustomer,
  isClaudeAISubscriber,
  logs,
  saveGlobalConfig,
  withOAuth401Retry
} from "./chunk-bt6e264h.js";
import"./chunk-y9h5c3hn.js";
import"./chunk-7rxmkr8t.js";
import"./chunk-vratq94g.js";
import {
  HttpsProxyAgent,
  getCACertificates,
  getMTLSConfig,
  getProxyUrl,
  init_caCerts,
  init_dist,
  init_mtls,
  init_proxy,
  shouldBypassProxy
} from "./chunk-7gjw150h.js";
import"./chunk-0e1xsncc.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import {
  getPlatform,
  getWslVersion,
  init_platform
} from "./chunk-m859hz3m.js";
import"./chunk-55wgxwa9.js";
import"./chunk-zfp09a4r.js";
import"./chunk-7ymfj7m3.js";
import {
  require_src as require_src2,
  require_src1 as require_src3,
  require_src2 as require_src4
} from "./chunk-f5ma3nh5.js";
import {
  require_src
} from "./chunk-p2816w9z.js";
import"./chunk-v1kzp02e.js";
import {
  init_startupProfiler,
  profileCheckpoint
} from "./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import"./chunk-h0rbjg6x.js";
import"./chunk-73q6p10n.js";
import {
  init_memoize,
  memoizeWithTTLAsync
} from "./chunk-8qg6qavk.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-14j8jv5j.js";
import"./chunk-0xqnccz6.js";
import"./chunk-nahdbxge.js";
import {
  init_log,
  init_privacyLevel,
  isEssentialTrafficOnly,
  logError
} from "./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  errorMessage,
  getHasFormattedOutput,
  init_cleanupRegistry,
  init_debug,
  init_errors,
  init_slowOperations,
  jsonStringify,
  logForDebugging,
  registerCleanup,
  toError
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-3r24h7t6.js";
import {
  getIsNonInteractiveSession,
  getLoggerProvider,
  getMeterProvider,
  getTracerProvider,
  init_state,
  setEventLogger,
  setLoggerProvider,
  setMeterProvider,
  setTracerProvider
} from "./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import {
  axios_default,
  init_axios
} from "./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm,
  __require,
  __toESM
} from "./chunk-qp2qdcda.js";

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/enums.js
var ExceptionEventName = "exception";
var init_enums = () => {};

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/Span.js
class SpanImpl {
  _spanContext;
  kind;
  parentSpanContext;
  attributes = {};
  links = [];
  events = [];
  startTime;
  resource;
  instrumentationScope;
  _droppedAttributesCount = 0;
  _droppedEventsCount = 0;
  _droppedLinksCount = 0;
  _attributesCount = 0;
  name;
  status = {
    code: import_api.SpanStatusCode.UNSET
  };
  endTime = [0, 0];
  _ended = false;
  _duration = [-1, -1];
  _spanProcessor;
  _spanLimits;
  _attributeValueLengthLimit;
  _recordEndMetrics;
  _performanceStartTime;
  _performanceOffset;
  _startTimeProvided;
  constructor(opts) {
    const now = Date.now();
    this._spanContext = opts.spanContext;
    this._performanceStartTime = import_core.otperformance.now();
    this._performanceOffset = now - (this._performanceStartTime + import_core.otperformance.timeOrigin);
    this._startTimeProvided = opts.startTime != null;
    this._spanLimits = opts.spanLimits;
    this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit ?? 0;
    this._spanProcessor = opts.spanProcessor;
    this.name = opts.name;
    this.parentSpanContext = opts.parentSpanContext;
    this.kind = opts.kind;
    if (opts.links) {
      for (const link of opts.links) {
        this.addLink(link);
      }
    }
    this.startTime = this._getTime(opts.startTime ?? now);
    this.resource = opts.resource;
    this.instrumentationScope = opts.scope;
    this._recordEndMetrics = opts.recordEndMetrics;
    if (opts.attributes != null) {
      this.setAttributes(opts.attributes);
    }
    this._spanProcessor.onStart(this, opts.context);
  }
  spanContext() {
    return this._spanContext;
  }
  setAttribute(key, value) {
    if (value == null || this._isSpanEnded())
      return this;
    if (key.length === 0) {
      import_api.diag.warn(`Invalid attribute key: ${key}`);
      return this;
    }
    if (!import_core.isAttributeValue(value)) {
      import_api.diag.warn(`Invalid attribute value set for key: ${key}`);
      return this;
    }
    const { attributeCountLimit } = this._spanLimits;
    const isNewKey = !Object.prototype.hasOwnProperty.call(this.attributes, key);
    if (attributeCountLimit !== undefined && this._attributesCount >= attributeCountLimit && isNewKey) {
      this._droppedAttributesCount++;
      return this;
    }
    this.attributes[key] = this._truncateToSize(value);
    if (isNewKey) {
      this._attributesCount++;
    }
    return this;
  }
  setAttributes(attributes) {
    for (const key in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, key)) {
        this.setAttribute(key, attributes[key]);
      }
    }
    return this;
  }
  addEvent(name, attributesOrStartTime, timeStamp) {
    if (this._isSpanEnded())
      return this;
    const { eventCountLimit } = this._spanLimits;
    if (eventCountLimit === 0) {
      import_api.diag.warn("No events allowed.");
      this._droppedEventsCount++;
      return this;
    }
    if (eventCountLimit !== undefined && this.events.length >= eventCountLimit) {
      if (this._droppedEventsCount === 0) {
        import_api.diag.debug("Dropping extra events.");
      }
      this.events.shift();
      this._droppedEventsCount++;
    }
    if (import_core.isTimeInput(attributesOrStartTime)) {
      if (!import_core.isTimeInput(timeStamp)) {
        timeStamp = attributesOrStartTime;
      }
      attributesOrStartTime = undefined;
    }
    const sanitized = import_core.sanitizeAttributes(attributesOrStartTime);
    const { attributePerEventCountLimit } = this._spanLimits;
    const attributes = {};
    let droppedAttributesCount = 0;
    let eventAttributesCount = 0;
    for (const attr in sanitized) {
      if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) {
        continue;
      }
      const attrVal = sanitized[attr];
      if (attributePerEventCountLimit !== undefined && eventAttributesCount >= attributePerEventCountLimit) {
        droppedAttributesCount++;
        continue;
      }
      attributes[attr] = this._truncateToSize(attrVal);
      eventAttributesCount++;
    }
    this.events.push({
      name,
      attributes,
      time: this._getTime(timeStamp),
      droppedAttributesCount
    });
    return this;
  }
  addLink(link) {
    if (this._isSpanEnded())
      return this;
    const { linkCountLimit } = this._spanLimits;
    if (linkCountLimit === 0) {
      this._droppedLinksCount++;
      return this;
    }
    if (linkCountLimit !== undefined && this.links.length >= linkCountLimit) {
      if (this._droppedLinksCount === 0) {
        import_api.diag.debug("Dropping extra links.");
      }
      this.links.shift();
      this._droppedLinksCount++;
    }
    const { attributePerLinkCountLimit } = this._spanLimits;
    const sanitized = import_core.sanitizeAttributes(link.attributes);
    const attributes = {};
    let droppedAttributesCount = 0;
    let linkAttributesCount = 0;
    for (const attr in sanitized) {
      if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) {
        continue;
      }
      const attrVal = sanitized[attr];
      if (attributePerLinkCountLimit !== undefined && linkAttributesCount >= attributePerLinkCountLimit) {
        droppedAttributesCount++;
        continue;
      }
      attributes[attr] = this._truncateToSize(attrVal);
      linkAttributesCount++;
    }
    const processedLink = { context: link.context };
    if (linkAttributesCount > 0) {
      processedLink.attributes = attributes;
    }
    if (droppedAttributesCount > 0) {
      processedLink.droppedAttributesCount = droppedAttributesCount;
    }
    this.links.push(processedLink);
    return this;
  }
  addLinks(links) {
    for (const link of links) {
      this.addLink(link);
    }
    return this;
  }
  setStatus(status) {
    if (this._isSpanEnded())
      return this;
    if (status.code === import_api.SpanStatusCode.UNSET)
      return this;
    if (this.status.code === import_api.SpanStatusCode.OK)
      return this;
    const newStatus = { code: status.code };
    if (status.code === import_api.SpanStatusCode.ERROR) {
      if (typeof status.message === "string") {
        newStatus.message = status.message;
      } else if (status.message != null) {
        import_api.diag.warn(`Dropping invalid status.message of type '${typeof status.message}', expected 'string'`);
      }
    }
    this.status = newStatus;
    return this;
  }
  updateName(name) {
    if (this._isSpanEnded())
      return this;
    this.name = name;
    return this;
  }
  end(endTime) {
    if (this._isSpanEnded()) {
      import_api.diag.error(`${this.name} ${this._spanContext.traceId}-${this._spanContext.spanId} - You can only call end() on a span once.`);
      return;
    }
    this.endTime = this._getTime(endTime);
    this._duration = import_core.hrTimeDuration(this.startTime, this.endTime);
    if (this._duration[0] < 0) {
      import_api.diag.warn("Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.", this.startTime, this.endTime);
      this.endTime = this.startTime.slice();
      this._duration = [0, 0];
    }
    if (this._droppedEventsCount > 0) {
      import_api.diag.warn(`Dropped ${this._droppedEventsCount} events because eventCountLimit reached`);
    }
    if (this._droppedLinksCount > 0) {
      import_api.diag.warn(`Dropped ${this._droppedLinksCount} links because linkCountLimit reached`);
    }
    if (this._spanProcessor.onEnding) {
      this._spanProcessor.onEnding(this);
    }
    this._recordEndMetrics?.();
    this._ended = true;
    this._spanProcessor.onEnd(this);
  }
  _getTime(inp) {
    if (typeof inp === "number" && inp <= import_core.otperformance.now()) {
      return import_core.hrTime(inp + this._performanceOffset);
    }
    if (typeof inp === "number") {
      return import_core.millisToHrTime(inp);
    }
    if (inp instanceof Date) {
      return import_core.millisToHrTime(inp.getTime());
    }
    if (import_core.isTimeInputHrTime(inp)) {
      return inp;
    }
    if (this._startTimeProvided) {
      return import_core.millisToHrTime(Date.now());
    }
    const msDuration = import_core.otperformance.now() - this._performanceStartTime;
    return import_core.addHrTimes(this.startTime, import_core.millisToHrTime(msDuration));
  }
  isRecording() {
    return this._ended === false;
  }
  recordException(exception, time) {
    const attributes = {};
    if (typeof exception === "string") {
      attributes[import_semantic_conventions.ATTR_EXCEPTION_MESSAGE] = exception;
    } else if (exception) {
      if (exception.code) {
        attributes[import_semantic_conventions.ATTR_EXCEPTION_TYPE] = exception.code.toString();
      } else if (exception.name) {
        attributes[import_semantic_conventions.ATTR_EXCEPTION_TYPE] = exception.name;
      }
      if (exception.message) {
        attributes[import_semantic_conventions.ATTR_EXCEPTION_MESSAGE] = exception.message;
      }
      if (exception.stack) {
        attributes[import_semantic_conventions.ATTR_EXCEPTION_STACKTRACE] = exception.stack;
      }
    }
    if (attributes[import_semantic_conventions.ATTR_EXCEPTION_TYPE] || attributes[import_semantic_conventions.ATTR_EXCEPTION_MESSAGE]) {
      this.addEvent(ExceptionEventName, attributes, time);
    } else {
      import_api.diag.warn(`Failed to record an exception ${exception}`);
    }
  }
  get duration() {
    return this._duration;
  }
  get ended() {
    return this._ended;
  }
  get droppedAttributesCount() {
    return this._droppedAttributesCount;
  }
  get droppedEventsCount() {
    return this._droppedEventsCount;
  }
  get droppedLinksCount() {
    return this._droppedLinksCount;
  }
  _isSpanEnded() {
    if (this._ended) {
      const error = new Error(`Operation attempted on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`);
      import_api.diag.warn(`Cannot execute the operation on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`, error);
    }
    return this._ended;
  }
  _truncateToLimitUtil(value, limit) {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit);
  }
  _truncateToSize(value) {
    const limit = this._attributeValueLengthLimit;
    if (limit <= 0) {
      import_api.diag.warn(`Attribute value limit must be positive, got ${limit}`);
      return value;
    }
    if (typeof value === "string") {
      return this._truncateToLimitUtil(value, limit);
    }
    if (Array.isArray(value)) {
      return value.map((val) => typeof val === "string" ? this._truncateToLimitUtil(val, limit) : val);
    }
    return value;
  }
}
var import_api, import_core, import_semantic_conventions;
var init_Span = __esm(() => {
  init_enums();
  import_api = __toESM(require_src(), 1);
  import_core = __toESM(require_src3(), 1);
  import_semantic_conventions = __toESM(require_src2(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/Sampler.js
var SamplingDecision;
var init_Sampler = __esm(() => {
  (function(SamplingDecision2) {
    SamplingDecision2[SamplingDecision2["NOT_RECORD"] = 0] = "NOT_RECORD";
    SamplingDecision2[SamplingDecision2["RECORD"] = 1] = "RECORD";
    SamplingDecision2[SamplingDecision2["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
  })(SamplingDecision || (SamplingDecision = {}));
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOffSampler.js
class AlwaysOffSampler {
  shouldSample() {
    return {
      decision: SamplingDecision.NOT_RECORD
    };
  }
  toString() {
    return "AlwaysOffSampler";
  }
}
var init_AlwaysOffSampler = __esm(() => {
  init_Sampler();
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOnSampler.js
class AlwaysOnSampler {
  shouldSample() {
    return {
      decision: SamplingDecision.RECORD_AND_SAMPLED
    };
  }
  toString() {
    return "AlwaysOnSampler";
  }
}
var init_AlwaysOnSampler = __esm(() => {
  init_Sampler();
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/ParentBasedSampler.js
class ParentBasedSampler {
  _root;
  _remoteParentSampled;
  _remoteParentNotSampled;
  _localParentSampled;
  _localParentNotSampled;
  constructor(config) {
    this._root = config.root;
    if (!this._root) {
      import_core2.globalErrorHandler(new Error("ParentBasedSampler must have a root sampler configured"));
      this._root = new AlwaysOnSampler;
    }
    this._remoteParentSampled = config.remoteParentSampled ?? new AlwaysOnSampler;
    this._remoteParentNotSampled = config.remoteParentNotSampled ?? new AlwaysOffSampler;
    this._localParentSampled = config.localParentSampled ?? new AlwaysOnSampler;
    this._localParentNotSampled = config.localParentNotSampled ?? new AlwaysOffSampler;
  }
  shouldSample(context, traceId, spanName, spanKind, attributes, links) {
    const parentContext = import_api2.trace.getSpanContext(context);
    if (!parentContext || !import_api2.isSpanContextValid(parentContext)) {
      return this._root.shouldSample(context, traceId, spanName, spanKind, attributes, links);
    }
    if (parentContext.isRemote) {
      if (parentContext.traceFlags & import_api2.TraceFlags.SAMPLED) {
        return this._remoteParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
      }
      return this._remoteParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
    }
    if (parentContext.traceFlags & import_api2.TraceFlags.SAMPLED) {
      return this._localParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
    }
    return this._localParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
  }
  toString() {
    return `ParentBased{root=${this._root.toString()}, remoteParentSampled=${this._remoteParentSampled.toString()}, remoteParentNotSampled=${this._remoteParentNotSampled.toString()}, localParentSampled=${this._localParentSampled.toString()}, localParentNotSampled=${this._localParentNotSampled.toString()}}`;
  }
}
var import_api2, import_core2;
var init_ParentBasedSampler = __esm(() => {
  init_AlwaysOffSampler();
  init_AlwaysOnSampler();
  import_api2 = __toESM(require_src(), 1);
  import_core2 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/TraceIdRatioBasedSampler.js
class TraceIdRatioBasedSampler {
  _ratio;
  _upperBound;
  constructor(ratio = 0) {
    this._ratio = this._normalize(ratio);
    this._upperBound = Math.floor(this._ratio * 4294967295);
  }
  shouldSample(context, traceId) {
    return {
      decision: import_api3.isValidTraceId(traceId) && this._accumulate(traceId) < this._upperBound ? SamplingDecision.RECORD_AND_SAMPLED : SamplingDecision.NOT_RECORD
    };
  }
  toString() {
    return `TraceIdRatioBased{${this._ratio}}`;
  }
  _normalize(ratio) {
    if (typeof ratio !== "number" || isNaN(ratio))
      return 0;
    return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
  }
  _accumulate(traceId) {
    let accumulation = 0;
    for (let i = 0;i < traceId.length / 8; i++) {
      const pos = i * 8;
      const part = parseInt(traceId.slice(pos, pos + 8), 16);
      accumulation = (accumulation ^ part) >>> 0;
    }
    return accumulation;
  }
}
var import_api3;
var init_TraceIdRatioBasedSampler = __esm(() => {
  init_Sampler();
  import_api3 = __toESM(require_src(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/config.js
function loadDefaultConfig() {
  return {
    sampler: buildSamplerFromEnv(),
    forceFlushTimeoutMillis: 30000,
    generalLimits: {
      attributeValueLengthLimit: import_core3.getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? Infinity,
      attributeCountLimit: import_core3.getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT") ?? 128
    },
    spanLimits: {
      attributeValueLengthLimit: import_core3.getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? Infinity,
      attributeCountLimit: import_core3.getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT") ?? 128,
      linkCountLimit: import_core3.getNumberFromEnv("OTEL_SPAN_LINK_COUNT_LIMIT") ?? 128,
      eventCountLimit: import_core3.getNumberFromEnv("OTEL_SPAN_EVENT_COUNT_LIMIT") ?? 128,
      attributePerEventCountLimit: import_core3.getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT") ?? 128,
      attributePerLinkCountLimit: import_core3.getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT") ?? 128
    }
  };
}
function buildSamplerFromEnv() {
  const sampler = import_core3.getStringFromEnv("OTEL_TRACES_SAMPLER") ?? TracesSamplerValues.ParentBasedAlwaysOn;
  switch (sampler) {
    case TracesSamplerValues.AlwaysOn:
      return new AlwaysOnSampler;
    case TracesSamplerValues.AlwaysOff:
      return new AlwaysOffSampler;
    case TracesSamplerValues.ParentBasedAlwaysOn:
      return new ParentBasedSampler({
        root: new AlwaysOnSampler
      });
    case TracesSamplerValues.ParentBasedAlwaysOff:
      return new ParentBasedSampler({
        root: new AlwaysOffSampler
      });
    case TracesSamplerValues.TraceIdRatio:
      return new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv());
    case TracesSamplerValues.ParentBasedTraceIdRatio:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv())
      });
    default:
      import_api4.diag.error(`OTEL_TRACES_SAMPLER value "${sampler}" invalid, defaulting to "${TracesSamplerValues.ParentBasedAlwaysOn}".`);
      return new ParentBasedSampler({
        root: new AlwaysOnSampler
      });
  }
}
function getSamplerProbabilityFromEnv() {
  const probability = import_core3.getNumberFromEnv("OTEL_TRACES_SAMPLER_ARG");
  if (probability == null) {
    import_api4.diag.error(`OTEL_TRACES_SAMPLER_ARG is blank, defaulting to ${DEFAULT_RATIO}.`);
    return DEFAULT_RATIO;
  }
  if (probability < 0 || probability > 1) {
    import_api4.diag.error(`OTEL_TRACES_SAMPLER_ARG=${probability} was given, but it is out of range ([0..1]), defaulting to ${DEFAULT_RATIO}.`);
    return DEFAULT_RATIO;
  }
  return probability;
}
var import_api4, import_core3, TracesSamplerValues, DEFAULT_RATIO = 1;
var init_config2 = __esm(() => {
  init_AlwaysOffSampler();
  init_AlwaysOnSampler();
  init_ParentBasedSampler();
  init_TraceIdRatioBasedSampler();
  import_api4 = __toESM(require_src(), 1);
  import_core3 = __toESM(require_src3(), 1);
  (function(TracesSamplerValues2) {
    TracesSamplerValues2["AlwaysOff"] = "always_off";
    TracesSamplerValues2["AlwaysOn"] = "always_on";
    TracesSamplerValues2["ParentBasedAlwaysOff"] = "parentbased_always_off";
    TracesSamplerValues2["ParentBasedAlwaysOn"] = "parentbased_always_on";
    TracesSamplerValues2["ParentBasedTraceIdRatio"] = "parentbased_traceidratio";
    TracesSamplerValues2["TraceIdRatio"] = "traceidratio";
  })(TracesSamplerValues || (TracesSamplerValues = {}));
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/utility.js
function mergeConfig(userConfig) {
  const perInstanceDefaults = {
    sampler: buildSamplerFromEnv()
  };
  const DEFAULT_CONFIG = loadDefaultConfig();
  const target = Object.assign({}, DEFAULT_CONFIG, perInstanceDefaults, userConfig);
  target.generalLimits = Object.assign({}, DEFAULT_CONFIG.generalLimits, userConfig.generalLimits || {});
  target.spanLimits = Object.assign({}, DEFAULT_CONFIG.spanLimits, userConfig.spanLimits || {});
  return target;
}
function reconfigureLimits(userConfig) {
  const spanLimits = Object.assign({}, userConfig.spanLimits);
  spanLimits.attributeCountLimit = userConfig.spanLimits?.attributeCountLimit ?? userConfig.generalLimits?.attributeCountLimit ?? import_core4.getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT") ?? import_core4.getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT") ?? DEFAULT_ATTRIBUTE_COUNT_LIMIT;
  spanLimits.attributeValueLengthLimit = userConfig.spanLimits?.attributeValueLengthLimit ?? userConfig.generalLimits?.attributeValueLengthLimit ?? import_core4.getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? import_core4.getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT;
  return Object.assign({}, userConfig, { spanLimits });
}
var import_core4, DEFAULT_ATTRIBUTE_COUNT_LIMIT = 128, DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT = Infinity;
var init_utility = __esm(() => {
  init_config2();
  import_core4 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/export/BatchSpanProcessorBase.js
class BatchSpanProcessorBase {
  _maxExportBatchSize;
  _maxQueueSize;
  _scheduledDelayMillis;
  _exportTimeoutMillis;
  _exporter;
  _isExporting = false;
  _finishedSpans = [];
  _timer;
  _shutdownOnce;
  _droppedSpansCount = 0;
  constructor(exporter, config) {
    this._exporter = exporter;
    this._maxExportBatchSize = typeof config?.maxExportBatchSize === "number" ? config.maxExportBatchSize : import_core5.getNumberFromEnv("OTEL_BSP_MAX_EXPORT_BATCH_SIZE") ?? 512;
    this._maxQueueSize = typeof config?.maxQueueSize === "number" ? config.maxQueueSize : import_core5.getNumberFromEnv("OTEL_BSP_MAX_QUEUE_SIZE") ?? 2048;
    this._scheduledDelayMillis = typeof config?.scheduledDelayMillis === "number" ? config.scheduledDelayMillis : import_core5.getNumberFromEnv("OTEL_BSP_SCHEDULE_DELAY") ?? 5000;
    this._exportTimeoutMillis = typeof config?.exportTimeoutMillis === "number" ? config.exportTimeoutMillis : import_core5.getNumberFromEnv("OTEL_BSP_EXPORT_TIMEOUT") ?? 30000;
    this._shutdownOnce = new import_core5.BindOnceFuture(this._shutdown, this);
    if (this._maxExportBatchSize > this._maxQueueSize) {
      import_api5.diag.warn("BatchSpanProcessor: maxExportBatchSize must be smaller or equal to maxQueueSize, setting maxExportBatchSize to match maxQueueSize");
      this._maxExportBatchSize = this._maxQueueSize;
    }
  }
  forceFlush() {
    if (this._shutdownOnce.isCalled) {
      return this._shutdownOnce.promise;
    }
    return this._flushAll();
  }
  onStart(_span, _parentContext) {}
  onEnd(span) {
    if (this._shutdownOnce.isCalled) {
      return;
    }
    if ((span.spanContext().traceFlags & import_api5.TraceFlags.SAMPLED) === 0) {
      return;
    }
    this._addToBuffer(span);
  }
  shutdown() {
    return this._shutdownOnce.call();
  }
  _shutdown() {
    return Promise.resolve().then(() => {
      return this.onShutdown();
    }).then(() => {
      return this._flushAll();
    }).then(() => {
      return this._exporter.shutdown();
    });
  }
  _addToBuffer(span) {
    if (this._finishedSpans.length >= this._maxQueueSize) {
      if (this._droppedSpansCount === 0) {
        import_api5.diag.debug("maxQueueSize reached, dropping spans");
      }
      this._droppedSpansCount++;
      return;
    }
    if (this._droppedSpansCount > 0) {
      import_api5.diag.warn(`Dropped ${this._droppedSpansCount} spans because maxQueueSize reached`);
      this._droppedSpansCount = 0;
    }
    this._finishedSpans.push(span);
    this._maybeStartTimer();
  }
  _flushAll() {
    return new Promise((resolve, reject) => {
      const promises = [];
      const count = Math.ceil(this._finishedSpans.length / this._maxExportBatchSize);
      for (let i = 0, j = count;i < j; i++) {
        promises.push(this._flushOneBatch());
      }
      Promise.all(promises).then(() => {
        resolve();
      }).catch(reject);
    });
  }
  _flushOneBatch() {
    this._clearTimer();
    if (this._finishedSpans.length === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timeout"));
      }, this._exportTimeoutMillis);
      import_api5.context.with(import_core5.suppressTracing(import_api5.context.active()), () => {
        let spans;
        if (this._finishedSpans.length <= this._maxExportBatchSize) {
          spans = this._finishedSpans;
          this._finishedSpans = [];
        } else {
          spans = this._finishedSpans.splice(0, this._maxExportBatchSize);
        }
        const doExport = () => this._exporter.export(spans, (result) => {
          clearTimeout(timer);
          if (result.code === import_core5.ExportResultCode.SUCCESS) {
            resolve();
          } else {
            reject(result.error ?? new Error("BatchSpanProcessor: span export failed"));
          }
        });
        let pendingResources = null;
        for (let i = 0, len = spans.length;i < len; i++) {
          const span = spans[i];
          if (span.resource.asyncAttributesPending && span.resource.waitForAsyncAttributes) {
            pendingResources ??= [];
            pendingResources.push(span.resource.waitForAsyncAttributes());
          }
        }
        if (pendingResources === null) {
          doExport();
        } else {
          Promise.all(pendingResources).then(doExport, (err) => {
            import_core5.globalErrorHandler(err);
            reject(err);
          });
        }
      });
    });
  }
  _maybeStartTimer() {
    if (this._isExporting)
      return;
    const flush = () => {
      this._isExporting = true;
      this._flushOneBatch().finally(() => {
        this._isExporting = false;
        if (this._finishedSpans.length > 0) {
          this._clearTimer();
          this._maybeStartTimer();
        }
      }).catch((e) => {
        this._isExporting = false;
        import_core5.globalErrorHandler(e);
      });
    };
    if (this._finishedSpans.length >= this._maxExportBatchSize) {
      return flush();
    }
    if (this._timer !== undefined)
      return;
    this._timer = setTimeout(() => flush(), this._scheduledDelayMillis);
    if (typeof this._timer !== "number") {
      this._timer.unref();
    }
  }
  _clearTimer() {
    if (this._timer !== undefined) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
  }
}
var import_api5, import_core5;
var init_BatchSpanProcessorBase = __esm(() => {
  import_api5 = __toESM(require_src(), 1);
  import_core5 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/node/export/BatchSpanProcessor.js
var BatchSpanProcessor;
var init_BatchSpanProcessor = __esm(() => {
  init_BatchSpanProcessorBase();
  BatchSpanProcessor = class BatchSpanProcessor extends BatchSpanProcessorBase {
    onShutdown() {}
  };
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/node/RandomIdGenerator.js
class RandomIdGenerator {
  generateTraceId = getIdGenerator(TRACE_ID_BYTES);
  generateSpanId = getIdGenerator(SPAN_ID_BYTES);
}
function getIdGenerator(bytes) {
  return function generateId() {
    for (let i = 0;i < bytes / 4; i++) {
      SHARED_BUFFER.writeUInt32BE(Math.random() * 2 ** 32 >>> 0, i * 4);
    }
    for (let i = 0;i < bytes; i++) {
      if (SHARED_BUFFER[i] > 0) {
        break;
      } else if (i === bytes - 1) {
        SHARED_BUFFER[bytes - 1] = 1;
      }
    }
    return SHARED_BUFFER.toString("hex", 0, bytes);
  };
}
var SPAN_ID_BYTES = 8, TRACE_ID_BYTES = 16, SHARED_BUFFER;
var init_RandomIdGenerator = __esm(() => {
  SHARED_BUFFER = Buffer.allocUnsafe(TRACE_ID_BYTES);
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/node/index.js
var init_node = __esm(() => {
  init_BatchSpanProcessor();
  init_RandomIdGenerator();
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/index.js
var init_platform2 = __esm(() => {
  init_node();
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/semconv.js
var ATTR_OTEL_SPAN_PARENT_ORIGIN = "otel.span.parent.origin", ATTR_OTEL_SPAN_SAMPLING_RESULT = "otel.span.sampling_result", METRIC_OTEL_SDK_SPAN_LIVE = "otel.sdk.span.live", METRIC_OTEL_SDK_SPAN_STARTED = "otel.sdk.span.started";
var init_semconv = () => {};

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/TracerMetrics.js
class TracerMetrics {
  startedSpans;
  liveSpans;
  constructor(meter) {
    this.startedSpans = meter.createCounter(METRIC_OTEL_SDK_SPAN_STARTED, {
      unit: "{span}",
      description: "The number of created spans."
    });
    this.liveSpans = meter.createUpDownCounter(METRIC_OTEL_SDK_SPAN_LIVE, {
      unit: "{span}",
      description: "The number of currently live spans."
    });
  }
  startSpan(parentSpanCtx, samplingDecision) {
    const samplingDecisionStr = samplingDecisionToString(samplingDecision);
    this.startedSpans.add(1, {
      [ATTR_OTEL_SPAN_PARENT_ORIGIN]: parentOrigin(parentSpanCtx),
      [ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr
    });
    if (samplingDecision === SamplingDecision.NOT_RECORD) {
      return () => {};
    }
    const liveSpanAttributes = {
      [ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr
    };
    this.liveSpans.add(1, liveSpanAttributes);
    return () => {
      this.liveSpans.add(-1, liveSpanAttributes);
    };
  }
}
function parentOrigin(parentSpanContext) {
  if (!parentSpanContext) {
    return "none";
  }
  if (parentSpanContext.isRemote) {
    return "remote";
  }
  return "local";
}
function samplingDecisionToString(decision) {
  switch (decision) {
    case SamplingDecision.RECORD_AND_SAMPLED:
      return "RECORD_AND_SAMPLE";
    case SamplingDecision.RECORD:
      return "RECORD_ONLY";
    case SamplingDecision.NOT_RECORD:
      return "DROP";
  }
}
var init_TracerMetrics = __esm(() => {
  init_Sampler();
  init_semconv();
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/version.js
var VERSION = "2.6.1";
var init_version = () => {};

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/Tracer.js
class Tracer {
  _sampler;
  _generalLimits;
  _spanLimits;
  _idGenerator;
  instrumentationScope;
  _resource;
  _spanProcessor;
  _tracerMetrics;
  constructor(instrumentationScope, config, resource, spanProcessor) {
    const localConfig = mergeConfig(config);
    this._sampler = localConfig.sampler;
    this._generalLimits = localConfig.generalLimits;
    this._spanLimits = localConfig.spanLimits;
    this._idGenerator = config.idGenerator || new RandomIdGenerator;
    this._resource = resource;
    this._spanProcessor = spanProcessor;
    this.instrumentationScope = instrumentationScope;
    const meter = localConfig.meterProvider ? localConfig.meterProvider.getMeter("@opentelemetry/sdk-trace", VERSION) : api.createNoopMeter();
    this._tracerMetrics = new TracerMetrics(meter);
  }
  startSpan(name, options = {}, context3 = api.context.active()) {
    if (options.root) {
      context3 = api.trace.deleteSpan(context3);
    }
    const parentSpan = api.trace.getSpan(context3);
    if (import_core6.isTracingSuppressed(context3)) {
      api.diag.debug("Instrumentation suppressed, returning Noop Span");
      const nonRecordingSpan = api.trace.wrapSpanContext(api.INVALID_SPAN_CONTEXT);
      return nonRecordingSpan;
    }
    const parentSpanContext = parentSpan?.spanContext();
    const spanId = this._idGenerator.generateSpanId();
    let validParentSpanContext;
    let traceId;
    let traceState;
    if (!parentSpanContext || !api.trace.isSpanContextValid(parentSpanContext)) {
      traceId = this._idGenerator.generateTraceId();
    } else {
      traceId = parentSpanContext.traceId;
      traceState = parentSpanContext.traceState;
      validParentSpanContext = parentSpanContext;
    }
    const spanKind = options.kind ?? api.SpanKind.INTERNAL;
    const links = (options.links ?? []).map((link) => {
      return {
        context: link.context,
        attributes: import_core6.sanitizeAttributes(link.attributes)
      };
    });
    const attributes = import_core6.sanitizeAttributes(options.attributes);
    const samplingResult = this._sampler.shouldSample(context3, traceId, name, spanKind, attributes, links);
    const recordEndMetrics = this._tracerMetrics.startSpan(parentSpanContext, samplingResult.decision);
    traceState = samplingResult.traceState ?? traceState;
    const traceFlags = samplingResult.decision === api.SamplingDecision.RECORD_AND_SAMPLED ? api.TraceFlags.SAMPLED : api.TraceFlags.NONE;
    const spanContext = { traceId, spanId, traceFlags, traceState };
    if (samplingResult.decision === api.SamplingDecision.NOT_RECORD) {
      api.diag.debug("Recording is off, propagating context in a non-recording span");
      const nonRecordingSpan = api.trace.wrapSpanContext(spanContext);
      return nonRecordingSpan;
    }
    const initAttributes = import_core6.sanitizeAttributes(Object.assign(attributes, samplingResult.attributes));
    const span = new SpanImpl({
      resource: this._resource,
      scope: this.instrumentationScope,
      context: context3,
      spanContext,
      name,
      kind: spanKind,
      links,
      parentSpanContext: validParentSpanContext,
      attributes: initAttributes,
      startTime: options.startTime,
      spanProcessor: this._spanProcessor,
      spanLimits: this._spanLimits,
      recordEndMetrics
    });
    return span;
  }
  startActiveSpan(name, arg2, arg3, arg4) {
    let opts;
    let ctx;
    let fn;
    if (arguments.length < 2) {
      return;
    } else if (arguments.length === 2) {
      fn = arg2;
    } else if (arguments.length === 3) {
      opts = arg2;
      fn = arg3;
    } else {
      opts = arg2;
      ctx = arg3;
      fn = arg4;
    }
    const parentContext = ctx ?? api.context.active();
    const span = this.startSpan(name, opts, parentContext);
    const contextWithSpanSet = api.trace.setSpan(parentContext, span);
    return api.context.with(contextWithSpanSet, fn, undefined, span);
  }
  getGeneralLimits() {
    return this._generalLimits;
  }
  getSpanLimits() {
    return this._spanLimits;
  }
}
var api, import_core6;
var init_Tracer = __esm(() => {
  init_Span();
  init_utility();
  init_platform2();
  init_TracerMetrics();
  init_version();
  api = __toESM(require_src(), 1);
  import_core6 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/MultiSpanProcessor.js
class MultiSpanProcessor {
  _spanProcessors;
  constructor(spanProcessors) {
    this._spanProcessors = spanProcessors;
  }
  forceFlush() {
    const promises = [];
    for (const spanProcessor of this._spanProcessors) {
      promises.push(spanProcessor.forceFlush());
    }
    return new Promise((resolve) => {
      Promise.all(promises).then(() => {
        resolve();
      }).catch((error) => {
        import_core7.globalErrorHandler(error || new Error("MultiSpanProcessor: forceFlush failed"));
        resolve();
      });
    });
  }
  onStart(span, context3) {
    for (const spanProcessor of this._spanProcessors) {
      spanProcessor.onStart(span, context3);
    }
  }
  onEnding(span) {
    for (const spanProcessor of this._spanProcessors) {
      if (spanProcessor.onEnding) {
        spanProcessor.onEnding(span);
      }
    }
  }
  onEnd(span) {
    for (const spanProcessor of this._spanProcessors) {
      spanProcessor.onEnd(span);
    }
  }
  shutdown() {
    const promises = [];
    for (const spanProcessor of this._spanProcessors) {
      promises.push(spanProcessor.shutdown());
    }
    return new Promise((resolve, reject) => {
      Promise.all(promises).then(() => {
        resolve();
      }, reject);
    });
  }
}
var import_core7;
var init_MultiSpanProcessor = __esm(() => {
  import_core7 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/BasicTracerProvider.js
class BasicTracerProvider {
  _config;
  _tracers = new Map;
  _resource;
  _activeSpanProcessor;
  constructor(config = {}) {
    const mergedConfig = import_core8.merge({}, loadDefaultConfig(), reconfigureLimits(config));
    this._resource = mergedConfig.resource ?? import_resources.defaultResource();
    this._config = Object.assign({}, mergedConfig, {
      resource: this._resource
    });
    const spanProcessors = [];
    if (config.spanProcessors?.length) {
      spanProcessors.push(...config.spanProcessors);
    }
    this._activeSpanProcessor = new MultiSpanProcessor(spanProcessors);
  }
  getTracer(name, version, options) {
    const key = `${name}@${version || ""}:${options?.schemaUrl || ""}`;
    if (!this._tracers.has(key)) {
      this._tracers.set(key, new Tracer({ name, version, schemaUrl: options?.schemaUrl }, this._config, this._resource, this._activeSpanProcessor));
    }
    return this._tracers.get(key);
  }
  forceFlush() {
    const timeout = this._config.forceFlushTimeoutMillis;
    const promises = this._activeSpanProcessor["_spanProcessors"].map((spanProcessor) => {
      return new Promise((resolve) => {
        let state;
        const timeoutInterval = setTimeout(() => {
          resolve(new Error(`Span processor did not completed within timeout period of ${timeout} ms`));
          state = ForceFlushState.timeout;
        }, timeout);
        spanProcessor.forceFlush().then(() => {
          clearTimeout(timeoutInterval);
          if (state !== ForceFlushState.timeout) {
            state = ForceFlushState.resolved;
            resolve(state);
          }
        }).catch((error) => {
          clearTimeout(timeoutInterval);
          state = ForceFlushState.error;
          resolve(error);
        });
      });
    });
    return new Promise((resolve, reject) => {
      Promise.all(promises).then((results) => {
        const errors = results.filter((result) => result !== ForceFlushState.resolved);
        if (errors.length > 0) {
          reject(errors);
        } else {
          resolve();
        }
      }).catch((error) => reject([error]));
    });
  }
  shutdown() {
    return this._activeSpanProcessor.shutdown();
  }
}
var import_core8, import_resources, ForceFlushState;
var init_BasicTracerProvider = __esm(() => {
  init_Tracer();
  init_config2();
  init_MultiSpanProcessor();
  init_utility();
  import_core8 = __toESM(require_src3(), 1);
  import_resources = __toESM(require_src4(), 1);
  (function(ForceFlushState2) {
    ForceFlushState2[ForceFlushState2["resolved"] = 0] = "resolved";
    ForceFlushState2[ForceFlushState2["timeout"] = 1] = "timeout";
    ForceFlushState2[ForceFlushState2["error"] = 2] = "error";
    ForceFlushState2[ForceFlushState2["unresolved"] = 3] = "unresolved";
  })(ForceFlushState || (ForceFlushState = {}));
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/export/ConsoleSpanExporter.js
class ConsoleSpanExporter {
  export(spans, resultCallback) {
    return this._sendSpans(spans, resultCallback);
  }
  shutdown() {
    this._sendSpans([]);
    return this.forceFlush();
  }
  forceFlush() {
    return Promise.resolve();
  }
  _exportInfo(span) {
    return {
      resource: {
        attributes: span.resource.attributes
      },
      instrumentationScope: span.instrumentationScope,
      traceId: span.spanContext().traceId,
      parentSpanContext: span.parentSpanContext,
      traceState: span.spanContext().traceState?.serialize(),
      name: span.name,
      id: span.spanContext().spanId,
      kind: span.kind,
      timestamp: import_core9.hrTimeToMicroseconds(span.startTime),
      duration: import_core9.hrTimeToMicroseconds(span.duration),
      attributes: span.attributes,
      status: span.status,
      events: span.events,
      links: span.links
    };
  }
  _sendSpans(spans, done) {
    for (const span of spans) {
      console.dir(this._exportInfo(span), { depth: 3 });
    }
    if (done) {
      return done({ code: import_core9.ExportResultCode.SUCCESS });
    }
  }
}
var import_core9;
var init_ConsoleSpanExporter = __esm(() => {
  import_core9 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-trace-base@2.6.1+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-trace-base/build/esm/index.js
var init_esm3 = __esm(() => {
  init_BasicTracerProvider();
  init_platform2();
  init_ConsoleSpanExporter();
});

// src/services/api/metricsOptOut.ts
async function _fetchMetricsEnabled() {
  const authResult = getAuthHeaders();
  if (authResult.error) {
    throw new Error(`Auth error: ${authResult.error}`);
  }
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": getClaudeCodeUserAgent(),
    ...authResult.headers
  };
  const endpoint = `https://api.anthropic.com/api/claude_code/organizations/metrics_enabled`;
  const response = await axios_default.get(endpoint, {
    headers,
    timeout: 5000
  });
  return response.data;
}
async function _checkMetricsEnabledAPI() {
  if (isEssentialTrafficOnly()) {
    return { enabled: false, hasError: false };
  }
  try {
    const data = await withOAuth401Retry(_fetchMetricsEnabled, {
      also403Revoked: true
    });
    logForDebugging(`Metrics opt-out API response: enabled=${data.metrics_logging_enabled}`);
    return {
      enabled: data.metrics_logging_enabled,
      hasError: false
    };
  } catch (error) {
    logForDebugging(`Failed to check metrics opt-out status: ${errorMessage(error)}`);
    logError(error);
    return { enabled: false, hasError: true };
  }
}
async function refreshMetricsStatus() {
  const result = await memoizedCheckMetrics();
  if (result.hasError) {
    return result;
  }
  const cached = getGlobalConfig().metricsStatusCache;
  const unchanged = cached !== undefined && cached.enabled === result.enabled;
  if (unchanged && Date.now() - cached.timestamp < DISK_CACHE_TTL_MS) {
    return result;
  }
  saveGlobalConfig((current) => ({
    ...current,
    metricsStatusCache: {
      enabled: result.enabled,
      timestamp: Date.now()
    }
  }));
  return result;
}
async function checkMetricsEnabled() {
  if (isClaudeAISubscriber() && !hasProfileScope()) {
    return { enabled: false, hasError: false };
  }
  const cached = getGlobalConfig().metricsStatusCache;
  if (cached) {
    if (Date.now() - cached.timestamp > DISK_CACHE_TTL_MS) {
      refreshMetricsStatus().catch(logError);
    }
    return {
      enabled: cached.enabled,
      hasError: false
    };
  }
  return refreshMetricsStatus();
}
var CACHE_TTL_MS, DISK_CACHE_TTL_MS, memoizedCheckMetrics;
var init_metricsOptOut = __esm(() => {
  init_axios();
  init_auth();
  init_config();
  init_debug();
  init_errors();
  init_http();
  init_log();
  init_memoize();
  init_privacyLevel();
  init_userAgent();
  CACHE_TTL_MS = 60 * 60 * 1000;
  DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  memoizedCheckMetrics = memoizeWithTTLAsync(_checkMetricsEnabledAPI, CACHE_TTL_MS);
});

// src/utils/telemetry/bigqueryExporter.ts
class BigQueryMetricsExporter {
  endpoint;
  timeout;
  pendingExports = [];
  isShutdown = false;
  constructor(options = {}) {
    const defaultEndpoint = "https://api.anthropic.com/api/claude_code/metrics";
    if (process.env.USER_TYPE === "ant" && process.env.ANT_CLAUDE_CODE_METRICS_ENDPOINT) {
      this.endpoint = process.env.ANT_CLAUDE_CODE_METRICS_ENDPOINT + "/api/claude_code/metrics";
    } else {
      this.endpoint = defaultEndpoint;
    }
    this.timeout = options.timeout || 5000;
  }
  async export(metrics, resultCallback) {
    if (this.isShutdown) {
      resultCallback({
        code: import_core10.ExportResultCode.FAILED,
        error: new Error("Exporter has been shutdown")
      });
      return;
    }
    const exportPromise = this.doExport(metrics, resultCallback);
    this.pendingExports.push(exportPromise);
    exportPromise.finally(() => {
      const index = this.pendingExports.indexOf(exportPromise);
      if (index > -1) {
        this.pendingExports.splice(index, 1);
      }
    });
  }
  async doExport(metrics, resultCallback) {
    try {
      const hasTrust = checkHasTrustDialogAccepted() || getIsNonInteractiveSession();
      if (!hasTrust) {
        logForDebugging("BigQuery metrics export: trust not established, skipping");
        resultCallback({ code: import_core10.ExportResultCode.SUCCESS });
        return;
      }
      const metricsStatus = await checkMetricsEnabled();
      if (!metricsStatus.enabled) {
        logForDebugging("Metrics export disabled by organization setting");
        resultCallback({ code: import_core10.ExportResultCode.SUCCESS });
        return;
      }
      const payload = this.transformMetricsForInternal(metrics);
      const authResult = getAuthHeaders();
      if (authResult.error) {
        logForDebugging(`Metrics export failed: ${authResult.error}`);
        resultCallback({
          code: import_core10.ExportResultCode.FAILED,
          error: new Error(authResult.error)
        });
        return;
      }
      const headers = {
        "Content-Type": "application/json",
        "User-Agent": getClaudeCodeUserAgent(),
        ...authResult.headers
      };
      const response = await axios_default.post(this.endpoint, payload, {
        timeout: this.timeout,
        headers
      });
      logForDebugging("BigQuery metrics exported successfully");
      logForDebugging(`BigQuery API Response: ${jsonStringify(response.data, null, 2)}`);
      resultCallback({ code: import_core10.ExportResultCode.SUCCESS });
    } catch (error) {
      logForDebugging(`BigQuery metrics export failed: ${errorMessage(error)}`);
      logError(error);
      resultCallback({
        code: import_core10.ExportResultCode.FAILED,
        error: toError(error)
      });
    }
  }
  transformMetricsForInternal(metrics) {
    const attrs = metrics.resource.attributes;
    const resourceAttributes = {
      "service.name": attrs["service.name"] || "claude-code",
      "service.version": attrs["service.version"] || "unknown",
      "os.type": attrs["os.type"] || "unknown",
      "os.version": attrs["os.version"] || "unknown",
      "host.arch": attrs["host.arch"] || "unknown",
      "aggregation.temporality": this.selectAggregationTemporality() === import_sdk_metrics.AggregationTemporality.DELTA ? "delta" : "cumulative"
    };
    if (attrs["wsl.version"]) {
      resourceAttributes["wsl.version"] = attrs["wsl.version"];
    }
    if (isClaudeAISubscriber()) {
      resourceAttributes["user.customer_type"] = "claude_ai";
      const subscriptionType = getSubscriptionType();
      if (subscriptionType) {
        resourceAttributes["user.subscription_type"] = subscriptionType;
      }
    } else {
      resourceAttributes["user.customer_type"] = "api";
    }
    const transformed = {
      resource_attributes: resourceAttributes,
      metrics: metrics.scopeMetrics.flatMap((scopeMetric) => scopeMetric.metrics.map((metric) => ({
        name: metric.descriptor.name,
        description: metric.descriptor.description,
        unit: metric.descriptor.unit,
        data_points: this.extractDataPoints(metric)
      })))
    };
    return transformed;
  }
  extractDataPoints(metric) {
    const dataPoints = metric.dataPoints || [];
    return dataPoints.filter((point) => typeof point.value === "number").map((point) => ({
      attributes: this.convertAttributes(point.attributes),
      value: point.value,
      timestamp: this.hrTimeToISOString(point.endTime || point.startTime || [Date.now() / 1000, 0])
    }));
  }
  async shutdown() {
    this.isShutdown = true;
    await this.forceFlush();
    logForDebugging("BigQuery metrics exporter shutdown complete");
  }
  async forceFlush() {
    await Promise.all(this.pendingExports);
    logForDebugging("BigQuery metrics exporter flush complete");
  }
  convertAttributes(attributes) {
    const result = {};
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined && value !== null) {
          result[key] = String(value);
        }
      }
    }
    return result;
  }
  hrTimeToISOString(hrTime2) {
    const [seconds, nanoseconds] = hrTime2;
    const date = new Date(seconds * 1000 + nanoseconds / 1e6);
    return date.toISOString();
  }
  selectAggregationTemporality() {
    return import_sdk_metrics.AggregationTemporality.DELTA;
  }
}
var import_core10, import_sdk_metrics;
var init_bigqueryExporter = __esm(() => {
  init_axios();
  init_metricsOptOut();
  init_state();
  init_auth();
  init_config();
  init_debug();
  init_errors();
  init_http();
  init_log();
  init_slowOperations();
  init_userAgent();
  import_core10 = __toESM(require_src3(), 1);
  import_sdk_metrics = __toESM(require_src5(), 1);
});

// src/utils/telemetry/logger.ts
class ClaudeCodeDiagLogger {
  error(message, ..._) {
    logError(new Error(message));
    logForDebugging(`[3P telemetry] OTEL diag error: ${message}`, {
      level: "error"
    });
  }
  warn(message, ..._) {
    logError(new Error(message));
    logForDebugging(`[3P telemetry] OTEL diag warn: ${message}`, {
      level: "warn"
    });
  }
  info(_message, ..._args) {
    return;
  }
  debug(_message, ..._args) {
    return;
  }
  verbose(_message, ..._args) {
    return;
  }
}
var init_logger = __esm(() => {
  init_debug();
  init_log();
});

// src/utils/telemetry/instrumentation.ts
function telemetryTimeout(ms, message) {
  return new Promise((_, reject) => {
    setTimeout((rej, msg) => rej(new TelemetryTimeoutError(msg)), ms, reject, message).unref();
  });
}
function bootstrapTelemetry() {
  if (process.env.USER_TYPE === "ant") {
    if (process.env.ANT_OTEL_METRICS_EXPORTER) {
      process.env.OTEL_METRICS_EXPORTER = process.env.ANT_OTEL_METRICS_EXPORTER;
    }
    if (process.env.ANT_OTEL_LOGS_EXPORTER) {
      process.env.OTEL_LOGS_EXPORTER = process.env.ANT_OTEL_LOGS_EXPORTER;
    }
    if (process.env.ANT_OTEL_TRACES_EXPORTER) {
      process.env.OTEL_TRACES_EXPORTER = process.env.ANT_OTEL_TRACES_EXPORTER;
    }
    if (process.env.ANT_OTEL_EXPORTER_OTLP_PROTOCOL) {
      process.env.OTEL_EXPORTER_OTLP_PROTOCOL = process.env.ANT_OTEL_EXPORTER_OTLP_PROTOCOL;
    }
    if (process.env.ANT_OTEL_EXPORTER_OTLP_ENDPOINT) {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = process.env.ANT_OTEL_EXPORTER_OTLP_ENDPOINT;
    }
    if (process.env.ANT_OTEL_EXPORTER_OTLP_HEADERS) {
      process.env.OTEL_EXPORTER_OTLP_HEADERS = process.env.ANT_OTEL_EXPORTER_OTLP_HEADERS;
    }
  }
  if (!process.env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE) {
    process.env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE = "delta";
  }
}
function parseExporterTypes(value) {
  return (value || "").trim().split(",").filter(Boolean).map((t) => t.trim()).filter((t) => t !== "none");
}
async function getOtlpReaders() {
  const exporterTypes = parseExporterTypes(process.env.OTEL_METRICS_EXPORTER);
  const exportInterval = parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || DEFAULT_METRICS_EXPORT_INTERVAL_MS.toString());
  const exporters = [];
  for (const exporterType of exporterTypes) {
    if (exporterType === "console") {
      const consoleExporter = new import_sdk_metrics2.ConsoleMetricExporter;
      const originalExport = consoleExporter.export.bind(consoleExporter);
      consoleExporter.export = (metrics, callback) => {
        if (metrics.resource && metrics.resource.attributes) {
          logForDebugging(`
=== Resource Attributes ===`);
          logForDebugging(jsonStringify(metrics.resource.attributes));
          logForDebugging(`===========================
`);
        }
        return originalExport(metrics, callback);
      };
      exporters.push(consoleExporter);
    } else if (exporterType === "otlp") {
      const protocol = process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL?.trim() || process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim();
      const httpConfig = getOTLPExporterConfig();
      switch (protocol) {
        case "grpc": {
          const { OTLPMetricExporter } = await import("./chunk-myd2j5r0.js").then((m)=>__toESM(m.default,1));
          exporters.push(new OTLPMetricExporter);
          break;
        }
        case "http/json": {
          const { OTLPMetricExporter } = await import("./chunk-8y12jxg8.js").then((m)=>__toESM(m.default,1));
          exporters.push(new OTLPMetricExporter(httpConfig));
          break;
        }
        case "http/protobuf": {
          const { OTLPMetricExporter } = await import("./chunk-s3pzvdss.js");
          exporters.push(new OTLPMetricExporter(httpConfig));
          break;
        }
        default:
          throw new Error(`Unknown protocol set in OTEL_EXPORTER_OTLP_METRICS_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${protocol}`);
      }
    } else if (exporterType === "prometheus") {
      const { PrometheusExporter } = await import("./chunk-6gr3c3w9.js").then((m)=>__toESM(m.default,1));
      exporters.push(new PrometheusExporter);
    } else {
      throw new Error(`Unknown exporter type set in OTEL_EXPORTER_OTLP_METRICS_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${exporterType}`);
    }
  }
  return exporters.map((exporter) => {
    if ("export" in exporter) {
      return new import_sdk_metrics2.PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: exportInterval
      });
    }
    return exporter;
  });
}
async function getOtlpLogExporters() {
  const exporterTypes = parseExporterTypes(process.env.OTEL_LOGS_EXPORTER);
  const protocol = process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL?.trim() || process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim();
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  logForDebugging(`[3P telemetry] getOtlpLogExporters: types=${jsonStringify(exporterTypes)}, protocol=${protocol}, endpoint=${endpoint}`);
  const exporters = [];
  for (const exporterType of exporterTypes) {
    if (exporterType === "console") {
      exporters.push(new ConsoleLogRecordExporter);
    } else if (exporterType === "otlp") {
      const httpConfig = getOTLPExporterConfig();
      switch (protocol) {
        case "grpc": {
          const { OTLPLogExporter } = await import("./chunk-mye8x5xd.js").then((m)=>__toESM(m.default,1));
          exporters.push(new OTLPLogExporter);
          break;
        }
        case "http/json": {
          const { OTLPLogExporter } = await import("./chunk-6bd8brc4.js");
          exporters.push(new OTLPLogExporter(httpConfig));
          break;
        }
        case "http/protobuf": {
          const { OTLPLogExporter } = await import("./chunk-a9zh40sj.js");
          exporters.push(new OTLPLogExporter(httpConfig));
          break;
        }
        default:
          throw new Error(`Unknown protocol set in OTEL_EXPORTER_OTLP_LOGS_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${protocol}`);
      }
    } else {
      throw new Error(`Unknown exporter type set in OTEL_LOGS_EXPORTER env var: ${exporterType}`);
    }
  }
  return exporters;
}
async function getOtlpTraceExporters() {
  const exporterTypes = parseExporterTypes(process.env.OTEL_TRACES_EXPORTER);
  const exporters = [];
  for (const exporterType of exporterTypes) {
    if (exporterType === "console") {
      exporters.push(new ConsoleSpanExporter);
    } else if (exporterType === "otlp") {
      const protocol = process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL?.trim() || process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim();
      const httpConfig = getOTLPExporterConfig();
      switch (protocol) {
        case "grpc": {
          const { OTLPTraceExporter } = await import("./chunk-156npevy.js").then((m)=>__toESM(m.default,1));
          exporters.push(new OTLPTraceExporter);
          break;
        }
        case "http/json": {
          const { OTLPTraceExporter } = await import("./chunk-dgqrcy74.js");
          exporters.push(new OTLPTraceExporter(httpConfig));
          break;
        }
        case "http/protobuf": {
          const { OTLPTraceExporter } = await import("./chunk-8ymf4e6z.js");
          exporters.push(new OTLPTraceExporter(httpConfig));
          break;
        }
        default:
          throw new Error(`Unknown protocol set in OTEL_EXPORTER_OTLP_TRACES_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${protocol}`);
      }
    } else {
      throw new Error(`Unknown exporter type set in OTEL_TRACES_EXPORTER env var: ${exporterType}`);
    }
  }
  return exporters;
}
function isTelemetryEnabled() {
  return isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_TELEMETRY);
}
function getBigQueryExportingReader() {
  const bigqueryExporter = new BigQueryMetricsExporter;
  return new import_sdk_metrics2.PeriodicExportingMetricReader({
    exporter: bigqueryExporter,
    exportIntervalMillis: 300000
  });
}
function isBigQueryMetricsEnabled() {
  const subscriptionType = getSubscriptionType();
  const isC4EOrTeamUser = isClaudeAISubscriber() && (subscriptionType === "enterprise" || subscriptionType === "team");
  return is1PApiCustomer() || isC4EOrTeamUser;
}
async function initializeBetaTracing(resource) {
  const endpoint = process.env.BETA_TRACING_ENDPOINT;
  if (!endpoint) {
    return;
  }
  const [{ OTLPTraceExporter }, { OTLPLogExporter }] = await Promise.all([
    import("./chunk-dgqrcy74.js"),
    import("./chunk-6bd8brc4.js")
  ]);
  const httpConfig = {
    url: `${endpoint}/v1/traces`
  };
  const logHttpConfig = {
    url: `${endpoint}/v1/logs`
  };
  const traceExporter = new OTLPTraceExporter(httpConfig);
  const spanProcessor = new BatchSpanProcessor(traceExporter, {
    scheduledDelayMillis: DEFAULT_TRACES_EXPORT_INTERVAL_MS
  });
  const tracerProvider = new BasicTracerProvider({
    resource,
    spanProcessors: [spanProcessor]
  });
  import_api6.trace.setGlobalTracerProvider(tracerProvider);
  setTracerProvider(tracerProvider);
  const logExporter = new OTLPLogExporter(logHttpConfig);
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor(logExporter, {
        scheduledDelayMillis: DEFAULT_LOGS_EXPORT_INTERVAL_MS
      })
    ]
  });
  logs.setGlobalLoggerProvider(loggerProvider);
  setLoggerProvider(loggerProvider);
  const eventLogger = logs.getLogger("com.anthropic.claude_code.events", MACRO.VERSION);
  setEventLogger(eventLogger);
  process.on("beforeExit", async () => {
    await loggerProvider?.forceFlush();
    await tracerProvider?.forceFlush();
  });
  process.on("exit", () => {
    loggerProvider?.forceFlush();
    tracerProvider?.forceFlush();
  });
}
async function initializeTelemetry() {
  profileCheckpoint("telemetry_init_start");
  bootstrapTelemetry();
  if (getHasFormattedOutput()) {
    for (const key of [
      "OTEL_METRICS_EXPORTER",
      "OTEL_LOGS_EXPORTER",
      "OTEL_TRACES_EXPORTER"
    ]) {
      const v = process.env[key];
      if (v?.includes("console")) {
        process.env[key] = v.split(",").map((s) => s.trim()).filter((s) => s !== "console").join(",");
      }
    }
  }
  import_api6.diag.setLogger(new ClaudeCodeDiagLogger, import_api6.DiagLogLevel.ERROR);
  initializePerfettoTracing();
  const readers = [];
  const telemetryEnabled = isTelemetryEnabled();
  logForDebugging(`[3P telemetry] isTelemetryEnabled=${telemetryEnabled} (CLAUDE_CODE_ENABLE_TELEMETRY=${process.env.CLAUDE_CODE_ENABLE_TELEMETRY})`);
  if (telemetryEnabled) {
    readers.push(...await getOtlpReaders());
  }
  if (isBigQueryMetricsEnabled()) {
    readers.push(getBigQueryExportingReader());
  }
  const platform = getPlatform();
  const baseAttributes = {
    [import_semantic_conventions2.ATTR_SERVICE_NAME]: "claude-code",
    [import_semantic_conventions2.ATTR_SERVICE_VERSION]: MACRO.VERSION
  };
  if (platform === "wsl") {
    const wslVersion = getWslVersion();
    if (wslVersion) {
      baseAttributes["wsl.version"] = wslVersion;
    }
  }
  const baseResource = import_resources2.resourceFromAttributes(baseAttributes);
  const osResource = import_resources2.resourceFromAttributes(import_resources2.osDetector.detect().attributes || {});
  const hostDetected = import_resources2.hostDetector.detect();
  const hostArchAttributes = hostDetected.attributes?.[import_semantic_conventions2.SEMRESATTRS_HOST_ARCH] ? {
    [import_semantic_conventions2.SEMRESATTRS_HOST_ARCH]: hostDetected.attributes[import_semantic_conventions2.SEMRESATTRS_HOST_ARCH]
  } : {};
  const hostArchResource = import_resources2.resourceFromAttributes(hostArchAttributes);
  const envResource = import_resources2.resourceFromAttributes(import_resources2.envDetector.detect().attributes || {});
  const resource = baseResource.merge(osResource).merge(hostArchResource).merge(envResource);
  if (isBetaTracingEnabled()) {
    initializeBetaTracing(resource).catch((e) => logForDebugging(`Beta tracing init failed: ${e}`, { level: "error" }));
    const meterProvider2 = new import_sdk_metrics2.MeterProvider({
      resource,
      views: [],
      readers
    });
    setMeterProvider(meterProvider2);
    const shutdownTelemetry2 = async () => {
      const timeoutMs = parseInt(process.env.CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS || "2000");
      try {
        endInteractionSpan();
        const loggerProvider = getLoggerProvider();
        const tracerProvider = getTracerProvider();
        const chains = [meterProvider2.shutdown()];
        if (loggerProvider) {
          chains.push(loggerProvider.forceFlush().then(() => loggerProvider.shutdown()));
        }
        if (tracerProvider) {
          chains.push(tracerProvider.forceFlush().then(() => tracerProvider.shutdown()));
        }
        await Promise.race([
          Promise.all(chains),
          telemetryTimeout(timeoutMs, "OpenTelemetry shutdown timeout")
        ]);
      } catch {}
    };
    registerCleanup(shutdownTelemetry2);
    return meterProvider2.getMeter("com.anthropic.claude_code", MACRO.VERSION);
  }
  const meterProvider = new import_sdk_metrics2.MeterProvider({
    resource,
    views: [],
    readers
  });
  setMeterProvider(meterProvider);
  if (telemetryEnabled) {
    const logExporters = await getOtlpLogExporters();
    logForDebugging(`[3P telemetry] Created ${logExporters.length} log exporter(s)`);
    if (logExporters.length > 0) {
      const loggerProvider = new LoggerProvider({
        resource,
        processors: logExporters.map((exporter) => new BatchLogRecordProcessor(exporter, {
          scheduledDelayMillis: parseInt(process.env.OTEL_LOGS_EXPORT_INTERVAL || DEFAULT_LOGS_EXPORT_INTERVAL_MS.toString())
        }))
      });
      logs.setGlobalLoggerProvider(loggerProvider);
      setLoggerProvider(loggerProvider);
      const eventLogger = logs.getLogger("com.anthropic.claude_code.events", MACRO.VERSION);
      setEventLogger(eventLogger);
      logForDebugging("[3P telemetry] Event logger set successfully");
      process.on("beforeExit", async () => {
        await loggerProvider?.forceFlush();
        const tracerProvider = getTracerProvider();
        await tracerProvider?.forceFlush();
      });
      process.on("exit", () => {
        loggerProvider?.forceFlush();
        getTracerProvider()?.forceFlush();
      });
    }
  }
  if (telemetryEnabled && isEnhancedTelemetryEnabled()) {
    const traceExporters = await getOtlpTraceExporters();
    if (traceExporters.length > 0) {
      const spanProcessors = traceExporters.map((exporter) => new BatchSpanProcessor(exporter, {
        scheduledDelayMillis: parseInt(process.env.OTEL_TRACES_EXPORT_INTERVAL || DEFAULT_TRACES_EXPORT_INTERVAL_MS.toString())
      }));
      const tracerProvider = new BasicTracerProvider({
        resource,
        spanProcessors
      });
      import_api6.trace.setGlobalTracerProvider(tracerProvider);
      setTracerProvider(tracerProvider);
    }
  }
  const shutdownTelemetry = async () => {
    const timeoutMs = parseInt(process.env.CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS || "2000");
    try {
      endInteractionSpan();
      const shutdownPromises = [meterProvider.shutdown()];
      const loggerProvider = getLoggerProvider();
      if (loggerProvider) {
        shutdownPromises.push(loggerProvider.shutdown());
      }
      const tracerProvider = getTracerProvider();
      if (tracerProvider) {
        shutdownPromises.push(tracerProvider.shutdown());
      }
      await Promise.race([
        Promise.all(shutdownPromises),
        telemetryTimeout(timeoutMs, "OpenTelemetry shutdown timeout")
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        logForDebugging(`
OpenTelemetry telemetry flush timed out after ${timeoutMs}ms

To resolve this issue, you can:
1. Increase the timeout by setting CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS env var (e.g., 5000 for 5 seconds)
2. Check if your OpenTelemetry backend is experiencing scalability issues
3. Disable OpenTelemetry by unsetting CLAUDE_CODE_ENABLE_TELEMETRY env var

Current timeout: ${timeoutMs}ms
`, { level: "error" });
      }
      throw error;
    }
  };
  registerCleanup(shutdownTelemetry);
  return meterProvider.getMeter("com.anthropic.claude_code", MACRO.VERSION);
}
async function flushTelemetry() {
  const meterProvider = getMeterProvider();
  if (!meterProvider) {
    return;
  }
  const timeoutMs = parseInt(process.env.CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS || "5000");
  try {
    const flushPromises = [meterProvider.forceFlush()];
    const loggerProvider = getLoggerProvider();
    if (loggerProvider) {
      flushPromises.push(loggerProvider.forceFlush());
    }
    const tracerProvider = getTracerProvider();
    if (tracerProvider) {
      flushPromises.push(tracerProvider.forceFlush());
    }
    await Promise.race([
      Promise.all(flushPromises),
      telemetryTimeout(timeoutMs, "OpenTelemetry flush timeout")
    ]);
    logForDebugging("Telemetry flushed successfully");
  } catch (error) {
    if (error instanceof TelemetryTimeoutError) {
      logForDebugging(`Telemetry flush timed out after ${timeoutMs}ms. Some metrics may not be exported.`, { level: "warn" });
    } else {
      logForDebugging(`Telemetry flush failed: ${errorMessage(error)}`, {
        level: "error"
      });
    }
  }
}
function parseOtelHeadersEnvVar() {
  const headers = {};
  const envHeaders = process.env.OTEL_EXPORTER_OTLP_HEADERS;
  if (envHeaders) {
    for (const pair of envHeaders.split(",")) {
      const [key, ...valueParts] = pair.split("=");
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join("=").trim();
      }
    }
  }
  return headers;
}
function getOTLPExporterConfig() {
  const proxyUrl = getProxyUrl();
  const mtlsConfig = getMTLSConfig();
  const settings = getSettings_DEPRECATED();
  const config = {};
  const staticHeaders = parseOtelHeadersEnvVar();
  if (settings?.otelHeadersHelper) {
    config.headers = async () => {
      const dynamicHeaders = getOtelHeadersFromHelper();
      return { ...staticHeaders, ...dynamicHeaders };
    };
  } else if (Object.keys(staticHeaders).length > 0) {
    config.headers = async () => staticHeaders;
  }
  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!proxyUrl || otelEndpoint && shouldBypassProxy(otelEndpoint)) {
    const caCerts2 = getCACertificates();
    if (mtlsConfig || caCerts2) {
      config.httpAgentOptions = {
        ...mtlsConfig,
        ...caCerts2 && { ca: caCerts2 }
      };
    }
    return config;
  }
  const caCerts = getCACertificates();
  const agentFactory = (_protocol) => {
    const proxyAgent = mtlsConfig || caCerts ? new HttpsProxyAgent(proxyUrl, {
      ...mtlsConfig && {
        cert: mtlsConfig.cert,
        key: mtlsConfig.key,
        passphrase: mtlsConfig.passphrase
      },
      ...caCerts && { ca: caCerts }
    }) : new HttpsProxyAgent(proxyUrl);
    return proxyAgent;
  };
  config.httpAgentOptions = agentFactory;
  return config;
}
var import_api6, import_resources2, import_sdk_metrics2, import_semantic_conventions2, DEFAULT_METRICS_EXPORT_INTERVAL_MS = 60000, DEFAULT_LOGS_EXPORT_INTERVAL_MS = 5000, DEFAULT_TRACES_EXPORT_INTERVAL_MS = 5000, TelemetryTimeoutError;
var init_instrumentation = __esm(() => {
  init_esm();
  init_esm2();
  init_esm3();
  init_dist();
  init_state();
  init_auth();
  init_platform();
  init_caCerts();
  init_cleanupRegistry();
  init_debug();
  init_envUtils();
  init_errors();
  init_mtls();
  init_proxy();
  init_settings();
  init_slowOperations();
  init_startupProfiler();
  init_betaSessionTracing();
  init_bigqueryExporter();
  init_logger();
  init_perfettoTracing();
  init_sessionTracing();
  import_api6 = __toESM(require_src(), 1);
  import_resources2 = __toESM(require_src4(), 1);
  import_sdk_metrics2 = __toESM(require_src5(), 1);
  import_semantic_conventions2 = __toESM(require_src2(), 1);
  TelemetryTimeoutError = class TelemetryTimeoutError extends Error {
  };
});
init_instrumentation();

export {
  parseExporterTypes,
  isTelemetryEnabled,
  initializeTelemetry,
  flushTelemetry,
  bootstrapTelemetry
};
