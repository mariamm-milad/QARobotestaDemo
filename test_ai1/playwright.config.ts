import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',

  timeout: 30 * 1000,

  use: {
    baseURL: 'https://robotesta.ai.com',
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
