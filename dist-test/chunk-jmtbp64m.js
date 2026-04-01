// @bun
import {
  normalizeControlMessageKeys
} from "./chunk-nt837qt9.js";
import {
  notifySessionStateChanged
} from "./chunk-2z93bdss.js";
import {
  init_slashCommandParsing,
  parseSlashCommand
} from "./chunk-rn0v1hk8.js";
import {
  AccountInfoSchema,
  AgentDefinitionSchema,
  AgentInfoSchema,
  DEFAULT_OUTPUT_STYLE_NAME,
  FastModeStateSchema,
  HookEventSchema,
  HookInputSchema,
  McpServerConfigForProcessTransportSchema,
  McpServerStatusSchema,
  ModelInfoSchema,
  PermissionModeSchema,
  PermissionUpdateSchema,
  SDKMessageSchema,
  SDKPostTurnSummaryMessageSchema,
  SDKStreamlinedTextMessageSchema,
  SDKStreamlinedToolUseSummaryMessageSchema,
  SDKUserMessageSchema,
  Select,
  SlashCommandSchema,
  Spinner,
  Stream,
  addMarketplaceSource,
  applyPermissionUpdates,
  createAttachmentMessage,
  createCommandInputMessage,
  createImageMetadataText,
  createSystemMessage,
  createUserMessage,
  detectImageFormatFromBase64,
  executePermissionRequestHooks,
  executeUserPromptSubmitHooks,
  extractTag,
  fileHistoryCanRestore,
  fileHistoryEnabled,
  fileHistoryGetDiffStats,
  findCommand,
  getAttachmentMessages,
  getCommandName,
  getContentText,
  getDeclaredMarketplaces,
  getUserPromptSubmitHookBlockingMessage,
  hasPermissionsToUseTool,
  hookJSONOutputSchema,
  init_AppState,
  init_PermissionUpdate,
  init_PermissionUpdateSchema,
  init_Spinner,
  init_attachments,
  init_commandLifecycle,
  init_commands1 as init_commands,
  init_coreSchemas,
  init_fileHistory,
  init_generators,
  init_hooks,
  init_hooks1 as init_hooks2,
  init_imageResizer,
  init_imageStore,
  init_marketplaceManager,
  init_messages1 as init_messages,
  init_outputStyles,
  init_permissions,
  init_queryProfiler,
  init_select,
  init_stream,
  init_textInputTypes,
  isBridgeSafeCommand,
  isEmptyMessageText,
  isSyntheticMessage,
  isToolUseResultMessage,
  isValidImagePaste,
  loadKnownMarketplacesConfig,
  maybeResizeAndDownsampleImageBlock,
  notifyCommandLifecycle,
  permissionUpdateSchema,
  persistPermissionUpdates,
  queryCheckpoint,
  storeImages,
  toArray,
  useAppState
} from "./chunk-wk0emb79.js";
import {
  init_useExitOnCtrlCDWithKeybindings,
  useExitOnCtrlCDWithKeybindings
} from "./chunk-gywzh15r.js";
import {
  Divider,
  init_Divider,
  init_useKeybinding,
  init_useTerminalSize,
  useKeybinding,
  useKeybindings,
  useTerminalSize
} from "./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_events,
  init_sessionTracing,
  logOTelEvent,
  redactIfDisabled,
  startInteractionSpan
} from "./chunk-g8nemwxs.js";
import {
  AGENT_TOOL_NAME,
  LEGACY_AGENT_TOOL_NAME,
  getAnthropicApiKeyWithSource,
  getFastModeState,
  getSettings_DEPRECATED,
  init_auth,
  init_constants1 as init_constants,
  init_fastMode,
  init_file,
  init_isEqual,
  init_schemas,
  init_settings1 as init_settings,
  isEqual_default,
  isLocalMarketplaceSource,
  pathExists
} from "./chunk-bt6e264h.js";
import {
  count,
  init_array
} from "./chunk-0e1xsncc.js";
import {
  init_v4,
  v4_default
} from "./chunk-g0j0t6qk.js";
import {
  exports_external,
  init_lazySchema,
  lazySchema
} from "./chunk-55wgxwa9.js";
import {
  formatRelativeTimeAgo,
  init_format,
  truncate
} from "./chunk-hsd2zcr5.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import {
  findCanonicalGitRoot,
  init_diagLogs,
  init_git,
  logForDiagnosticsNoPII
} from "./chunk-73q6p10n.js";
import {
  figures_default,
  init_figures
} from "./chunk-nahdbxge.js";
import {
  BASH_STDERR_TAG,
  BASH_STDOUT_TAG,
  COMMAND_MESSAGE_TAG,
  LOCAL_COMMAND_STDERR_TAG,
  LOCAL_COMMAND_STDOUT_TAG,
  TASK_NOTIFICATION_TAG,
  TEAMMATE_MESSAGE_TAG,
  TICK_TAG,
  init_displayTags,
  init_log,
  init_xml,
  logError,
  stripDisplayTags
} from "./chunk-43vdtd69.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import {
  AbortError,
  errorMessage,
  init_debug,
  init_errors,
  init_slowOperations,
  jsonParse,
  jsonStringify,
  logForDebugging
} from "./chunk-71hncdva.js";
import {
  init_process,
  writeToStdout
} from "./chunk-fbv4apne.js";
import {
  getOriginalCwd,
  getSdkBetas,
  getSessionId,
  init_state,
  setPromptId
} from "./chunk-24stks7b.js";
import {
  __esm,
  __export,
  __require,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/MessageSelector.tsx
var exports_MessageSelector = {};
__export(exports_MessageSelector, {
  selectableUserMessagesFilter: () => selectableUserMessagesFilter,
  messagesAfterAreOnlySynthetic: () => messagesAfterAreOnlySynthetic,
  MessageSelector: () => MessageSelector
});
import { randomUUID } from "crypto";
import * as path from "path";
function isTextBlock(block) {
  return block.type === "text";
}
function isSummarizeOption(option) {
  return option === "summarize" || option === "summarize_up_to";
}
function MessageSelector({
  messages,
  onPreRestore,
  onRestoreMessage,
  onRestoreCode,
  onSummarize,
  onClose,
  preselectedMessage
}) {
  const fileHistory = useAppState((s) => s.fileHistory);
  const [error, setError] = import_react.useState(undefined);
  const isFileHistoryEnabled = fileHistoryEnabled();
  const currentUUID = import_react.useMemo(randomUUID, []);
  const messageOptions = import_react.useMemo(() => [...messages.filter(selectableUserMessagesFilter), {
    ...createUserMessage({
      content: ""
    }),
    uuid: currentUUID
  }], [messages, currentUUID]);
  const [selectedIndex, setSelectedIndex] = import_react.useState(messageOptions.length - 1);
  const firstVisibleIndex = Math.max(0, Math.min(selectedIndex - Math.floor(MAX_VISIBLE_MESSAGES / 2), messageOptions.length - MAX_VISIBLE_MESSAGES));
  const hasMessagesToSelect = messageOptions.length > 1;
  const [messageToRestore, setMessageToRestore] = import_react.useState(preselectedMessage);
  const [diffStatsForRestore, setDiffStatsForRestore] = import_react.useState(undefined);
  import_react.useEffect(() => {
    if (!preselectedMessage || !isFileHistoryEnabled)
      return;
    let cancelled = false;
    fileHistoryGetDiffStats(fileHistory, preselectedMessage.uuid).then((stats) => {
      if (!cancelled)
        setDiffStatsForRestore(stats);
    });
    return () => {
      cancelled = true;
    };
  }, [preselectedMessage, isFileHistoryEnabled, fileHistory]);
  const [isRestoring, setIsRestoring] = import_react.useState(false);
  const [restoringOption, setRestoringOption] = import_react.useState(null);
  const [selectedRestoreOption, setSelectedRestoreOption] = import_react.useState("both");
  const [summarizeFromFeedback, setSummarizeFromFeedback] = import_react.useState("");
  const [summarizeUpToFeedback, setSummarizeUpToFeedback] = import_react.useState("");
  function getRestoreOptions(canRestoreCode) {
    const baseOptions = canRestoreCode ? [{
      value: "both",
      label: "Restore code and conversation"
    }, {
      value: "conversation",
      label: "Restore conversation"
    }, {
      value: "code",
      label: "Restore code"
    }] : [{
      value: "conversation",
      label: "Restore conversation"
    }];
    const summarizeInputProps = {
      type: "input",
      placeholder: "add context (optional)",
      initialValue: "",
      allowEmptySubmitToCancel: true,
      showLabelWithValue: true,
      labelValueSeparator: ": "
    };
    baseOptions.push({
      value: "summarize",
      label: "Summarize from here",
      ...summarizeInputProps,
      onChange: setSummarizeFromFeedback
    });
    if (false) {}
    baseOptions.push({
      value: "nevermind",
      label: "Never mind"
    });
    return baseOptions;
  }
  import_react.useEffect(() => {
    logEvent("tengu_message_selector_opened", {});
  }, []);
  async function restoreConversationDirectly(message) {
    onPreRestore();
    setIsRestoring(true);
    try {
      await onRestoreMessage(message);
      setIsRestoring(false);
      onClose();
    } catch (error_0) {
      logError(error_0);
      setIsRestoring(false);
      setError(`Failed to restore the conversation:
${error_0}`);
    }
  }
  async function handleSelect(message_0) {
    const index = messages.indexOf(message_0);
    const indexFromEnd = messages.length - 1 - index;
    logEvent("tengu_message_selector_selected", {
      index_from_end: indexFromEnd,
      message_type: message_0.type,
      is_current_prompt: false
    });
    if (!messages.includes(message_0)) {
      onClose();
      return;
    }
    if (!isFileHistoryEnabled) {
      await restoreConversationDirectly(message_0);
      return;
    }
    const diffStats = await fileHistoryGetDiffStats(fileHistory, message_0.uuid);
    setMessageToRestore(message_0);
    setDiffStatsForRestore(diffStats);
  }
  async function onSelectRestoreOption(option) {
    logEvent("tengu_message_selector_restore_option_selected", {
      option
    });
    if (!messageToRestore) {
      setError("Message not found.");
      return;
    }
    if (option === "nevermind") {
      if (preselectedMessage)
        onClose();
      else
        setMessageToRestore(undefined);
      return;
    }
    if (isSummarizeOption(option)) {
      onPreRestore();
      setIsRestoring(true);
      setRestoringOption(option);
      setError(undefined);
      try {
        const direction = option === "summarize_up_to" ? "up_to" : "from";
        const feedback = (direction === "up_to" ? summarizeUpToFeedback : summarizeFromFeedback).trim() || undefined;
        await onSummarize(messageToRestore, feedback, direction);
        setIsRestoring(false);
        setRestoringOption(null);
        setMessageToRestore(undefined);
        onClose();
      } catch (error_1) {
        logError(error_1);
        setIsRestoring(false);
        setRestoringOption(null);
        setMessageToRestore(undefined);
        setError(`Failed to summarize:
${error_1}`);
      }
      return;
    }
    onPreRestore();
    setIsRestoring(true);
    setError(undefined);
    let codeError = null;
    let conversationError = null;
    if (option === "code" || option === "both") {
      try {
        await onRestoreCode(messageToRestore);
      } catch (error_2) {
        codeError = error_2;
        logError(codeError);
      }
    }
    if (option === "conversation" || option === "both") {
      try {
        await onRestoreMessage(messageToRestore);
      } catch (error_3) {
        conversationError = error_3;
        logError(conversationError);
      }
    }
    setIsRestoring(false);
    setMessageToRestore(undefined);
    if (conversationError && codeError) {
      setError(`Failed to restore the conversation and code:
${conversationError}
${codeError}`);
    } else if (conversationError) {
      setError(`Failed to restore the conversation:
${conversationError}`);
    } else if (codeError) {
      setError(`Failed to restore the code:
${codeError}`);
    } else {
      onClose();
    }
  }
  const exitState = useExitOnCtrlCDWithKeybindings();
  const handleEscape = import_react.useCallback(() => {
    if (messageToRestore && !preselectedMessage) {
      setMessageToRestore(undefined);
      return;
    }
    logEvent("tengu_message_selector_cancelled", {});
    onClose();
  }, [onClose, messageToRestore, preselectedMessage]);
  const moveUp = import_react.useCallback(() => setSelectedIndex((prev) => Math.max(0, prev - 1)), []);
  const moveDown = import_react.useCallback(() => setSelectedIndex((prev_0) => Math.min(messageOptions.length - 1, prev_0 + 1)), [messageOptions.length]);
  const jumpToTop = import_react.useCallback(() => setSelectedIndex(0), []);
  const jumpToBottom = import_react.useCallback(() => setSelectedIndex(messageOptions.length - 1), [messageOptions.length]);
  const handleSelectCurrent = import_react.useCallback(() => {
    const selected = messageOptions[selectedIndex];
    if (selected) {
      handleSelect(selected);
    }
  }, [messageOptions, selectedIndex, handleSelect]);
  useKeybinding("confirm:no", handleEscape, {
    context: "Confirmation",
    isActive: !messageToRestore
  });
  useKeybindings({
    "messageSelector:up": moveUp,
    "messageSelector:down": moveDown,
    "messageSelector:top": jumpToTop,
    "messageSelector:bottom": jumpToBottom,
    "messageSelector:select": handleSelectCurrent
  }, {
    context: "MessageSelector",
    isActive: !isRestoring && !error && !messageToRestore && hasMessagesToSelect
  });
  const [fileHistoryMetadata, setFileHistoryMetadata] = import_react.useState({});
  import_react.useEffect(() => {
    async function loadFileHistoryMetadata() {
      if (!isFileHistoryEnabled) {
        return;
      }
      Promise.all(messageOptions.map(async (userMessage, itemIndex) => {
        if (userMessage.uuid !== currentUUID) {
          const canRestore = fileHistoryCanRestore(fileHistory, userMessage.uuid);
          const nextUserMessage = messageOptions.at(itemIndex + 1);
          const diffStats_0 = canRestore ? computeDiffStatsBetweenMessages(messages, userMessage.uuid, nextUserMessage?.uuid !== currentUUID ? nextUserMessage?.uuid : undefined) : undefined;
          if (diffStats_0 !== undefined) {
            setFileHistoryMetadata((prev_1) => ({
              ...prev_1,
              [itemIndex]: diffStats_0
            }));
          } else {
            setFileHistoryMetadata((prev_2) => ({
              ...prev_2,
              [itemIndex]: undefined
            }));
          }
        }
      }));
    }
    loadFileHistoryMetadata();
  }, [messageOptions, messages, currentUUID, fileHistory, isFileHistoryEnabled]);
  const canRestoreCode_0 = isFileHistoryEnabled && diffStatsForRestore?.filesChanged && diffStatsForRestore.filesChanged.length > 0;
  const showPickList = !error && !messageToRestore && !preselectedMessage && hasMessagesToSelect;
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    width: "100%",
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Divider, {
        color: "suggestion"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        marginX: 1,
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            bold: true,
            color: "suggestion",
            children: "Rewind"
          }, undefined, false, undefined, this),
          error && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              color: "error",
              children: [
                "Error: ",
                error
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          !hasMessagesToSelect && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              children: "Nothing to rewind to yet."
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          !error && messageToRestore && hasMessagesToSelect && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: [
                  "Confirm you want to restore",
                  " ",
                  !diffStatsForRestore && "the conversation ",
                  "to the point before you sent this message:"
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                flexDirection: "column",
                paddingLeft: 1,
                borderStyle: "single",
                borderRight: false,
                borderTop: false,
                borderBottom: false,
                borderLeft: true,
                borderLeftDimColor: true,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime.jsxDEV(UserMessageOption, {
                    userMessage: messageToRestore,
                    color: "text",
                    isCurrent: false
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: [
                      "(",
                      formatRelativeTimeAgo(new Date(messageToRestore.timestamp)),
                      ")"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(RestoreOptionDescription, {
                selectedRestoreOption,
                canRestoreCode: !!canRestoreCode_0,
                diffStatsForRestore
              }, undefined, false, undefined, this),
              isRestoring && isSummarizeOption(restoringOption) ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                flexDirection: "row",
                gap: 1,
                children: [
                  /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                    children: "Summarizing\u2026"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
                isDisabled: isRestoring,
                options: getRestoreOptions(!!canRestoreCode_0),
                defaultFocusValue: canRestoreCode_0 ? "both" : "conversation",
                onFocus: (value) => setSelectedRestoreOption(value),
                onChange: (value_0) => onSelectRestoreOption(value_0),
                onCancel: () => preselectedMessage ? onClose() : setMessageToRestore(undefined)
              }, undefined, false, undefined, this),
              canRestoreCode_0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                marginBottom: 1,
                children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: [
                    figures_default.warning,
                    " Rewinding does not affect files edited manually or via bash."
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          showPickList && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
            children: [
              isFileHistoryEnabled ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: "Restore the code and/or conversation to the point before\u2026"
              }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                children: "Restore and fork the conversation to the point before\u2026"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                width: "100%",
                flexDirection: "column",
                children: messageOptions.slice(firstVisibleIndex, firstVisibleIndex + MAX_VISIBLE_MESSAGES).map((msg, visibleOptionIndex) => {
                  const optionIndex = firstVisibleIndex + visibleOptionIndex;
                  const isSelected = optionIndex === selectedIndex;
                  const isCurrent = msg.uuid === currentUUID;
                  const metadataLoaded = optionIndex in fileHistoryMetadata;
                  const metadata = fileHistoryMetadata[optionIndex];
                  const numFilesChanged = metadata?.filesChanged && metadata.filesChanged.length;
                  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                    height: isFileHistoryEnabled ? 3 : 2,
                    overflow: "hidden",
                    width: "100%",
                    flexDirection: "row",
                    children: [
                      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                        width: 2,
                        minWidth: 2,
                        children: isSelected ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                          color: "permission",
                          bold: true,
                          children: [
                            figures_default.pointer,
                            " "
                          ]
                        }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                          children: "  "
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                        flexDirection: "column",
                        children: [
                          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                            flexShrink: 1,
                            height: 1,
                            overflow: "hidden",
                            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(UserMessageOption, {
                              userMessage: msg,
                              color: isSelected ? "suggestion" : undefined,
                              isCurrent,
                              paddingRight: 10
                            }, undefined, false, undefined, this)
                          }, undefined, false, undefined, this),
                          isFileHistoryEnabled && metadataLoaded && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                            height: 1,
                            flexDirection: "row",
                            children: metadata ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
                              children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                                dimColor: !isSelected,
                                color: "inactive",
                                children: numFilesChanged ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
                                  children: [
                                    numFilesChanged === 1 && metadata.filesChanged[0] ? `${path.basename(metadata.filesChanged[0])} ` : `${numFilesChanged} files changed `,
                                    /* @__PURE__ */ jsx_dev_runtime.jsxDEV(DiffStatsText, {
                                      diffStats: metadata
                                    }, undefined, false, undefined, this)
                                  ]
                                }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
                                  children: "No code changes"
                                }, undefined, false, undefined, this)
                              }, undefined, false, undefined, this)
                            }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                              dimColor: true,
                              color: "warning",
                              children: [
                                figures_default.warning,
                                " No code restore"
                              ]
                            }, undefined, true, undefined, this)
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, msg.uuid, true, undefined, this);
                })
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          !messageToRestore && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            dimColor: true,
            italic: true,
            children: exitState.pending ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
              children: [
                "Press ",
                exitState.keyName,
                " again to exit"
              ]
            }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
              children: [
                !error && hasMessagesToSelect && "Enter to continue \xB7 ",
                "Esc to exit"
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function getRestoreOptionConversationText(option) {
  switch (option) {
    case "summarize":
      return "Messages after this point will be summarized.";
    case "summarize_up_to":
      return "Preceding messages will be summarized. This and subsequent messages will remain unchanged \u2014 you will stay at the end of the conversation.";
    case "both":
    case "conversation":
      return "The conversation will be forked.";
    case "code":
    case "nevermind":
      return "The conversation will be unchanged.";
  }
}
function RestoreOptionDescription(t0) {
  const $ = import_compiler_runtime.c(11);
  const {
    selectedRestoreOption,
    canRestoreCode,
    diffStatsForRestore
  } = t0;
  const showCodeRestore = canRestoreCode && (selectedRestoreOption === "both" || selectedRestoreOption === "code");
  let t1;
  if ($[0] !== selectedRestoreOption) {
    t1 = getRestoreOptionConversationText(selectedRestoreOption);
    $[0] = selectedRestoreOption;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== t1) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: t1
    }, undefined, false, undefined, this);
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== diffStatsForRestore || $[5] !== selectedRestoreOption || $[6] !== showCodeRestore) {
    t3 = !isSummarizeOption(selectedRestoreOption) && (showCodeRestore ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(RestoreCodeConfirmation, {
      diffStatsForRestore
    }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "The code will be unchanged."
    }, undefined, false, undefined, this));
    $[4] = diffStatsForRestore;
    $[5] = selectedRestoreOption;
    $[6] = showCodeRestore;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  let t4;
  if ($[8] !== t2 || $[9] !== t3) {
    t4 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t2,
        t3
      ]
    }, undefined, true, undefined, this);
    $[8] = t2;
    $[9] = t3;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
}
function RestoreCodeConfirmation(t0) {
  const $ = import_compiler_runtime.c(14);
  const {
    diffStatsForRestore
  } = t0;
  if (diffStatsForRestore === undefined) {
    return;
  }
  if (!diffStatsForRestore.filesChanged || !diffStatsForRestore.filesChanged[0]) {
    let t12;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: "The code has not changed (nothing will be restored)."
      }, undefined, false, undefined, this);
      $[0] = t12;
    } else {
      t12 = $[0];
    }
    return t12;
  }
  const numFilesChanged = diffStatsForRestore.filesChanged.length;
  let fileLabel;
  if (numFilesChanged === 1) {
    let t12;
    if ($[1] !== diffStatsForRestore.filesChanged[0]) {
      t12 = path.basename(diffStatsForRestore.filesChanged[0] || "");
      $[1] = diffStatsForRestore.filesChanged[0];
      $[2] = t12;
    } else {
      t12 = $[2];
    }
    fileLabel = t12;
  } else {
    if (numFilesChanged === 2) {
      let t12;
      if ($[3] !== diffStatsForRestore.filesChanged[0]) {
        t12 = path.basename(diffStatsForRestore.filesChanged[0] || "");
        $[3] = diffStatsForRestore.filesChanged[0];
        $[4] = t12;
      } else {
        t12 = $[4];
      }
      const file1 = t12;
      let t22;
      if ($[5] !== diffStatsForRestore.filesChanged[1]) {
        t22 = path.basename(diffStatsForRestore.filesChanged[1] || "");
        $[5] = diffStatsForRestore.filesChanged[1];
        $[6] = t22;
      } else {
        t22 = $[6];
      }
      const file2 = t22;
      fileLabel = `${file1} and ${file2}`;
    } else {
      let t12;
      if ($[7] !== diffStatsForRestore.filesChanged[0]) {
        t12 = path.basename(diffStatsForRestore.filesChanged[0] || "");
        $[7] = diffStatsForRestore.filesChanged[0];
        $[8] = t12;
      } else {
        t12 = $[8];
      }
      const file1_0 = t12;
      fileLabel = `${file1_0} and ${diffStatsForRestore.filesChanged.length - 1} other files`;
    }
  }
  let t1;
  if ($[9] !== diffStatsForRestore) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(DiffStatsText, {
      diffStats: diffStatsForRestore
    }, undefined, false, undefined, this);
    $[9] = diffStatsForRestore;
    $[10] = t1;
  } else {
    t1 = $[10];
  }
  let t2;
  if ($[11] !== fileLabel || $[12] !== t1) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          "The code will be restored",
          " ",
          t1,
          " in ",
          fileLabel,
          "."
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[11] = fileLabel;
    $[12] = t1;
    $[13] = t2;
  } else {
    t2 = $[13];
  }
  return t2;
}
function DiffStatsText(t0) {
  const $ = import_compiler_runtime.c(7);
  const {
    diffStats
  } = t0;
  if (!diffStats || !diffStats.filesChanged) {
    return;
  }
  let t1;
  if ($[0] !== diffStats.insertions) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "diffAddedWord",
      children: [
        "+",
        diffStats.insertions,
        " "
      ]
    }, undefined, true, undefined, this);
    $[0] = diffStats.insertions;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== diffStats.deletions) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "diffRemovedWord",
      children: [
        "-",
        diffStats.deletions
      ]
    }, undefined, true, undefined, this);
    $[2] = diffStats.deletions;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1 || $[5] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(jsx_dev_runtime.Fragment, {
      children: [
        t1,
        t2
      ]
    }, undefined, true, undefined, this);
    $[4] = t1;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}
