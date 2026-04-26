// Input: Layout component modules
// Output: Unified re-exports for layout layer
// Pos: Layout barrel — single import point for all layout components
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

export { AppShell } from './AppShell';

export { PdNavItem } from './PdNavItem';
export type { PdNavItemProps } from './PdNavItem';

export { PdSidebar } from './PdSidebar';
export type { PdSidebarProps } from './PdSidebar';

export { PdTabBar } from './PdTabBar';

export { PdContentRouter } from './PdContentRouter';

export { PdProjectFilter } from './PdProjectFilter';

export { PdWindowControls, showWindowControls } from './PdWindowControls';

export { TabContextMenu as PdTabContextMenu } from './PdTabContextMenu';
export type { TabContextMenuProps as PdTabContextMenuProps } from './PdTabContextMenu';

export { PdStatusBar } from './PdStatusBar';
export type { PdStatusBarProps, ConnectionState } from './PdStatusBar';

export { StatusBarChips } from './StatusBarChips';
