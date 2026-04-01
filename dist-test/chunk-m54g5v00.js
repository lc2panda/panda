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
} from "./chunk-wk0emb79.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
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
import"./chunk-x2y5syym.js";
import"./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import"./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  init_source,
  source_default
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
import {
  init_log,
  logError
} from "./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  hasExactErrorMessage,
  init_errors
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
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
