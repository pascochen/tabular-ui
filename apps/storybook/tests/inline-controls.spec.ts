import { expect, test } from '@playwright/test';

import { gotoStory, token } from './helpers';

/**
 * Controls that used to be hand-styled <button>s, or nested one inside
 * another, and now use the foundational components (2026-10-09):
 *
 * - Chip's dismiss X is a sibling button, not a span inside the chip's own.
 * - DataTable's sort headers and LineageTree's rows and carets use the
 *   `inline` variant of Button / IconButton.
 *
 * Their screenshots were held pixel-identical through the change, so these
 * pin what a screenshot cannot see: keyboard order, behaviour, and geometry
 * read from tokens rather than restated as numbers.
 */

const px = (v: string) => parseFloat(v);

test.describe('Chip — dismissible', () => {
  test('the X is a sibling: Tab reaches the chip, then its X, and Enter removes it', async ({ page }) => {
    await gotoStory(page, 'foundational-chip--dismissible');
    const chip = page.getByRole('button', { name: 'SAP', exact: true });
    const dismiss = page.getByRole('button', { name: 'Remove SAP filter' });

    await chip.focus();
    await page.keyboard.press('Tab');
    await expect(dismiss).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(chip).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Q2 FY2026', exact: true })).toBeVisible();
  });

  test('the X sits where it always did, and its focus ring stays inside the chip', async ({ page }) => {
    await gotoStory(page, 'foundational-chip--dismissible');
    const chip = page.getByRole('button', { name: 'SAP', exact: true });
    const dismiss = page.getByRole('button', { name: 'Remove SAP filter' });
    const c = (await chip.boundingBox())!;
    const d = (await dismiss.boundingBox())!;
    const icon = (await dismiss.locator('svg').boundingBox())!;

    // Same height, flush with the chip's right edge.
    expect(d.y).toBeCloseTo(c.y, 1);
    expect(d.height).toBeCloseTo(c.height, 1);
    expect(d.x + d.width).toBeCloseTo(c.x + c.width, 1);

    // The icon's right edge is the chip's padding less the 2px optical pull,
    // plus the 1px border, inside the chip's outer edge — as before the change.
    const padX = px(await token(page, '--pad-chip-x'));
    expect(c.x + c.width - (icon.x + icon.width)).toBeCloseTo(padX - 2 + 1, 1);

    // The chip's label stops short of the X: its padding reserves the X's width.
    const reserved = await chip.evaluate((el) => parseFloat(getComputedStyle(el).paddingRight));
    expect(reserved + 1).toBeCloseTo(d.width, 1);

    await dismiss.focus();
    const offset = await dismiss.evaluate((el) => parseFloat(getComputedStyle(el).outlineOffset));
    expect(offset, 'inset ring, so a scrolling filter bar cannot clip it').toBeLessThan(0);
  });
});

test.describe('DataTable — sort headers', () => {
  test('headers render uppercase, as §8.1 specifies, and sort on click', async ({ page }) => {
    await gotoStory(page, 'product-datatable--default');
    const button = page.getByRole('button', { name: 'Rows' });
    // Browsers give <button> text-transform:none; the inline variant must
    // inherit the cell's uppercase, or every sortable header is mixed case.
    await expect(button).toHaveCSS('text-transform', 'uppercase');

    const th = page.locator('th', { has: button });
    const before = await th.getAttribute('aria-sort');
    await button.click();
    await expect(th).not.toHaveAttribute('aria-sort', before ?? '');
    await expect(th).toHaveAttribute('aria-sort', /ascending|descending/);
  });
});

test.describe('LineageTree — rows and carets', () => {
  test('the caret toggles from the keyboard, and leaves have no control to tab past', async ({ page }) => {
    await gotoStory(page, 'product-lineagetree--collapsed');
    const caret = page.getByRole('button', { name: 'Expand dim_accounts' });
    // Hold the element, not a locator: the caret's name flips to "Collapse"
    // on success, and items nest, so a `has:` filter would match ancestors.
    const item = await caret.evaluateHandle((el) => el.closest('[role="treeitem"]')!);
    const expanded = () => item.evaluate((el) => el.getAttribute('aria-expanded'));

    expect(await expanded()).toBe('false');
    await caret.focus();
    await page.keyboard.press('Enter');
    await expect.poll(expanded).toBe('true');
    await expect(page.getByRole('button', { name: 'Collapse dim_accounts' })).toBeFocused();

    // dim_calendar is a leaf: no Expand/Collapse control exists for it.
    await expect(page.getByRole('button', { name: /^(Expand|Collapse) dim_calendar$/ })).toHaveCount(0);
  });
});
