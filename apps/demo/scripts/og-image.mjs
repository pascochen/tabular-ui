/**
 * Writes public/og.png, the demo's one social image: #revenue as a visitor
 * lands on it, with the sidebar pinned and the question in view. It's a
 * screenshot of the build, so nothing in it is typed here.
 *
 * 1000px wide at 1.2× makes the 1200×630 that index.html declares: under 1024px
 * the channel has the panel's width, and the text still reads at a feed's size.
 *
 * It serves this checkout's dist, not whatever holds a dev server's port, so
 * build first. Nothing fails when the image goes stale: run it whenever the
 * landing screen, the sidebar or the data changes.
 *
 *   pnpm build:ui && pnpm build:demo
 *   node apps/demo/scripts/og-image.mjs
 */
import { createRequire } from 'node:module';

import { preview } from 'vite';

// Playwright is the storybook app's, where the demo's tests run, so the demo
// takes on no dependency for one image.
const require = createRequire(new URL('../../storybook/package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const root = new URL('../', import.meta.url);
const out = new URL('public/og.png', root);

const server = await preview({ root: root.pathname, configFile: false, logLevel: 'silent' });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1000, height: 525 },
  deviceScaleFactor: 1.2,
  // The timeline lands at once and the sidebar opens without a transition.
  reducedMotion: 'reduce',
});

await page.goto(server.resolvedUrls.local[0]);
await page.getByRole('button', { name: 'Toggle sidebar' }).click();
await page.getByRole('link', { name: /intercompany/ }).waitFor();
await page.waitForFunction(() => document.fonts.status === 'loaded');

// After the sidebar opens and the fonts load, because both rewrap the thread.
// The thread runs on under the composer's bar, so the question's foot goes to
// the bar's top, not to the scroller's end.
await page.evaluate(() => {
  const scroller = document.querySelector('[data-slot="app-shell-main-body"]');
  const block = document.querySelector('[data-slot="question"]').closest('[data-slot="agent-block"]');
  const bar = document.querySelector('[data-slot="chat-composer"]').parentElement;
  scroller.scrollTop += block.getBoundingClientRect().bottom - bar.getBoundingClientRect().top;

  // The sidebar is cut off at this height. Its foot goes to the first agent's,
  // so the Agents heading has a row under it.
  const sidebar = document.querySelector('[data-slot="app-shell-sidebar-body"]');
  const agent = [...sidebar.querySelectorAll('a')].find((a) => a.textContent.includes('Cut-off AI'));
  sidebar.scrollTop += agent.getBoundingClientRect().bottom - sidebar.getBoundingClientRect().bottom;
});

await page.mouse.move(0, 0);
await page.screenshot({ path: out.pathname });

await browser.close();
await server.close();
console.log(`Wrote ${out.pathname}`);
