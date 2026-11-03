import { expect, test, type Page } from '@playwright/test';

import { gotoStory, tabTo } from './helpers';

declare global {
  interface Window {
    lastClick?: { target: string; selection: string };
  }
}

/**
 * Selecting text in a clickable row doesn't open it, and everything else that
 * reaches the row still does, once. Filenames, GL references and model names are
 * copied constantly, and a row that navigates would take the page away first.
 *
 * Real pointer events throughout: only a real press makes a selection, and the
 * browser decides who gets the click. Each gesture also records the selection as
 * its click arrives, because that is what the guard reads, and it is often not
 * what is left afterwards: Chromium clears a selection after the click.
 *
 * Every selector is scoped to the story root. Storybook's hidden docs skeleton
 * holds a table of its own.
 */
const ROOT = '#storybook-root';
const COLUMN = { model: 0, status: 1, rows: 2, owner: 5 };
/** The story's play function opens three rows before a test starts. */
const OPENS_IN_PLAY = 3;

const status = (page: Page) => page.locator(ROOT).getByRole('status');
const opens = async (page: Page) => Number(await status(page).getAttribute('data-opens')) - OPENS_IN_PLAY;

async function setUp(page: Page) {
  await gotoStory(page, 'product-datatable--clickable-rows');
  await expect(status(page)).toHaveAttribute('data-opens', String(OPENS_IN_PLAY));
  await page.evaluate(() => {
    document.addEventListener(
      'click',
      (event) => {
        window.lastClick = { target: (event.target as Element).tagName, selection: getSelection()!.toString() };
      },
      true,
    );
  });
}

/** Where a cell's content sits, and the right edge of its padding. */
const cell = (page: Page, row: number, column: number) =>
  page.evaluate(
    ([root, row, column]) => {
      const td = document.querySelector(`${root} tbody tr[data-row-id="${row}"]`)!.children[column as number];
      const range = document.createRange();
      range.selectNodeContents(td);
      const box = range.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        middle: box.left + box.width / 2,
        y: box.top + box.height / 2,
        edge: td.getBoundingClientRect().right,
      };
    },
    [ROOT, row, column] as const,
  );

/** Presses at `from`, travels to `to`, releases, and returns what the click saw. */
async function press(page: Page, from: number, y: number, to = from, modifier?: 'Shift') {
  await page.evaluate(() => {
    window.lastClick = undefined;
  });
  await page.mouse.move(from, y);
  if (modifier) await page.keyboard.down(modifier);
  await page.mouse.down();
  if (to !== from) await page.mouse.move(to, y, { steps: 8 });
  await page.mouse.up();
  if (modifier) await page.keyboard.up(modifier);
  return page.evaluate(() => window.lastClick);
}

/** Selects a cell's text and checks the drag itself opened nothing. */
async function selectCell(page: Page, row: number, column: number) {
  const box = await cell(page, row, column);
  await press(page, box.left + 1, box.y, box.right - 1);
  expect(await opens(page), 'making the selection').toBe(0);
  return box;
}

test.beforeEach(({ page }) => setUp(page));

test('a plain click opens the row once, on text or on a cell’s padding', async ({ page }) => {
  const owner = await cell(page, 3, COLUMN.owner);

  const onText = await press(page, owner.middle, owner.y);
  expect(onText).toEqual({ target: 'TD', selection: '' });
  expect(await opens(page)).toBe(1);

  await press(page, owner.edge - 3, owner.y);
  expect(await opens(page)).toBe(2);
});

test('a click that wobbles 3px still opens the row, even when it selected a character', async ({ page }) => {
  const owner = await cell(page, 1, COLUMN.owner);
  let presses = 0;
  let selected = 0;
  for (let x = owner.left + 3; x + 3 < owner.right - 3; x += 6) {
    await page.evaluate(() => getSelection()!.removeAllRanges());
    const click = await press(page, x, owner.y, x + 3);
    presses++;
    if (click!.selection) selected++;
    expect(await opens(page), `from ${x}`).toBe(presses);
  }
  expect(selected, 'no wobble selected anything, so this checks nothing').toBeGreaterThan(0);
});

test.describe('a click with an earlier selection on the page opens the row once', () => {
  test('in another row: the press has already cleared it', async ({ page }) => {
    await selectCell(page, 1, COLUMN.owner);
    const owner = await cell(page, 3, COLUMN.owner);
    const click = await press(page, owner.middle, owner.y);
    expect(click!.selection).toBe('');
    expect(await opens(page)).toBe(1);
  });

  test('on the selected text itself: it is still there at the click', async ({ page }) => {
    const owner = await selectCell(page, 3, COLUMN.owner);
    const click = await press(page, owner.middle, owner.y);
    expect(click!.selection).toBe('s.morimoto');
    expect(await opens(page)).toBe(1);
    // Cleared after the click, so reading it afterwards would hide the case.
    expect(await page.evaluate(() => getSelection()!.toString())).toBe('');
  });

  test('after select-all: every click lands on selected text', async ({ page }) => {
    const owner = await cell(page, 3, COLUMN.owner);
    await page.keyboard.press('ControlOrMeta+a');
    const click = await press(page, owner.middle, owner.y);
    expect(click!.selection).toContain('s.morimoto');
    expect(await opens(page)).toBe(1);
  });

  test('on content that opts out of selection: it is never cleared', async ({ page }) => {
    await page.addStyleTag({ content: `${ROOT} tbody td:nth-child(${COLUMN.status + 1}) { user-select: none; }` });
    await selectCell(page, 3, COLUMN.rows);
    const badge = await cell(page, 3, COLUMN.status);
    const click = await press(page, badge.middle, badge.y);
    expect(click!.selection).toBe('338,688');
    expect(await opens(page)).toBe(1);
    expect(await page.evaluate(() => getSelection()!.toString())).toBe('338,688');
  });
});

