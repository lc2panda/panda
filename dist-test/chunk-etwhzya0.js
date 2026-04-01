// @bun
import {
  StructuredDiff,
  fetchGitDiff,
  fetchGitDiffHunks,
  init_StructuredDiff,
  init_gitDiff,
  init_overlayContext,
  useRegisterOverlay
} from "./chunk-wk0emb79.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import {
  Byline,
  Dialog,
  init_Byline,
  init_Dialog,
  init_useShortcutDisplay,
  useShortcutDisplay
} from "./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-ngnveex9.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-2e5y8sgq.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-zz424j25.js";
import"./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import {
  Divider,
  init_Divider,
  init_useKeybinding,
  init_useTerminalSize,
  useKeybindings,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
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
  init_file,
  init_stringUtils,
  plural,
  readFileSafe
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
  init_format,
  truncateStartToWidth
} from "./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import"./chunk-h0rbjg6x.js";
import"./chunk-s85yj5xm.js";
import"./chunk-73q6p10n.js";
import"./chunk-8qg6qavk.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-14j8jv5j.js";
import"./chunk-0xqnccz6.js";
import {
  figures_default,
  init_figures
} from "./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
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

// src/hooks/useDiffData.ts
function useDiffData() {
  const [diffResult, setDiffResult] = import_react.useState(null);
  const [hunks, setHunks] = import_react.useState(new Map);
  const [loading, setLoading] = import_react.useState(true);
  import_react.useEffect(() => {
    let cancelled = false;
    async function loadDiffData() {
      try {
        const [statsResult, hunksResult] = await Promise.all([
          fetchGitDiff(),
          fetchGitDiffHunks()
        ]);
        if (!cancelled) {
          setDiffResult(statsResult);
          setHunks(hunksResult);
          setLoading(false);
        }
      } catch (_error) {
        if (!cancelled) {
          setDiffResult(null);
          setHunks(new Map);
          setLoading(false);
        }
      }
    }
    loadDiffData();
    return () => {
      cancelled = true;
    };
  }, []);
  return import_react.useMemo(() => {
    if (!diffResult) {
      return { stats: null, files: [], hunks: new Map, loading };
    }
    const { stats, perFileStats } = diffResult;
    const files = [];
    for (const [path, fileStats] of perFileStats) {
      const fileHunks = hunks.get(path);
      const isUntracked = fileStats.isUntracked ?? false;
      const isLargeFile = !fileStats.isBinary && !isUntracked && !fileHunks;
      const totalLines = fileStats.added + fileStats.removed;
      const isTruncated = !isLargeFile && !fileStats.isBinary && totalLines > MAX_LINES_PER_FILE;
      files.push({
        path,
        linesAdded: fileStats.added,
        linesRemoved: fileStats.removed,
        isBinary: fileStats.isBinary,
        isLargeFile,
        isTruncated,
        isUntracked
      });
    }
    files.sort((a, b) => a.path.localeCompare(b.path));
    return { stats, files, hunks, loading: false };
  }, [diffResult, hunks, loading]);
}
var import_react, MAX_LINES_PER_FILE = 400;
var init_useDiffData = __esm(() => {
  init_gitDiff();
  import_react = __toESM(require_react(), 1);
});

