// @bun
import {
  _baseSlice_default,
  escapeXmlAttr,
  getPluginsDirectory,
  init__baseSlice,
  init_last,
  init_pluginDirectories,
  init_pluginIdentifier,
  init_xml as init_xml2,
  last_default
} from "./chunk-ekfe4t3x.js";
import {
  _overRest_default,
  _setToString_default,
  init__overRest,
  init__setToString,
  init_growthbook,
  init_isPlainObject,
  isPlainObject_default
} from "./chunk-w5d5b7r0.js";
import {
  init_v4
} from "./chunk-g0j0t6qk.js";
import {
  exports_external,
  init_lazySchema,
  lazySchema
} from "./chunk-55wgxwa9.js";
import {
  CHANNEL_TAG,
  init_log,
  init_xml,
  logError
} from "./chunk-myphr2va.js";
import {
  _baseClone_default,
  _copyObject_default,
  _getAllKeysIn_default,
  getFsImplementation,
  init__baseClone,
  init__copyObject,
  init__getAllKeysIn,
  init_debug,
  init_fsOperations,
  init_slowOperations,
  jsonParse,
  jsonStringify,
  logForDebugging
} from "./chunk-cv4r43rj.js";
import {
  _arrayMap_default,
  _arrayPush_default,
  _baseGet_default,
  _castPath_default,
  _toKey_default,
  init__arrayMap,
  init__arrayPush,
  init__baseGet,
  init__castPath,
  init__toKey,
  init_isArguments,
  init_isArray,
  isArguments_default,
  isArray_default
} from "./chunk-24stks7b.js";
import {
  _Symbol_default,
  init__Symbol
} from "./chunk-hqmz36b3.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// node_modules/.bun/lodash-es@4.17.23/node_modules/lodash-es/_parent.js
function parent(object, path) {
  return path.length < 2 ? object : _baseGet_default(object, _baseSlice_default(path, 0, -1));
}
var _parent_default;
var init__parent = __esm(() => {
  init__baseGet();
  init__baseSlice();
  _parent_default = parent;
});

// node_modules/.bun/lodash-es@4.17.23/node_modules/lodash-es/_baseUnset.js
function baseUnset(object, path) {
  path = _castPath_default(path, object);
  var index = -1, length = path.length;
  if (!length) {
    return true;
  }
  var isRootPrimitive = object == null || typeof object !== "object" && typeof object !== "function";
  while (++index < length) {
    var key = path[index];
    if (typeof key !== "string") {
      continue;
    }
    if (key === "__proto__" && !hasOwnProperty.call(object, "__proto__")) {
      return false;
    }
    if (key === "constructor" && index + 1 < length && typeof path[index + 1] === "string" && path[index + 1] === "prototype") {
      if (isRootPrimitive && index === 0) {
        continue;
      }
      return false;
    }
  }
  var obj = _parent_default(object, path);
  return obj == null || delete obj[_toKey_default(last_default(path))];
}
var objectProto, hasOwnProperty, _baseUnset_default;
var init__baseUnset = __esm(() => {
  init__castPath();
  init_last();
  init__parent();
  init__toKey();
  objectProto = Object.prototype;
  hasOwnProperty = objectProto.hasOwnProperty;
  _baseUnset_default = baseUnset;
});

// node_modules/.bun/lodash-es@4.17.23/node_modules/lodash-es/_customOmitClone.js
function customOmitClone(value) {
  return isPlainObject_default(value) ? undefined : value;
}
var _customOmitClone_default;
var init__customOmitClone = __esm(() => {
  init_isPlainObject();
  _customOmitClone_default = customOmitClone;
});

