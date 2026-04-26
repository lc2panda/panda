// Input: lucide-react 图标类型覆盖
// Output: React 19 兼容的 LucideIcon 类型（ComponentType<LucideProps>）
// Pos: types/ — 修复 @types/react 19.x 与 lucide-react ForwardRefExoticComponent 类型不兼容
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的md。

declare module 'lucide-react' {
  import type { ComponentType, SVGAttributes } from 'react';

  interface LucideProps extends SVGAttributes<SVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }

  type LucideIcon = ComponentType<LucideProps>;

  // --- 项目中实际使用的图标 (28 个) ---

  // PdCheckbox.tsx
  export const Check: LucideIcon;
  export const Minus: LucideIcon;

  // PdSelect.tsx, StatusBarChips.tsx
  export const ChevronDown: LucideIcon;

  // PdHeroComposer.tsx
  export const ArrowUp: LucideIcon;

  // PdDrawer.tsx, PdSearchInput.tsx, PdTabBar.tsx
  export const X: LucideIcon;

  // PdSearchInput.tsx, PdSidebar.tsx
  export const Search: LucideIcon;

  // (reserved)
  export const Command: LucideIcon;

  // PdDirectoryPicker.tsx, PdSidebar.tsx
  export const FolderOpen: LucideIcon;

  // PdSidebar.tsx
  export const MessageSquare: LucideIcon;

  // PdSidebar.tsx
  export const Brain: LucideIcon;
  export const GitBranch: LucideIcon;
  export const Settings: LucideIcon;
  export const User: LucideIcon;
  export const PanelLeftClose: LucideIcon;
  export const PanelLeftOpen: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const ArrowUpRight: LucideIcon;

  // PdTabBar.tsx
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;

  // StatusBarChips.tsx
  export const Shield: LucideIcon;
  export const Cpu: LucideIcon;
  export const Gauge: LucideIcon;

  // PdStatusBar.tsx
  export const BellOff: LucideIcon;
  export const Bell: LucideIcon;
  export const Circle: LucideIcon;
}
