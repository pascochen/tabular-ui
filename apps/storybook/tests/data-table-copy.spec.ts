import { expect, test, type Page } from '@playwright/test';

import { gotoStory } from './helpers';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/**
 * §8.6 — a negative takes U+2212 on screen and a hyphen on the clipboard, and a
 * double-click in a numeric cell takes the whole figure. These read the
 * clipboard, because the page shows the right figure either way.
 *
 * Every selector is scoped to the story root. Storybook's hidden docs skeleton
 * holds a table of its own, and a bare `tbody` finds that one first: a selection
 * inside it copies nothing.
 */
const MINUS = '−';
const BODY = '#storybook-root tbody';

/** Presses the real shortcut and reads every flavour on the clipboard. */
async function copy(page: Page) {
  await page.evaluate(() => navigator.clipboard.writeText('NOTHING COPIED'));
  await page.keyboard.press('ControlOrMeta+c');
  return page.evaluate(async () => {
    const flavours: Record<string, string> = {};
    for (const item of await navigator.clipboard.read()) {
      for (const type of item.types) flavours[type] = await (await item.getType(type)).text();
    }
    return flavours;
  });
}

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
