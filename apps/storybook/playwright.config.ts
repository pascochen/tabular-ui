import { defineConfig, devices } from '@playwright/test';
import { storybookPort } from './tests/storybook-port.mjs';

/**
 * Every worktree under `.claude/worktrees/` runs its own Storybook, and only
 * one of them can hold a given port. Locally `reuseExistingServer` is on, so
 * a run that finds the port taken tests whatever checkout is serving it, with
 * no error. The port is therefore derived from this checkout's path unless
 * `STORYBOOK_PORT` overrides it. See `tools.md`.
 */
const port = storybookPort();
const storybookUrl = `http://localhost:${port}`;

/**
 * Playwright covers the two checks `tools.md` reserves for a real browser:
 * focus-ring clipping inside `overflow: hidden` scroll containers, and the
 * computed contrast of rendered tokens. Neither is visible to jsdom, and
 * neither is statically analysable — the first depends on layout, the second
 * on the browser resolving OKLCH to sRGB.
 *
 * Stories are the fixtures. Building a second set of test pages would let the
 * tests drift from what the app actually renders.
 */
export default defineConfig({
  testDir: './tests',
  // Screenshots run under playwright.visual.config.ts, against a static build.
  testIgnore: '**/visual.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // CI uploads the HTML report on failure, so it is generated there too.
  reporter: [['list'], ['html', { open: 'never' }]],
  // CI never writes a screenshot. With the default ('missing') a story with
  // no baseline writes one on its first attempt and passes on the retry, so
  // new stories would ship unreviewed. Baselines change only through the
  // "Update visual baselines" workflow, which passes --update-snapshots.
  updateSnapshots: process.env.CI ? 'none' : 'missing',

  use: {
    baseURL: storybookUrl,
    trace: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    // Not `pnpm storybook`: that script pins `-p 6006`, and a second `-p`
    // appended after it is not guaranteed to win.
    command: `pnpm exec storybook dev -p ${port} --ci`,
    url: storybookUrl,
    // Storybook's first cold boot compiles the whole story graph.
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
