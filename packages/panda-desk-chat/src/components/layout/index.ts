// Input: Layout component modules
// Output: Unified re-exports for layout layer
// Pos: Layout barrel — single import point for all layout components

export { AppShell } from './AppShell';
export type { AppShellProps } from './AppShell';

export { PdNavItem } from './PdNavItem';

export { PdSidebar } from './PdSidebar';
export type { PdSidebarProps, PdSidebarItemProps } from './PdSidebar';

export { PdTabBar } from './PdTabBar';
export type { PdTabBarProps, PdTabBarTab } from './PdTabBar';

export { PdTabBarConnected } from './PdTabBarConnected';

export { TabContextMenu as PdTabContextMenu } from './PdTabContextMenu';
export type { TabContextMenuProps as PdTabContextMenuProps } from './PdTabContextMenu';

export { PdStatusBar } from './PdStatusBar';
export type { PdStatusBarProps, ConnectionState } from './PdStatusBar';

export { StatusBarChips } from './StatusBarChips';