function UserMessageOption(t0) {
  const $ = import_compiler_runtime.c(31);
  const {
    userMessage,
    color,
    dimColor,
    isCurrent,
    paddingRight
  } = t0;
  const {
    columns
  } = useTerminalSize();
  if (isCurrent) {
    let t12;
    if ($[0] !== color || $[1] !== dimColor) {
      t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        width: "100%",
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          italic: true,
          color,
          dimColor,
          children: "(current)"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[0] = color;
      $[1] = dimColor;
      $[2] = t12;
    } else {
      t12 = $[2];
    }
    return t12;
  }
  const content = userMessage.message.content;
  const lastBlock = typeof content === "string" ? null : content[content.length - 1];
  let T0;
  let T1;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  if ($[3] !== color || $[4] !== columns || $[5] !== content || $[6] !== dimColor || $[7] !== lastBlock || $[8] !== paddingRight) {
    t6 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const rawMessageText = typeof content === "string" ? content.trim() : lastBlock && isTextBlock(lastBlock) ? lastBlock.text.trim() : "(no prompt)";
      const messageText = stripDisplayTags(rawMessageText);
      if (isEmptyMessageText(messageText)) {
        let t72;
        if ($[17] !== color || $[18] !== dimColor) {
          t72 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            flexDirection: "row",
            width: "100%",
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              italic: true,
              color,
              dimColor,
              children: "((empty message))"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this);
          $[17] = color;
          $[18] = dimColor;
          $[19] = t72;
        } else {
          t72 = $[19];
        }
        t6 = t72;
        break bb0;
      }
      if (messageText.includes("<bash-input>")) {
        const input = extractTag(messageText, "bash-input");
        if (input) {
          let t72;
          if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
            t72 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              color: "bashBorder",
              children: "!"
            }, undefined, false, undefined, this);
            $[20] = t72;
          } else {
            t72 = $[20];
          }
          t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            flexDirection: "row",
            width: "100%",
            children: [
              t72,
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                color,
                dimColor,
                children: [
                  " ",
                  input
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this);
          break bb0;
        }
      }
      if (messageText.includes(`<${COMMAND_MESSAGE_TAG}>`)) {
        const commandMessage = extractTag(messageText, COMMAND_MESSAGE_TAG);
        const args = extractTag(messageText, "command-args");
        const isSkillFormat = extractTag(messageText, "skill-format") === "true";
        if (commandMessage) {
          if (isSkillFormat) {
            t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
              flexDirection: "row",
              width: "100%",
              children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                color,
                dimColor,
                children: [
                  "Skill(",
                  commandMessage,
                  ")"
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this);
            break bb0;
          } else {
            t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
              flexDirection: "row",
              width: "100%",
              children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                color,
                dimColor,
                children: [
                  "/",
                  commandMessage,
                  " ",
                  args
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this);
            break bb0;
          }
        }
      }
      T1 = ThemedBox_default;
      t4 = "row";
      t5 = "100%";
      T0 = ThemedText;
      t1 = color;
      t2 = dimColor;
      t3 = paddingRight ? truncate(messageText, columns - paddingRight, true) : messageText.slice(0, 500).split(`
`).slice(0, 4).join(`
`);
    }
    $[3] = color;
    $[4] = columns;
    $[5] = content;
    $[6] = dimColor;
    $[7] = lastBlock;
    $[8] = paddingRight;
    $[9] = T0;
    $[10] = T1;
    $[11] = t1;
    $[12] = t2;
    $[13] = t3;
    $[14] = t4;
    $[15] = t5;
    $[16] = t6;
  } else {
    T0 = $[9];
    T1 = $[10];
    t1 = $[11];
    t2 = $[12];
    t3 = $[13];
    t4 = $[14];
    t5 = $[15];
    t6 = $[16];
  }
  if (t6 !== Symbol.for("react.early_return_sentinel")) {
    return t6;
  }
  let t7;
  if ($[21] !== T0 || $[22] !== t1 || $[23] !== t2 || $[24] !== t3) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T0, {
      color: t1,
      dimColor: t2,
      children: t3
    }, undefined, false, undefined, this);
    $[21] = T0;
    $[22] = t1;
    $[23] = t2;
    $[24] = t3;
    $[25] = t7;
  } else {
    t7 = $[25];
  }
  let t8;
  if ($[26] !== T1 || $[27] !== t4 || $[28] !== t5 || $[29] !== t7) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(T1, {
      flexDirection: t4,
      width: t5,
      children: t7
    }, undefined, false, undefined, this);
    $[26] = T1;
    $[27] = t4;
    $[28] = t5;
    $[29] = t7;
    $[30] = t8;
  } else {
    t8 = $[30];
  }
  return t8;
}
function computeDiffStatsBetweenMessages(messages, fromMessageId, toMessageId) {
  const startIndex = messages.findIndex((msg) => msg.uuid === fromMessageId);
  if (startIndex === -1) {
    return;
  }
  let endIndex = toMessageId ? messages.findIndex((msg) => msg.uuid === toMessageId) : messages.length;
  if (endIndex === -1) {
    endIndex = messages.length;
  }
  const filesChanged = [];
  let insertions = 0;
  let deletions = 0;
  for (let i = startIndex + 1;i < endIndex; i++) {
    const msg = messages[i];
    if (!msg || !isToolUseResultMessage(msg)) {
      continue;
    }
    const result = msg.toolUseResult;
    if (!result || !result.filePath || !result.structuredPatch) {
      continue;
    }
    if (!filesChanged.includes(result.filePath)) {
      filesChanged.push(result.filePath);
    }
    try {
      if ("type" in result && result.type === "create") {
        insertions += result.content.split(/\r?\n/).length;
      } else {
        for (const hunk of result.structuredPatch) {
          const additions = count(hunk.lines, (line) => line.startsWith("+"));
          const removals = count(hunk.lines, (line) => line.startsWith("-"));
          insertions += additions;
          deletions += removals;
        }
      }
    } catch {
      continue;
    }
  }
  return {
    filesChanged,
    insertions,
    deletions
  };
}
function selectableUserMessagesFilter(message) {
  if (message.type !== "user") {
    return false;
  }
  if (Array.isArray(message.message.content) && message.message.content[0]?.type === "tool_result") {
    return false;
  }
  if (isSyntheticMessage(message)) {
    return false;
  }
  if (message.isMeta) {
    return false;
  }
  if (message.isCompactSummary || message.isVisibleInTranscriptOnly) {
    return false;
  }
  const content = message.message.content;
  const lastBlock = typeof content === "string" ? null : content[content.length - 1];
  const messageText = typeof content === "string" ? content.trim() : lastBlock && isTextBlock(lastBlock) ? lastBlock.text.trim() : "";
  if (messageText.indexOf(`<${LOCAL_COMMAND_STDOUT_TAG}>`) !== -1 || messageText.indexOf(`<${LOCAL_COMMAND_STDERR_TAG}>`) !== -1 || messageText.indexOf(`<${BASH_STDOUT_TAG}>`) !== -1 || messageText.indexOf(`<${BASH_STDERR_TAG}>`) !== -1 || messageText.indexOf(`<${TASK_NOTIFICATION_TAG}>`) !== -1 || messageText.indexOf(`<${TICK_TAG}>`) !== -1 || messageText.indexOf(`<${TEAMMATE_MESSAGE_TAG}`) !== -1) {
    return false;
  }
  return true;
}
function messagesAfterAreOnlySynthetic(messages, fromIndex) {
  for (let i = fromIndex + 1;i < messages.length; i++) {
    const msg = messages[i];
    if (!msg)
      continue;
    if (isSyntheticMessage(msg))
      continue;
    if (isToolUseResultMessage(msg))
      continue;
    if (msg.type === "progress")
      continue;
    if (msg.type === "system")
      continue;
    if (msg.type === "attachment")
      continue;
    if (msg.type === "user" && msg.isMeta)
      continue;
    if (msg.type === "assistant") {
      const content = msg.message.content;
      if (Array.isArray(content)) {
        const hasMeaningfulContent = content.some((block) => block.type === "text" && block.text.trim() || block.type === "tool_use");
        if (hasMeaningfulContent)
          return false;
      }
      continue;
    }
    if (msg.type === "user") {
      return false;
    }
  }
  return true;
}
var import_compiler_runtime, import_react, jsx_dev_runtime, MAX_VISIBLE_MESSAGES = 7;
var init_MessageSelector = __esm(() => {
  init_figures();
  init_analytics();
  init_AppState();
  init_fileHistory();
  init_log();
  init_useExitOnCtrlCDWithKeybindings();
  init_ink();
  init_useKeybinding();
  init_displayTags();
  init_messages();
  init_select();
  init_Spinner();
  init_useTerminalSize();
  init_xml();
  init_array();
  init_format();
  init_Divider();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/bridge/inboundMessages.ts
init_imageResizer();
function extractInboundMessageFields(msg) {
  if (msg.type !== "user")
    return;
  const content = msg.message?.content;
  if (!content)
    return;
  if (Array.isArray(content) && content.length === 0)
    return;
  const uuid = "uuid" in msg && typeof msg.uuid === "string" ? msg.uuid : undefined;
  return {
    content: Array.isArray(content) ? normalizeImageBlocks(content) : content,
    uuid
  };
}
function normalizeImageBlocks(blocks) {
  if (!blocks.some(isMalformedBase64Image))
    return blocks;
  return blocks.map((block) => {
    if (!isMalformedBase64Image(block))
      return block;
    const src = block.source;
    const mediaType = typeof src.mediaType === "string" && src.mediaType ? src.mediaType : detectImageFormatFromBase64(block.source.data);
    return {
      ...block,
      source: {
        type: "base64",
        media_type: mediaType,
        data: block.source.data
      }
    };
  });
}
function isMalformedBase64Image(block) {
  if (block.type !== "image" || block.source?.type !== "base64")
    return false;
  return !block.source.media_type;
}

// src/utils/permissions/PermissionPromptToolResultSchema.ts
init_v4();
init_debug();
init_lazySchema();
init_PermissionUpdate();
init_PermissionUpdateSchema();
var inputSchema = lazySchema(() => v4_default.object({
  tool_name: v4_default.string().describe("The name of the tool requesting permission"),
  input: v4_default.record(v4_default.string(), v4_default.unknown()).describe("The input for the tool"),
  tool_use_id: v4_default.string().optional().describe("The unique tool use request ID")
}));
var decisionClassificationField = lazySchema(() => v4_default.enum(["user_temporary", "user_permanent", "user_reject"]).optional().catch(undefined));
var PermissionAllowResultSchema = lazySchema(() => v4_default.object({
  behavior: v4_default.literal("allow"),
  updatedInput: v4_default.record(v4_default.string(), v4_default.unknown()),
  updatedPermissions: v4_default.array(permissionUpdateSchema()).optional().catch((ctx) => {
    logForDebugging(`Malformed updatedPermissions from SDK host ignored: ${ctx.error.issues[0]?.message ?? "unknown"}`, { level: "warn" });
    return;
  }),
  toolUseID: v4_default.string().optional(),
  decisionClassification: decisionClassificationField()
}));
var PermissionDenyResultSchema = lazySchema(() => v4_default.object({
  behavior: v4_default.literal("deny"),
  message: v4_default.string(),
  interrupt: v4_default.boolean().optional(),
  toolUseID: v4_default.string().optional(),
  decisionClassification: decisionClassificationField()
}));
var outputSchema = lazySchema(() => v4_default.union([PermissionAllowResultSchema(), PermissionDenyResultSchema()]));
function permissionPromptToolResultToPermissionDecision(result, tool, input, toolUseContext) {
  const decisionReason = {
    type: "permissionPromptTool",
    permissionPromptToolName: tool.name,
    toolResult: result
  };
  if (result.behavior === "allow") {
    const updatedPermissions = result.updatedPermissions;
    if (updatedPermissions) {
      toolUseContext.setAppState((prev) => ({
        ...prev,
        toolPermissionContext: applyPermissionUpdates(prev.toolPermissionContext, updatedPermissions)
      }));
      persistPermissionUpdates(updatedPermissions);
    }
    const updatedInput = Object.keys(result.updatedInput).length > 0 ? result.updatedInput : input;
    return {
      ...result,
      updatedInput,
      decisionReason
    };
  } else if (result.behavior === "deny" && result.interrupt) {
    logForDebugging(`SDK permission prompt deny+interrupt: tool=${tool.name} message=${result.message}`);
    toolUseContext.abortController.abort();
  }
  return {
    ...result,
    decisionReason
  };
}

// src/cli/structuredIO.ts
import { randomUUID as randomUUID2 } from "crypto";

// src/entrypoints/sdk/controlSchemas.ts
init_v4();
init_lazySchema();
init_coreSchemas();
var JSONRPCMessagePlaceholder = lazySchema(() => exports_external.unknown());
var SDKHookCallbackMatcherSchema = lazySchema(() => exports_external.object({
  matcher: exports_external.string().optional(),
  hookCallbackIds: exports_external.array(exports_external.string()),
  timeout: exports_external.number().optional()
}).describe("Configuration for matching and routing hook callbacks."));
var SDKControlInitializeRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("initialize"),
  hooks: exports_external.record(HookEventSchema(), exports_external.array(SDKHookCallbackMatcherSchema())).optional(),
  sdkMcpServers: exports_external.array(exports_external.string()).optional(),
  jsonSchema: exports_external.record(exports_external.string(), exports_external.unknown()).optional(),
  systemPrompt: exports_external.string().optional(),
  appendSystemPrompt: exports_external.string().optional(),
  agents: exports_external.record(exports_external.string(), AgentDefinitionSchema()).optional(),
  promptSuggestions: exports_external.boolean().optional(),
  agentProgressSummaries: exports_external.boolean().optional()
}).describe("Initializes the SDK session with hooks, MCP servers, and agent configuration."));
var SDKControlInitializeResponseSchema = lazySchema(() => exports_external.object({
  commands: exports_external.array(SlashCommandSchema()),
  agents: exports_external.array(AgentInfoSchema()),
  output_style: exports_external.string(),
  available_output_styles: exports_external.array(exports_external.string()),
  models: exports_external.array(ModelInfoSchema()),
  account: AccountInfoSchema(),
  pid: exports_external.number().optional().describe("@internal CLI process PID for tmux socket isolation"),
  fast_mode_state: FastModeStateSchema().optional()
}).describe("Response from session initialization with available commands, models, and account info."));
var SDKControlInterruptRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("interrupt")
}).describe("Interrupts the currently running conversation turn."));
var SDKControlPermissionRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("can_use_tool"),
  tool_name: exports_external.string(),
  input: exports_external.record(exports_external.string(), exports_external.unknown()),
  permission_suggestions: exports_external.array(PermissionUpdateSchema()).optional(),
  blocked_path: exports_external.string().optional(),
  decision_reason: exports_external.string().optional(),
  title: exports_external.string().optional(),
  display_name: exports_external.string().optional(),
  tool_use_id: exports_external.string(),
  agent_id: exports_external.string().optional(),
  description: exports_external.string().optional()
}).describe("Requests permission to use a tool with the given input."));
var SDKControlSetPermissionModeRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("set_permission_mode"),
  mode: PermissionModeSchema(),
  ultraplan: exports_external.boolean().optional().describe("@internal CCR ultraplan session marker.")
}).describe("Sets the permission mode for tool execution handling."));
var SDKControlSetModelRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("set_model"),
  model: exports_external.string().optional()
}).describe("Sets the model to use for subsequent conversation turns."));
var SDKControlSetMaxThinkingTokensRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("set_max_thinking_tokens"),
  max_thinking_tokens: exports_external.number().nullable()
}).describe("Sets the maximum number of thinking tokens for extended thinking."));
var SDKControlMcpStatusRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("mcp_status")
}).describe("Requests the current status of all MCP server connections."));
var SDKControlMcpStatusResponseSchema = lazySchema(() => exports_external.object({
  mcpServers: exports_external.array(McpServerStatusSchema())
}).describe("Response containing the current status of all MCP server connections."));
var SDKControlGetContextUsageRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("get_context_usage")
}).describe("Requests a breakdown of current context window usage by category."));
var ContextCategorySchema = lazySchema(() => exports_external.object({
  name: exports_external.string(),
  tokens: exports_external.number(),
  color: exports_external.string(),
  isDeferred: exports_external.boolean().optional()
}));
var ContextGridSquareSchema = lazySchema(() => exports_external.object({
  color: exports_external.string(),
  isFilled: exports_external.boolean(),
  categoryName: exports_external.string(),
  tokens: exports_external.number(),
  percentage: exports_external.number(),
  squareFullness: exports_external.number()
}));
var SDKControlGetContextUsageResponseSchema = lazySchema(() => exports_external.object({
  categories: exports_external.array(ContextCategorySchema()),
  totalTokens: exports_external.number(),
  maxTokens: exports_external.number(),
  rawMaxTokens: exports_external.number(),
  percentage: exports_external.number(),
  gridRows: exports_external.array(exports_external.array(ContextGridSquareSchema())),
  model: exports_external.string(),
  memoryFiles: exports_external.array(exports_external.object({
    path: exports_external.string(),
    type: exports_external.string(),
    tokens: exports_external.number()
  })),
  mcpTools: exports_external.array(exports_external.object({
    name: exports_external.string(),
    serverName: exports_external.string(),
    tokens: exports_external.number(),
    isLoaded: exports_external.boolean().optional()
  })),
  deferredBuiltinTools: exports_external.array(exports_external.object({
    name: exports_external.string(),
    tokens: exports_external.number(),
    isLoaded: exports_external.boolean()
  })).optional(),
  systemTools: exports_external.array(exports_external.object({ name: exports_external.string(), tokens: exports_external.number() })).optional(),
  systemPromptSections: exports_external.array(exports_external.object({ name: exports_external.string(), tokens: exports_external.number() })).optional(),
  agents: exports_external.array(exports_external.object({
    agentType: exports_external.string(),
    source: exports_external.string(),
    tokens: exports_external.number()
  })),
  slashCommands: exports_external.object({
    totalCommands: exports_external.number(),
    includedCommands: exports_external.number(),
    tokens: exports_external.number()
  }).optional(),
  skills: exports_external.object({
    totalSkills: exports_external.number(),
    includedSkills: exports_external.number(),
    tokens: exports_external.number(),
    skillFrontmatter: exports_external.array(exports_external.object({
      name: exports_external.string(),
      source: exports_external.string(),
      tokens: exports_external.number()
    }))
  }).optional(),
  autoCompactThreshold: exports_external.number().optional(),
  isAutoCompactEnabled: exports_external.boolean(),
  messageBreakdown: exports_external.object({
    toolCallTokens: exports_external.number(),
    toolResultTokens: exports_external.number(),
    attachmentTokens: exports_external.number(),
    assistantMessageTokens: exports_external.number(),
    userMessageTokens: exports_external.number(),
    toolCallsByType: exports_external.array(exports_external.object({
      name: exports_external.string(),
      callTokens: exports_external.number(),
      resultTokens: exports_external.number()
    })),
    attachmentsByType: exports_external.array(exports_external.object({ name: exports_external.string(), tokens: exports_external.number() }))
  }).optional(),
  apiUsage: exports_external.object({
    input_tokens: exports_external.number(),
    output_tokens: exports_external.number(),
    cache_creation_input_tokens: exports_external.number(),
    cache_read_input_tokens: exports_external.number()
  }).nullable()
}).describe("Breakdown of current context window usage by category (system prompt, tools, messages, etc.)."));
var SDKControlRewindFilesRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("rewind_files"),
  user_message_id: exports_external.string(),
  dry_run: exports_external.boolean().optional()
}).describe("Rewinds file changes made since a specific user message."));
var SDKControlRewindFilesResponseSchema = lazySchema(() => exports_external.object({
  canRewind: exports_external.boolean(),
  error: exports_external.string().optional(),
  filesChanged: exports_external.array(exports_external.string()).optional(),
  insertions: exports_external.number().optional(),
  deletions: exports_external.number().optional()
}).describe("Result of a rewindFiles operation."));
var SDKControlCancelAsyncMessageRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("cancel_async_message"),
  message_uuid: exports_external.string()
}).describe("Drops a pending async user message from the command queue by uuid. No-op if already dequeued for execution."));
var SDKControlCancelAsyncMessageResponseSchema = lazySchema(() => exports_external.object({
  cancelled: exports_external.boolean()
}).describe("Result of a cancel_async_message operation. cancelled=false means the message was not in the queue (already dequeued or never enqueued)."));
var SDKControlSeedReadStateRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("seed_read_state"),
  path: exports_external.string(),
  mtime: exports_external.number()
}).describe("Seeds the readFileState cache with a path+mtime entry. Use when a prior Read was removed from context (e.g. by snip) so Edit validation would fail despite the client having observed the Read. The mtime lets the CLI detect if the file changed since the seeded Read \u2014 same staleness check as the normal path."));
var SDKHookCallbackRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("hook_callback"),
  callback_id: exports_external.string(),
  input: HookInputSchema(),
  tool_use_id: exports_external.string().optional()
}).describe("Delivers a hook callback with its input data."));
var SDKControlMcpMessageRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("mcp_message"),
  server_name: exports_external.string(),
  message: JSONRPCMessagePlaceholder()
}).describe("Sends a JSON-RPC message to a specific MCP server."));
var SDKControlMcpSetServersRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("mcp_set_servers"),
  servers: exports_external.record(exports_external.string(), McpServerConfigForProcessTransportSchema())
}).describe("Replaces the set of dynamically managed MCP servers."));
var SDKControlMcpSetServersResponseSchema = lazySchema(() => exports_external.object({
  added: exports_external.array(exports_external.string()),
  removed: exports_external.array(exports_external.string()),
  errors: exports_external.record(exports_external.string(), exports_external.string())
}).describe("Result of replacing the set of dynamically managed MCP servers."));
var SDKControlReloadPluginsRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("reload_plugins")
}).describe("Reloads plugins from disk and returns the refreshed session components."));
var SDKControlReloadPluginsResponseSchema = lazySchema(() => exports_external.object({
  commands: exports_external.array(SlashCommandSchema()),
  agents: exports_external.array(AgentInfoSchema()),
  plugins: exports_external.array(exports_external.object({
    name: exports_external.string(),
    path: exports_external.string(),
    source: exports_external.string().optional()
  })),
  mcpServers: exports_external.array(McpServerStatusSchema()),
  error_count: exports_external.number()
}).describe("Refreshed commands, agents, plugins, and MCP server status after reload."));
var SDKControlMcpReconnectRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("mcp_reconnect"),
  serverName: exports_external.string()
}).describe("Reconnects a disconnected or failed MCP server."));
var SDKControlMcpToggleRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("mcp_toggle"),
  serverName: exports_external.string(),
  enabled: exports_external.boolean()
}).describe("Enables or disables an MCP server."));
var SDKControlStopTaskRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("stop_task"),
  task_id: exports_external.string()
}).describe("Stops a running task."));
var SDKControlApplyFlagSettingsRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("apply_flag_settings"),
  settings: exports_external.record(exports_external.string(), exports_external.unknown())
}).describe("Merges the provided settings into the flag settings layer, updating the active configuration."));
var SDKControlGetSettingsRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("get_settings")
}).describe("Returns the effective merged settings and the raw per-source settings."));
var SDKControlGetSettingsResponseSchema = lazySchema(() => exports_external.object({
  effective: exports_external.record(exports_external.string(), exports_external.unknown()),
  sources: exports_external.array(exports_external.object({
    source: exports_external.enum([
      "userSettings",
      "projectSettings",
      "localSettings",
      "flagSettings",
      "policySettings"
    ]),
    settings: exports_external.record(exports_external.string(), exports_external.unknown())
  })).describe("Ordered low-to-high priority \u2014 later entries override earlier ones."),
  applied: exports_external.object({
    model: exports_external.string(),
    effort: exports_external.enum(["low", "medium", "high", "max"]).nullable()
  }).optional().describe("Runtime-resolved values after env overrides, session state, and model-specific defaults are applied. Unlike `effective` (disk merge), these reflect what will actually be sent to the API.")
}).describe("Effective merged settings plus raw per-source settings in merge order."));
var SDKControlElicitationRequestSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("elicitation"),
  mcp_server_name: exports_external.string(),
  message: exports_external.string(),
  mode: exports_external.enum(["form", "url"]).optional(),
  url: exports_external.string().optional(),
  elicitation_id: exports_external.string().optional(),
  requested_schema: exports_external.record(exports_external.string(), exports_external.unknown()).optional()
}).describe("Requests the SDK consumer to handle an MCP elicitation (user input request)."));
var SDKControlElicitationResponseSchema = lazySchema(() => exports_external.object({
  action: exports_external.enum(["accept", "decline", "cancel"]),
  content: exports_external.record(exports_external.string(), exports_external.unknown()).optional()
}).describe("Response from the SDK consumer for an elicitation request."));
var SDKControlRequestInnerSchema = lazySchema(() => exports_external.union([
  SDKControlInterruptRequestSchema(),
  SDKControlPermissionRequestSchema(),
  SDKControlInitializeRequestSchema(),
  SDKControlSetPermissionModeRequestSchema(),
  SDKControlSetModelRequestSchema(),
  SDKControlSetMaxThinkingTokensRequestSchema(),
  SDKControlMcpStatusRequestSchema(),
  SDKControlGetContextUsageRequestSchema(),
  SDKHookCallbackRequestSchema(),
  SDKControlMcpMessageRequestSchema(),
  SDKControlRewindFilesRequestSchema(),
  SDKControlCancelAsyncMessageRequestSchema(),
  SDKControlSeedReadStateRequestSchema(),
  SDKControlMcpSetServersRequestSchema(),
  SDKControlReloadPluginsRequestSchema(),
  SDKControlMcpReconnectRequestSchema(),
  SDKControlMcpToggleRequestSchema(),
  SDKControlStopTaskRequestSchema(),
  SDKControlApplyFlagSettingsRequestSchema(),
  SDKControlGetSettingsRequestSchema(),
  SDKControlElicitationRequestSchema()
]));
var SDKControlRequestSchema = lazySchema(() => exports_external.object({
  type: exports_external.literal("control_request"),
  request_id: exports_external.string(),
  request: SDKControlRequestInnerSchema()
}));
var ControlResponseSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("success"),
  request_id: exports_external.string(),
  response: exports_external.record(exports_external.string(), exports_external.unknown()).optional()
}));
var ControlErrorResponseSchema = lazySchema(() => exports_external.object({
  subtype: exports_external.literal("error"),
  request_id: exports_external.string(),
  error: exports_external.string(),
  pending_permission_requests: exports_external.array(exports_external.lazy(() => SDKControlRequestSchema())).optional()
}));
var SDKControlResponseSchema = lazySchema(() => exports_external.object({
  type: exports_external.literal("control_response"),
  response: exports_external.union([ControlResponseSchema(), ControlErrorResponseSchema()])
}));
var SDKControlCancelRequestSchema = lazySchema(() => exports_external.object({
  type: exports_external.literal("control_cancel_request"),
  request_id: exports_external.string()
}).describe("Cancels a currently open control request."));
var SDKKeepAliveMessageSchema = lazySchema(() => exports_external.object({
  type: exports_external.literal("keep_alive")
}).describe("Keep-alive message to maintain WebSocket connection."));
var SDKUpdateEnvironmentVariablesMessageSchema = lazySchema(() => exports_external.object({
  type: exports_external.literal("update_environment_variables"),
  variables: exports_external.record(exports_external.string(), exports_external.string())
}).describe("Updates environment variables at runtime."));
var StdoutMessageSchema = lazySchema(() => exports_external.union([
  SDKMessageSchema(),
  SDKStreamlinedTextMessageSchema(),
  SDKStreamlinedToolUseSummaryMessageSchema(),
  SDKPostTurnSummaryMessageSchema(),
  SDKControlResponseSchema(),
  SDKControlRequestSchema(),
  SDKControlCancelRequestSchema(),
  SDKKeepAliveMessageSchema()
]));
var StdinMessageSchema = lazySchema(() => exports_external.union([
  SDKUserMessageSchema(),
  SDKControlRequestSchema(),
  SDKControlResponseSchema(),
  SDKKeepAliveMessageSchema(),
  SDKUpdateEnvironmentVariablesMessageSchema()
]));

