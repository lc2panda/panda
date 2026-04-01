// @bun
import {
  init_exportRenderer,
  renderMessagesToPlainText
} from "./chunk-207rzda3.js";
import"./chunk-vvw4kdvr.js";
import"./chunk-svmkxy8j.js";
import"./chunk-ngsk090g.js";
import"./chunk-fs7eaved.js";
import"./chunk-yhdqebwk.js";
import"./chunk-w5dxtc43.js";
import"./chunk-akx2s1vj.js";
import"./chunk-tneg63d3.js";
import"./chunk-vy2p8z1v.js";
import"./chunk-y5v4npt0.js";
import"./chunk-y4tgrnzg.js";
import"./chunk-586jhxa4.js";
import {
  Select,
  TextInput,
  init_TextInput,
  init_select
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
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
  init_useTerminalSize,
  useKeybinding,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  init_osc,
  setClipboard
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
import"./chunk-bt6e264h.js";
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
import"./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  init_slowOperations,
  writeFileSync_DEPRECATED
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

// src/components/ExportDialog.tsx
import { join } from "path";
function ExportDialog({
  content,
  defaultFilename,
  onDone
}) {
  const [, setSelectedOption] = import_react.useState(null);
  const [filename, setFilename] = import_react.useState(defaultFilename);
  const [cursorOffset, setCursorOffset] = import_react.useState(defaultFilename.length);
  const [showFilenameInput, setShowFilenameInput] = import_react.useState(false);
  const {
    columns
  } = useTerminalSize();
  const handleGoBack = import_react.useCallback(() => {
    setShowFilenameInput(false);
    setSelectedOption(null);
  }, []);
  const handleSelectOption = async (value) => {
    if (value === "clipboard") {
      const raw = await setClipboard(content);
      if (raw)
        process.stdout.write(raw);
      onDone({
        success: true,
        message: "Conversation copied to clipboard"
      });
    } else if (value === "file") {
      setSelectedOption("file");
      setShowFilenameInput(true);
    }
  };
  const handleFilenameSubmit = () => {
    const finalFilename = filename.endsWith(".txt") ? filename : filename.replace(/\.[^.]+$/, "") + ".txt";
    const filepath = join(getCwd(), finalFilename);
    try {
      writeFileSync_DEPRECATED(filepath, content, {
        encoding: "utf-8",
        flush: true
      });
      onDone({
        success: true,
        message: `Conversation exported to: ${filepath}`
      });
    } catch (error) {
      onDone({
        success: false,
        message: `Failed to export conversation: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  };
  const handleCancel = import_react.useCallback(() => {
    if (showFilenameInput) {
      handleGoBack();
    } else {
      onDone({
        success: false,
        message: "Export cancelled"
      });
    }
  }, [showFilenameInput, handleGoBack, onDone]);
  const options = [{
    label: "Copy to clipboard",
    value: "clipboard",
    description: "Copy the conversation to your system clipboard"
  }, {
    label: "Save to file",
    value: "file",
    description: "Save the conversation to a file in the current directory"
  }];
  function renderInputGuide(exitState) {
    if (showFilenameInput) {
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
            shortcut: "Enter",
            action: "save"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
            action: "confirm:no",
            context: "Confirmation",
            fallback: "Esc",
            description: "go back"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
    }
    if (exitState.pending) {
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: [
          "Press ",
          exitState.keyName,
          " again to exit"
        ]
      }, undefined, true, undefined, this);
    }
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
      action: "confirm:no",
      context: "Confirmation",
      fallback: "Esc",
      description: "cancel"
    }, undefined, false, undefined, this);
  }
  useKeybinding("confirm:no", handleCancel, {
    context: "Settings",
    isActive: showFilenameInput
  });
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
    title: "Export Conversation",
    subtitle: "Select export method:",
    color: "permission",
    onCancel: handleCancel,
    inputGuide: renderInputGuide,
    isCancelActive: !showFilenameInput,
    children: !showFilenameInput ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      options,
      onChange: handleSelectOption,
      onCancel: handleCancel
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "Enter filename:"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
          flexDirection: "row",
          gap: 1,
          marginTop: 1,
          children: [
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: ">"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime.jsxDEV(TextInput, {
              value: filename,
              onChange: setFilename,
              onSubmit: handleFilenameSubmit,
              focus: true,
              showCursor: true,
              columns,
              cursorOffset,
              onChangeCursorOffset: setCursorOffset
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
var import_react, jsx_dev_runtime;
var init_ExportDialog = __esm(() => {
  init_useTerminalSize();
  init_osc();
  init_ink();
  init_useKeybinding();
  init_cwd();
  init_slowOperations();
  init_ConfigurableShortcutHint();
  init_select();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  init_TextInput();
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/export/export.tsx
import { join as join2 } from "path";
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}
function extractFirstPrompt(messages) {
  const firstUserMessage = messages.find((msg) => msg.type === "user");
  if (!firstUserMessage || firstUserMessage.type !== "user") {
    return "";
  }
  const content = firstUserMessage.message?.content;
  let result = "";
  if (typeof content === "string") {
    result = content.trim();
  } else if (Array.isArray(content)) {
    const textContent = content.find((item) => item.type === "text");
    if (textContent && "text" in textContent) {
      result = textContent.text.trim();
    }
  }
  result = result.split(`
`)[0] || "";
  if (result.length > 50) {
    result = result.substring(0, 49) + "\u2026";
  }
  return result;
}
function sanitizeFilename(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
async function exportWithReactRenderer(context) {
  const tools = context.options.tools || [];
  return renderMessagesToPlainText(context.messages, tools);
}
async function call(onDone, context, args) {
  const content = await exportWithReactRenderer(context);
  const filename = args.trim();
  if (filename) {
    const finalFilename = filename.endsWith(".txt") ? filename : filename.replace(/\.[^.]+$/, "") + ".txt";
    const filepath = join2(getCwd(), finalFilename);
    try {
      writeFileSync_DEPRECATED(filepath, content, {
        encoding: "utf-8",
        flush: true
      });
      onDone(`Conversation exported to: ${filepath}`);
      return null;
    } catch (error) {
      onDone(`Failed to export conversation: ${error instanceof Error ? error.message : "Unknown error"}`);
      return null;
    }
  }
  const firstPrompt = extractFirstPrompt(context.messages);
  const timestamp = formatTimestamp(new Date);
  let defaultFilename;
  if (firstPrompt) {
    const sanitized = sanitizeFilename(firstPrompt);
    defaultFilename = sanitized ? `${timestamp}-${sanitized}.txt` : `conversation-${timestamp}.txt`;
  } else {
    defaultFilename = `conversation-${timestamp}.txt`;
  }
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ExportDialog, {
    content,
    defaultFilename,
    onDone: (result) => {
      onDone(result.message);
    }
  }, undefined, false, undefined, this);
}
var jsx_dev_runtime2;
var init_export = __esm(() => {
  init_ExportDialog();
  init_cwd();
  init_exportRenderer();
  init_slowOperations();
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});
init_export();

export {
  sanitizeFilename,
  extractFirstPrompt,
  call
};
