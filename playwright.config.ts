import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test_ai1',

  timeout: 30 * 1000,

  use: {
    baseURL: 'https://robotesta.ai.com',

    // Add this if using saved login session
    storageState: 'storageState.json',

    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
