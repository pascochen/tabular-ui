import { expect, test, type Locator, type Page } from '@playwright/test';

import { copy, gotoStory } from './helpers';

/**
 * The tick, the wash and the rule (packages/ui/src/lib/gestures.tsx;
 * docs/explorations/motion-page-spec.md, M1–M4). Each is pressed for real,
 * then checked twice: that it runs on a change seen live and not on load, and
 * that under reduced motion the end state arrives with nothing moving.
 *
 * Reduced motion is set with `page.emulateMedia` and probed, as
 * reduced-motion.spec.ts explains: the fixture form can miss the page.
 */

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

async function reduceMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}

const animation = (el: Locator, pseudo?: '::after') =>
  el.evaluate((node, part) => getComputedStyle(node, part).animationName, pseudo);

/** The keyframes really exist: an `animation-name` reads the same when they don't. */
const keyframes = (page: Page) =>
  page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule) => rule instanceof CSSKeyframesRule)
      .map((rule) => rule.name),
  );

test.describe('M1: the tracer becomes a tick', () => {
  const badge = (page: Page) => page.locator('#storybook-root [data-slot="badge"]');

  test('a badge that mounts passed is still', async ({ page }) => {
    await gotoStory(page, 'product-statusbadge--default');
    await expect(badge(page)).toHaveAttribute('data-status', 'passed');
    expect(await animation(badge(page).locator('svg'))).toBe('none');
  });

  test('work seen running that passes has its check drawn in, and running again is not ticked', async ({ page }) => {
    await gotoStory(page, 'product-statusbadge--ticked-on-pass');
    await page.getByRole('button', { name: 'Finish the run' }).click();
    await expect(badge(page)).toHaveAttribute('data-status', 'passed');
    const mark = badge(page).locator('svg');
    expect(await animation(mark)).toBe('tui-tick');
    expect(await mark.evaluate((el) => getComputedStyle(el).animationDuration)).toBe('0.14s');
    expect(await keyframes(page)).toContain('tui-tick');
    await page.getByRole('button', { name: 'Run again' }).click();
    await expect(badge(page)).toHaveAttribute('data-status', 'running');
    await expect(badge(page).locator('[data-slot="spinner"]')).toHaveCount(1);
  });

  test('under reduced motion the mark swaps in place', async ({ page }) => {
    await gotoStory(page, 'product-statusbadge--ticked-on-pass');
    await reduceMotion(page);
    await page.getByRole('button', { name: 'Finish the run' }).click();
    await expect(badge(page)).toHaveAttribute('data-status', 'passed');
    expect(await animation(badge(page).locator('svg'))).toBe('none');
  });
});

test.describe('M2: copied cells take a wash', () => {
  const STORY = 'product-datatable--default';
  const cells = (page: Page) => page.locator('#storybook-root tbody td');

  /** Selects the first two rows, whole cells, as a drag would. */
  const selectTwoRows = (page: Page) =>
    page.evaluate(() => {
      const rows = document.querySelectorAll('#storybook-root tbody tr');
      const range = document.createRange();
      range.setStartBefore((rows[0] as HTMLTableRowElement).cells[0]);
      range.setEndAfter((rows[1] as HTMLTableRowElement).cells[(rows[1] as HTMLTableRowElement).cells.length - 1]);
      getSelection()!.removeAllRanges();
      getSelection()!.addRange(range);
    });

  const copiedStates = (page: Page) =>
    cells(page).evaluateAll((tds) => tds.map((td) => (td as HTMLElement).dataset.copied ?? ''));

  test('nothing is washed at rest', async ({ page }) => {
    await gotoStory(page, STORY);
    expect((await copiedStates(page)).filter(Boolean)).toEqual([]);
  });

  test('a copy washes the copied cells in, as one band, then out, and says Copied once', async ({ page }) => {
    await gotoStory(page, STORY);
    // Every state the first cell passes through, with the animation it ran: the
    // out phase lasts 200ms, too short to catch by polling after the fact.
    await page.evaluate(() => {
      const td = document.querySelector('#storybook-root tbody td') as HTMLElement;
      const seen: string[] = [];
      (window as unknown as { washSeen: string[] }).washSeen = seen;
      new MutationObserver(() =>
        seen.push(`${td.dataset.copied ?? 'cleared'}:${getComputedStyle(td, '::after').animationName}`),
      ).observe(td, { attributes: true, attributeFilter: ['data-copied'] });
    });
    await selectTwoRows(page);
    await copy(page);
    const states = await copiedStates(page);
    const perRow = await page.locator('#storybook-root tbody tr').first().locator('td').count();
    // The two rows, and nothing else.
    expect(states.slice(0, perRow * 2).every((s) => s === 'in')).toBe(true);
    expect(states.slice(perRow * 2).every((s) => s === '')).toBe(true);
    const first = cells(page).first();
    expect(await first.evaluate((el) => getComputedStyle(el, '::after').backgroundColor)).toMatch(/\/ 0\.1\)$/);
    // One band: the last column starts after the first, and they share 140ms between them.
    const delays = await page
      .locator('#storybook-root tbody tr')
      .first()
      .locator('td')
      .evaluateAll((tds) => tds.map((td) => parseFloat(getComputedStyle(td, '::after').animationDelay)));
    expect(delays[0]).toBe(0);
    expect(delays[delays.length - 1]).toBeGreaterThan(0);
    expect(delays[delays.length - 1]).toBeLessThan(0.14);
    await expect(page.locator('#storybook-root').getByRole('status')).toHaveText('Copied');

    await expect.poll(async () => (await copiedStates(page)).filter(Boolean)).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { washSeen: string[] }).washSeen)).toEqual([
      'in:tui-wash-in',
      'out:tui-wash-out',
      'cleared:none',
    ]);
  });

  test('under reduced motion the tone shows still, then goes', async ({ page }) => {
    await gotoStory(page, STORY);
    await reduceMotion(page);
    await selectTwoRows(page);
    await copy(page);
    const first = cells(page).first();
    await expect(first).toHaveAttribute('data-copied', 'still');
    expect(await animation(first, '::after')).toBe('none');
    await expect(first).not.toHaveAttribute('data-copied', { timeout: 2000 });
  });
});

