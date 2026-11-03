import { chromium, expect, test, type Locator, type Page } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { DataTable } from '../../../packages/ui/src/components/product/DataTable';
import {
  printFigure,
  printUnits,
  toUnits,
  unmatchedTotals,
  type DataTableTotals,
} from '../../../packages/ui/src/components/product/DataTable/totals';
import { gotoStory } from './helpers';

/**
 * DataTable's totals row (docs/design-system.md §7.8). A double rule tells a
 * finance reader a total adds up, so it has to come from a check. These tests
 * read what a reader gets: the computed rule, the painted pixels, and the text.
 */

const STORY = 'product-datatable--';

const figureOf = (page: Page, text: string) => page.locator('tfoot span', { hasText: text }).first();

/** The figures in the totals row that carry the double rule. */
const ruled = (page: Page) =>
  page
    .locator('tfoot span')
    .evaluateAll((spans) =>
      spans.filter((s) => getComputedStyle(s).borderBottomStyle === 'double').map((s) => s.firstChild?.textContent),
    );

const tokenColour = (page: Page, token: string) =>
  page.evaluate((t) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${t})`;
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, token);

/** A column of pixels down through `locator`, 2 device pixels in from its left, where no glyph reaches. */
async function pixelColumn(page: Page, locator: Locator) {
  const png = await locator.screenshot();
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(2, 0, 1, bitmap.height);
    return Array.from({ length: bitmap.height }, (_, y) => data[y * 4]);
  }, png.toString('base64'));
}

/** The lines of ink down a column of pixels, and how many pixels sit between ink and paper. */
function inkRuns(painted: number[]) {
  const paper = painted[0];
  const ink = Math.min(...painted);
  const runs: number[] = [];
  let soft = 0;
  let inRun = false;
  for (const value of painted) {
    const isInk = Math.abs(value - ink) <= 2;
    if (!isInk && Math.abs(value - paper) > 2) soft++;
    if (isInk && !inRun) runs.push(0);
    if (isInk) runs[runs.length - 1]++;
    inRun = isInk;
  }
  return { runs, soft, contrast: paper - ink };
}

test.describe('the figure arithmetic', () => {
  test('counts the digits it prints, so a total adds what shows', () => {
    expect(toUnits(1234.5, 2)).toBe(123450n);
    expect(toUnits(0.05, 2)).toBe(5n);
    expect(toUnits(-41415809, 0)).toBe(-41415809n);
    // Math.round(1.45 * 10) is 15, but 1.45 prints as 1.4. The count follows the print.
    expect(toUnits(1.45, 1)).toBe(14n);
    expect(printFigure(1.45, 1)).toBe((1.45).toFixed(1));
  });

  test('a value that cannot print is not a part', () => {
    for (const value of [null, undefined, NaN, Infinity, '12', 1e21]) expect(toUnits(value, 0)).toBeNull();
    expect(printFigure(null, 0)).toBe('');
  });

  test('past 15 significant digits it refuses a figure a double can’t hold exactly', () => {
    expect(printFigure(9999999999999.99, 2)).toBe('9,999,999,999,999.99');
    expect(printFigure(999999999999999, 0)).toBe('999,999,999,999,999');
    // Prints as .02 through toFixed.
    expect(toUnits(Number('80000000000000.01'), 2)).toBeNull();
    expect(toUnits(1e15, 0)).toBeNull();
    // A double reads this as ...992, so a ¥1 gap would vanish before any check.
    expect(toUnits(Number('9007199254740993'), 0)).toBeNull();
  });

  test('a totals key that names no column is found', () => {
    expect(unmatchedTotals({ stated: { yen: 1, 'cost.yen': 2 }, sum: ['hours', 'rows'] }, ['yen', 'rows'])).toEqual([
      'cost.yen',
      'hours',
    ]);
    expect(unmatchedTotals({}, ['yen'])).toEqual([]);
  });

  test('prints grouped, with a true minus, and never a negative zero', () => {
    expect(printUnits(2192778193n, 0)).toBe('2,192,778,193');
    expect(printUnits(5220385n, 2)).toBe('52,203.85');
    expect(printUnits(5n, 2)).toBe('0.05');
    expect(printUnits(-41415809n, 0)).toBe('−41,415,809');
    expect(printFigure(-0.4, 0)).toBe('0');
    expect(printFigure(-0.04, 1)).toBe('0.0');
  });
});

test.describe('server-rendered, as a prerendered page ships it', () => {
  type Line = { label: string; yen: number };
  const data: Line[] = [
    { label: 'A', yen: 100 },
    { label: 'B', yen: 23 },
  ];
  const columns = [
    { accessorKey: 'label', header: 'Line' },
    { accessorKey: 'yen', header: 'Yen', meta: { figure: { decimals: 0, unit: 'JPY' } } },
  ];
  const render = (props: object) => renderToStaticMarkup(createElement(DataTable<Line>, { columns, data, ...props }));

  test('the rule is in the HTML when the parts sum, and not when they miss', () => {
    expect(render({ totals: { stated: { yen: 123 } } })).toContain('border-double');
    const missing = render({ totals: { stated: { yen: 124 } } });
    expect(missing).not.toContain('border-double');
    expect(missing).toContain('Difference');
  });

  test('no totals prop renders no foot at all', () => {
    expect(render({})).not.toContain('<tfoot');
  });

  test('no prop draws the rule', () => {
    const totals: DataTableTotals = {
      stated: { yen: 999 },
      // @ts-expect-error There is no such prop, on purpose.
      foots: true,
    };
    expect(render({ totals })).not.toContain('border-double');
  });

  test('a `sum` column adds up and claims nothing', () => {
    const html = render({ totals: { sum: ['yen'] } });
    expect(html).toContain('123');
    expect(html).not.toContain('border-double');
  });

  test('a figure column prints what is checked, whatever its cell says', () => {
    const lying = [columns[0], { ...columns[1], cell: () => 'not this' }];
    const html = renderToStaticMarkup(
      createElement(DataTable<Line>, { columns: lying, data, totals: { stated: { yen: 123 } } }),
    );
    expect(html).not.toContain('not this');
    expect(html).toContain('>100<');
  });

  test('a stated total that isn’t a figure reads "Incomplete", never the sum under the caller’s label', () => {
    for (const stated of [NaN, null, Infinity]) {
      const html = render({ totals: { label: 'Actual', stated: { yen: stated } } });
      expect(html).toContain('>Actual<');
      expect(html).toContain('>Incomplete<');
      expect(html).not.toContain('>123<');
      expect(html).not.toContain('border-double');
      expect(html).not.toContain('Difference');
    }
  });

  test('a server-side table never calls one page every row', () => {
    const totals = { stated: { yen: 999 } };
    const paged = render({ tableOptions: { manualPagination: true, rowCount: 1284 }, totals });
    expect(paged).toContain('Subtotal, 2 of 1,284 rows');
    expect(paged).not.toContain('Difference');
    expect(paged).not.toContain('border-double');

    expect(render({ tableOptions: { manualPagination: true }, totals })).toContain('Subtotal, 2 rows');
    const filtered = render({ tableOptions: { manualFiltering: true }, globalFilter: 'a', totals });
    expect(filtered).toContain('Subtotal, 2 rows');
    expect(filtered).not.toContain('Difference');

    // A filter the server has applied is still a filter, however many rows it left.
    expect(render({ tableOptions: { manualFiltering: true }, totals })).toContain('Difference');

    // Every row on the one page: this one really closes.
    const whole = render({ tableOptions: { manualPagination: true, rowCount: 2 }, totals: { stated: { yen: 123 } } });
    expect(whole).toContain('border-double');
  });

  test('a mono figure column keeps its total and difference in the same type as its rows', () => {
    const mono = [columns[0], { ...columns[1], meta: { ...columns[1].meta, content: 'mono' as const } }];
    const html = renderToStaticMarkup(
      createElement(DataTable<Line>, { columns: mono, data, totals: { stated: { yen: 124 } } }),
    );
    const foot = html.slice(html.indexOf('<tfoot'));
    expect(foot.match(/<td[^>]*font-mono text-xs/g)).toHaveLength(2);
  });

  test('no rows, no total', () => {
    const html = renderToStaticMarkup(
      createElement(DataTable<Line>, { columns, data: [], totals: { stated: { yen: 123 } } }),
    );
    expect(html).not.toContain('<tfoot');
  });
});

test.describe('the rule', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(`${theme}: 3px double in ink, under a total whose parts sum to it`, async ({ page }) => {
      await gotoStory(page, `${STORY}total-that-foots`, theme);
      await expect(figureOf(page, '2,192,778,193')).toBeVisible();

      const rule = await figureOf(page, '2,192,778,193').evaluate((el) => {
        const style = getComputedStyle(el);
        return { style: style.borderBottomStyle, width: style.borderBottomWidth, colour: style.borderBottomColor };
      });
      expect(rule).toEqual({ style: 'double', width: '3px', colour: await tokenColour(page, '--color-text-primary') });
      await expect(page.getByText('Difference')).toHaveCount(0);
    });

    test(`${theme}: one rule per figure, and a difference in words where it misses`, async ({ page }) => {
      await gotoStory(page, `${STORY}one-column-does-not-foot`, theme);
      await expect(page.getByRole('rowheader', { name: 'Difference' })).toBeVisible();

      expect(await ruled(page)).toEqual(['34,436,068,352']);
      // The stated figure stays. Replacing it with the sum would hide the gap.
      await expect(figureOf(page, '2,192,778,193')).toBeVisible();

      const danger = await tokenColour(page, '--color-text-danger');
      await expect(page.getByRole('rowheader', { name: 'Difference' })).toHaveCSS('color', danger);
      await expect(page.getByRole('cell', { name: '214,140,479' })).toHaveCSS('color', danger);
    });
  }

  test('a rounding gap gets no tolerance: −41 and −275 against a stated −317', async ({ page }) => {
    await gotoStory(page, `${STORY}rounded-parts-do-not-foot`);
    await expect(page.getByRole('rowheader', { name: 'Difference' })).toBeVisible();
    expect(await ruled(page)).toEqual([]);
    await expect(page.locator('tfoot tr').nth(1).locator('td')).toHaveText('−1');
  });

  test('a check that could not run neither passes nor fails', async ({ page }) => {
    await gotoStory(page, `${STORY}totals-that-cannot-be-checked`);
    await expect(page.locator('tfoot')).toContainText('Mixed');
    await expect(page.locator('tfoot')).toContainText('Incomplete');
    expect(await ruled(page)).toEqual([]);
    await expect(page.getByText('Difference')).toHaveCount(0);
  });

  test('it clears the box: inside the cell, 4px above the table’s bottom edge', async ({ page }) => {
    await gotoStory(page, `${STORY}total-that-foots`);
    const figure = figureOf(page, '2,192,778,193');
    await expect(figure).toBeVisible();
    const clearance = await figure.evaluate(
      (el) => el.closest('td')!.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom,
    );
    expect(clearance).toBe(4);
  });
});

test.describe('total of what', () => {
  test('a filter that hides rows makes it a subtotal; clearing it brings the total and its rule back', async ({
    page,
  }) => {
    await gotoStory(page, `${STORY}total-while-filtered`);
    const filter = page.getByRole('textbox', { name: 'Filter the bridge' });

    await expect(page.getByRole('rowheader', { name: 'Subtotal, 2 of 7 rows' })).toBeVisible();
    expect(await ruled(page)).toEqual([]);
    await expect(page.locator('tfoot td').last()).toHaveText('−316,748,831');

    await filter.fill('');
    await expect(page.getByRole('rowheader', { name: 'Actual' })).toBeVisible();
    expect(await ruled(page)).toEqual(['2,192,778,193']);

    // Every row's label has an "e", so a filter is set and every row still shows.
    await filter.fill('e');
    await expect(page.getByRole('rowheader', { name: 'Actual' })).toBeVisible();
    expect(await ruled(page)).toEqual(['2,192,778,193']);

    await filter.fill('nothing matches this');
    await expect(page.locator('tfoot')).toHaveCount(0);
  });

  test('sorting never changes it, though these cents add to a different float each way', async ({ page }) => {
    await gotoStory(page, `${STORY}total-with-cents`);
    const cells = page.locator('tbody tr[data-row-id] td:last-child');
    await expect(cells.nth(1)).toHaveText('1,204.10');
    expect(await ruled(page)).toEqual(['52,203.85']);

    // A numeric column sorts descending first.
    const sort = page.getByRole('button', { name: 'USD' });
    await sort.click();
    await expect(cells.nth(1)).toHaveText('2,750.05');
    expect(await ruled(page)).toEqual(['52,203.85']);

    await sort.click();
    await expect(cells.first()).toHaveText('33.30');
    expect(await ruled(page)).toEqual(['52,203.85']);
  });

  test('50,000 rows: it covers them all, stays in view, and the rows do not drift', async ({ page }) => {
    await gotoStory(page, `${STORY}total-over-many-rows`);
    const rows = page.locator('tbody tr[data-row-id]');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeLessThan(100);
    const before = await ruled(page);
    expect(before).toHaveLength(1);

    await page.locator('tfoot').evaluate((foot) => {
      const scroller = foot.closest('table')!.parentElement!;
      scroller.scrollTop = scroller.scrollHeight;
    });
    await expect(page.locator('tbody tr[data-row-id="49999"]')).toBeVisible();
    expect(await ruled(page)).toEqual(before);

    const box = await page.evaluate(() => {
      const last = document.querySelector('tbody tr[data-row-id="49999"]')!.getBoundingClientRect();
      const foot = document.querySelector('tfoot')!.getBoundingClientRect();
      const scroll = document.querySelector('tfoot')!.closest('table')!.parentElement!.getBoundingClientRect();
      return {
        lastBottom: last.bottom,
        lastHeight: last.height,
        footTop: foot.top,
        footBottom: foot.bottom,
        end: scroll.bottom,
      };
    });
    expect(box.lastHeight).toBe(28);
    expect(box.lastBottom).toBe(box.footTop);
    expect(box.footBottom).toBe(box.end);
  });

  test('columns hold still when a wide figure far down scrolls in, and it is never clipped', async ({ page }) => {
    await gotoStory(page, `${STORY}wide-figure-far-down`);
    const headers = page.locator('#storybook-root thead th');
    const widths = () => headers.evaluateAll((ths) => ths.map((th) => th.getBoundingClientRect().width));
    await expect(page.locator('#storybook-root tbody tr[data-row-id="0"]')).toBeVisible();
    const before = await widths();

    await page.locator('#storybook-root table').evaluate((table) => {
      table.parentElement!.scrollTop = 3000 * 28;
    });
    const wide = page.locator('#storybook-root tbody tr[data-row-id="3000"]');
    await expect(wide).toBeVisible();
    await expect(wide.locator('td').nth(1)).toHaveText('123,456,789,012,345');

    expect(await widths()).toEqual(before);
    const clipped = await wide.locator('td').evaluateAll((tds) => tds.map((td) => td.scrollWidth > td.clientWidth));
    expect(clipped).toEqual([false, false, false]);
  });

  test('a control tabbed to in a row never lands under the sticky foot', async ({ page }) => {
    await gotoStory(page, `${STORY}total-over-many-rows`);
    await expect(page.locator('tfoot')).toBeVisible();
    await page.getByRole('button', { name: /^fct_gl_entries_0$/ }).focus();
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press('Tab');
      const { bottom, footTop } = await page.evaluate(() => ({
        bottom: document.activeElement!.getBoundingClientRect().bottom,
        footTop: document.querySelector('tfoot')!.getBoundingClientRect().top,
      }));
      expect(bottom).toBeLessThanOrEqual(footTop);
    }
  });
});

/**
 * §8.6: a double-click in a numeric cell takes the whole figure, and a copied
 * negative carries a hyphen. A browser's own double-click selects a word, and the
 * sign isn't part of one, so a negative would copy as a positive, with no error.
 * Each double-click lands on the sign, where that's easiest to see.
 */
test.describe('copying', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  const copy = async (page: Page) => {
    await page.evaluate(() => navigator.clipboard.writeText('NOTHING COPIED'));
    await page.keyboard.press('ControlOrMeta+C');
    return page.evaluate(async () => {
      const flavours: Record<string, string> = {};
      for (const item of await navigator.clipboard.read()) {
        for (const type of item.types) flavours[type] = await (await item.getType(type)).text();
      }
      return flavours;
    });
  };

  const doubleClickStartOfFigure = async (page: Page, cell: Locator) => {
    const box = await cell.evaluate((td) => {
      const text = document.createTreeWalker(td, NodeFilter.SHOW_TEXT).nextNode()!;
      const range = document.createRange();
      range.selectNode(text);
      const { x, y, height } = range.getBoundingClientRect();
      return { x, y, height };
    });
    await page.mouse.click(1, 1);
    await page.mouse.dblclick(box.x + 1, box.y + box.height / 2);
    return page.evaluate(() => getSelection()!.toString());
  };

  test('a double-click takes the whole figure with its sign: a part, a total and a difference', async ({ page }) => {
    await gotoStory(page, `${STORY}rounded-parts-do-not-foot`);
    await expect(page.getByRole('rowheader', { name: 'Difference' })).toBeVisible();

    const part = page.locator('tbody tr[data-row-id] td:last-child').first();
    expect(await doubleClickStartOfFigure(page, part)).toBe('−41');
    expect((await copy(page))['text/plain']).toBe('-41');

    const total = page.locator('tfoot tr').first().locator('td');
    expect(await doubleClickStartOfFigure(page, total)).toBe('−317');
    expect((await copy(page))['text/plain']).toBe('-317');

    const difference = page.locator('tfoot tr').nth(1).locator('td');
    expect(await doubleClickStartOfFigure(page, difference)).toBe('−1');
    expect((await copy(page))['text/plain']).toBe('-1');
  });

  test('the hidden "adds up" stays out of what a person copies, in every flavour', async ({ page }) => {
    await gotoStory(page, `${STORY}total-that-foots`);
    const total = page.locator('tfoot td').first();
    await expect(total).toContainText('adds up');

    expect(await doubleClickStartOfFigure(page, total)).toBe('2,192,778,193');
    const figure = await copy(page);
    expect(figure['text/plain']).toBe('2,192,778,193');
    for (const [type, text] of Object.entries(figure)) expect(text, type).not.toContain('adds up');

    // A drag across the row is the other way in, and the row holds no minus, so
    // this one is the browser's own copy.
    await page.evaluate(() => {
      const row = document.querySelector('tfoot tr') as HTMLTableRowElement;
      const range = document.createRange();
      range.setStartBefore(row.cells[0]);
      range.setEndAfter(row.cells[row.cells.length - 1]);
      getSelection()!.removeAllRanges();
      getSelection()!.addRange(range);
    });
    for (const [type, text] of Object.entries(await copy(page))) expect(text, type).not.toContain('adds up');
  });

  test('a selection across negative rows and a total carries hyphens, and keeps the total', async ({ page }) => {
    await gotoStory(page, `${STORY}total-while-filtered`);
    await expect(page.locator('tfoot')).toBeVisible();
    await page.evaluate(() => {
      const first = document.querySelector('tbody tr[data-row-id]') as HTMLTableRowElement;
      const foot = document.querySelector('tfoot tr') as HTMLTableRowElement;
      const range = document.createRange();
      range.setStartBefore(first.cells[0]);
      range.setEndAfter(foot.cells[foot.cells.length - 1]);
      getSelection()!.removeAllRanges();
      getSelection()!.addRange(range);
    });
    const copied = await copy(page);
    expect(copied['text/plain']).toContain('-41,415,809');
    expect(copied['text/plain']).toContain('-316,748,831');
    expect(copied['text/plain']).not.toContain('−');
  });
});

test.describe('the row', () => {
  test('28px in every state, the same as a body row', async ({ page }) => {
    for (const name of [
      'total-that-foots',
      'one-column-does-not-foot',
      'total-while-filtered',
      'totals-that-cannot-be-checked',
    ]) {
      await gotoStory(page, `${STORY}${name}`);
      await expect(page.locator('tfoot')).toBeVisible();
      const heights = await page
        .locator('tfoot tr, tbody tr[data-row-id]')
        .evaluateAll((rows) => rows.map((r) => r.getBoundingClientRect().height));
      expect(new Set(heights), name).toEqual(new Set([28]));
    }
  });

  test('the text holds its height when the rule comes and goes', async ({ page }) => {
    await gotoStory(page, `${STORY}total-while-filtered`);
    const filter = page.getByRole('textbox', { name: 'Filter the bridge' });
    const textY = (locator: Locator) =>
      locator.evaluate((el) => {
        // The text node alone: the span also holds the hidden "adds up".
        const range = document.createRange();
        range.selectNode(el.firstChild!);
        return range.getBoundingClientRect().top - el.closest('tr')!.getBoundingClientRect().top;
      });

    const without = await textY(page.locator('tfoot td span').first());
    await filter.fill('');
    await expect(page.getByRole('rowheader', { name: 'Actual' })).toBeVisible();
    expect(await textY(page.locator('tfoot td span').first())).toBe(without);
    expect(await textY(page.locator('tfoot th span').first())).toBe(without);
  });

  test('figures hold their column: same digits, same width, same right edge as the rows above', async ({ page }) => {
    await gotoStory(page, `${STORY}total-that-foots`);
    await expect(page.locator('tfoot')).toBeVisible();
    const widths = await page.evaluate(() => {
      const measure = (el: Element) => {
        const range = document.createRange();
        range.selectNode(el.firstChild!);
        return range.getBoundingClientRect();
      };
      // Budget and Actual both print as d,ddd,ddd,ddd.
      const budget = measure(document.querySelector('tbody tr[data-row-id] td:last-child')!);
      const actual = measure(document.querySelector('tfoot td span')!);
      return { budget: budget.width, actual: actual.width, budgetRight: budget.right, actualRight: actual.right };
    });
    expect(widths.actual).toBeCloseTo(widths.budget, 2);
    expect(widths.actualRight).toBeCloseTo(widths.budgetRight, 2);
    await expect(figureOf(page, '2,192,778,193')).toHaveCSS('font-weight', '400');
    await expect(figureOf(page, '2,192,778,193')).toHaveCSS('font-variant-numeric', /tabular-nums/);
    // Rule 7 covers a label's figures too. It inherits this from `html` (§8.6).
    await expect(page.getByRole('rowheader', { name: 'Actual' })).toHaveCSS('font-variant-numeric', /tabular-nums/);
  });

  test('a figure column prints a true minus, and a screen reader hears the mark', async ({ page }) => {
    await gotoStory(page, `${STORY}total-that-foots`);
    await expect(page.getByRole('cell', { name: '−41,415,809' })).toBeVisible();
    expect((await page.locator('tbody tr[data-row-id] td:last-child').allTextContents()).join('')).not.toContain('-');

    await expect(page.getByRole('rowheader', { name: 'Actual' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2,192,778,193 adds up' })).toBeVisible();
    // People paste these figures: the words don't come along.
    await expect(page.getByText('adds up')).toHaveCSS('user-select', 'none');
  });

  test.describe('in forced colours', () => {
    test.use({ forcedColors: 'active' });

    test('the double rule draws, and a figure with no rule gets no line at all', async ({ page }) => {
      await gotoStory(page, `${STORY}one-column-does-not-foot`);
      const foots = figureOf(page, '34,436,068,352');
      const misses = figureOf(page, '2,192,778,193');
      await expect(misses).toBeVisible();

      expect(inkRuns(await pixelColumn(page, foots)).runs).toHaveLength(2);
      // Forced colours paint a transparent border solid. If the slot were one, a
      // total that misses would get a heavier line than one that foots.
      expect(new Set(await pixelColumn(page, misses)).size).toBe(1);
    });
  });
});

/**
 * The painted rule, at real device pixel ratios. Playwright's emulated
 * `deviceScaleFactor` draws a `double` soft, so these launch with
 * --force-device-scale-factor. A computed style can't say whether it resolved
 * into two lines: this reads a column of pixels down through the rule, at the
 * cell's left, where no glyph reaches.
 */
test.describe('painted', () => {
  for (const scale of [1, 1.25, 1.5, 1.75, 2]) {
    test(`two separate lines on whole pixels at ${scale}x`, async ({ baseURL }) => {
      const browser = await chromium.launch({
        args: [`--force-device-scale-factor=${scale}`, '--window-size=1100,800'],
      });
      try {
        const context = await browser.newContext({
          baseURL,
          viewport: null,
          // Off, or Playwright's device profile overrides the real ratio.
          deviceScaleFactor: undefined,
          isMobile: undefined,
          hasTouch: undefined,
          screen: undefined,
        });
        const page = await context.newPage();
        await gotoStory(page, `${STORY}total-that-foots`, 'light');
        expect(await page.evaluate(() => devicePixelRatio)).toBeCloseTo(scale, 5);
        const figure = figureOf(page, '2,192,778,193');
        await expect(figure).toBeVisible();

        const { runs, soft, contrast } = inkRuns(await pixelColumn(page, figure));
        expect(runs, 'two lines of ink').toHaveLength(2);
        expect(soft, 'no pixel between ink and paper').toBe(0);
        expect(contrast, 'ink on paper').toBeGreaterThan(150);
      } finally {
        await browser.close();
      }
    });
  }
});