// src/cli/structuredIO.ts
init_hooks();
init_debug();
init_diagLogs();
init_errors();
init_permissions();
init_process();
init_slowOperations();
init_v4();
init_commandLifecycle();
init_hooks2();
init_PermissionUpdate();
init_slowOperations();
init_stream();

// src/cli/ndjsonSafeStringify.ts
init_slowOperations();
var JS_LINE_TERMINATORS = /\u2028|\u2029/g;
function escapeJsLineTerminators(json) {
  return json.replace(JS_LINE_TERMINATORS, (c) => c === "\u2028" ? "\\u2028" : "\\u2029");
}
function ndjsonSafeStringify(value) {
  return escapeJsLineTerminators(jsonStringify(value));
}

// src/cli/structuredIO.ts
var SANDBOX_NETWORK_ACCESS_TOOL_NAME = "SandboxNetworkAccess";
function serializeDecisionReason(reason) {
  if (!reason) {
    return;
  }
  if (false) {}
  switch (reason.type) {
    case "rule":
    case "mode":
    case "subcommandResults":
    case "permissionPromptTool":
      return;
    case "hook":
    case "asyncAgent":
    case "sandboxOverride":
    case "workingDir":
    case "safetyCheck":
    case "other":
      return reason.reason;
  }
}
function buildRequiresActionDetails(tool, input, toolUseID, requestId) {
  let description;
  try {
    description = tool.getActivityDescription?.(input) ?? tool.getToolUseSummary?.(input) ?? tool.userFacingName(input);
  } catch {
    description = tool.name;
  }
  return {
    tool_name: tool.name,
    action_description: description,
    tool_use_id: toolUseID,
    request_id: requestId,
    input
  };
}
var MAX_RESOLVED_TOOL_USE_IDS = 1000;

