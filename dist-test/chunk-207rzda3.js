// @bun
import {
  Messages,
  init_Messages
} from "./chunk-vvw4kdvr.js";
import {
  init_staticRender,
  renderToAnsiString
} from "./chunk-akx2s1vj.js";
import {
  AppStateProvider,
  init_AppState,
  init_loadUserBindings,
  loadKeybindingsSyncWithWarnings
} from "./chunk-jwtmq3ad.js";
import {
  KeybindingProvider,
  init_KeybindingContext
} from "./chunk-x2y5syym.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_strip_ansi,
  stripAnsi
} from "./chunk-hsd2zcr5.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/utils/exportRenderer.tsx
function StaticKeybindingProvider({
  children
}) {
  const {
    bindings
  } = loadKeybindingsSyncWithWarnings();
  const pendingChordRef = import_react.useRef(null);
  const handlerRegistryRef = import_react.useRef(new Map);
  const activeContexts = import_react.useRef(new Set).current;
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeybindingProvider, {
    bindings,
    pendingChordRef,
    pendingChord: null,
    setPendingChord: () => {},
    activeContexts,
    registerActiveContext: () => {},
    unregisterActiveContext: () => {},
    handlerRegistryRef,
    children
  }, undefined, false, undefined, this);
}
function normalizedUpperBound(m) {
  if (!("message" in m))
    return 1;
  const c = m.message.content;
  return Array.isArray(c) ? c.length : 1;
}
async function streamRenderedMessages(messages, tools, sink, {
  columns,
  verbose = false,
  chunkSize = 40,
  onProgress
} = {}) {
  const renderChunk = (range) => renderToAnsiString(/* @__PURE__ */ jsx_dev_runtime.jsxDEV(AppStateProvider, {
    children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(StaticKeybindingProvider, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Messages, {
        messages,
        tools,
        commands: [],
        verbose,
        toolJSX: null,
        toolUseConfirmQueue: [],
        inProgressToolUseIDs: new Set,
        isMessageSelectorVisible: false,
        conversationId: "export",
        screen: "prompt",
        streamingToolUses: [],
        showAllInTranscript: true,
        isLoading: false,
        renderRange: range
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this), columns);
  let ceiling = chunkSize;
  for (const m of messages)
    ceiling += normalizedUpperBound(m);
  for (let offset = 0;offset < ceiling; offset += chunkSize) {
    const ansi = await renderChunk([offset, offset + chunkSize]);
    if (stripAnsi(ansi).trim() === "")
      break;
    await sink(ansi);
    onProgress?.(offset + chunkSize);
  }
}
async function renderMessagesToPlainText(messages, tools = [], columns) {
  const parts = [];
  await streamRenderedMessages(messages, tools, (chunk) => void parts.push(stripAnsi(chunk)), {
    columns
  });
  return parts.join("");
}
var import_react, jsx_dev_runtime;
var init_exportRenderer = __esm(() => {
  init_strip_ansi();
  init_Messages();
  init_KeybindingContext();
  init_loadUserBindings();
  init_AppState();
  init_staticRender();
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { renderMessagesToPlainText, init_exportRenderer };
