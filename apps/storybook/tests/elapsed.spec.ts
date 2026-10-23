import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * §11.5's elapsed figure: "Working…" for three seconds, then "Working · 0:03",
 * ticking. Time is Playwright's fake clock, so the figure is exact rather
 * than whatever second the run happened to reach. The visual tests never see
 * the figure: they screenshot well inside the first three seconds.
 *
 * The clock is paused straight after load, at the page's own "now", so the
 * only real time counted is mount to pause, well under a second, plus
 * 200ms of margin.
 */

async function freeze(page: import('@playwright/test').Page) {
  // A little ahead of the page's "now": the clock keeps running between the
  // read and the pause, and pauseAt refuses a time in the past.
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 200);
}

test('the waiting turn gains its elapsed figure after 3 seconds', async ({ page }) => {
  await page.clock.install();
  await gotoStory(page, 'product-chatthread--awaiting-response');
  await freeze(page);

  const visible = page.locator('[aria-hidden="true"]', { hasText: /^Working/ });
  await expect(visible).toHaveText('Working…');

  await page.clock.runFor(3_000);
  await expect(visible).toHaveText('Working · 0:03');

  await page.clock.runFor(62_000);
  await expect(visible).toHaveText('Working · 1:05');
});

test('assistive technology reads the bare label, which never ticks', async ({ page }) => {
  await page.clock.install();
  await gotoStory(page, 'product-chatthread--awaiting-response');
  await freeze(page);
  await page.clock.runFor(10_000);

  // The log is a live region: a ticking text node in it would be read out
  // every second. Only the hidden copy is in the accessibility tree.
  const log = page.getByRole('log');
  await expect(log.getByText('Working', { exact: true })).toHaveClass(/sr-only/);
  await expect(log.locator('[aria-hidden="true"]', { hasText: '0:10' })).toHaveCount(1);
});

test('the figure keeps counting under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await gotoStory(page, 'product-chatthread--awaiting-response');
  await freeze(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

  // The spinner stands still; the figure is then the only sign of progress.
  await page.clock.runFor(7_000);
  await expect(page.locator('[aria-hidden="true"]', { hasText: /^Working/ })).toHaveText('Working · 0:07');
});

test('the drafting step gains its elapsed figure', async ({ page }) => {
  await page.clock.install();
  await gotoStory(page, 'product-agentplan--streaming');
  await freeze(page);
  await page.clock.runFor(4_000);
  await expect(page.locator('[aria-hidden="true"]', { hasText: /^Drafting step/ })).toHaveText(/ · 0:04$/);
});
