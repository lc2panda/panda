// Input: text / label / copiedLabel / displayLabel / displayCopiedLabel / className
// Output: copy-to-clipboard button with 1.5s "copied" flash
// Pos: Shared layer — re-exports the canonical chat/PdCopyButton implementation
//      (panda 已有 src/components/chat/PdCopyButton.tsx，此处 alias 避免双份冗余)
//
// Source 1:1: cc-haha desktop/src/components/shared/CopyButton.tsx (L1-L58)
// Decision: panda 现有 chat/PdCopyButton 已实现等价能力（clipboard API + 1.5s 翻转
//   + svg 图标 + showText prop），故 shared 入口仅重导出，避免维护双份代码。

export { PdCopyButton } from '../chat/PdCopyButton';
export type { PdCopyButtonProps } from '../chat/PdCopyButton';
