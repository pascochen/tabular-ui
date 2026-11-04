import { expect, test, type Page } from '@playwright/test';

import { gotoStory, injectAxe } from './helpers';

/**
 * §10 items that a grep cannot settle, because they are about what the
 * browser renders rather than what the source says.
 */

/**
 * §0 rule 6 — every figure column carries `tabular-nums`. The check that
 * matters is a variance column with mixed-width figures: if the glyphs are
 * proportional, "+18.2%" and "−4.7%" will not align and the misalignment is
 * the correctness hazard, not the aesthetic one.
 */
test('numeric cells render tabular figures, and the column aligns', async ({ page }) => {
  await gotoStory(page, 'product-datatable--default');

  const cells = await page.evaluate(() => {
    const out: { text: string; variant: string; align: string; right: number }[] = [];
    for (const td of Array.from(document.querySelectorAll('td'))) {
      if (!td.className.includes('tabular-nums')) continue;
      const s = getComputedStyle(td);
      out.push({
        text: td.textContent ?? '',
        variant: s.fontVariantNumeric,
        align: s.textAlign,
        right: +td.getBoundingClientRect().right.toFixed(1),
      });
    }
    return out;
  });

  expect(cells.length, 'expected numeric cells in the table').toBeGreaterThan(5);
  for (const c of cells) {
    expect(c.variant, `"${c.text}" must be tabular`).toContain('tabular-nums');
    expect(c.align, `"${c.text}" must be right-aligned`).toBe('right');
  }

  // Mixed-width figures in one column must share a right edge exactly.
  const byColumn = new Map<number, string[]>();
  for (const c of cells) {
    const k = Math.round(c.right);
    byColumn.set(k, [...(byColumn.get(k) ?? []), c.text]);
  }
  const widest = [...byColumn.values()].sort((a, b) => b.length - a.length)[0];
  expect(widest.length, 'a figure column should share one right edge').toBeGreaterThan(3);
  expect(new Set(widest.map((t) => t.length)).size, 'column should contain mixed-width figures').toBeGreaterThan(1);

  // §8.6 — a negative takes U+2212. The column must hold one, or this checks nothing.
  const variance = cells.map((c) => c.text).filter((t) => t.endsWith('%'));
  expect(
    variance.some((t) => t.startsWith('−')),
    'the variance column should show a negative',
  ).toBe(true);
  expect(variance.filter((t) => t.startsWith('-'))).toEqual([]);
});

/**
 * The same edge, one row up: a figure column's label sits on its figures'
 * right edge. Until 2026-11-02 a sortable label stopped 12px short, because the
 * caret's reserved space sat between it and the cell's padding, while a
 * non-sortable label lined up exactly. The caret now takes the label's inner
 * side and still holds its space, so drawing it moves nothing and resizes
 * nothing. Read at rest, hovered and sorted, since each draws the caret
 * differently; the hover caret was dead from the first build, its `group-hover:`
 * looking for a `.group` that Button names `group/button`. Every label's top is
 * read too: `row-reverse` on an inline-flex button takes its baseline from the
 * caret, which lifted the label 1px above its neighbours with the edge correct.
 */
const readHeaders = (page: Page) =>
  page.evaluate(() => {
    const table = document.querySelector('#storybook-root table')!;
    const rows = Array.from(table.querySelectorAll('tbody tr[data-row-id]'));
    const textBox = (node: Node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    };
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap-icon-label'));
    const headers = Array.from(table.querySelectorAll('thead th')).map((th, i) => {
      const button = th.querySelector('button')!;
      const label = textBox(Array.from(button.childNodes).find((n) => n.nodeType === Node.TEXT_NODE)!);
      const caret = button.querySelector('svg')!;
      const caretBox = caret.getBoundingClientRect();
      return {
        name: th.textContent ?? '',
        numeric: getComputedStyle(th).textAlign === 'right',
        width: th.getBoundingClientRect().width,
        labelLeft: label.left,
        labelRight: label.right,
        labelTop: label.top,
        caretLeft: caretBox.left,
        caretRight: caretBox.right,
        caretOpacity: getComputedStyle(caret).opacity,
        figureRights: rows.map((row) => textBox(row.children[i]).right),
        cellLefts: rows.map((row) => textBox(row.children[i]).left),
      };
    });
    const scroller = table.parentElement!;
    return { gap, headers, overflow: scroller.scrollWidth - scroller.clientWidth };
  });

type Headers = Awaited<ReturnType<typeof readHeaders>>;

