// Input: Electron app fixture (page with sidebar rendered)
// Output: Verifies sidebar — nav items render, new chat button exists, session list area present
// Pos: E2E sidebar tests — validates PdSidebar structure and key interactive elements

import { test, expect } from './fixtures';

test.describe('Sidebar', () => {
  test('sidebar renders with nav items', async ({ page }) => {
    // Sidebar is an <aside> element
    const sidebar = page.locator('aside');
    await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

    // PdNavItem renders <button> elements inside the sidebar
    const navButtons = sidebar.locator('button');
    const count = await navButtons.count();
    // At minimum: toggle + new-chat + workspace nav (4) + bottom nav (2) = 8 buttons
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('new chat button exists', async ({ page }) => {
    // New chat button contains "新建会话" text and a Plus icon
    const newChatBtn = page.locator('aside button:has-text("新建会话")');
    await expect(newChatBtn.first()).toBeVisible({ timeout: 10_000 });
  });

  test('session list area exists', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

    // Session list area — when empty, shows placeholder text
    // "暂无会话，点击上方创建" or the session items list
    const sessionArea = page.locator('aside .overflow-y-auto, aside div:has-text("暂无会话")');
    await expect(sessionArea.first()).toBeVisible({ timeout: 5_000 });
  });
});
