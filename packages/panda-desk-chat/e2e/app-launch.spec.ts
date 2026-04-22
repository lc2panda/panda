// Input: Electron app fixture (electronApp + page)
// Output: Verifies app launch — window opens, correct title, reasonable dimensions, AppShell renders
// Pos: E2E smoke tests — first thing to run, ensures the Electron shell boots

import { test, expect } from './fixtures';

test.describe('App Launch', () => {
  test('window opens successfully', async ({ electronApp }) => {
    const windows = electronApp.windows();
    expect(windows.length).toBeGreaterThanOrEqual(1);
  });

  test('window has correct title', async ({ page }) => {
    const title = await page.title();
    // Main window title set in electron/main.ts — "Panda Code"
    expect(title).toContain('Panda');
  });

  test('window dimensions are reasonable', async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    if (viewport) {
      expect(viewport.width).toBeGreaterThan(800);
      expect(viewport.height).toBeGreaterThan(600);
    }
  });

  test('AppShell layout renders with sidebar and main area', async ({ page }) => {
    // Sidebar is an <aside> element
    const sidebar = page.locator('aside');
    await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

    // Main content area — the flex-1 div that hosts ChatPage or SettingsPage
    const mainContent = page.locator('div.flex-1.flex-col');
    await expect(mainContent.first()).toBeVisible();
  });
});
