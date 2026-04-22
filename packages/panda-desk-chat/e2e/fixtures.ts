// Input: Playwright Electron API, test runner base
// Output: Custom test fixtures — electronApp (launches Electron) + page (first BrowserWindow)
// Pos: E2E fixture layer — every spec imports { test, expect } from here

import { test as base, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import path from 'node:path';

type TestFixtures = {
  electronApp: ElectronApplication;
  page: Page;
};

export const test = base.extend<TestFixtures>({
  electronApp: async ({}, use) => {
    const app = await electron.launch({
      args: [path.join(__dirname, '..', 'dist-electron', 'main.js')],
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PANDA_E2E_TEST: '1',
      },
    });
    await use(app);
    await app.close();
  },

  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await use(page);
  },
});

export { expect } from '@playwright/test';
