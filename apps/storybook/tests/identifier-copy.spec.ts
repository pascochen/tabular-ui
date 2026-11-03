import { expect, test, type Page } from '@playwright/test';

import { gotoStory } from './helpers';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/**
 * `Button variant="inline"` is `select-auto`, so what it holds stays in a copy:
 * a table's identifier, a tree's node, an expandable log row. These read the
 * clipboard, because the page looks the same either way. Until 2026-11-02 a
 * copied row's figures arrived with nothing saying which row they belonged to.
 *
 * Every selector is scoped to the story root. Storybook's hidden docs skeleton
 * holds a table of its own, and a bare `tbody` finds that one first.
 */
const ROOT = '#storybook-root';
const BODY = `${ROOT} tbody`;
const CLICKABLE = 'product-datatable--clickable-rows';

/** Presses the real shortcut and reads the plain text. */
async function copy(page: Page) {
  await page.evaluate(() => navigator.clipboard.writeText('NOTHING COPIED'));
  await page.keyboard.press('ControlOrMeta+c');
  return page.evaluate(() => navigator.clipboard.readText());
}

const selectAllOf = (page: Page, selector: string) =>
  page.evaluate((s) => {
    const selection = getSelection()!;
    selection.removeAllRanges();
    selection.selectAllChildren(document.querySelector(s)!);
  }, selector);

const selected = (page: Page) => page.evaluate(() => getSelection()!.toString());

/** The story's play function ends on this, and a click in it would clear a selection. */
async function gotoClickableRows(page: Page) {
  await gotoStory(page, CLICKABLE);
  await expect(page.locator(`${ROOT} [role=status]`)).toHaveText('Opened stg_sap_bkpf_2');
}

const cellText = (page: Page) =>
  page.evaluate(
    (body) =>
      [...document.querySelector(body)!.querySelectorAll('tr')].map((tr) =>
        [...tr.cells].map((td) => td.textContent ?? ''),
      ),
    BODY,
  );

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

test.describe('DataTable — an identifier in a copied row', () => {
  test('every row keeps its name, on one line', async ({ page }) => {
    await gotoClickableRows(page);
    const rows = await cellText(page);
    await selectAllOf(page, BODY);
    expectRows(await copy(page), rows);
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

    expectRows(await copy(page), rows);
  });

  test('a name cut off on screen copies whole, and still draws its ellipsis', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 800 });
    await gotoClickableRows(page);
    const button = page.locator(BODY).getByRole('button', { name: 'int_fx_rates_daily_3' });
    const box = await button.evaluate((el) => ({
      overflows: el.scrollWidth > el.clientWidth,
      textOverflow: getComputedStyle(el).textOverflow,
    }));
    expect(box).toEqual({ overflows: true, textOverflow: 'ellipsis' });

    await selectAllOf(page, BODY);
    expect(await copy(page)).toContain('int_fx_rates_daily_3\t');
  });

  test('sort headers stay out of a copy', async ({ page }) => {
    await gotoClickableRows(page);
    const rows = await cellText(page);
    await selectAllOf(page, `${ROOT} table`);
    const copied = await copy(page);
    expect(copied).not.toMatch(/model|status|duration|variance|owner/i);
    expectRows(copied.trimStart(), rows);
  });
});

test('an identifier is still a button, to the pointer and the keyboard', async ({ page }) => {
  await gotoClickableRows(page);
  const status = page.locator(`${ROOT} [role=status]`);
  const identifier = (name: string) => page.locator(BODY).getByRole('button', { name });

  const clicked = identifier('fct_ap_aging_4');
  await clicked.click();
  await expect(status).toHaveText('Opened fct_ap_aging_4');
  await expect(clicked).toBeFocused();
  expect(await clicked.evaluate((el) => el.matches(':focus-visible')), 'no ring on a mouse click').toBe(false);

  // A drag or a double-click on it selects nothing, as they did under `select-none`.
  const box = (await clicked.boundingBox())!;
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  expect(await selected(page)).toBe('');
  await page.mouse.dblclick(box.x + 6, box.y + box.height / 2);
  expect(await selected(page)).toBe('');

  const entered = identifier('dim_accounts_1');
  await entered.focus();
  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Opened dim_accounts_1');
  await expect(entered, 'an open leaves focus where it was').toBeFocused();

  const spaced = identifier('int_accounts_7');
  await spaced.focus();
  await page.keyboard.press('Space');
  await expect(status).toHaveText('Opened int_accounts_7');
  await expect(spaced).toBeFocused();
});

test('LineageTree copies every node’s name, in order', async ({ page }) => {
  await gotoStory(page, 'product-lineagetree--default');
  const tree = `${ROOT} [data-slot="lineage-tree"]`;
  const names = await page.locator(`${tree} .font-mono`).allTextContents();
  expect(names.length, 'the story must show nodes, or this checks nothing').toBeGreaterThan(1);

  await selectAllOf(page, tree);
  const copied = await copy(page);
  const at = names.map((name) => copied.indexOf(name));
  expect(at, copied).not.toContain(-1);
  expect(at).toEqual([...at].sort((a, b) => a - b));
});

test('RunLogRow: an expandable row stays in the log, above its own error', async ({ page }) => {
  await gotoStory(page, 'product-runlogrow--with-detail');
  await expect(page.getByText('Database Error in model dim_accounts')).toBeVisible();
  await selectAllOf(page, ROOT);
  expect(await copy(page)).toMatch(/14:21:09\s+failed\s+dim_accounts\s+0\.9s\s+Database Error in model dim_accounts/);
});

test('a link identifier copies, as AttachmentRow’s filename does', async ({ page }) => {
  await gotoStory(page, 'product-attachmentrow--default');
  const name = await page.locator(`${ROOT} a`).first().textContent();
  expect(name).toBeTruthy();
  await selectAllOf(page, ROOT);
  expect(await copy(page)).toContain(name!);
});

test.describe('a disclosure’s label is not content', () => {
  for (const [id, label] of [
    ['product-agentreasoning--done', 'Thought for'],
    ['product-channelmessage--with-replies', 'replies'],
    ['product-tool--done', 'Read supplier_invoices_fy2026_h1.csv'],
  ]) {
    test(`${id} leaves "${label}" out of a copy`, async ({ page }) => {
      await gotoStory(page, id);
      const toggle = page.locator(ROOT).getByRole('button', { name: new RegExp(label) });
      await expect(toggle, 'the story must show the label, or this checks nothing').toBeVisible();
      await selectAllOf(page, ROOT);
      expect(await copy(page)).not.toContain(label);
    });
  }
});
