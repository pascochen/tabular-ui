import { expect, test, type Page } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * `prefers-reduced-motion` is only observable in a real browser: the variant
 * compiles to a media query, so nothing static can tell whether an animation
 * is actually gated. jsdom reports no preference and would pass either way.
 *
 * The rule under test is not "no animation" — it is that **movement** stops
 * while the information stays. A determinate `ProgressBar` still reports its
 * value through width, label and figure; what goes away is the fill sliding
 * there.
 *
 * **Use `page.emulateMedia`, not `test.use({ reducedMotion })`.** The fixture
 * form does not reach the page from inside a nested `describe` — the document
 * still matches `(prefers-reduced-motion: no-preference)`, so every assertion
 * here passes against un-gated animation and the suite proves nothing. Caught
 * by probing `matchMedia` directly; the first draft of this spec "failed" on
 * three animations that were correctly gated all along.
 */

/** The fill inside the track — the element that carries the transition. */
const FILL = '[role="progressbar"] > div';

async function reduceMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Guards the trap in the docstring above: if emulation ever stops reaching
  // the page, this fails loudly instead of the assertions passing vacuously.
  const applied = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(applied, 'reduced-motion emulation did not reach the page').toBe(true);
}

test('the determinate fill transitions its width by default', async ({ page }) => {
  await gotoStory(page, 'product-progressbar--default');
  const property = await page
    .locator(FILL)
    .first()
    .evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(property).toContain('width');
});

test('the determinate fill does not transition under reduced motion', async ({ page }) => {
  await gotoStory(page, 'product-progressbar--default');
  await reduceMotion(page);

  const { property, width } = await page
    .locator(FILL)
    .first()
    .evaluate((el) => ({
      property: getComputedStyle(el).transitionProperty,
      width: getComputedStyle(el).width,
    }));

  expect(property).not.toContain('width');
  // The value still has to be readable — this is a movement rule, not a
  // licence to stop reporting progress.
  expect(parseFloat(width)).toBeGreaterThan(0);
});

test('the indeterminate fill stops animating under reduced motion', async ({ page }) => {
  await gotoStory(page, 'product-progressbar--indeterminate');
  await reduceMotion(page);

  const name = await page
    .locator(FILL)
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe('none');
});

/** The tracer's path, the element that carries the animation (§11.5). */
const SPINNER = '[data-status="running"] [data-slot="spinner"] rect';

test('the status spinner animates by default', async ({ page }) => {
  await gotoStory(page, 'product-statusbadge--all-states');

  // Without this, the reduced-motion test below would pass against a
  // spinner that never moved at all.
  const name = await page
    .locator(SPINNER)
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe('tui-spinner');
});

test('the status spinner stops on its still frame under reduced motion', async ({ page }) => {
  await gotoStory(page, 'product-statusbadge--all-states');
  await reduceMotion(page);

  const rect = page.locator(SPINNER).first();
  expect(await rect.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  // The still frame: the segment centred on the top-right corner, not an
  // arbitrary point in the lap.
  expect(await rect.evaluate((el) => getComputedStyle(el).strokeDashoffset)).toBe('12.5px');
});

/** The Switch thumb slides between its two positions. Found 2026-10-21. */
const THUMB = '[data-slot="switch-thumb"]';

test('the switch thumb slides by default', async ({ page }) => {
  await gotoStory(page, 'foundational-switch--states');
  const property = await page
    .locator(THUMB)
    .first()
    .evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(property).toContain('transform');
});

test('the switch thumb jumps under reduced motion', async ({ page }) => {
  await gotoStory(page, 'foundational-switch--states');
  await reduceMotion(page);
  const property = await page
    .locator(THUMB)
    .first()
    .evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(property).not.toContain('transform');
  expect(property).not.toContain('translate');
});
