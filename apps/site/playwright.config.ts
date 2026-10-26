import { defineConfig, devices } from '@playwright/test';

import { sitePort } from './tests/site-port.mjs';

const port = sitePort();
const siteUrl = `http://localhost:${port}`;

/**
 * The site's checks run against its prerendered build (build/client), the
 * same files Vercel serves, not the dev server. Build first: `pnpm build:site`.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // CI uploads the HTML report on failure, so it is generated there too.
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: siteUrl,
    trace: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    // Served as Vercel serves it (tests/serve.mjs), not by vite preview's SPA fallback.
    command: `node tests/serve.mjs build/client ${port}`,
    url: siteUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