const expectLabelsOnTheirEdges = ({ gap, headers }: Headers, figureColumns: string[]) => {
  expect(headers.filter((h) => h.numeric).map((h) => h.name)).toEqual(figureColumns);
  for (const h of headers) {
    if (h.numeric) {
      for (const right of h.figureRights) expect(h.labelRight, `${h.name} over its figures`).toBeCloseTo(right, 1);
      expect(h.labelLeft - h.caretRight, `${h.name}'s caret on its inner side`).toBeCloseTo(gap, 1);
    } else {
      for (const left of h.cellLefts) expect(h.labelLeft, `${h.name} over its cells`).toBeCloseTo(left, 1);
      expect(h.caretLeft - h.labelRight, `${h.name}'s caret on its inner side`).toBeCloseTo(gap, 1);
    }
  }
  expect(new Set(headers.map((h) => h.labelTop)).size, 'every label on one line').toBe(1);
};

const expectNothingMoved = (now: Headers, before: Headers) => {
  for (const [i, h] of now.headers.entries()) {
    expect(h.labelRight, `${h.name}'s label moved`).toBeCloseTo(before.headers[i].labelRight, 1);
    expect(h.width, `${h.name}'s column resized`).toBeCloseTo(before.headers[i].width, 1);
  }
};

for (const theme of ['dark', 'light'] as const) {
  test(`a figure column's label shares its figures' right edge, and a caret moves nothing — ${theme}`, async ({
    page,
  }) => {
    const figureColumns = ['Rows', 'Duration', 'Variance'];
    const opacityOf = (read: Headers, name: string) => read.headers.find((h) => h.name === name)?.caretOpacity;

    await gotoStory(page, 'product-datatable--default', theme);
    await page.mouse.move(0, 0);
    const rest = await readHeaders(page);
    expectLabelsOnTheirEdges(rest, figureColumns);
    for (const h of rest.headers) expect(h.caretOpacity, `${h.name}'s caret at rest`).toBe('0');

    await page.getByRole('button', { name: 'Duration' }).hover();
    const hovered = await readHeaders(page);
    expect(opacityOf(hovered, 'Duration'), 'hover draws the caret').toBe('1');
    expect(opacityOf(hovered, 'Variance'), 'only on the hovered header').toBe('0');
    expectLabelsOnTheirEdges(hovered, figureColumns);
    expectNothingMoved(hovered, rest);

    await page.getByRole('button', { name: 'Rows' }).click();
    await page.mouse.move(0, 0);
    const sorted = await readHeaders(page);
    expect(opacityOf(sorted, 'Rows'), 'a sort draws the caret').toBe('1');
    expectLabelsOnTheirEdges(sorted, figureColumns);
    expectNothingMoved(sorted, rest);
  });
}

/**
 * `meta.figure` makes a figure column without setting `align`, so a header that
 * read `align` alone would draw this caret on the label's outer side.
 */
test('a sortable `figure` column takes the same edge, with the caret on its inner side', async ({ page }) => {
  await gotoStory(page, 'product-datatable--total-with-cents');
  await page.mouse.move(0, 0);
  const rest = await readHeaders(page);
  expectLabelsOnTheirEdges(rest, ['USD']);
  await page.getByRole('button', { name: 'USD' }).click();
  await page.mouse.move(0, 0);
  const sorted = await readHeaders(page);
  expectLabelsOnTheirEdges(sorted, ['USD']);
  expectNothingMoved(sorted, rest);
});

/**
 * Where the reservation earns its keep. Squeezed, a column can be as wide as its
 * header's content, so a caret that took no space until drawn would resize the
 * column it appears in. The figures hold their width there too, so the label
 * still has an edge to share.
 */
test('in a squeezed table, labels sit on their figures and a sort resizes no column', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 700 });
  await gotoStory(page, 'product-datatable--default');
  await page.mouse.move(0, 0);
  const rest = await readHeaders(page);
  expectLabelsOnTheirEdges(rest, ['Rows', 'Duration', 'Variance']);
  await page.getByRole('button', { name: 'Variance' }).click();
  await page.mouse.move(0, 0);
  // This table scrolls sideways at this width, and the click brought Variance into view.
  await page.locator('#storybook-root table').evaluate((table) => {
    table.parentElement!.scrollLeft = 0;
  });
  expectNothingMoved(await readHeaders(page), rest);
});

/**
 * A cell cuts only what an ellipsis can stand in for. `2,019,530` read `2,019…`
 * until 2026-11-03, which hides the magnitude, and `PROPOSED` read `PROPOS`, with
 * no ellipsis, because a badge is an atomic box. The row height is read too: a
 * figure that wrapped instead of clipping would fit its cell and break the
 * virtualizer.
 */