// src/hooks/useTurnDiffs.ts
function isFileEditResult(result) {
  if (!result || typeof result !== "object")
    return false;
  const r = result;
  const hasFilePath = typeof r.filePath === "string";
  const hasStructuredPatch = Array.isArray(r.structuredPatch) && r.structuredPatch.length > 0;
  const isNewFile = r.type === "create" && typeof r.content === "string";
  return hasFilePath && (hasStructuredPatch || isNewFile);
}
function isFileWriteOutput(result) {
  return "type" in result && (result.type === "create" || result.type === "update");
}
function countHunkLines(hunks) {
  let added = 0;
  let removed = 0;
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.startsWith("+"))
        added++;
      else if (line.startsWith("-"))
        removed++;
    }
  }
  return { added, removed };
}
function getUserPromptPreview(message) {
  if (message.type !== "user")
    return "";
  const content = message.message.content;
  const text = typeof content === "string" ? content : "";
  if (text.length <= 30)
    return text;
  return text.slice(0, 29) + "\u2026";
}
function computeTurnStats(turn) {
  let totalAdded = 0;
  let totalRemoved = 0;
  for (const file of turn.files.values()) {
    totalAdded += file.linesAdded;
    totalRemoved += file.linesRemoved;
  }
  turn.stats = {
    filesChanged: turn.files.size,
    linesAdded: totalAdded,
    linesRemoved: totalRemoved
  };
}
function useTurnDiffs(messages) {
  const cache = import_react2.useRef({
    completedTurns: [],
    currentTurn: null,
    lastProcessedIndex: 0,
    lastTurnIndex: 0
  });
  return import_react2.useMemo(() => {
    const c = cache.current;
    if (messages.length < c.lastProcessedIndex) {
      c.completedTurns = [];
      c.currentTurn = null;
      c.lastProcessedIndex = 0;
      c.lastTurnIndex = 0;
    }
    for (let i = c.lastProcessedIndex;i < messages.length; i++) {
      const message = messages[i];
      if (!message || message.type !== "user")
        continue;
      const isToolResult = message.toolUseResult || Array.isArray(message.message.content) && message.message.content[0]?.type === "tool_result";
      if (!isToolResult && !message.isMeta) {
        if (c.currentTurn && c.currentTurn.files.size > 0) {
          computeTurnStats(c.currentTurn);
          c.completedTurns.push(c.currentTurn);
        }
        c.lastTurnIndex++;
        c.currentTurn = {
          turnIndex: c.lastTurnIndex,
          userPromptPreview: getUserPromptPreview(message),
          timestamp: message.timestamp,
          files: new Map,
          stats: { filesChanged: 0, linesAdded: 0, linesRemoved: 0 }
        };
      } else if (c.currentTurn && message.toolUseResult) {
        const result2 = message.toolUseResult;
        if (isFileEditResult(result2)) {
          const { filePath, structuredPatch } = result2;
          const isNewFile = "type" in result2 && result2.type === "create";
          let fileEntry = c.currentTurn.files.get(filePath);
          if (!fileEntry) {
            fileEntry = {
              filePath,
              hunks: [],
              isNewFile,
              linesAdded: 0,
              linesRemoved: 0
            };
            c.currentTurn.files.set(filePath, fileEntry);
          }
          if (isNewFile && structuredPatch.length === 0 && isFileWriteOutput(result2)) {
            const content = result2.content;
            const lines = content.split(`
`);
            const syntheticHunk = {
              oldStart: 0,
              oldLines: 0,
              newStart: 1,
              newLines: lines.length,
              lines: lines.map((l) => "+" + l)
            };
            fileEntry.hunks.push(syntheticHunk);
            fileEntry.linesAdded += lines.length;
          } else {
            fileEntry.hunks.push(...structuredPatch);
            const { added, removed } = countHunkLines(structuredPatch);
            fileEntry.linesAdded += added;
            fileEntry.linesRemoved += removed;
          }
          if (isNewFile) {
            fileEntry.isNewFile = true;
          }
        }
      }
    }
    c.lastProcessedIndex = messages.length;
    const result = [...c.completedTurns];
    if (c.currentTurn && c.currentTurn.files.size > 0) {
      computeTurnStats(c.currentTurn);
      result.push(c.currentTurn);
    }
    return result.reverse();
  }, [messages]);
}
var import_react2;
var init_useTurnDiffs = __esm(() => {
  import_react2 = __toESM(require_react(), 1);
});

