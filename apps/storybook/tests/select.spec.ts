import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * What a Select's trigger shows (found 2026-11-09, both by reading the trigger
 * instead of the story's source).
 */

test('a value too long for its trigger ends in an ellipsis', async ({ page }) => {
  await gotoStory(page, 'foundational-select--truncation');
  const value = page.locator('[data-slot="select-value"]');
  // The story must show the long name, or nothing below is measured: it once
  // rendered its four-letter value, "long", and cut nothing.
  await expect(value).toHaveText('fct_gl_entries_reconciliation_daily_partitioned_v2');
  const cut = await value.evaluate((el) => {
    const s = getComputedStyle(el);
    return { overflows: el.scrollWidth > el.clientWidth, display: s.display, textOverflow: s.textOverflow };
  });
  // `text-overflow` applies to block containers only. On `display: flex` the
  // computed value still reads `ellipsis` and none is drawn, so assert the box.
  expect(cut).toEqual({ overflows: true, display: 'block', textOverflow: 'ellipsis' });
});

test("Question's select shows the picked option's label, not its id", async ({ page }) => {
  await gotoStory(page, 'product-question--many-options');
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'May' }).click();
  await expect(page.locator('[data-slot="select-value"]')).toHaveText('May');
});