const readCells = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.load('400 13px "Source Sans 3 Variable"', '0');
    await document.fonts.load('500 10px "Source Sans 3 Variable"', 'A');
    await document.fonts.ready;
    const table = document.querySelector('#storybook-root table')!;
    const scroller = table.parentElement!;
    const rows = Array.from(table.querySelectorAll('tbody tr[data-row-id]'));
    const cells = rows.flatMap((row) => Array.from(row.children));
    const isCut = (td: Element) => td.scrollWidth > td.clientWidth;
    const isBadge = (td: Element) => td.querySelector(':scope > [data-slot="badge"]') !== null;
    // The cell's own class: the table's text inherits tabular figures everywhere.
    const isFigure = (td: Element) => td.classList.contains('tabular-nums');
    const read = (td: Element) => ({
      text: td.textContent ?? '',
      cut: isCut(td),
      whiteSpace: getComputedStyle(td).whiteSpace,
    });
    return {
      rowHeight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--h-row-sm')),
      rowHeights: [...new Set(rows.map((row) => row.getBoundingClientRect().height))],
      sideways: scroller.scrollWidth - scroller.clientWidth,
      figures: cells.filter(isFigure).map(read),
      badges: cells.filter(isBadge).map(read),
      // Text still gives way: a column that stopped truncating would pass the rest.
      textCut: cells.filter((td) => !isFigure(td) && !isBadge(td)).some(isCut),
    };
  });

// Figures at 420 and badges at 768, in the sized table; a `figure` column, which
// sets no `align`, with no total or reservation holding it open; and a table with
// no `size` at all, whose columns share out what's left.
const squeezedTables: [story: string, width: number][] = [
  ['product-datatable--default', 420],
  ['product-datatable--default', 768],
  ['product-datatable--squeezed', 1280],
  ['product-appbar--in-dashboard', 320],
];

for (const [story, width] of squeezedTables) {
  test(`a squeezed table cuts no figure and no badge — ${story} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await gotoStory(page, story);
    const cells = await readCells(page);
    expect(cells.figures.length, 'expected figures in the table').toBeGreaterThan(0);
    expect(cells.badges.length, 'expected badges in the table').toBeGreaterThan(0);
    for (const f of cells.figures) {
      expect(f.cut, `"${f.text}" is cut`).toBe(false);
      expect(f.whiteSpace, `"${f.text}" can wrap`).toBe('nowrap');
    }
    for (const b of cells.badges) expect(b.cut, `"${b.text}" is cut`).toBe(false);
    expect(cells.rowHeights, 'every row at --h-row-sm').toEqual([cells.rowHeight]);
  });
}

test('text gives way first, and past that the table scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await gotoStory(page, 'product-datatable--long-text');
  const cells = await readCells(page);
  expect(cells.textCut, 'a text cell stopped truncating').toBe(true);
  expect(cells.sideways, 'the table should scroll sideways').toBeGreaterThan(0);
  expect(cells.rowHeights, 'every row at --h-row-sm').toEqual([cells.rowHeight]);
});

/**
 * A text column's floor (owner, 2026-11-03). `max-w-0` let a column fall to its
 * header's width, so at 420 every row read `fct_g…` and scrolling sideways didn't
 * help. A cap lets text count toward its column up to 28ch: it follows the text
 * below that, and stops there. The figures must stay in the first view, which is
 * what a floor taken from `size` gave up: at 375 it showed no figure at all.
 */
const readTextColumns = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.load('400 11px "Source Code Pro Variable"', '0');
    await document.fonts.load('400 13px "Source Sans 3 Variable"', '0');
    await document.fonts.ready;
    const table = document.querySelector('#storybook-root table')!;
    const scroller = table.parentElement!;
    const rows = Array.from(table.querySelectorAll('tbody tr[data-row-id]'));
    const ths = Array.from(table.querySelectorAll('thead th'));
    return {
      view: scroller.getBoundingClientRect().right,
      sideways: scroller.scrollWidth - scroller.clientWidth,
      columns: ths.map((th, i) => {
        const cells = rows.map((row) => row.children[i]);
        const style = getComputedStyle(cells[0]);
        const zero = document.createElement('canvas').getContext('2d')!;
        zero.font = `${style.fontSize} ${style.fontFamily}`;
        const widest = Math.max(
          ...cells.map((td) => {
            const range = document.createRange();
            range.selectNodeContents(td);
            return range.getBoundingClientRect().width;
          }),
        );
        return {
          name: th.textContent ?? '',
          width: th.getBoundingClientRect().width,
          right: th.getBoundingClientRect().right,
          floor: 28 * zero.measureText('0').width,
          padding: parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),
          widest,
          cut: cells.filter((td) => td.scrollWidth > td.clientWidth).length,
          text: cells.map((td) => td.textContent ?? ''),
        };
      }),
    };
  });

for (const width of [375, 420]) {
  test(`a squeezed text column keeps its text, and the first figures stay in view — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await gotoStory(page, 'product-datatable--default');
    const { columns, sideways, view } = await readTextColumns(page);
    const [model, , rows, , , owner] = columns;

    expect(model.cut, 'no identifier is cut').toBe(0);
    expect(new Set(model.text).size, 'every row can be told apart').toBe(model.text.length);
    expect(owner.cut, 'no owner is cut').toBe(0);
    // Each column follows its own text, so a short one doesn't pay for the floor.
    expect(model.width).toBeCloseTo(model.widest + model.padding, 0);
    expect(owner.width).toBeLessThan(model.width);
    expect(rows.right, 'the first figure column is in the first view').toBeLessThanOrEqual(view);
    expect(sideways, 'and the rest scroll sideways').toBeGreaterThan(0);
  });
}

