// Input: Playwright configuration options
// Output: defineConfig for Electron E2E testing
// Pos: E2E test root — configures timeouts, retries, trace/screenshot policies

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  retries: 1,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
