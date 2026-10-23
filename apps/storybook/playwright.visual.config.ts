import { defineConfig } from '@playwright/test';

import base from './playwright.config';
import { storybookPort } from './tests/storybook-port.mjs';

/**
 * Visual regression (`tests/visual.spec.ts`), against a static Storybook
 * build rather than the dev server.
 *
 * The first CI run used the dev server and timed out: GitHub's private-repo
 * runners have two cores, so Playwright runs one worker, and each story's
 * page load fetched hundreds of unbundled modules, about 5s a screenshot,
 * ~40 minutes for the set. A build serves a few bundled chunks the browser
 * caches across stories, and it is what a consumer of the system actually
 * loads.
 *
 * Its own port, one above the dev server's range, so a dev Storybook and a
 * screenshot run never collide. Never reused: a server left running from an
 * earlier build would serve stale stories, and every screenshot would be of
 * the wrong code.
 */
const port = String(Number(storybookPort()) + 1000);
const url = `http://localhost:${port}`;

export default defineConfig({
  ...base,
  testIgnore: undefined,
  testMatch: 'visual.spec.ts',
  // The report a reviewer opens when a screenshot changes: expected, actual,
  // and a diff slider. CI uploads it as `visual-diff-report`.
  // The JSON report is what scripts/visual-gate.mjs reads to tell declared
  // changes from undeclared ones. Outside visual-report/, which the HTML
  // reporter empties at the start of every run.
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'visual-report' }],
    ['json', { outputFile: 'visual-results/results.json' }],
  ],
  use: { ...base.use, baseURL: url },
  webServer: {
    command: `pnpm build --quiet && pnpm exec vite preview --outDir storybook-static --port ${port} --strictPort`,
    url,
    timeout: 300_000,
    reuseExistingServer: false,
  },
});