test('a text column stops at 28ch when squeezed, and a size wins where there is room', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await gotoStory(page, 'product-datatable--long-text');
  const squeezed = await readTextColumns(page);
  const [model, note] = squeezed.columns;
  expect(model.width, 'Model at its floor').toBeCloseTo(model.floor, 0);
  expect(note.width, 'Note at its floor').toBeCloseTo(note.floor, 0);
  expect(model.cut, 'long names are cut there').toBeGreaterThan(0);

  await page.setViewportSize({ width: 1280, height: 800 });
  const wide = await readTextColumns(page);
  // At least: a sized column takes a share of spare width too.
  expect(wide.columns[0].width, 'the cap does not hold a sized column down').toBeGreaterThanOrEqual(260);
  expect(wide.sideways).toBe(0);
});

/**
 * A windowed table renders only some rows, so its text can't set the floor from the
 * cells: a column would move as rows scroll in, and the columns beside it would too.
 * The header reserves it from every row, and it has to land where the cells' cap does.
 */
test('a windowed table holds the same floor, and no text column moves as it scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await gotoStory(page, 'product-datatable--long-text');
  const rendered = (await readTextColumns(page)).columns.map((column) => column.width);

  await gotoStory(page, 'product-datatable--long-text-virtualized');
  const windowed = (await readTextColumns(page)).columns.map((column) => column.width);
  expect(windowed[0], 'Model').toBeCloseTo(rendered[0], 0);
  expect(windowed[1], 'Note').toBeCloseTo(rendered[1], 0);
  // The reservation errs wide, so no story's text reaches past it. A `cell` that
  // shows more than its value would, so what stops that has to be asserted itself.
  const cellCap = await longCell(page, 0, 0).evaluate((td) => getComputedStyle(td).maxWidth);
  expect(cellCap, 'its cells count for nothing').toBe('0px');

  for (const width of [420, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    const before = (await readTextColumns(page)).columns.map((column) => column.width);
    for (const row of [25000, 49990]) {
      await page.locator('#storybook-root table').evaluate((table, top) => {
        table.parentElement!.scrollTop = top;
      }, row * 28);
      await expect(page.locator(`#storybook-root tbody tr[data-row-id="${row}"]`)).toBeVisible();
      expect((await readTextColumns(page)).columns.map((column) => column.width)).toEqual(before);
    }
    await page.locator('#storybook-root table').evaluate((table) => {
      table.parentElement!.scrollTop = 0;
    });
    await expect(page.locator('#storybook-root tbody tr[data-row-id="0"]')).toBeVisible();
  }
});

/**
 * What a cell cut can be read. The tooltip repeats text from the DOM, and it opens
 * only on a cell that has cut something: Base UI's hover, delay and grouping, with
 * the table cancelling it. Nothing joins the cell, because an element there is what
 * breaks a copied row into lines.
 */
const tooltip = (page: Page) => page.locator('[data-slot="tooltip-content"]');
const longCell = (page: Page, row: number, column: number) =>
  page.locator(`#storybook-root tbody tr[data-row-id="${row}"] td`).nth(column);

test('a pointer resting on a cut cell reads all of it, and adds nothing to the cell', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await gotoStory(page, 'product-datatable--long-text');
  const cut = longCell(page, 0, 0);
  await expect(cut.evaluate((td) => td.childElementCount)).resolves.toBe(0);

  await cut.hover();
  await expect(tooltip(page)).toHaveText('int_finance__gl_entries_by_cost_center_and_period_0');
  const [cell, tip] = await Promise.all([cut.boundingBox(), tooltip(page).boundingBox()]);
  expect(tip!.x, 'starts at the cell').toBeCloseTo(cell!.x, 0);

  // A cell beside it fits: the open tooltip goes, and none takes its place.
  await longCell(page, 1, 0).hover();
  await expect(tooltip(page)).toBeHidden();
  await longCell(page, 2, 0).hover();
  await expect(tooltip(page)).toHaveText('int_finance__fx_rates_daily_by_currency_pair_2');
  // A figure is never cut, and isn't a trigger at all.
  await longCell(page, 2, 2).hover();
  await expect(tooltip(page)).toBeHidden();
});

test('a table that cuts nothing shows no tooltip and takes no stop', async ({ page }) => {
  await gotoStory(page, 'product-datatable--default');
  await longCell(page, 1, 0).hover();
  // Longer than the delay: the assertion is about something that must not open.
  await page.waitForTimeout(500);
  await expect(tooltip(page)).toBeHidden();
  await expect(page.locator('#storybook-root td[tabindex]')).toHaveCount(0);
});