class StructuredIO {
  input;
  replayUserMessages;
  structuredInput;
  pendingRequests = new Map;
  restoredWorkerState = Promise.resolve(null);
  inputClosed = false;
  unexpectedResponseCallback;
  resolvedToolUseIds = new Set;
  prependedLines = [];
  onControlRequestSent;
  onControlRequestResolved;
  outbound = new Stream;
  constructor(input, replayUserMessages) {
    this.input = input;
    this.replayUserMessages = replayUserMessages;
    this.input = input;
    this.structuredInput = this.read();
  }
  trackResolvedToolUseId(request) {
    const inner = request.request;
    if (inner.subtype === "can_use_tool") {
      this.resolvedToolUseIds.add(inner.tool_use_id);
      if (this.resolvedToolUseIds.size > MAX_RESOLVED_TOOL_USE_IDS) {
        const first = this.resolvedToolUseIds.values().next().value;
        if (first !== undefined) {
          this.resolvedToolUseIds.delete(first);
        }
      }
    }
  }
  flushInternalEvents() {
    return Promise.resolve();
  }
  get internalEventsPending() {
    return 0;
  }
  prependUserMessage(content) {
    this.prependedLines.push(jsonStringify({
      type: "user",
      content,
      uuid: "",
      session_id: "",
      message: { role: "user", content },
      parent_tool_use_id: null
    }) + `
`);
  }
  async* read() {
    let content = "";
    const splitAndProcess = async function* () {
      for (;; ) {
        if (this.prependedLines.length > 0) {
          content = this.prependedLines.join("") + content;
          this.prependedLines = [];
        }
        const newline = content.indexOf(`
`);
        if (newline === -1)
          break;
        const line = content.slice(0, newline);
        content = content.slice(newline + 1);
        const message = await this.processLine(line);
        if (message) {
          logForDiagnosticsNoPII("info", "cli_stdin_message_parsed", {
            type: message.type
          });
          yield message;
        }
      }
    }.bind(this);
    yield* splitAndProcess();
    for await (const block of this.input) {
      content += block;
      yield* splitAndProcess();
    }
    if (content) {
      const message = await this.processLine(content);
      if (message) {
        yield message;
      }
    }
    this.inputClosed = true;
    for (const request of this.pendingRequests.values()) {
      request.reject(new Error("Tool permission stream closed before response received"));
    }
  }
  getPendingPermissionRequests() {
    return Array.from(this.pendingRequests.values()).map((entry) => entry.request).filter((pr) => pr.request.subtype === "can_use_tool");
  }
  setUnexpectedResponseCallback(callback) {
    this.unexpectedResponseCallback = callback;
  }
  injectControlResponse(response) {
    const responseInner = response.response;
    const requestId = responseInner?.request_id;
    if (!requestId)
      return;
    const request = this.pendingRequests.get(requestId);
    if (!request)
      return;
    this.trackResolvedToolUseId(request.request);
    this.pendingRequests.delete(requestId);
    this.write({
      type: "control_cancel_request",
      request_id: requestId
    });
    if (responseInner.subtype === "error") {
      request.reject(new Error(responseInner.error));
    } else {
      const result = responseInner.response;
      if (request.schema) {
        try {
          request.resolve(request.schema.parse(result));
        } catch (error) {
          request.reject(error);
        }
      } else {
        request.resolve({});
      }
    }
  }
  setOnControlRequestSent(callback) {
    this.onControlRequestSent = callback;
  }
  setOnControlRequestResolved(callback) {
    this.onControlRequestResolved = callback;
  }
  async processLine(line) {
    if (!line) {
      return;
    }
    try {
      const message = normalizeControlMessageKeys(jsonParse(line));
      if (message.type === "keep_alive") {
        return;
      }
      if (message.type === "update_environment_variables") {
        const variables = message.variables;
        const keys = Object.keys(variables);
        for (const [key, value] of Object.entries(variables)) {
          process.env[key] = value;
        }
        logForDebugging(`[structuredIO] applied update_environment_variables: ${keys.join(", ")}`);
        return;
      }
      if (message.type === "control_response") {
        const uuid = "uuid" in message && typeof message.uuid === "string" ? message.uuid : undefined;
        if (uuid) {
          notifyCommandLifecycle(uuid, "completed");
        }
        const request = this.pendingRequests.get(message.response.request_id);
        if (!request) {
          const responsePayload = message.response.subtype === "success" ? message.response.response : undefined;
          const toolUseID = responsePayload?.toolUseID;
          if (typeof toolUseID === "string" && this.resolvedToolUseIds.has(toolUseID)) {
            logForDebugging(`Ignoring duplicate control_response for already-resolved toolUseID=${toolUseID} request_id=${message.response.request_id}`);
            return;
          }
          if (this.unexpectedResponseCallback) {
            await this.unexpectedResponseCallback(message);
          }
          return;
        }
        this.trackResolvedToolUseId(request.request);
        this.pendingRequests.delete(message.response.request_id);
        if (request.request.request.subtype === "can_use_tool" && this.onControlRequestResolved) {
          this.onControlRequestResolved(message.response.request_id);
        }
        if (message.response.subtype === "error") {
          request.reject(new Error(message.response.error));
          return;
        }
        const result = message.response.response;
        if (request.schema) {
          try {
            request.resolve(request.schema.parse(result));
          } catch (error) {
            request.reject(error);
          }
        } else {
          request.resolve({});
        }
        if (this.replayUserMessages) {
          return message;
        }
        return;
      }
      if (message.type !== "user" && message.type !== "control_request" && message.type !== "assistant" && message.type !== "system") {
        logForDebugging(`Ignoring unknown message type: ${message.type}`, {
          level: "warn"
        });
        return;
      }
      if (message.type === "control_request") {
        if (!message.request) {
          exitWithMessage(`Error: Missing request on control_request`);
        }
        return message;
      }
      if (message.type === "assistant" || message.type === "system") {
        return message;
      }
      if (message.message.role !== "user") {
        exitWithMessage(`Error: Expected message role 'user', got '${message.message.role}'`);
      }
      return message;
    } catch (error) {
      console.error(`Error parsing streaming input line: ${line}: ${error}`);
      process.exit(1);
    }
  }
  async write(message) {
    writeToStdout(ndjsonSafeStringify(message) + `
`);
  }
  async sendRequest(request, schema, signal, requestId = randomUUID2()) {
    const message = {
      type: "control_request",
      request_id: requestId,
      request
    };
    if (this.inputClosed) {
      throw new Error("Stream closed");
    }
    if (signal?.aborted) {
      throw new Error("Request aborted");
    }
    this.outbound.enqueue(message);
    if (request.subtype === "can_use_tool" && this.onControlRequestSent) {
      this.onControlRequestSent(message);
    }
    const aborted = () => {
      this.outbound.enqueue({
        type: "control_cancel_request",
        request_id: requestId
      });
      const request2 = this.pendingRequests.get(requestId);
      if (request2) {
        this.trackResolvedToolUseId(request2.request);
        request2.reject(new AbortError);
      }
    };
    if (signal) {
      signal.addEventListener("abort", aborted, {
        once: true
      });
    }
    try {
      return await new Promise((resolve, reject) => {
        this.pendingRequests.set(requestId, {
          request: {
            type: "control_request",
            request_id: requestId,
            request
          },
          resolve: (result) => {
            resolve(result);
          },
          reject,
          schema
        });
      });
    } finally {
      if (signal) {
        signal.removeEventListener("abort", aborted);
      }
      this.pendingRequests.delete(requestId);
    }
  }
  createCanUseTool(onPermissionPrompt) {
    return async (tool, input, toolUseContext, assistantMessage, toolUseID, forceDecision) => {
      const mainPermissionResult = forceDecision ?? await hasPermissionsToUseTool(tool, input, toolUseContext, assistantMessage, toolUseID);
      if (mainPermissionResult.behavior === "allow" || mainPermissionResult.behavior === "deny") {
        return mainPermissionResult;
      }
      const hookAbortController = new AbortController;
      const parentSignal = toolUseContext.abortController.signal;
      const onParentAbort = () => hookAbortController.abort();
      parentSignal.addEventListener("abort", onParentAbort, { once: true });
      try {
        const hookPromise = executePermissionRequestHooksForSDK(tool.name, toolUseID, input, toolUseContext, mainPermissionResult.suggestions).then((decision) => ({ source: "hook", decision }));
        const requestId = randomUUID2();
        onPermissionPrompt?.(buildRequiresActionDetails(tool, input, toolUseID, requestId));
        const sdkPromise = this.sendRequest({
          subtype: "can_use_tool",
          tool_name: tool.name,
          input,
          permission_suggestions: mainPermissionResult.suggestions,
          blocked_path: mainPermissionResult.blockedPath,
          decision_reason: serializeDecisionReason(mainPermissionResult.decisionReason),
          tool_use_id: toolUseID,
          agent_id: toolUseContext.agentId
        }, outputSchema(), hookAbortController.signal, requestId).then((result) => ({ source: "sdk", result }));
        const winner = await Promise.race([hookPromise, sdkPromise]);
        if (winner.source === "hook") {
          if (winner.decision) {
            sdkPromise.catch(() => {});
            hookAbortController.abort();
            return winner.decision;
          }
          const sdkResult = await sdkPromise;
          return permissionPromptToolResultToPermissionDecision(sdkResult.result, tool, input, toolUseContext);
        }
        return permissionPromptToolResultToPermissionDecision(winner.result, tool, input, toolUseContext);
      } catch (error) {
        return permissionPromptToolResultToPermissionDecision({
          behavior: "deny",
          message: `Tool permission request failed: ${error}`,
          toolUseID
        }, tool, input, toolUseContext);
      } finally {
        if (this.getPendingPermissionRequests().length === 0) {
          notifySessionStateChanged("running");
        }
        parentSignal.removeEventListener("abort", onParentAbort);
      }
    };
  }
  createHookCallback(callbackId, timeout) {
    return {
      type: "callback",
      timeout,
      callback: async (input, toolUseID, abort) => {
        try {
          const result = await this.sendRequest({
            subtype: "hook_callback",
            callback_id: callbackId,
            input,
            tool_use_id: toolUseID || undefined
          }, hookJSONOutputSchema(), abort);
          return result;
        } catch (error) {
          console.error(`Error in hook callback ${callbackId}:`, error);
          return {};
        }
      }
    };
  }
  async handleElicitation(serverName, message, requestedSchema, signal, mode, url, elicitationId) {
    try {
      const result = await this.sendRequest({
        subtype: "elicitation",
        mcp_server_name: serverName,
        message,
        mode,
        url,
        elicitation_id: elicitationId,
        requested_schema: requestedSchema
      }, SDKControlElicitationResponseSchema(), signal);
      return result;
    } catch {
      return { action: "cancel" };
    }
  }
  createSandboxAskCallback() {
    return async (hostPattern) => {
      try {
        const result = await this.sendRequest({
          subtype: "can_use_tool",
          tool_name: SANDBOX_NETWORK_ACCESS_TOOL_NAME,
          input: { host: hostPattern.host },
          tool_use_id: randomUUID2(),
          description: `Allow network connection to ${hostPattern.host}?`
        }, outputSchema());
        return result.behavior === "allow";
      } catch {
        return false;
      }
    };
  }
  async sendMcpMessage(serverName, message) {
    const response = await this.sendRequest({
      subtype: "mcp_message",
      server_name: serverName,
      message
    }, exports_external.object({
      mcp_response: exports_external.any()
    }));
    return response.mcp_response;
  }
}
function exitWithMessage(message) {
  console.error(message);
  process.exit(1);
}
async function executePermissionRequestHooksForSDK(toolName, toolUseID, input, toolUseContext, suggestions) {
  const appState = toolUseContext.getAppState();
  const permissionMode = appState.toolPermissionContext.mode;
  const hookGenerator = executePermissionRequestHooks(toolName, toolUseID, input, toolUseContext, permissionMode, suggestions, toolUseContext.abortController.signal);
  for await (const hookResult of hookGenerator) {
    if (hookResult.permissionRequestResult && (hookResult.permissionRequestResult.behavior === "allow" || hookResult.permissionRequestResult.behavior === "deny")) {
      const decision = hookResult.permissionRequestResult;
      if (decision.behavior === "allow") {
        const finalInput = decision.updatedInput || input;
        const permissionUpdates = decision.updatedPermissions ?? [];
        if (permissionUpdates.length > 0) {
          persistPermissionUpdates(permissionUpdates);
          const currentAppState = toolUseContext.getAppState();
          const updatedContext = applyPermissionUpdates(currentAppState.toolPermissionContext, permissionUpdates);
          toolUseContext.setAppState((prev) => {
            if (prev.toolPermissionContext === updatedContext)
              return prev;
            return { ...prev, toolPermissionContext: updatedContext };
          });
        }
        return {
          behavior: "allow",
          updatedInput: finalInput,
          userModified: false,
          decisionReason: {
            type: "hook",
            hookName: "PermissionRequest"
          }
        };
      } else {
        return {
          behavior: "deny",
          message: decision.message || "Permission denied by PermissionRequest hook",
          decisionReason: {
            type: "hook",
            hookName: "PermissionRequest"
          }
        };
      }
    }
  }
  return;
}

