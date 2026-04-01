// @bun
import {
  Select,
  extractTextContent,
  g,
  init_marked_esm,
  init_messages1 as init_messages,
  init_select,
  stripPromptXMLTags
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
  KeyboardShortcutHint,
  init_Byline,
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
  Pane,
  init_Pane
} from "./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  init_osc,
  require_compiler_runtime,
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
import {
  countCharInString,
  getGlobalConfig,
  init_config1 as init_config,
  init_stringUtils,
  saveGlobalConfig
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
import {
  init_stringWidth,
  stringWidth
} from "./chunk-hsd2zcr5.js";
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
import"./chunk-71hncdva.js";
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

// src/commands/copy/copy.tsx
import { mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
function extractCodeBlocks(markdown) {
  const tokens = g.lexer(stripPromptXMLTags(markdown));
  const blocks = [];
  for (const token of tokens) {
    if (token.type === "code") {
      const codeToken = token;
      blocks.push({
        code: codeToken.text,
        lang: codeToken.lang
      });
    }
  }
  return blocks;
}
function collectRecentAssistantTexts(messages) {
  const texts = [];
  for (let i = messages.length - 1;i >= 0 && texts.length < MAX_LOOKBACK; i--) {
    const msg = messages[i];
    if (msg?.type !== "assistant" || msg.isApiErrorMessage)
      continue;
    const content = msg.message.content;
    if (!Array.isArray(content))
      continue;
    const text = extractTextContent(content, `

`);
    if (text)
      texts.push(text);
  }
  return texts;
}
function fileExtension(lang) {
  if (lang) {
    const sanitized = lang.replace(/[^a-zA-Z0-9]/g, "");
    if (sanitized && sanitized !== "plaintext") {
      return `.${sanitized}`;
    }
  }
  return ".txt";
}
async function writeToFile(text, filename) {
  const filePath = join(COPY_DIR, filename);
  await mkdir(COPY_DIR, {
    recursive: true
  });
  await writeFile(filePath, text, "utf-8");
  return filePath;
}
async function copyOrWriteToFile(text, filename) {
  const raw = await setClipboard(text);
  if (raw)
    process.stdout.write(raw);
  const lineCount = countCharInString(text, `
`) + 1;
  const charCount = text.length;
  try {
    const filePath = await writeToFile(text, filename);
    return `Copied to clipboard (${charCount} characters, ${lineCount} lines)
Also written to ${filePath}`;
  } catch {
    return `Copied to clipboard (${charCount} characters, ${lineCount} lines)`;
  }
}
function truncateLine(text, maxLen) {
  const firstLine = text.split(`
`)[0] ?? "";
  if (stringWidth(firstLine) <= maxLen) {
    return firstLine;
  }
  let result = "";
  let width = 0;
  const targetWidth = maxLen - 1;
  for (const char of firstLine) {
    const charWidth = stringWidth(char);
    if (width + charWidth > targetWidth)
      break;
    result += char;
    width += charWidth;
  }
  return result + "\u2026";
}
function CopyPicker(t0) {
  const $ = import_compiler_runtime.c(33);
  const {
    fullText,
    codeBlocks,
    messageAge,
    onDone
  } = t0;
  const focusedRef = import_react.useRef("full");
  const t1 = `${fullText.length} chars, ${countCharInString(fullText, `
`) + 1} lines`;
  let t2;
  if ($[0] !== t1) {
    t2 = {
      label: "Full response",
      value: "full",
      description: t1
    };
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] !== codeBlocks || $[3] !== t2) {
    let t42;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = {
        label: "Always copy full response",
        value: "always",
        description: "Skip this picker in the future (revert via /config)"
      };
      $[5] = t42;
    } else {
      t42 = $[5];
    }
    t3 = [t2, ...codeBlocks.map(_temp), t42];
    $[2] = codeBlocks;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const options = t3;
  let t4;
  if ($[6] !== codeBlocks || $[7] !== fullText) {
    t4 = function getSelectionContent2(selected) {
      if (selected === "full" || selected === "always") {
        return {
          text: fullText,
          filename: RESPONSE_FILENAME
        };
      }
      const block_0 = codeBlocks[selected];
      return {
        text: block_0.code,
        filename: `copy${fileExtension(block_0.lang)}`,
        blockIndex: selected
      };
    };
    $[6] = codeBlocks;
    $[7] = fullText;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  const getSelectionContent = t4;
  let t5;
  if ($[9] !== codeBlocks.length || $[10] !== getSelectionContent || $[11] !== messageAge || $[12] !== onDone) {
    t5 = async function handleSelect2(selected_0) {
      const content = getSelectionContent(selected_0);
      if (selected_0 === "always") {
        if (!getGlobalConfig().copyFullResponse) {
          saveGlobalConfig(_temp2);
        }
        logEvent("tengu_copy", {
          block_count: codeBlocks.length,
          always: true,
          message_age: messageAge
        });
        const result = await copyOrWriteToFile(content.text, content.filename);
        onDone(`${result}
Preference saved. Use /config to change copyFullResponse`);
        return;
      }
      logEvent("tengu_copy", {
        selected_block: content.blockIndex,
        block_count: codeBlocks.length,
        message_age: messageAge
      });
      const result_0 = await copyOrWriteToFile(content.text, content.filename);
      onDone(result_0);
    };
    $[9] = codeBlocks.length;
    $[10] = getSelectionContent;
    $[11] = messageAge;
    $[12] = onDone;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  const handleSelect = t5;
  let t6;
  if ($[14] !== codeBlocks.length || $[15] !== getSelectionContent || $[16] !== messageAge || $[17] !== onDone) {
    const handleWrite = async function handleWrite2(selected_1) {
      const content_0 = getSelectionContent(selected_1);
      logEvent("tengu_copy", {
        selected_block: content_0.blockIndex,
        block_count: codeBlocks.length,
        message_age: messageAge,
        write_shortcut: true
      });
      try {
        const filePath = await writeToFile(content_0.text, content_0.filename);
        onDone(`Written to ${filePath}`);
      } catch (t72) {
        const e = t72;
        onDone(`Failed to write file: ${e instanceof Error ? e.message : e}`);
      }
    };
    t6 = function handleKeyDown2(e_0) {
      if (e_0.key === "w") {
        e_0.preventDefault();
        handleWrite(focusedRef.current);
      }
    };
    $[14] = codeBlocks.length;
    $[15] = getSelectionContent;
    $[16] = messageAge;
    $[17] = onDone;
    $[18] = t6;
  } else {
    t6 = $[18];
  }
  const handleKeyDown = t6;
  let t7;
  if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Select content to copy:"
    }, undefined, false, undefined, this);
    $[19] = t7;
  } else {
    t7 = $[19];
  }
  let t8;
  if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = (value) => {
      focusedRef.current = value;
    };
    $[20] = t8;
  } else {
    t8 = $[20];
  }
  let t9;
  if ($[21] !== handleSelect) {
    t9 = (selected_2) => {
      handleSelect(selected_2);
    };
    $[21] = handleSelect;
    $[22] = t9;
  } else {
    t9 = $[22];
  }
  let t10;
  if ($[23] !== onDone) {
    t10 = () => {
      onDone("Copy cancelled", {
        display: "system"
      });
    };
    $[23] = onDone;
    $[24] = t10;
  } else {
    t10 = $[24];
  }
  let t11;
  if ($[25] !== options || $[26] !== t10 || $[27] !== t9) {
    t11 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      options,
      hideIndexes: false,
      onFocus: t8,
      onChange: t9,
      onCancel: t10
    }, undefined, false, undefined, this);
    $[25] = options;
    $[26] = t10;
    $[27] = t9;
    $[28] = t11;
  } else {
    t11 = $[28];
  }
  let t12;
  if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
    t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
            shortcut: "enter",
            action: "copy"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
            shortcut: "w",
            action: "write to file"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
            shortcut: "esc",
            action: "cancel"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[29] = t12;
  } else {
    t12 = $[29];
  }
  let t13;
  if ($[30] !== handleKeyDown || $[31] !== t11) {
    t13 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Pane, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        tabIndex: 0,
        autoFocus: true,
        onKeyDown: handleKeyDown,
        children: [
          t7,
          t11,
          t12
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[30] = handleKeyDown;
    $[31] = t11;
    $[32] = t13;
  } else {
    t13 = $[32];
  }
  return t13;
}
function _temp2(c) {
  return {
    ...c,
    copyFullResponse: true
  };
}
function _temp(block, index) {
  const blockLines = countCharInString(block.code, `
`) + 1;
  return {
    label: truncateLine(block.code, 60),
    value: index,
    description: [block.lang, blockLines > 1 ? `${blockLines} lines` : undefined].filter(Boolean).join(", ") || undefined
  };
}
var import_compiler_runtime, import_react, jsx_dev_runtime, COPY_DIR, RESPONSE_FILENAME = "response.md", MAX_LOOKBACK = 20, call = async (onDone, context, args) => {
  const texts = collectRecentAssistantTexts(context.messages);
  if (texts.length === 0) {
    onDone("No assistant message to copy");
    return null;
  }
  let age = 0;
  const arg = args?.trim();
  if (arg) {
    const n = Number(arg);
    if (!Number.isInteger(n) || n < 1) {
      onDone(`Usage: /copy [N] where N is 1 (latest), 2, 3, \u2026 Got: ${arg}`);
      return null;
    }
    if (n > texts.length) {
      onDone(`Only ${texts.length} assistant ${texts.length === 1 ? "message" : "messages"} available to copy`);
      return null;
    }
    age = n - 1;
  }
  const text = texts[age];
  const codeBlocks = extractCodeBlocks(text);
  const config = getGlobalConfig();
  if (codeBlocks.length === 0 || config.copyFullResponse) {
    logEvent("tengu_copy", {
      always: config.copyFullResponse,
      block_count: codeBlocks.length,
      message_age: age
    });
    const result = await copyOrWriteToFile(text, RESPONSE_FILENAME);
    onDone(result);
    return null;
  }
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(CopyPicker, {
    fullText: text,
    codeBlocks,
    messageAge: age,
    onDone
  }, undefined, false, undefined, this);
};
var init_copy = __esm(() => {
  init_marked_esm();
  init_select();
  init_Byline();
  init_KeyboardShortcutHint();
  init_Pane();
  init_stringWidth();
  init_osc();
  init_ink();
  init_analytics();
  init_config();
  init_messages();
  init_stringUtils();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
  COPY_DIR = join(tmpdir(), "claude");
});
init_copy();

export {
  fileExtension,
  collectRecentAssistantTexts,
  call
};