/**
 * The keyboard's way in, since a `<td>` is not a control. One stop, not one per cut
 * cell: that would never end in a windowed table, where 400 presses of Tab reached
 * row 224. Presses are counted, and both stories have to give the same count.
 */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement!;
    return { tag: el.tagName, text: el.textContent ?? '', row: el.closest('tr')?.dataset.rowId ?? null };
  });

for (const story of ['long-text', 'long-text-virtualized']) {
  test(`a table takes one stop for what it cut, and the arrows move it — ${story}`, async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 800 });
    await gotoStory(page, `product-datatable--${story}`);
    await expect(page.locator('#storybook-root td[tabindex]')).toHaveCount(1);

    const stops: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const { tag } = await focused(page);
      if (tag === 'BODY') break;
      stops.push(tag);
    }
    expect(stops, 'three sort buttons and one cell').toEqual(['BUTTON', 'BUTTON', 'BUTTON', 'TD']);

    await page.keyboard.press('Shift+Tab');
    expect((await focused(page)).tag, 'Shift+Tab finds it again').toBe('TD');
    await expect(tooltip(page)).toHaveText('int_finance__gl_entries_by_cost_center_and_period_0');

    // Down skips a cell that fits; right moves to the next cut cell in the row.
    await page.keyboard.press('ArrowDown');
    expect((await focused(page)).row).toBe('2');
    await expect(tooltip(page)).toHaveText('int_finance__fx_rates_daily_by_currency_pair_2');
    await page.keyboard.press('ArrowRight');
    expect((await focused(page)).text).toContain('Waiting on the controller');
    await page.keyboard.press('ArrowLeft');
    expect((await focused(page)).row).toBe('2');

    // Escape closes the tooltip and keeps your place. Tab leaves the table.
    await page.keyboard.press('Escape');
    await expect(tooltip(page)).toBeHidden();
    expect((await focused(page)).row).toBe('2');
    await page.keyboard.press('Tab');
    expect((await focused(page)).tag).toBe('BODY');
    await expect(page.locator('#storybook-root td[tabindex]')).toHaveCount(1);
  });
}

test('the arrows carry on past what is rendered, and a cell never lands under the header', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await gotoStory(page, 'product-datatable--long-text-virtualized');
  await longCell(page, 0, 0).evaluate((td: HTMLElement) => td.focus({ focusVisible: true } as FocusOptions));
  for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowDown');
  const far = await focused(page);
  expect(far.tag).toBe('TD');
  expect(Number(far.row), 'past the first window').toBeGreaterThan(40);
  await expect(page.locator('#storybook-root td[tabindex]')).toHaveCount(1);
  await expect(tooltip(page)).toHaveText(far.text);

  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowUp');
  const { cellTop, headerBottom, height } = await page.evaluate(() => ({
    cellTop: document.activeElement!.getBoundingClientRect().top,
    headerBottom: document.querySelector('#storybook-root thead')!.getBoundingClientRect().bottom,
    height: document.querySelector<HTMLElement>('#storybook-root table')!.parentElement!.scrollHeight,
  }));
  expect(cellTop, 'the sticky header covers no part of it').toBeGreaterThanOrEqual(headerBottom - 0.5);
  expect(height, 'and the row height held').toBe(50_000 * 28 + 28);
});

test('the stop follows the scroll, so Tab does not jump back to a row out of view', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await gotoStory(page, 'product-datatable--long-text');
  await page.locator('#storybook-root table').evaluate((table) => {
    table.parentElement!.scrollTop = 280;
  });
  await page.getByRole('button', { name: 'Rows' }).focus();
  // It moves on `scrollend`, which a loaded machine can take a while to fire.
  await expect
    .poll(() => page.locator('#storybook-root td[tabindex]').evaluate((td) => Number(td.closest('tr')!.dataset.rowId)))
    .toBeGreaterThan(5);
  await page.keyboard.press('Tab');
  const { row, top, viewTop } = await page.evaluate(() => ({
    row: document.activeElement!.closest('tr')?.dataset.rowId,
    top: document.activeElement!.getBoundingClientRect().top,
    viewTop: document.querySelector('#storybook-root table')!.parentElement!.getBoundingClientRect().top,
  }));
  expect(Number(row), 'a row on screen, not the first').toBeGreaterThan(5);
  expect(top).toBeGreaterThan(viewTop);
});

