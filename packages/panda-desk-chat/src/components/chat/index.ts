// Input: N/A (barrel export)
// Output: All chat-layer message display components
// Pos: Chat layer — unified export for message stream components

export { PdMessageList, type PdMessageListProps, type UIMessage } from "./PdMessageList";
export { PdUserBubble, type PdUserBubbleProps } from "./PdUserBubble";
export {
  PdMessageBubble,
  type PdMessageBubbleProps,
  type ToolCallInfo,
} from "./PdMessageBubble";

export { PdComposer } from "./PdComposer";
export type { PdComposerProps, PdComposerHandle, Attachment, AttachmentRef } from "./PdComposer";

// S5 Composer 套件（cc-haha 1:1）
export { PdAttachmentGallery } from "./PdAttachmentGallery";
export type { AttachmentPreview } from "./PdAttachmentGallery";
export { PdImageGalleryModal } from "./PdImageGalleryModal";
export { PdFileSearchMenu } from "./PdFileSearchMenu";
export type { PdFileSearchMenuHandle } from "./PdFileSearchMenu";
export { PdLocalSlashCommandPanel } from "./PdLocalSlashCommandPanel";
export type { LocalSlashCommandName } from "./PdLocalSlashCommandPanel";
export { PdComputerUsePermissionModal } from "./PdComputerUsePermissionModal";
export {
  PANEL_SLASH_COMMANDS,
  SETTINGS_SLASH_COMMANDS,
  FALLBACK_SLASH_COMMANDS,
  resolveSlashUiAction,
  mergeSlashCommands,
  findSlashTrigger,
  replaceSlashToken,
  findSlashToken,
  replaceSlashCommand,
  insertSlashTrigger,
} from "./composerUtils";
export type { SlashCommandOption, SlashUiAction, SlashTrigger, SlashToken } from "./composerUtils";

export { PdThinkingBlock } from "./PdThinkingBlock";
export type { PdThinkingBlockProps } from "./PdThinkingBlock";

export { PdToolCallCard } from "./PdToolCallCard";
export type { PdToolCallCardProps, ToolCallStatus } from "./PdToolCallCard";

export { PdToolCallGroup } from "./PdToolCallGroup";
export type { PdToolCallGroupProps } from "./PdToolCallGroup";

export { PdToolResultBlock } from "./PdToolResultBlock";
export type { PdToolResultBlockProps } from "./PdToolResultBlock";

export { PdSessionHeader } from "./PdSessionHeader";
export type { PdSessionHeaderProps } from "./PdSessionHeader";

export { PdMessageActionBar } from "./PdMessageActionBar";
export type { PdMessageActionBarProps } from "./PdMessageActionBar";

export { PdTerminalChrome } from "./PdTerminalChrome";
export type { PdTerminalChromeProps } from "./PdTerminalChrome";

export { PdPermissionDialog } from "./PdPermissionDialog";
export type {
  PdPermissionDialogProps,
  PermissionTier,
  PermissionDecision,
} from "./PdPermissionDialog";

export { PdMarkdownRenderer } from "./PdMarkdownRenderer";
export type { PdMarkdownRendererProps } from "./PdMarkdownRenderer";

export { PdCodeViewer } from "./PdCodeViewer";
export type { PdCodeViewerProps } from "./PdCodeViewer";

export { PdMermaidRenderer } from "./PdMermaidRenderer";
export type { PdMermaidRendererProps } from "./PdMermaidRenderer";

export { PdCopyButton } from "./PdCopyButton";
export type { PdCopyButtonProps } from "./PdCopyButton";

export { PdHeroComposer } from "./PdHeroComposer";
export type { PdHeroComposerProps } from "./PdHeroComposer";

export { PdDiffViewer } from "./PdDiffViewer";
export type { PdDiffViewerProps } from "./PdDiffViewer";

export { PdAskUserQuestion } from "./PdAskUserQuestion";
export type { PdAskUserQuestionProps } from "./PdAskUserQuestion";

export { PdInlineTaskSummary } from "./PdInlineTaskSummary";
export type { PdInlineTaskSummaryProps } from "./PdInlineTaskSummary";

export { PdInlineImageGallery } from "./PdInlineImageGallery";
export type { PdInlineImageGalleryProps } from "./PdInlineImageGallery";

export { PdSessionTaskBar } from "./PdSessionTaskBar";

export { PdStreamingIndicator } from "./PdStreamingIndicator";