test.describe('M3: the total is ruled', () => {
  const ruledSpans = (page: Page) => page.locator('#storybook-root tfoot [data-ruled]');

  test('a table that loads balanced is still', async ({ page }) => {
    await gotoStory(page, 'product-datatable--total-that-foots');
    await expect(page.locator('#storybook-root tfoot').getByText('adds up')).toHaveCount(1);
    await expect(ruledSpans(page)).toHaveCount(0);
  });

  test('rows that come to sum have their rule drawn in, left to right', async ({ page }) => {
    await gotoStory(page, 'product-datatable--total-while-filtered');
    await expect(ruledSpans(page)).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Filter the bridge' }).fill('');
    await expect(ruledSpans(page)).toHaveCount(1);
    const span = ruledSpans(page);
    expect(await animation(span, '::after')).toBe('tui-unrule');
    const cover = await span.evaluate((el) => {
      const after = getComputedStyle(el, '::after');
      return { origin: after.transformOrigin, duration: after.animationDuration, height: after.height };
    });
    expect(cover.duration).toBe('0.2s');
    // Shrinking toward its right end reveals the rule from the left.
    expect(cover.origin.startsWith(await span.evaluate((el) => `${el.getBoundingClientRect().width}px`))).toBe(true);
    expect(cover.height).toBe('3px');
    expect(await keyframes(page)).toContain('tui-unrule');
  });

  test('under reduced motion the rule appears, with no cover', async ({ page }) => {
    await gotoStory(page, 'product-datatable--total-while-filtered');
    await reduceMotion(page);
    await page.getByRole('textbox', { name: 'Filter the bridge' }).fill('');
    await expect(ruledSpans(page)).toHaveCount(1);
    expect(await animation(ruledSpans(page), '::after')).toBe('none');
    expect(await ruledSpans(page).evaluate((el) => getComputedStyle(el, '::after').content)).toBe('none');
  });
});

test.describe('M4: a copied ID is ticked', () => {
  const STORY = 'product-projectswitcher--default';
  const item = (page: Page, name: string) => page.getByRole('menuitem', { name, exact: true });

  async function copyId(page: Page) {
    await page.locator('[data-slot="menu-trigger"]').click();
    await page.getByRole('menuitem', { name: /, current$/ }).hover();
    await item(page, 'Copy project ID').click();
  }

  test('the check is drawn in, and the copy icon fades back', async ({ page }) => {
    await gotoStory(page, STORY);
    await page.locator('[data-slot="menu-trigger"]').click();
    await page.getByRole('menuitem', { name: /, current$/ }).hover();
    // Still on first open.
    expect(await animation(item(page, 'Copy project ID').locator('svg'))).toBe('none');
    await item(page, 'Copy project ID').click();
    await expect(item(page, 'Copied')).toBeVisible();
    await expect(item(page, 'Copied').locator('svg')).toHaveCount(1);
    expect(await animation(item(page, 'Copied').locator('svg'))).toBe('tui-tick');
    await expect(item(page, 'Copy project ID')).toBeVisible({ timeout: 2500 });
    expect(await animation(item(page, 'Copy project ID').locator('svg'))).toBe('tui-fade-in');
  });

  test('under reduced motion the icons swap in place', async ({ page }) => {
    await gotoStory(page, STORY);
    await reduceMotion(page);
    await copyId(page);
    await expect(item(page, 'Copied')).toBeVisible();
    expect(await animation(item(page, 'Copied').locator('svg'))).toBe('none');
  });
});
