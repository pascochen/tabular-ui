import { expect, test, type Page } from '@playwright/test';

import { gotoStory, token } from './helpers';

/**
 * The Combobox list's scroll cue. Base UI ships scroll arrows for Select only,
 * so the list masks whichever edge still hides rows. Without it, Grouped's
 * 288px cut fell exactly on a row boundary and the list looked complete with
 * two models out of view.
 *
 * Grouped is the fixture: nine models plus three labels and two separators
 * overflow the 18rem cap. Filtering it is how the list shrinks to fit.
 */

const STORY = 'foundational-combobox--grouped';

const input = (page: Page) => page.locator('[data-slot="combobox-input"]');
const list = (page: Page) => page.locator('[data-slot="combobox-list"]');

/** Which edges the computed mask actually fades, and over what depth. */
const fades = (page: Page) =>
  list(page).evaluate((el) => {
    const mask = getComputedStyle(el).maskImage;
    // Tailwind composes one gradient per side; the unused sides are solid.
    const edges = mask.match(/linear-gradient\((?:to top, )?rgb\(0, 0, 0\) calc\(100% - [\d.]+px\)/g) ?? [];
    return {
      top: edges.some((g) => g.includes('to top')),
      bottom: edges.some((g) => !g.includes('to top')),
      depths: edges.map((g) => g.match(/calc\(100% - ([\d.]+)px\)/)![1]),
    };
  });

async function open(page: Page) {
  await gotoStory(page, STORY);
  await input(page).click();
  await page.keyboard.press('ArrowDown');
  await expect(list(page)).toBeVisible();
}

test('an overflowing list fades its bottom edge, then only its top once scrolled to the end', async ({ page }) => {
  await open(page);
  const depth = parseFloat(await token(page, '--h-row-xs'));
  const overflow = await list(page).evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(overflow).toBeGreaterThan(0);

  await expect(list(page)).toHaveAttribute('data-overflow-y-end');
  await expect(list(page)).not.toHaveAttribute('data-overflow-y-start');
  expect(await fades(page)).toEqual({ top: false, bottom: true, depths: [String(depth)] });

  // Keyboard to the last row, the way a user reaches the end. Opening
  // highlighted the first of the nine.
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowDown');
  await expect(list(page).getByRole('option', { name: 'int_fx_rates_daily' })).toHaveAttribute('data-highlighted');

  await expect(list(page)).not.toHaveAttribute('data-overflow-y-end');
  await expect(list(page)).toHaveAttribute('data-overflow-y-start');
  expect(await fades(page)).toEqual({ top: true, bottom: false, depths: [String(depth)] });
});

test('the keyboard-highlighted row is never parked under the fade', async ({ page }) => {
  await open(page);
  const depth = parseFloat(await token(page, '--h-row-xs'));
  // Step through every row; wherever an edge is faded, the row must stop clear of it.
  let checked = 0;
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('ArrowDown');
    const gap = await list(page).evaluate(async (el) => {
      // The scroll lands on keydown, but its `scroll` event (which moves the
      // attributes) is dispatched in the next frame's rendering steps, before
      // paint. Reading in between sees a scrolled list with stale attributes,
      // a state no user ever sees painted.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const row = el.querySelector('[data-highlighted]')!.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      return {
        top: row.top - box.top,
        bottom: box.bottom - row.bottom,
        fadedBelow: el.hasAttribute('data-overflow-y-end'),
        fadedAbove: el.hasAttribute('data-overflow-y-start'),
      };
    });
    if (gap.fadedBelow) expect(gap.bottom).toBeGreaterThanOrEqual(depth - 0.5);
    if (gap.fadedAbove) expect(gap.top).toBeGreaterThanOrEqual(depth - 0.5);
    if (gap.fadedBelow || gap.fadedAbove) checked++;
  }
  // Not vacuous: with no fade there is nothing to have checked.
  expect(checked).toBeGreaterThan(0);
});

test('a list filtered down to fit shows no cue, and regains it when the filter clears', async ({ page }) => {
  await open(page);
  await input(page).fill('dim');
  await expect(list(page).getByRole('option')).toHaveCount(3);
  await expect(list(page)).not.toHaveAttribute('data-overflow-y-end');
  await expect(list(page)).not.toHaveAttribute('data-overflow-y-start');
  expect(await list(page).evaluate((el) => getComputedStyle(el).maskImage)).toBe('none');

  await input(page).fill('');
  await expect(list(page).getByRole('option')).toHaveCount(9);
  await expect(list(page)).toHaveAttribute('data-overflow-y-end');
});
