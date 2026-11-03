import { expect, test, type Page } from '@playwright/test';

import { copy, gotoStory } from './helpers';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/**
 * §8.6 — a negative takes U+2212 on screen and a hyphen on the clipboard, and a
 * double-click in a numeric cell takes the whole figure. §4 — a row's identifier
 * stays in a copy of the row. These read the clipboard, because the page looks
 * right either way.
 *
 * Every selector is scoped to the story root. Storybook's hidden docs skeleton
 * holds a table of its own, and a bare `tbody` finds that one first: a selection
 * inside it copies nothing.
 */
const MINUS = '−';
const BODY = '#storybook-root tbody';

/** Selects rows `from` to `to` of the body, whole cells, as a drag would. */
const selectRows = (page: Page, from: number, to: number) =>
  page.evaluate(
    ([body, a, b]) => {
      const rows = document.querySelector(body as string)!.querySelectorAll('tr');
      const range = document.createRange();
      range.setStartBefore(rows[a as number].cells[0]);
      range.setEndAfter(rows[b as number].cells[rows[b as number].cells.length - 1]);
      const selection = getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    },
    [BODY, from, to],
  );

/** The body as tab-separated text, read from the cells rather than the selection. */
const cellText = (page: Page) =>
  page.evaluate(
    (body) =>
      [...document.querySelector(body)!.querySelectorAll('tr')].map((tr) =>
        [...tr.cells].map((td) => td.textContent ?? ''),
      ),
    BODY,
  );

test('a copied selection carries a hyphen, and the screen keeps the minus', async ({ page }) => {
  await gotoStory(page, 'product-datatable--default');
  const rows = await cellText(page);
  const negatives = rows.flat().filter((text) => text.startsWith(MINUS)).length;
  expect(negatives, 'the story must show a negative, or this checks nothing').toBeGreaterThan(0);

  const selected = await selectRows(page, 0, rows.length - 1);
  const clipboard = await copy(page);

  // Excel takes HTML first when it is offered, so no flavour may hold the minus.
  for (const [type, text] of Object.entries(clipboard)) expect(text, type).not.toContain(MINUS);

  // Rows and columns intact, and only the sign changed. `toString()` applies
  // `text-transform`, so a StatusBadge's case is not part of this comparison, and
  // a range that ends after a row's last cell adds a line break.
  const expected = rows.map((row) => row.map((text) => text.replaceAll(MINUS, '-')).join('\t')).join('\n');
  expect(clipboard['text/plain'].trimEnd().toLowerCase()).toBe(expected.toLowerCase());
  expect(clipboard['text/plain'].match(/(^|\t)-\d/gm)).toHaveLength(negatives);

  // The screen and the selection the person is looking at stay as they were.
  expect(await page.evaluate(() => getSelection()!.toString())).toBe(selected);
  expect((await cellText(page)).flat().filter((text) => text.startsWith(MINUS))).toHaveLength(negatives);
});

test('select-all from inside the table carries a hyphen too', async ({ page }) => {
  await gotoStory(page, 'product-datatable--default');
  await page.locator(`${BODY} td`).first().click();
  await page.keyboard.press('ControlOrMeta+a');
  const clipboard = await copy(page);
  expect(clipboard['text/plain']).toContain('\t-');
  for (const [type, text] of Object.entries(clipboard)) expect(text, type).not.toContain(MINUS);
});

test('a selection with no minus keeps the browser’s own copy', async ({ page }) => {
  await gotoStory(page, 'product-datatable--default');
  const rows = await cellText(page);
  const positive = rows.findIndex((row) => !row.join('').includes(MINUS));
  expect(positive).toBeGreaterThanOrEqual(0);

  await selectRows(page, positive, positive);
  const clipboard = await copy(page);
  expect(clipboard['text/html'], 'a rich-text paste still gets its table').toBeTruthy();
  expect(clipboard['text/plain']).toContain(rows[positive][0]);
});

test('a double-click takes the whole figure, wherever it lands', async ({ page }) => {
  await gotoStory(page, 'product-datatable--signed-figures');
  const figure = page.locator(`${BODY} tr`).first().locator('td').last();
  const text = await figure.textContent();
  expect(text).toBe(`${MINUS}¥41,415,809`);

  // The cell is right-aligned, so measure the text, not the cell.
  const box = await figure.evaluate((td) => {
    const range = document.createRange();
    range.selectNodeContents(td);
    const { x, y, width, height } = range.getBoundingClientRect();
    return { x, y, width, height };
  });

  // On the sign, the symbol, the first group, the last group: a browser's own
  // double-click gives a different fragment on each, and never the sign.
  for (const at of [0.03, 0.12, 0.4, 0.95]) {
    await page.mouse.click(1, 1);
    await page.mouse.dblclick(box.x + box.width * at, box.y + box.height / 2);
    expect(await page.evaluate(() => getSelection()!.toString()), `at ${at} of the figure`).toBe(text);
  }
  expect((await copy(page))['text/plain']).toBe(`-¥41,415,809`);
});

test('a double-click in a text cell still selects a word', async ({ page }) => {
  await gotoStory(page, 'product-datatable--signed-figures');
  const label = page.locator(`${BODY} tr`).first().locator('td').first();
  expect(await label.textContent()).toContain(' ');
  await label.dblclick({ position: { x: 24, y: 14 } });
  expect((await page.evaluate(() => getSelection()!.toString())).trim()).toMatch(/^\S+$/);
});

