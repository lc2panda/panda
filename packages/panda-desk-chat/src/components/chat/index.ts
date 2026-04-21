// Input: N/A (barrel export)
// Output: All chat-layer message display components
// Pos: Chat layer — unified export for message stream components

export { MessageList, type MessageListProps, type UIMessage } from "./MessageList";
export { UserMessage, type UserMessageProps } from "./UserMessage";
export {
  AssistantMessage,
  type AssistantMessageProps,
  type ToolCallInfo,
} from "./AssistantMessage";

export { ChatInput } from "./ChatInput";
export type { ChatInputProps, ChatInputHandle, Attachment } from "./ChatInput";

export { StreamingIndicator } from "./StreamingIndicator";
export type { StreamingIndicatorProps } from "./StreamingIndicator";

export { ThinkingBlock } from "./ThinkingBlock";
export type { ThinkingBlockProps } from "./ThinkingBlock";

export { ToolCallBlock } from "./ToolCallBlock";
export type { ToolCallBlockProps, ToolCallStatus } from "./ToolCallBlock";

export { PermissionDialog } from "./PermissionDialog";
export type {
  PermissionDialogProps,
  PermissionTier,
  PermissionDecision,
} from "./PermissionDialog";

export { MarkdownRenderer } from "./MarkdownRenderer";
export type { MarkdownRendererProps } from "./MarkdownRenderer";

export { SideChat } from "./SideChat";
export type { SideChatProps } from "./SideChat";

export { BuddyEventCard } from "./BuddyEventCard";
export type { BuddyEventCardProps, BuddyEventType } from "./BuddyEventCard";

export { RoutingBanner } from "./RoutingBanner";
export type { RoutingBannerProps } from "./RoutingBanner";

export { PetCameo } from "./PetCameo";
export type { PetCameoProps, PetCameoOccasion } from "./PetCameo";