// src/utils/messages/systemInit.ts
init_state();
init_outputStyles();
init_constants();
init_auth();
init_cwd();
init_fastMode();
init_settings();
import { randomUUID as randomUUID3 } from "crypto";
function sdkCompatToolName(name) {
  return name === AGENT_TOOL_NAME ? LEGACY_AGENT_TOOL_NAME : name;
}
function buildSystemInitMessage(inputs) {
  const settings = getSettings_DEPRECATED();
  const outputStyle = settings?.outputStyle ?? DEFAULT_OUTPUT_STYLE_NAME;
  const initMessage = {
    type: "system",
    subtype: "init",
    cwd: getCwd(),
    session_id: getSessionId(),
    tools: inputs.tools.map((tool) => sdkCompatToolName(tool.name)),
    mcp_servers: inputs.mcpClients.map((client) => ({
      name: client.name,
      status: client.type
    })),
    model: inputs.model,
    permissionMode: inputs.permissionMode,
    slash_commands: inputs.commands.filter((c) => c.userInvocable !== false).map((c) => c.name),
    apiKeySource: getAnthropicApiKeyWithSource().source,
    betas: getSdkBetas(),
    claude_code_version: MACRO.VERSION,
    output_style: outputStyle,
    agents: inputs.agents.map((agent) => agent.agentType),
    skills: inputs.skills.filter((s) => s.userInvocable !== false).map((skill) => skill.name),
    plugins: inputs.plugins.map((plugin) => ({
      name: plugin.name,
      path: plugin.path,
      source: plugin.source
    })),
    uuid: randomUUID3()
  };
  if (false) {}
  initMessage.fast_mode_state = getFastModeState(inputs.model, inputs.fastMode);
  return initMessage;
}

