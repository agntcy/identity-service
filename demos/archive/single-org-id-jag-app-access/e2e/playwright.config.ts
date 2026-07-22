import { defineConfig, devices } from '@playwright/test';

// The demo web app. Override for non-default ports, e.g.
//   WEBAPP_URL=http://localhost:8000 npm test
const baseURL = process.env.WEBAPP_URL || 'http://localhost:18000';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