for (const theme of ['dark', 'light'] as const) {
  test(`the stop's ring paints inside the cell, and its text is still all there — ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 800 });
    await gotoStory(page, 'product-datatable--long-text', theme);
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    const ring = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement!);
      const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return {
        style: s.outlineStyle,
        width: s.outlineWidth,
        offset: s.outlineOffset,
        ringWidth: token('--ring-width'),
      };
    });
    expect(ring.style, 'outline-none would leave this "none"').toBe('solid');
    expect(ring.width).toBe(ring.ringWidth);
    expect(ring.offset, 'inset, since the cell clips').toBe(`-${ring.ringWidth}`);
    await expect(page.locator('#storybook-root td[tabindex]')).toHaveText(
      'int_finance__gl_entries_by_cost_center_and_period_0',
    );
  });
}

test('a focused cut cell passes the rules axe skips unless asked', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await gotoStory(page, 'product-datatable--long-text');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  await injectAxe(page);
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: 'rule', values: ['focus-order-semantics', 'scrollable-region-focusable', 'tabindex'] },
    });
    return result.violations.flatMap((v) => v.nodes.map((n) => n.target.join(' ')));
  });
  expect(violations).toEqual([]);
});

/**
 * A cell with a control takes no stop: its control is already the way in, and the
 * cut lives on the control. Seeded, because at 28ch nothing in the story is cut.
 */
test('a control in a cell opens the tooltip when focused, and adds no stop', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 800 });
  await gotoStory(page, 'product-datatable--clickable-rows');
  const long = 'int_finance__gl_entries_by_cost_center_and_period_1';
  const button = page.getByRole('button', { name: 'dim_accounts_1' });
  await button.evaluate((el, text) => {
    el.textContent = text;
  }, long);
  await page.getByRole('button', { name: long }).focus();
  await expect(page.locator('#storybook-root td[tabindex]')).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(tooltip(page)).toHaveText(long);
});

/**
 * A figure column last in the table has no neighbour to overhang: a caret past
 * its cell's edge would make the whole table scroll sideways.
 */
test('a figure column at the table edge lines up without a sideways scroll', async ({ page }) => {
  await gotoStory(page, 'product-appbar--in-dashboard');
  await page.mouse.move(0, 0);
  await page.getByRole('button', { name: 'Duration' }).click();
  await page.mouse.move(0, 0);
  const sorted = await readHeaders(page);
  expect(sorted.headers.at(-1)?.name).toBe('Duration');
  expectLabelsOnTheirEdges(sorted, ['Rows', 'Duration']);
  expect(sorted.overflow, 'the table scrolls sideways').toBe(0);
});

/**
 * §8.2 / §8.3 — the serif belongs to the metric tier (--font-display) and to
 * h1–h6 (--font-heading), and nothing else. Detected by the computed family,
 * since the display tier no longer carries a variation setting. Each story
 * must also show the serif somewhere it belongs, or a stack that silently
 * fell back to the sans would pass with nothing to check.
 */
test('the serif appears only at the metric tier and in headings', async ({ page }) => {
  const stories: [string, boolean][] = [
    ['product-metrictile--sizes', true],
    ['product-appshell--expanded', true],
    ['product-datatable--default', false],
    ['foundational-button--variants', false],
  ];
  for (const [id, expectSerif] of stories) {
    await gotoStory(page, id);
    const { offenders, serifCount } = await page.evaluate(() => {
      const bad: string[] = [];
      let count = 0;
      // The story root only: Storybook's own (hidden) error page has an <h1>.
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('#storybook-root *'))) {
        if (el.children.length > 0 || !el.textContent?.trim()) continue; // leaf nodes carry the text
        const s = getComputedStyle(el);
        if (!s.fontFamily.startsWith('"Source Serif 4 Variable"')) continue;
        count++;
        const size = parseFloat(s.fontSize);
        if (size < 24 && !el.closest('h1, h2, h3, h4, h5, h6')) bad.push(`${size}px: ${el.textContent.slice(0, 20)}`);
      }
      return { offenders: bad, serifCount: count };
    });
    expect(offenders, `serif outside the metric tier and headings in ${id}`).toEqual([]);
    if (expectSerif) expect(serifCount, `no serif text rendered in ${id}`).toBeGreaterThan(0);
  }
});

/**
 * §8.3 / §8.4 — every family loads under its `Variable` name, roman and
 * italic, and Source Serif 4's files carry the opsz axis. Two silent
 * failures this guards: a stack naming only the plain family falls back to
 * the system face, and the package's default entry point ships wght-only
 * files, which leaves font-optical-sizing with nothing to drive. Both render
 * without an error.
 */
test('fonts load under their Variable names, and the serif carries opsz', async ({ page }) => {
  await gotoStory(page, 'product-metrictile--sizes');
  const result = await page.evaluate(async () => {
    const families = ['Source Sans 3 Variable', 'Source Serif 4 Variable', 'Source Code Pro Variable'];
    for (const f of families) {
      await document.fonts.load(`16px "${f}"`, 'a');
      await document.fonts.load(`italic 16px "${f}"`, 'a');
    }
    const loaded = Array.from(document.fonts)
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family.replace(/"/g, '')} ${f.style}`);
    const width = (opsz: number) => {
      const s = document.createElement('span');
      s.textContent = 'Hamburgefonstiv';
      s.style.cssText = `position:absolute;white-space:pre;font:600 32px "Source Serif 4 Variable";font-variation-settings:'opsz' ${opsz}`;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return w;
    };
    return {
      loaded: [...new Set(loaded)],
      body: getComputedStyle(document.body).fontFamily,
      opszSmall: width(8),
      opszLarge: width(60),
    };
  });
  for (const f of ['Source Sans 3 Variable', 'Source Serif 4 Variable', 'Source Code Pro Variable']) {
    expect(result.loaded, `${f} roman`).toContain(`${f} normal`);
    expect(result.loaded, `${f} italic`).toContain(`${f} italic`);
  }
  expect(result.body.startsWith('"Source Sans 3 Variable"'), result.body).toBe(true);
  // 288 against 232px when the axis is present; equal when it is not.
  expect(result.opszSmall - result.opszLarge, 'opsz 8 and 60 render the same width').toBeGreaterThan(20);
});

