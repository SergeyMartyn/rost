import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/browser',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:8787',
    headless: true,
    launchOptions: { channel: 'msedge' },
  },
  webServer: {
    command: 'npm run preview -- --port 8787',
    url: 'http://127.0.0.1:8787/de/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