// src/components/diff/DiffDetailView.tsx
import { resolve } from "path";
function DiffDetailView(t0) {
  const $ = import_compiler_runtime.c(53);
  const {
    filePath,
    hunks,
    isLargeFile,
    isBinary,
    isTruncated,
    isUntracked
  } = t0;
  const {
    columns
  } = useTerminalSize();
  let t1;
  bb0: {
    if (!filePath) {
      let t23;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t23 = {
          firstLine: null,
          fileContent: undefined
        };
        $[0] = t23;
      } else {
        t23 = $[0];
      }
      t1 = t23;
      break bb0;
    }
    let content;
    let t22;
    if ($[1] !== filePath) {
      const fullPath = resolve(getCwd(), filePath);
      content = readFileSafe(fullPath);
      t22 = content?.split(`
`)[0] ?? null;
      $[1] = filePath;
      $[2] = content;
      $[3] = t22;
    } else {
      content = $[2];
      t22 = $[3];
    }
    const t32 = content ?? undefined;
    let t42;
    if ($[4] !== t22 || $[5] !== t32) {
      t42 = {
        firstLine: t22,
        fileContent: t32
      };
      $[4] = t22;
      $[5] = t32;
      $[6] = t42;
    } else {
      t42 = $[6];
    }
    t1 = t42;
  }
  const {
    firstLine,
    fileContent
  } = t1;
  if (isUntracked) {
    let t22;
    if ($[7] !== filePath) {
      t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        bold: true,
        children: filePath
      }, undefined, false, undefined, this);
      $[7] = filePath;
      $[8] = t22;
    } else {
      t22 = $[8];
    }
    let t32;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      t32 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: " (untracked)"
      }, undefined, false, undefined, this);
      $[9] = t32;
    } else {
      t32 = $[9];
    }
    let t42;
    if ($[10] !== t22) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: [
          t22,
          t32
        ]
      }, undefined, true, undefined, this);
      $[10] = t22;
      $[11] = t42;
    } else {
      t42 = $[11];
    }
    let t52;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Divider, {
        padding: 4
      }, undefined, false, undefined, this);
      $[12] = t52;
    } else {
      t52 = $[12];
    }
    let t62;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      t62 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: "New file not yet staged."
      }, undefined, false, undefined, this);
      $[13] = t62;
    } else {
      t62 = $[13];
    }
    let t72;
    if ($[14] !== filePath) {
      t72 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t62,
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: [
              "Run `git add ",
              filePath,
              "` to see line counts."
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[14] = filePath;
      $[15] = t72;
    } else {
      t72 = $[15];
    }
    let t82;
    if ($[16] !== t42 || $[17] !== t72) {
      t82 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        width: "100%",
        children: [
          t42,
          t52,
          t72
        ]
      }, undefined, true, undefined, this);
      $[16] = t42;
      $[17] = t72;
      $[18] = t82;
    } else {
      t82 = $[18];
    }
    return t82;
  }
  if (isBinary) {
    let t22;
    if ($[19] !== filePath) {
      t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: filePath
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[19] = filePath;
      $[20] = t22;
    } else {
      t22 = $[20];
    }
    let t32;
    if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
      t32 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Divider, {
        padding: 4
      }, undefined, false, undefined, this);
      $[21] = t32;
    } else {
      t32 = $[21];
    }
    let t42;
    if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          italic: true,
          children: "Binary file - cannot display diff"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[22] = t42;
    } else {
      t42 = $[22];
    }
    let t52;
    if ($[23] !== t22) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        width: "100%",
        children: [
          t22,
          t32,
          t42
        ]
      }, undefined, true, undefined, this);
      $[23] = t22;
      $[24] = t52;
    } else {
      t52 = $[24];
    }
    return t52;
  }
  if (isLargeFile) {
    let t22;
    if ($[25] !== filePath) {
      t22 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          bold: true,
          children: filePath
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[25] = filePath;
      $[26] = t22;
    } else {
      t22 = $[26];
    }
    let t32;
    if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
      t32 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Divider, {
        padding: 4
      }, undefined, false, undefined, this);
      $[27] = t32;
    } else {
      t32 = $[27];
    }
    let t42;
    if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          italic: true,
          children: "Large file - diff exceeds 1 MB limit"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[28] = t42;
    } else {
      t42 = $[28];
    }
    let t52;
    if ($[29] !== t22) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        width: "100%",
        children: [
          t22,
          t32,
          t42
        ]
      }, undefined, true, undefined, this);
      $[29] = t22;
      $[30] = t52;
    } else {
      t52 = $[30];
    }
    return t52;
  }
  let t2;
  if ($[31] !== filePath) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: filePath
    }, undefined, false, undefined, this);
    $[31] = filePath;
    $[32] = t2;
  } else {
    t2 = $[32];
  }
  let t3;
  if ($[33] !== isTruncated) {
    t3 = isTruncated && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: " (truncated)"
    }, undefined, false, undefined, this);
    $[33] = isTruncated;
    $[34] = t3;
  } else {
    t3 = $[34];
  }
  let t4;
  if ($[35] !== t2 || $[36] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: [
        t2,
        t3
      ]
    }, undefined, true, undefined, this);
    $[35] = t2;
    $[36] = t3;
    $[37] = t4;
  } else {
    t4 = $[37];
  }
  let t5;
  if ($[38] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Divider, {
      padding: 4
    }, undefined, false, undefined, this);
    $[38] = t5;
  } else {
    t5 = $[38];
  }
  let t6;
  if ($[39] !== columns || $[40] !== fileContent || $[41] !== filePath || $[42] !== firstLine || $[43] !== hunks) {
    t6 = hunks.length === 0 ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "No diff content"
    }, undefined, false, undefined, this) : hunks.map((hunk, index) => /* @__PURE__ */ jsx_dev_runtime.jsxDEV(StructuredDiff, {
      patch: hunk,
      filePath,
      firstLine,
      fileContent,
      dim: false,
      width: columns - 2 - 2
    }, index, false, undefined, this));
    $[39] = columns;
    $[40] = fileContent;
    $[41] = filePath;
    $[42] = firstLine;
    $[43] = hunks;
    $[44] = t6;
  } else {
    t6 = $[44];
  }
  let t7;
  if ($[45] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: t6
    }, undefined, false, undefined, this);
    $[45] = t6;
    $[46] = t7;
  } else {
    t7 = $[46];
  }
  let t8;
  if ($[47] !== isTruncated) {
    t8 = isTruncated && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      italic: true,
      children: "\u2026 diff truncated (exceeded 400 line limit)"
    }, undefined, false, undefined, this);
    $[47] = isTruncated;
    $[48] = t8;
  } else {
    t8 = $[48];
  }
  let t9;
  if ($[49] !== t4 || $[50] !== t7 || $[51] !== t8) {
    t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      width: "100%",
      children: [
        t4,
        t5,
        t7,
        t8
      ]
    }, undefined, true, undefined, this);
    $[49] = t4;
    $[50] = t7;
    $[51] = t8;
    $[52] = t9;
  } else {
    t9 = $[52];
  }
  return t9;
}
var import_compiler_runtime, jsx_dev_runtime;
var init_DiffDetailView = __esm(() => {
  init_useTerminalSize();
  init_ink();
  init_cwd();
  init_file();
  init_Divider();
  init_StructuredDiff();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/diff/DiffFileList.tsx
function DiffFileList(t0) {
  const $ = import_compiler_runtime2.c(36);
  const {
    files,
    selectedIndex
  } = t0;
  const {
    columns
  } = useTerminalSize();
  let t1;
  bb0: {
    if (files.length === 0 || files.length <= MAX_VISIBLE_FILES) {
      let t23;
      if ($[0] !== files.length) {
        t23 = {
          startIndex: 0,
          endIndex: files.length
        };
        $[0] = files.length;
        $[1] = t23;
      } else {
        t23 = $[1];
      }
      t1 = t23;
      break bb0;
    }
    let start = Math.max(0, selectedIndex - Math.floor(MAX_VISIBLE_FILES / 2));
    let end = start + MAX_VISIBLE_FILES;
    if (end > files.length) {
      end = files.length;
      start = Math.max(0, end - MAX_VISIBLE_FILES);
    }
    let t22;
    if ($[2] !== end || $[3] !== start) {
      t22 = {
        startIndex: start,
        endIndex: end
      };
      $[2] = end;
      $[3] = start;
      $[4] = t22;
    } else {
      t22 = $[4];
    }
    t1 = t22;
  }
  const {
    startIndex,
    endIndex
  } = t1;
  if (files.length === 0) {
    let t22;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t22 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: "No changed files"
      }, undefined, false, undefined, this);
      $[5] = t22;
    } else {
      t22 = $[5];
    }
    return t22;
  }
  let T0;
  let hasMoreBelow;
  let needsPagination;
  let t2;
  let t3;
  let t4;
  if ($[6] !== columns || $[7] !== endIndex || $[8] !== files || $[9] !== selectedIndex || $[10] !== startIndex) {
    const visibleFiles = files.slice(startIndex, endIndex);
    const hasMoreAbove = startIndex > 0;
    hasMoreBelow = endIndex < files.length;
    needsPagination = files.length > MAX_VISIBLE_FILES;
    const maxPathWidth = Math.max(20, columns - 16 - 3 - 4);
    T0 = ThemedBox_default;
    t2 = "column";
    if ($[17] !== hasMoreAbove || $[18] !== needsPagination || $[19] !== startIndex) {
      t3 = needsPagination && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: hasMoreAbove ? ` \u2191 ${startIndex} more ${plural(startIndex, "file")}` : " "
      }, undefined, false, undefined, this);
      $[17] = hasMoreAbove;
      $[18] = needsPagination;
      $[19] = startIndex;
      $[20] = t3;
    } else {
      t3 = $[20];
    }
    let t52;
    if ($[21] !== maxPathWidth || $[22] !== selectedIndex || $[23] !== startIndex) {
      t52 = (file, index) => /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(FileItem, {
        file,
        isSelected: startIndex + index === selectedIndex,
        maxPathWidth
      }, file.path, false, undefined, this);
      $[21] = maxPathWidth;
      $[22] = selectedIndex;
      $[23] = startIndex;
      $[24] = t52;
    } else {
      t52 = $[24];
    }
    t4 = visibleFiles.map(t52);
    $[6] = columns;
    $[7] = endIndex;
    $[8] = files;
    $[9] = selectedIndex;
    $[10] = startIndex;
    $[11] = T0;
    $[12] = hasMoreBelow;
    $[13] = needsPagination;
    $[14] = t2;
    $[15] = t3;
    $[16] = t4;
  } else {
    T0 = $[11];
    hasMoreBelow = $[12];
    needsPagination = $[13];
    t2 = $[14];
    t3 = $[15];
    t4 = $[16];
  }
  let t5;
  if ($[25] !== endIndex || $[26] !== files.length || $[27] !== hasMoreBelow || $[28] !== needsPagination) {
    t5 = needsPagination && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: hasMoreBelow ? ` \u2193 ${files.length - endIndex} more ${plural(files.length - endIndex, "file")}` : " "
    }, undefined, false, undefined, this);
    $[25] = endIndex;
    $[26] = files.length;
    $[27] = hasMoreBelow;
    $[28] = needsPagination;
    $[29] = t5;
  } else {
    t5 = $[29];
  }
  let t6;
  if ($[30] !== T0 || $[31] !== t2 || $[32] !== t3 || $[33] !== t4 || $[34] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(T0, {
      flexDirection: t2,
      children: [
        t3,
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[30] = T0;
    $[31] = t2;
    $[32] = t3;
    $[33] = t4;
    $[34] = t5;
    $[35] = t6;
  } else {
    t6 = $[35];
  }
  return t6;
}
function FileItem(t0) {
  const $ = import_compiler_runtime2.c(14);
  const {
    file,
    isSelected,
    maxPathWidth
  } = t0;
  let t1;
  if ($[0] !== file.path || $[1] !== maxPathWidth) {
    t1 = truncateStartToWidth(file.path, maxPathWidth);
    $[0] = file.path;
    $[1] = maxPathWidth;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const displayPath = t1;
  const pointer = isSelected ? figures_default.pointer + " " : "  ";
  const line = `${pointer}${displayPath}`;
  const t2 = isSelected ? "background" : undefined;
  let t3;
  if ($[3] !== isSelected || $[4] !== line || $[5] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      bold: isSelected,
      color: t2,
      inverse: isSelected,
      children: line
    }, undefined, false, undefined, this);
    $[3] = isSelected;
    $[4] = line;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexGrow: 1
    }, undefined, false, undefined, this);
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== file || $[9] !== isSelected) {
    t5 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(FileStats, {
      file,
      isSelected
    }, undefined, false, undefined, this);
    $[8] = file;
    $[9] = isSelected;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  let t6;
  if ($[11] !== t3 || $[12] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "row",
      children: [
        t3,
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[11] = t3;
    $[12] = t5;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  return t6;
}
function FileStats(t0) {
  const $ = import_compiler_runtime2.c(20);
  const {
    file,
    isSelected
  } = t0;
  if (file.isUntracked) {
    const t12 = !isSelected;
    let t22;
    if ($[0] !== t12) {
      t22 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: t12,
        italic: true,
        children: "untracked"
      }, undefined, false, undefined, this);
      $[0] = t12;
      $[1] = t22;
    } else {
      t22 = $[1];
    }
    return t22;
  }
  if (file.isBinary) {
    const t12 = !isSelected;
    let t22;
    if ($[2] !== t12) {
      t22 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: t12,
        italic: true,
        children: "Binary file"
      }, undefined, false, undefined, this);
      $[2] = t12;
      $[3] = t22;
    } else {
      t22 = $[3];
    }
    return t22;
  }
  if (file.isLargeFile) {
    const t12 = !isSelected;
    let t22;
    if ($[4] !== t12) {
      t22 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: t12,
        italic: true,
        children: "Large file modified"
      }, undefined, false, undefined, this);
      $[4] = t12;
      $[5] = t22;
    } else {
      t22 = $[5];
    }
    return t22;
  }
  let t1;
  if ($[6] !== file.linesAdded || $[7] !== isSelected) {
    t1 = file.linesAdded > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      color: "diffAddedWord",
      bold: isSelected,
      children: [
        "+",
        file.linesAdded
      ]
    }, undefined, true, undefined, this);
    $[6] = file.linesAdded;
    $[7] = isSelected;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  const t2 = file.linesAdded > 0 && file.linesRemoved > 0 && " ";
  let t3;
  if ($[9] !== file.linesRemoved || $[10] !== isSelected) {
    t3 = file.linesRemoved > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      color: "diffRemovedWord",
      bold: isSelected,
      children: [
        "-",
        file.linesRemoved
      ]
    }, undefined, true, undefined, this);
    $[9] = file.linesRemoved;
    $[10] = isSelected;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  let t4;
  if ($[12] !== file.isTruncated || $[13] !== isSelected) {
    t4 = file.isTruncated && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: !isSelected,
      children: " (truncated)"
    }, undefined, false, undefined, this);
    $[12] = file.isTruncated;
    $[13] = isSelected;
    $[14] = t4;
  } else {
    t4 = $[14];
  }
  let t5;
  if ($[15] !== t1 || $[16] !== t2 || $[17] !== t3 || $[18] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      children: [
        t1,
        t2,
        t3,
        t4
      ]
    }, undefined, true, undefined, this);
    $[15] = t1;
    $[16] = t2;
    $[17] = t3;
    $[18] = t4;
    $[19] = t5;
  } else {
    t5 = $[19];
  }
  return t5;
}
var import_compiler_runtime2, jsx_dev_runtime2, MAX_VISIBLE_FILES = 5;
var init_DiffFileList = __esm(() => {
  init_figures();
  init_useTerminalSize();
  init_ink();
  init_format();
  init_stringUtils();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/diff/DiffDialog.tsx
function turnDiffToDiffData(turn) {
  const files = Array.from(turn.files.values()).map((f) => ({
    path: f.filePath,
    linesAdded: f.linesAdded,
    linesRemoved: f.linesRemoved,
    isBinary: false,
    isLargeFile: false,
    isTruncated: false,
    isNewFile: f.isNewFile
  })).sort((a, b) => a.path.localeCompare(b.path));
  const hunks = new Map;
  for (const f of turn.files.values()) {
    hunks.set(f.filePath, f.hunks);
  }
  return {
    stats: {
      filesCount: turn.stats.filesChanged,
      linesAdded: turn.stats.linesAdded,
      linesRemoved: turn.stats.linesRemoved
    },
    files,
    hunks,
    loading: false
  };
}
function DiffDialog(t0) {
  const $ = import_compiler_runtime3.c(73);
  const {
    messages,
    onDone
  } = t0;
  const gitDiffData = useDiffData();
  const turnDiffs = useTurnDiffs(messages);
  const [viewMode, setViewMode] = import_react3.useState("list");
  const [selectedIndex, setSelectedIndex] = import_react3.useState(0);
  const [sourceIndex, setSourceIndex] = import_react3.useState(0);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      type: "current"
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== turnDiffs) {
    t2 = [t1, ...turnDiffs.map(_temp)];
    $[1] = turnDiffs;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const sources = t2;
  const currentSource = sources[sourceIndex];
  const currentTurn = currentSource?.type === "turn" ? currentSource.turn : null;
  let t3;
  if ($[3] !== currentTurn || $[4] !== gitDiffData) {
    t3 = currentTurn ? turnDiffToDiffData(currentTurn) : gitDiffData;
    $[3] = currentTurn;
    $[4] = gitDiffData;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const diffData = t3;
  const selectedFile = diffData.files[selectedIndex];
  let t4;
  if ($[6] !== diffData.hunks || $[7] !== selectedFile) {
    t4 = selectedFile ? diffData.hunks.get(selectedFile.path) || [] : [];
    $[6] = diffData.hunks;
    $[7] = selectedFile;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  const selectedHunks = t4;
  let t5;
  let t6;
  if ($[9] !== sourceIndex || $[10] !== sources.length) {
    t5 = () => {
      if (sourceIndex >= sources.length) {
        setSourceIndex(Math.max(0, sources.length - 1));
      }
    };
    t6 = [sources.length, sourceIndex];
    $[9] = sourceIndex;
    $[10] = sources.length;
    $[11] = t5;
    $[12] = t6;
  } else {
    t5 = $[11];
    t6 = $[12];
  }
  import_react3.useEffect(t5, t6);
  const prevSourceIndex = import_react3.useRef(sourceIndex);
  let t7;
  let t8;
  if ($[13] !== sourceIndex) {
    t7 = () => {
      if (prevSourceIndex.current !== sourceIndex) {
        setSelectedIndex(0);
        prevSourceIndex.current = sourceIndex;
      }
    };
    t8 = [sourceIndex];
    $[13] = sourceIndex;
    $[14] = t7;
    $[15] = t8;
  } else {
    t7 = $[14];
    t8 = $[15];
  }
  import_react3.useEffect(t7, t8);
  useRegisterOverlay("diff-dialog", undefined);
  let t10;
  let t9;
  if ($[16] !== sources.length || $[17] !== viewMode) {
    t9 = () => {
      if (viewMode === "detail") {
        setViewMode("list");
      } else {
        if (viewMode === "list" && sources.length > 1) {
          setSourceIndex(_temp2);
        }
      }
    };
    t10 = () => {
      if (viewMode === "list" && sources.length > 1) {
        setSourceIndex((prev_0) => Math.min(sources.length - 1, prev_0 + 1));
      }
    };
    $[16] = sources.length;
    $[17] = viewMode;
    $[18] = t10;
    $[19] = t9;
  } else {
    t10 = $[18];
    t9 = $[19];
  }
  let t11;
  if ($[20] !== viewMode) {
    t11 = () => {
      if (viewMode === "detail") {
        setViewMode("list");
      }
    };
    $[20] = viewMode;
    $[21] = t11;
  } else {
    t11 = $[21];
  }
  let t12;
  if ($[22] !== selectedFile || $[23] !== viewMode) {
    t12 = () => {
      if (viewMode === "list" && selectedFile) {
        setViewMode("detail");
      }
    };
    $[22] = selectedFile;
    $[23] = viewMode;
    $[24] = t12;
  } else {
    t12 = $[24];
  }
  let t13;
  if ($[25] !== viewMode) {
    t13 = () => {
      if (viewMode === "list") {
        setSelectedIndex(_temp3);
      }
    };
    $[25] = viewMode;
    $[26] = t13;
  } else {
    t13 = $[26];
  }
  let t14;
  if ($[27] !== diffData.files.length || $[28] !== viewMode) {
    t14 = () => {
      if (viewMode === "list") {
        setSelectedIndex((prev_2) => Math.min(diffData.files.length - 1, prev_2 + 1));
      }
    };
    $[27] = diffData.files.length;
    $[28] = viewMode;
    $[29] = t14;
  } else {
    t14 = $[29];
  }
  let t15;
  if ($[30] !== t10 || $[31] !== t11 || $[32] !== t12 || $[33] !== t13 || $[34] !== t14 || $[35] !== t9) {
    t15 = {
      "diff:previousSource": t9,
      "diff:nextSource": t10,
      "diff:back": t11,
      "diff:viewDetails": t12,
      "diff:previousFile": t13,
      "diff:nextFile": t14
    };
    $[30] = t10;
    $[31] = t11;
    $[32] = t12;
    $[33] = t13;
    $[34] = t14;
    $[35] = t9;
    $[36] = t15;
  } else {
    t15 = $[36];
  }
  let t16;
  if ($[37] === Symbol.for("react.memo_cache_sentinel")) {
    t16 = {
      context: "DiffDialog"
    };
    $[37] = t16;
  } else {
    t16 = $[37];
  }
  useKeybindings(t15, t16);
  let t17;
  if ($[38] !== diffData.stats) {
    t17 = diffData.stats ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        diffData.stats.filesCount,
        " ",
        plural(diffData.stats.filesCount, "file"),
        " ",
        "changed",
        diffData.stats.linesAdded > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          color: "diffAddedWord",
          children: [
            " +",
            diffData.stats.linesAdded
          ]
        }, undefined, true, undefined, this),
        diffData.stats.linesRemoved > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          color: "diffRemovedWord",
          children: [
            " -",
            diffData.stats.linesRemoved
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this) : null;
    $[38] = diffData.stats;
    $[39] = t17;
  } else {
    t17 = $[39];
  }
  const subtitle = t17;
  const headerTitle = currentTurn ? `Turn ${currentTurn.turnIndex}` : "Uncommitted changes";
  const headerSubtitle = currentTurn ? currentTurn.userPromptPreview ? `"${currentTurn.userPromptPreview}"` : "" : "(git diff HEAD)";
  let t18;
  if ($[40] !== sourceIndex || $[41] !== sources) {
    t18 = sources.length > 1 ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      children: [
        sourceIndex > 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          dimColor: true,
          children: "\u25C0 "
        }, undefined, false, undefined, this),
        sources.map((source, i) => {
          const isSelected = i === sourceIndex;
          const label = source.type === "current" ? "Current" : `T${source.turn.turnIndex}`;
          return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
            dimColor: !isSelected,
            bold: isSelected,
            children: [
              i > 0 ? " \xB7 " : "",
              label
            ]
          }, i, true, undefined, this);
        }),
        sourceIndex < sources.length - 1 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          dimColor: true,
          children: " \u25B6"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : null;
    $[40] = sourceIndex;
    $[41] = sources;
    $[42] = t18;
  } else {
    t18 = $[42];
  }
  const sourceSelector = t18;
  const dismissShortcut = useShortcutDisplay("diff:dismiss", "DiffDialog", "esc");
  let t19;
  bb0: {
    if (diffData.loading) {
      t19 = "Loading diff\u2026";
      break bb0;
    }
    if (currentTurn) {
      t19 = "No file changes in this turn";
      break bb0;
    }
    if (diffData.stats && diffData.stats.filesCount > 0 && diffData.files.length === 0) {
      t19 = "Too many files to display details";
      break bb0;
    }
    t19 = "Working tree is clean";
  }
  const emptyMessage = t19;
  let t20;
  if ($[43] !== headerSubtitle) {
    t20 = headerSubtitle && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        " ",
        headerSubtitle
      ]
    }, undefined, true, undefined, this);
    $[43] = headerSubtitle;
    $[44] = t20;
  } else {
    t20 = $[44];
  }
  let t21;
  if ($[45] !== headerTitle || $[46] !== t20) {
    t21 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        headerTitle,
        t20
      ]
    }, undefined, true, undefined, this);
    $[45] = headerTitle;
    $[46] = t20;
    $[47] = t21;
  } else {
    t21 = $[47];
  }
  const title = t21;
  let t22;
  if ($[48] !== onDone || $[49] !== viewMode) {
    t22 = function handleCancel2() {
      if (viewMode === "detail") {
        setViewMode("list");
      } else {
        onDone("Diff dialog dismissed", {
          display: "system"
        });
      }
    };
    $[48] = onDone;
    $[49] = viewMode;
    $[50] = t22;
  } else {
    t22 = $[50];
  }
  const handleCancel = t22;
  let t23;
  if ($[51] !== dismissShortcut || $[52] !== sources.length || $[53] !== viewMode) {
    t23 = (exitState) => exitState.pending ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
      children: [
        "Press ",
        exitState.keyName,
        " again to exit"
      ]
    }, undefined, true, undefined, this) : viewMode === "list" ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Byline, {
      children: [
        sources.length > 1 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          children: "\u2190/\u2192 source"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          children: "\u2191/\u2193 select"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          children: "Enter view"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          children: [
            dismissShortcut,
            " close"
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Byline, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          children: "\u2190 back"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
          children: [
            dismissShortcut,
            " close"
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[51] = dismissShortcut;
    $[52] = sources.length;
    $[53] = viewMode;
    $[54] = t23;
  } else {
    t23 = $[54];
  }
  let t24;
  if ($[55] !== diffData.files || $[56] !== emptyMessage || $[57] !== selectedFile?.isBinary || $[58] !== selectedFile?.isLargeFile || $[59] !== selectedFile?.isTruncated || $[60] !== selectedFile?.isUntracked || $[61] !== selectedFile?.path || $[62] !== selectedHunks || $[63] !== selectedIndex || $[64] !== viewMode) {
    t24 = diffData.files.length === 0 ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedText, {
        dimColor: true,
        children: emptyMessage
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this) : viewMode === "list" ? /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(DiffFileList, {
        files: diffData.files,
        selectedIndex
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(DiffDetailView, {
        filePath: selectedFile?.path || "",
        hunks: selectedHunks,
        isLargeFile: selectedFile?.isLargeFile,
        isBinary: selectedFile?.isBinary,
        isTruncated: selectedFile?.isTruncated,
        isUntracked: selectedFile?.isUntracked
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[55] = diffData.files;
    $[56] = emptyMessage;
    $[57] = selectedFile?.isBinary;
    $[58] = selectedFile?.isLargeFile;
    $[59] = selectedFile?.isTruncated;
    $[60] = selectedFile?.isUntracked;
    $[61] = selectedFile?.path;
    $[62] = selectedHunks;
    $[63] = selectedIndex;
    $[64] = viewMode;
    $[65] = t24;
  } else {
    t24 = $[65];
  }
  let t25;
  if ($[66] !== handleCancel || $[67] !== sourceSelector || $[68] !== subtitle || $[69] !== t23 || $[70] !== t24 || $[71] !== title) {
    t25 = /* @__PURE__ */ jsx_dev_runtime3.jsxDEV(Dialog, {
      title,
      onCancel: handleCancel,
      color: "background",
      inputGuide: t23,
      children: [
        sourceSelector,
        subtitle,
        t24
      ]
    }, undefined, true, undefined, this);
    $[66] = handleCancel;
    $[67] = sourceSelector;
    $[68] = subtitle;
    $[69] = t23;
    $[70] = t24;
    $[71] = title;
    $[72] = t25;
  } else {
    t25 = $[72];
  }
  return t25;
}
function _temp3(prev_1) {
  return Math.max(0, prev_1 - 1);
}
function _temp2(prev) {
  return Math.max(0, prev - 1);
}
function _temp(turn) {
  return {
    type: "turn",
    turn
  };
}
var import_compiler_runtime3, import_react3, jsx_dev_runtime3;
var init_DiffDialog = __esm(() => {
  init_overlayContext();
  init_useDiffData();
  init_useTurnDiffs();
  init_ink();
  init_useKeybinding();
  init_useShortcutDisplay();
  init_stringUtils();
  init_Byline();
  init_Dialog();
  init_DiffDetailView();
  init_DiffFileList();
  import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  import_react3 = __toESM(require_react(), 1);
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});
init_DiffDialog();

export {
  DiffDialog
};