/**
 * §7.7 — status badges are not pills. Down a status column, square badges form
 * a clean vertical left edge; full-radius pills scallop it.
 */
test('status badges keep --radius-xs down a column', async ({ page }) => {
  await gotoStory(page, 'foundational-badge--status-column');
  const radii = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-slot="badge"]')).map((b) => getComputedStyle(b).borderTopLeftRadius),
  );
  expect(radii.length).toBeGreaterThan(3);
  for (const r of radii) expect(r, 'status badge must be --radius-xs (0px since 2026-10-16)').toBe('0px');
});

/**
 * §7.3 "Frame tier": only `size="page"` spends --pad-frame-empty. The other
 * sizes keep 16px; they borrowed --gap-section until it rose to 32px, and a
 * regression there would silently double every empty state in a panel.
 */
test('EmptyState takes frame air only at size="page"', async ({ page }) => {
  const padding = async (story: string) => {
    await gotoStory(page, story);
    return page
      .locator('[data-slot="empty-state"]')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { top: cs.paddingTop, bottom: cs.paddingBottom, left: cs.paddingLeft };
      });
  };
  expect(await padding('product-emptystate--page')).toEqual({ top: '64px', bottom: '64px', left: '16px' });
  expect(await padding('product-emptystate--default')).toEqual({ top: '16px', bottom: '16px', left: '16px' });
  expect(await padding('product-emptystate--small')).toEqual({ top: '16px', bottom: '16px', left: '16px' });
});

/**
 * §7.4 --pad-popup-list and the 24px label row. Boxes, not glyphs: every box
 * edge inside a popup lands on the 4px grid, measured from the inside of the
 * border. Before 2026-10-08 the inset was 2px and the label row 18px, so the
 * group label sat nearer the border than its own rows.
 */
