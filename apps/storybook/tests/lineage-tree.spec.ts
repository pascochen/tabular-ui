import { expect, test, type Page } from '@playwright/test';

import { gotoStory, tabTo } from './helpers';

/**
 * A name cut off has to be readable, and a tooltip never opens on touch
 * (failure log). Until 2026-11-27 a long model name truncated with nothing to
 * read it by: in a 343px panel, as a 375px phone gives it,
 * `int_supplier_payments__matched_to_invoices` kept 202 of its 277px. Now a
 * cut name shows whole in a tooltip on hover and keyboard focus, and
 * activating it opens a line under its row with the full name, as well as
 * selecting the node. A name that fits only selects.
 */
const story = 'product-lineagetree--long-names';
const CUT = 'int_supplier_payments__matched_to_invoices';
const nameButton = (page: Page, name: string) =>
  // The caret is the button with aria-expanded; the name is the other one.
  page.locator('[data-slot="lineage-tree"] button:not([aria-expanded])', { hasText: name });
const opened = (page: Page) => page.locator('[data-slot="lineage-tree-name"]');

test.describe('a cut name, by touch', () => {
  test.use({ hasTouch: true });

  test('opens a line under its row with the full name, and still selects the node', async ({ page }) => {
    await gotoStory(page, story);
    const button = nameButton(page, CUT);
    expect(await button.locator('[data-slot="truncated-text"]').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    const rowHeight = () => button.evaluate((el) => el.parentElement!.getBoundingClientRect().height);

    await button.tap();
    await expect(button).toHaveAttribute('aria-current', 'true');
    await expect(opened(page)).toHaveText(CUT);
    // Readable means whole and on screen: it wraps inside the tree.
    const [line, tree] = await Promise.all([
      opened(page).boundingBox(),
      page.locator('[data-slot="lineage-tree"]').boundingBox(),
    ]);
    expect(line!.x + line!.width).toBeLessThanOrEqual(tree!.x + tree!.width);
    expect(await opened(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    // The row keeps its 24px; the name opens under it.
    expect(await rowHeight()).toBe(24);

    await button.tap();
    await expect(opened(page)).toHaveCount(0);
  });

  test('a name that fits only selects', async ({ page }) => {
    await gotoStory(page, story);
    const button = nameButton(page, 'stg_sap__bsak');
    await button.tap();
    await expect(button).toHaveAttribute('aria-current', 'true');
    await expect(opened(page)).toHaveCount(0);
  });
});

test('a cut name shows whole in a tooltip on keyboard focus', async ({ page }) => {
  await gotoStory(page, story);
  expect(await tabTo(page, nameButton(page, CUT))).toBe(true);
  await expect(page.locator('[data-slot="tooltip-content"][data-open]')).toHaveText(CUT);
});