// src/utils/ultraplan/keyword.ts
var OPEN_TO_CLOSE = {
  "`": "`",
  '"': '"',
  "<": ">",
  "{": "}",
  "[": "]",
  "(": ")",
  "'": "'"
};
function findKeywordTriggerPositions(text, keyword) {
  const re = new RegExp(keyword, "i");
  if (!re.test(text))
    return [];
  if (text.startsWith("/"))
    return [];
  const quotedRanges = [];
  let openQuote = null;
  let openAt = 0;
  const isWord = (ch) => !!ch && /[\p{L}\p{N}_]/u.test(ch);
  for (let i = 0;i < text.length; i++) {
    const ch = text[i];
    if (openQuote) {
      if (openQuote === "[" && ch === "[") {
        openAt = i;
        continue;
      }
      if (ch !== OPEN_TO_CLOSE[openQuote])
        continue;
      if (openQuote === "'" && isWord(text[i + 1]))
        continue;
      quotedRanges.push({ start: openAt, end: i + 1 });
      openQuote = null;
    } else if (ch === "<" && i + 1 < text.length && /[a-zA-Z/]/.test(text[i + 1]) || ch === "'" && !isWord(text[i - 1]) || ch !== "<" && ch !== "'" && ch in OPEN_TO_CLOSE) {
      openQuote = ch;
      openAt = i;
    }
  }
  const positions = [];
  const wordRe = new RegExp(`\\b${keyword}\\b`, "gi");
  const matches = text.matchAll(wordRe);
  for (const match of matches) {
    if (match.index === undefined)
      continue;
    const start = match.index;
    const end = start + match[0].length;
    if (quotedRanges.some((r) => start >= r.start && start < r.end))
      continue;
    const before = text[start - 1];
    const after = text[end];
    if (before === "/" || before === "\\" || before === "-")
      continue;
    if (after === "/" || after === "\\" || after === "-" || after === "?")
      continue;
    if (after === "." && isWord(text[end + 1]))
      continue;
    positions.push({ word: match[0], start, end });
  }
  return positions;
}
function findUltrareviewTriggerPositions(text) {
  return findKeywordTriggerPositions(text, "ultrareview");
}