test('a field in a numeric cell keeps its double-click and what was typed', async ({ page }) => {
  await gotoStory(page, 'product-datatable--default');
  const cell = page.locator(`${BODY} tr`).first().locator('td').nth(2);
  // No story puts a field in a figure column, and none should have to: this is
  // the guard, not a pattern. Events still bubble to the table's handlers.
  await cell.evaluate((td, value) => {
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'Typed figure');
    input.value = value;
    td.replaceChildren(input);
  }, `${MINUS}412.00`);

  const input = cell.getByRole('textbox');
  await input.dblclick();
  const inside = await input.evaluate((el: HTMLInputElement) => ({
    focused: document.activeElement === el,
    selected: el.selectionEnd! - el.selectionStart!,
  }));
  expect(inside.focused).toBe(true);
  expect(inside.selected).toBeGreaterThan(0);

  await page.keyboard.press('ControlOrMeta+a');
  expect((await copy(page))['text/plain']).toBe(`${MINUS}412.00`);
});

test.describe('an identifier in a copied row', () => {
  const status = (page: Page) => page.locator('#storybook-root [role=status]');
  const identifier = (page: Page, name: string) => page.locator(BODY).getByRole('button', { name });

  /** The story's play function ends on this, and a click in it would clear a selection. */
  async function gotoClickableRows(page: Page) {
    await gotoStory(page, 'product-datatable--clickable-rows');
    await expect(status(page)).toHaveText('Opened stg_sap_bkpf_2');
  }

  /** One line per row, one cell per column, and the row's own name first. */
  function expectRows(copied: string, rows: string[][]) {
    const lines = copied.trimEnd().split('\n');
    expect(lines, copied).toHaveLength(rows.length);
    lines.forEach((line, i) => {
      const cells = line.split('\t');
      expect(cells, line).toHaveLength(rows[i].length);
      expect(cells[0]).toBe(rows[i][0]);
    });
  }

  test('every row keeps its name, on one line', async ({ page }) => {
    await gotoClickableRows(page);
    const rows = await cellText(page);
    await selectRows(page, 0, rows.length - 1);
    expectRows((await copy(page))['text/plain'], rows);
  });

  test('a row with no minus keeps its name in both flavours', async ({ page }) => {
    await gotoClickableRows(page);
    const rows = await cellText(page);
    const positive = rows.findIndex((row) => !row.join('').includes(MINUS));
    expect(positive).toBeGreaterThanOrEqual(0);

    await selectRows(page, positive, positive);
    const clipboard = await copy(page);
    expectRows(clipboard['text/plain'], [rows[positive]]);
    expect(clipboard['text/html']).toContain(rows[positive][0]);
  });

  test('a drag from the first cell’s padding takes the names with it', async ({ page }) => {
    await gotoClickableRows(page);
    const rows = (await cellText(page)).slice(0, 3);
    const cell = (r: number, c: number) => page.locator(`${BODY} tr`).nth(r).locator('td').nth(c);
    const from = (await cell(0, 0).boundingBox())!;
    const to = (await cell(2, rows[2].length - 1).boundingBox())!;

    await page.mouse.move(from.x + 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width - 4, to.y + to.height / 2, { steps: 10 });
    await page.mouse.up();

    expectRows((await copy(page))['text/plain'], rows);
  });

  test('a name cut off on screen copies whole, and still draws its ellipsis', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 800 });
    await gotoClickableRows(page);
    const box = await identifier(page, 'int_fx_rates_daily_3').evaluate((el) => ({
      overflows: el.scrollWidth > el.clientWidth,
      textOverflow: getComputedStyle(el).textOverflow,
    }));
    expect(box).toEqual({ overflows: true, textOverflow: 'ellipsis' });

    const rows = await cellText(page);
    await selectRows(page, 0, rows.length - 1);
    expect((await copy(page))['text/plain']).toContain('int_fx_rates_daily_3\t');
  });

  test('sort headers stay out of a copy', async ({ page }) => {
    await gotoClickableRows(page);
    const rows = await cellText(page);
    await page.evaluate(() => {
      const selection = getSelection()!;
      selection.removeAllRanges();
      selection.selectAllChildren(document.querySelector('#storybook-root table')!);
    });
    const copied = (await copy(page))['text/plain'];
    expect(copied).not.toMatch(/model|status|duration|variance|owner/i);
    expectRows(copied.trimStart(), rows);
  });

  test('it is still a button, to the pointer and the keyboard', async ({ page }) => {
    await gotoClickableRows(page);
    const selected = () => page.evaluate(() => getSelection()!.toString());

    const clicked = identifier(page, 'fct_ap_aging_4');
    await clicked.click();
    await expect(status(page)).toHaveText('Opened fct_ap_aging_4');
    await expect(clicked).toBeFocused();
    expect(await clicked.evaluate((el) => el.matches(':focus-visible')), 'no ring on a mouse click').toBe(false);

    // A drag or a double-click on it selects nothing, as they did under `select-none`.
    const box = (await clicked.boundingBox())!;
    await page.mouse.move(box.x + 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(await selected()).toBe('');
    await page.mouse.dblclick(box.x + 6, box.y + box.height / 2);
    expect(await selected()).toBe('');

    const entered = identifier(page, 'dim_accounts_1');
    await entered.focus();
    await page.keyboard.press('Enter');
    await expect(status(page)).toHaveText('Opened dim_accounts_1');
    await expect(entered, 'an open leaves focus where it was').toBeFocused();

    const spaced = identifier(page, 'int_accounts_7');
    await spaced.focus();
    await page.keyboard.press('Space');
    await expect(status(page)).toHaveText('Opened int_accounts_7');
    await expect(spaced).toBeFocused();
  });
});
