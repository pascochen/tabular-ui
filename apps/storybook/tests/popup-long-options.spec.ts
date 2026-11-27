import { expect, test, type Locator } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * An option is read in the open list, on touch too, where no tooltip opens.
 * Until 2026-11-27 Select's list was only as wide as its trigger, and both
 * Select's and Combobox's options truncated: at 375px a long model name was
 * cut in the very list that is there to show it (214 of its 360px), and the
 * value the trigger cut could be read nowhere. Now Select's list widens past
 * its trigger to the screen's edge, Combobox's keeps its field's width, and in
 * both an option still too long wraps, its row growing from `--h-row-sm`.
 */
test.use({ viewport: { width: 375, height: 812 } });

const LONG = 'int_supplier_invoices__deduplicated_fy2026_h1_by_supplier_and_document';

async function expectWhole(options: Locator, popup: Locator) {
  const count = await options.count();
  expect(count, 'the story must show options, or this checks nothing').toBeGreaterThan(1);
  const box = (await popup.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
  for (let i = 0; i < count; i++) {
    const option = options.nth(i);
    // Not cut: no text runs past its box, and the box sits inside the popup.
    expect(
      await option.evaluate((el) => el.scrollWidth <= el.clientWidth),
      (await option.textContent()) ?? undefined,
    ).toBe(true);
    const b = (await option.boundingBox())!;
    expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width);
  }
}

test('Select: the open list shows every option whole, wider than its trigger', async ({ page }) => {
  await gotoStory(page, 'foundational-select--long-names');
  const trigger = page.locator('[data-slot="select-trigger"]');
  // The trigger cuts the value…
  expect(await trigger.locator('[data-slot="select-value"]').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  await trigger.click();
  const popup = page.locator('[data-slot="select-content"]');
  await expect(popup).toBeVisible();
  // …and the list is where it is read.
  await expectWhole(popup.locator('[data-slot="select-item"] > :first-child'), popup);

  const list = (await popup.boundingBox())!;
  const anchor = (await trigger.boundingBox())!;
  expect(list.width).toBeGreaterThan(anchor.width);

  const height = (text: string) =>
    popup.locator('[data-slot="select-item"]', { hasText: text }).evaluate((el) => el.getBoundingClientRect().height);
  // One line is still a 28px row; the option wider than the screen wraps.
  expect(await height('fct_supplier_payments')).toBe(28);
  expect(await height(LONG)).toBeGreaterThan(28);
});

test('Combobox: an option too long for the field wraps, at the field’s width', async ({ page }) => {
  await gotoStory(page, 'foundational-combobox--long-names');
  const input = page.locator('[data-slot="combobox-input"]').first();
  await input.click();
  const popup = page.locator('[data-slot="combobox-content"]');
  await expect(popup).toBeVisible();
  await expectWhole(popup.locator('[data-slot="combobox-item"] > span:last-child'), popup);

  const height = (text: string) =>
    popup.locator('[data-slot="combobox-item"]', { hasText: text }).evaluate((el) => el.getBoundingClientRect().height);
  expect(await height('fct_supplier_payments')).toBe(28);
  expect(await height(LONG)).toBeGreaterThan(28);
});
