import { expect, test, type Page } from '@playwright/test';

import { gotoStory, tabTo } from './helpers';

/**
 * A name cut off has to be readable, and a tooltip never opens on touch
 * (failure log). Until 2026-11-27 a long filename truncated with nothing to
 * read it by: in a 343px list, as a 375px phone gives it, even
 * `bank_export_kjp_2026-09.csv` lost 31px of its 178px. Now a cut name shows
 * whole in a tooltip on hover and keyboard focus, and a cut name that isn't a
 * link opens its row in place to the full name. A linked name opens its file.
 */
const story = 'product-attachmentrow--long-names';
const row = (page: Page, i: number) => page.locator('[data-slot="attachment-row"]').nth(i);
const isCut = (page: Page, i: number) =>
  row(page, i)
    .locator('[data-slot="truncated-text"]')
    .evaluate((el) => el.scrollWidth > el.clientWidth);

test.describe('a cut name, by touch', () => {
  test.use({ hasTouch: true });

  test('opens its row in place to the full name; a name that fits leaves its row plain', async ({ page }) => {
    await gotoStory(page, story);

    // Fits: no control, as before.
    expect(await isCut(page, 0)).toBe(false);
    await expect(row(page, 0).locator('button')).toHaveCount(0);

    // Cut: a closed disclosure, in a 28px row.
    const cut = row(page, 2);
    expect(await isCut(page, 2)).toBe(true);
    const control = cut.locator('button[aria-expanded]');
    await expect(control).toHaveAttribute('aria-expanded', 'false');
    const closed = (await cut.boundingBox())!.height;

    await control.tap();
    await expect(control).toHaveAttribute('aria-expanded', 'true');
    const whole = cut.locator('[data-slot="attachment-row-name"]');
    await expect(whole).toHaveText('bank_export_kjp_2026-09.csv');
    // Readable means on screen, whole: it wraps inside the row, never past it.
    const [nameBox, rowBox] = await Promise.all([whole.boundingBox(), cut.boundingBox()]);
    expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width);
    expect(await whole.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    // The row line itself keeps its 28px; the name opens under it.
    expect(closed).toBe(28);
    expect((await control.boundingBox())!.y + (await control.boundingBox())!.height).toBeLessThanOrEqual(
      rowBox!.y + closed,
    );

    await control.tap();
    await expect(whole).toHaveCount(0);
  });

  test('a cut linked name stays a link, with no disclosure beside it', async ({ page }) => {
    await gotoStory(page, story);
    expect(await isCut(page, 3)).toBe(true);
    await expect(row(page, 3).locator('a[href]')).toHaveText('manual_journal_entries_fy2026_h1.csv');
    await expect(row(page, 3).locator('[aria-expanded]')).toHaveCount(0);
  });
});

test('a cut name shows whole in a tooltip on keyboard focus, linked or not', async ({ page }) => {
  await gotoStory(page, story);
  const tooltip = page.locator('[data-slot="tooltip-content"][data-open]');

  expect(await tabTo(page, row(page, 2).locator('button[aria-expanded]'))).toBe(true);
  await expect(tooltip).toHaveText('bank_export_kjp_2026-09.csv');

  expect(await tabTo(page, row(page, 3).locator('a[href]'))).toBe(true);
  await expect(tooltip).toHaveText('manual_journal_entries_fy2026_h1.csv');
});
