// @bun
import {
  StatusIcon,
  init_StatusIcon
} from "./chunk-wzr3bqfc.js";
import {
  init_staticRender,
  renderToAnsiString
} from "./chunk-akx2s1vj.js";
import {
  BASH_TOOL_NAME,
  FILE_READ_TOOL_NAME,
  GREP_TOOL_NAME,
  WEB_FETCH_TOOL_NAME,
  analyzeContextUsage,
  getMessagesAfterCompactBoundary,
  init_analyzeContext,
  init_messages1 as init_messages,
  init_microCompact,
  init_prompt,
  init_prompt1 as init_prompt2,
  init_prompt4 as init_prompt3,
  init_toolName,
  microcompactMessages
} from "./chunk-jwtmq3ad.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
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
import"./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  getDisplayPath,
  getSourceDisplayName,
  init_constants,
  init_file,
  init_stringUtils
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
  formatTokens,
  init_format
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

// src/utils/contextSuggestions.ts
function generateContextSuggestions(data) {
  const suggestions = [];
  checkNearCapacity(data, suggestions);
  checkLargeToolResults(data, suggestions);
  checkReadResultBloat(data, suggestions);
  checkMemoryBloat(data, suggestions);
  checkAutoCompactDisabled(data, suggestions);
  suggestions.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "warning" ? -1 : 1;
    }
    return (b.savingsTokens ?? 0) - (a.savingsTokens ?? 0);
  });
  return suggestions;
}
function checkNearCapacity(data, suggestions) {
  if (data.percentage >= NEAR_CAPACITY_PERCENT) {
    suggestions.push({
      severity: "warning",
      title: `Context is ${data.percentage}% full`,
      detail: data.isAutoCompactEnabled ? "Autocompact will trigger soon, which discards older messages. Use /compact now to control what gets kept." : "Autocompact is disabled. Use /compact to free space, or enable autocompact in /config."
    });
  }
}
function checkLargeToolResults(data, suggestions) {
  if (!data.messageBreakdown)
    return;
  for (const tool of data.messageBreakdown.toolCallsByType) {
    const totalToolTokens = tool.callTokens + tool.resultTokens;
    const percent = totalToolTokens / data.rawMaxTokens * 100;
    if (percent < LARGE_TOOL_RESULT_PERCENT || totalToolTokens < LARGE_TOOL_RESULT_TOKENS) {
      continue;
    }
    const suggestion = getLargeToolSuggestion(tool.name, totalToolTokens, percent);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }
}
function getLargeToolSuggestion(toolName, tokens, percent) {
  const tokenStr = formatTokens(tokens);
  switch (toolName) {
    case BASH_TOOL_NAME:
      return {
        severity: "warning",
        title: `Bash results using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
        detail: "Pipe output through head, tail, or grep to reduce result size. Avoid cat on large files \u2014 use Read with offset/limit instead.",
        savingsTokens: Math.floor(tokens * 0.5)
      };
    case FILE_READ_TOOL_NAME:
      return {
        severity: "info",
        title: `Read results using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
        detail: "Use offset and limit parameters to read only the sections you need. Avoid re-reading entire files when you only need a few lines.",
        savingsTokens: Math.floor(tokens * 0.3)
      };
    case GREP_TOOL_NAME:
      return {
        severity: "info",
        title: `Grep results using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
        detail: "Add more specific patterns or use the glob or type parameter to narrow file types. Consider Glob for file discovery instead of Grep.",
        savingsTokens: Math.floor(tokens * 0.3)
      };
    case WEB_FETCH_TOOL_NAME:
      return {
        severity: "info",
        title: `WebFetch results using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
        detail: "Web page content can be very large. Consider extracting only the specific information needed.",
        savingsTokens: Math.floor(tokens * 0.4)
      };
    default:
      if (percent >= 20) {
        return {
          severity: "info",
          title: `${toolName} using ${tokenStr} tokens (${percent.toFixed(0)}%)`,
          detail: `This tool is consuming a significant portion of context.`,
          savingsTokens: Math.floor(tokens * 0.2)
        };
      }
      return null;
  }
}
function checkReadResultBloat(data, suggestions) {
  if (!data.messageBreakdown)
    return;
  const callsByType = data.messageBreakdown.toolCallsByType;
  const readTool = callsByType.find((t) => t.name === FILE_READ_TOOL_NAME);
  if (!readTool)
    return;
  const totalReadTokens = readTool.callTokens + readTool.resultTokens;
  const totalReadPercent = totalReadTokens / data.rawMaxTokens * 100;
  const readPercent = readTool.resultTokens / data.rawMaxTokens * 100;
  if (totalReadPercent >= LARGE_TOOL_RESULT_PERCENT && totalReadTokens >= LARGE_TOOL_RESULT_TOKENS) {
    return;
  }
  if (readPercent >= READ_BLOAT_PERCENT && readTool.resultTokens >= LARGE_TOOL_RESULT_TOKENS) {
    suggestions.push({
      severity: "info",
      title: `File reads using ${formatTokens(readTool.resultTokens)} tokens (${readPercent.toFixed(0)}%)`,
      detail: "If you are re-reading files, consider referencing earlier reads. Use offset/limit for large files.",
      savingsTokens: Math.floor(readTool.resultTokens * 0.3)
    });
  }
}
function checkMemoryBloat(data, suggestions) {
  const totalMemoryTokens = data.memoryFiles.reduce((sum, f) => sum + f.tokens, 0);
  const memoryPercent = totalMemoryTokens / data.rawMaxTokens * 100;
  if (memoryPercent >= MEMORY_HIGH_PERCENT && totalMemoryTokens >= MEMORY_HIGH_TOKENS) {
    const largestFiles = [...data.memoryFiles].sort((a, b) => b.tokens - a.tokens).slice(0, 3).map((f) => {
      const name = getDisplayPath(f.path);
      return `${name} (${formatTokens(f.tokens)})`;
    }).join(", ");
    suggestions.push({
      severity: "info",
      title: `Memory files using ${formatTokens(totalMemoryTokens)} tokens (${memoryPercent.toFixed(0)}%)`,
      detail: `Largest: ${largestFiles}. Use /memory to review and prune stale entries.`,
      savingsTokens: Math.floor(totalMemoryTokens * 0.3)
    });
  }
}
function checkAutoCompactDisabled(data, suggestions) {
  if (!data.isAutoCompactEnabled && data.percentage >= 50 && data.percentage < NEAR_CAPACITY_PERCENT) {
    suggestions.push({
      severity: "info",
      title: "Autocompact is disabled",
      detail: "Without autocompact, you will hit context limits and lose the conversation. Enable it in /config or use /compact manually."
    });
  }
}
var LARGE_TOOL_RESULT_PERCENT = 15, LARGE_TOOL_RESULT_TOKENS = 1e4, READ_BLOAT_PERCENT = 5, NEAR_CAPACITY_PERCENT = 80, MEMORY_HIGH_PERCENT = 5, MEMORY_HIGH_TOKENS = 5000;
var init_contextSuggestions = __esm(() => {
  init_toolName();
  init_prompt2();
  init_prompt();
  init_prompt3();
  init_file();
  init_format();
});