// node_modules/.bun/lodash-es@4.17.23/node_modules/lodash-es/_isFlattenable.js
function isFlattenable(value) {
  return isArray_default(value) || isArguments_default(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
}
var spreadableSymbol, _isFlattenable_default;
var init__isFlattenable = __esm(() => {
  init__Symbol();
  init_isArguments();
  init_isArray();
  spreadableSymbol = _Symbol_default ? _Symbol_default.isConcatSpreadable : undefined;
  _isFlattenable_default = isFlattenable;
});

// node_modules/.bun/lodash-es@4.17.23/node_modules/lodash-es/_baseFlatten.js
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1, length = array.length;
  predicate || (predicate = _isFlattenable_default);
  result || (result = []);
  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        _arrayPush_default(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}
var _baseFlatten_default;
var init__baseFlatten = __esm(() => {
  init__arrayPush();
  init__isFlattenable();
  _baseFlatten_default = baseFlatten;
});

// node_modules/.bun/lodash-es@4.17.23/node_modules/lodash-es/flatten.js
function flatten(array) {
  var length = array == null ? 0 : array.length;
  return length ? _baseFlatten_default(array, 1) : [];
}
var flatten_default;
var init_flatten = __esm(() => {
  init__baseFlatten();
  flatten_default = flatten;
});

// node_modules/.bun/lodash-es@4.17.23/node_modules/lodash-es/_flatRest.js
function flatRest(func) {
  return _setToString_default(_overRest_default(func, undefined, flatten_default), func + "");
}
var _flatRest_default;
var init__flatRest = __esm(() => {
  init_flatten();
  init__overRest();
  init__setToString();
  _flatRest_default = flatRest;
});

// node_modules/.bun/lodash-es@4.17.23/node_modules/lodash-es/omit.js
var CLONE_DEEP_FLAG = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG = 4, omit, omit_default;
var init_omit = __esm(() => {
  init__arrayMap();
  init__baseClone();
  init__baseUnset();
  init__castPath();
  init__copyObject();
  init__customOmitClone();
  init__flatRest();
  init__getAllKeysIn();
  omit = _flatRest_default(function(object, paths) {
    var result = {};
    if (object == null) {
      return result;
    }
    var isDeep = false;
    paths = _arrayMap_default(paths, function(path) {
      path = _castPath_default(path, object);
      isDeep || (isDeep = path.length > 1);
      return path;
    });
    _copyObject_default(object, _getAllKeysIn_default(object), result);
    if (isDeep) {
      result = _baseClone_default(result, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, _customOmitClone_default);
    }
    var length = paths.length;
    while (length--) {
      _baseUnset_default(result, paths[length]);
    }
    return result;
  });
  omit_default = omit;
});

// src/services/mcp/channelAllowlist.ts
var ChannelAllowlistSchema;
var init_channelAllowlist = __esm(() => {
  init_v4();
  init_lazySchema();
  init_pluginIdentifier();
  init_growthbook();
  ChannelAllowlistSchema = lazySchema(() => exports_external.array(exports_external.object({
    marketplace: exports_external.string(),
    plugin: exports_external.string()
  })));
});

// src/services/mcp/channelNotification.ts
function wrapChannelMessage(serverName, content, meta) {
  const attrs = Object.entries(meta ?? {}).filter(([k]) => SAFE_META_KEY.test(k)).map(([k, v]) => ` ${k}="${escapeXmlAttr(v)}"`).join("");
  return `<${CHANNEL_TAG} source="${escapeXmlAttr(serverName)}"${attrs}>
${content}
</${CHANNEL_TAG}>`;
}
function findChannelEntry(serverName, channels) {
  const parts = serverName.split(":");
  return channels.find((c) => c.kind === "server" ? serverName === c.name : parts[0] === "plugin" && parts[1] === c.name);
}
function gateChannelServer(serverName, capabilities, pluginSource) {
  if (!capabilities?.experimental?.["claude/channel"]) {
    return {
      action: "skip",
      kind: "capability",
      reason: "server did not declare claude/channel capability"
    };
  }
  return { action: "register" };
}
var ChannelMessageNotificationSchema, CHANNEL_PERMISSION_METHOD = "notifications/claude/channel/permission", ChannelPermissionNotificationSchema, SAFE_META_KEY;
var init_channelNotification = __esm(() => {
  init_v4();
  init_xml();
  init_lazySchema();
  init_xml2();
  init_channelAllowlist();
  ChannelMessageNotificationSchema = lazySchema(() => exports_external.object({
    method: exports_external.literal("notifications/claude/channel"),
    params: exports_external.object({
      content: exports_external.string(),
      meta: exports_external.record(exports_external.string(), exports_external.string()).optional()
    })
  }));
  ChannelPermissionNotificationSchema = lazySchema(() => exports_external.object({
    method: exports_external.literal(CHANNEL_PERMISSION_METHOD),
    params: exports_external.object({
      request_id: exports_external.string(),
      behavior: exports_external.enum(["allow", "deny"])
    })
  }));
  SAFE_META_KEY = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
});

// src/utils/plugins/pluginFlagging.ts
import { randomBytes } from "crypto";
import { readFile, rename, unlink, writeFile } from "fs/promises";
import { join } from "path";
function getFlaggedPluginsPath() {
  return join(getPluginsDirectory(), FLAGGED_PLUGINS_FILENAME);
}
function parsePluginsData(content) {
  const parsed = jsonParse(content);
  if (typeof parsed !== "object" || parsed === null || !("plugins" in parsed) || typeof parsed.plugins !== "object" || parsed.plugins === null) {
    return {};
  }
  const plugins = parsed.plugins;
  const result = {};
  for (const [id, entry] of Object.entries(plugins)) {
    if (entry && typeof entry === "object" && "flaggedAt" in entry && typeof entry.flaggedAt === "string") {
      const parsed2 = {
        flaggedAt: entry.flaggedAt
      };
      if ("seenAt" in entry && typeof entry.seenAt === "string") {
        parsed2.seenAt = entry.seenAt;
      }
      result[id] = parsed2;
    }
  }
  return result;
}
async function readFromDisk() {
  try {
    const content = await readFile(getFlaggedPluginsPath(), {
      encoding: "utf-8"
    });
    return parsePluginsData(content);
  } catch {
    return {};
  }
}
async function writeToDisk(plugins) {
  const filePath = getFlaggedPluginsPath();
  const tempPath = `${filePath}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await getFsImplementation().mkdir(getPluginsDirectory());
    const content = jsonStringify({ plugins }, null, 2);
    await writeFile(tempPath, content, {
      encoding: "utf-8",
      mode: 384
    });
    await rename(tempPath, filePath);
    cache = plugins;
  } catch (error) {
    logError(error);
    try {
      await unlink(tempPath);
    } catch {}
  }
}
async function loadFlaggedPlugins() {
  const all = await readFromDisk();
  const now = Date.now();
  let changed = false;
  for (const [id, entry] of Object.entries(all)) {
    if (entry.seenAt && now - new Date(entry.seenAt).getTime() >= SEEN_EXPIRY_MS) {
      delete all[id];
      changed = true;
    }
  }
  cache = all;
  if (changed) {
    await writeToDisk(all);
  }
}
function getFlaggedPlugins() {
  return cache ?? {};
}
async function addFlaggedPlugin(pluginId) {
  if (cache === null) {
    cache = await readFromDisk();
  }
  const updated = {
    ...cache,
    [pluginId]: {
      flaggedAt: new Date().toISOString()
    }
  };
  await writeToDisk(updated);
  logForDebugging(`Flagged plugin: ${pluginId}`);
}
async function markFlaggedPluginsSeen(pluginIds) {
  if (cache === null) {
    cache = await readFromDisk();
  }
  const now = new Date().toISOString();
  let changed = false;
  const updated = { ...cache };
  for (const id of pluginIds) {
    const entry = updated[id];
    if (entry && !entry.seenAt) {
      updated[id] = { ...entry, seenAt: now };
      changed = true;
    }
  }
  if (changed) {
    await writeToDisk(updated);
  }
}
async function removeFlaggedPlugin(pluginId) {
  if (cache === null) {
    cache = await readFromDisk();
  }
  if (!(pluginId in cache))
    return;
  const { [pluginId]: _, ...rest } = cache;
  cache = rest;
  await writeToDisk(rest);
}
var FLAGGED_PLUGINS_FILENAME = "flagged-plugins.json", SEEN_EXPIRY_MS, cache = null;
var init_pluginFlagging = __esm(() => {
  init_debug();
  init_fsOperations();
  init_log();
  init_slowOperations();
  init_pluginDirectories();
  SEEN_EXPIRY_MS = 48 * 60 * 60 * 1000;
});

export { omit_default, init_omit, init_channelAllowlist, ChannelMessageNotificationSchema, wrapChannelMessage, findChannelEntry, gateChannelServer, init_channelNotification, loadFlaggedPlugins, getFlaggedPlugins, addFlaggedPlugin, markFlaggedPluginsSeen, removeFlaggedPlugin, init_pluginFlagging };