// src/utils/processUserInput/processUserInput.ts
init_analytics();
init_messages();
init_commands();
init_textInputTypes();
init_attachments();
init_generators();
init_hooks2();
init_imageResizer();
init_imageStore();
init_messages();
init_queryProfiler();
init_slashCommandParsing();
import { randomUUID as randomUUID5 } from "crypto";

// src/utils/processUserInput/processTextPrompt.ts
init_state();
init_analytics();
init_messages();
init_events();
init_sessionTracing();
import { randomUUID as randomUUID4 } from "crypto";

// src/utils/userPromptKeywords.ts
function matchesNegativeKeyword(input) {
  const lowerInput = input.toLowerCase();
  const negativePattern = /\b(wtf|wth|ffs|omfg|shit(ty|tiest)?|dumbass|horrible|awful|piss(ed|ing)? off|piece of (shit|crap|junk)|what the (fuck|hell)|fucking? (broken|useless|terrible|awful|horrible)|fuck you|screw (this|you)|so frustrating|this sucks|damn it)\b/;
  return negativePattern.test(lowerInput);
}
function matchesKeepGoingKeyword(input) {
  const lowerInput = input.toLowerCase().trim();
  if (lowerInput === "continue") {
    return true;
  }
  const keepGoingPattern = /\b(keep going|go on)\b/;
  return keepGoingPattern.test(lowerInput);
}

// src/utils/processUserInput/processTextPrompt.ts
function processTextPrompt(input, imageContentBlocks, imagePasteIds, attachmentMessages, uuid, permissionMode, isMeta) {
  const promptId = randomUUID4();
  setPromptId(promptId);
  const userPromptText = typeof input === "string" ? input : input.find((block) => block.type === "text")?.text || "";
  startInteractionSpan(userPromptText);
  const otelPromptText = typeof input === "string" ? input : input.findLast((block) => block.type === "text")?.text || "";
  if (otelPromptText) {
    logOTelEvent("user_prompt", {
      prompt_length: String(otelPromptText.length),
      prompt: redactIfDisabled(otelPromptText),
      "prompt.id": promptId
    });
  }
  const isNegative = matchesNegativeKeyword(userPromptText);
  const isKeepGoing = matchesKeepGoingKeyword(userPromptText);
  logEvent("tengu_input_prompt", {
    is_negative: isNegative,
    is_keep_going: isKeepGoing
  });
  if (imageContentBlocks.length > 0) {
    const textContent = typeof input === "string" ? input.trim() ? [{ type: "text", text: input }] : [] : input;
    const userMessage2 = createUserMessage({
      content: [...textContent, ...imageContentBlocks],
      uuid,
      imagePasteIds: imagePasteIds.length > 0 ? imagePasteIds : undefined,
      permissionMode,
      isMeta: isMeta || undefined
    });
    return {
      messages: [userMessage2, ...attachmentMessages],
      shouldQuery: true
    };
  }
  const userMessage = createUserMessage({
    content: input,
    uuid,
    permissionMode,
    isMeta: isMeta || undefined
  });
  return {
    messages: [userMessage, ...attachmentMessages],
    shouldQuery: true
  };
}