// src/components/ContextSuggestions.tsx
function ContextSuggestions(t0) {
  const $ = import_compiler_runtime.c(5);
  const {
    suggestions
  } = t0;
  if (suggestions.length === 0) {
    return null;
  }
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      bold: true,
      children: "Suggestions"
    }, undefined, false, undefined, this);
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== suggestions) {
    t2 = suggestions.map(_temp);
    $[1] = suggestions;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        t1,
        t2
      ]
    }, undefined, true, undefined, this);
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
function _temp(suggestion, i) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    marginTop: i === 0 ? 0 : 1,
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(StatusIcon, {
            status: suggestion.severity,
            withSpace: true
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            bold: true,
            children: suggestion.title
          }, undefined, false, undefined, this),
          suggestion.savingsTokens ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              " ",
              figures_default.arrowRight,
              " save ~",
              formatTokens(suggestion.savingsTokens)
            ]
          }, undefined, true, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        marginLeft: 2,
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: suggestion.detail
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, i, true, undefined, this);
}
var import_compiler_runtime, jsx_dev_runtime;
var init_ContextSuggestions = __esm(() => {
  init_figures();
  init_ink();
  init_format();
  init_StatusIcon();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/components/ContextVisualization.tsx
function CollapseStatus() {
  const $ = import_compiler_runtime2.c(2);
  if (false) {}
  return null;
}
function groupBySource(items) {
  const groups = new Map;
  for (const item of items) {
    const key = getSourceDisplayName(item.source);
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }
  for (const [key, group] of groups.entries()) {
    groups.set(key, group.sort((a, b) => b.tokens - a.tokens));
  }
  const orderedGroups = new Map;
  for (const source of SOURCE_DISPLAY_ORDER) {
    const group = groups.get(source);
    if (group) {
      orderedGroups.set(source, group);
    }
  }
  return orderedGroups;
}
function ContextVisualization(t0) {
  const $ = import_compiler_runtime2.c(87);
  const {
    data
  } = t0;
  const {
    categories,
    totalTokens,
    rawMaxTokens,
    percentage,
    gridRows,
    model,
    memoryFiles,
    mcpTools,
    deferredBuiltinTools: t1,
    systemTools,
    systemPromptSections,
    agents,
    skills,
    messageBreakdown
  } = data;
  let T0;
  let T1;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  let t7;
  let t8;
  let t9;
  if ($[0] !== categories || $[1] !== gridRows || $[2] !== mcpTools || $[3] !== model || $[4] !== percentage || $[5] !== rawMaxTokens || $[6] !== systemTools || $[7] !== t1 || $[8] !== totalTokens) {
    const deferredBuiltinTools = t1 === undefined ? [] : t1;
    const visibleCategories = categories.filter(_temp14);
    let t102;
    if ($[19] !== categories) {
      t102 = categories.some(_temp2);
      $[19] = categories;
      $[20] = t102;
    } else {
      t102 = $[20];
    }
    const hasDeferredMcpTools = t102;
    const hasDeferredBuiltinTools = deferredBuiltinTools.length > 0;
    const autocompactCategory = categories.find(_temp3);
    T1 = ThemedBox_default;
    t6 = "column";
    t7 = 1;
    if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
      t8 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        bold: true,
        children: "Context Usage"
      }, undefined, false, undefined, this);
      $[21] = t8;
    } else {
      t8 = $[21];
    }
    let t112;
    if ($[22] !== gridRows) {
      t112 = gridRows.map(_temp5);
      $[22] = gridRows;
      $[23] = t112;
    } else {
      t112 = $[23];
    }
    let t122;
    if ($[24] !== t112) {
      t122 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        flexShrink: 0,
        children: t112
      }, undefined, false, undefined, this);
      $[24] = t112;
      $[25] = t122;
    } else {
      t122 = $[25];
    }
    let t132;
    if ($[26] !== totalTokens) {
      t132 = formatTokens(totalTokens);
      $[26] = totalTokens;
      $[27] = t132;
    } else {
      t132 = $[27];
    }
    let t142;
    if ($[28] !== rawMaxTokens) {
      t142 = formatTokens(rawMaxTokens);
      $[28] = rawMaxTokens;
      $[29] = t142;
    } else {
      t142 = $[29];
    }
    let t152;
    if ($[30] !== model || $[31] !== percentage || $[32] !== t132 || $[33] !== t142) {
      t152 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          model,
          " \xB7 ",
          t132,
          "/",
          t142,
          " ",
          "tokens (",
          percentage,
          "%)"
        ]
      }, undefined, true, undefined, this);
      $[30] = model;
      $[31] = percentage;
      $[32] = t132;
      $[33] = t142;
      $[34] = t152;
    } else {
      t152 = $[34];
    }
    let t162;
    let t172;
    let t182;
    if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
      t162 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(CollapseStatus, {}, undefined, false, undefined, this);
      t172 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        children: " "
      }, undefined, false, undefined, this);
      t182 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: "Estimated usage by category"
      }, undefined, false, undefined, this);
      $[35] = t162;
      $[36] = t172;
      $[37] = t182;
    } else {
      t162 = $[35];
      t172 = $[36];
      t182 = $[37];
    }
    let t19;
    if ($[38] !== rawMaxTokens) {
      t19 = (cat_2, index) => {
        const tokenDisplay = formatTokens(cat_2.tokens);
        const percentDisplay = cat_2.isDeferred ? "N/A" : `${(cat_2.tokens / rawMaxTokens * 100).toFixed(1)}%`;
        const isReserved = cat_2.name === RESERVED_CATEGORY_NAME;
        const displayName = cat_2.name;
        const symbol = cat_2.isDeferred ? " " : isReserved ? "\u26DD" : "\u26C1";
        return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              color: cat_2.color,
              children: symbol
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              children: [
                " ",
                displayName,
                ": "
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              dimColor: true,
              children: [
                tokenDisplay,
                " tokens (",
                percentDisplay,
                ")"
              ]
            }, undefined, true, undefined, this)
          ]
        }, index, true, undefined, this);
      };
      $[38] = rawMaxTokens;
      $[39] = t19;
    } else {
      t19 = $[39];
    }
    const t20 = visibleCategories.map(t19);
    let t21;
    if ($[40] !== categories || $[41] !== rawMaxTokens) {
      t21 = (categories.find(_temp6)?.tokens ?? 0) > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: true,
            children: "\u26F6"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            children: " Free space: "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
            dimColor: true,
            children: [
              formatTokens(categories.find(_temp7)?.tokens || 0),
              " ",
              "(",
              ((categories.find(_temp8)?.tokens || 0) / rawMaxTokens * 100).toFixed(1),
              "%)"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[40] = categories;
      $[41] = rawMaxTokens;
      $[42] = t21;
    } else {
      t21 = $[42];
    }
    const t22 = autocompactCategory && autocompactCategory.tokens > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          color: autocompactCategory.color,
          children: "\u26DD"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            " ",
            autocompactCategory.name,
            ": "
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
          dimColor: true,
          children: [
            formatTokens(autocompactCategory.tokens),
            " tokens (",
            (autocompactCategory.tokens / rawMaxTokens * 100).toFixed(1),
            "%)"
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
    let t23;
    if ($[43] !== t152 || $[44] !== t20 || $[45] !== t21 || $[46] !== t22) {
      t23 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 0,
        flexShrink: 0,
        children: [
          t152,
          t162,
          t172,
          t182,
          t20,
          t21,
          t22
        ]
      }, undefined, true, undefined, this);
      $[43] = t152;
      $[44] = t20;
      $[45] = t21;
      $[46] = t22;
      $[47] = t23;
    } else {
      t23 = $[47];
    }
    if ($[48] !== t122 || $[49] !== t23) {
      t9 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "row",
        gap: 2,
        children: [
          t122,
          t23
        ]
      }, undefined, true, undefined, this);
      $[48] = t122;
      $[49] = t23;
      $[50] = t9;
    } else {
      t9 = $[50];
    }
    T0 = ThemedBox_default;
    t2 = "column";
    t3 = -1;
    if ($[51] !== hasDeferredMcpTools || $[52] !== mcpTools) {
      t4 = mcpTools.length > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        marginTop: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                bold: true,
                children: "MCP tools"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  " ",
                  "\xB7 /mcp",
                  hasDeferredMcpTools ? " (loaded on-demand)" : ""
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          mcpTools.some(_temp9) && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginTop: 1,
            children: [
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                dimColor: true,
                children: "Loaded"
              }, undefined, false, undefined, this),
              mcpTools.filter(_temp0).map(_temp1)
            ]
          }, undefined, true, undefined, this),
          hasDeferredMcpTools && mcpTools.some(_temp10) && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
            flexDirection: "column",
            marginTop: 1,
            children: [
              /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
                dimColor: true,
                children: "Available"
              }, undefined, false, undefined, this),
              mcpTools.filter(_temp11).map(_temp12)
            ]
          }, undefined, true, undefined, this),
          !hasDeferredMcpTools && mcpTools.map(_temp13)
        ]
      }, undefined, true, undefined, this);
      $[51] = hasDeferredMcpTools;
      $[52] = mcpTools;
      $[53] = t4;
    } else {
      t4 = $[53];
    }
    t5 = (systemTools && systemTools.length > 0 || hasDeferredBuiltinTools) && false;
    $[0] = categories;
    $[1] = gridRows;
    $[2] = mcpTools;
    $[3] = model;
    $[4] = percentage;
    $[5] = rawMaxTokens;
    $[6] = systemTools;
    $[7] = t1;
    $[8] = totalTokens;
    $[9] = T0;
    $[10] = T1;
    $[11] = t2;
    $[12] = t3;
    $[13] = t4;
    $[14] = t5;
    $[15] = t6;
    $[16] = t7;
    $[17] = t8;
    $[18] = t9;
  } else {
    T0 = $[9];
    T1 = $[10];
    t2 = $[11];
    t3 = $[12];
    t4 = $[13];
    t5 = $[14];
    t6 = $[15];
    t7 = $[16];
    t8 = $[17];
    t9 = $[18];
  }
  let t10;
  if ($[54] !== systemPromptSections) {
    t10 = systemPromptSections && systemPromptSections.length > 0 && false;
    $[54] = systemPromptSections;
    $[55] = t10;
  } else {
    t10 = $[55];
  }
  let t11;
  if ($[56] !== agents) {
    t11 = agents.length > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              bold: true,
              children: "Custom agents"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              dimColor: true,
              children: " \xB7 /agents"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        Array.from(groupBySource(agents).entries()).map(_temp22)
      ]
    }, undefined, true, undefined, this);
    $[56] = agents;
    $[57] = t11;
  } else {
    t11 = $[57];
  }
  let t12;
  if ($[58] !== memoryFiles) {
    t12 = memoryFiles.length > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              bold: true,
              children: "Memory files"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              dimColor: true,
              children: " \xB7 /memory"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        memoryFiles.map(_temp23)
      ]
    }, undefined, true, undefined, this);
    $[58] = memoryFiles;
    $[59] = t12;
  } else {
    t12 = $[59];
  }
  let t13;
  if ($[60] !== skills) {
    t13 = skills && skills.tokens > 0 && /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
          children: [
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              bold: true,
              children: "Skills"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
              dimColor: true,
              children: " \xB7 /skills"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        Array.from(groupBySource(skills.skillFrontmatter).entries()).map(_temp25)
      ]
    }, undefined, true, undefined, this);
    $[60] = skills;
    $[61] = t13;
  } else {
    t13 = $[61];
  }
  let t14;
  if ($[62] !== messageBreakdown) {
    t14 = messageBreakdown && false;
    $[62] = messageBreakdown;
    $[63] = t14;
  } else {
    t14 = $[63];
  }
  let t15;
  if ($[64] !== T0 || $[65] !== t10 || $[66] !== t11 || $[67] !== t12 || $[68] !== t13 || $[69] !== t14 || $[70] !== t2 || $[71] !== t3 || $[72] !== t4 || $[73] !== t5) {
    t15 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(T0, {
      flexDirection: t2,
      marginLeft: t3,
      children: [
        t4,
        t5,
        t10,
        t11,
        t12,
        t13,
        t14
      ]
    }, undefined, true, undefined, this);
    $[64] = T0;
    $[65] = t10;
    $[66] = t11;
    $[67] = t12;
    $[68] = t13;
    $[69] = t14;
    $[70] = t2;
    $[71] = t3;
    $[72] = t4;
    $[73] = t5;
    $[74] = t15;
  } else {
    t15 = $[74];
  }
  let t16;
  if ($[75] !== data) {
    t16 = generateContextSuggestions(data);
    $[75] = data;
    $[76] = t16;
  } else {
    t16 = $[76];
  }
  let t17;
  if ($[77] !== t16) {
    t17 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ContextSuggestions, {
      suggestions: t16
    }, undefined, false, undefined, this);
    $[77] = t16;
    $[78] = t17;
  } else {
    t17 = $[78];
  }
  let t18;
  if ($[79] !== T1 || $[80] !== t15 || $[81] !== t17 || $[82] !== t6 || $[83] !== t7 || $[84] !== t8 || $[85] !== t9) {
    t18 = /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(T1, {
      flexDirection: t6,
      paddingLeft: t7,
      children: [
        t8,
        t9,
        t15,
        t17
      ]
    }, undefined, true, undefined, this);
    $[79] = T1;
    $[80] = t15;
    $[81] = t17;
    $[82] = t6;
    $[83] = t7;
    $[84] = t8;
    $[85] = t9;
    $[86] = t18;
  } else {
    t18 = $[86];
  }
  return t18;
}
function _temp25(t0) {
  const [sourceDisplay_0, sourceSkills] = t0;
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    marginTop: 1,
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: sourceDisplay_0
      }, undefined, false, undefined, this),
      sourceSkills.map(_temp24)
    ]
  }, sourceDisplay_0, true, undefined, this);
}
function _temp24(skill, i_8) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        children: [
          "\u2514 ",
          skill.name,
          ": "
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          formatTokens(skill.tokens),
          " tokens"
        ]
      }, undefined, true, undefined, this)
    ]
  }, i_8, true, undefined, this);
}
function _temp23(file, i_7) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        children: [
          "\u2514 ",
          getDisplayPath(file.path),
          ": "
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          formatTokens(file.tokens),
          " tokens"
        ]
      }, undefined, true, undefined, this)
    ]
  }, i_7, true, undefined, this);
}
function _temp22(t0) {
  const [sourceDisplay, sourceAgents] = t0;
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    marginTop: 1,
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: sourceDisplay
      }, undefined, false, undefined, this),
      sourceAgents.map(_temp21)
    ]
  }, sourceDisplay, true, undefined, this);
}
function _temp21(agent, i_6) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        children: [
          "\u2514 ",
          agent.agentType,
          ": "
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          formatTokens(agent.tokens),
          " tokens"
        ]
      }, undefined, true, undefined, this)
    ]
  }, i_6, true, undefined, this);
}
function _temp13(tool_1, i_1) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        children: [
          "\u2514 ",
          tool_1.name,
          ": "
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          formatTokens(tool_1.tokens),
          " tokens"
        ]
      }, undefined, true, undefined, this)
    ]
  }, i_1, true, undefined, this);
}
function _temp12(tool_0, i_0) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    children: /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "\u2514 ",
        tool_0.name
      ]
    }, undefined, true, undefined, this)
  }, i_0, false, undefined, this);
}
function _temp11(t_1) {
  return !t_1.isLoaded;
}
function _temp10(t_2) {
  return !t_2.isLoaded;
}
function _temp1(tool, i) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        children: [
          "\u2514 ",
          tool.name,
          ": "
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          formatTokens(tool.tokens),
          " tokens"
        ]
      }, undefined, true, undefined, this)
    ]
  }, i, true, undefined, this);
}
function _temp0(t) {
  return t.isLoaded;
}
function _temp9(t_0) {
  return t_0.isLoaded;
}
function _temp8(c_0) {
  return c_0.name === "Free space";
}
function _temp7(c) {
  return c.name === "Free space";
}
function _temp6(c_1) {
  return c_1.name === "Free space";
}
function _temp5(row, rowIndex) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedBox_default, {
    flexDirection: "row",
    marginLeft: -1,
    children: row.map(_temp4)
  }, rowIndex, false, undefined, this);
}
function _temp4(square, colIndex) {
  if (square.categoryName === "Free space") {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      dimColor: true,
      children: "\u26F6 "
    }, colIndex, false, undefined, this);
  }
  if (square.categoryName === RESERVED_CATEGORY_NAME) {
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
      color: square.color,
      children: "\u26DD "
    }, colIndex, false, undefined, this);
  }
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(ThemedText, {
    color: square.color,
    children: square.squareFullness >= 0.7 ? "\u26C1 " : "\u26C0 "
  }, colIndex, false, undefined, this);
}
function _temp3(cat_1) {
  return cat_1.name === RESERVED_CATEGORY_NAME;
}
function _temp2(cat_0) {
  return cat_0.isDeferred && cat_0.name.includes("MCP");
}
function _temp14(cat) {
  return cat.tokens > 0 && cat.name !== "Free space" && cat.name !== RESERVED_CATEGORY_NAME && !cat.isDeferred;
}
var import_compiler_runtime2, jsx_dev_runtime2, RESERVED_CATEGORY_NAME = "Autocompact buffer", SOURCE_DISPLAY_ORDER;
var init_ContextVisualization = __esm(() => {
  init_ink();
  init_contextSuggestions();
  init_file();
  init_format();
  init_constants();
  init_stringUtils();
  init_ContextSuggestions();
  import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
  SOURCE_DISPLAY_ORDER = ["Project", "User", "Managed", "Plugin", "Built-in"];
});

// src/commands/context/context.tsx
function toApiView(messages) {
  let view = getMessagesAfterCompactBoundary(messages);
  if (false) {}
  return view;
}
async function call(onDone, context) {
  const {
    messages,
    getAppState,
    options: {
      mainLoopModel,
      tools
    }
  } = context;
  const apiView = toApiView(messages);
  const {
    messages: compactedMessages
  } = await microcompactMessages(apiView);
  const terminalWidth = process.stdout.columns || 80;
  const appState = getAppState();
  const data = await analyzeContextUsage(compactedMessages, mainLoopModel, async () => appState.toolPermissionContext, tools, appState.agentDefinitions, terminalWidth, context, undefined, apiView);
  const output = await renderToAnsiString(/* @__PURE__ */ jsx_dev_runtime3.jsxDEV(ContextVisualization, {
    data
  }, undefined, false, undefined, this));
  onDone(output);
  return null;
}
var jsx_dev_runtime3;
var init_context = __esm(() => {
  init_ContextVisualization();
  init_microCompact();
  init_analyzeContext();
  init_messages();
  init_staticRender();
  jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime(), 1);
});
init_context();

export {
  call
};
