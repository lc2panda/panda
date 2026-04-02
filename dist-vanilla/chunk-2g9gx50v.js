// @bun
import {
  ERROR_MESSAGE_INCOMPLETE_RESPONSE,
  ERROR_MESSAGE_NOT_ENOUGH_MESSAGES,
  ERROR_MESSAGE_USER_ABORT,
  buildEffectiveSystemPrompt,
  compactConversation,
  executePreCompactHooks,
  getMessagesAfterCompactBoundary,
  getShortcutDisplay,
  getSystemContext,
  getSystemPrompt,
  getUpgradeMessage,
  getUserContext,
  init_compact,
  init_compactWarningState,
  init_context,
  init_contextWindowUpgradeCheck,
  init_hooks1 as init_hooks,
  init_messages1 as init_messages,
  init_microCompact,
  init_postCompactCleanup,
  init_promptCacheBreakDetection,
  init_prompts1 as init_prompts,
  init_sessionMemoryCompact,
  init_sessionMemoryUtils,
  init_shortcutFormat,
  init_systemPrompt,
  mergeHookInstructions,
  microcompactMessages,
  runPostCompactCleanup,
  setLastSummarizedMessageId,
  suppressCompactWarning,
  trySessionMemoryCompaction
} from "./chunk-ekfe4t3x.js";
import"./chunk-4xshe7tf.js";
import"./chunk-tdbeghs2.js";
import"./chunk-86h8sspq.js";
import"./chunk-hkxvdww3.js";
import"./chunk-9bwery1w.js";
import"./chunk-4c08gv68.js";
import"./chunk-p9ra2v2f.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-4cwfa7zk.js";
import"./chunk-mjd4qde5.js";
import"./chunk-5g7gx4y7.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-sknn7p3z.js";
import"./chunk-2hb5pyjj.js";
import"./chunk-9gbamk79.js";
import"./chunk-1hjzbne1.js";
import"./chunk-djq17a7g.js";
import"./chunk-gypetngm.js";
import"./chunk-qjz5kp97.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import"./chunk-g338npwr.js";
import"./chunk-7nbhgtwq.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-73re2yq9.js";
import"./chunk-j30w257d.js";
import"./chunk-fxerh6v6.js";
import {
  init_source,
  source_default
} from "./chunk-w5d5b7r0.js";
import"./chunk-0f1005z8.js";
import"./chunk-ccq9c4dq.js";
import"./chunk-tg3zbmz7.js";
import"./chunk-3asghxv4.js";
import"./chunk-xk4zgzx2.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-2g1tm0n3.js";
import"./chunk-55wgxwa9.js";
import"./chunk-tbpx2160.js";
import"./chunk-4jm600zv.js";
import"./chunk-7np1pz21.js";
import"./chunk-5cqfqj5r.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-1mc1wz9m.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import"./chunk-ywhstzac.js";
import"./chunk-cdz5yb0r.js";
import"./chunk-47cb3k0q.js";
import"./chunk-c4pgn9ph.js";
import"./chunk-bjwxx22f.js";
import"./chunk-tjd99w4c.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-7z9e9ndj.js";
import"./chunk-sctqkknr.js";
import"./chunk-ehab6nmr.js";
import {
  init_log,
  logError
} from "./chunk-myphr2va.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  hasExactErrorMessage,
  init_errors
} from "./chunk-cv4r43rj.js";
import"./chunk-fbv4apne.js";
import"./chunk-er95axp1.js";
import {
  init_state,
  markPostCompaction
} from "./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/commands/compact/compact.ts
async function compactViaReactive(messages, context, customInstructions, reactive) {
  context.onCompactProgress?.({
    type: "hooks_start",
    hookType: "pre_compact"
  });
  context.setSDKStatus?.("compacting");
  try {
    const [hookResult, cacheSafeParams] = await Promise.all([
      executePreCompactHooks({ trigger: "manual", customInstructions: customInstructions || null }, context.abortController.signal),
      getCacheSharingParams(context, messages)
    ]);
    const mergedInstructions = mergeHookInstructions(customInstructions, hookResult.newCustomInstructions);
    context.setStreamMode?.("requesting");
    context.setResponseLength?.(() => 0);
    context.onCompactProgress?.({ type: "compact_start" });
    const outcome = await reactive.reactiveCompactOnPromptTooLong(messages, cacheSafeParams, { customInstructions: mergedInstructions, trigger: "manual" });
    if (!outcome.ok) {
      switch (outcome.reason) {
        case "too_few_groups":
          throw new Error(ERROR_MESSAGE_NOT_ENOUGH_MESSAGES);
        case "aborted":
          throw new Error(ERROR_MESSAGE_USER_ABORT);
        case "exhausted":
        case "error":
        case "media_unstrippable":
          throw new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE);
      }
    }
    setLastSummarizedMessageId(undefined);
    runPostCompactCleanup();
    suppressCompactWarning();
    getUserContext.cache.clear?.();
    const combinedMessage = [hookResult.userDisplayMessage, outcome.result.userDisplayMessage].filter(Boolean).join(`
`) || undefined;
    return {
      type: "compact",
      compactionResult: {
        ...outcome.result,
        userDisplayMessage: combinedMessage
      },
      displayText: buildDisplayText(context, combinedMessage)
    };
  } finally {
    context.setStreamMode?.("requesting");
    context.setResponseLength?.(() => 0);
    context.onCompactProgress?.({ type: "compact_end" });
    context.setSDKStatus?.(null);
  }
}
function buildDisplayText(context, userDisplayMessage) {
  const upgradeMessage = getUpgradeMessage("tip");
  const expandShortcut = getShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o");
  const dimmed = [
    ...context.options.verbose ? [] : [`(${expandShortcut} to see full summary)`],
    ...userDisplayMessage ? [userDisplayMessage] : [],
    ...upgradeMessage ? [upgradeMessage] : []
  ];
  return source_default.dim("Compacted " + dimmed.join(`
`));
}
async function getCacheSharingParams(context, forkContextMessages) {
  const appState = context.getAppState();
  const defaultSysPrompt = await getSystemPrompt(context.options.tools, context.options.mainLoopModel, Array.from(appState.toolPermissionContext.additionalWorkingDirectories.keys()), context.options.mcpClients);
  const systemPrompt = buildEffectiveSystemPrompt({
    mainThreadAgentDefinition: undefined,
    toolUseContext: context,
    customSystemPrompt: context.options.customSystemPrompt,
    defaultSystemPrompt: defaultSysPrompt,
    appendSystemPrompt: context.options.appendSystemPrompt
  });
  const [userContext, systemContext] = await Promise.all([
    getUserContext(),
    getSystemContext()
  ]);
  return {
    systemPrompt,
    userContext,
    systemContext,
    toolUseContext: context,
    forkContextMessages
  };
}
var reactiveCompact = null, call = async (args, context) => {
  const { abortController } = context;
  let { messages } = context;
  messages = getMessagesAfterCompactBoundary(messages);
  if (messages.length === 0) {
    throw new Error("No messages to compact");
  }
  const customInstructions = args.trim();
  try {
    if (!customInstructions) {
      const sessionMemoryResult = await trySessionMemoryCompaction(messages, context.agentId);
      if (sessionMemoryResult) {
        getUserContext.cache.clear?.();
        runPostCompactCleanup();
        if (false) {}
        markPostCompaction();
        suppressCompactWarning();
        return {
          type: "compact",
          compactionResult: sessionMemoryResult,
          displayText: buildDisplayText(context)
        };
      }
    }
    if (reactiveCompact?.isReactiveOnlyMode()) {
      return await compactViaReactive(messages, context, customInstructions, reactiveCompact);
    }
    const microcompactResult = await microcompactMessages(messages, context);
    const messagesForCompact = microcompactResult.messages;
    const result = await compactConversation(messagesForCompact, context, await getCacheSharingParams(context, messagesForCompact), false, customInstructions, false);
    setLastSummarizedMessageId(undefined);
    suppressCompactWarning();
    getUserContext.cache.clear?.();
    runPostCompactCleanup();
    return {
      type: "compact",
      compactionResult: result,
      displayText: buildDisplayText(context, result.userDisplayMessage)
    };
  } catch (error) {
    if (abortController.signal.aborted) {
      throw new Error("Compaction canceled.");
    } else if (hasExactErrorMessage(error, ERROR_MESSAGE_NOT_ENOUGH_MESSAGES)) {
      throw new Error(ERROR_MESSAGE_NOT_ENOUGH_MESSAGES);
    } else if (hasExactErrorMessage(error, ERROR_MESSAGE_INCOMPLETE_RESPONSE)) {
      throw new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE);
    } else {
      logError(error);
      throw new Error(`Error during compaction: ${error}`);
    }
  }
};
var init_compact2 = __esm(() => {
  init_source();
  init_state();
  init_prompts();
  init_context();
  init_shortcutFormat();
  init_promptCacheBreakDetection();
  init_compact();
  init_compactWarningState();
  init_microCompact();
  init_postCompactCleanup();
  init_sessionMemoryCompact();
  init_sessionMemoryUtils();
  init_errors();
  init_hooks();
  init_log();
  init_messages();
  init_contextWindowUpgradeCheck();
  init_systemPrompt();
});
init_compact2();

export {
  call
};
