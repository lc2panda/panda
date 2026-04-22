// Input: Electron app fixture (page), keyboard shortcut Cmd+, to open settings
// Output: Verifies settings page — tab navigation, switching tabs, theme selector, notification toggle
// Pos: E2E settings page tests — validates SettingsPage tabs and key controls

import { test, expect } from './fixtures';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings via keyboard shortcut (Cmd+,)
    await page.waitForLoadState('domcontentloaded');
    await page.keyboard.press('Meta+,');
    // Wait for Settings title to appear
    await expect(
      page.locator('text=/Settings|设置|設定|설정/'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('can navigate to settings', async ({ page }) => {
    // The settings title heading should be visible
    const heading = page.locator('h2');
    await expect(heading.first()).toBeVisible();
    const text = await heading.first().textContent();
    expect(text).toMatch(/Settings|设置|設定|설정/);
  });

  test('settings page has tab navigation', async ({ page }) => {
    // SettingsPage renders tab buttons in a flex row
    const tabButtons = page.locator('button[role="tab"], div[style*="border-bottom"] > button');
    // Should have at least 5 tabs (General, Appearance, Providers, Shortcuts, About)
    const count = await tabButtons.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('General tab is visible by default', async ({ page }) => {
    // GeneralTab contains "Language" / "语言" setting row
    const langSetting = page.locator('text=/Language|语言|言語|언어/');
    await expect(langSetting.first()).toBeVisible({ timeout: 5_000 });
  });

  test('can switch between tabs', async ({ page }) => {
    // Find all tab buttons — SettingsPage renders them with borderBottom styling
    const allButtons = page.locator('button');
    const tabCount = await allButtons.count();

    // Click Appearance tab — look for button text containing appearance-related text
    // Tab labels may be i18n keys (settings.tabAppearance) or translated text
    let appearanceTab = page.locator('button:has-text("Appearance"), button:has-text("外观"), button:has-text("tabAppearance")');
    if ((await appearanceTab.count()) === 0) {
      // Fallback: click the second tab button in the settings tab row
      const tabRow = page.locator('div[style*="border-bottom"]').first();
      const tabs = tabRow.locator('button');
      if ((await tabs.count()) >= 2) {
        appearanceTab = tabs.nth(1);
      }
    }
    await appearanceTab.first().click();

    // After switching, theme-related content should be visible
    const themeLabel = page.locator('text=/Theme|主题|テーマ/');
    await expect(themeLabel.first()).toBeVisible({ timeout: 5_000 });

    // Click Providers tab
    let providersTab = page.locator('button:has-text("Providers"), button:has-text("tabProviders")');
    if ((await providersTab.count()) === 0) {
      const tabRow = page.locator('div[style*="border-bottom"]').first();
      const tabs = tabRow.locator('button');
      if ((await tabs.count()) >= 3) {
        providersTab = tabs.nth(2);
      }
    }
    await providersTab.first().click();

    // Click Shortcuts tab
    let shortcutsTab = page.locator('button:has-text("Shortcuts"), button:has-text("tabShortcuts")');
    if ((await shortcutsTab.count()) === 0) {
      const tabRow = page.locator('div[style*="border-bottom"]').first();
      const tabs = tabRow.locator('button');
      if ((await tabs.count()) >= 4) {
        shortcutsTab = tabs.nth(3);
      }
    }
    await shortcutsTab.first().click();

    // Click About tab
    let aboutTab = page.locator('button:has-text("About"), button:has-text("tabAbout")');
    if ((await aboutTab.count()) === 0) {
      const tabRow = page.locator('div[style*="border-bottom"]').first();
      const tabs = tabRow.locator('button');
      if ((await tabs.count()) >= 5) {
        aboutTab = tabs.nth(4);
      }
    }
    await aboutTab.first().click();
  });

  test('theme selector exists in Appearance tab', async ({ page }) => {
    // Switch to Appearance tab
    const appearanceTab = page.locator('button:has-text("Appearance"), button:has-text("外观"), button:has-text("tabAppearance")');
    if ((await appearanceTab.count()) > 0) {
      await appearanceTab.first().click();
    } else {
      const tabRow = page.locator('div[style*="border-bottom"]').first();
      await tabRow.locator('button').nth(1).click();
    }

    // AppearanceTab renders PdSegmentedControl for theme with Light/Dark/System/Matrix options
    const themeLabel = page.locator('text=/Theme|主题/');
    await expect(themeLabel.first()).toBeVisible({ timeout: 5_000 });

    // At least one theme option button should be visible
    const themeOption = page.locator('text=/Light|Dark|System|Matrix|浅色|深色|跟随系统/');
    await expect(themeOption.first()).toBeVisible();
  });

  test('notification toggle exists in General tab', async ({ page }) => {
    // General tab is default — look for notification setting
    const notifLabel = page.locator('text=/Notification|通知|通知/');
    await expect(notifLabel.first()).toBeVisible({ timeout: 5_000 });

    // PdSwitch renders a <button> with role="switch"
    const toggleSwitch = page.locator('button[role="switch"]');
    await expect(toggleSwitch.first()).toBeVisible();
  });
});
