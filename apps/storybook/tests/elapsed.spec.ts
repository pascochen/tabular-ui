import { expect, test } from '@playwright/test';

import { gotoStoryBeforeFonts } from './helpers';

/**
 * §11.5's elapsed figure: "Working…" for three seconds, then "Working · 0:03",
 * ticking. Time is Playwright's fake clock, so the figure is exact rather
 * than whatever second the run happened to reach. The visual tests never see
 * the figure: they screenshot well inside the first three seconds.
 *
 * The clock stops before the page loads, so the story mounts with time standing
 * still and its figure counts only what `runFor` adds. However long the load or
 * a round trip takes, none of it reaches the figure, and an exact boundary holds:
 * 3,000ms reads 0:03. These tests read text, not boxes, so they don't wait for
 * the fonts.
 */

/**
 * A minute ahead because the clock runs from `install` until the pause lands, and
 * `pauseAt` refuses a time in the past. A test's 30s timeout ends before that.
 */
async function gotoWithClockStopped(page: import('@playwright/test').Page, id: string) {
  const now = Date.now();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now + 60_000);
  await gotoStoryBeforeFonts(page, id);
}

test('the waiting turn gains its elapsed figure after 3 seconds', async ({ page }) => {
  await gotoWithClockStopped(page, 'product-chatthread--awaiting-response');

  const visible = page.locator('[aria-hidden="true"]', { hasText: /^Working/ });
  await expect(visible).toHaveText('Working…');

  await page.clock.runFor(3_000);
  await expect(visible).toHaveText('Working · 0:03');

  await page.clock.runFor(62_000);
  await expect(visible).toHaveText('Working · 1:05');
});

test('assistive technology reads the bare label, which never ticks', async ({ page }) => {
  await gotoWithClockStopped(page, 'product-chatthread--awaiting-response');
  await page.clock.runFor(10_000);

  // The log is a live region: a ticking text node in it would be read out
  // every second. Only the hidden copy is in the accessibility tree.
  const log = page.getByRole('log');
  await expect(log.getByText('Working', { exact: true })).toHaveClass(/sr-only/);
  await expect(log.locator('[aria-hidden="true"]', { hasText: '0:10' })).toHaveCount(1);
});

test('the figure keeps counting under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoWithClockStopped(page, 'product-chatthread--awaiting-response');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

  // The spinner stands still; the figure is then the only sign of progress.
  await page.clock.runFor(7_000);
  await expect(page.locator('[aria-hidden="true"]', { hasText: /^Working/ })).toHaveText('Working · 0:07');
});

test('the drafting step gains its elapsed figure', async ({ page }) => {
  await gotoWithClockStopped(page, 'product-agentplan--streaming');
  await page.clock.runFor(4_000);
  await expect(page.locator('[aria-hidden="true"]', { hasText: /^Drafting step/ })).toHaveText(/ · 0:04$/);
});
