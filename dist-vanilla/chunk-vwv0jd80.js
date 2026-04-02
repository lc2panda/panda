// @bun
import {
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_config1 as init_config,
  saveCurrentProjectConfig
} from "./chunk-w5d5b7r0.js";
import {
  __toESM
} from "./chunk-qp2qdcda.js";

// src/context/stats.tsx
init_config();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var import_react = __toESM(require_react(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
function percentile(sorted, p) {
  const index = p / 100 * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}
var RESERVOIR_SIZE = 1024;
function createStatsStore() {
  const metrics = new Map;
  const histograms = new Map;
  const sets = new Map;
  return {
    increment(name, value = 1) {
      metrics.set(name, (metrics.get(name) ?? 0) + value);
    },
    set(name, value) {
      metrics.set(name, value);
    },
    observe(name, value) {
      let h = histograms.get(name);
      if (!h) {
        h = {
          reservoir: [],
          count: 0,
          sum: 0,
          min: value,
          max: value
        };
        histograms.set(name, h);
      }
      h.count++;
      h.sum += value;
      if (value < h.min) {
        h.min = value;
      }
      if (value > h.max) {
        h.max = value;
      }
      if (h.reservoir.length < RESERVOIR_SIZE) {
        h.reservoir.push(value);
      } else {
        const j = Math.floor(Math.random() * h.count);
        if (j < RESERVOIR_SIZE) {
          h.reservoir[j] = value;
        }
      }
    },
    add(name, value) {
      let s = sets.get(name);
      if (!s) {
        s = new Set;
        sets.set(name, s);
      }
      s.add(value);
    },
    getAll() {
      const result = Object.fromEntries(metrics);
      for (const [name, h] of histograms) {
        if (h.count === 0) {
          continue;
        }
        result[`${name}_count`] = h.count;
        result[`${name}_min`] = h.min;
        result[`${name}_max`] = h.max;
        result[`${name}_avg`] = h.sum / h.count;
        const sorted = [...h.reservoir].sort((a, b) => a - b);
        result[`${name}_p50`] = percentile(sorted, 50);
        result[`${name}_p95`] = percentile(sorted, 95);
        result[`${name}_p99`] = percentile(sorted, 99);
      }
      for (const [name, s] of sets) {
        result[name] = s.size;
      }
      return result;
    }
  };
}
var StatsContext = import_react.createContext(null);
function StatsProvider(t0) {
  const $ = import_compiler_runtime.c(7);
  const {
    store: externalStore,
    children
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = createStatsStore();
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const internalStore = t1;
  const store = externalStore ?? internalStore;
  let t2;
  let t3;
  if ($[1] !== store) {
    t2 = () => {
      const flush = () => {
        const metrics = store.getAll();
        if (Object.keys(metrics).length > 0) {
          saveCurrentProjectConfig((current) => ({
            ...current,
            lastSessionMetrics: metrics
          }));
        }
      };
      process.on("exit", flush);
      return () => {
        process.off("exit", flush);
      };
    };
    t3 = [store];
    $[1] = store;
    $[2] = t2;
    $[3] = t3;
  } else {
    t2 = $[2];
    t3 = $[3];
  }
  import_react.useEffect(t2, t3);
  let t4;
  if ($[4] !== children || $[5] !== store) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(StatsContext.Provider, {
      value: store,
      children
    }, undefined, false, undefined, this);
    $[4] = children;
    $[5] = store;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  return t4;
}

export { createStatsStore, StatsProvider };