// src/utils/processUserInput/processUserInput.ts
async function processUserInput({
  input,
  preExpansionInput,
  mode,
  setToolJSX,
  context,
  pastedContents,
  ideSelection,
  messages,
  setUserInputOnProcessing,
  uuid,
  isAlreadyProcessing,
  querySource,
  canUseTool,
  skipSlashCommands,
  bridgeOrigin,
  isMeta,
  skipAttachments
}) {
  const inputString = typeof input === "string" ? input : null;
  if (mode === "prompt" && inputString !== null && !isMeta) {
    setUserInputOnProcessing?.(inputString);
  }
  queryCheckpoint("query_process_user_input_base_start");
  const appState = context.getAppState();
  const result = await processUserInputBase(input, mode, setToolJSX, context, pastedContents, ideSelection, messages, uuid, isAlreadyProcessing, querySource, canUseTool, appState.toolPermissionContext.mode, skipSlashCommands, bridgeOrigin, isMeta, skipAttachments, preExpansionInput);
  queryCheckpoint("query_process_user_input_base_end");
  if (!result.shouldQuery) {
    return result;
  }
  queryCheckpoint("query_hooks_start");
  const inputMessage = getContentText(input) || "";
  for await (const hookResult of executeUserPromptSubmitHooks(inputMessage, appState.toolPermissionContext.mode, context, context.requestPrompt)) {
    if (hookResult.message?.type === "progress") {
      continue;
    }
    if (hookResult.blockingError) {
      const blockingMessage = getUserPromptSubmitHookBlockingMessage(hookResult.blockingError);
      return {
        messages: [
          createSystemMessage(`${blockingMessage}

Original prompt: ${input}`, "warning")
        ],
        shouldQuery: false,
        allowedTools: result.allowedTools
      };
    }
    if (hookResult.preventContinuation) {
      const message = hookResult.stopReason ? `Operation stopped by hook: ${hookResult.stopReason}` : "Operation stopped by hook";
      result.messages.push(createUserMessage({
        content: message
      }));
      result.shouldQuery = false;
      return result;
    }
    if (hookResult.additionalContexts && hookResult.additionalContexts.length > 0) {
      result.messages.push(createAttachmentMessage({
        type: "hook_additional_context",
        content: hookResult.additionalContexts.map(applyTruncation),
        hookName: "UserPromptSubmit",
        toolUseID: `hook-${randomUUID5()}`,
        hookEvent: "UserPromptSubmit"
      }));
    }
    if (hookResult.message) {
      switch (hookResult.message.attachment.type) {
        case "hook_success":
          if (!hookResult.message.attachment.content) {
            break;
          }
          result.messages.push({
            ...hookResult.message,
            attachment: {
              ...hookResult.message.attachment,
              content: applyTruncation(hookResult.message.attachment.content)
            }
          });
          break;
        default:
          result.messages.push(hookResult.message);
          break;
      }
    }
  }
  queryCheckpoint("query_hooks_end");
  return result;
}
var MAX_HOOK_OUTPUT_LENGTH = 1e4;
function applyTruncation(content) {
  if (content.length > MAX_HOOK_OUTPUT_LENGTH) {
    return `${content.substring(0, MAX_HOOK_OUTPUT_LENGTH)}\u2026 [output truncated - exceeded ${MAX_HOOK_OUTPUT_LENGTH} characters]`;
  }
  return content;
}
async function processUserInputBase(input, mode, setToolJSX, context, pastedContents, ideSelection, messages, uuid, isAlreadyProcessing, querySource, canUseTool, permissionMode, skipSlashCommands, bridgeOrigin, isMeta, skipAttachments, preExpansionInput) {
  let inputString = null;
  let precedingInputBlocks = [];
  const imageMetadataTexts = [];
  let normalizedInput = input;
  if (typeof input === "string") {
    inputString = input;
  } else if (input.length > 0) {
    queryCheckpoint("query_image_processing_start");
    const processedBlocks = [];
    for (const block of input) {
      if (block.type === "image") {
        const resized = await maybeResizeAndDownsampleImageBlock(block);
        if (resized.dimensions) {
          const metadataText = createImageMetadataText(resized.dimensions);
          if (metadataText) {
            imageMetadataTexts.push(metadataText);
          }
        }
        processedBlocks.push(resized.block);
      } else {
        processedBlocks.push(block);
      }
    }
    normalizedInput = processedBlocks;
    queryCheckpoint("query_image_processing_end");
    const lastBlock = processedBlocks[processedBlocks.length - 1];
    if (lastBlock?.type === "text") {
      inputString = lastBlock.text;
      precedingInputBlocks = processedBlocks.slice(0, -1);
    } else {
      precedingInputBlocks = processedBlocks;
    }
  }
  if (inputString === null && mode !== "prompt") {
    throw new Error(`Mode: ${mode} requires a string input.`);
  }
  const imageContents = pastedContents ? Object.values(pastedContents).filter(isValidImagePaste) : [];
  const imagePasteIds = imageContents.map((img) => img.id);
  const storedImagePaths = pastedContents ? await storeImages(pastedContents) : new Map;
  queryCheckpoint("query_pasted_image_processing_start");
  const imageProcessingResults = await Promise.all(imageContents.map(async (pastedImage) => {
    const imageBlock = {
      type: "image",
      source: {
        type: "base64",
        media_type: pastedImage.mediaType || "image/png",
        data: pastedImage.content
      }
    };
    logEvent("tengu_pasted_image_resize_attempt", {
      original_size_bytes: pastedImage.content.length
    });
    const resized = await maybeResizeAndDownsampleImageBlock(imageBlock);
    return {
      resized,
      originalDimensions: pastedImage.dimensions,
      sourcePath: pastedImage.sourcePath ?? storedImagePaths.get(pastedImage.id)
    };
  }));
  const imageContentBlocks = [];
  for (const {
    resized,
    originalDimensions,
    sourcePath
  } of imageProcessingResults) {
    if (resized.dimensions) {
      const metadataText = createImageMetadataText(resized.dimensions, sourcePath);
      if (metadataText) {
        imageMetadataTexts.push(metadataText);
      }
    } else if (originalDimensions) {
      const metadataText = createImageMetadataText(originalDimensions, sourcePath);
      if (metadataText) {
        imageMetadataTexts.push(metadataText);
      }
    } else if (sourcePath) {
      imageMetadataTexts.push(`[Image source: ${sourcePath}]`);
    }
    imageContentBlocks.push(resized.block);
  }
  queryCheckpoint("query_pasted_image_processing_end");
  let effectiveSkipSlash = skipSlashCommands;
  if (bridgeOrigin && inputString !== null && inputString.startsWith("/")) {
    const parsed = parseSlashCommand(inputString);
    const cmd = parsed ? findCommand(parsed.commandName, context.options.commands) : undefined;
    if (cmd) {
      if (isBridgeSafeCommand(cmd)) {
        effectiveSkipSlash = false;
      } else {
        const msg = `/${getCommandName(cmd)} isn't available over Remote Control.`;
        return {
          messages: [
            createUserMessage({ content: inputString, uuid }),
            createCommandInputMessage(`<local-command-stdout>${msg}</local-command-stdout>`)
          ],
          shouldQuery: false,
          resultText: msg
        };
      }
    }
  }
  if (false) {}
  const shouldExtractAttachments = !skipAttachments && inputString !== null && (mode !== "prompt" || effectiveSkipSlash || !inputString.startsWith("/"));
  queryCheckpoint("query_attachment_loading_start");
  const attachmentMessages = shouldExtractAttachments ? await toArray(getAttachmentMessages(inputString, context, ideSelection ?? null, [], messages, querySource)) : [];
  queryCheckpoint("query_attachment_loading_end");
  if (inputString !== null && mode === "bash") {
    const { processBashCommand } = await import("./chunk-cjg1snd8.js");
    return addImageMetadataMessage(await processBashCommand(inputString, precedingInputBlocks, attachmentMessages, context, setToolJSX), imageMetadataTexts);
  }
  if (inputString !== null && !effectiveSkipSlash && inputString.startsWith("/")) {
    const { processSlashCommand } = await import("./chunk-2f79p8yb.js");
    const slashResult = await processSlashCommand(inputString, precedingInputBlocks, imageContentBlocks, attachmentMessages, context, setToolJSX, uuid, isAlreadyProcessing, canUseTool);
    return addImageMetadataMessage(slashResult, imageMetadataTexts);
  }
  if (inputString !== null && mode === "prompt") {
    const trimmedInput = inputString.trim();
    const agentMention = attachmentMessages.find((m) => m.attachment.type === "agent_mention");
    if (agentMention) {
      const agentMentionString = `@agent-${agentMention.attachment.agentType}`;
      const isSubagentOnly = trimmedInput === agentMentionString;
      const isPrefix = trimmedInput.startsWith(agentMentionString) && !isSubagentOnly;
      logEvent("tengu_subagent_at_mention", {
        is_subagent_only: isSubagentOnly,
        is_prefix: isPrefix
      });
    }
  }
  return addImageMetadataMessage(processTextPrompt(normalizedInput, imageContentBlocks, imagePasteIds, attachmentMessages, uuid, permissionMode, isMeta), imageMetadataTexts);
}
function addImageMetadataMessage(result, imageMetadataTexts) {
  if (imageMetadataTexts.length > 0) {
    result.messages.push(createUserMessage({
      content: imageMetadataTexts.map((text) => ({ type: "text", text })),
      isMeta: true
    }));
  }
  return result;
}

// src/utils/plugins/reconciler.ts
init_isEqual();
init_state();
init_debug();
init_errors();
init_file();
init_git();
init_log();
init_marketplaceManager();
init_schemas();
import { isAbsolute, resolve } from "path";
function diffMarketplaces(declared, materialized, opts) {
  const missing = [];
  const sourceChanged = [];
  const upToDate = [];
  for (const [name, intent] of Object.entries(declared)) {
    const state = materialized[name];
    const normalizedIntent = normalizeSource(intent.source, opts?.projectRoot);
    if (!state) {
      missing.push(name);
    } else if (intent.sourceIsFallback) {
      upToDate.push(name);
    } else if (!isEqual_default(normalizedIntent, state.source)) {
      sourceChanged.push({
        name,
        declaredSource: normalizedIntent,
        materializedSource: state.source
      });
    } else {
      upToDate.push(name);
    }
  }
  return { missing, sourceChanged, upToDate };
}
async function reconcileMarketplaces(opts) {
  const declared = getDeclaredMarketplaces();
  if (Object.keys(declared).length === 0) {
    return { installed: [], updated: [], failed: [], upToDate: [], skipped: [] };
  }
  let materialized;
  try {
    materialized = await loadKnownMarketplacesConfig();
  } catch (e) {
    logError(e);
    materialized = {};
  }
  const diff = diffMarketplaces(declared, materialized, {
    projectRoot: getOriginalCwd()
  });
  const work = [
    ...diff.missing.map((name) => ({
      name,
      source: normalizeSource(declared[name].source),
      action: "install"
    })),
    ...diff.sourceChanged.map(({ name, declaredSource }) => ({
      name,
      source: declaredSource,
      action: "update"
    }))
  ];
  const skipped = [];
  const toProcess = [];
  for (const item of work) {
    if (opts?.skip?.(item.name, item.source)) {
      skipped.push(item.name);
      continue;
    }
    if (item.action === "update" && isLocalMarketplaceSource(item.source) && !await pathExists(item.source.path)) {
      logForDebugging(`[reconcile] '${item.name}' declared path does not exist; keeping materialized entry`);
      skipped.push(item.name);
      continue;
    }
    toProcess.push(item);
  }
  if (toProcess.length === 0) {
    return {
      installed: [],
      updated: [],
      failed: [],
      upToDate: diff.upToDate,
      skipped
    };
  }
  logForDebugging(`[reconcile] ${toProcess.length} marketplace(s): ${toProcess.map((w) => `${w.name}(${w.action})`).join(", ")}`);
  const installed = [];
  const updated = [];
  const failed = [];
  for (let i = 0;i < toProcess.length; i++) {
    const { name, source, action } = toProcess[i];
    opts?.onProgress?.({
      type: "installing",
      name,
      action,
      index: i + 1,
      total: toProcess.length
    });
    try {
      const result = await addMarketplaceSource(source);
      if (action === "install")
        installed.push(name);
      else
        updated.push(name);
      opts?.onProgress?.({
        type: "installed",
        name,
        alreadyMaterialized: result.alreadyMaterialized
      });
    } catch (e) {
      const error = errorMessage(e);
      failed.push({ name, error });
      opts?.onProgress?.({ type: "failed", name, error });
      logError(e);
    }
  }
  return { installed, updated, failed, upToDate: diff.upToDate, skipped };
}
function normalizeSource(source, projectRoot) {
  if ((source.source === "directory" || source.source === "file") && !isAbsolute(source.path)) {
    const base = projectRoot ?? getOriginalCwd();
    const canonicalRoot = findCanonicalGitRoot(base);
    return {
      ...source,
      path: resolve(canonicalRoot ?? base, source.path)
    };
  }
  return source;
}

export { extractInboundMessageFields, sdkCompatToolName, buildSystemInitMessage, MessageSelector, selectableUserMessagesFilter, messagesAfterAreOnlySynthetic, exports_MessageSelector, init_MessageSelector, findUltrareviewTriggerPositions, processUserInput, outputSchema, permissionPromptToolResultToPermissionDecision, ndjsonSafeStringify, StructuredIO, diffMarketplaces, reconcileMarketplaces };
