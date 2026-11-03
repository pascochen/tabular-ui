import { expect, test, type Page } from '@playwright/test';

import { copy, gotoStory } from './helpers';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/**
 * `Button variant="inline"` is `select-auto`, so what it holds stays in a copy,
 * and a label that isn't data passes `select-none` (§4). These read the clipboard,
 * because the page looks the same either way. `data-table-copy.spec.ts` covers a
 * table's identifiers.
 */
const ROOT = '#storybook-root';

const copyAllOf = async (page: Page, selector: string) => {
  await page.evaluate((s) => {
    const selection = getSelection()!;
    selection.removeAllRanges();
    selection.selectAllChildren(document.querySelector(s)!);
  }, selector);
  return (await copy(page))['text/plain'];
};

test('LineageTree copies every node’s name, in order', async ({ page }) => {
  await gotoStory(page, 'product-lineagetree--default');
  const tree = `${ROOT} [data-slot="lineage-tree"]`;
  const names = await page.locator(`${tree} .font-mono`).allTextContents();
  expect(names.length, 'the story must show nodes, or this checks nothing').toBeGreaterThan(1);

  const copied = await copyAllOf(page, tree);
  const at = names.map((name) => copied.indexOf(name));
  expect(at, copied).not.toContain(-1);
  expect(at).toEqual([...at].sort((a, b) => a - b));
});

test('RunLogRow: an expandable row stays in the log, above its own error', async ({ page }) => {
  await gotoStory(page, 'product-runlogrow--with-detail');
  await expect(page.getByText('Database Error in model dim_accounts')).toBeVisible();
  expect(await copyAllOf(page, ROOT)).toMatch(
    /14:21:09\s+failed\s+dim_accounts\s+0\.9s\s+Database Error in model dim_accounts/,
  );
});

test('a link identifier copies, as AttachmentRow’s filename does', async ({ page }) => {
  await gotoStory(page, 'product-attachmentrow--default');
  const name = await page.locator(`${ROOT} a`).first().textContent();
  expect(name).toBeTruthy();
  expect(await copyAllOf(page, ROOT)).toContain(name!);
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
      expect(await copyAllOf(page, ROOT)).not.toContain(label);
    });
  }
});