test.describe('a drag that selects text leaves the row closed', () => {
  test('inside one cell, in either direction', async ({ page }) => {
    const owner = await cell(page, 3, COLUMN.owner);

    const forward = await press(page, owner.left + 2, owner.y, owner.right - 8);
    expect(forward!.target).toBe('TD');
    expect(forward!.selection).not.toBe('');

    const backward = await press(page, owner.right - 2, owner.y, owner.left + 8);
    expect(backward!.target).toBe('TD');
    expect(backward!.selection).not.toBe('');

    expect(await opens(page)).toBe(0);
  });

  test('across cells, where the browser sends the click to the row', async ({ page }) => {
    const rows = await cell(page, 3, COLUMN.rows);
    const owner = await cell(page, 3, COLUMN.owner);
    const click = await press(page, rows.left + 2, rows.y, owner.middle);
    expect(click!.target).toBe('TR');
    expect(click!.selection).toContain('338,688');
    expect(await opens(page)).toBe(0);
    expect(await page.evaluate(() => getSelection()!.toString())).toContain('338,688');
  });

  test('ending on the identifier’s own control, which never gets the click', async ({ page }) => {
    const rows = await cell(page, 3, COLUMN.rows);
    const model = await cell(page, 3, COLUMN.model);
    const click = await press(page, rows.right - 2, rows.y, model.middle);
    expect(click!.target).toBe('TR');
    expect(click!.selection).toContain('338,688');
    expect(await opens(page)).toBe(0);
  });
});

test('a press that stays on the identifier is its own click: it selects nothing and opens once', async ({ page }) => {
  const model = await cell(page, 3, COLUMN.model);
  const click = await press(page, model.left + 4, model.y, model.right - 4);
  expect(click!.selection).toBe('');
  expect(await opens(page)).toBe(1);
});

test('a drag that selects nothing is still a click on the row', async ({ page }) => {
  const owner = await cell(page, 3, COLUMN.owner);
  const click = await press(page, owner.edge - 3, owner.y, owner.edge - 12);
  expect(click).toEqual({ target: 'TD', selection: '' });
  expect(await opens(page)).toBe(1);
});

test('a Shift-click that extends a selection leaves the row closed', async ({ page }) => {
  const owner = await selectCell(page, 3, COLUMN.owner);
  await page.evaluate(() => getSelection()!.collapseToStart());
  const click = await press(page, owner.right - 1, owner.y, undefined, 'Shift');
  expect(click!.selection).toBe('s.morimoto');
  expect(await opens(page)).toBe(0);
});

test.describe('a double or triple click selects text and opens the row only on its first click', () => {
  for (const clickCount of [2, 3]) {
    test(`${clickCount} clicks`, async ({ page }) => {
      const owner = await cell(page, 3, COLUMN.owner);
      await page.mouse.click(owner.middle, owner.y, { clickCount });
      expect(await page.evaluate(() => getSelection()!.toString())).toContain('morimoto');
      expect(await opens(page)).toBe(1);
    });
  }
});

test.describe('the keyboard path through the identifier', () => {
  const identifier = (page: Page, name: string) => page.locator(ROOT).getByRole('button', { name });

  test('Enter and Space each open the row once', async ({ page }) => {
    expect(await tabTo(page, identifier(page, 'fct_gl_entries_0'))).toBe(true);
    await page.keyboard.press('Enter');
    await expect(status(page)).toHaveText('Opened fct_gl_entries_0');
    expect(await opens(page)).toBe(1);

    expect(await tabTo(page, identifier(page, 'dim_accounts_1'))).toBe(true);
    await page.keyboard.press('Space');
    await expect(status(page)).toHaveText('Opened dim_accounts_1');
    expect(await opens(page)).toBe(2);
  });

  test('a selection elsewhere on the page changes nothing', async ({ page }) => {
    await selectCell(page, 3, COLUMN.owner);
    expect(await tabTo(page, identifier(page, 'fct_ap_aging_4'))).toBe(true);
    await page.keyboard.press('Enter');
    await expect(status(page)).toHaveText('Opened fct_ap_aging_4');
    expect(await opens(page)).toBe(1);
  });
});
