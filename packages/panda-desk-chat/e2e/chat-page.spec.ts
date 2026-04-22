// Input: Electron app fixture (page with ChatPage rendered)
// Output: Verifies chat page — HeroComposer renders, textarea exists, PetCameo visible, typing works
// Pos: E2E chat page tests — validates empty-state UI before any session is created

import { test, expect } from './fixtures';

test.describe('Chat Page', () => {
  test('empty state shows HeroComposer when no active session', async ({ page }) => {
    // HeroComposer renders a textarea with placeholder text
    const heroTextarea = page.locator('textarea');
    await expect(heroTextarea.first()).toBeVisible({ timeout: 10_000 });
  });

  test('HeroComposer has text input', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea.first()).toBeVisible({ timeout: 10_000 });
    // Verify it is enabled and editable
    await expect(textarea.first()).toBeEnabled();
  });

  test('PdPetCameo is visible in empty state', async ({ page }) => {
    // PdPetCameo renders a panda emoji character (species: one of panda/red-panda/bamboo)
    // The container div has flex + flex-col layout with text-center message
    // Look for the panda-related emoji spans (text-4xl or text-5xl size)
    const petCameo = page.locator('text=/🐼|🎋|🐾/');
    await expect(petCameo.first()).toBeVisible({ timeout: 10_000 });
  });

  test('can type in composer', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill('Hello Panda!');
    await expect(textarea).toHaveValue('Hello Panda!');
  });
});