test('popup rows sit on the 4px grid under a 24px label row', async ({ page }) => {
  await gotoStory(page, 'foundational-menu--rich');
  await page.getByRole('button', { name: 'Model actions' }).click();
  const popup = page.locator('[data-slot="menu-content"]');
  await expect(popup).toBeVisible();
  // Polled: the popup animates in, and its rows move with it.
  await expect.poll(() => popup.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');

  const g = await popup.evaluate((el) => {
    const top = el.getBoundingClientRect().top + parseFloat(getComputedStyle(el).borderTopWidth);
    const rows = Array.from(
      el.querySelectorAll('[data-slot="menu-label"], [role="menuitem"], [data-slot="menu-separator"]'),
    ).map((r) => {
      const b = r.getBoundingClientRect();
      return {
        slot: (r as HTMLElement).dataset.slot ?? r.getAttribute('role'),
        top: b.top - top,
        bottom: b.bottom - top,
      };
    });
    return { padding: getComputedStyle(el).padding, rows };
  });

  expect(g.padding).toBe('4px');
  const [label, first, second, separator, after] = g.rows;
  expect(label).toMatchObject({ slot: 'menu-label', top: 4, bottom: 28 });
  expect(first).toMatchObject({ top: 28, bottom: 56 });
  expect(second).toMatchObject({ top: 56, bottom: 84 });
  // 4px either side of the 1px rule, the same inset as the popup's edge.
  expect(separator.top - second.bottom).toBe(4);
  expect(after.top - separator.bottom).toBe(4);
});

/**
 * §5 — an agent-proposed row carries the rail AgentBlock draws: 2px of solid
 * --color-text-agent. Checked where it paints, in all three components that
 * apply runStatusRowTreatment, because each fails differently. A div row's
 * border takes 2px of its width, so its content drifted 2px right of its
 * neighbours. A DataTable row drew nothing: a border-separate table paints no
 * border on a <tr>, though the <tr>'s computed style still read 2px. So the
 * rail is asserted on the element that paints it, and the content's x
 * against a plain row's.
 */
const railCases = [
  {
    story: 'product-runlogrow--run-log',
    rows: '#storybook-root div[data-status]:not([data-slot])',
  },
  {
    story: 'product-datatable--default',
    rows: 'tbody tr[data-row-id]',
  },
  {
    story: 'product-attachmentrow--in-agent-block',
    rows: '[data-slot="attachment-row"]',
  },
];

for (const theme of ['dark', 'light'] as const) {
  for (const c of railCases) {
    test(`an agent-proposed row draws the solid agent rail, content in line — ${c.story} · ${theme}`, async ({
      page,
    }) => {
      await gotoStory(page, c.story, theme);
      const result = await page.evaluate((c) => {
        const agentColor = (() => {
          const probe = document.createElement('div');
          probe.style.color = 'var(--color-text-agent)';
          document.body.append(probe);
          const value = getComputedStyle(probe).color;
          probe.remove();
          return value;
        })();
        const rows = Array.from(document.querySelectorAll<HTMLElement>(c.rows)).filter((r) => r.offsetHeight > 0);
        // Where the row's content starts: a table cell's text, or a div row's
        // first child (RunLogRow's caret, AttachmentRow's file glyph).
        const textX = (row: HTMLElement) => {
          const td = row.querySelector('td');
          if (td) {
            const range = document.createRange();
            range.selectNodeContents(td);
            return range.getBoundingClientRect().left - row.getBoundingClientRect().left;
          }
          return row.firstElementChild!.getBoundingClientRect().left - row.getBoundingClientRect().left;
        };
        const agent = rows.find((r) => r.className.includes('bg-bg-agent'))!;
        const plain = rows.find((r) => !r.className.includes('bg-bg-'));
        const railEl = c.story.includes('datatable') ? agent.querySelector('td')! : agent;
        const s = getComputedStyle(railEl);
        return {
          width: s.borderLeftWidth,
          style: s.borderLeftStyle,
          color: s.borderLeftColor,
          agentColor,
          agentX: textX(agent),
          plainX: plain ? textX(plain) : null,
          padCellX: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad-cell-x')),
        };
      }, c);
      expect(result.width).toBe('2px');
      expect(result.style).toBe('solid');
      expect(result.color).toBe(result.agentColor);
      // In line with a plain row; AttachmentRow's story has none, so against
      // the padding a plain row would have.
      expect(result.agentX).toBeCloseTo(result.plainX ?? result.padCellX, 1);
    });
  }
}

/**
 * §5 — in forced colours a failed row, whose state is shown by its tint
 * alone, draws a 1px outline inside itself, because forced colours remove the
 * tint. Checked in all three components that apply runStatusRowTreatment, as
 * the rail is above: the outline is asserted computed, and painted (the row's
 * screenshot changes when it is taken away), because a <tr>'s computed
 * border once read 2px and painted nothing. An outline takes no width, so the
 * content keeps a plain row's x, and a plain row draws none.
 */
const edgeCases = [
  { story: 'product-runlogrow--run-log', rows: '#storybook-root div[data-status]:not([data-slot])' },
  { story: 'product-datatable--default', rows: 'tbody tr[data-row-id]' },
  { story: 'product-attachmentrow--states', rows: '[data-slot="attachment-row"]' },
];

for (const c of edgeCases) {
  test(`in forced colours, a failed row draws a painted 1px edge, content in line — ${c.story}`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, c.story);
    await page.mouse.move(0, 0);
    const result = await page.evaluate((c) => {
      const rows = Array.from(document.querySelectorAll<HTMLElement>(c.rows)).filter((r) => r.offsetHeight > 0);
      const textX = (row: HTMLElement) => {
        const td = row.querySelector('td');
        if (td) {
          const range = document.createRange();
          range.selectNodeContents(td);
          return range.getBoundingClientRect().left - row.getBoundingClientRect().left;
        }
        return row.firstElementChild!.getBoundingClientRect().left - row.getBoundingClientRect().left;
      };
      const outline = (el: HTMLElement) => {
        const s = getComputedStyle(el);
        // Chrome reports the `medium` width when the style is `none`.
        return s.outlineStyle === 'none'
          ? null
          : { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset };
      };
      // A tint is an unprefixed bg-bg-* class: every row also has hover:bg-bg-hover.
      const tint = (r: HTMLElement) => Array.from(r.classList).find((k) => k.startsWith('bg-bg-'));
      const failed = rows.find((r) => tint(r) === 'bg-bg-danger')!;
      const plain = rows.find((r) => !tint(r))!;
      failed.dataset.probe = 'failed';
      return {
        failed: outline(failed),
        plain: outline(plain),
        failedX: textX(failed),
        plainX: textX(plain),
      };
    }, c);

    expect(result.failed).toEqual({ style: 'solid', width: '1px', offset: '-1px' });
    expect(result.plain).toBeNull();
    expect(result.failedX).toBeCloseTo(result.plainX, 1);

    const row = page.locator('[data-probe="failed"]');
    const withEdge = await row.screenshot();
    await row.evaluate((el) => el.style.setProperty('outline-style', 'none', 'important'));
    const withoutEdge = await row.screenshot();
    expect(withEdge.equals(withoutEdge), 'the edge paints').toBe(false);
  });
}
